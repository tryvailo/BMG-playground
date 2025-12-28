import eslintConfigApps from '@kit/eslint-config/apps.js';
import eslintConfigBase from '@kit/eslint-config/base.js';

export default [
  ...eslintConfigBase,
  ...eslintConfigApps,
  {
    rules: {
      // Разрешить неиспользуемые переменные в catch блоках с префиксом _
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_', // Ключевое правило: разрешить _error в catch
        },
      ],
    },
  },
];
