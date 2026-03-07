import type { Champion, ChampionClass, ChampionStats, RadiantOrder } from '../data/types';
import { CLASS_INFO } from '../data/types';

const BASE_STATS: ChampionStats = { vigor: 10, investiture: 10, strength: 10, agility: 10, spirit: 10, luck: 5 };

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
