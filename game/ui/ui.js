// ============================================================
//  ui.js — Controls all DOM screens and the HUD
//  Manages: start screen, win/lose screens, score, timer, speed
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

}