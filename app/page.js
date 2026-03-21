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
  const [lastCheckAll, setLastCheckAll] = useState(null);
  const [alertSettings, setAlertSettings] = useState(DEFAULT_ALERT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [expandedChanges, setExpandedChanges] = useState(null); // Track which competitor's changes are expanded
  const [expandedChangeDetail, setExpandedChangeDetail] = useState(null); // Track expanded change detail view
  const [showChangelog, setShowChangelog] = useState(false); // Show/hide changelog panel
  const [changelogFilter, setChangelogFilter] = useState('all'); // Filter: 'all', 'high', 'medium', 'low'

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

  const addCompetitor = () => {
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

  return (
    <div className="app">
      <header>
        <h1>🕵️ Site Spy</h1>
        <p>Track your local competitors</p>
      </header>

      <main>
        <section className="add-competitor">
          <h2>Add Competitor</h2>
          <div className="input-group">
            <input
              type="text"
              placeholder="Enter website URL..."
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCompetitor()}
            />
            <button onClick={addCompetitor}>Add</button>
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
          <h2>Your Competitors ({competitors.length})</h2>
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
                      {comp.changes && comp.changes.length > 0 && (
                        <button 
                          className="show-changes"
                          onClick={() => setExpandedChanges(expandedChanges === comp.id ? null : comp.id)}
                        >
                          {expandedChanges === comp.id ? '▼' : '▶'} {comp.changes.length}
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
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; color: #333; }
        .app { min-height: 100vh; }
        header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 24px; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        header h1 { font-size: 28px; margin-bottom: 4px; font-weight: 700; }
        header p { color: #aaa; font-size: 14px; }
        main { padding: 20px; max-width: 600px; margin: 0 auto; padding-bottom: 40px; }
        section { margin-bottom: 30px; }
        h2 { font-size: 18px; margin-bottom: 12px; color: #333; font-weight: 600; }
        
        /* Input Group */
        .input-group { display: flex; gap: 10px; margin-bottom: 8px; }
        .info-text { font-size: 12px; color: #666; margin-top: 8px; font-style: italic; }
        input { 
          flex: 1; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        input:focus { outline: none; border-color: #4a90d9; box-shadow: 0 0 0 3px rgba(74, 144, 217, 0.1); }
        
        /* Buttons */
        button { 
          padding: 12px 20px; background: #1a1a2e; color: white; border: none; border-radius: 8px; 
          font-size: 16px; cursor: pointer; font-weight: 600;
          transition: all 0.2s ease;
        }
        button:hover:not(:disabled) { background: #252a4a; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(26, 26, 46, 0.2); }
        button:active:not(:disabled) { transform: translateY(0); }
        button:disabled { opacity: 0.5; cursor: not-allowed; }
        
        .empty { color: #888; text-align: center; padding: 40px 20px; background: white; border-radius: 12px; }
        
        /* Check All Section */
        .check-all { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
        .check-all-btn { background: linear-gradient(135deg, #4a90d9, #2e5fa3); flex: 1; box-shadow: 0 2px 8px rgba(74, 144, 217, 0.2); }
        .check-all-btn:hover:not(:disabled) { box-shadow: 0 4px 16px rgba(74, 144, 217, 0.3); }
        .last-check { color: #888; font-size: 12px; white-space: nowrap; }
        
        /* Competitor List */
        ul { list-style: none; }
        .competitor-card { 
          background: white; padding: 16px; border-radius: 12px; margin-bottom: 12px; 
          display: flex; justify-content: space-between; align-items: center; 
          box-shadow: 0 2px 4px rgba(0,0,0,0.08);
          border-left: 4px solid #4a90d9;
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .competitor-card:hover { 
          box-shadow: 0 4px 12px rgba(0,0,0,0.12); 
          transform: translateY(-1px);
        }
        .comp-info { flex: 1; }
        .comp-info h3 { font-size: 16px; margin-bottom: 4px; font-weight: 600; }
        .comp-info a { color: #0066cc; font-size: 14px; text-decoration: none; font-weight: 500; }
        .comp-info a:hover { text-decoration: underline; }
        .comp-info .meta { display: flex; gap: 12px; margin-top: 8px; font-size: 12px; color: #888; flex-wrap: wrap; align-items: center; }
        .change-indicator { margin-left: 6px; font-size: 14px; animation: pulse 1.5s infinite; }
        .changes-count { background: #fff3cd; color: #856404; padding: 2px 8px; border-radius: 12px; font-weight: 600; }
        .status-badge { 
          display: inline-block; padding: 4px 10px; border-radius: 20px; text-transform: capitalize; 
          font-weight: 600; font-size: 11px;
        }
        .status-badge[data-status="alive"] { background: #e8f5e9; color: #2e7d32; }
        .status-badge[data-status="down"] { background: #ffebee; color: #c62828; }
        .status-badge[data-status="pending"] { background: #fff3e0; color: #f57c00; }
        
        /* Action Buttons */
        .comp-actions { display: flex; gap: 8px; }
        .comp-actions .check { 
          background: #4a90d9; padding: 8px 12px; font-size: 14px; font-weight: 600;
          border-radius: 6px;
        }
        .comp-actions .check:hover:not(:disabled) { background: #2e5fa3; }
        .comp-actions .show-changes {
          background: #ffa500; padding: 8px 12px; font-size: 14px; font-weight: 600;
          border-radius: 6px; white-space: nowrap;
        }
        .comp-actions .show-changes:hover { background: #ff8c00; }
        .comp-actions .remove { 
          background: #ff4444; padding: 8px 12px; font-size: 14px; width: 36px; 
          border-radius: 6px; font-weight: 600;
        }
        .comp-actions .remove:hover:not(:disabled) { background: #cc0000; }
        
        /* Changes Panel */
        .changes-panel {
          background: #fffaf0; border-radius: 0 0 12px 12px; border: 1px solid #ffd699; border-top: none;
          padding: 16px; margin-bottom: 12px; margin-top: -4px; border-left: 4px solid #ffa500;
        }
        .changes-panel h4 { margin-bottom: 12px; color: #ff7f00; font-size: 14px; }
        .changes-timeline { display: flex; flex-direction: column; gap: 12px; }
        .change-entry { 
          background: white; border-radius: 8px; padding: 12px; 
          border-left: 3px solid #ffa500; font-size: 13px;
        }
        .change-time-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 8px; gap: 12px;
        }
        .change-time { 
          font-weight: 600; color: #ff7f00; font-size: 12px; 
          text-transform: uppercase; letter-spacing: 0.5px;
        }
        .expand-detail-btn {
          background: #ff7f00; color: white; border: none; border-radius: 4px;
          padding: 4px 8px; font-size: 11px; font-weight: 600; cursor: pointer;
          transition: background 0.2s;
        }
        .expand-detail-btn:hover { background: #ff5500; }
        
        .change-summary {
          display: flex; align-items: center; gap: 12px; margin-top: 8px;
          padding: 8px; background: #f9f9f9; border-radius: 4px;
        }
        .change-count {
          background: #fff3cd; color: #856404; padding: 2px 6px;
          border-radius: 4px; font-weight: 600; font-size: 11px; white-space: nowrap;
        }
        .change-preview {
          color: #666; font-size: 12px; flex: 1; overflow: hidden;
          text-overflow: ellipsis; white-space: nowrap;
        }
        
        /* Expanded Details View */
        .expanded-details-view {
          margin-top: 12px; padding-top: 12px; border-top: 1px solid #ffe4cc;
          display: flex; flex-direction: column; gap: 10px;
        }
        .no-diffs { 
          color: #888; font-size: 12px; text-align: center; padding: 12px 0;
          font-style: italic;
        }
        
        /* Diff Viewer Styles */
        .diff-viewer {
          background: #f0f8ff; border: 1px solid #d0e4f5; border-radius: 6px;
          overflow: hidden; margin-bottom: 8px;
        }
        .diff-header {
          background: linear-gradient(90deg, #e8f4fd 0%, #f5f9ff 100%);
          padding: 10px 12px; display: flex; gap: 8px; align-items: center;
          border-left: 4px solid #4a90d9; font-size: 12px; font-weight: 600;
          border-bottom: 1px solid #d0e4f5;
        }
        .diff-element {
          color: #1a567e; font-weight: 700; flex-shrink: 0;
        }
        .diff-type-badge {
          background: #e3f2fd; color: #1565c0; padding: 2px 6px;
          border-radius: 3px; font-size: 10px; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.5px;
        }
        .diff-severity {
          margin-left: auto; font-weight: 600; font-size: 11px;
          padding: 2px 6px; border-radius: 3px;
        }
        
        .diff-content {
          display: flex; align-items: stretch; gap: 0; padding: 0;
          font-size: 12px;
        }
        .diff-side {
          flex: 1; padding: 12px; display: flex; flex-direction: column;
          border-right: 1px solid #d0e4f5;
        }
        .diff-side:last-child { border-right: none; }
        .diff-side.old { background: #fff0f0; }
        .diff-side.new { background: #f0fff0; }
        
        .diff-side-label {
          font-weight: 600; font-size: 11px; color: #666; margin-bottom: 6px;
          text-transform: uppercase; letter-spacing: 0.5px;
        }
        .diff-value {
          font-family: 'Courier New', monospace; font-size: 11px;
          line-height: 1.4; color: #333; word-wrap: break-word;
          padding: 8px; border-radius: 4px; background: rgba(255,255,255,0.7);
        }
        .diff-value.old-value { 
          border-left: 2px solid #ff6b6b; color: #d32f2f;
        }
        .diff-value.new-value { 
          border-left: 2px solid #51cf66; color: #2e7d32;
        }
        
        .diff-arrow {
          display: flex; align-items: center; padding: 0 6px;
          color: #999; font-weight: bold; font-size: 14px;
          flex-shrink: 0;
        }
        
        .diff-summary {
          padding: 12px; color: #666; font-size: 12px;
          line-height: 1.5; background: #f5f5f5;
        }
        
        .snapshot-details { 
          margin-top: 8px; padding-top: 8px; border-top: 1px solid #ffe4cc; 
          cursor: pointer; color: #ff7f00; font-weight: 500; user-select: none;
        }
        .snapshot-details:hover { color: #ff5500; }
        .snapshot-info { 
          margin-top: 8px; background: #fff9f0; padding: 10px; border-radius: 6px; 
          font-family: monospace; font-size: 11px; color: #555;
        }
        .snapshot-info p { margin: 4px 0; }
        .snapshot-info .hash-display { color: #999; font-size: 10px; }
        
        /* Alert Settings */
        .settings-btn { 
          background: #666; padding: 12px 16px; border-radius: 8px; font-weight: 600;
        }
        .settings-btn:hover { background: #555; }
        
        .alert-settings { 
          background: white; padding: 24px; border-radius: 12px; margin-bottom: 20px; 
          box-shadow: 0 4px 12px rgba(0,0,0,0.12); border-top: 4px solid #4a90d9;
        }
        .alert-settings h2 { margin-bottom: 20px; }
        
        .setting-group { margin-bottom: 20px; }
        .setting-group label { display: block; font-weight: 600; margin-bottom: 8px; color: #333; }
        .alert-settings select { 
          width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; 
          font-size: 14px; margin-bottom: 12px; background: white;
          transition: border-color 0.2s;
        }
        .alert-settings select:focus { outline: none; border-color: #4a90d9; }
        
        .checkbox-group { margin-bottom: 12px; }
        .checkbox-label { 
          display: flex; align-items: center; gap: 8px; font-weight: 400 !important; 
          cursor: pointer; padding: 8px; border-radius: 6px;
          transition: background 0.2s;
        }
        .checkbox-label:hover { background: #f5f5f5; }
        .checkbox-label input[type="checkbox"] { width: 18px; height: 18px; accent-color: #4a90d9; cursor: pointer; }
        
        .notify-input { 
          width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; 
          font-size: 14px; margin-bottom: 8px;
          transition: border-color 0.2s;
        }
        .notify-input:focus { outline: none; border-color: #4a90d9; }
        
        .settings-summary { 
          background: #f0f7ff; padding: 14px; border-radius: 8px; margin-bottom: 16px; 
          font-size: 13px; color: #1a567e; border-left: 3px solid #4a90d9; line-height: 1.5;
        }
        
        .settings-summary-collapsed { 
          background: #e8f4fd; padding: 12px 14px; border-radius: 8px; margin-bottom: 20px; 
          font-size: 13px; color: #4a90d9; border-left: 3px solid #4a90d9;
        }
        
        .saved-msg { color: #2ecc71; margin-top: 8px; font-weight: 600; animation: fadeIn 0.3s ease; }
        
        .close-settings { background: #4a90d9; width: 100%; font-weight: 600; }
        .close-settings:hover { background: #2e5fa3; }
        
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 
          0%, 100% { opacity: 1; } 
          50% { opacity: 0.6; }
        }
        
        /* Changelog Panel Styles */
        .changelog-section { 
          margin-top: 30px; margin-bottom: 20px;
          position: sticky; bottom: 0; background: white;
          border-top: 2px solid #ddd; box-shadow: 0 -4px 12px rgba(0,0,0,0.1);
        }
        
        .changelog-toggle {
          width: 100%; background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
          color: white; border: none; border-radius: 0; padding: 16px;
          font-size: 16px; font-weight: 600; cursor: pointer;
          display: flex; align-items: center; gap: 8px;
          transition: background 0.2s, box-shadow 0.2s;
          text-align: left;
        }
        
        .changelog-toggle:hover { 
          background: linear-gradient(135deg, #1a252f 0%, #23323f 100%);
          box-shadow: inset 0 2px 8px rgba(0,0,0,0.2);
        }
        
        .changelog-panel {
          background: #f8f9fa; border-top: 2px solid #34495e;
          max-height: 500px; display: flex; flex-direction: column;
          animation: slideUp 0.3s ease;
        }
        
        .changelog-header {
          padding: 16px; background: white; border-bottom: 1px solid #ddd;
          flex-shrink: 0;
        }
        
        .changelog-header h3 {
          margin: 0 0 4px 0; font-size: 16px; color: #2c3e50;
        }
        
        .changelog-description {
          margin: 0 0 12px 0; font-size: 12px; color: #888;
          font-style: italic;
        }
        
        .changelog-filters {
          display: flex; align-items: center; gap: 12px;
        }
        
        .changelog-filters label {
          font-weight: 600; font-size: 12px; color: #333;
          white-space: nowrap;
        }
        
        .changelog-filter-select {
          flex: 1; padding: 8px; border: 1px solid #ddd;
          border-radius: 6px; font-size: 12px; background: white;
          cursor: pointer; transition: border-color 0.2s;
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
          padding: 12px 16px; border-bottom: 1px solid #eee;
          transition: background 0.2s;
          border-left: 4px solid #ddd;
        }
        
        .changelog-entry:hover {
          background: #f5f5f5;
        }
        
        .changelog-entry-header {
          display: flex; gap: 12px; align-items: center;
          margin-bottom: 8px; flex-wrap: wrap;
          font-size: 12px; font-weight: 600;
        }
        
        .changelog-time {
          color: #888; text-transform: uppercase;
          letter-spacing: 0.5px; min-width: 80px;
        }
        
        .changelog-competitor {
          background: #e3f2fd; color: #1565c0;
          padding: 2px 8px; border-radius: 4px;
          white-space: nowrap;
        }
        
        .changelog-severity {
          padding: 2px 8px; border-radius: 4px; font-weight: 700;
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
          padding: 2px 8px; border-radius: 4px;
          font-family: monospace;
        }
        
        .changelog-entry-body {
          font-size: 12px; color: #555;
        }
        
        .changelog-url {
          margin-bottom: 6px;
        }
        
        .changelog-url code,
        .changelog-values code {
          background: #f5f5f5; padding: 2px 6px;
          border-radius: 3px; font-family: 'Courier New', monospace;
          color: #d32f2f; font-size: 11px;
          word-break: break-all;
        }
        
        .changelog-change {
          margin-bottom: 6px; line-height: 1.4;
        }
        
        .change-detail {
          color: #333; font-weight: 500;
        }
        
        .changelog-values {
          display: flex; gap: 12px; margin-top: 6px;
          flex-wrap: wrap;
        }
        
        .old-val, .new-val {
          flex: 1; min-width: 200px;
          padding: 6px; border-radius: 3px;
          font-size: 11px;
        }
        
        .old-val {
          background: #fff0f0; color: #d32f2f;
        }
        
        .new-val {
          background: #f0fff0; color: #2e7d32;
        }
        
        .changelog-empty {
          padding: 40px 20px; text-align: center;
          color: #999; font-style: italic;
        }
        
        .changelog-footer {
          padding: 12px 16px; background: #f5f5f5;
          border-top: 1px solid #ddd; display: flex;
          justify-content: space-between; align-items: center;
          flex-shrink: 0;
        }
        
        .changelog-export {
          background: #34495e; color: white; border: none;
          border-radius: 6px; padding: 8px 14px;
          font-size: 12px; font-weight: 600; cursor: pointer;
          transition: background 0.2s;
        }
        
        .changelog-export:hover {
          background: #2c3e50;
        }
        
        .changelog-info {
          font-size: 11px; color: #888;
        }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        /* Responsive */
        @media (max-width: 500px) {
          main { padding: 12px; padding-bottom: 30px; }
          header { padding: 16px; }
          header h1 { font-size: 22px; }
          .competitor-card { flex-direction: column; align-items: flex-start; }
          .comp-actions { width: 100%; margin-top: 12px; display: flex; flex-wrap: wrap; gap: 8px; }
          .comp-actions .check { flex: 1; min-width: 80px; }
          .comp-actions .show-changes { flex: 1; min-width: 80px; }
          .comp-actions .remove { width: 36px; flex-shrink: 0; }
          .input-group { flex-direction: column; }
          input { width: 100%; }
          .changes-panel { margin-left: -16px; margin-right: -16px; border-radius: 0 0 12px 12px; }
          
          .changelog-section {
            position: fixed; bottom: 0; left: 0; right: 0;
            max-height: 50vh; z-index: 1000;
          }
          .changelog-panel { max-height: calc(50vh - 50px); }
          .changelog-entry-header { flex-direction: column; align-items: flex-start; gap: 6px; }
          main { padding-bottom: 60px; }
        }
      `}</style>
    </div>
  );
}