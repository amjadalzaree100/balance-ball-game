// ============================================================
//  ball-model.js — Pure data model for the ball
//  No Three.js here — just position, velocity state, and logic
// ============================================================

import * as THREE from 'three';
import { CONFIG } from '../../core/config.js';

export class BallModel {

  constructor() {
    const start = CONFIG.ball.startPosition;

    // World-space position (shared reference with physics engine)
    this.position = new THREE.Vector3(start.x, start.y, start.z);

    // Current roll rotation (visual only, updated each frame)
    this.rotation = new THREE.Euler(0, 0, 0);

    // Accumulated rotation quaternion for smooth rolling
    this._rollQuat = new THREE.Quaternion();

    this.radius   = CONFIG.physics.ballRadius;
    this.isActive = true;
  }

  // Update visual roll rotation based on velocity
  // Rolling = rotating around the axis perpendicular to movement direction
  updateRoll(velocityX, velocityZ, delta) {
    const speed  = Math.sqrt(velocityX ** 2 + velocityZ ** 2);
    if (speed < 0.001) return;

    // Roll axis is perpendicular to the movement direction
    const axis = new THREE.Vector3(-velocityZ, 0, velocityX).normalize();
    const angle = -(speed * delta) / this.radius;

    const deltaQuat = new THREE.Quaternion();
    deltaQuat.setFromAxisAngle(axis, angle);
    this._rollQuat.premultiply(deltaQuat);
  }

  // Reset ball to starting position
  reset() {
    const start = CONFIG.ball.startPosition;
    this.position.set(start.x, start.y, start.z);
    this._rollQuat.identity();
    this.isActive = true;
  }

}