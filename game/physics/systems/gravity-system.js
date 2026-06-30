// gravity-system.js
export class GravitySystem {
    constructor(gravity = 9.8) {
        this.gravity = gravity;
    }

    apply(velocity, tiltX, tiltZ, delta) {
        // reverse the sign to let the ball movement match the tilt
        velocity.x -= Math.sin(tiltZ) * this.gravity * delta;
        velocity.z += Math.sin(tiltX) * this.gravity * delta;
    }
}
