// ─── New Game+ System ────────────────────────────────────────────
// Allows replaying with increased difficulty and exclusive rewards

import { GameManager } from '../game/GameManager';
import type { Champion, WorldID } from '../data/types';

const STORAGE_KEY = 'cosmere_ngplus';

export interface NGPlusState {
  cycle: number;          // NG+1, NG+2, etc.
  unlockedRewards: string[];
  totalCompletions: number;
}

export interface NGPlusDifficultyModifiers {
  enemyHPMult: number;
  enemyDamageMult: number;
  enemySpeedMult: number;
  xpMult: number;
  goldMult: number;
  lootRarityBoost: number;     // 0-1 chance to upgrade rarity
  bossExtraPhase: boolean;
  eliteSpawnChance: number;    // Extra chance for elites to replace minions
  trapDamageMult: number;
}

// ─── Exclusive NG+ Rewards ───────────────────────────────────────

export interface NGPlusReward {
  cycle: number;
  id: string;
  name: string;
  description: string;
  type: 'item' | 'title' | 'cosmetic';
}

const NGPLUS_REWARDS: NGPlusReward[] = [
  { cycle: 1, id: 'ngp_title_survivor', name: 'Survivant du Cosmere', description: 'Titre : Vous avez traversé le Cosmere une fois de plus', type: 'title' },
  { cycle: 1, id: 'ngp_cape_starlight', name: 'Cape de Lumière Stellaire', description: 'Cape brillante qui scintille avec la lumière des étoiles', type: 'item' },
  { cycle: 2, id: 'ngp_amulet_shard', name: 'Amulette d\'Éclat', description: 'Un fragment de Pouvoir cristallisé — +10% à toutes les stats', type: 'item' },
  { cycle: 2, id: 'ngp_title_veteran', name: 'Vétéran des Mondes', description: 'Titre : Deux fois le voyage, deux fois la sagesse', type: 'title' },
  { cycle: 3, id: 'ngp_weapon_cosmeric', name: 'Lame Cosmérique', description: 'Une arme forgée entre les mondes — dégâts cosmériques', type: 'item' },
  { cycle: 3, id: 'ngp_title_legend', name: 'Légende du Cosmere', description: 'Titre : Les mondes tremblent en votre nom', type: 'title' },
  { cycle: 5, id: 'ngp_ring_adonalsium', name: 'Anneau d\'Adonalsium', description: 'Un écho du pouvoir originel — toutes les stats +20%', type: 'item' },
  { cycle: 5, id: 'ngp_title_ascendant', name: 'Ascendant', description: 'Titre : Vous avez touché l\'infini', type: 'title' },
];

// ─── Manager ─────────────────────────────────────────────────────

export class NewGamePlusManager {
  static shared = new NewGamePlusManager();

  private state: NGPlusState;

  constructor() {
    this.state = this.load();
  }

  private load(): NGPlusState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return { cycle: 0, unlockedRewards: [], totalCompletions: 0 };
  }

  private save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
  }

  get cycle(): number { return this.state.cycle; }
  get isNGPlus(): boolean { return this.state.cycle > 0; }

  /** Get difficulty modifiers for current NG+ cycle */
  getDifficulty(): NGPlusDifficultyModifiers {
    const c = this.state.cycle;
    return {
      enemyHPMult: 1 + c * 0.3,           // +30% HP per cycle
      enemyDamageMult: 1 + c * 0.2,       // +20% damage per cycle
      enemySpeedMult: 1 + c * 0.05,       // +5% speed per cycle
      xpMult: 1 + c * 0.15,               // +15% XP per cycle
      goldMult: 1 + c * 0.2,              // +20% gold per cycle
      lootRarityBoost: Math.min(0.3, c * 0.05), // Up to 30% rarity boost
      bossExtraPhase: c >= 2,              // Extra boss phase from NG+2
      eliteSpawnChance: Math.min(0.4, c * 0.1), // Up to 40% elite replacement
      trapDamageMult: 1 + c * 0.25,       // +25% trap damage per cycle
    };
  }

  /** Start a New Game+ cycle — keep level, skills, equipment; reset quests and zones */
  startNewGamePlus(): { success: boolean; message: string; rewards: NGPlusReward[] } {
    const champ = GameManager.shared.champion;
    if (!champ) {
      return { success: false, message: 'Aucun champion trouvé', rewards: [] };
    }

    // Increment cycle
    this.state.cycle++;
    this.state.totalCompletions++;

    // Unlock cycle rewards
    const newRewards: NGPlusReward[] = [];
    for (const reward of NGPLUS_REWARDS) {
      if (reward.cycle <= this.state.cycle && !this.state.unlockedRewards.includes(reward.id)) {
        this.state.unlockedRewards.push(reward.id);
        newRewards.push(reward);
      }
    }

    // Reset champion progress (keep power)
    champ.activeQuestIDs = [];
    champ.completedQuestIDs = [];
    champ.currentWorldID = 'scadrial';
    champ.currentZoneID = 'scadrial_zone_1';
    champ.gridPosition = { col: 5, row: 5 };

    // Bonus stats for completing NG+
    champ.baseStats.vigor += 2;
    champ.baseStats.strength += 2;
    champ.baseStats.agility += 2;
    champ.baseStats.spirit += 2;
    champ.baseStats.investiture += 2;
    champ.baseStats.luck += 1;

    this.save();

    return {
      success: true,
      message: `New Game+ ${this.state.cycle} commencé ! Difficulté augmentée.`,
      rewards: newRewards,
    };
  }

  /** Get available rewards for display */
  getUnlockedRewards(): NGPlusReward[] {
    return NGPLUS_REWARDS.filter(r => this.state.unlockedRewards.includes(r.id));
  }

  /** Get next cycle's rewards preview */
  getNextRewards(): NGPlusReward[] {
    const nextCycle = this.state.cycle + 1;
    return NGPLUS_REWARDS.filter(r => r.cycle === nextCycle);
  }

  /** Apply NG+ modifiers to enemy stats */
  applyToEnemy(baseHP: number, baseDamage: number, baseSpeed: number): { hp: number; damage: number; speed: number } {
    const d = this.getDifficulty();
    return {
      hp: Math.floor(baseHP * d.enemyHPMult),
      damage: Math.floor(baseDamage * d.enemyDamageMult),
      speed: baseSpeed * d.enemySpeedMult,
    };
  }

  /** Apply NG+ modifiers to XP/gold rewards */
  applyToRewards(xp: number, gold: number): { xp: number; gold: number } {
    const d = this.getDifficulty();
    return {
      xp: Math.floor(xp * d.xpMult),
      gold: Math.floor(gold * d.goldMult),
    };
  }

  /** Should this minion become an elite? */
  shouldUpgradeToElite(): boolean {
    const d = this.getDifficulty();
    return Math.random() < d.eliteSpawnChance;
  }

  /** Get cycle label for display */
  getCycleLabel(): string {
    if (this.state.cycle === 0) return '';
    return `NG+${this.state.cycle}`;
  }

  reset(): void {
    this.state = { cycle: 0, unlockedRewards: [], totalCompletions: 0 };
    localStorage.removeItem(STORAGE_KEY);
  }
}
