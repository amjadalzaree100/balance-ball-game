// ============================================================
//  controls.js — Reads keyboard and mouse input
//  Gives you values between -1 and 1 for each tilt axis
// ============================================================

export class Controls {

  constructor() {
    // State of pressed keys
    this._keys = new Set();

    // Mouse state
    this._mouseX = 0;          // Horizontal mouse position (-1 left … 1 right)
    this._mouseY = 0;          // Vertical mouse position (-1 top … 1 bottom)
    this._mouseSensitivity = 0.7;  // Multiplier for mouse input (reduced from 1.0)
    this._mouseDeadZone   = 0.25;  // 25% dead zone around screen center
    this._mouseEnabled    = false; // Default OFF — press M to enable
    this.onMouseEnabledChange = null; // Optional UI hook (assign a function)
    this._prevGamepadButtons = [];   // previous frame button states
    this._actionCallback = null; // callback for X / Enter actions

    // ── Keyboard events ────────────────────────────────
    window.addEventListener('keydown', (e) => {
      this._keys.add(e.code);

      // Fire unified action callback on Enter
      if (e.code === 'Enter' && this._actionCallback) {
        e.preventDefault();
        this._actionCallback();
      }

      // M toggles mouse tilt (ignore if a modifier is held)
      if (e.code === 'KeyM' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        this.setMouseEnabled(!this._mouseEnabled);
        return;
      }

      // Prevent page scrolling with arrow keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => this._keys.delete(e.code));

    // Bind mouse movement
    window.addEventListener('mousemove', (e) => this._onMouseMove(e));

    // Voice control tilt values -- set externally by VoiceControl each frame
    // These are added on top of keyboard / mouse / gamepad input
    this._voiceTiltX = 0;
    this._voiceTiltZ = 0;
  }
  // -- Mouse move handler
  // Converts screen coordinates to normalized range -1 to 1
  _onMouseMove(event) {
    this._mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    this._mouseY = (event.clientY / window.innerHeight) * 2 - 1;
  }

  // ── Remap a value in [-1, 1] through a centered dead zone ─────
  // Values inside the dead zone become 0; the outer range is stretched
  // back into [-1, 1] so the response is still smooth at the edges.
  _remapWithDeadZone(v) {
    const dz = this._mouseDeadZone;
    if (Math.abs(v) < dz) return 0;
    const sign = v < 0 ? -1 : 1;
    return sign * (Math.abs(v) - dz) / (1 - dz);
  }

  // ── Enable / disable mouse control ─────────────────────────
  setMouseEnabled(enabled) {
    this._mouseEnabled = !!enabled;
    if (this.onMouseEnabledChange) this.onMouseEnabledChange(this._mouseEnabled);
  }

  // ── Current mouse-enabled state ────────────────────────────
  isMouseEnabled() { return this._mouseEnabled; }

  // ── Is the key currently pressed? ─────────────────────────
  isDown(code) {
    return this._keys.has(code);
  }

  // ── Gamepad support ─────────────────────────────────────────
  _getGamepadInput() {
    const gamepads = navigator.getGamepads();
    const gamepad = gamepads[0]; // 

    if (!gamepad) return { x: 0, z: 0 };

    const stickX = gamepad.axes[0] || 0;
    const stickY = gamepad.axes[1] || 0;

    let dPadX = 0;
    let dPadY = 0;
    if (gamepad.buttons[12]?.pressed) dPadY = -1; // up
    if (gamepad.buttons[13]?.pressed) dPadY = 1;  // down
    if (gamepad.buttons[14]?.pressed) dPadX = -1; // left
    if (gamepad.buttons[15]?.pressed) dPadX = 1;  // right

    // Use stick input if above threshold, otherwise fall back to D-pad
    const x = Math.abs(stickX) > 0.1 ? stickX : dPadX;
    const z = Math.abs(stickY) > 0.1 ? stickY : dPadY;

    return { x, z };
  }

  // ── Register action button callback (X / Enter) ──────────
  onAction(callback) {
    this._actionCallback = callback;
  }

  // ── Check gamepad buttons (call every frame) ──────────────
  _updateGamepadButtons() {
    const gamepads = navigator.getGamepads();
    const gamepad = gamepads[0];
    if (!gamepad) {
      this._prevGamepadButtons = [];
      return;
    }

    // Detect X button press (index 0) going from released → pressed
    const wasPressed = this._prevGamepadButtons[0] === true;
    const isPressed = gamepad.buttons[0]?.pressed === true;

    if (isPressed && !wasPressed && this._actionCallback) {
      this._actionCallback();
    }

    // Save current state for next frame
    this._prevGamepadButtons = gamepad.buttons.map(b => b.pressed);
  }
  // -- Receive tilt values from VoiceControl each frame
  setVoiceTilt(x, z) {
    this._voiceTiltX = x;
    this._voiceTiltZ = z;
  }

  // ?? Tilt on X axis (Forward / Backward) ??????????????????
  // Positive value = backward, negative = forward
  getTiltX() {
    let v = 0;

    // Keyboard input
    if (this.isDown('ArrowUp') || this.isDown('KeyW')) v -= 1;
    if (this.isDown('ArrowDown') || this.isDown('KeyS')) v += 1;

    // Mouse input: moving mouse up → negative tiltX (forward)
    if (this._mouseEnabled) {
      v += this._remapWithDeadZone(this._mouseY) * this._mouseSensitivity;
    }

    // add gamepad input
    const gp = this._getGamepadInput();
    v += gp.z;

    // Add voice command tilt (overrides if voice says a direction)
    v += this._voiceTiltX;

    return v;
  }

  // ── Tilt on Z axis (Left / Right) ──────────────────────
  // Positive value = right, negative = left
  getTiltZ() {
    let v = 0;

    // Keyboard input
    if (this.isDown('ArrowLeft') || this.isDown('KeyA')) v += 1;
    if (this.isDown('ArrowRight') || this.isDown('KeyD')) v -= 1;

    // Mouse input: moving mouse right → positive tiltZ (right)
    if (this._mouseEnabled) {
      v -= this._remapWithDeadZone(this._mouseX) * this._mouseSensitivity;
    }

    // add gamepad input
    const gp = this._getGamepadInput();
    v -= gp.x;

    // Add voice command tilt
    v += this._voiceTiltZ;

    return v;
  }

  // Clean up events (useful when resetting the game)
  dispose() {
    this._keys.clear();
  }

  // ── Call every frame (even outside PLAYING state) ─────────
  update() {
    this._updateGamepadButtons();
  }


  
}