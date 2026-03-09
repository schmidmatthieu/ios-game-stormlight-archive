import { Container, Graphics } from 'pixi.js';
import type { ChampionClass } from '../data/types';

export interface SpellParticle {
  sprite: Graphics;
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  size: number;
}

export const SKILL_COLORS: Record<string, { color1: number; color2: number; particleColor: number }> = {
  mistborn:         { color1: 0x4488ff, color2: 0x6699cc, particleColor: 0x88aacc },
  radiant:          { color1: 0x44aaff, color2: 0x88ccff, particleColor: 0xaaddff },
  awakener:         { color1: 0xaa44ff, color2: 0xcc88ff, particleColor: 0xdd99ff },
  elantrian:        { color1: 0xffaa33, color2: 0xffcc66, particleColor: 0xffdd88 },
  sandMaster:       { color1: 0xddaa33, color2: 0xeecc66, particleColor: 0xddcc88 },
  nightmarePainter: { color1: 0x6633aa, color2: 0x8855cc, particleColor: 0xaa77ee },
};

export const ATTACK_COLORS: Record<string, number> = {
  mistborn: 0xaabbcc, radiant: 0x88ccff, awakener: 0xcc88ff,
  elantrian: 0xffcc44, sandMaster: 0xddcc88, nightmarePainter: 0x8866cc,
};

// ─── Graphics Pool for Ambient Particles ────────────────────────

const POOL_INITIAL_SIZE = 30;
const particlePool: Graphics[] = [];

function acquireGraphics(): Graphics {
  if (particlePool.length > 0) {
    const g = particlePool.pop()!;
    g.visible = true;
    g.alpha = 1;
    return g;
  }
  return new Graphics();
}

function releaseGraphics(g: Graphics): void {
  g.removeFromParent();
  g.clear();
  g.visible = false;
  particlePool.push(g);
}

// Pre-fill pool
for (let i = 0; i < POOL_INITIAL_SIZE; i++) {
  const g = new Graphics();
  g.visible = false;
  particlePool.push(g);
}

/**
 * Creates lingering magic ambient particles around the player
 * based on their class. Called periodically for passive visual flavor.
 * Uses an object pool to avoid per-frame allocations.
 */
export function spawnClassAmbientParticle(
  worldContainer: Container,
  px: number, py: number,
  cls: ChampionClass,
  particles: SpellParticle[],
): void {
  const cfg = SKILL_COLORS[cls] ?? SKILL_COLORS.mistborn;

  const p = acquireGraphics();
  let size = 1;
  let color = cfg.particleColor;
  let vx = 0;
  let vy = 0;
  let life = 1;

  switch (cls) {
    case 'mistborn':
      size = 0.8 + Math.random() * 0.8;
      color = Math.random() > 0.5 ? 0x88aacc : 0xaabbdd;
      vx = (Math.random() - 0.5) * 8;
      vy = -10 - Math.random() * 15;
      life = 1.5 + Math.random();
      break;
    case 'radiant':
      size = 1 + Math.random();
      color = Math.random() > 0.5 ? 0x88ccff : 0xaaddff;
      vx = (Math.random() - 0.5) * 12;
      vy = -15 - Math.random() * 10;
      life = 1 + Math.random() * 0.8;
      break;
    case 'awakener': {
      const colorPool = [0xff4466, 0x44aaff, 0xffaa22, 0x44ff66, 0xaa44ff];
      color = colorPool[Math.floor(Math.random() * colorPool.length)];
      size = 0.8 + Math.random();
      vx = (Math.random() - 0.5) * 20;
      vy = -5 - Math.random() * 10;
      life = 2 + Math.random();
      break;
    }
    case 'elantrian': {
      size = 0.6 + Math.random() * 0.6;
      color = Math.random() > 0.5 ? 0xffcc44 : 0xffdd88;
      const aonAngle = Math.random() * Math.PI * 2;
      const aonR = 8 + Math.random() * 12;
      vx = Math.cos(aonAngle) * 5;
      vy = Math.sin(aonAngle) * 5 - 8;
      life = 1.2 + Math.random();
      p.x = px + Math.cos(aonAngle) * aonR;
      p.y = py + Math.sin(aonAngle) * aonR;
      break;
    }
    case 'sandMaster': {
      size = 0.5 + Math.random() * 0.5;
      color = Math.random() > 0.5 ? 0xddcc88 : 0xccbb77;
      const sandAngle = Math.random() * Math.PI * 2;
      vx = Math.cos(sandAngle) * 15;
      vy = Math.sin(sandAngle) * 10 - 5;
      life = 0.8 + Math.random() * 0.5;
      break;
    }
    case 'nightmarePainter':
      size = 1 + Math.random() * 1.5;
      color = Math.random() > 0.6 ? 0x8855cc : 0x332244;
      vx = (Math.random() - 0.5) * 6;
      vy = -8 - Math.random() * 12;
      life = 1.5 + Math.random();
      break;
  }

  p.circle(0, 0, size).fill({ color, alpha: 0.5 });
  if (!p.x) p.x = px + (Math.random() - 0.5) * 16;
  if (!p.y) p.y = py - Math.random() * 10;
  p.zIndex = 99999;
  worldContainer.addChild(p);

  const particle: SpellParticle = {
    sprite: p,
    x: p.x, y: p.y,
    vx, vy,
    life, maxLife: life,
    size,
  };
  // Tag for correct pool release when mixed with weather particles
  (particle as any)._classAmbient = true;
  particles.push(particle);
}

/**
 * Release a spell particle back to the pool instead of destroying it.
 * Call this when removing dead particles from the particles array.
 */
export function releaseSpellParticle(particle: SpellParticle): void {
  releaseGraphics(particle.sprite);
}
