# Отладка отображения плана в админ-панели

## Проблема

План не показывается в таблице пользователей в админ-панели (`/admin/users`).

## Проверка

### 1. Проверьте, что подписка создается при онбординге

**В логах сервера должны быть:**
```
[CreateProject] Checking subscription creation: { planId: 'starter', region: 'UA', ... }
[CreateProject] Creating subscription with data: { ... }
[CreateProject] ✅ Created pending subscription for UA user: <userId> <subscriptionId>
```

**Если видите:**
```
[CreateProject] Skipping subscription creation: { reason: 'No planId' }
```
→ План не был выбран на шаге pricing

**Если видите:**
```
[CreateProject] Skipping subscription creation: { reason: 'Region is ukr, not UA' }
```
→ Регион не UA (нужно выбрать именно UA, не ukr)

### 2. Проверьте данные в базе

Выполните в Supabase SQL Editor:

```sql
-- Проверить все подписки
SELECT 
  s.id,
  s.account_id,
  s.plan_id,
  s.plan_name,
  s.billing_interval,
  s.payment_status,
  a.email,
  a.name
FROM public.subscriptions s
LEFT JOIN public.accounts a ON a.id = s.account_id
ORDER BY s.created_at DESC;

-- Проверить пользователей без подписок
SELECT 
  a.id,
  a.email,
  a.name,
  a.created_at
FROM public.accounts a
LEFT JOIN public.subscriptions s ON s.account_id = a.id
WHERE s.id IS NULL
ORDER BY a.created_at DESC;
```

### 3. Проверьте API endpoint

Откройте DevTools (F12) → Network:
1. Перезагрузите `/admin/users`
2. Найдите запрос к `/api/admin/subscriptions`
3. Проверьте Response

Должен вернуться JSON с:
```json
{
  "success": true,
  "subscriptions": [
    {
      "id": "...",
      "account_id": "...",
      "plan_id": "starter",
      "plan_name": "Starter",
      "billing_interval": "month",
      ...
    }
  ],
  "accounts": {...}
}
```

### 4. Проверьте консоль браузера

В консоли должны быть логи:
```
[AdminUsers] Loaded: { subscriptions: X, accounts: Y }
```

## Исправления

### ✅ Улучшено отображение плана

Теперь в таблице показывается:
- **Название плана** (Starter, Growth, Enterprise)
- **Период** (Monthly/Yearly)
- **Plan ID** (starter, growth, enterprise)

**Пример отображения:**
```
Starter
Monthly • starter
```

### ✅ Добавлены поля в интерфейс

Интерфейс `Subscription` теперь включает:
- `plan_id` - ID плана
- `billing_interval` - период подписки

## Если план все еще не показывается

1. **Проверьте, что подписка создана:**
   - Выполните SQL запрос выше
   - Убедитесь, что есть записи в таблице `subscriptions`

2. **Проверьте логи онбординга:**
   - Создайте нового пользователя через онбординг
   - Проверьте логи сервера на наличие ошибок

3. **Проверьте регион:**
   - Убедитесь, что выбран регион **UA** (не ukr или uk)
   - Подписка создается только для региона UA

4. **Проверьте выбор плана:**
   - Убедитесь, что план выбран на шаге pricing
   - План должен быть `starter`, `growth` или `enterprise`

## Тестовый сценарий

1. Создайте пользователя через онбординг:
   - Регион: **Ukraine (UA)**
   - План: **Starter**
   - Создайте аккаунт

2. Проверьте в админ-панели:
   - Откройте `/admin/users`
   - Найдите пользователя
   - В колонке "Plan" должно быть:
     ```
     Starter
     Monthly • starter
     ```

3. Если план не показывается:
   - Проверьте SQL запрос (см. выше)
   - Проверьте логи сервера
   - Проверьте Network tab в DevTools



