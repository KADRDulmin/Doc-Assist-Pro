::# Run Jest tests for the frontend
@echo off
echo Running tests with Jest...
cd %~dp0
set NODE_OPTIONS=--max_old_space_size=4096
npx jest --config=jest.config.js --runInBand --forceExit
if %ERRORLEVEL% NEQ 0 (
  echo Test run failed with error code %ERRORLEVEL%
  exit /b %ERRORLEVEL%
) else (
  echo All tests completed successfully!
)
