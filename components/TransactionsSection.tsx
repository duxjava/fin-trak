'use client';

import { useState } from 'react';
import OperationsList from '@/components/OperationsList';
import AccountFilter from '@/components/AccountFilter';
import AddTransactionModal from '@/components/AddTransactionModal';
import AddTransferModal from '@/components/AddTransferModal';

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

interface TransactionsSectionProps {
  groupId: string;
  userAccounts: Account[];
}

export default function TransactionsSection({ groupId, userAccounts }: TransactionsSectionProps) {
  const [selectedAccounts, setSelectedAccounts] = useState<number[]>([]);
  const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] = useState(false);
  const [isAddTransferModalOpen, setIsAddTransferModalOpen] = useState(false);

  const handleAddTransaction = () => {
    setIsAddTransactionModalOpen(true);
  };

  const handleAddTransfer = () => {
    setIsAddTransferModalOpen(true);
  };

  const handleModalSuccess = () => {
    // Перезагружаем страницу для обновления данных
    window.location.reload();
  };

  return (
    <>
      <div className="sticky top-0 z-10 flex justify-between items-center mb-6 bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="flex items-center space-x-4">
          <h3 className="text-xl font-bold text-gray-900">
            Операции по счёту
          </h3>
          <AccountFilter 
            accounts={userAccounts}
            selectedAccounts={selectedAccounts}
            onAccountsChange={setSelectedAccounts}
          />
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleAddTransaction}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Добавить транзакцию
          </button>
          <button
            onClick={handleAddTransfer}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Добавить перевод
          </button>
        </div>
      </div>
      
      <OperationsList 
        groupId={groupId}
        selectedAccounts={selectedAccounts}
        onAddTransaction={handleAddTransaction}
      />

      {/* Модальное окно для добавления транзакции */}
      <AddTransactionModal
        isOpen={isAddTransactionModalOpen}
        onClose={() => setIsAddTransactionModalOpen(false)}
        groupId={groupId}
        accounts={userAccounts}
        onSuccess={handleModalSuccess}
      />

      {/* Модальное окно для добавления перевода */}
      <AddTransferModal
        isOpen={isAddTransferModalOpen}
        onClose={() => setIsAddTransferModalOpen(false)}
        groupId={groupId}
        accounts={userAccounts}
        onSuccess={handleModalSuccess}
      />
    </>
  );
}
