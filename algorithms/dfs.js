/* ============================================================
   DFS — Depth-First Search Maze Solver
   Uses an explicit stack. Not guaranteed to find shortest path.
   Time: O(V+E)  |  Space: O(V)
   ============================================================ */

class DFSSolver {
  /**
   * Solve maze using DFS.
   * @param {number[][]} grid  - 2D array (1=wall, 0=path)
   * @param {number[]}   start - [row, col]
   * @param {number[]}   end   - [row, col]
   * @returns {{ visited: number[][], path: number[][], nodesExplored: number, pathLength: number, time: number }}
   */
  solve(grid, start, end) {
    const t0 = performance.now();

    const rows = grid.length;
    const cols = grid[0].length;
    const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
    const parent  = Array.from({ length: rows }, () => Array(cols).fill(null));

    // Stack stores [row, col]
    const stack = [start];
    visited[start[0]][start[1]] = true;

    const visitedOrder = []; // order cells were first visited
    let found = false;

    const dirs = [[-1,0],[1,0],[0,-1],[0,1]];

    while (stack.length > 0) {
      const [r, c] = stack.pop();
      visitedOrder.push([r, c]);

      if (r === end[0] && c === end[1]) { found = true; break; }

      for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc] && grid[nr][nc] === 0) {
          visited[nr][nc] = true;
          parent[nr][nc] = [r, c];
          stack.push([nr, nc]);
        }
      }
    }

    // Reconstruct path
    const path = found ? this._reconstructPath(parent, start, end) : [];
    const t1 = performance.now();

    return {
      visited: visitedOrder,
      path,
      nodesExplored: visitedOrder.length,
      pathLength: path.length,
      time: parseFloat((t1 - t0).toFixed(4)),
      found,
      algorithm: 'DFS',
      color: '#f59e0b',
      timeComplexity: 'O(V + E)',
      spaceComplexity: 'O(V)',
    };
  }

  _reconstructPath(parent, start, end) {
    const path = [];
    let cur = end;
    while (cur && !(cur[0] === start[0] && cur[1] === start[1])) {
      path.unshift(cur);
      cur = parent[cur[0]][cur[1]];
    }
    path.unshift(start);
    return path;
  }
}

window.DFSSolver = DFSSolver;
