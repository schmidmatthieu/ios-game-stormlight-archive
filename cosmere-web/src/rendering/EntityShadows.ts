// ─── Entity Shadows ──────────────────────────────────────────────
// Soft elliptical shadows projected beneath entities.
// Shadow direction and opacity respond to the day/night cycle.

import { Graphics, Container } from 'pixi.js';
import { ObjectPool } from '../systems/ObjectPool';

// ─── Shadow Config ──────────────────────────────────────────────

interface ShadowInstance {
  graphic: Graphics;
  entityRef: string; // unique entity ID for tracking
}

export class EntityShadowManager {
  private container: Container;
  private pool: ObjectPool<Graphics>;
  private shadows: Map<string, Graphics> = new Map();

  // Day/night state
  private sunAngle = 0.3;    // Radians — direction of sunlight
  private shadowAlpha = 0.25; // Base opacity
  private shadowScale = 1.0;  // Size multiplier

  constructor(parentContainer: Container) {
    this.container = new Container();
    this.container.zIndex = -50; // Below entities
    parentContainer.addChild(this.container);

    this.pool = new ObjectPool<Graphics>(
      () => new Graphics(),
      (g) => { g.clear(); g.alpha = 1; g.scale.set(1); g.visible = true; },
      30,
    );
  }

  /** Update shadow appearance based on time of day */
  setDaylight(lightLevel: number, sunAngle?: number): void {
    // Less light = fainter shadows (no shadow at night)
    this.shadowAlpha = lightLevel * 0.3;
    // Midday = short shadow, dawn/dusk = long shadow
    this.shadowScale = 0.6 + (1 - lightLevel) * 0.8;
    if (sunAngle !== undefined) {
      this.sunAngle = sunAngle;
    }
  }

  /** Create or update a shadow for an entity */
  updateShadow(
    entityID: string,
    x: number, y: number,
    width: number, height: number,
    entityScale = 1,
  ): void {
    let shadow = this.shadows.get(entityID);
    if (!shadow) {
      shadow = this.pool.acquire();
      this.shadows.set(entityID, shadow);
      this.container.addChild(shadow);
    }

    shadow.clear();

    // Shadow dimensions
    const sw = width * 0.8 * entityScale;
    const sh = height * 0.25 * entityScale * this.shadowScale;
    const offsetX = Math.cos(this.sunAngle) * height * 0.15 * this.shadowScale;
    const offsetY = Math.sin(this.sunAngle) * height * 0.08 * this.shadowScale + 2;

    // Draw soft shadow (layered ellipses for blur effect)
    const layers = 3;
    for (let i = layers; i >= 0; i--) {
      const t = i / layers;
      const expand = 1 + t * 0.4;
      const alpha = this.shadowAlpha * (1 - t * 0.6);
      shadow.ellipse(0, 0, sw * expand, sh * expand)
        .fill({ color: 0x000000, alpha });
    }

    shadow.x = x + offsetX;
    shadow.y = y + offsetY;
  }

  /** Remove a shadow for an entity */
  removeShadow(entityID: string): void {
    const shadow = this.shadows.get(entityID);
    if (shadow) {
      this.container.removeChild(shadow);
      this.pool.release(shadow);
      this.shadows.delete(entityID);
    }
  }

  /** Remove all shadows */
  clear(): void {
    for (const [id, shadow] of this.shadows) {
      this.container.removeChild(shadow);
      this.pool.release(shadow);
    }
    this.shadows.clear();
  }

  destroy(): void {
    this.clear();
    this.container.destroy();
  }
}
