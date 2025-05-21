# Unit Testing for Patient Portal App

This document provides an overview of the unit testing implementation for the Patient Portal App using Jest and React Testing Library.

## Testing Structure

The testing suite is organized as follows:

```
frontend/
  ├── __tests__/
  │   └── tabs/
  │       ├── HomeScreen.test.tsx
  │       ├── AppointmentsScreen.test.tsx
  │       ├── ProfileScreen.test.tsx
  │       ├── FeedbackScreen.test.tsx
  │       ├── TabLayout.test.tsx
  │       └── PlaceholderScreen.test.tsx
  ├── __mocks__/
  │   ├── fileMock.js
  │   ├── patientServiceMock.js
  │   ├── appointmentServiceMock.js
  │   └── feedbackServiceMock.js
  ├── jest.setup.js
  └── jest.config.js
```

## Test Coverage

The test suite covers the following main components:

### Home Screen (index.tsx)
- Loading state
- Displaying user information
- Showing upcoming appointments
- Empty state for no appointments
- Navigation to new appointment
- Error handling
- Pull-to-refresh functionality

### Appointments Screen (appointments.tsx)
- Loading state
- Filtering appointments by status (upcoming, past, missed)
- Navigation to appointment details
- Adding new appointments
- Empty state handling
- Pull-to-refresh functionality

### Profile Screen (profile.tsx)
- Loading user profile
- Displaying medical information
- Toggle settings (notifications, dark mode, location)
- Navigation to edit profile
- Logout functionality
- Error handling

### Feedback Screen (feedback.tsx)
- Loading feedback data
- Displaying user feedback and ratings
- Showing pending feedback requests
- Navigation to feedback form
- Empty state handling

### Tab Layout (_layout.tsx)
- Rendering all tabs
- FAB button functionality
- Opening/closing FAB menu
- Navigation from FAB menu options

## Running the Tests

The following npm scripts are available for testing:

```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests with debugging
npm run test:debug
```

## Mock Implementation

To facilitate testing, the following mocks have been implemented:

1. **Service Mocks**: Mock implementations of the patient, appointment, and feedback services

2. **Context Mocks**: Mock implementations of authentication and other contexts

3. **Native Module Mocks**: Mocks for Expo and React Native modules like Location, AsyncStorage, etc.

## Test Configuration

The Jest configuration is set up to:

- Use the jest-expo preset
- Transform React Native and Expo modules correctly
- Collect coverage from all relevant source files
- Map the @ path alias to the project root

## Adding More Tests

To add more tests:

1. Create a new test file in the `__tests__` directory
2. Import the component to test
3. Mock any required dependencies
4. Write test cases using Jest and React Testing Library APIs
5. Run tests to ensure they pass

## Testing Best Practices

- Add test IDs to components to make them easier to select
- Test component behavior, not implementation details
- Mock external dependencies to isolate component tests
- Use setup and teardown to maintain test isolation
