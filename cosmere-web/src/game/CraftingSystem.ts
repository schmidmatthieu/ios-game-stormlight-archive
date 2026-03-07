// ─── Crafting System — stations, recipes, ingredient logic ──────────

export type CraftingStation = 'forge' | 'gemcutter' | 'loom' | 'aonTable' | 'sandKiln' | 'inkBrewer' | 'cosmericAnvil';

export interface CraftingIngredient {
  type: 'item_id' | 'item_rarity' | 'gold' | 'material';
  value: string;
  count: number;
}

export interface CraftingRecipe {
  id: string;
  name: string;
  description: string;
  category: 'consumable' | 'weapon' | 'armor' | 'enchant' | 'accessory';
  worldID: string | null;
  requiredLevel: number;
  requiredStation: CraftingStation | null;
  ingredients: CraftingIngredient[];
  goldCost: number;
  resultItemID: string | null;
  resultName: string;
  resultRarity: string;
  resultQuantity: number;
  craftingTime: number; // seconds
}

export interface CraftingEffect {
  type: 'heal_hp' | 'heal_inv' | 'buff_strength' | 'buff_shield' | 'buff_haste' | 'buff_crit' | 'multi_buff';
  value: number;
  duration: number;
  values?: { type: string; value: number; duration: number }[];
}

// ─── Station Info ────────────────────────────────────

export interface StationInfo {
  name: string;
  worldID: string;
  description: string;
  color: number;
}

export const STATIONS: Record<CraftingStation, StationInfo> = {
  forge: { name: 'Forge d\'Acier', worldID: 'scadrial', description: 'Forge des armes et armures à partir de métaux', color: 0xaa5533 },
  gemcutter: { name: 'Tailleur de Gemmes', worldID: 'roshar', description: 'Taille des gemmes infusées de Lumière d\'Orage', color: 0x4488cc },
  loom: { name: 'Métier à Tisser', worldID: 'nalthis', description: 'Tisse des étoffes éveillées par les Souffles', color: 0x44cc88 },
  aonTable: { name: 'Table des Aons', worldID: 'sel', description: 'Inscrit des glyphes aoniques sur les objets', color: 0xccaa44 },
  sandKiln: { name: 'Four à Sable', worldID: 'taldain', description: 'Cristallise le sable blanc en équipement', color: 0xddaa55 },
  inkBrewer: { name: 'Brasserie d\'Encre', worldID: 'komashi', description: 'Distille l\'encre de cauchemar en potions', color: 0xaa55cc },
  cosmericAnvil: { name: 'Enclume Cosmérique', worldID: 'shadesmar', description: 'Forge des objets transcendant les mondes', color: 0x8866cc },
};

// ─── Recipes ─────────────────────────────────────────

const ALL_RECIPES: CraftingRecipe[] = [
  // ─── Consumables (no station required) ───
  {
    id: 'potion_sante', name: 'Potion de Santé', description: 'Restaure 50 PV',
    category: 'consumable', worldID: null, requiredLevel: 1, requiredStation: null,
    ingredients: [{ type: 'gold', value: 'gold', count: 20 }],
    goldCost: 20, resultItemID: null, resultName: 'Potion de Santé', resultRarity: 'common', resultQuantity: 1, craftingTime: 0,
  },
  {
    id: 'elixir_investiture', name: 'Élixir d\'Investiture', description: 'Restaure 40 Investiture',
    category: 'consumable', worldID: null, requiredLevel: 1, requiredStation: null,
    ingredients: [{ type: 'gold', value: 'gold', count: 25 }],
    goldCost: 25, resultItemID: null, resultName: 'Élixir d\'Investiture', resultRarity: 'common', resultQuantity: 1, craftingTime: 0,
  },
  {
    id: 'baume_guerrier', name: 'Baume du Guerrier', description: '+30% dégâts pendant 30s',
    category: 'consumable', worldID: null, requiredLevel: 3, requiredStation: null,
    ingredients: [{ type: 'gold', value: 'gold', count: 50 }],
    goldCost: 50, resultItemID: null, resultName: 'Baume du Guerrier', resultRarity: 'uncommon', resultQuantity: 1, craftingTime: 0,
  },
  {
    id: 'elixir_haste', name: 'Élixir de Vitesse', description: '+40% vitesse pendant 20s',
    category: 'consumable', worldID: null, requiredLevel: 5, requiredStation: null,
    ingredients: [{ type: 'gold', value: 'gold', count: 60 }],
    goldCost: 60, resultItemID: null, resultName: 'Élixir de Vitesse', resultRarity: 'uncommon', resultQuantity: 1, craftingTime: 0,
  },
  {
    id: 'philtre_critique', name: 'Philtre Critique', description: '+25% chance critique pendant 25s',
    category: 'consumable', worldID: null, requiredLevel: 7, requiredStation: null,
    ingredients: [{ type: 'gold', value: 'gold', count: 75 }],
    goldCost: 75, resultItemID: null, resultName: 'Philtre Critique', resultRarity: 'rare', resultQuantity: 1, craftingTime: 0,
  },
  {
    id: 'elixir_supreme', name: 'Élixir Suprême', description: 'Restaure 100 PV + 60 Investiture + buff',
    category: 'consumable', worldID: null, requiredLevel: 10, requiredStation: null,
    ingredients: [{ type: 'gold', value: 'gold', count: 150 }, { type: 'material', value: 'Cristal d\'Investiture', count: 1 }],
    goldCost: 150, resultItemID: null, resultName: 'Élixir Suprême', resultRarity: 'epic', resultQuantity: 1, craftingTime: 2,
  },

  // ─── Forge (Scadrial) ───
  {
    id: 'forge_lame_acier', name: 'Lame d\'Acier', description: 'Épée forgée dans les brumes de Scadrial',
    category: 'weapon', worldID: 'scadrial', requiredLevel: 3, requiredStation: 'forge',
    ingredients: [{ type: 'item_rarity', value: 'common', count: 2 }, { type: 'gold', value: 'gold', count: 40 }],
    goldCost: 40, resultItemID: 'scadrial_weapon_1', resultName: 'Lame d\'Acier', resultRarity: 'uncommon', resultQuantity: 1, craftingTime: 5,
  },
  {
    id: 'forge_armure_pewter', name: 'Armure de Pewter', description: 'Armure renforcée par le pewter',
    category: 'armor', worldID: 'scadrial', requiredLevel: 5, requiredStation: 'forge',
    ingredients: [{ type: 'item_rarity', value: 'uncommon', count: 1 }, { type: 'gold', value: 'gold', count: 80 }],
    goldCost: 80, resultItemID: 'scadrial_armor_1', resultName: 'Armure de Pewter', resultRarity: 'rare', resultQuantity: 1, craftingTime: 8,
  },
  {
    id: 'forge_spike_inquisiteur', name: 'Spike d\'Inquisiteur', description: 'Pointe hémalurgique puissante',
    category: 'accessory', worldID: 'scadrial', requiredLevel: 10, requiredStation: 'forge',
    ingredients: [{ type: 'item_rarity', value: 'rare', count: 2 }, { type: 'gold', value: 'gold', count: 200 }],
    goldCost: 200, resultItemID: 'scadrial_legendary_1', resultName: 'Spike d\'Inquisiteur', resultRarity: 'legendary', resultQuantity: 1, craftingTime: 15,
  },

  // ─── Gemcutter (Roshar) ───
  {
    id: 'gem_chip_lumiere', name: 'Chip de Lumière', description: 'Petite gemme infusée',
    category: 'accessory', worldID: 'roshar', requiredLevel: 3, requiredStation: 'gemcutter',
    ingredients: [{ type: 'item_rarity', value: 'common', count: 3 }, { type: 'gold', value: 'gold', count: 30 }],
    goldCost: 30, resultItemID: 'roshar_accessory_1', resultName: 'Chip de Lumière', resultRarity: 'uncommon', resultQuantity: 1, craftingTime: 4,
  },
  {
    id: 'gem_honorblade', name: 'Fragment d\'Honorblade', description: 'Éclat d\'une lame d\'honneur',
    category: 'weapon', worldID: 'roshar', requiredLevel: 8, requiredStation: 'gemcutter',
    ingredients: [{ type: 'item_rarity', value: 'rare', count: 1 }, { type: 'gold', value: 'gold', count: 150 }],
    goldCost: 150, resultItemID: 'roshar_weapon_1', resultName: 'Fragment d\'Honorblade', resultRarity: 'epic', resultQuantity: 1, craftingTime: 12,
  },

  // ─── Sand Kiln (Taldain) ───
  {
    id: 'sand_cristal_solaire', name: 'Cristal Solaire', description: 'Sable blanc cristallisé par le soleil',
    category: 'accessory', worldID: 'taldain', requiredLevel: 4, requiredStation: 'sandKiln',
    ingredients: [{ type: 'item_rarity', value: 'common', count: 2 }, { type: 'gold', value: 'gold', count: 35 }],
    goldCost: 35, resultItemID: 'taldain_accessory_1', resultName: 'Cristal Solaire', resultRarity: 'uncommon', resultQuantity: 1, craftingTime: 5,
  },

  // ─── Ink Brewer (Komashi) ───
  {
    id: 'ink_encre_cauchemar', name: 'Encre de Cauchemar', description: 'Encre distillée des ténèbres',
    category: 'enchant', worldID: 'komashi', requiredLevel: 5, requiredStation: 'inkBrewer',
    ingredients: [{ type: 'item_rarity', value: 'uncommon', count: 1 }, { type: 'gold', value: 'gold', count: 45 }],
    goldCost: 45, resultItemID: null, resultName: 'Encre de Cauchemar', resultRarity: 'rare', resultQuantity: 1, craftingTime: 6,
  },

  // ─── Loom (Nalthis) ───
  {
    id: 'loom_etoffe_eveillee', name: 'Étoffe Éveillée', description: 'Tissu animé par les Souffles',
    category: 'armor', worldID: 'nalthis', requiredLevel: 4, requiredStation: 'loom',
    ingredients: [{ type: 'item_rarity', value: 'common', count: 2 }, { type: 'gold', value: 'gold', count: 40 }],
    goldCost: 40, resultItemID: 'nalthis_armor_1', resultName: 'Étoffe Éveillée', resultRarity: 'uncommon', resultQuantity: 1, craftingTime: 5,
  },

  // ─── Aon Table (Sel) ───
  {
    id: 'aon_glyphe_puissance', name: 'Glyphe de Puissance', description: 'Aon inscrit sur un parchemin',
    category: 'enchant', worldID: 'sel', requiredLevel: 5, requiredStation: 'aonTable',
    ingredients: [{ type: 'item_rarity', value: 'uncommon', count: 1 }, { type: 'gold', value: 'gold', count: 55 }],
    goldCost: 55, resultItemID: null, resultName: 'Glyphe de Puissance', resultRarity: 'rare', resultQuantity: 1, craftingTime: 7,
  },

  // ─── Cosmeric Anvil (Shadesmar) ───
  {
    id: 'cosmeric_nexus', name: 'Pierre du Nexus', description: 'Cristal transcendant les frontières des mondes',
    category: 'accessory', worldID: 'shadesmar', requiredLevel: 12, requiredStation: 'cosmericAnvil',
    ingredients: [{ type: 'item_rarity', value: 'epic', count: 1 }, { type: 'item_rarity', value: 'rare', count: 2 }, { type: 'gold', value: 'gold', count: 500 }],
    goldCost: 500, resultItemID: 'shadesmar_cosmeric_1', resultName: 'Pierre du Nexus', resultRarity: 'cosmeric', resultQuantity: 1, craftingTime: 30,
  },
];

// ─── Recipe Effects (for consumables) ────────────────

const RECIPE_EFFECTS: Record<string, CraftingEffect> = {
  potion_sante: { type: 'heal_hp', value: 50, duration: 0 },
  elixir_investiture: { type: 'heal_inv', value: 40, duration: 0 },
  baume_guerrier: { type: 'buff_strength', value: 30, duration: 30 },
  elixir_haste: { type: 'buff_haste', value: 40, duration: 20 },
  philtre_critique: { type: 'buff_crit', value: 25, duration: 25 },
  elixir_supreme: {
    type: 'multi_buff', value: 0, duration: 0,
    values: [
      { type: 'heal_hp', value: 100, duration: 0 },
      { type: 'heal_inv', value: 60, duration: 0 },
      { type: 'buff_shield', value: 20, duration: 15 },
    ],
  },
  ink_encre_cauchemar: { type: 'buff_strength', value: 40, duration: 25 },
  aon_glyphe_puissance: { type: 'buff_strength', value: 35, duration: 30 },
};

// ─── System Logic ────────────────────────────────────

export interface CraftResult {
  success: boolean;
  message: string;
  recipeID: string;
}

export function getRecipesForWorld(worldID: string): CraftingRecipe[] {
  return ALL_RECIPES.filter(r => r.worldID === null || r.worldID === worldID);
}

export function getRecipesForStation(station: CraftingStation): CraftingRecipe[] {
  return ALL_RECIPES.filter(r => r.requiredStation === station);
}

export function getRecipesByCategory(category: string, worldID?: string): CraftingRecipe[] {
  return ALL_RECIPES.filter(r => {
    if (r.category !== category) return false;
    if (worldID && r.worldID !== null && r.worldID !== worldID) return false;
    return true;
  });
}

export function getAllRecipes(): CraftingRecipe[] {
  return ALL_RECIPES;
}

export function getRecipeEffect(recipeID: string): CraftingEffect | null {
  return RECIPE_EFFECTS[recipeID] ?? null;
}

export function canCraft(
  recipe: CraftingRecipe,
  playerLevel: number,
  gold: number,
  inventoryItemIDs: string[],
  itemRarities: Map<string, string>,
): { possible: boolean; reason: string } {
  if (playerLevel < recipe.requiredLevel) {
    return { possible: false, reason: `Niveau ${recipe.requiredLevel} requis` };
  }
  if (gold < recipe.goldCost) {
    return { possible: false, reason: `${recipe.goldCost} or requis` };
  }

  // Check ingredient availability
  const usedItems = new Set<number>();
  for (const ingredient of recipe.ingredients) {
    if (ingredient.type === 'gold') continue; // already checked

    if (ingredient.type === 'item_rarity') {
      let found = 0;
      for (let i = 0; i < inventoryItemIDs.length; i++) {
        if (usedItems.has(i)) continue;
        const rarity = itemRarities.get(inventoryItemIDs[i]);
        if (rarity === ingredient.value) {
          usedItems.add(i);
          found++;
          if (found >= ingredient.count) break;
        }
      }
      if (found < ingredient.count) {
        return { possible: false, reason: `${ingredient.count}× objet ${ingredient.value} requis` };
      }
    }

    if (ingredient.type === 'item_id') {
      let found = 0;
      for (let i = 0; i < inventoryItemIDs.length; i++) {
        if (usedItems.has(i)) continue;
        if (inventoryItemIDs[i] === ingredient.value) {
          usedItems.add(i);
          found++;
          if (found >= ingredient.count) break;
        }
      }
      if (found < ingredient.count) {
        return { possible: false, reason: `${ingredient.count}× ${ingredient.value} requis` };
      }
    }
  }

  return { possible: true, reason: '' };
}

export function getStationForWorld(worldID: string): CraftingStation | null {
  for (const [station, info] of Object.entries(STATIONS)) {
    if (info.worldID === worldID) return station as CraftingStation;
  }
  return null;
}
