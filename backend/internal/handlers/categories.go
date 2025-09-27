package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// GetCategories возвращает список категорий пользователя
func GetCategories(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"categories": []gin.H{},
		"message":    "Categories endpoint - not implemented yet",
	})
}

// CreateCategory создает новую категорию
func CreateCategory(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "Create category endpoint - not implemented yet",
	})
}

// UpdateCategory обновляет категорию
func UpdateCategory(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "Update category endpoint - not implemented yet",
	})
}

// DeleteCategory удаляет категорию
func DeleteCategory(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "Delete category endpoint - not implemented yet",
	})
}