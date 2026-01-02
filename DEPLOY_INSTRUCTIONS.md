# 🚀 Инструкция по деплою изменений

## ⚠️ ВАЖНО: Порядок действий

**Сначала примените миграцию БД на продакшене, потом деплойте код!**

## Шаг 1: Добавить изменения в git

```bash
cd /Users/alexander/Documents/Products/SAAS-toolkit-test/nextjs-saas-starter

# Добавить критически важные файлы
git add apps/web/supabase/migrations/20250128_add_playground_audit_tables.sql
git add apps/web/lib/actions/content-audit.ts
git add apps/web/lib/actions/eeat-audit.ts
git add apps/web/lib/actions/tech-audit-playground.ts
git add apps/web/app/[locale]/home/content-optimization/page.tsx
git add apps/web/app/[locale]/home/eeat-assessment/page.tsx
git add apps/web/app/[locale]/home/tech-audit/page.tsx
```

## Шаг 2: Закоммитить

```bash
git commit -m "feat: implement data persistence for all audit tabs

- Add database tables: playground_tech_audits, content_audits, eeat_audits
- Update Content Optimization to save/load from database
- Update E-E-A-T Assessment to save/load from database  
- Update Technical Audit to save/load from database
- Add getLatest* functions for loading saved audit results"
```

## Шаг 3: Запушить в репозиторий

```bash
git push origin main
```

## Шаг 4: Применить миграцию БД на продакшене (КРИТИЧЕСКИ ВАЖНО!)

### Через Supabase Dashboard:

1. Откройте https://app.supabase.com/
2. Выберите ваш продакшн проект
3. Перейдите в **SQL Editor**
4. Откройте файл: `apps/web/supabase/migrations/20250128_add_playground_audit_tables.sql`
5. Скопируйте **весь** SQL код
6. Вставьте в SQL Editor
7. Нажмите **Run** (Cmd/Ctrl + Enter)
8. Убедитесь, что выполнено успешно

### Проверка:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('playground_tech_audits', 'content_audits', 'eeat_audits');
```

Должно вернуться 3 таблицы.

## Шаг 5: Дождаться деплоя на Vercel

Vercel автоматически задеплоит изменения после пуша в main.

Проверьте статус в Vercel Dashboard.

## Шаг 6: Тестирование

1. Откройте приложение на Vercel
2. Проверьте каждую вкладку:
   - Content Optimization
   - E-E-A-T Assessment
   - Technical Audit
3. Запустите аудит на одной из вкладок
4. Закройте и откройте вкладку снова
5. Данные должны загрузиться из БД

## ❌ Если что-то пошло не так

### Ошибка "relation does not exist"
→ Миграция не применена. Примените через Supabase Dashboard (Шаг 4)

### Данные не сохраняются
→ Проверьте RLS политики в Supabase Dashboard

### Деплой не запустился
→ Проверьте Vercel Dashboard и запустите деплой вручную

---

📖 Подробная инструкция: `apps/web/docs/deployment-guide-tabs-persistence.md`



