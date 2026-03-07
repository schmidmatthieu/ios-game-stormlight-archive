import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { GameScene } from '../game/SceneRouter';
import { SceneRouter } from '../game/SceneRouter';
import { GameManager } from '../game/GameManager';
import { gameData } from '../data/DataLoader';
import { VirtualJoystick } from '../ui/VirtualJoystick';
import { ActionButtons } from '../ui/ActionButtons';
import { HUD } from '../ui/HUD';
import type { Zone, Enemy, EnemySpawn, GridPosition } from '../data/types';

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

  // Interaction
  private interactPrompt: Text | null = null;

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
    this.uiContainer.addChild(this.actionButtons);

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
    const density = this.zone.type === 'hub' ? 0.08 : 0.05;

    for (let col = 0; col < gw; col++) {
      for (let row = 0; row < gh; row++) {
        const seed = col * 1337 + row * 7919;
        const rand = seededRandom(seed);
        if (rand > density) continue;

        // Don't place near spawn
        const spawnDist = Math.hypot(col - this.zone.playerSpawnPosition.col, row - this.zone.playerSpawnPosition.row);
        if (spawnDist < 3) continue;

        // Don't place on NPCs or enemies
        const occupiedByNPC = this.zone.npcSpawns.some(n => Math.abs(n.position.col - col) < 2 && Math.abs(n.position.row - row) < 2);
        const occupiedByEnemy = this.zone.enemySpawns.some(e => Math.abs(e.position.col - col) < 2 && Math.abs(e.position.row - row) < 2);
        if (occupiedByNPC || occupiedByEnemy) continue;

        const pos = isoToScreen(col, row);
        const decoType = Math.floor(seededRandom(seed + 42) * 5);
        const deco = this.createDecoration(decoType, pos, seed);
        if (deco) {
          deco.zIndex = pos.y;
          this.worldContainer.addChild(deco);
        }
      }
    }
  }

  private createDecoration(type: number, pos: { x: number; y: number }, seed: number): Graphics | null {
    const g = new Graphics();
    const worldID = this.zone.worldID;

    if (worldID === 'scadrial') {
      switch (type) {
        case 0: // Ash pile
          g.ellipse(pos.x, pos.y, 8 + seededRandom(seed + 1) * 6, 4).fill({ color: 0x444038, alpha: 0.6 });
          break;
        case 1: // Dead tree
          g.rect(pos.x - 1.5, pos.y - 22, 3, 22).fill({ color: 0x3a2a1a, alpha: 0.8 });
          // Branches
          g.moveTo(pos.x, pos.y - 18).lineTo(pos.x - 8, pos.y - 26).stroke({ color: 0x3a2a1a, width: 1.5, alpha: 0.7 });
          g.moveTo(pos.x, pos.y - 14).lineTo(pos.x + 6, pos.y - 22).stroke({ color: 0x3a2a1a, width: 1.5, alpha: 0.7 });
          break;
        case 2: // Metal shard
          g.poly([
            { x: pos.x, y: pos.y - 10 },
            { x: pos.x + 4, y: pos.y - 2 },
            { x: pos.x + 2, y: pos.y },
            { x: pos.x - 2, y: pos.y },
            { x: pos.x - 3, y: pos.y - 4 },
          ]).fill({ color: 0x667788, alpha: 0.6 });
          break;
        case 3: // Ruined wall
          g.rect(pos.x - 10, pos.y - 12, 20, 12).fill({ color: 0x3a3030, alpha: 0.7 });
          g.rect(pos.x - 8, pos.y - 16, 6, 4).fill({ color: 0x3a3030, alpha: 0.5 });
          break;
        case 4: // Barrel
          g.ellipse(pos.x, pos.y - 3, 6, 4).fill({ color: 0x443322, alpha: 0.8 });
          g.rect(pos.x - 6, pos.y - 12, 12, 9).fill({ color: 0x553322, alpha: 0.8 });
          g.ellipse(pos.x, pos.y - 12, 6, 4).fill({ color: 0x664433, alpha: 0.8 });
          break;
      }
    } else if (worldID === 'roshar') {
      switch (type) {
        case 0: // Rock formation
          g.poly([
            { x: pos.x - 8, y: pos.y },
            { x: pos.x - 5, y: pos.y - 14 },
            { x: pos.x + 2, y: pos.y - 18 },
            { x: pos.x + 8, y: pos.y - 8 },
            { x: pos.x + 6, y: pos.y },
          ]).fill({ color: 0x556677, alpha: 0.7 });
          break;
        case 1: // Storm post
          g.rect(pos.x - 2, pos.y - 28, 4, 28).fill({ color: 0x445566, alpha: 0.8 });
          g.circle(pos.x, pos.y - 30, 4).fill({ color: 0x66aaff, alpha: 0.5 });
          break;
        default: // Cremling shelter (small rock)
          g.ellipse(pos.x, pos.y - 3, 6 + seededRandom(seed) * 4, 4).fill({ color: 0x445566, alpha: 0.6 });
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
    const classColors: Record<string, number> = {
      mistborn: 0x4488ff, radiant: 0x44aaff, awakener: 0xaa44ff,
      elantrian: 0xffaa44, sandMaster: 0xddaa44, nightmarePainter: 0x8844aa,
    };
    const bodyColor = classColors[champ?.championClass ?? 'mistborn'] ?? 0x4488ff;

    // Feet
    this.playerSprite.ellipse(-3, -2, 3, 2).fill({ color: 0x332222, alpha: 0.9 });
    this.playerSprite.ellipse(3, -2, 3, 2).fill({ color: 0x332222, alpha: 0.9 });

    // Body (cloak/robe)
    this.playerSprite.poly([
      { x: -10, y: -4 }, { x: -8, y: -20 },
      { x: 0, y: -24 },
      { x: 8, y: -20 }, { x: 10, y: -4 },
    ]).fill({ color: bodyColor, alpha: 0.9 });

    // Body highlight
    this.playerSprite.poly([
      { x: -5, y: -6 }, { x: -4, y: -18 },
      { x: 0, y: -22 }, { x: 2, y: -18 }, { x: 3, y: -6 },
    ]).fill({ color: this.lightenColor(bodyColor, 0.2), alpha: 0.5 });

    // Head
    this.playerSprite.circle(0, -28, 6).fill({ color: 0xeebb99, alpha: 0.95 });

    // Eyes
    this.playerSprite.circle(-2, -29, 1).fill(0x222244);
    this.playerSprite.circle(2, -29, 1).fill(0x222244);

    // Class glow effect
    this.playerSprite.circle(0, -16, 14).fill({ color: bodyColor, alpha: 0.08 });
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

  private interactWithNPC(spawn: { npcID: string; isShopkeeper: boolean; dialogueTreeID: string | null }): void {
    // Show a simple interaction feedback
    const pos = this.npcs.find(n => n.id === spawn.npcID)?.position;
    if (!pos) return;

    const msg = spawn.isShopkeeper ? 'Boutique bientôt disponible...' : 'Dialogue bientôt disponible...';
    this.showFloatingText(pos.x, pos.y - 50, msg, 0xeedd88);
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
    this.checkNPCProximity();
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

  private checkNPCProximity(): void {
    let nearNPC = false;
    for (const npc of this.npcs) {
      const dist = Math.hypot(npc.position.x - this.playerScreenPos.x, npc.position.y - this.playerScreenPos.y);
      if (dist < 50) {
        nearNPC = true;
        if (!this.interactPrompt) {
          this.interactPrompt = new Text({
            text: 'Toucher pour parler',
            style: new TextStyle({
              fontFamily: 'Georgia, serif', fontSize: 10, fill: 0xeedd88,
              dropShadow: { color: 0x000000, blur: 3, distance: 1 },
            }),
          });
          this.interactPrompt.anchor.set(0.5);
          this.interactPrompt.x = this.app.screen.width / 2;
          this.interactPrompt.y = this.app.screen.height * 0.7;
          this.uiContainer.addChild(this.interactPrompt);
        }
        break;
      }
    }

    if (!nearNPC && this.interactPrompt) {
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
    const g = new Graphics();
    const dir = this.playerFacing === 'right' ? 1 : -1;
    g.arc(0, 0, 30, -Math.PI / 3 * dir, Math.PI / 3 * dir)
      .stroke({ color: 0xffffff, width: 2, alpha: 0.6 });
    g.x = this.playerScreenPos.x + dir * 15;
    g.y = this.playerScreenPos.y - 10;
    g.zIndex = 100000;
    this.worldContainer.addChild(g);

    let elapsed = 0;
    const anim = () => {
      elapsed += 1 / 60;
      g.alpha = Math.max(0, 1 - elapsed / 0.2);
      g.scale.set(1 + elapsed * 3);
      if (elapsed < 0.2) requestAnimationFrame(anim);
      else g.destroy();
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
    const g = new Graphics();
    g.circle(0, 0, range).fill({ color: 0x4488ff, alpha: 0.15 })
      .stroke({ color: 0x66aaff, width: 2, alpha: 0.5 });
    g.x = this.playerScreenPos.x;
    g.y = this.playerScreenPos.y;
    g.zIndex = 100000;
    this.worldContainer.addChild(g);

    let elapsed = 0;
    const anim = () => {
      elapsed += 1 / 60;
      g.alpha = Math.max(0, 1 - elapsed / 0.4);
      g.scale.set(0.5 + elapsed * 2);
      if (elapsed < 0.4) requestAnimationFrame(anim);
      else g.destroy();
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
          champ.currentZoneID = conn.targetZoneID;
          champ.gridPosition = { ...targetZone.playerSpawnPosition };
          GameManager.shared.save();
          this.router.goto(ZoneScene);
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
