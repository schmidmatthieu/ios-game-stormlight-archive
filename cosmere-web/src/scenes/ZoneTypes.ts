// ─── Zone Scene Interfaces ──────────────────────────────────────

import type { Container, Graphics, Text } from 'pixi.js';
import type { Enemy, EnemySpawn, GridPosition } from '../data/types';
import type { BossState } from '../game/BossMechanics';

export interface EnemyInstance {
  data: Enemy;
  spawn: EnemySpawn;
  hp: number;
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
