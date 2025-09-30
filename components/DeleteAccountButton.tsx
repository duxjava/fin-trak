'use client';

import { deleteAccount } from '@/actions/account-actions';
import { useState } from 'react';

interface DeleteAccountButtonProps {
  accountId: number;
}

export default function DeleteAccountButton({ accountId }: DeleteAccountButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Вы уверены, что хотите удалить этот счет? Это действие нельзя отменить.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteAccount(accountId);
    } catch (error) {
      console.error('Error deleting account:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="w-4 h-4 flex items-center justify-center rounded-full bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700 transition-colors disabled:opacity-50"
      title="Удалить счет"
    >
      {isDeleting ? (
        <div className="w-2 h-2 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      ) : (
        <svg
          className="w-3 h-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      )}
    </button>
  );
}
