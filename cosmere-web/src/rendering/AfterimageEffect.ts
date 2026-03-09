// ─── Afterimage / Motion Trail Effect ────────────────────────────
// Creates semi-transparent copies of an entity at previous positions,
// producing a ghosting/speed trail effect during dashes and attacks.

import { Container, Graphics } from 'pixi.js';

// ─── Afterimage State ──────────────────────────────────────────

interface AfterimageFrame {
  x: number;
  y: number;
  alpha: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  age: number;
}

export class AfterimageEffect {
  private frames: AfterimageFrame[] = [];
  private maxFrames: number;
  private fadeRate: number;
  private color: number;
  private trailGraphics: Graphics;
  private active = false;

  constructor(
    parent: Container,
    options?: {
      maxFrames?: number;
      fadeRate?: number;
      color?: number;
    },
  ) {
    this.maxFrames = options?.maxFrames ?? 4;
    this.fadeRate = options?.fadeRate ?? 3;
    this.color = options?.color ?? 0x4488ff;

    this.trailGraphics = new Graphics();
    this.trailGraphics.zIndex = -5; // Behind player
    parent.addChild(this.trailGraphics);
  }

  /** Start recording afterimages */
  start(color?: number): void {
    this.active = true;
    if (color !== undefined) this.color = color;
  }

  /** Stop recording (existing trails still fade out) */
  stop(): void {
    this.active = false;
  }

  /** Record current position as an afterimage frame */
  record(x: number, y: number, scaleX = 1, scaleY = 1, rotation = 0): void {
    if (!this.active) return;

    this.frames.push({
      x, y, alpha: 0.35, scaleX, scaleY, rotation, age: 0,
    });

    // Keep only recent frames
    while (this.frames.length > this.maxFrames) {
      this.frames.shift();
    }
  }

  /**
   * Update and draw afterimage trails.
   * Call each frame. Draws ghost silhouettes at recorded positions.
   */
  update(
    dt: number,
    entityWidth: number,
    entityHeight: number,
  ): void {
    const g = this.trailGraphics;
    g.clear();

    for (let i = this.frames.length - 1; i >= 0; i--) {
      const frame = this.frames[i];
      frame.age += dt;
      frame.alpha -= this.fadeRate * dt;

      if (frame.alpha <= 0) {
        this.frames.splice(i, 1);
        continue;
      }

      // Draw ghost silhouette
      const w = entityWidth * frame.scaleX * 0.7;
      const h = entityHeight * frame.scaleY;

      // Outer glow
      g.ellipse(frame.x, frame.y - h * 0.4, w * 0.6, h * 0.45)
        .fill({ color: this.color, alpha: frame.alpha * 0.15 });

      // Body silhouette
      g.ellipse(frame.x, frame.y - h * 0.4, w * 0.4, h * 0.4)
        .fill({ color: this.color, alpha: frame.alpha * 0.3 });

      // Bright core
      g.ellipse(frame.x, frame.y - h * 0.4, w * 0.2, h * 0.3)
        .fill({ color: 0xffffff, alpha: frame.alpha * 0.1 });
    }
  }

  /** Check if any trail frames are still visible */
  get isVisible(): boolean {
    return this.frames.length > 0;
  }

  destroy(): void {
    this.trailGraphics.destroy();
    this.frames.length = 0;
  }
}

// ─── Squash-Stretch Helper ─────────────────────────────────────

export interface SquashStretchState {
  scaleX: number;
  scaleY: number;
  active: boolean;
  elapsed: number;
  duration: number;
  intensity: number;
}

/** Create idle breathing animation state */
export function createBreathing(): SquashStretchState {
  return { scaleX: 1, scaleY: 1, active: true, elapsed: 0, duration: 3, intensity: 0.02 };
}

/** Update breathing animation — subtle torso scale oscillation */
export function updateBreathing(state: SquashStretchState, dt: number): void {
  if (!state.active) return;
  state.elapsed += dt;
  const t = state.elapsed / state.duration;
  const breathe = Math.sin(t * Math.PI * 2) * state.intensity;
  state.scaleX = 1 - breathe * 0.5;
  state.scaleY = 1 + breathe;
}

/** Trigger a landing squash (after jump/dash) */
export function triggerLandSquash(state: SquashStretchState): void {
  state.active = true;
  state.elapsed = 0;
  state.duration = 0.2;
  state.intensity = 0.08;
}

/** Update landing squash — quick squash then restore */
export function updateLandSquash(state: SquashStretchState, dt: number): boolean {
  if (!state.active) return false;
  state.elapsed += dt;
  const t = Math.min(1, state.elapsed / state.duration);

  if (t < 0.3) {
    // Squash phase
    const p = t / 0.3;
    state.scaleX = 1 + state.intensity * p;
    state.scaleY = 1 - state.intensity * 0.8 * p;
  } else {
    // Restore phase with overshoot
    const p = (t - 0.3) / 0.7;
    const ease = 1 - Math.pow(1 - p, 3);
    state.scaleX = 1 + state.intensity * (1 - ease);
    state.scaleY = 1 - state.intensity * 0.8 * (1 - ease);
  }

  if (t >= 1) {
    state.scaleX = 1;
    state.scaleY = 1;
    state.active = false;
    return true; // Done
  }
  return false;
}
