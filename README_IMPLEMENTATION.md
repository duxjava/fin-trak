# 🚀 Модуль аутентификации для приложения личных финансов

Этот документ описывает реализованный модуль аутентификации и базовые модели для приложения личных финансов.

## ✨ Что реализовано

### Backend (Go)
- ✅ **Модели данных**: User, Transaction, Category, Budget, Goal с GORM тегами
- ✅ **Подключение к PostgreSQL**: Автоматическая миграция таблиц
- ✅ **Аутентификация**: Регистрация, вход, JWT токены в HTTP-only cookies
- ✅ **Middleware**: Защита маршрутов с проверкой JWT
- ✅ **API endpoints**: `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`

### Frontend (React + TypeScript)
- ✅ **Типы TypeScript**: Интерфейсы для всех моделей
- ✅ **Контекст аутентификации**: Управление состоянием пользователя
- ✅ **API клиент**: Axios с обработкой JWT cookies
- ✅ **Форма входа**: Вкладки "Вход" / "Регистрация" с валидацией
- ✅ **Защищенные маршруты**: Автоматическое перенаправление неавторизованных пользователей
- ✅ **Dashboard**: Простая главная страница для авторизованных пользователей

## 🏗️ Структура проекта

```
project/
├── backend/
│   ├── cmd/main.go                 # Главный файл приложения
│   ├── internal/
│   │   ├── models/                 # Модели данных
│   │   │   ├── models.go           # Все модели с GORM тегами
│   │   │   └── index.go            # Экспорт моделей для миграции
│   │   ├── handlers/               # HTTP обработчики
│   │   │   └── auth.go             # Обработчики аутентификации
│   │   ├── services/               # Бизнес-логика
│   │   │   └── auth_service.go     # Сервис аутентификации
│   │   ├── middleware/             # Middleware
│   │   │   └── auth.go             # Middleware для проверки JWT
│   │   └── routes/                 # Роуты
│   │       └── auth.go             # Роуты аутентификации
│   ├── pkg/database/               # Подключение к БД
│   │   └── database.go             # Функция подключения с GORM
│   ├── go.mod                      # Зависимости Go
│   └── .env                        # Переменные окружения
├── frontend/
│   ├── src/
│   │   ├── components/             # React компоненты
│   │   │   ├── AuthForm.tsx        # Форма аутентификации
│   │   │   └── Layout.tsx          # Layout с навигацией
│   │   ├── pages/                  # Страницы
│   │   │   ├── LoginPage.tsx       # Страница входа
│   │   │   ├── Dashboard.tsx       # Главная страница
│   │   │   └── [другие страницы]   # Заглушки для остальных страниц
│   │   ├── contexts/               # React контексты
│   │   │   └── AuthContext.tsx     # Контекст аутентификации
│   │   ├── types/                  # TypeScript типы
│   │   │   └── index.ts            # Интерфейсы для всех моделей
│   │   ├── utils/                  # Утилиты
│   │   │   └── api.ts              # API клиент с axios
│   │   ├── App.tsx                 # Главный компонент
│   │   └── vite-env.d.ts           # Типы для Vite
│   ├── package.json                # Зависимости Node.js
│   └── .env                        # Переменные окружения
└── docker-compose.yml              # Docker конфигурация
```

## 🚀 Быстрый запуск

### Предварительные требования

#### Установка Docker и Docker Compose

**Ubuntu/Debian:**
```bash
# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Установка Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin

# Перезапуск сессии
newgrp docker
```

**macOS:**
```bash
# Установка через Homebrew
brew install --cask docker
```

**Windows:**
- Скачайте Docker Desktop с [официального сайта](https://www.docker.com/products/docker-desktop)

#### Установка Go (для разработки)

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install golang-go
```

**macOS:**
```bash
brew install go
```

**Windows:**
- Скачайте Go с [официального сайта](https://golang.org/dl/)

#### Установка Node.js (для разработки)

**Ubuntu/Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**macOS:**
```bash
brew install node
```

**Windows:**
- Скачайте Node.js с [официального сайта](https://nodejs.org/)

### 1. Клонирование и настройка
```bash
git clone <your-repo>
cd personal-finance-app
```

### 2. Запуск через Docker Compose
```bash
# Запуск всех сервисов
docker compose up -d

# Просмотр логов
docker compose logs -f
```

### 3. Проверка работы
- **Backend API**: http://localhost:8080/health
- **Frontend**: http://localhost:3000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## 🔧 Ручной запуск (для разработки)

### Установка PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# Запуск сервиса
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Создание пользователя и базы данных
sudo -u postgres psql
CREATE USER postgres WITH PASSWORD 'password';
CREATE DATABASE personal_finance;
GRANT ALL PRIVILEGES ON DATABASE personal_finance TO postgres;
\q
```

**macOS:**
```bash
brew install postgresql
brew services start postgresql

# Создание пользователя и базы данных
createdb personal_finance
```

### Backend
```bash
cd backend

# Установка зависимостей
go mod tidy

# Запуск приложения
go run cmd/main.go
```

### Frontend
```bash
cd frontend

# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run dev
```

## 🔐 API Endpoints

### Аутентификация
- `POST /api/auth/register` - Регистрация пользователя
- `POST /api/auth/login` - Вход пользователя
- `POST /api/auth/logout` - Выход пользователя
- `GET /api/auth/me` - Получение профиля (защищенный)

### Примеры запросов

#### Регистрация
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

#### Вход
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

## 🔒 Безопасность

- **Пароли**: Хешируются с помощью bcrypt
- **JWT токены**: Хранятся в HTTP-only cookies
- **CORS**: Настроен для безопасности
- **Валидация**: Проверка входных данных

## 📝 Переменные окружения

### Backend (.env)
```env
DB_URL=postgres://postgres:password@localhost:5432/personal_finance?sslmode=disable
JWT_SECRET=your-super-secret-jwt-key-change-in-production
PORT=8080
GIN_MODE=debug
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8080
```

## 🧪 Тестирование

### Backend
```bash
cd backend
go test ./...
```

### Frontend
```bash
cd frontend
npm test
```

## 📚 Следующие шаги

После успешного запуска модуля аутентификации можно реализовать:

1. **CRUD операции** для транзакций, бюджетов и целей
2. **Валидацию данных** на фронтенде
3. **Обработку ошибок** и уведомления
4. **Тесты** для всех компонентов
5. **Документацию API** (Swagger)
6. **Логирование** и мониторинг

## 🐛 Устранение неполадок

### Проблемы с Docker
```bash
# Проверка статуса Docker
docker --version
docker compose version

# Перезапуск Docker
sudo systemctl restart docker
```

### Проблемы с базой данных
```bash
# Проверка подключения к PostgreSQL
docker compose exec postgres psql -U postgres -d personal_finance

# Сброс данных
docker compose down -v
docker compose up -d
```

### Проблемы с фронтендом
```bash
# Очистка кэша
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Проблемы с бэкендом
```bash
# Проверка зависимостей
cd backend
go mod verify
go mod tidy
```

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи: `docker compose logs -f`
2. Убедитесь, что все сервисы запущены: `docker compose ps`
3. Проверьте переменные окружения
4. Убедитесь, что порты не заняты другими приложениями

## 🎯 Демонстрация работы

1. **Откройте** http://localhost:3000
2. **Зарегистрируйтесь** с новым email и паролем
3. **Войдите** в систему
4. **Просмотрите** Dashboard с приветствием
5. **Проверьте** защищенные маршруты

---

**🎉 Поздравляем!** Модуль аутентификации успешно реализован и готов к использованию.

## 🔍 Проверка работоспособности

### Backend
```bash
# Проверка health endpoint
curl http://localhost:8080/health

# Регистрация пользователя
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Вход пользователя
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Frontend
- Откройте http://localhost:3000
- Попробуйте зарегистрироваться и войти
- Проверьте, что после входа вы попадаете на Dashboard
- Проверьте, что кнопка "Выйти" работает

## 🚀 Альтернативный запуск без Docker

Если у вас нет Docker, вы можете запустить приложение локально:

### 1. Запуск PostgreSQL
```bash
# Ubuntu/Debian
sudo systemctl start postgresql

# macOS
brew services start postgresql
```

### 2. Создание базы данных
```bash
sudo -u postgres psql
CREATE DATABASE personal_finance;
\q
```

### 3. Запуск Backend
```bash
cd backend
go run cmd/main.go
```

### 4. Запуск Frontend
```bash
cd frontend
npm run dev
```

## 📋 Чек-лист для проверки

- [ ] Docker и Docker Compose установлены
- [ ] PostgreSQL запущен (локально или через Docker)
- [ ] Backend компилируется: `go build ./cmd/main.go`
- [ ] Frontend компилируется: `npm run build`
- [ ] Backend запускается: `go run cmd/main.go`
- [ ] Frontend запускается: `npm run dev`
- [ ] API доступен: `curl http://localhost:8080/health`
- [ ] Frontend доступен: http://localhost:3000
- [ ] Регистрация работает
- [ ] Вход работает
- [ ] Dashboard отображается после входа
- [ ] Выход работает