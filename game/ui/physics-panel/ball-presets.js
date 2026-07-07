// ============================================================
//  ball-presets.js — Ball type presets for the Physics Lab
//  Each preset sets ball radius, mass, friction feel, bounce,
//  and visual appearance (handled by ball-renderer).
// ============================================================

export const BALL_PRESETS = {
  classic: {
    name: 'Classic',
    icon: '⚪',
    tagline: 'Chrome metal ball',
    accent: '#00e5ff',
    visual: {
      type: 'classic',
      color: 0xffffff,
      metalness: 0.9,
      roughness: 0.1,
      glowColor: 0x00e5ff,
      showRing: true,
    },
    physics: {
      ballRadius: 0.6,
      ballMass: 1.0,
      friction: 0.05,
      frictionStatic: 0.08,
      viscousFriction: 0.1,
      rollingFactor: 0.9,
      bounceFactor: 0.5,
    },
  },
  football: {
    name: 'Football',
    icon: '⚽',
    tagline: 'Light · moderate grip',
    accent: '#f5f5f5',
    visual: {
      type: 'football',
      color: 0xffffff,
      metalness: 0.05,
      roughness: 0.85,
      glowColor: 0x4caf50,
      showRing: false,
    },
    physics: {
      ballRadius: 0.50,
      ballMass: 0.43,
      friction: 0.05,
      frictionStatic: 0.08,
      viscousFriction: 0.08,
      rollingFactor: 0.88,
      bounceFactor: 0.65,
    },
  },
  basketball: {
    name: 'Basketball',
    icon: '🏀',
    tagline: 'Bouncy · rubber grip',
    accent: '#ff6d00',
    visual: {
      type: 'basketball',
      color: 0xff6d00,
      metalness: 0.02,
      roughness: 0.75,
      glowColor: 0xff9100,
      showRing: false,
    },
    physics: {
      ballRadius: 0.52,
      ballMass: 0.60,
      friction: 0.06,
      frictionStatic: 0.08,
      viscousFriction: 0.05,
      rollingFactor: 0.92,
      bounceFactor: 0.82,
    },
  },
  tennis: {
    name: 'Tennis',
    icon: '🎾',
    tagline: 'Tiny · fuzzy · light',
    accent: '#c6e800',
    visual: {
      type: 'tennis',
      color: 0xc6e800,
      metalness: 0.0,
      roughness: 0.95,
      glowColor: 0xaeea00,
      showRing: false,
    },
    physics: {
      ballRadius: 0.28,
      ballMass: 0.058,
      friction: 0.04,
      frictionStatic: 0.08,
      viscousFriction: 0.15,
      rollingFactor: 0.85,
      bounceFactor: 0.75,
    },
  },
  bowling: {
    name: 'Bowling',
    icon: '🎳',
    tagline: 'Heavy · low bounce',
    accent: '#311b92',
    visual: {
      type: 'bowling',
      color: 0x1a237e,
      metalness: 0.35,
      roughness: 0.25,
      glowColor: 0x7c4dff,
      showRing: false,
    },
    physics: {
      ballRadius: 0.48,
      ballMass: 7.0,
      friction: 0.07,
      frictionStatic: 0.08,
      viscousFriction: 0.02,
      rollingFactor: 0.95,
      bounceFactor: 0.15,
    },
  },
};

export const BALL_PRESET_ORDER = ['classic', 'football', 'basketball', 'tennis', 'bowling'];

// Knobs that ball presets set (ballMass lives on CONFIG.energy)
export const BALL_PRESET_KEYS = [
  'ballRadius',
  'ballMass',
  'friction',
  'frictionStatic',
  'viscousFriction',
  'rollingFactor',
  'bounceFactor',
];

// Map preset keys to CONFIG paths (mirrors physics-panel KNOBS routing)
export const BALL_PRESET_CONFIG_PATH = {
  ballRadius: 'physics',
  ballMass: 'energy',
  friction: 'physics',
  frictionStatic: 'physics',
  viscousFriction: 'physics',
  rollingFactor: 'physics',
  bounceFactor: 'physics',
};
