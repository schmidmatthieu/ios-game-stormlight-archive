// ─── Forge & Enchantment Upgrade System ──────────────────────────
// Upgrade existing equipment: enhance stats, add enchantments, reforge rarity

import { GameManager } from '../game/GameManager';
import type { ItemRarity } from '../data/types';

const STORAGE_KEY = 'cosmere_forge';

// ─── Types ───────────────────────────────────────────────────────

export interface EnhancementLevel {
  level: number;
  goldCost: number;
  successRate: number;  // 0-1
  statBonus: number;    // Flat stat increase per enhancement
}

export interface EnchantmentDef {
  id: string;
  name: string;
  description: string;
  statType: string;
  bonusValue: number;
  goldCost: number;
  requiredLevel: number;
  worldID: string;
}

export interface ForgeResult {
  success: boolean;
  message: string;
  goldSpent: number;
  newLevel?: number;
  statGain?: number;
}

// ─── Enhancement Tiers ──────────────────────────────────────────

const ENHANCEMENT_TIERS: EnhancementLevel[] = [
  { level: 1, goldCost: 50,   successRate: 0.95, statBonus: 1 },
  { level: 2, goldCost: 100,  successRate: 0.90, statBonus: 1 },
  { level: 3, goldCost: 200,  successRate: 0.80, statBonus: 2 },
  { level: 4, goldCost: 350,  successRate: 0.70, statBonus: 2 },
  { level: 5, goldCost: 500,  successRate: 0.55, statBonus: 3 },
  { level: 6, goldCost: 750,  successRate: 0.40, statBonus: 3 },
  { level: 7, goldCost: 1000, successRate: 0.30, statBonus: 4 },
  { level: 8, goldCost: 1500, successRate: 0.20, statBonus: 5 },
  { level: 9, goldCost: 2000, successRate: 0.15, statBonus: 5 },
  { level: 10, goldCost: 3000, successRate: 0.10, statBonus: 6 },
];

// ─── Enchantments ───────────────────────────────────────────────

const ENCHANTMENTS: EnchantmentDef[] = [
  // Scadrial
  { id: 'ench_steel_edge', name: 'Tranchant d\'Acier', description: '+3 Force', statType: 'strength', bonusValue: 3, goldCost: 200, requiredLevel: 3, worldID: 'scadrial' },
  { id: 'ench_pewter_body', name: 'Corps d\'Étain', description: '+3 Vigueur', statType: 'vigor', bonusValue: 3, goldCost: 200, requiredLevel: 3, worldID: 'scadrial' },
  // Roshar
  { id: 'ench_stormlight', name: 'Infusion de Lumière', description: '+4 Investiture', statType: 'investiture', bonusValue: 4, goldCost: 250, requiredLevel: 4, worldID: 'roshar' },
  { id: 'ench_windrunner', name: 'Bénédiction du Vent', description: '+3 Agilité', statType: 'agility', bonusValue: 3, goldCost: 250, requiredLevel: 4, worldID: 'roshar' },
  // Taldain
  { id: 'ench_sand_guard', name: 'Garde de Sable', description: '+3 Vigueur', statType: 'vigor', bonusValue: 3, goldCost: 180, requiredLevel: 3, worldID: 'taldain' },
  { id: 'ench_solar', name: 'Énergie Solaire', description: '+3 Esprit', statType: 'spirit', bonusValue: 3, goldCost: 180, requiredLevel: 3, worldID: 'taldain' },
  // Komashi
  { id: 'ench_nightmare', name: 'Touche de Cauchemar', description: '+4 Esprit', statType: 'spirit', bonusValue: 4, goldCost: 220, requiredLevel: 5, worldID: 'komashi' },
  // Nalthis
  { id: 'ench_chromatic', name: 'Résonance Chromatique', description: '+3 Investiture, +2 Chance', statType: 'investiture', bonusValue: 3, goldCost: 300, requiredLevel: 5, worldID: 'nalthis' },
  // Sel
  { id: 'ench_aon_power', name: 'Pouvoir Aonique', description: '+5 Esprit', statType: 'spirit', bonusValue: 5, goldCost: 350, requiredLevel: 6, worldID: 'sel' },
  // Shadesmar (universal)
  { id: 'ench_cosmeric', name: 'Enchantement Cosmérique', description: '+3 à toutes les stats', statType: 'all', bonusValue: 3, goldCost: 800, requiredLevel: 8, worldID: 'shadesmar' },
];

// ─── Rarity Upgrade ─────────────────────────────────────────────

const RARITY_ORDER: ItemRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'cosmeric'];
const REFORGE_COSTS: Record<ItemRarity, number> = {
  common: 100,
  uncommon: 250,
  rare: 500,
  epic: 1000,
  legendary: 2500,
  cosmeric: 0, // Can't upgrade further
};

// ─── Forge Manager ──────────────────────────────────────────────

export class ForgeManager {
  static shared = new ForgeManager();

  private enhancementLevels: Map<string, number> = new Map();
  private appliedEnchantments: Map<string, string[]> = new Map();

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data.levels) this.enhancementLevels = new Map(Object.entries(data.levels));
        if (data.enchants) this.appliedEnchantments = new Map(Object.entries(data.enchants));
      }
    } catch { /* ignore */ }
  }

  private save(): void {
    const data = {
      levels: Object.fromEntries(this.enhancementLevels),
      enchants: Object.fromEntries(this.appliedEnchantments),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  /** Get current enhancement level for an item */
  getEnhancementLevel(itemID: string): number {
    return this.enhancementLevels.get(itemID) ?? 0;
  }

  /** Get enchantments applied to an item */
  getEnchantments(itemID: string): string[] {
    return this.appliedEnchantments.get(itemID) ?? [];
  }

  /** Get total stat bonus from enhancement level */
  getEnhancementStatBonus(itemID: string): number {
    const level = this.getEnhancementLevel(itemID);
    let total = 0;
    for (let i = 0; i < level; i++) {
      total += ENHANCEMENT_TIERS[i].statBonus;
    }
    return total;
  }

  /** Attempt to enhance an item to the next level */
  enhanceItem(itemID: string): ForgeResult {
    const champ = GameManager.shared.champion;
    if (!champ) return { success: false, message: 'Aucun champion', goldSpent: 0 };

    const currentLevel = this.getEnhancementLevel(itemID);
    if (currentLevel >= ENHANCEMENT_TIERS.length) {
      return { success: false, message: 'Niveau maximum atteint (+10)', goldSpent: 0 };
    }

    const tier = ENHANCEMENT_TIERS[currentLevel];
    if (champ.gold < tier.goldCost) {
      return { success: false, message: `Or insuffisant (${tier.goldCost} requis)`, goldSpent: 0 };
    }

    champ.gold -= tier.goldCost;

    if (Math.random() < tier.successRate) {
      this.enhancementLevels.set(itemID, currentLevel + 1);
      this.save();
      return {
        success: true,
        message: `Amélioration réussie ! +${currentLevel + 1}`,
        goldSpent: tier.goldCost,
        newLevel: currentLevel + 1,
        statGain: tier.statBonus,
      };
    }

    this.save();
    return {
      success: false,
      message: 'Amélioration échouée... L\'objet est intact.',
      goldSpent: tier.goldCost,
    };
  }

  /** Get cost and success rate for next enhancement */
  getNextEnhancementInfo(itemID: string): { cost: number; successRate: number; statBonus: number } | null {
    const level = this.getEnhancementLevel(itemID);
    if (level >= ENHANCEMENT_TIERS.length) return null;
    const tier = ENHANCEMENT_TIERS[level];
    return { cost: tier.goldCost, successRate: tier.successRate, statBonus: tier.statBonus };
  }

  /** Apply an enchantment to an item */
  applyEnchantment(itemID: string, enchantmentID: string): ForgeResult {
    const champ = GameManager.shared.champion;
    if (!champ) return { success: false, message: 'Aucun champion', goldSpent: 0 };

    const ench = ENCHANTMENTS.find(e => e.id === enchantmentID);
    if (!ench) return { success: false, message: 'Enchantement inconnu', goldSpent: 0 };

    if (champ.level < ench.requiredLevel) {
      return { success: false, message: `Niveau ${ench.requiredLevel} requis`, goldSpent: 0 };
    }

    if (champ.gold < ench.goldCost) {
      return { success: false, message: `Or insuffisant (${ench.goldCost} requis)`, goldSpent: 0 };
    }

    const existing = this.appliedEnchantments.get(itemID) ?? [];
    if (existing.length >= 2) {
      return { success: false, message: 'Maximum 2 enchantements par objet', goldSpent: 0 };
    }
    if (existing.includes(enchantmentID)) {
      return { success: false, message: 'Enchantement déjà appliqué', goldSpent: 0 };
    }

    champ.gold -= ench.goldCost;
    existing.push(enchantmentID);
    this.appliedEnchantments.set(itemID, existing);

    // Apply stat bonus
    if (ench.statType === 'all') {
      champ.baseStats.vigor += ench.bonusValue;
      champ.baseStats.strength += ench.bonusValue;
      champ.baseStats.agility += ench.bonusValue;
      champ.baseStats.spirit += ench.bonusValue;
      champ.baseStats.investiture += ench.bonusValue;
      champ.baseStats.luck += ench.bonusValue;
    } else {
      const key = ench.statType as keyof typeof champ.baseStats;
      if (key in champ.baseStats) {
        (champ.baseStats as unknown as Record<string, number>)[key] += ench.bonusValue;
      }
    }

    this.save();
    return { success: true, message: `${ench.name} appliqué !`, goldSpent: ench.goldCost };
  }

  /** Get available enchantments for a world */
  getAvailableEnchantments(worldID: string, playerLevel: number): EnchantmentDef[] {
    return ENCHANTMENTS.filter(e =>
      (e.worldID === worldID || e.worldID === 'shadesmar') && playerLevel >= e.requiredLevel,
    );
  }

  /** Get all enchantment definitions */
  getAllEnchantments(): EnchantmentDef[] {
    return [...ENCHANTMENTS];
  }

  /** Get reforge cost to upgrade item rarity */
  getReforgeCost(currentRarity: ItemRarity): number {
    return REFORGE_COSTS[currentRarity];
  }

  /** Check if rarity can be upgraded */
  canReforge(currentRarity: ItemRarity): boolean {
    const idx = RARITY_ORDER.indexOf(currentRarity);
    return idx >= 0 && idx < RARITY_ORDER.length - 1;
  }

  /** Get next rarity tier */
  getNextRarity(currentRarity: ItemRarity): ItemRarity | null {
    const idx = RARITY_ORDER.indexOf(currentRarity);
    if (idx < 0 || idx >= RARITY_ORDER.length - 1) return null;
    return RARITY_ORDER[idx + 1];
  }

  reset(): void {
    this.enhancementLevels.clear();
    this.appliedEnchantments.clear();
    localStorage.removeItem(STORAGE_KEY);
  }
}
