// ============================================================
//  ball-controller.js — Orchestrates ball model + renderer
//  Bridges the physics engine output → visual update
// ============================================================

import { CONFIG } from '../../core/config.js';
import { BallModel }    from './ball-model.js';
import { BallRenderer } from './ball-renderer.js';

export class BallController {

  constructor(scene, physicsEngine) {
    this.model    = new BallModel();
    this.renderer = new BallRenderer(scene);
    this.physics  = physicsEngine;

    // Give the physics engine a direct reference to ball position
    this.physics.setBall(this.model.position);
  }

  // Called every frame after physics.step()
  update(delta) {
    const vx = this.physics.velocity.x;
    const vz = this.physics.velocity.z;

    // Update rolling rotation in the model
    this.model.updateRoll(vx, vz, delta);

    // Sync visuals
    this.renderer.update(this.model, vx, vz, delta);
  }

  // Returns current world-space ball position
  getPosition() {
    return this.model.position;
  }

  // Full reset — position + physics velocity
  reset() {
    this.model.reset();
    this.physics.reset();
    this.physics.setBall(this.model.position);
  }

  applyBallPreset(preset) {
    const r = preset.physics.ballRadius;
    CONFIG.physics.ballRadius = r;
    this.model.setRadius(r);
    this.renderer.applyPreset(preset);
  }

  dispose() {
    this.renderer.dispose();
  }

}