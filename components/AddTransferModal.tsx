'use client';

import { useState } from 'react';
import { addTransfer } from '@/actions/transfer-actions';

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

interface AddTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId?: string;
  accounts?: Account[];
  onSuccess?: () => void;
}

export default function AddTransferModal({ isOpen, onClose, groupId, accounts = [], onSuccess }: AddTransferModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFromAccount, setSelectedFromAccount] = useState<string>('');
  const [selectedToAccount, setSelectedToAccount] = useState<string>('');

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    setError('');

    try {
      await addTransfer(formData);
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
            <h3 className="text-lg font-semibold text-gray-900">Добавить перевод</h3>
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="fromAmount" className="block text-sm font-medium text-gray-700 mb-1">
                  Сумма отправления
                </label>
                <input
                  type="number"
                  step="0.01"
                  id="fromAmount"
                  name="fromAmount"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label htmlFor="toAmount" className="block text-sm font-medium text-gray-700 mb-1">
                  Сумма получения
                </label>
                <input
                  type="number"
                  step="0.01"
                  id="toAmount"
                  name="toAmount"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  placeholder="0.00"
                />
              </div>
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
                placeholder="Описание перевода"
              />
            </div>

            {accounts.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="fromAccountId" className="block text-sm font-medium text-gray-700 mb-1">
                    С какого счета
                  </label>
                  <select
                    id="fromAccountId"
                    name="fromAccountId"
                    required
                    value={selectedFromAccount}
                    onChange={(e) => setSelectedFromAccount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  >
                    <option value="">Выберите исходный счет</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} ({account.currency?.symbol || '$'} {Number(account.balance).toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="toAccountId" className="block text-sm font-medium text-gray-700 mb-1">
                    На какой счет
                  </label>
                  <select
                    id="toAccountId"
                    name="toAccountId"
                    required
                    value={selectedToAccount}
                    onChange={(e) => setSelectedToAccount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  >
                    <option value="">Выберите счет назначения</option>
                    {accounts
                      .filter(account => account.id.toString() !== selectedFromAccount)
                      .map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name} ({account.currency?.symbol || '$'} {Number(account.balance).toFixed(2)})
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-2 rounded-md">
                <p className="text-sm">Вам нужно создать хотя бы два счета перед добавлением переводов.</p>
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
                disabled={isLoading || accounts.length < 2}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50 transition-colors"
              >
                {isLoading ? 'Добавление...' : 'Добавить перевод'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
