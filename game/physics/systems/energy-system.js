// energy-system.js — Mechanical energy (الطاقة الميكانيكية)
// Ek = ½mv²,  Ep = mgh,  E = Ek + Ep

import { CONFIG } from '../../core/config.js';

export class EnergySystem {

  constructor() {
    const cfg = CONFIG.energy;
    this.mass = cfg.ballMass;
    this.referenceHeight = cfg.referenceHeight;
    this.initialEnergy = null;
  }

  // Ek = ½mv²
  kinetic(velocity) {
    const v = Math.sqrt(velocity.x ** 2 + velocity.z ** 2);
    return 0.5 * this.mass * v * v;
  }

  // Ep = mgh
  potential(height) {
    const h = Math.max(0, height - this.referenceHeight);
    return this.mass * CONFIG.physics.gravity * h;
  }

  total(velocity, height) {
    return this.kinetic(velocity) + this.potential(height);
  }

  // Store E₀ at level start to track ΔE (negative with friction)
  reset(velocity, height) {
    if (CONFIG.energy.trackInitialEnergy) {
      this.initialEnergy = this.total(velocity, height);
    } else {
      this.initialEnergy = null;
    }
  }

  getDeltaE(currentTotal) {
    if (this.initialEnergy == null) return 0;
    return currentTotal - this.initialEnergy;
  }

}
