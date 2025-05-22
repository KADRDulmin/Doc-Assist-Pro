::# Run Jest tests for the frontend with improved reliability
@echo off
echo Running tests with Jest in sequence for better reliability...
cd %~dp0..

set NODE_OPTIONS=--max_old_space_size=4096
set JEST_WORKER_ID=1

:: First run specific tests that are more stable to establish a baseline
echo Running PlaceholderScreen test first...
npx jest --config=jest.config.js --runInBand --forceExit --detectOpenHandles "__tests__/tabs/PlaceholderScreen.test.tsx"

:: Then run the rest of the tests
echo.
echo Running remaining tab tests...
npx jest --config=jest.config.js --runInBand --forceExit --detectOpenHandles --testTimeout=30000 "__tests__/tabs"

if %ERRORLEVEL% NEQ 0 (
  echo Test run completed with some failures. Check the output above for details.
  exit /b %ERRORLEVEL%
) else (
  echo All tests completed successfully!
)
