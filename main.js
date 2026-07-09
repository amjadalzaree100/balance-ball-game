// ============================================================
//  main.js -- Entry point: wires every system together
//  Game states: IDLE ? PLAYING ? WIN | LOSE
// ============================================================

import { SceneManager } from './game/core/scene-manager.js';
import { GameLoop } from './game/core/game-loop.js';
import { CONFIG } from './game/core/config.js';

import { Lighting } from './game/rendering/lighting.js';
import { Renderer } from './game/rendering/renderer.js';
import { Camera } from './game/rendering/camera.js';

import { Controls } from './game/input/controls.js';
import { VoiceControl } from './game/input/voice-control.js';

import { PhysicsEngine } from './game/physics/engine/physics-engine.js';

import { BallController } from './game/entities/ball/ball-controller.js';
import { MazeModel } from './game/entities/maze/maze-model.js';
import { MazeRenderer } from './game/entities/maze/maze-renderer.js';

import { LevelManager } from './game/levels/level-manager.js';
import { UI } from './game/ui/ui.js';
import { PhysicsPanel } from './game/ui/physics-panel/physics-panel.js';
import { ForceVectors } from './game/ui/physics-panel/force-vectors.js';

// Game state enum
const STATE = { IDLE: 'IDLE', PLAYING: 'PLAYING', WIN: 'WIN', LOSE: 'LOSE' };

// ============================================================
//  Bootstrap all systems
// ============================================================
const sceneManager = new SceneManager();
const gameLoop = new GameLoop();
const lighting = new Lighting(sceneManager.scene);
const renderer = new Renderer(sceneManager);
const cameraCtrl = new Camera(sceneManager.camera);
const controls = new Controls();
const voice   = new VoiceControl();
const physics = new PhysicsEngine();
const levelManager = new LevelManager();
const ui = new UI();

const mazeModel = new MazeModel();
const mazeRenderer = new MazeRenderer(sceneManager.scene);
const ballCtrl = new BallController(sceneManager.scene, physics);
const forceVectors = new ForceVectors(sceneManager.scene);
const physicsPanel = new PhysicsPanel({
  physics,
  ballController: ballCtrl,
  forceVectors,
});

// Current state
let state = STATE.IDLE;

// Score ticker -- subtract points each second
let _scoreTick = 0;

// ============================================================
//  Voice control callbacks
// ============================================================

// Update mic button icon when listening state changes
voice.onListeningChange = (listening) => {
  const btn = document.getElementById('mic-btn');
  if (!btn) return;
  btn.classList.toggle('active', listening);
  btn.title = listening ? 'Stop voice control' : 'Start voice control (up/down/left/right/stop)';
};

// Show the last recognized command on screen
voice.onCommand = (transcript) => {
  const el = document.getElementById('voice-feedback');
  if (!el) return;
  el.textContent = '"' + transcript + '"';
  el.classList.remove('voice-fade');
  void el.offsetWidth;
  el.classList.add('voice-fade');
};

// Mic button click handler
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('mic-btn');
  if (btn) btn.addEventListener('click', () => voice.toggle());
});

// ============================================================
//  Mouse toggle — keep the HUD badge in sync with Controls
// ============================================================
controls.onMouseEnabledChange = (enabled) => {
  const el = document.getElementById('mouse-toggle');
  if (!el) return;
  el.classList.toggle('mouse-on', enabled);
  el.classList.toggle('mouse-off', !enabled);
  el.textContent = enabled ? 'M: Mouse ON' : 'M: Mouse OFF';
};

// ============================================================
//  Load level into maze + ball
// ============================================================
function loadLevel() {
  const levelData = levelManager.getCurrentLevel();

  // Parse grid into collision data
  mazeModel.loadLevel(levelData);

  // Build 3D meshes
  mazeRenderer.build(mazeModel);

  // Give physics engine collision data
  physics.setMazeData({
    walls: mazeModel.walls,
    bounds: mazeModel.bounds,
  });

  // Place ball at level start position
  const startPos = levelManager.getBallStartPosition();
  CONFIG.ball.startPosition = startPos;
  ballCtrl.reset();

  // Update HUD level number and highlight current level in the selector
  ui.setLevel(levelManager.getCurrentNumber());
  ui.setCurrentLevel(levelManager.getCurrentNumber() - 1);
  ui.setScore(CONFIG.game.scorePerLevel);
}

// Ball height on the tilted surface (used for Ep = mgh and fall detection)
function getBallTiltedY() {
  const bp = ballCtrl.getPosition();
  const { tiltX, tiltZ } = physics;
  const surfaceY = bp.x * Math.sin(tiltZ) - bp.z * Math.sin(tiltX) * Math.cos(tiltZ);
  return surfaceY + CONFIG.physics.ballRadius;
}


function startRandomGame() {
  levelManager.generateRandom(11, 13); 
  startGame();
}
document.getElementById('random-btn-start')?.addEventListener('click', startRandomGame);
document.getElementById('random-btn-win')?.addEventListener('click', startRandomGame);
document.getElementById('random-btn-lose')?.addEventListener('click', startRandomGame);


// ============================================================
//  Start / Restart helpers
// ============================================================
function startGame() {
  state = STATE.PLAYING;
  loadLevel();
  ui.hideAllScreens();
  ui.startTimer();
  physics.reset(getBallTiltedY());
  if (CONFIG.energy.enabled) {
    ui.updateEnergy(physics.getEnergy(getBallTiltedY()));
  }
  _scoreTick = 0;
}

function restartLevel() {
  state = STATE.PLAYING;
  ballCtrl.reset();
  physics.reset(getBallTiltedY());
  if (CONFIG.energy.enabled) {
    ui.updateEnergy(physics.getEnergy(getBallTiltedY()));
  }
  ui.hideAllScreens();
  ui.startTimer();
  ui.setScore(CONFIG.game.scorePerLevel);
  _scoreTick = 0;
}

function nextLevel() {
  const hasMore = levelManager.nextLevel();
  if (hasMore) {
    startGame();
  } else {
    // All levels done -- restart from first
    levelManager.resetToFirst();
    startGame();
  }
}



// ============================================================
//  Win / Lose transitions
// ============================================================
function triggerWin() {
  state = STATE.WIN;
  ui.stopTimer();
  ui.showWin(ui.getScore(), ui.getElapsed(), levelManager.hasNextLevel());
}

function triggerLose() {
  state = STATE.LOSE;
  ui.stopTimer();
  ui.showLose();
}

// ============================================================
//  Main update -- called every frame by GameLoop
// ============================================================
function update(delta) {

  controls.update();

  // Pass current voice tilt values into controls each frame
  controls.setVoiceTilt(voice.tiltX, voice.tiltZ);

  // Always update timer display
  ui.updateTimer(delta);


  if (state !== STATE.PLAYING) return;

  // 1. Read input and tilt the surface
  const inputX = controls.getTiltX();
  const inputZ = controls.getTiltZ();
  physics.updateTilt(inputX, inputZ, delta);

  // 2. Apply tilt rotation to maze visual group
  mazeRenderer.applyTilt(physics.tiltX, physics.tiltZ);

  // 3. Advance physics simulation
  physics.step(delta);

  // 4. Update ball visuals
  ballCtrl.update(delta);
  const speed = Math.sqrt(physics.velocity.x ** 2 + physics.velocity.z ** 2);
  ui.updateSpeed(speed);

  // 4b. Update 3D force arrows if enabled
  if (CONFIG.physics.showVectors) {
    forceVectors.update(ballCtrl.getPosition(), physics.velocity, physics.tiltX, physics.tiltZ);
  }


  // 5. Calculate real Y position based on surface tilt + ball X/Z
  const bp = ballCtrl.getPosition();
  const tiltedY = getBallTiltedY();

  // Update ball's world Y (used for fall detection)
  bp.y = tiltedY;

  // Apply to visual meshes
  ballCtrl.renderer.mesh.position.y = tiltedY;
  ballCtrl.renderer.glowMesh.position.y = tiltedY - 0.1;

  if (CONFIG.energy.enabled) {
    ui.updateEnergy(physics.getEnergy(tiltedY));
  }

  // 6. Animate maze decorations (goal, holes)
  mazeRenderer.update(delta);

  // 7. Camera sway following tilt
  cameraCtrl.update(physics.tiltX, physics.tiltZ);

  // 7b. Track the maze group with the cyan point light
  lighting.followMaze(mazeRenderer.group);

  // 8. Scoring -- deduct points per second
  _scoreTick += delta;
  if (_scoreTick >= 1) {
    _scoreTick -= 1;
    ui.setScore(ui.getScore() - CONFIG.game.timePenalty);
  }

  // 9. Win / Lose checks
  // Fall below floor threshold
  if (bp.y < CONFIG.game.fallThreshold) {
    triggerLose();
    return;
  }

  // Ball in a hole
  if (mazeModel.isBallInHole(bp, CONFIG.physics.ballRadius)) {
    triggerLose();
    return;
  }

  // Ball reached goal
  if (mazeModel.isBallAtGoal(bp)) {
    triggerWin();
    return;
  }
}

controls.onAction(() => {
  const activeScreen = document.querySelector('.screen.active');
  if (!activeScreen) return;
  switch (activeScreen.id) {
    case 'start-screen': startGame(); break;
    case 'win-screen':   nextLevel(); break;
    case 'lose-screen':  restartLevel(); break;
  }
});

// ============================================================
//  Render -- called every frame after update
// ============================================================
function render() {
  renderer.render();
}

// ============================================================
//  Register both update and render in the game loop
// ============================================================
gameLoop.add((delta) => {
  update(delta);
  render();
});

// ============================================================
//  UI button wiring
// ============================================================
ui.onStart(() => startGame());
ui.onNext(() => nextLevel());
ui.onRestartWin(() => restartLevel());
ui.onRestartLose(() => restartLevel());

// Populate the level-selector grids (start, win, lose screens).
// They all show the same buttons; clicking any one starts that level.
const allLevelNames = levelManager.getAllLevels().map((l) => l.name);
ui.populateLevelSelector(allLevelNames);
ui.setCurrentLevel(levelManager.getCurrentNumber() - 1);
ui.onPickLevel((index) => {
  levelManager.jumpToLevel(index);
  startGame();
});

// ============================================================
//  Boot sequence
// ============================================================
// Show start screen, begin render loop (so background renders)
ui.showStart();
loadLevel();           // pre-build level so it shows behind the start screen
gameLoop.start();