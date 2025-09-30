'use client';

import { useState } from 'react';
import { deleteTransfer } from '@/actions/transfer-actions';

interface DeleteTransferButtonProps {
  transferId: number;
  onSuccess?: () => void;
}

export default function DeleteTransferButton({ transferId, onSuccess }: DeleteTransferButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Вы уверены, что хотите удалить этот перевод?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteTransfer(transferId);
      onSuccess?.();
    } catch (error) {
      console.error('Error deleting transfer:', error);
      alert('Ошибка при удалении перевода');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title="Удалить перевод"
    >
      {isDeleting ? (
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
      ) : (
        '×'
      )}
    </button>
  );
}
