@echo off
cd /d "%~dp0" || exit /b 1
call .\app_wrapper_apk.bat test
exit /b
