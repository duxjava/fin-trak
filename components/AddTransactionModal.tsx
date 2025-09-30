'use client';

import { useState } from 'react';
import { addTransaction } from '@/actions/transaction-actions';

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

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId?: string;
  accounts?: Account[];
  onSuccess?: () => void;
}

const transactionTypes = [
  { value: 'expense', label: 'Расход', icon: '💸', description: 'Деньги уходят со счета' },
  { value: 'income', label: 'Доход', icon: '💰', description: 'Деньги приходят на счет' },
];

const categories = [
  'Еда и рестораны',
  'Транспорт',
  'Покупки',
  'Развлечения',
  'Коммунальные услуги',
  'Здоровье',
  'Образование',
  'Путешествия',
  'Прочее',
];

export default function AddTransactionModal({ isOpen, onClose, groupId, accounts = [], onSuccess }: AddTransactionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedFromAccount, setSelectedFromAccount] = useState<string>('');

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    setError('');

    try {
      await addTransaction(formData);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Добавить транзакцию</h3>
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
          <form action={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Тип транзакции
              </label>
              <div className="space-y-2">
                {transactionTypes.map((type) => (
                  <label key={type.value} className="flex items-center p-2 border rounded-md cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="type"
                      value={type.value}
                      checked={selectedType === type.value}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                      required
                    />
                    <div className="ml-3">
                      <div className="flex items-center">
                        <span className="text-sm mr-2">{type.icon}</span>
                        <span className="font-medium text-gray-900 text-sm">{type.label}</span>
                      </div>
                      <p className="text-xs text-gray-500">{type.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Сумма
                </label>
                <input
                  type="number"
                  step="0.01"
                  id="amount"
                  name="amount"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                  Дата
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  defaultValue={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Описание
              </label>
              <input
                type="text"
                id="description"
                name="description"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="На что потрачены деньги?"
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Категория
              </label>
              <select
                id="category"
                name="category"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value="">Выберите категорию</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {accounts.length > 0 ? (
              <div>
                <label htmlFor="accountId" className="block text-sm font-medium text-gray-700 mb-1">
                  Счет
                </label>
                <select
                  id="accountId"
                  name="accountId"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                >
                  <option value="">Выберите счет</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({account.currency?.symbol || '$'} {Number(account.balance).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-2 rounded-md">
                <p className="text-sm">Вам нужно создать хотя бы один счет перед добавлением транзакций.</p>
              </div>
            )}

            {groupId && <input type="hidden" name="groupId" value={groupId} />}

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
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50 transition-colors"
              >
                {isLoading ? 'Добавление...' : 'Добавить транзакцию'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
