// ============================================================
//  lighting.js — Scene lighting setup
// ============================================================

import * as THREE from 'three';
import { CONFIG } from '../core/config.js';

export class Lighting {

  constructor(scene) {
    this.scene = scene;
    this._setup();
  }

  _setup() {
    const { lighting } = CONFIG;

    // ── Ambient light (illuminates everything evenly) ──────
    this.ambientLight = new THREE.AmbientLight(
      lighting.ambientColor,
      lighting.ambientIntensity
    );
    this.scene.add(this.ambientLight);

    // ── Directional light (like the sun — casts shadows) ───
    this.directionalLight = new THREE.DirectionalLight(
      lighting.directionalColor,
      lighting.directionalIntensity
    );
    const dp = lighting.directionalPosition;
    this.directionalLight.position.set(dp.x, dp.y, dp.z);
    this.directionalLight.castShadow = true;

    // Shadow quality
    this.directionalLight.shadow.mapSize.width = 2048;   // Shadow map width (resolution)
    this.directionalLight.shadow.mapSize.height = 2048;   // Shadow map height (resolution)
    this.directionalLight.shadow.camera.near = 0.5;    // Near clipping plane of the shadow camera
    this.directionalLight.shadow.camera.far = 100;    // Far clipping plane of the shadow camera
    this.directionalLight.shadow.camera.left = -20;    // Left bound of the shadow camera frustum
    this.directionalLight.shadow.camera.right = 20;     // Right bound of the shadow camera frustum
    this.directionalLight.shadow.camera.top = 20;     // Top bound of the shadow camera frustum
    this.directionalLight.shadow.camera.bottom = -20;    // Bottom bound of the shadow camera frustum
    this.directionalLight.shadow.bias = -0.001; // Shadow bias (helps prevent shadow acne)

    this.scene.add(this.directionalLight);

    // ── Blue point light (dramatic effect) ──────────────────
    this.pointLight = new THREE.PointLight(
      lighting.pointLightColor,
      lighting.pointLightIntensity,
      30
    );
    this.pointLight.position.set(0, 10, 0);
    this.scene.add(this.pointLight);

    // ── Hemisphere light (sky + ground) ─────────────────────
    this.hemiLight = new THREE.HemisphereLight(0x1a237e, 0x0d1117, 0.8);
    this.scene.add(this.hemiLight);
  }

  // Move the point light with the maze when tilted
  followMaze(mazeGroup) {
    const p = mazeGroup.position;
    this.pointLight.position.set(p.x, p.y + 12, p.z);
  }

}