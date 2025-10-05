'use client';

import { useState, useEffect } from 'react';
import DeleteTransactionButton from '@/components/DeleteTransactionButton';
import DeleteTransferButton from '@/components/DeleteTransferButton';
import EditTransactionModal from '@/components/EditTransactionModal';
import EditTransferModal from '@/components/EditTransferModal';

interface Transaction {
  id: number;
  amount: string;
  description: string;
  type: 'expense' | 'income';
  category: string;
  date: string;
  userId: string;
  accountId: number;
}

interface Transfer {
  id: number;
  fromAmount: string;
  toAmount: string;
  description: string;
  date: string;
  userId: string;
  fromAccountId: number;
  toAccountId: number;
}

interface Operation {
  id: string;
  type: 'transaction' | 'transfer';
  date: string;
  description: string;
  userId: string;
  data: Transaction | Transfer;
}

interface User {
  id: string;
  name: string;
}

interface Account {
  id: number;
  name: string;
  type: string;
  balance: string;
  currencyId: number;
  currency: {
    id: number;
    code: string;
    name: string;
    symbol: string;
  };
}

interface OperationsListProps {
  groupId: string;
  selectedAccounts: number[];
  onAddTransaction?: () => void;
}

export default function OperationsList({ groupId, selectedAccounts, onAddTransaction }: OperationsListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [limit, setLimit] = useState(20);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditTransferModalOpen, setIsEditTransferModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);

  const handleEditTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsEditModalOpen(true);
  };

  const handleEditTransfer = (transfer: Transfer) => {
    setSelectedTransfer(transfer);
    setIsEditTransferModalOpen(true);
  };

  const handleModalSuccess = () => {
    // Перезагружаем данные
    loadOperations(1);
  };

  const loadOperations = async (pageNum: number, append = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const accountIdsParam = selectedAccounts.length > 0 ? `&accountIds=${selectedAccounts.join(',')}` : '';
      
      // Загружаем операции из нового API
      const response = await fetch(`/api/operations?groupId=${groupId}&page=${pageNum}&limit=${limit}${accountIdsParam}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch operations');
      }

      const data = await response.json();
      
      // Разделяем операции на транзакции и переводы
      const transactions: Transaction[] = [];
      const transfers: Transfer[] = [];
      
      data.operations.forEach((operation: any) => {
        if (operation.operation_type === 'transaction') {
          transactions.push({
            id: parseInt(operation.operation_id),
            amount: operation.amount,
            description: operation.description,
            type: operation.type as 'expense' | 'income',
            category: operation.category || '',
            date: operation.date,
            userId: operation.user_id,
            accountId: operation.primary_account_id,
          });
        } else if (operation.operation_type === 'transfer') {
          transfers.push({
            id: parseInt(operation.operation_id),
            fromAmount: operation.amount,
            toAmount: operation.secondary_amount,
            description: operation.description,
            date: operation.date,
            userId: operation.user_id,
            fromAccountId: operation.primary_account_id,
            toAccountId: operation.secondary_account_id,
          });
        }
      });
      
      if (append) {
        setTransactions(prev => [...prev, ...transactions]);
        setTransfers(prev => [...prev, ...transfers]);
      } else {
        setTransactions(transactions);
        setTransfers(transfers);
      }
      
      setUsers(data.users || []);
      setAccounts(data.accounts || []);
      setTotalCount(data.pagination?.total || 0);
      setHasMore(data.pagination?.hasMore || false);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadOperations(1);
  }, [groupId, selectedAccounts]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadOperations(nextPage, true);
  };

  const getOperationIcon = (operation: Operation) => {
    if (operation.type === 'transaction') {
      const transaction = operation.data as Transaction;
      switch (transaction.type) {
        case 'expense': return '💸';
        case 'income': return '💰';
        default: return '💰';
      }
    } else {
      return '🔄';
    }
  };
  
  const getOperationLabel = (operation: Operation) => {
    if (operation.type === 'transaction') {
      const transaction = operation.data as Transaction;
      switch (transaction.type) {
        case 'expense': return 'Расход';
        case 'income': return 'Доход';
        default: return 'Транзакция';
      }
    } else {
      return 'Перевод';
    }
  };

  // Объединяем транзакции и переводы в операции
  const operations: Operation[] = [
    ...transactions.map(t => ({
      id: `transaction-${t.id}`,
      type: 'transaction' as const,
      date: t.date,
      description: t.description,
      userId: t.userId,
      data: t
    })),
    ...transfers.map(t => ({
      id: `transfer-${t.id}`,
      type: 'transfer' as const,
      date: t.date,
      description: t.description,
      userId: t.userId,
      data: t
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (loading) {
    return (
      <div className="p-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Загрузка операций...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">Ошибка: {error}</p>
          <button
            onClick={() => loadOperations(1)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  if (operations.length === 0) {
    return (
      <div className="p-4">
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">Пока нет операций.</p>
          <button
            onClick={onAddTransaction}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
          >
            Добавить первую операцию
          </button>
        </div>
      </div>
    );
  }

  // Группируем операции по дням
  const groupedOperations = operations.reduce((groups, operation) => {
    const date = new Date(operation.date);
    const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(operation);
    return groups;
  }, {} as Record<string, Operation[]>);

  // Сортируем дни по убыванию
  const sortedDays = Object.keys(groupedOperations).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <>
      <div className="p-4">
        
        <div className="space-y-4">
          {sortedDays.map((dateKey) => {
            const dayOperations = groupedOperations[dateKey];
            const date = new Date(dateKey);
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            
            const isToday = date.toDateString() === today.toDateString();
            const isYesterday = date.toDateString() === yesterday.toDateString();
            
            let dateLabel;
            if (isToday) {
              dateLabel = 'Сегодня';
            } else if (isYesterday) {
              dateLabel = 'Вчера';
            } else {
              dateLabel = date.toLocaleDateString('ru-RU', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long' 
              });
            }

            return (
              <div key={dateKey} className="space-y-3">
                {/* Заголовок дня */}
                <div className="flex items-center space-x-3">
                  <div className="flex-1 border-t border-gray-200"></div>
                  <div className="px-3 py-1 bg-gray-100 rounded-full">
                    <span className="text-sm font-medium text-gray-700">
                      {dateLabel} ({dayOperations.length})
                    </span>
                  </div>
                  <div className="flex-1 border-t border-gray-200"></div>
                </div>
                
                {/* Операции за день */}
                <div className="space-y-2">
                  {dayOperations.map((operation) => {
                    const user = users.find(u => u.id === operation.userId);
                    
                    if (operation.type === 'transaction') {
                      const transaction = operation.data as Transaction;
                      const account = accounts.find(a => a.id === transaction.accountId);
                      
                      return (
                        <div key={operation.id} className="relative group">
                          <button
                            onClick={() => handleEditTransaction(transaction)}
                            className="w-full flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 border rounded-md hover:bg-gray-50 hover:border-indigo-300 hover:shadow-sm transition-all duration-200 cursor-pointer group/link text-left"
                            title="Нажмите для редактирования транзакции"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-lg flex-shrink-0">{getOperationIcon(operation)}</span>
                                <h4 className="font-medium text-gray-900 truncate">
                                  {transaction.description}
                                </h4>
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded flex-shrink-0">
                                  {getOperationLabel(operation)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500 truncate">
                                {new Date(transaction.date).toLocaleDateString('ru-RU', { 
                                  day: '2-digit', 
                                  month: '2-digit',
                                  year: '2-digit'
                                })} {new Date(transaction.date).toLocaleTimeString('ru-RU', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })} • {user?.name || 'Неизвестный пользователь'} • {transaction.category}
                                {account && ` • ${account.name}`}
                              </p>
                            </div>
                            <div className="flex items-center justify-end sm:justify-start mt-2 sm:mt-0">
                              <span className={`font-medium ${
                                transaction.type === 'expense' ? 'text-red-600' : 
                                transaction.type === 'income' ? 'text-green-600' : 
                                'text-blue-600'
                              }`}>
                                {transaction.type === 'expense' ? '-' : 
                                 transaction.type === 'income' ? '+' : 
                                 ''}{account?.currency?.symbol || '₽'}{Number(transaction.amount).toLocaleString('ru-RU', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                })}
                              </span>
                            </div>
                          </button>
                          <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <DeleteTransactionButton 
                              transactionId={transaction.id} 
                              onSuccess={handleModalSuccess}
                            />
                          </div>
                        </div>
                      );
                    } else {
                      const transfer = operation.data as Transfer;
                      const fromAccount = accounts.find(a => a.id === transfer.fromAccountId);
                      const toAccount = accounts.find(a => a.id === transfer.toAccountId);
                      
                      return (
                        <div key={operation.id} className="relative group">
                          <button
                            onClick={() => handleEditTransfer(transfer)}
                            className="w-full flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 border rounded-md hover:bg-gray-50 hover:border-green-300 hover:shadow-sm transition-all duration-200 cursor-pointer group/link text-left"
                            title="Нажмите для редактирования перевода"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-lg flex-shrink-0">{getOperationIcon(operation)}</span>
                                <h4 className="font-medium text-gray-900 truncate">
                                  {transfer.description}
                                </h4>
                                <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded flex-shrink-0">
                                  {getOperationLabel(operation)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500 truncate">
                                {new Date(transfer.date).toLocaleDateString('ru-RU', { 
                                  day: '2-digit', 
                                  month: '2-digit',
                                  year: '2-digit'
                                })} {new Date(transfer.date).toLocaleTimeString('ru-RU', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })} • {user?.name || 'Неизвестный пользователь'}
                                {fromAccount && toAccount && ` • ${fromAccount.name} → ${toAccount.name}`}
                              </p>
                            </div>
                            <div className="flex items-center justify-end sm:justify-start mt-2 sm:mt-0">
                              <div className="text-right">
                                <div className="text-sm text-red-600 font-medium">
                                  -{fromAccount?.currency?.symbol || '₽'}{Number(transfer.fromAmount).toLocaleString('ru-RU', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                  })}
                                </div>
                                <div className="text-sm text-green-600 font-medium">
                                  +{toAccount?.currency?.symbol || '₽'}{Number(transfer.toAmount).toLocaleString('ru-RU', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                  })}
                                </div>
                              </div>
                            </div>
                          </button>
                          <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <DeleteTransferButton 
                              transferId={transfer.id} 
                              onSuccess={handleModalSuccess}
                            />
                          </div>
                        </div>
                      );
                    }
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Кнопка "Загрузить ещё" */}
        {hasMore && (
          <div className="mt-6 text-center">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingMore ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Загрузка...</span>
                </div>
              ) : (
                'Загрузить ещё'
              )}
            </button>
            <div className="mt-2 text-xs text-gray-500">
              Операции отсортированы по дате (новые сначала)
            </div>
          </div>
        )}
      </div>

      {/* Модальное окно для редактирования транзакции */}
      <EditTransactionModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        transaction={selectedTransaction}
        accounts={accounts}
        onSuccess={handleModalSuccess}
      />

      {/* Модальное окно для редактирования перевода */}
      <EditTransferModal
        isOpen={isEditTransferModalOpen}
        onClose={() => setIsEditTransferModalOpen(false)}
        transfer={selectedTransfer}
        accounts={accounts}
        onSuccess={handleModalSuccess}
      />
    </>
  );
}
