import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { groups, groupMembers, accounts, transactions } from '@/lib/schema';
import { eq, and, desc } from 'drizzle-orm';
import StatisticsDashboard from '@/components/StatisticsDashboard';
import Navigation from '@/components/Navigation';

export const dynamic = 'force-dynamic';

interface StatisticsPageProps {
  searchParams: {
    groupId?: string;
  };
}

export default async function StatisticsPage({ searchParams }: StatisticsPageProps) {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  // Получаем группы пользователя
  const userGroups = await db.query.groupMembers.findMany({
    where: eq(groupMembers.userId, session.user.id),
    with: {
      group: true,
    },
  });

  if (userGroups.length === 0) {
    redirect('/dashboard');
  }

  // Определяем текущую группу
  let currentGroupId = searchParams.groupId;
  if (!currentGroupId) {
    const defaultGroup = userGroups.find(gm => gm.group.isDefault === 'true')?.group;
    currentGroupId = defaultGroup?.id || userGroups[0]?.groupId || '';
  }

  // Получаем счета с валютами
  const userAccounts = await db.query.accounts.findMany({
    where: eq(accounts.groupId, currentGroupId),
    with: {
      currency: true,
    },
  });

  // Получаем все транзакции для статистики
  const userTransactions = await db.query.transactions.findMany({
    where: eq(transactions.groupId, currentGroupId),
    with: {
      account: {
        with: {
          currency: true,
        },
      },
    },
    orderBy: [desc(transactions.date)],
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation 
        currentGroupId={currentGroupId}
        groups={userGroups.map(gm => ({
          id: gm.group.id,
          name: gm.group.name,
          isDefault: gm.group.isDefault,
          role: gm.role,
        }))}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Статистика</h1>
            <p className="mt-2 text-gray-600">
              Анализ ваших финансовых данных и трендов
            </p>
          </div>
        </div>

        {/* Statistics Dashboard */}
        <StatisticsDashboard 
          accounts={userAccounts}
          transactions={userTransactions as any}
          groupId={currentGroupId}
        />
      </div>
    </div>
  );
}
