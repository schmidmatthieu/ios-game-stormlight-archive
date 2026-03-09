// ─── Zone Animations ────────────────────────────────────────────
// Extracted from ZoneScene.ts — player, enemy, NPC, and loot animations.

import { Container, Graphics, Text } from 'pixi.js';
import { GameManager } from '../../game/GameManager';
import { CharacterAnimator, applyAnimationToPlayer, drawClassAura } from '../../rendering/CharacterAnimations';
import type { PlayerBodyParts } from '../../rendering/PlayerRenderer';
import type { EnemyInstance, NPCInstance, LootInstance } from './ZoneTypes';

export interface AnimationHost {
  worldContainer: Container;
  playerContainer: Container;
  playerSprite: Container;
  playerShadow: Graphics;
  playerAnimator: CharacterAnimator;
  playerBodyParts: PlayerBodyParts | null;
  playerAuraSprite: Graphics | null;
  playerScreenPos: { x: number; y: number };
  playerFacing: 'left' | 'right';
  playerAnimTimer: number;
  joystickActive: boolean;
  joystickMagnitude: number;
  keyboardMoving: boolean;
  enemies: EnemyInstance[];
  npcs: NPCInstance[];
  lootPoints: LootInstance[];
}

export function updateAnimations(dt: number, host: AnimationHost): Graphics | null {
  host.playerAnimTimer += dt * 4;

  // Update character animator state based on movement
  const isMoving = host.keyboardMoving || (host.joystickActive && host.joystickMagnitude > 0);
  const state = host.playerAnimator.state;
  if (state !== 'attack' && state !== 'hurt' && state !== 'cast' && state !== 'death') {
    host.playerAnimator.setState(isMoving ? 'walk' : 'idle');
  }
  host.playerAnimator.facing = host.playerFacing;
  host.playerAnimator.update(dt);

  // Apply animator transforms
  applyAnimationToPlayer(
    host.playerContainer, host.playerSprite,
    host.playerShadow, host.playerAnimator, host.playerBodyParts,
  );

  // Hurt flash tint
  const hurtTint = host.playerAnimator.hurtFlash > 0 ? 0xff4444 : 0xffffff;
  for (const child of host.playerSprite.children) {
    if (child instanceof Graphics) {
      child.tint = hurtTint;
    }
  }

  // Class aura effect
  let auraSprite = host.playerAuraSprite;
  const champ = GameManager.shared.champion;
  if (champ) {
    const aura = drawClassAura(
      host.worldContainer,
      host.playerScreenPos.x, host.playerScreenPos.y,
      champ.championClass, host.playerAnimator,
      auraSprite,
    );
    if (aura && !auraSprite) {
      aura.zIndex = host.playerContainer.zIndex - 1;
      host.worldContainer.addChild(aura);
      auraSprite = aura;
    }
    if (auraSprite) {
      auraSprite.zIndex = host.playerContainer.zIndex - 1;
    }
  }

  // Enemy idle bob
  for (const enemy of host.enemies) {
    if (enemy.isDead) continue;
    enemy.animTimer += dt * 2;
    const innerSprite = enemy.sprite.children[1];
    if (innerSprite) {
      innerSprite.y = Math.sin(enemy.animTimer) * 1;
    }
  }

  // NPC idle animation
  for (const npc of host.npcs) {
    const t = performance.now() / 1000;
    const questBang = npc.sprite.children.find(c => c instanceof Text && (c as Text).text === '!');
    if (questBang) {
      questBang.scale.set(1 + Math.sin(t * 3) * 0.15);
    }
  }

  // Loot sparkle
  for (const loot of host.lootPoints) {
    if (loot.collected || loot.isHidden) continue;
    const t = performance.now() / 1000;
    loot.sprite.alpha = 0.85 + Math.sin(t * 2) * 0.15;
  }

  return auraSprite;
}
