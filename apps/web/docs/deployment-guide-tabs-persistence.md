# Инструкция по деплою: Сохранение данных вкладок

## Обзор изменений

Реализована функциональность сохранения и загрузки данных для всех вкладок:
- **Content Optimization** - сохраняет результаты в `content_audits`
- **E-E-A-T Assessment** - сохраняет результаты в `eeat_audits`
- **Technical Audit** - сохраняет результаты в `playground_tech_audits`

## Шаг 1: Подготовка к коммиту

### 1.1. Проверка измененных файлов

Убедитесь, что все важные файлы готовы к коммиту:

**Критически важные файлы (обязательно добавить):**
- `apps/web/supabase/migrations/20250128_add_playground_audit_tables.sql` - новая миграция БД
- `apps/web/lib/actions/content-audit.ts` - обновлен для сохранения в БД
- `apps/web/lib/actions/eeat-audit.ts` - обновлен для сохранения в БД
- `apps/web/lib/actions/tech-audit-playground.ts` - обновлен для сохранения в БД
- `apps/web/app/[locale]/home/content-optimization/page.tsx` - обновлена страница
- `apps/web/app/[locale]/home/eeat-assessment/page.tsx` - обновлена страница
- `apps/web/app/[locale]/home/tech-audit/page.tsx` - обновлена страница

### 1.2. Добавление файлов в git

```bash
cd /Users/alexander/Documents/Products/SAAS-toolkit-test/nextjs-saas-starter

# Добавить миграцию БД (критически важно!)
git add apps/web/supabase/migrations/20250128_add_playground_audit_tables.sql

# Добавить обновленные actions
git add apps/web/lib/actions/content-audit.ts
git add apps/web/lib/actions/eeat-audit.ts
git add apps/web/lib/actions/tech-audit-playground.ts

# Добавить обновленные страницы
git add apps/web/app/[locale]/home/content-optimization/page.tsx
git add apps/web/app/[locale]/home/eeat-assessment/page.tsx
git add apps/web/app/[locale]/home/tech-audit/page.tsx

# Добавить документацию (опционально)
git add apps/web/docs/tabs-data-persistence-plan.md
git add apps/web/docs/deployment-guide-tabs-persistence.md

# Или добавить все изменения сразу (если уверены)
# git add .
```

## Шаг 2: Коммит изменений

```bash
git commit -m "feat: implement data persistence for all audit tabs

- Add database tables: playground_tech_audits, content_audits, eeat_audits
- Update Content Optimization to save/load from database
- Update E-E-A-T Assessment to save/load from database
- Update Technical Audit to save/load from database
- Add getLatest* functions for loading saved audit results
- All tabs now persist data and load on page open"
```

## Шаг 3: Пуш в репозиторий

```bash
git push origin main
# или
git push origin <your-branch-name>
```

## Шаг 4: Применение миграции на продакшене

⚠️ **КРИТИЧЕСКИ ВАЖНО**: Миграция БД должна быть применена на продакшене **ДО** деплоя кода на Vercel!

### Вариант A: Через Supabase Dashboard (рекомендуется)

1. Откройте [Supabase Dashboard](https://app.supabase.com/)
2. Выберите ваш продакшн проект
3. Перейдите в **SQL Editor**
4. Откройте файл `apps/web/supabase/migrations/20250128_add_playground_audit_tables.sql`
5. Скопируйте **весь** SQL код из файла
6. Вставьте в SQL Editor
7. Нажмите **Run** (или Cmd/Ctrl + Enter)
8. Убедитесь, что миграция выполнена успешно (должно быть сообщение "Success")

### Вариант B: Через Supabase CLI

```bash
cd apps/web

# Связать проект с продакшн Supabase (если еще не связан)
# Получите PROJECT_REF из Supabase Dashboard -> Settings -> General
export SUPABASE_PROJECT_REF=your-project-ref
pnpm supabase link --project-ref $SUPABASE_PROJECT_REF

# Применить миграцию
pnpm supabase db push
```

### Проверка применения миграции

После применения миграции проверьте, что таблицы созданы:

```sql
-- Выполните в SQL Editor Supabase Dashboard:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('playground_tech_audits', 'content_audits', 'eeat_audits')
ORDER BY table_name;
```

Должно вернуться 3 строки с названиями таблиц.

## Шаг 5: Деплой на Vercel

После того как:
- ✅ Код запушен в репозиторий
- ✅ Миграция применена на продакшн Supabase

Vercel автоматически начнет деплой (если настроен auto-deploy).

### Проверка деплоя на Vercel

1. Откройте [Vercel Dashboard](https://vercel.com/dashboard)
2. Выберите ваш проект
3. Проверьте статус последнего деплоя
4. Убедитесь, что деплой прошел успешно (зеленый статус)

### Если деплой не запустился автоматически

Можно запустить вручную:
1. В Vercel Dashboard нажмите **Deployments**
2. Нажмите **Redeploy** для последнего коммита

## Шаг 6: Проверка после деплоя

### 6.1. Проверка работы вкладок

1. Откройте приложение на Vercel
2. Перейдите на вкладку **Content Optimization**
   - Если данных нет - должна быть кнопка "Analyze Content"
   - Запустите аудит
   - Закройте и откройте вкладку снова - данные должны загрузиться из БД
3. Повторите для **E-E-A-T Assessment** и **Technical Audit**

### 6.2. Проверка логов

Если что-то не работает, проверьте логи:
1. В Vercel Dashboard -> **Deployments** -> выберите деплой -> **Logs**
2. Ищите ошибки связанные с:
   - `content_audits`
   - `eeat_audits`
   - `playground_tech_audits`

### 6.3. Проверка базы данных

В Supabase Dashboard -> **Table Editor** проверьте, что:
- Таблицы созданы
- Данные сохраняются после запуска аудитов
- RLS политики работают корректно

## Возможные проблемы и решения

### Проблема 1: Ошибка "relation does not exist"

**Причина**: Миграция не применена на продакшене

**Решение**: 
1. Примените миграцию через Supabase Dashboard (см. Шаг 4)
2. Перезапустите деплой на Vercel

### Проблема 2: Данные не сохраняются

**Причина**: Проблемы с RLS политиками или правами доступа

**Решение**:
1. Проверьте RLS политики в Supabase Dashboard
2. Убедитесь, что Service Role Key правильно настроен в Vercel

### Проблема 3: Данные не загружаются при открытии вкладки

**Причина**: Ошибка в коде загрузки или проблемы с URL нормализацией

**Решение**:
1. Проверьте логи в браузере (F12 -> Console)
2. Проверьте логи на Vercel
3. Убедитесь, что URL нормализуется правильно

## Чеклист перед деплоем

- [ ] Все изменения закоммичены
- [ ] Код запушен в репозиторий
- [ ] Миграция БД применена на продакшн Supabase
- [ ] Таблицы созданы и доступны
- [ ] Vercel деплой запущен
- [ ] Деплой завершился успешно
- [ ] Функциональность протестирована на продакшене

## Дополнительные заметки

- Миграция применяется один раз и не требует повторного применения
- Если нужно откатить изменения, можно удалить таблицы через Supabase Dashboard
- Все данные сохраняются в JSONB формате для гибкости
- RLS политики настроены для публичного доступа (playground режим)


