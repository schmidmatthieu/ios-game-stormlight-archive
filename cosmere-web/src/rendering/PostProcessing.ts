// ─── Post-Processing Pipeline ────────────────────────────────────
// Bloom, vignette, color grading applied to the scene container.
// Uses native PixiJS v8 filters for performance.

import { Container, Graphics, BlurFilter, ColorMatrixFilter } from 'pixi.js';

// ─── World Color Grading Presets ────────────────────────────────

interface ColorGrade {
  brightness: number;   // -1 to 1
  contrast: number;     // 0 to 2
  saturation: number;   // 0 to 2
  tint: number;         // hex color to shift towards
  tintStrength: number; // 0-1
}

const WORLD_COLOR_GRADES: Record<string, ColorGrade> = {
  scadrial:  { brightness: -0.03, contrast: 1.1, saturation: 0.85, tint: 0x998877, tintStrength: 0.08 },
  roshar:    { brightness: 0.0,   contrast: 1.05, saturation: 1.1, tint: 0x6688bb, tintStrength: 0.06 },
  taldain:   { brightness: 0.05,  contrast: 1.15, saturation: 1.05, tint: 0xddcc88, tintStrength: 0.08 },
  nalthis:   { brightness: 0.02,  contrast: 1.0, saturation: 1.3, tint: 0x88cc88, tintStrength: 0.04 },
  komashi:   { brightness: -0.05, contrast: 1.15, saturation: 0.9, tint: 0x553366, tintStrength: 0.1 },
  sel:       { brightness: 0.02,  contrast: 1.05, saturation: 1.1, tint: 0xddbb66, tintStrength: 0.06 },
  shadesmar: { brightness: -0.06, contrast: 1.2, saturation: 0.8, tint: 0x4433aa, tintStrength: 0.12 },
};

// ─── Post-Processing Manager ────────────────────────────────────

export class PostProcessingManager {
  private worldContainer: Container;
  private uiContainer: Container;
  private vignetteGraphics: Graphics;
  private colorMatrix: ColorMatrixFilter;
  private bloomFilter: BlurFilter;
  private currentWorld = 'scadrial';
  private screenW: number;
  private screenH: number;

  constructor(
    worldContainer: Container,
    uiContainer: Container,
    screenW: number,
    screenH: number,
  ) {
    this.worldContainer = worldContainer;
    this.uiContainer = uiContainer;
    this.screenW = screenW;
    this.screenH = screenH;

    // Color grading filter on the world container
    this.colorMatrix = new ColorMatrixFilter();
    this.worldContainer.filters = [
      ...(this.worldContainer.filters ?? []),
      this.colorMatrix,
    ];

    // Bloom — subtle blur overlay (very light)
    this.bloomFilter = new BlurFilter({
      strength: 1.5,
      quality: 2,
    });

    // Vignette — darkened edges drawn as a UI overlay
    this.vignetteGraphics = new Graphics();
    this.vignetteGraphics.zIndex = 99900;
    this.vignetteGraphics.eventMode = 'none';
    this.uiContainer.addChild(this.vignetteGraphics);

    this.drawVignette();
  }

  /** Switch color grading to match the current world */
  setWorld(worldID: string): void {
    this.currentWorld = worldID;
    this.applyColorGrade();
  }

  private applyColorGrade(): void {
    const grade = WORLD_COLOR_GRADES[this.currentWorld] ?? WORLD_COLOR_GRADES.scadrial;

    this.colorMatrix.reset();
    this.colorMatrix.brightness(grade.brightness, false);
    this.colorMatrix.contrast(grade.contrast, false);
    this.colorMatrix.saturate(grade.saturation - 1, false);

    // Apply subtle color tint
    if (grade.tintStrength > 0) {
      const tr = ((grade.tint >> 16) & 0xff) / 255;
      const tg = ((grade.tint >> 8) & 0xff) / 255;
      const tb = (grade.tint & 0xff) / 255;
      const s = grade.tintStrength;
      const inv = 1 - s;

      // Modify the color matrix to shift towards the tint
      const m = this.colorMatrix.matrix;
      m[0] = m[0] * inv + tr * s;
      m[6] = m[6] * inv + tg * s;
      m[12] = m[12] * inv + tb * s;
    }
  }

  private drawVignette(): void {
    const g = this.vignetteGraphics;
    g.clear();
    const w = this.screenW;
    const h = this.screenH;
    const cx = w / 2;
    const cy = h / 2;
    const maxR = Math.sqrt(cx * cx + cy * cy);

    // Draw concentric dark rings from edge inward
    const steps = 8;
    for (let i = steps; i >= 0; i--) {
      const t = i / steps;
      const radius = maxR * (0.5 + t * 0.5);
      // Vignette darkens at the edges
      const alpha = t * t * 0.25; // Max 0.25 at corners
      g.circle(cx, cy, radius).fill({ color: 0x000000, alpha: alpha * 0.15 });
    }

    // Corner darkness — strongest visual impact
    const cornerAlpha = 0.15;
    g.rect(0, 0, w, h).fill({ color: 0x000000, alpha: 0 }); // transparent base
    // Top-left gradient
    g.circle(0, 0, maxR * 0.6).fill({ color: 0x000000, alpha: cornerAlpha });
    // Top-right
    g.circle(w, 0, maxR * 0.6).fill({ color: 0x000000, alpha: cornerAlpha });
    // Bottom-left
    g.circle(0, h, maxR * 0.6).fill({ color: 0x000000, alpha: cornerAlpha });
    // Bottom-right
    g.circle(w, h, maxR * 0.6).fill({ color: 0x000000, alpha: cornerAlpha });
  }

  /** Trigger a temporary color flash (e.g., on big hit) */
  flashColorGrade(color: number, intensity: number, durationMs: number): void {
    const r = ((color >> 16) & 0xff) / 255;
    const g = ((color >> 8) & 0xff) / 255;
    const b = (color & 0xff) / 255;

    // Temporarily shift the color matrix
    const savedMatrix = [...this.colorMatrix.matrix];
    const s = intensity;
    this.colorMatrix.matrix[0] += r * s;
    this.colorMatrix.matrix[6] += g * s;
    this.colorMatrix.matrix[12] += b * s;

    // Restore after duration
    setTimeout(() => {
      for (let i = 0; i < savedMatrix.length; i++) {
        this.colorMatrix.matrix[i] = savedMatrix[i];
      }
    }, durationMs);
  }

  resize(screenW: number, screenH: number): void {
    this.screenW = screenW;
    this.screenH = screenH;
    this.drawVignette();
  }

  destroy(): void {
    this.vignetteGraphics.destroy();
  }
}
