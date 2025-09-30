import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, accounts, groupMembers } from '@/lib/schema';
import { eq, desc, inArray, and, or, sql } from 'drizzle-orm';
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

    // Получаем операции с пагинацией из материализованного представления
    let whereClause = `WHERE group_id = '${groupId}'`;
    
    // Добавляем фильтр по счетам, если указаны
    if (accountIds.length > 0) {
      const accountIdsStr = accountIds.join(',');
      whereClause += ` AND (primary_account_id IN (${accountIdsStr}) OR secondary_account_id IN (${accountIdsStr}))`;
    }
    
    const operationsData = await db.execute(sql`
      SELECT * FROM operations_view 
      ${sql.raw(whereClause)}
      ORDER BY sort_date DESC, sort_created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `);
    
    // Преобразуем данные в нужный формат
    const formattedOperations = operationsData.map((op: any) => ({
      operation_type: op.operation_type,
      operation_id: op.operation_id,
      amount: op.amount,
      description: op.description,
      category: op.category,
      type: op.type,
      date: op.date,
      user_id: op.user_id,
      primary_account_id: op.primary_account_id,
      secondary_account_id: op.secondary_account_id,
      secondary_amount: op.secondary_amount,
      created_at: op.created_at,
    }));
    
    const operations = { rows: formattedOperations };

    // Получаем общее количество операций с учетом фильтрации
    const totalCountResult = await db.execute(sql`
      SELECT COUNT(*) as count FROM operations_view 
      ${sql.raw(whereClause)}
    `);
    
    const totalCount = Number(totalCountResult[0]?.count) || 0;

    // Получаем информацию о пользователях
    const operationUserIds = [...new Set(((operations as any).rows || []).map((op: any) => op.user_id))] as string[];
    const operationUsers = operationUserIds.length > 0 ? await db.query.users.findMany({
      where: inArray(users.id, operationUserIds),
    }) : [];

    // Получаем счета с валютами
    const userAccounts = await db.query.accounts.findMany({
      where: eq(accounts.groupId, groupId),
      with: {
        currency: true,
      },
    });

    const hasMore = offset + limit < Number(totalCount);

    return NextResponse.json({
      operations: (operations as any).rows || [],
      users: operationUsers,
      accounts: userAccounts,
      pagination: {
        page,
        limit,
        total: totalCount,
        hasMore,
        totalPages: Math.ceil(Number(totalCount) / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching operations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
