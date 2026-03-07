// ─── Enemy AI (movement, detection, boss mechanics) ─────────────

import type { Container } from 'pixi.js';
import { GameManager } from '../game/GameManager';
import { createBossHPBar, createBossSpecialEffect } from '../game/BossMechanics';
import { ScadrialMechanics } from '../game/WorldMechanics';
import type { WorldEffect } from '../game/WorldMechanics';
import { isoToScreen } from './IsoUtils';
import { drawEnemyHP } from './EntitySpawner';
import type { EnemyInstance } from './ZoneTypes';
import type { VisualEffects } from './VisualEffects';

export interface BossHPBarHandle {
  container: Container;
  update: (hp: number, phase: string) => void;
  destroy: () => void;
}

export class EnemyAI {
  private worldContainer: Container;
  private uiContainer: Container;
  private vfx: VisualEffects;
  activeBoss: EnemyInstance | null = null;
  bossHPBar: BossHPBarHandle | null = null;

  constructor(worldContainer: Container, uiContainer: Container, vfx: VisualEffects) {
    this.worldContainer = worldContainer;
    this.uiContainer = uiContainer;
    this.vfx = vfx;
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
        const angle = Math.atan2(playerPos.y - enemy.position.y, playerPos.x - enemy.position.x);
        const speed = enemy.data.speed * 30 * dt * speedMult;
        enemy.position.x += Math.cos(angle) * speed;
        enemy.position.y += Math.sin(angle) * speed;
        enemy.sprite.x = enemy.position.x;
        enemy.sprite.y = enemy.position.y;
      } else {
        enemy.state = 'idle';
      }
    }
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
