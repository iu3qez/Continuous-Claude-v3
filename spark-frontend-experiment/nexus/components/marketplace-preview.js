import { createDrawer, openDrawer, closeDrawer, setDrawerContent, setDrawerTitle } from './detail-drawer.js';

/**
 * Show a preview drawer for an agent.
 * @param {Object} agent - { id, name, description, category, rating, installs, icon, color }
 */
export function showAgentPreview(agent) {
  // Remove any existing preview drawer
  const existing = document.querySelector('.detail-drawer');
  if (existing) {
    closeDrawer(existing);
    existing.remove();
  }

  const drawer = createDrawer({ title: agent.name, width: 420 });
  document.body.appendChild(drawer);

  setDrawerContent(drawer, `
    <div style="padding: 8px 0;">
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
        <div class="${agent.color}" style="width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0;">
          ${agent.icon}
        </div>
        <div>
          <div style="font-weight: 600; font-size: 16px; color: var(--txt-primary, #EDEDEF);">${agent.name}</div>
          <span style="display: inline-block; padding: 2px 8px; font-size: 12px; border-radius: 4px; border: 1px solid var(--border, #232326); text-transform: capitalize;">${agent.category}</span>
        </div>
      </div>

      <div style="margin-bottom: 20px;">
        <h4 style="color: var(--txt-tertiary, #6B6B70); font-size: 12px; text-transform: uppercase; margin-bottom: 6px;">Description</h4>
        <p style="color: var(--txt-secondary, #8F8F94); font-size: 14px; line-height: 1.5;">${agent.description}</p>
      </div>

      <div style="display: flex; gap: 24px; margin-bottom: 20px;">
        <div>
          <h4 style="color: var(--txt-tertiary, #6B6B70); font-size: 12px; text-transform: uppercase; margin-bottom: 4px;">Rating</h4>
          <span style="color: var(--txt-primary, #EDEDEF); font-size: 16px; font-weight: 600;">${agent.rating}</span>
        </div>
        <div>
          <h4 style="color: var(--txt-tertiary, #6B6B70); font-size: 12px; text-transform: uppercase; margin-bottom: 4px;">Installs</h4>
          <span style="color: var(--txt-primary, #EDEDEF); font-size: 16px; font-weight: 600;">${agent.installs}</span>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 24px;">
        <button data-action="install" style="padding: 10px 16px; background: var(--accent, #4F46E5); color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer;">Install Agent</button>
      </div>
    </div>
  `);

  openDrawer(drawer);
}
