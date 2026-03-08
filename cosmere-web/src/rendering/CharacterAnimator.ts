import { Container, Graphics } from 'pixi.js';
import type { ChampionClass } from '../data/types';
import type { PlayerBodyParts } from './PlayerRenderer';

// ─── Animation State Machine ────────────────────────────────────

export type AnimState = 'idle' | 'walk' | 'attack' | 'hurt' | 'cast' | 'death';

export class CharacterAnimator {
  state: AnimState = 'idle';
  timer = 0;
  private stateTimer = 0;
  private cls: ChampionClass;
  facing: 'left' | 'right' = 'right';

  // Limb offsets for animation
  leftArmAngle = 0;
  rightArmAngle = 0;
  leftLegOffset = 0;
  rightLegOffset = 0;
  bodyBob = 0;
  bodyTilt = 0;
  weaponAngle = 0;
  squash = 1;    // vertical scale
  stretch = 1;   // horizontal scale
  auraAlpha = 0;
  auraRadius = 0;

  // Overlay effects
  hurtFlash = 0;
  deathProgress = 0;

  constructor(cls: ChampionClass) {
    this.cls = cls;
  }

  setState(newState: AnimState): void {
    if (newState === this.state) return;
    this.state = newState;
    this.stateTimer = 0;
  }

  update(dt: number): void {
    this.timer += dt;
    this.stateTimer += dt;

    switch (this.state) {
      case 'idle': this.updateIdle(dt); break;
      case 'walk': this.updateWalk(dt); break;
      case 'attack': this.updateAttack(dt); break;
      case 'hurt': this.updateHurt(dt); break;
      case 'cast': this.updateCast(dt); break;
      case 'death': this.updateDeath(dt); break;
    }

    // Decay hurt flash
    if (this.hurtFlash > 0) this.hurtFlash = Math.max(0, this.hurtFlash - dt * 5);
  }

  // ─── Idle: gentle breathing + subtle sway ─────────────────────

  private updateIdle(_dt: number): void {
    const t = this.timer;
    this.bodyBob = Math.sin(t * 1.5) * 0.8;
    this.bodyTilt = Math.sin(t * 0.8) * 0.01;
    this.leftArmAngle = Math.sin(t * 1.2) * 0.04;
    this.rightArmAngle = Math.sin(t * 1.2 + 0.3) * 0.04;
    this.leftLegOffset = 0;
    this.rightLegOffset = 0;
    this.weaponAngle = Math.sin(t * 1) * 0.02;
    this.squash = 1 + Math.sin(t * 1.5) * 0.01;
    this.stretch = 1;

    // Subtle class aura pulse
    this.auraAlpha = 0.03 + Math.sin(t * 2) * 0.02;
    this.auraRadius = 18 + Math.sin(t * 1.5) * 2;
  }

  // ─── Walk: arm/leg swing + bounce ─────────────────────────────

  private updateWalk(_dt: number): void {
    const t = this.timer * 8; // Faster cycle for walking
    const swing = Math.sin(t);
    this.leftArmAngle = -swing * 0.3;
    this.rightArmAngle = swing * 0.3;
    this.leftLegOffset = swing * 2.5;
    this.rightLegOffset = -swing * 2.5;
    this.bodyBob = Math.abs(Math.sin(t)) * 2 - 1;
    this.bodyTilt = Math.sin(t) * 0.015;
    this.weaponAngle = swing * 0.08;
    this.squash = 1 + Math.abs(Math.sin(t)) * 0.015;
    this.stretch = 1 - Math.abs(Math.sin(t)) * 0.01;

    this.auraAlpha = 0.04;
    this.auraRadius = 16;
  }

  // ─── Attack: weapon swing arc ─────────────────────────────────

  private updateAttack(_dt: number): void {
    const t = this.stateTimer;
    const dur = 0.35;

    if (t < dur) {
      const progress = t / dur;
      // Wind up then swing
      if (progress < 0.3) {
        this.weaponAngle = -0.4 * (progress / 0.3);
        this.rightArmAngle = -0.3 * (progress / 0.3);
        this.bodyTilt = -0.02 * (progress / 0.3);
      } else {
        const swingProgress = (progress - 0.3) / 0.7;
        this.weaponAngle = -0.4 + 1.2 * swingProgress;
        this.rightArmAngle = -0.3 + 0.8 * swingProgress;
        this.bodyTilt = -0.02 + 0.06 * swingProgress;
      }
      // Lunge forward
      this.bodyBob = -2 * (1 - Math.abs(progress - 0.5) * 2);
      this.squash = 1 + 0.03 * Math.sin(progress * Math.PI);
      this.leftArmAngle = 0.15;
      this.auraAlpha = 0.08 * (1 - progress);
      this.auraRadius = 22 + progress * 10;
    } else {
      this.setState('idle');
    }
  }

  // ─── Hurt: recoil + flash ─────────────────────────────────────

  private updateHurt(_dt: number): void {
    const t = this.stateTimer;
    const dur = 0.3;

    if (t < dur) {
      const p = t / dur;
      this.bodyBob = Math.sin(p * Math.PI * 3) * 3;
      this.bodyTilt = Math.sin(p * Math.PI * 2) * 0.04;
      this.squash = 1 - 0.05 * Math.sin(p * Math.PI);
      this.stretch = 1 + 0.03 * Math.sin(p * Math.PI);
      this.hurtFlash = 1 - p;
      this.leftArmAngle = 0.2 * (1 - p);
      this.rightArmAngle = -0.2 * (1 - p);
    } else {
      this.setState('idle');
    }
  }

  // ─── Cast: gather energy + release ────────────────────────────

  private updateCast(_dt: number): void {
    const t = this.stateTimer;
    const dur = 0.5;

    if (t < dur) {
      const p = t / dur;
      // Arms raise up
      this.leftArmAngle = -0.5 * Math.min(1, p * 2);
      this.rightArmAngle = -0.5 * Math.min(1, p * 2);
      this.weaponAngle = -0.3 * Math.min(1, p * 2);
      // Body lifts
      this.bodyBob = -3 * Math.min(1, p * 2);
      // Aura expands
      this.auraAlpha = 0.15 * p;
      this.auraRadius = 20 + p * 20;
      // Release burst
      if (p > 0.7) {
        const release = (p - 0.7) / 0.3;
        this.auraAlpha = 0.15 * (1 - release);
        this.auraRadius = 40 + release * 15;
      }
      this.squash = 1 + 0.02 * Math.sin(p * Math.PI * 4);
    } else {
      this.setState('idle');
    }
  }

  // ─── Death: collapse ──────────────────────────────────────────

  private updateDeath(_dt: number): void {
    const t = this.stateTimer;
    const dur = 0.8;
    this.deathProgress = Math.min(1, t / dur);
    const p = this.deathProgress;

    this.bodyTilt = p * 0.5;
    this.bodyBob = p * 8;
    this.squash = 1 - p * 0.4;
    this.stretch = 1 + p * 0.3;
    this.leftArmAngle = p * 0.6;
    this.rightArmAngle = p * -0.4;
    this.auraAlpha = 0.1 * (1 - p);
  }
}

// ─── Apply Animator to Player Sprite ─────────────────────────────

export function applyAnimationToPlayer(
  playerContainer: Container,
  playerSprite: Graphics | Container,
  playerShadow: Graphics,
  animator: CharacterAnimator,
  bodyParts?: PlayerBodyParts | null,
): void {
  // Body bob and squash/stretch
  playerSprite.y = -animator.bodyBob;
  playerSprite.rotation = animator.bodyTilt;
  playerSprite.scale.y = animator.squash;

  // Facing
  const faceSign = animator.facing === 'left' ? -1 : 1;
  playerSprite.scale.x = faceSign * animator.stretch;

  // Shadow responds to body position
  playerShadow.scale.x = 1 + animator.bodyBob * 0.01;
  playerShadow.scale.y = 1 - animator.bodyBob * 0.02;
  playerShadow.alpha = 0.3 - animator.bodyBob * 0.01;

  // Death fade
  if (animator.state === 'death') {
    playerContainer.alpha = 1 - animator.deathProgress * 0.7;
  } else {
    playerContainer.alpha = 1;
  }

  // Multi-part limb animation
  if (bodyParts) {
    applyLimbAnimation(bodyParts, animator);
  }
}

// Base positions for body parts (must match pivot values in PlayerRenderer)
const BASE_POS = {
  leftLeg: { x: -3, y: -10 },
  rightLeg: { x: 3, y: -10 },
  weapon: { x: 11, y: -12 },
  head: { x: 0, y: -30 },
};

/** Animate individual body parts with the animator's limb offsets */
function applyLimbAnimation(parts: PlayerBodyParts, anim: CharacterAnimator): void {
  // Left arm - rotate at shoulder pivot
  parts.leftArm.rotation = anim.leftArmAngle;

  // Right arm - rotate at shoulder pivot
  parts.rightArm.rotation = anim.rightArmAngle;

  // Weapon follows right arm + weapon angle
  parts.weapon.rotation = anim.rightArmAngle + anim.weaponAngle;
  // Weapon Y tracks arm position (offset from base position)
  parts.weapon.y = BASE_POS.weapon.y + Math.sin(anim.rightArmAngle) * 2;

  // Left leg - slide up/down for walk cycle (offset from base position)
  parts.leftLeg.y = BASE_POS.leftLeg.y + anim.leftLegOffset;

  // Right leg - opposite phase (offset from base position)
  parts.rightLeg.y = BASE_POS.rightLeg.y + anim.rightLegOffset;

  // Cape sway - subtle rotation at top attachment
  parts.cape.rotation = anim.bodyTilt * 0.5;
  // Cape trails behind during walk (offset bottom)
  parts.cape.skew.x = -anim.leftLegOffset * 0.015;

  // Head bobs slightly counter to body (offset from base position)
  parts.head.y = BASE_POS.head.y + (-anim.bodyBob * 0.3);
  // Head tilts slightly opposite to body tilt for natural feel
  parts.head.rotation = -anim.bodyTilt * 0.3;
}
