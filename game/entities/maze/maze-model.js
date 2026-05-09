// ============================================================
//  maze-model.js — Parses level data into collision geometry
//  Produces: walls[], holes[], goalPosition, bounds
// ============================================================

import * as THREE from 'three';
import { CONFIG } from '../../core/config.js';

export class MazeModel {

  constructor() {
    this.walls        = [];   // AABB collision boxes  { minX, maxX, minZ, maxZ }
    this.holes        = [];   // Circle holes          { cx, cz, radius }
    this.goalPosition = new THREE.Vector3();
    this.bounds       = { width: 0, depth: 0 };
    this.tiltX        = 0;
    this.tiltZ        = 0;
  }

  // ── Load layout from a level definition object ─────────────
  // levelData.grid:  2D array
  //   'W' = wall segment
  //   'H' = hole
  //   'G' = goal
  //   'S' = ball start (not stored here, read by level-manager)
  //   '.' = empty floor
  // levelData.cellSize: world units per cell
  loadLevel(levelData) {
    this.walls  = [];
    this.holes  = [];

    const { grid, cellSize = 2 } = levelData;
    const rows = grid.length;
    const cols = grid[0].length;

    this.bounds.width = cols * cellSize;
    this.bounds.depth = rows * cellSize;

    // Center the maze at world origin
    const offsetX = -(cols * cellSize) / 2;
    const offsetZ = -(rows * cellSize) / 2;

    const wt = CONFIG.maze.wallThickness;
    const wh = CONFIG.maze.wallHeight;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = grid[r][c];
        const wx   = offsetX + c * cellSize + cellSize / 2;
        const wz   = offsetZ + r * cellSize + cellSize / 2;

        if (cell === 'W') {
          this.walls.push({
            // World-space AABB for collision detection
            minX: wx - cellSize / 2,
            maxX: wx + cellSize / 2,
            minZ: wz - cellSize / 2,
            maxZ: wz + cellSize / 2,
            // Visual position
            position: new THREE.Vector3(wx, wh / 2, wz),
            size:     new THREE.Vector3(cellSize, wh, cellSize),
          });
        } else if (cell === 'H') {
          this.holes.push({
            cx:     wx,
            cz:     wz,
            radius: (cellSize / 2) * 0.75,
            position: new THREE.Vector3(wx, 0, wz),
          });
        } else if (cell === 'G') {
          this.goalPosition.set(wx, 0.1, wz);
        }
      }
    }
  }

  // ── Check if ball has fallen into any hole ─────────────────
  isBallInHole(ballPos, ballRadius) {
    for (const hole of this.holes) {
      const dx   = ballPos.x - hole.cx;
      const dz   = ballPos.z - hole.cz;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < hole.radius - ballRadius * 0.5) return true;
    }
    return false;
  }

  // ── Check if ball has reached the goal ─────────────────────
  isBallAtGoal(ballPos) {
    const goalR = CONFIG.game.goalRadius;
    const dx    = ballPos.x - this.goalPosition.x;
    const dz    = ballPos.z - this.goalPosition.z;
    return Math.sqrt(dx * dx + dz * dz) < goalR;
  }

}