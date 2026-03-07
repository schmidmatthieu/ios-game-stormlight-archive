// ─── Achievement Definitions ─────────────────────────────────

export type AchievementCategory = 'combat' | 'exploration' | 'collection' | 'mastery' | 'cosmere';

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  secret: boolean; // Hidden until unlocked
  condition: (stats: AchievementStats) => boolean;
}

export interface AchievementStats {
  totalKills: number;
  bossKills: number;
  eliteKills: number;
  zonesVisited: number;
  worldsVisited: number;
  questsCompleted: number;
  itemsCollected: number;
  goldEarned: number;
  totalXP: number;
  playerLevel: number;
  deathCount: number;
  skillsUsed: number;
  craftsCompleted: number;
  creaturesDiscovered: number;
  highstormsSurvived: number;
  maxCombo: number; // Enemies killed quickly in succession
}

// ─── Achievement Registry ────────────────────────────────────

const ACHIEVEMENTS: AchievementDef[] = [
  // Combat
  { id: 'first_blood', name: 'Premier Sang', description: 'Vaincre votre premier ennemi', icon: '⚔', category: 'combat', secret: false, condition: s => s.totalKills >= 1 },
  { id: 'warrior_10', name: 'Guerrier', description: 'Vaincre 10 ennemis', icon: '⚔', category: 'combat', secret: false, condition: s => s.totalKills >= 10 },
  { id: 'slayer_50', name: 'Pourfendeur', description: 'Vaincre 50 ennemis', icon: '🗡', category: 'combat', secret: false, condition: s => s.totalKills >= 50 },
  { id: 'champion_100', name: 'Champion du Cosmere', description: 'Vaincre 100 ennemis', icon: '🏆', category: 'combat', secret: false, condition: s => s.totalKills >= 100 },
  { id: 'elite_hunter', name: 'Chasseur d\'Élites', description: 'Vaincre 5 ennemis élites', icon: '◆', category: 'combat', secret: false, condition: s => s.eliteKills >= 5 },
  { id: 'boss_slayer', name: 'Tueur de Boss', description: 'Vaincre votre premier boss', icon: '★', category: 'combat', secret: false, condition: s => s.bossKills >= 1 },
  { id: 'boss_master', name: 'Maître des Boss', description: 'Vaincre 5 boss', icon: '👑', category: 'combat', secret: false, condition: s => s.bossKills >= 5 },

  // Exploration
  { id: 'explorer', name: 'Explorateur', description: 'Visiter 5 zones différentes', icon: '🗺', category: 'exploration', secret: false, condition: s => s.zonesVisited >= 5 },
  { id: 'worldhopper', name: 'Sauteur de Mondes', description: 'Visiter 3 mondes différents', icon: '🌍', category: 'exploration', secret: false, condition: s => s.worldsVisited >= 3 },
  { id: 'cosmere_traveler', name: 'Voyageur du Cosmere', description: 'Visiter tous les 7 mondes', icon: '✦', category: 'exploration', secret: false, condition: s => s.worldsVisited >= 7 },

  // Collection
  { id: 'collector', name: 'Collectionneur', description: 'Collecter 20 objets', icon: '🎒', category: 'collection', secret: false, condition: s => s.itemsCollected >= 20 },
  { id: 'hoarder', name: 'Accumulateur', description: 'Collecter 100 objets', icon: '💰', category: 'collection', secret: false, condition: s => s.itemsCollected >= 100 },
  { id: 'wealthy', name: 'Fortuné', description: 'Gagner 500 pièces d\'or', icon: '🪙', category: 'collection', secret: false, condition: s => s.goldEarned >= 500 },
  { id: 'bestiary_10', name: 'Naturaliste', description: 'Découvrir 10 créatures dans le bestiaire', icon: '📖', category: 'collection', secret: false, condition: s => s.creaturesDiscovered >= 10 },

  // Mastery
  { id: 'level_5', name: 'Apprenti', description: 'Atteindre le niveau 5', icon: '📈', category: 'mastery', secret: false, condition: s => s.playerLevel >= 5 },
  { id: 'level_10', name: 'Adepte', description: 'Atteindre le niveau 10', icon: '📈', category: 'mastery', secret: false, condition: s => s.playerLevel >= 10 },
  { id: 'quest_5', name: 'Quêteur', description: 'Compléter 5 quêtes', icon: '📜', category: 'mastery', secret: false, condition: s => s.questsCompleted >= 5 },
  { id: 'crafter', name: 'Artisan', description: 'Fabriquer 10 objets', icon: '🔨', category: 'mastery', secret: false, condition: s => s.craftsCompleted >= 10 },

  // Cosmere Secrets
  { id: 'survived_highstorm', name: 'Fils de l\'Orage', description: 'Survivre à 3 hautes tempêtes', icon: '⛈', category: 'cosmere', secret: true, condition: s => s.highstormsSurvived >= 3 },
  { id: 'died_once', name: 'La Mort n\'est pas la Fin', description: 'Mourir pour la première fois', icon: '💀', category: 'cosmere', secret: true, condition: s => s.deathCount >= 1 },
  { id: 'combo_5', name: 'Enchaînement Mortel', description: 'Enchaîner 5 éliminations rapidement', icon: '🔥', category: 'cosmere', secret: true, condition: s => s.maxCombo >= 5 },
];

// ─── Achievement Manager ─────────────────────────────────────

const STORAGE_KEY = 'cosmere_achievements';
const STATS_KEY = 'cosmere_achievement_stats';

export class AchievementManager {
  private static _instance: AchievementManager;
  static get shared(): AchievementManager {
    if (!this._instance) this._instance = new AchievementManager();
    return this._instance;
  }

  unlockedIDs: Set<string> = new Set();
  stats: AchievementStats = {
    totalKills: 0, bossKills: 0, eliteKills: 0,
    zonesVisited: 0, worldsVisited: 0,
    questsCompleted: 0, itemsCollected: 0,
    goldEarned: 0, totalXP: 0, playerLevel: 0,
    deathCount: 0, skillsUsed: 0, craftsCompleted: 0,
    creaturesDiscovered: 0, highstormsSurvived: 0, maxCombo: 0,
  };

  private pendingNotifications: AchievementDef[] = [];
  private visitedZones: Set<string> = new Set();
  private visitedWorlds: Set<string> = new Set();

  // Combo tracking
  private comboCount = 0;
  private comboTimer = 0;

  // Check all achievements and return newly unlocked ones
  check(): AchievementDef[] {
    const newlyUnlocked: AchievementDef[] = [];
    for (const ach of ACHIEVEMENTS) {
      if (this.unlockedIDs.has(ach.id)) continue;
      if (ach.condition(this.stats)) {
        this.unlockedIDs.add(ach.id);
        newlyUnlocked.push(ach);
        this.pendingNotifications.push(ach);
      }
    }
    return newlyUnlocked;
  }

  // Pop a pending notification (for UI display)
  popNotification(): AchievementDef | null {
    return this.pendingNotifications.shift() ?? null;
  }

  // Stat update helpers
  recordKill(tier: string): void {
    this.stats.totalKills++;
    if (tier === 'boss') this.stats.bossKills++;
    if (tier === 'elite') this.stats.eliteKills++;

    // Combo tracking
    this.comboCount++;
    this.comboTimer = 3; // 3 second window
    if (this.comboCount > this.stats.maxCombo) {
      this.stats.maxCombo = this.comboCount;
    }
  }

  updateCombo(dt: number): void {
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
      }
    }
  }

  recordZoneVisit(zoneID: string, worldID: string): void {
    this.visitedZones.add(zoneID);
    this.visitedWorlds.add(worldID);
    this.stats.zonesVisited = this.visitedZones.size;
    this.stats.worldsVisited = this.visitedWorlds.size;
  }

  recordDeath(): void { this.stats.deathCount++; }
  recordQuestComplete(): void { this.stats.questsCompleted++; }
  recordItemCollect(): void { this.stats.itemsCollected++; }
  recordGold(amount: number): void { this.stats.goldEarned += amount; }
  recordXP(amount: number): void { this.stats.totalXP += amount; }
  recordLevel(level: number): void { this.stats.playerLevel = level; }
  recordSkillUse(): void { this.stats.skillsUsed++; }
  recordCraft(): void { this.stats.craftsCompleted++; }
  recordCreatureDiscovered(count: number): void { this.stats.creaturesDiscovered = count; }
  recordHighstormSurvived(): void { this.stats.highstormsSurvived++; }

  // Get all achievements with unlock status
  getAll(): { def: AchievementDef; unlocked: boolean }[] {
    return ACHIEVEMENTS.map(def => ({
      def,
      unlocked: this.unlockedIDs.has(def.id),
    }));
  }

  getByCategory(category: AchievementCategory): { def: AchievementDef; unlocked: boolean }[] {
    return this.getAll().filter(a => a.def.category === category);
  }

  get totalUnlocked(): number { return this.unlockedIDs.size; }
  get totalAchievements(): number { return ACHIEVEMENTS.length; }

  // Persistence
  save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(this.unlockedIDs)));
    localStorage.setItem(STATS_KEY, JSON.stringify({
      stats: this.stats,
      visitedZones: Array.from(this.visitedZones),
      visitedWorlds: Array.from(this.visitedWorlds),
    }));
  }

  load(): void {
    const ids = localStorage.getItem(STORAGE_KEY);
    if (ids) {
      try { this.unlockedIDs = new Set(JSON.parse(ids)); } catch { /* ignore */ }
    }
    const statsRaw = localStorage.getItem(STATS_KEY);
    if (statsRaw) {
      try {
        const data = JSON.parse(statsRaw);
        this.stats = { ...this.stats, ...data.stats };
        this.visitedZones = new Set(data.visitedZones ?? []);
        this.visitedWorlds = new Set(data.visitedWorlds ?? []);
      } catch { /* ignore */ }
    }
  }
}
