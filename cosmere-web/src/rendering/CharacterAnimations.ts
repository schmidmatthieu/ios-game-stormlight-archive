// Barrel re-export for backward compatibility.
// The implementation has been split into smaller modules:
//   - CharacterAnimator.ts  (CharacterAnimator class, AnimState, applyAnimationToPlayer)
//   - ClassAuraEffects.ts   (drawClassAura, CLASS_AURA_COLORS)
//   - AnimationEffects.ts   (animateEnemyHit, animateEnemyDeath, animateLevelUpBurst)

export { CharacterAnimator, applyAnimationToPlayer } from './CharacterAnimator';
export type { AnimState } from './CharacterAnimator';
export { drawClassAura, CLASS_AURA_COLORS } from './ClassAuraEffects';
export { animateEnemyHit, animateEnemyDeath, animateLevelUpBurst } from './AnimationEffects';
