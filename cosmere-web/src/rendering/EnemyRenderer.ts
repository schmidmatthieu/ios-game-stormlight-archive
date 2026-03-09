import { Graphics, Container } from 'pixi.js';
import type { Enemy } from '../data/types';
import { lighten, darken } from '../utils/ColorUtils';
import { drawEntityOutline } from './OutlineRenderer';

// World-specific enemy body colors
export const WORLD_ENEMY_COLORS: Record<string, Record<string, number>> = {
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

// ─── Helper: draw eyes with glow ────────────────────────────────

function drawEyes(
  g: Graphics, eyeColor: number, skinColor: number,
  x1: number, x2: number, y: number, size: number, glowRadius: number,
): void {
  // Eye socket shadow
  g.ellipse(x1, y, size * 1.3, size * 1.1).fill({ color: darken(skinColor, 0.2), alpha: 0.2 });
  g.ellipse(x2, y, size * 1.3, size * 1.1).fill({ color: darken(skinColor, 0.2), alpha: 0.2 });
  // Eye body
  g.circle(x1, y, size).fill({ color: eyeColor, alpha: 0.95 });
  g.circle(x2, y, size).fill({ color: eyeColor, alpha: 0.95 });
  // Eye glow
  if (glowRadius > 0) {
    g.circle(x1, y, glowRadius).fill({ color: eyeColor, alpha: 0.12 });
    g.circle(x2, y, glowRadius).fill({ color: eyeColor, alpha: 0.12 });
  }
  // Glints
  g.circle(x1 - size * 0.25, y - size * 0.25, size * 0.25).fill({ color: 0xffffff, alpha: 0.5 });
  g.circle(x2 - size * 0.25, y - size * 0.25, size * 0.25).fill({ color: 0xffffff, alpha: 0.5 });
}

// ─── Minion ─────────────────────────────────────────────────────

function drawMinionEnemy(g: Graphics, data: Enemy, size: number, bodyColor: number, headY: number, headSize: number): void {
  const skinColor = getEnemySkinColor(data.worldID);
  const eyeColor = getEyeColor(data.worldID);

  // Body outline for depth
  const bodyPts = [
    { x: -size * 0.85, y: 1 }, { x: -size * 0.55, y: headY * 0.7 },
    { x: 0, y: headY * 0.8 },
    { x: size * 0.55, y: headY * 0.7 }, { x: size * 0.85, y: 1 },
  ];
  g.poly(bodyPts).fill({ color: darken(bodyColor, 0.25), alpha: 0.3 });

  // Body
  const innerPts = [
    { x: -size * 0.8, y: 0 }, { x: -size * 0.5, y: headY * 0.7 },
    { x: 0, y: headY * 0.8 },
    { x: size * 0.5, y: headY * 0.7 }, { x: size * 0.8, y: 0 },
  ];
  g.poly(innerPts).fill({ color: bodyColor, alpha: 0.88 });

  // Body highlight (left side)
  g.poly([
    { x: -size * 0.6, y: 0 }, { x: -size * 0.4, y: headY * 0.65 },
    { x: -size * 0.1, y: headY * 0.7 }, { x: -size * 0.2, y: 0 },
  ]).fill({ color: lighten(bodyColor, 0.18), alpha: 0.25 });

  // Body shadow (right side)
  g.poly([
    { x: size * 0.2, y: 0 }, { x: size * 0.3, y: headY * 0.6 },
    { x: size * 0.5, y: headY * 0.65 }, { x: size * 0.7, y: 0 },
  ]).fill({ color: darken(bodyColor, 0.15), alpha: 0.2 });

  drawWorldDetail(g, data, size, bodyColor);

  // Head with shading
  const hy = headY * 0.8 - headSize * 0.8;
  g.circle(0, hy, headSize * 0.85).fill({ color: darken(skinColor, 0.15), alpha: 0.25 }); // outline
  g.circle(0, hy, headSize * 0.8).fill({ color: skinColor, alpha: 0.92 });
  g.ellipse(-headSize * 0.15, hy - headSize * 0.2, headSize * 0.4, headSize * 0.35)
    .fill({ color: lighten(skinColor, 0.12), alpha: 0.2 }); // highlight

  drawEyes(g, eyeColor, skinColor, -headSize * 0.3, headSize * 0.3, hy, 1, 0);
}

// ─── Soldier ────────────────────────────────────────────────────

function drawSoldierEnemy(g: Graphics, data: Enemy, size: number, bodyColor: number, headY: number, headSize: number): void {
  const skinColor = getEnemySkinColor(data.worldID);
  const eyeColor = getEyeColor(data.worldID);

  // Body outline
  const bodyPts = [
    { x: -size * 1.05, y: 1 }, { x: -size * 0.85, y: headY },
    { x: 0, y: headY * 1.1 },
    { x: size * 0.85, y: headY }, { x: size * 1.05, y: 1 },
  ];
  g.poly(bodyPts).fill({ color: darken(bodyColor, 0.25), alpha: 0.3 });

  // Armored body
  g.poly([
    { x: -size, y: 0 }, { x: -size * 0.8, y: headY },
    { x: 0, y: headY * 1.1 },
    { x: size * 0.8, y: headY }, { x: size, y: 0 },
  ]).fill({ color: bodyColor, alpha: 0.92 });

  // Armor plate with gradient
  g.poly([
    { x: -size * 0.6, y: -2 }, { x: -size * 0.5, y: headY * 0.7 },
    { x: size * 0.5, y: headY * 0.7 }, { x: size * 0.6, y: -2 },
  ]).fill({ color: lighten(bodyColor, 0.18), alpha: 0.5 });
  // Armor plate edge highlight
  g.moveTo(-size * 0.5, headY * 0.7).lineTo(size * 0.5, headY * 0.7)
    .stroke({ color: lighten(bodyColor, 0.3), width: 0.6, alpha: 0.3 });

  // Shoulder guards with volume
  g.ellipse(-size * 0.95, headY * 0.5, size * 0.4, size * 0.25)
    .fill({ color: darken(bodyColor, 0.1), alpha: 0.3 });
  g.ellipse(-size * 0.9, headY * 0.5, size * 0.35, size * 0.2)
    .fill({ color: lighten(bodyColor, 0.12), alpha: 0.75 });
  g.ellipse(-size * 0.9, headY * 0.5 - size * 0.05, size * 0.2, size * 0.1)
    .fill({ color: lighten(bodyColor, 0.25), alpha: 0.3 });
  g.ellipse(size * 0.95, headY * 0.5, size * 0.4, size * 0.25)
    .fill({ color: darken(bodyColor, 0.1), alpha: 0.3 });
  g.ellipse(size * 0.9, headY * 0.5, size * 0.35, size * 0.2)
    .fill({ color: lighten(bodyColor, 0.12), alpha: 0.75 });

  drawWorldDetail(g, data, size, bodyColor);

  // Head with helmet
  const hy = headY - headSize;
  g.circle(0, hy, headSize * 1.05).fill({ color: darken(skinColor, 0.15), alpha: 0.25 });
  g.circle(0, hy, headSize).fill({ color: skinColor, alpha: 0.92 });
  // Helmet
  g.poly([
    { x: -headSize, y: hy }, { x: 0, y: headY - headSize * 1.8 },
    { x: headSize, y: hy },
  ]).fill({ color: darken(bodyColor, 0.1), alpha: 0.65 });
  // Helmet highlight
  g.poly([
    { x: -headSize * 0.3, y: hy }, { x: 0, y: headY - headSize * 1.6 },
    { x: headSize * 0.2, y: hy },
  ]).fill({ color: lighten(bodyColor, 0.15), alpha: 0.2 });

  drawEyes(g, eyeColor, skinColor, -headSize * 0.4, headSize * 0.4, hy, 1.2, 1.8);

  // Weapon with edge glow
  g.rect(size + 1, headY * 0.3, 2.5, size * 1.6).fill({ color: 0x888888, alpha: 0.75 });
  g.rect(size + 1, headY * 0.3, 1, size * 1.6).fill({ color: 0xaaaaaa, alpha: 0.2 }); // highlight
  g.moveTo(size + 1, headY * 0.3).lineTo(size + 1, headY * 0.3 + size * 1.6)
    .stroke({ color: 0xcccccc, width: 0.5, alpha: 0.3 }); // edge
}

// ─── Elite ──────────────────────────────────────────────────────

function drawEliteEnemy(g: Graphics, data: Enemy, size: number, bodyColor: number, headY: number, headSize: number): void {
  const skinColor = getEnemySkinColor(data.worldID);
  const eyeColor = getEyeColor(data.worldID);

  // Pulsating aura layers
  g.circle(0, headY * 0.5, size * 2).fill({ color: bodyColor, alpha: 0.03 });
  g.circle(0, headY * 0.5, size * 1.6).fill({ color: bodyColor, alpha: 0.05 });
  g.circle(0, headY * 0.5, size * 1.8).stroke({ color: bodyColor, width: 1.2, alpha: 0.12 });

  // Body outline
  g.poly([
    { x: -size * 1.15, y: 1 }, { x: -size * 0.95, y: headY * 1.1 },
    { x: 0, y: headY * 1.2 },
    { x: size * 0.95, y: headY * 1.1 }, { x: size * 1.15, y: 1 },
  ]).fill({ color: darken(bodyColor, 0.25), alpha: 0.3 });

  // Body
  g.poly([
    { x: -size * 1.1, y: 0 }, { x: -size * 0.9, y: headY * 1.1 },
    { x: 0, y: headY * 1.2 },
    { x: size * 0.9, y: headY * 1.1 }, { x: size * 1.1, y: 0 },
  ]).fill({ color: bodyColor, alpha: 0.92 });

  // Ornate armor with layered shading
  g.poly([
    { x: -size * 0.7, y: -2 }, { x: -size * 0.6, y: headY * 0.8 },
    { x: size * 0.6, y: headY * 0.8 }, { x: size * 0.7, y: -2 },
  ]).fill({ color: lighten(bodyColor, 0.22), alpha: 0.5 });
  // Armor center gem/detail
  g.circle(0, headY * 0.4, size * 0.15).fill({ color: eyeColor, alpha: 0.4 });
  g.circle(0, headY * 0.4, size * 0.25).fill({ color: eyeColor, alpha: 0.08 });

  // Shoulder spikes with volume
  g.poly([
    { x: -size, y: headY * 0.4 }, { x: -size * 1.45, y: headY * 0.72 },
    { x: -size * 0.8, y: headY * 0.5 },
  ]).fill({ color: lighten(bodyColor, 0.18), alpha: 0.75 });
  g.poly([
    { x: -size, y: headY * 0.4 }, { x: -size * 1.45, y: headY * 0.72 },
    { x: -size * 0.8, y: headY * 0.5 },
  ]).stroke({ color: lighten(bodyColor, 0.3), width: 0.5, alpha: 0.3 });
  g.poly([
    { x: size, y: headY * 0.4 }, { x: size * 1.45, y: headY * 0.72 },
    { x: size * 0.8, y: headY * 0.5 },
  ]).fill({ color: lighten(bodyColor, 0.18), alpha: 0.75 });
  g.poly([
    { x: size, y: headY * 0.4 }, { x: size * 1.45, y: headY * 0.72 },
    { x: size * 0.8, y: headY * 0.5 },
  ]).stroke({ color: lighten(bodyColor, 0.3), width: 0.5, alpha: 0.3 });

  drawWorldDetail(g, data, size, bodyColor);

  // Head with volume
  const hy = headY - headSize;
  g.circle(0, hy, headSize * 1.2).fill({ color: darken(skinColor, 0.15), alpha: 0.25 });
  g.circle(0, hy, headSize * 1.1).fill({ color: skinColor, alpha: 0.92 });
  g.ellipse(-headSize * 0.2, hy - headSize * 0.3, headSize * 0.4, headSize * 0.3)
    .fill({ color: lighten(skinColor, 0.12), alpha: 0.2 });

  drawEyes(g, eyeColor, skinColor, -headSize * 0.4, headSize * 0.4, hy, 1.4, 2.5);
}

// ─── Boss ───────────────────────────────────────────────────────

function drawBossEnemy(g: Graphics, data: Enemy, size: number, bodyColor: number, headY: number, headSize: number): void {
  const skinColor = getEnemySkinColor(data.worldID);
  const eyeColor = getEyeColor(data.worldID);

  // Multi-layered menacing aura
  g.circle(0, headY * 0.4, size * 3).fill({ color: bodyColor, alpha: 0.02 });
  g.circle(0, headY * 0.4, size * 2.5).fill({ color: bodyColor, alpha: 0.03 });
  g.circle(0, headY * 0.4, size * 2).fill({ color: bodyColor, alpha: 0.04 });
  g.circle(0, headY * 0.4, size * 2.5).stroke({ color: bodyColor, width: 2, alpha: 0.08 });
  g.circle(0, headY * 0.4, size * 2).stroke({ color: lighten(bodyColor, 0.2), width: 1, alpha: 0.1 });

  // Body outline
  g.poly([
    { x: -size * 1.35, y: 3 }, { x: -size * 1.15, y: headY * 1.2 },
    { x: 0, y: headY * 1.4 },
    { x: size * 1.15, y: headY * 1.2 }, { x: size * 1.35, y: 3 },
  ]).fill({ color: darken(bodyColor, 0.3), alpha: 0.3 });

  // Massive body
  g.poly([
    { x: -size * 1.3, y: 2 }, { x: -size * 1.1, y: headY * 1.2 },
    { x: 0, y: headY * 1.4 },
    { x: size * 1.1, y: headY * 1.2 }, { x: size * 1.3, y: 2 },
  ]).fill({ color: bodyColor, alpha: 0.92 });

  // Armor layers with gradient
  g.poly([
    { x: -size, y: 0 }, { x: -size * 0.8, y: headY },
    { x: size * 0.8, y: headY }, { x: size, y: 0 },
  ]).fill({ color: lighten(bodyColor, 0.22), alpha: 0.42 });
  // Armor highlight
  g.poly([
    { x: -size * 0.5, y: -1 }, { x: -size * 0.4, y: headY * 0.8 },
    { x: size * 0.1, y: headY * 0.8 }, { x: size * 0.2, y: -1 },
  ]).fill({ color: lighten(bodyColor, 0.3), alpha: 0.15 });

  // Massive shoulder plates with volume
  g.ellipse(-size * 1.25, headY * 0.5, size * 0.55, size * 0.35)
    .fill({ color: darken(bodyColor, 0.1), alpha: 0.35 });
  g.ellipse(-size * 1.2, headY * 0.5, size * 0.5, size * 0.3)
    .fill({ color: lighten(bodyColor, 0.15), alpha: 0.82 });
  g.ellipse(-size * 1.2, headY * 0.5 - size * 0.08, size * 0.3, size * 0.15)
    .fill({ color: lighten(bodyColor, 0.28), alpha: 0.25 });
  g.ellipse(size * 1.25, headY * 0.5, size * 0.55, size * 0.35)
    .fill({ color: darken(bodyColor, 0.1), alpha: 0.35 });
  g.ellipse(size * 1.2, headY * 0.5, size * 0.5, size * 0.3)
    .fill({ color: lighten(bodyColor, 0.15), alpha: 0.82 });
  g.ellipse(size * 1.2, headY * 0.5 - size * 0.08, size * 0.3, size * 0.15)
    .fill({ color: lighten(bodyColor, 0.28), alpha: 0.25 });

  drawWorldDetail(g, data, size, bodyColor);

  // Head with volume
  const hy = headY * 1.1 - headSize * 1.2;
  g.circle(0, hy, headSize * 1.3).fill({ color: darken(skinColor, 0.2), alpha: 0.25 });
  g.circle(0, hy, headSize * 1.2).fill({ color: skinColor, alpha: 0.92 });
  g.ellipse(-headSize * 0.2, hy - headSize * 0.3, headSize * 0.5, headSize * 0.4)
    .fill({ color: lighten(skinColor, 0.12), alpha: 0.2 });

  // Glowing eyes — larger and more menacing
  drawEyes(g, eyeColor, skinColor, -headSize * 0.4, headSize * 0.4, hy, 1.8, 3.5);

  // Crown with gems and glow
  const crownY = hy - headSize * 0.8;
  g.poly([
    { x: -7, y: crownY - headSize * 0.6 }, { x: -5, y: crownY },
    { x: -3, y: crownY - headSize * 0.5 }, { x: 0, y: crownY },
    { x: 3, y: crownY - headSize * 0.5 }, { x: 5, y: crownY },
    { x: 7, y: crownY - headSize * 0.6 },
    { x: 7, y: crownY + headSize * 0.2 }, { x: -7, y: crownY + headSize * 0.2 },
  ]).fill({ color: 0xeebb33, alpha: 0.82 });
  // Crown highlight
  g.poly([
    { x: -5, y: crownY - headSize * 0.3 }, { x: -3, y: crownY + headSize * 0.1 },
    { x: 3, y: crownY + headSize * 0.1 }, { x: 5, y: crownY - headSize * 0.3 },
  ]).fill({ color: 0xffdd66, alpha: 0.2 });
  // Crown gems with glow
  g.circle(-2, crownY - headSize * 0.15, 1.2).fill({ color: 0xff3333, alpha: 0.75 });
  g.circle(-2, crownY - headSize * 0.15, 2).fill({ color: 0xff3333, alpha: 0.08 });
  g.circle(2, crownY - headSize * 0.15, 1.2).fill({ color: 0x3333ff, alpha: 0.75 });
  g.circle(2, crownY - headSize * 0.15, 2).fill({ color: 0x3333ff, alpha: 0.08 });
  g.circle(0, crownY - headSize * 0.35, 0.8).fill({ color: 0xffffff, alpha: 0.5 }); // center diamond
}

// ─── World Details ──────────────────────────────────────────────

function drawWorldDetail(g: Graphics, data: Enemy, size: number, bodyColor: number): void {
  const worldID = data.worldID;
  switch (worldID) {
    case 'scadrial':
      // Hemalurgic spike(s)
      if (data.tier !== 'minion') {
        g.rect(-0.6, -size * 1.3, 1.2, size * 0.9).fill({ color: 0x888888, alpha: 0.65 });
        g.rect(-0.3, -size * 1.3, 0.5, size * 0.9).fill({ color: 0xaaaaaa, alpha: 0.2 }); // highlight
        // Blood drip at spike point
        g.circle(0, size * 0.9 - size * 1.3, 0.8).fill({ color: 0x880000, alpha: 0.3 });
      }
      break;
    case 'roshar':
      // Carapace armor pieces with volume
      g.ellipse(-size * 0.4, -size * 0.5, size * 0.32, size * 0.42)
        .fill({ color: 0x334455, alpha: 0.42 });
      g.ellipse(-size * 0.4, -size * 0.55, size * 0.2, size * 0.25)
        .fill({ color: 0x445566, alpha: 0.2 }); // highlight
      g.ellipse(size * 0.4, -size * 0.5, size * 0.32, size * 0.42)
        .fill({ color: 0x334455, alpha: 0.42 });
      break;
    case 'taldain':
      // Sand markings with glow
      g.moveTo(-size * 0.3, -size * 0.3)
        .lineTo(size * 0.3, -size * 0.8)
        .stroke({ color: 0xddcc88, width: 1.2, alpha: 0.35 });
      g.moveTo(-size * 0.3, -size * 0.3)
        .lineTo(size * 0.3, -size * 0.8)
        .stroke({ color: 0xddcc88, width: 3, alpha: 0.05 });
      break;
    case 'nalthis':
      // Multi-color aura (BioChroma)
      g.circle(0, -size * 0.5, size * 0.7).fill({ color: 0xaa44ff, alpha: 0.05 });
      g.circle(0, -size * 0.5, size * 0.5).fill({ color: 0x44aaff, alpha: 0.04 });
      g.circle(0, -size * 0.5, size * 0.3).fill({ color: 0xff44aa, alpha: 0.03 });
      break;
    case 'sel':
      // Aon glow mark — more detail
      g.circle(0, -size * 0.6, size * 0.3).fill({ color: 0xddaa44, alpha: 0.06 });
      g.circle(0, -size * 0.6, size * 0.25).stroke({ color: 0xddaa44, width: 0.8, alpha: 0.4 });
      g.moveTo(0, -size * 0.85).lineTo(0, -size * 0.35)
        .stroke({ color: 0xddaa44, width: 0.4, alpha: 0.2 });
      break;
    case 'komashi':
      // Ink drip effect — more organic
      g.circle(-size * 0.2, 1, 2.2).fill({ color: 0x111122, alpha: 0.42 });
      g.circle(-size * 0.2, 1, 3).fill({ color: 0x111122, alpha: 0.06 });
      g.circle(size * 0.3, 2, 1.7).fill({ color: 0x111122, alpha: 0.32 });
      // Ink trail
      g.moveTo(-size * 0.2, 1).lineTo(-size * 0.1, 4)
        .stroke({ color: 0x111122, width: 0.5, alpha: 0.2 });
      break;
    case 'shadesmar':
      // Cognitive shimmer — layered
      g.circle(0, -size * 0.5, size * 1.1).fill({ color: 0x4433aa, alpha: 0.03 });
      g.circle(0, -size * 0.5, size * 0.8).fill({ color: 0x6655aa, alpha: 0.04 });
      g.circle(0, -size * 0.5, size * 0.5).fill({ color: 0x8877cc, alpha: 0.03 });
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

// ─── Outlined Enemy Drawing ────────────────────────────────────

/**
 * Draw enemy with a 1px dark outline for improved readability.
 * Renders the enemy 4 times offset by 1px in each direction
 * with a dark tint, then the normal sprite on top.
 */
export function drawOutlinedEnemy(
  g: Graphics, data: Enemy, size: number,
  outlineColor: number = 0x000000,
  outlineAlpha: number = 0.5,
): void {
  const offsets = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  // Draw outline copies (shifted in each cardinal direction)
  for (const [dx, dy] of offsets) {
    g.setTransform(dx, dy);
    drawEnemySilhouette(g, data, size, outlineColor, outlineAlpha);
  }

  // Draw normal sprite on top
  g.setTransform(0, 0);
  drawEnemySprite(g, data, size);
}

/** Simplified silhouette for outline pass */
function drawEnemySilhouette(
  g: Graphics, data: Enemy, size: number,
  color: number, alpha: number,
): void {
  const headY = -size * 1.8;
  const bodyScale = data.tier === 'boss' ? 1.3 : data.tier === 'elite' ? 1.1 : 1;
  const w = size * bodyScale;
  const h = -headY * bodyScale;

  // Simple body ellipse silhouette
  g.ellipse(0, headY * 0.4, w, h * 0.5).fill({ color, alpha });
  // Head circle
  g.circle(0, headY * 0.85, size * 0.5 * bodyScale).fill({ color, alpha });
}

// ─── Hit Flash Effect ──────────────────────────────────────────

/**
 * Apply a bright white flash to an enemy Graphics.
 * Call this on hit, then restore after ~50ms.
 */
export function applyHitFlash(g: Graphics): void {
  // Store original tint
  const origTint = g.tint;
  g.tint = 0xffffff;
  g.alpha = 1.5; // Overexpose briefly

  setTimeout(() => {
    g.tint = origTint;
    g.alpha = 1;
  }, 60);
}

/**
 * Draw hit impact sparks at a point.
 * Returns spark data for animation.
 */
export function createHitSparks(
  parent: Container,
  x: number, y: number,
  color: number = 0xffffff,
  count: number = 5,
): void {
  for (let i = 0; i < count; i++) {
    const spark = new Graphics();
    const angle = Math.random() * Math.PI * 2;
    const speed = 30 + Math.random() * 40;
    const size = 0.5 + Math.random() * 1;

    spark.circle(0, 0, size).fill({ color, alpha: 0.8 });
    spark.circle(0, 0, size * 2).fill({ color, alpha: 0.15 });
    spark.x = x;
    spark.y = y;
    spark.zIndex = 100000;
    parent.addChild(spark);

    let life = 0;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed - 20;
    let lastT = performance.now();

    const anim = () => {
      if (spark.destroyed) return;
      const now = performance.now();
      const dt = (now - lastT) / 1000;
      lastT = now;
      life += dt;

      spark.x += vx * dt;
      spark.y += vy * dt + 60 * dt * life; // Gravity
      spark.alpha = Math.max(0, 1 - life / 0.3);

      if (life < 0.3) requestAnimationFrame(anim);
      else { parent.removeChild(spark); spark.destroy(); }
    };
    requestAnimationFrame(anim);
  }
}
