# Play Store Release Checklist - Site Spy

## Pre-Release Phase

### Code Quality & Testing
- [ ] All features tested on Android device (API 31+)
- [ ] No console errors or warnings (`adb logcat`)
- [ ] Lint checks pass: `cd android && ./gradlew lint`
- [ ] Performance profiling completed
- [ ] Memory leaks checked with Android Profiler
- [ ] Battery usage profiled on real device
- [ ] Network requests tested offline and online

### App Configuration
- [ ] App version code incremented in `android/app/build.gradle`
- [ ] Version name updated (semantic versioning)
- [ ] App name: "Site Spy" (consistent everywhere)
- [ ] Package name: `com.sitespy.app`
- [ ] Application ID matches package name
- [ ] Target SDK: 34+ (API level compatibility)
- [ ] Minimum SDK: 31 (Android 12)

### Security & Privacy
- [ ] No hardcoded API keys or credentials
- [ ] No debug logging enabled in release build
- [ ] ProGuard/R8 obfuscation enabled
- [ ] Certificate fingerprints documented and securely stored
- [ ] Privacy policy URL prepared and accessible
- [ ] GDPR/CCPA compliance reviewed
- [ ] Data handling practices documented
- [ ] Third-party library licenses reviewed

### Permissions & Manifest
- [ ] All requested permissions justified
- [ ] No unnecessary permissions requested
- [ ] AndroidManifest.xml reviewed for correctness
- [ ] Deep links configured (if applicable)
- [ ] Intent filters properly defined
- [ ] App shortcuts configured (if applicable)
- [ ] Backup configuration reviewed

### Build & Signing
- [ ] Keystore file backed up securely
- [ ] Keystore location documented
- [ ] Signing certificate fingerprints saved
- [ ] Release APK successfully built
- [ ] APK signature verified: `jarsigner -verify -verbose app-release.apk`
- [ ] APK tested on multiple devices
- [ ] APK size acceptable (< 100MB base)

---

## Store Listing Phase

### Basic Information
- [ ] Store listing title set: "Site Spy"
- [ ] Short description written (max 50 characters)
  ```
  Professional web scraping and data extraction tool
  ```
- [ ] Full description written and proofread (max 4,000 chars)
- [ ] Category selected: **Productivity** > **Utilities**
- [ ] Content rating questionnaire completed
- [ ] Privacy policy URL provided and accessible
- [ ] Contact email provided and monitored

### Visual Assets
- [ ] App icon created (512×512px, PNG)
  - [ ] Follows Android Material Design guidelines
  - [ ] Clear and recognizable at all sizes
  - [ ] No text overlay on icon
  - [ ] Proper padding/safe zone

- [ ] Feature graphic created (1024×500px, PNG/JPG)
  - [ ] Clearly communicates app purpose
  - [ ] Brand consistent
  - [ ] No critical content in edges (safe margins)

- [ ] Screenshots prepared (4-5 per language, 1080×1920px)
  - [ ] Screenshot 1: App home/main interface
  - [ ] Screenshot 2: Key feature highlight
  - [ ] Screenshot 3: Data extraction example
  - [ ] Screenshot 4: Export/sharing feature
  - [ ] Screenshot 5: Settings or advanced feature
  - [ ] All screenshots include 2-3 line captions
  - [ ] Captions proofread for typos
  - [ ] Text readable at small sizes

- [ ] Preview video (optional, 15-30 seconds)
  - [ ] Demonstrates core functionality
  - [ ] Captures attention immediately
  - [ ] Includes captions/voiceover

### Compliance & Policies
- [ ] Content rating accurate (Adults 18+)
- [ ] Age verification setup (if applicable)
- [ ] Terms of service reviewed
- [ ] Google Play Developer policies acknowledged
- [ ] COPPA compliance verified (no targeting children)
- [ ] No prohibited content
- [ ] No deceptive or misleading claims

---

## Beta Testing Phase

### Internal Testing (Your Team)
- [ ] Internal testers added to Play Console
- [ ] APK uploaded to internal testing track
- [ ] Testers invited and accepted
- [ ] Basic functionality verified:
  - [ ] App installs without errors
  - [ ] Permissions requested correctly
  - [ ] All main features accessible
  - [ ] No crash on launch
  - [ ] No crash on core operations

- [ ] Device compatibility verified:
  - [ ] Tested on Pixel phone (Google reference device)
  - [ ] Tested on Samsung device
  - [ ] Tested on tablet (if supporting tablets)
  - [ ] Tested on older device (API 31)

- [ ] Feedback collected and documented
- [ ] Critical bugs fixed

### Closed Testing (Selected Users)
- [ ] Closed testing track created
- [ ] Test groups defined by region/feature
- [ ] External testers invited (50-500 users)
- [ ] Minimum 1 week of feedback collection
- [ ] Crash reports reviewed in Play Console
- [ ] User feedback analyzed
- [ ] Rating and review trends monitored
- [ ] Fixes prioritized and implemented

### Open Testing (Public Beta - Optional)
- [ ] Open testing track created
- [ ] Public beta description written
- [ ] Open testing duration set (1-2 weeks)
- [ ] Opt-in limit configured
- [ ] Marketing/announcement prepared
- [ ] Crash rates monitored
- [ ] User feedback actively collected

---

## Production Release Phase

### Final Verification
- [ ] All beta feedback addressed
- [ ] Crash rate below 1% (target: < 0.5%)
- [ ] ANR (Application Not Responding) rate < 1%
- [ ] User rating >= 4.0 stars (or acceptable for beta)
- [ ] All permissions still justified
- [ ] Data privacy statement current

### Play Store Console Setup
- [ ] Production track created
- [ ] Release notes written and proofread:
  - [ ] List new features
  - [ ] Document bug fixes
  - [ ] Note improvements
  - [ ] Thank beta testers

- [ ] Rollout strategy planned:
  - [ ] Start with 5% rollout (test for crashes)
  - [ ] Monitor for 24 hours
  - [ ] Increase to 25% if stable
  - [ ] Monitor for 24 hours
  - [ ] Increase to 100% (full rollout)

- [ ] Target audience and countries configured
- [ ] Device requirements verified
- [ ] Minimum Android version set (API 31)

### Submission Process
- [ ] All required fields completed
- [ ] Store listing reviewed for completeness
- [ ] APK/Bundle uploaded
- [ ] Release notes finalized
- [ ] Review screenshot metadata
- [ ] Accept policy agreements
- [ ] Submit for review

### Post-Submission
- [ ] Submission receipt confirmed (email)
- [ ] Estimated review time noted (24-72 hours)
- [ ] Standby for Google Play review team response

---

## Post-Release Monitoring

### Launch Day (24 hours)
- [ ] App appeared in Play Store search
- [ ] Download link working
- [ ] App page displays correctly
- [ ] Screenshots and description visible
- [ ] Rating/review count starting to accumulate
- [ ] Monitor crash reports: *Analytics > Crashes & ANRs*
- [ ] Crash rate < 1%
- [ ] ANR rate < 1%

### Week 1 Monitoring
- [ ] Daily review of crash reports
- [ ] Analysis of user feedback/reviews
- [ ] Monitor for 1-star reviews (address concerns)
- [ ] Track daily active users (DAU)
- [ ] Track retention metrics
- [ ] Server/backend load within limits
- [ ] No unusual errors in logs

### Week 2-4 Monitoring
- [ ] Continue crash monitoring
- [ ] Analyze feature usage patterns
- [ ] Identify user pain points
- [ ] Plan updates for upcoming releases
- [ ] Update store listing based on feedback
- [ ] Monitor competitive landscape
- [ ] Verify analytics pipeline working

### Ongoing Metrics to Track
- [ ] Daily Active Users (DAU)
- [ ] Monthly Active Users (MAU)
- [ ] Retention rate (Day 1, 7, 30)
- [ ] Crash rate (target: < 0.5%)
- [ ] ANR rate (target: < 0.5%)
- [ ] User rating (target: >= 4.0)
- [ ] Install count
- [ ] Uninstall rate

---

## Issues & Resolutions

### If App is Rejected

1. **Review rejection reason** in Play Console
2. **Common rejections:**
   - Missing privacy policy → Add URL
   - Misleading description → Update listing
   - Permission overreach → Remove unnecessary permissions
   - Crashes/bugs → Fix and retest
   - Policy violation → Address compliance issue

3. **Fix issue and resubmit:**
   - Increment version code
   - Build new APK
   - Upload to same track
   - Resubmit for review

### If Critical Bug is Found Post-Launch

1. **Severity assessment:** Does it crash immediately or only in edge cases?
2. **User impact:** How many users affected?
3. **Action plan:**
   - Create hotfix branch
   - Fix bug and test thoroughly
   - Increment version code
   - Build new APK
   - Upload as new release (not rollback)
   - Promote gradually (5% → 25% → 100%)

### If Crash Rate Spikes

1. **Analyze crash stack trace** in Play Console
2. **Identify affected devices/OS versions**
3. **Check for recent changes** that may have caused it
4. **Build hotfix immediately**
5. **Roll out incrementally** (don't push 100% immediately)

---

## Update Release Workflow

For subsequent releases (v1.0.1, v1.1.0, etc.):

1. **Increment version code** in `android/app/build.gradle`
2. **Update version name** (semantic versioning)
3. **Build release APK** following [APK_BUILD_GUIDE.md](APK_BUILD_GUIDE.md)
4. **Create release notes** highlighting changes
5. **Upload to internal testing track**
6. **Verify no new issues** on devices
7. **Upload to production track**
8. **Submit for review**
9. **Monitor post-launch crashes**

---

## Emergency Procedures

### Production Crash Emergency

**If crash rate > 5% and rising:**

1. **Immediate actions:**
   - Stop rollout (if phased)
   - Check Play Console for crash reports
   - Identify affected app versions
   - Contact affected users (optional)

2. **Hotfix process:**
   - Emergency meeting on fix
   - Develop and test fix intensively
   - Build new APK with new version code
   - Upload to internal testing
   - Quick 1-2 hour validation
   - Upload to production
   - Start minimal rollout (1%)

3. **Communication:**
   - Update app description with known issues
   - Pin review response to top explaining fix
   - Release notes should acknowledge issue

### Blocked Submission

**If Play Store review is delayed > 7 days:**

1. Contact Google Play support (in-app)
2. Check for policy violations
3. Verify all required fields are complete
4. Request expedited review if appropriate

---

## Long-term Maintenance

### Monthly Tasks
- [ ] Monitor analytics and crash reports
- [ ] Respond to user reviews and questions
- [ ] Plan next feature release
- [ ] Update dependencies as needed
- [ ] Review security advisories

### Quarterly Tasks
- [ ] Plan major feature update
- [ ] Analyze competitor apps and features
- [ ] Collect feature requests from users
- [ ] Plan roadmap for next quarter
- [ ] Audit permissions and privacy practices

### Annual Tasks
- [ ] Conduct security audit
- [ ] Review and potentially rotate signing certificate
- [ ] Update screenshots/marketing materials
- [ ] Plan year-ahead roadmap
- [ ] Consider major version bump (if warranted)

---

## Key Resources

- **Google Play Console:** https://play.google.com/console
- **Android App Signing:** https://developer.android.com/studio/publish/app-signing
- **Play Store Policies:** https://play.google.com/about/developer-content-policy/
- **Material Design Guidelines:** https://material.io/design
- **Android Documentation:** https://developer.android.com/docs

---

## Contact Information

**For Issues:**
- Google Play Support: https://support.google.com/googleplay
- Site Spy Team: [your contact email]
- Bug Reports: [bug report email/system]

---

**Checklist Version:** 1.0.0
**Last Updated:** March 21, 2026
**Status:** Ready for release preparation
