// ─── Zone Actions — attack, skills, ultimate, potions ─────────────
// Extracted from ZoneScene for modularity.

import { Container, Graphics } from 'pixi.js';
import { GameManager } from '../../game/GameManager';
import { gameData } from '../../data/DataLoader';
import { MusicManager } from '../../game/MusicSystem';
import { ComboManager } from '../../game/ComboSystem';
import { NewGamePlusManager } from '../../systems/NewGamePlus';
import { PotionManager } from '../../game/PotionSystem';
import { KomashiMechanics } from '../../game/WorldMechanics';
import { animateEnemyHit } from '../../rendering/CharacterAnimations';
import { triggerEnemyHurt } from '../../rendering/EnemyAnimations';
import { createAttackEffect, createSkillEffect, createSkillGroundMark, createHitImpact } from '../../rendering/SpellEffects';
import { createDirectionalSlash, createCritFlash, triggerHitStop } from '../../rendering/CombatFeedback';
import { getAffixDamageMultiplier, getThornsDamage, getVampiricHeal } from '../../game/EliteAffixes';
import { getCompanionDamageBonus, getCompanionDefenseBonus } from './ZoneCompanion';
import type { EnemyInstance } from './ZoneTypes';
import type { DamageStyle } from '../../rendering/FloatingDamage';
import type { StatusEffectManager } from '../../game/StatusEffects';
import type { WorldEffect } from '../../game/WorldMechanics';
import type { CharacterAnimator } from '../../rendering/CharacterAnimations';

// ─── Host Interface ─────────────────────────────────────────────

export interface ActionHost {
  worldContainer: Container;
  uiContainer: Container;
  screenWidth: number;
  screenHeight: number;
  playerScreenPos: { x: number; y: number };
  playerFacing: 'left' | 'right';
  enemies: EnemyInstance[];
  playerStatusEffects: StatusEffectManager;
  playerAnimator: CharacterAnimator;
  worldMechanics: WorldEffect | null;
  particles: any[];
  attackCooldown: number;
  actionButtons: { startCooldown: (i: number, cd: number) => void };
  potionHotbar: { refresh: () => void } | null;
  showDamageNumber: (x: number, y: number, amt: number, crit: boolean, col?: number, style?: DamageStyle, combo?: number) => void;
  showFloatingText: (x: number, y: number, msg: string, color: number) => void;
  drawEnemyHP: (bar: any, pct: number) => void;
  shakeCamera: (intensity: number, duration: number) => void;
  killEnemy: (enemy: EnemyInstance) => void;
  handlePlayerDeath: () => void;
}

// ─── Handle Attack ──────────────────────────────────────────────

export function handleAttack(host: ActionHost): number {
  const champ = GameManager.shared.champion;
  if (!champ) return host.attackCooldown;
  if (host.attackCooldown > 0) return host.attackCooldown;

  host.attackCooldown = 0.4;
  host.playerAnimator.setState('attack');
  MusicManager.shared.playSFX('attack');

  // Attack visual
  createAttackEffect(
    host.worldContainer,
    host.playerScreenPos.x, host.playerScreenPos.y,
    host.playerFacing, champ.championClass,
  );

  const range = 60;
  let closest: EnemyInstance | null = null;
  let closestDist = Infinity;

  for (const enemy of host.enemies) {
    if (enemy.isDead) continue;
    const dist = Math.hypot(enemy.position.x - host.playerScreenPos.x, enemy.position.y - host.playerScreenPos.y);
    if (dist < range && dist < closestDist) {
      closest = enemy;
      closestDist = dist;
    }
  }

  if (!closest) return host.attackCooldown;

  // Shield check
  if (closest.affixState?.shieldActive) {
    MusicManager.shared.playSFX('block');
    host.showDamageNumber(closest.position.x, closest.position.y - 30, 0, false, 0x4488ff, 'block');
    return host.attackCooldown;
  }

  const baseDmg = Math.max(1, champ.baseStats.strength + Math.floor(Math.random() * 5));
  const statusDmgMult = host.playerStatusEffects.getDamageMultiplier();
  const comboResult = ComboManager.shared.registerHit();
  const damage = Math.floor(baseDmg * statusDmgMult * comboResult.multiplier * getCompanionDamageBonus());
  const isCrit = Math.random() < champ.baseStats.luck * 0.01;
  const totalDmg = isCrit ? damage * 2 : damage;

  closest.hp -= totalDmg;
  const dmgStyle: DamageStyle = isCrit ? 'crit' : comboResult.combo >= 5 ? 'combo' : 'normal';
  MusicManager.shared.playSFX(isCrit ? 'crit' : comboResult.combo >= 5 ? 'combo' : 'hit');
  host.showDamageNumber(closest.position.x, closest.position.y - 30, totalDmg, isCrit, undefined, dmgStyle, comboResult.combo);
  host.drawEnemyHP(closest.hpBar, closest.hp / closest.maxHP);

  // Thorns affix
  if (closest.affixState) {
    const thornsDmg = getThornsDamage(closest.affixState, totalDmg);
    if (thornsDmg > 0) {
      champ.currentHP = Math.max(0, champ.currentHP - thornsDmg);
      host.showDamageNumber(host.playerScreenPos.x, host.playerScreenPos.y - 40, thornsDmg, false, 0x88aa44, 'poison');
    }
    const vampHeal = getVampiricHeal(closest.affixState, totalDmg);
    if (vampHeal > 0) {
      closest.hp = Math.min(closest.maxHP, closest.hp + vampHeal);
      host.showDamageNumber(closest.position.x, closest.position.y - 20, vampHeal, false, 0xcc2244, 'heal');
    }
  }

  // Hit effects
  animateEnemyHit(closest.sprite);
  if (closest.enemyAnim) triggerEnemyHurt(closest.enemyAnim);
  createHitImpact(host.worldContainer, closest.position.x, closest.position.y, champ.championClass, isCrit, host.particles as any);

  const hitAngle = Math.atan2(closest.position.y - host.playerScreenPos.y, closest.position.x - host.playerScreenPos.x);
  createDirectionalSlash(host.worldContainer, closest.position.x, closest.position.y, hitAngle, isCrit, isCrit ? 0xffdd44 : 0xcccccc);

  if (isCrit) {
    createCritFlash(host.uiContainer, host.screenWidth, host.screenHeight);
    triggerHitStop(0.05);
    host.shakeCamera(4, 0.2);
  }

  const innerSprite = closest.sprite.children[1] as Graphics;
  if (innerSprite) {
    innerSprite.tint = 0xff4444;
    const ref = closest;
    setTimeout(() => { if (!ref.isDead && innerSprite) innerSprite.tint = 0xffffff; }, 120);
  }

  if (closest.hp <= 0) host.killEnemy(closest);
  return host.attackCooldown;
}

// ─── Handle Skill ───────────────────────────────────────────────

export function handleSkill(index: number, host: ActionHost): void {
  const champ = GameManager.shared.champion;
  if (!champ || index >= champ.equippedSkillIDs.length) return;

  const skillID = champ.equippedSkillIDs[index];
  const skill = gameData.skill(skillID);
  if (!skill) return;

  if (champ.currentInvestiture < skill.investitureCost) return;
  champ.currentInvestiture -= skill.investitureCost;
  host.actionButtons.startCooldown(index, skill.cooldown);

  host.playerAnimator.setState('cast');

  const classSfxMap: Record<string, string> = {
    mistborn: 'magic_allomancy', radiant: 'magic_surgebinding',
    awakener: 'magic_awakening', elantrian: 'magic_aondor',
    sandMaster: 'magic_sand', nightmarePainter: 'magic_paint',
  };
  MusicManager.shared.playSFX(classSfxMap[champ.championClass] ?? 'magic_surgebinding');

  const range = skill.range * 32;
  createSkillEffect(host.worldContainer, host.playerScreenPos.x, host.playerScreenPos.y, range, champ.championClass, host.particles);
  createSkillGroundMark(host.worldContainer, host.playerScreenPos.x, host.playerScreenPos.y, range, champ.championClass);

  for (const enemy of host.enemies) {
    if (enemy.isDead) continue;
    const dist = Math.hypot(enemy.position.x - host.playerScreenPos.x, enemy.position.y - host.playerScreenPos.y);
    if (dist < range) {
      const talents = GameManager.shared.talentSystem;
      const magicBonus = 1 + (talents?.getBonus('magicDamagePercent') ?? 0);
      const baseDmg = skill.baseDamage + Math.floor(champ.baseStats.spirit * 0.5);
      const damage = Math.floor(baseDmg * magicBonus);
      const isCrit = Math.random() < (champ.baseStats.luck * 0.01 + (talents?.getBonus('critChancePercent') ?? 0));
      const critMult = 2 * (1 + (talents?.getBonus('critDamagePercent') ?? 0));
      const finalDmg = isCrit ? Math.floor(damage * critMult) : damage;
      enemy.hp -= finalDmg;
      host.showDamageNumber(enemy.position.x, enemy.position.y - 30, finalDmg, isCrit);
      if (isCrit) {
        createCritFlash(host.uiContainer, host.screenWidth, host.screenHeight);
        triggerHitStop(0.05);
      }
      createHitImpact(host.worldContainer, enemy.position.x, enemy.position.y, champ.championClass, isCrit, host.particles as any);
      animateEnemyHit(enemy.sprite);
      if (enemy.enemyAnim) triggerEnemyHurt(enemy.enemyAnim);

      // Skill-specific effects
      if (skill.id === 'steel_push' && dist > 0) {
        const pushDX = (enemy.position.x - host.playerScreenPos.x) / dist;
        const pushDY = (enemy.position.y - host.playerScreenPos.y) / dist;
        enemy.position.x += pushDX * 60;
        enemy.position.y += pushDY * 60;
        enemy.sprite.x = enemy.position.x;
        enemy.sprite.y = enemy.position.y;
      } else if (skill.id === 'iron_pull' && dist > 30) {
        const pullDX = (host.playerScreenPos.x - enemy.position.x) / dist;
        const pullDY = (host.playerScreenPos.y - enemy.position.y) / dist;
        const pullDist = Math.min(dist - 30, 80);
        enemy.position.x += pullDX * pullDist;
        enemy.position.y += pullDY * pullDist;
        enemy.sprite.x = enemy.position.x;
        enemy.sprite.y = enemy.position.y;
      }

      if (skill.statusEffects) {
        for (const se of skill.statusEffects) {
          if (Math.random() < (se.chance ?? 1)) {
            host.showFloatingText(enemy.position.x, enemy.position.y - 40, `${se.effectType}!`, 0xffaa44);
          }
        }
      }

      host.drawEnemyHP(enemy.hpBar, enemy.hp / enemy.maxHP);
      if (enemy.hp <= 0) host.killEnemy(enemy);
    }
  }
}

// ─── Handle Ultimate ────────────────────────────────────────────

export function handleUltimate(host: ActionHost): void {
  const champ = GameManager.shared.champion;
  if (!champ) return;

  const cost = Math.floor(GameManager.shared.maxInvestiture * 0.5);
  if (champ.currentInvestiture < cost) {
    host.showFloatingText(host.playerScreenPos.x, host.playerScreenPos.y - 60, 'Investiture insuffisante!', 0xff4444);
    return;
  }
  champ.currentInvestiture -= cost;

  host.playerAnimator.setState('cast');
  MusicManager.shared.playSFX('magic_surgebinding');

  const baseDmg = 80 + champ.level * 10 + champ.baseStats.spirit * 2;
  const talents = GameManager.shared.talentSystem;
  const magicBonus = 1 + (talents?.getBonus('magicDamagePercent') ?? 0);
  const ultimateDmg = Math.floor(baseDmg * magicBonus);
  const range = 200;

  createSkillEffect(host.worldContainer, host.playerScreenPos.x, host.playerScreenPos.y, range, champ.championClass, host.particles);
  createSkillGroundMark(host.worldContainer, host.playerScreenPos.x, host.playerScreenPos.y, range, champ.championClass);
  createCritFlash(host.uiContainer, host.screenWidth, host.screenHeight);
  host.shakeCamera(8, 0.4);

  let killCount = 0;
  for (const enemy of host.enemies) {
    if (enemy.isDead) continue;
    const dist = Math.hypot(enemy.position.x - host.playerScreenPos.x, enemy.position.y - host.playerScreenPos.y);
    if (dist < range) {
      enemy.hp -= ultimateDmg;
      host.showDamageNumber(enemy.position.x, enemy.position.y - 30, ultimateDmg, true, 0xffdd44);
      animateEnemyHit(enemy.sprite);
      if (enemy.enemyAnim) triggerEnemyHurt(enemy.enemyAnim);
      host.drawEnemyHP(enemy.hpBar, enemy.hp / enemy.maxHP);
      if (enemy.hp <= 0) { host.killEnemy(enemy); killCount++; }
    }
  }

  if (killCount > 0) {
    host.showFloatingText(host.playerScreenPos.x, host.playerScreenPos.y - 80, `ULTIME! ${killCount} éliminé(s)!`, 0xffcc33);
  }
}

// ─── Use Potion ─────────────────────────────────────────────────

export function usePotion(slotIndex: number, host: ActionHost): void {
  const champ = GameManager.shared.champion;
  if (!champ) return;

  const effect = PotionManager.shared.usePotion(slotIndex);
  if (!effect) {
    MusicManager.shared.playSFX('error');
    host.showFloatingText(host.playerScreenPos.x, host.playerScreenPos.y - 50, 'Pas de potion!', 0xff6644);
    return;
  }

  MusicManager.shared.playSFX('potion');

  if (effect.healPercent) {
    const heal = Math.floor(GameManager.shared.maxHP * effect.healPercent);
    champ.currentHP = Math.min(GameManager.shared.maxHP, champ.currentHP + heal);
    host.showDamageNumber(host.playerScreenPos.x, host.playerScreenPos.y - 30, heal, false, 0x44ff66);
  }
  if (effect.investiturePercent) {
    const restore = Math.floor(GameManager.shared.maxInvestiture * effect.investiturePercent);
    champ.currentInvestiture = Math.min(GameManager.shared.maxInvestiture, champ.currentInvestiture + restore);
    host.showDamageNumber(host.playerScreenPos.x, host.playerScreenPos.y - 40, restore, false, 0x8866ff);
  }
  if (effect.statusType && effect.statusDuration) {
    host.playerStatusEffects.apply(effect.statusType as any, effect.statusDuration, effect.statusMagnitude ?? 1);
  }

  if (host.potionHotbar) host.potionHotbar.refresh();
}

// ─── Enemy Attacks Player ───────────────────────────────────────

export function enemyAttacksPlayer(enemy: EnemyInstance, behaviorDmgMult: number, host: ActionHost): void {
  const champ = GameManager.shared.champion;
  if (!champ) return;

  const defense = champ.baseStats.vigor / 2;
  const nightmareMult = host.worldMechanics instanceof KomashiMechanics
    ? (host.worldMechanics as KomashiMechanics).getDamageMultiplier() : 1;
  const bossMult = enemy.bossState
    ? enemy.bossState.getCurrentPhase(enemy.hp / enemy.maxHP).damageMultiplier : 1;
  const affixDmgMult = enemy.affixState
    ? getAffixDamageMultiplier(enemy.affixState, enemy.hp / enemy.maxHP) : 1;
  const ngpDmgMult = NewGamePlusManager.shared.getDifficulty().enemyDamageMult;
  const shieldReduction = 1 - host.playerStatusEffects.getDamageReduction();
  const damage = Math.max(1, Math.floor((enemy.data.damage - defense) * nightmareMult * bossMult * affixDmgMult * behaviorDmgMult * ngpDmgMult * shieldReduction));
  champ.currentHP -= damage;

  host.showDamageNumber(host.playerScreenPos.x, host.playerScreenPos.y - 40, damage, false, 0xff4444);
  host.playerAnimator.setState('hurt');
  MusicManager.shared.playSFX('player_hurt');
  host.shakeCamera(2, 0.1);

  if (champ.currentHP <= 0) {
    champ.currentHP = 0;
    host.handlePlayerDeath();
  }
}
