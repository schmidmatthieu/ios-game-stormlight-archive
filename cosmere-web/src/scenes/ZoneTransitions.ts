// ─── Zone Transitions (exit detection, fade-out, zone switch) ───

import { Graphics } from 'pixi.js';
import type { Container, Application } from 'pixi.js';
import { GameManager } from '../game/GameManager';
import { gameData } from '../data/DataLoader';
import { SceneRouter } from '../game/SceneRouter';
import { isoToScreen } from './IsoUtils';
import type { Zone } from '../data/types';
import { ZONE_EXIT_TRIGGER } from './ZoneInteraction';

const FADE_DURATION = 0.4;

export function checkZoneExit(
  zone: Zone,
  playerPos: { x: number; y: number },
  isTransitioning: boolean,
  app: Application,
  uiContainer: Container,
  router: SceneRouter,
  ZoneSceneClass: new (app: Application, router: SceneRouter) => Container,
  setTransitioning: (v: boolean) => void,
): void {
  if (isTransitioning) return;

  for (const conn of zone.connections) {
    const exitPos = isoToScreen(conn.exitPosition.col, conn.exitPosition.row);
    const dist = Math.hypot(exitPos.x - playerPos.x, exitPos.y - playerPos.y);

    if (dist < ZONE_EXIT_TRIGGER) {
      const targetZone = gameData.zone(conn.targetZoneID);
      if (!targetZone) continue;

      if (conn.requiredQuestID) {
        const champ = GameManager.shared.champion;
        if (!champ?.completedQuestIDs.includes(conn.requiredQuestID)) continue;
      }

      const champ = GameManager.shared.champion;
      if (champ) {
        setTransitioning(true);
        const flash = new Graphics();
        flash.rect(0, 0, app.screen.width, app.screen.height).fill({ color: 0x000000, alpha: 0 });
        flash.zIndex = 99999;
        uiContainer.addChild(flash);

        let elapsed = 0;
        let lastTime = performance.now();
        const fadeOut = () => {
          const now = performance.now();
          const frameDt = (now - lastTime) / 1000;
          lastTime = now;
          elapsed += frameDt;
          flash.clear();
          flash.rect(0, 0, app.screen.width, app.screen.height)
            .fill({ color: 0x000000, alpha: Math.min(1, elapsed / FADE_DURATION) });
          if (elapsed < FADE_DURATION) {
            requestAnimationFrame(fadeOut);
          } else {
            champ.currentZoneID = conn.targetZoneID;
            champ.gridPosition = { ...targetZone.playerSpawnPosition };
            GameManager.shared.save();
            router.goto(ZoneSceneClass);
          }
        };
        requestAnimationFrame(fadeOut);
      }
      return;
    }
  }
}
