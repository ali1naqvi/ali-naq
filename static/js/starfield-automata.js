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

