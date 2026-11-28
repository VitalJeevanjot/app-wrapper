@echo off
set "TOOLCHAIN=%~dp0toolchain"
set "JAVA_HOME=%TOOLCHAIN%\jdk"
set "ANDROID_HOME=%TOOLCHAIN%\android-sdk"
set "ANDROID_SDK_ROOT=%ANDROID_HOME%"
set "PATH=%TOOLCHAIN%\node;%ANDROID_HOME%\cmdline-tools\latest\bin;%ANDROID_HOME%\platform-tools;%PATH%"

if not exist "%TOOLCHAIN%\node\node.exe" exit /b 1
if not exist "%JAVA_HOME%\bin\java.exe" exit /b 1
if not exist "%ANDROID_HOME%\cmdline-tools\latest\bin\sdkmanager.bat" exit /b 1
