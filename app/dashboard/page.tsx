import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { groups, groupMembers, transactions, users } from '@/lib/schema';
import { eq, and, desc } from 'drizzle-orm';
import Link from 'next/link';
import { signOut } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  // Получаем группы пользователя
  const userGroups = await db.query.groupMembers.findMany({
    where: eq(groupMembers.userId, session.user.id),
  });

  // Получаем информацию о группах
  const groupIds = userGroups.map(ug => ug.groupId);
  const groupsInfo = groupIds.length > 0 ? await db.query.groups.findMany({
    where: eq(groups.id, groupIds[0]), // Пока берем первую группу
  }) : [];

  // Получаем транзакции для всех групп пользователя
  const recentTransactions = groupIds.length > 0 ? await db.query.transactions.findMany({
    where: eq(transactions.groupId, groupIds[0]), // Пока берем первую группу
    orderBy: [desc(transactions.createdAt)],
    limit: 10,
  }) : [];

  // Получаем информацию о пользователях для транзакций
  const transactionUserIds = recentTransactions.map(t => t.userId);
  const transactionUsers = transactionUserIds.length > 0 ? await db.query.users.findMany({
    where: eq(users.id, transactionUserIds[0]), // Упрощаем для демо
  }) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">FinTrak</h1>
              <p className="text-gray-600">Welcome, {session.user.name}!</p>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <Link
                href="/transactions/add"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md whitespace-nowrap text-center"
              >
                Add Transaction
              </Link>
              <form action={async () => {
                'use server';
                await signOut();
              }}>
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md whitespace-nowrap w-full sm:w-auto"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>

          {/* Groups Section */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 space-y-4 sm:space-y-0">
                <h3 className="text-lg font-medium text-gray-900">
                  Your Groups
                </h3>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <Link
                    href="/groups/create"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm whitespace-nowrap text-center"
                  >
                    Create Group
                  </Link>
                  <Link
                    href="/groups/join"
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm whitespace-nowrap text-center"
                  >
                    Join Group
                  </Link>
                </div>
              </div>
              
              {userGroups.length > 0 ? (
                <div className="space-y-2">
                  {userGroups.map((userGroup) => {
                    const groupInfo = groupsInfo.find(g => g.id === userGroup.groupId);
                    return (
                      <div key={userGroup.groupId} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                        <div>
                          <h4 className="font-medium text-gray-900">{groupInfo?.name || 'Unknown Group'}</h4>
                          <p className="text-sm text-gray-500">Group ID: {userGroup.groupId}</p>
                        </div>
                        <span className="text-sm text-gray-500">
                          {userGroup.role}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">You're not in any groups yet.</p>
                  <p className="text-sm text-gray-400">Create a group or join an existing one to start tracking finances.</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Recent Transactions
              </h3>
              
              {recentTransactions.length > 0 ? (
                <div className="space-y-3">
                  {recentTransactions.map((transaction) => {
                    const user = transactionUsers.find(u => u.id === transaction.userId);
                    return (
                      <div key={transaction.id} className="flex justify-between items-center p-3 border rounded-md">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{transaction.description}</h4>
                          <p className="text-sm text-gray-500">
                            {user?.name || 'Unknown User'} • {transaction.category} • {new Date(transaction.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`font-medium ${Number(transaction.amount) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {Number(transaction.amount) >= 0 ? '+' : ''}${Number(transaction.amount).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No transactions yet.</p>
                  <Link
                    href="/transactions/add"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
                  >
                    Add First Transaction
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
