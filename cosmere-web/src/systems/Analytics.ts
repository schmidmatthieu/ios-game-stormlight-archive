// ─── Analytics Tracker ───────────────────────────────────────────
// Tracks player behavior for balancing: deaths, zone time, skill usage, etc.

const STORAGE_KEY = 'cosmere_analytics';

// ─── Types ───────────────────────────────────────────────────────

export interface AnalyticsData {
  // Session tracking
  totalPlayTime: number;       // seconds
  sessionCount: number;
  lastSessionDate: string;

  // Deaths
  deaths: DeathRecord[];
  deathsByZone: Record<string, number>;
  deathsByEnemy: Record<string, number>;
  deathsByLevel: Record<number, number>;

  // Combat
  totalDamageDealt: number;
  totalDamageTaken: number;
  totalKills: number;
  killsByTier: Record<string, number>;
  skillUsage: Record<string, number>;    // skillID → use count
  mostUsedSkill: string;

  // Progression
  timePerZone: Record<string, number>;   // zoneID → seconds spent
  zoneEntryCount: Record<string, number>;
  questCompletionTimes: Record<string, number>; // questID → seconds to complete
  levelUpTimes: number[];                // timestamp of each level up

  // Economy
  totalGoldEarned: number;
  totalGoldSpent: number;
  itemsLooted: number;
  potionsUsed: number;

  // Engagement
  longestSession: number;     // seconds
  longestKillStreak: number;
  highestCombo: number;
  zonesExplored: number;
  secretsFound: number;
}

interface DeathRecord {
  zoneID: string;
  enemyID: string;
  playerLevel: number;
  timestamp: number;
}

// ─── Default Data ───────────────────────────────────────────────

function createDefaultData(): AnalyticsData {
  return {
    totalPlayTime: 0, sessionCount: 0, lastSessionDate: '',
    deaths: [], deathsByZone: {}, deathsByEnemy: {}, deathsByLevel: {},
    totalDamageDealt: 0, totalDamageTaken: 0, totalKills: 0,
    killsByTier: {}, skillUsage: {}, mostUsedSkill: '',
    timePerZone: {}, zoneEntryCount: {}, questCompletionTimes: {},
    levelUpTimes: [],
    totalGoldEarned: 0, totalGoldSpent: 0, itemsLooted: 0, potionsUsed: 0,
    longestSession: 0, longestKillStreak: 0, highestCombo: 0,
    zonesExplored: 0, secretsFound: 0,
  };
}

// ─── Manager ─────────────────────────────────────────────────────

export class AnalyticsManager {
  static shared = new AnalyticsManager();

  private data: AnalyticsData;
  private sessionStart: number;
  private currentZone: string = '';
  private saveTimer: number = 0;

  constructor() {
    this.data = this.load();
    this.sessionStart = Date.now();
    this.data.sessionCount++;
    this.data.lastSessionDate = new Date().toISOString().slice(0, 10);
  }

  private load(): AnalyticsData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...createDefaultData(), ...JSON.parse(raw) };
    } catch { /* ignore */ }
    return createDefaultData();
  }

  private save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  /** Call every frame to track play time */
  update(dt: number): void {
    this.data.totalPlayTime += dt;
    if (this.currentZone) {
      this.data.timePerZone[this.currentZone] = (this.data.timePerZone[this.currentZone] ?? 0) + dt;
    }

    // Auto-save every 30 seconds
    this.saveTimer += dt;
    if (this.saveTimer > 30) {
      this.saveTimer = 0;
      const sessionLen = (Date.now() - this.sessionStart) / 1000;
      if (sessionLen > this.data.longestSession) this.data.longestSession = sessionLen;
      this.save();
    }
  }

  // ─── Events ──────────────────────────────────────────────────

  recordZoneEnter(zoneID: string): void {
    // Zone time is tracked via update() dt accumulation — no Date.now() delta needed
    this.currentZone = zoneID;
    this.data.zoneEntryCount[zoneID] = (this.data.zoneEntryCount[zoneID] ?? 0) + 1;
  }

  recordDeath(zoneID: string, enemyID: string, playerLevel: number): void {
    this.data.deaths.push({ zoneID, enemyID, playerLevel, timestamp: Date.now() });
    // Keep only last 100 deaths
    if (this.data.deaths.length > 100) this.data.deaths = this.data.deaths.slice(-100);
    this.data.deathsByZone[zoneID] = (this.data.deathsByZone[zoneID] ?? 0) + 1;
    this.data.deathsByEnemy[enemyID] = (this.data.deathsByEnemy[enemyID] ?? 0) + 1;
    this.data.deathsByLevel[playerLevel] = (this.data.deathsByLevel[playerLevel] ?? 0) + 1;
    this.save();
  }

  recordKill(enemyTier: string): void {
    this.data.totalKills++;
    this.data.killsByTier[enemyTier] = (this.data.killsByTier[enemyTier] ?? 0) + 1;
  }

  recordDamageDealt(amount: number): void { this.data.totalDamageDealt += amount; }
  recordDamageTaken(amount: number): void { this.data.totalDamageTaken += amount; }

  private mostUsedCount = 0;

  recordSkillUse(skillID: string): void {
    const newCount = (this.data.skillUsage[skillID] ?? 0) + 1;
    this.data.skillUsage[skillID] = newCount;
    // Incremental tracking: O(1) instead of O(n)
    if (newCount > this.mostUsedCount) {
      this.mostUsedCount = newCount;
      this.data.mostUsedSkill = skillID;
    }
  }

  recordLevelUp(): void { this.data.levelUpTimes.push(Date.now()); }
  recordGoldEarned(amount: number): void { this.data.totalGoldEarned += amount; }
  recordGoldSpent(amount: number): void { this.data.totalGoldSpent += amount; }
  recordItemLooted(): void { this.data.itemsLooted++; }
  recordPotionUsed(): void { this.data.potionsUsed++; }
  recordSecretFound(): void { this.data.secretsFound++; }
  recordKillStreak(streak: number): void {
    if (streak > this.data.longestKillStreak) this.data.longestKillStreak = streak;
  }
  recordCombo(combo: number): void {
    if (combo > this.data.highestCombo) this.data.highestCombo = combo;
  }
  recordQuestComplete(questID: string, timeTaken: number): void {
    this.data.questCompletionTimes[questID] = timeTaken;
  }

  // ─── Reports ─────────────────────────────────────────────────

  /** Get death hotspots (zones where player dies most) */
  getDeathHotspots(): { zoneID: string; count: number }[] {
    return Object.entries(this.data.deathsByZone)
      .map(([zoneID, count]) => ({ zoneID, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /** Get most dangerous enemies */
  getMostDangerousEnemies(): { enemyID: string; deaths: number }[] {
    return Object.entries(this.data.deathsByEnemy)
      .map(([enemyID, deaths]) => ({ enemyID, deaths }))
      .sort((a, b) => b.deaths - a.deaths)
      .slice(0, 10);
  }

  /** Get most popular skills */
  getSkillPopularity(): { skillID: string; uses: number }[] {
    return Object.entries(this.data.skillUsage)
      .map(([skillID, uses]) => ({ skillID, uses }))
      .sort((a, b) => b.uses - a.uses);
  }

  /** Get time spent per zone */
  getZoneTimeBreakdown(): { zoneID: string; seconds: number }[] {
    return Object.entries(this.data.timePerZone)
      .map(([zoneID, seconds]) => ({ zoneID, seconds }))
      .sort((a, b) => b.seconds - a.seconds);
  }

  /** Get summary stats */
  getSummary(): {
    playTimeHours: number;
    sessions: number;
    totalKills: number;
    totalDeaths: number;
    killDeathRatio: string;
    avgDamagePerKill: number;
    goldEarned: number;
  } {
    const totalDeaths = this.data.deaths.length;
    return {
      playTimeHours: Math.round(this.data.totalPlayTime / 3600 * 10) / 10,
      sessions: this.data.sessionCount,
      totalKills: this.data.totalKills,
      totalDeaths,
      killDeathRatio: totalDeaths > 0 ? (this.data.totalKills / totalDeaths).toFixed(1) : '∞',
      avgDamagePerKill: this.data.totalKills > 0
        ? Math.round(this.data.totalDamageDealt / this.data.totalKills) : 0,
      goldEarned: this.data.totalGoldEarned,
    };
  }

  /** Export raw data for debugging */
  exportData(): AnalyticsData {
    return { ...this.data };
  }

  reset(): void {
    this.data = createDefaultData();
    localStorage.removeItem(STORAGE_KEY);
  }
}
