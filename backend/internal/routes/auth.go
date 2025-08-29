package routes

import (
	"personal-finance-app/internal/handlers"
	"personal-finance-app/internal/middleware"

	"github.com/gin-gonic/gin"
)

func SetupAuthRoutes(router *gin.Engine) {
	authHandler := handlers.NewAuthHandler()

	// Public routes
	router.POST("/api/auth/register", authHandler.Register)
	router.POST("/api/auth/login", authHandler.Login)

	// Protected routes
	auth := router.Group("/api/auth")
	auth.Use(middleware.AuthMiddleware())
	{
		auth.POST("/logout", authHandler.Logout)
		auth.GET("/me", authHandler.Me)
	}
}