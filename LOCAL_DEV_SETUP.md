# Локальная разработка - Настройка аутентификации

## Быстрый старт

### 1. Запустите локальный Supabase

```bash
pnpm supabase:start
```

После запуска выполните:
```bash
pnpm supabase:status
```

Скопируйте значения `API URL`, `anon key` и `service_role key`.

### 2. Создайте файл `.env.local`

Скопируйте пример файла:
```bash
cp apps/web/.env.local.example apps/web/.env.local
```

Заполните значения из `supabase:status`:
```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=ваш-anon-key
SUPABASE_SERVICE_ROLE_KEY=ваш-service-role-key
```

### 3. Настройки аутентификации

По умолчанию для локальной разработки включены:
- ✅ **Email/Password** - регистрация и вход по email и паролю
- ✅ **Magic Link** - вход по ссылке, отправленной на email
- ❌ **Google OAuth** - отключен (можно включить, установив `NEXT_PUBLIC_AUTH_OAUTH_ENABLED=true`)

### 4. Важные настройки для локальной разработки

В файле `apps/web/supabase/config.toml`:
- `enable_confirmations = false` - **отключено подтверждение email** для удобства тестирования
- Это означает, что вы можете сразу войти после регистрации без подтверждения email

### 5. Просмотр писем (для Magic Link)

Локальный Supabase использует Inbucket для тестирования email:
- Откройте: http://localhost:54324
- Все письма (подтверждение, сброс пароля, magic link) будут там

### 6. Запустите приложение

```bash
pnpm dev
```

Откройте http://localhost:3000 и перейдите на `/auth/sign-up` для регистрации.

## Регистрация через Email

1. Перейдите на `/auth/sign-up`
2. Введите email и пароль
3. Нажмите "Sign Up"
4. **Важно:** Так как `enable_confirmations = false`, вы можете сразу войти без подтверждения email
5. Если хотите увидеть письмо подтверждения, откройте Inbucket: http://localhost:54324

## Вход через Magic Link

1. Перейдите на `/auth/sign-in`
2. Выберите "Magic Link"
3. Введите email
4. Проверьте Inbucket (http://localhost:54324) для получения ссылки
5. Нажмите на ссылку в письме для входа

## Включение Google OAuth (опционально)

Если хотите протестировать Google OAuth локально:

1. Создайте OAuth приложение в Google Cloud Console
2. Добавьте redirect URI: `http://localhost:54321/auth/v1/callback`
3. Обновите `apps/web/supabase/config.toml`:
```toml
[auth.external.google]
enabled = true
client_id = "ваш-google-client-id"
secret = "ваш-google-client-secret"
```
4. В `.env.local` установите:
```env
NEXT_PUBLIC_AUTH_OAUTH_ENABLED=true
```
5. Перезапустите Supabase: `pnpm supabase:restart`

## Отключение подтверждения email (для продакшена)

⚠️ **Важно:** В продакшене обязательно включите `enable_confirmations = true` в Supabase Dashboard для безопасности!

## Устранение проблем

### Ошибка: "Email already registered"
- Проверьте базу данных в Supabase Studio: http://localhost:54323
- Или сбросьте базу: `pnpm supabase:reset`

### Ошибка: "Invalid login credentials"
- Убедитесь, что Supabase запущен: `pnpm supabase:status`
- Проверьте значения в `.env.local`

### Письма не приходят
- Проверьте Inbucket: http://localhost:54324
- Убедитесь, что Inbucket запущен (часть локального Supabase)

