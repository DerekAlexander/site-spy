# Site Spy - Release APK Build Guide

## Overview

This guide covers building a signed, optimized APK for Google Play Store deployment.

**Current Build Status:** Next.js web bundle created successfully ✓

---

## Prerequisites

Before building the release APK, ensure you have:

### 1. Java Development Kit (JDK)
- **Version:** JDK 11 or higher
- **Windows Installation:**
  ```bash
  # Using Chocolatey
  choco install openjdk11
  # OR download from https://jdk.java.net/
  ```
- **Verify installation:**
  ```bash
  java -version
  javac -version
  ```

### 2. Android SDK
- **Install Android Studio** from https://developer.android.com/studio
- **Or install Command-line tools only:**
  - Download from https://developer.android.com/studio#command-tools
  - Extract to a permanent location (e.g., `C:\Android\Sdk`)

### 3. Environment Variables
Set the following environment variables:

**Windows (PowerShell as Admin):**
```powershell
# Set JAVA_HOME
$env:JAVA_HOME = "C:\Program Files\Java\jdk-11.0.x"

# Set ANDROID_HOME
$env:ANDROID_HOME = "C:\Android\Sdk"

# Add to PATH
$env:Path += ";$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\tools"

# Persist variables (permanent):
[Environment]::SetEnvironmentVariable('JAVA_HOME', 'C:\Program Files\Java\jdk-11.0.x', 'User')
[Environment]::SetEnvironmentVariable('ANDROID_HOME', 'C:\Android\Sdk', 'User')
```

### 4. Required SDK Components
Once Android SDK is installed, install required components:

```bash
sdkmanager --list_installed

# Install required APIs and build tools
sdkmanager "platform-tools"
sdkmanager "build-tools;34.0.0"
sdkmanager "platforms;android-34"
sdkmanager "platforms;android-31"  # Minimum for Site Spy
```

---

## Build Process

### Step 1: Verify Configuration

Create `local.properties` in the `android/` directory:

```properties
# android/local.properties
sdk.dir=C:\Android\Sdk
ndk.dir=C:\Android\Sdk\ndk\25.2.9519653
```

**Note:** NDK is optional but recommended for native code optimization.

### Step 2: Build Next.js Production Bundle

```bash
cd site-spy
npm run build
```

**Output:** Web assets are exported to `out/` directory
- Includes optimized JavaScript, CSS, and HTML
- Size should be ~2-5MB (uncompressed)

### Step 3: Sync Web Assets to Android

```bash
npx capacitor sync android
```

**What this does:**
- Copies `out/` contents to `android/app/src/main/assets/public/`
- Updates Capacitor configuration
- Prepares Android project for build

### Step 4: Build Signed Release APK

#### Option A: Using Capacitor CLI (Recommended)

```bash
npx capacitor build android --release
```

This automatically:
- Compiles Android code
- Bundles assets
- Signs with certificate from `gradle.properties`
- Outputs signed APK

#### Option B: Using Gradle Directly

```bash
cd android
./gradlew assembleRelease
```

Signing configuration is read from `android/app/build.gradle`

#### Option C: Build App Bundle (for Google Play auto-optimization)

```bash
cd android
./gradlew bundleRelease
```

**Output:** `.aab` file (App Bundle) instead of `.apk`
- **Advantage:** Google Play optimizes for device-specific APKs
- **Disadvantage:** Cannot test locally without Play Store

### Step 5: Locate Release APK

After successful build, the signed APK is located at:

```
android/app/build/outputs/apk/release/app-release.apk
```

**File size:** Typically 15-30MB (with minification)

---

## Build Optimization Tips

### 1. Minification & Obfuscation

Enabled in `android/app/build.gradle`:
```gradle
release {
    minifyEnabled true
    shrinkResources true
    proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
}
```

**Effect:**
- Removes unused code
- Obfuscates class/method names (security)
- Reduces APK size by 30-40%

### 2. ProGuard Rules

Create `android/app/proguard-rules.pro` to preserve essential classes:

```proguard
# Preserve Capacitor classes
-keep class com.getcapacitor.** { *; }

# Preserve specific app classes if needed
-keep class com.sitespy.** { *; }

# Preserve Activity classes
-keep class * extends android.app.Activity { *; }

# Remove logging in release builds
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
}
```

### 3. Web Bundle Optimization

Minimize the Next.js output before APK build:

```bash
# Remove unnecessary files from out/
rm -r out/.next/cache
rm -r out/.next/static/development

# Check bundle size
du -sh out/
```

### 4. Split APK by Architecture

Create separate APKs for ARM64, ARM32:

```gradle
// android/app/build.gradle
android {
    bundle {
        language.enableSplit = true
        density.enableSplit = true
        abi.enableSplit = true
    }
}
```

**Benefit:** Users download only architecture-specific APK (~10-15MB vs 30MB)

---

## Build Troubleshooting

### Error: "JAVA_HOME not found"

```bash
# Find Java installation
Get-ChildItem "C:\Program Files" -Filter "jdk*"

# Set JAVA_HOME
[Environment]::SetEnvironmentVariable('JAVA_HOME', 'C:\Program Files\Java\jdk-11.0.x', 'User')
```

### Error: "SDK location not found"

Create `android/local.properties`:
```properties
sdk.dir=C:\Android\Sdk
```

### Error: "Gradle sync failed"

```bash
cd android
./gradlew clean
./gradlew --refresh-dependencies
```

### Error: "Build tools not found"

```bash
# List installed build tools
sdkmanager --list_installed | grep build-tools

# Install missing version (e.g., 34.0.0)
sdkmanager "build-tools;34.0.0"
```

### Error: "Capacitor plugin conflict"

```bash
# Reinstall capacitor
rm -r android/app/src/main/java/com/getcapacitor
npx capacitor sync android
```

### Build Succeeds but APK Won't Install

Common causes:
1. **Mismatched API levels** - Check `build.gradle` targetSdkVersion
2. **Signature mismatch** - Certificate must match package name registration
3. **Device incompatibility** - Test on API 31+ device

---

## Testing Release APK

### 1. Install on Device/Emulator

```bash
# Connect Android device via USB (enable developer mode)
adb install android/app/build/outputs/apk/release/app-release.apk

# Or install on running emulator
adb -e install android/app/build/outputs/apk/release/app-release.apk
```

### 2. Verify App Functionality

- [ ] App launches without crashes
- [ ] All features work as expected
- [ ] Permissions are requested and granted
- [ ] No console errors in Logcat

```bash
# View live logs
adb logcat | grep "sitespy\|java.lang.Exception"
```

### 3. Check APK Signature

```bash
jarsigner -verify -verbose -certs android/app/build/outputs/apk/release/app-release.apk
```

Expected output includes:
```
Alias name: sitespy-key
Owner: CN=Site Spy, OU=Development, O=Site Spy Inc, L=Chicago, ST=Illinois, C=US
```

### 4. Inspect APK Contents

```bash
# Extract and inspect
unzip android/app/build/outputs/apk/release/app-release.apk -d apk_contents/

# Check AndroidManifest.xml
cat apk_contents/AndroidManifest.xml
```

---

## GitHub Actions CI/CD (Optional)

Automate APK builds with GitHub Actions:

```yaml
# .github/workflows/build-apk.yml
name: Build Release APK

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Java
        uses: actions/setup-java@v3
        with:
          java-version: '11'
          distribution: 'temurin'
      
      - name: Setup Android SDK
        uses: android-actions/setup-android@v2
      
      - name: Build APK
        run: |
          npm install
          npm run build
          npx capacitor sync android
          cd android && ./gradlew assembleRelease
      
      - name: Upload APK
        uses: actions/upload-artifact@v3
        with:
          name: app-release.apk
          path: android/app/build/outputs/apk/release/app-release.apk
```

---

## Version Management

### Update Version Code/Name

Each Play Store release requires an incremented version code:

**android/app/build.gradle:**
```gradle
defaultConfig {
    versionCode 1      // Increment for each release
    versionName "1.0"  // Semantic versioning
}
```

**Versioning Strategy:**
- `versionCode`: Sequential integer (1, 2, 3, ...)
- `versionName`: Semantic (1.0.0, 1.0.1, 1.1.0, 2.0.0)

### Beta Releases

For beta builds with same versionCode:
```gradle
buildTypes {
    beta {
        signingConfig signingConfigs.release
        applicationIdSuffix ".beta"
        versionNameSuffix "-beta.1"
    }
}
```

Build beta APK:
```bash
cd android && ./gradlew assembleBeta
```

---

## Security Considerations

1. **Never commit keystore or credentials to Git:**
   - Add `*.keystore` to `.gitignore`
   - Store passwords in secure password manager
   - Back up keystore to encrypted external drive

2. **Signing Certificate Validity:**
   - Site Spy certificate valid until August 6, 2053
   - Plan rotation after 5 years for best practices

3. **ProGuard Obfuscation:**
   - Enabled by default in release builds
   - Prevents reverse engineering of code logic

4. **Code Signing:**
   - All APKs must be signed with same certificate
   - Play Store enforces signature matching for app updates

---

## Next Steps

1. ✅ Web bundle created
2. ✅ Capacitor sync completed
3. ⏳ **Build release APK** (awaiting Android SDK installation)
4. ⏭️ Test on device
5. ⏭️ Upload to Play Store internal testing track

---

## Quick Reference

```bash
# Complete build workflow
npm run build                           # Next.js build
npx capacitor sync android              # Sync assets
cd android && ./gradlew assembleRelease # Build APK

# Output
android/app/build/outputs/apk/release/app-release.apk
```

---

**Last Updated:** March 21, 2026
**Status:** Prerequisites pending (Android SDK installation required)
**Version:** 1.0.0
