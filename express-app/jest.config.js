'use strict';

module.exports = {
  projects: [
    {
      displayName: 'backend',
      testMatch: ['<rootDir>/tests/backend/**/*.test.js'],
      testEnvironment: 'node',
    },
    {
      displayName: 'frontend',
      testMatch: ['<rootDir>/tests/frontend/**/*.test.js'],
      testEnvironment: 'jest-environment-jsdom',
    },
  ],
};
