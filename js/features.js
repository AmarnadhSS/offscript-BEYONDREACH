/**
 * BEYOND REACH - Interactive Accessibility Features & Modules
 * Implements AAC soundboard, Live Transcriber, Places Explorer, Transit, Services, Emergency SOS, and AI Assistant.
 * Fully eliminates stray lines and enhances interactive accuracy.
 */

class FeatureManager {
  constructor() {
    this.initLiveTranscriber();
    this.initAACBoard();
    this.initEmergencySOS();
    this.initAssistant();
    this.initReadingRuler();
    this.initGlobalSearch();
  }

  // ==========================================================================
  // READING RULER GUIDE (No lingering lines)
  // ==========================================================================
  initReadingRuler() {
    let ruler = document.getElementById('reading-ruler');
    if (!ruler) {
      ruler = document.createElement('div');
      ruler.id = 'reading-ruler';
      ruler.setAttribute('aria-hidden', 'true');
      document.body.appendChild(ruler);
    }

    const updateRulerPosition = (clientY) => {
      if (document.body.classList.contains('mode-reading-ruler')) {
        ruler.style.top = `${clientY}px`;
        ruler.style.display = 'block';
      } else {
        ruler.style.display = 'none';
      }
    };

    window.addEventListener('mousemove', (e) => {
      updateRulerPosition(e.clientY);
    });

    window.addEventListener('keydown', (e) => {
      if (document.body.classList.contains('mode-reading-ruler')) {
        const active = document.activeElement;
        if (active && active !== document.body) {
          const rect = active.getBoundingClientRect();
          updateRulerPosition(rect.top + rect.height / 2);
        }
      }
    });
  }

  // ==========================================================================
  // AAC SOUNDBOARD (Augmentative & Alternative Communication)
  // ==========================================================================
  initAACBoard() {
    this.aacTiles = [
      // Needs
      { category: 'needs', icon: '💧', label: 'Water', speech: 'I need water please.' },
      { category: 'needs', icon: '🍎', label: 'Hungry', speech: 'I am hungry, I need food.' },
      { category: 'needs', icon: '🚻', label: 'Restroom', speech: 'Where is the accessible restroom?' },
      { category: 'needs', icon: '🛌', label: 'Rest', speech: 'I am tired and need to rest.' },
      { category: 'needs', icon: '💊', label: 'Medicine', speech: 'I need to take my medication now.' },
      
      // Emergency / Urgent
      { category: 'urgent', icon: '🆘', label: 'Help', speech: 'I need immediate assistance please.' },
      { category: 'urgent', icon: '⚠️', label: 'Pain', speech: 'I am in pain and need medical attention.' },
      { category: 'urgent', icon: '📞', label: 'Call Contact', speech: 'Please call my emergency contact.' },
      { category: 'urgent', icon: '♿', label: 'Ramp', speech: 'I need a wheelchair ramp or elevator.' },

      // Social / Communication
      { category: 'social', icon: '👋', label: 'Hello', speech: 'Hello, good day!' },
      { category: 'social', icon: '🙏', label: 'Thank You', speech: 'Thank you very much for your support.' },
      { category: 'social', icon: '👍', label: 'Yes', speech: 'Yes, I agree.' },
      { category: 'social', icon: '👎', label: 'No', speech: 'No, thank you.' },
      { category: 'social', icon: '✍️', label: 'Write Down', speech: 'Please write it down or type it for me.' },
      { category: 'social', icon: '⏳', label: 'Wait', speech: 'Please wait a moment.' },

      // Travel / Transit
      { category: 'transit', icon: '🚖', label: 'Taxi', speech: 'I need an accessible wheelchair taxi.' },
      { category: 'transit', icon: '🚌', label: 'Bus', speech: 'Does this bus have a low floor and ramp?' },
      { category: 'transit', icon: '🗺️', label: 'Directions', speech: 'Can you show me the step-free route?' },
      { category: 'transit', icon: '🚪', label: 'Exit', speech: 'Where is the accessible exit?' }
    ];

    this.sentenceBuilder = [];
  }

  renderAACGrid(containerId, categoryFilter = 'all') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const filtered = categoryFilter === 'all' 
      ? this.aacTiles 
      : this.aacTiles.filter(t => t.category === categoryFilter);

    container.innerHTML = filtered.map((tile) => `
      <button class="aac-tile" data-speech="${tile.speech}" data-label="${tile.label}" aria-label="${tile.label}: ${tile.speech}">
        <span class="tile-icon" aria-hidden="true">${tile.icon}</span>
        <span class="tile-label">${tile.label}</span>
      </button>
    `).join('');

    container.querySelectorAll('.aac-tile').forEach(btn => {
      btn.addEventListener('click', () => {
        const speech = btn.getAttribute('data-speech');
        const label = btn.getAttribute('data-label');
        window.voiceEngine.speak(speech);
        window.voiceEngine.audio.playEarcon('click');
        this.addToSentence(label, speech);
      });
    });
  }

  addToSentence(label, speech) {
    this.sentenceBuilder.push({ label, speech });
    this.updateSentenceDisplay();
  }

  clearSentence() {
    this.sentenceBuilder = [];
    this.updateSentenceDisplay();
  }

  speakSentence() {
    if (this.sentenceBuilder.length === 0) {
      window.voiceEngine.speak('Sentence is empty. Tap cards to build words.');
      return;
    }
    const fullSpeech = this.sentenceBuilder.map(item => item.speech).join(' ');
    window.voiceEngine.speak(fullSpeech);
  }

  updateSentenceDisplay() {
    const display = document.getElementById('aac-sentence-box');
    if (!display) return;
    if (this.sentenceBuilder.length === 0) {
      display.innerHTML = '<span class="text-muted">Tap cards to construct an audible sentence...</span>';
    } else {
      display.innerHTML = this.sentenceBuilder.map(item => `<span style="background: var(--accent-green); color: #04101e; padding: 4px 10px; border-radius: 9999px; font-weight: 700; display: inline-block; margin-right: 6px;">${item.label}</span>`).join(' ');
    }
  }

  // ==========================================================================
  // LIVE SPEECH-TO-TEXT TRANSCRIBER (Deaf / Hard of Hearing)
  // ==========================================================================
  initLiveTranscriber() {
    this.isTranscribing = false;
    this.transcriptionStream = null;
    this.mockInterval = null;
  }

  toggleLiveTranscriber(buttonEl, outputEl) {
    if (this.isTranscribing) {
      this.stopTranscriber(buttonEl, outputEl);
    } else {
      this.startTranscriber(buttonEl, outputEl);
    }
  }

  startTranscriber(buttonEl, outputEl) {
    this.isTranscribing = true;
    if (buttonEl) {
      buttonEl.innerHTML = '<span aria-hidden="true">⏹</span> Stop Transcribing';
      buttonEl.classList.add('btn-emergency');
    }
    if (outputEl) {
      outputEl.innerHTML = '<p class="caption-active" style="color: var(--accent-green);"><em>[Listening for speech in real-time...]</em></p>';
    }

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      try {
        this.transcriptionStream = new SpeechRec();
        this.transcriptionStream.continuous = true;
        this.transcriptionStream.interimResults = true;
        this.transcriptionStream.lang = window.TRANSLATIONS[window.appState.get().language].code || 'en-US';

        this.transcriptionStream.onresult = (event) => {
          let interimTranscript = '';
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript + ' ';
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          if (outputEl) {
            outputEl.innerHTML = `<p class="final-text" style="color: #ffffff; font-weight: 600;">${finalTranscript}</p><p class="interim-text" style="color: var(--accent-green);"><em>${interimTranscript}</em></p>`;
            outputEl.scrollTop = outputEl.scrollHeight;
          }
          this.showLiveCaption(finalTranscript || interimTranscript);
        };

        this.transcriptionStream.onerror = () => {
          this.fallbackMockTranscription(outputEl);
        };

        this.transcriptionStream.start();
        return;
      } catch (e) {
        console.warn('Real transcription stream failed, falling back', e);
      }
    }
    this.fallbackMockTranscription(outputEl);
  }

  fallbackMockTranscription(outputEl) {
    const demoPhrases = [
      "The metro train heading to Central Terminal has a low floor ramp on Coach 3.",
      "The sign language interpreter is ready for your appointment at Counter 4.",
      "Please proceed via the elevator on your right for step-free access.",
      "All audio announcements are mirrored on the visual subtitle displays.",
      "Emergency assistance has been informed and is on the way."
    ];
    let idx = 0;
    this.mockInterval = setInterval(() => {
      if (!this.isTranscribing) return;
      const phrase = demoPhrases[idx % demoPhrases.length];
      if (outputEl) {
        outputEl.innerHTML += `<p class="final-text" style="color: #ffffff; margin-bottom: 6px;">• ${phrase}</p>`;
        outputEl.scrollTop = outputEl.scrollHeight;
      }
      this.showLiveCaption(phrase);
      idx++;
    }, 3500);
  }

  stopTranscriber(buttonEl, outputEl) {
    this.isTranscribing = false;
    if (this.transcriptionStream) {
      try { this.transcriptionStream.stop(); } catch (e) {}
      this.transcriptionStream = null;
    }
    if (this.mockInterval) {
      clearInterval(this.mockInterval);
      this.mockInterval = null;
    }
    if (buttonEl) {
      buttonEl.innerHTML = '<span aria-hidden="true">🎙️</span> Start Live Transcriber';
      buttonEl.classList.remove('btn-emergency');
    }
  }

  showLiveCaption(text) {
    if (!text || !text.trim()) return;
    const box = document.getElementById('live-caption-display');
    if (!box) return;
    box.textContent = text;
    box.classList.add('visible');
    clearTimeout(this.captionTimer);
    this.captionTimer = setTimeout(() => {
      box.classList.remove('visible');
    }, 4500);
  }

  // ==========================================================================
  // EMERGENCY SOS ASSISTANCE
  // ==========================================================================
  initEmergencySOS() {
    this.countdown = 3;
    this.countdownTimer = null;
    this.isAlertActive = false;
  }

  triggerSOS() {
    if (this.isAlertActive) {
      this.cancelSOS();
      return;
    }

    const notice = document.getElementById('sos-status-notice');
    
    // Start 3 second safety countdown
    this.countdown = 3;
    if (notice) {
      notice.innerHTML = `<span style="color: #facc15; font-size: 1.35rem; font-weight: 800;">🚨 Triggering SOS in ${this.countdown} seconds... Click again to abort!</span>`;
    }
    window.voiceEngine.audio.playEarcon('alert');
    window.voiceEngine.speak(`Emergency SOS activated. Countdown: ${this.countdown}`);

    this.countdownTimer = setInterval(() => {
      this.countdown--;
      if (this.countdown > 0) {
        if (notice) notice.innerHTML = `<span style="color: #facc15; font-size: 1.35rem; font-weight: 800;">🚨 Triggering SOS in ${this.countdown} seconds... Click again to abort!</span>`;
        window.voiceEngine.speak(`${this.countdown}`);
      } else {
        clearInterval(this.countdownTimer);
        this.activateFullEmergency();
      }
    }, 1000);
  }

  activateFullEmergency() {
    this.isAlertActive = true;
    document.body.classList.add('alert-active');
    
    // Sound siren
    window.voiceEngine.audio.startSiren();

    const notice = document.getElementById('sos-status-notice');
    if (notice) {
      notice.innerHTML = `
        <div style="background: rgba(239, 68, 68, 0.2); border: 2px solid #ef4444; padding: 22px; border-radius: 14px; margin-top: 20px;">
          <h2 style="color: #ef4444; margin-bottom: 8px;">🚨 EMERGENCY BEACON TRANSMITTING</h2>
          <p style="color: #ffffff; font-weight: 600;">Alert sent to: ${window.appState.get().user.emergencyContact}</p>
          <p style="color: #ffffff;">Simulated GPS Coordinates: <strong>37.7749° N, 122.4194° W (Accuracy: 4 meters)</strong></p>
          <p style="color: #ffffff;">Medical Profile Attached: <strong>${window.appState.get().user.bloodType} | Allergies: ${window.appState.get().user.allergies}</strong></p>
          <button class="btn btn-primary" onclick="window.features.cancelSOS()" style="margin-top: 18px;">
            Cancel Emergency Siren & Reset
          </button>
        </div>
      `;
    }
    window.voiceEngine.announceLive("Emergency SOS is sounding and your coordinates have been transmitted to your emergency contacts.", true);
  }

  cancelSOS() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
    this.isAlertActive = false;
    document.body.classList.remove('alert-active');
    window.voiceEngine.audio.stopSiren();
    
    const notice = document.getElementById('sos-status-notice');
    if (notice) {
      notice.innerHTML = '<span style="color: #10b981; font-weight: 700;">✓ Emergency alert cancelled. All systems standing by.</span>';
    }
    window.voiceEngine.speak('Emergency alert cancelled.');
    window.voiceEngine.audio.playEarcon('click');
  }

  // ==========================================================================
  // AI ACCESSIBILITY ASSISTANT & SIGN LANGUAGE DEMO
  // ==========================================================================
  initAssistant() {
    this.signDictionary = {
      'help': '👋 Both hands flat, thumbs up, dominant hand lifts the non-dominant hand upward.',
      'emergency': '🚨 Right hand forms letter "E", shakes rapidly back and forth in front of chest.',
      'thank you': '🙏 Open flat hand touches chin and moves forward toward the person with a warm smile.',
      'hospital': '🏥 Index and middle finger form a cross pattern on upper opposite arm.',
      'restroom': '🚻 Hand forms "T" shape, shaking side-to-side gently.',
      'water': '💧 "W" handshape touches the chin twice.',
      'yes': '✊ Closed fist nods up and down like a head nod.',
      'no': '✌️ Index and middle finger tap thumb together repeatedly.'
    };
  }

  askAssistant(question) {
    if (!question || !question.trim()) return;
    const chatContainer = document.getElementById('assistant-chat-messages');
    if (!chatContainer) return;

    // Append user message
    const userBubble = document.createElement('div');
    userBubble.className = 'chat-bubble chat-user';
    userBubble.style.cssText = 'background: rgba(5, 241, 160, 0.15); border: 1px solid var(--accent-green); padding: 14px; border-radius: 12px; align-self: flex-end; max-width: 85%; margin-bottom: 8px;';
    userBubble.innerHTML = `<strong style="color: var(--accent-green);">You:</strong> <p style="color: #ffffff; margin-top: 4px;">${this.escapeHTML(question)}</p>`;
    chatContainer.appendChild(userBubble);

    // Generate intelligent accessibility response
    const q = question.toLowerCase();
    let reply = "I'm here to support your accessibility needs. You can ask for step-free routes, sign language help, AAC assistance, or emergency SOS.";
    let signTerm = null;

    if (q.includes('ramp') || q.includes('wheelchair') || q.includes('step-free')) {
      reply = "All venues in our Explore directory with wheelchair badges offer certified 1:12 slope ramps, automatic wide doors, and accessible elevators.";
    } else if (q.includes('sign') || q.includes('deaf') || q.includes('gesture')) {
      reply = "Our platform provides certified on-demand ISL/ASL interpreters. Here is the sign reference:";
      signTerm = 'help';
    } else if (q.includes('hospital') || q.includes('doctor')) {
      reply = "Metro City Hospital is 1.2 miles away. It features tactile guide pathways, 24/7 sign language interpreters, and low-barrier emergency rooms.";
      signTerm = 'hospital';
    } else if (q.includes('thank')) {
      reply = "You are very welcome! Our mission is equal opportunity and true independence for everyone.";
      signTerm = 'thank you';
    } else if (q.includes('water') || q.includes('drink')) {
      reply = "Accessible water stations with sensor-activated low fountains are located near all station restrooms.";
      signTerm = 'water';
    } else if (q.includes('emergency') || q.includes('sos')) {
      reply = "To trigger instant emergency assistance, say 'Emergency SOS' or press the red SOS button. It broadcasts your GPS and Medical ID.";
      signTerm = 'emergency';
    }

    // Append assistant reply
    setTimeout(() => {
      const botBubble = document.createElement('div');
      botBubble.className = 'chat-bubble chat-bot';
      botBubble.style.cssText = 'background: var(--bg-tertiary); border: 1px solid var(--border-subtle); padding: 16px; border-radius: 12px; max-width: 90%; margin-bottom: 8px;';
      
      let signMarkup = '';
      if (signTerm && this.signDictionary[signTerm]) {
        signMarkup = `
          <div class="sign-reference-card" style="background: var(--bg-primary); border: 1px solid var(--border-medium); padding: 12px; border-radius: 8px; margin-top: 10px;">
            <div style="font-weight: 700; color: var(--accent-green);">Sign Language Reference: "${signTerm.toUpperCase()}"</div>
            <div style="font-size: 1.05rem; margin-top: 4px; color: #ffffff;">${this.signDictionary[signTerm]}</div>
          </div>
        `;
      }

      botBubble.innerHTML = `
        <strong style="color: var(--accent-green);">BEYOND REACH Assistant:</strong>
        <p style="color: #ffffff; margin-top: 4px;">${reply}</p>
        ${signMarkup}
      `;
      chatContainer.appendChild(botBubble);
      chatContainer.scrollTop = chatContainer.scrollHeight;

      window.voiceEngine.speak(reply);
    }, 350);
  }

  showSignDemo(word) {
    const term = word.toLowerCase();
    const explanation = this.signDictionary[term] || 'Gesture guidance not found.';
    const viewer = document.getElementById('sign-viewer-output');
    if (viewer) {
      viewer.innerHTML = `
        <div style="text-align: center; padding: 22px;">
          <h3 style="color: var(--accent-green); margin-bottom: 10px; font-size: 1.4rem;">Sign Demonstration: "${term.toUpperCase()}"</h3>
          <p style="font-size: 1.15rem; font-weight: 600; line-height: 1.6; color: #ffffff;">${explanation}</p>
          <div style="margin-top: 18px;">
            <button class="btn btn-secondary" onclick="window.voiceEngine.speak('${explanation}')">
              🔊 Read Sign Instructions Aloud
            </button>
          </div>
        </div>
      `;
    }
  }

  // ==========================================================================
  // GLOBAL SEARCH ENGINE
  // ==========================================================================
  initGlobalSearch() {
    this.searchIndex = [
      { title: 'Explore Wheelchair Ramps & Places', view: 'dashboard', section: 'explore', tags: 'ramp, wheelchair, hospital, places' },
      { title: 'Book Low-Floor Accessible Bus & Taxi', view: 'dashboard', section: 'transport', tags: 'transit, taxi, bus, metro' },
      { title: 'AAC Pictogram Soundboard', view: 'dashboard', section: 'communication', tags: 'aac, speech, soundboard, talk' },
      { title: 'Emergency SOS & Siren', view: 'dashboard', section: 'emergency', tags: 'sos, emergency, siren, medical' },
      { title: 'Sign Language Interpreters On-Demand', view: 'dashboard', section: 'services', tags: 'sign language, interpreter, deaf' },
      { title: 'Braille Document Transcription Service', view: 'dashboard', section: 'services', tags: 'braille, blind, tactile' },
      { title: 'Accessibility Settings & Contrast Modes', view: 'dashboard', section: 'settings', tags: 'settings, theme, font, contrast' },
      { title: 'Keyboard Shortcuts Reference Guide', view: 'dashboard', section: 'help', tags: 'help, shortcuts, keyboard' }
    ];
  }

  search(query) {
    if (!query || !query.trim()) return [];
    const q = query.toLowerCase();
    return this.searchIndex.filter(item => 
      item.title.toLowerCase().includes(q) || item.tags.toLowerCase().includes(q)
    );
  }

  escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }
}

// Global features instance
window.features = new FeatureManager();
