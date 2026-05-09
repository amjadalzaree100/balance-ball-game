// friction-system.js
export class FrictionSystem {
  constructor(friction = 0.98) {
    this.friction = friction;
  }

  apply(velocity) {
    velocity.x *= this.friction;
    velocity.z *= this.friction;
  }
}