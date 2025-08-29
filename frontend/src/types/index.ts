// User model
export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

// Transaction model
export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  category: string;
  type: TransactionType;
  date: string;
  description?: string;
  created_at: string;
  updated_at: string;
  user?: User;
}

// Budget model
export interface Budget {
  id: string;
  user_id: string;
  category: string;
  amount: number;
  month: number;
  year: number;
  created_at: string;
  updated_at: string;
  user?: User;
}

// Goal model
export interface Goal {
  id: string;
  user_id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  deadline?: string;
  created_at: string;
  updated_at: string;
  user?: User;
}

// Authentication types
export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ErrorResponse {
  error: string;
}

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}