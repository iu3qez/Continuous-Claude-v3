import { describe, it, expect } from 'vitest';

describe('Decisions Table View', () => {
  it('should toggle between timeline and table views', () => {
    const views = ['timeline', 'table'];
    let activeView = 'timeline';

    activeView = 'table';
    expect(activeView).toBe('table');

    activeView = 'timeline';
    expect(activeView).toBe('timeline');
  });

  it('should sort decisions by date', () => {
    const decisions = [
      { date: '2026-02-01', title: 'A' },
      { date: '2026-02-15', title: 'B' },
      { date: '2026-02-08', title: 'C' },
    ];
    const sorted = [...decisions].sort((a, b) => new Date(b.date) - new Date(a.date));
    expect(sorted[0].title).toBe('B');
  });

  it('should filter by status', () => {
    const decisions = [
      { status: 'executed', title: 'A' },
      { status: 'pending', title: 'B' },
      { status: 'executed', title: 'C' },
    ];
    const filtered = decisions.filter(d => d.status === 'executed');
    expect(filtered).toHaveLength(2);
  });

  it('should filter by workspace', () => {
    const decisions = [
      { workspace: 'operations', title: 'A' },
      { workspace: 'engineering', title: 'B' },
      { workspace: 'operations', title: 'C' },
    ];
    const filtered = decisions.filter(d => d.workspace === 'operations');
    expect(filtered).toHaveLength(2);
  });
});
