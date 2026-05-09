// collision-system.js - Orchestrates collision detection and resolution
// Uses CollisionDetector (find) + CollisionResolver (fix)

import { CollisionDetector } from '../collision/detector.js';
import { CollisionResolver } from '../collision/resolver.js';
import { CONFIG } from '../../core/config.js';

export class CollisionSystem {

  constructor() {
    this.detector = new CollisionDetector();
    this.resolver = new CollisionResolver();
  }

  // Resolve all collisions: outer bounds first, then individual walls
  resolveAll(ballPos, velocity, mazeData) {
    const { walls, bounds } = mazeData;
    const r = CONFIG.physics.ballRadius;

    if (bounds) {
      this._resolveBounds(ballPos, velocity, bounds, r);
    }

    if (walls) {
      for (const wall of walls) {
        const collision = this.detector.detectBallWall(ballPos, r, wall);
        if (collision) {
          this.resolver.resolve(ballPos, velocity, collision);
        }
      }
    }
  }

  // Keep ball within the outer maze boundary
  _resolveBounds(ballPos, velocity, bounds, r) {
    const hw = bounds.width / 2 - r;
    const hd = bounds.depth / 2 - r;

    if (ballPos.x >  hw) { ballPos.x =  hw; velocity.x *= -0.4; }
    if (ballPos.x < -hw) { ballPos.x = -hw; velocity.x *= -0.4; }
    if (ballPos.z >  hd) { ballPos.z =  hd; velocity.z *= -0.4; }
    if (ballPos.z < -hd) { ballPos.z = -hd; velocity.z *= -0.4; }
  }

}