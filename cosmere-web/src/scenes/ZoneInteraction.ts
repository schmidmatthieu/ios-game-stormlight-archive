// ─── Zone Interaction (proximity detection, interact prompt) ─────

import { Text, TextStyle } from 'pixi.js';
import type { Container } from 'pixi.js';
import { gameData } from '../data/DataLoader';
import { isoToScreen } from './IsoUtils';
import { revealSecret } from '../rendering/MapStructures';
import type { EnterableBuilding, SecretArea } from '../rendering/MapStructures';
import type { ZoneConnection } from '../data/types';
import type { EnemyInstance, NPCInstance, LootInstance } from './ZoneTypes';
import type { VisualEffects } from './VisualEffects';
import type { ActionButtons, ActionMode } from '../ui/ActionButtons';

// ─── Proximity Thresholds ────────────────────────────────────
const PROXIMITY_NPC = 55;
const PROXIMITY_EXIT = 55;
const PROXIMITY_LOOT = 55;
const PROXIMITY_SECRET_INTERACT = 40;
const LOOT_COLLECT_RANGE = 60;
const ZONE_EXIT_TRIGGER = 30;

export { ZONE_EXIT_TRIGGER };

export interface ProximityState {
  nearbyNPC: NPCInstance | null;
  nearbyExit: ZoneConnection | null;
  nearbyLoot: LootInstance | null;
  nearbyBuilding: EnterableBuilding | null;
  nearbySecret: SecretArea | null;
}

export function checkProximity(
  playerPos: { x: number; y: number },
  npcs: NPCInstance[],
  connections: ZoneConnection[],
  lootPoints: LootInstance[],
  enterableBuildings: EnterableBuilding[],
  secretAreas: SecretArea[],
  worldID: string,
  vfx: VisualEffects,
  actionButtons: ActionButtons,
  promptManager: InteractPromptManager,
): ProximityState {
  const state: ProximityState = {
    nearbyNPC: null,
    nearbyExit: null,
    nearbyLoot: null,
    nearbyBuilding: null,
    nearbySecret: null,
  };

  let minNPCDist = Infinity;
  for (const npc of npcs) {
    const dist = Math.hypot(npc.position.x - playerPos.x, npc.position.y - playerPos.y);
    if (dist < PROXIMITY_NPC && dist < minNPCDist) { minNPCDist = dist; state.nearbyNPC = npc; }
  }

  let minExitDist = Infinity;
  for (const conn of connections) {
    const exitPos = isoToScreen(conn.exitPosition.col, conn.exitPosition.row);
    const dist = Math.hypot(exitPos.x - playerPos.x, exitPos.y - playerPos.y);
    if (dist < PROXIMITY_EXIT && dist < minExitDist) { minExitDist = dist; state.nearbyExit = conn; }
  }

  let minLootDist = Infinity;
  for (const loot of lootPoints) {
    if (loot.collected) continue;
    const dist = Math.hypot(loot.position.x - playerPos.x, loot.position.y - playerPos.y);
    if (dist < PROXIMITY_LOOT && dist < minLootDist) { minLootDist = dist; state.nearbyLoot = loot; }
  }

  let minBuildingDist = Infinity;
  for (const b of enterableBuildings) {
    const dist = Math.hypot(b.x - playerPos.x, b.y - playerPos.y);
    if (dist < b.interactionRadius && dist < minBuildingDist) { minBuildingDist = dist; state.nearbyBuilding = b; }
  }

  for (const s of secretAreas) {
    if (s.revealed) continue;
    const dist = Math.hypot(s.x - playerPos.x, s.y - playerPos.y);
    if (dist < s.interactionRadius) {
      revealSecret(s, worldID);
      vfx.showFloatingText(s.x, s.y - 20, '✦ Zone secrète découverte!', 0xffdd44);
      state.nearbySecret = s;
    }
  }
  for (const s of secretAreas) {
    if (!s.revealed) continue;
    const dist = Math.hypot(s.x - playerPos.x, s.y - playerPos.y);
    if (dist < PROXIMITY_SECRET_INTERACT) { state.nearbySecret = s; break; }
  }

  let newMode: ActionMode = 'attack';
  let promptText = '';
  if (state.nearbyNPC && minNPCDist < minExitDist && minNPCDist < minLootDist) {
    newMode = 'talk';
    promptText = state.nearbyNPC.isShopkeeper ? 'Ouvrir la boutique' : 'Parler';
  } else if (state.nearbyBuilding && minBuildingDist < minExitDist) {
    newMode = 'enter';
    promptText = state.nearbyBuilding.name;
  } else if (state.nearbyExit && minExitDist < minLootDist) {
    newMode = 'enter';
    const targetZone = gameData.zone(state.nearbyExit.targetZoneID);
    promptText = `→ ${targetZone?.name ?? state.nearbyExit.targetZoneID}`;
  } else if (state.nearbySecret) {
    newMode = 'loot';
    promptText = state.nearbySecret.type === 'treasure' ? 'Ouvrir le coffre'
      : state.nearbySecret.type === 'shrine' ? 'Prier au sanctuaire' : 'Explorer';
  } else if (state.nearbyLoot) {
    newMode = 'loot';
    promptText = 'Ramasser';
  }

  actionButtons.setMode(newMode);
  promptManager.update(promptText);

  return state;
}

export function isInLootRange(playerPos: { x: number; y: number }, itemPos: { x: number; y: number }): boolean {
  return Math.hypot(itemPos.x - playerPos.x, itemPos.y - playerPos.y) <= LOOT_COLLECT_RANGE;
}

// ─── Interact Prompt Manager ─────────────────────────────────

export class InteractPromptManager {
  private prompt: Text | null = null;
  private container: Container;
  private screenW: number;
  private screenH: number;

  constructor(container: Container, screenW: number, screenH: number) {
    this.container = container;
    this.screenW = screenW;
    this.screenH = screenH;
  }

  update(text: string): void {
    if (text) {
      if (!this.prompt) {
        this.prompt = new Text({
          text,
          style: new TextStyle({
            fontFamily: 'Georgia, serif', fontSize: 11, fill: 0xeedd88,
            fontWeight: 'bold',
            dropShadow: { color: 0x000000, blur: 3, distance: 1 },
          }),
        });
        this.prompt.anchor.set(0.5);
        this.prompt.x = this.screenW / 2;
        this.prompt.y = this.screenH * 0.68;
        this.container.addChild(this.prompt);
      } else {
        this.prompt.text = text;
      }
    } else if (this.prompt) {
      this.prompt.destroy();
      this.prompt = null;
    }
  }
}
