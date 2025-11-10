/*
  Starfield Cellular Automata - Creates a starry sky with twinkling stars
  Inspired by cellular automata patterns
*/

(function() {
  'use strict';

  class StarfieldAutomata {
    constructor(canvasId, sectionId) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) return;
      
      this.ctx = this.canvas.getContext('2d');
      this.section = document.getElementById(sectionId);
      if (!this.section) return;
      
      this.isDarkMode = document.documentElement.classList.contains('dark');
      this.stars = [];
      this.grid = [];
      this.animationId = null;
      this.lastTime = 0;
      this.frameDelay = 50; // ms between frames
      
      // Cellular automata rules (simplified for star patterns)
      this.rules = [
        [0, 1, 1, 1, 1, 0, 0, 0],   // Rule 30
        [0, 1, 1, 1, 1, 1, 1, 0],   // Rule 126
        [0, 0, 1, 1, 1, 1, 0, 0],
        [1, 0, 1, 0, 0, 1, 0, 1],  // Space pyramid
      ];
      
      this.currentRule = this.rules[Math.floor(Math.random() * this.rules.length)];
      this.scale = 2;
      this.cellSize = 2 * this.scale;
      
      this.init();
      this.setupResize();
      this.setupThemeObserver();
    }

    init() {
      this.resize();
      this.initStars();
      this.initGrid();
      this.animate();
    }

    resize() {
      if (!this.section) return;
      
      const rect = this.section.getBoundingClientRect();
      this.canvas.width = rect.width;
      this.canvas.height = rect.height;
      
      // Ensure canvas covers the section
      this.canvas.style.width = '100%';
      this.canvas.style.height = '100%';
      this.canvas.style.position = 'absolute';
      this.canvas.style.top = '0';
      this.canvas.style.left = '0';
      this.canvas.style.zIndex = '0';
    }

    initStars() {
      const numStars = Math.floor((this.canvas.width * this.canvas.height) / 6000);
      this.stars = [];
      
      for (let i = 0; i < numStars; i++) {
        this.stars.push({
          x: Math.random() * this.canvas.width,
          y: Math.random() * this.canvas.height,
          size: Math.random() * 2 + 0.5,
          brightness: Math.random(),
          twinkleSpeed: Math.random() * 0.03 + 0.01,
          phase: Math.random() * Math.PI * 2
        });
      }
    }

    initGrid() {
      const numRows = Math.ceil(this.canvas.height / this.cellSize);
      const numCols = Math.ceil(this.canvas.width / this.cellSize);
      
      this.grid = Array(numRows).fill(0).map(() => Array(numCols).fill(0));
      
      // Seed initial values - create some star clusters
      const middleRow = Math.floor(numRows / 2);
      const middleCol = Math.floor(numCols / 2);
      
      // Seed pattern for cellular automata
      if (Math.random() < 0.33) {
        this.grid[middleRow][middleCol] = 1;
      } else if (Math.random() < 0.66) {
        this.grid[middleRow][middleCol] = 1;
        this.grid[middleRow][0] = 1;
        this.grid[middleRow][numCols - 1] = 1;
      } else {
        for (let i = 0; i < 4; i++) {
          const row = Math.floor(Math.random() * numRows);
          const col = Math.floor(Math.random() * numCols);
          this.grid[row][col] = 1;
        }
      }
    }

    getColor(isActive, distance) {
      if (this.isDarkMode) {
        // Dark mode: dark blue/black background, bright stars
        if (isActive) {
          const brightness = Math.min(1, 0.4 + distance * 0.6);
          return `rgba(255, 255, 255, ${brightness})`;
        }
        return 'rgba(5, 5, 20, 0.95)';
      } else {
        // Light mode: light blue/white background, dark stars
        if (isActive) {
          const brightness = Math.min(1, 0.6 + distance * 0.4);
          return `rgba(50, 50, 100, ${brightness})`;
        }
        return 'rgba(245, 250, 255, 0.95)';
      }
    }

    drawStars() {
      const currentTime = Date.now();
      const deltaTime = currentTime - this.lastTime;
      
      if (deltaTime < this.frameDelay) return;
      this.lastTime = currentTime;

      this.stars.forEach(star => {
        star.phase += star.twinkleSpeed;
        const twinkle = (Math.sin(star.phase) + 1) / 2;
        const brightness = 0.4 + twinkle * 0.6;
        
        this.ctx.fillStyle = this.isDarkMode 
          ? `rgba(255, 255, 255, ${brightness})`
          : `rgba(50, 50, 100, ${brightness})`;
        
        this.ctx.beginPath();
        this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Add glow effect for brighter stars in dark mode
        if (this.isDarkMode && brightness > 0.7) {
          this.ctx.shadowBlur = 3;
          this.ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
          this.ctx.fill();
          this.ctx.shadowBlur = 0;
        }
      });
    }

    updateGrid() {
      const numRows = this.grid.length;
      const numCols = this.grid[0].length;
      const newGrid = Array(numRows).fill(0).map(() => Array(numCols).fill(0));
      
      // Apply cellular automata rule
      for (let i = 0; i < numRows - 1; i++) {
        for (let j = 0; j < numCols; j++) {
          const left = j === 0 ? 0 : this.grid[i + 1][j - 1];
          const mid = this.grid[i + 1][j];
          const right = j === numCols - 1 ? 0 : this.grid[i + 1][j + 1];
          
          const index = 4 * left + 2 * mid + right;
          newGrid[i][j] = this.currentRule[index];
        }
      }
      
      // Copy bottom row to maintain pattern
      for (let j = 0; j < numCols; j++) {
        newGrid[numRows - 1][j] = this.grid[numRows - 1][j];
      }
      
      this.grid = newGrid;
    }

    drawGrid() {
      const middleRow = Math.floor(this.grid.length / 2);
      
      for (let i = 0; i < this.grid.length; i++) {
        for (let j = 0; j < this.grid[i].length; j++) {
          const distance = Math.abs((middleRow - i) / middleRow);
          const isActive = this.grid[i][j] === 1;
          
          this.ctx.fillStyle = this.getColor(isActive, distance);
          this.ctx.fillRect(
            j * this.cellSize,
            i * this.cellSize,
            this.cellSize,
            this.cellSize
          );
        }
      }
    }

    clear() {
      // Clear with appropriate background color
      this.ctx.fillStyle = this.isDarkMode 
        ? 'rgba(5, 5, 20, 1)' 
        : 'rgba(245, 250, 255, 1)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    animate() {
      this.clear();
      this.drawStars();
      this.drawGrid();
      
      // Update grid occasionally for animation (slower for subtle effect)
      if (Math.random() < 0.05) {
        this.updateGrid();
      }
      
      this.animationId = requestAnimationFrame(() => this.animate());
    }

    setupResize() {
      let resizeTimeout;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          this.resize();
          this.initStars();
          this.initGrid();
        }, 250);
      });
    }

    setupThemeObserver() {
      // Watch for theme changes
      const observer = new MutationObserver(() => {
        const wasDark = this.isDarkMode;
        this.isDarkMode = document.documentElement.classList.contains('dark');
        
        if (wasDark !== this.isDarkMode) {
          // Theme changed, redraw
          this.clear();
        }
      });
      
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class']
      });
    }

    destroy() {
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
      }
    }
  }

  // Store instance to prevent duplicates
  let starfieldInstance = null;

  // Initialize when DOM is ready
  function initStarfield() {
    // Prevent multiple instances
    if (starfieldInstance) {
      return;
    }

    const section = document.getElementById('section-resume-biography-3');
    if (!section) return;

    // Check if canvas already exists
    let canvas = document.getElementById('starfield-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'starfield-canvas';
      const bgDiv = section.querySelector('.home-section-bg');
      if (bgDiv) {
        bgDiv.appendChild(canvas);
      } else {
        // Create bg div if it doesn't exist
        const newBgDiv = document.createElement('div');
        newBgDiv.className = 'home-section-bg';
        newBgDiv.appendChild(canvas);
        section.insertBefore(newBgDiv, section.firstChild);
      }
    }

    try {
      starfieldInstance = new StarfieldAutomata('starfield-canvas', 'section-resume-biography-3');
      
      // Clean up on page unload
      window.addEventListener('beforeunload', () => {
        if (starfieldInstance) {
          starfieldInstance.destroy();
        }
      });
    } catch (e) {
      console.error('Error initializing starfield automata:', e);
    }
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStarfield);
  } else {
    initStarfield();
  }

  // Also try after delays in case the section loads later (Hugo Blox may load sections dynamically)
  setTimeout(initStarfield, 500);
  setTimeout(initStarfield, 1000);
  setTimeout(initStarfield, 2000);
})();


/*
  Starfield Cellular Automata - Faster, 2D rules applied everywhere
  - Uses a compact offscreen canvas (1 pixel per cell) and scales up for speed
  - 2D outer-totalistic rules (Game of Life–style) with wrap-around edges
  - Global seeding (no single-row/center start)
*/

(function() {
  'use strict';

  class StarfieldAutomata {
    constructor(canvasId, sectionId) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) return;

      this.ctx = this.canvas.getContext('2d', { alpha: true });
      this.section = document.getElementById(sectionId);
      if (!this.section) return;

      this.isDarkMode = document.documentElement.classList.contains('dark');

      // --- Rendering & timing ---
      this.animationId = null;
      this.lastTime = performance.now();
      this.accumGrid = 0;          // accumulator for grid steps
      this.accumStars = 0;         // accumulator for star twinkle
      this.gridStepMs = 80;        // grid update every ~80ms
      this.starStepMs = 50;        // stars update every ~50ms

      // --- Virtual grid resolution (smaller = faster) ---
      // Each cell is rendered as 1px on an offscreen canvas, then scaled up.
      this.targetCellSize = 4;     // approx pixels per cell on the main canvas

      // --- CA rules (outer-totalistic: survive/born sets) ---
      this.lifeRules = [
        { survive: [2,3], born: [3] },          // Conway's Life (B3/S23)
        { survive: [2,3,4], born: [3] },        // Slightly denser
        { survive: [1,2,3,4], born: [2] },      // Maze-like
        { survive: [2,4,5], born: [3,4] }       // Sparkly clusters
      ];
      this.currentRule = this.lifeRules[Math.floor(Math.random() * this.lifeRules.length)];

      // Small noise to keep twinkling everywhere
      this.noiseBirth = 0.0006;
      this.noiseDeath = 0.0003;

      // Stars
      this.stars = [];

      // Offscreen canvas for the CA grid (1px per cell)
      this.layer = document.createElement('canvas');
      this.layerCtx = this.layer.getContext('2d');

      // Grid buffers (1D typed arrays for speed)
      this.rows = 0;
      this.cols = 0;
      this.grid = null;
      this.nextGrid = null;

      // Precomputed per-row brightness for quick draw
      this.rowAlpha = [];

      this.init();
      this.setupResize();
      this.setupThemeObserver();
    }

    // --- Init & layout ---
    init() {
      this.resize();
      this.initStars();
      this.initGrid();
      this.animate();
    }

    resize() {
      if (!this.section) return;
      const rect = this.section.getBoundingClientRect();

      // Size the main canvas to section size
      this.canvas.width = Math.max(1, Math.floor(rect.width));
      this.canvas.height = Math.max(1, Math.floor(rect.height));
      const w = this.canvas.width;
      const h = this.canvas.height;

      // Decide the virtual grid size from target cell size
      this.cols = Math.max(8, Math.floor(w / this.targetCellSize));
      this.rows = Math.max(8, Math.floor(h / this.targetCellSize));

      // Offscreen canvas matches grid resolution (1px per cell)
      this.layer.width = this.cols;
      this.layer.height = this.rows;

      // Allocate / reallocate typed buffers
      this.grid = new Uint8Array(this.rows * this.cols);
      this.nextGrid = new Uint8Array(this.rows * this.cols);

      // Precompute per-row alpha (center -> lower alpha, edges -> higher alpha)
      this.rowAlpha = new Uint8Array(this.rows);
      const mid = (this.rows - 1) / 2;
      for (let r = 0; r < this.rows; r++) {
        const distance = Math.abs((mid - r) / Math.max(1, mid)); // 0 at center, ~1 at edges
        const brightness = this.isDarkMode ? (0.4 + distance * 0.6) : (0.6 + distance * 0.4);
        this.rowAlpha[r] = Math.max(0, Math.min(255, Math.floor(255 * brightness)));
      }

      // Style for main canvas
      this.canvas.style.width = '100%';
      this.canvas.style.height = '100%';
      this.canvas.style.position = 'absolute';
      this.canvas.style.top = '0';
      this.canvas.style.left = '0';
      this.canvas.style.zIndex = '0';

      // Redraw background immediately on resize
      this.clear();
    }

    // --- Stars ---
    initStars() {
      // Density scaled down; stars are cheap, but keep modest for speed
      const numStars = Math.floor((this.canvas.width * this.canvas.height) / 9000);
      this.stars.length = 0;

      for (let i = 0; i < numStars; i++) {
        this.stars.push({
          x: Math.random() * this.canvas.width,
          y: Math.random() * this.canvas.height,
          size: Math.random() * 1.8 + 0.4,
          brightness: Math.random(),
          twinkleSpeed: Math.random() * 0.025 + 0.008,
          phase: Math.random() * Math.PI * 2
        });
      }
    }

    // --- Grid ---
    initGrid() {
      // Global random seeding so rules happen everywhere
      const seedDensity = 0.08; // 8% cells alive initially
      const N = this.rows * this.cols;
      for (let i = 0; i < N; i++) {
        this.grid[i] = Math.random() < seedDensity ? 1 : 0;
      }
    }

    updateGrid() {
      const rows = this.rows, cols = this.cols;
      const g = this.grid, ng = this.nextGrid;
      const survive = this.currentRule.survive;
      const born = this.currentRule.born;

      // 8-neighborhood with wrap-around (toroidal)
      let idx = 0;
      for (let r = 0; r < rows; r++) {
        const rUp = (r === 0 ? rows - 1 : r - 1);
        const rDn = (r === rows - 1 ? 0 : r + 1);
        for (let c = 0; c < cols; c++, idx++) {
          const cLf = (c === 0 ? cols - 1 : c - 1);
          const cRt = (c === cols - 1 ? 0 : c + 1);

          const n =
            g[rUp * cols + cLf] + g[rUp * cols + c] + g[rUp * cols + cRt] +
            g[r    * cols + cLf]                  + g[r    * cols + cRt] +
            g[rDn * cols + cLf] + g[rDn * cols + c] + g[rDn * cols + cRt];

          const alive = g[idx] === 1;
          let nextVal = alive ? (survive.indexOf(n) !== -1 ? 1 : 0)
                              : (born.indexOf(n) !== -1 ? 1 : 0);

          // Gentle noise to keep twinkling
          if (nextVal === 0 && Math.random() < this.noiseBirth) nextVal = 1;
          else if (nextVal === 1 && Math.random() < this.noiseDeath) nextVal = 0;

          ng[idx] = nextVal;
        }
      }

      // Swap buffers without realloc
      this.nextGrid = g;
      this.grid = ng;
    }

    // Draw grid via offscreen image data (fast) and scale up once
    drawGrid() {
      const rows = this.rows, cols = this.cols;
      const g = this.grid;

      const img = this.layerCtx.createImageData(cols, rows);
      const data = img.data; // Uint8ClampedArray

      // Choose base color per theme (only active cells drawn)
      const baseR = this.isDarkMode ? 255 : 50;
      const baseG = this.isDarkMode ? 255 : 50;
      const baseB = this.isDarkMode ? 255 : 100;

      let p = 0; // pointer in RGBA array
      let idx = 0; // pointer in grid
      for (let r = 0; r < rows; r++) {
        const a = this.rowAlpha[r];
        for (let c = 0; c < cols; c++, idx++) {
          if (g[idx]) {
            data[p] = baseR;      // R
            data[p + 1] = baseG;  // G
            data[p + 2] = baseB;  // B
            data[p + 3] = a;      // A
          } else {
            // leave transparent so stars/background show through
            data[p] = 0; data[p + 1] = 0; data[p + 2] = 0; data[p + 3] = 0;
          }
          p += 4;
        }
      }

      this.layerCtx.putImageData(img, 0, 0);

      // Draw scaled once; disable smoothing for crisp pixels
      this.ctx.imageSmoothingEnabled = false;
      this.ctx.drawImage(this.layer, 0, 0, this.canvas.width, this.canvas.height);
    }

    // --- Stars ---
    drawStars() {
      // Twinkle update throttled by accumulator in animate()
      this.ctx.beginPath(); // minimize state changes
      for (let i = 0; i < this.stars.length; i++) {
        const s = this.stars[i];
        const twinkle = (Math.sin(s.phase) + 1) / 2;
        const brightness = 0.4 + twinkle * 0.6;
        this.ctx.fillStyle = this.isDarkMode
          ? `rgba(255, 255, 255, ${brightness})`
          : `rgba(50, 50, 100, ${brightness})`;
        this.ctx.moveTo(s.x + s.size, s.y);
        this.ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      }
      this.ctx.fill();
    }

    clear() {
      this.ctx.fillStyle = this.isDarkMode ? 'rgba(5, 5, 20, 1)' : 'rgba(245, 250, 255, 1)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    animate() {
      const now = performance.now();
      const dt = now - this.lastTime;
      this.lastTime = now;

      this.accumGrid += dt;
      this.accumStars += dt;

      this.clear();

      // Update & draw stars at ~20 FPS equivalent
      if (this.accumStars >= this.starStepMs) {
        const steps = Math.floor(this.accumStars / this.starStepMs);
        this.accumStars -= steps * this.starStepMs;
        for (let i = 0; i < this.stars.length; i++) {
          this.stars[i].phase += this.stars[i].twinkleSpeed * steps;
        }
      }
      this.drawStars();

      // Update CA grid at fixed cadence
      if (this.accumGrid >= this.gridStepMs) {
        const steps = Math.floor(this.accumGrid / this.gridStepMs);
        this.accumGrid -= steps * this.gridStepMs;
        for (let s = 0; s < steps; s++) this.updateGrid();
      }
      this.drawGrid();

      this.animationId = requestAnimationFrame(() => this.animate());
    }

    setupResize() {
      let resizeTimeout;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          const prevRule = this.currentRule; // keep the feel the same on resize
          this.resize();
          this.initStars();
          this.initGrid();
          this.currentRule = prevRule;
        }, 150);
      });
    }

    setupThemeObserver() {
      const observer = new MutationObserver(() => {
        const wasDark = this.isDarkMode;
        this.isDarkMode = document.documentElement.classList.contains('dark');
        if (wasDark !== this.isDarkMode) {
          // Recompute row alphas for new palette
          const mid = (this.rows - 1) / 2;
          for (let r = 0; r < this.rows; r++) {
            const distance = Math.abs((mid - r) / Math.max(1, mid));
            const brightness = this.isDarkMode ? (0.4 + distance * 0.6) : (0.6 + distance * 0.4);
            this.rowAlpha[r] = Math.max(0, Math.min(255, Math.floor(255 * brightness)));
          }
          this.clear();
        }
      });
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    }

    destroy() {
      if (this.animationId) cancelAnimationFrame(this.animationId);
    }
  }

  // Singleton per page to avoid duplicates
  let starfieldInstance = null;

  function initStarfield() {
    if (starfieldInstance) return;

    const section = document.getElementById('section-resume-biography-3');
    if (!section) return;

    let canvas = document.getElementById('starfield-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'starfield-canvas';
      const bgDiv = section.querySelector('.home-section-bg');
      if (bgDiv) {
        bgDiv.appendChild(canvas);
      } else {
        const newBgDiv = document.createElement('div');
        newBgDiv.className = 'home-section-bg';
        newBgDiv.appendChild(canvas);
        section.insertBefore(newBgDiv, section.firstChild);
      }
    }

    try {
      starfieldInstance = new StarfieldAutomata('starfield-canvas', 'section-resume-biography-3');
      window.addEventListener('beforeunload', () => starfieldInstance && starfieldInstance.destroy());
    } catch (e) {
      console.error('Error initializing starfield automata:', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStarfield);
  } else {
    initStarfield();
  }

  // In case the section is injected later by the theme
  setTimeout(initStarfield, 500);
  setTimeout(initStarfield, 1000);
  setTimeout(initStarfield, 2000);
})();