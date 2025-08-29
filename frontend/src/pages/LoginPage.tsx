import React from 'react';
import AuthForm from '../components/AuthForm';
import { DollarSign } from 'lucide-react';

const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <DollarSign className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Личные финансы
          </h1>
          <p className="text-gray-600">
            Войдите в свой аккаунт для управления финансами
          </p>
        </div>

        {/* Auth Form */}
        <AuthForm />
      </div>
    </div>
  );
};

export default LoginPage;