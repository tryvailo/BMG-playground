# Исправление подключения к Supabase

## Проблема
Приложение подключалось к удаленному Supabase (`https://evwjxpoclynilpkirdil.supabase.co`) вместо локального, из-за чего:
- Данные дашборда не загружались (они есть только в локальной БД)
- Возникали ошибки 404 для таблиц, которых нет в удаленной БД

## Решение
Обновлен файл `.env.local` для использования локального Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
```

## Следующие шаги

1. **Остановите текущий dev сервер** (если запущен):
   - Нажмите `Ctrl+C` в терминале

2. **Убедитесь, что локальный Supabase запущен**:
   ```bash
   cd apps/web
   pnpm supabase status
   ```
   
   Если не запущен:
   ```bash
   pnpm supabase start
   ```

3. **Запустите dev сервер заново**:
   ```bash
   pnpm dev
   ```

4. **Откройте дашборд в браузере**:
   - Откройте http://localhost:3000
   - Перейдите на вкладку "Dashboard"
   - Данные должны загрузиться автоматически

## Проверка

После перезапуска:
- ✅ Ошибки 404 должны исчезнуть
- ✅ Дашборд должен показывать ненулевые значения
- ✅ Логи сервера должны показывать загрузку данных из локальной БД

## Примечание об ошибке accounts

Ошибка `Could not find the table 'public.accounts'` может остаться, если таблица `accounts` не создана в локальной БД. Это не критично для работы дашборда, но может влиять на другие части приложения (например, профиль пользователя).

Для исправления убедитесь, что все миграции применены:
```bash
pnpm supabase db reset
```



