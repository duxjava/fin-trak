'use client';

import { useState, useEffect } from 'react';
import ExpenseIncomeChart from './charts/ExpenseIncomeChart';
import CategoryBreakdownChart from './charts/CategoryBreakdownChart';
import MonthlyTrendChart from './charts/MonthlyTrendChart';
import AccountBalanceChart from './charts/AccountBalanceChart';
import TransactionVolumeWidget from './widgets/TransactionVolumeWidget';
import TopCategoriesWidget from './widgets/TopCategoriesWidget';
import RecentTransactionsWidget from './widgets/RecentTransactionsWidget';
import CurrencyDistributionWidget from './widgets/CurrencyDistributionWidget';

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

interface Transaction {
  id: number;
  type: 'expense' | 'income';
  amount: string;
  description: string;
  category: string;
  date: Date | string;
  accountId: number;
  account: Account;
}

interface StatisticsDashboardProps {
  accounts: Account[];
  transactions: Transaction[];
  groupId: string;
}

export default function StatisticsDashboard({ accounts, transactions, groupId }: StatisticsDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year' | 'all'>('all');
  const [exchangeRates, setExchangeRates] = useState<any[]>([]);
  const [ratesLoading, setRatesLoading] = useState(true);

  // Загружаем курсы валют
  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        const response = await fetch('/api/exchange-rates');
        const data = await response.json();
        if (data.success) {
          setExchangeRates(data.rates);
        }
      } catch (error) {
        console.error('Error fetching exchange rates:', error);
      } finally {
        setRatesLoading(false);
      }
    };

    fetchExchangeRates();
  }, []);

  // Фильтруем транзакции по выбранному периоду
  const getFilteredTransactions = () => {
    const now = new Date();
    const startDate = new Date();

    switch (selectedPeriod) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'all':
        // Для "всего периода" возвращаем все транзакции
        return transactions;
    }

    return transactions.filter(t => new Date(t.date) >= startDate);
  };

  const filteredTransactions = getFilteredTransactions();

  return (
    <div className="space-y-8">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          {(['week', 'month', 'quarter', 'year', 'all'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPeriod === period
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {period === 'week' && 'Неделя'}
              {period === 'month' && 'Месяц'}
              {period === 'quarter' && 'Квартал'}
              {period === 'year' && 'Год'}
              {period === 'all' && 'Весь период'}
            </button>
          ))}
        </div>
      </div>

      {/* Top Row - Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <TransactionVolumeWidget 
          transactions={filteredTransactions}
          exchangeRates={exchangeRates}
          ratesLoading={ratesLoading}
        />
        <TopCategoriesWidget 
          transactions={filteredTransactions}
          exchangeRates={exchangeRates}
          ratesLoading={ratesLoading}
        />
        <CurrencyDistributionWidget 
          accounts={accounts}
          exchangeRates={exchangeRates}
          ratesLoading={ratesLoading}
        />
        <RecentTransactionsWidget 
          transactions={filteredTransactions.slice(0, 5)}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Доходы и расходы
          </h3>
          <ExpenseIncomeChart 
            transactions={filteredTransactions}
            exchangeRates={exchangeRates}
            ratesLoading={ratesLoading}
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            По категориям
          </h3>
          <CategoryBreakdownChart 
            transactions={filteredTransactions}
            exchangeRates={exchangeRates}
            ratesLoading={ratesLoading}
          />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Тренд по месяцам
          </h3>
          <MonthlyTrendChart 
            transactions={filteredTransactions}
            exchangeRates={exchangeRates}
            ratesLoading={ratesLoading}
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Баланс по счетам
          </h3>
          <AccountBalanceChart 
            accounts={accounts}
            transactions={transactions}
            exchangeRates={exchangeRates}
            ratesLoading={ratesLoading}
          />
        </div>
      </div>
    </div>
  );
}
