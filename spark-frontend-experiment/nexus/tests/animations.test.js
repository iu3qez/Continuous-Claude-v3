import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createElement } from './setup.js';

// Will import from the module under test
import {
  isReducedMotion,
  countUp,
  typeText,
  staggerIn,
  fadeTransition,
  animateElement,
} from '../components/animations.js';

describe('animations', () => {
  let el;

  beforeEach(() => {
    el = createElement('span', { textContent: '' });
    document.body.appendChild(el);

    // Default: reduced motion is OFF
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
  });

  afterEach(() => {
    el.remove();
    vi.restoreAllMocks();
  });

  // ---- isReducedMotion ----

  describe('isReducedMotion', () => {
    it('returns false by default in jsdom', () => {
      expect(isReducedMotion()).toBe(false);
    });

    it('returns true when prefers-reduced-motion matches', () => {
      window.matchMedia = vi.fn().mockReturnValue({ matches: true });
      expect(isReducedMotion()).toBe(true);
    });
  });

  // ---- countUp ----

  describe('countUp', () => {
    it('sets element textContent to target value after animation', async () => {
      // Mock requestAnimationFrame to call callback synchronously with advancing timestamps
      const startTime = performance.now();
      let call = 0;
      const originalRAF = globalThis.requestAnimationFrame;
      globalThis.requestAnimationFrame = (cb) => {
        call++;
        // Simulate frames: first few at partial progress, then past duration
        const elapsed = call * 200; // 200ms per frame
        setTimeout(() => cb(startTime + elapsed), 0);
        return call;
      };

      await countUp(el, 1000, 500);
      expect(el.textContent).toBe('1,000');

      globalThis.requestAnimationFrame = originalRAF;
    });

    it('sets value immediately when duration is 0', async () => {
      await countUp(el, 1000, 0);
      expect(el.textContent).toBe('1,000');
    });

    it('sets value immediately when reduced motion is on', async () => {
      window.matchMedia = vi.fn().mockReturnValue({ matches: true });
      await countUp(el, 1000, 500);
      expect(el.textContent).toBe('1,000');
    });

    it('returns a promise', () => {
      const result = countUp(el, 100, 0);
      expect(result).toBeInstanceOf(Promise);
    });
  });

  // ---- typeText ----

  describe('typeText', () => {
    it('sets element text to full string with speed 0 (instant)', async () => {
      await typeText(el, 'Hello World', 0);
      expect(el.textContent).toBe('Hello World');
    });

    it('resolves a promise when complete', async () => {
      const result = typeText(el, 'Test', 0);
      expect(result).toBeInstanceOf(Promise);
      await result;
    });

    it('sets text immediately when reduced motion is on', async () => {
      window.matchMedia = vi.fn().mockReturnValue({ matches: true });
      await typeText(el, 'Hello World', 50);
      expect(el.textContent).toBe('Hello World');
    });
  });

  // ---- staggerIn ----

  describe('staggerIn', () => {
    it('sets opacity:1 on each element with staggered delay', async () => {
      vi.useFakeTimers();

      const elements = [
        createElement('div', {}),
        createElement('div', {}),
        createElement('div', {}),
      ];
      elements.forEach((e) => {
        e.style.opacity = '0';
        document.body.appendChild(e);
      });

      const promise = staggerIn(elements, 50);
      // Advance past all stagger delays: (3-1) * 50 = 100ms, plus margin
      vi.advanceTimersByTime(200);
      await promise;

      elements.forEach((e) => {
        expect(e.style.opacity).toBe('1');
        e.remove();
      });

      vi.useRealTimers();
    });

    it('does nothing with an empty array', async () => {
      // Should not throw and should resolve
      await expect(staggerIn([], 50)).resolves.toBeUndefined();
    });
  });

  // ---- fadeTransition ----

  describe('fadeTransition', () => {
    it('hides outEl and shows inEl with duration 0', async () => {
      const outEl = createElement('div', {});
      const inEl = createElement('div', {});
      outEl.style.display = 'block';
      inEl.style.display = 'none';
      document.body.appendChild(outEl);
      document.body.appendChild(inEl);

      await fadeTransition(outEl, inEl, 0);

      expect(outEl.style.display).toBe('none');
      expect(inEl.style.display).toBe('block');

      outEl.remove();
      inEl.remove();
    });
  });

  // ---- animateElement ----

  describe('animateElement', () => {
    it('adds animation class and resolves after duration', async () => {
      vi.useFakeTimers();

      const promise = animateElement(el, 'fadeIn', 300);
      expect(el.classList.contains('fadeIn')).toBe(true);

      vi.advanceTimersByTime(300);
      await promise;

      vi.useRealTimers();
    });

    it('returns a promise', () => {
      vi.useFakeTimers();
      const result = animateElement(el, 'slideUp', 100);
      expect(result).toBeInstanceOf(Promise);
      vi.advanceTimersByTime(100);
      vi.useRealTimers();
    });
  });
});
