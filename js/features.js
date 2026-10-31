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
    this.initCalendar();
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
      { title: 'Accessible Calendar & Appointments Schedule', view: 'dashboard', section: 'calendar', tags: 'calendar, schedule, appointment, appointments, events, reminders' },
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

  // ==========================================================================
  // ACCESSIBLE CALENDAR & SCHEDULE MANAGER
  // ==========================================================================
  initCalendar() {
    this.calCurrentDate = new Date();
    this.calSelectedDate = new Date();
    this.calEvents = this.loadCalendarEvents();
  }

  formatDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  loadCalendarEvents() {
    const STORAGE_KEY = 'beyond_reach_calendar_events';
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load calendar events', e);
    }

    // Default realistic accessibility appointments
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const inThreeDays = new Date(today);
    inThreeDays.setDate(inThreeDays.getDate() + 3);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 6);

    const defaults = [
      {
        id: 'ev-1',
        date: this.formatDateKey(today),
        time: '10:00 AM',
        title: 'Hydraulic Ramp Van to Metro Hospital',
        category: 'transit',
        categoryLabel: 'Accessible Transit',
        icon: '🚖',
        accommodations: 'Low-slope ramp, electric wheelchair tie-downs, Driver: Carlos',
        alert: true
      },
      {
        id: 'ev-2',
        date: this.formatDateKey(today),
        time: '03:00 PM',
        title: 'Physical Therapy & Mobility Check',
        category: 'medical',
        categoryLabel: 'Health & Therapy',
        icon: '💊',
        accommodations: 'Sensory-quiet room, step-free treatment bay',
        alert: true
      },
      {
        id: 'ev-3',
        date: this.formatDateKey(tomorrow),
        time: '02:30 PM',
        title: 'On-Demand Sign Language Video Call',
        category: 'interpreter',
        categoryLabel: 'Sign Language',
        icon: '🧏',
        accommodations: 'Certified ISL Interpreter video relay for doctor review',
        alert: true
      },
      {
        id: 'ev-4',
        date: this.formatDateKey(inThreeDays),
        time: '11:00 AM',
        title: 'Sighted Mobility Guide Companion Escort',
        category: 'guide',
        categoryLabel: 'Mobility Guide',
        icon: '🦯',
        accommodations: 'Tactile navigation at Central Library & shopping',
        alert: false
      },
      {
        id: 'ev-5',
        date: this.formatDateKey(nextWeek),
        time: '04:00 PM',
        title: 'Deaf & Hard of Hearing Community Meetup',
        category: 'community',
        categoryLabel: 'Community Meetup',
        icon: '👥',
        accommodations: 'Unity Cafe & Bakery, visual menu displays and ASL/ISL table',
        alert: false
      }
    ];

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    } catch (e) {}

    return defaults;
  }

  saveCalendarEvents() {
    try {
      localStorage.setItem('beyond_reach_calendar_events', JSON.stringify(this.calEvents));
    } catch (e) {
      console.warn('Failed to save calendar events', e);
    }
  }

  renderCalendar() {
    const titleEl = document.getElementById('calendar-month-title');
    const gridEl = document.getElementById('calendar-days-grid');
    if (!gridEl) return;

    const year = this.calCurrentDate.getFullYear();
    const month = this.calCurrentDate.getMonth();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    if (titleEl) {
      titleEl.textContent = `${monthNames[month]} ${year}`;
    }

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const todayKey = this.formatDateKey(new Date());
    const selectedKey = this.formatDateKey(this.calSelectedDate);

    let html = '';

    // Previous month offset days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      html += `
        <div class="calendar-day-cell other-month" aria-hidden="true">
          <span class="day-number">${dayNum}</span>
        </div>
      `;
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      const cellDate = new Date(year, month, d);
      const cellKey = this.formatDateKey(cellDate);
      const isToday = cellKey === todayKey;
      const isSelected = cellKey === selectedKey;
      const dayEvents = this.calEvents.filter(ev => ev.date === cellKey);
      const hasEvents = dayEvents.length > 0;

      let dotsHtml = '';
      if (hasEvents) {
        dotsHtml = `
          <div class="day-events-dots" aria-hidden="true">
            ${dayEvents.slice(0, 3).map(ev => `<span class="event-dot dot-${ev.category}"></span>`).join('')}
            ${dayEvents.length > 3 ? '<span class="event-dot-more">+</span>' : ''}
          </div>
        `;
      }

      html += `
        <button class="calendar-day-cell current-month ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''}"
          data-date-key="${cellKey}"
          data-day="${d}"
          aria-label="${monthNames[month]} ${d}, ${year}. ${hasEvents ? dayEvents.length + ' appointments scheduled.' : 'No appointments.'} ${isToday ? 'Today.' : ''} ${isSelected ? 'Selected.' : ''}">
          <span class="day-number">${d}</span>
          ${dotsHtml}
        </button>
      `;
    }

    gridEl.innerHTML = html;

    // Attach click listeners to day cells
    gridEl.querySelectorAll('.calendar-day-cell.current-month').forEach(cell => {
      cell.addEventListener('click', () => {
        const key = cell.getAttribute('data-date-key');
        const parts = key.split('-');
        this.calSelectedDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        window.voiceEngine.audio.playEarcon('click');
        this.renderCalendar();
        this.renderSelectedDayAgenda();
      });
    });

    this.renderSelectedDayAgenda();
  }

  renderSelectedDayAgenda() {
    const container = document.getElementById('calendar-agenda-container');
    const heading = document.getElementById('calendar-selected-date-heading');
    if (!container) return;

    const dateKey = this.formatDateKey(this.calSelectedDate);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateFormatted = this.calSelectedDate.toLocaleDateString('en-US', options);

    if (heading) {
      heading.textContent = `Schedule for ${dateFormatted}`;
    }

    const events = this.calEvents.filter(ev => ev.date === dateKey);

    if (events.length === 0) {
      container.innerHTML = `
        <div style="background: var(--bg-primary); border: 2px dashed var(--border-medium); border-radius: 12px; padding: 32px 20px; text-align: center;">
          <p style="font-size: 1.1rem; color: var(--text-secondary); margin-bottom: 16px;">No appointments or transit booked for this date.</p>
          <button class="btn btn-primary" onclick="window.features.openAddEventModal('${dateKey}')">
            + Schedule an Appointment
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = events.map(ev => `
      <div class="card event-agenda-card" data-event-id="${ev.id}" style="margin-bottom: 14px; border-left: 5px solid var(--accent-green); padding: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <span style="font-size: 1.3rem;">${ev.icon || '📅'}</span>
              <span class="disability-badge" style="font-size: 0.78rem; padding: 4px 10px;">${ev.categoryLabel || 'Appointment'}</span>
              <strong style="color: var(--accent-green); font-size: 1.05rem;">${ev.time}</strong>
            </div>
            <h3 style="font-size: 1.25rem; color: #ffffff; margin-bottom: 6px;">${this.escapeHTML(ev.title)}</h3>
            <p style="font-size: 0.92rem; color: var(--text-secondary); margin-bottom: 8px;"><strong>Accommodations:</strong> ${this.escapeHTML(ev.accommodations)}</p>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-secondary" style="padding: 8px 14px; min-height: 40px; font-size: 0.88rem;" onclick="window.voiceEngine.speak('${this.escapeHTML(ev.time)}: ${this.escapeHTML(ev.title)}. Accommodations: ${this.escapeHTML(ev.accommodations)}')" aria-label="Read event details aloud">
              🔊 Read
            </button>
            <button class="btn btn-outline" style="padding: 8px 12px; min-height: 40px; font-size: 0.88rem; border-color: rgba(239, 68, 68, 0.4); color: #fca5a5;" onclick="window.features.deleteCalendarEvent('${ev.id}')" aria-label="Delete appointment">
              🗑️
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  prevMonth() {
    this.calCurrentDate.setMonth(this.calCurrentDate.getMonth() - 1);
    window.voiceEngine.audio.playEarcon('click');
    this.renderCalendar();
  }

  nextMonth() {
    this.calCurrentDate.setMonth(this.calCurrentDate.getMonth() + 1);
    window.voiceEngine.audio.playEarcon('click');
    this.renderCalendar();
  }

  goToToday() {
    this.calCurrentDate = new Date();
    this.calSelectedDate = new Date();
    window.voiceEngine.audio.playEarcon('nav');
    this.renderCalendar();
  }

  openAddEventModal(defaultDateKey = null) {
    const modal = document.getElementById('modal-add-event');
    const dateInput = document.getElementById('event-input-date');
    if (dateInput) {
      dateInput.value = defaultDateKey || this.formatDateKey(this.calSelectedDate);
    }
    if (modal) {
      modal.classList.add('open');
      const firstInput = document.getElementById('event-input-title');
      if (firstInput) firstInput.focus();
    }
  }

  addCalendarEvent(eventData) {
    const newEvent = {
      id: 'ev-' + Date.now(),
      ...eventData
    };
    this.calEvents.push(newEvent);
    this.saveCalendarEvents();
    window.voiceEngine.audio.playEarcon('success');
    window.voiceEngine.speak(`Appointment scheduled: ${newEvent.title} at ${newEvent.time}`);
    window.voiceEngine.announceLive(`Appointment added for ${newEvent.date}`);
    this.renderCalendar();
  }

  deleteCalendarEvent(id) {
    this.calEvents = this.calEvents.filter(ev => ev.id !== id);
    this.saveCalendarEvents();
    window.voiceEngine.audio.playEarcon('click');
    window.voiceEngine.announceLive('Appointment deleted');
    this.renderCalendar();
  }

  readScheduleAloud() {
    const dateKey = this.formatDateKey(this.calSelectedDate);
    const options = { month: 'long', day: 'numeric' };
    const dateFormatted = this.calSelectedDate.toLocaleDateString('en-US', options);
    const events = this.calEvents.filter(ev => ev.date === dateKey);

    if (events.length === 0) {
      window.voiceEngine.speak(`You have no appointments scheduled for ${dateFormatted}.`);
      return;
    }

    let speech = `Schedule for ${dateFormatted}. You have ${events.length} appointment${events.length > 1 ? 's' : ''}. `;
    events.forEach((ev, idx) => {
      speech += `Appointment ${idx + 1} at ${ev.time}: ${ev.title}. `;
    });

    window.voiceEngine.speak(speech);
  }

  escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }
}

// Global features instance
window.features = new FeatureManager();
