# 🚀 Быстрая настройка Vercel

## Шаг 1: Запушьте последний коммит

1. Откройте GitHub Desktop
2. Нажмите **"Push origin"** для отправки коммита `2acf215`

## Шаг 2: Добавьте переменные окружения в Vercel

Перейдите в ваш проект Vercel → **Settings** → **Environment Variables** и добавьте:

### ✅ ОБЯЗАТЕЛЬНЫЕ (7 переменных):

1. **NEXT_PUBLIC_PRODUCT_NAME**
   ```
   BoostMyGEO
   ```

2. **NEXT_PUBLIC_SITE_TITLE**
   ```
   BoostMyGEO - AI Visibility Dashboard for Medical Clinics
   ```

3. **NEXT_PUBLIC_SITE_DESCRIPTION**
   ```
   BoostMyGEO helps medical clinics monitor and improve their AI visibility, track keyword rankings, and optimize their online presence.
   ```

4. **NEXT_PUBLIC_SITE_URL**
   ```
   https://your-project-name.vercel.app
   ```
   ⚠️ **ВАЖНО**: Замените `your-project-name` на реальное имя вашего проекта Vercel!
   ⚠️ URL должен начинаться с `https://` (не `http://`)

5. **NEXT_PUBLIC_SUPABASE_URL**
   ```
   https://evwjxpoclynilpkirdil.supabase.co
   ```

6. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2d2p4cG9jbHluaWxwa2lyZGlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzOTAyMjQsImV4cCI6MjA4MDk2NjIyNH0.QiWPINVdTUNCBpizQ2ZhlAahbqzaRxoDEtvqwm0hMlM
   ```

7. **SUPABASE_SERVICE_ROLE_KEY**
   ```
   re_BTKigtXp_BmbbCm2o7Qi6fbPnVn8ezBQR
   ```
   ⚠️ **КРИТИЧЕСКИ ВАЖНО**: НЕ добавляйте `NEXT_PUBLIC_` к этой переменной!

### Для каждой переменной:
- Выберите все окружения: ✅ Production, ✅ Preview, ✅ Development
- Нажмите **Save**

## Шаг 3: Пересоберите проект

После добавления всех переменных:
1. Перейдите в **Deployments**
2. Найдите последний deployment
3. Нажмите **⋯** (три точки) → **Redeploy**
4. Или просто дождитесь автоматического деплоя после push

## ✅ Проверка

После успешного деплоя:
- Приложение должно открыться без ошибок
- Страница `/auth/sign-in` должна работать
- Можно создать аккаунт и войти

## 🔍 Как узнать URL вашего проекта Vercel?

1. Откройте проект в Vercel Dashboard
2. В разделе **Settings** → **Domains** вы увидите URL
3. Или в разделе **Deployments** → выберите любой deployment → там будет указан URL
4. Обычно это: `https://[имя-проекта].vercel.app`

