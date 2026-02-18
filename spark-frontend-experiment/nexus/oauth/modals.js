import WorkbookDemo from '../components/state.js';

const PLATFORMS = {
  salesforce: { id: 'salesforce', name: 'Salesforce', color: '#1798C1', permissions: ['Access contacts and accounts', 'Read opportunities and pipeline', 'View activities and tasks', 'Access reports and dashboards'], metrics: { contacts: 342, deals: 28, pipeline: '$1.2M' } },
  slack: { id: 'slack', name: 'Slack', color: '#611F69', permissions: ['View messages and files', 'View people in workspace', 'Post messages as Workbook', 'View workspace activity'], metrics: { channels: 23, messages: '1.2K', members: 48 } },
  microsoft: { id: 'microsoft', name: 'Microsoft 365', color: '#0078D4', permissions: ['Read your calendar', 'Read your email', 'Access SharePoint files', 'Read Teams messages'], metrics: { emails: 156, events: 34, files: 89 } },
  google: { id: 'google', name: 'Google Workspace', color: '#4285F4', permissions: ['View Google Calendar', 'View Google Drive files', 'View Gmail messages', 'View contacts'], metrics: { events: 28, files: 145, contacts: 234 } },
  jira: { id: 'jira', name: 'Jira', color: '#0052CC', permissions: ['Read projects and issues', 'Read sprints and boards', 'Create and update issues'], metrics: { projects: 4, issues: 89, sprints: 3 } },
  hubspot: { id: 'hubspot', name: 'HubSpot', color: '#FF7A59', permissions: ['Access contacts and companies', 'Read deals and pipeline', 'View marketing analytics', 'Read tickets'], metrics: { contacts: 567, deals: 34, campaigns: 12 } },
  quickbooks: { id: 'quickbooks', name: 'QuickBooks', color: '#2CA01C', permissions: ['View financial reports', 'Read invoices and expenses', 'Access P&L and balance sheet'], metrics: { invoices: 45, expenses: 78, reports: 12 } },
  notion: { id: 'notion', name: 'Notion', color: '#000000', permissions: ['Read pages and databases', 'Search workspace content'], metrics: { pages: 156, databases: 8 } },
};

const connectionState = {};
let currentOverlay = null;

export function getPlatforms() {
  return Object.keys(PLATFORMS);
}

export function getPlatformConfig(id) {
  return PLATFORMS[id] || null;
}

export function isConnected(platformId) {
  return !!connectionState[platformId];
}

export function getConnectedCount() {
  return Object.values(connectionState).filter(Boolean).length;
}

export function getConnectionState() {
  return { ...connectionState };
}

export function connectPlatform(platformId) {
  connectionState[platformId] = true;
  WorkbookDemo.notify('connectionChange', { platform: platformId, connected: true });
}

export function disconnectPlatform(platformId) {
  connectionState[platformId] = false;
  WorkbookDemo.notify('connectionChange', { platform: platformId, connected: false });
}

export function showOAuth(platformId) {
  const platform = PLATFORMS[platformId];
  if (!platform) return null;

  // Remove any existing overlay
  closeModal();

  // Create overlay element
  const overlay = document.createElement('div');
  overlay.className = 'oauth-overlay';
  overlay.setAttribute('data-state', 'loading');
  overlay.setAttribute('data-platform', platformId);

  // Build loading content
  overlay.innerHTML = buildLoadingContent(platform);

  document.body.appendChild(overlay);
  currentOverlay = overlay;

  // After 500ms, transition to consent screen
  setTimeout(() => {
    if (!currentOverlay || currentOverlay !== overlay) return;
    overlay.setAttribute('data-state', 'consent');
    overlay.innerHTML = buildConsentContent(platform);

    // Attach authorize handler
    const authorizeBtn = overlay.querySelector('[data-action="authorize"]');
    if (authorizeBtn) {
      authorizeBtn.addEventListener('click', () => {
        overlay.setAttribute('data-state', 'connecting');
        overlay.innerHTML = buildConnectingContent(platform);

        // After 2s, transition to scanning
        setTimeout(() => {
          if (!currentOverlay || currentOverlay !== overlay) return;
          overlay.setAttribute('data-state', 'scanning');
          overlay.innerHTML = buildScanningContent(platform);

          // After 3s, transition to connected
          setTimeout(() => {
            if (!currentOverlay || currentOverlay !== overlay) return;
            overlay.setAttribute('data-state', 'connected');
            overlay.innerHTML = buildConnectedContent(platform);
            connectPlatform(platformId);
          }, 3000);
        }, 2000);
      });
    }
  }, 500);

  return overlay;
}

export function closeModal() {
  if (currentOverlay && currentOverlay.parentNode) {
    currentOverlay.parentNode.removeChild(currentOverlay);
  }
  currentOverlay = null;
}

function buildLoadingContent(platform) {
  return `<div class="oauth-modal">
    <div class="oauth-loading">
      <div class="spinner"></div>
      <p>Connecting to ${platform.name}...</p>
    </div>
  </div>`;
}

function buildConsentContent(platform) {
  const permissionsList = platform.permissions
    .map(p => `<li>${p}</li>`)
    .join('');

  return `<div class="oauth-modal">
    <div class="oauth-consent">
      <h2>Connect ${platform.name}</h2>
      <p>Workbook would like to:</p>
      <ul class="permissions-list">${permissionsList}</ul>
      <div class="oauth-actions">
        <button data-action="authorize" style="background:${platform.color}">Authorize</button>
        <button data-action="cancel">Cancel</button>
      </div>
    </div>
  </div>`;
}

function buildConnectingContent(platform) {
  return `<div class="oauth-modal">
    <div class="oauth-connecting">
      <div class="spinner"></div>
      <p>Authorizing with ${platform.name}...</p>
    </div>
  </div>`;
}

function buildScanningContent(platform) {
  return `<div class="oauth-modal">
    <div class="oauth-scanning">
      <div class="spinner"></div>
      <p>Scanning ${platform.name} data...</p>
    </div>
  </div>`;
}

function buildConnectedContent(platform) {
  return `<div class="oauth-modal">
    <div class="oauth-connected">
      <div class="checkmark">&#10003;</div>
      <h2>${platform.name} Connected</h2>
      <button data-action="close">Done</button>
    </div>
  </div>`;
}
