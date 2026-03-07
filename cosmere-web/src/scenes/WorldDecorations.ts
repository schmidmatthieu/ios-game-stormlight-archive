// ─── World-specific Decoration Factories ────────────────────────
// Enhanced decorations with rich visual detail for each world

import { Graphics } from 'pixi.js';
import { seededRandom } from './IsoUtils';
import { lighten, darken } from '../utils/ColorUtils';

export function createDecoration(type: number, pos: { x: number; y: number }, seed: number, worldID: string): Graphics | null {
  const g = new Graphics();

  switch (worldID) {
    case 'scadrial': return createScadrialDeco(g, type, pos, seed);
    case 'roshar':   return createRosharDeco(g, type, pos, seed);
    case 'nalthis':  return createNalthisDeco(g, type, pos, seed);
    case 'taldain':  return createTaldainDeco(g, type, pos, seed);
    case 'shadesmar': return createShadesmarDeco(g, type, pos, seed);
    case 'sel':      return createSelDeco(g, type, pos, seed);
    case 'komashi':  return createKomashiDeco(g, type, pos, seed);
    default:         return createGenericDeco(g, type, pos, seed);
  }
}

// ── Helper ──────────────────────────────────────────────────────

const sr = seededRandom;

function shadow(g: Graphics, x: number, y: number, rx: number, ry: number): void {
  g.ellipse(x, y + 2, rx, ry).fill({ color: 0x000000, alpha: 0.15 });
}

// ── Scadrial: ash, metal, industrial ruins ──────────────────────

function createScadrialDeco(g: Graphics, type: number, pos: { x: number; y: number }, seed: number): Graphics | null {
  const x = pos.x, y = pos.y;
  switch (type) {
    case 0: // Ash pile with layers
      shadow(g, x, y, 10, 4);
      g.ellipse(x, y - 1, 9 + sr(seed + 1) * 5, 4).fill({ color: 0x3a3430, alpha: 0.6 });
      g.ellipse(x + 2, y - 2, 5, 2.5).fill({ color: 0x4a4440, alpha: 0.4 });
      g.ellipse(x - 3, y - 1, 3, 1.5).fill({ color: 0x555048, alpha: 0.3 });
      break;
    case 1: { // Dead tree with detail
      shadow(g, x, y, 8, 3);
      const trunk = 0x3a2a1a;
      g.rect(x - 2, y - 24, 4, 24).fill({ color: trunk, alpha: 0.8 });
      g.moveTo(x, y - 20).lineTo(x - 10, y - 30).stroke({ color: trunk, width: 1.8, alpha: 0.7 });
      g.moveTo(x, y - 16).lineTo(x + 8, y - 26).stroke({ color: trunk, width: 1.5, alpha: 0.7 });
      g.moveTo(x, y - 12).lineTo(x - 6, y - 18).stroke({ color: trunk, width: 1.2, alpha: 0.5 });
      // Bark texture
      g.moveTo(x - 1, y - 6).lineTo(x + 1, y - 10).stroke({ color: 0x2a1a0a, width: 0.5, alpha: 0.4 });
      g.moveTo(x + 0.5, y - 14).lineTo(x - 0.5, y - 18).stroke({ color: 0x2a1a0a, width: 0.5, alpha: 0.3 });
      break;
    }
    case 2: // Metal shard with gleam
      shadow(g, x, y, 5, 2);
      g.poly([
        { x: x, y: y - 14 }, { x: x + 5, y: y - 3 },
        { x: x + 2, y: y }, { x: x - 3, y: y }, { x: x - 4, y: y - 5 },
      ]).fill({ color: 0x667788, alpha: 0.65 });
      // Metallic highlight edge
      g.moveTo(x, y - 14).lineTo(x + 3, y - 3).stroke({ color: 0xaabbcc, width: 0.6, alpha: 0.4 });
      g.poly([
        { x: x, y: y - 14 }, { x: x + 1, y: y - 4 }, { x: x - 1, y: y - 3 },
      ]).fill({ color: 0x99aacc, alpha: 0.25 });
      break;
    case 3: // Ruined wall with moss & cracks
      shadow(g, x, y, 12, 3);
      g.rect(x - 11, y - 16, 22, 16).fill({ color: 0x3a3030, alpha: 0.7 });
      g.rect(x - 9, y - 20, 7, 5).fill({ color: 0x3a3030, alpha: 0.55 });
      g.rect(x + 2, y - 18, 5, 3).fill({ color: 0x3a3030, alpha: 0.45 });
      // Cracks
      g.moveTo(x - 4, y - 14).lineTo(x - 2, y - 6).lineTo(x + 1, y - 2)
        .stroke({ color: 0x222018, width: 0.6, alpha: 0.4 });
      // Ash stain on wall
      g.rect(x - 8, y - 3, 16, 3).fill({ color: 0x444038, alpha: 0.3 });
      break;
    case 4: // Barrel with metal bands
      shadow(g, x, y, 7, 3);
      g.ellipse(x, y - 1, 6, 3.5).fill({ color: 0x443322, alpha: 0.85 });
      g.rect(x - 6, y - 13, 12, 12).fill({ color: 0x553322, alpha: 0.85 });
      g.ellipse(x, y - 13, 6, 3.5).fill({ color: 0x664433, alpha: 0.85 });
      // Metal bands
      g.rect(x - 6, y - 5, 12, 1.2).fill({ color: 0x777766, alpha: 0.6 });
      g.rect(x - 6, y - 10, 12, 1.2).fill({ color: 0x777766, alpha: 0.6 });
      break;
    case 5: { // Lantern post with glow
      shadow(g, x, y, 4, 2);
      g.rect(x - 1.5, y - 22, 3, 22).fill({ color: 0x444444, alpha: 0.75 });
      g.rect(x - 4, y - 24, 8, 4).fill({ color: 0x555555, alpha: 0.75 });
      // Lantern glass
      g.rect(x - 3, y - 26, 6, 5).fill({ color: 0x332211, alpha: 0.6 });
      g.rect(x - 2, y - 25, 4, 3).fill({ color: 0xffaa33, alpha: 0.5 });
      // Glow halo
      g.circle(x, y - 24, 8).fill({ color: 0xffaa33, alpha: 0.08 });
      g.circle(x, y - 24, 14).fill({ color: 0xff8811, alpha: 0.03 });
      break;
    }
    case 6: // Crate stack with markings
      shadow(g, x, y, 8, 3);
      g.rect(x - 8, y - 9, 16, 9).fill({ color: 0x554422, alpha: 0.85 });
      g.rect(x - 6, y - 16, 12, 7).fill({ color: 0x665533, alpha: 0.85 });
      // Lid lines
      g.rect(x - 8, y - 5, 16, 0.8).fill({ color: 0x443311, alpha: 0.5 });
      // Merchant symbol
      g.circle(x, y - 5, 2).stroke({ color: 0x776655, width: 0.5, alpha: 0.4 });
      break;
    case 7: { // Broken cart with detail
      shadow(g, x, y, 14, 3);
      // Frame
      g.rect(x - 13, y - 7, 26, 7).fill({ color: 0x443322, alpha: 0.7 });
      // Wheels
      g.circle(x - 11, y, 4.5).stroke({ color: 0x553322, width: 2, alpha: 0.65 });
      g.circle(x + 11, y, 4.5).stroke({ color: 0x553322, width: 2, alpha: 0.65 });
      // Axle
      g.rect(x - 11, y - 1, 22, 1.5).fill({ color: 0x443322, alpha: 0.5 });
      // Broken handle
      g.moveTo(x - 13, y - 5).lineTo(x - 20, y - 3).stroke({ color: 0x443322, width: 2, alpha: 0.5 });
      break;
    }
    default: return null;
  }
  return g;
}

// ── Roshar: storm-worn rock, crem, sprens ───────────────────────

function createRosharDeco(g: Graphics, type: number, pos: { x: number; y: number }, seed: number): Graphics | null {
  const x = pos.x, y = pos.y;
  switch (type) {
    case 0: { // Rock formation with strata lines
      shadow(g, x, y, 11, 4);
      g.poly([
        { x: x - 9, y: y }, { x: x - 6, y: y - 18 },
        { x: x + 2, y: y - 22 }, { x: x + 9, y: y - 12 }, { x: x + 7, y: y },
      ]).fill({ color: 0x556677, alpha: 0.7 });
      // Strata lines
      g.moveTo(x - 7, y - 6).lineTo(x + 6, y - 4).stroke({ color: 0x667788, width: 0.5, alpha: 0.4 });
      g.moveTo(x - 5, y - 12).lineTo(x + 5, y - 10).stroke({ color: 0x667788, width: 0.5, alpha: 0.35 });
      // Crem deposit
      g.ellipse(x + 2, y - 1, 4, 2).fill({ color: 0x44403a, alpha: 0.3 });
      break;
    }
    case 1: // Cremaling shelter with spren
      shadow(g, x, y, 5, 2);
      g.rect(x - 3, y - 30, 6, 30).fill({ color: 0x445566, alpha: 0.8 });
      g.rect(x - 5, y - 32, 10, 3).fill({ color: 0x556677, alpha: 0.7 });
      // Spren glow at top
      g.circle(x, y - 33, 4).fill({ color: 0x66aaff, alpha: 0.45 });
      g.circle(x, y - 33, 8).fill({ color: 0x66aaff, alpha: 0.08 });
      g.circle(x, y - 33, 12).fill({ color: 0x88ccff, alpha: 0.03 });
      break;
    case 2: // Rockbud (Rosharan plant that retracts)
      shadow(g, x, y, 6, 3);
      g.ellipse(x, y - 2, 7, 4).fill({ color: 0x556644, alpha: 0.6 });
      // Unfurled leaves
      g.poly([{ x: x - 5, y: y - 3 }, { x: x - 8, y: y - 10 }, { x: x - 3, y: y - 6 }])
        .fill({ color: 0x668855, alpha: 0.5 });
      g.poly([{ x: x + 5, y: y - 3 }, { x: x + 9, y: y - 8 }, { x: x + 3, y: y - 6 }])
        .fill({ color: 0x668855, alpha: 0.5 });
      g.poly([{ x: x, y: y - 4 }, { x: x + 1, y: y - 12 }, { x: x + 3, y: y - 5 }])
        .fill({ color: 0x77aa66, alpha: 0.45 });
      break;
    case 3: { // Windspren cluster
      for (let i = 0; i < 4; i++) {
        const sx = x + (sr(seed + i * 3) - 0.5) * 14;
        const sy = y - 4 + (sr(seed + i * 3 + 1) - 0.5) * 8;
        const sz = 1.5 + sr(seed + i * 3 + 2) * 1;
        g.circle(sx, sy, sz).fill({ color: 0x66aaff, alpha: 0.45 });
        g.circle(sx, sy, sz * 2.5).fill({ color: 0x88ccff, alpha: 0.08 });
      }
      break;
    }
    case 4: // Vine growth (hanging)
      for (let i = 0; i < 5; i++) {
        const vx = x + (sr(seed + i * 5) - 0.5) * 14;
        const len = 8 + sr(seed + i * 5 + 1) * 12;
        g.moveTo(vx, y).quadraticCurveTo(vx + (sr(seed + i * 5 + 2) - 0.5) * 8, y - len * 0.6, vx + (sr(seed + i * 5 + 3) - 0.5) * 4, y - len)
          .stroke({ color: 0x446644, width: 1 + sr(seed + i * 5 + 4) * 0.5, alpha: 0.5 });
      }
      break;
    case 5: // Stormpost with flag
      shadow(g, x, y, 6, 2);
      g.rect(x - 2, y - 26, 4, 26).fill({ color: 0x556677, alpha: 0.75 });
      g.roundRect(x - 3, y - 28, 6, 3, 1).fill({ color: 0x667788, alpha: 0.75 });
      // Tattered flag
      g.poly([
        { x: x + 2, y: y - 26 }, { x: x + 14, y: y - 24 },
        { x: x + 12, y: y - 20 }, { x: x + 2, y: y - 22 },
      ]).fill({ color: 0x2244aa, alpha: 0.5 });
      g.poly([
        { x: x + 10, y: y - 24 }, { x: x + 14, y: y - 23 },
        { x: x + 13, y: y - 21 }, { x: x + 11, y: y - 21 },
      ]).fill({ color: 0x2244aa, alpha: 0.3 }); // frayed edge
      break;
    case 6: // Chull shell fragment
      shadow(g, x, y, 8, 3);
      g.ellipse(x, y - 3, 9, 5).fill({ color: 0x667766, alpha: 0.6 });
      g.ellipse(x, y - 5, 7, 3.5).fill({ color: 0x778877, alpha: 0.45 });
      // Shell ridges
      g.ellipse(x, y - 4, 5, 2.5).stroke({ color: 0x889988, width: 0.5, alpha: 0.3 });
      g.ellipse(x, y - 4, 3, 1.5).stroke({ color: 0x889988, width: 0.5, alpha: 0.25 });
      break;
    default:
      shadow(g, x, y, 7, 3);
      g.ellipse(x, y - 2, 7 + sr(seed) * 4, 4).fill({ color: 0x445566, alpha: 0.55 });
      break;
  }
  return g;
}

// ── Nalthis: color, life, gardens ───────────────────────────────

function createNalthisDeco(g: Graphics, type: number, pos: { x: number; y: number }, seed: number): Graphics | null {
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

function createTaldainDeco(g: Graphics, type: number, pos: { x: number; y: number }, seed: number): Graphics | null {
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

// ── Shadesmar: cognitive realm, beads, flames ───────────────────

function createShadesmarDeco(g: Graphics, type: number, pos: { x: number; y: number }, seed: number): Graphics | null {
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

function createSelDeco(g: Graphics, type: number, pos: { x: number; y: number }, seed: number): Graphics | null {
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

function createKomashiDeco(g: Graphics, type: number, pos: { x: number; y: number }, seed: number): Graphics | null {
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

// ── Generic fallback ────────────────────────────────────────────

function createGenericDeco(g: Graphics, type: number, pos: { x: number; y: number }, seed: number): Graphics | null {
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
