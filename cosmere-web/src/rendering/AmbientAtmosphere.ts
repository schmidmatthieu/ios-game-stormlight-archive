// ─── World Ambient Atmosphere ───────────────────────────────────
// Persistent atmospheric effects unique to each world that run
// independently of weather. Adds visual depth and identity.

import { Container, Graphics } from 'pixi.js';

// ─── Ambient Mote ───────────────────────────────────────────────

interface AmbientMote {
  g: Graphics;
  x: number; y: number;
  vx: number; vy: number;
  baseAlpha: number;
  phase: number;       // For sine-wave bobbing
  phaseSpeed: number;
  life: number;
  maxLife: number;
}

// ─── Per-World Atmosphere Config ────────────────────────────────

interface AtmosphereConfig {
  /** Number of ambient motes */
  moteCount: number;
  /** Draw function for a single mote */
  drawMote: (g: Graphics, size: number) => void;
  /** Size range [min, max] */
  sizeRange: [number, number];
  /** Alpha range [min, max] */
  alphaRange: [number, number];
  /** Velocity range */
  vxRange: [number, number];
  vyRange: [number, number];
  /** Life in seconds */
  lifeRange: [number, number];
  /** Draw foreground atmospheric layer */
  drawFogLayer?: (g: Graphics, w: number, h: number, time: number) => void;
}

function rng(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

const ATMOSPHERE_CONFIGS: Record<string, AtmosphereConfig> = {
  scadrial: {
    moteCount: 35,
    sizeRange: [1, 4],
    alphaRange: [0.08, 0.25],
    vxRange: [-5, 5],
    vyRange: [-2, 3],
    lifeRange: [4, 10],
    drawMote: (g, size) => {
      // Ash/mist wisp — multi-layer for depth
      g.ellipse(0, 0, size * 1.2, size * 0.5).fill({ color: 0x998877, alpha: 0.3 });
      g.ellipse(0, 0, size, size * 0.6).fill({ color: 0x888077, alpha: 1 });
      if (size > 2) {
        // Trailing ash wisp
        g.moveTo(0, 0).lineTo(-size * 0.8, size * 0.4)
          .stroke({ color: 0x777066, width: 0.5, alpha: 0.3 });
      }
    },
    drawFogLayer: (g, w, h, time) => {
      // Multi-layer low-lying mist bands
      const bands = 5;
      for (let i = 0; i < bands; i++) {
        const y = h * 0.5 + i * 30 + Math.sin(time * 0.3 + i * 2) * 15;
        const alpha = 0.025 + Math.sin(time * 0.5 + i) * 0.01;
        const xOff = Math.sin(time * 0.15 + i * 1.5) * 60;
        g.ellipse(w / 2 + xOff, y, w * 0.55, 25)
          .fill({ color: 0x998877, alpha });
        // Secondary wisp
        g.ellipse(w * 0.3 + xOff * 0.7, y + 10, w * 0.3, 15)
          .fill({ color: 0x887766, alpha: alpha * 0.6 });
      }
    },
  },

  roshar: {
    moteCount: 30,
    sizeRange: [0.8, 3],
    alphaRange: [0.12, 0.4],
    vxRange: [-3, 3],
    vyRange: [-18, -5],  // Stormlight rises
    lifeRange: [2, 6],
    drawMote: (g, size) => {
      // Stormlight wisps with glow halo
      g.circle(0, 0, size * 2).fill({ color: 0x88ccff, alpha: 0.06 });
      g.circle(0, 0, size * 1.3).fill({ color: 0x88ccff, alpha: 0.15 });
      g.circle(0, 0, size).fill({ color: 0xaaddff, alpha: 0.8 });
      g.circle(0, 0, size * 0.4).fill({ color: 0xeeffff, alpha: 0.6 });
    },
    drawFogLayer: (g, w, h, time) => {
      // Stormlight ground shimmer — more points
      for (let i = 0; i < 6; i++) {
        const x = w * (0.1 + i * 0.15) + Math.sin(time + i * 1.5) * 30;
        const y = h * 0.65 + Math.cos(time * 0.8 + i) * 12;
        g.ellipse(x, y, 30 + Math.sin(time * 1.2 + i) * 10, 7)
          .fill({ color: 0x88ccff, alpha: 0.025 + Math.sin(time * 2 + i) * 0.012 });
      }
      // Occasional stormlight column
      const colX = w * (0.3 + Math.sin(time * 0.1) * 0.2);
      const colAlpha = Math.max(0, Math.sin(time * 0.3) * 0.015);
      if (colAlpha > 0) {
        g.rect(colX - 3, h * 0.2, 6, h * 0.5).fill({ color: 0x88ccff, alpha: colAlpha });
      }
    },
  },

  taldain: {
    moteCount: 35,
    sizeRange: [0.5, 2],
    alphaRange: [0.12, 0.35],
    vxRange: [3, 15],   // Wind-blown sand
    vyRange: [-1, 2],
    lifeRange: [2, 5],
    drawMote: (g, size) => {
      // Sand grains with sparkle
      const isBright = Math.random() > 0.7;
      const color = isBright ? 0xeecc66 : (Math.random() > 0.5 ? 0xddcc88 : 0xccbb77);
      g.circle(0, 0, size).fill({ color, alpha: 1 });
      if (isBright && size > 1) {
        // Sun sparkle on white sand grain
        g.circle(0, 0, size * 1.5).fill({ color: 0xffeeaa, alpha: 0.15 });
      }
    },
    drawFogLayer: (g, w, h, time) => {
      // Heat haze shimmer lines — more prominent
      for (let i = 0; i < 5; i++) {
        const y = h * 0.3 + i * 25;
        const waviness = Math.sin(time * 2 + i * 1.8) * 20;
        g.moveTo(0, y + waviness)
          .lineTo(w * 0.25, y + Math.sin(time * 2.5 + 1) * 15)
          .lineTo(w * 0.5, y + Math.sin(time * 1.8 + 2) * 18)
          .lineTo(w * 0.75, y + Math.sin(time * 2.2 + 3) * 12)
          .lineTo(w, y + Math.sin(time * 1.5 + 4) * 16)
          .stroke({ color: 0xddcc88, width: 1.5, alpha: 0.03 });
      }
      // Sun glare spot
      const sunX = w * 0.7 + Math.sin(time * 0.1) * 20;
      g.circle(sunX, h * 0.15, 40).fill({ color: 0xffeecc, alpha: 0.02 });
      g.circle(sunX, h * 0.15, 20).fill({ color: 0xffeedd, alpha: 0.015 });
    },
  },

  nalthis: {
    moteCount: 30,
    sizeRange: [1, 3.5],
    alphaRange: [0.1, 0.35],
    vxRange: [-4, 4],
    vyRange: [-3, -0.5],  // Gently rising
    lifeRange: [4, 9],
    drawMote: (g, size) => {
      // Firefly / BioChromatic motes with glow
      const colors = [0xff4466, 0x44aaff, 0x44ff66, 0xffaa22, 0xaa44ff, 0xff88cc];
      const c = colors[Math.floor(Math.random() * colors.length)];
      // Outer glow
      g.circle(0, 0, size * 2).fill({ color: c, alpha: 0.06 });
      g.circle(0, 0, size * 1.3).fill({ color: c, alpha: 0.12 });
      // Core
      g.circle(0, 0, size).fill({ color: c, alpha: 0.6 });
      g.circle(0, 0, size * 0.4).fill({ color: 0xffffff, alpha: 0.3 });
    },
    drawFogLayer: (g, w, h, time) => {
      // Firefly trails — sinusoidal paths
      for (let i = 0; i < 5; i++) {
        const colors = [0xff4466, 0x44aaff, 0x44ff66, 0xffaa22, 0xaa44ff];
        const c = colors[i % colors.length];
        const baseX = w * (0.1 + i * 0.2);
        const baseY = h * (0.3 + Math.sin(i * 1.7) * 0.2);
        // Sinusoidal trail
        for (let s = 0; s < 6; s++) {
          const t = s / 6;
          const fx = baseX + Math.sin(time * 0.8 + i * 2 + t * 4) * 20;
          const fy = baseY + Math.cos(time * 0.6 + i * 1.5 + t * 3) * 15 - t * 10;
          const a = 0.015 * (1 - t);
          g.circle(fx, fy, 2 + (1 - t) * 2).fill({ color: c, alpha: a });
        }
      }
    },
  },

  komashi: {
    moteCount: 28,
    sizeRange: [1, 5],
    alphaRange: [0.08, 0.25],
    vxRange: [-2, 2],
    vyRange: [-8, -2],  // Rising ink droplets
    lifeRange: [3, 7],
    drawMote: (g, size) => {
      // Organic ink blobs with irregular shapes
      const choice = Math.random();
      if (choice > 0.6) {
        // Amorphous blob
        g.ellipse(0, 0, size * 0.8, size * 1.2).fill({ color: 0x1a1a33, alpha: 1 });
        g.ellipse(size * 0.2, -size * 0.3, size * 0.4, size * 0.6).fill({ color: 0x222244, alpha: 0.7 });
      } else if (choice > 0.3) {
        // Ink droplet with tail
        g.ellipse(0, 0, size * 0.7, size).fill({ color: 0x222244, alpha: 1 });
        g.moveTo(0, size).quadraticCurveTo(size * 0.3, size + 4, 0, size + 6)
          .stroke({ color: 0x111133, width: 0.8, alpha: 0.5 });
      } else {
        // Nightmare wisp — spiky edges
        g.moveTo(0, -size).lineTo(size * 0.6, 0).lineTo(0, size).lineTo(-size * 0.5, size * 0.3).lineTo(0, -size)
          .fill({ color: 0x221133, alpha: 0.8 });
      }
    },
    drawFogLayer: (g, w, h, time) => {
      // Nightmare tendrils reaching from below — more organic
      for (let i = 0; i < 6; i++) {
        const x = w * (0.05 + i * 0.18);
        const baseY = h * 0.85;
        const reach = 40 + Math.sin(time * 0.8 + i * 2) * 20;
        // Multi-segment tendril
        let cx = x, cy = baseY;
        for (let s = 0; s < 4; s++) {
          const nx = cx + Math.sin(time * 0.5 + i + s * 1.5) * 8;
          const ny = cy - reach * 0.25;
          g.moveTo(cx, cy).lineTo(nx, ny)
            .stroke({ color: 0x221133, width: 2 - s * 0.4, alpha: 0.04 - s * 0.008 });
          cx = nx; cy = ny;
        }
      }
      // Floating ink stains
      for (let i = 0; i < 3; i++) {
        const ix = w * (0.2 + i * 0.3) + Math.sin(time * 0.4 + i * 3) * 20;
        const iy = h * 0.4 + Math.cos(time * 0.3 + i * 2) * 15;
        g.ellipse(ix, iy, 12 + Math.sin(time * 0.6 + i) * 4, 6)
          .fill({ color: 0x111122, alpha: 0.02 });
      }
    },
  },

  sel: {
    moteCount: 24,
    sizeRange: [0.8, 2.5],
    alphaRange: [0.1, 0.35],
    vxRange: [-3, 3],
    vyRange: [-2, 2],
    lifeRange: [3, 7],
    drawMote: (g, size) => {
      // Glowing Dor particles with rune-like quality
      g.circle(0, 0, size * 2).fill({ color: 0xffdd66, alpha: 0.05 });
      g.circle(0, 0, size * 1.4).fill({ color: 0xffcc44, alpha: 0.12 });
      g.circle(0, 0, size).fill({ color: 0xffcc44, alpha: 0.5 });
      // Tiny cross inside larger motes
      if (size > 1.5) {
        g.moveTo(-size * 0.4, 0).lineTo(size * 0.4, 0)
          .stroke({ color: 0xffee88, width: 0.5, alpha: 0.3 });
        g.moveTo(0, -size * 0.4).lineTo(0, size * 0.4)
          .stroke({ color: 0xffee88, width: 0.5, alpha: 0.3 });
      }
    },
    drawFogLayer: (g, w, h, time) => {
      // Aon traces in the air — more complex patterns
      for (let i = 0; i < 3; i++) {
        const cx = w * (0.2 + i * 0.3);
        const cy = h * 0.4 + Math.sin(time * 0.3 + i) * 10;
        const r = 20 + Math.sin(time * 0.5 + i * 3) * 5;
        const alpha = 0.02 + Math.sin(time + i * 2) * 0.01;
        g.circle(cx, cy, r).stroke({ color: 0xffcc44, width: 0.5, alpha });
        // Aon-like line through circle
        const lineAngle = time * 0.2 + i;
        g.moveTo(cx + Math.cos(lineAngle) * r * 0.6, cy + Math.sin(lineAngle) * r * 0.6)
          .lineTo(cx - Math.cos(lineAngle) * r * 0.6, cy - Math.sin(lineAngle) * r * 0.6)
          .stroke({ color: 0xffdd66, width: 0.3, alpha: alpha * 0.7 });
      }
      // Dor energy wisps
      for (let i = 0; i < 2; i++) {
        const wx = w * (0.4 + i * 0.2) + Math.sin(time * 0.4 + i * 4) * 30;
        const wy = h * 0.6 + Math.cos(time * 0.3 + i * 3) * 15;
        g.ellipse(wx, wy, 15, 5).fill({ color: 0xffcc44, alpha: 0.012 });
      }
    },
  },

  shadesmar: {
    moteCount: 35,
    sizeRange: [1, 3.5],
    alphaRange: [0.08, 0.35],
    vxRange: [-6, 6],
    vyRange: [-6, 6],   // Chaotic drift
    lifeRange: [2, 6],
    drawMote: (g, size) => {
      // Cognitive beads / reality fragments — more variety
      const choice = Math.random();
      if (choice > 0.6) {
        // Glowing bead
        g.circle(0, 0, size * 1.8).fill({ color: 0xaa88ff, alpha: 0.05 });
        g.circle(0, 0, size * 0.7).fill({ color: 0x8866cc, alpha: 0.5 });
        g.circle(0, 0, size * 0.3).fill({ color: 0xccbbff, alpha: 0.4 });
        // Pulsating ring
        g.circle(0, 0, size * 1.2).stroke({ color: 0xaa88ff, width: 0.3, alpha: 0.15 });
      } else if (choice > 0.3) {
        // Shard/crystal fragment
        const hs = size * 0.5;
        g.poly([
          { x: 0, y: -size }, { x: hs, y: 0 },
          { x: 0, y: size * 0.8 }, { x: -hs, y: 0 },
        ]).fill({ color: 0xaa88ff, alpha: 0.5 });
        g.poly([
          { x: 0, y: -size }, { x: hs, y: 0 }, { x: 0, y: 0 },
        ]).fill({ color: 0xccaaff, alpha: 0.2 });
      } else {
        // Mini cube
        g.rect(-size * 0.5, -size * 0.5, size, size).fill({ color: 0x7755aa, alpha: 0.5 });
        g.rect(-size * 0.5, -size * 0.5, size * 0.5, size * 0.5).fill({ color: 0x9977cc, alpha: 0.2 });
      }
    },
    drawFogLayer: (g, w, h, time) => {
      // Reality distortion ripples — layered
      for (let i = 0; i < 4; i++) {
        const cx = w * (0.15 + i * 0.2) + Math.sin(time * 0.3 + i * 2) * 15;
        const cy = h * 0.5 + Math.sin(time * 0.6 + i * 2.5) * 30;
        // Nested rings
        for (let r = 0; r < 3; r++) {
          const radius = 20 + r * 12 + Math.sin(time * 0.4 + i + r) * 8;
          g.circle(cx, cy, radius).stroke({ color: 0x6644aa, width: 0.5, alpha: 0.025 - r * 0.006 });
        }
      }
      // Bead clusters floating
      for (let i = 0; i < 3; i++) {
        const bx = w * (0.25 + i * 0.25) + Math.cos(time * 0.2 + i) * 20;
        const by = h * 0.3 + Math.sin(time * 0.3 + i * 2) * 20;
        for (let b = 0; b < 4; b++) {
          const ox = Math.sin(b * 1.7 + time * 0.5) * 8;
          const oy = Math.cos(b * 2.1 + time * 0.4) * 5;
          g.circle(bx + ox, by + oy, 1.5).fill({ color: 0x8866cc, alpha: 0.02 });
        }
      }
    },
  },
};

// ─── Atmosphere Manager ─────────────────────────────────────────

export class AmbientAtmosphereManager {
  private motes: AmbientMote[] = [];
  private motePool: Graphics[] = [];
  private fogLayer: Graphics;
  private moteContainer: Container;
  private config: AtmosphereConfig;
  private timer = 0;
  private lastFogRedraw = -1;
  private viewW: number;
  private viewH: number;

  constructor(
    parentContainer: Container,
    worldID: string,
    viewW: number, viewH: number,
  ) {
    this.viewW = viewW;
    this.viewH = viewH;
    this.config = ATMOSPHERE_CONFIGS[worldID] ?? ATMOSPHERE_CONFIGS.scadrial;

    // Fog layer (background atmospheric effects)
    this.fogLayer = new Graphics();
    this.fogLayer.zIndex = -100;
    parentContainer.addChild(this.fogLayer);

    // Mote container
    this.moteContainer = new Container();
    this.moteContainer.zIndex = 99000;
    parentContainer.addChild(this.moteContainer);

    // Pre-spawn motes with random ages
    for (let i = 0; i < this.config.moteCount; i++) {
      this.spawnMote(true);
    }
  }

  private acquireMoteGraphics(size: number): Graphics {
    let g: Graphics;
    if (this.motePool.length > 0) {
      g = this.motePool.pop()!;
      g.clear();
      g.visible = true;
    } else {
      g = new Graphics();
    }
    this.config.drawMote(g, size);
    return g;
  }

  private releaseMoteGraphics(g: Graphics): void {
    this.moteContainer.removeChild(g);
    g.visible = false;
    this.motePool.push(g);
  }

  private spawnMote(randomAge = false): void {
    const cfg = this.config;
    const size = rng(cfg.sizeRange[0], cfg.sizeRange[1]);
    const g = this.acquireMoteGraphics(size);

    const x = (Math.random() - 0.5) * this.viewW * 2;
    const y = (Math.random() - 0.5) * this.viewH * 2;
    g.x = x;
    g.y = y;
    this.moteContainer.addChild(g);

    const maxLife = rng(cfg.lifeRange[0], cfg.lifeRange[1]);
    const mote: AmbientMote = {
      g, x, y,
      vx: rng(cfg.vxRange[0], cfg.vxRange[1]),
      vy: rng(cfg.vyRange[0], cfg.vyRange[1]),
      baseAlpha: rng(cfg.alphaRange[0], cfg.alphaRange[1]),
      phase: Math.random() * Math.PI * 2,
      phaseSpeed: 1 + Math.random() * 2,
      life: randomAge ? Math.random() * maxLife : 0,
      maxLife,
    };
    this.motes.push(mote);
  }

  update(dt: number, cameraX: number, cameraY: number): void {
    this.timer += dt;

    // Update mote container position to follow camera
    this.moteContainer.x = cameraX;
    this.moteContainer.y = cameraY;

    // Update fog layer — throttle redraws to ~20fps (every 0.05s)
    if (this.config.drawFogLayer) {
      const fogInterval = 0.05;
      if (this.timer - this.lastFogRedraw >= fogInterval) {
        this.lastFogRedraw = this.timer;
        this.fogLayer.clear();
        this.fogLayer.x = cameraX;
        this.fogLayer.y = cameraY;
        this.config.drawFogLayer(this.fogLayer, this.viewW, this.viewH, this.timer);
      } else {
        // Just update position between redraws
        this.fogLayer.x = cameraX;
        this.fogLayer.y = cameraY;
      }
    }

    // Update motes — swap-and-pop for O(1) removal
    let i = this.motes.length;
    while (i-- > 0) {
      const m = this.motes[i];
      m.life += dt;
      m.x += m.vx * dt;
      m.y += m.vy * dt;

      // Sine-wave bobbing
      const bob = Math.sin(m.phase + this.timer * m.phaseSpeed) * 0.5;
      m.g.x = m.x;
      m.g.y = m.y + bob;

      // Fade in/out
      const lifeRatio = m.life / m.maxLife;
      const fadeIn = Math.min(1, lifeRatio * 5);
      const fadeOut = Math.max(0, 1 - (lifeRatio - 0.7) / 0.3);
      m.g.alpha = m.baseAlpha * fadeIn * fadeOut;

      // Remove dead motes — pool + swap-and-pop
      if (m.life >= m.maxLife) {
        this.releaseMoteGraphics(m.g);
        this.motes[i] = this.motes[this.motes.length - 1];
        this.motes.pop();
        this.spawnMote(false);
      }
    }
  }

  destroy(): void {
    for (const m of this.motes) {
      m.g.destroy();
    }
    for (const g of this.motePool) {
      g.destroy();
    }
    this.motes = [];
    this.motePool = [];
    this.fogLayer.destroy();
    this.moteContainer.destroy();
  }
}
