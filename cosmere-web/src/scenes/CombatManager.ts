// ─── Combat Manager (attacks, skills, damage) ───────────────────

import { Graphics } from 'pixi.js';
import type { Container } from 'pixi.js';
import { GameManager } from '../game/GameManager';
import { gameData } from '../data/DataLoader';
import { QuestManager } from '../game/QuestManager';
import { createAttackEffect, createSkillEffect } from '../rendering/SpellEffects';
import { KomashiMechanics } from '../game/WorldMechanics';
import type { WorldEffect } from '../game/WorldMechanics';
import { drawEnemyHP } from './EntitySpawner';
import type { EnemyInstance } from './ZoneTypes';
import type { VisualEffects } from './VisualEffects';
import type { ParticleSystem } from './ParticleSystem';
import type { EnemyAI } from './EnemyAI';
import type { ActionButtons } from '../ui/ActionButtons';

const ATTACK_COOLDOWN = 0.5;

export class CombatManager {
  private attackCooldown = 0;
  private worldContainer: Container;
  private vfx: VisualEffects;
  private particleSystem: ParticleSystem;
  private enemyAI: EnemyAI | null = null;

  constructor(
    worldContainer: Container,
    vfx: VisualEffects,
    particleSystem: ParticleSystem,
  ) {
    this.worldContainer = worldContainer;
    this.vfx = vfx;
    this.particleSystem = particleSystem;
  }

  setEnemyAI(ai: EnemyAI): void {
    this.enemyAI = ai;
  }

  update(dt: number): void {
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
  }

  handleAttack(
    playerPos: { x: number; y: number },
    playerFacing: 'left' | 'right',
    enemies: EnemyInstance[],
    onKill: (enemy: EnemyInstance) => void,
  ): void {
    if (this.attackCooldown > 0) return;
    this.attackCooldown = ATTACK_COOLDOWN;

    const champ = GameManager.shared.champion;
    if (!champ) return;

    createAttackEffect(
      this.worldContainer, playerPos.x, playerPos.y,
      playerFacing, champ.championClass,
    );

    const range = 60;
    let closest: EnemyInstance | null = null;
    let closestDist = Infinity;

    for (const enemy of enemies) {
      if (enemy.isDead) continue;
      const dist = Math.hypot(enemy.position.x - playerPos.x, enemy.position.y - playerPos.y);
      if (dist < range && dist < closestDist) {
        closest = enemy;
        closestDist = dist;
      }
    }

    if (!closest) return;

    const damage = Math.max(1, champ.baseStats.strength + Math.floor(Math.random() * 5));
    const isCrit = Math.random() < champ.baseStats.luck * 0.01;
    const totalDmg = isCrit ? damage * 2 : damage;

    closest.hp -= totalDmg;
    this.vfx.showDamageNumber(closest.position.x, closest.position.y - 30, totalDmg, isCrit);
    drawEnemyHP(closest.hpBar, closest.hp / closest.data.maxHP);

    const innerSprite = closest.sprite.children[1] as Graphics;
    if (innerSprite) {
      innerSprite.tint = 0xff4444;
      const ref = closest;
      setTimeout(() => { if (!ref.isDead && innerSprite) innerSprite.tint = 0xffffff; }, 120);
    }

    if (closest.hp <= 0) {
      onKill(closest);
    }
  }

  handleSkill(
    index: number,
    playerPos: { x: number; y: number },
    enemies: EnemyInstance[],
    actionButtons: ActionButtons,
    onKill: (enemy: EnemyInstance) => void,
  ): void {
    const champ = GameManager.shared.champion;
    if (!champ || index >= champ.equippedSkillIDs.length) return;

    const skillID = champ.equippedSkillIDs[index];
    const skill = gameData.skill(skillID);
    if (!skill) return;

    if (champ.currentInvestiture < skill.investitureCost) return;
    champ.currentInvestiture -= skill.investitureCost;
    actionButtons.startCooldown(index, skill.cooldown);

    createSkillEffect(
      this.worldContainer, playerPos.x, playerPos.y,
      skill.range * 32, champ.championClass,
      this.particleSystem.activeParticles,
    );

    const range = skill.range * 32;
    for (const enemy of enemies) {
      if (enemy.isDead) continue;
      const dist = Math.hypot(enemy.position.x - playerPos.x, enemy.position.y - playerPos.y);
      if (dist < range) {
        const damage = skill.baseDamage + Math.floor(champ.baseStats.spirit * 0.5);
        enemy.hp -= damage;
        this.vfx.showDamageNumber(enemy.position.x, enemy.position.y - 30, damage, false);
        drawEnemyHP(enemy.hpBar, enemy.hp / enemy.data.maxHP);
        if (enemy.hp <= 0) onKill(enemy);
      }
    }
  }

  enemyAttacksPlayer(
    enemy: EnemyInstance,
    playerPos: { x: number; y: number },
    worldMechanics: WorldEffect,
    onDeath: () => void,
    shakeCamera: (intensity: number, duration: number) => void,
  ): void {
    const champ = GameManager.shared.champion;
    if (!champ) return;

    const defense = champ.baseStats.vigor / 2;
    const nightmareMult = worldMechanics instanceof KomashiMechanics
      ? (worldMechanics as KomashiMechanics).getDamageMultiplier() : 1;
    const bossMult = enemy.bossState
      ? enemy.bossState.getCurrentPhase(enemy.hp / enemy.data.maxHP).damageMultiplier : 1;
    const damage = Math.max(1, Math.floor((enemy.data.damage - defense) * nightmareMult * bossMult));
    champ.currentHP -= damage;

    this.vfx.showDamageNumber(playerPos.x, playerPos.y - 40, damage, false, 0xff4444);
    shakeCamera(3, 0.15);

    if (champ.currentHP <= 0) {
      champ.currentHP = 0;
      onDeath();
    }
  }

  killEnemy(
    enemy: EnemyInstance,
    worldMechanics: WorldEffect,
    actionButtons: ActionButtons,
    shakeCamera: (intensity: number, duration: number) => void,
    checkQuestCompletion: () => void,
  ): void {
    enemy.isDead = true;
    enemy.state = 'dead';
    enemy.sprite.visible = false;
    enemy.respawnTimer = enemy.spawn.respawnTime ?? 999;

    if (enemy.bossState) {
      this.vfx.showFloatingText(enemy.position.x, enemy.position.y - 60,
        enemy.bossState.config.defeatMessage, 0xffcc44);
      shakeCamera(6, 0.4);
      if (this.enemyAI) {
        this.enemyAI.bossHPBar?.destroy();
        this.enemyAI.bossHPBar = null;
        this.enemyAI.activeBoss = null;
      }
    }

    // Death particles using pool
    for (let i = 0; i < 6; i++) {
      const p = this.particleSystem.acquireGraphics();
      p.circle(0, 0, 2).fill({ color: 0xff6644, alpha: 0.6 });
      p.x = enemy.position.x;
      p.y = enemy.position.y;
      this.worldContainer.addChild(p);

      const angle = (i / 6) * Math.PI * 2;
      const speed = 30 + Math.random() * 20;
      this.particleSystem.addParticle({
        sprite: p, x: p.x, y: p.y,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 20,
        life: 0.5, maxLife: 0.5, size: 2,
      });
    }

    const gm = GameManager.shared;
    const champ = gm.champion;
    if (!champ) return;

    const gold = enemy.data.goldMin + Math.floor(Math.random() * (enemy.data.goldMax - enemy.data.goldMin + 1));
    champ.gold += gold;
    const leveledUp = gm.grantXP(enemy.data.xpReward);

    this.vfx.showDamageNumber(enemy.position.x, enemy.position.y - 10, enemy.data.xpReward, false, 0x66cc44);
    setTimeout(() => {
      this.vfx.showDamageNumber(enemy.position.x + 10, enemy.position.y, gold, false, 0xe6cc33);
    }, 200);

    for (const lootEntry of enemy.data.lootTable) {
      if (Math.random() < lootEntry.dropChance) {
        const item = gameData.item(lootEntry.itemID);
        if (item && champ) {
          champ.inventoryItemIDs.push(lootEntry.itemID);
          QuestManager.shared.onItemCollected(lootEntry.itemID);
          setTimeout(() => {
            this.vfx.showFloatingText(enemy.position.x, enemy.position.y - 30,
              `${item.name} obtenu!`, 0xaa88ff);
          }, 400);
        }
      }
    }

    QuestManager.shared.onEnemyKilled(enemy.data.id);
    checkQuestCompletion();

    if (worldMechanics instanceof KomashiMechanics) {
      const msg = (worldMechanics as KomashiMechanics).onEnemyKilled();
      if (msg) this.vfx.showFloatingText(enemy.position.x, enemy.position.y - 40, msg, 0xaa77ee);
    }

    if (leveledUp) {
      this.vfx.showLevelUp(
        this.worldContainer.parent?.parent?.width ?? 800,
        this.worldContainer.parent?.parent?.height ?? 600,
      );
      GameManager.shared.autoEquipSkills(gameData.skills);
      for (let i = 0; i < champ.equippedSkillIDs.length && i < 4; i++) {
        const skill = gameData.skill(champ.equippedSkillIDs[i]);
        if (skill) {
          const shortName = skill.name.length > 5 ? skill.name.substring(0, 5) : skill.name;
          actionButtons.setSkill(i, skill.id, shortName);
        }
      }
    }
  }

}
