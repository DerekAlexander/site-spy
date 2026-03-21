# Site Spy - Android Signing Configuration

## Keystore Details

**File:** `sitespy.keystore`
**Location:** `site-spy/android/sitespy.keystore`
**Created:** March 21, 2026
**Validity:** 10,000 days (until August 6, 2053)

---

## Certificate Credentials

⚠️ **SENSITIVE - Keep Secure**

```
Keystore Password: sitespy123!
Key Alias: sitespy-key
Key Password: sitespy123!
```

---

## Certificate Fingerprints

### SHA1 (for legacy systems)
```
D7:05:95:7F:DE:DF:14:40:4E:1F:61:7A:2B:3E:D6:52:FB:20:D1:8E
```

### SHA256 (Google Play primary)
```
E9:8D:DC:09:62:8F:3E:82:EA:C2:31:18:4A:E8:7D:AF:C6:06:E7:A1:0B:B7:3E:08:AD:F2:C7:81:A3:BE:46:0C
```

---

## Organization

```
CN: Site Spy
OU: Development
O: Site Spy Inc
L: Chicago
S: Illinois
C: US
```

---

## Gradle Configuration

Add to `android/app/build.gradle`:

```gradle
android {
    signingConfigs {
        release {
            storeFile file('sitespy.keystore')
            storePassword 'sitespy123!'
            keyAlias 'sitespy-key'
            keyPassword 'sitespy123!'
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

---

## Backup Instructions

1. Copy `sitespy.keystore` to encrypted external drive
2. Store password in secure password manager
3. Document certificate fingerprints in secure location
4. Keep backup copy in separate location

**Never:**
- Commit keystore to version control
- Share password via email or chat
- Store credentials unencrypted

---

## Recovery & Rotation

### If Keystore is Lost

- **Critical:** You cannot recover a lost keystore
- Must create new certificate and re-publish app with new package name
- Plan: Create backup immediately after signing first release

### Certificate Rotation (after 5 years)

1. Generate new keystore with same credentials
2. Upload new certificate to Google Play Console
3. Maintain old keystore for legacy app versions
4. Clearly document rotation date

---

## Verification

To verify keystore integrity:

```bash
keytool -list -v -keystore sitespy.keystore -storepass sitespy123! -alias sitespy-key
```

---

**Created:** 2026-03-21
**Status:** Ready for production use
