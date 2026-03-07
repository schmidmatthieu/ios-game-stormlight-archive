// ─── Hidden Passages & Secret Areas ─────────────────────────────

import { Container, Graphics } from 'pixi.js';
import { seededRandom } from '../scenes/IsoUtils';

export interface SecretArea {
  x: number;
  y: number;
  col: number;
  row: number;
  type: 'treasure' | 'passage' | 'shrine';
  revealed: boolean;
  sprite: Container;
  interactionRadius: number;
  loot: { gold: number; xp: number; itemHint: string };
}

export function spawnSecretAreas(
  worldContainer: Container,
  isoToScreen: (col: number, row: number) => { x: number; y: number },
  gridWidth: number,
  gridHeight: number,
  worldID: string,
  spawnPos: { col: number; row: number },
): SecretArea[] {
  const secrets: SecretArea[] = [];
  const count = 2 + Math.floor(seededRandom(gridWidth * 113 + gridHeight * 79) * 3);

  for (let i = 0; i < count; i++) {
    const seed = i * 8191 + gridWidth * 41 + gridHeight * 67;
    const col = 2 + Math.floor(seededRandom(seed) * (gridWidth - 4));
    const row = 2 + Math.floor(seededRandom(seed + 1) * (gridHeight - 4));

    const nearSpawn = Math.hypot(col - spawnPos.col, row - spawnPos.row) < 5;
    const nearOther = secrets.some(s => Math.hypot(col - s.col, row - s.row) < 5);
    if (nearSpawn || nearOther) continue;

    const pos = isoToScreen(col, row);
    const container = new Container();
    const typeRand = seededRandom(seed + 7);
    const type: SecretArea['type'] = typeRand < 0.4 ? 'treasure' : typeRand < 0.7 ? 'passage' : 'shrine';

    // Hidden indicator (subtle, becomes visible when close)
    const indicator = new Graphics();

    if (type === 'treasure') {
      indicator.circle(0, 0, 4).fill({ color: 0xeedd44, alpha: 0.08 });
      indicator.circle(0, -1, 2).fill({ color: 0xffee66, alpha: 0.12 });
    } else if (type === 'passage') {
      indicator.moveTo(-5, 2).lineTo(-2, -3).lineTo(1, 1).lineTo(4, -4).lineTo(6, 0)
        .stroke({ color: 0x222222, width: 1, alpha: 0.2 });
    } else {
      indicator.circle(0, -2, 6).fill({ color: getWorldShrineColor(worldID), alpha: 0.06 });
      indicator.circle(0, -2, 3).fill({ color: getWorldShrineColor(worldID), alpha: 0.1 });
    }

    container.addChild(indicator);
    container.x = pos.x;
    container.y = pos.y;
    container.zIndex = pos.y - 50;
    worldContainer.addChild(container);

    const goldReward = 15 + Math.floor(seededRandom(seed + 10) * 40);
    const xpReward = 20 + Math.floor(seededRandom(seed + 11) * 30);

    secrets.push({
      x: pos.x, y: pos.y,
      col, row, type,
      revealed: false,
      sprite: container,
      interactionRadius: 35,
      loot: {
        gold: goldReward,
        xp: xpReward,
        itemHint: getSecretItemHint(worldID, type),
      },
    });
  }

  return secrets;
}

function getWorldShrineColor(worldID: string): number {
  switch (worldID) {
    case 'scadrial': return 0x4488ff;
    case 'roshar': return 0x88ccff;
    case 'nalthis': return 0xff66aa;
    case 'taldain': return 0xffcc44;
    case 'sel': return 0xffaa33;
    case 'komashi': return 0xaa44cc;
    case 'shadesmar': return 0x8877cc;
    default: return 0xffffff;
  }
}

function getSecretItemHint(worldID: string, type: string): string {
  if (type === 'treasure') {
    const hints: Record<string, string> = {
      scadrial: 'Fiole de métal rare',
      roshar: 'Sphère de Lumière d\'Orage',
      nalthis: 'Tissu enrichi de Souffle',
      taldain: 'Sable blanc pur',
      sel: 'Fragment d\'Aon ancien',
      komashi: 'Pigment de cauchemar',
      shadesmar: 'Bille cognitive rare',
    };
    return hints[worldID] ?? 'Trésor mystérieux';
  } else if (type === 'shrine') {
    return 'Bénédiction temporaire';
  }
  return 'Passage secret';
}

export function revealSecret(secret: SecretArea, worldID: string): void {
  if (secret.revealed) return;
  secret.revealed = true;

  const container = secret.sprite;
  container.removeChildren();

  const g = new Graphics();
  const glowColor = getWorldShrineColor(worldID);

  if (secret.type === 'treasure') {
    g.roundRect(-8, -10, 16, 10, 2).fill({ color: 0x664422, alpha: 0.9 });
    g.roundRect(-8, -10, 16, 10, 2).stroke({ color: 0xeebb44, width: 1, alpha: 0.6 });
    g.roundRect(-9, -12, 18, 4, 1).fill({ color: 0x553311, alpha: 0.9 });
    g.rect(-2, -8, 4, 3).fill({ color: 0xeebb44, alpha: 0.7 });
    g.circle(0, -6, 12).fill({ color: 0xeedd44, alpha: 0.1 });
  } else if (secret.type === 'passage') {
    g.ellipse(0, 0, 10, 6).fill({ color: 0x111111, alpha: 0.6 });
    g.ellipse(0, -1, 8, 4).fill({ color: 0x000000, alpha: 0.4 });
    for (let s = 0; s < 3; s++) {
      g.rect(-6 + s * 2, -2 + s * 2, 12 - s * 4, 1).fill({ color: 0x333333, alpha: 0.5 });
    }
  } else {
    g.rect(-2, -18, 4, 14).fill({ color: 0x777777, alpha: 0.7 });
    g.circle(0, -20, 4).fill({ color: glowColor, alpha: 0.6 });
    g.circle(0, -20, 8).fill({ color: glowColor, alpha: 0.12 });
    g.ellipse(0, -2, 8, 3).fill({ color: 0x666666, alpha: 0.5 });
  }

  container.addChild(g);
}
