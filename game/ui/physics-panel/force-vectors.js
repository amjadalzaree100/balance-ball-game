// ============================================================
//  force-vectors.js — 3D vector overlay for the ball
//  Renders three ArrowHelpers anchored at the ball position:
//     - cyan    : gravity        (world-down, magnitude ∝ g)
//     - gold    : velocity       (xz direction,  magnitude ∝ speed)
//     - magenta : driving force  (m · a of the rolling-bead model)
//  "Driving force" is the tangential component of gravity along the
//  tilted surface, multiplied by mass. It is what would accelerate the
//  ball if friction were zero — friction subtracts from this to give
//  the actual net force. (Renamed from "net force" to be honest about
//  the friction omission.)
//  All values are read from CONFIG.physics / CONFIG.energy per
//  call to update(), so changes from the Physics Lab panel
//  reflect immediately.
// ============================================================

import * as THREE from 'three';
import { CONFIG } from '../../core/config.js';

// Visual scale factors — tuned so the arrows are readable on
// a ball of radius 0.6 sitting in a maze a few cells wide.
const GRAVITY_SCALE = 0.03;
const VELOCITY_SCALE = 0.30;
const DRIVING_FORCE_SCALE = 0.15;

// Small visual gap so the arrow tail doesn't touch the ball surface
const ARROW_GAP = 0.05;

const ARROW_HEAD_W = 0.20;
const ARROW_HEAD_L = 0.30;

const COLOR_GRAVITY = 0x00e5ff;   // --cyan
const COLOR_VEL     = 0xffd600;   // --gold
const COLOR_FORCE   = 0xff00aa;   // --magenta

export class ForceVectors {

  constructor(scene) {
    this.scene = scene;

    this.gravityArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, -1, 0),
      new THREE.Vector3(0, 0, 0),
      0.0001,                 // hidden length until first update
      COLOR_GRAVITY,
      ARROW_HEAD_L,
      ARROW_HEAD_W,
    );

    this.velocityArrow = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 0, 0),
      0.0001,
      COLOR_VEL,
      ARROW_HEAD_L,
      ARROW_HEAD_W,
    );

    this.drivingForceArrow = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 0, 0),
      0.0001,
      COLOR_FORCE,
      ARROW_HEAD_L,
      ARROW_HEAD_W,
    );

    this._visible = false;
    [this.gravityArrow, this.velocityArrow, this.drivingForceArrow].forEach((arr) => {
      arr.visible = false;
      scene.add(arr);
    });
  }

  setVisible(visible) {
    this._visible = !!visible;
    [this.gravityArrow, this.velocityArrow, this.drivingForceArrow].forEach((arr) => {
      arr.visible = this._visible;
    });
  }

  isVisible() {
    return this._visible;
  }

  update(ballPosition, velocity, tiltX, tiltZ) {
    if (!this._visible) return;

    // Pull the ball radius once so each arrow can sit just outside the
    // surface instead of originating inside the ball.
    const r = CONFIG.physics.ballRadius;

    // ── Gravity arrow ────────────────────────────────────────
    // Always points world-down. Length is proportional to |g| so
    // Zero-G (g=0) collapses the arrow as expected. Tail sits just
    // below the ball's underside.
    const g  = CONFIG.physics.gravity;
    const gLen = Math.max(0.0001, g * GRAVITY_SCALE);
    this.gravityArrow.position.set(
      ballPosition.x,
      ballPosition.y - (r + ARROW_GAP),
      ballPosition.z,
    );
    this.gravityArrow.setDirection(new THREE.Vector3(0, -1, 0));
    this.gravityArrow.setLength(gLen, ARROW_HEAD_L, ARROW_HEAD_W);

    // ── Velocity arrow ───────────────────────────────────────
    // Project velocity onto the XZ surface. Tail sits just outside the
    // ball's surface in the direction of motion.
    const vx = velocity.x;
    const vz = velocity.z;
    const speed = Math.sqrt(vx * vx + vz * vz);
    if (speed > 0.0001) {
      const offsetX = (vx / speed) * (r + ARROW_GAP);
      const offsetZ = (vz / speed) * (r + ARROW_GAP);
      this.velocityArrow.position.set(
        ballPosition.x + offsetX,
        ballPosition.y,
        ballPosition.z + offsetZ,
      );
      this.velocityArrow.setDirection(new THREE.Vector3(vx / speed, 0, vz / speed));
      this.velocityArrow.setLength(speed * VELOCITY_SCALE, ARROW_HEAD_L, ARROW_HEAD_W);
      this.velocityArrow.visible = true;
    } else {
      this.velocityArrow.visible = false;
    }

    // ── Driving-force arrow ──────────────────────────────────
    // Same rolling-bead model the physics engine uses:
    //   a_x = -g · sin(θz) · cos(θx) · rollingFactor
    //   a_z =  g · sin(θx) · cos(θz) · rollingFactor
    //   driving force = (a_x, 0, a_z) · mass
    // This is the gravity component along the surface, NOT the net force
    // (the net force would subtract the friction contribution).
    const rf     = CONFIG.physics.rollingFactor;
    const mass   = CONFIG.energy.ballMass;
    const ax = -g * Math.sin(tiltZ) * Math.cos(tiltX) * rf * mass;
    const az =  g * Math.sin(tiltX) * Math.cos(tiltZ) * rf * mass;
    const fMag = Math.sqrt(ax * ax + az * az);

    if (fMag > 0.001) {
      const fx = ax / fMag;
      const fz = az / fMag;
      this.drivingForceArrow.position.set(
        ballPosition.x + fx * (r + ARROW_GAP),
        ballPosition.y,
        ballPosition.z + fz * (r + ARROW_GAP),
      );
      this.drivingForceArrow.setDirection(new THREE.Vector3(fx, 0, fz));
      this.drivingForceArrow.setLength(fMag * DRIVING_FORCE_SCALE, ARROW_HEAD_L, ARROW_HEAD_W);
      this.drivingForceArrow.visible = true;
    } else {
      this.drivingForceArrow.visible = false;
    }
  }

  dispose() {
    [this.gravityArrow, this.velocityArrow, this.drivingForceArrow].forEach((arr) => {
      this.scene.remove(arr);
      arr.dispose();
    });
  }
}
