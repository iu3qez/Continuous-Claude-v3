import { describe, it, expect, vi, beforeEach } from 'vitest';

// The marketplace page uses inline script (no separate module).
// We replicate the agent data and rendering logic here to test DOM output,
// category filtering, search, sort, and persona access.

const AGENTS = [
  { id: 1, name: 'Meeting Prep Pro', category: 'operations', description: 'Automated meeting prep with CRM context and action tracking', rating: 4.9, installs: '3.2K', icon: 'CAL', color: 'bg-blue-500' },
  { id: 2, name: 'Sales Pipeline Guardian', category: 'sales', description: 'Monitors deal health and alerts on risk signals', rating: 4.8, installs: '2.8K', icon: 'TGT', color: 'bg-green-500' },
  { id: 3, name: 'Action Enforcer', category: 'operations', description: 'Tracks action items and sends follow-ups automatically', rating: 4.7, installs: '4.1K', icon: 'CHK', color: 'bg-purple-500' },
  { id: 4, name: 'Compliance Scanner', category: 'finance', description: 'Monitors regulatory deadlines and policy compliance', rating: 4.9, installs: '1.9K', icon: 'MAG', color: 'bg-red-500' },
  { id: 5, name: 'Report Builder', category: 'operations', description: 'Generates executive reports from connected data', rating: 4.6, installs: '3.5K', icon: 'BAR', color: 'bg-indigo-500' },
  { id: 6, name: 'Email Summarizer', category: 'operations', description: 'Summarizes long email threads into key points', rating: 4.8, installs: '5.2K', icon: 'ENV', color: 'bg-cyan-500' },
  { id: 7, name: 'Code Review Assistant', category: 'engineering', description: 'Reviews PRs and suggests improvements', rating: 4.7, installs: '2.1K', icon: 'LAP', color: 'bg-emerald-500' },
  { id: 8, name: 'Budget Monitor', category: 'finance', description: 'Tracks spending against budgets with alerts', rating: 4.5, installs: '1.4K', icon: 'MON', color: 'bg-yellow-500' },
  { id: 9, name: 'Hiring Coordinator', category: 'hr', description: 'Streamlines interview scheduling and feedback collection', rating: 4.6, installs: '980', icon: 'PPL', color: 'bg-pink-500' },
  { id: 10, name: 'Campaign Analyst', category: 'sales', description: 'Analyzes marketing campaign performance in real-time', rating: 4.4, installs: '1.7K', icon: 'UP', color: 'bg-orange-500' },
  { id: 11, name: 'Knowledge Base Builder', category: 'engineering', description: 'Auto-generates documentation from conversations', rating: 4.3, installs: '890', icon: 'BKS', color: 'bg-teal-500' },
  { id: 12, name: 'Customer Success Monitor', category: 'sales', description: 'Tracks customer health scores and churn signals', rating: 4.9, installs: '2.6K', icon: 'HRT', color: 'bg-rose-500' },
];

const CATEGORIES = ['all', 'sales', 'operations', 'engineering', 'finance', 'hr', 'custom'];

// Replicates renderAgentCard from marketplace.html
function renderAgentCard(agent) {
  return `
    <div class="agent-card bg-surface border border-border rounded-lg p-6 hover:border-accent/50 transition-all duration-200 fade-in" data-category="${agent.category}">
      <div class="flex items-start gap-4 mb-4">
        <div class="${agent.color} w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
          ${agent.icon}
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="font-semibold text-base mb-1 truncate">${agent.name}</h3>
          <span class="inline-block px-2 py-1 text-xs rounded border capitalize">
            ${agent.category}
          </span>
        </div>
      </div>
      <p class="txt-secondary text-sm mb-4 line-clamp-2 min-h-[2.5rem]">
        ${agent.description}
      </p>
      <div class="flex items-center gap-4 mb-4 text-sm txt-secondary">
        <div class="flex items-center gap-1">
          <span>${agent.rating}</span>
        </div>
        <div>${agent.installs} installs</div>
      </div>
      <div class="flex gap-2">
        <button class="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:border-accent transition-colors preview-btn">
          Preview
        </button>
        <button class="flex-1 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors install-btn">
          Install
        </button>
      </div>
    </div>
  `;
}

// Replicates getFilteredAgents from marketplace.html
function getFilteredAgents(category, searchQuery, sortMode) {
  let filtered = [...AGENTS];

  if (category !== 'all') {
    filtered = filtered.filter(a => a.category === category);
  }

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(a =>
      a.name.toLowerCase().includes(query) ||
      a.description.toLowerCase().includes(query) ||
      a.category.toLowerCase().includes(query)
    );
  }

  if (sortMode === 'popular') {
    filtered.sort((a, b) => {
      const aNum = parseFloat(a.installs.replace('K', '')) * (a.installs.includes('K') ? 1000 : 1);
      const bNum = parseFloat(b.installs.replace('K', '')) * (b.installs.includes('K') ? 1000 : 1);
      return bNum - aNum;
    });
  } else if (sortMode === 'rated') {
    filtered.sort((a, b) => b.rating - a.rating);
  } else if (sortMode === 'newest') {
    filtered.reverse();
  }

  return filtered;
}

// Sets up the marketplace DOM structure matching marketplace.html
function setupMarketplaceDOM() {
  document.body.innerHTML = `
    <div class="flex min-h-screen">
      <aside id="sidebar"></aside>
      <main class="flex-1 overflow-y-auto">
        <div class="max-w-7xl mx-auto p-8">
          <header class="mb-8">
            <h1 class="text-3xl font-bold mb-2">Agent Marketplace</h1>
            <p class="txt-secondary text-base mb-6">Discover and install AI agents for your workflows</p>
            <div class="flex flex-col sm:flex-row gap-4 mb-6">
              <div class="flex-1">
                <input type="text" id="searchInput" placeholder="Search agents..." class="w-full px-4 py-2 bg-bg border border-border rounded-lg" />
              </div>
              <div class="relative">
                <select id="sortSelect" class="px-4 py-2 bg-bg border border-border rounded-lg">
                  <option value="popular">Most Popular</option>
                  <option value="rated">Highest Rated</option>
                  <option value="newest">Newest</option>
                </select>
              </div>
            </div>
            <div class="flex flex-wrap gap-2" id="categoryChips">
              <button class="category-chip active" data-category="all">All</button>
              <button class="category-chip" data-category="sales">Sales</button>
              <button class="category-chip" data-category="operations">Operations</button>
              <button class="category-chip" data-category="engineering">Engineering</button>
              <button class="category-chip" data-category="finance">Finance</button>
              <button class="category-chip" data-category="hr">HR</button>
              <button class="category-chip" data-category="custom">Custom</button>
            </div>
          </header>
          <div id="agentGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"></div>
        </div>
      </main>
    </div>
    <div id="toast" class="fixed bottom-8 right-8 bg-surface border border-border rounded-lg p-4 shadow-lg transform translate-y-32 opacity-0 transition-all duration-300 z-50">
      <p class="text-sm font-medium">Coming Soon</p>
    </div>
  `;
}

// Renders the agent grid into #agentGrid
function renderGrid(category = 'all', search = '', sort = 'popular') {
  const grid = document.getElementById('agentGrid');
  const filtered = getFilteredAgents(category, search, sort);

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full text-center py-16 txt-secondary">
        <p class="text-lg">No agents found</p>
        <p class="text-sm mt-2">Try adjusting your filters or search query</p>
      </div>
    `;
  } else {
    grid.innerHTML = filtered.map(renderAgentCard).join('');
  }
}


describe('Marketplace Page', () => {
  let WorkbookDemo;
  let persona;

  beforeEach(async () => {
    localStorage.clear();
    vi.resetModules();
    document.body.innerHTML = '';

    const stateMod = await import('../components/state.js');
    WorkbookDemo = stateMod.default;
    WorkbookDemo.industry = 'consulting';
    WorkbookDemo.persona = 'ceo';
    WorkbookDemo._listeners = {};

    persona = await import('../components/persona.js');

    setupMarketplaceDOM();
    renderGrid();
  });

  // ----------------------------------------------------------------
  // 1. Persona Access (4 tests)
  // ----------------------------------------------------------------
  describe('Persona Access', () => {
    it('CEO can access the marketplace page', () => {
      expect(persona.canAccessPage('marketplace', 'ceo')).toBe(true);
    });

    it('ops persona cannot access the marketplace page', () => {
      expect(persona.canAccessPage('marketplace', 'ops')).toBe(false);
    });

    it('new persona cannot access the marketplace page', () => {
      expect(persona.canAccessPage('marketplace', 'new')).toBe(false);
    });

    it('engineering persona cannot access the marketplace page', () => {
      // engineering pages list does not include marketplace
      expect(persona.canAccessPage('marketplace', 'engineering')).toBe(false);
    });
  });

  // ----------------------------------------------------------------
  // 2. Search Bar (3 tests)
  // ----------------------------------------------------------------
  describe('Search Bar', () => {
    it('search input exists with correct placeholder', () => {
      const searchInput = document.getElementById('searchInput');
      expect(searchInput).not.toBeNull();
      expect(searchInput.placeholder).toBe('Search agents...');
    });

    it('search filters agent cards by name', () => {
      const filtered = getFilteredAgents('all', 'pipeline', 'popular');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Sales Pipeline Guardian');
    });

    it('search filters by description text', () => {
      const filtered = getFilteredAgents('all', 'regulatory', 'popular');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Compliance Scanner');
    });
  });

  // ----------------------------------------------------------------
  // 3. Category Filters (5 tests)
  // ----------------------------------------------------------------
  describe('Category Filters', () => {
    it('all 7 category chips exist in the DOM', () => {
      const chips = document.querySelectorAll('.category-chip');
      expect(chips).toHaveLength(7);
    });

    it('category chips have correct data-category values', () => {
      const chips = document.querySelectorAll('.category-chip');
      const categories = Array.from(chips).map(c => c.dataset.category);
      expect(categories).toEqual(CATEGORIES);
    });

    it('"All" chip is active by default', () => {
      const allChip = document.querySelector('[data-category="all"]');
      expect(allChip.classList.contains('active')).toBe(true);
    });

    it('filtering by sales returns only sales agents', () => {
      const filtered = getFilteredAgents('sales', '', 'popular');
      expect(filtered).toHaveLength(3);
      filtered.forEach(agent => {
        expect(agent.category).toBe('sales');
      });
    });

    it('filtering by engineering returns only engineering agents', () => {
      const filtered = getFilteredAgents('engineering', '', 'popular');
      expect(filtered).toHaveLength(2);
      filtered.forEach(agent => {
        expect(agent.category).toBe('engineering');
      });
    });
  });

  // ----------------------------------------------------------------
  // 4. Sort Options (3 tests)
  // ----------------------------------------------------------------
  describe('Sort Options', () => {
    it('sort select has 3 options: popular, rated, newest', () => {
      const select = document.getElementById('sortSelect');
      const options = select.querySelectorAll('option');
      expect(options).toHaveLength(3);

      const values = Array.from(options).map(o => o.value);
      expect(values).toContain('popular');
      expect(values).toContain('rated');
      expect(values).toContain('newest');
    });

    it('sorting by popular puts highest installs first', () => {
      const sorted = getFilteredAgents('all', '', 'popular');
      // Email Summarizer has 5.2K = highest
      expect(sorted[0].name).toBe('Email Summarizer');
      expect(sorted[0].installs).toBe('5.2K');
    });

    it('sorting by rated puts highest rating first', () => {
      const sorted = getFilteredAgents('all', '', 'rated');
      expect(sorted[0].rating).toBe(4.9);
      // All 4.9-rated agents should come before 4.8-rated ones
      const firstNon49 = sorted.findIndex(a => a.rating < 4.9);
      for (let i = 0; i < firstNon49; i++) {
        expect(sorted[i].rating).toBe(4.9);
      }
    });
  });

  // ----------------------------------------------------------------
  // 5. Agent Card DOM (5 tests)
  // ----------------------------------------------------------------
  describe('Agent Card DOM', () => {
    it('each agent card has the agent-card class', () => {
      const cards = document.querySelectorAll('.agent-card');
      expect(cards.length).toBeGreaterThan(0);
      cards.forEach(card => {
        expect(card.classList.contains('agent-card')).toBe(true);
      });
    });

    it('each agent card has a name in an h3 element', () => {
      const cards = document.querySelectorAll('.agent-card');
      cards.forEach(card => {
        const h3 = card.querySelector('h3');
        expect(h3).not.toBeNull();
        expect(h3.textContent.trim().length).toBeGreaterThan(0);
      });
    });

    it('each agent card has a description paragraph', () => {
      const cards = document.querySelectorAll('.agent-card');
      cards.forEach(card => {
        const desc = card.querySelector('p');
        expect(desc).not.toBeNull();
        expect(desc.textContent.trim().length).toBeGreaterThan(0);
      });
    });

    it('each agent card has a data-category attribute', () => {
      const cards = document.querySelectorAll('.agent-card');
      cards.forEach(card => {
        const cat = card.getAttribute('data-category');
        expect(cat).not.toBeNull();
        expect(['sales', 'operations', 'engineering', 'finance', 'hr', 'custom']).toContain(cat);
      });
    });

    it('each agent card has a category tag span', () => {
      const cards = document.querySelectorAll('.agent-card');
      cards.forEach(card => {
        const span = card.querySelector('span.capitalize');
        expect(span).not.toBeNull();
        expect(span.textContent.trim().length).toBeGreaterThan(0);
      });
    });
  });

  // ----------------------------------------------------------------
  // 6. Install Button and Toast (3 tests)
  // ----------------------------------------------------------------
  describe('Install Button and Toast', () => {
    it('each agent card has an Install button', () => {
      const cards = document.querySelectorAll('.agent-card');
      cards.forEach(card => {
        const installBtn = card.querySelector('.install-btn');
        expect(installBtn).not.toBeNull();
        expect(installBtn.textContent.trim()).toBe('Install');
      });
    });

    it('each agent card has a Preview button', () => {
      const cards = document.querySelectorAll('.agent-card');
      cards.forEach(card => {
        const previewBtn = card.querySelector('.preview-btn');
        expect(previewBtn).not.toBeNull();
        expect(previewBtn.textContent.trim()).toBe('Preview');
      });
    });

    it('toast element exists and contains Coming Soon text', () => {
      const toast = document.getElementById('toast');
      expect(toast).not.toBeNull();
      expect(toast.textContent).toContain('Coming Soon');
    });
  });

  // ----------------------------------------------------------------
  // 7. Agent Count (2 tests)
  // ----------------------------------------------------------------
  describe('Agent Count', () => {
    it('agent data contains exactly 12 agents', () => {
      expect(AGENTS).toHaveLength(12);
    });

    it('grid renders all 12 agent cards when unfiltered', () => {
      const cards = document.querySelectorAll('.agent-card');
      expect(cards).toHaveLength(12);
    });
  });

  // ----------------------------------------------------------------
  // 8. Page Header (2 tests)
  // ----------------------------------------------------------------
  describe('Page Header', () => {
    it('has "Agent Marketplace" as the page title', () => {
      const h1 = document.querySelector('h1');
      expect(h1).not.toBeNull();
      expect(h1.textContent).toBe('Agent Marketplace');
    });

    it('has a subtitle describing the marketplace', () => {
      const subtitle = document.querySelector('header p');
      expect(subtitle).not.toBeNull();
      expect(subtitle.textContent).toContain('Discover and install AI agents');
    });
  });

  // ----------------------------------------------------------------
  // 9. Filtering Integration (3 tests)
  // ----------------------------------------------------------------
  describe('Filtering Integration', () => {
    it('filtering by finance returns 2 agents', () => {
      const filtered = getFilteredAgents('finance', '', 'popular');
      expect(filtered).toHaveLength(2);
      expect(filtered.map(a => a.name)).toContain('Compliance Scanner');
      expect(filtered.map(a => a.name)).toContain('Budget Monitor');
    });

    it('filtering by hr returns 1 agent', () => {
      const filtered = getFilteredAgents('hr', '', 'popular');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Hiring Coordinator');
    });

    it('filtering by custom returns 0 agents', () => {
      const filtered = getFilteredAgents('custom', '', 'popular');
      expect(filtered).toHaveLength(0);
    });
  });

  // ----------------------------------------------------------------
  // 10. Empty State (2 tests)
  // ----------------------------------------------------------------
  describe('Empty State', () => {
    it('shows "No agents found" when search matches nothing', () => {
      renderGrid('all', 'zzzznonexistent', 'popular');
      const grid = document.getElementById('agentGrid');
      expect(grid.textContent).toContain('No agents found');
    });

    it('shows hint text when no results', () => {
      renderGrid('all', 'zzzznonexistent', 'popular');
      const grid = document.getElementById('agentGrid');
      expect(grid.textContent).toContain('Try adjusting your filters or search query');
    });
  });

  // ----------------------------------------------------------------
  // 11. Combined Search + Category (2 tests)
  // ----------------------------------------------------------------
  describe('Combined Search and Category', () => {
    it('search within a category narrows results further', () => {
      const filtered = getFilteredAgents('operations', 'email', 'popular');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Email Summarizer');
    });

    it('search term matching category name includes those agents', () => {
      // Searching "sales" matches category field
      const filtered = getFilteredAgents('all', 'sales', 'popular');
      const names = filtered.map(a => a.name);
      expect(names).toContain('Sales Pipeline Guardian');
    });
  });

  // ----------------------------------------------------------------
  // 12. Preview Modal (TASK-010)
  // ----------------------------------------------------------------
  describe('Preview Modal (TASK-010)', () => {
    let detailDrawer;
    let marketplace;

    beforeEach(async () => {
      detailDrawer = await import('../components/detail-drawer.js');
      marketplace = await import('../components/marketplace-preview.js');
    });

    it('showAgentPreview creates and opens a drawer', () => {
      const agent = AGENTS[0]; // Meeting Prep Pro
      marketplace.showAgentPreview(agent);
      const drawer = document.querySelector('.detail-drawer');
      expect(drawer).not.toBeNull();
      expect(detailDrawer.isDrawerOpen(drawer)).toBe(true);
    });

    it('preview drawer shows agent name as title', () => {
      const agent = AGENTS[0];
      marketplace.showAgentPreview(agent);
      const title = document.querySelector('.drawer-title');
      expect(title.textContent).toBe('Meeting Prep Pro');
    });

    it('preview drawer shows agent description', () => {
      const agent = AGENTS[0];
      marketplace.showAgentPreview(agent);
      const content = document.querySelector('.drawer-content');
      expect(content.textContent).toContain('Automated meeting prep');
    });

    it('preview drawer shows category', () => {
      const agent = AGENTS[1]; // Sales Pipeline Guardian - sales
      marketplace.showAgentPreview(agent);
      const content = document.querySelector('.drawer-content');
      expect(content.textContent).toContain('sales');
    });

    it('preview drawer shows rating', () => {
      const agent = AGENTS[0]; // rating 4.9
      marketplace.showAgentPreview(agent);
      const content = document.querySelector('.drawer-content');
      expect(content.textContent).toContain('4.9');
    });

    it('preview drawer shows install count', () => {
      const agent = AGENTS[0]; // 3.2K installs
      marketplace.showAgentPreview(agent);
      const content = document.querySelector('.drawer-content');
      expect(content.textContent).toContain('3.2K');
    });

    it('preview drawer has Install button', () => {
      const agent = AGENTS[0];
      marketplace.showAgentPreview(agent);
      const installBtn = document.querySelector('.drawer-content [data-action="install"]');
      expect(installBtn).not.toBeNull();
      expect(installBtn.textContent).toContain('Install');
    });

    it('preview drawer has Close button', () => {
      const agent = AGENTS[0];
      marketplace.showAgentPreview(agent);
      // The drawer header already has a close button from detail-drawer.js
      const closeBtn = document.querySelector('.drawer-close');
      expect(closeBtn).not.toBeNull();
    });

    it('closing preview drawer removes it from view', () => {
      const agent = AGENTS[0];
      marketplace.showAgentPreview(agent);
      const drawer = document.querySelector('.detail-drawer');
      detailDrawer.closeDrawer(drawer);
      expect(detailDrawer.isDrawerOpen(drawer)).toBe(false);
    });
  });
});
