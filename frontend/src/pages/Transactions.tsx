import React from 'react';

const Transactions: React.FC = () => {
  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Transactions</h3>
          <p className="text-gray-500">Your transactions will appear here</p>
        </div>
      </div>
    </div>
  );
};

export default Transactions;