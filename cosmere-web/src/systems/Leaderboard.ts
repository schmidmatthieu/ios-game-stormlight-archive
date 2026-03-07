// ─── Leaderboard System ──────────────────────────────────────────
// Local leaderboard with online-ready interface for future backend

import type { ChampionClass, WorldID } from '../data/types';

const STORAGE_KEY = 'cosmere_leaderboard';
const MAX_ENTRIES = 50;

// ─── Types ───────────────────────────────────────────────────────

export interface LeaderboardEntry {
  playerName: string;
  championClass: ChampionClass;
  level: number;
  score: number;
  worldsVisited: number;
  questsCompleted: number;
  enemiesKilled: number;
  ngPlusCycle: number;
  timestamp: number;
}

export type LeaderboardCategory = 'score' | 'level' | 'quests' | 'kills';

// ─── Score Calculation ───────────────────────────────────────────

export function calculateScore(data: {
  level: number;
  questsCompleted: number;
  enemiesKilled: number;
  gold: number;
  worldsVisited: number;
  ngPlusCycle: number;
  hiddenQuestsCompleted: number;
  bossesDefeated: number;
}): number {
  return (
    data.level * 100 +
    data.questsCompleted * 50 +
    data.enemiesKilled * 5 +
    Math.floor(data.gold / 10) +
    data.worldsVisited * 200 +
    data.ngPlusCycle * 500 +
    data.hiddenQuestsCompleted * 150 +
    data.bossesDefeated * 300
  );
}

// ─── Manager ─────────────────────────────────────────────────────

export class LeaderboardManager {
  static shared = new LeaderboardManager();

  private entries: LeaderboardEntry[] = [];

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) this.entries = JSON.parse(raw);
    } catch { /* ignore */ }
  }

  private save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.entries));
  }

  /** Submit a new score */
  submit(entry: LeaderboardEntry): { rank: number; isNewBest: boolean } {
    this.entries.push(entry);
    this.entries.sort((a, b) => b.score - a.score);
    if (this.entries.length > MAX_ENTRIES) {
      this.entries = this.entries.slice(0, MAX_ENTRIES);
    }
    this.save();

    const rank = this.entries.findIndex(e => e === entry) + 1;
    const isNewBest = rank === 1;
    return { rank, isNewBest };
  }

  /** Get top entries */
  getTop(count: number = 10, category: LeaderboardCategory = 'score'): LeaderboardEntry[] {
    const sorted = [...this.entries];
    switch (category) {
      case 'level': sorted.sort((a, b) => b.level - a.level); break;
      case 'quests': sorted.sort((a, b) => b.questsCompleted - a.questsCompleted); break;
      case 'kills': sorted.sort((a, b) => b.enemiesKilled - a.enemiesKilled); break;
      default: sorted.sort((a, b) => b.score - a.score); break;
    }
    return sorted.slice(0, count);
  }

  /** Get player's best score */
  getPersonalBest(playerName: string): LeaderboardEntry | null {
    const entries = this.entries
      .filter(e => e.playerName === playerName)
      .sort((a, b) => b.score - a.score);
    return entries[0] ?? null;
  }

  /** Get rank for a given score */
  getRank(score: number): number {
    return this.entries.filter(e => e.score > score).length + 1;
  }

  /** Get total number of entries */
  get totalEntries(): number { return this.entries.length; }

  /** Clear all entries */
  reset(): void {
    this.entries = [];
    localStorage.removeItem(STORAGE_KEY);
  }
}
