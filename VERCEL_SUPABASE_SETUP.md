# Настройка Supabase для Vercel

## ✅ Ваши данные Supabase

- **Project Name**: BMG-medical
- **Project URL**: https://evwjxpoclynilpkirdil.supabase.co
- **Anon Key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2d2p4cG9jbHluaWxwa2lyZGlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzOTAyMjQsImV4cCI6MjA4MDk2NjIyNH0.QiWPINVdTUNCBpizQ2ZhlAahbqzaRxoDEtvqwm0hMlM
- **Service Role Key**: re_BTKigtXp_BmbbCm2o7Qi6fbPnVn8ezBQR

## 📝 Переменные окружения для Vercel

Добавьте следующие переменные в **Settings → Environment Variables** вашего проекта Vercel:

### 1. NEXT_PUBLIC_SUPABASE_URL
```
https://evwjxpoclynilpkirdil.supabase.co
```
- **Environment**: Production, Preview, Development
- **Важно**: Это публичная переменная (NEXT_PUBLIC_*)

### 2. NEXT_PUBLIC_SUPABASE_ANON_KEY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2d2p4cG9jbHluaWxwa2lyZGlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzOTAyMjQsImV4cCI6MjA4MDk2NjIyNH0.QiWPINVdTUNCBpizQ2ZhlAahbqzaRxoDEtvqwm0hMlM
```
- **Environment**: Production, Preview, Development
- **Важно**: Это публичная переменная (NEXT_PUBLIC_*)

### 3. SUPABASE_SERVICE_ROLE_KEY
```
re_BTKigtXp_BmbbCm2o7Qi6fbPnVn8ezBQR
```
- **Environment**: Production, Preview, Development
- **⚠️ КРИТИЧЕСКИ ВАЖНО**: Это секретный ключ! НЕ добавляйте `NEXT_PUBLIC_` к этой переменной!
- **⚠️ БЕЗОПАСНОСТЬ**: Никогда не коммитьте этот ключ в git и не показывайте его публично

## 🔧 Инструкция по добавлению в Vercel

1. Откройте ваш проект на Vercel: https://vercel.com/dashboard
2. Перейдите в **Settings** → **Environment Variables**
3. Для каждой переменной:
   - Нажмите **Add New**
   - Введите **Key** (имя переменной)
   - Вставьте **Value** (значение)
   - Выберите **Environments**: Production, Preview, Development
   - Нажмите **Save**
4. После добавления всех переменных:
   - Перейдите в **Deployments**
   - Найдите последний deployment
   - Нажмите **⋯** (три точки) → **Redeploy**
   - Или создайте новый commit и push, чтобы запустить автоматический деплой

## ✅ Проверка

После деплоя проверьте:
1. Приложение должно запуститься без ошибок
2. Страница `/auth/sign-in` должна работать
3. Можно создать аккаунт и войти в систему
4. Дашборд `/home` должен быть доступен после входа

## 🔐 Дополнительные настройки (опционально)

Если хотите включить дополнительные функции аутентификации, добавьте:

### NEXT_PUBLIC_AUTH_PASSWORD
```
true
```
- Включает вход по email/password

### NEXT_PUBLIC_AUTH_MAGIC_LINK
```
true
```
- Включает вход по magic link (email без пароля)

### NEXT_PUBLIC_CAPTCHA_SITE_KEY
```
ваш-recaptcha-ключ
```
- Только если используете reCAPTCHA

## ⚠️ Важные замечания

1. **Service Role Key** - это самый важный секретный ключ. Он дает полный доступ к базе данных. Храните его в безопасности!
2. После добавления переменных **обязательно пересоберите проект** (Redeploy)
3. Убедитесь, что все переменные добавлены для всех окружений (Production, Preview, Development)
4. Проверьте, что URL заканчивается на `.supabase.co` (без `/` в конце)

