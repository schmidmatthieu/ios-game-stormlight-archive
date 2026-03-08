// ─── Profession System — gathering, crafting professions ─────────────

import { GameManager } from './GameManager';

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
  // Herbalism potions
  { id: 'potion_soin', name: 'Potion de Soin', profession: 'herbalism', requiredLevel: 1,
    materials: [{ materialID: 'herbe_soins', amount: 3 }],
    result: { type: 'potion', itemID: 'potion_soin', amount: 1 } },
  { id: 'potion_investiture', name: 'Potion d\'Investiture', profession: 'herbalism', requiredLevel: 5,
    materials: [{ materialID: 'herbe_soins', amount: 2 }, { materialID: 'racine_orage', amount: 1 }],
    result: { type: 'potion', itemID: 'potion_investiture', amount: 1 } },
  { id: 'elixir_vitalite', name: 'Elixir de Vitalite', profession: 'herbalism', requiredLevel: 15,
    materials: [{ materialID: 'fleur_nalthis', amount: 2 }, { materialID: 'herbe_soins', amount: 3 }],
    result: { type: 'potion', itemID: 'elixir_vitalite', amount: 1 } },
  { id: 'elixir_supreme', name: 'Elixir Supreme', profession: 'herbalism', requiredLevel: 40,
    materials: [{ materialID: 'lotus_investiture', amount: 1 }, { materialID: 'fleur_nalthis', amount: 2 }, { materialID: 'mousse_shadesmar', amount: 2 }],
    result: { type: 'potion', itemID: 'elixir_supreme', amount: 1 } },
  // Mining equipment
  { id: 'lingot_acier', name: 'Lingot d\'Acier', profession: 'mining', requiredLevel: 1,
    materials: [{ materialID: 'minerai_fer', amount: 4 }],
    result: { type: 'equipment', itemID: 'lingot_acier', amount: 1 } },
  { id: 'lame_pewter', name: 'Lame de Pewter', profession: 'mining', requiredLevel: 10,
    materials: [{ materialID: 'minerai_pewter', amount: 3 }, { materialID: 'minerai_fer', amount: 2 }],
    result: { type: 'equipment', itemID: 'lame_pewter', amount: 1 } },
  { id: 'bouclier_gemme', name: 'Bouclier de Gemme', profession: 'mining', requiredLevel: 25,
    materials: [{ materialID: 'gemme_lumiere', amount: 2 }, { materialID: 'minerai_acier', amount: 3 }],
    result: { type: 'equipment', itemID: 'bouclier_gemme', amount: 1 } },
  { id: 'arme_atium', name: 'Arme d\'Atium', profession: 'mining', requiredLevel: 50,
    materials: [{ materialID: 'minerai_atium', amount: 3 }, { materialID: 'minerai_acier', amount: 5 }],
    result: { type: 'equipment', itemID: 'arme_atium', amount: 1 } },
  // Woodcutting
  { id: 'arc_simple', name: 'Arc Simple', profession: 'woodcutting', requiredLevel: 1,
    materials: [{ materialID: 'bois_commun', amount: 5 }],
    result: { type: 'equipment', itemID: 'arc_simple', amount: 1 } },
  { id: 'baton_coquebois', name: 'Baton de Coquebois', profession: 'woodcutting', requiredLevel: 15,
    materials: [{ materialID: 'bois_roshar', amount: 3 }, { materialID: 'bois_commun', amount: 2 }],
    result: { type: 'equipment', itemID: 'baton_coquebois', amount: 1 } },
  // Skinning
  { id: 'armure_cuir', name: 'Armure de Cuir', profession: 'skinning', requiredLevel: 1,
    materials: [{ materialID: 'cuir_brut', amount: 5 }],
    result: { type: 'equipment', itemID: 'armure_cuir', amount: 1 } },
  { id: 'plastron_crustace', name: 'Plastron de Crustace', profession: 'skinning', requiredLevel: 20,
    materials: [{ materialID: 'ecailles_crustace', amount: 3 }, { materialID: 'cuir_brut', amount: 2 }],
    result: { type: 'equipment', itemID: 'plastron_crustace', amount: 1 } },
  { id: 'cape_larkin', name: 'Cape de Larkin', profession: 'skinning', requiredLevel: 35,
    materials: [{ materialID: 'peau_larkin', amount: 2 }, { materialID: 'ecailles_crustace', amount: 2 }],
    result: { type: 'equipment', itemID: 'cape_larkin', amount: 1 } },
  // Enchanting
  { id: 'enchant_force', name: 'Enchantement de Force', profession: 'enchanting', requiredLevel: 5,
    materials: [{ materialID: 'poudre_arcane', amount: 4 }],
    result: { type: 'enchantment', itemID: 'enchant_force', amount: 1 } },
  { id: 'enchant_cosmos', name: 'Enchantement Cosmerique', profession: 'enchanting', requiredLevel: 30,
    materials: [{ materialID: 'cristal_investiture', amount: 2 }, { materialID: 'sable_blanc', amount: 3 }],
    result: { type: 'enchantment', itemID: 'enchant_cosmos', amount: 1 } },
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

    // Add crafted item to champion inventory
    const champ = GameManager.shared.champion;
    if (champ) {
      for (let i = 0; i < recipe.result.amount; i++) {
        champ.inventoryItemIDs.push(recipe.result.itemID);
      }
    }

    // Grant crafting XP
    this.addXP(recipe.profession, recipe.requiredLevel * 15 + 20);

    return { success: true, message: `${recipe.name} fabriqué !` };
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
    };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* noop */ }
  }

  load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as { professions: ProfessionState[]; inventory: [string, number][] };
      for (const p of data.professions) {
        this.professions.set(p.type, p);
      }
      this.inventory = new Map(data.inventory);
    } catch { /* noop */ }
  }
}
