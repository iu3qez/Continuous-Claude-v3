/**
 * Persona Switcher UI - Avatar dropdown in sidebar bottom.
 * Allows switching between 4 personas with keyboard shortcuts.
 */

import { getAllPersonas, switchPersona, getPersonaConfig } from '../components/persona.js';

let switcherElement = null;
let dropdownOpen = false;

/**
 * Initialize the persona switcher.
 * @param {HTMLElement} container - Where to render the switcher
 */
export function initPersonaSwitcher(container) {
  if (!container) return;
  switcherElement = container;
  render();
  initKeyboardShortcuts();
}

function render() {
  if (!switcherElement) return;
  const current = getPersonaConfig();
  if (!current) return;

  const avatarColors = {
    ceo: '#4F46E5',
    ops: '#059669',
    engineering: '#7C3AED',
    new: '#D97706'
  };

  const color = avatarColors[current.id] || '#4F46E5';
  const initials = current.name.split(' ').map(n => n[0]).join('');

  switcherElement.innerHTML = `
    <div id="persona-trigger" style="display: flex; align-items: center; gap: 10px; padding: 8px 12px; cursor: pointer; border-radius: var(--radius-md); transition: background 0.2s;"
         onmouseenter="this.style.background='var(--surface-elevated)'"
         onmouseleave="this.style.background='transparent'">
      <div style="width: 32px; height: 32px; border-radius: 50%; background: ${color}; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: 600;">
        ${initials}
      </div>
      <div style="flex: 1; min-width: 0;">
        <div style="color: var(--txt-primary); font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${current.name}</div>
        <div style="color: var(--txt-tertiary); font-size: 11px;">${current.role}</div>
      </div>
      <span style="color: var(--txt-tertiary); font-size: 10px;">&#9650;</span>
    </div>
    <div id="persona-dropdown" style="display: none; position: absolute; bottom: 100%; left: 0; right: 0; background: var(--surface-elevated); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 4px; margin-bottom: 4px; box-shadow: 0 -8px 24px rgba(0,0,0,0.3);">
      <div style="padding: 8px 12px; color: var(--txt-tertiary); font-size: 11px; text-transform: uppercase;">Switch Persona</div>
    </div>
  `;

  const dropdown = switcherElement.querySelector('#persona-dropdown');
  const allPersonas = getAllPersonas();

  allPersonas.forEach((p, idx) => {
    const pColor = avatarColors[p.id] || '#4F46E5';
    const pInitials = p.name.split(' ').map(n => n[0]).join('');
    const isActive = p.id === current.id;

    const item = document.createElement('div');
    item.style.cssText = `
      display: flex; align-items: center; gap: 10px; padding: 8px 12px;
      cursor: pointer; border-radius: var(--radius-md); transition: background 0.15s;
      ${isActive ? 'background: var(--accent-subtle);' : ''}
    `;
    item.innerHTML = `
      <div style="width: 28px; height: 28px; border-radius: 50%; background: ${pColor}; display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; font-weight: 600;">${pInitials}</div>
      <div style="flex: 1;">
        <div style="color: var(--txt-primary); font-size: 13px;">${p.name}</div>
        <div style="color: var(--txt-tertiary); font-size: 11px;">${p.role}</div>
      </div>
      <span style="color: var(--txt-tertiary); font-size: 10px;">Ctrl+${idx + 1}</span>
    `;

    item.addEventListener('mouseenter', () => { if (!isActive) item.style.background = 'var(--surface)'; });
    item.addEventListener('mouseleave', () => { item.style.background = isActive ? 'var(--accent-subtle)' : ''; });
    item.addEventListener('click', () => {
      doSwitch(p.id);
    });

    dropdown.appendChild(item);
  });

  // Toggle dropdown
  switcherElement.querySelector('#persona-trigger').addEventListener('click', () => {
    toggleDropdown();
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (switcherElement && !switcherElement.contains(e.target)) {
      closeDropdown();
    }
  });
}

function doSwitch(personaId) {
  // Fade transition
  document.body.style.opacity = '0.5';
  document.body.style.transition = 'opacity 0.2s';

  setTimeout(() => {
    switchPersona(personaId);
    render();
    closeDropdown();

    document.body.style.opacity = '1';

    // Dispatch custom event for other components to react
    window.dispatchEvent(new CustomEvent('persona-switched', { detail: { personaId } }));

    setTimeout(() => {
      document.body.style.transition = '';
    }, 200);
  }, 200);
}

function toggleDropdown() {
  const dropdown = switcherElement?.querySelector('#persona-dropdown');
  if (!dropdown) return;
  dropdownOpen = !dropdownOpen;
  dropdown.style.display = dropdownOpen ? 'block' : 'none';
}

function closeDropdown() {
  const dropdown = switcherElement?.querySelector('#persona-dropdown');
  if (dropdown) dropdown.style.display = 'none';
  dropdownOpen = false;
}

/**
 * Check if dropdown is open.
 */
export function isDropdownOpen() {
  return dropdownOpen;
}

function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.ctrlKey && e.key >= '1' && e.key <= '4') {
      e.preventDefault();
      const personas = getAllPersonas();
      const idx = parseInt(e.key) - 1;
      if (personas[idx]) {
        doSwitch(personas[idx].id);
      }
    }
  });
}
