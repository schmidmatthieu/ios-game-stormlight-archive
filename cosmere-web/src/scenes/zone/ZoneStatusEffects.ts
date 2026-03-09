// ─── Zone Status Effects ────────────────────────────────────────
// Extracted from ZoneScene.ts — status effect updates, regen, visual particles.

import type { Container } from 'pixi.js';
import { GameManager } from '../../game/GameManager';
import type { StatusEffectManager, ActiveStatusEffect } from '../../game/StatusEffects';
import { spawnStatusParticle } from '../../game/StatusEffects';
import type { DamageStyle } from '../../rendering/FloatingDamage';

export interface StatusEffectHost {
  worldContainer: Container;
  playerScreenPos: { x: number; y: number };
  playerStatusEffects: StatusEffectManager;
  statusParticleTimer: number;
  statusBar: { update: (effects: ActiveStatusEffect[]) => void } | null;
  showDamageNumber: (x: number, y: number, amt: number, crit: boolean, color?: number, style?: DamageStyle) => void;
  showFloatingText: (x: number, y: number, msg: string, color: number) => void;
  handlePlayerDeath: () => void;
}

/** Returns updated statusParticleTimer */
export function updateStatusEffects(dt: number, host: StatusEffectHost): number {
  const champ = GameManager.shared.champion;
  if (!champ) return host.statusParticleTimer;

  const result = host.playerStatusEffects.update(dt);

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

  // Periodic damage/heal from status effects
  if (result.damagePerTick > 0) {
    champ.currentHP -= result.damagePerTick;
    host.showDamageNumber(host.playerScreenPos.x, host.playerScreenPos.y - 30, Math.ceil(result.damagePerTick), false, 0x44cc44);
    if (champ.currentHP <= 0) { champ.currentHP = 0; host.handlePlayerDeath(); }
  }
  if (result.healPerTick > 0) {
    champ.currentHP = Math.min(GameManager.shared.maxHP, champ.currentHP + result.healPerTick);
    host.showDamageNumber(host.playerScreenPos.x, host.playerScreenPos.y - 30, Math.ceil(result.healPerTick), false, 0x44ff66);
  }

  // Expired messages
  for (const type of result.expired) {
    host.showFloatingText(host.playerScreenPos.x, host.playerScreenPos.y - 40, `${type} dissipé`, 0x999999);
  }

  // Status visual particles
  let timer = host.statusParticleTimer + dt;
  if (timer > 0.3) {
    timer = 0;
    for (const effect of host.playerStatusEffects.effects) {
      if (Math.random() < 0.5) {
        spawnStatusParticle(host.worldContainer, host.playerScreenPos.x, host.playerScreenPos.y - 15, effect.type);
      }
    }
  }

  // Update HUD status bar
  if (host.statusBar) {
    host.statusBar.update(host.playerStatusEffects.effects);
  }

  return timer;
}
