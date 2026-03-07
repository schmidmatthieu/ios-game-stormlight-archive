import { Container, Graphics, Text, TextStyle } from 'pixi.js';

// ─── Wall System ────────────────────────────────────────────────

export interface WallSegment {
  x: number;
  y: number;
  width: number;
  height: number;
  sprite: Graphics;
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

function darken(color: number, amount: number): number {
  const r = Math.max(0, ((color >> 16) & 0xff) * (1 - amount));
  const g = Math.max(0, ((color >> 8) & 0xff) * (1 - amount));
  const b = Math.max(0, (color & 0xff) * (1 - amount));
  return (Math.floor(r) << 16) | (Math.floor(g) << 8) | Math.floor(b);
}

function lighten(color: number, amount: number): number {
  const r = Math.min(255, ((color >> 16) & 0xff) * (1 + amount));
  const g = Math.min(255, ((color >> 8) & 0xff) * (1 + amount));
  const b = Math.min(255, (color & 0xff) * (1 + amount));
  return (Math.floor(r) << 16) | (Math.floor(g) << 8) | Math.floor(b);
}

const WALL_COLORS: Record<string, { main: number; accent: number; trim: number }> = {
  scadrial:  { main: 0x3a3028, accent: 0x4a4038, trim: 0x2a2018 },
  roshar:    { main: 0x556677, accent: 0x667788, trim: 0x445566 },
  nalthis:   { main: 0x446644, accent: 0x558855, trim: 0x335533 },
  taldain:   { main: 0x665544, accent: 0x776655, trim: 0x554433 },
  sel:       { main: 0x887766, accent: 0x998877, trim: 0x776655 },
  komashi:   { main: 0x443344, accent: 0x554455, trim: 0x332233 },
  shadesmar: { main: 0x333355, accent: 0x444466, trim: 0x222244 },
};

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

interface WallPos {
  col: number;
  row: number;
}

function generateEdgeWalls(
  gw: number, gh: number,
  exits: Array<{ exitPosition: { col: number; row: number } }>,
): WallPos[] {
  const walls: WallPos[] = [];

  for (let col = 0; col < gw; col += 2) {
    // Top edge
    if (!isNearExit(col, 0, exits)) walls.push({ col, row: 0 });
    // Bottom edge
    if (!isNearExit(col, gh - 1, exits)) walls.push({ col, row: gh - 1 });
  }
  for (let row = 0; row < gh; row += 2) {
    // Left edge
    if (!isNearExit(0, row, exits)) walls.push({ col: 0, row });
    // Right edge
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

  // Create 2-4 wall lines to form corridors/rooms
  const wallCount = 2 + Math.floor(seededRandom(seed) * 3);

  for (let w = 0; w < wallCount; w++) {
    const horizontal = seededRandom(seed + w * 100) > 0.5;
    const startCol = 3 + Math.floor(seededRandom(seed + w * 200) * (gw - 6));
    const startRow = 3 + Math.floor(seededRandom(seed + w * 300) * (gh - 6));
    const length = 3 + Math.floor(seededRandom(seed + w * 400) * 5);
    // Gap position for passage
    const gapPos = Math.floor(seededRandom(seed + w * 500) * length);

    for (let i = 0; i < length; i++) {
      if (i === gapPos || i === gapPos + 1) continue; // Gap in wall for passage

      const col = horizontal ? startCol + i : startCol;
      const row = horizontal ? startRow : startRow + i;

      if (col < 2 || col >= gw - 2 || row < 2 || row >= gh - 2) continue;

      // Don't place near spawn, exits, or NPCs
      const nearSpawn = Math.hypot(col - spawnPos.col, row - spawnPos.row) < 4;
      const nearExit = exits.some(e => Math.hypot(col - e.exitPosition.col, row - e.exitPosition.row) < 3);
      const nearNPC = npcs.some(n => Math.hypot(col - n.position.col, row - n.position.row) < 3);
      if (nearSpawn || nearExit || nearNPC) continue;

      walls.push({ col, row });
    }
  }

  return walls;
}

// ─── Enterable Buildings ────────────────────────────────────────

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

    // Larger building with door
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
    // Door glow
    g.roundRect(-4, -13, 8, 12, 1)
      .fill({ color: 0xffcc44, alpha: 0.15 });

    // Windows
    g.rect(-bw / 2 + 4, -bh + 10, 6, 6)
      .fill({ color: 0xeebb44, alpha: 0.35 });
    g.rect(bw / 2 - 10, -bh + 10, 6, 6)
      .fill({ color: 0xeebb44, alpha: 0.35 });

    // Window on second floor
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

// ─── Hidden Passages & Secret Areas ─────────────────────────────

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
      // Subtle ground shimmer
      indicator.circle(0, 0, 4).fill({ color: 0xeedd44, alpha: 0.08 });
      indicator.circle(0, -1, 2).fill({ color: 0xffee66, alpha: 0.12 });
    } else if (type === 'passage') {
      // Crack in ground
      indicator.moveTo(-5, 2).lineTo(-2, -3).lineTo(1, 1).lineTo(4, -4).lineTo(6, 0)
        .stroke({ color: 0x222222, width: 1, alpha: 0.2 });
    } else {
      // Faint glow
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

  // Replace subtle indicator with full reveal
  const container = secret.sprite;
  container.removeChildren();

  const g = new Graphics();
  const glowColor = getWorldShrineColor(worldID);

  if (secret.type === 'treasure') {
    // Chest
    g.roundRect(-8, -10, 16, 10, 2).fill({ color: 0x664422, alpha: 0.9 });
    g.roundRect(-8, -10, 16, 10, 2).stroke({ color: 0xeebb44, width: 1, alpha: 0.6 });
    g.roundRect(-9, -12, 18, 4, 1).fill({ color: 0x553311, alpha: 0.9 });
    g.rect(-2, -8, 4, 3).fill({ color: 0xeebb44, alpha: 0.7 });
    // Glow
    g.circle(0, -6, 12).fill({ color: 0xeedd44, alpha: 0.1 });
  } else if (secret.type === 'passage') {
    // Open passage
    g.ellipse(0, 0, 10, 6).fill({ color: 0x111111, alpha: 0.6 });
    g.ellipse(0, -1, 8, 4).fill({ color: 0x000000, alpha: 0.4 });
    // Stairs hint
    for (let s = 0; s < 3; s++) {
      g.rect(-6 + s * 2, -2 + s * 2, 12 - s * 4, 1).fill({ color: 0x333333, alpha: 0.5 });
    }
  } else {
    // Shrine
    g.rect(-2, -18, 4, 14).fill({ color: 0x777777, alpha: 0.7 });
    g.circle(0, -20, 4).fill({ color: glowColor, alpha: 0.6 });
    g.circle(0, -20, 8).fill({ color: glowColor, alpha: 0.12 });
    g.ellipse(0, -2, 8, 3).fill({ color: 0x666666, alpha: 0.5 });
  }

  container.addChild(g);
}
