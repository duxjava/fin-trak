package models

import (
	"time"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// User представляет пользователя системы
type User struct {
	ID           uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	Email        string    `json:"email" gorm:"uniqueIndex;not null"`
	PasswordHash string    `json:"-" gorm:"not null"`
	CreatedAt   time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt   time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

// Transaction представляет финансовую транзакцию
type Transaction struct {
	ID          uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	UserID      uuid.UUID `json:"user_id" gorm:"type:uuid;not null"`
	Amount      float64   `json:"amount" gorm:"not null"`
	Type        string    `json:"type" gorm:"not null"`
	CategoryID  uuid.UUID `json:"category_id" gorm:"type:uuid;not null"`
	Description string    `json:"description"`
	Date        time.Time `json:"date" gorm:"not null"`
	CreatedAt   time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt   time.Time `json:"updated_at" gorm:"autoUpdateTime"`
	
	// Связанные данные
	Category *Category `json:"category,omitempty" gorm:"foreignKey:CategoryID"`
	User     *User     `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// Category представляет категорию транзакций
type Category struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	UserID    uuid.UUID `json:"user_id" gorm:"type:uuid;not null"`
	Name      string    `json:"name" gorm:"not null"`
	Color     string    `json:"color" gorm:"default:'#3B82F6'"`
	Icon      string    `json:"icon" gorm:"default:'category'"`
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt time.Time `json:"updated_at" gorm:"autoUpdateTime"`
	
	User *User `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// Budget представляет бюджет на месяц
type Budget struct {
	ID         uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	UserID     uuid.UUID `json:"user_id" gorm:"type:uuid;not null"`
	CategoryID uuid.UUID `json:"category_id" gorm:"type:uuid;not null"`
	Amount     float64   `json:"amount" gorm:"not null"`
	Month      int       `json:"month" gorm:"not null"`
	Year       int       `json:"year" gorm:"not null"`
	CreatedAt  time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt  time.Time `json:"updated_at" gorm:"autoUpdateTime"`
	
	// Связанные данные
	Category *Category `json:"category,omitempty" gorm:"foreignKey:CategoryID"`
	User     *User     `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// Goal представляет финансовую цель
type Goal struct {
	ID            uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	UserID        uuid.UUID `json:"user_id" gorm:"type:uuid;not null"`
	Title         string    `json:"title" gorm:"not null"`
	Description   string    `json:"description"`
	TargetAmount  float64   `json:"target_amount" gorm:"not null"`
	CurrentAmount float64   `json:"current_amount" gorm:"default:0"`
	Deadline      time.Time `json:"deadline"`
	CreatedAt     time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt     time.Time `json:"updated_at" gorm:"autoUpdateTime"`
	
	User *User `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// LoginRequest представляет запрос на вход
type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=6"`
}

// RegisterRequest представляет запрос на регистрацию
type RegisterRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=6"`
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

// AuthResponse представляет ответ аутентификации
type AuthResponse struct {
	User  User   `json:"user"`
	Token string `json:"token"`
}

// ErrorResponse представляет ответ с ошибкой
type ErrorResponse struct {
	Error string `json:"error"`
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

// BeforeCreate hooks для автоматической генерации UUID
func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}

func (t *Transaction) BeforeCreate(tx *gorm.DB) error {
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	return nil
}

func (c *Category) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}

func (b *Budget) BeforeCreate(tx *gorm.DB) error {
	if b.ID == uuid.Nil {
		b.ID = uuid.New()
	}
	return nil
}

func (g *Goal) BeforeCreate(tx *gorm.DB) error {
	if g.ID == uuid.Nil {
		g.ID = uuid.New()
	}
	return nil
}