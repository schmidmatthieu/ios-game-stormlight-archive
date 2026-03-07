// ─── Zone Enemy AI ────────────────────────────────────────────
// Extracted from ZoneScene.ts — enemy detection, chasing, pathfinding, attacks.

import { Graphics } from 'pixi.js';
import { GameManager } from '../../game/GameManager';
import { MusicManager } from '../../game/MusicSystem';
import { BestiaryManager } from '../../game/BestiarySystem';
import { ScadrialMechanics } from '../../game/WorldMechanics';
import type { WorldEffect } from '../../game/WorldMechanics';
import { BossState, createBossHPBar, createBossSpecialEffect } from '../../game/BossMechanics';
import { updateAffixState, getAffixDamageMultiplier, getAffixSpeedMultiplier } from '../../game/EliteAffixes';
import { updateEnemyIdle, drawBossAura, setEnemyAlert } from '../../rendering/EnemyAnimations';
import { WORLD_ENEMY_COLORS } from '../../rendering/EnemyRenderer';
import { updateBehavior } from '../../systems/EnemyBehaviors';
import type { BehaviorState } from '../../systems/EnemyBehaviors';
import { Pathfinder, smoothPath } from '../../systems/Pathfinding';
import { DayNightManager } from '../../rendering/DayNightCycle';
import type { StatusEffectManager } from '../../game/StatusEffects';
import type { AnimState } from '../../rendering/CharacterAnimations';
import { isoToScreen, screenToIso } from './ZoneTypes';
import type { EnemyInstance } from './ZoneTypes';
import type { Container } from 'pixi.js';

export interface CachedPath {
  waypoints: { x: number; y: number }[];
  idx: number;
  targetCol: number;
  targetRow: number;
  age: number;
}

export interface AIHost {
  worldContainer: Container;
  uiContainer: Container;
  screenWidth: number;
  playerScreenPos: { x: number; y: number };
  enemies: EnemyInstance[];
  worldMechanics: WorldEffect;
  dayNightManager: DayNightManager;
  playerStatusEffects: StatusEffectManager;
  playerAnimator: { setState: (state: AnimState) => void };
  enemyBehaviors: Map<string, BehaviorState>;
  enemyPaths: Map<string, CachedPath>;
  pathfinder: Pathfinder | null;
  activeBoss: EnemyInstance | null;
  bossHPBar: { container: Container; update: (hpPct: number, phaseName: string) => void; destroy: () => void } | null;
  showFloatingText: (x: number, y: number, msg: string, color: number) => void;
  showDamageNumber: (x: number, y: number, amount: number, isCrit: boolean, color?: number, style?: string) => void;
  shakeCamera: (intensity: number, duration: number) => void;
  drawEnemyHP: (hpBar: Graphics, pct: number) => void;
  enemyAttacksPlayer: (enemy: EnemyInstance, dmgMult: number) => void;
  handlePlayerDeath: () => void;
}

export function updateEnemyAI(dt: number, host: AIHost): void {
  const playerPos = host.playerScreenPos;

  for (const enemy of host.enemies) {
    if (enemy.isDead) {
      enemy.respawnTimer -= dt;
      if (enemy.respawnTimer <= 0 && enemy.spawn.respawnTime) {
        enemy.hp = enemy.maxHP;
        enemy.isDead = false;
        enemy.state = 'idle';
        enemy.sprite.visible = true;
        const pos = isoToScreen(enemy.spawn.position.col, enemy.spawn.position.row);
        enemy.position = { ...pos };
        enemy.sprite.x = pos.x;
        enemy.sprite.y = pos.y;
        host.drawEnemyHP(enemy.hpBar, 1);
      }
      continue;
    }

    // Animate enemy idle (breathing, sway)
    if (enemy.enemyAnim) {
      updateEnemyIdle(enemy.sprite, enemy.enemyAnim, dt, enemy.data.tier);
      // Boss aura animation
      if (enemy.data.tier === 'boss' && enemy.bossState?.announced) {
        const phase = enemy.bossState.currentPhase + 1;
        enemy.bossAuraGfx = drawBossAura(enemy.sprite, enemy.enemyAnim.timer, WORLD_ENEMY_COLORS[enemy.data.worldID]?.boss ?? 0xcc5500, phase, enemy.bossAuraGfx);
      }
    }

    const dist = Math.hypot(enemy.position.x - playerPos.x, enemy.position.y - playerPos.y);
    const mistMult = host.worldMechanics instanceof ScadrialMechanics
      ? (host.worldMechanics as ScadrialMechanics).getDetectionMultiplier() : 1;
    // Night: ambush enemies detect further, others detect shorter
    const nightMult = enemy.data.behavior === 'ambush' ? (2 - host.dayNightManager.lightLevel) : host.dayNightManager.lightLevel;
    const detRange = enemy.data.detectionRange * 32 * mistMult * Math.max(0.5, nightMult);
    const atkRange = enemy.data.attackRange * 32;

    enemy.attackCooldown = Math.max(0, enemy.attackCooldown - dt);

    // Boss mechanics
    if (enemy.bossState && dist < detRange) {
      updateBossMechanics(enemy, dist, detRange, dt, host);
    }

    // Affix mechanics update
    if (enemy.affixState) {
      updateAffixMechanics(enemy, dt, dist, detRange, host);
    }

    // Speed multiplier for boss phases and affixes
    const bossSpeedMult = enemy.bossState
      ? enemy.bossState.getCurrentPhase(enemy.hp / enemy.maxHP).speedMultiplier : 1;
    const affixSpeedMult = enemy.affixState ? getAffixSpeedMultiplier(enemy.affixState) : 1;
    const speedMult = bossSpeedMult * affixSpeedMult;

    // Behavior-specific AI
    const behaviorKey = enemy.data.id + '_' + enemy.spawn.position.col + '_' + enemy.spawn.position.row;
    const behaviorState = host.enemyBehaviors.get(behaviorKey);
    const hpPct = enemy.hp / (enemy.maxHP || enemy.data.maxHP);
    const patrolWaypoints = enemy.spawn.patrolPath
      ? enemy.spawn.patrolPath.map(p => isoToScreen(p.col, p.row))
      : null;
    const enemyIdx = host.enemies.indexOf(enemy);
    const bResult = behaviorState
      ? updateBehavior(behaviorState, dt, enemy.position.x, enemy.position.y,
          playerPos.x, playerPos.y, dist, detRange, atkRange, hpPct,
          host.enemies, enemyIdx, patrolWaypoints)
      : null;

    // Apply behavior detection modifier
    const effectiveDetRange = bResult ? detRange * bResult.detectionMult : detRange;

    // Support heal logic
    if (bResult?.shouldHealAlly && bResult.healTargetIndex >= 0 && bResult.healTargetIndex < host.enemies.length) {
      const ally = host.enemies[bResult.healTargetIndex];
      if (!ally.isDead) {
        const healAmt = Math.floor((enemy.maxHP || enemy.data.maxHP) * 0.1);
        ally.hp = Math.min(ally.maxHP || ally.data.maxHP, ally.hp + healAmt);
        host.drawEnemyHP(ally.hpBar, ally.hp / (ally.maxHP || ally.data.maxHP));
        host.showFloatingText(ally.position.x, ally.position.y - 30, `+${healAmt}`, 0x44ff44);
        MusicManager.shared.playSFX('heal');
      }
    }

    // Movement logic
    applyEnemyMovement(enemy, dt, dist, atkRange, effectiveDetRange, speedMult, bResult, behaviorKey, playerPos, host);
  }
}

function updateBossMechanics(
  enemy: EnemyInstance, dist: number, detRange: number, dt: number, host: AIHost,
): void {
  if (!enemy.bossState) return;
  const playerPos = host.playerScreenPos;

  if (!enemy.bossState.announced) {
    enemy.bossState.announced = true;
    host.activeBoss = enemy;
    host.showFloatingText(enemy.position.x, enemy.position.y - 50,
      enemy.bossState.config.entranceMessage, 0xff6644);
    host.bossHPBar = createBossHPBar(host.uiContainer, host.screenWidth, enemy.data.name);
    host.shakeCamera(5, 0.3);
  }

  const hpPct = enemy.hp / enemy.maxHP;
  const result = enemy.bossState.update(dt, hpPct);

  if (result.phaseChanged && result.message) {
    host.showFloatingText(enemy.position.x, enemy.position.y - 50, result.message, 0xff4444);
    host.shakeCamera(4, 0.2);
  }

  if (result.canSpecialAttack && dist < detRange) {
    const phase = enemy.bossState.getCurrentPhase(hpPct);
    const effect = createBossSpecialEffect(
      host.worldContainer, enemy.position.x, enemy.position.y,
      playerPos.x, playerPos.y, phase.specialAttack,
    );
    const champ = GameManager.shared.champion;
    if (champ) {
      const shieldReduct = 1 - host.playerStatusEffects.getDamageReduction();
      const dmg = Math.max(1, Math.floor(effect.damage * phase.damageMultiplier * shieldReduct));
      champ.currentHP -= dmg;
      host.showDamageNumber(playerPos.x, playerPos.y - 40, dmg, false, 0xff4444);
      host.shakeCamera(3, 0.15);
      host.playerAnimator.setState('hurt');

      // Boss attacks can inflict status effects
      const statusByAttack: Record<string, { type: 'poison' | 'burning' | 'frozen' | 'weakened' | 'blinded'; dur: number; mag: number }> = {
        spike_barrage: { type: 'poison', dur: 8, mag: 5 },
        dark_sand: { type: 'blinded', dur: 5, mag: 1 },
        void_consume: { type: 'weakened', dur: 10, mag: 1 },
        stomp_wave: { type: 'frozen', dur: 2, mag: 1 },
        fear_pulse: { type: 'weakened', dur: 6, mag: 1 },
      };
      const statusInfo = statusByAttack[phase.specialAttack];
      if (statusInfo) {
        const msg = host.playerStatusEffects.apply(statusInfo.type, statusInfo.dur, statusInfo.mag);
        if (msg) host.showFloatingText(playerPos.x, playerPos.y - 55, msg, 0xff8844);
      }

      if (champ.currentHP <= 0) {
        champ.currentHP = 0;
        host.playerAnimator.setState('death');
        host.handlePlayerDeath();
      }
    }
  }

  host.bossHPBar?.update(hpPct, enemy.bossState.config.phases[enemy.bossState.currentPhase].name);
}

function updateAffixMechanics(
  enemy: EnemyInstance, dt: number, dist: number, detRange: number, host: AIHost,
): void {
  if (!enemy.affixState) return;
  const affixResult = updateAffixState(enemy.affixState, dt, enemy.maxHP, enemy.hp);
  if (affixResult.regenHP > 0 && enemy.hp < enemy.maxHP) {
    enemy.hp = Math.min(enemy.maxHP, enemy.hp + affixResult.regenHP);
    host.drawEnemyHP(enemy.hpBar, enemy.hp / enemy.maxHP);
  }
  if (affixResult.shouldTeleport && dist < detRange) {
    const ox = (Math.random() - 0.5) * 80;
    const oy = (Math.random() - 0.5) * 80;
    enemy.position.x += ox;
    enemy.position.y += oy;
    enemy.sprite.x = enemy.position.x;
    enemy.sprite.y = enemy.position.y;
  }
  // Shield visual
  if (affixResult.shieldChanged) {
    const gfx = enemy.sprite.children[1] as Graphics;
    if (gfx) gfx.alpha = enemy.affixState.shieldActive ? 0.4 : 1.0;
  }
}

function applyEnemyMovement(
  enemy: EnemyInstance, dt: number,
  dist: number, atkRange: number, effectiveDetRange: number,
  speedMult: number, bResult: ReturnType<typeof updateBehavior> | null,
  behaviorKey: string,
  playerPos: { x: number; y: number },
  host: AIHost,
): void {
  // Flee behavior override
  if (bResult?.shouldFlee) {
    enemy.state = 'chasing';
    const speed = enemy.data.speed * 35 * dt * speedMult;
    enemy.position.x += bResult.moveX * speed;
    enemy.position.y += bResult.moveY * speed;
    enemy.sprite.x = enemy.position.x;
    enemy.sprite.y = enemy.position.y;
  } else if (dist < atkRange && enemy.attackCooldown <= 0) {
    // Ranged enemies back away when too close
    if (bResult && enemy.data.behavior === 'ranged' && bResult.shouldMove) {
      const speed = enemy.data.speed * 25 * dt * speedMult;
      enemy.position.x += bResult.moveX * speed;
      enemy.position.y += bResult.moveY * speed;
      enemy.sprite.x = enemy.position.x;
      enemy.sprite.y = enemy.position.y;
    } else {
      enemy.state = 'attacking';
      const atkSpeedMult = bResult?.attackSpeedMult ?? 1;
      enemy.attackCooldown = 1.5 / atkSpeedMult;
      host.enemyAttacksPlayer(enemy, bResult?.damageMult ?? 1);
    }
  } else if (dist < effectiveDetRange) {
    if (enemy.state !== 'chasing') {
      BestiaryManager.shared.registerEncounter(enemy.data);
      if (enemy.enemyAnim) setEnemyAlert(enemy.enemyAnim);
    }
    enemy.state = 'chasing';
    const speed = enemy.data.speed * 30 * dt * speedMult;

    // Guard behavior: return to post if too far
    if (bResult?.shouldMove && enemy.data.behavior === 'guard') {
      enemy.position.x += bResult.moveX * speed;
      enemy.position.y += bResult.moveY * speed;
      enemy.sprite.x = enemy.position.x;
      enemy.sprite.y = enemy.position.y;
    } else {
      // A* pathfinding movement
      applyPathfinding(enemy, speed, behaviorKey, playerPos, host);
    }
  } else {
    // Idle: behavior-specific idle movement (patrol, wander)
    if (bResult?.shouldMove && !bResult.shouldFlee) {
      const speed = enemy.data.speed * 15 * dt;
      enemy.position.x += bResult.moveX * speed;
      enemy.position.y += bResult.moveY * speed;
      enemy.sprite.x = enemy.position.x;
      enemy.sprite.y = enemy.position.y;
      enemy.state = 'idle';
    } else {
      enemy.state = 'idle';
    }
    host.enemyPaths.delete(behaviorKey);
  }
}

function applyPathfinding(
  enemy: EnemyInstance, speed: number,
  pathKey: string, playerPos: { x: number; y: number },
  host: AIHost,
): void {
  let cached = host.enemyPaths.get(pathKey);
  const eGrid = screenToIso(enemy.position.x, enemy.position.y);
  const pGrid = screenToIso(playerPos.x, playerPos.y);
  const eCol = Math.round(eGrid.col);
  const eRow = Math.round(eGrid.row);
  const pCol = Math.round(pGrid.col);
  const pRow = Math.round(pGrid.row);

  const dt = speed > 0 ? 1 / 60 : 0; // approximate dt for age tracking
  const needsPath = !cached || cached.age > 0.8 ||
    cached.targetCol !== pCol || cached.targetRow !== pRow ||
    cached.idx >= cached.waypoints.length;

  if (needsPath && host.pathfinder) {
    const gridPath = host.pathfinder.findPath(eCol, eRow, pCol, pRow);
    if (gridPath && gridPath.length > 1) {
      const smooth = smoothPath(gridPath);
      cached = { waypoints: smooth.map(g => isoToScreen(g.col, g.row)), idx: 1, targetCol: pCol, targetRow: pRow, age: 0 };
      host.enemyPaths.set(pathKey, cached);
    } else {
      cached = undefined;
    }
  }

  if (cached) {
    cached.age += dt;
    if (cached.idx < cached.waypoints.length) {
      const wp = cached.waypoints[cached.idx];
      const dx = wp.x - enemy.position.x;
      const dy = wp.y - enemy.position.y;
      if (Math.hypot(dx, dy) < 8) {
        cached.idx++;
      } else {
        const a = Math.atan2(dy, dx);
        enemy.position.x += Math.cos(a) * speed;
        enemy.position.y += Math.sin(a) * speed;
      }
    }
  } else {
    const angle = Math.atan2(playerPos.y - enemy.position.y, playerPos.x - enemy.position.x);
    enemy.position.x += Math.cos(angle) * speed;
    enemy.position.y += Math.sin(angle) * speed;
  }
  enemy.sprite.x = enemy.position.x;
  enemy.sprite.y = enemy.position.y;
}
