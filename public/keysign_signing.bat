call cd "C:\Users\jeevan\Desktop\2023 pro projects\electron js\app-wrapper\public\commandlinetools-win-10406996_latest\build-tools\34.0.0"

call zipalign -v -p 4 "C:\Users\jeevan\Desktop\2023 pro projects\electron js\app-wrapper\public\capacitor_config\android\app\build\outputs\apk\debug\app-debug.apk" "C:\Users\jeevan\Downloads\test app for release with AppWrapper\my-app-unsigned-aligned.apk"

call apksigner sign --ks "C:\Users\jeevan\Desktop\2023 pro projects\electron js\app-wrapper\public\jdk-17_windows-x64_bin\jdk-17.0.9\bin\my-release-key.jks" --out "C:\Users\jeevan\Downloads\test app for release with AppWrapper\my-app-release.apk" "C:\Users\jeevan\Downloads\test app for release with AppWrapper\my-app-unsigned-aligned.apk"
 
call explorer.exe  "C:\Users\jeevan\Downloads\test app for release with AppWrapper"
 
call pause