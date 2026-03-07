import { GameManager } from './GameManager';
import { gameData } from '../data/DataLoader';

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

  // Get quests available to accept (meet level/prereqs, not already active/completed)
  getAvailableQuests(): Array<{ id: string; name: string; description: string; worldID: string; type: string; requiredLevel: number }> {
    const champ = GameManager.shared.champion;
    if (!champ) return [];

    const available: Array<{ id: string; name: string; description: string; worldID: string; type: string; requiredLevel: number }> = [];
    gameData.quests.forEach((quest) => {
      if (champ.completedQuestIDs.includes(quest.id)) return;
      if (champ.activeQuestIDs.includes(quest.id)) return;
      if (quest.requiredLevel > champ.level) return;
      if (quest.requiredQuestID && !champ.completedQuestIDs.includes(quest.requiredQuestID)) return;
      available.push(quest);
    });
    return available;
  }

  // Get active quests with progress
  getActiveQuests(): Array<{ quest: ReturnType<typeof gameData.quest>; state: QuestState }> {
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
  completeQuest(questID: string): { xp: number; gold: number; items: string[] } | null {
    const champ = GameManager.shared.champion;
    if (!champ) return null;
    const quest = gameData.quest(questID);
    if (!quest) return null;
    const state = this.questStates.get(questID);
    if (!state) return null;

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

    // Auto-accept next available quest
    const next = this.getAvailableQuests()[0];
    if (next) this.acceptQuest(next.id);

    return { xp, gold, items };
  }
}
