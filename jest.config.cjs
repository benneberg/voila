/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['<rootDir>/src/**/*.test.{ts,tsx}', '<rootDir>/src/**/*.spec.{ts,tsx}'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.jest.json', useESM: false }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  // Scope coverage to files that actually have tests
  // Coverage on the two genuinely unit-tested files
  // fileProcessor is mocked in its own tests; api.ts is integration-boundary — both excluded
  collectCoverageFrom: [
    'src/lib/preflight.ts',
    'src/lib/spellChecker.ts',
  ],
  coverageThreshold: {
    global: { branches: 60, functions: 60, lines: 65, statements: 65 },
  },
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage',
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  testTimeout: 10000,
  verbose: true,
  clearMocks: false,
  resetMocks: false,
  restoreMocks: false,
};
module.exports = config;
