import { Container, Graphics } from 'pixi.js';
import type { ChampionClass } from '../data/types';
import type { PlayerBodyParts } from './PlayerRenderer';

// ─── Animation State Machine ────────────────────────────────────

export type AnimState = 'idle' | 'walk' | 'attack' | 'hurt' | 'cast' | 'death';

const CLASS_AURA_COLORS: Record<string, number> = {
  mistborn: 0x8899cc, radiant: 0x88ddff, awakener: 0xcc88ff,
  elantrian: 0xffcc44, sandMaster: 0xddcc88, nightmarePainter: 0x8866cc,
};

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

/** Animate individual body parts with the animator's limb offsets */
function applyLimbAnimation(parts: PlayerBodyParts, anim: CharacterAnimator): void {
  // Left arm - rotate at shoulder pivot
  parts.leftArm.rotation = anim.leftArmAngle;

  // Right arm - rotate at shoulder pivot
  parts.rightArm.rotation = anim.rightArmAngle;

  // Weapon follows right arm + weapon angle
  parts.weapon.rotation = anim.rightArmAngle + anim.weaponAngle;
  // Weapon Y tracks arm position
  parts.weapon.y = Math.sin(anim.rightArmAngle) * 2;

  // Left leg - slide up/down for walk cycle
  parts.leftLeg.y = anim.leftLegOffset;

  // Right leg - opposite phase
  parts.rightLeg.y = anim.rightLegOffset;

  // Cape sway - subtle rotation at top attachment
  parts.cape.rotation = anim.bodyTilt * 0.5;
  // Cape trails behind during walk (offset bottom)
  parts.cape.skew.x = -anim.leftLegOffset * 0.015;

  // Head bobs slightly counter to body
  parts.head.y = -anim.bodyBob * 0.3;
  // Head tilts slightly opposite to body tilt for natural feel
  parts.head.rotation = -anim.bodyTilt * 0.3;
}

// ─── Class Aura Effect ───────────────────────────────────────────

export function drawClassAura(
  worldContainer: Container,
  x: number, y: number,
  cls: ChampionClass,
  animator: CharacterAnimator,
  existing?: Graphics | null,
): Graphics | null {
  if (animator.auraAlpha <= 0.005) {
    if (existing) existing.visible = false;
    return existing ?? null;
  }

  const color = CLASS_AURA_COLORS[cls] ?? 0x8899cc;
  const g = existing ?? new Graphics();
  g.clear();
  g.visible = true;
  g.zIndex = -1;

  // Inner glow
  g.circle(0, -15, animator.auraRadius * 0.6)
    .fill({ color, alpha: animator.auraAlpha * 0.5 });
  // Outer glow
  g.circle(0, -15, animator.auraRadius)
    .fill({ color, alpha: animator.auraAlpha * 0.2 });

  // Class-specific particles
  const t = animator.timer;
  switch (cls) {
    case 'mistborn': {
      // Mist swirls
      for (let i = 0; i < 4; i++) {
        const angle = t * 1.5 + (i / 4) * Math.PI * 2;
        const r = 12 + Math.sin(t * 2 + i) * 4;
        g.circle(Math.cos(angle) * r, -15 + Math.sin(angle) * r * 0.5, 1.5)
          .fill({ color: 0xaabbcc, alpha: animator.auraAlpha * 2 });
      }
      break;
    }
    case 'radiant': {
      // Stormlight wisps rising
      for (let i = 0; i < 3; i++) {
        const phase = t * 3 + i * 2.1;
        const rise = (phase % 2) / 2;
        const px = Math.sin(i * 3.7) * 8;
        g.circle(px, -10 - rise * 20, 1)
          .fill({ color: 0xcceeFF, alpha: animator.auraAlpha * 3 * (1 - rise) });
      }
      break;
    }
    case 'awakener': {
      // Color shifting rings
      const colors = [0xff4466, 0x44aaff, 0x44ff88, 0xffcc44];
      for (let i = 0; i < colors.length; i++) {
        const r = 10 + i * 3 + Math.sin(t * 2 + i) * 2;
        g.circle(0, -15, r)
          .stroke({ color: colors[i], width: 0.5, alpha: animator.auraAlpha * 1.5 });
      }
      break;
    }
    case 'elantrian': {
      // Aon glow lines
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2 + t * 0.5;
        const r = 14;
        const x1 = Math.cos(angle) * r * 0.3;
        const y1 = -15 + Math.sin(angle) * r * 0.3;
        const x2 = Math.cos(angle) * r;
        const y2 = -15 + Math.sin(angle) * r * 0.5;
        g.moveTo(x1, y1).lineTo(x2, y2)
          .stroke({ color: 0xffdd66, width: 1, alpha: animator.auraAlpha * 2 });
      }
      break;
    }
    case 'sandMaster': {
      // Sand orbiting
      for (let i = 0; i < 6; i++) {
        const angle = t * 2 + (i / 6) * Math.PI * 2;
        const r = 14 + Math.sin(t + i) * 3;
        g.circle(Math.cos(angle) * r, -12 + Math.sin(angle) * r * 0.4, 1)
          .fill({ color: 0xddcc88, alpha: animator.auraAlpha * 2.5 });
      }
      break;
    }
    case 'nightmarePainter': {
      // Ink drips / shadow tendrils
      for (let i = 0; i < 3; i++) {
        const px = (i - 1) * 8;
        const phase = t * 1.5 + i * 1.3;
        const drip = (phase % 3) / 3;
        g.rect(px - 0.5, -20 + drip * 15, 1, 3 + drip * 4)
          .fill({ color: 0x332244, alpha: animator.auraAlpha * 2 * (1 - drip) });
      }
      break;
    }
  }

  g.x = x;
  g.y = y;
  return g;
}

// ─── Enemy Hit Animation ─────────────────────────────────────────

export function animateEnemyHit(enemySprite: Container): void {
  const inner = enemySprite.children[1] as Graphics | undefined;
  if (!inner) return;

  let elapsed = 0;
  let last = performance.now();
  const originalX = inner.x;
  const anim = () => {
    if (inner.destroyed) return;
    const now = performance.now();
    elapsed += (now - last) / 1000;
    last = now;
    inner.x = originalX + Math.sin(elapsed * 40) * (3 * (1 - elapsed / 0.2));
    if (elapsed < 0.2) requestAnimationFrame(anim);
    else inner.x = originalX;
  };
  requestAnimationFrame(anim);
}

// ─── Enemy Death Animation ───────────────────────────────────────

export function animateEnemyDeath(
  enemySprite: Container,
  worldContainer: Container,
  x: number, y: number,
): void {
  let elapsed = 0;
  let last = performance.now();
  const dur = 0.5;
  const startY = enemySprite.y;

  const anim = () => {
    if (enemySprite.destroyed) return;
    const now = performance.now();
    elapsed += (now - last) / 1000;
    last = now;
    const p = Math.min(1, elapsed / dur);

    enemySprite.alpha = 1 - p;
    enemySprite.scale.y = 1 - p * 0.5;
    enemySprite.scale.x = 1 + p * 0.3;
    enemySprite.y = startY + p * 5;
    enemySprite.rotation = p * 0.3;

    if (elapsed < dur) requestAnimationFrame(anim);
  };
  requestAnimationFrame(anim);

  // Ghost particles rising
  for (let i = 0; i < 5; i++) {
    const particle = new Graphics();
    particle.circle(0, 0, 1.5 + Math.random()).fill({ color: 0xaaaaff, alpha: 0.4 });
    particle.x = x + (Math.random() - 0.5) * 20;
    particle.y = y;
    particle.zIndex = 100001;
    worldContainer.addChild(particle);

    let pt = 0;
    let pLast = performance.now();
    const speed = 15 + Math.random() * 10;
    const drift = (Math.random() - 0.5) * 15;
    const pAnim = () => {
      if (particle.destroyed) return;
      const now = performance.now();
      const dt = (now - pLast) / 1000;
      pLast = now;
      pt += dt;
      particle.y -= speed * dt;
      particle.x += drift * dt;
      particle.alpha = Math.max(0, 0.4 - pt * 0.5);
      if (pt < 0.8) requestAnimationFrame(pAnim);
      else particle.destroy();
    };
    setTimeout(() => requestAnimationFrame(pAnim), i * 60);
  }
}

// ─── Level Up Aura Burst ─────────────────────────────────────────

export function animateLevelUpBurst(
  worldContainer: Container,
  x: number, y: number,
  cls: ChampionClass,
): void {
  const color = CLASS_AURA_COLORS[cls] ?? 0xffcc44;

  // Expanding ring
  const ring = new Graphics();
  ring.x = x;
  ring.y = y - 15;
  ring.zIndex = 100002;
  worldContainer.addChild(ring);

  // Rising particles
  for (let i = 0; i < 12; i++) {
    const p = new Graphics();
    const angle = (i / 12) * Math.PI * 2;
    p.circle(0, 0, 2).fill({ color, alpha: 0.6 });
    p.x = x;
    p.y = y - 15;
    p.zIndex = 100002;
    worldContainer.addChild(p);

    let pt = 0;
    let pLast = performance.now();
    const speed = 40 + Math.random() * 20;
    const pAnim = () => {
      if (p.destroyed) return;
      const now = performance.now();
      const dtSec = (now - pLast) / 1000;
      pLast = now;
      pt += dtSec;
      p.x = x + Math.cos(angle) * speed * pt;
      p.y = y - 15 + Math.sin(angle) * speed * pt * 0.5 - pt * 30;
      p.alpha = Math.max(0, 0.6 - pt * 0.6);
      p.scale.set(1 - pt * 0.5);
      if (pt < 1) requestAnimationFrame(pAnim);
      else p.destroy();
    };
    requestAnimationFrame(pAnim);
  }

  let elapsed = 0;
  let ringLast = performance.now();
  const ringAnim = () => {
    if (ring.destroyed) return;
    const now = performance.now();
    const dtSec = (now - ringLast) / 1000;
    ringLast = now;
    elapsed += dtSec;
    ring.clear();
    const r = elapsed * 60;
    ring.circle(0, 0, r)
      .stroke({ color, width: 3 * (1 - elapsed), alpha: 0.5 * (1 - elapsed) });
    ring.circle(0, 0, r * 0.7)
      .stroke({ color: 0xffffff, width: 1.5 * (1 - elapsed), alpha: 0.3 * (1 - elapsed) });
    if (elapsed < 1) requestAnimationFrame(ringAnim);
    else ring.destroy();
  };
  requestAnimationFrame(ringAnim);
}
