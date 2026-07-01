// friction-system.js — Kinetic friction that never reverses velocity
import { CONFIG } from '../../core/config.js';

export class FrictionSystem {
  constructor(mu = 0.05) {
    this.mu = mu;
    this.gravity = CONFIG.physics.gravity;
  }

  apply(velocity, tiltX, tiltZ, delta) {
    const speed = Math.sqrt(velocity.x ** 2 + velocity.z ** 2);
    if (speed < 0.001) return;  // already stationary

    // Friction magnitude = mu * g * cos(tiltX) * cos(tiltZ)
    const cosTilt = Math.cos(tiltX) * Math.cos(tiltZ);
    const frictionAccel = this.mu * this.gravity * Math.abs(cosTilt);

    // Maximum friction force that can be applied without reversing velocity
    const frictionDelta = Math.min(frictionAccel * delta, speed);

    // Direction opposite to velocity
    const dirX = velocity.x / speed;
    const dirZ = velocity.z / speed;

    velocity.x -= dirX * frictionDelta;
    velocity.z -= dirZ * frictionDelta;

    // If speed fell below threshold, just zero it out
    if (Math.sqrt(velocity.x ** 2 + velocity.z ** 2) < 0.001) {
      velocity.set(0, 0, 0);
    }
  }
}