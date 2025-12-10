# Environment Variables для Vercel

## 🔴 ОБЯЗАТЕЛЬНЫЕ (для базовой работы приложения)

### Supabase (требуются для аутентификации и базы данных)
- `NEXT_PUBLIC_SUPABASE_URL` - URL вашего Supabase проекта
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anon ключ Supabase (публичный)
- `SUPABASE_SERVICE_ROLE_KEY` - Service Role ключ Supabase (секретный, только для сервера)

### Базовые настройки приложения
- `NEXT_PUBLIC_SITE_URL` - URL вашего сайта (например: `https://your-domain.vercel.app`)
- `NEXT_PUBLIC_PRODUCT_NAME` - Название продукта (например: `BoostMyGEO`)
- `NEXT_PUBLIC_SITE_TITLE` - Заголовок сайта
- `NEXT_PUBLIC_SITE_DESCRIPTION` - Описание сайта

## 🟡 ОПЦИОНАЛЬНЫЕ (для полного функционала)

### AI API Keys (для функций Playground и аудита)
- `OPENAI_API_KEY` - OpenAI API ключ (для анализа llms.txt и AI сканирования)
- `PERPLEXITY_API_KEY` - Perplexity API ключ (для AI сканирования видимости)

### Технический аудит
- `GOOGLE_PAGESPEED_API_KEY` - Google PageSpeed Insights API ключ (для проверки производительности)

### Deep Content Analysis
- `FIRECRAWL_API_KEY` - Firecrawl API ключ (для сканирования сайта и поиска дубликатов)

### Тема и UI (опционально, есть дефолтные значения)
- `NEXT_PUBLIC_DEFAULT_THEME_MODE` - Режим темы (`light` или `dark`)
- `NEXT_PUBLIC_THEME_COLOR` - Цвет темы (hex код)
- `NEXT_PUBLIC_THEME_COLOR_DARK` - Цвет темы для темного режима

## 📝 Инструкция по настройке в Vercel

1. Перейдите в ваш проект на Vercel
2. Откройте **Settings** → **Environment Variables**
3. Добавьте каждую переменную:
   - **Name**: имя переменной (например, `NEXT_PUBLIC_SUPABASE_URL`)
   - **Value**: значение переменной
   - **Environment**: выберите окружения (Production, Preview, Development)
4. Нажмите **Save**

## ⚠️ Важные замечания

1. **NEXT_PUBLIC_*** переменные доступны на клиенте - не храните в них секреты!
2. **SUPABASE_SERVICE_ROLE_KEY** - это секретный ключ, НЕ добавляйте `NEXT_PUBLIC_` к нему
3. После добавления переменных нужно **пересобрать проект** (Redeploy)
4. Для Production и Preview окружений можно использовать разные значения

## 🔐 Где взять ключи

- **Supabase**: Dashboard → Settings → API → Project URL и API Keys
- **OpenAI**: https://platform.openai.com/api-keys
- **Perplexity**: https://www.perplexity.ai/settings/api
- **Google PageSpeed**: https://developers.google.com/speed/docs/insights/v5/get-started
- **Firecrawl**: https://www.firecrawl.dev/

