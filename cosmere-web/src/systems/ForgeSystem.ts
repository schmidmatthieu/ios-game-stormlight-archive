// ─── Forge & Enchantment Upgrade System ──────────────────────────
// Upgrade existing equipment: enhance stats, add enchantments, reforge rarity

import { GameManager } from '../game/GameManager';
import { ProfessionManager } from '../game/ProfessionSystem';
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
  materialCost: { materialID: string; amount: number }[];
  glowColor: number; // Visual glow color for enchanted items
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
  { id: 'ench_steel_edge', name: 'Tranchant d\'Acier', description: '+3 Force', statType: 'strength', bonusValue: 3, goldCost: 100, requiredLevel: 3, worldID: 'scadrial',
    materialCost: [{ materialID: 'poudre_arcane', amount: 4 }], glowColor: 0xaabbcc },
  { id: 'ench_pewter_body', name: 'Corps d\'Étain', description: '+3 Vigueur', statType: 'vigor', bonusValue: 3, goldCost: 100, requiredLevel: 3, worldID: 'scadrial',
    materialCost: [{ materialID: 'poudre_arcane', amount: 4 }], glowColor: 0x88aacc },
  // Roshar
  { id: 'ench_stormlight', name: 'Infusion de Lumière', description: '+4 Investiture', statType: 'investiture', bonusValue: 4, goldCost: 120, requiredLevel: 4, worldID: 'roshar',
    materialCost: [{ materialID: 'poudre_arcane', amount: 3 }, { materialID: 'cristal_investiture', amount: 1 }], glowColor: 0x44ccff },
  { id: 'ench_windrunner', name: 'Bénédiction du Vent', description: '+3 Agilité', statType: 'agility', bonusValue: 3, goldCost: 120, requiredLevel: 4, worldID: 'roshar',
    materialCost: [{ materialID: 'poudre_arcane', amount: 3 }, { materialID: 'cristal_investiture', amount: 1 }], glowColor: 0x66ddff },
  // Taldain
  { id: 'ench_sand_guard', name: 'Garde de Sable', description: '+3 Vigueur', statType: 'vigor', bonusValue: 3, goldCost: 80, requiredLevel: 3, worldID: 'taldain',
    materialCost: [{ materialID: 'poudre_arcane', amount: 3 }, { materialID: 'sable_blanc', amount: 1 }], glowColor: 0xddcc88 },
  { id: 'ench_solar', name: 'Énergie Solaire', description: '+3 Esprit', statType: 'spirit', bonusValue: 3, goldCost: 80, requiredLevel: 3, worldID: 'taldain',
    materialCost: [{ materialID: 'poudre_arcane', amount: 3 }, { materialID: 'sable_blanc', amount: 1 }], glowColor: 0xffdd44 },
  // Komashi
  { id: 'ench_nightmare', name: 'Touche de Cauchemar', description: '+4 Esprit', statType: 'spirit', bonusValue: 4, goldCost: 100, requiredLevel: 5, worldID: 'komashi',
    materialCost: [{ materialID: 'poudre_arcane', amount: 5 }, { materialID: 'cristal_investiture', amount: 1 }], glowColor: 0x7744aa },
  // Nalthis
  { id: 'ench_chromatic', name: 'Résonance Chromatique', description: '+3 Investiture, +2 Chance', statType: 'investiture', bonusValue: 3, goldCost: 150, requiredLevel: 5, worldID: 'nalthis',
    materialCost: [{ materialID: 'poudre_arcane', amount: 4 }, { materialID: 'cristal_investiture', amount: 2 }], glowColor: 0xff44cc },
  // Sel
  { id: 'ench_aon_power', name: 'Pouvoir Aonique', description: '+5 Esprit', statType: 'spirit', bonusValue: 5, goldCost: 180, requiredLevel: 6, worldID: 'sel',
    materialCost: [{ materialID: 'poudre_arcane', amount: 5 }, { materialID: 'cristal_investiture', amount: 2 }], glowColor: 0xddaa44 },
  // Shadesmar (universal)
  { id: 'ench_cosmeric', name: 'Enchantement Cosmérique', description: '+3 à toutes les stats', statType: 'all', bonusValue: 3, goldCost: 400, requiredLevel: 8, worldID: 'shadesmar',
    materialCost: [{ materialID: 'poudre_arcane', amount: 8 }, { materialID: 'cristal_investiture', amount: 3 }, { materialID: 'sable_blanc', amount: 2 }], glowColor: 0xeeddff },
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

    // Check enchanting profession level
    const enchLevel = ProfessionManager.shared.professions.get('enchanting')?.level ?? 1;
    if (enchLevel < ench.requiredLevel) {
      return { success: false, message: `Enchantement Nv.${ench.requiredLevel} requis (actuel: ${enchLevel})`, goldSpent: 0 };
    }

    if (champ.gold < ench.goldCost) {
      return { success: false, message: `Or insuffisant (${ench.goldCost} requis)`, goldSpent: 0 };
    }

    // Check material costs
    const profInv = ProfessionManager.shared.inventory;
    for (const mat of ench.materialCost) {
      const owned = profInv.get(mat.materialID) ?? 0;
      if (owned < mat.amount) {
        return { success: false, message: `Matériaux insuffisants`, goldSpent: 0 };
      }
    }

    const existing = this.appliedEnchantments.get(itemID) ?? [];
    if (existing.length >= 2) {
      return { success: false, message: 'Maximum 2 enchantements par objet', goldSpent: 0 };
    }
    if (existing.includes(enchantmentID)) {
      return { success: false, message: 'Enchantement déjà appliqué', goldSpent: 0 };
    }

    // Consume gold and materials
    champ.gold -= ench.goldCost;
    for (const mat of ench.materialCost) {
      const current = profInv.get(mat.materialID) ?? 0;
      profInv.set(mat.materialID, current - mat.amount);
    }
    ProfessionManager.shared.save();
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

  /** Get the dominant glow color for an item's enchantments */
  getEnchantGlowColor(itemID: string): number | null {
    const enchIDs = this.appliedEnchantments.get(itemID);
    if (!enchIDs || enchIDs.length === 0) return null;
    const ench = ENCHANTMENTS.find(e => e.id === enchIDs[enchIDs.length - 1]);
    return ench?.glowColor ?? null;
  }

  /** Check if an item has any enchantments */
  hasEnchantments(itemID: string): boolean {
    return (this.appliedEnchantments.get(itemID)?.length ?? 0) > 0;
  }

  reset(): void {
    this.enhancementLevels.clear();
    this.appliedEnchantments.clear();
    localStorage.removeItem(STORAGE_KEY);
  }
}
