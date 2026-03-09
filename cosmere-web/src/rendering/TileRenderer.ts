// ─── Enhanced Tilemap Renderer ──────────────────────────────────
// World-specific terrain textures with rich procedural detail,
// noise-based color variation, gradients, and ambient occlusion.

import { Application, Graphics, RenderTexture, Sprite, Container } from 'pixi.js';
import { lighten, darken } from '../utils/ColorUtils';
import type { WorldTheme } from '../scenes/WorldThemes';
import { simplex2D, fbm2D, lerpColor, terrainNoiseColor } from './ProceduralTextures';

// ─── Seeded Random ───────────────────────────────────────────────

function sr(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

// ─── World-Specific Terrain Details ──────────────────────────────

type TerrainDetailFn = (g: Graphics, x: number, y: number, seed: number, theme: WorldTheme) => void;

/** Scadrial: ash deposits, metal flecks, cracks, rust stains */
function scadrialDetail(g: Graphics, x: number, y: number, seed: number, t: WorldTheme): void {
  const r = sr(seed + 99);
  if (r < 0.2) {
    // Ash streak — wider, with layered deposits
    const dx = (sr(seed + 10) - 0.5) * 24;
    const dy = (sr(seed + 11) - 0.5) * 10;
    g.moveTo(x + dx - 8, y + dy).lineTo(x + dx + 8, y + dy + 2)
      .stroke({ color: 0x444038, width: 1.5, alpha: 0.3 });
    g.moveTo(x + dx - 5, y + dy + 1).lineTo(x + dx + 6, y + dy + 3)
      .stroke({ color: 0x3a3830, width: 1, alpha: 0.2 });
    // Ash pile scatter
    g.ellipse(x + dx, y + dy + 1, 3, 1).fill({ color: 0x555048, alpha: 0.15 });
  } else if (r < 0.32) {
    // Metal fleck cluster (hemalurgic debris)
    const count = 2 + Math.floor(sr(seed + 15) * 3);
    for (let i = 0; i < count; i++) {
      const fx = x + (sr(seed + 20 + i * 2) - 0.5) * 22;
      const fy = y + (sr(seed + 21 + i * 2) - 0.5) * 10;
      g.circle(fx, fy, 0.6 + sr(seed + 22 + i) * 0.5).fill({ color: 0x8899aa, alpha: 0.45 });
      // Glint highlight
      g.circle(fx - 0.3, fy - 0.3, 0.3).fill({ color: 0xbbccdd, alpha: 0.3 });
    }
  } else if (r < 0.45) {
    // Branching crack network
    const cx = x + (sr(seed + 30) - 0.5) * 18;
    const cy = y + (sr(seed + 31) - 0.5) * 8;
    const branches = 2 + Math.floor(sr(seed + 34) * 2);
    for (let b = 0; b < branches; b++) {
      const angle = sr(seed + 35 + b) * Math.PI;
      const len = 4 + sr(seed + 36 + b) * 6;
      g.moveTo(cx, cy)
        .lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len * 0.5)
        .stroke({ color: darken(t.tileBase, 0.35), width: 0.5, alpha: 0.35 });
    }
  } else if (r < 0.55) {
    // Rust stain
    const rx = x + (sr(seed + 40) - 0.5) * 16;
    const ry = y + (sr(seed + 41) - 0.5) * 7;
    g.ellipse(rx, ry, 3 + sr(seed + 42) * 2, 1.5 + sr(seed + 43))
      .fill({ color: 0x664422, alpha: 0.12 });
    g.ellipse(rx + 0.5, ry + 0.5, 2, 1)
      .fill({ color: 0x883322, alpha: 0.08 });
  }
}

/** Roshar: rock strata, crem deposits, water pools, lichen */
function rosharDetail(g: Graphics, x: number, y: number, seed: number, t: WorldTheme): void {
  const r = sr(seed + 99);
  if (r < 0.18) {
    // Rock strata — layered with color variation
    const dy = (sr(seed + 10) - 0.5) * 8;
    const layers = 2 + Math.floor(sr(seed + 14) * 2);
    for (let i = 0; i < layers; i++) {
      const offset = i * 2;
      const lightAmt = 0.08 + i * 0.04;
      g.moveTo(x - 12, y + dy + offset).lineTo(x + 12, y + dy + offset + 0.5)
        .stroke({ color: lighten(t.tileBase, lightAmt), width: 0.7, alpha: 0.3 });
    }
  } else if (r < 0.3) {
    // Crem deposit — thicker, more organic shape
    const cx = x + (sr(seed + 20) - 0.5) * 16;
    const cy = y + (sr(seed + 21) - 0.5) * 8;
    const w = 4 + sr(seed + 22) * 4;
    const h = 2 + sr(seed + 23) * 2;
    g.ellipse(cx, cy, w, h).fill({ color: 0x44403a, alpha: 0.25 });
    g.ellipse(cx - 0.5, cy - 0.3, w * 0.6, h * 0.5)
      .fill({ color: 0x555048, alpha: 0.12 }); // lighter inner layer
  } else if (r < 0.42) {
    // Water puddle — with reflection
    const cx = x + (sr(seed + 40) - 0.5) * 14;
    const cy = y + (sr(seed + 41) - 0.5) * 6;
    const pw = 3 + sr(seed + 42) * 3;
    const ph = 1.5 + sr(seed + 43) * 1.5;
    // Dark base
    g.ellipse(cx, cy, pw + 0.5, ph + 0.3).fill({ color: 0x223344, alpha: 0.25 });
    // Water body
    g.ellipse(cx, cy, pw, ph).fill({ color: 0x334466, alpha: 0.3 });
    // Reflection highlight
    g.ellipse(cx - pw * 0.2, cy - ph * 0.3, pw * 0.4, ph * 0.3)
      .fill({ color: 0x6699cc, alpha: 0.15 });
    // Rim light
    g.ellipse(cx, cy, pw, ph).stroke({ color: 0x5577aa, width: 0.3, alpha: 0.15 });
  } else if (r < 0.52) {
    // Lichen patches — orange/brown spots on rock
    const cx = x + (sr(seed + 50) - 0.5) * 18;
    const cy = y + (sr(seed + 51) - 0.5) * 8;
    const count = 2 + Math.floor(sr(seed + 52) * 3);
    for (let i = 0; i < count; i++) {
      const lx = cx + (sr(seed + 53 + i * 2) - 0.5) * 6;
      const ly = cy + (sr(seed + 54 + i * 2) - 0.5) * 3;
      g.circle(lx, ly, 0.8 + sr(seed + 55 + i) * 1)
        .fill({ color: sr(seed + 56 + i) > 0.5 ? 0x886644 : 0x667744, alpha: 0.25 });
    }
  }
}

/** Taldain: sand ripples, dune crests, sun-bleached stones, heat shimmer marks */
function taldainDetail(g: Graphics, x: number, y: number, seed: number, t: WorldTheme): void {
  const r = sr(seed + 99);
  if (r < 0.25) {
    // Sand ripple lines — wind patterns, more curves
    const dy = (sr(seed + 10) - 0.5) * 8;
    const curves = 3 + Math.floor(sr(seed + 11) * 3);
    for (let i = 0; i < curves; i++) {
      const offset = i * 2;
      const waveAmp = 1 + sr(seed + 15 + i) * 1.5;
      g.moveTo(x - 12, y + dy + offset)
        .quadraticCurveTo(x - 4, y + dy + offset - waveAmp, x, y + dy + offset)
        .quadraticCurveTo(x + 4, y + dy + offset + waveAmp, x + 12, y + dy + offset)
        .stroke({ color: lighten(t.tileBase, 0.1 + i * 0.02), width: 0.4, alpha: 0.25 });
    }
  } else if (r < 0.37) {
    // Sun-bleached stone with shadow
    const cx = x + (sr(seed + 20) - 0.5) * 16;
    const cy = y + (sr(seed + 21) - 0.5) * 7;
    const sz = 2 + sr(seed + 22) * 2.5;
    // Shadow
    g.ellipse(cx + 1, cy + 0.5, sz * 1.1, sz * 0.5)
      .fill({ color: darken(t.tileBase, 0.3), alpha: 0.15 });
    // Stone body
    g.ellipse(cx, cy, sz, sz * 0.55).fill({ color: lighten(t.tileBase, 0.25), alpha: 0.4 });
    // Highlight
    g.ellipse(cx - sz * 0.2, cy - sz * 0.15, sz * 0.4, sz * 0.2)
      .fill({ color: lighten(t.tileBase, 0.45), alpha: 0.2 });
  } else if (r < 0.47) {
    // Dune crest line
    const dy = (sr(seed + 28) - 0.5) * 5;
    g.moveTo(x - 14, y + dy + 2)
      .quadraticCurveTo(x, y + dy - 1, x + 14, y + dy + 2)
      .stroke({ color: lighten(t.tileBase, 0.18), width: 0.8, alpha: 0.2 });
    g.moveTo(x - 14, y + dy + 3)
      .quadraticCurveTo(x, y + dy + 0.5, x + 14, y + dy + 3)
      .stroke({ color: darken(t.tileBase, 0.12), width: 0.6, alpha: 0.15 });
  }
}

/** Nalthis: flower petals, vivid color patches, grass tufts, vines */
function nalthisDetail(g: Graphics, x: number, y: number, seed: number, _t: WorldTheme): void {
  const r = sr(seed + 99);
  if (r < 0.2) {
    // Color-drained patch (gray area) — sign of Awakening
    const cx = x + (sr(seed + 10) - 0.5) * 16;
    const cy = y + (sr(seed + 11) - 0.5) * 7;
    g.ellipse(cx, cy, 4 + sr(seed + 12) * 3, 2 + sr(seed + 13) * 1.5)
      .fill({ color: 0x333333, alpha: 0.12 });
    g.ellipse(cx, cy, 3, 1.5).fill({ color: 0x444444, alpha: 0.08 });
  } else if (r < 0.4) {
    // Flower cluster with glow
    const petalColors = [0xff6688, 0x44aaff, 0xffcc44, 0x66dd66, 0xcc66ff, 0xff8844];
    const cx = x + (sr(seed + 20) - 0.5) * 20;
    const cy = y + (sr(seed + 21) - 0.5) * 9;
    const colorIdx = Math.floor(sr(seed + 22) * petalColors.length);
    const color = petalColors[colorIdx];
    // Glow
    g.circle(cx, cy, 3).fill({ color, alpha: 0.06 });
    // Petals
    const petals = 3 + Math.floor(sr(seed + 24) * 3);
    for (let p = 0; p < petals; p++) {
      const angle = (p / petals) * Math.PI * 2 + sr(seed + 25 + p) * 0.5;
      const pr = 1 + sr(seed + 26 + p) * 0.8;
      g.circle(cx + Math.cos(angle) * pr, cy + Math.sin(angle) * pr * 0.5, 0.6 + sr(seed + 27 + p) * 0.4)
        .fill({ color, alpha: 0.4 });
    }
    // Center
    g.circle(cx, cy, 0.5).fill({ color: 0xffee88, alpha: 0.45 });
  } else if (r < 0.55) {
    // Grass tuft — more blades, wind-bent
    const cx = x + (sr(seed + 30) - 0.5) * 18;
    const cy = y + (sr(seed + 31) - 0.5) * 8;
    const blades = 4 + Math.floor(sr(seed + 32) * 3);
    for (let i = 0; i < blades; i++) {
      const bx = cx + (i - blades / 2) * 1.5;
      const bend = (sr(seed + 33 + i) - 0.3) * 3; // Wind bend
      const height = 3 + sr(seed + 34 + i) * 3;
      const greenShade = sr(seed + 35 + i) > 0.5 ? 0x448833 : 0x336622;
      g.moveTo(bx, cy)
        .quadraticCurveTo(bx + bend, cy - height * 0.5, bx + bend * 1.5, cy - height)
        .stroke({ color: greenShade, width: 0.5, alpha: 0.35 });
    }
  } else if (r < 0.63) {
    // Vine tendril
    const cx = x + (sr(seed + 40) - 0.5) * 16;
    const cy = y + (sr(seed + 41) - 0.5) * 7;
    const len = 6 + sr(seed + 42) * 8;
    const angle = sr(seed + 43) * Math.PI * 2;
    g.moveTo(cx, cy)
      .quadraticCurveTo(
        cx + Math.cos(angle) * len * 0.5,
        cy + Math.sin(angle) * len * 0.25 - 2,
        cx + Math.cos(angle) * len,
        cy + Math.sin(angle) * len * 0.5,
      )
      .stroke({ color: 0x336622, width: 0.6, alpha: 0.25 });
  }
}

/** Komashi: ink stains, paper textures, nightmare residue, brush strokes */
function komashiDetail(g: Graphics, x: number, y: number, seed: number, t: WorldTheme): void {
  const r = sr(seed + 99);
  if (r < 0.22) {
    // Ink splatter — organic blob shapes
    const cx = x + (sr(seed + 10) - 0.5) * 18;
    const cy = y + (sr(seed + 11) - 0.5) * 8;
    const mainSize = 2 + sr(seed + 12) * 2.5;
    g.circle(cx, cy, mainSize).fill({ color: 0x111122, alpha: 0.25 });
    // Satellite splatters
    const splats = 3 + Math.floor(sr(seed + 13) * 3);
    for (let i = 0; i < splats; i++) {
      const angle = sr(seed + 14 + i) * Math.PI * 2;
      const dist = mainSize + sr(seed + 15 + i) * 4;
      const sx = cx + Math.cos(angle) * dist;
      const sy = cy + Math.sin(angle) * dist * 0.5;
      g.circle(sx, sy, 0.4 + sr(seed + 16 + i) * 0.6).fill({ color: 0x111122, alpha: 0.18 });
    }
  } else if (r < 0.35) {
    // Paper-like lighter patch with edge
    const cx = x + (sr(seed + 20) - 0.5) * 16;
    const cy = y + (sr(seed + 21) - 0.5) * 7;
    const pw = 5 + sr(seed + 22) * 4;
    const ph = 2.5 + sr(seed + 23) * 1.5;
    g.roundRect(cx - pw / 2, cy - ph / 2, pw, ph, 1)
      .fill({ color: lighten(t.tileBase, 0.2), alpha: 0.15 });
    g.roundRect(cx - pw / 2, cy - ph / 2, pw, ph, 1)
      .stroke({ color: lighten(t.tileBase, 0.1), width: 0.3, alpha: 0.1 });
  } else if (r < 0.47) {
    // Nightmare residue glow — pulsing dark spot
    const cx = x + (sr(seed + 30) - 0.5) * 14;
    const cy = y + (sr(seed + 31) - 0.5) * 6;
    g.circle(cx, cy, 4).fill({ color: 0x330044, alpha: 0.08 });
    g.circle(cx, cy, 2.5).fill({ color: 0x660088, alpha: 0.06 });
    g.circle(cx, cy, 1).fill({ color: 0xaa44ff, alpha: 0.05 });
  } else if (r < 0.55) {
    // Brush stroke mark
    const cx = x + (sr(seed + 40) - 0.5) * 16;
    const cy = y + (sr(seed + 41) - 0.5) * 7;
    const angle = sr(seed + 42) * Math.PI;
    const len = 5 + sr(seed + 43) * 5;
    g.moveTo(cx, cy)
      .lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len * 0.5)
      .stroke({ color: 0x222244, width: 1.5 + sr(seed + 44), alpha: 0.15 });
  }
}

/** Sel: Aon glow traces, cracked tiles, ancient patterns, mosaic */
function selDetail(g: Graphics, x: number, y: number, seed: number, t: WorldTheme): void {
  const r = sr(seed + 99);
  if (r < 0.18) {
    // Faded Aon trace — glowing arc segments
    const cx = x + (sr(seed + 10) - 0.5) * 14;
    const cy = y + (sr(seed + 11) - 0.5) * 6;
    const angle = sr(seed + 12) * Math.PI;
    const len = 5 + sr(seed + 13) * 5;
    // Outer glow
    g.moveTo(cx - Math.cos(angle) * len, cy - Math.sin(angle) * len * 0.5)
      .lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len * 0.5)
      .stroke({ color: 0xffdd44, width: 2, alpha: 0.06 });
    // Core line
    g.moveTo(cx - Math.cos(angle) * len, cy - Math.sin(angle) * len * 0.5)
      .lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len * 0.5)
      .stroke({ color: 0xddcc44, width: 0.6, alpha: 0.18 });
  } else if (r < 0.3) {
    // Mosaic tile fragment
    const cx = x + (sr(seed + 20) - 0.5) * 18;
    const cy = y + (sr(seed + 21) - 0.5) * 8;
    const mosaicColors = [0x998844, 0x889944, 0x449988, 0x884499];
    const mc = mosaicColors[Math.floor(sr(seed + 22) * mosaicColors.length)];
    const s = 2 + sr(seed + 23) * 2;
    g.rect(cx - s / 2, cy - s / 4, s, s / 2).fill({ color: mc, alpha: 0.2 });
    g.rect(cx - s / 2, cy - s / 4, s, s / 2).stroke({ color: lighten(mc, 0.2), width: 0.3, alpha: 0.15 });
  } else if (r < 0.42) {
    // Cracked tile pattern — more complex
    const cx = x + (sr(seed + 30) - 0.5) * 18;
    const cy = y + (sr(seed + 31) - 0.5) * 8;
    const cracks = 2 + Math.floor(sr(seed + 32) * 2);
    for (let c = 0; c < cracks; c++) {
      const angle = sr(seed + 33 + c) * Math.PI;
      const len = 3 + sr(seed + 34 + c) * 4;
      g.moveTo(cx, cy)
        .lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len * 0.5)
        .stroke({ color: darken(t.tileBase, 0.25), width: 0.5, alpha: 0.3 });
    }
  }
}

/** Shadesmar: bead textures, cognitive glow, reality distortion */
function shadesmarDetail(g: Graphics, x: number, y: number, seed: number, _t: WorldTheme): void {
  const r = sr(seed + 99);
  if (r < 0.25) {
    // Glass bead scatter — more varied and luminous
    const count = 3 + Math.floor(sr(seed + 10) * 4);
    for (let i = 0; i < count; i++) {
      const bx = x + (sr(seed + 11 + i * 2) - 0.5) * 22;
      const by = y + (sr(seed + 12 + i * 2) - 0.5) * 10;
      const beadColors = [0x4466aa, 0x6644aa, 0x44aaaa, 0xaa4466, 0x8855ff];
      const bc = beadColors[Math.floor(sr(seed + 13 + i) * beadColors.length)];
      const bs = 0.8 + sr(seed + 14 + i) * 0.8;
      // Bead shadow
      g.circle(bx + 0.3, by + 0.3, bs).fill({ color: 0x000011, alpha: 0.12 });
      // Bead body
      g.circle(bx, by, bs).fill({ color: bc, alpha: 0.3 });
      // Highlight
      g.circle(bx - 0.2, by - 0.2, bs * 0.4).fill({ color: 0xccccff, alpha: 0.15 });
    }
  } else if (r < 0.38) {
    // Cognitive glow — layered shimmer
    const cx = x + (sr(seed + 20) - 0.5) * 14;
    const cy = y + (sr(seed + 21) - 0.5) * 6;
    g.circle(cx, cy, 5 + sr(seed + 22) * 3).fill({ color: 0x221144, alpha: 0.06 });
    g.circle(cx, cy, 3).fill({ color: 0x4422aa, alpha: 0.05 });
    g.circle(cx, cy, 1.5).fill({ color: 0x8855ff, alpha: 0.04 });
  } else if (r < 0.48) {
    // Reality distortion — warped lines
    const cx = x + (sr(seed + 30) - 0.5) * 16;
    const cy = y + (sr(seed + 31) - 0.5) * 7;
    g.moveTo(cx - 6, cy)
      .quadraticCurveTo(cx - 2, cy - 3, cx, cy)
      .quadraticCurveTo(cx + 2, cy + 3, cx + 6, cy)
      .stroke({ color: 0x6644cc, width: 0.5, alpha: 0.18 });
  }
}

const WORLD_DETAIL_FNS: Record<string, TerrainDetailFn> = {
  scadrial: scadrialDetail,
  roshar: rosharDetail,
  taldain: taldainDetail,
  nalthis: nalthisDetail,
  komashi: komashiDetail,
  sel: selDetail,
  shadesmar: shadesmarDetail,
};

// ─── Main Tile Renderer ──────────────────────────────────────────

export function renderEnhancedTilemap(
  gridWidth: number, gridHeight: number,
  worldID: string, theme: WorldTheme,
  isoToScreen: (col: number, row: number) => { x: number; y: number },
  darkenColor: (base: number, amount: number) => number,
): Graphics {
  const g = new Graphics();
  g.zIndex = -1000;

  const detailFn = WORLD_DETAIL_FNS[worldID];

  for (let col = 0; col < gridWidth; col++) {
    for (let row = 0; row < gridHeight; row++) {
      const { x, y } = isoToScreen(col, row);
      const seed = col * 1000 + row;
      const rand = sr(seed);

      // ── Noise-based tile color ──
      // Use simplex noise for smooth, natural color variation
      const noiseVal = fbm2D(col * 0.12, row * 0.12, 3) * 0.5 + 0.5; // [0,1]
      const baseColor = lerpColor(theme.tileBase, theme.tileAlt, noiseVal * 0.6);

      // Additional micro-variation
      const microNoise = simplex2D(col * 0.8, row * 0.8) * 0.03;
      const distFromCenter = Math.abs(col - gridWidth / 2) / gridWidth + Math.abs(row - gridHeight / 2) / gridHeight;
      const edgeDarken = distFromCenter * 0.1;

      let color: number;
      if (microNoise > 0) {
        color = lighten(baseColor, microNoise);
      } else {
        color = darkenColor(baseColor, -microNoise + edgeDarken);
      }

      // Edge fade
      const isEdge = col === 0 || row === 0 || col === gridWidth - 1 || row === gridHeight - 1;
      const isNearEdge = col <= 1 || row <= 1 || col >= gridWidth - 2 || row >= gridHeight - 2;
      const alpha = isEdge ? 0.45 : isNearEdge ? 0.7 : 0.95;

      // ── Diamond tile with gradient fill ──
      const pts = [
        { x: x, y: y - 16 },
        { x: x + 32, y: y },
        { x: x, y: y + 16 },
        { x: x - 32, y: y },
      ];
      g.poly(pts).fill({ color, alpha });

      // ── Gradient overlay: lighter at top, darker at bottom (3D depth) ──
      if (!isEdge) {
        // Top-left face highlight
        g.poly([
          { x, y: y - 16 },
          { x: x - 32, y },
          { x, y },
        ]).fill({ color: lighten(color, 0.12), alpha: 0.15 });

        // Bottom-right face shadow
        g.poly([
          { x, y },
          { x: x + 32, y },
          { x, y: y + 16 },
        ]).fill({ color: darken(color, 0.15), alpha: 0.12 });
      }

      // ── Ambient occlusion (dark seams between tiles) ──
      if (!isEdge) {
        g.poly(pts).stroke({ color: darken(theme.tileBorder, 0.4), width: 0.7, alpha: 0.18 });
      }

      // ── Inner highlight (top-left edges for 3D bevel) ──
      if (!isEdge) {
        g.moveTo(x - 30, y).lineTo(x, y - 14)
          .stroke({ color: lighten(color, 0.22), width: 0.8, alpha: 0.2 });
        g.moveTo(x, y - 14).lineTo(x + 30, y)
          .stroke({ color: lighten(color, 0.14), width: 0.5, alpha: 0.13 });
      }

      // ── Inner shadow (bottom-right edges for 3D bevel) ──
      if (!isEdge) {
        g.moveTo(x + 30, y).lineTo(x, y + 14)
          .stroke({ color: darken(color, 0.28), width: 0.8, alpha: 0.2 });
        g.moveTo(x, y + 14).lineTo(x - 30, y)
          .stroke({ color: darken(color, 0.2), width: 0.5, alpha: 0.13 });
      }

      // ── Surface texture (micro-noise dots for tactile feel) ──
      if (!isEdge && rand > 0.1) {
        const noiseCount = 3 + Math.floor(sr(seed + 50) * 4);
        for (let n = 0; n < noiseCount; n++) {
          const nx = x + (sr(seed + 60 + n * 3) - 0.5) * 44;
          const ny = y + (sr(seed + 61 + n * 3) - 0.5) * 20;
          const dx = Math.abs(nx - x);
          const dy = Math.abs(ny - y);
          if (dx / 32 + dy / 16 < 0.82) {
            const bright = sr(seed + 62 + n * 3) > 0.5;
            g.circle(nx, ny, 0.3 + sr(seed + 63 + n) * 0.4)
              .fill({ color: bright ? lighten(color, 0.18) : darken(color, 0.18), alpha: 0.12 });
          }
        }
      }

      // ── World-specific terrain details ──
      if (detailFn && !isEdge && rand > 0.2) {
        detailFn(g, x, y, seed, theme);
      }

      // ── Generic details (pebbles with shadow + highlight) ──
      if (rand > 0.75 && rand < 0.92 && !isEdge) {
        const cx = x + (sr(seed + 3) - 0.5) * 20;
        const cy = y + (sr(seed + 5) - 0.5) * 10;
        const pebbleSize = 1 + sr(seed + 6) * 0.6;
        // Shadow
        g.circle(cx + 0.5, cy + 0.4, pebbleSize + 0.3)
          .fill({ color: darken(theme.tileBorder, 0.25), alpha: 0.12 });
        // Body
        g.circle(cx, cy, pebbleSize)
          .fill({ color: theme.tileBorder, alpha: 0.3 });
        // Highlight
        g.circle(cx - 0.3, cy - 0.3, pebbleSize * 0.4)
          .fill({ color: lighten(theme.tileBorder, 0.35), alpha: 0.18 });
      }
    }
  }

  return g;
}

// ─── Cached Tile Renderer (RenderTexture) ──────────────────────

let _cachedTileTexture: RenderTexture | null = null;
let _cachedTileSprite: Sprite | null = null;
let _cachedKey = '';

/**
 * Render tilemap to a RenderTexture for performance.
 * The heavy procedural drawing only happens once on zone load;
 * subsequent frames display a cheap single Sprite.
 */
export function renderCachedTilemap(
  app: Application,
  gridWidth: number, gridHeight: number,
  worldID: string, theme: WorldTheme,
  isoToScreen: (col: number, row: number) => { x: number; y: number },
  darkenColor: (base: number, amount: number) => number,
  parentContainer: Container,
): Sprite {
  const key = `${worldID}_${gridWidth}_${gridHeight}`;

  // Return cached if same zone
  if (_cachedTileSprite && _cachedKey === key && !_cachedTileSprite.destroyed) {
    return _cachedTileSprite;
  }

  // Generate the Graphics tilemap
  const g = renderEnhancedTilemap(gridWidth, gridHeight, worldID, theme, isoToScreen, darkenColor);

  // Measure bounds
  const bounds = g.getLocalBounds();
  const w = Math.ceil(bounds.width + 20);
  const h = Math.ceil(bounds.height + 20);

  if (w <= 0 || h <= 0) return new Sprite();

  // Create or resize RenderTexture
  if (_cachedTileTexture) {
    _cachedTileTexture.resize(w, h);
  } else {
    _cachedTileTexture = RenderTexture.create({ width: w, height: h, antialias: false });
  }

  // Position graphics for rendering
  g.x = -bounds.x + 10;
  g.y = -bounds.y + 10;

  const tempContainer = new Container();
  tempContainer.addChild(g);

  app.renderer.render({
    container: tempContainer,
    target: _cachedTileTexture,
    clear: true,
  });

  // Create sprite from texture
  if (_cachedTileSprite) _cachedTileSprite.destroy();
  _cachedTileSprite = new Sprite(_cachedTileTexture);
  _cachedTileSprite.x = bounds.x - 10;
  _cachedTileSprite.y = bounds.y - 10;
  _cachedTileSprite.zIndex = -1000;

  _cachedKey = key;

  // Cleanup
  tempContainer.removeChildren();
  g.destroy();

  return _cachedTileSprite;
}

/** Invalidate tile cache (call on zone change) */
export function invalidateTileCache(): void {
  _cachedKey = '';
}
