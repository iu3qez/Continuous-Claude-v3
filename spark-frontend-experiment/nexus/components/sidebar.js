import WorkbookDemo from './state.js';
import { getPersona, canAccessPage, getAllPersonas } from './persona.js';

const NAV_SECTIONS = {
  workspace: [
    { id: 'dashboard', label: 'Dashboard', icon: 'Home', href: 'dashboard.html' },
    { id: 'calendar', label: 'Calendar', icon: 'Calendar', href: 'calendar.html' },
    { id: 'meetings', label: 'Meetings', icon: 'Users', href: 'meetings.html' },
    { id: 'actions', label: 'Actions', icon: 'CheckSquare', href: 'actions.html' },
    { id: 'decisions', label: 'Decisions', icon: 'GitBranch', href: 'decisions.html' },
    { id: 'proposals', label: 'Proposals', icon: 'Sparkles', href: 'proposals.html' },
    { id: 'my-work', label: 'My Work', icon: 'User', href: 'my-work.html' },
    { id: 'workspaces', label: 'Workspaces', icon: 'Layers', href: 'workspaces.html' },
  ],
  ai: [
    { id: 'agents', label: 'Agent Dashboard', icon: 'Bot', href: 'agents.html' },
    { id: 'marketplace', label: 'Marketplace', icon: 'Store', href: 'marketplace.html' },
    { id: 'elt-rollup', label: 'ELT Rollup', icon: 'BarChart3', href: 'elt-rollup.html' },
  ],
  admin: [
    { id: 'connections', label: 'Connections', icon: 'Plug', href: 'connections.html' },
    { id: 'settings', label: 'Settings', icon: 'Settings', href: 'settings.html' },
  ],
};

/**
 * Icon abbreviation from icon name (e.g., "Home" -> "[H]", "CheckSquare" -> "[CS]")
 */
function iconAbbrev(iconName) {
  // Extract uppercase letters for abbreviation
  const uppers = iconName.replace(/[a-z0-9]/g, '');
  return `[${uppers || iconName.charAt(0).toUpperCase()}]`;
}

/**
 * Create a single nav item element.
 */
function createNavItem(item) {
  const el = document.createElement('a');
  el.href = item.href;
  el.dataset.navId = item.id;
  el.className = 'nav-item';
  el.title = item.label;

  const icon = document.createElement('span');
  icon.className = 'nav-icon';
  icon.textContent = iconAbbrev(item.icon);

  const label = document.createElement('span');
  label.className = 'nav-label';
  label.textContent = item.label;

  el.appendChild(icon);
  el.appendChild(label);

  return el;
}

/**
 * Create a section within the sidebar.
 */
function createSection(sectionKey, items) {
  const section = document.createElement('div');
  section.dataset.section = sectionKey;
  section.className = 'nav-section';

  const heading = document.createElement('div');
  heading.className = 'nav-section-heading';
  heading.textContent = sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1);
  section.appendChild(heading);

  for (const item of items) {
    section.appendChild(createNavItem(item));
  }

  return section;
}

/**
 * Build the full sidebar nav element.
 * Width is 240px with visible section headings and labels.
 * If a container element is passed, the sidebar is appended to it.
 */
export function createSidebar(container) {
  const nav = document.createElement('nav');
  nav.className = 'sidebar';
  nav.style.width = '240px';

  for (const [sectionKey, items] of Object.entries(NAV_SECTIONS)) {
    nav.appendChild(createSection(sectionKey, items));
  }

  if (container && container.appendChild) {
    container.appendChild(nav);
  }

  return nav;
}

/**
 * Set the active page in the sidebar, highlighting the matching nav item
 * and removing highlight from all others.
 * Can be called as setActivePage(sidebarEl, pageId) or setActivePage(pageId).
 */
export function setActivePage(sidebarElOrPageId, pageId) {
  let sidebarEl;
  if (typeof sidebarElOrPageId === 'string') {
    // Called with just a pageId - find sidebar in document
    pageId = sidebarElOrPageId;
    sidebarEl = document.querySelector('.sidebar') || document.querySelector('#sidebar');
  } else {
    sidebarEl = sidebarElOrPageId;
  }

  if (!sidebarEl) return;

  // Remove active from all items
  const allItems = sidebarEl.querySelectorAll('[data-nav-id]');
  for (const item of allItems) {
    item.classList.remove('active');
  }

  // Add active to matching item
  const target = sidebarEl.querySelector(`[data-nav-id="${pageId}"]`);
  if (target) {
    target.classList.add('active');
  }
}

/**
 * Return all 12 nav items as a flat array.
 */
export function getNavItems() {
  return [
    ...NAV_SECTIONS.workspace,
    ...NAV_SECTIONS.ai,
    ...NAV_SECTIONS.admin,
  ];
}

/**
 * Return nav items filtered by persona page access.
 */
export function getNavItemsForPersona(personaId) {
  const allItems = getNavItems();
  return allItems.filter((item) => canAccessPage(item.id, personaId));
}

/**
 * Update or create a badge on a nav item.
 * If count is 0, hide the badge. Otherwise show the count.
 */
export function updateBadge(sidebarEl, itemId, count) {
  const navItem = sidebarEl.querySelector(`[data-nav-id="${itemId}"]`);
  if (!navItem) {
    return;
  }

  let badge = navItem.querySelector('[data-badge]');

  if (count === 0) {
    if (badge) {
      badge.style.display = 'none';
    }
    return;
  }

  if (!badge) {
    badge = document.createElement('span');
    badge.dataset.badge = '';
    badge.className = 'nav-badge';
    navItem.appendChild(badge);
  }

  badge.textContent = String(count);
  badge.style.display = '';
}
