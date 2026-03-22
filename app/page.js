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

// AnalyticsDashboard Component - Premium Feature
function AnalyticsDashboard({ competitors }) {
  const calculateUptime = (competitor) => {
    if (!competitor.changes || competitor.changes.length === 0) return 100;
    
    const checks = competitor.changes.length + (competitor.lastChecked ? 1 : 0);
    const failedChecks = competitor.status === 'down' ? 1 : 0;
    
    if (checks === 0) return 0;
    return Math.round(((checks - failedChecks) / checks) * 100);
  };

  const calculateAvgResponseTime = (competitor) => {
    if (!competitor.changes || competitor.changes.length < 2) return 'N/A';
    
    // Simulate response time based on snapshot data
    const times = competitor.changes.map((change) => {
      const timestamp = new Date(change.timestamp);
      return timestamp.getTime();
    });
    
    if (times.length < 2) return 'N/A';
    
    const avgMs = times.reduce((acc, time, i) => {
      if (i === 0) return acc;
      return acc + (time - times[i - 1]);
    }, 0) / (times.length - 1);
    
    return (avgMs / 1000).toFixed(2) + 's';
  };

  const getMostActiveDay = () => {
    if (!competitors || competitors.length === 0) return 'N/A';
    
    const dayChanges = {};
    competitors.forEach((comp) => {
      if (comp.changes && Array.isArray(comp.changes)) {
        comp.changes.forEach((change) => {
          const date = new Date(change.timestamp);
          const day = date.toLocaleDateString();
          dayChanges[day] = (dayChanges[day] || 0) + (Array.isArray(change.changes) ? change.changes.length : 0);
        });
      }
    });
    
    const sorted = Object.entries(dayChanges).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? `${sorted[0][0]} (${sorted[0][1]} changes)` : 'N/A';
  };

  const generateHeatmap = () => {
    const heatmapData = {};
    const now = new Date();
    
    // Generate last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      heatmapData[dateKey] = 0;
    }
    
    // Count changes per day
    competitors.forEach((comp) => {
      if (comp.changes && Array.isArray(comp.changes)) {
        comp.changes.forEach((change) => {
          const dateKey = new Date(change.timestamp).toISOString().split('T')[0];
          if (dateKey in heatmapData) {
            heatmapData[dateKey] += Array.isArray(change.changes) ? change.changes.length : 1;
          }
        });
      }
    });
    
    return Object.entries(heatmapData).map(([date, count]) => ({
      date,
      count,
      severity: count === 0 ? 'none' : count < 3 ? 'low' : count < 6 ? 'medium' : 'high'
    }));
  };

  const exportData = (format) => {
    const exportContent = competitors.map(comp => {
      const uptime = calculateUptime(comp);
      const avgResponseTime = calculateAvgResponseTime(comp);
      const changeCount = comp.changes ? comp.changes.length : 0;
      
      return {
        domain: comp.domain,
        url: comp.url,
        status: comp.status,
        uptime: `${uptime}%`,
        avgResponseTime,
        changesDetected: changeCount,
        lastChecked: comp.lastChecked ? new Date(comp.lastChecked).toLocaleString() : 'Never',
        addedDate: new Date(comp.addedAt).toLocaleString()
      };
    });

    if (format === 'csv') {
      const headers = Object.keys(exportContent[0] || {});
      const csv = [
        headers.join(','),
        ...exportContent.map(row =>
          headers.map(header =>
            `"${String(row[header]).replace(/"/g, '""')}"`.substring(0, 100)
          ).join(',')
        )
      ].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `site-spy-analytics-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'json') {
      const json = JSON.stringify(exportContent, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `site-spy-analytics-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const heatmapData = generateHeatmap();
  const maxChanges = Math.max(...heatmapData.map(d => d.count), 1);

  return (
    <div className="analytics-dashboard">
      <div className="analytics-grid">
        {/* Key Metrics */}
        <div className="analytics-card metric-card">
          <h4>📈 Total Sites Monitored</h4>
          <div className="metric-value">{competitors.length}</div>
          <p className="metric-detail">Active tracking</p>
        </div>

        <div className="analytics-card metric-card">
          <h4>✅ Average Uptime</h4>
          <div className="metric-value">
            {competitors.length > 0
              ? Math.round(
                  competitors.reduce((sum, comp) => sum + calculateUptime(comp), 0) / competitors.length
                )
              : 0}%
          </div>
          <p className="metric-detail">Across all sites</p>
        </div>

        <div className="analytics-card metric-card">
          <h4>📝 Total Changes Detected</h4>
          <div className="metric-value">
            {competitors.reduce((sum, comp) => sum + (comp.changes ? comp.changes.length : 0), 0)}
          </div>
          <p className="metric-detail">All time</p>
        </div>

        <div className="analytics-card metric-card">
          <h4>🔥 Most Active Day</h4>
          <div className="metric-value-text">{getMostActiveDay()}</div>
          <p className="metric-detail">Peak activity</p>
        </div>
      </div>

      {/* Detailed Performance Metrics */}
      <div className="analytics-card performance-card">
        <h4>⚡ Performance Metrics by Site</h4>
        {competitors.length > 0 ? (
          <div className="performance-table">
            {competitors.map((comp) => (
              <div key={comp.id} className="performance-row">
                <div className="perf-site">
                  <span className="perf-name">{comp.name}</span>
                  <span className="perf-domain">{comp.domain}</span>
                </div>
                <div className="perf-metrics">
                  <div className="perf-item">
                    <span className="perf-label">Uptime:</span>
                    <span className="perf-value">{calculateUptime(comp)}%</span>
                  </div>
                  <div className="perf-item">
                    <span className="perf-label">Avg Response:</span>
                    <span className="perf-value">{calculateAvgResponseTime(comp)}</span>
                  </div>
                  <div className="perf-item">
                    <span className="perf-label">Changes:</span>
                    <span className="perf-value">{comp.changes ? comp.changes.length : 0}</span>
                  </div>
                  <div className="perf-item">
                    <span className="perf-label">Status:</span>
                    <span className={`perf-status ${comp.status}`}>
                      {comp.status === 'alive' ? '✅ Online' : comp.status === 'down' ? '❌ Down' : '⏳ Pending'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="analytics-empty">No data yet. Add sites and run checks to see performance metrics.</p>
        )}
      </div>

      {/* Change Heat Map */}
      <div className="analytics-card heatmap-card">
        <h4>🗓️ Change Heat Map (Last 30 Days)</h4>
        <p className="heatmap-description">Visual calendar showing which days had the most changes</p>
        <div className="heatmap-container">
          {heatmapData.map((day, idx) => {
            const heatmapIntensity = maxChanges > 0 ? (day.count / maxChanges) * 100 : 0;
            return (
              <div
                key={idx}
                className="heatmap-cell"
                data-severity={day.severity}
                style={{
                  opacity: Math.max(0.2, heatmapIntensity / 100),
                  backgroundColor: day.severity === 'none'
                    ? '#1a2a3a'
                    : day.severity === 'low'
                    ? '#0066cc'
                    : day.severity === 'medium'
                    ? '#ff9900'
                    : '#ff3333'
                }}
                title={`${day.date}: ${day.count} changes`}
              >
                <span className="heatmap-count">{day.count}</span>
              </div>
            );
          })}
        </div>
        <div className="heatmap-legend">
          <span>No changes</span>
          <span>🔵 Low</span>
          <span>🟠 Medium</span>
          <span>🔴 High</span>
        </div>
      </div>

      {/* Export Options */}
      <div className="analytics-card export-card">
        <h4>📥 Export Reports</h4>
        <p className="export-description">Download your monitoring data for external analysis</p>
        <div className="export-buttons">
          <button 
            className="export-btn csv-btn"
            onClick={() => exportData('csv')}
          >
            📄 Export as CSV
          </button>
          <button 
            className="export-btn json-btn"
            onClick={() => exportData('json')}
          >
            📋 Export as JSON
          </button>
        </div>
        <p className="export-info">📌 Includes uptime %, response times, and change history</p>
      </div>

      {/* Premium Feature Notice */}
      <div className="analytics-card premium-notice">
        <h4>⭐ Premium Features</h4>
        <p className="premium-text">
          This analytics dashboard is a <strong>premium feature</strong>. 
          Track unlimited sites and get detailed performance insights with a Pro plan.
        </p>
        <button className="premium-upgrade-btn">🚀 Upgrade to Pro</button>
      </div>
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
  const [showUpgradeBanner, setShowUpgradeBanner] = useState(false); // Show banner when approaching limit

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
      case 'basic': return 6; // +5 sites ($9.99/month)
      case 'pro': return 20; // 20 sites ($19.99/month)
      case 'pro_annual': return 20; // 20 sites ($179.99/year)
      case 'pro_2x': return 40; // +20 more sites ($10/month)
      case 'enterprise': return Infinity; // Unlimited
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

  // Show upgrade banner when 80% of limit is reached
  useEffect(() => {
    if (competitors.length > 0 && siteLimit > 0) {
      const usagePercentage = (competitors.length / siteLimit) * 100;
      setShowUpgradeBanner(usagePercentage >= 80 && purchaseTier === 'free');
    }
  }, [competitors.length, siteLimit, purchaseTier]);

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

  // Upgrade Modal Component - Enhanced with tier comparison
  const UpgradeModal = () => {
    if (!showUpgradeModal) return null;
    const [showComparison, setShowComparison] = useState(false);
    
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

            {/* Subscription Options */}
            <div className="subscription-options">
              {/* Basic Monthly */}
              <div className="subscription-option">
                <div className="sub-header">
                  <span className="sub-name">📊 Basic Plan</span>
                </div>
                <div className="sub-price">$9.99<span style={{fontSize: '14px', fontWeight: '400', color: '#5f8fb5'}}>/month</span></div>
                <div className="sub-period">Monthly Billing</div>
                <ul className="sub-features">
                  <li>6 tracking slots</li>
                  <li>Change detection</li>
                  <li>Screenshot comparison</li>
                  <li>Alert settings</li>
                </ul>
                <button 
                  className="sub-btn"
                  onClick={() => handleUpgrade('basic')}
                >
                  Get Basic
                </button>
              </div>

              {/* Pro Monthly - Featured */}
              <div className="subscription-option featured">
                <div className="sub-header">
                  <span className="sub-name">⭐ Pro Plan</span>
                  <span className="sub-featured-badge">Most Popular</span>
                </div>
                <div className="sub-price">$19.99<span style={{fontSize: '14px', fontWeight: '400', color: '#5f8fb5'}}>/month</span></div>
                <div className="sub-period">Monthly Billing</div>
                <ul className="sub-features">
                  <li>20 tracking slots</li>
                  <li>Advanced analytics dashboard</li>
                  <li>Performance metrics & heatmap</li>
                  <li>CSV/JSON export reports</li>
                  <li>Priority support</li>
                </ul>
                <button 
                  className="sub-btn featured"
                  onClick={() => handleUpgrade('pro')}
                >
                  Get Pro
                </button>
              </div>

              {/* Pro Annual - Best Value */}
              <div className="subscription-option featured">
                <div className="sub-header">
                  <span className="sub-name">⭐ Pro Annual</span>
                  <span className="sub-featured-badge">Save 25%</span>
                </div>
                <div className="sub-price">$179.99<span style={{fontSize: '14px', fontWeight: '400', color: '#5f8fb5'}}>/year</span></div>
                <div className="sub-period">Renews annually</div>
                <ul className="sub-features">
                  <li>20 tracking slots</li>
                  <li>All Pro features included</li>
                  <li>Unlimited storage</li>
                  <li>Early access to new features</li>
                  <li>Priority support</li>
                </ul>
                <button 
                  className="sub-btn featured"
                  onClick={() => handleUpgrade('pro_annual')}
                >
                  Get Pro Annual - Save $60!
                </button>
                <div className="sub-savings">💰 Save $60/year vs monthly billing</div>
              </div>

              {/* Enterprise */}
              <div className="subscription-option">
                <div className="sub-header">
                  <span className="sub-name">🏢 Enterprise Plan</span>
                </div>
                <div className="sub-price">Custom<span style={{fontSize: '14px', fontWeight: '400', color: '#5f8fb5'}}>/month</span></div>
                <div className="sub-period">Contact sales for pricing</div>
                <ul className="sub-features">
                  <li>Unlimited tracking slots</li>
                  <li>Custom integrations</li>
                  <li>Dedicated account manager</li>
                  <li>SLA guarantee</li>
                  <li>Team collaboration</li>
                </ul>
                <button className="sub-btn" disabled style={{opacity: 0.6, cursor: 'not-allowed'}}>
                  Contact Sales
                </button>
              </div>
            </div>

            {/* Feature Comparison */}
            <div className="tier-comparison">
              <button 
                className="upgrade-btn"
                onClick={() => setShowComparison(!showComparison)}
                style={{marginBottom: '12px'}}
              >
                {showComparison ? '▼' : '▶'} Compare All Plans
              </button>
              
              {showComparison && (
                <div className="comparison-table">
                  <div className="comparison-header">
                    <div>Feature</div>
                    <div>Free</div>
                    <div>Basic</div>
                    <div>Pro</div>
                  </div>
                  
                  <div className="comparison-row">
                    <div className="comparison-feature">Tracking Slots</div>
                    <div className="comparison-value">1</div>
                    <div className="comparison-value">6</div>
                    <div className="comparison-value">20</div>
                  </div>
                  
                  <div className="comparison-row">
                    <div className="comparison-feature">Change Detection</div>
                    <div className="comparison-value included">✅</div>
                    <div className="comparison-value included">✅</div>
                    <div className="comparison-value included">✅</div>
                  </div>
                  
                  <div className="comparison-row">
                    <div className="comparison-feature">Screenshots</div>
                    <div className="comparison-value included">✅</div>
                    <div className="comparison-value included">✅</div>
                    <div className="comparison-value included">✅</div>
                  </div>
                  
                  <div className="comparison-row">
                    <div className="comparison-feature">Analytics Dashboard</div>
                    <div className="comparison-value not-included">✗</div>
                    <div className="comparison-value not-included">✗</div>
                    <div className="comparison-value included">✅</div>
                  </div>
                  
                  <div className="comparison-row">
                    <div className="comparison-feature">Performance Metrics</div>
                    <div className="comparison-value not-included">✗</div>
                    <div className="comparison-value not-included">✗</div>
                    <div className="comparison-value included">✅</div>
                  </div>
                  
                  <div className="comparison-row">
                    <div className="comparison-feature">Export Reports (CSV/JSON)</div>
                    <div className="comparison-value not-included">✗</div>
                    <div className="comparison-value not-included">✗</div>
                    <div className="comparison-value included">✅</div>
                  </div>
                  
                  <div className="comparison-row">
                    <div className="comparison-feature">Email Support</div>
                    <div className="comparison-value not-included">✗</div>
                    <div className="comparison-value included">✅</div>
                    <div className="comparison-value included">✅</div>
                  </div>
                </div>
              )}
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

  // Upgrade Banner Component
  const UpgradeBanner = () => {
    if (!showUpgradeBanner || purchaseTier !== 'free') return null;
    
    const usagePercentage = siteLimit > 0 ? (competitors.length / siteLimit) * 100 : 0;
    
    return (
      <div className="upgrade-banner">
        <div className="banner-content">
          <div className="banner-icon">⚠️</div>
          <div className="banner-text">
            <h3>You're using {Math.round(usagePercentage)}% of your free tracking slots</h3>
            <p>Upgrade to Basic for 5 more sites, or Pro for 20 sites with analytics</p>
          </div>
          <div className="banner-actions">
            <button 
              className="banner-upgrade-btn"
              onClick={() => {
                setShowUpgradeBanner(false);
                setShowUpgradeModal(true);
              }}
            >
              Upgrade Now
            </button>
            <button 
              className="banner-dismiss-btn"
              onClick={() => setShowUpgradeBanner(false)}
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="app">
      <UpgradeModal />
      <UpgradeBanner />
      
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

      {/* Analytics Dashboard Panel */}
      <section className="analytics-section">
        <button 
          className="analytics-toggle"
          onClick={() => setShowChangelog(false)} // Hide changelog when opening analytics
        >
          📊 Analytics & Insights
        </button>
        <AnalyticsDashboard competitors={competitors} />
      </section>

      <style>{`
        /* MOBILE-FIRST RESET */
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          background: #0f1419; color: #e0e8f0; font-size: 16px;
        }
        .app { min-height: 100vh; background: #0f1419; }
        
        /* HEADER - MOBILE FIRST */
        header { 
          background: linear-gradient(135deg, #0f1419 0%, #1a2a3a 100%); 
          color: white; padding: 20px 16px; text-align: center; 
          box-shadow: 0 4px 12px rgba(0, 100, 200, 0.2); 
        }
        header h1 { 
          font-size: 24px; margin-bottom: 6px; font-weight: 700; line-height: 1.2;
        }
        header p { 
          color: #8fb5d9; font-size: 14px; margin: 0;
        }
        
        /* MAIN - MOBILE FIRST */
        main { 
          padding: 16px; max-width: 600px; margin: 0 auto; 
          padding-bottom: 60px; min-height: 100vh; background: #0f1419;
        }
        section { margin-bottom: 24px; }
        h2 { 
          font-size: 18px; margin-bottom: 16px; color: #e0f2ff; 
          font-weight: 600; line-height: 1.3;
        }
        
        /* MODAL STYLES - MOBILE FIRST */
        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.8); display: flex; align-items: flex-end;
          justify-content: center; z-index: 2000; animation: fadeIn 0.3s ease;
          backdrop-filter: blur(4px);
        }
        
        .modal-content {
          background: #1a2a3a; border-radius: 20px 20px 0 0; 
          box-shadow: 0 -20px 60px rgba(0, 100, 200, 0.3);
          max-width: 500px; width: 100%; max-height: 90vh; overflow-y: auto;
          animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
        }
        
        .modal-close {
          position: absolute; top: 16px; right: 16px;
          background: #2a3a4a; border: none; border-radius: 50%;
          width: 40px; height: 40px; font-size: 28px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.2s; min-height: 48px; min-width: 48px;
          z-index: 2001; color: #00d4ff;
        }
        
        .modal-close:hover { background: #3a4a5a; }
        
        .modal-header {
          background: linear-gradient(135deg, #0066cc 0%, #00d4ff 100%);
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
        
        .modal-body { padding: 20px 16px; background: #1a2a3a; }
        
        .current-plan {
          margin-bottom: 24px; text-align: center;
        }
        
        .plan-badge {
          display: inline-block; background: #00d4ff;
          padding: 8px 14px; border-radius: 20px; font-size: 12px;
          font-weight: 600; color: #0f1419; text-transform: uppercase;
          letter-spacing: 0.5px; margin-bottom: 12px;
        }
        
        .plan-card {
          background: linear-gradient(135deg, #1a3a4a 0%, #1a2a3a 100%);
          border: 2px solid #0066cc; border-radius: 12px; padding: 18px 16px;
          margin-bottom: 20px;
        }
        
        .plan-card.current {
          border: 2px solid #00d4ff; background: linear-gradient(135deg, #0a3a5a 0%, #001a3a 100%);
        }
        
        .plan-card h3 {
          font-size: 17px; margin: 0 0 14px 0; font-weight: 600;
          color: #e0f2ff; line-height: 1.3;
        }
        
        .plan-limit {
          display: flex; align-items: baseline; justify-content: center;
          gap: 12px; margin: 14px 0;
        }
        
        .limit-number {
          font-size: 32px; font-weight: 700; color: #00d4ff;
        }
        
        .limit-label {
          font-size: 15px; color: #8fb5d9; font-weight: 500;
        }
        
        .plan-desc {
          font-size: 14px; color: #8fb5d9; margin: 12px 0 0 0; line-height: 1.4;
        }
        
        .upgrade-options {
          display: flex; flex-direction: column; gap: 14px;
          margin-bottom: 20px;
        }
        
        .upgrade-option {
          border: 2px solid #0066cc; border-radius: 12px; padding: 16px;
          transition: all 0.3s ease;
          background: #0f1419;
        }
        
        .upgrade-option:hover {
          border-color: #00d4ff; background: #1a2a3a;
          box-shadow: 0 8px 16px rgba(0, 212, 255, 0.2);
        }
        
        .option-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          margin-bottom: 12px; gap: 12px;
        }
        
        .option-header h3 {
          font-size: 17px; margin: 0; font-weight: 600; color: #e0f2ff;
          line-height: 1.3;
        }
        
        .price {
          font-size: 20px; font-weight: 700; color: #00d4ff; white-space: nowrap;
        }
        
        .option-features {
          margin-bottom: 16px; font-size: 14px; color: #8fb5d9;
          line-height: 1.6;
        }
        
        .option-features p {
          margin: 8px 0;
        }
        
        .option-features .info-text {
          color: #5f8fb5; font-size: 13px; font-style: italic;
        }
        
        .upgrade-btn {
          width: 100%; background: linear-gradient(135deg, #0066cc 0%, #00d4ff 100%);
          color: white; border: 2px solid #00d4ff; border-radius: 12px; 
          padding: 16px 16px; min-height: 52px;
          font-weight: 700; font-size: 16px; cursor: pointer;
          transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3);
          display: flex; align-items: center; justify-content: center;
        }
        
        .upgrade-btn:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 12px 24px rgba(0, 212, 255, 0.5);
          border-color: #00ffff;
          background: linear-gradient(135deg, #0088dd 0%, #00ffff 100%);
        }
        
        .upgrade-btn:active:not(:disabled) {
          transform: translateY(-1px);
        }
        
        .upgrade-btn:disabled {
          opacity: 0.5; cursor: not-allowed; background: #3a4a5a; border-color: #5a6a7a;
        }
        
        .upgrade-btn.secondary {
          background: linear-gradient(135deg, #1a4a6a 0%, #0066cc 100%);
          border-color: #00a5cc;
        }
        
        .upgrade-btn.secondary:hover:not(:disabled) {
          background: linear-gradient(135deg, #1a6a8a 0%, #0088dd 100%);
          border-color: #00d4ff;
          box-shadow: 0 12px 24px rgba(0, 165, 204, 0.5);
        }
        
        .modal-footer {
          padding: 20px 16px; background: #1a2a3a; border-top: 1px solid #0066cc;
          border-radius: 0 0 20px 20px;
        }
        
        .footer-note {
          font-size: 13px; color: #5f8fb5; margin-bottom: 16px;
          text-align: center; font-style: italic; line-height: 1.4;
        }
        
        .continue-free-btn {
          width: 100%; background: linear-gradient(135deg, #00d4ff 0%, #00ffff 100%); color: #0f1419;
          border: 2px solid #00ffff; border-radius: 12px; 
          padding: 16px 16px; min-height: 52px;
          font-weight: 700; font-size: 16px; cursor: pointer;
          transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(0, 255, 255, 0.3);
          display: flex; align-items: center; justify-content: center;
        }
        
        .continue-free-btn:hover {
          background: linear-gradient(135deg, #00ffff 0%, #00ffff 100%);
          box-shadow: 0 12px 24px rgba(0, 255, 255, 0.5);
          transform: translateY(-3px);
          border-color: #ffffff;
        }
        
        .continue-free-btn:active {
          transform: translateY(-1px);
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
          display: block; font-size: 13px; font-weight: 600; color: #8fb5d9;
          text-align: left; margin-bottom: 8px; font-variant-numeric: tabular-nums;
        }
        
        .counter-bar {
          height: 8px; background: #2a3a4a; border-radius: 4px;
          overflow: hidden; margin-bottom: 8px;
        }
        
        .counter-fill {
          height: 100%; background: linear-gradient(90deg, #0066cc 0%, #00d4ff 100%);
          border-radius: 4px; transition: width 0.3s ease;
        }
        
        .counter-fill.full {
          background: linear-gradient(90deg, #ff3366 0%, #ff6688 100%);
          animation: pulse-red 1.5s infinite;
        }
        
        .counter-limit-reached {
          display: block; font-size: 12px; color: #ff6688; font-weight: 600;
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
          display: inline-block; background: linear-gradient(135deg, #0066cc 0%, #00d4ff 100%);
          color: #0f1419; padding: 8px 14px; border-radius: 20px;
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
          font-size: 13px; color: #8fb5d9; margin-top: 8px; 
          font-style: italic; line-height: 1.4;
        }
        input { 
          width: 100%; padding: 14px 16px; border: 1px solid #0066cc; 
          border-radius: 10px; font-size: 16px;
          transition: border-color 0.2s, box-shadow 0.2s;
          min-height: 48px; -webkit-appearance: none; appearance: none;
          background: #1a2a3a; color: #e0f2ff;
        }
        input::placeholder {
          color: #5f8fb5;
        }
        input:focus { 
          outline: none; border-color: #00d4ff; 
          box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.2); 
        }
        
        /* BUTTONS - MOBILE FIRST (FULL-WIDTH) */
        button { 
          padding: 14px 16px; background: linear-gradient(135deg, #0066cc 0%, #00a5cc 100%); color: white; 
          border: none; border-radius: 10px; 
          font-size: 16px; cursor: pointer; font-weight: 600;
          min-height: 48px; min-width: 48px; display: flex;
          align-items: center; justify-content: center;
          transition: all 0.2s ease; width: 100%;
        }
        button:hover:not(:disabled) { 
          background: linear-gradient(135deg, #0088dd 0%, #00d4ff 100%); transform: translateY(-2px); 
          box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3); 
        }
        button:active:not(:disabled) { transform: translateY(0); }
        button:disabled { opacity: 0.5; cursor: not-allowed; }
        
        .empty { color: #8fb5d9; text-align: center; padding: 40px 20px; background: #1a2a3a; border-radius: 12px; border: 1px solid #0066cc; }
        
        /* CHECK ALL SECTION - MOBILE FIRST */
        .check-all { 
          display: flex; flex-direction: column; gap: 12px; 
          margin-bottom: 20px;
        }
        .check-all-btn { 
          background: linear-gradient(135deg, #0066cc, #00d4ff); 
          width: 100%; box-shadow: 0 2px 8px rgba(0, 212, 255, 0.2); 
          padding: 14px 16px; min-height: 48px; font-size: 16px; color: white;
        }
        .check-all-btn:hover:not(:disabled) { 
          box-shadow: 0 4px 16px rgba(0, 212, 255, 0.4); 
        }
        .settings-btn { 
          background: #2a5a8a; width: 100%; padding: 14px 16px; 
          min-height: 48px; font-size: 16px;
        }
        .settings-btn:hover { background: #0066cc; }
        .last-check { 
          color: #8fb5d9; font-size: 13px; white-space: normal; 
          text-align: center; line-height: 1.4;
        }
        
        /* COMPETITOR LIST - MOBILE FIRST */
        ul { list-style: none; }
        .competitor-card { 
          background: #1a2a3a; padding: 16px; border-radius: 12px; 
          margin-bottom: 12px; display: flex; flex-direction: column; 
          gap: 12px;
          box-shadow: 0 2px 4px rgba(0, 100, 200, 0.2);
          border-left: 4px solid #00d4ff;
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .competitor-card:hover { 
          box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3); 
          transform: translateY(-1px);
        }
        .comp-info { flex: 1; }
        .comp-info h3 { 
          font-size: 18px; margin-bottom: 8px; font-weight: 600; 
          line-height: 1.3; color: #e0f2ff;
        }
        .comp-info a { 
          color: #00d4ff; font-size: 14px; text-decoration: none; 
          font-weight: 500; line-height: 1.4; word-break: break-all;
        }
        .comp-info a:hover { text-decoration: underline; }
        .comp-info .meta { 
          display: flex; gap: 12px; margin-top: 12px; font-size: 13px; 
          color: #8fb5d9; flex-wrap: wrap; align-items: center; line-height: 1.4;
        }
        .change-indicator { 
          margin-left: 6px; font-size: 16px; animation: pulse 1.5s infinite; 
        }
        .changes-count { 
          background: #ff8800; color: #0f1419; padding: 4px 10px; 
          border-radius: 12px; font-weight: 600; font-size: 13px;
        }
        .status-badge { 
          display: inline-block; padding: 6px 12px; border-radius: 20px; 
          text-transform: capitalize; font-weight: 600; font-size: 12px;
        }
        .status-badge[data-status="alive"] { background: #1aaa66; color: #00ff99; }
        .status-badge[data-status="down"] { background: #aa1a1a; color: #ff6666; }
        .status-badge[data-status="pending"] { background: #aa6600; color: #ffcc99; }
        
        /* ACTION BUTTONS - MOBILE FIRST (FULL-WIDTH STACK) */
        .comp-actions { 
          display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; 
          width: 100%;
        }
        .comp-actions .check { 
          background: linear-gradient(135deg, #0066cc 0%, #00a5cc 100%); padding: 14px 8px; font-size: 15px; 
          font-weight: 700; border-radius: 8px; min-height: 48px; width: 100%; color: white;
          display: flex; align-items: center; justify-content: center; cursor: pointer;
          transition: all 0.2s ease; box-shadow: 0 2px 8px rgba(0, 165, 204, 0.3);
        }
        .comp-actions .check:hover:not(:disabled) { 
          background: linear-gradient(135deg, #0088dd 0%, #00d4ff 100%);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 212, 255, 0.4);
        }
        .comp-actions .screenshot-btn {
          background: linear-gradient(135deg, #6600cc 0%, #9933ff 100%); padding: 14px 8px; font-size: 18px;
          font-weight: 700; border-radius: 8px; min-height: 48px; width: 100%; color: white;
          display: flex; align-items: center; justify-content: center; cursor: pointer;
          transition: all 0.2s ease; box-shadow: 0 2px 8px rgba(153, 51, 255, 0.3);
        }
        .comp-actions .screenshot-btn:hover { 
          background: linear-gradient(135deg, #7722dd 0%, #aa44ff 100%);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(170, 68, 255, 0.4);
        }
        .comp-actions .show-changes {
          background: linear-gradient(135deg, #cc6600 0%, #ff9900 100%); padding: 14px 8px; font-size: 15px; 
          font-weight: 700; border-radius: 8px; min-height: 48px; 
          width: 100%; white-space: nowrap; color: white;
          display: flex; align-items: center; justify-content: center; cursor: pointer;
          transition: all 0.2s ease; box-shadow: 0 2px 8px rgba(255, 153, 0, 0.3);
        }
        .comp-actions .show-changes:hover { 
          background: linear-gradient(135deg, #dd7711 0%, #ffaa11 100%);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 170, 17, 0.4);
        }
        .comp-actions .show-screenshots {
          background: linear-gradient(135deg, #00aa66 0%, #00dd99 100%); padding: 14px 8px; font-size: 15px;
          font-weight: 700; border-radius: 8px; min-height: 48px; width: 100%; color: #0f1419;
          display: flex; align-items: center; justify-content: center; cursor: pointer;
          transition: all 0.2s ease; box-shadow: 0 2px 8px rgba(0, 221, 153, 0.3);
        }
        .comp-actions .show-screenshots:hover { 
          background: linear-gradient(135deg, #00dd77 0%, #00ffaa 100%);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 255, 170, 0.4);
        }
        .comp-actions .remove { 
          background: linear-gradient(135deg, #aa0000 0%, #ff3333 100%); padding: 14px 8px; font-size: 18px; 
          border-radius: 8px; min-height: 48px; width: 100%; font-weight: 700;
          grid-column: 1 / -1; color: white;
          display: flex; align-items: center; justify-content: center; cursor: pointer;
          transition: all 0.2s ease; box-shadow: 0 2px 8px rgba(255, 51, 51, 0.3);
        }
        .comp-actions .remove:hover:not(:disabled) { 
          background: linear-gradient(135deg, #cc1111 0%, #ff6666 100%);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 102, 102, 0.4);
        }
        
        /* CHANGES PANEL - MOBILE FIRST */
        .changes-panel {
          background: #1a3a3a; border-radius: 0 0 12px 12px; 
          border: 1px solid #00aa88; border-top: none;
          padding: 16px; margin-bottom: 12px; margin-top: -4px; 
          border-left: 4px solid #00d4ff;
        }
        .changes-panel h4 { 
          margin-bottom: 14px; color: #00ffcc; font-size: 16px; 
          font-weight: 600; line-height: 1.3;
        }
        .changes-timeline { display: flex; flex-direction: column; gap: 12px; }
        .change-entry { 
          background: #0f1419; border-radius: 10px; padding: 14px; 
          border-left: 3px solid #00d4ff; font-size: 13px;
        }
        .change-time-header {
          display: flex; flex-direction: column; gap: 10px;
          margin-bottom: 10px;
        }
        .change-time { 
          font-weight: 600; color: #00ffcc; font-size: 13px; 
          text-transform: uppercase; letter-spacing: 0.5px;
        }
        .expand-detail-btn {
          background: linear-gradient(135deg, #00aa88 0%, #00ffcc 100%); color: #0f1419; border: none; border-radius: 6px;
          padding: 8px 12px; font-size: 12px; font-weight: 600; cursor: pointer;
          transition: background 0.2s; width: 100%; min-height: 44px;
        }
        .expand-detail-btn:hover { background: linear-gradient(135deg, #00dd99 0%, #00ffdd 100%); }
        
        .change-summary {
          display: flex; flex-direction: column; gap: 8px; margin-top: 10px;
          padding: 10px; background: #1a2a3a; border-radius: 6px;
        }
        .change-count {
          background: #ff9900; color: #0f1419; padding: 4px 8px;
          border-radius: 4px; font-weight: 600; font-size: 12px; 
          white-space: nowrap; text-align: center;
        }
        .change-preview {
          color: #8fb5d9; font-size: 13px; line-height: 1.4; word-break: break-word;
        }
        
        /* EXPANDED DETAILS VIEW - MOBILE FIRST */
        .expanded-details-view {
          margin-top: 12px; padding-top: 12px; border-top: 1px solid #00d4ff;
          display: flex; flex-direction: column; gap: 10px;
        }
        .no-diffs { 
          color: #8fb5d9; font-size: 13px; text-align: center; padding: 14px 0;
          font-style: italic; line-height: 1.4;
        }
        
        /* DIFF VIEWER STYLES - MOBILE FIRST */
        .diff-viewer {
          background: #1a2a4a; border: 1px solid #0066cc; border-radius: 8px;
          overflow: hidden; margin-bottom: 10px;
        }
        .diff-header {
          background: linear-gradient(90deg, #1a3a5a 0%, #1a2a4a 100%);
          padding: 12px; display: flex; flex-direction: column; gap: 8px;
          border-left: 4px solid #00d4ff; font-size: 13px; font-weight: 600;
          border-bottom: 1px solid #0066cc;
        }
        .diff-element {
          color: #00ffff; font-weight: 700; font-size: 14px; line-height: 1.3;
        }
        .diff-type-badge {
          background: #0066cc; color: #00ffff; padding: 4px 8px;
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
          border-bottom: 1px solid #0066cc;
        }
        .diff-side:last-child { border-bottom: none; }
        .diff-side.old { background: #2a1a1a; }
        .diff-side.new { background: #1a2a2a; }
        
        .diff-side-label {
          font-weight: 600; font-size: 12px; color: #8fb5d9; margin-bottom: 8px;
          text-transform: uppercase; letter-spacing: 0.5px;
        }
        .diff-value {
          font-family: 'Courier New', monospace; font-size: 12px;
          line-height: 1.5; color: #e0f2ff; word-wrap: break-word;
          padding: 10px; border-radius: 4px; background: rgba(15, 20, 25, 0.7);
        }
        .diff-value.old-value { 
          border-left: 3px solid #ff6688; color: #ff99aa;
        }
        .diff-value.new-value { 
          border-left: 3px solid #66ff99; color: #99ffcc;
        }
        
        .diff-arrow {
          display: none;
        }
        
        .diff-summary {
          padding: 12px; color: #8fb5d9; font-size: 13px;
          line-height: 1.5; background: #1a2a3a;
        }
        
        .snapshot-details { 
          margin-top: 10px; padding-top: 10px; border-top: 1px solid #00d4ff; 
          cursor: pointer; color: #00ffcc; font-weight: 500; user-select: none;
          font-size: 14px;
        }
        .snapshot-details:hover { color: #00ffff; }
        .snapshot-info { 
          margin-top: 10px; background: #0f1a2a; padding: 12px; border-radius: 6px; 
          font-family: monospace; font-size: 12px; color: #8fb5d9; line-height: 1.5;
        }
        .snapshot-info p { margin: 6px 0; }
        .snapshot-info .hash-display { color: #5f8fb5; font-size: 11px; }
        
        /* ALERT SETTINGS - MOBILE FIRST */
        .alert-settings { 
          background: #1a2a3a; padding: 20px 16px; border-radius: 12px; 
          margin-bottom: 20px; box-shadow: 0 4px 12px rgba(0, 100, 200, 0.2); 
          border-top: 4px solid #00d4ff;
        }
        .alert-settings h2 { margin-bottom: 20px; color: #e0f2ff; }
        
        .setting-group { margin-bottom: 20px; }
        .setting-group label { 
          display: block; font-weight: 600; margin-bottom: 10px; 
          color: #e0f2ff; font-size: 15px;
        }
        .alert-settings select { 
          width: 100%; padding: 12px 14px; border: 1px solid #0066cc; 
          border-radius: 10px; font-size: 16px; margin-bottom: 12px; 
          background: #0f1419; min-height: 48px; color: #e0f2ff;
          transition: border-color 0.2s; -webkit-appearance: none; appearance: none;
        }
        .alert-settings select:focus { outline: none; border-color: #00d4ff; }
        
        .checkbox-group { margin-bottom: 14px; }
        .checkbox-label { 
          display: flex; align-items: center; gap: 10px; 
          font-weight: 400 !important; cursor: pointer; padding: 10px; 
          border-radius: 8px; transition: background 0.2s; font-size: 15px; color: #e0f2ff;
        }
        .checkbox-label:hover { background: #1a3a4a; }
        .checkbox-label input[type="checkbox"] { 
          width: 20px; height: 20px; accent-color: #00d4ff; 
          cursor: pointer; flex-shrink: 0;
        }
        
        .notify-input { 
          width: 100%; padding: 12px 14px; border: 1px solid #0066cc; 
          border-radius: 10px; font-size: 16px; margin-bottom: 12px;
          min-height: 48px;
          transition: border-color 0.2s; -webkit-appearance: none; appearance: none;
          background: #0f1419; color: #e0f2ff;
        }
        .notify-input::placeholder { color: #5f8fb5; }
        .notify-input:focus { outline: none; border-color: #00d4ff; }
        
        .settings-summary { 
          background: #0f2a4a; padding: 14px 16px; border-radius: 10px; 
          margin-bottom: 16px; font-size: 13px; color: #00ffcc; 
          border-left: 3px solid #00d4ff; line-height: 1.5;
        }
        
        .settings-summary-collapsed { 
          background: #1a2a4a; padding: 14px 16px; border-radius: 10px; 
          margin-bottom: 20px; font-size: 13px; color: #00d4ff; 
          border-left: 3px solid #0066cc;
        }
        
        .saved-msg { 
          color: #00ff99; margin-top: 8px; font-weight: 600; 
          animation: fadeIn 0.3s ease; font-size: 14px;
        }
        
        .close-settings { 
          background: linear-gradient(135deg, #0066cc 0%, #00d4ff 100%); width: 100%; font-weight: 600; 
          padding: 14px 16px; min-height: 48px; font-size: 16px;
          margin-top: 16px; color: white;
        }
        .close-settings:hover { background: linear-gradient(135deg, #0088dd 0%, #00ffff 100%); }
        
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
          background: #1a2a3a; border-top: 2px solid #0066cc; 
          box-shadow: 0 -4px 12px rgba(0, 100, 200, 0.2);
          z-index: 999; max-height: 50vh;
        }
        
        .changelog-toggle {
          width: 100%; background: linear-gradient(135deg, #0f1419 0%, #1a2a3a 100%);
          color: #e0f2ff; border: none; border-radius: 0; padding: 14px 16px;
          font-size: 15px; font-weight: 600; cursor: pointer;
          display: flex; align-items: center; gap: 8px;
          transition: background 0.2s, box-shadow 0.2s;
          text-align: left; min-height: 48px;
        }
        
        .changelog-toggle:hover { 
          background: linear-gradient(135deg, #1a2a3a 0%, #0066cc 100%);
          box-shadow: inset 0 2px 8px rgba(0, 212, 255, 0.2);
        }
        
        .changelog-panel {
          background: #0f1419; border-top: 2px solid #00d4ff;
          display: flex; flex-direction: column;
          animation: slideUp 0.3s ease; max-height: calc(50vh - 50px);
        }
        
        .changelog-header {
          padding: 14px 16px; background: #1a2a3a; border-bottom: 1px solid #0066cc;
          flex-shrink: 0;
        }
        
        .changelog-header h3 {
          margin: 0 0 6px 0; font-size: 17px; color: #00ffcc;
          font-weight: 600; line-height: 1.3;
        }
        
        .changelog-description {
          margin: 0 0 12px 0; font-size: 13px; color: #8fb5d9;
          font-style: italic; line-height: 1.4;
        }
        
        .changelog-filters {
          display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
        }
        
        .changelog-filters label {
          font-weight: 600; font-size: 13px; color: #e0f2ff;
          white-space: nowrap;
        }
        
        .changelog-filter-select {
          flex: 1; min-width: 150px; padding: 8px 10px; 
          border: 1px solid #0066cc; border-radius: 6px; font-size: 13px; 
          background: #0f1419; cursor: pointer; color: #e0f2ff;
          transition: border-color 0.2s; -webkit-appearance: none; appearance: none;
        }
        
        .changelog-filter-select:focus {
          outline: none; border-color: #00d4ff;
        }
        
        .changelog-content {
          flex: 1; overflow-y: auto; padding: 0;
          background: #0f1419;
        }
        
        .changelog-entries {
          display: flex; flex-direction: column; gap: 0;
        }
        
        .changelog-entry {
          padding: 14px 16px; border-bottom: 1px solid #1a2a3a;
          transition: background 0.2s;
          border-left: 4px solid #0066cc;
        }
        
        .changelog-entry:hover {
          background: #1a2a3a;
        }
        
        .changelog-entry-header {
          display: flex; gap: 10px; flex-wrap: wrap;
          margin-bottom: 10px; font-size: 12px; font-weight: 600;
        }
        
        .changelog-time {
          color: #8fb5d9; text-transform: uppercase;
          letter-spacing: 0.5px; white-space: nowrap; flex: 0 0 auto;
        }
        
        .changelog-competitor {
          background: #0066cc; color: #00ffff;
          padding: 3px 8px; border-radius: 4px;
          white-space: nowrap; font-size: 12px;
        }
        
        .changelog-severity {
          padding: 3px 8px; border-radius: 4px; font-weight: 700;
          font-size: 11px;
        }
        
        .changelog-severity[data-severity="high"] {
          background: #aa1a1a; color: #ff6666;
        }
        
        .changelog-severity[data-severity="medium"] {
          background: #aa6600; color: #ffcc99;
        }
        
        .changelog-severity[data-severity="low"] {
          background: #1aaa66; color: #00ff99;
        }
        
        .changelog-similarity {
          background: #1a2a3a; color: #8fb5d9;
          padding: 3px 8px; border-radius: 4px;
          font-family: monospace; font-size: 12px;
        }
        
        .changelog-entry-body {
          font-size: 13px; color: #8fb5d9; line-height: 1.4;
        }
        
        .changelog-url {
          margin-bottom: 8px; word-break: break-all;
        }
        
        .changelog-url code,
        .changelog-values code {
          background: #1a2a3a; padding: 2px 6px;
          border-radius: 3px; font-family: 'Courier New', monospace;
          color: #ff6688; font-size: 12px;
          word-break: break-all;
        }
        
        .changelog-change {
          margin-bottom: 8px; line-height: 1.5;
        }
        
        .change-detail {
          color: #e0f2ff; font-weight: 500; word-break: break-word;
        }
        
        .changelog-values {
          display: flex; flex-direction: column; gap: 8px; margin-top: 8px;
        }
        
        .old-val, .new-val {
          padding: 8px; border-radius: 4px;
          font-size: 12px; word-break: break-word;
        }
        
        .old-val {
          background: #2a1a1a; color: #ff99aa;
        }
        
        .new-val {
          background: #1a2a2a; color: #99ffcc;
        }
        
        .changelog-empty {
          padding: 30px 20px; text-align: center;
          color: #5f8fb5; font-style: italic; font-size: 13px;
          line-height: 1.5;
        }
        
        .changelog-footer {
          padding: 12px 16px; background: #1a2a3a;
          border-top: 1px solid #0066cc; display: flex;
          justify-content: space-between; align-items: center;
          flex-shrink: 0; flex-wrap: wrap; gap: 10px;
        }
        
        .changelog-export {
          background: linear-gradient(135deg, #0066cc 0%, #00a5cc 100%); color: white; border: none;
          border-radius: 6px; padding: 8px 12px;
          font-size: 13px; font-weight: 600; cursor: pointer;
          transition: background 0.2s; min-height: 40px;
        }
        
        .changelog-export:hover {
          background: linear-gradient(135deg, #0088dd 0%, #00d4ff 100%);
        }
        
        .changelog-info {
          font-size: 12px; color: #5f8fb5;
        }

        /* SCREENSHOT STYLES - MOBILE FIRST */
        .screenshot-btn {
          background: linear-gradient(135deg, #6600cc 0%, #9933ff 100%); border: none; color: white; 
          font-weight: 600; cursor: pointer; border-radius: 8px;
          transition: background 0.2s; min-height: 44px; width: 100%;
        }
        .screenshot-btn:hover { background: linear-gradient(135deg, #7722dd 0%, #aa44ff 100%); }
        .screenshot-btn:disabled { 
          background: #3a4a5a; cursor: not-allowed; opacity: 0.6; 
        }

        .screenshots-panel {
          background: #1a2a3a; padding: 16px; margin-top: 12px;
          border: 1px solid #0066cc; border-radius: 12px;
          border-left: 4px solid #00d4ff;
        }

        .screenshots-panel h4 {
          margin: 0 0 16px 0; font-size: 16px; color: #00ffff;
          display: flex; align-items: center; gap: 8px; font-weight: 600;
          line-height: 1.3;
        }

        .screenshots-panel h5 {
          margin: 16px 0 12px 0; font-size: 13px; color: #8fb5d9;
          text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;
        }

        .screenshots-container {
          display: flex; flex-direction: column; gap: 20px;
        }

        .screenshots-comparison {
          border: 1px solid #0066cc; border-radius: 10px;
          padding: 14px; background: #0f1a2a;
        }

        .comparison-slider {
          position: relative; width: 100%; margin-top: 12px;
          display: flex; align-items: center; overflow: hidden;
          border-radius: 8px; background: #1a2a3a;
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
          background: #00d4ff; cursor: col-resize;
          z-index: 3; display: flex; align-items: center;
          justify-content: center; user-select: none;
        }

        .slider-handle {
          background: #0066cc; color: #00d4ff; padding: 6px 8px;
          border-radius: 4px; font-weight: bold; font-size: 13px;
          box-shadow: 0 2px 8px rgba(0, 212, 255, 0.3);
          position: absolute; transform: translateX(-50%);
        }

        .comparison-info {
          margin-top: 10px; font-size: 13px; color: #8fb5d9;
          text-align: center; line-height: 1.4;
        }

        .screenshot-gallery {
          display: flex; flex-direction: column; gap: 12px;
        }

        .screenshot-item {
          border: 1px solid #0066cc; border-radius: 10px;
          overflow: hidden; display: flex; flex-direction: column;
          transition: box-shadow 0.2s;
        }

        .screenshot-item:hover {
          box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3);
        }

        .screenshot-thumb {
          width: 100%; height: 200px; object-fit: cover;
          background: #1a2a3a; cursor: pointer;
        }

        .screenshot-meta {
          padding: 10px 12px; background: #0f1a2a;
          font-size: 12px; color: #8fb5d9; display: flex;
          flex-direction: column; gap: 4px;
        }

        .screenshot-time {
          font-weight: 600; color: #00ffff; font-size: 13px;
        }

        .screenshot-size, .screenshot-res {
          color: #5f8fb5; font-family: monospace; font-size: 12px;
        }

        .screenshot-actions {
          padding: 10px 12px; background: #1a2a3a;
          display: flex; gap: 8px; justify-content: center;
          border-top: 1px solid #0066cc;
        }

        .screenshot-download {
          background: transparent; border: none; font-size: 18px; color: #00d4ff;
          cursor: pointer; padding: 8px 12px; border-radius: 6px;
          transition: background 0.2s; min-height: 44px; min-width: 44px;
          display: flex; align-items: center; justify-content: center;
        }

        .screenshot-download:hover {
          background: #0066cc;
        }
        
        /* UPGRADE BANNER - MOBILE FIRST */
        .upgrade-banner {
          background: linear-gradient(135deg, #ff6600 0%, #ff9933 100%);
          padding: 14px 16px; margin-bottom: 20px;
          border-radius: 12px; box-shadow: 0 4px 12px rgba(255, 102, 0, 0.3);
          animation: slideDown 0.3s ease;
        }
        
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .banner-content {
          display: flex; flex-direction: column; gap: 12px;
          align-items: flex-start;
        }
        
        .banner-icon {
          font-size: 24px; animation: pulse 1.5s infinite;
        }
        
        .banner-text {
          flex: 1;
        }
        
        .banner-text h3 {
          margin: 0 0 4px 0; font-size: 15px; font-weight: 600;
          color: white; line-height: 1.3;
        }
        
        .banner-text p {
          margin: 0; font-size: 13px; color: rgba(255, 255, 255, 0.9);
          line-height: 1.4;
        }
        
        .banner-actions {
          display: flex; gap: 10px; width: 100%;
        }
        
        .banner-upgrade-btn {
          flex: 1; background: white; color: #ff6600;
          border: none; border-radius: 8px; padding: 10px 14px;
          font-weight: 700; font-size: 14px; cursor: pointer;
          transition: all 0.2s; min-height: 40px;
        }
        
        .banner-upgrade-btn:hover {
          transform: translateY(-2px); box-shadow: 0 4px 12px rgba(255, 102, 0, 0.4);
          background: #ffe6cc;
        }
        
        .banner-dismiss-btn {
          flex: 0 0 auto; background: rgba(255, 255, 255, 0.2);
          color: white; border: 1px solid white; border-radius: 8px;
          padding: 10px 14px; font-weight: 600; font-size: 13px;
          cursor: pointer; transition: all 0.2s; min-height: 40px;
          white-space: nowrap;
        }
        
        .banner-dismiss-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        
        /* ANALYTICS DASHBOARD STYLES - MOBILE FIRST */
        .analytics-section {
          margin-top: 30px; margin-bottom: 20px;
        }
        
        .analytics-toggle {
          width: 100%; background: linear-gradient(135deg, #1a2a3a 0%, #0f1419 100%);
          color: #e0f2ff; border: 2px solid #0066cc; border-radius: 12px;
          padding: 14px 16px; font-size: 15px; font-weight: 600;
          cursor: pointer; transition: all 0.2s; min-height: 48px;
          text-align: left;
        }
        
        .analytics-toggle:hover {
          background: linear-gradient(135deg, #0066cc 0%, #1a2a3a 100%);
          box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3);
        }
        
        .analytics-dashboard {
          display: flex; flex-direction: column; gap: 16px;
          margin-top: 16px; animation: slideUp 0.3s ease;
        }
        
        .analytics-grid {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 12px; margin-bottom: 8px;
        }
        
        .analytics-card {
          background: linear-gradient(135deg, #1a2a3a 0%, #0f1419 100%);
          border: 1px solid #0066cc; border-radius: 12px; padding: 16px;
          box-shadow: 0 2px 8px rgba(0, 100, 200, 0.2);
          transition: all 0.2s ease;
        }
        
        .analytics-card:hover {
          box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3);
          border-color: #00d4ff;
        }
        
        .analytics-card h4 {
          margin: 0 0 12px 0; font-size: 15px; color: #00ffff;
          font-weight: 600; line-height: 1.3;
        }
        
        .metric-card {
          display: flex; flex-direction: column; align-items: center;
          text-align: center; padding: 16px 12px;
          background: linear-gradient(135deg, #0f2a4a 0%, #1a2a3a 100%);
          border-left: 4px solid #00d4ff;
        }
        
        .metric-value {
          font-size: 28px; font-weight: 700; color: #00d4ff;
          margin: 8px 0; font-variant-numeric: tabular-nums;
        }
        
        .metric-value-text {
          font-size: 13px; color: #8fb5d9; margin: 10px 0;
          word-break: break-word; line-height: 1.4;
        }
        
        .metric-detail {
          font-size: 12px; color: #5f8fb5; margin: 0;
          text-transform: uppercase; letter-spacing: 0.5px;
        }
        
        .performance-card {
          grid-column: 1 / -1;
        }
        
        .performance-table {
          display: flex; flex-direction: column; gap: 12px;
        }
        
        .performance-row {
          display: flex; flex-direction: column; gap: 8px;
          background: #0f1419; padding: 12px; border-radius: 8px;
          border-left: 3px solid #00d4ff;
        }
        
        .perf-site {
          display: flex; flex-direction: column; gap: 4px;
        }
        
        .perf-name {
          font-weight: 600; color: #e0f2ff; font-size: 14px;
        }
        
        .perf-domain {
          font-size: 12px; color: #8fb5d9; font-family: monospace;
        }
        
        .perf-metrics {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 8px; margin-top: 8px;
        }
        
        .perf-item {
          display: flex; flex-direction: column; gap: 2px;
          font-size: 12px;
        }
        
        .perf-label {
          color: #5f8fb5; text-transform: uppercase;
          letter-spacing: 0.5px; font-weight: 600;
        }
        
        .perf-value {
          color: #00ffcc; font-weight: 600; font-family: monospace;
        }
        
        .perf-status {
          display: inline-block; padding: 3px 6px; border-radius: 4px;
          font-size: 11px; font-weight: 600;
          background: #2a3a4a; color: #00d4ff;
        }
        
        .perf-status.alive {
          background: #1aaa66; color: #00ff99;
        }
        
        .perf-status.down {
          background: #aa1a1a; color: #ff6666;
        }
        
        .analytics-empty {
          color: #5f8fb5; font-size: 13px; text-align: center;
          padding: 16px; font-style: italic; line-height: 1.4;
        }
        
        .heatmap-card {
          grid-column: 1 / -1;
        }
        
        .heatmap-description {
          font-size: 12px; color: #8fb5d9; margin: -10px 0 14px 0;
          line-height: 1.4;
        }
        
        .heatmap-container {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(28px, 1fr));
          gap: 4px; margin-bottom: 12px;
        }
        
        .heatmap-cell {
          aspect-ratio: 1; border-radius: 4px;
          border: 1px solid #0066cc; display: flex;
          align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s;
          font-size: 10px; color: #e0f2ff; font-weight: 600;
          min-height: 30px;
        }
        
        .heatmap-cell:hover {
          border-color: #00d4ff; box-shadow: 0 2px 8px rgba(0, 212, 255, 0.4);
          transform: scale(1.1);
        }
        
        .heatmap-count {
          font-size: 10px; font-weight: 700; font-variant-numeric: tabular-nums;
        }
        
        .heatmap-legend {
          display: flex; gap: 12px; font-size: 12px; color: #8fb5d9;
          flex-wrap: wrap; margin-top: 10px; padding-top: 12px;
          border-top: 1px solid #0066cc;
        }
        
        .export-card {
          grid-column: 1 / -1;
        }
        
        .export-description {
          font-size: 12px; color: #8fb5d9; margin: -10px 0 14px 0;
          line-height: 1.4;
        }
        
        .export-buttons {
          display: flex; flex-direction: column; gap: 10px;
          margin-bottom: 12px;
        }
        
        .export-btn {
          background: linear-gradient(135deg, #0066cc 0%, #00a5cc 100%);
          color: white; border: none; border-radius: 8px;
          padding: 12px 14px; min-height: 44px;
          font-size: 14px; font-weight: 600; cursor: pointer;
          transition: all 0.2s; width: 100%;
        }
        
        .export-btn:hover {
          background: linear-gradient(135deg, #0088dd 0%, #00d4ff 100%);
          box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3);
          transform: translateY(-2px);
        }
        
        .export-btn.csv-btn {
          background: linear-gradient(135deg, #0066cc 0%, #0088dd 100%);
        }
        
        .export-btn.json-btn {
          background: linear-gradient(135deg, #00d4ff 0%, #0066cc 100%);
        }
        
        .export-info {
          font-size: 12px; color: #5f8fb5; margin: 0;
          text-align: center; font-style: italic; line-height: 1.4;
        }
        
        .premium-notice {
          grid-column: 1 / -1; background: linear-gradient(135deg, #1a0f2a 0%, #0f1a3a 100%);
          border: 2px solid #9933ff;
        }
        
        .premium-text {
          font-size: 13px; color: #b5a0cc; margin: 0 0 12px 0;
          line-height: 1.5;
        }
        
        .premium-text strong {
          color: #00ffff;
        }
        
        .premium-upgrade-btn {
          background: linear-gradient(135deg, #9933ff 0%, #ff0099 100%);
          color: white; border: none; border-radius: 8px;
          padding: 12px 14px; min-height: 44px;
          font-size: 14px; font-weight: 600; cursor: pointer;
          transition: all 0.2s; width: 100%;
        }
        
        .premium-upgrade-btn:hover {
          background: linear-gradient(135deg, #aa44ff 0%, #ff33aa 100%);
          box-shadow: 0 4px 12px rgba(255, 0, 153, 0.3);
          transform: translateY(-2px);
        }
        
        /* TIER COMPARISON TABLE - MOBILE FIRST */
        .tier-comparison {
          grid-column: 1 / -1; margin-top: 12px;
        }
        
        .comparison-table {
          background: #0f1419; border-radius: 10px;
          overflow: hidden; margin-bottom: 12px;
        }
        
        .comparison-header {
          display: grid; grid-template-columns: 1.5fr 1fr 1fr 1fr;
          gap: 12px; padding: 12px; background: #1a2a3a;
          border-bottom: 2px solid #0066cc; font-weight: 600;
          font-size: 12px; color: #8fb5d9; text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .comparison-row {
          display: grid; grid-template-columns: 1.5fr 1fr 1fr 1fr;
          gap: 12px; padding: 12px; border-bottom: 1px solid #0066cc;
          align-items: center; font-size: 13px;
        }
        
        .comparison-row:last-child {
          border-bottom: none;
        }
        
        .comparison-feature {
          color: #e0f2ff; font-weight: 500;
        }
        
        .comparison-value {
          text-align: center; color: #00d4ff; font-weight: 600;
          font-variant-numeric: tabular-nums;
        }
        
        .comparison-value.included {
          color: #00ff99; font-size: 18px;
        }
        
        .comparison-value.not-included {
          color: #666; font-size: 18px;
        }
        
        /* SUBSCRIPTION OPTIONS - MOBILE FIRST */
        .subscription-options {
          display: flex; flex-direction: column; gap: 12px;
          margin-top: 12px;
        }
        
        .subscription-option {
          border: 2px solid #0066cc; border-radius: 10px;
          padding: 14px; background: #0f1419;
          transition: all 0.2s;
        }
        
        .subscription-option:hover {
          border-color: #00d4ff; box-shadow: 0 4px 12px rgba(0, 212, 255, 0.2);
          background: #1a2a3a;
        }
        
        .subscription-option.featured {
          border: 2px solid #ff0099; background: #1a0f2a;
          box-shadow: 0 4px 12px rgba(255, 0, 153, 0.2);
        }
        
        .sub-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          margin-bottom: 10px;
        }
        
        .sub-name {
          font-size: 16px; font-weight: 600; color: #e0f2ff;
        }
        
        .sub-featured-badge {
          background: #ff0099; color: white; padding: 4px 8px;
          border-radius: 4px; font-size: 11px; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.5px;
        }
        
        .sub-price {
          font-size: 24px; font-weight: 700; color: #00d4ff;
          margin-bottom: 8px;
        }
        
        .sub-period {
          font-size: 12px; color: #5f8fb5; text-transform: uppercase;
          letter-spacing: 0.5px; margin-bottom: 10px;
        }
        
        .sub-features {
          font-size: 12px; color: #8fb5d9; margin-bottom: 12px;
          line-height: 1.6; display: flex; flex-direction: column; gap: 6px;
        }
        
        .sub-features li {
          display: flex; align-items: flex-start; gap: 8px;
        }
        
        .sub-features li:before {
          content: "✅"; color: #00ff99; flex-shrink: 0;
        }
        
        .sub-btn {
          width: 100%; background: linear-gradient(135deg, #0066cc 0%, #00d4ff 100%);
          color: white; border: none; border-radius: 8px; padding: 12px 14px;
          font-weight: 600; font-size: 14px; cursor: pointer;
          transition: all 0.2s; min-height: 44px;
        }
        
        .sub-btn:hover {
          background: linear-gradient(135deg, #0088dd 0%, #00ffff 100%);
          transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0, 212, 255, 0.4);
        }
        
        .sub-btn.featured {
          background: linear-gradient(135deg, #ff0099 0%, #ff33aa 100%);
          font-size: 15px; font-weight: 700;
        }
        
        .sub-btn.featured:hover {
          background: linear-gradient(135deg, #ff33aa 0%, #ff66bb 100%);
          box-shadow: 0 4px 12px rgba(255, 0, 153, 0.4);
        }
        
        .sub-savings {
          background: #1a0f2a; color: #ff99aa;
          padding: 8px; border-radius: 6px; font-size: 11px;
          font-weight: 600; text-align: center; margin-top: 8px;
          border: 1px solid #ff0099;
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
          
          /* ANALYTICS DESKTOP */
          .analytics-grid {
            grid-template-columns: repeat(4, 1fr);
          }
          
          .metric-card {
            padding: 20px 16px;
          }
          
          .metric-value {
            font-size: 32px;
          }
          
          .performance-row {
            flex-direction: row; align-items: center;
            gap: 16px;
          }
          
          .perf-site {
            min-width: 150px;
          }
          
          .perf-metrics {
            flex: 1; grid-template-columns: repeat(4, 1fr);
          }
          
          .heatmap-container {
            grid-template-columns: repeat(14, 1fr);
          }
          
          .export-buttons {
            flex-direction: row;
          }
          
          .export-btn {
            flex: 1; width: auto;
          }
          
          /* UPGRADE BANNER DESKTOP */
          .banner-content {
            flex-direction: row; align-items: center; gap: 16px;
          }
          
          .banner-actions {
            flex-direction: row; width: auto; gap: 10px; margin-left: auto;
          }
          
          .banner-upgrade-btn {
            flex: 0 1 auto; width: auto;
          }
          
          /* TIER COMPARISON DESKTOP */
          .subscription-options {
            flex-direction: row; gap: 14px;
          }
          
          .subscription-option {
            flex: 1;
          }
          
          .comparison-header {
            grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
          }
          
          .comparison-row {
            grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
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