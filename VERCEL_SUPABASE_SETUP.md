# Настройка Supabase для Vercel

## ✅ Ваши данные Supabase

- **Project Name**: BMG-medical
- **Project URL**: https://evwjxpoclynilpkirdil.supabase.co
- **Anon Key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2d2p4cG9jbHluaWxwa2lyZGlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzOTAyMjQsImV4cCI6MjA4MDk2NjIyNH0.QiWPINVdTUNCBpizQ2ZhlAahbqzaRxoDEtvqwm0hMlM
- **Service Role Key**: re_BTKigtXp_BmbbCm2o7Qi6fbPnVn8ezBQR

## 📝 Переменные окружения для Vercel

Добавьте следующие переменные в **Settings → Environment Variables** вашего проекта Vercel:

### Базовые настройки приложения (ОБЯЗАТЕЛЬНО)

#### 1. NEXT_PUBLIC_PRODUCT_NAME
```
ClinicBoost.AI
```
- **Environment**: Production, Preview, Development
- **Важно**: Название вашего продукта

#### 2. NEXT_PUBLIC_SITE_TITLE
```
ClinicBoost.AI - AI Visibility Dashboard for Medical Clinics
```
- **Environment**: Production, Preview, Development
- **Важно**: Заголовок сайта (используется в мета-тегах)

#### 3. NEXT_PUBLIC_SITE_DESCRIPTION
```
ClinicBoost.AI helps medical clinics monitor and improve their AI visibility, track keyword rankings, and optimize their online presence.
```
- **Environment**: Production, Preview, Development
- **Важно**: Описание сайта (используется в мета-тегах)

#### 4. NEXT_PUBLIC_SITE_URL
```
https://your-app-name.vercel.app
```
- **Environment**: Production, Preview, Development
- **⚠️ ВАЖНО**: Замените `your-app-name` на реальное имя вашего проекта Vercel
- **⚠️ ВАЖНО**: URL должен начинаться с `https://` (не `http://`)
- **Пример**: `https://bmg-playground.vercel.app`

### Аутентификация (ОБЯЗАТЕЛЬНО для регистрации через email)

#### 5. NEXT_PUBLIC_AUTH_PASSWORD
```
true
```
- **Environment**: Production, Preview, Development
- **⚠️ КРИТИЧЕСКИ ВАЖНО**: Без этой переменной регистрация через email НЕ БУДЕТ РАБОТАТЬ!
- **Описание**: Включает регистрацию и вход по email/паролю
- **Значение**: Должно быть именно `true` (строка, не boolean)

#### 6. NEXT_PUBLIC_AUTH_MAGIC_LINK (опционально, но рекомендуется)
```
true
```
- **Environment**: Production, Preview, Development
- **Описание**: Включает вход по magic link (ссылка в email без пароля)
- **Значение**: Должно быть именно `true` (строка, не boolean)

### Supabase (ОБЯЗАТЕЛЬНО)

#### 7. NEXT_PUBLIC_SUPABASE_URL
```
https://evwjxpoclynilpkirdil.supabase.co
```
- **Environment**: Production, Preview, Development
- **Важно**: Это публичная переменная (NEXT_PUBLIC_*)

#### 8. NEXT_PUBLIC_SUPABASE_ANON_KEY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2d2p4cG9jbHluaWxwa2lyZGlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzOTAyMjQsImV4cCI6MjA4MDk2NjIyNH0.QiWPINVdTUNCBpizQ2ZhlAahbqzaRxoDEtvqwm0hMlM
```
- **Environment**: Production, Preview, Development
- **Важно**: Это публичная переменная (NEXT_PUBLIC_*)

#### 9. SUPABASE_SERVICE_ROLE_KEY
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

