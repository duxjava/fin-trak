package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/rate"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/redis/go-redis/v9"

	"personal-finance-app/internal/handlers"
	"personal-finance-app/internal/middleware"
	"personal-finance-app/pkg/database"
)

func main() {
	// Загружаем переменные окружения
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// Инициализируем базу данных
	db, err := database.InitDB()
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	// Инициализируем Redis
	redisClient := redis.NewClient(&redis.Options{
		Addr:     os.Getenv("REDIS_ADDR"),
		Password: os.Getenv("REDIS_PASSWORD"),
		DB:       0,
	})
	defer redisClient.Close()

	// Проверяем подключение к Redis
	ctx := context.Background()
	if err := redisClient.Ping(ctx).Err(); err != nil {
		log.Println("Warning: Redis connection failed:", err)
	}

	// Создаем Gin роутер
	router := gin.Default()

	// Настройка CORS
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Rate limiting middleware
	router.Use(rate.RateLimiter(rate.NewLimiter(100, 200))) // 100 requests per minute, burst of 200

	// Статические файлы
	router.Static("/static", "./static")

	// API маршруты
	api := router.Group("/api")
	{
		// Аутентификация
		auth := api.Group("/auth")
		{
			auth.POST("/register", handlers.Register)
			auth.POST("/login", handlers.Login)
			auth.POST("/logout", handlers.Logout)
			auth.GET("/me", middleware.AuthMiddleware(), handlers.GetProfile)
		}

		// Транзакции
		transactions := api.Group("/transactions")
		transactions.Use(middleware.AuthMiddleware())
		{
			transactions.GET("", handlers.GetTransactions)
			transactions.POST("", handlers.CreateTransaction)
			transactions.GET("/:id", handlers.GetTransaction)
			transactions.PUT("/:id", handlers.UpdateTransaction)
			transactions.DELETE("/:id", handlers.DeleteTransaction)
			transactions.POST("/import", handlers.ImportTransactions)
			transactions.GET("/export", handlers.ExportTransactions)
		}

		// Категории
		categories := api.Group("/categories")
		categories.Use(middleware.AuthMiddleware())
		{
			categories.GET("", handlers.GetCategories)
			categories.POST("", handlers.CreateCategory)
			categories.PUT("/:id", handlers.UpdateCategory)
			categories.DELETE("/:id", handlers.DeleteCategory)
		}

		// Бюджеты
		budgets := api.Group("/budgets")
		budgets.Use(middleware.AuthMiddleware())
		{
			budgets.GET("", handlers.GetBudgets)
			budgets.POST("", handlers.CreateBudget)
			budgets.PUT("/:id", handlers.UpdateBudget)
			budgets.DELETE("/:id", handlers.DeleteBudget)
		}

		// Цели
		goals := api.Group("/goals")
		goals.Use(middleware.AuthMiddleware())
		{
			goals.GET("", handlers.GetGoals)
			goals.POST("", handlers.CreateGoal)
			goals.PUT("/:id", handlers.UpdateGoal)
			goals.DELETE("/:id", handlers.DeleteGoal)
		}

		// Аналитика
		analytics := api.Group("/analytics")
		analytics.Use(middleware.AuthMiddleware())
		{
			analytics.GET("/summary", handlers.GetAnalyticsSummary)
			analytics.GET("/chart", handlers.GetAnalyticsChart)
			analytics.GET("/budget-status", handlers.GetBudgetStatus)
		}
	}

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "timestamp": time.Now()})
	})

	// Получаем порт из переменных окружения
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Создаем HTTP сервер
	srv := &http.Server{
		Addr:    ":" + port,
		Handler: router,
	}

	// Graceful shutdown
	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	log.Printf("Server started on port %s", port)

	// Ожидаем сигнал для graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}

	log.Println("Server exited")
}