import WorkbookDemo from './state.js';

const PERSONAS = {
  ceo: {
    id: 'ceo',
    name: 'Jay Altizer',
    role: 'CEO',
    department: 'Executive',
    avatarColor: '#7C3AED',
    visibleWorkspaces: ['all'],
    pages: ['all'],
    greeting: 'Good morning, Jay',
  },
  ops: {
    id: 'ops',
    name: 'Sarah Chen',
    role: 'COO',
    department: 'Operations',
    avatarColor: '#4F46E5',
    visibleWorkspaces: ['Operations', 'Executive'],
    pages: [
      'dashboard',
      'meetings',
      'meeting-detail',
      'actions',
      'decisions',
      'proposals',
      'calendar',
      'my-work',
      'agents',
      'connections',
      'settings',
    ],
    greeting: 'Good morning, Sarah',
  },
  engineering: {
    id: 'engineering',
    name: 'Marcus Johnson',
    role: 'VP Engineering',
    department: 'Engineering',
    avatarColor: '#059669',
    visibleWorkspaces: ['Engineering', 'Product'],
    pages: [
      'dashboard',
      'meetings',
      'meeting-detail',
      'actions',
      'decisions',
      'proposals',
      'calendar',
      'my-work',
      'agents',
      'connections',
      'settings',
    ],
    greeting: 'Good morning, Marcus',
  },
  new: {
    id: 'new',
    name: 'Lisa Park',
    role: 'BD Associate',
    department: 'Business Development',
    avatarColor: '#2563EB',
    visibleWorkspaces: ['Business Development'],
    pages: ['dashboard', 'meetings', 'meeting-detail', 'actions', 'my-work'],
    greeting: 'Welcome, Lisa!',
  },
};

export function getPersona(id) {
  return PERSONAS[id] || null;
}

export function switchPersona(id) {
  if (!PERSONAS[id]) {
    return false;
  }
  WorkbookDemo.switchPersona(id);
  return true;
}

export function getPersonaConfig() {
  return PERSONAS[WorkbookDemo.persona] || null;
}

export function getVisibleWorkspaces(personaId) {
  const p = PERSONAS[personaId];
  if (!p) {
    return [];
  }
  return p.visibleWorkspaces;
}

export function canAccessPage(page, personaId) {
  const p = PERSONAS[personaId];
  if (!p) {
    return false;
  }
  if (p.pages.includes('all')) {
    return true;
  }
  return p.pages.includes(page);
}

export function getGreeting(personaId) {
  const p = PERSONAS[personaId];
  if (!p) {
    return '';
  }
  return p.greeting;
}

export function getAllPersonas() {
  return Object.values(PERSONAS);
}
