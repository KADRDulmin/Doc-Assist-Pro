module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['./jest.setup.js', './setupAfterEnv.js'],
  testEnvironment: 'jsdom',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native(-.*)?)|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/__mocks__/fileMock.js',
  },
  collectCoverageFrom: [
    '**/*.{js,jsx,ts,tsx}',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/babel.config.js',
    '!**/jest.config.js',
    '!**/metro.config.js',
    '!**/__tests__/**',  ],
  coverageReporters: ['text', 'lcov'],
  globals: {
    "ts-jest": {
      isolatedModules: true
    }
  },
  testTimeout: 10000,
};
