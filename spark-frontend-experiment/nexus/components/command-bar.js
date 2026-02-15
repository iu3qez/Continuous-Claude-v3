import WorkbookDemo from './state.js';

const DEFAULT_COMMANDS = [
  { id: 'nav-dashboard', label: 'Go to Dashboard', category: 'Navigation', action: () => { window.location.href = 'dashboard.html'; } },
  { id: 'nav-meetings', label: 'Go to Meetings', category: 'Navigation', action: () => { window.location.href = 'meetings.html'; } },
  { id: 'nav-actions', label: 'Go to Actions', category: 'Navigation', action: () => { window.location.href = 'actions.html'; } },
  { id: 'nav-decisions', label: 'Go to Decisions', category: 'Navigation', action: () => { window.location.href = 'decisions.html'; } },
  { id: 'nav-proposals', label: 'Go to Proposals', category: 'Navigation', action: () => { window.location.href = 'proposals.html'; } },
  { id: 'nav-calendar', label: 'Go to Calendar', category: 'Navigation', action: () => { window.location.href = 'calendar.html'; } },
  { id: 'nav-mywork', label: 'Go to My Work', category: 'Navigation', action: () => { window.location.href = 'my-work.html'; } },
  { id: 'nav-agents', label: 'Go to Agents', category: 'Navigation', action: () => { window.location.href = 'agents.html'; } },
  { id: 'nav-connections', label: 'Go to Connections', category: 'Navigation', action: () => { window.location.href = 'connections.html'; } },
  { id: 'nav-settings', label: 'Go to Settings', category: 'Navigation', action: () => { window.location.href = 'settings.html'; } },
  { id: 'switch-consulting', label: 'Switch to Consulting', category: 'Industry', action: () => { WorkbookDemo.switchIndustry('consulting'); } },
  { id: 'switch-tech', label: 'Switch to Tech', category: 'Industry', action: () => { WorkbookDemo.switchIndustry('tech'); } },
  { id: 'switch-hospitality', label: 'Switch to Hospitality', category: 'Industry', action: () => { WorkbookDemo.switchIndustry('hospitality'); } },
];

let commands = [...DEFAULT_COMMANDS];
let selectedIndex = 0;
let isOpen = false;
let barElement = null;
let filteredList = [...commands];

/**
 * Fuzzy match: checks if all characters of query appear in str in order.
 */
export function fuzzyMatch(str, query) {
  if (!query) return true;
  const lowerStr = str.toLowerCase();
  const lowerQuery = query.toLowerCase();

  let strIdx = 0;
  let queryIdx = 0;

  while (strIdx < lowerStr.length && queryIdx < lowerQuery.length) {
    if (lowerStr[strIdx] === lowerQuery[queryIdx]) {
      queryIdx++;
    }
    strIdx++;
  }

  return queryIdx === lowerQuery.length;
}

/**
 * Filter commands by fuzzy matching against label.
 */
export function filterCommands(query) {
  if (!query) return [...commands];
  return commands.filter(cmd => fuzzyMatch(cmd.label, query));
}

/**
 * Register a custom command.
 */
export function registerCommand(cmd) {
  commands.push(cmd);
  // If bar exists and is open, refresh the list
  if (barElement && isOpen) {
    renderCommandList(barElement, filterCommands(getInputValue()));
  }
}

/**
 * Get all registered commands.
 */
export function getCommands() {
  return commands;
}

function getInputValue() {
  if (!barElement) return '';
  const input = barElement.querySelector('input[type="text"]');
  return input ? input.value : '';
}

function renderCommandList(bar, cmds) {
  filteredList = cmds;
  // Clamp selectedIndex
  if (selectedIndex >= filteredList.length) {
    selectedIndex = Math.max(0, filteredList.length - 1);
  }

  let list = bar.querySelector('.command-list');
  if (!list) {
    list = document.createElement('div');
    list.className = 'command-list';
    bar.appendChild(list);
  }
  list.innerHTML = '';

  cmds.forEach((cmd, i) => {
    const item = document.createElement('div');
    item.className = 'command-item';
    item.dataset.commandId = cmd.id;
    item.textContent = cmd.label;
    if (i === selectedIndex) {
      item.classList.add('selected');
    }
    item.addEventListener('click', () => {
      cmd.action();
      closeCommandBar();
    });
    list.appendChild(item);
  });
}

function updateSelection(bar) {
  const items = bar.querySelectorAll('[data-command-id]');
  items.forEach((item, i) => {
    if (i === selectedIndex) {
      item.classList.add('selected');
    } else {
      item.classList.remove('selected');
    }
  });
}

/**
 * Open the command bar: make visible, focus input.
 */
export function openCommandBar() {
  if (!barElement) return;
  isOpen = true;
  selectedIndex = 0;
  barElement.classList.remove('hidden');
  barElement.style.display = '';
  const input = barElement.querySelector('input[type="text"]');
  if (input) {
    input.value = '';
    input.focus();
  }
  renderCommandList(barElement, filterCommands(''));
}

/**
 * Close the command bar: hide, clear input.
 */
export function closeCommandBar() {
  if (!barElement) return;
  isOpen = false;
  barElement.classList.add('hidden');
  const input = barElement.querySelector('input[type="text"]');
  if (input) {
    input.value = '';
  }
}

/**
 * Create the command bar DOM element.
 */
export function createCommandBar() {
  const bar = document.createElement('div');
  bar.className = 'command-bar hidden';
  bar.setAttribute('role', 'dialog');
  bar.setAttribute('aria-label', 'Command palette');

  // AI icon prefix
  const aiIcon = document.createElement('span');
  aiIcon.className = 'command-ai-icon';
  aiIcon.textContent = '✦';
  aiIcon.style.cssText = 'color: var(--accent, #4F46E5); margin-right: 8px; font-size: 16px; flex-shrink: 0;';
  bar.appendChild(aiIcon);

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'command-input';
  input.placeholder = 'Ask AI anything or search...';
  bar.appendChild(input);

  // Input handler for filtering
  input.addEventListener('input', () => {
    selectedIndex = 0;
    const results = filterCommands(input.value);
    renderCommandList(bar, results);
  });

  // Keyboard handler
  bar.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCommandBar();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filteredList.length > 0) {
        selectedIndex = Math.min(selectedIndex + 1, filteredList.length - 1);
        updateSelection(bar);
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filteredList.length > 0) {
        selectedIndex = Math.max(selectedIndex - 1, 0);
        updateSelection(bar);
      }
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredList.length > 0 && selectedIndex < filteredList.length) {
        filteredList[selectedIndex].action();
        closeCommandBar();
      }
      return;
    }
  });

  barElement = bar;
  return bar;
}
