#!/bin/bash

# Personal Finance App - Quick Start Script
# Скрипт для быстрого запуска приложения

set -e

echo "🚀 Запуск Personal Finance App..."
echo "=================================="

# Проверяем наличие Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен. Пожалуйста, установите Docker и попробуйте снова."
    exit 1
fi

# Проверяем наличие Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose не установлен. Пожалуйста, установите Docker Compose и попробуйте снова."
    exit 1
fi

echo "✅ Docker и Docker Compose найдены"

# Останавливаем существующие контейнеры
echo "🛑 Останавливаем существующие контейнеры..."
docker-compose down

# Удаляем старые образы (опционально)
read -p "🗑️  Удалить старые образы? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🧹 Удаляем старые образы..."
    docker-compose down --rmi all
fi

# Создаем .env файл если его нет
if [ ! -f "backend/.env" ]; then
    echo "📝 Создаем .env файл..."
    cp backend/.env.example backend/.env
    echo "✅ .env файл создан"
fi

# Запускаем приложение
echo "🚀 Запускаем приложение..."
docker-compose up -d

# Ждем запуска сервисов
echo "⏳ Ждем запуска сервисов..."
sleep 10

# Проверяем статус
echo "📊 Статус сервисов:"
docker-compose ps

echo ""
echo "🎉 Приложение запущено!"
echo "=================================="
echo "🌐 Фронтенд: http://localhost:3000"
echo "🔧 API: http://localhost:8080"
echo "🗄️  База данных: localhost:5432"
echo "🔴 Redis: localhost:6379"
echo ""
echo "📋 Полезные команды:"
echo "  Просмотр логов: docker-compose logs -f"
echo "  Остановка: docker-compose down"
echo "  Перезапуск: docker-compose restart"
echo "  Обновление: docker-compose pull && docker-compose up -d"
echo ""
echo "📚 Документация: README.md"
echo "=================================="