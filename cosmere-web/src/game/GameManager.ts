import type { Champion, ChampionClass, ChampionStats, RadiantOrder, MagicSystemType } from '../data/types';
import { CLASS_INFO } from '../data/types';

const BASE_STATS: ChampionStats = { vigor: 10, investiture: 10, strength: 10, agility: 10, spirit: 10, luck: 5 };

// Map class to magic system for skill lookup
const CLASS_MAGIC: Record<ChampionClass, MagicSystemType> = {
  mistborn: 'allomancy',
  radiant: 'surgebinding',
  awakener: 'awakening',
  elantrian: 'aonDor',
  sandMaster: 'sandMastery',
  nightmarePainter: 'painting',
};

export class GameManager {
  private static _instance: GameManager;
  static get shared(): GameManager {
    if (!this._instance) this._instance = new GameManager();
    return this._instance;
  }

  champion: Champion | null = null;

  // MARK: - New Game

  startNewGame(name: string, cls: ChampionClass, order?: RadiantOrder): void {
    const info = CLASS_INFO[cls];
    this.champion = {
      name,
      championClass: cls,
      radiantOrder: order ?? null,
      level: 1,
      currentXP: 0,
      skillPoints: 1,
      unlockedSkillIDs: [],
      equippedSkillIDs: [],
      baseStats: { ...BASE_STATS },
      equipment: {
        helmet: null, shoulders: null, chest: null, cape: null,
        gloves: null, belt: null, legs: null, boots: null,
        mainWeapon: null, offhand: null, amulet: null,
        ring1: null, ring2: null,
      },
      inventoryItemIDs: [],
      currentHP: 150,
      currentInvestiture: 110,
      gold: 50,
      currentWorldID: info.startingWorld,
      currentZoneID: `${info.startingWorld}_hub`,
      gridPosition: { col: 5, row: 5 },
      activeQuestIDs: [],
      completedQuestIDs: [],
      reputation: {},
    };
  }

  // Auto-equip available skills based on level and class
  autoEquipSkills(allSkills: Map<string, { id: string; magicSystem: MagicSystemType; requiredLevel: number }>): void {
    if (!this.champion) return;
    const magicSystem = CLASS_MAGIC[this.champion.championClass];

    // Find all skills for this class that meet level requirements
    const available: string[] = [];
    allSkills.forEach((skill) => {
      if (skill.magicSystem === magicSystem && skill.requiredLevel <= this.champion!.level) {
        available.push(skill.id);
      }
    });

    // Unlock all available
    this.champion.unlockedSkillIDs = available;

    // Equip up to 4 skills (if not already equipped)
    if (this.champion.equippedSkillIDs.length === 0) {
      this.champion.equippedSkillIDs = available.slice(0, 4);
    } else {
      // Keep existing equipped but fill empty slots
      while (this.champion.equippedSkillIDs.length < 4) {
        const next = available.find(id => !this.champion!.equippedSkillIDs.includes(id));
        if (!next) break;
        this.champion.equippedSkillIDs.push(next);
      }
    }
  }

  // MARK: - Equipment

  equipItem(itemID: string, slot: string): void {
    if (!this.champion) return;
    const eq = this.champion.equipment as unknown as Record<string, string | null>;
    const prevItem = eq[slot];

    // Unequip previous item back to inventory
    if (prevItem) {
      this.champion.inventoryItemIDs.push(prevItem);
    }

    // Remove new item from inventory and equip
    const idx = this.champion.inventoryItemIDs.indexOf(itemID);
    if (idx >= 0) this.champion.inventoryItemIDs.splice(idx, 1);
    eq[slot] = itemID;
  }

  unequipItem(slot: string): void {
    if (!this.champion) return;
    const eq = this.champion.equipment as unknown as Record<string, string | null>;
    const item = eq[slot];
    if (item) {
      this.champion.inventoryItemIDs.push(item);
      eq[slot] = null;
    }
  }

  // MARK: - XP

  grantXP(amount: number): boolean {
    if (!this.champion) return false;
    this.champion.currentXP += amount;
    let leveledUp = false;

    while (this.champion.currentXP >= this.xpForNextLevel) {
      this.champion.currentXP -= this.xpForNextLevel;
      this.champion.level++;
      this.champion.skillPoints++;
      this.champion.currentHP = this.maxHP;
      this.champion.currentInvestiture = this.maxInvestiture;
      leveledUp = true;
    }
    return leveledUp;
  }

  get xpForNextLevel(): number {
    return (this.champion?.level ?? 1) * 100 + 50;
  }

  get maxHP(): number {
    return (this.champion?.baseStats.vigor ?? 10) * 10 + 50;
  }

  get maxInvestiture(): number {
    return (this.champion?.baseStats.investiture ?? 10) * 8 + 30;
  }

  // MARK: - Save / Load

  save(): void {
    if (this.champion) {
      localStorage.setItem('cosmere_save', JSON.stringify(this.champion));
    }
  }

  load(): boolean {
    const data = localStorage.getItem('cosmere_save');
    if (!data) return false;
    this.champion = JSON.parse(data);
    return true;
  }

  hasSave(): boolean {
    return localStorage.getItem('cosmere_save') !== null;
  }
}
