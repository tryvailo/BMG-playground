# Тестирование формы онбординга - Ожидаемые логи

## Обновления в коде

В `StepDomain.tsx` добавлено детальное логирование:

1. **При каждом рендере компонента:**
   ```javascript
   console.log('[StepDomain] Render:', JSON.stringify({ domain, isSearching, region, city, canSubmit: !!domain.trim() && !isSearching }));
   ```

2. **При клике на кнопку:**
   ```javascript
   console.log('[StepDomain] Button clicked, domain:', domain, 'isSearching:', isSearching, 'disabled:', !domain.trim() || isSearching);
   console.log('[StepDomain] Calling handleSubmit directly');
   ```

3. **В handleSubmit:**
   ```javascript
   console.log('[StepDomain] handleSubmit called, event:', e?.type);
   console.log('[StepDomain] trimmedDomain:', trimmedDomain);
   console.log('[StepDomain] Submitting domain:', { domain: trimmedDomain, region, city });
   ```

## Ожидаемые логи при тестировании

### 1. При загрузке страницы домена:
```
[StepDomain] Render: {"domain":"","isSearching":false,"region":"UA","city":"Київ","canSubmit":false}
```

### 2. При вводе домена:
```
[StepDomain] Render: {"domain":"friendlic.clinic","isSearching":false,"region":"UA","city":"Київ","canSubmit":true}
```

### 3. При клике на кнопку "Analyze Visibility":
```
[StepDomain] Button clicked, domain: friendlic.clinic isSearching: false disabled: false
[StepDomain] Calling handleSubmit directly
[StepDomain] handleSubmit called, event: undefined
[StepDomain] trimmedDomain: friendlic.clinic
[StepDomain] Submitting domain: { domain: "friendlic.clinic", region: "UA", city: "Київ" }
[StepDomain] Searching for clinic: friendlic.clinic
```

### 4. При успешном поиске:
```
[StepDomain] Found clinic: { clinicName: "...", competitorsCount: X }
[StepDomain] Calling onContinue with: { domain: "friendlic.clinic", clinicName: "...", competitorsCount: X }
```

### 5. При ошибке или таймауте:
```
[StepDomain] Error finding clinic or competitors: Error: ...
[StepDomain] Continuing without clinic data due to error
```

## Как проверить

1. Откройте `http://localhost:3000/ukr/onboarding`
2. Выберите регион: Ukraine
3. Выберите язык: Ukrainian
4. Выберите город: Київ
5. Введите домен: `friendlic.clinic`
6. Откройте консоль браузера (F12 → Console)
7. Нажмите "Analyze Visibility"
8. Проверьте логи в консоли

## Проблема

Если логи `[StepDomain] Button clicked` не появляются, это означает, что:
- Кнопка disabled (проверьте `canSubmit: false` в логах Render)
- onClick не срабатывает (возможно, проблема с обработчиком событий)
- Кнопка перекрыта другим элементом

## Решение

Если кнопка disabled, проверьте:
- Домен введен правильно
- `domain.trim()` не пустой
- `isSearching` равен `false`

Если onClick не срабатывает, проверьте:
- Консоль на наличие ошибок JavaScript
- Элемент кнопки в DOM (через DevTools)
- Нет ли перекрывающих элементов




