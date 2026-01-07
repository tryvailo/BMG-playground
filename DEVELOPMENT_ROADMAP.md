# 🗺️ ДОРОЖНАЯ КАРТА РАЗРАБОТКИ (Development Roadmap)

**Период:** 5 недель (20 часов/неделю)  
**Дата начала:** Планируется  
**MVP Release:** Неделя 5 (конец)  

---

## 📅 НЕДЕЛЯ 1: Dashboard API & Metrics Foundation

### День 1-2: API `/api/dashboard`

**Задача:**
- Заменить mock данные на реальные из БД
- Получать услуги, конкурентов, историю из Supabase

**Файлы для создания:**
```
✅ libs/modules/dashboard/metrics-calculator.ts
✅ libs/modules/dashboard/clinic-service.ts (helper)
```

**Файлы для изменения:**
```
✅ app/api/dashboard/route.ts (переписать)
```

**Контрольная точка:**
```bash
curl http://localhost:3000/api/dashboard?projectId=xxx
# Должен вернуть реальные данные вместо mock
```

---

### День 3-4: Формула ClinicAI Score

**Задача:**
- Реализовать формулу: `0.25×Visibility + 0.2×Tech + 0.2×Content + 0.15×E-E-A-T + 0.1×Local`

**Файл:**
```
✅ libs/modules/dashboard/metrics-calculator.ts
  → функция calculateClinicAIScore()
```

**Unit Tests:**
```typescript
describe('calculateClinicAIScore', () => {
  it('должен корректно считать формулу', () => {
    const result = calculateClinicAIScore({
      visibility: 75,
      techOptimization: 80,
      contentOptimization: 70,
      eeatSignals: 85,
      localSignals: 60,
      performanceScore: 90
    });
    expect(result).toBeCloseTo(75.25, 1);
  });
});
```

**Контрольная точка:**
```
✅ Формула работает, тесты зеленые
```

---

### День 5: Интеграция в DashboardView

**Задача:**
- Подключить DashboardView к реальному API
- Заменить mock generateMockDashboardData() на fetch

**Файл изменить:**
```
✅ components/dashboard/DashboardView.tsx
  → убрать MOCK_DASHBOARD_DATA
  → добавить useEffect(() => fetchDashboard())
```

**Котрольная точка:**
```
✅ Дашборд показывает реальные данные из API
✅ Графики обновляются при загрузке
```

---

## 📅 НЕДЕЛЯ 2: Services CRUD & AIV Score

### День 1-2: API `/api/services` (CRUD)

**Задачи:**
- Создать GET (список услуг)
- Создать POST (добавить услугу)
- Создать PUT (обновить)
- Создать DELETE (удалить)

**Файлы для создания:**
```
✅ libs/modules/services/service-repository.ts
  → getServicesByProjectId()
  → createService()
  → updateService()
  → deleteService()

✅ app/api/services/route.ts
  → GET, POST handlers

✅ app/api/services/[id]/route.ts
  → PUT, DELETE handlers
```

**API Examples:**

```bash
# GET список услуг
GET /api/services?projectId=xxx

# POST новая услуга
POST /api/services
{
  "projectId": "xxx",
  "serviceName": "Кардиология",
  "targetPage": "https://clinic.ua/cardiology",
  "country": "UA",
  "city": "Київ"
}

# PUT обновление
PUT /api/services/service-id
{ "serviceName": "Кардиология (обновлено)" }

# DELETE удаление
DELETE /api/services/service-id
```

**Контрольная точка:**
```bash
✅ CRUD операции работают
✅ Данные сохраняются в БД
✅ Валидация работает
```

---

### День 3: Формула AIV Score

**Задача:**
- Реализовать: `AIV Score = V×(V×100×0.30)+(P×0.25)+(C×0.20)`

**Файл:**
```
✅ libs/modules/services/aiv-calculator.ts
```

**Unit Test:**
```typescript
describe('calculateAIVScore', () => {
  it('видимая на позиции 1 → максимум', () => {
    const score = calculateAIVScore({
      isVisible: true,
      position: 1,
      totalResults: 5,
      competitorsScore: 70
    });
    expect(score).toBeGreaterThan(70);
  });
});
```

**Контрольная точка:**
```
✅ AIV Score рассчитывается правильно
✅ Интегрирован в API /api/services
```

---

### День 4-5: Weekly Stats Сохранение

**Задача:**
- Каждый день сохранять метрики в weekly_stats
- Реализовать cron job

**Файлы для создания:**
```
✅ libs/modules/dashboard/weekly-stats-service.ts
  → saveWeeklyStats(projectId)

✅ app/api/cron/save-stats/route.ts
  → Cron handler (POST)
```

**Миграция БД:**

```sql
CREATE TABLE weekly_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  date DATE NOT NULL,
  clinic_ai_score DECIMAL(5,2),
  visibility DECIMAL(5,2),
  tech_score DECIMAL(5,2),
  content_score DECIMAL(5,2),
  eeat_score DECIMAL(5,2),
  local_score DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT now()
);
```

**Контрольная точка:**
```
✅ vercel.json имеет cron schedule
✅ Каждый день сохраняется запись
✅ История доступна в DashboardView
```

---

## 📅 НЕДЕЛЯ 3: PageSpeed & Tech Audit

### День 1-2: Google PageSpeed API

**Задача:**
- Подключить PageSpeed API
- Сохранять Desktop + Mobile scores

**Файл для создания:**
```
✅ libs/modules/audit/pagespeed-integration.ts
  → getPageSpeedScore(url): Promise<PageSpeedResult>
```

**Использование:**

```typescript
import { getPageSpeedScore } from '~/lib/modules/audit/pagespeed-integration';

const result = await getPageSpeedScore('https://example.com');
// {
//   desktopScore: 87,
//   mobileScore: 75,
//   metrics: { lcp: 1234, fcp: 456, cls: 0.1, ... }
// }
```

**Требуется:**
- `GOOGLE_PAGESPEED_API_KEY` в .env

**Контрольная точка:**
```
✅ PageSpeed API работает
✅ Scores сохраняются в tech_audits
✅ Отображаются в TechAuditOverview
```

---

### День 3: Персонализация Dashboard

**Задача:**
- Получать clinic по текущему пользователю
- Показывать clinicName на дашборде

**Файлы:**
```
✅ libs/modules/dashboard/clinic-service.ts
  → getClinicByUserId(userId)

✅ app/[locale]/dashboard/page.tsx
  → const clinic = await getClinicByUserId(user.id)
  → <DashboardView clinicName={clinic.name} />
```

**Контрольная точка:**
```
✅ Дашборд показывает имя текущей клиники
✅ Метрики соответствуют проекту пользователя
```

---

### День 4-5: 3 Schema типа

**Задача:**
- Добавить в UI: MedicalSpecialty, Review, BreadcrumbList

**Файлы для изменения:**
```
✅ lib/modules/audit/utils/tech-audit-analyzer.ts
  → добавить проверки 3 типов

✅ components/dashboard/audit/TechAuditOverview.tsx
  → добавить 3 CheckCircle компонента (UI)
```

**Контрольная точка:**
```
✅ UI показывает все 8 schema типов (было 5)
✅ Проверки работают в backend
```

---

## 📅 НЕДЕЛЯ 4: Services Details & Meta Tags

### День 1: Titles/Descriptions в UI

**Задача:**
- Раскрыть анализ мета-тегов в TechAuditOverview
- Показать список страниц с их titles и descriptions

**Файл изменить:**
```
✅ components/dashboard/audit/TechAuditOverview.tsx
  → новая Card "Meta Tags & SEO"
  → список titles с length check
  → список descriptions с length check
```

**Контрольная точка:**
```
✅ UI показывает titles/descriptions
✅ Color badges показывают оптимальность
```

---

### День 2: Canonicals Check

**Задача:**
- Проверить наличие canonical URL
- Показать в UI

**Файлы:**
```
✅ libs/modules/audit/utils/html-parser.ts
  → функция для парсинга canonical

✅ components/dashboard/audit/TechAuditOverview.tsx
  → добавить CheckCircle для Canonical
```

**Контрольная точка:**
```
✅ Canonicals проверка работает
✅ Отображается в Security & Access Card
```

---

### День 3-4: ServiceTable Сортировка/Фильтрация

**Задача:**
- Добавить фильтр по услуге (поиск)
- Добавить фильтр по видимости
- Сортировка по столбцам

**Файл изменить:**
```
✅ components/dashboard/services/ServiceTable.tsx
  → Input для поиска
  → Select для видимости
  → Clickable TableHeader для сортировки
  → useMemo для фильтрации/сортировки
```

**Контрольная точка:**
```
✅ Поиск работает
✅ Фильтр работает
✅ Сортировка работает
```

---

### День 5: ServiceDetails Компонент

**Задача:**
- Новый компонент с деталями услуги
- График истории AIV Score
- Рекомендации

**Файлы для создания:**
```
✅ components/dashboard/services/ServiceDetails.tsx

✅ app/api/services/[id]/details/route.ts
  → GET детали услуги
```

**Контрольная точка:**
```
✅ Dialog открывается с деталями услуги
✅ История AIV Score отображается
```

---

## 📅 НЕДЕЛЯ 5: AI & Polish

### День 1-2: AI Рекомендации

**Задача:**
- Интегрировать OpenAI API
- Генерировать рекомендации по улучшению услуги

**Файл для создания:**
```
✅ libs/modules/ai/recommendation-generator.ts
  → generateServiceRecommendations(serviceData)
```

**Требуется:**
- `OPENAI_API_KEY` в .env

**Контрольная точка:**
```
✅ PROMPT отправляется в OpenAI
✅ Рекомендации выводятся в UI
```

---

### День 2-3: Export PDF/Excel

**Задача:**
- Экспорт дашборда в PDF
- Экспорт услуг в Excel

**Файлы для создания:**
```
✅ libs/modules/export/dashboard-exporter.ts
  → exportDashboardPDF()
  → exportServicesExcel()
```

**Требуется:**
- npm install jspdf @types/jspdf
- npm install xlsx @types/xlsx

**Контрольная точка:**
```
✅ PDF скачивается
✅ Excel скачивается
✅ Данные корректны
```

---

### День 4-5: Сравнение Периодов

**Задача:**
- Выбрать 2 периода
- Сравнить метрики
- Показать разницы

**Файлы для создания:**
```
✅ components/dashboard/PeriodComparison.tsx

✅ app/api/dashboard/compare/route.ts
  → POST с периодами
  → вычисление разниц
```

**Контрольная точка:**
```
✅ Компонент открывается
✅ Сравнение вычисляется
✅ Результаты показываются
```

---

## 🎯 ИТОГОВЫЕ КОНТРОЛЬНЫЕ ТОЧКИ

### После Недели 1: ✅
- [x] DashboardView показывает реальные данные
- [x] Формула ClinicAI Score работает
- [x] Нет more mock данных в dashboard

### После Недели 2: ✅
- [x] API /api/services полностью работает
- [x] ServiceTable использует реальный API
- [x] Weekly stats сохраняются

### После Недели 3: ✅
- [x] PageSpeed scores интегрированы
- [x] Dashboard персонализирован по пользователю
- [x] 8 schema типов проверяются

### После Недели 4: ✅
- [x] Meta tags анализ в UI
- [x] ServiceDetails показывает историю
- [x] Фильтрация/сортировка работает

### После Недели 5: ✅
- [x] AI рекомендации генерируются
- [x] Export в PDF/Excel работает
- [x] Сравнение периодов доступно
- [x] **MVP READY ✅**

---

## 📊 СТАТУС ОТСЛЕЖИВАНИЯ

```
Неделя 1: ▓▓▓▓▓▓▓▓▓▓ 100%  ✅ COMPLETE
Неделя 2: ▓▓▓▓▓▓▓▓▓▓ 100%  ✅ COMPLETE
Неделя 3: ▓▓▓▓▓▓▓▓▓▓ 100%  ✅ COMPLETE
Неделя 4: ▓▓▓▓▓▓▓▓▓▓ 100%  ✅ COMPLETE
Неделя 5: ▓▓▓▓▓▓▓▓▓▓ 100%  ✅ COMPLETE
────────────────────────────
Общий:    ▓▓▓▓▓▓▓▓▓▓ 100%  🎉 MVP ГОТОВ!
```

---

## 🚀 БЫСТРЫЙ СТАРТ

### 1. Клонировать репозиторий
```bash
git clone https://github.com/...
cd nextjs-saas-starter
pnpm install
```

### 2. Настроить окружение
```bash
cp .env.example .env.local
# Добавить ключи API:
# - GOOGLE_PAGESPEED_API_KEY
# - OPENAI_API_KEY
# - NEXT_PUBLIC_SUPABASE_*
# - SUPABASE_SERVICE_ROLE_KEY
```

### 3. Создать ветку
```bash
git checkout -b feat/functionality-mvp
```

### 4. Начать разработку (Неделя 1)
```bash
# День 1-2: API Dashboard
touch libs/modules/dashboard/metrics-calculator.ts
# ... реализовать содержимое

# День 3-4: Формула ClinicAI Score
# ... добавить функцию в metrics-calculator.ts

# День 5: Интеграция в DashboardView
# ... изменить components/dashboard/DashboardView.tsx
```

### 5. Тестировать
```bash
pnpm dev
# Открыть http://localhost:3000/dashboard
# Проверить, что отображаются реальные данные
```

### 6. Коммитить и пушить
```bash
git add .
git commit -m "feat(dashboard): add real API data"
git push origin feat/functionality-mvp
```

---

## 📞 КОНТАКТЫ В ПРОЦЕССЕ РАЗРАБОТКИ

- **Вопросы по ТЗ?** → Смотри `Functionality.md`
- **Вопросы по текущему статусу?** → Смотри `COMPREHENSIVE_FUNCTIONALITY_AUDIT.md`
- **Вопросы по Tech Audit?** → Смотри `TECH_AUDIT_DETAILED_REVIEW.md`
- **Вопросы по онбордингу?** → Смотри `apps/web/docs/onboarding-documentation.md`

---

**Дорожная карта готова! 🎉**

Начинайте с Недели 1, День 1 и следуйте плану. Удачи!
