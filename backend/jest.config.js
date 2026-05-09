/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/src/tests/setup-env.ts'],
  testMatch: ['<rootDir>/src/tests/**/*.test.ts'],
}
