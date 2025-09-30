#!/bin/bash

# Скрипт для импорта CSV файла
# Использование: ./import-csv.sh [файл.csv]

CSV_FILE=${1:-"zen_2025-09-28_dumpof_transactions_from_alltime.csv"}
API_URL="http://localhost:3000/api/import-csv"

echo "Импорт CSV файла: $CSV_FILE"
echo "API URL: $API_URL"

# Проверяем, что файл существует
if [ ! -f "$CSV_FILE" ]; then
    echo "Ошибка: Файл $CSV_FILE не найден"
    exit 1
fi

# Проверяем, что сервер запущен
if ! curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
    echo "Ошибка: Сервер не запущен на localhost:3000"
    echo "Запустите сервер командой: npm run dev"
    exit 1
fi

echo "Отправляем файл на сервер..."

# Отправляем файл на сервер
response=$(curl -s -X POST \
    -F "file=@$CSV_FILE" \
    -F "action=import" \
    "$API_URL")

echo "Ответ сервера:"
echo "$response"

# Проверяем успешность импорта
if echo "$response" | grep -q '"success":true'; then
    echo "✅ Импорт успешно завершен!"
else
    echo "❌ Ошибка при импорте"
    exit 1
fi
