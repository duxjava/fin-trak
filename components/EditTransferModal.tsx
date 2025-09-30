'use client';

import { useState, useEffect } from 'react';
import { updateTransfer } from '@/actions/transfer-actions';

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

interface Transfer {
  id: number;
  fromAmount: string;
  toAmount: string;
  description: string;
  date: string;
  userId: string;
  fromAccountId: number;
  toAccountId: number;
}

interface EditTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  transfer: Transfer | null;
  accounts: Account[];
  onSuccess?: () => void;
}

export default function EditTransferModal({ 
  isOpen, 
  onClose, 
  transfer, 
  accounts, 
  onSuccess 
}: EditTransferModalProps) {
  const [formData, setFormData] = useState({
    fromAmount: '',
    toAmount: '',
    description: '',
    date: '',
    fromAccountId: 0,
    toAccountId: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (transfer && isOpen) {
      setFormData({
        fromAmount: transfer.fromAmount,
        toAmount: transfer.toAmount,
        description: transfer.description,
        date: new Date(transfer.date).toISOString().split('T')[0],
        fromAccountId: transfer.fromAccountId,
        toAccountId: transfer.toAccountId,
      });
    }
  }, [transfer, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const formDataObj = new FormData();
      formDataObj.append('fromAmount', formData.fromAmount);
      formDataObj.append('toAmount', formData.toAmount);
      formDataObj.append('description', formData.description);
      formDataObj.append('date', formData.date);
      formDataObj.append('fromAccountId', formData.fromAccountId.toString());
      formDataObj.append('toAccountId', formData.toAccountId.toString());

      await updateTransfer(transfer!.id, formDataObj);
      onSuccess?.();
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Ошибка при обновлении перевода');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setError('');
    setFormData({
      fromAmount: '',
      toAmount: '',
      description: '',
      date: '',
      fromAccountId: 0,
      toAccountId: 0,
    });
    onClose();
  };

  if (!isOpen || !transfer) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Редактировать перевод</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Сумма отправления
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={formData.fromAmount}
              onChange={(e) => setFormData({ ...formData, fromAmount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Сумма получения
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={formData.toAmount}
              onChange={(e) => setFormData({ ...formData, toAmount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Описание
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Дата
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Счёт отправления
            </label>
            <select
              value={formData.fromAccountId}
              onChange={(e) => setFormData({ ...formData, fromAccountId: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value={0}>Выберите счёт</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.currency.symbol})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Счёт получения
            </label>
            <select
              value={formData.toAccountId}
              onChange={(e) => setFormData({ ...formData, toAccountId: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value={0}>Выберите счёт</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.currency.symbol})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}