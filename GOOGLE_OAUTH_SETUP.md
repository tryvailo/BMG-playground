# Google OAuth Setup Guide

## Проблема
При попытке войти через Google вы получаете ошибку:
```json
{
  "code": 400,
  "error_code": "validation_failed",
  "msg": "Unsupported provider: provider is not enabled"
}
```

Это означает, что Google OAuth провайдер не включен в настройках Supabase.

## Решение

### Шаг 1: Создайте OAuth приложение в Google Cloud Console

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Выберите или создайте проект
3. Перейдите в **APIs & Services** → **Credentials**
4. Нажмите **Create Credentials** → **OAuth client ID**
5. Выберите тип приложения: **Web application**
6. Заполните:
   - **Name**: `BMG Medical Playground` (или любое другое имя)
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (для локальной разработки)
     - `https://your-vercel-domain.vercel.app` (для продакшена)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/auth/callback` (для локальной разработки)
     - `https://your-vercel-domain.vercel.app/auth/callback` (для продакшена)
7. Нажмите **Create**
8. Скопируйте **Client ID** и **Client Secret**

### Шаг 2: Включите Google OAuth в Supabase Dashboard

#### Для Production (Vercel):

1. Откройте [Supabase Dashboard](https://supabase.com/dashboard)
2. Выберите ваш проект: **BMG-medical**
3. Перейдите в **Authentication** → **Providers**
4. Найдите **Google** в списке провайдеров
5. Включите переключатель **Enable Google provider**
6. Вставьте:
   - **Client ID (for OAuth)**: ваш Google Client ID
   - **Client Secret (for OAuth)**: ваш Google Client Secret
7. Нажмите **Save**

#### Для Local Development:

1. Откройте файл `apps/web/supabase/config.toml`
2. Найдите секцию `[auth.external.google]` (если её нет, добавьте после других провайдеров)
3. Добавьте/обновите настройки:
```toml
[auth.external.google]
enabled = true
client_id = "ваш-google-client-id"
secret = "ваш-google-client-secret"
```

4. Перезапустите локальный Supabase:
```bash
pnpm supabase:stop
pnpm supabase:start
```

### Шаг 3: Обновите Redirect URLs в Google Cloud Console

После настройки Supabase, убедитесь, что в Google Cloud Console добавлены правильные redirect URLs:

**Для Production:**
- `https://evwjxpoclynilpkirdil.supabase.co/auth/v1/callback`

**Для Local Development:**
- `http://localhost:54321/auth/v1/callback`

> **Важно:** Supabase автоматически добавляет `/auth/v1/callback` к вашему Supabase URL. Это стандартный endpoint для OAuth callback.

### Шаг 4: Проверьте переменные окружения

Убедитесь, что в Vercel (или `.env.local` для локальной разработки) установлены:

```env
NEXT_PUBLIC_SUPABASE_URL=https://evwjxpoclynilpkirdil.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ваш-anon-key
SUPABASE_SERVICE_ROLE_KEY=ваш-service-role-key
```

### Шаг 5: Тестирование

1. **Локально:**
   - Убедитесь, что Supabase запущен: `pnpm supabase:status`
   - Запустите приложение: `pnpm dev`
   - Попробуйте войти через Google

2. **На Vercel:**
   - После деплоя попробуйте войти через Google
   - Проверьте логи в Vercel Dashboard, если есть ошибки

## Частые проблемы

### Проблема: "redirect_uri_mismatch"
**Решение:** Убедитесь, что в Google Cloud Console добавлен правильный redirect URI:
- Для Supabase: `https://ваш-project-ref.supabase.co/auth/v1/callback`

### Проблема: "invalid_client"
**Решение:** Проверьте, что Client ID и Client Secret правильно скопированы в Supabase Dashboard (без лишних пробелов).

### Проблема: OAuth работает локально, но не на Vercel
**Решение:** 
1. Убедитесь, что в Supabase Dashboard (production) включен Google провайдер
2. Проверьте, что в Google Cloud Console добавлен redirect URI для вашего Vercel домена
3. Убедитесь, что переменные окружения в Vercel настроены правильно

## Дополнительные ресурсы

- [Supabase OAuth Documentation](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google OAuth Setup Guide](https://developers.google.com/identity/protocols/oauth2/web-server)

