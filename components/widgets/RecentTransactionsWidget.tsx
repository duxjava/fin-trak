'use client';

interface Transaction {
  id: number;
  type: string;
  amount: string;
  description: string;
  category: string;
  date: Date | string;
  account: {
    name: string;
    currency: {
      symbol: string;
    };
  };
}

interface RecentTransactionsWidgetProps {
  transactions: Transaction[];
}

export default function RecentTransactionsWidget({ transactions }: RecentTransactionsWidgetProps) {
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'expense': return '💸';
      case 'income': return '💰';
      case 'transfer': return '🔄';
      default: return '📝';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'expense': return 'text-red-600';
      case 'income': return 'text-green-600';
      case 'transfer': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const formatDate = (dateInput: Date | string) => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Сегодня';
    if (diffDays === 2) return 'Вчера';
    if (diffDays <= 7) return `${diffDays - 1} дн. назад`;
    
    return date.toLocaleDateString('ru-RU', { 
      day: '2-digit', 
      month: '2-digit' 
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Последние транзакции
      </h3>
      
      <div className="space-y-3">
        {transactions.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            Нет транзакций
          </div>
        ) : (
          transactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <span className="text-lg">{getTransactionIcon(transaction.type)}</span>
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {transaction.description}
                </p>
                <p className="text-xs text-gray-500">
                  {transaction.category} • {transaction.account.name}
                </p>
              </div>
              
              <div className="flex-shrink-0 text-right">
                <p className={`text-sm font-medium ${getTransactionColor(transaction.type)}`}>
                  {transaction.type === 'expense' ? '-' : 
                   transaction.type === 'income' ? '+' : 
                   '↔'}{transaction.account.currency.symbol}{Number(transaction.amount).toLocaleString('ru-RU', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  })}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDate(transaction.date)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
