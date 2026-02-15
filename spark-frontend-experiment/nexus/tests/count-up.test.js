import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initCountUp } from '../components/count-up.js';

describe('Count Up Animation', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('sets final value immediately when reduced motion preferred', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });
    document.body.innerHTML = '<span data-count-up="42">0</span>';
    initCountUp();
    expect(document.querySelector('[data-count-up]').textContent).toBe('42');
  });

  it('handles elements with no data-count-up', () => {
    document.body.innerHTML = '<span>hello</span>';
    expect(() => initCountUp()).not.toThrow();
  });

  it('handles NaN values gracefully', () => {
    document.body.innerHTML = '<span data-count-up="abc">0</span>';
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });
    expect(() => initCountUp()).not.toThrow();
  });

  it('formats large numbers with locale', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });
    document.body.innerHTML = '<span data-count-up="1234">0</span>';
    initCountUp();
    // toLocaleString result depends on locale
    const text = document.querySelector('[data-count-up]').textContent;
    expect(text).toMatch(/1.?234/);
  });

  it('does nothing with empty DOM', () => {
    document.body.innerHTML = '';
    expect(() => initCountUp()).not.toThrow();
  });
});
