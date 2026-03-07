import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { GameScene } from '../game/SceneRouter';
import { SceneRouter } from '../game/SceneRouter';
import { GameManager } from '../game/GameManager';
import { gameData } from '../data/DataLoader';
import { VirtualJoystick } from '../ui/VirtualJoystick';
import { ActionButtons } from '../ui/ActionButtons';
import { HUD } from '../ui/HUD';
import type { Zone, Enemy, EnemySpawn, GridPosition, ZoneConnection, ChampionClass } from '../data/types';
import type { ActionMode } from '../ui/ActionButtons';

// ─── Isometric Helpers ─────────────────────────────────────────
const TILE_W = 64;
const TILE_H = 32;

function isoToScreen(col: number, row: number): { x: number; y: number } {
  return {
    x: (col - row) * (TILE_W / 2),
    y: (col + row) * (TILE_H / 2),
  };
}

function screenToIso(sx: number, sy: number): { col: number; row: number } {
  return {
    col: sx / TILE_W + sy / TILE_H,
    row: sy / TILE_H - sx / TILE_W,
  };
}

// Seeded random for deterministic decoration placement
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

// ─── Interfaces ────────────────────────────────────────────────
interface EnemyInstance {
  data: Enemy;
  spawn: EnemySpawn;
  hp: number;
  position: { x: number; y: number };
  gridPos: GridPosition;
  sprite: Container;
  hpBar: Graphics;
  nameText: Text;
  isDead: boolean;
  attackCooldown: number;
  state: 'idle' | 'chasing' | 'attacking' | 'dead';
  respawnTimer: number;
  animTimer: number;
}

interface NPCInstance {
  id: string;
  position: { x: number; y: number };
  sprite: Container;
  nameText: Text;
  isShopkeeper: boolean;
}

interface LootInstance {
  id: string;
  position: { x: number; y: number };
  sprite: Container;
  collected: boolean;
  isHidden: boolean;
}

interface Particle {
  sprite: Graphics;
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  size: number;
}

// ─── World Theme Definitions ───────────────────────────────────
interface WorldTheme {
  tileBase: number;
  tileAlt: number;
  tileBorder: number;
  edgeGlow: number;
  ambientParticleColor: number;
  decorations: string[];
  fogColor: number;
  fogAlpha: number;
}

const WORLD_THEMES: Record<string, WorldTheme> = {
  scadrial: {
    tileBase: 0x302822, tileAlt: 0x3a322a, tileBorder: 0x44382e,
    edgeGlow: 0x553322, ambientParticleColor: 0x888077,
    decorations: ['ashPile', 'deadTree', 'metalShard', 'ruinedWall', 'barrel'],
    fogColor: 0x332211, fogAlpha: 0.15,
  },
  roshar: {
    tileBase: 0x1e2830, tileAlt: 0x263340, tileBorder: 0x344455,
    edgeGlow: 0x2244aa, ambientParticleColor: 0x66aaff,
    decorations: ['rockFormation', 'cremalingShelter', 'chullPath', 'stormPost', 'vine'],
    fogColor: 0x112244, fogAlpha: 0.12,
  },
  taldain: {
    tileBase: 0x3a3420, tileAlt: 0x44402a, tileBorder: 0x554a33,
    edgeGlow: 0xaa8833, ambientParticleColor: 0xddcc88,
    decorations: ['sandDune', 'cactus', 'oasis', 'sandRock'],
    fogColor: 0x332200, fogAlpha: 0.08,
  },
  nalthis: {
    tileBase: 0x1a2820, tileAlt: 0x223a28, tileBorder: 0x2e4433,
    edgeGlow: 0x22aa44, ambientParticleColor: 0x88ff99,
    decorations: ['coloredFlower', 'gardenBush', 'statue', 'fountain'],
    fogColor: 0x002211, fogAlpha: 0.08,
  },
  shadesmar: {
    tileBase: 0x0e0e20, tileAlt: 0x161630, tileBorder: 0x222244,
    edgeGlow: 0x4422aa, ambientParticleColor: 0xaa88ff,
    decorations: ['beadPile', 'flamespren', 'glassTree', 'shardPillar'],
    fogColor: 0x110033, fogAlpha: 0.2,
  },
  komashi: {
    tileBase: 0x281828, tileAlt: 0x322032, tileBorder: 0x442e44,
    edgeGlow: 0x8822aa, ambientParticleColor: 0xcc66ff,
    decorations: ['inkBlot', 'paperLantern', 'nightmareResidue', 'brush'],
    fogColor: 0x220033, fogAlpha: 0.15,
  },
  sel: {
    tileBase: 0x282820, tileAlt: 0x303020, tileBorder: 0x3a3a2a,
    edgeGlow: 0xaaaa33, ambientParticleColor: 0xdddd88,
    decorations: ['aonGlyph', 'stoneColumn', 'mossTile', 'shrine'],
    fogColor: 0x222200, fogAlpha: 0.1,
  },
};

// ─── Zone Scene ────────────────────────────────────────────────
export class ZoneScene extends Container implements GameScene {
  private app: Application;
  private router: SceneRouter;

  // World
  private worldContainer = new Container();
  private zone!: Zone;
  private theme!: WorldTheme;

  // Player
  private playerContainer!: Container;
  private playerSprite!: Graphics;
  private playerShadow!: Graphics;
  private playerGridPos: GridPosition = { col: 5, row: 5 };
  private playerScreenPos = { x: 0, y: 0 };
  private playerSpeed = 120;
  private playerAnimTimer = 0;
  private playerFacing: 'left' | 'right' = 'right';

  // Enemies
  private enemies: EnemyInstance[] = [];

  // NPCs
  private npcs: NPCInstance[] = [];

  // Loot
  private lootPoints: LootInstance[] = [];

  // Particles
  private particles: Particle[] = [];
  private particleContainer = new Container();

  // Decorations
  private decoContainer = new Container();

  // Fog overlay
  private fogOverlay!: Graphics;

  // UI
  private joystick!: VirtualJoystick;
  private actionButtons!: ActionButtons;
  private hud!: HUD;
  private uiContainer = new Container();

  // Camera
  private cameraTarget = { x: 0, y: 0 };

  // Combat
  private attackCooldown = 0;
  private readonly ATTACK_COOLDOWN = 0.5;

  // Zone transition guard
  private isTransitioning = false;

  // Interaction
  private interactPrompt: Text | null = null;
  private nearbyNPC: NPCInstance | null = null;
  private nearbyExit: ZoneConnection | null = null;
  private nearbyLoot: LootInstance | null = null;

  // Dialogue
  private dialoguePanel: Container | null = null;
  private dialogueTexts: Text[] = [];

  // Pause
  private pauseMenu: Container | null = null;
  private isPaused = false;

  constructor(app: Application, router: SceneRouter) {
    super();
    this.app = app;
    this.router = router;
  }

  onEnter(): void {
    const w = this.app.screen.width;
    const h = this.app.screen.height;
    const champ = GameManager.shared.champion;
    if (!champ) return;

    // Load zone
    const zoneData = gameData.zone(champ.currentZoneID);
    if (!zoneData) {
      const fallback = Array.from(gameData.zones.values()).find(z => z.worldID === champ.currentWorldID);
      if (!fallback) return;
      this.zone = fallback;
    } else {
      this.zone = zoneData;
    }

    this.theme = WORLD_THEMES[this.zone.worldID] ?? WORLD_THEMES.scadrial;

    this.playerGridPos = { ...champ.gridPosition };
    const screenPos = isoToScreen(this.playerGridPos.col, this.playerGridPos.row);
    this.playerScreenPos = { ...screenPos };

    // World container
    this.worldContainer.sortableChildren = true;
    this.addChild(this.worldContainer);

    // Decorations layer (below entities)
    this.worldContainer.addChild(this.decoContainer);

    // Tilemap
    this.renderTilemap();

    // Map edge boundary glow
    this.renderMapEdge();

    // Decorations (environment objects)
    this.spawnDecorations();

    // Loot points
    this.spawnLootPoints();

    // NPCs
    this.spawnNPCs();

    // Player
    this.createPlayer();

    // Enemies
    this.spawnEnemies();

    // Zone exits
    this.renderExits();

    // Particle layer
    this.worldContainer.addChild(this.particleContainer);

    // Fog overlay on world
    this.fogOverlay = new Graphics();
    this.updateFog();

    // UI layer
    this.addChild(this.uiContainer);

    // HUD
    this.hud = new HUD(w, h);
    this.hud.refresh(this.zone.name);
    this.uiContainer.addChild(this.hud);

    // Joystick
    this.joystick = new VirtualJoystick();
    this.joystick.x = 70;
    this.joystick.y = h - 90;
    this.uiContainer.addChild(this.joystick);

    // Action buttons
    this.actionButtons = new ActionButtons();
    this.actionButtons.x = w - 80;
    this.actionButtons.y = h - 100;
    this.actionButtons.onAttack = () => this.handleAttack();
    this.actionButtons.onSkill = (i) => this.handleSkill(i);
    this.actionButtons.onInteract = (mode) => this.handleInteraction(mode);
    this.uiContainer.addChild(this.actionButtons);

    // Pause button (top center)
    this.createPauseButton(w);

    // Center camera immediately
    this.worldContainer.x = w / 2 - this.playerScreenPos.x;
    this.worldContainer.y = h / 2 - this.playerScreenPos.y;
  }

  // ─── Tilemap ─────────────────────────────────────────────────

  private renderTilemap(): void {
    const gw = this.zone.gridWidth;
    const gh = this.zone.gridHeight;
    const t = this.theme;

    // Batch tiles in a single Graphics for performance
    const tileGraphics = new Graphics();
    tileGraphics.zIndex = -1000;

    for (let col = 0; col < gw; col++) {
      for (let row = 0; row < gh; row++) {
        const { x, y } = isoToScreen(col, row);
        const seed = col * 1000 + row;
        const rand = seededRandom(seed);

        // Pick tile color with more interesting variation
        let color: number;
        if (rand < 0.15) {
          // Accent tile
          color = t.tileAlt;
        } else if (rand < 0.25) {
          // Slightly darker
          color = this.darkenColor(t.tileBase, 0.15);
        } else {
          // Normal with subtle variation
          const variation = Math.floor(seededRandom(seed + 7) * 3) * 0x020202;
          color = t.tileBase + variation;
        }

        // Is edge tile?
        const isEdge = col === 0 || row === 0 || col === gw - 1 || row === gh - 1;
        const alpha = isEdge ? 0.6 : 0.95;

        // Diamond
        tileGraphics.poly([
          { x: x, y: y - 16 },
          { x: x + 32, y: y },
          { x: x, y: y + 16 },
          { x: x - 32, y: y },
        ]).fill({ color, alpha });

        // Subtle grid line
        tileGraphics.poly([
          { x: x, y: y - 16 },
          { x: x + 32, y: y },
          { x: x, y: y + 16 },
          { x: x - 32, y: y },
        ]).stroke({ color: t.tileBorder, width: 0.3, alpha: 0.4 });

        // Add subtle texture patterns on some tiles
        if (rand > 0.7 && rand < 0.85) {
          // Small crack/detail
          const cx = x + (seededRandom(seed + 3) - 0.5) * 20;
          const cy = y + (seededRandom(seed + 5) - 0.5) * 10;
          tileGraphics.circle(cx, cy, 1.5).fill({ color: t.tileBorder, alpha: 0.3 });
        }
      }
    }

    this.worldContainer.addChild(tileGraphics);
  }

  private renderMapEdge(): void {
    const gw = this.zone.gridWidth;
    const gh = this.zone.gridHeight;
    const edge = new Graphics();
    edge.zIndex = -999;

    // Draw glowing border around entire map
    const corners = [
      isoToScreen(0, 0),           // top
      isoToScreen(gw - 1, 0),      // right
      isoToScreen(gw - 1, gh - 1), // bottom
      isoToScreen(0, gh - 1),       // left
    ];

    // Outer glow
    edge.poly([
      { x: corners[0].x, y: corners[0].y - 16 },
      { x: corners[1].x + 32, y: corners[1].y },
      { x: corners[2].x, y: corners[2].y + 16 },
      { x: corners[3].x - 32, y: corners[3].y },
    ]).stroke({ color: this.theme.edgeGlow, width: 3, alpha: 0.5 });

    this.worldContainer.addChild(edge);
  }

  // ─── Decorations ─────────────────────────────────────────────

  private spawnDecorations(): void {
    const gw = this.zone.gridWidth;
    const gh = this.zone.gridHeight;
    const density = this.zone.type === 'hub' ? 0.14 : 0.10;

    for (let col = 0; col < gw; col++) {
      for (let row = 0; row < gh; row++) {
        const seed = col * 1337 + row * 7919;
        const rand = seededRandom(seed);
        if (rand > density) continue;

        // Don't place near spawn
        const spawnDist = Math.hypot(col - this.zone.playerSpawnPosition.col, row - this.zone.playerSpawnPosition.row);
        if (spawnDist < 3) continue;

        // Don't place on NPCs or enemies or exits
        const occupiedByNPC = this.zone.npcSpawns.some(n => Math.abs(n.position.col - col) < 2 && Math.abs(n.position.row - row) < 2);
        const occupiedByEnemy = this.zone.enemySpawns.some(e => Math.abs(e.position.col - col) < 2 && Math.abs(e.position.row - row) < 2);
        const occupiedByExit = this.zone.connections.some(c => Math.abs(c.exitPosition.col - col) < 2 && Math.abs(c.exitPosition.row - row) < 2);
        if (occupiedByNPC || occupiedByEnemy || occupiedByExit) continue;

        const pos = isoToScreen(col, row);
        const decoType = Math.floor(seededRandom(seed + 42) * 8);
        const deco = this.createDecoration(decoType, pos, seed);
        if (deco) {
          deco.zIndex = pos.y;
          this.worldContainer.addChild(deco);
        }
      }
    }

    // Spawn buildings in hub zones
    if (this.zone.type === 'hub') {
      this.spawnBuildings();
    }

    // Spawn terrain relief
    this.spawnTerrainRelief();
  }

  private spawnBuildings(): void {
    const gw = this.zone.gridWidth;
    const gh = this.zone.gridHeight;

    // Place 3-5 buildings deterministically
    const buildingCount = 3 + Math.floor(seededRandom(gw * gh) * 3);
    for (let i = 0; i < buildingCount; i++) {
      const seed = i * 3571 + gw * 97;
      const col = 2 + Math.floor(seededRandom(seed) * (gw - 4));
      const row = 2 + Math.floor(seededRandom(seed + 1) * (gh - 4));

      // Don't place on spawn, NPCs, enemies
      const spawnDist = Math.hypot(col - this.zone.playerSpawnPosition.col, row - this.zone.playerSpawnPosition.row);
      if (spawnDist < 4) continue;
      const occupied = this.zone.npcSpawns.some(n => Math.abs(n.position.col - col) < 3 && Math.abs(n.position.row - row) < 3) ||
                       this.zone.enemySpawns.some(e => Math.abs(e.position.col - col) < 3 && Math.abs(e.position.row - row) < 3);
      if (occupied) continue;

      const pos = isoToScreen(col, row);
      const buildingType = Math.floor(seededRandom(seed + 7) * 4);
      const building = this.createBuilding(buildingType, pos, seed);
      building.zIndex = pos.y;
      this.worldContainer.addChild(building);
    }
  }

  private createBuilding(type: number, pos: { x: number; y: number }, seed: number): Graphics {
    const g = new Graphics();
    const worldID = this.zone.worldID;
    const wallColor = worldID === 'scadrial' ? 0x3a3028 : worldID === 'roshar' ? 0x445566 :
                      worldID === 'nalthis' ? 0x446644 : worldID === 'taldain' ? 0x554433 :
                      worldID === 'shadesmar' ? 0x222244 : 0x443344;
    const roofColor = worldID === 'scadrial' ? 0x554433 : worldID === 'roshar' ? 0x556688 :
                      worldID === 'nalthis' ? 0x338844 : worldID === 'taldain' ? 0x887755 :
                      worldID === 'shadesmar' ? 0x443366 : 0x554455;

    switch (type) {
      case 0: // Small house
        // Wall
        g.poly([
          { x: pos.x - 16, y: pos.y }, { x: pos.x, y: pos.y - 8 },
          { x: pos.x + 16, y: pos.y }, { x: pos.x + 16, y: pos.y - 24 },
          { x: pos.x, y: pos.y - 32 }, { x: pos.x - 16, y: pos.y - 24 },
        ]).fill({ color: wallColor, alpha: 0.85 });
        // Front face
        g.poly([
          { x: pos.x - 16, y: pos.y }, { x: pos.x, y: pos.y - 8 },
          { x: pos.x, y: pos.y - 32 }, { x: pos.x - 16, y: pos.y - 24 },
        ]).fill({ color: this.darkenColor(wallColor, 0.15), alpha: 0.85 });
        // Roof
        g.poly([
          { x: pos.x - 18, y: pos.y - 24 }, { x: pos.x, y: pos.y - 38 },
          { x: pos.x + 18, y: pos.y - 24 }, { x: pos.x, y: pos.y - 32 },
        ]).fill({ color: roofColor, alpha: 0.9 });
        // Door
        g.roundRect(pos.x - 10, pos.y - 12, 5, 8, 1).fill({ color: 0x332211, alpha: 0.8 });
        // Window
        g.rect(pos.x + 2, pos.y - 24, 4, 4).fill({ color: 0xeebb44, alpha: 0.4 });
        break;

      case 1: // Tower
        g.rect(pos.x - 8, pos.y - 40, 16, 40).fill({ color: wallColor, alpha: 0.85 });
        g.rect(pos.x - 8, pos.y - 40, 8, 40).fill({ color: this.darkenColor(wallColor, 0.1), alpha: 0.85 });
        // Battlement
        for (let b = 0; b < 4; b++) {
          g.rect(pos.x - 9 + b * 5, pos.y - 46, 4, 6).fill({ color: wallColor, alpha: 0.8 });
        }
        // Window slits
        g.rect(pos.x - 2, pos.y - 30, 2, 5).fill({ color: 0xeebb44, alpha: 0.3 });
        g.rect(pos.x - 2, pos.y - 18, 2, 5).fill({ color: 0xeebb44, alpha: 0.3 });
        break;

      case 2: // Market stall
        // Posts
        g.rect(pos.x - 14, pos.y - 16, 2, 16).fill({ color: 0x553322, alpha: 0.8 });
        g.rect(pos.x + 12, pos.y - 16, 2, 16).fill({ color: 0x553322, alpha: 0.8 });
        // Canopy
        g.poly([
          { x: pos.x - 16, y: pos.y - 16 }, { x: pos.x, y: pos.y - 22 },
          { x: pos.x + 16, y: pos.y - 16 },
        ]).fill({ color: 0xcc7733, alpha: 0.7 });
        // Table
        g.rect(pos.x - 10, pos.y - 6, 20, 4).fill({ color: 0x664422, alpha: 0.8 });
        // Items on table
        g.circle(pos.x - 4, pos.y - 8, 2).fill({ color: 0xee4444, alpha: 0.6 });
        g.circle(pos.x + 2, pos.y - 8, 2).fill({ color: 0x44ee44, alpha: 0.6 });
        g.circle(pos.x + 6, pos.y - 8, 1.5).fill({ color: 0xeeee44, alpha: 0.6 });
        break;

      case 3: // Ruins/broken wall
        g.poly([
          { x: pos.x - 18, y: pos.y }, { x: pos.x - 18, y: pos.y - 20 },
          { x: pos.x - 12, y: pos.y - 26 }, { x: pos.x - 6, y: pos.y - 18 },
          { x: pos.x, y: pos.y - 22 }, { x: pos.x + 6, y: pos.y - 14 },
          { x: pos.x + 10, y: pos.y },
        ]).fill({ color: this.darkenColor(wallColor, 0.2), alpha: 0.7 });
        // Rubble
        g.circle(pos.x + 8, pos.y - 2, 3).fill({ color: this.darkenColor(wallColor, 0.3), alpha: 0.5 });
        g.circle(pos.x + 12, pos.y - 1, 2).fill({ color: this.darkenColor(wallColor, 0.25), alpha: 0.5 });
        break;
    }

    return g;
  }

  private spawnTerrainRelief(): void {
    const gw = this.zone.gridWidth;
    const gh = this.zone.gridHeight;

    // Place elevated terrain patches
    const patchCount = 3 + Math.floor(seededRandom(gw + gh * 13) * 4);
    for (let i = 0; i < patchCount; i++) {
      const seed = i * 4517 + gw * 31;
      const col = 1 + Math.floor(seededRandom(seed) * (gw - 2));
      const row = 1 + Math.floor(seededRandom(seed + 1) * (gh - 2));
      const spawnDist = Math.hypot(col - this.zone.playerSpawnPosition.col, row - this.zone.playerSpawnPosition.row);
      if (spawnDist < 3) continue;

      const pos = isoToScreen(col, row);
      const size = 10 + seededRandom(seed + 2) * 18;
      const height = 3 + seededRandom(seed + 3) * 6;

      const g = new Graphics();
      const t = this.theme;

      // Elevated terrain (darker shade)
      g.ellipse(pos.x, pos.y, size, size * 0.5)
        .fill({ color: this.darkenColor(t.tileBase, 0.25), alpha: 0.5 });
      // Height indicator (shadow beneath)
      g.ellipse(pos.x, pos.y + height, size * 0.9, size * 0.45)
        .fill({ color: 0x000000, alpha: 0.15 });
      // Top surface
      g.ellipse(pos.x, pos.y - height, size * 0.8, size * 0.4)
        .fill({ color: this.lightenColor(t.tileBase, 0.15), alpha: 0.4 });

      g.zIndex = pos.y - 100;
      this.worldContainer.addChild(g);
    }
  }

  private createDecoration(type: number, pos: { x: number; y: number }, seed: number): Graphics | null {
    const g = new Graphics();
    const worldID = this.zone.worldID;

    if (worldID === 'scadrial') {
      switch (type) {
        case 0: // Ash pile
          g.ellipse(pos.x, pos.y, 8 + seededRandom(seed + 1) * 6, 4).fill({ color: 0x444038, alpha: 0.6 });
          g.ellipse(pos.x + 3, pos.y - 1, 4, 2.5).fill({ color: 0x555048, alpha: 0.4 });
          break;
        case 1: // Dead tree
          g.rect(pos.x - 1.5, pos.y - 22, 3, 22).fill({ color: 0x3a2a1a, alpha: 0.8 });
          g.moveTo(pos.x, pos.y - 18).lineTo(pos.x - 8, pos.y - 26).stroke({ color: 0x3a2a1a, width: 1.5, alpha: 0.7 });
          g.moveTo(pos.x, pos.y - 14).lineTo(pos.x + 6, pos.y - 22).stroke({ color: 0x3a2a1a, width: 1.5, alpha: 0.7 });
          g.moveTo(pos.x, pos.y - 10).lineTo(pos.x - 5, pos.y - 16).stroke({ color: 0x3a2a1a, width: 1, alpha: 0.5 });
          break;
        case 2: // Metal shard
          g.poly([
            { x: pos.x, y: pos.y - 12 },
            { x: pos.x + 4, y: pos.y - 2 },
            { x: pos.x + 2, y: pos.y },
            { x: pos.x - 2, y: pos.y },
            { x: pos.x - 3, y: pos.y - 4 },
          ]).fill({ color: 0x667788, alpha: 0.6 });
          g.poly([
            { x: pos.x, y: pos.y - 12 },
            { x: pos.x + 1, y: pos.y - 3 },
            { x: pos.x - 1, y: pos.y - 2 },
          ]).fill({ color: 0x8899aa, alpha: 0.3 }); // Shine
          break;
        case 3: // Ruined wall
          g.rect(pos.x - 10, pos.y - 14, 20, 14).fill({ color: 0x3a3030, alpha: 0.7 });
          g.rect(pos.x - 8, pos.y - 18, 6, 4).fill({ color: 0x3a3030, alpha: 0.5 });
          g.rect(pos.x + 2, pos.y - 16, 4, 2).fill({ color: 0x3a3030, alpha: 0.4 });
          break;
        case 4: // Barrel
          g.ellipse(pos.x, pos.y - 3, 6, 4).fill({ color: 0x443322, alpha: 0.8 });
          g.rect(pos.x - 6, pos.y - 12, 12, 9).fill({ color: 0x553322, alpha: 0.8 });
          g.ellipse(pos.x, pos.y - 12, 6, 4).fill({ color: 0x664433, alpha: 0.8 });
          g.rect(pos.x - 6, pos.y - 7, 12, 1).fill({ color: 0x443322, alpha: 0.5 }); // Ring
          break;
        case 5: // Lantern post
          g.rect(pos.x - 1, pos.y - 20, 2, 20).fill({ color: 0x444444, alpha: 0.7 });
          g.rect(pos.x - 3, pos.y - 22, 6, 4).fill({ color: 0x555555, alpha: 0.7 });
          g.circle(pos.x, pos.y - 22, 3).fill({ color: 0xffaa33, alpha: 0.4 });
          g.circle(pos.x, pos.y - 22, 6).fill({ color: 0xffaa33, alpha: 0.08 }); // Light glow
          break;
        case 6: // Crate stack
          g.rect(pos.x - 7, pos.y - 8, 14, 8).fill({ color: 0x554422, alpha: 0.8 });
          g.rect(pos.x - 5, pos.y - 14, 10, 6).fill({ color: 0x665533, alpha: 0.8 });
          g.rect(pos.x - 7, pos.y - 4, 14, 0.8).fill({ color: 0x443311, alpha: 0.5 });
          break;
        case 7: // Broken cart
          g.rect(pos.x - 12, pos.y - 6, 24, 6).fill({ color: 0x443322, alpha: 0.7 });
          g.circle(pos.x - 10, pos.y, 4).stroke({ color: 0x553322, width: 1.5, alpha: 0.6 });
          g.circle(pos.x + 10, pos.y, 4).stroke({ color: 0x553322, width: 1.5, alpha: 0.6 });
          g.rect(pos.x - 4, pos.y - 10, 2, 6).fill({ color: 0x443322, alpha: 0.6 });
          break;
      }
    } else if (worldID === 'roshar') {
      switch (type) {
        case 0: // Rock formation
          g.poly([
            { x: pos.x - 8, y: pos.y },
            { x: pos.x - 5, y: pos.y - 16 },
            { x: pos.x + 2, y: pos.y - 20 },
            { x: pos.x + 8, y: pos.y - 10 },
            { x: pos.x + 6, y: pos.y },
          ]).fill({ color: 0x556677, alpha: 0.7 });
          // Crem buildup
          g.ellipse(pos.x, pos.y, 10, 4).fill({ color: 0x445566, alpha: 0.3 });
          break;
        case 1: // Storm post
          g.rect(pos.x - 2, pos.y - 28, 4, 28).fill({ color: 0x445566, alpha: 0.8 });
          g.circle(pos.x, pos.y - 30, 4).fill({ color: 0x66aaff, alpha: 0.5 });
          g.circle(pos.x, pos.y - 30, 8).fill({ color: 0x66aaff, alpha: 0.08 });
          break;
        case 2: // Chull shell
          g.ellipse(pos.x, pos.y - 4, 8, 5).fill({ color: 0x667755, alpha: 0.6 });
          g.ellipse(pos.x, pos.y - 6, 6, 3).fill({ color: 0x778866, alpha: 0.4 });
          break;
        case 3: // Stormlight sphere cluster
          for (let i = 0; i < 3; i++) {
            const sx = pos.x + (seededRandom(seed + i * 3) - 0.5) * 10;
            const sy = pos.y - 2 + (seededRandom(seed + i * 3 + 1) - 0.5) * 6;
            g.circle(sx, sy, 2).fill({ color: 0x66aaff, alpha: 0.5 });
            g.circle(sx, sy, 4).fill({ color: 0x88ccff, alpha: 0.1 });
          }
          break;
        case 4: // Vine cluster
          for (let i = 0; i < 4; i++) {
            const vx = pos.x + (seededRandom(seed + i * 5) - 0.5) * 12;
            g.moveTo(vx, pos.y).lineTo(vx + (seededRandom(seed + i * 5 + 2) - 0.5) * 6, pos.y - 8 - seededRandom(seed + i * 5 + 1) * 10)
              .stroke({ color: 0x446644, width: 1.2, alpha: 0.5 });
          }
          break;
        case 5: // Highstorm shelter (stone arch)
          g.rect(pos.x - 10, pos.y - 16, 3, 16).fill({ color: 0x556677, alpha: 0.7 });
          g.rect(pos.x + 7, pos.y - 16, 3, 16).fill({ color: 0x556677, alpha: 0.7 });
          g.roundRect(pos.x - 11, pos.y - 18, 22, 4, 2).fill({ color: 0x667788, alpha: 0.7 });
          break;
        default: // Cremling shelter
          g.ellipse(pos.x, pos.y - 3, 6 + seededRandom(seed) * 4, 4).fill({ color: 0x445566, alpha: 0.6 });
          break;
      }
    } else if (worldID === 'nalthis') {
      switch (type) {
        case 0: // Colored flower
          const petalColor = [0xff4466, 0x44aaff, 0xffaa22, 0xaa44ff, 0x44ff66][Math.floor(seededRandom(seed + 1) * 5)];
          g.circle(pos.x, pos.y - 6, 4).fill({ color: petalColor, alpha: 0.6 });
          g.circle(pos.x - 3, pos.y - 4, 3).fill({ color: petalColor, alpha: 0.4 });
          g.circle(pos.x + 3, pos.y - 4, 3).fill({ color: petalColor, alpha: 0.4 });
          g.rect(pos.x - 0.5, pos.y - 4, 1, 4).fill({ color: 0x336622, alpha: 0.6 });
          break;
        case 1: // Garden bush
          g.circle(pos.x, pos.y - 6, 7).fill({ color: 0x336633, alpha: 0.6 });
          g.circle(pos.x - 4, pos.y - 4, 5).fill({ color: 0x448844, alpha: 0.5 });
          g.circle(pos.x + 3, pos.y - 8, 5).fill({ color: 0x44aa44, alpha: 0.4 });
          break;
        case 2: // Statue
          g.rect(pos.x - 4, pos.y - 18, 8, 18).fill({ color: 0x888888, alpha: 0.6 });
          g.circle(pos.x, pos.y - 22, 4).fill({ color: 0x999999, alpha: 0.6 });
          g.rect(pos.x - 6, pos.y - 2, 12, 3).fill({ color: 0x777777, alpha: 0.7 });
          break;
        case 3: // Fountain
          g.ellipse(pos.x, pos.y, 10, 5).fill({ color: 0x556677, alpha: 0.6 });
          g.ellipse(pos.x, pos.y - 1, 8, 4).fill({ color: 0x4488bb, alpha: 0.4 });
          g.rect(pos.x - 1, pos.y - 10, 2, 10).fill({ color: 0x667788, alpha: 0.7 });
          g.circle(pos.x, pos.y - 10, 3).fill({ color: 0x66aacc, alpha: 0.4 });
          break;
        default:
          g.circle(pos.x, pos.y - 3, 4 + seededRandom(seed) * 3).fill({ color: 0x447744, alpha: 0.4 });
          break;
      }
    } else if (worldID === 'taldain') {
      switch (type) {
        case 0: // Sand dune
          g.ellipse(pos.x, pos.y - 2, 14 + seededRandom(seed + 1) * 8, 5).fill({ color: 0x554422, alpha: 0.4 });
          g.ellipse(pos.x + 2, pos.y - 4, 8, 3).fill({ color: 0x665533, alpha: 0.3 });
          break;
        case 1: // Cactus
          g.rect(pos.x - 2, pos.y - 16, 4, 16).fill({ color: 0x448833, alpha: 0.7 });
          g.rect(pos.x - 8, pos.y - 12, 6, 3).fill({ color: 0x448833, alpha: 0.6 });
          g.rect(pos.x - 8, pos.y - 16, 3, 7).fill({ color: 0x448833, alpha: 0.6 });
          g.rect(pos.x + 4, pos.y - 10, 5, 3).fill({ color: 0x448833, alpha: 0.6 });
          g.rect(pos.x + 6, pos.y - 14, 3, 7).fill({ color: 0x448833, alpha: 0.6 });
          break;
        case 2: // Sand rock
          g.poly([
            { x: pos.x - 6, y: pos.y }, { x: pos.x - 4, y: pos.y - 10 },
            { x: pos.x + 3, y: pos.y - 8 }, { x: pos.x + 6, y: pos.y },
          ]).fill({ color: 0x887755, alpha: 0.6 });
          break;
        default:
          g.ellipse(pos.x, pos.y - 1, 6, 3).fill({ color: 0x554422, alpha: 0.3 });
          break;
      }
    } else if (worldID === 'shadesmar') {
      switch (type) {
        case 0: // Bead pile
          for (let i = 0; i < 5; i++) {
            const bx = pos.x + (seededRandom(seed + i * 2) - 0.5) * 10;
            const by = pos.y - 1 + (seededRandom(seed + i * 2 + 1) - 0.5) * 5;
            g.circle(bx, by, 1.5 + seededRandom(seed + i) * 1).fill({ color: 0x8877cc, alpha: 0.5 });
          }
          break;
        case 1: // Flamespren
          g.circle(pos.x, pos.y - 8, 3).fill({ color: 0xff6633, alpha: 0.5 });
          g.circle(pos.x, pos.y - 8, 6).fill({ color: 0xff4422, alpha: 0.1 });
          g.poly([
            { x: pos.x - 2, y: pos.y - 8 }, { x: pos.x, y: pos.y - 16 }, { x: pos.x + 2, y: pos.y - 8 },
          ]).fill({ color: 0xff8844, alpha: 0.3 });
          break;
        case 2: // Glass tree
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
    } else if (worldID === 'sel') {
      switch (type) {
        case 0: // Aon glyph on ground
          g.circle(pos.x, pos.y - 2, 6).stroke({ color: 0xddaa44, width: 1, alpha: 0.3 });
          g.moveTo(pos.x - 3, pos.y - 4).lineTo(pos.x + 3, pos.y).stroke({ color: 0xddaa44, width: 0.8, alpha: 0.25 });
          g.moveTo(pos.x - 3, pos.y).lineTo(pos.x + 3, pos.y - 4).stroke({ color: 0xddaa44, width: 0.8, alpha: 0.25 });
          break;
        case 1: // Stone column
          g.rect(pos.x - 4, pos.y - 22, 8, 22).fill({ color: 0x888877, alpha: 0.7 });
          g.rect(pos.x - 5, pos.y - 24, 10, 3).fill({ color: 0x999988, alpha: 0.7 });
          g.rect(pos.x - 5, pos.y - 1, 10, 2).fill({ color: 0x777766, alpha: 0.7 });
          break;
        case 2: // Shrine
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
    } else if (worldID === 'komashi') {
      switch (type) {
        case 0: // Ink blot
          g.ellipse(pos.x, pos.y, 6 + seededRandom(seed) * 5, 3 + seededRandom(seed + 1) * 3).fill({ color: 0x111122, alpha: 0.5 });
          break;
        case 1: // Paper lantern
          g.rect(pos.x - 1, pos.y - 16, 2, 14).fill({ color: 0x554422, alpha: 0.6 });
          g.ellipse(pos.x, pos.y - 18, 4, 5).fill({ color: 0xee8844, alpha: 0.5 });
          g.ellipse(pos.x, pos.y - 18, 6, 7).fill({ color: 0xffaa44, alpha: 0.1 });
          break;
        case 2: // Stone cairn
          g.ellipse(pos.x, pos.y - 1, 5, 3).fill({ color: 0x555555, alpha: 0.6 });
          g.ellipse(pos.x, pos.y - 4, 4, 2.5).fill({ color: 0x666666, alpha: 0.6 });
          g.ellipse(pos.x, pos.y - 7, 3, 2).fill({ color: 0x777777, alpha: 0.6 });
          g.circle(pos.x, pos.y - 9.5, 1.5).fill({ color: 0x888888, alpha: 0.6 });
          break;
        default:
          g.rect(pos.x - 3, pos.y - 5, 6, 5).fill({ color: 0x332233, alpha: 0.3 });
          break;
      }
    } else {
      // Generic decoration
      switch (type) {
        case 0: // Rock
          g.circle(pos.x, pos.y - 4, 5 + seededRandom(seed) * 3).fill({ color: 0x555555, alpha: 0.5 });
          break;
        case 1: // Bush
          g.circle(pos.x, pos.y - 5, 6).fill({ color: 0x335533, alpha: 0.5 });
          g.circle(pos.x + 3, pos.y - 7, 5).fill({ color: 0x336633, alpha: 0.4 });
          break;
        case 2: // Grass tuft
          for (let i = 0; i < 4; i++) {
            const gx = pos.x + (seededRandom(seed + i) - 0.5) * 8;
            g.moveTo(gx, pos.y).lineTo(gx + (seededRandom(seed + i + 10) - 0.5) * 3, pos.y - 5 - seededRandom(seed + i + 5) * 4)
              .stroke({ color: 0x557744, width: 1, alpha: 0.5 });
          }
          break;
        default:
          return null;
      }
    }

    return g;
  }

  // ─── Player ──────────────────────────────────────────────────

  private createPlayer(): void {
    this.playerContainer = new Container();
    this.playerContainer.zIndex = 10000;

    // Shadow
    this.playerShadow = new Graphics();
    this.playerShadow.ellipse(0, 2, 12, 5).fill({ color: 0x000000, alpha: 0.3 });
    this.playerContainer.addChild(this.playerShadow);

    // Sprite
    this.playerSprite = new Graphics();
    this.drawPlayer();
    this.playerContainer.addChild(this.playerSprite);

    this.playerContainer.x = this.playerScreenPos.x;
    this.playerContainer.y = this.playerScreenPos.y;
    this.worldContainer.addChild(this.playerContainer);
  }

  private drawPlayer(): void {
    this.playerSprite.clear();
    const champ = GameManager.shared.champion;
    const cls = champ?.championClass ?? 'mistborn';

    const classColors: Record<string, number> = {
      mistborn: 0x3366cc, radiant: 0x3399dd, awakener: 0x9933cc,
      elantrian: 0xdd8833, sandMaster: 0xcc9933, nightmarePainter: 0x663399,
    };
    const capeColors: Record<string, number> = {
      mistborn: 0x222233, radiant: 0x224466, awakener: 0x552288,
      elantrian: 0x885522, sandMaster: 0x665522, nightmarePainter: 0x331155,
    };
    const weaponColors: Record<string, number> = {
      mistborn: 0x8899aa, radiant: 0x88ccff, awakener: 0xcc88ff,
      elantrian: 0xffcc66, sandMaster: 0xddcc88, nightmarePainter: 0x8866cc,
    };

    const bodyColor = classColors[cls];
    const capeColor = capeColors[cls];
    const weaponColor = weaponColors[cls];

    const g = this.playerSprite;

    // Cape (behind body)
    g.poly([
      { x: -7, y: -18 }, { x: -12, y: 4 }, { x: -8, y: 6 },
      { x: 0, y: 4 },
      { x: 8, y: 6 }, { x: 12, y: 4 }, { x: 7, y: -18 },
    ]).fill({ color: capeColor, alpha: 0.85 });
    // Cape detail stripe
    g.poly([
      { x: -5, y: -16 }, { x: -9, y: 4 },
      { x: -6, y: 4 }, { x: -3, y: -16 },
    ]).fill({ color: this.lightenColor(capeColor, 0.3), alpha: 0.3 });

    // Boots
    g.roundRect(-6, -3, 5, 5, 1).fill({ color: 0x3a2a1a, alpha: 0.9 });
    g.roundRect(1, -3, 5, 5, 1).fill({ color: 0x3a2a1a, alpha: 0.9 });
    // Boot highlight
    g.roundRect(-5, -3, 2, 3, 1).fill({ color: 0x4a3a2a, alpha: 0.5 });

    // Legs
    g.rect(-5, -10, 4, 8).fill({ color: 0x333344, alpha: 0.9 });
    g.rect(1, -10, 4, 8).fill({ color: 0x333344, alpha: 0.9 });

    // Belt
    g.rect(-7, -12, 14, 3).fill({ color: 0x554422, alpha: 0.9 });
    // Belt buckle
    g.rect(-1.5, -12, 3, 3).fill({ color: 0xddaa33, alpha: 0.8 });

    // Chest/torso
    g.poly([
      { x: -8, y: -12 }, { x: -9, y: -24 },
      { x: 0, y: -26 },
      { x: 9, y: -24 }, { x: 8, y: -12 },
    ]).fill({ color: bodyColor, alpha: 0.9 });
    // Chest highlight
    g.poly([
      { x: -4, y: -14 }, { x: -5, y: -22 },
      { x: 0, y: -24 }, { x: 3, y: -22 }, { x: 2, y: -14 },
    ]).fill({ color: this.lightenColor(bodyColor, 0.25), alpha: 0.4 });

    // Shoulder pads
    g.ellipse(-10, -23, 5, 3).fill({ color: this.lightenColor(bodyColor, 0.1), alpha: 0.9 });
    g.ellipse(10, -23, 5, 3).fill({ color: this.lightenColor(bodyColor, 0.1), alpha: 0.9 });
    // Shoulder rivets
    g.circle(-10, -23, 1).fill({ color: 0xddaa33, alpha: 0.7 });
    g.circle(10, -23, 1).fill({ color: 0xddaa33, alpha: 0.7 });

    // Arms
    g.rect(-13, -22, 4, 12).fill({ color: bodyColor, alpha: 0.85 });
    g.rect(9, -22, 4, 12).fill({ color: bodyColor, alpha: 0.85 });
    // Gloves
    g.rect(-13, -11, 4, 3).fill({ color: 0x443322, alpha: 0.9 });
    g.rect(9, -11, 4, 3).fill({ color: 0x443322, alpha: 0.9 });

    // Weapon (right hand) - varies by class
    if (cls === 'mistborn') {
      // Obsidian daggers
      g.poly([
        { x: 14, y: -14 }, { x: 15, y: -28 }, { x: 16, y: -14 },
      ]).fill({ color: 0x445566, alpha: 0.8 });
      g.poly([
        { x: 14, y: -14 }, { x: 15, y: -28 }, { x: 16, y: -14 },
      ]).stroke({ color: 0x88aacc, width: 0.5, alpha: 0.5 });
    } else if (cls === 'radiant') {
      // Shardblade (glowing)
      g.poly([
        { x: 14, y: -12 }, { x: 14.5, y: -34 }, { x: 16, y: -34 }, { x: 16.5, y: -12 },
      ]).fill({ color: 0xaaddff, alpha: 0.7 });
      g.poly([
        { x: 14, y: -12 }, { x: 14.5, y: -34 }, { x: 16, y: -34 }, { x: 16.5, y: -12 },
      ]).stroke({ color: 0xcceeFF, width: 0.5, alpha: 0.8 });
      // Blade glow
      g.rect(13, -32, 5, 20).fill({ color: 0x88ccff, alpha: 0.06 });
    } else if (cls === 'awakener') {
      // Staff with colored ribbons
      g.rect(14, -32, 2, 28).fill({ color: 0x664422, alpha: 0.8 });
      g.circle(15, -33, 3).fill({ color: 0xcc66ff, alpha: 0.6 });
    } else if (cls === 'elantrian') {
      // Aon rod
      g.rect(14, -30, 2, 24).fill({ color: 0xddbb66, alpha: 0.8 });
      g.circle(15, -31, 4).fill({ color: 0xffcc44, alpha: 0.4 });
      g.circle(15, -31, 4).stroke({ color: 0xffdd66, width: 1, alpha: 0.6 });
    } else if (cls === 'sandMaster') {
      // Sand pouch + ribbon
      g.ellipse(14, -14, 4, 5).fill({ color: 0xccbb88, alpha: 0.7 });
    } else {
      // Painter brush
      g.rect(14, -28, 1.5, 22).fill({ color: 0x443322, alpha: 0.8 });
      g.rect(13, -30, 4, 4).fill({ color: 0x222222, alpha: 0.7 });
    }

    // Neck
    g.rect(-2, -28, 4, 3).fill({ color: 0xddaa88, alpha: 0.9 });

    // Head
    g.circle(0, -32, 6.5).fill({ color: 0xeebb99, alpha: 0.95 });
    // Hair (varies slightly by class)
    const hairColor = cls === 'nightmarePainter' ? 0x111122 : cls === 'elantrian' ? 0xcccccc : 0x443322;
    g.poly([
      { x: -6, y: -33 }, { x: -7, y: -38 }, { x: -3, y: -40 },
      { x: 2, y: -40 }, { x: 6, y: -39 }, { x: 7, y: -34 },
      { x: 5, y: -33 },
    ]).fill({ color: hairColor, alpha: 0.9 });

    // Eyes
    g.circle(-2.5, -32, 1.2).fill(0x222244);
    g.circle(2.5, -32, 1.2).fill(0x222244);
    // Eye glow (class-specific)
    g.circle(-2.5, -32, 0.6).fill({ color: weaponColor, alpha: 0.6 });
    g.circle(2.5, -32, 0.6).fill({ color: weaponColor, alpha: 0.6 });

    // Helmet/headgear (varies by class)
    if (cls === 'radiant') {
      // Helm visor
      g.poly([
        { x: -5, y: -35 }, { x: 0, y: -36 }, { x: 5, y: -35 },
        { x: 6, y: -31 }, { x: -6, y: -31 },
      ]).fill({ color: 0x556688, alpha: 0.4 });
    } else if (cls === 'mistborn') {
      // Mistcloak hood outline
      g.poly([
        { x: -7, y: -30 }, { x: -8, y: -38 },
        { x: 0, y: -42 },
        { x: 8, y: -38 }, { x: 7, y: -30 },
      ]).stroke({ color: 0x334455, width: 1.5, alpha: 0.6 });
    }

    // Class-specific aura glow
    g.circle(0, -20, 18).fill({ color: bodyColor, alpha: 0.05 });
    g.circle(0, -20, 12).fill({ color: weaponColor, alpha: 0.04 });
  }

  // ─── NPCs ────────────────────────────────────────────────────

  private spawnNPCs(): void {
    for (const spawn of this.zone.npcSpawns) {
      const pos = isoToScreen(spawn.position.col, spawn.position.row);
      const container = new Container();
      container.zIndex = pos.y;

      // Shadow
      const shadow = new Graphics();
      shadow.ellipse(0, 2, 10, 4).fill({ color: 0x000000, alpha: 0.25 });
      container.addChild(shadow);

      const sprite = new Graphics();

      if (spawn.isShopkeeper) {
        // Shopkeeper - distinctive look
        sprite.poly([
          { x: -9, y: -3 }, { x: -7, y: -18 },
          { x: 0, y: -22 }, { x: 7, y: -18 }, { x: 9, y: -3 },
        ]).fill({ color: 0x886633, alpha: 0.9 });
        sprite.circle(0, -26, 5.5).fill({ color: 0xddbb88, alpha: 0.95 });
        // Hat
        sprite.ellipse(0, -31, 8, 3).fill({ color: 0x664422, alpha: 0.9 });
        // Shop icon
        sprite.rect(-3, -16, 6, 6).fill({ color: 0xe6cc33, alpha: 0.7 });
      } else {
        // Regular NPC
        sprite.poly([
          { x: -8, y: -3 }, { x: -6, y: -18 },
          { x: 0, y: -21 }, { x: 6, y: -18 }, { x: 8, y: -3 },
        ]).fill({ color: 0x555577, alpha: 0.9 });
        sprite.circle(0, -25, 5.5).fill({ color: 0xddbb88, alpha: 0.95 });
        // Quest indicator (!)
        const hasQuest = spawn.dialogueTreeID != null;
        if (hasQuest) {
          sprite.circle(0, -36, 5).fill({ color: 0xeedd44, alpha: 0.8 });
          const bangStyle = new TextStyle({ fontFamily: 'sans-serif', fontSize: 8, fill: 0x332200, fontWeight: 'bold' });
          const bang = new Text({ text: '!', style: bangStyle });
          bang.anchor.set(0.5);
          bang.y = -36;
          container.addChild(bang);
        }
      }
      container.addChild(sprite);

      // Name label
      const npcName = this.formatNPCName(spawn.npcID);
      const nameStyle = new TextStyle({
        fontFamily: 'Georgia, serif', fontSize: 8,
        fill: spawn.isShopkeeper ? 0xe6cc33 : 0xaaaacc,
        dropShadow: { color: 0x000000, blur: 2, distance: 1 },
      });
      const nameText = new Text({ text: npcName, style: nameStyle });
      nameText.anchor.set(0.5);
      nameText.y = -40;
      container.addChild(nameText);

      container.x = pos.x;
      container.y = pos.y;

      // Make interactive
      container.eventMode = 'static';
      container.cursor = 'pointer';
      container.on('pointerdown', () => this.interactWithNPC(spawn));

      this.worldContainer.addChild(container);

      this.npcs.push({
        id: spawn.npcID,
        position: pos,
        sprite: container,
        nameText,
        isShopkeeper: spawn.isShopkeeper,
      });
    }
  }

  private formatNPCName(npcID: string): string {
    return npcID.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  private handleInteraction(mode: ActionMode): void {
    switch (mode) {
      case 'talk':
        if (this.nearbyNPC) {
          const spawn = this.zone.npcSpawns.find(s => s.npcID === this.nearbyNPC!.id);
          if (spawn) this.interactWithNPC(spawn);
        }
        break;
      case 'enter':
        // Zone exit handled by checkZoneExit
        break;
      case 'loot':
        if (this.nearbyLoot) {
          this.collectLoot(this.nearbyLoot.id);
        }
        break;
    }
  }

  private interactWithNPC(spawn: { npcID: string; isShopkeeper: boolean; dialogueTreeID: string | null }): void {
    const npc = this.npcs.find(n => n.id === spawn.npcID);
    if (!npc) return;

    if (spawn.isShopkeeper) {
      this.showShopPanel(spawn.npcID);
    } else {
      this.showDialogue(spawn.npcID, spawn.dialogueTreeID);
    }
  }

  private showDialogue(npcID: string, dialogueTreeID: string | null): void {
    if (this.dialoguePanel) return;
    this.isPaused = true;

    const w = this.app.screen.width;
    const h = this.app.screen.height;
    const npcName = this.formatNPCName(npcID);

    // Dialogue lines based on world
    const worldDialogues: Record<string, string[]> = {
      scadrial: [
        'Les brumes sont plus denses ces derniers temps...',
        'Méfie-toi des Inquisiteurs qui rôdent dans la nuit.',
        'Le Seigneur Dirigeant surveille tout. Sois prudent.',
        'J\'ai entendu parler d\'un groupe de skaa rebelles...',
      ],
      roshar: [
        'La Tempête Éternelle approche, prépare-toi!',
        'Les sprens sont agités aujourd\'hui...',
        'Que la Lumière d\'Orage te protège, Radieux.',
        'Les Néantifères se rassemblent aux frontières.',
      ],
      nalthis: [
        'Les couleurs semblent s\'estomper dans ce quartier.',
        'Combien de Souffles possèdes-tu, étranger?',
        'Le Dieu-Roi ne reçoit plus de visiteurs.',
        'La vie est belle à Hallandren, n\'est-ce pas?',
      ],
      taldain: [
        'Le sable blanc est rare par ici.',
        'L\'énergie solaire alimente mes pouvoirs.',
        'Les tempêtes de sable sont de plus en plus fréquentes.',
        'Attention aux créatures qui vivent sous le sable.',
      ],
      sel: [
        'Les Aons brillent d\'un éclat particulier ce soir.',
        'Elantris retrouve peu à peu sa splendeur.',
        'Le Dor coule en abondance ici.',
        'Les Seons dansent dans la lumière.',
      ],
      komashi: [
        'Les cauchemars sont de plus en plus vivaces...',
        'Tes peintures ont un pouvoir remarquable.',
        'Les pierres empilées nous protègent la nuit.',
        'Méfie-toi des ombres qui bougent.',
      ],
      shadesmar: [
        'Les billes sont la monnaie ici, ne l\'oublie pas.',
        'Les flamespren éclairent notre chemin.',
        'Le Royaume Cognitif est vaste et dangereux.',
        'Chaque pensée prend forme dans ce monde.',
      ],
    };

    const lines = worldDialogues[this.zone.worldID] ?? worldDialogues.scadrial;
    const chosenLine = lines[Math.floor(Math.random() * lines.length)];

    this.dialoguePanel = new Container();
    this.dialoguePanel.zIndex = 10000;

    // Dark overlay
    const overlay = new Graphics();
    overlay.rect(0, 0, w, h).fill({ color: 0x000000, alpha: 0.4 });
    overlay.eventMode = 'static';
    this.dialoguePanel.addChild(overlay);

    // Panel background
    const panelH = 120;
    const panelY = h - panelH - 20;
    const panel = new Graphics();
    panel.roundRect(20, panelY, w - 40, panelH, 12)
      .fill({ color: 0x0a0815, alpha: 0.92 });
    panel.roundRect(20, panelY, w - 40, panelH, 12)
      .stroke({ color: 0x665533, width: 2, alpha: 0.7 });
    this.dialoguePanel.addChild(panel);

    // NPC name label
    const nameLabel = new Text({
      text: npcName,
      style: new TextStyle({
        fontFamily: 'Georgia, serif', fontSize: 14, fill: 0xe6cc66, fontWeight: 'bold',
      }),
    });
    nameLabel.x = 36;
    nameLabel.y = panelY + 10;
    this.dialoguePanel.addChild(nameLabel);

    // Dialogue text
    const dialogueText = new Text({
      text: chosenLine,
      style: new TextStyle({
        fontFamily: 'Georgia, serif', fontSize: 12, fill: 0xddddcc,
        wordWrap: true, wordWrapWidth: w - 80,
      }),
    });
    dialogueText.x = 36;
    dialogueText.y = panelY + 32;
    this.dialoguePanel.addChild(dialogueText);

    // Close hint
    const closeHint = new Text({
      text: 'Toucher pour fermer',
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 9, fill: 0x888888 }),
    });
    closeHint.anchor.set(0.5);
    closeHint.x = w / 2;
    closeHint.y = panelY + panelH - 14;
    this.dialoguePanel.addChild(closeHint);

    // Quest reward hint
    const champ = GameManager.shared.champion;
    if (champ) {
      const xpReward = 10 + Math.floor(Math.random() * 15);
      const goldReward = 5 + Math.floor(Math.random() * 10);
      champ.gold += goldReward;
      GameManager.shared.grantXP(xpReward);
      const rewardText = new Text({
        text: `+${xpReward} XP  +${goldReward} or`,
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 10, fill: 0x66cc44, fontWeight: 'bold' }),
      });
      rewardText.anchor.set(1, 0);
      rewardText.x = w - 36;
      rewardText.y = panelY + 10;
      this.dialoguePanel.addChild(rewardText);
    }

    overlay.on('pointerdown', () => this.closeDialogue());
    panel.eventMode = 'static';
    panel.on('pointerdown', () => this.closeDialogue());

    this.uiContainer.addChild(this.dialoguePanel);
  }

  private closeDialogue(): void {
    if (this.dialoguePanel) {
      this.dialoguePanel.destroy({ children: true });
      this.dialoguePanel = null;
    }
    this.isPaused = false;
  }

  private showShopPanel(npcID: string): void {
    if (this.dialoguePanel) return;
    this.isPaused = true;

    const w = this.app.screen.width;
    const h = this.app.screen.height;
    const champ = GameManager.shared.champion;
    if (!champ) return;

    this.dialoguePanel = new Container();
    this.dialoguePanel.zIndex = 10000;

    const overlay = new Graphics();
    overlay.rect(0, 0, w, h).fill({ color: 0x000000, alpha: 0.5 });
    overlay.eventMode = 'static';
    this.dialoguePanel.addChild(overlay);

    // Shop panel
    const panelW = Math.min(300, w - 40);
    const panelH = 240;
    const panelX = (w - panelW) / 2;
    const panelY = (h - panelH) / 2;

    const panel = new Graphics();
    panel.roundRect(panelX, panelY, panelW, panelH, 12)
      .fill({ color: 0x0a0815, alpha: 0.95 });
    panel.roundRect(panelX, panelY, panelW, panelH, 12)
      .stroke({ color: 0x886633, width: 2, alpha: 0.8 });
    panel.eventMode = 'static';
    this.dialoguePanel.addChild(panel);

    // Title
    const title = new Text({
      text: 'BOUTIQUE',
      style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 16, fill: 0xe6cc66, fontWeight: 'bold' }),
    });
    title.anchor.set(0.5);
    title.x = w / 2;
    title.y = panelY + 18;
    this.dialoguePanel.addChild(title);

    // Gold display
    const goldLabel = new Text({
      text: `Or: ${champ.gold}`,
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 12, fill: 0xe6cc33 }),
    });
    goldLabel.anchor.set(0.5);
    goldLabel.x = w / 2;
    goldLabel.y = panelY + 38;
    this.dialoguePanel.addChild(goldLabel);

    // Shop items
    const shopItems = [
      { name: 'Potion de soin', cost: 20, effect: 'hp', value: 50 },
      { name: 'Potion d\'investiture', cost: 25, effect: 'inv', value: 40 },
      { name: 'Élixir de force', cost: 40, effect: 'str', value: 2 },
    ];

    shopItems.forEach((item, i) => {
      const itemY = panelY + 60 + i * 45;
      const itemBg = new Graphics();
      itemBg.roundRect(panelX + 10, itemY, panelW - 20, 38, 6)
        .fill({ color: 0x1a1528, alpha: 0.8 })
        .stroke({ color: 0x443322, width: 1, alpha: 0.5 });
      itemBg.eventMode = 'static';
      itemBg.cursor = 'pointer';
      this.dialoguePanel!.addChild(itemBg);

      const itemName = new Text({
        text: item.name,
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 11, fill: 0xddddcc }),
      });
      itemName.x = panelX + 18;
      itemName.y = itemY + 5;
      this.dialoguePanel!.addChild(itemName);

      const costText = new Text({
        text: `${item.cost} or`,
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 10, fill: champ.gold >= item.cost ? 0xe6cc33 : 0x884444 }),
      });
      costText.anchor.set(1, 0);
      costText.x = panelX + panelW - 18;
      costText.y = itemY + 5;
      this.dialoguePanel!.addChild(costText);

      const buyLabel = new Text({
        text: champ.gold >= item.cost ? 'Acheter' : 'Pas assez d\'or',
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 9, fill: champ.gold >= item.cost ? 0x66cc44 : 0x666666 }),
      });
      buyLabel.x = panelX + 18;
      buyLabel.y = itemY + 20;
      this.dialoguePanel!.addChild(buyLabel);

      if (champ.gold >= item.cost) {
        itemBg.on('pointerdown', () => {
          champ.gold -= item.cost;
          if (item.effect === 'hp') {
            champ.currentHP = Math.min(GameManager.shared.maxHP, champ.currentHP + item.value);
          } else if (item.effect === 'inv') {
            champ.currentInvestiture = Math.min(GameManager.shared.maxInvestiture, champ.currentInvestiture + item.value);
          } else if (item.effect === 'str') {
            champ.baseStats.strength += item.value;
          }
          this.closeDialogue();
          this.showFloatingText(this.playerScreenPos.x, this.playerScreenPos.y - 40, `${item.name} acheté!`, 0x66cc44);
        });
      }
    });

    // Close button
    const closeBtnBg = new Graphics();
    closeBtnBg.roundRect(panelX + panelW / 2 - 40, panelY + panelH - 32, 80, 24, 6)
      .fill({ color: 0x553322, alpha: 0.8 })
      .stroke({ color: 0x886644, width: 1 });
    closeBtnBg.eventMode = 'static';
    closeBtnBg.cursor = 'pointer';
    closeBtnBg.on('pointerdown', () => this.closeDialogue());
    this.dialoguePanel.addChild(closeBtnBg);

    const closeLabel = new Text({
      text: 'Fermer',
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 11, fill: 0xeeddcc }),
    });
    closeLabel.anchor.set(0.5);
    closeLabel.x = panelX + panelW / 2;
    closeLabel.y = panelY + panelH - 20;
    this.dialoguePanel.addChild(closeLabel);

    overlay.on('pointerdown', () => this.closeDialogue());
    this.uiContainer.addChild(this.dialoguePanel);
  }

  private createPauseButton(screenWidth: number): void {
    const btn = new Container();
    const bg = new Graphics();
    bg.roundRect(0, 0, 36, 28, 6)
      .fill({ color: 0x1a1528, alpha: 0.7 })
      .stroke({ color: 0x443355, width: 1, alpha: 0.5 });
    btn.addChild(bg);

    // Pause icon (two bars)
    const icon = new Graphics();
    icon.rect(10, 6, 4, 16).fill({ color: 0xcccccc, alpha: 0.8 });
    icon.rect(20, 6, 4, 16).fill({ color: 0xcccccc, alpha: 0.8 });
    btn.addChild(icon);

    btn.x = screenWidth / 2 - 18;
    btn.y = 10;
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.on('pointerdown', () => this.togglePause());
    this.uiContainer.addChild(btn);
  }

  private togglePause(): void {
    if (this.pauseMenu) {
      this.pauseMenu.destroy({ children: true });
      this.pauseMenu = null;
      this.isPaused = false;
      return;
    }

    this.isPaused = true;
    const w = this.app.screen.width;
    const h = this.app.screen.height;

    this.pauseMenu = new Container();
    this.pauseMenu.zIndex = 10000;

    const overlay = new Graphics();
    overlay.rect(0, 0, w, h).fill({ color: 0x000000, alpha: 0.6 });
    overlay.eventMode = 'static';
    this.pauseMenu.addChild(overlay);

    // Panel
    const panelW = 200;
    const panelH = 220;
    const px = (w - panelW) / 2;
    const py = (h - panelH) / 2;

    const panel = new Graphics();
    panel.roundRect(px, py, panelW, panelH, 12)
      .fill({ color: 0x0a0815, alpha: 0.95 })
      .stroke({ color: 0x554433, width: 2, alpha: 0.7 });
    panel.eventMode = 'static';
    this.pauseMenu.addChild(panel);

    const title = new Text({
      text: 'PAUSE',
      style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 20, fill: 0xe6cc66, fontWeight: 'bold' }),
    });
    title.anchor.set(0.5);
    title.x = w / 2;
    title.y = py + 24;
    this.pauseMenu.addChild(title);

    const buttons = [
      { label: 'Reprendre', y: py + 60, action: () => this.togglePause() },
      { label: 'Sauvegarder', y: py + 105, action: () => {
        GameManager.shared.save();
        this.showFloatingText(this.playerScreenPos.x, this.playerScreenPos.y - 40, 'Partie sauvegardée!', 0x66cc44);
        this.togglePause();
      }},
      { label: 'Quitter', y: py + 150, action: () => {
        GameManager.shared.save();
        // Return to title (just reload page for now)
        window.location.reload();
      }, color: 0x552222 },
    ];

    for (const b of buttons) {
      const btnBg = new Graphics();
      btnBg.roundRect(px + 20, b.y, panelW - 40, 34, 8)
        .fill({ color: b.color ?? 0x1a1528, alpha: 0.8 })
        .stroke({ color: 0x554433, width: 1, alpha: 0.5 });
      btnBg.eventMode = 'static';
      btnBg.cursor = 'pointer';
      btnBg.on('pointerdown', b.action);
      this.pauseMenu.addChild(btnBg);

      const btnLabel = new Text({
        text: b.label,
        style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 14, fill: 0xeeddcc }),
      });
      btnLabel.anchor.set(0.5);
      btnLabel.x = w / 2;
      btnLabel.y = b.y + 17;
      this.pauseMenu.addChild(btnLabel);
    }

    this.uiContainer.addChild(this.pauseMenu);
  }

  // ─── Loot Points ─────────────────────────────────────────────

  private spawnLootPoints(): void {
    for (const loot of this.zone.lootPoints) {
      const pos = isoToScreen(loot.position.col, loot.position.row);
      const container = new Container();
      container.zIndex = pos.y;

      if (!loot.isHidden) {
        // Visible chest
        const chest = new Graphics();
        // Base
        chest.roundRect(-8, -6, 16, 10, 2).fill({ color: 0x664422, alpha: 0.9 });
        // Lid
        chest.roundRect(-9, -12, 18, 7, 2).fill({ color: 0x775533, alpha: 0.9 });
        // Lock
        chest.circle(0, -8, 2).fill({ color: 0xe6cc33, alpha: 0.9 });
        // Glow
        chest.circle(0, -6, 14).fill({ color: 0xeedd44, alpha: 0.06 });
        container.addChild(chest);

        // Sparkle particles
        for (let i = 0; i < 3; i++) {
          const sparkle = new Graphics();
          sparkle.star(0, 0, 4, 2, 1).fill({ color: 0xeedd88, alpha: 0.4 });
          sparkle.x = (Math.random() - 0.5) * 16;
          sparkle.y = -8 + (Math.random() - 0.5) * 10;
          container.addChild(sparkle);
        }
      } else {
        // Hidden loot - subtle shimmer
        const shimmer = new Graphics();
        shimmer.circle(0, -2, 4).fill({ color: 0xeedd88, alpha: 0.15 });
        container.addChild(shimmer);
      }

      container.x = pos.x;
      container.y = pos.y;

      // Interactive
      container.eventMode = 'static';
      container.cursor = 'pointer';
      container.on('pointerdown', () => this.collectLoot(loot.id));

      this.worldContainer.addChild(container);

      this.lootPoints.push({
        id: loot.id,
        position: pos,
        sprite: container,
        collected: false,
        isHidden: loot.isHidden,
      });
    }
  }

  private collectLoot(lootId: string): void {
    const instance = this.lootPoints.find(l => l.id === lootId);
    if (!instance || instance.collected) return;

    const playerDist = Math.hypot(instance.position.x - this.playerScreenPos.x, instance.position.y - this.playerScreenPos.y);
    if (playerDist > 60) {
      this.showFloatingText(instance.position.x, instance.position.y - 20, 'Trop loin!', 0xff6644);
      return;
    }

    instance.collected = true;
    instance.sprite.visible = false;

    // Give rewards
    const champ = GameManager.shared.champion;
    if (!champ) return;

    const lootData = this.zone.lootPoints.find(l => l.id === lootId);
    if (!lootData) return;

    let itemsFound = 0;
    for (const entry of lootData.lootTable) {
      if (Math.random() < entry.dropChance) {
        itemsFound++;
        const qty = entry.minQuantity + Math.floor(Math.random() * (entry.maxQuantity - entry.minQuantity + 1));
        for (let i = 0; i < qty; i++) {
          champ.inventoryItemIDs.push(entry.itemID);
        }
      }
    }

    this.showFloatingText(instance.position.x, instance.position.y - 20,
      itemsFound > 0 ? `+${itemsFound} objet(s)!` : 'Vide...', 0xeedd88);
  }

  // ─── Enemies ─────────────────────────────────────────────────

  private spawnEnemies(): void {
    for (const spawn of this.zone.enemySpawns) {
      const data = gameData.enemy(spawn.enemyID);
      if (!data) continue;

      const pos = isoToScreen(spawn.position.col, spawn.position.row);
      const container = new Container();
      container.zIndex = pos.y;

      // Shadow
      const shadow = new Graphics();
      const size = data.tier === 'boss' ? 14 : data.tier === 'elite' ? 11 : 8;
      shadow.ellipse(0, 2, size + 2, 4).fill({ color: 0x000000, alpha: 0.25 });
      container.addChild(shadow);

      const sprite = new Graphics();
      this.drawEnemySprite(sprite, data, size);
      container.addChild(sprite);

      // HP bar
      const hpBar = new Graphics();
      hpBar.y = -size * 2 - 14;
      this.drawEnemyHP(hpBar, 1);
      container.addChild(hpBar);

      // Name
      const tierColors: Record<string, number> = {
        minion: 0xaa8877, soldier: 0xcc6655, elite: 0xcc66dd, boss: 0xff8833,
      };
      const nameStyle = new TextStyle({
        fontFamily: 'sans-serif', fontSize: 7,
        fill: tierColors[data.tier] ?? 0xaa8877,
        dropShadow: { color: 0x000000, blur: 2, distance: 1 },
      });
      const nameText = new Text({ text: data.name, style: nameStyle });
      nameText.anchor.set(0.5);
      nameText.y = -size * 2 - 22;
      container.addChild(nameText);

      container.x = pos.x;
      container.y = pos.y;
      this.worldContainer.addChild(container);

      this.enemies.push({
        data, spawn,
        hp: data.maxHP,
        position: { ...pos },
        gridPos: { ...spawn.position },
        sprite: container,
        hpBar,
        nameText,
        isDead: false,
        attackCooldown: 0,
        state: 'idle',
        respawnTimer: 0,
        animTimer: Math.random() * Math.PI * 2,
      });
    }
  }

  private drawEnemySprite(g: Graphics, data: Enemy, size: number): void {
    const tierBodyColors: Record<string, number> = {
      minion: 0x774444, soldier: 0x993333, elite: 0x993399, boss: 0xcc5500,
    };
    const bodyColor = tierBodyColors[data.tier] ?? 0x774444;

    // Body
    g.poly([
      { x: -size, y: 0 }, { x: -size * 0.7, y: -size * 1.5 },
      { x: 0, y: -size * 1.8 },
      { x: size * 0.7, y: -size * 1.5 }, { x: size, y: 0 },
    ]).fill({ color: bodyColor, alpha: 0.9 });

    // Head
    const headSize = size * 0.5;
    g.circle(0, -size * 1.8 - headSize, headSize).fill({ color: 0xbb8866, alpha: 0.9 });

    // Eyes (red, menacing)
    g.circle(-headSize * 0.4, -size * 1.8 - headSize, 1.2).fill(0xff3333);
    g.circle(headSize * 0.4, -size * 1.8 - headSize, 1.2).fill(0xff3333);

    // Boss crown
    if (data.tier === 'boss') {
      g.poly([
        { x: -6, y: -size * 2.6 }, { x: -4, y: -size * 2.2 },
        { x: -2, y: -size * 2.5 }, { x: 0, y: -size * 2.2 },
        { x: 2, y: -size * 2.5 }, { x: 4, y: -size * 2.2 },
        { x: 6, y: -size * 2.6 }, { x: 6, y: -size * 2 }, { x: -6, y: -size * 2 },
      ]).fill({ color: 0xeebb33, alpha: 0.8 });
    }

    // Elite aura
    if (data.tier === 'elite') {
      g.circle(0, -size, size * 1.5).fill({ color: 0xcc33cc, alpha: 0.08 });
    }
  }

  private drawEnemyHP(bar: Graphics, pct: number): void {
    bar.clear();
    const w = 32;
    // Background
    bar.roundRect(-w / 2, 0, w, 4, 1).fill({ color: 0x111111, alpha: 0.8 });
    bar.roundRect(-w / 2, 0, w, 4, 1).stroke({ color: 0x333333, width: 0.5 });
    if (pct > 0) {
      const color = pct > 0.6 ? 0x44cc44 : pct > 0.3 ? 0xcccc44 : 0xcc4444;
      bar.roundRect(-w / 2, 0, w * Math.max(0, pct), 4, 1).fill(color);
    }
  }

  // ─── Exits ───────────────────────────────────────────────────

  private renderExits(): void {
    for (const conn of this.zone.connections) {
      const pos = isoToScreen(conn.exitPosition.col, conn.exitPosition.row);
      const container = new Container();
      container.zIndex = pos.y + 1;

      // Portal effect
      const portal = new Graphics();
      // Outer glow
      portal.circle(0, -10, 18).fill({ color: 0x4499ff, alpha: 0.06 });
      portal.circle(0, -10, 12).fill({ color: 0x66bbff, alpha: 0.1 });

      // Diamond marker
      portal.poly([
        { x: 0, y: -24 },
        { x: 14, y: -10 },
        { x: 0, y: 4 },
        { x: -14, y: -10 },
      ]).fill({ color: 0x66ccff, alpha: 0.25 })
        .stroke({ color: 0x88ddff, width: 1.5, alpha: 0.7 });

      // Arrow
      portal.poly([
        { x: 0, y: -18 }, { x: 5, y: -12 }, { x: -5, y: -12 },
      ]).fill({ color: 0xaaeeff, alpha: 0.6 });

      container.addChild(portal);

      // Label
      const targetZone = gameData.zone(conn.targetZoneID);
      const targetName = targetZone?.name ?? conn.targetZoneID;
      const label = new Text({
        text: `→ ${targetName}`,
        style: new TextStyle({
          fontFamily: 'Georgia, serif', fontSize: 8, fill: 0x88ccff,
          dropShadow: { color: 0x000000, blur: 3, distance: 1 },
        }),
      });
      label.anchor.set(0.5, 0);
      label.y = 10;
      container.addChild(label);

      // Locked indicator
      if (conn.requiredQuestID) {
        const champ = GameManager.shared.champion;
        const isLocked = !champ?.completedQuestIDs.includes(conn.requiredQuestID);
        if (isLocked) {
          const lockStyle = new TextStyle({ fontFamily: 'sans-serif', fontSize: 10, fill: 0xff6644 });
          const lock = new Text({ text: '🔒', style: lockStyle });
          lock.anchor.set(0.5);
          lock.y = -28;
          container.addChild(lock);
        }
      }

      container.x = pos.x;
      container.y = pos.y;
      this.worldContainer.addChild(container);
    }
  }

  // ─── Particles & Weather ─────────────────────────────────────

  private spawnAmbientParticles(dt: number): void {
    const w = this.app.screen.width;
    const h = this.app.screen.height;
    const weather = this.zone.weatherEffect;

    // Rate based on weather
    let rate = 0.3;
    if (weather === 'ashfall') rate = 1.5;
    else if (weather === 'mist') rate = 2;
    else if (weather === 'highstorm') rate = 3;
    else if (weather === 'rain') rate = 2.5;

    // Spawn
    if (Math.random() < rate * dt) {
      const particle = new Graphics();
      let px = 0, py = 0, vx = 0, vy = 0, size = 2, life = 3;
      const color = this.theme.ambientParticleColor;

      if (weather === 'ashfall') {
        px = (Math.random() - 0.5) * w * 2;
        py = -h / 2 + (Math.random() - 0.5) * 100;
        vx = -8 + Math.random() * 4;
        vy = 15 + Math.random() * 10;
        size = 1 + Math.random() * 2;
        life = 4 + Math.random() * 2;
        particle.circle(0, 0, size).fill({ color: 0x888077, alpha: 0.4 });
      } else if (weather === 'mist') {
        px = (Math.random() - 0.5) * w * 2;
        py = (Math.random() - 0.5) * h * 2;
        vx = -3 + Math.random() * 6;
        vy = -1 + Math.random() * 2;
        size = 8 + Math.random() * 15;
        life = 5 + Math.random() * 5;
        particle.circle(0, 0, size).fill({ color: 0xaaaaaa, alpha: 0.06 });
      } else if (weather === 'highstorm') {
        px = w / 2 + Math.random() * 100;
        py = (Math.random() - 0.5) * h * 2;
        vx = -80 - Math.random() * 40;
        vy = 10 + Math.random() * 10;
        size = 1 + Math.random();
        life = 1.5 + Math.random();
        particle.rect(-size * 2, -0.5, size * 4, 1).fill({ color: 0x8899aa, alpha: 0.5 });
      } else {
        // Gentle ambient sparkle
        px = (Math.random() - 0.5) * w * 2;
        py = (Math.random() - 0.5) * h * 2;
        vx = (Math.random() - 0.5) * 4;
        vy = -3 + Math.random() * 2;
        size = 1 + Math.random();
        life = 3 + Math.random() * 3;
        particle.circle(0, 0, size).fill({ color, alpha: 0.2 });
      }

      // Position relative to camera
      particle.x = px - this.worldContainer.x + w / 2;
      particle.y = py - this.worldContainer.y + h / 2;
      this.particleContainer.addChild(particle);

      this.particles.push({
        sprite: particle, x: particle.x, y: particle.y,
        vx, vy, life, maxLife: life, size,
      });
    }

    // Update existing
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.sprite.x = p.x;
      p.sprite.y = p.y;
      p.sprite.alpha = Math.min(1, p.life / p.maxLife) * 0.6;

      if (p.life <= 0) {
        p.sprite.destroy();
        this.particles.splice(i, 1);
      }
    }
  }

  private updateFog(): void {
    this.fogOverlay.clear();
    // Vignette effect on UI layer
    const w = this.app.screen.width;
    const h = this.app.screen.height;
    const t = this.theme;

    // Top fog
    this.fogOverlay.rect(0, 0, w, h * 0.15).fill({
      color: t.fogColor,
      alpha: t.fogAlpha,
    });

    // Bottom fog
    this.fogOverlay.rect(0, h * 0.85, w, h * 0.15).fill({
      color: t.fogColor,
      alpha: t.fogAlpha * 0.7,
    });

    this.fogOverlay.zIndex = 999;
    if (!this.fogOverlay.parent) {
      this.uiContainer.addChild(this.fogOverlay);
    }
  }

  // ─── Update Loop ─────────────────────────────────────────────

  update(dt: number): void {
    if (this.isPaused || this.isTransitioning) return;
    const delta = dt / 60;
    this.handleMovement(delta);
    this.updateEnemyAI(delta);
    this.updateCombat(delta);
    this.updateCamera();
    this.updateAnimations(delta);
    this.spawnAmbientParticles(delta);
    this.hud.refresh(this.zone.name);
    this.actionButtons.update(dt);
    this.checkZoneExit();
    this.checkProximity();
    this.sortZOrder();
  }

  // ─── Movement ────────────────────────────────────────────────

  private handleMovement(dt: number): void {
    if (!this.joystick.active || this.joystick.magnitude === 0) return;

    const dx = this.joystick.direction.x * this.playerSpeed * dt * this.joystick.magnitude;
    const dy = this.joystick.direction.y * this.playerSpeed * dt * this.joystick.magnitude;

    // Track facing
    if (dx > 0.5) this.playerFacing = 'right';
    else if (dx < -0.5) this.playerFacing = 'left';

    const newX = this.playerScreenPos.x + dx;
    const newY = this.playerScreenPos.y + dy;

    // Convert to iso and clamp within grid bounds
    const iso = screenToIso(newX, newY);
    const clampedCol = Math.max(0.5, Math.min(this.zone.gridWidth - 1.5, iso.col));
    const clampedRow = Math.max(0.5, Math.min(this.zone.gridHeight - 1.5, iso.row));

    // Convert clamped iso back to screen
    const clamped = isoToScreen(clampedCol, clampedRow);
    this.playerScreenPos.x = clamped.x;
    this.playerScreenPos.y = clamped.y;

    this.playerGridPos = {
      col: Math.round(clampedCol),
      row: Math.round(clampedRow),
    };

    this.playerContainer.x = this.playerScreenPos.x;
    this.playerContainer.y = this.playerScreenPos.y;
  }

  // ─── Animations ──────────────────────────────────────────────

  private updateAnimations(dt: number): void {
    this.playerAnimTimer += dt * 4;

    // Player bob when moving
    if (this.joystick.active && this.joystick.magnitude > 0) {
      this.playerSprite.y = Math.sin(this.playerAnimTimer) * 1.5;
    } else {
      this.playerSprite.y = Math.sin(this.playerAnimTimer * 0.5) * 0.5;
    }

    // Player facing
    this.playerSprite.scale.x = this.playerFacing === 'left' ? -1 : 1;

    // Enemy idle bob
    for (const enemy of this.enemies) {
      if (enemy.isDead) continue;
      enemy.animTimer += dt * 2;
      const innerSprite = enemy.sprite.children[1]; // The Graphics sprite
      if (innerSprite) {
        innerSprite.y = Math.sin(enemy.animTimer) * 1;
      }
    }

    // NPC idle animation
    for (const npc of this.npcs) {
      // Subtle scale pulse for quest NPCs
      const t = performance.now() / 1000;
      const questBang = npc.sprite.children.find(c => c instanceof Text && (c as Text).text === '!');
      if (questBang) {
        questBang.scale.set(1 + Math.sin(t * 3) * 0.15);
      }
    }

    // Loot sparkle
    for (const loot of this.lootPoints) {
      if (loot.collected || loot.isHidden) continue;
      const t = performance.now() / 1000;
      // Gentle pulse
      loot.sprite.alpha = 0.85 + Math.sin(t * 2) * 0.15;
    }
  }

  // ─── Enemy AI ────────────────────────────────────────────────

  private updateEnemyAI(dt: number): void {
    const playerPos = this.playerScreenPos;

    for (const enemy of this.enemies) {
      if (enemy.isDead) {
        enemy.respawnTimer -= dt;
        if (enemy.respawnTimer <= 0 && enemy.spawn.respawnTime) {
          enemy.hp = enemy.data.maxHP;
          enemy.isDead = false;
          enemy.state = 'idle';
          enemy.sprite.visible = true;
          const pos = isoToScreen(enemy.spawn.position.col, enemy.spawn.position.row);
          enemy.position = { ...pos };
          enemy.sprite.x = pos.x;
          enemy.sprite.y = pos.y;
          this.drawEnemyHP(enemy.hpBar, 1);
        }
        continue;
      }

      const dist = Math.hypot(enemy.position.x - playerPos.x, enemy.position.y - playerPos.y);
      const detRange = enemy.data.detectionRange * 32;
      const atkRange = enemy.data.attackRange * 32;

      enemy.attackCooldown = Math.max(0, enemy.attackCooldown - dt);

      if (dist < atkRange && enemy.attackCooldown <= 0) {
        enemy.state = 'attacking';
        enemy.attackCooldown = 1.5;
        this.enemyAttacksPlayer(enemy);
      } else if (dist < detRange) {
        enemy.state = 'chasing';
        const angle = Math.atan2(playerPos.y - enemy.position.y, playerPos.x - enemy.position.x);
        const speed = enemy.data.speed * 30 * dt;
        enemy.position.x += Math.cos(angle) * speed;
        enemy.position.y += Math.sin(angle) * speed;
        enemy.sprite.x = enemy.position.x;
        enemy.sprite.y = enemy.position.y;
      } else {
        enemy.state = 'idle';
      }
    }
  }

  // ─── NPC Proximity ───────────────────────────────────────────

  private checkProximity(): void {
    this.nearbyNPC = null;
    this.nearbyExit = null;
    this.nearbyLoot = null;

    // Check NPCs
    let minNPCDist = Infinity;
    for (const npc of this.npcs) {
      const dist = Math.hypot(npc.position.x - this.playerScreenPos.x, npc.position.y - this.playerScreenPos.y);
      if (dist < 55 && dist < minNPCDist) {
        minNPCDist = dist;
        this.nearbyNPC = npc;
      }
    }

    // Check zone exits
    let minExitDist = Infinity;
    for (const conn of this.zone.connections) {
      const exitPos = isoToScreen(conn.exitPosition.col, conn.exitPosition.row);
      const dist = Math.hypot(exitPos.x - this.playerScreenPos.x, exitPos.y - this.playerScreenPos.y);
      if (dist < 55 && dist < minExitDist) {
        minExitDist = dist;
        this.nearbyExit = conn;
      }
    }

    // Check loot
    let minLootDist = Infinity;
    for (const loot of this.lootPoints) {
      if (loot.collected) continue;
      const dist = Math.hypot(loot.position.x - this.playerScreenPos.x, loot.position.y - this.playerScreenPos.y);
      if (dist < 55 && dist < minLootDist) {
        minLootDist = dist;
        this.nearbyLoot = loot;
      }
    }

    // Determine mode (priority: NPC > Exit > Loot > Attack)
    let newMode: ActionMode = 'attack';
    let promptText = '';
    if (this.nearbyNPC && minNPCDist < minExitDist && minNPCDist < minLootDist) {
      newMode = 'talk';
      promptText = this.nearbyNPC.isShopkeeper ? 'Ouvrir la boutique' : 'Parler';
    } else if (this.nearbyExit && minExitDist < minLootDist) {
      newMode = 'enter';
      const targetZone = gameData.zone(this.nearbyExit.targetZoneID);
      promptText = `→ ${targetZone?.name ?? this.nearbyExit.targetZoneID}`;
    } else if (this.nearbyLoot) {
      newMode = 'loot';
      promptText = 'Ramasser';
    }

    this.actionButtons.setMode(newMode);

    // Show/hide prompt
    if (promptText) {
      if (!this.interactPrompt) {
        this.interactPrompt = new Text({
          text: promptText,
          style: new TextStyle({
            fontFamily: 'Georgia, serif', fontSize: 11, fill: 0xeedd88,
            fontWeight: 'bold',
            dropShadow: { color: 0x000000, blur: 3, distance: 1 },
          }),
        });
        this.interactPrompt.anchor.set(0.5);
        this.interactPrompt.x = this.app.screen.width / 2;
        this.interactPrompt.y = this.app.screen.height * 0.68;
        this.uiContainer.addChild(this.interactPrompt);
      } else {
        this.interactPrompt.text = promptText;
      }
    } else if (this.interactPrompt) {
      this.interactPrompt.destroy();
      this.interactPrompt = null;
    }
  }

  // ─── Combat ──────────────────────────────────────────────────

  private handleAttack(): void {
    if (this.attackCooldown > 0) return;
    this.attackCooldown = this.ATTACK_COOLDOWN;

    const champ = GameManager.shared.champion;
    if (!champ) return;

    // Attack visual
    this.showAttackEffect();

    const range = 60;
    let closest: EnemyInstance | null = null;
    let closestDist = Infinity;

    for (const enemy of this.enemies) {
      if (enemy.isDead) continue;
      const dist = Math.hypot(enemy.position.x - this.playerScreenPos.x, enemy.position.y - this.playerScreenPos.y);
      if (dist < range && dist < closestDist) {
        closest = enemy;
        closestDist = dist;
      }
    }

    if (!closest) return;

    const damage = Math.max(1, champ.baseStats.strength + Math.floor(Math.random() * 5));
    const isCrit = Math.random() < champ.baseStats.luck * 0.01;
    const totalDmg = isCrit ? damage * 2 : damage;

    closest.hp -= totalDmg;
    this.showDamageNumber(closest.position.x, closest.position.y - 30, totalDmg, isCrit);
    this.drawEnemyHP(closest.hpBar, closest.hp / closest.data.maxHP);

    // Hit flash
    const innerSprite = closest.sprite.children[1] as Graphics;
    if (innerSprite) {
      innerSprite.tint = 0xff4444;
      setTimeout(() => { if (!closest!.isDead && innerSprite) innerSprite.tint = 0xffffff; }, 120);
    }

    if (closest.hp <= 0) {
      this.killEnemy(closest);
    }
  }

  private showAttackEffect(): void {
    const cls = GameManager.shared.champion?.championClass ?? 'mistborn';
    const dir = this.playerFacing === 'right' ? 1 : -1;
    const px = this.playerScreenPos.x;
    const py = this.playerScreenPos.y;

    // Main slash/swing arc
    const g = new Graphics();
    const slashColor = cls === 'radiant' ? 0x88ccff : cls === 'mistborn' ? 0xaabbcc :
                       cls === 'awakener' ? 0xcc88ff : cls === 'elantrian' ? 0xffcc44 :
                       cls === 'sandMaster' ? 0xddcc88 : 0x8866cc;

    // Weapon swing arc
    const startAngle = dir > 0 ? -Math.PI * 0.6 : Math.PI * 0.4;
    const endAngle = dir > 0 ? Math.PI * 0.3 : Math.PI * 1.3;
    g.arc(0, 0, 28, startAngle, endAngle).stroke({ color: slashColor, width: 3, alpha: 0.7 });
    g.arc(0, 0, 22, startAngle, endAngle).stroke({ color: 0xffffff, width: 1.5, alpha: 0.4 });

    // Slash trail particles
    for (let i = 0; i < 5; i++) {
      const angle = startAngle + (endAngle - startAngle) * (i / 5);
      const r = 25 + Math.random() * 5;
      g.circle(Math.cos(angle) * r, Math.sin(angle) * r, 1.5).fill({ color: slashColor, alpha: 0.5 });
    }

    g.x = px + dir * 18;
    g.y = py - 14;
    g.zIndex = 100000;
    this.worldContainer.addChild(g);

    // Arm/weapon swing motion on player
    const armSwing = new Graphics();
    if (cls === 'radiant') {
      // Shardblade trail
      armSwing.poly([
        { x: dir * 4, y: -8 }, { x: dir * 30, y: -24 }, { x: dir * 32, y: -20 }, { x: dir * 6, y: -4 },
      ]).fill({ color: 0x88ccff, alpha: 0.3 });
    } else {
      armSwing.poly([
        { x: dir * 4, y: -8 }, { x: dir * 22, y: -18 }, { x: dir * 24, y: -14 }, { x: dir * 6, y: -4 },
      ]).fill({ color: slashColor, alpha: 0.2 });
    }
    armSwing.x = px;
    armSwing.y = py;
    armSwing.zIndex = 100001;
    this.worldContainer.addChild(armSwing);

    let elapsed = 0;
    const anim = () => {
      elapsed += 1 / 60;
      const progress = elapsed / 0.25;
      g.alpha = Math.max(0, 1 - progress);
      g.scale.set(1 + elapsed * 2);
      g.rotation = dir * elapsed * 2;
      armSwing.alpha = Math.max(0, 1 - progress * 1.5);
      if (elapsed < 0.25) requestAnimationFrame(anim);
      else { g.destroy(); armSwing.destroy(); }
    };
    requestAnimationFrame(anim);
  }

  private handleSkill(index: number): void {
    const champ = GameManager.shared.champion;
    if (!champ || index >= champ.equippedSkillIDs.length) return;

    const skillID = champ.equippedSkillIDs[index];
    const skill = gameData.skill(skillID);
    if (!skill) return;

    if (champ.currentInvestiture < skill.investitureCost) return;
    champ.currentInvestiture -= skill.investitureCost;
    this.actionButtons.startCooldown(index, skill.cooldown);

    // Skill visual effect
    this.showSkillEffect(skill.range * 32);

    const range = skill.range * 32;
    for (const enemy of this.enemies) {
      if (enemy.isDead) continue;
      const dist = Math.hypot(enemy.position.x - this.playerScreenPos.x, enemy.position.y - this.playerScreenPos.y);
      if (dist < range) {
        const damage = skill.baseDamage + Math.floor(champ.baseStats.spirit * 0.5);
        enemy.hp -= damage;
        this.showDamageNumber(enemy.position.x, enemy.position.y - 30, damage, false);
        this.drawEnemyHP(enemy.hpBar, enemy.hp / enemy.data.maxHP);
        if (enemy.hp <= 0) this.killEnemy(enemy);
      }
    }
  }

  private showSkillEffect(range: number): void {
    const cls = GameManager.shared.champion?.championClass ?? 'mistborn';
    const px = this.playerScreenPos.x;
    const py = this.playerScreenPos.y;

    // Class-specific colors and effects
    const skillConfigs: Record<string, { color1: number; color2: number; particleColor: number }> = {
      mistborn:         { color1: 0x4488ff, color2: 0x6699cc, particleColor: 0x88aacc },
      radiant:          { color1: 0x44aaff, color2: 0x88ccff, particleColor: 0xaaddff },
      awakener:         { color1: 0xaa44ff, color2: 0xcc88ff, particleColor: 0xdd99ff },
      elantrian:        { color1: 0xffaa33, color2: 0xffcc66, particleColor: 0xffdd88 },
      sandMaster:       { color1: 0xddaa33, color2: 0xeecc66, particleColor: 0xddcc88 },
      nightmarePainter: { color1: 0x6633aa, color2: 0x8855cc, particleColor: 0xaa77ee },
    };

    const cfg = skillConfigs[cls] ?? skillConfigs.mistborn;

    // Main AOE ring
    const g = new Graphics();
    g.circle(0, 0, range).fill({ color: cfg.color1, alpha: 0.12 });
    g.circle(0, 0, range).stroke({ color: cfg.color2, width: 2.5, alpha: 0.6 });
    g.circle(0, 0, range * 0.7).stroke({ color: cfg.color1, width: 1.5, alpha: 0.3 });
    g.x = px;
    g.y = py;
    g.zIndex = 100000;
    this.worldContainer.addChild(g);

    // Inner burst effect
    const burst = new Graphics();
    if (cls === 'mistborn') {
      // Blue metal lines radiating out
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        burst.moveTo(0, 0).lineTo(Math.cos(angle) * range * 0.8, Math.sin(angle) * range * 0.8)
          .stroke({ color: 0x4488ff, width: 1, alpha: 0.4 });
      }
    } else if (cls === 'radiant') {
      // Stormlight burst glow
      burst.circle(0, 0, range * 0.5).fill({ color: 0x88ccff, alpha: 0.15 });
      burst.circle(0, 0, range * 0.3).fill({ color: 0xaaddff, alpha: 0.1 });
    } else if (cls === 'elantrian') {
      // Aon glyph pattern
      burst.circle(0, 0, range * 0.6).stroke({ color: 0xffcc44, width: 1.5, alpha: 0.4 });
      burst.moveTo(-range * 0.4, 0).lineTo(range * 0.4, 0).stroke({ color: 0xffcc44, width: 1, alpha: 0.3 });
      burst.moveTo(0, -range * 0.4).lineTo(0, range * 0.4).stroke({ color: 0xffcc44, width: 1, alpha: 0.3 });
    } else if (cls === 'awakener') {
      // Color wave
      const colors = [0xff4466, 0x44aaff, 0xffaa22, 0x44ff66, 0xaa44ff];
      for (let i = 0; i < 5; i++) {
        const r = range * (0.3 + i * 0.12);
        burst.circle(0, 0, r).stroke({ color: colors[i], width: 1.5, alpha: 0.2 });
      }
    } else if (cls === 'sandMaster') {
      // Sand spiral
      for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 4;
        const r = (i / 20) * range * 0.8;
        burst.circle(Math.cos(angle) * r, Math.sin(angle) * r, 1.5).fill({ color: 0xddcc88, alpha: 0.4 });
      }
    } else {
      // Nightmare ink splash
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const r = range * 0.5;
        burst.ellipse(Math.cos(angle) * r, Math.sin(angle) * r, 4, 6).fill({ color: 0x222233, alpha: 0.3 });
      }
    }
    burst.x = px;
    burst.y = py;
    burst.zIndex = 100001;
    this.worldContainer.addChild(burst);

    // Particle burst
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 + Math.random() * 0.3;
      const speed = 40 + Math.random() * 30;
      const p = new Graphics();
      p.circle(0, 0, 1.5 + Math.random()).fill({ color: cfg.particleColor, alpha: 0.6 });
      p.x = px;
      p.y = py;
      p.zIndex = 100002;
      this.worldContainer.addChild(p);
      this.particles.push({
        sprite: p, x: px, y: py,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 10,
        life: 0.5 + Math.random() * 0.3, maxLife: 0.8, size: 2,
      });
    }

    let elapsed = 0;
    const anim = () => {
      elapsed += 1 / 60;
      const progress = elapsed / 0.5;
      g.alpha = Math.max(0, 1 - progress);
      g.scale.set(0.3 + progress * 0.8);
      burst.alpha = Math.max(0, 1 - progress * 1.2);
      burst.scale.set(0.5 + progress * 0.6);
      burst.rotation = elapsed * 2;
      if (elapsed < 0.5) requestAnimationFrame(anim);
      else { g.destroy(); burst.destroy(); }
    };
    requestAnimationFrame(anim);
  }

  private enemyAttacksPlayer(enemy: EnemyInstance): void {
    const champ = GameManager.shared.champion;
    if (!champ) return;

    const defense = champ.baseStats.vigor / 2;
    const damage = Math.max(1, enemy.data.damage - defense);
    champ.currentHP -= damage;

    this.showDamageNumber(this.playerScreenPos.x, this.playerScreenPos.y - 40, damage, false, 0xff4444);

    // Screen shake effect
    this.shakeCamera(3, 0.15);

    if (champ.currentHP <= 0) {
      champ.currentHP = 0;
      setTimeout(() => {
        champ.currentHP = GameManager.shared.maxHP;
        champ.currentInvestiture = GameManager.shared.maxInvestiture;
      }, 1000);
    }
  }

  private killEnemy(enemy: EnemyInstance): void {
    enemy.isDead = true;
    enemy.state = 'dead';
    enemy.sprite.visible = false;
    enemy.respawnTimer = enemy.spawn.respawnTime ?? 999;

    // Death particles
    for (let i = 0; i < 6; i++) {
      const p = new Graphics();
      p.circle(0, 0, 2).fill({ color: 0xff6644, alpha: 0.6 });
      p.x = enemy.position.x;
      p.y = enemy.position.y;
      this.worldContainer.addChild(p);

      const angle = (i / 6) * Math.PI * 2;
      const speed = 30 + Math.random() * 20;
      this.particles.push({
        sprite: p, x: p.x, y: p.y,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 20,
        life: 0.5, maxLife: 0.5, size: 2,
      });
    }

    const gm = GameManager.shared;
    const champ = gm.champion;
    if (!champ) return;

    const gold = enemy.data.goldMin + Math.floor(Math.random() * (enemy.data.goldMax - enemy.data.goldMin + 1));
    champ.gold += gold;
    const leveledUp = gm.grantXP(enemy.data.xpReward);

    this.showDamageNumber(enemy.position.x, enemy.position.y - 10, enemy.data.xpReward, false, 0x66cc44);
    setTimeout(() => {
      this.showDamageNumber(enemy.position.x + 10, enemy.position.y, gold, false, 0xe6cc33);
    }, 200);

    if (leveledUp) {
      this.showLevelUp();
    }
  }

  private updateCombat(dt: number): void {
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
  }

  // ─── Visual Effects ──────────────────────────────────────────

  private showDamageNumber(x: number, y: number, amount: number, isCrit: boolean, color = 0xffffff): void {
    const style = new TextStyle({
      fontFamily: 'sans-serif',
      fontSize: isCrit ? 18 : 13,
      fill: isCrit ? 0xffee44 : color,
      fontWeight: 'bold',
      dropShadow: { color: 0x000000, blur: 2, distance: 1 },
    });
    const txt = new Text({ text: isCrit ? `${amount}!` : `${amount}`, style });
    txt.anchor.set(0.5);
    txt.x = x + (Math.random() - 0.5) * 20;
    txt.y = y;
    txt.zIndex = 100001;
    this.worldContainer.addChild(txt);

    const startY = txt.y;
    let elapsed = 0;
    const anim = () => {
      elapsed += 1 / 60;
      txt.y = startY - elapsed * 50;
      txt.alpha = Math.max(0, 1 - elapsed / 0.8);
      if (elapsed < 0.8) requestAnimationFrame(anim);
      else txt.destroy();
    };
    requestAnimationFrame(anim);
  }

  private showFloatingText(x: number, y: number, msg: string, color: number): void {
    const style = new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 10, fill: color,
      dropShadow: { color: 0x000000, blur: 2, distance: 1 },
    });
    const txt = new Text({ text: msg, style });
    txt.anchor.set(0.5);
    txt.x = x;
    txt.y = y;
    txt.zIndex = 100001;
    this.worldContainer.addChild(txt);

    let elapsed = 0;
    const anim = () => {
      elapsed += 1 / 60;
      txt.y -= 0.5;
      txt.alpha = Math.max(0, 1 - elapsed / 2);
      if (elapsed < 2) requestAnimationFrame(anim);
      else txt.destroy();
    };
    requestAnimationFrame(anim);
  }

  private showLevelUp(): void {
    const w = this.app.screen.width;
    const h = this.app.screen.height;

    // Background flash
    const flash = new Graphics();
    flash.rect(0, 0, w, h).fill({ color: 0xe6cc66, alpha: 0.15 });
    flash.zIndex = 998;
    this.uiContainer.addChild(flash);

    const style = new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 22, fill: 0xe6cc66,
      fontWeight: 'bold',
      dropShadow: { color: 0x000000, blur: 4, distance: 2 },
    });
    const txt = new Text({ text: 'NIVEAU SUPÉRIEUR!', style });
    txt.anchor.set(0.5);
    txt.x = w / 2;
    txt.y = h / 2 - 50;
    txt.zIndex = 1000;
    this.uiContainer.addChild(txt);

    let elapsed = 0;
    const anim = () => {
      elapsed += 1 / 60;
      txt.y -= 0.3;
      txt.alpha = Math.max(0, 1 - elapsed / 2.5);
      flash.alpha = Math.max(0, 0.15 - elapsed / 2);
      if (elapsed < 2.5) requestAnimationFrame(anim);
      else { txt.destroy(); flash.destroy(); }
    };
    requestAnimationFrame(anim);
  }

  private shakeCamera(intensity: number, duration: number): void {
    const originalX = this.worldContainer.x;
    const originalY = this.worldContainer.y;
    let elapsed = 0;

    const shake = () => {
      elapsed += 1 / 60;
      const progress = elapsed / duration;
      const decay = 1 - progress;
      this.worldContainer.x = originalX + (Math.random() - 0.5) * intensity * 2 * decay;
      this.worldContainer.y = originalY + (Math.random() - 0.5) * intensity * 2 * decay;
      if (elapsed < duration) requestAnimationFrame(shake);
    };
    requestAnimationFrame(shake);
  }

  // ─── Camera ──────────────────────────────────────────────────

  private updateCamera(): void {
    const w = this.app.screen.width;
    const h = this.app.screen.height;

    const targetX = w / 2 - this.playerScreenPos.x;
    const targetY = h / 2 - this.playerScreenPos.y;

    this.worldContainer.x += (targetX - this.worldContainer.x) * 0.1;
    this.worldContainer.y += (targetY - this.worldContainer.y) * 0.1;
  }

  // ─── Zone Transitions ────────────────────────────────────────

  private checkZoneExit(): void {
    if (this.isTransitioning) return;

    for (const conn of this.zone.connections) {
      const exitPos = isoToScreen(conn.exitPosition.col, conn.exitPosition.row);
      const dist = Math.hypot(exitPos.x - this.playerScreenPos.x, exitPos.y - this.playerScreenPos.y);

      if (dist < 30) {
        const targetZone = gameData.zone(conn.targetZoneID);
        if (!targetZone) continue;

        if (conn.requiredQuestID) {
          const champ = GameManager.shared.champion;
          if (!champ?.completedQuestIDs.includes(conn.requiredQuestID)) continue;
        }

        const champ = GameManager.shared.champion;
        if (champ) {
          this.isTransitioning = true;

          // Transition effect
          const flash = new Graphics();
          flash.rect(0, 0, this.app.screen.width, this.app.screen.height).fill({ color: 0x000000, alpha: 0 });
          flash.zIndex = 99999;
          this.uiContainer.addChild(flash);

          let elapsed = 0;
          const fadeOut = () => {
            elapsed += 1 / 60;
            flash.clear();
            flash.rect(0, 0, this.app.screen.width, this.app.screen.height).fill({ color: 0x000000, alpha: Math.min(1, elapsed / 0.4) });
            if (elapsed < 0.4) {
              requestAnimationFrame(fadeOut);
            } else {
              champ.currentZoneID = conn.targetZoneID;
              champ.gridPosition = { ...targetZone.playerSpawnPosition };
              GameManager.shared.save();
              this.router.goto(ZoneScene);
            }
          };
          requestAnimationFrame(fadeOut);
        }
        return;
      }
    }
  }

  // ─── Z-Sorting ───────────────────────────────────────────────

  private sortZOrder(): void {
    for (const child of this.worldContainer.children) {
      if (child.zIndex < -900) continue; // Don't re-sort tilemap/edge
      if (child === this.particleContainer) continue;
      child.zIndex = child.y;
    }
    // Player always on top of same-Y entities
    this.playerContainer.zIndex = this.playerContainer.y + 0.5;
  }

  // ─── Utilities ───────────────────────────────────────────────

  private darkenColor(color: number, amount: number): number {
    const r = Math.max(0, ((color >> 16) & 0xff) * (1 - amount));
    const g = Math.max(0, ((color >> 8) & 0xff) * (1 - amount));
    const b = Math.max(0, (color & 0xff) * (1 - amount));
    return (Math.floor(r) << 16) | (Math.floor(g) << 8) | Math.floor(b);
  }

  private lightenColor(color: number, amount: number): number {
    const r = Math.min(255, ((color >> 16) & 0xff) * (1 + amount));
    const g = Math.min(255, ((color >> 8) & 0xff) * (1 + amount));
    const b = Math.min(255, (color & 0xff) * (1 + amount));
    return (Math.floor(r) << 16) | (Math.floor(g) << 8) | Math.floor(b);
  }
}
