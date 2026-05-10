// resolver.js - Resolves ball-wall collision by repositioning and reflecting velocity

import { CONFIG } from '../../core/config.js';

export class CollisionResolver {

  constructor() {
    this.bounceFactor = 0.3; // Fraction of velocity reflected on impact
  }

  // Push ball outside the wall and partially reflect its velocity.
  // ballPos and velocity are modified in place.
  resolve(ballPos, velocity, collisionData) {
    const { wall, axis } = collisionData;
    const r = CONFIG.physics.ballRadius;
    const { minX, maxX, minZ, maxZ } = wall;

    switch (axis) {
      case 'left':
        ballPos.x  = minX - r;
        velocity.x = Math.abs(velocity.x) * -this.bounceFactor;
        break;
      case 'right':
        ballPos.x  = maxX + r;
        velocity.x = -Math.abs(velocity.x) * this.bounceFactor;
        break;
      case 'top':
        ballPos.z  = minZ - r;
        velocity.z = Math.abs(velocity.z) * -this.bounceFactor;
        break;
      case 'bottom':
        ballPos.z  = maxZ + r;
        velocity.z = -Math.abs(velocity.z) * this.bounceFactor;
        break;
    }
  }

}