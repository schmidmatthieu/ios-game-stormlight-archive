// ─── Building Interior System (Baldur's Gate Style) ─────────────
// Procedurally generated dungeon-crawler interior overlay
// with rooms, corridors, and interactive elements.

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { GameManager } from '../game/GameManager';
import { MusicManager } from '../game/MusicSystem';

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

const CELL = 20;

const WORLD_COLORS: Record<string, number> = {
  scadrial: 0x332822, roshar: 0x1e2830, taldain: 0x3a3420,
  nalthis: 0x1a2820, komashi: 0x281828, sel: 0x282820, shadesmar: 0x0e0e20,
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
];

const ITEM_POOL = ['Potion de vie', 'Fiole de brume', 'Sphère infusée', 'Souffle capturé', 'Rune ancienne', 'Parchemin'];

// ─── Layout Generation ──────────────────────────────────────────

function detectBuildingType(name: string): BuildingType {
  const n = name.toLowerCase();
  if (n.includes('tavern') || n.includes('auberge')) return 'tavern';
  if (n.includes('temple') || n.includes('sanctuaire')) return 'temple';
  if (n.includes('forge') || n.includes('forgeron')) return 'forge';
  if (n.includes('biblio') || n.includes('library')) return 'library';
  if (n.includes('boutique') || n.includes('shop') || n.includes('march')) return 'shop';
  if (n.includes('guilde') || n.includes('guild')) return 'guild_hall';
  return 'house';
}

function generateRooms(buildingType: BuildingType): Room[] {
  const templates = ROOM_TEMPLATES[buildingType];
  const count = Math.min(templates.length, 3 + Math.floor(Math.random() * 3)); // 3-6
  const rooms: Room[] = [];

  for (let i = 0; i < count; i++) {
    const rw = 3 + Math.floor(Math.random() * 3); // 3-5 cells wide
    const rh = 3 + Math.floor(Math.random() * 3);
    // Place rooms in a rough grid to avoid overlap
    const col = i % 3;
    const row = Math.floor(i / 3);
    rooms.push({
      x: col * 7 + 1, y: row * 7 + 1,
      w: rw, h: rh,
      type: templates[i % templates.length],
      connections: [],
      interactables: [],
      explored: i === 0,
    });
  }

  // Connect rooms sequentially + one extra link
  for (let i = 1; i < rooms.length; i++) {
    rooms[i - 1].connections.push(i);
    rooms[i].connections.push(i - 1);
  }
  if (rooms.length > 3) {
    rooms[0].connections.push(rooms.length - 1);
    rooms[rooms.length - 1].connections.push(0);
  }

  // Populate interactables based on room type
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
      break;
    case 'shop_counter':
      room.interactables.push({ type: 'npc', x: cx, y: 1, looted: false, label: 'Marchand' });
      room.interactables.push({ type: 'chest', x: room.w - 1, y: cy, looted: false, label: 'Étalage' });
      break;
    case 'altar':
      room.interactables.push({ type: 'altar', x: cx, y: cy, looted: false, label: 'Autel' });
      break;
    case 'library':
      room.interactables.push({ type: 'bookshelf', x: 1, y: cy, looted: false, label: 'Étagère' });
      room.interactables.push({ type: 'bookshelf', x: room.w - 1, y: cy, looted: false, label: 'Bibliothèque' });
      break;
    case 'forge':
      room.interactables.push({ type: 'crafting_table', x: cx, y: cy, looted: false, label: 'Enclume' });
      break;
    case 'main_hall':
      room.interactables.push({ type: 'chest', x: room.w - 1, y: room.h - 1, looted: false, label: 'Coffre orné' });
      break;
    default:
      break;
  }
}

// ─── Rendering Helpers ──────────────────────────────────────────

const INTERACTABLE_COLORS: Record<string, number> = {
  chest: 0xccaa33, bookshelf: 0x886644, bed: 0x6666aa,
  crafting_table: 0xaa6633, barrel: 0x997744, altar: 0xddddff, npc: 0x44cc66,
};

const INTERACTABLE_ICONS: Record<string, string> = {
  chest: 'C', bookshelf: 'L', bed: 'Z', crafting_table: 'T',
  barrel: 'B', altar: 'A', npc: 'P',
};

function roomLabel(type: RoomType): string {
  const labels: Record<RoomType, string> = {
    corridor: 'Couloir', main_hall: 'Salle principale', bedroom: 'Chambre',
    storage: 'Réserve', kitchen: 'Cuisine', shop_counter: 'Comptoir',
    altar: 'Sanctuaire', library: 'Bibliothèque', forge: 'Forge', cellar: 'Cave',
  };
  return labels[type];
}

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
  const floorColor = WORLD_COLORS[worldID] ?? 0x222222;
  const wallColor = (floorColor & 0xfefefe) + 0x222222;

  // ── Overlay background
  const overlay = new Graphics();
  overlay.rect(0, 0, screenW, screenH).fill({ color: 0x000000, alpha: 0.75 });
  overlay.eventMode = 'static';
  panel.addChild(overlay);

  // ── Map container (centered)
  const mapW = 22 * CELL;
  const mapH = 16 * CELL;
  const mapX = (screenW - mapW) / 2;
  const mapY = (screenH - mapH) / 2 + 20;
  const mapContainer = new Container();
  mapContainer.x = mapX;
  mapContainer.y = mapY;
  panel.addChild(mapContainer);

  // ── Title
  const title = new Text({
    text: buildingName,
    style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 14, fill: 0xe6cc66, fontWeight: 'bold' }),
  });
  title.anchor.set(0.5, 0);
  title.x = screenW / 2;
  title.y = mapY - 30;
  panel.addChild(title);

  // ── Status text
  const statusText = new Text({
    text: '',
    style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 10, fill: 0xccccbb, wordWrap: true, wordWrapWidth: mapW }),
  });
  statusText.x = mapX;
  statusText.y = mapY + mapH + 8;
  panel.addChild(statusText);

  // ── Close button
  const closeBg = new Graphics();
  closeBg.roundRect(screenW / 2 - 50, mapY + mapH + 35, 100, 28, 6)
    .fill({ color: 0x442222, alpha: 0.9 })
    .stroke({ color: 0x884444, width: 1 });
  closeBg.eventMode = 'static';
  closeBg.cursor = 'pointer';
  closeBg.on('pointerdown', () => {
    panel.destroy({ children: true });
    onClose(rewards);
  });
  panel.addChild(closeBg);

  const closeLabel = new Text({
    text: 'Sortir',
    style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 11, fill: 0xffcccc, fontWeight: 'bold' }),
  });
  closeLabel.anchor.set(0.5);
  closeLabel.x = screenW / 2;
  closeLabel.y = mapY + mapH + 49;
  panel.addChild(closeLabel);

  // ── Drawing functions
  function drawMap(): void {
    mapContainer.removeChildren();
    const g = new Graphics();
    mapContainer.addChild(g);

    for (let ri = 0; ri < rooms.length; ri++) {
      const room = rooms[ri];
      const isCurrent = ri === currentRoom;
      const alpha = room.explored ? (isCurrent ? 1.0 : 0.5) : 0.15;

      // Floor
      g.rect(room.x * CELL, room.y * CELL, room.w * CELL, room.h * CELL)
        .fill({ color: floorColor, alpha });

      // Walls
      g.rect(room.x * CELL, room.y * CELL, room.w * CELL, room.h * CELL)
        .stroke({ color: wallColor, width: 2, alpha: alpha * 0.8 });

      // Torchlight glow for current room
      if (isCurrent) {
        const cx = (room.x + room.w / 2) * CELL;
        const cy = (room.y + room.h / 2) * CELL;
        const radius = Math.max(room.w, room.h) * CELL * 0.6;
        g.circle(cx, cy, radius).fill({ color: 0xffaa44, alpha: 0.08 });
      }

      // Room label
      if (room.explored) {
        const label = new Text({
          text: roomLabel(room.type),
          style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 7, fill: 0x999988 }),
        });
        label.alpha = alpha;
        label.x = room.x * CELL + 3;
        label.y = room.y * CELL + 2;
        mapContainer.addChild(label);
      }
    }

    // Draw corridors between connected rooms
    for (let ri = 0; ri < rooms.length; ri++) {
      const ra = rooms[ri];
      for (const ci of ra.connections) {
        if (ci <= ri) continue; // draw each corridor once
        const rb = rooms[ci];
        const ax = (ra.x + ra.w / 2) * CELL;
        const ay = (ra.y + ra.h / 2) * CELL;
        const bx = (rb.x + rb.w / 2) * CELL;
        const by = (rb.y + rb.h / 2) * CELL;
        g.moveTo(ax, ay).lineTo(bx, by)
          .stroke({ color: 0x554433, width: 4, alpha: 0.6 });
      }
    }

    // Draw interactables in current room
    const room = rooms[currentRoom];
    for (const inter of room.interactables) {
      const ix = (room.x + inter.x) * CELL;
      const iy = (room.y + inter.y) * CELL;
      const color = INTERACTABLE_COLORS[inter.type] ?? 0xaaaaaa;
      const dimmed = inter.looted ? 0.3 : 1.0;

      g.roundRect(ix - 6, iy - 6, 12, 12, 2)
        .fill({ color, alpha: dimmed * 0.8 })
        .stroke({ color: 0xffffff, width: 1, alpha: dimmed * 0.3 });

      const icon = new Text({
        text: INTERACTABLE_ICONS[inter.type] ?? '?',
        style: new TextStyle({ fontFamily: 'monospace', fontSize: 8, fill: 0xffffff }),
      });
      icon.anchor.set(0.5);
      icon.alpha = dimmed;
      icon.x = ix;
      icon.y = iy;
      icon.eventMode = 'static';
      icon.cursor = 'pointer';
      icon.on('pointerdown', () => handleInteract(inter));
      mapContainer.addChild(icon);
    }

    // Player dot in current room
    const pr = rooms[currentRoom];
    const px = (pr.x + pr.w / 2) * CELL;
    const py = (pr.y + pr.h / 2) * CELL;
    g.circle(px, py, 5).fill({ color: 0x44ff88 })
      .stroke({ color: 0xffffff, width: 1 });

    // Room navigation buttons (adjacent rooms)
    for (const ci of rooms[currentRoom].connections) {
      const target = rooms[ci];
      const tx = (target.x + target.w / 2) * CELL;
      const ty = (target.y + target.h / 2) * CELL;
      const navBtn = new Graphics();
      navBtn.circle(tx, ty, 8)
        .fill({ color: 0x448844, alpha: 0.6 })
        .stroke({ color: 0x88cc88, width: 1, alpha: 0.8 });
      navBtn.eventMode = 'static';
      navBtn.cursor = 'pointer';
      navBtn.on('pointerdown', () => moveToRoom(ci));
      mapContainer.addChild(navBtn);
    }
  }

  function moveToRoom(index: number): void {
    currentRoom = index;
    rooms[index].explored = true;
    statusText.text = `Vous entrez dans : ${roomLabel(rooms[index].type)}`;
    drawMap();
  }

  function handleInteract(inter: Interactable): void {
    if (inter.looted) {
      statusText.text = `${inter.label} — déjà fouillé.`;
      return;
    }

    switch (inter.type) {
      case 'chest': {
        const gold = 5 + Math.floor(Math.random() * 21);
        rewards.gold += gold;
        if (champ) champ.gold += gold;
        const hasItem = Math.random() < 0.4;
        let msg = `${inter.label} : +${gold} or`;
        if (hasItem) {
          const item = ITEM_POOL[Math.floor(Math.random() * ITEM_POOL.length)];
          rewards.items.push(item);
          msg += ` et ${item}`;
        }
        statusText.text = msg;
        inter.looted = true;
        break;
      }
      case 'bookshelf': {
        const lore = LORE_TEXTS[Math.floor(Math.random() * LORE_TEXTS.length)];
        statusText.text = `📖 ${lore}`;
        rewards.xp += 5;
        if (champ) GameManager.shared.grantXP(5);
        inter.looted = true;
        break;
      }
      case 'bed':
        if (champ) {
          const heal = Math.floor(GameManager.shared.maxHP * 0.25);
          champ.currentHP = Math.min(champ.currentHP + heal, GameManager.shared.maxHP);
          statusText.text = `Vous vous reposez. +${heal} PV restaurés.`;
        } else {
          statusText.text = 'Le lit semble confortable.';
        }
        inter.looted = true;
        break;
      case 'crafting_table':
        statusText.text = `${inter.label} — pas d'ingrédients disponibles.`;
        break;
      case 'altar':
        if (champ) {
          statusText.text = 'L\'autel brille doucement. Investiture restaurée (+25%).';
        } else {
          statusText.text = 'Une énergie étrange émane de l\'autel.';
        }
        inter.looted = true;
        break;
      case 'barrel': {
        const gold = 1 + Math.floor(Math.random() * 5);
        rewards.gold += gold;
        if (champ) champ.gold += gold;
        const hasPotion = Math.random() < 0.5;
        statusText.text = hasPotion
          ? `${inter.label} : Potion trouvée ! +${gold} or`
          : `${inter.label} : +${gold} or`;
        if (hasPotion) rewards.items.push('Potion de vie');
        inter.looted = true;
        break;
      }
      case 'npc':
        statusText.text = `${inter.label} : "Bienvenue, voyageur. Revenez plus tard pour commercer."`;
        break;
    }
    drawMap();
  }

  // Initial draw
  statusText.text = `Vous entrez dans : ${roomLabel(rooms[0].type)}`;
  drawMap();

  uiContainer.addChild(panel);
  return panel;
}
