/**
 * BEYOND REACH - Central State Management
 * Handles language, accessibility preferences, theme, user session, and persistence.
 */

const STORAGE_KEY = 'beyond_reach_state_v1';

const defaultState = {
  language: 'en',
  accessibility: [], // e.g. ['blind', 'physical']
  activeView: 'welcome', // 'welcome', 'language', 'accessibility', 'auth', 'dashboard'
  dashboardSection: 'overview', // 'overview', 'profile', 'assistant', 'explore', 'transport', 'services', 'communication', 'emergency', 'community', 'settings', 'help'
  user: {
    isLoggedIn: false,
    name: 'Alex Morgan',
    email: 'alex.morgan@example.com',
    phone: '+1 (555) 019-2834',
    emergencyContact: 'Sarah Morgan (Sister) - +1 (555) 987-6543',
    bloodType: 'O Positive (O+)',
    allergies: 'Penicillin, Peanuts',
    medicalNotes: 'Guide dog user; requires step-free ramp access; uses screen reader and tactile markers.',
    avatar: 'assets/avatar.png'
  },
  settings: {
    textSize: 100, // 100, 125, 150, 175, 200
    theme: 'dark', // 'dark', 'contrast-yellow', 'contrast-white', 'soft-dark'
    easyRead: false,
    dyslexicFont: false,
    readingRuler: false,
    soundEffects: true,
    screenReaderAnnounce: true,
    voiceSpeed: 1.0,
    voicePitch: 1.0,
    giantButtons: false,
    visualAlerts: false,
    listening: false
  },
  notifications: [
    { id: 1, type: 'info', title: 'Low-floor transit arriving', time: '10 mins ago', read: false },
    { id: 2, type: 'success', title: 'Tactile route saved to your profile', time: '1 hour ago', read: false },
    { id: 3, type: 'warning', title: 'Elevator maintenance at Central Station', time: '3 hours ago', read: true }
  ]
};

class StateManager {
  constructor() {
    this.state = this.loadState();
    this.listeners = [];
  }

  loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...defaultState,
          ...parsed,
          settings: { 
            ...defaultState.settings, 
            ...(parsed.settings || {}),
            readingRuler: false // Prevent stray lingering ruler line
          },
          user: { ...defaultState.user, ...(parsed.user || {}) }
        };
      }
    } catch (e) {
      console.warn('Could not read state from localStorage', e);
    }
    return JSON.parse(JSON.stringify(defaultState));
  }

  saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Could not write state to localStorage', e);
    }
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(fn => {
      try {
        fn(this.state);
      } catch (e) {
        console.error('State subscriber error', e);
      }
    });
  }

  get() {
    return this.state;
  }

  set(updates) {
    this.state = { ...this.state, ...updates };
    this.saveState();
  }

  setLanguage(langCode) {
    if (window.TRANSLATIONS && window.TRANSLATIONS[langCode]) {
      this.state.language = langCode;
      this.saveState();
      this.applyDOMState();
    }
  }

  t(key, fallback = '') {
    const lang = this.state.language || 'en';
    const dict = (window.TRANSLATIONS && window.TRANSLATIONS[lang]) || (window.TRANSLATIONS && window.TRANSLATIONS.en) || {};
    return dict[key] || (window.TRANSLATIONS && window.TRANSLATIONS.en && window.TRANSLATIONS.en[key]) || fallback || key;
  }

  toggleAccessibility(category) {
    const list = [...this.state.accessibility];
    const index = list.indexOf(category);
    if (index > -1) {
      list.splice(index, 1);
    } else {
      list.push(category);
    }
    this.state.accessibility = list;
    this.syncProfileSettings();
    this.saveState();
    this.applyDOMState();
  }

  setAccessibility(categories) {
    this.state.accessibility = [...categories];
    this.syncProfileSettings();
    this.saveState();
    this.applyDOMState();
  }

  hasAccessibility(category) {
    return this.state.accessibility.includes(category);
  }

  syncProfileSettings() {
    // Automatically optimize settings based on selected preferences
    const hasBlind = this.hasAccessibility('blind');
    const hasDeaf = this.hasAccessibility('deaf');
    const hasPhysical = this.hasAccessibility('physical');
    const hasCognitive = this.hasAccessibility('cognitive');
    
    if (hasBlind) {
      this.state.settings.screenReaderAnnounce = true;
      this.state.settings.soundEffects = true;
      if (this.state.settings.textSize < 125) {
        this.state.settings.textSize = 125;
      }
    }
    if (hasDeaf) {
      this.state.settings.visualAlerts = true;
    }
    if (hasPhysical) {
      this.state.settings.giantButtons = true;
    }
    if (hasCognitive) {
      this.state.settings.easyRead = true;
    }
  }

  updateSettings(newSettings) {
    this.state.settings = { ...this.state.settings, ...newSettings };
    this.saveState();
    this.applyDOMState();
  }

  updateUser(userData) {
    this.state.user = { ...this.state.user, ...userData };
    this.saveState();
  }

  navigate(viewName, section = null) {
    this.state.activeView = viewName;
    if (section) {
      this.state.dashboardSection = section;
    }
    window.location.hash = section ? `#dashboard/${section}` : `#${viewName}`;
    this.saveState();
    this.applyDOMState();
  }

  applyDOMState() {
    const root = document.documentElement;
    const body = document.body;
    if (!body) return;

    // Apply language attribute
    root.setAttribute('lang', this.state.language);
    
    // Apply text size
    root.style.setProperty('--font-scale', (this.state.settings.textSize / 100).toString());
    
    // Apply theme classes
    body.classList.remove('theme-dark', 'theme-contrast-yellow', 'theme-contrast-white', 'theme-soft-dark');
    body.classList.add(`theme-${this.state.settings.theme}`);

    // Apply accessibility modifier classes
    body.classList.toggle('mode-blind', this.hasAccessibility('blind'));
    body.classList.toggle('mode-deaf', this.hasAccessibility('deaf'));
    body.classList.toggle('mode-physical', this.hasAccessibility('physical'));
    body.classList.toggle('mode-speech', this.hasAccessibility('speech'));
    body.classList.toggle('mode-cognitive', this.hasAccessibility('cognitive'));
    body.classList.toggle('mode-giant-buttons', this.state.settings.giantButtons);
    body.classList.toggle('mode-easy-read', this.state.settings.easyRead);
    body.classList.toggle('mode-dyslexic', this.state.settings.dyslexicFont);
    body.classList.toggle('mode-reading-ruler', this.state.settings.readingRuler);
    body.classList.toggle('mode-visual-alerts', this.state.settings.visualAlerts);

    // Update translated text in DOM
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const val = this.t(key);
      if (val) {
        if (el.tagName === 'INPUT' && el.getAttribute('type') === 'text') {
          el.setAttribute('placeholder', val);
        } else {
          el.textContent = val;
        }
      }
    });

    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const val = this.t(key);
      if (val) el.setAttribute('placeholder', val);
    });

    // Update aria labels
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      const key = el.getAttribute('data-i18n-aria');
      const val = this.t(key);
      if (val) el.setAttribute('aria-label', val);
    });
  }
}

// Global State Instance
window.appState = new StateManager();

