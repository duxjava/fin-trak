'use client';

import { useState, useEffect } from 'react';
import { updateAccount } from '@/actions/account-actions';
import { getCurrencies } from '@/actions/currency-actions';

interface Account {
  id: number;
  name: string;
  type: string;
  balance: string;
  currencyId: number;
}

interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
}

interface EditAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: Account | null;
  onSuccess?: () => void;
}

const accountTypes = [
  { value: 'cash', label: 'Наличные', icon: '💵' },
  { value: 'bank', label: 'Банковский счет', icon: '🏦' },
  { value: 'credit', label: 'Кредитная карта', icon: '💳' },
  { value: 'investment', label: 'Инвестиции', icon: '📈' },
  { value: 'other', label: 'Прочее', icon: '📊' },
];

export default function EditAccountModal({ isOpen, onClose, account, onSuccess }: EditAccountModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [currenciesLoading, setCurrenciesLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    balance: '0.00',
    currencyId: 0,
  });

  useEffect(() => {
    const loadCurrencies = async () => {
      try {
        const currenciesList = await getCurrencies();
        setCurrencies(currenciesList);
      } catch (err) {
        console.error('Error loading currencies:', err);
        setError('Ошибка загрузки валют');
      } finally {
        setCurrenciesLoading(false);
      }
    };

    if (isOpen) {
      loadCurrencies();
    }
  }, [isOpen]);

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name,
        type: account.type,
        balance: Number(account.balance).toFixed(2),
        currencyId: account.currencyId,
      });
    }
  }, [account]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!account) return;

    setIsLoading(true);
    setError('');

    const form = event.currentTarget;
    const data = new FormData(form);

    try {
      await updateAccount(account.id, data);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !account) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Редактировать счет</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-6 py-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Название счета
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="например, Мой расчетный счет"
              />
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                Тип счета
              </label>
              <select
                id="type"
                name="type"
                required
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value="">Выберите тип счета</option>
                {accountTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="balance" className="block text-sm font-medium text-gray-700 mb-1">
                  Начальный баланс
                </label>
                <input
                  type="number"
                  step="0.01"
                  id="balance"
                  name="balance"
                  value={formData.balance}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label htmlFor="currencyId" className="block text-sm font-medium text-gray-700 mb-1">
                  Валюта
                </label>
                <select
                  id="currencyId"
                  name="currencyId"
                  required
                  value={formData.currencyId}
                  onChange={handleChange}
                  disabled={currenciesLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm disabled:bg-gray-100"
                >
                  <option value="">{currenciesLoading ? 'Загрузка валют...' : 'Выберите валюту'}</option>
                  {currencies.map((currency) => (
                    <option key={currency.id} value={currency.id}>
                      {currency.symbol} {currency.code} - {currency.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}