// Delegates to separate systems: gravity, friction, integration, collision

import * as THREE from 'three';
import { CONFIG } from '../../core/config.js';
import { GravitySystem } from '../systems/gravity-system.js';
import { FrictionSystem } from '../systems/friction-system.js';
import { IntegrationSystem } from '../systems/integration-system.js';
import { CollisionSystem } from '../systems/collision-system.js';
import { EnergySystem } from '../systems/energy-system.js';

export class PhysicsEngine {

  constructor() {
    const cfg = CONFIG.physics;

    // Current ball velocity (x and z components only -- 2D surface movement)
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.ballPosition = null;
    this.mazeData = null;

    // Tilt params (tiltSpeed / tiltReturn / maxTiltAngle) and ballRadius are
    // read from CONFIG per frame in updateTilt() / step() / _clampVelocity()
    // so the Physics Lab panel can mutate them live. We only cache
    // terminalVelocity here because it's a stable runtime cap, not a knob.
    this.terminalVelocity = cfg.terminalVelocity;

    // Independent physics sub-systems
    this.gravitySystem = new GravitySystem();
    this.frictionSystem = new FrictionSystem();
    this.integrationSystem = new IntegrationSystem();
    this.collisionSystem = new CollisionSystem();
    this.energySystem = new EnergySystem();

    // Current surface tilt angles (radians)
    this.tiltX = 0;
    this.tiltZ = 0;
  }

  // Attach ball position vector (shared reference)
  setBall(position) {
    this.ballPosition = position;
  }

  // Attach maze collision data
  setMazeData(mazeData) {
    this.mazeData = mazeData;
  }

  // Update tilt angles from input each frame
updateTilt(inputX, inputZ, delta) {
    // Read live from CONFIG so the Physics Lab panel can adjust tilt feel
    const tiltSpeed   = CONFIG.physics.tiltSpeed;
    const tiltReturn  = CONFIG.physics.tiltReturn;
    const maxTilt     = CONFIG.physics.maxTiltAngle;

    // Build raw tilt vector from input
    let rawTx = this.tiltX;
    let rawTz = this.tiltZ;

    if (inputX !== 0) {
        rawTx += inputX * tiltSpeed * delta * 60;
    } else {
        rawTx *= Math.pow(tiltReturn, delta * 60);
    }

    if (inputZ !== 0) {
        rawTz += inputZ * tiltSpeed * delta * 60;
    } else {
        rawTz *= Math.pow(tiltReturn, delta * 60);
    }

    // Limit the magnitude of the combined tilt vector to maxTiltAngle
    const mag = Math.sqrt(rawTx * rawTx + rawTz * rawTz);
    if (mag > maxTilt) {
        const scale = maxTilt / mag;
        rawTx *= scale;
        rawTz *= scale;
    }

    this.tiltX = rawTx;
    this.tiltZ = rawTz;
}
  // Run one simulation step
step(delta) {
    if (!this.ballPosition) return;

    // Sub-step to prevent tunneling at high speed.
    // At 60 FPS and a max speed of 30 m/s (from terminalVelocity), one
    // sub-step of 1/240s = 4 per frame = 30 × 1/240 = 0.125m, well
    // below the 0.5m thinnest wall. At higher FPS or with more aggressive
    // presets, this is still safe.
    const MAX_SUBSTEP_DT = 1 / 240;
    const numSubsteps = Math.max(1, Math.ceil(delta / MAX_SUBSTEP_DT));
    const subDelta = delta / numSubsteps;

    for (let i = 0; i < numSubsteps; i++) {
      this.gravitySystem.apply(this.velocity, this.tiltX, this.tiltZ, subDelta);
      this.frictionSystem.apply(this.velocity, this.tiltX, this.tiltZ, subDelta);

      this._clampVelocity();
      this.integrationSystem.integrate(this.ballPosition, this.velocity, subDelta);

      if (this.mazeData) {
        this.collisionSystem.resolveAll(this.ballPosition, this.velocity, this.mazeData);
      }
    }
}  
_clampVelocity() {
  const speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.z ** 2);
  if (speed === 0) return;

  const tiltMag = Math.sqrt(this.tiltX ** 2 + this.tiltZ ** 2);
  const dynamicCap = this.terminalVelocity * (tiltMag / CONFIG.physics.maxTiltAngle);
  const effectiveCap = Math.max(dynamicCap, 1.0); 

  if (speed > effectiveCap) {
    const ratio = effectiveCap / speed;
    this.velocity.x *= ratio;
    this.velocity.z *= ratio;
  }
}
  reset(height = 0) {
    this.velocity.set(0, 0, 0);
    this.tiltX = 0;
    this.tiltZ = 0;
    if (CONFIG.energy.enabled) {
      this.energySystem.reset(this.velocity, height);
    }
  }

  getEnergy(height) {
    const total = this.energySystem.total(this.velocity, height);
    return {
      kinetic: this.energySystem.kinetic(this.velocity),
      potential: this.energySystem.potential(height),
      total,
      delta: this.energySystem.getDeltaE(total),
      initial: this.energySystem.initialEnergy,
    };
  }

}