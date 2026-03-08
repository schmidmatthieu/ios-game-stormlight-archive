import { Graphics, Container } from 'pixi.js';
import type { ChampionClass } from '../data/types';
import { lighten } from '../utils/ColorUtils';

// ─── Color Definitions ──────────────────────────────────────────

const CLASS_BODY_COLORS: Record<string, number> = {
  mistborn: 0x3366cc, radiant: 0x3399dd, awakener: 0x9933cc,
  elantrian: 0xdd8833, sandMaster: 0xcc9933, nightmarePainter: 0x663399,
};
const CLASS_CAPE_COLORS: Record<string, number> = {
  mistborn: 0x222233, radiant: 0x224466, awakener: 0x552288,
  elantrian: 0x885522, sandMaster: 0x665522, nightmarePainter: 0x331155,
};
const CLASS_WEAPON_COLORS: Record<string, number> = {
  mistborn: 0x8899aa, radiant: 0x88ccff, awakener: 0xcc88ff,
  elantrian: 0xffcc66, sandMaster: 0xddcc88, nightmarePainter: 0x8866cc,
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
  const capeColor = CLASS_CAPE_COLORS[cls] ?? 0x222233;
  const weaponColor = CLASS_WEAPON_COLORS[cls] ?? 0x8899aa;

  // Cape (behind everything)
  const cape = new Graphics();
  cape.poly([
    { x: -7, y: -18 }, { x: -12, y: 4 }, { x: -8, y: 6 },
    { x: 0, y: 4 }, { x: 8, y: 6 }, { x: 12, y: 4 }, { x: 7, y: -18 },
  ]).fill({ color: capeColor, alpha: 0.85 });
  cape.poly([
    { x: -5, y: -16 }, { x: -9, y: 4 }, { x: -6, y: 4 }, { x: -3, y: -16 },
  ]).fill({ color: lighten(capeColor, 0.3), alpha: 0.3 });
  cape.pivot.set(0, -4);  // Pivot at cape top for sway
  cape.position.set(0, -4);
  container.addChild(cape);

  // Left leg (boot + leg)
  const leftLeg = new Graphics();
  leftLeg.rect(-5, -10, 4, 8).fill({ color: 0x333344, alpha: 0.9 }); // leg
  leftLeg.roundRect(-6, -3, 5, 5, 1).fill({ color: 0x3a2a1a, alpha: 0.9 }); // boot
  leftLeg.roundRect(-5, -3, 2, 3, 1).fill({ color: 0x4a3a2a, alpha: 0.5 }); // boot highlight
  leftLeg.pivot.set(-3, -10); // Pivot at hip joint
  leftLeg.position.set(-3, -10);
  container.addChild(leftLeg);

  // Right leg (boot + leg)
  const rightLeg = new Graphics();
  rightLeg.rect(1, -10, 4, 8).fill({ color: 0x333344, alpha: 0.9 }); // leg
  rightLeg.roundRect(1, -3, 5, 5, 1).fill({ color: 0x3a2a1a, alpha: 0.9 }); // boot
  rightLeg.pivot.set(3, -10); // Pivot at hip joint
  rightLeg.position.set(3, -10);
  container.addChild(rightLeg);

  // Torso (belt + chest + shoulder pads)
  const torso = new Graphics();
  // Belt
  torso.rect(-7, -12, 14, 3).fill({ color: 0x554422, alpha: 0.9 });
  torso.rect(-1.5, -12, 3, 3).fill({ color: 0xddaa33, alpha: 0.8 });
  // Chest
  torso.poly([
    { x: -8, y: -12 }, { x: -9, y: -24 }, { x: 0, y: -26 },
    { x: 9, y: -24 }, { x: 8, y: -12 },
  ]).fill({ color: bodyColor, alpha: 0.9 });
  // Chest highlight
  torso.poly([
    { x: -4, y: -14 }, { x: -5, y: -22 }, { x: 0, y: -24 },
    { x: 3, y: -22 }, { x: 2, y: -14 },
  ]).fill({ color: lighten(bodyColor, 0.25), alpha: 0.4 });
  // Shoulder pads
  torso.ellipse(-10, -23, 5, 3).fill({ color: lighten(bodyColor, 0.1), alpha: 0.9 });
  torso.ellipse(10, -23, 5, 3).fill({ color: lighten(bodyColor, 0.1), alpha: 0.9 });
  torso.circle(-10, -23, 1).fill({ color: 0xddaa33, alpha: 0.7 });
  torso.circle(10, -23, 1).fill({ color: 0xddaa33, alpha: 0.7 });
  // Neck
  torso.rect(-2, -28, 4, 3).fill({ color: 0xddaa88, alpha: 0.9 });
  // Class aura (subtle glow at base)
  torso.circle(0, -20, 18).fill({ color: bodyColor, alpha: 0.05 });
  torso.circle(0, -20, 12).fill({ color: weaponColor, alpha: 0.04 });
  container.addChild(torso);

  // Left arm
  const leftArm = new Graphics();
  leftArm.rect(-13, -22, 4, 12).fill({ color: bodyColor, alpha: 0.85 });
  leftArm.rect(-13, -11, 4, 3).fill({ color: 0x443322, alpha: 0.9 }); // glove
  // Hand
  leftArm.circle(-11, -8, 1.5).fill({ color: 0xddaa88, alpha: 0.8 });
  leftArm.pivot.set(-11, -22); // Pivot at shoulder
  leftArm.position.set(-11, -22);
  container.addChild(leftArm);

  // Right arm
  const rightArm = new Graphics();
  rightArm.rect(9, -22, 4, 12).fill({ color: bodyColor, alpha: 0.85 });
  rightArm.rect(9, -11, 4, 3).fill({ color: 0x443322, alpha: 0.9 }); // glove
  // Hand
  rightArm.circle(11, -8, 1.5).fill({ color: 0xddaa88, alpha: 0.8 });
  rightArm.pivot.set(11, -22); // Pivot at shoulder
  rightArm.position.set(11, -22);
  container.addChild(rightArm);

  // Weapon (attached to right arm)
  const weapon = new Graphics();
  drawWeapon(weapon, cls, weaponColor);
  weapon.pivot.set(11, -12); // Pivot at grip point
  weapon.position.set(11, -12);
  container.addChild(weapon);

  // Head (head + hair + eyes + headgear)
  const head = new Graphics();
  // Head shape
  head.circle(0, -32, 6.5).fill({ color: 0xeebb99, alpha: 0.95 });
  // Hair
  const hairColor = cls === 'nightmarePainter' ? 0x111122 : cls === 'elantrian' ? 0xcccccc : 0x443322;
  head.poly([
    { x: -6, y: -33 }, { x: -7, y: -38 }, { x: -3, y: -40 },
    { x: 2, y: -40 }, { x: 6, y: -39 }, { x: 7, y: -34 }, { x: 5, y: -33 },
  ]).fill({ color: hairColor, alpha: 0.9 });
  // Eyes
  head.circle(-2.5, -32, 1.2).fill(0x222244);
  head.circle(2.5, -32, 1.2).fill(0x222244);
  head.circle(-2.5, -32, 0.6).fill({ color: weaponColor, alpha: 0.6 });
  head.circle(2.5, -32, 0.6).fill({ color: weaponColor, alpha: 0.6 });
  // Headgear
  drawHeadgear(head, cls);
  head.pivot.set(0, -30); // Pivot at neck
  head.position.set(0, -30);
  container.addChild(head);

  return { cape, leftLeg, rightLeg, torso, leftArm, rightArm, weapon, head };
}

// ─── Backward-Compatible Single-Graphics Draw ───────────────────

/** Draw entire player into a single Graphics (for compatibility) */
export function drawPlayerCharacter(g: Graphics, cls: ChampionClass): void {
  g.clear();
  const bodyColor = CLASS_BODY_COLORS[cls] ?? 0x3366cc;
  const capeColor = CLASS_CAPE_COLORS[cls] ?? 0x222233;
  const weaponColor = CLASS_WEAPON_COLORS[cls] ?? 0x8899aa;

  // Cape
  g.poly([
    { x: -7, y: -18 }, { x: -12, y: 4 }, { x: -8, y: 6 },
    { x: 0, y: 4 }, { x: 8, y: 6 }, { x: 12, y: 4 }, { x: 7, y: -18 },
  ]).fill({ color: capeColor, alpha: 0.85 });
  g.poly([
    { x: -5, y: -16 }, { x: -9, y: 4 }, { x: -6, y: 4 }, { x: -3, y: -16 },
  ]).fill({ color: lighten(capeColor, 0.3), alpha: 0.3 });

  // Boots
  g.roundRect(-6, -3, 5, 5, 1).fill({ color: 0x3a2a1a, alpha: 0.9 });
  g.roundRect(1, -3, 5, 5, 1).fill({ color: 0x3a2a1a, alpha: 0.9 });
  g.roundRect(-5, -3, 2, 3, 1).fill({ color: 0x4a3a2a, alpha: 0.5 });

  // Legs
  g.rect(-5, -10, 4, 8).fill({ color: 0x333344, alpha: 0.9 });
  g.rect(1, -10, 4, 8).fill({ color: 0x333344, alpha: 0.9 });

  // Belt
  g.rect(-7, -12, 14, 3).fill({ color: 0x554422, alpha: 0.9 });
  g.rect(-1.5, -12, 3, 3).fill({ color: 0xddaa33, alpha: 0.8 });

  // Chest
  g.poly([
    { x: -8, y: -12 }, { x: -9, y: -24 }, { x: 0, y: -26 },
    { x: 9, y: -24 }, { x: 8, y: -12 },
  ]).fill({ color: bodyColor, alpha: 0.9 });
  g.poly([
    { x: -4, y: -14 }, { x: -5, y: -22 }, { x: 0, y: -24 },
    { x: 3, y: -22 }, { x: 2, y: -14 },
  ]).fill({ color: lighten(bodyColor, 0.25), alpha: 0.4 });

  // Shoulders
  g.ellipse(-10, -23, 5, 3).fill({ color: lighten(bodyColor, 0.1), alpha: 0.9 });
  g.ellipse(10, -23, 5, 3).fill({ color: lighten(bodyColor, 0.1), alpha: 0.9 });
  g.circle(-10, -23, 1).fill({ color: 0xddaa33, alpha: 0.7 });
  g.circle(10, -23, 1).fill({ color: 0xddaa33, alpha: 0.7 });

  // Arms
  g.rect(-13, -22, 4, 12).fill({ color: bodyColor, alpha: 0.85 });
  g.rect(9, -22, 4, 12).fill({ color: bodyColor, alpha: 0.85 });
  g.rect(-13, -11, 4, 3).fill({ color: 0x443322, alpha: 0.9 });
  g.rect(9, -11, 4, 3).fill({ color: 0x443322, alpha: 0.9 });

  // Weapon
  drawWeapon(g, cls, weaponColor);

  // Neck
  g.rect(-2, -28, 4, 3).fill({ color: 0xddaa88, alpha: 0.9 });

  // Head
  g.circle(0, -32, 6.5).fill({ color: 0xeebb99, alpha: 0.95 });

  // Hair
  const hairColor = cls === 'nightmarePainter' ? 0x111122 : cls === 'elantrian' ? 0xcccccc : 0x443322;
  g.poly([
    { x: -6, y: -33 }, { x: -7, y: -38 }, { x: -3, y: -40 },
    { x: 2, y: -40 }, { x: 6, y: -39 }, { x: 7, y: -34 }, { x: 5, y: -33 },
  ]).fill({ color: hairColor, alpha: 0.9 });

  // Eyes
  g.circle(-2.5, -32, 1.2).fill(0x222244);
  g.circle(2.5, -32, 1.2).fill(0x222244);
  g.circle(-2.5, -32, 0.6).fill({ color: weaponColor, alpha: 0.6 });
  g.circle(2.5, -32, 0.6).fill({ color: weaponColor, alpha: 0.6 });

  // Headgear
  drawHeadgear(g, cls);

  // Class aura
  g.circle(0, -20, 18).fill({ color: bodyColor, alpha: 0.05 });
  g.circle(0, -20, 12).fill({ color: weaponColor, alpha: 0.04 });
}

// ─── Headgear ───────────────────────────────────────────────────

function drawHeadgear(g: Graphics, cls: string): void {
  if (cls === 'radiant') {
    g.poly([
      { x: -5, y: -35 }, { x: 0, y: -36 }, { x: 5, y: -35 },
      { x: 6, y: -31 }, { x: -6, y: -31 },
    ]).fill({ color: 0x556688, alpha: 0.4 });
  } else if (cls === 'mistborn') {
    g.poly([
      { x: -7, y: -30 }, { x: -8, y: -38 }, { x: 0, y: -42 },
      { x: 8, y: -38 }, { x: 7, y: -30 },
    ]).stroke({ color: 0x334455, width: 1.5, alpha: 0.6 });
  } else if (cls === 'elantrian') {
    g.circle(0, -38, 8).stroke({ color: 0xffcc44, width: 1, alpha: 0.35 });
  } else if (cls === 'sandMaster') {
    g.poly([
      { x: -6, y: -34 }, { x: -5, y: -40 }, { x: 0, y: -42 },
      { x: 5, y: -40 }, { x: 6, y: -34 },
    ]).fill({ color: 0xccaa66, alpha: 0.7 });
  } else if (cls === 'nightmarePainter') {
    g.poly([
      { x: -5, y: -35 }, { x: 0, y: -36 }, { x: 5, y: -35 },
      { x: 4, y: -29 }, { x: -4, y: -29 },
    ]).fill({ color: 0x222233, alpha: 0.5 });
  }
}

// ─── Weapons ────────────────────────────────────────────────────

function drawWeapon(g: Graphics, cls: string, _weaponColor: number): void {
  switch (cls) {
    case 'mistborn':
      g.poly([{ x: 14, y: -14 }, { x: 15, y: -28 }, { x: 16, y: -14 }]).fill({ color: 0x445566, alpha: 0.8 });
      g.poly([{ x: 14, y: -14 }, { x: 15, y: -28 }, { x: 16, y: -14 }]).stroke({ color: 0x88aacc, width: 0.5, alpha: 0.5 });
      g.poly([{ x: -14, y: -14 }, { x: -15, y: -24 }, { x: -16, y: -14 }]).fill({ color: 0x445566, alpha: 0.7 });
      break;
    case 'radiant':
      g.poly([{ x: 14, y: -12 }, { x: 14.5, y: -36 }, { x: 16, y: -36 }, { x: 16.5, y: -12 }]).fill({ color: 0xaaddff, alpha: 0.7 });
      g.poly([{ x: 14, y: -12 }, { x: 14.5, y: -36 }, { x: 16, y: -36 }, { x: 16.5, y: -12 }]).stroke({ color: 0xcceeFF, width: 0.5, alpha: 0.8 });
      g.rect(13, -34, 5, 22).fill({ color: 0x88ccff, alpha: 0.06 });
      break;
    case 'awakener':
      g.rect(14, -32, 2, 28).fill({ color: 0x664422, alpha: 0.8 });
      g.circle(15, -33, 3).fill({ color: 0xcc66ff, alpha: 0.6 });
      g.moveTo(15, -30).lineTo(20, -26).stroke({ color: 0xff4466, width: 1, alpha: 0.5 });
      g.moveTo(15, -28).lineTo(20, -24).stroke({ color: 0x44aaff, width: 1, alpha: 0.5 });
      break;
    case 'elantrian':
      g.rect(14, -30, 2, 24).fill({ color: 0xddbb66, alpha: 0.8 });
      g.circle(15, -31, 4).fill({ color: 0xffcc44, alpha: 0.4 });
      g.circle(15, -31, 4).stroke({ color: 0xffdd66, width: 1, alpha: 0.6 });
      break;
    case 'sandMaster':
      g.ellipse(14, -14, 4, 5).fill({ color: 0xccbb88, alpha: 0.7 });
      g.moveTo(14, -18).lineTo(18, -26).stroke({ color: 0xddcc88, width: 1.5, alpha: 0.4 });
      break;
    default: // nightmarePainter
      g.rect(14, -28, 1.5, 22).fill({ color: 0x443322, alpha: 0.8 });
      g.rect(13, -30, 4, 4).fill({ color: 0x222222, alpha: 0.7 });
      g.circle(15, -6, 1.5).fill({ color: 0x111122, alpha: 0.5 });
      break;
  }
}
