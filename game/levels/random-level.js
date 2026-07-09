// random-level.js
// Generates a random maze using Prim's algorithm.
// Start and goal positions are randomized on each generation.

export function generateRandomLevel(rows, cols) {

  // Fill everything with walls first
  const grid = Array(rows).fill(null).map(() => Array(cols).fill('W'));

  // Returns the valid cell neighbors 2 steps away (wall-carving step size)
  function getNeighbors(r, c) {
    return [[-2, 0], [2, 0], [0, -2], [0, 2]]
      .map(([dr, dc]) => [r + dr, c + dc])
      .filter(([nr, nc]) => nr > 0 && nr < rows - 1 && nc > 0 && nc < cols - 1);
  }

  // Pick a random odd-indexed cell to start carving from
  const startR = 1 + 2 * Math.floor(Math.random() * Math.floor((rows - 2) / 2));
  const startC = 1 + 2 * Math.floor(Math.random() * Math.floor((cols - 2) / 2));
  grid[startR][startC] = '.';

  // Seed the wall list from the starting cell
  const wallList = [];
  for (const [nr, nc] of getNeighbors(startR, startC)) {
    const wr = startR + (nr - startR) / 2;
    const wc = startC + (nc - startC) / 2;
    wallList.push([wr, wc, nr, nc]);
  }

  // Prim's: pick a random wall, carve through it if the far cell is unvisited
  while (wallList.length > 0) {
    const idx  = Math.floor(Math.random() * wallList.length);
    const [wr, wc, nr, nc] = wallList.splice(idx, 1)[0];

    if (grid[nr][nc] !== 'W') continue; // already visited

    // Carve the wall and the cell beyond it
    grid[wr][wc] = '.';
    grid[nr][nc] = '.';

    // Add the new cell's unvisited neighbors to the wall list
    for (const [fr, fc] of getNeighbors(nr, nc)) {
      if (grid[fr][fc] === 'W') {
        wallList.push([
          nr + (fr - nr) / 2,
          nc + (fc - nc) / 2,
          fr, fc
        ]);
      }
    }
  }

  // Collect all open (passage) cells on odd indices — these are valid placements
  const openCells = [];
  for (let r = 1; r < rows - 1; r++) {
    for (let c = 1; c < cols - 1; c++) {
      if (grid[r][c] === '.' && r % 2 === 1 && c % 2 === 1) {
        openCells.push([r, c]);
      }
    }
  }

  // Shuffle helper — Fisher-Yates
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  shuffle(openCells);

  // Pick start and goal — make sure they are not the same cell
  // and are reasonably far apart (at least 1/3 of total open cells away)
  const minDistance = Math.max(4, Math.floor(openCells.length / 3));

  const [sr, sc] = openCells[0];
  let goalIndex   = 1;

  for (let i = 1; i < openCells.length; i++) {
    const [gr, gc] = openCells[i];
    const dist = Math.abs(gr - sr) + Math.abs(gc - sc); // Manhattan distance
    if (dist >= minDistance) {
      goalIndex = i;
      break;
    }
  }

  const [gr, gc] = openCells[goalIndex];

  grid[sr][sc] = 'S';
  grid[gr][gc] = 'G';

  // Find the guaranteed path so we never place holes on it
  const pathCells = bfsPath(grid, sr, sc, gr, gc);
  const onPath    = new Set(pathCells.map(([r, c]) => `${r},${c}`));

  // Scatter holes on passage cells that are off the critical path
  for (let r = 1; r < rows - 1; r++) {
    for (let c = 1; c < cols - 1; c++) {
      if (grid[r][c] === '.' && !onPath.has(`${r},${c}`)) {
        if (Math.random() < 0.08) {
          grid[r][c] = 'H';
        }
      }
    }
  }

  return {
    id: 0,
    name: 'Random Maze',
    cellSize: 2,
    // Store start position so the engine can place the ball correctly
    startRow: sr,
    startCol: sc,
    grid,
  };
}

// BFS — returns the shortest cell path from (sr,sc) to (tr,tc).
// Returns an empty array if no path exists.
function bfsPath(grid, sr, sc, tr, tc) {
  const rows    = grid.length;
  const cols    = grid[0].length;
  const visited = Array(rows).fill(null).map(() => Array(cols).fill(false));
  const parent  = {};
  const queue   = [[sr, sc]];

  visited[sr][sc]          = true;
  parent[`${sr},${sc}`]    = null;

  while (queue.length > 0) {
    const [r, c] = queue.shift();
    if (r === tr && c === tc) break;

    for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nr = r + dr;
      const nc = c + dc;

      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      if (visited[nr][nc]) continue;
      if (grid[nr][nc] === 'W') continue;

      visited[nr][nc]       = true;
      parent[`${nr},${nc}`] = [r, c];
      queue.push([nr, nc]);
    }
  }

  // Reconstruct path by walking parent pointers back from goal
  const path = [];
  let   cur  = [tr, tc];

  while (cur !== null && cur !== undefined) {
    path.push(cur);
    cur = parent[`${cur[0]},${cur[1]}`];
  }

  // If we never reached the goal the path will not include the start
  if (path.length === 0 || path[path.length - 1].join() !== `${sr},${sc}`) {
    return [];
  }

  path.reverse();
  return path;
}