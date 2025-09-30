import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { transactions, transfers, users, accounts, groups, groupMembers } from '@/lib/schema';
import { eq, desc, and } from 'drizzle-orm';
import DeleteTransactionButton from '@/components/DeleteTransactionButton';
import AccountsSection from '@/components/AccountsSection';
import TransactionsSection from '@/components/TransactionsSection';
import Navigation from '@/components/Navigation';

export const dynamic = 'force-dynamic';

interface DashboardPageProps {
  searchParams: {
    group?: string;
  };
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
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

  // Определяем текущую группу
  let currentGroupId = '';
  if (searchParams.group) {
    // Проверяем, что пользователь является участником запрошенной группы
    const requestedGroup = userGroups.find(gm => gm.groupId === searchParams.group);
    if (requestedGroup) {
      currentGroupId = searchParams.group;
    }
  }
  
  // Если группа не выбрана или не найдена, используем дефолтную
  if (!currentGroupId) {
    const defaultGroup = userGroups.find(gm => gm.group.isDefault === 'true')?.group;
    currentGroupId = defaultGroup?.id || userGroups[0]?.groupId || '';
  }

  // Получаем все счета из текущей группы
  const userAccounts = await db.query.accounts.findMany({
    where: eq(accounts.groupId, currentGroupId),
    with: {
      currency: true,
    },
  });

  // Получаем транзакции и переводы для расчета баланса счетов
  const allTransactions = await db.query.transactions.findMany({
    where: eq(transactions.groupId, currentGroupId),
  });

  const allTransfers = await db.query.transfers.findMany({
    where: eq(transfers.groupId, currentGroupId),
  });

  // Функция для расчета текущего баланса счета
  const calculateAccountBalance = (accountId: number) => {
    const initialBalance = Number(userAccounts.find(acc => acc.id === accountId)?.balance || '0');
    
    // Получаем все транзакции, которые влияют на этот счет
    const accountTransactions = allTransactions.filter(t => t.accountId === accountId);
    
    // Получаем переводы, где этот счет является отправителем или получателем
    const outgoingTransfers = allTransfers.filter(t => t.fromAccountId === accountId);
    const incomingTransfers = allTransfers.filter(t => t.toAccountId === accountId);
    
    // Рассчитываем изменения баланса
    let balanceChange = 0;
    
    // Обрабатываем транзакции по счету (только expense и income)
    accountTransactions.forEach(transaction => {
      const amount = Number(transaction.amount);
      
      switch (transaction.type) {
        case 'expense':
          balanceChange -= amount; // Расходы уменьшают баланс
          break;
        case 'income':
          balanceChange += amount; // Доходы увеличивают баланс
          break;
      }
    });
    
    // Обрабатываем исходящие переводы
    outgoingTransfers.forEach(transfer => {
      balanceChange -= Number(transfer.fromAmount);
    });
    
    // Обрабатываем входящие переводы
    incomingTransfers.forEach(transfer => {
      balanceChange += Number(transfer.toAmount);
    });
    
    return initialBalance + balanceChange;
  };


  // Рассчитываем общий баланс по валютам отдельно (только доходы и расходы)
  const balanceByCurrency = allTransactions.reduce((acc, transaction) => {
    const account = userAccounts.find(a => a.id === transaction.accountId);
    if (!account) return acc;
    
    const currencyCode = account.currency.code;
    const amount = Number(transaction.amount);
    
    if (!acc[currencyCode]) {
      acc[currencyCode] = { income: 0, expense: 0 };
    }
    
    switch (transaction.type) {
      case 'income':
        acc[currencyCode].income += amount;
        break;
      case 'expense':
        acc[currencyCode].expense += amount;
        break;
    }
    
    return acc;
  }, {} as Record<string, { income: number; expense: number }>);

  // Показываем баланс только в RUB (основная валюта)
  const totalBalance = balanceByCurrency['RUB'] ? 
    balanceByCurrency['RUB'].income - balanceByCurrency['RUB'].expense : 0;

  // Получаем информацию о пользователях для транзакций (для заголовка)
  const transactionUserIds = [...new Set(allTransactions.map(t => t.userId))];
  const transactionUsers = transactionUserIds.length > 0 ? await db.query.users.findMany({
    where: eq(users.id, transactionUserIds[0]), // Пока упрощаем - получаем первого пользователя
  }) : [];

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation 
        currentGroupId={currentGroupId}
        groups={userGroups.map(gm => ({
          id: gm.group.id,
          name: gm.group.name,
          isDefault: gm.group.isDefault,
          role: gm.role,
        }))}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">FinTrak</h1>
            <p className="text-gray-600">Добро пожаловать, {session.user.name}!</p>
          </div>

          {/* Fixed Accounts Section */}
          <AccountsSection 
            userAccounts={userAccounts}
            totalBalance={totalBalance}
            currentGroupId={currentGroupId}
            allTransactions={allTransactions}
            allTransfers={allTransfers}
          />

          {/* Transactions Section */}
          <div className="shadow-xl rounded-2xl border border-gray-200">
            <div className="px-6 py-6 sm:p-8">
              <TransactionsSection 
                groupId={currentGroupId}
                userAccounts={userAccounts}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
