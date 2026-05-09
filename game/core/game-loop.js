// game-loop.js - Main game loop
// Runs update() and render() repeatedly (~60 times per second)

export class GameLoop {

  constructor() {
    this._callbacks = [];   // Functions called each frame
    this._animId    = null; // requestAnimationFrame handle
    this._lastTime  = 0;    // Timestamp of the previous frame
    this._running   = false;
    this._maxDelta  = 0.05; // Max deltaTime to avoid large jumps when tab is inactive
  }

  // Register a callback to run every frame: callback(deltaTime)
  add(callback) {
    this._callbacks.push(callback);
  }

  // Remove a previously registered callback
  remove(callback) {
    this._callbacks = this._callbacks.filter((cb) => cb !== callback);
  }

  // Start the loop
  start() {
    if (this._running) return;
    this._running  = true;
    this._lastTime = performance.now();
    this._tick(this._lastTime);
  }

  // Stop the loop
  stop() {
    this._running = false;
    if (this._animId) {
      cancelAnimationFrame(this._animId);
      this._animId = null;
    }
  }

  // Internal tick executed each animation frame
  _tick(timestamp) {
    if (!this._running) return;

    // Elapsed time since last frame in seconds
    let deltaTime = (timestamp - this._lastTime) / 1000;

    // Clamp to avoid physics explosion after tab switch
    deltaTime = Math.min(deltaTime, this._maxDelta);

    this._lastTime = timestamp;

    for (const cb of this._callbacks) {
      cb(deltaTime);
    }

    this._animId = requestAnimationFrame((t) => this._tick(t));
  }

}