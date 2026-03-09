// ─── Shadow Caster ──────────────────────────────────────────────
// Advanced directional shadow system that responds to the day/night
// cycle sun position. Renders long shadows at dawn/dusk and short
// shadows at midday. Integrates with EntityShadows for the actual
// shadow geometry, and adds cast shadow projection.

import { Graphics, Container } from 'pixi.js';
import { simplex2D } from './ProceduralTextures';

// ─── Sun State ──────────────────────────────────────────────────

export interface SunState {
  /** Sun angle in radians (0 = east, PI/2 = north/zenith) */
  angle: number;
  /** Sun elevation (0 = horizon, 1 = directly overhead) */
  elevation: number;
  /** Light color based on time of day */
  color: number;
  /** Light intensity 0-1 */
  intensity: number;
}

// ─── Shadow Caster Manager ─────────────────────────────────────

export class ShadowCasterManager {
  private container: Container;
  private shadowGraphics: Graphics;
  private sunState: SunState;
  private time = 0;

  constructor(parentContainer: Container) {
    this.container = new Container();
    this.container.zIndex = -60; // Below entity shadows
    parentContainer.addChild(this.container);

    this.shadowGraphics = new Graphics();
    this.container.addChild(this.shadowGraphics);

    this.sunState = {
      angle: 0.8,
      elevation: 0.7,
      color: 0xffeedd,
      intensity: 0.8,
    };
  }

  /** Update sun position from day/night cycle */
  setSunState(dayProgress: number): void {
    // dayProgress: 0 = midnight, 0.25 = dawn, 0.5 = noon, 0.75 = dusk
    const sunAngle = dayProgress * Math.PI * 2 - Math.PI / 2;
    const elevation = Math.sin(dayProgress * Math.PI); // 0 at horizon, 1 at noon

    // Sun color shifts: warm at dawn/dusk, white at noon
    let color: number;
    if (dayProgress < 0.3 || dayProgress > 0.7) {
      color = 0xffaa55; // Warm orange near horizon
    } else if (dayProgress < 0.4 || dayProgress > 0.6) {
      color = 0xffdda0; // Warm yellow
    } else {
      color = 0xfff8ee; // Near-white at noon
    }

    // Intensity drops at night
    const intensity = elevation > 0 ? Math.min(1, elevation * 1.5) : 0;

    this.sunState = { angle: sunAngle, elevation, color, intensity };
  }

  /**
   * Draw directional shadows for a set of entities.
   * Call once per frame with all entity positions.
   */
  renderShadows(
    entities: Array<{
      x: number;
      y: number;
      width: number;
      height: number;
      type: 'player' | 'enemy' | 'npc' | 'object';
    }>,
    cameraX: number,
    cameraY: number,
    screenW: number,
    screenH: number,
  ): void {
    this.time += 1 / 60;
    const g = this.shadowGraphics;
    g.clear();

    if (this.sunState.intensity < 0.05) return; // No shadows at night

    const { angle, elevation, intensity } = this.sunState;

    // Shadow length inversely proportional to elevation
    const shadowLength = Math.max(0.2, (1 - elevation) * 2.5);
    const shadowAlpha = intensity * 0.25;

    // Shadow direction from sun angle
    const dirX = Math.cos(angle) * shadowLength;
    const dirY = Math.sin(angle) * shadowLength * 0.5; // Isometric compression

    for (const entity of entities) {
      // Screen-space position
      const sx = entity.x + cameraX;
      const sy = entity.y + cameraY;

      // Cull offscreen
      if (sx < -100 || sx > screenW + 100 || sy < -100 || sy > screenH + 100) continue;

      // Shadow size based on entity type
      const scaleW = entity.type === 'player' ? 1.2 : entity.type === 'enemy' ? 1.0 : 0.8;
      const scaleH = entity.type === 'player' ? 0.35 : 0.3;

      const sw = entity.width * scaleW;
      const sh = entity.height * scaleH;

      // Shadow offset (cast away from sun)
      const offsetX = dirX * entity.height * 0.4;
      const offsetY = dirY * entity.height * 0.4 + entity.height * 0.15;

      // Subtle noise to break up uniform shadows
      const noiseOffset = simplex2D(entity.x * 0.01, entity.y * 0.01) * 0.5;

      // Draw layered soft shadow
      const layers = 3;
      for (let i = layers; i >= 0; i--) {
        const t = i / layers;
        const expand = 1 + t * 0.5;
        const layerAlpha = shadowAlpha * (1 - t * 0.5) * (1 + noiseOffset * 0.2);

        g.ellipse(
          sx + offsetX * (1 + t * 0.2),
          sy + offsetY * (1 + t * 0.1),
          sw * expand * shadowLength * 0.5,
          sh * expand,
        ).fill({ color: 0x000000, alpha: layerAlpha });
      }
    }
  }

  /** Get current sun state for external systems (lighting, etc.) */
  getSunState(): Readonly<SunState> {
    return this.sunState;
  }

  /** Get shadow direction for external use */
  getShadowDirection(): { dx: number; dy: number } {
    const { angle, elevation } = this.sunState;
    const shadowLength = Math.max(0.2, (1 - elevation) * 2.5);
    return {
      dx: Math.cos(angle) * shadowLength,
      dy: Math.sin(angle) * shadowLength * 0.5,
    };
  }

  resize(): void {
    // Nothing to resize — shadows are in world space
  }

  destroy(): void {
    this.shadowGraphics.destroy();
    this.container.destroy();
  }
}
