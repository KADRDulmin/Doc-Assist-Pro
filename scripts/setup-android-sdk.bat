@echo off
echo Setting up Android SDK Environment...

REM Create Android home directory if it doesn't exist
mkdir "%USERPROFILE%\Android\Sdk"

REM Set environment variables
setx ANDROID_HOME "%USERPROFILE%\Android\Sdk"
setx ANDROID_SDK_ROOT "%USERPROFILE%\Android\Sdk"
setx PATH "%PATH%;%USERPROFILE%\Android\Sdk\platform-tools"

echo Environment variables set!
echo.
echo Please download the Android SDK Command-line tools from:
echo https://developer.android.com/studio#command-tools
echo.
echo Extract the downloaded ZIP into %USERPROFILE%\Android\Sdk
echo Then run the sdkmanager to install required packages:
echo.
echo cd %USERPROFILE%\Android\Sdk\cmdline-tools\latest\bin
echo sdkmanager "platform-tools" "platforms;android-33" "build-tools;33.0.0"
echo.
echo After installation, restart your command prompt
