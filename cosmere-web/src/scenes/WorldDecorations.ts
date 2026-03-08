// ─── World-specific Decoration Factories ────────────────────────
// Re-exports from per-world decoration modules.
// This file preserves the original public API so existing imports continue to work.

import { Graphics } from 'pixi.js';
import { createScadrialDeco, createRosharDeco } from './decorations/ScadrialRosharDecorations';
import { createNalthisDeco, createTaldainDeco, createGenericDeco } from './decorations/NalthisTaldainDecorations';
import { createShadesmarDeco, createSelDeco, createKomashiDeco } from './decorations/ShadesmarSelKomashiDecorations';

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
