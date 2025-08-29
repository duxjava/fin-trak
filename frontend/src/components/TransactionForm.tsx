import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Calendar, DollarSign, Tag, FileText, Save, X } from 'lucide-react';
import { Transaction, Category, TransactionFormData } from '../types';
import { transactionsAPI, categoriesAPI } from '../utils/api';

interface TransactionFormProps {
  transaction?: Transaction;
  onSuccess?: () => void;
  onCancel?: () => void;
  isEditing?: boolean;
}

const TransactionForm: React.FC<TransactionFormProps> = ({
  transaction,
  onSuccess,
  onCancel,
  isEditing = false,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<TransactionFormData>({
    defaultValues: {
      amount: '',
      type: 'expense',
      categoryId: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
    },
  });

  // Загружаем категории при монтировании компонента
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await categoriesAPI.getAll();
        setCategories(response.categories || []);
      } catch (error) {
        console.error('Failed to load categories:', error);
        toast.error('Не удалось загрузить категории');
      }
    };

    loadCategories();
  }, []);

  // Заполняем форму данными транзакции при редактировании
  useEffect(() => {
    if (transaction && isEditing) {
      setValue('amount', transaction.amount.toString());
      setValue('type', transaction.type);
      setValue('categoryId', transaction.categoryId);
      setValue('description', transaction.description || '');
      setValue('date', transaction.date.split('T')[0]);
    }
  }, [transaction, isEditing, setValue]);

  const onSubmit = async (data: TransactionFormData) => {
    try {
      setLoading(true);

      const transactionData = {
        amount: parseFloat(data.amount),
        type: data.type,
        categoryId: data.categoryId,
        description: data.description,
        date: data.date,
      };

      if (isEditing && transaction) {
        await transactionsAPI.update(transaction.id, transactionData);
        toast.success('Транзакция обновлена успешно!');
      } else {
        await transactionsAPI.create(transactionData);
        toast.success('Транзакция создана успешно!');
      }

      // Сбрасываем форму
      reset();
      
      // Вызываем callback успеха
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Failed to save transaction:', error);
      toast.error('Не удалось сохранить транзакцию');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      reset();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Редактировать транзакцию' : 'Новая транзакция'}
        </h2>
        {onCancel && (
          <button
            onClick={handleCancel}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Тип транзакции */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Тип транзакции
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="expense"
                {...register('type', { required: 'Выберите тип транзакции' })}
                className="mr-2 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-gray-700">Расход</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="income"
                {...register('type', { required: 'Выберите тип транзакции' })}
                className="mr-2 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-gray-700">Доход</span>
            </label>
          </div>
          {errors.type && (
            <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
          )}
        </div>

        {/* Сумма */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Сумма
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DollarSign className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="number"
              step="0.01"
              min="0"
              {...register('amount', {
                required: 'Введите сумму',
                min: { value: 0.01, message: 'Сумма должна быть больше 0' },
              })}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              placeholder="0.00"
            />
          </div>
          {errors.amount && (
            <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
          )}
        </div>

        {/* Категория */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Категория
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Tag className="h-5 w-5 text-gray-400" />
            </div>
            <select
              {...register('categoryId', { required: 'Выберите категорию' })}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Выберите категорию</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          {errors.categoryId && (
            <p className="mt-1 text-sm text-red-600">{errors.categoryId.message}</p>
          )}
        </div>

        {/* Описание */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Описание
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FileText className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              {...register('description')}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Описание транзакции (необязательно)"
            />
          </div>
        </div>

        {/* Дата */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Дата
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="date"
              {...register('date', { required: 'Выберите дату' })}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          {errors.date && (
            <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
          )}
        </div>

        {/* Кнопки */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isEditing ? 'Обновить' : 'Создать'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TransactionForm;