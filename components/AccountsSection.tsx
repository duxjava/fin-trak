'use client';

import { useState, useEffect } from 'react';
import { accounts, transactions, transfers } from '@/lib/schema';
import { getCurrencies } from '@/actions/currency-actions';
import DeleteAccountButton from '@/components/DeleteAccountButton';
import CreateAccountModal from '@/components/CreateAccountModal';
import EditAccountModal from '@/components/EditAccountModal';

type Account = typeof accounts.$inferSelect;
type Transaction = typeof transactions.$inferSelect;
type Transfer = typeof transfers.$inferSelect;

interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
}

interface ExchangeRate {
  currency: string;
  rate: number;
}

interface AccountsSectionProps {
  userAccounts: Account[];
  totalBalance: number;
  currentGroupId: string;
  allTransactions: Transaction[];
  allTransfers: Transfer[];
}

export default function AccountsSection({ 
  userAccounts, 
  totalBalance, 
  currentGroupId,
  allTransactions,
  allTransfers
}: AccountsSectionProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [totalBalanceRUB, setTotalBalanceRUB] = useState(0);
  const [ratesLoading, setRatesLoading] = useState(true);

  useEffect(() => {
    const loadCurrencies = async () => {
      try {
        const currenciesList = await getCurrencies();
        setCurrencies(currenciesList);
      } catch (err) {
        console.error('Error loading currencies:', err);
      }
    };

    const loadExchangeRates = async () => {
      try {
        const response = await fetch('/api/exchange-rates');
        if (response.ok) {
          const data = await response.json();
          setExchangeRates(data.rates);
        }
      } catch (err) {
        console.error('Error loading exchange rates:', err);
      } finally {
        setRatesLoading(false);
      }
    };

    loadCurrencies();
    loadExchangeRates();
  }, []);

  const handleEditAccount = (account: Account) => {
    setSelectedAccount(account);
    setIsEditModalOpen(true);
  };

  const handleCreateAccount = () => {
    setIsCreateModalOpen(true);
  };

  const handleModalSuccess = () => {
    // Перезагружаем страницу для обновления данных
    window.location.reload();
  };

  // Функция для получения символа валюты
  const getCurrencySymbol = (currencyId: number) => {
    const currency = currencies.find(c => c.id === currencyId);
    return currency?.symbol || '$';
  };

  // Функция для конвертации валюты в RUB
  const convertToRUB = (amount: number, currencyCode: string): number => {
    if (currencyCode === 'RUB') return amount;
    
    const rate = exchangeRates.find(r => r.currency === currencyCode);
    if (!rate) return amount; // Если курс не найден, возвращаем исходную сумму
    
    // Курс хранится как "сколько рублей за единицу валюты"
    // Поэтому умножаем сумму на курс
    return amount * rate.rate;
  };

  // Функция для получения кода валюты по ID
  const getCurrencyCode = (currencyId: number): string => {
    const currency = currencies.find(c => c.id === currencyId);
    return currency?.code || 'USD';
  };

  // Расчет общего баланса в RUB (только доходы минус расходы, без трансферов)
  useEffect(() => {
    if (exchangeRates.length > 0 && currencies.length > 0) {
      // Рассчитываем баланс по валютам отдельно (только доходы и расходы)
      const balanceByCurrency = allTransactions.reduce((acc, transaction) => {
        const account = userAccounts.find(a => a.id === transaction.accountId);
        if (!account) return acc;
        
        const currencyCode = getCurrencyCode(account.currencyId);
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
          case 'transfer':
            // Трансферы не влияют на общий баланс
            break;
        }
        
        return acc;
      }, {} as Record<string, { income: number; expense: number }>);

      // Конвертируем все валюты в RUB и суммируем
      let totalRUB = 0;
      Object.entries(balanceByCurrency).forEach(([currencyCode, balance]) => {
        const netBalance = balance.income - balance.expense;
        const balanceRUB = convertToRUB(netBalance, currencyCode);
        totalRUB += balanceRUB;
      });
      
      setTotalBalanceRUB(totalRUB);
    }
  }, [exchangeRates, currencies, userAccounts, allTransactions]);

  // Функция для расчета текущего баланса счета
  const calculateAccountBalance = (accountId: number) => {
    const account = userAccounts.find(acc => acc.id === accountId);
    const initialBalance = Number(account?.balance || '0');
    
    // Получаем все транзакции, которые влияют на этот счет
    const accountTransactions = allTransactions.filter(t => t.accountId === accountId);
    
    // Получаем переводы, где этот счет является отправителем или получателем
    const outgoingTransfers = allTransfers.filter(t => t.fromAccountId === accountId);
    const incomingTransfers = allTransfers.filter(t => t.toAccountId === accountId);
    
    // Рассчитываем изменения баланса
    let balanceChange = 0;
    let incomeTotal = 0;
    let expenseTotal = 0;
    let outgoingTransferTotal = 0;
    let incomingTransferTotal = 0;
    
    // Обрабатываем транзакции по счету (только expense и income)
    accountTransactions.forEach(transaction => {
      const amount = Number(transaction.amount);
      
      switch (transaction.type) {
        case 'expense':
          balanceChange -= amount; // Расходы уменьшают баланс
          expenseTotal += amount;
          break;
        case 'income':
          balanceChange += amount; // Доходы увеличивают баланс
          incomeTotal += amount;
          break;
      }
    });
    
    // Обрабатываем исходящие переводы
    outgoingTransfers.forEach(transfer => {
      const amount = Number(transfer.fromAmount);
      balanceChange -= amount;
      outgoingTransferTotal += amount;
    });
    
    // Обрабатываем входящие переводы
    incomingTransfers.forEach(transfer => {
      const amount = Number(transfer.toAmount);
      balanceChange += amount;
      incomingTransferTotal += amount;
    });
    
    return initialBalance + balanceChange;
  };

  return (
    <div className="mb-4">
      <div className="shadow-xl rounded-2xl border border-gray-200 bg-white overflow-visible">
        <div className="px-4 py-4 sm:p-6">
          <div className="flex items-center py-2">
        {/* Total Balance */}
                        <div className="flex-shrink-0 bg-white border-2 border-indigo-200 rounded-lg p-3 mr-3 min-w-[150px] shadow-sm">
                          <p className="text-xs text-gray-600 mb-1 font-medium">Общий баланс</p>
                          <p className="text-lg font-bold text-indigo-600 mb-1">
                            {ratesLoading ? (
                              <span className="text-sm text-gray-500">Загрузка курсов...</span>
                            ) : (
                              `${totalBalanceRUB.toLocaleString('ru-RU', {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0
                              })} ₽`
                            )}
                          </p>
                          <p className="text-xs text-gray-500">
                            По {userAccounts.length} счет{userAccounts.length === 1 ? 'у' : userAccounts.length < 5 ? 'ам' : 'ам'}
                          </p>
                        </div>

        {/* Horizontal Scrollable Accounts */}
        <div className="flex-1 overflow-x-auto overflow-y-visible">
          <div className="flex space-x-2 pb-1 pt-4">
            {userAccounts.length > 0 ? (
              userAccounts
                .sort((a, b) => {
                  // Сначала сортируем по сумме счета (по убыванию)
                  const balanceA = calculateAccountBalance(a.id);
                  const balanceB = calculateAccountBalance(b.id);
                  
                  if (balanceA !== balanceB) {
                    return balanceB - balanceA; // По убыванию суммы
                  }
                  
                  // Если суммы равны, сортируем по имени
                  return a.name.localeCompare(b.name, 'ru');
                })
                .map((account) => {
                const currentBalance = calculateAccountBalance(account.id);
                
                // Форматируем сумму с разделителями
                const formatAmount = (amount: number) => {
                  return amount.toLocaleString('ru-RU', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  });
                };
                
                return (
                  <div key={account.id} className="flex-shrink-0 relative group">
                    <button
                      onClick={() => handleEditAccount(account)}
                      className="flex flex-col justify-between p-2 bg-white border-2 border-gray-200 rounded-md hover:bg-white hover:border-indigo-300 hover:shadow-md transition-all duration-200 cursor-pointer w-[120px] h-[80px] shadow-sm"
                      title="Нажмите для редактирования счета"
                    >
                      <h4 className="font-medium text-gray-900 text-xs leading-tight text-center flex-1 flex items-center justify-center">
                        {account.name}
                      </h4>
                      <span 
                        className={`text-xs font-bold ${currentBalance >= 0 ? 'text-green-600' : 'text-red-600'} text-center truncate`}
                        title={`${currentBalance >= 0 ? '+' : ''}${getCurrencySymbol(account.currencyId)}${formatAmount(currentBalance)}`}
                      >
                        {currentBalance >= 0 ? '+' : ''}{getCurrencySymbol(account.currencyId)}{formatAmount(currentBalance)}
                      </span>
                    </button>
                    <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DeleteAccountButton accountId={account.id} />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex items-center justify-center p-2 bg-white border-2 border-dashed border-gray-300 rounded-md w-[120px] h-[80px] shadow-sm">
                <div className="text-center">
                  <p className="text-gray-500 text-xs mb-1 font-medium">Нет счетов</p>
                  <button
                    onClick={handleCreateAccount}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded text-xs font-medium"
                  >
                    Создать счет
                  </button>
                </div>
              </div>
            )}
            
            {/* Add Account Button */}
          </div>
        </div>

        {/* Account Management Controls */}
        <div className="flex-shrink-0 ml-3 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-2 shadow-sm">
          <div className="flex flex-col space-y-2">
            <button
              onClick={handleCreateAccount}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap text-center shadow-sm"
            >
              + Новый счет
            </button>
            <button
              className="bg-white hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap border border-gray-300 shadow-sm"
              onClick={() => {
                // TODO: Implement archive functionality
                alert('Функция архивирования счетов будет добавлена позже');
              }}
            >
              📁 Архивные
            </button>
          </div>
        </div>
          </div>
        </div>
      </div>

      {/* Модальные окна */}
      <CreateAccountModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        groupId={currentGroupId}
        onSuccess={handleModalSuccess}
      />

      <EditAccountModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        account={selectedAccount}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
