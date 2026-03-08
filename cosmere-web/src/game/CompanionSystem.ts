import type { WorldID } from '../data/types';

// ─── Companion Definitions ───────────────────────────────────

export type CompanionType = 'spren' | 'mistwraith' | 'aviar' | 'seon' | 'nightmareSketch' | 'sandling' | 'cryptic';

export interface CompanionDef {
  id: string;
  name: string;
  type: CompanionType;
  description: string;
  origin: WorldID;
  color: number;
  glowColor: number;
  size: number; // sprite radius
  bonusType: 'damage' | 'defense' | 'speed' | 'xp' | 'heal' | 'investiture' | 'luck';
  bonusValue: number;
  bonusDescription: string;
  unlockCondition: string; // display text
}

export const COMPANIONS: CompanionDef[] = [
  // Roshar
  {
    id: 'honorspren', name: 'Sylphrena', type: 'spren',
    description: 'Un honorspren espiègle qui danse dans le vent. Ancien compagnon des Chevaliers Radieux.',
    origin: 'roshar', color: 0x88ccff, glowColor: 0x44aaff, size: 5,
    bonusType: 'defense', bonusValue: 15,
    bonusDescription: '+15% défense',
    unlockCondition: 'Défaut: disponible sur Roshar',
  },
  {
    id: 'cryptic', name: 'Motif', type: 'cryptic',
    description: 'Un cryptique fasciné par les mensonges et les vérités. Il murmure des motifs mathématiques.',
    origin: 'roshar', color: 0xaa88ff, glowColor: 0x8866dd, size: 6,
    bonusType: 'xp', bonusValue: 20,
    bonusDescription: '+20% XP',
    unlockCondition: 'Vaincre 10 ennemis sur Roshar',
  },

  // Scadrial
  {
    id: 'mistspirit', name: 'Esprit des Brumes', type: 'mistwraith',
    description: 'Une forme spectrale née des brumes de Scadrial. Guide et protège dans l\'obscurité.',
    origin: 'scadrial', color: 0xaabbcc, glowColor: 0x8899aa, size: 7,
    bonusType: 'speed', bonusValue: 15,
    bonusDescription: '+15% vitesse',
    unlockCondition: 'Défaut: disponible sur Scadrial',
  },
  {
    id: 'steelpushling', name: 'Poucelin d\'Acier', type: 'mistwraith',
    description: 'Un petit être métallique qui orbite autour de son maître, repoussant les projectiles.',
    origin: 'scadrial', color: 0x889999, glowColor: 0x667788, size: 4,
    bonusType: 'defense', bonusValue: 10,
    bonusDescription: '+10% défense',
    unlockCondition: 'Vaincre un boss sur Scadrial',
  },

  // Nalthis
  {
    id: 'lifespren', name: 'Souffle Vivant', type: 'aviar',
    description: 'Un fragment de souffle cristallisé qui pulse de couleurs vivantes.',
    origin: 'nalthis', color: 0xff88aa, glowColor: 0xee6688, size: 5,
    bonusType: 'heal', bonusValue: 1,
    bonusDescription: 'Régénère 1 PV/s',
    unlockCondition: 'Défaut: disponible sur Nalthis',
  },

  // Sel
  {
    id: 'seon_ala', name: 'Seon Ala', type: 'seon',
    description: 'Un seon brillant portant le glyphe Aon Ala. Lumière dans les ténèbres.',
    origin: 'sel', color: 0xffdd44, glowColor: 0xccaa22, size: 6,
    bonusType: 'investiture', bonusValue: 15,
    bonusDescription: '+15% récup. Investiture',
    unlockCondition: 'Défaut: disponible sur Sel',
  },

  // Komashi
  {
    id: 'nightmare_pet', name: 'Encre Apprivoisée', type: 'nightmareSketch',
    description: 'Un cauchemar miniature apprivoisé par la peinture. Loyal mais capricieux.',
    origin: 'komashi', color: 0xcc66ff, glowColor: 0xaa44dd, size: 6,
    bonusType: 'damage', bonusValue: 15,
    bonusDescription: '+15% dégâts',
    unlockCondition: 'Défaut: disponible sur Komashi',
  },

  // Taldain
  {
    id: 'sand_wisp', name: 'Volute de Sable', type: 'sandling',
    description: 'Un tourbillon de sable blanc qui capte la lumière et la redistribue.',
    origin: 'taldain', color: 0xddcc66, glowColor: 0xbbaa44, size: 5,
    bonusType: 'luck', bonusValue: 20,
    bonusDescription: '+20% chance de butin',
    unlockCondition: 'Défaut: disponible sur Taldain',
  },
];

// ─── Companion Manager ───────────────────────────────────────

const STORAGE_KEY = 'cosmere_companions';

export interface CompanionState {
  activeCompanionID: string | null;
  unlockedIDs: string[];
  worldKills: Record<string, number>;
  worldBossKills: Record<string, number>;
}

export class CompanionManager {
  private static _instance: CompanionManager;
  static get shared(): CompanionManager {
    if (!this._instance) this._instance = new CompanionManager();
    return this._instance;
  }

  activeCompanionID: string | null = null;
  unlockedIDs: string[] = [];
  worldKills: Record<string, number> = {};
  worldBossKills: Record<string, number> = {};

  // Unlock companions based on world visit (basic unlock for defaults)
  checkWorldUnlocks(worldID: string): void {
    for (const comp of COMPANIONS) {
      if (comp.origin === worldID && comp.unlockCondition.startsWith('Défaut') && !this.unlockedIDs.includes(comp.id)) {
        this.unlockedIDs.push(comp.id);
      }
    }
    // Auto-select first companion if none active
    if (!this.activeCompanionID && this.unlockedIDs.length > 0) {
      this.activeCompanionID = this.unlockedIDs[0];
    }
  }

  /** Track an enemy kill and check conditional companion unlocks.
   *  Returns the companion name if a new one was unlocked, null otherwise. */
  recordKill(worldID: string, isBoss: boolean): string | null {
    this.worldKills[worldID] = (this.worldKills[worldID] ?? 0) + 1;
    if (isBoss) {
      this.worldBossKills[worldID] = (this.worldBossKills[worldID] ?? 0) + 1;
    }

    // Check conditional unlocks
    // cryptic: 10 kills on Roshar
    if (worldID === 'roshar' && (this.worldKills[worldID] ?? 0) >= 10) {
      if (this.unlockCompanion('cryptic')) {
        this.save();
        return COMPANIONS.find(c => c.id === 'cryptic')?.name ?? null;
      }
    }
    // steelpushling: 1 boss kill on Scadrial
    if (worldID === 'scadrial' && isBoss) {
      if (this.unlockCompanion('steelpushling')) {
        this.save();
        return COMPANIONS.find(c => c.id === 'steelpushling')?.name ?? null;
      }
    }

    return null;
  }

  unlockCompanion(id: string): boolean {
    if (this.unlockedIDs.includes(id)) return false;
    this.unlockedIDs.push(id);
    return true;
  }

  setActive(id: string | null): void {
    this.activeCompanionID = id;
  }

  getActive(): CompanionDef | null {
    if (!this.activeCompanionID) return null;
    return COMPANIONS.find(c => c.id === this.activeCompanionID) ?? null;
  }

  getUnlocked(): CompanionDef[] {
    return COMPANIONS.filter(c => this.unlockedIDs.includes(c.id));
  }

  // Get active bonus
  getBonus(): { type: string; value: number } | null {
    const active = this.getActive();
    if (!active) return null;
    return { type: active.bonusType, value: active.bonusValue };
  }

  save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      activeCompanionID: this.activeCompanionID,
      unlockedIDs: this.unlockedIDs,
      worldKills: this.worldKills,
      worldBossKills: this.worldBossKills,
    }));
  }

  load(): void {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      this.activeCompanionID = data.activeCompanionID ?? null;
      this.unlockedIDs = data.unlockedIDs ?? [];
      this.worldKills = data.worldKills ?? {};
      this.worldBossKills = data.worldBossKills ?? {};
    } catch { /* ignore */ }
  }
}
