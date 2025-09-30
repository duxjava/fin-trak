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

interface CurrencyDistributionWidgetProps {
  accounts: Account[];
  exchangeRates: any[];
  ratesLoading: boolean;
}

export default function CurrencyDistributionWidget({ accounts, exchangeRates, ratesLoading }: CurrencyDistributionWidgetProps) {
  // Группируем счета по валютам
  const currencyTotals = accounts.reduce((acc, account) => {
    const currencyCode = account.currency.code;
    const balance = Number(account.balance);
    
    if (!acc[currencyCode]) {
      acc[currencyCode] = {
        symbol: account.currency.symbol,
        name: account.currency.name,
        total: 0,
        count: 0
      };
    }
    
    acc[currencyCode].total += balance;
    acc[currencyCode].count += 1;
    
    return acc;
  }, {} as Record<string, { symbol: string; name: string; total: number; count: number }>);

  // Конвертируем все в RUB для сравнения
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

  const currencyData = Object.entries(currencyTotals).map(([code, data]) => ({
    code,
    ...data,
    totalRUB: convertToRUB(data.total, code)
  }));

  const totalRUB = currencyData.reduce((sum, data) => sum + data.totalRUB, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Распределение по валютам
      </h3>
      
      <div className="space-y-3">
        {ratesLoading ? (
          <div className="text-center text-gray-500 py-4">
            Загрузка курсов...
          </div>
        ) : currencyData.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            Нет счетов
          </div>
        ) : (
          currencyData
            .sort((a, b) => b.totalRUB - a.totalRUB)
            .map(({ code, symbol, name, totalRUB, count }) => {
              const percentage = totalRUB > 0 ? (totalRUB / totalRUB) * 100 : 0;
              
              return (
                <div key={code} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">{symbol}</span>
                      <span className="text-sm text-gray-600">{code}</span>
                      <span className="text-xs text-gray-500">({count} счет)</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {totalRUB.toLocaleString('ru-RU', { 
                        minimumFractionDigits: 0, 
                        maximumFractionDigits: 0 
                      })} ₽
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })
        )}
      </div>
    </div>
  );
}
