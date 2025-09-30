#!/bin/bash

# Загружаем переменные окружения
export $(cat .env.local | grep -v '^#' | xargs)

# Запускаем Drizzle Studio
npx drizzle-kit studio

