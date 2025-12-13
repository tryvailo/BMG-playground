# Анализ Google API ключей для E-E-A-T Audit

## Текущая ситуация

### Используемые API ключи в проекте:

1. **`GOOGLE_PAGESPEED_API_KEY`** (текущий)
   - Используется для: Google PageSpeed Insights API
   - Endpoint: `https://www.googleapis.com/pagespeedonline/v5/runPagespeed`
   - Назначение: Проверка производительности сайта (технический аудит)

### Требуемые API для E-E-A-T Audit:

1. **Google Maps Platform API** (Places API)
   - Endpoint: `https://maps.googleapis.com/maps/api/place/...`
   - Назначение: Получение рейтингов и отзывов из Google Maps
   - Используется в: `google-maps-client.ts`

2. **Google Maps Platform API** (Places API - для NAP)
   - Endpoint: `https://maps.googleapis.com/maps/api/place/details/json`
   - Назначение: Получение NAP данных из Google Business Profile
   - Используется в: `google-business-client.ts`

---

## Совместимость ключей

### ✅ Хорошие новости:

**Один Google Cloud API ключ может использоваться для нескольких API**, если в проекте Google Cloud включены все необходимые API:

1. **PageSpeed Insights API** (уже используется)
2. **Places API** (нужно для E-E-A-T audit)
3. **Geocoding API** (опционально, для улучшения поиска)

### ⚠️ Важно:

**Текущий `GOOGLE_PAGESPEED_API_KEY` может работать для Places API**, но только если:
- В Google Cloud Console для этого ключа включен **Places API**
- Ключ не имеет ограничений, которые блокируют доступ к Places API

---

## Проверка текущего ключа

### Шаг 1: Проверка в Google Cloud Console

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Выберите проект, в котором создан `GOOGLE_PAGESPEED_API_KEY`
3. Перейдите в **APIs & Services** → **Library**
4. Проверьте, включены ли следующие API:
   - ✅ **PageSpeed Insights API** (должен быть включен)
   - ❓ **Places API** (нужно проверить)
   - ❓ **Geocoding API** (опционально)

### Шаг 2: Проверка ограничений ключа

1. Перейдите в **APIs & Services** → **Credentials**
2. Найдите ваш API ключ
3. Проверьте **API restrictions**:
   - Если стоит "Restrict key" → убедитесь, что Places API включен в списке разрешенных
   - Если стоит "Don't restrict key" → ключ должен работать для всех включенных API

### Шаг 3: Тестирование ключа

Выполните тестовый запрос к Places API:

```bash
# Замените YOUR_API_KEY на ваш GOOGLE_PAGESPEED_API_KEY
curl "https://maps.googleapis.com/maps/api/place/textsearch/json?query=clinic+kyiv&key=YOUR_API_KEY"
```

**Ожидаемый результат:**
- ✅ Если возвращается JSON с результатами → ключ работает, можно использовать
- ❌ Если возвращается ошибка "This API project is not authorized to use this API" → нужно включить Places API

---

## Рекомендации

### Вариант 1: Использовать существующий ключ (рекомендуется)

**Если ваш `GOOGLE_PAGESPEED_API_KEY` уже имеет доступ к Places API:**

1. ✅ Включите **Places API** в Google Cloud Console (если еще не включен)
2. ✅ Убедитесь, что ключ не ограничен только PageSpeed Insights API
3. ✅ Используйте тот же ключ для E-E-A-T audit

**Преимущества:**
- Не нужно создавать новые ключи
- Проще управление (один ключ)
- Меньше переменных окружения

**Настройка:**
```env
# В .env.local или Vercel
GOOGLE_PAGESPEED_API_KEY=your-existing-key
# Этот же ключ будет использоваться для Places API
```

### Вариант 2: Создать отдельный ключ (если текущий не работает)

**Если ваш `GOOGLE_PAGESPEED_API_KEY` не может получить доступ к Places API:**

1. Создайте новый API ключ в Google Cloud Console
2. Включите для него:
   - **Places API**
   - **Geocoding API** (опционально)
3. Добавьте новую переменную окружения

**Настройка:**
```env
# В .env.local или Vercel
GOOGLE_PAGESPEED_API_KEY=your-pagespeed-key
GOOGLE_MAPS_API_KEY=your-new-maps-key  # Новый ключ для Places API
```

---

## Текущая реализация в коде

### Как работает сейчас:

В `eeat-audit.ts` реализован fallback механизм:

```typescript
const mapsApiKey =
  googleMapsApiKey || 
  process.env.GOOGLE_MAPS_API_KEY || 
  process.env.GOOGLE_PAGESPEED_API_KEY;  // ← Fallback на существующий ключ
```

**Это означает:**
1. Сначала проверяется переданный ключ (`googleMapsApiKey`)
2. Затем проверяется `GOOGLE_MAPS_API_KEY` (если создан отдельный)
3. В конце используется `GOOGLE_PAGESPEED_API_KEY` как fallback

### Преимущества такого подхода:

- ✅ Работает "из коробки" с существующим ключом (если Places API включен)
- ✅ Позволяет использовать отдельный ключ, если нужно
- ✅ Не требует обязательной настройки новых переменных

---

## Инструкция по включению Places API

### Если нужно включить Places API для существующего ключа:

1. **Откройте Google Cloud Console:**
   - https://console.cloud.google.com/

2. **Выберите проект:**
   - Выберите проект, в котором создан ваш `GOOGLE_PAGESPEED_API_KEY`

3. **Включите Places API:**
   - Перейдите в **APIs & Services** → **Library**
   - Найдите "Places API"
   - Нажмите **Enable**

4. **Проверьте ограничения ключа:**
   - Перейдите в **APIs & Services** → **Credentials**
   - Найдите ваш API ключ
   - Нажмите на него для редактирования
   - В разделе **API restrictions**:
     - Если "Don't restrict key" → всё готово ✅
     - Если "Restrict key" → добавьте "Places API" в список разрешенных

5. **Проверьте квоты:**
   - Перейдите в **APIs & Services** → **Dashboard**
   - Найдите "Places API"
   - Проверьте, что квоты не исчерпаны

---

## Стоимость API

### Google Maps Platform (Places API):

**Бесплатный тариф:**
- $200 кредитов в месяц (эквивалент ~$200)
- Places API Text Search: $32 за 1000 запросов
- Places API Place Details: $17 за 1000 запросов
- **Примерно 6,000-12,000 запросов в месяц бесплатно**

**После бесплатного тарифа:**
- Оплата по факту использования
- Минимальная стоимость: $0.017 за запрос Place Details

### PageSpeed Insights API:

**Бесплатный тариф:**
- 25,000 запросов в день бесплатно
- После этого: платно

---

## Рекомендация

### ✅ Используйте существующий `GOOGLE_PAGESPEED_API_KEY`

**Действия:**
1. Проверьте, включен ли Places API в вашем Google Cloud проекте
2. Если нет → включите Places API
3. Проверьте ограничения ключа
4. Протестируйте ключ с Places API
5. Если работает → используйте тот же ключ

**Если ключ не работает:**
- Создайте новый ключ специально для Places API
- Добавьте `GOOGLE_MAPS_API_KEY` в переменные окружения
- Код уже поддерживает оба варианта

---

## Тестирование

### Быстрый тест ключа:

```bash
# Замените YOUR_KEY на ваш GOOGLE_PAGESPEED_API_KEY
curl "https://maps.googleapis.com/maps/api/place/textsearch/json?query=clinic&key=YOUR_KEY"
```

**Ожидаемый результат:**
```json
{
  "status": "OK",
  "results": [...]
}
```

**Если ошибка:**
```json
{
  "error_message": "This API project is not authorized to use this API.",
  "status": "REQUEST_DENIED"
}
```
→ Нужно включить Places API в Google Cloud Console

---

## Заключение

**Текущий `GOOGLE_PAGESPEED_API_KEY` скорее всего подойдет**, если:
- ✅ Включить Places API в Google Cloud Console
- ✅ Убедиться, что ключ не ограничен только PageSpeed Insights

**Если не подходит:**
- Создать новый ключ `GOOGLE_MAPS_API_KEY`
- Код уже поддерживает оба варианта

**Рекомендация:** Попробуйте сначала использовать существующий ключ, включив Places API. Это проще и не требует дополнительных настроек.




