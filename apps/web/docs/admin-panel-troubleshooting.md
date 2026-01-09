# Устранение проблем с админ-панелью

## Проблема: Не видно пользователей в админ-панели

### Возможные причины:

1. **Подписка не создалась при онбординге**
   - Пользователь не выбрал регион UA
   - Пользователь не выбрал план на шаге pricing
   - Ошибка при создании подписки (проверьте логи сервера)

2. **Проблема с RLS политиками**
   - API endpoint использует admin client, но может быть проблема с доступом

3. **Таблица subscriptions не существует**
   - Нужно применить миграцию `20250130_add_subscriptions_table.sql`

## Решение

### 1. Проверка создания подписки при онбординге

**Условия для создания подписки:**
- Регион должен быть `UA` (не `ukr` или `uk`, а именно `UA` в поле `region`)
- Должен быть выбран план (`planId` должен быть `starter`, `growth` или `enterprise`)

**Проверка в логах:**
При создании аккаунта через онбординг должны быть логи:
```
[CreateProject] Checking subscription creation: { planId: 'starter', region: 'UA', ... }
[CreateProject] Creating subscription with data: { ... }
[CreateProject] ✅ Created pending subscription for UA user: <userId>
```

Если видите `Skipping subscription creation`, проверьте:
- Выбран ли регион UA в онбординге
- Выбран ли план на шаге pricing

### 2. Проверка данных в базе

Выполните в Supabase SQL Editor:

```sql
-- Проверить все подписки
SELECT * FROM public.subscriptions ORDER BY created_at DESC;

-- Проверить всех пользователей
SELECT id, name, email, created_at FROM public.accounts ORDER BY created_at DESC;

-- Проверить пользователей без подписок
SELECT a.id, a.name, a.email, a.created_at
FROM public.accounts a
LEFT JOIN public.subscriptions s ON s.account_id = a.id
WHERE s.id IS NULL
ORDER BY a.created_at DESC;
```

### 3. Создание подписки вручную

Если подписка не создалась автоматически:

1. Откройте `/admin/users`
2. Найдите пользователя без подписки (будет показан с серым фоном)
3. Нажмите кнопку **"Create Subscription"**
4. Введите plan ID: `starter`, `growth` или `enterprise`
5. Подписка будет создана со статусом `pending`

### 4. Проверка API endpoint

Проверьте, что API endpoint работает:

```bash
# В браузере откройте DevTools → Network
# Перезагрузите /admin/users
# Найдите запрос к /api/admin/subscriptions
# Проверьте Response
```

Должен вернуться JSON:
```json
{
  "success": true,
  "subscriptions": [...],
  "accounts": {...},
  "totalAccounts": 1,
  "totalSubscriptions": 0
}
```

## Обновления в админ-панели

Теперь админ-панель:
- ✅ Показывает **всех пользователей**, даже без подписок
- ✅ Пользователи без подписок отображаются с серым фоном
- ✅ Можно создать подписку для пользователя без подписки
- ✅ Показывает статистику: Total Accounts и Total Subscriptions
- ✅ Улучшенная обработка ошибок с сообщениями

## Диагностика

Если все еще не видно пользователей:

1. **Проверьте консоль браузера** (F12 → Console)
   - Должны быть логи: `[AdminUsers] Loaded: { subscriptions: X, accounts: Y }`

2. **Проверьте Network tab** (F12 → Network)
   - Запрос к `/api/admin/subscriptions` должен вернуть 200
   - Проверьте Response body

3. **Проверьте логи сервера**
   - Должны быть логи от `[AdminSubscriptions]` и `[CreateProject]`

4. **Проверьте миграции**
   - Убедитесь, что миграция `20250130_add_subscriptions_table.sql` применена
   - Проверьте, что таблица `subscriptions` существует




