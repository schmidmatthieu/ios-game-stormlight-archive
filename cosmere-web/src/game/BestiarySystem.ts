import type { Enemy, EnemyTier, WorldID } from '../data/types';

// ─── Bestiary Entry ──────────────────────────────────────────

export interface BestiaryEntry {
  enemyID: string;
  name: string;
  description: string;
  worldID: WorldID;
  tier: EnemyTier;
  level: number;
  maxHP: number;
  damage: number;
  defense: number;
  behavior: string;
  timesDefeated: number;
  firstEncountered: number; // timestamp
  dropsDiscovered: string[]; // item IDs seen dropping
  discovered: boolean; // true once player has encountered this enemy
}

// ─── Bestiary Manager ────────────────────────────────────────

const STORAGE_KEY = 'cosmere_bestiary';

export class BestiaryManager {
  private static _instance: BestiaryManager;
  static get shared(): BestiaryManager {
    if (!this._instance) this._instance = new BestiaryManager();
    return this._instance;
  }

  entries: Map<string, BestiaryEntry> = new Map();

  // Register an enemy encounter (called when player first sees or fights an enemy)
  registerEncounter(enemy: Enemy): void {
    if (!this.entries.has(enemy.id)) {
      this.entries.set(enemy.id, {
        enemyID: enemy.id,
        name: enemy.name,
        description: enemy.description,
        worldID: enemy.worldID as WorldID,
        tier: enemy.tier,
        level: enemy.level,
        maxHP: enemy.maxHP,
        damage: enemy.damage,
        defense: enemy.defense,
        behavior: enemy.behavior,
        timesDefeated: 0,
        firstEncountered: Date.now(),
        dropsDiscovered: [],
        discovered: true,
      });
    }
  }

  // Record a kill
  registerKill(enemy: Enemy): void {
    this.registerEncounter(enemy);
    const entry = this.entries.get(enemy.id)!;
    entry.timesDefeated++;
  }

  // Record a loot drop discovery
  registerDrop(enemyID: string, itemID: string): void {
    const entry = this.entries.get(enemyID);
    if (entry && !entry.dropsDiscovered.includes(itemID)) {
      entry.dropsDiscovered.push(itemID);
    }
  }

  // Get all discovered entries, optionally filtered by world
  getEntries(worldFilter?: string): BestiaryEntry[] {
    const all = Array.from(this.entries.values()).filter(e => e.discovered);
    if (worldFilter && worldFilter !== 'all') {
      return all.filter(e => e.worldID === worldFilter);
    }
    return all.sort((a, b) => {
      const tierOrder: Record<string, number> = { minion: 0, soldier: 1, elite: 2, boss: 3 };
      const worldCompare = a.worldID.localeCompare(b.worldID);
      if (worldCompare !== 0) return worldCompare;
      return (tierOrder[a.tier] ?? 0) - (tierOrder[b.tier] ?? 0);
    });
  }

  // Stats
  get totalDiscovered(): number {
    return Array.from(this.entries.values()).filter(e => e.discovered).length;
  }

  get totalKills(): number {
    let sum = 0;
    this.entries.forEach(e => sum += e.timesDefeated);
    return sum;
  }

  // Persistence
  save(): void {
    const data = Array.from(this.entries.entries());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  load(): void {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const data: [string, BestiaryEntry][] = JSON.parse(raw);
      this.entries = new Map(data);
    } catch {
      // Corrupted data, ignore
    }
  }
}
