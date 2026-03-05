/**
 * Advanced Particle Animation System for oh-my-claudecode website
 * Enhanced with smoother animations, better performance, and richer visual effects
 *
 * @module ParticleSystem
 * @author oh-my-claudecode designer agent
 */

export class ParticleSystem {
  constructor(options = {}) {
    // Enhanced Configuration
    this.config = {
      container: options.container || '.hero',
      accentColor: options.accentColor || '#dc2626',
      secondaryColor: options.secondaryColor || '#ef4444',
      maxParticles: options.maxParticles || 80,
      particleSize: options.particleSize || 2.5,
      connectionDistance: options.connectionDistance || 130,
      particleSpeed: options.particleSpeed || 0.4,
      mouseRepelRadius: options.mouseRepelRadius || 120,
      mouseRepelForce: options.mouseRepelForce || 0.6,
      trailEffect: options.trailEffect !== false,
      trailLength: options.trailLength || 5,
      glowIntensity: options.glowIntensity || 15,
      particleShape: options.particleShape || 'circle', // circle, star, diamond
    };

    // Check for reduced motion preference
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // State
    this.particles = [];
    this.mouse = { x: null, y: null, vx: 0, vy: 0 };
    this.animationFrame = null;
    this.isRunning = false;
    this.observers = [];
    this.lastTime = 0;
    this.frameCount = 0;

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
    this.initMouseTrail();

    // Event listeners with passive option for performance
    window.addEventListener('resize', this.handleResize, { passive: true });
    window.addEventListener('mousemove', this.handleMouseMove, { passive: true });
    window.addEventListener('scroll', this.handleScroll, { passive: true });
    window.addEventListener('beforeunload', this.cleanup);

    // Visibility API to pause when tab is hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.stop();
      } else if (!this.prefersReducedMotion) {
        this.start();
      }
    });

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
   * Initialize canvas for particle rendering with high DPI support
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

    this.ctx = this.canvas.getContext('2d', {
      alpha: true,
      desynchronized: true // Better performance
    });

    // Insert canvas as first child
    this.containerElement.style.position = 'relative';
    this.containerElement.insertBefore(this.canvas, this.containerElement.firstChild);

    this.resizeCanvas();
  }

  /**
   * Resize canvas to container dimensions with DPR scaling
   */
  resizeCanvas() {
    if (!this.canvas) return;

    const rect = this.containerElement.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2x for performance

    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;

    this.ctx.scale(dpr, dpr);

    this.width = rect.width;
    this.height = rect.height;

    // Reinitialize particles on resize for better distribution
    this.initParticles();
  }

  /**
   * Initialize particle pool with enhanced properties
   */
  initParticles() {
    this.particles = [];

    // Adjust particle count based on viewport size
    const viewportArea = this.width * this.height;
    const particleCount = Math.min(
      this.config.maxParticles,
      Math.max(20, Math.floor(viewportArea / 12000))
    );

    const colors = this.generateColorPalette();

    for (let i = 0; i < particleCount; i++) {
      this.particles.push(this.createParticle(colors));
    }
  }

  /**
   * Generate color palette from accent color
   */
  generateColorPalette() {
    const baseColor = this.hexToRgb(this.config.accentColor);
    const secondaryColor = this.hexToRgb(this.config.secondaryColor);

    return [
      baseColor,
      secondaryColor,
      {
        r: Math.min(255, baseColor.r + 40),
        g: Math.min(255, baseColor.g + 40),
        b: Math.min(255, baseColor.b + 40)
      },
      {
        r: Math.max(0, baseColor.r - 20),
        g: Math.max(0, baseColor.g - 20),
        b: Math.max(0, baseColor.b - 20)
      }
    ];
  }

  /**
   * Create a single particle with enhanced properties
   */
  createParticle(colors) {
    const color = colors[Math.floor(Math.random() * colors.length)];

    return {
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      baseX: 0,
      baseY: 0,
      vx: (Math.random() - 0.5) * this.config.particleSpeed,
      vy: -Math.random() * this.config.particleSpeed - 0.15, // Gentle upward drift
      size: Math.random() * this.config.particleSize + 0.5,
      opacity: Math.random() * 0.4 + 0.2,
      color: color,
      phase: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.02 + 0.01,
      shape: ['circle', 'star', 'diamond'][Math.floor(Math.random() * 3)],
      trail: [],
    };
  }

  /**
   * Update particle positions with enhanced physics
   */
  updateParticles() {
    const time = Date.now() * 0.001;

    this.particles.forEach(particle => {
      // Store base position for repulsion
      particle.baseX = particle.x;
      particle.baseY = particle.y;

      // Update phase for oscillation
      particle.phase += particle.pulseSpeed;

      // Gentle horizontal oscillation with sine wave
      const oscillation = Math.sin(particle.phase) * 0.4;
      const verticalOscillation = Math.cos(particle.phase * 0.5) * 0.2;

      // Apply velocity with oscillation
      particle.x += particle.vx + oscillation;
      particle.y += particle.vy + verticalOscillation;

      // Pulse opacity for twinkling effect
      particle.currentOpacity = particle.opacity * (0.7 + 0.3 * Math.sin(particle.phase * 2));

      // Mouse repulsion with smooth falloff
      if (this.mouse.x !== null && this.mouse.y !== null) {
        const dx = particle.x - this.mouse.x;
        const dy = particle.y - this.mouse.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.config.mouseRepelRadius) {
          const force = Math.pow((this.config.mouseRepelRadius - distance) / this.config.mouseRepelRadius, 2);
          const angle = Math.atan2(dy, dx);
          const repelX = Math.cos(angle) * force * this.config.mouseRepelForce;
          const repelY = Math.sin(angle) * force * this.config.mouseRepelForce;

          particle.x += repelX;
          particle.y += repelY;

          // Add trail point during repulsion
          if (this.config.trailEffect && force > 0.3) {
            particle.trail.push({ x: particle.x, y: particle.y, opacity: force });
          }
        }
      }

      // Manage trail
      if (this.config.trailEffect) {
        particle.trail = particle.trail.slice(-this.config.trailLength);
      }

      // Wrap around edges smoothly
      if (particle.x < -20) particle.x = this.width + 20;
      if (particle.x > this.width + 20) particle.x = -20;
      if (particle.y < -20) particle.y = this.height + 20;
      if (particle.y > this.height + 20) particle.y = -20;
    });
  }

  /**
   * Draw a single particle based on its shape
   */
  drawParticleShape(ctx, particle, x, y) {
    const size = particle.size;

    switch (particle.shape) {
      case 'star':
        this.drawStar(ctx, x, y, 5, size, size * 0.4);
        break;
      case 'diamond':
        this.drawDiamond(ctx, x, y, size);
        break;
      case 'circle':
      default:
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        break;
    }
  }

  /**
   * Draw a star shape
   */
  drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Draw a diamond shape
   */
  drawDiamond(ctx, x, y, size) {
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x + size * 0.6, y);
    ctx.lineTo(x, y + size);
    ctx.lineTo(x - size * 0.6, y);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Draw particles and connections with enhanced visuals
   */
  drawParticles() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Draw trail effects first
    if (this.config.trailEffect) {
      this.particles.forEach(particle => {
        if (particle.trail.length > 1) {
          this.ctx.beginPath();
          this.ctx.moveTo(particle.trail[0].x, particle.trail[0].y);

          for (let i = 1; i < particle.trail.length; i++) {
            this.ctx.lineTo(particle.trail[i].x, particle.trail[i].y);
          }

          const color = particle.color;
          this.ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.2)`;
          this.ctx.lineWidth = particle.size * 0.5;
          this.ctx.stroke();
        }
      });
    }

    // Draw connection lines with gradient
    this.particles.forEach((particle, i) => {
      for (let j = i + 1; j < this.particles.length; j++) {
        const other = this.particles[j];
        const dx = particle.x - other.x;
        const dy = particle.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.config.connectionDistance) {
          const opacity = (1 - distance / this.config.connectionDistance) * 0.25;

          // Create gradient for connection
          const gradient = this.ctx.createLinearGradient(
            particle.x, particle.y, other.x, other.y
          );
          const color1 = particle.color;
          const color2 = other.color;

          gradient.addColorStop(0, `rgba(${color1.r}, ${color1.g}, ${color1.b}, ${opacity})`);
          gradient.addColorStop(1, `rgba(${color2.r}, ${color2.g}, ${color2.b}, ${opacity})`);

          this.ctx.strokeStyle = gradient;
          this.ctx.lineWidth = 0.5;
          this.ctx.beginPath();
          this.ctx.moveTo(particle.x, particle.y);
          this.ctx.lineTo(other.x, other.y);
          this.ctx.stroke();
        }
      }
    });

    // Draw particles with glow
    this.particles.forEach(particle => {
      const color = particle.color;
      const opacity = particle.currentOpacity || particle.opacity;

      // Outer glow
      this.ctx.shadowBlur = this.config.glowIntensity;
      this.ctx.shadowColor = `rgba(${color.r}, ${color.g}, ${color.b}, 0.5)`;

      // Particle fill
      this.ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity})`;
      this.drawParticleShape(this.ctx, particle, particle.x, particle.y);

      // Reset shadow
      this.ctx.shadowBlur = 0;
    });
  }

  /**
   * Main animation loop with delta time
   */
  animate(currentTime) {
    if (!this.isRunning) return;

    // Frame skipping for performance (target 60fps)
    if (currentTime - this.lastTime < 16) {
      this.animationFrame = requestAnimationFrame(this.animate);
      return;
    }

    this.lastTime = currentTime;
    this.frameCount++;

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
    this.lastTime = 0;
    this.animate(0);
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
   * Initialize parallax scrolling effects with smoother easing
   */
  initParallax() {
    const title = this.containerElement.querySelector('h1, .hero-title');
    const subtitle = this.containerElement.querySelector('p, .hero-subtitle');
    const stats = this.containerElement.querySelectorAll('.stat-card, .stats > *');

    if (title) {
      title.style.willChange = 'transform';
      title.dataset.parallaxSpeed = '0.25';
      title.style.transition = 'transform 0.1s linear';
    }

    if (subtitle) {
      subtitle.style.willChange = 'transform';
      subtitle.dataset.parallaxSpeed = '0.4';
      subtitle.style.transition = 'transform 0.1s linear';
    }

    stats.forEach((stat, i) => {
      stat.style.willChange = 'transform';
      stat.dataset.parallaxSpeed = String(0.6 + i * 0.08);
      stat.style.transition = 'transform 0.1s linear';
    });

    // Initial parallax update
    this.updateParallax();
  }

  /**
   * Update parallax positions on scroll
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
   * Initialize animated gradient borders with enhanced animation
   */
  initGradientBorders() {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes gradient-rotate {
        0% { --gradient-angle: 0deg; }
        100% { --gradient-angle: 360deg; }
      }

      @keyframes border-shimmer {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }

      .gradient-border {
        position: relative;
        border: 2px solid transparent;
        background: linear-gradient(var(--bg-color, #000), var(--bg-color, #000)) padding-box,
                    linear-gradient(var(--gradient-angle, 0deg),
                      ${this.config.accentColor},
                      ${this.config.secondaryColor},
                      ${this.config.accentColor}) border-box;
        background-size: 200% 200%;
        animation: gradient-rotate 4s linear infinite;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
      }

      .gradient-border:hover {
        transform: translateY(-4px);
        box-shadow: 0 20px 40px rgba(220, 38, 38, 0.15);
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
   * Initialize typewriter effect with enhanced cursor
   */
  initTypewriter() {
    const tagline = document.querySelector('[data-typewriter]');

    if (!tagline) return;

    const text = tagline.textContent;
    const speed = parseInt(tagline.dataset.typewriterSpeed) || 60;
    const cursorChar = tagline.dataset.typewriterCursor || '|';
    const delay = parseInt(tagline.dataset.typewriterDelay) || 500;

    tagline.textContent = '';
    tagline.style.position = 'relative';

    // Create cursor with enhanced animation
    const cursor = document.createElement('span');
    cursor.textContent = cursorChar;
    cursor.className = 'typewriter-cursor';

    // Add cursor styles
    if (!document.querySelector('#typewriter-styles')) {
      const style = document.createElement('style');
      style.id = 'typewriter-styles';
      style.textContent = `
        @keyframes blink {
          0%, 45% { opacity: 1; }
          50%, 95% { opacity: 0; }
          100% { opacity: 1; }
        }
        .typewriter-cursor {
          display: inline-block;
          margin-left: 2px;
          animation: blink 1.1s step-end infinite;
          color: var(--accent-color, #dc2626);
        }
      `;
      document.head.appendChild(style);
    }

    // Type characters with delay
    setTimeout(() => {
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

      this.typewriterInterval = typeInterval;
    }, delay);
  }

  /**
   * Initialize morphing SVG decorations with enhanced animations
   */
  initMorphingShapes() {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes morph-shape-1 {
        0%, 100% {
          d: path('M 0,100 C 30,120 70,80 100,100 C 130,120 170,80 200,100 L 200,200 L 0,200 Z');
        }
        50% {
          d: path('M 0,100 C 30,80 70,120 100,100 C 130,80 170,120 200,100 L 200,200 L 0,200 Z');
        }
      }

      @keyframes morph-shape-2 {
        0%, 100% {
          transform: scale(1) rotate(0deg);
          opacity: 0.08;
        }
        33% {
          transform: scale(1.15) rotate(120deg);
          opacity: 0.15;
        }
        66% {
          transform: scale(0.95) rotate(240deg);
          opacity: 0.1;
        }
      }

      @keyframes float-gentle {
        0%, 100% {
          transform: translateY(0) rotate(0deg);
        }
        25% {
          transform: translateY(-10px) rotate(2deg);
        }
        50% {
          transform: translateY(-5px) rotate(0deg);
        }
        75% {
          transform: translateY(-15px) rotate(-2deg);
        }
      }

      .morph-shape {
        position: absolute;
        pointer-events: none;
        z-index: 0;
        animation: float-gentle 8s ease-in-out infinite;
      }

      .morph-shape path {
        animation: morph-shape-1 10s ease-in-out infinite;
      }

      .morph-shape svg {
        animation: morph-shape-2 15s ease-in-out infinite;
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Initialize glow pulse effect with enhanced layers
   */
  initGlowPulse() {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes glow-pulse {
        0%, 100% {
          box-shadow:
            0 0 5px ${this.config.accentColor}40,
            0 0 10px ${this.config.accentColor}30,
            0 0 20px ${this.config.accentColor}20,
            0 0 40px ${this.config.accentColor}10;
        }
        50% {
          box-shadow:
            0 0 10px ${this.config.accentColor}60,
            0 0 20px ${this.config.accentColor}40,
            0 0 40px ${this.config.accentColor}30,
            0 0 80px ${this.config.accentColor}15;
        }
      }

      @keyframes glow-breathe {
        0%, 100% { opacity: 0.4; transform: scale(1); }
        50% { opacity: 0.7; transform: scale(1.02); }
      }

      .glow-pulse {
        animation: glow-pulse 3s ease-in-out infinite;
      }

      .glow-breathe {
        animation: glow-breathe 4s ease-in-out infinite;
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Initialize mouse trail effect
   */
  initMouseTrail() {
    if (this.prefersReducedMotion) return;

    const trail = [];
    const maxTrailLength = 8;

    const updateTrail = (e) => {
      trail.push({ x: e.clientX, y: e.clientY, time: Date.now() });

      if (trail.length > maxTrailLength) {
        trail.shift();
      }
    };

    // Throttled trail update
    let lastTrailUpdate = 0;
    document.addEventListener('mousemove', (e) => {
      const now = Date.now();
      if (now - lastTrailUpdate > 30) { // ~33fps for trail
        updateTrail(e);
        lastTrailUpdate = now;
      }
    }, { passive: true });

    // Add subtle glow to cursor on interactive elements
    const style = document.createElement('style');
    style.textContent = `
      a, button, .interactive {
        cursor: pointer;
      }

      a:hover, button:hover, .interactive:hover {
        cursor: pointer;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Handle window resize with debounce
   */
  handleResize() {
    if (this.resizeTimeout) clearTimeout(this.resizeTimeout);

    this.resizeTimeout = setTimeout(() => {
      this.resizeCanvas();
    }, 200);
  }

  /**
   * Handle mouse move with velocity tracking
   */
  handleMouseMove(event) {
    if (!this.canvas) return;

    const rect = this.containerElement.getBoundingClientRect();
    const newX = event.clientX - rect.left;
    const newY = event.clientY - rect.top;

    // Track velocity for smoother interaction
    if (this.mouse.x !== null) {
      this.mouse.vx = newX - this.mouse.x;
      this.mouse.vy = newY - this.mouse.y;
    }

    this.mouse.x = newX;
    this.mouse.y = newY;
  }

  /**
   * Handle scroll with RAF throttling
   */
  handleScroll() {
    if (this.scrollRAF) return;

    this.scrollRAF = requestAnimationFrame(() => {
      this.updateParallax();
      this.scrollRAF = null;
    });
  }

  /**
   * Disable all animations
   */
  disableAnimations() {
    const elements = this.containerElement.querySelectorAll('[style*="animation"], [style*="transition"]');
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

    if (this.scrollRAF) {
      cancelAnimationFrame(this.scrollRAF);
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
    } : { r: 220, g: 38, b: 38 };
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
  if (options.delay) element.dataset.typewriterDelay = options.delay;
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
        secondaryColor: autoInit.dataset.particleSecondaryColor || '#ef4444',
        maxParticles: parseInt(autoInit.dataset.particleCount) || 80,
        particleShape: autoInit.dataset.particleShape || 'circle',
      };
      new ParticleSystem(options);
    }
  });
}

export default ParticleSystem;
