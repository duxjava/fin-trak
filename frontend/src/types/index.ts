export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: 'income' | 'expense';
  categoryId: string;
  description?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
  category?: Category;
}

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  amount: number;
  month: number;
  year: number;
  createdAt: string;
  updatedAt: string;
  category?: Category;
  spent?: number;
  remaining?: number;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  createdAt: string;
  updatedAt: string;
  progress?: number;
  daysLeft?: number;
  isCompleted?: boolean;
}

export interface AnalyticsSummary {
  totalIncome: number;
  totalExpenses: number;
  netAmount: number;
  transactionsCount: number;
  period: string;
}

export interface ChartData {
  labels: string[];
  datasets: Dataset[];
}

export interface Dataset {
  label: string;
  data: number[];
  color: string;
}

export interface BudgetStatus {
  categoryId: string;
  categoryName: string;
  budgetAmount: number;
  spentAmount: number;
  remaining: number;
  percentage: number;
  isOverBudget: boolean;
}

// API Request/Response types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface TransactionRequest {
  amount: number;
  type: 'income' | 'expense';
  categoryId: string;
  description?: string;
  date: string;
}

export interface CategoryRequest {
  name: string;
  color?: string;
  icon?: string;
}

export interface BudgetRequest {
  categoryId: string;
  amount: number;
  month: number;
  year: number;
}

export interface GoalRequest {
  title: string;
  description?: string;
  targetAmount: number;
  deadline: string;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
  details?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Form types
export interface TransactionFormData {
  amount: string;
  type: 'income' | 'expense';
  categoryId: string;
  description: string;
  date: string;
}

export interface CategoryFormData {
  name: string;
  color: string;
  icon: string;
}

export interface BudgetFormData {
  categoryId: string;
  amount: string;
  month: number;
  year: number;
}

export interface GoalFormData {
  title: string;
  description: string;
  targetAmount: string;
  deadline: string;
}

// Filter types
export interface TransactionFilters {
  type?: 'income' | 'expense';
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// Navigation types
export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}