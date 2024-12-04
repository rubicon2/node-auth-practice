import globals from 'globals';
import pluginJs from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';

/** @type {import('eslint').Linter.Config[]} */
export default [
  eslintConfigPrettier,
  { languageOptions: { globals: globals.node } },
  pluginJs.configs.recommended,
];
