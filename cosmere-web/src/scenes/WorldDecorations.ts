// ─── World-specific Decoration Factories ────────────────────────

import { Graphics } from 'pixi.js';
import { seededRandom } from './IsoUtils';

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

function createScadrialDeco(g: Graphics, type: number, pos: { x: number; y: number }, seed: number): Graphics | null {
  switch (type) {
    case 0:
      g.ellipse(pos.x, pos.y, 8 + seededRandom(seed + 1) * 6, 4).fill({ color: 0x444038, alpha: 0.6 });
      g.ellipse(pos.x + 3, pos.y - 1, 4, 2.5).fill({ color: 0x555048, alpha: 0.4 });
      break;
    case 1:
      g.rect(pos.x - 1.5, pos.y - 22, 3, 22).fill({ color: 0x3a2a1a, alpha: 0.8 });
      g.moveTo(pos.x, pos.y - 18).lineTo(pos.x - 8, pos.y - 26).stroke({ color: 0x3a2a1a, width: 1.5, alpha: 0.7 });
      g.moveTo(pos.x, pos.y - 14).lineTo(pos.x + 6, pos.y - 22).stroke({ color: 0x3a2a1a, width: 1.5, alpha: 0.7 });
      g.moveTo(pos.x, pos.y - 10).lineTo(pos.x - 5, pos.y - 16).stroke({ color: 0x3a2a1a, width: 1, alpha: 0.5 });
      break;
    case 2:
      g.poly([
        { x: pos.x, y: pos.y - 12 }, { x: pos.x + 4, y: pos.y - 2 },
        { x: pos.x + 2, y: pos.y }, { x: pos.x - 2, y: pos.y }, { x: pos.x - 3, y: pos.y - 4 },
      ]).fill({ color: 0x667788, alpha: 0.6 });
      g.poly([
        { x: pos.x, y: pos.y - 12 }, { x: pos.x + 1, y: pos.y - 3 }, { x: pos.x - 1, y: pos.y - 2 },
      ]).fill({ color: 0x8899aa, alpha: 0.3 });
      break;
    case 3:
      g.rect(pos.x - 10, pos.y - 14, 20, 14).fill({ color: 0x3a3030, alpha: 0.7 });
      g.rect(pos.x - 8, pos.y - 18, 6, 4).fill({ color: 0x3a3030, alpha: 0.5 });
      g.rect(pos.x + 2, pos.y - 16, 4, 2).fill({ color: 0x3a3030, alpha: 0.4 });
      break;
    case 4:
      g.ellipse(pos.x, pos.y - 3, 6, 4).fill({ color: 0x443322, alpha: 0.8 });
      g.rect(pos.x - 6, pos.y - 12, 12, 9).fill({ color: 0x553322, alpha: 0.8 });
      g.ellipse(pos.x, pos.y - 12, 6, 4).fill({ color: 0x664433, alpha: 0.8 });
      g.rect(pos.x - 6, pos.y - 7, 12, 1).fill({ color: 0x443322, alpha: 0.5 });
      break;
    case 5:
      g.rect(pos.x - 1, pos.y - 20, 2, 20).fill({ color: 0x444444, alpha: 0.7 });
      g.rect(pos.x - 3, pos.y - 22, 6, 4).fill({ color: 0x555555, alpha: 0.7 });
      g.circle(pos.x, pos.y - 22, 3).fill({ color: 0xffaa33, alpha: 0.4 });
      g.circle(pos.x, pos.y - 22, 6).fill({ color: 0xffaa33, alpha: 0.08 });
      break;
    case 6:
      g.rect(pos.x - 7, pos.y - 8, 14, 8).fill({ color: 0x554422, alpha: 0.8 });
      g.rect(pos.x - 5, pos.y - 14, 10, 6).fill({ color: 0x665533, alpha: 0.8 });
      g.rect(pos.x - 7, pos.y - 4, 14, 0.8).fill({ color: 0x443311, alpha: 0.5 });
      break;
    case 7:
      g.rect(pos.x - 12, pos.y - 6, 24, 6).fill({ color: 0x443322, alpha: 0.7 });
      g.circle(pos.x - 10, pos.y, 4).stroke({ color: 0x553322, width: 1.5, alpha: 0.6 });
      g.circle(pos.x + 10, pos.y, 4).stroke({ color: 0x553322, width: 1.5, alpha: 0.6 });
      g.rect(pos.x - 4, pos.y - 10, 2, 6).fill({ color: 0x443322, alpha: 0.6 });
      break;
    default: return null;
  }
  return g;
}

function createRosharDeco(g: Graphics, type: number, pos: { x: number; y: number }, seed: number): Graphics | null {
  switch (type) {
    case 0:
      g.poly([
        { x: pos.x - 8, y: pos.y }, { x: pos.x - 5, y: pos.y - 16 },
        { x: pos.x + 2, y: pos.y - 20 }, { x: pos.x + 8, y: pos.y - 10 }, { x: pos.x + 6, y: pos.y },
      ]).fill({ color: 0x556677, alpha: 0.7 });
      g.ellipse(pos.x, pos.y, 10, 4).fill({ color: 0x445566, alpha: 0.3 });
      break;
    case 1:
      g.rect(pos.x - 2, pos.y - 28, 4, 28).fill({ color: 0x445566, alpha: 0.8 });
      g.circle(pos.x, pos.y - 30, 4).fill({ color: 0x66aaff, alpha: 0.5 });
      g.circle(pos.x, pos.y - 30, 8).fill({ color: 0x66aaff, alpha: 0.08 });
      break;
    case 2:
      g.ellipse(pos.x, pos.y - 4, 8, 5).fill({ color: 0x667755, alpha: 0.6 });
      g.ellipse(pos.x, pos.y - 6, 6, 3).fill({ color: 0x778866, alpha: 0.4 });
      break;
    case 3:
      for (let i = 0; i < 3; i++) {
        const sx = pos.x + (seededRandom(seed + i * 3) - 0.5) * 10;
        const sy = pos.y - 2 + (seededRandom(seed + i * 3 + 1) - 0.5) * 6;
        g.circle(sx, sy, 2).fill({ color: 0x66aaff, alpha: 0.5 });
        g.circle(sx, sy, 4).fill({ color: 0x88ccff, alpha: 0.1 });
      }
      break;
    case 4:
      for (let i = 0; i < 4; i++) {
        const vx = pos.x + (seededRandom(seed + i * 5) - 0.5) * 12;
        g.moveTo(vx, pos.y).lineTo(vx + (seededRandom(seed + i * 5 + 2) - 0.5) * 6, pos.y - 8 - seededRandom(seed + i * 5 + 1) * 10)
          .stroke({ color: 0x446644, width: 1.2, alpha: 0.5 });
      }
      break;
    case 5:
      g.rect(pos.x - 10, pos.y - 16, 3, 16).fill({ color: 0x556677, alpha: 0.7 });
      g.rect(pos.x + 7, pos.y - 16, 3, 16).fill({ color: 0x556677, alpha: 0.7 });
      g.roundRect(pos.x - 11, pos.y - 18, 22, 4, 2).fill({ color: 0x667788, alpha: 0.7 });
      break;
    default:
      g.ellipse(pos.x, pos.y - 3, 6 + seededRandom(seed) * 4, 4).fill({ color: 0x445566, alpha: 0.6 });
      break;
  }
  return g;
}

function createNalthisDeco(g: Graphics, type: number, pos: { x: number; y: number }, seed: number): Graphics | null {
  switch (type) {
    case 0: {
      const petalColor = [0xff4466, 0x44aaff, 0xffaa22, 0xaa44ff, 0x44ff66][Math.floor(seededRandom(seed + 1) * 5)];
      g.circle(pos.x, pos.y - 6, 4).fill({ color: petalColor, alpha: 0.6 });
      g.circle(pos.x - 3, pos.y - 4, 3).fill({ color: petalColor, alpha: 0.4 });
      g.circle(pos.x + 3, pos.y - 4, 3).fill({ color: petalColor, alpha: 0.4 });
      g.rect(pos.x - 0.5, pos.y - 4, 1, 4).fill({ color: 0x336622, alpha: 0.6 });
      break;
    }
    case 1:
      g.circle(pos.x, pos.y - 6, 7).fill({ color: 0x336633, alpha: 0.6 });
      g.circle(pos.x - 4, pos.y - 4, 5).fill({ color: 0x448844, alpha: 0.5 });
      g.circle(pos.x + 3, pos.y - 8, 5).fill({ color: 0x44aa44, alpha: 0.4 });
      break;
    case 2:
      g.rect(pos.x - 4, pos.y - 18, 8, 18).fill({ color: 0x888888, alpha: 0.6 });
      g.circle(pos.x, pos.y - 22, 4).fill({ color: 0x999999, alpha: 0.6 });
      g.rect(pos.x - 6, pos.y - 2, 12, 3).fill({ color: 0x777777, alpha: 0.7 });
      break;
    case 3:
      g.ellipse(pos.x, pos.y, 10, 5).fill({ color: 0x556677, alpha: 0.6 });
      g.ellipse(pos.x, pos.y - 1, 8, 4).fill({ color: 0x4488bb, alpha: 0.4 });
      g.rect(pos.x - 1, pos.y - 10, 2, 10).fill({ color: 0x667788, alpha: 0.7 });
      g.circle(pos.x, pos.y - 10, 3).fill({ color: 0x66aacc, alpha: 0.4 });
      break;
    default:
      g.circle(pos.x, pos.y - 3, 4 + seededRandom(seed) * 3).fill({ color: 0x447744, alpha: 0.4 });
      break;
  }
  return g;
}

function createTaldainDeco(g: Graphics, type: number, pos: { x: number; y: number }, seed: number): Graphics | null {
  switch (type) {
    case 0:
      g.ellipse(pos.x, pos.y - 2, 14 + seededRandom(seed + 1) * 8, 5).fill({ color: 0x554422, alpha: 0.4 });
      g.ellipse(pos.x + 2, pos.y - 4, 8, 3).fill({ color: 0x665533, alpha: 0.3 });
      break;
    case 1:
      g.rect(pos.x - 2, pos.y - 16, 4, 16).fill({ color: 0x448833, alpha: 0.7 });
      g.rect(pos.x - 8, pos.y - 12, 6, 3).fill({ color: 0x448833, alpha: 0.6 });
      g.rect(pos.x - 8, pos.y - 16, 3, 7).fill({ color: 0x448833, alpha: 0.6 });
      g.rect(pos.x + 4, pos.y - 10, 5, 3).fill({ color: 0x448833, alpha: 0.6 });
      g.rect(pos.x + 6, pos.y - 14, 3, 7).fill({ color: 0x448833, alpha: 0.6 });
      break;
    case 2:
      g.poly([
        { x: pos.x - 6, y: pos.y }, { x: pos.x - 4, y: pos.y - 10 },
        { x: pos.x + 3, y: pos.y - 8 }, { x: pos.x + 6, y: pos.y },
      ]).fill({ color: 0x887755, alpha: 0.6 });
      break;
    default:
      g.ellipse(pos.x, pos.y - 1, 6, 3).fill({ color: 0x554422, alpha: 0.3 });
      break;
  }
  return g;
}

function createShadesmarDeco(g: Graphics, type: number, pos: { x: number; y: number }, seed: number): Graphics | null {
  switch (type) {
    case 0:
      for (let i = 0; i < 5; i++) {
        const bx = pos.x + (seededRandom(seed + i * 2) - 0.5) * 10;
        const by = pos.y - 1 + (seededRandom(seed + i * 2 + 1) - 0.5) * 5;
        g.circle(bx, by, 1.5 + seededRandom(seed + i) * 1).fill({ color: 0x8877cc, alpha: 0.5 });
      }
      break;
    case 1:
      g.circle(pos.x, pos.y - 8, 3).fill({ color: 0xff6633, alpha: 0.5 });
      g.circle(pos.x, pos.y - 8, 6).fill({ color: 0xff4422, alpha: 0.1 });
      g.poly([
        { x: pos.x - 2, y: pos.y - 8 }, { x: pos.x, y: pos.y - 16 }, { x: pos.x + 2, y: pos.y - 8 },
      ]).fill({ color: 0xff8844, alpha: 0.3 });
      break;
    case 2:
      g.rect(pos.x - 1, pos.y - 20, 2, 20).fill({ color: 0x6655aa, alpha: 0.5 });
      g.poly([
        { x: pos.x - 8, y: pos.y - 16 }, { x: pos.x, y: pos.y - 28 }, { x: pos.x + 8, y: pos.y - 16 },
      ]).fill({ color: 0x8877cc, alpha: 0.3 });
      g.poly([
        { x: pos.x - 6, y: pos.y - 20 }, { x: pos.x, y: pos.y - 30 }, { x: pos.x + 6, y: pos.y - 20 },
      ]).fill({ color: 0xaa99dd, alpha: 0.2 });
      break;
    default:
      g.circle(pos.x, pos.y - 3, 3).fill({ color: 0x7766bb, alpha: 0.3 });
      break;
  }
  return g;
}

function createSelDeco(g: Graphics, type: number, pos: { x: number; y: number }, _seed: number): Graphics | null {
  switch (type) {
    case 0:
      g.circle(pos.x, pos.y - 2, 6).stroke({ color: 0xddaa44, width: 1, alpha: 0.3 });
      g.moveTo(pos.x - 3, pos.y - 4).lineTo(pos.x + 3, pos.y).stroke({ color: 0xddaa44, width: 0.8, alpha: 0.25 });
      g.moveTo(pos.x - 3, pos.y).lineTo(pos.x + 3, pos.y - 4).stroke({ color: 0xddaa44, width: 0.8, alpha: 0.25 });
      break;
    case 1:
      g.rect(pos.x - 4, pos.y - 22, 8, 22).fill({ color: 0x888877, alpha: 0.7 });
      g.rect(pos.x - 5, pos.y - 24, 10, 3).fill({ color: 0x999988, alpha: 0.7 });
      g.rect(pos.x - 5, pos.y - 1, 10, 2).fill({ color: 0x777766, alpha: 0.7 });
      break;
    case 2:
      g.rect(pos.x - 8, pos.y - 4, 16, 4).fill({ color: 0x888877, alpha: 0.7 });
      g.poly([
        { x: pos.x - 6, y: pos.y - 4 }, { x: pos.x, y: pos.y - 14 }, { x: pos.x + 6, y: pos.y - 4 },
      ]).fill({ color: 0x999988, alpha: 0.6 });
      g.circle(pos.x, pos.y - 8, 2).fill({ color: 0xddaa44, alpha: 0.5 });
      break;
    default:
      g.ellipse(pos.x, pos.y - 1, 5, 3).fill({ color: 0x667755, alpha: 0.4 });
      break;
  }
  return g;
}

function createKomashiDeco(g: Graphics, type: number, pos: { x: number; y: number }, seed: number): Graphics | null {
  switch (type) {
    case 0:
      g.ellipse(pos.x, pos.y, 6 + seededRandom(seed) * 5, 3 + seededRandom(seed + 1) * 3).fill({ color: 0x111122, alpha: 0.5 });
      break;
    case 1:
      g.rect(pos.x - 1, pos.y - 16, 2, 14).fill({ color: 0x554422, alpha: 0.6 });
      g.ellipse(pos.x, pos.y - 18, 4, 5).fill({ color: 0xee8844, alpha: 0.5 });
      g.ellipse(pos.x, pos.y - 18, 6, 7).fill({ color: 0xffaa44, alpha: 0.1 });
      break;
    case 2:
      g.ellipse(pos.x, pos.y - 1, 5, 3).fill({ color: 0x555555, alpha: 0.6 });
      g.ellipse(pos.x, pos.y - 4, 4, 2.5).fill({ color: 0x666666, alpha: 0.6 });
      g.ellipse(pos.x, pos.y - 7, 3, 2).fill({ color: 0x777777, alpha: 0.6 });
      g.circle(pos.x, pos.y - 9.5, 1.5).fill({ color: 0x888888, alpha: 0.6 });
      break;
    default:
      g.rect(pos.x - 3, pos.y - 5, 6, 5).fill({ color: 0x332233, alpha: 0.3 });
      break;
  }
  return g;
}

function createGenericDeco(g: Graphics, type: number, pos: { x: number; y: number }, seed: number): Graphics | null {
  switch (type) {
    case 0:
      g.circle(pos.x, pos.y - 4, 5 + seededRandom(seed) * 3).fill({ color: 0x555555, alpha: 0.5 });
      break;
    case 1:
      g.circle(pos.x, pos.y - 5, 6).fill({ color: 0x335533, alpha: 0.5 });
      g.circle(pos.x + 3, pos.y - 7, 5).fill({ color: 0x336633, alpha: 0.4 });
      break;
    case 2:
      for (let i = 0; i < 4; i++) {
        const gx = pos.x + (seededRandom(seed + i) - 0.5) * 8;
        g.moveTo(gx, pos.y).lineTo(gx + (seededRandom(seed + i + 10) - 0.5) * 3, pos.y - 5 - seededRandom(seed + i + 5) * 4)
          .stroke({ color: 0x557744, width: 1, alpha: 0.5 });
      }
      break;
    default: return null;
  }
  return g;
}
