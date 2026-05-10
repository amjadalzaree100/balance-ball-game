// ============================================================
//  ball-renderer.js — Creates and updates the 3D ball mesh
//  Handles visual-only concerns: mesh, glow, trail effect
// ============================================================

import * as THREE from 'three';
import { CONFIG } from '../../core/config.js';

export class BallRenderer {

  constructor(scene) {
    this.scene   = scene;
    this.mesh    = null;
    this.glowMesh = null;

    // Trail: array of small fading spheres
    this._trail      = [];
    this._trailMax   = 12;
    this._trailTimer = 0;
    this._trailInterval = 0.03; // seconds between trail dots

    this._build();
  }

  // ── Build the ball mesh with layered materials ─────────────
  _build() {
    const r = CONFIG.physics.ballRadius;

    // Outer shell — chrome-like reflective sphere
    const geo = new THREE.SphereGeometry(r, 64, 64);
    const mat = new THREE.MeshStandardMaterial({
      color:      0xfafafa,
      metalness:  0.95,
      roughness:  0.05,
      envMapIntensity: 1.5,
    });

    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.castShadow    = true;
    this.mesh.receiveShadow = false;

    // Subtle equator line — adds visual interest when rolling
    const ringGeo = new THREE.TorusGeometry(r * 1.01, 0.02, 8, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color:       0x00e5ff,
      transparent: true,
      opacity:     0.6,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    this.mesh.add(ring);

    // Glow sprite — soft cyan halo beneath the ball
    const glowGeo = new THREE.SphereGeometry(r * 1.2, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color:       0x00e5ff,
      transparent: true,
      opacity:     0.08,
      side:        THREE.BackSide,
    });
    this.glowMesh = new THREE.Mesh(glowGeo, glowMat);

    this.scene.add(this.mesh);
    this.scene.add(this.glowMesh);
  }

  // ── Sync mesh position and rotation from the model ────────
  update(ballModel, velocityX, velocityZ, delta) {
    const p = ballModel.position;

    this.mesh.position.set(p.x, p.y, p.z);
    this.mesh.quaternion.copy(ballModel._rollQuat);

    // Keep glow centered on ball, slightly below
    this.glowMesh.position.set(p.x, p.y - 0.1, p.z);

    // Pulse glow opacity with speed
    const speed = Math.sqrt(velocityX ** 2 + velocityZ ** 2);
    this.glowMesh.material.opacity = 0.05 + (speed / 15) * 0.15;

    // Update motion trail
    this._updateTrail(p, speed, delta);
  }

  // ── Spawn and fade small trail dots behind the ball ────────
  _updateTrail(position, speed, delta) {
    this._trailTimer += delta;

    if (speed > 2 && this._trailTimer >= this._trailInterval) {
      this._trailTimer = 0;
      this._spawnTrailDot(position.clone());
    }

    // Fade and remove old dots
    for (let i = this._trail.length - 1; i >= 0; i--) {
      const dot = this._trail[i];
      dot.life -= delta;
      dot.mesh.material.opacity = Math.max(0, dot.life / dot.maxLife) * 0.4;
      dot.mesh.scale.setScalar(dot.life / dot.maxLife);

      if (dot.life <= 0) {
        this.scene.remove(dot.mesh);
        dot.mesh.geometry.dispose();
        dot.mesh.material.dispose();
        this._trail.splice(i, 1);
      }
    }

    // Cap trail length
    while (this._trail.length > this._trailMax) {
      const old = this._trail.shift();
      this.scene.remove(old.mesh);
      old.mesh.geometry.dispose();
      old.mesh.material.dispose();
    }
  }

  _spawnTrailDot(pos) {
    const geo = new THREE.SphereGeometry(CONFIG.physics.ballRadius * 0.3, 8, 8);
    const mat = new THREE.MeshBasicMaterial({
      color:       0x00e5ff,
      transparent: true,
      opacity:     0.3,
    });
    const mesh   = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    this.scene.add(mesh);

    this._trail.push({ mesh, life: 0.35, maxLife: 0.35 });
  }

  // ── Dispose all resources ──────────────────────────────────
  dispose() {
    this.scene.remove(this.mesh);
    this.scene.remove(this.glowMesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
    this.glowMesh.geometry.dispose();
    this.glowMesh.material.dispose();
    this._trail.forEach((d) => {
      this.scene.remove(d.mesh);
      d.mesh.geometry.dispose();
      d.mesh.material.dispose();
    });
    this._trail = [];
  }

}