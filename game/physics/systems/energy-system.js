// Ek = ½mv²,  Ep = mgh,  E = Ek + Ep

import { CONFIG } from '../../core/config.js';

export class EnergySystem {

  constructor() {
    // referenceHeight is a level constant; mass and gravity are read
    // from CONFIG per call in kinetic() / potential() so live changes
    // (e.g. from the Physics Lab panel) are reflected immediately.
    this.referenceHeight = CONFIG.energy.referenceHeight;
    this.initialEnergy = null;
  }

  // Ek = ½mv²
  kinetic(velocity) {
    const v = Math.sqrt(velocity.x ** 2 + velocity.z ** 2);
    return 0.5 * CONFIG.energy.ballMass * v * v;
  }

  // Ep = mgh
  potential(height) {
    const h = Math.max(0, height - this.referenceHeight);
    return CONFIG.energy.ballMass * CONFIG.physics.gravity * h;
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
