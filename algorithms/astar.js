/* ============================================================
   A* Search Algorithm Maze Solver
   Uses f(n) = g(n) + h(n) with Manhattan distance heuristic.
   Optimal & complete. Explores fewer nodes than BFS.
   Time: O(E log V)  |  Space: O(V)
   ============================================================ */

class AStarSolver {
  solve(grid, start, end) {
    const t0 = performance.now();

    const rows = grid.length;
    const cols = grid[0].length;

    // g[r][c] = cost from start to (r,c)
    const g = Array.from({ length: rows }, () => Array(cols).fill(Infinity));
    const parent = Array.from({ length: rows }, () => Array(cols).fill(null));
    const closed = Array.from({ length: rows }, () => Array(cols).fill(false));

    g[start[0]][start[1]] = 0;

    // Min-heap (priority queue) — items: { r, c, f }
    // Simple sorted array for correctness (heap would be faster but adds complexity)
    const open = [{ r: start[0], c: start[1], f: this._h(start, end) }];

    const visitedOrder = [];
    let found = false;

    const dirs = [[-1,0],[1,0],[0,-1],[0,1]];

    while (open.length > 0) {
      // Pop node with lowest f value (min-priority)
      open.sort((a, b) => a.f - b.f);
      const { r, c } = open.shift();

      if (closed[r][c]) continue;
      closed[r][c] = true;
      visitedOrder.push([r, c]);

      if (r === end[0] && c === end[1]) { found = true; break; }

      for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
        if (grid[nr][nc] === 1 || closed[nr][nc]) continue;

        const tentativeG = g[r][c] + 1; // uniform cost (grid = unweighted)
        if (tentativeG < g[nr][nc]) {
          g[nr][nc] = tentativeG;
          parent[nr][nc] = [r, c];
          const f = tentativeG + this._h([nr, nc], end);
          open.push({ r: nr, c: nc, f });
        }
      }
    }

    const path = found ? this._reconstructPath(parent, start, end) : [];
    const t1 = performance.now();

    return {
      visited: visitedOrder,
      path,
      nodesExplored: visitedOrder.length,
      pathLength: path.length,
      time: parseFloat((t1 - t0).toFixed(4)),
      found,
      algorithm: 'A*',
      color: '#a855f7',
      timeComplexity: 'O(E log V)',
      spaceComplexity: 'O(V)',
    };
  }

  /** Manhattan distance heuristic — admissible for 4-directional grids */
  _h(a, end) {
    return Math.abs(a[0] - end[0]) + Math.abs(a[1] - end[1]);
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

window.AStarSolver = AStarSolver;
