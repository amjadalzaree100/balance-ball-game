// ============================================================
//  ui.js — Controls all DOM screens and the HUD
//  Manages: start screen, win/lose screens, score, timer, speed, energy
// ============================================================

import { CONFIG } from '../core/config.js';

export class UI {

  constructor() {
    // HUD elements
    this._scoreEl = document.getElementById('score');
    this._timerEl = document.getElementById('timer');
    this._levelEl = document.getElementById('level');

    // Screens
    this._startScreen = document.getElementById('start-screen');
    this._winScreen   = document.getElementById('win-screen');
    this._loseScreen  = document.getElementById('lose-screen');

    // Result elements
    this._finalScore = document.getElementById('final-score');
    this._finalTime  = document.getElementById('final-time');
    this._winMsg     = document.getElementById('win-message');

    // Timer state
    this._elapsed   = 0;
    this._running   = false;

    // Score state
    this._score     = 0;

    // Speed display elements
    this._speedEl   = document.getElementById('speed');
    this._speedBar  = document.getElementById('speed-bar');

    // Energy display elements
    this._energyDisplay  = document.getElementById('energy-display');
    this._energyTotal    = document.getElementById('energy-total');
    this._energyKinetic  = document.getElementById('energy-kinetic');
    this._energyPotential = document.getElementById('energy-potential');
    this._energyDelta    = document.getElementById('energy-delta');
    this._energyBreakdown = document.getElementById('energy-breakdown');
    this._energyBar      = document.getElementById('energy-bar');

    if (!CONFIG.energy.enabled) {
      this._energyDisplay.style.display = 'none';
    } else if (!CONFIG.energy.showBreakdown) {
      this._energyBreakdown.style.display = 'none';
    }
    if (!CONFIG.energy.trackInitialEnergy) {
      this._energyDelta.parentElement.style.display = 'none';
    }

    // Level selector — callback fired when a level button is clicked
    this._pickLevelCallback = null;
  }

  // ── Timer 
  startTimer() {
    this._elapsed = 0;
    this._running = true;
  }

  stopTimer() {
    this._running = false;
  }

  updateTimer(delta) {
    if (!this._running) return;
    this._elapsed += delta;
    this._timerEl.textContent = this._formatTime(this._elapsed);
  }

  _formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  getElapsed() { return this._elapsed; }

  // ── Score 
  setScore(value) {
    const newValue = Math.max(0, value);
    const isZero = (newValue === 0);

    // Apply zero-score class (red color)
    if (isZero) {
      this._scoreEl.classList.add('score-zero');
    } else {
      this._scoreEl.classList.remove('score-zero');
    }

    // Update the value
    this._score = newValue;
    this._scoreEl.textContent = this._score;

    // Flash animation only when not zero and value changed
    if (!isZero) {
      this._scoreEl.classList.remove('score-flash');
      void this._scoreEl.offsetWidth;
      this._scoreEl.classList.add('score-flash');
    }
  }

  addScore(amount) {
    this.setScore(this._score + amount);
  }

  getScore() { return this._score; }

  // ── Level display 
  setLevel(number) {
    this._levelEl.textContent = number;
  }

  // ── Speed display ─────────────────────────────────────────
  updateSpeed(speed) {
    const maxSpeed = CONFIG.physics.terminalVelocity;

    // Update the numeric value (one decimal place)
    this._speedEl.textContent = speed.toFixed(1);

    // Update the speed bar width (% of max speed)
    const percent = Math.min(100, (speed / maxSpeed) * 100);
    this._speedBar.style.width = `${percent}%`;
  }

  // ── Energy display (الطاقة الميكانيكية) ─────────────────
  updateEnergy({ kinetic, potential, total, delta, initial }) {
    if (!CONFIG.energy.enabled) return;

    this._energyTotal.textContent = total.toFixed(1);

    if (CONFIG.energy.showBreakdown) {
      this._energyKinetic.textContent = kinetic.toFixed(1);
      this._energyPotential.textContent = potential.toFixed(1);
      this._energyDelta.textContent = delta.toFixed(1);
      this._energyDelta.classList.toggle('energy-loss', delta < -0.05);
    }

    if (initial != null && initial > 0) {
      const percent = Math.min(100, (total / initial) * 100);
      this._energyBar.style.width = `${percent}%`;
    } else {
      this._energyBar.style.width = '100%';
    }
  }

  // ── Screen visibility ─────────────────────────────────────
  showStart() {
    this._setActiveScreen(this._startScreen);
  }

  showWin(score, elapsed, hasNext) {
    this._finalScore.textContent = score;
    this._finalTime.textContent  = this._formatTime(elapsed);
    this._winMsg.textContent     = hasNext ? 'Level complete!' : 'You beat all levels!';

    const nextBtn = document.getElementById('next-btn');
    nextBtn.textContent = hasNext ? 'Next Level' : 'Play Again';

    this._setActiveScreen(this._winScreen);
  }

  showLose() {
    this._setActiveScreen(this._loseScreen);
  }

  hideAllScreens() {
    [this._startScreen, this._winScreen, this._loseScreen].forEach((s) => {
      s.classList.remove('active');
    });
  }

  _setActiveScreen(screen) {
    [this._startScreen, this._winScreen, this._loseScreen].forEach((s) => {
      s.classList.remove('active');
    });
    screen.classList.add('active');
  }

  // ── Wire button callbacks from outside ────────────────────
  onStart(cb)   { document.getElementById('start-btn').addEventListener('click', cb); }
  onNext(cb)    { document.getElementById('next-btn').addEventListener('click', cb); }
  onRestartWin(cb)  { document.getElementById('restart-btn-win').addEventListener('click', cb); }
  onRestartLose(cb) { document.getElementById('restart-btn-lose').addEventListener('click', cb); }

  // ── Level selector ───────────────────────────────────────
  // Populate every `.level-buttons` container on the page with one
  // button per level.  `names` is an array of human-readable names.
  populateLevelSelector(names) {
    const containers = document.querySelectorAll('.level-buttons');
    containers.forEach((container) => {
      container.innerHTML = '';
      names.forEach((name, index) => {
        const btn = document.createElement('button');
        btn.className = 'level-btn';
        btn.type   = 'button';
        btn.dataset.level = index;
        btn.textContent = (index + 1).toString();
        btn.title = name;
        btn.addEventListener('click', () => {
          if (this._pickLevelCallback) this._pickLevelCallback(index);
        });
        container.appendChild(btn);
      });
    });
  }

  // Highlight the level button matching the given 0-based index.
  setCurrentLevel(index) {
    document.querySelectorAll('.level-btn').forEach((btn) => {
      const i = parseInt(btn.dataset.level, 10);
      btn.classList.toggle('current', i === index);
    });
  }

  // Register a callback fired when any level button is clicked.
  // The callback receives the 0-based level index.
  onPickLevel(callback) {
    this._pickLevelCallback = callback;
  }

}