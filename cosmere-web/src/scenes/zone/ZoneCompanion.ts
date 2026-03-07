// ─── Zone Companion Controller ──────────────────────────────────
// Extracted from ZoneScene.ts — companion sprite, update, bonuses.

import { Container, Graphics } from 'pixi.js';
import { CompanionManager } from '../../game/CompanionSystem';
import { GameManager } from '../../game/GameManager';

export interface CompanionState {
  sprite: Graphics | null;
  pos: { x: number; y: number };
  animTimer: number;
}

export function createCompanionState(): CompanionState {
  return { sprite: null, pos: { x: 0, y: 0 }, animTimer: 0 };
}

export function spawnCompanionSprite(
  worldContainer: Container,
  state: CompanionState,
  playerPos: { x: number; y: number },
): void {
  if (state.sprite) {
    worldContainer.removeChild(state.sprite);
    state.sprite.destroy();
    state.sprite = null;
  }
  const comp = CompanionManager.shared.getActive();
  if (!comp) return;

  const sprite = new Graphics();
  sprite.circle(0, 0, comp.size + 3).fill({ color: comp.glowColor, alpha: 0.15 });
  sprite.circle(0, 0, comp.size).fill({ color: comp.color, alpha: 0.8 });
  sprite.circle(0, -1, comp.size * 0.5).fill({ color: 0xffffff, alpha: 0.3 });
  sprite.zIndex = 999;

  state.pos.x = playerPos.x + 20;
  state.pos.y = playerPos.y - 15;
  sprite.x = state.pos.x;
  sprite.y = state.pos.y;

  worldContainer.addChild(sprite);
  state.sprite = sprite;
}

export function updateCompanion(
  dt: number,
  state: CompanionState,
  playerPos: { x: number; y: number },
): void {
  if (!state.sprite) return;
  const comp = CompanionManager.shared.getActive();
  if (!comp) return;

  state.animTimer += dt * 2.5;

  const targetX = playerPos.x + Math.cos(state.animTimer) * 22;
  const targetY = playerPos.y - 18 + Math.sin(state.animTimer * 1.3) * 6;

  state.pos.x += (targetX - state.pos.x) * dt * 3;
  state.pos.y += (targetY - state.pos.y) * dt * 3;

  state.sprite.x = state.pos.x;
  state.sprite.y = state.pos.y;
  state.sprite.alpha = 0.8 + Math.sin(state.animTimer * 2) * 0.15;

  if (comp.bonusType === 'heal') {
    const champ = GameManager.shared.champion;
    if (champ && champ.currentHP < GameManager.shared.maxHP) {
      champ.currentHP = Math.min(GameManager.shared.maxHP, champ.currentHP + comp.bonusValue * dt);
    }
  }
}

export function getCompanionDamageBonus(): number {
  const bonus = CompanionManager.shared.getBonus();
  if (bonus && bonus.type === 'damage') return 1 + bonus.value / 100;
  return 1;
}

export function getCompanionDefenseBonus(): number {
  const bonus = CompanionManager.shared.getBonus();
  if (bonus && bonus.type === 'defense') return 1 - bonus.value / 100;
  return 1;
}

export function getCompanionSpeedBonus(): number {
  const bonus = CompanionManager.shared.getBonus();
  if (bonus && bonus.type === 'speed') return 1 + bonus.value / 100;
  return 1;
}

export function getCompanionXPBonus(): number {
  const bonus = CompanionManager.shared.getBonus();
  if (bonus && bonus.type === 'xp') return 1 + bonus.value / 100;
  return 1;
}
