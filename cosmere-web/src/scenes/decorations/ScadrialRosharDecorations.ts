// ─── Scadrial & Roshar Decoration Factories ──────────────────────
// Scadrial: ash, metal, industrial ruins
// Roshar: storm-worn rock, crem, sprens

import { Graphics } from 'pixi.js';
import { seededRandom } from '../IsoUtils';

const sr = seededRandom;

function shadow(g: Graphics, x: number, y: number, rx: number, ry: number): void {
  g.ellipse(x, y + 2, rx, ry).fill({ color: 0x000000, alpha: 0.15 });
}

// ── Scadrial: ash, metal, industrial ruins ──────────────────────

export function createScadrialDeco(g: Graphics, type: number, pos: { x: number; y: number }, seed: number): Graphics | null {
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

export function createRosharDeco(g: Graphics, type: number, pos: { x: number; y: number }, seed: number): Graphics | null {
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
