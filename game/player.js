/* ============================================================
   Player — Manages player state, movement, trail, and win detection
   ============================================================ */

class Player {
  constructor(canvas, grid, cellSize, startPos, endPos, onWin) {
    this.canvas   = canvas;
    this.grid     = grid;
    this.cellSize = cellSize;
    this.row      = startPos[0];
    this.col      = startPos[1];
    this.startPos = startPos;
    this.endPos   = endPos;
    this.onWin    = onWin;

    this.moves     = 0;
    this.trail     = []; // breadcrumb trail
    this.hasWon    = false;

    // Smooth rendering
    this.drawX = startPos[1] * cellSize; // pixel coords
    this.drawY = startPos[0] * cellSize;
    this.targetX = this.drawX;
    this.targetY = this.drawY;
    this.animating = false;
  }

  /**
   * Try to move player by (dr, dc). Returns true if move was valid.
   */
  move(dr, dc) {
    if (this.hasWon) return false;

    const nr = this.row + dr;
    const nc = this.col + dc;

    if (nr < 0 || nr >= this.grid.length || nc < 0 || nc >= this.grid[0].length) return false;
    if (this.grid[nr][nc] === 1) return false; // wall collision

    // Record trail
    this.trail.push([this.row, this.col]);

    this.row = nr;
    this.col = nc;
    this.moves++;

    // Animate position
    this.targetX = nc * this.cellSize;
    this.targetY = nr * this.cellSize;

    // Win detection
    if (this.row === this.endPos[0] && this.col === this.endPos[1]) {
      this.hasWon = true;
      setTimeout(() => this.onWin(this.moves), 100);
    }

    return true;
  }

  /**
   * Reset player to start
   */
  reset() {
    this.row    = this.startPos[0];
    this.col    = this.startPos[1];
    this.drawX  = this.startPos[1] * this.cellSize;
    this.drawY  = this.startPos[0] * this.cellSize;
    this.targetX = this.drawX;
    this.targetY = this.drawY;
    this.trail  = [];
    this.moves  = 0;
    this.hasWon = false;
  }

  /**
   * Update smooth animation (lerp)
   */
  update() {
    const speed = 0.25;
    this.drawX += (this.targetX - this.drawX) * speed;
    this.drawY += (this.targetY - this.drawY) * speed;
  }

  /**
   * Draw player on canvas context
   */
  draw(ctx) {
    // Draw trail (breadcrumb)
    ctx.fillStyle = 'rgba(0,229,255,0.18)';
    for (const [tr, tc] of this.trail) {
      const px = tc * this.cellSize;
      const py = tr * this.cellSize;
      ctx.fillRect(px + 2, py + 2, this.cellSize - 4, this.cellSize - 4);
    }

    // Draw player — glowing cyan circle
    const cx = this.drawX + this.cellSize / 2;
    const cy = this.drawY + this.cellSize / 2;
    const r  = this.cellSize * 0.38;

    // Outer glow
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2);
    glow.addColorStop(0, 'rgba(0,229,255,0.5)');
    glow.addColorStop(1, 'rgba(0,229,255,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 2, 0, Math.PI * 2);
    ctx.fill();

    // Core circle
    ctx.fillStyle = '#00e5ff';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Inner white highlight
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc(cx - r * 0.25, cy - r * 0.25, r * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }

  getPosition() { return [this.row, this.col]; }
  getMoves()    { return this.moves; }
  getTrail()    { return this.trail; }
}

window.Player = Player;
