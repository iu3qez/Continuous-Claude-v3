/**
 * Animate number count-up for elements with data-count-up attribute.
 * Usage: <span data-count-up="23">0</span>
 */
export function initCountUp() {
  const elements = document.querySelectorAll('[data-count-up]');
  if (!elements.length) return;

  // Respect reduced motion
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  elements.forEach(el => {
    const target = parseInt(el.getAttribute('data-count-up'), 10);
    if (isNaN(target)) return;

    if (prefersReduced) {
      el.textContent = target.toLocaleString();
      return;
    }

    const duration = parseInt(el.getAttribute('data-duration') || '1000', 10);
    const start = performance.now();

    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out quad
      const eased = 1 - (1 - progress) * (1 - progress);
      const current = Math.round(eased * target);
      el.textContent = current.toLocaleString();
      if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
  });
}
