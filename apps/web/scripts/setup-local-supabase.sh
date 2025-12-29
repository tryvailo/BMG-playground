#!/bin/bash
# Скрипт для запуска локального Supabase и применения миграции

set -e

echo "🚀 Настройка локального Supabase для Local Indicators..."

cd "$(dirname "$0")/.."

# Проверка Docker
echo "🔍 Проверка Docker..."
if ! docker ps > /dev/null 2>&1; then
    echo "❌ Docker daemon не запущен."
    echo "📋 Пожалуйста:"
    echo "   1. Убедитесь, что Docker Desktop запущен"
    echo "   2. Дождитесь, пока иконка Docker в трее станет зеленой"
    echo "   3. Запустите этот скрипт снова"
    exit 1
fi

echo "✅ Docker готов"

# Проверка, запущен ли Supabase
echo "🔍 Проверка статуса Supabase..."
if pnpm supabase status > /dev/null 2>&1; then
    echo "✅ Supabase уже запущен"
    SUPABASE_RUNNING=true
else
    echo "📦 Запуск Supabase..."
    pnpm supabase start
    SUPABASE_RUNNING=false
fi

# Ожидание готовности
if [ "$SUPABASE_RUNNING" = "false" ]; then
    echo "⏳ Ожидание готовности Supabase (10 секунд)..."
    sleep 10
fi

# Проверка статуса
echo "🔍 Проверка статуса Supabase..."
pnpm supabase status

# Применение миграций
echo "📝 Применение миграций (db reset)..."
pnpm supabase db reset

echo ""
echo "✅ Готово! Supabase запущен и миграции применены."
echo ""
echo "📊 Supabase Dashboard: http://localhost:54323"
echo ""
echo "🔑 Для получения Service Role Key выполните:"
echo "   pnpm supabase status"
echo ""
echo "📋 Или найдите в выводе выше строку с 'service_role key'"



