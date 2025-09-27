# 🚀 CI/CD Setup Documentation

Этот документ описывает настройку CI/CD pipeline для проекта личных финансов с использованием GitHub Actions.

## 📋 Обзор CI/CD Pipeline

### 🔄 Основные Workflow

1. **CI Pipeline** (`.github/workflows/ci.yml`)
   - Тестирование и сборка backend (Go)
   - Тестирование и сборка frontend (React/TypeScript)
   - Сканирование безопасности
   - Сборка и публикация Docker образов

2. **Deployment Pipeline** (`.github/workflows/deploy.yml`)
   - Автоматический деплой на staging при push в main
   - Деплой в production при создании тега
   - Rollback механизм при ошибках

3. **Release Pipeline** (`.github/workflows/release.yml`)
   - Создание релизов при создании тегов
   - Генерация changelog
   - Сборка бинарных файлов для разных платформ

4. **Security Scanning** (`.github/workflows/docker-security-scan.yml`)
   - Ежедневное сканирование Docker образов
   - Интеграция с Trivy и Snyk

5. **Dependency Updates** (`.github/workflows/dependency-update.yml`)
   - Еженедельное обновление зависимостей
   - Автоматическое создание PR

## 🛠️ Необходимые Секреты GitHub

Для работы CI/CD pipeline необходимо настроить следующие секреты в GitHub:

### Staging Environment
```bash
STAGING_DB_HOST=your-staging-db-host
STAGING_DB_PORT=5432
STAGING_DB_USER=staging_user
STAGING_DB_PASSWORD=staging_password
STAGING_DB_NAME=staging_finance_db
STAGING_REDIS_ADDR=your-staging-redis:6379
STAGING_REDIS_PASSWORD=staging_redis_password
STAGING_JWT_SECRET=staging-jwt-secret-key
STAGING_API_URL=https://staging-api.yourdomain.com
```

### Production Environment
```bash
PROD_DB_HOST=your-production-db-host
PROD_DB_PORT=5432
PROD_DB_USER=prod_user
PROD_DB_PASSWORD=prod_password
PROD_DB_NAME=production_finance_db
PROD_REDIS_ADDR=your-production-redis:6379
PROD_REDIS_PASSWORD=production_redis_password
PROD_JWT_SECRET=production-jwt-secret-key
PROD_API_URL=https://api.yourdomain.com
```

### Optional Services
```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
SNYK_TOKEN=your-snyk-api-token
```

## 🚀 Процесс Деплоя

### 1. Staging Deployment
```bash
# Автоматически при push в main
git push origin main
```

### 2. Production Deployment
```bash
# Создание тега для релиза
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

### 3. Manual Deployment
```bash
# Через GitHub Actions UI
# Go to Actions → Deploy to Production → Run workflow
```

## 🔧 Локальная Разработка

### Использование Makefile
```bash
# Настройка среды разработки
make dev-setup

# Запуск тестов
make test

# Линтинг кода
make lint

# Форматирование кода
make format

# Сборка проекта
make build-all

# Запуск с Docker
make docker-run

# Просмотр логов
make docker-logs

# Остановка контейнеров
make docker-stop
```

### Локальное тестирование CI
```bash
# Установка act для локального тестирования GitHub Actions
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Запуск CI локально
act push

# Запуск определенного workflow
act -W .github/workflows/ci.yml
```

## 🛡️ Безопасность

### Настройка сканирования безопасности
1. **Trivy** - встроенное сканирование уязвимостей
2. **Snyk** - требует токен для расширенного сканирования
3. **golangci-lint** - статический анализ Go кода
4. **ESLint** - статический анализ TypeScript/React кода

### Настройка SAST/DAST
```yaml
# Добавить в workflow для дополнительной безопасности
- name: CodeQL Analysis
  uses: github/codeql-action/analyze@v2
  with:
    languages: go, javascript
```

## 📊 Мониторинг и Логирование

### Healthcheck Endpoints
```bash
# Backend health check
GET /health

# Frontend health check (через nginx)
GET /
```

### Логирование
- Все контейнеры настроены с ротацией логов
- Логи доступны через `docker-compose logs`
- В production рекомендуется настроить centralized logging

## 🐳 Docker Configuration

### Development
```bash
docker-compose up -d
```

### Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Переменные окружения
Скопируйте `.env.example` в `.env` и настройте необходимые значения:
```bash
cp .env.example .env
```

## 🔄 Процесс Code Review

### Автоматические проверки
- ✅ Все тесты проходят
- ✅ Линтинг без ошибок
- ✅ Сканирование безопасности
- ✅ Сборка успешна

### Manual Review Checklist
- [ ] Код соответствует стандартам проекта
- [ ] Добавлены тесты для новой функциональности
- [ ] Документация обновлена
- [ ] Нет breaking changes без версионирования

## 📈 Масштабирование

### Horizontal Scaling
```yaml
# docker-compose.prod.yml
backend:
  deploy:
    replicas: 3
    update_config:
      parallelism: 1
      delay: 10s
```

### Load Balancing
```nginx
# nginx configuration for load balancing
upstream backend {
    server backend1:8080;
    server backend2:8080;
    server backend3:8080;
}
```

## 🔧 Troubleshooting

### Общие проблемы

1. **Тесты падают в CI**
   ```bash
   # Проверить локально
   make test
   
   # Проверить переменные окружения
   cat .env.example
   ```

2. **Docker образы не собираются**
   ```bash
   # Проверить Dockerfile
   docker build -t test ./backend
   docker build -t test ./frontend
   ```

3. **Деплой не проходит**
   ```bash
   # Проверить секреты GitHub
   # Проверить переменные окружения
   # Проверить логи в GitHub Actions
   ```

### Логи и Отладка
```bash
# Посмотреть логи CI
gh run list
gh run view <run-id>

# Локальные логи
make docker-logs

# Проверить статус сервисов
docker-compose ps
```

## 📚 Дополнительные Ресурсы

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Makefile Tutorial](https://makefiletutorial.com/)
- [Go Testing Best Practices](https://golang.org/doc/tutorial/add-a-test)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

## 🤝 Contribution Guidelines

1. Создайте ветку для новой функциональности
2. Следуйте naming convention: `feature/description`, `fix/description`
3. Убедитесь, что все тесты проходят
4. Создайте PR с подробным описанием
5. Дождитесь review и approval

---

**📞 Поддержка**: Если у вас есть вопросы по CI/CD setup, создайте issue в репозитории.