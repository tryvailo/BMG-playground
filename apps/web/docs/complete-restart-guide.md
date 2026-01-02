# Полное руководство по перезапуску для исправления подключения к Supabase

## Проблема
Приложение все еще пытается подключиться к удаленному Supabase (`https://evwjxpoclynilpkirdil.supabase.co`) вместо локального, даже после обновления `.env.local`.

## Причина
Next.js кеширует переменные окружения при первом запуске. После изменения `.env.local` необходимо:
1. Остановить сервер
2. Очистить кеш Next.js
3. Перезапустить сервер

## Решение (пошагово)

### Шаг 1: Остановите dev сервер
Если сервер запущен, нажмите `Ctrl+C` в терминале, где он работает.

### Шаг 2: Убедитесь, что локальный Supabase запущен
```bash
cd apps/web
pnpm supabase status
```

Если не запущен:
```bash
pnpm supabase start
```

### Шаг 3: Примените все миграции (если нужно)
```bash
pnpm supabase db reset
```

Это создаст:
- Таблицу `accounts` (если отсутствует)
- Таблицу `projects` и `weekly_stats`
- Данные для дашборда (12 записей за 2025 год)

### Шаг 4: Очистите кеш Next.js
```bash
rm -rf .next
```

### Шаг 5: Проверьте `.env.local`
Убедитесь, что файл содержит:
```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
```

### Шаг 6: Запустите dev сервер заново
```bash
# Из корня проекта
pnpm dev

# Или из apps/web
cd apps/web
pnpm dev
```

### Шаг 7: Проверьте в браузере
1. Откройте http://localhost:3000
2. Откройте DevTools (F12) → Console
3. Проверьте, что запросы идут на `http://127.0.0.1:54321`, а не на удаленный URL
4. Перейдите на вкладку "Dashboard"
5. Данные должны загрузиться автоматически

## Проверка успешности

### В консоли браузера:
- ❌ **НЕ должно быть**: `GET https://evwjxpoclynilpkirdil.supabase.co/...`
- ✅ **Должно быть**: `GET http://127.0.0.1:54321/...`

### В логах сервера:
Должны быть видны логи:
```
[Dashboard] Fetching metrics for project: demo -> <UUID> domain: demo-clinic.com
[Dashboard] Found 12 weekly_stats records for project <UUID>
[Dashboard] ✅ Response built successfully: { avgAivScore: 83.0, ... }
```

### В дашборде:
- ClinicAI Score: ~83% (не 0)
- Visibility: 80%
- Tech Optimization: 85%
- Content Optimization: 84%
- E-E-A-T Signal: 80%
- Local Signal: 72%

## Если проблема сохраняется

1. **Проверьте, что нет других файлов с переменными окружения**:
   ```bash
   ls -la apps/web/.env*
   ```
   Убедитесь, что нет `.env` или `.env.production` с удаленными значениями.

2. **Проверьте, что Supabase действительно запущен**:
   ```bash
   pnpm supabase status
   ```
   Должен показать `API URL: http://127.0.0.1:54321`

3. **Очистите кеш браузера**:
   - Откройте DevTools → Application → Clear storage
   - Или используйте режим инкогнито

4. **Проверьте логи сервера**:
   - Должны быть видны все логи `[Dashboard]`
   - Если видите ошибки подключения, проверьте, что Supabase запущен

## Быстрая команда для полного перезапуска

```bash
cd apps/web
# Остановите сервер (Ctrl+C если запущен)
pnpm supabase db reset  # Применить миграции
rm -rf .next            # Очистить кеш
pnpm dev                # Запустить заново
```




