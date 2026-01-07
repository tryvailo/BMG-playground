# ⚡ Быстрый старт: Применение миграций

## 🏠 Локально (Development)

### ✅ Вариант 1: Автоматический скрипт (РЕКОМЕНДУЕТСЯ)
```bash
cd apps/web
./scripts/apply-migrations-local.sh
```

**Что делает скрипт:**
- ✅ Проверяет, запущен ли Supabase
- ✅ Применяет все миграции автоматически через Docker
- ✅ Показывает результат применения каждой миграции
- ✅ Если автоматически не получается - показывает инструкцию для ручного применения

### Вариант 2: Команды npm
```bash
cd apps/web
pnpm supabase:start    # Запустить Supabase
pnpm supabase:reset    # Применить миграции
```

### Вариант 3: Вручную через Studio
1. Откройте http://localhost:54323
2. SQL Editor → Примените миграции по порядку:
   - `20241219010757_schema.sql`
   - `20251129_add_ai_visibility.sql`
   - `20251203_create_user_project.sql`

---

## 🌐 Продакшн (Production)

### Вариант 1: Автоматический скрипт
```bash
cd apps/web
export SUPABASE_PROJECT_REF=your-project-ref
./scripts/apply-migrations-production.sh
```

### Вариант 2: Команды npm
```bash
cd apps/web
export SUPABASE_PROJECT_REF=your-project-ref
pnpm supabase link --project-ref $SUPABASE_PROJECT_REF
pnpm supabase db push
```

### Вариант 3: Вручную через Dashboard
1. Откройте https://app.supabase.com/
2. Выберите проект → SQL Editor
3. Примените миграции по порядку (те же файлы, что и локально)

---

## ✅ Проверка

Выполните в SQL Editor:

```sql
-- Проверка таблицы projects
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'projects';

-- Проверка функции
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'kit' AND routine_name = 'ensure_user_has_project';
```

---

📚 **Подробная инструкция:** `docs/migrations-guide.md`

