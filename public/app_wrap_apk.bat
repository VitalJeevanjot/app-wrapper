@REM set "NODE_PATH=C:\Users\User\Downloads\node-v20.10.0-win-x64\node-v20.10.0-win-x64"
cd %~dp0

set "NODE_PATH=%cd%\node-v20.10.0-win-x64"
@REM set "COMMAND_LINE_TOOLS_PATH=C:\Users\User\Downloads\commandlinetools-win-10406996_latest\cmdline-tools\latest\bin"
set "COMMAND_LINE_TOOLS_PATH=%cd%\commandlinetools-win-10406996_latest\cmdline-tools\latest\bin"
@ REM rem Add the temporary paths to the existing PATH variable
set PATH=%NODE_PATH%;%COMMAND_LINE_TOOLS_PATH%;%PATH%



set "JAVA_HOME=%cd%\jdk-17_windows-x64_bin\jdk-17.0.9"
@REM echo %JAVA_HOME%
@ REM rem Set a new environment variable with the specified path

set "ANDROID_HOME=%cd%\commandlinetools-win-10406996_latest"
set "ANDROID_SDK_ROOT=%cd%\commandlinetools-win-10406996_latest"
@ REM rem Set a new environment variable with the specified path


@REM sdkmanager.bat "platform-tools"
@REM  sdkmanager.bat "build-tools;34.0.0"
@REM  sdkmanager.bat "platforms;android-33"

call node -v
call cd capacitor_config
@REM echo "Printing current path............................"
@REM call npx
call npx capacitor-assets generate
call npx cap sync
@REM call npx cap run android


call cd android
call gradlew.bat clean assembleDebug
@REM echo "DONE OFF...."
@REM cd ..
echo "DONE...."
