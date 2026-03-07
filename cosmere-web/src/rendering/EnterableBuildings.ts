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

    const bw = 36;
    const bh = 44;

    // Shadow
    g.ellipse(0, 4, bw * 0.6, 8).fill({ color: 0x000000, alpha: 0.15 });

    // Side wall
    g.poly([
      { x: bw / 2, y: 0 }, { x: bw / 2, y: -bh },
      { x: bw / 2 + 10, y: -bh + 5 }, { x: bw / 2 + 10, y: 5 },
    ]).fill({ color: darken(colors.main, 0.2), alpha: 0.8 });

    // Front wall
    g.rect(-bw / 2, -bh, bw, bh)
      .fill({ color: colors.main, alpha: 0.85 });
    g.rect(-bw / 2, -bh, bw, bh)
      .stroke({ color: colors.trim, width: 1, alpha: 0.5 });

    // Roof
    g.poly([
      { x: -bw / 2 - 4, y: -bh },
      { x: 0, y: -bh - 14 },
      { x: bw / 2 + 4, y: -bh },
    ]).fill({ color: lighten(colors.accent, 0.1), alpha: 0.85 });
    g.poly([
      { x: bw / 2 + 4, y: -bh },
      { x: bw / 2 + 14, y: -bh + 5 },
      { x: 10, y: -bh - 9 },
      { x: 0, y: -bh - 14 },
    ]).fill({ color: darken(colors.accent, 0.1), alpha: 0.8 });

    // Door (glowing to show it's enterable)
    g.roundRect(-5, -14, 10, 14, 2)
      .fill({ color: 0x332211, alpha: 0.9 });
    g.roundRect(-5, -14, 10, 14, 2)
      .stroke({ color: 0xeebb44, width: 1, alpha: 0.5 });
    g.roundRect(-4, -13, 8, 12, 1)
      .fill({ color: 0xffcc44, alpha: 0.15 });

    // Windows
    g.rect(-bw / 2 + 4, -bh + 10, 6, 6)
      .fill({ color: 0xeebb44, alpha: 0.35 });
    g.rect(bw / 2 - 10, -bh + 10, 6, 6)
      .fill({ color: 0xeebb44, alpha: 0.35 });
    g.rect(-3, -bh + 8, 6, 6)
      .fill({ color: 0xeebb44, alpha: 0.25 });

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
    label.y = -bh - 18;
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
