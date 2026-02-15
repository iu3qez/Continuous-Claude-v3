import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createContainer } from './setup.js';

/**
 * Settings Page Tests
 *
 * Tests the settings.html page structure: tabs, profile form, team list,
 * billing, AI preferences, integrations, and theme/state interactions.
 */

// Helper: load settings.html content into jsdom and wire up switchTab
function loadSettingsPage() {
  const html = `
    <!-- Tab Navigation -->
    <div class="mb-8" style="border-bottom: 1px solid var(--border-subtle);">
      <div class="flex gap-8">
        <button class="tab-btn pb-3 px-1 font-medium" data-tab="profile" style="color: var(--txt-primary); border-bottom-color: var(--accent);">
          Profile
        </button>
        <button class="tab-btn pb-3 px-1 font-medium" data-tab="team" style="color: var(--txt-tertiary);">
          Team & Roles
        </button>
        <button class="tab-btn pb-3 px-1 font-medium" data-tab="workspaces" style="color: var(--txt-tertiary);">
          Workspaces
        </button>
        <button class="tab-btn pb-3 px-1 font-medium" data-tab="billing" style="color: var(--txt-tertiary);">
          Billing
        </button>
        <button class="tab-btn pb-3 px-1 font-medium" data-tab="integrations" style="color: var(--txt-tertiary);">
          Integrations
        </button>
        <button class="tab-btn pb-3 px-1 font-medium" data-tab="ai" style="color: var(--txt-tertiary);">
          AI Preferences
        </button>
      </div>
    </div>

    <!-- Profile Tab -->
    <div id="tab-profile" class="tab-content">
      <div class="max-w-2xl">
        <div class="mb-8">
          <label class="block text-sm font-medium mb-3">Profile Picture</label>
          <div class="flex items-center gap-6">
            <div class="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-semibold" data-avatar>JA</div>
            <div class="flex gap-3">
              <button class="btn-secondary">Change Photo</button>
              <button class="btn-tertiary">Remove</button>
            </div>
          </div>
        </div>
        <div class="mb-6">
          <label class="block text-sm font-medium mb-2">Full Name</label>
          <input type="text" value="Jay Altizer" class="input-field w-full" data-field="name">
        </div>
        <div class="mb-6">
          <label class="block text-sm font-medium mb-2">Email Address</label>
          <input type="email" value="jay@meridian.com" class="input-field w-full" data-field="email">
        </div>
        <div class="mb-6">
          <label class="block text-sm font-medium mb-2">Role</label>
          <div class="flex items-center gap-2">
            <span class="px-3 py-1 rounded-full text-sm font-medium" data-field="role">CEO</span>
          </div>
        </div>
        <div class="mb-8">
          <label class="block text-sm font-medium mb-3">Theme</label>
          <div class="flex items-center gap-4" data-theme-toggle>
            <button class="px-4 py-2 rounded-lg font-medium" data-theme="dark">Dark</button>
            <button class="px-4 py-2 rounded-lg font-medium" data-theme="light">Light</button>
          </div>
        </div>
        <div>
          <button class="btn-primary" data-action="save">Save Changes</button>
        </div>
      </div>
    </div>

    <!-- Team & Roles Tab -->
    <div id="tab-team" class="tab-content" style="display: none;">
      <div class="mb-8">
        <h2 class="text-xl font-semibold mb-4">Team Members</h2>
        <div class="space-y-3" data-team-list>
          <div class="card p-4 flex items-center justify-between" data-member="jay">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold">JA</div>
              <div>
                <div class="font-medium" data-member-name>Jay Altizer</div>
                <div class="text-sm" data-member-role>CEO</div>
              </div>
            </div>
            <div class="flex items-center gap-4">
              <span class="px-3 py-1 rounded-full text-xs font-medium" data-member-status>Admin</span>
              <button class="btn-tertiary text-sm">Edit</button>
            </div>
          </div>
          <div class="card p-4 flex items-center justify-between" data-member="sarah">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold">SC</div>
              <div>
                <div class="font-medium" data-member-name>Sarah Chen</div>
                <div class="text-sm" data-member-role>Operations Director</div>
              </div>
            </div>
            <div class="flex items-center gap-4">
              <span class="px-3 py-1 rounded-full text-xs font-medium" data-member-status>Admin</span>
              <button class="btn-tertiary text-sm">Edit</button>
            </div>
          </div>
          <div class="card p-4 flex items-center justify-between" data-member="marcus">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold">MJ</div>
              <div>
                <div class="font-medium" data-member-name>Marcus Johnson</div>
                <div class="text-sm" data-member-role>Engineering Lead</div>
              </div>
            </div>
            <div class="flex items-center gap-4">
              <span class="px-3 py-1 rounded-full text-xs font-medium" data-member-status>Editor</span>
              <button class="btn-tertiary text-sm">Edit</button>
            </div>
          </div>
          <div class="card p-4 flex items-center justify-between" data-member="lisa">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold">LP</div>
              <div>
                <div class="font-medium" data-member-name>Lisa Park</div>
                <div class="text-sm" data-member-role>New Analyst</div>
              </div>
            </div>
            <div class="flex items-center gap-4">
              <span class="px-3 py-1 rounded-full text-xs font-medium" data-member-status>Viewer</span>
              <button class="btn-tertiary text-sm">Edit</button>
            </div>
          </div>
          <div class="card p-4 flex items-center justify-between" data-member="david">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold">DK</div>
              <div>
                <div class="font-medium" data-member-name>David Kim</div>
                <div class="text-sm" data-member-role>Sales Director</div>
              </div>
            </div>
            <div class="flex items-center gap-4">
              <span class="px-3 py-1 rounded-full text-xs font-medium" data-member-status>Editor</span>
              <button class="btn-tertiary text-sm">Edit</button>
            </div>
          </div>
          <div class="card p-4 flex items-center justify-between" data-member="emily">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold">ER</div>
              <div>
                <div class="font-medium" data-member-name>Emily Rodriguez</div>
                <div class="text-sm" data-member-role>Marketing Manager</div>
              </div>
            </div>
            <div class="flex items-center gap-4">
              <span class="px-3 py-1 rounded-full text-xs font-medium" data-member-status>Editor</span>
              <button class="btn-tertiary text-sm">Edit</button>
            </div>
          </div>
        </div>
        <div class="mt-6">
          <button class="btn-primary" data-action="invite">Invite Team Member</button>
        </div>
      </div>
    </div>

    <!-- Workspaces Tab -->
    <div id="tab-workspaces" class="tab-content" style="display: none;">
      <h2>Department Workspaces</h2>
    </div>

    <!-- Billing Tab -->
    <div id="tab-billing" class="tab-content" style="display: none;">
      <h3 data-billing-title>Billing & Plan</h3>
      <div data-plan-card>
        <div>
          <span data-plan-name>Growth Plan</span>
          <span data-plan-badge>Current</span>
        </div>
        <span data-plan-price>$25<span>/user/mo</span></span>
        <div>
          <button data-action="upgrade">Upgrade to Enterprise</button>
          <button data-action="downgrade">Downgrade</button>
        </div>
      </div>
      <div data-usage-section>
        <div data-usage="queries">
          <span data-usage-label>AI Queries</span>
          <span data-usage-value>742 / 1,000</span>
          <div data-usage-bar style="width: 74.2%;"></div>
        </div>
        <div data-usage="connectors">
          <span data-usage-label>Connectors</span>
          <span data-usage-value>5 / Unlimited</span>
          <div data-usage-bar style="width: 100%;"></div>
        </div>
      </div>
    </div>

    <!-- Integrations Tab -->
    <div id="tab-integrations" class="tab-content" style="display: none;">
      <h3>Connected Integrations</h3>
      <div data-integrations-list>
        <div data-integration="salesforce">
          <div data-status-dot></div>
          <span data-integration-name>Salesforce</span>
          <span data-integration-status>Connected</span>
        </div>
        <div data-integration="slack">
          <div data-status-dot></div>
          <span data-integration-name>Slack</span>
          <span data-integration-status>Connected</span>
        </div>
        <div data-integration="google">
          <div data-status-dot></div>
          <span data-integration-name>Google Workspace</span>
          <span data-integration-status>Connected</span>
        </div>
      </div>
    </div>

    <!-- AI Preferences Tab -->
    <div id="tab-ai" class="tab-content" style="display: none;">
      <h3>AI Preferences</h3>
      <div data-autonomy-section>
        <label>AI Autonomy Level</label>
        <div data-autonomy-options>
          <label data-autonomy="suggest">
            <input type="radio" name="autonomy" value="suggest">
            <div>Suggest Only</div>
          </label>
          <label data-autonomy="balanced">
            <input type="radio" name="autonomy" value="balanced" checked>
            <div>Balanced (Recommended)</div>
          </label>
          <label data-autonomy="proactive">
            <input type="radio" name="autonomy" value="proactive">
            <div>Proactive</div>
          </label>
          <label data-autonomy="full">
            <input type="radio" name="autonomy" value="full">
            <div>Full Autonomy</div>
          </label>
        </div>
      </div>
      <div data-notification-section>
        <label>Notification Frequency</label>
        <select data-notification-frequency>
          <option>Real-time</option>
          <option selected>Hourly digest</option>
          <option>Daily digest</option>
          <option>Weekly digest</option>
        </select>
      </div>
      <div data-privacy-section>
        <div>Enhanced Data Privacy</div>
        <label>
          <input type="checkbox" data-privacy-toggle>
        </label>
      </div>
    </div>
  `;

  const container = createContainer();
  container.innerHTML = html;

  // Wire up switchTab globally, matching settings.html script
  window.switchTab = function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(el => {
      el.style.borderBottomColor = 'transparent';
      el.style.color = 'var(--txt-tertiary)';
    });
    const content = document.getElementById('tab-' + tabName);
    const btn = document.querySelector('[data-tab="' + tabName + '"]');
    if (content) content.style.display = '';
    if (btn) {
      btn.style.borderBottomColor = 'var(--accent)';
      btn.style.color = 'var(--txt-primary)';
    }
  };

  return container;
}


describe('Settings Page', () => {
  let WorkbookDemo;
  let persona;

  beforeEach(async () => {
    localStorage.clear();
    vi.resetModules();
    document.body.innerHTML = '';

    const stateMod = await import('../components/state.js');
    WorkbookDemo = stateMod.default;
    WorkbookDemo.industry = 'consulting';
    WorkbookDemo.persona = 'ceo';
    WorkbookDemo._listeners = {};

    persona = await import('../components/persona.js');
  });


  // ─── 1. Persona Access ───────────────────────────────────────────────

  describe('Persona Access', () => {
    it('CEO can access the settings page', () => {
      expect(persona.canAccessPage('settings', 'ceo')).toBe(true);
    });

    it('ops persona can access the settings page', () => {
      expect(persona.canAccessPage('settings', 'ops')).toBe(true);
    });

    it('engineering persona can access the settings page', () => {
      expect(persona.canAccessPage('settings', 'engineering')).toBe(true);
    });

    it('new persona cannot access the settings page', () => {
      expect(persona.canAccessPage('settings', 'new')).toBe(false);
    });
  });


  // ─── 2. Tab Navigation ──────────────────────────────────────────────

  describe('Tab Navigation', () => {
    it('renders all 6 tab buttons', () => {
      loadSettingsPage();
      const tabs = document.querySelectorAll('.tab-btn');
      expect(tabs).toHaveLength(6);
    });

    it('tab buttons have correct data-tab attributes', () => {
      loadSettingsPage();
      const tabs = document.querySelectorAll('.tab-btn');
      const tabNames = Array.from(tabs).map(t => t.dataset.tab);
      expect(tabNames).toEqual(['profile', 'team', 'workspaces', 'billing', 'integrations', 'ai']);
    });

    it('profile tab is visible by default', () => {
      loadSettingsPage();
      const profilePanel = document.getElementById('tab-profile');
      expect(profilePanel.style.display).not.toBe('none');
    });

    it('non-profile tabs are hidden by default', () => {
      loadSettingsPage();
      const hiddenTabs = ['team', 'workspaces', 'billing', 'integrations', 'ai'];
      for (const tabName of hiddenTabs) {
        const panel = document.getElementById('tab-' + tabName);
        expect(panel.style.display).toBe('none');
      }
    });

    it('switchTab shows the selected panel and hides others', () => {
      loadSettingsPage();
      window.switchTab('billing');

      const billingPanel = document.getElementById('tab-billing');
      expect(billingPanel.style.display).not.toBe('none');

      const profilePanel = document.getElementById('tab-profile');
      expect(profilePanel.style.display).toBe('none');
    });

    it('only one tab content panel is visible at a time after switching', () => {
      loadSettingsPage();
      window.switchTab('ai');

      const allPanels = document.querySelectorAll('.tab-content');
      const visiblePanels = Array.from(allPanels).filter(p => p.style.display !== 'none');
      expect(visiblePanels).toHaveLength(1);
      expect(visiblePanels[0].id).toBe('tab-ai');
    });
  });


  // ─── 3. Profile Form ────────────────────────────────────────────────

  describe('Profile Form', () => {
    it('has a name input field with default value', () => {
      loadSettingsPage();
      const nameInput = document.querySelector('[data-field="name"]');
      expect(nameInput).not.toBeNull();
      expect(nameInput.value).toBe('Jay Altizer');
    });

    it('has an email input field with default value', () => {
      loadSettingsPage();
      const emailInput = document.querySelector('[data-field="email"]');
      expect(emailInput).not.toBeNull();
      expect(emailInput.value).toBe('jay@meridian.com');
    });

    it('has a role display showing CEO', () => {
      loadSettingsPage();
      const role = document.querySelector('[data-field="role"]');
      expect(role).not.toBeNull();
      expect(role.textContent).toBe('CEO');
    });

    it('name input value can be changed', () => {
      loadSettingsPage();
      const nameInput = document.querySelector('[data-field="name"]');
      nameInput.value = 'Test User';
      expect(nameInput.value).toBe('Test User');
    });

    it('has a Save Changes button', () => {
      loadSettingsPage();
      const saveBtn = document.querySelector('[data-action="save"]');
      expect(saveBtn).not.toBeNull();
      expect(saveBtn.textContent).toBe('Save Changes');
    });
  });


  // ─── 4. Team List ───────────────────────────────────────────────────

  describe('Team List', () => {
    it('renders 6 team member cards', () => {
      loadSettingsPage();
      window.switchTab('team');
      const members = document.querySelectorAll('[data-member]');
      expect(members).toHaveLength(6);
    });

    it('each member card has a name and role', () => {
      loadSettingsPage();
      window.switchTab('team');
      const members = document.querySelectorAll('[data-member]');
      for (const member of members) {
        const name = member.querySelector('[data-member-name]');
        const role = member.querySelector('[data-member-role]');
        expect(name).not.toBeNull();
        expect(name.textContent.length).toBeGreaterThan(0);
        expect(role).not.toBeNull();
        expect(role.textContent.length).toBeGreaterThan(0);
      }
    });

    it('each member card has a status badge (Admin, Editor, or Viewer)', () => {
      loadSettingsPage();
      window.switchTab('team');
      const statuses = document.querySelectorAll('[data-member-status]');
      expect(statuses).toHaveLength(6);
      const validStatuses = ['Admin', 'Editor', 'Viewer'];
      for (const badge of statuses) {
        expect(validStatuses).toContain(badge.textContent);
      }
    });

    it('has an Invite Team Member button', () => {
      loadSettingsPage();
      window.switchTab('team');
      const inviteBtn = document.querySelector('[data-action="invite"]');
      expect(inviteBtn).not.toBeNull();
      expect(inviteBtn.textContent).toBe('Invite Team Member');
    });
  });


  // ─── 5. Billing ─────────────────────────────────────────────────────

  describe('Billing', () => {
    it('displays the current plan name as Growth Plan', () => {
      loadSettingsPage();
      window.switchTab('billing');
      const planName = document.querySelector('[data-plan-name]');
      expect(planName).not.toBeNull();
      expect(planName.textContent).toBe('Growth Plan');
    });

    it('shows AI Queries usage with value', () => {
      loadSettingsPage();
      window.switchTab('billing');
      const queryUsage = document.querySelector('[data-usage="queries"]');
      expect(queryUsage).not.toBeNull();
      const value = queryUsage.querySelector('[data-usage-value]');
      expect(value.textContent).toBe('742 / 1,000');
    });

    it('shows Connectors usage with value', () => {
      loadSettingsPage();
      window.switchTab('billing');
      const connectorUsage = document.querySelector('[data-usage="connectors"]');
      expect(connectorUsage).not.toBeNull();
      const value = connectorUsage.querySelector('[data-usage-value]');
      expect(value.textContent).toBe('5 / Unlimited');
    });

    it('has an Upgrade to Enterprise button', () => {
      loadSettingsPage();
      window.switchTab('billing');
      const upgradeBtn = document.querySelector('[data-action="upgrade"]');
      expect(upgradeBtn).not.toBeNull();
      expect(upgradeBtn.textContent).toBe('Upgrade to Enterprise');
    });
  });


  // ─── 6. AI Preferences ──────────────────────────────────────────────

  describe('AI Preferences', () => {
    it('has 4 autonomy level radio options', () => {
      loadSettingsPage();
      window.switchTab('ai');
      const radios = document.querySelectorAll('input[name="autonomy"]');
      expect(radios).toHaveLength(4);
    });

    it('balanced is the default selected autonomy level', () => {
      loadSettingsPage();
      window.switchTab('ai');
      const balanced = document.querySelector('input[name="autonomy"][value="balanced"]');
      expect(balanced.checked).toBe(true);
    });

    it('selecting a different autonomy radio updates checked state', () => {
      loadSettingsPage();
      window.switchTab('ai');
      const proactive = document.querySelector('input[name="autonomy"][value="proactive"]');
      proactive.checked = true;
      expect(proactive.checked).toBe(true);
    });

    it('notification frequency select has 4 options', () => {
      loadSettingsPage();
      window.switchTab('ai');
      const select = document.querySelector('[data-notification-frequency]');
      expect(select).not.toBeNull();
      expect(select.options).toHaveLength(4);
    });

    it('hourly digest is the default notification frequency', () => {
      loadSettingsPage();
      window.switchTab('ai');
      const select = document.querySelector('[data-notification-frequency]');
      expect(select.value).toBe('Hourly digest');
    });
  });


  // ─── 7. Integrations ────────────────────────────────────────────────

  describe('Integrations', () => {
    it('lists 3 connected integrations', () => {
      loadSettingsPage();
      window.switchTab('integrations');
      const integrations = document.querySelectorAll('[data-integration]');
      expect(integrations).toHaveLength(3);
    });

    it('integration names are Salesforce, Slack, and Google Workspace', () => {
      loadSettingsPage();
      window.switchTab('integrations');
      const names = document.querySelectorAll('[data-integration-name]');
      const nameTexts = Array.from(names).map(n => n.textContent);
      expect(nameTexts).toContain('Salesforce');
      expect(nameTexts).toContain('Slack');
      expect(nameTexts).toContain('Google Workspace');
    });

    it('all integrations show Connected status', () => {
      loadSettingsPage();
      window.switchTab('integrations');
      const statuses = document.querySelectorAll('[data-integration-status]');
      for (const status of statuses) {
        expect(status.textContent).toBe('Connected');
      }
    });
  });


  // ─── 8. Theme Toggle ────────────────────────────────────────────────

  describe('Theme Toggle', () => {
    it('profile tab has dark and light theme buttons', () => {
      loadSettingsPage();
      const darkBtn = document.querySelector('[data-theme="dark"]');
      const lightBtn = document.querySelector('[data-theme="light"]');
      expect(darkBtn).not.toBeNull();
      expect(lightBtn).not.toBeNull();
      expect(darkBtn.textContent).toBe('Dark');
      expect(lightBtn.textContent).toBe('Light');
    });

    it('WorkbookDemo.theme defaults to dark', () => {
      expect(WorkbookDemo.theme).toBe('dark');
    });

    it('toggleTheme switches from dark to light', () => {
      WorkbookDemo.toggleTheme();
      expect(WorkbookDemo.theme).toBe('light');
    });

    it('toggleTheme switches back from light to dark', () => {
      WorkbookDemo.toggleTheme(); // dark -> light
      WorkbookDemo.toggleTheme(); // light -> dark
      expect(WorkbookDemo.theme).toBe('dark');
    });
  });


  // ─── 9. State Persistence ───────────────────────────────────────────

  describe('State Persistence', () => {
    it('toggleTheme persists theme to localStorage', () => {
      WorkbookDemo.toggleTheme();
      expect(localStorage.getItem('workbook-theme')).toBe('light');
    });

    it('init restores persisted theme from localStorage', async () => {
      localStorage.setItem('workbook-theme', 'light');
      vi.resetModules();
      const freshState = await import('../components/state.js');
      expect(freshState.default.theme).toBe('light');
    });

    it('init restores persisted persona from localStorage', async () => {
      localStorage.setItem('workbook-persona', 'ops');
      vi.resetModules();
      const freshState = await import('../components/state.js');
      expect(freshState.default.persona).toBe('ops');
    });
  });
});
