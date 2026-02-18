import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Onboarding Entry Point Tests
 *
 * Tests the onboarding.html single-page wizard that provides:
 *   - Workbook branding header
 *   - Progress bar (proportional fill, no text indicator)
 *   - 6 step panels (only one visible at a time)
 *   - Navigation (Back/Next/Skip to Dashboard)
 *   - AI companion panel
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Load onboarding.html into document and execute inline scripts. */
function loadOnboardingEntry() {
  const fs = require('fs');
  const path = require('path');
  const filePath = path.resolve(__dirname, '..', 'onboarding.html');
  const html = fs.readFileSync(filePath, 'utf-8');

  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (!bodyMatch) throw new Error('Could not parse body from onboarding.html');

  let bodyContent = bodyMatch[1];

  // Remove demo/init.js module script (not relevant to unit tests)
  bodyContent = bodyContent.replace(
    /<script\s+type="module"\s+src="[^"]*demo\/init\.js"[^>]*><\/script>/gi,
    ''
  );

  // Separate inline scripts from HTML content
  const scripts = [];
  const htmlWithoutScripts = bodyContent.replace(
    /<script(?:\s[^>]*)?>[\s\S]*?<\/script>/gi,
    (match) => {
      if (!match.includes(' src=')) {
        const scriptContent = match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
        scripts.push(scriptContent);
      }
      return '';
    }
  );

  document.body.innerHTML = htmlWithoutScripts;

  // Execute inline scripts in order
  scripts.forEach((scriptContent) => {
    const fn = new Function(scriptContent);
    fn();
  });
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

describe('Onboarding Entry Point', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
    document.body.innerHTML = '';
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  // =========================================================================
  // 1. Progress Bar
  // =========================================================================
  describe('Progress Bar', () => {
    it('renders a progress bar element with class "progress-bar"', () => {
      loadOnboardingEntry();
      const progressBar = document.querySelector('.progress-bar');
      expect(progressBar).not.toBeNull();
    });

    it('progress bar starts at step 1 with width ~16.67%', () => {
      loadOnboardingEntry();
      const fill = document.querySelector('.progress-bar-fill');
      expect(fill).not.toBeNull();
      // Step 1 of 6 = 16.67%
      const width = parseFloat(fill.style.width);
      expect(width).toBeCloseTo(16.67, 0);
    });

    it('progress bar width updates to match step/6 * 100%', () => {
      loadOnboardingEntry();
      // Navigate to step 3
      if (typeof window.goToStep === 'function') {
        window.goToStep(3);
      }
      const fill = document.querySelector('.progress-bar-fill');
      const width = parseFloat(fill.style.width);
      expect(width).toBeCloseTo(50, 0);
    });
  });

  // =========================================================================
  // 2. Content Area
  // =========================================================================
  describe('Content Area', () => {
    it('has a steps container with step panels', () => {
      loadOnboardingEntry();
      const container = document.querySelector('.steps-container');
      expect(container).not.toBeNull();
      const panels = document.querySelectorAll('[data-step]');
      expect(panels.length).toBe(6);
    });
  });

  // =========================================================================
  // 3. Skip Onboarding
  // =========================================================================
  describe('Skip Onboarding', () => {
    it('has a "Skip Onboarding" link that points to dashboard.html', () => {
      loadOnboardingEntry();
      const skipLinks = document.querySelectorAll('a');
      const skipLink = Array.from(skipLinks).find(
        (a) =>
          a.textContent.toLowerCase().includes('skip') &&
          a.getAttribute('href') &&
          a.getAttribute('href').includes('dashboard.html')
      );
      expect(skipLink).not.toBeNull();
    });
  });

  // =========================================================================
  // 4. Navigation Buttons
  // =========================================================================
  describe('Navigation Buttons', () => {
    it('has a Next button', () => {
      loadOnboardingEntry();
      const nextBtn = document.getElementById('next-btn');
      expect(nextBtn).not.toBeNull();
      expect(nextBtn.textContent.toLowerCase()).toContain('next');
    });

    it('has a Back button', () => {
      loadOnboardingEntry();
      const backBtn = document.getElementById('back-btn');
      expect(backBtn).not.toBeNull();
    });

    it('Next button advances to step 2', () => {
      loadOnboardingEntry();
      const nextBtn = document.getElementById('next-btn');
      nextBtn.click();

      expect(window.getCurrentStep()).toBe(2);
      // Step 2 panel should be visible
      const step2 = document.querySelector('[data-step="2"]');
      expect(step2.classList.contains('hidden')).toBe(false);
    });

    it('Back button goes to previous step from step 2', () => {
      loadOnboardingEntry();
      // Go to step 2 first
      if (typeof window.goToStep === 'function') {
        window.goToStep(2);
      }
      const backBtn = document.getElementById('back-btn');
      backBtn.click();

      expect(window.getCurrentStep()).toBe(1);
      const step1 = document.querySelector('[data-step="1"]');
      expect(step1.classList.contains('hidden')).toBe(false);
    });

    it('Back button is hidden or disabled on step 1', () => {
      loadOnboardingEntry();
      const backBtn = document.getElementById('back-btn');
      const isHidden =
        backBtn.style.display === 'none' ||
        backBtn.style.visibility === 'hidden' ||
        backBtn.disabled === true ||
        backBtn.classList.contains('hidden');
      expect(isHidden).toBe(true);
    });
  });

  // =========================================================================
  // 5. Step Indicator (via progress bar, not text)
  // =========================================================================
  describe('Step Indicator', () => {
    it('progress bar indicates step 1 initially (~16.67%)', () => {
      loadOnboardingEntry();
      expect(window.getCurrentStep()).toBe(1);
      const fill = document.querySelector('.progress-bar-fill');
      expect(fill).not.toBeNull();
      const width = parseFloat(fill.style.width);
      expect(width).toBeCloseTo(16.67, 0);
    });
  });

  // =========================================================================
  // 6. Final Step CTA
  // =========================================================================
  describe('Final Step', () => {
    it('on step 6, shows a "Go to Dashboard" or finish CTA', () => {
      loadOnboardingEntry();
      if (typeof window.goToStep === 'function') {
        window.goToStep(6);
      }
      // Next button should change to a finish/dashboard CTA
      const nextBtn = document.getElementById('next-btn');
      const ctaText = nextBtn.textContent.toLowerCase();
      const isFinishCTA =
        ctaText.includes('dashboard') ||
        ctaText.includes('finish') ||
        ctaText.includes('get started') ||
        ctaText.includes('complete');
      expect(isFinishCTA).toBe(true);
    });
  });

  // =========================================================================
  // 7. Workbook Branding
  // =========================================================================
  describe('Branding', () => {
    it('has Workbook branding in the header', () => {
      loadOnboardingEntry();
      const header = document.querySelector('.onboarding-header');
      expect(header).not.toBeNull();
      expect(header.textContent).toContain('Workbook');
    });
  });
});
