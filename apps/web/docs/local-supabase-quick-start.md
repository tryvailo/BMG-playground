# Быстрый старт: Локальный Supabase для Local Indicators

## Проблема: Docker daemon не запущен

Docker Desktop запущен, но daemon еще не готов. Выполните следующие шаги:

## Шаг 1: Убедитесь, что Docker Desktop полностью запущен

1. Откройте Docker Desktop
2. Дождитесь, пока иконка Docker в трее (верхняя панель Mac) станет **зеленой**
3. В Docker Desktop должно быть написано "Docker Desktop is running"

## Шаг 2: Запустите Supabase локально

После того, как Docker Desktop полностью запустится, выполните:

```bash
cd apps/web
pnpm supabase start
```

Эта команда:
- Запустит все необходимые Docker контейнеры для Supabase
- Применит все миграции автоматически (включая `20250127_add_local_indicators_audits.sql`)
- Покажет URL для доступа к Supabase Dashboard

## Шаг 3: Проверьте статус

```bash
cd apps/web
pnpm supabase status
```

Вы увидите:
- URL Supabase Dashboard (обычно http://localhost:54323)
- Service Role Key (нужен для `SUPABASE_SERVICE_ROLE_KEY` в `.env.local`)
- API URL и другие параметры

## Шаг 4: Обновите .env.local (если нужно)

Если вы используете локальный Supabase, убедитесь, что в `.env.local` указаны правильные значения:

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=<service_role_key из вывода pnpm supabase status>
```

## Альтернатива: Использовать готовый скрипт

После того, как Docker Desktop полностью запустится:

```bash
cd apps/web
./scripts/setup-local-supabase.sh
```

Этот скрипт автоматически:
1. Проверит Docker
2. Запустит Supabase
3. Применит все миграции

## Проверка после запуска

После успешного запуска Supabase:

1. Откройте браузер и перейдите на http://localhost:54323 (Supabase Dashboard)
2. Войдите с паролем (если требуется)
3. Перейдите в **Table Editor** → проверьте, что таблица `local_indicators_audits` существует
4. Очистите кеш браузера (Hard Refresh: Cmd+Shift+R)
5. Откройте страницу Local Indicators в приложении

## Остановка Supabase

Когда закончите работу:

```bash
cd apps/web
pnpm supabase stop
```

## Сброс базы данных (если нужно)

Если нужно полностью пересоздать базу:

```bash
cd apps/web
pnpm supabase db reset
```

Это применит все миграции заново.








