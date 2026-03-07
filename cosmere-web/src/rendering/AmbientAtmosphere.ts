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
    moteCount: 20,
    sizeRange: [1, 3],
    alphaRange: [0.1, 0.3],
    vxRange: [-5, 5],
    vyRange: [-2, 3],
    lifeRange: [4, 8],
    drawMote: (g, size) => {
      // Ash/mist wisp
      g.ellipse(0, 0, size, size * 0.6).fill({ color: 0x888077, alpha: 1 });
    },
    drawFogLayer: (g, w, h, time) => {
      // Low-lying mist bands
      const bands = 3;
      for (let i = 0; i < bands; i++) {
        const y = h * 0.6 + i * 40 + Math.sin(time * 0.3 + i * 2) * 15;
        const alpha = 0.03 + Math.sin(time * 0.5 + i) * 0.01;
        g.ellipse(w / 2 + Math.sin(time * 0.2 + i) * 50, y, w * 0.6, 20)
          .fill({ color: 0x998877, alpha });
      }
    },
  },

  roshar: {
    moteCount: 15,
    sizeRange: [1, 2.5],
    alphaRange: [0.15, 0.4],
    vxRange: [-3, 3],
    vyRange: [-15, -5],  // Stormlight rises
    lifeRange: [2, 5],
    drawMote: (g, size) => {
      // Stormlight wisps
      g.circle(0, 0, size).fill({ color: 0x88ccff, alpha: 0.8 });
      g.circle(0, 0, size * 0.5).fill({ color: 0xcceeFF, alpha: 0.5 });
    },
    drawFogLayer: (g, w, h, time) => {
      // Stormlight ground shimmer
      for (let i = 0; i < 4; i++) {
        const x = w * (0.2 + i * 0.2) + Math.sin(time + i * 1.5) * 30;
        const y = h * 0.7 + Math.cos(time * 0.8 + i) * 10;
        g.ellipse(x, y, 25 + Math.sin(time * 1.2 + i) * 8, 6)
          .fill({ color: 0x88ccff, alpha: 0.03 + Math.sin(time * 2 + i) * 0.015 });
      }
    },
  },

  taldain: {
    moteCount: 25,
    sizeRange: [0.5, 1.5],
    alphaRange: [0.15, 0.35],
    vxRange: [3, 12],   // Wind-blown sand
    vyRange: [-1, 2],
    lifeRange: [2, 4],
    drawMote: (g, size) => {
      // Sand grains
      g.circle(0, 0, size).fill({ color: rng(0, 1) > 0.5 ? 0xddcc88 : 0xccbb77, alpha: 1 });
    },
    drawFogLayer: (g, w, h, time) => {
      // Heat haze shimmer lines
      for (let i = 0; i < 3; i++) {
        const y = h * 0.4 + i * 30;
        const waviness = Math.sin(time * 2 + i * 1.8) * 20;
        g.moveTo(0, y + waviness)
          .lineTo(w * 0.3, y + Math.sin(time * 2.5 + 1) * 15)
          .lineTo(w * 0.6, y + Math.sin(time * 1.8 + 2) * 18)
          .lineTo(w, y + Math.sin(time * 2.2 + 3) * 12)
          .stroke({ color: 0xddcc88, width: 1, alpha: 0.04 });
      }
    },
  },

  nalthis: {
    moteCount: 12,
    sizeRange: [1, 3],
    alphaRange: [0.1, 0.3],
    vxRange: [-4, 4],
    vyRange: [-3, -1],  // Gently rising
    lifeRange: [4, 7],
    drawMote: (g, size) => {
      // Colored BioChromatic motes
      const colors = [0xff4466, 0x44aaff, 0x44ff66, 0xffaa22, 0xaa44ff, 0xff88cc];
      const c = colors[Math.floor(Math.random() * colors.length)];
      g.circle(0, 0, size).fill({ color: c, alpha: 0.6 });
    },
  },

  komashi: {
    moteCount: 18,
    sizeRange: [1, 4],
    alphaRange: [0.1, 0.25],
    vxRange: [-2, 2],
    vyRange: [-8, -2],  // Rising ink droplets
    lifeRange: [3, 6],
    drawMote: (g, size) => {
      // Ink droplets
      g.ellipse(0, 0, size * 0.7, size).fill({ color: 0x222244, alpha: 1 });
      if (size > 2) {
        // Drip trail
        g.moveTo(0, size).lineTo(0, size + 3)
          .stroke({ color: 0x111133, width: 0.5, alpha: 0.6 });
      }
    },
    drawFogLayer: (g, w, h, time) => {
      // Nightmare mist tendrils
      for (let i = 0; i < 4; i++) {
        const x = w * (0.1 + i * 0.25);
        const baseY = h * 0.8;
        const reach = 30 + Math.sin(time * 0.8 + i * 2) * 15;
        g.moveTo(x, baseY)
          .lineTo(x + Math.sin(time + i) * 10, baseY - reach)
          .stroke({ color: 0x332255, width: 2, alpha: 0.04 });
      }
    },
  },

  sel: {
    moteCount: 14,
    sizeRange: [0.8, 2],
    alphaRange: [0.1, 0.3],
    vxRange: [-3, 3],
    vyRange: [-2, 2],
    lifeRange: [3, 6],
    drawMote: (g, size) => {
      // Glowing Dor particles
      g.circle(0, 0, size).fill({ color: 0xffcc44, alpha: 0.5 });
      g.circle(0, 0, size * 1.5).fill({ color: 0xffdd66, alpha: 0.1 });
    },
    drawFogLayer: (g, w, h, time) => {
      // Subtle Aon traces in the air
      for (let i = 0; i < 2; i++) {
        const cx = w * (0.3 + i * 0.4);
        const cy = h * 0.4;
        const r = 20 + Math.sin(time * 0.5 + i * 3) * 5;
        const alpha = 0.02 + Math.sin(time + i * 2) * 0.01;
        g.circle(cx, cy, r).stroke({ color: 0xffcc44, width: 0.5, alpha });
      }
    },
  },

  shadesmar: {
    moteCount: 20,
    sizeRange: [1, 3],
    alphaRange: [0.1, 0.35],
    vxRange: [-6, 6],
    vyRange: [-6, 6],   // Chaotic drift
    lifeRange: [2, 5],
    drawMote: (g, size) => {
      // Cognitive beads / reality fragments
      if (Math.random() > 0.5) {
        g.rect(-size * 0.5, -size * 0.5, size, size).fill({ color: 0xaa88ff, alpha: 0.6 });
      } else {
        g.circle(0, 0, size * 0.6).fill({ color: 0x8866cc, alpha: 0.5 });
        g.circle(0, 0, size).fill({ color: 0xaa88ff, alpha: 0.1 });
      }
    },
    drawFogLayer: (g, w, h, time) => {
      // Reality distortion ripples
      for (let i = 0; i < 3; i++) {
        const cx = w * (0.25 + i * 0.25);
        const cy = h * 0.5 + Math.sin(time * 0.6 + i * 2.5) * 30;
        const r = 30 + Math.sin(time * 0.4 + i) * 10;
        g.circle(cx, cy, r).stroke({ color: 0x6644aa, width: 0.5, alpha: 0.03 });
      }
    },
  },
};

// ─── Atmosphere Manager ─────────────────────────────────────────

export class AmbientAtmosphereManager {
  private motes: AmbientMote[] = [];
  private fogLayer: Graphics;
  private moteContainer: Container;
  private config: AtmosphereConfig;
  private timer = 0;
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
    this.moteContainer.zIndex = 99000; // Above world, below UI
    parentContainer.addChild(this.moteContainer);

    // Pre-spawn motes with random ages
    for (let i = 0; i < this.config.moteCount; i++) {
      this.spawnMote(true);
    }
  }

  private spawnMote(randomAge = false): void {
    const cfg = this.config;
    const size = rng(cfg.sizeRange[0], cfg.sizeRange[1]);
    const g = new Graphics();
    cfg.drawMote(g, size);

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

    // Update fog layer
    if (this.config.drawFogLayer) {
      this.fogLayer.clear();
      this.fogLayer.x = cameraX;
      this.fogLayer.y = cameraY;
      this.config.drawFogLayer(this.fogLayer, this.viewW, this.viewH, this.timer);
    }

    // Update motes
    for (let i = this.motes.length - 1; i >= 0; i--) {
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
      const fadeIn = Math.min(1, lifeRatio * 5);   // Fade in first 20%
      const fadeOut = Math.max(0, 1 - (lifeRatio - 0.7) / 0.3); // Fade out last 30%
      m.g.alpha = m.baseAlpha * fadeIn * fadeOut;

      // Remove dead motes
      if (m.life >= m.maxLife) {
        this.moteContainer.removeChild(m.g);
        m.g.destroy();
        this.motes.splice(i, 1);
        // Respawn
        this.spawnMote(false);
      }
    }
  }

  destroy(): void {
    for (const m of this.motes) {
      m.g.destroy();
    }
    this.motes = [];
    this.fogLayer.destroy();
    this.moteContainer.destroy();
  }
}
