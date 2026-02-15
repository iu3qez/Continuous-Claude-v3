/**
 * Landing Hero Component
 * Handles dashboard mockup animations and parallax effects
 */

/**
 * Count up animation for metric values
 * @param {HTMLElement} element - Element containing data-target attribute
 */
function countUp(element) {
  const target = parseFloat(element.getAttribute('data-target'));
  const duration = 1500;
  const steps = 60;
  const increment = target / steps;
  let current = 0;
  let step = 0;

  const timer = setInterval(() => {
    step++;
    current += increment;
    if (current >= target || step >= steps) {
      element.textContent = target % 1 === 0 ? target : target.toFixed(1);
      clearInterval(timer);
    } else {
      element.textContent = current % 1 === 0 ? Math.floor(current) : current.toFixed(1);
    }
  }, duration / steps);
}

/**
 * Initialize dashboard animations on scroll into view
 */
function initDashboardAnimations() {
  const mockup = document.getElementById('dashboard-mockup');
  if (!mockup) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Trigger stagger animations
        const staggerElements = mockup.querySelectorAll('.stagger-1, .stagger-2, .stagger-3, .stagger-4');
        staggerElements.forEach(el => el.classList.add('animated'));

        // Count up metrics
        const countUpElements = mockup.querySelectorAll('.count-up');
        countUpElements.forEach(el => {
          setTimeout(() => countUp(el), 200);
        });

        // Fill progress bar
        const progressBar = mockup.querySelector('.progress-bar');
        if (progressBar) {
          setTimeout(() => {
            progressBar.style.width = '94%';
          }, 400);
        }

        // Only animate once
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.2
  });

  observer.observe(mockup);
}

/**
 * Initialize parallax effect on mouse movement
 */
function initParallax() {
  const mockup = document.getElementById('dashboard-mockup');
  if (!mockup) return;

  let ticking = false;

  function updateParallax(e) {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const rect = mockup.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const deltaX = (e.clientX - centerX) * 0.02;
        const deltaY = (e.clientY - centerY) * 0.02;

        mockup.style.transform = `rotateX(${2 + deltaY}deg) rotateY(${deltaX}deg)`;
        ticking = false;
      });
      ticking = true;
    }
  }

  mockup.addEventListener('mousemove', updateParallax);
  mockup.addEventListener('mouseleave', () => {
    mockup.style.transform = 'rotateX(2deg) rotateY(0deg)';
  });
}

/**
 * Main initialization function
 * Call this on DOMContentLoaded or page load
 */
export function initLandingHero() {
  initDashboardAnimations();
  initParallax();
}

// Auto-initialize if not using as module
if (typeof window !== 'undefined' && !window.landingHeroInitialized) {
  document.addEventListener('DOMContentLoaded', initLandingHero);
  window.landingHeroInitialized = true;
}
