# Исправление: Перезагрузка данных при возврате на вкладку

## Проблема
При переходе на другую вкладку и возврате на Local Indicators страница остается пустой, даже если данные были сохранены в базу.

## Причина
`useEffect` с пустым массивом зависимостей выполняется только при первом монтировании компонента. При возврате на вкладку компонент может не перемонтироваться, поэтому данные не перезагружаются.

## Решение

### 1. Создана функция `loadAuditData` с `useCallback`
```typescript
const loadAuditData = React.useCallback(async () => {
  // Загрузка данных из базы
}, []);
```

### 2. Добавлены обработчики событий для перезагрузки
- `visibilitychange` - срабатывает при изменении видимости вкладки
- `focus` - срабатывает при фокусе на окне

```typescript
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      loadAuditData();
    }
  };

  const handleFocus = () => {
    loadAuditData();
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('focus', handleFocus);

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('focus', handleFocus);
  };
}, [loadAuditData]);
```

### 3. Использование `loadAuditData` после сохранения
После выполнения аудита данные перезагружаются из базы через `loadAuditData()`.

## Проверка работы

1. **Запустите аудит** - данные должны сохраниться в базу
2. **Перейдите на другую вкладку** (например, Configuration)
3. **Вернитесь на Local Indicators** - данные должны автоматически загрузиться
4. **Проверьте консоль браузера** - должны быть логи:
   - `[Local Indicators] Page became visible, reloading data`
   - `[Local Indicators] Fetching audit for normalized URL`
   - `[Local Indicators] Fetch result`

## Если проблема сохраняется

### Проверьте, что данные сохраняются в базу:
```sql
SELECT * FROM local_indicators_audits ORDER BY created_at DESC LIMIT 5;
```

### Проверьте логи сервера:
- Должны быть логи `[LocalIndicators] Attempting to save audit to database`
- Должны быть логи `[LocalIndicators] Audit result saved to database successfully`

### Проверьте консоль браузера:
- При возврате на вкладку должны быть логи перезагрузки
- Проверьте, что URL совпадает при сохранении и загрузке

## Дополнительные улучшения

1. ✅ Добавлено логирование на каждом этапе
2. ✅ Очистка state при отсутствии данных
3. ✅ Обработка ошибок при загрузке
4. ✅ Автоматическая перезагрузка при возврате на вкладку




