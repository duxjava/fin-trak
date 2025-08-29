package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	"personal-finance-app/internal/models"
	"personal-finance-app/internal/middleware"
	"personal-finance-app/pkg/database"
)

var validate = validator.New()

// Register обрабатывает регистрацию нового пользователя
func Register(c *gin.Context) {
	var req models.RegisterRequest
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	// Валидируем данные
	if err := validate.Struct(req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Validation failed", "details": err.Error()})
		return
	}

	// Проверяем, существует ли пользователь с таким email
	var existingUser models.User
	err := database.GetDB().QueryRow("SELECT id FROM users WHERE email = $1", req.Email).Scan(&existingUser.ID)
	if err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "User with this email already exists"})
		return
	}

	// Хешируем пароль
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Создаем пользователя
	user := models.User{
		ID:           uuid.New(),
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
		FirstName:    req.FirstName,
		LastName:     req.LastName,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	// Сохраняем в базу данных
	_, err = database.GetDB().Exec(`
		INSERT INTO users (id, email, password_hash, first_name, last_name, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`, user.ID, user.Email, user.PasswordHash, user.FirstName, user.LastName, user.CreatedAt, user.UpdatedAt)
	
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	// Создаем JWT токен
	token, err := middleware.GenerateJWT(&user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	// Устанавливаем токен в HTTP-only cookie
	c.SetCookie("auth_token", token, 24*60*60, "/", "", false, true)

	// Возвращаем данные пользователя (без пароля)
	user.PasswordHash = ""
	c.JSON(http.StatusCreated, gin.H{
		"message": "User registered successfully",
		"user":    user,
		"token":   token,
	})
}

// Login обрабатывает вход пользователя
func Login(c *gin.Context) {
	var req models.LoginRequest
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	// Валидируем данные
	if err := validate.Struct(req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Validation failed", "details": err.Error()})
		return
	}

	// Ищем пользователя по email
	var user models.User
	err := database.GetDB().QueryRow(`
		SELECT id, email, password_hash, first_name, last_name, created_at, updated_at
		FROM users WHERE email = $1
	`, req.Email).Scan(&user.ID, &user.Email, &user.PasswordHash, &user.FirstName, &user.LastName, &user.CreatedAt, &user.UpdatedAt)
	
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	// Проверяем пароль
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	// Создаем JWT токен
	token, err := middleware.GenerateJWT(&user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	// Устанавливаем токен в HTTP-only cookie
	c.SetCookie("auth_token", token, 24*60*60, "/", "", false, true)

	// Возвращаем данные пользователя (без пароля)
	user.PasswordHash = ""
	c.JSON(http.StatusOK, gin.H{
		"message": "Login successful",
		"user":    user,
		"token":   token,
	})
}

// Logout обрабатывает выход пользователя
func Logout(c *gin.Context) {
	// Удаляем токен из cookie
	c.SetCookie("auth_token", "", -1, "/", "", false, true)
	
	c.JSON(http.StatusOK, gin.H{"message": "Logout successful"})
}

// GetProfile возвращает профиль текущего пользователя
func GetProfile(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Получаем данные пользователя
	var user models.User
	err = database.GetDB().QueryRow(`
		SELECT id, email, first_name, last_name, created_at, updated_at
		FROM users WHERE id = $1
	`, userID).Scan(&user.ID, &user.Email, &user.FirstName, &user.LastName, &user.CreatedAt, &user.UpdatedAt)
	
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"user": user})
}