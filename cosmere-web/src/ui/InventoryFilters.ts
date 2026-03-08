// ─── Inventory Filter & Bulk Selection State ─────────────────────────

import type { ItemRarity, EquipmentSlot } from '../data/types';

export type SlotFilter = 'all' | 'weapon' | 'armor' | 'accessory' | 'consumable' | 'enchant';
export type RarityFilter = 'all' | ItemRarity;

export interface InventoryFilterState {
  slotFilter: SlotFilter;
  rarityFilter: RarityFilter;
  bulkMode: boolean;
  selectedIDs: Set<string>;
}

export function createFilterState(): InventoryFilterState {
  return { slotFilter: 'all', rarityFilter: 'all', bulkMode: false, selectedIDs: new Set() };
}

const WEAPON_SLOTS: string[] = ['mainWeapon', 'offhand'];
const ARMOR_SLOTS: string[] = ['helmet', 'shoulders', 'chest', 'cape', 'gloves', 'belt', 'legs', 'boots'];
const ACCESSORY_SLOTS: string[] = ['amulet', 'ring1', 'ring2'];

export function matchesSlotFilter(slot: string, filter: SlotFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'weapon') return WEAPON_SLOTS.includes(slot);
  if (filter === 'armor') return ARMOR_SLOTS.includes(slot);
  if (filter === 'accessory') return ACCESSORY_SLOTS.includes(slot);
  if (filter === 'consumable') return slot === 'consumable';
  if (filter === 'enchant') return slot === 'enchant' || slot === 'enchantment';
  return true;
}

export function matchesRarityFilter(rarity: string, filter: RarityFilter): boolean {
  return filter === 'all' || rarity === filter;
}

export const SLOT_FILTER_LABELS: Record<SlotFilter, string> = {
  all: 'Tous', weapon: 'Armes', armor: 'Armure', accessory: 'Accès.', consumable: 'Potions', enchant: 'Enchant.',
};

export const RARITY_FILTER_LABELS: Record<RarityFilter, string> = {
  all: 'Toutes', common: 'Commun', uncommon: 'Insolite', rare: 'Rare', epic: 'Épique', legendary: 'Légend.', cosmeric: 'Cosmère',
};

export const RARITY_FILTER_COLORS: Record<RarityFilter, number> = {
  all: 0xcccccc, common: 0xaaaaaa, uncommon: 0x55cc55, rare: 0x5588ee, epic: 0x9955ee, legendary: 0xee9911, cosmeric: 0xee2222,
};
