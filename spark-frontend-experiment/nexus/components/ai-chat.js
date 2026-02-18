import { getResponse } from '../ai/response-engine.js';
import WorkbookDemo from './state.js';

const MODES = ['meeting-prep', 'action-tracker', 'research'];

/**
 * Format a timestamp for display (HH:MM).
 */
function formatTime(date) {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Create a single message DOM element.
 */
function createMessageEl(role, text) {
  const wrapper = document.createElement('div');
  wrapper.classList.add('chat-message', `chat-message--${role}`);
  wrapper.setAttribute('data-role', role);
  wrapper.setAttribute('data-message-text', text);

  const bubble = document.createElement('div');
  bubble.classList.add('chat-bubble');
  bubble.textContent = text;
  wrapper.appendChild(bubble);

  const ts = document.createElement('span');
  ts.classList.add('chat-timestamp');
  ts.setAttribute('data-timestamp', '');
  ts.textContent = formatTime(new Date());
  wrapper.appendChild(ts);

  if (role === 'ai') {
    const chipArea = document.createElement('div');
    chipArea.classList.add('chat-tool-chips');
    chipArea.setAttribute('data-tool-chips', '');
    wrapper.appendChild(chipArea);
  }

  return wrapper;
}

/**
 * Create the chat panel DOM structure.
 * Includes mode selector tabs, scrollable message area, and input area with send button.
 */
export function createChatPanel() {
  const panel = document.createElement('div');
  panel.classList.add('ai-chat-panel');
  panel.setAttribute('data-current-mode', MODES[0]);

  // Mode selector tabs
  const tabBar = document.createElement('div');
  tabBar.classList.add('chat-mode-tabs');
  MODES.forEach((mode, i) => {
    const tab = document.createElement('button');
    tab.classList.add('chat-mode-tab');
    if (i === 0) tab.classList.add('active');
    tab.setAttribute('data-mode-tab', mode);
    tab.textContent = mode;
    tab.addEventListener('click', () => setMode(panel, mode));
    tabBar.appendChild(tab);
  });
  panel.appendChild(tabBar);

  // Message area
  const messageArea = document.createElement('div');
  messageArea.classList.add('chat-messages');
  messageArea.setAttribute('data-chat-messages', '');
  panel.appendChild(messageArea);

  // Follow-up area
  const followUpArea = document.createElement('div');
  followUpArea.classList.add('chat-follow-ups');
  followUpArea.setAttribute('data-follow-ups', '');
  panel.appendChild(followUpArea);

  // Input area
  const inputArea = document.createElement('div');
  inputArea.classList.add('chat-input-area');

  const input = document.createElement('input');
  input.type = 'text';
  input.classList.add('chat-input');
  input.placeholder = 'Ask Workbook anything...';
  inputArea.appendChild(input);

  const sendBtn = document.createElement('button');
  sendBtn.classList.add('chat-send-btn');
  sendBtn.setAttribute('data-send-btn', '');
  sendBtn.textContent = 'Send';
  sendBtn.addEventListener('click', () => {
    const text = input.value.trim();
    if (text) {
      handleSend(panel, text);
      input.value = '';
    }
  });
  inputArea.appendChild(sendBtn);

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const text = input.value.trim();
      if (text) {
        handleSend(panel, text);
        input.value = '';
      }
    }
  });

  panel.appendChild(inputArea);

  return panel;
}

/**
 * Add a user message to the chat panel.
 */
export function addUserMessage(panel, text) {
  const messageArea = panel.querySelector('[data-chat-messages]');
  const el = createMessageEl('user', text);
  messageArea.appendChild(el);
  messageArea.scrollTop = messageArea.scrollHeight;
}

/**
 * Add an AI message to the chat panel.
 * @param {HTMLElement} panel - The chat panel element
 * @param {Object} response - Response object with content, optional toolChips
 */
export function addAiMessage(panel, response) {
  const messageArea = panel.querySelector('[data-chat-messages]');
  const el = createMessageEl('ai', response.content);

  // Populate tool chips if provided
  if (response.toolChips && response.toolChips.length > 0) {
    const chipArea = el.querySelector('[data-tool-chips]');
    response.toolChips.forEach((label) => {
      const chip = document.createElement('span');
      chip.classList.add('tool-chip');
      chip.setAttribute('data-chip', '');
      chip.textContent = label;
      chipArea.appendChild(chip);
    });
  }

  messageArea.appendChild(el);
  messageArea.scrollTop = messageArea.scrollHeight;
}

/**
 * Get all messages from the panel as an array of objects.
 * @returns {Array<{role: string, text: string}>}
 */
export function getMessages(panel) {
  const messageArea = panel.querySelector('[data-chat-messages]');
  const elements = messageArea.querySelectorAll('[data-role]');
  return Array.from(elements).map((el) => ({
    role: el.getAttribute('data-role'),
    text: el.getAttribute('data-message-text'),
  }));
}

/**
 * Remove all messages from the panel.
 */
export function clearMessages(panel) {
  const messageArea = panel.querySelector('[data-chat-messages]');
  messageArea.innerHTML = '';
}

/**
 * Set the active mode on the chat panel.
 */
export function setMode(panel, mode) {
  panel.setAttribute('data-current-mode', mode);
  const tabs = panel.querySelectorAll('[data-mode-tab]');
  tabs.forEach((tab) => {
    if (tab.getAttribute('data-mode-tab') === mode) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });
}

/**
 * Get the current active mode of the panel.
 */
export function getCurrentMode(panel) {
  return panel.getAttribute('data-current-mode');
}

/**
 * Return the list of available modes.
 */
export function getModes() {
  return MODES;
}

/**
 * Show a thinking indicator (3 animated dots) in the message area.
 */
export function showThinking(panel) {
  // Remove any existing thinking indicator first
  hideThinking(panel);

  const messageArea = panel.querySelector('[data-chat-messages]');
  const indicator = document.createElement('div');
  indicator.classList.add('chat-thinking');
  indicator.setAttribute('data-thinking', '');

  for (let i = 0; i < 3; i++) {
    const dot = document.createElement('span');
    dot.classList.add('thinking-dot');
    dot.setAttribute('data-dot', '');
    indicator.appendChild(dot);
  }

  messageArea.appendChild(indicator);
  messageArea.scrollTop = messageArea.scrollHeight;
}

/**
 * Remove the thinking indicator from the message area.
 */
export function hideThinking(panel) {
  const indicator = panel.querySelector('[data-thinking]');
  if (indicator) {
    indicator.remove();
  }
}

/**
 * Add a tool-use chip to the last AI message in the panel.
 */
export function addToolChip(panel, label) {
  const messageArea = panel.querySelector('[data-chat-messages]');
  const aiMessages = messageArea.querySelectorAll('[data-role="ai"]');
  if (aiMessages.length === 0) return;

  const lastAi = aiMessages[aiMessages.length - 1];
  let chipArea = lastAi.querySelector('[data-tool-chips]');
  if (!chipArea) {
    chipArea = document.createElement('div');
    chipArea.classList.add('chat-tool-chips');
    chipArea.setAttribute('data-tool-chips', '');
    lastAi.appendChild(chipArea);
  }

  const chip = document.createElement('span');
  chip.classList.add('tool-chip');
  chip.setAttribute('data-chip', '');
  chip.textContent = label;
  chipArea.appendChild(chip);
}

/**
 * Display follow-up suggestion buttons.
 */
export function showFollowUps(panel, suggestions) {
  const followUpArea = panel.querySelector('[data-follow-ups]');
  followUpArea.innerHTML = '';

  suggestions.forEach((text) => {
    const btn = document.createElement('button');
    btn.classList.add('chat-follow-up');
    btn.setAttribute('data-follow-up', '');
    btn.textContent = text;
    btn.addEventListener('click', () => {
      followUpArea.innerHTML = '';
      handleSend(panel, text);
    });
    followUpArea.appendChild(btn);
  });
}

/**
 * Wire input handling: send user message, show thinking, get response, display.
 */
export function handleSend(panel, text) {
  addUserMessage(panel, text);
  showThinking(panel);
  const response = getResponse(text, {
    page: 'meeting-detail',
    mode: getCurrentMode(panel),
  });
  hideThinking(panel);
  addAiMessage(panel, response);
  if (response.followUpSuggestions) {
    showFollowUps(panel, response.followUpSuggestions);
  }
}
