import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateDataset } from '../data/shared.js';

// Stub datasets that match the required schema
// DATASET_SECTIONS = ['company', 'team', 'meetings', 'actions', 'decisions', 'financials', 'insights']
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

describe('Industry Data Loader', () => {
  let loadIndustryData, getCurrentIndustry, getIndustryFromUrl, registerDataset, initIndustry;
  let WorkbookDemo;

  beforeEach(async () => {
    localStorage.clear();
    vi.resetModules();

    const stateMod = await import('../components/state.js');
    WorkbookDemo = stateMod.default;

    // Reset WorkbookDemo state
    WorkbookDemo.industry = 'consulting';
    WorkbookDemo.data = null;
    WorkbookDemo._listeners = {};

    const mod = await import('../components/industry.js');
    loadIndustryData = mod.loadIndustryData;
    getCurrentIndustry = mod.getCurrentIndustry;
    getIndustryFromUrl = mod.getIndustryFromUrl;
    registerDataset = mod.registerDataset;
    initIndustry = mod.initIndustry;

    // Register stub datasets for testing
    registerDataset('consulting', consultingData);
    registerDataset('tech', techData);
    registerDataset('hospitality', hospitalityData);
  });

  describe('loadIndustryData', () => {
    it('returns consulting dataset when given "consulting"', () => {
      const result = loadIndustryData('consulting');
      expect(result).toBe(consultingData);
      expect(result.company.industry).toBe('consulting');
    });

    it('returns tech dataset when given "tech"', () => {
      const result = loadIndustryData('tech');
      expect(result).toBe(techData);
      expect(result.company.industry).toBe('tech');
    });

    it('returns hospitality dataset when given "hospitality"', () => {
      const result = loadIndustryData('hospitality');
      expect(result).toBe(hospitalityData);
      expect(result.company.industry).toBe('hospitality');
    });

    it('returns null for an invalid industry id', () => {
      const result = loadIndustryData('invalid');
      expect(result).toBeNull();
    });

    it('returns null for undefined industry id', () => {
      const result = loadIndustryData(undefined);
      expect(result).toBeNull();
    });
  });

  describe('getCurrentIndustry', () => {
    it('returns null before any data is loaded', () => {
      // WorkbookDemo.data was reset to null in beforeEach
      const result = getCurrentIndustry();
      expect(result).toBeNull();
    });

    it('returns the currently loaded dataset after loading', () => {
      loadIndustryData('tech');
      const result = getCurrentIndustry();
      expect(result).toBe(techData);
    });

    it('returns the most recently loaded dataset', () => {
      loadIndustryData('consulting');
      loadIndustryData('hospitality');
      const result = getCurrentIndustry();
      expect(result).toBe(hospitalityData);
    });
  });

  describe('getIndustryFromUrl', () => {
    it('parses industry=tech from URL search string', () => {
      const result = getIndustryFromUrl('?industry=tech');
      expect(result).toBe('tech');
    });

    it('parses industry=consulting from URL search string', () => {
      const result = getIndustryFromUrl('?industry=consulting');
      expect(result).toBe('consulting');
    });

    it('parses industry=hospitality from URL search string', () => {
      const result = getIndustryFromUrl('?industry=hospitality');
      expect(result).toBe('hospitality');
    });

    it('returns default "consulting" for empty search string', () => {
      const result = getIndustryFromUrl('');
      expect(result).toBe('consulting');
    });

    it('returns default "consulting" for invalid industry param', () => {
      const result = getIndustryFromUrl('?industry=invalid');
      expect(result).toBe('consulting');
    });

    it('returns default "consulting" when no industry param present', () => {
      const result = getIndustryFromUrl('?other=value');
      expect(result).toBe('consulting');
    });

    it('returns localStorage industry when no URL param and localStorage is set', () => {
      localStorage.setItem('workbook-industry', 'tech');
      const result = getIndustryFromUrl('');
      expect(result).toBe('tech');
    });

    it('prefers URL param over localStorage', () => {
      localStorage.setItem('workbook-industry', 'tech');
      const result = getIndustryFromUrl('?industry=hospitality');
      expect(result).toBe('hospitality');
    });
  });

  describe('WorkbookDemo.data integration', () => {
    it('sets WorkbookDemo.data after loading', () => {
      expect(WorkbookDemo.data).toBeNull();
      loadIndustryData('consulting');
      expect(WorkbookDemo.data).toBe(consultingData);
    });

    it('updates WorkbookDemo.data when switching industries', () => {
      loadIndustryData('consulting');
      expect(WorkbookDemo.data).toBe(consultingData);
      loadIndustryData('tech');
      expect(WorkbookDemo.data).toBe(techData);
    });

    it('does not change WorkbookDemo.data for invalid industry', () => {
      loadIndustryData('consulting');
      loadIndustryData('invalid');
      // data should remain as consulting since invalid returns null
      expect(WorkbookDemo.data).toBe(consultingData);
    });

    it('calls WorkbookDemo.switchIndustry on valid load', () => {
      const spy = vi.spyOn(WorkbookDemo, 'switchIndustry');
      loadIndustryData('tech');
      expect(spy).toHaveBeenCalledWith('tech');
      spy.mockRestore();
    });

    it('does not call WorkbookDemo.switchIndustry on invalid load', () => {
      const spy = vi.spyOn(WorkbookDemo, 'switchIndustry');
      loadIndustryData('invalid');
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('dataset validation', () => {
    it('loaded consulting dataset passes validateDataset', () => {
      const result = loadIndustryData('consulting');
      expect(validateDataset(result)).toBe(true);
    });

    it('loaded tech dataset passes validateDataset', () => {
      const result = loadIndustryData('tech');
      expect(validateDataset(result)).toBe(true);
    });

    it('loaded hospitality dataset passes validateDataset', () => {
      const result = loadIndustryData('hospitality');
      expect(validateDataset(result)).toBe(true);
    });
  });
});
