'use client';

interface Transaction {
  id: number;
  type: string;
  amount: string;
  category: string;
  account: {
    currency: {
      id: number;
      code: string;
      name: string;
      symbol: string;
    };
  };
}

interface TopCategoriesWidgetProps {
  transactions: Transaction[];
  exchangeRates: any[];
  ratesLoading: boolean;
}

export default function TopCategoriesWidget({ transactions, exchangeRates, ratesLoading }: TopCategoriesWidgetProps) {
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

  // Группируем транзакции по категориям с конвертацией валют
  const categoryTotals = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, transaction) => {
      const category = transaction.category || 'Без категории';
      const amount = Number(transaction.amount);
      const currencyCode = transaction.account.currency.code;
      const amountRUB = convertToRUB(amount, currencyCode);
      
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += amountRUB;
      
      return acc;
    }, {} as Record<string, number>);

  // Сортируем категории по сумме расходов
  const topCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const totalExpenses = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Топ категорий расходов
      </h3>
      
      <div className="space-y-3">
        {ratesLoading ? (
          <div className="text-center text-gray-500 py-4">
            Загрузка...
          </div>
        ) : topCategories.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            Нет данных о расходах
          </div>
        ) : (
          topCategories.map(([category, amount]) => {
            const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
            
            return (
              <div key={category} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 truncate">{category}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {amount.toLocaleString('ru-RU', { 
                      minimumFractionDigits: 0, 
                      maximumFractionDigits: 0 
                    })} ₽
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500">
                  {percentage.toFixed(1)}% от общих расходов
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
