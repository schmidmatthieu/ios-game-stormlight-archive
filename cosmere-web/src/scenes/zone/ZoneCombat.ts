// ─── Zone Combat ──────────────────────────────────────────────
// Extracted from ZoneScene.ts — kill rewards, loot drops, status effects.

import { Container, Graphics } from 'pixi.js';
import { GameManager } from '../../game/GameManager';
import { gameData } from '../../data/DataLoader';
import { MusicManager } from '../../game/MusicSystem';
import { BestiaryManager } from '../../game/BestiarySystem';
import { AchievementManager } from '../../game/AchievementSystem';
import { QuestManager } from '../../game/QuestManager';
import { NewGamePlusManager } from '../../systems/NewGamePlus';
import { HiddenQuestManager } from '../../systems/HiddenQuests';
import { PotionManager } from '../../game/PotionSystem';
import { ComboManager } from '../../game/ComboSystem';
import { KomashiMechanics } from '../../game/WorldMechanics';
import type { WorldEffect } from '../../game/WorldMechanics';
import { animateEnemyDeath } from '../../rendering/CharacterAnimations';
import { triggerEnemyDeath } from '../../rendering/EnemyAnimations';
import { WORLD_ENEMY_COLORS } from '../../rendering/EnemyRenderer';
import { createKillBurst, showKillStreakBanner, createGroundCrack } from '../../rendering/CombatFeedback';
import { spawnLootDrop, spawnGoldBurst, spawnXPOrbs } from '../../rendering/LootAnimations';
import { addReputation, showRankUpEffect, getBonusXPMultiplier } from '../../game/ReputationSystem';
import type { StatusEffectManager } from '../../game/StatusEffects';
import { spawnStatusParticle } from '../../game/StatusEffects';
import { ObjectPool } from '../../systems/ObjectPool';
import { getCompanionXPBonus } from './ZoneCompanion';
import { CompanionManager } from '../../game/CompanionSystem';
import { getEventXPBonus, getEventGoldBonus } from './ZoneEnvironment';
import type { EnemyInstance, Particle } from './ZoneTypes';
import type { WorldEventEffect } from '../../game/WorldEvents';

// ─── Kill Enemy ──────────────────────────────────────────────

export interface KillHost {
  worldContainer: Container;
  uiContainer: Container;
  screenWidth: number;
  screenHeight: number;
  worldID: string;
  playerScreenPos: { x: number; y: number };
  particles: Particle[];
  particlePool: ObjectPool<Graphics>;
  killStreak: number;
  killStreakTimer: number;
  activeBoss: EnemyInstance | null;
  bossHPBar: { destroy: () => void } | null;
  worldMechanics: WorldEffect;
  activeEventEffect: WorldEventEffect | null;
  repBadge: { refresh: () => void } | null;
  potionHotbar: { refresh: () => void } | null;
  actionButtons: { setSkill: (i: number, id: string, name: string) => void };
  showFloatingText: (x: number, y: number, msg: string, color: number) => void;
  showDamageNumber: (x: number, y: number, amount: number, isCrit: boolean, color?: number, style?: string, combo?: number) => void;
  showLevelUp: () => void;
  shakeCamera: (intensity: number, duration: number) => void;
  drawEnemyHP: (hpBar: Graphics, pct: number) => void;
  checkQuestCompletion: () => void;
}

export function killEnemy(enemy: EnemyInstance, host: KillHost): void {
  enemy.isDead = true;
  enemy.state = 'dead';
  if (enemy.enemyAnim) triggerEnemyDeath(enemy.enemyAnim);
  if (enemy.bossAuraGfx) { enemy.sprite.removeChild(enemy.bossAuraGfx); enemy.bossAuraGfx.destroy(); enemy.bossAuraGfx = undefined; }
  MusicManager.shared.playSFX('death');

  // Kill burst visual
  const worldColor = WORLD_ENEMY_COLORS[enemy.data.worldID]?.[enemy.data.tier] ?? 0x888888;
  createKillBurst(host.worldContainer, enemy.position.x, enemy.position.y, enemy.data.tier, worldColor);

  // Ground crack for elite/boss kills
  if (enemy.data.tier === 'elite' || enemy.data.tier === 'boss') {
    createGroundCrack(host.worldContainer, enemy.position.x, enemy.position.y, enemy.data.tier === 'boss' ? 30 : 18);
  }

  // Kill streak tracking
  host.killStreak++;
  host.killStreakTimer = 5;
  if ([3, 5, 7, 10, 15].includes(host.killStreak)) {
    showKillStreakBanner(host.uiContainer, host.screenWidth, host.screenHeight, host.killStreak);
  }

  // Track in bestiary & achievements
  BestiaryManager.shared.registerKill(enemy.data);
  AchievementManager.shared.recordKill(enemy.data.tier);
  AchievementManager.shared.recordCreatureDiscovered(BestiaryManager.shared.totalDiscovered);

  // Hidden quest: rare enemy kills
  if (enemy.data.tier === 'elite' || enemy.data.tier === 'boss') {
    const hqNotifs = HiddenQuestManager.shared.reportTrigger('kill_rare_enemy', 'nightmare_rare', host.worldID);
    for (const n of hqNotifs) {
      host.showFloatingText(host.playerScreenPos.x, host.playerScreenPos.y - 70, n.message, n.completed ? 0xffdd44 : 0x88ccff);
    }
  }

  // Animated death instead of instant hide
  animateEnemyDeath(enemy.sprite, host.worldContainer, enemy.position.x, enemy.position.y);
  setTimeout(() => { enemy.sprite.visible = false; }, 500);
  enemy.respawnTimer = enemy.spawn.respawnTime ?? 999;

  // Boss defeat
  if (enemy.bossState) {
    host.showFloatingText(enemy.position.x, enemy.position.y - 60,
      enemy.bossState.config.defeatMessage, 0xffcc44);
    host.shakeCamera(6, 0.4);
    if (host.bossHPBar) {
      host.bossHPBar.destroy();
      host.bossHPBar = null;
    }
    host.activeBoss = null;
  }

  // Death particles (pooled)
  for (let i = 0; i < 6; i++) {
    const p = host.particlePool.acquire();
    p.circle(0, 0, 2).fill({ color: 0xff6644, alpha: 0.6 });
    p.x = enemy.position.x;
    p.y = enemy.position.y;
    host.worldContainer.addChild(p);

    const angle = (i / 6) * Math.PI * 2;
    const speed = 30 + Math.random() * 20;
    host.particles.push({
      sprite: p, x: p.x, y: p.y,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 20,
      life: 0.5, maxLife: 0.5, size: 2,
    });
  }

  const gm = GameManager.shared;
  const champ = gm.champion;
  if (!champ) return;

  const ngpRewards = NewGamePlusManager.shared.applyToRewards(
    enemy.data.xpReward,
    enemy.data.goldMin + Math.floor(Math.random() * (enemy.data.goldMax - enemy.data.goldMin + 1)),
  );
  const baseGold = ngpRewards.gold;
  const gold = Math.floor(baseGold * getEventGoldBonus(host.activeEventEffect));
  champ.gold += gold;

  // Apply reputation XP bonus + event bonus + NG+ bonus
  const xpMultiplier = getBonusXPMultiplier(host.worldID);
  const finalXP = Math.floor(ngpRewards.xp * xpMultiplier * getCompanionXPBonus() * getEventXPBonus(host.activeEventEffect));
  const leveledUp = gm.grantXP(finalXP);
  if (leveledUp) MusicManager.shared.playSFX('level_up');

  // Grant reputation based on enemy tier
  const repByTier: Record<string, number> = { minion: 1, soldier: 2, elite: 4, boss: 15 };
  const repGain = repByTier[enemy.data.tier] ?? 1;
  const repResult = addReputation(host.worldID, repGain);
  if (repResult.rankUp) {
    showRankUpEffect(host.uiContainer, host.screenWidth, host.screenHeight, repResult.rankName, host.worldID);
  }
  if (host.repBadge) host.repBadge.refresh();

  // Check companion unlock conditions (kill count, boss kills)
  const unlockedCompanion = CompanionManager.shared.recordKill(host.worldID, !!enemy.bossState);
  if (unlockedCompanion) {
    host.showFloatingText(host.playerScreenPos.x, host.playerScreenPos.y - 90,
      `Compagnon débloqué: ${unlockedCompanion}!`, 0xffdd44);
  }

  host.showDamageNumber(enemy.position.x, enemy.position.y - 10, finalXP, false, 0x66cc44);
  setTimeout(() => {
    host.showDamageNumber(enemy.position.x + 10, enemy.position.y, gold, false, 0xe6cc33);
  }, 200);

  // Track achievements
  AchievementManager.shared.recordGold(gold);
  AchievementManager.shared.recordXP(finalXP);
  if (leveledUp) AchievementManager.shared.recordLevel(champ.level);
  AchievementManager.shared.check();

  // Chance to drop potions
  const potionDropChance = enemy.data.tier === 'boss' ? 1 : enemy.data.tier === 'elite' ? 0.5 : 0.2;
  if (Math.random() < potionDropChance) {
    const potionPool = ['potion_heal_small', 'potion_investiture', 'potion_heal_small', 'potion_strength', 'potion_haste', 'potion_shield', 'potion_regen'];
    const potionID = potionPool[Math.floor(Math.random() * potionPool.length)];
    if (PotionManager.shared.addPotion(potionID)) {
      host.showFloatingText(enemy.position.x, enemy.position.y - 50, `+1 Potion!`, 0xff88cc);
      if (host.potionHotbar) host.potionHotbar.refresh();
    }
  }

  // Animated gold burst and XP orbs
  spawnGoldBurst(host.worldContainer, enemy.position.x, enemy.position.y, gold);
  spawnXPOrbs(host.worldContainer, enemy.position.x, enemy.position.y,
    host.playerScreenPos.x, host.playerScreenPos.y, finalXP);

  // Drop loot from loot table
  let dropIndex = 0;
  for (const lootEntry of enemy.data.lootTable) {
    if (Math.random() < lootEntry.dropChance) {
      const item = gameData.item(lootEntry.itemID);
      if (item && champ) {
        champ.inventoryItemIDs.push(lootEntry.itemID);
        QuestManager.shared.onItemCollected(lootEntry.itemID);
        BestiaryManager.shared.registerDrop(enemy.data.id, lootEntry.itemID);
        AchievementManager.shared.recordItemCollect();

        // Loot SFX based on rarity
        const lootSfxMap: Record<string, string> = {
          common: 'loot_common', uncommon: 'loot_common',
          rare: 'loot_rare', epic: 'loot_epic',
          legendary: 'loot_legendary', cosmeric: 'loot_legendary',
        };
        MusicManager.shared.playSFX(lootSfxMap[item.rarity] ?? 'loot_common');

        // Animated loot drop
        spawnLootDrop(host.worldContainer, enemy.position.x, enemy.position.y,
          item.name, item.rarity, dropIndex);
        dropIndex++;

        setTimeout(() => {
          host.showFloatingText(
            enemy.position.x, enemy.position.y - 30,
            `${item.name} obtenu!`, 0xaa88ff,
          );
        }, 400);
      }
    }
  }

  // Track quest progress
  QuestManager.shared.onEnemyKilled(enemy.data.id);
  host.checkQuestCompletion();

  // Komashi: killing enemies reduces nightmare aura
  if (host.worldMechanics instanceof KomashiMechanics) {
    const msg = (host.worldMechanics as KomashiMechanics).onEnemyKilled();
    if (msg) host.showFloatingText(enemy.position.x, enemy.position.y - 40, msg, 0xaa77ee);
  }

  if (leveledUp) {
    host.showLevelUp();
    // Auto-equip new skills on level up
    GameManager.shared.autoEquipSkills(gameData.skills);
    // Refresh skill button labels
    for (let i = 0; i < champ.equippedSkillIDs.length && i < 4; i++) {
      const skill = gameData.skill(champ.equippedSkillIDs[i]);
      if (skill) {
        const shortName = skill.name.length > 5 ? skill.name.substring(0, 5) : skill.name;
        host.actionButtons.setSkill(i, skill.id, shortName);
      }
    }
  }
}

// ─── Update Status Effects ──────────────────────────────────

export function updateStatusEffects(
  dt: number,
  playerStatusEffects: StatusEffectManager,
  worldContainer: Container,
  playerScreenPos: { x: number; y: number },
  statusParticleTimerRef: { value: number },
  statusBar: { update: (effects: any[]) => void } | null,
  showDamageNumber: (x: number, y: number, amount: number, isCrit: boolean, color?: number, style?: string) => void,
  showFloatingText: (x: number, y: number, msg: string, color: number) => void,
  handlePlayerDeath: () => void,
): void {
  const champ = GameManager.shared.champion;
  if (!champ) return;

  const result = playerStatusEffects.update(dt);

  // Passive Regeneration (base + talents)
  const talents = GameManager.shared.talentSystem;
  const baseInvRegen = 1.5;
  const baseHPRegen = 0.5;
  const talentInvRegen = talents?.getBonus('investitureRegenPerSecond') ?? 0;
  const talentHPRegen = talents?.getBonus('hpRegenPerSecond') ?? 0;
  const totalInvRegen = (baseInvRegen + talentInvRegen) * dt;
  const totalHPRegen = (baseHPRegen + talentHPRegen) * dt;

  if (champ.currentInvestiture < GameManager.shared.maxInvestiture) {
    champ.currentInvestiture = Math.min(GameManager.shared.maxInvestiture, champ.currentInvestiture + totalInvRegen);
  }
  if (champ.currentHP < GameManager.shared.maxHP && champ.currentHP > 0) {
    champ.currentHP = Math.min(GameManager.shared.maxHP, champ.currentHP + totalHPRegen);
  }

  // Apply periodic damage/heal from status effects
  if (result.damagePerTick > 0) {
    champ.currentHP -= result.damagePerTick;
    showDamageNumber(playerScreenPos.x, playerScreenPos.y - 30, Math.ceil(result.damagePerTick), false, 0x44cc44);
    if (champ.currentHP <= 0) { champ.currentHP = 0; handlePlayerDeath(); }
  }
  if (result.healPerTick > 0) {
    champ.currentHP = Math.min(GameManager.shared.maxHP, champ.currentHP + result.healPerTick);
    showDamageNumber(playerScreenPos.x, playerScreenPos.y - 30, Math.ceil(result.healPerTick), false, 0x44ff66);
  }

  // Show expired messages
  for (const type of result.expired) {
    showFloatingText(playerScreenPos.x, playerScreenPos.y - 40, `${type} dissipé`, 0x999999);
  }

  // Spawn visual particles for active effects
  statusParticleTimerRef.value += dt;
  if (statusParticleTimerRef.value > 0.3) {
    statusParticleTimerRef.value = 0;
    for (const effect of playerStatusEffects.effects) {
      if (Math.random() < 0.5) {
        spawnStatusParticle(worldContainer, playerScreenPos.x, playerScreenPos.y - 15, effect.type);
      }
    }
  }

  // Update HUD status bar
  if (statusBar) {
    statusBar.update(playerStatusEffects.effects);
  }
}

// ─── Combat Update ──────────────────────────────────────────

export function updateCombat(
  dt: number,
  attackCooldownRef: { value: number },
  comboDisplay: { update: () => void } | null,
  showFloatingText: (x: number, y: number, msg: string, color: number) => void,
  playerScreenPos: { x: number; y: number },
): void {
  attackCooldownRef.value = Math.max(0, attackCooldownRef.value - dt);
  const comboBroke = ComboManager.shared.update(dt);
  if (comboBroke && ComboManager.shared.highestCombo >= 5) {
    showFloatingText(
      playerScreenPos.x, playerScreenPos.y - 60,
      `Combo terminé: ${ComboManager.shared.highestCombo}×`, 0xff8844,
    );
  }
  if (comboDisplay) comboDisplay.update();
}
