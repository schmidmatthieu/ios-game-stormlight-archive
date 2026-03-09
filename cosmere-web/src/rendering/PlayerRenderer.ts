import { Graphics, Container } from 'pixi.js';
import type { ChampionClass } from '../data/types';
import { lighten, darken } from '../utils/ColorUtils';

// ─── Color Definitions ──────────────────────────────────────────

const CLASS_BODY_COLORS: Record<string, number> = {
  mistborn: 0x3366cc, radiant: 0x3399dd, awakener: 0x9933cc,
  elantrian: 0xdd8833, sandMaster: 0xcc9933, nightmarePainter: 0x663399,
};
const CLASS_CAPE_COLORS: Record<string, number> = {
  mistborn: 0x222244, radiant: 0x224466, awakener: 0x552288,
  elantrian: 0x885522, sandMaster: 0x665522, nightmarePainter: 0x331155,
};
const CLASS_WEAPON_COLORS: Record<string, number> = {
  mistborn: 0x8899aa, radiant: 0x88ccff, awakener: 0xcc88ff,
  elantrian: 0xffcc66, sandMaster: 0xddcc88, nightmarePainter: 0x8866cc,
};
const CLASS_HAIR_COLORS: Record<string, number> = {
  mistborn: 0x332211, radiant: 0x553322, awakener: 0x220033,
  elantrian: 0xcccccc, sandMaster: 0x997744, nightmarePainter: 0x111122,
};
const CLASS_SKIN_TONES: Record<string, number> = {
  mistborn: 0xeebb99, radiant: 0xddbb99, awakener: 0xddaa88,
  elantrian: 0xeeccaa, sandMaster: 0xcc9966, nightmarePainter: 0xccbb99,
};
/** Glow/aura colors per class for magical effects */
export const CLASS_GLOW_COLORS: Record<string, number> = {
  mistborn: 0x6688bb, radiant: 0x66ccff, awakener: 0xcc66ff,
  elantrian: 0xffcc44, sandMaster: 0xddcc88, nightmarePainter: 0x8844cc,
};

// ─── Multi-Part Player ──────────────────────────────────────────

/** References to individually animatable body parts */
export interface PlayerBodyParts {
  cape: Graphics;
  leftLeg: Graphics;
  rightLeg: Graphics;
  torso: Graphics;     // chest + belt + shoulders
  leftArm: Graphics;
  rightArm: Graphics;
  weapon: Graphics;
  head: Graphics;       // head + hair + eyes + headgear
}

/**
 * Build a multi-part player character inside the given container.
 * Each body part is a separate Graphics that can be independently transformed.
 * Returns references to each part for animation.
 */
export function buildPlayerCharacter(container: Container, cls: ChampionClass): PlayerBodyParts {
  // Clear existing children
  container.removeChildren();

  const bodyColor = CLASS_BODY_COLORS[cls] ?? 0x3366cc;
  const capeColor = CLASS_CAPE_COLORS[cls] ?? 0x222244;
  const weaponColor = CLASS_WEAPON_COLORS[cls] ?? 0x8899aa;
  const skinColor = CLASS_SKIN_TONES[cls] ?? 0xeebb99;
  const hairColor = CLASS_HAIR_COLORS[cls] ?? 0x443322;

  const glowColor = CLASS_GLOW_COLORS[cls] ?? 0x6688bb;

  // Cape (behind everything) — wider, more dramatic, with layered shading
  const cape = new Graphics();
  // Cape outline for depth
  cape.poly([
    { x: -9, y: -21 }, { x: -15, y: 7 }, { x: -11, y: 9 },
    { x: 0, y: 6 }, { x: 11, y: 9 }, { x: 15, y: 7 }, { x: 9, y: -21 },
  ]).fill({ color: darken(capeColor, 0.3), alpha: 0.4 });
  // Cape body
  cape.poly([
    { x: -8, y: -20 }, { x: -14, y: 6 }, { x: -10, y: 8 },
    { x: 0, y: 5 }, { x: 10, y: 8 }, { x: 14, y: 6 }, { x: 8, y: -20 },
  ]).fill({ color: capeColor, alpha: 0.92 });
  // Cape inner fold highlight (left fold — light source)
  cape.poly([
    { x: -5, y: -18 }, { x: -10, y: 6 }, { x: -7, y: 5 }, { x: -3, y: -16 },
  ]).fill({ color: lighten(capeColor, 0.28), alpha: 0.4 });
  // Cape right fold shadow
  cape.poly([
    { x: 3, y: -16 }, { x: 10, y: 6 }, { x: 7, y: 5 }, { x: 5, y: -15 },
  ]).fill({ color: darken(capeColor, 0.2), alpha: 0.25 });
  // Cape center fold crease
  cape.moveTo(0, -18).lineTo(0, 5).stroke({ color: darken(capeColor, 0.15), width: 0.6, alpha: 0.3 });
  // Cape edge trim — golden thread
  cape.poly([
    { x: -14, y: 6 }, { x: -10, y: 8 }, { x: 0, y: 5 }, { x: 10, y: 8 }, { x: 14, y: 6 },
  ]).stroke({ color: lighten(capeColor, 0.45), width: 1, alpha: 0.5 });
  // Cape edge inner glow
  cape.poly([
    { x: -13, y: 5 }, { x: -9, y: 7 }, { x: 0, y: 4 }, { x: 9, y: 7 }, { x: 13, y: 5 },
  ]).stroke({ color: lighten(capeColor, 0.3), width: 0.5, alpha: 0.2 });
  cape.pivot.set(0, -4);
  cape.position.set(0, -4);
  container.addChild(cape);

  // Left leg (thicker, with knee detail)
  const leftLeg = new Graphics();
  leftLeg.rect(-6, -10, 5, 9).fill({ color: 0x333344, alpha: 0.95 }); // leg
  leftLeg.rect(-6, -5, 5, 1).fill({ color: 0x2a2a3a, alpha: 0.5 }); // knee shadow
  leftLeg.roundRect(-7, -2, 6, 5, 2).fill({ color: 0x3a2a1a, alpha: 0.95 }); // boot
  leftLeg.roundRect(-6, -2, 3, 3, 1).fill({ color: 0x4a3a2a, alpha: 0.5 }); // boot highlight
  leftLeg.roundRect(-7, 2, 6, 1, 1).fill({ color: 0x2a1a0a, alpha: 0.6 }); // boot sole
  leftLeg.pivot.set(-3, -10);
  leftLeg.position.set(-3, -10);
  container.addChild(leftLeg);

  // Right leg (thicker, mirrored)
  const rightLeg = new Graphics();
  rightLeg.rect(1, -10, 5, 9).fill({ color: 0x333344, alpha: 0.95 });
  rightLeg.rect(1, -5, 5, 1).fill({ color: 0x2a2a3a, alpha: 0.5 }); // knee shadow
  rightLeg.roundRect(1, -2, 6, 5, 2).fill({ color: 0x3a2a1a, alpha: 0.95 });
  rightLeg.roundRect(2, -2, 3, 3, 1).fill({ color: 0x4a3a2a, alpha: 0.5 });
  rightLeg.roundRect(1, 2, 6, 1, 1).fill({ color: 0x2a1a0a, alpha: 0.6 });
  rightLeg.pivot.set(3, -10);
  rightLeg.position.set(3, -10);
  container.addChild(rightLeg);

  // Torso (belt + chest + shoulder pads — rich detail with volume shading)
  const torso = new Graphics();
  // Belt outline
  torso.rect(-9, -13, 18, 6).fill({ color: darken(0x554422, 0.3), alpha: 0.3 });
  // Belt with buckle
  torso.rect(-8, -12, 16, 4).fill({ color: 0x554422, alpha: 0.95 });
  torso.rect(-8, -12, 16, 1).fill({ color: 0x665533, alpha: 0.6 }); // belt highlight
  torso.rect(-8, -9, 16, 1).fill({ color: 0x443311, alpha: 0.3 }); // belt bottom shadow
  torso.roundRect(-2, -12, 4, 4, 1).fill({ color: 0xddaa33, alpha: 0.85 }); // buckle
  torso.rect(-1, -11, 2, 2).fill({ color: 0xeebb44, alpha: 0.7 }); // buckle center
  // Buckle shine
  torso.circle(-0.5, -10.5, 0.5).fill({ color: 0xffeedd, alpha: 0.4 });
  // Chest — trapezoid with outline
  const chestPts = [
    { x: -9, y: -12 }, { x: -10, y: -25 }, { x: 0, y: -27 },
    { x: 10, y: -25 }, { x: 9, y: -12 },
  ];
  // Chest outline for depth
  torso.poly(chestPts).stroke({ color: darken(bodyColor, 0.35), width: 1.2, alpha: 0.35 });
  // Chest body
  torso.poly(chestPts).fill({ color: bodyColor, alpha: 0.95 });
  // Chest center seam
  torso.moveTo(0, -27).lineTo(0, -12).stroke({ color: darken(bodyColor, 0.18), width: 0.8, alpha: 0.4 });
  // Chest left highlight (light source from top-left)
  torso.poly([
    { x: -5, y: -14 }, { x: -7, y: -23 }, { x: -1, y: -25 },
    { x: 1, y: -23 }, { x: 0, y: -14 },
  ]).fill({ color: lighten(bodyColor, 0.25), alpha: 0.38 });
  // Chest right shadow
  torso.poly([
    { x: 2, y: -14 }, { x: 3, y: -22 }, { x: 8, y: -23 },
    { x: 7, y: -14 },
  ]).fill({ color: darken(bodyColor, 0.18), alpha: 0.28 });
  // Chest bottom gradient shadow
  torso.poly([
    { x: -8, y: -14 }, { x: -7, y: -16 }, { x: 7, y: -16 },
    { x: 8, y: -14 },
  ]).fill({ color: darken(bodyColor, 0.22), alpha: 0.2 });
  // Shoulder pads — with volume and rim light
  torso.ellipse(-11, -24, 6.5, 4).fill({ color: darken(bodyColor, 0.1), alpha: 0.4 }); // shadow under
  torso.ellipse(-11, -24, 6, 3.5).fill({ color: lighten(bodyColor, 0.08), alpha: 0.95 });
  torso.ellipse(-11, -25, 4, 2).fill({ color: lighten(bodyColor, 0.22), alpha: 0.38 }); // highlight
  torso.ellipse(-11, -22, 5, 1.5).fill({ color: darken(bodyColor, 0.15), alpha: 0.2 }); // bottom shadow
  torso.ellipse(11, -24, 6.5, 4).fill({ color: darken(bodyColor, 0.1), alpha: 0.4 });
  torso.ellipse(11, -24, 6, 3.5).fill({ color: lighten(bodyColor, 0.08), alpha: 0.95 });
  torso.ellipse(11, -25, 4, 2).fill({ color: lighten(bodyColor, 0.18), alpha: 0.3 });
  torso.ellipse(11, -22, 5, 1.5).fill({ color: darken(bodyColor, 0.15), alpha: 0.2 });
  // Gold studs with shine
  torso.circle(-11, -24, 1.8).fill({ color: 0xddaa33, alpha: 0.85 });
  torso.circle(-11.3, -24.3, 0.6).fill({ color: 0xffeedd, alpha: 0.4 }); // stud shine
  torso.circle(11, -24, 1.8).fill({ color: 0xddaa33, alpha: 0.85 });
  torso.circle(10.7, -24.3, 0.6).fill({ color: 0xffeedd, alpha: 0.4 });
  // Neck with shadow
  torso.rect(-2.5, -29, 5, 4).fill({ color: skinColor, alpha: 0.95 });
  torso.rect(-2.5, -26, 5, 1).fill({ color: darken(skinColor, 0.12), alpha: 0.3 }); // neck shadow under chin
  container.addChild(torso);

  // Left arm (thicker with bracer)
  const leftArm = new Graphics();
  leftArm.rect(-14, -23, 5, 13).fill({ color: bodyColor, alpha: 0.9 });
  leftArm.rect(-14, -23, 5, 2).fill({ color: lighten(bodyColor, 0.15), alpha: 0.3 }); // sleeve top highlight
  leftArm.roundRect(-14, -11, 5, 4, 1).fill({ color: 0x443322, alpha: 0.95 }); // bracer/glove
  leftArm.rect(-14, -11, 5, 1).fill({ color: 0x554433, alpha: 0.5 }); // bracer highlight
  // Hand
  leftArm.circle(-11.5, -6.5, 2.5).fill({ color: skinColor, alpha: 0.9 });
  leftArm.pivot.set(-11.5, -23);
  leftArm.position.set(-11.5, -23);
  container.addChild(leftArm);

  // Right arm (thicker with bracer)
  const rightArm = new Graphics();
  rightArm.rect(9, -23, 5, 13).fill({ color: bodyColor, alpha: 0.9 });
  rightArm.rect(9, -23, 5, 2).fill({ color: lighten(bodyColor, 0.15), alpha: 0.3 });
  rightArm.roundRect(9, -11, 5, 4, 1).fill({ color: 0x443322, alpha: 0.95 });
  rightArm.rect(9, -11, 5, 1).fill({ color: 0x554433, alpha: 0.5 });
  // Hand
  rightArm.circle(11.5, -6.5, 2.5).fill({ color: skinColor, alpha: 0.9 });
  rightArm.pivot.set(11.5, -23);
  rightArm.position.set(11.5, -23);
  container.addChild(rightArm);

  // Weapon (attached to right arm)
  const weapon = new Graphics();
  drawWeapon(weapon, cls, weaponColor);
  weapon.pivot.set(11, -12);
  weapon.position.set(11, -12);
  container.addChild(weapon);

  // Head (bigger, with distinct features per class, volume shading)
  const head = new Graphics();
  // Head outline for depth
  head.circle(0, -33, 8).fill({ color: darken(skinColor, 0.25), alpha: 0.25 });
  // Head shape
  head.circle(0, -33, 7.5).fill({ color: skinColor, alpha: 0.95 });
  // Face highlight (top-left light source)
  head.ellipse(-2, -35, 4, 3.5).fill({ color: lighten(skinColor, 0.15), alpha: 0.25 });
  // Face shadow (right side)
  head.ellipse(3, -32, 3, 4).fill({ color: darken(skinColor, 0.1), alpha: 0.15 });
  // Ear hints with depth
  head.ellipse(-7.5, -33, 1.8, 2.8).fill({ color: darken(skinColor, 0.15), alpha: 0.5 });
  head.ellipse(-7, -33, 1.3, 2.2).fill({ color: darken(skinColor, 0.05), alpha: 0.6 });
  head.ellipse(7.5, -33, 1.8, 2.8).fill({ color: darken(skinColor, 0.15), alpha: 0.5 });
  head.ellipse(7, -33, 1.3, 2.2).fill({ color: darken(skinColor, 0.05), alpha: 0.6 });
  // Chin shadow
  head.ellipse(0, -28.5, 5, 2).fill({ color: darken(skinColor, 0.12), alpha: 0.2 });
  // Nose hint
  head.moveTo(0, -33).lineTo(0.5, -31).stroke({ color: darken(skinColor, 0.08), width: 0.5, alpha: 0.25 });
  head.circle(0.3, -31.2, 0.5).fill({ color: lighten(skinColor, 0.1), alpha: 0.2 }); // nose tip highlight
  // Hair — class-specific styles
  drawHair(head, cls, hairColor);
  // Eyebrows — thicker, more expressive
  head.moveTo(-4.5, -35).quadraticCurveTo(-3, -35.8, -1.5, -35.5)
    .stroke({ color: darken(hairColor, 0.2), width: 1.2, alpha: 0.7 });
  head.moveTo(1.5, -35.5).quadraticCurveTo(3, -35.8, 4.5, -35)
    .stroke({ color: darken(hairColor, 0.2), width: 1.2, alpha: 0.7 });
  // Eyes — larger with proper layering
  // Eye shadow socket
  head.ellipse(-2.8, -33.3, 2, 1.6).fill({ color: darken(skinColor, 0.15), alpha: 0.2 });
  head.ellipse(2.8, -33.3, 2, 1.6).fill({ color: darken(skinColor, 0.15), alpha: 0.2 });
  // Eye whites
  head.ellipse(-2.8, -33.5, 1.7, 1.4).fill({ color: 0xf5f0ee, alpha: 0.95 });
  head.ellipse(2.8, -33.5, 1.7, 1.4).fill({ color: 0xf5f0ee, alpha: 0.95 });
  // Iris
  head.circle(-2.8, -33.5, 1.1).fill({ color: 0x222244, alpha: 0.95 });
  head.circle(2.8, -33.5, 1.1).fill({ color: 0x222244, alpha: 0.95 });
  // Class-colored pupil with glow
  head.circle(-2.8, -33.5, 0.7).fill({ color: weaponColor, alpha: 0.85 });
  head.circle(2.8, -33.5, 0.7).fill({ color: weaponColor, alpha: 0.85 });
  // Pupil outer glow (subtle magic)
  head.circle(-2.8, -33.5, 1.3).fill({ color: glowColor, alpha: 0.08 });
  head.circle(2.8, -33.5, 1.3).fill({ color: glowColor, alpha: 0.08 });
  // Eye glints (two glints for realism)
  head.circle(-3.3, -34, 0.4).fill({ color: 0xffffff, alpha: 0.7 });
  head.circle(-2.5, -33.8, 0.2).fill({ color: 0xffffff, alpha: 0.4 });
  head.circle(2.3, -34, 0.4).fill({ color: 0xffffff, alpha: 0.7 });
  head.circle(3.1, -33.8, 0.2).fill({ color: 0xffffff, alpha: 0.4 });
  // Eyelid line
  head.ellipse(-2.8, -34.2, 1.6, 0.5).stroke({ color: darken(skinColor, 0.2), width: 0.4, alpha: 0.3 });
  head.ellipse(2.8, -34.2, 1.6, 0.5).stroke({ color: darken(skinColor, 0.2), width: 0.4, alpha: 0.3 });
  // Mouth — subtle smile/neutral
  head.moveTo(-1.5, -30.5).quadraticCurveTo(0, -30.2, 1.5, -30.5)
    .stroke({ color: darken(skinColor, 0.2), width: 0.6, alpha: 0.35 });
  // Lower lip highlight
  head.moveTo(-1, -30.2).quadraticCurveTo(0, -30, 1, -30.2)
    .stroke({ color: lighten(skinColor, 0.08), width: 0.4, alpha: 0.2 });
  // Headgear
  drawHeadgear(head, cls, glowColor);
  head.pivot.set(0, -30);
  head.position.set(0, -30);
  container.addChild(head);

  return { cape, leftLeg, rightLeg, torso, leftArm, rightArm, weapon, head };
}

// ─── Backward-Compatible Single-Graphics Draw ───────────────────

/** Draw entire player into a single Graphics (for compatibility / menu showcase) */
export function drawPlayerCharacter(g: Graphics, cls: ChampionClass): void {
  g.clear();
  const bodyColor = CLASS_BODY_COLORS[cls] ?? 0x3366cc;
  const capeColor = CLASS_CAPE_COLORS[cls] ?? 0x222244;
  const weaponColor = CLASS_WEAPON_COLORS[cls] ?? 0x8899aa;
  const skinColor = CLASS_SKIN_TONES[cls] ?? 0xeebb99;
  const hairColor = CLASS_HAIR_COLORS[cls] ?? 0x443322;

  // Cape
  g.poly([
    { x: -8, y: -20 }, { x: -14, y: 6 }, { x: -10, y: 8 },
    { x: 0, y: 5 }, { x: 10, y: 8 }, { x: 14, y: 6 }, { x: 8, y: -20 },
  ]).fill({ color: capeColor, alpha: 0.9 });
  g.poly([
    { x: -5, y: -18 }, { x: -10, y: 6 }, { x: -7, y: 5 }, { x: -3, y: -16 },
  ]).fill({ color: lighten(capeColor, 0.25), alpha: 0.35 });

  // Boots
  g.roundRect(-7, -2, 6, 5, 2).fill({ color: 0x3a2a1a, alpha: 0.95 });
  g.roundRect(1, -2, 6, 5, 2).fill({ color: 0x3a2a1a, alpha: 0.95 });
  g.roundRect(-6, -2, 3, 3, 1).fill({ color: 0x4a3a2a, alpha: 0.5 });

  // Legs
  g.rect(-6, -10, 5, 9).fill({ color: 0x333344, alpha: 0.95 });
  g.rect(1, -10, 5, 9).fill({ color: 0x333344, alpha: 0.95 });

  // Belt
  g.rect(-8, -12, 16, 4).fill({ color: 0x554422, alpha: 0.95 });
  g.roundRect(-2, -12, 4, 4, 1).fill({ color: 0xddaa33, alpha: 0.85 });

  // Chest
  g.poly([
    { x: -9, y: -12 }, { x: -10, y: -25 }, { x: 0, y: -27 },
    { x: 10, y: -25 }, { x: 9, y: -12 },
  ]).fill({ color: bodyColor, alpha: 0.95 });
  g.poly([
    { x: -5, y: -14 }, { x: -7, y: -23 }, { x: -1, y: -25 },
    { x: 1, y: -23 }, { x: 0, y: -14 },
  ]).fill({ color: lighten(bodyColor, 0.2), alpha: 0.35 });

  // Shoulders
  g.ellipse(-11, -24, 6, 3.5).fill({ color: lighten(bodyColor, 0.08), alpha: 0.95 });
  g.ellipse(11, -24, 6, 3.5).fill({ color: lighten(bodyColor, 0.08), alpha: 0.95 });
  g.circle(-11, -24, 1.5).fill({ color: 0xddaa33, alpha: 0.8 });
  g.circle(11, -24, 1.5).fill({ color: 0xddaa33, alpha: 0.8 });

  // Arms
  g.rect(-14, -23, 5, 13).fill({ color: bodyColor, alpha: 0.9 });
  g.rect(9, -23, 5, 13).fill({ color: bodyColor, alpha: 0.9 });
  g.roundRect(-14, -11, 5, 4, 1).fill({ color: 0x443322, alpha: 0.95 });
  g.roundRect(9, -11, 5, 4, 1).fill({ color: 0x443322, alpha: 0.95 });
  // Hands
  g.circle(-11.5, -6.5, 2.5).fill({ color: skinColor, alpha: 0.9 });
  g.circle(11.5, -6.5, 2.5).fill({ color: skinColor, alpha: 0.9 });

  // Weapon
  drawWeapon(g, cls, weaponColor);

  // Neck
  g.rect(-2.5, -29, 5, 4).fill({ color: skinColor, alpha: 0.95 });

  // Head
  g.circle(0, -33, 7.5).fill({ color: skinColor, alpha: 0.95 });
  // Hair
  drawHair(g, cls, hairColor);
  // Eyebrows
  g.moveTo(-4, -35).lineTo(-1.5, -35.5).stroke({ color: darken(hairColor, 0.2), width: 1, alpha: 0.7 });
  g.moveTo(1.5, -35.5).lineTo(4, -35).stroke({ color: darken(hairColor, 0.2), width: 1, alpha: 0.7 });
  // Eyes
  g.ellipse(-2.8, -33.5, 1.5, 1.3).fill(0xffffff);
  g.ellipse(2.8, -33.5, 1.5, 1.3).fill(0xffffff);
  g.circle(-2.8, -33.5, 1).fill(0x222244);
  g.circle(2.8, -33.5, 1).fill(0x222244);
  g.circle(-2.8, -33.5, 0.6).fill({ color: weaponColor, alpha: 0.8 });
  g.circle(2.8, -33.5, 0.6).fill({ color: weaponColor, alpha: 0.8 });
  g.circle(-3.2, -34, 0.3).fill({ color: 0xffffff, alpha: 0.6 });
  g.circle(2.4, -34, 0.3).fill({ color: 0xffffff, alpha: 0.6 });
  // Headgear
  drawHeadgear(g, cls, CLASS_GLOW_COLORS[cls] ?? 0x6688bb);
}

// ─── Hair Styles (per class) ─────────────────────────────────────

function drawHair(g: Graphics, cls: string, hairColor: number): void {
  switch (cls) {
    case 'mistborn':
      // Short messy hair, swept back — street urchin style
      g.poly([
        { x: -7, y: -34 }, { x: -8, y: -39 }, { x: -4, y: -42 },
        { x: 1, y: -42 }, { x: 6, y: -41 }, { x: 8, y: -36 }, { x: 6, y: -34 },
      ]).fill({ color: hairColor, alpha: 0.95 });
      // Messy strands
      g.moveTo(-6, -39).lineTo(-9, -42).stroke({ color: hairColor, width: 1.2, alpha: 0.7 });
      g.moveTo(5, -40).lineTo(7, -43).stroke({ color: hairColor, width: 1, alpha: 0.6 });
      break;
    case 'radiant':
      // Longer hair tied back with braid hint
      g.poly([
        { x: -7, y: -34 }, { x: -8, y: -40 }, { x: -3, y: -42 },
        { x: 3, y: -42 }, { x: 8, y: -40 }, { x: 7, y: -34 },
      ]).fill({ color: hairColor, alpha: 0.95 });
      // Braid falling back
      g.moveTo(0, -38).lineTo(2, -30).lineTo(1, -25).stroke({ color: hairColor, width: 2, alpha: 0.7 });
      g.moveTo(0, -34).lineTo(1, -28).stroke({ color: lighten(hairColor, 0.2), width: 1, alpha: 0.5 });
      break;
    case 'awakener':
      // Wild flowing hair with color streaks
      g.poly([
        { x: -7, y: -34 }, { x: -9, y: -40 }, { x: -5, y: -43 },
        { x: 2, y: -43 }, { x: 7, y: -41 }, { x: 8, y: -35 }, { x: 6, y: -34 },
      ]).fill({ color: hairColor, alpha: 0.95 });
      // Flowing side strand
      g.moveTo(-8, -37).lineTo(-10, -30).lineTo(-9, -26).stroke({ color: hairColor, width: 1.5, alpha: 0.8 });
      // Color streak
      g.moveTo(-3, -42).lineTo(-4, -35).stroke({ color: 0xcc66ff, width: 1, alpha: 0.5 });
      break;
    case 'elantrian':
      // Elegant silver-white hair, neatly styled
      g.poly([
        { x: -7, y: -34 }, { x: -7, y: -40 }, { x: -3, y: -42 },
        { x: 3, y: -42 }, { x: 7, y: -40 }, { x: 7, y: -34 },
      ]).fill({ color: hairColor, alpha: 0.95 });
      // Silver shine highlight
      g.poly([
        { x: -3, y: -41 }, { x: 0, y: -42 }, { x: 2, y: -41 }, { x: 1, y: -37 }, { x: -2, y: -37 },
      ]).fill({ color: 0xeeeeff, alpha: 0.3 });
      break;
    case 'sandMaster':
      // Short cropped hair with headwrap/turban hint
      g.poly([
        { x: -6, y: -34 }, { x: -6, y: -39 }, { x: -2, y: -41 },
        { x: 3, y: -41 }, { x: 6, y: -39 }, { x: 6, y: -34 },
      ]).fill({ color: hairColor, alpha: 0.95 });
      // Headwrap/band
      g.rect(-7, -37, 14, 3).fill({ color: 0xccaa66, alpha: 0.8 });
      g.rect(-7, -37, 14, 1).fill({ color: 0xddbb77, alpha: 0.4 });
      break;
    default: // nightmarePainter
      // Long dark hair, unkempt, covering one eye
      g.poly([
        { x: -7, y: -34 }, { x: -8, y: -40 }, { x: -4, y: -43 },
        { x: 3, y: -43 }, { x: 7, y: -40 }, { x: 7, y: -34 },
      ]).fill({ color: hairColor, alpha: 0.95 });
      // Long fringe covering left side
      g.poly([
        { x: -8, y: -38 }, { x: -6, y: -43 }, { x: -2, y: -42 },
        { x: -3, y: -32 }, { x: -7, y: -30 },
      ]).fill({ color: hairColor, alpha: 0.9 });
      break;
  }
}

// ─── Headgear ───────────────────────────────────────────────────

function drawHeadgear(g: Graphics, cls: string, glowColor = 0x6688bb): void {
  if (cls === 'radiant') {
    // Shardplate helm visor with reflection
    g.poly([
      { x: -6, y: -36 }, { x: 0, y: -37 }, { x: 6, y: -36 },
      { x: 7, y: -32 }, { x: -7, y: -32 },
    ]).fill({ color: 0x556688, alpha: 0.55 });
    // Visor reflection
    g.poly([
      { x: -4, y: -35.5 }, { x: 0, y: -36 }, { x: 3, y: -35.5 },
      { x: 2, y: -33 }, { x: -3, y: -33 },
    ]).fill({ color: 0x88bbdd, alpha: 0.15 });
    g.poly([
      { x: -6, y: -36 }, { x: 0, y: -37 }, { x: 6, y: -36 },
    ]).stroke({ color: 0x88aacc, width: 1, alpha: 0.65 });
    // Stormlight glow at visor edge
    g.poly([
      { x: -6, y: -36 }, { x: 0, y: -37 }, { x: 6, y: -36 },
    ]).stroke({ color: 0x88ccff, width: 2, alpha: 0.1 });
  } else if (cls === 'mistborn') {
    // Mistcloak hood with depth
    g.poly([
      { x: -8, y: -31 }, { x: -9, y: -40 }, { x: 0, y: -44 },
      { x: 9, y: -40 }, { x: 8, y: -31 },
    ]).fill({ color: 0x222233, alpha: 0.15 }); // hood interior shadow
    g.poly([
      { x: -8, y: -31 }, { x: -9, y: -40 }, { x: 0, y: -44 },
      { x: 9, y: -40 }, { x: 8, y: -31 },
    ]).stroke({ color: 0x445566, width: 1.5, alpha: 0.55 });
  } else if (cls === 'elantrian') {
    // Aon Dor halo — multi-layered glow
    g.circle(0, -38, 11).fill({ color: 0xffcc44, alpha: 0.03 }); // outer glow
    g.circle(0, -38, 9).stroke({ color: 0xffcc44, width: 1.5, alpha: 0.45 });
    g.circle(0, -38, 7).stroke({ color: 0xffdd66, width: 0.8, alpha: 0.25 });
    g.circle(0, -38, 5).stroke({ color: 0xffeebb, width: 0.3, alpha: 0.1 });
  } else if (cls === 'sandMaster') {
    // Sand wrap / goggles with lenses
    g.ellipse(-4, -37, 2.8, 1.7).fill({ color: 0x443322, alpha: 0.3 }); // lens interior
    g.ellipse(-4, -37, 2.5, 1.5).stroke({ color: 0x886644, width: 1, alpha: 0.65 });
    g.ellipse(-4, -37.2, 1.2, 0.7).fill({ color: 0xaa8855, alpha: 0.15 }); // lens reflection
    g.ellipse(4, -37, 2.8, 1.7).fill({ color: 0x443322, alpha: 0.3 });
    g.ellipse(4, -37, 2.5, 1.5).stroke({ color: 0x886644, width: 1, alpha: 0.65 });
    g.ellipse(4, -37.2, 1.2, 0.7).fill({ color: 0xaa8855, alpha: 0.15 });
    g.moveTo(-7, -37).lineTo(-4, -37).stroke({ color: 0x886644, width: 0.8, alpha: 0.5 });
    g.moveTo(4, -37).lineTo(7, -37).stroke({ color: 0x886644, width: 0.8, alpha: 0.5 });
  } else if (cls === 'nightmarePainter') {
    // Dark mask with subtle pattern
    g.poly([
      { x: -5, y: -35 }, { x: 0, y: -36 }, { x: 5, y: -35 },
      { x: 4, y: -30 }, { x: -4, y: -30 },
    ]).fill({ color: 0x222233, alpha: 0.6 });
    // Mask pattern lines
    g.moveTo(-3, -34).lineTo(-2, -31).stroke({ color: 0x332244, width: 0.4, alpha: 0.3 });
    g.moveTo(3, -34).lineTo(2, -31).stroke({ color: 0x332244, width: 0.4, alpha: 0.3 });
    // Nightmare glow from beneath mask
    g.poly([
      { x: -3, y: -33 }, { x: 0, y: -33.5 }, { x: 3, y: -33 },
    ]).stroke({ color: glowColor, width: 0.5, alpha: 0.2 });
  }
}

// ─── Weapons ────────────────────────────────────────────────────

function drawWeapon(g: Graphics, cls: string, weaponColor: number): void {
  switch (cls) {
    case 'mistborn': {
      // Dual glass daggers with edge glow
      const daggerPts = [{ x: 14, y: -14 }, { x: 15, y: -30 }, { x: 16, y: -14 }];
      g.poly(daggerPts).fill({ color: 0x445566, alpha: 0.85 });
      // Inner blade reflection
      g.poly([{ x: 14.5, y: -16 }, { x: 15, y: -28 }, { x: 15.3, y: -16 }])
        .fill({ color: 0x88aacc, alpha: 0.25 });
      g.poly(daggerPts).stroke({ color: 0x88aacc, width: 0.7, alpha: 0.65 });
      // Blade edge glow
      g.moveTo(14, -14).lineTo(15, -30).stroke({ color: 0xaaccee, width: 1.5, alpha: 0.12 });
      g.rect(13.5, -14, 3, 2.5).fill({ color: 0x664422, alpha: 0.9 });
      g.rect(13.5, -14, 3, 0.8).fill({ color: 0x886633, alpha: 0.4 }); // guard highlight
      // Left dagger
      g.poly([{ x: -14, y: -14 }, { x: -15, y: -26 }, { x: -16, y: -14 }]).fill({ color: 0x445566, alpha: 0.75 });
      g.poly([{ x: -14, y: -14 }, { x: -15, y: -26 }, { x: -16, y: -14 }]).stroke({ color: 0x88aacc, width: 0.5, alpha: 0.5 });
      g.rect(-16.5, -14, 3, 2.5).fill({ color: 0x664422, alpha: 0.9 });
      break;
    }
    case 'radiant': {
      // Shardblade — glowing blade with multi-layer glow
      const bladePts = [{ x: 14, y: -12 }, { x: 14, y: -40 }, { x: 16.5, y: -40 }, { x: 16.5, y: -12 }];
      // Outer glow
      g.rect(12.5, -40, 6, 30).fill({ color: 0x88ccff, alpha: 0.06 });
      // Blade body
      g.poly(bladePts).fill({ color: 0xaaddff, alpha: 0.8 });
      // Blade inner highlight
      g.rect(14.5, -38, 1, 24).fill({ color: 0xddeeff, alpha: 0.3 });
      // Edge glow
      g.poly(bladePts).stroke({ color: 0xcceeFF, width: 0.8, alpha: 0.85 });
      // Tip glow
      g.circle(15.25, -40, 2).fill({ color: 0x88ccff, alpha: 0.1 });
      // Crossguard with gem
      g.rect(12.5, -12, 5.5, 3.5).fill({ color: 0x5577aa, alpha: 0.9 });
      g.rect(12.5, -12, 5.5, 1).fill({ color: 0x7799cc, alpha: 0.3 }); // guard highlight
      g.circle(15.25, -10.5, 1).fill({ color: 0x88ccff, alpha: 0.5 }); // pommel gem
      g.circle(15.25, -10.5, 2).fill({ color: 0x88ccff, alpha: 0.08 }); // gem glow
      break;
    }
    case 'awakener': {
      // Staff with awakened ribbons and orb
      g.rect(14, -36, 2.5, 32).fill({ color: 0x664422, alpha: 0.85 });
      g.rect(14, -36, 1.2, 32).fill({ color: 0x886633, alpha: 0.2 }); // staff highlight
      // Orb with layered glow
      g.circle(15.25, -37, 5).fill({ color: 0xcc66ff, alpha: 0.08 }); // outer glow
      g.circle(15.25, -37, 3.8).fill({ color: 0xcc66ff, alpha: 0.65 });
      g.circle(15.25, -37, 2).fill({ color: 0xdd88ff, alpha: 0.35 }); // inner bright
      g.circle(15.25, -37, 3.8).stroke({ color: 0xdd88ff, width: 0.6, alpha: 0.75 });
      // Light glint on orb
      g.circle(14.5, -38, 0.8).fill({ color: 0xffffff, alpha: 0.3 });
      // Animated ribbons with glow
      g.moveTo(15, -34).quadraticCurveTo(18, -30, 21, -28).stroke({ color: 0xff4466, width: 1.3, alpha: 0.55 });
      g.moveTo(15, -34).quadraticCurveTo(18, -30, 21, -28).stroke({ color: 0xff4466, width: 3, alpha: 0.06 });
      g.moveTo(15, -32).quadraticCurveTo(19, -27, 22, -24).stroke({ color: 0x44aaff, width: 1.1, alpha: 0.5 });
      g.moveTo(15, -32).quadraticCurveTo(19, -27, 22, -24).stroke({ color: 0x44aaff, width: 3, alpha: 0.06 });
      g.moveTo(15, -30).quadraticCurveTo(17, -26, 19, -22).stroke({ color: 0x44ff66, width: 0.8, alpha: 0.35 });
      break;
    }
    case 'elantrian': {
      // Aon-marked staff with glowing glyphs
      g.rect(14, -34, 2.5, 28).fill({ color: 0xddbb66, alpha: 0.85 });
      g.rect(14, -34, 1, 28).fill({ color: 0xeedd88, alpha: 0.2 }); // staff highlight
      // Aon head orb — layered glow
      g.circle(15.25, -35, 6).fill({ color: 0xffcc44, alpha: 0.06 }); // outer glow
      g.circle(15.25, -35, 4.5).fill({ color: 0xffcc44, alpha: 0.5 });
      g.circle(15.25, -35, 2.8).fill({ color: 0xffdd66, alpha: 0.3 });
      g.circle(15.25, -35, 4.5).stroke({ color: 0xffdd66, width: 1, alpha: 0.7 });
      // Aon glyph — more detailed
      g.circle(15.25, -35, 2.2).stroke({ color: 0xffeebb, width: 0.6, alpha: 0.5 });
      g.moveTo(15.25, -37).lineTo(15.25, -33).stroke({ color: 0xffeebb, width: 0.4, alpha: 0.35 });
      g.moveTo(13.5, -35).lineTo(17, -35).stroke({ color: 0xffeebb, width: 0.4, alpha: 0.35 });
      // Glint
      g.circle(14.5, -36, 0.6).fill({ color: 0xffffff, alpha: 0.35 });
      break;
    }
    case 'sandMaster': {
      // Sand ribbon / qido with flowing trails
      g.ellipse(14, -14, 5, 6).fill({ color: 0xccbb88, alpha: 0.75 });
      g.ellipse(14, -14, 3, 4).fill({ color: 0xddcc99, alpha: 0.2 }); // inner highlight
      g.ellipse(14, -14, 5, 6).stroke({ color: 0xddcc99, width: 0.6, alpha: 0.5 });
      // Sand trails with glow
      g.moveTo(14, -18).quadraticCurveTo(16, -23, 18, -28)
        .stroke({ color: 0xddcc88, width: 1.5, alpha: 0.5 });
      g.moveTo(14, -18).quadraticCurveTo(16, -23, 18, -28)
        .stroke({ color: 0xddcc88, width: 3, alpha: 0.06 });
      g.moveTo(16, -20).quadraticCurveTo(18, -23, 20, -26)
        .stroke({ color: 0xccbb77, width: 1, alpha: 0.4 });
      g.moveTo(12, -17).quadraticCurveTo(10, -22, 11, -26)
        .stroke({ color: 0xccbb77, width: 0.8, alpha: 0.3 });
      break;
    }
    default: {
      // nightmarePainter — Brush with ink effects
      g.rect(14, -32, 2, 26).fill({ color: 0x443322, alpha: 0.85 });
      g.rect(14, -32, 0.8, 26).fill({ color: 0x665533, alpha: 0.2 }); // highlight
      g.roundRect(12, -35, 6, 5, 1.5).fill({ color: 0x1a1a22, alpha: 0.85 }); // brush head
      g.roundRect(12, -35, 3, 3, 0.8).fill({ color: 0x2a2a33, alpha: 0.3 }); // brush highlight
      // Ink drips with glow
      g.circle(15, -28, 1.2).fill({ color: 0x111133, alpha: 0.65 });
      g.circle(15, -28, 2).fill({ color: 0x221144, alpha: 0.08 }); // drip glow
      g.circle(14.5, -24, 0.8).fill({ color: 0x111133, alpha: 0.45 });
      g.circle(14, -20, 0.5).fill({ color: 0x111133, alpha: 0.3 });
      // Trailing ink smoke
      g.circle(16, -30, 1.5).fill({ color: 0x222244, alpha: 0.08 });
      break;
    }
  }
}
