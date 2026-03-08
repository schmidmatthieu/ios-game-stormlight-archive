// ─── Shadesmar, Sel & Komashi Decoration Factories ───────────────
// Shadesmar: cognitive realm, beads, flames
// Sel: ancient, Aonic, stone
// Komashi: ink, paper, nightmare

import { Graphics } from 'pixi.js';
import { seededRandom } from '../IsoUtils';
import { lighten } from '../../utils/ColorUtils';

const sr = seededRandom;

function shadow(g: Graphics, x: number, y: number, rx: number, ry: number): void {
  g.ellipse(x + 1, y + 3, rx * 1.15, ry * 1.1).fill({ color: 0x000000, alpha: 0.06 });
  g.ellipse(x, y + 2, rx, ry).fill({ color: 0x000000, alpha: 0.15 });
}

// ── Shadesmar: cognitive realm, beads, flames ───────────────────

export function createShadesmarDeco(g: Graphics, type: number, pos: { x: number; y: number }, seed: number): Graphics | null {
  const x = pos.x, y = pos.y;
  switch (type) {
    case 0: { // Bead pile (souls of objects)
      shadow(g, x, y, 8, 3);
      for (let i = 0; i < 7; i++) {
        const bx = x + (sr(seed + i * 2) - 0.5) * 12;
        const by = y - 1 + (sr(seed + i * 2 + 1) - 0.5) * 5;
        const bc = sr(seed + i * 3) < 0.3 ? 0x8877cc : sr(seed + i * 3) < 0.6 ? 0x6699cc : 0xaa88dd;
        const sz = 1.5 + sr(seed + i) * 1.2;
        g.circle(bx, by, sz).fill({ color: bc, alpha: 0.5 });
        g.circle(bx - 0.3, by - 0.3, sz * 0.4).fill({ color: lighten(bc, 0.4), alpha: 0.3 }); // highlight
      }
      break;
    }
    case 1: // Flamespren pillar
      shadow(g, x, y, 4, 2);
      g.circle(x, y - 10, 4).fill({ color: 0xff6633, alpha: 0.45 });
      g.circle(x, y - 10, 7).fill({ color: 0xff4422, alpha: 0.1 });
      g.circle(x, y - 10, 11).fill({ color: 0xff2200, alpha: 0.04 });
      // Flame tongues
      g.poly([
        { x: x - 3, y: y - 10 }, { x: x - 1, y: y - 20 }, { x: x + 1, y: y - 10 },
      ]).fill({ color: 0xff8844, alpha: 0.3 });
      g.poly([
        { x: x + 1, y: y - 10 }, { x: x + 2, y: y - 16 }, { x: x + 4, y: y - 10 },
      ]).fill({ color: 0xffaa66, alpha: 0.2 });
      break;
    case 2: // Glass tree (crystalline)
      shadow(g, x, y, 6, 2);
      g.rect(x - 1.5, y - 22, 3, 22).fill({ color: 0x6655aa, alpha: 0.5 });
      // Crystal branches
      g.poly([
        { x: x - 9, y: y - 18 }, { x: x, y: y - 30 }, { x: x + 9, y: y - 18 },
      ]).fill({ color: 0x8877cc, alpha: 0.25 });
      g.poly([
        { x: x - 7, y: y - 22 }, { x: x, y: y - 32 }, { x: x + 7, y: y - 22 },
      ]).fill({ color: 0xaa99dd, alpha: 0.18 });
      // Sparkle at top
      g.circle(x, y - 31, 2).fill({ color: 0xddccff, alpha: 0.35 });
      g.circle(x, y - 31, 5).fill({ color: 0xccbbff, alpha: 0.06 });
      break;
    case 3: // Shard pillar (reality column)
      shadow(g, x, y, 5, 2);
      g.rect(x - 4, y - 28, 8, 28).fill({ color: 0x333366, alpha: 0.55 });
      g.rect(x - 3, y - 28, 6, 28).fill({ color: 0x444488, alpha: 0.3 });
      // Glow veins
      g.moveTo(x - 2, y).lineTo(x + 1, y - 14).lineTo(x - 1, y - 28)
        .stroke({ color: 0x8866ff, width: 0.5, alpha: 0.3 });
      g.rect(x - 5, y - 30, 10, 3).fill({ color: 0x555588, alpha: 0.5 });
      break;
    case 4: // Cognitive rift (glowing crack)
      g.moveTo(x - 8, y).quadraticCurveTo(x, y - 4, x + 8, y)
        .stroke({ color: 0x6644cc, width: 1.5, alpha: 0.35 });
      g.moveTo(x - 6, y).quadraticCurveTo(x, y - 3, x + 6, y)
        .stroke({ color: 0x8866ff, width: 0.5, alpha: 0.2 });
      g.ellipse(x, y - 2, 8, 4).fill({ color: 0x6644cc, alpha: 0.04 });
      break;
    default:
      g.circle(x, y - 3, 3 + sr(seed) * 2).fill({ color: 0x7766bb, alpha: 0.3 });
      break;
  }
  return g;
}

// ── Sel: ancient, Aonic, stone ──────────────────────────────────

export function createSelDeco(g: Graphics, type: number, pos: { x: number; y: number }, seed: number): Graphics | null {
  const x = pos.x, y = pos.y;
  switch (type) {
    case 0: { // Aon glyph on ground (glowing)
      const radius = 6 + sr(seed + 1) * 3;
      g.circle(x, y - 2, radius).stroke({ color: 0xddaa44, width: 1, alpha: 0.25 });
      // Aon cross pattern
      g.moveTo(x - radius * 0.7, y - 2).lineTo(x + radius * 0.7, y - 2)
        .stroke({ color: 0xddaa44, width: 0.8, alpha: 0.2 });
      g.moveTo(x, y - 2 - radius * 0.7).lineTo(x, y - 2 + radius * 0.7)
        .stroke({ color: 0xddaa44, width: 0.8, alpha: 0.2 });
      // Center dot
      g.circle(x, y - 2, 1.5).fill({ color: 0xffcc44, alpha: 0.35 });
      // Subtle glow
      g.circle(x, y - 2, radius + 3).fill({ color: 0xddaa44, alpha: 0.03 });
      break;
    }
    case 1: // Stone column with Aon carving
      shadow(g, x, y, 5, 2);
      g.rect(x - 4, y - 24, 8, 24).fill({ color: 0x888877, alpha: 0.7 });
      g.rect(x - 5, y - 26, 10, 3).fill({ color: 0x999988, alpha: 0.7 });
      g.rect(x - 5, y - 1, 10, 2).fill({ color: 0x777766, alpha: 0.7 });
      // Carved Aon (simple circle + lines)
      g.circle(x, y - 14, 3).stroke({ color: 0xddaa44, width: 0.6, alpha: 0.3 });
      g.moveTo(x - 2, y - 14).lineTo(x + 2, y - 14).stroke({ color: 0xddaa44, width: 0.4, alpha: 0.25 });
      break;
    case 2: // Shrine with Dor glow
      shadow(g, x, y, 8, 3);
      g.rect(x - 8, y - 5, 16, 5).fill({ color: 0x888877, alpha: 0.7 });
      g.poly([
        { x: x - 6, y: y - 5 }, { x: x, y: y - 16 }, { x: x + 6, y: y - 5 },
      ]).fill({ color: 0x999988, alpha: 0.6 });
      g.circle(x, y - 10, 2.5).fill({ color: 0xffcc44, alpha: 0.5 });
      g.circle(x, y - 10, 6).fill({ color: 0xddaa33, alpha: 0.06 });
      break;
    case 3: // Mossy ancient tile slab
      shadow(g, x, y, 10, 4);
      g.poly([
        { x: x, y: y - 5 }, { x: x + 12, y: y + 1 },
        { x: x, y: y + 7 }, { x: x - 12, y: y + 1 },
      ]).fill({ color: 0x777766, alpha: 0.5 });
      // Moss patches
      g.ellipse(x - 4, y + 1, 3, 1.5).fill({ color: 0x556644, alpha: 0.35 });
      g.ellipse(x + 5, y + 2, 2, 1).fill({ color: 0x667755, alpha: 0.3 });
      // Crack
      g.moveTo(x - 3, y - 2).lineTo(x + 4, y + 3).stroke({ color: 0x555544, width: 0.5, alpha: 0.3 });
      break;
    case 4: // Elantris ruin fragment
      shadow(g, x, y, 9, 3);
      g.rect(x - 8, y - 12, 6, 12).fill({ color: 0x888877, alpha: 0.55 });
      g.rect(x + 2, y - 8, 5, 8).fill({ color: 0x888877, alpha: 0.5 });
      // Damaged top
      g.poly([
        { x: x - 8, y: y - 12 }, { x: x - 6, y: y - 16 }, { x: x - 2, y: y - 14 }, { x: x - 2, y: y - 12 },
      ]).fill({ color: 0x999988, alpha: 0.45 });
      // Faint Aon glow on surface
      g.circle(x - 5, y - 7, 2).fill({ color: 0xddaa44, alpha: 0.1 });
      break;
    default:
      shadow(g, x, y, 5, 2);
      g.ellipse(x, y - 1, 5, 3).fill({ color: 0x667755, alpha: 0.4 });
      break;
  }
  return g;
}

// ── Komashi: ink, paper, nightmare ──────────────────────────────

export function createKomashiDeco(g: Graphics, type: number, pos: { x: number; y: number }, seed: number): Graphics | null {
  const x = pos.x, y = pos.y;
  switch (type) {
    case 0: // Ink blot with splatter
      g.ellipse(x, y, 7 + sr(seed) * 5, 3 + sr(seed + 1) * 2).fill({ color: 0x111122, alpha: 0.45 });
      // Splatter drops
      for (let i = 0; i < 4; i++) {
        const sx = x + (sr(seed + i * 3 + 10) - 0.5) * 16;
        const sy = y + (sr(seed + i * 3 + 11) - 0.5) * 8;
        g.circle(sx, sy, 1 + sr(seed + i * 3 + 12) * 1).fill({ color: 0x111122, alpha: 0.3 });
      }
      break;
    case 1: { // Paper lantern with warm glow
      shadow(g, x, y, 4, 2);
      g.rect(x - 1, y - 18, 2, 16).fill({ color: 0x554422, alpha: 0.65 });
      // Lantern body
      g.ellipse(x, y - 20, 5, 6).fill({ color: 0xee8844, alpha: 0.45 });
      g.ellipse(x, y - 20, 3, 4).fill({ color: 0xffcc88, alpha: 0.3 });
      // Warm glow
      g.circle(x, y - 20, 10).fill({ color: 0xffaa44, alpha: 0.06 });
      g.circle(x, y - 20, 16).fill({ color: 0xff8822, alpha: 0.02 });
      break;
    }
    case 2: // Stone stack (cairn for meditation)
      shadow(g, x, y, 5, 2.5);
      g.ellipse(x, y - 1, 6, 3).fill({ color: 0x555555, alpha: 0.6 });
      g.ellipse(x, y - 4, 5, 2.5).fill({ color: 0x666666, alpha: 0.6 });
      g.ellipse(x, y - 7, 4, 2).fill({ color: 0x777777, alpha: 0.6 });
      g.ellipse(x, y - 9.5, 2.5, 1.5).fill({ color: 0x888888, alpha: 0.6 });
      g.circle(x, y - 11.5, 1.5).fill({ color: 0x999999, alpha: 0.6 });
      // Balance shimmer
      g.circle(x, y - 7, 7).fill({ color: 0xffffff, alpha: 0.02 });
      break;
    case 3: // Nightmare residue (dark stain with glow)
      g.ellipse(x, y, 8 + sr(seed) * 4, 4 + sr(seed + 1) * 2).fill({ color: 0x110011, alpha: 0.35 });
      g.ellipse(x, y - 1, 5, 2.5).fill({ color: 0x220033, alpha: 0.25 });
      // Eerie glow
      g.circle(x, y, 10).fill({ color: 0x660088, alpha: 0.04 });
      g.circle(x, y, 5).fill({ color: 0xaa44ff, alpha: 0.03 });
      break;
    case 4: { // Brush and ink pot
      shadow(g, x, y, 5, 2);
      // Ink pot
      g.ellipse(x - 3, y - 1, 3, 2).fill({ color: 0x222222, alpha: 0.7 });
      g.rect(x - 6, y - 5, 6, 4).fill({ color: 0x333333, alpha: 0.7 });
      g.ellipse(x - 3, y - 5, 3, 2).fill({ color: 0x111122, alpha: 0.6 });
      // Brush (leaning)
      g.moveTo(x + 2, y).lineTo(x + 8, y - 16).stroke({ color: 0x554422, width: 1.5, alpha: 0.65 });
      // Brush tip
      g.poly([{ x: x + 7, y: y - 16 }, { x: x + 9, y: y - 16 }, { x: x + 8.5, y: y - 20 }])
        .fill({ color: 0x222222, alpha: 0.5 });
      break;
    }
    case 5: // Torii gate (small shrine entrance)
      shadow(g, x, y, 10, 3);
      g.rect(x - 10, y - 22, 3, 22).fill({ color: 0x882222, alpha: 0.55 });
      g.rect(x + 7, y - 22, 3, 22).fill({ color: 0x882222, alpha: 0.55 });
      g.rect(x - 12, y - 24, 24, 3).fill({ color: 0x992222, alpha: 0.55 });
      g.rect(x - 11, y - 20, 22, 2).fill({ color: 0x882222, alpha: 0.45 });
      break;
    default:
      g.rect(x - 3, y - 5, 6, 5).fill({ color: 0x332233, alpha: 0.3 });
      break;
  }
  return g;
}
