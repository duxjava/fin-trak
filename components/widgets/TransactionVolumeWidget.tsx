'use client';

interface Transaction {
  id: number;
  type: string;
  amount: string;
  date: Date | string;
  account: {
    currency: {
      id: number;
      code: string;
      name: string;
      symbol: string;
    };
  };
}

interface TransactionVolumeWidgetProps {
  transactions: Transaction[];
  exchangeRates: any[];
  ratesLoading: boolean;
}

export default function TransactionVolumeWidget({ transactions, exchangeRates, ratesLoading }: TransactionVolumeWidgetProps) {
  
  // Конвертируем в RUB для отображения
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

  // Подсчитываем доходы и расходы с конвертацией валют
  const incomeRUB = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => {
      const amount = Number(t.amount);
      const currencyCode = t.account.currency.code;
      const amountRUB = convertToRUB(amount, currencyCode);
      
      return sum + amountRUB;
    }, 0);

  const expensesRUB = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => {
      const amount = Number(t.amount);
      const currencyCode = t.account.currency.code;
      const amountRUB = convertToRUB(amount, currencyCode);
      
      return sum + amountRUB;
    }, 0);

  const netIncomeRUB = incomeRUB - expensesRUB;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Объем транзакций
      </h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Доходы</span>
          </div>
          <span className="font-semibold text-green-600">
            {ratesLoading ? '...' : `+${incomeRUB.toLocaleString('ru-RU', { 
              minimumFractionDigits: 0, 
              maximumFractionDigits: 0 
            })} ₽`}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Расходы</span>
          </div>
          <span className="font-semibold text-red-600">
            {ratesLoading ? '...' : `-${expensesRUB.toLocaleString('ru-RU', { 
              minimumFractionDigits: 0, 
              maximumFractionDigits: 0 
            })} ₽`}
          </span>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900">Чистый доход</span>
            <span className={`font-bold text-lg ${
              netIncomeRUB >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {ratesLoading ? '...' : `${netIncomeRUB >= 0 ? '+' : ''}${netIncomeRUB.toLocaleString('ru-RU', { 
                minimumFractionDigits: 0, 
                maximumFractionDigits: 0 
              })} ₽`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
