// ─── Combat Feedback Effects ─────────────────────────────────────
// Visual feedback for hits, crits, kills, and combat events.
// All animations use performance.now() for frame-rate-independent timing
// and check for destroyed state to prevent orphan callbacks.

import { Graphics, Container, Text, TextStyle } from 'pixi.js';
import { lighten } from '../utils/ColorUtils';

// ─── Safe Animation Helper ──────────────────────────────────────

function animateEffect(
  g: Graphics | Container,
  parent: Container,
  duration: number,
  onTick: (t: number, dt: number) => void,
  onDone?: () => void,
): void {
  let elapsed = 0;
  let last = performance.now();
  const tick = () => {
    if (g.destroyed) return; // Scene changed — stop silently
    const now = performance.now();
    const dt = (now - last) / 1000;
    last = now;
    elapsed += dt;
    const t = Math.min(elapsed / duration, 1);
    onTick(t, dt);
    if (elapsed < duration) {
      requestAnimationFrame(tick);
    } else {
      parent.removeChild(g);
      g.destroy(g instanceof Container ? { children: true } : undefined);
      onDone?.();
    }
  };
  requestAnimationFrame(tick);
}

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
    for (let i = 0; i < 4; i++) {
      const a = angle + (i / 4) * Math.PI * 2;
      const r = 8 + Math.random() * 6;
      g.moveTo(x, y).lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.6)
        .stroke({ color: 0xffdd44, width: 1.2, alpha: 0.5 });
    }
    g.circle(x, y, 15).fill({ color: 0xffdd44, alpha: 0.15 });
  }

  container.addChild(g);

  const maxLife = isCrit ? 0.4 : 0.25;
  animateEffect(g, container, maxLife, (t) => {
    g.alpha = 1 - t;
    g.scale.x = 1 + t * 0.3;
    g.scale.y = 1 + t * 0.2;
  });
}

// ─── Crit Flash Overlay ──────────────────────────────────────────

/** Full-screen flash for critical hits with color tinting */
export function createCritFlash(uiContainer: Container, w: number, h: number, color = 0xffffff): void {
  const flash = new Graphics();
  // Main flash
  flash.rect(0, 0, w, h).fill({ color, alpha: 0.2 });
  // Vignette highlight — brighter center
  flash.circle(w / 2, h / 2, Math.max(w, h) * 0.3).fill({ color: 0xffffff, alpha: 0.08 });
  // Chromatic aberration hint — colored edge strips
  flash.rect(0, 0, 3, h).fill({ color: 0xff4444, alpha: 0.08 });
  flash.rect(w - 3, 0, 3, h).fill({ color: 0x4444ff, alpha: 0.08 });
  flash.zIndex = 9999;
  uiContainer.addChild(flash);

  animateEffect(flash, uiContainer, 0.25, (t) => {
    // Sharp flash then rapid decay
    const intensity = t < 0.1 ? 1 : Math.max(0, 1 - (t - 0.1) / 0.9);
    flash.alpha = intensity * 0.25;
  });
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
  const maxLife = tier === 'boss' ? 0.8 : tier === 'elite' ? 0.6 : 0.35;

  container.addChild(g);

  // Store random shard angles for consistent animation
  const shardAngles: number[] = [];
  const shardCount = tier === 'boss' ? 16 : tier === 'elite' ? 10 : 6;
  for (let i = 0; i < shardCount; i++) {
    shardAngles.push(Math.random() * Math.PI * 2);
  }

  animateEffect(g, container, maxLife, (t) => {
    g.clear();

    // Outer glow pulse
    if (t < 0.5) {
      const glowR = baseRadius * (1 + t * 3);
      g.circle(x, y, glowR).fill({ color: worldColor, alpha: 0.06 * (1 - t * 2) });
    }

    // Expanding ring(s) with glow
    for (let i = 0; i < ringCount; i++) {
      const delay = i * 0.1;
      const ringT = Math.max(0, (t - delay) / (1 - delay));
      if (ringT <= 0 || ringT >= 1) continue;
      const radius = baseRadius * (0.3 + ringT * 0.7);
      const alpha = (1 - ringT) * 0.4;
      // Glow ring
      g.circle(x, y, radius + 2).stroke({ color: worldColor, width: 4, alpha: alpha * 0.2 });
      // Main ring
      g.circle(x, y, radius).stroke({ color: worldColor, width: 2.5 - ringT, alpha });
      // Inner bright ring
      g.circle(x, y, radius * 0.95).stroke({ color: lighten(worldColor, 0.4), width: 0.8, alpha: alpha * 0.6 });
    }

    // Inner flash — brighter, with starburst
    if (t < 0.3) {
      const flashAlpha = 0.35 * (1 - t / 0.3);
      const flashR = baseRadius * 0.5 * (1 + t * 2);
      g.circle(x, y, flashR).fill({ color: 0xffffff, alpha: flashAlpha });
      // Starburst rays
      const rayCount = tier === 'boss' ? 8 : 4;
      for (let i = 0; i < rayCount; i++) {
        const a = (i / rayCount) * Math.PI * 2;
        const rLen = flashR * 1.5;
        g.moveTo(x, y).lineTo(x + Math.cos(a) * rLen, y + Math.sin(a) * rLen * 0.6)
          .stroke({ color: 0xffffff, width: 1.5, alpha: flashAlpha * 0.5 });
      }
    }

    // Particle shards — more numerous with trails
    if (t < 0.8) {
      for (let i = 0; i < shardCount; i++) {
        const angle = shardAngles[i] + t * 0.5;
        const speed = 1 + (i % 3) * 0.4;
        const dist = baseRadius * t * 1.8 * speed;
        const px = x + Math.cos(angle) * dist;
        const py = y + Math.sin(angle) * dist * 0.6;
        const sz = (2.5 - t * 2) * (1 + (i % 2) * 0.3);
        const a = 0.6 * (1 - t / 0.8);
        // Trail
        const trailDist = dist * 0.7;
        const trailX = x + Math.cos(angle) * trailDist;
        const trailY = y + Math.sin(angle) * trailDist * 0.6;
        g.moveTo(trailX, trailY).lineTo(px, py)
          .stroke({ color: worldColor, width: sz * 0.4, alpha: a * 0.3 });
        // Shard
        g.circle(px, py, Math.max(0.3, sz)).fill({ color: lighten(worldColor, 0.3), alpha: a });
      }
    }

    // Boss death: screen-edge light burst
    if (tier === 'boss' && t < 0.4) {
      const burstAlpha = 0.08 * (1 - t / 0.4);
      g.circle(x, y, baseRadius * 4 * t).stroke({ color: 0xffffff, width: 3, alpha: burstAlpha });
    }
  });
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

  const bg = new Graphics();
  bg.rect(0, h * 0.35, w, 40).fill({ color: 0x000000, alpha: 0.5 });
  container.addChild(bg);

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
  container.alpha = 0;

  animateEffect(container, uiContainer, 2, (t) => {
    if (t < 0.1) {
      container.alpha = t / 0.1;
      text.scale.set(1 + (1 - t / 0.1) * 0.3);
    } else if (t < 0.75) {
      container.alpha = 1;
      text.scale.set(1);
    } else {
      container.alpha = 1 - (t - 0.75) / 0.25;
    }
  });
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

  g.circle(x, y, size * 0.15).fill({ color: 0x111111, alpha: 0.2 });
  container.addChild(g);

  animateEffect(g, container, 3, (t) => {
    if (t > 0.67) {
      g.alpha = Math.max(0, 1 - (t - 0.67) / 0.33);
    }
  });
}
