// ─── Enchantment System Data & Logic ────────────────────────────
// Extracted from ProfessionPanel for modularity.

import { gameData } from '../data/DataLoader';
import { ItemModStore } from './ItemModStore';
import { ProfessionManager } from './ProfessionSystem';
import { GameManager } from './GameManager';
import type { Champion, Item } from '../data/types';

// ─── Enchantment Bonuses ────────────────────────────────────────

interface EnchantmentBonus {
  stat: string;
  value: number;
  label: string;
}

export const ENCHANTMENT_BONUSES: Record<string, EnchantmentBonus> = {
  enchant_protection: { stat: 'vigor', value: 3, label: 'Défense +3' },
  enchant_force: { stat: 'strength', value: 4, label: 'Force +4' },
  enchant_agilite: { stat: 'agility', value: 4, label: 'Agilité +4' },
  enchant_esprit: { stat: 'spirit', value: 4, label: 'Esprit +4' },
  enchant_investiture: { stat: 'spirit', value: 6, label: 'Esprit +6' },
  enchant_cosmos: { stat: 'strength', value: 5, label: 'Force +5, Esprit +5' },
  enchant_legendaire: { stat: 'strength', value: 8, label: 'Force +8, Agilité +4' },
  enchant_divin: { stat: 'strength', value: 6, label: 'Tous stats +6' },
};

export function getEnchantDescription(enchantID: string): string {
  const baseID = enchantID.replace(/_q\d+$/, '');
  const bonus = ENCHANTMENT_BONUSES[baseID];
  return bonus?.label ?? 'Bonus inconnu';
}

// ─── Apply Enchantment ──────────────────────────────────────────

function addItemStat(item: Item, stat: string, value: number): void {
  const existing = item.statBonuses.find(b => b.stat === stat);
  if (existing) {
    existing.value += value;
  } else {
    item.statBonuses.push({ stat, value });
  }
}

export function applyEnchantment(champ: Champion, enchantID: string, targetItemID: string): void {
  // Remove one enchantment from inventory
  const idx = champ.inventoryItemIDs.indexOf(enchantID);
  if (idx === -1) return;
  champ.inventoryItemIDs.splice(idx, 1);

  // Get the target item and add stat bonuses
  const item = gameData.item(targetItemID);
  if (!item) return;

  const baseID = enchantID.replace(/_q\d+$/, '');
  const qualityMatch = enchantID.match(/_q(\d+)$/);
  const qualityBonus = qualityMatch ? parseInt(qualityMatch[1]) : 0;

  // Apply enchantment bonuses based on type
  if (baseID === 'enchant_cosmos') {
    const val = 5 + qualityBonus;
    addItemStat(item, 'strength', val);
    addItemStat(item, 'spirit', val);
  } else if (baseID === 'enchant_legendaire') {
    addItemStat(item, 'strength', 8 + qualityBonus);
    addItemStat(item, 'agility', 4 + qualityBonus);
  } else if (baseID === 'enchant_divin') {
    const val = 6 + qualityBonus;
    addItemStat(item, 'strength', val);
    addItemStat(item, 'agility', val);
    addItemStat(item, 'spirit', val);
    addItemStat(item, 'vigor', val);
  } else {
    const bonus = ENCHANTMENT_BONUSES[baseID];
    if (bonus) {
      addItemStat(item, bonus.stat, bonus.value + qualityBonus);
    }
  }

  // Mark item name as enchanted (if not already)
  if (!item.name.includes('(E)')) {
    item.name = `${item.name} (E)`;
  }

  // Persist modifications
  const appliedBonuses = item.statBonuses.map(b => ({ stat: b.stat, value: b.value }));
  ItemModStore.shared.recordEnchant(targetItemID, appliedBonuses);

  // Grant enchanting XP
  ProfessionManager.shared.addEnchantingXP(20 + qualityBonus * 5);
  ProfessionManager.shared.save();
  GameManager.shared.save();
}

// ─── Profession Icon Helper ─────────────────────────────────────

import type { ProfessionType } from './ProfessionSystem';

export function professionIcon(type: ProfessionType): string {
  switch (type) {
    case 'mining': return '\u26CF';
    case 'herbalism': return '\u2698';
    case 'woodcutting': return '\u2692';
    case 'skinning': return '\u2694';
    case 'enchanting': return '\u2728';
  }
}
