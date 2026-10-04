// Lint da API: regras recomendadas do ESLint para Node (CommonJS); o Prettier
// cuida da formatação.
const js = require('@eslint/js');
const globals = require('globals');
const prettier = require('eslint-config-prettier/flat');

module.exports = [
  { ignores: ['node_modules/**', 'dados/**'] },
  js.configs.recommended,
  {
    languageOptions: { ecmaVersion: 2024, sourceType: 'commonjs', globals: { ...globals.node } },
    rules: { 'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'none', ignoreRestSiblings: true }] },
  },
  prettier,
];
