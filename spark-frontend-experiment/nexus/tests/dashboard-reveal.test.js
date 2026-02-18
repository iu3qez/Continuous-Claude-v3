import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createElement } from './setup.js';

// Module under test
import {
  initDashboardReveal,
  revealSection,
  countUpMetrics,
  revealBriefingSentences,
  fillSparkBars,
} from '../components/dashboard-reveal.js';

describe('Dashboard Progressive Reveal', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    // Default: reduced motion OFF
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ---- revealSection ----

  describe('revealSection', () => {
    it('transitions element from reveal-hidden to reveal-visible', async () => {
      vi.useFakeTimers();
      const el = createElement('div', { className: 'reveal-hidden' });
      document.body.appendChild(el);

      const promise = revealSection(el);
      vi.advanceTimersByTime(400);
      await promise;

      expect(el.classList.contains('reveal-visible')).toBe(true);
      expect(el.classList.contains('reveal-hidden')).toBe(false);

      el.remove();
      vi.useRealTimers();
    });

    it('returns a promise', () => {
      const el = createElement('div', { className: 'reveal-hidden' });
      document.body.appendChild(el);
      const result = revealSection(el, 0);
      expect(result).toBeInstanceOf(Promise);
      el.remove();
    });

    it('handles null element gracefully', async () => {
      await expect(revealSection(null)).resolves.toBeUndefined();
    });

    it('skips animation with reduced motion and applies final state immediately', async () => {
      window.matchMedia = vi.fn().mockReturnValue({ matches: true });
      const el = createElement('div', { className: 'reveal-hidden' });
      document.body.appendChild(el);

      await revealSection(el);

      expect(el.classList.contains('reveal-visible')).toBe(true);
      expect(el.classList.contains('reveal-hidden')).toBe(false);

      el.remove();
    });
  });

  // ---- countUpMetrics ----

  describe('countUpMetrics', () => {
    it('animates data-count-target elements from 0 to target', async () => {
      vi.useFakeTimers();
      document.body.innerHTML = `
        <div id="metrics">
          <span data-count-target="23">0</span>
          <span data-count-target="8">0</span>
        </div>
      `;
      const container = document.getElementById('metrics');

      // Mock rAF to call callback synchronously with advancing timestamps
      const startTime = performance.now();
      let call = 0;
      const origRAF = globalThis.requestAnimationFrame;
      globalThis.requestAnimationFrame = (cb) => {
        call++;
        const elapsed = call * 400;
        setTimeout(() => cb(startTime + elapsed), 0);
        return call;
      };

      const promise = countUpMetrics(container, 800);
      vi.advanceTimersByTime(2000);
      await promise;

      const spans = container.querySelectorAll('[data-count-target]');
      expect(spans[0].textContent).toBe('23');
      expect(spans[1].textContent).toBe('8');

      globalThis.requestAnimationFrame = origRAF;
      vi.useRealTimers();
    });

    it('sets final values immediately with reduced motion', async () => {
      window.matchMedia = vi.fn().mockReturnValue({ matches: true });
      document.body.innerHTML = `
        <div id="metrics">
          <span data-count-target="23">0</span>
          <span data-count-target="4">0</span>
          <span data-count-target="3">0</span>
        </div>
      `;
      const container = document.getElementById('metrics');

      await countUpMetrics(container, 800);

      const spans = container.querySelectorAll('[data-count-target]');
      expect(spans[0].textContent).toBe('23');
      expect(spans[1].textContent).toBe('4');
      expect(spans[2].textContent).toBe('3');
    });

    it('handles missing container gracefully', async () => {
      await expect(countUpMetrics(null)).resolves.toBeUndefined();
    });

    it('handles elements with no data-count-target', async () => {
      document.body.innerHTML = '<div id="m"><span>hello</span></div>';
      await expect(countUpMetrics(document.getElementById('m'))).resolves.toBeUndefined();
    });
  });

  // ---- revealBriefingSentences ----

  describe('revealBriefingSentences', () => {
    it('reveals list items one at a time with stagger', async () => {
      vi.useFakeTimers();
      document.body.innerHTML = `
        <div id="briefing">
          <ul>
            <li class="reveal-hidden">Sentence one.</li>
            <li class="reveal-hidden">Sentence two.</li>
            <li class="reveal-hidden">Sentence three.</li>
          </ul>
        </div>
      `;
      const container = document.getElementById('briefing');

      const promise = revealBriefingSentences(container, 100);
      vi.advanceTimersByTime(600);
      await promise;

      const items = container.querySelectorAll('li');
      items.forEach((li) => {
        expect(li.classList.contains('reveal-visible')).toBe(true);
        expect(li.classList.contains('reveal-hidden')).toBe(false);
      });

      vi.useRealTimers();
    });

    it('reveals all immediately with reduced motion', async () => {
      window.matchMedia = vi.fn().mockReturnValue({ matches: true });
      document.body.innerHTML = `
        <div id="briefing">
          <ul>
            <li class="reveal-hidden">A</li>
            <li class="reveal-hidden">B</li>
          </ul>
        </div>
      `;
      const container = document.getElementById('briefing');

      await revealBriefingSentences(container, 300);

      const items = container.querySelectorAll('li');
      items.forEach((li) => {
        expect(li.classList.contains('reveal-visible')).toBe(true);
      });
    });

    it('handles null container', async () => {
      await expect(revealBriefingSentences(null)).resolves.toBeUndefined();
    });

    it('handles container with no list items', async () => {
      document.body.innerHTML = '<div id="b"></div>';
      await expect(
        revealBriefingSentences(document.getElementById('b'))
      ).resolves.toBeUndefined();
    });
  });

  // ---- fillSparkBars ----

  describe('fillSparkBars', () => {
    it('animates bar heights from 0 to their target', async () => {
      vi.useFakeTimers();
      document.body.innerHTML = `
        <div id="roi">
          <div data-spark-bar data-bar-height="40%"  style="height: 0;"></div>
          <div data-spark-bar data-bar-height="100%" style="height: 0;"></div>
        </div>
      `;
      const container = document.getElementById('roi');

      const promise = fillSparkBars(container, 400);
      vi.advanceTimersByTime(600);
      await promise;

      const bars = container.querySelectorAll('[data-spark-bar]');
      expect(bars[0].style.height).toBe('40%');
      expect(bars[1].style.height).toBe('100%');

      vi.useRealTimers();
    });

    it('sets final heights immediately with reduced motion', async () => {
      window.matchMedia = vi.fn().mockReturnValue({ matches: true });
      document.body.innerHTML = `
        <div id="roi">
          <div data-spark-bar data-bar-height="55%" style="height: 0;"></div>
          <div data-spark-bar data-bar-height="85%" style="height: 0;"></div>
        </div>
      `;
      const container = document.getElementById('roi');

      await fillSparkBars(container, 400);

      const bars = container.querySelectorAll('[data-spark-bar]');
      expect(bars[0].style.height).toBe('55%');
      expect(bars[1].style.height).toBe('85%');
    });

    it('handles null container', async () => {
      await expect(fillSparkBars(null)).resolves.toBeUndefined();
    });
  });

  // ---- initDashboardReveal (orchestrator) ----

  describe('initDashboardReveal', () => {
    it('does not throw when called on an empty page', async () => {
      document.body.innerHTML = '<main id="main-content"></main>';
      await expect(initDashboardReveal()).resolves.toBeUndefined();
    });

    it('reveals all sections in sequence on a minimal dashboard', async () => {
      // Use reduced motion to test the orchestrator logic without timer complexity
      window.matchMedia = vi.fn().mockReturnValue({ matches: true });
      document.body.innerHTML = `
        <main id="main-content">
          <div data-reveal="alert" class="reveal-hidden">Alert</div>
          <div data-reveal="greeting" class="reveal-hidden">Hello</div>
          <div data-reveal="overdue" class="reveal-hidden">Overdue</div>
          <div data-reveal="roi" class="reveal-hidden">
            <span data-count-target="12">0</span>
            <div data-spark-bar data-bar-height="80%" style="height: 0;"></div>
          </div>
          <div data-reveal="metrics" class="reveal-hidden">
            <span data-count-target="10">0</span>
          </div>
          <div data-reveal="content" class="reveal-hidden">Card 1</div>
          <div data-reveal="content" class="reveal-hidden">Card 2</div>
          <div data-reveal="briefing" class="reveal-hidden">
            <ul><li class="reveal-hidden">Line 1</li></ul>
          </div>
          <div data-reveal="tools" class="reveal-hidden">Tool card</div>
        </main>
      `;

      await initDashboardReveal();

      // All data-reveal sections should be visible
      const allSections = document.querySelectorAll('[data-reveal]');
      allSections.forEach((s) => {
        expect(s.classList.contains('reveal-visible')).toBe(true);
      });

      // Count-up values should be set
      expect(document.querySelector('[data-reveal="metrics"] [data-count-target]').textContent).toBe('10');
      expect(document.querySelector('[data-reveal="roi"] [data-count-target]').textContent).toBe('12');

      // Spark bars should be filled
      expect(document.querySelector('[data-spark-bar]').style.height).toBe('80%');

      // Briefing list items should be visible
      const li = document.querySelector('[data-reveal="briefing"] li');
      expect(li.classList.contains('reveal-visible')).toBe(true);
    });

    it('skips all animations with reduced motion but still shows content', async () => {
      window.matchMedia = vi.fn().mockReturnValue({ matches: true });
      document.body.innerHTML = `
        <main id="main-content">
          <div data-reveal="alert" class="reveal-hidden">Alert</div>
          <div data-reveal="metrics" class="reveal-hidden">
            <span data-count-target="23">0</span>
          </div>
        </main>
      `;

      await initDashboardReveal();

      const alert = document.querySelector('[data-reveal="alert"]');
      expect(alert.classList.contains('reveal-visible')).toBe(true);

      const metric = document.querySelector('[data-count-target]');
      expect(metric.textContent).toBe('23');
    });
  });
});
