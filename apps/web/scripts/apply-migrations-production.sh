#!/bin/bash
# Скрипт для применения миграций на продакшн Supabase

set -e

echo "🚀 Применение миграций на продакшн Supabase..."
echo ""

cd "$(dirname "$0")/.."

# Проверка переменной окружения
if [ -z "$SUPABASE_PROJECT_REF" ]; then
    echo "❌ Переменная SUPABASE_PROJECT_REF не установлена"
    echo ""
    echo "📋 Инструкция:"
    echo "1. Откройте https://app.supabase.com/"
    echo "2. Выберите ваш проект"
    echo "3. Перейдите в Settings → General"
    echo "4. Скопируйте 'Reference ID'"
    echo "5. Установите переменную:"
    echo "   export SUPABASE_PROJECT_REF=your-project-ref"
    echo "6. Запустите скрипт снова"
    echo ""
    exit 1
fi

echo "✅ PROJECT_REF: $SUPABASE_PROJECT_REF"
echo ""

# Связывание проекта (если еще не связан)
echo "🔗 Связывание с продакшн проектом..."
if pnpm supabase link --project-ref "$SUPABASE_PROJECT_REF"; then
    echo "✅ Проект успешно связан"
else
    echo "⚠️  Проект уже связан или произошла ошибка"
fi

echo ""
echo "📝 Применение миграций на продакшн..."
echo ""

# Применение миграций
if pnpm supabase db push; then
    echo ""
    echo "✅ Миграции успешно применены на продакшн!"
    echo ""
    echo "🔍 Проверка:"
    echo "1. Откройте https://app.supabase.com/"
    echo "2. Выберите ваш проект"
    echo "3. Перейдите в SQL Editor"
    echo "4. Выполните:"
    echo ""
    echo "   SELECT table_name FROM information_schema.tables"
    echo "   WHERE table_schema = 'public' AND table_name = 'projects';"
    echo ""
else
    echo ""
    echo "❌ Ошибка при применении миграций"
    echo ""
    echo "📋 Альтернативный способ - через Supabase Dashboard:"
    echo ""
    echo "1. Откройте https://app.supabase.com/"
    echo "2. Выберите ваш проект"
    echo "3. Перейдите в SQL Editor"
    echo "4. Примените миграции вручную в следующем порядке:"
    echo ""
    echo "   a) 20241219010757_schema.sql"
    echo "   b) 20251129_add_ai_visibility.sql"
    echo "   c) 20251203_create_user_project.sql"
    echo ""
    echo "   Для каждой миграции:"
    echo "   - Откройте файл: supabase/migrations/[имя_файла].sql"
    echo "   - Скопируйте весь SQL код"
    echo "   - Вставьте в SQL Editor"
    echo "   - Нажмите Run"
    echo ""
    exit 1
fi



