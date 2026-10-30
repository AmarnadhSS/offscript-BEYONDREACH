# BEYOND REACH
### An Inclusive Accessibility Platform
> **Tagline:** One Platform. Different Abilities. Equal Opportunities.

**BEYOND REACH** is a modern, fully responsive, highly accessible platform designed to empower blind, deaf, physically disabled, speech-disabled, and cognitively or learning-disabled individuals to access digital services and navigate everyday life with complete autonomy and independence.

---

## 🌟 Visual Identity & Design System
- **Theme:** Minimalist, modern, and professional aesthetic built on black (`#09090b`), pure white (`#ffffff`), and subtle slate grey.
- **High-Contrast Standards:** Meets and exceeds WCAG AAA color contrast ratios (> 18:1).
- **Themes Supported:**
  1. *Obsidian Dark (Default):* Premium dark background with crisp white typography.
  2. *High Contrast Yellow on Black:* Maximum legibility for severe visual impairments.
  3. *High Contrast White on Black:* 2px high-visibility outlines and borders.
  4. *Soft Charcoal Dark:* Low-stimulation theme to prevent photophobia and eye fatigue.
- **Focus Indicators:** 3px-4px high-visibility focus ring with 4px outline-offset for keyboard navigation.
- **Responsive Layout:** Adaptive design across desktop, tablet, and mobile screens.

---

## 🗺️ Website Navigation Flow

### Page 1: Welcome Screen (`#welcome`)
- **Brand Identity:** High-resolution geometric SVG logo and tagline.
- **Greeting:** *"Hello, Welcome to BEYOND REACH."*
- **Interactive Controls:**
  - **Get Started Button:** Direct pathway to language selection.
  - **Voice Command Assistant:** Integrated Web Speech API microphone listener with animated pulsing waveform.
  - **Text Command Console:** Supports commands like `"explore places"`, `"emergency"`, `"dashboard"`, `"select hindi"`, `"increase text"`, `"high contrast"`.
  - **Text-to-Speech Welcome Greeting:** Spoken introduction using browser `speechSynthesis`.
  - **Command Chips:** One-click shortcuts for primary tasks.

### Page 2: Language Selection (`#language`)
- **Supported Languages:**
  1. English
  2. Malayalam (മലയാളം)
  3. Hindi (हिन्दी)
  4. Tamil (தமிழ்)
  5. Kannada (ಕನ್ನಡ)
  6. Telugu (తెలుగు)
  7. Bengali (বাংলা)
  8. Marathi (मराठी)
  9. Urdu (اردو)
  10. Punjabi (ਪੰਜਾਬੀ)
  11. Other Languages
- **Features:** Real-time text search filter, voice-based language command selection, and spoken instructions playback in the chosen language.

### Page 3: Accessibility Selection (`#accessibility`)
- **Requirement Categories:**
  1. Blind / Low Vision
  2. Deaf / Hard of Hearing
  3. Physical / Mobility Disabilities
  4. Speech Disabilities
  5. Cognitive / Learning Disabilities
  6. Other Accessibility Requirements
  *(Explicitly no mental disability category)*
- **Multi-Select & Skip:** Select any combination or choose **Skip this step** to activate the Universal Balanced Mode.

### Page 4: Login & Registration (`#auth`)
- **Universal Accessible Authentication:** One consistent login interface for all users.
- **Features:** Email/Phone login, password with accessible show/hide toggle, registration tab, forgot password modal with SMS/audio code simulation, and simulated Google authentication.
- **Demo Profiles:** One-click testing presets for each disability category (Alex - Low Vision, Jordan - Deaf, Taylor - Mobility, Morgan - AAC, Sam - Cognitive).

### Page 5: Main Dashboard (`#dashboard`)
- **Top Navigation Bar:**
  - Logo and quick home link.
  - Global accessible search bar with automatic view routing.
  - Quick Accessibility Toolbar: Text zoom (`A-` / `A+`), Theme cycler (`Alt+C`), Screen reader read-aloud (`Alt+R`), and Voice assistant mic (`Alt+V`).
  - Notifications drawer with audio/visual status indicators.
  - User profile link.
- **Collapsible Sidebar (12 Functional Sections):**
  1. **Dashboard (Overview):** Personalized greeting, active disability adaptation badges, quick access cards, tailored recommendations, recent activities feed, and emergency shortcut.
  2. **My Profile:** User identity, medical ID (blood group, allergies, equipment), and emergency contact editor.
  3. **Accessibility Assistant:** Interactive AI assistant supporting voice/text questions, sign language demo library, and step-free directions.
  4. **Explore Places:** Accessible venues directory (hospitals, transit hubs, libraries, dining) with filters for wheelchair ramps, tactile paving, braille menus, and sensory quiet rooms.
  5. **Accessible Transportation:** Trip planner, wheelchair ramp van dispatcher, low-floor transit tracker, and audio arrival announcements.
  6. **Find Accessible Services:** Certified on-demand sign language interpreters, Braille transcriptionists, and sighted mobility guides.
  7. **Communication Tools:** AAC (Augmentative & Alternative Communication) soundboard with 19 spoken pictograms + sentence builder, Live Speech-to-Text transcriber, and custom text-to-speech voice generator.
  8. **Emergency Assistance (SOS):** Massive tactile SOS button, 3-second abort countdown, Web Audio synthesizer siren, visual screen strobe flasher, GPS beacon, and medical profile dispatch.
  9. **Community Support:** Inclusive peer discussion threads with audio read-aloud and volunteer buddy request.
  10. **Settings:** Text scale slider (100% - 200%), theme selector, speech rate/pitch sliders, Easy-Read mode, OpenDyslexic font, and reading ruler.
  11. **Help and Support:** Comprehensive keyboard shortcuts reference table, voice commands guide, and accessibility documentation.
  12. **Logout:** Clean session reset and return to welcome screen.

---

## ⚡ Adaptive Accessibility Engine

| Disability Profile | Active Platform Adaptations |
| :--- | :--- |
| **Blind / Low Vision** | ARIA live region announcements, Web Audio earcons on all actions, audible page reader (`Alt+R`), 4px high-visibility focus borders, and text zoom up to 200%. |
| **Deaf / Hard of Hearing** | Live speech-to-text transcriber, real-time closed captions bar, visual strobe alerts for alarms, text-based communications, and sign language demonstration viewer. |
| **Physical / Mobility** | Giant touch targets (minimum 64px), expanded button spacing, single-key keyboard navigation, and complete voice navigation commands. |
| **Speech Disabilities** | AAC pictogram soundboard with one-tap spoken vocalization, custom text-to-speech speaker, and non-verbal communication tools. |
| **Cognitive / Learning** | Easy-Read plain language mode, step-by-step numbered visual guidance, OpenDyslexic font toggle, and an interactive tracking reading ruler. |

---

## ⌨️ Keyboard Shortcuts Reference

| Shortcut | Action |
| :--- | :--- |
| `Alt + V` | Toggle Voice Command Assistant |
| `Alt + S` | Trigger Immediate Emergency SOS Alert |
| `Alt + R` | Read Screen Content Aloud (TTS) |
| `Alt + C` | Cycle High Contrast Themes |
| `Alt + M` | Focus Main Sidebar Navigation |
| `Escape` | Stop speech, abort siren, or close modal dialogs |
| `Tab / Shift + Tab` | Standard linear accessible focus navigation |

---

## 🚀 How to Run the Platform

1. Open `index.html` directly in any modern browser (Google Chrome, Microsoft Edge, Mozilla Firefox, or Safari).
2. For optimal voice recognition and speech synthesis, ensure microphone permissions are allowed when prompted.
3. Use the top navigation bar or press `Alt + V` to issue voice commands at any time.

