// ─── Talent Tree Data — All 6 class talent trees ────────────────────

export type TalentEffectType =
  | 'bonusHP' | 'bonusInvestiture' | 'bonusStrength' | 'bonusAgility' | 'bonusSpirit' | 'bonusLuck'
  | 'attackDamagePercent' | 'critChancePercent' | 'critDamagePercent'
  | 'attackSpeedPercent' | 'lifestealPercent'
  | 'magicDamagePercent' | 'investitureCostReduction'
  | 'cooldownReduction' | 'statusDurationPercent' | 'aoeRadiusPercent'
  | 'damageReductionPercent' | 'dodgeChancePercent'
  | 'hpRegenPerSecond' | 'investitureRegenPerSecond' | 'shieldOnKill'
  | 'xpBonusPercent' | 'goldBonusPercent' | 'lootRarityBonus'
  | 'movementSpeedPercent' | 'companionDamagePercent';

export interface TalentEffect {
  type: TalentEffectType;
  valuePerRank: number;
}

export interface Talent {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: number;
  maxRank: number;
  prerequisiteID: string | null;
  effect: TalentEffect;
}

export interface TalentBranch {
  name: string;
  description: string;
  talents: Talent[];
}

export interface TalentTree {
  id: string;
  championClass: string;
  branches: TalentBranch[];
}

// ─── Mistborn ──────────────────────────────────────────

const TREE_MISTBORN: TalentTree = {
  id: 'tree_mistborn',
  championClass: 'Brumeux',
  branches: [
    {
      name: 'Pousseur d\'Acier',
      description: 'Dégâts à distance et recul',
      talents: [
        { id: 'mb_steel_1', name: 'Poussée Renforcée', description: '+15% dégâts magiques par rang', icon: 'steel_push', tier: 1, maxRank: 5, prerequisiteID: null, effect: { type: 'magicDamagePercent', valuePerRank: 0.15 } },
        { id: 'mb_steel_2', name: 'Pluie de Métal', description: '+50% rayon de zone', icon: 'metal_rain', tier: 2, maxRank: 4, prerequisiteID: 'mb_steel_1', effect: { type: 'aoeRadiusPercent', valuePerRank: 0.50 } },
        { id: 'mb_steel_3', name: 'Mur d\'Acier', description: '+10% réduction de dégâts', icon: 'steel_wall', tier: 3, maxRank: 3, prerequisiteID: 'mb_steel_2', effect: { type: 'damageReductionPercent', valuePerRank: 0.10 } },
        { id: 'mb_steel_4', name: 'Ouragan Métallique', description: '+50% dégâts d\'attaque', icon: 'metal_storm', tier: 4, maxRank: 2, prerequisiteID: 'mb_steel_3', effect: { type: 'attackDamagePercent', valuePerRank: 0.50 } },
        { id: 'mb_steel_5', name: 'Ascension d\'Acier', description: '+10% dégâts magiques et critique par rang', icon: 'steel_ascension', tier: 5, maxRank: 3, prerequisiteID: 'mb_steel_4', effect: { type: 'magicDamagePercent', valuePerRank: 0.10 } },
      ],
    },
    {
      name: 'Brûleur de Pewter',
      description: 'Tank et mêlée',
      talents: [
        { id: 'mb_pewter_1', name: 'Corps d\'Acier', description: '+10% PV max par rang', icon: 'pewter_body', tier: 1, maxRank: 5, prerequisiteID: null, effect: { type: 'bonusHP', valuePerRank: 0.10 } },
        { id: 'mb_pewter_2', name: 'Rage du Pewter', description: '+20% dégâts d\'attaque', icon: 'pewter_rage', tier: 2, maxRank: 4, prerequisiteID: 'mb_pewter_1', effect: { type: 'attackDamagePercent', valuePerRank: 0.20 } },
        { id: 'mb_pewter_3', name: 'Endurance Surhumaine', description: '+2 PV/s régén.', icon: 'endurance', tier: 3, maxRank: 3, prerequisiteID: 'mb_pewter_2', effect: { type: 'hpRegenPerSecond', valuePerRank: 2.0 } },
        { id: 'mb_pewter_4', name: 'Indestructible', description: '+100% réduction de dégâts', icon: 'indestructible', tier: 4, maxRank: 2, prerequisiteID: 'mb_pewter_3', effect: { type: 'damageReductionPercent', valuePerRank: 1.0 } },
        { id: 'mb_pewter_5', name: 'Avatar de Pewter', description: '+5 PV/s et +20% PV par rang', icon: 'pewter_avatar', tier: 5, maxRank: 3, prerequisiteID: 'mb_pewter_4', effect: { type: 'hpRegenPerSecond', valuePerRank: 5.0 } },
      ],
    },
    {
      name: 'Brumeux Astucieux',
      description: 'Utilité et contrôle',
      talents: [
        { id: 'mb_utility_1', name: 'Cuivre Étendu', description: '+30% durée des statuts', icon: 'copper_cloud', tier: 1, maxRank: 5, prerequisiteID: null, effect: { type: 'statusDurationPercent', valuePerRank: 0.30 } },
        { id: 'mb_utility_2', name: 'Zinc Intense', description: '+100% rayon de zone', icon: 'zinc_riot', tier: 2, maxRank: 4, prerequisiteID: 'mb_utility_1', effect: { type: 'aoeRadiusPercent', valuePerRank: 1.0 } },
        { id: 'mb_utility_3', name: 'Réserves Profondes', description: '-15% coût en Investiture', icon: 'deep_reserves', tier: 3, maxRank: 3, prerequisiteID: 'mb_utility_2', effect: { type: 'investitureCostReduction', valuePerRank: 0.15 } },
        { id: 'mb_utility_4', name: 'Maelstrom Allomantique', description: '-50% temps de recharge', icon: 'maelstrom', tier: 4, maxRank: 2, prerequisiteID: 'mb_utility_3', effect: { type: 'cooldownReduction', valuePerRank: 0.50 } },
        { id: 'mb_utility_5', name: 'Pleine Brume', description: '+8 Investiture/s par rang', icon: 'full_mist', tier: 5, maxRank: 3, prerequisiteID: 'mb_utility_4', effect: { type: 'investitureRegenPerSecond', valuePerRank: 8.0 } },
      ],
    },
  ],
};

// ─── Radiant ──────────────────────────────────────────

const TREE_RADIANT: TalentTree = {
  id: 'tree_radiant',
  championClass: 'Radieux',
  branches: [
    {
      name: 'Maître de la Gravité',
      description: 'Mobilité et dégâts aériens',
      talents: [
        { id: 'rd_grav_1', name: 'Lashage Rapide', description: '-20% temps de recharge', icon: 'lashing', tier: 1, maxRank: 5, prerequisiteID: null, effect: { type: 'cooldownReduction', valuePerRank: 0.20 } },
        { id: 'rd_grav_2', name: 'Vol Prolongé', description: '+50% durée des statuts', icon: 'flight', tier: 2, maxRank: 4, prerequisiteID: 'rd_grav_1', effect: { type: 'statusDurationPercent', valuePerRank: 0.50 } },
        { id: 'rd_grav_3', name: 'Chute Dévastatrice', description: '+40% dégâts magiques', icon: 'devastation', tier: 3, maxRank: 3, prerequisiteID: 'rd_grav_2', effect: { type: 'magicDamagePercent', valuePerRank: 0.40 } },
        { id: 'rd_grav_4', name: 'Maître des Cieux', description: '+50% vitesse de déplacement', icon: 'sky_master', tier: 4, maxRank: 2, prerequisiteID: 'rd_grav_3', effect: { type: 'movementSpeedPercent', valuePerRank: 0.50 } },
        { id: 'rd_grav_5', name: 'Seigneur du Ciel', description: '+20% dégâts magiques par rang', icon: 'sky_lord', tier: 5, maxRank: 3, prerequisiteID: 'rd_grav_4', effect: { type: 'magicDamagePercent', valuePerRank: 0.20 } },
      ],
    },
    {
      name: 'Gardien Radieux',
      description: 'Protection et soutien',
      talents: [
        { id: 'rd_guard_1', name: 'Bouclier Lumineux', description: '+7% réduction de dégâts', icon: 'light_shield', tier: 1, maxRank: 5, prerequisiteID: null, effect: { type: 'damageReductionPercent', valuePerRank: 0.07 } },
        { id: 'rd_guard_2', name: 'Aura Protectrice', description: '+20% dégâts compagnon', icon: 'aura', tier: 2, maxRank: 4, prerequisiteID: 'rd_guard_1', effect: { type: 'companionDamagePercent', valuePerRank: 0.20 } },
        { id: 'rd_guard_3', name: 'Lumière Régénérative', description: '+3 PV/s régén.', icon: 'regen_light', tier: 3, maxRank: 3, prerequisiteID: 'rd_guard_2', effect: { type: 'hpRegenPerSecond', valuePerRank: 3.0 } },
        { id: 'rd_guard_4', name: 'Serment Inébranlable', description: '+15% réduction de dégâts', icon: 'oath', tier: 4, maxRank: 2, prerequisiteID: 'rd_guard_3', effect: { type: 'damageReductionPercent', valuePerRank: 0.15 } },
        { id: 'rd_guard_5', name: 'Serment Éternel', description: '+10% réduction dégâts par rang', icon: 'eternal_oath', tier: 5, maxRank: 3, prerequisiteID: 'rd_guard_4', effect: { type: 'damageReductionPercent', valuePerRank: 0.10 } },
      ],
    },
    {
      name: 'Porte-Lumière',
      description: 'Maîtrise de la Lumière d\'Orage',
      talents: [
        { id: 'rd_light_1', name: 'Réserves Profondes', description: '+15% Investiture max', icon: 'reserves', tier: 1, maxRank: 5, prerequisiteID: null, effect: { type: 'bonusInvestiture', valuePerRank: 0.15 } },
        { id: 'rd_light_2', name: 'Absorption d\'Orage', description: '+5 Investiture/s', icon: 'storm_absorb', tier: 2, maxRank: 4, prerequisiteID: 'rd_light_1', effect: { type: 'investitureRegenPerSecond', valuePerRank: 5.0 } },
        { id: 'rd_light_3', name: 'Éclat de Lumière', description: '+25% dégâts magiques', icon: 'light_burst', tier: 3, maxRank: 3, prerequisiteID: 'rd_light_2', effect: { type: 'magicDamagePercent', valuePerRank: 0.25 } },
        { id: 'rd_light_4', name: 'Avatar de Lumière', description: '+200% dégâts d\'attaque', icon: 'avatar', tier: 4, maxRank: 2, prerequisiteID: 'rd_light_3', effect: { type: 'attackDamagePercent', valuePerRank: 2.0 } },
        { id: 'rd_light_5', name: 'Lumière Infinie', description: '+8 Investiture/s par rang', icon: 'infinite_light', tier: 5, maxRank: 3, prerequisiteID: 'rd_light_4', effect: { type: 'investitureRegenPerSecond', valuePerRank: 8.0 } },
      ],
    },
  ],
};

// ─── Awakener ──────────────────────────────────────────

const TREE_AWAKENER: TalentTree = {
  id: 'tree_awakener',
  championClass: 'Éveilleur',
  branches: [
    {
      name: 'Maître des Souffles',
      description: 'Soutien et amélioration',
      talents: [
        { id: 'aw_breath_1', name: 'Souffle Efficient', description: '-15% coût Investiture', icon: 'efficient_breath', tier: 1, maxRank: 5, prerequisiteID: null, effect: { type: 'investitureCostReduction', valuePerRank: 0.15 } },
        { id: 'aw_breath_2', name: 'Objets Éveillés Durables', description: '+50% durée des statuts', icon: 'durable_awaken', tier: 2, maxRank: 4, prerequisiteID: 'aw_breath_1', effect: { type: 'statusDurationPercent', valuePerRank: 0.50 } },
        { id: 'aw_breath_3', name: 'Aura de Couleur', description: '+30% dégâts magiques', icon: 'color_aura', tier: 3, maxRank: 3, prerequisiteID: 'aw_breath_2', effect: { type: 'magicDamagePercent', valuePerRank: 0.30 } },
        { id: 'aw_breath_4', name: 'Dixième Exaltation', description: '+50% dégâts d\'attaque', icon: 'tenth_heightening', tier: 4, maxRank: 2, prerequisiteID: 'aw_breath_3', effect: { type: 'attackDamagePercent', valuePerRank: 0.50 } },
        { id: 'aw_breath_5', name: 'Éveilleur Suprême', description: '+15% dégâts magiques par rang', icon: 'supreme_awakener', tier: 5, maxRank: 3, prerequisiteID: 'aw_breath_4', effect: { type: 'magicDamagePercent', valuePerRank: 0.15 } },
      ],
    },
    {
      name: 'Commandeur Éveillé',
      description: 'Invocations et dégâts',
      talents: [
        { id: 'aw_cmd_1', name: 'Armes Éveillées', description: '+20% dégâts d\'attaque', icon: 'awaken_weapon', tier: 1, maxRank: 5, prerequisiteID: null, effect: { type: 'attackDamagePercent', valuePerRank: 0.20 } },
        { id: 'aw_cmd_2', name: 'Compagnons Sans-Vie', description: '+25% dégâts compagnon', icon: 'lifeless', tier: 2, maxRank: 4, prerequisiteID: 'aw_cmd_1', effect: { type: 'companionDamagePercent', valuePerRank: 0.25 } },
        { id: 'aw_cmd_3', name: 'Commandement Royal', description: '-30% temps de recharge', icon: 'royal_cmd', tier: 3, maxRank: 3, prerequisiteID: 'aw_cmd_2', effect: { type: 'cooldownReduction', valuePerRank: 0.30 } },
        { id: 'aw_cmd_4', name: 'Souffle Divin', description: '+100% dégâts d\'attaque', icon: 'divine_breath', tier: 4, maxRank: 2, prerequisiteID: 'aw_cmd_3', effect: { type: 'attackDamagePercent', valuePerRank: 1.0 } },
        { id: 'aw_cmd_5', name: 'Armée Sans-Vie', description: '+30% dégâts compagnon par rang', icon: 'lifeless_army', tier: 5, maxRank: 3, prerequisiteID: 'aw_cmd_4', effect: { type: 'companionDamagePercent', valuePerRank: 0.30 } },
      ],
    },
    {
      name: 'Voleur de Couleurs',
      description: 'Utilité et survie',
      talents: [
        { id: 'aw_thief_1', name: 'Drain Chromatique', description: '+10% vol de vie', icon: 'color_drain', tier: 1, maxRank: 5, prerequisiteID: null, effect: { type: 'lifestealPercent', valuePerRank: 0.10 } },
        { id: 'aw_thief_2', name: 'Évanescence', description: '+15% chance d\'esquive', icon: 'evanescence', tier: 2, maxRank: 4, prerequisiteID: 'aw_thief_1', effect: { type: 'dodgeChancePercent', valuePerRank: 0.15 } },
        { id: 'aw_thief_3', name: 'Butin Chromatique', description: '+20% bonus or', icon: 'color_loot', tier: 3, maxRank: 3, prerequisiteID: 'aw_thief_2', effect: { type: 'goldBonusPercent', valuePerRank: 0.20 } },
        { id: 'aw_thief_4', name: 'Vol de Pouvoir', description: '-40% temps de recharge', icon: 'power_theft', tier: 4, maxRank: 2, prerequisiteID: 'aw_thief_3', effect: { type: 'cooldownReduction', valuePerRank: 0.40 } },
        { id: 'aw_thief_5', name: 'Drain Total', description: '+12% vol de vie par rang', icon: 'total_drain', tier: 5, maxRank: 3, prerequisiteID: 'aw_thief_4', effect: { type: 'lifestealPercent', valuePerRank: 0.12 } },
      ],
    },
  ],
};

// ─── Elantrian ──────────────────────────────────────────

const TREE_ELANTRIAN: TalentTree = {
  id: 'tree_elantrian',
  championClass: 'Élantrien',
  branches: [
    {
      name: 'Maître des Aons',
      description: 'Dégâts magiques',
      talents: [
        { id: 'el_aon_1', name: 'Aon Puissant', description: '+15% dégâts magiques', icon: 'aon_power', tier: 1, maxRank: 5, prerequisiteID: null, effect: { type: 'magicDamagePercent', valuePerRank: 0.15 } },
        { id: 'el_aon_2', name: 'Combinaisons d\'Aons', description: '+25% rayon de zone', icon: 'aon_combo', tier: 2, maxRank: 4, prerequisiteID: 'el_aon_1', effect: { type: 'aoeRadiusPercent', valuePerRank: 0.25 } },
        { id: 'el_aon_3', name: 'Aon Rao Guérisseur', description: '+5 PV/s régén.', icon: 'aon_heal', tier: 3, maxRank: 3, prerequisiteID: 'el_aon_2', effect: { type: 'hpRegenPerSecond', valuePerRank: 5.0 } },
        { id: 'el_aon_4', name: 'Grand Aon', description: '+60% dégâts magiques', icon: 'grand_aon', tier: 4, maxRank: 2, prerequisiteID: 'el_aon_3', effect: { type: 'magicDamagePercent', valuePerRank: 0.60 } },
        { id: 'el_aon_5', name: 'Grand Maître', description: '+25% dégâts magiques par rang', icon: 'grand_master', tier: 5, maxRank: 3, prerequisiteID: 'el_aon_4', effect: { type: 'magicDamagePercent', valuePerRank: 0.25 } },
      ],
    },
    {
      name: 'Gardien d\'Elantris',
      description: 'Tank et défense',
      talents: [
        { id: 'el_guard_1', name: 'Résistance Élantrisée', description: '+8% réduction dégâts', icon: 'elantris_resist', tier: 1, maxRank: 5, prerequisiteID: null, effect: { type: 'damageReductionPercent', valuePerRank: 0.08 } },
        { id: 'el_guard_2', name: 'Bouclier d\'Aon', description: '+15% PV max', icon: 'aon_shield', tier: 2, maxRank: 4, prerequisiteID: 'el_guard_1', effect: { type: 'bonusHP', valuePerRank: 0.15 } },
        { id: 'el_guard_3', name: 'Régénération Aonique', description: '+3 PV/s régén.', icon: 'aon_regen', tier: 3, maxRank: 3, prerequisiteID: 'el_guard_2', effect: { type: 'hpRegenPerSecond', valuePerRank: 3.0 } },
        { id: 'el_guard_4', name: 'Restauration d\'Elantris', description: '+100% réduction dégâts', icon: 'restoration', tier: 4, maxRank: 2, prerequisiteID: 'el_guard_3', effect: { type: 'damageReductionPercent', valuePerRank: 1.0 } },
        { id: 'el_guard_5', name: 'Mur d\'Elantris', description: '+5 PV/s par rang', icon: 'elantris_wall', tier: 5, maxRank: 3, prerequisiteID: 'el_guard_4', effect: { type: 'hpRegenPerSecond', valuePerRank: 5.0 } },
      ],
    },
    {
      name: 'Érudit du Dor',
      description: 'Investiture et utilité',
      talents: [
        { id: 'el_dor_1', name: 'Réserves du Dor', description: '+15% Investiture max', icon: 'dor_reserves', tier: 1, maxRank: 5, prerequisiteID: null, effect: { type: 'bonusInvestiture', valuePerRank: 0.15 } },
        { id: 'el_dor_2', name: 'Efficacité Aonique', description: '-20% coût Investiture', icon: 'aon_efficiency', tier: 2, maxRank: 4, prerequisiteID: 'el_dor_1', effect: { type: 'investitureCostReduction', valuePerRank: 0.20 } },
        { id: 'el_dor_3', name: 'Régénération du Dor', description: '+4 Investiture/s', icon: 'dor_regen', tier: 3, maxRank: 3, prerequisiteID: 'el_dor_2', effect: { type: 'investitureRegenPerSecond', valuePerRank: 4.0 } },
        { id: 'el_dor_4', name: 'Canalisation du Dor', description: '+10 Investiture/s', icon: 'dor_channel', tier: 4, maxRank: 2, prerequisiteID: 'el_dor_3', effect: { type: 'investitureRegenPerSecond', valuePerRank: 10.0 } },
        { id: 'el_dor_5', name: 'Source du Dor', description: '+12 Investiture/s par rang', icon: 'dor_source', tier: 5, maxRank: 3, prerequisiteID: 'el_dor_4', effect: { type: 'investitureRegenPerSecond', valuePerRank: 12.0 } },
      ],
    },
  ],
};

// ─── Sand Master ──────────────────────────────────────────

const TREE_SANDMASTER: TalentTree = {
  id: 'tree_sandmaster',
  championClass: 'Maître du Sable',
  branches: [
    {
      name: 'Fouet de Sable',
      description: 'Mêlée et dégâts',
      talents: [
        { id: 'sm_whip_1', name: 'Frappe de Sable', description: '+15% dégâts d\'attaque', icon: 'sand_strike', tier: 1, maxRank: 5, prerequisiteID: null, effect: { type: 'attackDamagePercent', valuePerRank: 0.15 } },
        { id: 'sm_whip_2', name: 'Vitesse du Sable', description: '+20% vitesse d\'attaque', icon: 'sand_speed', tier: 2, maxRank: 4, prerequisiteID: 'sm_whip_1', effect: { type: 'attackSpeedPercent', valuePerRank: 0.20 } },
        { id: 'sm_whip_3', name: 'Frappe Critique', description: '+15% chance de critique', icon: 'crit_strike', tier: 3, maxRank: 3, prerequisiteID: 'sm_whip_2', effect: { type: 'critChancePercent', valuePerRank: 0.15 } },
        { id: 'sm_whip_4', name: 'Tempête de Sable', description: '+50% dégâts magiques', icon: 'sand_storm', tier: 4, maxRank: 2, prerequisiteID: 'sm_whip_3', effect: { type: 'magicDamagePercent', valuePerRank: 0.50 } },
        { id: 'sm_whip_5', name: 'Maître du Désert', description: '+20% dégâts magiques par rang', icon: 'desert_master', tier: 5, maxRank: 3, prerequisiteID: 'sm_whip_4', effect: { type: 'magicDamagePercent', valuePerRank: 0.20 } },
      ],
    },
    {
      name: 'Bouclier de Sable',
      description: 'Défense',
      talents: [
        { id: 'sm_shield_1', name: 'Armure de Sable', description: '+10% réduction dégâts', icon: 'sand_armor', tier: 1, maxRank: 5, prerequisiteID: null, effect: { type: 'damageReductionPercent', valuePerRank: 0.10 } },
        { id: 'sm_shield_2', name: 'Bouclier Absorbant', description: '+12% PV max', icon: 'absorb_shield', tier: 2, maxRank: 4, prerequisiteID: 'sm_shield_1', effect: { type: 'bonusHP', valuePerRank: 0.12 } },
        { id: 'sm_shield_3', name: 'Contre-Attaque de Sable', description: '+30% dégâts critiques', icon: 'counter', tier: 3, maxRank: 3, prerequisiteID: 'sm_shield_2', effect: { type: 'critDamagePercent', valuePerRank: 0.30 } },
        { id: 'sm_shield_4', name: 'Cocon Impénétrable', description: '+15% bouclier au kill', icon: 'cocoon', tier: 4, maxRank: 2, prerequisiteID: 'sm_shield_3', effect: { type: 'shieldOnKill', valuePerRank: 0.15 } },
        { id: 'sm_shield_5', name: 'Forteresse de Sable', description: '+10% réduction dégâts par rang', icon: 'sand_fortress', tier: 5, maxRank: 3, prerequisiteID: 'sm_shield_4', effect: { type: 'damageReductionPercent', valuePerRank: 0.10 } },
      ],
    },
    {
      name: 'Maître de l\'Eau',
      description: 'Ressources et endurance',
      talents: [
        { id: 'sm_water_1', name: 'Conservation d\'Eau', description: '-15% coût Investiture', icon: 'water_save', tier: 1, maxRank: 5, prerequisiteID: null, effect: { type: 'investitureCostReduction', valuePerRank: 0.15 } },
        { id: 'sm_water_2', name: 'Source Cachée', description: '+3 Investiture/s', icon: 'hidden_spring', tier: 2, maxRank: 4, prerequisiteID: 'sm_water_1', effect: { type: 'investitureRegenPerSecond', valuePerRank: 3.0 } },
        { id: 'sm_water_3', name: 'Marcheur du Désert', description: '+15% vitesse de déplacement', icon: 'desert_walk', tier: 3, maxRank: 3, prerequisiteID: 'sm_water_2', effect: { type: 'movementSpeedPercent', valuePerRank: 0.15 } },
        { id: 'sm_water_4', name: 'Oasis', description: '+8 PV/s régén.', icon: 'oasis', tier: 4, maxRank: 2, prerequisiteID: 'sm_water_3', effect: { type: 'hpRegenPerSecond', valuePerRank: 8.0 } },
        { id: 'sm_water_5', name: 'Source Éternelle', description: '+6 Investiture/s par rang', icon: 'eternal_spring', tier: 5, maxRank: 3, prerequisiteID: 'sm_water_4', effect: { type: 'investitureRegenPerSecond', valuePerRank: 6.0 } },
      ],
    },
  ],
};

// ─── Nightmare Painter ──────────────────────────────────────────

const TREE_NIGHTMAREPAINTER: TalentTree = {
  id: 'tree_nightmarepainter',
  championClass: 'Peintre de Cauchemars',
  branches: [
    {
      name: 'Peintre de Combat',
      description: 'Dégâts magiques',
      talents: [
        { id: 'np_paint_1', name: 'Peinture Puissante', description: '+15% dégâts magiques', icon: 'power_paint', tier: 1, maxRank: 5, prerequisiteID: null, effect: { type: 'magicDamagePercent', valuePerRank: 0.15 } },
        { id: 'np_paint_2', name: 'Encre Efficiente', description: '-20% coût Investiture', icon: 'ink_efficient', tier: 2, maxRank: 4, prerequisiteID: 'np_paint_1', effect: { type: 'investitureCostReduction', valuePerRank: 0.20 } },
        { id: 'np_paint_3', name: 'Créatures Peintes', description: '+40% rayon de zone', icon: 'painted_creatures', tier: 3, maxRank: 3, prerequisiteID: 'np_paint_2', effect: { type: 'aoeRadiusPercent', valuePerRank: 0.40 } },
        { id: 'np_paint_4', name: 'Chef-d\'Œuvre', description: '+100% dégâts d\'attaque', icon: 'masterpiece', tier: 4, maxRank: 2, prerequisiteID: 'np_paint_3', effect: { type: 'attackDamagePercent', valuePerRank: 1.0 } },
        { id: 'np_paint_5', name: 'Peintre Divin', description: '+20% dégâts magiques par rang', icon: 'divine_painter', tier: 5, maxRank: 3, prerequisiteID: 'np_paint_4', effect: { type: 'magicDamagePercent', valuePerRank: 0.20 } },
      ],
    },
    {
      name: 'Empileur de Pierres',
      description: 'Soutien et soins',
      talents: [
        { id: 'np_stone_1', name: 'Pierres Curatives', description: '+2 PV/s régén.', icon: 'heal_stones', tier: 1, maxRank: 5, prerequisiteID: null, effect: { type: 'hpRegenPerSecond', valuePerRank: 2.0 } },
        { id: 'np_stone_2', name: 'Bénédiction Durable', description: '+25% durée des statuts', icon: 'lasting_blessing', tier: 2, maxRank: 4, prerequisiteID: 'np_stone_1', effect: { type: 'statusDurationPercent', valuePerRank: 0.25 } },
        { id: 'np_stone_3', name: 'Esprit Allié', description: '+30% dégâts compagnon', icon: 'spirit_ally', tier: 3, maxRank: 3, prerequisiteID: 'np_stone_2', effect: { type: 'companionDamagePercent', valuePerRank: 0.30 } },
        { id: 'np_stone_4', name: 'Maîtrise Yoki-hijo', description: '-40% temps de recharge', icon: 'yoki_mastery', tier: 4, maxRank: 2, prerequisiteID: 'np_stone_3', effect: { type: 'cooldownReduction', valuePerRank: 0.40 } },
        { id: 'np_stone_5', name: 'Pyramide Sacrée', description: '+5 PV/s par rang', icon: 'sacred_pyramid', tier: 5, maxRank: 3, prerequisiteID: 'np_stone_4', effect: { type: 'hpRegenPerSecond', valuePerRank: 5.0 } },
      ],
    },
    {
      name: 'Marcheur de Cauchemars',
      description: 'Débuffs et contrôle',
      talents: [
        { id: 'np_walk_1', name: 'Terreur Prolongée', description: '+20% durée des statuts', icon: 'terror', tier: 1, maxRank: 5, prerequisiteID: null, effect: { type: 'statusDurationPercent', valuePerRank: 0.20 } },
        { id: 'np_walk_2', name: 'Peur Affaiblissante', description: '+10% chance de critique', icon: 'fear_weaken', tier: 2, maxRank: 4, prerequisiteID: 'np_walk_1', effect: { type: 'critChancePercent', valuePerRank: 0.10 } },
        { id: 'np_walk_3', name: 'Absorption de Cauchemar', description: '+15% vol de vie', icon: 'nightmare_absorb', tier: 3, maxRank: 3, prerequisiteID: 'np_walk_2', effect: { type: 'lifestealPercent', valuePerRank: 0.15 } },
        { id: 'np_walk_4', name: 'Entrée dans le Voile', description: '+60% dégâts magiques', icon: 'veil_entry', tier: 4, maxRank: 2, prerequisiteID: 'np_walk_3', effect: { type: 'magicDamagePercent', valuePerRank: 0.60 } },
        { id: 'np_walk_5', name: 'Roi des Cauchemars', description: '+25% dégâts magiques par rang', icon: 'nightmare_king', tier: 5, maxRank: 3, prerequisiteID: 'np_walk_4', effect: { type: 'magicDamagePercent', valuePerRank: 0.25 } },
      ],
    },
  ],
};

// ─── Registry ──────────────────────────────────────────

import type { ChampionClass } from '@/data/types';

const TALENT_TREES: Record<ChampionClass, TalentTree> = {
  mistborn: TREE_MISTBORN,
  radiant: TREE_RADIANT,
  awakener: TREE_AWAKENER,
  elantrian: TREE_ELANTRIAN,
  sandMaster: TREE_SANDMASTER,
  nightmarePainter: TREE_NIGHTMAREPAINTER,
};

export function getTalentTree(championClass: ChampionClass): TalentTree {
  return TALENT_TREES[championClass];
}

export function getAllTalentTrees(): TalentTree[] {
  return Object.values(TALENT_TREES);
}
