// ============================================================
//  presets.js — Named physics presets for the Physics Lab
//  Each preset sets the 7 world-physics knobs.  ballMass,
//  tiltSpeed, and tiltReturn are input-feel knobs and stay
//  at whatever the user set them to.
// ============================================================

export const PRESETS = {
  earth: {
    name: 'Earth',
    values: {
      gravity:          100.0,
      friction:         0.05,
      frictionStatic:   0.08,
      viscousFriction:  0.1,
      rollingFactor:    0.9,
      bounceFactor:     0.5,
      maxTiltAngle:     0.10,
    },
  },
  ice: {
    name: 'Ice',
    values: {
      gravity:          100.0,
      friction:         0.001,
      frictionStatic:   0.006,
      viscousFriction:  0,
      rollingFactor:    0.98,
      bounceFactor:     0.2,
      maxTiltAngle:     0.10,
    },
  },
  moon: {
    name: 'Moon',
    values: {
      gravity:          16.5,   // scaled to match the game's Earth=100 baseline
      friction:         0.05,
      frictionStatic:   0.03,   // below μk on purpose — lets the ball drift on a near-flat surface
      viscousFriction:  0.02,
      rollingFactor:    0.9,
      bounceFactor:     0.5,
      maxTiltAngle:     0.10,
    },
  },
  zeroG: {
    name: 'Zero-G',
    values: {
      gravity:          0,
      friction:         0,
      frictionStatic:   0,
      viscousFriction:  0,
      rollingFactor:    0.9,
      bounceFactor:     0.98,   // near-elastic — only energy loss is wall bounces
      maxTiltAngle:     0.10,
    },
  },
  bouncy: {
    name: 'Bouncy',
    values: {
      gravity:          100.0,  // same as Earth — same world
      friction:         0.01,   // very low — ball keeps energy
      frictionStatic:   0.02,
      viscousFriction:  0.02,   // minimal air drag — critical for the bouncy feel
      rollingFactor:    0.95,   // high responsiveness
      bounceFactor:     0.92,   // very bouncy, still controllable
      maxTiltAngle:     0.15,   // steeper than Earth for dramatic action
    },
  },
};

// Display order in the panel
export const PRESET_ORDER = ['earth', 'ice', 'moon', 'zeroG', 'bouncy'];

// The 7 world-physics knobs that presets set
export const PRESET_KEYS = [
  'gravity',
  'friction',
  'frictionStatic',
  'viscousFriction',
  'rollingFactor',
  'bounceFactor',
  'maxTiltAngle',
];
