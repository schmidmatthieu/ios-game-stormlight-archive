// Shared types mirroring the Swift data models

export type WorldID = string;

export type MagicSystemType = 'allomancy' | 'surgebinding' | 'awakening' | 'aonDor' | 'sandMastery' | 'painting';

export type ChampionClass = 'mistborn' | 'radiant' | 'awakener' | 'elantrian' | 'sandMaster' | 'nightmarePainter';

export type RadiantOrder = 'windrunner' | 'lightweaver' | 'bondsmith' | 'edgedancer';

export type EnemyTier = 'minion' | 'soldier' | 'elite' | 'boss';

export type AIBehavior = 'patrol' | 'wander' | 'guard' | 'ambush' | 'ranged' | 'berserk' | 'support';

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'cosmeric';

export type EquipmentSlot = 'helmet' | 'shoulders' | 'chest' | 'cape' | 'gloves' | 'belt' | 'legs' | 'boots' | 'mainWeapon' | 'offhand' | 'amulet' | 'ring1' | 'ring2';

export type ZoneType = 'hub' | 'exploration' | 'boss';

export type SkillTargeting = 'selfOnly' | 'singleEnemy' | 'singleAlly' | 'areaOfEffect' | 'directional' | 'global';

export type DamageType = 'physical' | 'allomantic' | 'stormlight' | 'biochromatic' | 'aonic';

export type StatusEffectType = 'poisoned' | 'burning' | 'slowed' | 'stunned' | 'enraged' | 'calmed' | 'revealed' | 'invisible' | 'flying' | 'healing' | 'shielded';

export type WeatherEffect = 'none' | 'ashfall' | 'mist' | 'highstorm' | 'everstorm' | 'rain' | 'colorDrain' | 'aonGlow' | 'sandstorm' | 'eternalSun' | 'eternalNight' | 'hionFlicker' | 'nightmareAura';

// Interfaces

export interface GridPosition {
  col: number;
  row: number;
}

export interface StatBonus {
  stat: string;
  value: number;
}

export interface ItemTrait {
  id: string;
  name: string;
  description: string;
  effectType: string;
  effectValue: number;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  rarity: ItemRarity;
  slot: EquipmentSlot;
  requiredLevel: number;
  statBonuses: StatBonus[];
  traits: ItemTrait[];
  spriteName: string;
  worldOrigin: WorldID | null;
}

export interface LootEntry {
  itemID: string;
  dropChance: number;
  minQuantity: number;
  maxQuantity: number;
}

export interface Enemy {
  id: string;
  name: string;
  description: string;
  worldID: WorldID;
  tier: EnemyTier;
  level: number;
  maxHP: number;
  damage: number;
  defense: number;
  speed: number;
  detectionRange: number;
  attackRange: number;
  behavior: AIBehavior;
  abilities: string[];
  spriteName: string;
  spriteScale: number;
  xpReward: number;
  goldMin: number;
  goldMax: number;
  lootTable: LootEntry[];
}

export interface StatusEffectApplication {
  effectType: StatusEffectType;
  duration: number;
  magnitude: number;
  chance: number;
}

export interface SkillResourceCost {
  resourceType: string;
  amount: number;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  magicSystem: MagicSystemType;
  icon: string;
  targeting: SkillTargeting;
  damageType: DamageType;
  baseDamage: number;
  investitureCost: number;
  cooldown: number;
  range: number;
  areaRadius: number;
  resourceCost: SkillResourceCost | null;
  requiredLevel: number;
  maxRank: number;
  prerequisiteSkillID: string | null;
  statusEffects: StatusEffectApplication[];
}

export interface ZoneConnection {
  targetZoneID: string;
  entryPointName: string;
  exitPosition: GridPosition;
  requiredQuestID: string | null;
}

export interface NPCSpawn {
  npcID: string;
  position: GridPosition;
  dialogueTreeID: string | null;
  isShopkeeper: boolean;
}

export interface EnemySpawn {
  enemyID: string;
  position: GridPosition;
  patrolPath: GridPosition[] | null;
  respawnTime: number | null;
}

export interface LootPoint {
  id: string;
  position: GridPosition;
  lootTable: LootEntry[];
  isHidden: boolean;
  respawns: boolean;
}

export interface Zone {
  id: string;
  name: string;
  description: string;
  worldID: WorldID;
  type: ZoneType;
  gridWidth: number;
  gridHeight: number;
  tileMapFileName: string;
  playerSpawnPosition: GridPosition;
  connections: ZoneConnection[];
  npcSpawns: NPCSpawn[];
  enemySpawns: EnemySpawn[];
  lootPoints: LootPoint[];
  ambientMusicTrack: string | null;
  weatherEffect: WeatherEffect | null;
  recommendedLevel: number;
}

export interface QuestObjective {
  id: string;
  description: string;
  type: string;
  targetID: string;
  requiredCount: number;
  currentCount: number;
}

export interface QuestReward {
  gold: number;
  xp: number;
  itemIDs: string[];
}

export interface Quest {
  id: string;
  name: string;
  description: string;
  worldID: WorldID;
  type: string;
  actNumber: number;
  requiredLevel: number;
  requiredQuestID: string | null;
  objectives: QuestObjective[];
  rewards: QuestReward;
  status: string;
}

// Champion (player state)

export interface EquipmentLoadout {
  helmet: string | null;
  shoulders: string | null;
  chest: string | null;
  cape: string | null;
  gloves: string | null;
  belt: string | null;
  legs: string | null;
  boots: string | null;
  mainWeapon: string | null;
  offhand: string | null;
  amulet: string | null;
  ring1: string | null;
  ring2: string | null;
}

export interface ChampionStats {
  vigor: number;
  investiture: number;
  strength: number;
  agility: number;
  spirit: number;
  luck: number;
}

export interface Champion {
  name: string;
  championClass: ChampionClass;
  radiantOrder: RadiantOrder | null;
  level: number;
  currentXP: number;
  skillPoints: number;
  unlockedSkillIDs: string[];
  equippedSkillIDs: string[];
  baseStats: ChampionStats;
  equipment: EquipmentLoadout;
  inventoryItemIDs: string[];
  currentHP: number;
  currentInvestiture: number;
  gold: number;
  currentWorldID: WorldID;
  currentZoneID: string;
  gridPosition: GridPosition;
  activeQuestIDs: string[];
  completedQuestIDs: string[];
  reputation: Record<WorldID, number>;
}

// Class info mapping
export const CLASS_INFO: Record<ChampionClass, {
  name: string;
  description: string;
  magicSystem: MagicSystemType;
  startingWorld: WorldID;
}> = {
  mistborn:         { name: 'Brumeux',               description: 'Brûle des métaux pour des pouvoirs physiques et mentaux',                          magicSystem: 'allomancy',    startingWorld: 'scadrial' },
  radiant:          { name: 'Radieux',               description: 'Lié à un spren, maîtrise deux Surges alimentées par la Lumière d\'orage',         magicSystem: 'surgebinding', startingWorld: 'roshar' },
  awakener:         { name: 'Éveilleur',             description: 'Anime les objets avec le Souffle et la BioChroma',                                 magicSystem: 'awakening',    startingWorld: 'nalthis' },
  elantrian:        { name: 'Élantrien',             description: 'Dessine des Aons lumineux pour canaliser le Dor',                                  magicSystem: 'aonDor',       startingWorld: 'sel' },
  sandMaster:       { name: 'Maître du Sable',       description: 'Contrôle le sable blanc de Dayside grâce à l\'énergie solaire',                    magicSystem: 'sandMastery',  startingWorld: 'taldain' },
  nightmarePainter: { name: 'Peintre de Cauchemars', description: 'Capture et bannit les cauchemars par la peinture et l\'empilement de pierres',     magicSystem: 'painting',     startingWorld: 'komashi' },
};

export const RARITY_COLORS: Record<ItemRarity, number> = {
  common:    0xaaaaaa,
  uncommon:  0x55cc55,
  rare:      0x5588ee,
  epic:      0x9955ee,
  legendary: 0xee9911,
  cosmeric:  0xee2222,
};
