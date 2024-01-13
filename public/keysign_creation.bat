
  cd "jdk-17_windows-x64_bin"
  dir
  keytool -genkey -v -keystore app-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias my-alias
  