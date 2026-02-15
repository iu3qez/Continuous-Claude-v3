/**
 * AI Floating Button & Slide-in Chat Panel
 *
 * Self-contained component: creates a fixed-position FAB (bottom-right)
 * and a 400px slide-in panel with contextual AI chat messages.
 *
 * Usage: include on any page with:
 *   <script type="module" src="components/ai-floating-button.js"></script>
 *
 * The component auto-initializes on import. It will NOT render on
 * meeting-detail.html (which has its own inline AI chat).
 */

// ── Page context detection ───────────────────────────────────

const PAGE_CONTEXTS = {
  dashboard: 'Dashboard',
  meetings: 'Meetings',
  actions: 'Actions',
  decisions: 'Decisions',
  proposals: 'Proposals',
  calendar: 'Calendar',
  agents: 'Agents',
  connections: 'Connections',
  workspaces: 'Workspaces',
  settings: 'Settings',
  marketplace: 'Marketplace',
  'my-work': 'My Work',
  'elt-rollup': 'ELT Rollup',
};

/**
 * Detect the current page context from document.title or pathname.
 * @returns {string} Human-readable page name
 */
export function detectPageContext() {
  // Try pathname first (more reliable)
  const path = window.location.pathname.toLowerCase();
  for (const [key, label] of Object.entries(PAGE_CONTEXTS)) {
    if (path.includes(key)) return label;
  }

  // Fall back to document.title
  const title = document.title.toLowerCase();
  for (const [key, label] of Object.entries(PAGE_CONTEXTS)) {
    if (title.includes(key)) return label;
  }

  // Extract from title pattern "X | Workbook"
  const match = document.title.match(/(.+?)(?:\s*\||\s*$)/);
  if (match) return match[1].trim();

  return 'Workspace';
}

// ── Contextual greeting messages ─────────────────────────────

const CONTEXTUAL_MESSAGES = {
  Dashboard: [
    { role: 'ai', text: "Good morning! I've analyzed your workspace. 3 overdue actions need attention." },
    { role: 'ai', text: 'Your team velocity is up 12% this week. Want a detailed breakdown?' },
  ],
  Meetings: [
    { role: 'ai', text: 'You have 3 meetings today. Want me to prep briefings?' },
    { role: 'ai', text: "I've pulled context from recent actions and decisions for each meeting." },
  ],
  Actions: [
    { role: 'ai', text: '23 active actions across 4 workspaces. 5 are overdue.' },
    { role: 'ai', text: 'Would you like me to prioritize these by impact?' },
  ],
  Decisions: [
    { role: 'ai', text: '8 decisions this month. 1 is pending your review.' },
    { role: 'ai', text: 'I can summarize the context for any pending decision.' },
  ],
};

const DEFAULT_MESSAGES = [
  { role: 'ai', text: "I'm here to help. Ask me anything about your workspace." },
];

/**
 * Get contextual greeting messages for a page.
 * @param {string} pageContext - The detected page name
 * @returns {Array<{role: string, text: string}>}
 */
export function getContextualMessages(pageContext) {
  return CONTEXTUAL_MESSAGES[pageContext] || DEFAULT_MESSAGES;
}

// ── Should the FAB appear on this page? ──────────────────────

/**
 * Returns false for pages that have their own inline AI chat.
 * @returns {boolean}
 */
export function shouldShow() {
  const path = window.location.pathname.toLowerCase();
  if (path.includes('meeting-detail')) return false;
  return true;
}

// ── Typing indicator ─────────────────────────────────────────

/**
 * Show a thinking indicator (3 animated dots) in the messages area.
 * @param {HTMLElement} panel
 */
export function showTyping(panel) {
  hideTyping(panel);
  const messages = panel.querySelector('[data-ai-messages]');
  if (!messages) return;

  const indicator = document.createElement('div');
  indicator.classList.add('ai-fab-typing');
  indicator.setAttribute('data-ai-typing', '');

  for (let i = 0; i < 3; i++) {
    const dot = document.createElement('span');
    dot.classList.add('ai-fab-dot');
    dot.setAttribute('data-dot', '');
    indicator.appendChild(dot);
  }

  messages.appendChild(indicator);
  messages.scrollTop = messages.scrollHeight;
}

/**
 * Remove the typing indicator.
 * @param {HTMLElement} panel
 */
export function hideTyping(panel) {
  const indicator = panel.querySelector('[data-ai-typing]');
  if (indicator) indicator.remove();
}

// ── Panel open/close ─────────────────────────────────────────

/**
 * Open the chat panel: update context, populate messages if needed.
 * @param {HTMLElement} panel
 */
export function openPanel(panel) {
  const context = detectPageContext();

  // Update context indicator
  const ctxEl = panel.querySelector('[data-ai-context]');
  if (ctxEl) {
    ctxEl.textContent = 'Context: ' + context;
  }

  // Populate initial messages if empty
  const messagesArea = panel.querySelector('[data-ai-messages]');
  if (messagesArea && messagesArea.children.length === 0) {
    const msgs = getContextualMessages(context);
    msgs.forEach((msg) => {
      const bubble = createMessageBubble(msg.role, msg.text);
      messagesArea.appendChild(bubble);
    });
  }

  panel.setAttribute('aria-hidden', 'false');

  // Show overlay
  const overlay = document.querySelector('[data-ai-overlay]');
  if (overlay) overlay.setAttribute('data-visible', 'true');
}

/**
 * Close the chat panel.
 * @param {HTMLElement} panel
 */
export function closePanel(panel) {
  panel.setAttribute('aria-hidden', 'true');

  const overlay = document.querySelector('[data-ai-overlay]');
  if (overlay) overlay.setAttribute('data-visible', 'false');
}

// ── DOM creation helpers ─────────────────────────────────────

/**
 * Create a single chat message bubble.
 */
function createMessageBubble(role, text) {
  const wrapper = document.createElement('div');
  wrapper.classList.add('ai-fab-message', 'ai-fab-message--' + role);

  const bubble = document.createElement('div');
  bubble.classList.add('ai-fab-bubble');
  bubble.textContent = text;
  wrapper.appendChild(bubble);

  return wrapper;
}

/**
 * Create the floating action button.
 * @returns {HTMLButtonElement}
 */
export function createFloatingButton() {
  const btn = document.createElement('button');
  btn.classList.add('ai-fab-button');
  btn.setAttribute('data-ai-fab', '');
  btn.setAttribute('aria-label', 'Open Workbook AI assistant');
  btn.setAttribute('type', 'button');

  // Sparkle SVG icon
  btn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z"/></svg>';

  return btn;
}

/**
 * Create the slide-in chat panel.
 * @returns {HTMLElement}
 */
export function createChatPanel() {
  const panel = document.createElement('div');
  panel.classList.add('ai-fab-panel');
  panel.setAttribute('data-ai-panel', '');
  panel.setAttribute('aria-hidden', 'true');
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Workbook AI Chat');

  // ── Header ─────────────────────────────
  const header = document.createElement('div');
  header.classList.add('ai-fab-panel-header');
  header.setAttribute('data-ai-panel-header', '');

  const title = document.createElement('div');
  title.classList.add('ai-fab-panel-title');

  const titleIcon = document.createElement('span');
  titleIcon.classList.add('ai-fab-panel-title-icon');
  titleIcon.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z"/></svg>';
  title.appendChild(titleIcon);

  const titleText = document.createElement('span');
  titleText.textContent = 'Workbook AI';
  title.appendChild(titleText);

  header.appendChild(title);

  const closeBtn = document.createElement('button');
  closeBtn.classList.add('ai-fab-panel-close');
  closeBtn.setAttribute('data-ai-panel-close', '');
  closeBtn.setAttribute('aria-label', 'Close AI panel');
  closeBtn.setAttribute('type', 'button');
  closeBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  header.appendChild(closeBtn);

  panel.appendChild(header);

  // ── Context indicator ──────────────────
  const ctxIndicator = document.createElement('div');
  ctxIndicator.classList.add('ai-fab-context');
  ctxIndicator.setAttribute('data-ai-context', '');
  ctxIndicator.textContent = 'Context: Workspace';
  panel.appendChild(ctxIndicator);

  // ── Messages area ──────────────────────
  const messagesArea = document.createElement('div');
  messagesArea.classList.add('ai-fab-messages');
  messagesArea.setAttribute('data-ai-messages', '');
  panel.appendChild(messagesArea);

  // ── Input area ─────────────────────────
  const inputArea = document.createElement('div');
  inputArea.classList.add('ai-fab-input-area');

  const input = document.createElement('input');
  input.type = 'text';
  input.classList.add('ai-fab-input');
  input.setAttribute('data-ai-input', '');
  input.placeholder = 'Ask about this page...';
  inputArea.appendChild(input);

  const sendBtn = document.createElement('button');
  sendBtn.classList.add('ai-fab-send');
  sendBtn.setAttribute('data-ai-send', '');
  sendBtn.setAttribute('type', 'button');
  sendBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>';
  inputArea.appendChild(sendBtn);

  // Wire send behavior
  const sendMessage = () => {
    const text = input.value.trim();
    if (!text) return;

    // Add user message
    const userBubble = createMessageBubble('user', text);
    messagesArea.appendChild(userBubble);
    messagesArea.scrollTop = messagesArea.scrollHeight;
    input.value = '';

    // Show typing, then respond after a simulated delay
    showTyping(panel);
    setTimeout(() => {
      hideTyping(panel);
      const aiBubble = createMessageBubble('ai', "I'm processing your request. In a full deployment, I'd connect to your workspace data to answer: \"" + text + '"');
      messagesArea.appendChild(aiBubble);
      messagesArea.scrollTop = messagesArea.scrollHeight;
    }, 1200);
  };

  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  panel.appendChild(inputArea);

  return panel;
}

// ── Styles injection ─────────────────────────────────────────

/**
 * Inject component-specific CSS into the document head.
 * Idempotent: skips if already injected.
 */
export function injectStyles() {
  if (document.querySelector('[data-ai-fab-styles]')) return;

  const style = document.createElement('style');
  style.setAttribute('data-ai-fab-styles', '');
  style.textContent = `
/* ── AI Floating Action Button ─────────────────────────────── */

@keyframes aiFabPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes aiFabDotBounce {
  0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
  40% { transform: translateY(-6px); opacity: 1; }
}

.ai-fab-button {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full, 9999px);
  background: var(--accent, #4F46E5);
  color: #FFFFFF;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-lg, 0 8px 24px rgba(0, 0, 0, 0.5));
  z-index: 1000;
  animation: aiFabPulse 3s ease-in-out infinite;
  transition: background var(--transition-fast, 100ms ease),
              transform var(--transition-fast, 100ms ease);
}

.ai-fab-button:hover {
  background: var(--accent-hover, #6366F1);
  transform: scale(1.1);
  animation: none;
}

.ai-fab-button:active {
  transform: scale(0.97);
}

.ai-fab-button svg {
  width: 24px;
  height: 24px;
  pointer-events: none;
}

/* ── Overlay ───────────────────────────────────────────────── */

.ai-fab-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1001;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--transition-slow, 200ms ease);
}

.ai-fab-overlay[data-visible="true"] {
  opacity: 1;
  pointer-events: auto;
}

/* ── Slide-in Chat Panel ───────────────────────────────────── */

.ai-fab-panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 400px;
  max-width: 100vw;
  background: var(--surface, #18181B);
  border-left: 1px solid var(--border, #27272A);
  z-index: 1002;
  display: flex;
  flex-direction: column;
  transform: translateX(100%);
  transition: transform var(--transition-slow, 200ms ease);
  box-shadow: var(--shadow-lg, 0 8px 24px rgba(0, 0, 0, 0.5));
}

.ai-fab-panel[aria-hidden="false"] {
  transform: translateX(0);
}

/* ── Panel Header ──────────────────────────────────────────── */

.ai-fab-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border, #27272A);
  flex-shrink: 0;
}

.ai-fab-panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--txt-primary, #F0EFED);
  font-family: var(--font-body, 'Inter', sans-serif);
  font-size: 15px;
  font-weight: 600;
}

.ai-fab-panel-title-icon {
  color: var(--accent, #4F46E5);
  display: flex;
  align-items: center;
}

.ai-fab-panel-close {
  background: none;
  border: none;
  color: var(--txt-secondary, #918F8A);
  cursor: pointer;
  padding: 4px;
  border-radius: var(--radius-sm, 4px);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color var(--transition-fast, 100ms ease),
              background var(--transition-fast, 100ms ease);
}

.ai-fab-panel-close:hover {
  color: var(--txt-primary, #F0EFED);
  background: var(--surface-hover, #252529);
}

/* ── Context Indicator ─────────────────────────────────────── */

.ai-fab-context {
  padding: 8px 20px;
  font-family: var(--font-mono, 'JetBrains Mono', monospace);
  font-size: 11px;
  color: var(--accent, #4F46E5);
  background: var(--accent-subtle, rgba(79, 70, 229, 0.08));
  border-bottom: 1px solid var(--border, #27272A);
  flex-shrink: 0;
}

/* ── Messages Area ─────────────────────────────────────────── */

.ai-fab-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ai-fab-message {
  display: flex;
}

.ai-fab-message--ai {
  justify-content: flex-start;
}

.ai-fab-message--user {
  justify-content: flex-end;
}

.ai-fab-bubble {
  max-width: 85%;
  padding: 10px 14px;
  border-radius: var(--radius-lg, 8px);
  font-family: var(--font-body, 'Inter', sans-serif);
  font-size: 13px;
  line-height: 1.5;
}

.ai-fab-message--ai .ai-fab-bubble {
  background: var(--surface-elevated, #1F1F23);
  color: var(--txt-primary, #F0EFED);
  border-bottom-left-radius: 2px;
}

.ai-fab-message--user .ai-fab-bubble {
  background: var(--accent, #4F46E5);
  color: #FFFFFF;
  border-bottom-right-radius: 2px;
}

/* ── Typing Indicator ──────────────────────────────────────── */

.ai-fab-typing {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 10px 14px;
  background: var(--surface-elevated, #1F1F23);
  border-radius: var(--radius-lg, 8px);
  border-bottom-left-radius: 2px;
  width: fit-content;
}

.ai-fab-dot {
  width: 6px;
  height: 6px;
  background: var(--txt-secondary, #918F8A);
  border-radius: 50%;
  animation: aiFabDotBounce 1.4s ease-in-out infinite;
}

.ai-fab-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.ai-fab-dot:nth-child(3) {
  animation-delay: 0.4s;
}

/* ── Input Area ────────────────────────────────────────────── */

.ai-fab-input-area {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--border, #27272A);
  flex-shrink: 0;
}

.ai-fab-input {
  flex: 1;
  background: var(--surface-elevated, #1F1F23);
  border: 1px solid var(--border, #27272A);
  border-radius: var(--radius-md, 6px);
  color: var(--txt-primary, #F0EFED);
  font-family: var(--font-body, 'Inter', sans-serif);
  font-size: 13px;
  padding: 10px 14px;
  outline: none;
  transition: border-color var(--transition-fast, 100ms ease);
}

.ai-fab-input::placeholder {
  color: var(--txt-tertiary, #6E6D69);
}

.ai-fab-input:focus {
  border-color: var(--accent, #4F46E5);
}

.ai-fab-send {
  background: var(--accent, #4F46E5);
  border: none;
  color: #FFFFFF;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md, 6px);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background var(--transition-fast, 100ms ease);
}

.ai-fab-send:hover {
  background: var(--accent-hover, #6366F1);
}

.ai-fab-send svg {
  width: 16px;
  height: 16px;
  pointer-events: none;
}
`;

  document.head.appendChild(style);
}

// ── Initialization ───────────────────────────────────────────

let _initialized = false;

/**
 * Reset internal state. Exposed for testing only.
 */
export function _reset() {
  _initialized = false;
}

/**
 * Initialize the floating button and chat panel.
 * Idempotent: does nothing on subsequent calls.
 */
export function init() {
  if (_initialized) return;
  _initialized = true;

  injectStyles();

  // Create overlay
  const overlay = document.createElement('div');
  overlay.classList.add('ai-fab-overlay');
  overlay.setAttribute('data-ai-overlay', '');
  overlay.setAttribute('data-visible', 'false');
  document.body.appendChild(overlay);

  // Create panel
  const panel = createChatPanel();
  document.body.appendChild(panel);

  // Create FAB
  const fab = createFloatingButton();
  document.body.appendChild(fab);

  // Wire events
  fab.addEventListener('click', () => openPanel(panel));

  const closeBtn = panel.querySelector('[data-ai-panel-close]');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => closePanel(panel));
  }

  overlay.addEventListener('click', () => closePanel(panel));
}

// ── Auto-init on import (for script-tag usage) ───────────────
// Only auto-init if running in a browser with a document body.
// Tests import the module without auto-init by resetting _initialized.
if (typeof window !== 'undefined' && document.body && shouldShow()) {
  // Defer to avoid blocking page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init());
  } else {
    init();
  }
}
