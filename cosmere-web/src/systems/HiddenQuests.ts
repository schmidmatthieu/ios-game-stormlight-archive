// ─── Hidden Quest System ─────────────────────────────────────────
// Secret quests discovered through exploration, NPC sequences, and world events

import type { WorldID } from '../data/types';
import { GameManager } from '../game/GameManager';

export type HiddenQuestTrigger =
  | 'visit_secret_area'
  | 'talk_npc_sequence'
  | 'kill_rare_enemy'
  | 'find_hidden_item'
  | 'activate_obelisks'
  | 'survive_time'
  | 'explore_all_zones';

export interface HiddenQuestDef {
  id: string;
  name: string;
  description: string;
  worldID: WorldID;
  trigger: HiddenQuestTrigger;
  triggerData: string;       // Specific trigger condition (e.g., NPC IDs, area IDs)
  requiredCount: number;     // How many triggers needed
  rewards: {
    xp: number;
    gold: number;
    itemID: string | null;
    reputation: number;
  };
  hintText: string;          // Vague hint shown in quest log after partial discovery
}

export interface HiddenQuestState {
  questID: string;
  discovered: boolean;
  progress: number;
  completed: boolean;
}

// ─── Quest Database ──────────────────────────────────────────────

const HIDDEN_QUESTS: HiddenQuestDef[] = [
  // Scadrial
  {
    id: 'hq_scadrial_ash_collector',
    name: 'Collectionneur de Cendres',
    description: 'Visitez les 3 zones secrètes enfouies sous les cendres de Scadrial.',
    worldID: 'scadrial',
    trigger: 'visit_secret_area',
    triggerData: 'scadrial',
    requiredCount: 3,
    rewards: { xp: 150, gold: 100, itemID: 'ring_ash_ward', reputation: 20 },
    hintText: 'Les cendres recouvrent des secrets anciens...',
  },
  {
    id: 'hq_scadrial_informant',
    name: 'Réseau d\'Informateurs',
    description: 'Parlez aux 3 informateurs de Luthadel dans le bon ordre.',
    worldID: 'scadrial',
    trigger: 'talk_npc_sequence',
    triggerData: 'informant_1,informant_2,informant_3',
    requiredCount: 3,
    rewards: { xp: 200, gold: 150, itemID: null, reputation: 30 },
    hintText: 'Quelqu\'un dans la brume connaît un réseau...',
  },

  // Roshar
  {
    id: 'hq_roshar_spren_seeker',
    name: 'Chercheur de Sprens',
    description: 'Découvrez les 4 sprens cachés dans les crevasses de Roshar.',
    worldID: 'roshar',
    trigger: 'find_hidden_item',
    triggerData: 'spren',
    requiredCount: 4,
    rewards: { xp: 200, gold: 80, itemID: 'amulet_spren_bond', reputation: 25 },
    hintText: 'Des éclats de lumière dansent dans les fissures...',
  },
  {
    id: 'hq_roshar_oathkeeper',
    name: 'Gardien des Serments',
    description: 'Activez les 3 obélisques des Idéaux dispersés dans Roshar.',
    worldID: 'roshar',
    trigger: 'activate_obelisks',
    triggerData: 'roshar',
    requiredCount: 3,
    rewards: { xp: 300, gold: 200, itemID: 'cape_windrunner', reputation: 40 },
    hintText: 'Les mots les plus importants qu\'un homme puisse dire...',
  },

  // Taldain
  {
    id: 'hq_taldain_oasis_finder',
    name: 'Découvreur d\'Oasis',
    description: 'Trouvez les 3 oasis secrètes cachées dans le désert de Dayside.',
    worldID: 'taldain',
    trigger: 'visit_secret_area',
    triggerData: 'taldain',
    requiredCount: 3,
    rewards: { xp: 175, gold: 120, itemID: null, reputation: 25 },
    hintText: 'Le sable murmure vers l\'eau...',
  },

  // Komashi
  {
    id: 'hq_komashi_nightmare_hunter',
    name: 'Chasseur de Cauchemars',
    description: 'Éliminez 5 cauchemars rares qui n\'apparaissent que la nuit.',
    worldID: 'komashi',
    trigger: 'kill_rare_enemy',
    triggerData: 'nightmare_rare',
    requiredCount: 5,
    rewards: { xp: 250, gold: 175, itemID: 'gloves_painter', reputation: 30 },
    hintText: 'Dans l\'obscurité, des formes plus terrifiantes rôdent...',
  },

  // Nalthis
  {
    id: 'hq_nalthis_breath_collector',
    name: 'Accumulateur de Souffles',
    description: 'Trouvez 5 souffles perdus dans les recoins de Nalthis.',
    worldID: 'nalthis',
    trigger: 'find_hidden_item',
    triggerData: 'breath',
    requiredCount: 5,
    rewards: { xp: 225, gold: 150, itemID: 'belt_chromatic', reputation: 30 },
    hintText: 'Les couleurs s\'intensifient près de certains endroits...',
  },

  // Sel
  {
    id: 'hq_sel_aon_scholar',
    name: 'Érudit des Aons',
    description: 'Découvrez 4 Aons oubliés gravés dans les ruines de Sel.',
    worldID: 'sel',
    trigger: 'find_hidden_item',
    triggerData: 'aon',
    requiredCount: 4,
    rewards: { xp: 200, gold: 130, itemID: 'helmet_elantrian', reputation: 35 },
    hintText: 'Des lueurs anciennes percent à travers la pierre...',
  },

  // Shadesmar (cross-world)
  {
    id: 'hq_shadesmar_worldhopper',
    name: 'Véritable Salteur',
    description: 'Explorez toutes les zones de 5 mondes différents.',
    worldID: 'shadesmar',
    trigger: 'explore_all_zones',
    triggerData: 'all',
    requiredCount: 5,
    rewards: { xp: 500, gold: 300, itemID: 'boots_worldhopper', reputation: 50 },
    hintText: 'Le Cosmere attend ceux qui osent voyager...',
  },

  // Survival challenge
  {
    id: 'hq_survival_master',
    name: 'Maître de la Survie',
    description: 'Survivez 120 secondes dans une zone de boss sans être touché.',
    worldID: 'shadesmar',
    trigger: 'survive_time',
    triggerData: 'boss_zone',
    requiredCount: 1,
    rewards: { xp: 400, gold: 250, itemID: 'ring_dodge', reputation: 40 },
    hintText: 'La meilleure défense est de ne jamais être touché...',
  },
];

// ─── Manager ─────────────────────────────────────────────────────

const STORAGE_KEY = 'cosmere_hidden_quests';

export class HiddenQuestManager {
  static shared = new HiddenQuestManager();

  private states: Map<string, HiddenQuestState> = new Map();

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const arr: HiddenQuestState[] = JSON.parse(raw);
        for (const s of arr) this.states.set(s.questID, s);
      }
    } catch { /* ignore */ }
  }

  private save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...this.states.values()]));
  }

  private getState(questID: string): HiddenQuestState {
    let s = this.states.get(questID);
    if (!s) {
      s = { questID, discovered: false, progress: 0, completed: false };
      this.states.set(questID, s);
    }
    return s;
  }

  /** Report a trigger event. Returns list of notifications to show. */
  reportTrigger(
    trigger: HiddenQuestTrigger,
    triggerData: string,
    worldID: WorldID,
  ): { questName: string; message: string; completed: boolean; rewards?: HiddenQuestDef['rewards'] }[] {
    const notifications: { questName: string; message: string; completed: boolean; rewards?: HiddenQuestDef['rewards'] }[] = [];

    for (const def of HIDDEN_QUESTS) {
      // Match trigger type
      if (def.trigger !== trigger) continue;

      // Match trigger data (world-specific or exact match)
      if (def.triggerData !== triggerData && def.triggerData !== worldID && def.triggerData !== 'all') continue;

      const state = this.getState(def.id);
      if (state.completed) continue;

      state.progress++;

      if (!state.discovered) {
        state.discovered = true;
        notifications.push({
          questName: def.name,
          message: `Quête secrète découverte : ${def.name}`,
          completed: false,
        });
      }

      if (state.progress >= def.requiredCount) {
        state.completed = true;
        // Apply rewards
        const champ = GameManager.shared.champion;
        if (champ) {
          champ.currentXP += def.rewards.xp;
          champ.gold += def.rewards.gold;
          if (def.rewards.reputation > 0) {
            champ.reputation[def.worldID] = (champ.reputation[def.worldID] ?? 0) + def.rewards.reputation;
          }
        }
        notifications.push({
          questName: def.name,
          message: `Quête secrète complétée : ${def.name} !`,
          completed: true,
          rewards: def.rewards,
        });
      }

      this.save();
    }

    return notifications;
  }

  /** Get all discovered (but not necessarily completed) hidden quests */
  getDiscoveredQuests(): { def: HiddenQuestDef; state: HiddenQuestState }[] {
    const result: { def: HiddenQuestDef; state: HiddenQuestState }[] = [];
    for (const def of HIDDEN_QUESTS) {
      const state = this.states.get(def.id);
      if (state?.discovered) {
        result.push({ def, state });
      }
    }
    return result;
  }

  /** Get completion stats */
  getStats(): { total: number; discovered: number; completed: number } {
    let discovered = 0;
    let completed = 0;
    for (const def of HIDDEN_QUESTS) {
      const s = this.states.get(def.id);
      if (s?.discovered) discovered++;
      if (s?.completed) completed++;
    }
    return { total: HIDDEN_QUESTS.length, discovered, completed };
  }

  /** Get hint for undiscovered quests in a world */
  getWorldHints(worldID: WorldID): string[] {
    const hints: string[] = [];
    for (const def of HIDDEN_QUESTS) {
      if (def.worldID !== worldID && def.worldID !== 'shadesmar') continue;
      const s = this.states.get(def.id);
      if (!s?.discovered) {
        hints.push(def.hintText);
      }
    }
    return hints;
  }

  reset(): void {
    this.states.clear();
    localStorage.removeItem(STORAGE_KEY);
  }
}
