import WorkbookDemo from './state.js';
import { getPersona, canAccessPage, getAllPersonas } from './persona.js';
import { loadIndustryData, getIndustryFromUrl } from './industry.js';

const INDUSTRIES = [
  { id: 'consulting', label: 'Consulting', description: 'Professional services', color: '#3B82F6' },
  { id: 'tech', label: 'Technology', description: 'SaaS & software', color: '#8B5CF6' },
  { id: 'hospitality', label: 'Hospitality', description: 'Hotels & restaurants', color: '#10B981' },
];

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
 * Create the industry switcher element for the top of the sidebar.
 * Contains a color dot indicator and a styled select dropdown.
 */
function createIndustrySwitcher() {
  const wrapper = document.createElement('div');
  wrapper.dataset.industrySwitcher = '';
  wrapper.title = 'Match to your prospect';
  wrapper.style.cssText =
    'display:flex;align-items:center;gap:8px;padding:10px 12px;' +
    'border-bottom:1px solid var(--border, #2A2A35);margin-bottom:4px;';

  const current = getIndustryFromUrl();
  const industry = INDUSTRIES.find(i => i.id === current) || INDUSTRIES[0];

  // Color dot
  const dot = document.createElement('span');
  dot.dataset.industryDot = '';
  dot.style.cssText =
    'width:10px;height:10px;border-radius:50%;display:inline-block;flex-shrink:0;';
  dot.style.background = industry.color;

  // Select dropdown
  const select = document.createElement('select');
  select.className = 'industry-switcher-select';
  select.style.cssText =
    'background:transparent;border:none;color:var(--txt-secondary,#8A8A8E);' +
    'font-size:13px;cursor:pointer;outline:none;flex:1;min-width:0;';

  for (const ind of INDUSTRIES) {
    const opt = document.createElement('option');
    opt.value = ind.id;
    opt.textContent = ind.label;
    if (ind.id === current) opt.selected = true;
    select.appendChild(opt);
  }

  select.addEventListener('change', (e) => {
    const newId = e.target.value;
    loadIndustryData(newId);
    const ind = INDUSTRIES.find(i => i.id === newId);
    dot.style.background = ind ? ind.color : '#888';
    window.dispatchEvent(new CustomEvent('workbook:industry-changed', {
      detail: { industry: newId },
    }));
  });

  wrapper.appendChild(dot);
  wrapper.appendChild(select);

  return wrapper;
}

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

  // Industry switcher at the top
  nav.appendChild(createIndustrySwitcher());

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
 * Width constants for sidebar states.
 */
const SIDEBAR_WIDTH_EXPANDED = '240px';
const SIDEBAR_WIDTH_COLLAPSED = '56px';
const SIDEBAR_STORAGE_KEY = 'nexus-sidebar-collapsed';

/**
 * Selectors for elements that should be hidden when the sidebar is collapsed.
 * Covers both programmatic sidebar (createSidebar) and HTML page sidebars.
 */
const COLLAPSIBLE_SELECTORS = [
  '.nav-section-heading',           // Programmatic sidebar section headings
  '.nav-label',                     // Programmatic sidebar nav labels
  '.nav-badge',                     // Badge counts on nav items
  '.sidebar-bottom-label',          // Explicitly marked bottom-area labels
  '.industry-switcher-select',      // Industry switcher dropdown (hidden when collapsed)
];

/**
 * Apply the collapsed visual state to the sidebar element.
 * Hides labels, headings, badges, and bottom-area text; sets narrow width.
 * Works for both the programmatic sidebar (createSidebar) and HTML page sidebars.
 */
function applyCollapsedState(nav) {
  nav.style.width = SIDEBAR_WIDTH_COLLAPSED;
  nav.dataset.collapsed = 'true';
  nav.style.overflow = 'hidden';

  for (const selector of COLLAPSIBLE_SELECTORS) {
    const els = nav.querySelectorAll(selector);
    for (const el of els) {
      el.style.display = 'none';
    }
  }
}

/**
 * Apply the expanded visual state to the sidebar element.
 * Shows labels, headings, badges, and bottom-area text; sets full width.
 */
function applyExpandedState(nav) {
  nav.style.width = SIDEBAR_WIDTH_EXPANDED;
  delete nav.dataset.collapsed;
  nav.style.overflow = '';

  for (const selector of COLLAPSIBLE_SELECTORS) {
    const els = nav.querySelectorAll(selector);
    for (const el of els) {
      el.style.display = '';
    }
  }
}

/**
 * Initialize collapsible sidebar behavior.
 *
 * Adds a toggle button at the bottom of the sidebar (before any bottom-area
 * content). Reads persisted state from localStorage. Calls an optional
 * onToggle(collapsed:boolean) callback after each toggle so the page can
 * adjust its main-content margin.
 *
 * @param {HTMLElement} nav - The sidebar nav element from createSidebar.
 * @param {Object} [options]
 * @param {Function} [options.onToggle] - Called with (collapsed:boolean) after each toggle.
 */
export function initCollapsible(nav, options) {
  const opts = options || {};

  // Set up transition for smooth animation
  nav.style.transition = 'width 200ms ease-in-out';

  // Read persisted state
  const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
  const startCollapsed = stored === 'true';

  // Create the toggle button
  const toggleBtn = document.createElement('button');
  toggleBtn.dataset.sidebarToggle = '';
  toggleBtn.className = 'sidebar-collapse-toggle';
  toggleBtn.title = startCollapsed ? 'Expand sidebar' : 'Collapse sidebar';
  toggleBtn.textContent = startCollapsed ? '\u00BB' : '\u00AB'; // >> or <<
  toggleBtn.style.cssText =
    'display:flex;align-items:center;justify-content:center;' +
    'width:100%;padding:6px 0;margin-top:4px;' +
    'background:transparent;border:none;cursor:pointer;' +
    'color:#8F8F94;font-size:14px;border-radius:6px;' +
    'transition:background 150ms ease;';

  // Apply initial state
  if (startCollapsed) {
    applyCollapsedState(nav);
  }

  // Toggle handler
  toggleBtn.addEventListener('click', function () {
    const isCurrentlyCollapsed = nav.dataset.collapsed === 'true';

    if (isCurrentlyCollapsed) {
      // Expand
      applyExpandedState(nav);
      toggleBtn.textContent = '\u00AB'; // <<
      toggleBtn.title = 'Collapse sidebar';
      localStorage.setItem(SIDEBAR_STORAGE_KEY, 'false');
      if (typeof opts.onToggle === 'function') {
        opts.onToggle(false);
      }
    } else {
      // Collapse
      applyCollapsedState(nav);
      toggleBtn.textContent = '\u00BB'; // >>
      toggleBtn.title = 'Expand sidebar';
      localStorage.setItem(SIDEBAR_STORAGE_KEY, 'true');
      if (typeof opts.onToggle === 'function') {
        opts.onToggle(true);
      }
    }
  });

  // Insert the toggle button at the end of the nav
  nav.appendChild(toggleBtn);
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
