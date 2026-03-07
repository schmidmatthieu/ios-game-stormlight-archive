// ─── Enemy Animations & Status Effect Overlays ──────────────────
// Adds idle breathing, hit flash, status effect visuals, and boss auras

import { Graphics, Container } from 'pixi.js';
import { lighten } from '../utils/ColorUtils';

// ─── Types ──────────────────────────────────────────────────────

export type EnemyVisualState = 'idle' | 'alert' | 'attacking' | 'hurt' | 'dying';

export interface EnemyAnimState {
  timer: number;
  state: EnemyVisualState;
  stateTimer: number;
  hurtFlash: number;     // 0-1, fades after hit
  deathProgress: number; // 0-1 for death animation
  breathPhase: number;   // random offset so enemies don't breathe in sync
}

export interface StatusOverlay {
  type: string;
  timer: number;
  graphics: Graphics;
}

// ─── Factory ────────────────────────────────────────────────────

export function createEnemyAnimState(): EnemyAnimState {
  return {
    timer: 0,
    state: 'idle',
    stateTimer: 0,
    hurtFlash: 0,
    deathProgress: 0,
    breathPhase: Math.random() * Math.PI * 2,
  };
}

// ─── Idle Animation ─────────────────────────────────────────────

/** Apply idle breathing/swaying animation to enemy sprite */
export function updateEnemyIdle(sprite: Container, anim: EnemyAnimState, dt: number, tier: string): void {
  anim.timer += dt;
  anim.stateTimer += dt;

  // Breathing bob
  const breathSpeed = tier === 'boss' ? 1.2 : tier === 'elite' ? 1.5 : 2.0;
  const breathAmp = tier === 'boss' ? 1.5 : tier === 'elite' ? 1.2 : 0.8;
  const breathY = Math.sin((anim.timer + anim.breathPhase) * breathSpeed) * breathAmp;

  // Subtle sway
  const swaySpeed = tier === 'boss' ? 0.6 : 0.8;
  const swayAmp = tier === 'boss' ? 0.008 : 0.005;
  const sway = Math.sin((anim.timer + anim.breathPhase * 1.3) * swaySpeed) * swayAmp;

  // Squash/stretch for breathing
  const breathScale = 1 + Math.sin((anim.timer + anim.breathPhase) * breathSpeed) * 0.015;

  sprite.pivot.y = breathY;
  sprite.rotation = sway;
  sprite.scale.y = breathScale;
  sprite.scale.x = 2 - breathScale; // inverse squash

  // Hurt flash recovery
  if (anim.hurtFlash > 0) {
    anim.hurtFlash = Math.max(0, anim.hurtFlash - dt * 4);
    sprite.alpha = 0.5 + Math.sin(anim.hurtFlash * 20) * 0.3 + 0.2;
  } else {
    sprite.alpha = 1;
  }

  // Death animation
  if (anim.state === 'dying') {
    anim.deathProgress = Math.min(1, anim.deathProgress + dt * 2);
    sprite.alpha = 1 - anim.deathProgress * 0.7;
    sprite.scale.y = 1 - anim.deathProgress * 0.6;
    sprite.scale.x = 1 + anim.deathProgress * 0.3;
    sprite.rotation = anim.deathProgress * 0.3;
    sprite.pivot.y = -anim.deathProgress * 8;
  }
}

/** Trigger hurt flash on enemy */
export function triggerEnemyHurt(anim: EnemyAnimState): void {
  anim.hurtFlash = 1;
  anim.state = 'hurt';
  anim.stateTimer = 0;
}

/** Trigger death animation */
export function triggerEnemyDeath(anim: EnemyAnimState): void {
  anim.state = 'dying';
  anim.deathProgress = 0;
}

/** Set enemy to alert state (spotted player) */
export function setEnemyAlert(anim: EnemyAnimState): void {
  if (anim.state !== 'dying' && anim.state !== 'hurt') {
    anim.state = 'alert';
  }
}

// ─── Status Effect Overlays ─────────────────────────────────────

const STATUS_COLORS: Record<string, { color: number; particleColor: number }> = {
  poisoned:  { color: 0x44cc44, particleColor: 0x88ff88 },
  burning:   { color: 0xff6633, particleColor: 0xffaa44 },
  slowed:    { color: 0x4488ff, particleColor: 0x88ccff },
  stunned:   { color: 0xffdd44, particleColor: 0xffffaa },
  shielded:  { color: 0x88ccff, particleColor: 0xccddff },
  enraged:   { color: 0xff2222, particleColor: 0xff6644 },
  healing:   { color: 0x44ff88, particleColor: 0x88ffaa },
};

/** Draw status effect overlay on an enemy sprite. Returns the Graphics to remove later. */
export function drawStatusOverlay(
  container: Container,
  effectType: string,
  timer: number,
): Graphics {
  const g = new Graphics();
  const config = STATUS_COLORS[effectType] ?? { color: 0xffffff, particleColor: 0xffffff };
  const pulse = 0.5 + Math.sin(timer * 4) * 0.5;

  switch (effectType) {
    case 'poisoned': {
      // Green bubbles rising
      for (let i = 0; i < 3; i++) {
        const bx = Math.sin(timer * 2 + i * 2.1) * 8;
        const by = -5 - ((timer * 15 + i * 10) % 25);
        g.circle(bx, by, 1.5 + Math.sin(timer + i) * 0.5)
          .fill({ color: config.color, alpha: 0.3 + pulse * 0.2 });
      }
      // Green aura
      g.circle(0, -10, 14).fill({ color: config.color, alpha: 0.04 + pulse * 0.02 });
      break;
    }
    case 'burning': {
      // Fire particles rising
      for (let i = 0; i < 4; i++) {
        const fx = Math.sin(timer * 3 + i * 1.6) * 10;
        const fy = -3 - ((timer * 20 + i * 8) % 30);
        const sz = 2 - ((timer * 20 + i * 8) % 30) / 30 * 1.5;
        g.circle(fx, fy, Math.max(0.5, sz))
          .fill({ color: i % 2 === 0 ? 0xff4422 : 0xffaa33, alpha: 0.4 + pulse * 0.2 });
      }
      // Heat shimmer
      g.circle(0, -10, 12).fill({ color: 0xff4422, alpha: 0.05 + pulse * 0.03 });
      break;
    }
    case 'slowed': {
      // Ice crystals
      for (let i = 0; i < 3; i++) {
        const angle = timer * 0.5 + (i / 3) * Math.PI * 2;
        const ix = Math.cos(angle) * 10;
        const iy = -8 + Math.sin(angle) * 5;
        g.poly([
          { x: ix, y: iy - 3 }, { x: ix + 2, y: iy },
          { x: ix, y: iy + 3 }, { x: ix - 2, y: iy },
        ]).fill({ color: config.color, alpha: 0.3 + pulse * 0.15 });
      }
      // Frost ring
      g.circle(0, -8, 13).stroke({ color: config.color, width: 0.8, alpha: 0.15 + pulse * 0.1 });
      break;
    }
    case 'stunned': {
      // Spinning stars
      for (let i = 0; i < 3; i++) {
        const angle = timer * 3 + (i / 3) * Math.PI * 2;
        const sx = Math.cos(angle) * 8;
        const sy = -22 + Math.sin(angle * 0.5) * 2;
        drawStar(g, sx, sy, 2, config.color, 0.5 + pulse * 0.3);
      }
      break;
    }
    case 'shielded': {
      // Shield bubble
      g.circle(0, -10, 16).stroke({ color: config.color, width: 1.5, alpha: 0.2 + pulse * 0.15 });
      g.circle(0, -10, 14).stroke({ color: lighten(config.color, 0.3), width: 0.5, alpha: 0.1 + pulse * 0.1 });
      break;
    }
    case 'enraged': {
      // Red pulsing aura
      g.circle(0, -8, 16 + pulse * 4).fill({ color: config.color, alpha: 0.06 + pulse * 0.04 });
      // Anger veins
      for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2 + timer;
        const len = 10 + pulse * 4;
        g.moveTo(0, -8)
          .lineTo(Math.cos(angle) * len, -8 + Math.sin(angle) * len * 0.6)
          .stroke({ color: config.color, width: 0.8, alpha: 0.2 + pulse * 0.15 });
      }
      break;
    }
    case 'healing': {
      // Green sparkles rising
      for (let i = 0; i < 3; i++) {
        const hx = Math.sin(timer * 1.5 + i * 2) * 7;
        const hy = -5 - ((timer * 12 + i * 10) % 22);
        g.circle(hx, hy, 1).fill({ color: config.color, alpha: 0.35 + pulse * 0.2 });
      }
      // Heal ring
      g.circle(0, -8, 12).stroke({ color: config.color, width: 0.5, alpha: 0.1 + pulse * 0.08 });
      break;
    }
  }

  container.addChild(g);
  return g;
}

function drawStar(g: Graphics, cx: number, cy: number, size: number, color: number, alpha: number): void {
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? size : size * 0.4;
    points.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
  }
  g.poly(points).fill({ color, alpha });
}

// ─── Boss Aura Animation ─────────────────────────────────────────

/** Draw animated boss aura rings. Returns Graphics to update/remove. */
export function drawBossAura(
  container: Container,
  timer: number,
  bodyColor: number,
  phase: number,
  existing?: Graphics,
): Graphics {
  const g = existing ?? new Graphics();
  g.clear();
  const pulseA = 0.5 + Math.sin(timer * 2) * 0.5;
  const pulseB = 0.5 + Math.sin(timer * 3 + 1) * 0.5;

  // Outer rotating ring
  const outerR = 28 + pulseA * 6;
  g.circle(0, -10, outerR).stroke({ color: bodyColor, width: 1, alpha: 0.08 + pulseA * 0.06 });

  // Inner pulsing ring
  const innerR = 18 + pulseB * 4;
  g.circle(0, -10, innerR).stroke({ color: lighten(bodyColor, 0.3), width: 0.8, alpha: 0.1 + pulseB * 0.08 });

  // Phase-specific effects
  if (phase >= 2) {
    // Phase 2+: additional energy ring
    g.circle(0, -10, 22 + Math.sin(timer * 4) * 3)
      .stroke({ color: lighten(bodyColor, 0.5), width: 0.5, alpha: 0.12 });
  }
  if (phase >= 3) {
    // Phase 3+: dangerous crackling
    for (let i = 0; i < 4; i++) {
      const angle = timer * 2 + (i / 4) * Math.PI * 2;
      const r = 20 + Math.sin(timer * 5 + i) * 5;
      const px = Math.cos(angle) * r;
      const py = -10 + Math.sin(angle) * r * 0.5;
      g.circle(px, py, 1.5).fill({ color: lighten(bodyColor, 0.6), alpha: 0.3 + pulseA * 0.2 });
    }
  }

  // Ground shadow aura
  g.ellipse(0, 2, outerR * 0.8, outerR * 0.25)
    .fill({ color: bodyColor, alpha: 0.03 + pulseA * 0.02 });

  if (!existing) container.addChild(g);
  return g;
}

// ─── Alert Indicator ─────────────────────────────────────────────

/** Draw "!" exclamation when enemy spots player */
export function drawAlertIndicator(container: Container, timer: number): Graphics {
  const g = new Graphics();
  const bounce = Math.max(0, 1 - timer * 2); // Quick pop-in
  const scale = 1 + bounce * 0.5;

  g.y = -30 - bounce * 10;

  // Red circle background
  g.circle(0, 0, 5 * scale).fill({ color: 0xcc2222, alpha: 0.8 });
  // Exclamation mark (simple rect + dot)
  g.rect(-1, -3.5 * scale, 2, 5 * scale).fill({ color: 0xffffff, alpha: 0.9 });
  g.circle(0, 3.5 * scale, 1).fill({ color: 0xffffff, alpha: 0.9 });

  container.addChild(g);
  return g;
}
