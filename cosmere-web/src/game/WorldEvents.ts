// ─── Random World Events ─────────────────────────────────────

export type WorldEventType =
  | 'merchant_caravan'
  | 'enemy_invasion'
  | 'treasure_rain'
  | 'healing_spring'
  | 'investiture_surge'
  | 'bounty_hunt'
  | 'mysterious_stranger'
  | 'environmental_hazard';

export interface WorldEventDef {
  type: WorldEventType;
  name: string;
  description: string;
  duration: number; // seconds
  color: number;
  icon: string;
  worlds: string[] | null; // null = all worlds
  effect: WorldEventEffect;
}

export interface WorldEventEffect {
  goldBonus?: number;       // % bonus gold from kills
  xpBonus?: number;         // % bonus XP
  healPerTick?: number;     // HP/s
  investiturePerTick?: number; // Investiture/s
  enemyDamageBonus?: number; // % more enemy damage (for challenges)
  enemySpeedBonus?: number;  // % faster enemies
  dropRateBonus?: number;    // % bonus loot chance
  shopDiscount?: number;     // % off shops
}

const EVENTS: WorldEventDef[] = [
  // ── Universal Events (all worlds) ──────────────────────────
  {
    type: 'merchant_caravan', name: 'Caravane de Marchands',
    description: 'Des marchands itinérants traversent la zone, offrant des réductions.',
    duration: 45, color: 0xeecc44, icon: '🏪', worlds: null,
    effect: { shopDiscount: 30 },
  },
  {
    type: 'enemy_invasion', name: 'Invasion Ennemie',
    description: 'Les ennemis sont plus forts mais donnent plus de récompenses!',
    duration: 40, color: 0xcc4444, icon: '⚔',  worlds: null,
    effect: { enemyDamageBonus: 30, xpBonus: 50, goldBonus: 50 },
  },
  {
    type: 'treasure_rain', name: 'Pluie de Trésors',
    description: 'Des trésors apparaissent partout! Le taux de butin est augmenté.',
    duration: 30, color: 0xffaa33, icon: '💰', worlds: null,
    effect: { goldBonus: 100, dropRateBonus: 50 },
  },
  {
    type: 'healing_spring', name: 'Source Curative',
    description: 'Une énergie mystérieuse régénère la vie de tous les êtres.',
    duration: 35, color: 0x44cc66, icon: '💚', worlds: null,
    effect: { healPerTick: 3 },
  },
  {
    type: 'investiture_surge', name: 'Afflux d\'Investiture',
    description: 'L\'Investiture du Cosmere est en ébullition! Récupération accélérée.',
    duration: 40, color: 0x5577ff, icon: '✦', worlds: null,
    effect: { investiturePerTick: 2 },
  },
  {
    type: 'bounty_hunt', name: 'Chasse à Prime',
    description: 'Les ennemis élites rapportent des récompenses doublées!',
    duration: 50, color: 0xaa66cc, icon: '🎯', worlds: null,
    effect: { xpBonus: 75, goldBonus: 75 },
  },
  {
    type: 'mysterious_stranger', name: 'Étranger Mystérieux',
    description: 'Un voyageur du Cosmere bénit votre chemin. Tout est amélioré.',
    duration: 25, color: 0xdddddd, icon: '👤', worlds: null,
    effect: { xpBonus: 25, goldBonus: 25, dropRateBonus: 25, healPerTick: 1 },
  },
  {
    type: 'environmental_hazard', name: 'Danger Environnemental',
    description: 'Le monde se déchaîne! Danger accru mais récompenses massives.',
    duration: 35, color: 0xff6633, icon: '⚠', worlds: null,
    effect: { enemyDamageBonus: 50, enemySpeedBonus: 20, xpBonus: 100, goldBonus: 100 },
  },

  // ── Scadrial ───────────────────────────────────────────────
  {
    type: 'environmental_hazard', name: 'Brumes Épaisses',
    description: 'Les brumes enveloppent tout. Les ennemis ralentissent mais frappent plus fort.',
    duration: 40, color: 0x8899aa, icon: '🌫', worlds: ['scadrial'],
    effect: { enemySpeedBonus: -20, enemyDamageBonus: 25, dropRateBonus: 30 },
  },
  {
    type: 'enemy_invasion', name: 'Raid des Koloss',
    description: 'Des koloss déchaînés attaquent! XP massif pour les survivants.',
    duration: 35, color: 0x4466bb, icon: '👹', worlds: ['scadrial'],
    effect: { enemyDamageBonus: 60, xpBonus: 120, goldBonus: 80 },
  },

  // ── Roshar ─────────────────────────────────────────────────
  {
    type: 'environmental_hazard', name: 'Haute Tempête',
    description: 'La Haute Tempête fait rage! Danger extrême mais Investiture abondante.',
    duration: 30, color: 0x3355aa, icon: '⛈', worlds: ['roshar'],
    effect: { enemyDamageBonus: 40, enemySpeedBonus: 15, investiturePerTick: 5 },
  },
  {
    type: 'healing_spring', name: 'Bénédiction de l\'Orage',
    description: 'La Lumière d\'Orage imprègne l\'air, soignant et renforçant.',
    duration: 35, color: 0x77aaff, icon: '⚡', worlds: ['roshar'],
    effect: { healPerTick: 4, investiturePerTick: 3, xpBonus: 20 },
  },

  // ── Taldain ────────────────────────────────────────────────
  {
    type: 'investiture_surge', name: 'Zénith Solaire',
    description: 'Le soleil blanc brille intensément. Le sable se recharge rapidement.',
    duration: 45, color: 0xffdd55, icon: '☀', worlds: ['taldain'],
    effect: { investiturePerTick: 4, xpBonus: 15 },
  },
  {
    type: 'environmental_hazard', name: 'Tempête de Sable',
    description: 'Une violente tempête de sable réduit la visibilité mais cache des trésors.',
    duration: 30, color: 0xccaa66, icon: '🏜', worlds: ['taldain'],
    effect: { enemySpeedBonus: -10, dropRateBonus: 60, goldBonus: 40 },
  },

  // ── Komashi ────────────────────────────────────────────────
  {
    type: 'enemy_invasion', name: 'Vague de Cauchemars',
    description: 'Des cauchemars vivants émergent! Encre bonus pour les vaincre.',
    duration: 35, color: 0x442255, icon: '👻', worlds: ['komashi'],
    effect: { enemyDamageBonus: 35, investiturePerTick: 2, xpBonus: 60 },
  },
  {
    type: 'healing_spring', name: 'Aurore Paisible',
    description: 'Une aube sereine calme les cauchemars. Régénération et paix.',
    duration: 40, color: 0xffaacc, icon: '🌅', worlds: ['komashi'],
    effect: { healPerTick: 5, investiturePerTick: 1 },
  },

  // ── Nalthis ────────────────────────────────────────────────
  {
    type: 'investiture_surge', name: 'Floraison Chromatique',
    description: 'Les couleurs explosent! Les Souffles sont plus puissants.',
    duration: 40, color: 0xff66aa, icon: '🌈', worlds: ['nalthis'],
    effect: { investiturePerTick: 3, dropRateBonus: 25 },
  },
  {
    type: 'merchant_caravan', name: 'Marché des Teintes',
    description: 'Des marchands de Souffles proposent des affaires exceptionnelles.',
    duration: 50, color: 0xaa44ff, icon: '🎨', worlds: ['nalthis'],
    effect: { shopDiscount: 40, goldBonus: 30 },
  },

  // ── Sel ────────────────────────────────────────────────────
  {
    type: 'investiture_surge', name: 'Résurgence du Dor',
    description: 'Le Dor pulse avec force! Les Aons brillent plus intensément.',
    duration: 35, color: 0xeedd88, icon: '✨', worlds: ['sel'],
    effect: { investiturePerTick: 4, xpBonus: 30 },
  },
  {
    type: 'environmental_hazard', name: 'Éboulement du Reod',
    description: 'Les fissures du Reod s\'ouvrent. Danger mortel mais trésors anciens.',
    duration: 30, color: 0x886644, icon: '💀', worlds: ['sel'],
    effect: { enemyDamageBonus: 45, goldBonus: 120, dropRateBonus: 40 },
  },

  // ── Shadesmar ──────────────────────────────────────────────
  {
    type: 'investiture_surge', name: 'Convergence Cognitive',
    description: 'Les royaumes se rapprochent. L\'Investiture coule librement.',
    duration: 35, color: 0x2244aa, icon: '🔮', worlds: ['shadesmar'],
    effect: { investiturePerTick: 5, healPerTick: 2, xpBonus: 25 },
  },
  {
    type: 'mysterious_stranger', name: 'Vision du Cosmere',
    description: 'Une vision transcendante révèle les secrets cachés du monde.',
    duration: 25, color: 0xffffff, icon: '👁', worlds: ['shadesmar'],
    effect: { xpBonus: 50, goldBonus: 50, dropRateBonus: 50, investiturePerTick: 2 },
  },
];

// ─── World Event Manager ─────────────────────────────────────

export class WorldEventManager {
  private static _instance: WorldEventManager;
  static get shared(): WorldEventManager {
    if (!this._instance) this._instance = new WorldEventManager();
    return this._instance;
  }

  activeEvent: WorldEventDef | null = null;
  eventTimer = 0;
  private cooldownTimer = 0;
  private readonly MIN_COOLDOWN = 60;  // minimum seconds between events
  private readonly MAX_COOLDOWN = 120; // maximum seconds between events
  private pendingAnnouncement: WorldEventDef | null = null;

  constructor() {
    this.cooldownTimer = 30 + Math.random() * 30; // Start with shorter initial cooldown
  }

  update(dt: number, worldID: string): { active: boolean; effect: WorldEventEffect | null; ended: boolean } {
    let ended = false;

    // Active event countdown
    if (this.activeEvent) {
      this.eventTimer -= dt;
      if (this.eventTimer <= 0) {
        ended = true;
        this.activeEvent = null;
        this.eventTimer = 0;
        this.cooldownTimer = this.MIN_COOLDOWN + Math.random() * (this.MAX_COOLDOWN - this.MIN_COOLDOWN);
      }
    } else {
      // Cooldown
      this.cooldownTimer -= dt;
      if (this.cooldownTimer <= 0) {
        this.startRandomEvent(worldID);
      }
    }

    return {
      active: this.activeEvent !== null,
      effect: this.activeEvent?.effect ?? null,
      ended,
    };
  }

  private startRandomEvent(worldID: string): void {
    const eligible = EVENTS.filter(e => !e.worlds || e.worlds.includes(worldID));
    if (eligible.length === 0) return;

    const event = eligible[Math.floor(Math.random() * eligible.length)];
    this.activeEvent = event;
    this.eventTimer = event.duration;
    this.pendingAnnouncement = event;
  }

  popAnnouncement(): WorldEventDef | null {
    const a = this.pendingAnnouncement;
    this.pendingAnnouncement = null;
    return a;
  }

  get timeRemaining(): number {
    return Math.max(0, this.eventTimer);
  }

  get timeRemainingFormatted(): string {
    const t = Math.ceil(this.timeRemaining);
    return `${Math.floor(t / 60)}:${(t % 60).toString().padStart(2, '0')}`;
  }
}
