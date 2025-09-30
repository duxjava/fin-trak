import { z } from 'zod';

export const signInSchema = z.object({
  email: z.string().email('Неверный адрес электронной почты'),
  password: z.string().min(6, 'Пароль должен содержать не менее 6 символов'),
});

export const signUpSchema = z.object({
  name: z.string().min(2, 'Имя должно содержать не менее 2 символов'),
  email: z.string().email('Неверный адрес электронной почты'),
  password: z.string().min(6, 'Пароль должен содержать не менее 6 символов'),
});

export const createGroupSchema = z.object({
  name: z.string().min(2, 'Название группы должно содержать не менее 2 символов'),
});

export const joinGroupSchema = z.object({
  groupId: z.string().min(1, 'ID группы обязателен'),
});

export const addTransactionSchema = z.object({
  amount: z.number().min(0.01, 'Сумма должна быть больше 0'),
  description: z.string().min(1, 'Описание обязательно'),
  date: z.string().min(1, 'Дата обязательна'),
  category: z.string().min(1, 'Категория обязательна'),
  type: z.enum(['expense', 'income'], {
    errorMap: () => ({ message: 'Пожалуйста, выберите корректный тип транзакции' })
  }),
  accountId: z.number().min(1, 'Счет обязателен'),
});

export const updateTransactionSchema = z.object({
  id: z.number().min(1, 'ID транзакции обязателен'),
  amount: z.number().min(0.01, 'Сумма должна быть больше 0'),
  description: z.string().min(1, 'Описание обязательно'),
  date: z.string().min(1, 'Дата обязательна'),
  category: z.string().min(1, 'Категория обязательна'),
  type: z.enum(['expense', 'income'], {
    errorMap: () => ({ message: 'Пожалуйста, выберите корректный тип транзакции' })
  }),
  accountId: z.number().min(1, 'Счет обязателен'),
});

export const addTransferSchema = z.object({
  fromAmount: z.number().min(0.01, 'Сумма отправления должна быть больше 0'),
  toAmount: z.number().min(0.01, 'Сумма получения должна быть больше 0'),
  description: z.string().min(1, 'Описание обязательно'),
  date: z.string().min(1, 'Дата обязательна'),
  fromAccountId: z.number().min(1, 'Счет отправления обязателен'),
  toAccountId: z.number().min(1, 'Счет получения обязателен'),
}).refine((data) => {
  // Нельзя переводить на тот же счет
  if (data.fromAccountId === data.toAccountId) {
    return false;
  }
  return true;
}, {
  message: 'Нельзя переводить на тот же счет',
  path: ['toAccountId'],
});

export const updateTransferSchema = z.object({
  id: z.number().min(1, 'ID перевода обязателен'),
  fromAmount: z.number().min(0.01, 'Сумма отправления должна быть больше 0'),
  toAmount: z.number().min(0.01, 'Сумма получения должна быть больше 0'),
  description: z.string().min(1, 'Описание обязательно'),
  date: z.string().min(1, 'Дата обязательна'),
  fromAccountId: z.number().min(1, 'Счет отправления обязателен'),
  toAccountId: z.number().min(1, 'Счет получения обязателен'),
}).refine((data) => {
  // Нельзя переводить на тот же счет
  if (data.fromAccountId === data.toAccountId) {
    return false;
  }
  return true;
}, {
  message: 'Нельзя переводить на тот же счет',
  path: ['toAccountId'],
});

export const createAccountSchema = z.object({
  name: z.string().min(1, 'Название счета обязательно'),
  type: z.enum(['cash', 'bank', 'credit', 'investment', 'other'], {
    errorMap: () => ({ message: 'Пожалуйста, выберите корректный тип счета' })
  }),
  balance: z.number().min(0, 'Баланс не может быть отрицательным').default(0),
  currencyId: z.number().min(1, 'Валюта обязательна'),
});

export const updateAccountSchema = z.object({
  id: z.number().min(1, 'ID счета обязателен'),
  name: z.string().min(1, 'Название счета обязательно'),
  type: z.enum(['cash', 'bank', 'credit', 'investment', 'other'], {
    errorMap: () => ({ message: 'Пожалуйста, выберите корректный тип счета' })
  }),
  balance: z.number().min(0, 'Баланс не может быть отрицательным'),
  currencyId: z.number().min(1, 'Валюта обязательна'),
});