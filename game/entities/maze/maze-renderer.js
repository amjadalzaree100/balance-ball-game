// ============================================================
//  maze-renderer.js — Builds all 3D meshes from MazeModel data
//  Floor, walls, holes, goal beacon, decorative grid lines
// ============================================================

import * as THREE from 'three';
import { CONFIG } from '../../core/config.js';

export class MazeRenderer {

  constructor(scene) {
    this.scene = scene;

    // Parent group — tilt this group to tilt the whole maze
    this.group = new THREE.Group();
    this.scene.add(this.group);

    // Goal animation state
    this._goalMesh   = null;
    this._goalBeam   = null;
    this._goalTime   = 0;
    this._holeMeshes = [];
  }

  // ── Build all meshes from maze model data ──────────────────
  build(mazeModel) {
    // Clear previous level meshes
    while (this.group.children.length > 0) {
      const child = this.group.children[0];
      this.group.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    }
    this._holeMeshes = [];
    this._goalMesh   = null;

    this._buildFloor(mazeModel);
    this._buildGrid(mazeModel);
    this._buildWalls(mazeModel);
    this._buildHoles(mazeModel);
    this._buildGoal(mazeModel);
  }

  // ── Flat floor panel ──────────────────────────────────────
  _buildFloor(mazeModel) {
    const { width, depth } = mazeModel.bounds;
    const geo = new THREE.BoxGeometry(width, 0.2, depth);
    const mat = new THREE.MeshStandardMaterial({
      color:     CONFIG.maze.floorColor,
      metalness: 0.3,
      roughness: 0.8,
    });
    const floor = new THREE.Mesh(geo, mat);
    floor.position.y    = -0.1;
    floor.receiveShadow = true;
    this.group.add(floor);

    // Thin glowing border frame
    const edgeGeo = new THREE.EdgesGeometry(geo);
    const edgeMat = new THREE.LineBasicMaterial({
      color:       0x00e5ff,
      transparent: true,
      opacity:     0.25,
    });
    const edges = new THREE.LineSegments(edgeGeo, edgeMat);
    edges.position.y = -0.1;
    this.group.add(edges);
  }

  // ── Subtle grid lines on the floor surface ────────────────
  _buildGrid(mazeModel) {
    const { width, depth } = mazeModel.bounds;
    const cellSize = 2;
    const mat      = new THREE.LineBasicMaterial({
      color:       0x1a2540,
      transparent: true,
      opacity:     0.5,
    });

    const points = [];
    const hw = width / 2;
    const hd = depth / 2;

    for (let x = -hw; x <= hw; x += cellSize) {
      points.push(new THREE.Vector3(x, 0.01, -hd));
      points.push(new THREE.Vector3(x, 0.01,  hd));
    }
    for (let z = -hd; z <= hd; z += cellSize) {
      points.push(new THREE.Vector3(-hw, 0.01, z));
      points.push(new THREE.Vector3( hw, 0.01, z));
    }

    const geo  = new THREE.BufferGeometry().setFromPoints(points);
    const grid = new THREE.LineSegments(geo, mat);
    this.group.add(grid);
  }

  // ── Wall meshes with edge glow ─────────────────────────────
  _buildWalls(mazeModel) {
    for (const wall of mazeModel.walls) {
      const geo = new THREE.BoxGeometry(
        wall.size.x,
        wall.size.y,
        wall.size.z
      );

      // Gradient-like wall material
      const mat = new THREE.MeshStandardMaterial({
        color:     CONFIG.maze.wallColor,
        metalness: 0.6,
        roughness: 0.3,
        emissive:  0x0d1b4a,
        emissiveIntensity: 0.4,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(wall.position);
      mesh.castShadow    = true;
      mesh.receiveShadow = true;
      this.group.add(mesh);

      // Glowing edges on wall tops
      const edgeGeo = new THREE.EdgesGeometry(geo);
      const edgeMat = new THREE.LineBasicMaterial({
        color:       0x3d6aff,
        transparent: true,
        opacity:     0.6,
      });
      const edges = new THREE.LineSegments(edgeGeo, edgeMat);
      edges.position.copy(wall.position);
      this.group.add(edges);
    }
  }

  // ── Hole meshes — dark circles with danger ring ───────────
  _buildHoles(mazeModel) {
    for (const hole of mazeModel.holes) {
      // Dark recessed cylinder
      const geo = new THREE.CylinderGeometry(hole.radius, hole.radius * 0.8, 0.5, 32);
      const mat = new THREE.MeshStandardMaterial({
        color:     CONFIG.maze.holeColor,
        metalness: 0.0,
        roughness: 1.0,
        emissive:  0x1a0000,
        emissiveIntensity: 0.3,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(hole.position);
      mesh.position.y = -0.25;
      this.group.add(mesh);

      // Danger ring — pulsing red outline
      const ringGeo = new THREE.TorusGeometry(hole.radius, 0.06, 8, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color:       0xff1744,
        transparent: true,
        opacity:     0.8,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.copy(hole.position);
      ring.position.y = 0.01;
      this.group.add(ring);
      this._holeMeshes.push({ ring, baseOpacity: 0.8 });
    }
  }

  // ── Goal beacon — glowing cyan pillar of light ─────────────
  _buildGoal(mazeModel) {
    const gp = mazeModel.goalPosition;

    // Base platform
    const baseGeo = new THREE.CylinderGeometry(
      CONFIG.game.goalRadius,
      CONFIG.game.goalRadius * 1.2,
      0.1, 32
    );
    const baseMat = new THREE.MeshStandardMaterial({
      color:             CONFIG.maze.goalColor,
      emissive:          CONFIG.maze.goalColor,
      emissiveIntensity: 0.8,
      metalness:         0.9,
      roughness:         0.1,
    });
    this._goalMesh = new THREE.Mesh(baseGeo, baseMat);
    this._goalMesh.position.set(gp.x, 0.05, gp.z);
    this.group.add(this._goalMesh);

    // Vertical light beam — thin glowing cylinder
    const beamGeo = new THREE.CylinderGeometry(0.05, CONFIG.game.goalRadius, 8, 16, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color:       CONFIG.maze.goalColor,
      transparent: true,
      opacity:     0.15,
      side:        THREE.DoubleSide,
    });
    this._goalBeam = new THREE.Mesh(beamGeo, beamMat);
    this._goalBeam.position.set(gp.x, 4, gp.z);
    this.group.add(this._goalBeam);

    // Outer rotating ring
    const outerRingGeo = new THREE.TorusGeometry(CONFIG.game.goalRadius * 1.4, 0.05, 8, 32);
    const outerRingMat = new THREE.MeshBasicMaterial({ color: CONFIG.maze.goalColor, transparent: true, opacity: 0.5 });
    this._goalRing = new THREE.Mesh(outerRingGeo, outerRingMat);
    this._goalRing.rotation.x = -Math.PI / 2;
    this._goalRing.position.set(gp.x, 0.1, gp.z);
    this.group.add(this._goalRing);
  }

  // ── Animate goal beacon and hole rings each frame ──────────
  update(delta) {
    this._goalTime += delta;
    const t = this._goalTime;

    if (this._goalMesh) {
      // Pulsing emissive glow
      this._goalMesh.material.emissiveIntensity = 0.6 + Math.sin(t * 3) * 0.4;
      this._goalMesh.position.y = 0.05 + Math.sin(t * 2) * 0.05;
    }

    if (this._goalBeam) {
      this._goalBeam.material.opacity = 0.1 + Math.sin(t * 2) * 0.07;
      this._goalBeam.rotation.y      += delta * 0.5;
    }

    if (this._goalRing) {
      this._goalRing.rotation.z += delta * 1.2;
    }

    // Pulse hole danger rings
    for (const h of this._holeMeshes) {
      h.ring.material.opacity = 0.5 + Math.sin(t * 4 + Math.PI) * 0.3;
      h.ring.scale.setScalar(1 + Math.sin(t * 3) * 0.04);
    }
  }

  // ── Apply tilt from physics engine to the visual group ─────
  applyTilt(tiltX, tiltZ) {
    this.group.rotation.x = tiltX;
    this.group.rotation.z = tiltZ;
  }

  dispose() {
    this.scene.remove(this.group);
  }

}