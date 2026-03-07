// ─── Enemy AI (movement, detection, boss mechanics) ─────────────

import type { Container } from 'pixi.js';
import { GameManager } from '../game/GameManager';
import { createBossHPBar, createBossSpecialEffect } from '../game/BossMechanics';
import { ScadrialMechanics } from '../game/WorldMechanics';
import type { WorldEffect } from '../game/WorldMechanics';
import { isoToScreen, screenToIso } from './IsoUtils';
import { drawEnemyHP } from './EntitySpawner';
import type { EnemyInstance } from './ZoneTypes';
import type { VisualEffects } from './VisualEffects';
import { Pathfinder, smoothPath } from '../systems/Pathfinding';

export interface BossHPBarHandle {
  container: Container;
  update: (hp: number, phase: string) => void;
  destroy: () => void;
}

/** Cached A* path data per enemy */
interface CachedPath {
  waypoints: { x: number; y: number }[];
  waypointIndex: number;
  targetCol: number;
  targetRow: number;
  age: number; // seconds since last recompute
}

const PATH_RECOMPUTE_INTERVAL = 0.8; // recompute path every N seconds
const PATH_WAYPOINT_THRESHOLD = 8;   // pixels distance to advance waypoint

export class EnemyAI {
  private worldContainer: Container;
  private uiContainer: Container;
  private vfx: VisualEffects;
  private pathfinder: Pathfinder | null = null;
  private pathCache: Map<string, CachedPath> = new Map();
  activeBoss: EnemyInstance | null = null;
  bossHPBar: BossHPBarHandle | null = null;

  constructor(worldContainer: Container, uiContainer: Container, vfx: VisualEffects) {
    this.worldContainer = worldContainer;
    this.uiContainer = uiContainer;
    this.vfx = vfx;
  }

  setPathfinder(pathfinder: Pathfinder): void {
    this.pathfinder = pathfinder;
    this.pathCache.clear();
  }

  update(
    dt: number,
    playerPos: { x: number; y: number },
    enemies: EnemyInstance[],
    worldMechanics: WorldEffect,
    screenW: number,
    onDeath: () => void,
    shakeCamera: (intensity: number, duration: number) => void,
    onEnemyAttack: (enemy: EnemyInstance, playerPos: { x: number; y: number }, worldMechanics: WorldEffect, onDeath: () => void, shakeCamera: (i: number, d: number) => void) => void,
  ): void {
    for (const enemy of enemies) {
      if (enemy.isDead) {
        this.handleRespawn(enemy, dt);
        continue;
      }

      const dist = Math.hypot(enemy.position.x - playerPos.x, enemy.position.y - playerPos.y);
      const mistMult = worldMechanics instanceof ScadrialMechanics
        ? (worldMechanics as ScadrialMechanics).getDetectionMultiplier() : 1;
      const detRange = enemy.data.detectionRange * 32 * mistMult;
      const atkRange = enemy.data.attackRange * 32;

      enemy.attackCooldown = Math.max(0, enemy.attackCooldown - dt);

      // Boss mechanics
      if (enemy.bossState && dist < detRange) {
        this.updateBoss(enemy, dt, dist, detRange, playerPos, screenW, onDeath, shakeCamera);
      }

      const speedMult = enemy.bossState
        ? enemy.bossState.getCurrentPhase(enemy.hp / enemy.data.maxHP).speedMultiplier : 1;

      if (dist < atkRange && enemy.attackCooldown <= 0) {
        enemy.state = 'attacking';
        enemy.attackCooldown = 1.5;
        onEnemyAttack(enemy, playerPos, worldMechanics, onDeath, shakeCamera);
      } else if (dist < detRange) {
        enemy.state = 'chasing';
        const speed = enemy.data.speed * 30 * dt * speedMult;
        this.moveAlongPath(enemy, playerPos, speed, dt);
      } else {
        // Clear cached path when enemy loses sight
        this.pathCache.delete(enemy.data.id + '_' + enemy.spawn.position.col + '_' + enemy.spawn.position.row);
        enemy.state = 'idle';
      }
    }
  }

  private moveAlongPath(
    enemy: EnemyInstance,
    playerPos: { x: number; y: number },
    speed: number,
    dt: number,
  ): void {
    const cacheKey = enemy.data.id + '_' + enemy.spawn.position.col + '_' + enemy.spawn.position.row;
    let cached = this.pathCache.get(cacheKey);

    // Convert positions to grid coords
    const enemyGrid = screenToIso(enemy.position.x, enemy.position.y);
    const playerGrid = screenToIso(playerPos.x, playerPos.y);
    const eCol = Math.round(enemyGrid.col);
    const eRow = Math.round(enemyGrid.row);
    const pCol = Math.round(playerGrid.col);
    const pRow = Math.round(playerGrid.row);

    // Recompute path if needed
    const needsRecompute = !cached ||
      cached.age > PATH_RECOMPUTE_INTERVAL ||
      cached.targetCol !== pCol || cached.targetRow !== pRow ||
      cached.waypointIndex >= cached.waypoints.length;

    if (needsRecompute && this.pathfinder) {
      const gridPath = this.pathfinder.findPath(eCol, eRow, pCol, pRow);
      if (gridPath && gridPath.length > 1) {
        const smooth = smoothPath(gridPath);
        const waypoints = smooth.map(g => isoToScreen(g.col, g.row));
        cached = { waypoints, waypointIndex: 1, targetCol: pCol, targetRow: pRow, age: 0 };
        this.pathCache.set(cacheKey, cached);
      } else {
        // Fallback: direct movement if no path found
        const angle = Math.atan2(playerPos.y - enemy.position.y, playerPos.x - enemy.position.x);
        enemy.position.x += Math.cos(angle) * speed;
        enemy.position.y += Math.sin(angle) * speed;
        enemy.sprite.x = enemy.position.x;
        enemy.sprite.y = enemy.position.y;
        return;
      }
    }

    if (!cached) {
      // No pathfinder set — use direct movement
      const angle = Math.atan2(playerPos.y - enemy.position.y, playerPos.x - enemy.position.x);
      enemy.position.x += Math.cos(angle) * speed;
      enemy.position.y += Math.sin(angle) * speed;
      enemy.sprite.x = enemy.position.x;
      enemy.sprite.y = enemy.position.y;
      return;
    }

    cached.age += dt;

    // Move towards current waypoint
    if (cached.waypointIndex < cached.waypoints.length) {
      const target = cached.waypoints[cached.waypointIndex];
      const dx = target.x - enemy.position.x;
      const dy = target.y - enemy.position.y;
      const wpDist = Math.hypot(dx, dy);

      if (wpDist < PATH_WAYPOINT_THRESHOLD) {
        cached.waypointIndex++;
      } else {
        const angle = Math.atan2(dy, dx);
        enemy.position.x += Math.cos(angle) * speed;
        enemy.position.y += Math.sin(angle) * speed;
      }
    }

    enemy.sprite.x = enemy.position.x;
    enemy.sprite.y = enemy.position.y;
  }

  private handleRespawn(enemy: EnemyInstance, dt: number): void {
    enemy.respawnTimer -= dt;
    if (enemy.respawnTimer <= 0 && enemy.spawn.respawnTime) {
      enemy.hp = enemy.data.maxHP;
      enemy.isDead = false;
      enemy.state = 'idle';
      enemy.sprite.visible = true;
      const pos = isoToScreen(enemy.spawn.position.col, enemy.spawn.position.row);
      enemy.position = { ...pos };
      enemy.sprite.x = pos.x;
      enemy.sprite.y = pos.y;
      drawEnemyHP(enemy.hpBar, 1);
    }
  }

  private updateBoss(
    enemy: EnemyInstance,
    dt: number,
    dist: number,
    detRange: number,
    playerPos: { x: number; y: number },
    screenW: number,
    onDeath: () => void,
    shakeCamera: (intensity: number, duration: number) => void,
  ): void {
    if (!enemy.bossState) return;

    if (!enemy.bossState.announced) {
      enemy.bossState.announced = true;
      this.activeBoss = enemy;
      this.vfx.showFloatingText(enemy.position.x, enemy.position.y - 50,
        enemy.bossState.config.entranceMessage, 0xff6644);
      this.bossHPBar = createBossHPBar(this.uiContainer, screenW, enemy.data.name);
      shakeCamera(5, 0.3);
    }

    const hpPct = enemy.hp / enemy.data.maxHP;
    const result = enemy.bossState.update(dt, hpPct);

    if (result.phaseChanged && result.message) {
      this.vfx.showFloatingText(enemy.position.x, enemy.position.y - 50, result.message, 0xff4444);
      shakeCamera(4, 0.2);
    }

    if (result.canSpecialAttack && dist < detRange) {
      const phase = enemy.bossState.getCurrentPhase(hpPct);
      const effect = createBossSpecialEffect(
        this.worldContainer, enemy.position.x, enemy.position.y,
        playerPos.x, playerPos.y, phase.specialAttack,
      );
      const champ = GameManager.shared.champion;
      if (champ) {
        const dmg = Math.floor(effect.damage * phase.damageMultiplier);
        champ.currentHP -= dmg;
        this.vfx.showDamageNumber(playerPos.x, playerPos.y - 40, dmg, false, 0xff4444);
        shakeCamera(3, 0.15);
        if (champ.currentHP <= 0) {
          champ.currentHP = 0;
          onDeath();
        }
      }
    }

    this.bossHPBar?.update(hpPct, enemy.bossState.config.phases[enemy.bossState.currentPhase].name);
  }
}
