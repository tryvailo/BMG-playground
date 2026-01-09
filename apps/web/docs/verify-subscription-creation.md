# Проверка создания подписки

## Шаг 1: Проверьте базу данных

Выполните SQL запрос в Supabase Dashboard (SQL Editor):

```sql
-- Проверить все подписки
SELECT 
  s.id,
  s.account_id,
  s.plan_id,
  s.plan_name,
  s.price,
  s.payment_status,
  s.created_at,
  a.email,
  a.name
FROM public.subscriptions s
LEFT JOIN public.accounts a ON a.id = s.account_id
ORDER BY s.created_at DESC;
```

**Ожидаемый результат:**
- Если подписки создаются, вы увидите записи с `plan_id`, `plan_name`, `payment_status = 'pending'`
- Если записей нет, подписки не создаются

## Шаг 2: Проверьте логи сервера

### При создании пользователя через онбординг:

В терминале, где запущен `pnpm dev`, должны быть логи:

```
[Onboarding] Sending project creation request: { planId: 'starter', ... }
[CreateProject] Received request data: { planId: 'starter', ... }
[CreateProject] Checking subscription creation: { planId: 'starter', hasPlanId: true, ... }
[CreateProject] Creating subscription with data: { account_id: '...', plan_id: 'starter', ... }
[CreateProject] ✅ SUCCESS - Created pending subscription: { subscriptionId: '...', planId: 'starter', ... }
```

**Если видите ошибку:**
```
[CreateProject] ❌ Error creating subscription: { ... }
```
→ Скопируйте полный текст ошибки

## Шаг 3: Проверьте логи браузера

Откройте DevTools (F12) → Console:

При выборе плана:
```
[StepPricing] Calling onPlanSelect with: { planId: 'starter', interval: 'month' }
[Onboarding] Plan selected: { planId: 'starter', ... }
```

При отправке запроса:
```
[Onboarding] Sending project creation request: { planId: 'starter', ... }
```

## Шаг 4: Проверьте админ-панель

1. Откройте `/admin/users`
2. Откройте DevTools (F12) → Console
3. Должны быть логи:

```
[AdminSubscriptions] Loaded subscriptions: X
[AdminSubscriptions] Sample subscription: { plan_id: 'starter', plan_name: 'Starter', ... }
[AdminUsers] Loaded: { subscriptions: X, accounts: Y }
[AdminUsers] Sample subscription from API: { plan_id: 'starter', ... }
```

**Если видите:**
```
[AdminSubscriptions] ⚠️ No subscriptions found in database
[AdminUsers] ⚠️ No subscriptions in API response
```
→ Подписки не создаются или не загружаются

## Диагностика проблем

### Проблема 1: Подписки не создаются

**Симптом:** В базе данных нет записей в таблице `subscriptions`

**Проверьте:**
1. Логи сервера на наличие ошибок `[CreateProject] ❌ Error creating subscription`
2. Что `planId` передается в запросе (логи `[CreateProject] Received request data`)
3. Что таблица `subscriptions` существует:
   ```sql
   SELECT EXISTS (
     SELECT FROM information_schema.tables 
     WHERE table_schema = 'public' 
     AND table_name = 'subscriptions'
   );
   ```

### Проблема 2: Подписки создаются, но не отображаются

**Симптом:** В базе данных есть подписки, но в админ-панели их нет

**Проверьте:**
1. Логи `[AdminSubscriptions]` - загружаются ли подписки из базы
2. Логи `[AdminUsers]` - приходят ли подписки в API response
3. Network tab в DevTools - проверьте ответ от `/api/admin/subscriptions`

### Проблема 3: План не сохраняется в состоянии

**Симптом:** В логах `[Onboarding] Plan selected:` показывает пустой `planId`

**Проверьте:**
1. Логи `[StepPricing] Calling onPlanSelect` - вызывается ли функция
2. Что план действительно выбран на шаге Pricing
3. Что используется функциональное обновление состояния `prev => ({ ...prev, ... })`

## Тестовый сценарий

1. **Откройте DevTools (F12) → Console и Network**
2. **Создайте нового пользователя:**
   - Регион: Ukraine (UA)
   - План: Starter
   - Создайте аккаунт

3. **Проверьте логи в консоли:**
   - `[StepPricing] Calling onPlanSelect` - должен быть
   - `[Onboarding] Plan selected` - должен быть с `planId: 'starter'`
   - `[Onboarding] Sending project creation request` - должен быть с `planId: 'starter'`

4. **Проверьте логи сервера:**
   - `[CreateProject] Received request data` - должен быть с `planId: 'starter'`
   - `[CreateProject] ✅ SUCCESS - Created pending subscription` - должен быть

5. **Проверьте базу данных:**
   ```sql
   SELECT * FROM public.subscriptions ORDER BY created_at DESC LIMIT 1;
   ```
   - Должна быть запись с `plan_id = 'starter'`

6. **Проверьте админ-панель:**
   - Откройте `/admin/users`
   - Проверьте логи в консоли
   - Должен отображаться план для нового пользователя

## Следующие шаги

После проверки:
1. Если подписки не создаются - проверьте ошибки в логах сервера
2. Если подписки создаются, но не отображаются - проверьте загрузку данных в админ-панели
3. Скопируйте все логи и ошибки для дальнейшей диагностики




