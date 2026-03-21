#!/usr/bin/env node
/**
 * Site Spy - Play Store Assets Generator
 * Generates placeholder graphics for Play Store submission
 */

const fs = require('fs');
const path = require('path');

// Simple SVG to PNG simulation - create SVG files as placeholders
const assets = {
  appIcon: {
    filename: 'docs/app-icon-512x512.svg',
    width: 512,
    height: 512,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1E88E5;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#00BCD4;stop-opacity:1" />
        </linearGradient>
      </defs>
      <!-- Background circle -->
      <circle cx="256" cy="256" r="240" fill="url(#grad1)"/>
      <!-- Magnifying glass -->
      <circle cx="230" cy="230" r="100" fill="none" stroke="white" stroke-width="20"/>
      <line x1="310" y1="310" x2="420" y2="420" stroke="white" stroke-width="20" stroke-linecap="round"/>
      <!-- Data points inside glass -->
      <circle cx="180" cy="180" r="8" fill="white"/>
      <circle cx="230" cy="190" r="6" fill="white"/>
      <circle cx="270" cy="210" r="7" fill="white"/>
      <circle cx="250" cy="250" r="5" fill="white"/>
      <!-- Text -->
      <text x="256" y="440" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white" text-anchor="middle">Site Spy</text>
    </svg>`
  },
  featureGraphic: {
    filename: 'docs/feature-graphic-1024x500.svg',
    width: 1024,
    height: 500,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 500">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1E88E5;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#0D47A1;stop-opacity:1" />
        </linearGradient>
      </defs>
      <!-- Background -->
      <rect width="1024" height="500" fill="url(#bgGrad)"/>
      <!-- Left side: Magnifying glass -->
      <circle cx="200" cy="250" r="120" fill="none" stroke="white" stroke-width="16"/>
      <line x1="300" y1="350" x2="380" y2="430" stroke="white" stroke-width="16" stroke-linecap="round"/>
      <!-- Right side: Text -->
      <text x="650" y="180" font-family="Arial, sans-serif" font-size="72" font-weight="bold" fill="white">Site Spy</text>
      <text x="650" y="260" font-family="Arial, sans-serif" font-size="48" fill="white" opacity="0.9">Web Scraping &amp; Data Extraction</text>
      <text x="650" y="320" font-family="Arial, sans-serif" font-size="36" fill="white" opacity="0.8">Professional Intelligence Tool</text>
      <!-- Data visualization on left -->
      <circle cx="150" cy="200" r="6" fill="white" opacity="0.7"/>
      <circle cx="220" cy="240" r="8" fill="white" opacity="0.7"/>
      <circle cx="180" cy="290" r="5" fill="white" opacity="0.7"/>
    </svg>`
  },
  screenshot1: {
    filename: 'docs/screenshot-1-1080x1920.svg',
    width: 1080,
    height: 1920,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920">
      <rect width="1080" height="1920" fill="#f5f5f5"/>
      <!-- Phone bezels -->
      <rect x="0" y="0" width="1080" height="1920" fill="none" stroke="#333" stroke-width="20"/>
      <!-- Status bar -->
      <rect x="0" y="0" width="1080" height="60" fill="#1E88E5"/>
      <text x="540" y="40" font-family="Arial" font-size="24" fill="white" text-anchor="middle" font-weight="bold">9:41</text>
      <!-- App header -->
      <rect x="0" y="60" width="1080" height="80" fill="#1E88E5"/>
      <text x="540" y="115" font-family="Arial" font-size="40" fill="white" text-anchor="middle" font-weight="bold">Site Spy</text>
      <!-- Content area -->
      <rect x="30" y="160" width="1020" height="200" fill="white" stroke="#ddd" stroke-width="2" rx="8"/>
      <text x="50" y="200" font-family="Arial" font-size="28" font-weight="bold" fill="#333">Target URL</text>
      <rect x="50" y="220" width="1000" height="60" fill="#f0f0f0" rx="4"/>
      <text x="70" y="260" font-family="Arial" font-size="24" fill="#999">Enter website URL...</text>
      <!-- Features list -->
      <rect x="30" y="380" width="1020" height="150" fill="white" stroke="#ddd" stroke-width="2" rx="8"/>
      <text x="50" y="420" font-family="Arial" font-size="28" font-weight="bold" fill="#333">Features</text>
      <text x="70" y="470" font-family="Arial" font-size="24" fill="#666">✓ Web scraping</text>
      <text x="70" y="510" font-family="Arial" font-size="24" fill="#666">✓ Data extraction</text>
      <!-- Bottom text -->
      <text x="540" y="1800" font-family="Arial" font-size="32" fill="#666" text-anchor="middle" font-weight="bold">Enter any website URL to begin</text>
    </svg>`
  },
  screenshot2: {
    filename: 'docs/screenshot-2-1080x1920.svg',
    width: 1080,
    height: 1920,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920">
      <rect width="1080" height="1920" fill="#f5f5f5"/>
      <!-- Phone bezels -->
      <rect x="0" y="0" width="1080" height="1920" fill="none" stroke="#333" stroke-width="20"/>
      <!-- Status bar -->
      <rect x="0" y="0" width="1080" height="60" fill="#1E88E5"/>
      <text x="540" y="40" font-family="Arial" font-size="24" fill="white" text-anchor="middle" font-weight="bold">9:42</text>
      <!-- App header -->
      <rect x="0" y="60" width="1080" height="80" fill="#1E88E5"/>
      <text x="540" y="115" font-family="Arial" font-size="40" fill="white" text-anchor="middle" font-weight="bold">Extracting Data</text>
      <!-- Progress indicator -->
      <rect x="50" y="180" width="1000" height="40" fill="#f0f0f0" rx="20"/>
      <rect x="50" y="180" width="650" height="40" fill="#4CAF50" rx="20"/>
      <text x="540" y="215" font-family="Arial" font-size="24" fill="white" text-anchor="middle" font-weight="bold">65%</text>
      <!-- Results preview -->
      <rect x="30" y="250" width="1020" height="400" fill="white" stroke="#ddd" stroke-width="2" rx="8"/>
      <text x="50" y="290" font-family="Arial" font-size="28" font-weight="bold" fill="#333">Data Preview</text>
      <rect x="50" y="310" width="950" height="100" fill="#f9f9f9" stroke="#eee" stroke-width="1" rx="4"/>
      <text x="70" y="350" font-family="Arial" font-size="20" fill="#666">Title: Example Article</text>
      <text x="70" y="380" font-family="Arial" font-size="20" fill="#666">URL: example.com/article</text>
      <rect x="50" y="430" width="950" height="100" fill="#f9f9f9" stroke="#eee" stroke-width="1" rx="4"/>
      <text x="70" y="470" font-family="Arial" font-size="20" fill="#666">Title: Related Content</text>
      <text x="70" y="500" font-family="Arial" font-size="20" fill="#666">URL: example.com/related</text>
      <!-- Bottom text -->
      <text x="540" y="1800" font-family="Arial" font-size="32" fill="#666" text-anchor="middle" font-weight="bold">Real-time data extraction</text>
    </svg>`
  }
};

// Create docs directory
const docsDir = path.join(__dirname, 'docs');
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

// Write all SVG files
Object.keys(assets).forEach(key => {
  const asset = assets[key];
  const filePath = path.join(__dirname, asset.filename);
  fs.writeFileSync(filePath, asset.svg);
  console.log(`✓ Created: ${asset.filename}`);
});

console.log('\n✅ All Play Store assets generated successfully!');
console.log('Note: SVG files created as templates. Use online SVG-to-PNG converters or graphic design tools for final PNG versions.');
