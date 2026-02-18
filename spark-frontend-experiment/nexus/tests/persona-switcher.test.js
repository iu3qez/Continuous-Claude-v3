import { describe, it, expect, beforeEach } from 'vitest';
import { initPersonaSwitcher, isDropdownOpen } from '../demo/persona-switcher.js';

describe('Persona Switcher', () => {
  let container;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    container.style.position = 'relative';
    document.body.appendChild(container);
  });

  it('should render persona trigger', () => {
    initPersonaSwitcher(container);
    const trigger = container.querySelector('#persona-trigger');
    expect(trigger).not.toBeNull();
  });

  it('should show current persona name', () => {
    initPersonaSwitcher(container);
    const nameEl = container.querySelector('#persona-trigger');
    expect(nameEl.textContent).toContain('Jay');
  });

  it('should render dropdown with all personas', () => {
    initPersonaSwitcher(container);
    const dropdown = container.querySelector('#persona-dropdown');
    expect(dropdown).not.toBeNull();
    // 4 persona items + header
    const items = dropdown.children;
    expect(items.length).toBeGreaterThanOrEqual(5);
  });

  it('should start with dropdown closed', () => {
    initPersonaSwitcher(container);
    expect(isDropdownOpen()).toBe(false);
  });

  it('should toggle dropdown on trigger click', () => {
    initPersonaSwitcher(container);
    const trigger = container.querySelector('#persona-trigger');
    trigger.click();
    expect(isDropdownOpen()).toBe(true);
  });

  it('should handle null container gracefully', () => {
    expect(() => initPersonaSwitcher(null)).not.toThrow();
  });

  it('should show keyboard shortcuts', () => {
    initPersonaSwitcher(container);
    const dropdown = container.querySelector('#persona-dropdown');
    expect(dropdown.textContent).toContain('Ctrl+1');
  });
});
