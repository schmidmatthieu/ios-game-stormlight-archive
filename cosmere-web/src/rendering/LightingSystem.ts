// ─── Dynamic Lighting System ─────────────────────────────────────
// Multiplicative lighting: renders lights onto a dark RenderTexture,
// then composites it over the scene with multiply blend mode.
// Supports point lights, player light, spell flashes, and ambient.

import { Application, Container, Graphics, RenderTexture, Sprite, BlurFilter } from 'pixi.js';
import { ObjectPool } from '../systems/ObjectPool';

// ─── Light Definition ───────────────────────────────────────────

export interface PointLight {
  x: number;
  y: number;
  radius: number;
  color: number;
  intensity: number;
  flicker?: number;     // 0-1, amount of random flicker
  flickerSpeed?: number; // flicker animation speed
  /** Internal — managed by system */
  _phase?: number;
}

// ─── Lighting Manager ───────────────────────────────────────────

export class LightingManager {
  private app: Application;
  private lightTexture: RenderTexture;
  private lightSprite: Sprite;
  private lightGraphics: Graphics;
  private lights: PointLight[] = [];
  private ambientColor: number = 0x333344;
  private ambientIntensity: number = 0.3;
  private screenW: number;
  private screenH: number;
  private timer = 0;

  constructor(app: Application, uiContainer: Container, screenW: number, screenH: number) {
    this.app = app;
    this.screenW = screenW;
    this.screenH = screenH;

    // Create the render texture for the light map
    this.lightTexture = RenderTexture.create({
      width: Math.ceil(screenW / 2),  // Half-res for performance
      height: Math.ceil(screenH / 2),
      antialias: false,
    });

    // The sprite that displays the lightmap over the scene
    this.lightSprite = new Sprite(this.lightTexture);
    this.lightSprite.width = screenW;
    this.lightSprite.height = screenH;
    this.lightSprite.blendMode = 'multiply';
    this.lightSprite.zIndex = 99500; // Above world, below HUD
    uiContainer.addChild(this.lightSprite);

    // Graphics used to draw lights into the texture
    this.lightGraphics = new Graphics();
  }

  /** Set ambient light (base illumination level) */
  setAmbient(color: number, intensity: number): void {
    this.ambientColor = color;
    this.ambientIntensity = Math.max(0, Math.min(1, intensity));
  }

  /** Add a persistent light source (returns index for removal) */
  addLight(light: PointLight): number {
    light._phase = Math.random() * Math.PI * 2;
    this.lights.push(light);
    return this.lights.length - 1;
  }

  /** Remove a light by index */
  removeLight(index: number): void {
    if (index >= 0 && index < this.lights.length) {
      this.lights.splice(index, 1);
    }
  }

  /** Clear all dynamic lights */
  clearLights(): void {
    this.lights.length = 0;
  }

  /** Update and render the lightmap */
  update(dt: number, cameraX: number, cameraY: number): void {
    this.timer += dt;
    const g = this.lightGraphics;
    const halfW = this.lightTexture.width;
    const halfH = this.lightTexture.height;
    const scaleX = halfW / this.screenW;
    const scaleY = halfH / this.screenH;

    g.clear();

    // Fill with ambient color (darker = less ambient light)
    const ar = ((this.ambientColor >> 16) & 0xff) / 255;
    const ag = ((this.ambientColor >> 8) & 0xff) / 255;
    const ab = (this.ambientColor & 0xff) / 255;
    const ai = this.ambientIntensity;
    const ambR = Math.floor(ar * ai * 255);
    const ambG = Math.floor(ag * ai * 255);
    const ambB = Math.floor(ab * ai * 255);
    const ambientHex = (ambR << 16) | (ambG << 8) | ambB;

    g.rect(0, 0, halfW, halfH).fill({ color: ambientHex, alpha: 1 });

    // Draw each light as a radial gradient (additive circles)
    for (const light of this.lights) {
      // Calculate flicker
      let intensity = light.intensity;
      if (light.flicker && light.flicker > 0) {
        const phase = light._phase ?? 0;
        const flickerSpeed = light.flickerSpeed ?? 3;
        const flicker = Math.sin(this.timer * flickerSpeed + phase) * 0.3
          + Math.sin(this.timer * flickerSpeed * 1.7 + phase * 2.3) * 0.2;
        intensity *= 1 + flicker * light.flicker;
      }
      intensity = Math.max(0, Math.min(1, intensity));

      // Screen position
      const sx = (light.x + cameraX) * scaleX;
      const sy = (light.y + cameraY) * scaleY;
      const sr = light.radius * scaleX;

      // Draw concentric circles for gradient effect
      const lr = (light.color >> 16) & 0xff;
      const lg = (light.color >> 8) & 0xff;
      const lb = light.color & 0xff;

      const steps = 6;
      for (let i = steps; i >= 0; i--) {
        const t = i / steps;
        const r = sr * t;
        const fade = (1 - t * t) * intensity; // Quadratic falloff
        const cr = Math.min(255, Math.floor(lr * fade));
        const cg = Math.min(255, Math.floor(lg * fade));
        const cb = Math.min(255, Math.floor(lb * fade));
        const col = (cr << 16) | (cg << 8) | cb;
        g.circle(sx, sy, Math.max(1, r)).fill({ color: col, alpha: fade * 0.7 });
      }
    }

    // Render to texture
    this.app.renderer.render({
      container: g,
      target: this.lightTexture,
      clear: true,
    });
  }

  /** Resize the lighting system */
  resize(screenW: number, screenH: number): void {
    this.screenW = screenW;
    this.screenH = screenH;
    this.lightTexture.resize(Math.ceil(screenW / 2), Math.ceil(screenH / 2));
    this.lightSprite.width = screenW;
    this.lightSprite.height = screenH;
  }

  destroy(): void {
    this.lightSprite.destroy();
    this.lightTexture.destroy();
    this.lightGraphics.destroy();
    this.lights.length = 0;
  }
}
