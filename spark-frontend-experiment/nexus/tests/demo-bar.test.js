import { describe, it, expect, beforeEach } from 'vitest';
import { initDemoBar, toggleVisibility, isDemoBarVisible } from '../demo/demo-bar.js';

describe('Demo Control Bar', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should create bar element on init', () => {
    initDemoBar();
    const bar = document.getElementById('demo-bar');
    expect(bar).not.toBeNull();
  });

  it('should start hidden', () => {
    initDemoBar();
    const bar = document.getElementById('demo-bar');
    expect(bar.style.display).toBe('none');
  });

  it('should contain navigation buttons', () => {
    initDemoBar();
    expect(document.getElementById('demo-prev')).not.toBeNull();
    expect(document.getElementById('demo-next')).not.toBeNull();
    expect(document.getElementById('demo-close')).not.toBeNull();
  });

  it('should contain narration area', () => {
    initDemoBar();
    expect(document.getElementById('demo-narration')).not.toBeNull();
  });

  it('should contain arc selector', () => {
    initDemoBar();
    const select = document.getElementById('demo-arc-select');
    expect(select).not.toBeNull();
    // Should have options for 5 arcs + default
    expect(select.options.length).toBeGreaterThanOrEqual(6);
  });

  it('should contain progress dots container', () => {
    initDemoBar();
    expect(document.getElementById('demo-dots')).not.toBeNull();
  });

  it('should toggle visibility', () => {
    initDemoBar();
    expect(isDemoBarVisible()).toBe(true);
    toggleVisibility();
    expect(isDemoBarVisible()).toBe(false);
    toggleVisibility();
    expect(isDemoBarVisible()).toBe(true);
  });
});
