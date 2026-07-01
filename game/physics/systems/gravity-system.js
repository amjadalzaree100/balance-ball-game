// gravity-system.js — Gravitational acceleration with full coupling
export class GravitySystem {
  constructor(gravity = 9.8) {
    this.gravity = gravity;
  }

  /**
   * Compute gravitational acceleration components.
   * a_x = g * sin(tiltZ) * cos(tiltX)   (corrected for cross-tilt)
   * a_z = g * sin(tiltX) * cos(tiltZ)
   */
  apply(velocity, tiltX, tiltZ, delta) {
    const g = this.gravity;

    // X axis affected by tiltZ, corrected by tiltX
    const ax = g * Math.sin(tiltZ) * Math.cos(tiltX);
    velocity.x -= ax * delta;

    // Z axis affected by tiltX, corrected by tiltZ
    const az = g * Math.sin(tiltX) * Math.cos(tiltZ);
    velocity.z += az * delta;
  }
}