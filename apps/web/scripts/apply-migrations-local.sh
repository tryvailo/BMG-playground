#!/bin/bash
# Скрипт для применения миграций на локальном Supabase

set -e

echo "🚀 Применение миграций на локальном Supabase..."
echo ""

cd "$(dirname "$0")/.."

# Проверка Docker
if ! docker ps > /dev/null 2>&1; then
    echo "❌ Docker не запущен. Запустите Docker Desktop и попробуйте снова."
    exit 1
fi

# Проверка, запущен ли Supabase
SUPABASE_RUNNING=false
if curl -s http://localhost:54323 > /dev/null 2>&1; then
    SUPABASE_RUNNING=true
    echo "✅ Supabase Studio доступен"
fi

# Проверка через Supabase CLI
if pnpm supabase status > /dev/null 2>&1; then
    echo "✅ Supabase CLI видит запущенный Supabase"
    SUPABASE_CLI_AVAILABLE=true
else
    echo "⚠️  Supabase CLI не видит запущенный Supabase (но контейнеры могут быть запущены)"
    SUPABASE_CLI_AVAILABLE=false
fi

# Попытка применения миграций через Supabase CLI
if [ "$SUPABASE_CLI_AVAILABLE" = true ]; then
    echo ""
    echo "📝 Применение миграций через Supabase CLI..."
    echo ""
    
    if pnpm supabase:reset 2>&1; then
        echo ""
        echo "✅ Миграции успешно применены через Supabase CLI!"
        echo ""
        echo "📊 Supabase Studio: http://localhost:54323"
        echo ""
        echo "🔍 Проверка таблиц:"
        echo "   Откройте SQL Editor в Supabase Studio и выполните:"
        echo ""
        echo "   SELECT table_name FROM information_schema.tables"
        echo "   WHERE table_schema = 'public' AND table_name = 'projects';"
        echo ""
        exit 0
    else
        echo ""
        echo "⚠️  Supabase CLI не смог применить миграции."
        echo "   Пробуем альтернативный способ..."
        echo ""
    fi
fi

# Альтернативный способ 1: применение через Docker exec (psql в контейнере)
DB_CONTAINER=$(docker ps --filter "name=supabase_db" --format "{{.Names}}" | head -1)

if [ -n "$DB_CONTAINER" ]; then
    echo "📝 Применение миграций через Docker (контейнер: $DB_CONTAINER)..."
    echo ""
    
    MIGRATIONS_DIR="supabase/migrations"
    MIGRATIONS=(
        "20241219010757_schema.sql"
        "20251129_add_ai_visibility.sql"
        "20251203_create_user_project.sql"
    )
    
    SUCCESS_COUNT=0
    for migration in "${MIGRATIONS[@]}"; do
        MIGRATION_FILE="$MIGRATIONS_DIR/$migration"
        if [ -f "$MIGRATION_FILE" ]; then
            echo "   Применение: $migration..."
            # Копируем файл в контейнер и выполняем
            if docker cp "$MIGRATION_FILE" "$DB_CONTAINER:/tmp/$migration" > /dev/null 2>&1 && \
               docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres -f "/tmp/$migration" > /dev/null 2>&1; then
                echo "   ✅ $migration применена"
                SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
            else
                echo "   ⚠️  Ошибка при применении $migration (возможно, уже применена или есть конфликт)"
            fi
            # Удаляем временный файл из контейнера
            docker exec "$DB_CONTAINER" rm -f "/tmp/$migration" > /dev/null 2>&1 || true
        else
            echo "   ⚠️  Файл не найден: $MIGRATION_FILE"
        fi
    done
    
    if [ $SUCCESS_COUNT -gt 0 ]; then
        echo ""
        echo "✅ Применено миграций: $SUCCESS_COUNT из ${#MIGRATIONS[@]}"
        echo ""
        echo "📊 Supabase Studio: http://localhost:54323"
        echo ""
        echo "🔍 Проверка таблиц:"
        echo "   SELECT table_name FROM information_schema.tables"
        echo "   WHERE table_schema = 'public' AND table_name = 'projects';"
        echo ""
        exit 0
    fi
fi

# Альтернативный способ 2: применение через psql (если доступен локально)
if command -v psql > /dev/null 2>&1; then
    echo "📝 Применение миграций через локальный psql..."
    echo ""
    
    MIGRATIONS_DIR="supabase/migrations"
    MIGRATIONS=(
        "20241219010757_schema.sql"
        "20251129_add_ai_visibility.sql"
        "20251203_create_user_project.sql"
    )
    
    DB_URL="postgresql://postgres:postgres@localhost:54322/postgres"
    
    SUCCESS_COUNT=0
    for migration in "${MIGRATIONS[@]}"; do
        MIGRATION_FILE="$MIGRATIONS_DIR/$migration"
        if [ -f "$MIGRATION_FILE" ]; then
            echo "   Применение: $migration..."
            if psql "$DB_URL" -f "$MIGRATION_FILE" > /dev/null 2>&1; then
                echo "   ✅ $migration применена"
                SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
            else
                echo "   ⚠️  Ошибка при применении $migration (возможно, уже применена)"
            fi
        else
            echo "   ⚠️  Файл не найден: $MIGRATION_FILE"
        fi
    done
    
    if [ $SUCCESS_COUNT -gt 0 ]; then
        echo ""
        echo "✅ Применено миграций: $SUCCESS_COUNT из ${#MIGRATIONS[@]}"
        echo ""
        echo "📊 Supabase Studio: http://localhost:54323"
        echo ""
        exit 0
    fi
fi

# Если ни один способ не сработал, показываем инструкцию
echo ""
echo "⚠️  Автоматическое применение миграций не удалось."
echo ""
echo "📋 Примените миграции вручную через Supabase Studio:"
echo ""
echo "1. Откройте http://localhost:54323"
echo "2. Перейдите в SQL Editor"
echo "3. Примените миграции в следующем порядке:"
echo ""
echo "   a) 20241219010757_schema.sql"
echo "      Файл: supabase/migrations/20241219010757_schema.sql"
echo ""
echo "   b) 20251129_add_ai_visibility.sql"
echo "      Файл: supabase/migrations/20251129_add_ai_visibility.sql"
echo ""
echo "   c) 20251203_create_user_project.sql"
echo "      Файл: supabase/migrations/20251203_create_user_project.sql"
echo ""
echo "   Для каждой миграции:"
echo "   - Откройте файл миграции"
echo "   - Скопируйте весь SQL код"
echo "   - Вставьте в SQL Editor"
echo "   - Нажмите Run (Cmd/Ctrl + Enter)"
echo ""
echo "🔍 После применения проверьте:"
echo ""
echo "   SELECT table_name FROM information_schema.tables"
echo "   WHERE table_schema = 'public' AND table_name = 'projects';"
echo ""
exit 1

