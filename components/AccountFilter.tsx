'use client';

import { useState } from 'react';

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

interface AccountFilterProps {
  accounts: Account[];
  selectedAccounts: number[];
  onAccountsChange: (accountIds: number[]) => void;
}

export default function AccountFilter({ accounts, selectedAccounts, onAccountsChange }: AccountFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleAccountToggle = (accountId: number) => {
    if (selectedAccounts.includes(accountId)) {
      onAccountsChange(selectedAccounts.filter(id => id !== accountId));
    } else {
      onAccountsChange([...selectedAccounts, accountId]);
    }
  };

  const handleSelectAll = () => {
    onAccountsChange(accounts.map(account => account.id));
  };

  const handleClearAll = () => {
    onAccountsChange([]);
  };

  const getSelectedAccountsText = () => {
    if (selectedAccounts.length === 0) {
      return 'Все счета';
    }
    if (selectedAccounts.length === accounts.length) {
      return 'Все счета';
    }
    if (selectedAccounts.length === 1) {
      const account = accounts.find(acc => acc.id === selectedAccounts[0]);
      return account?.name || '1 счет';
    }
    return `${selectedAccounts.length} счетов`;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
      >
        <span className="text-sm font-medium text-gray-700">
          {getSelectedAccountsText()}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-300 rounded-md shadow-lg z-40">
          <div className="p-2">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Фильтр по счетам</span>
              <div className="flex space-x-1">
                <button
                  onClick={handleSelectAll}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Все
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={handleClearAll}
                  className="text-xs text-gray-600 hover:text-gray-800 font-medium"
                >
                  Сбросить
                </button>
              </div>
            </div>
            
            <div className="max-h-48 overflow-y-auto">
              {accounts.map((account) => (
                <label
                  key={account.id}
                  className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedAccounts.includes(account.id)}
                    onChange={() => handleAccountToggle(account.id)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {account.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {account.currency?.symbol || '$'} {Number(account.balance).toFixed(2)}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
