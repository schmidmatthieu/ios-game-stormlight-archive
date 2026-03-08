import { GameManager } from './GameManager';
import { gameData } from '../data/DataLoader';
import { CLASS_INFO } from '../data/types';
import type { Quest, ChampionClass } from '../data/types';
import { ACT_INFO, CLASS_SIDE_QUESTS } from './ClassQuestData';

export { ACT_INFO };

export interface QuestState {
  questID: string;
  objectiveProgress: Record<string, number>; // objectiveID -> currentCount
  completed: boolean;
}

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

    // Auto-activate available quests if none active
    if (champ.activeQuestIDs.length === 0) {
      this.acceptAllAvailable();
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

  /** Maximum number of simultaneously active quests */
  static readonly MAX_ACTIVE_QUESTS = 10;

  acceptQuest(questID: string): boolean {
    const champ = GameManager.shared.champion;
    if (!champ) return false;
    const quest = gameData.quest(questID);
    if (!quest) return false;

    if (champ.activeQuestIDs.includes(questID)) return false;
    if (champ.activeQuestIDs.length >= QuestManager.MAX_ACTIVE_QUESTS) return false;

    champ.activeQuestIDs.push(questID);
    const state: QuestState = { questID, objectiveProgress: {}, completed: false };
    for (const obj of quest.objectives) {
      state.objectiveProgress[obj.id] = 0;
    }
    this.questStates.set(questID, state);
    this.save();
    return true;
  }

  /** Abandon an active quest (resets progress) */
  abandonQuest(questID: string): boolean {
    const champ = GameManager.shared.champion;
    if (!champ) return false;
    if (!champ.activeQuestIDs.includes(questID)) return false;

    champ.activeQuestIDs = champ.activeQuestIDs.filter(id => id !== questID);
    this.questStates.delete(questID);
    this.save();
    return true;
  }

  /** Auto-accept all available quests up to the max limit */
  acceptAllAvailable(): number {
    const available = this.getAvailableQuests();
    let accepted = 0;
    for (const quest of available) {
      if (this.acceptQuest(quest.id)) accepted++;
    }
    return accepted;
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

    // Auto-accept available quests (up to limit)
    this.acceptAllAvailable();

    return { xp, gold, items, actChanged: newAct > oldAct, newAct };
  }
}
