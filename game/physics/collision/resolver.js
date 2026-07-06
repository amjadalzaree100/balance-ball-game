// resolver.js - Resolves ball-wall collision by repositioning and reflecting velocity

import { CONFIG } from '../../core/config.js';

export class CollisionResolver {

  constructor() {
    // No cached constants — bounceFactor is read from CONFIG per
    // resolve() call so the Physics Lab panel can mutate it live.
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
        velocity.x = -velocity.x * CONFIG.physics.bounceFactor;
        break;
      case 'right':
        ballPos.x  = maxX + r;
        velocity.x = -velocity.x * CONFIG.physics.bounceFactor;
        break;
      case 'top':
        ballPos.z  = minZ - r;
        velocity.z = -velocity.z * CONFIG.physics.bounceFactor;
        break;
      case 'bottom':
        ballPos.z  = maxZ + r;
        velocity.z = -velocity.z * CONFIG.physics.bounceFactor;
        break;
    }
  }

}