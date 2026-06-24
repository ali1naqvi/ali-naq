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
      this.initRetryCount = 0;
      this.maxInitRetries = 50; // retry longer in case the section renders late

      // --- Rendering & timing ---
      this.animationId = null;
      this.lastTime = performance.now();
      this.accumGrid = 0;          // accumulator for grid steps
      this.accumTerrain = 0;       // accumulator for mountain parallax
      this.maxAge = 10;            // cells auto-die after this many steps to prevent messy growth
      this.gridStepMs = 180;       // grid update cadence (slightly slower)
      this.mountainStepMs = 40;    // mountain shift update (~25 FPS)

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
      this.currentRule = this.lifeRules[0];

      // Small noise to keep twinkling everywhere
      this.noiseBirth = 0.0002;
      this.noiseDeath = 0.0001;

      // Mountains
      this.mountainLayers = [];
      this.mountainPhase = null;

      // Offscreen canvas for the CA grid (1px per cell)
      this.layer = document.createElement('canvas');
      this.layerCtx = this.layer.getContext('2d');

      // Grid buffers (1D typed arrays for speed)
      this.rows = 0;
      this.cols = 0;
      this.grid = null;
      this.nextGrid = null;
      this.age = null;
      this.nextAge = null;

      // Precomputed per-row brightness for quick draw
      this.rowAlpha = [];

      this.init();
      this.setupResize();
      this.setupThemeObserver();
    }

    // --- Init & layout ---
    init() {
      this.resize();
      
      // Only proceed if canvas has valid dimensions and grid is initialized
      if (!this.grid || this.canvas.width === 0 || this.canvas.height === 0) {
        // Retry after a short delay if section isn't ready
        this.initRetryCount++;
        if (this.initRetryCount < this.maxInitRetries) {
          setTimeout(() => this.init(), 100);
        } else {
          // If max retries reached, try to initialize anyway with minimal size
          console.warn('Starfield automata: Section not ready after max retries, initializing with default size');
          if (!this.grid) {
            this.canvas.width = 100;
            this.canvas.height = 100;
            this.resize(); // Force resize to initialize buffers
          }
        }
        if (!this.grid) return; // Still can't proceed
      }
      
      // Reset retry count on success
      this.initRetryCount = 0;
      
      this.initMountains();
      this.initGrid();
      
      // Mark canvas as ready after initial setup
      if (this.canvas) {
        // Use requestAnimationFrame to ensure canvas is rendered before showing
        requestAnimationFrame(() => {
          this.canvas.classList.add('ready');
        });
      }
      
      // Start animation
      this.animate();
    }

    resize() {
      if (!this.section) return;
      const rect = this.section.getBoundingClientRect();

      // Size the main canvas to section size
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      
      // Only proceed if section has valid dimensions (at least 1px)
      if (width <= 0 || height <= 0) {
        return;
      }
      
      this.canvas.width = width;
      this.canvas.height = height;
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
      this.age = new Uint8Array(this.rows * this.cols);
      this.nextAge = new Uint8Array(this.rows * this.cols);

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

    // --- Mountains ---
    initMountains() {
      // Build layered mountain profiles (foreground to background)
      const h = this.canvas.height;

      const paletteDark = [
        'rgba(20, 30, 60, 0.95)',
        'rgba(26, 38, 74, 0.92)',
        'rgba(32, 46, 88, 0.90)',
        'rgba(44, 60, 110, 0.88)'
      ];
      const paletteLight = [
        'rgba(180, 200, 220, 0.95)',
        'rgba(165, 190, 215, 0.92)',
        'rgba(150, 180, 210, 0.90)',
        'rgba(140, 170, 200, 0.88)'
      ];
      const pal = this.isDarkMode ? paletteDark : paletteLight;

      this.mountainLayers = [
        { amp: h * 0.08, base: h * 0.62, freq: 0.008, speed: 0.0007, color: pal[0] },
        { amp: h * 0.10, base: h * 0.72, freq: 0.010, speed: 0.0005, color: pal[1] },
        { amp: h * 0.12, base: h * 0.82, freq: 0.012, speed: 0.00035, color: pal[2] },
        { amp: h * 0.16, base: h * 0.90, freq: 0.014, speed: 0.00025, color: pal[3] }
      ];
      this.mountainPhase = new Float32Array(this.mountainLayers.length);
      for (let i = 0; i < this.mountainPhase.length; i++) {
        this.mountainPhase[i] = Math.random() * Math.PI * 2;
      }
    }

    initGrid() {
      // Global random seeding so rules happen everywhere
      const seedDensity = 0.03; // 3% cells alive initially (less growth)
      const N = this.rows * this.cols;
      this.age.fill(0);
      for (let i = 0; i < N; i++) {
        this.grid[i] = Math.random() < seedDensity ? 1 : 0;
      }
    }

    updateGrid() {
      const rows = this.rows, cols = this.cols;
      const g = this.grid, ng = this.nextGrid;
      const age = this.age, na = this.nextAge;
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

          if (nextVal === 1) {
            let a = age[idx] + 1;
            if (a > this.maxAge) {
              nextVal = 0;
              na[idx] = 0;
            } else {
              na[idx] = a;
            }
          } else {
            na[idx] = 0;
          }

          ng[idx] = nextVal;
        }
      }

      // Swap buffers without realloc
      this.nextGrid = g;
      this.grid = ng;
      this.nextAge = age;
      this.age = na;
    }

    // Draw grid via offscreen image data (fast) and scale up once
    drawGrid() {
      const rows = this.rows, cols = this.cols;
      const g = this.grid;

      const img = this.layerCtx.createImageData(cols, rows);
      const data = img.data; // Uint8ClampedArray

      // Choose base color per theme (only active cells drawn)
      const baseR = 180;
      const baseG = 225;
      const baseB = 255;

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

    drawMountains() {
      const w = this.canvas.width;
      const h = this.canvas.height;

      for (let i = 0; i < this.mountainLayers.length; i++) {
        const L = this.mountainLayers[i];
        const phase = this.mountainPhase[i];

        this.ctx.beginPath();
        this.ctx.moveTo(0, h);

        // sample the profile at regular steps
        const step = Math.max(2, Math.floor(w / 200));
        for (let x = 0; x <= w; x += step) {
          const y0 = Math.sin(x * L.freq + phase);
          const y1 = Math.sin(x * L.freq * 2.1 + phase * 1.7) * 0.35;
          const y2 = Math.sin(x * L.freq * 3.7 + phase * 2.3) * 0.15;
          const y = L.base - L.amp * (
            0.60 * (y0 * 0.5 + 0.5) +
            0.25 * (y1 * 0.5 + 0.5) +
            0.15 * (y2 * 0.5 + 0.5)
          );
          this.ctx.lineTo(x, y);
        }

        this.ctx.lineTo(w, h);
        this.ctx.closePath();
        this.ctx.fillStyle = L.color;
        this.ctx.fill();
      }
    }

    clear() {
      const w = this.canvas.width;
      const h = this.canvas.height;
      const g = this.ctx.createLinearGradient(0, 0, 0, h);
      if (this.isDarkMode) {
        g.addColorStop(0, 'rgba(6, 8, 20, 1)');
        g.addColorStop(1, 'rgba(12, 18, 36, 1)');
      } else {
        g.addColorStop(0, 'rgba(230, 245, 255, 1)');
        g.addColorStop(1, 'rgba(204, 232, 255, 1)');
      }
      this.ctx.fillStyle = g;
      this.ctx.fillRect(0, 0, w, h);
    }

    animate() {
      // Ensure canvas is visible once animation starts
      if (this.canvas && !this.canvas.classList.contains('ready')) {
        this.canvas.classList.add('ready');
      }

      const now = performance.now();
      const dt = now - this.lastTime;
      this.lastTime = now;

      this.accumGrid += dt;
      this.accumTerrain += dt;

      this.clear();

      // Update & draw mountains (parallax)
      if (this.accumTerrain >= this.mountainStepMs) {
        const steps = Math.floor(this.accumTerrain / this.mountainStepMs);
        this.accumTerrain -= steps * this.mountainStepMs;
        for (let i = 0; i < this.mountainPhase.length; i++) {
          this.mountainPhase[i] += this.mountainLayers[i].speed * steps * this.mountainStepMs;
        }
      }
      this.drawMountains();

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
          this.initMountains();
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
          this.initMountains();
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
    console.info('Mountains canvas ready:', !!canvas, 'in section:', !!section);

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