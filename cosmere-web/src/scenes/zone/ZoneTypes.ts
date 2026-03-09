// ─── Zone Scene Types & Helpers ──────────────────────────────────
// Extracted from ZoneScene.ts for modularity.

import { Container, Graphics, Text } from 'pixi.js';
import type { Enemy, EnemySpawn, GridPosition } from '../../data/types';
import type { BossState } from '../../game/BossMechanics';
import type { EnemyAffixState } from '../../game/EliteAffixes';
import type { EnemyAnimState } from '../../rendering/EnemyAnimations';

// ─── Isometric Helpers ──────────────────────────────────────────

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

export function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

// ─── Runtime Interfaces ─────────────────────────────────────────

export interface EnemyInstance {
  data: Enemy;
  spawn: EnemySpawn;
  hp: number;
  maxHP: number;
  position: { x: number; y: number };
  gridPos: GridPosition;
  sprite: Container;
  hpBar: Graphics;
  nameText: Text;
  bossState?: BossState;
  isDead: boolean;
  attackCooldown: number;
  state: 'idle' | 'chasing' | 'attacking' | 'dead';
  respawnTimer: number;
  animTimer: number;
  affixState?: EnemyAffixState;
  affixLabel?: Text;
  enemyAnim?: EnemyAnimState;
  bossAuraGfx?: Graphics;
  statusGfx?: Graphics;
  /** Ticker-based hit tint timer — counts down to 0 then resets tint */
  hitTintTimer?: number;
}

export interface NPCInstance {
  id: string;
  position: { x: number; y: number };
  sprite: Container;
  nameText: Text;
  isShopkeeper: boolean;
}

export interface LootInstance {
  id: string;
  position: { x: number; y: number };
  sprite: Container;
  collected: boolean;
  isHidden: boolean;
}

export interface Particle {
  sprite: Graphics;
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  size: number;
}

// ─── World Theme Definitions ────────────────────────────────────

// Re-export WorldTheme from the canonical definition (includes enhanced visual properties)
export type { WorldTheme } from '../WorldThemes';
export { WORLD_THEMES } from '../WorldThemes';
