// ─── Boss State & Phase Management ──────────────────────────────

import { BOSS_CONFIGS, DEFAULT_BOSS } from './BossConfig';
import type { BossConfig, BossPhase } from './BossConfig';

export class BossState {
  config: BossConfig;
  currentPhase = 0;
  specialAttackTimer = 0;
  announced = false;
  defeated = false;

  constructor(enemyID: string) {
    this.config = BOSS_CONFIGS[enemyID] ?? DEFAULT_BOSS;
  }

  getCurrentPhase(hpPercent: number): BossPhase {
    let phase = this.config.phases[0];
    for (let i = this.config.phases.length - 1; i >= 0; i--) {
      if (hpPercent <= this.config.phases[i].hpThreshold) {
        phase = this.config.phases[i];
        break;
      }
    }
    return phase;
  }

  update(dt: number, hpPercent: number): { phaseChanged: boolean; message: string | null; canSpecialAttack: boolean } {
    const newPhaseIndex = this.getPhaseIndex(hpPercent);
    let phaseChanged = false;
    let message: string | null = null;

    if (newPhaseIndex !== this.currentPhase) {
      this.currentPhase = newPhaseIndex;
      phaseChanged = true;
      message = this.config.phases[newPhaseIndex].message;
      this.specialAttackTimer = 0;
    }

    this.specialAttackTimer += dt;
    const phase = this.config.phases[this.currentPhase];
    const canSpecialAttack = this.specialAttackTimer >= phase.specialAttackCooldown;

    if (canSpecialAttack) {
      this.specialAttackTimer = 0;
    }

    return { phaseChanged, message, canSpecialAttack };
  }

  private getPhaseIndex(hpPercent: number): number {
    for (let i = this.config.phases.length - 1; i >= 0; i--) {
      if (hpPercent <= this.config.phases[i].hpThreshold) {
        return i;
      }
    }
    return 0;
  }
}
