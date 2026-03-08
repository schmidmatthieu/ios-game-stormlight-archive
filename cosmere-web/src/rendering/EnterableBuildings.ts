// ─── Enterable Buildings ────────────────────────────────────────

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { seededRandom } from '../scenes/IsoUtils';
import { lighten, darken } from '../utils/ColorUtils';
import { WALL_COLORS } from './WallSystem';

export interface EnterableBuilding {
  x: number;
  y: number;
  col: number;
  row: number;
  name: string;
  sprite: Container;
  interactionRadius: number;
}

export function spawnEnterableBuildings(
  worldContainer: Container,
  isoToScreen: (col: number, row: number) => { x: number; y: number },
  gridWidth: number,
  gridHeight: number,
  worldID: string,
  spawnPos: { col: number; row: number },
  exits: Array<{ exitPosition: { col: number; row: number } }>,
  npcs: Array<{ position: { col: number; row: number } }>,
  zoneType: string,
): EnterableBuilding[] {
  if (zoneType !== 'hub') return [];

  const buildings: EnterableBuilding[] = [];
  const colors = WALL_COLORS[worldID] ?? WALL_COLORS.scadrial;
  const count = 2 + Math.floor(seededRandom(gridWidth * 71 + gridHeight * 37) * 2);

  const buildingNames = getBuildingNames(worldID);

  for (let i = 0; i < count; i++) {
    const seed = i * 6131 + gridWidth * 53;
    const col = 4 + Math.floor(seededRandom(seed) * (gridWidth - 8));
    const row = 4 + Math.floor(seededRandom(seed + 1) * (gridHeight - 8));

    // Distance checks
    const nearSpawn = Math.hypot(col - spawnPos.col, row - spawnPos.row) < 5;
    const nearExit = exits.some(e => Math.hypot(col - e.exitPosition.col, row - e.exitPosition.row) < 4);
    const nearNPC = npcs.some(n => Math.hypot(col - n.position.col, row - n.position.row) < 4);
    const nearOther = buildings.some(b => Math.hypot(col - b.col, row - b.row) < 6);
    if (nearSpawn || nearExit || nearNPC || nearOther) continue;

    const pos = isoToScreen(col, row);
    const container = new Container();
    const g = new Graphics();
    const bSeed = seed + i * 997;

    const bw = 38;
    const bh = 48;
    const sideW = 12;
    const roofOverhang = 5;

    // ── Ground shadow ──
    g.ellipse(3, 6, bw * 0.7, 10).fill({ color: 0x000000, alpha: 0.18 });

    // ── Foundation (stone base) ──
    g.rect(-bw / 2 - 1, -3, bw + 2 + sideW, 6)
      .fill({ color: darken(colors.trim, 0.15), alpha: 0.7 });
    g.rect(-bw / 2 - 1, -3, bw + 2 + sideW, 1)
      .fill({ color: lighten(colors.trim, 0.1), alpha: 0.3 });

    // ── Side wall (right, darker) ──
    g.poly([
      { x: bw / 2, y: -3 }, { x: bw / 2, y: -bh },
      { x: bw / 2 + sideW, y: -bh + 6 }, { x: bw / 2 + sideW, y: 3 },
    ]).fill({ color: darken(colors.main, 0.25), alpha: 0.85 });
    // Side wall window
    g.rect(bw / 2 + 2, -bh + 16, 5, 5)
      .fill({ color: 0xeebb44, alpha: 0.15 });
    g.rect(bw / 2 + 2, -bh + 16, 5, 5)
      .stroke({ color: darken(colors.main, 0.35), width: 0.5, alpha: 0.4 });

    // ── Front wall ──
    g.rect(-bw / 2, -bh, bw, bh - 3)
      .fill({ color: colors.main, alpha: 0.88 });

    // Wall texture (horizontal planks or stones)
    const plankH = 6;
    for (let p = 0; p < Math.floor((bh - 3) / plankH); p++) {
      const py = -bh + p * plankH;
      g.moveTo(-bw / 2, py).lineTo(bw / 2, py)
        .stroke({ color: darken(colors.main, 0.1), width: 0.4, alpha: 0.2 });
    }

    // Front wall border
    g.rect(-bw / 2, -bh, bw, bh - 3)
      .stroke({ color: colors.trim, width: 1, alpha: 0.45 });

    // Corner pillars
    g.rect(-bw / 2 - 1, -bh, 3, bh - 3)
      .fill({ color: darken(colors.trim, 0.05), alpha: 0.5 });
    g.rect(bw / 2 - 2, -bh, 3, bh - 3)
      .fill({ color: darken(colors.trim, 0.05), alpha: 0.5 });

    // ── Roof ──
    // Front face
    g.poly([
      { x: -bw / 2 - roofOverhang, y: -bh },
      { x: 0, y: -bh - 16 },
      { x: bw / 2 + roofOverhang, y: -bh },
    ]).fill({ color: lighten(colors.accent, 0.08), alpha: 0.88 });
    // Roof shingle lines
    for (let rl = 0; rl < 3; rl++) {
      const ry = -bh - 4 * rl;
      const inset = rl * 5;
      g.moveTo(-bw / 2 - roofOverhang + inset + 2, ry)
        .lineTo(bw / 2 + roofOverhang - inset - 2, ry)
        .stroke({ color: darken(colors.accent, 0.12), width: 0.5, alpha: 0.25 });
    }
    // Side roof face
    g.poly([
      { x: bw / 2 + roofOverhang, y: -bh },
      { x: bw / 2 + roofOverhang + sideW, y: -bh + 6 },
      { x: sideW, y: -bh - 10 },
      { x: 0, y: -bh - 16 },
    ]).fill({ color: darken(colors.accent, 0.12), alpha: 0.82 });
    // Roof ridge highlight
    g.moveTo(0, -bh - 16).lineTo(sideW, -bh - 10)
      .stroke({ color: lighten(colors.accent, 0.2), width: 0.8, alpha: 0.3 });

    // ── Chimney ──
    if (seededRandom(bSeed + 50) > 0.35) {
      const chX = bw / 4 + 2;
      g.rect(chX - 3, -bh - 14, 6, 10)
        .fill({ color: darken(colors.trim, 0.1), alpha: 0.8 });
      g.rect(chX - 4, -bh - 15, 8, 2)
        .fill({ color: colors.trim, alpha: 0.7 });
      // Smoke wisps
      g.circle(chX, -bh - 18, 2).fill({ color: 0x888888, alpha: 0.1 });
      g.circle(chX - 1, -bh - 22, 2.5).fill({ color: 0x999999, alpha: 0.07 });
      g.circle(chX + 1, -bh - 27, 3).fill({ color: 0xaaaaaa, alpha: 0.04 });
    }

    // ── Door (glowing to show it's enterable) ──
    g.roundRect(-6, -16, 12, 16, 3)
      .fill({ color: 0x221100, alpha: 0.92 });
    // Door frame
    g.roundRect(-7, -17, 14, 17, 3)
      .stroke({ color: 0xeebb44, width: 1.2, alpha: 0.5 });
    // Door glow (warm light from inside)
    g.roundRect(-5, -15, 10, 14, 2)
      .fill({ color: 0xffcc44, alpha: 0.18 });
    // Door handle
    g.circle(3, -8, 1).fill({ color: 0xddaa33, alpha: 0.7 });
    // Light spill on ground
    g.poly([
      { x: -8, y: 0 }, { x: 8, y: 0 },
      { x: 14, y: 8 }, { x: -14, y: 8 },
    ]).fill({ color: 0xffcc44, alpha: 0.06 });

    // ── Windows with light glow ──
    const winY = -bh + 12;
    // Left window
    g.rect(-bw / 2 + 5, winY, 7, 7)
      .fill({ color: 0x221100, alpha: 0.7 });
    g.rect(-bw / 2 + 5, winY, 7, 7)
      .stroke({ color: colors.trim, width: 0.6, alpha: 0.5 });
    g.rect(-bw / 2 + 6, winY + 1, 5, 5)
      .fill({ color: 0xeebb44, alpha: 0.3 });
    // Window cross
    g.moveTo(-bw / 2 + 8.5, winY).lineTo(-bw / 2 + 8.5, winY + 7)
      .stroke({ color: colors.trim, width: 0.5, alpha: 0.5 });
    g.moveTo(-bw / 2 + 5, winY + 3.5).lineTo(-bw / 2 + 12, winY + 3.5)
      .stroke({ color: colors.trim, width: 0.5, alpha: 0.5 });
    // Window light halo
    g.circle(-bw / 2 + 8.5, winY + 3.5, 6).fill({ color: 0xffcc44, alpha: 0.04 });

    // Right window
    g.rect(bw / 2 - 12, winY, 7, 7)
      .fill({ color: 0x221100, alpha: 0.7 });
    g.rect(bw / 2 - 12, winY, 7, 7)
      .stroke({ color: colors.trim, width: 0.6, alpha: 0.5 });
    g.rect(bw / 2 - 11, winY + 1, 5, 5)
      .fill({ color: 0xeebb44, alpha: 0.25 });
    g.moveTo(bw / 2 - 8.5, winY).lineTo(bw / 2 - 8.5, winY + 7)
      .stroke({ color: colors.trim, width: 0.5, alpha: 0.5 });
    g.circle(bw / 2 - 8.5, winY + 3.5, 6).fill({ color: 0xffcc44, alpha: 0.04 });

    // ── Awning over door ──
    g.poly([
      { x: -10, y: -18 }, { x: 10, y: -18 },
      { x: 14, y: -14 }, { x: -14, y: -14 },
    ]).fill({ color: darken(colors.accent, 0.05), alpha: 0.65 });
    g.moveTo(-14, -14).lineTo(14, -14)
      .stroke({ color: darken(colors.accent, 0.2), width: 0.5, alpha: 0.4 });

    // ── Sign board ──
    if (seededRandom(bSeed + 80) > 0.3) {
      const signX = -bw / 2 - 3;
      g.rect(signX, -bh + 20, 2, 14)
        .fill({ color: 0x554433, alpha: 0.7 });
      g.roundRect(signX - 6, -bh + 18, 14, 9, 2)
        .fill({ color: 0x443322, alpha: 0.8 });
      g.roundRect(signX - 6, -bh + 18, 14, 9, 2)
        .stroke({ color: 0x665544, width: 0.5, alpha: 0.5 });
    }

    container.addChild(g);

    // Name label
    const name = buildingNames[i % buildingNames.length];
    const label = new Text({
      text: name,
      style: new TextStyle({
        fontFamily: 'sans-serif', fontSize: 7, fill: 0xeedd88,
        dropShadow: { color: 0x000000, blur: 2, distance: 1 },
      }),
    });
    label.anchor.set(0.5);
    label.y = -bh - 22;
    container.addChild(label);

    container.x = pos.x;
    container.y = pos.y;
    container.zIndex = pos.y;
    worldContainer.addChild(container);

    buildings.push({
      x: pos.x, y: pos.y,
      col, row, name,
      sprite: container,
      interactionRadius: 50,
    });
  }

  return buildings;
}

function getBuildingNames(worldID: string): string[] {
  switch (worldID) {
    case 'scadrial': return ['Taverne de Hammonth', 'Forge d\'Acier', 'Cache de Kelsier', 'Refuge des Skaa'];
    case 'roshar': return ['Temple des Radiants', 'Forge de Shardblades', 'Refuge de Dalinar', 'Tour de Guet'];
    case 'nalthis': return ['Galerie des Couleurs', 'Temple du Souffle', 'Atelier d\'Éveil', 'Palais de Hallandren'];
    case 'taldain': return ['Oasis d\'Ombre', 'Tour Solaire', 'Camp de Sabliers', 'Sanctuaire du Sable'];
    case 'sel': return ['Bibliothèque des Aons', 'Temple d\'Elantris', 'Forge du Dor', 'Salle des Seons'];
    case 'komashi': return ['Atelier du Peintre', 'Tour de Garde', 'Cairn Protecteur', 'Refuge des Rêves'];
    case 'shadesmar': return ['Échange de Billes', 'Phare Cognitif', 'Port des Pensées', 'Bastion des Spren'];
    default: return ['Bâtiment', 'Refuge', 'Tour', 'Auberge'];
  }
}
