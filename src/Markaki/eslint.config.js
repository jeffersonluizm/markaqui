// Lint do app (regras do Expo) e da API (recomendadas do ESLint), com o
// Prettier cuidando só da formatação.
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettier = require('eslint-config-prettier/flat');
const globals = require('globals');

module.exports = defineConfig([
  { ignores: ['dist/*', 'backend/*', '.expo/*', 'node_modules/*'] },
  expoConfig,
  prettier,
  {
    rules: {
      'react/display-name': 'off',
    },
  },
  // Scripts de linha de comando rodam no Node.
  { files: ['scripts/**/*.js', '*.config.js'], languageOptions: { globals: globals.node } },
]);
