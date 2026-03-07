// ─── Environmental Interactions: Puzzles, Traps, Interactive Objects ───
// Adds non-combat zone content: pressure plates, levers, traps, breakables

import { Container, Graphics } from 'pixi.js';
import { isoToScreen } from '../scenes/IsoUtils';
import type { GridPosition, WorldID } from '../data/types';

// ─── Types ───────────────────────────────────────────────────────

export type InteractionType = 'lever' | 'pressurePlate' | 'spikeTrap' | 'poisonVent' | 'breakable' | 'pushBlock' | 'obelisk';

export interface EnvironmentObject {
  id: string;
  type: InteractionType;
  position: GridPosition;
  worldID: WorldID;
  activated: boolean;
  linkedID: string | null;   // ID of object this triggers
  damage: number;            // For traps
  cooldown: number;          // For repeating traps
  cooldownTimer: number;
  lootOnBreak: string | null;
  sprite: Container;
  hidden: boolean;
}

// ─── Colors per world ────────────────────────────────────────────

const WORLD_TRAP_COLORS: Record<string, { primary: number; accent: number }> = {
  scadrial: { primary: 0x555566, accent: 0xcc4444 },
  roshar:   { primary: 0x6688aa, accent: 0x88ccff },
  taldain:  { primary: 0xccbb88, accent: 0xffdd44 },
  komashi:  { primary: 0x443366, accent: 0xaa55cc },
  nalthis:  { primary: 0x55aa77, accent: 0xcc88ff },
  sel:      { primary: 0x887744, accent: 0xffcc44 },
  shadesmar: { primary: 0x334455, accent: 0x88aaff },
};

// ─── Rendering ───────────────────────────────────────────────────

export function createEnvironmentSprite(obj: EnvironmentObject): Container {
  const c = new Container();
  const colors = WORLD_TRAP_COLORS[obj.worldID] ?? { primary: 0x666666, accent: 0xffaa00 };
  const g = new Graphics();

  switch (obj.type) {
    case 'lever': {
      // Base
      g.rect(-8, -4, 16, 8).fill({ color: colors.primary });
      // Handle
      const angle = obj.activated ? -0.5 : 0.5;
      g.moveTo(0, -4).lineTo(Math.cos(angle) * 14, -4 - Math.sin(angle) * 14)
        .stroke({ color: colors.accent, width: 3 });
      // Knob
      g.circle(Math.cos(angle) * 14, -4 - Math.sin(angle) * 14, 3).fill({ color: colors.accent });
      break;
    }
    case 'pressurePlate': {
      const h = obj.activated ? 1 : 3;
      g.rect(-12, -h, 24, h * 2).fill({ color: colors.primary, alpha: 0.8 });
      g.rect(-10, -h + 1, 20, h * 2 - 2).fill({ color: colors.accent, alpha: 0.3 });
      break;
    }
    case 'spikeTrap': {
      g.rect(-14, -3, 28, 6).fill({ color: colors.primary, alpha: 0.5 });
      if (obj.activated) {
        for (let i = -10; i <= 10; i += 5) {
          g.moveTo(i, -3).lineTo(i, -12).lineTo(i + 2, -3)
            .fill({ color: colors.accent });
        }
      }
      break;
    }
    case 'poisonVent': {
      g.circle(0, 0, 10).fill({ color: colors.primary, alpha: 0.6 });
      g.circle(0, 0, 6).fill({ color: 0x44cc44, alpha: obj.activated ? 0.7 : 0.2 });
      break;
    }
    case 'breakable': {
      // Crate/barrel
      g.rect(-10, -14, 20, 18).fill({ color: colors.primary });
      g.rect(-8, -12, 16, 14).fill({ color: colors.primary, alpha: 0.7 });
      // Cross planks
      g.moveTo(-8, -12).lineTo(8, 2).stroke({ color: colors.accent, width: 1, alpha: 0.5 });
      g.moveTo(8, -12).lineTo(-8, 2).stroke({ color: colors.accent, width: 1, alpha: 0.5 });
      break;
    }
    case 'pushBlock': {
      g.rect(-14, -14, 28, 28).fill({ color: colors.primary });
      g.rect(-12, -12, 24, 24).fill({ color: colors.primary, alpha: 0.6 });
      // Arrow hints
      g.moveTo(0, -10).lineTo(4, -6).lineTo(-4, -6).fill({ color: colors.accent, alpha: 0.4 });
      g.moveTo(0, 10).lineTo(4, 6).lineTo(-4, 6).fill({ color: colors.accent, alpha: 0.4 });
      break;
    }
    case 'obelisk': {
      // Tall pillar with glowing runes
      g.moveTo(-6, 4).lineTo(-4, -24).lineTo(4, -24).lineTo(6, 4)
        .fill({ color: colors.primary });
      // Glowing runes
      for (let y = -20; y < 0; y += 6) {
        g.rect(-3, y, 6, 3).fill({ color: colors.accent, alpha: obj.activated ? 0.8 : 0.3 });
      }
      break;
    }
  }

  c.addChild(g);
  const pos = isoToScreen(obj.position.col, obj.position.row);
  c.x = pos.x;
  c.y = pos.y;
  if (obj.hidden) c.alpha = 0;
  return c;
}

// ─── Interaction Logic ───────────────────────────────────────────

export interface InteractionResult {
  message: string | null;
  damage: number;
  lootItemID: string | null;
  sfx: string;
  xpReward: number;
  triggerLinkedID: string | null;
}

export function interactWith(obj: EnvironmentObject): InteractionResult {
  const result: InteractionResult = {
    message: null, damage: 0, lootItemID: null,
    sfx: 'button_click', xpReward: 0, triggerLinkedID: null,
  };

  switch (obj.type) {
    case 'lever':
      obj.activated = !obj.activated;
      result.message = obj.activated ? 'Levier activé' : 'Levier désactivé';
      result.sfx = 'equip';
      result.triggerLinkedID = obj.linkedID;
      result.xpReward = 5;
      break;

    case 'pressurePlate':
      if (!obj.activated) {
        obj.activated = true;
        result.message = 'Plaque de pression activée';
        result.sfx = 'button_click';
        result.triggerLinkedID = obj.linkedID;
        result.xpReward = 3;
      }
      break;

    case 'breakable':
      if (!obj.activated) {
        obj.activated = true;
        result.message = 'Brisé !';
        result.sfx = 'hit';
        result.lootItemID = obj.lootOnBreak;
        result.xpReward = 5;
      }
      break;

    case 'obelisk':
      if (!obj.activated) {
        obj.activated = true;
        result.message = 'Obélisque ancien activé — Savoir débloqué';
        result.sfx = 'quest_complete';
        result.xpReward = 25;
        result.triggerLinkedID = obj.linkedID;
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
      message: 'Piège à pointes !',
      damage: obj.damage,
      lootItemID: null,
      sfx: 'hit',
      xpReward: 0,
      triggerLinkedID: null,
    };
  }

  return {
    message: 'Vapeur empoisonnée !',
    damage: obj.damage,
    lootItemID: null,
    sfx: 'error',
    xpReward: 0,
    triggerLinkedID: null,
  };
}

// ─── Zone Generation ─────────────────────────────────────────────

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

  // Number of objects based on zone type
  const trapCount = zoneType === 'boss' ? 4 : zoneType === 'exploration' ? 3 : 1;
  const breakableCount = zoneType === 'hub' ? 2 : 4;
  const puzzleCount = zoneType === 'exploration' ? 2 : zoneType === 'boss' ? 1 : 0;

  let idx = 0;

  // Place traps
  for (let i = 0; i < trapCount; i++) {
    const col = 3 + Math.floor(rng(idx++) * (gridWidth - 6));
    const row = 3 + Math.floor(rng(idx++) * (gridHeight - 6));
    const type: InteractionType = rng(idx++) > 0.5 ? 'spikeTrap' : 'poisonVent';
    objects.push({
      id: `trap_${worldID}_${i}`,
      type,
      position: { col, row },
      worldID,
      activated: false,
      linkedID: null,
      damage: type === 'spikeTrap' ? 15 : 8,
      cooldown: type === 'spikeTrap' ? 3 : 2,
      cooldownTimer: 0,
      lootOnBreak: null,
      sprite: new Container(),
      hidden: type === 'spikeTrap',
    });
  }

  // Place breakables
  for (let i = 0; i < breakableCount; i++) {
    const col = 2 + Math.floor(rng(idx++) * (gridWidth - 4));
    const row = 2 + Math.floor(rng(idx++) * (gridHeight - 4));
    objects.push({
      id: `breakable_${worldID}_${i}`,
      type: 'breakable',
      position: { col, row },
      worldID,
      activated: false,
      linkedID: null,
      damage: 0,
      cooldown: 0,
      cooldownTimer: 0,
      lootOnBreak: rng(idx++) > 0.6 ? 'potion_minor' : null,
      sprite: new Container(),
      hidden: false,
    });
  }

  // Place puzzles (lever + linked obelisk pairs)
  for (let i = 0; i < puzzleCount; i++) {
    const leverCol = 2 + Math.floor(rng(idx++) * (gridWidth - 4));
    const leverRow = 2 + Math.floor(rng(idx++) * (gridHeight - 4));
    const obeliskCol = 2 + Math.floor(rng(idx++) * (gridWidth - 4));
    const obeliskRow = 2 + Math.floor(rng(idx++) * (gridHeight - 4));
    const obeliskID = `obelisk_${worldID}_${i}`;

    objects.push({
      id: `lever_${worldID}_${i}`,
      type: 'lever',
      position: { col: leverCol, row: leverRow },
      worldID,
      activated: false,
      linkedID: obeliskID,
      damage: 0,
      cooldown: 0,
      cooldownTimer: 0,
      lootOnBreak: null,
      sprite: new Container(),
      hidden: false,
    });

    objects.push({
      id: obeliskID,
      type: 'obelisk',
      position: { col: obeliskCol, row: obeliskRow },
      worldID,
      activated: false,
      linkedID: null,
      damage: 0,
      cooldown: 0,
      cooldownTimer: 0,
      lootOnBreak: null,
      sprite: new Container(),
      hidden: false,
    });
  }

  return objects;
}
