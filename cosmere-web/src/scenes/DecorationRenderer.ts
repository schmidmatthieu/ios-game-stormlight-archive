// ─── Decoration Renderer (tilemap, decorations, buildings, terrain) ──

import { Container, Graphics } from 'pixi.js';
import { isoToScreen, seededRandom } from './IsoUtils';
import type { WorldTheme } from './WorldThemes';
import type { Zone } from '../data/types';
import { darken, lighten } from '../utils/ColorUtils';
import { createDecoration } from './WorldDecorations';

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

    // Outer ambient shadow (soft spread)
    g.ellipse(pos.x + 1, pos.y + height + 2, size * 1.05, size * 0.52)
      .fill({ color: 0x000000, alpha: 0.06 });

    // Main elevation body
    g.ellipse(pos.x, pos.y, size, size * 0.5)
      .fill({ color: darken(theme.tileBase, 0.2), alpha: 0.45 });

    // Bottom shadow (gives depth)
    g.ellipse(pos.x, pos.y + height, size * 0.9, size * 0.45)
      .fill({ color: 0x000000, alpha: 0.12 });

    // Top highlight (lit surface)
    g.ellipse(pos.x - 1, pos.y - height, size * 0.75, size * 0.38)
      .fill({ color: lighten(theme.tileBase, 0.18), alpha: 0.4 });

    // Specular highlight (small bright spot)
    g.ellipse(pos.x - size * 0.2, pos.y - height * 0.8, size * 0.25, size * 0.12)
      .fill({ color: lighten(theme.tileBase, 0.35), alpha: 0.2 });

    // Edge rim on bottom-right
    g.ellipse(pos.x + 2, pos.y + 1, size * 0.95, size * 0.48)
      .stroke({ color: darken(theme.tileBase, 0.3), width: 0.5, alpha: 0.15 });

    g.zIndex = pos.y - 100;
    container.addChild(g);
  }
}

