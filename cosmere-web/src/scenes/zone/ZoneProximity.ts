// ─── Zone Proximity — detect nearby interactables ────────────────
// Extracted from ZoneScene for modularity.

import { Container, Graphics } from 'pixi.js';
import { GameManager } from '../../game/GameManager';
import { NewGamePlusManager } from '../../systems/NewGamePlus';
import { HiddenQuestManager } from '../../systems/HiddenQuests';
import { MusicManager } from '../../game/MusicSystem';
import { gameData } from '../../data/DataLoader';
import { revealSecret } from '../../rendering/MapStructures';
import { checkTrapTrigger, createEnvironmentSprite } from '../../systems/EnvironmentInteractions';
import { findNearbyNode, updateGatheringNodes } from '../../systems/GatheringNodes';
import { isoToScreen, screenToIso } from './ZoneTypes';
import type { EnvironmentObject } from '../../systems/EnvironmentInteractions';
import type { GatheringNode } from '../../systems/GatheringNodes';
import type { ZoneConnection } from '../../data/types';
import type { NPCInstance, LootInstance } from './ZoneTypes';
import type { SecretArea, EnterableBuilding } from '../../rendering/MapStructures';
import type { ActionMode } from '../../ui/ActionButtons';

// ─── Result Interface ───────────────────────────────────────────

export interface ProximityResult {
  nearbyNPC: NPCInstance | null;
  nearbyExit: ZoneConnection | null;
  nearbyLoot: LootInstance | null;
  nearbyBuilding: EnterableBuilding | null;
  nearbySecret: SecretArea | null;
  nearbyEnvObject: EnvironmentObject | null;
  nearbyGatherNode: GatheringNode | null;
  mode: ActionMode;
  promptText: string;
}

// ─── Host Interface ─────────────────────────────────────────────

export interface ProximityHost {
  playerScreenPos: { x: number; y: number };
  npcs: NPCInstance[];
  lootPoints: LootInstance[];
  enterableBuildings: EnterableBuilding[];
  secretAreas: SecretArea[];
  environmentObjects: EnvironmentObject[];
  gatheringNodes: GatheringNode[];
  zone: {
    connections: ZoneConnection[];
    worldID: string;
  };
  showFloatingText: (x: number, y: number, msg: string, color: number) => void;
  showDamageNumber: (x: number, y: number, amt: number, crit: boolean, col?: number) => void;
  shakeCamera: (intensity: number, duration: number) => void;
  handlePlayerDeath: () => void;
}

// ─── Check Proximity ────────────────────────────────────────────

export function checkProximity(dt: number, host: ProximityHost): ProximityResult {
  const pp = host.playerScreenPos;
  let nearbyNPC: NPCInstance | null = null;
  let nearbyExit: ZoneConnection | null = null;
  let nearbyLoot: LootInstance | null = null;
  let nearbyBuilding: EnterableBuilding | null = null;
  let nearbySecret: SecretArea | null = null;
  let nearbyEnvObject: EnvironmentObject | null = null;

  // Check NPCs
  let minNPCDist = Infinity;
  for (const npc of host.npcs) {
    const dist = Math.hypot(npc.position.x - pp.x, npc.position.y - pp.y);
    if (dist < 55 && dist < minNPCDist) {
      minNPCDist = dist;
      nearbyNPC = npc;
    }
  }

  // Check zone exits
  let minExitDist = Infinity;
  for (const conn of host.zone.connections) {
    const exitPos = isoToScreen(conn.exitPosition.col, conn.exitPosition.row);
    const dist = Math.hypot(exitPos.x - pp.x, exitPos.y - pp.y);
    if (dist < 55 && dist < minExitDist) {
      minExitDist = dist;
      nearbyExit = conn;
    }
  }

  // Check loot
  let minLootDist = Infinity;
  for (const loot of host.lootPoints) {
    if (loot.collected) continue;
    const dist = Math.hypot(loot.position.x - pp.x, loot.position.y - pp.y);
    if (dist < 55 && dist < minLootDist) {
      minLootDist = dist;
      nearbyLoot = loot;
    }
  }

  // Check enterable buildings
  let minBuildingDist = Infinity;
  for (const b of host.enterableBuildings) {
    const dist = Math.hypot(b.x - pp.x, b.y - pp.y);
    if (dist < b.interactionRadius && dist < minBuildingDist) {
      minBuildingDist = dist;
      nearbyBuilding = b;
    }
  }

  // Check secrets
  for (const s of host.secretAreas) {
    if (s.revealed) continue;
    const dist = Math.hypot(s.x - pp.x, s.y - pp.y);
    if (dist < s.interactionRadius) {
      revealSecret(s, host.zone.worldID);
      host.showFloatingText(s.x, s.y - 20, '✦ Zone secrète découverte!', 0xffdd44);
      nearbySecret = s;
      const hqNotifs = HiddenQuestManager.shared.reportTrigger('visit_secret_area', host.zone.worldID, host.zone.worldID);
      for (const n of hqNotifs) {
        host.showFloatingText(pp.x, pp.y - 70, n.message, n.completed ? 0xffdd44 : 0x88ccff);
      }
    }
  }
  for (const s of host.secretAreas) {
    if (!s.revealed) continue;
    const dist = Math.hypot(s.x - pp.x, s.y - pp.y);
    if (dist < 40) { nearbySecret = s; break; }
  }

  // Check environment objects
  const playerGrid = screenToIso(pp.x, pp.y);
  const pCol = Math.round(playerGrid.col);
  const pRow = Math.round(playerGrid.row);
  for (const obj of host.environmentObjects) {
    if (obj.activated && (obj.type === 'breakable' || obj.type === 'obelisk')) continue;
    const objPos = isoToScreen(obj.position.col, obj.position.row);
    const dist = Math.hypot(objPos.x - pp.x, objPos.y - pp.y);

    if (obj.hidden && dist < 30) { obj.hidden = false; obj.sprite.alpha = 1; }

    if (obj.type === 'spikeTrap' || obj.type === 'poisonVent') {
      const trapResult = checkTrapTrigger(obj, pCol, pRow, dt);
      if (trapResult) {
        const trapDmgMult = NewGamePlusManager.shared.getDifficulty().trapDamageMult;
        const champ = GameManager.shared.champion;
        if (champ) {
          const dmg = Math.floor(trapResult.damage * trapDmgMult);
          champ.currentHP -= dmg;
          host.showDamageNumber(pp.x, pp.y - 40, dmg, false, 0xff4444);
          MusicManager.shared.playSFX(trapResult.sfx);
          if (trapResult.message) host.showFloatingText(pp.x, pp.y - 55, trapResult.message, 0xff6644);
          host.shakeCamera(2, 0.1);
          if (champ.currentHP <= 0) { champ.currentHP = 0; host.handlePlayerDeath(); }
        }
        obj.sprite.removeChildren();
        const newSprite = createEnvironmentSprite(obj);
        for (const child of newSprite.children) obj.sprite.addChild(child);
      }
    }

    if (dist < 45 && (obj.type === 'lever' || obj.type === 'breakable' || obj.type === 'obelisk' || obj.type === 'pushBlock')) {
      nearbyEnvObject = obj;
    }
  }

  // Check gathering nodes
  const nearbyGatherNode = findNearbyNode(pp, host.gatheringNodes);
  updateGatheringNodes(host.gatheringNodes, dt);

  // Determine mode
  let mode: ActionMode = 'attack';
  let promptText = '';
  if (nearbyNPC && minNPCDist < minExitDist && minNPCDist < minLootDist) {
    mode = 'talk';
    promptText = nearbyNPC.isShopkeeper ? 'Ouvrir la boutique' : 'Parler';
  } else if (nearbyBuilding && minBuildingDist < minExitDist) {
    mode = 'enter';
    promptText = nearbyBuilding.name;
  } else if (nearbyExit && minExitDist < minLootDist) {
    mode = 'enter';
    const targetZone = gameData.zone(nearbyExit.targetZoneID);
    promptText = `→ ${targetZone?.name ?? nearbyExit.targetZoneID}`;
  } else if (nearbySecret) {
    mode = 'loot';
    promptText = nearbySecret.type === 'treasure' ? 'Ouvrir le coffre'
      : nearbySecret.type === 'shrine' ? 'Prier au sanctuaire' : 'Explorer';
  } else if (nearbyGatherNode) {
    mode = 'loot';
    const nodeLabels: Record<string, string> = {
      mining: 'Miner', herbalism: 'Récolter', woodcutting: 'Couper', skinning: 'Dépecer', enchanting: 'Canaliser',
    };
    promptText = nodeLabels[nearbyGatherNode.type] ?? 'Récolter';
  } else if (nearbyEnvObject) {
    mode = 'loot';
    const typeLabels: Record<string, string> = {
      lever: 'Actionner le levier', breakable: 'Briser', obelisk: 'Examiner', pushBlock: 'Pousser',
    };
    promptText = typeLabels[nearbyEnvObject.type] ?? 'Interagir';
  } else if (nearbyLoot) {
    mode = 'loot';
    promptText = 'Ramasser';
  }

  return { nearbyNPC, nearbyExit, nearbyLoot, nearbyBuilding, nearbySecret, nearbyEnvObject, nearbyGatherNode, mode, promptText };
}
