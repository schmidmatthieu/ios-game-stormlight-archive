// ─── Combat Feedback Effects ─────────────────────────────────────
// Visual feedback for hits, crits, kills, and combat events

import { Graphics, Container, Text, TextStyle } from 'pixi.js';
import { lighten } from '../utils/ColorUtils';

// ─── Hit Directional Slash ───────────────────────────────────────

/** Draw a directional slash mark at the hit location */
export function createDirectionalSlash(
  container: Container,
  x: number, y: number,
  angle: number,
  isCrit: boolean,
  color: number,
): void {
  const g = new Graphics();
  g.zIndex = y + 100;
  const len = isCrit ? 28 : 18;
  const width = isCrit ? 3 : 2;

  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const x1 = x - cos * len * 0.5;
  const y1 = y - sin * len * 0.5;
  const x2 = x + cos * len * 0.5;
  const y2 = y + sin * len * 0.5;

  // Main slash
  g.moveTo(x1, y1).lineTo(x2, y2).stroke({ color, width, alpha: 0.7 });
  // White highlight
  g.moveTo(x1 + 1, y1 - 1).lineTo(x2 + 1, y2 - 1).stroke({ color: 0xffffff, width: width * 0.4, alpha: 0.4 });

  if (isCrit) {
    // Crit star burst
    for (let i = 0; i < 4; i++) {
      const a = angle + (i / 4) * Math.PI * 2;
      const r = 8 + Math.random() * 6;
      g.moveTo(x, y).lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.6)
        .stroke({ color: 0xffdd44, width: 1.2, alpha: 0.5 });
    }
    // Crit flash circle
    g.circle(x, y, 15).fill({ color: 0xffdd44, alpha: 0.15 });
  }

  container.addChild(g);

  // Animate fade
  let life = 0;
  const maxLife = isCrit ? 0.4 : 0.25;
  const animate = () => {
    life += 1 / 60;
    const progress = life / maxLife;
    g.alpha = 1 - progress;
    g.scale.x = 1 + progress * 0.3;
    g.scale.y = 1 + progress * 0.2;
    if (life < maxLife) {
      requestAnimationFrame(animate);
    } else {
      container.removeChild(g);
      g.destroy();
    }
  };
  requestAnimationFrame(animate);
}

// ─── Crit Flash Overlay ──────────────────────────────────────────

/** Full-screen white flash for critical hits */
export function createCritFlash(uiContainer: Container, w: number, h: number): void {
  const flash = new Graphics();
  flash.rect(0, 0, w, h).fill({ color: 0xffffff, alpha: 0.2 });
  flash.zIndex = 9999;
  uiContainer.addChild(flash);

  let life = 0;
  const animate = () => {
    life += 1 / 60;
    flash.alpha = Math.max(0, 0.2 - life * 1.2);
    if (life < 0.2) {
      requestAnimationFrame(animate);
    } else {
      uiContainer.removeChild(flash);
      flash.destroy();
    }
  };
  requestAnimationFrame(animate);
}

// ─── Kill Burst ──────────────────────────────────────────────────

/** Satisfying burst effect when killing an enemy */
export function createKillBurst(
  container: Container,
  x: number, y: number,
  tier: string,
  worldColor: number,
): void {
  const g = new Graphics();
  g.zIndex = y + 200;

  const ringCount = tier === 'boss' ? 3 : tier === 'elite' ? 2 : 1;
  const baseRadius = tier === 'boss' ? 30 : tier === 'elite' ? 22 : 14;

  container.addChild(g);

  let life = 0;
  const maxLife = tier === 'boss' ? 0.8 : tier === 'elite' ? 0.6 : 0.35;

  const animate = () => {
    life += 1 / 60;
    const t = life / maxLife;
    g.clear();

    // Expanding ring(s)
    for (let i = 0; i < ringCount; i++) {
      const delay = i * 0.1;
      const ringT = Math.max(0, (t - delay) / (1 - delay));
      if (ringT <= 0 || ringT >= 1) continue;
      const radius = baseRadius * (0.3 + ringT * 0.7);
      const alpha = (1 - ringT) * 0.4;
      g.circle(x, y, radius).stroke({ color: worldColor, width: 2 - ringT, alpha });
    }

    // Inner flash
    if (t < 0.3) {
      const flashAlpha = 0.3 * (1 - t / 0.3);
      g.circle(x, y, baseRadius * 0.5 * (1 + t * 2)).fill({ color: 0xffffff, alpha: flashAlpha });
    }

    // Particle shards flying out
    if (t < 0.7) {
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 + life * 2;
        const dist = baseRadius * t * 1.5;
        const px = x + Math.cos(angle) * dist;
        const py = y + Math.sin(angle) * dist * 0.6;
        const sz = 2 * (1 - t);
        g.circle(px, py, Math.max(0.3, sz)).fill({ color: lighten(worldColor, 0.3), alpha: 0.5 * (1 - t) });
      }
    }

    if (life < maxLife) {
      requestAnimationFrame(animate);
    } else {
      container.removeChild(g);
      g.destroy();
    }
  };
  requestAnimationFrame(animate);
}

// ─── Kill Streak Banner ──────────────────────────────────────────

const STREAK_LABELS: Record<number, { text: string; color: number }> = {
  3:  { text: 'Triple Kill!',    color: 0x44ccff },
  5:  { text: 'Quintuple!',     color: 0x44ffaa },
  7:  { text: 'Massacre!',      color: 0xff8844 },
  10: { text: 'Carnage!',       color: 0xff4444 },
  15: { text: 'UNSTOPPABLE!',   color: 0xffdd44 },
};

/** Show kill streak banner when reaching milestones */
export function showKillStreakBanner(
  uiContainer: Container,
  w: number, h: number,
  killCount: number,
): void {
  const streakInfo = STREAK_LABELS[killCount];
  if (!streakInfo) return;

  const container = new Container();
  container.zIndex = 9990;

  // Background band
  const bg = new Graphics();
  bg.rect(0, h * 0.35, w, 40).fill({ color: 0x000000, alpha: 0.5 });
  container.addChild(bg);

  // Text
  const text = new Text({
    text: streakInfo.text,
    style: new TextStyle({
      fontFamily: 'Georgia, serif',
      fontSize: 22,
      fontWeight: 'bold',
      fill: streakInfo.color,
      dropShadow: { color: 0x000000, blur: 4, distance: 2 },
    }),
  });
  text.anchor.set(0.5);
  text.x = w / 2;
  text.y = h * 0.35 + 20;
  container.addChild(text);

  // Kill count
  const countText = new Text({
    text: `${killCount} kills`,
    style: new TextStyle({
      fontFamily: 'sans-serif',
      fontSize: 10,
      fill: 0xaaaaaa,
    }),
  });
  countText.anchor.set(0.5);
  countText.x = w / 2;
  countText.y = h * 0.35 + 38;
  container.addChild(countText);

  uiContainer.addChild(container);

  // Animate in, hold, fade out
  container.alpha = 0;
  let life = 0;
  const animate = () => {
    life += 1 / 60;
    if (life < 0.2) {
      container.alpha = life / 0.2;
      text.scale.set(1 + (1 - life / 0.2) * 0.3);
    } else if (life < 1.5) {
      container.alpha = 1;
      text.scale.set(1);
    } else if (life < 2) {
      container.alpha = 1 - (life - 1.5) / 0.5;
    } else {
      uiContainer.removeChild(container);
      container.destroy({ children: true });
      return;
    }
    requestAnimationFrame(animate);
  };
  requestAnimationFrame(animate);
}

// ─── Damage Type Indicator ───────────────────────────────────────

const DAMAGE_TYPE_COLORS: Record<string, number> = {
  physical:    0xcccccc,
  allomantic:  0x6688cc,
  stormlight:  0x88ccff,
  biochromatic: 0xcc66ff,
  aonic:       0xffcc44,
};

/** Get color for a damage type */
export function getDamageTypeColor(damageType: string): number {
  return DAMAGE_TYPE_COLORS[damageType] ?? 0xcccccc;
}

// ─── Hit Stop (brief pause for impact feel) ──────────────────────

let hitStopActive = false;
let hitStopTimer = 0;

/** Trigger a brief game pause for hit impact feel */
export function triggerHitStop(duration: number): void {
  hitStopActive = true;
  hitStopTimer = duration;
}

/** Returns true if game should pause this frame for hit stop */
export function updateHitStop(dt: number): boolean {
  if (!hitStopActive) return false;
  hitStopTimer -= dt;
  if (hitStopTimer <= 0) {
    hitStopActive = false;
    return false;
  }
  return true;
}

// ─── Ground Impact Crack ─────────────────────────────────────────

/** Draw a ground crack decal where a heavy hit lands */
export function createGroundCrack(
  container: Container,
  x: number, y: number,
  size: number,
): void {
  const g = new Graphics();
  g.zIndex = y - 50;

  // Radial cracks
  const branches = 4 + Math.floor(Math.random() * 3);
  for (let i = 0; i < branches; i++) {
    const angle = (i / branches) * Math.PI * 2 + Math.random() * 0.5;
    const len = size * (0.6 + Math.random() * 0.4);
    const midX = x + Math.cos(angle) * len * 0.5 + (Math.random() - 0.5) * 3;
    const midY = y + Math.sin(angle) * len * 0.5 * 0.5 + (Math.random() - 0.5) * 2;
    const endX = x + Math.cos(angle) * len;
    const endY = y + Math.sin(angle) * len * 0.5;

    g.moveTo(x, y).lineTo(midX, midY).lineTo(endX, endY)
      .stroke({ color: 0x222222, width: 1 + Math.random(), alpha: 0.35 });
  }

  // Center impact
  g.circle(x, y, size * 0.15).fill({ color: 0x111111, alpha: 0.2 });

  container.addChild(g);

  // Fade over 3 seconds
  let life = 0;
  const animate = () => {
    life += 1 / 60;
    if (life > 2) {
      g.alpha = Math.max(0, 1 - (life - 2));
    }
    if (life < 3) {
      requestAnimationFrame(animate);
    } else {
      container.removeChild(g);
      g.destroy();
    }
  };
  requestAnimationFrame(animate);
}
