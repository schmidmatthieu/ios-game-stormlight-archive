// ─── Gathering Nodes — Profession gathering in zones ─────────────
// Spawns interactive gathering nodes (ore veins, herb patches, etc.)
// that the player can interact with to collect materials.

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { ProfessionManager } from '../game/ProfessionSystem';
import type { ProfessionType } from '../game/ProfessionSystem';
import type { GridPosition } from '../data/types';

// ─── Types ──────────────────────────────────────────────────────

export interface GatheringNode {
  id: string;
  type: ProfessionType;
  position: GridPosition;
  screenX: number;
  screenY: number;
  sprite: Container;
  depleted: boolean;
  respawnTimer: number;
  maxGathers: number;
  gathersLeft: number;
}

// ─── Visual Config ──────────────────────────────────────────────

const NODE_VISUALS: Record<ProfessionType, { color: number; icon: string; label: string }> = {
  mining: { color: 0xaa7744, icon: '\u26CF', label: 'Minerai' },
  herbalism: { color: 0x44aa55, icon: '\u2698', label: 'Herbes' },
  woodcutting: { color: 0x886633, icon: '\u2692', label: 'Bois' },
  skinning: { color: 0xcc8855, icon: '\u2694', label: 'Peaux' },
  enchanting: { color: 0x7744cc, icon: '\u2728', label: 'Arcane' },
};

// ─── Spawn Gathering Nodes ──────────────────────────────────────

export function spawnGatheringNodes(
  worldContainer: Container,
  isoToScreen: (col: number, row: number) => { x: number; y: number },
  gridWidth: number,
  gridHeight: number,
  worldID: string,
  spawnPos: GridPosition,
  exits: Array<{ exitPosition: GridPosition }>,
  existingPositions: Array<{ col: number; row: number }>,
): GatheringNode[] {
  const nodes: GatheringNode[] = [];

  // Determine which professions have nodes in this world
  const professions: ProfessionType[] = ['mining', 'herbalism', 'woodcutting', 'skinning'];
  // Add enchanting nodes only in exploration zones
  if (Math.random() < 0.3) professions.push('enchanting');

  // Seed based on world for consistency
  const baseSeed = worldID.length * 997 + gridWidth * 31 + gridHeight * 53;

  for (let i = 0; i < professions.length; i++) {
    const profession = professions[i];
    const nodesForProf = 2 + Math.floor(pseudoRandom(baseSeed + i * 137) * 2);

    for (let j = 0; j < nodesForProf; j++) {
      const seed = baseSeed + i * 1000 + j * 313;
      const col = 3 + Math.floor(pseudoRandom(seed) * (gridWidth - 6));
      const row = 3 + Math.floor(pseudoRandom(seed + 1) * (gridHeight - 6));

      // Distance checks
      const nearSpawn = Math.hypot(col - spawnPos.col, row - spawnPos.row) < 4;
      const nearExit = exits.some(e => Math.hypot(col - e.exitPosition.col, row - e.exitPosition.row) < 4);
      const nearExisting = existingPositions.some(p => Math.hypot(col - p.col, row - p.row) < 3);
      const nearOther = nodes.some(n => Math.hypot(col - n.position.col, row - n.position.row) < 4);
      if (nearSpawn || nearExit || nearExisting || nearOther) continue;

      const pos = isoToScreen(col, row);
      const sprite = createNodeSprite(profession);
      sprite.x = pos.x;
      sprite.y = pos.y;
      sprite.zIndex = pos.y;
      worldContainer.addChild(sprite);

      nodes.push({
        id: `gather_${profession}_${i}_${j}`,
        type: profession,
        position: { col, row },
        screenX: pos.x,
        screenY: pos.y,
        sprite,
        depleted: false,
        respawnTimer: 0,
        maxGathers: 2 + Math.floor(pseudoRandom(seed + 2) * 3),
        gathersLeft: 2 + Math.floor(pseudoRandom(seed + 2) * 3),
      });
    }
  }

  return nodes;
}

// ─── Create Node Sprite ─────────────────────────────────────────

function createNodeSprite(type: ProfessionType): Container {
  const c = new Container();
  const vis = NODE_VISUALS[type];
  const g = new Graphics();

  // Shadow
  g.ellipse(0, 4, 10, 5).fill({ color: 0x000000, alpha: 0.15 });

  // Node body
  switch (type) {
    case 'mining':
      // Rock/ore vein
      g.poly([{ x: -8, y: 0 }, { x: -4, y: -14 }, { x: 5, y: -12 }, { x: 10, y: -3 }, { x: 6, y: 2 }])
        .fill({ color: 0x666677, alpha: 0.9 });
      // Ore glint
      g.rect(-2, -10, 5, 4).fill({ color: vis.color, alpha: 0.8 });
      g.rect(3, -6, 3, 3).fill({ color: vis.color, alpha: 0.6 });
      break;
    case 'herbalism':
      // Plant/herb patch
      g.ellipse(0, 0, 10, 6).fill({ color: 0x225522, alpha: 0.5 });
      g.moveTo(-4, 0).lineTo(-6, -12).stroke({ color: vis.color, width: 2 });
      g.moveTo(0, 0).lineTo(2, -14).stroke({ color: vis.color, width: 2 });
      g.moveTo(4, 0).lineTo(6, -10).stroke({ color: vis.color, width: 2 });
      g.circle(-5, -12, 3).fill({ color: vis.color, alpha: 0.8 });
      g.circle(3, -14, 3).fill({ color: vis.color, alpha: 0.7 });
      g.circle(7, -10, 2.5).fill({ color: vis.color, alpha: 0.6 });
      break;
    case 'woodcutting':
      // Tree stump / log
      g.roundRect(-8, -6, 16, 10, 3).fill({ color: vis.color, alpha: 0.9 });
      g.ellipse(0, -6, 8, 4).fill({ color: 0xaa8855, alpha: 0.7 });
      g.circle(0, -6, 3).fill({ color: 0x554422, alpha: 0.5 });
      break;
    case 'skinning':
      // Animal hide/carcass
      g.ellipse(0, -4, 10, 7).fill({ color: vis.color, alpha: 0.6 });
      g.ellipse(0, -4, 8, 5).fill({ color: 0xddaa77, alpha: 0.4 });
      break;
    case 'enchanting':
      // Glowing crystal
      g.poly([{ x: -3, y: 0 }, { x: -1, y: -16 }, { x: 3, y: 0 }])
        .fill({ color: vis.color, alpha: 0.8 });
      g.poly([{ x: 2, y: -2 }, { x: 5, y: -12 }, { x: 8, y: -2 }])
        .fill({ color: vis.color, alpha: 0.6 });
      g.circle(1, -8, 6).fill({ color: vis.color, alpha: 0.12 });
      break;
  }

  c.addChild(g);

  // Label
  const label = new Text({
    text: vis.label,
    style: new TextStyle({
      fontFamily: 'sans-serif', fontSize: 7, fill: vis.color,
      dropShadow: { color: 0x000000, blur: 2, distance: 1 },
    }),
  });
  label.anchor.set(0.5);
  label.y = -18;
  c.addChild(label);

  return c;
}

// ─── Interaction ────────────────────────────────────────────────

const GATHER_RANGE = 55;

export function findNearbyNode(
  playerPos: { x: number; y: number },
  nodes: GatheringNode[],
): GatheringNode | null {
  let closest: GatheringNode | null = null;
  let minDist = Infinity;
  for (const node of nodes) {
    if (node.depleted) continue;
    const dist = Math.hypot(node.screenX - playerPos.x, node.screenY - playerPos.y);
    if (dist < GATHER_RANGE && dist < minDist) {
      minDist = dist;
      closest = node;
    }
  }
  return closest;
}

export interface GatherResult {
  success: boolean;
  materialName: string;
  rarity: string;
  professionXP: number;
  message: string;
}

export function gatherFromNode(node: GatheringNode, worldID: string): GatherResult {
  if (node.depleted) {
    return { success: false, materialName: '', rarity: '', professionXP: 0, message: 'Épuisé !' };
  }

  const mgr = ProfessionManager.shared;
  const mat = mgr.gatherMaterial(node.type, worldID);

  node.gathersLeft--;
  if (node.gathersLeft <= 0) {
    node.depleted = true;
    node.sprite.alpha = 0.3;
  }

  if (mat) {
    mgr.save();
    const vis = NODE_VISUALS[node.type];
    return {
      success: true,
      materialName: mat.name,
      rarity: mat.rarity,
      professionXP: 0,
      message: `${vis.icon} ${mat.name} récolté !`,
    };
  }

  return { success: false, materialName: '', rarity: '', professionXP: 0, message: 'Rien trouvé...' };
}

// ─── Update Respawns ────────────────────────────────────────────

const RESPAWN_TIME = 60; // seconds

export function updateGatheringNodes(nodes: GatheringNode[], dt: number): void {
  for (const node of nodes) {
    if (!node.depleted) continue;
    node.respawnTimer += dt;
    if (node.respawnTimer >= RESPAWN_TIME) {
      node.depleted = false;
      node.gathersLeft = node.maxGathers;
      node.respawnTimer = 0;
      node.sprite.alpha = 1;
    }
  }
}

// ─── Helpers ────────────────────────────────────────────────────

function pseudoRandom(seed: number): number {
  let x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}
