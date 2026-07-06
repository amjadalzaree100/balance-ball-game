import { CONFIG } from '../../core/config.js';

export class FrictionSystem {

  constructor(mu = 0.05) {
    // No state — all values are read from CONFIG in apply()
  }

  apply(velocity, tiltX, tiltZ, delta) {
    const speed = Math.sqrt(velocity.x ** 2 + velocity.z ** 2);
    const gRaw  = CONFIG.physics.gravity;
    const g     = Math.abs(gRaw);

    // Normal force component: N = |g| · cos(θx) · cos(θz)
    const cosTilt = Math.cos(tiltX) * Math.cos(tiltZ);
    const N       = g * Math.abs(cosTilt);

    // ── Static friction check ─────────────────────────────
    // Ball stays still if |g · sin(θ)| < μs · N.
    // Using |g| (not signed g) keeps the check symmetric in worlds
    // where gravity is inverted.
    if (speed < 0.001) {
      const sinX        = Math.sin(tiltX);
      const sinZ        = Math.sin(tiltZ);
      const drivingAccel   = gRaw * Math.sqrt(sinX ** 2 + sinZ ** 2);
      const staticThreshold = CONFIG.physics.frictionStatic * N;

      if (Math.abs(drivingAccel) < staticThreshold) {
        // Driving force is too weak — ball stays still.
        velocity.set(0, 0, 0);
        return;
      }
      return;
    }

    // ── Kinetic (dry) friction ──────────────────────────────────────
    // F_k = μk * N
    const frictionAccel = CONFIG.physics.friction * N;
    const frictionDelta = Math.min(frictionAccel * delta, speed);

    // Unit vector in the direction of current motion
    const dirX = velocity.x / speed;
    const dirZ = velocity.z / speed;

    velocity.x -= dirX * frictionDelta;
    velocity.z -= dirZ * frictionDelta;

    // ── Viscous drag    ───────────────────────────────
    if (CONFIG.physics.viscousFriction > 0) {
      // Exponential decay factor: exp(-k * dt)
      const decay = Math.exp(-CONFIG.physics.viscousFriction * delta);
      velocity.x *= decay;
      velocity.z *= decay;
    }

        // ── Dead-zone for negligible speeds ───────────────────────
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
//  Viscous drag (kViscous): adds exponential decay to velocity,
//          simulating air resistance or lubricated surfaces.
//
// ============================================================
// written by amjad