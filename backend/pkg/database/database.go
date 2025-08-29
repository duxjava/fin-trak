package database

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"time"

	_ "github.com/lib/pq"
)

var DB *sql.DB

// InitDB инициализирует подключение к базе данных
func InitDB() (*sql.DB, error) {
	// Получаем параметры подключения из переменных окружения
	host := os.Getenv("DB_HOST")
	if host == "" {
		host = "localhost"
	}

	port := os.Getenv("DB_PORT")
	if port == "" {
		port = "5432"
	}

	user := os.Getenv("DB_USER")
	if user == "" {
		user = "postgres"
	}

	password := os.Getenv("DB_PASSWORD")
	if password == "" {
		password = "password"
	}

	dbname := os.Getenv("DB_NAME")
	if dbname == "" {
		dbname = "personal_finance"
	}

	// Формируем строку подключения
	psqlInfo := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		host, port, user, password, dbname)

	// Подключаемся к базе данных
	var err error
	DB, err = sql.Open("postgres", psqlInfo)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %v", err)
	}

	// Настраиваем пул соединений
	DB.SetMaxOpenConns(25)
	DB.SetMaxIdleConns(25)
	DB.SetConnMaxLifetime(5 * time.Minute)

	// Проверяем подключение
	if err = DB.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %v", err)
	}

	log.Println("Successfully connected to database")

	// Создаем таблицы если они не существуют
	if err = createTables(); err != nil {
		return nil, fmt.Errorf("failed to create tables: %v", err)
	}

	return DB, nil
}

// createTables создает все необходимые таблицы
func createTables() error {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS users (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			email VARCHAR(255) UNIQUE NOT NULL,
			password_hash VARCHAR(255) NOT NULL,
			first_name VARCHAR(100) NOT NULL,
			last_name VARCHAR(100) NOT NULL,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
		)`,
		
		`CREATE TABLE IF NOT EXISTS categories (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			name VARCHAR(100) NOT NULL,
			color VARCHAR(7) DEFAULT '#3B82F6',
			icon VARCHAR(50) DEFAULT 'category',
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			UNIQUE(user_id, name)
		)`,
		
		`CREATE TABLE IF NOT EXISTS transactions (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			amount DECIMAL(12,2) NOT NULL,
			type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
			category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
			description TEXT,
			date DATE NOT NULL,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
		)`,
		
		`CREATE TABLE IF NOT EXISTS budgets (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
			amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
			month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
			year INTEGER NOT NULL CHECK (year >= 2000),
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			UNIQUE(user_id, category_id, month, year)
		)`,
		
		`CREATE TABLE IF NOT EXISTS goals (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			title VARCHAR(255) NOT NULL,
			description TEXT,
			target_amount DECIMAL(12,2) NOT NULL CHECK (target_amount > 0),
			current_amount DECIMAL(12,2) DEFAULT 0,
			deadline DATE NOT NULL,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
		)`,
	}

	// Создаем индексы для оптимизации
	indexes := []string{
		`CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id)`,
		`CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)`,
		`CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id)`,
		`CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id)`,
		`CREATE INDEX IF NOT EXISTS idx_budgets_month_year ON budgets(month, year)`,
		`CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id)`,
		`CREATE INDEX IF NOT EXISTS idx_goals_deadline ON goals(deadline)`,
	}

	// Выполняем запросы на создание таблиц
	for _, query := range queries {
		if _, err := DB.Exec(query); err != nil {
			return fmt.Errorf("failed to execute query: %v", err)
		}
	}

	// Создаем индексы
	for _, index := range indexes {
		if _, err := DB.Exec(index); err != nil {
			return fmt.Errorf("failed to create index: %v", err)
		}
	}

	log.Println("Database tables created successfully")
	return nil
}

// Close закрывает соединение с базой данных
func Close() error {
	if DB != nil {
		return DB.Close()
	}
	return nil
}

// GetDB возвращает экземпляр базы данных
func GetDB() *sql.DB {
	return DB
}