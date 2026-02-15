import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createContainer, cleanup } from './setup.js';

describe('Command Bar', () => {
  let mod;
  let container;

  beforeEach(async () => {
    vi.resetModules();
    mod = await import('../components/command-bar.js');
    container = createContainer();
  });

  afterEach(() => {
    cleanup();
  });

  describe('createCommandBar', () => {
    it('returns a DOM element with a search input', () => {
      const bar = mod.createCommandBar();
      expect(bar).toBeInstanceOf(HTMLElement);
      const input = bar.querySelector('input[type="text"]');
      expect(input).not.toBeNull();
      expect(input.placeholder).toBeTruthy();
    });
  });

  describe('openCommandBar', () => {
    it('makes the bar visible and focuses the input', () => {
      const bar = mod.createCommandBar();
      container.appendChild(bar);
      mod.openCommandBar();
      expect(bar.style.display).not.toBe('none');
      expect(bar.classList.contains('hidden')).toBe(false);
      const input = bar.querySelector('input[type="text"]');
      expect(document.activeElement).toBe(input);
    });
  });

  describe('closeCommandBar', () => {
    it('hides the bar and clears the input', () => {
      const bar = mod.createCommandBar();
      container.appendChild(bar);
      mod.openCommandBar();
      const input = bar.querySelector('input[type="text"]');
      input.value = 'some query';
      mod.closeCommandBar();
      expect(bar.classList.contains('hidden')).toBe(true);
      expect(input.value).toBe('');
    });
  });

  describe('getCommands', () => {
    it('returns a list of default navigation commands', () => {
      const commands = mod.getCommands();
      expect(Array.isArray(commands)).toBe(true);
      expect(commands.length).toBeGreaterThan(0);
      // Should have navigation commands
      const navCommands = commands.filter(c => c.category === 'Navigation');
      expect(navCommands.length).toBeGreaterThan(0);
      // Each command should have id, label, action
      commands.forEach(cmd => {
        expect(cmd).toHaveProperty('id');
        expect(cmd).toHaveProperty('label');
        expect(cmd).toHaveProperty('action');
      });
    });
  });

  describe('filterCommands', () => {
    it('returns commands matching "dash"', () => {
      const results = mod.filterCommands('dash');
      expect(results.length).toBeGreaterThan(0);
      const hasMatch = results.some(c => c.label.toLowerCase().includes('dash'));
      expect(hasMatch).toBe(true);
    });

    it('returns meeting-related commands for "meet"', () => {
      const results = mod.filterCommands('meet');
      expect(results.length).toBeGreaterThan(0);
      const hasMatch = results.some(c => c.label.toLowerCase().includes('meet'));
      expect(hasMatch).toBe(true);
    });

    it('returns empty array for "xyz"', () => {
      const results = mod.filterCommands('xyz');
      expect(results).toEqual([]);
    });
  });

  describe('fuzzyMatch', () => {
    it('returns true for "dashboard" matching "dash"', () => {
      expect(mod.fuzzyMatch('dashboard', 'dash')).toBe(true);
    });

    it('returns true for "dashboard" matching "dbrd" (fuzzy)', () => {
      expect(mod.fuzzyMatch('dashboard', 'dbrd')).toBe(true);
    });

    it('returns false for "dashboard" matching "xyz"', () => {
      expect(mod.fuzzyMatch('dashboard', 'xyz')).toBe(false);
    });
  });

  describe('keyboard interactions', () => {
    let bar;
    let input;

    beforeEach(() => {
      bar = mod.createCommandBar();
      container.appendChild(bar);
      mod.openCommandBar();
      input = bar.querySelector('input[type="text"]');
    });

    it('pressing Escape closes the bar', () => {
      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      bar.dispatchEvent(event);
      expect(bar.classList.contains('hidden')).toBe(true);
    });

    it('arrow down selects next command', () => {
      // Initially selectedIndex is 0, pressing down should move to 1
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true });
      bar.dispatchEvent(event);
      const items = bar.querySelectorAll('[data-command-id]');
      if (items.length > 1) {
        expect(items[1].classList.contains('selected')).toBe(true);
      }
    });

    it('arrow up selects previous command', () => {
      // Move down first, then up
      bar.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      bar.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      const items = bar.querySelectorAll('[data-command-id]');
      if (items.length > 0) {
        expect(items[0].classList.contains('selected')).toBe(true);
      }
    });

    it('Enter on selected command executes it', () => {
      const actionSpy = vi.fn();
      mod.registerCommand({ id: 'test-cmd', label: 'Test Command', action: actionSpy });
      // Filter to show our command
      input.value = 'Test Command';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      // Find our command and select it
      const items = bar.querySelectorAll('[data-command-id]');
      const testItem = Array.from(items).find(el => el.dataset.commandId === 'test-cmd');
      if (testItem) {
        testItem.classList.add('selected');
      }
      // Simulate selecting our command by filtering and pressing enter
      // Reset: clear filter to show all, then navigate to our command
      input.value = 'Test Command';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      bar.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      expect(actionSpy).toHaveBeenCalled();
    });
  });

  describe('registerCommand', () => {
    it('adds a custom command to the list', () => {
      const initialLength = mod.getCommands().length;
      mod.registerCommand({ id: 'custom-1', label: 'Custom Action', action: () => {} });
      const commands = mod.getCommands();
      expect(commands.length).toBe(initialLength + 1);
      const custom = commands.find(c => c.id === 'custom-1');
      expect(custom).toBeDefined();
      expect(custom.label).toBe('Custom Action');
    });
  });

  describe('empty search', () => {
    it('shows all commands when search is empty', () => {
      const allCommands = mod.getCommands();
      const filtered = mod.filterCommands('');
      expect(filtered.length).toBe(allCommands.length);
    });
  });
});
