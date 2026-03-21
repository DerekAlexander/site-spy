# Play Store Deployment Guide - Site Spy

## Table of Contents
1. [Certificate Information](#certificate-information)
2. [APK Signing Process](#apk-signing-process)
3. [Building Release APK](#building-release-apk)
4. [Play Store Console Setup](#play-store-console-setup)
5. [Beta Testing Configuration](#beta-testing-configuration)
6. [Release Checklist](#release-checklist)

---

## Certificate Information

### Generated Signing Certificate (sitespy.keystore)

**Certificate Details:**
- **Keystore File:** `android/sitespy.keystore`
- **Keystore Password:** `sitespy123!`
- **Key Alias:** `sitespy-key`
- **Key Password:** `sitespy123!`
- **Algorithm:** RSA (2048-bit)
- **Validity Period:** 10,000 days (until August 6, 2053)
- **Organization:** Site Spy Inc
- **Location:** Chicago, Illinois, USA

### Certificate Fingerprints

**⚠️ IMPORTANT:** Save these fingerprints securely. You'll need them for Play Store configuration and Firebase integration.

#### SHA1 Fingerprint
```
D7:05:95:7F:DE:DF:14:40:4E:1F:61:7A:2B:3E:D6:52:FB:20:D1:8E
```

#### SHA256 Fingerprint (Primary for Google Play)
```
E9:8D:DC:09:62:8F:3E:82:EA:C2:31:18:4A:E8:7D:AF:C6:06:E7:A1:0B:B7:3E:08:AD:F2:C7:81:A3:BE:46:0C
```

**Certificate Chain:**
- Entry Type: PrivateKeyEntry
- Chain Length: 1
- Signature Algorithm: SHA384withRSA
- Serial Number: 6946d476d132838e

---

## APK Signing Process

### Manual Signing (if needed)

To manually sign an APK with the generated keystore:

```bash
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \
  -keystore android/sitespy.keystore \
  app-release-unsigned.apk \
  sitespy-key
```

When prompted for passwords, use:
- Keystore Password: `sitespy123!`
- Key Password: `sitespy123!`

### Verify APK Signature

```bash
jarsigner -verify -verbose -certs app-release.apk
```

---

## Building Release APK

### Prerequisites
- Node.js v18+ installed
- Java Development Kit (JDK) 11 or higher
- Android SDK (API level 31+)
- Capacitor CLI installed

### Build Steps

#### 1. Build Next.js Production Bundle
```bash
npm run build
```

This generates the optimized Next.js build in the `.next` directory.

#### 2. Sync Capacitor Android Assets
```bash
npx capacitor sync android
```

This copies the web bundle to the Android project.

#### 3. Build Release APK

**Automated (Recommended):**
```bash
npx capacitor build android --release
```

**Manual Gradle Build:**
```bash
cd android
./gradlew assembleRelease
```

The signed release APK will be located at:
```
android/app/build/outputs/apk/release/app-release.apk
```

### Build Optimization Tips

- **Minification:** Ensure ProGuard/R8 is enabled in `android/app/build.gradle`
- **Bundle Optimization:** Consider building App Bundle instead:
  ```bash
  cd android && ./gradlew bundleRelease
  ```
- **Size Reduction:** Review and remove unused dependencies from `package.json`

---

## Play Store Console Setup

### Step 1: Create Google Play Developer Account
1. Visit [Google Play Console](https://play.google.com/console)
2. Create a new developer account ($25 one-time fee)
3. Complete business information setup

### Step 2: Create New App

1. Click "Create app"
2. **App Name:** Site Spy
3. **Default Language:** English
4. **App or Game:** App (select "Utilities" category)
5. Accept Declaration of Conformance

### Step 3: Set Up App Signing

1. Go to **Release > Production > App signing**
2. Choose "Let Google Play handle signing" (Recommended)
3. Google Play will automatically sign your APK with their certificate

### Step 4: Configure Store Listing

**Essential Fields:**
- **Title:** Site Spy
- **Short Description:** (max 50 chars)
  ```
  Professional web scraping and data extraction tool
  ```
- **Full Description:** (max 4,000 chars)
  ```
  Site Spy is a powerful web scraping and data extraction application that allows you to:
  
  ✓ Extract data from websites with point-and-click interface
  ✓ Schedule recurring scraping tasks
  ✓ Export data to CSV, JSON, or Excel formats
  ✓ Advanced CSS selectors and XPath support
  ✓ Proxy and authentication support
  ✓ Real-time data preview
  
  Perfect for researchers, marketers, and data professionals who need reliable web data collection.
  ```

**Other Required Fields:**
- **Category:** Productivity > Utilities
- **Content Rating:** Completed questionnaire
- **Privacy Policy URL:** [Your privacy policy URL]
- **Screenshots:** (4-5 high-quality 1080x1920px images)
- **Feature Graphic:** 1024x500px banner
- **Icon:** 512x512px high-res app icon
- **Target Audience:** Adults only (18+) - data extraction tool

### Step 5: Configure Permissions

In `android/app/src/AndroidManifest.xml`, verify these permissions:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

### Step 6: Set Pricing and Distribution

1. Go to **Pricing & Distribution**
2. Select target countries
3. Set content rating age compliance
4. Configure pricing (Free or paid)

---

## Beta Testing Configuration

### Internal Testing Track

1. Go to **Testing > Internal testing**
2. Create new internal test release
3. Add testers (email addresses)
4. Upload APK or App Bundle
5. Testers receive invite link within minutes

### Closed Testing Track (Regional Beta)

1. Go to **Testing > Closed testing**
2. Create new closed testing release
3. Set maximum testers (50-5,000)
4. Add test groups by region or feature
5. Send invites to specific user groups

### Open Testing Track (Public Beta)

1. Go to **Testing > Open testing**
2. Create new open test release
3. Configure opt-in limit (default: unlimited)
4. Users can join via Play Store listing
5. Monitor crash reports and reviews

### Testing Workflow

**Recommended progression:**
1. **Week 1:** Internal testing (your team + close partners)
2. **Week 2-3:** Closed testing (select user groups)
3. **Week 4:** Open testing (broader public beta)
4. **Week 5:** Production release

### Monitoring Beta Feedback

- **Crashes & Errors:** Real-time crash reporting in Console
- **User Reviews:** Monitor 4-5 star reviews for feedback
- **Performance Metrics:** ANR (Application Not Responding) rates, crash rates
- **User Metrics:** Daily/Monthly active users, retention rates

---

## Release Checklist

### Pre-Release Verification

- [ ] **Code Quality**
  - [ ] All features tested on physical Android device (API 31+)
  - [ ] No console errors or warnings
  - [ ] Lint checks pass: `cd android && ./gradlew lint`
  - [ ] Performance profiling completed

- [ ] **App Configuration**
  - [ ] App version code incremented in `android/app/build.gradle`
  - [ ] Version name updated (semantic versioning: 1.0.0)
  - [ ] App name consistent: "Site Spy"
  - [ ] Package name: `com.sitespy.app`

- [ ] **Security**
  - [ ] Keystore file backed up securely
  - [ ] Certificate fingerprints documented
  - [ ] No hardcoded credentials/API keys
  - [ ] ProGuard/R8 obfuscation enabled for release

- [ ] **Permissions & Privacy**
  - [ ] All requested permissions justified
  - [ ] Privacy policy URL set
  - [ ] GDPR/CCPA compliance reviewed
  - [ ] Data collection practices documented

- [ ] **Store Listing Quality**
  - [ ] High-quality screenshots (5x, 1080x1920px)
  - [ ] Feature graphic created (1024x500px)
  - [ ] App icon optimized (512x512px)
  - [ ] Description proofread for typos
  - [ ] Keywords/tags relevant and specific

- [ ] **Testing**
  - [ ] Tested on minimum API level (31)
  - [ ] Tested on multiple device sizes
  - [ ] All permissions tested and working
  - [ ] Offline functionality verified
  - [ ] Network error handling tested

### Pre-Submission Tasks

- [ ] APK/Bundle file size checked (< 100MB recommended)
- [ ] Changelog prepared for release notes
- [ ] Screenshots and graphics uploaded to Play Store Console
- [ ] Content rating questionnaire completed
- [ ] Contact information provided
- [ ] Legal agreements accepted

### Submission Steps

1. Upload APK/Bundle to chosen track (Internal → Closed → Open → Production)
2. Review auto-generated warnings/errors
3. Set rollout percentage (start with 5-10% for gradual rollout)
4. Submit for review
5. Await approval (24-72 hours typical)
6. Monitor crash reports post-launch

### Post-Release Monitoring

- [ ] Monitor crash rates and ANR reports
- [ ] Track user reviews and feedback
- [ ] Check for negative ratings
- [ ] Monitor performance metrics
- [ ] Set up alerts for critical issues
- [ ] Prepare hotfix if needed

---

## Important Files & Locations

```
site-spy/
├── android/
│   ├── sitespy.keystore          ← Signing certificate (BACKUP SECURELY)
│   ├── app/
│   │   ├── build.gradle          ← App version & signing config
│   │   └── src/
│   │       ├── AndroidManifest.xml
│   │       └── main/
│   └── gradle.properties          ← Gradle configuration
├── package.json                   ← App metadata
└── PLAY_STORE_DEPLOYMENT_GUIDE.md ← This file
```

---

## Troubleshooting

### APK Build Failures

**Error:** `Java compiler not found`
```bash
# Set JAVA_HOME environment variable
set JAVA_HOME=C:\Program Files\Java\jdk-11
```

**Error:** `Gradle sync failed`
```bash
cd android
./gradlew clean
./gradlew sync
```

### Play Store Upload Issues

**Error:** `APK or App Bundle is not signed`
- Verify keystore file location
- Confirm certificate in `android/app/build.gradle`

**Error:** `Version code already exists`
- Increment `versionCode` in `android/app/build.gradle`

**Error:** `Invalid package name`
- Ensure package name matches submission in Play Store Console

### App Crashes Post-Release

1. Check **Analytics > Crashes & ANRs** in Play Store Console
2. Review stack traces for error sources
3. Prepare patch/hotfix
4. Build new APK with incremented version code
5. Submit to Internal testing first
6. Promote to Production after validation

---

## Security Best Practices

1. **Keystore Security**
   - Store `sitespy.keystore` in secure location
   - Back up to encrypted external storage
   - Never commit keystore to public repositories
   - Rotate certificate every 5 years max

2. **Code Security**
   - Use ProGuard/R8 obfuscation for production builds
   - Remove debug logging before release
   - Implement certificate pinning for API calls
   - Use encrypted preferences for sensitive data

3. **Distribution Security**
   - Use Play Store's app signing service
   - Enable 2FA on Google Play Console account
   - Regularly audit user permissions
   - Monitor for unauthorized code injection

---

## Next Steps

1. ✅ Generate signing certificate (COMPLETED)
2. ⏭️ Build release APK with Capacitor
3. ⏭️ Configure Play Store Console
4. ⏭️ Upload to Internal Testing track
5. ⏭️ Collect feedback and iterate
6. ⏭️ Gradual rollout to Production

---

**Last Updated:** March 21, 2026
**Version:** 1.0.0
**Status:** Ready for APK build phase
