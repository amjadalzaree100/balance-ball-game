// physics-engine.js - Main physics engine
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

    this.terminalVelocity = cfg.terminalVelocity;
    this.tiltSpeed = cfg.tiltSpeed;
    this.tiltReturn = cfg.tiltReturn;
    this.maxTiltAngle = cfg.maxTiltAngle;
    this.ballRadius = cfg.ballRadius;

    // Independent physics sub-systems
    this.gravitySystem = new GravitySystem(cfg.gravity);
    this.frictionSystem = new FrictionSystem(cfg.friction);
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
    // Build raw tilt vector from input
    let rawTx = this.tiltX;
    let rawTz = this.tiltZ;

    if (inputX !== 0) {
        rawTx += inputX * this.tiltSpeed * delta * 60;
    } else {
        rawTx *= Math.pow(this.tiltReturn, delta * 60);
    }

    if (inputZ !== 0) {
        rawTz += inputZ * this.tiltSpeed * delta * 60;
    } else {
        rawTz *= Math.pow(this.tiltReturn, delta * 60);
    }

    // Limit the magnitude of the combined tilt vector to maxTiltAngle
    const mag = Math.sqrt(rawTx * rawTx + rawTz * rawTz);
    if (mag > this.maxTiltAngle) {
        const scale = this.maxTiltAngle / mag;
        rawTx *= scale;
        rawTz *= scale;
    }

    this.tiltX = rawTx;
    this.tiltZ = rawTz;
}
  // Run one simulation step
step(delta) {
    if (!this.ballPosition) return;

    this.gravitySystem.apply(this.velocity, this.tiltX, this.tiltZ, delta);
    this.frictionSystem.apply(this.velocity, this.tiltX, this.tiltZ, delta);  

    this._clampVelocity();
    this.integrationSystem.integrate(this.ballPosition, this.velocity, delta);

    if (this.mazeData) {
        this.collisionSystem.resolveAll(this.ballPosition, this.velocity, this.mazeData);
    }
}  
_clampVelocity() {
  const speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.z ** 2);
  if (speed === 0) return;

  // السقف الديناميكي: يتناسب مع شدة الميلان الحالية
  // عند ميلان كبير → سقف أعلى
  // عند ميلان صغير → سقف أخفض
  const tiltMag = Math.sqrt(this.tiltX ** 2 + this.tiltZ ** 2);
  const dynamicCap = this.terminalVelocity * (tiltMag / this.maxTiltAngle);
  const effectiveCap = Math.max(dynamicCap, 1.0); // حد أدنى 1 لمنع التجميد

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