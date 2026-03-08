// ─── Zone Transitions — exit detection and fade transition ──────
// Extracted from ZoneScene for modularity.

import { Container, Graphics } from 'pixi.js';
import { GameManager } from '../../game/GameManager';
import { gameData } from '../../data/DataLoader';
import { QuestManager } from '../../game/QuestManager';
import { MusicManager } from '../../game/MusicSystem';
import { BestiaryManager } from '../../game/BestiarySystem';
import { AchievementManager } from '../../game/AchievementSystem';
import { CompanionManager } from '../../game/CompanionSystem';
import { NPCRelationshipManager } from '../../game/NPCRelationships';
import { SaveManager } from '../../game/SaveManager';
import { isoToScreen } from './ZoneTypes';
import type { NPCInstance } from './ZoneTypes';
import type { Zone, ZoneConnection } from '../../data/types';

// ─── Host Interface ─────────────────────────────────────────────

export interface TransitionHost {
  isTransitioning: boolean;
  zone: Zone;
  playerScreenPos: { x: number; y: number };
  npcs: NPCInstance[];
  uiContainer: Container;
  screenWidth: number;
  screenHeight: number;
  checkQuestCompletion: () => void;
  gotoZoneScene: () => void;
}

// ─── Check Zone Exit ────────────────────────────────────────────

export function checkZoneExit(host: TransitionHost): void {
  if (host.isTransitioning) return;

  for (const conn of host.zone.connections) {
    const exitPos = isoToScreen(conn.exitPosition.col, conn.exitPosition.row);
    const dist = Math.hypot(exitPos.x - host.playerScreenPos.x, exitPos.y - host.playerScreenPos.y);

    if (dist < 30) {
      const targetZone = gameData.zone(conn.targetZoneID);
      if (!targetZone) continue;

      if (conn.requiredQuestID) {
        const champ = GameManager.shared.champion;
        if (!champ?.completedQuestIDs.includes(conn.requiredQuestID)) continue;
      }

      const champ = GameManager.shared.champion;
      if (champ) {
        host.isTransitioning = true;

        // Complete escort quests when leaving zone
        for (const npc of host.npcs) {
          QuestManager.shared.onEscortComplete(npc.id);
        }
        host.checkQuestCompletion();

        // Transition effect
        MusicManager.shared.playSFX('dash');
        const flash = new Graphics();
        flash.rect(0, 0, host.screenWidth, host.screenHeight).fill({ color: 0x000000, alpha: 0 });
        flash.zIndex = 99999;
        host.uiContainer.addChild(flash);

        let elapsed = 0;
        let zoneLast = performance.now();
        const fadeOut = () => {
          if (flash.destroyed) return;
          const now = performance.now();
          const dtSec = (now - zoneLast) / 1000;
          zoneLast = now;
          elapsed += dtSec;
          flash.clear();
          flash.rect(0, 0, host.screenWidth, host.screenHeight)
            .fill({ color: 0x000000, alpha: Math.min(1, elapsed / 0.4) });
          if (elapsed < 0.4) {
            requestAnimationFrame(fadeOut);
          } else {
            champ.currentZoneID = conn.targetZoneID;
            champ.gridPosition = { ...targetZone.playerSpawnPosition };
            GameManager.shared.save();
            BestiaryManager.shared.save();
            AchievementManager.shared.save();
            CompanionManager.shared.save();
            NPCRelationshipManager.shared.save();
            SaveManager.shared.autoSave();
            host.gotoZoneScene();
          }
        };
        requestAnimationFrame(fadeOut);
      }
      return;
    }
  }
}
