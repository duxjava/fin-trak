package handlers

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"

	"personal-finance-app/internal/models"
	"personal-finance-app/internal/middleware"
	"personal-finance-app/pkg/database"
)

// GetTransactions возвращает список транзакций пользователя с фильтрацией
func GetTransactions(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Получаем параметры фильтрации
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	transactionType := c.Query("type")
	categoryID := c.Query("category_id")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	// Валидируем параметры
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	// Формируем SQL запрос с фильтрами
	query := `
		SELECT t.id, t.user_id, t.amount, t.type, t.category_id, t.description, t.date, t.created_at, t.updated_at,
		       c.id, c.name, c.color, c.icon
		FROM transactions t
		LEFT JOIN categories c ON t.category_id = c.id
		WHERE t.user_id = $1
	`
	args := []interface{}{userID}
	argIndex := 2

	if transactionType != "" {
		query += fmt.Sprintf(" AND t.type = $%d", argIndex)
		args = append(args, transactionType)
		argIndex++
	}

	if categoryID != "" {
		query += fmt.Sprintf(" AND t.category_id = $%d", argIndex)
		args = append(args, categoryID)
		argIndex++
	}

	if startDate != "" {
		query += fmt.Sprintf(" AND t.date >= $%d", argIndex)
		args = append(args, startDate)
		argIndex++
	}

	if endDate != "" {
		query += fmt.Sprintf(" AND t.date <= $%d", argIndex)
		args = append(args, endDate)
		argIndex++
	}

	query += " ORDER BY t.date DESC, t.created_at DESC LIMIT $%d OFFSET $%d"
	args = append(args, limit, (page-1)*limit)

	// Выполняем запрос
	rows, err := database.GetDB().Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch transactions"})
		return
	}
	defer rows.Close()

	var transactions []models.Transaction
	for rows.Next() {
		var t models.Transaction
		var c models.Category
		err := rows.Scan(
			&t.ID, &t.UserID, &t.Amount, &t.Type, &t.CategoryID, &t.Description, &t.Date, &t.CreatedAt, &t.UpdatedAt,
			&c.ID, &c.Name, &c.Color, &c.Icon,
		)
		if err != nil {
			continue
		}
		t.Category = &c
		transactions = append(transactions, t)
	}

	// Получаем общее количество транзакций для пагинации
	countQuery := `
		SELECT COUNT(*) FROM transactions t WHERE t.user_id = $1
	`
	countArgs := []interface{}{userID}
	countArgIndex := 2

	if transactionType != "" {
		countQuery += fmt.Sprintf(" AND t.type = $%d", countArgIndex)
		countArgs = append(countArgs, transactionType)
		countArgIndex++
	}

	if categoryID != "" {
		countQuery += fmt.Sprintf(" AND t.category_id = $%d", countArgIndex)
		countArgs = append(countArgs, categoryID)
		countArgIndex++
	}

	if startDate != "" {
		countQuery += fmt.Sprintf(" AND t.date >= $%d", countArgIndex)
		countArgs = append(countArgs, startDate)
		countArgIndex++
	}

	if endDate != "" {
		countQuery += fmt.Sprintf(" AND t.date <= $%d", countArgIndex)
		countArgs = append(countArgs, endDate)
		countArgIndex++
	}

	var total int
	err = database.GetDB().QueryRow(countQuery, countArgs...).Scan(&total)
	if err != nil {
		total = len(transactions)
	}

	c.JSON(http.StatusOK, gin.H{
		"transactions": transactions,
		"pagination": gin.H{
			"page":  page,
			"limit": limit,
			"total": total,
			"pages": (total + limit - 1) / limit,
		},
	})
}

// CreateTransaction создает новую транзакцию
func CreateTransaction(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req models.TransactionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	// Валидируем данные
	if err := validate.Struct(req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Validation failed", "details": err.Error()})
		return
	}

	// Проверяем, что категория принадлежит пользователю
	var categoryExists bool
	err = database.GetDB().QueryRow("SELECT EXISTS(SELECT 1 FROM categories WHERE id = $1 AND user_id = $2)", 
		req.CategoryID, userID).Scan(&categoryExists)
	if err != nil || !categoryExists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid category"})
		return
	}

	// Создаем транзакцию
	transaction := models.Transaction{
		ID:          uuid.New(),
		UserID:      userID,
		Amount:      req.Amount,
		Type:        req.Type,
		CategoryID:  req.CategoryID,
		Description: req.Description,
		Date:        req.Date,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	// Сохраняем в базу данных
	_, err = database.GetDB().Exec(`
		INSERT INTO transactions (id, user_id, amount, type, category_id, description, date, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`, transaction.ID, transaction.UserID, transaction.Amount, transaction.Type, transaction.CategoryID,
		transaction.Description, transaction.Date, transaction.CreatedAt, transaction.UpdatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create transaction"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":     "Transaction created successfully",
		"transaction": transaction,
	})
}

// GetTransaction возвращает конкретную транзакцию
func GetTransaction(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	transactionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid transaction ID"})
		return
	}

	var transaction models.Transaction
	var category models.Category
	err = database.GetDB().QueryRow(`
		SELECT t.id, t.user_id, t.amount, t.type, t.category_id, t.description, t.date, t.created_at, t.updated_at,
		       c.id, c.name, c.color, c.icon
		FROM transactions t
		LEFT JOIN categories c ON t.category_id = c.id
		WHERE t.id = $1 AND t.user_id = $2
	`, transactionID, userID).Scan(
		&transaction.ID, &transaction.UserID, &transaction.Amount, &transaction.Type, &transaction.CategoryID,
		&transaction.Description, &transaction.Date, &transaction.CreatedAt, &transaction.UpdatedAt,
		&category.ID, &category.Name, &category.Color, &category.Icon,
	)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Transaction not found"})
		return
	}

	transaction.Category = &category
	c.JSON(http.StatusOK, gin.H{"transaction": transaction})
}

// UpdateTransaction обновляет существующую транзакцию
func UpdateTransaction(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	transactionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid transaction ID"})
		return
	}

	var req models.TransactionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	// Валидируем данные
	if err := validate.Struct(req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Validation failed", "details": err.Error()})
		return
	}

	// Проверяем, что транзакция принадлежит пользователю
	var exists bool
	err = database.GetDB().QueryRow("SELECT EXISTS(SELECT 1 FROM transactions WHERE id = $1 AND user_id = $2)", 
		transactionID, userID).Scan(&exists)
	if err != nil || !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Transaction not found"})
		return
	}

	// Проверяем, что категория принадлежит пользователю
	var categoryExists bool
	err = database.GetDB().QueryRow("SELECT EXISTS(SELECT 1 FROM categories WHERE id = $1 AND user_id = $2)", 
		req.CategoryID, userID).Scan(&categoryExists)
	if err != nil || !categoryExists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid category"})
		return
	}

	// Обновляем транзакцию
	_, err = database.GetDB().Exec(`
		UPDATE transactions 
		SET amount = $1, type = $2, category_id = $3, description = $4, date = $5, updated_at = $6
		WHERE id = $7 AND user_id = $8
	`, req.Amount, req.Type, req.CategoryID, req.Description, req.Date, time.Now(), transactionID, userID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update transaction"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Transaction updated successfully"})
}

// DeleteTransaction удаляет транзакцию
func DeleteTransaction(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	transactionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid transaction ID"})
		return
	}

	// Удаляем транзакцию
	result, err := database.GetDB().Exec("DELETE FROM transactions WHERE id = $1 AND user_id = $2", 
		transactionID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete transaction"})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Transaction not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Transaction deleted successfully"})
}

// ImportTransactions импортирует транзакции из CSV файла
func ImportTransactions(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}

	if !strings.HasSuffix(file.Filename, ".csv") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Only CSV files are supported"})
		return
	}

	// Открываем файл
	src, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to open file"})
		return
	}
	defer src.Close()

	// Парсим CSV
	reader := csv.NewReader(src)
	records, err := reader.ReadAll()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse CSV file"})
		return
	}

	if len(records) < 2 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "CSV file must have at least header and one data row"})
		return
	}

	// Обрабатываем каждую строку (пропускаем заголовок)
	var imported int
	var errors []string

	for i, record := range records[1:] {
		if len(record) < 4 {
			errors = append(errors, fmt.Sprintf("Row %d: insufficient columns", i+2))
			continue
		}

		// Парсим данные
		amount, err := strconv.ParseFloat(record[0], 64)
		if err != nil {
			errors = append(errors, fmt.Sprintf("Row %d: invalid amount", i+2))
			continue
		}

		transactionType := strings.ToLower(record[1])
		if transactionType != "income" && transactionType != "expense" {
			errors = append(errors, fmt.Sprintf("Row %d: invalid type (must be 'income' or 'expense')", i+2))
			continue
		}

		description := record[2]
		dateStr := record[3]

		date, err := time.Parse("2006-01-02", dateStr)
		if err != nil {
			errors = append(errors, fmt.Sprintf("Row %d: invalid date format (use YYYY-MM-DD)", i+2))
			continue
		}

		// Создаем транзакцию
		transaction := models.Transaction{
			ID:          uuid.New(),
			UserID:      userID,
			Amount:      amount,
			Type:        transactionType,
			CategoryID:  uuid.Nil, // Будет установлена позже
			Description: description,
			Date:        date,
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		}

		// Сохраняем в базу данных
		_, err = database.GetDB().Exec(`
			INSERT INTO transactions (id, user_id, amount, type, category_id, description, date, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		`, transaction.ID, transaction.UserID, transaction.Amount, transaction.Type, transaction.CategoryID,
			transaction.Description, transaction.Date, transaction.CreatedAt, transaction.UpdatedAt)

		if err != nil {
			errors = append(errors, fmt.Sprintf("Row %d: failed to save", i+2))
			continue
		}

		imported++
	}

	c.JSON(http.StatusOK, gin.H{
		"message": fmt.Sprintf("Imported %d transactions successfully", imported),
		"imported": imported,
		"errors":   errors,
	})
}

// ExportTransactions экспортирует транзакции в CSV
func ExportTransactions(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Получаем параметры фильтрации
	transactionType := c.Query("type")
	categoryID := c.Query("category_id")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	// Формируем SQL запрос
	query := `
		SELECT t.amount, t.type, t.description, t.date, c.name as category_name
		FROM transactions t
		LEFT JOIN categories c ON t.category_id = c.id
		WHERE t.user_id = $1
	`
	args := []interface{}{userID}
	argIndex := 2

	if transactionType != "" {
		query += fmt.Sprintf(" AND t.type = $%d", argIndex)
		args = append(args, transactionType)
		argIndex++
	}

	if categoryID != "" {
		query += fmt.Sprintf(" AND t.category_id = $%d", argIndex)
		args = append(args, categoryID)
		argIndex++
	}

	if startDate != "" {
		query += fmt.Sprintf(" AND t.date >= $%d", argIndex)
		args = append(args, startDate)
		argIndex++
	}

	if endDate != "" {
		query += fmt.Sprintf(" AND t.date <= $%d", argIndex)
		args = append(args, endDate)
		argIndex++
	}

	query += " ORDER BY t.date DESC"

	// Выполняем запрос
	rows, err := database.GetDB().Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch transactions"})
		return
	}
	defer rows.Close()

	// Устанавливаем заголовки для скачивания
	filename := fmt.Sprintf("transactions_%s.csv", time.Now().Format("2006-01-02"))
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))
	c.Header("Content-Type", "text/csv")

	// Создаем CSV writer
	writer := csv.NewWriter(c.Writer)
	defer writer.Flush()

	// Записываем заголовок
	writer.Write([]string{"Amount", "Type", "Description", "Date", "Category"})

	// Записываем данные
	for rows.Next() {
		var amount float64
		var transactionType, description, categoryName string
		var date time.Time

		err := rows.Scan(&amount, &transactionType, &description, &date, &categoryName)
		if err != nil {
			continue
		}

		writer.Write([]string{
			fmt.Sprintf("%.2f", amount),
			transactionType,
			description,
			date.Format("2006-01-02"),
			categoryName,
		})
	}
}