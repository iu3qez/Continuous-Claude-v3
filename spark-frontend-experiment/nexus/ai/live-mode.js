import WorkbookDemo from '../components/state.js';

const LIVE_TIMEOUT_MS = 5000;

/**
 * Returns true when AI mode is 'live' (connected to Express server).
 */
export function isLiveMode() {
  return WorkbookDemo.aiMode === 'live';
}

/**
 * Toggles between scripted and live AI modes.
 * Bound to Ctrl+Shift+L in the UI layer.
 */
export function toggleLiveMode() {
  WorkbookDemo.toggleAiMode();
}

/**
 * Sends a query to the live /api/chat endpoint.
 * Returns parsed JSON on success, null on error or timeout.
 *
 * @param {string} message - User query text
 * @param {object} context - Page context (page, industry, persona, etc.)
 * @returns {Promise<object|null>}
 */
export async function sendLiveQuery(message, context) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LIVE_TIMEOUT_MS);

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, context }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    // Network error, AbortError (timeout), or JSON parse failure
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Renders or removes a "LIVE" badge inside the given container
 * based on current AI mode.
 *
 * @param {HTMLElement} container
 */
export function setLiveBadge(container) {
  const existing = container.querySelector('.live-badge');
  if (existing) {
    existing.remove();
  }

  if (!isLiveMode()) {
    return;
  }

  const badge = document.createElement('span');
  badge.className = 'live-badge';
  badge.textContent = 'LIVE';
  container.appendChild(badge);
}
