import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { toast } from 'react-hot-toast';

// Создаем экземпляр axios с базовой конфигурацией
const api: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000,
  withCredentials: true, // Для работы с cookies
});

// Интерцептор для обработки ошибок
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Неавторизован - перенаправляем на страницу входа
          localStorage.removeItem('user');
          window.location.href = '/login';
          break;
        case 403:
          toast.error('Доступ запрещен');
          break;
        case 404:
          toast.error('Ресурс не найден');
          break;
        case 422:
          toast.error(data.error || 'Ошибка валидации');
          break;
        case 500:
          toast.error('Внутренняя ошибка сервера');
          break;
        default:
          toast.error(data.error || 'Произошла ошибка');
      }
    } else if (error.request) {
      toast.error('Нет ответа от сервера');
    } else {
      toast.error('Ошибка настройки запроса');
    }
    
    return Promise.reject(error);
  }
);

// Интерцептор для добавления токена в заголовки
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// API методы для аутентификации
export const authAPI = {
  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  
  register: async (userData: { email: string; password: string; firstName: string; lastName: string }) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
  
  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// API методы для транзакций
export const transactionsAPI = {
  getAll: async (filters?: any) => {
    const response = await api.get('/transactions', { params: filters });
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/transactions/${id}`);
    return response.data;
  },
  
  create: async (transaction: any) => {
    const response = await api.post('/transactions', transaction);
    return response.data;
  },
  
  update: async (id: string, transaction: any) => {
    const response = await api.put(`/transactions/${id}`, transaction);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/transactions/${id}`);
    return response.data;
  },
  
  import: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/transactions/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  
  export: async (filters?: any) => {
    const response = await api.get('/transactions/export', { 
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  },
};

// API методы для категорий
export const categoriesAPI = {
  getAll: async () => {
    const response = await api.get('/categories');
    return response.data;
  },
  
  create: async (category: any) => {
    const response = await api.post('/categories', category);
    return response.data;
  },
  
  update: async (id: string, category: any) => {
    const response = await api.put(`/categories/${id}`, category);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },
};

// API методы для бюджетов
export const budgetsAPI = {
  getAll: async () => {
    const response = await api.get('/budgets');
    return response.data;
  },
  
  create: async (budget: any) => {
    const response = await api.post('/budgets', budget);
    return response.data;
  },
  
  update: async (id: string, budget: any) => {
    const response = await api.put(`/budgets/${id}`, budget);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/budgets/${id}`);
    return response.data;
  },
};

// API методы для целей
export const goalsAPI = {
  getAll: async () => {
    const response = await api.get('/goals');
    return response.data;
  },
  
  create: async (goal: any) => {
    const response = await api.post('/goals', goal);
    return response.data;
  },
  
  update: async (id: string, goal: any) => {
    const response = await api.put(`/goals/${id}`, goal);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/goals/${id}`);
    return response.data;
  },
};

// API методы для аналитики
export const analyticsAPI = {
  getSummary: async (period?: string) => {
    const response = await api.get('/analytics/summary', { params: { period } });
    return response.data;
  },
  
  getChart: async (period?: string) => {
    const response = await api.get('/analytics/chart', { params: { period } });
    return response.data;
  },
  
  getBudgetStatus: async () => {
    const response = await api.get('/analytics/budget-status');
    return response.data;
  },
};

export default api;