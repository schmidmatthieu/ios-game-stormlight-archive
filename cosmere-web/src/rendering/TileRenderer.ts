// ─── Enhanced Tilemap Renderer ──────────────────────────────────
// World-specific terrain textures with rich procedural detail

import { Graphics } from 'pixi.js';
import { lighten, darken } from '../utils/ColorUtils';
import type { WorldTheme } from '../scenes/WorldThemes';

// ─── Seeded Random ───────────────────────────────────────────────

function sr(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

// ─── World-Specific Terrain Details ──────────────────────────────

type TerrainDetailFn = (g: Graphics, x: number, y: number, seed: number, theme: WorldTheme) => void;

/** Scadrial: ash deposits, metal flecks, cracks */
function scadrialDetail(g: Graphics, x: number, y: number, seed: number, t: WorldTheme): void {
  const r = sr(seed + 99);
  if (r < 0.25) {
    // Ash streak
    const dx = (sr(seed + 10) - 0.5) * 24;
    const dy = (sr(seed + 11) - 0.5) * 10;
    g.moveTo(x + dx - 6, y + dy).lineTo(x + dx + 6, y + dy + 2)
      .stroke({ color: 0x444038, width: 1, alpha: 0.35 });
  } else if (r < 0.4) {
    // Metal fleck (glint)
    const fx = x + (sr(seed + 20) - 0.5) * 22;
    const fy = y + (sr(seed + 21) - 0.5) * 10;
    g.circle(fx, fy, 0.8).fill({ color: 0x8899aa, alpha: 0.4 });
  } else if (r < 0.55) {
    // Crack lines
    const cx = x + (sr(seed + 30) - 0.5) * 18;
    const cy = y + (sr(seed + 31) - 0.5) * 8;
    g.moveTo(cx, cy).lineTo(cx + (sr(seed + 32) - 0.5) * 10, cy + sr(seed + 33) * 5)
      .stroke({ color: darken(t.tileBase, 0.3), width: 0.5, alpha: 0.4 });
  }
}

/** Roshar: rock strata, crem deposits, water pools */
function rosharDetail(g: Graphics, x: number, y: number, seed: number, t: WorldTheme): void {
  const r = sr(seed + 99);
  if (r < 0.2) {
    // Rock strata lines
    const dy = (sr(seed + 10) - 0.5) * 8;
    g.moveTo(x - 12, y + dy).lineTo(x + 12, y + dy + 1)
      .stroke({ color: lighten(t.tileBase, 0.15), width: 0.8, alpha: 0.3 });
    g.moveTo(x - 10, y + dy + 2).lineTo(x + 10, y + dy + 3)
      .stroke({ color: lighten(t.tileBase, 0.1), width: 0.5, alpha: 0.25 });
  } else if (r < 0.35) {
    // Crem deposit (brown-tan patch)
    const cx = x + (sr(seed + 20) - 0.5) * 16;
    const cy = y + (sr(seed + 21) - 0.5) * 8;
    g.ellipse(cx, cy, 4 + sr(seed + 22) * 3, 2 + sr(seed + 23) * 1.5)
      .fill({ color: 0x44403a, alpha: 0.3 });
  } else if (r < 0.45) {
    // Small water puddle
    const cx = x + (sr(seed + 40) - 0.5) * 14;
    const cy = y + (sr(seed + 41) - 0.5) * 6;
    g.ellipse(cx, cy, 3 + sr(seed + 42) * 2, 1.5 + sr(seed + 43))
      .fill({ color: 0x334466, alpha: 0.25 });
    g.ellipse(cx - 0.5, cy - 0.5, 1.5, 0.8)
      .fill({ color: 0x5577aa, alpha: 0.15 }); // highlight
  }
}

/** Taldain: sand ripples, sun-bleached stones, sand swirls */
function taldainDetail(g: Graphics, x: number, y: number, seed: number, t: WorldTheme): void {
  const r = sr(seed + 99);
  if (r < 0.3) {
    // Sand ripple lines (wind patterns)
    const dy = (sr(seed + 10) - 0.5) * 8;
    const curves = 2 + Math.floor(sr(seed + 11) * 3);
    for (let i = 0; i < curves; i++) {
      const offset = i * 2.5;
      g.moveTo(x - 10, y + dy + offset)
        .quadraticCurveTo(x, y + dy + offset - 1.5, x + 10, y + dy + offset)
        .stroke({ color: lighten(t.tileBase, 0.12), width: 0.4, alpha: 0.3 });
    }
  } else if (r < 0.42) {
    // Sun-bleached stone
    const cx = x + (sr(seed + 20) - 0.5) * 16;
    const cy = y + (sr(seed + 21) - 0.5) * 7;
    const sz = 2 + sr(seed + 22) * 2;
    g.ellipse(cx, cy, sz, sz * 0.6).fill({ color: lighten(t.tileBase, 0.25), alpha: 0.35 });
    g.ellipse(cx - 0.5, cy - 0.3, sz * 0.5, sz * 0.3)
      .fill({ color: lighten(t.tileBase, 0.4), alpha: 0.2 }); // highlight
  }
}

/** Nalthis: flower petals, color patches, grass tufts */
function nalthisDetail(g: Graphics, x: number, y: number, seed: number, _t: WorldTheme): void {
  const r = sr(seed + 99);
  if (r < 0.25) {
    // Color-drained patch (gray area)
    const cx = x + (sr(seed + 10) - 0.5) * 16;
    const cy = y + (sr(seed + 11) - 0.5) * 7;
    g.ellipse(cx, cy, 3 + sr(seed + 12) * 3, 1.5 + sr(seed + 13))
      .fill({ color: 0x333333, alpha: 0.15 });
  } else if (r < 0.45) {
    // Small flower/color splash
    const petalColors = [0xff6688, 0x44aaff, 0xffcc44, 0x66dd66, 0xcc66ff];
    const cx = x + (sr(seed + 20) - 0.5) * 20;
    const cy = y + (sr(seed + 21) - 0.5) * 9;
    const colorIdx = Math.floor(sr(seed + 22) * petalColors.length);
    g.circle(cx, cy, 1.2 + sr(seed + 23) * 0.8).fill({ color: petalColors[colorIdx], alpha: 0.35 });
  } else if (r < 0.55) {
    // Grass tuft
    const cx = x + (sr(seed + 30) - 0.5) * 18;
    const cy = y + (sr(seed + 31) - 0.5) * 8;
    for (let i = 0; i < 3; i++) {
      g.moveTo(cx + i * 2 - 2, cy)
        .lineTo(cx + i * 2 - 2 + (sr(seed + 33 + i) - 0.5) * 2, cy - 3 - sr(seed + 34 + i) * 2)
        .stroke({ color: 0x448833, width: 0.5, alpha: 0.3 });
    }
  }
}

/** Komashi: ink stains, paper textures, nightmare residue */
function komashiDetail(g: Graphics, x: number, y: number, seed: number, t: WorldTheme): void {
  const r = sr(seed + 99);
  if (r < 0.25) {
    // Ink splatter
    const cx = x + (sr(seed + 10) - 0.5) * 18;
    const cy = y + (sr(seed + 11) - 0.5) * 8;
    g.circle(cx, cy, 2 + sr(seed + 12) * 2).fill({ color: 0x111122, alpha: 0.3 });
    // Small splatter dots
    g.circle(cx + 3, cy - 1, 0.8).fill({ color: 0x111122, alpha: 0.2 });
    g.circle(cx - 2, cy + 1.5, 0.6).fill({ color: 0x111122, alpha: 0.2 });
  } else if (r < 0.4) {
    // Paper-like lighter patch
    const cx = x + (sr(seed + 20) - 0.5) * 16;
    const cy = y + (sr(seed + 21) - 0.5) * 7;
    g.roundRect(cx - 3, cy - 1.5, 6 + sr(seed + 22) * 4, 3, 1)
      .fill({ color: lighten(t.tileBase, 0.2), alpha: 0.2 });
  } else if (r < 0.5) {
    // Nightmare residue glow
    const cx = x + (sr(seed + 30) - 0.5) * 14;
    const cy = y + (sr(seed + 31) - 0.5) * 6;
    g.circle(cx, cy, 3).fill({ color: 0x660088, alpha: 0.08 });
    g.circle(cx, cy, 1.5).fill({ color: 0xaa44ff, alpha: 0.06 });
  }
}

/** Sel: Aon glow traces, cracked tiles, ancient patterns */
function selDetail(g: Graphics, x: number, y: number, seed: number, t: WorldTheme): void {
  const r = sr(seed + 99);
  if (r < 0.2) {
    // Faded Aon trace (glowing line segment)
    const cx = x + (sr(seed + 10) - 0.5) * 14;
    const cy = y + (sr(seed + 11) - 0.5) * 6;
    const angle = sr(seed + 12) * Math.PI;
    const len = 4 + sr(seed + 13) * 4;
    g.moveTo(cx - Math.cos(angle) * len, cy - Math.sin(angle) * len * 0.5)
      .lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len * 0.5)
      .stroke({ color: 0xddcc44, width: 0.6, alpha: 0.15 });
  } else if (r < 0.35) {
    // Cracked tile pattern
    const cx = x + (sr(seed + 20) - 0.5) * 18;
    const cy = y + (sr(seed + 21) - 0.5) * 8;
    g.moveTo(cx, cy).lineTo(cx + 4, cy + 2).lineTo(cx + 2, cy + 4)
      .stroke({ color: darken(t.tileBase, 0.25), width: 0.5, alpha: 0.35 });
  } else if (r < 0.45) {
    // Ancient tile border inlay
    const cx = x + (sr(seed + 30) - 0.5) * 12;
    const cy = y + (sr(seed + 31) - 0.5) * 5;
    g.rect(cx - 3, cy - 1.5, 6, 3).stroke({ color: lighten(t.tileBase, 0.15), width: 0.4, alpha: 0.2 });
  }
}

/** Shadesmar: bead textures, cognitive glow, reality distortion */
function shadesmarDetail(g: Graphics, x: number, y: number, seed: number, _t: WorldTheme): void {
  const r = sr(seed + 99);
  if (r < 0.3) {
    // Glass bead scatter
    const count = 2 + Math.floor(sr(seed + 10) * 3);
    for (let i = 0; i < count; i++) {
      const bx = x + (sr(seed + 11 + i * 2) - 0.5) * 20;
      const by = y + (sr(seed + 12 + i * 2) - 0.5) * 9;
      const beadColor = sr(seed + 13 + i) < 0.5 ? 0x4466aa : 0x6644aa;
      g.circle(bx, by, 1 + sr(seed + 14 + i) * 0.8).fill({ color: beadColor, alpha: 0.25 });
    }
  } else if (r < 0.42) {
    // Cognitive glow (soft shimmer)
    const cx = x + (sr(seed + 20) - 0.5) * 14;
    const cy = y + (sr(seed + 21) - 0.5) * 6;
    g.circle(cx, cy, 4 + sr(seed + 22) * 3).fill({ color: 0x4422aa, alpha: 0.06 });
    g.circle(cx, cy, 2).fill({ color: 0x8855ff, alpha: 0.04 });
  } else if (r < 0.5) {
    // Reality distortion line
    const cx = x + (sr(seed + 30) - 0.5) * 16;
    const cy = y + (sr(seed + 31) - 0.5) * 7;
    g.moveTo(cx - 5, cy).quadraticCurveTo(cx, cy - 3, cx + 5, cy)
      .stroke({ color: 0x6644cc, width: 0.5, alpha: 0.2 });
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

      // ── Tile base color with enhanced variation ──
      let color: number;
      const distFromCenter = Math.abs(col - gridWidth / 2) / gridWidth + Math.abs(row - gridHeight / 2) / gridHeight;
      const edgeDarken = distFromCenter * 0.08;

      if (rand < 0.12) {
        color = theme.tileAlt;
      } else if (rand < 0.22) {
        color = darkenColor(theme.tileBase, 0.12 + edgeDarken);
      } else if (rand < 0.30) {
        color = lighten(theme.tileBase, 0.06);
      } else {
        const variation = Math.floor(sr(seed + 7) * 4) * 0x010101;
        color = darkenColor(theme.tileBase + variation, edgeDarken);
      }

      // Edge fade
      const isEdge = col === 0 || row === 0 || col === gridWidth - 1 || row === gridHeight - 1;
      const isNearEdge = col <= 1 || row <= 1 || col >= gridWidth - 2 || row >= gridHeight - 2;
      const alpha = isEdge ? 0.5 : isNearEdge ? 0.75 : 0.95;

      // ── Diamond tile ──
      g.poly([
        { x: x, y: y - 16 },
        { x: x + 32, y: y },
        { x: x, y: y + 16 },
        { x: x - 32, y: y },
      ]).fill({ color, alpha });

      // ── Subtle grid border ──
      g.poly([
        { x: x, y: y - 16 },
        { x: x + 32, y: y },
        { x: x, y: y + 16 },
        { x: x - 32, y: y },
      ]).stroke({ color: theme.tileBorder, width: 0.3, alpha: 0.35 });

      // ── Inner highlight (top-left edge for 3D depth) ──
      if (rand > 0.4 && !isEdge) {
        g.moveTo(x - 28, y).lineTo(x, y - 14)
          .stroke({ color: lighten(theme.tileBorder, 0.15), width: 0.3, alpha: 0.15 });
      }

      // ── Inner shadow (bottom-right edge for 3D depth) ──
      if (rand > 0.5 && !isEdge) {
        g.moveTo(x + 28, y).lineTo(x, y + 14)
          .stroke({ color: darken(theme.tileBorder, 0.2), width: 0.3, alpha: 0.12 });
      }

      // ── World-specific terrain details ──
      if (detailFn && !isEdge && rand > 0.3) {
        detailFn(g, x, y, seed, theme);
      }

      // ── Generic details (pebbles, dust) for tiles without world detail ──
      if (rand > 0.82 && rand < 0.9 && !isEdge) {
        const cx = x + (sr(seed + 3) - 0.5) * 20;
        const cy = y + (sr(seed + 5) - 0.5) * 10;
        g.circle(cx, cy, 1 + sr(seed + 6) * 0.5).fill({ color: theme.tileBorder, alpha: 0.25 });
      }
    }
  }

  return g;
}
