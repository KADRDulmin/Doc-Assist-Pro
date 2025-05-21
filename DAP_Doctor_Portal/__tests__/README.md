# Doc-Assist-Pro Doctor Portal Testing Guide

This guide explains how to run and extend the unit tests for the Doctor Portal application using Expo and Jest.

## Setup

The testing environment is configured to use:
- **Jest** as the testing framework
- **@testing-library/react-native** for component testing
- **jest-expo** preset for Expo compatibility

## Running Tests

### Run tests in watch mode (development)

```bash
npm run test
```

This command will start Jest in watch mode, which will rerun tests when files change.

### Run tests once (CI/CD)

```bash
npm run test:ci
```

### Run tests with coverage report

```bash
npm run test:coverage
```

This will generate a coverage report in the `coverage` directory.

## Testing Organization

We've organized our tests into several categories:

1. **Basic utility tests**: Simple tests for JavaScript functions
   - MathUtils-test.js
   - DateUtils-test.js
   - BasicUtils-test.js

2. **React component tests**: Tests for UI components
   - SimpleComponent-test.js
   - MockComponents-test.js
   - ModernHeader-test.js

3. **React basics tests**: Fundamental React functionality
   - ReactBasics-test.js

## Test Structure

Tests are organized in the `__tests__` directory with the following structure:

```
__tests__/
  ├── components/       # Tests for reusable UI components
  ├── tabs/            # Tests for tab screens
  ├── setup.js         # Test setup file
```

## Writing Tests

### Component Tests

Example test for a component:

```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import MyComponent from '../../components/MyComponent';

describe('<MyComponent />', () => {
  test('renders correctly', () => {
    const { getByText } = render(<MyComponent />);
    expect(getByText('Expected Text')).toBeTruthy();
  });
});
```

### Screen Tests

Example test for a screen:

```tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import MyScreen from '../../app/(tabs)/my-screen';

// Mock dependencies
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('<MyScreen />', () => {
  test('navigates correctly when button is pressed', () => {
    const { getByText } = render(<MyScreen />);
    const router = require('expo-router').useRouter();
    
    fireEvent.press(getByText('Navigate'));
    expect(router.push).toHaveBeenCalledWith('/expected-path');
  });
});
```

## Mocking

Most external dependencies are mocked in `__tests__/setup.js` for consistent behavior. Additional mocks can be added in individual test files as needed.

### Common Mocks

- **expo-router**: Navigation functions
- **react-native-safe-area-context**: SafeArea values
- **expo-linear-gradient**: UI components
- **contexts**: Auth and other application contexts

## Best Practices

1. **Use testID props** for reliable component selection
2. **Mock API calls** to avoid network requests during tests
3. **Test user interactions** using fireEvent from @testing-library/react-native
4. **Group related tests** using describe blocks
5. **Test edge cases** like loading states, error states, and empty data scenarios

## Troubleshooting

If tests are failing due to dependency issues:

1. Check that all required packages are installed
2. Make sure mocks are properly configured for external dependencies
3. Verify that components are accessible via test queries (using testID props helps)
4. Use the `--verbose` flag for more detailed test output: `npm run test -- --verbose`
