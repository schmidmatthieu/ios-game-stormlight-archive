// ─── Outline Renderer ────────────────────────────────────────────
// Renders crisp 1px outlines around entity sprites using the
// "render offset copies" technique. Dramatically improves entity
// readability against any background.

import { Application, Container, Graphics, RenderTexture, Sprite } from 'pixi.js';

// ─── Outline Cache Entry ────────────────────────────────────────

interface OutlineCacheEntry {
  texture: RenderTexture;
  sprite: Sprite;
  dirty: boolean;
}

// ─── Outline Renderer ──────────────────────────────────────────

export class OutlineRenderer {
  private app: Application;
  private cache: Map<string, OutlineCacheEntry> = new Map();
  private tempContainer: Container;

  constructor(app: Application) {
    this.app = app;
    this.tempContainer = new Container();
  }

  /**
   * Create an outlined sprite from a source container.
   * The outline is drawn by rendering the source 4 times (offset 1px
   * in each cardinal direction) in a solid color, then the original
   * on top. Returns a Sprite backed by a cached RenderTexture.
   */
  createOutlinedSprite(
    source: Container,
    key: string,
    outlineColor: number = 0x000000,
    outlineAlpha: number = 0.7,
    padding: number = 4,
  ): Sprite {
    const bounds = source.getLocalBounds();
    const w = Math.ceil(bounds.width + padding * 2);
    const h = Math.ceil(bounds.height + padding * 2);

    if (w <= 0 || h <= 0) return new Sprite();

    // Check cache
    let entry = this.cache.get(key);
    if (entry && !entry.dirty) {
      return entry.sprite;
    }

    // Create or reuse texture
    const texture = entry?.texture ?? RenderTexture.create({
      width: w,
      height: h,
      antialias: false,
    });

    if (entry?.texture && (texture.width !== w || texture.height !== h)) {
      texture.resize(w, h);
    }

    // Center source in temp container
    const offsetX = -bounds.x + padding;
    const offsetY = -bounds.y + padding;
    source.x = offsetX;
    source.y = offsetY;

    // Draw outline — render source at 4 offsets with tint
    const outlineG = new Graphics();
    const offsets = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    // Build temporary container
    this.tempContainer.removeChildren();

    // First pass: outline copies
    for (const [dx, dy] of offsets) {
      const outlineCopy = this.cloneAsGraphics(source, outlineColor, outlineAlpha);
      outlineCopy.x = offsetX + dx;
      outlineCopy.y = offsetY + dy;
      this.tempContainer.addChild(outlineCopy);
    }

    // Second pass: original on top
    this.tempContainer.addChild(source);

    // Render to texture
    this.app.renderer.render({
      container: this.tempContainer,
      target: texture,
      clear: true,
    });

    // Create sprite
    const sprite = entry?.sprite ?? new Sprite(texture);
    sprite.texture = texture;
    sprite.anchor.set(
      (offsetX) / w,
      (offsetY) / h,
    );

    // Update cache
    this.cache.set(key, { texture, sprite, dirty: false });

    // Cleanup temp
    this.tempContainer.removeChildren();
    source.x = 0;
    source.y = 0;

    return sprite;
  }

  /**
   * Simple outline: renders 4 colored rectangles behind a Graphics.
   * Faster than RenderTexture approach. Good for per-frame drawing.
   */
  static drawOutline(
    target: Graphics,
    sourceDrawFn: (g: Graphics) => void,
    outlineColor: number = 0x000000,
    outlineAlpha: number = 0.6,
  ): void {
    // Draw source at 4 offsets with solid tint
    const offsets = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dx, dy] of offsets) {
      target.setTransform(dx, dy);
      // We draw a simplified silhouette — for Graphics entities
      // this means drawing a solid-color version
      sourceDrawFn(target);
    }
    target.setTransform(0, 0);
  }

  /** Invalidate cache for an entity (e.g., on equipment change) */
  invalidate(key: string): void {
    const entry = this.cache.get(key);
    if (entry) entry.dirty = true;
  }

  /** Clear all cached textures */
  clearCache(): void {
    for (const entry of this.cache.values()) {
      entry.texture.destroy();
      entry.sprite.destroy();
    }
    this.cache.clear();
  }

  destroy(): void {
    this.clearCache();
    this.tempContainer.destroy();
  }

  // ─── Private Helpers ──────────────────────────────────────────

  private cloneAsGraphics(
    source: Container,
    color: number,
    alpha: number,
  ): Graphics {
    // Create a solid-color silhouette of the source bounds
    const bounds = source.getLocalBounds();
    const g = new Graphics();
    // For outline purposes, draw the bounding shape as a solid fill
    // This produces a clean 1px outline around the entity
    g.roundRect(
      bounds.x - 0.5,
      bounds.y - 0.5,
      bounds.width + 1,
      bounds.height + 1,
      2,
    ).fill({ color, alpha });
    return g;
  }
}

// ─── Standalone Outline Helper ──────────────────────────────────

/**
 * Draw a simple outline around an entity by rendering dark ellipse
 * behind its position. Ultra-lightweight approach for per-frame use.
 */
export function drawEntityOutline(
  g: Graphics,
  x: number, y: number,
  width: number, height: number,
  color: number = 0x000000,
  alpha: number = 0.5,
): void {
  // 4 offset copies for crisp outline
  const offsets = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (const [dx, dy] of offsets) {
    g.ellipse(x + dx, y + dy, width * 0.5, height * 0.25)
      .fill({ color, alpha: alpha * 0.3 });
  }
}

/**
 * Draw a highlight ring around an entity (for selection, hover, etc.)
 */
export function drawHighlightRing(
  g: Graphics,
  x: number, y: number,
  radius: number,
  color: number,
  alpha: number = 0.3,
  pulseTime?: number,
): void {
  const pulse = pulseTime !== undefined
    ? 1 + Math.sin(pulseTime * 3) * 0.15
    : 1;
  const r = radius * pulse;

  // Outer glow
  g.circle(x, y, r * 1.3).fill({ color, alpha: alpha * 0.1 });
  // Ring
  g.circle(x, y, r).stroke({ color, width: 1.5, alpha });
  // Inner subtle fill
  g.circle(x, y, r * 0.8).fill({ color, alpha: alpha * 0.05 });
}
