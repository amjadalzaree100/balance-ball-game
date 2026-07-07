
import * as THREE from 'three';
import { CONFIG } from '../../core/config.js';

export class BallModel {

  constructor() {
    const start = CONFIG.ball.startPosition;

    this.position = new THREE.Vector3(start.x, start.y, start.z);

    this.rotation = new THREE.Euler(0, 0, 0);

    this._rollQuat = new THREE.Quaternion();

    this.radius   = CONFIG.physics.ballRadius;
    this.isActive = true;
  }

  // Update visual roll rotation based on velocity
updateRoll(velocityX, velocityZ, delta) {
  const speed = Math.sqrt(velocityX ** 2 + velocityZ ** 2);
  if (speed < 0.001) return;

  const axis = new THREE.Vector3(-velocityZ, 0, velocityX).normalize();

  //  ω = v / r
  const omega = speed / this.radius;     
  const angle = -(omega * delta);           

  const deltaQuat = new THREE.Quaternion();
  deltaQuat.setFromAxisAngle(axis, angle);
  this._rollQuat.premultiply(deltaQuat);
}


  setRadius(radius) {
    this.radius = radius;
  }

  // Reset ball to starting position
  reset() {
    const start = CONFIG.ball.startPosition;
    this.position.set(start.x, start.y, start.z);
    this._rollQuat.identity();
    this.isActive = true;
  }

}