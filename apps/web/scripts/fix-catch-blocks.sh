#!/bin/bash
# Скрипт для автоматического исправления catch блоков
# Заменяет catch {} на catch (_error) где error не используется
# Оставляет catch (error) где error используется

echo "🔧 Автоматическое исправление catch блоков..."

FILES=$(find apps/web -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v ".next")

for FILE in $FILES; do
  if [ ! -f "$FILE" ]; then
    continue
  fi
  
  # Проверяем, есть ли catch {} блоки
  if grep -q "catch {" "$FILE"; then
    echo "📝 Обработка: $FILE"
    
    # Временный файл для хранения результата
    TEMP=$(mktemp)
    
    # Обрабатываем файл построчно
    while IFS= read -r line; do
      # Если строка содержит "catch {"
      if echo "$line" | grep -q "catch {"; then
        # Проверяем следующие 5 строк на использование error
        NEXT_LINES=$(tail -n +$(grep -n "catch {" "$FILE" | head -1 | cut -d: -f1) "$FILE" | head -6)
        
        if echo "$NEXT_LINES" | grep -q "error"; then
          # error используется - заменяем на catch (error)
          echo "$line" | sed 's/catch {/catch (error) {/' >> "$TEMP"
        else
          # error не используется - заменяем на catch (_error)
          echo "$line" | sed 's/catch {/catch (_error) {/' >> "$TEMP"
        fi
      else
        echo "$line" >> "$TEMP"
      fi
    done < "$FILE"
    
    # Заменяем оригинальный файл
    mv "$TEMP" "$FILE"
  fi
done

echo "✅ Исправление завершено!"


