// ─── Per-Ability Skill Animations ────────────────────────────────
// Specific visual effects for each named skill beyond generic class bursts

import { Container, Graphics } from 'pixi.js';
import type { MagicSystemType } from '../data/types';

interface SkillVFX {
  create: (container: Container, x: number, y: number, targetX: number, targetY: number) => void;
}

// ─── Allomancy Animations ────────────────────────────────────────

function steelPush(c: Container, x: number, y: number, tx: number, ty: number): void {
  const angle = Math.atan2(ty - y, tx - x);
  const g = new Graphics();
  // Blue force lines radiating outward
  for (let i = 0; i < 8; i++) {
    const a = angle + (i - 3.5) * 0.15;
    const len = 60 + Math.random() * 40;
    g.moveTo(0, 0).lineTo(Math.cos(a) * len, Math.sin(a) * len)
      .stroke({ color: 0x4488ff, width: 2 - i * 0.1, alpha: 0.6 });
    // Metal fragment at end
    const sz = 2 + Math.random() * 3;
    g.rect(Math.cos(a) * len - sz / 2, Math.sin(a) * len - sz / 2, sz, sz)
      .fill({ color: 0x88aacc, alpha: 0.7 });
  }
  // Shockwave ring at origin
  g.circle(0, 0, 15).stroke({ color: 0x6699ff, width: 3, alpha: 0.4 });
  g.x = x; g.y = y; g.zIndex = 100000;
  c.addChild(g);
  animateFade(g, 0.4);
}

function ironPull(c: Container, x: number, y: number, tx: number, ty: number): void {
  const angle = Math.atan2(y - ty, x - tx);
  const dist = Math.hypot(tx - x, ty - y);
  const g = new Graphics();
  // Red pull lines converging inward
  for (let i = 0; i < 6; i++) {
    const a = angle + (i - 2.5) * 0.2;
    const startDist = Math.min(dist, 80);
    g.moveTo(Math.cos(a) * startDist, Math.sin(a) * startDist)
      .lineTo(0, 0)
      .stroke({ color: 0xff4444, width: 1.5, alpha: 0.5 });
  }
  // Convergence point glow
  g.circle(0, 0, 8).fill({ color: 0xff6644, alpha: 0.3 });
  g.circle(0, 0, 4).fill({ color: 0xff8866, alpha: 0.5 });
  g.x = x; g.y = y; g.zIndex = 100000;
  c.addChild(g);
  animateFade(g, 0.35);
}

function pewterFlare(c: Container, x: number, y: number): void {
  const g = new Graphics();
  // Orange strength aura
  g.circle(0, 0, 20).fill({ color: 0xff8844, alpha: 0.15 });
  g.circle(0, 0, 14).stroke({ color: 0xffaa66, width: 2, alpha: 0.4 });
  // Muscle-like energy lines
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    g.moveTo(0, 0).lineTo(Math.cos(a) * 18, Math.sin(a) * 18)
      .stroke({ color: 0xffcc88, width: 3, alpha: 0.3 });
  }
  g.x = x; g.y = y; g.zIndex = 100000;
  c.addChild(g);
  animateFade(g, 0.5);
}

// ─── Surgebinding Animations ─────────────────────────────────────

function windrunnerLash(c: Container, x: number, y: number, tx: number, ty: number): void {
  const g = new Graphics();
  // Stormlight trails spiraling upward
  for (let i = 0; i < 10; i++) {
    const t = i / 10;
    const angle = t * Math.PI * 4;
    const radius = 5 + t * 25;
    const px = Math.cos(angle) * radius;
    const py = -t * 40 + Math.sin(angle) * 5;
    g.circle(px, py, 2 - t).fill({ color: 0x88ccff, alpha: 0.6 - t * 0.4 });
  }
  // Gravity distortion ring
  g.ellipse(0, 0, 30, 12).stroke({ color: 0x44aaff, width: 2, alpha: 0.3 });
  g.x = x; g.y = y; g.zIndex = 100000;
  c.addChild(g);
  animateFade(g, 0.6);
}

function lightweaverIllusion(c: Container, x: number, y: number): void {
  const g = new Graphics();
  // Prismatic shimmer
  const colors = [0xff4444, 0xff8844, 0xffff44, 0x44ff44, 0x4488ff, 0x8844ff];
  for (let i = 0; i < colors.length; i++) {
    const a = (i / colors.length) * Math.PI * 2;
    const r = 20 + Math.random() * 10;
    g.circle(Math.cos(a) * r, Math.sin(a) * r, 4).fill({ color: colors[i], alpha: 0.3 });
    g.moveTo(0, 0).lineTo(Math.cos(a) * r, Math.sin(a) * r)
      .stroke({ color: colors[i], width: 1, alpha: 0.2 });
  }
  // Central light burst
  g.circle(0, 0, 10).fill({ color: 0xffffff, alpha: 0.25 });
  g.x = x; g.y = y; g.zIndex = 100000;
  c.addChild(g);
  animateFade(g, 0.5);
}

// ─── Awakening Animations ────────────────────────────────────────

function awakenObject(c: Container, x: number, y: number): void {
  const g = new Graphics();
  // Rainbow color tendrils extending from caster
  const hueColors = [0xff4466, 0xff8844, 0xffcc44, 0x44cc66, 0x4488ff, 0x8844ff];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const len = 30 + Math.random() * 20;
    // Wavy tendril
    for (let j = 0; j < 5; j++) {
      const t = j / 5;
      const cx = Math.cos(a) * len * t + Math.sin(a + t * 3) * 5;
      const cy = Math.sin(a) * len * t + Math.cos(a + t * 3) * 5;
      g.circle(cx, cy, 2 - t).fill({ color: hueColors[i], alpha: 0.5 - t * 0.3 });
    }
  }
  // Breath symbol — pulsing circle
  g.circle(0, 0, 12).stroke({ color: 0xcc88ff, width: 2, alpha: 0.4 });
  g.circle(0, 0, 6).fill({ color: 0xee99ff, alpha: 0.3 });
  g.x = x; g.y = y; g.zIndex = 100000;
  c.addChild(g);
  animateFade(g, 0.6);
}

function divineBreath(c: Container, x: number, y: number): void {
  const g = new Graphics();
  // Massive color explosion
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2;
    const r = 40 + Math.random() * 30;
    const hue = Math.floor(i / 20 * 360);
    const color = hslToHex(hue, 80, 60);
    g.moveTo(0, 0).lineTo(Math.cos(a) * r, Math.sin(a) * r)
      .stroke({ color, width: 2, alpha: 0.4 });
    g.circle(Math.cos(a) * r, Math.sin(a) * r, 3).fill({ color, alpha: 0.5 });
  }
  // Inner white nova
  g.circle(0, 0, 20).fill({ color: 0xffffff, alpha: 0.2 });
  g.x = x; g.y = y; g.zIndex = 100000;
  c.addChild(g);
  animateFade(g, 0.8);
}

// ─── AonDor Animations ──────────────────────────────────────────

function aonRao(c: Container, x: number, y: number): void {
  const g = new Graphics();
  // Glowing Aon glyph pattern
  g.circle(0, 0, 25).stroke({ color: 0xffcc44, width: 2, alpha: 0.5 });
  // Cross-hatched inner pattern
  for (let i = -2; i <= 2; i++) {
    g.moveTo(i * 8, -20).lineTo(i * 8, 20).stroke({ color: 0xffaa33, width: 1, alpha: 0.3 });
    g.moveTo(-20, i * 8).lineTo(20, i * 8).stroke({ color: 0xffaa33, width: 1, alpha: 0.3 });
  }
  // Corner dots (Aon-style embellishments)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    g.circle(Math.cos(a) * 22, Math.sin(a) * 22, 2).fill({ color: 0xffdd66, alpha: 0.6 });
  }
  g.x = x; g.y = y; g.zIndex = 100000;
  c.addChild(g);
  animateFade(g, 0.7);
}

function aonTia(c: Container, x: number, y: number, tx: number, ty: number): void {
  const g = new Graphics();
  // Teleport flash at origin
  g.circle(0, 0, 15).fill({ color: 0xffcc44, alpha: 0.4 });
  g.circle(0, 0, 15).stroke({ color: 0xffee88, width: 2, alpha: 0.6 });
  // Destination marker
  const dx = tx - x, dy = ty - y;
  g.circle(dx, dy, 12).fill({ color: 0xffcc44, alpha: 0.3 });
  g.circle(dx, dy, 12).stroke({ color: 0xffee88, width: 1.5, alpha: 0.5 });
  // Connecting line
  g.moveTo(0, 0).lineTo(dx, dy).stroke({ color: 0xffaa33, width: 1, alpha: 0.2 });
  g.x = x; g.y = y; g.zIndex = 100000;
  c.addChild(g);
  animateFade(g, 0.4);
}

// ─── Sand Mastery Animations ─────────────────────────────────────

function sandWhip(c: Container, x: number, y: number, tx: number, ty: number): void {
  const angle = Math.atan2(ty - y, tx - x);
  const g = new Graphics();
  // Sand trail following whip path
  const len = Math.min(80, Math.hypot(tx - x, ty - y));
  for (let i = 0; i < 15; i++) {
    const t = i / 15;
    const px = Math.cos(angle) * len * t + Math.sin(angle * 3 + t * 5) * 8 * t;
    const py = Math.sin(angle) * len * t + Math.cos(angle * 3 + t * 5) * 8 * t;
    const sz = 3 - t * 2;
    g.circle(px, py, sz).fill({ color: 0xddcc88, alpha: 0.6 - t * 0.4 });
  }
  g.x = x; g.y = y; g.zIndex = 100000;
  c.addChild(g);
  animateFade(g, 0.35);
}

function sandStorm(c: Container, x: number, y: number): void {
  const g = new Graphics();
  // Massive sand vortex
  for (let ring = 0; ring < 4; ring++) {
    const r = 15 + ring * 15;
    g.circle(0, 0, r).stroke({ color: 0xddaa55, width: 2 - ring * 0.3, alpha: 0.3 - ring * 0.05 });
    // Sand grains along ring
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + ring * 0.3;
      g.rect(Math.cos(a) * r - 1, Math.sin(a) * r - 1, 2, 2)
        .fill({ color: 0xeecc66, alpha: 0.5 });
    }
  }
  g.x = x; g.y = y; g.zIndex = 100000;
  c.addChild(g);
  animateFade(g, 0.7);
}

// ─── Nightmare Painting Animations ───────────────────────────────

function paintCapture(c: Container, x: number, y: number, tx: number, ty: number): void {
  const g = new Graphics();
  // Dark ink tendrils reaching toward target
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
  // Ink splash at target
  g.circle(dx, dy, 10).fill({ color: 0x221133, alpha: 0.4 });
  g.x = x; g.y = y; g.zIndex = 100000;
  c.addChild(g);
  animateFade(g, 0.5);
}

function paintMasterpiece(c: Container, x: number, y: number): void {
  const g = new Graphics();
  // Massive ink explosion with paint splatters
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const r = 30 + Math.random() * 30;
    // Ink splatter blobs
    g.circle(Math.cos(a) * r, Math.sin(a) * r, 3 + Math.random() * 4)
      .fill({ color: i % 2 === 0 ? 0x6633aa : 0x331155, alpha: 0.5 });
    // Trailing drips
    g.moveTo(Math.cos(a) * r, Math.sin(a) * r)
      .lineTo(Math.cos(a) * r, Math.sin(a) * r + 8 + Math.random() * 10)
      .stroke({ color: 0x442266, width: 1.5, alpha: 0.3 });
  }
  // Central darkness
  g.circle(0, 0, 15).fill({ color: 0x110022, alpha: 0.4 });
  g.x = x; g.y = y; g.zIndex = 100000;
  c.addChild(g);
  animateFade(g, 0.8);
}

// ─── Utility ─────────────────────────────────────────────────────

function animateFade(g: Graphics, duration: number): void {
  let elapsed = 0;
  let last = performance.now();
  const tick = () => {
    const now = performance.now();
    elapsed += (now - last) / 1000;
    last = now;
    const p = elapsed / duration;
    g.alpha = Math.max(0, 1 - p);
    g.scale.set(0.5 + p * 0.6);
    if (elapsed < duration) requestAnimationFrame(tick);
    else g.destroy();
  };
  requestAnimationFrame(tick);
}

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

const SKILL_VFX: Record<string, SkillVFX> = {
  // Allomancy
  steel_push:        { create: steelPush },
  iron_pull:         { create: ironPull },
  pewter_strength:   { create: (c, x, y) => pewterFlare(c, x, y) },
  tin_senses:        { create: (c, x, y) => pewterFlare(c, x, y) },
  bronze_seeking:    { create: (c, x, y) => pewterFlare(c, x, y) },
  atium_burn:        { create: (c, x, y) => pewterFlare(c, x, y) },
  // Surgebinding
  windrunner_lashing:    { create: windrunnerLash },
  windrunner_adhesion:   { create: windrunnerLash },
  lightweaver_soulcast:  { create: (c, x, y) => lightweaverIllusion(c, x, y) },
  lightweaver_transformation: { create: (c, x, y) => lightweaverIllusion(c, x, y) },
  bondsmith_tension:     { create: (c, x, y) => windrunnerLash(c, x, y, x, y - 50) },
  edgedancer_abrasion:   { create: (c, x, y) => windrunnerLash(c, x, y, x + 30, y) },
  // Awakening
  awaken_garment:    { create: (c, x, y) => awakenObject(c, x, y) },
  awaken_weapon:     { create: (c, x, y) => awakenObject(c, x, y) },
  divine_breath:     { create: (c, x, y) => divineBreath(c, x, y) },
  color_drain:       { create: (c, x, y) => awakenObject(c, x, y) },
  // AonDor
  aon_rao:     { create: (c, x, y) => aonRao(c, x, y) },
  aon_ashe:    { create: (c, x, y) => aonRao(c, x, y) },
  aon_tia:     { create: aonTia },
  aon_ien:     { create: (c, x, y) => aonRao(c, x, y) },
  // Sand Mastery
  sand_whip:   { create: sandWhip },
  sand_shield: { create: (c, x, y) => sandStorm(c, x, y) },
  sand_swarm:  { create: (c, x, y) => sandStorm(c, x, y) },
  sand_storm:  { create: (c, x, y) => sandStorm(c, x, y) },
  // Nightmare Painting
  paint_capture:     { create: paintCapture },
  paint_banishment:  { create: paintCapture },
  paint_masterpiece: { create: (c, x, y) => paintMasterpiece(c, x, y) },
  paint_barrier:     { create: (c, x, y) => paintMasterpiece(c, x, y) },
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
  vfx.create(container, casterX, casterY, targetX, targetY);
  return true;
}

/** Get list of all skill IDs that have custom VFX */
export function getSkillsWithVFX(): string[] {
  return Object.keys(SKILL_VFX);
}
