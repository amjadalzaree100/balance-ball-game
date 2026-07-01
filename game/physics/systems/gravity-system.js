// gravity-system.js
export class GravitySystem {
  constructor(gravity = 9.8) {
    this.gravity = gravity;
  }

  // Apply only the gravitational acceleration along the tilted plane
  apply(velocity, tiltX, tiltZ, delta) {
    const g = this.gravity;

    // X axis affected by tiltZ (sideways tilt)
    velocity.x -= Math.sin(tiltZ) * g * delta;

    // Z axis affected by tiltX (forward/backward tilt)
    velocity.z += Math.sin(tiltX) * g * delta;
  }
}