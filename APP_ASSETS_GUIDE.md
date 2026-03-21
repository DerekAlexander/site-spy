# Site Spy - App Assets & Icons Guide

## Overview

This guide covers creating and preparing all visual assets required for Play Store listing and app installation.

---

## App Icons

### Launcher Icon Requirements

**Primary Launcher Icon (512×512px)**
- **Format:** PNG with transparency or JPEG
- **Location:** `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png`
- **Background:** Should work on both light and dark backgrounds
- **Design Tips:**
  - Clear, recognizable at all sizes
  - Avoid thin lines (< 1px may disappear)
  - Use solid/bold shapes
  - No text overlay
  - 48px minimum safe zone on edges

**Design Concept for Site Spy:**
```
Visual elements:
- Magnifying glass (web search/investigation theme)
- Data points or network nodes
- Clean, modern flat design
- Color palette: Professional blues and greens
- Safe zone: Inner 66% of image (safe margins)

Example: Magnifying glass with circuit board pattern inside
```

### Adaptive Icon (for Android 8.0+)

**Requirements:**
- Foreground layer: 81×81dp (with transparency)
- Background layer: 108×108dp (solid color or texture)
- Both layers should be at 1.5x scale

**File locations:**
```
android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png
android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_background.xml
```

### Icon Density Requirements

Android requires icons at multiple resolutions:

```
ldpi     (120 dpi)  - 36×36 px
mdpi     (160 dpi)  - 48×48 px
hdpi     (240 dpi)  - 72×72 px
xhdpi    (320 dpi)  - 96×96 px
xxhdpi   (480 dpi)  - 144×144 px
xxxhdpi  (640 dpi)  - 192×192 px
```

**Directory structure:**
```
android/app/src/main/res/
├── mipmap-ldpi/
│   └── ic_launcher.png (36×36)
├── mipmap-mdpi/
│   └── ic_launcher.png (48×48)
├── mipmap-hdpi/
│   └── ic_launcher.png (72×72)
├── mipmap-xhdpi/
│   └── ic_launcher.png (96×96)
├── mipmap-xxhdpi/
│   └── ic_launcher.png (144×144)
└── mipmap-xxxhdpi/
    ├── ic_launcher.png (192×192)
    ├── ic_launcher_foreground.png (324×324)
    └── ic_launcher_background.xml
```

**Automated Generation:**
Use Android Studio's Image Asset Studio:
1. Right-click `res/` folder
2. New → Image Asset
3. Select launcher icon type
4. Upload 512×512px master image
5. Android Studio generates all required sizes

---

## Play Store Graphics

### Feature Graphic (1024×500px)

**Purpose:** Displayed at top of Play Store listing

**Design specifications:**
- **Dimensions:** 1024×500px
- **Format:** PNG or JPG (JPG recommended for smaller size)
- **Safe area:** Leave 48px margin on all sides
- **Content:**
  - App name and tagline
  - Key feature visualization
  - Clear, bold design
  - Brand consistency

**Design recommendations:**
- Top 50%: Hero image/product showcase
- Bottom 50%: App name + tagline
- Use contrasting colors for readability
- Include 2-3 key features visually

**Example layout:**
```
┌─────────────────────────────────────────────┐
│                                             │
│  [Large magnifying glass icon]              │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  Site Spy                           │   │
│  │  Professional Web Data Extraction   │   │
│  │                                     │   │
│  │  ✓ Point-and-click scraping        │   │
│  │  ✓ Export to CSV/JSON/Excel        │   │
│  │  ✓ Advanced selectors support      │   │
│  └─────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

### Store Screenshots (1080×1920px)

**Requirements:**
- **Minimum:** 2 screenshots
- **Recommended:** 4-5 screenshots (better conversion)
- **Format:** PNG or JPG
- **Orientation:** Portrait (1080×1920)
- **Safe area:** No critical content in top/bottom 96px

**Screenshot Strategy:**

**Screenshot 1: App Overview**
- Show main UI/home screen
- Display key interface elements
- Caption: "Intuitive web scraping interface"

**Screenshot 2: Feature Highlight - Data Selection**
- Show data selection/highlighting
- Demonstrate point-and-click interaction
- Caption: "Select data with intuitive point-and-click"

**Screenshot 3: Feature Highlight - Export**
- Show export dialog/options
- Display supported formats (CSV, JSON, Excel)
- Caption: "Export to CSV, JSON, Excel, and more"

**Screenshot 4: Feature Highlight - Advanced Settings**
- Show proxy settings or CSS selectors
- Display advanced customization options
- Caption: "Advanced CSS selectors and XPath support"

**Screenshot 5: Feature Highlight - Results**
- Show successful data extraction example
- Display organized data in table format
- Caption: "Professional data extraction results"

**Design tips:**
- Add 2-3 line captions (readable in thumbnail)
- Use arrows/circles to highlight key features
- Add semi-transparent overlays if needed
- Maintain consistent branding/colors
- Test readability at small sizes

### Play Store Icon (512×512px)

**Requirements:**
- **Format:** PNG or JPG
- **Dimensions:** Exactly 512×512px
- **Color Space:** sRGB

**Should be identical to launcher icon**

---

## Recommended Tools

### Design Tools

**Free Options:**
- **Canva:** https://canva.com
  - Pre-made templates for app screenshots
  - Collaboration features
  - Free tier sufficient for basics

- **GIMP:** https://gimp.org
  - Professional image editor
  - Completely free and open-source
  - Steep learning curve

- **Figma:** https://figma.com
  - Web-based design tool
  - Free tier for personal projects
  - Great for team collaboration

**Paid Options:**
- Adobe Creative Suite (Photoshop, Illustrator)
- Affinity Designer
- Sketch (macOS only)

### Icon Generation

- **Android Studio Image Asset Studio** (built-in)
  - Automatically scales to all densities
  - Supports adaptive icons
  - Recommended for simplicity

- **Romannian Automatic icon generator:**
  - https://romannujan.github.io/icon-generator
  - Web-based, generates all densities

- **Icon generators:**
  - https://www.appicon.co
  - https://iconkitchen.app
  - Generates iOS and Android icons

### Screenshot Tools

- **Android Studio Emulator:**
  - Built-in screenshot tool
  - Rotate to portrait easily

- **Android Device:**
  - Power + Volume Down = screenshot
  - Transfer via USB

- **Screenshot software:**
  - Windows: Snip & Sketch or ShareX
  - macOS: Screenshot app
  - Online: tools.picsart.com

---

## Asset Preparation Checklist

### Icons
- [ ] Master icon designed (512×512px)
- [ ] Icon tested at small sizes (48px)
- [ ] Icon works on light and dark backgrounds
- [ ] Generated all density variants
- [ ] Adaptive icon foreground created
- [ ] Adaptive icon background defined
- [ ] Placed in correct mipmap folders
- [ ] AndroidManifest.xml references correct icons

### Feature Graphic
- [ ] Feature graphic designed (1024×500px)
- [ ] Text readable at thumbnail size
- [ ] No critical content in edge margins (48px)
- [ ] Brand colors consistent
- [ ] Key features visually represented
- [ ] Tested for color blindness (optional)
- [ ] Exported as PNG or JPG

### Screenshots
- [ ] 4-5 high-quality screenshots (1080×1920px)
- [ ] Each screenshot focuses on 1-2 features
- [ ] Captions clear and grammatically correct
- [ ] Screenshots follow consistent design
- [ ] Text readable at mobile size
- [ ] All screenshots portrait orientation
- [ ] No personal data visible
- [ ] Tested at thumbnail size

---

## File Organization

**Recommended directory structure:**
```
site-spy/
├── assets/
│   ├── app-icon/
│   │   ├── icon-512x512.png (master icon)
│   │   ├── icon-192x192.png
│   │   ├── icon-144x144.png
│   │   └── ... (other densities)
│   ├── feature-graphic/
│   │   └── feature-1024x500.png (or jpg)
│   ├── screenshots/
│   │   ├── screenshot-1-overview.png
│   │   ├── screenshot-2-data-selection.png
│   │   ├── screenshot-3-export.png
│   │   ├── screenshot-4-advanced.png
│   │   └── screenshot-5-results.png
│   └── play-store/
│       └── preview-video.mp4 (optional)
├── android/app/src/main/res/
│   ├── mipmap-xxxhdpi/
│   │   ├── ic_launcher.png
│   │   ├── ic_launcher_foreground.png
│   │   └── ic_launcher_background.xml
│   ├── mipmap-xxhdpi/
│   │   └── ic_launcher.png
│   └── ... (other densities)
└── README.md
```

---

## Play Store Upload Process

### In Google Play Console:

1. **Store Listing → Graphics > App icon**
   - Upload 512×512px PNG or JPG
   - Size limit: 512KB

2. **Store Listing → Graphics > Feature graphic**
   - Upload 1024×500px PNG or JPG
   - Size limit: 15MB

3. **Store Listing → Screenshots**
   - Add screenshots for primary language (English)
   - 2-8 screenshots recommended
   - Each screenshot max 8MB
   - Upload captions (optional but recommended)

4. **Store Listing → Preview video (optional)**
   - 15-30 seconds
   - Max 500MB
   - YouTube link format

---

## Design Best Practices

### Icon Design
- ✅ Bold, simple shapes
- ✅ Professional appearance
- ✅ Consistent with brand identity
- ❌ Overly complex details
- ❌ Thin lines (< 1px)
- ❌ Tiny text

### Screenshot Design
- ✅ Focus on user benefits
- ✅ Show real UI (no mockups)
- ✅ Clear, concise captions
- ✅ Consistent color scheme
- ❌ Marketing fluff text
- ❌ Personal information visible
- ❌ Watermarks or logos

### Feature Graphic
- ✅ Eye-catching and professional
- ✅ Clear call-to-action
- ✅ Key features highlighted
- ✅ Brand consistent
- ❌ Cluttered or hard to read
- ❌ Blurry or low resolution
- ❌ Misleading claims

---

## Accessibility Considerations

- Ensure sufficient color contrast (WCAG AA minimum 4.5:1 for text)
- Avoid relying solely on color to convey meaning
- Use clear, readable fonts
- Add descriptive text in captions
- Test with color-blindness simulators
- Include alt-text descriptions where applicable

---

## Creating Android Manifest Icon References

**android/app/src/main/AndroidManifest.xml:**

```xml
<application
    android:allowBackup="true"
    android:dataExtractionRules="@xml/data_extraction_rules"
    android:fullBackupContent="@xml/backup_rules"
    android:icon="@mipmap/ic_launcher"
    android:label="@string/app_name"
    android:roundIcon="@mipmap/ic_launcher_round"
    android:supportsRtl="true"
    android:theme="@style/AppTheme">
    <!-- ... -->
</application>
```

**strings.xml values:**
```xml
<resources>
    <string name="app_name">Site Spy</string>
    <string name="app_description">Professional web scraping and data extraction tool</string>
</resources>
```

---

## Testing Icons

1. **In Android Studio Emulator:**
   - Emulator → Extended controls → Screenshot
   - Verify icon displays correctly on app drawer

2. **On Real Device:**
   - Install app
   - Check home screen appearance
   - Verify icon clarity at all sizes

3. **Asset Checker:**
   ```bash
   cd android
   ./gradlew lint
   ```
   Look for icon warnings/errors

---

## Quick Asset Generation Script

**For automated generation (optional):**

```bash
#!/bin/bash
# generate-assets.sh - Generate all icon sizes from master 512x512

MASTER="assets/app-icon/icon-512x512.png"
OUTPUT_DIR="android/app/src/main/res"

# Requires ImageMagick installed
# brew install imagemagick (macOS)
# apt-get install imagemagick (Linux)

sizes=(
  "36:ldpi"
  "48:mdpi"
  "72:hdpi"
  "96:xhdpi"
  "144:xxhdpi"
  "192:xxxhdpi"
)

for size_density in "${sizes[@]}"; do
  size="${size_density%:*}"
  density="${size_density#*:}"
  
  convert "$MASTER" -resize "${size}x${size}" \
    "$OUTPUT_DIR/mipmap-${density}/ic_launcher.png"
done

echo "Icon assets generated!"
```

---

## Next Steps

1. ✅ Design or source app icons
2. ✅ Generate all required icon densities
3. ✅ Create feature graphic (1024×500px)
4. ✅ Prepare 4-5 screenshots (1080×1920px each)
5. ✅ Upload to Play Store Console
6. ✅ Review and finalize store listing

---

**Version:** 1.0.0
**Last Updated:** March 21, 2026
