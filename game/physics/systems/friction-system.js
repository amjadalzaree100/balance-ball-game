// friction-system.js
export class FrictionSystem {
  constructor(friction = 0.98) {
    this.friction = friction;
  }

  apply(velocity, delta) {
    // Frame-rate independent friction using exponential decay
    const f = Math.pow(this.friction, delta * 60);
    velocity.x *= f;
    velocity.z *= f;
    }
}