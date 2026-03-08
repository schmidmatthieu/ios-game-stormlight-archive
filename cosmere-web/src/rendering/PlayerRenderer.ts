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

  // Cape (behind everything) — wider, more dramatic
  const cape = new Graphics();
  cape.poly([
    { x: -8, y: -20 }, { x: -14, y: 6 }, { x: -10, y: 8 },
    { x: 0, y: 5 }, { x: 10, y: 8 }, { x: 14, y: 6 }, { x: 8, y: -20 },
  ]).fill({ color: capeColor, alpha: 0.9 });
  // Cape inner fold highlight
  cape.poly([
    { x: -5, y: -18 }, { x: -10, y: 6 }, { x: -7, y: 5 }, { x: -3, y: -16 },
  ]).fill({ color: lighten(capeColor, 0.25), alpha: 0.35 });
  // Cape edge trim
  cape.poly([
    { x: -14, y: 6 }, { x: -10, y: 8 }, { x: 0, y: 5 }, { x: 10, y: 8 }, { x: 14, y: 6 },
  ]).stroke({ color: lighten(capeColor, 0.4), width: 0.8, alpha: 0.5 });
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

  // Torso (belt + chest + shoulder pads — more detail)
  const torso = new Graphics();
  // Belt with buckle
  torso.rect(-8, -12, 16, 4).fill({ color: 0x554422, alpha: 0.95 });
  torso.rect(-8, -12, 16, 1).fill({ color: 0x665533, alpha: 0.6 }); // belt highlight
  torso.roundRect(-2, -12, 4, 4, 1).fill({ color: 0xddaa33, alpha: 0.85 }); // buckle
  torso.rect(-1, -11, 2, 2).fill({ color: 0xeebb44, alpha: 0.7 }); // buckle center
  // Chest — trapezoid shape
  torso.poly([
    { x: -9, y: -12 }, { x: -10, y: -25 }, { x: 0, y: -27 },
    { x: 10, y: -25 }, { x: 9, y: -12 },
  ]).fill({ color: bodyColor, alpha: 0.95 });
  // Chest center seam
  torso.moveTo(0, -27).lineTo(0, -12).stroke({ color: darken(bodyColor, 0.15), width: 0.8, alpha: 0.4 });
  // Chest highlight (left side light)
  torso.poly([
    { x: -5, y: -14 }, { x: -7, y: -23 }, { x: -1, y: -25 },
    { x: 1, y: -23 }, { x: 0, y: -14 },
  ]).fill({ color: lighten(bodyColor, 0.2), alpha: 0.35 });
  // Chest shadow (right side)
  torso.poly([
    { x: 2, y: -14 }, { x: 3, y: -22 }, { x: 8, y: -23 },
    { x: 7, y: -14 },
  ]).fill({ color: darken(bodyColor, 0.15), alpha: 0.25 });
  // Shoulder pads — rounder with edge highlight
  torso.ellipse(-11, -24, 6, 3.5).fill({ color: lighten(bodyColor, 0.08), alpha: 0.95 });
  torso.ellipse(11, -24, 6, 3.5).fill({ color: lighten(bodyColor, 0.08), alpha: 0.95 });
  torso.ellipse(-11, -25, 4, 2).fill({ color: lighten(bodyColor, 0.2), alpha: 0.35 }); // pad highlight
  torso.ellipse(11, -25, 4, 2).fill({ color: lighten(bodyColor, 0.2), alpha: 0.35 });
  torso.circle(-11, -24, 1.5).fill({ color: 0xddaa33, alpha: 0.8 }); // gold stud
  torso.circle(11, -24, 1.5).fill({ color: 0xddaa33, alpha: 0.8 });
  // Neck
  torso.rect(-2.5, -29, 5, 4).fill({ color: skinColor, alpha: 0.95 });
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

  // Head (bigger, with distinct features per class)
  const head = new Graphics();
  // Head shape — slightly larger
  head.circle(0, -33, 7.5).fill({ color: skinColor, alpha: 0.95 });
  // Ear hints
  head.ellipse(-7, -33, 1.5, 2.5).fill({ color: darken(skinColor, 0.1), alpha: 0.7 });
  head.ellipse(7, -33, 1.5, 2.5).fill({ color: darken(skinColor, 0.1), alpha: 0.7 });
  // Face shadow (lower jaw)
  head.ellipse(0, -29, 5, 2).fill({ color: darken(skinColor, 0.1), alpha: 0.2 });
  // Hair — class-specific styles
  drawHair(head, cls, hairColor);
  // Eyebrows
  head.moveTo(-4, -35).lineTo(-1.5, -35.5).stroke({ color: darken(hairColor, 0.2), width: 1, alpha: 0.7 });
  head.moveTo(1.5, -35.5).lineTo(4, -35).stroke({ color: darken(hairColor, 0.2), width: 1, alpha: 0.7 });
  // Eyes — larger, more visible
  head.ellipse(-2.8, -33.5, 1.5, 1.3).fill(0xffffff); // eye white
  head.ellipse(2.8, -33.5, 1.5, 1.3).fill(0xffffff);
  head.circle(-2.8, -33.5, 1).fill(0x222244); // iris
  head.circle(2.8, -33.5, 1).fill(0x222244);
  head.circle(-2.8, -33.5, 0.6).fill({ color: weaponColor, alpha: 0.8 }); // class-colored pupil
  head.circle(2.8, -33.5, 0.6).fill({ color: weaponColor, alpha: 0.8 });
  head.circle(-3.2, -34, 0.3).fill({ color: 0xffffff, alpha: 0.6 }); // eye glint
  head.circle(2.4, -34, 0.3).fill({ color: 0xffffff, alpha: 0.6 });
  // Mouth hint
  head.moveTo(-1.5, -30.5).lineTo(1.5, -30.5).stroke({ color: darken(skinColor, 0.2), width: 0.6, alpha: 0.4 });
  // Headgear
  drawHeadgear(head, cls);
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
  drawHeadgear(g, cls);
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

function drawHeadgear(g: Graphics, cls: string): void {
  if (cls === 'radiant') {
    // Shardplate helm visor
    g.poly([
      { x: -6, y: -36 }, { x: 0, y: -37 }, { x: 6, y: -36 },
      { x: 7, y: -32 }, { x: -7, y: -32 },
    ]).fill({ color: 0x556688, alpha: 0.5 });
    g.poly([
      { x: -6, y: -36 }, { x: 0, y: -37 }, { x: 6, y: -36 },
    ]).stroke({ color: 0x88aacc, width: 0.8, alpha: 0.6 });
  } else if (cls === 'mistborn') {
    // Mistcloak hood outline
    g.poly([
      { x: -8, y: -31 }, { x: -9, y: -40 }, { x: 0, y: -44 },
      { x: 9, y: -40 }, { x: 8, y: -31 },
    ]).stroke({ color: 0x445566, width: 1.5, alpha: 0.5 });
  } else if (cls === 'elantrian') {
    // Aon Dor halo
    g.circle(0, -38, 9).stroke({ color: 0xffcc44, width: 1.2, alpha: 0.4 });
    g.circle(0, -38, 7).stroke({ color: 0xffdd66, width: 0.6, alpha: 0.2 });
  } else if (cls === 'sandMaster') {
    // Sand wrap / goggles on forehead
    g.ellipse(-4, -37, 2.5, 1.5).stroke({ color: 0x886644, width: 1, alpha: 0.6 });
    g.ellipse(4, -37, 2.5, 1.5).stroke({ color: 0x886644, width: 1, alpha: 0.6 });
    g.moveTo(-7, -37).lineTo(-4, -37).stroke({ color: 0x886644, width: 0.8, alpha: 0.5 });
    g.moveTo(4, -37).lineTo(7, -37).stroke({ color: 0x886644, width: 0.8, alpha: 0.5 });
  } else if (cls === 'nightmarePainter') {
    // Dark mask / face covering
    g.poly([
      { x: -5, y: -35 }, { x: 0, y: -36 }, { x: 5, y: -35 },
      { x: 4, y: -30 }, { x: -4, y: -30 },
    ]).fill({ color: 0x222233, alpha: 0.55 });
  }
}

// ─── Weapons ────────────────────────────────────────────────────

function drawWeapon(g: Graphics, cls: string, weaponColor: number): void {
  switch (cls) {
    case 'mistborn':
      // Dual daggers — glass daggers (obsidian)
      g.poly([{ x: 14, y: -14 }, { x: 15, y: -30 }, { x: 16, y: -14 }]).fill({ color: 0x445566, alpha: 0.85 });
      g.poly([{ x: 14, y: -14 }, { x: 15, y: -30 }, { x: 16, y: -14 }]).stroke({ color: 0x88aacc, width: 0.6, alpha: 0.6 });
      g.rect(13.5, -14, 3, 2).fill({ color: 0x664422, alpha: 0.9 }); // guard
      g.poly([{ x: -14, y: -14 }, { x: -15, y: -26 }, { x: -16, y: -14 }]).fill({ color: 0x445566, alpha: 0.75 });
      g.rect(-16.5, -14, 3, 2).fill({ color: 0x664422, alpha: 0.9 });
      break;
    case 'radiant':
      // Shardblade — glowing blade
      g.poly([{ x: 14, y: -12 }, { x: 14, y: -38 }, { x: 16.5, y: -38 }, { x: 16.5, y: -12 }]).fill({ color: 0xaaddff, alpha: 0.75 });
      g.poly([{ x: 14, y: -12 }, { x: 14, y: -38 }, { x: 16.5, y: -38 }, { x: 16.5, y: -12 }]).stroke({ color: 0xcceeFF, width: 0.6, alpha: 0.8 });
      g.rect(13, -12, 4.5, 3).fill({ color: 0x5577aa, alpha: 0.9 }); // crossguard
      // Glow effect
      g.rect(13, -36, 4.5, 24).fill({ color: 0x88ccff, alpha: 0.08 });
      break;
    case 'awakener':
      // Staff with awakened ribbons
      g.rect(14, -34, 2.5, 30).fill({ color: 0x664422, alpha: 0.85 });
      g.circle(15.25, -35, 3.5).fill({ color: 0xcc66ff, alpha: 0.65 });
      g.circle(15.25, -35, 3.5).stroke({ color: 0xdd88ff, width: 0.5, alpha: 0.7 });
      // Floating ribbons
      g.moveTo(15, -32).lineTo(20, -28).stroke({ color: 0xff4466, width: 1.2, alpha: 0.5 });
      g.moveTo(15, -30).lineTo(21, -25).stroke({ color: 0x44aaff, width: 1, alpha: 0.45 });
      break;
    case 'elantrian':
      // Aon-marked staff
      g.rect(14, -32, 2.5, 26).fill({ color: 0xddbb66, alpha: 0.85 });
      g.circle(15.25, -33, 4.5).fill({ color: 0xffcc44, alpha: 0.45 });
      g.circle(15.25, -33, 4.5).stroke({ color: 0xffdd66, width: 1, alpha: 0.65 });
      // Aon glyph hint
      g.circle(15.25, -33, 2).stroke({ color: 0xffffff, width: 0.5, alpha: 0.4 });
      break;
    case 'sandMaster':
      // Sand ribbon / qido
      g.ellipse(14, -14, 4.5, 5.5).fill({ color: 0xccbb88, alpha: 0.75 });
      g.ellipse(14, -14, 4.5, 5.5).stroke({ color: 0xddcc99, width: 0.5, alpha: 0.5 });
      g.moveTo(14, -18).lineTo(18, -28).stroke({ color: 0xddcc88, width: 1.5, alpha: 0.45 });
      g.moveTo(16, -20).lineTo(20, -26).stroke({ color: 0xccbb77, width: 1, alpha: 0.35 });
      break;
    default: // nightmarePainter
      // Painter's brush
      g.rect(14, -30, 2, 24).fill({ color: 0x443322, alpha: 0.85 });
      g.roundRect(12.5, -33, 5, 5, 1).fill({ color: 0x222222, alpha: 0.8 }); // brush head
      // Ink drip
      g.circle(15, -28, 1).fill({ color: 0x111133, alpha: 0.6 });
      g.circle(14.5, -25, 0.7).fill({ color: 0x111133, alpha: 0.4 });
      break;
  }
}
