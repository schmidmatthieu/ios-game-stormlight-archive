// ─── NPC Relationship System ─────────────────────────────────

export type RelationshipLevel = 'stranger' | 'acquaintance' | 'friend' | 'trusted' | 'bonded';

const LEVEL_ORDER: RelationshipLevel[] = ['stranger', 'acquaintance', 'friend', 'trusted', 'bonded'];
const LEVEL_THRESHOLDS = [0, 10, 30, 60, 100];

export const LEVEL_LABELS: Record<RelationshipLevel, string> = {
  stranger: 'Étranger',
  acquaintance: 'Connaissance',
  friend: 'Ami',
  trusted: 'Confiance',
  bonded: 'Lié',
};

export const LEVEL_COLORS: Record<RelationshipLevel, number> = {
  stranger: 0x666677,
  acquaintance: 0x5588aa,
  friend: 0x44aa66,
  trusted: 0xaaaa44,
  bonded: 0xffaa44,
};

export interface NPCRelationship {
  npcID: string;
  npcName: string;
  worldID: string;
  affinity: number; // 0-100
  timesSpokenTo: number;
  questsCompletedFor: number;
  giftsGiven: number;
  lastInteraction: number; // timestamp
}

// Bonuses from relationship levels
export interface RelationshipBonus {
  level: RelationshipLevel;
  shopDiscount: number; // % off shop prices
  questXPBonus: number; // % extra XP from their quests
  exclusiveDialogue: boolean;
  giftAvailable: boolean;
}

function getBonusForLevel(level: RelationshipLevel): RelationshipBonus {
  switch (level) {
    case 'stranger': return { level, shopDiscount: 0, questXPBonus: 0, exclusiveDialogue: false, giftAvailable: false };
    case 'acquaintance': return { level, shopDiscount: 5, questXPBonus: 5, exclusiveDialogue: false, giftAvailable: false };
    case 'friend': return { level, shopDiscount: 10, questXPBonus: 10, exclusiveDialogue: true, giftAvailable: false };
    case 'trusted': return { level, shopDiscount: 15, questXPBonus: 20, exclusiveDialogue: true, giftAvailable: true };
    case 'bonded': return { level, shopDiscount: 25, questXPBonus: 30, exclusiveDialogue: true, giftAvailable: true };
  }
}

// ─── NPC Relationship Manager ────────────────────────────────

const STORAGE_KEY = 'cosmere_npc_relationships';

export class NPCRelationshipManager {
  private static _instance: NPCRelationshipManager;
  static get shared(): NPCRelationshipManager {
    if (!this._instance) this._instance = new NPCRelationshipManager();
    return this._instance;
  }

  relationships: Map<string, NPCRelationship> = new Map();
  private pendingLevelUps: { npcName: string; level: RelationshipLevel }[] = [];

  private getOrCreate(npcID: string, npcName: string, worldID: string): NPCRelationship {
    if (!this.relationships.has(npcID)) {
      this.relationships.set(npcID, {
        npcID,
        npcName,
        worldID,
        affinity: 0,
        timesSpokenTo: 0,
        questsCompletedFor: 0,
        giftsGiven: 0,
        lastInteraction: Date.now(),
      });
    }
    return this.relationships.get(npcID)!;
  }

  getLevel(npcID: string): RelationshipLevel {
    const rel = this.relationships.get(npcID);
    if (!rel) return 'stranger';
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (rel.affinity >= LEVEL_THRESHOLDS[i]) return LEVEL_ORDER[i];
    }
    return 'stranger';
  }

  getBonus(npcID: string): RelationshipBonus {
    return getBonusForLevel(this.getLevel(npcID));
  }

  // Record a conversation
  recordTalk(npcID: string, npcName: string, worldID: string): void {
    const rel = this.getOrCreate(npcID, npcName, worldID);
    const prevLevel = this.getLevel(npcID);
    rel.timesSpokenTo++;
    rel.affinity = Math.min(100, rel.affinity + 3);
    rel.lastInteraction = Date.now();
    this.checkLevelUp(npcID, prevLevel);
  }

  // Record a quest completion for this NPC
  recordQuestComplete(npcID: string, npcName: string, worldID: string): void {
    const rel = this.getOrCreate(npcID, npcName, worldID);
    const prevLevel = this.getLevel(npcID);
    rel.questsCompletedFor++;
    rel.affinity = Math.min(100, rel.affinity + 10);
    rel.lastInteraction = Date.now();
    this.checkLevelUp(npcID, prevLevel);
  }

  // Record giving a gift (spending gold to increase affinity)
  recordGift(npcID: string, npcName: string, worldID: string, goldSpent: number): void {
    const rel = this.getOrCreate(npcID, npcName, worldID);
    const prevLevel = this.getLevel(npcID);
    rel.giftsGiven++;
    const affinityGain = Math.min(15, Math.floor(goldSpent / 10));
    rel.affinity = Math.min(100, rel.affinity + affinityGain);
    rel.lastInteraction = Date.now();
    this.checkLevelUp(npcID, prevLevel);
  }

  private checkLevelUp(npcID: string, prevLevel: RelationshipLevel): void {
    const newLevel = this.getLevel(npcID);
    if (LEVEL_ORDER.indexOf(newLevel) > LEVEL_ORDER.indexOf(prevLevel)) {
      const rel = this.relationships.get(npcID);
      if (rel) {
        this.pendingLevelUps.push({ npcName: rel.npcName, level: newLevel });
      }
    }
  }

  popLevelUp(): { npcName: string; level: RelationshipLevel } | null {
    return this.pendingLevelUps.shift() ?? null;
  }

  getAll(): NPCRelationship[] {
    return Array.from(this.relationships.values()).sort((a, b) => b.affinity - a.affinity);
  }

  getByWorld(worldID: string): NPCRelationship[] {
    return this.getAll().filter(r => r.worldID === worldID);
  }

  getAffinityPercent(npcID: string): number {
    const rel = this.relationships.get(npcID);
    return rel ? rel.affinity : 0;
  }

  getNextLevelThreshold(npcID: string): number {
    const rel = this.relationships.get(npcID);
    if (!rel) return LEVEL_THRESHOLDS[1];
    for (const threshold of LEVEL_THRESHOLDS) {
      if (rel.affinity < threshold) return threshold;
    }
    return 100;
  }

  save(): void {
    const data = Array.from(this.relationships.entries());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  load(): void {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const data: [string, NPCRelationship][] = JSON.parse(raw);
      this.relationships = new Map(data);
    } catch { /* ignore */ }
  }
}
