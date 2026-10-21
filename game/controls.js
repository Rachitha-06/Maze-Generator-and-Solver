/* ============================================================
   Controls — Keyboard input handler for player movement
   ============================================================ */

class Controls {
  constructor(player, onMove) {
    this.player   = player;
    this.onMove   = onMove;
    this.enabled  = false;
    this.keysDown = new Set();

    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp   = this._onKeyUp.bind(this);
    this._loop      = this._loop.bind(this);
    this._loopId    = null;
    this._lastMove  = 0;
    this._moveDelay = 120; // ms between moves when key held
  }

  enable() {
    if (this.enabled) return;
    this.enabled = true;
    document.addEventListener('keydown', this._onKeyDown);
    document.addEventListener('keyup',   this._onKeyUp);
    this._loopId = setInterval(this._loop, 50);
  }

  disable() {
    this.enabled = false;
    document.removeEventListener('keydown', this._onKeyDown);
    document.removeEventListener('keyup',   this._onKeyUp);
    clearInterval(this._loopId);
    this.keysDown.clear();
  }

  _onKeyDown(e) {
    if (!this.enabled) return;
    const key = e.key;
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','W','A','S','D'].includes(key)) {
      e.preventDefault();
      this.keysDown.add(key.toLowerCase());
      // Immediate move on first press
      this._processMove();
      this._lastMove = Date.now();
    }
  }

  _onKeyUp(e) {
    this.keysDown.delete(e.key.toLowerCase());
  }

  _loop() {
    if (!this.enabled) return;
    if (this.keysDown.size === 0) return;
    const now = Date.now();
    if (now - this._lastMove >= this._moveDelay) {
      this._processMove();
      this._lastMove = now;
    }
  }

  _processMove() {
    if (!this.player || this.player.hasWon) return;

    let dr = 0, dc = 0;
    if (this.keysDown.has('arrowup')    || this.keysDown.has('w')) dr = -1;
    if (this.keysDown.has('arrowdown')  || this.keysDown.has('s')) dr = +1;
    if (this.keysDown.has('arrowleft')  || this.keysDown.has('a')) dc = -1;
    if (this.keysDown.has('arrowright') || this.keysDown.has('d')) dc = +1;

    if (dr !== 0 || dc !== 0) {
      const moved = this.player.move(dr, dc);
      if (moved && this.onMove) this.onMove();
    }
  }

  setPlayer(player) { this.player = player; }
}

window.Controls = Controls;
