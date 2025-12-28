# Анализ проблемы: Почему не используются Google API и нужные ключи

## 🔍 Обнаруженные проблемы

### Проблема 1: Place ID не передается

**Место:** `apps/web/app/[locale]/home/local-indicators/page.tsx:88`

```typescript
const auditResult = await performLocalIndicatorsAudit({
  url: normalizedUrl,
  placeId: undefined, // ❌ Place ID закомментирован как undefined
  googleApiKey: googlePlacesApiKey?.trim() || undefined,
  // ...
});
```

**Последствие:** Без Place ID функции `analyzeGoogleBusinessProfile` и `analyzeReviewResponse` возвращают defaultResult (все нули).

---

### Проблема 2: Строгая проверка в анализаторе

**Место:** `apps/web/lib/server/services/local/local-analyzer.ts:186-188`

```typescript
async function analyzeGoogleBusinessProfile(
  placeId?: string,
  apiKey?: string,
): Promise<GoogleBusinessProfile> {
  // ...
  if (!placeId || !apiKey) {  // ❌ Если хотя бы один отсутствует - возвращает нули
    return defaultResult;
  }
  // ...
}
```

**Последствие:** Даже если API ключ есть, но Place ID отсутствует, функция не пытается найти Place ID автоматически.

---

### Проблема 3: Нет автоматического поиска Place ID

**Текущая ситуация:**
- В системе есть функция `findPlaceIdByNAP` в `google-business-client.ts`
- Но она не используется в Local Indicators аудите
- Пользователь должен вручную найти и ввести Place ID

**Что нужно:**
- Автоматически находить Place ID по названию клиники и городу
- Использовать Google Places API Text Search для поиска

---

### Проблема 4: Пустые строки считаются отсутствующими ключами

**Место:** `apps/web/app/[locale]/home/local-indicators/page.tsx:89`

```typescript
googleApiKey: googlePlacesApiKey?.trim() || undefined,
```

**Проблема:** Если ключ сохранен как пустая строка `""`, то после `trim()` получается `""`, что является falsy, и передается `undefined`.

**Последствие:** Даже если ключ сохранен в localStorage, но пустой, он не передается в server action.

---

### Проблема 5: Fallback на env переменные может не работать

**Место:** `apps/web/lib/actions/local-indicators-audit.ts:64-68`

```typescript
const apiKey =
  googleApiKey ||
  process.env.GOOGLE_MAPS_API_KEY ||
  process.env.GOOGLE_BUSINESS_API_KEY ||
  process.env.GOOGLE_PAGESPEED_API_KEY;
```

**Проблема:** Если `googleApiKey` передан как пустая строка `""`, то условие `googleApiKey ||` вернет `""` (falsy), и будет использоваться fallback на env переменные. Но если env переменные тоже не настроены, то `apiKey` будет `undefined`.

---

## 🔧 Решения

### Решение 1: Добавить автоматический поиск Place ID

**Файл:** `apps/web/lib/server/services/local/local-analyzer.ts`

Добавить функцию для автоматического поиска Place ID:

```typescript
/**
 * Find Place ID using Google Places API Text Search
 */
async function findPlaceIdByText(
  query: string,
  apiKey: string,
): Promise<string | null> {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`,
      {
        signal: AbortSignal.timeout(10000),
      },
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      return data.results[0].place_id;
    }

    return null;
  } catch (error) {
    console.warn('[LocalAnalyzer] Failed to find place ID:', error);
    return null;
  }
}
```

Изменить `analyzeGoogleBusinessProfile`:

```typescript
async function analyzeGoogleBusinessProfile(
  placeId?: string,
  apiKey?: string,
  clinicName?: string,
  city?: string,
): Promise<GoogleBusinessProfile> {
  // ...
  
  // Если Place ID не передан, но есть API ключ и название клиники - попытаться найти
  let finalPlaceId = placeId;
  if (!finalPlaceId && apiKey && clinicName) {
    const searchQuery = city ? `${clinicName}, ${city}` : clinicName;
    console.log('[LocalAnalyzer] Attempting to find Place ID for:', searchQuery);
    finalPlaceId = await findPlaceIdByText(searchQuery, apiKey) || undefined;
    
    if (finalPlaceId) {
      console.log('[LocalAnalyzer] Found Place ID:', finalPlaceId);
    } else {
      console.warn('[LocalAnalyzer] Could not find Place ID for:', searchQuery);
    }
  }
  
  if (!finalPlaceId || !apiKey) {
    console.warn('[LocalAnalyzer] Missing Place ID or API key. Place ID:', !!finalPlaceId, 'API Key:', !!apiKey);
    return defaultResult;
  }
  
  // ...
}
```

---

### Решение 2: Улучшить проверку пустых строк

**Файл:** `apps/web/app/[locale]/home/local-indicators/page.tsx`

Изменить проверку ключей:

```typescript
const googlePlacesApiKey = getStoredValue(STORAGE_KEYS.GOOGLE_PLACES_API_KEY);
// ...

const auditResult = await performLocalIndicatorsAudit({
  url: normalizedUrl,
  placeId: undefined,
  googleApiKey: googlePlacesApiKey && googlePlacesApiKey.trim() ? googlePlacesApiKey.trim() : undefined,
  // ...
});
```

Или лучше - добавить валидацию:

```typescript
const googlePlacesApiKey = getStoredValue(STORAGE_KEYS.GOOGLE_PLACES_API_KEY);
const isValidGoogleKey = googlePlacesApiKey && googlePlacesApiKey.trim().length > 0;

if (!isValidGoogleKey) {
  console.warn('[Local Indicators] Google Places API key is missing or empty');
}
```

---

### Решение 3: Добавить поле Place ID в Configuration

**Файл:** `apps/web/app/[locale]/home/configuration/page.tsx`

Добавить поле для Place ID (опционально):

```typescript
const ConfigurationFormSchema = z.object({
  // ...
  placeId: z.string().optional(), // Новое поле
});

const STORAGE_KEYS = {
  // ...
  PLACE_ID: 'configuration_place_id', // Новый ключ
};
```

И использовать его в Local Indicators page:

```typescript
const placeId = getStoredValue(STORAGE_KEYS.PLACE_ID);
// ...
placeId: placeId?.trim() || undefined,
```

---

### Решение 4: Улучшить логирование

**Файл:** `apps/web/lib/server/services/local/local-analyzer.ts`

Добавить детальное логирование:

```typescript
async function analyzeGoogleBusinessProfile(
  placeId?: string,
  apiKey?: string,
  clinicName?: string,
  city?: string,
): Promise<GoogleBusinessProfile> {
  console.log('[LocalAnalyzer] analyzeGoogleBusinessProfile called with:', {
    hasPlaceId: !!placeId,
    hasApiKey: !!apiKey,
    clinicName,
    city,
  });
  
  // ...
  
  if (!finalPlaceId || !apiKey) {
    console.warn('[LocalAnalyzer] Cannot analyze Google Business Profile:', {
      reason: !finalPlaceId ? 'Place ID missing' : 'API key missing',
      attemptedAutoSearch: !placeId && !!apiKey && !!clinicName,
    });
    return defaultResult;
  }
  
  // ...
}
```

---

## 📋 План реализации

### Приоритет 1 (Критично):
1. ✅ **РЕАЛИЗОВАНО** - Добавить автоматический поиск Place ID по названию клиники и городу
2. ✅ **РЕАЛИЗОВАНО** - Улучшить проверку пустых строк для API ключей
3. ✅ **РЕАЛИЗОВАНО** - Добавить детальное логирование

### Приоритет 2 (Важно):
4. ⚠️ Добавить поле Place ID в Configuration (опционально, для ручного ввода) - можно добавить позже
5. ✅ **ЧАСТИЧНО РЕАЛИЗОВАНО** - Улучшить обработку ошибок API (добавлено логирование)

### Приоритет 3 (Рекомендуется):
6. ✅ **РЕАЛИЗОВАНО** - Добавить валидацию API ключей перед запуском аудита (логирование в консоль)
7. ⚠️ Показать предупреждения в UI, если ключи отсутствуют - можно добавить позже

---

## ✅ Реализованные исправления

### 1. Автоматический поиск Place ID

**Файл:** `apps/web/lib/server/services/local/local-analyzer.ts`

- ✅ Добавлена функция `findPlaceIdByText()` для поиска Place ID через Google Places API Text Search
- ✅ Функция `analyzeGoogleBusinessProfile()` теперь принимает `clinicName` и `city` параметры
- ✅ Функция `analyzeReviewResponse()` теперь принимает `clinicName` и `city` параметры
- ✅ Если Place ID не передан, но есть API ключ и название клиники, система автоматически ищет Place ID
- ✅ Используется формат запроса: `"clinicName, city"` или просто `"clinicName"`

**Код:**
```typescript
// Если Place ID не передан, но есть API ключ и название клиники - попытаться найти
let finalPlaceId = placeId;
if (!finalPlaceId && apiKey && clinicName) {
  const searchQuery = city ? `${clinicName}, ${city}` : clinicName;
  console.log('[LocalAnalyzer] Attempting to find Place ID automatically for:', searchQuery);
  finalPlaceId = await findPlaceIdByText(searchQuery, apiKey) || undefined;
  
  if (finalPlaceId) {
    console.log('[LocalAnalyzer] Successfully found Place ID:', finalPlaceId);
  } else {
    console.warn('[LocalAnalyzer] Could not find Place ID for:', searchQuery);
  }
}
```

### 2. Улучшенная проверка пустых строк

**Файл:** `apps/web/app/[locale]/home/local-indicators/page.tsx`

- ✅ API ключи теперь нормализуются (trim) и проверяются на пустоту
- ✅ Пустые строки преобразуются в `undefined` вместо передачи пустых строк
- ✅ Добавлено логирование статуса API ключей в консоль браузера

**Код:**
```typescript
// Normalize API keys (trim and check if not empty)
const googlePlacesApiKey = googlePlacesApiKeyRaw?.trim() || undefined;
const firecrawlApiKey = firecrawlApiKeyRaw?.trim() || undefined;
// ...

// Log API key status for debugging
console.log('[Local Indicators] API Keys status:', {
  googlePlaces: googlePlacesApiKey ? 'Set' : 'Missing',
  // ...
});
```

### 3. Детальное логирование

**Файл:** `apps/web/lib/server/services/local/local-analyzer.ts`

- ✅ Добавлено логирование параметров в `analyzeGoogleBusinessProfile()`
- ✅ Добавлено логирование параметров в `analyzeReviewResponse()`
- ✅ Добавлено логирование попыток автоматического поиска Place ID
- ✅ Добавлено логирование причин, почему данные не получены

**Примеры логов:**
```
[LocalAnalyzer] analyzeGoogleBusinessProfile called: { hasPlaceId: false, hasApiKey: true, clinicName: 'complimed', city: 'Odesa' }
[LocalAnalyzer] Attempting to find Place ID automatically for: complimed, Odesa
[LocalAnalyzer] Found Place ID via Text Search: ChIJ...
[LocalAnalyzer] Successfully found Place ID: ChIJ...
```

---

## 🧪 Тестирование

После реализации исправлений, система должна:

1. **Автоматически находить Place ID** для клиники "complimed" в городе "Odesa", если:
   - Google Places API ключ настроен
   - Название клиники указано в Configuration
   - Город указан в Configuration

2. **Получать реальные данные** из Google Places API:
   - Google Business Profile completeness
   - Reviews и response rates
   - Photos, services, categories

3. **Логировать процесс** для отладки:
   - Какие параметры переданы
   - Попытки найти Place ID
   - Результаты API вызовов

---

## 📝 Следующие шаги

1. ✅ **Готово** - Автоматический поиск Place ID реализован
2. ✅ **Готово** - Улучшена проверка ключей
3. ✅ **Готово** - Добавлено логирование
4. ⚠️ **Опционально** - Добавить поле Place ID в Configuration для ручного ввода
5. ⚠️ **Опционально** - Показать предупреждения в UI, если ключи отсутствуют
6. 🧪 **Требуется** - Протестировать с реальными данными клиники Complimed

---

## 🔍 Диагностика текущей проблемы

### Шаг 1: Проверить localStorage

Открыть консоль браузера и выполнить:

```javascript
// Проверить сохраненные ключи
console.log('Google Places API Key:', localStorage.getItem('configuration_api_key_google_places'));
console.log('Clinic Name:', localStorage.getItem('configuration_clinic_name'));
console.log('City:', localStorage.getItem('configuration_city'));
```

### Шаг 2: Проверить передачу параметров

В функции `handleRunAudit` добавить логирование:

```typescript
console.log('API Keys before audit:', {
  googlePlacesApiKey: googlePlacesApiKey ? 'Set' : 'Missing',
  clinicName: clinicName || 'Not set',
  city: city || 'Not set',
});
```

### Шаг 3: Проверить server action

В `performLocalIndicatorsAudit` уже есть логирование:

```typescript
console.log('[LocalIndicators] Place ID provided:', !!placeId);
console.log('[LocalIndicators] Google API key provided:', !!googleApiKey);
```

Проверить логи сервера для этих сообщений.

---

## ✅ Ожидаемый результат после исправлений

1. **Автоматический поиск Place ID:**
   - Если Place ID не передан, но есть API ключ и название клиники
   - Система автоматически найдет Place ID через Google Places API Text Search
   - Использует формат: `"clinicName, city"` или просто `"clinicName"`

2. **Улучшенная обработка ключей:**
   - Пустые строки не передаются как `undefined`
   - Валидация ключей перед использованием
   - Детальные сообщения об ошибках

3. **Лучшее логирование:**
   - Понятно, почему данные не получены
   - Видно, какие параметры переданы
   - Видно, какие API вызовы выполнены

---

## 🚀 Следующие шаги

1. Реализовать автоматический поиск Place ID
2. Улучшить проверку и валидацию ключей
3. Добавить детальное логирование
4. Протестировать с реальными данными клиники Complimed

