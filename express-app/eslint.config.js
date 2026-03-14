'use strict';

const security = require('eslint-plugin-security');

module.exports = [
  security.configs.recommended,
  {
    files: ['*.js', 'app*.js'],
    ignores: ['node_modules/**', 'coverage/**', 'tests/**'],
    plugins: { security },
    rules: {
      'security/detect-non-literal-fs-filename': 'error',
      'security/detect-non-literal-require': 'error',
      'security/detect-object-injection': 'warn',
      'security/detect-possible-timing-attacks': 'error',
      'security/detect-unsafe-regex': 'error',
    },
  },
];
