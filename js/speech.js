/**
 * BEYOND REACH - Audio, Speech Synthesis & Voice Recognition Engine
 * Provides Web Speech API voice navigation, TTS read-aloud, earcons, and command interpreter.
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
        osc.frequency.setValueAtTime(480, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.04);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (type === 'nav') {
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.exponentialRampToValueAtTime(700, now + 0.08);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'success') {
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.28);
      } else if (type === 'alert') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.setValueAtTime(300, now + 0.12);
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

      this.sirenGain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
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
        this.recognition.interimResults = false;
        this.recognition.maxAlternatives = 1;

        this.recognition.onstart = () => {
          this.isListening = true;
          this.audio.playEarcon('click');
          if (this.onListeningChange) this.onListeningChange(true);
          this.announceLive('Listening. Speak your command now.');
        };

        this.recognition.onresult = (event) => {
          const result = event.results[0][0].transcript;
          console.log('Voice recognized:', result);
          if (this.onTranscript) this.onTranscript(result);
          this.handleCommand(result);
        };

        this.recognition.onerror = (event) => {
          console.warn('Speech recognition error:', event.error);
          this.isListening = false;
          if (this.onListeningChange) this.onListeningChange(false);
          if (event.error === 'not-allowed') {
            this.speak('Microphone access was denied. Please allow microphone access or type your command instead.');
          } else {
            this.announceLive('Voice recognition unavailable: ' + event.error);
          }
        };

        this.recognition.onend = () => {
          this.isListening = false;
          if (this.onListeningChange) this.onListeningChange(false);
        };
      } catch (e) {
        console.warn('Could not initialize SpeechRecognition', e);
      }
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
      this.recognition.stop();
    }
    this.isListening = false;
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
    this.announceLive('Voice recognition is not supported in this browser or offline. Please use the text command input.');
    const input = document.getElementById('global-command-input');
    if (input) {
      input.focus();
    }
  }

  speak(text, customLang = null) {
    if (!this.synth) return;
    this.synth.cancel(); // cancel pending speech

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

  handleCommand(rawText) {
    const text = rawText.toLowerCase().trim();
    this.audio.playEarcon('success');

    // Language selection commands
    const langMatches = {
      'english': 'en',
      'malayalam': 'ml',
      'മലയാളം': 'ml',
      'hindi': 'hi',
      'हिन्दी': 'hi',
      'tamil': 'ta',
      'தமிழ்': 'ta',
      'kannada': 'kn',
      'ಕನ್ನಡ': 'kn',
      'telugu': 'te',
      'తెలుగు': 'te',
      'bengali': 'bn',
      'বাংলা': 'bn',
      'marathi': 'mr',
      'मराठी': 'mr',
      'urdu': 'ur',
      'اردو': 'ur',
      'punjabi': 'pa',
      'ਪੰਜਾਬੀ': 'pa'
    };

    for (const [key, code] of Object.entries(langMatches)) {
      if (text.includes(key)) {
        window.appState.setLanguage(code);
        const langName = window.TRANSLATIONS[code].name;
        this.speak(`Language set to ${langName}`);
        this.announceLive(`Language changed to ${langName}`);
        return;
      }
    }

    // Navigation commands
    if (text.includes('welcome') || text.includes('home')) {
      window.appState.navigate('welcome');
      this.speak('Navigating to Welcome Screen');
      return;
    }
    if (text.includes('language') || text.includes('select language')) {
      window.appState.navigate('language');
      this.speak('Opening Language Selection');
      return;
    }
    if (text.includes('accessibility') || text.includes('abilities') || text.includes('preferences')) {
      window.appState.navigate('accessibility');
      this.speak('Opening Accessibility Selection');
      return;
    }
    if (text.includes('login') || text.includes('sign in') || text.includes('register') || text.includes('account')) {
      window.appState.navigate('auth');
      this.speak('Opening Sign In and Registration');
      return;
    }
    if (text.includes('dashboard') || text.includes('main')) {
      window.appState.navigate('dashboard', 'overview');
      this.speak('Opening Dashboard Overview');
      return;
    }
    if (text.includes('profile') || text.includes('my profile')) {
      window.appState.navigate('dashboard', 'profile');
      this.speak('Opening User Profile');
      return;
    }
    if (text.includes('assistant') || text.includes('ai') || text.includes('ask')) {
      window.appState.navigate('dashboard', 'assistant');
      this.speak('Opening Accessibility Assistant');
      return;
    }
    if (text.includes('explore') || text.includes('places') || text.includes('find places')) {
      window.appState.navigate('dashboard', 'explore');
      this.speak('Opening Accessible Places Directory');
      return;
    }
    if (text.includes('transport') || text.includes('transit') || text.includes('cab') || text.includes('bus')) {
      window.appState.navigate('dashboard', 'transport');
      this.speak('Opening Accessible Transportation');
      return;
    }
    if (text.includes('service') || text.includes('services') || text.includes('interpreter')) {
      window.appState.navigate('dashboard', 'services');
      this.speak('Opening Accessible Services Directory');
      return;
    }
    if (text.includes('communication') || text.includes('aac') || text.includes('soundboard') || text.includes('talk')) {
      window.appState.navigate('dashboard', 'communication');
      this.speak('Opening Communication Tools');
      return;
    }
    if (text.includes('emergency') || text.includes('sos') || text.includes('help me') || text.includes('siren')) {
      window.appState.navigate('dashboard', 'emergency');
      this.speak('Emergency Assistance Screen Opened');
      return;
    }
    if (text.includes('community') || text.includes('forum') || text.includes('peer')) {
      window.appState.navigate('dashboard', 'community');
      this.speak('Opening Community Support');
      return;
    }
    if (text.includes('settings') || text.includes('theme') || text.includes('configure')) {
      window.appState.navigate('dashboard', 'settings');
      this.speak('Opening Accessibility Settings');
      return;
    }
    if (text.includes('help') || text.includes('shortcut') || text.includes('instructions')) {
      window.appState.navigate('dashboard', 'help');
      this.speak('Opening Help and Shortcuts Guide');
      return;
    }
    if (text.includes('logout') || text.includes('sign out')) {
      window.appState.updateUser({ isLoggedIn: false });
      window.appState.navigate('welcome');
      this.speak('Logged out successfully.');
      return;
    }

    // Accessibility Controls
    if (text.includes('increase text') || text.includes('bigger text') || text.includes('zoom in')) {
      const current = window.appState.get().settings.textSize;
      const next = Math.min(200, current + 25);
      window.appState.updateSettings({ textSize: next });
      this.speak(`Text size increased to ${next} percent`);
      return;
    }
    if (text.includes('decrease text') || text.includes('smaller text') || text.includes('zoom out')) {
      const current = window.appState.get().settings.textSize;
      const next = Math.max(100, current - 25);
      window.appState.updateSettings({ textSize: next });
      this.speak(`Text size decreased to ${next} percent`);
      return;
    }
    if (text.includes('high contrast') || text.includes('contrast')) {
      const cur = window.appState.get().settings.theme;
      const next = cur === 'dark' ? 'contrast-yellow' : (cur === 'contrast-yellow' ? 'contrast-white' : 'dark');
      window.appState.updateSettings({ theme: next });
      this.speak(`Theme changed to ${next.replace('-', ' ')}`);
      return;
    }
    if (text.includes('easy read') || text.includes('simple read')) {
      const cur = window.appState.get().settings.easyRead;
      window.appState.updateSettings({ easyRead: !cur });
      this.speak(`Easy read mode ${!cur ? 'enabled' : 'disabled'}`);
      return;
    }
    if (text.includes('read page') || text.includes('read aloud') || text.includes('read screen')) {
      this.readActivePage();
      return;
    }
    if (text.includes('stop reading') || text.includes('stop') || text.includes('quiet')) {
      this.stopSpeaking();
      return;
    }

    // Default unrecognized command
    this.speak(`Unrecognized command: ${rawText}. Say "Help" for list of commands.`);
    this.announceLive(`Command not recognized: "${rawText}"`);
  }

  readActivePage() {
    const activeView = document.querySelector('.view.active');
    if (!activeView) {
      this.speak('No active page content found.');
      return;
    }
    const heading = activeView.querySelector('h1, h2');
    const intro = activeView.querySelector('p, .subtitle');
    let textToRead = '';
    if (heading) textToRead += heading.textContent + '. ';
    if (intro) textToRead += intro.textContent;
    if (!textToRead.trim()) {
      textToRead = activeView.textContent.slice(0, 300);
    }
    this.speak(textToRead);
  }
}

// Global Voice Engine
window.voiceEngine = new VoiceEngine();

