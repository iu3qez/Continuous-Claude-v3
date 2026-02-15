/**
 * Dashboard Progressive Reveal
 *
 * Orchestrates a staggered entrance animation sequence for the dashboard page.
 * Elements start hidden (opacity:0, translateY(8px)) and reveal in order:
 *   1. Alert banner + command bar
 *   2. Greeting / header
 *   3. Metrics cards (with count-up numbers)
 *   4. AI briefing sentences (typewriter-style stagger)
 *   5. Content cards (overdue, schedule, priority, decisions, blockers)
 *   6. ROI widget (count-up + spark bar fill)
 *   7. AI tool cards
 *
 * Respects prefers-reduced-motion -- skips animations, shows final state.
 */

// ---- Helpers ----

function isReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---- Public API ----

/**
 * Reveal a single section: swap reveal-hidden -> reveal-visible.
 * @param {HTMLElement|null} el
 * @param {number} delay - optional delay before revealing (ms)
 * @returns {Promise<void>}
 */
export function revealSection(el, delay = 0) {
  if (!el) return Promise.resolve();

  if (isReducedMotion()) {
    el.classList.remove('reveal-hidden');
    el.classList.add('reveal-visible');
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    setTimeout(() => {
      el.classList.remove('reveal-hidden');
      el.classList.add('reveal-visible');
      // Wait for CSS transition to finish (300ms from --transition-reveal)
      setTimeout(resolve, 300);
    }, delay);
  });
}

/**
 * Count up all [data-count-target] elements inside a container.
 * @param {HTMLElement|null} container
 * @param {number} duration - animation duration in ms
 * @returns {Promise<void>}
 */
export function countUpMetrics(container, duration = 800) {
  if (!container) return Promise.resolve();

  const elements = container.querySelectorAll('[data-count-target]');
  if (!elements.length) return Promise.resolve();

  if (isReducedMotion() || duration === 0) {
    elements.forEach((el) => {
      const target = parseInt(el.getAttribute('data-count-target'), 10);
      if (!isNaN(target)) el.textContent = String(target);
    });
    return Promise.resolve();
  }

  const promises = Array.from(elements).map((el) => {
    const target = parseInt(el.getAttribute('data-count-target'), 10);
    if (isNaN(target)) return Promise.resolve();

    return new Promise((resolve) => {
      const start = performance.now();
      function step(now) {
        const progress = Math.min((now - start) / duration, 1);
        // Ease-out quadratic
        const eased = 1 - (1 - progress) * (1 - progress);
        el.textContent = String(Math.round(eased * target));
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          el.textContent = String(target);
          resolve();
        }
      }
      requestAnimationFrame(step);
    });
  });

  return Promise.all(promises).then(() => undefined);
}

/**
 * Reveal AI briefing list items one at a time with a stagger delay.
 * @param {HTMLElement|null} container - the briefing card or section
 * @param {number} staggerDelay - ms between each sentence reveal
 * @returns {Promise<void>}
 */
export function revealBriefingSentences(container, staggerDelay = 300) {
  if (!container) return Promise.resolve();

  const items = container.querySelectorAll('li.reveal-hidden');
  if (!items.length) return Promise.resolve();

  if (isReducedMotion()) {
    items.forEach((li) => {
      li.classList.remove('reveal-hidden');
      li.classList.add('reveal-visible');
    });
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    items.forEach((li, index) => {
      setTimeout(() => {
        li.classList.remove('reveal-hidden');
        li.classList.add('reveal-visible');
        if (index === items.length - 1) {
          // Wait for last transition to finish
          setTimeout(resolve, 300);
        }
      }, index * staggerDelay);
    });
  });
}

/**
 * Animate spark-bar elements from height:0 to their data-bar-height target.
 * @param {HTMLElement|null} container
 * @param {number} duration - animation duration in ms
 * @returns {Promise<void>}
 */
export function fillSparkBars(container, duration = 400) {
  if (!container) return Promise.resolve();

  const bars = container.querySelectorAll('[data-spark-bar]');
  if (!bars.length) return Promise.resolve();

  if (isReducedMotion() || duration === 0) {
    bars.forEach((bar) => {
      bar.style.height = bar.getAttribute('data-bar-height') || '0';
    });
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    bars.forEach((bar) => {
      const targetHeight = bar.getAttribute('data-bar-height') || '0';
      bar.style.transition = `height ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
      bar.style.height = targetHeight;
    });
    setTimeout(resolve, duration);
  });
}

/**
 * Main orchestrator -- run the full progressive reveal sequence for the dashboard.
 * Call after DOM is ready and initial data is loaded.
 * @returns {Promise<void>}
 */
export async function initDashboardReveal() {
  const main = document.getElementById('main-content') || document.querySelector('main');
  if (!main) return;

  const reduced = isReducedMotion();
  const delayBetween = reduced ? 0 : 100;

  // Helper to find a reveal section by data-reveal attribute
  function section(name) {
    return main.querySelector(`[data-reveal="${name}"]`);
  }

  // Helper to find ALL reveal sections with a given name (for multi-card groups)
  function sections(name) {
    return Array.from(main.querySelectorAll(`[data-reveal="${name}"]`));
  }

  // Phase 1: Alert banner + command bar
  await revealSection(section('alert'), 0);
  if (!reduced) await wait(delayBetween);

  // Phase 2: Greeting
  await revealSection(section('greeting'), 0);
  if (!reduced) await wait(delayBetween);

  // Phase 3: Overdue actions card
  await revealSection(section('overdue'), 0);
  if (!reduced) await wait(delayBetween);

  // Phase 4: ROI widget + hours-saved count-up
  const roiSection = section('roi');
  await revealSection(roiSection, 0);
  if (roiSection) {
    await Promise.all([
      countUpMetrics(roiSection, reduced ? 0 : 800),
      fillSparkBars(roiSection, reduced ? 0 : 600),
    ]);
  }
  if (!reduced) await wait(delayBetween);

  // Phase 5: Metrics row with count-up
  const metricsSection = section('metrics');
  await revealSection(metricsSection, 0);
  if (metricsSection) {
    await countUpMetrics(metricsSection, reduced ? 0 : 800);
  }
  if (!reduced) await wait(delayBetween);

  // Phase 6: Content cards (staggered)
  const contentCards = sections('content');
  for (let i = 0; i < contentCards.length; i++) {
    await revealSection(contentCards[i], 0);
    if (!reduced && i < contentCards.length - 1) await wait(delayBetween);
  }

  // Phase 7: AI briefing with sentence-by-sentence reveal
  const briefingSection = section('briefing');
  await revealSection(briefingSection, 0);
  if (briefingSection) {
    await revealBriefingSentences(briefingSection, reduced ? 0 : 300);
  }
  if (!reduced) await wait(delayBetween);

  // Phase 8: AI tool cards
  const toolCards = sections('tools');
  for (let i = 0; i < toolCards.length; i++) {
    await revealSection(toolCards[i], 0);
    if (!reduced && i < toolCards.length - 1) await wait(50);
  }
}
