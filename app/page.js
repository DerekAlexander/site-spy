'use client';

import { useState, useEffect } from 'react';

const DEFAULT_ALERT_SETTINGS = {
  checkInterval: 60, // minutes
  notifyEmail: '',
  notifySms: '',
  notifyWebhook: '',
  alertOnDown: true,
  alertOnRecover: true,
  alertOnContentChange: false,
};

// DiffViewer component for displaying side-by-side text changes
function DiffViewer({ diff }) {
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return '#ff4444';
      case 'medium': return '#ffa500';
      case 'low': return '#4a90d9';
      default: return '#999';
    }
  };

  const getSeverityLabel = (severity) => {
    switch (severity) {
      case 'high': return '🔴 High';
      case 'medium': return '🟠 Medium';
      case 'low': return '🔵 Low';
      default: return 'ℹ️ Info';
    }
  };

  return (
    <div className="diff-viewer">
      <div className="diff-header" style={{ borderLeftColor: getSeverityColor(diff.severity) }}>
        <span className="diff-element">{diff.element}</span>
        <span className="diff-type-badge">{diff.type.replace(/_/g, ' ').toUpperCase()}</span>
        <span className="diff-severity">{getSeverityLabel(diff.severity)}</span>
      </div>
      
      {diff.oldValue !== undefined && diff.newValue !== undefined ? (
        <div className="diff-content">
          <div className="diff-side old">
            <div className="diff-side-label">Old Value</div>
            <div className="diff-value old-value">
              {String(diff.oldValue).substring(0, 200)}
            </div>
          </div>
          <div className="diff-arrow">→</div>
          <div className="diff-side new">
            <div className="diff-side-label">New Value</div>
            <div className="diff-value new-value">
              {String(diff.newValue).substring(0, 200)}
            </div>
          </div>
        </div>
      ) : (
        <div className="diff-summary">
          {diff.summary}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [competitors, setCompetitors] = useState([]);
  const [newUrl, setNewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(null); // ID of competitor being checked
  const [capturingScreenshot, setCapturingScreenshot] = useState(null); // ID of competitor with screenshot being captured
  const [lastCheckAll, setLastCheckAll] = useState(null);
  const [alertSettings, setAlertSettings] = useState(DEFAULT_ALERT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [expandedChanges, setExpandedChanges] = useState(null); // Track which competitor's changes are expanded
  const [expandedChangeDetail, setExpandedChangeDetail] = useState(null); // Track expanded change detail view
  const [showChangelog, setShowChangelog] = useState(false); // Show/hide changelog panel
  const [changelogFilter, setChangelogFilter] = useState('all'); // Filter: 'all', 'high', 'medium', 'low'
  const [expandedScreenshots, setExpandedScreenshots] = useState(null); // Track which competitor's screenshots are expanded
  const [showUpgradeModal, setShowUpgradeModal] = useState(false); // Show/hide upgrade modal
  const [purchaseTier, setPurchaseTier] = useState('free'); // Purchased tier: 'free', 'basic', 'pro', 'pro_2x'
  const [siteLimit, setSiteLimit] = useState(1); // Current site limit based on tier (free = 1)

  // Load competitors and alert settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('site-spy-competitors');
    if (saved) {
      setCompetitors(JSON.parse(saved));
    }
    const lastCheck = localStorage.getItem('site-spy-last-check-all');
    if (lastCheck) setLastCheckAll(lastCheck);
    
    // Load alert settings
    const savedSettings = localStorage.getItem('site-spy-alert-settings');
    if (savedSettings) {
      setAlertSettings(JSON.parse(savedSettings));
    }
    
    // Load purchase tier and calculate site limit
    const savedTier = localStorage.getItem('site-spy-purchase-tier');
    if (savedTier) {
      const tier = JSON.parse(savedTier);
      setPurchaseTier(tier.tier);
      setSiteLimit(calculateSiteLimit(tier.tier));
    }
  }, []);

  // Set up automatic checks based on interval
  useEffect(() => {
    if (competitors.length === 0 || !alertSettings.checkInterval) return;
    
    const intervalMs = alertSettings.checkInterval * 60 * 1000;
    const interval = setInterval(() => {
      // Only auto-check if content change detection is enabled
      if (alertSettings.alertOnContentChange) {
        checkAll();
      }
    }, intervalMs);
    
    return () => clearInterval(interval);
  }, [competitors.length, alertSettings.checkInterval, alertSettings.alertOnContentChange]);

  // Save to localStorage when competitors change
  const saveCompetitors = (newList) => {
    setCompetitors(newList);
    localStorage.setItem('site-spy-competitors', JSON.stringify(newList));
  };

  // Save alert settings to localStorage
  const saveAlertSettings = (newSettings) => {
    setAlertSettings(newSettings);
    localStorage.setItem('site-spy-alert-settings', JSON.stringify(newSettings));
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  };

  const updateSetting = (key, value) => {
    saveAlertSettings({ ...alertSettings, [key]: value });
  };

  const getIntervalLabel = (minutes) => {
    if (minutes < 60) return `Every ${minutes} min`;
    if (minutes === 60) return 'Every hour';
    if (minutes === 1440) return 'Daily';
    if (minutes === 10080) return 'Weekly';
    return `${minutes} min`;
  };

  // Calculate site limit based on purchase tier
  const calculateSiteLimit = (tier) => {
    switch (tier) {
      case 'free': return 1;
      case 'basic': return 6; // +5 sites ($9.99)
      case 'pro': return 11; // +5 more sites ($5)
      case 'pro_2x': return 16; // +5 more sites ($5)
      case 'pro_3x': return 21; // +5 more sites ($5)
      case 'pro_4x': return 26; // +5 more sites ($5)
      default: return 1;
    }
  };

  // Handle upgrade purchase (mock)
  const handleUpgrade = (tier) => {
    const newTier = {
      tier,
      purchasedAt: new Date().toISOString(),
      price: tier === 'basic' ? 9.99 : 5.00
    };
    localStorage.setItem('site-spy-purchase-tier', JSON.stringify(newTier));
    setPurchaseTier(tier);
    setSiteLimit(calculateSiteLimit(tier));
    setShowUpgradeModal(false);
  };

  const getSettingsSummary = () => {
    const parts = [];
    parts.push(getIntervalLabel(alertSettings.checkInterval));
    if (alertSettings.notifyEmail && alertSettings.notifyEmail.includes('@')) parts.push('📧 Email');
    if (alertSettings.notifySms && alertSettings.notifySms.match(/^\+?\d/)) parts.push('📱 SMS');
    if (alertSettings.notifyWebhook && alertSettings.notifyWebhook.startsWith('http')) parts.push('🔗 Webhook');
    const alerts = [];
    if (alertSettings.alertOnDown) alerts.push('↓ Down');
    if (alertSettings.alertOnRecover) alerts.push('↑ Up');
    if (alertSettings.alertOnContentChange) alerts.push('📝 Changes');
    if (alerts.length > 0) parts.push(`Alerts: ${alerts.join(', ')}`);
    return parts.length > 0 ? parts.join(' • ') : 'No alerts configured';
  };

  // Auto-show modal when limit is reached
  useEffect(() => {
    if (competitors.length >= siteLimit && siteLimit > 0 && newUrl && !showUpgradeModal) {
      // Don't auto-trigger on mount, only if user tries to add more
    }
  }, [competitors.length, siteLimit]);

  const addCompetitor = () => {
    // Check if limit reached FIRST (before checking URL)
    if (competitors.length >= siteLimit) {
      setShowUpgradeModal(true);
      return;
    }
    
    if (!newUrl) return;
    
    const url = newUrl.startsWith('http') ? newUrl : `https://${newUrl}`;
    const domain = url.replace('https://', '').replace('www.', '');
    
    const newCompetitor = {
      id: Date.now(),
      url,
      domain,
      name: domain.split('.')[0],
      addedAt: new Date().toISOString(),
      lastChecked: null,
      lastSnapshot: null,
      changes: [],
      status: 'pending'
    };
    
    saveCompetitors([...competitors, newCompetitor]);
    setNewUrl('');
  };

  const removeCompetitor = (id) => {
    saveCompetitors(competitors.filter(c => c.id !== id));
  };

  // Extract and normalize page content for comparison
  const extractPageContent = (html) => {
    // Create a simple hash of visible text content
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Remove scripts, styles, and metadata
    const scripts = doc.querySelectorAll('script, style, meta, link, noscript');
    scripts.forEach(el => el.remove());
    
    // Get visible text and normalize it
    const text = doc.body.innerText.trim().toLowerCase();
    const links = Array.from(doc.querySelectorAll('a'))
      .map(a => a.href)
      .filter(Boolean);
    const images = Array.from(doc.querySelectorAll('img'))
      .map(img => img.src)
      .filter(Boolean);
    
    // Extract key metrics for change detection
    const headings = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6'))
      .map(h => h.innerText.trim())
      .filter(Boolean);
    const buttons = doc.querySelectorAll('button').length;
    const forms = doc.querySelectorAll('form').length;
    
    // Extract detailed text sections for structured diffing
    const sections = extractTextSections(html);
    
    return {
      text: text.substring(0, 5000), // First 5000 chars for size efficiency
      linkCount: links.length,
      imageCount: images.length,
      headingCount: headings.length,
      buttonCount: buttons,
      formCount: forms,
      sections: sections, // Store detailed sections for diffing
      timestamp: new Date().toISOString(),
      hash: simpleHash(text)
    };
  };

  // Simple hash function for quick comparison
  const simpleHash = (str) => {
    let hash = 0;
    for (let i = 0; i < Math.min(str.length, 1000); i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  };

  // Calculate similarity between two strings (0-100)
  const calculateSimilarity = (str1, str2) => {
    const len1 = str1.length;
    const len2 = str2.length;
    const maxLen = Math.max(len1, len2);
    if (maxLen === 0) return 100;
    
    // Simple Levenshtein-like check on first 1000 chars
    let matches = 0;
    for (let i = 0; i < Math.min(1000, len1, len2); i++) {
      if (str1[i] === str2[i]) matches++;
    }
    return Math.round((matches / maxLen) * 100);
  };

  // Extract specific text sections (headings, buttons, key content)
  const extractTextSections = (html) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const sections = {
      h1: [],
      h2: [],
      h3: [],
      buttons: [],
      links: []
    };
    
    // Extract headings
    doc.querySelectorAll('h1').forEach(el => {
      const text = el.innerText.trim();
      if (text) sections.h1.push(text);
    });
    
    doc.querySelectorAll('h2').forEach(el => {
      const text = el.innerText.trim();
      if (text) sections.h2.push(text);
    });
    
    doc.querySelectorAll('h3').forEach(el => {
      const text = el.innerText.trim();
      if (text) sections.h3.push(text);
    });
    
    // Extract button text
    doc.querySelectorAll('button').forEach(el => {
      const text = el.innerText.trim();
      if (text) sections.buttons.push(text);
    });
    
    // Extract link text
    doc.querySelectorAll('a').forEach(el => {
      const text = el.innerText.trim();
      const href = el.href;
      if (text) sections.links.push({ text, href });
    });
    
    return sections;
  };

  // Compare text sections and generate structured diffs
  const generateTextDiffs = (oldSections, newSections) => {
    const diffs = [];
    
    if (!oldSections || !newSections) return diffs;
    
    // Compare H1 tags
    if (JSON.stringify(oldSections.h1) !== JSON.stringify(newSections.h1)) {
      for (let i = 0; i < Math.max(oldSections.h1.length, newSections.h1.length); i++) {
        const oldText = oldSections.h1[i] || '(removed)';
        const newText = newSections.h1[i] || '(removed)';
        if (oldText !== newText) {
          diffs.push({
            type: 'h1',
            element: `H1 #${i + 1}`,
            oldValue: oldText,
            newValue: newText,
            severity: 'high'
          });
        }
      }
    }
    
    // Compare H2 tags
    if (JSON.stringify(oldSections.h2) !== JSON.stringify(newSections.h2)) {
      for (let i = 0; i < Math.max(oldSections.h2.length, newSections.h2.length); i++) {
        const oldText = oldSections.h2[i] || '(removed)';
        const newText = newSections.h2[i] || '(removed)';
        if (oldText !== newText) {
          diffs.push({
            type: 'h2',
            element: `H2 #${i + 1}`,
            oldValue: oldText,
            newValue: newText,
            severity: 'medium'
          });
        }
      }
    }
    
    // Compare H3 tags
    if (JSON.stringify(oldSections.h3) !== JSON.stringify(newSections.h3)) {
      for (let i = 0; i < Math.max(oldSections.h3.length, newSections.h3.length); i++) {
        const oldText = oldSections.h3[i] || '(removed)';
        const newText = newSections.h3[i] || '(removed)';
        if (oldText !== newText) {
          diffs.push({
            type: 'h3',
            element: `H3 #${i + 1}`,
            oldValue: oldText,
            newValue: newText,
            severity: 'low'
          });
        }
      }
    }
    
    // Compare button text
    if (JSON.stringify(oldSections.buttons) !== JSON.stringify(newSections.buttons)) {
      const newButtons = new Set(newSections.buttons);
      const oldButtons = new Set(oldSections.buttons);
      
      // Buttons removed
      oldButtons.forEach(btn => {
        if (!newButtons.has(btn)) {
          diffs.push({
            type: 'button_removed',
            element: 'Button',
            oldValue: btn,
            newValue: '(removed)',
            severity: 'medium'
          });
        }
      });
      
      // Buttons added
      newButtons.forEach(btn => {
        if (!oldButtons.has(btn)) {
          diffs.push({
            type: 'button_added',
            element: 'Button',
            oldValue: '(new)',
            newValue: btn,
            severity: 'medium'
          });
        }
      });
    }
    
    // Compare link text
    const oldLinkTexts = oldSections.links.map(l => l.text).sort();
    const newLinkTexts = newSections.links.map(l => l.text).sort();
    if (JSON.stringify(oldLinkTexts) !== JSON.stringify(newLinkTexts)) {
      const newSet = new Set(newLinkTexts);
      const oldSet = new Set(oldLinkTexts);
      
      // Links removed
      oldSet.forEach(link => {
        if (!newSet.has(link)) {
          diffs.push({
            type: 'link_removed',
            element: 'Link',
            oldValue: link,
            newValue: '(removed)',
            severity: 'low'
          });
        }
      });
      
      // Links added
      newSet.forEach(link => {
        if (!oldSet.has(link)) {
          diffs.push({
            type: 'link_added',
            element: 'Link',
            oldValue: '(new)',
            newValue: link,
            severity: 'low'
          });
        }
      });
    }
    
    return diffs;
  };

  // Detect what changed between two snapshots
  const detectChanges = (oldSnapshot, newSnapshot) => {
    if (!oldSnapshot || !newSnapshot) return [];
    
    const changes = [];
    
    // Extract text sections from both snapshots
    let oldSections = oldSnapshot.sections;
    let newSections = newSnapshot.sections;
    
    // If sections aren't available, try to extract from text (fallback)
    if (!oldSections || !newSections) {
      return []; // Need full HTML for detailed diffs
    }
    
    // Generate detailed text diffs
    const textDiffs = generateTextDiffs(oldSections, newSections);
    changes.push(...textDiffs);
    
    // Check text content changes (similarity threshold: 85%)
    const similarity = calculateSimilarity(oldSnapshot.text, newSnapshot.text);
    if (similarity < 85 && textDiffs.length === 0) {
      changes.push({
        type: 'text_content',
        element: 'Page Content',
        severity: 'high',
        summary: `Text content changed (${similarity}% similar)`
      });
    }
    
    // Check major image changes (threshold: >2 images added/removed)
    const imageDiff = Math.abs(newSnapshot.imageCount - oldSnapshot.imageCount);
    if (imageDiff > 2) {
      changes.push({
        type: 'images',
        element: 'Images',
        oldValue: oldSnapshot.imageCount,
        newValue: newSnapshot.imageCount,
        severity: 'medium',
        summary: `Images changed (${oldSnapshot.imageCount} → ${newSnapshot.imageCount})`
      });
    } else if (imageDiff > 0) {
      changes.push({
        type: 'images',
        element: 'Images',
        oldValue: oldSnapshot.imageCount,
        newValue: newSnapshot.imageCount,
        severity: 'low',
        summary: `${imageDiff} image(s) ${newSnapshot.imageCount > oldSnapshot.imageCount ? 'added' : 'removed'}`
      });
    }
    
    // Check major link changes (threshold: >3 links added/removed)
    const linkDiff = Math.abs(newSnapshot.linkCount - oldSnapshot.linkCount);
    if (linkDiff > 3) {
      changes.push({
        type: 'link_count',
        element: 'Navigation Links',
        oldValue: oldSnapshot.linkCount,
        newValue: newSnapshot.linkCount,
        severity: 'medium',
        summary: `Links changed (${oldSnapshot.linkCount} → ${newSnapshot.linkCount})`
      });
    }
    
    // Check heading changes (section structure)
    const headingDiff = Math.abs(newSnapshot.headingCount - oldSnapshot.headingCount);
    if (headingDiff > 1) {
      changes.push({
        type: 'heading_count',
        element: 'Headings',
        oldValue: oldSnapshot.headingCount,
        newValue: newSnapshot.headingCount,
        severity: 'low',
        summary: `Headings changed (${oldSnapshot.headingCount} → ${newSnapshot.headingCount})`
      });
    }
    
    // Check button/form changes (interactive elements)
    const buttonDiff = Math.abs(newSnapshot.buttonCount - oldSnapshot.buttonCount);
    const formDiff = Math.abs(newSnapshot.formCount - oldSnapshot.formCount);
    if (formDiff > 0) {
      changes.push({
        type: 'forms',
        element: 'Forms',
        oldValue: oldSnapshot.formCount,
        newValue: newSnapshot.formCount,
        severity: 'high',
        summary: `⚠️ Forms changed (${oldSnapshot.formCount} → ${newSnapshot.formCount})`
      });
    }
    if (buttonDiff > 2) {
      changes.push({
        type: 'button_count',
        element: 'Buttons',
        oldValue: oldSnapshot.buttonCount,
        newValue: newSnapshot.buttonCount,
        severity: 'medium',
        summary: `${buttonDiff} buttons ${newSnapshot.buttonCount > oldSnapshot.buttonCount ? 'added' : 'removed'}`
      });
    }
    
    return changes;
  };

  // Check a single competitor site
  const checkSite = async (competitor) => {
    setChecking(competitor.id);
    try {
      // Fetch the full HTML content via proxy to bypass CORS
      const proxyResponse = await fetch('http://localhost:3001/api/fetch-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: competitor.url })
      });
      
      if (!proxyResponse.ok) {
        throw new Error(`Proxy error: ${proxyResponse.statusText}`);
      }
      
      const data = await proxyResponse.json();
      const html = data.content;
      const now = new Date().toISOString();
      const status = data.success ? 'alive' : 'down';
      
      // Extract content snapshot
      const newSnapshot = extractPageContent(html);
      
      // Detect changes if we have a previous snapshot
      let changes = [];
      let contentChanged = false;
      if (competitor.lastSnapshot && alertSettings.alertOnContentChange) {
        changes = detectChanges(competitor.lastSnapshot, newSnapshot);
        contentChanged = changes.length > 0;
      }
      
      // Update competitor with new check time and snapshot
      const updated = competitors.map(c => {
        if (c.id === competitor.id) {
          const changeHistory = c.changes || [];
          if (contentChanged) {
            changeHistory.push({
              timestamp: now,
              changes,
              snapshot: newSnapshot
            });
          }
          
          return {
            ...c,
            lastChecked: now,
            status,
            lastSnapshot: newSnapshot,
            changes: changeHistory.slice(-20), // Keep last 20 changes
            contentChanged
          };
        }
        return c;
      });
      
      saveCompetitors(updated);
    } catch (error) {
      // Site is down or unreachable
      const now = new Date().toISOString();
      let errorMsg = error.message;
      
      // Improve error messaging for CORS and common issues
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorMsg = 'CORS/Network blocked - try from backend service';
      } else if (error.message.includes('TypeError')) {
        errorMsg = 'Connection failed';
      }
      
      const updated = competitors.map(c => {
        if (c.id === competitor.id) {
          return {
            ...c,
            lastChecked: now,
            status: 'down',
            error: errorMsg
          };
        }
        return c;
      });
      saveCompetitors(updated);
    }
    setChecking(null);
  };

  // Check all competitors
  const checkAll = async () => {
    setLoading(true);
    for (const comp of competitors) {
      await checkSite(comp);
    }
    const now = new Date().toISOString();
    setLastCheckAll(now);
    localStorage.setItem('site-spy-last-check-all', now);
    setLoading(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'alive': return '✅';
      case 'down': return '❌';
      default: return '⏳';
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return 'Never';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  // Generate comprehensive changelog entries from all competitors
  const generateChangelogEntries = () => {
    const entries = [];
    
    competitors.forEach((comp) => {
      if (comp.changes && Array.isArray(comp.changes)) {
        comp.changes.forEach((changeEntry) => {
          if (changeEntry.changes && Array.isArray(changeEntry.changes)) {
            changeEntry.changes.forEach((diff) => {
              // Calculate similarity if we have old and new snapshots
              let similarity = 100;
              if (comp.lastSnapshot && changeEntry.snapshot) {
                similarity = calculateSimilarity(changeEntry.snapshot.text || '', comp.lastSnapshot.text || '');
              }
              
              entries.push({
                timestamp: changeEntry.timestamp,
                competitorId: comp.id,
                competitorName: comp.name,
                competitorUrl: comp.domain,
                fullUrl: comp.url,
                diff: diff,
                severity: diff.severity || 'low',
                similarity: similarity,
                changeDetail: diff.oldValue && diff.newValue 
                  ? `${diff.element} changed from "${String(diff.oldValue).substring(0, 50)}..." to "${String(diff.newValue).substring(0, 50)}..."`
                  : diff.summary || `${diff.element} ${diff.type}`
              });
            });
          }
        });
      }
    });
    
    // Sort by timestamp (newest first)
    entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return entries;
  };

  // Filter changelog entries by severity
  const getFilteredChangelogEntries = () => {
    const allEntries = generateChangelogEntries();
    if (changelogFilter === 'all') return allEntries;
    return allEntries.filter(entry => entry.severity === changelogFilter);
  };

  // Format file size in bytes to readable format
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // Capture screenshot of a competitor URL
  const captureScreenshot = async (competitor) => {
    setCapturingScreenshot(competitor.id);
    try {
      const response = await fetch('/api/screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: competitor.url })
      });

      if (!response.ok) {
        throw new Error(`Screenshot API error: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to capture screenshot');
      }

      // Update competitor with screenshot history
      const now = new Date().toISOString();
      const updated = competitors.map(c => {
        if (c.id === competitor.id) {
          const screenshotHistory = c.screenshots || [];
          
          // Keep only last 3 screenshots to save localStorage space
          screenshotHistory.push({
            timestamp: now,
            screenshot: data.screenshot,
            size: data.size,
            width: data.width,
            height: data.height
          });
          
          if (screenshotHistory.length > 3) {
            screenshotHistory.shift();
          }

          return {
            ...c,
            screenshots: screenshotHistory,
            lastScreenshot: now
          };
        }
        return c;
      });

      saveCompetitors(updated);
    } catch (error) {
      console.error('Screenshot capture error:', error);
      alert(`Failed to capture screenshot: ${error.message}`);
    }
    setCapturingScreenshot(null);
  };

  // Download screenshot as PNG file
  const downloadScreenshot = (screenshot, competitorName) => {
    const link = document.createElement('a');
    link.href = screenshot;
    link.download = `${competitorName}-screenshot-${new Date().toISOString().split('T')[0]}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate visual differences between two screenshots (simple comparison)
  const compareScreenshots = (old, newImg) => {
    if (!old || !newImg) return null;
    
    return {
      oldTimestamp: old.timestamp,
      newTimestamp: newImg.timestamp,
      timeDiff: new Date(newImg.timestamp) - new Date(old.timestamp)
    };
  };

  // Upgrade Modal Component
  const UpgradeModal = () => {
    if (!showUpgradeModal) return null;
    
    return (
      <div className="modal-overlay" onClick={() => setShowUpgradeModal(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={() => setShowUpgradeModal(false)}>×</button>
          
          <div className="modal-header">
            <h2>🚀 Unlock More Tracking Slots</h2>
            <p>You've reached your 1-site free limit</p>
          </div>

          <div className="modal-body">
            <div className="current-plan">
              <div className="plan-badge">Your Current Plan</div>
              <div className="plan-card current">
                <h3>Free Plan</h3>
                <div className="plan-limit">
                  <span className="limit-number">{siteLimit}</span>
                  <span className="limit-label">Site</span>
                </div>
                <p className="plan-desc">Perfect for getting started</p>
              </div>
            </div>

            <div className="upgrade-options">
              <div className="upgrade-option">
                <div className="option-header">
                  <h3>Upgrade to Basic</h3>
                  <span className="price">$9.99</span>
                </div>
                <div className="option-features">
                  <p>✅ <strong>5 additional tracking slots</strong> (6 total)</p>
                  <p>✅ Perfect for small businesses</p>
                  <p>✅ Track your main competitors</p>
                </div>
                <button 
                  className="upgrade-btn"
                  onClick={() => handleUpgrade('basic')}
                >
                  Unlock Basic ($9.99)
                </button>
              </div>

              <div className="upgrade-option">
                <div className="option-header">
                  <h3>Add More Slots</h3>
                  <span className="price">$5 each</span>
                </div>
                <div className="option-features">
                  <p>✅ 5 additional slots per purchase</p>
                  <p>✅ Buy as many as you need</p>
                  <p className="info-text">Available after Basic upgrade</p>
                </div>
                <button 
                  className="upgrade-btn secondary"
                  onClick={() => handleUpgrade('pro')}
                  disabled={purchaseTier === 'free'}
                  title={purchaseTier === 'free' ? 'Upgrade to Basic first' : ''}
                >
                  Add 5 Slots ($5)
                </button>
              </div>
            </div>

            <div className="modal-footer">
              <p className="footer-note">
                💳 Payments are processed securely. This is a demo—no charges yet.
              </p>
              <button 
                className="continue-free-btn"
                onClick={() => setShowUpgradeModal(false)}
              >
                Continue with 1 site
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="app">
      <UpgradeModal />
      
      <header>
        <h1>🕵️ Site Spy</h1>
        <p>Track your local competitors</p>
      </header>

      <main>
        <section className="add-competitor">
          <div className="add-competitor-header">
            <h2>Add Competitor</h2>
            <div className="site-counter">
              <span className="counter-number">{competitors.length}/{siteLimit}</span>
              <div className="counter-bar">
                <div 
                  className={`counter-fill ${competitors.length >= siteLimit ? 'full' : ''}`}
                  style={{ width: `${(competitors.length / siteLimit) * 100}%` }}
                ></div>
              </div>
              {competitors.length >= siteLimit && (
                <span className="counter-limit-reached">Limit reached</span>
              )}
            </div>
          </div>
          <div className="input-group">
            <input
              type="text"
              placeholder="Enter website URL..."
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCompetitor()}
              placeholder={competitors.length >= siteLimit ? 'Upgrade to add more sites' : 'Enter website URL...'}
            />
            <button 
              onClick={addCompetitor}
              title={competitors.length >= siteLimit ? 'Click to upgrade' : ''}
            >
              {competitors.length >= siteLimit ? '🔓 Upgrade to Add More' : 'Add'}
            </button>
          </div>
          <p className="info-text">💡 Note: Content tracking works best when deployed on a backend server (CORS may block browser requests)</p>
        </section>

        <section className="check-all">
          <button 
            className="check-all-btn" 
            onClick={checkAll} 
            disabled={loading || competitors.length === 0}
          >
            {loading ? '🔄 Checking...' : '🔍 Check All Sites'}
          </button>
          <button 
            className="settings-btn"
            onClick={() => setShowSettings(!showSettings)}
            title="Alert Settings"
          >
            ⚙️
          </button>
          {lastCheckAll && (
            <span className="last-check">Last check: {formatTime(lastCheckAll)}</span>
          )}
        </section>

        {showSettings && (
          <section className="alert-settings">
            <h2>⚙️ Alert Settings</h2>
            
            <div className="setting-group">
              <label>Check Interval:</label>
              <select 
                value={alertSettings.checkInterval}
                onChange={(e) => updateSetting('checkInterval', parseInt(e.target.value))}
              >
                <option value={15}>Every 15 minutes</option>
                <option value={30}>Every 30 minutes</option>
                <option value={60}>Every hour</option>
                <option value={240}>Every 4 hours</option>
                <option value={1440}>Daily</option>
                <option value={10080}>Weekly</option>
              </select>
            </div>

            <div className="setting-group">
              <label>Notification Channels:</label>
              
              <input 
                type="email" 
                placeholder="your@email.com"
                value={alertSettings.notifyEmail}
                onChange={(e) => updateSetting('notifyEmail', e.target.value)}
                className="notify-input"
              />
              <input 
                type="tel" 
                placeholder="+1234567890 (SMS)"
                value={alertSettings.notifySms}
                onChange={(e) => updateSetting('notifySms', e.target.value)}
                className="notify-input"
              />
              <input 
                type="url" 
                placeholder="https://your-webhook-url.com"
                value={alertSettings.notifyWebhook}
                onChange={(e) => updateSetting('notifyWebhook', e.target.value)}
                className="notify-input"
              />
            </div>

            <div className="setting-group">
              <label>Notify Me When:</label>
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={alertSettings.alertOnDown}
                    onChange={(e) => updateSetting('alertOnDown', e.target.checked)}
                  />
                  Site goes down
                </label>
              </div>

              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={alertSettings.alertOnRecover}
                    onChange={(e) => updateSetting('alertOnRecover', e.target.checked)}
                  />
                  Site comes back up
                </label>
              </div>

              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={alertSettings.alertOnContentChange}
                    onChange={(e) => updateSetting('alertOnContentChange', e.target.checked)}
                  />
                  Content changes
                </label>
              </div>
            </div>

            <div className="settings-summary">
              <p><strong>Current:</strong> {getSettingsSummary()}</p>
              {settingsSaved && <p className="saved-msg">✅ Settings saved!</p>}
            </div>

            <button className="close-settings" onClick={() => setShowSettings(false)}>Done</button>
          </section>
        )}

        {!showSettings && (
          <div className="settings-summary-collapsed">
            <span>📋 {getSettingsSummary()}</span>
          </div>
        )}

        <section className="competitors-list">
          <div className="competitors-header">
            <h2>Your Competitors ({competitors.length}/{siteLimit})</h2>
            {purchaseTier !== 'free' && (
              <span className="tier-badge" title="Current purchase tier">
                ⭐ {purchaseTier === 'basic' ? 'Basic' : 'Pro'} Plan
              </span>
            )}
          </div>
          {competitors.length === 0 ? (
            <p className="empty">No competitors yet. Add one above!</p>
          ) : (
            <ul>
              {competitors.map((comp) => (
                <div key={comp.id}>
                  <li className="competitor-card">
                    <div className="comp-info">
                      <h3>
                        {getStatusIcon(comp.status)} {comp.name}
                        {comp.contentChanged && <span className="change-indicator">📝</span>}
                      </h3>
                      <a href={comp.url} target="_blank" rel="noopener">{comp.domain}</a>
                      <p className="meta">
                        <span className="status-badge" data-status={comp.status || 'pending'}>{comp.status || 'pending'}</span>
                        <span>Checked: {formatTime(comp.lastChecked)}</span>
                        {comp.changes && comp.changes.length > 0 && (
                          <span className="changes-count">Changes: {comp.changes.length}</span>
                        )}
                      </p>
                    </div>
                    <div className="comp-actions">
                      <button 
                        className="check" 
                        onClick={() => checkSite(comp)}
                        disabled={checking === comp.id}
                      >
                        {checking === comp.id ? '...' : 'Check'}
                      </button>
                      <button 
                        className="screenshot-btn" 
                        onClick={() => captureScreenshot(comp)}
                        disabled={capturingScreenshot === comp.id}
                        title="Capture screenshot"
                      >
                        {capturingScreenshot === comp.id ? '⏳' : '📸'}
                      </button>
                      {comp.changes && comp.changes.length > 0 && (
                        <button 
                          className="show-changes"
                          onClick={() => setExpandedChanges(expandedChanges === comp.id ? null : comp.id)}
                        >
                          {expandedChanges === comp.id ? '▼' : '▶'} {comp.changes.length}
                        </button>
                      )}
                      {comp.screenshots && comp.screenshots.length > 0 && (
                        <button 
                          className="show-screenshots"
                          onClick={() => setExpandedScreenshots(expandedScreenshots === comp.id ? null : comp.id)}
                          title="Show screenshots"
                        >
                          {expandedScreenshots === comp.id ? '▼' : '▶'} {comp.screenshots.length}
                        </button>
                      )}
                      <button className="remove" onClick={() => removeCompetitor(comp.id)}>×</button>
                    </div>
                  </li>
                  
                  {/* Changes History Panel */}
                  {expandedChanges === comp.id && comp.changes && comp.changes.length > 0 && (
                    <div className="changes-panel">
                      <h4>📋 Change History</h4>
                      <div className="changes-timeline">
                        {comp.changes.map((change, idx) => (
                          <div key={idx} className="change-entry">
                            <div className="change-time-header">
                              <span className="change-time">
                                {formatTime(change.timestamp)}
                              </span>
                              <button 
                                className="expand-detail-btn"
                                onClick={() => setExpandedChangeDetail(expandedChangeDetail === `${comp.id}-${idx}` ? null : `${comp.id}-${idx}`)}
                              >
                                {expandedChangeDetail === `${comp.id}-${idx}` ? '▼' : '▶'} View Details
                              </button>
                            </div>
                            
                            <div className="change-summary">
                              <span className="change-count">
                                {Array.isArray(change.changes) ? change.changes.length : 0} change{Array.isArray(change.changes) ? (change.changes.length !== 1 ? 's' : '') : 's'}
                              </span>
                              <span className="change-preview">
                                {Array.isArray(change.changes) && change.changes.length > 0
                                  ? (change.changes[0].summary || change.changes[0].element || change.changes[0])
                                  : 'No changes recorded'}
                              </span>
                            </div>
                            
                            {/* Expanded detail view */}
                            {expandedChangeDetail === `${comp.id}-${idx}` && (
                              <div className="expanded-details-view">
                                {Array.isArray(change.changes) && change.changes.length > 0 ? (
                                  change.changes.map((diff, diffIdx) => (
                                    <DiffViewer key={diffIdx} diff={diff} />
                                  ))
                                ) : (
                                  <p className="no-diffs">No detailed changes recorded</p>
                                )}
                                
                                {change.snapshot && (
                                  <details className="snapshot-details">
                                    <summary>View snapshot metrics</summary>
                                    <div className="snapshot-info">
                                      <p><strong>Links:</strong> {change.snapshot.linkCount}</p>
                                      <p><strong>Images:</strong> {change.snapshot.imageCount}</p>
                                      <p><strong>Headings:</strong> {change.snapshot.headingCount}</p>
                                      <p><strong>Buttons:</strong> {change.snapshot.buttonCount}</p>
                                      <p><strong>Forms:</strong> {change.snapshot.formCount}</p>
                                      <p className="hash-display"><strong>Hash:</strong> {change.snapshot.hash.substring(0, 8)}...</p>
                                    </div>
                                  </details>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Screenshots Panel */}
                  {expandedScreenshots === comp.id && comp.screenshots && comp.screenshots.length > 0 && (
                    <div className="screenshots-panel">
                      <h4>📸 Screenshot History</h4>
                      <div className="screenshots-container">
                        {comp.screenshots.length > 1 && (
                          <div className="screenshots-comparison">
                            <h5>Visual Comparison (Slider)</h5>
                            <div className="comparison-slider">
                              <img src={comp.screenshots[0].screenshot} alt="Previous" className="comparison-img before" />
                              <img src={comp.screenshots[comp.screenshots.length - 1].screenshot} alt="Current" className="comparison-img after" />
                              <div className="slider-divider" draggable="true">
                                <span className="slider-handle">⟨ ⟩</span>
                              </div>
                            </div>
                            <p className="comparison-info">
                              Before: {formatTime(comp.screenshots[0].timestamp)} | 
                              After: {formatTime(comp.screenshots[comp.screenshots.length - 1].timestamp)}
                            </p>
                          </div>
                        )}
                        
                        <h5>Screenshot Gallery</h5>
                        <div className="screenshot-gallery">
                          {comp.screenshots.map((screenshot, sIdx) => (
                            <div key={sIdx} className="screenshot-item">
                              <img src={screenshot.screenshot} alt={`Screenshot ${sIdx + 1}`} className="screenshot-thumb" />
                              <div className="screenshot-meta">
                                <span className="screenshot-time">{formatTime(screenshot.timestamp)}</span>
                                <span className="screenshot-size">{formatFileSize(screenshot.size)}</span>
                                <span className="screenshot-res">{screenshot.width}×{screenshot.height}</span>
                              </div>
                              <div className="screenshot-actions">
                                <button 
                                  className="screenshot-download"
                                  onClick={() => downloadScreenshot(screenshot.screenshot, comp.name)}
                                  title="Download screenshot"
                                >
                                  ⬇️
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </ul>
          )}
        </section>

        {/* Changelog Panel */}
        <section className="changelog-section">
          <button 
            className="changelog-toggle"
            onClick={() => setShowChangelog(!showChangelog)}
          >
            {showChangelog ? '▼' : '▶'} 📋 Activity Log ({generateChangelogEntries().length} changes)
          </button>
          
          {showChangelog && (
            <div className="changelog-panel">
              <div className="changelog-header">
                <h3>📊 Comprehensive Change Log</h3>
                <p className="changelog-description">All detected changes across all competitors and check times</p>
                
                <div className="changelog-filters">
                  <label>Filter by Severity:</label>
                  <select 
                    value={changelogFilter}
                    onChange={(e) => setChangelogFilter(e.target.value)}
                    className="changelog-filter-select"
                  >
                    <option value="all">All Changes ({generateChangelogEntries().length})</option>
                    <option value="high">🔴 High Priority ({generateChangelogEntries().filter(e => e.severity === 'high').length})</option>
                    <option value="medium">🟠 Medium Priority ({generateChangelogEntries().filter(e => e.severity === 'medium').length})</option>
                    <option value="low">🔵 Low Priority ({generateChangelogEntries().filter(e => e.severity === 'low').length})</option>
                  </select>
                </div>
              </div>

              <div className="changelog-content">
                {getFilteredChangelogEntries().length > 0 ? (
                  <div className="changelog-entries">
                    {getFilteredChangelogEntries().map((entry, idx) => (
                      <div key={idx} className="changelog-entry">
                        <div className="changelog-entry-header">
                          <span className="changelog-time">
                            {formatTime(entry.timestamp)}
                          </span>
                          <span className="changelog-competitor">
                            {entry.competitorName}
                          </span>
                          <span className="changelog-severity" data-severity={entry.severity}>
                            {entry.severity === 'high' ? '🔴' : entry.severity === 'medium' ? '🟠' : '🔵'} {entry.severity.toUpperCase()}
                          </span>
                          <span className="changelog-similarity">
                            {entry.similarity}% match
                          </span>
                        </div>
                        
                        <div className="changelog-entry-body">
                          <div className="changelog-url">
                            <strong>URL:</strong> <code>{entry.competitorUrl}</code>
                          </div>
                          <div className="changelog-change">
                            <strong>Change:</strong> <span className="change-detail">{entry.changeDetail}</span>
                          </div>
                          {entry.diff.oldValue !== undefined && entry.diff.newValue !== undefined && (
                            <div className="changelog-values">
                              <span className="old-val">Old: <code>{String(entry.diff.oldValue).substring(0, 100)}</code></span>
                              <span className="new-val">New: <code>{String(entry.diff.newValue).substring(0, 100)}</code></span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="changelog-empty">
                    <p>No changes recorded yet. Start checking competitor sites to build the activity log.</p>
                  </div>
                )}
              </div>

              <div className="changelog-footer">
                <button 
                  className="changelog-export"
                  onClick={() => {
                    const entries = getFilteredChangelogEntries();
                    const csv = [
                      ['Timestamp', 'Competitor', 'URL', 'Change Detail', 'Severity', 'Similarity %'].join(','),
                      ...entries.map(e => [
                        new Date(e.timestamp).toLocaleString(),
                        e.competitorName,
                        e.competitorUrl,
                        `"${e.changeDetail}"`,
                        e.severity,
                        e.similarity
                      ].join(','))
                    ].join('\n');
                    
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `site-spy-changelog-${new Date().toISOString().split('T')[0]}.csv`;
                    a.click();
                  }}
                >
                  📥 Export as CSV
                </button>
                <span className="changelog-info">
                  Showing {getFilteredChangelogEntries().length} of {generateChangelogEntries().length} changes
                </span>
              </div>
            </div>
          )}
        </section>
      </main>

      <style>{`
        /* MOBILE-FIRST RESET */
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          background: #f5f5f5; color: #333; font-size: 16px;
        }
        .app { min-height: 100vh; }
        
        /* HEADER - MOBILE FIRST */
        header { 
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); 
          color: white; padding: 20px 16px; text-align: center; 
          box-shadow: 0 4px 12px rgba(0,0,0,0.15); 
        }
        header h1 { 
          font-size: 24px; margin-bottom: 6px; font-weight: 700; line-height: 1.2;
        }
        header p { 
          color: #aaa; font-size: 14px; margin: 0;
        }
        
        /* MAIN - MOBILE FIRST */
        main { 
          padding: 16px; max-width: 600px; margin: 0 auto; 
          padding-bottom: 60px; min-height: 100vh;
        }
        section { margin-bottom: 24px; }
        h2 { 
          font-size: 18px; margin-bottom: 16px; color: #333; 
          font-weight: 600; line-height: 1.3;
        }
        
        /* MODAL STYLES - MOBILE FIRST */
        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.6); display: flex; align-items: flex-end;
          justify-content: center; z-index: 2000; animation: fadeIn 0.3s ease;
          backdrop-filter: blur(4px);
        }
        
        .modal-content {
          background: white; border-radius: 20px 20px 0 0; 
          box-shadow: 0 -20px 60px rgba(0,0,0,0.3);
          max-width: 500px; width: 100%; max-height: 90vh; overflow-y: auto;
          animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
        }
        
        .modal-close {
          position: absolute; top: 16px; right: 16px;
          background: #f0f0f0; border: none; border-radius: 50%;
          width: 40px; height: 40px; font-size: 28px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.2s; min-height: 48px; min-width: 48px;
          z-index: 2001;
        }
        
        .modal-close:hover { background: #e0e0e0; }
        
        .modal-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white; padding: 24px 16px 20px; text-align: center;
          border-radius: 20px 20px 0 0;
        }
        
        .modal-header h2 {
          font-size: 22px; margin: 0 0 8px 0; font-weight: 700;
          color: white; line-height: 1.3;
        }
        
        .modal-header p {
          margin: 0; font-size: 14px; color: rgba(255, 255, 255, 0.9);
          opacity: 0.95; line-height: 1.4;
        }
        
        .modal-body { padding: 20px 16px; }
        
        .current-plan {
          margin-bottom: 24px; text-align: center;
        }
        
        .plan-badge {
          display: inline-block; background: #f0f0f0;
          padding: 8px 14px; border-radius: 20px; font-size: 12px;
          font-weight: 600; color: #666; text-transform: uppercase;
          letter-spacing: 0.5px; margin-bottom: 12px;
        }
        
        .plan-card {
          background: linear-gradient(135deg, #f5f7fa 0%, #e9ecf1 100%);
          border: 2px solid #e0e6f0; border-radius: 12px; padding: 18px 16px;
          margin-bottom: 20px;
        }
        
        .plan-card.current {
          border: 2px solid #667eea; background: linear-gradient(135deg, #f0f4ff 0%, #e8edff 100%);
        }
        
        .plan-card h3 {
          font-size: 17px; margin: 0 0 14px 0; font-weight: 600;
          color: #333; line-height: 1.3;
        }
        
        .plan-limit {
          display: flex; align-items: baseline; justify-content: center;
          gap: 12px; margin: 14px 0;
        }
        
        .limit-number {
          font-size: 32px; font-weight: 700; color: #667eea;
        }
        
        .limit-label {
          font-size: 15px; color: #666; font-weight: 500;
        }
        
        .plan-desc {
          font-size: 14px; color: #888; margin: 12px 0 0 0; line-height: 1.4;
        }
        
        .upgrade-options {
          display: flex; flex-direction: column; gap: 14px;
          margin-bottom: 20px;
        }
        
        .upgrade-option {
          border: 2px solid #e0e0e0; border-radius: 12px; padding: 16px;
          transition: all 0.3s ease;
          background: white;
        }
        
        .upgrade-option:hover {
          border-color: #667eea; background: #f8faff;
          box-shadow: 0 8px 16px rgba(102, 126, 234, 0.1);
        }
        
        .option-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          margin-bottom: 12px; gap: 12px;
        }
        
        .option-header h3 {
          font-size: 17px; margin: 0; font-weight: 600; color: #333;
          line-height: 1.3;
        }
        
        .price {
          font-size: 20px; font-weight: 700; color: #667eea; white-space: nowrap;
        }
        
        .option-features {
          margin-bottom: 16px; font-size: 14px; color: #555;
          line-height: 1.6;
        }
        
        .option-features p {
          margin: 8px 0;
        }
        
        .option-features .info-text {
          color: #999; font-size: 13px; font-style: italic;
        }
        
        .upgrade-btn {
          width: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white; border: none; border-radius: 10px; 
          padding: 14px 16px; min-height: 48px;
          font-weight: 600; font-size: 15px; cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .upgrade-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
        }
        
        .upgrade-btn:disabled {
          opacity: 0.5; cursor: not-allowed; background: #ccc;
        }
        
        .upgrade-btn.secondary {
          background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
        }
        
        .modal-footer {
          padding: 20px 16px; background: #f9f9f9; border-top: 1px solid #e0e0e0;
          border-radius: 0 0 20px 20px;
        }
        
        .footer-note {
          font-size: 13px; color: #999; margin-bottom: 14px;
          text-align: center; font-style: italic; line-height: 1.4;
        }
        
        .continue-free-btn {
          width: 100%; background: #f0f0f0; color: #666;
          border: none; border-radius: 10px; 
          padding: 14px 16px; min-height: 48px;
          font-weight: 600; font-size: 15px; cursor: pointer;
          transition: all 0.2s;
        }
        
        .continue-free-btn:hover {
          background: #e0e0e0;
        }
        
        /* SITE COUNTER - MOBILE FIRST */
        .add-competitor-header {
          display: flex; flex-direction: column; gap: 12px; 
          margin-bottom: 16px;
        }
        
        .site-counter {
          width: 100%;
        }
        
        .counter-number {
          display: block; font-size: 13px; font-weight: 600; color: #666;
          text-align: left; margin-bottom: 8px; font-variant-numeric: tabular-nums;
        }
        
        .counter-bar {
          height: 8px; background: #e0e0e0; border-radius: 4px;
          overflow: hidden; margin-bottom: 8px;
        }
        
        .counter-fill {
          height: 100%; background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          border-radius: 4px; transition: width 0.3s ease;
        }
        
        .counter-fill.full {
          background: linear-gradient(90deg, #ff6b6b 0%, #ee5a6f 100%);
          animation: pulse-red 1.5s infinite;
        }
        
        .counter-limit-reached {
          display: block; font-size: 12px; color: #ff6b6b; font-weight: 600;
          text-align: left; text-transform: uppercase; letter-spacing: 0.5px;
          animation: pulse-text 1.5s infinite;
        }
        
        @keyframes pulse-red {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        @keyframes pulse-text {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        
        .competitors-header {
          display: flex; flex-direction: column; gap: 12px;
          margin-bottom: 16px;
        }
        
        .tier-badge {
          display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white; padding: 8px 14px; border-radius: 20px;
          font-size: 12px; font-weight: 600; text-transform: uppercase;
          letter-spacing: 0.5px; white-space: nowrap;
          animation: gradientShift 3s ease infinite; text-align: center;
        }
        
        @keyframes gradientShift {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        
        /* INPUT GROUP - MOBILE FIRST */
        .input-group { 
          display: flex; flex-direction: column; gap: 12px; 
          margin-bottom: 12px;
        }
        .info-text { 
          font-size: 13px; color: #666; margin-top: 8px; 
          font-style: italic; line-height: 1.4;
        }
        input { 
          width: 100%; padding: 14px 16px; border: 1px solid #ddd; 
          border-radius: 10px; font-size: 16px;
          transition: border-color 0.2s, box-shadow 0.2s;
          min-height: 48px; -webkit-appearance: none; appearance: none;
        }
        input:focus { 
          outline: none; border-color: #4a90d9; 
          box-shadow: 0 0 0 3px rgba(74, 144, 217, 0.1); 
        }
        
        /* BUTTONS - MOBILE FIRST (FULL-WIDTH) */
        button { 
          padding: 14px 16px; background: #1a1a2e; color: white; 
          border: none; border-radius: 10px; 
          font-size: 16px; cursor: pointer; font-weight: 600;
          min-height: 48px; min-width: 48px; display: flex;
          align-items: center; justify-content: center;
          transition: all 0.2s ease; width: 100%;
        }
        button:hover:not(:disabled) { 
          background: #252a4a; transform: translateY(-2px); 
          box-shadow: 0 4px 12px rgba(26, 26, 46, 0.2); 
        }
        button:active:not(:disabled) { transform: translateY(0); }
        button:disabled { opacity: 0.5; cursor: not-allowed; }
        
        .empty { color: #888; text-align: center; padding: 40px 20px; background: white; border-radius: 12px; }
        
        /* CHECK ALL SECTION - MOBILE FIRST */
        .check-all { 
          display: flex; flex-direction: column; gap: 12px; 
          margin-bottom: 20px;
        }
        .check-all-btn { 
          background: linear-gradient(135deg, #4a90d9, #2e5fa3); 
          width: 100%; box-shadow: 0 2px 8px rgba(74, 144, 217, 0.2); 
          padding: 14px 16px; min-height: 48px; font-size: 16px;
        }
        .check-all-btn:hover:not(:disabled) { 
          box-shadow: 0 4px 16px rgba(74, 144, 217, 0.3); 
        }
        .settings-btn { 
          background: #666; width: 100%; padding: 14px 16px; 
          min-height: 48px; font-size: 16px;
        }
        .settings-btn:hover { background: #555; }
        .last-check { 
          color: #888; font-size: 13px; white-space: normal; 
          text-align: center; line-height: 1.4;
        }
        
        /* COMPETITOR LIST - MOBILE FIRST */
        ul { list-style: none; }
        .competitor-card { 
          background: white; padding: 16px; border-radius: 12px; 
          margin-bottom: 12px; display: flex; flex-direction: column; 
          gap: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.08);
          border-left: 4px solid #4a90d9;
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .competitor-card:hover { 
          box-shadow: 0 4px 12px rgba(0,0,0,0.12); 
          transform: translateY(-1px);
        }
        .comp-info { flex: 1; }
        .comp-info h3 { 
          font-size: 18px; margin-bottom: 8px; font-weight: 600; 
          line-height: 1.3;
        }
        .comp-info a { 
          color: #0066cc; font-size: 14px; text-decoration: none; 
          font-weight: 500; line-height: 1.4; word-break: break-all;
        }
        .comp-info a:hover { text-decoration: underline; }
        .comp-info .meta { 
          display: flex; gap: 12px; margin-top: 12px; font-size: 13px; 
          color: #888; flex-wrap: wrap; align-items: center; line-height: 1.4;
        }
        .change-indicator { 
          margin-left: 6px; font-size: 16px; animation: pulse 1.5s infinite; 
        }
        .changes-count { 
          background: #fff3cd; color: #856404; padding: 4px 10px; 
          border-radius: 12px; font-weight: 600; font-size: 13px;
        }
        .status-badge { 
          display: inline-block; padding: 6px 12px; border-radius: 20px; 
          text-transform: capitalize; font-weight: 600; font-size: 12px;
        }
        .status-badge[data-status="alive"] { background: #e8f5e9; color: #2e7d32; }
        .status-badge[data-status="down"] { background: #ffebee; color: #c62828; }
        .status-badge[data-status="pending"] { background: #fff3e0; color: #f57c00; }
        
        /* ACTION BUTTONS - MOBILE FIRST (FULL-WIDTH STACK) */
        .comp-actions { 
          display: grid; grid-template-columns: 1fr 1fr; gap: 8px; 
          width: 100%;
        }
        .comp-actions .check { 
          background: #4a90d9; padding: 12px 10px; font-size: 14px; 
          font-weight: 600; border-radius: 8px; min-height: 44px; width: 100%;
        }
        .comp-actions .check:hover:not(:disabled) { background: #2e5fa3; }
        .comp-actions .screenshot-btn {
          background: #8b6aff; padding: 12px 10px; font-size: 14px;
          font-weight: 600; border-radius: 8px; min-height: 44px; width: 100%;
        }
        .comp-actions .screenshot-btn:hover { background: #7055e8; }
        .comp-actions .show-changes {
          background: #ffa500; padding: 12px 10px; font-size: 14px; 
          font-weight: 600; border-radius: 8px; min-height: 44px; 
          width: 100%; white-space: nowrap;
        }
        .comp-actions .show-changes:hover { background: #ff8c00; }
        .comp-actions .show-screenshots {
          background: #16a34a; padding: 12px 10px; font-size: 14px;
          font-weight: 600; border-radius: 8px; min-height: 44px; width: 100%;
        }
        .comp-actions .show-screenshots:hover { background: #15803d; }
        .comp-actions .remove { 
          background: #ff4444; padding: 12px 10px; font-size: 14px; 
          border-radius: 8px; min-height: 44px; width: 100%; font-weight: 600;
          grid-column: 1 / -1;
        }
        .comp-actions .remove:hover:not(:disabled) { background: #cc0000; }
        
        /* CHANGES PANEL - MOBILE FIRST */
        .changes-panel {
          background: #fffaf0; border-radius: 0 0 12px 12px; 
          border: 1px solid #ffd699; border-top: none;
          padding: 16px; margin-bottom: 12px; margin-top: -4px; 
          border-left: 4px solid #ffa500;
        }
        .changes-panel h4 { 
          margin-bottom: 14px; color: #ff7f00; font-size: 16px; 
          font-weight: 600; line-height: 1.3;
        }
        .changes-timeline { display: flex; flex-direction: column; gap: 12px; }
        .change-entry { 
          background: white; border-radius: 10px; padding: 14px; 
          border-left: 3px solid #ffa500; font-size: 13px;
        }
        .change-time-header {
          display: flex; flex-direction: column; gap: 10px;
          margin-bottom: 10px;
        }
        .change-time { 
          font-weight: 600; color: #ff7f00; font-size: 13px; 
          text-transform: uppercase; letter-spacing: 0.5px;
        }
        .expand-detail-btn {
          background: #ff7f00; color: white; border: none; border-radius: 6px;
          padding: 8px 12px; font-size: 12px; font-weight: 600; cursor: pointer;
          transition: background 0.2s; width: 100%; min-height: 44px;
        }
        .expand-detail-btn:hover { background: #ff5500; }
        
        .change-summary {
          display: flex; flex-direction: column; gap: 8px; margin-top: 10px;
          padding: 10px; background: #f9f9f9; border-radius: 6px;
        }
        .change-count {
          background: #fff3cd; color: #856404; padding: 4px 8px;
          border-radius: 4px; font-weight: 600; font-size: 12px; 
          white-space: nowrap; text-align: center;
        }
        .change-preview {
          color: #666; font-size: 13px; line-height: 1.4; word-break: break-word;
        }
        
        /* EXPANDED DETAILS VIEW - MOBILE FIRST */
        .expanded-details-view {
          margin-top: 12px; padding-top: 12px; border-top: 1px solid #ffe4cc;
          display: flex; flex-direction: column; gap: 10px;
        }
        .no-diffs { 
          color: #888; font-size: 13px; text-align: center; padding: 14px 0;
          font-style: italic; line-height: 1.4;
        }
        
        /* DIFF VIEWER STYLES - MOBILE FIRST */
        .diff-viewer {
          background: #f0f8ff; border: 1px solid #d0e4f5; border-radius: 8px;
          overflow: hidden; margin-bottom: 10px;
        }
        .diff-header {
          background: linear-gradient(90deg, #e8f4fd 0%, #f5f9ff 100%);
          padding: 12px; display: flex; flex-direction: column; gap: 8px;
          border-left: 4px solid #4a90d9; font-size: 13px; font-weight: 600;
          border-bottom: 1px solid #d0e4f5;
        }
        .diff-element {
          color: #1a567e; font-weight: 700; font-size: 14px; line-height: 1.3;
        }
        .diff-type-badge {
          background: #e3f2fd; color: #1565c0; padding: 4px 8px;
          border-radius: 4px; font-size: 11px; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.5px; width: fit-content;
        }
        .diff-severity {
          font-weight: 600; font-size: 12px;
          padding: 4px 8px; border-radius: 4px; width: fit-content;
        }
        
        .diff-content {
          display: flex; flex-direction: column; gap: 0; padding: 0;
          font-size: 13px;
        }
        .diff-side {
          flex: 1; padding: 12px; display: flex; flex-direction: column;
          border-bottom: 1px solid #d0e4f5;
        }
        .diff-side:last-child { border-bottom: none; }
        .diff-side.old { background: #fff0f0; }
        .diff-side.new { background: #f0fff0; }
        
        .diff-side-label {
          font-weight: 600; font-size: 12px; color: #666; margin-bottom: 8px;
          text-transform: uppercase; letter-spacing: 0.5px;
        }
        .diff-value {
          font-family: 'Courier New', monospace; font-size: 12px;
          line-height: 1.5; color: #333; word-wrap: break-word;
          padding: 10px; border-radius: 4px; background: rgba(255,255,255,0.7);
        }
        .diff-value.old-value { 
          border-left: 3px solid #ff6b6b; color: #d32f2f;
        }
        .diff-value.new-value { 
          border-left: 3px solid #51cf66; color: #2e7d32;
        }
        
        .diff-arrow {
          display: none;
        }
        
        .diff-summary {
          padding: 12px; color: #666; font-size: 13px;
          line-height: 1.5; background: #f5f5f5;
        }
        
        .snapshot-details { 
          margin-top: 10px; padding-top: 10px; border-top: 1px solid #ffe4cc; 
          cursor: pointer; color: #ff7f00; font-weight: 500; user-select: none;
          font-size: 14px;
        }
        .snapshot-details:hover { color: #ff5500; }
        .snapshot-info { 
          margin-top: 10px; background: #fff9f0; padding: 12px; border-radius: 6px; 
          font-family: monospace; font-size: 12px; color: #555; line-height: 1.5;
        }
        .snapshot-info p { margin: 6px 0; }
        .snapshot-info .hash-display { color: #999; font-size: 11px; }
        
        /* ALERT SETTINGS - MOBILE FIRST */
        .alert-settings { 
          background: white; padding: 20px 16px; border-radius: 12px; 
          margin-bottom: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.12); 
          border-top: 4px solid #4a90d9;
        }
        .alert-settings h2 { margin-bottom: 20px; }
        
        .setting-group { margin-bottom: 20px; }
        .setting-group label { 
          display: block; font-weight: 600; margin-bottom: 10px; 
          color: #333; font-size: 15px;
        }
        .alert-settings select { 
          width: 100%; padding: 12px 14px; border: 1px solid #ddd; 
          border-radius: 10px; font-size: 16px; margin-bottom: 12px; 
          background: white; min-height: 48px;
          transition: border-color 0.2s; -webkit-appearance: none; appearance: none;
        }
        .alert-settings select:focus { outline: none; border-color: #4a90d9; }
        
        .checkbox-group { margin-bottom: 14px; }
        .checkbox-label { 
          display: flex; align-items: center; gap: 10px; 
          font-weight: 400 !important; cursor: pointer; padding: 10px; 
          border-radius: 8px; transition: background 0.2s; font-size: 15px;
        }
        .checkbox-label:hover { background: #f5f5f5; }
        .checkbox-label input[type="checkbox"] { 
          width: 20px; height: 20px; accent-color: #4a90d9; 
          cursor: pointer; flex-shrink: 0;
        }
        
        .notify-input { 
          width: 100%; padding: 12px 14px; border: 1px solid #ddd; 
          border-radius: 10px; font-size: 16px; margin-bottom: 12px;
          min-height: 48px;
          transition: border-color 0.2s; -webkit-appearance: none; appearance: none;
        }
        .notify-input:focus { outline: none; border-color: #4a90d9; }
        
        .settings-summary { 
          background: #f0f7ff; padding: 14px 16px; border-radius: 10px; 
          margin-bottom: 16px; font-size: 13px; color: #1a567e; 
          border-left: 3px solid #4a90d9; line-height: 1.5;
        }
        
        .settings-summary-collapsed { 
          background: #e8f4fd; padding: 14px 16px; border-radius: 10px; 
          margin-bottom: 20px; font-size: 13px; color: #4a90d9; 
          border-left: 3px solid #4a90d9;
        }
        
        .saved-msg { 
          color: #2ecc71; margin-top: 8px; font-weight: 600; 
          animation: fadeIn 0.3s ease; font-size: 14px;
        }
        
        .close-settings { 
          background: #4a90d9; width: 100%; font-weight: 600; 
          padding: 14px 16px; min-height: 48px; font-size: 16px;
          margin-top: 16px;
        }
        .close-settings:hover { background: #2e5fa3; }
        
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 
          0%, 100% { opacity: 1; } 
          50% { opacity: 0.6; }
        }
        
        /* CHANGELOG PANEL STYLES - MOBILE FIRST */
        .changelog-section { 
          margin-top: 30px; margin-bottom: 0;
          position: fixed; bottom: 0; left: 0; right: 0;
          background: white; border-top: 2px solid #ddd; 
          box-shadow: 0 -4px 12px rgba(0,0,0,0.1);
          z-index: 999; max-height: 50vh;
        }
        
        .changelog-toggle {
          width: 100%; background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
          color: white; border: none; border-radius: 0; padding: 14px 16px;
          font-size: 15px; font-weight: 600; cursor: pointer;
          display: flex; align-items: center; gap: 8px;
          transition: background 0.2s, box-shadow 0.2s;
          text-align: left; min-height: 48px;
        }
        
        .changelog-toggle:hover { 
          background: linear-gradient(135deg, #1a252f 0%, #23323f 100%);
          box-shadow: inset 0 2px 8px rgba(0,0,0,0.2);
        }
        
        .changelog-panel {
          background: #f8f9fa; border-top: 2px solid #34495e;
          display: flex; flex-direction: column;
          animation: slideUp 0.3s ease; max-height: calc(50vh - 50px);
        }
        
        .changelog-header {
          padding: 14px 16px; background: white; border-bottom: 1px solid #ddd;
          flex-shrink: 0;
        }
        
        .changelog-header h3 {
          margin: 0 0 6px 0; font-size: 17px; color: #2c3e50;
          font-weight: 600; line-height: 1.3;
        }
        
        .changelog-description {
          margin: 0 0 12px 0; font-size: 13px; color: #888;
          font-style: italic; line-height: 1.4;
        }
        
        .changelog-filters {
          display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
        }
        
        .changelog-filters label {
          font-weight: 600; font-size: 13px; color: #333;
          white-space: nowrap;
        }
        
        .changelog-filter-select {
          flex: 1; min-width: 150px; padding: 8px 10px; 
          border: 1px solid #ddd; border-radius: 6px; font-size: 13px; 
          background: white; cursor: pointer; 
          transition: border-color 0.2s; -webkit-appearance: none; appearance: none;
        }
        
        .changelog-filter-select:focus {
          outline: none; border-color: #34495e;
        }
        
        .changelog-content {
          flex: 1; overflow-y: auto; padding: 0;
          background: white;
        }
        
        .changelog-entries {
          display: flex; flex-direction: column; gap: 0;
        }
        
        .changelog-entry {
          padding: 14px 16px; border-bottom: 1px solid #eee;
          transition: background 0.2s;
          border-left: 4px solid #ddd;
        }
        
        .changelog-entry:hover {
          background: #f5f5f5;
        }
        
        .changelog-entry-header {
          display: flex; gap: 10px; flex-wrap: wrap;
          margin-bottom: 10px; font-size: 12px; font-weight: 600;
        }
        
        .changelog-time {
          color: #888; text-transform: uppercase;
          letter-spacing: 0.5px; white-space: nowrap; flex: 0 0 auto;
        }
        
        .changelog-competitor {
          background: #e3f2fd; color: #1565c0;
          padding: 3px 8px; border-radius: 4px;
          white-space: nowrap; font-size: 12px;
        }
        
        .changelog-severity {
          padding: 3px 8px; border-radius: 4px; font-weight: 700;
          font-size: 11px;
        }
        
        .changelog-severity[data-severity="high"] {
          background: #ffebee; color: #c62828;
        }
        
        .changelog-severity[data-severity="medium"] {
          background: #fff3e0; color: #f57c00;
        }
        
        .changelog-severity[data-severity="low"] {
          background: #e8f5e9; color: #2e7d32;
        }
        
        .changelog-similarity {
          background: #f5f5f5; color: #666;
          padding: 3px 8px; border-radius: 4px;
          font-family: monospace; font-size: 12px;
        }
        
        .changelog-entry-body {
          font-size: 13px; color: #555; line-height: 1.4;
        }
        
        .changelog-url {
          margin-bottom: 8px; word-break: break-all;
        }
        
        .changelog-url code,
        .changelog-values code {
          background: #f5f5f5; padding: 2px 6px;
          border-radius: 3px; font-family: 'Courier New', monospace;
          color: #d32f2f; font-size: 12px;
          word-break: break-all;
        }
        
        .changelog-change {
          margin-bottom: 8px; line-height: 1.5;
        }
        
        .change-detail {
          color: #333; font-weight: 500; word-break: break-word;
        }
        
        .changelog-values {
          display: flex; flex-direction: column; gap: 8px; margin-top: 8px;
        }
        
        .old-val, .new-val {
          padding: 8px; border-radius: 4px;
          font-size: 12px; word-break: break-word;
        }
        
        .old-val {
          background: #fff0f0; color: #d32f2f;
        }
        
        .new-val {
          background: #f0fff0; color: #2e7d32;
        }
        
        .changelog-empty {
          padding: 30px 20px; text-align: center;
          color: #999; font-style: italic; font-size: 13px;
          line-height: 1.5;
        }
        
        .changelog-footer {
          padding: 12px 16px; background: #f5f5f5;
          border-top: 1px solid #ddd; display: flex;
          justify-content: space-between; align-items: center;
          flex-shrink: 0; flex-wrap: wrap; gap: 10px;
        }
        
        .changelog-export {
          background: #34495e; color: white; border: none;
          border-radius: 6px; padding: 8px 12px;
          font-size: 13px; font-weight: 600; cursor: pointer;
          transition: background 0.2s; min-height: 40px;
        }
        
        .changelog-export:hover {
          background: #2c3e50;
        }
        
        .changelog-info {
          font-size: 12px; color: #888;
        }

        /* SCREENSHOT STYLES - MOBILE FIRST */
        .screenshot-btn {
          background: #8b6aff; border: none; color: white; 
          font-weight: 600; cursor: pointer; border-radius: 8px;
          transition: background 0.2s; min-height: 44px; width: 100%;
        }
        .screenshot-btn:hover { background: #7055e8; }
        .screenshot-btn:disabled { 
          background: #ccc; cursor: not-allowed; opacity: 0.6; 
        }

        .screenshots-panel {
          background: white; padding: 16px; margin-top: 12px;
          border: 1px solid #e5e7eb; border-radius: 12px;
          border-left: 4px solid #16a34a;
        }

        .screenshots-panel h4 {
          margin: 0 0 16px 0; font-size: 16px; color: #1f2937;
          display: flex; align-items: center; gap: 8px; font-weight: 600;
          line-height: 1.3;
        }

        .screenshots-panel h5 {
          margin: 16px 0 12px 0; font-size: 13px; color: #666;
          text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;
        }

        .screenshots-container {
          display: flex; flex-direction: column; gap: 20px;
        }

        .screenshots-comparison {
          border: 1px solid #d1d5db; border-radius: 10px;
          padding: 14px; background: #f9fafb;
        }

        .comparison-slider {
          position: relative; width: 100%; margin-top: 12px;
          display: flex; align-items: center; overflow: hidden;
          border-radius: 8px; background: #f5f5f5;
          height: 250px;
        }

        .comparison-img {
          position: absolute; top: 0; left: 0;
          width: 100%; height: 100%; object-fit: contain;
        }

        .comparison-img.before {
          z-index: 1; object-fit: cover;
        }

        .comparison-img.after {
          z-index: 2; opacity: 1; object-fit: cover;
        }

        .slider-divider {
          position: absolute; left: 50%; top: 0;
          width: 4px; height: 100%;
          background: #2563eb; cursor: col-resize;
          z-index: 3; display: flex; align-items: center;
          justify-content: center; user-select: none;
        }

        .slider-handle {
          background: white; color: #2563eb; padding: 6px 8px;
          border-radius: 4px; font-weight: bold; font-size: 13px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          position: absolute; transform: translateX(-50%);
        }

        .comparison-info {
          margin-top: 10px; font-size: 13px; color: #666;
          text-align: center; line-height: 1.4;
        }

        .screenshot-gallery {
          display: flex; flex-direction: column; gap: 12px;
        }

        .screenshot-item {
          border: 1px solid #d1d5db; border-radius: 10px;
          overflow: hidden; display: flex; flex-direction: column;
          transition: box-shadow 0.2s;
        }

        .screenshot-item:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .screenshot-thumb {
          width: 100%; height: 200px; object-fit: cover;
          background: #f5f5f5; cursor: pointer;
        }

        .screenshot-meta {
          padding: 10px 12px; background: #f9fafb;
          font-size: 12px; color: #666; display: flex;
          flex-direction: column; gap: 4px;
        }

        .screenshot-time {
          font-weight: 600; color: #1f2937; font-size: 13px;
        }

        .screenshot-size, .screenshot-res {
          color: #999; font-family: monospace; font-size: 12px;
        }

        .screenshot-actions {
          padding: 10px 12px; background: #f3f4f6;
          display: flex; gap: 8px; justify-content: center;
          border-top: 1px solid #e5e7eb;
        }

        .screenshot-download {
          background: transparent; border: none; font-size: 18px;
          cursor: pointer; padding: 8px 12px; border-radius: 6px;
          transition: background 0.2s; min-height: 44px; min-width: 44px;
          display: flex; align-items: center; justify-content: center;
        }

        .screenshot-download:hover {
          background: #d1d5db;
        }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        /* DESKTOP RESPONSIVE - Media Queries */
        @media (min-width: 768px) {
          header { 
            padding: 28px 24px; 
          }
          header h1 { 
            font-size: 32px; margin-bottom: 8px;
          }
          header p { 
            font-size: 16px;
          }
          
          main { 
            padding: 24px; max-width: 900px; 
          }
          section { 
            margin-bottom: 28px; 
          }
          h2 { 
            font-size: 20px; margin-bottom: 18px;
          }
          
          /* INPUT & BUTTONS */
          .input-group { 
            flex-direction: row; gap: 12px;
          }
          input {
            flex: 1; min-width: auto;
          }
          button {
            width: auto; min-width: 120px;
          }
          
          /* COMPETITOR CARD */
          .competitor-card {
            flex-direction: row; align-items: center; gap: 16px;
          }
          .comp-info { 
            flex: 1;
          }
          .comp-info h3 { 
            font-size: 18px;
          }
          .comp-actions {
            grid-template-columns: auto auto auto auto auto;
            width: auto; gap: 10px;
          }
          .comp-actions .check,
          .comp-actions .screenshot-btn,
          .comp-actions .show-changes,
          .comp-actions .show-screenshots,
          .comp-actions .remove {
            width: auto; padding: 10px 14px; font-size: 14px;
            min-height: 40px;
          }
          .comp-actions .remove {
            grid-column: auto;
          }
          
          /* ADD COMPETITOR HEADER */
          .add-competitor-header {
            flex-direction: row; align-items: center;
          }
          .site-counter {
            flex: 1; min-width: 200px;
          }
          .counter-number {
            text-align: right;
          }
          
          /* CHECK ALL SECTION */
          .check-all {
            flex-direction: row; gap: 12px;
          }
          .check-all-btn {
            flex: 1; width: auto; padding: 12px 20px;
          }
          .settings-btn {
            width: auto; padding: 12px 20px;
          }
          .last-check {
            white-space: nowrap; text-align: left;
          }
          
          /* MODAL */
          .modal-overlay {
            align-items: center; justify-content: center;
          }
          .modal-content {
            border-radius: 16px; width: 90%;
            max-width: 500px; max-height: 90vh;
          }
          .modal-header {
            padding: 32px 32px 24px; border-radius: 16px 16px 0 0;
            padding-left: 40px; padding-right: 40px;
          }
          .modal-body {
            padding: 32px;
          }
          .modal-footer {
            padding: 24px 32px; border-radius: 0 0 16px 16px;
          }
          
          /* SCREENSHOT GALLERY */
          .screenshot-gallery {
            display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 14px;
          }
          .screenshot-thumb {
            height: 200px;
          }
          
          /* CHANGES PANEL */
          .change-time-header {
            flex-direction: row; justify-content: space-between; align-items: center;
            gap: 12px;
          }
          .expand-detail-btn {
            width: auto;
          }
          .change-summary {
            flex-direction: row; align-items: center;
          }
          
          /* DIFF VIEWER */
          .diff-header {
            flex-direction: row; gap: 12px;
          }
          .diff-content {
            flex-direction: row; gap: 0;
          }
          .diff-side {
            border-right: 1px solid #d0e4f5; border-bottom: none;
          }
          .diff-side:last-child {
            border-right: none;
          }
          .diff-arrow {
            display: flex;
          }
          
          /* CHANGELOG */
          .changelog-section {
            position: static; bottom: auto; max-height: none;
            margin-top: 30px; margin-bottom: 20px;
            border-top: 2px solid #ddd;
          }
          .changelog-panel {
            max-height: 600px;
          }
          .changelog-toggle {
            padding: 16px;
          }
          .changelog-entry-header {
            flex-direction: row; align-items: center;
          }
          
          /* SITE COUNTER */
          .competitors-header {
            flex-direction: row; justify-content: space-between;
          }
          
          main {
            padding-bottom: 40px;
          }
        }
        
        /* EXTRA LARGE SCREENS */
        @media (min-width: 1024px) {
          main {
            max-width: 1000px;
          }
          .competitor-card {
            padding: 18px;
          }
          h2 {
            font-size: 22px;
          }
        }
      `}</style>
    </div>
  );
}