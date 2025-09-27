#!/bin/bash

# Скрипт для применения миграций в продакшн окружении
# Использование: ./scripts/deploy-migrations.sh

set -e

echo "🚀 Начинаем деплой миграций..."

# Проверяем наличие переменной окружения DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Ошибка: DATABASE_URL не установлен"
    exit 1
fi

echo "📋 Проверяем наличие миграций..."
if [ ! -d "drizzle" ]; then
    echo "❌ Ошибка: Папка drizzle не найдена"
    exit 1
fi

# Проверяем, есть ли SQL файлы миграций
sql_files=$(find drizzle -name "*.sql" | wc -l)
if [ "$sql_files" -eq 0 ]; then
    echo "❌ Ошибка: SQL файлы миграций не найдены"
    exit 1
fi

echo "✅ Найдено $sql_files SQL файлов миграций"

echo "🔄 Применяем миграции к базе данных..."
npm run db:push

echo "✅ Миграции успешно применены!"
echo "🎉 Деплой завершен"
