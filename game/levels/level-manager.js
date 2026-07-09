
import { LEVEL_1 } from './level-1.js';
import { LEVEL_2 } from './level-2.js';
import { LEVEL_3 } from './level-3.js';
import { LEVEL_4 } from './level-4.js';
import { LEVEL_5 } from './level-5.js';
import { generateRandomLevel } from './random-level.js';


const ALL_LEVELS = [LEVEL_1, LEVEL_2, LEVEL_3, LEVEL_4, LEVEL_5];

export class LevelManager {

  constructor() {
    this._levels       = ALL_LEVELS;
    this._currentIndex = 0;
  }

  getCurrentLevel()  { return this._levels[this._currentIndex]; }
  getCurrentNumber() { return this._currentIndex + 1; }

  // Advance to the next level; returns false if no levels remain
  nextLevel() {
    if (this._currentIndex < this._levels.length - 1) {
      this._currentIndex++;
      return true;
    }
    return false;
  }

  resetToFirst()    { this._currentIndex = 0; }
  hasNextLevel()    { return this._currentIndex < this._levels.length - 1; }

  // Jump directly to a specific level (by 0-based index).
  // Out-of-range values are clamped to the valid range.
  jumpToLevel(index) {
    if (index < 0) index = 0;
    if (index >= this._levels.length) index = this._levels.length - 1;
    this._currentIndex = index;
  }

  // Expose the full list of levels (read-only — do not mutate)
  getAllLevels()     { return this._levels.slice(); }
  getLevelCount()    { return this._levels.length; }

  // Find the 'S' cell in the current level grid and return world position
  getBallStartPosition() {
    const level    = this.getCurrentLevel();
    const grid     = level.grid;
    const cellSize = level.cellSize || 2;
    const rows     = grid.length;
    const cols     = grid[0].length;
    const offsetX  = -(cols * cellSize) / 2;
    const offsetZ  = -(rows * cellSize) / 2;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] === 'S') {
          return {
            x: offsetX + c * cellSize + cellSize / 2,
            y: 0.4,
            z: offsetZ + r * cellSize + cellSize / 2,
          };
        }
      }
    }
    return { x: 0, y: 0.4, z: 0 };
  }
    generateRandom(rows = 11, cols = 13) {
    const levelData = generateRandomLevel(rows, cols);
    this._levels.push(levelData);
    this._currentIndex = this._levels.length - 1;
    return levelData;
  }


}