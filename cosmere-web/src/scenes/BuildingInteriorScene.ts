// ─── Building Interior System — Full-Screen Immersive ─────────────
// Procedurally generated interior with detailed room views,
// minimap navigation, and interactive elements.

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { GameManager } from '../game/GameManager';
import { MusicManager } from '../game/MusicSystem';
import { lighten, darken } from '../utils/ColorUtils';

// ─── Types ──────────────────────────────────────────────────────

type RoomType = 'corridor' | 'main_hall' | 'bedroom' | 'storage' | 'kitchen' |
  'shop_counter' | 'altar' | 'library' | 'forge' | 'cellar';

interface Room {
  x: number; y: number;
  w: number; h: number;
  type: RoomType;
  connections: number[];
  interactables: Interactable[];
  explored: boolean;
}

interface Interactable {
  type: 'chest' | 'bookshelf' | 'bed' | 'crafting_table' | 'barrel' | 'altar' | 'npc';
  x: number; y: number;
  looted: boolean;
  label: string;
}

type BuildingType = 'house' | 'shop' | 'tavern' | 'temple' | 'forge' | 'library' | 'guild_hall';

// ─── Constants ──────────────────────────────────────────────────

const WORLD_COLORS: Record<string, { floor: number; wall: number; accent: number }> = {
  scadrial: { floor: 0x332822, wall: 0x554438, accent: 0xaa6633 },
  roshar: { floor: 0x1e2830, wall: 0x3a4858, accent: 0x4488cc },
  taldain: { floor: 0x3a3420, wall: 0x5a5438, accent: 0xddaa55 },
  nalthis: { floor: 0x1a2820, wall: 0x3a4838, accent: 0x44cc88 },
  komashi: { floor: 0x281828, wall: 0x483848, accent: 0xaa55cc },
  sel: { floor: 0x282820, wall: 0x484838, accent: 0xccaa44 },
  shadesmar: { floor: 0x0e0e20, wall: 0x2a2a44, accent: 0x8866cc },
};

const ROOM_TEMPLATES: Record<BuildingType, RoomType[]> = {
  house: ['main_hall', 'bedroom', 'kitchen', 'storage'],
  shop: ['shop_counter', 'storage', 'cellar'],
  tavern: ['main_hall', 'kitchen', 'storage', 'bedroom', 'cellar'],
  temple: ['main_hall', 'altar', 'library', 'storage'],
  forge: ['forge', 'storage', 'cellar'],
  library: ['main_hall', 'library', 'library', 'storage'],
  guild_hall: ['main_hall', 'bedroom', 'forge', 'library', 'storage', 'cellar'],
};

const LORE_TEXTS = [
  'Les brumes de Scadrial cachent bien des secrets...',
  'Un ancien glyphe est gravé dans la pierre.',
  'Vous trouvez un journal poussiéreux rempli de notes cryptiques.',
  'Une carte partielle du Shadesmar est esquissée ici.',
  'Des notes sur l\'Investiture et ses formes multiples.',
  'Un traité sur les Éclats et leur pouvoir.',
  'Le journal mentionne des passages secrets entre les mondes.',
  'Des croquis de créatures inconnues ornent les pages.',
];

const ITEM_POOL = ['Potion de vie', 'Fiole de brume', 'Sphère infusée', 'Souffle capturé', 'Rune ancienne', 'Parchemin'];

// ─── Layout Generation ──────────────────────────────────────────

function detectBuildingType(name: string): BuildingType {
  const n = name.toLowerCase();
  if (n.includes('tavern') || n.includes('auberge')) return 'tavern';
  if (n.includes('temple') || n.includes('sanctuaire') || n.includes('refuge')) return 'temple';
  if (n.includes('forge') || n.includes('forgeron') || n.includes('acier')) return 'forge';
  if (n.includes('biblio') || n.includes('library') || n.includes('salle des')) return 'library';
  if (n.includes('boutique') || n.includes('shop') || n.includes('march') || n.includes('échange')) return 'shop';
  if (n.includes('guilde') || n.includes('guild') || n.includes('cache') || n.includes('bastion')) return 'guild_hall';
  return 'house';
}

function generateRooms(buildingType: BuildingType): Room[] {
  const templates = ROOM_TEMPLATES[buildingType];
  const count = Math.min(templates.length, 3 + Math.floor(Math.random() * 3));
  const rooms: Room[] = [];

  for (let i = 0; i < count; i++) {
    const rw = 4 + Math.floor(Math.random() * 3);
    const rh = 3 + Math.floor(Math.random() * 3);
    const col = i % 3;
    const row = Math.floor(i / 3);
    rooms.push({
      x: col * 8 + 1, y: row * 8 + 1,
      w: rw, h: rh,
      type: templates[i % templates.length],
      connections: [],
      interactables: [],
      explored: i === 0,
    });
  }

  for (let i = 1; i < rooms.length; i++) {
    rooms[i - 1].connections.push(i);
    rooms[i].connections.push(i - 1);
  }
  if (rooms.length > 3) {
    rooms[0].connections.push(rooms.length - 1);
    rooms[rooms.length - 1].connections.push(0);
  }

  for (const room of rooms) {
    populateRoom(room);
  }
  return rooms;
}

function populateRoom(room: Room): void {
  const cx = room.w / 2;
  const cy = room.h / 2;

  switch (room.type) {
    case 'bedroom':
      room.interactables.push({ type: 'bed', x: cx, y: 1, looted: false, label: 'Lit' });
      room.interactables.push({ type: 'chest', x: room.w - 1, y: cy, looted: false, label: 'Coffre' });
      break;
    case 'storage': case 'cellar':
      room.interactables.push({ type: 'barrel', x: 1, y: 1, looted: false, label: 'Tonneau' });
      room.interactables.push({ type: 'chest', x: room.w - 1, y: cy, looted: false, label: 'Coffre' });
      break;
    case 'kitchen':
      room.interactables.push({ type: 'barrel', x: cx, y: 1, looted: false, label: 'Provisions' });
      room.interactables.push({ type: 'barrel', x: 1, y: cy, looted: false, label: 'Tonneaux de vin' });
      break;
    case 'shop_counter':
      room.interactables.push({ type: 'npc', x: cx, y: 1, looted: false, label: 'Marchand' });
      room.interactables.push({ type: 'chest', x: room.w - 1, y: cy, looted: false, label: 'Étalage' });
      break;
    case 'altar':
      room.interactables.push({ type: 'altar', x: cx, y: cy, looted: false, label: 'Autel sacré' });
      break;
    case 'library':
      room.interactables.push({ type: 'bookshelf', x: 1, y: 1, looted: false, label: 'Étagère poussiéreuse' });
      room.interactables.push({ type: 'bookshelf', x: room.w - 1, y: cy, looted: false, label: 'Bibliothèque ancienne' });
      break;
    case 'forge':
      room.interactables.push({ type: 'crafting_table', x: cx, y: cy, looted: false, label: 'Enclume' });
      room.interactables.push({ type: 'chest', x: room.w - 1, y: 1, looted: false, label: 'Matériaux' });
      break;
    case 'main_hall':
      room.interactables.push({ type: 'chest', x: room.w - 1, y: room.h - 1, looted: false, label: 'Coffre orné' });
      if (Math.random() < 0.5) {
        room.interactables.push({ type: 'bookshelf', x: 1, y: 1, looted: false, label: 'Étagère décorative' });
      }
      break;
    default:
      break;
  }
}

// ─── Room label ────────────────────────────────────────────────

function roomLabel(type: RoomType): string {
  const labels: Record<RoomType, string> = {
    corridor: 'Couloir', main_hall: 'Salle Principale', bedroom: 'Chambre',
    storage: 'Réserve', kitchen: 'Cuisine', shop_counter: 'Comptoir',
    altar: 'Sanctuaire', library: 'Bibliothèque', forge: 'Forge', cellar: 'Cave',
  };
  return labels[type];
}

// ─── Interactable visual config ─────────────────────────────────

const INTERACTABLE_COLORS: Record<string, number> = {
  chest: 0xccaa33, bookshelf: 0x886644, bed: 0x6666aa,
  crafting_table: 0xaa6633, barrel: 0x997744, altar: 0xddddff, npc: 0x44cc66,
};

const INTERACTABLE_LABELS: Record<string, string> = {
  chest: 'Coffre', bookshelf: 'Livres', bed: 'Lit', crafting_table: 'Atelier',
  barrel: 'Tonneau', altar: 'Autel', npc: 'Parler',
};

// ─── Main Entry Point ───────────────────────────────────────────

export function showBuildingInterior(
  uiContainer: Container,
  screenW: number, screenH: number,
  buildingName: string,
  worldID: string,
  onClose: (rewards: { xp: number; gold: number; items: string[] }) => void,
): Container {
  const panel = new Container();
  panel.zIndex = 10000;

  const champ = GameManager.shared.champion;
  const rewards = { xp: 0, gold: 0, items: [] as string[] };

  const buildingType = detectBuildingType(buildingName);
  const rooms = generateRooms(buildingType);
  let currentRoom = 0;
  const colors = WORLD_COLORS[worldID] ?? WORLD_COLORS.scadrial;

  // ── Full-screen background (solid, not transparent overlay)
  const bg = new Graphics();
  bg.rect(0, 0, screenW, screenH).fill({ color: 0x050510, alpha: 1.0 });
  bg.eventMode = 'static';
  panel.addChild(bg);

  // ── Top header bar
  const headerH = 44;
  const header = new Graphics();
  header.rect(0, 0, screenW, headerH).fill({ color: colors.wall, alpha: 0.95 });
  header.rect(0, headerH - 2, screenW, 2).fill({ color: colors.accent, alpha: 0.6 });
  panel.addChild(header);

  const title = new Text({
    text: buildingName,
    style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 15, fill: 0xe6cc66, fontWeight: 'bold' }),
  });
  title.anchor.set(0.5, 0.5);
  title.x = screenW / 2;
  title.y = headerH / 2;
  panel.addChild(title);

  // Exit button (top-right)
  const exitBtn = new Graphics();
  exitBtn.roundRect(screenW - 80, 8, 70, 28, 6)
    .fill({ color: 0x442222, alpha: 0.9 })
    .stroke({ color: 0x884444, width: 1 });
  exitBtn.eventMode = 'static';
  exitBtn.cursor = 'pointer';
  exitBtn.on('pointerdown', () => {
    panel.destroy({ children: true });
    onClose(rewards);
  });
  panel.addChild(exitBtn);

  const exitLabel = new Text({
    text: 'Sortir',
    style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 11, fill: 0xffcccc, fontWeight: 'bold' }),
  });
  exitLabel.anchor.set(0.5);
  exitLabel.x = screenW - 45;
  exitLabel.y = 22;
  panel.addChild(exitLabel);

  // ── Room name label (under header)
  const roomNameText = new Text({
    text: '',
    style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 13, fill: colors.accent, fontWeight: 'bold' }),
  });
  roomNameText.anchor.set(0.5, 0);
  roomNameText.x = screenW / 2;
  roomNameText.y = headerH + 8;
  panel.addChild(roomNameText);

  // ── Main room view (large, detailed rendering of current room)
  const roomViewY = headerH + 32;
  const roomViewH = screenH - roomViewY - 120;
  const roomViewW = screenW - 20;
  const roomViewX = 10;

  const roomViewContainer = new Container();
  roomViewContainer.x = roomViewX;
  roomViewContainer.y = roomViewY;
  panel.addChild(roomViewContainer);

  // ── Status text area (bottom)
  const statusBg = new Graphics();
  statusBg.roundRect(10, screenH - 110, screenW - 20, 50, 8)
    .fill({ color: 0x0a0815, alpha: 0.9 })
    .stroke({ color: colors.accent, width: 1, alpha: 0.3 });
  panel.addChild(statusBg);

  const statusText = new Text({
    text: '',
    style: new TextStyle({
      fontFamily: 'sans-serif', fontSize: 11, fill: 0xddddcc,
      wordWrap: true, wordWrapWidth: screenW - 50,
    }),
  });
  statusText.x = 22;
  statusText.y = screenH - 102;
  panel.addChild(statusText);

  // ── Navigation buttons (bottom bar)
  const navContainer = new Container();
  navContainer.y = screenH - 54;
  panel.addChild(navContainer);

  // ── Minimap (bottom-right corner)
  const minimapSize = 80;
  const minimapX = screenW - minimapSize - 14;
  const minimapY = roomViewY + roomViewH - minimapSize - 8;
  const minimapContainer = new Container();
  minimapContainer.x = minimapX;
  minimapContainer.y = minimapY;
  panel.addChild(minimapContainer);

  // ── Drawing functions

  function drawRoomView(): void {
    roomViewContainer.removeChildren();
    const room = rooms[currentRoom];

    roomNameText.text = roomLabel(room.type);

    // Room background with walls
    const cellSize = Math.min(
      Math.floor(roomViewW / (room.w + 2)),
      Math.floor(roomViewH / (room.h + 2)),
    );
    const totalW = (room.w + 2) * cellSize;
    const totalH = (room.h + 2) * cellSize;
    const offsetX = (roomViewW - totalW) / 2;
    const offsetY = (roomViewH - totalH) / 2;

    const g = new Graphics();
    roomViewContainer.addChild(g);

    // Outer wall shadow
    g.roundRect(offsetX - 2, offsetY - 2, totalW + 4, totalH + 4, 4)
      .fill({ color: 0x000000, alpha: 0.4 });

    // Walls
    g.rect(offsetX, offsetY, totalW, totalH)
      .fill({ color: colors.wall, alpha: 0.95 });

    // Floor
    g.rect(offsetX + cellSize, offsetY + cellSize, room.w * cellSize, room.h * cellSize)
      .fill({ color: colors.floor, alpha: 0.9 });

    // Floor tiles pattern
    for (let fx = 0; fx < room.w; fx++) {
      for (let fy = 0; fy < room.h; fy++) {
        const tx = offsetX + (fx + 1) * cellSize;
        const ty = offsetY + (fy + 1) * cellSize;
        g.rect(tx, ty, cellSize, cellSize)
          .stroke({ color: lighten(colors.floor, 0.15), width: 0.5, alpha: 0.15 });
        // Subtle variation
        if ((fx + fy) % 2 === 0) {
          g.rect(tx, ty, cellSize, cellSize)
            .fill({ color: lighten(colors.floor, 0.05), alpha: 0.15 });
        }
      }
    }

    // Wall decorations
    const wallLight = lighten(colors.wall, 0.2);
    // Top wall trim
    g.rect(offsetX + cellSize, offsetY + cellSize - 3, room.w * cellSize, 3)
      .fill({ color: darken(colors.wall, 0.15), alpha: 0.8 });
    // Bottom wall trim
    g.rect(offsetX + cellSize, offsetY + (room.h + 1) * cellSize, room.w * cellSize, 3)
      .fill({ color: darken(colors.wall, 0.15), alpha: 0.8 });

    // Torchlight ambient
    const cx = offsetX + totalW / 2;
    const cy = offsetY + totalH / 2;
    g.circle(cx, cy, Math.max(totalW, totalH) * 0.4)
      .fill({ color: 0xffaa44, alpha: 0.06 });
    g.circle(cx, cy, Math.max(totalW, totalH) * 0.25)
      .fill({ color: 0xffcc66, alpha: 0.04 });

    // Door indicators for connected rooms
    for (const ci of room.connections) {
      const target = rooms[ci];
      // Find direction
      const dx = target.x - room.x;
      const dy = target.y - room.y;
      let doorX: number, doorY: number, doorW: number, doorH: number;

      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal connection
        doorX = dx > 0
          ? offsetX + (room.w + 1) * cellSize - 2
          : offsetX + cellSize - cellSize / 3;
        doorY = offsetY + (1 + room.h / 2) * cellSize - cellSize / 2;
        doorW = cellSize / 3;
        doorH = cellSize;
      } else {
        // Vertical connection
        doorX = offsetX + (1 + room.w / 2) * cellSize - cellSize / 2;
        doorY = dy > 0
          ? offsetY + (room.h + 1) * cellSize - 2
          : offsetY + cellSize - cellSize / 3;
        doorW = cellSize;
        doorH = cellSize / 3;
      }

      // Door frame
      g.rect(doorX, doorY, doorW, doorH)
        .fill({ color: 0x332211, alpha: 0.9 });
      g.rect(doorX + 1, doorY + 1, doorW - 2, doorH - 2)
        .fill({ color: 0xffcc44, alpha: 0.1 });

      // Door navigation button
      const doorBtn = new Graphics();
      doorBtn.roundRect(doorX - 4, doorY - 4, doorW + 8, doorH + 8, 4)
        .fill({ color: 0x44aa44, alpha: 0.25 })
        .stroke({ color: 0x88cc88, width: 1.5, alpha: 0.6 });
      doorBtn.eventMode = 'static';
      doorBtn.cursor = 'pointer';
      doorBtn.on('pointerdown', () => moveToRoom(ci));
      roomViewContainer.addChild(doorBtn);

      // Arrow direction label
      const arrowLabel = new Text({
        text: `→ ${roomLabel(target.type)}`,
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 8, fill: 0x88cc88 }),
      });
      arrowLabel.anchor.set(0.5);
      arrowLabel.x = doorX + doorW / 2;
      arrowLabel.y = doorY - 10;
      roomViewContainer.addChild(arrowLabel);
    }

    // Draw interactables
    for (const inter of room.interactables) {
      const ix = offsetX + (inter.x + 1) * cellSize;
      const iy = offsetY + (inter.y + 1) * cellSize;
      const color = INTERACTABLE_COLORS[inter.type] ?? 0xaaaaaa;
      const dimmed = inter.looted;
      const objSize = cellSize * 0.7;

      // Object background
      const objG = new Graphics();
      objG.roundRect(ix - objSize / 2, iy - objSize / 2, objSize, objSize, 4)
        .fill({ color: dimmed ? darken(color, 0.4) : color, alpha: dimmed ? 0.3 : 0.7 })
        .stroke({ color: dimmed ? 0x444444 : lighten(color, 0.3), width: 1.5, alpha: dimmed ? 0.3 : 0.7 });

      if (!dimmed) {
        // Glow
        objG.circle(ix, iy, objSize * 0.7)
          .fill({ color, alpha: 0.1 });
      }

      objG.eventMode = 'static';
      objG.cursor = dimmed ? 'default' : 'pointer';
      objG.on('pointerdown', () => handleInteract(inter));
      roomViewContainer.addChild(objG);

      // Label
      const labelText = new Text({
        text: inter.label,
        style: new TextStyle({
          fontFamily: 'sans-serif', fontSize: 9,
          fill: dimmed ? 0x555555 : 0xeeddcc,
          fontWeight: 'bold',
        }),
      });
      labelText.anchor.set(0.5, 0);
      labelText.x = ix;
      labelText.y = iy + objSize / 2 + 3;
      roomViewContainer.addChild(labelText);

      // Action hint
      if (!dimmed) {
        const hint = new Text({
          text: INTERACTABLE_LABELS[inter.type] ?? 'Interagir',
          style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 7, fill: color }),
        });
        hint.anchor.set(0.5, 0);
        hint.x = ix;
        hint.y = iy + objSize / 2 + 14;
        roomViewContainer.addChild(hint);
      }
    }

    // Player character indicator
    const playerX = offsetX + (1 + room.w / 2) * cellSize;
    const playerY = offsetY + (1 + room.h / 2) * cellSize;
    const playerG = new Graphics();
    playerG.circle(playerX, playerY, 8)
      .fill({ color: 0x44ff88, alpha: 0.8 })
      .stroke({ color: 0xffffff, width: 1.5, alpha: 0.8 });
    playerG.circle(playerX, playerY, 12)
      .fill({ color: 0x44ff88, alpha: 0.1 });
    roomViewContainer.addChild(playerG);
  }

  function drawMinimap(): void {
    minimapContainer.removeChildren();
    const g = new Graphics();
    minimapContainer.addChild(g);

    // Minimap background
    g.roundRect(-4, -4, minimapSize + 8, minimapSize + 8, 6)
      .fill({ color: 0x0a0815, alpha: 0.85 })
      .stroke({ color: colors.accent, width: 1, alpha: 0.4 });

    // Scale rooms to fit minimap
    let maxX = 0, maxY = 0;
    for (const room of rooms) {
      maxX = Math.max(maxX, room.x + room.w);
      maxY = Math.max(maxY, room.y + room.h);
    }
    const scaleX = (minimapSize - 8) / (maxX + 2);
    const scaleY = (minimapSize - 8) / (maxY + 2);
    const sc = Math.min(scaleX, scaleY);

    // Draw corridors
    for (let ri = 0; ri < rooms.length; ri++) {
      const ra = rooms[ri];
      for (const ci of ra.connections) {
        if (ci <= ri) continue;
        const rb = rooms[ci];
        const ax = (ra.x + ra.w / 2) * sc + 4;
        const ay = (ra.y + ra.h / 2) * sc + 4;
        const bx = (rb.x + rb.w / 2) * sc + 4;
        const by = (rb.y + rb.h / 2) * sc + 4;
        g.moveTo(ax, ay).lineTo(bx, by)
          .stroke({ color: 0x554433, width: 2, alpha: 0.5 });
      }
    }

    // Draw rooms
    for (let ri = 0; ri < rooms.length; ri++) {
      const room = rooms[ri];
      const isCurrent = ri === currentRoom;
      const alpha = room.explored ? (isCurrent ? 1.0 : 0.5) : 0.15;
      const rx = room.x * sc + 4;
      const ry = room.y * sc + 4;
      const rw = room.w * sc;
      const rh = room.h * sc;

      g.rect(rx, ry, rw, rh)
        .fill({ color: isCurrent ? colors.accent : colors.floor, alpha: alpha * 0.8 });
      g.rect(rx, ry, rw, rh)
        .stroke({ color: colors.wall, width: 1, alpha: alpha * 0.6 });
    }

    // Player dot
    const pr = rooms[currentRoom];
    const px = (pr.x + pr.w / 2) * sc + 4;
    const py = (pr.y + pr.h / 2) * sc + 4;
    g.circle(px, py, 3).fill({ color: 0x44ff88 })
      .stroke({ color: 0xffffff, width: 1 });
  }

  function drawNavButtons(): void {
    navContainer.removeChildren();

    const connections = rooms[currentRoom].connections;
    const btnW = Math.min(120, (screenW - 30) / Math.max(connections.length + 1, 1));
    const btnH = 36;
    const totalW = (connections.length + 1) * (btnW + 8);
    const startX = (screenW - totalW) / 2;

    // Room navigation buttons
    connections.forEach((ci, i) => {
      const target = rooms[ci];
      const bx = startX + i * (btnW + 8);

      const btn = new Graphics();
      btn.roundRect(bx, 0, btnW, btnH, 6)
        .fill({ color: 0x224422, alpha: 0.9 })
        .stroke({ color: 0x66aa66, width: 1.5, alpha: 0.7 });
      btn.eventMode = 'static';
      btn.cursor = 'pointer';
      btn.on('pointerdown', () => moveToRoom(ci));
      navContainer.addChild(btn);

      const label = new Text({
        text: `→ ${roomLabel(target.type)}`,
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 9, fill: 0x88cc88, fontWeight: 'bold' }),
      });
      label.anchor.set(0.5);
      label.x = bx + btnW / 2;
      label.y = btnH / 2;
      navContainer.addChild(label);
    });

    // Exit button
    const bx = startX + connections.length * (btnW + 8);
    const exitBtnNav = new Graphics();
    exitBtnNav.roundRect(bx, 0, btnW, btnH, 6)
      .fill({ color: 0x442222, alpha: 0.9 })
      .stroke({ color: 0xaa6644, width: 1.5, alpha: 0.7 });
    exitBtnNav.eventMode = 'static';
    exitBtnNav.cursor = 'pointer';
    exitBtnNav.on('pointerdown', () => {
      panel.destroy({ children: true });
      onClose(rewards);
    });
    navContainer.addChild(exitBtnNav);

    const exitLbl = new Text({
      text: 'Sortir du bâtiment',
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 9, fill: 0xffcccc, fontWeight: 'bold' }),
    });
    exitLbl.anchor.set(0.5);
    exitLbl.x = bx + btnW / 2;
    exitLbl.y = btnH / 2;
    navContainer.addChild(exitLbl);
  }

  function moveToRoom(index: number): void {
    currentRoom = index;
    rooms[index].explored = true;
    MusicManager.shared.playSFX('step');
    statusText.text = `Vous entrez dans : ${roomLabel(rooms[index].type)}`;
    drawRoomView();
    drawMinimap();
    drawNavButtons();
  }

  function handleInteract(inter: Interactable): void {
    if (inter.looted) {
      statusText.text = `${inter.label} — déjà fouillé.`;
      return;
    }

    switch (inter.type) {
      case 'chest': {
        const gold = 8 + Math.floor(Math.random() * 25);
        rewards.gold += gold;
        if (champ) champ.gold += gold;
        const hasItem = Math.random() < 0.4;
        let msg = `${inter.label} ouvert ! +${gold} or`;
        if (hasItem) {
          const item = ITEM_POOL[Math.floor(Math.random() * ITEM_POOL.length)];
          rewards.items.push(item);
          msg += ` et ${item}`;
        }
        rewards.xp += 10;
        if (champ) GameManager.shared.grantXP(10);
        statusText.text = msg + ' (+10 XP)';
        MusicManager.shared.playSFX('loot_common');
        inter.looted = true;
        break;
      }
      case 'bookshelf': {
        const lore = LORE_TEXTS[Math.floor(Math.random() * LORE_TEXTS.length)];
        statusText.text = lore;
        rewards.xp += 8;
        if (champ) GameManager.shared.grantXP(8);
        inter.looted = true;
        break;
      }
      case 'bed':
        if (champ) {
          const heal = Math.floor(GameManager.shared.maxHP * 0.3);
          champ.currentHP = Math.min(champ.currentHP + heal, GameManager.shared.maxHP);
          const invHeal = Math.floor(GameManager.shared.maxInvestiture * 0.2);
          champ.currentInvestiture = Math.min(champ.currentInvestiture + invHeal, GameManager.shared.maxInvestiture);
          statusText.text = `Vous vous reposez. +${heal} PV et +${invHeal} Investiture restaurés.`;
        } else {
          statusText.text = 'Le lit semble confortable.';
        }
        MusicManager.shared.playSFX('heal');
        inter.looted = true;
        break;
      case 'crafting_table':
        if (champ) {
          const gold = 3 + Math.floor(Math.random() * 8);
          rewards.gold += gold;
          champ.gold += gold;
          rewards.xp += 15;
          GameManager.shared.grantXP(15);
          statusText.text = `Vous inspectez l'atelier et trouvez des matériaux utiles. +${gold} or (+15 XP)`;
        } else {
          statusText.text = 'Un atelier de fabrication. Des outils sont disposés sur la table.';
        }
        inter.looted = true;
        break;
      case 'altar':
        if (champ) {
          const invRestore = Math.floor(GameManager.shared.maxInvestiture * 0.4);
          champ.currentInvestiture = Math.min(champ.currentInvestiture + invRestore, GameManager.shared.maxInvestiture);
          rewards.xp += 12;
          GameManager.shared.grantXP(12);
          statusText.text = `L'autel brille doucement. +${invRestore} Investiture restaurée (+12 XP)`;
        } else {
          statusText.text = 'Une énergie ancienne émane de l\'autel.';
        }
        MusicManager.shared.playSFX('magic_aondor');
        inter.looted = true;
        break;
      case 'barrel': {
        const gold = 2 + Math.floor(Math.random() * 8);
        rewards.gold += gold;
        if (champ) champ.gold += gold;
        const hasPotion = Math.random() < 0.5;
        if (hasPotion) {
          rewards.items.push('Potion de vie');
          statusText.text = `${inter.label} : Potion trouvée ! +${gold} or`;
        } else {
          statusText.text = `${inter.label} : +${gold} or`;
        }
        inter.looted = true;
        break;
      }
      case 'npc':
        statusText.text = `${inter.label} : "Bienvenue, voyageur ! Je n'ai rien à vendre pour l'instant, mais fouille bien cet endroit."`;
        break;
    }
    drawRoomView();
  }

  // Initial render
  statusText.text = `Vous entrez dans ${buildingName}. Explorez les pièces et interagissez avec les objets.`;
  drawRoomView();
  drawMinimap();
  drawNavButtons();

  uiContainer.addChild(panel);
  return panel;
}
