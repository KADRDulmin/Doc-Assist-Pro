/**
 * This file runs after Jest is loaded but before tests are run.
 * It's used to enhance the testing environment with additional configuration.
 */

// Increase the default test timeout to handle slower tests
jest.setTimeout(30000);

// Suppress specific expected warnings
const originalConsoleError = console.error;
console.error = (...args) => {
  // Filter out specific warnings that we know are safe to ignore
  const isIgnorableWarning = args.some(
    (arg) => 
      (typeof arg === 'string' && 
        (arg.includes('Warning: componentWillReceiveProps has been renamed') ||
         arg.includes('Warning: componentWillMount has been renamed') ||
         arg.includes('act(...) is not supported in production builds of React') ||
         arg.includes('ReactDOM.render is no longer supported in React 18')))
  );

  if (!isIgnorableWarning) {
    originalConsoleError(...args);
  }
};

// Make all animation/transition related operations synchronous for testing
global.requestAnimationFrame = (callback) => setTimeout(callback, 0);
