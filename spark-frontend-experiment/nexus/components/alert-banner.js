const DISMISSED_KEY = 'workbook-dismissed-banners';

/**
 * Create a banner DOM element.
 *
 * @param {object} options
 * @param {string} [options.id] - Unique banner ID for dismiss tracking
 * @param {string} options.message - Banner message text
 * @param {string} [options.variant='info'] - One of: info, warning, danger, success
 * @param {boolean} [options.dismissible=true] - Whether to show a dismiss button
 * @param {number} [options.autoDismiss=0] - Auto-dismiss after N ms (0 = never)
 * @returns {HTMLDivElement}
 */
export function createBanner({
  id,
  message,
  variant = 'info',
  dismissible = true,
  autoDismiss = 0,
}) {
  const banner = document.createElement('div');
  banner.className = `alert-banner alert-${variant}`;
  banner.dataset.bannerId = id || `banner-${Date.now()}`;

  const msgSpan = document.createElement('span');
  msgSpan.className = 'alert-message';
  msgSpan.textContent = message;
  banner.appendChild(msgSpan);

  if (dismissible) {
    const btn = document.createElement('button');
    btn.className = 'alert-dismiss';
    btn.setAttribute('aria-label', 'Dismiss');
    btn.textContent = '\u00D7';
    btn.addEventListener('click', () => {
      dismissBanner(banner);
    });
    banner.appendChild(btn);
  }

  if (autoDismiss > 0) {
    setTimeout(() => {
      if (banner.parentNode) {
        banner.parentNode.removeChild(banner);
      }
    }, autoDismiss);
  }

  return banner;
}

/**
 * Show a banner by prepending it to a container.
 * Returns null if the banner was previously dismissed.
 *
 * @param {HTMLElement} container
 * @param {object} options - Same options as createBanner
 * @returns {HTMLDivElement|null}
 */
export function showBanner(container, options) {
  if (options.id && isDismissed(options.id)) {
    return null;
  }
  const banner = createBanner(options);
  container.prepend(banner);
  return banner;
}

/**
 * Dismiss a banner: remove from DOM and record in sessionStorage.
 *
 * @param {HTMLDivElement} banner
 */
export function dismissBanner(banner) {
  const bannerId = banner.dataset.bannerId;
  if (banner.parentNode) {
    banner.parentNode.removeChild(banner);
  }
  if (bannerId) {
    const dismissed = getDismissedList();
    if (!dismissed.includes(bannerId)) {
      dismissed.push(bannerId);
    }
    sessionStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed));
  }
}

/**
 * Check if a banner ID has been dismissed in this session.
 *
 * @param {string} id
 * @returns {boolean}
 */
export function isDismissed(id) {
  if (!id) return false;
  return getDismissedList().includes(id);
}

/**
 * Clear all dismissed banner state from sessionStorage.
 */
export function clearDismissed() {
  sessionStorage.removeItem(DISMISSED_KEY);
}

/**
 * Internal helper to read the dismissed list from sessionStorage.
 *
 * @returns {string[]}
 */
function getDismissedList() {
  try {
    const raw = sessionStorage.getItem(DISMISSED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
