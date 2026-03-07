// ─── Isometric Coordinate Utilities ─────────────────────────────

export const TILE_W = 64;
export const TILE_H = 32;

export function isoToScreen(col: number, row: number): { x: number; y: number } {
  return {
    x: (col - row) * (TILE_W / 2),
    y: (col + row) * (TILE_H / 2),
  };
}

export function screenToIso(sx: number, sy: number): { col: number; row: number } {
  return {
    col: sx / TILE_W + sy / TILE_H,
    row: sy / TILE_H - sx / TILE_W,
  };
}

/** Deterministic pseudo-random for decoration placement */
export function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}
