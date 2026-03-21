# Site Spy Diff Viewer - Quick Start Guide

## What's New?

Site Spy now shows **detailed, specific text changes** instead of generic "content changed" messages.

**Before:** "Text content changed (87% similar)"
**After:** Shows exactly what changed:
- H1 changed from "Professional Roofing" to "SITE SPY TEST"
- Button added: "Get Free Inspection"
- 2 images removed

---

## How to Use

### 1. Add a Competitor
```
Enter URL → Click Add
Example: https://alexanders-roofing.com
```

### 2. Check the Site
```
Click "Check" button to take initial snapshot
```

### 3. Make Changes or Wait for Changes
```
(In real use: wait for competitor to update their site)
```

### 4. Check Again
```
Click "Check" button again to detect changes
```

### 5. View Details
```
Click "▶ View Details" button to expand change history
```

### 6. See Specific Changes
```
Click "▶ View Details" on individual change entry
Now you'll see:
├─ H1 change
├─ Button added
└─ Images changed
```

---

## Understanding the Diff Viewer

### Layout
```
┌─────────────────────────────────────────┐
│ Element          Type       🟠 Severity │ ← Header
├─────────────────────────────────────────┤
│ Old Value   │ → │   New Value          │ ← Side-by-side
└─────────────────────────────────────────┘
```

### Colors Explained
- **🔴 Red (High):** Major elements (H1, H2, forms) - Very important
- **🟠 Orange (Medium):** Buttons, image counts - Moderate importance
- **🔵 Blue (Low):** H3, individual links - Minor changes

### Elements Tracked
| Element | Type | Severity |
|---------|------|----------|
| H1 tags | h1 | 🔴 High |
| H2 tags | h2 | 🟠 Medium |
| H3 tags | h3 | 🔵 Low |
| Buttons | button_added / button_removed | 🟠 Medium |
| Links | link_added / link_removed | 🔵 Low |
| Images | images | 🔵 Low |
| Forms | forms | 🔴 High |

---

## What Gets Stored

### Per Change Entry
```javascript
{
  timestamp: '2026-03-21T09:45:00Z',    // When the change happened
  changes: [
    {                                    // What changed
      type: 'h1',
      element: 'H1 #1',
      oldValue: 'Old Title',
      newValue: 'New Title',
      severity: 'high'
    },
    // ... more changes
  ],
  snapshot: { /* page metrics */ }      // Full page snapshot
}
```

### History Kept
- Last 20 changes per competitor
- Automatic cleanup of old entries
- All data stored in browser localStorage

---

## Features

### ✅ What Works Now
- Detect H1, H2, H3 text changes
- Track button additions/removals
- Track link changes
- Show image count changes
- Severity-based color coding
- Timeline view of changes
- Side-by-side text comparison
- Expandable detailed view
- Snapshot metrics display

### 📋 Data Captured
- Exact text before → after
- Timestamp of change
- Element type (H1, button, link, etc.)
- Severity level
- Full page metrics (images, links, headings, buttons, forms)
- Content hash for comparison

---

## Common Tasks

### Check All Competitors
1. Click "🔍 Check All Sites" button
2. Wait for all sites to complete
3. See "Last check: X minutes ago"

### View One Competitor's Changes
1. Find competitor in list
2. Click "▶ {N} Changes" button
3. Click "▶ View Details" on change entry
4. See full diff with old vs new values

### Clear Old Changes
- History automatically limited to 20 entries
- Oldest changes removed automatically
- No manual cleanup needed

### Export Changes
- Open browser DevTools (F12)
- Go to Application → Local Storage
- Search for "site-spy-competitors"
- Copy the JSON data
- Paste into file/tool for analysis

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Add competitor | Type URL + **Enter** |
| Check site | Click button or **Space** (when focused) |
| Expand changes | Click button or **Enter** (when focused) |

---

## Settings Panel

Click ⚙️ button to access:
- **Check Interval**: How often to automatically check (15 min - Weekly)
- **Notification Channels**: Email, SMS, Webhook URLs
- **Alert On**: Site down, site recovery, content changes

---

## Troubleshooting

### No Changes Detected
**Problem:** Check ran but shows "No changes"
**Cause:** Website content didn't change enough (>85% similar)
**Fix:** Make more significant changes to trigger detection

### CORS Error
**Problem:** "CORS/Network blocked" message
**Cause:** Browser can't fetch site directly
**Fix:** Set up backend proxy at `http://localhost:3001/api/fetch-content`

### History Not Showing
**Problem:** Change history is empty
**Cause:** localStorage cleared or data lost
**Fix:** Run new checks to create fresh history

### Old Data Missing
**Problem:** Old changes disappeared
**Cause:** History limit (20 entries) reached
**Fix:** This is normal - only newest 20 changes kept

---

## Performance Tips

### Faster Checks
- Keep number of competitors under 20
- Check interval at least 15 minutes
- Close other browser tabs while checking

### Storage Management
- Clear very old competitors you don't monitor
- Max storage per competitor: ~50KB (20 changes × 2-3KB)
- Browser localStorage limit: Usually 5-10MB

### Mobile Optimization
- UI automatically adapts to mobile size
- Diffs stack vertically on small screens
- Touch-friendly button sizes

---

## API/Developer Info

### Access Change Data
```javascript
// Browser console
const competitors = JSON.parse(localStorage.getItem('site-spy-competitors'));
const firstCompetitor = competitors[0];
const latestChanges = firstCompetitor.changes[0];
console.log(latestChanges.changes); // Array of diffs
```

### Change Object Structure
```javascript
{
  type: 'h1',                    // Change type
  element: 'H1 #1',             // What was changed
  oldValue: 'Old text',         // Previous value
  newValue: 'New text',         // Current value
  severity: 'high',             // Impact level: high/medium/low
  summary: 'Optional summary'   // For non-text changes
}
```

### Snapshot Object
```javascript
{
  text: 'page text...',
  sections: {
    h1: ['heading1'],
    h2: ['heading2'],
    h3: [],
    buttons: ['button text'],
    links: [{ text: 'link', href: 'url' }]
  },
  linkCount: 10,
  imageCount: 5,
  headingCount: 3,
  buttonCount: 1,
  formCount: 0,
  timestamp: '2026-03-21T09:48:00Z',
  hash: 'a1b2c3d4e5f6g7h8'
}
```

---

## Examples

### Example 1: Simple H1 Change
```
Check 1: H1 = "Professional Roofing"
Modify site: Change H1 to "Best Roofers in Town"
Check 2: Detects change → Shows diff

Result:
✓ H1 #1 changed
  Old: Professional Roofing
  New: Best Roofers in Town
```

### Example 2: Multiple Changes
```
Check 1: Baseline
Modify site:
  - H1: "Services" → "Our Services"
  - Add button: "Call Now"
  - Add 3 images
Check 2: Detects ALL changes

Result:
✓ H1 #1 changed
✓ Button added: "Call Now"
✓ 3 images added
```

### Example 3: History Timeline
```
Check 1 (Week 1): H1 changed
Check 2 (Week 2): Button added
Check 3 (Week 3): Content updated

Timeline shows:
├─ 3 days ago: H1 changed
├─ 2 days ago: Button added
└─ 1 hour ago: Content updated (2 changes)
```

---

## Best Practices

1. **Check Regularly** - More frequent checks catch changes faster
2. **Use Meaningful Names** - Change competitor name to match site
3. **Review Severity** - Focus on high-severity changes first
4. **Track Trends** - Look for patterns in competitor updates
5. **Set Alerts** - Enable notifications for important changes
6. **Export Data** - Keep backup of important change history

---

## Need Help?

### Detailed Documentation
- **IMPLEMENTATION_SUMMARY.md** - Technical details
- **TESTING_DIFF_VIEWER.md** - Test scenarios
- **DIFF_VIEWER_CHANGELOG.md** - Feature overview

### Reporting Issues
Include:
- Browser and OS version
- Steps to reproduce
- Screenshot or console error
- localStorage data (if relevant)

---

## Keyboard Shortcuts (Full Reference)

```
Global
  Enter (in input)     → Add new competitor
  Ctrl+Shift+Delete    → Clear localStorage (browsers)

Site Actions
  Space (on button)    → Trigger action
  Enter (on button)    → Trigger action
  Escape               → Close panels/dialogs (future)

Navigation
  Tab                  → Move between elements
  Shift+Tab            → Move backward
```

---

## What's Coming Next

Future enhancements planned:
- 📊 Change statistics dashboard
- 📧 Email notifications for changes
- 📸 Screenshot comparison
- 🔔 Custom alert rules
- 💾 Export to CSV
- 📈 Trending analysis
- 🎯 Pattern detection

---

## FAQ

**Q: How often should I check?**
A: Every 15 minutes to daily depending on how often competitors update (configurable)

**Q: What if nothing changes?**
A: Site Spy will show "No changes" - the similarity threshold is 85%

**Q: Where is data stored?**
A: Browser localStorage - no data sent to servers

**Q: Can I see historical snapshots?**
A: Yes, click "View snapshot metrics" in expanded details

**Q: What if I have 100+ competitors?**
A: You can add as many as you want, but checking speed depends on internet

**Q: Is data backed up?**
A: No - localStorage is local only. Export important data yourself

---

## Quick Reference Card

```
┌─────────────────────────────────────────┐
│          SITE SPY QUICK REFERENCE       │
├─────────────────────────────────────────┤
│ 🟢 Add Competitor                       │
│   → Enter URL → Click Add               │
│                                         │
│ 🔍 Check Site                           │
│   → Click Check button                  │
│                                         │
│ 📋 View Changes                         │
│   → Click "View Details" button         │
│                                         │
│ 📊 See Diff Viewer                      │
│   → Expand change entry for side-by-   │
│     side comparison                     │
│                                         │
│ 🎨 Color Legend                         │
│   🔴 High - Major changes (H1, forms)   │
│   🟠 Medium - Moderate (buttons)        │
│   🔵 Low - Minor (H3, links)            │
│                                         │
│ ⚙️  Settings                             │
│   → Click settings gear icon            │
│   → Configure intervals & alerts        │
└─────────────────────────────────────────┘
```

---

**Version:** 2.0 - Diff Viewer Enhanced
**Last Updated:** March 21, 2026
**Status:** Production Ready ✅
