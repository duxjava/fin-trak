'use client';

interface Account {
  id: number;
  name: string;
  balance: string;
  currency: {
    id: number;
    code: string;
    name: string;
    symbol: string;
  };
}

interface Transaction {
  id: number;
  type: 'expense' | 'income';
  amount: string;
  accountId: number;
}

interface AccountBalanceChartProps {
  accounts: Account[];
  transactions: Transaction[];
  exchangeRates: any[];
  ratesLoading: boolean;
}

export default function AccountBalanceChart({ accounts, transactions, exchangeRates, ratesLoading }: AccountBalanceChartProps) {
  // Рассчитываем текущий баланс для каждого счета
  const calculateAccountBalance = (accountId: number) => {
    const account = accounts.find(acc => acc.id === accountId);
    if (!account) return 0;
    
    const initialBalance = Number(account.balance);
    
    // Получаем все транзакции, которые влияют на этот счет
    const accountTransactions = transactions.filter(t => t.accountId === accountId);
    
    // Рассчитываем изменения баланса
    let balanceChange = 0;
    
    // Обрабатываем транзакции по счету (только expense и income)
    accountTransactions.forEach(transaction => {
      const amount = Number(transaction.amount);
      
      switch (transaction.type) {
        case 'expense':
          balanceChange -= amount;
          break;
        case 'income':
          balanceChange += amount;
          break;
      }
    });
    
    return initialBalance + balanceChange;
  };

  // Конвертируем в RUB для сравнения
  const convertToRUB = (amount: number, currencyCode: string) => {
    if (ratesLoading || !exchangeRates.length) return amount;
    
    // Если валюта уже RUB, возвращаем как есть
    if (currencyCode === 'RUB') return amount;
    
    const rate = exchangeRates.find(r => r.currency === currencyCode);
    if (!rate) {
      console.warn(`Exchange rate not found for currency: ${currencyCode}`);
      return amount;
    }
    
    // Курс хранится как "сколько рублей за единицу валюты"
    // Поэтому умножаем сумму на курс
    return amount * rate.rate;
  };

  const accountBalances = accounts.map(account => {
    const balance = calculateAccountBalance(account.id);
    const balanceRUB = convertToRUB(balance, account.currency.code);
    
    return {
      ...account,
      currentBalance: balance,
      currentBalanceRUB: balanceRUB
    };
  }).sort((a, b) => b.currentBalanceRUB - a.currentBalanceRUB);

  const maxBalance = Math.max(...accountBalances.map(acc => acc.currentBalanceRUB));
  const minBalance = Math.min(...accountBalances.map(acc => acc.currentBalanceRUB));
  const range = maxBalance - minBalance;

  return (
    <div className="h-64">
      {ratesLoading ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          Загрузка курсов...
        </div>
      ) : accountBalances.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          Нет счетов
        </div>
      ) : (
        <div className="h-full flex items-end space-x-2">
          {accountBalances.slice(0, 8).map((account) => {
            const height = range > 0 ? ((account.currentBalanceRUB - minBalance) / range) * 100 : 50;
            const isPositive = account.currentBalanceRUB >= 0;
            
            return (
              <div key={account.id} className="flex-1 flex flex-col items-center space-y-1">
                <div className="w-full flex flex-col justify-end h-48">
                  <div 
                    className={`rounded-t ${isPositive ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ height: `${Math.max(height, 5)}%` }}
                    title={`${account.name}: ${account.currentBalanceRUB.toLocaleString('ru-RU')} ₽`}
                  ></div>
                </div>
                
                {/* Название счета */}
                <div className="text-xs text-gray-500 text-center max-w-full truncate">
                  {account.name}
                </div>
                
                {/* Баланс */}
                <div className={`text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {account.currentBalanceRUB.toLocaleString('ru-RU', { 
                    minimumFractionDigits: 0, 
                    maximumFractionDigits: 0 
                  })} ₽
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Легенда */}
      <div className="flex items-center justify-center space-x-4 mt-4">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span className="text-sm text-gray-600">Положительный баланс</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span className="text-sm text-gray-600">Отрицательный баланс</span>
        </div>
      </div>
    </div>
  );
}
