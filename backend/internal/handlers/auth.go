package handlers

import (
	"net/http"
	"time"

	"personal-finance-app/internal/models"
	"personal-finance-app/internal/services"

	"github.com/gin-gonic/gin"
	"personal-finance-app/pkg/database"
)

type AuthHandler struct {
	authService *services.AuthService
}

func NewAuthHandler() *AuthHandler {
	return &AuthHandler{
		authService: services.NewAuthService(),
	}
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: err.Error()})
		return
	}

	user, err := h.authService.Register(&req)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: err.Error()})
		return
	}

	// Generate JWT token
	token, err := h.authService.GenerateJWT(user.ID.String())
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to generate token"})
		return
	}

	// Set JWT in HTTP-only cookie
	c.SetCookie(
		"jwt_token",
		token,
		int(time.Hour*24*7), // 7 days
		"/",
		"",
		false, // Set to true in production with HTTPS
		true,  // HTTP-only
	)

	c.JSON(http.StatusCreated, models.AuthResponse{
		User:  *user,
		Token: token,
	})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: err.Error()})
		return
	}

	user, err := h.authService.Login(&req)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{Error: err.Error()})
		return
	}

	// Generate JWT token
	token, err := h.authService.GenerateJWT(user.ID.String())
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to generate token"})
		return
	}

	// Set JWT in HTTP-only cookie
	c.SetCookie(
		"jwt_token",
		token,
		int(time.Hour*24*7), // 7 days
		"/",
		"",
		false, // Set to true in production with HTTPS
		true,  // HTTP-only
	)

	c.JSON(http.StatusOK, models.AuthResponse{
		User:  *user,
		Token: token,
	})
}

func (h *AuthHandler) Logout(c *gin.Context) {
	// Clear JWT cookie
	c.SetCookie(
		"jwt_token",
		"",
		-1,
		"/",
		"",
		false,
		true,
	)

	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}

func (h *AuthHandler) Me(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{Error: "User not authenticated"})
		return
	}

	// Get user from database
	var user models.User
	if err := database.GetDB().First(&user, "id = ?", userID).Error; err != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "User not found"})
		return
	}

	c.JSON(http.StatusOK, user)
}