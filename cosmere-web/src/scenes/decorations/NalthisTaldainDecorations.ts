// ─── Nalthis, Taldain & Generic Decoration Factories ─────────────
// Nalthis: color, life, gardens
// Taldain: desert, sand, sun
// Generic: fallback decorations

import { Graphics } from 'pixi.js';
import { seededRandom } from '../IsoUtils';
import { lighten, darken } from '../../utils/ColorUtils';

const sr = seededRandom;

function shadow(g: Graphics, x: number, y: number, rx: number, ry: number): void {
  g.ellipse(x + 1, y + 3, rx * 1.15, ry * 1.1).fill({ color: 0x000000, alpha: 0.06 });
  g.ellipse(x, y + 2, rx, ry).fill({ color: 0x000000, alpha: 0.15 });
}

// ── Nalthis: color, life, gardens ───────────────────────────────

export function createNalthisDeco(g: Graphics, type: number, pos: { x: number; y: number }, seed: number): Graphics | null {
  const x = pos.x, y = pos.y;
  const petalColors = [0xff4466, 0x44aaff, 0xffaa22, 0xaa44ff, 0x44ff66];

  switch (type) {
    case 0: { // Colorful flower with petals
      shadow(g, x, y, 5, 2);
      const pc = petalColors[Math.floor(sr(seed + 1) * 5)];
      g.rect(x - 0.5, y - 8, 1, 8).fill({ color: 0x336622, alpha: 0.65 });
      // Petals (5-pointed)
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
        const px = x + Math.cos(angle) * 4;
        const py = y - 10 + Math.sin(angle) * 3;
        g.circle(px, py, 2.5).fill({ color: pc, alpha: 0.55 });
      }
      g.circle(x, y - 10, 1.5).fill({ color: 0xffdd44, alpha: 0.7 }); // Center
      // Color aura
      g.circle(x, y - 10, 8).fill({ color: pc, alpha: 0.05 });
      break;
    }
    case 1: // Garden bush with berries
      shadow(g, x, y, 9, 3);
      g.circle(x, y - 7, 8).fill({ color: 0x336633, alpha: 0.55 });
      g.circle(x - 5, y - 5, 6).fill({ color: 0x448844, alpha: 0.5 });
      g.circle(x + 4, y - 9, 6).fill({ color: 0x44aa44, alpha: 0.4 });
      // Berries
      const bc = petalColors[Math.floor(sr(seed + 5) * 5)];
      g.circle(x + 3, y - 5, 1.5).fill({ color: bc, alpha: 0.6 });
      g.circle(x - 2, y - 9, 1.2).fill({ color: bc, alpha: 0.55 });
      g.circle(x + 5, y - 8, 1).fill({ color: bc, alpha: 0.5 });
      break;
    case 2: // Statue with colored dye stains
      shadow(g, x, y, 6, 2.5);
      g.rect(x - 4, y - 20, 8, 20).fill({ color: 0x888888, alpha: 0.6 });
      g.circle(x, y - 24, 4.5).fill({ color: 0x999999, alpha: 0.6 });
      g.rect(x - 7, y - 2, 14, 3).fill({ color: 0x777777, alpha: 0.7 });
      // Color stains from BioChroma
      const stainColor = petalColors[Math.floor(sr(seed + 3) * 5)];
      g.ellipse(x - 2, y - 12, 3, 5).fill({ color: stainColor, alpha: 0.15 });
      g.ellipse(x + 2, y - 8, 2, 3).fill({ color: lighten(stainColor, 0.2), alpha: 0.12 });
      break;
    case 3: // Fountain with colored water
      shadow(g, x, y, 11, 4);
      g.ellipse(x, y, 11, 5.5).fill({ color: 0x556677, alpha: 0.6 });
      g.ellipse(x, y - 1, 9, 4.5).fill({ color: 0x4488bb, alpha: 0.4 });
      g.rect(x - 1.5, y - 12, 3, 12).fill({ color: 0x667788, alpha: 0.7 });
      // Water spray
      g.circle(x, y - 12, 3.5).fill({ color: 0x66aacc, alpha: 0.35 });
      g.circle(x, y - 12, 6).fill({ color: 0x88ccdd, alpha: 0.08 });
      // Color shimmer in water
      const wc = petalColors[Math.floor(sr(seed + 7) * 5)];
      g.ellipse(x + 2, y - 1, 3, 1.5).fill({ color: wc, alpha: 0.12 });
      break;
    case 4: // Dyed fabric banner
      shadow(g, x, y, 3, 1.5);
      g.rect(x - 1, y - 22, 2, 22).fill({ color: 0x554433, alpha: 0.7 });
      const bannerColor = petalColors[Math.floor(sr(seed + 2) * 5)];
      g.poly([
        { x: x + 1, y: y - 20 }, { x: x + 10, y: y - 18 },
        { x: x + 9, y: y - 8 }, { x: x + 1, y: y - 10 },
      ]).fill({ color: bannerColor, alpha: 0.5 });
      // Fabric wave
      g.moveTo(x + 10, y - 18).quadraticCurveTo(x + 12, y - 13, x + 9, y - 8)
        .stroke({ color: darken(bannerColor, 0.2), width: 0.5, alpha: 0.4 });
      break;
    default:
      shadow(g, x, y, 5, 2);
      g.circle(x, y - 4, 5 + sr(seed) * 3).fill({ color: 0x447744, alpha: 0.4 });
      break;
  }
  return g;
}

// ── Taldain: desert, sand, sun ──────────────────────────────────

export function createTaldainDeco(g: Graphics, type: number, pos: { x: number; y: number }, seed: number): Graphics | null {
  const x = pos.x, y = pos.y;
  switch (type) {
    case 0: { // Sand dune with ripples
      shadow(g, x, y, 14, 4);
      const w = 14 + sr(seed + 1) * 8;
      g.ellipse(x, y - 2, w, 5).fill({ color: 0x554422, alpha: 0.4 });
      g.ellipse(x + 2, y - 4, w * 0.6, 3).fill({ color: 0x665533, alpha: 0.3 });
      // Wind ripple lines
      for (let i = 0; i < 3; i++) {
        const ry = y - 1 + i * 2;
        g.moveTo(x - w * 0.7, ry).quadraticCurveTo(x, ry - 1, x + w * 0.7, ry)
          .stroke({ color: 0x776644, width: 0.3, alpha: 0.25 });
      }
      break;
    }
    case 1: { // Cactus (Dayside desert plant)
      shadow(g, x, y, 4, 2);
      g.rect(x - 2.5, y - 18, 5, 18).fill({ color: 0x448833, alpha: 0.7 });
      // Arms
      g.rect(x - 9, y - 14, 7, 3).fill({ color: 0x448833, alpha: 0.6 });
      g.rect(x - 9, y - 18, 3, 7).fill({ color: 0x448833, alpha: 0.6 });
      g.rect(x + 4, y - 12, 6, 3).fill({ color: 0x448833, alpha: 0.6 });
      g.rect(x + 7, y - 16, 3, 7).fill({ color: 0x448833, alpha: 0.6 });
      // Spines
      g.moveTo(x - 2, y - 6).lineTo(x - 5, y - 7).stroke({ color: 0x88aa44, width: 0.5, alpha: 0.4 });
      g.moveTo(x + 2, y - 10).lineTo(x + 5, y - 11).stroke({ color: 0x88aa44, width: 0.5, alpha: 0.4 });
      // Highlight
      g.rect(x - 0.5, y - 16, 1, 14).fill({ color: 0x66aa44, alpha: 0.2 });
      break;
    }
    case 2: // Sun-bleached rock with sand
      shadow(g, x, y, 8, 3);
      g.poly([
        { x: x - 7, y: y }, { x: x - 5, y: y - 12 },
        { x: x + 4, y: y - 10 }, { x: x + 7, y: y },
      ]).fill({ color: 0x887755, alpha: 0.6 });
      // Sun bleaching on top
      g.poly([
        { x: x - 5, y: y - 12 }, { x: x + 4, y: y - 10 },
        { x: x + 2, y: y - 8 }, { x: x - 3, y: y - 9 },
      ]).fill({ color: 0xaa9977, alpha: 0.3 });
      // Sand drift at base
      g.ellipse(x + 5, y - 1, 4, 2).fill({ color: 0x665533, alpha: 0.25 });
      break;
    case 3: // Oasis pool
      shadow(g, x, y, 10, 4);
      g.ellipse(x, y, 10, 5).fill({ color: 0x665544, alpha: 0.5 }); // rim
      g.ellipse(x, y - 1, 8, 4).fill({ color: 0x226688, alpha: 0.4 }); // water
      g.ellipse(x - 2, y - 2, 3, 1.5).fill({ color: 0x3388aa, alpha: 0.2 }); // highlight
      // Small palm frond
      g.rect(x + 7, y - 14, 2, 14).fill({ color: 0x553311, alpha: 0.5 });
      g.poly([{ x: x + 8, y: y - 14 }, { x: x + 16, y: y - 12 }, { x: x + 8, y: y - 10 }])
        .fill({ color: 0x448833, alpha: 0.4 });
      break;
    case 4: // White sand deposit (glowing)
      shadow(g, x, y, 6, 3);
      g.ellipse(x, y - 1, 7, 3.5).fill({ color: 0xccbb88, alpha: 0.4 });
      g.ellipse(x, y - 2, 5, 2.5).fill({ color: 0xddddaa, alpha: 0.35 });
      // Sand glow (charged by sunlight)
      g.circle(x, y - 1, 8).fill({ color: 0xffffcc, alpha: 0.05 });
      break;
    default:
      g.ellipse(x, y - 1, 6, 3).fill({ color: 0x554422, alpha: 0.3 });
      break;
  }
  return g;
}

// ── Generic fallback ────────────────────────────────────────────

export function createGenericDeco(g: Graphics, type: number, pos: { x: number; y: number }, seed: number): Graphics | null {
  const x = pos.x, y = pos.y;
  switch (type) {
    case 0:
      shadow(g, x, y, 6, 2.5);
      g.circle(x, y - 5, 5 + sr(seed) * 3).fill({ color: 0x555555, alpha: 0.5 });
      break;
    case 1:
      shadow(g, x, y, 7, 3);
      g.circle(x, y - 6, 7).fill({ color: 0x335533, alpha: 0.5 });
      g.circle(x + 3, y - 8, 5).fill({ color: 0x336633, alpha: 0.4 });
      break;
    case 2:
      for (let i = 0; i < 4; i++) {
        const gx = x + (sr(seed + i) - 0.5) * 8;
        g.moveTo(gx, y).lineTo(gx + (sr(seed + i + 10) - 0.5) * 3, y - 5 - sr(seed + i + 5) * 4)
          .stroke({ color: 0x557744, width: 1, alpha: 0.5 });
      }
      break;
    default: return null;
  }
  return g;
}
