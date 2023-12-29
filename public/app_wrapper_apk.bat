set "NODE_PATH=C:\Users\User\Downloads\node-v20.10.0-win-x64\node-v20.10.0-win-x64"
set "COMMAND_LINE_TOOLS_PATH=C:\Users\User\Downloads\commandlinetools-win-10406996_latest\cmdline-tools\latest\bin"
@ REM rem Add the temporary paths to the existing PATH variable
set PATH=%NODE_PATH%;%COMMAND_LINE_TOOLS_PATH%;%PATH%



set "JAVA_HOME=C:\Users\User\Downloads\jdk-17_windows-x64_bin\jdk-17.0.9"
@ REM rem Set a new environment variable with the specified path
setx JAVA_HOME "%JAVA_HOME%"

set "ANDROID_HOME=C:\Users\User\Downloads\commandlinetools-win-10406996_latest"
@ REM rem Set a new environment variable with the specified path
setx ANDROID_HOME "%ANDROID_HOME%"

node -v

call gradlew.bat assembleDebug
@REM npx cap run android


