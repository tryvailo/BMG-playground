# План реализации страницы Local Indicators

## Обзор
Создание новой страницы "Local Indicators" для аудита локальных индикаторов медицинской клиники. Страница должна следовать той же структуре и оформлению, что и существующие страницы (Technical Audit, Content Optimization, E-E-A-T Assessment).

## Структура реализации

### 1. Типы и схемы данных (`apps/web/lib/server/services/local/types.ts`)

#### 1.1. Google Business Profile (Completeness)
```typescript
const GoogleBusinessProfileSchema = z.object({
  completeness_percent: z.number().min(0).max(100), // % заполненных полей
  filled_fields_count: z.number().int().nonnegative(),
  total_fields_count: z.number().int().nonnegative(),
  photos_count: z.number().int().nonnegative(), // количество фото
  high_quality_photos_count: z.number().int().nonnegative(), // минимум 10-15
  has_exterior_photos: z.boolean(),
  has_interior_photos: z.boolean(),
  has_team_photos: z.boolean(),
  has_equipment_photos: z.boolean(),
  services_count: z.number().int().nonnegative(), // активные сервисы/категории
  categories_count: z.number().int().nonnegative(),
  has_description: z.boolean(),
  has_business_hours: z.boolean(),
  has_all_days_hours: z.boolean(), // часы работы для каждого дня
  attributes_count: z.number().int().nonnegative(), // минимум 15
  has_qa: z.boolean(), // наличие Q&A
  posts_count: z.number().int().nonnegative(), // количество постов
  posts_per_month: z.number().nonnegative(), // минимум 1 в месяц
  last_post_date: z.string().optional(), // дата последнего поста
});
```

#### 1.2. Review Response Rate & Quality
```typescript
const ReviewResponseSchema = z.object({
  total_reviews: z.number().int().nonnegative(),
  responded_reviews: z.number().int().nonnegative(),
  response_rate_percent: z.number().min(0).max(100), // % ответов
  responded_within_24h: z.number().int().nonnegative(), // ответы в течение 24 часов
  response_rate_24h_percent: z.number().min(0).max(100), // % ответов в течение 24 часов
  average_response_time_hours: z.number().nonnegative().optional(),
  negative_reviews_count: z.number().int().nonnegative(),
  negative_reviews_responded: z.number().int().nonnegative(),
  negative_response_rate_percent: z.number().min(0).max(100),
  platforms: z.array(z.object({
    platform: z.enum(['google', 'doc_ua', 'helsi']),
    total_reviews: z.number().int().nonnegative(),
    responded_reviews: z.number().int().nonnegative(),
    response_rate_percent: z.number().min(0).max(100),
  })),
});
```

#### 1.3. Google Business Profile Engagement
```typescript
const GBPEngagementSchema = z.object({
  impressions_per_month: z.number().int().nonnegative(), // Search + Maps
  website_clicks_per_month: z.number().int().nonnegative(),
  calls_per_month: z.number().int().nonnegative(),
  direction_requests_per_month: z.number().int().nonnegative(),
  photo_views_per_month: z.number().int().nonnegative().optional(),
  bookings_per_month: z.number().int().nonnegative().optional(),
  total_actions_per_month: z.number().int().nonnegative(), // сумма всех действий
  ctr_percent: z.number().min(0).max(100), // Click-Through Rate
  search_impressions: z.number().int().nonnegative(),
  maps_impressions: z.number().int().nonnegative(),
});
```

#### 1.4. Local Backlinks
```typescript
const LocalBacklinksSchema = z.object({
  total_local_backlinks: z.number().int().nonnegative(),
  unique_local_domains: z.number().int().nonnegative(), // уникальные локальные домены
  city: z.string().optional(), // город клиники
  backlinks_by_type: z.object({
    city_portals: z.number().int().nonnegative(),
    news_sites: z.number().int().nonnegative(),
    partners: z.number().int().nonnegative(),
    medical_associations: z.number().int().nonnegative(),
    charity_foundations: z.number().int().nonnegative(),
    local_bloggers: z.number().int().nonnegative(),
  }),
  backlinks: z.array(z.object({
    domain: z.string(),
    url: z.string(),
    anchor_text: z.string().optional(),
    is_local: z.boolean(),
    type: z.enum(['city_portal', 'news', 'partner', 'association', 'charity', 'blogger', 'other']),
  })),
});
```

#### 1.5. Local Social Media Activity
```typescript
const LocalSocialMediaSchema = z.object({
  facebook: z.object({
    has_profile: z.boolean(),
    has_correct_nap: z.boolean(), // Name, Address, Phone
    has_geotags: z.boolean(),
    has_city_mentions: z.boolean(),
    posts_about_local_events: z.number().int().nonnegative(),
    interaction_with_local_audience: z.boolean(),
    profile_url: z.string().optional(),
  }),
  instagram: z.object({
    has_profile: z.boolean(),
    has_correct_nap: z.boolean(),
    has_geotags: z.boolean(),
    has_city_mentions: z.boolean(),
    posts_about_local_events: z.number().int().nonnegative(),
    interaction_with_local_audience: z.boolean(),
    profile_url: z.string().optional(),
  }),
});
```

#### 1.6. Local Business Schema
```typescript
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

#### 1.7. Основная схема результата
```typescript
export const LocalIndicatorsAuditResultSchema = z.object({
  google_business_profile: GoogleBusinessProfileSchema,
  review_response: ReviewResponseSchema,
  gbp_engagement: GBPEngagementSchema,
  local_backlinks: LocalBacklinksSchema,
  local_social_media: LocalSocialMediaSchema,
  local_business_schema: LocalBusinessSchemaSchema,
  recommendations: z.array(z.string()),
});

export type LocalIndicatorsAuditResult = z.infer<typeof LocalIndicatorsAuditResultSchema>;
```

### 2. Сервис анализа (`apps/web/lib/server/services/local/local-analyzer.ts`)

#### 2.1. Функции анализа

**`analyzeGoogleBusinessProfile(placeId: string, apiKey: string)`**
- Использование Google Places API / My Business API
- Проверка заполненности всех полей профиля
- Подсчет фото, сервисов, категорий, атрибутов
- Проверка наличия описания, часов работы, Q&A
- Анализ постов (количество, регулярность)

**`analyzeReviewResponse(placeId: string, apiKey: string)`**
- Получение отзывов через Google My Business API
- Анализ ответов клиники на отзывы
- Расчет времени ответа
- Анализ ответов на негативные отзывы
- Интеграция с DOC.ua и Helsi API (если доступны)

**`analyzeGBPEngagement(placeId: string, apiKey: string)`**
- Использование Google My Business Insights API
- Получение метрик: impressions, clicks, calls, direction requests
- Расчет CTR
- Разделение на Search и Maps impressions

**`analyzeLocalBacklinks(domain: string, city: string)`**
- Использование SEO API (Ahrefs, SEMrush, или собственный краулер)
- Поиск обратных ссылок с локальных доменов
- Фильтрация по городу клиники
- Классификация типов ссылок

**`analyzeLocalSocialMedia(domain: string, businessName: string, city: string)`**
- Поиск профилей Facebook и Instagram по названию и городу
- Проверка наличия NAP данных
- Анализ геотегов и упоминаний города
- Подсчет постов о локальных событиях

**`analyzeLocalBusinessSchema(url: string)`**
- Парсинг HTML страницы
- Поиск JSON-LD разметки LocalBusiness
- Валидация схемы через Google Rich Results Test API
- Проверка наличия обязательных полей

#### 2.2. Главная функция
```typescript
export async function analyzeLocalIndicators(
  url: string,
  placeId?: string,
  googleApiKey?: string,
  city?: string
): Promise<LocalIndicatorsAuditResult>
```

### 3. Server Action (`apps/web/lib/actions/local-indicators-audit.ts`)

```typescript
'use server';

import { enhanceAction } from '@kit/next/actions';
import { z } from 'zod';
import { analyzeLocalIndicators } from '~/lib/server/services/local/local-analyzer';
import type { LocalIndicatorsAuditResult } from '~/lib/server/services/local/types';

const LocalIndicatorsInputSchema = z.object({
  url: z.string().url('Please provide a valid URL'),
  placeId: z.string().optional(), // Google Place ID
  googleApiKey: z.string().optional(), // Google My Business API key
  city: z.string().optional(), // Город клиники для фильтрации локальных ссылок
});

export const performLocalIndicatorsAudit = enhanceAction(
  async (input: z.infer<typeof LocalIndicatorsInputSchema>): Promise<LocalIndicatorsAuditResult> => {
    // Реализация
  },
  {
    auth: false,
    schema: LocalIndicatorsInputSchema,
  }
);
```

### 4. Компонент секции (`apps/web/components/features/playground/LocalIndicatorsSection.tsx`)

#### 4.1. Структура компонента
- Hero секция с общим score и прогресс-барами по категориям
- 6 отдельных секций (MinimalMetricCard) для каждого индикатора:
  1. Google Business Profile (Completeness)
  2. Review Response Rate & Quality
  3. Google Business Profile Engagement
  4. Local Backlinks
  5. Local Social Media Activity
  6. Local Business Schema
- Секция Recommendations

#### 4.2. Функции расчета
- `calculateOverallScore(result: LocalIndicatorsAuditResult): number`
- `calculateCategoryScores(result: LocalIndicatorsAuditResult): { gbp: number, reviews: number, engagement: number, backlinks: number, social: number, schema: number }`

#### 4.3. Компоненты для каждой секции
- **Google Business Profile**: Прогресс-бары для completeness, фото, сервисов, постов
- **Review Response**: Метрики ответов, график по платформам
- **GBP Engagement**: Метрики impressions, clicks, CTR
- **Local Backlinks**: Список ссылок с фильтрацией по типу
- **Local Social Media**: Карточки для Facebook и Instagram
- **Local Business Schema**: Статус валидации, список ошибок/предупреждений

### 5. Страница (`apps/web/app/[locale]/home/local-indicators/page.tsx`)

#### 5.1. Форма ввода
- URL (обязательное поле)
- Google Place ID (опционально)
- Google API Key (опционально)
- City (опционально, для фильтрации локальных ссылок)

#### 5.2. Структура страницы
- Card с формой
- Результаты (LocalIndicatorsSection)
- Placeholder когда результатов нет
- Минимальная высота для предотвращения layout shift

### 6. Навигация

#### 6.1. Добавление в меню
- Обновить `apps/web/config/navigation.config.tsx` для добавления пункта "Local Indicators"

## Порядок реализации

### Этап 1: Типы и схемы
1. ✅ Создать `apps/web/lib/server/services/local/types.ts`
2. ✅ Определить все Zod схемы
3. ✅ Экспортировать типы

### Этап 2: Базовый сервис
1. ✅ Создать `apps/web/lib/server/services/local/local-analyzer.ts`
2. ✅ Реализовать заглушки для всех функций анализа
3. ✅ Реализовать главную функцию `analyzeLocalIndicators`

### Этап 3: Server Action
1. ✅ Создать `apps/web/lib/actions/local-indicators-audit.ts`
2. ✅ Реализовать `performLocalIndicatorsAudit`

### Этап 4: Компонент секции
1. ✅ Создать `apps/web/components/features/playground/LocalIndicatorsSection.tsx`
2. ✅ Реализовать Hero секцию
3. ✅ Реализовать 6 секций индикаторов
4. ✅ Реализовать секцию Recommendations
5. ✅ Добавить функции расчета scores

### Этап 5: Страница
1. ✅ Создать `apps/web/app/[locale]/home/local-indicators/page.tsx`
2. ✅ Реализовать форму
3. ✅ Интегрировать LocalIndicatorsSection
4. ✅ Добавить localStorage для сохранения значений формы

### Этап 6: Навигация
1. ✅ Обновить navigation config
2. ✅ Добавить иконку для пункта меню

## Особенности реализации

### API интеграции

1. **Google My Business API**
   - Требуется OAuth 2.0 аутентификация
   - Для playground режима можно использовать Places API как альтернативу
   - Некоторые метрики (insights) требуют бизнес-аккаунт

2. **Google Places API**
   - Более доступная альтернатива для базовых данных
   - Ограничения по количеству запросов

3. **SEO APIs для backlinks**
   - Ahrefs API (платный)
   - SEMrush API (платный)
   - Альтернатива: собственный краулер или парсинг Google Search Console

4. **Social Media APIs**
   - Facebook Graph API (требует токен)
   - Instagram Basic Display API
   - Альтернатива: парсинг публичных профилей

### Обработка ошибок

- Если API ключи не предоставлены, показывать предупреждения
- Для метрик, требующих API, показывать placeholder с инструкциями
- Graceful degradation: если какой-то анализ не удался, показывать частичные результаты

### Производительность

- Параллельное выполнение независимых анализов
- Кэширование результатов API запросов (если возможно)
- Таймауты для внешних API запросов

## Тестирование

1. Тестирование с валидными данными
2. Тестирование без API ключей
3. Тестирование с невалидными URL
4. Тестирование с отсутствующими данными (например, нет GBP профиля)
5. Тестирование UI компонентов

## Документация

1. Комментарии в коде для всех функций
2. JSDoc для публичных API
3. README с инструкциями по настройке API ключей


