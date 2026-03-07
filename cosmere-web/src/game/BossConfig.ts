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
  // ─── Scadrial — Inquisiteur d'Acier ──────────────────────────
  // Mechanic: Hemalurgy drain — periodically drains player investiture
  // Pattern: Fast melee → ranged pulls → desperate spike barrage
  steel_inquisitor: {
    entranceMessage: 'L\'Inquisiteur d\'Acier surgit des brumes!',
    defeatMessage: 'L\'Inquisiteur tombe, ses pics s\'effondrent...',
    specialMechanic: 'hemalurgy_drain',
    phases: [
      { name: 'Phase 1 — Traque', hpThreshold: 1, damageMultiplier: 1, speedMultiplier: 1.2,
        specialAttack: 'steel_push', specialAttackCooldown: 5,
        message: 'L\'Inquisiteur vous traque dans les brumes...' },
      { name: 'Phase 2 — Hémalurgie', hpThreshold: 0.6, damageMultiplier: 1.4, speedMultiplier: 1.5,
        specialAttack: 'iron_pull', specialAttackCooldown: 3.5,
        message: '⚡ L\'Inquisiteur active ses pics hémalurgiques! Il draine votre énergie!' },
      { name: 'Phase 3 — Rage d\'Acier', hpThreshold: 0.3, damageMultiplier: 1.8, speedMultiplier: 1.8,
        specialAttack: 'spike_barrage', specialAttackCooldown: 2.5,
        message: '⚔ L\'Inquisiteur attaque frénétiquement!' },
      { name: 'Phase 4 — Désespoir', hpThreshold: 0.1, damageMultiplier: 2.5, speedMultiplier: 2,
        specialAttack: 'hemalurgy_burst', specialAttackCooldown: 1.5,
        message: '💀 Dernière chance! L\'Inquisiteur libère toute son hémalurgie!' },
    ],
  },

  // ─── Roshar — Tonnerreclaste ─────────────────────────────────
  // Mechanic: Quake — creates shockwaves that stun if player doesn't move
  // Pattern: Slow tank → earthquake AoE → enraged charge
  thunderclast: {
    entranceMessage: 'Le Tonnerreclaste émerge de la pierre! Le sol tremble!',
    defeatMessage: 'Le Tonnerreclaste s\'effondre en poussière de pierre...',
    specialMechanic: 'quake',
    phases: [
      { name: 'Phase 1 — Éveil', hpThreshold: 1, damageMultiplier: 1, speedMultiplier: 0.5,
        specialAttack: 'ground_slam', specialAttackCooldown: 6,
        message: 'La montagne s\'éveille... gardez vos distances!' },
      { name: 'Phase 2 — Séisme', hpThreshold: 0.65, damageMultiplier: 1.3, speedMultiplier: 0.7,
        specialAttack: 'earthquake', specialAttackCooldown: 5,
        message: '🌍 Le Tonnerreclaste frappe le sol! Ondes de choc!' },
      { name: 'Phase 3 — Avalanche', hpThreshold: 0.35, damageMultiplier: 1.6, speedMultiplier: 0.9,
        specialAttack: 'rock_throw', specialAttackCooldown: 3,
        message: '⛰ Des rochers volent dans tous les sens!' },
      { name: 'Phase 4 — Charge Finale', hpThreshold: 0.15, damageMultiplier: 2, speedMultiplier: 1.5,
        specialAttack: 'stomp_wave', specialAttackCooldown: 2,
        message: '⚡ Le Tonnerreclaste charge! Esquivez ou mourrez!' },
    ],
  },

  // ─── Taldain — Seigneur des Sables ──────────────────────────
  // Mechanic: Sand storm — reduces visibility and creates sand hazard zones
  // Pattern: Ranged sand attacks → sand wall barriers → total eclipse
  sand_lord: {
    entranceMessage: 'Le Seigneur des Sables se dresse, le désert obéit à sa volonté!',
    defeatMessage: 'Le sable noir retombe... la lumière revient sur Taldain.',
    specialMechanic: 'sand_zones',
    phases: [
      { name: 'Phase 1 — Maîtrise', hpThreshold: 1, damageMultiplier: 1, speedMultiplier: 1,
        specialAttack: 'sand_blast', specialAttackCooldown: 5,
        message: 'Le sable danse autour du Seigneur...' },
      { name: 'Phase 2 — Tempête', hpThreshold: 0.6, damageMultiplier: 1.3, speedMultiplier: 1.2,
        specialAttack: 'sand_wall', specialAttackCooldown: 4,
        message: '🌪 Tempête de sable! Des murs de sable bloquent le passage!' },
      { name: 'Phase 3 — Darkside', hpThreshold: 0.35, damageMultiplier: 1.7, speedMultiplier: 1.4,
        specialAttack: 'dark_sand', specialAttackCooldown: 3,
        message: '🌑 Le sable noir dévore la lumière! Zones dangereuses!' },
      { name: 'Phase 4 — Éclipse Totale', hpThreshold: 0.12, damageMultiplier: 2.2, speedMultiplier: 1.6,
        specialAttack: 'total_eclipse', specialAttackCooldown: 2,
        message: '☀ Le soleil s\'éteint! Le Seigneur est invulnérable sauf dans les zones de lumière!' },
    ],
  },

  // ─── Komashi — Père des Cauchemars ──────────────────────────
  // Mechanic: Nightmare spawn — summons nightmare adds periodically
  // Pattern: Fear zones → shadow clones → reality warping
  father_of_nightmares: {
    entranceMessage: 'Le Père des Cauchemars se matérialise! La réalité se tord!',
    defeatMessage: 'Les cauchemars se dissipent... les lignes de hion brillent à nouveau.',
    specialMechanic: 'nightmare_spawn',
    phases: [
      { name: 'Phase 1 — Murmures', hpThreshold: 1, damageMultiplier: 1, speedMultiplier: 0.7,
        specialAttack: 'fear_pulse', specialAttackCooldown: 6,
        message: 'Des murmures d\'ombres emplissent l\'air...' },
      { name: 'Phase 2 — Terreur', hpThreshold: 0.6, damageMultiplier: 1.4, speedMultiplier: 0.9,
        specialAttack: 'shadow_clone', specialAttackCooldown: 4,
        message: '👁 Le Père crée des copies de lui-même! Trouvez le vrai!' },
      { name: 'Phase 3 — Cauchemar', hpThreshold: 0.35, damageMultiplier: 1.8, speedMultiplier: 1.1,
        specialAttack: 'reality_warp', specialAttackCooldown: 3,
        message: '🌀 La réalité se déforme! Les ennemis apparaissent de nulle part!' },
      { name: 'Phase 4 — Néant', hpThreshold: 0.1, damageMultiplier: 2.5, speedMultiplier: 1.5,
        specialAttack: 'void_consume', specialAttackCooldown: 1.5,
        message: '💀 Le néant consume tout! Détruisez la machine!' },
    ],
  },
  // Legacy alias
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
        message: '👁 Le Père crée des clones!' },
      { name: 'Phase 3 — Néant', hpThreshold: 0.15, damageMultiplier: 2.5, speedMultiplier: 1.5,
        specialAttack: 'void_consume', specialAttackCooldown: 2,
        message: '💀 Le néant consume tout!' },
    ],
  },

  // ─── Nalthis — Champion Retourné ────────────────────────────
  // Mechanic: Color drain — drains color from the arena, player weakened in gray zones
  // Pattern: Breath blasts → lifeless army summon → divine color storm
  returned_champion: {
    entranceMessage: 'Le Champion Retourné descend des cieux! Les couleurs s\'estompent autour de lui!',
    defeatMessage: 'Le Souffle Divin s\'éteint... les couleurs reviennent.',
    specialMechanic: 'color_drain',
    phases: [
      { name: 'Phase 1 — Défi', hpThreshold: 1, damageMultiplier: 1, speedMultiplier: 1.3,
        specialAttack: 'divine_breath_blast', specialAttackCooldown: 5,
        message: 'Le Champion vous défie. Son Souffle Divin irradie!' },
      { name: 'Phase 2 — Armée', hpThreshold: 0.6, damageMultiplier: 1.4, speedMultiplier: 1.2,
        specialAttack: 'lifeless_summon', specialAttackCooldown: 6,
        message: '⚔ Le Champion Éveille une armée de Sans-Vie!' },
      { name: 'Phase 3 — Drain', hpThreshold: 0.35, damageMultiplier: 1.7, speedMultiplier: 1.4,
        specialAttack: 'color_storm', specialAttackCooldown: 3,
        message: '🌈 Les couleurs explosent! Zones mortelles chromatiques!' },
      { name: 'Phase 4 — Souffle Final', hpThreshold: 0.12, damageMultiplier: 2.3, speedMultiplier: 1.8,
        specialAttack: 'divine_explosion', specialAttackCooldown: 2,
        message: '💀 Le Champion sacrifie ses derniers Souffles! Explosion imminente!' },
    ],
  },

  // ─── Sel — Avatar de Domination ─────────────────────────────
  // Mechanic: Aon shatter — breaks Aon glyphs on the ground that explode if touched
  // Pattern: Aon attacks → realm tear portals → divine wrath
  dominion_avatar: {
    entranceMessage: 'L\'Avatar de Domination déchire le voile! Le Dor se déchaîne!',
    defeatMessage: 'L\'Avatar se dissout... le Dor retrouve son équilibre.',
    specialMechanic: 'aon_shatter',
    phases: [
      { name: 'Phase 1 — Commandement', hpThreshold: 1, damageMultiplier: 1, speedMultiplier: 0.8,
        specialAttack: 'dominion_decree', specialAttackCooldown: 5,
        message: 'L\'Avatar ordonne votre soumission. Des glyphes brisés parsèment le sol.' },
      { name: 'Phase 2 — Fracture', hpThreshold: 0.6, damageMultiplier: 1.3, speedMultiplier: 1,
        specialAttack: 'aon_shatter', specialAttackCooldown: 4,
        message: '✨ Les Aons se brisent! Des explosions d\'énergie partout!' },
      { name: 'Phase 3 — Déchirure', hpThreshold: 0.35, damageMultiplier: 1.7, speedMultiplier: 1.2,
        specialAttack: 'realm_tear', specialAttackCooldown: 3,
        message: '🌀 Des portails vers d\'autres Royaumes s\'ouvrent! Ennemis de l\'au-delà!' },
      { name: 'Phase 4 — Colère Divine', hpThreshold: 0.1, damageMultiplier: 2.5, speedMultiplier: 1.5,
        specialAttack: 'divine_wrath', specialAttackCooldown: 1.5,
        message: '⚡ La colère de Domination s\'abat! Le sol se désintègre!' },
    ],
  },

  // ─── Shadesmar — Avatar de l'Éclat Brisé (Boss Final) ──────
  // Mechanic: Phase shift — boss becomes invulnerable, must destroy shards to damage
  // Pattern: Shard beams → reality tears → summon shades → ultimate phase shift
  shattered_shard_avatar: {
    entranceMessage: 'L\'Avatar de l\'Éclat Brisé se manifeste! Tous les mondes tremblent!',
    defeatMessage: 'L\'Éclat se reconstitue... le Cosmere est sauvé. Vous êtes le véritable Salteur.',
    specialMechanic: 'phase_shift',
    phases: [
      { name: 'Phase 1 — Manifestation', hpThreshold: 1, damageMultiplier: 1, speedMultiplier: 0.8,
        specialAttack: 'shard_beam', specialAttackCooldown: 5,
        message: 'L\'Éclat Brisé prend forme. Son pouvoir est immense.' },
      { name: 'Phase 2 — Fragmentation', hpThreshold: 0.7, damageMultiplier: 1.3, speedMultiplier: 1,
        specialAttack: 'reality_tear', specialAttackCooldown: 4,
        message: '🌀 L\'Avatar se fragmente! Détruisez les éclats pour le rendre vulnérable!' },
      { name: 'Phase 3 — Invocation', hpThreshold: 0.45, damageMultiplier: 1.6, speedMultiplier: 1.2,
        specialAttack: 'summon_shades', specialAttackCooldown: 5,
        message: '👻 Des ombres de tous les mondes convergent! L\'armée de l\'Éclat!' },
      { name: 'Phase 4 — Convergence', hpThreshold: 0.25, damageMultiplier: 2, speedMultiplier: 1.4,
        specialAttack: 'cosmic_storm', specialAttackCooldown: 3,
        message: '⚡ Les mondes fusionnent! Tempête cosmique!' },
      { name: 'Phase 5 — Ultime', hpThreshold: 0.08, damageMultiplier: 3, speedMultiplier: 2,
        specialAttack: 'shard_annihilation', specialAttackCooldown: 1.5,
        message: '💀 L\'ÉCLAT LIBÈRE TOUTE SA PUISSANCE! MAINTENANT OU JAMAIS!' },
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
