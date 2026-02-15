/**
 * Shared animation utilities for the Workbook Demo Platform.
 * All functions respect prefers-reduced-motion and return Promises.
 */

/**
 * Check if the user prefers reduced motion.
 * @returns {boolean}
 */
export function isReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
}

/**
 * Animate a number counting up from 0 to target.
 * @param {HTMLElement} element - Element whose textContent to update
 * @param {number} target - Final numeric value
 * @param {number} duration - Animation duration in ms (0 = instant)
 * @returns {Promise<void>}
 */
export function countUp(element, target, duration = 1500) {
  if (isReducedMotion() || duration === 0) {
    element.textContent = target.toLocaleString();
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const start = performance.now();
    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      const current = Math.round(target * progress);
      element.textContent = current.toLocaleString();
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        resolve();
      }
    }
    requestAnimationFrame(step);
  });
}

/**
 * Type text into an element character by character.
 * @param {HTMLElement} element - Element whose textContent to update
 * @param {string} text - Full text to type
 * @param {number} speed - Delay between characters in ms (0 = instant)
 * @returns {Promise<void>}
 */
export function typeText(element, text, speed = 40) {
  if (isReducedMotion() || speed === 0) {
    element.textContent = text;
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    let i = 0;
    function type() {
      element.textContent = text.slice(0, ++i);
      if (i < text.length) {
        setTimeout(type, speed);
      } else {
        resolve();
      }
    }
    type();
  });
}

/**
 * Stagger-reveal a list of elements by setting opacity to 1 with increasing delays.
 * @param {HTMLElement[]} elements - Elements to reveal
 * @param {number} delay - Delay between each element in ms
 * @returns {Promise<void>}
 */
export function staggerIn(elements, delay = 50) {
  if (!elements || elements.length === 0) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    elements.forEach((el, index) => {
      setTimeout(() => {
        el.style.opacity = '1';
        if (index === elements.length - 1) {
          resolve();
        }
      }, index * delay);
    });
  });
}

/**
 * Cross-fade transition: hide outEl, show inEl.
 * @param {HTMLElement} outEl - Element to hide
 * @param {HTMLElement} inEl - Element to show
 * @param {number} duration - Transition duration in ms (0 = instant)
 * @returns {Promise<void>}
 */
export function fadeTransition(outEl, inEl, duration = 200) {
  if (isReducedMotion() || duration === 0) {
    outEl.style.display = 'none';
    inEl.style.display = 'block';
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    outEl.style.transition = `opacity ${duration}ms ease`;
    outEl.style.opacity = '0';
    setTimeout(() => {
      outEl.style.display = 'none';
      outEl.style.opacity = '';
      outEl.style.transition = '';
      inEl.style.display = 'block';
      inEl.style.opacity = '0';
      inEl.style.transition = `opacity ${duration}ms ease`;
      // Force reflow before animating in
      void inEl.offsetHeight;
      inEl.style.opacity = '1';
      setTimeout(() => {
        inEl.style.transition = '';
        resolve();
      }, duration);
    }, duration);
  });
}

/**
 * Add an animation class to an element and resolve after the duration.
 * @param {HTMLElement} el - Element to animate
 * @param {string} animationClass - CSS class name to add
 * @param {number} duration - How long the animation runs in ms
 * @returns {Promise<void>}
 */
export function animateElement(el, animationClass, duration = 300) {
  el.classList.add(animationClass);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, duration);
  });
}
