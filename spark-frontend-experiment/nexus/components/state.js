const VALID_INDUSTRIES = ['consulting', 'tech', 'hospitality'];
const VALID_PERSONAS = ['ceo', 'ops', 'engineering', 'new'];
const STORAGE_KEYS = {
  industry: 'workbook-industry',
  persona: 'workbook-persona',
  theme: 'workbook-theme',
};

const WorkbookDemo = {
  // State
  industry: 'consulting',
  persona: 'ceo',
  demoMode: 'free',
  currentArc: null,
  currentStep: 0,
  aiMode: 'scripted',
  theme: 'dark',
  data: null,
  connections: {},

  // Private
  _listeners: {},

  // Methods
  init() {
    const savedIndustry = localStorage.getItem(STORAGE_KEYS.industry);
    if (savedIndustry && VALID_INDUSTRIES.includes(savedIndustry)) {
      this.industry = savedIndustry;
    }

    const savedPersona = localStorage.getItem(STORAGE_KEYS.persona);
    if (savedPersona && VALID_PERSONAS.includes(savedPersona)) {
      this.persona = savedPersona;
    }

    const savedTheme = localStorage.getItem(STORAGE_KEYS.theme);
    if (savedTheme && (savedTheme === 'dark' || savedTheme === 'light')) {
      this.theme = savedTheme;
    }
  },

  switchIndustry(id) {
    if (!VALID_INDUSTRIES.includes(id)) {
      return;
    }
    this.industry = id;
    localStorage.setItem(STORAGE_KEYS.industry, id);
    this.notify('industryChange', { industry: id });
  },

  switchPersona(id) {
    if (!VALID_PERSONAS.includes(id)) {
      return;
    }
    this.persona = id;
    localStorage.setItem(STORAGE_KEYS.persona, id);
    this.notify('personaChange', { persona: id });
  },

  startArc(arcId) {
    this.demoMode = 'guided';
    this.currentArc = arcId;
    this.currentStep = 0;
  },

  nextStep() {
    this.currentStep += 1;
  },

  prevStep() {
    if (this.currentStep > 0) {
      this.currentStep -= 1;
    }
  },

  toggleAiMode() {
    this.aiMode = this.aiMode === 'scripted' ? 'live' : 'scripted';
  },

  toggleTheme() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem(STORAGE_KEYS.theme, this.theme);
  },

  subscribe(event, callback) {
    if (!this._listeners[event]) {
      this._listeners[event] = [];
    }
    this._listeners[event].push(callback);
  },

  unsubscribe(event, callback) {
    if (!this._listeners[event]) {
      return;
    }
    this._listeners[event] = this._listeners[event].filter(
      (cb) => cb !== callback
    );
  },

  notify(event, data) {
    if (!this._listeners[event]) {
      return;
    }
    this._listeners[event].forEach((cb) => cb(data));
  },
};

// Auto-init on module load to restore persisted state
WorkbookDemo.init();

export default WorkbookDemo;
