# Настройка CI/CD для GitHub

Этот документ содержит инструкции по настройке и использованию CI/CD pipeline для проекта Personal Finance App.

## 🚀 Быстрый старт

### 1. Первоначальная настройка

```bash
# Клонируйте репозиторий
git clone https://github.com/your-username/personal-finance-app.git
cd personal-finance-app

# Установите pre-commit hooks (опционально)
pip install pre-commit
pre-commit install

# Сделайте первый коммит с CI/CD настройками
git add .
git commit -m "feat: добавить CI/CD конфигурацию"
git push origin main
```

### 2. Настройка GitHub

1. **Включите GitHub Actions** в настройках репозитория
2. **Настройте окружения**:
   - Перейдите в Settings → Environments
   - Создайте `staging` и `production` окружения
   - Добавьте protection rules для production

3. **Добавьте Secrets** (Settings → Secrets and variables → Actions):
   ```
   DOCKERHUB_USERNAME      # (опционально) для Docker Hub
   DOCKERHUB_TOKEN         # (опционально) для Docker Hub
   SSH_PRIVATE_KEY         # для деплоя на сервер
   DEPLOY_TOKEN           # для webhook деплоя
   ```

## 📋 Структура Workflows

### Основные workflows:

1. **`ci.yml`** - Основной CI/CD pipeline
2. **`deploy.yml`** - Деплой на production/staging
3. **`pr-preview.yml`** - Preview окружения для PR
4. **`release.yml`** - Создание релизов
5. **`code-quality.yml`** - Проверка качества кода

## 🔧 Конфигурационные файлы

```
.github/
├── workflows/
│   ├── ci.yml              # Основной CI/CD
│   ├── deploy.yml          # Деплой
│   ├── pr-preview.yml      # PR Preview
│   ├── release.yml         # Релизы
│   └── code-quality.yml    # Качество кода
├── dependabot.yml          # Обновление зависимостей
├── pull_request_template.md # Шаблон PR
├── ISSUE_TEMPLATE/
│   ├── bug_report.md       # Шаблон багрепорта
│   └── feature_request.md  # Шаблон feature request
└── README.md              # Документация CI/CD
```

## 🏗 Что происходит в CI/CD

### При Push в main/develop:

1. **Тестирование Backend**:
   - Запуск PostgreSQL и Redis в контейнерах
   - Установка Go зависимостей
   - Линтинг с golangci-lint
   - Запуск тестов с покрытием
   - Сборка приложения

2. **Тестирование Frontend**:
   - Установка Node.js зависимостей
   - ESLint проверки
   - TypeScript проверки
   - Запуск тестов (если есть)
   - Сборка production bundle

3. **Docker Build**:
   - Сборка backend и frontend образов
   - Публикация в GitHub Container Registry
   - Тегирование по ветке и SHA

4. **Security Scan**:
   - Сканирование Docker образов на уязвимости
   - Загрузка результатов в GitHub Security

### При создании Pull Request:

1. Все проверки из CI
2. Создание preview окружения
3. Комментарий в PR с ссылками
4. Проверка размера bundle
5. Анализ изменений

### При создании Release (тег v*):

1. Сборка бинарных файлов для разных платформ
2. Создание multi-arch Docker образов
3. Генерация changelog
4. Создание GitHub Release с артефактами
5. Автоматический деплой в production

## 🚀 Деплой

### Staging (автоматический)

Каждый push в `main` автоматически деплоится на staging:

```bash
git checkout main
git merge feature-branch
git push origin main  # Автоматический деплой на staging
```

### Production (по тегам)

```bash
# Создание релиза
git tag v1.0.0
git push origin v1.0.0  # Автоматический деплой на production
```

### Ручной деплой

```bash
# Через GitHub Actions UI
# 1. Перейти в Actions → Deploy to Production
# 2. Нажать "Run workflow"
# 3. Выбрать окружение и запустить
```

## 🔧 Локальная разработка

### Установка зависимостей

```bash
# Backend
cd backend
go mod download

# Frontend
cd frontend
npm install

# Pre-commit hooks
pip install pre-commit
pre-commit install
```

### Запуск проверок локально

```bash
# Go линтинг
cd backend && golangci-lint run

# Frontend линтинг
cd frontend && npm run lint

# Форматирование
cd frontend && npm run format

# Все проверки
pre-commit run --all-files
```

### Локальное тестирование

```bash
# Запуск всего стека
docker-compose up -d

# Только тесты
cd backend && go test ./...
cd frontend && npm test
```

## 📊 Мониторинг

### GitHub Actions

- **Actions tab**: История всех запусков
- **Security tab**: Результаты сканирования безопасности
- **Insights → Dependency graph**: Анализ зависимостей

### Docker Images

- **Packages tab**: Все Docker образы
- Автоматическое сканирование уязвимостей
- Теги и размеры образов

### Уведомления

Настройте уведомления в Settings → Notifications:
- Email при неудачных сборках
- Slack/Teams интеграция
- Mobile push уведомления

## 🐛 Troubleshooting

### Частые проблемы

1. **Тесты падают на CI, но работают локально**:
   ```bash
   # Проверьте версии Go/Node
   # Убедитесь, что БД доступна
   # Проверьте переменные окружения
   ```

2. **Docker build fails**:
   ```bash
   # Проверьте Dockerfile
   # Убедитесь, что все файлы в контексте
   # Проверьте .dockerignore
   ```

3. **Деплой не работает**:
   ```bash
   # Проверьте SSH ключи
   # Убедитесь, что сервер доступен
   # Проверьте переменные окружения
   ```

### Полезные команды

```bash
# Проверка статуса workflow
gh run list

# Просмотр логов последнего запуска
gh run view --log

# Перезапуск неудачного workflow
gh run rerun <run-id>

# Локальное тестирование с act
act -j test
```

## 📚 Дополнительные возможности

### Branch Protection Rules

Рекомендуемые настройки для main ветки:

1. ✅ Require pull request reviews before merging
2. ✅ Require status checks to pass before merging
3. ✅ Require branches to be up to date before merging
4. ✅ Include administrators
5. ✅ Allow force pushes (только для emergency fixes)

### Dependabot

Автоматические обновления настроены для:
- Go modules (еженедельно, понедельник)
- NPM packages (еженедельно, понедельник)
- Docker images (еженедельно, вторник)
- GitHub Actions (еженедельно, среда)

### Code Quality Gates

Автоматические проверки:
- Go: golangci-lint, go vet, tests, coverage
- Frontend: ESLint, TypeScript, Prettier, tests
- Docker: Hadolint, security scan
- General: файловая структура, форматирование

## 🎯 Best Practices

### Коммиты

```bash
# Используйте conventional commits
feat: добавить аутентификацию пользователей
fix: исправить утечку памяти в API
docs: обновить README
ci: улучшить скорость сборки
```

### Pull Requests

1. Небольшие, фокусированные изменения
2. Описательное название и описание
3. Связанные issues
4. Готовый к review код
5. Прохождение всех проверок

### Релизы

1. Семантическое версионирование (SemVer)
2. Подробный changelog
3. Тестирование на staging перед production
4. Rollback план для критических изменений

### Безопасность

1. Никогда не коммитить secrets
2. Регулярные обновления зависимостей
3. Сканирование уязвимостей
4. Code review для всех изменений
5. Принцип минимальных привилегий