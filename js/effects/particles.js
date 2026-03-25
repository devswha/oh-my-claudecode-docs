/**
 * Advanced Particle Animation System for oh-my-claudecode website
 * Features: Canvas particles, parallax scrolling, gradient borders, typewriter effects, morphing SVG
 *
 * @module ParticleSystem
 * @author oh-my-claudecode designer agent
 */

export class ParticleSystem {
  constructor(options = {}) {
    // Configuration
    this.config = {
      container: options.container || '.hero',
      accentColor: options.accentColor || '#dc2626',
      maxParticles: options.maxParticles || 100,
      particleSize: options.particleSize || 2,
      connectionDistance: options.connectionDistance || 120,
      particleSpeed: options.particleSpeed || 0.3,
      mouseRepelRadius: options.mouseRepelRadius || 150,
      mouseRepelForce: options.mouseRepelForce || 0.5,
    };

    // Check for reduced motion preference
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // State
    this.particles = [];
    this.mouse = { x: null, y: null };
    this.animationFrame = null;
    this.isRunning = false;
    this.observers = [];

    // Canvas support check
    this.canvasSupported = !!document.createElement('canvas').getContext;

    // Bind methods
    this.animate = this.animate.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleScroll = this.handleScroll.bind(this);
    this.cleanup = this.cleanup.bind(this);

    // Initialize if motion allowed
    if (!this.prefersReducedMotion) {
      this.init();
    }
  }

  /**
   * Initialize all effects
   */
  init() {
    this.containerElement = document.querySelector(this.config.container);

    if (!this.containerElement) {
      console.warn('ParticleSystem: Container not found');
      return;
    }

    // Initialize canvas particles
    if (this.canvasSupported) {
      this.initCanvas();
      this.initParticles();
      this.start();
    }

    // Initialize scroll-based effects
    this.initParallax();

    // Initialize decorative effects
    this.initGradientBorders();
    this.initTypewriter();
    this.initMorphingShapes();
    this.initGlowPulse();

    // Event listeners
    window.addEventListener('resize', this.handleResize, { passive: true });
    window.addEventListener('mousemove', this.handleMouseMove, { passive: true });
    window.addEventListener('scroll', this.handleScroll, { passive: true });
    window.addEventListener('beforeunload', this.cleanup);

    // Reduced motion listener
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    motionQuery.addEventListener('change', (e) => {
      if (e.matches) {
        this.stop();
        this.disableAnimations();
      } else {
        this.start();
        this.enableAnimations();
      }
    });
  }

  /**
   * Initialize canvas for particle rendering
   */
  initCanvas() {
    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '1';

    this.ctx = this.canvas.getContext('2d', { alpha: true });

    // Insert canvas as first child
    this.containerElement.style.position = 'relative';
    this.containerElement.insertBefore(this.canvas, this.containerElement.firstChild);

    this.resizeCanvas();
  }

  /**
   * Resize canvas to container dimensions
   */
  resizeCanvas() {
    if (!this.canvas) return;

    const rect = this.containerElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;

    this.ctx.scale(dpr, dpr);

    this.width = rect.width;
    this.height = rect.height;
  }

  /**
   * Initialize particle pool
   */
  initParticles() {
    this.particles = [];

    // Adjust particle count based on viewport size - slightly denser for premium feel
    const viewportArea = this.width * this.height;
    const particleCount = Math.min(
      this.config.maxParticles,
      Math.floor(viewportArea / 12000)
    );

    for (let i = 0; i < particleCount; i++) {
      this.particles.push(this.createParticle());
    }
  }

  /**
   * Create a single particle
   */
  createParticle() {
    return {
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      baseX: 0,
      baseY: 0,
      vx: (Math.random() - 0.5) * this.config.particleSpeed,
      vy: -Math.random() * this.config.particleSpeed - 0.1, // Drifts upward
      size: Math.random() * this.config.particleSize + 1,
      opacity: Math.random() * 0.4 + 0.2,
      phase: Math.random() * Math.PI * 2,
      wobble: Math.random() * 0.5 + 0.2, // Individual wobble intensity
      glow: Math.random() > 0.8 // Randomly make some particles "glow stars"
    };
  }

  /**
   * Update particle positions
   */
  updateParticles() {
    this.particles.forEach(particle => {
      // Update phase for oscillation
      particle.phase += 0.015;

      // Gentle horizontal oscillation
      const oscillation = Math.sin(particle.phase) * particle.wobble;

      // Apply velocity
      particle.x += particle.vx + oscillation;
      particle.y += particle.vy;

      // Magnetic Mouse Interaction (Smooth Attraction/Repulsion)
      if (this.mouse.x !== null && this.mouse.y !== null) {
        const dx = particle.x - this.mouse.x;
        const dy = particle.y - this.mouse.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.config.mouseRepelRadius) {
          const force = (this.config.mouseRepelRadius - distance) / this.config.mouseRepelRadius;
          const angle = Math.atan2(dy, dx);
          
          // Smooth easing towards/away from mouse
          particle.x += Math.cos(angle) * force * this.config.mouseRepelForce * 1.5;
          particle.y += Math.sin(angle) * force * this.config.mouseRepelForce * 1.5;
        }
      }

      // Wrap around edges with slight padding
      if (particle.x < -20) particle.x = this.width + 20;
      if (particle.x > this.width + 20) particle.x = -20;
      if (particle.y < -20) particle.y = this.height + 20;
      if (particle.y > this.height + 20) particle.y = -20;
    });
  }

  /**
   * Draw particles and connections
   */
  drawParticles() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    const color = this.hexToRgb(this.config.accentColor);

    // 1. Draw connection lines with gradient opacity
    this.ctx.lineWidth = 0.6;
    for (let i = 0; i < this.particles.length; i++) {
      const p1 = this.particles[i];
      for (let j = i + 1; j < this.particles.length; j++) {
        const p2 = this.particles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.config.connectionDistance) {
          const alpha = (1 - dist / this.config.connectionDistance) * 0.25;
          this.ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
          this.ctx.beginPath();
          this.ctx.moveTo(p1.x, p1.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.stroke();
        }
      }
    }

    // 2. Draw particles with enhanced glow
    this.particles.forEach(p => {
      const pAlpha = p.opacity * (0.8 + Math.sin(p.phase) * 0.2); // Pulse opacity
      
      this.ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${pAlpha})`;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();

      if (p.glow) {
        this.ctx.shadowBlur = 12 * p.size;
        this.ctx.shadowColor = this.config.accentColor;
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
      }
    });
  }

  /**
   * Main animation loop
   */
  animate() {
    if (!this.isRunning) return;

    this.updateParticles();
    this.drawParticles();

    this.animationFrame = requestAnimationFrame(this.animate);
  }

  /**
   * Start animation
   */
  start() {
    if (this.isRunning || this.prefersReducedMotion) return;
    this.isRunning = true;
    this.animate();
  }

  /**
   * Stop animation
   */
  stop() {
    this.isRunning = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  /**
   * Initialize parallax scrolling effects
   */
  initParallax() {
    const title = this.containerElement.querySelector('h1, .hero-title');
    const subtitle = this.containerElement.querySelector('p, .hero-subtitle');
    const stats = this.containerElement.querySelectorAll('.stat-card, .stats > *');

    if (title) {
      title.style.willChange = 'transform';
      title.dataset.parallaxSpeed = '0.3';
    }

    if (subtitle) {
      subtitle.style.willChange = 'transform';
      subtitle.dataset.parallaxSpeed = '0.5';
    }

    stats.forEach((stat, i) => {
      stat.style.willChange = 'transform';
      stat.dataset.parallaxSpeed = String(0.7 + i * 0.1);
    });

    // Initial parallax update
    this.updateParallax();
  }

  /**
   * Update parallax positions on scroll (throttled)
   */
  updateParallax() {
    const scrollY = window.scrollY;
    const elements = this.containerElement.querySelectorAll('[data-parallax-speed]');

    elements.forEach(el => {
      const speed = parseFloat(el.dataset.parallaxSpeed);
      const offset = scrollY * speed;
      el.style.transform = `translate3d(0, ${offset}px, 0)`;
    });
  }

  /**
   * Initialize animated gradient borders
   */
  initGradientBorders() {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes gradient-rotate {
        0% { --gradient-angle: 0deg; }
        100% { --gradient-angle: 360deg; }
      }

      .gradient-border {
        position: relative;
        border: 2px solid transparent;
        background: linear-gradient(var(--bg-color, #000), var(--bg-color, #000)) padding-box,
                    linear-gradient(var(--gradient-angle, 0deg),
                      ${this.config.accentColor},
                      transparent 50%,
                      ${this.config.accentColor}) border-box;
        animation: gradient-rotate 3s linear infinite;
      }

      @property --gradient-angle {
        syntax: '<angle>';
        initial-value: 0deg;
        inherits: false;
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Initialize typewriter effect for tagline
   */
  initTypewriter() {
    const tagline = document.querySelector('[data-typewriter]');

    if (!tagline) return;

    const text = tagline.textContent;
    const speed = parseInt(tagline.dataset.typewriterSpeed) || 80;
    const cursorChar = tagline.dataset.typewriterCursor || '|';

    tagline.textContent = '';
    tagline.style.position = 'relative';

    // Create cursor
    const cursor = document.createElement('span');
    cursor.textContent = cursorChar;
    cursor.style.animation = 'blink 1s step-end infinite';
    cursor.className = 'typewriter-cursor';

    // Add cursor blink animation
    if (!document.querySelector('#typewriter-styles')) {
      const style = document.createElement('style');
      style.id = 'typewriter-styles';
      style.textContent = `
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        .typewriter-cursor {
          display: inline-block;
          margin-left: 2px;
        }
      `;
      document.head.appendChild(style);
    }

    // Type characters
    let i = 0;
    const typeInterval = setInterval(() => {
      if (i < text.length) {
        tagline.textContent += text.charAt(i);
        i++;
      } else {
        clearInterval(typeInterval);
        tagline.appendChild(cursor);
      }
    }, speed);

    // Store interval for cleanup
    this.typewriterInterval = typeInterval;
  }

  /**
   * Initialize morphing SVG decorations
   */
  initMorphingShapes() {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes morph-shape-1 {
        0%, 100% {
          d: path('M 0,100 C 50,120 100,80 150,100 L 150,200 L 0,200 Z');
        }
        50% {
          d: path('M 0,100 C 50,80 100,120 150,100 L 150,200 L 0,200 Z');
        }
      }

      @keyframes morph-shape-2 {
        0%, 100% {
          transform: scale(1) rotate(0deg);
          opacity: 0.1;
        }
        50% {
          transform: scale(1.2) rotate(180deg);
          opacity: 0.2;
        }
      }

      .morph-shape {
        position: absolute;
        pointer-events: none;
        z-index: 0;
      }

      .morph-shape path {
        animation: morph-shape-1 8s ease-in-out infinite;
      }

      .morph-shape svg {
        animation: morph-shape-2 12s ease-in-out infinite;
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Initialize glow pulse effect
   */
  initGlowPulse() {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes glow-pulse {
        0%, 100% {
          box-shadow: 0 0 5px ${this.config.accentColor}33,
                      0 0 10px ${this.config.accentColor}22,
                      0 0 15px ${this.config.accentColor}11;
        }
        50% {
          box-shadow: 0 0 10px ${this.config.accentColor}66,
                      0 0 20px ${this.config.accentColor}44,
                      0 0 30px ${this.config.accentColor}22;
        }
      }

      .glow-pulse {
        animation: glow-pulse 2s ease-in-out infinite;
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Handle window resize
   */
  handleResize() {
    if (this.resizeTimeout) clearTimeout(this.resizeTimeout);

    this.resizeTimeout = setTimeout(() => {
      this.resizeCanvas();
      this.initParticles();
    }, 150);
  }

  /**
   * Handle mouse move (for particle repulsion)
   */
  handleMouseMove(event) {
    if (!this.canvas) return;

    const rect = this.containerElement.getBoundingClientRect();
    this.mouse.x = event.clientX - rect.left;
    this.mouse.y = event.clientY - rect.top;
  }

  /**
   * Handle scroll (throttled)
   */
  handleScroll() {
    if (this.scrollTimeout) return;

    this.scrollTimeout = setTimeout(() => {
      this.updateParallax();
      this.scrollTimeout = null;
    }, 16); // ~60fps
  }

  /**
   * Disable all animations
   */
  disableAnimations() {
    const elements = this.containerElement.querySelectorAll('[style*="animation"]');
    elements.forEach(el => {
      el.style.animation = 'none';
    });

    if (this.canvas) {
      this.canvas.style.display = 'none';
    }
  }

  /**
   * Enable all animations
   */
  enableAnimations() {
    if (this.canvas) {
      this.canvas.style.display = 'block';
    }

    // Re-initialize effects
    this.initGradientBorders();
    this.initGlowPulse();
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.stop();

    // Remove event listeners
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('scroll', this.handleScroll);
    window.removeEventListener('beforeunload', this.cleanup);

    // Clear intervals
    if (this.typewriterInterval) {
      clearInterval(this.typewriterInterval);
    }

    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }

    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }

    // Remove canvas
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }

    // Clear particles
    this.particles = [];

    // Cleanup observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  /**
   * Convert hex color to RGB
   */
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 220, g: 38, b: 38 }; // Fallback to default red
  }

  /**
   * Destroy instance completely
   */
  destroy() {
    this.cleanup();
    this.containerElement = null;
    this.canvas = null;
    this.ctx = null;
  }
}

/**
 * Utility function to add gradient border to element
 */
export function addGradientBorder(element, bgColor = '#000') {
  element.classList.add('gradient-border');
  element.style.setProperty('--bg-color', bgColor);
}

/**
 * Utility function to add typewriter effect
 */
export function addTypewriter(element, options = {}) {
  element.dataset.typewriter = 'true';
  if (options.speed) element.dataset.typewriterSpeed = options.speed;
  if (options.cursor) element.dataset.typewriterCursor = options.cursor;
}

/**
 * Utility function to add glow pulse effect
 */
export function addGlowPulse(element) {
  element.classList.add('glow-pulse');
}

/**
 * Auto-initialize if data attribute present
 */
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const autoInit = document.querySelector('[data-particle-system]');
    if (autoInit) {
      const options = {
        container: autoInit.dataset.particleContainer || '.hero',
        accentColor: autoInit.dataset.particleColor || '#dc2626',
      };
      new ParticleSystem(options);
    }
  });
}

export default ParticleSystem;
