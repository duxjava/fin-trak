import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { groupMembers } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import AddTransactionForm from '@/components/AddTransactionForm';

export const dynamic = 'force-dynamic';

export default async function AddTransactionPage() {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              Add Transaction
            </h1>
                <AddTransactionForm groupId={userGroups[0].groupId} />
          </div>
        </div>
      </div>
    </div>
  );
}
