// ─── Zone Visuals — floating text, level up, death, camera, quests ───
// Extracted from ZoneScene for modularity.

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { GameManager } from '../../game/GameManager';
import { QuestManager } from '../../game/QuestManager';
import { AchievementManager } from '../../game/AchievementSystem';
import { MusicManager } from '../../game/MusicSystem';
import { showDeathScreen } from '../../ui/DeathScreen';
import { animateLevelUpBurst } from '../../rendering/CharacterAnimations';
import { isoToScreen } from './ZoneTypes';
import type { EnemyInstance, NPCInstance, LootInstance } from './ZoneTypes';
import type { Zone, ZoneConnection } from '../../data/types';

// ─── Floating Text ──────────────────────────────────────────────

export function showFloatingText(
  worldContainer: Container,
  x: number, y: number, msg: string, color: number,
): void {
  const style = new TextStyle({
    fontFamily: 'Georgia, serif', fontSize: 10, fill: color,
    dropShadow: { color: 0x000000, blur: 2, distance: 1 },
  });
  const txt = new Text({ text: msg, style });
  txt.anchor.set(0.5);
  txt.x = x;
  txt.y = y;
  txt.zIndex = 100001;
  worldContainer.addChild(txt);

  let elapsed = 0;
  let last = performance.now();
  const anim = () => {
    if (txt.destroyed) return;
    const now = performance.now();
    const dtSec = (now - last) / 1000;
    last = now;
    elapsed += dtSec;
    txt.y -= 0.5;
    txt.alpha = Math.max(0, 1 - elapsed / 2);
    if (elapsed < 2) requestAnimationFrame(anim);
    else txt.destroy();
  };
  requestAnimationFrame(anim);
}

// ─── Level Up ───────────────────────────────────────────────────

export function showLevelUp(
  worldContainer: Container,
  uiContainer: Container,
  playerScreenPos: { x: number; y: number },
  screenW: number, screenH: number,
): void {
  const champ = GameManager.shared.champion;
  if (champ) {
    animateLevelUpBurst(worldContainer, playerScreenPos.x, playerScreenPos.y, champ.championClass);
  }

  const flash = new Graphics();
  flash.rect(0, 0, screenW, screenH).fill({ color: 0xe6cc66, alpha: 0.15 });
  flash.zIndex = 998;
  uiContainer.addChild(flash);

  const style = new TextStyle({
    fontFamily: 'Georgia, serif', fontSize: 22, fill: 0xe6cc66,
    fontWeight: 'bold',
    dropShadow: { color: 0x000000, blur: 4, distance: 2 },
  });
  const txt = new Text({ text: 'NIVEAU SUPÉRIEUR!', style });
  txt.anchor.set(0.5);
  txt.x = screenW / 2;
  txt.y = screenH / 2 - 50;
  txt.zIndex = 1000;
  uiContainer.addChild(txt);

  let elapsed = 0;
  let last = performance.now();
  const anim = () => {
    if (txt.destroyed) return;
    const now = performance.now();
    const dtSec = (now - last) / 1000;
    last = now;
    elapsed += dtSec;
    txt.y -= 0.3;
    txt.alpha = Math.max(0, 1 - elapsed / 2.5);
    flash.alpha = Math.max(0, 0.15 - elapsed / 2);
    if (elapsed < 2.5) requestAnimationFrame(anim);
    else { txt.destroy(); flash.destroy(); }
  };
  requestAnimationFrame(anim);
}

// ─── Camera Shake ───────────────────────────────────────────────

export function shakeCamera(
  worldContainer: Container,
  intensity: number, duration: number,
): void {
  const originalX = worldContainer.x;
  const originalY = worldContainer.y;
  let elapsed = 0;
  let last = performance.now();

  const shake = () => {
    const now = performance.now();
    const dtSec = (now - last) / 1000;
    last = now;
    elapsed += dtSec;
    const decay = 1 - elapsed / duration;
    worldContainer.x = originalX + (Math.random() - 0.5) * intensity * 2 * decay;
    worldContainer.y = originalY + (Math.random() - 0.5) * intensity * 2 * decay;
    if (elapsed < duration) requestAnimationFrame(shake);
  };
  requestAnimationFrame(shake);
}

// ─── Camera Follow ──────────────────────────────────────────────

export function updateCamera(
  worldContainer: Container,
  playerScreenPos: { x: number; y: number },
  screenW: number, screenH: number,
): void {
  const targetX = screenW / 2 - playerScreenPos.x;
  const targetY = screenH / 2 - playerScreenPos.y;
  worldContainer.x += (targetX - worldContainer.x) * 0.1;
  worldContainer.y += (targetY - worldContainer.y) * 0.1;
}

// ─── Death & Respawn ────────────────────────────────────────────

export function handlePlayerDeath(
  uiContainer: Container,
  screenW: number, screenH: number,
  deathScreen: Container | null,
  isPaused: boolean,
  onRespawn: () => void,
): { deathScreen: Container | null; isPaused: boolean } {
  if (deathScreen) return { deathScreen, isPaused };
  AchievementManager.shared.recordDeath();
  AchievementManager.shared.check();

  const screen = showDeathScreen(uiContainer, screenW, screenH, onRespawn);
  return { deathScreen: screen, isPaused: true };
}

export function respawnPlayer(
  deathScreen: Container | null,
  zone: Zone,
  worldContainer: Container,
  uiContainer: Container,
  playerScreenPos: { x: number; y: number },
  playerContainer: Container,
  screenW: number, screenH: number,
): { deathScreen: null; playerGridPos: { col: number; row: number }; isPaused: false } {
  if (deathScreen) {
    deathScreen.destroy({ children: true });
  }

  const champ = GameManager.shared.champion;
  if (champ) {
    champ.currentHP = GameManager.shared.maxHP;
    champ.currentInvestiture = GameManager.shared.maxInvestiture;
  }

  const spawnPos = isoToScreen(zone.playerSpawnPosition.col, zone.playerSpawnPosition.row);
  playerScreenPos.x = spawnPos.x;
  playerScreenPos.y = spawnPos.y;
  playerContainer.x = spawnPos.x;
  playerContainer.y = spawnPos.y;

  // Flash effect
  const flash = new Graphics();
  flash.rect(0, 0, screenW, screenH).fill({ color: 0xffffff, alpha: 0.3 });
  flash.zIndex = 10000;
  uiContainer.addChild(flash);
  let elapsed = 0;
  let last = performance.now();
  const fadeOut = () => {
    if (flash.destroyed) return;
    const now = performance.now();
    const dtSec = (now - last) / 1000;
    last = now;
    elapsed += dtSec;
    flash.alpha = Math.max(0, 0.3 - elapsed * 0.6);
    if (elapsed < 0.5) requestAnimationFrame(fadeOut);
    else flash.destroy();
  };
  requestAnimationFrame(fadeOut);

  return { deathScreen: null, playerGridPos: { ...zone.playerSpawnPosition }, isPaused: false };
}

// ─── Minimap Refresh ────────────────────────────────────────────

export function refreshMinimap(
  minimap: {
    refresh: (px: number, py: number, enemies: any[], npcs: any[], exits: any[], loot: any[]) => void;
    setObjective: (wx: number, wy: number, label: string) => void;
    clearObjective: () => void;
  },
  playerScreenPos: { x: number; y: number },
  enemies: EnemyInstance[],
  npcs: NPCInstance[],
  lootPoints: LootInstance[],
  connections: ZoneConnection[],
  zone: Zone,
): void {
  const enemyDots = enemies
    .filter(e => !e.isDead)
    .map(e => ({
      x: e.position.x, y: e.position.y,
      color: e.data.tier === 'boss' ? 0xff2222 : e.data.tier === 'elite' ? 0xff6644 : 0xcc4444,
      size: e.data.tier === 'boss' ? 3 : e.data.tier === 'elite' ? 2 : 1.5,
    }));

  const npcDots = npcs.map(n => ({ x: n.position.x, y: n.position.y, color: 0x44aaff }));

  const exitDots = connections.map(c => {
    const pos = isoToScreen(c.exitPosition.col, c.exitPosition.row);
    return { x: pos.x, y: pos.y, color: 0xeedd44 };
  });

  const lootDots = lootPoints
    .filter(l => !l.collected)
    .map(l => ({ x: l.position.x, y: l.position.y, color: 0xee9944 }));

  minimap.refresh(playerScreenPos.x, playerScreenPos.y, enemyDots, npcDots, exitDots, lootDots);

  // ─── Quest Objective Marker ─────────────────────────────────
  resolveQuestObjective(minimap, zone, enemies, npcs);
}

/** Resolve active quest objectives to world positions and set minimap marker */
function resolveQuestObjective(
  minimap: { setObjective: (wx: number, wy: number, label: string) => void; clearObjective: () => void },
  zone: Zone,
  enemies: EnemyInstance[],
  npcs: NPCInstance[],
): void {
  const activeQuests = QuestManager.shared.getActiveQuests();
  if (activeQuests.length === 0) { minimap.clearObjective(); return; }

  // Find first incomplete objective in the current zone's quests
  for (const { quest, state } of activeQuests) {
    if (quest.worldID !== zone.worldID) continue;

    for (const obj of quest.objectives) {
      const progress = state.objectiveProgress[obj.id] ?? 0;
      if (progress >= obj.requiredCount) continue; // already complete

      const pos = resolveObjectivePosition(obj.type, obj.targetID, zone, enemies, npcs);
      if (pos) {
        const remaining = obj.requiredCount - progress;
        const label = remaining > 1 ? `${obj.description} (${progress}/${obj.requiredCount})` : obj.description;
        minimap.setObjective(pos.x, pos.y, label);
        return;
      }
    }
  }
  minimap.clearObjective();
}

function resolveObjectivePosition(
  type: string, targetID: string, zone: Zone,
  enemies: EnemyInstance[], npcs: NPCInstance[],
): { x: number; y: number } | null {
  switch (type) {
    case 'talkTo': {
      // Check live NPCs first
      const npc = npcs.find(n => n.id === targetID);
      if (npc) return npc.position;
      // Fallback to zone spawn data
      const spawn = zone.npcSpawns.find(s => s.npcID === targetID);
      if (spawn) return isoToScreen(spawn.position.col, spawn.position.row);
      return null;
    }
    case 'kill':
    case 'defeat': {
      // Find nearest alive enemy of this type
      const alive = enemies.filter(e => !e.isDead && e.data.id === targetID);
      if (alive.length > 0) return alive[0].position;
      // Fallback to spawn point
      const espawn = zone.enemySpawns.find(s => s.enemyID === targetID);
      if (espawn) return isoToScreen(espawn.position.col, espawn.position.row);
      return null;
    }
    case 'collect': {
      // Look in loot points
      const loot = zone.lootPoints.find(l => l.id === targetID || l.lootTable.some(lt => lt.itemID === targetID));
      if (loot) return isoToScreen(loot.position.col, loot.position.row);
      return null;
    }
    case 'explore': {
      // If the target zone matches current, point to center; otherwise point to exit
      if (targetID === zone.id) {
        return isoToScreen(Math.floor(zone.gridWidth / 2), Math.floor(zone.gridHeight / 2));
      }
      const exit = zone.connections.find(c => c.targetZoneID === targetID);
      if (exit) return isoToScreen(exit.exitPosition.col, exit.exitPosition.row);
      return null;
    }
    default:
      return null;
  }
}

// ─── Quest Completion ───────────────────────────────────────────

export function checkQuestCompletion(
  playerScreenPos: { x: number; y: number },
  worldContainer: Container,
  questTracker: { refresh: () => void },
): void {
  const champ = GameManager.shared.champion;
  if (!champ) return;

  for (const qid of [...champ.activeQuestIDs]) {
    if (QuestManager.shared.checkQuestCompletion(qid)) {
      const result = QuestManager.shared.completeQuest(qid);
      if (result) {
        MusicManager.shared.playSFX('quest_complete');
        showFloatingText(
          worldContainer,
          playerScreenPos.x, playerScreenPos.y - 50,
          `Quête terminée! +${result.xp}XP +${result.gold}or`, 0xffcc44,
        );
        questTracker.refresh();
      }
    }
  }
}

// ─── Z-Sorting ──────────────────────────────────────────────────

export function sortZOrder(
  worldContainer: Container,
  playerContainer: Container,
  particleContainer: Container | null,
): void {
  for (const child of worldContainer.children) {
    if (child.zIndex < -900) continue;
    if (child === particleContainer) continue;
    child.zIndex = child.y;
  }
  playerContainer.zIndex = playerContainer.y + 0.5;
}
