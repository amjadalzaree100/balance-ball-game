// ============================================================
//  renderer.js — Renderer facade
//  Wraps SceneManager.render() and adds post-processing hooks
//  Currently passes through — ready for future effects (bloom, etc.)
// ============================================================

export class Renderer {

  constructor(sceneManager) {
    this._sm = sceneManager;
  }

  // Render one frame — called at the end of each game-loop tick
  render() {
    this._sm.render();
  }

}