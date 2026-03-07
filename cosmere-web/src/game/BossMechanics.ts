// ─── Boss Mechanics (barrel re-export) ──────────────────────────
// Split into modular files for maintainability.

export type { BossPhase, BossConfig } from './BossConfig';
export { BOSS_CONFIGS, DEFAULT_BOSS } from './BossConfig';

export { BossState } from './BossState';

export { createBossHPBar, createBossSpecialEffect } from './BossEffects';
