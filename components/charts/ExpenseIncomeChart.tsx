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

interface ExpenseIncomeChartProps {
  transactions: Transaction[];
  exchangeRates: any[];
  ratesLoading: boolean;
}

export default function ExpenseIncomeChart({ transactions, exchangeRates, ratesLoading }: ExpenseIncomeChartProps) {
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

  // Группируем транзакции по дням с конвертацией валют
  const dailyData = transactions.reduce((acc, transaction) => {
    const date = (typeof transaction.date === 'string' ? new Date(transaction.date) : transaction.date).toISOString().split('T')[0];
    const amount = Number(transaction.amount);
    const currencyCode = transaction.account.currency.code;
    const amountRUB = convertToRUB(amount, currencyCode);
    
    if (!acc[date]) {
      acc[date] = { income: 0, expense: 0 };
    }
    
    if (transaction.type === 'income') {
      acc[date].income += amountRUB;
    } else if (transaction.type === 'expense') {
      acc[date].expense += amountRUB;
    }
    
    return acc;
  }, {} as Record<string, { income: number; expense: number }>);

  // Сортируем по дате и берем последние 7 дней
  const sortedDates = Object.keys(dailyData)
    .sort()
    .slice(-7);

  const maxAmount = Math.max(
    ...Object.values(dailyData).flatMap(d => [d.income, d.expense])
  );

  return (
    <div className="h-64">
      {ratesLoading ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          Загрузка данных...
        </div>
      ) : sortedDates.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          Нет данных для отображения
        </div>
      ) : (
        <div className="h-full flex items-end space-x-2">
          {sortedDates.map((date) => {
            const data = dailyData[date];
            const incomeHeight = maxAmount > 0 ? (data.income / maxAmount) * 100 : 0;
            const expenseHeight = maxAmount > 0 ? (data.expense / maxAmount) * 100 : 0;
            
            return (
              <div key={date} className="flex-1 flex flex-col items-center space-y-1">
                <div className="w-full flex flex-col justify-end h-48 space-y-1">
                  {/* Доходы */}
                  <div 
                    className="bg-green-500 rounded-t"
                    style={{ height: `${incomeHeight}%` }}
                    title={`Доходы: ${data.income.toLocaleString('ru-RU')} ₽`}
                  ></div>
                  
                  {/* Расходы */}
                  <div 
                    className="bg-red-500 rounded-b"
                    style={{ height: `${expenseHeight}%` }}
                    title={`Расходы: ${data.expense.toLocaleString('ru-RU')} ₽`}
                  ></div>
                </div>
                
                {/* Дата */}
                <div className="text-xs text-gray-500 text-center">
                  {new Date(date).toLocaleDateString('ru-RU', { 
                    day: '2-digit', 
                    month: '2-digit' 
                  })}
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
          <span className="text-sm text-gray-600">Доходы</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span className="text-sm text-gray-600">Расходы</span>
        </div>
      </div>
    </div>
  );
}
