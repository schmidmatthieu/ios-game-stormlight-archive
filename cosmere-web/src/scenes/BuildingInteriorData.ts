// ─── Building Interior Data — Types, Constants & Room Generation ───
// Extracted from BuildingInteriorScene.ts for modularity.

// ─── Types ──────────────────────────────────────────────────────

export type RoomType = 'corridor' | 'main_hall' | 'bedroom' | 'storage' | 'kitchen' |
  'shop_counter' | 'altar' | 'library' | 'forge' | 'cellar';

export interface Room {
  x: number; y: number;
  w: number; h: number;
  type: RoomType;
  connections: number[];
  interactables: Interactable[];
  explored: boolean;
}

export interface Interactable {
  type: 'chest' | 'bookshelf' | 'bed' | 'crafting_table' | 'barrel' | 'altar' | 'npc';
  x: number; y: number;
  looted: boolean;
  label: string;
}

export type BuildingType = 'house' | 'shop' | 'tavern' | 'temple' | 'forge' | 'library' | 'guild_hall';

// ─── Constants ──────────────────────────────────────────────────

export const WORLD_COLORS: Record<string, { floor: number; wall: number; accent: number }> = {
  scadrial: { floor: 0x332822, wall: 0x554438, accent: 0xaa6633 },
  roshar: { floor: 0x1e2830, wall: 0x3a4858, accent: 0x4488cc },
  taldain: { floor: 0x3a3420, wall: 0x5a5438, accent: 0xddaa55 },
  nalthis: { floor: 0x1a2820, wall: 0x3a4838, accent: 0x44cc88 },
  komashi: { floor: 0x281828, wall: 0x483848, accent: 0xaa55cc },
  sel: { floor: 0x282820, wall: 0x484838, accent: 0xccaa44 },
  shadesmar: { floor: 0x0e0e20, wall: 0x2a2a44, accent: 0x8866cc },
};

export const ROOM_TEMPLATES: Record<BuildingType, RoomType[]> = {
  house: ['main_hall', 'bedroom', 'kitchen', 'storage'],
  shop: ['shop_counter', 'storage', 'cellar'],
  tavern: ['main_hall', 'kitchen', 'storage', 'bedroom', 'cellar'],
  temple: ['main_hall', 'altar', 'library', 'storage'],
  forge: ['forge', 'storage', 'cellar'],
  library: ['main_hall', 'library', 'library', 'storage'],
  guild_hall: ['main_hall', 'bedroom', 'forge', 'library', 'storage', 'cellar'],
};

export const LORE_TEXTS = [
  'Les brumes de Scadrial cachent bien des secrets...',
  'Un ancien glyphe est gravé dans la pierre.',
  'Vous trouvez un journal poussiéreux rempli de notes cryptiques.',
  'Une carte partielle du Shadesmar est esquissée ici.',
  'Des notes sur l\'Investiture et ses formes multiples.',
  'Un traité sur les Éclats et leur pouvoir.',
  'Le journal mentionne des passages secrets entre les mondes.',
  'Des croquis de créatures inconnues ornent les pages.',
];

export const ITEM_POOL = ['Potion de vie', 'Fiole de brume', 'Sphère infusée', 'Souffle capturé', 'Rune ancienne', 'Parchemin'];

export const INTERACTABLE_COLORS: Record<string, number> = {
  chest: 0xccaa33, bookshelf: 0x886644, bed: 0x6666aa,
  crafting_table: 0xaa6633, barrel: 0x997744, altar: 0xddddff, npc: 0x44cc66,
};

export const INTERACTABLE_LABELS: Record<string, string> = {
  chest: 'Coffre', bookshelf: 'Livres', bed: 'Lit', crafting_table: 'Atelier',
  barrel: 'Tonneau', altar: 'Autel', npc: 'Parler',
};

// ─── Layout Generation ──────────────────────────────────────────

export function detectBuildingType(name: string): BuildingType {
  const n = name.toLowerCase();
  if (n.includes('tavern') || n.includes('auberge')) return 'tavern';
  if (n.includes('temple') || n.includes('sanctuaire') || n.includes('refuge')) return 'temple';
  if (n.includes('forge') || n.includes('forgeron') || n.includes('acier')) return 'forge';
  if (n.includes('biblio') || n.includes('library') || n.includes('salle des')) return 'library';
  if (n.includes('boutique') || n.includes('shop') || n.includes('march') || n.includes('échange')) return 'shop';
  if (n.includes('guilde') || n.includes('guild') || n.includes('cache') || n.includes('bastion')) return 'guild_hall';
  return 'house';
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

export function generateRooms(buildingType: BuildingType): Room[] {
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

// ─── Room label ────────────────────────────────────────────────

export function roomLabel(type: RoomType): string {
  const labels: Record<RoomType, string> = {
    corridor: 'Couloir', main_hall: 'Salle Principale', bedroom: 'Chambre',
    storage: 'Réserve', kitchen: 'Cuisine', shop_counter: 'Comptoir',
    altar: 'Sanctuaire', library: 'Bibliothèque', forge: 'Forge', cellar: 'Cave',
  };
  return labels[type];
}

// ─── Interaction Logic ────────────────────────────────────────

export interface InteractionContext {
  maxHP: number;
  maxInvestiture: number;
  currentHP: number;
  currentInvestiture: number;
  hasChampion: boolean;
}

export interface InteractionResult {
  statusText: string;
  gold: number;
  xp: number;
  items: string[];
  healHP: number;
  healInvestiture: number;
  sfx: string | null;
  markLooted: boolean;
}

export function processInteraction(inter: Interactable, ctx: InteractionContext): InteractionResult {
  const result: InteractionResult = {
    statusText: '',
    gold: 0, xp: 0, items: [],
    healHP: 0, healInvestiture: 0,
    sfx: null, markLooted: false,
  };

  if (inter.looted) {
    result.statusText = `${inter.label} — déjà fouillé.`;
    return result;
  }

  switch (inter.type) {
    case 'chest': {
      const gold = 8 + Math.floor(Math.random() * 25);
      result.gold = gold;
      const hasItem = Math.random() < 0.4;
      let msg = `${inter.label} ouvert ! +${gold} or`;
      if (hasItem) {
        const item = ITEM_POOL[Math.floor(Math.random() * ITEM_POOL.length)];
        result.items.push(item);
        msg += ` et ${item}`;
      }
      result.xp = 10;
      result.statusText = msg + ' (+10 XP)';
      result.sfx = 'loot_common';
      result.markLooted = true;
      break;
    }
    case 'bookshelf': {
      const lore = LORE_TEXTS[Math.floor(Math.random() * LORE_TEXTS.length)];
      result.statusText = lore;
      result.xp = 8;
      result.markLooted = true;
      break;
    }
    case 'bed':
      if (ctx.hasChampion) {
        const heal = Math.floor(ctx.maxHP * 0.3);
        const invHeal = Math.floor(ctx.maxInvestiture * 0.2);
        result.healHP = heal;
        result.healInvestiture = invHeal;
        result.statusText = `Vous vous reposez. +${heal} PV et +${invHeal} Investiture restaurés.`;
      } else {
        result.statusText = 'Le lit semble confortable.';
      }
      result.sfx = 'heal';
      result.markLooted = true;
      break;
    case 'crafting_table':
      if (ctx.hasChampion) {
        const gold = 3 + Math.floor(Math.random() * 8);
        result.gold = gold;
        result.xp = 15;
        result.statusText = `Vous inspectez l'atelier et trouvez des matériaux utiles. +${gold} or (+15 XP)`;
      } else {
        result.statusText = 'Un atelier de fabrication. Des outils sont disposés sur la table.';
      }
      result.markLooted = true;
      break;
    case 'altar':
      if (ctx.hasChampion) {
        const invRestore = Math.floor(ctx.maxInvestiture * 0.4);
        result.healInvestiture = invRestore;
        result.xp = 12;
        result.statusText = `L'autel brille doucement. +${invRestore} Investiture restaurée (+12 XP)`;
      } else {
        result.statusText = 'Une énergie ancienne émane de l\'autel.';
      }
      result.sfx = 'magic_aondor';
      result.markLooted = true;
      break;
    case 'barrel': {
      const gold = 2 + Math.floor(Math.random() * 8);
      result.gold = gold;
      const hasPotion = Math.random() < 0.5;
      if (hasPotion) {
        result.items.push('Potion de vie');
        result.statusText = `${inter.label} : Potion trouvée ! +${gold} or`;
      } else {
        result.statusText = `${inter.label} : +${gold} or`;
      }
      result.markLooted = true;
      break;
    }
    case 'npc':
      result.statusText = `${inter.label} : "Bienvenue, voyageur ! Je n'ai rien à vendre pour l'instant, mais fouille bien cet endroit."`;
      break;
  }
  return result;
}
