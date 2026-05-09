// integration-system.js - Euler integration: moves position by velocity * delta

export class IntegrationSystem {

  // Advance position by one time step
  integrate(position, velocity, delta) {
    position.x += velocity.x * delta;
    position.z += velocity.z * delta;
  }

}