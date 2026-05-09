// gravity-system.js
export class GravitySystem {
  constructor(gravity = 9.8) {
    this.gravity = gravity;
  }

  apply(velocity, tiltX, tiltZ, delta) {
    // عكس الإشارة لتتوافق حركة الكرة مع اتجاه ميل اللوحة
    velocity.x -= Math.sin(tiltZ) * this.gravity * delta;
    velocity.z += Math.sin(tiltX) * this.gravity * delta;
  }
} 