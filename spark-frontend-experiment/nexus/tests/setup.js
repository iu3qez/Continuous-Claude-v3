// Mock localStorage with Map-backed implementation
class LocalStorageMock {
  constructor() {
    this.store = new Map();
  }

  clear() {
    this.store.clear();
  }

  getItem(key) {
    return this.store.get(key) || null;
  }

  setItem(key, value) {
    this.store.set(key, String(value));
  }

  removeItem(key) {
    this.store.delete(key);
  }

  get length() {
    return this.store.size;
  }

  key(index) {
    return Array.from(this.store.keys())[index] || null;
  }
}

global.localStorage = new LocalStorageMock();

// Mock window.location with URLSearchParams support
delete window.location;
window.location = {
  href: 'http://localhost:3000/',
  origin: 'http://localhost:3000',
  protocol: 'http:',
  host: 'localhost:3000',
  hostname: 'localhost',
  port: '3000',
  pathname: '/',
  search: '',
  hash: '',

  // Add URLSearchParams-compatible method
  get searchParams() {
    return new URLSearchParams(this.search);
  },

  // Allow setting search to update searchParams
  _setSearch(searchString) {
    this.search = searchString;
    this.href = `${this.origin}${this.pathname}${searchString}${this.hash}`;
  }
};

// DOM helper utilities
export function createElement(tag, attrs = {}) {
  const element = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'textContent') {
      element.textContent = value;
    } else if (key === 'innerHTML') {
      element.innerHTML = value;
    } else if (key.startsWith('data-')) {
      element.setAttribute(key, value);
    } else {
      element[key] = value;
    }
  });
  return element;
}

export function createContainer() {
  const container = document.createElement('div');
  container.id = 'test-container';
  document.body.appendChild(container);
  return container;
}

export function cleanup() {
  const container = document.getElementById('test-container');
  if (container) {
    container.remove();
  }
  // Clear localStorage between tests
  localStorage.clear();
  // Reset location
  window.location._setSearch('');
  window.location.pathname = '/';
  window.location.hash = '';
}

// Auto-cleanup after each test
afterEach(() => {
  cleanup();
});
