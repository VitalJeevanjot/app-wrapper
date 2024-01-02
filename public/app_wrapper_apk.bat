@REM set "NODE_PATH=C:\Users\User\Downloads\node-v20.10.0-win-x64\node-v20.10.0-win-x64"
cd %~dp0
set "NODE_PATH=%~dp0\node-v20.10.0-win-x64"
@REM set "COMMAND_LINE_TOOLS_PATH=C:\Users\User\Downloads\commandlinetools-win-10406996_latest\cmdline-tools\latest\bin"
set "COMMAND_LINE_TOOLS_PATH=%~dp0\commandlinetools-win-10406996_latest\cmdline-tools\latest\bin"
@ REM rem Add the temporary paths to the existing PATH variable
set PATH=%NODE_PATH%;%COMMAND_LINE_TOOLS_PATH%;%PATH%



set "JAVA_HOME=%~dp0\jdk-17_windows-x64_bin\jdk-17.0.9"
@REM echo %JAVA_HOME%
@ REM rem Set a new environment variable with the specified path

set "ANDROID_HOME=%~dp0\commandlinetools-win-10406996_latest"
set "ANDROID_SDK_ROOT=%~dp0\commandlinetools-win-10406996_latest"
@ REM rem Set a new environment variable with the specified path


@REM sdkmanager.bat "platform-tools"
@REM  sdkmanager.bat "build-tools;34.0.0"
@REM  sdkmanager.bat "platforms;android-33"

echo "DONE ON...."

call node -v
cd capacitor_config
call npx capacitor-assets generate
@REM call npx cap sync
call npx cap run android

@REM cd android
@REM call gradlew.bat assembleDebug
echo "DONE OFF...."
cd ..


