#!/bin/bash

# Загружаем переменные окружения из .env.local
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

# Выполняем команду с загруженными переменными
exec "$@"
