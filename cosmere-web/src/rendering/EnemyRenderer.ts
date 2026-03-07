import { Graphics } from 'pixi.js';
import type { Enemy } from '../data/types';
import { lighten, darken } from './PlayerRenderer';

// World-specific enemy body colors
const WORLD_ENEMY_COLORS: Record<string, Record<string, number>> = {
  scadrial: { minion: 0x665544, soldier: 0x884433, elite: 0x774455, boss: 0xcc5500 },
  roshar:   { minion: 0x445566, soldier: 0x556688, elite: 0x6644aa, boss: 0x8833cc },
  taldain:  { minion: 0x887755, soldier: 0x996644, elite: 0xaa7733, boss: 0xcc8800 },
  nalthis:  { minion: 0x556644, soldier: 0x668855, elite: 0x449944, boss: 0x33aa33 },
  sel:      { minion: 0x888855, soldier: 0x999966, elite: 0xaaaa44, boss: 0xccaa22 },
  komashi:  { minion: 0x443355, soldier: 0x554466, elite: 0x663377, boss: 0x882299 },
  shadesmar:{ minion: 0x334455, soldier: 0x445577, elite: 0x5566aa, boss: 0x3355cc },
};

export function drawEnemySprite(g: Graphics, data: Enemy, size: number): void {
  const worldColors = WORLD_ENEMY_COLORS[data.worldID] ?? WORLD_ENEMY_COLORS.scadrial;
  const bodyColor = worldColors[data.tier] ?? 0x774444;
  const headY = -size * 1.8;
  const headSize = size * 0.5;

  // Tier-specific body shapes
  switch (data.tier) {
    case 'boss':
      drawBossEnemy(g, data, size, bodyColor, headY, headSize);
      break;
    case 'elite':
      drawEliteEnemy(g, data, size, bodyColor, headY, headSize);
      break;
    case 'soldier':
      drawSoldierEnemy(g, data, size, bodyColor, headY, headSize);
      break;
    default:
      drawMinionEnemy(g, data, size, bodyColor, headY, headSize);
      break;
  }
}

function drawMinionEnemy(g: Graphics, data: Enemy, size: number, bodyColor: number, headY: number, headSize: number): void {
  // Small, hunched body
  g.poly([
    { x: -size * 0.8, y: 0 }, { x: -size * 0.5, y: headY * 0.7 },
    { x: 0, y: headY * 0.8 },
    { x: size * 0.5, y: headY * 0.7 }, { x: size * 0.8, y: 0 },
  ]).fill({ color: bodyColor, alpha: 0.85 });

  // World-specific detail
  drawWorldDetail(g, data, size, bodyColor);

  // Head
  g.circle(0, headY * 0.8 - headSize * 0.8, headSize * 0.8)
    .fill({ color: getEnemySkinColor(data.worldID), alpha: 0.9 });

  // Eyes
  g.circle(-headSize * 0.3, headY * 0.8 - headSize * 0.8, 1).fill(getEyeColor(data.worldID));
  g.circle(headSize * 0.3, headY * 0.8 - headSize * 0.8, 1).fill(getEyeColor(data.worldID));
}

function drawSoldierEnemy(g: Graphics, data: Enemy, size: number, bodyColor: number, headY: number, headSize: number): void {
  // Armored body
  g.poly([
    { x: -size, y: 0 }, { x: -size * 0.8, y: headY },
    { x: 0, y: headY * 1.1 },
    { x: size * 0.8, y: headY }, { x: size, y: 0 },
  ]).fill({ color: bodyColor, alpha: 0.9 });

  // Armor plate
  g.poly([
    { x: -size * 0.6, y: -2 }, { x: -size * 0.5, y: headY * 0.7 },
    { x: size * 0.5, y: headY * 0.7 }, { x: size * 0.6, y: -2 },
  ]).fill({ color: lighten(bodyColor, 0.15), alpha: 0.5 });

  // Shoulder guards
  g.ellipse(-size * 0.9, headY * 0.5, size * 0.35, size * 0.2)
    .fill({ color: lighten(bodyColor, 0.1), alpha: 0.7 });
  g.ellipse(size * 0.9, headY * 0.5, size * 0.35, size * 0.2)
    .fill({ color: lighten(bodyColor, 0.1), alpha: 0.7 });

  drawWorldDetail(g, data, size, bodyColor);

  // Head with helmet
  g.circle(0, headY - headSize, headSize).fill({ color: getEnemySkinColor(data.worldID), alpha: 0.9 });
  g.poly([
    { x: -headSize, y: headY - headSize }, { x: 0, y: headY - headSize * 1.8 },
    { x: headSize, y: headY - headSize },
  ]).fill({ color: darken(bodyColor, 0.1), alpha: 0.6 });

  // Eyes
  g.circle(-headSize * 0.4, headY - headSize, 1.2).fill(getEyeColor(data.worldID));
  g.circle(headSize * 0.4, headY - headSize, 1.2).fill(getEyeColor(data.worldID));

  // Weapon
  g.rect(size + 1, headY * 0.3, 2, size * 1.5).fill({ color: 0x888888, alpha: 0.7 });
}

function drawEliteEnemy(g: Graphics, data: Enemy, size: number, bodyColor: number, headY: number, headSize: number): void {
  // Larger, armored body with aura
  g.circle(0, headY * 0.5, size * 1.5).fill({ color: bodyColor, alpha: 0.06 });

  g.poly([
    { x: -size * 1.1, y: 0 }, { x: -size * 0.9, y: headY * 1.1 },
    { x: 0, y: headY * 1.2 },
    { x: size * 0.9, y: headY * 1.1 }, { x: size * 1.1, y: 0 },
  ]).fill({ color: bodyColor, alpha: 0.9 });

  // Ornate armor
  g.poly([
    { x: -size * 0.7, y: -2 }, { x: -size * 0.6, y: headY * 0.8 },
    { x: size * 0.6, y: headY * 0.8 }, { x: size * 0.7, y: -2 },
  ]).fill({ color: lighten(bodyColor, 0.2), alpha: 0.5 });

  // Shoulder spikes
  g.poly([
    { x: -size, y: headY * 0.4 }, { x: -size * 1.4, y: headY * 0.7 },
    { x: -size * 0.8, y: headY * 0.5 },
  ]).fill({ color: lighten(bodyColor, 0.15), alpha: 0.7 });
  g.poly([
    { x: size, y: headY * 0.4 }, { x: size * 1.4, y: headY * 0.7 },
    { x: size * 0.8, y: headY * 0.5 },
  ]).fill({ color: lighten(bodyColor, 0.15), alpha: 0.7 });

  drawWorldDetail(g, data, size, bodyColor);

  // Head
  g.circle(0, headY - headSize, headSize * 1.1).fill({ color: getEnemySkinColor(data.worldID), alpha: 0.9 });
  g.circle(-headSize * 0.4, headY - headSize, 1.3).fill(getEyeColor(data.worldID));
  g.circle(headSize * 0.4, headY - headSize, 1.3).fill(getEyeColor(data.worldID));

  // Elite aura
  g.circle(0, headY * 0.5, size * 1.8).stroke({ color: bodyColor, width: 1, alpha: 0.15 });
}

function drawBossEnemy(g: Graphics, data: Enemy, size: number, bodyColor: number, headY: number, headSize: number): void {
  // Large, imposing body with double aura
  g.circle(0, headY * 0.4, size * 2).fill({ color: bodyColor, alpha: 0.04 });
  g.circle(0, headY * 0.4, size * 2.5).stroke({ color: bodyColor, width: 1.5, alpha: 0.1 });

  // Massive body
  g.poly([
    { x: -size * 1.3, y: 2 }, { x: -size * 1.1, y: headY * 1.2 },
    { x: 0, y: headY * 1.4 },
    { x: size * 1.1, y: headY * 1.2 }, { x: size * 1.3, y: 2 },
  ]).fill({ color: bodyColor, alpha: 0.9 });

  // Armor layers
  g.poly([
    { x: -size, y: 0 }, { x: -size * 0.8, y: headY },
    { x: size * 0.8, y: headY }, { x: size, y: 0 },
  ]).fill({ color: lighten(bodyColor, 0.2), alpha: 0.4 });

  // Large shoulder plates
  g.ellipse(-size * 1.2, headY * 0.5, size * 0.5, size * 0.3)
    .fill({ color: lighten(bodyColor, 0.15), alpha: 0.8 });
  g.ellipse(size * 1.2, headY * 0.5, size * 0.5, size * 0.3)
    .fill({ color: lighten(bodyColor, 0.15), alpha: 0.8 });

  drawWorldDetail(g, data, size, bodyColor);

  // Head
  g.circle(0, headY * 1.1 - headSize * 1.2, headSize * 1.2)
    .fill({ color: getEnemySkinColor(data.worldID), alpha: 0.9 });

  // Glowing eyes
  const eyeY = headY * 1.1 - headSize * 1.2;
  g.circle(-headSize * 0.4, eyeY, 1.8).fill(getEyeColor(data.worldID));
  g.circle(headSize * 0.4, eyeY, 1.8).fill(getEyeColor(data.worldID));
  g.circle(-headSize * 0.4, eyeY, 3).fill({ color: getEyeColor(data.worldID), alpha: 0.15 });
  g.circle(headSize * 0.4, eyeY, 3).fill({ color: getEyeColor(data.worldID), alpha: 0.15 });

  // Crown
  g.poly([
    { x: -6, y: headY * 1.1 - headSize * 2.2 }, { x: -4, y: headY * 1.1 - headSize * 1.6 },
    { x: -2, y: headY * 1.1 - headSize * 2.1 }, { x: 0, y: headY * 1.1 - headSize * 1.6 },
    { x: 2, y: headY * 1.1 - headSize * 2.1 }, { x: 4, y: headY * 1.1 - headSize * 1.6 },
    { x: 6, y: headY * 1.1 - headSize * 2.2 },
    { x: 6, y: headY * 1.1 - headSize * 1.4 }, { x: -6, y: headY * 1.1 - headSize * 1.4 },
  ]).fill({ color: 0xeebb33, alpha: 0.8 });
  // Crown gems
  g.circle(-2, headY * 1.1 - headSize * 1.8, 1).fill({ color: 0xff3333, alpha: 0.7 });
  g.circle(2, headY * 1.1 - headSize * 1.8, 1).fill({ color: 0x3333ff, alpha: 0.7 });
}

function drawWorldDetail(g: Graphics, data: Enemy, size: number, bodyColor: number): void {
  const worldID = data.worldID;
  switch (worldID) {
    case 'scadrial':
      // Spike through chest (hemalurgy)
      if (data.tier !== 'minion') {
        g.rect(-0.5, -size * 1.2, 1, size * 0.8).fill({ color: 0x888888, alpha: 0.6 });
      }
      break;
    case 'roshar':
      // Carapace armor pieces
      g.ellipse(-size * 0.4, -size * 0.5, size * 0.3, size * 0.4)
        .fill({ color: 0x334455, alpha: 0.4 });
      g.ellipse(size * 0.4, -size * 0.5, size * 0.3, size * 0.4)
        .fill({ color: 0x334455, alpha: 0.4 });
      break;
    case 'taldain':
      // Sand markings
      g.moveTo(-size * 0.3, -size * 0.3)
        .lineTo(size * 0.3, -size * 0.8)
        .stroke({ color: 0xddcc88, width: 1, alpha: 0.3 });
      break;
    case 'nalthis':
      // Color aura
      g.circle(0, -size * 0.5, size * 0.6).fill({ color: 0xaa44ff, alpha: 0.06 });
      break;
    case 'sel':
      // Aon glow mark
      g.circle(0, -size * 0.6, size * 0.25).stroke({ color: 0xddaa44, width: 0.8, alpha: 0.4 });
      break;
    case 'komashi':
      // Ink drip effect
      g.circle(-size * 0.2, 1, 2).fill({ color: 0x111122, alpha: 0.4 });
      g.circle(size * 0.3, 2, 1.5).fill({ color: 0x111122, alpha: 0.3 });
      break;
    case 'shadesmar':
      // Cognitive shimmer
      g.circle(0, -size * 0.5, size).fill({ color: 0x6655aa, alpha: 0.04 });
      break;
  }
}

function getEnemySkinColor(worldID: string): number {
  switch (worldID) {
    case 'scadrial': return 0x998877;
    case 'roshar': return 0x667788;
    case 'taldain': return 0xbbaa88;
    case 'nalthis': return 0x88aa88;
    case 'sel': return 0xaaaa88;
    case 'komashi': return 0x776688;
    case 'shadesmar': return 0x778899;
    default: return 0xbb8866;
  }
}

function getEyeColor(worldID: string): number {
  switch (worldID) {
    case 'scadrial': return 0xff3333;
    case 'roshar': return 0x66aaff;
    case 'taldain': return 0xffaa33;
    case 'nalthis': return 0xaa44ff;
    case 'sel': return 0xffcc44;
    case 'komashi': return 0xff33aa;
    case 'shadesmar': return 0x4488ff;
    default: return 0xff3333;
  }
}
