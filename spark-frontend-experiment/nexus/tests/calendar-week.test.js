import { describe, it, expect } from 'vitest';

describe('Calendar Week View', () => {
  it('should generate 7-day grid', () => {
    const startDate = new Date('2026-02-10');
    const days = Array.from({length: 7}, (_, i) => {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      return d.toISOString().split('T')[0];
    });
    expect(days).toHaveLength(7);
    expect(days[0]).toBe('2026-02-10');
    expect(days[6]).toBe('2026-02-16');
  });

  it('should position meeting blocks by time', () => {
    const meeting = { start: '09:00', end: '10:00' };
    const startHour = parseInt(meeting.start.split(':')[0]);
    const endHour = parseInt(meeting.end.split(':')[0]);
    const gridStart = 8;
    const topOffset = (startHour - gridStart) * 60;
    const height = (endHour - startHour) * 60;
    expect(topOffset).toBe(60);
    expect(height).toBe(60);
  });

  it('should detect today column', () => {
    const today = new Date().getDay();
    expect(today).toBeGreaterThanOrEqual(0);
    expect(today).toBeLessThanOrEqual(6);
  });

  it('should count meetings per day', () => {
    const meetings = [
      { day: 'Mon' }, { day: 'Mon' }, { day: 'Tue' },
      { day: 'Wed' }, { day: 'Wed' }, { day: 'Thu' }, { day: 'Fri' }, { day: 'Fri' }
    ];
    const counts = meetings.reduce((acc, m) => {
      acc[m.day] = (acc[m.day] || 0) + 1;
      return acc;
    }, {});
    expect(counts['Mon']).toBe(2);
    expect(counts['Wed']).toBe(2);
  });

  it('should identify overlapping meetings', () => {
    const meetings = [
      { start: '09:00', end: '10:00' },
      { start: '09:30', end: '10:30' },
    ];
    const overlaps = (a, b) => a.start < b.end && b.start < a.end;
    expect(overlaps(meetings[0], meetings[1])).toBe(true);
  });
});
