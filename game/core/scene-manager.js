// scene-manager.js - Manages the main Three.js scene
// Responsible for: scene, renderer, camera creation and lifecycle

import * as THREE from 'three';
import { CONFIG } from './config.js';

export class SceneManager {

  constructor() {
    // Main scene -- contains all 3D objects
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a0f);

    // Light fog adds depth to the scene
    this.scene.fog = new THREE.Fog(0x0a0a0f, 30, 80);

    // WebGL renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    // Attach canvas to the DOM
    const app = document.getElementById('app');
    app.appendChild(this.renderer.domElement);

    // Perspective camera
    const { fov, near, far, position, lookAt } = CONFIG.camera;
    this.camera = new THREE.PerspectiveCamera(
      fov,
      window.innerWidth / window.innerHeight,
      near,
      far
    );
    this.camera.position.set(position.x, position.y, position.z);
    this.camera.lookAt(lookAt.x, lookAt.y, lookAt.z);

    window.addEventListener('resize', () => this._onResize());
  }

  // Update camera and renderer on window resize
  _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // Render one frame
  render() {
    this.renderer.render(this.scene, this.camera);
  }

  add(object)    { this.scene.add(object); }
  remove(object) { this.scene.remove(object); }

  // Remove all non-light objects and free GPU memory
  clear() {
    const toRemove = [];
    this.scene.traverse((obj) => {
      if (obj.isLight || obj === this.scene) return;
      toRemove.push(obj);
    });
    toRemove.forEach((obj) => {
      this.scene.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
  }

}