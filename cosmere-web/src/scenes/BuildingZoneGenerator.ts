// ─── Building Zone Generator ─────────────────────────────────────
// Generates dynamic Zone data for building interiors so they work
// as actual walkable zones with the existing ZoneScene system.

import type { Zone, ZoneConnection, NPCSpawn, EnemySpawn, LootPoint, LootEntry } from '../data/types';
import { gameData } from '../data/DataLoader';

// ─── Building Type Detection ────────────────────────────────────

type BuildingType = 'house' | 'shop' | 'tavern' | 'temple' | 'forge' | 'library' | 'guild_hall';

function detectBuildingType(name: string): BuildingType {
  const n = name.toLowerCase();
  if (n.includes('tavern') || n.includes('auberge')) return 'tavern';
  if (n.includes('temple') || n.includes('sanctuaire') || n.includes('refuge')) return 'temple';
  if (n.includes('forge') || n.includes('forgeron') || n.includes('acier')) return 'forge';
  if (n.includes('biblio') || n.includes('library') || n.includes('salle des')) return 'library';
  if (n.includes('boutique') || n.includes('shop') || n.includes('march') || n.includes('échange')) return 'shop';
  if (n.includes('guilde') || n.includes('guild') || n.includes('cache') || n.includes('bastion')) return 'guild_hall';
  return 'house';
}

// ─── Interior Zone Templates ────────────────────────────────────

interface InteriorTemplate {
  gridWidth: number;
  gridHeight: number;
  npcs: Array<{ id: string; position: { col: number; row: number }; isShopkeeper: boolean }>;
  enemies: Array<{ id: string; position: { col: number; row: number } }>;
  lootPoints: Array<{ position: { col: number; row: number }; rarity: string }>;
}

function getTemplate(buildingType: BuildingType, worldID: string): InteriorTemplate {
  switch (buildingType) {
    case 'tavern':
      return {
        gridWidth: 14, gridHeight: 12,
        npcs: [
          { id: `${worldID}_innkeeper`, position: { col: 7, row: 3 }, isShopkeeper: true },
          { id: `${worldID}_patron`, position: { col: 3, row: 6 }, isShopkeeper: false },
        ],
        enemies: [],
        lootPoints: [
          { position: { col: 11, row: 9 }, rarity: 'common' },
          { position: { col: 2, row: 10 }, rarity: 'uncommon' },
        ],
      };
    case 'shop':
      return {
        gridWidth: 12, gridHeight: 10,
        npcs: [
          { id: `${worldID}_merchant`, position: { col: 6, row: 3 }, isShopkeeper: true },
        ],
        enemies: [],
        lootPoints: [
          { position: { col: 9, row: 7 }, rarity: 'common' },
        ],
      };
    case 'temple':
      return {
        gridWidth: 16, gridHeight: 14,
        npcs: [
          { id: `${worldID}_priest`, position: { col: 8, row: 4 }, isShopkeeper: false },
          { id: `${worldID}_healer`, position: { col: 4, row: 8 }, isShopkeeper: true },
        ],
        enemies: [],
        lootPoints: [
          { position: { col: 12, row: 10 }, rarity: 'rare' },
          { position: { col: 3, row: 12 }, rarity: 'uncommon' },
        ],
      };
    case 'forge':
      return {
        gridWidth: 12, gridHeight: 10,
        npcs: [
          { id: `${worldID}_blacksmith`, position: { col: 6, row: 3 }, isShopkeeper: true },
        ],
        enemies: [],
        lootPoints: [
          { position: { col: 10, row: 8 }, rarity: 'uncommon' },
          { position: { col: 2, row: 7 }, rarity: 'common' },
        ],
      };
    case 'library':
      return {
        gridWidth: 14, gridHeight: 12,
        npcs: [
          { id: `${worldID}_scholar`, position: { col: 7, row: 4 }, isShopkeeper: false },
        ],
        enemies: [],
        lootPoints: [
          { position: { col: 11, row: 9 }, rarity: 'rare' },
          { position: { col: 3, row: 10 }, rarity: 'uncommon' },
          { position: { col: 7, row: 8 }, rarity: 'common' },
        ],
      };
    case 'guild_hall':
      return {
        gridWidth: 16, gridHeight: 14,
        npcs: [
          { id: `${worldID}_guildmaster`, position: { col: 8, row: 3 }, isShopkeeper: false },
          { id: `${worldID}_vendor`, position: { col: 4, row: 6 }, isShopkeeper: true },
        ],
        enemies: [
          { id: getInteriorEnemy(worldID), position: { col: 12, row: 10 } },
        ],
        lootPoints: [
          { position: { col: 13, row: 12 }, rarity: 'rare' },
          { position: { col: 2, row: 11 }, rarity: 'uncommon' },
        ],
      };
    default: // house
      return {
        gridWidth: 10, gridHeight: 8,
        npcs: [
          { id: `${worldID}_resident`, position: { col: 5, row: 3 }, isShopkeeper: false },
        ],
        enemies: [],
        lootPoints: [
          { position: { col: 8, row: 6 }, rarity: 'common' },
        ],
      };
  }
}

// ─── World-Specific Enemy IDs ───────────────────────────────────

function getInteriorEnemy(worldID: string): string {
  const enemies: Record<string, string> = {
    scadrial: 'skaa_thug',
    roshar: 'cremling_swarm',
    nalthis: 'lifeless_guard',
    taldain: 'sand_lurker',
    sel: 'reod_phantom',
    komashi: 'nightmare_wisp',
    shadesmar: 'cognitive_shade',
  };
  return enemies[worldID] ?? 'skaa_thug';
}

// ─── Loot Table Helpers ─────────────────────────────────────────

function buildLootTable(rarity: string): LootEntry[] {
  switch (rarity) {
    case 'rare':
      return [
        { itemID: 'random_rare', dropChance: 0.3, minQuantity: 1, maxQuantity: 1 },
        { itemID: 'random_uncommon', dropChance: 0.6, minQuantity: 1, maxQuantity: 1 },
        { itemID: 'gold_pile', dropChance: 1.0, minQuantity: 15, maxQuantity: 40 },
      ];
    case 'uncommon':
      return [
        { itemID: 'random_uncommon', dropChance: 0.4, minQuantity: 1, maxQuantity: 1 },
        { itemID: 'random_common', dropChance: 0.7, minQuantity: 1, maxQuantity: 2 },
        { itemID: 'gold_pile', dropChance: 1.0, minQuantity: 8, maxQuantity: 20 },
      ];
    default:
      return [
        { itemID: 'random_common', dropChance: 0.5, minQuantity: 1, maxQuantity: 2 },
        { itemID: 'gold_pile', dropChance: 1.0, minQuantity: 5, maxQuantity: 12 },
      ];
  }
}

// ─── Generate Interior Zone ─────────────────────────────────────

export function generateBuildingZone(
  buildingName: string,
  worldID: string,
  parentZoneID: string,
  exitCol: number,
  exitRow: number,
): Zone {
  const buildingType = detectBuildingType(buildingName);
  const template = getTemplate(buildingType, worldID);

  // Unique zone ID from building name
  const safeID = buildingName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const zoneID = `interior_${parentZoneID}_${safeID}`;

  // Player spawns near the exit (bottom of the map)
  const spawnCol = Math.floor(template.gridWidth / 2);
  const spawnRow = template.gridHeight - 2;

  // Connection back to parent zone
  const exitConnection: ZoneConnection = {
    targetZoneID: parentZoneID,
    entryPointName: 'building_exit',
    exitPosition: { col: spawnCol, row: spawnRow + 1 },
    requiredQuestID: null,
  };

  // NPC spawns
  const npcSpawns: NPCSpawn[] = template.npcs.map(npc => ({
    npcID: npc.id,
    position: npc.position,
    dialogueTreeID: null,
    isShopkeeper: npc.isShopkeeper,
  }));

  // Enemy spawns
  const enemySpawns: EnemySpawn[] = template.enemies.map(e => ({
    enemyID: e.id,
    position: e.position,
    patrolPath: null,
    respawnTime: null,
  }));

  // Loot points
  const lootPoints: LootPoint[] = template.lootPoints.map((lp, i) => ({
    id: `${zoneID}_loot_${i}`,
    position: lp.position,
    lootTable: buildLootTable(lp.rarity),
    isHidden: lp.rarity === 'rare',
    respawns: false,
  }));

  const zone: Zone = {
    id: zoneID,
    name: buildingName,
    description: `Intérieur de ${buildingName}`,
    worldID,
    type: 'hub',
    gridWidth: template.gridWidth,
    gridHeight: template.gridHeight,
    tileMapFileName: `interior_${buildingType}`,
    playerSpawnPosition: { col: spawnCol, row: spawnRow },
    connections: [exitConnection],
    npcSpawns,
    enemySpawns,
    lootPoints,
    ambientMusicTrack: null,
    weatherEffect: null,
    recommendedLevel: 1,
  };

  return zone;
}

// ─── Register and Transition ────────────────────────────────────

/**
 * Creates a building interior zone, registers it in gameData,
 * and returns the zone ID for transition.
 */
export function registerBuildingZone(
  buildingName: string,
  worldID: string,
  parentZoneID: string,
  buildingCol: number,
  buildingRow: number,
): string {
  const zone = generateBuildingZone(buildingName, worldID, parentZoneID, buildingCol, buildingRow);

  // Register in game data so ZoneScene can load it
  gameData.zones.set(zone.id, zone);

  // Also ensure the parent zone has a connection to this interior
  // (so checkZoneExit won't be confused - we handle entry via enterBuilding)

  return zone.id;
}
