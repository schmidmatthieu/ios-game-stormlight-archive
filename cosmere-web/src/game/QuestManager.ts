import { GameManager } from './GameManager';
import { gameData } from '../data/DataLoader';
import { CLASS_INFO } from '../data/types';
import type { Quest, ChampionClass } from '../data/types';

export interface QuestState {
  questID: string;
  objectiveProgress: Record<string, number>; // objectiveID -> currentCount
  completed: boolean;
}

// ─── Act Narrative Info ─────────────────────────────────────────
export const ACT_INFO: Record<number, { name: string; subtitle: string; description: string }> = {
  1: {
    name: 'Acte I — L\'Éveil',
    subtitle: 'Le Salteur s\'éveille',
    description: 'Vous découvrez que vous êtes un Salteur, capable de voyager entre les mondes du Cosmere. Maîtrisez la magie de Scadrial et Roshar pour révéler votre véritable destin.',
  },
  2: {
    name: 'Acte II — Les Éclats',
    subtitle: 'La chasse aux fragments',
    description: 'Un Éclat a été brisé et ses fragments corrompent les mondes. Traversez Taldain, Komashi, Nalthis et Sel pour récupérer les fragments avant qu\'il ne soit trop tard.',
  },
  3: {
    name: 'Acte III — Convergence',
    subtitle: 'La confrontation finale',
    description: 'Les mondes fusionnent dans Shadesmar. Affrontez la source de la corruption et décidez du sort du Cosmere tout entier.',
  },
};

// ─── Class-Specific Side Quests ──────────────────────────────────
// These quests are only available to the matching class.

const CLASS_SIDE_QUESTS: Record<ChampionClass, Quest[]> = {
  mistborn: [
    {
      id: 'class_mistborn_1', name: 'L\'Héritage du Survivant',
      description: 'Kelsier a laissé une cache secrète de métaux dans les catacombes de Luthadel. Retrouvez-la et maîtrisez les 8 métaux de base.',
      worldID: 'scadrial', type: 'side', actNumber: 1, requiredLevel: 2, requiredQuestID: 'scadrial_main_1',
      objectives: [
        { id: 'cm1_1', description: 'Explorer les catacombes', type: 'explore', targetID: 'scadrial_catacombs', requiredCount: 1, currentCount: 0 },
        { id: 'cm1_2', description: 'Collecter les fioles de métaux', type: 'collect', targetID: 'metal_vial_set', requiredCount: 4, currentCount: 0 },
      ],
      rewards: { xp: 150, gold: 80, itemIDs: ['allomantic_belt'] }, status: 'available',
    },
    {
      id: 'class_mistborn_2', name: 'Le Puits de l\'Ascension',
      description: 'Les brumes s\'épaississent. Un ancien allomancien vous confie que le Puits appelle. Brûlez du cuivre pour déchiffrer les coordonnées.',
      worldID: 'scadrial', type: 'side', actNumber: 2, requiredLevel: 6, requiredQuestID: 'class_mistborn_1',
      objectives: [
        { id: 'cm2_1', description: 'Vaincre les gardiens des brumes', type: 'kill', targetID: 'mist_guardian', requiredCount: 5, currentCount: 0 },
        { id: 'cm2_2', description: 'Atteindre le Puits de l\'Ascension', type: 'explore', targetID: 'scadrial_well', requiredCount: 1, currentCount: 0 },
      ],
      rewards: { xp: 300, gold: 150, itemIDs: ['mist_cloak'] }, status: 'locked',
    },
  ],
  radiant: [
    {
      id: 'class_radiant_1', name: 'Le Lien du Spren',
      description: 'Votre spren vous pousse à explorer les ruines de Natanatan. Renforcez votre lien en prononçant les Idéaux perdus.',
      worldID: 'roshar', type: 'side', actNumber: 1, requiredLevel: 2, requiredQuestID: 'roshar_main_1',
      objectives: [
        { id: 'cr1_1', description: 'Méditer aux Ruines de Natanatan', type: 'explore', targetID: 'roshar_natanatan', requiredCount: 1, currentCount: 0 },
        { id: 'cr1_2', description: 'Vaincre les sprens corrompus', type: 'kill', targetID: 'corrupted_spren', requiredCount: 4, currentCount: 0 },
      ],
      rewards: { xp: 150, gold: 80, itemIDs: ['stormlight_sphere'] }, status: 'available',
    },
    {
      id: 'class_radiant_2', name: 'Les Plaines Brisées',
      description: 'Un plateau de gemcœur a été repéré dans les Plaines Brisées. Affrontez les Parshendis pour le récupérer.',
      worldID: 'roshar', type: 'side', actNumber: 2, requiredLevel: 6, requiredQuestID: 'class_radiant_1',
      objectives: [
        { id: 'cr2_1', description: 'Traverser les Plaines Brisées', type: 'explore', targetID: 'roshar_shattered_plains', requiredCount: 1, currentCount: 0 },
        { id: 'cr2_2', description: 'Vaincre le champion Parshendi', type: 'defeat', targetID: 'parshendi_champion', requiredCount: 1, currentCount: 0 },
      ],
      rewards: { xp: 300, gold: 150, itemIDs: ['shardblade_shard'] }, status: 'locked',
    },
  ],
  awakener: [
    {
      id: 'class_awakener_1', name: 'Couleurs Vivantes',
      description: 'Un maître de T\'Telir cherche un apprenti pour apprendre l\'art d\'éveiller les objets. Collectez des Souffles dans les marchés.',
      worldID: 'nalthis', type: 'side', actNumber: 1, requiredLevel: 2, requiredQuestID: 'nalthis_main_1',
      objectives: [
        { id: 'ca1_1', description: 'Parler au maître Éveilleur', type: 'talkTo', targetID: 'awakener_master', requiredCount: 1, currentCount: 0 },
        { id: 'ca1_2', description: 'Collecter des Souffles', type: 'collect', targetID: 'breath_essence', requiredCount: 5, currentCount: 0 },
      ],
      rewards: { xp: 150, gold: 80, itemIDs: ['chromatic_cloak'] }, status: 'available',
    },
    {
      id: 'class_awakener_2', name: 'Le Tonnerre Noir',
      description: 'L\'épée Tonnerre Noir a été aperçue. Retrouvez cet artefact avant qu\'il ne tombe en de mauvaises mains.',
      worldID: 'nalthis', type: 'side', actNumber: 2, requiredLevel: 6, requiredQuestID: 'class_awakener_1',
      objectives: [
        { id: 'ca2_1', description: 'Traquer les voleurs de Souffle', type: 'kill', targetID: 'breath_thief', requiredCount: 4, currentCount: 0 },
        { id: 'ca2_2', description: 'Retrouver le Tonnerre Noir', type: 'collect', targetID: 'nightblood_shard', requiredCount: 1, currentCount: 0 },
      ],
      rewards: { xp: 300, gold: 150, itemIDs: ['awakened_blade'] }, status: 'locked',
    },
  ],
  elantrian: [
    {
      id: 'class_elantrian_1', name: 'Les Aons Perdus',
      description: 'Trois Aons anciens ont été effacés des murs d\'Elantris. Parcourez la cité pour les retrouver et restaurer le Dor.',
      worldID: 'sel', type: 'side', actNumber: 1, requiredLevel: 2, requiredQuestID: 'sel_main_1',
      objectives: [
        { id: 'ce1_1', description: 'Retrouver les glyphes effacés', type: 'collect', targetID: 'lost_aon', requiredCount: 3, currentCount: 0 },
        { id: 'ce1_2', description: 'Purifier l\'Aon corrompu', type: 'defeat', targetID: 'corrupted_seon', requiredCount: 1, currentCount: 0 },
      ],
      rewards: { xp: 150, gold: 80, itemIDs: ['aon_scroll'] }, status: 'available',
    },
    {
      id: 'class_elantrian_2', name: 'Le Dor Déchaîné',
      description: 'Le Dor afflue de façon incontrôlée. Sceller les fissures dimensionnelles avant qu\'Elantris ne soit engloutie.',
      worldID: 'sel', type: 'side', actNumber: 2, requiredLevel: 6, requiredQuestID: 'class_elantrian_1',
      objectives: [
        { id: 'ce2_1', description: 'Sceller les fissures du Dor', type: 'explore', targetID: 'sel_rift', requiredCount: 3, currentCount: 0 },
        { id: 'ce2_2', description: 'Vaincre l\'entité du Dor', type: 'defeat', targetID: 'dor_entity', requiredCount: 1, currentCount: 0 },
      ],
      rewards: { xp: 300, gold: 150, itemIDs: ['dor_staff'] }, status: 'locked',
    },
  ],
  sandMaster: [
    {
      id: 'class_sandmaster_1', name: 'Les Sables de la Maîtrise',
      description: 'Les aînés vous testent : traversez le Désert de Kerzt seul et prouvez votre contrôle du sable en affrontant les créatures des dunes.',
      worldID: 'taldain', type: 'side', actNumber: 1, requiredLevel: 2, requiredQuestID: 'taldain_main_1',
      objectives: [
        { id: 'cs1_1', description: 'Traverser le Désert de Kerzt', type: 'explore', targetID: 'taldain_kerzt', requiredCount: 1, currentCount: 0 },
        { id: 'cs1_2', description: 'Vaincre les vers des sables', type: 'kill', targetID: 'sand_worm', requiredCount: 3, currentCount: 0 },
      ],
      rewards: { xp: 150, gold: 80, itemIDs: ['sand_whip'] }, status: 'available',
    },
    {
      id: 'class_sandmaster_2', name: 'L\'Oasis Cachée',
      description: 'Une source d\'eau ancienne se cache sous les dunes. Trouvez-la pour restaurer vos pouvoirs au maximum.',
      worldID: 'taldain', type: 'side', actNumber: 2, requiredLevel: 6, requiredQuestID: 'class_sandmaster_1',
      objectives: [
        { id: 'cs2_1', description: 'Trouver l\'oasis cachée', type: 'explore', targetID: 'taldain_oasis', requiredCount: 1, currentCount: 0 },
        { id: 'cs2_2', description: 'Purifier la source', type: 'defeat', targetID: 'sand_guardian', requiredCount: 1, currentCount: 0 },
      ],
      rewards: { xp: 300, gold: 150, itemIDs: ['enchanted_gourd'] }, status: 'locked',
    },
  ],
  nightmarePainter: [
    {
      id: 'class_painter_1', name: 'Encre et Cauchemars',
      description: 'Les cauchemars envahissent la ville de Kilahito. Utilisez votre don de peintre pour les capturer avant qu\'ils ne prennent forme physique.',
      worldID: 'komashi', type: 'side', actNumber: 1, requiredLevel: 2, requiredQuestID: 'komashi_main_1',
      objectives: [
        { id: 'cp1_1', description: 'Capturer les cauchemars errants', type: 'kill', targetID: 'nightmare_shade', requiredCount: 5, currentCount: 0 },
        { id: 'cp1_2', description: 'Parler au Peintre aîné', type: 'talkTo', targetID: 'elder_painter', requiredCount: 1, currentCount: 0 },
      ],
      rewards: { xp: 150, gold: 80, itemIDs: ['nightmare_brush'] }, status: 'available',
    },
    {
      id: 'class_painter_2', name: 'Le Cauchemar Éternel',
      description: 'Un cauchemar ancien menace de consumer tout Kilahito. Seul un vrai Peintre peut le bannir définitivement.',
      worldID: 'komashi', type: 'side', actNumber: 2, requiredLevel: 6, requiredQuestID: 'class_painter_1',
      objectives: [
        { id: 'cp2_1', description: 'Affronter le Cauchemar Éternel', type: 'defeat', targetID: 'eternal_nightmare', requiredCount: 1, currentCount: 0 },
        { id: 'cp2_2', description: 'Collecter l\'encre de bannissement', type: 'collect', targetID: 'banishment_ink', requiredCount: 3, currentCount: 0 },
      ],
      rewards: { xp: 300, gold: 150, itemIDs: ['ancestral_brush'] }, status: 'locked',
    },
  ],
};

export class QuestManager {
  private static _instance: QuestManager;
  static get shared(): QuestManager {
    if (!this._instance) this._instance = new QuestManager();
    return this._instance;
  }

  // Active quest states (persisted via save)
  private questStates: Map<string, QuestState> = new Map();

  // Load quest progress from champion data
  init(): void {
    const champ = GameManager.shared.champion;
    if (!champ) return;

    // Register class-specific quests into gameData so they're findable by ID
    const classQuests = CLASS_SIDE_QUESTS[champ.championClass] ?? [];
    for (const quest of classQuests) {
      if (!gameData.quests.has(quest.id)) {
        gameData.quests.set(quest.id, quest);
      }
    }

    // Load saved quest states
    const saved = localStorage.getItem('cosmere_quest_states');
    if (saved) {
      const arr: QuestState[] = JSON.parse(saved);
      for (const qs of arr) this.questStates.set(qs.questID, qs);
    }

    // Auto-activate first available quest per world if none active
    if (champ.activeQuestIDs.length === 0) {
      const firstQuest = this.getAvailableQuests()[0];
      if (firstQuest) {
        this.acceptQuest(firstQuest.id);
      }
    }
  }

  save(): void {
    const arr = Array.from(this.questStates.values());
    localStorage.setItem('cosmere_quest_states', JSON.stringify(arr));
  }

  // Get current narrative act based on quest progress
  getCurrentAct(): number {
    const champ = GameManager.shared.champion;
    if (!champ) return 1;
    // Check completed quests to determine highest act reached
    let maxAct = 1;
    for (const qid of champ.completedQuestIDs) {
      const quest = gameData.quest(qid);
      if (quest && quest.actNumber > maxAct) maxAct = quest.actNumber;
    }
    // Also check active quests
    for (const qid of champ.activeQuestIDs) {
      const quest = gameData.quest(qid);
      if (quest && quest.actNumber > maxAct) maxAct = quest.actNumber;
    }
    return maxAct;
  }

  // Get all quests organized by act for the journal
  getQuestJournal(): Array<{
    act: number;
    actName: string;
    quests: Array<{
      quest: Quest;
      status: 'completed' | 'active' | 'available' | 'locked';
      progress?: QuestState;
    }>;
  }> {
    const champ = GameManager.shared.champion;
    if (!champ) return [];

    const acts: Map<number, Array<{
      quest: Quest;
      status: 'completed' | 'active' | 'available' | 'locked';
      progress?: QuestState;
    }>> = new Map();

    gameData.quests.forEach((quest) => {
      const act = quest.actNumber ?? 1;
      if (!acts.has(act)) acts.set(act, []);

      let status: 'completed' | 'active' | 'available' | 'locked';
      if (champ.completedQuestIDs.includes(quest.id)) {
        status = 'completed';
      } else if (champ.activeQuestIDs.includes(quest.id)) {
        status = 'active';
      } else if (
        quest.requiredLevel <= champ.level &&
        (!quest.requiredQuestID || champ.completedQuestIDs.includes(quest.requiredQuestID))
      ) {
        status = 'available';
      } else {
        status = 'locked';
      }

      acts.get(act)!.push({
        quest,
        status,
        progress: this.questStates.get(quest.id),
      });
    });

    const result: Array<{
      act: number;
      actName: string;
      quests: Array<{
        quest: Quest;
        status: 'completed' | 'active' | 'available' | 'locked';
        progress?: QuestState;
      }>;
    }> = [];

    for (const [act, quests] of Array.from(acts.entries()).sort((a, b) => a[0] - b[0])) {
      // Sort: main first, then side, then hidden; within same type sort by level
      quests.sort((a, b) => {
        const typeOrder: Record<string, number> = { main: 0, side: 1, hidden: 2 };
        const ta = typeOrder[a.quest.type] ?? 1;
        const tb = typeOrder[b.quest.type] ?? 1;
        if (ta !== tb) return ta - tb;
        return a.quest.requiredLevel - b.quest.requiredLevel;
      });
      result.push({
        act,
        actName: ACT_INFO[act]?.name ?? `Acte ${act}`,
        quests,
      });
    }
    return result;
  }

  // Get main quest progress summary
  getProgressSummary(): { totalMain: number; completedMain: number; totalSide: number; completedSide: number; totalHidden: number; completedHidden: number } {
    const champ = GameManager.shared.champion;
    if (!champ) return { totalMain: 0, completedMain: 0, totalSide: 0, completedSide: 0, totalHidden: 0, completedHidden: 0 };

    let totalMain = 0, completedMain = 0, totalSide = 0, completedSide = 0, totalHidden = 0, completedHidden = 0;
    gameData.quests.forEach((quest) => {
      const done = champ.completedQuestIDs.includes(quest.id);
      switch (quest.type) {
        case 'main': totalMain++; if (done) completedMain++; break;
        case 'side': totalSide++; if (done) completedSide++; break;
        case 'hidden': totalHidden++; if (done) completedHidden++; break;
      }
    });
    return { totalMain, completedMain, totalSide, completedSide, totalHidden, completedHidden };
  }

  // Get quests available to accept (meet level/prereqs, not already active/completed)
  // Prioritized by class: class-specific quests first, then quests from the player's starting world, then others
  getAvailableQuests(): Array<Quest> {
    const champ = GameManager.shared.champion;
    if (!champ) return [];

    const isAvailable = (quest: Quest): boolean => {
      if (champ.completedQuestIDs.includes(quest.id)) return false;
      if (champ.activeQuestIDs.includes(quest.id)) return false;
      if (quest.requiredLevel > champ.level) return false;
      if (quest.requiredQuestID && !champ.completedQuestIDs.includes(quest.requiredQuestID)) return false;
      return true;
    };

    const available: Quest[] = [];

    // Add class-specific side quests
    const classQuests = CLASS_SIDE_QUESTS[champ.championClass] ?? [];
    for (const quest of classQuests) {
      if (isAvailable(quest)) available.push(quest);
    }

    // Add regular quests from data
    gameData.quests.forEach((quest) => {
      if (isAvailable(quest)) available.push(quest);
    });

    // Sort: main quests first, then class-specific side quests, then other side quests
    // Within same priority, prefer quests from the player's starting world
    const startingWorld = CLASS_INFO[champ.championClass]?.startingWorld ?? 'scadrial';
    available.sort((a, b) => {
      // Main quests always first
      const typeOrder = (q: Quest) => q.type === 'main' ? 0 : q.id.startsWith('class_') ? 1 : 2;
      const ta = typeOrder(a);
      const tb = typeOrder(b);
      if (ta !== tb) return ta - tb;
      // Prefer quests from starting world
      const wa = a.worldID === startingWorld ? 0 : 1;
      const wb = b.worldID === startingWorld ? 0 : 1;
      if (wa !== wb) return wa - wb;
      // Then by level
      return a.requiredLevel - b.requiredLevel;
    });

    return available;
  }

  // Get active quests with progress
  getActiveQuests(): Array<{ quest: NonNullable<ReturnType<typeof gameData.quest>>; state: QuestState }> {
    const champ = GameManager.shared.champion;
    if (!champ) return [];

    const active: Array<{ quest: NonNullable<ReturnType<typeof gameData.quest>>; state: QuestState }> = [];
    for (const qid of champ.activeQuestIDs) {
      const quest = gameData.quest(qid);
      if (!quest) continue;
      let state = this.questStates.get(qid);
      if (!state) {
        state = { questID: qid, objectiveProgress: {}, completed: false };
        for (const obj of quest.objectives) {
          state.objectiveProgress[obj.id] = 0;
        }
        this.questStates.set(qid, state);
      }
      active.push({ quest, state });
    }
    return active;
  }

  acceptQuest(questID: string): boolean {
    const champ = GameManager.shared.champion;
    if (!champ) return false;
    const quest = gameData.quest(questID);
    if (!quest) return false;

    if (champ.activeQuestIDs.includes(questID)) return false;

    champ.activeQuestIDs.push(questID);
    const state: QuestState = { questID, objectiveProgress: {}, completed: false };
    for (const obj of quest.objectives) {
      state.objectiveProgress[obj.id] = 0;
    }
    this.questStates.set(questID, state);
    this.save();
    return true;
  }

  // Called when player kills an enemy
  onEnemyKilled(enemyID: string): void {
    this.progressObjectives('kill', enemyID);
    // Boss kills also progress 'defeat' objectives
    this.progressObjectives('defeat', enemyID);
  }

  // Called when player collects an item
  onItemCollected(itemID: string): void {
    this.progressObjectives('collect', itemID);
  }

  // Called when player talks to NPC
  onNPCTalkedTo(npcID: string): void {
    this.progressObjectives('talkTo', npcID);
  }

  // Called when player enters a zone
  onZoneEntered(zoneID: string): void {
    this.progressObjectives('explore', zoneID);
  }

  // Called when escorting completes
  onEscortComplete(npcID: string): void {
    this.progressObjectives('escort', npcID);
  }

  private progressObjectives(type: string, targetID: string): void {
    const champ = GameManager.shared.champion;
    if (!champ) return;

    for (const qid of champ.activeQuestIDs) {
      const quest = gameData.quest(qid);
      if (!quest) continue;
      const state = this.questStates.get(qid);
      if (!state || state.completed) continue;

      for (const obj of quest.objectives) {
        if (obj.type === type && obj.targetID === targetID) {
          const current = state.objectiveProgress[obj.id] ?? 0;
          if (current < obj.requiredCount) {
            state.objectiveProgress[obj.id] = current + 1;
          }
        }
      }
    }
    this.save();
  }

  // Check if a quest is fully completed
  checkQuestCompletion(questID: string): boolean {
    const quest = gameData.quest(questID);
    if (!quest) return false;
    const state = this.questStates.get(questID);
    if (!state || state.completed) return false;

    for (const obj of quest.objectives) {
      const progress = state.objectiveProgress[obj.id] ?? 0;
      if (progress < obj.requiredCount) return false;
    }
    return true;
  }

  // Complete quest and grant rewards
  completeQuest(questID: string): { xp: number; gold: number; items: string[]; actChanged: boolean; newAct: number } | null {
    const champ = GameManager.shared.champion;
    if (!champ) return null;
    const quest = gameData.quest(questID);
    if (!quest) return null;
    const state = this.questStates.get(questID);
    if (!state) return null;

    const oldAct = this.getCurrentAct();
    state.completed = true;

    // Remove from active, add to completed
    champ.activeQuestIDs = champ.activeQuestIDs.filter(id => id !== questID);
    champ.completedQuestIDs.push(questID);

    // Grant rewards
    const rewards = quest.rewards;
    const xp = rewards.xp ?? 0;
    const gold = rewards.gold ?? 0;
    const items = rewards.itemIDs ?? [];

    champ.gold += gold;
    GameManager.shared.grantXP(xp);
    for (const itemID of items) {
      champ.inventoryItemIDs.push(itemID);
    }

    this.save();

    const newAct = this.getCurrentAct();

    // Auto-accept next available quest
    const next = this.getAvailableQuests()[0];
    if (next) this.acceptQuest(next.id);

    return { xp, gold, items, actChanged: newAct > oldAct, newAct };
  }
}
