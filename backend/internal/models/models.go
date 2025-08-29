package models

import (
	"time"
	"github.com/google/uuid"
)

// User представляет пользователя системы
type User struct {
	ID           uuid.UUID `json:"id" db:"id"`
	Email        string    `json:"email" db:"email" validate:"required,email"`
	PasswordHash string    `json:"-" db:"password_hash"`
	FirstName   string    `json:"first_name" db:"first_name" validate:"required"`
	LastName    string    `json:"last_name" db:"last_name" validate:"required"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

// Transaction представляет финансовую транзакцию
type Transaction struct {
	ID          uuid.UUID `json:"id" db:"id"`
	UserID      uuid.UUID `json:"user_id" db:"user_id"`
	Amount      float64   `json:"amount" db:"amount" validate:"required"`
	Type        string    `json:"type" db:"type" validate:"required,oneof=income expense"`
	CategoryID  uuid.UUID `json:"category_id" db:"category_id" validate:"required"`
	Description string    `json:"description" db:"description"`
	Date        time.Time `json:"date" db:"date" validate:"required"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
	
	// Связанные данные
	Category *Category `json:"category,omitempty"`
}

// Category представляет категорию транзакций
type Category struct {
	ID        uuid.UUID `json:"id" db:"id"`
	UserID    uuid.UUID `json:"user_id" db:"user_id"`
	Name      string    `json:"name" db:"name" validate:"required"`
	Color     string    `json:"color" db:"color"`
	Icon      string    `json:"icon" db:"icon"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

// Budget представляет бюджет на месяц
type Budget struct {
	ID         uuid.UUID `json:"id" db:"id"`
	UserID     uuid.UUID `json:"user_id" db:"user_id"`
	CategoryID uuid.UUID `json:"category_id" db:"category_id" validate:"required"`
	Amount     float64   `json:"amount" db:"amount" validate:"required,gt=0"`
	Month      int       `json:"month" db:"month" validate:"required,min=1,max=12"`
	Year       int       `json:"year" db:"year" validate:"required,min=2000"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
	UpdatedAt  time.Time `json:"updated_at" db:"updated_at"`
	
	// Связанные данные
	Category *Category `json:"category,omitempty"`
	Spent    float64   `json:"spent,omitempty"`
	Remaining float64  `json:"remaining,omitempty"`
}

// Goal представляет финансовую цель
type Goal struct {
	ID            uuid.UUID `json:"id" db:"id"`
	UserID        uuid.UUID `json:"user_id" db:"user_id"`
	Title         string    `json:"title" db:"title" validate:"required"`
	Description   string    `json:"description" db:"description"`
	TargetAmount  float64   `json:"target_amount" db:"target_amount" validate:"required,gt=0"`
	CurrentAmount float64   `json:"current_amount" db:"current_amount"`
	Deadline      time.Time `json:"deadline" db:"deadline" validate:"required"`
	CreatedAt     time.Time `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time `json:"updated_at" db:"updated_at"`
	
	// Вычисляемые поля
	Progress     float64 `json:"progress,omitempty"`
	DaysLeft    int     `json:"days_left,omitempty"`
	IsCompleted bool    `json:"is_completed,omitempty"`
}

// LoginRequest представляет запрос на вход
type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=6"`
}

// RegisterRequest представляет запрос на регистрацию
type RegisterRequest struct {
	Email     string `json:"email" validate:"required,email"`
	Password  string `json:"password" validate:"required,min=6"`
	FirstName string `json:"first_name" validate:"required"`
	LastName  string `json:"last_name" validate:"required"`
}

// TransactionRequest представляет запрос на создание/обновление транзакции
type TransactionRequest struct {
	Amount      float64   `json:"amount" validate:"required"`
	Type        string    `json:"type" validate:"required,oneof=income expense"`
	CategoryID  uuid.UUID `json:"category_id" validate:"required"`
	Description string    `json:"description"`
	Date        time.Time `json:"date" validate:"required"`
}

// CategoryRequest представляет запрос на создание/обновление категории
type CategoryRequest struct {
	Name  string `json:"name" validate:"required"`
	Color string `json:"color"`
	Icon  string `json:"icon"`
}

// BudgetRequest представляет запрос на создание/обновление бюджета
type BudgetRequest struct {
	CategoryID uuid.UUID `json:"category_id" validate:"required"`
	Amount     float64   `json:"amount" validate:"required,gt=0"`
	Month      int       `json:"month" validate:"required,min=1,max=12"`
	Year       int       `json:"year" validate:"required,min=2000"`
}

// GoalRequest представляет запрос на создание/обновление цели
type GoalRequest struct {
	Title        string    `json:"title" validate:"required"`
	Description  string    `json:"description"`
	TargetAmount float64   `json:"target_amount" validate:"required,gt=0"`
	Deadline     time.Time `json:"deadline" validate:"required"`
}

// AnalyticsSummary представляет сводку по аналитике
type AnalyticsSummary struct {
	TotalIncome    float64 `json:"total_income"`
	TotalExpenses  float64 `json:"total_expenses"`
	NetAmount      float64 `json:"net_amount"`
	TransactionsCount int  `json:"transactions_count"`
	Period         string  `json:"period"`
}

// ChartData представляет данные для графиков
type ChartData struct {
	Labels   []string    `json:"labels"`
	Datasets []Dataset   `json:"datasets"`
}

type Dataset struct {
	Label string    `json:"label"`
	Data  []float64 `json:"data"`
	Color string    `json:"color"`
}

// BudgetStatus представляет статус бюджета
type BudgetStatus struct {
	CategoryID   uuid.UUID `json:"category_id"`
	CategoryName string    `json:"category_name"`
	BudgetAmount float64   `json:"budget_amount"`
	SpentAmount  float64   `json:"spent_amount"`
	Remaining    float64   `json:"remaining"`
	Percentage   float64   `json:"percentage"`
	IsOverBudget bool      `json:"is_over_budget"`
}