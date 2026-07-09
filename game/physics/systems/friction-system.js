import { CONFIG } from '../../core/config.js';

export class FrictionSystem {

  constructor() {
  }

  apply(velocity, tiltX, tiltZ, delta) {
    const speed = Math.sqrt(velocity.x ** 2 + velocity.z ** 2);
    const gRaw  = CONFIG.physics.gravity;
    const g     = Math.abs(gRaw);

    // Normal force component: N = |g| · cos(θx) · cos(θz)
    const cosTilt = Math.cos(tiltX) * Math.cos(tiltZ);
    const N       = g * Math.abs(cosTilt);

    // ── Static friction  
    // √( (g·sin θx)² + (g·sin θz)² )  <  μs · g · |cos θx · cos θz|
    if (speed < 0.001) {
      const sinX        = Math.sin(tiltX);
      const sinZ        = Math.sin(tiltZ);
      const drivingAccel   = gRaw * Math.sqrt(sinX ** 2 + sinZ ** 2);
      const staticThreshold = CONFIG.physics.frictionStatic * N;

      if (Math.abs(drivingAccel) < staticThreshold) {
        velocity.set(0, 0, 0);
        return;
      }
      return;
    }



    // ── Kinetic (dry) friction 
    // F_k = μk * N
    const frictionAccel = CONFIG.physics.friction * N;
    const frictionDelta = Math.min(frictionAccel * delta, speed);

    const dirX = velocity.x / speed;
    const dirZ = velocity.z / speed;

    velocity.x -= dirX * frictionDelta;
    velocity.z -= dirZ * frictionDelta;



    // ── Viscous drag    
    if (CONFIG.physics.viscousFriction > 0) {
      //  exp(-k * dt)
      const decay = Math.exp(-CONFIG.physics.viscousFriction * delta);
      velocity.x *= decay;
      // velocity.z *= decay;
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