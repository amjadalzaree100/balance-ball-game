// ============================================================
//  camera.js — Smooth camera controller
//  Follows the maze tilt with subtle lag for cinematic feel
// ============================================================

import * as THREE from 'three';
import { CONFIG } from '../core/config.js';

export class Camera {

  constructor(threeCamera) {
    this.camera = threeCamera;

    // Base position from config
    const p = CONFIG.camera.position;
    this._basePos = new THREE.Vector3(p.x, p.y, p.z);

    // Current smoothed offset
    this._offset = new THREE.Vector3();

    // Smoothing factor (0 = no smoothing, 1 = never moves)
    this._smoothing = 0.08;
  }

  // Called every frame — gently sways camera with the tilt
  update(tiltX, tiltZ) {
    // Tilt causes a subtle camera shift (parallax)
    const targetOffsetX =  tiltZ * 2.5;
    const targetOffsetZ = -tiltX * 2.0;

    // Lerp toward target offset
    this._offset.x += (targetOffsetX - this._offset.x) * this._smoothing;
    this._offset.z += (targetOffsetZ - this._offset.z) * this._smoothing;

    this.camera.position.set(
      this._basePos.x + this._offset.x,
      this._basePos.y,
      this._basePos.z + this._offset.z,
    );
    this.camera.lookAt(0, 0, 0);
  }

}