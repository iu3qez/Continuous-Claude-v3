/**
 * Tour Hint - Persistent "Guided Tour" pill button.
 *
 * Displays a small floating pill in the bottom-left corner of every page.
 * Clicking it starts the guided tour (arc 1). Dismissible via an (x) button
 * or after completing/starting a tour. Dismissal persists in localStorage.
 *
 * Shows a "Demo Mode" badge when a tour is active.
 *
 * Usage: include on any page with:
 *   <script type="module" src="components/tour-hint.js"></script>
 */

import { startArc } from '../demo/guided-mode.js';

const STORAGE_KEY = 'nexus-tour-dismissed';

let _initialized = false;
let _startArcFn = startArc;

// ── Public API ────────────────────────────────────────────────

/**
 * Reset internal state. Exposed for testing only.
 * Also removes any DOM elements created by init().
 */
export function _reset() {
  _initialized = false;
  _startArcFn = startArc;
  // Clean up DOM elements from previous init
  document.querySelectorAll('[data-tour-hint]').forEach(el => el.remove());
  document.querySelectorAll('[data-demo-badge]').forEach(el => el.remove());
}

/**
 * Override the startArc function. Exposed for testing only.
 * @param {Function} fn - Replacement for startArc
 */
export function _setStartArc(fn) {
  _startArcFn = fn;
}

/**
 * Check if the tour hint has been dismissed.
 * @returns {boolean}
 */
export function isDismissed() {
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

/**
 * Dismiss the tour hint and persist the choice.
 */
export function dismiss() {
  localStorage.setItem(STORAGE_KEY, 'true');
}

/**
 * Show the "Demo Mode" badge in the top-right area.
 * Idempotent: skips if already shown.
 */
export function showDemoBadge() {
  if (document.querySelector('[data-demo-badge]')) return;

  const badge = document.createElement('div');
  badge.setAttribute('data-demo-badge', '');
  badge.classList.add('demo-badge');
  badge.textContent = 'Demo Mode';
  document.body.appendChild(badge);
}

/**
 * Hide the "Demo Mode" badge.
 */
export function hideDemoBadge() {
  const badge = document.querySelector('[data-demo-badge]');
  if (badge) badge.remove();
}

/**
 * Called when the guided tour ends (exit or complete).
 * Hides the demo badge and marks tour as dismissed.
 */
export function onTourEnd() {
  hideDemoBadge();
  dismiss();
}

/**
 * Create the tour hint pill button element.
 * @returns {HTMLButtonElement}
 */
export function createTourHintButton() {
  const btn = document.createElement('button');
  btn.classList.add('tour-hint-pill');
  btn.setAttribute('data-tour-hint', '');
  btn.setAttribute('aria-label', 'Start guided tour of the application');
  btn.setAttribute('type', 'button');

  // Compass/tour icon (SVG)
  const iconSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>';

  // Label
  const label = document.createElement('span');
  label.classList.add('tour-hint-label');
  label.textContent = 'Guided Tour';

  // Dismiss (x) button
  const dismissBtn = document.createElement('span');
  dismissBtn.setAttribute('data-tour-dismiss', '');
  dismissBtn.classList.add('tour-hint-dismiss');
  dismissBtn.setAttribute('role', 'button');
  dismissBtn.setAttribute('aria-label', 'Dismiss tour hint');
  dismissBtn.innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

  btn.innerHTML = iconSvg;
  btn.appendChild(label);
  btn.appendChild(dismissBtn);

  return btn;
}

/**
 * Inject component-specific CSS into the document head.
 * Idempotent: skips if already injected.
 */
export function injectTourStyles() {
  if (document.querySelector('[data-tour-hint-styles]')) return;

  const style = document.createElement('style');
  style.setAttribute('data-tour-hint-styles', '');
  style.textContent = `
/* ── Tour Hint Pill Button ──────────────────────────────────── */

.tour-hint-pill {
  position: fixed;
  bottom: 24px;
  left: 24px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 9999px;
  background: var(--surface-elevated, #1F1F23);
  border: 1px solid var(--border, #27272A);
  color: var(--text-secondary, #9CA3AF);
  font-family: var(--font-body, 'Inter', sans-serif);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  z-index: 999;
  transition: all var(--transition-base, 150ms ease);
  box-shadow: var(--shadow-md, 0 4px 12px rgba(0, 0, 0, 0.3));
}

.tour-hint-pill:hover {
  background: var(--accent-subtle, rgba(79, 70, 229, 0.08));
  border-color: var(--accent, #4F46E5);
  color: var(--accent, #4F46E5);
  transform: translateY(-1px);
  box-shadow: var(--shadow-lg, 0 8px 24px rgba(0, 0, 0, 0.4));
}

.tour-hint-pill:active {
  transform: translateY(0);
}

.tour-hint-pill svg {
  flex-shrink: 0;
  pointer-events: none;
}

.tour-hint-label {
  pointer-events: none;
}

/* Dismiss (x) inside the pill */
.tour-hint-dismiss {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 4px;
  padding: 2px;
  border-radius: 50%;
  opacity: 0.5;
  transition: opacity var(--transition-fast, 100ms ease),
              background var(--transition-fast, 100ms ease);
  cursor: pointer;
}

.tour-hint-dismiss:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.1);
}

/* ── Demo Mode Badge ────────────────────────────────────────── */

.demo-badge {
  position: fixed;
  top: 12px;
  right: 80px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 9999px;
  background: var(--accent, #4F46E5);
  color: #FFFFFF;
  font-family: var(--font-mono, 'JetBrains Mono', monospace);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  z-index: 1010;
  pointer-events: none;
  box-shadow: var(--shadow-md, 0 4px 12px rgba(0, 0, 0, 0.3));
  animation: demoBadgeFadeIn 300ms ease forwards;
}

@keyframes demoBadgeFadeIn {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ── Reduced Motion ─────────────────────────────────────────── */

@media (prefers-reduced-motion: reduce) {
  .tour-hint-pill,
  .tour-hint-pill:hover,
  .tour-hint-pill:active {
    transform: none;
    transition-duration: 0.01ms;
  }

  .demo-badge {
    animation: none;
  }
}
`;

  document.head.appendChild(style);
}

/**
 * Initialize the tour hint component.
 * Idempotent: does nothing on subsequent calls.
 */
export function init() {
  if (_initialized) return;
  _initialized = true;

  injectTourStyles();

  // Don't render if previously dismissed
  if (isDismissed()) return;

  const btn = createTourHintButton();
  document.body.appendChild(btn);

  // Handle dismiss (x) click
  const dismissEl = btn.querySelector('[data-tour-dismiss]');
  if (dismissEl) {
    dismissEl.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent triggering tour start
      btn.style.display = 'none';
      dismiss();
    });
  }

  // Handle main button click: start tour
  btn.addEventListener('click', () => {
    _startArcFn(1);
    showDemoBadge();
    btn.style.display = 'none';
  });
}

// ── Auto-init on import (for script-tag usage) ─────────────────
if (typeof window !== 'undefined' && document.body) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init());
  } else {
    init();
  }
}
