/* ============================================================
   BFS — Breadth-First Search Maze Solver
   Uses a queue. Guaranteed shortest path in unweighted graphs.
   Time: O(V+E)  |  Space: O(V)
   ============================================================ */

class BFSSolver {
  solve(grid, start, end) {
    const t0 = performance.now();

    const rows = grid.length;
    const cols = grid[0].length;
    const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
    const parent  = Array.from({ length: rows }, () => Array(cols).fill(null));

    // Queue: simple array used as FIFO
    const queue = [start];
    visited[start[0]][start[1]] = true;

    const visitedOrder = [];
    let found = false;

    const dirs = [[-1,0],[1,0],[0,-1],[0,1]];

    while (queue.length > 0) {
      const [r, c] = queue.shift(); // FIFO dequeue
      visitedOrder.push([r, c]);

      if (r === end[0] && c === end[1]) { found = true; break; }

      for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc] && grid[nr][nc] === 0) {
          visited[nr][nc] = true;
          parent[nr][nc] = [r, c];
          queue.push([nr, nc]);
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
      algorithm: 'BFS',
      color: '#00e5ff',
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

window.BFSSolver = BFSSolver;
