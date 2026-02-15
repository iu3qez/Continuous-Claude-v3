import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Calendar Month View', () => {
  let calMonth;

  beforeEach(async () => {
    vi.resetModules();
    document.body.innerHTML = '';
    calMonth = await import('../components/calendar-month.js');
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('buildMonthGrid', () => {
    it('returns an element with month-grid class', () => {
      const grid = calMonth.buildMonthGrid(2026, 1); // Feb 2026
      expect(grid).toBeInstanceOf(HTMLElement);
      expect(grid.classList.contains('month-grid')).toBe(true);
    });

    it('has 7 day headers (Mon-Sun)', () => {
      const grid = calMonth.buildMonthGrid(2026, 1);
      const headers = grid.querySelectorAll('.month-day-header');
      expect(headers).toHaveLength(7);
      expect(headers[0].textContent).toBe('Mon');
      expect(headers[6].textContent).toBe('Sun');
    });

    it('February 2026 has 28 current-month day cells', () => {
      const grid = calMonth.buildMonthGrid(2026, 1);
      const allCells = grid.querySelectorAll('.month-cell:not(.other-month)');
      expect(allCells).toHaveLength(28);
    });

    it('today cell has today-cell class when viewing current month', () => {
      const now = new Date();
      const grid = calMonth.buildMonthGrid(now.getFullYear(), now.getMonth());
      const todayCell = grid.querySelector('.today-cell');
      expect(todayCell).not.toBeNull();
      const dayNum = todayCell.querySelector('.day-number');
      expect(parseInt(dayNum.textContent)).toBe(now.getDate());
    });

    it('cells with meetings show meeting-dot elements', () => {
      const meetings = { 10: [{ workspace: 'operations' }], 14: [{ workspace: 'engineering' }, { workspace: 'sales' }] };
      const grid = calMonth.buildMonthGrid(2026, 1, meetings);
      // Find cell for day 14
      const cells = grid.querySelectorAll('.month-cell:not(.other-month)');
      const day14Cell = Array.from(cells).find(c => c.querySelector('.day-number')?.textContent === '14');
      expect(day14Cell).not.toBeNull();
      const dots = day14Cell.querySelectorAll('.meeting-dot');
      expect(dots).toHaveLength(2);
    });

    it('other-month cells have reduced opacity class', () => {
      const grid = calMonth.buildMonthGrid(2026, 1);
      const otherCells = grid.querySelectorAll('.other-month');
      expect(otherCells.length).toBeGreaterThan(0);
    });
  });

  describe('getMonthMeetings', () => {
    it('returns meeting data for February 2026', () => {
      const meetings = calMonth.getMonthMeetings(2026, 1);
      expect(meetings).toBeDefined();
      expect(typeof meetings).toBe('object');
    });
  });

  describe('navigateMonth', () => {
    it('navigateMonth(2026, 1, 1) goes to March 2026', () => {
      const [year, month] = calMonth.navigateMonth(2026, 1, 1);
      expect(year).toBe(2026);
      expect(month).toBe(2);
    });

    it('navigateMonth(2026, 0, -1) goes to December 2025', () => {
      const [year, month] = calMonth.navigateMonth(2026, 0, -1);
      expect(year).toBe(2025);
      expect(month).toBe(11);
    });

    it('navigateMonth(2026, 11, 1) goes to January 2027', () => {
      const [year, month] = calMonth.navigateMonth(2026, 11, 1);
      expect(year).toBe(2027);
      expect(month).toBe(0);
    });
  });
});
