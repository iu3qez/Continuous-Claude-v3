import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock state module before importing keyboard
vi.mock('../components/state.js', () => ({
  default: {
    demoMode: 'free',
    industry: 'consulting',
    persona: 'ceo',
  },
}));

describe('Keyboard Shortcuts', () => {
  let mod;
  let WorkbookDemo;

  beforeEach(async () => {
    vi.resetModules();
    WorkbookDemo = (await import('../components/state.js')).default;
    WorkbookDemo.demoMode = 'free';
    mod = await import('../components/keyboard.js');
  });

  afterEach(() => {
    if (mod.destroyKeyboard) mod.destroyKeyboard();
  });

  describe('initKeyboard', () => {
    it('does not throw', () => {
      expect(() => mod.initKeyboard()).not.toThrow();
    });
  });

  describe('global shortcuts', () => {
    it('Escape dispatches dismiss-all event', () => {
      mod.initKeyboard();
      const spy = vi.fn();
      document.addEventListener('dismiss-all', spy);

      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
      );

      expect(spy).toHaveBeenCalledTimes(1);
      document.removeEventListener('dismiss-all', spy);
    });

    it('Ctrl+D dispatches toggle-demo-bar event', () => {
      mod.initKeyboard();
      const spy = vi.fn();
      document.addEventListener('toggle-demo-bar', spy);

      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'd', ctrlKey: true, bubbles: true })
      );

      expect(spy).toHaveBeenCalledTimes(1);
      document.removeEventListener('toggle-demo-bar', spy);
    });

    it('Ctrl+Shift+L dispatches toggle-live-mode event', () => {
      mod.initKeyboard();
      const spy = vi.fn();
      document.addEventListener('toggle-live-mode', spy);

      document.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'L',
          ctrlKey: true,
          shiftKey: true,
          bubbles: true,
        })
      );

      expect(spy).toHaveBeenCalledTimes(1);
      document.removeEventListener('toggle-live-mode', spy);
    });

    it('Cmd+K focuses command bar input', () => {
      mod.initKeyboard();
      const input = document.createElement('input');
      input.id = 'command-bar-input';
      document.body.appendChild(input);

      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true })
      );

      expect(document.activeElement).toBe(input);
      input.remove();
    });

    it('Ctrl+K also focuses command bar input', () => {
      mod.initKeyboard();
      const input = document.createElement('input');
      input.id = 'command-bar-input';
      document.body.appendChild(input);

      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true })
      );

      expect(document.activeElement).toBe(input);
      input.remove();
    });
  });

  describe('input suppression', () => {
    it('shortcuts are suppressed when target is an INPUT', () => {
      mod.initKeyboard();
      const spy = vi.fn();
      document.addEventListener('dismiss-all', spy);

      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      Object.defineProperty(event, 'target', { value: input });
      document.dispatchEvent(event);

      expect(spy).not.toHaveBeenCalled();
      document.removeEventListener('dismiss-all', spy);
      input.remove();
    });

    it('shortcuts are suppressed when target is a TEXTAREA', () => {
      mod.initKeyboard();
      const spy = vi.fn();
      document.addEventListener('dismiss-all', spy);

      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);

      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      Object.defineProperty(event, 'target', { value: textarea });
      document.dispatchEvent(event);

      expect(spy).not.toHaveBeenCalled();
      document.removeEventListener('dismiss-all', spy);
      textarea.remove();
    });
  });

  describe('demo mode shortcuts', () => {
    it('Space dispatches demo-next when demoMode is guided', () => {
      WorkbookDemo.demoMode = 'guided';
      mod.initKeyboard();
      const spy = vi.fn();
      document.addEventListener('demo-next', spy);

      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: ' ', bubbles: true })
      );

      expect(spy).toHaveBeenCalledTimes(1);
      document.removeEventListener('demo-next', spy);
    });

    it('Space does NOT fire demo-next when demoMode is free', () => {
      WorkbookDemo.demoMode = 'free';
      mod.initKeyboard();
      const spy = vi.fn();
      document.addEventListener('demo-next', spy);

      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: ' ', bubbles: true })
      );

      expect(spy).not.toHaveBeenCalled();
      document.removeEventListener('demo-next', spy);
    });

    it('ArrowLeft dispatches demo-prev when guided', () => {
      WorkbookDemo.demoMode = 'guided';
      mod.initKeyboard();
      const spy = vi.fn();
      document.addEventListener('demo-prev', spy);

      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true })
      );

      expect(spy).toHaveBeenCalledTimes(1);
      document.removeEventListener('demo-prev', spy);
    });

    it('number keys 1-5 dispatch demo-jump-arc with detail', () => {
      WorkbookDemo.demoMode = 'guided';
      mod.initKeyboard();
      const spy = vi.fn();
      document.addEventListener('demo-jump-arc', spy);

      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: '3', bubbles: true })
      );

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0].detail).toEqual({ arc: 3 });
      document.removeEventListener('demo-jump-arc', spy);
    });
  });

  describe('destroyKeyboard', () => {
    it('removes listeners so shortcuts stop firing', () => {
      mod.initKeyboard();
      mod.destroyKeyboard();

      const spy = vi.fn();
      document.addEventListener('dismiss-all', spy);

      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
      );

      expect(spy).not.toHaveBeenCalled();
      document.removeEventListener('dismiss-all', spy);
    });
  });
});
