@echo off
cd /d "%~dp0" || exit /b 1
setlocal DisableDelayedExpansion
call .\path_setup.bat || (
  echo Missing build tools. Use Install Dependencies to copy the bundled tools.
  exit /b 1
)
cd /d "%~dp0capacitor_config" || exit /b 1

if not exist "node_modules\.bin\cap.cmd" goto install
if not exist "node_modules\.bin\capacitor-assets.cmd" goto install
goto prepare

:install
node "%TOOLCHAIN%\node\node_modules\npm\bin\npm-cli.js" install --no-audit --no-fund || exit /b 1

:prepare
if "%~1"=="clean" if exist android rmdir /s /q android
if "%~1"=="clean" if exist android exit /b 1
if not exist android node "%TOOLCHAIN%\node\node_modules\npm\bin\npm-cli.js" exec --no -- cap add android || exit /b 1
if exist "wrapper-variables.gradle" copy /y "wrapper-variables.gradle" "android\variables.gradle" || exit /b 1

node "%TOOLCHAIN%\node\node_modules\npm\bin\npm-cli.js" exec --no -- capacitor-assets generate || exit /b 1
node "%TOOLCHAIN%\node\node_modules\npm\bin\npm-cli.js" exec --no -- cap sync || exit /b 1
if "%~1"=="test" (
  node "%TOOLCHAIN%\node\node_modules\npm\bin\npm-cli.js" exec --no -- cap run android
  exit /b
)

cd android || exit /b 1
call gradlew.bat clean assembleDebug
exit /b
