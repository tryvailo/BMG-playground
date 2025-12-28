# Исправление ошибки 500 на странице home

## Проблема
При попытке открыть `/en/home` возникает ошибка 500 (Internal Server Error).

## Возможные причины

1. **Сервер не перезапущен после изменения `.env.local`**
   - Next.js кеширует переменные окружения при первом запуске
   - После изменения `.env.local` необходимо перезапустить сервер

2. **Проблема с подключением к Supabase**
   - `getSupabaseServerClient()` не может подключиться к локальному Supabase
   - Возможно, Supabase не запущен или неправильно настроен

3. **Проблема с авторизацией**
   - `requireUserInServerComponent()` требует авторизованного пользователя
   - Если пользователь не авторизован, может возникнуть ошибка

## Решение

### Шаг 1: Убедитесь, что Supabase запущен
```bash
cd apps/web
pnpm supabase status
```

Должен показать:
```
supabase local development setup is running.
Project URL    │ http://127.0.0.1:54321
```

Если не запущен:
```bash
pnpm supabase start
```

### Шаг 2: Проверьте `.env.local`
Убедитесь, что файл содержит правильные значения:
```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
```

### Шаг 3: Остановите dev сервер
Если сервер запущен, нажмите `Ctrl+C` в терминале.

### Шаг 4: Очистите кеш Next.js
```bash
cd apps/web
rm -rf .next
```

### Шаг 5: Запустите сервер заново
```bash
pnpm dev
```

### Шаг 6: Проверьте логи сервера
При запуске сервера должны быть видны логи без ошибок. Если есть ошибки, они укажут на проблему.

### Шаг 7: Откройте страницу в браузере
1. Откройте http://localhost:3000
2. Если вы не авторизованы, перейдите на `/auth/sign-in` или `/auth/sign-up`
3. После авторизации попробуйте открыть `/en/home` снова

## Если проблема сохраняется

### Проверьте логи сервера
В терминале, где запущен `pnpm dev`, должны быть видны детальные ошибки. Ищите строки с:
- `Error:`
- `Failed to`
- `Cannot`

### Проверьте подключение к Supabase
```bash
curl http://127.0.0.1:54321/rest/v1/
```

Должен вернуть JSON с информацией о API.

### Проверьте, что миграции применены
```bash
pnpm supabase db reset
```

Это создаст все необходимые таблицы, включая `accounts`.

### Проверьте авторизацию
Если вы не авторизованы, страница `/en/home` может требовать авторизации. Попробуйте:
1. Перейти на `/auth/sign-in`
2. Войти или зарегистрироваться
3. Затем открыть `/en/home`

## Быстрая команда для полного перезапуска

```bash
cd apps/web
# Остановите сервер (Ctrl+C если запущен)
pnpm supabase status || pnpm supabase start  # Убедитесь, что Supabase запущен
rm -rf .next                                  # Очистите кеш
pnpm dev                                      # Запустите заново
```

## Дополнительная информация

Ошибка 500 обычно означает, что произошла ошибка на сервере. Наиболее частые причины:
- Неправильные переменные окружения
- Проблемы с подключением к базе данных
- Ошибки в server components
- Проблемы с авторизацией

Проверьте логи сервера для получения детальной информации об ошибке.


