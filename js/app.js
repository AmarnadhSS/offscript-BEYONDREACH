/**
 * BEYOND REACH - Main Application Orchestrator
 * Binds global shortcuts, event listeners, form submissions, and UI state sync.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Apply initial DOM state
  window.appState.applyDOMState();

  // Route according to URL hash
  window.viewManager.routeFromHash();

  // Initialize event bindings
  bindGlobalShortcuts();
  bindHeaderControls();
  bindWelcomeScreen();
  bindLanguageScreen();
  bindAccessibilityScreen();
  bindAuthScreen();
  bindDashboardSidebar();
  bindDashboardTools();
  bindSettingsScreen();
  bindFloatingAssistant();

  // Subscribe to state changes for DOM updates
  window.appState.subscribe((state) => {
    // Update active badges or indicator lights
  });
});

// ==========================================================================
// 1. GLOBAL KEYBOARD SHORTCUTS
// ==========================================================================
function bindGlobalShortcuts() {
  window.addEventListener('keydown', (e) => {
    // Ignore shortcuts when user is typing inside an input or textarea (unless Escape)
    const isInput = ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName);

    if (e.key === 'Escape') {
      // Close open modals
      document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
      // Stop speech or siren
      window.voiceEngine.stopSpeaking();
      window.voiceEngine.stopListening();
      if (window.features.isAlertActive) {
        window.features.cancelSOS();
      }
      return;
    }

    if (isInput) return;

    if (e.altKey && (e.key === 'v' || e.key === 'V')) {
      e.preventDefault();
      window.voiceEngine.toggleListening();
    } else if (e.altKey && (e.key === 's' || e.key === 'S')) {
      e.preventDefault();
      window.appState.navigate('dashboard', 'emergency');
      window.features.triggerSOS();
    } else if (e.altKey && (e.key === 'r' || e.key === 'R')) {
      e.preventDefault();
      window.voiceEngine.readActivePage();
    } else if (e.altKey && (e.key === 'm' || e.key === 'M')) {
      e.preventDefault();
      const firstNav = document.querySelector('.nav-item');
      if (firstNav) firstNav.focus();
    } else if (e.altKey && (e.key === 'c' || e.key === 'C')) {
      e.preventDefault();
      cycleTheme();
    }
  });
}

function cycleTheme() {
  const current = window.appState.get().settings.theme;
  const sequence = ['dark', 'contrast-yellow', 'contrast-white', 'soft-dark'];
  const nextIdx = (sequence.indexOf(current) + 1) % sequence.length;
  const nextTheme = sequence[nextIdx];
  window.appState.updateSettings({ theme: nextTheme });
  window.voiceEngine.speak(`Theme set to ${nextTheme.replace('-', ' ')}`);
}

// ==========================================================================
// 2. HEADER CONTROLS
// ==========================================================================
function bindHeaderControls() {
  // Brand logo click
  document.querySelectorAll('.header-brand').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      window.appState.navigate('welcome');
    });
  });

  // Font size decrease (A-)
  const btnFontDec = document.getElementById('btn-font-decrease');
  if (btnFontDec) {
    btnFontDec.addEventListener('click', () => {
      const cur = window.appState.get().settings.textSize;
      const next = Math.max(100, cur - 15);
      window.appState.updateSettings({ textSize: next });
      window.voiceEngine.audio.playEarcon('click');
      window.voiceEngine.announceLive(`Text scale ${next}%`);
    });
  }

  // Font size increase (A+)
  const btnFontInc = document.getElementById('btn-font-increase');
  if (btnFontInc) {
    btnFontInc.addEventListener('click', () => {
      const cur = window.appState.get().settings.textSize;
      const next = Math.min(200, cur + 15);
      window.appState.updateSettings({ textSize: next });
      window.voiceEngine.audio.playEarcon('click');
      window.voiceEngine.announceLive(`Text scale ${next}%`);
    });
  }

  // Theme switch button
  const btnTheme = document.getElementById('btn-theme-toggle');
  if (btnTheme) {
    btnTheme.addEventListener('click', () => {
      cycleTheme();
    });
  }

  // Read screen button
  const btnTTS = document.getElementById('btn-screen-reader');
  if (btnTTS) {
    btnTTS.addEventListener('click', () => {
      window.voiceEngine.readActivePage();
    });
  }

  // Header Voice Assistant mic
  const btnHeaderMic = document.getElementById('btn-header-mic');
  if (btnHeaderMic) {
    btnHeaderMic.addEventListener('click', () => {
      window.voiceEngine.toggleListening();
    });
  }

  // Header Global Search input
  const headerSearchInput = document.getElementById('header-global-search');
  if (headerSearchInput) {
    headerSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const query = e.target.value.trim();
        const results = window.features.search(query);
        if (results.length > 0) {
          const first = results[0];
          window.appState.navigate(first.view, first.section);
          window.voiceEngine.speak(`Navigating to ${first.title}`);
        } else {
          window.voiceEngine.speak(`No direct match found for ${query}. Try searching places, services, or transport.`);
        }
      }
    });
  }

  // Notifications modal button
  const btnNotifications = document.getElementById('btn-notifications');
  if (btnNotifications) {
    btnNotifications.addEventListener('click', () => {
      openModal('modal-notifications');
      window.voiceEngine.audio.playEarcon('click');
    });
  }
}

// ==========================================================================
// 3. PAGE 1: WELCOME SCREEN
// ==========================================================================
function bindWelcomeScreen() {
  // Get Started button
  const btnGetStarted = document.getElementById('btn-welcome-get-started');
  if (btnGetStarted) {
    btnGetStarted.addEventListener('click', () => {
      window.appState.navigate('language');
    });
  }

  // Voice command button
  const btnWelcomeVoice = document.getElementById('btn-welcome-voice');
  if (btnWelcomeVoice) {
    btnWelcomeVoice.addEventListener('click', () => {
      window.voiceEngine.toggleListening();
    });
  }

  // Welcome listen greeting
  const btnListenWelcome = document.getElementById('btn-welcome-listen');
  if (btnListenWelcome) {
    btnListenWelcome.addEventListener('click', () => {
      const heading = window.appState.t('welcomeTitle');
      const intro = window.appState.t('welcomeIntro');
      const tagline = window.appState.t('tagline');
      window.voiceEngine.speak(`${heading}. ${tagline}. ${intro}`);
    });
  }

  // Text Command Input
  const welcomeCommandForm = document.getElementById('welcome-command-form');
  const welcomeCommandInput = document.getElementById('welcome-command-input');
  if (welcomeCommandForm && welcomeCommandInput) {
    welcomeCommandForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const cmd = welcomeCommandInput.value.trim();
      if (cmd) {
        window.voiceEngine.handleCommand(cmd);
        welcomeCommandInput.value = '';
      }
    });
  }

  // Command chips
  document.querySelectorAll('.command-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const cmd = chip.getAttribute('data-cmd');
      window.voiceEngine.handleCommand(cmd);
    });
  });

  // Sync listening UI state
  window.voiceEngine.onListeningChange = (listening) => {
    document.querySelectorAll('.mic-pulse-btn, .floating-assistant-btn, #btn-header-mic').forEach(btn => {
      btn.classList.toggle('listening', listening);
      btn.setAttribute('aria-pressed', listening ? 'true' : 'false');
    });
    document.body.classList.toggle('listening', listening);
  };

  // Sync speech active state for visualizer waveform animation
  window.voiceEngine.onSpeechStateChange = (speaking) => {
    document.body.classList.toggle('audio-active', speaking);
  };
}

// ==========================================================================
// 4. PAGE 2: LANGUAGE SELECTION
// ==========================================================================
function bindLanguageScreen() {
  const btnContinue = document.getElementById('btn-language-continue');
  if (btnContinue) {
    btnContinue.addEventListener('click', () => {
      window.appState.navigate('accessibility');
    });
  }

  const btnBack = document.getElementById('btn-language-back');
  if (btnBack) {
    btnBack.addEventListener('click', () => {
      window.appState.navigate('welcome');
    });
  }

  const btnHearInstructions = document.getElementById('btn-language-hear-instructions');
  if (btnHearInstructions) {
    btnHearInstructions.addEventListener('click', () => {
      const prompt = window.appState.t('langInstructionsAudio');
      window.voiceEngine.speak(prompt);
    });
  }

  const btnSpeakLanguage = document.getElementById('btn-language-voice-select');
  if (btnSpeakLanguage) {
    btnSpeakLanguage.addEventListener('click', () => {
      window.voiceEngine.startListening();
      window.voiceEngine.speak('Please speak the language name now, for example: Malayalam, Hindi, or English.');
    });
  }
}

// ==========================================================================
// 5. PAGE 3: ACCESSIBILITY SELECTION
// ==========================================================================
function bindAccessibilityScreen() {
  const btnContinue = document.getElementById('btn-accessibility-continue');
  if (btnContinue) {
    btnContinue.addEventListener('click', () => {
      window.appState.navigate('auth');
    });
  }

  const btnSkip = document.getElementById('btn-accessibility-skip');
  if (btnSkip) {
    btnSkip.addEventListener('click', () => {
      window.appState.setAccessibility([]); // Universal balanced mode
      window.appState.navigate('auth');
      window.voiceEngine.speak('Accessibility profile skipped. Universal balanced mode active.');
    });
  }

  const btnBack = document.getElementById('btn-accessibility-back');
  if (btnBack) {
    btnBack.addEventListener('click', () => {
      window.appState.navigate('language');
    });
  }
}

// ==========================================================================
// 6. PAGE 4: AUTHENTICATION
// ==========================================================================
function bindAuthScreen() {
  // Tabs
  const tabLogin = document.getElementById('auth-tab-login');
  const tabRegister = document.getElementById('auth-tab-register');
  const formLogin = document.getElementById('form-login');
  const formRegister = document.getElementById('form-register');

  if (tabLogin && tabRegister) {
    tabLogin.addEventListener('click', () => {
      tabLogin.classList.add('active');
      tabRegister.classList.remove('active');
      formLogin.style.display = 'block';
      formRegister.style.display = 'none';
      window.voiceEngine.audio.playEarcon('click');
    });

    tabRegister.addEventListener('click', () => {
      tabRegister.classList.add('active');
      tabLogin.classList.remove('active');
      formLogin.style.display = 'none';
      formRegister.style.display = 'block';
      window.voiceEngine.audio.playEarcon('click');
    });
  }

  // Password Show/Hide Toggles
  document.querySelectorAll('.btn-toggle-password').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (input) {
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        btn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
        btn.innerHTML = isPassword ? '👁️' : '🔒';
      }
    });
  });

  // Login Submission
  if (formLogin) {
    formLogin.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      window.appState.updateUser({
        isLoggedIn: true,
        email: email || 'alex.morgan@example.com'
      });
      window.voiceEngine.audio.playEarcon('success');
      window.voiceEngine.speak(`Signed in successfully as ${window.appState.get().user.name}. Opening Dashboard.`);
      window.appState.navigate('dashboard', 'overview');
    });
  }

  // Register Submission
  if (formRegister) {
    formRegister.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('reg-name').value;
      const email = document.getElementById('reg-email').value;
      const phone = document.getElementById('reg-phone').value;
      window.appState.updateUser({
        isLoggedIn: true,
        name: name || 'Valued User',
        email: email,
        phone: phone
      });
      window.voiceEngine.audio.playEarcon('success');
      window.voiceEngine.speak(`Account created for ${name}. Opening Dashboard.`);
      window.appState.navigate('dashboard', 'overview');
    });
  }

  // Google Auth Button Simulation
  const btnGoogleAuth = document.getElementById('btn-google-auth');
  if (btnGoogleAuth) {
    btnGoogleAuth.addEventListener('click', () => {
      openModal('modal-google-auth');
      window.voiceEngine.audio.playEarcon('click');
    });
  }

  // Forgot Password
  const btnForgot = document.getElementById('btn-forgot-password');
  if (btnForgot) {
    btnForgot.addEventListener('click', (e) => {
      e.preventDefault();
      openModal('modal-forgot-password');
    });
  }

  // Demo Profile Quick-Fill Buttons
  document.querySelectorAll('.demo-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const profile = pill.getAttribute('data-profile');
      if (profile === 'blind') {
        window.appState.setAccessibility(['blind']);
        window.appState.updateUser({ name: 'Alex Morgan', isLoggedIn: true });
      } else if (profile === 'deaf') {
        window.appState.setAccessibility(['deaf']);
        window.appState.updateUser({ name: 'Jordan Chen', isLoggedIn: true });
      } else if (profile === 'physical') {
        window.appState.setAccessibility(['physical']);
        window.appState.updateUser({ name: 'Taylor Scott', isLoggedIn: true });
      } else if (profile === 'speech') {
        window.appState.setAccessibility(['speech']);
        window.appState.updateUser({ name: 'Morgan Lee', isLoggedIn: true });
      } else if (profile === 'cognitive') {
        window.appState.setAccessibility(['cognitive']);
        window.appState.updateUser({ name: 'Sam Rivera', isLoggedIn: true });
      }
      window.voiceEngine.audio.playEarcon('success');
      window.appState.navigate('dashboard', 'overview');
    });
  });
}

// ==========================================================================
// 7. PAGE 5: DASHBOARD SIDEBAR & ROUTING
// ==========================================================================
function bindDashboardSidebar() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const section = item.getAttribute('data-section');
      if (section === 'logout') {
        window.appState.updateUser({ isLoggedIn: false });
        window.appState.navigate('welcome');
        window.voiceEngine.speak('Logged out. Returning to Welcome screen.');
        return;
      }
      window.appState.navigate('dashboard', section);
      window.viewManager.showDashboardSection(section);
      window.voiceEngine.audio.playEarcon('nav');
    });
  });
}

// ==========================================================================
// 8. DASHBOARD INTERACTIVE TOOLS
// ==========================================================================
function bindDashboardTools() {
  // AAC Soundboard category filters
  document.querySelectorAll('.aac-cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.aac-cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.getAttribute('data-category');
      window.features.renderAACGrid('aac-grid-container', cat);
    });
  });

  // AAC Speak Sentence
  const btnAacSpeak = document.getElementById('btn-aac-speak-sentence');
  if (btnAacSpeak) {
    btnAacSpeak.addEventListener('click', () => {
      window.features.speakSentence();
    });
  }

  // AAC Clear Sentence
  const btnAacClear = document.getElementById('btn-aac-clear-sentence');
  if (btnAacClear) {
    btnAacClear.addEventListener('click', () => {
      window.features.clearSentence();
    });
  }

  // Live Transcriber Toggle Button
  const btnToggleTranscribe = document.getElementById('btn-toggle-transcriber');
  const transcribeOutput = document.getElementById('transcribe-live-output');
  if (btnToggleTranscribe) {
    btnToggleTranscribe.addEventListener('click', () => {
      window.features.toggleLiveTranscriber(btnToggleTranscribe, transcribeOutput);
    });
  }

  // Emergency SOS Main Button
  const btnSOS = document.getElementById('sos-main-button');
  if (btnSOS) {
    btnSOS.addEventListener('click', () => {
      window.features.triggerSOS();
    });
  }

  // Assistant Question Form
  const assistantForm = document.getElementById('assistant-chat-form');
  const assistantInput = document.getElementById('assistant-input-text');
  if (assistantForm && assistantInput) {
    assistantForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = assistantInput.value.trim();
      if (q) {
        window.features.askAssistant(q);
        assistantInput.value = '';
      }
    });
  }

  // Assistant Quick Prompt Chips
  document.querySelectorAll('.assistant-prompt-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const q = chip.textContent.trim();
      window.features.askAssistant(q);
    });
  });

  // Places Explorer Filters
  document.querySelectorAll('.place-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.place-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.getAttribute('data-filter');
      document.querySelectorAll('.place-card').forEach(card => {
        if (filter === 'all' || card.getAttribute('data-category') === filter) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // Transit Booking Simulation
  const formTransit = document.getElementById('form-transit-booking');
  if (formTransit) {
    formTransit.addEventListener('submit', (e) => {
      e.preventDefault();
      const statusBox = document.getElementById('transit-booking-status');
      if (statusBox) {
        statusBox.style.display = 'block';
        statusBox.innerHTML = `
          <div style="background: rgba(16, 185, 129, 0.15); border: 1px solid #10b981; padding: 18px; border-radius: 8px;">
            <h4 style="color: #10b981;">✓ Accessible Vehicle Dispatched!</h4>
            <p>Vehicle: <strong>Wheelchair Ramp Van (Vehicle #TX-482)</strong></p>
            <p>Driver: <strong>Carlos Santana (Certified Accessibility Specialist)</strong></p>
            <p>Arrival: <strong>Estimated 6 minutes</strong></p>
          </div>
        `;
      }
      window.voiceEngine.audio.playEarcon('success');
      window.voiceEngine.speak('Accessible vehicle booked. Wheelchair ramp van arriving in 6 minutes.');
    });
  }

  // Add Calendar Event Form Submission
  const formAddEvent = document.getElementById('form-add-calendar-event');
  if (formAddEvent) {
    formAddEvent.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('event-input-title').value.trim();
      const date = document.getElementById('event-input-date').value;
      const time = document.getElementById('event-input-time').value.trim();
      const categorySelect = document.getElementById('event-input-category');
      const selectedOption = categorySelect.options[categorySelect.selectedIndex];
      const category = selectedOption.value;
      const icon = selectedOption.getAttribute('data-icon') || '📅';
      const categoryLabel = selectedOption.getAttribute('data-label') || 'Appointment';
      const accommodations = document.getElementById('event-input-accommodations').value.trim();

      if (title && date && time) {
        window.features.addCalendarEvent({
          title,
          date,
          time,
          category,
          categoryLabel,
          icon,
          accommodations
        });
        window.closeModal('modal-add-event');
        formAddEvent.reset();
      }
    });
  }
}

// ==========================================================================
// 9. SETTINGS SCREEN CONTROLS
// ==========================================================================
function bindSettingsScreen() {
  const sliderText = document.getElementById('settings-slider-text');
  const sliderTextVal = document.getElementById('settings-text-val');
  if (sliderText && sliderTextVal) {
    sliderText.value = window.appState.get().settings.textSize;
    sliderTextVal.textContent = `${sliderText.value}%`;
    sliderText.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      sliderTextVal.textContent = `${val}%`;
      window.appState.updateSettings({ textSize: val });
    });
  }

  // Voice Rate & Pitch
  const sliderRate = document.getElementById('settings-slider-rate');
  const sliderPitch = document.getElementById('settings-slider-pitch');
  if (sliderRate) {
    sliderRate.addEventListener('input', (e) => {
      window.appState.updateSettings({ voiceSpeed: parseFloat(e.target.value) });
    });
  }
  if (sliderPitch) {
    sliderPitch.addEventListener('input', (e) => {
      window.appState.updateSettings({ voicePitch: parseFloat(e.target.value) });
    });
  }

  const btnTestVoice = document.getElementById('btn-test-voice');
  if (btnTestVoice) {
    btnTestVoice.addEventListener('click', () => {
      window.voiceEngine.speak('This is a test of your BEYOND REACH personalized voice assistant.');
    });
  }

  // Toggles
  bindCheckboxToggle('toggle-easy-read', 'easyRead');
  bindCheckboxToggle('toggle-dyslexic-font', 'dyslexicFont');
  bindCheckboxToggle('toggle-reading-ruler', 'readingRuler');
  bindCheckboxToggle('toggle-giant-buttons', 'giantButtons');
  bindCheckboxToggle('toggle-sound-effects', 'soundEffects');
}

function bindCheckboxToggle(elementId, stateKey) {
  const checkbox = document.getElementById(elementId);
  if (checkbox) {
    checkbox.checked = !!window.appState.get().settings[stateKey];
    checkbox.addEventListener('change', (e) => {
      window.appState.updateSettings({ [stateKey]: e.target.checked });
      window.voiceEngine.audio.playEarcon('click');
    });
  }
}

// ==========================================================================
// 10. FLOATING ASSISTANT
// ==========================================================================
function bindFloatingAssistant() {
  const btnFloating = document.getElementById('floating-assistant-btn');
  if (btnFloating) {
    btnFloating.addEventListener('click', () => {
      window.voiceEngine.toggleListening();
    });
  }
}

// Modal helper
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('open');
    const closeBtn = modal.querySelector('.modal-close-btn');
    if (closeBtn) closeBtn.focus();
  }
}

window.openModal = openModal;

window.closeModal = function(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('open');
  }
};

