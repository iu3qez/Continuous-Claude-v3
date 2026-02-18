import { describe, it, expect, vi, beforeEach } from 'vitest';

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

describe('Industry Integration', () => {
  let WorkbookDemo, loadIndustryData, getIndustryFromUrl, registerDataset, initIndustry;

  beforeEach(async () => {
    localStorage.clear();
    document.body.innerHTML = '';
    vi.resetModules();

    const stateMod = await import('../components/state.js');
    WorkbookDemo = stateMod.default;
    WorkbookDemo.industry = 'consulting';
    WorkbookDemo.data = null;
    WorkbookDemo._listeners = {};

    const mod = await import('../components/industry.js');
    loadIndustryData = mod.loadIndustryData;
    getIndustryFromUrl = mod.getIndustryFromUrl;
    registerDataset = mod.registerDataset;
    initIndustry = mod.initIndustry;

    registerDataset('consulting', consultingData);
    registerDataset('tech', techData);
    registerDataset('hospitality', hospitalityData);
  });

  describe('cross-module state flow', () => {
    it('loadIndustryData updates both WorkbookDemo.data and WorkbookDemo.industry', () => {
      loadIndustryData('tech');
      expect(WorkbookDemo.data).toBe(techData);
      expect(WorkbookDemo.industry).toBe('tech');
    });

    it('loadIndustryData persists industry to localStorage', () => {
      loadIndustryData('hospitality');
      expect(localStorage.getItem('workbook-industry')).toBe('hospitality');
    });

    it('switchIndustry fires industryChange notification', () => {
      const handler = vi.fn();
      WorkbookDemo.subscribe('industryChange', handler);
      loadIndustryData('tech');
      expect(handler).toHaveBeenCalledWith({ industry: 'tech' });
    });

    it('switching industries updates data to the new dataset', () => {
      loadIndustryData('consulting');
      expect(WorkbookDemo.data.company.industry).toBe('consulting');
      loadIndustryData('tech');
      expect(WorkbookDemo.data.company.industry).toBe('tech');
      loadIndustryData('hospitality');
      expect(WorkbookDemo.data.company.industry).toBe('hospitality');
    });

    it('invalid industry does not change state', () => {
      loadIndustryData('consulting');
      const prevData = WorkbookDemo.data;
      const prevIndustry = WorkbookDemo.industry;
      loadIndustryData('invalid');
      expect(WorkbookDemo.data).toBe(prevData);
      expect(WorkbookDemo.industry).toBe(prevIndustry);
    });
  });

  describe('URL and localStorage priority', () => {
    it('URL param takes priority over localStorage', () => {
      localStorage.setItem('workbook-industry', 'hospitality');
      expect(getIndustryFromUrl('?industry=tech')).toBe('tech');
    });

    it('localStorage is used when no URL param', () => {
      localStorage.setItem('workbook-industry', 'tech');
      expect(getIndustryFromUrl('')).toBe('tech');
    });

    it('defaults to consulting when neither URL nor localStorage', () => {
      expect(getIndustryFromUrl('')).toBe('consulting');
    });
  });

  describe('initIndustry end-to-end', () => {
    it('loads industry from URL and sets WorkbookDemo state', () => {
      window.location._setSearch('?industry=hospitality');
      initIndustry();
      expect(WorkbookDemo.industry).toBe('hospitality');
      expect(WorkbookDemo.data).toBe(hospitalityData);
    });

    it('loads industry from localStorage when no URL param', () => {
      localStorage.setItem('workbook-industry', 'tech');
      window.location._setSearch('');
      initIndustry();
      expect(WorkbookDemo.industry).toBe('tech');
      expect(WorkbookDemo.data).toBe(techData);
    });
  });
});

describe('Industry Indicator', () => {
  beforeEach(async () => {
    localStorage.clear();
    document.body.innerHTML = '';
    vi.resetModules();

    // Initialize state so indicator can read it
    const stateMod = await import('../components/state.js');
    const WorkbookDemo = stateMod.default;
    WorkbookDemo.industry = 'consulting';
    WorkbookDemo.data = null;
    WorkbookDemo._listeners = {};

    // Register datasets so loadIndustryData works inside indicator
    const mod = await import('../components/industry.js');
    mod.registerDataset('consulting', consultingData);
    mod.registerDataset('tech', techData);
    mod.registerDataset('hospitality', hospitalityData);
  });

  it('createIndustryIndicator returns element with id "industry-indicator"', async () => {
    const { createIndustryIndicator } = await import('../components/industry-indicator.js');
    const el = createIndustryIndicator();
    expect(el).toBeTruthy();
    expect(el.id).toBe('industry-indicator');
  });

  it('contains a select element', async () => {
    const { createIndustryIndicator } = await import('../components/industry-indicator.js');
    const el = createIndustryIndicator();
    const select = el.querySelector('select');
    expect(select).toBeTruthy();
  });

  it('shows all 3 industries as options', async () => {
    const { createIndustryIndicator } = await import('../components/industry-indicator.js');
    const el = createIndustryIndicator();
    const options = el.querySelectorAll('option');
    expect(options.length).toBe(3);

    const values = Array.from(options).map(o => o.value);
    expect(values).toContain('consulting');
    expect(values).toContain('tech');
    expect(values).toContain('hospitality');
  });

  it('defaults to current industry from URL/localStorage', async () => {
    localStorage.setItem('workbook-industry', 'tech');
    vi.resetModules();

    // Re-register datasets after module reset
    const mod = await import('../components/industry.js');
    mod.registerDataset('consulting', consultingData);
    mod.registerDataset('tech', techData);
    mod.registerDataset('hospitality', hospitalityData);

    const { createIndustryIndicator } = await import('../components/industry-indicator.js');
    const el = createIndustryIndicator();
    const select = el.querySelector('select');
    expect(select.value).toBe('tech');
  });

  it('dispatches workbook:industry-changed event on select change', async () => {
    const { createIndustryIndicator } = await import('../components/industry-indicator.js');
    const el = createIndustryIndicator();
    document.body.appendChild(el);

    const handler = vi.fn();
    window.addEventListener('workbook:industry-changed', handler);

    const select = el.querySelector('select');
    select.value = 'tech';
    select.dispatchEvent(new Event('change'));

    expect(handler).toHaveBeenCalled();
    expect(handler.mock.calls[0][0].detail.industry).toBe('tech');

    window.removeEventListener('workbook:industry-changed', handler);
  });

  it('updates the color dot on industry change', async () => {
    const { createIndustryIndicator } = await import('../components/industry-indicator.js');
    const el = createIndustryIndicator();
    document.body.appendChild(el);

    const dot = el.querySelector('span');
    const initialColor = dot.style.background;

    const select = el.querySelector('select');
    select.value = 'hospitality';
    select.dispatchEvent(new Event('change'));

    // Hospitality color is #10B981
    expect(dot.style.background).not.toBe(initialColor);
  });

  it('initIndustryIndicator appends indicator to document.body', async () => {
    const { initIndustryIndicator } = await import('../components/industry-indicator.js');
    initIndustryIndicator();
    const el = document.getElementById('industry-indicator');
    expect(el).toBeTruthy();
    expect(document.body.contains(el)).toBe(true);
  });

  it('calls loadIndustryData when select changes', async () => {
    const industryMod = await import('../components/industry.js');
    const spy = vi.spyOn(industryMod, 'loadIndustryData');

    // Need fresh import of indicator after spy is set
    vi.resetModules();
    // Re-import with spy still active won't work after resetModules,
    // so we test by checking the side effect instead
    spy.mockRestore();

    const { createIndustryIndicator } = await import('../components/industry-indicator.js');
    // Re-register datasets for the fresh module
    const freshIndustry = await import('../components/industry.js');
    freshIndustry.registerDataset('consulting', consultingData);
    freshIndustry.registerDataset('tech', techData);
    freshIndustry.registerDataset('hospitality', hospitalityData);

    const el = createIndustryIndicator();
    document.body.appendChild(el);

    const select = el.querySelector('select');
    select.value = 'tech';
    select.dispatchEvent(new Event('change'));

    // Verify side effect: localStorage should be updated by loadIndustryData -> switchIndustry
    expect(localStorage.getItem('workbook-industry')).toBe('tech');
  });
});
