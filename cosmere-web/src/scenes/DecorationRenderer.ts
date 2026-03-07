// ─── Decoration Renderer (tilemap, decorations, buildings, terrain) ──

import { Container, Graphics } from 'pixi.js';
import { isoToScreen, seededRandom } from './IsoUtils';
import type { WorldTheme } from './WorldThemes';
import type { Zone } from '../data/types';
import { darken, lighten } from '../utils/ColorUtils';

// ─── Tilemap ─────────────────────────────────────────────────

export function renderTilemap(container: Container, zone: Zone, theme: WorldTheme): void {
  const gw = zone.gridWidth;
  const gh = zone.gridHeight;

  const tileGraphics = new Graphics();
  tileGraphics.zIndex = -1000;

  for (let col = 0; col < gw; col++) {
    for (let row = 0; row < gh; row++) {
      const { x, y } = isoToScreen(col, row);
      const seed = col * 1000 + row;
      const rand = seededRandom(seed);

      let color: number;
      if (rand < 0.15) {
        color = theme.tileAlt;
      } else if (rand < 0.25) {
        color = darken(theme.tileBase, 0.15);
      } else {
        const variation = Math.floor(seededRandom(seed + 7) * 3) * 0x020202;
        color = theme.tileBase + variation;
      }

      const isEdge = col === 0 || row === 0 || col === gw - 1 || row === gh - 1;
      const alpha = isEdge ? 0.6 : 0.95;

      tileGraphics.poly([
        { x, y: y - 16 }, { x: x + 32, y }, { x, y: y + 16 }, { x: x - 32, y },
      ]).fill({ color, alpha });

      tileGraphics.poly([
        { x, y: y - 16 }, { x: x + 32, y }, { x, y: y + 16 }, { x: x - 32, y },
      ]).stroke({ color: theme.tileBorder, width: 0.3, alpha: 0.4 });

      if (rand > 0.7 && rand < 0.85) {
        const cx = x + (seededRandom(seed + 3) - 0.5) * 20;
        const cy = y + (seededRandom(seed + 5) - 0.5) * 10;
        tileGraphics.circle(cx, cy, 1.5).fill({ color: theme.tileBorder, alpha: 0.3 });
      }
    }
  }

  container.addChild(tileGraphics);
}

export function renderMapEdge(container: Container, zone: Zone, theme: WorldTheme): void {
  const gw = zone.gridWidth;
  const gh = zone.gridHeight;
  const edge = new Graphics();
  edge.zIndex = -999;

  const corners = [
    isoToScreen(0, 0),
    isoToScreen(gw - 1, 0),
    isoToScreen(gw - 1, gh - 1),
    isoToScreen(0, gh - 1),
  ];

  edge.poly([
    { x: corners[0].x, y: corners[0].y - 16 },
    { x: corners[1].x + 32, y: corners[1].y },
    { x: corners[2].x, y: corners[2].y + 16 },
    { x: corners[3].x - 32, y: corners[3].y },
  ]).stroke({ color: theme.edgeGlow, width: 3, alpha: 0.5 });

  container.addChild(edge);
}

// ─── Decorations ─────────────────────────────────────────────

export function spawnDecorations(container: Container, zone: Zone, theme: WorldTheme): void {
  const gw = zone.gridWidth;
  const gh = zone.gridHeight;
  const density = zone.type === 'hub' ? 0.14 : 0.10;

  for (let col = 0; col < gw; col++) {
    for (let row = 0; row < gh; row++) {
      const seed = col * 1337 + row * 7919;
      const rand = seededRandom(seed);
      if (rand > density) continue;

      const spawnDist = Math.hypot(col - zone.playerSpawnPosition.col, row - zone.playerSpawnPosition.row);
      if (spawnDist < 3) continue;

      const occupiedByNPC = zone.npcSpawns.some(n => Math.abs(n.position.col - col) < 2 && Math.abs(n.position.row - row) < 2);
      const occupiedByEnemy = zone.enemySpawns.some(e => Math.abs(e.position.col - col) < 2 && Math.abs(e.position.row - row) < 2);
      const occupiedByExit = zone.connections.some(c => Math.abs(c.exitPosition.col - col) < 2 && Math.abs(c.exitPosition.row - row) < 2);
      if (occupiedByNPC || occupiedByEnemy || occupiedByExit) continue;

      const pos = isoToScreen(col, row);
      const decoType = Math.floor(seededRandom(seed + 42) * 8);
      const deco = createDecoration(decoType, pos, seed, zone.worldID);
      if (deco) {
        deco.zIndex = pos.y;
        container.addChild(deco);
      }
    }
  }

  if (zone.type === 'hub') {
    spawnBuildings(container, zone);
  }

  spawnTerrainRelief(container, zone, theme);
}

function spawnBuildings(container: Container, zone: Zone): void {
  const gw = zone.gridWidth;
  const gh = zone.gridHeight;

  const buildingCount = 3 + Math.floor(seededRandom(gw * gh) * 3);
  for (let i = 0; i < buildingCount; i++) {
    const seed = i * 3571 + gw * 97;
    const col = 2 + Math.floor(seededRandom(seed) * (gw - 4));
    const row = 2 + Math.floor(seededRandom(seed + 1) * (gh - 4));

    const spawnDist = Math.hypot(col - zone.playerSpawnPosition.col, row - zone.playerSpawnPosition.row);
    if (spawnDist < 4) continue;
    const occupied = zone.npcSpawns.some(n => Math.abs(n.position.col - col) < 3 && Math.abs(n.position.row - row) < 3) ||
                     zone.enemySpawns.some(e => Math.abs(e.position.col - col) < 3 && Math.abs(e.position.row - row) < 3);
    if (occupied) continue;

    const pos = isoToScreen(col, row);
    const buildingType = Math.floor(seededRandom(seed + 7) * 4);
    const building = createBuilding(buildingType, pos, zone.worldID);
    building.zIndex = pos.y;
    container.addChild(building);
  }
}

function createBuilding(type: number, pos: { x: number; y: number }, worldID: string): Graphics {
  const g = new Graphics();
  const wallColor = worldID === 'scadrial' ? 0x3a3028 : worldID === 'roshar' ? 0x445566 :
                    worldID === 'nalthis' ? 0x446644 : worldID === 'taldain' ? 0x554433 :
                    worldID === 'shadesmar' ? 0x222244 : 0x443344;
  const roofColor = worldID === 'scadrial' ? 0x554433 : worldID === 'roshar' ? 0x556688 :
                    worldID === 'nalthis' ? 0x338844 : worldID === 'taldain' ? 0x887755 :
                    worldID === 'shadesmar' ? 0x443366 : 0x554455;

  switch (type) {
    case 0:
      g.poly([
        { x: pos.x - 16, y: pos.y }, { x: pos.x, y: pos.y - 8 },
        { x: pos.x + 16, y: pos.y }, { x: pos.x + 16, y: pos.y - 24 },
        { x: pos.x, y: pos.y - 32 }, { x: pos.x - 16, y: pos.y - 24 },
      ]).fill({ color: wallColor, alpha: 0.85 });
      g.poly([
        { x: pos.x - 16, y: pos.y }, { x: pos.x, y: pos.y - 8 },
        { x: pos.x, y: pos.y - 32 }, { x: pos.x - 16, y: pos.y - 24 },
      ]).fill({ color: darken(wallColor, 0.15), alpha: 0.85 });
      g.poly([
        { x: pos.x - 18, y: pos.y - 24 }, { x: pos.x, y: pos.y - 38 },
        { x: pos.x + 18, y: pos.y - 24 }, { x: pos.x, y: pos.y - 32 },
      ]).fill({ color: roofColor, alpha: 0.9 });
      g.roundRect(pos.x - 10, pos.y - 12, 5, 8, 1).fill({ color: 0x332211, alpha: 0.8 });
      g.rect(pos.x + 2, pos.y - 24, 4, 4).fill({ color: 0xeebb44, alpha: 0.4 });
      break;
    case 1:
      g.rect(pos.x - 8, pos.y - 40, 16, 40).fill({ color: wallColor, alpha: 0.85 });
      g.rect(pos.x - 8, pos.y - 40, 8, 40).fill({ color: darken(wallColor, 0.1), alpha: 0.85 });
      for (let b = 0; b < 4; b++) {
        g.rect(pos.x - 9 + b * 5, pos.y - 46, 4, 6).fill({ color: wallColor, alpha: 0.8 });
      }
      g.rect(pos.x - 2, pos.y - 30, 2, 5).fill({ color: 0xeebb44, alpha: 0.3 });
      g.rect(pos.x - 2, pos.y - 18, 2, 5).fill({ color: 0xeebb44, alpha: 0.3 });
      break;
    case 2:
      g.rect(pos.x - 14, pos.y - 16, 2, 16).fill({ color: 0x553322, alpha: 0.8 });
      g.rect(pos.x + 12, pos.y - 16, 2, 16).fill({ color: 0x553322, alpha: 0.8 });
      g.poly([
        { x: pos.x - 16, y: pos.y - 16 }, { x: pos.x, y: pos.y - 22 },
        { x: pos.x + 16, y: pos.y - 16 },
      ]).fill({ color: 0xcc7733, alpha: 0.7 });
      g.rect(pos.x - 10, pos.y - 6, 20, 4).fill({ color: 0x664422, alpha: 0.8 });
      g.circle(pos.x - 4, pos.y - 8, 2).fill({ color: 0xee4444, alpha: 0.6 });
      g.circle(pos.x + 2, pos.y - 8, 2).fill({ color: 0x44ee44, alpha: 0.6 });
      g.circle(pos.x + 6, pos.y - 8, 1.5).fill({ color: 0xeeee44, alpha: 0.6 });
      break;
    case 3:
      g.poly([
        { x: pos.x - 18, y: pos.y }, { x: pos.x - 18, y: pos.y - 20 },
        { x: pos.x - 12, y: pos.y - 26 }, { x: pos.x - 6, y: pos.y - 18 },
        { x: pos.x, y: pos.y - 22 }, { x: pos.x + 6, y: pos.y - 14 },
        { x: pos.x + 10, y: pos.y },
      ]).fill({ color: darken(wallColor, 0.2), alpha: 0.7 });
      g.circle(pos.x + 8, pos.y - 2, 3).fill({ color: darken(wallColor, 0.3), alpha: 0.5 });
      g.circle(pos.x + 12, pos.y - 1, 2).fill({ color: darken(wallColor, 0.25), alpha: 0.5 });
      break;
  }

  return g;
}

function spawnTerrainRelief(container: Container, zone: Zone, theme: WorldTheme): void {
  const gw = zone.gridWidth;
  const gh = zone.gridHeight;

  const patchCount = 3 + Math.floor(seededRandom(gw + gh * 13) * 4);
  for (let i = 0; i < patchCount; i++) {
    const seed = i * 4517 + gw * 31;
    const col = 1 + Math.floor(seededRandom(seed) * (gw - 2));
    const row = 1 + Math.floor(seededRandom(seed + 1) * (gh - 2));
    const spawnDist = Math.hypot(col - zone.playerSpawnPosition.col, row - zone.playerSpawnPosition.row);
    if (spawnDist < 3) continue;

    const pos = isoToScreen(col, row);
    const size = 10 + seededRandom(seed + 2) * 18;
    const height = 3 + seededRandom(seed + 3) * 6;

    const g = new Graphics();
    g.ellipse(pos.x, pos.y, size, size * 0.5).fill({ color: darken(theme.tileBase, 0.25), alpha: 0.5 });
    g.ellipse(pos.x, pos.y + height, size * 0.9, size * 0.45).fill({ color: 0x000000, alpha: 0.15 });
    g.ellipse(pos.x, pos.y - height, size * 0.8, size * 0.4).fill({ color: lighten(theme.tileBase, 0.15), alpha: 0.4 });

    g.zIndex = pos.y - 100;
    container.addChild(g);
  }
}

// ─── World-specific Decorations ──────────────────────────────

function createDecoration(type: number, pos: { x: number; y: number }, seed: number, worldID: string): Graphics | null {
  const g = new Graphics();

  switch (worldID) {
    case 'scadrial': return createScadrialDeco(g, type, pos, seed);
    case 'roshar':   return createRosharDeco(g, type, pos, seed);
    case 'nalthis':  return createNalthisDeco(g, type, pos, seed);
    case 'taldain':  return createTaldainDeco(g, type, pos, seed);
    case 'shadesmar': return createShadesmarDeco(g, type, pos, seed);
    case 'sel':      return createSelDeco(g, type, pos, seed);
    case 'komashi':  return createKomashiDeco(g, type, pos, seed);
    default:         return createGenericDeco(g, type, pos, seed);
  }
}

function createScadrialDeco(g: Graphics, type: number, pos: { x: number; y: number }, seed: number): Graphics | null {
  switch (type) {
    case 0:
      g.ellipse(pos.x, pos.y, 8 + seededRandom(seed + 1) * 6, 4).fill({ color: 0x444038, alpha: 0.6 });
      g.ellipse(pos.x + 3, pos.y - 1, 4, 2.5).fill({ color: 0x555048, alpha: 0.4 });
      break;
    case 1:
      g.rect(pos.x - 1.5, pos.y - 22, 3, 22).fill({ color: 0x3a2a1a, alpha: 0.8 });
      g.moveTo(pos.x, pos.y - 18).lineTo(pos.x - 8, pos.y - 26).stroke({ color: 0x3a2a1a, width: 1.5, alpha: 0.7 });
      g.moveTo(pos.x, pos.y - 14).lineTo(pos.x + 6, pos.y - 22).stroke({ color: 0x3a2a1a, width: 1.5, alpha: 0.7 });
      g.moveTo(pos.x, pos.y - 10).lineTo(pos.x - 5, pos.y - 16).stroke({ color: 0x3a2a1a, width: 1, alpha: 0.5 });
      break;
    case 2:
      g.poly([
        { x: pos.x, y: pos.y - 12 }, { x: pos.x + 4, y: pos.y - 2 },
        { x: pos.x + 2, y: pos.y }, { x: pos.x - 2, y: pos.y }, { x: pos.x - 3, y: pos.y - 4 },
      ]).fill({ color: 0x667788, alpha: 0.6 });
      g.poly([
        { x: pos.x, y: pos.y - 12 }, { x: pos.x + 1, y: pos.y - 3 }, { x: pos.x - 1, y: pos.y - 2 },
      ]).fill({ color: 0x8899aa, alpha: 0.3 });
      break;
    case 3:
      g.rect(pos.x - 10, pos.y - 14, 20, 14).fill({ color: 0x3a3030, alpha: 0.7 });
      g.rect(pos.x - 8, pos.y - 18, 6, 4).fill({ color: 0x3a3030, alpha: 0.5 });
      g.rect(pos.x + 2, pos.y - 16, 4, 2).fill({ color: 0x3a3030, alpha: 0.4 });
      break;
    case 4:
      g.ellipse(pos.x, pos.y - 3, 6, 4).fill({ color: 0x443322, alpha: 0.8 });
      g.rect(pos.x - 6, pos.y - 12, 12, 9).fill({ color: 0x553322, alpha: 0.8 });
      g.ellipse(pos.x, pos.y - 12, 6, 4).fill({ color: 0x664433, alpha: 0.8 });
      g.rect(pos.x - 6, pos.y - 7, 12, 1).fill({ color: 0x443322, alpha: 0.5 });
      break;
    case 5:
      g.rect(pos.x - 1, pos.y - 20, 2, 20).fill({ color: 0x444444, alpha: 0.7 });
      g.rect(pos.x - 3, pos.y - 22, 6, 4).fill({ color: 0x555555, alpha: 0.7 });
      g.circle(pos.x, pos.y - 22, 3).fill({ color: 0xffaa33, alpha: 0.4 });
      g.circle(pos.x, pos.y - 22, 6).fill({ color: 0xffaa33, alpha: 0.08 });
      break;
    case 6:
      g.rect(pos.x - 7, pos.y - 8, 14, 8).fill({ color: 0x554422, alpha: 0.8 });
      g.rect(pos.x - 5, pos.y - 14, 10, 6).fill({ color: 0x665533, alpha: 0.8 });
      g.rect(pos.x - 7, pos.y - 4, 14, 0.8).fill({ color: 0x443311, alpha: 0.5 });
      break;
    case 7:
      g.rect(pos.x - 12, pos.y - 6, 24, 6).fill({ color: 0x443322, alpha: 0.7 });
      g.circle(pos.x - 10, pos.y, 4).stroke({ color: 0x553322, width: 1.5, alpha: 0.6 });
      g.circle(pos.x + 10, pos.y, 4).stroke({ color: 0x553322, width: 1.5, alpha: 0.6 });
      g.rect(pos.x - 4, pos.y - 10, 2, 6).fill({ color: 0x443322, alpha: 0.6 });
      break;
    default: return null;
  }
  return g;
}

function createRosharDeco(g: Graphics, type: number, pos: { x: number; y: number }, seed: number): Graphics | null {
  switch (type) {
    case 0:
      g.poly([
        { x: pos.x - 8, y: pos.y }, { x: pos.x - 5, y: pos.y - 16 },
        { x: pos.x + 2, y: pos.y - 20 }, { x: pos.x + 8, y: pos.y - 10 }, { x: pos.x + 6, y: pos.y },
      ]).fill({ color: 0x556677, alpha: 0.7 });
      g.ellipse(pos.x, pos.y, 10, 4).fill({ color: 0x445566, alpha: 0.3 });
      break;
    case 1:
      g.rect(pos.x - 2, pos.y - 28, 4, 28).fill({ color: 0x445566, alpha: 0.8 });
      g.circle(pos.x, pos.y - 30, 4).fill({ color: 0x66aaff, alpha: 0.5 });
      g.circle(pos.x, pos.y - 30, 8).fill({ color: 0x66aaff, alpha: 0.08 });
      break;
    case 2:
      g.ellipse(pos.x, pos.y - 4, 8, 5).fill({ color: 0x667755, alpha: 0.6 });
      g.ellipse(pos.x, pos.y - 6, 6, 3).fill({ color: 0x778866, alpha: 0.4 });
      break;
    case 3:
      for (let i = 0; i < 3; i++) {
        const sx = pos.x + (seededRandom(seed + i * 3) - 0.5) * 10;
        const sy = pos.y - 2 + (seededRandom(seed + i * 3 + 1) - 0.5) * 6;
        g.circle(sx, sy, 2).fill({ color: 0x66aaff, alpha: 0.5 });
        g.circle(sx, sy, 4).fill({ color: 0x88ccff, alpha: 0.1 });
      }
      break;
    case 4:
      for (let i = 0; i < 4; i++) {
        const vx = pos.x + (seededRandom(seed + i * 5) - 0.5) * 12;
        g.moveTo(vx, pos.y).lineTo(vx + (seededRandom(seed + i * 5 + 2) - 0.5) * 6, pos.y - 8 - seededRandom(seed + i * 5 + 1) * 10)
          .stroke({ color: 0x446644, width: 1.2, alpha: 0.5 });
      }
      break;
    case 5:
      g.rect(pos.x - 10, pos.y - 16, 3, 16).fill({ color: 0x556677, alpha: 0.7 });
      g.rect(pos.x + 7, pos.y - 16, 3, 16).fill({ color: 0x556677, alpha: 0.7 });
      g.roundRect(pos.x - 11, pos.y - 18, 22, 4, 2).fill({ color: 0x667788, alpha: 0.7 });
      break;
    default:
      g.ellipse(pos.x, pos.y - 3, 6 + seededRandom(seed) * 4, 4).fill({ color: 0x445566, alpha: 0.6 });
      break;
  }
  return g;
}

function createNalthisDeco(g: Graphics, type: number, pos: { x: number; y: number }, seed: number): Graphics | null {
  switch (type) {
    case 0: {
      const petalColor = [0xff4466, 0x44aaff, 0xffaa22, 0xaa44ff, 0x44ff66][Math.floor(seededRandom(seed + 1) * 5)];
      g.circle(pos.x, pos.y - 6, 4).fill({ color: petalColor, alpha: 0.6 });
      g.circle(pos.x - 3, pos.y - 4, 3).fill({ color: petalColor, alpha: 0.4 });
      g.circle(pos.x + 3, pos.y - 4, 3).fill({ color: petalColor, alpha: 0.4 });
      g.rect(pos.x - 0.5, pos.y - 4, 1, 4).fill({ color: 0x336622, alpha: 0.6 });
      break;
    }
    case 1:
      g.circle(pos.x, pos.y - 6, 7).fill({ color: 0x336633, alpha: 0.6 });
      g.circle(pos.x - 4, pos.y - 4, 5).fill({ color: 0x448844, alpha: 0.5 });
      g.circle(pos.x + 3, pos.y - 8, 5).fill({ color: 0x44aa44, alpha: 0.4 });
      break;
    case 2:
      g.rect(pos.x - 4, pos.y - 18, 8, 18).fill({ color: 0x888888, alpha: 0.6 });
      g.circle(pos.x, pos.y - 22, 4).fill({ color: 0x999999, alpha: 0.6 });
      g.rect(pos.x - 6, pos.y - 2, 12, 3).fill({ color: 0x777777, alpha: 0.7 });
      break;
    case 3:
      g.ellipse(pos.x, pos.y, 10, 5).fill({ color: 0x556677, alpha: 0.6 });
      g.ellipse(pos.x, pos.y - 1, 8, 4).fill({ color: 0x4488bb, alpha: 0.4 });
      g.rect(pos.x - 1, pos.y - 10, 2, 10).fill({ color: 0x667788, alpha: 0.7 });
      g.circle(pos.x, pos.y - 10, 3).fill({ color: 0x66aacc, alpha: 0.4 });
      break;
    default:
      g.circle(pos.x, pos.y - 3, 4 + seededRandom(seed) * 3).fill({ color: 0x447744, alpha: 0.4 });
      break;
  }
  return g;
}

function createTaldainDeco(g: Graphics, type: number, pos: { x: number; y: number }, seed: number): Graphics | null {
  switch (type) {
    case 0:
      g.ellipse(pos.x, pos.y - 2, 14 + seededRandom(seed + 1) * 8, 5).fill({ color: 0x554422, alpha: 0.4 });
      g.ellipse(pos.x + 2, pos.y - 4, 8, 3).fill({ color: 0x665533, alpha: 0.3 });
      break;
    case 1:
      g.rect(pos.x - 2, pos.y - 16, 4, 16).fill({ color: 0x448833, alpha: 0.7 });
      g.rect(pos.x - 8, pos.y - 12, 6, 3).fill({ color: 0x448833, alpha: 0.6 });
      g.rect(pos.x - 8, pos.y - 16, 3, 7).fill({ color: 0x448833, alpha: 0.6 });
      g.rect(pos.x + 4, pos.y - 10, 5, 3).fill({ color: 0x448833, alpha: 0.6 });
      g.rect(pos.x + 6, pos.y - 14, 3, 7).fill({ color: 0x448833, alpha: 0.6 });
      break;
    case 2:
      g.poly([
        { x: pos.x - 6, y: pos.y }, { x: pos.x - 4, y: pos.y - 10 },
        { x: pos.x + 3, y: pos.y - 8 }, { x: pos.x + 6, y: pos.y },
      ]).fill({ color: 0x887755, alpha: 0.6 });
      break;
    default:
      g.ellipse(pos.x, pos.y - 1, 6, 3).fill({ color: 0x554422, alpha: 0.3 });
      break;
  }
  return g;
}

function createShadesmarDeco(g: Graphics, type: number, pos: { x: number; y: number }, seed: number): Graphics | null {
  switch (type) {
    case 0:
      for (let i = 0; i < 5; i++) {
        const bx = pos.x + (seededRandom(seed + i * 2) - 0.5) * 10;
        const by = pos.y - 1 + (seededRandom(seed + i * 2 + 1) - 0.5) * 5;
        g.circle(bx, by, 1.5 + seededRandom(seed + i) * 1).fill({ color: 0x8877cc, alpha: 0.5 });
      }
      break;
    case 1:
      g.circle(pos.x, pos.y - 8, 3).fill({ color: 0xff6633, alpha: 0.5 });
      g.circle(pos.x, pos.y - 8, 6).fill({ color: 0xff4422, alpha: 0.1 });
      g.poly([
        { x: pos.x - 2, y: pos.y - 8 }, { x: pos.x, y: pos.y - 16 }, { x: pos.x + 2, y: pos.y - 8 },
      ]).fill({ color: 0xff8844, alpha: 0.3 });
      break;
    case 2:
      g.rect(pos.x - 1, pos.y - 20, 2, 20).fill({ color: 0x6655aa, alpha: 0.5 });
      g.poly([
        { x: pos.x - 8, y: pos.y - 16 }, { x: pos.x, y: pos.y - 28 }, { x: pos.x + 8, y: pos.y - 16 },
      ]).fill({ color: 0x8877cc, alpha: 0.3 });
      g.poly([
        { x: pos.x - 6, y: pos.y - 20 }, { x: pos.x, y: pos.y - 30 }, { x: pos.x + 6, y: pos.y - 20 },
      ]).fill({ color: 0xaa99dd, alpha: 0.2 });
      break;
    default:
      g.circle(pos.x, pos.y - 3, 3).fill({ color: 0x7766bb, alpha: 0.3 });
      break;
  }
  return g;
}

function createSelDeco(g: Graphics, type: number, pos: { x: number; y: number }, _seed: number): Graphics | null {
  switch (type) {
    case 0:
      g.circle(pos.x, pos.y - 2, 6).stroke({ color: 0xddaa44, width: 1, alpha: 0.3 });
      g.moveTo(pos.x - 3, pos.y - 4).lineTo(pos.x + 3, pos.y).stroke({ color: 0xddaa44, width: 0.8, alpha: 0.25 });
      g.moveTo(pos.x - 3, pos.y).lineTo(pos.x + 3, pos.y - 4).stroke({ color: 0xddaa44, width: 0.8, alpha: 0.25 });
      break;
    case 1:
      g.rect(pos.x - 4, pos.y - 22, 8, 22).fill({ color: 0x888877, alpha: 0.7 });
      g.rect(pos.x - 5, pos.y - 24, 10, 3).fill({ color: 0x999988, alpha: 0.7 });
      g.rect(pos.x - 5, pos.y - 1, 10, 2).fill({ color: 0x777766, alpha: 0.7 });
      break;
    case 2:
      g.rect(pos.x - 8, pos.y - 4, 16, 4).fill({ color: 0x888877, alpha: 0.7 });
      g.poly([
        { x: pos.x - 6, y: pos.y - 4 }, { x: pos.x, y: pos.y - 14 }, { x: pos.x + 6, y: pos.y - 4 },
      ]).fill({ color: 0x999988, alpha: 0.6 });
      g.circle(pos.x, pos.y - 8, 2).fill({ color: 0xddaa44, alpha: 0.5 });
      break;
    default:
      g.ellipse(pos.x, pos.y - 1, 5, 3).fill({ color: 0x667755, alpha: 0.4 });
      break;
  }
  return g;
}

function createKomashiDeco(g: Graphics, type: number, pos: { x: number; y: number }, seed: number): Graphics | null {
  switch (type) {
    case 0:
      g.ellipse(pos.x, pos.y, 6 + seededRandom(seed) * 5, 3 + seededRandom(seed + 1) * 3).fill({ color: 0x111122, alpha: 0.5 });
      break;
    case 1:
      g.rect(pos.x - 1, pos.y - 16, 2, 14).fill({ color: 0x554422, alpha: 0.6 });
      g.ellipse(pos.x, pos.y - 18, 4, 5).fill({ color: 0xee8844, alpha: 0.5 });
      g.ellipse(pos.x, pos.y - 18, 6, 7).fill({ color: 0xffaa44, alpha: 0.1 });
      break;
    case 2:
      g.ellipse(pos.x, pos.y - 1, 5, 3).fill({ color: 0x555555, alpha: 0.6 });
      g.ellipse(pos.x, pos.y - 4, 4, 2.5).fill({ color: 0x666666, alpha: 0.6 });
      g.ellipse(pos.x, pos.y - 7, 3, 2).fill({ color: 0x777777, alpha: 0.6 });
      g.circle(pos.x, pos.y - 9.5, 1.5).fill({ color: 0x888888, alpha: 0.6 });
      break;
    default:
      g.rect(pos.x - 3, pos.y - 5, 6, 5).fill({ color: 0x332233, alpha: 0.3 });
      break;
  }
  return g;
}

function createGenericDeco(g: Graphics, type: number, pos: { x: number; y: number }, seed: number): Graphics | null {
  switch (type) {
    case 0:
      g.circle(pos.x, pos.y - 4, 5 + seededRandom(seed) * 3).fill({ color: 0x555555, alpha: 0.5 });
      break;
    case 1:
      g.circle(pos.x, pos.y - 5, 6).fill({ color: 0x335533, alpha: 0.5 });
      g.circle(pos.x + 3, pos.y - 7, 5).fill({ color: 0x336633, alpha: 0.4 });
      break;
    case 2:
      for (let i = 0; i < 4; i++) {
        const gx = pos.x + (seededRandom(seed + i) - 0.5) * 8;
        g.moveTo(gx, pos.y).lineTo(gx + (seededRandom(seed + i + 10) - 0.5) * 3, pos.y - 5 - seededRandom(seed + i + 5) * 4)
          .stroke({ color: 0x557744, width: 1, alpha: 0.5 });
      }
      break;
    default: return null;
  }
  return g;
}
