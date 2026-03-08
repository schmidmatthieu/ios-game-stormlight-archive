// ─── Shop Panel — World-Specific Vendor ─────────────────────────
// Each world has unique items, armor, potions, and rotating stock.

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { GameManager } from '../game/GameManager';
import { gameData } from '../data/DataLoader';
import { getShopDiscount, getCurrentRank } from '../game/ReputationSystem';
import { getLayoutInfo, fontSize, scaled, panelSize, panelRadius, buttonHeight, UI_COLORS, UI_ALPHA } from './ResponsiveLayout';
import type { Champion, ChampionClass, ItemRarity, EquipmentSlot, Item } from '../data/types';

// ─── Shop Item Type ─────────────────────────────────────────────

interface ShopItem {
  name: string;
  cost: number;
  effect: string;
  value: number;
  rarity: ItemRarity;
  description: string;
  category: 'potion' | 'armor' | 'weapon' | 'accessory' | 'material';
  minRepRank?: number; // minimum reputation rank index (0-5) required to buy
}

// ─── Rarity Colors ──────────────────────────────────────────────

const RARITY_COLORS: Record<ItemRarity, number> = {
  common: 0xaaaaaa, uncommon: 0x55cc55, rare: 0x5588ee,
  epic: 0x9955ee, legendary: 0xee9911, cosmeric: 0xee2222,
};

// ─── Base Items (available everywhere) ──────────────────────────

const BASE_ITEMS: ShopItem[] = [
  { name: 'Potion de soin', cost: 20, effect: 'hp', value: 50, rarity: 'common', description: 'Restaure 50 PV', category: 'potion' },
  { name: 'Potion d\'investiture', cost: 25, effect: 'inv', value: 40, rarity: 'common', description: 'Restaure 40 Investiture', category: 'potion' },
  { name: 'Grande Potion de soin', cost: 60, effect: 'hp', value: 120, rarity: 'uncommon', description: 'Restaure 120 PV', category: 'potion' },
];

// ─── World-Specific Items ───────────────────────────────────────

const WORLD_ITEMS: Record<string, ShopItem[]> = {
  scadrial: [
    { name: 'Fioles de brume', cost: 35, effect: 'inv', value: 60, rarity: 'uncommon', description: 'Investiture +60 (Brume distillée)', category: 'potion' },
    { name: 'Plastron de cendres', cost: 120, effect: 'chest_def', value: 8, rarity: 'rare', description: 'Armure de torse : Défense +8', category: 'armor' },
    { name: 'Jambières d\'atium', cost: 180, effect: 'legs_agi', value: 5, rarity: 'rare', description: 'Jambes : Agilité +5', category: 'armor' },
    { name: 'Dague en acier', cost: 90, effect: 'weapon_str', value: 6, rarity: 'uncommon', description: 'Arme : Force +6', category: 'weapon' },
    { name: 'Bottes du Brûleur', cost: 100, effect: 'boots_agi', value: 4, rarity: 'uncommon', description: 'Bottes : Agilité +4', category: 'armor' },
    { name: 'Épaulières de Pewter', cost: 130, effect: 'shoulders_str', value: 5, rarity: 'rare', description: 'Épaules : Force +5', category: 'armor' },
    { name: 'Pépite de métal rare', cost: 50, effect: 'material', value: 0, rarity: 'uncommon', description: 'Matériau de fabrication', category: 'material' },
    // Reputation-gated items
    { name: 'Boucles de Kelsier', cost: 200, effect: 'ring_luck', value: 4, rarity: 'epic', description: 'Anneau : Chance +4', category: 'accessory', minRepRank: 2 },
    { name: 'Cape du Survivant', cost: 280, effect: 'cape_all', value: 3, rarity: 'epic', description: 'Cape : Tous stats +3', category: 'armor', minRepRank: 3 },
    { name: 'Bouclier de Brume', cost: 180, effect: 'offhand_def', value: 7, rarity: 'rare', description: 'Bouclier : Défense +7', category: 'armor', minRepRank: 2 },
    { name: 'Lame d\'Atium Légendaire', cost: 500, effect: 'weapon_str', value: 18, rarity: 'legendary', description: 'Arme : Force +18', category: 'weapon', minRepRank: 4 },
  ],
  roshar: [
    { name: 'Sphère infusée', cost: 30, effect: 'inv', value: 55, rarity: 'uncommon', description: 'Investiture +55 (Lumière d\'orage)', category: 'potion' },
    { name: 'Carapace de Crustacé', cost: 130, effect: 'chest_def', value: 10, rarity: 'rare', description: 'Armure de torse : Défense +10', category: 'armor' },
    { name: 'Bottes de Chasseur', cost: 100, effect: 'boots_agi', value: 4, rarity: 'uncommon', description: 'Bottes : Agilité +4', category: 'armor' },
    { name: 'Lance de Herdaz', cost: 95, effect: 'weapon_str', value: 7, rarity: 'uncommon', description: 'Arme : Force +7', category: 'weapon' },
    { name: 'Épaulières de Carapace', cost: 135, effect: 'shoulders_def', value: 6, rarity: 'rare', description: 'Épaules : Défense +6', category: 'armor' },
    { name: 'Ceinture de Guerrier', cost: 90, effect: 'belt_vig', value: 4, rarity: 'uncommon', description: 'Ceinture : Vigueur +4', category: 'armor' },
    { name: 'Gemme de Lumière', cost: 55, effect: 'material', value: 0, rarity: 'uncommon', description: 'Matériau de fabrication', category: 'material' },
    // Reputation-gated items
    { name: 'Éclat de Shard', cost: 250, effect: 'weapon_str', value: 12, rarity: 'epic', description: 'Arme : Force +12', category: 'weapon', minRepRank: 2 },
    { name: 'Bouclier de Shardplate', cost: 220, effect: 'offhand_def', value: 9, rarity: 'epic', description: 'Bouclier : Défense +9', category: 'armor', minRepRank: 3 },
    { name: 'Jambières de Shardplate', cost: 260, effect: 'legs_agi', value: 8, rarity: 'epic', description: 'Jambes : Agilité +8', category: 'armor', minRepRank: 3 },
    { name: 'Honeurlame', cost: 600, effect: 'weapon_str', value: 20, rarity: 'legendary', description: 'Arme : Force +20', category: 'weapon', minRepRank: 5 },
  ],
  taldain: [
    { name: 'Élixir d\'hydratation', cost: 30, effect: 'hp', value: 45, rarity: 'common', description: 'PV +45 (Eau pure)', category: 'potion' },
    { name: 'Voile de sable', cost: 110, effect: 'cape_spi', value: 6, rarity: 'rare', description: 'Cape : Esprit +6', category: 'armor' },
    { name: 'Gantelets du désert', cost: 85, effect: 'gloves_str', value: 4, rarity: 'uncommon', description: 'Gants : Force +4', category: 'armor' },
    { name: 'Lame solaire', cost: 140, effect: 'weapon_str', value: 9, rarity: 'rare', description: 'Arme : Force +9', category: 'weapon' },
    { name: 'Bottes du Sable', cost: 95, effect: 'boots_agi', value: 4, rarity: 'uncommon', description: 'Bottes : Agilité +4', category: 'armor' },
    { name: 'Jambières du Désert', cost: 120, effect: 'legs_agi', value: 5, rarity: 'rare', description: 'Jambes : Agilité +5', category: 'armor' },
    { name: 'Sable blanc pur', cost: 40, effect: 'material', value: 0, rarity: 'uncommon', description: 'Matériau de fabrication', category: 'material' },
    // Reputation-gated items
    { name: 'Amulette de Dayside', cost: 190, effect: 'amulet_spi', value: 7, rarity: 'epic', description: 'Amulette : Esprit +7', category: 'accessory', minRepRank: 2 },
    { name: 'Épaulières du Maître Solaire', cost: 200, effect: 'shoulders_str', value: 7, rarity: 'epic', description: 'Épaules : Force +7', category: 'armor', minRepRank: 3 },
    { name: 'Rondache de Sable', cost: 170, effect: 'offhand_def', value: 6, rarity: 'rare', description: 'Bouclier : Défense +6', category: 'armor', minRepRank: 2 },
    { name: 'Lame de l\'Ombre', cost: 450, effect: 'weapon_str', value: 16, rarity: 'legendary', description: 'Arme : Force +16', category: 'weapon', minRepRank: 4 },
  ],
  nalthis: [
    { name: 'Souffle capturé', cost: 45, effect: 'inv', value: 65, rarity: 'uncommon', description: 'Investiture +65 (BioChroma)', category: 'potion' },
    { name: 'Tunique chromatique', cost: 125, effect: 'chest_spi', value: 8, rarity: 'rare', description: 'Torse : Esprit +8', category: 'armor' },
    { name: 'Ceinture d\'Éveilleur', cost: 95, effect: 'belt_spi', value: 5, rarity: 'uncommon', description: 'Ceinture : Esprit +5', category: 'armor' },
    { name: 'Épée animée', cost: 160, effect: 'weapon_str', value: 10, rarity: 'rare', description: 'Arme : Force +10', category: 'weapon' },
    { name: 'Bottes Chromatiques', cost: 110, effect: 'boots_agi', value: 5, rarity: 'rare', description: 'Bottes : Agilité +5', category: 'armor' },
    { name: 'Épaulières du Revenu', cost: 140, effect: 'shoulders_def', value: 6, rarity: 'rare', description: 'Épaules : Défense +6', category: 'armor' },
    { name: 'Jambières d\'Éveilleur', cost: 130, effect: 'legs_agi', value: 5, rarity: 'rare', description: 'Jambes : Agilité +5', category: 'armor' },
    { name: 'Teinture vivante', cost: 45, effect: 'material', value: 0, rarity: 'uncommon', description: 'Matériau de fabrication', category: 'material' },
    // Reputation-gated items
    { name: 'Anneau des Cinq Érudits', cost: 220, effect: 'ring_spi', value: 8, rarity: 'epic', description: 'Anneau : Esprit +8', category: 'accessory', minRepRank: 2 },
    { name: 'Cape de BioChroma', cost: 250, effect: 'cape_all', value: 3, rarity: 'epic', description: 'Cape : Tous stats +3', category: 'armor', minRepRank: 3 },
    { name: 'Lame Animée Divine', cost: 480, effect: 'weapon_str', value: 17, rarity: 'legendary', description: 'Arme : Force +17', category: 'weapon', minRepRank: 4 },
  ],
  sel: [
    { name: 'Tonique du Dor', cost: 35, effect: 'inv', value: 50, rarity: 'uncommon', description: 'Investiture +50 (Énergie du Dor)', category: 'potion' },
    { name: 'Robe d\'Élantris', cost: 130, effect: 'chest_spi', value: 9, rarity: 'rare', description: 'Torse : Esprit +9', category: 'armor' },
    { name: 'Heaume du Seon', cost: 150, effect: 'helmet_spi', value: 7, rarity: 'rare', description: 'Casque : Esprit +7', category: 'armor' },
    { name: 'Bâton runique', cost: 140, effect: 'weapon_spi', value: 8, rarity: 'rare', description: 'Arme : Esprit +8', category: 'weapon' },
    { name: 'Bottes du Scribe', cost: 100, effect: 'boots_agi', value: 4, rarity: 'uncommon', description: 'Bottes : Agilité +4', category: 'armor' },
    { name: 'Épaulières Runiques', cost: 135, effect: 'shoulders_spi', value: 5, rarity: 'rare', description: 'Épaules : Esprit +5', category: 'armor' },
    { name: 'Ceinture du Dor', cost: 95, effect: 'belt_spi', value: 5, rarity: 'uncommon', description: 'Ceinture : Esprit +5', category: 'armor' },
    { name: 'Pierre de Dor', cost: 50, effect: 'material', value: 0, rarity: 'uncommon', description: 'Matériau de fabrication', category: 'material' },
    // Reputation-gated items
    { name: 'Amulette d\'Aon', cost: 210, effect: 'amulet_spi', value: 9, rarity: 'epic', description: 'Amulette : Esprit +9', category: 'accessory', minRepRank: 2 },
    { name: 'Tome Runique (offhand)', cost: 180, effect: 'offhand_spi', value: 7, rarity: 'rare', description: 'Tome : Esprit +7', category: 'armor', minRepRank: 2 },
    { name: 'Jambières d\'Aon', cost: 200, effect: 'legs_agi', value: 6, rarity: 'epic', description: 'Jambes : Agilité +6', category: 'armor', minRepRank: 3 },
    { name: 'Bâton du Dor Suprême', cost: 500, effect: 'weapon_spi', value: 16, rarity: 'legendary', description: 'Arme : Esprit +16', category: 'weapon', minRepRank: 4 },
  ],
  komashi: [
    { name: 'Encre de protection', cost: 30, effect: 'hp', value: 40, rarity: 'common', description: 'PV +40 (Encre enchantée)', category: 'potion' },
    { name: 'Cape du Peintre', cost: 115, effect: 'cape_spi', value: 7, rarity: 'rare', description: 'Cape : Esprit +7', category: 'armor' },
    { name: 'Épaulières de cauchemar', cost: 140, effect: 'shoulders_def', value: 6, rarity: 'rare', description: 'Épaules : Défense +6', category: 'armor' },
    { name: 'Pinceau de combat', cost: 100, effect: 'weapon_spi', value: 7, rarity: 'uncommon', description: 'Arme : Esprit +7', category: 'weapon' },
    { name: 'Bottes du Rêveur', cost: 95, effect: 'boots_agi', value: 4, rarity: 'uncommon', description: 'Bottes : Agilité +4', category: 'armor' },
    { name: 'Jambières d\'Encre', cost: 120, effect: 'legs_agi', value: 5, rarity: 'rare', description: 'Jambes : Agilité +5', category: 'armor' },
    { name: 'Ceinture de Cauchemar', cost: 90, effect: 'belt_spi', value: 4, rarity: 'uncommon', description: 'Ceinture : Esprit +4', category: 'armor' },
    { name: 'Encre de Cauchemar', cost: 45, effect: 'material', value: 0, rarity: 'uncommon', description: 'Matériau de fabrication', category: 'material' },
    // Reputation-gated items
    { name: 'Pierre empilée', cost: 170, effect: 'ring_luck', value: 5, rarity: 'epic', description: 'Anneau : Chance +5', category: 'accessory', minRepRank: 2 },
    { name: 'Kimono du Maître des Songes', cost: 300, effect: 'chest_spi', value: 12, rarity: 'epic', description: 'Torse : Esprit +12', category: 'armor', minRepRank: 3 },
    { name: 'Pinceau Ancestral Légendaire', cost: 480, effect: 'weapon_spi', value: 15, rarity: 'legendary', description: 'Arme : Esprit +15', category: 'weapon', minRepRank: 4 },
  ],
  shadesmar: [
    { name: 'Bille d\'Investiture', cost: 40, effect: 'inv', value: 70, rarity: 'uncommon', description: 'Investiture +70 (Essence cognitive)', category: 'potion' },
    { name: 'Armure cognitive', cost: 160, effect: 'chest_def', value: 12, rarity: 'epic', description: 'Torse : Défense +12', category: 'armor' },
    { name: 'Bottes de Passage', cost: 120, effect: 'boots_agi', value: 6, rarity: 'rare', description: 'Bottes : Agilité +6', category: 'armor' },
    { name: 'Lame de Spren', cost: 200, effect: 'weapon_str', value: 14, rarity: 'epic', description: 'Arme : Force +14', category: 'weapon' },
    { name: 'Épaulières Cognitives', cost: 150, effect: 'shoulders_def', value: 7, rarity: 'rare', description: 'Épaules : Défense +7', category: 'armor' },
    { name: 'Jambières de l\'Arpenteur', cost: 140, effect: 'legs_agi', value: 6, rarity: 'rare', description: 'Jambes : Agilité +6', category: 'armor' },
    { name: 'Cape de l\'Au-Delà', cost: 130, effect: 'cape_spi', value: 6, rarity: 'rare', description: 'Cape : Esprit +6', category: 'armor' },
    { name: 'Ceinture Cognitive', cost: 100, effect: 'belt_vig', value: 5, rarity: 'uncommon', description: 'Ceinture : Vigueur +5', category: 'armor' },
    { name: 'Essence cognitive', cost: 60, effect: 'material', value: 0, rarity: 'rare', description: 'Matériau de fabrication', category: 'material' },
    // Reputation-gated items
    { name: 'Anneau Cosmérique', cost: 300, effect: 'ring_all', value: 3, rarity: 'legendary', description: 'Anneau : Tous stats +3', category: 'accessory', minRepRank: 3 },
    { name: 'Bouclier Cognitif', cost: 240, effect: 'offhand_def', value: 10, rarity: 'epic', description: 'Bouclier : Défense +10', category: 'armor', minRepRank: 3 },
    { name: 'Lame Cosmérique', cost: 650, effect: 'weapon_str', value: 22, rarity: 'legendary', description: 'Arme : Force +22', category: 'weapon', minRepRank: 5 },
  ],
};

// ─── Class-Specific Gear (only shown to matching class) ─────────

const CLASS_ITEMS: Record<ChampionClass, ShopItem[]> = {
  mistborn: [
    { name: 'Ceinture d\'allomancien', cost: 110, effect: 'belt_vig', value: 6, rarity: 'rare', description: 'Ceinture : Vigueur +6 (spécial Brumeux)', category: 'armor' },
    { name: 'Manteau de brume', cost: 160, effect: 'cape_all', value: 2, rarity: 'rare', description: 'Cape : Tous stats +2 (spécial Brumeux)', category: 'armor' },
    { name: 'Fioles doubles', cost: 45, effect: 'inv', value: 80, rarity: 'uncommon', description: 'Investiture +80 (double dose)', category: 'potion' },
  ],
  radiant: [
    { name: 'Armure de Shardplate légère', cost: 180, effect: 'chest_def', value: 12, rarity: 'rare', description: 'Torse : Défense +12 (spécial Radieux)', category: 'armor' },
    { name: 'Bottes de Lashing', cost: 130, effect: 'boots_agi', value: 7, rarity: 'rare', description: 'Bottes : Agilité +7 (spécial Radieux)', category: 'armor' },
    { name: 'Sphère infusée parfaite', cost: 50, effect: 'inv', value: 85, rarity: 'uncommon', description: 'Investiture +85 (Lumière pure)', category: 'potion' },
  ],
  awakener: [
    { name: 'Gants chromatiques', cost: 120, effect: 'gloves_str', value: 6, rarity: 'rare', description: 'Gants : Force +6 (spécial Éveilleur)', category: 'armor' },
    { name: 'Corde éveillée', cost: 90, effect: 'weapon_str', value: 8, rarity: 'uncommon', description: 'Arme : Force +8 (spécial Éveilleur)', category: 'weapon' },
    { name: 'Elixir de BioChroma', cost: 55, effect: 'inv', value: 90, rarity: 'uncommon', description: 'Investiture +90 (Souffle concentré)', category: 'potion' },
  ],
  elantrian: [
    { name: 'Robe runique', cost: 150, effect: 'chest_spi', value: 10, rarity: 'rare', description: 'Torse : Esprit +10 (spécial Élantrien)', category: 'armor' },
    { name: 'Baguette d\'Aon', cost: 140, effect: 'weapon_spi', value: 9, rarity: 'rare', description: 'Arme : Esprit +9 (spécial Élantrien)', category: 'weapon' },
    { name: 'Essence du Dor', cost: 50, effect: 'inv', value: 85, rarity: 'uncommon', description: 'Investiture +85 (Dor distillé)', category: 'potion' },
  ],
  sandMaster: [
    { name: 'Plastron de Dayside', cost: 140, effect: 'chest_def', value: 9, rarity: 'rare', description: 'Torse : Défense +9 (spécial Maître du Sable)', category: 'armor' },
    { name: 'Fouet de sable', cost: 110, effect: 'weapon_str', value: 7, rarity: 'uncommon', description: 'Arme : Force +7 (spécial Maître du Sable)', category: 'weapon' },
    { name: 'Gourde enchantée', cost: 35, effect: 'hp', value: 70, rarity: 'uncommon', description: 'PV +70 (Eau pure de Dayside)', category: 'potion' },
  ],
  nightmarePainter: [
    { name: 'Kimono du Peintre', cost: 130, effect: 'chest_spi', value: 8, rarity: 'rare', description: 'Torse : Esprit +8 (spécial Peintre)', category: 'armor' },
    { name: 'Pinceau ancestral', cost: 150, effect: 'weapon_spi', value: 10, rarity: 'rare', description: 'Arme : Esprit +10 (spécial Peintre)', category: 'weapon' },
    { name: 'Encre de rêve', cost: 45, effect: 'inv', value: 75, rarity: 'uncommon', description: 'Investiture +75 (Encre onirique)', category: 'potion' },
  ],
};

// ─── Rotating Stock (changes daily based on date seed) ──────────

function getRotatingItems(worldID: string, playerLevel: number): ShopItem[] {
  // Seed based on day so stock changes daily
  const daySeed = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  const seed = daySeed * 7 + worldID.length * 13;

  const rotating: ShopItem[] = [];

  // Rare rotating armor piece
  if (pseudoRandom(seed) > 0.4) {
    const rarePieces = getRareRotatingPieces(worldID, playerLevel);
    if (rarePieces.length > 0) {
      const idx = Math.floor(pseudoRandom(seed + 1) * rarePieces.length);
      rotating.push(rarePieces[idx]);
    }
  }

  // Epic rotating item (less frequent)
  if (pseudoRandom(seed + 2) > 0.7 && playerLevel >= 5) {
    const epicPieces = getEpicRotatingPieces(worldID);
    if (epicPieces.length > 0) {
      const idx = Math.floor(pseudoRandom(seed + 3) * epicPieces.length);
      rotating.push(epicPieces[idx]);
    }
  }

  return rotating;
}

function pseudoRandom(seed: number): number {
  let x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function getRareRotatingPieces(worldID: string, _level: number): ShopItem[] {
  const base: ShopItem[] = [
    { name: 'Casque renforcé', cost: 100, effect: 'helmet_def', value: 5, rarity: 'rare', description: 'Casque : Défense +5', category: 'armor' },
    { name: 'Épaulières lourdes', cost: 110, effect: 'shoulders_str', value: 5, rarity: 'rare', description: 'Épaules : Force +5', category: 'armor' },
    { name: 'Gants d\'adresse', cost: 90, effect: 'gloves_agi', value: 5, rarity: 'rare', description: 'Gants : Agilité +5', category: 'armor' },
    { name: 'Ceinture robuste', cost: 85, effect: 'belt_vig', value: 5, rarity: 'rare', description: 'Ceinture : Vigueur +5', category: 'armor' },
  ];
  return base;
}

function getEpicRotatingPieces(worldID: string): ShopItem[] {
  const pieces: Record<string, ShopItem> = {
    scadrial: { name: 'Manteau du Survivant', cost: 280, effect: 'cape_all', value: 3, rarity: 'epic', description: 'Cape légendaire : Tous stats +3', category: 'armor' },
    roshar: { name: 'Plastron de Shardplate', cost: 350, effect: 'chest_def', value: 15, rarity: 'epic', description: 'Torse : Défense +15', category: 'armor' },
    taldain: { name: 'Couronne de Taldain', cost: 260, effect: 'helmet_spi', value: 10, rarity: 'epic', description: 'Casque : Esprit +10', category: 'armor' },
    nalthis: { name: 'Manteau Royal', cost: 300, effect: 'cape_spi', value: 12, rarity: 'epic', description: 'Cape : Esprit +12', category: 'armor' },
    sel: { name: 'Diadème d\'Elantris', cost: 290, effect: 'helmet_spi', value: 11, rarity: 'epic', description: 'Casque : Esprit +11', category: 'armor' },
    komashi: { name: 'Kimono du Maître', cost: 270, effect: 'chest_spi', value: 10, rarity: 'epic', description: 'Torse : Esprit +10', category: 'armor' },
    shadesmar: { name: 'Bottes de l\'Arpenteur', cost: 320, effect: 'boots_all', value: 4, rarity: 'epic', description: 'Bottes : Tous stats +4', category: 'armor' },
  };
  return pieces[worldID] ? [pieces[worldID]] : [];
}

// ─── Build Final Item List ──────────────────────────────────────

function getShopItems(worldID: string, playerLevel: number, championClass: ChampionClass): ShopItem[] {
  const { idx: repRank } = getCurrentRank(worldID);
  const items: ShopItem[] = [...BASE_ITEMS];
  const worldSpecific = WORLD_ITEMS[worldID] ?? [];
  // Filter by reputation rank requirement
  items.push(...worldSpecific.filter(i => (i.minRepRank ?? 0) <= repRank));
  // Class-specific gear available only for the player's class
  const classGear = CLASS_ITEMS[championClass] ?? [];
  items.push(...classGear);
  items.push(...getRotatingItems(worldID, playerLevel));
  return items;
}

// ─── Main Panel ─────────────────────────────────────────────────

export function showShopPanel(
  uiContainer: Container,
  screenW: number, screenH: number,
  onClose: () => void,
  showFloatingText: (x: number, y: number, msg: string, color: number) => void,
  playerPos: { x: number; y: number },
): Container {
  const champ = GameManager.shared.champion;
  if (!champ) return new Container();

  const panel = new Container();
  panel.zIndex = 10000;
  const layout = getLayoutInfo(screenW, screenH);
  const worldID = champ.currentWorldID ?? 'scadrial';
  const items = getShopItems(worldID, champ.level, champ.championClass);
  const discount = getShopDiscount(worldID);
  const { name: repName, rank: repRank } = getCurrentRank(worldID);

  // Overlay
  const overlay = new Graphics();
  overlay.rect(0, 0, screenW, screenH).fill({ color: 0x000000, alpha: 0.5 });
  overlay.eventMode = 'static';
  overlay.on('pointerdown', onClose);
  panel.addChild(overlay);

  // Panel dimensions
  const panelW = Math.min(340, screenW - 30);
  const panelH = Math.min(480, screenH - 40);
  const px = (screenW - panelW) / 2;
  const py = (screenH - panelH) / 2;

  const bg = new Graphics();
  bg.roundRect(px, py, panelW, panelH, panelRadius(layout))
    .fill({ color: UI_COLORS.panelBgAlt, alpha: UI_ALPHA.panelBg })
    .stroke({ color: 0x886633, width: 2, alpha: 0.8 });
  bg.eventMode = 'static';
  panel.addChild(bg);

  // Title
  const worldNames: Record<string, string> = {
    scadrial: 'Scadrial', roshar: 'Roshar', taldain: 'Taldain',
    nalthis: 'Nalthis', sel: 'Sel', komashi: 'Komashi', shadesmar: 'Shadesmar',
  };
  const title = new Text({
    text: `Boutique — ${worldNames[worldID] ?? worldID}`,
    style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: fontSize(14, layout), fill: UI_COLORS.textGold, fontWeight: 'bold' }),
  });
  title.anchor.set(0.5);
  title.x = screenW / 2;
  title.y = py + scaled(16, layout);
  panel.addChild(title);

  // Gold display
  const goldLabel = new Text({
    text: `Or : ${champ.gold}`,
    style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(11, layout), fill: 0xe6cc33 }),
  });
  goldLabel.anchor.set(0.5);
  goldLabel.x = screenW / 2;
  goldLabel.y = py + scaled(34, layout);
  panel.addChild(goldLabel);

  // Reputation + discount display
  const discountPct = Math.round(discount * 100);
  const repLabel = new Text({
    text: discountPct > 0 ? `${repName} — ${discountPct}% remise` : repName,
    style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(8, layout), fill: repRank.color }),
  });
  repLabel.anchor.set(0.5);
  repLabel.x = screenW / 2;
  repLabel.y = py + scaled(46, layout);
  panel.addChild(repLabel);

  // Scrollable item list
  const contentY = py + scaled(58, layout);
  const contentH = panelH - scaled(86, layout);
  const rowH = scaled(42, layout);
  const maxVisible = Math.floor(contentH / rowH);
  let scrollOffset = 0;

  const contentContainer = new Container();
  panel.addChild(contentContainer);

  function renderItems(): void {
    contentContainer.removeChildren();
    const visibleItems = items.slice(scrollOffset, scrollOffset + maxVisible);

    visibleItems.forEach((item, i) => {
      const iy = contentY + i * rowH;
      const finalCost = Math.max(1, Math.floor(item.cost * (1 - discount)));
      const canBuy = champ!.gold >= finalCost;
      const rarityColor = RARITY_COLORS[item.rarity] ?? 0xaaaaaa;

      // Row background
      const rowBg = new Graphics();
      rowBg.roundRect(px + 8, iy, panelW - 16, rowH - 4, 6)
        .fill({ color: 0x111122, alpha: 0.6 })
        .stroke({ color: rarityColor, width: 1, alpha: 0.25 });
      rowBg.eventMode = 'static';
      rowBg.cursor = canBuy ? 'pointer' : 'default';
      contentContainer.addChild(rowBg);

      // Rarity dot
      const dot = new Graphics();
      dot.circle(px + 20, iy + (rowH - 4) / 2, 4)
        .fill({ color: rarityColor, alpha: 0.8 });
      contentContainer.addChild(dot);

      // Name
      const nameText = new Text({
        text: item.name,
        style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: fontSize(9, layout), fill: rarityColor, fontWeight: 'bold' }),
      });
      nameText.x = px + 30;
      nameText.y = iy + 3;
      contentContainer.addChild(nameText);

      // Description
      const descText = new Text({
        text: item.description,
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(7, layout), fill: UI_COLORS.textMuted }),
      });
      descText.x = px + 30;
      descText.y = iy + 18;
      contentContainer.addChild(descText);

      // Cost (with discount applied)
      const costLabel = discount > 0 ? `${finalCost} or (-${Math.round(discount * 100)}%)` : `${finalCost} or`;
      const costText = new Text({
        text: costLabel,
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(9, layout), fill: canBuy ? 0xe6cc33 : 0x884444, fontWeight: 'bold' }),
      });
      costText.anchor.set(1, 0.5);
      costText.x = px + panelW - 16;
      costText.y = iy + (rowH - 4) / 2;
      contentContainer.addChild(costText);

      if (canBuy) {
        rowBg.on('pointerdown', () => {
          applyShopEffect(champ!, item, discount);
          goldLabel.text = `Or : ${champ!.gold}`;
          showFloatingText(playerPos.x, playerPos.y - 40, `${item.name} acheté!`, rarityColor);
          renderItems();
        });
      }
    });

    // Scroll indicators
    if (scrollOffset > 0) {
      const upArrow = new Text({
        text: '▲ Plus',
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(8, layout), fill: UI_COLORS.textSecondary }),
      });
      upArrow.anchor.set(0.5);
      upArrow.x = screenW / 2;
      upArrow.y = contentY - 8;
      upArrow.eventMode = 'static';
      upArrow.cursor = 'pointer';
      upArrow.on('pointerdown', () => { scrollOffset = Math.max(0, scrollOffset - maxVisible); renderItems(); });
      contentContainer.addChild(upArrow);
    }
    if (scrollOffset + maxVisible < items.length) {
      const downArrow = new Text({
        text: '▼ Plus',
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(8, layout), fill: UI_COLORS.textSecondary }),
      });
      downArrow.anchor.set(0.5);
      downArrow.x = screenW / 2;
      downArrow.y = contentY + contentH + 2;
      downArrow.eventMode = 'static';
      downArrow.cursor = 'pointer';
      downArrow.on('pointerdown', () => { scrollOffset += maxVisible; renderItems(); });
      contentContainer.addChild(downArrow);
    }
  }

  renderItems();

  // Close button
  const closeBtn = new Graphics();
  closeBtn.roundRect(px + panelW / 2 - 40, py + panelH - scaled(30, layout), 80, scaled(24, layout), 6)
    .fill({ color: UI_COLORS.btnDanger, alpha: UI_ALPHA.buttonBg })
    .stroke({ color: UI_COLORS.danger, width: 1 });
  closeBtn.eventMode = 'static';
  closeBtn.cursor = 'pointer';
  closeBtn.on('pointerdown', onClose);
  panel.addChild(closeBtn);

  const closeLabel = new Text({
    text: 'Fermer',
    style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(10, layout), fill: UI_COLORS.textSecondary }),
  });
  closeLabel.anchor.set(0.5);
  closeLabel.x = px + panelW / 2;
  closeLabel.y = py + panelH - scaled(18, layout);
  panel.addChild(closeLabel);

  uiContainer.addChild(panel);
  return panel;
}

// ─── Effect → Equipment Slot Mapping ─────────────────────────────

const EFFECT_TO_SLOT: Record<string, EquipmentSlot> = {
  chest_def: 'chest', chest_spi: 'chest',
  helmet_def: 'helmet', helmet_spi: 'helmet',
  shoulders_def: 'shoulders', shoulders_str: 'shoulders', shoulders_spi: 'shoulders',
  cape_spi: 'cape', cape_all: 'cape',
  gloves_agi: 'gloves', gloves_str: 'gloves',
  belt_vig: 'belt', belt_spi: 'belt',
  legs_agi: 'legs',
  boots_agi: 'boots', boots_all: 'boots',
  weapon_str: 'mainWeapon', weapon_spi: 'mainWeapon',
  offhand_def: 'offhand', offhand_spi: 'offhand',
  amulet_spi: 'amulet',
  ring_luck: 'ring1', ring_spi: 'ring1', ring_all: 'ring1',
};

const EFFECT_TO_STAT: Record<string, string> = {
  chest_def: 'vigor', helmet_def: 'vigor', shoulders_def: 'vigor',
  chest_spi: 'spirit', helmet_spi: 'spirit', cape_spi: 'spirit', belt_spi: 'spirit',
  weapon_spi: 'spirit', amulet_spi: 'spirit', ring_spi: 'spirit',
  shoulders_spi: 'spirit', offhand_spi: 'spirit',
  legs_agi: 'agility', boots_agi: 'agility', gloves_agi: 'agility',
  gloves_str: 'strength', shoulders_str: 'strength', weapon_str: 'strength',
  belt_vig: 'vigor', offhand_def: 'vigor', ring_luck: 'luck',
};

let shopItemCounter = 0;

// ─── Register Shop Item as Game Item ─────────────────────────────

function registerShopItemAsGameItem(shopItem: ShopItem, worldID: string): string {
  // Create a unique, deterministic ID based on the item name
  const baseID = `shop_${shopItem.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

  // If already registered, return the ID
  if (gameData.items.has(baseID)) return baseID;

  const slot = EFFECT_TO_SLOT[shopItem.effect] ?? 'consumable';
  const stat = EFFECT_TO_STAT[shopItem.effect];

  const statBonuses: Array<{ stat: string; value: number }> = [];
  if (shopItem.effect === 'cape_all' || shopItem.effect === 'boots_all' || shopItem.effect === 'ring_all') {
    statBonuses.push(
      { stat: 'strength', value: shopItem.value },
      { stat: 'agility', value: shopItem.value },
      { stat: 'spirit', value: shopItem.value },
      { stat: 'vigor', value: shopItem.value },
    );
  } else if (stat) {
    statBonuses.push({ stat, value: shopItem.value });
  }

  const gameItem: Item = {
    id: baseID,
    name: shopItem.name,
    description: shopItem.description,
    rarity: shopItem.rarity,
    slot: slot as EquipmentSlot,
    requiredLevel: 1,
    statBonuses,
    traits: [],
    spriteName: `item_${shopItem.category}`,
    worldOrigin: (worldID as Item['worldOrigin']) ?? null,
  };

  gameData.items.set(baseID, gameItem);
  return baseID;
}

// ─── Apply Effect ───────────────────────────────────────────────

function applyShopEffect(champ: Champion, item: ShopItem, discount: number = 0): void {
  const finalCost = Math.max(1, Math.floor(item.cost * (1 - discount)));
  champ.gold -= finalCost;
  const gm = GameManager.shared;
  const worldID = champ.currentWorldID ?? 'scadrial';

  if (item.category === 'potion') {
    // Potions are consumed immediately — direct effect
    switch (item.effect) {
      case 'hp': champ.currentHP = Math.min(gm.maxHP, champ.currentHP + item.value); break;
      case 'inv': champ.currentInvestiture = Math.min(gm.maxInvestiture, champ.currentInvestiture + item.value); break;
      case 'str': champ.baseStats.strength += item.value; break;
      case 'agi': champ.baseStats.agility += item.value; break;
      case 'spi': champ.baseStats.spirit += item.value; break;
    }
  } else {
    // Equipment, weapons, accessories, materials → add to inventory
    const itemID = registerShopItemAsGameItem(item, worldID);
    champ.inventoryItemIDs.push(itemID);
  }

  gm.save();
}
