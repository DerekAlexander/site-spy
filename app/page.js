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

export default function Home() {
  const [competitors, setCompetitors] = useState([]);
  const [newUrl, setNewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(null); // ID of competitor being checked
  const [lastCheckAll, setLastCheckAll] = useState(null);
  const [alertSettings, setAlertSettings] = useState(DEFAULT_ALERT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

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

  // Check a single competitor site
  const checkSite = async (competitor) => {
    setChecking(competitor.id);
    try {
      // Simple fetch to check if site is alive and get basic info
      const response = await fetch(competitor.url, { method: 'HEAD' });
      const now = new Date().toISOString();
      const status = response.ok ? 'alive' : 'down';
      
      // Update competitor with new check time
      const updated = competitors.map(c => {
        if (c.id === competitor.id) {
          return {
            ...c,
            lastChecked: now,
            status,
            // Could add snapshot comparison here in future
          };
        }
        return c;
      });
      
      saveCompetitors(updated);
    } catch (error) {
      // Site is down or unreachable
      const now = new Date().toISOString();
      const updated = competitors.map(c => {
        if (c.id === competitor.id) {
          return {
            ...c,
            lastChecked: now,
            status: 'down',
            error: error.message
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
                  Content changes (coming soon)
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
                <li key={comp.id} className="competitor-card">
                  <div className="comp-info">
                    <h3>{getStatusIcon(comp.status)} {comp.name}</h3>
                    <a href={comp.url} target="_blank" rel="noopener">{comp.domain}</a>
                    <p className="meta">
                      <span className="status-badge" data-status={comp.status || 'pending'}>{comp.status || 'pending'}</span>
                      <span>Checked: {formatTime(comp.lastChecked)}</span>
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
                    <button className="remove" onClick={() => removeCompetitor(comp.id)}>×</button>
                  </div>
                </li>
              ))}
            </ul>
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
        .input-group { display: flex; gap: 10px; }
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
        .comp-info .meta { display: flex; gap: 12px; margin-top: 8px; font-size: 12px; color: #888; flex-wrap: wrap; }
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
        .comp-actions .remove { 
          background: #ff4444; padding: 8px 12px; font-size: 14px; width: 36px; 
          border-radius: 6px; font-weight: 600;
        }
        .comp-actions .remove:hover:not(:disabled) { background: #cc0000; }
        
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
        
        /* Responsive */
        @media (max-width: 500px) {
          main { padding: 12px; padding-bottom: 30px; }
          header { padding: 16px; }
          header h1 { font-size: 22px; }
          .competitor-card { flex-direction: column; align-items: flex-start; }
          .comp-actions { width: 100%; margin-top: 12px; }
          .comp-actions .check { flex: 1; }
          .input-group { flex-direction: column; }
          input { width: 100%; }
          button { width: 100%; }
        }
      `}</style>
    </div>
  );
}