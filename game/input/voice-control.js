// Uses the Web Speech API 
//
// Supported commands:
//   "up"      -> tilt surface forward  (tiltX negative)
//   "down"    -> tilt surface backward (tiltX positive)
//   "left"    -> tilt surface left      (tiltZ positive)
//   "right"   -> tilt surface right     (tiltZ negative)
//   "stop"    -> zero all tilt input

export class VoiceControl {

  constructor() {
    //(-1, 0, or 1 per axis)
    this.tiltX = 0;
    this.tiltZ = 0;

    this.isListening = false;

    this.isSupported = false;

    this._recognizer = null;

    this.onCommand = null;

    this.onListeningChange = null;

    // Auto-stop timer: voice commands hold tilt for this many ms then release
    this._holdDuration = 4000;
    this._holdTimer = null;

    this._init();
  }


  _init() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('[VoiceControl] Web Speech API not supported in this browser.');
      return;
    }

    this.isSupported = true;
    this._recognizer = new SpeechRecognition();

    // Continuous mode: keep listening after each result
    this._recognizer.continuous = true;

    // Return results as soon as speech is detected 
    this._recognizer.interimResults = false;

    this._recognizer.lang = 'en-US';

    this._recognizer.maxAlternatives = 3;

    this._recognizer.onresult = (event) => this._onResult(event);
    this._recognizer.onerror  = (event) => this._onError(event);

    // Auto-restart if the recognizer stops unexpectedly while we want it on
    this._recognizer.onend = () => {
      if (this.isListening) {
        try { this._recognizer.start(); } catch (_) {}
      }
    };
  }

  //  Public API

  start() {
    if (!this.isSupported || this.isListening) return;

    try {
      this._recognizer.start();
      this.isListening = true;
      if (this.onListeningChange) this.onListeningChange(true);
    } catch (err) {
      console.error('[VoiceControl] Could not start:', err);
    }
  }

  stop() {
    if (!this.isSupported || !this.isListening) return;

    this.isListening = false;
    this._recognizer.stop();
    this._clearTilt();
    if (this.onListeningChange) this.onListeningChange(false);
  }

  toggle() {
    this.isListening ? this.stop() : this.start();
  }

  //  Command parsing 

  _onResult(event) {
    // Iterate only the new results (not the full history)
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (!result.isFinal) continue;

      // Try each alternative transcription until a command matches
      for (let a = 0; a < result.length; a++) {
        const transcript = result[a].transcript.trim().toLowerCase();
        const matched = this._parseCommand(transcript);
        if (matched) break;
      }
    }
  }

  // Map a transcript string to tilt values.
  _parseCommand(transcript) {
    const words = transcript.split(/\s+/);

    let matched = false;

    for (const word of words) {
      switch (word) {

        case 'up':
        case 'forward':
          this.tiltX = -1;
          this.tiltZ = 0;
          matched = true;
          break;

        case 'down':
        case 'backward':
        case 'back':
          this.tiltX = 1;
          this.tiltZ = 0;
          matched = true;
          break;

        case 'left':
          this.tiltX = 0;
          this.tiltZ = 1;
          matched = true;
          break;

        case 'right':
          this.tiltX = 0;
          this.tiltZ = -1;
          matched = true;
          break;

        case 'stop':
        case 'hold':
        case 'freeze':
        case 'pause':
          this._clearTilt();
          matched = true;
          break;

        default:
          continue;
      }

      if (matched) break;
    }

    if (matched) {
      // Notify UI about the recognized command
      if (this.onCommand) this.onCommand(transcript);

      // Auto-release tilt after holdDuration ms (simulates key-release)
      this._scheduleRelease();
    }

    return matched;
  }

  // Release tilt values after a short hold period
  _scheduleRelease() {
    if (this._holdTimer) clearTimeout(this._holdTimer);
    this._holdTimer = setTimeout(() => {
      this._clearTilt();
    }, this._holdDuration);
  }

  _clearTilt() {
    this.tiltX = 0;
    this.tiltZ = 0;
    if (this._holdTimer) {
      clearTimeout(this._holdTimer);
      this._holdTimer = null;
    }
  }

  // -- Error handling 

  _onError(event) {
    // 'no-speech' and 'aborted' are normal -- ignore them
    if (event.error === 'no-speech' || event.error === 'aborted') return;
    console.error('[VoiceControl] Speech recognition error:', event.error);
  }

}