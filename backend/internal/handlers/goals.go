package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// GetGoals возвращает список целей пользователя
func GetGoals(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"goals":   []gin.H{},
		"message": "Goals endpoint - not implemented yet",
	})
}

// CreateGoal создает новую цель
func CreateGoal(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "Create goal endpoint - not implemented yet",
	})
}

// UpdateGoal обновляет цель
func UpdateGoal(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "Update goal endpoint - not implemented yet",
	})
}

// DeleteGoal удаляет цель
func DeleteGoal(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "Delete goal endpoint - not implemented yet",
	})
}