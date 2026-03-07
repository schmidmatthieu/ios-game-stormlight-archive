// ─── Wall System ────────────────────────────────────────────────

import { Container, Graphics } from 'pixi.js';
import { seededRandom } from '../scenes/IsoUtils';
import { lighten, darken } from '../utils/ColorUtils';

export interface WallSegment {
  x: number;
  y: number;
  width: number;
  height: number;
  sprite: Graphics;
}

export const WALL_COLORS: Record<string, { main: number; accent: number; trim: number }> = {
  scadrial:  { main: 0x3a3028, accent: 0x4a4038, trim: 0x2a2018 },
  roshar:    { main: 0x556677, accent: 0x667788, trim: 0x445566 },
  nalthis:   { main: 0x446644, accent: 0x558855, trim: 0x335533 },
  taldain:   { main: 0x665544, accent: 0x776655, trim: 0x554433 },
  sel:       { main: 0x887766, accent: 0x998877, trim: 0x776655 },
  komashi:   { main: 0x443344, accent: 0x554455, trim: 0x332233 },
  shadesmar: { main: 0x333355, accent: 0x444466, trim: 0x222244 },
};

interface WallPos {
  col: number;
  row: number;
}

export function spawnWalls(
  worldContainer: Container,
  isoToScreen: (col: number, row: number) => { x: number; y: number },
  gridWidth: number,
  gridHeight: number,
  worldID: string,
  spawnPos: { col: number; row: number },
  exits: Array<{ exitPosition: { col: number; row: number } }>,
  npcs: Array<{ position: { col: number; row: number } }>,
): WallSegment[] {
  const walls: WallSegment[] = [];
  const colors = WALL_COLORS[worldID] ?? WALL_COLORS.scadrial;

  // Border walls along edges with gaps for exits
  const edgeSegments = generateEdgeWalls(gridWidth, gridHeight, exits);

  for (const seg of edgeSegments) {
    const pos = isoToScreen(seg.col, seg.row);
    const g = new Graphics();

    // Wall base
    const h = 18 + seededRandom(seg.col * 7 + seg.row * 13) * 8;
    g.rect(pos.x - 10, pos.y - h, 20, h)
      .fill({ color: colors.main, alpha: 0.8 });
    // Front face
    g.rect(pos.x - 10, pos.y - h, 10, h)
      .fill({ color: darken(colors.main, 0.15), alpha: 0.8 });
    // Top
    g.poly([
      { x: pos.x - 12, y: pos.y - h },
      { x: pos.x, y: pos.y - h - 6 },
      { x: pos.x + 12, y: pos.y - h },
      { x: pos.x, y: pos.y - h + 2 },
    ]).fill({ color: lighten(colors.main, 0.1), alpha: 0.7 });

    // Occasional crack detail
    if (seededRandom(seg.col * 31 + seg.row * 17) > 0.6) {
      const cx = pos.x - 5 + seededRandom(seg.col * 11 + seg.row * 23) * 10;
      g.moveTo(cx, pos.y - h * 0.3)
        .lineTo(cx + 2, pos.y - h * 0.6)
        .lineTo(cx - 1, pos.y - h * 0.8)
        .stroke({ color: darken(colors.main, 0.3), width: 0.8, alpha: 0.4 });
    }

    g.x = 0;
    g.y = 0;
    g.zIndex = pos.y;
    worldContainer.addChild(g);

    walls.push({
      x: pos.x, y: pos.y,
      width: 20, height: h,
      sprite: g,
    });
  }

  // Interior walls - create corridors and rooms
  const interiorWalls = generateInteriorWalls(gridWidth, gridHeight, spawnPos, exits, npcs, worldID);
  for (const seg of interiorWalls) {
    const pos = isoToScreen(seg.col, seg.row);
    const g = new Graphics();
    const h = 14 + seededRandom(seg.col * 11 + seg.row * 7) * 6;

    g.rect(pos.x - 8, pos.y - h, 16, h)
      .fill({ color: colors.accent, alpha: 0.7 });
    g.rect(pos.x - 8, pos.y - h, 8, h)
      .fill({ color: darken(colors.accent, 0.12), alpha: 0.7 });

    g.zIndex = pos.y;
    worldContainer.addChild(g);

    walls.push({ x: pos.x, y: pos.y, width: 16, height: h, sprite: g });
  }

  return walls;
}

function generateEdgeWalls(
  gw: number, gh: number,
  exits: Array<{ exitPosition: { col: number; row: number } }>,
): WallPos[] {
  const walls: WallPos[] = [];

  for (let col = 0; col < gw; col += 2) {
    if (!isNearExit(col, 0, exits)) walls.push({ col, row: 0 });
    if (!isNearExit(col, gh - 1, exits)) walls.push({ col, row: gh - 1 });
  }
  for (let row = 0; row < gh; row += 2) {
    if (!isNearExit(0, row, exits)) walls.push({ col: 0, row });
    if (!isNearExit(gw - 1, row, exits)) walls.push({ col: gw - 1, row });
  }

  return walls;
}

function isNearExit(col: number, row: number, exits: Array<{ exitPosition: { col: number; row: number } }>): boolean {
  return exits.some(e => Math.abs(e.exitPosition.col - col) < 3 && Math.abs(e.exitPosition.row - row) < 3);
}

function generateInteriorWalls(
  gw: number, gh: number,
  spawnPos: { col: number; row: number },
  exits: Array<{ exitPosition: { col: number; row: number } }>,
  npcs: Array<{ position: { col: number; row: number } }>,
  worldID: string,
): WallPos[] {
  const walls: WallPos[] = [];
  const seed = gw * 997 + gh * 1013;

  const wallCount = 2 + Math.floor(seededRandom(seed) * 3);

  for (let w = 0; w < wallCount; w++) {
    const horizontal = seededRandom(seed + w * 100) > 0.5;
    const startCol = 3 + Math.floor(seededRandom(seed + w * 200) * (gw - 6));
    const startRow = 3 + Math.floor(seededRandom(seed + w * 300) * (gh - 6));
    const length = 3 + Math.floor(seededRandom(seed + w * 400) * 5);
    const gapPos = Math.floor(seededRandom(seed + w * 500) * length);

    for (let i = 0; i < length; i++) {
      if (i === gapPos || i === gapPos + 1) continue;

      const col = horizontal ? startCol + i : startCol;
      const row = horizontal ? startRow : startRow + i;

      if (col < 2 || col >= gw - 2 || row < 2 || row >= gh - 2) continue;

      const nearSpawn = Math.hypot(col - spawnPos.col, row - spawnPos.row) < 4;
      const nearExit = exits.some(e => Math.hypot(col - e.exitPosition.col, row - e.exitPosition.row) < 3);
      const nearNPC = npcs.some(n => Math.hypot(col - n.position.col, row - n.position.row) < 3);
      if (nearSpawn || nearExit || nearNPC) continue;

      walls.push({ col, row });
    }
  }

  return walls;
}
