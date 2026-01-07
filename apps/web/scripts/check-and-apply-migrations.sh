#!/bin/bash
# Скрипт для проверки и применения миграций вручную

set -e

echo "🔍 Проверка миграций Supabase..."
echo ""

cd "$(dirname "$0")/.."

# Проверка, что Supabase Studio доступен
if ! curl -s http://localhost:54323 > /dev/null 2>&1; then
    echo "❌ Supabase Studio недоступен на http://localhost:54323"
    echo "   Убедитесь, что Supabase запущен"
    exit 1
fi

echo "✅ Supabase Studio доступен"
echo ""
echo "📋 Инструкция по применению миграций:"
echo ""
echo "1. Откройте Supabase Studio: http://localhost:54323"
echo "2. Перейдите в SQL Editor (в левом меню)"
echo "3. Примените миграции в следующем порядке:"
echo ""
echo "   a) 20241219010757_schema.sql - базовая схема"
echo "   b) 20251129_add_ai_visibility.sql - таблица projects"
echo "   c) 20251203_create_user_project.sql - функция ensure_user_has_project"
echo ""
echo "4. Для каждой миграции:"
echo "   - Откройте файл: supabase/migrations/[имя_файла].sql"
echo "   - Скопируйте весь SQL код"
echo "   - Вставьте в SQL Editor"
echo "   - Нажмите Run (или Cmd/Ctrl + Enter)"
echo ""
echo "5. После применения проверьте, что таблица projects существует:"
echo ""
echo "   SELECT table_name FROM information_schema.tables"
echo "   WHERE table_schema = 'public' AND table_name = 'projects';"
echo ""
echo "📝 Важные миграции для онбординга:"
echo "   - 20241219010757_schema.sql (схема kit, таблица accounts)"
echo "   - 20251129_add_ai_visibility.sql (таблица projects, weekly_stats)"
echo "   - 20251203_create_user_project.sql (функция ensure_user_has_project)"
echo ""



