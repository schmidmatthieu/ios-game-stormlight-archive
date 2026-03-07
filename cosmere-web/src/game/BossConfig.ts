// ─── Boss Configuration Data ────────────────────────────────────

export interface BossPhase {
  name: string;
  hpThreshold: number;
  damageMultiplier: number;
  speedMultiplier: number;
  specialAttack: string;
  specialAttackCooldown: number;
  message: string;
}

export interface BossConfig {
  phases: BossPhase[];
  entranceMessage: string;
  defeatMessage: string;
  specialMechanic: string;
}

export const BOSS_CONFIGS: Record<string, BossConfig> = {
  // Scadrial - Steel Inquisitor
  steel_inquisitor: {
    entranceMessage: 'L\'Inquisiteur d\'Acier surgit des brumes!',
    defeatMessage: 'L\'Inquisiteur tombe, ses pics s\'effondrent...',
    specialMechanic: 'hemalurgy_drain',
    phases: [
      { name: 'Phase 1', hpThreshold: 1, damageMultiplier: 1, speedMultiplier: 1,
        specialAttack: 'steel_push', specialAttackCooldown: 5,
        message: 'L\'Inquisiteur vous observe...' },
      { name: 'Phase 2 — Rage', hpThreshold: 0.5, damageMultiplier: 1.5, speedMultiplier: 1.5,
        specialAttack: 'iron_pull', specialAttackCooldown: 3,
        message: '⚡ L\'Inquisiteur entre en rage! Dégâts augmentés!' },
      { name: 'Phase 3 — Désespoir', hpThreshold: 0.2, damageMultiplier: 2, speedMultiplier: 2,
        specialAttack: 'spike_barrage', specialAttackCooldown: 2,
        message: '💀 Phase finale! L\'Inquisiteur est désespéré!' },
    ],
  },
  // Roshar - Thunderclast
  thunderclast: {
    entranceMessage: 'Le Tonnerreclaste émerge de la pierre!',
    defeatMessage: 'Le Tonnerreclaste s\'effondre en poussière...',
    specialMechanic: 'quake',
    phases: [
      { name: 'Phase 1', hpThreshold: 1, damageMultiplier: 1, speedMultiplier: 0.6,
        specialAttack: 'ground_slam', specialAttackCooldown: 6,
        message: 'Le sol tremble sous ses pas...' },
      { name: 'Phase 2 — Séisme', hpThreshold: 0.6, damageMultiplier: 1.3, speedMultiplier: 0.8,
        specialAttack: 'rock_throw', specialAttackCooldown: 4,
        message: '🌍 Le Tonnerreclaste provoque un séisme!' },
      { name: 'Phase 3 — Fureur', hpThreshold: 0.25, damageMultiplier: 1.8, speedMultiplier: 1,
        specialAttack: 'stomp_wave', specialAttackCooldown: 3,
        message: '⚡ Le Tonnerreclaste entre en fureur!' },
    ],
  },
  // Taldain - Sand Lord
  sand_lord: {
    entranceMessage: 'Le Seigneur des Sables surgit du désert!',
    defeatMessage: 'Le sable noir retombe... le Seigneur est vaincu.',
    specialMechanic: 'sand_storm',
    phases: [
      { name: 'Phase 1', hpThreshold: 1, damageMultiplier: 1, speedMultiplier: 1,
        specialAttack: 'sand_blast', specialAttackCooldown: 5,
        message: 'Le sable tourbillonne...' },
      { name: 'Phase 2 — Tempête', hpThreshold: 0.5, damageMultiplier: 1.4, speedMultiplier: 1.3,
        specialAttack: 'sand_wall', specialAttackCooldown: 4,
        message: '🌪 Tempête de sable! Visibilité réduite!' },
      { name: 'Phase 3 — Eclipse', hpThreshold: 0.2, damageMultiplier: 2, speedMultiplier: 1.5,
        specialAttack: 'dark_sand', specialAttackCooldown: 2,
        message: '🌑 Le sable noir obscurcit le ciel!' },
    ],
  },
  // Komashi - Father of Nightmares
  nightmare_father: {
    entranceMessage: 'Le Père des Cauchemars se matérialise!',
    defeatMessage: 'Les cauchemars se dissipent... la lumière revient.',
    specialMechanic: 'nightmare_spawn',
    phases: [
      { name: 'Phase 1', hpThreshold: 1, damageMultiplier: 1, speedMultiplier: 0.8,
        specialAttack: 'fear_pulse', specialAttackCooldown: 6,
        message: 'Les ombres s\'agitent...' },
      { name: 'Phase 2 — Terreur', hpThreshold: 0.5, damageMultiplier: 1.5, speedMultiplier: 1,
        specialAttack: 'shadow_clone', specialAttackCooldown: 4,
        message: '👁 Le Père crée des clones de cauchemar!' },
      { name: 'Phase 3 — Apocalypse', hpThreshold: 0.15, damageMultiplier: 2.5, speedMultiplier: 1.5,
        specialAttack: 'void_consume', specialAttackCooldown: 2,
        message: '💀 Le néant consume tout!' },
    ],
  },
};

export const DEFAULT_BOSS: BossConfig = {
  entranceMessage: 'Un boss redoutable apparaît!',
  defeatMessage: 'Le boss est vaincu!',
  specialMechanic: 'none',
  phases: [
    { name: 'Phase 1', hpThreshold: 1, damageMultiplier: 1, speedMultiplier: 1,
      specialAttack: 'power_strike', specialAttackCooldown: 5,
      message: 'Le combat commence...' },
    { name: 'Phase 2', hpThreshold: 0.5, damageMultiplier: 1.5, speedMultiplier: 1.3,
      specialAttack: 'power_strike', specialAttackCooldown: 3,
      message: '⚡ Le boss s\'énerve!' },
    { name: 'Phase 3', hpThreshold: 0.2, damageMultiplier: 2, speedMultiplier: 1.5,
      specialAttack: 'power_strike', specialAttackCooldown: 2,
      message: '💀 Phase finale!' },
  ],
};
