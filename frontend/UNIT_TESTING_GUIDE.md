# Unit Testing Guide for Patient Portal App

This guide explains how to run and extend the unit tests for the Patient Portal App.

## Overview

The Patient Portal App uses Jest and React Testing Library for unit testing. Tests are primarily focused on the main tab screens of the application:

- Home Screen (`index.tsx`)
- Appointments Screen (`appointments.tsx`) 
- Profile Screen (`profile.tsx`)
- Feedback Screen (`feedback.tsx`)
- Tab Layout (`_layout.tsx`)

## Running Tests

You can run tests using the following commands:

```bash
# Install dependencies first
npm install

# Run tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests with debugging for troubleshooting
npm run test:debug

# Prepare components by adding test IDs (run this once)
npm run test:prepare
```

## Test Structure

Tests are located in the `__tests__` directory, organized by feature. For the main tabs, tests are in `__tests__/tabs/`.

Each test file corresponds to a component in the app:

- `HomeScreen.test.tsx` - Tests for the home screen
- `AppointmentsScreen.test.tsx` - Tests for the appointments screen
- `ProfileScreen.test.tsx` - Tests for the profile screen
- `FeedbackScreen.test.tsx` - Tests for the feedback screen
- `TabLayout.test.tsx` - Tests for the tab layout
- `PlaceholderScreen.test.tsx` - Tests for the placeholder screen

## Mocks

Mock implementations are provided for:

1. **Service Mocks**:
   - Patient service (`patientServiceMock.js`)
   - Appointment service (`appointmentServiceMock.js`)
   - Feedback service (`feedbackServiceMock.js`)

2. **Context Mocks**:
   - Authentication context (`contextMocks.js`)

3. **React Native Mocks**:
   - Safe area context
   - Maps
   - Various Expo modules

## Test IDs

The test preparation script (`npm run test:prepare`) adds test IDs to components to make them easier to select in tests. These include:

- `loading-indicator` - For loading spinners
- `home-scroll-view` - For the home screen scroll view
- `appointments-list` - For the appointments list
- `appointment-card` - For individual appointment cards
- `profile-loading` - For profile loading indicator
- And many more...

## Adding New Tests

When adding new tests:

1. Create a new test file in `__tests__` directory
2. Import the component to test
3. Mock dependencies using Jest
4. Write test cases with `describe` and `it` blocks
5. Use React Testing Library utilities like `render`, `fireEvent`, and `waitFor`
6. Add appropriate test IDs to components for selection

Example:

```javascript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import YourComponent from '../path-to-component';

describe('YourComponent', () => {
  it('renders correctly', () => {
    const { getByText } = render(<YourComponent />);
    expect(getByText('Expected Text')).toBeDefined();
  });
  
  it('handles button press', () => {
    const mockFunction = jest.fn();
    const { getByTestId } = render(<YourComponent onPress={mockFunction} />);
    fireEvent.press(getByTestId('your-button'));
    expect(mockFunction).toHaveBeenCalled();
  });
});
```

## Troubleshooting

### Common Issues

1. **Test fails due to missing component**:
   - Ensure the test ID is added to the component
   - Check component rendering conditions

2. **Async test times out**:
   - Use `waitFor` with appropriate timeout
   - Check if the expected element appears conditionally

3. **Mock not working**:
   - Check the mock implementation
   - Ensure mock is placed before component rendering

### Useful Commands

- `npm run test:debug` - Run tests with detailed debug information
- `npm test -- -t "test name"` - Run specific test by name
- `npm test -- path/to/test/file.test.tsx` - Run specific test file

## Best Practices

1. **Test behavior, not implementation**:
   - Focus on what the user sees and interacts with
   - Avoid testing implementation details

2. **Isolate tests**:
   - Mock external dependencies
   - Reset mocks between tests with `beforeEach`

3. **Use appropriate selectors**:
   - Prefer `getByTestId` for stable selection
   - Use `getByText` for user-facing elements

4. **Keep tests focused**:
   - Test one thing per test case
   - Use clear, descriptive test names

5. **Maintain test coverage**:
   - Aim for high coverage of critical paths
   - Update tests when components change
