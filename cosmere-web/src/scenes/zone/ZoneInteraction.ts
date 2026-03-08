// ─── Zone Interaction — NPC, building, secret, environment, gathering ──
// Extracted from ZoneScene for modularity.

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { GameManager } from '../../game/GameManager';
import { gameData } from '../../data/DataLoader';
import { QuestManager } from '../../game/QuestManager';
import { MusicManager } from '../../game/MusicSystem';
import { NewGamePlusManager } from '../../systems/NewGamePlus';
import { HiddenQuestManager } from '../../systems/HiddenQuests';
import { NPCRelationshipManager, LEVEL_LABELS, LEVEL_COLORS } from '../../game/NPCRelationships';
import { NPCScheduleManager } from '../../game/NPCScheduleSystem';
import { SaveManager } from '../../game/SaveManager';
import { addReputation, showRankUpEffect } from '../../game/ReputationSystem';
import { showDialoguePanel, showShopPanel } from '../../ui/DialoguePanel';
import { interactWith, createEnvironmentSprite } from '../../systems/EnvironmentInteractions';
import { gatherFromNode as gatherFromNodeSystem } from '../../systems/GatheringNodes';
import { registerBuildingZone } from '../BuildingZoneGenerator';
import { isoToScreen } from './ZoneTypes';
import { formatNPCName } from './ZoneSpawning';
import type { NPCInstance } from './ZoneTypes';
import type { EnterableBuilding, SecretArea } from '../../rendering/MapStructures';
import type { EnvironmentObject } from '../../systems/EnvironmentInteractions';
import type { GatheringNode } from '../../systems/GatheringNodes';
import type { ActionMode } from '../../ui/ActionButtons';
import type { StatusEffectManager } from '../../game/StatusEffects';

// ─── Host Interface ─────────────────────────────────────────────

export interface InteractionHost {
  zone: { id: string; worldID: string; npcSpawns: Array<{ npcID: string; isShopkeeper: boolean; dialogueTreeID: string | null }> };
  npcs: NPCInstance[];
  enterableBuildings: EnterableBuilding[];
  secretAreas: SecretArea[];
  environmentObjects: EnvironmentObject[];
  gatheringNodes: GatheringNode[];
  lootPoints: Array<{ id: string }>;
  playerScreenPos: { x: number; y: number };
  playerStatusEffects: StatusEffectManager;
  uiContainer: Container;
  screenWidth: number;
  screenHeight: number;
  isTransitioning: boolean;
  dialoguePanel: Container | null;
  isPaused: boolean;
  repBadge: { refresh: () => void } | null;
  nearbyNPC: NPCInstance | null;
  nearbyBuilding: EnterableBuilding | null;
  nearbySecret: SecretArea | null;
  nearbyEnvObject: EnvironmentObject | null;
  nearbyGatherNode: GatheringNode | null;
  nearbyLoot: { id: string } | null;
  showFloatingText: (x: number, y: number, msg: string, color: number) => void;
  shakeCamera: (intensity: number, duration: number) => void;
  checkQuestCompletion: () => void;
  collectLoot: (id: string) => void;
  gotoZoneScene: () => void;
}

// ─── Handle Interaction ─────────────────────────────────────────

export function handleInteraction(mode: ActionMode, host: InteractionHost): void {
  switch (mode) {
    case 'talk':
      if (host.nearbyNPC) {
        const spawn = host.zone.npcSpawns.find(s => s.npcID === host.nearbyNPC!.id);
        if (spawn) interactWithNPC(spawn, host);
      }
      break;
    case 'enter':
      if (host.nearbyBuilding) {
        enterBuilding(host.nearbyBuilding, host);
      }
      break;
    case 'loot':
      if (host.nearbySecret) {
        interactWithSecret(host.nearbySecret, host);
      } else if (host.nearbyGatherNode) {
        gatherFromNode(host.nearbyGatherNode, host);
      } else if (host.nearbyEnvObject) {
        interactWithEnvObject(host.nearbyEnvObject, host);
      } else if (host.nearbyLoot) {
        host.collectLoot(host.nearbyLoot.id);
      }
      break;
  }
}

// ─── Enter Building ─────────────────────────────────────────────

export function enterBuilding(building: EnterableBuilding, host: InteractionHost): void {
  if (host.isTransitioning) return;

  const champ = GameManager.shared.champion;
  if (!champ) return;

  host.isTransitioning = true;

  const interiorZoneID = registerBuildingZone(
    building.name, host.zone.worldID, host.zone.id, building.col, building.row,
  );

  const targetZone = gameData.zone(interiorZoneID);
  if (!targetZone) { host.isTransitioning = false; return; }

  MusicManager.shared.playSFX('dash');
  const flash = new Graphics();
  flash.rect(0, 0, host.screenWidth, host.screenHeight).fill({ color: 0x000000, alpha: 0 });
  flash.zIndex = 99999;
  host.uiContainer.addChild(flash);

  let elapsed = 0;
  let last = performance.now();
  const fadeOut = () => {
    if (flash.destroyed) return;
    const now = performance.now();
    const dtSec = (now - last) / 1000;
    last = now;
    elapsed += dtSec;
    flash.clear();
    flash.rect(0, 0, host.screenWidth, host.screenHeight)
      .fill({ color: 0x000000, alpha: Math.min(1, elapsed / 0.4) });
    if (elapsed < 0.4) {
      requestAnimationFrame(fadeOut);
    } else {
      champ.currentZoneID = interiorZoneID;
      champ.gridPosition = { ...targetZone.playerSpawnPosition };
      GameManager.shared.save();
      SaveManager.shared.autoSave();
      host.gotoZoneScene();
    }
  };
  requestAnimationFrame(fadeOut);
}

// ─── Interact with Secret ───────────────────────────────────────

export function interactWithSecret(secret: SecretArea, host: InteractionHost): void {
  if (!secret.revealed) return;

  const champ = GameManager.shared.champion;
  if (!champ) return;

  champ.gold += secret.loot.gold;
  GameManager.shared.grantXP(secret.loot.xp);
  const secretRepResult = addReputation(host.zone.worldID, 5);
  if (secretRepResult.rankUp) {
    showRankUpEffect(host.uiContainer, host.screenWidth, host.screenHeight, secretRepResult.rankName, host.zone.worldID);
  }
  if (host.repBadge) host.repBadge.refresh();

  if (secret.type === 'shrine') {
    MusicManager.shared.playSFX('heal');
    champ.currentHP = GameManager.shared.maxHP;
    champ.currentInvestiture = GameManager.shared.maxInvestiture;
    host.playerStatusEffects.apply('regenerating', 120, 5);
    host.playerStatusEffects.apply('shielded', 120, 2);
    host.playerStatusEffects.apply('strengthened', 120, 1.5);
    host.playerStatusEffects.apply('haste', 90, 1);
    host.showFloatingText(secret.x, secret.y - 30, 'Bénédiction! PV, Inv, +50% Dégâts, Bouclier, Régén, Hâte!', 0x88ccff);
  } else {
    host.showFloatingText(secret.x, secret.y - 30,
      `${secret.loot.itemHint}! +${secret.loot.xp}XP +${secret.loot.gold}or`, 0xffdd44);
  }

  secret.sprite.alpha = 0.3;
  host.secretAreas = host.secretAreas.filter(s => s !== secret);
}

// ─── Interact with Environment Object ───────────────────────────

export function interactWithEnvObject(obj: EnvironmentObject, host: InteractionHost): void {
  const result = interactWith(obj);
  MusicManager.shared.playSFX(result.sfx);

  if (result.message) {
    const pos = isoToScreen(obj.position.col, obj.position.row);
    host.showFloatingText(pos.x, pos.y - 30, result.message, 0xffdd44);
  }

  if (result.xpReward > 0) {
    const ngpRewards = NewGamePlusManager.shared.applyToRewards(result.xpReward, 0);
    GameManager.shared.grantXP(ngpRewards.xp);
  }

  if (result.triggerLinkedID) {
    const linked = host.environmentObjects.find(o => o.id === result.triggerLinkedID);
    if (linked && !linked.activated) {
      linked.activated = true;
      const linkedPos = isoToScreen(linked.position.col, linked.position.row);
      host.showFloatingText(linkedPos.x, linkedPos.y - 30, 'Activé !', 0x88ccff);
      MusicManager.shared.playSFX('quest_complete');
      if (linked.type === 'obelisk') {
        const notifications = HiddenQuestManager.shared.reportTrigger('activate_obelisks', host.zone.worldID, host.zone.worldID);
        for (const n of notifications) {
          host.showFloatingText(host.playerScreenPos.x, host.playerScreenPos.y - 70,
            n.message, n.completed ? 0xffdd44 : 0x88ccff);
          if (n.completed && n.rewards) {
            host.showFloatingText(host.playerScreenPos.x, host.playerScreenPos.y - 85,
              `+${n.rewards.xp}XP +${n.rewards.gold}or`, 0x66cc44);
          }
        }
      }
      linked.sprite.removeChildren();
      const newSprite = createEnvironmentSprite(linked);
      for (const child of newSprite.children) linked.sprite.addChild(child);
    }
  }

  if (obj.type === 'breakable' && obj.activated) {
    obj.sprite.alpha = 0.2;
    host.shakeCamera(1, 0.05);
  }

  obj.sprite.removeChildren();
  const newSprite = createEnvironmentSprite(obj);
  for (const child of newSprite.children) obj.sprite.addChild(child);
}

// ─── Gather from Node ───────────────────────────────────────────

export function gatherFromNode(node: GatheringNode, host: InteractionHost): void {
  const result = gatherFromNodeSystem(node, host.zone.worldID);
  const rarityColors: Record<string, number> = {
    common: 0xaaaaaa, uncommon: 0x55cc55, rare: 0x5588ee, epic: 0x9955ee,
  };
  const color = result.success ? (rarityColors[result.rarity] ?? 0xffdd44) : 0xaaaaaa;
  host.showFloatingText(node.screenX, node.screenY - 30, result.message, color);
  if (result.success) {
    MusicManager.shared.playSFX('loot_common');
  }
}

// ─── Interact with NPC ──────────────────────────────────────────

export function interactWithNPC(
  spawn: { npcID: string; isShopkeeper: boolean; dialogueTreeID: string | null },
  host: InteractionHost,
): void {
  const npc = host.npcs.find(n => n.id === spawn.npcID);
  if (!npc) return;

  const schedMgr = NPCScheduleManager.shared;
  if (schedMgr.hasSchedule(spawn.npcID) && !schedMgr.isAvailable(spawn.npcID)) {
    host.showFloatingText(npc.position.x, npc.position.y - 50, '💤 Dort...', 0x6677aa);
    return;
  }

  if (spawn.isShopkeeper) {
    showShopUI(host);
  } else {
    showDialogueUI(spawn.npcID, spawn.dialogueTreeID, host);
  }
}

// ─── Show Dialogue ──────────────────────────────────────────────

export function showDialogueUI(npcID: string, _dialogueTreeID: string | null, host: InteractionHost): void {
  if (host.dialoguePanel) return;
  host.isPaused = true;

  QuestManager.shared.onNPCTalkedTo(npcID);
  QuestManager.shared.onEscortComplete(npcID);
  host.checkQuestCompletion();
  const npcName = formatNPCName(npcID);
  NPCRelationshipManager.shared.recordTalk(npcID, npcName, host.zone.worldID);

  const levelUp = NPCRelationshipManager.shared.popLevelUp();
  if (levelUp) {
    const color = LEVEL_COLORS[levelUp.level] ?? 0xffffff;
    const label = LEVEL_LABELS[levelUp.level] ?? levelUp.level;
    setTimeout(() => {
      host.showFloatingText(
        host.playerScreenPos.x, host.playerScreenPos.y - 70,
        `${levelUp.npcName}: ${label}!`, color,
      );
    }, 500);
  }

  const level = NPCRelationshipManager.shared.getLevel(npcID);
  const levelLabel = LEVEL_LABELS[level];
  const levelColor = LEVEL_COLORS[level];
  const affinity = NPCRelationshipManager.shared.getAffinityPercent(npcID);
  host.showFloatingText(
    host.playerScreenPos.x + 30, host.playerScreenPos.y - 40,
    `${levelLabel} (${affinity}%)`, levelColor,
  );

  const timeDialogue = NPCScheduleManager.shared.getTimeDialogue(npcID);
  if (timeDialogue) {
    const npcInst = host.npcs.find(n => n.id === npcID);
    if (npcInst) {
      host.showFloatingText(npcInst.position.x, npcInst.position.y - 60, timeDialogue, 0xddddaa);
    }
  }

  host.dialoguePanel = showDialoguePanel(
    host.uiContainer, host.screenWidth, host.screenHeight,
    host.zone.worldID, npcName, () => closeDialogue(host),
  );
}

// ─── Close Dialogue ─────────────────────────────────────────────

export function closeDialogue(host: InteractionHost): void {
  if (host.dialoguePanel) {
    MusicManager.shared.playSFX('close_menu');
    host.dialoguePanel.destroy({ children: true });
    host.dialoguePanel = null;
  }
  host.isPaused = false;
}

// ─── Show Shop ──────────────────────────────────────────────────

export function showShopUI(host: InteractionHost): void {
  if (host.dialoguePanel) return;
  MusicManager.shared.playSFX('open_menu');
  host.isPaused = true;
  host.dialoguePanel = showShopPanel(
    host.uiContainer, host.screenWidth, host.screenHeight,
    () => closeDialogue(host),
    (x, y, msg, color) => host.showFloatingText(x, y, msg, color),
    host.playerScreenPos,
  );
}
