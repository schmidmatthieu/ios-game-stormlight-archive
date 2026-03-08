// ─── Profession System — gathering, crafting professions ─────────────

import { GameManager } from './GameManager';
import { gameData } from '../data/DataLoader';
import type { EquipmentSlot } from '../data/types';
import { MATERIALS as DATA_MATERIALS, WORLD_LOOT as DATA_WORLD_LOOT, RECIPES as DATA_RECIPES } from './ProfessionData';

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

// Re-export data from ProfessionData.ts
export { MATERIALS, WORLD_LOOT, RECIPES } from './ProfessionData';

// Use imported data references for internal logic
const MATERIALS_REF = DATA_MATERIALS;
const WORLD_LOOT_REF = DATA_WORLD_LOOT;
const RECIPES_REF = DATA_RECIPES;

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
    const loot = WORLD_LOOT_REF[worldID]?.[profession];
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
    const mat = MATERIALS_REF.find(m => m.id === materialID);
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
    return RECIPES_REF.filter(r => {
      if (profession && r.profession !== profession) return false;
      const state = this.professions.get(r.profession);
      return state !== undefined && state.level >= r.requiredLevel;
    });
  }

  canCraft(recipeID: string): { possible: boolean; reason: string } {
    const recipe = RECIPES_REF.find(r => r.id === recipeID);
    if (!recipe) return { possible: false, reason: 'Recette inconnue' };

    const state = this.professions.get(recipe.profession);
    if (!state || state.level < recipe.requiredLevel) {
      return { possible: false, reason: `Niveau ${recipe.requiredLevel} en ${this.professionLabel(recipe.profession)} requis` };
    }

    for (const mat of recipe.materials) {
      const owned = this.inventory.get(mat.materialID) ?? 0;
      if (owned < mat.amount) {
        const matInfo = MATERIALS_REF.find(m => m.id === mat.materialID);
        return { possible: false, reason: `${mat.amount}x ${matInfo?.name ?? mat.materialID} requis (${owned} possedes)` };
      }
    }

    return { possible: true, reason: '' };
  }

  craft(recipeID: string): { success: boolean; message: string } {
    const check = this.canCraft(recipeID);
    if (!check.possible) return { success: false, message: check.reason };

    const recipe = RECIPES_REF.find(r => r.id === recipeID)!;

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
