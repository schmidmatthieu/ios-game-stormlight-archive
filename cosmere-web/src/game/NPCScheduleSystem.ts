// ─── NPC Dynamic Schedule System ─────────────────────────────────
// Makes NPCs move between locations based on time of day

import type { TimeOfDay } from '../rendering/DayNightCycle';
import type { GridPosition } from '../data/types';

// ─── Types ──────────────────────────────────────────────────────

export type NPCActivity = 'idle' | 'working' | 'walking' | 'sleeping' | 'shopping' | 'training' | 'praying' | 'socializing';

export interface NPCScheduleEntry {
  time: TimeOfDay;
  position: GridPosition;
  activity: NPCActivity;
  dialogue?: string; // override dialogue for this time slot
}

export interface NPCScheduleDef {
  npcID: string;
  worldID: string;
  zoneID: string;
  schedule: NPCScheduleEntry[];
  defaultActivity: NPCActivity;
}

// ─── Per-World NPC Schedules ─────────────────────────────────────

const NPC_SCHEDULES: NPCScheduleDef[] = [
  // ── Scadrial ──
  {
    npcID: 'kelsier_contact', worldID: 'scadrial', zoneID: 'luthadel_market',
    defaultActivity: 'idle',
    schedule: [
      { time: 'dawn', position: { col: 3, row: 5 }, activity: 'walking', dialogue: 'Les brumes se dissipent... bonne chasse aujourd\'hui.' },
      { time: 'morning', position: { col: 8, row: 4 }, activity: 'working', dialogue: 'Je surveille les mouvements des Obligateurs.' },
      { time: 'midday', position: { col: 12, row: 7 }, activity: 'shopping' },
      { time: 'afternoon', position: { col: 8, row: 4 }, activity: 'working' },
      { time: 'dusk', position: { col: 5, row: 10 }, activity: 'socializing', dialogue: 'Les équipes se rassemblent pour la nuit.' },
      { time: 'evening', position: { col: 5, row: 10 }, activity: 'socializing' },
      { time: 'night', position: { col: 3, row: 12 }, activity: 'training', dialogue: 'C\'est l\'heure de brûler des métaux dans la brume.' },
      { time: 'lateNight', position: { col: 3, row: 5 }, activity: 'sleeping' },
    ],
  },
  {
    npcID: 'metal_merchant', worldID: 'scadrial', zoneID: 'luthadel_market',
    defaultActivity: 'working',
    schedule: [
      { time: 'dawn', position: { col: 6, row: 3 }, activity: 'walking' },
      { time: 'morning', position: { col: 10, row: 5 }, activity: 'working', dialogue: 'Fioles de métal fraîches! Venez voir!' },
      { time: 'midday', position: { col: 10, row: 5 }, activity: 'working' },
      { time: 'afternoon', position: { col: 10, row: 5 }, activity: 'working' },
      { time: 'dusk', position: { col: 10, row: 5 }, activity: 'working', dialogue: 'Dernières offres avant la nuit!' },
      { time: 'evening', position: { col: 6, row: 8 }, activity: 'idle' },
      { time: 'night', position: { col: 4, row: 10 }, activity: 'sleeping' },
      { time: 'lateNight', position: { col: 4, row: 10 }, activity: 'sleeping' },
    ],
  },

  // ── Roshar ──
  {
    npcID: 'ardent_scholar', worldID: 'roshar', zoneID: 'kharbranth_library',
    defaultActivity: 'working',
    schedule: [
      { time: 'dawn', position: { col: 4, row: 3 }, activity: 'praying', dialogue: 'Les premiers rayons honorent le Tout-Puissant.' },
      { time: 'morning', position: { col: 7, row: 6 }, activity: 'working', dialogue: 'Je traduis d\'anciens textes sur les Chevaliers Radiants.' },
      { time: 'midday', position: { col: 7, row: 6 }, activity: 'working' },
      { time: 'afternoon', position: { col: 10, row: 8 }, activity: 'training' },
      { time: 'dusk', position: { col: 5, row: 9 }, activity: 'socializing' },
      { time: 'evening', position: { col: 4, row: 3 }, activity: 'praying' },
      { time: 'night', position: { col: 3, row: 4 }, activity: 'sleeping' },
      { time: 'lateNight', position: { col: 3, row: 4 }, activity: 'sleeping' },
    ],
  },
  {
    npcID: 'spren_keeper', worldID: 'roshar', zoneID: 'kharbranth_library',
    defaultActivity: 'idle',
    schedule: [
      { time: 'dawn', position: { col: 8, row: 3 }, activity: 'idle' },
      { time: 'morning', position: { col: 11, row: 5 }, activity: 'working', dialogue: 'Les sprens sont plus actifs ce matin.' },
      { time: 'midday', position: { col: 6, row: 7 }, activity: 'walking' },
      { time: 'afternoon', position: { col: 11, row: 5 }, activity: 'working' },
      { time: 'dusk', position: { col: 9, row: 9 }, activity: 'socializing', dialogue: 'Avez-vous vu des sprens d\'honneur récemment?' },
      { time: 'evening', position: { col: 8, row: 3 }, activity: 'idle' },
      { time: 'night', position: { col: 8, row: 3 }, activity: 'sleeping' },
      { time: 'lateNight', position: { col: 8, row: 3 }, activity: 'sleeping' },
    ],
  },

  // ── Taldain ──
  {
    npcID: 'sand_trader', worldID: 'taldain', zoneID: 'kezare_market',
    defaultActivity: 'working',
    schedule: [
      { time: 'dawn', position: { col: 5, row: 4 }, activity: 'walking', dialogue: 'Le soleil se lève sur Dayside. Bonne journée pour le commerce.' },
      { time: 'morning', position: { col: 9, row: 5 }, activity: 'working' },
      { time: 'midday', position: { col: 6, row: 8 }, activity: 'idle', dialogue: 'Trop chaud pour travailler... revenez plus tard.' },
      { time: 'afternoon', position: { col: 9, row: 5 }, activity: 'working' },
      { time: 'dusk', position: { col: 9, row: 5 }, activity: 'working', dialogue: 'Derniers sables blancs en promotion!' },
      { time: 'evening', position: { col: 5, row: 4 }, activity: 'socializing' },
      { time: 'night', position: { col: 3, row: 6 }, activity: 'sleeping' },
      { time: 'lateNight', position: { col: 3, row: 6 }, activity: 'sleeping' },
    ],
  },

  // ── Komashi ──
  {
    npcID: 'painter_mentor', worldID: 'komashi', zoneID: 'kilahito_studio',
    defaultActivity: 'working',
    schedule: [
      { time: 'dawn', position: { col: 4, row: 4 }, activity: 'praying', dialogue: 'Je médite avant de peindre.' },
      { time: 'morning', position: { col: 7, row: 5 }, activity: 'working', dialogue: 'L\'encre coule mieux le matin. Venez peindre.' },
      { time: 'midday', position: { col: 7, row: 5 }, activity: 'working' },
      { time: 'afternoon', position: { col: 10, row: 7 }, activity: 'training', dialogue: 'Empiler des pierres calme l\'esprit et renforce l\'âme.' },
      { time: 'dusk', position: { col: 6, row: 9 }, activity: 'socializing' },
      { time: 'evening', position: { col: 6, row: 9 }, activity: 'socializing', dialogue: 'Les cauchemars arrivent bientôt. Soyez prêts.' },
      { time: 'night', position: { col: 7, row: 5 }, activity: 'working', dialogue: 'C\'est maintenant que les vrais cauchemars apparaissent!' },
      { time: 'lateNight', position: { col: 4, row: 4 }, activity: 'sleeping' },
    ],
  },

  // ── Nalthis ──
  {
    npcID: 'breath_dealer', worldID: 'nalthis', zoneID: 'hallandren_court',
    defaultActivity: 'working',
    schedule: [
      { time: 'dawn', position: { col: 5, row: 3 }, activity: 'idle' },
      { time: 'morning', position: { col: 8, row: 5 }, activity: 'working', dialogue: 'Souffles à vendre! De toutes les Élévations.' },
      { time: 'midday', position: { col: 11, row: 6 }, activity: 'shopping' },
      { time: 'afternoon', position: { col: 8, row: 5 }, activity: 'working' },
      { time: 'dusk', position: { col: 8, row: 5 }, activity: 'working', dialogue: 'Les couleurs du crépuscule sont magnifiques avec le Deuxième Souffle.' },
      { time: 'evening', position: { col: 6, row: 8 }, activity: 'socializing' },
      { time: 'night', position: { col: 5, row: 3 }, activity: 'sleeping' },
      { time: 'lateNight', position: { col: 5, row: 3 }, activity: 'sleeping' },
    ],
  },

  // ── Sel ──
  {
    npcID: 'aon_teacher', worldID: 'sel', zoneID: 'elantris_academy',
    defaultActivity: 'working',
    schedule: [
      { time: 'dawn', position: { col: 6, row: 3 }, activity: 'praying', dialogue: 'Les Aons brillent plus à l\'aube.' },
      { time: 'morning', position: { col: 9, row: 5 }, activity: 'training', dialogue: 'Dessinez Aon Ien avec précision. Chaque ligne compte.' },
      { time: 'midday', position: { col: 9, row: 5 }, activity: 'training' },
      { time: 'afternoon', position: { col: 7, row: 7 }, activity: 'working' },
      { time: 'dusk', position: { col: 5, row: 9 }, activity: 'socializing' },
      { time: 'evening', position: { col: 6, row: 3 }, activity: 'praying', dialogue: 'Le Dor se calme avec la nuit. Reposez-vous.' },
      { time: 'night', position: { col: 4, row: 4 }, activity: 'sleeping' },
      { time: 'lateNight', position: { col: 4, row: 4 }, activity: 'sleeping' },
    ],
  },

  // ── Shadesmar ──
  {
    npcID: 'cognitive_guide', worldID: 'shadesmar', zoneID: 'shadesmar_port',
    defaultActivity: 'idle',
    schedule: [
      { time: 'dawn', position: { col: 5, row: 4 }, activity: 'idle', dialogue: 'Le temps est différent ici. L\'aube n\'est qu\'une idée.' },
      { time: 'morning', position: { col: 8, row: 5 }, activity: 'working' },
      { time: 'midday', position: { col: 10, row: 6 }, activity: 'walking' },
      { time: 'afternoon', position: { col: 8, row: 5 }, activity: 'working', dialogue: 'Les perles de verre contiennent des âmes d\'objets.' },
      { time: 'dusk', position: { col: 6, row: 8 }, activity: 'socializing' },
      { time: 'evening', position: { col: 6, row: 8 }, activity: 'socializing', dialogue: 'Les Cryptiques adorent les secrets du crépuscule.' },
      { time: 'night', position: { col: 5, row: 4 }, activity: 'idle' },
      { time: 'lateNight', position: { col: 5, row: 4 }, activity: 'idle', dialogue: 'Dans Shadesmar, personne ne dort vraiment.' },
    ],
  },
];

// ─── Activity Visual Config ──────────────────────────────────────

export interface ActivityVisual {
  icon: string;
  color: number;
  bobSpeed: number; // animation bob speed multiplier
}

export const ACTIVITY_VISUALS: Record<NPCActivity, ActivityVisual> = {
  idle:        { icon: '•', color: 0xaaaaaa, bobSpeed: 0.5 },
  working:     { icon: '⚒', color: 0xeebb33, bobSpeed: 1.0 },
  walking:     { icon: '→', color: 0x88bbdd, bobSpeed: 1.5 },
  sleeping:    { icon: '💤', color: 0x6677aa, bobSpeed: 0.3 },
  shopping:    { icon: '🏪', color: 0xeecc44, bobSpeed: 0.8 },
  training:    { icon: '⚔', color: 0xcc6644, bobSpeed: 1.2 },
  praying:     { icon: '✦', color: 0xddddff, bobSpeed: 0.4 },
  socializing: { icon: '💬', color: 0x66cc88, bobSpeed: 0.7 },
};

// ─── Schedule Manager ────────────────────────────────────────────

export class NPCScheduleManager {
  private static _instance: NPCScheduleManager;
  static get shared(): NPCScheduleManager {
    if (!this._instance) this._instance = new NPCScheduleManager();
    return this._instance;
  }

  private scheduleMap = new Map<string, NPCScheduleDef>();
  private currentActivities = new Map<string, { entry: NPCScheduleEntry; activity: NPCActivity }>();
  private lastTimeOfDay: TimeOfDay | null = null;

  constructor() {
    for (const sched of NPC_SCHEDULES) {
      this.scheduleMap.set(sched.npcID, sched);
    }
  }

  /** Get all scheduled NPCs for a given zone */
  getScheduledNPCs(worldID: string, zoneID: string): NPCScheduleDef[] {
    return NPC_SCHEDULES.filter(s => s.worldID === worldID && s.zoneID === zoneID);
  }

  /** Get current schedule entry for an NPC at a given time */
  getScheduleEntry(npcID: string, time: TimeOfDay): NPCScheduleEntry | null {
    const sched = this.scheduleMap.get(npcID);
    if (!sched) return null;
    return sched.schedule.find(e => e.time === time) ?? null;
  }

  /** Get current activity for an NPC */
  getCurrentActivity(npcID: string): NPCActivity {
    return this.currentActivities.get(npcID)?.activity ?? 'idle';
  }

  /** Get override dialogue for an NPC at current time */
  getTimeDialogue(npcID: string): string | null {
    return this.currentActivities.get(npcID)?.entry.dialogue ?? null;
  }

  /** Check if NPC is available for interaction (not sleeping) */
  isAvailable(npcID: string): boolean {
    const activity = this.getCurrentActivity(npcID);
    return activity !== 'sleeping';
  }

  /** Update all NPC schedules when time changes. Returns NPCs that need to move. */
  onTimeChange(time: TimeOfDay): { npcID: string; newPosition: GridPosition; activity: NPCActivity }[] {
    if (time === this.lastTimeOfDay) return [];
    this.lastTimeOfDay = time;

    const movers: { npcID: string; newPosition: GridPosition; activity: NPCActivity }[] = [];

    for (const sched of NPC_SCHEDULES) {
      const entry = sched.schedule.find(e => e.time === time);
      if (!entry) continue;

      const prev = this.currentActivities.get(sched.npcID);
      this.currentActivities.set(sched.npcID, { entry, activity: entry.activity });

      // Only report movement if position changed
      if (!prev || prev.entry.position.col !== entry.position.col || prev.entry.position.row !== entry.position.row) {
        movers.push({
          npcID: sched.npcID,
          newPosition: entry.position,
          activity: entry.activity,
        });
      }
    }

    return movers;
  }

  /** Initialize activities for current time */
  initialize(time: TimeOfDay): void {
    this.lastTimeOfDay = time;
    for (const sched of NPC_SCHEDULES) {
      const entry = sched.schedule.find(e => e.time === time);
      if (entry) {
        this.currentActivities.set(sched.npcID, { entry, activity: entry.activity });
      }
    }
  }

  /** Check if an NPC has a schedule defined */
  hasSchedule(npcID: string): boolean {
    return this.scheduleMap.has(npcID);
  }
}
