import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Read CSS files once at module level
const TOKENS_CSS = readFileSync(
  resolve(__dirname, '../styles/nexus-tokens.css'), 'utf-8'
);
const ANIMATIONS_CSS = readFileSync(
  resolve(__dirname, '../styles/animations.css'), 'utf-8'
);

/**
 * Extract the value of a CSS custom property from raw CSS text.
 * Returns the trimmed value string, or null if not found.
 */
function getCSSVar(css, varName) {
  // Escape special regex chars in the variable name
  const escaped = varName.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(`${escaped}:\\s*([^;]+);`);
  const match = css.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * Check whether a @keyframes block with the given name exists in CSS text.
 */
function hasKeyframes(css, name) {
  const regex = new RegExp(`@keyframes\\s+${name}\\s*\\{`);
  return regex.test(css);
}

/**
 * Extract the value of a CSS property for a given selector.
 * Handles simple single-property lookups inside a selector block.
 */
function getClassProperty(css, selector, property) {
  // Escape dots in selectors for regex
  const escapedSelector = selector.replace(/\./g, '\\.');
  const blockRegex = new RegExp(`${escapedSelector}\\s*\\{([^}]+)\\}`);
  const blockMatch = css.match(blockRegex);
  if (!blockMatch) return null;

  const propRegex = new RegExp(`${property}:\\s*([^;]+);`);
  const propMatch = blockMatch[1].match(propRegex);
  return propMatch ? propMatch[1].trim() : null;
}

// ================================================================
// DESIGN SYSTEM TOKENS (nexus-tokens.css)
// ================================================================

describe('Design System - Tokens', () => {

  // ---- Surface Colors ----
  describe('Surface Colors', () => {
    it('--surface is #18181B', () => {
      expect(getCSSVar(TOKENS_CSS, '--surface')).toBe('#18181B');
    });

    it('--surface-dark is #0E0E11', () => {
      expect(getCSSVar(TOKENS_CSS, '--surface-dark')).toBe('#0E0E11');
    });

    it('--surface-ai is #16161D', () => {
      expect(getCSSVar(TOKENS_CSS, '--surface-ai')).toBe('#16161D');
    });

    it('--surface-elevated is #1F1F23', () => {
      expect(getCSSVar(TOKENS_CSS, '--surface-elevated')).toBe('#1F1F23');
    });
  });

  // ---- Border Colors ----
  describe('Border Colors', () => {
    it('--border is #27272A', () => {
      expect(getCSSVar(TOKENS_CSS, '--border')).toBe('#27272A');
    });

    it('--border-hover is #3F3F46', () => {
      expect(getCSSVar(TOKENS_CSS, '--border-hover')).toBe('#3F3F46');
    });
  });

  // ---- Text Hierarchy ----
  describe('Text Colors', () => {
    it('--txt-primary is #F0EFED', () => {
      expect(getCSSVar(TOKENS_CSS, '--txt-primary')).toBe('#F0EFED');
    });

    it('--txt-secondary is #918F8A', () => {
      expect(getCSSVar(TOKENS_CSS, '--txt-secondary')).toBe('#918F8A');
    });

    it('--txt-tertiary is #6E6D69', () => {
      expect(getCSSVar(TOKENS_CSS, '--txt-tertiary')).toBe('#6E6D69');
    });
  });

  // ---- Accent Colors ----
  describe('Accent Colors', () => {
    it('--accent is #4F46E5', () => {
      expect(getCSSVar(TOKENS_CSS, '--accent')).toBe('#4F46E5');
    });

    it('--accent-hover is #6366F1', () => {
      expect(getCSSVar(TOKENS_CSS, '--accent-hover')).toBe('#6366F1');
    });

    it('--accent-subtle is rgba(79, 70, 229, 0.08)', () => {
      expect(getCSSVar(TOKENS_CSS, '--accent-subtle')).toBe('rgba(79, 70, 229, 0.08)');
    });
  });

  // ---- Semantic Colors ----
  describe('Semantic Colors', () => {
    it('--danger is #DC2626', () => {
      expect(getCSSVar(TOKENS_CSS, '--danger')).toBe('#DC2626');
    });

    it('--warning is #D97706', () => {
      expect(getCSSVar(TOKENS_CSS, '--warning')).toBe('#D97706');
    });

    it('--success is #059669', () => {
      expect(getCSSVar(TOKENS_CSS, '--success')).toBe('#059669');
    });
  });

  // ---- Workspace Colors ----
  describe('Workspace Colors', () => {
    it('--ws-ops is #4F46E5', () => {
      expect(getCSSVar(TOKENS_CSS, '--ws-ops')).toBe('#4F46E5');
    });

    it('--ws-elt is #7C3AED', () => {
      expect(getCSSVar(TOKENS_CSS, '--ws-elt')).toBe('#7C3AED');
    });

    it('--ws-mkt is #D97706', () => {
      expect(getCSSVar(TOKENS_CSS, '--ws-mkt')).toBe('#D97706');
    });

    it('--ws-eng is #059669', () => {
      expect(getCSSVar(TOKENS_CSS, '--ws-eng')).toBe('#059669');
    });

    it('--ws-sales is #2563EB', () => {
      expect(getCSSVar(TOKENS_CSS, '--ws-sales')).toBe('#2563EB');
    });

    it('--ws-finance is #DC2626', () => {
      expect(getCSSVar(TOKENS_CSS, '--ws-finance')).toBe('#DC2626');
    });

    it('--ws-hr is #EC4899', () => {
      expect(getCSSVar(TOKENS_CSS, '--ws-hr')).toBe('#EC4899');
    });
  });

  // ---- Typography Fonts ----
  describe('Typography Fonts', () => {
    it('--font-heading uses Playfair Display', () => {
      expect(getCSSVar(TOKENS_CSS, '--font-heading')).toBe("'Playfair Display', Georgia, serif");
    });

    it('--font-body uses Inter', () => {
      expect(getCSSVar(TOKENS_CSS, '--font-body')).toBe("'Inter', system-ui, sans-serif");
    });

    it('--font-mono uses JetBrains Mono', () => {
      expect(getCSSVar(TOKENS_CSS, '--font-mono')).toBe("'JetBrains Mono', monospace");
    });
  });

  // ---- Font Sizes (spot checks) ----
  describe('Font Sizes', () => {
    it('--text-3xl is 32px', () => {
      expect(getCSSVar(TOKENS_CSS, '--text-3xl')).toBe('32px');
    });

    it('--text-sm is 14px', () => {
      expect(getCSSVar(TOKENS_CSS, '--text-sm')).toBe('14px');
    });

    it('--text-xs is 12px', () => {
      expect(getCSSVar(TOKENS_CSS, '--text-xs')).toBe('12px');
    });
  });

  // ---- Spacing Scale (spot checks) ----
  describe('Spacing Scale', () => {
    it('--space-1 is 4px', () => {
      expect(getCSSVar(TOKENS_CSS, '--space-1')).toBe('4px');
    });

    it('--space-4 is 16px', () => {
      expect(getCSSVar(TOKENS_CSS, '--space-4')).toBe('16px');
    });

    it('--space-8 is 32px', () => {
      expect(getCSSVar(TOKENS_CSS, '--space-8')).toBe('32px');
    });
  });

  // ---- Border Radius ----
  describe('Border Radius', () => {
    it('--radius-sm is 4px', () => {
      expect(getCSSVar(TOKENS_CSS, '--radius-sm')).toBe('4px');
    });

    it('--radius-md is 6px', () => {
      expect(getCSSVar(TOKENS_CSS, '--radius-md')).toBe('6px');
    });

    it('--radius-lg is 8px', () => {
      expect(getCSSVar(TOKENS_CSS, '--radius-lg')).toBe('8px');
    });

    it('--radius-xl is 12px', () => {
      expect(getCSSVar(TOKENS_CSS, '--radius-xl')).toBe('12px');
    });

    it('--radius-full is 9999px', () => {
      expect(getCSSVar(TOKENS_CSS, '--radius-full')).toBe('9999px');
    });
  });

  // ---- Landing Page Extensions ----
  describe('Landing Page Tokens', () => {
    it('--landing-bg is #0A0A0D', () => {
      expect(getCSSVar(TOKENS_CSS, '--landing-bg')).toBe('#0A0A0D');
    });

    it('--landing-gradient is defined', () => {
      const value = getCSSVar(TOKENS_CSS, '--landing-gradient');
      expect(value).not.toBeNull();
      expect(value).toContain('linear-gradient');
    });
  });

  // ---- Light Mode Overrides ----
  describe('Light Mode Overrides', () => {
    it('html:not(.dark) selector block exists', () => {
      expect(TOKENS_CSS).toContain('html:not(.dark)');
    });

    it('light mode overrides --surface to #FFFFFF', () => {
      // Extract the html:not(.dark) block and check --surface inside it
      const lightBlock = TOKENS_CSS.match(/html:not\(\.dark\)\s*\{([\s\S]*?)\}/);
      expect(lightBlock).not.toBeNull();
      const surfaceMatch = lightBlock[1].match(/--surface:\s*([^;]+);/);
      expect(surfaceMatch).not.toBeNull();
      expect(surfaceMatch[1].trim()).toBe('#FFFFFF');
    });
  });
});

// ================================================================
// ANIMATIONS (animations.css)
// ================================================================

describe('Design System - Animations', () => {

  // ---- Keyframe Definitions ----
  describe('Keyframe Definitions', () => {
    it('defines staggerIn keyframes', () => {
      expect(hasKeyframes(ANIMATIONS_CSS, 'staggerIn')).toBe(true);
    });

    it('defines fadeIn keyframes', () => {
      expect(hasKeyframes(ANIMATIONS_CSS, 'fadeIn')).toBe(true);
    });

    it('defines springBounce keyframes', () => {
      expect(hasKeyframes(ANIMATIONS_CSS, 'springBounce')).toBe(true);
    });
  });

  // ---- Stagger Delay Classes ----
  describe('Stagger Delay Classes', () => {
    it('.stagger-1 has 50ms delay', () => {
      expect(getClassProperty(ANIMATIONS_CSS, '.stagger-1', 'animation-delay')).toBe('50ms');
    });

    it('.stagger-4 has 200ms delay', () => {
      expect(getClassProperty(ANIMATIONS_CSS, '.stagger-4', 'animation-delay')).toBe('200ms');
    });
  });

  // ---- Reduced Motion Support ----
  describe('Reduced Motion', () => {
    it('prefers-reduced-motion media query exists', () => {
      expect(ANIMATIONS_CSS).toContain('@media (prefers-reduced-motion: reduce)');
    });

    it('sets animation-duration to 0.01ms inside reduced motion', () => {
      const reducedBlock = ANIMATIONS_CSS.match(
        /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?)\n\}/
      );
      expect(reducedBlock).not.toBeNull();
      expect(reducedBlock[1]).toContain('animation-duration: 0.01ms');
    });
  });
});
