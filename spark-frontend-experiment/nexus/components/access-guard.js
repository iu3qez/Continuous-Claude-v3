import WorkbookDemo from './state.js';
import { canAccessPage } from './persona.js';

/**
 * Enforce persona page access restrictions.
 * If the current persona cannot access the given page, hides the main content
 * and shows an "Access Restricted" overlay with a link to dashboard.
 *
 * @param {string} pageName - The page identifier (e.g., 'connections', 'elt-rollup')
 * @param {HTMLElement} mainContent - The main content element to hide if restricted
 * @returns {boolean} true if access is allowed, false if restricted
 */
export function enforceAccess(pageName, mainContent) {
  const persona = WorkbookDemo.persona;
  const allowed = canAccessPage(pageName, persona);

  if (allowed) {
    return true;
  }

  // Hide main content
  if (mainContent) {
    mainContent.style.display = 'none';
  }

  // Create restriction overlay
  const overlay = document.createElement('div');
  overlay.className = 'access-restricted';
  overlay.style.cssText = [
    'display:flex',
    'flex-direction:column',
    'align-items:center',
    'justify-content:center',
    'min-height:60vh',
    'text-align:center',
    'padding:40px',
  ].join(';') + ';';

  overlay.innerHTML = `
    <div style="width:64px;height:64px;border-radius:50%;background:rgba(220,38,38,0.1);display:flex;align-items:center;justify-content:center;margin-bottom:16px;">
      <span style="font-size:28px;color:#DC2626;">&#128274;</span>
    </div>
    <h2 style="font-size:24px;font-weight:700;margin-bottom:8px;color:var(--txt-primary,#EDEDEF);">Access Restricted</h2>
    <p style="color:var(--txt-secondary,#8F8F94);margin-bottom:24px;max-width:400px;">
      Your current role does not have permission to view this page. Contact your administrator for access.
    </p>
    <a href="dashboard.html" style="display:inline-block;padding:10px 24px;background:var(--accent,#4F46E5);color:white;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">
      Go to Dashboard
    </a>
  `;

  // Insert overlay after the main content (or at end of body)
  if (mainContent && mainContent.parentNode) {
    mainContent.parentNode.insertBefore(overlay, mainContent.nextSibling);
  } else {
    document.body.appendChild(overlay);
  }

  return false;
}
