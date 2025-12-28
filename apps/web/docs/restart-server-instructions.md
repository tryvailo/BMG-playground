# Инструкции по перезапуску сервера

## Проблема: Дашборд показывает нулевые значения

## Решение: Перезапуск сервера и проверка данных

### Шаги для исправления:

1. **Остановите текущий dev сервер** (если запущен):
   - Нажмите `Ctrl+C` в терминале, где запущен `pnpm dev`

2. **Убедитесь, что Supabase запущен**:
   ```bash
   cd apps/web
   pnpm supabase status
   ```
   
   Если не запущен:
   ```bash
   pnpm supabase start
   ```

3. **Проверьте, что данные в БД**:
   ```bash
   pnpm supabase db reset
   ```
   
   Должны увидеть:
   ```
   ✅ Success: All 12 monthly data points created correctly
   ```

4. **Очистите кеш Next.js** (опционально):
   ```bash
   rm -rf .next
   ```

5. **Запустите dev сервер заново**:
   ```bash
   # Из корня проекта
   pnpm dev
   
   # Или из apps/web
   cd apps/web
   pnpm dev
   ```

6. **Откройте дашборд в браузере**:
   - Откройте http://localhost:3000
   - Перейдите на вкладку "Dashboard"
   - Откройте DevTools (F12) → Console
   - Проверьте логи сервера в терминале

### Что должно быть в логах сервера:

```
[Dashboard] Fetching metrics for project: demo -> <UUID> domain: demo-clinic.com
[Dashboard] Found 12 weekly_stats records for project <UUID>
[Dashboard] First record: { week_start: '2025-01-06', visability_score: 45, ... }
[Dashboard] Last record: { week_start: '2025-12-01', visability_score: 80, ... }
[Dashboard] Using latest weekly_stats from 2025-12-01 { ... }
[Dashboard] Using stored clinic_ai_score from DB: 83.0
[Dashboard] ✅ Response built successfully: { avgAivScore: 83.0, ... }
```

### Если данные все еще нулевые:

1. **Проверьте переменные окружения**:
   - Убедитесь, что `.env.local` содержит правильные значения для Supabase
   - `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321`

2. **Проверьте логи браузера**:
   - Откройте DevTools → Network
   - Найдите запросы к `/api` или server actions
   - Проверьте ответы

3. **Проверьте логи сервера**:
   - Должны быть видны все логи `[Dashboard]`
   - Если видите `⚠️ No weekly_stats found`, значит проблема с запросом к БД

4. **Проверьте данные напрямую в Supabase Studio**:
   - Откройте http://127.0.0.1:54323
   - Перейдите в Table Editor → `weekly_stats`
   - Убедитесь, что есть 12 записей за 2025 год
   - Проверьте, что все значения не нулевые

### Изменения в коде:

- ✅ React Query теперь всегда обновляет данные (`staleTime: 0`)
- ✅ Добавлено детальное логирование для отладки
- ✅ Добавлена валидация ненулевых значений
- ✅ Исправлена логика использования `clinic_ai_score` из БД


