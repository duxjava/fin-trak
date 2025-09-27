package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// GetBudgets возвращает список бюджетов пользователя
func GetBudgets(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"budgets": []gin.H{},
		"message": "Budgets endpoint - not implemented yet",
	})
}

// CreateBudget создает новый бюджет
func CreateBudget(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "Create budget endpoint - not implemented yet",
	})
}

// UpdateBudget обновляет бюджет
func UpdateBudget(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "Update budget endpoint - not implemented yet",
	})
}

// DeleteBudget удаляет бюджет
func DeleteBudget(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "Delete budget endpoint - not implemented yet",
	})
}