# Деплой и миграции

## 🚀 Деплой в продакшн

### Автоматический деплой миграций

При сборке проекта (`npm run build`) автоматически выполняются миграции базы данных.

### Ручной деплой миграций

```bash
# Применить миграции к продакшн базе данных
npm run db:deploy
```

### Настройка переменных окружения

Убедитесь, что в продакшн окружении установлены следующие переменные:

```bash
DATABASE_URL=postgresql://username:password@host:port/database_name
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-production-secret-key
NODE_ENV=production
```

## 📋 Процесс деплоя

### 1. Разработка
```bash
# Изменяете схему в lib/schema.ts
# Создаете миграцию
npm run db:generate
# Тестируете локально
npm run dev
```

### 2. Коммит и пуш
```bash
git add .
git commit -m "feat: add new table"
git push
```

### 3. Деплой
```bash
# Сборка и автоматическое применение миграций
npm run build
# Или только миграции
npm run db:deploy
```

## 🔧 Настройка CI/CD

### GitHub Actions пример

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run db:deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### Vercel

1. Установите переменные окружения в настройках проекта
2. Добавьте Build Command: `npm run build`
3. Миграции применятся автоматически после сборки

## ⚠️ Важные моменты

1. **Миграции в git**: Папка `drizzle/` должна быть в git репозитории
2. **Бэкап**: Всегда делайте бэкап базы данных перед применением миграций
3. **Тестирование**: Тестируйте миграции на staging окружении
4. **Откат**: Подготовьте план отката для критических миграций

## 🛠️ Полезные команды

```bash
# Просмотр миграций
ls -la drizzle/

# Проверка статуса миграций
npm run db:up

# Открытие Drizzle Studio
npm run db:studio
```
