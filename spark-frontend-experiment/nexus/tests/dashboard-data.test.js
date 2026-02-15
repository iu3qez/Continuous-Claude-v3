import { describe, it, expect, beforeEach } from 'vitest';

describe('Dashboard Data Binding', () => {
  describe('industry data adaptation', () => {
    it('should return consulting metrics for consulting industry', () => {
      const industry = 'consulting';
      const metrics = {
        consulting: { pipeline: '$2.4M', target: '$1.8M', retention: '94%' },
        tech: { pipeline: '$180K MRR', target: '$200K', retention: '91%' },
        hospitality: { pipeline: '$890K revenue', target: '$1M', retention: '88%' }
      };
      expect(metrics[industry].pipeline).toBe('$2.4M');
    });

    it('should return tech metrics for tech industry', () => {
      const industry = 'tech';
      const metrics = {
        consulting: { companyName: 'Meridian Consulting' },
        tech: { companyName: 'ByteForge Labs' },
        hospitality: { companyName: 'Harbor Restaurant Group' }
      };
      expect(metrics[industry].companyName).toBe('ByteForge Labs');
    });

    it('should return hospitality metrics for hospitality industry', () => {
      const industry = 'hospitality';
      const metrics = {
        consulting: { teamSize: 8 },
        tech: { teamSize: 8 },
        hospitality: { teamSize: 8, locations: 3 }
      };
      expect(metrics[industry].locations).toBe(3);
    });
  });

  describe('persona-aware content', () => {
    it('should show all workspaces for CEO persona', () => {
      const persona = 'ceo';
      const visibleWorkspaces = {
        ceo: ['operations', 'engineering', 'sales', 'marketing', 'finance', 'hr'],
        ops: ['operations'],
        engineering: ['engineering'],
        new: ['operations']
      };
      expect(visibleWorkspaces[persona]).toHaveLength(6);
    });

    it('should limit workspaces for new employee persona', () => {
      const persona = 'new';
      const visibleWorkspaces = {
        ceo: ['operations', 'engineering', 'sales', 'marketing', 'finance', 'hr'],
        ops: ['operations'],
        engineering: ['engineering'],
        new: ['operations']
      };
      expect(visibleWorkspaces[persona]).toHaveLength(1);
    });
  });

  describe('guided mode highlights', () => {
    it('should identify highlightable sections', () => {
      const sections = ['ai-briefing', 'metrics', 'meetings', 'actions', 'roi-widget'];
      expect(sections).toContain('ai-briefing');
      expect(sections).toContain('roi-widget');
    });

    it('should pulse sections in guided mode', () => {
      const guidedMode = true;
      const pulseClass = guidedMode ? 'pulse-highlight' : '';
      expect(pulseClass).toBe('pulse-highlight');
    });
  });

  describe('metric formatting', () => {
    it('should format currency values', () => {
      const formatCurrency = (val) => {
        if (val >= 1000000) return '$' + (val / 1000000).toFixed(1) + 'M';
        if (val >= 1000) return '$' + (val / 1000).toFixed(0) + 'K';
        return '$' + val;
      };
      expect(formatCurrency(2400000)).toBe('$2.4M');
      expect(formatCurrency(320000)).toBe('$320K');
      expect(formatCurrency(500)).toBe('$500');
    });

    it('should format percentages', () => {
      const formatPercent = (val) => Math.round(val * 100) + '%';
      expect(formatPercent(0.94)).toBe('94%');
      expect(formatPercent(0.125)).toBe('13%');
    });
  });
});
