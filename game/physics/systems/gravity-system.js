import { CONFIG } from '../../core/config.js';

export class GravitySystem {
    constructor() {
    }

    apply(velocity, tiltX, tiltZ, delta) {
        const g  = CONFIG.physics.gravity;
        const rf = CONFIG.physics.rollingFactor;

        const ax = g * Math.sin(tiltZ) * Math.cos(tiltX) * rf;
        velocity.x -= ax * delta;

        const az = g * Math.sin(tiltX) * Math.cos(tiltZ) * rf;
        velocity.z += az * delta;
    }
}


//============================================================
// Gravity-driven acceleration on inclined planes
//  Computes the effective acceleration components based on device tilt
//  angles, simulating a ball rolling on a tilted surface.
//
//  Physics model:
//     a_x = g · sin(θz) · cos(θx) · rollingFactor
//     a_z = g · sin(θx) · cos(θz) · rollingFactor
//    
//    rollingFactor = to account for rolling friction and energy loss
// ============================================================
// wreten by amjad