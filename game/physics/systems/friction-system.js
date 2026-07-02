import { CONFIG } from '../../core/config.js';

export class FrictionSystem {

  constructor(mu = 0.05) {
    this.mu       = CONFIG.physics.friction;
    this.muStatic = CONFIG.physics.frictionStatic;
    this.gravity  = CONFIG.physics.gravity;
  }

  apply(velocity, tiltX, tiltZ, delta) {
    const speed = Math.sqrt(velocity.x ** 2 + velocity.z ** 2);
    const g     = Math.abs(this.gravity);

    // Normal force component: N = mg * cos(θx) * cos(θz)
    const cosTilt = Math.cos(tiltX) * Math.cos(tiltZ);
    const N       = g * Math.abs(cosTilt);

    // ── Static friction check ─────────────────────────────────
    //   driving = g * sqrt(sin²(θx) + sin²(θz))
    if (speed < 0.001) {
      const sinX        = Math.sin(tiltX);
      const sinZ        = Math.sin(tiltZ);
      const drivingAccel   = g * Math.sqrt(sinX ** 2 + sinZ ** 2);
      const staticThreshold = this.muStatic * N;

      if (drivingAccel < staticThreshold) {
        // Driving force is too weak — ball stays still.
        velocity.set(0, 0, 0);
        return;
      }
      return;
    }

    // ── Kinetic friction ──────────────────────────────────────
    // F_k = μk * N 
    const frictionAccel = this.mu * N;
    const frictionDelta = Math.min(frictionAccel * delta, speed);

    // Unit vector in the direction of current motion
    const dirX = velocity.x / speed;
    const dirZ = velocity.z / speed;

    velocity.x -= dirX * frictionDelta;
    velocity.z -= dirZ * frictionDelta;

    if (Math.sqrt(velocity.x ** 2 + velocity.z ** 2) < 0.001) {
      velocity.set(0, 0, 0);
    }
  }
}


// ============================================================
//  friction-system.js — Coulomb friction model (dry friction)
//  Handles both static and kinetic friction phases.
//
//  Static  friction (μs): prevents motion when the ball is at rest
//          and the driving force is too weak to overcome the threshold.
//  Kinetic friction (μk): opposes motion once the ball is already moving,
//          decelerating it at a constant rate regardless of speed.
//
// ============================================================
// wreten by amjad 