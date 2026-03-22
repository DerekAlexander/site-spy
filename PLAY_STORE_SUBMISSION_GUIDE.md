# Site Spy - Play Store Submission Guide

## Status
✅ **Next.js production build ready** (`npm run build` completed successfully)

## Overview
Site Spy is a Progressive Web App (PWA) built with Next.js. For Play Store distribution, we'll use **Google Play Console's web app packaging** to wrap the web bundle into a native Android app wrapper.

## Files Ready
- Production bundle: `C:\Users\Is me\.openclaw\workspace\site-spy\.next/`
- Signing certificate: `C:\Users\Is me\.openclaw\workspace\site-spy\android\sitespy.keystore` (RSA 2048-bit, valid until 2053)

## Step 1: Set Up Google Play Console Account

1. Go to https://play.google.com/console
2. Sign in with Google Account (use Derek's account or create developer account)
3. Click **Create app**
4. Fill in:
   - App name: `Site Spy`
   - Default language: English
   - Category: **Lifestyle** or **Utilities**
   - App type: **Free**

## Step 2: Create App Listing

### Basic Info
- **Title:** Site Spy
- **Short description:** Track competitor websites and get instant alerts when they change
- **Full description:**
  ```
  Site Spy automatically monitors your competitor websites and alerts you instantly when content changes.
  
  Perfect for:
  • Contractors tracking competitor pricing & services
  • Business owners monitoring market competition
  • Agencies tracking client websites
  
  Features:
  ✓ Real-time website monitoring
  ✓ Instant notifications on changes
  ✓ Side-by-side change viewer
  ✓ Screenshots for visual comparison
  ✓ Customizable check intervals
  
  No credit card required. Start monitoring today!
  ```

### Screenshots (required)
- 2-8 screenshots showing:
  1. Dashboard with competitor list
  2. Change detection demo
  3. Alert settings screen
  4. Side-by-side diff viewer

**Placeholder text:**
```
File format: PNG or JPEG
Size: 1080×1920 pixels (phone) or 1440×2560 pixels (tablet)
You can add up to 8 screenshots
```

### App Icon
- Size: 512×512 pixels (PNG)
- Required for all versions

### Feature Graphic
- Size: 1024×500 pixels (PNG or JPEG)
- This is displayed on store listing

## Step 3: Add Build Using Google Play Billing

Since this is a PWA without native Android code:

1. In Play Console, go to **Release → Production**
2. Upload the **web bundle** (from `.next/` folder)
3. Set version code: `1`
4. Set version name: `1.0.0`

**Or use Trusted Web Activity (TWA):**
Play Console now supports packaging web apps directly. Use:
- URL: `https://site-spy.vercel.app` (or your deployment URL)
- Google Play will auto-wrap it as a native app

## Step 4: Prepare Store Listing Details

### Content Rating
1. Go to **Setup → App content → Content rating questionnaire**
2. Fill out Google Play's standard form (usually takes 2 minutes)
3. Submit for rating review

### Privacy Policy
1. Create/link privacy policy (required):
   ```
   https://site-spy.vercel.app/privacy
   ```
   
2. **Minimal privacy policy example:**
   ```markdown
   # Privacy Policy
   
   Site Spy does not collect personal data.
   
   - Screenshots are stored locally on your device
   - Website URLs are not sent to any external service
   - No ads, tracking, or third-party analytics
   
   Contact: [your email]
   ```

### Target Audience
- Go to **Setup → Target audience**
- Select: **Intended for all audiences** or **Families**

## Step 5: Add Pricing & Distribution

1. **Pricing:** Free
2. **Countries:** Select all or target markets
3. **Device categories:** Phone + Tablet

## Step 6: Submit for Review

1. Review all sections (✓ all green)
2. Go to **Release → Production**
3. Click **Create new release**
4. Upload build and click **Review release**
5. Click **Rollout to production** → confirm

**Review time:** Usually 24-48 hours

## Step 7: After Approval

Once approved:
- App appears on Play Store
- Users can install it
- Set up **continuous deployment** to auto-update from Vercel

### Auto-Update Flow
```
Your updates → Push to GitHub → Vercel auto-deploy
→ Site Spy users see updates on next app launch
```

## Alternative: Direct APK Distribution

If you want to skip Play Store review:

1. **Build locally** (requires Android SDK setup):
   ```bash
   npm run build
   npx cap build android
   ```

2. **Distribute via:**
   - Direct download link
   - GitHub releases
   - Firebase App Distribution
   - Test flight (TestFlight for iOS)

## Files to Prepare Now

**Screenshots (1080×1920 px each):**
- [ ] Dashboard view
- [ ] Change detection
- [ ] Alert settings
- [ ] Diff viewer

**Graphics (1024×500 px):**
- [ ] Feature graphic (banner)

**Icons (512×512 px):**
- [ ] App icon

**Text:**
- [ ] Short description (80 chars max)
- [ ] Full description (4000 chars max)
- [ ] Privacy policy URL

## Next Steps

1. Create Play Console account if not already done
2. Prepare 3-4 screenshots from the app
3. Create simple privacy policy
4. Submit for review
5. Monitor review status in Play Console dashboard

**Estimated timeline:** 1 hour setup + 24-48 hours review

---

## Support

Questions? Check:
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [PWA on Play Store](https://web.dev/articles/using-trusted-web-activity-with-google-play)
- [Vercel Deployment Docs](https://vercel.com/docs)
