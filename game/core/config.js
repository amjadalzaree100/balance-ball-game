// ============================================================
//  config.js — All game constants in one place
//  Modify the values here to easily change the game behavior
// ============================================================

export const CONFIG = {

  // ── Physics ──────────────────────────────────────────────
  physics: {
    gravity: 100.0,           // Gravity strength (m/s²)
    friction: 0.98,        // Friction coefficient (1 = no friction, 0 = instant stop)
    maxTiltAngle: 0.10,     // Maximum tilt angle of the surface (radians ≈ 25°)
    tiltSpeed: 0.04,        // Tilt speed when pressing keys
    tiltReturn: 0.92,       // Speed of surface returning to level after releasing keys
    ballRadius: 0.6,        // Ball radius
    terminalVelocity: 85,   // Maximum ball speed
  },

  // ── Ball ────────────────────────────────────────────────
  ball: {
    startPosition: { x: 0, y: 1, z: 0 },  // Start position
    color: 0xffffff,
    metalness: 0.9,
    roughness: 0.1,
  },

  // ── Maze / Surface ────────────────────────────────────
  maze: {
    wallHeight: 0.8,
    wallThickness: 0.3,
    wallColor: 0x1a237e,       // Walls color
    floorColor: 0x0d1117,      // Floor color
    holeColor: 0x000000,       // Holes color
    goalColor: 0x00e5ff,       // Goal color
  },

  // ── Camera ─────────────────────────────────────────────
  camera: {
    fov: 60,
    near: 0.1,
    far: 1000,
    position: { x: 0, y: 18, z: 14 },  // Camera position
    lookAt: { x: 0, y: 0, z: 0 },
  },

  // ── Lighting ──────────────────────────────────────────────
  lighting: {
    ambientColor: 0x334155,
    ambientIntensity: 1.5,
    directionalColor: 0xffffff,
    directionalIntensity: 2.5,
    directionalPosition: { x: 10, y: 20, z: 10 },
    pointLightColor: 0x00e5ff,
    pointLightIntensity: 2,
  },

  // ── Game ───────────────────────────────────────────────
  game: {
    fallThreshold: -5,      // Height below which the ball is considered fallen
    goalRadius: 0.6,        // Goal area radius
    scorePerLevel: 500,    // Base points for completing the level
    timePenalty: 10,         // Points deducted per second
  },

};