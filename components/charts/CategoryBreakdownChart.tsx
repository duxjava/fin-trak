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

interface CategoryBreakdownChartProps {
  transactions: Transaction[];
  exchangeRates: any[];
  ratesLoading: boolean;
}

export default function CategoryBreakdownChart({ transactions, exchangeRates, ratesLoading }: CategoryBreakdownChartProps) {
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

  // Группируем расходы по категориям с конвертацией валют
  const categoryData = transactions
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

  // Сортируем и берем топ-6 категорий
  const topCategories = Object.entries(categoryData)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);

  const totalExpenses = Object.values(categoryData).reduce((sum, amount) => sum + amount, 0);

  const colors = [
    '#3B82F6', // blue-500
    '#EF4444', // red-500
    '#10B981', // emerald-500
    '#F59E0B', // amber-500
    '#8B5CF6', // violet-500
    '#EC4899', // pink-500
  ];

  return (
    <div className="h-64">
      {ratesLoading ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          Загрузка данных...
        </div>
      ) : topCategories.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          Нет данных о расходах
        </div>
      ) : (
        <div className="h-full flex items-center space-x-4">
          {/* Круговая диаграмма (упрощенная) */}
          <div className="flex-1 flex items-center justify-center">
            <div className="relative w-32 h-32">
              {topCategories.map(([category, amount], index) => {
                const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
                const angle = (percentage / 100) * 360;
                const color = colors[index % colors.length];
                
                return (
                  <div
                    key={category}
                    className="absolute inset-0 rounded-full border-8"
                    style={{
                      borderColor: color,
                      clipPath: `polygon(50% 50%, 50% 0%, ${50 + Math.cos((angle * Math.PI) / 180) * 50}% ${50 + Math.sin((angle * Math.PI) / 180) * 50}%)`,
                    }}
                    title={`${category}: ${amount.toLocaleString('ru-RU')} ₽ (${percentage.toFixed(1)}%)`}
                  ></div>
                );
              })}
            </div>
          </div>
          
          {/* Легенда */}
          <div className="flex-1 space-y-2">
            {topCategories.map(([category, amount], index) => {
              const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
              const color = colors[index % colors.length];
              
              return (
                <div key={category} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  ></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-900 truncate">{category}</div>
                    <div className="text-xs text-gray-500">
                      {amount.toLocaleString('ru-RU', { 
                        minimumFractionDigits: 0, 
                        maximumFractionDigits: 0 
                      })} ₽ ({percentage.toFixed(1)}%)
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
