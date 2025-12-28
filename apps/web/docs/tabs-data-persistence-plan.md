# План реализации: Сохранение и загрузка данных для всех вкладок

## Обзор задачи

Реализовать единую логику для всех вкладок:
- **Если данных нет**: показывать кнопку для загрузки данных (как сейчас)
- **Если данные уже были загружены**: сохранять их в БД и при открытии вкладки подтягивать данные из БД, а не показывать пустую страницу

## Текущее состояние

### ✅ Уже реализовано:
1. **Local Indicators** (`/home/local-indicators`)
   - Таблица: `local_indicators_audits`
   - Actions: `performLocalIndicatorsAudit`, `getLatestLocalIndicatorsAudit`
   - Загружает данные из БД при монтировании
   - Сохраняет данные после выполнения аудита

2. **Home/Dashboard** (`/home`)
   - Таблица: `weekly_stats`
   - Action: `getDashboardMetrics`
   - Автоматически загружает данные из БД

### ❌ Требуют реализации:
1. **Technical Audit** (`/home/tech-audit`)
   - Action: `runPlaygroundTechAudit` (не сохраняет в БД)
   - Нет таблицы для playground-аудитов
   - Не загружает данные при открытии

2. **Content Optimization** (`/home/content-optimization`)
   - Action: `performContentAudit` (не сохраняет в БД)
   - Нет таблицы для сохранения результатов
   - Не загружает данные при открытии

3. **E-E-A-T Assessment** (`/home/eeat-assessment`)
   - Action: `runEEATAudit` (не сохраняет в БД)
   - Нет таблицы для сохранения результатов
   - Не загружает данные при открытии

## План реализации

### Этап 1: Создание таблиц в базе данных

#### 1.1. Таблица `playground_tech_audits`
Для сохранения результатов Technical Audit из playground.

```sql
create table if not exists public.playground_tech_audits (
  id uuid not null default extensions.uuid_generate_v4(),
  url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Audit results (stored as JSONB)
  audit_result jsonb not null,
  
  -- Optional metadata
  domain text,
  
  primary key (id)
);

create index if not exists playground_tech_audits_url_idx on public.playground_tech_audits(url);
create index if not exists playground_tech_audits_created_at_idx on public.playground_tech_audits(created_at desc);

-- Enable RLS
alter table public.playground_tech_audits enable row level security;

-- RLS Policies (similar to local_indicators_audits)
create policy playground_tech_audits_select on public.playground_tech_audits
  for select
  to authenticated, anon
  using (true);

create policy playground_tech_audits_insert on public.playground_tech_audits
  for insert
  to authenticated, anon
  with check (true);

grant select, insert on public.playground_tech_audits to authenticated, anon;
```

#### 1.2. Таблица `content_audits`
Для сохранения результатов Content Optimization.

```sql
create table if not exists public.content_audits (
  id uuid not null default extensions.uuid_generate_v4(),
  url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Audit results (stored as JSONB)
  audit_result jsonb not null,
  
  primary key (id)
);

create index if not exists content_audits_url_idx on public.content_audits(url);
create index if not exists content_audits_created_at_idx on public.content_audits(created_at desc);

-- Enable RLS
alter table public.content_audits enable row level security;

-- RLS Policies
create policy content_audits_select on public.content_audits
  for select
  to authenticated, anon
  using (true);

create policy content_audits_insert on public.content_audits
  for insert
  to authenticated, anon
  with check (true);

grant select, insert on public.content_audits to authenticated, anon;
```

#### 1.3. Таблица `eeat_audits`
Для сохранения результатов E-E-A-T Assessment.

```sql
create table if not exists public.eeat_audits (
  id uuid not null default extensions.uuid_generate_v4(),
  url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Audit results (stored as JSONB)
  audit_result jsonb not null,
  
  -- Optional metadata
  multi_page boolean default false,
  filter_type text,
  max_pages integer,
  
  primary key (id)
);

create index if not exists eeat_audits_url_idx on public.eeat_audits(url);
create index if not exists eeat_audits_created_at_idx on public.eeat_audits(created_at desc);

-- Enable RLS
alter table public.eeat_audits enable row level security;

-- RLS Policies
create policy eeat_audits_select on public.eeat_audits
  for select
  to authenticated, anon
  using (true);

create policy eeat_audits_insert on public.eeat_audits
  for insert
  to authenticated, anon
  with check (true);

grant select, insert on public.eeat_audits to authenticated, anon;
```

### Этап 2: Обновление Server Actions

#### 2.1. Обновить `performContentAudit` (`lib/actions/content-audit.ts`)
- Добавить сохранение результата в таблицу `content_audits`
- Следовать паттерну из `performLocalIndicatorsAudit`

#### 2.2. Создать `getLatestContentAudit` (`lib/actions/content-audit.ts`)
- Получать последний аудит для URL из таблицы `content_audits`
- Следовать паттерну из `getLatestLocalIndicatorsAudit`

#### 2.3. Обновить `runEEATAudit` (`lib/actions/eeat-audit.ts`)
- Добавить сохранение результата в таблицу `eeat_audits`
- Сохранять метаданные (multi_page, filter_type, max_pages)

#### 2.4. Создать `getLatestEEATAudit` (`lib/actions/eeat-audit.ts`)
- Получать последний аудит для URL из таблицы `eeat_audits`

#### 2.5. Обновить `runPlaygroundTechAudit` (`lib/actions/tech-audit-playground.ts`)
- Добавить сохранение результата в таблицу `playground_tech_audits`
- Сохранять `EphemeralAuditResult` как JSONB

#### 2.6. Создать `getLatestPlaygroundTechAudit` (`lib/actions/tech-audit-playground.ts`)
- Получать последний аудит для URL из таблицы `playground_tech_audits`

### Этап 3: Обновление страниц

#### 3.1. Обновить `app/[locale]/home/content-optimization/page.tsx`
- Добавить функцию `loadAuditData` (как в Local Indicators)
- Загружать данные из БД при монтировании
- Показывать данные, если они есть в БД
- Показывать кнопку "Run Audit", если данных нет

#### 3.2. Обновить `app/[locale]/home/eeat-assessment/page.tsx`
- Добавить функцию `loadAuditData`
- Загружать данные из БД при монтировании
- Показывать данные, если они есть в БД
- Показывать кнопку "Run Audit", если данных нет

#### 3.3. Обновить `app/[locale]/home/tech-audit/page.tsx`
- Добавить функцию `loadAuditData`
- Загружать данные из БД при монтировании
- Показывать данные, если они есть в БД
- Показывать кнопку "Run Audit", если данных нет
- Учесть, что Tech Audit может иметь несколько результатов (audit, duplicateResult, aiAnalysis)

## Детальный план реализации

### Шаг 1: Миграция базы данных
1. Создать файл миграции: `supabase/migrations/YYYYMMDD_add_playground_audit_tables.sql`
2. Включить все три таблицы в одну миграцию
3. Протестировать миграцию локально

### Шаг 2: Обновить Content Audit Actions
1. Обновить `performContentAudit` для сохранения в БД
2. Создать `getLatestContentAudit`
3. Протестировать сохранение и загрузку

### Шаг 3: Обновить E-E-A-T Audit Actions
1. Обновить `runEEATAudit` для сохранения в БД
2. Создать `getLatestEEATAudit`
3. Протестировать сохранение и загрузку

### Шаг 4: Обновить Tech Audit Playground Actions
1. Обновить `runPlaygroundTechAudit` для сохранения в БД
2. Создать `getLatestPlaygroundTechAudit`
3. Протестировать сохранение и загрузку

### Шаг 5: Обновить страницы
1. Обновить Content Optimization page
2. Обновить E-E-A-T Assessment page
3. Обновить Technical Audit page

### Шаг 6: Тестирование
1. Протестировать каждую вкладку:
   - Запустить аудит
   - Закрыть вкладку
   - Открыть вкладку снова - данные должны загрузиться
2. Проверить, что данные сохраняются корректно
3. Проверить обработку ошибок

## Паттерн реализации (на основе Local Indicators)

### Server Action Pattern:
```typescript
// Сохранение
export const performAudit = enhanceAction(
  async (input: AuditInput): Promise<AuditResult> => {
    // ... выполнение аудита ...
    const result = await analyze(...);
    
    // Сохранение в БД
    try {
      const supabase = getSupabaseServerAdminClient();
      const normalizedUrl = normalizeUrl(input.url);
      
      await (supabase as any)
        .from('audit_table')
        .insert({
          url: normalizedUrl,
          audit_result: result,
          // ... другие поля ...
        });
    } catch (error) {
      console.error('Failed to save audit:', error);
      // Не бросаем ошибку - сохранение опционально
    }
    
    return result;
  }
);

// Загрузка
export const getLatestAudit = enhanceAction(
  async (params: { url: string }): Promise<{ result: AuditResult; createdAt: string } | null> => {
    const supabase = getSupabaseServerAdminClient();
    const normalizedUrl = normalizeUrl(params.url);
    
    const { data, error } = await (supabase as any)
      .from('audit_table')
      .select('audit_result, created_at')
      .eq('url', normalizedUrl)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error || !data) return null;
    
    return {
      result: data.audit_result,
      createdAt: data.created_at,
    };
  }
);
```

### Page Component Pattern:
```typescript
const [result, setResult] = useState<AuditResult | null>(null);
const [auditDate, setAuditDate] = useState<string | null>(null);
const [isLoading, setIsLoading] = useState(true);

const loadAuditData = React.useCallback(async () => {
  const domain = getStoredValue(STORAGE_KEYS.DOMAIN);
  if (!domain) {
    setIsLoading(false);
    return;
  }
  
  const normalizedUrl = normalizeUrl(domain);
  
  try {
    const latestAudit = await getLatestAudit({ url: normalizedUrl });
    if (latestAudit?.result) {
      setResult(latestAudit.result);
      setAuditDate(latestAudit.createdAt);
    }
  } catch (error) {
    console.error('Error loading audit:', error);
  } finally {
    setIsLoading(false);
  }
}, []);

useEffect(() => {
  loadAuditData();
}, [loadAuditData]);

const handleRunAudit = async () => {
  // ... выполнение аудита ...
  const auditResult = await performAudit({ url: normalizedUrl });
  setResult(auditResult);
  setAuditDate(new Date().toISOString());
  
  // Обновить данные из БД
  setTimeout(() => {
    loadAuditData();
  }, 1000);
};
```

## Приоритеты реализации

1. **Высокий приоритет**: Content Optimization (проще всего)
2. **Высокий приоритет**: E-E-A-T Assessment (похож на Content)
3. **Средний приоритет**: Technical Audit (сложнее из-за нескольких результатов)

## Заметки

- Все таблицы используют JSONB для хранения результатов (гибкость)
- Все таблицы имеют индексы по `url` и `created_at` для быстрого поиска
- RLS политики разрешают доступ всем (playground режим)
- Нормализация URL важна для корректного поиска
- Сохранение в БД не должно блокировать возврат результата (try-catch)


