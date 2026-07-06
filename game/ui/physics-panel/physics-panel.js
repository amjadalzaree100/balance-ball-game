// ============================================================
//  physics-panel.js — "Physics Lab" right-edge drawer
//  Exposes 10 physics knobs, 5 presets, two reset actions,
//  and a 3D vector toggle.  All knob changes apply live — no
//  Apply button, no pause.  Panel is open by default and
//  visible on every game state.
// ============================================================

import { CONFIG } from '../../core/config.js';
import { PRESETS, PRESET_ORDER, PRESET_KEYS } from './presets.js';

// ── Knob spec ───────────────────────────────────────────────
//   configPath: which CONFIG sub-object the value lives in
//   ('energy' is the only outlier — ballMass is on CONFIG.energy)
const KNOBS = {
  gravity: {
    label: 'gravity', min: -200, max: 200, step: 0.1, unit: 'm/s²',
    formula: 'a = g · sin(θ) · cos(θ) · rollingFactor',
    configPath: 'physics',
  },
  ballMass: {
    label: 'ball mass', min: 0.01, max: 10, step: 0.01, unit: 'kg',
    formula: 'Ek = ½mv², Ep = m·g·h',
    configPath: 'energy',
  },
  friction: {
    label: 'friction (μk)', min: -0.30, max: 0.30, step: 0.001, unit: '',
    formula: 'Fk = μk · N',
    configPath: 'physics',
  },
  frictionStatic: {
    label: 'static friction (μs)', min: -0.30, max: 0.30, step: 0.001, unit: '',
    formula: 'Fs ≤ μs · N',
    configPath: 'physics',
  },
  viscousFriction: {
    label: 'viscous drag', min: -2.0, max: 2.0, step: 0.01, unit: 's⁻¹',
    formula: 'v ← v · exp(−k · dt)',
    configPath: 'physics',
  },
  rollingFactor: {
    label: 'rolling factor', min: 0, max: 1, step: 0.01, unit: '',
    formula: 'a = g · sin(θ) · cos(θ) · rollingFactor',
    configPath: 'physics',
  },
  maxTiltAngle: {
    label: 'max tilt angle', min: 0, max: 0.50, step: 0.005, unit: 'rad',
    formula: 'θ_max',
    configPath: 'physics',
  },
  tiltSpeed: {
    label: 'tilt speed', min: 0.01, max: 0.20, step: 0.005, unit: '',
    formula: 'dθ = input · tiltSpeed · dt',
    configPath: 'physics',
  },
  tiltReturn: {
    label: 'tilt return', min: 0.50, max: 0.99, step: 0.005, unit: '',
    formula: 'θ ← θ · tiltReturn^frames',
    configPath: 'physics',
  },
  bounceFactor: {
    label: 'bounce factor', min: -1, max: 1, step: 0.01, unit: '',
    formula: "v' = −bounce · v",
    configPath: 'physics',
  },
};

const SECTIONS = [
  { title: 'Gravity',      keys: ['gravity', 'ballMass'] },
  { title: 'Friction',     keys: ['friction', 'frictionStatic', 'viscousFriction', 'rollingFactor'] },
  { title: 'Tilt & Input', keys: ['maxTiltAngle', 'tiltSpeed', 'tiltReturn'] },
  { title: 'Collision',    keys: ['bounceFactor'] },
];

// Numeric precision for displaying a knob value
function formatValue(v) {
  if (Math.abs(v) >= 100) return v.toFixed(1);
  if (Math.abs(v) >= 10)  return v.toFixed(2);
  if (Math.abs(v) >= 1)   return v.toFixed(3);
  return v.toFixed(3);
}

// Snap a value into [min, max]
function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export class PhysicsPanel {

  constructor({ physics, ballController, forceVectors }) {
    this._physics = physics;
    this._ballController = ballController;
    this._forceVectors = forceVectors;
    this.activePreset = 'earth';
    this._tweenId = 0;

    this._rows = {};      // key → { slider, num, spec }
    this._presets = {};   // preset id → <button>

    this._buildDom();
    this._syncFromConfig();
    // Snapshot the boot-time values so "Reset to Defaults" can return to
    // them (Earth preset + the config.js defaults for the 3 input-feel knobs).
    this._defaults = this._snapshotConfig();
    this._wireCollapse();
    this._wireResetButtons();
    this._wireVectorToggle();
    // Highlight the default (Earth) preset on first paint
    this._syncActivePresetClass();
  }

  _snapshotConfig() {
    const out = {};
    for (const key of Object.keys(this._rows)) {
      const { spec } = this._rows[key];
      out[key] = CONFIG[spec.configPath][key];
    }
    return out;
  }

  // Keep in sync with main.js getBallTiltedY(). The energy system records
  // initialEnergy as a function of this height, so the panel's Reset Ball
  // needs to pass it the same way startGame()/restartLevel() do.
  _getBallTiltedY() {
    const bp = this._ballController.getPosition();
    const { tiltX, tiltZ } = this._physics;
    const surfaceY = bp.x * Math.sin(tiltZ) - bp.z * Math.sin(tiltX) * Math.cos(tiltZ);
    return surfaceY + CONFIG.physics.ballRadius;
  }

  // ── CONFIG + DOM I/O (used by tweens) ─────────────────────
  // _readConfig / _writeConfig handle the routing between CONFIG.physics
  // and CONFIG.energy (ballMass lives on the energy sub-object).
  _readConfig(key) {
    const { spec } = this._rows[key];
    return CONFIG[spec.configPath][key];
  }

  _writeConfig(key, value) {
    const { spec } = this._rows[key];
    CONFIG[spec.configPath][key] = value;
  }

  // Mirror a value into the row's slider + number input, skipping whichever
  // control the user is currently editing (to avoid stomping their input).
  _updateRowUI(key, value) {
    const { slider, num } = this._rows[key];
    if (document.activeElement !== slider) slider.value = value;
    if (document.activeElement !== num)    num.value    = formatValue(value);
  }

  // ── Shared tween (used by presets and Reset to Defaults) ──
  // Animates CONFIG[key] from its current value to targets[key] over
  // `duration` ms with ease-in-out. Cancels any in-flight tween via
  // the _tweenId counter so back-to-back preset clicks don't double-animate.
  // onComplete fires once the tween reaches t === 1.
  _tweenTo(targets, keys, duration = 300, onComplete) {
    const myTweenId = ++this._tweenId;
    const fromValues = {};
    keys.forEach((k) => { fromValues[k] = this._readConfig(k); });

    const start = performance.now();
    const step = () => {
      if (myTweenId !== this._tweenId) return;     // a newer tween superseded us
      const t = Math.min(1, (performance.now() - start) / duration);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      keys.forEach((k) => {
        const v = fromValues[k] + (targets[k] - fromValues[k]) * eased;
        this._writeConfig(k, v);
        this._updateRowUI(k, v);
      });
      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        // Final snap to exact target values (guards against float drift)
        keys.forEach((k) => {
          this._writeConfig(k, targets[k]);
          this._updateRowUI(k, targets[k]);
        });
        if (onComplete) onComplete();
      }
    };
    requestAnimationFrame(step);
  }

  // ── DOM construction ──────────────────────────────────────
  _buildDom() {
    const root = document.getElementById('physics-panel');
    if (!root) return;

    // Sections + knobs (built from spec)
    const body = root.querySelector('.physics-panel-body');
    body.innerHTML = '';
    for (const section of SECTIONS) {
      const sec = document.createElement('section');
      sec.className = 'physics-panel-section';

      const h = document.createElement('h3');
      h.className = 'physics-panel-section-title';
      h.textContent = section.title;
      sec.appendChild(h);

      for (const key of section.keys) {
        const spec = KNOBS[key];
        const row = document.createElement('div');
        row.className = 'physics-panel-knob';
        row.dataset.key = key;

        const top = document.createElement('div');
        top.className = 'physics-panel-knob-row';

        const label = document.createElement('label');
        label.className = 'physics-panel-knob-label';
        label.textContent = spec.label;
        top.appendChild(label);

        const num = document.createElement('input');
        num.type = 'number';
        num.className = 'physics-panel-num';
        num.min = spec.min;
        num.max = spec.max;
        num.step = spec.step;
        top.appendChild(num);

        if (spec.unit) {
          const u = document.createElement('span');
          u.className = 'physics-panel-unit';
          u.textContent = spec.unit;
          top.appendChild(u);
        }

        row.appendChild(top);

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.className = 'physics-panel-slider';
        slider.min = spec.min;
        slider.max = spec.max;
        slider.step = spec.step;
        row.appendChild(slider);

        const formula = document.createElement('div');
        formula.className = 'physics-panel-formula';
        formula.textContent = spec.formula;
        row.appendChild(formula);

        sec.appendChild(row);
        this._rows[key] = { slider, num, spec };
        this._wireRow(key);
      }
      body.appendChild(sec);
    }

    // Preset pills
    const presetsEl = root.querySelector('#physics-panel-presets');
    presetsEl.innerHTML = '';
    for (const id of PRESET_ORDER) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'physics-panel-preset';
      btn.dataset.preset = id;
      btn.textContent = PRESETS[id].name;
      btn.addEventListener('click', () => this._applyPreset(id));
      presetsEl.appendChild(btn);
      this._presets[id] = btn;
    }
  }

  // ── Per-row wiring (slider ↔ number input ↔ CONFIG) ───────
  _wireRow(key) {
    const row = this._rows[key];
    const { slider, num, spec } = row;

    const applyValue = (v, fromUser) => {
      v = clamp(parseFloat(v), spec.min, spec.max);
      if (Number.isNaN(v)) return;
      CONFIG[spec.configPath][key] = v;
      // Mirror value to both controls without re-firing events
      if (document.activeElement !== slider) slider.value = v;
      if (document.activeElement !== num)    num.value    = formatValue(v);
      if (fromUser) this._handlePostChange(key);
    };

    slider.addEventListener('input', () => {
      applyValue(slider.value, true);
    });
    num.addEventListener('change', () => {
      // Snap to bounds on commit
      applyValue(num.value, true);
      // Re-format the number in case the user typed something out of range
      num.value = formatValue(CONFIG[spec.configPath][key]);
    });
    num.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') num.blur();   // commit on Enter
    });
  }

  // Refresh the custom badge after a knob change, and enforce the
  // μs ≥ μk + 0.005 rule when the user is about to violate it.
  // The clamp is *minimal*: it only fires when the rule is about to
  // break. Lowering μk or raising μs are always safe (rule stays
  // satisfied) and the other value is left untouched.
  _handlePostChange(changedKey) {
    if (changedKey === 'friction' || changedKey === 'frictionStatic') {
      this._applyFrictionClamp(changedKey);
    }
    this._refreshCustomBadge();
  }

  _applyFrictionClamp(changedKey) {
    let muK = CONFIG.physics.friction;
    let muS = CONFIG.physics.frictionStatic;
    if (changedKey === 'friction' && muK > muS) {
      // User raised μk above μs — raise μs to keep the rule.
      muS = muK + 0.005;
    } else if (changedKey === 'frictionStatic' && muS < muK) {
      // User lowered μs below μk — lower μk to keep the rule.
      muK = muS;
    }
    if (muK !== CONFIG.physics.friction) {
      CONFIG.physics.friction = muK;
      this._updateRowUI('friction', muK);
    }
    if (muS !== CONFIG.physics.frictionStatic) {
      CONFIG.physics.frictionStatic = muS;
      this._updateRowUI('frictionStatic', muS);
    }
  }

  // ── Initial sync: read current CONFIG values into the UI ──
  _syncFromConfig() {
    for (const key of Object.keys(this._rows)) {
      const { slider, num, spec } = this._rows[key];
      const v = CONFIG[spec.configPath][key];
      slider.value = v;
      num.value    = formatValue(v);
    }
    // Show Vectors checkbox
    const cb = document.getElementById('show-vectors');
    if (cb) cb.checked = !!CONFIG.physics.showVectors;
  }

  // ── Presets ───────────────────────────────────────────────
  _applyPreset(id) {
    if (!PRESETS[id]) return;
    this.activePreset = id;
    this._refreshCustomBadge();   // clear stale badge from prior preset

    this._tweenTo(PRESETS[id].values, PRESET_KEYS, 300, () => {
      this._refreshCustomBadge();
      this._syncActivePresetClass();
    });
  }

  // After any change, mark the active preset as 'custom' if values diverge
  _refreshCustomBadge() {
    // Clear custom badge from all presets first (#2 — prevents stale
    // badges from accumulating when switching from a customised preset).
    Object.values(this._presets).forEach((btn) => {
      btn.classList.remove('physics-panel-preset-custom');
    });
    // Then re-add it on the active preset if its values diverge.
    if (this._isActivePresetCustom()) {
      const active = this._presets[this.activePreset];
      if (active) active.classList.add('physics-panel-preset-custom');
    }
  }

  // Returns true if any of the 7 world-physics keys differs from the active
  // preset's value by more than ε = 0.005.
  _isActivePresetCustom() {
    if (!this.activePreset || !PRESETS[this.activePreset]) return false;
    const EPS = 0.005;
    const presetVals = PRESETS[this.activePreset].values;
    for (const key of PRESET_KEYS) {
      if (Math.abs(CONFIG.physics[key] - presetVals[key]) > EPS) return true;
    }
    return false;
  }

  // Sync the .active class to whichever preset is currently selected.
  // Called whenever activePreset changes (preset click, reset, initial state).
  _syncActivePresetClass() {
    Object.entries(this._presets).forEach(([id, btn]) => {
      btn.classList.toggle('active', id === this.activePreset);
    });
  }

  // ── Toggle: Show Vectors ─────────────────────────────────
  _wireVectorToggle() {
    const cb = document.getElementById('show-vectors');
    if (!cb) return;
    cb.addEventListener('change', () => {
      CONFIG.physics.showVectors = cb.checked;
      if (this._forceVectors) {
        this._forceVectors.setVisible(cb.checked);
      }
    });
    // Make sure the arrows reflect the current state on boot
    if (this._forceVectors) {
      this._forceVectors.setVisible(!!CONFIG.physics.showVectors);
    }
  }

  // ── Reset buttons ─────────────────────────────────────────
  _wireResetButtons() {
    const resetBall = document.getElementById('physics-reset-ball');
    if (resetBall) {
      resetBall.addEventListener('click', () => {
        if (this._ballController) this._ballController.reset();
        // Mirror the startGame/restartLevel pattern in main.js: reset physics
        // with the tilted-Y of the ball at the start position so the energy
        // system records a correct initialEnergy (otherwise ΔE shows a
        // phantom positive spike of m*g*0.4 right after a reset).
        if (this._physics) this._physics.reset(this._getBallTiltedY());
      });
    }
    const resetDefaults = document.getElementById('physics-reset-defaults');
    if (resetDefaults) {
      resetDefaults.addEventListener('click', () => {
        this.activePreset = 'earth';
        this._tweenTo(this._defaults, Object.keys(this._rows), 300, () => {
          this._refreshCustomBadge();
          this._syncActivePresetClass();
        });
      });
    }
  }

  // ── Panel collapse/expand ─────────────────────────────────
  _wireCollapse() {
    const toggle = document.getElementById('physics-panel-toggle');
    const panel  = document.getElementById('physics-panel');
    if (!toggle || !panel) return;
    const syncToggle = () => {
      // Place the toggle on the panel's left edge when open,
      // or at the screen's right edge when collapsed.
      // Read the live panel width so future CSS width changes are
      // picked up automatically (#18 — no more hardcoded 356).
      const isCollapsed = panel.classList.contains('collapsed');
      const offset = (isCollapsed ? 16 : panel.offsetWidth + 16);
      toggle.style.right = offset + 'px';
      // Shift the mic button out of the panel's footer when open (#11)
      document.body.classList.toggle('physics-panel-open', !isCollapsed);
    };
    syncToggle();   // initial position
    toggle.addEventListener('click', () => {
      panel.classList.toggle('collapsed');
      syncToggle();
    });
  }
}

