// ============================================================
//  controls.js — Reads keyboard input
//  Gives you values between -1 and 1 for each axis
// ============================================================

export class Controls {

  constructor() {
    // State of pressed keys
    this._keys = new Set();

    // Bind events
    window.addEventListener('keydown', (e) => this._keys.add(e.code));
    window.addEventListener('keyup',   (e) => this._keys.delete(e.code));

    // Prevent page scrolling with arrow keys
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) {
        e.preventDefault();
      }
    });
  }

  // Is the key currently pressed?
  isDown(code) {
    return this._keys.has(code);
  }

  // ── Tilt on X axis (Forward / Backward) ──────────────────
  // Positive value = backward, negative = forward
  getTiltX() {
    let v = 0;
    if (this.isDown('ArrowUp')   || this.isDown('KeyW')) v -= 1;
    if (this.isDown('ArrowDown') || this.isDown('KeyS')) v += 1;
    return v;
  }

  // ── Tilt on Z axis (Left / Right) ──────────────────
  // Positive value = right, negative = left
  getTiltZ() {
    let v = 0;
    if (this.isDown('ArrowLeft')  || this.isDown('KeyA')) v += 1;
    if (this.isDown('ArrowRight') || this.isDown('KeyD')) v -= 1;
    return v;
  }

  // Clean up events (useful when resetting the game)
  dispose() {
    this._keys.clear();
  }

}