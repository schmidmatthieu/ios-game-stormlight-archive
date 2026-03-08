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
    const wallSeed = seg.col * 7 + seg.row * 13;

    // Wall base
    const h = 20 + seededRandom(wallSeed) * 10;
    const sideDepth = 10;

    // Ground shadow
    g.ellipse(pos.x + 2, pos.y + 2, 14, 4)
      .fill({ color: 0x000000, alpha: 0.12 });

    // Side face (darker, right)
    g.poly([
      { x: pos.x + 10, y: pos.y },
      { x: pos.x + 10, y: pos.y - h },
      { x: pos.x + 10 + sideDepth, y: pos.y - h + 5 },
      { x: pos.x + 10 + sideDepth, y: pos.y + 5 },
    ]).fill({ color: darken(colors.main, 0.25), alpha: 0.85 });

    // Front face
    g.rect(pos.x - 10, pos.y - h, 20, h)
      .fill({ color: colors.main, alpha: 0.85 });

    // Brick/stone pattern on front face
    const brickH = 4;
    const brickRows = Math.floor(h / brickH);
    for (let br = 0; br < brickRows; br++) {
      const by = pos.y - h + br * brickH;
      const offset = br % 2 === 0 ? 0 : 5;
      // Horizontal mortar line
      g.moveTo(pos.x - 10, by).lineTo(pos.x + 10, by)
        .stroke({ color: darken(colors.main, 0.15), width: 0.4, alpha: 0.25 });
      // Vertical mortar lines
      for (let bx = -10 + offset; bx < 10; bx += 10) {
        g.moveTo(pos.x + bx, by).lineTo(pos.x + bx, by + brickH)
          .stroke({ color: darken(colors.main, 0.15), width: 0.3, alpha: 0.2 });
      }
    }

    // Front face edge highlight (left)
    g.moveTo(pos.x - 10, pos.y - h).lineTo(pos.x - 10, pos.y)
      .stroke({ color: lighten(colors.main, 0.15), width: 0.6, alpha: 0.25 });

    // Top face (isometric)
    g.poly([
      { x: pos.x - 12, y: pos.y - h },
      { x: pos.x, y: pos.y - h - 6 },
      { x: pos.x + 12 + sideDepth, y: pos.y - h - 1 },
      { x: pos.x + sideDepth, y: pos.y - h + 5 },
    ]).fill({ color: lighten(colors.main, 0.12), alpha: 0.75 });
    // Top face border
    g.poly([
      { x: pos.x - 12, y: pos.y - h },
      { x: pos.x, y: pos.y - h - 6 },
      { x: pos.x + 12 + sideDepth, y: pos.y - h - 1 },
      { x: pos.x + sideDepth, y: pos.y - h + 5 },
    ]).stroke({ color: lighten(colors.main, 0.2), width: 0.4, alpha: 0.3 });

    // Cracks and details
    const detail = seededRandom(seg.col * 31 + seg.row * 17);
    if (detail > 0.55) {
      // Crack
      const cx = pos.x - 5 + seededRandom(seg.col * 11 + seg.row * 23) * 10;
      g.moveTo(cx, pos.y - h * 0.3)
        .lineTo(cx + 2, pos.y - h * 0.5)
        .lineTo(cx - 1, pos.y - h * 0.7)
        .stroke({ color: darken(colors.main, 0.35), width: 0.8, alpha: 0.35 });
    }
    if (detail > 0.75) {
      // Moss/lichen at base
      const mossY = pos.y - 3;
      g.ellipse(pos.x - 4, mossY, 4, 2)
        .fill({ color: 0x335522, alpha: 0.2 });
      g.ellipse(pos.x + 3, mossY - 1, 3, 1.5)
        .fill({ color: 0x446633, alpha: 0.15 });
    }

    // Torch on every 4th wall segment
    if (seg.col % 4 === 0 && seg.row % 4 === 0) {
      const ty = pos.y - h * 0.6;
      // Bracket
      g.rect(pos.x - 1, ty, 2, 6).fill({ color: 0x554433, alpha: 0.8 });
      // Flame
      g.circle(pos.x, ty - 1, 3).fill({ color: 0xff8822, alpha: 0.2 });
      g.circle(pos.x, ty, 2).fill({ color: 0xffaa33, alpha: 0.3 });
      g.circle(pos.x, ty + 1, 1).fill({ color: 0xffdd66, alpha: 0.5 });
      // Light pool on ground
      g.ellipse(pos.x, pos.y, 12, 5).fill({ color: 0xffaa33, alpha: 0.04 });
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

    // Small shadow
    g.ellipse(pos.x + 1, pos.y + 1, 10, 3)
      .fill({ color: 0x000000, alpha: 0.08 });

    // Side face
    g.poly([
      { x: pos.x + 8, y: pos.y },
      { x: pos.x + 8, y: pos.y - h },
      { x: pos.x + 15, y: pos.y - h + 3 },
      { x: pos.x + 15, y: pos.y + 3 },
    ]).fill({ color: darken(colors.accent, 0.2), alpha: 0.7 });

    // Front face
    g.rect(pos.x - 8, pos.y - h, 16, h)
      .fill({ color: colors.accent, alpha: 0.75 });

    // Brick lines
    for (let br = 0; br < Math.floor(h / 5); br++) {
      const by = pos.y - h + br * 5;
      g.moveTo(pos.x - 8, by).lineTo(pos.x + 8, by)
        .stroke({ color: darken(colors.accent, 0.12), width: 0.3, alpha: 0.2 });
    }

    // Left edge highlight
    g.moveTo(pos.x - 8, pos.y - h).lineTo(pos.x - 8, pos.y)
      .stroke({ color: lighten(colors.accent, 0.12), width: 0.4, alpha: 0.2 });

    // Top face
    g.poly([
      { x: pos.x - 9, y: pos.y - h },
      { x: pos.x, y: pos.y - h - 4 },
      { x: pos.x + 16, y: pos.y - h - 1 },
      { x: pos.x + 7, y: pos.y - h + 3 },
    ]).fill({ color: lighten(colors.accent, 0.08), alpha: 0.65 });

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
