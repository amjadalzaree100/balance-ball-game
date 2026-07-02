// gravity-system.js — Gravitational acceleration with rolling correction
import { CONFIG } from '../../core/config.js';   // ← سطر جديد

export class GravitySystem {
    constructor(gravity = 9.8) {
        this.gravity = gravity;
        this.rollingFactor = CONFIG.physics.rollingFactor;
    }

/**
   * a_x = g · sin(θz) · cos(θx) · rollingFactor
   * a_z = g · sin(θx) · cos(θz) · rollingFactor
   *
   * rollingFactor = to account for rolling friction and energy loss
*/
    apply(velocity, tiltX, tiltZ, delta) {
        const g  = this.gravity;
        const rf = this.rollingFactor;

        const ax = g * Math.sin(tiltZ) * Math.cos(tiltX) * rf;
        velocity.x -= ax * delta;

        const az = g * Math.sin(tiltX) * Math.cos(tiltZ) * rf;
        velocity.z += az * delta;
    }
}