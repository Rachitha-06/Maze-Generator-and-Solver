/* ============================================================
   MazeCore — Main Application Controller
   Orchestrates: generation → gameplay → visualization → comparison
   ============================================================ */

(function () {
  'use strict';

  // ─── State ────────────────────────────────────────────────
  const state = {
    grid:         null,
    start:        null,
    end:          null,
    cellSize:     0,
    mazeSize:     11,
    difficulty:   'medium',
    genSpeed:     50,
    solveSpeed:   60,
    phase:        0,       // 0=idle,1=generated,2=playing,3=visualizing,4=compared
    player:       null,
    controls:     null,
    timerInterval:null,
    timerSeconds: 0,
    totalMoves:   0,
    mazeCount:    0,
    solveCount:   0,
    totalPlayerMoves: 0,
    visualizing:  false,
    stopFlag:     false,
    results:      {},      // { dfs, bfs, astar }
    charts:       {},
    genAnimTimeout: null,
  };

  // ─── Canvas & Context ─────────────────────────────────────
  const canvas = document.getElementById('mazeCanvas');
  const ctx    = canvas.getContext('2d');

  // ─── Generator & Solvers ──────────────────────────────────
  const generator = new MazeGenerator();
  const dfsSolver  = new DFSSolver();
  const bfsSolver  = new BFSSolver();
  const aStarSolver = new AStarSolver();

  // ─── Colours ──────────────────────────────────────────────
  const COLORS = {
    wall:           '#111827',
    wallStroke:     '#1f2d3d',
    path:           '#070b14',
    start:          '#10b981',
    end:            '#ef4444',
    visitedDFS:     'rgba(245,158,11,0.38)',
    visitedBFS:     'rgba(0,229,255,0.30)',
    visitedAstar:   'rgba(168,85,247,0.30)',
    pathDFS:        'rgba(245,158,11,0.9)',
    pathBFS:        'rgba(0,229,255,0.9)',
    pathAstar:      'rgba(168,85,247,0.95)',
    trail:          'rgba(0,229,255,0.18)',
    generating:     '#10b981',
  };

  // ─── Init ─────────────────────────────────────────────────
  function init() {
    setupControls();
    setupParticles();
    populateViva();
    initCharts();
    updateSliderLabels();
    checkDarkLight();
  }

  // ──────────────────────────────────────────────────────────
  //  CONTROLS WIRING
  // ──────────────────────────────────────────────────────────
  function setupControls() {
    // Size buttons
    document.querySelectorAll('.size-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.mazeSize = parseInt(btn.dataset.size);
      });
    });

    // Difficulty
    document.getElementById('difficultySelect').addEventListener('change', e => {
      state.difficulty = e.target.value;
    });

    // Speed sliders
    document.getElementById('genSpeed').addEventListener('input', e => {
      state.genSpeed = parseInt(e.target.value);
      document.getElementById('genSpeedVal').textContent = (110 - state.genSpeed) + 'ms';
    });
    document.getElementById('solveSpeed').addEventListener('input', e => {
      state.solveSpeed = parseInt(e.target.value);
      document.getElementById('solveSpeedVal').textContent = (110 - state.solveSpeed) + 'ms';
    });

    // Buttons
    document.getElementById('generateBtn').addEventListener('click', generateMaze);
    document.getElementById('newMazeBtn').addEventListener('click', generateMaze);
    document.getElementById('clearBtn').addEventListener('click', clearAll);
    document.getElementById('hintBtn').addEventListener('click', showHint);
    document.getElementById('resetPlayerBtn').addEventListener('click', resetPlayer);
    document.getElementById('solveBtn').addEventListener('click', startVisualization);
    document.getElementById('stopBtn').addEventListener('click', stopVisualization);
    document.getElementById('winSolveBtn').addEventListener('click', startVisualization);

    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', () => {
      const body = document.body;
      const isLight = body.dataset.theme === 'light';
      body.dataset.theme = isLight ? '' : 'light';
      document.getElementById('themeToggle').querySelector('.theme-icon').textContent = isLight ? '☀' : '🌙';
    });

    // Nav links active state on scroll
    window.addEventListener('scroll', updateNavActive);

    // slider labels init
    document.getElementById('genSpeedVal').textContent = (110 - state.genSpeed) + 'ms';
    document.getElementById('solveSpeedVal').textContent = (110 - state.solveSpeed) + 'ms';
  }

  function updateSliderLabels() {
    document.getElementById('genSpeedVal').textContent = (110 - state.genSpeed) + 'ms';
    document.getElementById('solveSpeedVal').textContent = (110 - state.solveSpeed) + 'ms';
  }

  function checkDarkLight() {
    document.getElementById('themeToggle').querySelector('.theme-icon').textContent = '☀';
  }

  // ──────────────────────────────────────────────────────────
  //  MAZE GENERATION
  // ──────────────────────────────────────────────────────────
  async function generateMaze() {
    // Cancel any in-progress visualization
    if (state.visualizing) { state.stopFlag = true; await sleep(200); }

    // Cleanup previous state
    clearTimers();
    hideWinBanner();
    hideResults();
    if (state.controls) state.controls.disable();

    state.grid = generator.generate(state.mazeSize, state.difficulty);
    state.start = generator.getStart();
    state.end   = generator.getEnd();
    state.mazeCount++;
    document.getElementById('hstat-mazes').textContent = state.mazeCount;

    // Compute cell size based on canvas container
    const container = canvas.parentElement;
    const maxW = container.clientWidth  - 32;
    const maxH = Math.max(480, window.innerHeight * 0.55);
    const rows = state.grid.length;
    const cols = state.grid[0].length;
    state.cellSize = Math.floor(Math.min(maxW / cols, maxH / rows));

    canvas.width  = cols * state.cellSize;
    canvas.height = rows * state.cellSize;

    // Hide overlay
    document.getElementById('mazeOverlay').classList.add('hidden');

    // Animate generation
    setPhase(1);
    showToast('Generating maze…', 'info');
    await animateGeneration(generator.getSteps());

    // Draw full maze after animation
    drawMaze();

    // Setup player
    setupPlayer();
    setPhase(2);
    document.getElementById('solveBtn').disabled = false;
    showToast('Maze ready! Use WASD / Arrow keys to play.', 'success');
    document.getElementById('gameStatus').textContent = 'Playing';
  }

  async function animateGeneration(steps) {
    // Draw all walls first
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const delay = Math.max(1, 110 - state.genSpeed);

    return new Promise(resolve => {
      let i = 0;
      function next() {
        if (i >= steps.length) { resolve(); return; }

        // Process a batch for speed
        const batch = Math.max(1, Math.floor(steps.length / 300));
        for (let b = 0; b < batch && i < steps.length; b++, i++) {
          const { r, c } = steps[i];
          ctx.fillStyle = COLORS.generating;
          ctx.fillRect(c * state.cellSize + 1, r * state.cellSize + 1,
                       state.cellSize - 2, state.cellSize - 2);
        }

        // Flash path colour shortly after
        setTimeout(() => {
          for (let b2 = Math.max(0, i - batch); b2 < i; b2++) {
            const { r, c } = steps[b2];
            if (state.grid[r][c] === 0) {
              ctx.fillStyle = COLORS.path;
              ctx.fillRect(c * state.cellSize + 1, r * state.cellSize + 1,
                           state.cellSize - 2, state.cellSize - 2);
            }
          }
        }, delay * 2);

        setTimeout(next, delay);
      }
      next();
    });
  }

  // ──────────────────────────────────────────────────────────
  //  DRAW MAZE
  // ──────────────────────────────────────────────────────────
  function drawMaze(overlay) {
    if (!state.grid) return;
    const rows = state.grid.length;
    const cols = state.grid[0].length;
    const cs   = state.cellSize;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (state.grid[r][c] === 1) {
          ctx.fillStyle = COLORS.wall;
          ctx.fillRect(c * cs, r * cs, cs, cs);
          ctx.strokeStyle = COLORS.wallStroke;
          ctx.strokeRect(c * cs + 0.5, r * cs + 0.5, cs - 1, cs - 1);
        } else {
          ctx.fillStyle = COLORS.path;
          ctx.fillRect(c * cs, r * cs, cs, cs);
        }
      }
    }

    // Draw overlay data (visited/path cells)
    if (overlay) {
      for (const { r, c, color } of overlay) {
        ctx.fillStyle = color;
        ctx.fillRect(c * cs + 1, r * cs + 1, cs - 2, cs - 2);
      }
    }

    // Start cell
    const [sr, sc] = state.start;
    ctx.fillStyle = COLORS.start;
    ctx.fillRect(sc * cs + 1, sr * cs + 1, cs - 2, cs - 2);
    drawLabel(ctx, sc * cs + cs / 2, sr * cs + cs / 2, 'S', cs);

    // End cell
    const [er, ec] = state.end;
    ctx.fillStyle = COLORS.end;
    ctx.fillRect(ec * cs + 1, er * cs + 1, cs - 2, cs - 2);
    drawLabel(ctx, ec * cs + cs / 2, er * cs + cs / 2, 'E', cs);
  }

  function drawLabel(ctx, x, y, text, cs) {
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.max(8, cs * 0.45)}px "Space Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
  }

  // ──────────────────────────────────────────────────────────
  //  PLAYER SETUP
  // ──────────────────────────────────────────────────────────
  function setupPlayer() {
    if (state.controls) state.controls.disable();

    state.player = new Player(
      canvas, state.grid, state.cellSize,
      state.start, state.end,
      onPlayerWin
    );

    state.controls = new Controls(state.player, onPlayerMove);
    state.controls.enable();

    // Start timer
    clearTimers();
    state.timerSeconds = 0;
    updateTimerDisplay();
    state.timerInterval = setInterval(() => {
      state.timerSeconds++;
      updateTimerDisplay();
    }, 1000);

    // Start render loop
    startRenderLoop();

    document.getElementById('moveCount').textContent = '0';
    document.getElementById('gameStatus').textContent = 'Playing';
  }

  function onPlayerMove() {
    const moves = state.player.getMoves();
    document.getElementById('moveCount').textContent = moves;
    state.totalPlayerMoves++;
    document.getElementById('hstat-moves').textContent = state.totalPlayerMoves;
  }

  function onPlayerWin(moves) {
    clearTimers();
    if (state.controls) state.controls.disable();
    document.getElementById('gameStatus').textContent = '🏆 Solved!';
    setPhase(3);

    const time = formatTime(state.timerSeconds);
    document.getElementById('winDetails').textContent =
      `Solved in ${moves} moves · Time: ${time}`;

    const wb = document.getElementById('winBanner');
    wb.style.display = 'flex';

    showToast(`🏆 Maze solved in ${moves} moves!`, 'success');
    setPhase(3);
  }

  function resetPlayer() {
    if (!state.player) return;
    clearTimers();
    state.player.reset();
    state.player.hasWon = false;
    document.getElementById('moveCount').textContent = '0';
    document.getElementById('gameStatus').textContent = 'Playing';
    hideWinBanner();

    if (state.controls) {
      state.controls.enable();
    }

    state.timerSeconds = 0;
    updateTimerDisplay();
    state.timerInterval = setInterval(() => {
      state.timerSeconds++;
      updateTimerDisplay();
    }, 1000);

    drawMaze();
    startRenderLoop();
  }

  // ──────────────────────────────────────────────────────────
  //  RENDER LOOP (player animation)
  // ──────────────────────────────────────────────────────────
  let renderLoopId = null;
  function startRenderLoop() {
    if (renderLoopId) cancelAnimationFrame(renderLoopId);
    function loop() {
      if (!state.player || state.visualizing) return;
      state.player.update();
      drawMaze();
      state.player.draw(ctx);
      renderLoopId = requestAnimationFrame(loop);
    }
    renderLoopId = requestAnimationFrame(loop);
  }

  // ──────────────────────────────────────────────────────────
  //  ALGORITHM VISUALIZATION
  // ──────────────────────────────────────────────────────────
  async function startVisualization() {
    if (!state.grid) { showToast('Generate a maze first!', 'warning'); return; }
    if (state.visualizing) return;

    // Stop player render loop & controls
    if (renderLoopId) cancelAnimationFrame(renderLoopId);
    if (state.controls) state.controls.disable();
    clearTimers();
    hideWinBanner();
    hideResults();

    state.visualizing = true;
    state.stopFlag    = false;
    state.results     = {};
    setPhase(3);

    document.getElementById('solveBtn').disabled = true;
    document.getElementById('stopBtn').disabled  = false;

    // Reset live stats
    ['dfs','bfs','astar'].forEach(a => {
      document.getElementById(`live-${a}`).textContent = '—';
    });

    const algos = [
      { key: 'dfs',   check: 'chkDFS',   solver: dfsSolver,   visitedColor: COLORS.visitedDFS,  pathColor: COLORS.pathDFS,   label: 'DFS'  },
      { key: 'bfs',   check: 'chkBFS',   solver: bfsSolver,   visitedColor: COLORS.visitedBFS,  pathColor: COLORS.pathBFS,   label: 'BFS'  },
      { key: 'astar', check: 'chkAstar', solver: aStarSolver, visitedColor: COLORS.visitedAstar, pathColor: COLORS.pathAstar, label: 'A*' },
    ];

    for (const algo of algos) {
      if (state.stopFlag) break;
      if (!document.getElementById(algo.check).checked) continue;

      showToast(`Running ${algo.label}…`, 'info');
      const result = algo.solver.solve(state.grid, state.start, state.end);
      state.results[algo.key] = result;
      state.solveCount++;
      document.getElementById('hstat-solves').textContent = state.solveCount;

      await animateAlgorithm(result, algo.visitedColor, algo.pathColor, algo.label);

      if (state.stopFlag) break;
      await sleep(400);
    }

    state.visualizing = false;
    document.getElementById('solveBtn').disabled = false;
    document.getElementById('stopBtn').disabled  = true;

    if (!state.stopFlag && Object.keys(state.results).length > 0) {
      setPhase(4);
      showComparison();
      updateCharts();
      setPhase(5);
    }
  }

  async function animateAlgorithm(result, visitedColor, pathColor, label) {
    const delay = Math.max(1, 110 - state.solveSpeed);
    const { visited, path } = result;

    // Overlay buffer
    const overlay = [];

    // Animate visited nodes
    for (let i = 0; i < visited.length; i++) {
      if (state.stopFlag) return;
      const [r, c] = visited[i];
      overlay.push({ r, c, color: visitedColor });
      drawMaze(overlay);

      // Update live counter
      const _liveKey = label === 'DFS' ? 'dfs' : label === 'BFS' ? 'bfs' : 'astar';
          document.getElementById('live-' + _liveKey).textContent = (i+1) + ' nodes';

      // Batch for speed
      const batchSize = Math.max(1, Math.floor(visited.length / 200));
      if (i % batchSize === 0) {
        await sleep(delay);
      }
    }

    // Animate path
    for (let i = 0; i < path.length; i++) {
      if (state.stopFlag) return;
      const [r, c] = path[i];
      overlay.push({ r, c, color: pathColor });
      drawMaze(overlay);
      await sleep(delay * 1.5);
    }

    // Final live count update
    const liveId = label === 'DFS' ? 'live-dfs' : label === 'BFS' ? 'live-bfs' : 'live-astar';
    document.getElementById(liveId).textContent =
      `${result.nodesExplored} visited · path ${result.pathLength}`;
  }

  function stopVisualization() {
    state.stopFlag    = true;
    state.visualizing = false;
    document.getElementById('solveBtn').disabled = false;
    document.getElementById('stopBtn').disabled  = true;
    showToast('Visualization stopped.', 'warning');
    if (state.grid) drawMaze();
    if (state.player) startRenderLoop();
  }

  // ──────────────────────────────────────────────────────────
  //  HINT SYSTEM
  // ──────────────────────────────────────────────────────────
  function showHint() {
    if (!state.grid || !state.player) return;
    const pos = state.player.getPosition();
    // Run BFS from current position to get next step
    const result = bfsSolver.solve(state.grid, pos, state.end);
    if (result.path.length < 2) { showToast('You are at the goal!', 'success'); return; }
    const nextStep = result.path[1];
    const dr = nextStep[0] - pos[0];
    const dc = nextStep[1] - pos[1];
    const dirs = { '-10': '↑', '10': '↓', '0-1': '←', '01': '→' };
    const key = `${dr}${dc}`;
    showToast(`Hint: Go ${dirs[key] || '?'}  (${result.path.length - 1} steps to exit)`, 'info');
  }

  // ──────────────────────────────────────────────────────────
  //  COMPARISON & RESULTS
  // ──────────────────────────────────────────────────────────
  function showComparison() {
    const res = state.results;
    const keys = Object.keys(res);
    if (keys.length === 0) return;

    // Determine winner by composite score: fewer nodes + shorter path + faster time
    const scored = keys.map(k => {
      const r = res[k];
      return { k, score: r.nodesExplored * 0.4 + r.pathLength * 0.4 + r.time * 0.2 };
    });
    scored.sort((a, b) => a.score - b.score);
    const winner = scored[0].k;

    // Winner badge
    const winnerNames = { dfs: 'DFS', bfs: 'BFS', astar: 'A*' };
    const winnerColors = { dfs: '#f59e0b', bfs: '#00e5ff', astar: '#a855f7' };
    const wb = document.getElementById('winnerBadge');
    wb.textContent = `🏆 Most Efficient: ${winnerNames[winner]}`;
    wb.style.background = `${winnerColors[winner]}22`;
    wb.style.color = winnerColors[winner];
    wb.style.border = `1px solid ${winnerColors[winner]}55`;

    // Compute max values for normalizing score bars
    const maxNodes = Math.max(...keys.map(k => res[k].nodesExplored));
    const maxPath  = Math.max(...keys.map(k => res[k].pathLength));
    const maxTime  = Math.max(...keys.map(k => res[k].time));

    // Render comparison cards
    const container = document.getElementById('comparisonCards');
    container.innerHTML = '';
    const algoMeta = {
      dfs:   { label: 'DFS',  color: '#f59e0b', tag: 'dfs'   },
      bfs:   { label: 'BFS',  color: '#00e5ff', tag: 'bfs'   },
      astar: { label: 'A*',   color: '#a855f7', tag: 'astar' },
    };

    keys.forEach(k => {
      const r   = res[k];
      const m   = algoMeta[k];
      const isW = k === winner;
      const efficiency = 100 - Math.round((scored.find(s => s.k === k).score / scored[scored.length - 1].score) * 80);

      const card = document.createElement('div');
      card.className = `comp-card${isW ? ' winner' : ''}`;
      card.innerHTML = `
        ${isW ? '<span class="winner-crown">👑</span>' : ''}
        <div class="comp-card-header">
          <span class="algo-tag ${m.tag}">${m.label}</span>
          <span class="comp-card-title">${m.label === 'A*' ? 'A* Search' : m.label === 'DFS' ? 'Depth-First' : 'Breadth-First'}</span>
        </div>
        <div class="comp-metrics">
          <div class="comp-metric">
            <span class="comp-metric-label">Nodes Explored</span>
            <span class="comp-metric-val" style="color:${m.color}">${r.nodesExplored}</span>
          </div>
          <div class="comp-metric">
            <span class="comp-metric-label">Path Length</span>
            <span class="comp-metric-val" style="color:${m.color}">${r.pathLength}</span>
          </div>
          <div class="comp-metric">
            <span class="comp-metric-label">Execution Time</span>
            <span class="comp-metric-val" style="color:${m.color}">${r.time.toFixed(3)} ms</span>
          </div>
          <div class="comp-metric">
            <span class="comp-metric-label">Time Complexity</span>
            <span class="comp-metric-val" style="color:${m.color};font-size:0.72rem">${r.timeComplexity}</span>
          </div>
          <div class="comp-metric">
            <span class="comp-metric-label">Space Complexity</span>
            <span class="comp-metric-val" style="color:${m.color};font-size:0.72rem">${r.spaceComplexity}</span>
          </div>
          <div class="comp-metric">
            <span class="comp-metric-label">Path Found?</span>
            <span class="comp-metric-val" style="color:${r.found ? '#10b981' : '#ef4444'}">${r.found ? '✓ Yes' : '✗ No'}</span>
          </div>
        </div>
        <div class="comp-score">
          <span style="font-size:0.72rem;color:var(--text-muted)">Efficiency</span>
          <div class="score-bar-wrap">
            <div class="score-bar" style="width:0%;background:${m.color}" data-target="${efficiency}"></div>
          </div>
          <span style="font-size:0.75rem;font-family:'Space Mono',monospace;color:${m.color}">${efficiency}%</span>
        </div>
      `;
      container.appendChild(card);
    });

    // Animate score bars
    setTimeout(() => {
      document.querySelectorAll('.score-bar').forEach(bar => {
        bar.style.width = bar.dataset.target + '%';
      });
    }, 100);

    // Winner analysis text
    const winRes = res[winner];
    const winMeta = algoMeta[winner];
    const analysis = document.getElementById('winnerAnalysis');
    const reasonMap = {
      astar: `A* is the most efficient because it uses a heuristic function h(n) = Manhattan distance to guide exploration toward the goal. This means it avoids exploring cells in the wrong direction, resulting in fewer nodes visited compared to blind-search algorithms like DFS and BFS.`,
      bfs:   `BFS is most efficient here because it explores nodes level by level and guarantees the shortest path in an unweighted graph. While it visits more nodes than A*, the path it finds is provably optimal. A* was not selected or explored fewer nodes due to maze structure.`,
      dfs:   `DFS performed best in this maze because the maze structure happened to align with DFS's depth-first exploration pattern. DFS uses minimal memory and can find a solution quickly if the path is aligned with its traversal order.`,
    };
    analysis.innerHTML = `
      <h3>🏆 Most Efficient Algorithm: <span style="color:${winMeta.color}">${winMeta.label}</span></h3>
      <p>${reasonMap[winner]}</p>
      <div class="analysis-points">
        <div class="apoint">Explored <strong>${winRes.nodesExplored}</strong> nodes to find the goal</div>
        <div class="apoint">Found a path of length <strong>${winRes.pathLength}</strong> cells</div>
        <div class="apoint">Completed in <strong>${winRes.time.toFixed(3)} ms</strong></div>
        <div class="apoint">Time Complexity: <strong>${winRes.timeComplexity}</strong> | Space: <strong>${winRes.spaceComplexity}</strong></div>
        ${winner === 'astar' ? '<div class="apoint">Uses admissible Manhattan heuristic: <strong>h(n) = |Δrow| + |Δcol|</strong></div>' : ''}
        ${winner === 'bfs'   ? '<div class="apoint">Guarantees shortest path in unweighted graphs</div>' : ''}
        ${winner === 'dfs'   ? '<div class="apoint">Uses LIFO stack, low memory footprint O(V)</div>' : ''}
      </div>
    `;

    document.getElementById('resultsPanel').style.display = 'block';
    document.getElementById('resultsPanel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    showToast(`🏆 Most Efficient: ${winMeta.label}`, 'success');
  }

  // ──────────────────────────────────────────────────────────
  //  CHARTS
  // ──────────────────────────────────────────────────────────
  function initCharts() {
    const chartDefaults = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#8892a4', font: { family: 'DM Sans', size: 11 } } } },
    };

    const axisStyle = {
      grid: { color: 'rgba(255,255,255,0.05)' },
      ticks: { color: '#4a5568', font: { family: 'Space Mono', size: 10 } },
    };

    // Nodes explored — horizontal bar (easier to read 3 labels)
    state.charts.nodes = new Chart(document.getElementById('nodesChart'), {
      type: 'bar',
      data: {
        labels: ['DFS', 'BFS', 'A*'],
        datasets: [{
          label: 'Nodes Explored',
          data: [0, 0, 0],
          backgroundColor: ['rgba(245,158,11,0.7)', 'rgba(0,229,255,0.65)', 'rgba(168,85,247,0.7)'],
          borderColor:      ['#f59e0b', '#00e5ff', '#a855f7'],
          borderWidth: 1,
          borderRadius: 6,
        }]
      },
      options: {
        ...chartDefaults,
        indexAxis: 'y',
        plugins: { ...chartDefaults.plugins, legend: { display: false } },
        scales: { x: axisStyle, y: { ...axisStyle, grid: { display: false } } }
      }
    });

    // Path length
    state.charts.path = new Chart(document.getElementById('pathChart'), {
      type: 'bar',
      data: {
        labels: ['DFS', 'BFS', 'A*'],
        datasets: [{
          label: 'Path Length',
          data: [0, 0, 0],
          backgroundColor: ['rgba(245,158,11,0.7)', 'rgba(0,229,255,0.65)', 'rgba(168,85,247,0.7)'],
          borderColor:      ['#f59e0b', '#00e5ff', '#a855f7'],
          borderWidth: 1,
          borderRadius: 6,
        }]
      },
      options: {
        ...chartDefaults,
        indexAxis: 'y',
        plugins: { ...chartDefaults.plugins, legend: { display: false } },
        scales: { x: axisStyle, y: { ...axisStyle, grid: { display: false } } }
      }
    });

    // Execution time
    state.charts.time = new Chart(document.getElementById('timeChart'), {
      type: 'bar',
      data: {
        labels: ['DFS', 'BFS', 'A*'],
        datasets: [{
          label: 'Time (ms)',
          data: [0, 0, 0],
          backgroundColor: ['rgba(245,158,11,0.7)', 'rgba(0,229,255,0.65)', 'rgba(168,85,247,0.7)'],
          borderColor:      ['#f59e0b', '#00e5ff', '#a855f7'],
          borderWidth: 1,
          borderRadius: 6,
        }]
      },
      options: {
        ...chartDefaults,
        indexAxis: 'y',
        plugins: { ...chartDefaults.plugins, legend: { display: false } },
        scales: { x: axisStyle, y: { ...axisStyle, grid: { display: false } } }
      }
    });

    // Radar
    state.charts.radar = new Chart(document.getElementById('radarChart'), {
      type: 'radar',
      data: {
        labels: ['Speed', 'Path Eff.', 'Node Eff.', 'Memory', 'Optimal'],
        datasets: [
          { label: 'DFS',  data: [0,0,0,0,0], borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.12)', pointBackgroundColor: '#f59e0b', pointRadius: 3 },
          { label: 'BFS',  data: [0,0,0,0,0], borderColor: '#00e5ff', backgroundColor: 'rgba(0,229,255,0.10)',   pointBackgroundColor: '#00e5ff', pointRadius: 3 },
          { label: 'A*',   data: [0,0,0,0,0], borderColor: '#a855f7', backgroundColor: 'rgba(168,85,247,0.12)', pointBackgroundColor: '#a855f7', pointRadius: 3 },
        ]
      },
      options: {
        ...chartDefaults,
        plugins: { legend: { labels: { color: '#8892a4', font: { family: 'DM Sans', size: 10 }, boxWidth: 10, padding: 10 } } },
        scales: {
          r: {
            min: 0, max: 100,
            ticks: { stepSize: 25, color: '#4a5568', backdropColor: 'transparent', font: { family: 'Space Mono', size: 8 } },
            grid: { color: 'rgba(255,255,255,0.06)' },
            pointLabels: { color: '#8892a4', font: { family: 'DM Sans', size: 10 } },
          }
        }
      }
    });
  }

  function updateCharts() {
    const res = state.results;
    const get = (k, field) => res[k] ? res[k][field] : 0;

    // ── Update summary cards ──
    const algos = { dfs: 'dfs', bfs: 'bfs', astar: 'astar' };
    for (const [key, id] of Object.entries(algos)) {
      const r = res[key];
      document.getElementById(`sum-${id}-nodes`).textContent = r ? r.nodesExplored : '—';
      document.getElementById(`sum-${id}-path`).textContent  = r ? r.pathLength    : '—';
      document.getElementById(`sum-${id}-time`).textContent  = r ? r.time.toFixed(3) + ' ms' : '—';
    }

    // Determine winner for summary card
    const keys = Object.keys(res);
    if (keys.length > 0) {
      const scored = keys.map(k => ({
        k,
        score: res[k].nodesExplored * 0.4 + res[k].pathLength * 0.4 + res[k].time * 0.2
      })).sort((a, b) => a.score - b.score);
      const wk = scored[0].k;
      const wNames = { dfs: 'DFS', bfs: 'BFS', astar: 'A*' };
      const wColors = { dfs: '#f59e0b', bfs: '#00e5ff', astar: '#a855f7' };
      const wReasons = {
        dfs:   'Fewest nodes explored on this maze',
        bfs:   'Shortest guaranteed path found',
        astar: 'Heuristic guided most efficient search',
      };
      document.getElementById('sum-winner-name').textContent   = wNames[wk];
      document.getElementById('sum-winner-name').style.color   = wColors[wk];
      document.getElementById('sum-winner-reason').textContent = wReasons[wk];
    }

    // ── Update chart data ──
    state.charts.nodes.data.datasets[0].data = [
      get('dfs','nodesExplored'), get('bfs','nodesExplored'), get('astar','nodesExplored')
    ];
    state.charts.nodes.update();

    state.charts.path.data.datasets[0].data = [
      get('dfs','pathLength'), get('bfs','pathLength'), get('astar','pathLength')
    ];
    state.charts.path.update();

    state.charts.time.data.datasets[0].data = [
      get('dfs','time'), get('bfs','time'), get('astar','time')
    ];
    state.charts.time.update();

    // Radar
    const maxNodes = Math.max(1, get('dfs','nodesExplored'), get('bfs','nodesExplored'), get('astar','nodesExplored'));
    const maxPath  = Math.max(1, get('dfs','pathLength'),    get('bfs','pathLength'),    get('astar','pathLength'));
    const maxTime  = Math.max(0.001, get('dfs','time'),      get('bfs','time'),          get('astar','time'));

    const radarData = (k) => {
      const r = res[k];
      if (!r) return [0,0,0,0,0];
      const speed      = Math.max(5, 100 - Math.round((r.time / maxTime) * 95));
      const pathEff    = Math.max(5, 100 - Math.round(((r.pathLength - get('bfs','pathLength')) / Math.max(1, maxPath)) * 60));
      const nodeEff    = Math.max(5, 100 - Math.round((r.nodesExplored / maxNodes) * 95));
      const memory     = k === 'dfs' ? 85 : k === 'bfs' ? 55 : 70;
      const optimality = k === 'dfs' ? 40 : k === 'bfs' ? 90 : 95;
      return [speed, pathEff, nodeEff, memory, optimality];
    };

    state.charts.radar.data.datasets[0].data = radarData('dfs');
    state.charts.radar.data.datasets[1].data = radarData('bfs');
    state.charts.radar.data.datasets[2].data = radarData('astar');
    state.charts.radar.update();

    // Scroll to analytics section (not all the way down)
    setTimeout(() => {
      document.getElementById('analytics-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 400);
  }

  // ──────────────────────────────────────────────────────────
  //  VIVA Q&A
  // ──────────────────────────────────────────────────────────
  const vivaQA = [
    {
      q: 'What is the time complexity of DFS and why?',
      a: 'DFS has time complexity O(V + E) where V = vertices (cells) and E = edges (connections). Every vertex is visited at most once, and every edge is checked at most twice. In a maze grid with dimensions r×c, V = r×c and E ≈ 2rc.'
    },
    {
      q: 'Why does BFS guarantee the shortest path?',
      a: 'BFS explores nodes in order of their distance from the source (level by level using a FIFO queue). The first time it reaches the destination, it has used the minimum number of steps — making it provably optimal for unweighted graphs.'
    },
    {
      q: 'Explain the f(n) = g(n) + h(n) formula in A*.',
      a: 'f(n) is the estimated total cost of the path through node n. g(n) is the exact cost from start to n. h(n) is the heuristic — an estimate of cost from n to the goal. A* expands nodes with the lowest f(n) first, balancing known cost with estimated remaining cost.'
    },
    {
      q: 'What makes a heuristic admissible in A*?',
      a: 'A heuristic h(n) is admissible if it never overestimates the true cost to the goal. Manhattan distance (|Δrow| + |Δcol|) is admissible for 4-directional grid movement because the real path can never be shorter than the straight-line taxicab distance.'
    },
    {
      q: 'How does Recursive Backtracking generate a perfect maze?',
      a: 'It performs a randomized DFS starting from a cell. It randomly picks an unvisited neighbor, removes the wall between them, and recurses. When stuck (all neighbors visited), it backtracks. Since every cell is visited exactly once with a unique parent, the result is a spanning tree — a perfect maze with exactly one path between any two cells.'
    },
    {
      q: 'What is the space complexity of BFS vs DFS?',
      a: 'Both are O(V) in the worst case. DFS uses O(depth) stack space — for a maze this is O(V) in the worst case. BFS stores the entire frontier which can be O(V) at its widest. In practice, DFS uses less memory for deep graphs since its stack grows incrementally.'
    },
    {
      q: 'When would DFS outperform A* in maze solving?',
      a: 'If the goal is located deep down a straight corridor that DFS happens to explore first, DFS finds it with minimal backtracking. DFS is also faster in terms of implementation overhead since it has no priority queue. However, this is luck-dependent — A* is systematically better in general.'
    },
    {
      q: 'What is the difference between complete and optimal algorithms?',
      a: 'A complete algorithm guarantees finding a solution if one exists (DFS, BFS, A* are all complete for finite graphs). An optimal algorithm guarantees finding the best (shortest) solution. BFS is optimal for unweighted graphs; A* is optimal with an admissible heuristic; DFS is NOT optimal.'
    },
    {
      q: 'How does maze generation differ from maze solving?',
      a: 'Maze generation creates the structure by carving paths (using DFS/Prim\'s etc.) to form a connected graph with walls. Maze solving finds a path from start to end within the existing structure. Generation and solving both use graph traversal but for different objectives.'
    },
    {
      q: 'What is the Manhattan distance and why is it suitable for grid mazes?',
      a: 'Manhattan (taxicab) distance is the sum of absolute differences in row and column: h = |r1−r2| + |c1−c2|. It represents the minimum moves needed with 4-directional movement (no diagonals), making it a tight admissible heuristic for grid mazes.'
    },
  ];

  function populateViva() {
    const grid = document.getElementById('vivaGrid');
    grid.innerHTML = '';
    vivaQA.forEach(({ q, a }) => {
      const item = document.createElement('div');
      item.className = 'viva-item';
      item.innerHTML = `
        <div class="viva-q">${q}</div>
        <div class="viva-a">${a}</div>
      `;
      item.querySelector('.viva-q').addEventListener('click', () => {
        item.classList.toggle('open');
      });
      grid.appendChild(item);
    });
  }

  // ──────────────────────────────────────────────────────────
  //  PARTICLES BACKGROUND
  // ──────────────────────────────────────────────────────────
  function setupParticles() {
    const pc = document.getElementById('particles-canvas');
    const pctx = pc.getContext('2d');
    pc.width  = window.innerWidth;
    pc.height = window.innerHeight;

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * pc.width,
      y: Math.random() * pc.height,
      r: Math.random() * 1.5 + 0.5,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.5 + 0.1,
    }));

    function animParticles() {
      pctx.clearRect(0, 0, pc.width, pc.height);
      for (const p of particles) {
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0) p.x = pc.width;
        if (p.x > pc.width) p.x = 0;
        if (p.y < 0) p.y = pc.height;
        if (p.y > pc.height) p.y = 0;

        pctx.beginPath();
        pctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        pctx.fillStyle = `rgba(0,229,255,${p.alpha})`;
        pctx.fill();
      }
      requestAnimationFrame(animParticles);
    }
    animParticles();

    window.addEventListener('resize', () => {
      pc.width  = window.innerWidth;
      pc.height = window.innerHeight;
    });
  }

  // ──────────────────────────────────────────────────────────
  //  TOAST NOTIFICATIONS
  // ──────────────────────────────────────────────────────────
  function showToast(msg, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100px)';
      toast.style.transition = '0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ──────────────────────────────────────────────────────────
  //  PHASE MANAGEMENT
  // ──────────────────────────────────────────────────────────
  function setPhase(n) {
    state.phase = n;
    for (let i = 1; i <= 5; i++) {
      const el = document.getElementById(`phase${i}`);
      el.classList.remove('active', 'complete');
      if (i < n)      el.classList.add('complete');
      else if (i === n) el.classList.add('active');
    }
  }

  // ──────────────────────────────────────────────────────────
  //  UTILS
  // ──────────────────────────────────────────────────────────
  function clearAll() {
    if (state.controls) state.controls.disable();
    if (renderLoopId) cancelAnimationFrame(renderLoopId);
    clearTimers();
    state.grid = null;
    state.player = null;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    document.getElementById('mazeOverlay').classList.remove('hidden');
    hideWinBanner();
    hideResults();
    setPhase(0);
    document.getElementById('solveBtn').disabled = true;
    document.getElementById('moveCount').textContent = '0';
    document.getElementById('gameStatus').textContent = '—';
    document.getElementById('timerDisplay').textContent = '00:00';
    ['dfs','bfs','astar'].forEach(a => {
      document.getElementById(`live-${a}`).textContent = '—';
    });
  }

  function clearTimers() {
    if (state.timerInterval) clearInterval(state.timerInterval);
    state.timerInterval = null;
  }

  function updateTimerDisplay() {
    document.getElementById('timerDisplay').textContent = formatTime(state.timerSeconds);
  }

  function formatTime(s) {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  }

  function hideWinBanner() {
    document.getElementById('winBanner').style.display = 'none';
  }

  function hideResults() {
    document.getElementById('resultsPanel').style.display = 'none';
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function updateNavActive() {
    const sections = ['maze-section', 'analytics-section', 'theory-section'];
    let current = sections[0];
    for (const id of sections) {
      const el = document.getElementById(id);
      if (el && window.scrollY >= el.offsetTop - 120) current = id;
    }
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
    });
  }

  // ── BOOT ──────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', init);
  if (document.readyState !== 'loading') init();

})();
