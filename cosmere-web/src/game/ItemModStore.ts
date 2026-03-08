// ─── Item Modification Store ──────────────────────────────────────────
// Persists per-item modifications (enchantments, upgrades) that survive save/load.
// Keys are item IDs; modifications are applied on top of the base template.

import type { StatBonus } from '../data/types';
import { gameData } from '../data/DataLoader';

const STORAGE_KEY = 'cosmere_item_mods';

export interface ItemMod {
  addedBonuses: StatBonus[];
  itemLevel: number;
  enchanted: boolean;
}

export class ItemModStore {
  private static _instance: ItemModStore;
  static get shared(): ItemModStore {
    if (!this._instance) this._instance = new ItemModStore();
    return this._instance;
  }

  private mods: Map<string, ItemMod> = new Map();

  getOrCreate(itemID: string): ItemMod {
    let mod = this.mods.get(itemID);
    if (!mod) {
      mod = { addedBonuses: [], itemLevel: 0, enchanted: false };
      this.mods.set(itemID, mod);
    }
    return mod;
  }

  get(itemID: string): ItemMod | undefined {
    return this.mods.get(itemID);
  }

  /** Apply all stored modifications to in-memory item templates */
  applyAll(): void {
    for (const [itemID, mod] of this.mods) {
      const item = gameData.item(itemID);
      if (!item) continue;
      // Set item level
      item.itemLevel = mod.itemLevel;
      // Apply added bonuses (merge into statBonuses)
      for (const bonus of mod.addedBonuses) {
        const existing = item.statBonuses.find(b => b.stat === bonus.stat);
        if (existing) existing.value = bonus.value;
        else item.statBonuses.push({ ...bonus });
      }
      // Mark enchanted
      if (mod.enchanted && !item.name.includes('(E)')) {
        item.name = `${item.name} (E)`;
      }
    }
  }

  /** Record an enchantment applied to an item */
  recordEnchant(itemID: string, bonuses: StatBonus[]): void {
    const mod = this.getOrCreate(itemID);
    mod.enchanted = true;
    const item = gameData.item(itemID);
    if (item) {
      // Store the current stat values as the "truth" after enchanting
      mod.addedBonuses = item.statBonuses.map(b => ({ stat: b.stat, value: b.value }));
    } else {
      for (const b of bonuses) {
        const ex = mod.addedBonuses.find(a => a.stat === b.stat);
        if (ex) ex.value += b.value;
        else mod.addedBonuses.push({ ...b });
      }
    }
    this.save();
  }

  /** Record an upgrade applied to an item */
  recordUpgrade(itemID: string): void {
    const mod = this.getOrCreate(itemID);
    const item = gameData.item(itemID);
    if (item) {
      mod.itemLevel = item.itemLevel ?? 0;
      mod.addedBonuses = item.statBonuses.map(b => ({ stat: b.stat, value: b.value }));
    }
    this.save();
  }

  save(): void {
    const data: Record<string, ItemMod> = {};
    for (const [id, mod] of this.mods) {
      if (mod.itemLevel > 0 || mod.enchanted || mod.addedBonuses.length > 0) {
        data[id] = mod;
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  load(): void {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const data = JSON.parse(raw) as Record<string, ItemMod>;
      this.mods.clear();
      for (const [id, mod] of Object.entries(data)) {
        this.mods.set(id, mod);
      }
    } catch { /* ignore corrupt data */ }
  }
}
