import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Tests for the industry switcher that lives at the top of the sidebar.
 *
 * Requirements:
 * - Moved from bottom-left fixed position to top of sidebar
 * - Styled dropdown with industry names + descriptions + color indicators
 * - "Match to your prospect" tooltip for first-time use
 * - Visible immediately when page loads
 * - Switching changes data instantly
 * - Respects sidebar collapse (hides label, shows icon only)
 */

// Stub datasets matching required schema
function makeStubDataset(overrides = {}) {
  return {
    company: { name: 'Test Co', industry: 'test' },
    team: [],
    meetings: [],
    actions: [],
    decisions: [],
    financials: { revenue: 0 },
    insights: [],
    ...overrides,
  };
}

const consultingData = makeStubDataset({ company: { name: 'Consulting Co', industry: 'consulting' } });
const techData = makeStubDataset({ company: { name: 'Tech Co', industry: 'tech' } });
const hospitalityData = makeStubDataset({ company: { name: 'Hospitality Co', industry: 'hospitality' } });

describe('Industry Switcher in Sidebar', () => {
  let sidebar, registerDataset;

  beforeEach(async () => {
    localStorage.clear();
    document.body.innerHTML = '';
    vi.resetModules();

    const stateMod = await import('../components/state.js');
    const WorkbookDemo = stateMod.default;
    WorkbookDemo.industry = 'consulting';
    WorkbookDemo.data = null;
    WorkbookDemo._listeners = {};

    const industryMod = await import('../components/industry.js');
    registerDataset = industryMod.registerDataset;
    registerDataset('consulting', consultingData);
    registerDataset('tech', techData);
    registerDataset('hospitality', hospitalityData);

    sidebar = await import('../components/sidebar.js');
  });

  describe('createSidebar includes industry switcher', () => {
    it('sidebar contains an industry switcher element', () => {
      const nav = sidebar.createSidebar();
      const switcher = nav.querySelector('[data-industry-switcher]');
      expect(switcher).not.toBeNull();
    });

    it('industry switcher is the first child of the sidebar', () => {
      const nav = sidebar.createSidebar();
      const firstChild = nav.firstElementChild;
      expect(firstChild.dataset.industrySwitcher).toBeDefined();
    });

    it('industry switcher contains a select element', () => {
      const nav = sidebar.createSidebar();
      const switcher = nav.querySelector('[data-industry-switcher]');
      const select = switcher.querySelector('select');
      expect(select).not.toBeNull();
    });

    it('select has all 3 industry options', () => {
      const nav = sidebar.createSidebar();
      const select = nav.querySelector('[data-industry-switcher] select');
      const options = select.querySelectorAll('option');
      expect(options).toHaveLength(3);

      const values = Array.from(options).map(o => o.value);
      expect(values).toContain('consulting');
      expect(values).toContain('tech');
      expect(values).toContain('hospitality');
    });

    it('each option shows the industry label text', () => {
      const nav = sidebar.createSidebar();
      const options = nav.querySelectorAll('[data-industry-switcher] option');
      const labels = Array.from(options).map(o => o.textContent);
      expect(labels).toContain('Consulting');
      expect(labels).toContain('Technology');
      expect(labels).toContain('Hospitality');
    });

    it('select defaults to current industry from URL/localStorage', () => {
      localStorage.setItem('workbook-industry', 'tech');
      // Need fresh module import to pick up localStorage
      // The switcher reads from getIndustryFromUrl which checks localStorage
      const nav = sidebar.createSidebar();
      const select = nav.querySelector('[data-industry-switcher] select');
      expect(select.value).toBe('tech');
    });
  });

  describe('color indicator', () => {
    it('switcher has a color dot element', () => {
      const nav = sidebar.createSidebar();
      const dot = nav.querySelector('[data-industry-switcher] [data-industry-dot]');
      expect(dot).not.toBeNull();
    });

    it('color dot reflects current industry color', () => {
      const nav = sidebar.createSidebar();
      const dot = nav.querySelector('[data-industry-switcher] [data-industry-dot]');
      // Default is consulting which has color #3B82F6
      expect(dot.style.background).toBe('rgb(59, 130, 246)');
    });

    it('color dot updates when industry changes', () => {
      const nav = sidebar.createSidebar();
      document.body.appendChild(nav);

      const select = nav.querySelector('[data-industry-switcher] select');
      select.value = 'hospitality';
      select.dispatchEvent(new Event('change'));

      const dot = nav.querySelector('[data-industry-switcher] [data-industry-dot]');
      // Hospitality color is #10B981 -> rgb(16, 185, 129)
      expect(dot.style.background).toBe('rgb(16, 185, 129)');
    });
  });

  describe('tooltip', () => {
    it('switcher has a tooltip for first-time use', () => {
      const nav = sidebar.createSidebar();
      const switcher = nav.querySelector('[data-industry-switcher]');
      expect(switcher.title).toBe('Match to your prospect');
    });
  });

  describe('event dispatching', () => {
    it('dispatches workbook:industry-changed event on select change', () => {
      const nav = sidebar.createSidebar();
      document.body.appendChild(nav);

      const handler = vi.fn();
      window.addEventListener('workbook:industry-changed', handler);

      const select = nav.querySelector('[data-industry-switcher] select');
      select.value = 'tech';
      select.dispatchEvent(new Event('change'));

      expect(handler).toHaveBeenCalled();
      expect(handler.mock.calls[0][0].detail.industry).toBe('tech');

      window.removeEventListener('workbook:industry-changed', handler);
    });

    it('calls loadIndustryData when select changes', () => {
      const nav = sidebar.createSidebar();
      document.body.appendChild(nav);

      const select = nav.querySelector('[data-industry-switcher] select');
      select.value = 'hospitality';
      select.dispatchEvent(new Event('change'));

      // Side effect: localStorage should be updated by loadIndustryData -> switchIndustry
      expect(localStorage.getItem('workbook-industry')).toBe('hospitality');
    });
  });

  describe('collapse behavior', () => {
    it('industry switcher label is hidden when sidebar is collapsed', () => {
      const nav = sidebar.createSidebar();
      sidebar.initCollapsible(nav);

      const toggleBtn = nav.querySelector('[data-sidebar-toggle]');
      toggleBtn.click(); // collapse

      const switcherLabel = nav.querySelector('[data-industry-switcher] .industry-switcher-label');
      if (switcherLabel) {
        expect(switcherLabel.style.display).toBe('none');
      }
      // If no separate label, the select itself should be hidden in collapsed mode
      const select = nav.querySelector('[data-industry-switcher] select');
      expect(select.style.display).toBe('none');
    });

    it('industry switcher label reappears when sidebar is expanded', () => {
      const nav = sidebar.createSidebar();
      sidebar.initCollapsible(nav);

      const toggleBtn = nav.querySelector('[data-sidebar-toggle]');
      toggleBtn.click(); // collapse
      toggleBtn.click(); // expand

      const select = nav.querySelector('[data-industry-switcher] select');
      expect(select.style.display).not.toBe('none');
    });

    it('color dot remains visible when sidebar is collapsed', () => {
      const nav = sidebar.createSidebar();
      sidebar.initCollapsible(nav);

      const toggleBtn = nav.querySelector('[data-sidebar-toggle]');
      toggleBtn.click(); // collapse

      const dot = nav.querySelector('[data-industry-switcher] [data-industry-dot]');
      expect(dot.style.display).not.toBe('none');
    });
  });

  describe('no regression', () => {
    it('sidebar still has 3 nav sections', () => {
      const nav = sidebar.createSidebar();
      const sections = nav.querySelectorAll('[data-section]');
      expect(sections).toHaveLength(3);
    });

    it('sidebar still has 13 nav items total', () => {
      const nav = sidebar.createSidebar();
      const items = nav.querySelectorAll('[data-nav-id]');
      expect(items).toHaveLength(13);
    });

    it('setActivePage still works', () => {
      const nav = sidebar.createSidebar();
      sidebar.setActivePage(nav, 'dashboard');
      const dashItem = nav.querySelector('[data-nav-id="dashboard"]');
      expect(dashItem.classList.contains('active')).toBe(true);
    });

    it('initCollapsible still works with industry switcher present', () => {
      const nav = sidebar.createSidebar();
      sidebar.initCollapsible(nav);

      const toggleBtn = nav.querySelector('[data-sidebar-toggle]');
      toggleBtn.click();
      expect(nav.style.width).toBe('56px');
      expect(nav.dataset.collapsed).toBe('true');
    });
  });
});
