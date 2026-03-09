// ─── Zone Environment ───────────────────────────────────────────
// Extracted from ZoneScene.ts — day/night, weather, world mechanics,
// world events, achievements, NPC schedules, ambient particles.

import { Container, Graphics } from 'pixi.js';
import { GameManager } from '../../game/GameManager';
import { AchievementManager } from '../../game/AchievementSystem';
import { DayNightManager } from '../../rendering/DayNightCycle';
import type { BlendedTimeConfig, TimeOfDay } from '../../rendering/DayNightCycle';
import { WeatherManager } from '../../rendering/WeatherSystem';
import { AmbientAtmosphereManager } from '../../rendering/AmbientAtmosphere';
import type { WorldEffect } from '../../game/WorldMechanics';
import { WorldEventManager } from '../../game/WorldEvents';
import type { WorldEventEffect } from '../../game/WorldEvents';
import { NPCScheduleManager } from '../../game/NPCScheduleSystem';
import { ObjectPool } from '../../systems/ObjectPool';
import { spawnClassAmbientParticle } from '../../rendering/SpellEffects';
import { moveNPCTo, updateNPCAnimation, showActivityIndicator, setNPCSleeping, teleportNPC } from '../../rendering/NPCAnimator';
import type { NPCInstance, Particle, WorldTheme } from './ZoneTypes';

// ─── Fog ───────────────────────────────────────────────────────

export function updateFog(
  fogOverlay: Graphics,
  uiContainer: Container,
  w: number, h: number,
  theme: WorldTheme,
): void {
  fogOverlay.clear();
  fogOverlay.rect(0, 0, w, h * 0.15).fill({ color: theme.fogColor, alpha: theme.fogAlpha });
  fogOverlay.rect(0, h * 0.85, w, h * 0.15).fill({ color: theme.fogColor, alpha: theme.fogAlpha * 0.7 });
  fogOverlay.zIndex = 999;
  if (!fogOverlay.parent) {
    uiContainer.addChild(fogOverlay);
  }
}

// ─── Day/Night ─────────────────────────────────────────────────

export function updateDayNight(
  dt: number,
  dayNightManager: DayNightManager,
  dayNightOverlay: { update: (config: BlendedTimeConfig) => void } | null,
  npcs: NPCInstance[],
  showFloatingText: (x: number, y: number, msg: string, color: number) => void,
  playerPos: { x: number; y: number },
  updateSchedulesFn: () => void,
): void {
  const result = dayNightManager.update(dt);
  if (dayNightOverlay) {
    dayNightOverlay.update(result.blendedConfig);
  }
  if (result.changed && result.message) {
    showFloatingText(playerPos.x, playerPos.y - 50, result.message, 0xddddaa);
    updateSchedulesFn();
  }
  for (const npc of npcs) {
    updateNPCAnimation(npc, dt);
  }
}

// ─── NPC Schedules ─────────────────────────────────────────────

export function initNPCSchedules(
  npcs: NPCInstance[],
  currentTime: TimeOfDay,
): void {
  const schedMgr = NPCScheduleManager.shared;
  schedMgr.initialize(currentTime);

  for (const npc of npcs) {
    const entry = schedMgr.getScheduleEntry(npc.id, currentTime);
    if (entry) {
      teleportNPC(npc, entry.position);
      showActivityIndicator(npc, entry.activity);
      setNPCSleeping(npc, entry.activity === 'sleeping');
    }
  }
}

export function updateNPCSchedules(
  npcs: NPCInstance[],
  currentTime: TimeOfDay,
): void {
  const schedMgr = NPCScheduleManager.shared;
  const movers = schedMgr.onTimeChange(currentTime);

  for (const move of movers) {
    const npc = npcs.find(n => n.id === move.npcID);
    if (!npc) continue;
    moveNPCTo(npc, move.newPosition);
    showActivityIndicator(npc, move.activity);
    setNPCSleeping(npc, move.activity === 'sleeping');
  }
}

// ─── Weather ───────────────────────────────────────────────────

let weatherTime = 0;

export function updateWeather(
  dt: number,
  weatherManager: WeatherManager,
  weatherOverlay: { update: (config: any, lightning: number, weatherType: any, time: number) => void } | null,
  ambientAtmosphere: AmbientAtmosphereManager | null,
  worldContainer: Container,
  showFloatingText: (x: number, y: number, msg: string, color: number) => void,
  shakeCamera: (intensity: number, duration: number) => void,
  handlePlayerDeath: () => void,
  playerPos: { x: number; y: number },
): void {
  if (ambientAtmosphere) {
    ambientAtmosphere.update(dt, worldContainer.x, worldContainer.y);
  }

  const result = weatherManager.update(dt);
  if (result.changed && result.message) {
    showFloatingText(playerPos.x, playerPos.y - 60, result.message, 0xaaddff);
  }
  if (result.changed && weatherManager.currentWeather !== 'highstorm' && result.config.name !== 'Haute Tempête') {
    const champ = GameManager.shared.champion;
    if (champ && champ.currentHP > 0) {
      AchievementManager.shared.recordHighstormSurvived();
      AchievementManager.shared.check();
    }
  }
  weatherTime += dt;
  if (weatherOverlay) {
    weatherOverlay.update(result.config, weatherManager.lightningFlash, weatherManager.currentWeather, weatherTime);
  }
  if (result.config.screenShake > 0) {
    shakeCamera(result.config.screenShake * 0.5, 0.05);
  }
  if (result.config.damagePerTick > 0) {
    const champ = GameManager.shared.champion;
    if (champ) {
      champ.currentHP -= result.config.damagePerTick * dt;
      if (champ.currentHP <= 0) { champ.currentHP = 0; handlePlayerDeath(); }
    }
  }
}

// ─── World Mechanics ───────────────────────────────────────────

export function updateWorldMechanics(
  dt: number,
  worldMechanics: WorldEffect,
  showFloatingText: (x: number, y: number, msg: string, color: number) => void,
  playerPos: { x: number; y: number },
): void {
  const msg = worldMechanics.tick(dt);
  if (msg) {
    showFloatingText(playerPos.x, playerPos.y - 50, msg, 0xaaddff);
  }
}

// ─── World Events ──────────────────────────────────────────────

export function updateWorldEvents(
  dt: number,
  worldID: string,
  eventBanner: { update: (dt: number) => void } | null,
  showFloatingText: (x: number, y: number, msg: string, color: number) => void,
  playerPos: { x: number; y: number },
): WorldEventEffect | null {
  const result = WorldEventManager.shared.update(dt, worldID);

  if (eventBanner) eventBanner.update(dt);

  if (result.effect) {
    const champ = GameManager.shared.champion;
    if (champ) {
      if (result.effect.healPerTick) {
        champ.currentHP = Math.min(GameManager.shared.maxHP, champ.currentHP + result.effect.healPerTick * dt);
      }
      if (result.effect.investiturePerTick) {
        champ.currentInvestiture = Math.min(GameManager.shared.maxInvestiture, champ.currentInvestiture + result.effect.investiturePerTick * dt);
      }
    }
  }

  if (result.ended) {
    showFloatingText(playerPos.x, playerPos.y - 50, 'Événement terminé', 0xaaaaaa);
  }

  return result.effect;
}

// ─── Achievements ──────────────────────────────────────────────

export function updateAchievements(
  dt: number,
  achievementToast: { update: (dt: number) => void } | null,
): void {
  AchievementManager.shared.updateCombo(dt);
  if (achievementToast) achievementToast.update(dt);
}

// ─── Event Bonuses ─────────────────────────────────────────────

export function getEventXPBonus(activeEventEffect: WorldEventEffect | null): number {
  return activeEventEffect?.xpBonus ? 1 + activeEventEffect.xpBonus / 100 : 1;
}

export function getEventGoldBonus(activeEventEffect: WorldEventEffect | null): number {
  return activeEventEffect?.goldBonus ? 1 + activeEventEffect.goldBonus / 100 : 1;
}

// ─── Ambient Particles ─────────────────────────────────────────

export function spawnAmbientParticles(
  dt: number,
  w: number, h: number,
  weatherEffect: string | null | undefined,
  theme: WorldTheme,
  worldContainer: Container,
  particleContainer: Container,
  particlePool: ObjectPool<Graphics>,
  particles: Particle[],
  playerScreenPos: { x: number; y: number },
  classAmbientTimer: { value: number },
): void {
  let rate = 0.3;
  if (weatherEffect === 'ashfall') rate = 1.5;
  else if (weatherEffect === 'mist') rate = 2;
  else if (weatherEffect === 'highstorm') rate = 3;
  else if (weatherEffect === 'rain') rate = 2.5;

  if (Math.random() < rate * dt) {
    const particle = particlePool.acquire();
    let px = 0, py = 0, vx = 0, vy = 0, size = 2, life = 3;
    const color = theme.ambientParticleColor;

    if (weatherEffect === 'ashfall') {
      px = (Math.random() - 0.5) * w * 2;
      py = -h / 2 + (Math.random() - 0.5) * 100;
      vx = -8 + Math.random() * 4;
      vy = 15 + Math.random() * 10;
      size = 1 + Math.random() * 2;
      life = 4 + Math.random() * 2;
      particle.circle(0, 0, size).fill({ color: 0x888077, alpha: 0.4 });
    } else if (weatherEffect === 'mist') {
      px = (Math.random() - 0.5) * w * 2;
      py = (Math.random() - 0.5) * h * 2;
      vx = -3 + Math.random() * 6;
      vy = -1 + Math.random() * 2;
      size = 8 + Math.random() * 15;
      life = 5 + Math.random() * 5;
      particle.circle(0, 0, size).fill({ color: 0xaaaaaa, alpha: 0.06 });
    } else if (weatherEffect === 'highstorm') {
      px = w / 2 + Math.random() * 100;
      py = (Math.random() - 0.5) * h * 2;
      vx = -80 - Math.random() * 40;
      vy = 10 + Math.random() * 10;
      size = 1 + Math.random();
      life = 1.5 + Math.random();
      particle.rect(-size * 2, -0.5, size * 4, 1).fill({ color: 0x8899aa, alpha: 0.5 });
    } else {
      px = (Math.random() - 0.5) * w * 2;
      py = (Math.random() - 0.5) * h * 2;
      vx = (Math.random() - 0.5) * 4;
      vy = -3 + Math.random() * 2;
      size = 1 + Math.random();
      life = 3 + Math.random() * 3;
      particle.circle(0, 0, size).fill({ color, alpha: 0.2 });
    }

    particle.x = px - worldContainer.x + w / 2;
    particle.y = py - worldContainer.y + h / 2;
    particleContainer.addChild(particle);

    particles.push({
      sprite: particle, x: particle.x, y: particle.y,
      vx, vy, life, maxLife: life, size,
    });
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.sprite.x = p.x;
    p.sprite.y = p.y;
    p.sprite.alpha = Math.min(1, p.life / p.maxLife) * 0.6;

    if (p.life <= 0) {
      particlePool.release(p.sprite);
      particles.splice(i, 1);
    }
  }

  classAmbientTimer.value += dt;
  if (classAmbientTimer.value >= 0.4) {
    classAmbientTimer.value = 0;
    const cls = GameManager.shared.champion?.championClass;
    if (cls) {
      const ox = (Math.random() - 0.5) * 30;
      const oy = (Math.random() - 0.5) * 20;
      spawnClassAmbientParticle(
        worldContainer,
        playerScreenPos.x + ox, playerScreenPos.y + oy,
        cls, particles as any,
      );
    }
  }
}
