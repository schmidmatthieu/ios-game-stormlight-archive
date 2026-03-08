import { Container, Graphics } from 'pixi.js';
import type { ChampionClass } from '../data/types';
import type { CharacterAnimator } from './CharacterAnimator';

// ─── Class Aura Colors ──────────────────────────────────────────

export const CLASS_AURA_COLORS: Record<string, number> = {
  mistborn: 0x8899cc, radiant: 0x88ddff, awakener: 0xcc88ff,
  elantrian: 0xffcc44, sandMaster: 0xddcc88, nightmarePainter: 0x8866cc,
};

// ─── Class Aura Effect ───────────────────────────────────────────

export function drawClassAura(
  worldContainer: Container,
  x: number, y: number,
  cls: ChampionClass,
  animator: CharacterAnimator,
  existing?: Graphics | null,
): Graphics | null {
  if (animator.auraAlpha <= 0.005) {
    if (existing) existing.visible = false;
    return existing ?? null;
  }

  const color = CLASS_AURA_COLORS[cls] ?? 0x8899cc;
  const g = existing ?? new Graphics();
  g.clear();
  g.visible = true;
  g.zIndex = -1;

  // Inner glow
  g.circle(0, -15, animator.auraRadius * 0.6)
    .fill({ color, alpha: animator.auraAlpha * 0.5 });
  // Outer glow
  g.circle(0, -15, animator.auraRadius)
    .fill({ color, alpha: animator.auraAlpha * 0.2 });

  // Class-specific particles
  const t = animator.timer;
  switch (cls) {
    case 'mistborn': {
      // Mist swirls
      for (let i = 0; i < 4; i++) {
        const angle = t * 1.5 + (i / 4) * Math.PI * 2;
        const r = 12 + Math.sin(t * 2 + i) * 4;
        g.circle(Math.cos(angle) * r, -15 + Math.sin(angle) * r * 0.5, 1.5)
          .fill({ color: 0xaabbcc, alpha: animator.auraAlpha * 2 });
      }
      break;
    }
    case 'radiant': {
      // Stormlight wisps rising
      for (let i = 0; i < 3; i++) {
        const phase = t * 3 + i * 2.1;
        const rise = (phase % 2) / 2;
        const px = Math.sin(i * 3.7) * 8;
        g.circle(px, -10 - rise * 20, 1)
          .fill({ color: 0xcceeFF, alpha: animator.auraAlpha * 3 * (1 - rise) });
      }
      break;
    }
    case 'awakener': {
      // Color shifting rings
      const colors = [0xff4466, 0x44aaff, 0x44ff88, 0xffcc44];
      for (let i = 0; i < colors.length; i++) {
        const r = 10 + i * 3 + Math.sin(t * 2 + i) * 2;
        g.circle(0, -15, r)
          .stroke({ color: colors[i], width: 0.5, alpha: animator.auraAlpha * 1.5 });
      }
      break;
    }
    case 'elantrian': {
      // Aon glow lines
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2 + t * 0.5;
        const r = 14;
        const x1 = Math.cos(angle) * r * 0.3;
        const y1 = -15 + Math.sin(angle) * r * 0.3;
        const x2 = Math.cos(angle) * r;
        const y2 = -15 + Math.sin(angle) * r * 0.5;
        g.moveTo(x1, y1).lineTo(x2, y2)
          .stroke({ color: 0xffdd66, width: 1, alpha: animator.auraAlpha * 2 });
      }
      break;
    }
    case 'sandMaster': {
      // Sand orbiting
      for (let i = 0; i < 6; i++) {
        const angle = t * 2 + (i / 6) * Math.PI * 2;
        const r = 14 + Math.sin(t + i) * 3;
        g.circle(Math.cos(angle) * r, -12 + Math.sin(angle) * r * 0.4, 1)
          .fill({ color: 0xddcc88, alpha: animator.auraAlpha * 2.5 });
      }
      break;
    }
    case 'nightmarePainter': {
      // Ink drips / shadow tendrils
      for (let i = 0; i < 3; i++) {
        const px = (i - 1) * 8;
        const phase = t * 1.5 + i * 1.3;
        const drip = (phase % 3) / 3;
        g.rect(px - 0.5, -20 + drip * 15, 1, 3 + drip * 4)
          .fill({ color: 0x332244, alpha: animator.auraAlpha * 2 * (1 - drip) });
      }
      break;
    }
  }

  g.x = x;
  g.y = y;
  return g;
}
