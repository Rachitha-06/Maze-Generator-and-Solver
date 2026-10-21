/* ============================================================
   Maze Generator — Recursive Backtracking Algorithm
   ============================================================ */

class MazeGenerator {
  constructor() {
    this.grid = [];
    this.rows = 0;
    this.cols = 0;
    this.generationSteps = [];
  }

  generate(size, difficulty = 'medium') {
    const dim = size % 2 === 0 ? size + 1 : size;
    this.rows = dim;
    this.cols = dim;
    this.generationSteps = [];

    // Initialize all cells as walls (1)
    this.grid = Array.from({ length: this.rows }, () => Array(this.cols).fill(1));

    // Carve passages from (1,1)
    this._carve(1, 1);

    // Add extra passages based on difficulty to create loops
    const extraRatio = difficulty === 'easy' ? 0.12 : difficulty === 'medium' ? 0.04 : 0;
    if (extraRatio > 0) this._addExtraPassages(extraRatio);

    // Guarantee start and end are open
    this.grid[1][1] = 0;
    this.grid[this.rows - 2][this.cols - 2] = 0;

    return this.grid;
  }

  _carve(r, c) {
    this.grid[r][c] = 0;
    this.generationSteps.push({ r, c, type: 'carve' });

    const dirs = this._shuffle([[-2,0],[0,2],[2,0],[0,-2]]);

    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr > 0 && nr < this.rows - 1 && nc > 0 && nc < this.cols - 1 && this.grid[nr][nc] === 1) {
        this.grid[r + dr/2][c + dc/2] = 0;
        this.generationSteps.push({ r: r + dr/2, c: c + dc/2, type: 'wall' });
        this._carve(nr, nc);
      }
    }
  }

  _addExtraPassages(ratio) {
    const wallCells = [];
    for (let r = 1; r < this.rows - 1; r++) {
      for (let c = 1; c < this.cols - 1; c++) {
        if (this.grid[r][c] === 1) wallCells.push([r, c]);
      }
    }
    const count = Math.floor(wallCells.length * ratio);
    const shuffled = this._shuffle(wallCells);
    for (let i = 0; i < count; i++) {
      const [r, c] = shuffled[i];
      this.grid[r][c] = 0;
    }
  }

  _shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  getStart() { return [1, 1]; }
  getEnd()   { return [this.rows - 2, this.cols - 2]; }
  getDimensions() { return { rows: this.rows, cols: this.cols }; }
  getSteps() { return this.generationSteps; }
}

window.MazeGenerator = MazeGenerator;
