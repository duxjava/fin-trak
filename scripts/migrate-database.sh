#!/bin/bash

# Скрипт для применения миграций базы данных FinTrak
# Этот скрипт очистит базу и применит все миграции

set -e

echo "🚀 Начинаем процесс очистки и миграции базы данных FinTrak..."

# Проверяем, что Docker запущен
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker не запущен. Пожалуйста, запустите Docker и попробуйте снова."
    exit 1
fi

# Проверяем, что контейнер PostgreSQL запущен
if ! docker ps | grep -q "postgres"; then
    echo "🔄 Запускаем PostgreSQL контейнер..."
    docker-compose up -d postgres
    
    # Ждем, пока PostgreSQL будет готов
    echo "⏳ Ждем готовности PostgreSQL..."
    sleep 10
fi

# Проверяем подключение к базе данных
echo "🔍 Проверяем подключение к базе данных..."
if ! docker exec -it $(docker ps -q --filter "ancestor=postgres:15-alpine") pg_isready -U postgres; then
    echo "❌ Не удается подключиться к PostgreSQL"
    exit 1
fi

echo "✅ PostgreSQL готов к работе"

# Очищаем базу данных
echo "🧹 Очищаем базу данных..."
docker exec -i $(docker ps -q --filter "ancestor=postgres:15-alpine") psql -U postgres -d fin_trak < scripts/clear-database-new.sql

echo "✅ База данных очищена"

# Применяем миграции
echo "📦 Применяем миграции..."

# Проверяем, что у нас есть drizzle-kit
if ! command -v npx &> /dev/null; then
    echo "❌ npx не найден. Установите Node.js и npm"
    exit 1
fi

# Применяем миграции
npx drizzle-kit push

echo "✅ Миграции применены"

# Проверяем структуру базы данных
echo "🔍 Проверяем структуру базы данных..."
docker exec -i $(docker ps -q --filter "ancestor=postgres:15-alpine") psql -U postgres -d fin_trak -c "
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('users', 'groups', 'group_members', 'currencies', 'accounts', 'transactions', 'transfers')
ORDER BY table_name, ordinal_position;
"

echo "🎉 Процесс завершен успешно!"
echo ""
echo "📋 Структура базы данных:"
echo "   - users: пользователи"
echo "   - groups: группы"
echo "   - group_members: участники групп"
echo "   - currencies: валюты"
echo "   - accounts: счета"
echo "   - transactions: транзакции (только expense/income)"
echo "   - transfers: переводы между счетами"
echo ""
echo "🚀 База данных готова к использованию!"
