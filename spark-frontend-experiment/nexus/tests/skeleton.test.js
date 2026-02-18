import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createContainer } from './setup.js';

describe('Skeleton Loading Controller', () => {
  let container;
  let showSkeleton, hideSkeleton;

  beforeEach(async () => {
    container = createContainer();
    // Add some original content
    container.innerHTML = '<p class="original">Hello World</p><span class="original">Details</span>';

    vi.resetModules();
    const mod = await import('../components/skeleton.js');
    showSkeleton = mod.showSkeleton;
    hideSkeleton = mod.hideSkeleton;
  });

  describe('showSkeleton', () => {
    it('adds skeleton-card elements to the container', () => {
      showSkeleton(container, 'card');
      const skeletons = container.querySelectorAll('.skeleton-card');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('adds skeleton-metric elements to the container', () => {
      showSkeleton(container, 'metric');
      const skeletons = container.querySelectorAll('.skeleton-metric');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('adds skeleton-text elements to the container', () => {
      showSkeleton(container, 'text');
      const skeletons = container.querySelectorAll('.skeleton-text');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('adds skeleton-table-row elements to the container', () => {
      showSkeleton(container, 'table-row');
      const skeletons = container.querySelectorAll('.skeleton-table-row');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('adds skeleton-timeline elements to the container', () => {
      showSkeleton(container, 'timeline');
      const skeletons = container.querySelectorAll('.skeleton-timeline');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('creates N skeleton items when count parameter is provided', () => {
      showSkeleton(container, 'card', { count: 5 });
      const skeletons = container.querySelectorAll('.skeleton-card');
      expect(skeletons.length).toBe(5);
    });

    it('defaults to 3 skeleton items when no count is provided', () => {
      showSkeleton(container, 'card');
      const skeletons = container.querySelectorAll('.skeleton-card');
      expect(skeletons.length).toBe(3);
    });

    it('each skeleton element has the base skeleton class', () => {
      showSkeleton(container, 'card');
      const skeletons = container.querySelectorAll('.skeleton-card');
      skeletons.forEach((el) => {
        expect(el.classList.contains('skeleton')).toBe(true);
      });
    });
  });

  describe('original content visibility', () => {
    it('hides original content when skeleton is shown', () => {
      showSkeleton(container, 'card');
      const originals = container.querySelectorAll('.original');
      originals.forEach((el) => {
        expect(el.style.display).toBe('none');
      });
    });

    it('original content is restored after hideSkeleton', () => {
      showSkeleton(container, 'card');
      hideSkeleton(container);
      const originals = container.querySelectorAll('.original');
      originals.forEach((el) => {
        expect(el.style.display).not.toBe('none');
      });
    });
  });

  describe('hideSkeleton', () => {
    it('removes all skeleton elements from the container', () => {
      showSkeleton(container, 'card');
      hideSkeleton(container);
      const skeletons = container.querySelectorAll('.skeleton');
      expect(skeletons.length).toBe(0);
    });

    it('removes the skeleton wrapper element', () => {
      showSkeleton(container, 'card');
      hideSkeleton(container);
      const wrapper = container.querySelector('[data-skeleton-wrapper]');
      expect(wrapper).toBeNull();
    });

    it('restores the original content that was hidden', () => {
      showSkeleton(container, 'card');
      hideSkeleton(container);
      const p = container.querySelector('p.original');
      const span = container.querySelector('span.original');
      expect(p).not.toBeNull();
      expect(p.textContent).toBe('Hello World');
      expect(span).not.toBeNull();
      expect(span.textContent).toBe('Details');
    });
  });

  describe('autoHide', () => {
    it('auto-removes skeleton after specified delay', async () => {
      vi.useFakeTimers();
      showSkeleton(container, 'card', { autoHide: 300 });

      // Skeleton should still be present before timeout
      expect(container.querySelectorAll('.skeleton-card').length).toBe(3);

      // Advance timers past the autoHide delay
      vi.advanceTimersByTime(300);

      // Skeleton should be removed
      expect(container.querySelectorAll('.skeleton-card').length).toBe(0);

      // Original content should be restored
      const originals = container.querySelectorAll('.original');
      originals.forEach((el) => {
        expect(el.style.display).not.toBe('none');
      });

      vi.useRealTimers();
    });

    it('does not auto-remove when autoHide is 0', async () => {
      vi.useFakeTimers();
      showSkeleton(container, 'card', { autoHide: 0 });

      vi.advanceTimersByTime(1000);

      // Skeleton should still be present
      expect(container.querySelectorAll('.skeleton-card').length).toBe(3);

      vi.useRealTimers();
    });
  });
});
