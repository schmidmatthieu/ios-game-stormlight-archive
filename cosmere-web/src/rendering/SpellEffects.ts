/**
 * Barrel re-export for spell effect modules.
 *
 * All exports remain importable from this file for backward compatibility.
 * Implementation is split across:
 *   - SpellParticles.ts  — particle types, color configs, ambient particles
 *   - AttackEffects.ts   — attack slash and hit impact VFX
 *   - SkillVFX.ts        — skill AOE, burst patterns, ground marks
 */
export type { SpellParticle } from './SpellParticles';
export { SKILL_COLORS, ATTACK_COLORS, spawnClassAmbientParticle, releaseSpellParticle } from './SpellParticles';
export { createAttackEffect, createHitImpact } from './AttackEffects';
export { createSkillEffect, createSkillGroundMark } from './SkillVFX';
