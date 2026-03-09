// ─── Tile Noise Module ──────────────────────────────────────────
// Reusable noise utilities for terrain, clouds, and procedural
// textures. Wraps simplex noise with domain-specific helpers.

import { simplex2D, fbm2D, lerpColor } from './ProceduralTextures';

// ─── Value Noise (cheaper than simplex for simple variation) ────

/** Fast hash-based value noise — cheaper than simplex for coarse grids */
export function valueNoise2D(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;

  // Smoothstep
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);

  // Hash corners
  const n00 = hashFloat(ix, iy);
  const n10 = hashFloat(ix + 1, iy);
  const n01 = hashFloat(ix, iy + 1);
  const n11 = hashFloat(ix + 1, iy + 1);

  // Bilinear interpolation
  const nx0 = n00 + (n10 - n00) * sx;
  const nx1 = n01 + (n11 - n01) * sx;
  return nx0 + (nx1 - nx0) * sy;
}

function hashFloat(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

// ─── Terrain Color Blending ────────────────────────────────────

/**
 * Generate a smooth terrain color based on noise-blended base/alt colors.
 * Produces natural, smooth color variation across tiles.
 */
export function terrainColor(
  baseColor: number,
  altColor: number,
  col: number,
  row: number,
  options?: {
    scale?: number;
    octaves?: number;
    intensity?: number;
    microScale?: number;
  },
): number {
  const scale = options?.scale ?? 0.12;
  const octaves = options?.octaves ?? 3;
  const intensity = options?.intensity ?? 0.6;
  const microScale = options?.microScale ?? 0.8;

  // Large-scale variation (smooth gradient across tiles)
  const largeNoise = fbm2D(col * scale, row * scale, octaves) * 0.5 + 0.5;

  // Micro-scale variation (per-tile texture)
  const microNoise = simplex2D(col * microScale, row * microScale) * 0.15;

  // Blend
  const t = Math.max(0, Math.min(1, largeNoise * intensity + microNoise));
  return lerpColor(baseColor, altColor, t);
}

// ─── Cloud/Weather Noise ───────────────────────────────────────

/**
 * Generate cloud density at a given point. Returns 0-1.
 * Animated by passing time-shifted coordinates.
 */
export function cloudNoise(
  x: number, y: number,
  time: number,
  scale: number = 0.005,
  speed: number = 0.3,
): number {
  const nx = x * scale + time * speed;
  const ny = y * scale + time * speed * 0.3;
  const n = fbm2D(nx, ny, 4, 2.0, 0.5);
  // Threshold to create distinct cloud shapes
  return Math.max(0, n * 0.5 + 0.3);
}

// ─── Distortion Noise ──────────────────────────────────────────

/**
 * Generate a displacement offset for heat haze or reality distortion.
 * Returns {dx, dy} in pixels.
 */
export function distortionOffset(
  x: number, y: number,
  time: number,
  strength: number = 2,
  scale: number = 0.02,
): { dx: number; dy: number } {
  const dx = simplex2D(x * scale + time * 0.5, y * scale) * strength;
  const dy = simplex2D(x * scale, y * scale + time * 0.7) * strength;
  return { dx, dy };
}

// ─── Edge Variation ────────────────────────────────────────────

/**
 * Get edge darkening factor based on distance from grid center.
 * Returns 0-1 where 1 = fully darkened.
 */
export function edgeFade(
  col: number, row: number,
  gridW: number, gridH: number,
  falloff: number = 0.15,
): number {
  const distX = Math.abs(col - gridW / 2) / (gridW / 2);
  const distY = Math.abs(row - gridH / 2) / (gridH / 2);
  const dist = Math.max(distX, distY);
  return Math.max(0, (dist - (1 - falloff)) / falloff);
}

// ─── Ripple Pattern ────────────────────────────────────────────

/**
 * Generate concentric ripple intensity at a point.
 * Useful for water puddle animation and impact waves.
 */
export function ripple(
  x: number, y: number,
  cx: number, cy: number,
  time: number,
  frequency: number = 8,
  speed: number = 3,
  decay: number = 0.1,
): number {
  const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
  const wave = Math.sin(dist * frequency - time * speed);
  const amplitude = Math.exp(-dist * decay);
  return wave * amplitude;
}
