// ─── Environmental Interactions: Puzzles, Traps, Interactive Objects ───
// Adds non-combat zone content: pressure plates, levers, traps, breakables
// Levers link to: obelisks, hidden chests, trap disablers, secret passages

import { Container, Graphics } from 'pixi.js';
import { isoToScreen, seededRandom } from '../scenes/IsoUtils';
import { darken, lighten } from '../utils/ColorUtils';
import type { GridPosition, WorldID } from '../data/types';

// ─── Types ───────────────────────────────────────────────────────

export type InteractionType = 'lever' | 'pressurePlate' | 'spikeTrap' | 'poisonVent' | 'breakable' | 'pushBlock' | 'obelisk' | 'hiddenChest' | 'trapDisabler' | 'secretDoor';

export type LinkedAction = 'activate_obelisk' | 'reveal_chest' | 'disable_traps' | 'open_passage';

export interface EnvironmentObject {
  id: string;
  type: InteractionType;
  position: GridPosition;
  worldID: WorldID;
  activated: boolean;
  linkedID: string | null;
  linkedAction: LinkedAction | null;
  damage: number;
  cooldown: number;
  cooldownTimer: number;
  lootOnBreak: string | null;
  sprite: Container;
  hidden: boolean;
}

// ─── Colors per world ────────────────────────────────────────────

const WORLD_TRAP_COLORS: Record<string, { primary: number; accent: number; glow: number }> = {
  scadrial:  { primary: 0x555566, accent: 0xcc4444, glow: 0xff6644 },
  roshar:    { primary: 0x6688aa, accent: 0x88ccff, glow: 0xaaddff },
  taldain:   { primary: 0xccbb88, accent: 0xffdd44, glow: 0xffee88 },
  komashi:   { primary: 0x443366, accent: 0xaa55cc, glow: 0xcc88ff },
  nalthis:   { primary: 0x55aa77, accent: 0xcc88ff, glow: 0xee99ff },
  sel:       { primary: 0x887744, accent: 0xffcc44, glow: 0xffdd88 },
  shadesmar: { primary: 0x334455, accent: 0x88aaff, glow: 0xaaccff },
};

function getColors(worldID: string) {
  return WORLD_TRAP_COLORS[worldID] ?? { primary: 0x666666, accent: 0xffaa00, glow: 0xffcc44 };
}

// ─── Shadow helper ──────────────────────────────────────────────

function drawShadow(g: Graphics, x: number, y: number, rx: number, ry: number): void {
  g.ellipse(x + 1, y + 3, rx * 1.1, ry * 1.1).fill({ color: 0x000000, alpha: 0.06 });
  g.ellipse(x, y + 2, rx, ry).fill({ color: 0x000000, alpha: 0.14 });
}

// ─── Rendering ───────────────────────────────────────────────────

export function createEnvironmentSprite(obj: EnvironmentObject): Container {
  const c = new Container();
  const colors = getColors(obj.worldID);
  const g = new Graphics();

  switch (obj.type) {
    case 'lever':
      drawLever(g, obj, colors);
      break;
    case 'pressurePlate':
      drawPressurePlate(g, obj, colors);
      break;
    case 'spikeTrap':
      drawSpikeTrap(g, obj, colors);
      break;
    case 'poisonVent':
      drawPoisonVent(g, obj, colors);
      break;
    case 'breakable':
      drawBreakable(g, obj, colors);
      break;
    case 'pushBlock':
      drawPushBlock(g, obj, colors);
      break;
    case 'obelisk':
      drawObelisk(g, obj, colors);
      break;
    case 'hiddenChest':
      drawHiddenChest(g, obj, colors);
      break;
    case 'trapDisabler':
      drawTrapDisabler(g, obj, colors);
      break;
    case 'secretDoor':
      drawSecretDoor(g, obj, colors);
      break;
  }

  c.addChild(g);
  const pos = isoToScreen(obj.position.col, obj.position.row);
  c.x = pos.x;
  c.y = pos.y;
  if (obj.hidden) c.alpha = 0;
  return c;
}

// ─── Lever (3D isometric with base, pillar, handle) ─────────────

function drawLever(g: Graphics, obj: EnvironmentObject, colors: { primary: number; accent: number; glow: number }): void {
  const activated = obj.activated;

  // Ground shadow
  drawShadow(g, 0, 2, 12, 5);

  // Stone base platform (isometric diamond)
  g.poly([
    { x: 0, y: 4 }, { x: 14, y: -2 }, { x: 0, y: -8 }, { x: -14, y: -2 },
  ]).fill({ color: darken(colors.primary, 0.15), alpha: 0.85 });
  // Base top face
  g.poly([
    { x: 0, y: -2 }, { x: 12, y: -7 }, { x: 0, y: -12 }, { x: -12, y: -7 },
  ]).fill({ color: colors.primary, alpha: 0.9 });
  // Base edge highlight
  g.moveTo(-14, -2).lineTo(0, -8).stroke({ color: lighten(colors.primary, 0.2), width: 0.6, alpha: 0.4 });

  // Metal bracket (holds lever arm)
  g.rect(-3, -14, 6, 6).fill({ color: darken(colors.primary, 0.25), alpha: 0.8 });
  g.rect(-2, -13, 4, 4).fill({ color: darken(colors.primary, 0.1), alpha: 0.7 });

  // Lever arm
  const angle = activated ? -1.0 : 0.6;
  const armLen = 16;
  const tipX = Math.cos(angle) * armLen;
  const tipY = -11 - Math.sin(angle) * armLen;

  // Arm shaft
  g.moveTo(0, -11).lineTo(tipX, tipY)
    .stroke({ color: darken(colors.accent, 0.1), width: 3.5, alpha: 0.9 });
  g.moveTo(0, -11).lineTo(tipX, tipY)
    .stroke({ color: colors.accent, width: 2, alpha: 0.85 });

  // Knob at end
  g.circle(tipX, tipY, 3.5).fill({ color: colors.accent, alpha: 0.9 });
  g.circle(tipX - 0.5, tipY - 0.5, 1.5).fill({ color: lighten(colors.accent, 0.3), alpha: 0.4 });

  // Pivot bolt
  g.circle(0, -11, 2).fill({ color: darken(colors.primary, 0.3), alpha: 0.8 });
  g.circle(-0.3, -11.3, 0.8).fill({ color: lighten(colors.primary, 0.15), alpha: 0.3 });

  // Activation glow
  if (activated) {
    g.circle(0, -11, 8).fill({ color: colors.glow, alpha: 0.08 });
    g.circle(0, -11, 14).fill({ color: colors.glow, alpha: 0.04 });
    // Rune on base
    g.circle(0, -7, 2).fill({ color: colors.glow, alpha: 0.3 });
  }

  // Linked action indicator (small icon showing what it controls)
  if (obj.linkedAction && !activated) {
    drawLinkedHint(g, obj.linkedAction, colors);
  }
}

// ─── Linked Action Hint (small icon above lever) ────────────────

function drawLinkedHint(g: Graphics, action: LinkedAction, colors: { primary: number; accent: number; glow: number }): void {
  const y = -32;
  // Subtle pulsing dot
  g.circle(0, y, 3).fill({ color: colors.glow, alpha: 0.2 });
  g.circle(0, y, 6).fill({ color: colors.glow, alpha: 0.05 });

  switch (action) {
    case 'activate_obelisk':
      // Small pillar icon
      g.rect(-1.5, y - 5, 3, 5).fill({ color: colors.accent, alpha: 0.35 });
      break;
    case 'reveal_chest':
      // Small chest icon
      g.roundRect(-3, y - 3, 6, 4, 1).fill({ color: 0xddaa33, alpha: 0.35 });
      break;
    case 'disable_traps':
      // Small cross (cancel) icon
      g.moveTo(-2, y - 4).lineTo(2, y).stroke({ color: 0xff4444, width: 1, alpha: 0.35 });
      g.moveTo(2, y - 4).lineTo(-2, y).stroke({ color: 0xff4444, width: 1, alpha: 0.35 });
      break;
    case 'open_passage':
      // Small door icon
      g.roundRect(-2, y - 5, 4, 5, 1).fill({ color: 0x886633, alpha: 0.35 });
      break;
  }
}

// ─── Pressure Plate ─────────────────────────────────────────────

function drawPressurePlate(g: Graphics, obj: EnvironmentObject, colors: { primary: number; accent: number; glow: number }): void {
  const pressed = obj.activated;
  const depth = pressed ? 1 : 4;

  drawShadow(g, 0, 2, 14, 6);

  // Recessed floor slot
  g.poly([
    { x: 0, y: 5 }, { x: 16, y: -1 }, { x: 0, y: -7 }, { x: -16, y: -1 },
  ]).fill({ color: 0x222222, alpha: 0.3 });

  // Plate body
  g.poly([
    { x: 0, y: depth }, { x: 14, y: depth - 6 }, { x: 0, y: depth - 12 }, { x: -14, y: depth - 6 },
  ]).fill({ color: colors.primary, alpha: 0.85 });

  // Top face
  g.poly([
    { x: 0, y: depth - 3 }, { x: 12, y: depth - 8 }, { x: 0, y: depth - 13 }, { x: -12, y: depth - 8 },
  ]).fill({ color: lighten(colors.primary, 0.1), alpha: 0.8 });

  // Center rune
  g.circle(0, depth - 8, 3).fill({ color: colors.accent, alpha: pressed ? 0.6 : 0.15 });
  if (pressed) {
    g.circle(0, depth - 8, 7).fill({ color: colors.glow, alpha: 0.08 });
  }

  // Edge rivets
  g.circle(-8, depth - 5, 1).fill({ color: darken(colors.primary, 0.2), alpha: 0.5 });
  g.circle(8, depth - 5, 1).fill({ color: darken(colors.primary, 0.2), alpha: 0.5 });
  g.circle(0, depth - 11, 1).fill({ color: darken(colors.primary, 0.2), alpha: 0.5 });
  g.circle(0, depth - 1, 1).fill({ color: darken(colors.primary, 0.2), alpha: 0.5 });
}

// ─── Spike Trap ─────────────────────────────────────────────────

function drawSpikeTrap(g: Graphics, obj: EnvironmentObject, colors: { primary: number; accent: number; glow: number }): void {
  // Floor grate
  g.poly([
    { x: 0, y: 4 }, { x: 16, y: -2 }, { x: 0, y: -8 }, { x: -16, y: -2 },
  ]).fill({ color: darken(colors.primary, 0.2), alpha: 0.5 });

  // Grate lines
  for (let i = -2; i <= 2; i++) {
    g.moveTo(i * 5 - 3, -2 + Math.abs(i)).lineTo(i * 5 + 3, -4 - Math.abs(i))
      .stroke({ color: darken(colors.primary, 0.3), width: 0.8, alpha: 0.4 });
  }

  if (obj.activated) {
    // Spikes erupting
    for (let i = -2; i <= 2; i++) {
      const sx = i * 5;
      const sBase = -2;
      g.poly([
        { x: sx - 1.5, y: sBase }, { x: sx, y: sBase - 14 }, { x: sx + 1.5, y: sBase },
      ]).fill({ color: colors.accent, alpha: 0.85 });
      // Spike highlight
      g.moveTo(sx - 0.5, sBase).lineTo(sx, sBase - 12)
        .stroke({ color: lighten(colors.accent, 0.3), width: 0.5, alpha: 0.4 });
    }
    // Blood/damage glow
    g.ellipse(0, -2, 10, 4).fill({ color: 0xff2200, alpha: 0.06 });
  }
}

// ─── Poison Vent ────────────────────────────────────────────────

function drawPoisonVent(g: Graphics, obj: EnvironmentObject, colors: { primary: number; accent: number; glow: number }): void {
  drawShadow(g, 0, 2, 10, 4);

  // Metal vent ring
  g.circle(0, 0, 10).fill({ color: darken(colors.primary, 0.1), alpha: 0.6 });
  g.circle(0, 0, 8).fill({ color: darken(colors.primary, 0.2), alpha: 0.5 });
  g.circle(0, 0, 10).stroke({ color: darken(colors.primary, 0.3), width: 1, alpha: 0.4 });

  // Inner grate
  g.circle(0, 0, 5).fill({ color: 0x111111, alpha: 0.5 });
  g.moveTo(-4, 0).lineTo(4, 0).stroke({ color: 0x333333, width: 0.6, alpha: 0.4 });
  g.moveTo(0, -4).lineTo(0, 4).stroke({ color: 0x333333, width: 0.6, alpha: 0.4 });

  if (obj.activated) {
    // Gas cloud
    g.circle(0, -3, 8).fill({ color: 0x44cc44, alpha: 0.25 });
    g.circle(-2, -6, 6).fill({ color: 0x66dd66, alpha: 0.15 });
    g.circle(3, -8, 5).fill({ color: 0x44cc44, alpha: 0.1 });
    g.circle(-1, -12, 4).fill({ color: 0x88ee88, alpha: 0.06 });
    // Toxic glow on ground
    g.circle(0, 0, 12).fill({ color: 0x44cc44, alpha: 0.06 });
  } else {
    // Dormant gas hint
    g.circle(0, -1, 4).fill({ color: 0x44cc44, alpha: 0.08 });
  }
}

// ─── Breakable (detailed crate with wood grain) ─────────────────

function drawBreakable(g: Graphics, obj: EnvironmentObject, colors: { primary: number; accent: number; glow: number }): void {
  if (obj.activated) {
    // Broken debris
    drawShadow(g, 0, 1, 10, 4);
    g.poly([{ x: -6, y: 0 }, { x: -8, y: -4 }, { x: -3, y: -3 }])
      .fill({ color: colors.primary, alpha: 0.5 });
    g.poly([{ x: 2, y: 1 }, { x: 5, y: -5 }, { x: 8, y: -1 }])
      .fill({ color: darken(colors.primary, 0.1), alpha: 0.45 });
    g.poly([{ x: -1, y: -2 }, { x: 1, y: -7 }, { x: 3, y: -3 }])
      .fill({ color: lighten(colors.primary, 0.05), alpha: 0.4 });
    // Scattered planks
    g.moveTo(-5, 2).lineTo(-9, -2).stroke({ color: darken(colors.primary, 0.15), width: 1.5, alpha: 0.4 });
    g.moveTo(4, 3).lineTo(7, -1).stroke({ color: darken(colors.primary, 0.15), width: 1.5, alpha: 0.35 });
    return;
  }

  drawShadow(g, 0, 3, 12, 5);

  // Crate body — front face
  g.rect(-10, -18, 20, 20).fill({ color: colors.primary, alpha: 0.85 });
  // Side face (isometric right)
  g.poly([
    { x: 10, y: -18 }, { x: 16, y: -15 }, { x: 16, y: 5 }, { x: 10, y: 2 },
  ]).fill({ color: darken(colors.primary, 0.2), alpha: 0.8 });
  // Top face
  g.poly([
    { x: -10, y: -18 }, { x: -4, y: -21 }, { x: 16, y: -15 }, { x: 10, y: -18 },
  ]).fill({ color: lighten(colors.primary, 0.1), alpha: 0.75 });

  // Wood plank lines (front)
  for (let i = 0; i < 3; i++) {
    const py = -16 + i * 6;
    g.moveTo(-9, py).lineTo(9, py)
      .stroke({ color: darken(colors.primary, 0.12), width: 0.5, alpha: 0.3 });
  }

  // Cross bracing (metal bands)
  g.moveTo(-9, -17).lineTo(9, 1).stroke({ color: colors.accent, width: 1.2, alpha: 0.4 });
  g.moveTo(9, -17).lineTo(-9, 1).stroke({ color: colors.accent, width: 1.2, alpha: 0.4 });
  // Center rivet
  g.circle(0, -8, 1.5).fill({ color: colors.accent, alpha: 0.5 });

  // Edge border
  g.rect(-10, -18, 20, 20).stroke({ color: darken(colors.primary, 0.25), width: 0.6, alpha: 0.3 });

  // Loot shimmer hint
  if (obj.lootOnBreak) {
    g.circle(0, -8, 10).fill({ color: 0xffdd44, alpha: 0.04 });
  }
}

// ─── Push Block ─────────────────────────────────────────────────

function drawPushBlock(g: Graphics, obj: EnvironmentObject, colors: { primary: number; accent: number; glow: number }): void {
  drawShadow(g, 0, 4, 16, 7);

  // Stone block — isometric cube
  // Front face
  g.rect(-12, -16, 24, 20).fill({ color: colors.primary, alpha: 0.85 });
  // Right face
  g.poly([
    { x: 12, y: -16 }, { x: 18, y: -12 }, { x: 18, y: 8 }, { x: 12, y: 4 },
  ]).fill({ color: darken(colors.primary, 0.2), alpha: 0.8 });
  // Top face
  g.poly([
    { x: -12, y: -16 }, { x: -6, y: -20 }, { x: 18, y: -12 }, { x: 12, y: -16 },
  ]).fill({ color: lighten(colors.primary, 0.1), alpha: 0.75 });

  // Carved arrow hints (isometric)
  // Top arrow
  g.poly([{ x: 0, y: -18 }, { x: 3, y: -16 }, { x: -3, y: -16 }])
    .fill({ color: colors.accent, alpha: 0.35 });
  // Bottom arrow
  g.poly([{ x: 0, y: 2 }, { x: 3, y: 0 }, { x: -3, y: 0 }])
    .fill({ color: colors.accent, alpha: 0.35 });

  // Stone texture
  g.moveTo(-8, -10).lineTo(8, -10).stroke({ color: darken(colors.primary, 0.1), width: 0.4, alpha: 0.2 });
  g.moveTo(-8, -3).lineTo(8, -3).stroke({ color: darken(colors.primary, 0.1), width: 0.4, alpha: 0.2 });

  // Edge highlight
  g.moveTo(-12, -16).lineTo(-6, -20).stroke({ color: lighten(colors.primary, 0.2), width: 0.5, alpha: 0.3 });
}

// ─── Obelisk (ancient pillar with runes and glow) ───────────────

function drawObelisk(g: Graphics, obj: EnvironmentObject, colors: { primary: number; accent: number; glow: number }): void {
  const activated = obj.activated;

  drawShadow(g, 0, 4, 10, 4);

  // Base pedestal (isometric)
  g.poly([
    { x: 0, y: 4 }, { x: 12, y: -2 }, { x: 0, y: -8 }, { x: -12, y: -2 },
  ]).fill({ color: darken(colors.primary, 0.2), alpha: 0.8 });
  g.poly([
    { x: 0, y: -1 }, { x: 10, y: -6 }, { x: 0, y: -11 }, { x: -10, y: -6 },
  ]).fill({ color: darken(colors.primary, 0.1), alpha: 0.75 });

  // Pillar body (tapered)
  g.poly([
    { x: -6, y: -8 }, { x: -4, y: -38 }, { x: 4, y: -38 }, { x: 6, y: -8 },
  ]).fill({ color: colors.primary, alpha: 0.85 });
  // Pillar side face
  g.poly([
    { x: 6, y: -8 }, { x: 4, y: -38 }, { x: 7, y: -36 }, { x: 9, y: -6 },
  ]).fill({ color: darken(colors.primary, 0.15), alpha: 0.8 });

  // Left edge highlight
  g.moveTo(-6, -8).lineTo(-4, -38)
    .stroke({ color: lighten(colors.primary, 0.2), width: 0.6, alpha: 0.35 });

  // Capstone
  g.poly([
    { x: -5, y: -38 }, { x: 0, y: -44 }, { x: 8, y: -36 }, { x: 5, y: -38 },
  ]).fill({ color: lighten(colors.primary, 0.05), alpha: 0.8 });

  // Rune slots (carved grooves with glow)
  const runeAlpha = activated ? 0.75 : 0.15;
  const runeGlow = activated ? 0.12 : 0;
  for (let i = 0; i < 4; i++) {
    const ry = -14 - i * 7;
    // Carved groove
    g.roundRect(-3, ry, 6, 4, 1).fill({ color: darken(colors.primary, 0.3), alpha: 0.5 });
    // Rune glow
    g.roundRect(-2, ry + 0.5, 4, 3, 1).fill({ color: colors.accent, alpha: runeAlpha });
    if (runeGlow > 0) {
      g.roundRect(-4, ry - 1, 8, 6, 2).fill({ color: colors.glow, alpha: runeGlow });
    }
  }

  // Activation aura
  if (activated) {
    g.circle(0, -24, 12).fill({ color: colors.glow, alpha: 0.08 });
    g.circle(0, -24, 20).fill({ color: colors.glow, alpha: 0.04 });
    // Top gem glow
    g.circle(0, -42, 3).fill({ color: colors.glow, alpha: 0.5 });
    g.circle(0, -42, 7).fill({ color: colors.glow, alpha: 0.1 });
  } else {
    // Dormant top gem
    g.circle(0, -42, 2).fill({ color: colors.accent, alpha: 0.25 });
  }
}

// ─── Hidden Chest (revealed by lever) ───────────────────────────

function drawHiddenChest(g: Graphics, obj: EnvironmentObject, colors: { primary: number; accent: number; glow: number }): void {
  if (!obj.activated) {
    // Still hidden — show faint shimmer on ground
    g.ellipse(0, 0, 8, 4).fill({ color: 0xffdd44, alpha: 0.03 });
    g.ellipse(0, -1, 4, 2).fill({ color: 0xffee66, alpha: 0.05 });
    return;
  }

  drawShadow(g, 0, 3, 12, 5);

  // Chest body
  g.roundRect(-10, -12, 20, 14, 2).fill({ color: 0x664422, alpha: 0.9 });
  // Side face
  g.poly([
    { x: 10, y: -12 }, { x: 14, y: -10 }, { x: 14, y: 4 }, { x: 10, y: 2 },
  ]).fill({ color: 0x553311, alpha: 0.85 });
  // Lid (open)
  g.poly([
    { x: -10, y: -12 }, { x: -11, y: -18 }, { x: 11, y: -18 }, { x: 10, y: -12 },
  ]).fill({ color: 0x775533, alpha: 0.85 });
  g.poly([
    { x: 10, y: -12 }, { x: 11, y: -18 }, { x: 15, y: -16 }, { x: 14, y: -10 },
  ]).fill({ color: 0x664422, alpha: 0.8 });

  // Metal bands
  g.rect(-10, -10, 20, 2).fill({ color: colors.accent, alpha: 0.5 });
  g.rect(-10, -4, 20, 2).fill({ color: colors.accent, alpha: 0.5 });

  // Lock/clasp
  g.roundRect(-2, -7, 4, 3, 1).fill({ color: colors.accent, alpha: 0.65 });

  // Interior glow (treasure!)
  g.roundRect(-8, -14, 16, 4, 1).fill({ color: 0xffdd44, alpha: 0.4 });
  g.circle(0, -12, 10).fill({ color: 0xffcc33, alpha: 0.08 });
  g.circle(0, -12, 16).fill({ color: 0xffaa22, alpha: 0.04 });
}

// ─── Trap Disabler (crystal that neutralizes nearby traps) ──────

function drawTrapDisabler(g: Graphics, obj: EnvironmentObject, colors: { primary: number; accent: number; glow: number }): void {
  const activated = obj.activated;

  drawShadow(g, 0, 2, 8, 3);

  // Metal pedestal
  g.rect(-5, -6, 10, 8).fill({ color: darken(colors.primary, 0.15), alpha: 0.75 });
  g.rect(-6, -1, 12, 3).fill({ color: darken(colors.primary, 0.2), alpha: 0.7 });

  // Crystal on top
  g.poly([
    { x: -4, y: -6 }, { x: 0, y: -20 }, { x: 4, y: -6 },
  ]).fill({ color: activated ? 0x44ddaa : 0x556666, alpha: 0.6 });
  // Crystal inner face
  g.poly([
    { x: -2, y: -7 }, { x: 0, y: -18 }, { x: 2, y: -7 },
  ]).fill({ color: activated ? 0x88ffcc : 0x778888, alpha: 0.35 });

  // Highlight edge
  g.moveTo(-3, -6).lineTo(0, -19)
    .stroke({ color: activated ? 0xaaffdd : lighten(colors.primary, 0.15), width: 0.5, alpha: 0.4 });

  if (activated) {
    // Active ward circle
    g.circle(0, -12, 8).fill({ color: 0x44ddaa, alpha: 0.1 });
    g.circle(0, -12, 14).fill({ color: 0x44ddaa, alpha: 0.05 });
    g.circle(0, -12, 22).stroke({ color: 0x44ddaa, width: 0.5, alpha: 0.15 });
    // Cancel symbol
    g.moveTo(-3, -14).lineTo(3, -10).stroke({ color: 0xff4444, width: 1, alpha: 0.3 });
    g.moveTo(3, -14).lineTo(-3, -10).stroke({ color: 0xff4444, width: 1, alpha: 0.3 });
  } else {
    // Dormant crystal
    g.circle(0, -12, 5).fill({ color: 0x556666, alpha: 0.04 });
  }
}

// ─── Secret Door (stone passage revealed by lever) ──────────────

function drawSecretDoor(g: Graphics, obj: EnvironmentObject, colors: { primary: number; accent: number; glow: number }): void {
  if (!obj.activated) {
    // Hidden — looks like normal wall section
    g.rect(-12, -24, 24, 26).fill({ color: darken(colors.primary, 0.1), alpha: 0.5 });
    // Fake stone texture
    for (let i = 0; i < 4; i++) {
      g.moveTo(-11, -22 + i * 6).lineTo(11, -22 + i * 6)
        .stroke({ color: darken(colors.primary, 0.15), width: 0.4, alpha: 0.2 });
    }
    // Very subtle crack hint
    g.moveTo(0, -22).lineTo(1, 2)
      .stroke({ color: 0x000000, width: 0.3, alpha: 0.08 });
    return;
  }

  // Revealed passage
  drawShadow(g, 0, 3, 14, 5);

  // Stone archway frame
  g.rect(-14, -28, 4, 30).fill({ color: darken(colors.primary, 0.05), alpha: 0.8 });
  g.rect(10, -28, 4, 30).fill({ color: darken(colors.primary, 0.05), alpha: 0.8 });
  // Arch top
  g.poly([
    { x: -14, y: -28 }, { x: -8, y: -34 }, { x: 8, y: -34 },
    { x: 14, y: -28 }, { x: 10, y: -28 }, { x: 6, y: -32 },
    { x: -6, y: -32 }, { x: -10, y: -28 },
  ]).fill({ color: darken(colors.primary, 0.05), alpha: 0.8 });

  // Dark interior
  g.rect(-10, -28, 20, 30).fill({ color: 0x111111, alpha: 0.6 });
  g.rect(-8, -26, 16, 26).fill({ color: 0x000000, alpha: 0.4 });

  // Keystone glow
  g.circle(0, -33, 2).fill({ color: colors.glow, alpha: 0.5 });
  g.circle(0, -33, 5).fill({ color: colors.glow, alpha: 0.1 });

  // Steps into darkness
  for (let i = 0; i < 3; i++) {
    g.rect(-8 + i, -2 + i * 2, 16 - i * 2, 2)
      .fill({ color: darken(colors.primary, 0.15 + i * 0.05), alpha: 0.4 });
  }

  // Enticing glow from inside
  g.ellipse(0, -14, 6, 10).fill({ color: colors.glow, alpha: 0.06 });
}

// ─── Interaction Logic ───────────────────────────────────────────

export interface InteractionResult {
  message: string | null;
  damage: number;
  lootItemID: string | null;
  sfx: string;
  xpReward: number;
  triggerLinkedID: string | null;
  linkedAction: LinkedAction | null;
  cameraShake: number;
}

export function interactWith(obj: EnvironmentObject): InteractionResult {
  const result: InteractionResult = {
    message: null, damage: 0, lootItemID: null,
    sfx: 'button_click', xpReward: 0, triggerLinkedID: null,
    linkedAction: null, cameraShake: 0,
  };

  switch (obj.type) {
    case 'lever':
      obj.activated = !obj.activated;
      result.sfx = 'equip';
      result.triggerLinkedID = obj.linkedID;
      result.linkedAction = obj.linkedAction;
      result.xpReward = 5;
      result.cameraShake = 1;
      // Message depends on linked action
      if (obj.activated) {
        switch (obj.linkedAction) {
          case 'reveal_chest': result.message = '🔓 Levier activé — Un coffre apparaît !'; break;
          case 'disable_traps': result.message = '🛡️ Levier activé — Pièges neutralisés !'; break;
          case 'open_passage': result.message = '🚪 Levier activé — Passage secret ouvert !'; break;
          case 'activate_obelisk': result.message = '⚡ Levier activé — L\'obélisque s\'illumine !'; break;
          default: result.message = 'Levier activé'; break;
        }
      } else {
        result.message = 'Levier désactivé';
      }
      break;

    case 'pressurePlate':
      if (!obj.activated) {
        obj.activated = true;
        result.message = '⚙️ Plaque de pression activée';
        result.sfx = 'button_click';
        result.triggerLinkedID = obj.linkedID;
        result.linkedAction = obj.linkedAction;
        result.xpReward = 3;
        result.cameraShake = 0.5;
      }
      break;

    case 'breakable':
      if (!obj.activated) {
        obj.activated = true;
        result.message = '💥 Brisé !';
        result.sfx = 'hit';
        result.lootItemID = obj.lootOnBreak;
        result.xpReward = 5;
        result.cameraShake = 1.5;
      }
      break;

    case 'obelisk':
      if (!obj.activated) {
        obj.activated = true;
        result.message = '✨ Obélisque ancien activé — Savoir débloqué';
        result.sfx = 'quest_complete';
        result.xpReward = 25;
        result.triggerLinkedID = obj.linkedID;
        result.cameraShake = 2;
      }
      break;

    case 'hiddenChest':
      if (obj.activated) {
        result.message = '🎁 Coffre ouvert !';
        result.sfx = 'loot_common';
        result.lootItemID = obj.lootOnBreak;
        result.xpReward = 15;
      }
      break;

    case 'secretDoor':
      if (obj.activated) {
        result.message = '🚪 Vous entrez dans le passage...';
        result.sfx = 'dash';
        result.xpReward = 20;
      }
      break;

    case 'pushBlock':
      result.message = 'Bloc poussé';
      result.sfx = 'block';
      break;

    default:
      break;
  }

  return result;
}

/** Check if player stepped on a trap */
export function checkTrapTrigger(
  obj: EnvironmentObject,
  playerCol: number,
  playerRow: number,
  dt: number,
): InteractionResult | null {
  if (obj.type !== 'spikeTrap' && obj.type !== 'poisonVent') return null;
  if (obj.position.col !== playerCol || obj.position.row !== playerRow) return null;

  obj.cooldownTimer -= dt;
  if (obj.cooldownTimer > 0) return null;

  obj.activated = true;
  obj.cooldownTimer = obj.cooldown;

  if (obj.type === 'spikeTrap') {
    return {
      message: '⚠️ Piège à pointes !',
      damage: obj.damage,
      lootItemID: null,
      sfx: 'hit',
      xpReward: 0,
      triggerLinkedID: null,
      linkedAction: null,
      cameraShake: 2,
    };
  }

  return {
    message: '☠️ Vapeur empoisonnée !',
    damage: obj.damage,
    lootItemID: null,
    sfx: 'error',
    xpReward: 0,
    triggerLinkedID: null,
    linkedAction: null,
    cameraShake: 1.5,
  };
}

// ─── Connection Line (visual link between lever and target) ─────

export function drawConnectionLine(
  container: Container,
  fromObj: EnvironmentObject,
  toObj: EnvironmentObject,
): Graphics {
  const g = new Graphics();
  const fromPos = isoToScreen(fromObj.position.col, fromObj.position.row);
  const toPos = isoToScreen(toObj.position.col, toObj.position.row);
  const colors = getColors(fromObj.worldID);

  // Dashed energy line on ground
  const dx = toPos.x - fromPos.x;
  const dy = toPos.y - fromPos.y;
  const dist = Math.hypot(dx, dy);
  const segments = Math.floor(dist / 8);
  const nx = dx / dist;
  const ny = dy / dist;

  for (let i = 0; i < segments; i += 2) {
    const x1 = fromPos.x + nx * i * 8;
    const y1 = fromPos.y + ny * i * 8;
    const x2 = fromPos.x + nx * Math.min((i + 1) * 8, dist);
    const y2 = fromPos.y + ny * Math.min((i + 1) * 8, dist);
    g.moveTo(x1, y1).lineTo(x2, y2)
      .stroke({ color: colors.glow, width: 1, alpha: fromObj.activated ? 0.25 : 0.08 });
  }

  // Endpoint markers
  g.circle(fromPos.x, fromPos.y, 4).fill({ color: colors.glow, alpha: 0.12 });
  g.circle(toPos.x, toPos.y, 4).fill({ color: colors.glow, alpha: 0.12 });

  g.zIndex = -500;
  container.addChild(g);
  return g;
}

// ─── Proximity Highlight Ring ───────────────────────────────────

export function drawProximityHighlight(
  container: Container,
  obj: EnvironmentObject,
): Graphics {
  const g = new Graphics();
  const pos = isoToScreen(obj.position.col, obj.position.row);
  const colors = getColors(obj.worldID);

  // Pulsing ring (animated externally by alpha)
  g.ellipse(pos.x, pos.y + 2, 18, 9)
    .stroke({ color: colors.glow, width: 1.5, alpha: 0.35 });
  g.ellipse(pos.x, pos.y + 2, 22, 11)
    .stroke({ color: colors.glow, width: 0.5, alpha: 0.15 });

  g.zIndex = pos.y - 1;
  container.addChild(g);
  return g;
}

// ─── Zone Generation ─────────────────────────────────────────────

function makeObj(
  id: string, type: InteractionType, col: number, row: number,
  worldID: WorldID, opts: Partial<EnvironmentObject> = {},
): EnvironmentObject {
  return {
    id, type, position: { col, row }, worldID,
    activated: false, linkedID: null, linkedAction: null,
    damage: 0, cooldown: 0, cooldownTimer: 0,
    lootOnBreak: null, sprite: new Container(), hidden: false,
    ...opts,
  };
}

/** Generate environmental objects for a zone based on world and zone type */
export function generateEnvironmentObjects(
  worldID: WorldID,
  gridWidth: number,
  gridHeight: number,
  zoneType: string,
  seed: number,
): EnvironmentObject[] {
  const objects: EnvironmentObject[] = [];
  const rng = (i: number) => {
    const x = Math.sin((seed + i) * 9301 + 49297) * 49297;
    return x - Math.floor(x);
  };

  let idx = 0;

  // ── Traps ──
  const trapCount = zoneType === 'boss' ? 4 : zoneType === 'exploration' ? 3 : 1;
  for (let i = 0; i < trapCount; i++) {
    const col = 3 + Math.floor(rng(idx++) * (gridWidth - 6));
    const row = 3 + Math.floor(rng(idx++) * (gridHeight - 6));
    const type: InteractionType = rng(idx++) > 0.5 ? 'spikeTrap' : 'poisonVent';
    objects.push(makeObj(`trap_${worldID}_${i}`, type, col, row, worldID, {
      damage: type === 'spikeTrap' ? 15 : 8,
      cooldown: type === 'spikeTrap' ? 3 : 2,
      hidden: type === 'spikeTrap',
    }));
  }

  // ── Breakables ──
  const breakableCount = zoneType === 'hub' ? 2 : 4;
  for (let i = 0; i < breakableCount; i++) {
    const col = 2 + Math.floor(rng(idx++) * (gridWidth - 4));
    const row = 2 + Math.floor(rng(idx++) * (gridHeight - 4));
    objects.push(makeObj(`breakable_${worldID}_${i}`, 'breakable', col, row, worldID, {
      lootOnBreak: rng(idx++) > 0.6 ? 'potion_minor' : null,
    }));
  }

  // ── Puzzles (diverse linked actions) ──
  const puzzleCount = zoneType === 'exploration' ? 3 : zoneType === 'boss' ? 2 : 0;

  // Available puzzle types to cycle through
  const puzzleTypes: LinkedAction[] = ['activate_obelisk', 'reveal_chest', 'disable_traps', 'open_passage'];

  for (let i = 0; i < puzzleCount; i++) {
    const puzzleType = puzzleTypes[i % puzzleTypes.length];
    const leverCol = 2 + Math.floor(rng(idx++) * (gridWidth - 4));
    const leverRow = 2 + Math.floor(rng(idx++) * (gridHeight - 4));
    const targetCol = 2 + Math.floor(rng(idx++) * (gridWidth - 4));
    const targetRow = 2 + Math.floor(rng(idx++) * (gridHeight - 4));

    let targetType: InteractionType;
    let targetID: string;
    const targetOpts: Partial<EnvironmentObject> = {};

    switch (puzzleType) {
      case 'activate_obelisk':
        targetType = 'obelisk';
        targetID = `obelisk_${worldID}_${i}`;
        break;
      case 'reveal_chest':
        targetType = 'hiddenChest';
        targetID = `chest_${worldID}_${i}`;
        targetOpts.hidden = false;
        targetOpts.lootOnBreak = getLootForWorld(worldID, rng(idx++));
        break;
      case 'disable_traps':
        targetType = 'trapDisabler';
        targetID = `disabler_${worldID}_${i}`;
        break;
      case 'open_passage':
        targetType = 'secretDoor';
        targetID = `door_${worldID}_${i}`;
        break;
    }

    objects.push(makeObj(`lever_${worldID}_${i}`, 'lever', leverCol, leverRow, worldID, {
      linkedID: targetID,
      linkedAction: puzzleType,
    }));

    objects.push(makeObj(targetID, targetType, targetCol, targetRow, worldID, targetOpts));
  }

  // ── Pressure plates (boss zones: linked to trap disablers) ──
  if (zoneType === 'boss') {
    const ppCol = 2 + Math.floor(rng(idx++) * (gridWidth - 4));
    const ppRow = 2 + Math.floor(rng(idx++) * (gridHeight - 4));
    const disablerCol = 2 + Math.floor(rng(idx++) * (gridWidth - 4));
    const disablerRow = 2 + Math.floor(rng(idx++) * (gridHeight - 4));
    const disablerID = `pp_disabler_${worldID}`;

    objects.push(makeObj(`pp_${worldID}`, 'pressurePlate', ppCol, ppRow, worldID, {
      linkedID: disablerID,
      linkedAction: 'disable_traps',
    }));
    objects.push(makeObj(disablerID, 'trapDisabler', disablerCol, disablerRow, worldID));
  }

  return objects;
}

function getLootForWorld(worldID: string, rand: number): string {
  const worldLoot: Record<string, string[]> = {
    scadrial: ['potion_soin', 'lingot_acier', 'potion_investiture'],
    roshar: ['potion_soin', 'bouclier_gemme', 'potion_investiture'],
    nalthis: ['potion_soin', 'cape_larkin', 'elixir_vitalite'],
    taldain: ['potion_soin', 'potion_investiture', 'elixir_vitalite'],
    sel: ['potion_soin', 'enchant_force', 'potion_investiture'],
    komashi: ['potion_soin', 'potion_investiture', 'elixir_vitalite'],
    shadesmar: ['potion_soin', 'potion_investiture', 'enchant_cosmos'],
  };
  const loot = worldLoot[worldID] ?? ['potion_soin'];
  return loot[Math.floor(rand * loot.length)];
}
