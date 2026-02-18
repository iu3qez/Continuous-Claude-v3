/**
 * Page initialization module - handles D1, D2, D6, D7 fixes.
 * Auto-runs on import. Add to each page:
 *   <body data-page-id="dashboard">
 *   <script type="module" src="components/page-init.js"></script>
 */
import WorkbookDemo from './state.js';
import { canAccessPage, getPersona, getAllPersonas } from './persona.js';
import { enforceAccess } from './access-guard.js';
import { initIndustry, reloadIndustryData } from './industry.js';
import { registerCommand } from './command-bar.js';
import { initCollapsible } from './sidebar.js';
import { init as initTourHint, onTourEnd } from './tour-hint.js';
import { onGuidedModeChange } from '../demo/guided-mode.js';
import { initDashboardReveal } from './dashboard-reveal.js';

// Import industry datasets so they register themselves
import '../data/consulting.js';
import '../data/tech.js';
import '../data/hospitality.js';

// ── D1: Ensure Workspaces link exists in sidebar ──────────
function ensureWorkspacesLink(sidebar) {
  // Check if Workspaces link already exists
  const existing = sidebar.querySelector('[data-nav-page="workspaces"]');
  if (existing) return;

  // Find the My Work link - Workspaces goes after it
  const myWork = sidebar.querySelector('[data-nav-page="my-work"]');
  if (!myWork) return;

  const link = document.createElement('a');
  link.href = 'workspaces.html';
  link.dataset.navPage = 'workspaces';
  link.className = 'nav-item flex items-center gap-2.5 px-2 py-1.5 rounded-md text-[#8F8F94] hover:text-[#EDEDEF]';
  link.title = 'Workspaces';
  link.innerHTML = '<i data-lucide="layers" class="w-4 h-4 flex-shrink-0"></i><span class="text-sm">Workspaces</span>';

  myWork.parentNode.insertBefore(link, myWork.nextSibling);

  // Re-init lucide for the new icon
  if (window.lucide) window.lucide.createIcons();
}

// ── D2: Add persona/industry selector UI ──────────────────
function addPersonaSelector(sidebar) {
  // Find the user section at the bottom (has initials like "DH")
  const userSection = sidebar.querySelector('.flex.items-center.gap-2\\.5.px-2.py-1\\.5.mt-1');
  if (!userSection) return;

  // Create persona dropdown container
  const container = document.createElement('div');
  container.className = 'persona-selector px-2 py-1.5 mb-1';
  container.innerHTML = buildPersonaDropdown();

  // Insert before user section
  userSection.parentNode.insertBefore(container, userSection);

  // Wire click handler
  const toggle = container.querySelector('.persona-toggle');
  const dropdown = container.querySelector('.persona-dropdown');
  if (toggle && dropdown) {
    toggle.addEventListener('click', function() {
      dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    });
    // Wire persona options
    dropdown.querySelectorAll('[data-persona-id]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        WorkbookDemo.switchPersona(btn.dataset.personaId);
        dropdown.style.display = 'none';
        updatePersonaDisplay(container);
      });
    });
  }
}

function buildPersonaDropdown() {
  var persona = getPersona(WorkbookDemo.persona);
  var name = persona ? persona.name : 'Unknown';
  var role = persona ? persona.role : '';
  var color = persona ? persona.avatarColor : '#6B6B70';
  var initials = name.split(' ').map(function(n) { return n[0]; }).join('');

  var allPersonas = getAllPersonas();
  var options = allPersonas.map(function(p) {
    var pi = p.name.split(' ').map(function(n) { return n[0]; }).join('');
    return '<button data-persona-id="' + p.id + '" class="flex items-center gap-2 w-full px-2 py-1.5 rounded hover:bg-white/5 text-left">' +
      '<div class="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style="background:' + p.avatarColor + '20"><span class="font-mono text-[8px]" style="color:' + p.avatarColor + '">' + pi + '</span></div>' +
      '<span class="text-xs text-[#EDEDEF]">' + p.name + '</span>' +
      '<span class="text-[10px] text-[#6B6B70] ml-auto">' + p.role + '</span>' +
      '</button>';
  }).join('');

  return '<button class="persona-toggle flex items-center gap-2 w-full rounded hover:bg-white/5 py-1">' +
    '<div class="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style="background:' + color + '20"><span class="font-mono text-[9px]" style="color:' + color + '">' + initials + '</span></div>' +
    '<div class="flex flex-col"><span class="text-xs text-[#EDEDEF] persona-name">' + name + '</span><span class="text-[10px] text-[#6B6B70] persona-role">' + role + '</span></div>' +
    '<span class="ml-auto text-[10px] text-[#6B6B70]">&#9662;</span>' +
    '</button>' +
    '<div class="persona-dropdown" style="display:none;background:#161618;border:1px solid #232326;border-radius:6px;padding:4px;margin-top:4px;">' +
    options + '</div>';
}

function updatePersonaDisplay(container) {
  var persona = getPersona(WorkbookDemo.persona);
  if (!persona) return;
  var nameEl = container.querySelector('.persona-name');
  var roleEl = container.querySelector('.persona-role');
  if (nameEl) nameEl.textContent = persona.name;
  if (roleEl) roleEl.textContent = persona.role;
}

function addIndustrySelector(sidebar) {
  // Add industry selector above persona selector
  var personaSelector = sidebar.querySelector('.persona-selector');
  var target = personaSelector || sidebar.querySelector('.flex-1'); // spacer
  if (!target) return;

  var container = document.createElement('div');
  container.className = 'industry-selector px-2 py-1.5 mb-1';
  container.innerHTML = buildIndustryDropdown();
  target.parentNode.insertBefore(container, target.nextSibling);

  var toggle = container.querySelector('.industry-toggle');
  var dropdown = container.querySelector('.industry-dropdown');
  if (toggle && dropdown) {
    toggle.addEventListener('click', function() {
      dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    });
    dropdown.querySelectorAll('[data-industry-id]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        WorkbookDemo.switchIndustry(btn.dataset.industryId);
        dropdown.style.display = 'none';
        updateIndustryDisplay(container);
      });
    });
  }
}

function buildIndustryDropdown() {
  var industries = [
    { id: 'consulting', label: 'Consulting', icon: '#D97706' },
    { id: 'tech', label: 'Tech', icon: '#4F46E5' },
    { id: 'hospitality', label: 'Hospitality', icon: '#059669' },
  ];
  var current = industries.find(function(i) { return i.id === WorkbookDemo.industry; }) || industries[0];

  var options = industries.map(function(ind) {
    return '<button data-industry-id="' + ind.id + '" class="flex items-center gap-2 w-full px-2 py-1.5 rounded hover:bg-white/5 text-left">' +
      '<span class="w-2 h-2 rounded-full flex-shrink-0" style="background:' + ind.icon + '"></span>' +
      '<span class="text-xs text-[#EDEDEF]">' + ind.label + '</span>' +
      '</button>';
  }).join('');

  return '<button class="industry-toggle flex items-center gap-2 w-full rounded hover:bg-white/5 py-1 px-1">' +
    '<span class="w-2 h-2 rounded-full flex-shrink-0 industry-dot" style="background:' + current.icon + '"></span>' +
    '<span class="text-xs text-[#8F8F94]">Industry:</span>' +
    '<span class="text-xs text-[#EDEDEF] industry-label">' + current.label + '</span>' +
    '<span class="ml-auto text-[10px] text-[#6B6B70]">&#9662;</span>' +
    '</button>' +
    '<div class="industry-dropdown" style="display:none;background:#161618;border:1px solid #232326;border-radius:6px;padding:4px;margin-top:4px;">' +
    options + '</div>';
}

function updateIndustryDisplay(container) {
  var industries = { consulting: { label: 'Consulting', icon: '#D97706' }, tech: { label: 'Tech', icon: '#4F46E5' }, hospitality: { label: 'Hospitality', icon: '#059669' } };
  var current = industries[WorkbookDemo.industry] || industries.consulting;
  var labelEl = container.querySelector('.industry-label');
  var dotEl = container.querySelector('.industry-dot');
  if (labelEl) labelEl.textContent = current.label;
  if (dotEl) dotEl.style.background = current.icon;
}

// ── D2.5: Notification badges on sidebar nav items ────────
var BADGE_COUNTS = {
  consulting: { actions: 3, proposals: 2, meetings: 4 },
  tech: { actions: 5, proposals: 3, meetings: 6 },
  hospitality: { actions: 2, proposals: 1, meetings: 3 },
};

function initBadges(sidebar) {
  var counts = BADGE_COUNTS[WorkbookDemo.industry] || BADGE_COUNTS.consulting;
  var items = { actions: counts.actions, proposals: counts.proposals, meetings: counts.meetings };
  Object.keys(items).forEach(function(pageId) {
    var navItem = sidebar.querySelector('[data-nav-page="' + pageId + '"]');
    if (!navItem) return;
    var badge = navItem.querySelector('[data-badge]');
    if (!badge) {
      badge = document.createElement('span');
      badge.dataset.badge = '';
      badge.className = 'nav-badge ml-auto inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#4F46E5]/20 text-[10px] font-mono text-[#4F46E5]';
      navItem.appendChild(badge);
    }
    badge.textContent = String(items[pageId]);
    badge.style.display = items[pageId] > 0 ? '' : 'none';
  });
}

// ── D6: Persona sidebar filtering ─────────────────────────
function filterSidebarByPersona(sidebar) {
  var navItems = sidebar.querySelectorAll('[data-nav-page]');
  navItems.forEach(function(item) {
    var page = item.dataset.navPage;
    var allowed = canAccessPage(page, WorkbookDemo.persona);
    item.style.display = allowed ? '' : 'none';
  });
}

// ── D6: Access guard ──────────────────────────────────────
function applyAccessGuard(pageId) {
  var mainContent = document.getElementById('main-content') || document.querySelector('main');
  if (!mainContent) return;

  // Remove any existing overlay first
  var existing = document.querySelector('.access-restricted');
  if (existing) existing.remove();
  mainContent.style.display = '';

  enforceAccess(pageId, mainContent);
}

// ── D7: Industry content updates ──────────────────────────
function updatePageContent(pageId) {
  var data = WorkbookDemo.data;
  if (!data) return;

  if (pageId === 'dashboard') updateDashboardContent(data);
  if (pageId === 'meetings') updateMeetingsContent(data);
  if (pageId === 'actions') updateActionsContent(data);
}

function updateDashboardContent(data) {
  // Update company name in AI briefing
  var briefingSection = document.querySelector('.card.stagger.stagger-2 .flex-1');
  if (briefingSection && data.company) {
    var heading = briefingSection.querySelector('p.font-heading');
    if (heading && data.meetings) {
      var overdue = data.actions ? data.actions.filter(function(a) { return a.status === 'overdue'; }).length : 0;
      heading.textContent = 'Heavy schedule. ' + overdue + ' overdue actions. ' + data.company.name + ' data loaded.';
    }
  }

  // Update schedule meeting titles
  var scheduleTitles = document.querySelectorAll('#main-content .dash-card .font-heading.font-medium.truncate, #main-content .dash-card .text-sm.font-heading');
  if (scheduleTitles.length > 0 && data.meetings) {
    scheduleTitles.forEach(function(el, i) {
      if (data.meetings[i]) {
        el.textContent = data.meetings[i].title;
      }
    });
  }

  // Update visible industry indicator
  updateIndustryBadge(data);
}

function updateMeetingsContent(data) {
  if (!data || !data.meetings) return;

  // Update meeting card titles
  var cards = document.querySelectorAll('.meeting-card h3, .meeting-card .font-heading.font-semibold');
  cards.forEach(function(el, i) {
    if (data.meetings[i]) {
      el.textContent = data.meetings[i].title;
    }
  });

  // Update meeting card workspace tags
  var tags = document.querySelectorAll('.meeting-card .metadata-chip');
  tags.forEach(function(el, i) {
    if (data.meetings[i] && data.meetings[i].workspace) {
      el.textContent = data.meetings[i].workspace;
    }
  });
}

function updateActionsContent(data) {
  if (!data || !data.actions) return;

  // Update action item titles
  var titles = document.querySelectorAll('.action-card h3, [data-action-title]');
  titles.forEach(function(el, i) {
    if (data.actions[i]) {
      el.textContent = data.actions[i].title;
    }
  });
}

function updateIndustryBadge(data) {
  // Add/update industry indicator badge in the header area
  var existing = document.getElementById('industry-badge');
  if (!existing) {
    var header = document.querySelector('#main-content > .px-6.py-3');
    if (!header) return;
    existing = document.createElement('div');
    existing.id = 'industry-badge';
    existing.className = 'px-6 py-1';
    header.parentNode.insertBefore(existing, header);
  }
  var label = data.company ? data.company.name + ' (' + data.company.industry + ')' : WorkbookDemo.industry;
  existing.innerHTML = '<span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#232326] text-[10px] text-[#8F8F94] font-mono">' +
    '<span class="w-1.5 h-1.5 rounded-full bg-[#4F46E5]"></span>Industry: ' + label + '</span>';
}

// ── D2: Register persona commands in command bar ──────────
function registerPersonaCommands() {
  var personas = getAllPersonas();
  personas.forEach(function(p) {
    registerCommand({
      id: 'persona-' + p.id,
      label: 'Switch to ' + p.name + ' (' + p.role + ')',
      category: 'Persona',
      action: function() { WorkbookDemo.switchPersona(p.id); },
    });
  });
}

// Expose state globally for testing/console access
if (typeof window !== 'undefined') {
  window.WorkbookDemo = WorkbookDemo;
  // Alias for test compatibility
  window.state = WorkbookDemo;
}

// ── Collapsible sidebar: mark HTML sidebar text for collapse ──
function markCollapsibleElements(sidebar) {
  // Section headings (e.g., "Workspace", "AI", "Admin") — these are text-only
  // divs with uppercase tracking. Mark them so initCollapsible can hide them.
  sidebar.querySelectorAll('.uppercase.tracking-widest').forEach(function(el) {
    el.classList.add('sidebar-bottom-label');
  });

  // Nav item text labels (the <span class="text-sm"> inside each link)
  sidebar.querySelectorAll('[data-nav-page] > span.text-sm, .nav-item > span.text-sm').forEach(function(el) {
    el.classList.add('sidebar-bottom-label');
  });

  // Brand text ("Workbook")
  sidebar.querySelectorAll('.font-heading.text-base').forEach(function(el) {
    el.classList.add('sidebar-bottom-label');
  });

  // Search button text (the label and shortcut badge)
  var searchBtn = sidebar.querySelector('button[title*="Search"]');
  if (searchBtn) {
    searchBtn.querySelectorAll('span').forEach(function(el) {
      el.classList.add('sidebar-bottom-label');
    });
  }

  // AI Agent indicator text
  var aiIndicator = sidebar.querySelector('[title="AI Agent: Online"]');
  if (aiIndicator) {
    aiIndicator.querySelectorAll('span').forEach(function(el) {
      // Keep the green dot visible, hide text
      if (!el.classList.contains('rounded-full') || el.querySelector('span')) {
        el.classList.add('sidebar-bottom-label');
      }
    });
  }

  // Theme toggle text
  var themeBtn = sidebar.querySelector('[title="Toggle Theme"]');
  if (themeBtn) {
    themeBtn.querySelectorAll('span.text-sm').forEach(function(el) {
      el.classList.add('sidebar-bottom-label');
    });
  }

  // User name text
  var userSection = sidebar.querySelector('.flex.items-center.gap-2\\.5.px-2.py-1\\.5.mt-1');
  if (userSection) {
    var userName = userSection.querySelector('span.text-sm');
    if (userName) userName.classList.add('sidebar-bottom-label');
  }
}

// ── Main init ─────────────────────────────────────────────
function init() {
  var pageId = document.body.dataset.pageId || '';
  var sidebar = document.querySelector('#sidebar, aside');

  // Initialize industry data
  initIndustry();

  // D1: Ensure Workspaces link
  if (sidebar) ensureWorkspacesLink(sidebar);

  // D2: Add persona and industry selectors
  if (sidebar) {
    addPersonaSelector(sidebar);
    addIndustrySelector(sidebar);
  }

  // D2: Register persona commands in command bar
  registerPersonaCommands();

  // D2.5: Initialize notification badges
  if (sidebar) initBadges(sidebar);

  // Collapsible sidebar
  if (sidebar) {
    // Mark HTML sidebar text elements as collapsible so initCollapsible can
    // hide them. This avoids editing every HTML page manually.
    markCollapsibleElements(sidebar);

    var mainContent = document.querySelector('main');
    initCollapsible(sidebar, {
      onToggle: function(collapsed) {
        if (mainContent) {
          // Pages with fixed sidebar use ml-60 (margin-left: 15rem = 240px)
          // Adjust to 56px when collapsed
          if (mainContent.classList.contains('ml-60')) {
            mainContent.style.marginLeft = collapsed ? '56px' : '';
            mainContent.style.transition = 'margin-left 200ms ease-in-out';
          }
        }
        // Also update inline sidebar elements added by page-init (persona, industry selectors)
        var personaSelector = sidebar.querySelector('.persona-selector');
        var industrySelector = sidebar.querySelector('.industry-selector');
        if (personaSelector) personaSelector.style.display = collapsed ? 'none' : '';
        if (industrySelector) industrySelector.style.display = collapsed ? 'none' : '';
      }
    });

    // If sidebar starts collapsed from localStorage, apply main content margin immediately
    if (sidebar.dataset.collapsed === 'true') {
      if (mainContent && mainContent.classList.contains('ml-60')) {
        mainContent.style.marginLeft = '56px';
        mainContent.style.transition = 'margin-left 200ms ease-in-out';
      }
      // Hide persona/industry selectors
      var ps = sidebar.querySelector('.persona-selector');
      var is = sidebar.querySelector('.industry-selector');
      if (ps) ps.style.display = 'none';
      if (is) is.style.display = 'none';
    }
  }

  // T17: Initialize persistent tour hint button
  initTourHint();

  // T17: When guided tour exits, hide demo badge and mark dismissed
  onGuidedModeChange(function(state) {
    if (state === null) {
      onTourEnd();
    }
  });

  // D6: Apply initial persona filtering
  if (sidebar) filterSidebarByPersona(sidebar);

  // D6: Apply access guard
  if (pageId) applyAccessGuard(pageId);

  // T09: Dashboard progressive reveal (staggered entrance animations)
  if (pageId === 'dashboard') {
    setTimeout(function() { initDashboardReveal(); }, 200);
  }

  // D7: Apply initial industry content
  if (pageId) updatePageContent(pageId);

  // Subscribe to persona changes (D6)
  WorkbookDemo.subscribe('personaChange', function() {
    if (sidebar) {
      filterSidebarByPersona(sidebar);
      updatePersonaDisplay(sidebar.querySelector('.persona-selector'));
    }
    if (pageId) applyAccessGuard(pageId);
  });

  // Subscribe to industry changes (D7)
  WorkbookDemo.subscribe('industryChange', function() {
    reloadIndustryData();
    if (pageId) updatePageContent(pageId);
    if (sidebar) {
      updateIndustryDisplay(sidebar.querySelector('.industry-selector'));
      initBadges(sidebar);
    }
  });
}

// Auto-run on DOM ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}
