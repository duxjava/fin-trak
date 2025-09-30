import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { transactions, users, accounts, groupMembers } from '@/lib/schema';
import { eq, desc, inArray, and, or } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;
    const accountIdsParam = searchParams.get('accountIds');
    const accountIds = accountIdsParam ? accountIdsParam.split(',').map(id => parseInt(id)).filter(id => !isNaN(id)) : [];

    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    // Проверяем, что пользователь является участником группы
    const userGroup = await db.query.groupMembers.findFirst({
      where: eq(groupMembers.userId, session.user.id),
      with: {
        group: true,
      },
    });

    if (!userGroup || userGroup.groupId !== groupId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Строим условия для фильтрации
    const whereConditions = [eq(transactions.groupId, groupId)];
    
    // Добавляем фильтр по счетам, если указаны
    if (accountIds.length > 0) {
      whereConditions.push(inArray(transactions.accountId, accountIds));
    }

    // Получаем транзакции с пагинацией и фильтрацией
    const paginatedTransactions = await db.query.transactions.findMany({
      where: whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions),
      orderBy: [desc(transactions.date)],
      limit,
      offset,
    });

    // Получаем общее количество транзакций с учетом фильтрации
    const totalTransactions = await db.query.transactions.findMany({
      where: whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions),
    });

    // Получаем информацию о пользователях
    const transactionUserIds = [...new Set(paginatedTransactions.map(t => t.userId))];
    const transactionUsers = transactionUserIds.length > 0 ? await db.query.users.findMany({
      where: inArray(users.id, transactionUserIds),
    }) : [];

    // Получаем счета с валютами
    const userAccounts = await db.query.accounts.findMany({
      where: eq(accounts.groupId, groupId),
      with: {
        currency: true,
      },
    });

    const hasMore = offset + limit < totalTransactions.length;

    return NextResponse.json({
      transactions: paginatedTransactions,
      users: transactionUsers,
      accounts: userAccounts,
      pagination: {
        page,
        limit,
        total: totalTransactions.length,
        hasMore,
        totalPages: Math.ceil(totalTransactions.length / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
