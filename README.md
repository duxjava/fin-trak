# 💰 **Приложение для ведения личных финансов**

Современное веб-приложение для управления личными финансами, построенное на **React + TypeScript** (фронтенд) и **Go + PostgreSQL** (бэкенд).

## ✨ **Основные возможности**

- 📊 **Управление транзакциями** - добавление, редактирование, удаление доходов и расходов
- 🏷️ **Категоризация** - создание и управление категориями трат
- 💸 **Бюджетирование** - установка месячных лимитов по категориям
- 🎯 **Финансовые цели** - постановка и отслеживание целей
- 📈 **Аналитика** - графики и диаграммы для анализа трат
- 📁 **Импорт/Экспорт** - работа с CSV файлами
- 🔔 **Уведомления** - предупреждения о превышении бюджета
- 🔐 **Безопасность** - JWT аутентификация и защита данных

## 🛠️ **Технологический стек**

### **Backend (Go)**
- **Язык**: Go 1.21+
- **Фреймворк**: Gin (веб-фреймворк)
- **База данных**: PostgreSQL 15
- **Кэширование**: Redis
- **Аутентификация**: JWT + bcrypt
- **Валидация**: go-playground/validator
- **Миграции**: Автоматическое создание таблиц

### **Frontend (React)**
- **Язык**: TypeScript
- **Фреймворк**: React 18
- **Сборщик**: Vite
- **Стили**: Tailwind CSS
- **Роутинг**: React Router DOM
- **Формы**: React Hook Form
- **Графики**: Recharts
- **Уведомления**: React Hot Toast

### **Инфраструктура**
- **Контейнеризация**: Docker + Docker Compose
- **Прокси**: Nginx (опционально)
- **Развертывание**: Готово для VPS, Render, Railway, AWS

## 🚀 **Быстрый старт**

### **Предварительные требования**
- Docker и Docker Compose
- Go 1.21+ (для локальной разработки)
- Node.js 18+ (для локальной разработки)

### **1. Клонирование репозитория**
```bash
git clone <repository-url>
cd personal-finance-app
```

### **2. Запуск с Docker Compose**
```bash
# Запуск всех сервисов
docker-compose up -d

# Просмотр логов
docker-compose logs -f

# Остановка
docker-compose down
```

### **3. Быстрый запуск (рекомендуется)**
```bash
# Сделать скрипт исполняемым
chmod +x start.sh

# Запустить приложение
./start.sh
```

### **4. Доступ к приложению**
- **Фронтенд**: http://localhost:3000
- **Бэкенд API**: http://localhost:8080
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## 🔧 **Локальная разработка**

### **Backend (Go)**
```bash
cd backend

# Установка зависимостей
go mod download

# Создание .env файла
cp .env.example .env

# Запуск сервера
go run cmd/main.go
```

### **Frontend (React)**
```bash
cd frontend

# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run dev
```

## 📊 **Структура базы данных**

### **Основные таблицы**
- `users` - пользователи системы
- `categories` - категории транзакций
- `transactions` - финансовые транзакции
- `budgets` - месячные бюджеты по категориям
- `goals` - финансовые цели

### **Пример SQL запроса**
```sql
-- Получение расходов по категориям за текущий месяц
SELECT 
    c.name as category_name,
    SUM(t.amount) as total_spent
FROM transactions t
JOIN categories c ON t.category_id = c.id
WHERE t.user_id = $1 
    AND t.type = 'expense'
    AND EXTRACT(MONTH FROM t.date) = EXTRACT(MONTH FROM CURRENT_DATE)
    AND EXTRACT(YEAR FROM t.date) = EXTRACT(YEAR FROM CURRENT_DATE)
GROUP BY c.id, c.name
ORDER BY total_spent DESC;
```

## 🔐 **Безопасность**

### **Аутентификация**
- JWT токены с HTTP-only cookies
- Хеширование паролей с bcrypt
- Автоматическое обновление токенов

### **Защита от атак**
- CORS настройки
- Rate limiting (100 запросов/минуту)
- Валидация входных данных
- Защита от XSS и CSRF

### **Переменные окружения**
```bash
# База данных
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=personal_finance

# Redis
REDIS_ADDR=localhost:6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-super-secret-key

# Сервер
PORT=8080
GIN_MODE=debug
```

## 📁 **Структура проекта**

```
personal-finance-app/
├── backend/                 # Go бэкенд
│   ├── cmd/                # Точка входа
│   │   └── main.go         # Главный файл
│   ├── internal/           # Внутренняя логика
│   │   ├── handlers/       # HTTP обработчики
│   │   ├── services/       # Бизнес-логика
│   │   ├── repositories/   # Работа с БД
│   │   ├── models/         # Модели данных
│   │   └── middleware/     # Промежуточное ПО
│   ├── pkg/                # Публичные пакеты
│   │   ├── database/       # Подключение к БД
│   │   ├── auth/           # Аутентификация
│   │   └── utils/          # Утилиты
│   ├── migrations/         # Миграции БД
│   ├── go.mod              # Go модули
│   └── Dockerfile          # Docker образ
├── frontend/                # React фронтенд
│   ├── src/                # Исходный код
│   │   ├── components/     # React компоненты
│   │   ├── pages/          # Страницы приложения
│   │   ├── hooks/          # React хуки
│   │   ├── utils/          # Утилиты
│   │   ├── types/          # TypeScript типы
│   │   └── contexts/       # React контексты
│   ├── package.json        # NPM зависимости
│   ├── tailwind.config.js  # Tailwind CSS
│   ├── vite.config.ts      # Vite конфигурация
│   └── Dockerfile          # Docker образ
├── docker/                  # Docker конфигурация
├── docker-compose.yml       # Docker Compose
├── start.sh                 # Скрипт запуска
└── README.md               # Документация
```

## 🚀 **API Endpoints**

### **Аутентификация**
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `POST /api/auth/logout` - Выход
- `GET /api/auth/me` - Профиль пользователя

### **Транзакции**
- `GET /api/transactions` - Список транзакций
- `POST /api/transactions` - Создание транзакции
- `GET /api/transactions/:id` - Получение транзакции
- `PUT /api/transactions/:id` - Обновление транзакции
- `DELETE /api/transactions/:id` - Удаление транзакции
- `POST /api/transactions/import` - Импорт CSV
- `GET /api/transactions/export` - Экспорт CSV

### **Категории**
- `GET /api/categories` - Список категорий
- `POST /api/categories` - Создание категории
- `PUT /api/categories/:id` - Обновление категории
- `DELETE /api/categories/:id` - Удаление категории

### **Бюджеты**
- `GET /api/budgets` - Список бюджетов
- `POST /api/budgets` - Создание бюджета
- `PUT /api/budgets/:id` - Обновление бюджета
- `DELETE /api/budgets/:id` - Удаление бюджета

### **Цели**
- `GET /api/goals` - Список целей
- `POST /api/goals` - Создание цели
- `PUT /api/goals/:id` - Обновление цели
- `DELETE /api/goals/:id` - Удаление цели

### **Аналитика**
- `GET /api/analytics/summary` - Сводка
- `GET /api/analytics/chart` - Данные для графиков
- `GET /api/analytics/budget-status` - Статус бюджетов

## 📈 **Развертывание**

### **VPS/Хостинг**
1. Клонируйте репозиторий на сервер
2. Настройте переменные окружения
3. Запустите `docker-compose up -d`
4. Настройте Nginx для проксирования

### **Облачные платформы**
- **Render**: Автоматический деплой из Git
- **Railway**: Простое развертывание
- **AWS**: ECS + RDS + ElastiCache
- **Google Cloud**: Cloud Run + Cloud SQL

## 🧪 **Тестирование**

### **Backend тесты**
```bash
cd backend
go test ./...
```

### **Frontend тесты**
```bash
cd frontend
npm test
```

## 🤝 **Вклад в проект**

1. Форкните репозиторий
2. Создайте ветку для новой функции
3. Внесите изменения
4. Создайте Pull Request

## 📝 **Лицензия**

MIT License - см. файл [LICENSE](LICENSE)

## 🆘 **Поддержка**

- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Email**: [your-email@example.com]

## 🚨 **Важные замечания**

### **Для разработки**
- Приложение находится в стадии разработки
- Некоторые компоненты могут быть не полностью реализованы
- Рекомендуется использовать Docker для запуска

### **Для продакшена**
- Измените JWT_SECRET в .env файле
- Настройте HTTPS
- Используйте production базу данных
- Настройте мониторинг и логирование

---

**Создано с ❤️ для управления личными финансами**

## 🎯 **Следующие шаги**

1. **Запустите приложение**: `./start.sh`
2. **Изучите код**: начните с `backend/cmd/main.go` и `frontend/src/App.tsx`
3. **Настройте базу данных**: создайте пользователя и категории
4. **Добавьте функциональность**: реализуйте недостающие компоненты
5. **Настройте CI/CD**: добавьте автоматическое тестирование и деплой
