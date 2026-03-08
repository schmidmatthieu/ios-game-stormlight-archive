import { Container, Graphics } from 'pixi.js';
import type { ChampionClass } from '../data/types';
import { SKILL_COLORS } from './SpellParticles';
import type { SpellParticle } from './SpellParticles';

export function createSkillEffect(
  worldContainer: Container,
  px: number, py: number,
  range: number,
  cls: ChampionClass,
  particles: SpellParticle[],
): void {
  const cfg = SKILL_COLORS[cls] ?? SKILL_COLORS.mistborn;

  // Main AOE ring
  const g = new Graphics();
  g.circle(0, 0, range).fill({ color: cfg.color1, alpha: 0.12 });
  g.circle(0, 0, range).stroke({ color: cfg.color2, width: 2.5, alpha: 0.6 });
  g.circle(0, 0, range * 0.7).stroke({ color: cfg.color1, width: 1.5, alpha: 0.3 });
  g.x = px; g.y = py; g.zIndex = 100000;
  worldContainer.addChild(g);

  // Inner burst
  const burst = new Graphics();
  drawClassBurst(burst, cls, range, cfg);
  burst.x = px; burst.y = py; burst.zIndex = 100001;
  worldContainer.addChild(burst);

  // Particle burst
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2 + Math.random() * 0.3;
    const speed = 40 + Math.random() * 30;
    const p = new Graphics();
    p.circle(0, 0, 1.5 + Math.random()).fill({ color: cfg.particleColor, alpha: 0.6 });
    p.x = px; p.y = py; p.zIndex = 100002;
    worldContainer.addChild(p);
    particles.push({
      sprite: p, x: px, y: py,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 10,
      life: 0.5 + Math.random() * 0.3, maxLife: 0.8, size: 2,
    });
  }

  let elapsed = 0;
  let lastTime = performance.now();
  const anim = () => {
    if (g.destroyed) return; // Scene changed — stop silently
    const now = performance.now();
    const frameDt = (now - lastTime) / 1000;
    lastTime = now;
    elapsed += frameDt;
    const progress = elapsed / 0.5;
    g.alpha = Math.max(0, 1 - progress);
    g.scale.set(0.3 + progress * 0.8);
    burst.alpha = Math.max(0, 1 - progress * 1.2);
    burst.scale.set(0.5 + progress * 0.6);
    burst.rotation = elapsed * 2;
    if (elapsed < 0.5) requestAnimationFrame(anim);
    else { g.destroy(); burst.destroy(); }
  };
  requestAnimationFrame(anim);
}

function drawClassBurst(burst: Graphics, cls: string, range: number, _cfg: { color1: number; color2: number }): void {
  switch (cls) {
    case 'mistborn': {
      // Metal push/pull lines radiating outward with varying thickness
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const len = range * (0.5 + Math.random() * 0.4);
        const width = 0.5 + Math.random() * 1.5;
        burst.moveTo(0, 0).lineTo(Math.cos(angle) * len, Math.sin(angle) * len)
          .stroke({ color: 0x4488ff, width, alpha: 0.3 + Math.random() * 0.2 });
        // Metal shard at tip
        const sz = 1 + Math.random() * 2;
        burst.poly([
          { x: Math.cos(angle) * len, y: Math.sin(angle) * len },
          { x: Math.cos(angle + 0.2) * (len + sz), y: Math.sin(angle + 0.2) * (len + sz) },
          { x: Math.cos(angle - 0.1) * (len + sz * 0.5), y: Math.sin(angle - 0.1) * (len + sz * 0.5) },
        ]).fill({ color: 0x88aacc, alpha: 0.5 });
      }
      // Central vortex
      burst.circle(0, 0, range * 0.15).fill({ color: 0x4488ff, alpha: 0.2 });
      break;
    }
    case 'radiant': {
      // Stormlight nova with layered glow
      burst.circle(0, 0, range * 0.6).fill({ color: 0x88ccff, alpha: 0.12 });
      burst.circle(0, 0, range * 0.4).fill({ color: 0xaaddff, alpha: 0.1 });
      burst.circle(0, 0, range * 0.2).fill({ color: 0xcceeFF, alpha: 0.15 });
      // Lightning-like tendrils
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 + Math.random() * 0.5;
        const segments = 3 + Math.floor(Math.random() * 2);
        let cx = 0, cy = 0;
        for (let s = 0; s < segments; s++) {
          const nextR = (range * 0.6 / segments) * (s + 1);
          const jitter = (Math.random() - 0.5) * 8;
          const nx = Math.cos(angle) * nextR + jitter;
          const ny = Math.sin(angle) * nextR + jitter * 0.5;
          burst.moveTo(cx, cy).lineTo(nx, ny)
            .stroke({ color: 0xcceeFF, width: 1.5 - s * 0.3, alpha: 0.4 });
          cx = nx; cy = ny;
        }
      }
      break;
    }
    case 'elantrian': {
      // Aon glyph pattern - concentric circles with radial lines
      burst.circle(0, 0, range * 0.6).stroke({ color: 0xffcc44, width: 1.5, alpha: 0.4 });
      burst.circle(0, 0, range * 0.35).stroke({ color: 0xffdd66, width: 1, alpha: 0.3 });
      // Cross + diagonals (Aon pattern)
      const r = range * 0.5;
      burst.moveTo(-r, 0).lineTo(r, 0).stroke({ color: 0xffcc44, width: 1, alpha: 0.3 });
      burst.moveTo(0, -r).lineTo(0, r).stroke({ color: 0xffcc44, width: 1, alpha: 0.3 });
      burst.moveTo(-r * 0.7, -r * 0.7).lineTo(r * 0.7, r * 0.7).stroke({ color: 0xffaa33, width: 0.8, alpha: 0.2 });
      burst.moveTo(r * 0.7, -r * 0.7).lineTo(-r * 0.7, r * 0.7).stroke({ color: 0xffaa33, width: 0.8, alpha: 0.2 });
      // Corner accents (Aon modifiers)
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        const cx = Math.cos(a) * r * 0.8;
        const cy = Math.sin(a) * r * 0.8;
        burst.circle(cx, cy, 3).stroke({ color: 0xffdd66, width: 1, alpha: 0.35 });
        burst.circle(cx, cy, 1).fill({ color: 0xffee88, alpha: 0.4 });
      }
      break;
    }
    case 'awakener': {
      // Rainbow color spiral rings
      const colors = [0xff4466, 0x44aaff, 0xffaa22, 0x44ff66, 0xaa44ff];
      for (let i = 0; i < colors.length; i++) {
        const r = range * (0.2 + i * 0.13);
        burst.circle(0, 0, r).stroke({ color: colors[i], width: 1.5, alpha: 0.25 });
      }
      // Color ribbons spiraling outward
      for (let i = 0; i < 5; i++) {
        const color = colors[i % colors.length];
        const startAngle = (i / 5) * Math.PI * 2;
        let cx = 0, cy = 0;
        for (let s = 0; s < 8; s++) {
          const a = startAngle + s * 0.4;
          const r = range * 0.1 * (s + 1);
          const nx = Math.cos(a) * r;
          const ny = Math.sin(a) * r;
          burst.moveTo(cx, cy).lineTo(nx, ny).stroke({ color, width: 1, alpha: 0.2 });
          cx = nx; cy = ny;
        }
      }
      break;
    }
    case 'sandMaster': {
      // Sand vortex spiral
      for (let i = 0; i < 30; i++) {
        const angle = (i / 30) * Math.PI * 6; // 3 full rotations
        const r = (i / 30) * range * 0.8;
        const sz = 0.8 + (i / 30) * 1.5;
        burst.circle(Math.cos(angle) * r, Math.sin(angle) * r, sz)
          .fill({ color: i % 3 === 0 ? 0xeecc77 : 0xddcc88, alpha: 0.35 });
      }
      // Central dust cloud
      burst.circle(0, 0, range * 0.2).fill({ color: 0xddcc88, alpha: 0.15 });
      burst.circle(3, -2, range * 0.12).fill({ color: 0xccbb77, alpha: 0.1 });
      break;
    }
    default: {
      // Nightmare Painter - ink splatter blobs
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + Math.random() * 0.5;
        const r = range * (0.2 + Math.random() * 0.4);
        const sx = 3 + Math.random() * 4;
        const sy = 2 + Math.random() * 5;
        burst.ellipse(Math.cos(angle) * r, Math.sin(angle) * r, sx, sy)
          .fill({ color: 0x222244, alpha: 0.3 });
      }
      // Dark tendrils reaching outward
      for (let i = 0; i < 5; i++) {
        const angle = Math.random() * Math.PI * 2;
        const len = range * 0.6 * Math.random();
        burst.moveTo(0, 0)
          .lineTo(Math.cos(angle) * len * 0.5, Math.sin(angle) * len * 0.5)
          .lineTo(Math.cos(angle + 0.3) * len, Math.sin(angle + 0.3) * len)
          .stroke({ color: 0x332255, width: 1.5, alpha: 0.25 });
      }
      break;
    }
  }
}

// ─── Lingering Ground Effect ────────────────────────────────────

/**
 * Creates a lingering ground mark where a skill was cast.
 * Fades slowly over a few seconds for visual atmosphere.
 */
export function createSkillGroundMark(
  worldContainer: Container,
  px: number, py: number,
  range: number,
  cls: ChampionClass,
): void {
  const cfg = SKILL_COLORS[cls] ?? SKILL_COLORS.mistborn;
  const g = new Graphics();
  g.x = px; g.y = py;
  g.zIndex = py - 100; // Under entities

  // Class-specific ground pattern
  switch (cls) {
    case 'mistborn':
      // Metal flake scatter
      for (let i = 0; i < 15; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = Math.random() * range * 0.7;
        g.circle(Math.cos(a) * r, Math.sin(a) * r, 0.5 + Math.random())
          .fill({ color: 0x6688aa, alpha: 0.2 });
      }
      break;
    case 'radiant':
      // Glowing cracks in ground
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const len = range * 0.4 * (0.5 + Math.random() * 0.5);
        g.moveTo(0, 0).lineTo(Math.cos(a) * len, Math.sin(a) * len * 0.5)
          .stroke({ color: 0x88ccff, width: 1, alpha: 0.15 });
      }
      break;
    case 'elantrian':
      // Fading Aon circle
      g.circle(0, 0, range * 0.4).stroke({ color: 0xffcc44, width: 0.8, alpha: 0.12 });
      break;
    case 'awakener':
      // Color stain
      g.circle(-3, 2, range * 0.25).fill({ color: 0xcc66ff, alpha: 0.06 });
      g.circle(4, -1, range * 0.2).fill({ color: 0xff6688, alpha: 0.05 });
      break;
    case 'sandMaster':
      // Disturbed sand
      g.ellipse(0, 0, range * 0.4, range * 0.2).fill({ color: 0xddcc88, alpha: 0.08 });
      break;
    default:
      // Ink stain
      g.ellipse(0, 1, range * 0.3, range * 0.15).fill({ color: 0x111122, alpha: 0.1 });
      break;
  }

  worldContainer.addChild(g);

  // Fade over 4 seconds (frame-rate independent)
  let life = 0;
  let lastT = performance.now();
  const animate = () => {
    if (g.destroyed) return;
    const now = performance.now();
    life += (now - lastT) / 1000;
    lastT = now;
    if (life > 2) {
      g.alpha = Math.max(0, 1 - (life - 2) / 2);
    }
    if (life < 4) {
      requestAnimationFrame(animate);
    } else {
      worldContainer.removeChild(g);
      g.destroy();
    }
  };
  requestAnimationFrame(animate);
}
