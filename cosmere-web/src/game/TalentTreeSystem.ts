// ─── Talent Tree System — unlock, points, bonus calculation ─────────

import type { ChampionClass } from '@/data/types';
import { getTalentTree, type Talent, type TalentEffectType, type TalentTree } from './TalentTreeData';

export interface PlayerTalents {
  unlockedTalents: Record<string, number>; // talentID → current rank
  totalPointsSpent: number;
}

export function createPlayerTalents(): PlayerTalents {
  return { unlockedTalents: {}, totalPointsSpent: 0 };
}

export class TalentTreeSystem {
  private tree: TalentTree;
  private talents: PlayerTalents;

  constructor(championClass: ChampionClass, existingTalents?: PlayerTalents) {
    this.tree = getTalentTree(championClass);
    this.talents = existingTalents ?? createPlayerTalents();
  }

  getTree(): TalentTree {
    return this.tree;
  }

  getPlayerTalents(): PlayerTalents {
    return this.talents;
  }

  getTalentRank(talentID: string): number {
    return this.talents.unlockedTalents[talentID] ?? 0;
  }

  canUnlock(talentID: string, availablePoints: number): boolean {
    if (availablePoints <= 0) return false;

    const talent = this.findTalent(talentID);
    if (!talent) return false;

    const currentRank = this.getTalentRank(talentID);
    if (currentRank >= talent.maxRank) return false;

    // Check prerequisite
    if (talent.prerequisiteID) {
      const prereqRank = this.getTalentRank(talent.prerequisiteID);
      if (prereqRank <= 0) return false;
    }

    return true;
  }

  unlockTalent(talentID: string, availablePoints: number): { success: boolean; pointsRemaining: number } {
    if (!this.canUnlock(talentID, availablePoints)) {
      return { success: false, pointsRemaining: availablePoints };
    }

    const currentRank = this.getTalentRank(talentID);
    this.talents.unlockedTalents[talentID] = currentRank + 1;
    this.talents.totalPointsSpent++;

    return { success: true, pointsRemaining: availablePoints - 1 };
  }

  resetAll(): number {
    const refunded = this.talents.totalPointsSpent;
    this.talents.unlockedTalents = {};
    this.talents.totalPointsSpent = 0;
    return refunded;
  }

  // Calculate total bonus for a given effect type across all unlocked talents
  getBonus(effectType: TalentEffectType): number {
    let total = 0;
    for (const branch of this.tree.branches) {
      for (const talent of branch.talents) {
        const rank = this.getTalentRank(talent.id);
        if (rank > 0 && talent.effect.type === effectType) {
          total += talent.effect.valuePerRank * rank;
        }
      }
    }
    return total;
  }

  // Get all active bonuses as a summary
  getAllBonuses(): Record<TalentEffectType, number> {
    const bonuses: Partial<Record<TalentEffectType, number>> = {};
    for (const branch of this.tree.branches) {
      for (const talent of branch.talents) {
        const rank = this.getTalentRank(talent.id);
        if (rank > 0) {
          const current = bonuses[talent.effect.type] ?? 0;
          bonuses[talent.effect.type] = current + talent.effect.valuePerRank * rank;
        }
      }
    }
    return bonuses as Record<TalentEffectType, number>;
  }

  getTalentState(talentID: string, availablePoints: number): 'locked' | 'available' | 'unlocked' | 'maxed' {
    const talent = this.findTalent(talentID);
    if (!talent) return 'locked';

    const rank = this.getTalentRank(talentID);
    if (rank >= talent.maxRank) return 'maxed';
    if (rank > 0) return 'unlocked';
    if (this.canUnlock(talentID, availablePoints)) return 'available';
    return 'locked';
  }

  private findTalent(talentID: string): Talent | null {
    for (const branch of this.tree.branches) {
      for (const talent of branch.talents) {
        if (talent.id === talentID) return talent;
      }
    }
    return null;
  }

  // Save/Load
  serialize(): string {
    return JSON.stringify(this.talents);
  }

  static deserialize(championClass: ChampionClass, data: string): TalentTreeSystem {
    const talents: PlayerTalents = JSON.parse(data);
    return new TalentTreeSystem(championClass, talents);
  }

  save(): void {
    localStorage.setItem('cosmere_talents', this.serialize());
  }

  static load(championClass: ChampionClass): TalentTreeSystem {
    const data = localStorage.getItem('cosmere_talents');
    if (data) {
      return TalentTreeSystem.deserialize(championClass, data);
    }
    return new TalentTreeSystem(championClass);
  }
}
