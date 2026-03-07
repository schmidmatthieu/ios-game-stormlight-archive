// ─── Elite Enemy Affix System ───────────────────────────────────
// Elite and boss enemies can roll random affixes that modify their behavior

export interface EliteAffix {
  id: string;
  name: string;
  icon: string;
  color: number;
  description: string;
  // Stat multipliers (1.0 = no change)
  hpMult: number;
  damageMult: number;
  speedMult: number;
  // Special mechanics
  mechanic: AffixMechanic;
}

export type AffixMechanic =
  | 'none'
  | 'thorns'          // Reflects % damage back to attacker
  | 'regenerating'    // Heals over time
  | 'teleporter'      // Blinks to random position periodically
  | 'shielded'        // Periodic damage immunity
  | 'enraging'        // Gets stronger as HP drops
  | 'summoner'        // Spawns minions (visual only for now)
  | 'explosive'       // AoE on death
  | 'vampiric'        // Heals on hit
  | 'freezing'        // Slows player on hit
  | 'splitting';      // Visual indicator only

const AFFIXES: EliteAffix[] = [
  {
    id: 'armored', name: 'Blindé', icon: '🛡', color: 0x8899aa,
    description: 'Plus résistant avec plus de points de vie.',
    hpMult: 1.8, damageMult: 1.0, speedMult: 0.9, mechanic: 'none',
  },
  {
    id: 'berserker', name: 'Berserker', icon: '🔥', color: 0xff4444,
    description: 'Dégâts massifs mais fragile.',
    hpMult: 0.7, damageMult: 2.0, speedMult: 1.3, mechanic: 'none',
  },
  {
    id: 'thorns', name: 'Épineux', icon: '🌵', color: 0x88aa44,
    description: 'Renvoie une partie des dégâts subis.',
    hpMult: 1.2, damageMult: 1.0, speedMult: 1.0, mechanic: 'thorns',
  },
  {
    id: 'regenerating', name: 'Régénérant', icon: '💚', color: 0x44cc66,
    description: 'Régénère des points de vie au fil du temps.',
    hpMult: 1.3, damageMult: 1.0, speedMult: 1.0, mechanic: 'regenerating',
  },
  {
    id: 'teleporter', name: 'Téléporteur', icon: '✦', color: 0x8866ff,
    description: 'Se téléporte aléatoirement pendant le combat.',
    hpMult: 1.1, damageMult: 1.1, speedMult: 1.0, mechanic: 'teleporter',
  },
  {
    id: 'shielded', name: 'Protégé', icon: '🔵', color: 0x4488ff,
    description: 'Devient temporairement invulnérable.',
    hpMult: 1.0, damageMult: 1.0, speedMult: 1.0, mechanic: 'shielded',
  },
  {
    id: 'enraging', name: 'Enragé', icon: '😡', color: 0xdd4444,
    description: 'Plus dangereux à mesure qu\'il perd des PV.',
    hpMult: 1.2, damageMult: 1.0, speedMult: 1.0, mechanic: 'enraging',
  },
  {
    id: 'vampiric', name: 'Vampirique', icon: '🩸', color: 0xcc2244,
    description: 'Se soigne en infligeant des dégâts.',
    hpMult: 1.1, damageMult: 1.2, speedMult: 1.0, mechanic: 'vampiric',
  },
  {
    id: 'freezing', name: 'Glacial', icon: '❄', color: 0x66ccff,
    description: 'Ralentit le joueur lors d\'une attaque.',
    hpMult: 1.1, damageMult: 0.9, speedMult: 1.0, mechanic: 'freezing',
  },
  {
    id: 'explosive', name: 'Explosif', icon: '💥', color: 0xff8833,
    description: 'Explose à la mort, infligeant des dégâts de zone.',
    hpMult: 1.0, damageMult: 1.1, speedMult: 1.2, mechanic: 'explosive',
  },
  {
    id: 'swift', name: 'Véloce', icon: '⚡', color: 0xffdd44,
    description: 'Se déplace et attaque beaucoup plus vite.',
    hpMult: 0.9, damageMult: 1.0, speedMult: 1.8, mechanic: 'none',
  },
];

// ─── Affix Assignment ───────────────────────────────────────────

export interface EnemyAffixState {
  affixes: EliteAffix[];
  shieldActive: boolean;
  shieldTimer: number;
  teleportTimer: number;
  regenTimer: number;
}

export function rollAffixes(tier: string): EliteAffix[] {
  if (tier === 'minion' || tier === 'soldier') return [];

  const count = tier === 'boss' ? 2 + Math.floor(Math.random() * 2) : 1 + (Math.random() < 0.3 ? 1 : 0);
  const pool = [...AFFIXES];
  const result: EliteAffix[] = [];

  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    result.push(pool[idx]);
    pool.splice(idx, 1);
  }

  return result;
}

export function createAffixState(affixes: EliteAffix[]): EnemyAffixState {
  return {
    affixes,
    shieldActive: false,
    shieldTimer: 5 + Math.random() * 5,
    teleportTimer: 4 + Math.random() * 3,
    regenTimer: 0,
  };
}

export function getAffixHPMultiplier(state: EnemyAffixState): number {
  let mult = 1;
  for (const a of state.affixes) mult *= a.hpMult;
  return mult;
}

export function getAffixDamageMultiplier(state: EnemyAffixState, hpPercent: number): number {
  let mult = 1;
  for (const a of state.affixes) {
    mult *= a.damageMult;
    if (a.mechanic === 'enraging') {
      // Up to 2x more damage at low HP
      mult *= 1 + (1 - hpPercent) * 1.0;
    }
  }
  return mult;
}

export function getAffixSpeedMultiplier(state: EnemyAffixState): number {
  let mult = 1;
  for (const a of state.affixes) mult *= a.speedMult;
  return mult;
}

/** Returns damage to reflect to attacker (thorns) */
export function getThornsDamage(state: EnemyAffixState, incomingDamage: number): number {
  for (const a of state.affixes) {
    if (a.mechanic === 'thorns') return Math.floor(incomingDamage * 0.15);
  }
  return 0;
}

/** Returns HP to regenerate per tick */
export function getRegenAmount(state: EnemyAffixState, maxHP: number): number {
  for (const a of state.affixes) {
    if (a.mechanic === 'regenerating') return Math.ceil(maxHP * 0.01);
  }
  return 0;
}

/** Returns HP to heal from vampiric on-hit */
export function getVampiricHeal(state: EnemyAffixState, damage: number): number {
  for (const a of state.affixes) {
    if (a.mechanic === 'vampiric') return Math.floor(damage * 0.2);
  }
  return 0;
}

export function hasAffix(state: EnemyAffixState, mechanic: AffixMechanic): boolean {
  return state.affixes.some(a => a.mechanic === mechanic);
}

export function getAffixLabel(state: EnemyAffixState): string {
  return state.affixes.map(a => `${a.icon} ${a.name}`).join(' ');
}

export function getAffixColor(state: EnemyAffixState): number {
  return state.affixes[0]?.color ?? 0xffffff;
}

/** Update affix timers, returns actions to take */
export function updateAffixState(
  state: EnemyAffixState, dt: number, maxHP: number, currentHP: number,
): { shouldTeleport: boolean; regenHP: number; shieldChanged: boolean } {
  let shouldTeleport = false;
  let regenHP = 0;
  let shieldChanged = false;

  for (const affix of state.affixes) {
    if (affix.mechanic === 'teleporter') {
      state.teleportTimer -= dt;
      if (state.teleportTimer <= 0) {
        state.teleportTimer = 3 + Math.random() * 4;
        shouldTeleport = true;
      }
    }

    if (affix.mechanic === 'regenerating') {
      state.regenTimer += dt;
      if (state.regenTimer >= 1.0) {
        state.regenTimer = 0;
        regenHP = Math.ceil(maxHP * 0.01);
      }
    }

    if (affix.mechanic === 'shielded') {
      state.shieldTimer -= dt;
      if (state.shieldTimer <= 0) {
        state.shieldActive = !state.shieldActive;
        state.shieldTimer = state.shieldActive ? 2 + Math.random() * 2 : 5 + Math.random() * 5;
        shieldChanged = true;
      }
    }
  }

  return { shouldTeleport, regenHP, shieldChanged };
}
