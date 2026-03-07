// ─── Per-Ability Skill Animations ────────────────────────────────
// Uses a ticker-based update loop instead of independent requestAnimationFrame
// to stay synchronized with the game loop and be pause-safe.

import { Container, Graphics } from 'pixi.js';
import { ObjectPool } from './ObjectPool';

// ─── Active Animation Tracking ──────────────────────────────────

interface ActiveVFX {
  gfx: Graphics;
  elapsed: number;
  duration: number;
}

const activeAnimations: ActiveVFX[] = [];

const vfxPool = new ObjectPool<Graphics>(
  () => new Graphics(),
  (g) => { g.clear(); g.alpha = 1; g.scale.set(1); g.rotation = 0; g.removeFromParent(); },
  10,
);

/** Call from the main game loop to update all active VFX. */
export function updateSkillVFX(dt: number): void {
  for (let i = activeAnimations.length - 1; i >= 0; i--) {
    const a = activeAnimations[i];
    a.elapsed += dt;
    const p = a.elapsed / a.duration;
    a.gfx.alpha = Math.max(0, 1 - p);
    a.gfx.scale.set(0.5 + p * 0.6);
    if (a.elapsed >= a.duration) {
      vfxPool.release(a.gfx);
      activeAnimations.splice(i, 1);
    }
  }
}

/** Clear all active VFX (call on scene exit). */
export function clearSkillVFX(): void {
  for (const a of activeAnimations) {
    vfxPool.release(a.gfx);
  }
  activeAnimations.length = 0;
}

function spawnVFX(container: Container, x: number, y: number, duration: number, draw: (g: Graphics) => void): void {
  const g = vfxPool.acquire();
  draw(g);
  g.x = x;
  g.y = y;
  g.zIndex = 100000;
  container.addChild(g);
  activeAnimations.push({ gfx: g, elapsed: 0, duration });
}

// ─── Allomancy Animations ────────────────────────────────────────

function steelPush(g: Graphics, x: number, y: number, tx: number, ty: number): void {
  const angle = Math.atan2(ty - y, tx - x);
  for (let i = 0; i < 8; i++) {
    const a = angle + (i - 3.5) * 0.15;
    const len = 60 + Math.random() * 40;
    g.moveTo(0, 0).lineTo(Math.cos(a) * len, Math.sin(a) * len)
      .stroke({ color: 0x4488ff, width: 2 - i * 0.1, alpha: 0.6 });
    const sz = 2 + Math.random() * 3;
    g.rect(Math.cos(a) * len - sz / 2, Math.sin(a) * len - sz / 2, sz, sz)
      .fill({ color: 0x88aacc, alpha: 0.7 });
  }
  g.circle(0, 0, 15).stroke({ color: 0x6699ff, width: 3, alpha: 0.4 });
}

function ironPull(g: Graphics, x: number, y: number, tx: number, ty: number): void {
  const angle = Math.atan2(y - ty, x - tx);
  const dist = Math.hypot(tx - x, ty - y);
  for (let i = 0; i < 6; i++) {
    const a = angle + (i - 2.5) * 0.2;
    const startDist = Math.min(dist, 80);
    g.moveTo(Math.cos(a) * startDist, Math.sin(a) * startDist)
      .lineTo(0, 0)
      .stroke({ color: 0xff4444, width: 1.5, alpha: 0.5 });
  }
  g.circle(0, 0, 8).fill({ color: 0xff6644, alpha: 0.3 });
  g.circle(0, 0, 4).fill({ color: 0xff8866, alpha: 0.5 });
}

function pewterFlare(g: Graphics): void {
  g.circle(0, 0, 20).fill({ color: 0xff8844, alpha: 0.15 });
  g.circle(0, 0, 14).stroke({ color: 0xffaa66, width: 2, alpha: 0.4 });
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    g.moveTo(0, 0).lineTo(Math.cos(a) * 18, Math.sin(a) * 18)
      .stroke({ color: 0xffcc88, width: 3, alpha: 0.3 });
  }
}

// ─── Surgebinding Animations ─────────────────────────────────────

function windrunnerLash(g: Graphics): void {
  for (let i = 0; i < 10; i++) {
    const t = i / 10;
    const angle = t * Math.PI * 4;
    const radius = 5 + t * 25;
    const px = Math.cos(angle) * radius;
    const py = -t * 40 + Math.sin(angle) * 5;
    g.circle(px, py, 2 - t).fill({ color: 0x88ccff, alpha: 0.6 - t * 0.4 });
  }
  g.ellipse(0, 0, 30, 12).stroke({ color: 0x44aaff, width: 2, alpha: 0.3 });
}

function lightweaverIllusion(g: Graphics): void {
  const colors = [0xff4444, 0xff8844, 0xffff44, 0x44ff44, 0x4488ff, 0x8844ff];
  for (let i = 0; i < colors.length; i++) {
    const a = (i / colors.length) * Math.PI * 2;
    const r = 20 + Math.random() * 10;
    g.circle(Math.cos(a) * r, Math.sin(a) * r, 4).fill({ color: colors[i], alpha: 0.3 });
    g.moveTo(0, 0).lineTo(Math.cos(a) * r, Math.sin(a) * r)
      .stroke({ color: colors[i], width: 1, alpha: 0.2 });
  }
  g.circle(0, 0, 10).fill({ color: 0xffffff, alpha: 0.25 });
}

// ─── Awakening Animations ────────────────────────────────────────

function awakenObject(g: Graphics): void {
  const hueColors = [0xff4466, 0xff8844, 0xffcc44, 0x44cc66, 0x4488ff, 0x8844ff];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const len = 30 + Math.random() * 20;
    for (let j = 0; j < 5; j++) {
      const t = j / 5;
      const cx = Math.cos(a) * len * t + Math.sin(a + t * 3) * 5;
      const cy = Math.sin(a) * len * t + Math.cos(a + t * 3) * 5;
      g.circle(cx, cy, 2 - t).fill({ color: hueColors[i], alpha: 0.5 - t * 0.3 });
    }
  }
  g.circle(0, 0, 12).stroke({ color: 0xcc88ff, width: 2, alpha: 0.4 });
  g.circle(0, 0, 6).fill({ color: 0xee99ff, alpha: 0.3 });
}

function divineBreath(g: Graphics): void {
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2;
    const r = 40 + Math.random() * 30;
    const hue = Math.floor(i / 20 * 360);
    const color = hslToHex(hue, 80, 60);
    g.moveTo(0, 0).lineTo(Math.cos(a) * r, Math.sin(a) * r)
      .stroke({ color, width: 2, alpha: 0.4 });
    g.circle(Math.cos(a) * r, Math.sin(a) * r, 3).fill({ color, alpha: 0.5 });
  }
  g.circle(0, 0, 20).fill({ color: 0xffffff, alpha: 0.2 });
}

// ─── AonDor Animations ──────────────────────────────────────────

function aonRao(g: Graphics): void {
  g.circle(0, 0, 25).stroke({ color: 0xffcc44, width: 2, alpha: 0.5 });
  for (let i = -2; i <= 2; i++) {
    g.moveTo(i * 8, -20).lineTo(i * 8, 20).stroke({ color: 0xffaa33, width: 1, alpha: 0.3 });
    g.moveTo(-20, i * 8).lineTo(20, i * 8).stroke({ color: 0xffaa33, width: 1, alpha: 0.3 });
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    g.circle(Math.cos(a) * 22, Math.sin(a) * 22, 2).fill({ color: 0xffdd66, alpha: 0.6 });
  }
}

function aonTia(g: Graphics, x: number, y: number, tx: number, ty: number): void {
  g.circle(0, 0, 15).fill({ color: 0xffcc44, alpha: 0.4 });
  g.circle(0, 0, 15).stroke({ color: 0xffee88, width: 2, alpha: 0.6 });
  const dx = tx - x, dy = ty - y;
  g.circle(dx, dy, 12).fill({ color: 0xffcc44, alpha: 0.3 });
  g.circle(dx, dy, 12).stroke({ color: 0xffee88, width: 1.5, alpha: 0.5 });
  g.moveTo(0, 0).lineTo(dx, dy).stroke({ color: 0xffaa33, width: 1, alpha: 0.2 });
}

// ─── Sand Mastery Animations ─────────────────────────────────────

function sandWhip(g: Graphics, x: number, y: number, tx: number, ty: number): void {
  const angle = Math.atan2(ty - y, tx - x);
  const len = Math.min(80, Math.hypot(tx - x, ty - y));
  for (let i = 0; i < 15; i++) {
    const t = i / 15;
    const px = Math.cos(angle) * len * t + Math.sin(angle * 3 + t * 5) * 8 * t;
    const py = Math.sin(angle) * len * t + Math.cos(angle * 3 + t * 5) * 8 * t;
    const sz = 3 - t * 2;
    g.circle(px, py, sz).fill({ color: 0xddcc88, alpha: 0.6 - t * 0.4 });
  }
}

function sandStorm(g: Graphics): void {
  for (let ring = 0; ring < 4; ring++) {
    const r = 15 + ring * 15;
    g.circle(0, 0, r).stroke({ color: 0xddaa55, width: 2 - ring * 0.3, alpha: 0.3 - ring * 0.05 });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + ring * 0.3;
      g.rect(Math.cos(a) * r - 1, Math.sin(a) * r - 1, 2, 2)
        .fill({ color: 0xeecc66, alpha: 0.5 });
    }
  }
}

// ─── Nightmare Painting Animations ───────────────────────────────

function paintCapture(g: Graphics, x: number, y: number, tx: number, ty: number): void {
  const dx = tx - x, dy = ty - y;
  for (let i = 0; i < 5; i++) {
    const ox = (Math.random() - 0.5) * 20;
    const oy = (Math.random() - 0.5) * 20;
    g.moveTo(ox, oy);
    for (let j = 1; j <= 4; j++) {
      const t = j / 4;
      g.lineTo(
        ox + dx * t + Math.sin(t * 6 + i) * 10,
        oy + dy * t + Math.cos(t * 6 + i) * 10,
      );
    }
    g.stroke({ color: 0x331155, width: 2, alpha: 0.5 });
  }
  g.circle(dx, dy, 10).fill({ color: 0x221133, alpha: 0.4 });
}

function paintMasterpiece(g: Graphics): void {
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const r = 30 + Math.random() * 30;
    g.circle(Math.cos(a) * r, Math.sin(a) * r, 3 + Math.random() * 4)
      .fill({ color: i % 2 === 0 ? 0x6633aa : 0x331155, alpha: 0.5 });
    g.moveTo(Math.cos(a) * r, Math.sin(a) * r)
      .lineTo(Math.cos(a) * r, Math.sin(a) * r + 8 + Math.random() * 10)
      .stroke({ color: 0x442266, width: 1.5, alpha: 0.3 });
  }
  g.circle(0, 0, 15).fill({ color: 0x110022, alpha: 0.4 });
}

// ─── Utility ─────────────────────────────────────────────────────

function hslToHex(h: number, s: number, l: number): number {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * c);
  };
  return (f(0) << 16) | (f(8) << 8) | f(4);
}

// ─── Skill VFX Registry ─────────────────────────────────────────

const SKILL_VFX: Record<string, { draw: (g: Graphics, x: number, y: number, tx: number, ty: number) => void; duration: number }> = {
  // Allomancy
  steel_push:        { draw: steelPush, duration: 0.4 },
  iron_pull:         { draw: ironPull, duration: 0.35 },
  pewter_strength:   { draw: (g) => pewterFlare(g), duration: 0.5 },
  tin_senses:        { draw: (g) => pewterFlare(g), duration: 0.5 },
  bronze_seeking:    { draw: (g) => pewterFlare(g), duration: 0.5 },
  atium_burn:        { draw: (g) => pewterFlare(g), duration: 0.5 },
  // Surgebinding
  windrunner_lashing:    { draw: (g) => windrunnerLash(g), duration: 0.6 },
  windrunner_adhesion:   { draw: (g) => windrunnerLash(g), duration: 0.6 },
  lightweaver_soulcast:  { draw: (g) => lightweaverIllusion(g), duration: 0.5 },
  lightweaver_transformation: { draw: (g) => lightweaverIllusion(g), duration: 0.5 },
  bondsmith_tension:     { draw: (g) => windrunnerLash(g), duration: 0.6 },
  edgedancer_abrasion:   { draw: (g) => windrunnerLash(g), duration: 0.6 },
  // Awakening
  awaken_garment:    { draw: (g) => awakenObject(g), duration: 0.6 },
  awaken_weapon:     { draw: (g) => awakenObject(g), duration: 0.6 },
  divine_breath:     { draw: (g) => divineBreath(g), duration: 0.8 },
  color_drain:       { draw: (g) => awakenObject(g), duration: 0.6 },
  // AonDor
  aon_rao:     { draw: (g) => aonRao(g), duration: 0.7 },
  aon_ashe:    { draw: (g) => aonRao(g), duration: 0.7 },
  aon_tia:     { draw: aonTia, duration: 0.4 },
  aon_ien:     { draw: (g) => aonRao(g), duration: 0.7 },
  // Sand Mastery
  sand_whip:   { draw: sandWhip, duration: 0.35 },
  sand_shield: { draw: (g) => sandStorm(g), duration: 0.7 },
  sand_swarm:  { draw: (g) => sandStorm(g), duration: 0.7 },
  sand_storm:  { draw: (g) => sandStorm(g), duration: 0.7 },
  // Nightmare Painting
  paint_capture:     { draw: paintCapture, duration: 0.5 },
  paint_banishment:  { draw: paintCapture, duration: 0.5 },
  paint_masterpiece: { draw: (g) => paintMasterpiece(g), duration: 0.8 },
  paint_barrier:     { draw: (g) => paintMasterpiece(g), duration: 0.8 },
};

/** Play a skill-specific VFX. Returns true if a specific animation was found. */
export function playSkillVFX(
  container: Container,
  skillID: string,
  casterX: number,
  casterY: number,
  targetX: number,
  targetY: number,
): boolean {
  const vfx = SKILL_VFX[skillID];
  if (!vfx) return false;
  spawnVFX(container, casterX, casterY, vfx.duration, (g) => {
    vfx.draw(g, casterX, casterY, targetX, targetY);
  });
  return true;
}

/** Get list of all skill IDs that have custom VFX */
export function getSkillsWithVFX(): string[] {
  return Object.keys(SKILL_VFX);
}
