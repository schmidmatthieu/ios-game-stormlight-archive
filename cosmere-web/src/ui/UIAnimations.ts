// ─── UI Animation Utilities ─────────────────────────────────────
// Centralized easing functions, animation helpers, and UI effects.
// Used by HUD, menus, and panels for consistent, polished motion.

import { Container, Graphics } from 'pixi.js';

// ─── Easing Functions ──────────────────────────────────────────

/** Smooth deceleration — most common UI easing */
export function easeOutCubic(t: number): number {
  const t1 = t - 1;
  return t1 * t1 * t1 + 1;
}

/** Overshoot then settle — bouncy button press */
export function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  const t1 = t - 1;
  return 1 + c3 * t1 * t1 * t1 + c1 * t1 * t1;
}

/** Elastic spring — dramatic level-up / achievement */
export function easeOutElastic(t: number): number {
  if (t === 0 || t === 1) return t;
  const c4 = (2 * Math.PI) / 3;
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}

/** Smooth acceleration + deceleration */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Linear (no easing) */
export function linear(t: number): number {
  return t;
}

// ─── Animation State ───────────────────────────────────────────

export interface UIAnimation {
  elapsed: number;
  duration: number;
  from: number;
  to: number;
  easing: (t: number) => number;
  /** Current interpolated value */
  value: number;
  done: boolean;
}

/** Create a new animation state */
export function createAnimation(
  from: number,
  to: number,
  duration: number,
  easing: (t: number) => number = easeOutCubic,
): UIAnimation {
  return {
    elapsed: 0,
    duration,
    from, to,
    easing,
    value: from,
    done: false,
  };
}

/** Update an animation, returns current value */
export function updateAnimation(anim: UIAnimation, dt: number): number {
  if (anim.done) return anim.to;
  anim.elapsed += dt;
  const t = Math.min(1, anim.elapsed / anim.duration);
  anim.value = anim.from + (anim.to - anim.from) * anim.easing(t);
  if (t >= 1) anim.done = true;
  return anim.value;
}

// ─── Bar Drain Effect ──────────────────────────────────────────

export interface BarDrainState {
  /** Current display value (fast bar) */
  current: number;
  /** Trailing "ghost" value (slow drain bar) */
  trail: number;
  /** Target actual value */
  target: number;
  /** Time since last target change */
  delayTimer: number;
}

/** Create drain state for a health/resource bar */
export function createBarDrain(initialValue: number): BarDrainState {
  return {
    current: initialValue,
    trail: initialValue,
    target: initialValue,
    delayTimer: 0,
  };
}

/**
 * Update bar drain effect.
 * - `current` snaps quickly to target
 * - `trail` follows with a delay (shows "damage taken")
 */
export function updateBarDrain(
  state: BarDrainState,
  target: number,
  dt: number,
  fastLerp: number = 0.12,
  slowLerp: number = 0.03,
  delay: number = 0.4,
): void {
  // Detect target change
  if (Math.abs(target - state.target) > 0.001) {
    state.target = target;
    state.delayTimer = 0;
  }

  // Fast bar catches up quickly
  state.current += (state.target - state.current) * fastLerp;
  if (Math.abs(state.current - state.target) < 0.002) {
    state.current = state.target;
  }

  // Trailing bar has delay then follows slowly
  state.delayTimer += dt;
  if (state.delayTimer > delay) {
    state.trail += (state.target - state.trail) * slowLerp;
    if (Math.abs(state.trail - state.target) < 0.002) {
      state.trail = state.target;
    }
  }
}

// ─── Sparkle Effect ────────────────────────────────────────────

export interface Sparkle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: number;
}

/** Spawn sparkles along a bar fill edge */
export function spawnBarSparkles(
  x: number, y: number,
  barWidth: number, barHeight: number,
  fillPct: number,
  color: number,
  count: number = 3,
): Sparkle[] {
  const sparkles: Sparkle[] = [];
  const fillX = x + barWidth * fillPct;

  for (let i = 0; i < count; i++) {
    sparkles.push({
      x: fillX + (Math.random() - 0.5) * 4,
      y: y + Math.random() * barHeight,
      vx: (Math.random() - 0.5) * 20,
      vy: -(Math.random() * 25 + 10),
      life: 0.3 + Math.random() * 0.3,
      maxLife: 0.6,
      size: 1 + Math.random() * 1.5,
      color,
    });
  }
  return sparkles;
}

/** Update and draw sparkles */
export function updateSparkles(
  sparkles: Sparkle[],
  g: Graphics,
  dt: number,
): void {
  for (let i = sparkles.length - 1; i >= 0; i--) {
    const s = sparkles[i];
    s.life -= dt;
    if (s.life <= 0) { sparkles.splice(i, 1); continue; }

    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.vy += 40 * dt; // Gravity

    const alpha = (s.life / s.maxLife) * 0.8;
    const size = s.size * (s.life / s.maxLife);

    // Glow
    g.circle(s.x, s.y, size * 2).fill({ color: s.color, alpha: alpha * 0.15 });
    // Core
    g.circle(s.x, s.y, size).fill({ color: 0xffffff, alpha });
  }
}

// ─── Pulse Glow Effect ─────────────────────────────────────────

/**
 * Calculate a pulsing glow alpha value.
 * Returns alpha between minAlpha and maxAlpha.
 */
export function pulseGlow(
  time: number,
  period: number = 2,
  minAlpha: number = 0.1,
  maxAlpha: number = 0.4,
): number {
  const t = (Math.sin(time * Math.PI * 2 / period) + 1) * 0.5;
  return minAlpha + t * (maxAlpha - minAlpha);
}

// ─── Scale Pop Animation ───────────────────────────────────────

export interface ScalePop {
  target: Container;
  elapsed: number;
  duration: number;
  fromScale: number;
  toScale: number;
  easing: (t: number) => number;
}

/** Create a scale pop (e.g., button press feedback) */
export function createScalePop(
  target: Container,
  fromScale: number = 1.15,
  toScale: number = 1.0,
  duration: number = 0.25,
): ScalePop {
  target.scale.set(fromScale);
  return { target, elapsed: 0, duration, fromScale, toScale, easing: easeOutBack };
}

/** Update scale pop animation, returns true when done */
export function updateScalePop(pop: ScalePop, dt: number): boolean {
  pop.elapsed += dt;
  const t = Math.min(1, pop.elapsed / pop.duration);
  const s = pop.fromScale + (pop.toScale - pop.fromScale) * pop.easing(t);
  pop.target.scale.set(s);
  return t >= 1;
}

// ─── Screen Flash ──────────────────────────────────────────────

export interface ScreenFlash {
  elapsed: number;
  duration: number;
  color: number;
  maxAlpha: number;
}

/** Create a full-screen flash (e.g., on level up) */
export function createScreenFlash(
  color: number = 0xffffff,
  maxAlpha: number = 0.3,
  duration: number = 0.4,
): ScreenFlash {
  return { elapsed: 0, duration, color, maxAlpha };
}

/** Update and draw screen flash, returns true when done */
export function updateScreenFlash(
  flash: ScreenFlash,
  g: Graphics,
  dt: number,
  screenW: number,
  screenH: number,
): boolean {
  flash.elapsed += dt;
  const t = flash.elapsed / flash.duration;
  if (t >= 1) return true;

  const alpha = flash.maxAlpha * (1 - t) * (1 - t);
  g.rect(0, 0, screenW, screenH).fill({ color: flash.color, alpha });
  return false;
}
