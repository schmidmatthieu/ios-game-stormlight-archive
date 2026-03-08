// ─── Profession System — gathering, crafting professions ─────────────

import { GameManager } from './GameManager';
import { gameData } from '../data/DataLoader';
import type { EquipmentSlot } from '../data/types';

export type ProfessionType = 'mining' | 'herbalism' | 'woodcutting' | 'skinning' | 'enchanting';

export interface ProfessionState {
  type: ProfessionType;
  level: number;
  xp: number;
}

export interface CraftingMaterial {
  id: string;
  name: string;
  profession: ProfessionType;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic';
  icon: string;
}

export interface CraftingRecipe {
  id: string;
  name: string;
  profession: ProfessionType;
  requiredLevel: number;
  materials: { materialID: string; amount: number }[];
  result: { type: 'potion' | 'equipment' | 'enchantment' | 'consumable'; itemID: string; amount: number };
}

// ─── XP Scaling ──────────────────────────────────────────────────

function xpForLevel(level: number): number {
  return Math.floor(50 * level * (1 + level * 0.15));
}

// ─── Materials ───────────────────────────────────────────────────

export const MATERIALS: CraftingMaterial[] = [
  // Mining
  { id: 'minerai_fer', name: 'Minerai de Fer', profession: 'mining', rarity: 'common', icon: 'ore_grey' },
  { id: 'minerai_acier', name: 'Minerai d\'Acier', profession: 'mining', rarity: 'uncommon', icon: 'ore_silver' },
  { id: 'minerai_pewter', name: 'Minerai de Pewter', profession: 'mining', rarity: 'uncommon', icon: 'ore_blue' },
  { id: 'minerai_atium', name: 'Minerai d\'Atium', profession: 'mining', rarity: 'epic', icon: 'ore_gold' },
  { id: 'gemme_lumiere', name: 'Gemme de Lumiere', profession: 'mining', rarity: 'rare', icon: 'gem_cyan' },
  // Herbalism
  { id: 'herbe_soins', name: 'Herbe de Soins', profession: 'herbalism', rarity: 'common', icon: 'herb_green' },
  { id: 'fleur_nalthis', name: 'Fleur de Nalthis', profession: 'herbalism', rarity: 'uncommon', icon: 'herb_purple' },
  { id: 'racine_orage', name: 'Racine d\'Orage', profession: 'herbalism', rarity: 'uncommon', icon: 'herb_blue' },
  { id: 'mousse_shadesmar', name: 'Mousse de Shadesmar', profession: 'herbalism', rarity: 'rare', icon: 'herb_dark' },
  { id: 'lotus_investiture', name: 'Lotus d\'Investiture', profession: 'herbalism', rarity: 'epic', icon: 'herb_gold' },
  // Woodcutting
  { id: 'bois_commun', name: 'Bois Commun', profession: 'woodcutting', rarity: 'common', icon: 'wood_brown' },
  { id: 'bois_roshar', name: 'Bois de Coquebois', profession: 'woodcutting', rarity: 'uncommon', icon: 'wood_red' },
  { id: 'bois_petrifie', name: 'Bois Petrifie', profession: 'woodcutting', rarity: 'rare', icon: 'wood_grey' },
  // Skinning
  { id: 'cuir_brut', name: 'Cuir Brut', profession: 'skinning', rarity: 'common', icon: 'hide_tan' },
  { id: 'ecailles_crustace', name: 'Ecailles de Crustace', profession: 'skinning', rarity: 'uncommon', icon: 'hide_blue' },
  { id: 'peau_larkin', name: 'Peau de Larkin', profession: 'skinning', rarity: 'rare', icon: 'hide_purple' },
  { id: 'carapace_epine', name: 'Carapace d\'Epine', profession: 'skinning', rarity: 'epic', icon: 'hide_black' },
  // Enchanting
  { id: 'poudre_arcane', name: 'Poudre Arcane', profession: 'enchanting', rarity: 'common', icon: 'dust_blue' },
  { id: 'cristal_investiture', name: 'Cristal d\'Investiture', profession: 'enchanting', rarity: 'rare', icon: 'crystal_cyan' },
  { id: 'sable_blanc', name: 'Sable Blanc', profession: 'enchanting', rarity: 'uncommon', icon: 'sand_white' },
];

// ─── World → Gathering Loot Tables ──────────────────────────────

const WORLD_LOOT: Record<string, Partial<Record<ProfessionType, string[]>>> = {
  scadrial: {
    mining: ['minerai_fer', 'minerai_acier', 'minerai_pewter', 'minerai_atium'],
    herbalism: ['herbe_soins'],
    skinning: ['cuir_brut'],
    woodcutting: ['bois_commun'],
    enchanting: ['poudre_arcane'],
  },
  roshar: {
    mining: ['minerai_fer', 'gemme_lumiere'],
    herbalism: ['herbe_soins', 'racine_orage'],
    skinning: ['ecailles_crustace', 'carapace_epine'],
    woodcutting: ['bois_roshar'],
    enchanting: ['poudre_arcane', 'cristal_investiture'],
  },
  taldain: {
    mining: ['minerai_fer'],
    herbalism: ['herbe_soins'],
    skinning: ['cuir_brut'],
    woodcutting: ['bois_commun'],
    enchanting: ['sable_blanc', 'poudre_arcane'],
  },
  nalthis: {
    mining: ['minerai_fer'],
    herbalism: ['herbe_soins', 'fleur_nalthis', 'lotus_investiture'],
    skinning: ['cuir_brut'],
    woodcutting: ['bois_commun'],
    enchanting: ['poudre_arcane'],
  },
  sel: {
    mining: ['minerai_fer', 'minerai_acier'],
    herbalism: ['herbe_soins'],
    skinning: ['cuir_brut'],
    woodcutting: ['bois_commun', 'bois_petrifie'],
    enchanting: ['poudre_arcane', 'cristal_investiture'],
  },
  komashi: {
    mining: ['minerai_fer'],
    herbalism: ['herbe_soins', 'mousse_shadesmar'],
    skinning: ['cuir_brut', 'peau_larkin'],
    woodcutting: ['bois_commun'],
    enchanting: ['poudre_arcane'],
  },
  shadesmar: {
    mining: ['gemme_lumiere', 'minerai_atium'],
    herbalism: ['mousse_shadesmar', 'lotus_investiture'],
    skinning: ['peau_larkin', 'carapace_epine'],
    woodcutting: ['bois_petrifie'],
    enchanting: ['cristal_investiture', 'sable_blanc'],
  },
};

// ─── Recipes ─────────────────────────────────────────────────────

export const RECIPES: CraftingRecipe[] = [
  // ── Herbalism — potions & elixirs (every ~5 levels) ──────────
  { id: 'potion_soin', name: 'Potion de Soin', profession: 'herbalism', requiredLevel: 1,
    materials: [{ materialID: 'herbe_soins', amount: 3 }],
    result: { type: 'potion', itemID: 'potion_soin', amount: 1 } },
  { id: 'potion_investiture', name: 'Potion d\'Investiture', profession: 'herbalism', requiredLevel: 5,
    materials: [{ materialID: 'herbe_soins', amount: 2 }, { materialID: 'racine_orage', amount: 1 }],
    result: { type: 'potion', itemID: 'potion_investiture', amount: 1 } },
  { id: 'potion_soin_ii', name: 'Grande Potion de Soin', profession: 'herbalism', requiredLevel: 10,
    materials: [{ materialID: 'herbe_soins', amount: 5 }, { materialID: 'racine_orage', amount: 1 }],
    result: { type: 'potion', itemID: 'potion_soin_ii', amount: 1 } },
  { id: 'elixir_vitalite', name: 'Élixir de Vitalité', profession: 'herbalism', requiredLevel: 15,
    materials: [{ materialID: 'fleur_nalthis', amount: 2 }, { materialID: 'herbe_soins', amount: 3 }],
    result: { type: 'potion', itemID: 'elixir_vitalite', amount: 1 } },
  { id: 'potion_investiture_ii', name: 'Grande Potion d\'Investiture', profession: 'herbalism', requiredLevel: 20,
    materials: [{ materialID: 'racine_orage', amount: 3 }, { materialID: 'fleur_nalthis', amount: 1 }],
    result: { type: 'potion', itemID: 'potion_investiture_ii', amount: 1 } },
  { id: 'elixir_orage', name: 'Élixir d\'Orage', profession: 'herbalism', requiredLevel: 25,
    materials: [{ materialID: 'racine_orage', amount: 3 }, { materialID: 'mousse_shadesmar', amount: 1 }],
    result: { type: 'potion', itemID: 'elixir_orage', amount: 1 } },
  { id: 'elixir_cosmos', name: 'Élixir Cosmique', profession: 'herbalism', requiredLevel: 30,
    materials: [{ materialID: 'mousse_shadesmar', amount: 2 }, { materialID: 'fleur_nalthis', amount: 2 }],
    result: { type: 'potion', itemID: 'elixir_cosmos', amount: 1 } },
  { id: 'potion_soin_iii', name: 'Potion de Soin Majeure', profession: 'herbalism', requiredLevel: 35,
    materials: [{ materialID: 'lotus_investiture', amount: 1 }, { materialID: 'herbe_soins', amount: 5 }],
    result: { type: 'potion', itemID: 'potion_soin_iii', amount: 1 } },
  { id: 'elixir_supreme', name: 'Élixir Suprême', profession: 'herbalism', requiredLevel: 40,
    materials: [{ materialID: 'lotus_investiture', amount: 1 }, { materialID: 'fleur_nalthis', amount: 2 }, { materialID: 'mousse_shadesmar', amount: 2 }],
    result: { type: 'potion', itemID: 'elixir_supreme', amount: 1 } },
  { id: 'elixir_divin', name: 'Élixir Divin', profession: 'herbalism', requiredLevel: 50,
    materials: [{ materialID: 'lotus_investiture', amount: 2 }, { materialID: 'mousse_shadesmar', amount: 3 }],
    result: { type: 'potion', itemID: 'elixir_divin', amount: 1 } },

  // ── Mining — weapons & armor (every ~5-8 levels) ──────────────
  { id: 'lingot_acier', name: 'Lingot d\'Acier', profession: 'mining', requiredLevel: 1,
    materials: [{ materialID: 'minerai_fer', amount: 4 }],
    result: { type: 'equipment', itemID: 'lingot_acier', amount: 1 } },
  { id: 'dague_fer', name: 'Dague de Fer', profession: 'mining', requiredLevel: 5,
    materials: [{ materialID: 'minerai_fer', amount: 3 }, { materialID: 'minerai_acier', amount: 1 }],
    result: { type: 'equipment', itemID: 'dague_fer', amount: 1 } },
  { id: 'lame_pewter', name: 'Lame de Pewter', profession: 'mining', requiredLevel: 10,
    materials: [{ materialID: 'minerai_pewter', amount: 3 }, { materialID: 'minerai_fer', amount: 2 }],
    result: { type: 'equipment', itemID: 'lame_pewter', amount: 1 } },
  { id: 'casque_acier', name: 'Casque d\'Acier', profession: 'mining', requiredLevel: 15,
    materials: [{ materialID: 'minerai_acier', amount: 4 }, { materialID: 'minerai_fer', amount: 2 }],
    result: { type: 'equipment', itemID: 'casque_acier', amount: 1 } },
  { id: 'epee_acier', name: 'Épée d\'Acier Renforcé', profession: 'mining', requiredLevel: 20,
    materials: [{ materialID: 'minerai_acier', amount: 5 }, { materialID: 'minerai_pewter', amount: 2 }],
    result: { type: 'equipment', itemID: 'epee_acier', amount: 1 } },
  { id: 'bouclier_gemme', name: 'Bouclier de Gemme', profession: 'mining', requiredLevel: 25,
    materials: [{ materialID: 'gemme_lumiere', amount: 2 }, { materialID: 'minerai_acier', amount: 3 }],
    result: { type: 'equipment', itemID: 'bouclier_gemme', amount: 1 } },
  { id: 'plastron_acier', name: 'Plastron d\'Acier Supérieur', profession: 'mining', requiredLevel: 30,
    materials: [{ materialID: 'minerai_acier', amount: 6 }, { materialID: 'gemme_lumiere', amount: 1 }],
    result: { type: 'equipment', itemID: 'plastron_acier', amount: 1 } },
  { id: 'lame_gemme', name: 'Lame de Gemcœur', profession: 'mining', requiredLevel: 40,
    materials: [{ materialID: 'gemme_lumiere', amount: 3 }, { materialID: 'minerai_pewter', amount: 3 }],
    result: { type: 'equipment', itemID: 'lame_gemme', amount: 1 } },
  { id: 'arme_atium', name: 'Arme d\'Atium', profession: 'mining', requiredLevel: 50,
    materials: [{ materialID: 'minerai_atium', amount: 3 }, { materialID: 'minerai_acier', amount: 5 }],
    result: { type: 'equipment', itemID: 'arme_atium', amount: 1 } },

  // ── Woodcutting — bows, staves, shields (every ~8 levels) ─────
  { id: 'arc_simple', name: 'Arc Simple', profession: 'woodcutting', requiredLevel: 1,
    materials: [{ materialID: 'bois_commun', amount: 5 }],
    result: { type: 'equipment', itemID: 'arc_simple', amount: 1 } },
  { id: 'bouclier_bois', name: 'Bouclier en Bois', profession: 'woodcutting', requiredLevel: 8,
    materials: [{ materialID: 'bois_commun', amount: 6 }],
    result: { type: 'equipment', itemID: 'bouclier_bois', amount: 1 } },
  { id: 'baton_coquebois', name: 'Bâton de Coquebois', profession: 'woodcutting', requiredLevel: 15,
    materials: [{ materialID: 'bois_roshar', amount: 3 }, { materialID: 'bois_commun', amount: 2 }],
    result: { type: 'equipment', itemID: 'baton_coquebois', amount: 1 } },
  { id: 'arc_roshar', name: 'Arc de Coquebois', profession: 'woodcutting', requiredLevel: 22,
    materials: [{ materialID: 'bois_roshar', amount: 5 }],
    result: { type: 'equipment', itemID: 'arc_roshar', amount: 1 } },
  { id: 'lance_petrifie', name: 'Lance Pétrifiée', profession: 'woodcutting', requiredLevel: 30,
    materials: [{ materialID: 'bois_petrifie', amount: 3 }, { materialID: 'bois_roshar', amount: 2 }],
    result: { type: 'equipment', itemID: 'lance_petrifie', amount: 1 } },
  { id: 'baton_ancien', name: 'Bâton Ancien', profession: 'woodcutting', requiredLevel: 40,
    materials: [{ materialID: 'bois_petrifie', amount: 4 }, { materialID: 'bois_roshar', amount: 3 }],
    result: { type: 'equipment', itemID: 'baton_ancien', amount: 1 } },

  // ── Skinning — armor & capes (every ~8 levels) ────────────────
  { id: 'armure_cuir', name: 'Armure de Cuir', profession: 'skinning', requiredLevel: 1,
    materials: [{ materialID: 'cuir_brut', amount: 5 }],
    result: { type: 'equipment', itemID: 'armure_cuir', amount: 1 } },
  { id: 'bottes_cuir', name: 'Bottes de Cuir', profession: 'skinning', requiredLevel: 8,
    materials: [{ materialID: 'cuir_brut', amount: 4 }],
    result: { type: 'equipment', itemID: 'bottes_cuir', amount: 1 } },
  { id: 'gantelets_cuir', name: 'Gantelets de Cuir Renforcé', profession: 'skinning', requiredLevel: 15,
    materials: [{ materialID: 'cuir_brut', amount: 3 }, { materialID: 'ecailles_crustace', amount: 1 }],
    result: { type: 'equipment', itemID: 'gantelets_cuir', amount: 1 } },
  { id: 'plastron_crustace', name: 'Plastron de Crustacé', profession: 'skinning', requiredLevel: 20,
    materials: [{ materialID: 'ecailles_crustace', amount: 3 }, { materialID: 'cuir_brut', amount: 2 }],
    result: { type: 'equipment', itemID: 'plastron_crustace', amount: 1 } },
  { id: 'jambiere_ecailles', name: 'Jambières d\'Écailles', profession: 'skinning', requiredLevel: 28,
    materials: [{ materialID: 'ecailles_crustace', amount: 4 }, { materialID: 'cuir_brut', amount: 2 }],
    result: { type: 'equipment', itemID: 'jambiere_ecailles', amount: 1 } },
  { id: 'cape_larkin', name: 'Cape de Larkin', profession: 'skinning', requiredLevel: 35,
    materials: [{ materialID: 'peau_larkin', amount: 2 }, { materialID: 'ecailles_crustace', amount: 2 }],
    result: { type: 'equipment', itemID: 'cape_larkin', amount: 1 } },
  { id: 'armure_epine', name: 'Armure d\'Épine', profession: 'skinning', requiredLevel: 45,
    materials: [{ materialID: 'carapace_epine', amount: 3 }, { materialID: 'peau_larkin', amount: 2 }],
    result: { type: 'equipment', itemID: 'armure_epine', amount: 1 } },

  // ── Enchanting — enchantments & consumables (every ~5-8 levels) ───
  { id: 'enchant_protection', name: 'Enchantement de Protection', profession: 'enchanting', requiredLevel: 1,
    materials: [{ materialID: 'poudre_arcane', amount: 3 }],
    result: { type: 'enchantment', itemID: 'enchant_protection', amount: 1 } },
  { id: 'enchant_force', name: 'Enchantement de Force', profession: 'enchanting', requiredLevel: 5,
    materials: [{ materialID: 'poudre_arcane', amount: 4 }],
    result: { type: 'enchantment', itemID: 'enchant_force', amount: 1 } },
  { id: 'enchant_agilite', name: 'Enchantement d\'Agilité', profession: 'enchanting', requiredLevel: 10,
    materials: [{ materialID: 'poudre_arcane', amount: 5 }, { materialID: 'sable_blanc', amount: 1 }],
    result: { type: 'enchantment', itemID: 'enchant_agilite', amount: 1 } },
  { id: 'enchant_esprit', name: 'Enchantement d\'Esprit', profession: 'enchanting', requiredLevel: 15,
    materials: [{ materialID: 'poudre_arcane', amount: 4 }, { materialID: 'cristal_investiture', amount: 1 }],
    result: { type: 'enchantment', itemID: 'enchant_esprit', amount: 1 } },
  { id: 'enchant_investiture', name: 'Enchantement d\'Investiture', profession: 'enchanting', requiredLevel: 20,
    materials: [{ materialID: 'cristal_investiture', amount: 2 }, { materialID: 'poudre_arcane', amount: 3 }],
    result: { type: 'enchantment', itemID: 'enchant_investiture', amount: 1 } },
  { id: 'enchant_cosmos', name: 'Enchantement Cosmérique', profession: 'enchanting', requiredLevel: 30,
    materials: [{ materialID: 'cristal_investiture', amount: 2 }, { materialID: 'sable_blanc', amount: 3 }],
    result: { type: 'enchantment', itemID: 'enchant_cosmos', amount: 1 } },
  { id: 'enchant_legendaire', name: 'Enchantement Légendaire', profession: 'enchanting', requiredLevel: 40,
    materials: [{ materialID: 'cristal_investiture', amount: 3 }, { materialID: 'sable_blanc', amount: 3 }, { materialID: 'poudre_arcane', amount: 5 }],
    result: { type: 'enchantment', itemID: 'enchant_legendaire', amount: 1 } },
  { id: 'enchant_divin', name: 'Enchantement Divin', profession: 'enchanting', requiredLevel: 50,
    materials: [{ materialID: 'cristal_investiture', amount: 5 }, { materialID: 'sable_blanc', amount: 5 }],
    result: { type: 'enchantment', itemID: 'enchant_divin', amount: 1 } },
];

// ─── Profession Manager (Singleton) ─────────────────────────────

const STORAGE_KEY = 'cosmere_professions';

export class ProfessionManager {
  private static _instance: ProfessionManager;
  static get shared(): ProfessionManager {
    if (!this._instance) this._instance = new ProfessionManager();
    return this._instance;
  }

  professions: Map<ProfessionType, ProfessionState> = new Map();
  inventory: Map<string, number> = new Map(); // materialID → count
  craftBonuses: Map<string, number> = new Map(); // itemID → bonus stats from profession level

  constructor() {
    const types: ProfessionType[] = ['mining', 'herbalism', 'woodcutting', 'skinning', 'enchanting'];
    for (const t of types) {
      this.professions.set(t, { type: t, level: 1, xp: 0 });
    }
  }

  // ── Gathering ────────────────────────────────────────

  gatherMaterial(profession: ProfessionType, worldID: string): CraftingMaterial | null {
    const loot = WORLD_LOOT[worldID]?.[profession];
    if (!loot || loot.length === 0) return null;

    const state = this.professions.get(profession)!;

    // Higher level = better chance for rarer materials
    const rarityBonus = Math.min(state.level * 0.005, 0.3);
    const roll = Math.random();
    let pool: string[];

    if (roll < 0.05 + rarityBonus && loot.length > 1) {
      // Pick from rarer materials (later in the array)
      pool = loot.slice(Math.floor(loot.length / 2));
    } else {
      pool = loot;
    }

    const materialID = pool[Math.floor(Math.random() * pool.length)];
    const mat = MATERIALS.find(m => m.id === materialID);
    if (!mat) return null;

    // Add to inventory
    this.inventory.set(materialID, (this.inventory.get(materialID) ?? 0) + 1);

    // Grant XP
    const xpGain = this.xpForRarity(mat.rarity);
    this.addXP(profession, xpGain);

    return mat;
  }

  private xpForRarity(rarity: string): number {
    switch (rarity) {
      case 'common': return 10;
      case 'uncommon': return 25;
      case 'rare': return 50;
      case 'epic': return 100;
      default: return 10;
    }
  }

  private addXP(profession: ProfessionType, amount: number): void {
    const state = this.professions.get(profession)!;
    state.xp += amount;
    while (state.xp >= xpForLevel(state.level)) {
      state.xp -= xpForLevel(state.level);
      state.level++;
    }
  }

  // ── Crafting ─────────────────────────────────────────

  getAvailableRecipes(profession?: ProfessionType): CraftingRecipe[] {
    return RECIPES.filter(r => {
      if (profession && r.profession !== profession) return false;
      const state = this.professions.get(r.profession);
      return state !== undefined && state.level >= r.requiredLevel;
    });
  }

  canCraft(recipeID: string): { possible: boolean; reason: string } {
    const recipe = RECIPES.find(r => r.id === recipeID);
    if (!recipe) return { possible: false, reason: 'Recette inconnue' };

    const state = this.professions.get(recipe.profession);
    if (!state || state.level < recipe.requiredLevel) {
      return { possible: false, reason: `Niveau ${recipe.requiredLevel} en ${this.professionLabel(recipe.profession)} requis` };
    }

    for (const mat of recipe.materials) {
      const owned = this.inventory.get(mat.materialID) ?? 0;
      if (owned < mat.amount) {
        const matInfo = MATERIALS.find(m => m.id === mat.materialID);
        return { possible: false, reason: `${mat.amount}x ${matInfo?.name ?? mat.materialID} requis (${owned} possedes)` };
      }
    }

    return { possible: true, reason: '' };
  }

  craft(recipeID: string): { success: boolean; message: string } {
    const check = this.canCraft(recipeID);
    if (!check.possible) return { success: false, message: check.reason };

    const recipe = RECIPES.find(r => r.id === recipeID)!;

    // Consume materials
    for (const mat of recipe.materials) {
      const current = this.inventory.get(mat.materialID) ?? 0;
      this.inventory.set(mat.materialID, current - mat.amount);
    }

    // Profession level scaling: bonus stats that increase with profession level
    const profState = this.professions.get(recipe.profession)!;
    const levelBonus = Math.floor(profState.level / 5); // +1 stat per 5 profession levels
    const qualityBonus = profState.level >= 40 ? 3 : profState.level >= 25 ? 2 : profState.level >= 10 ? 1 : 0;
    const totalBonus = levelBonus + qualityBonus;

    // Create a unique crafted item ID that encodes the quality level
    const craftedItemID = totalBonus > 0
      ? `${recipe.result.itemID}_q${totalBonus}`
      : recipe.result.itemID;

    // Register the crafted item in gameData with scaled stats
    this.registerCraftedItem(recipe, craftedItemID, totalBonus);

    // Add crafted item to champion inventory
    const champ = GameManager.shared.champion;
    if (champ) {
      for (let i = 0; i < recipe.result.amount; i++) {
        champ.inventoryItemIDs.push(craftedItemID);
      }
    }

    if (totalBonus > 0) {
      this.craftBonuses.set(craftedItemID, totalBonus);
    }

    // Grant crafting XP
    this.addXP(recipe.profession, recipe.requiredLevel * 15 + 20);

    const qualityLabel = totalBonus >= 6 ? ' (Chef-d\'œuvre!)' : totalBonus >= 3 ? ` (+${totalBonus} qualité supérieure)` : totalBonus > 0 ? ` (+${totalBonus} bonus)` : '';
    return { success: true, message: `${recipe.name} fabriqué !${qualityLabel}` };
  }

  /** Register a crafted item in gameData so it appears in inventory with proper stats */
  private registerCraftedItem(recipe: CraftingRecipe, craftedID: string, bonus: number): void {
    if (gameData.items.has(craftedID)) return;

    // Try to get base item definition; if missing, create one
    const baseItem = gameData.item(recipe.result.itemID);
    const baseName = baseItem?.name ?? recipe.name;
    const baseDesc = baseItem?.description ?? `Fabriqué via ${this.professionLabel(recipe.profession)}`;
    const baseRarity = baseItem?.rarity ?? (bonus >= 6 ? 'epic' : bonus >= 3 ? 'rare' : bonus >= 1 ? 'uncommon' : 'common');
    const baseSlot = baseItem?.slot ?? this.guessSlot(recipe);

    // Calculate stat bonuses based on recipe level + profession bonus
    const baseStatValue = Math.max(1, Math.floor(recipe.requiredLevel / 5));
    const stat = this.guessStat(recipe);
    const statBonuses = baseItem?.statBonuses?.map(b => ({
      ...b,
      value: b.value + bonus,
    })) ?? [{ stat, value: baseStatValue + bonus }];

    // Upgrade rarity based on quality
    const upgradeRarity = (r: string): string => {
      if (bonus >= 8) return 'legendary';
      if (bonus >= 5 && (r === 'common' || r === 'uncommon')) return 'rare';
      if (bonus >= 3 && r === 'common') return 'uncommon';
      return r;
    };

    const qualitySuffix = bonus >= 6 ? ' (Chef-d\'œuvre)' : bonus >= 3 ? ' (Supérieur)' : bonus >= 1 ? ' (Amélioré)' : '';

    gameData.items.set(craftedID, {
      id: craftedID,
      name: `${baseName}${qualitySuffix}`,
      description: `${baseDesc}. Qualité +${bonus}`,
      rarity: upgradeRarity(baseRarity) as typeof baseRarity,
      slot: baseSlot as EquipmentSlot,
      requiredLevel: Math.max(1, recipe.requiredLevel - 2),
      statBonuses,
      traits: baseItem?.traits ?? [],
      spriteName: baseItem?.spriteName ?? `item_${recipe.result.type}`,
      worldOrigin: baseItem?.worldOrigin ?? null,
    });
  }

  private guessSlot(recipe: CraftingRecipe): string {
    const name = recipe.name.toLowerCase();
    if (name.includes('potion') || name.includes('elixir') || name.includes('enchant')) return 'consumable';
    if (name.includes('casque') || name.includes('heaume')) return 'helmet';
    if (name.includes('plastron') || name.includes('armure')) return 'chest';
    if (name.includes('botte')) return 'boots';
    if (name.includes('gant')) return 'gloves';
    if (name.includes('cape')) return 'cape';
    if (name.includes('jambière') || name.includes('jambiere')) return 'legs';
    if (name.includes('bouclier')) return 'offhand';
    if (name.includes('arc') || name.includes('lame') || name.includes('épée') || name.includes('epee') || name.includes('lance') || name.includes('bâton') || name.includes('baton') || name.includes('dague') || name.includes('arme')) return 'mainWeapon';
    return 'mainWeapon';
  }

  private guessStat(recipe: CraftingRecipe): string {
    switch (recipe.profession) {
      case 'mining': return 'strength';
      case 'woodcutting': return 'agility';
      case 'skinning': return 'vigor';
      case 'herbalism': return 'spirit';
      case 'enchanting': return 'spirit';
    }
  }

  // ── Disenchanting ──────────────────────────────────────

  /** Get the crafting bonus for a crafted item */
  getCraftBonus(itemID: string): number {
    return this.craftBonuses.get(itemID) ?? 0;
  }

  /** Disenchant an item from champion inventory into enchanting materials */
  disenchant(itemID: string): { success: boolean; message: string; materials: { id: string; name: string; amount: number }[] } {
    const champ = GameManager.shared.champion;
    if (!champ) return { success: false, message: 'Aucun champion', materials: [] };

    const idx = champ.inventoryItemIDs.indexOf(itemID);
    if (idx === -1) return { success: false, message: 'Objet non trouvé', materials: [] };

    // Check equipped items
    const eq = champ.equipment;
    const equippedIDs = [eq.mainWeapon, eq.offhand, eq.helmet, eq.chest, eq.shoulders, eq.gloves, eq.boots, eq.legs, eq.cape, eq.belt, eq.ring1, eq.ring2, eq.amulet];
    if (equippedIDs.includes(itemID)) {
      return { success: false, message: 'Impossible de désenchanter un objet équipé', materials: [] };
    }

    // Remove from inventory
    champ.inventoryItemIDs.splice(idx, 1);

    // Determine materials gained based on item rarity
    const gained: { id: string; name: string; amount: number }[] = [];
    const item = gameData.item(itemID);
    const rarity = item?.rarity ?? 'common';

    // Always get poudre_arcane (base material)
    const baseAmount = rarity === 'common' ? 1 : rarity === 'uncommon' ? 2 : rarity === 'rare' ? 3 : rarity === 'epic' ? 5 : rarity === 'legendary' ? 8 : 12;
    this.addMaterial('poudre_arcane', baseAmount);
    gained.push({ id: 'poudre_arcane', name: 'Poudre Arcane', amount: baseAmount });

    // Rare+ items also grant cristal_investiture
    if (['rare', 'epic', 'legendary', 'cosmeric'].includes(rarity)) {
      const crystalAmount = rarity === 'rare' ? 1 : rarity === 'epic' ? 2 : rarity === 'legendary' ? 3 : 5;
      this.addMaterial('cristal_investiture', crystalAmount);
      gained.push({ id: 'cristal_investiture', name: 'Cristal d\'Investiture', amount: crystalAmount });
    }

    // Epic+ items also grant sable_blanc
    if (['epic', 'legendary', 'cosmeric'].includes(rarity)) {
      const sandAmount = rarity === 'epic' ? 1 : rarity === 'legendary' ? 2 : 4;
      this.addMaterial('sable_blanc', sandAmount);
      gained.push({ id: 'sable_blanc', name: 'Sable Blanc', amount: sandAmount });
    }

    // Grant enchanting XP
    this.addXP('enchanting', baseAmount * 5);

    return {
      success: true,
      message: `${item?.name ?? itemID} désenchanté !`,
      materials: gained,
    };
  }

  private addMaterial(id: string, amount: number): void {
    this.inventory.set(id, (this.inventory.get(id) ?? 0) + amount);
  }

  // ── Enchanting XP (called from UI when applying enchantments) ──

  addEnchantingXP(amount: number): void {
    this.addXP('enchanting', amount);
  }

  // ── Labels ───────────────────────────────────────────

  professionLabel(type: ProfessionType): string {
    switch (type) {
      case 'mining': return 'Minage';
      case 'herbalism': return 'Herboristerie';
      case 'woodcutting': return 'Bucheron';
      case 'skinning': return 'Depecement';
      case 'enchanting': return 'Enchantement';
    }
  }

  // ── Persistence ──────────────────────────────────────

  save(): void {
    const data = {
      professions: Array.from(this.professions.values()),
      inventory: Array.from(this.inventory.entries()),
      craftBonuses: Array.from(this.craftBonuses.entries()),
    };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* noop */ }
  }

  load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as { professions: ProfessionState[]; inventory: [string, number][]; craftBonuses?: [string, number][] };
      for (const p of data.professions) {
        this.professions.set(p.type, p);
      }
      this.inventory = new Map(data.inventory);
      if (data.craftBonuses) this.craftBonuses = new Map(data.craftBonuses);
    } catch { /* noop */ }
  }
}
