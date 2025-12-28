# Сверка реализации Local Indicators с техническим заданием

## Обзор
Документ содержит детальную сверку реализации раздела "Локальные показатели" с техническим заданием, разбитую по категориям согласно нумерации из ТЗ.

---

## 6.1. Google Business Profile

### Требования из ТЗ:
- **Ступінь заповнення всіх доступних полів**: категорії, години роботи, атрибути, опис, фото, послуги, Q&A, пости
- **Прорахунок**:
  - % заповнених полів профілю (обов'язкові + опціональні)
  - Кількість якісних фото (мінімум 10–15, включно з екстер'єром, інтер'єром, командою, обладнанням)
  - Кількість активних послуг / категорій, що вказані
  - Наявність і регулярність Google Posts (хоча б 1 на міс)

### Реализовано в коде:

#### ✅ Типы данных (`types.ts`):
```18:57:nextjs-saas-starter/apps/web/lib/server/services/local/types.ts
const GoogleBusinessProfileSchema = z.object({
  completeness_percent: z.number().min(0).max(100),
  filled_fields_count: z.number().int().nonnegative(),
  total_fields_count: z.number().int().nonnegative(),
  photos_count: z.number().int().nonnegative(),
  high_quality_photos_count: z.number().int().nonnegative(),
  has_exterior_photos: z.boolean(),
  has_interior_photos: z.boolean(),
  has_team_photos: z.boolean(),
  has_equipment_photos: z.boolean(),
  services_count: z.number().int().nonnegative(),
  categories_count: z.number().int().nonnegative(),
  has_description: z.boolean(),
  has_business_hours: z.boolean(),
  has_all_days_hours: z.boolean(),
  attributes_count: z.number().int().nonnegative(),
  has_qa: z.boolean(),
  posts_count: z.number().int().nonnegative(),
  posts_per_month: z.number().nonnegative(),
  last_post_date: z.string().optional(),
});
```

#### ✅ UI компонент (`LocalIndicatorsSection.tsx`):
- Отображение completeness_percent
- Показ количества фото (общее и высококачественных)
- Показ количества сервисов
- Показ постов в месяц
- Чеклист для всех полей
- Примеры хороших/плохих практик
- Описание расчета

#### ⚠️ Реализация анализа (`local-analyzer.ts`):
```143:224:nextjs-saas-starter/apps/web/lib/server/services/local/local-analyzer.ts
async function analyzeGoogleBusinessProfile(
  placeId?: string,
  apiKey?: string,
): Promise<GoogleBusinessProfile> {
  // TODO: Implement real Google My Business API integration
  // For now, return default values indicating no data available
```

**Статус**: Структура данных полностью соответствует ТЗ, но **реальная интеграция с Google My Business API не реализована** - функция возвращает заглушки.

### Вывод по 6.1:
- ✅ **Структура данных**: Полностью соответствует ТЗ
- ✅ **UI отображение**: Полностью реализовано
- ❌ **Реальная интеграция API**: Не реализована (TODO)

---

## 6.2. Реакція на відгуки

### Требования из ТЗ:
- **Швидкість та якість відповідей** клініки на нові відгуки в Google, DOC.ua, Helsi
- **Прорахунок**: % відгуків із відповіддю від клініки на протязі доби від відгука людини

### Реализовано в коде:

#### ✅ Типы данных (`types.ts`):
```78:99:nextjs-saas-starter/apps/web/lib/server/services/local/types.ts
const ReviewResponseSchema = z.object({
  total_reviews: z.number().int().nonnegative(),
  responded_reviews: z.number().int().nonnegative(),
  response_rate_percent: z.number().min(0).max(100),
  responded_within_24h: z.number().int().nonnegative(),
  response_rate_24h_percent: z.number().min(0).max(100),
  average_response_time_hours: z.number().nonnegative().optional(),
  negative_reviews_count: z.number().int().nonnegative(),
  negative_reviews_responded: z.number().int().nonnegative(),
  negative_response_rate_percent: z.number().min(0).max(100),
  platforms: z.array(ReviewResponsePlatformSchema),
});
```

**Платформы**:
```63:72:nextjs-saas-starter/apps/web/lib/server/services/local/types.ts
const ReviewResponsePlatformSchema = z.object({
  platform: z.enum(['google', 'doc_ua', 'helsi']),
  total_reviews: z.number().int().nonnegative(),
  responded_reviews: z.number().int().nonnegative(),
  response_rate_percent: z.number().min(0).max(100),
});
```

#### ✅ UI компонент:
- Отображение общего response_rate_percent
- Отображение response_rate_24h_percent (основная метрика из ТЗ)
- Разбивка по платформам (Google, DOC.ua, Helsi)
- Обработка негативных отзывов
- Примеры хороших/плохих практик

#### ⚠️ Реализация анализа:
```242:296:nextjs-saas-starter/apps/web/lib/server/services/local/local-analyzer.ts
async function analyzeReviewResponse(
  placeId?: string,
  apiKey?: string,
): Promise<ReviewResponse> {
  // TODO: Implement real API integrations
  // TODO: Fetch reviews from Google My Business API
  // TODO: Fetch reviews from DOC.ua API (if available)
  // TODO: Fetch reviews from Helsi API (if available)
```

**Статус**: Структура данных полностью соответствует ТЗ, но **реальная интеграция с API платформ не реализована**.

### Вывод по 6.2:
- ✅ **Структура данных**: Полностью соответствует ТЗ (включая все 3 платформы)
- ✅ **UI отображение**: Полностью реализовано
- ❌ **Реальная интеграция API**: Не реализована (требуются API для Google, DOC.ua, Helsi)

---

## 6.3. Взаємодія з Google Business Profile

### Требования из ТЗ:
- **Кількість разів, коли профіль відображався** в пошуку чи на мапі (Impressions)
- **Дії користувачів**: кліки на сайт, запит маршруту, дзвінки, перегляди фото, бронювання
- **Прорахунок**:
  - Кількість показів профілю за місяць (Search + Maps)
  - Кількість кліків на сайт, дзвінків, запитів маршруту за місяць
  - CTR (відношення дій до показів)

### Реализовано в коде:

#### ✅ Типы данных (`types.ts`):
```105:126:nextjs-saas-starter/apps/web/lib/server/services/local/types.ts
const GBPEngagementSchema = z.object({
  impressions_per_month: z.number().int().nonnegative(),
  website_clicks_per_month: z.number().int().nonnegative(),
  calls_per_month: z.number().int().nonnegative(),
  direction_requests_per_month: z.number().int().nonnegative(),
  photo_views_per_month: z.number().int().nonnegative().optional(),
  bookings_per_month: z.number().int().nonnegative().optional(),
  total_actions_per_month: z.number().int().nonnegative(),
  ctr_percent: z.number().min(0).max(100),
  search_impressions: z.number().int().nonnegative(),
  maps_impressions: z.number().int().nonnegative(),
});
```

#### ✅ UI компонент:
- Отображение impressions_per_month с разбивкой на Search + Maps
- Отображение website_clicks_per_month
- Отображение calls_per_month
- Отображение direction_requests_per_month
- Расчет и отображение CTR
- Примеры хороших/плохих практик

#### ⚠️ Реализация анализа:
```314:366:nextjs-saas-starter/apps/web/lib/server/services/local/local-analyzer.ts
async function analyzeGBPEngagement(
  placeId?: string,
  apiKey?: string,
): Promise<GBPEngagement> {
  // TODO: Implement real Google My Business Insights API integration
```

**Статус**: Структура данных полностью соответствует ТЗ, но **реальная интеграция с Google My Business Insights API не реализована**.

### Вывод по 6.3:
- ✅ **Структура данных**: Полностью соответствует ТЗ (все метрики присутствуют)
- ✅ **UI отображение**: Полностью реализовано
- ❌ **Реальная интеграция API**: Не реализована (требуется Google My Business Insights API)

---

## 6.4. Local Backlinks

### Требования из ТЗ:
- **Посилання на сайт клініки з локальних джерел**: міські портали, новини, партнери, медичні асоціації, благодійні фонди, локальні блогери
- **Прорахунок**: Кількість унікальних локальних доменів, що посилаються на клініку з того ж міста де знаходиться клініка
- **Критерій**: <5 погано, >= 5 - добре

### Реализовано в коде:

#### ✅ Типы данных (`types.ts`):
```168:179:nextjs-saas-starter/apps/web/lib/server/services/local/types.ts
const LocalBacklinksSchema = z.object({
  total_local_backlinks: z.number().int().nonnegative(),
  unique_local_domains: z.number().int().nonnegative(),
  city: z.string().optional(),
  backlinks_by_type: LocalBacklinksByTypeSchema,
  backlinks: z.array(LocalBacklinkSchema),
});
```

**Типы бэклинков**:
```149:162:nextjs-saas-starter/apps/web/lib/server/services/local/types.ts
const LocalBacklinksByTypeSchema = z.object({
  city_portals: z.number().int().nonnegative(),
  news_sites: z.number().int().nonnegative(),
  partners: z.number().int().nonnegative(),
  medical_associations: z.number().int().nonnegative(),
  charity_foundations: z.number().int().nonnegative(),
  local_bloggers: z.number().int().nonnegative(),
});
```

**Классификация типов**:
```48:55:nextjs-saas-starter/apps/web/lib/server/services/local/local-analyzer.ts
const BACKLINK_TYPE_PATTERNS = {
  city_portal: ['city', 'misto', 'город', 'portal', 'портал'],
  news: ['news', 'новини', 'новости', 'media', 'медіа', 'медиа'],
  partner: ['partner', 'партнер', 'партнёр'],
  association: ['association', 'асоціація', 'ассоциация', 'union', 'союз'],
  charity: ['charity', 'благодійність', 'благотворительность', 'foundation', 'фонд'],
  blogger: ['blog', 'блог', 'blogger', 'блогер'],
} as const;
```

#### ✅ UI компонент:
- Отображение unique_local_domains с критерием >= 5
- Разбивка по типам источников
- Список бэклинков
- Примеры хороших/плохих практик

#### ⚠️ Реализация анализа:
```419:463:nextjs-saas-starter/apps/web/lib/server/services/local/local-analyzer.ts
async function analyzeLocalBacklinks(
  domain: string,
  city?: string,
): Promise<LocalBacklinks> {
  // TODO: Implement real backlink analysis
  // Options:
  // 1. Use Ahrefs API
  // 2. Use SEMrush API
  // 3. Use Google Search Console API
  // 4. Crawl and analyze manually
```

**Статус**: Структура данных полностью соответствует ТЗ, но **реальная интеграция с SEO API (Ahrefs/SEMrush) не реализована**.

### Вывод по 6.4:
- ✅ **Структура данных**: Полностью соответствует ТЗ (все типы источников присутствуют)
- ✅ **UI отображение**: Полностью реализовано
- ✅ **Критерий оценки**: Реализован (>= 5 = хорошо)
- ❌ **Реальная интеграция API**: Не реализована (требуется SEO API)

---

## 6.5. Активність у локальних соцмережах

### Требования из ТЗ:
- **Активні профілі** клініки у Facebook, Instagram
- **Характеристики**: геотеги, згадки міста/району, пости про участь у локальних подіях, взаємодія з місцевою аудиторією
- **Прорахунок**: Наявність профілів із коректним NAP у Facebook, Instagram

### Реализовано в коде:

#### ✅ Типы данных (`types.ts`):
```206:211:nextjs-saas-starter/apps/web/lib/server/services/local/types.ts
const LocalSocialMediaSchema = z.object({
  facebook: SocialMediaProfileSchema,
  instagram: SocialMediaProfileSchema,
});
```

**Детали профиля**:
```185:200:nextjs-saas-starter/apps/web/lib/server/services/local/types.ts
const SocialMediaProfileSchema = z.object({
  has_profile: z.boolean(),
  has_correct_nap: z.boolean(),
  has_geotags: z.boolean(),
  has_city_mentions: z.boolean(),
  posts_about_local_events: z.number().int().nonnegative(),
  interaction_with_local_audience: z.boolean(),
  profile_url: z.string().optional(),
});
```

#### ✅ UI компонент:
- Отдельные карточки для Facebook и Instagram
- Чеклист всех характеристик из ТЗ:
  - Наличие профиля
  - Корректный NAP
  - Геотеги
  - Упоминания города
  - Посты о локальных событиях
  - Взаимодействие с локальной аудиторией
- Ссылки на профили

#### ⚠️ Реализация анализа:
```520:555:nextjs-saas-starter/apps/web/lib/server/services/local/local-analyzer.ts
function analyzeLocalSocialMedia(
  $: CheerioAPI,
  businessName?: string,
  address?: string,
  phone?: string,
  city?: string,
): LocalSocialMedia {
  const facebookUrl = findSocialProfile($, 'facebook');
  const instagramUrl = findSocialProfile($, 'instagram');
  
  // Check for geotags and city mentions (simplified)
  const bodyText = $('body').text().toLowerCase();
  const cityLower = city?.toLowerCase() || '';
  const hasCityMentions = cityLower ? bodyText.includes(cityLower) : false;
  
  return {
    facebook: {
      has_profile: facebookUrl !== null,
      has_correct_nap: checkSocialNAP(facebookUrl, businessName, address, phone),
      has_geotags: false, // TODO: Parse profile page
      has_city_mentions: hasCityMentions,
      posts_about_local_events: 0, // TODO: Parse profile page
      interaction_with_local_audience: false, // TODO: Parse profile page
      profile_url: facebookUrl || undefined,
    },
    // ... аналогично для Instagram
  };
}
```

**Статус**: 
- ✅ Поиск ссылок на профили реализован (парсинг HTML сайта)
- ⚠️ Проверка NAP упрощена (только проверка наличия профиля)
- ❌ Парсинг страниц профилей не реализован (TODO для геотегов, постов, взаимодействия)

### Вывод по 6.5:
- ✅ **Структура данных**: Полностью соответствует ТЗ
- ✅ **UI отображение**: Полностью реализовано
- ⚠️ **Базовая реализация**: Поиск профилей работает
- ❌ **Расширенная функциональность**: Парсинг страниц профилей не реализован (геотеги, посты, взаимодействие)

---

## 6.6. Local Business Schema

### Требования из ТЗ:
- **LocalBusiness schema markup** — структуровані дані для пошукових систем та AI
- **Розрахунок**: Перевіряємо чи вона впроваджена. Якщо до то чи коректно працює

### Реализовано в коде:

#### ✅ Типы данных (`types.ts`):
```217:242:nextjs-saas-starter/apps/web/lib/server/services/local/types.ts
const LocalBusinessSchemaSchema = z.object({
  is_implemented: z.boolean(),
  is_functioning_correctly: z.boolean(),
  schema_type: z.enum(['LocalBusiness', 'MedicalBusiness', 'Physician', 'Hospital']).optional(),
  has_name: z.boolean(),
  has_address: z.boolean(),
  has_phone: z.boolean(),
  has_hours: z.boolean(),
  has_price_range: z.boolean().optional(),
  has_aggregate_rating: z.boolean().optional(),
  schema_errors: z.array(z.string()).optional(),
  schema_warnings: z.array(z.string()).optional(),
  validation_status: z.enum(['valid', 'invalid', 'warning']).optional(),
});
```

#### ✅ Реализация анализа:
```570:705:nextjs-saas-starter/apps/web/lib/server/services/local/local-analyzer.ts
async function analyzeLocalBusinessSchema(
  $: CheerioAPI,
  url: string,
): Promise<LocalBusinessSchema> {
  const jsonLdScripts = $('script[type="application/ld+json"]');
  
  // Парсинг JSON-LD
  // Проверка типов схемы (LocalBusiness, MedicalBusiness, Physician, Hospital)
  // Проверка обязательных полей (name, address, phone)
  // Проверка рекомендуемых полей (hours)
  // Валидация и сбор ошибок/предупреждений
```

**Статус**: **Полностью реализовано** - парсинг JSON-LD, проверка типов, валидация полей, сбор ошибок.

#### ✅ UI компонент:
- Статус реализации
- Статус корректности работы
- Тип схемы
- Чеклист обязательных полей
- Чеклист опциональных полей
- Статус валидации
- Список ошибок
- Список предупреждений

### Вывод по 6.6:
- ✅ **Структура данных**: Полностью соответствует ТЗ
- ✅ **Реализация анализа**: Полностью реализована (парсинг и валидация работают)
- ✅ **UI отображение**: Полностью реализовано

---

## Общий вывод

### Полностью реализовано:
1. ✅ **6.6. Local Business Schema** - полностью работает
2. ✅ **Структуры данных** для всех 6 категорий - полностью соответствуют ТЗ
3. ✅ **UI компоненты** для всех 6 категорий - полностью реализованы

### Частично реализовано:
1. ⚠️ **6.5. Соцсети** - базовая функциональность работает, расширенная (парсинг профилей) не реализована

### Не реализовано (требуют API интеграции):
1. ❌ **6.1. Google Business Profile** - требует Google My Business API
2. ❌ **6.2. Реакция на отзывы** - требует API для Google, DOC.ua, Helsi
3. ❌ **6.3. Взаимодействие с GBP** - требует Google My Business Insights API
4. ❌ **6.4. Local Backlinks** - требует SEO API (Ahrefs/SEMrush)

> 📋 **Детальный анализ альтернативных решений** см. в документе [`local-indicators-alternative-solutions.md`](./local-indicators-alternative-solutions.md)
> 
> **Краткое резюме:**
> - ✅ **6.2 DOC.ua/Helsi** можно реализовать через **Firecrawl** (без платных API)
> - ✅ **6.4 Local Backlinks** можно реализовать через **Google Custom Search API** + **Firecrawl** (без Ahrefs/SEMrush)
> - ⚠️ **6.2/6.3 точные метрики** требуют OAuth (Google My Business API), но бесплатно

### Рекомендации:
1. **Приоритет 1**: Интеграция с Google My Business API (для 6.1 и 6.3)
2. **Приоритет 2**: Интеграция с API платформ отзывов (для 6.2)
3. **Приоритет 3**: Интеграция с SEO API для бэклинков (для 6.4)
4. **Приоритет 4**: Парсинг страниц соцсетей (для 6.5)

---

## Соответствие нумерации ТЗ

| № ТЗ | Категория | Статус реализации | Примечания |
|------|-----------|-------------------|------------|
| 6.1 | Google Business Profile | ⚠️ Структура + UI готовы, API нет | Требуется Google My Business API |
| 6.2 | Реакція на відгуки | ⚠️ Структура + UI готовы, API нет | Требуются API для Google, DOC.ua, Helsi |
| 6.3 | Взаємодія з GBP | ⚠️ Структура + UI готовы, API нет | Требуется Google My Business Insights API |
| 6.4 | Local Backlinks | ⚠️ Структура + UI готовы, API нет | Требуется SEO API (Ahrefs/SEMrush) |
| 6.5 | Активність у соцмережах | ⚠️ Базовая реализация работает | Требуется парсинг страниц профилей |
| 6.6 | Local Business Schema | ✅ Полностью реализовано | Работает без внешних API |

