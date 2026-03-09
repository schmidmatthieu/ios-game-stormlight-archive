// ─── Procedural Textures — Simplex Noise & Texture Generation ────
// Provides simplex noise 2D and procedural texture generation
// for rich terrain rendering without external assets.

import { Application, Graphics, RenderTexture, Sprite, Container } from 'pixi.js';

// ─── Simplex Noise 2D ───────────────────────────────────────────
// Based on Stefan Gustavson's implementation (public domain)

const GRAD3 = [
  [1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
  [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
  [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1],
];

const PERM = new Uint8Array(512);
const PERM_MOD12 = new Uint8Array(512);

// Seed the permutation table
function seedNoise(seed: number): void {
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  // Fisher-Yates shuffle with seed
  let s = seed;
  for (let i = 255; i > 0; i--) {
    s = (s * 16807 + 0) % 2147483647;
    const j = s % (i + 1);
    const tmp = p[i];
    p[i] = p[j];
    p[j] = tmp;
  }
  for (let i = 0; i < 512; i++) {
    PERM[i] = p[i & 255];
    PERM_MOD12[i] = PERM[i] % 12;
  }
}
seedNoise(42);

function dot2(g: number[], x: number, y: number): number {
  return g[0] * x + g[1] * y;
}

const F2 = 0.5 * (Math.sqrt(3) - 1);
const G2 = (3 - Math.sqrt(3)) / 6;

export function simplex2D(xin: number, yin: number): number {
  const s = (xin + yin) * F2;
  const i = Math.floor(xin + s);
  const j = Math.floor(yin + s);
  const t = (i + j) * G2;
  const X0 = i - t;
  const Y0 = j - t;
  const x0 = xin - X0;
  const y0 = yin - Y0;

  const i1 = x0 > y0 ? 1 : 0;
  const j1 = x0 > y0 ? 0 : 1;

  const x1 = x0 - i1 + G2;
  const y1 = y0 - j1 + G2;
  const x2 = x0 - 1 + 2 * G2;
  const y2 = y0 - 1 + 2 * G2;

  const ii = i & 255;
  const jj = j & 255;
  const gi0 = PERM_MOD12[ii + PERM[jj]];
  const gi1 = PERM_MOD12[ii + i1 + PERM[jj + j1]];
  const gi2 = PERM_MOD12[ii + 1 + PERM[jj + 1]];

  let n0 = 0, n1 = 0, n2 = 0;

  let t0 = 0.5 - x0 * x0 - y0 * y0;
  if (t0 >= 0) { t0 *= t0; n0 = t0 * t0 * dot2(GRAD3[gi0], x0, y0); }

  let t1 = 0.5 - x1 * x1 - y1 * y1;
  if (t1 >= 0) { t1 *= t1; n1 = t1 * t1 * dot2(GRAD3[gi1], x1, y1); }

  let t2 = 0.5 - x2 * x2 - y2 * y2;
  if (t2 >= 0) { t2 *= t2; n2 = t2 * t2 * dot2(GRAD3[gi2], x2, y2); }

  return 70 * (n0 + n1 + n2); // Range approximately [-1, 1]
}

/** Fractional Brownian Motion — layered noise for natural-looking textures */
export function fbm2D(x: number, y: number, octaves: number, lacunarity = 2.0, gain = 0.5): number {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let maxAmplitude = 0;

  for (let i = 0; i < octaves; i++) {
    value += amplitude * simplex2D(x * frequency, y * frequency);
    maxAmplitude += amplitude;
    amplitude *= gain;
    frequency *= lacunarity;
  }

  return value / maxAmplitude;
}

// ─── Color Utilities ────────────────────────────────────────────

/** Linearly interpolate two hex colors */
export function lerpColor(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
  const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bv = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | bv;
}

/** Blend a color towards white or black */
export function tintColor(color: number, amount: number): number {
  const target = amount > 0 ? 0xffffff : 0x000000;
  return lerpColor(color, target, Math.abs(amount));
}

// ─── Texture Generation Helpers ─────────────────────────────────

/** Generate a noise-based tile color for terrain variation */
export function terrainNoiseColor(
  baseColor: number, altColor: number,
  col: number, row: number,
  scale = 0.15, intensity = 0.5,
): number {
  const n = simplex2D(col * scale, row * scale) * 0.5 + 0.5; // [0,1]
  return lerpColor(baseColor, altColor, n * intensity);
}

/** Get a natural-looking variation factor for a tile */
export function tileVariation(col: number, row: number, seed = 0): number {
  return fbm2D(col * 0.2 + seed, row * 0.2 + seed, 3) * 0.5 + 0.5;
}
