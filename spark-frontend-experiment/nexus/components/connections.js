/**
 * Connection Tile Component
 * Creates DOM tiles for connection states: connected, syncing, error, paused, pending, not-connected
 */

/**
 * Status configuration mapping
 */
const STATUS_CONFIG = {
  connected: {
    dotColor: 'bg-green-500',
    textColor: 'text-green-400',
    label: 'Connected',
    actionLabel: 'Manage',
    actionType: 'manage',
    buttonStyle: 'border',
  },
  syncing: {
    dotColor: null, // uses spinner instead
    textColor: 'text-blue-400',
    label: 'Syncing',
    actionLabel: null,
    actionType: null,
    buttonStyle: null,
  },
  error: {
    dotColor: 'bg-red-500',
    textColor: 'text-red-400',
    label: 'Error',
    actionLabel: 'Retry',
    actionType: 'retry',
    buttonStyle: 'danger',
  },
  paused: {
    dotColor: 'bg-gray-500',
    textColor: 'text-gray-400',
    label: 'Paused',
    actionLabel: 'Resume',
    actionType: 'resume',
    buttonStyle: 'border',
  },
  pending: {
    dotColor: 'bg-yellow-500',
    textColor: 'text-yellow-400',
    label: 'Pending',
    actionLabel: 'Cancel',
    actionType: 'cancel',
    buttonStyle: 'border',
  },
  'not-connected': {
    dotColor: 'bg-gray-500',
    textColor: 'text-gray-400',
    label: 'Not Connected',
    actionLabel: 'Connect',
    actionType: 'connect',
    buttonStyle: 'primary',
  },
};

/**
 * Create a status indicator element.
 * For 'syncing' state, creates a spinner. For others, creates a colored dot.
 */
function createStatusIndicator(status) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG['not-connected'];
  const wrapper = document.createElement('div');
  wrapper.className = 'flex items-center gap-1.5';
  wrapper.setAttribute('data-status', status);

  if (status === 'syncing') {
    const spinner = document.createElement('span');
    spinner.className = 'conn-spinner w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full inline-block';
    spinner.style.animation = 'spin 1s linear infinite';
    wrapper.appendChild(spinner);
  } else {
    const dot = document.createElement('span');
    dot.className = `w-2 h-2 rounded-full ${config.dotColor}`;
    wrapper.appendChild(dot);
  }

  const label = document.createElement('span');
  label.className = `text-xs ${config.textColor}`;
  label.textContent = config.label;
  wrapper.appendChild(label);

  return wrapper;
}

/**
 * Create an action button for the tile based on status.
 */
function createActionButton(status) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG['not-connected'];
  if (!config.actionLabel) return null;

  const btn = document.createElement('button');
  btn.setAttribute('data-action', config.actionType);

  if (config.buttonStyle === 'primary') {
    btn.className = 'w-full py-1.5 rounded bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors';
  } else if (config.buttonStyle === 'danger') {
    btn.className = 'w-full py-1.5 rounded border border-red-500 text-sm text-red-400 hover:border-red-400 hover:text-red-300 transition-colors';
  } else {
    btn.className = 'w-full py-1.5 rounded border border-border text-sm text-txt-secondary hover:border-accent hover:text-accent transition-colors';
  }

  btn.textContent = config.actionLabel;
  return btn;
}

/**
 * Transition a tile to syncing state.
 * Replaces the status indicator and removes the action button.
 */
function transitionToSyncing(tile) {
  // Replace status indicator
  const oldStatus = tile.querySelector('[data-status]');
  if (oldStatus) {
    const newIndicator = createStatusIndicator('syncing');
    oldStatus.replaceWith(newIndicator);
  }

  // Remove old action button, replace with disabled syncing text
  const actionBtn = tile.querySelector('[data-action]');
  if (actionBtn) {
    actionBtn.remove();
  }
}

/**
 * Create a connection tile DOM element.
 *
 * @param {Object} config
 * @param {string} config.name - Platform name
 * @param {string} config.abbr - 2-letter abbreviation
 * @param {string} config.color - Tailwind bg class for the icon
 * @param {string} config.status - One of: connected, syncing, error, paused, pending, not-connected
 * @param {string} config.metric - Metric text
 * @param {string} config.lastSync - Last sync text
 * @param {string} [config.errorMessage] - Error message (for error state)
 * @returns {HTMLElement}
 */
export function createConnectionTile(config) {
  const { name, abbr, color, status, metric, lastSync, errorMessage } = config;

  const tile = document.createElement('div');
  tile.className = 'card conn-tile p-5';
  tile.setAttribute('data-platform', name.toLowerCase());

  // Header row: icon + name + status
  const header = document.createElement('div');
  header.className = 'flex items-center gap-3 mb-3';

  // Icon
  const icon = document.createElement('div');
  icon.className = `w-10 h-10 rounded-lg ${color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`;
  icon.textContent = abbr;

  // Name + status column
  const info = document.createElement('div');
  info.className = 'min-w-0';

  const nameEl = document.createElement('h3');
  nameEl.className = 'font-semibold text-base truncate';
  nameEl.textContent = name;

  const statusIndicator = createStatusIndicator(status);

  info.appendChild(nameEl);
  info.appendChild(statusIndicator);

  header.appendChild(icon);
  header.appendChild(info);
  tile.appendChild(header);

  // Metric line
  const metricEl = document.createElement('p');
  metricEl.className = 'text-sm text-txt-secondary mb-1';
  metricEl.textContent = metric;
  tile.appendChild(metricEl);

  // Last sync / error message line
  const syncEl = document.createElement('p');
  syncEl.className = 'text-xs text-txt-tertiary mb-3';
  if (status === 'error' && errorMessage) {
    syncEl.textContent = errorMessage;
  } else {
    syncEl.textContent = lastSync;
  }
  tile.appendChild(syncEl);

  // Action button
  const actionBtn = createActionButton(status);
  if (actionBtn) {
    // Wire up state transitions
    if (status === 'error') {
      actionBtn.addEventListener('click', () => transitionToSyncing(tile));
    } else if (status === 'paused') {
      actionBtn.addEventListener('click', () => transitionToSyncing(tile));
    }
    tile.appendChild(actionBtn);
  }

  return tile;
}
