# CI/CD Configuration

Этот проект использует GitHub Actions для автоматизации процессов разработки, тестирования и деплоя.

## Workflows

### 1. CI/CD Pipeline (`ci.yml`)

Основной pipeline, который запускается при push и pull request:

- **Backend Tests**: Тестирование Go кода с PostgreSQL и Redis
- **Frontend Tests**: Тестирование React приложения
- **Docker Build**: Сборка и публикация Docker образов
- **Security Scan**: Сканирование уязвимостей с помощью Trivy

### 2. Deployment (`deploy.yml`)

Автоматический деплой на различные окружения:

- **Staging**: Автоматический деплой из ветки `main`
- **Production**: Деплой по тегам или ручной запуск
- **Docker Compose**: Пример деплоя через Docker Compose

### 3. PR Preview (`pr-preview.yml`)

Создание preview окружений для Pull Request:

- Автоматическое создание тестового окружения для каждого PR
- Комментарии в PR с ссылками на preview
- Автоматическая очистка после закрытия PR

### 4. Release (`release.yml`)

Автоматическое создание релизов:

- Сборка бинарных файлов для разных платформ
- Создание Docker образов с версионными тегами
- Генерация changelog
- Создание GitHub Release

### 5. Code Quality (`code-quality.yml`)

Проверка качества кода:

- Линтинг и форматирование
- Проверка безопасности
- Анализ размера бандла
- Проверка документации

## Настройка

### Требуемые Secrets

Для полной работы CI/CD необходимо настроить следующие secrets в настройках репозитория:

```
DOCKERHUB_USERNAME      # Имя пользователя Docker Hub (опционально)
DOCKERHUB_TOKEN         # Токен Docker Hub (опционально)
SSH_PRIVATE_KEY         # SSH ключ для деплоя на сервер
DEPLOY_TOKEN           # Токен для webhook деплоя
```

### Настройка окружений

В GitHub необходимо создать окружения:

1. **staging** - для тестового деплоя
2. **production** - для продакшн деплоя

Каждое окружение может иметь свои переменные и правила защиты.

### Переменные окружения

Основные переменные, используемые в workflows:

- `GO_VERSION`: Версия Go (по умолчанию 1.21)
- `NODE_VERSION`: Версия Node.js (по умолчанию 18)
- `REGISTRY`: Docker registry (ghcr.io)
- `IMAGE_NAME`: Имя Docker образа

## Docker Images

Проект создает следующие Docker образы:

- `ghcr.io/[owner]/[repo]-backend`: Go backend приложение
- `ghcr.io/[owner]/[repo]-frontend`: React frontend приложение

Образы автоматически тегируются:

- `latest` - последняя версия из main ветки
- `main-<sha>` - коммит из main ветки
- `v1.2.3` - релизные версии
- `pr-123` - версии для Pull Request

## Локальная разработка

### Pre-commit hooks

Рекомендуется настроить pre-commit hooks для проверки кода:

```bash
# Установка pre-commit
pip install pre-commit

# Настройка hooks
pre-commit install

# Ручной запуск проверок
pre-commit run --all-files
```

### Линтеры

**Backend (Go):**
```bash
cd backend
golangci-lint run
```

**Frontend (React):**
```bash
cd frontend
npm run lint
npm run format
```

## Мониторинг

### GitHub Actions

- Все workflows логируются в разделе Actions
- Неудачные сборки отправляют уведомления
- Можно настроить интеграцию со Slack/Teams

### Docker Images

- Образы сканируются на уязвимости
- Результаты доступны в Security tab
- Старые образы автоматически очищаются

## Troubleshooting

### Частые проблемы

1. **Ошибки в тестах**
   - Проверьте подключение к базе данных
   - Убедитесь, что все зависимости установлены

2. **Ошибки Docker сборки**
   - Проверьте Dockerfile
   - Убедитесь, что все файлы доступны в контексте сборки

3. **Ошибки деплоя**
   - Проверьте SSH ключи и доступ к серверу
   - Убедитесь, что все переменные окружения настроены

### Полезные команды

```bash
# Локальная сборка Docker образов
docker build -t backend ./backend
docker build -t frontend ./frontend

# Запуск локального окружения
docker-compose up -d

# Проверка логов
docker-compose logs -f

# Очистка
docker-compose down -v
```

## Дополнительные возможности

### Dependabot

Автоматическое обновление зависимостей настроено через `dependabot.yml`:

- Go modules обновляются еженедельно
- NPM пакеты обновляются еженедельно
- Docker образы обновляются еженедельно
- GitHub Actions обновляются еженедельно

### Issue Templates

Настроены шаблоны для:

- Bug reports
- Feature requests
- Pull request template

### Branch Protection

Рекомендуется настроить защиту основных веток:

1. Require pull request reviews
2. Require status checks to pass
3. Require branches to be up to date
4. Include administrators