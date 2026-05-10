// physics-engine.js - Main physics engine
// Delegates to separate systems: gravity, friction, integration, collision

import * as THREE from 'three';
import { CONFIG } from '../../core/config.js';
import { GravitySystem } from '../systems/gravity-system.js';
import { FrictionSystem } from '../systems/friction-system.js';
import { IntegrationSystem } from '../systems/integration-system.js';
import { CollisionSystem } from '../systems/collision-system.js';

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
    if (inputX !== 0) {
      this.tiltX += inputX * this.tiltSpeed * delta * 60; // frame-rate independent
    } else {
      this.tiltX *= Math.pow(this.tiltReturn, delta * 60);
    }

    if (inputZ !== 0) {
      this.tiltZ += inputZ * this.tiltSpeed;
    } else {
      this.tiltZ *= this.tiltReturn;
    }

    this.tiltX = Math.max(-this.maxTiltAngle, Math.min(this.maxTiltAngle, this.tiltX));
    this.tiltZ = Math.max(-this.maxTiltAngle, Math.min(this.maxTiltAngle, this.tiltZ));
  }

  // Run one simulation step
  step(delta) {
    if (!this.ballPosition) return;

    this.gravitySystem.apply(this.velocity, this.tiltX, this.tiltZ, delta);    // Calculate acceleration
    this._clampVelocity();                                                     // Restrict the velocity
    this.integrationSystem.integrate(this.ballPosition, this.velocity, delta); // Update position based on velocity
    this.frictionSystem.apply(this.velocity, delta);                          // Apply friction to velocity

    if (this.mazeData) {
      this.collisionSystem.resolveAll(this.ballPosition, this.velocity, this.mazeData);  // Check for and resolve collisions with maze walls and bounds
    }
  }

  // Cap horizontal speed to terminalVelocity
  _clampVelocity() {
    const speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.z ** 2);
    if (speed > this.terminalVelocity) {
      const ratio = this.terminalVelocity / speed;
      this.velocity.x *= ratio;
      this.velocity.z *= ratio;
    }
  }

  reset() {
    this.velocity.set(0, 0, 0);
    this.tiltX = 0;
    this.tiltZ = 0;
  }

}