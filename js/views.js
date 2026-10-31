/**
 * BEYOND REACH - View Controller & Screen Renderer
 * Manages view switching, keyboard focus management, ARIA announcements, and subviews.
 */

class ViewManager {
  constructor() {
    this.currentView = null;
    this.currentSection = null;
    this.bindHashRouting();
  }

  bindHashRouting() {
    window.addEventListener('hashchange', () => {
      this.routeFromHash();
    });
  }

  routeFromHash() {
    const hash = window.location.hash.replace('#', '') || 'welcome';
    const parts = hash.split('/');
    const viewName = parts[0] || 'welcome';
    const sectionName = parts[1] || 'overview';
    this.showView(viewName, sectionName);
  }

  showView(viewName, sectionName = 'overview') {
    const validViews = ['welcome', 'language', 'accessibility', 'auth', 'dashboard'];
    const targetView = validViews.includes(viewName) ? viewName : 'welcome';

    // Hide all views
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));

    // Show target view
    const targetEl = document.getElementById(`view-${targetView}`);
    if (targetEl) {
      targetEl.classList.add('active');
      this.currentView = targetView;

      // Handle dashboard subviews
      if (targetView === 'dashboard') {
        this.showDashboardSection(sectionName);
      }

      // Move focus for accessibility
      const heading = targetEl.querySelector('h1, h2');
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus();
        if (window.appState.get().settings.screenReaderAnnounce) {
          window.voiceEngine.announceLive(`Navigated to ${heading.textContent}`);
        }
      }

      window.voiceEngine.audio.playEarcon('nav');
    }

    // Update state
    window.appState.set({ activeView: targetView, dashboardSection: sectionName });
    this.onViewActivated(targetView, sectionName);
  }

  showDashboardSection(sectionName) {
    const validSections = [
      'overview', 'profile', 'assistant', 'explore', 
      'transport', 'services', 'communication', 'calendar', 'emergency', 
      'community', 'settings', 'help'
    ];
    const targetSec = validSections.includes(sectionName) ? sectionName : 'overview';

    // Hide all dashboard sections
    document.querySelectorAll('.dashboard-section-view').forEach(s => s.classList.remove('active'));

    // Show target section
    const targetEl = document.getElementById(`dash-sec-${targetSec}`);
    if (targetEl) {
      targetEl.classList.add('active');
      this.currentSection = targetSec;
    }

    // Highlight sidebar active item
    document.querySelectorAll('.nav-item').forEach(item => {
      const match = item.getAttribute('data-section') === targetSec;
      item.classList.toggle('active', match);
      item.setAttribute('aria-current', match ? 'page' : 'false');
    });

    // Subview specific initializations
    if (targetSec === 'communication') {
      window.features.renderAACGrid('aac-grid-container', 'all');
    } else if (targetSec === 'calendar') {
      if (window.features.renderCalendar) {
        window.features.renderCalendar();
      }
    }
  }

  onViewActivated(viewName, sectionName) {
    if (viewName === 'language') {
      this.renderLanguageSelection();
    } else if (viewName === 'accessibility') {
      this.renderAccessibilitySelection();
    } else if (viewName === 'dashboard') {
      this.updateDashboardOverview();
    }
  }

  // ==========================================================================
  // RENDER LANGUAGE SELECTION
  // ==========================================================================
  renderLanguageSelection() {
    const grid = document.getElementById('languages-grid-container');
    if (!grid) return;

    const languages = [
      { code: 'en', name: 'English', native: 'English' },
      { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
      { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
      { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
      { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
      { code: 'te', name: 'Telugu', native: 'తెలుగు' },
      { code: 'bn', name: 'Bengali', native: 'বাংলা' },
      { code: 'mr', name: 'Marathi', native: 'मराठी' },
      { code: 'ur', name: 'Urdu', native: 'اردو' },
      { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
      { code: 'other', name: 'Other Languages', native: 'Other / International' }
    ];

    const currentLang = window.appState.get().language;

    grid.innerHTML = languages.map(lang => {
      const isSelected = lang.code === currentLang;
      return `
        <button class="language-card ${isSelected ? 'selected' : ''}" 
          data-lang-code="${lang.code}" 
          data-lang-name="${lang.name}"
          aria-label="${lang.name} (${lang.native}) ${isSelected ? 'Selected' : ''}">
          <div>
            <div class="language-card-native">${lang.native}</div>
            <div class="language-card-english">${lang.name}</div>
          </div>
          <span class="language-check-indicator" aria-hidden="true">✓</span>
        </button>
      `;
    }).join('');

    grid.querySelectorAll('.language-card').forEach(btn => {
      btn.addEventListener('click', () => {
        const code = btn.getAttribute('data-lang-code');
        const name = btn.getAttribute('data-lang-name');
        if (code === 'other') {
          alert('Custom language selector: All major Indian & International screen readers and accents are supported.');
          return;
        }
        window.appState.setLanguage(code);
        this.renderLanguageSelection();
        window.voiceEngine.audio.playEarcon('click');
        window.voiceEngine.speak(`Language set to ${name}`);
      });
    });

    // Language Search Filter
    const searchInput = document.getElementById('language-search-input');
    if (searchInput) {
      searchInput.oninput = (e) => {
        const q = e.target.value.toLowerCase().trim();
        grid.querySelectorAll('.language-card').forEach(card => {
          const text = card.textContent.toLowerCase();
          card.style.display = text.includes(q) ? 'flex' : 'none';
        });
      };
    }
  }

  // ==========================================================================
  // RENDER ACCESSIBILITY SELECTION
  // ==========================================================================
  renderAccessibilitySelection() {
    const grid = document.getElementById('accessibility-cards-container');
    if (!grid) return;

    const categories = [
      {
        id: 'blind',
        titleKey: 'catBlind',
        descKey: 'catBlindDesc',
        icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`
      },
      {
        id: 'deaf',
        titleKey: 'catDeaf',
        descKey: 'catDeafDesc',
        icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 6-6 10"/><path d="M14 8.5a2.5 2.5 0 0 0-5 0c0 3 3 3 3 5.5"/><line x1="3" y1="3" x2="21" y2="21"/></svg>`
      },
      {
        id: 'physical',
        titleKey: 'catPhysical',
        descKey: 'catPhysicalDesc',
        icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="4" r="2"/><path d="m18 19 1-7-6 1"/><path d="m5 8 3-3 5.5 3-2.36 3.5"/><path d="M4.24 14.5a5 5 0 0 0 6.88 6"/><path d="M13.76 17.5a5 5 0 0 0-6.88-6"/></svg>`
      },
      {
        id: 'speech',
        titleKey: 'catSpeech',
        descKey: 'catSpeechDesc',
        icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/></svg>`
      },
      {
        id: 'cognitive',
        titleKey: 'catCognitive',
        descKey: 'catCognitiveDesc',
        icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4"/><path d="m4.93 4.93 2.83 2.83"/><path d="M2 12h4"/><path d="m4.93 19.07 2.83-2.83"/><path d="M12 18v4"/><path d="m19.07 19.07-2.83-2.83"/><path d="M20 12h2"/><path d="m19.07 4.93-2.83 2.83"/><circle cx="12" cy="12" r="4"/></svg>`
      },
      {
        id: 'other',
        titleKey: 'catOther',
        descKey: 'catOtherDesc',
        icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
      }
    ];

    const currentAccess = window.appState.get().accessibility;

    grid.innerHTML = categories.map(cat => {
      const isSelected = currentAccess.includes(cat.id);
      const title = window.appState.t(cat.titleKey);
      const desc = window.appState.t(cat.descKey);
      return `
        <div class="accessibility-card ${isSelected ? 'selected' : ''}" 
          data-category-id="${cat.id}"
          role="checkbox"
          aria-checked="${isSelected}"
          tabindex="0"
          aria-label="${title}. ${desc}. ${isSelected ? 'Selected' : 'Not selected'}">
          <div class="card-icon-bubble" aria-hidden="true">${cat.icon}</div>
          <div class="multi-check-badge" aria-hidden="true">${isSelected ? '✓' : ''}</div>
          <h3>${title}</h3>
          <p>${desc}</p>
        </div>
      `;
    }).join('');

    const toggleCard = (card) => {
      const id = card.getAttribute('data-category-id');
      window.appState.toggleAccessibility(id);
      this.renderAccessibilitySelection();
      window.voiceEngine.audio.playEarcon('click');
      const hasNow = window.appState.hasAccessibility(id);
      window.voiceEngine.announceLive(`${card.querySelector('h3').textContent} is now ${hasNow ? 'selected' : 'deselected'}`);
    };

    grid.querySelectorAll('.accessibility-card').forEach(card => {
      card.addEventListener('click', () => toggleCard(card));
      card.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          toggleCard(card);
        }
      });
    });
  }

  // ==========================================================================
  // UPDATE DASHBOARD OVERVIEW & TAILORED RECOMMENDATIONS
  // ==========================================================================
  updateDashboardOverview() {
    const user = window.appState.get().user;
    const access = window.appState.get().accessibility;

    // Update greeting
    const greetingEl = document.getElementById('dash-welcome-user-name');
    if (greetingEl) {
      greetingEl.textContent = user.name;
    }

    // Update adapted tags
    const tagsContainer = document.getElementById('dash-adapted-tags-container');
    if (tagsContainer) {
      if (access.length === 0) {
        tagsContainer.innerHTML = '<span class="disability-badge">Universal Balanced Mode (All Tools Active)</span>';
      } else {
        const labels = {
          'blind': '👁️ Blind / Low Vision Optimized',
          'deaf': '🧏 Deaf / Hard of Hearing with Live Captions',
          'physical': '♿ Mobility & Large Touch Controls',
          'speech': '💬 AAC Non-Verbal Speech Pad',
          'cognitive': '🧠 Easy-Read & Visual Guides',
          'other': '⭐ Individualized Assistive Mode'
        };
        tagsContainer.innerHTML = access.map(id => `<span class="disability-badge">${labels[id] || id}</span>`).join('');
      }
    }

    // Tailored Recommendations
    const recContainer = document.getElementById('dash-recommended-container');
    if (recContainer) {
      const recs = [];
      if (access.includes('blind') || access.length === 0) {
        recs.push({
          title: 'Tactile Navigation Guide for Metro Station',
          desc: 'Audio walking map with step-by-step beacon cues and elevator wayfinding.',
          action: 'Open Route',
          link: () => window.appState.navigate('dashboard', 'explore')
        });
      }
      if (access.includes('deaf') || access.length === 0) {
        recs.push({
          title: 'On-Demand Sign Language Video Interpreter',
          desc: 'Instant video relay interpreter available for hospital visits and official counters.',
          action: 'Connect Interpreter',
          link: () => window.appState.navigate('dashboard', 'services')
        });
      }
      if (access.includes('physical') || access.length === 0) {
        recs.push({
          title: 'Book Wheelchair-Accessible Ramp Van',
          desc: 'Hydraulic lift vehicle with low-incline boarding and secure tie-downs.',
          action: 'Book Transit',
          link: () => window.appState.navigate('dashboard', 'transport')
        });
      }
      if (access.includes('speech') || access.length === 0) {
        recs.push({
          title: 'Quick Emergency AAC Soundboard Tiles',
          desc: 'Instant one-tap spoken phrases to communicate with medical staff or drivers.',
          action: 'Open AAC Soundboard',
          link: () => window.appState.navigate('dashboard', 'communication')
        });
      }

      recContainer.innerHTML = recs.map(r => `
        <div class="card">
          <h4 style="margin-bottom: 8px;">${r.title}</h4>
          <p style="margin-bottom: 16px; font-size: 0.95rem;">${r.desc}</p>
          <button class="btn btn-secondary btn-action-rec" style="width: 100%;">
            ${r.action}
          </button>
        </div>
      `).join('');

      recContainer.querySelectorAll('.btn-action-rec').forEach((btn, idx) => {
        btn.addEventListener('click', recs[idx].link);
      });
    }
  }
}

// Global View Manager
window.viewManager = new ViewManager();

