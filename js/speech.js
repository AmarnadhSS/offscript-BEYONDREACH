/**
 * BEYOND REACH - Audio, Speech Synthesis & Voice Recognition Engine
 * High-accuracy intent recognition, live transcript banner, Web Speech API & earcons.
 */

class AudioEngine {
  constructor() {
    this.audioCtx = null;
    this.sirenOscillator = null;
    this.sirenGain = null;
    this.sirenInterval = null;
  }

  initContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playEarcon(type) {
    if (!window.appState || !window.appState.get().settings.soundEffects) return;
    try {
      this.initContext();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      if (type === 'click') {
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(380, now + 0.04);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (type === 'nav') {
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'success') {
        // High-tech pleasant mint chime
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.07); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.14); // G5
        osc.frequency.setValueAtTime(1046.50, now + 0.21); // C6
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
        osc.start(now);
        osc.stop(now + 0.32);
      } else if (type === 'listenStart') {
        // Microphone opened chirp
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'alert') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.setValueAtTime(320, now + 0.12);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch (e) {
      console.warn('Earcon audio failure', e);
    }
  }

  startSiren() {
    try {
      this.initContext();
      if (!this.audioCtx) return;
      this.stopSiren();

      this.sirenOscillator = this.audioCtx.createOscillator();
      this.sirenGain = this.audioCtx.createGain();
      this.sirenOscillator.type = 'sawtooth';

      this.sirenGain.gain.setValueAtTime(0.25, this.audioCtx.currentTime);
      this.sirenOscillator.connect(this.sirenGain);
      this.sirenGain.connect(this.audioCtx.destination);
      this.sirenOscillator.start();

      let rising = true;
      this.sirenInterval = setInterval(() => {
        if (!this.audioCtx || !this.sirenOscillator) return;
        const now = this.audioCtx.currentTime;
        const targetFreq = rising ? 880 : 440;
        this.sirenOscillator.frequency.cancelScheduledValues(now);
        this.sirenOscillator.frequency.linearRampToValueAtTime(targetFreq, now + 0.4);
        rising = !rising;
      }, 450);
    } catch (e) {
      console.warn('Siren audio error', e);
    }
  }

  stopSiren() {
    if (this.sirenInterval) {
      clearInterval(this.sirenInterval);
      this.sirenInterval = null;
    }
    if (this.sirenOscillator) {
      try {
        this.sirenOscillator.stop();
        this.sirenOscillator.disconnect();
      } catch (e) {}
      this.sirenOscillator = null;
    }
  }
}

class VoiceEngine {
  constructor() {
    this.synth = window.speechSynthesis || null;
    this.recognition = null;
    this.isListening = false;
    this.audio = new AudioEngine();
    this.onListeningChange = null;
    this.onTranscript = null;
    this.onSpeechStateChange = null;
    this.initRecognition();
  }

  initRecognition() {
    const SpeechRecClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecClass) {
      try {
        this.recognition = new SpeechRecClass();
        this.recognition.continuous = false;
        this.recognition.interimResults = true; // Provides instant accuracy feedback
        this.recognition.maxAlternatives = 3;

        this.recognition.onstart = () => {
          this.isListening = true;
          this.audio.playEarcon('listenStart');
          this.showTranscriptBanner('🎙️ Listening... Speak your command clearly.');
          if (this.onListeningChange) this.onListeningChange(true);
          this.announceLive('Listening. Speak your command now.');
        };

        this.recognition.onresult = (event) => {
          let interim = '';
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interim += event.results[i][0].transcript;
            }
          }

          const currentWords = finalTranscript || interim;
          if (currentWords) {
            this.showTranscriptBanner(`🎙️ Heard: "${currentWords}"`);
          }

          if (finalTranscript) {
            console.log('Voice recognized final:', finalTranscript);
            if (this.onTranscript) this.onTranscript(finalTranscript);
            this.handleCommand(finalTranscript);
          }
        };

        this.recognition.onerror = (event) => {
          console.warn('Speech recognition error:', event.error);
          this.isListening = false;
          if (this.onListeningChange) this.onListeningChange(false);
          this.hideTranscriptBanner();

          if (event.error === 'not-allowed') {
            this.speak('Microphone access was denied. Please allow microphone permissions in your browser or type your command.');
          } else if (event.error === 'no-speech') {
            this.announceLive('No speech was detected. Please try again or type your command.');
          }
        };

        this.recognition.onend = () => {
          this.isListening = false;
          if (this.onListeningChange) this.onListeningChange(false);
          setTimeout(() => this.hideTranscriptBanner(), 3000);
        };
      } catch (e) {
        console.warn('Could not initialize SpeechRecognition', e);
      }
    }
  }

  showTranscriptBanner(text) {
    let banner = document.getElementById('voice-transcript-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'voice-transcript-banner';
      banner.setAttribute('role', 'status');
      banner.setAttribute('aria-live', 'polite');
      document.body.appendChild(banner);
    }
    banner.textContent = text;
    banner.classList.add('visible');
  }

  hideTranscriptBanner() {
    const banner = document.getElementById('voice-transcript-banner');
    if (banner) {
      banner.classList.remove('visible');
    }
  }

  startListening() {
    if (!this.recognition) {
      this.fallbackPrompt();
      return;
    }
    try {
      const state = window.appState.get();
      const langConfig = window.TRANSLATIONS[state.language];
      this.recognition.lang = (langConfig && langConfig.code) || 'en-US';
      this.recognition.start();
    } catch (e) {
      console.warn('Recognition start error', e);
      this.fallbackPrompt();
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      try { this.recognition.stop(); } catch (e) {}
    }
    this.isListening = false;
    this.hideTranscriptBanner();
    if (this.onListeningChange) this.onListeningChange(false);
  }

  toggleListening() {
    if (this.isListening) {
      this.stopListening();
    } else {
      this.startListening();
    }
  }

  fallbackPrompt() {
    this.announceLive('Voice recognition is unavailable in this browser. Please use the text command input.');
    const input = document.getElementById('welcome-command-input') || document.getElementById('global-command-input');
    if (input) {
      input.focus();
    }
  }

  speak(text, customLang = null) {
    if (!this.synth) return;
    this.synth.cancel();

    const state = window.appState.get();
    const utterance = new SpeechSynthesisUtterance(text);
    const langKey = customLang || state.language || 'en';
    const langConfig = window.TRANSLATIONS[langKey] || window.TRANSLATIONS.en;
    
    utterance.lang = (langConfig && langConfig.code) || 'en-US';
    utterance.rate = state.settings.voiceSpeed || 1.0;
    utterance.pitch = state.settings.voicePitch || 1.0;

    utterance.onstart = () => {
      if (this.onSpeechStateChange) this.onSpeechStateChange(true, text);
    };

    utterance.onend = () => {
      if (this.onSpeechStateChange) this.onSpeechStateChange(false, '');
    };

    utterance.onerror = () => {
      if (this.onSpeechStateChange) this.onSpeechStateChange(false, '');
    };

    this.synth.speak(utterance);
  }

  stopSpeaking() {
    if (this.synth) {
      this.synth.cancel();
      if (this.onSpeechStateChange) this.onSpeechStateChange(false, '');
    }
  }

  announceLive(message, assertive = false) {
    const el = document.getElementById(assertive ? 'aria-live-assertive' : 'aria-live-polite');
    if (el) {
      el.textContent = '';
      setTimeout(() => {
        el.textContent = message;
      }, 50);
    }
  }

  // ==========================================================================
  // HIGH-ACCURACY NATURAL LANGUAGE COMMAND INTERPRETER
  // ==========================================================================
  handleCommand(rawText) {
    const text = rawText.toLowerCase().trim();
    this.showTranscriptBanner(`✓ Executing: "${rawText}"`);

    // 1. Language Switching
    const langMap = [
      { keys: ['english'], code: 'en', name: 'English' },
      { keys: ['malayalam', 'മലയാളം'], code: 'ml', name: 'Malayalam' },
      { keys: ['hindi', 'हिन्दी', 'हिंदी'], code: 'hi', name: 'Hindi' },
      { keys: ['tamil', 'தமிழ்'], code: 'ta', name: 'Tamil' },
      { keys: ['kannada', 'ಕನ್ನಡ'], code: 'kn', name: 'Kannada' },
      { keys: ['telugu', 'తెలుగు'], code: 'te', name: 'Telugu' },
      { keys: ['bengali', 'বাংলা'], code: 'bn', name: 'Bengali' },
      { keys: ['marathi', 'मराठी'], code: 'mr', name: 'Marathi' },
      { keys: ['urdu', 'اردو'], code: 'ur', name: 'Urdu' },
      { keys: ['punjabi', 'ਪੰਜਾਬੀ'], code: 'pa', name: 'Punjabi' }
    ];

    for (const lang of langMap) {
      if (lang.keys.some(k => text.includes(k))) {
        this.audio.playEarcon('success');
        window.appState.setLanguage(lang.code);
        this.speak(`Language set to ${lang.name}`);
        this.announceLive(`Language switched to ${lang.name}`);
        return;
      }
    }

    // 2. Emergency SOS (Highest Priority)
    if (this.matchAny(text, ['emergency', 'sos', 'danger', 'siren', 'alarm', 'help me', 'call help', 'ambulance', 'panic'])) {
      this.audio.playEarcon('alert');
      window.appState.navigate('dashboard', 'emergency');
      window.features.triggerSOS();
      return;
    }

    // 3. Stop / Quiet
    if (this.matchAny(text, ['stop', 'be quiet', 'quiet', 'silence', 'cancel speech', 'shut up', 'pause'])) {
      this.stopSpeaking();
      this.audio.playEarcon('click');
      return;
    }

    // 4. Read Page
    if (this.matchAny(text, ['read page', 'read aloud', 'read screen', 'speak page', 'read content', 'read out'])) {
      this.audio.playEarcon('success');
      this.readActivePage();
      return;
    }

    // 5. Explore Places
    if (this.matchAny(text, ['explore', 'places', 'place', 'venue', 'venues', 'wheelchair ramp', 'ramp', 'hospital', 'library', 'station', 'step free', 'accessible places'])) {
      this.audio.playEarcon('success');
      window.appState.navigate('dashboard', 'explore');
      this.speak('Opening Accessible Places Directory');
      return;
    }

    // 6. Transportation
    if (this.matchAny(text, ['transport', 'transportation', 'transit', 'bus', 'taxi', 'cab', 'ride', 'vehicle', 'book cab', 'van', 'booking'])) {
      this.audio.playEarcon('success');
      window.appState.navigate('dashboard', 'transport');
      this.speak('Opening Accessible Transportation');
      return;
    }

    // 7. Services
    if (this.matchAny(text, ['service', 'services', 'interpreter', 'sign language', 'sign interpreter', 'braille', 'guide', 'mobility guide', 'therapist'])) {
      this.audio.playEarcon('success');
      window.appState.navigate('dashboard', 'services');
      this.speak('Opening Accessible Services Directory');
      return;
    }

    // 8. Communication Tools / AAC
    if (this.matchAny(text, ['communication', 'aac', 'soundboard', 'board', 'phrase', 'speak for me', 'talk', 'pictogram', 'tiles', 'transcribe', 'caption', 'subtitles'])) {
      this.audio.playEarcon('success');
      window.appState.navigate('dashboard', 'communication');
      this.speak('Opening Communication Tools');
      return;
    }

    // 8.5. Accessible Calendar & Schedule
    if (this.matchAny(text, ['calendar', 'schedule', 'appointments', 'appointment', 'my events', 'events', 'agenda', 'reminders', 'book appointment'])) {
      this.audio.playEarcon('success');
      window.appState.navigate('dashboard', 'calendar');
      this.speak('Opening Accessible Calendar and Schedule');
      return;
    }

    // 9. AI Assistant
    if (this.matchAny(text, ['assistant', 'ai', 'ai assistant', 'ask', 'question', 'chatbot'])) {
      this.audio.playEarcon('success');
      window.appState.navigate('dashboard', 'assistant');
      this.speak('Opening Accessibility Assistant');
      return;
    }

    // 10. Dashboard / Home
    if (this.matchAny(text, ['dashboard', 'overview', 'main', 'main menu', 'home page', 'main dashboard'])) {
      this.audio.playEarcon('success');
      window.appState.navigate('dashboard', 'overview');
      this.speak('Opening Dashboard Overview');
      return;
    }

    // 11. Profile
    if (this.matchAny(text, ['profile', 'my profile', 'account', 'user info', 'medical id', 'allergies'])) {
      this.audio.playEarcon('success');
      window.appState.navigate('dashboard', 'profile');
      this.speak('Opening User Profile');
      return;
    }

    // 12. Community
    if (this.matchAny(text, ['community', 'support', 'forum', 'forums', 'buddy', 'peer', 'volunteer', 'discussion'])) {
      this.audio.playEarcon('success');
      window.appState.navigate('dashboard', 'community');
      this.speak('Opening Community Support');
      return;
    }

    // 13. Settings
    if (this.matchAny(text, ['settings', 'setting', 'preferences', 'configuration', 'options'])) {
      this.audio.playEarcon('success');
      window.appState.navigate('dashboard', 'settings');
      this.speak('Opening Accessibility Settings');
      return;
    }

    // 14. Help
    if (this.matchAny(text, ['help', 'shortcut', 'shortcuts', 'keyboard', 'manual', 'guidance', 'how to use'])) {
      this.audio.playEarcon('success');
      window.appState.navigate('dashboard', 'help');
      this.speak('Opening Help and Shortcuts Guide');
      return;
    }

    // 15. Welcome View
    if (this.matchAny(text, ['welcome', 'welcome screen', 'get started'])) {
      this.audio.playEarcon('success');
      window.appState.navigate('welcome');
      this.speak('Navigating to Welcome Screen');
      return;
    }

    // 16. Language View
    if (this.matchAny(text, ['language selection', 'choose language', 'select language'])) {
      this.audio.playEarcon('success');
      window.appState.navigate('language');
      this.speak('Opening Language Selection');
      return;
    }

    // 17. Accessibility Preferences View
    if (this.matchAny(text, ['accessibility preferences', 'abilities', 'disabilities', 'change accessibility'])) {
      this.audio.playEarcon('success');
      window.appState.navigate('accessibility');
      this.speak('Opening Accessibility Selection');
      return;
    }

    // 18. Auth View
    if (this.matchAny(text, ['login', 'sign in', 'register', 'create account', 'log in'])) {
      this.audio.playEarcon('success');
      window.appState.navigate('auth');
      this.speak('Opening Sign In and Registration');
      return;
    }

    // 19. Logout
    if (this.matchAny(text, ['logout', 'log out', 'sign out'])) {
      this.audio.playEarcon('success');
      window.appState.updateUser({ isLoggedIn: false });
      window.appState.navigate('welcome');
      this.speak('Logged out successfully.');
      return;
    }

    // 20. Accessibility Adjustments
    if (this.matchAny(text, ['increase text', 'bigger text', 'larger text', 'zoom in', 'enlarge text', 'make text bigger'])) {
      this.audio.playEarcon('success');
      const current = window.appState.get().settings.textSize;
      const next = Math.min(200, current + 25);
      window.appState.updateSettings({ textSize: next });
      this.speak(`Text size increased to ${next} percent`);
      return;
    }

    if (this.matchAny(text, ['decrease text', 'smaller text', 'zoom out', 'reduce text', 'make text smaller'])) {
      this.audio.playEarcon('success');
      const current = window.appState.get().settings.textSize;
      const next = Math.max(100, current - 25);
      window.appState.updateSettings({ textSize: next });
      this.speak(`Text size decreased to ${next} percent`);
      return;
    }

    if (this.matchAny(text, ['high contrast', 'contrast', 'yellow theme', 'contrast mode'])) {
      this.audio.playEarcon('success');
      const cur = window.appState.get().settings.theme;
      const next = cur === 'dark' ? 'contrast-yellow' : (cur === 'contrast-yellow' ? 'contrast-white' : 'dark');
      window.appState.updateSettings({ theme: next });
      this.speak(`Theme changed to ${next.replace('-', ' ')}`);
      return;
    }

    if (this.matchAny(text, ['easy read', 'plain language', 'simple read', 'simple mode'])) {
      this.audio.playEarcon('success');
      const cur = window.appState.get().settings.easyRead;
      window.appState.updateSettings({ easyRead: !cur });
      this.speak(`Easy read mode ${!cur ? 'enabled' : 'disabled'}`);
      return;
    }

    // General query -> ask assistant
    window.features.askAssistant(rawText);
  }

  matchAny(str, phrases) {
    return phrases.some(p => str.includes(p));
  }

  readActivePage() {
    const activeView = document.querySelector('.view.active');
    if (!activeView) {
      this.speak('No active page content found.');
      return;
    }
    const heading = activeView.querySelector('h1, h2');
    const intro = activeView.querySelector('p, .subtitle, .intro-text');
    let textToRead = '';
    if (heading) textToRead += heading.textContent + '. ';
    if (intro) textToRead += intro.textContent;
    if (!textToRead.trim()) {
      textToRead = activeView.textContent.slice(0, 320);
    }
    this.speak(textToRead);
  }
}

// Global Voice Engine
window.voiceEngine = new VoiceEngine();
