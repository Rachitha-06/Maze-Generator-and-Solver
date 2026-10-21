# MazeCore — Interactive Maze Generator & Algorithm Visualizer

> A premium, fully interactive web application for Analysis of Algorithms (AOA).  
> Demonstrates **DFS**, **BFS**, **A\***, and **Recursive Backtracking** with real-time visualization.

---

## 🚀 How to Run

No build step or server required.

```
1. Unzip / open the project folder
2. Double-click index.html  — opens in any modern browser
   OR
   Use VS Code Live Server → Right-click index.html → "Open with Live Server"
```

Works in Chrome, Firefox, Edge, Safari (any modern browser).

---

## 📁 File Structure

```
maze-visualizer/
├── index.html              ← Main HTML (layout, sections, script imports)
├── style.css               ← Full premium UI styles (glassmorphism, neon, dark theme)
├── script.js               ← App controller (generation, gameplay, visualization, charts)
│
├── maze/
│   └── generator.js        ← Recursive Backtracking maze generator
│
├── algorithms/
│   ├── dfs.js              ← Depth-First Search solver
│   ├── bfs.js              ← Breadth-First Search solver
│   └── astar.js            ← A* Search solver (Manhattan heuristic)
│
├── game/
│   ├── player.js           ← Player avatar, movement, trail, win detection
│   └── controls.js         ← Keyboard input handler (WASD + Arrow keys)
│
└── README.md               ← This file
```

---

## 🗺️ Project Flow (5 Phases)

| Phase | Description |
|-------|-------------|
| **1 — Generate** | Recursive Backtracking creates a random, solvable perfect maze with animated wall-carving |
| **2 — Play** | User navigates the maze using WASD / Arrow keys with move counter, timer, hints |
| **3 — Visualize** | DFS, BFS, and A* solve the same maze step-by-step with color-coded animations |
| **4 — Compare** | Side-by-side metrics: nodes explored, path length, execution time, efficiency score |
| **5 — Results** | Most efficient algorithm announced with detailed explanation and interactive charts |

---

## 🧠 Algorithm Summary

### Recursive Backtracking (Maze Generation)
- **Type:** Randomized DFS
- **Time:** O(V) — each cell visited once
- **Space:** O(V) — recursion stack
- **Output:** Perfect maze — exactly one path between any two cells

### DFS (Depth-First Search)
- **Data structure:** Stack (LIFO)
- **Time:** O(V + E)
- **Space:** O(V)
- **Optimal?** ✗ No — does not guarantee shortest path
- **Best for:** Deep exploration, cycle detection

### BFS (Breadth-First Search)
- **Data structure:** Queue (FIFO)
- **Time:** O(V + E)
- **Space:** O(V)
- **Optimal?** ✓ Yes — guarantees shortest path in unweighted graphs
- **Best for:** Shortest path, level-order traversal

### A* Search
- **Data structure:** Priority queue (min-heap by f value)
- **Formula:** `f(n) = g(n) + h(n)`
- **Heuristic:** Manhattan distance `h(n) = |Δrow| + |Δcol|`
- **Time:** O(E log V)
- **Space:** O(V)
- **Optimal?** ✓ Yes — with admissible heuristic
- **Best for:** Fastest optimal pathfinding

---

## 🎮 Controls

| Key | Action |
|-----|--------|
| `W` / `↑` | Move Up |
| `S` / `↓` | Move Down |
| `A` / `←` | Move Left |
| `D` / `→` | Move Right |
| **Generate Maze** button | Create new maze |
| **Visualize Algorithms** button | Run DFS / BFS / A* |
| **💡 Hint** button | Shows next optimal step |
| **Reset Player** button | Restart from beginning |
| **☀ / 🌙** button | Toggle light / dark theme |

---

## 📊 Analytics Dashboard

After each visualization run, the Analytics section updates with:
- **Bar charts** — nodes explored, path length, execution time per algorithm
- **Radar chart** — multi-dimension performance comparison (speed, path efficiency, node efficiency, memory, optimality)
- **Complexity table** — Big-O notation for all algorithms

---

## 🔬 Complexity Analysis Summary

| Algorithm | Time | Space | Shortest Path | Complete |
|-----------|------|-------|---------------|----------|
| DFS | O(V+E) | O(V) | ✗ | ✓ |
| BFS | O(V+E) | O(V) | ✓ | ✓ |
| A* | O(E log V) | O(V) | ✓ | ✓ |
| Rec. Backtrack | O(V) | O(V) | N/A | N/A |

---

## ❓ Viva Questions (Top 10)

1. **What is the time complexity of DFS?** → O(V+E); each vertex and edge visited once.
2. **Why does BFS guarantee the shortest path?** → FIFO queue ensures level-by-level exploration; first path to goal is always shortest.
3. **Explain f(n) = g(n) + h(n) in A\*.** → g(n) = known cost from start; h(n) = heuristic estimate to goal; f(n) = total estimated path cost.
4. **What is an admissible heuristic?** → One that never overestimates true cost. Manhattan distance is admissible for 4-directional grids.
5. **How does Recursive Backtracking guarantee a solvable maze?** → DFS visits every cell exactly once forming a spanning tree — a perfect maze with a unique path between any two cells.
6. **Space complexity of BFS vs DFS?** → Both O(V) worst case. BFS stores wide frontier; DFS stores deep call stack.
7. **When can DFS beat A\*?** → If goal aligns with DFS exploration order by luck; DFS has no priority-queue overhead.
8. **Difference between complete and optimal algorithms?** → Complete = always finds a solution if one exists. Optimal = finds the best (shortest) solution.
9. **What is Manhattan distance?** → h(n) = |Δrow| + |Δcol| — minimum steps in 4-directional movement.
10. **Why is A* generally the most efficient maze solver?** → Heuristic guides search toward goal, drastically reducing unnecessary node exploration vs. BFS and DFS.

---

## ✨ Features

- 🎨 Futuristic dark UI with glassmorphism, neon glows, smooth animations
- 🗺️ Animated maze generation with adjustable speed
- 🎮 Fully playable maze game (WASD/Arrow keys, timer, move counter, hints)
- 🔬 Step-by-step algorithm visualization with distinct color coding
- 📊 Live metrics + Chart.js analytics (bar + radar charts)
- 🏆 Automatic winner detection with detailed analysis
- 📚 Theory section with complexity tables and expandable viva Q&A
- 🌙 Dark / Light theme toggle
- 📱 Responsive layout (desktop, tablet, mobile)
- 🔔 Toast notifications for all key events

---

## 🔮 Future Enhancements

1. **Dijkstra's Algorithm** — weighted graph variant
2. **Bidirectional BFS** — search from both ends simultaneously
3. **Prim's Maze Generation** — alternative generator with different visual patterns
4. **Maze editor** — manually draw/erase walls
5. **Multiplayer mode** — race another player
6. **3D maze rendering** — WebGL first-person view
7. **Export maze** — save as PNG / JSON
8. **Custom heuristics** — switch between Manhattan, Euclidean, Chebyshev

---

## 📝 Credits

Built for **Analysis of Algorithms (AOA)** college project.  
Stack: HTML5 · CSS3 · Vanilla JavaScript · Chart.js 4.4  
