import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { GameScene } from '../game/SceneRouter';
import { SceneRouter } from '../game/SceneRouter';
import { GameManager } from '../game/GameManager';
import { gameData } from '../data/DataLoader';
import { VirtualJoystick } from '../ui/VirtualJoystick';
import { ActionButtons } from '../ui/ActionButtons';
import { HUD } from '../ui/HUD';
import { InventoryPanel } from '../ui/InventoryPanel';
import { showDialoguePanel, showShopPanel } from '../ui/DialoguePanel';
import { showCraftingPanel, getRecipeEffect } from '../ui/CraftingPanel';
import { showPauseMenu } from '../ui/PauseMenu';
import { QuestTracker } from '../ui/QuestTracker';
import { Minimap } from '../ui/Minimap';
import { showDeathScreen } from '../ui/DeathScreen';
import { QuestManager } from '../game/QuestManager';
import { createWorldMechanics, ScadrialMechanics, KomashiMechanics } from '../game/WorldMechanics';
import type { WorldEffect } from '../game/WorldMechanics';
import { BossState, createBossHPBar, createBossSpecialEffect } from '../game/BossMechanics';
import { drawPlayerCharacter, lighten, darken } from '../rendering/PlayerRenderer';
import { CharacterAnimator, applyAnimationToPlayer, drawClassAura, animateEnemyHit, animateEnemyDeath, animateLevelUpBurst } from '../rendering/CharacterAnimations';
import { drawEnemySprite } from '../rendering/EnemyRenderer';
import { createAttackEffect, createSkillEffect } from '../rendering/SpellEffects';
import { spawnLootDrop, spawnGoldBurst, spawnXPOrbs } from '../rendering/LootAnimations';
import { WeatherManager, createWeatherOverlay } from '../rendering/WeatherSystem';
import { DayNightManager, createDayNightOverlay } from '../rendering/DayNightCycle';
import type { BlendedTimeConfig } from '../rendering/DayNightCycle';
import { BestiaryManager } from '../game/BestiarySystem';
import { showBestiaryPanel } from '../ui/BestiaryPanel';
import { AchievementManager } from '../game/AchievementSystem';
import { createAchievementToast, showAchievementPanel } from '../ui/AchievementUI';
import { showSkillTreePanel } from '../ui/SkillTreePanel';
import { CompanionManager } from '../game/CompanionSystem';
import { showCompanionPanel } from '../ui/CompanionPanel';
import { NPCRelationshipManager, LEVEL_LABELS, LEVEL_COLORS } from '../game/NPCRelationships';
import { ComboManager, createComboDisplay } from '../game/ComboSystem';
import { WorldEventManager } from '../game/WorldEvents';
import type { WorldEventEffect } from '../game/WorldEvents';
import { createWorldEventBanner } from '../ui/WorldEventBanner';
import { WorldMapScene } from './WorldMapScene';
import { spawnWalls, spawnEnterableBuildings, spawnSecretAreas, revealSecret } from '../rendering/MapStructures';
import type { WallSegment, EnterableBuilding, SecretArea } from '../rendering/MapStructures';
import type { SpellParticle } from '../rendering/SpellEffects';
import { addReputation, createReputationBadge, showRankUpEffect, getBonusXPMultiplier } from '../game/ReputationSystem';
import { StatusEffectManager, createStatusBar, spawnStatusParticle } from '../game/StatusEffects';
import type { ActiveStatusEffect } from '../game/StatusEffects';
import type { Zone, Enemy, EnemySpawn, GridPosition, ZoneConnection, ChampionClass } from '../data/types';
import type { ActionMode } from '../ui/ActionButtons';
import { getLayoutInfo, joystickPosition, actionButtonsPosition, minimapPosition, hudMargin, toolbarY, toolbarButtonSize, scaled, fontSize } from '../ui/ResponsiveLayout';
import type { LayoutInfo } from '../ui/ResponsiveLayout';

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
  bossState?: BossState;
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
  private playerAnimator!: CharacterAnimator;
  private playerAuraSprite: Graphics | null = null;

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

  // Quest tracker
  private questTracker!: QuestTracker;

  // Minimap
  private minimap!: Minimap;

  // Death screen
  private deathScreen: Container | null = null;

  // World mechanics
  private worldMechanics!: WorldEffect;

  // Map structures
  private walls: WallSegment[] = [];
  private enterableBuildings: EnterableBuilding[] = [];
  private secretAreas: SecretArea[] = [];
  private nearbyBuilding: EnterableBuilding | null = null;
  private nearbySecret: SecretArea | null = null;

  // Boss fight
  private activeBoss: EnemyInstance | null = null;
  private bossHPBar: { container: Container; update: (hp: number, phase: string) => void; destroy: () => void } | null = null;

  // Reputation badge
  private repBadge: { container: Container; refresh: () => void } | null = null;

  // Status effects
  private playerStatusEffects = new StatusEffectManager();
  private statusBar: { container: Container; update: (effects: ActiveStatusEffect[]) => void } | null = null;
  private statusParticleTimer = 0;

  // Day/Night cycle
  private dayNightManager!: DayNightManager;
  private dayNightOverlay: { overlay: Graphics; stars: Container; timeLabel: Text; update: (config: BlendedTimeConfig) => void } | null = null;

  // Weather
  private weatherManager!: WeatherManager;
  private weatherOverlay: { overlay: Graphics; label: Text; update: (config: any, lightning: number) => void } | null = null;
  private achievementToast: { update: (dt: number) => void } | null = null;

  // Companion
  private companionSprite: Graphics | null = null;
  private companionPos = { x: 0, y: 0 };
  private companionAnimTimer = 0;

  // Combo system
  private comboDisplay: { update: () => void } | null = null;

  // World events
  private eventBanner: { update: (dt: number) => void } | null = null;
  private activeEventEffect: WorldEventEffect | null = null;

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

    // Walls, enterable buildings, and secret areas
    this.walls = spawnWalls(
      this.worldContainer, isoToScreen,
      this.zone.gridWidth, this.zone.gridHeight,
      this.zone.worldID, this.zone.playerSpawnPosition,
      this.zone.connections, this.zone.npcSpawns,
    );
    this.enterableBuildings = spawnEnterableBuildings(
      this.worldContainer, isoToScreen,
      this.zone.gridWidth, this.zone.gridHeight,
      this.zone.worldID, this.zone.playerSpawnPosition,
      this.zone.connections, this.zone.npcSpawns, this.zone.type,
    );
    this.secretAreas = spawnSecretAreas(
      this.worldContainer, isoToScreen,
      this.zone.gridWidth, this.zone.gridHeight,
      this.zone.worldID, this.zone.playerSpawnPosition,
    );

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

    // Reputation badge
    this.repBadge = createReputationBadge(this.uiContainer, w, this.zone.worldID);

    // Status effect bar
    this.statusBar = createStatusBar(this.uiContainer, w);

    // Responsive layout
    const layout = getLayoutInfo(w, h);

    // Joystick
    this.joystick = new VirtualJoystick(layout);
    const joyPos = joystickPosition(layout);
    this.joystick.x = joyPos.x;
    this.joystick.y = joyPos.y;
    this.uiContainer.addChild(this.joystick);

    // Action buttons
    this.actionButtons = new ActionButtons(layout);
    const actPos = actionButtonsPosition(layout);
    this.actionButtons.x = actPos.x;
    this.actionButtons.y = actPos.y;
    this.actionButtons.onAttack = () => this.handleAttack();
    this.actionButtons.onSkill = (i) => this.handleSkill(i);
    this.actionButtons.onInteract = (mode) => this.handleInteraction(mode);
    this.uiContainer.addChild(this.actionButtons);

    // Auto-equip skills for class
    GameManager.shared.autoEquipSkills(gameData.skills);

    // Set skill button labels from equipped skills
    if (champ.equippedSkillIDs.length > 0) {
      for (let i = 0; i < champ.equippedSkillIDs.length && i < 4; i++) {
        const skill = gameData.skill(champ.equippedSkillIDs[i]);
        if (skill) {
          const shortName = skill.name.length > 5 ? skill.name.substring(0, 5) : skill.name;
          this.actionButtons.setSkill(i, skill.id, shortName);
        }
      }
    }

    // Pause button (top center)
    this.createPauseButton(w, layout);

    // Inventory button (next to pause)
    this.createInventoryButton(w, layout);

    // Crafting button (next to inventory)
    this.createCraftingButton(w, layout);

    // Bestiary button (next to crafting)
    this.createBestiaryButton(w, layout);

    // Achievements button (next to bestiary)
    this.createAchievementButton(w, layout);

    // Skill tree button (next to achievements)
    this.createSkillTreeButton(w, layout);

    // Companion button
    this.createCompanionButton(w, layout);

    // Initialize companion
    CompanionManager.shared.checkWorldUnlocks(this.zone.worldID);
    this.spawnCompanionSprite();

    // Combo display
    this.comboDisplay = createComboDisplay(this.uiContainer, w, h);
    ComboManager.shared.reset();

    // World events banner
    this.eventBanner = createWorldEventBanner(this.uiContainer, w);

    // World mechanics
    this.worldMechanics = createWorldMechanics(this.zone.worldID);

    // Day/night cycle
    this.dayNightManager = new DayNightManager(this.zone.worldID);
    this.dayNightOverlay = createDayNightOverlay(this.uiContainer, w, h);

    // Dynamic weather
    this.weatherManager = new WeatherManager(this.zone.worldID);
    this.weatherOverlay = createWeatherOverlay(this.uiContainer, w, h);

    // Achievement toast
    this.achievementToast = createAchievementToast(this.uiContainer, w);
    AchievementManager.shared.recordZoneVisit(this.zone.id, this.zone.worldID);
    AchievementManager.shared.recordLevel(GameManager.shared.champion?.level ?? 1);
    AchievementManager.shared.recordCreatureDiscovered(BestiaryManager.shared.totalDiscovered);
    AchievementManager.shared.check();

    // Quest system
    QuestManager.shared.init();
    QuestManager.shared.onZoneEntered(this.zone.id);

    // Quest tracker HUD
    this.questTracker = new QuestTracker(w, h);
    this.questTracker.refresh();
    this.uiContainer.addChild(this.questTracker);

    // Minimap
    this.minimap = new Minimap(w, h);
    this.minimap.setZone(this.zone.gridWidth, this.zone.gridHeight, this.zone.worldID, this.zone.id);
    this.uiContainer.addChild(this.minimap);

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

    // Character animator
    const champ = GameManager.shared.champion;
    this.playerAnimator = new CharacterAnimator(champ?.championClass ?? 'mistborn');

    this.playerContainer.x = this.playerScreenPos.x;
    this.playerContainer.y = this.playerScreenPos.y;
    this.worldContainer.addChild(this.playerContainer);
  }

  private drawPlayer(): void {
    const champ = GameManager.shared.champion;
    drawPlayerCharacter(this.playerSprite, champ?.championClass ?? 'mistborn');
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
        if (this.nearbyBuilding) {
          this.enterBuilding(this.nearbyBuilding);
        }
        // Zone exit handled by checkZoneExit
        break;
      case 'loot':
        if (this.nearbySecret) {
          this.interactWithSecret(this.nearbySecret);
        } else if (this.nearbyLoot) {
          this.collectLoot(this.nearbyLoot.id);
        }
        break;
    }
  }

  private enterBuilding(building: EnterableBuilding): void {
    if (this.dialoguePanel) return;
    this.isPaused = true;

    const champ = GameManager.shared.champion;
    const goldReward = 5 + Math.floor(Math.random() * 15);
    const xpReward = 10 + Math.floor(Math.random() * 20);

    const repGain = 3;
    if (champ) {
      champ.gold += goldReward;
      GameManager.shared.grantXP(xpReward);
      const repResult = addReputation(this.zone.worldID, repGain);
      if (repResult.rankUp) {
        showRankUpEffect(this.uiContainer, this.app.screen.width, this.app.screen.height, repResult.rankName, this.zone.worldID);
      }
      if (this.repBadge) this.repBadge.refresh();
    }

    const panel = new Container();
    panel.zIndex = 10000;

    const w = this.app.screen.width;
    const h = this.app.screen.height;

    const overlay = new Graphics();
    overlay.rect(0, 0, w, h).fill({ color: 0x000000, alpha: 0.5 });
    overlay.eventMode = 'static';
    panel.addChild(overlay);

    const panelH = 120;
    const panelY = h - panelH - 20;
    const bg = new Graphics();
    bg.roundRect(20, panelY, w - 40, panelH, 12)
      .fill({ color: 0x0a0815, alpha: 0.92 })
      .stroke({ color: 0x665533, width: 2, alpha: 0.7 });
    bg.eventMode = 'static';
    panel.addChild(bg);

    const title = new Text({
      text: building.name,
      style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 13, fill: 0xe6cc66, fontWeight: 'bold' }),
    });
    title.x = 36;
    title.y = panelY + 10;
    panel.addChild(title);

    const desc = new Text({
      text: `Vous explorez ${building.name}.\nVous trouvez quelques ressources utiles.`,
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 10, fill: 0xccccbb, wordWrap: true, wordWrapWidth: w - 80 }),
    });
    desc.x = 36;
    desc.y = panelY + 30;
    panel.addChild(desc);

    const reward = new Text({
      text: `+${xpReward} XP  +${goldReward} or  +${repGain} rep`,
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 10, fill: 0x66cc44, fontWeight: 'bold' }),
    });
    reward.anchor.set(1, 0);
    reward.x = w - 36;
    reward.y = panelY + 10;
    panel.addChild(reward);

    const closeHint = new Text({
      text: 'Toucher pour fermer',
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 9, fill: 0x888888 }),
    });
    closeHint.anchor.set(0.5);
    closeHint.x = w / 2;
    closeHint.y = panelY + panelH - 14;
    panel.addChild(closeHint);

    const close = () => {
      panel.destroy({ children: true });
      this.dialoguePanel = null;
      this.isPaused = false;
    };
    overlay.on('pointerdown', close);
    bg.on('pointerdown', close);

    this.dialoguePanel = panel;
    this.uiContainer.addChild(panel);
  }

  private interactWithSecret(secret: SecretArea): void {
    if (!secret.revealed) return;

    const champ = GameManager.shared.champion;
    if (!champ) return;

    // Grant rewards
    champ.gold += secret.loot.gold;
    GameManager.shared.grantXP(secret.loot.xp);
    const secretRepResult = addReputation(this.zone.worldID, 5);
    if (secretRepResult.rankUp) {
      showRankUpEffect(this.uiContainer, this.app.screen.width, this.app.screen.height, secretRepResult.rankName, this.zone.worldID);
    }
    if (this.repBadge) this.repBadge.refresh();

    if (secret.type === 'shrine') {
      // Shrine: heal, buff, and grant status effects
      champ.currentHP = GameManager.shared.maxHP;
      champ.currentInvestiture = GameManager.shared.maxInvestiture;
      this.playerStatusEffects.apply('regenerating', 15, 3);
      this.playerStatusEffects.apply('shielded', 20, 1);
      this.showFloatingText(secret.x, secret.y - 30, 'Bénédiction! PV, Inv, Bouclier + Régén!', 0x88ccff);
    } else {
      this.showFloatingText(secret.x, secret.y - 30,
        `${secret.loot.itemHint}! +${secret.loot.xp}XP +${secret.loot.gold}or`, 0xffdd44);
    }

    // Remove from interactable
    secret.sprite.alpha = 0.3;
    this.secretAreas = this.secretAreas.filter(s => s !== secret);
  }

  private interactWithNPC(spawn: { npcID: string; isShopkeeper: boolean; dialogueTreeID: string | null }): void {
    const npc = this.npcs.find(n => n.id === spawn.npcID);
    if (!npc) return;

    if (spawn.isShopkeeper) {
      this.showShop(spawn.npcID);
    } else {
      this.showDialogue(spawn.npcID, spawn.dialogueTreeID);
    }
  }

  private showDialogue(npcID: string, _dialogueTreeID: string | null): void {
    if (this.dialoguePanel) return;
    this.isPaused = true;

    // Track quest progress and NPC relationship
    QuestManager.shared.onNPCTalkedTo(npcID);
    this.checkQuestCompletion();
    const npcName = this.formatNPCName(npcID);
    NPCRelationshipManager.shared.recordTalk(npcID, npcName, this.zone.worldID);

    // Check for relationship level up
    const levelUp = NPCRelationshipManager.shared.popLevelUp();
    if (levelUp) {
      const color = LEVEL_COLORS[levelUp.level] ?? 0xffffff;
      const label = LEVEL_LABELS[levelUp.level] ?? levelUp.level;
      setTimeout(() => {
        this.showFloatingText(
          this.playerScreenPos.x, this.playerScreenPos.y - 70,
          `${levelUp.npcName}: ${label}!`, color,
        );
      }, 500);
    }

    // Show relationship info as floating text
    const level = NPCRelationshipManager.shared.getLevel(npcID);
    const levelLabel = LEVEL_LABELS[level];
    const levelColor = LEVEL_COLORS[level];
    const affinity = NPCRelationshipManager.shared.getAffinityPercent(npcID);
    this.showFloatingText(
      this.playerScreenPos.x + 30, this.playerScreenPos.y - 40,
      `${levelLabel} (${affinity}%)`, levelColor,
    );

    this.dialoguePanel = showDialoguePanel(
      this.uiContainer, this.app.screen.width, this.app.screen.height,
      this.zone.worldID, npcName, () => this.closeDialogue(),
    );
  }

  private closeDialogue(): void {
    if (this.dialoguePanel) {
      this.dialoguePanel.destroy({ children: true });
      this.dialoguePanel = null;
    }
    this.isPaused = false;
  }

  private showShop(npcID: string): void {
    if (this.dialoguePanel) return;
    this.isPaused = true;
    this.dialoguePanel = showShopPanel(
      this.uiContainer, this.app.screen.width, this.app.screen.height,
      () => this.closeDialogue(),
      (x, y, msg, color) => this.showFloatingText(x, y, msg, color),
      this.playerScreenPos,
    );
  }

  private createPauseButton(screenWidth: number, layout: LayoutInfo): void {
    const btnSize = toolbarButtonSize(layout);
    const btnW = scaled(36, layout);
    const btnH = scaled(28, layout);
    const btn = new Container();
    const bg = new Graphics();
    bg.roundRect(0, 0, btnW, btnH, scaled(6, layout))
      .fill({ color: 0x1a1528, alpha: 0.7 })
      .stroke({ color: 0x443355, width: 1, alpha: 0.5 });
    btn.addChild(bg);
    const icon = new Graphics();
    icon.rect(scaled(10, layout), scaled(6, layout), scaled(4, layout), scaled(16, layout)).fill({ color: 0xcccccc, alpha: 0.8 });
    icon.rect(scaled(20, layout), scaled(6, layout), scaled(4, layout), scaled(16, layout)).fill({ color: 0xcccccc, alpha: 0.8 });
    btn.addChild(icon);
    btn.x = screenWidth / 2 - btnW / 2;
    btn.y = toolbarY(layout);
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.on('pointerdown', () => this.togglePause());
    this.uiContainer.addChild(btn);
  }

  private createInventoryButton(screenWidth: number, layout: LayoutInfo): void {
    const btnW = scaled(36, layout);
    const btnH = scaled(28, layout);
    const btn = new Container();
    const bg = new Graphics();
    bg.roundRect(0, 0, btnW, btnH, scaled(6, layout))
      .fill({ color: 0x1a1528, alpha: 0.7 })
      .stroke({ color: 0x443355, width: 1, alpha: 0.5 });
    btn.addChild(bg);
    // Bag icon
    const icon = new Graphics();
    icon.roundRect(scaled(10, layout), scaled(8, layout), scaled(16, layout), scaled(14, layout), scaled(3, layout)).fill({ color: 0xaa8855, alpha: 0.7 });
    icon.roundRect(scaled(10, layout), scaled(8, layout), scaled(16, layout), scaled(14, layout), scaled(3, layout)).stroke({ color: 0xccaa66, width: 1, alpha: 0.5 });
    icon.arc(scaled(18, layout), scaled(8, layout), scaled(5, layout), Math.PI, 0).stroke({ color: 0xccaa66, width: 1.5, alpha: 0.6 });
    btn.addChild(icon);
    btn.x = screenWidth / 2 + scaled(24, layout);
    btn.y = toolbarY(layout);
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.on('pointerdown', () => this.toggleInventory());
    this.uiContainer.addChild(btn);
  }

  private toggleInventory(): void {
    if (this.dialoguePanel) return;
    this.isPaused = true;
    this.dialoguePanel = new InventoryPanel(
      this.app.screen.width, this.app.screen.height,
      () => this.closeDialogue(),
    );
    this.uiContainer.addChild(this.dialoguePanel);
  }

  private createCraftingButton(screenWidth: number, layout: LayoutInfo): void {
    const btnW = scaled(36, layout);
    const btnH = scaled(28, layout);
    const btn = new Container();
    const bg = new Graphics();
    bg.roundRect(0, 0, btnW, btnH, scaled(6, layout))
      .fill({ color: 0x1a1528, alpha: 0.7 })
      .stroke({ color: 0x443355, width: 1, alpha: 0.5 });
    btn.addChild(bg);
    // Anvil icon
    const icon = new Graphics();
    icon.poly([{ x: scaled(12, layout), y: scaled(20, layout) }, { x: scaled(18, layout), y: scaled(10, layout) }, { x: scaled(24, layout), y: scaled(20, layout) }]).fill({ color: 0x888899, alpha: 0.7 });
    icon.rect(scaled(10, layout), scaled(20, layout), scaled(16, layout), scaled(3, layout)).fill({ color: 0x666677, alpha: 0.8 });
    icon.rect(scaled(16, layout), scaled(6, layout), scaled(4, layout), scaled(6, layout)).fill({ color: 0xaa8844, alpha: 0.7 });
    btn.addChild(icon);
    btn.x = screenWidth / 2 + scaled(66, layout);
    btn.y = toolbarY(layout);
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.on('pointerdown', () => this.toggleCrafting());
    this.uiContainer.addChild(btn);
  }

  private toggleCrafting(): void {
    if (this.dialoguePanel) return;
    this.isPaused = true;
    this.dialoguePanel = showCraftingPanel(
      this.uiContainer, this.app.screen.width, this.app.screen.height,
      this.zone.worldID,
      () => this.closeDialogue(),
      (recipeID) => this.applyCraftResult(recipeID),
    );
  }

  private createBestiaryButton(screenWidth: number, layout: LayoutInfo): void {
    const btnW = scaled(36, layout);
    const btnH = scaled(28, layout);
    const btn = new Container();
    const bg = new Graphics();
    bg.roundRect(0, 0, btnW, btnH, scaled(6, layout))
      .fill({ color: 0x1a1528, alpha: 0.7 })
      .stroke({ color: 0x443355, width: 1, alpha: 0.5 });
    btn.addChild(bg);
    // Book icon
    const icon = new Graphics();
    icon.roundRect(scaled(10, layout), scaled(7, layout), scaled(16, layout), scaled(16, layout), scaled(2, layout)).fill({ color: 0x557744, alpha: 0.7 });
    icon.rect(scaled(12, layout), scaled(9, layout), scaled(12, layout), scaled(1, layout)).fill({ color: 0xddddcc, alpha: 0.6 });
    icon.rect(scaled(12, layout), scaled(12, layout), scaled(10, layout), scaled(1, layout)).fill({ color: 0xddddcc, alpha: 0.5 });
    icon.rect(scaled(12, layout), scaled(15, layout), scaled(11, layout), scaled(1, layout)).fill({ color: 0xddddcc, alpha: 0.4 });
    icon.rect(scaled(10, layout), scaled(7, layout), scaled(2, layout), scaled(16, layout)).fill({ color: 0x445533, alpha: 0.8 });
    btn.addChild(icon);
    btn.x = screenWidth / 2 + scaled(108, layout);
    btn.y = toolbarY(layout);
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.on('pointerdown', () => this.toggleBestiary());
    this.uiContainer.addChild(btn);
  }

  private toggleBestiary(): void {
    if (this.dialoguePanel) return;
    this.isPaused = true;
    this.dialoguePanel = showBestiaryPanel(
      this.uiContainer, this.app.screen.width, this.app.screen.height,
      () => this.closeDialogue(),
    );
  }

  private createAchievementButton(screenWidth: number, layout: LayoutInfo): void {
    const btnW = scaled(36, layout);
    const btnH = scaled(28, layout);
    const btn = new Container();
    const bg = new Graphics();
    bg.roundRect(0, 0, btnW, btnH, scaled(6, layout))
      .fill({ color: 0x1a1528, alpha: 0.7 })
      .stroke({ color: 0x443355, width: 1, alpha: 0.5 });
    btn.addChild(bg);
    // Trophy icon
    const icon = new Graphics();
    icon.moveTo(scaled(14, layout), scaled(8, layout)).lineTo(scaled(22, layout), scaled(8, layout)).lineTo(scaled(21, layout), scaled(16, layout)).lineTo(scaled(15, layout), scaled(16, layout)).closePath().fill({ color: 0xe6cc66, alpha: 0.7 });
    icon.rect(scaled(16, layout), scaled(16, layout), scaled(4, layout), scaled(3, layout)).fill({ color: 0xccaa44, alpha: 0.7 });
    icon.rect(scaled(14, layout), scaled(19, layout), scaled(8, layout), scaled(2, layout)).fill({ color: 0xccaa44, alpha: 0.6 });
    btn.addChild(icon);
    btn.x = screenWidth / 2 + scaled(150, layout);
    btn.y = toolbarY(layout);
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.on('pointerdown', () => this.toggleAchievements());
    this.uiContainer.addChild(btn);
  }

  private toggleAchievements(): void {
    if (this.dialoguePanel) return;
    this.isPaused = true;
    this.dialoguePanel = showAchievementPanel(
      this.uiContainer, this.app.screen.width, this.app.screen.height,
      () => this.closeDialogue(),
    );
  }

  private createSkillTreeButton(screenWidth: number, layout: LayoutInfo): void {
    const btnW = scaled(36, layout);
    const btnH = scaled(28, layout);
    const btn = new Container();
    const bg = new Graphics();
    bg.roundRect(0, 0, btnW, btnH, scaled(6, layout))
      .fill({ color: 0x1a1528, alpha: 0.7 })
      .stroke({ color: 0x443355, width: 1, alpha: 0.5 });
    btn.addChild(bg);
    // Tree/branch icon
    const icon = new Graphics();
    icon.rect(scaled(17, layout), scaled(8, layout), scaled(2, layout), scaled(14, layout)).fill({ color: 0x5588cc, alpha: 0.7 });
    icon.circle(scaled(18, layout), scaled(8, layout), scaled(4, layout)).fill({ color: 0x5588cc, alpha: 0.6 });
    icon.circle(scaled(12, layout), scaled(14, layout), scaled(3, layout)).fill({ color: 0x4477aa, alpha: 0.5 });
    icon.circle(scaled(24, layout), scaled(14, layout), scaled(3, layout)).fill({ color: 0x4477aa, alpha: 0.5 });
    icon.moveTo(scaled(18, layout), scaled(12, layout)).lineTo(scaled(12, layout), scaled(14, layout)).stroke({ color: 0x5588cc, width: 1, alpha: 0.5 });
    icon.moveTo(scaled(18, layout), scaled(12, layout)).lineTo(scaled(24, layout), scaled(14, layout)).stroke({ color: 0x5588cc, width: 1, alpha: 0.5 });
    btn.addChild(icon);
    btn.x = screenWidth / 2 - scaled(60, layout);
    btn.y = toolbarY(layout);
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.on('pointerdown', () => this.toggleSkillTree());
    this.uiContainer.addChild(btn);
  }

  private toggleSkillTree(): void {
    if (this.dialoguePanel) return;
    this.isPaused = true;
    this.dialoguePanel = showSkillTreePanel(
      this.uiContainer, this.app.screen.width, this.app.screen.height,
      () => this.closeDialogue(),
    );
  }

  private createCompanionButton(screenWidth: number, layout: LayoutInfo): void {
    const btnW = scaled(36, layout);
    const btnH = scaled(28, layout);
    const btn = new Container();
    const bg = new Graphics();
    bg.roundRect(0, 0, btnW, btnH, scaled(6, layout))
      .fill({ color: 0x1a1528, alpha: 0.7 })
      .stroke({ color: 0x443355, width: 1, alpha: 0.5 });
    btn.addChild(bg);
    // Companion orb icon
    const icon = new Graphics();
    icon.circle(scaled(18, layout), scaled(15, layout), scaled(6, layout)).fill({ color: 0x88ccff, alpha: 0.5 });
    icon.circle(scaled(18, layout), scaled(15, layout), scaled(4, layout)).fill({ color: 0xaaddff, alpha: 0.7 });
    icon.circle(scaled(17, layout), scaled(14, layout), scaled(2, layout)).fill({ color: 0xffffff, alpha: 0.4 });
    btn.addChild(icon);
    btn.x = screenWidth / 2 - scaled(102, layout);
    btn.y = toolbarY(layout);
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.on('pointerdown', () => this.toggleCompanion());
    this.uiContainer.addChild(btn);
  }

  private toggleCompanion(): void {
    if (this.dialoguePanel) return;
    this.isPaused = true;
    this.dialoguePanel = showCompanionPanel(
      this.uiContainer, this.app.screen.width, this.app.screen.height,
      () => { this.closeDialogue(); this.spawnCompanionSprite(); },
    );
  }

  private applyCraftResult(recipeID: string): void {
    const effect = getRecipeEffect(recipeID);
    if (!effect) return;
    const champ = GameManager.shared.champion;
    if (!champ) return;

    switch (effect.type) {
      case 'heal_hp':
        champ.currentHP = Math.min(GameManager.shared.maxHP, champ.currentHP + effect.value);
        break;
      case 'heal_inv':
        champ.currentInvestiture = Math.min(GameManager.shared.maxInvestiture, champ.currentInvestiture + effect.value);
        break;
      case 'buff_strength':
        this.playerStatusEffects.apply('strengthened', effect.duration, effect.value);
        break;
      case 'buff_shield':
        this.playerStatusEffects.apply('shielded', effect.duration, effect.value);
        break;
      case 'buff_haste':
        this.playerStatusEffects.apply('haste', effect.duration, effect.value);
        break;
      case 'buff_regen':
        this.playerStatusEffects.apply('regenerating', effect.duration, effect.value);
        break;
      case 'multi_buff':
        // World enchantments give multiple buffs
        if (effect.value === 1) { // Mist
          this.playerStatusEffects.apply('shielded', effect.duration, 1);
          this.playerStatusEffects.apply('haste', effect.duration, 1);
        } else if (effect.value === 2) { // Storm
          this.playerStatusEffects.apply('strengthened', effect.duration, 1);
          this.playerStatusEffects.apply('regenerating', effect.duration, 3);
        } else if (effect.value === 3) { // Breath
          this.playerStatusEffects.apply('regenerating', effect.duration, 4);
          this.playerStatusEffects.apply('haste', effect.duration, 1);
        } else if (effect.value === 4) { // Sand
          this.playerStatusEffects.apply('strengthened', effect.duration, 1);
          this.playerStatusEffects.apply('haste', effect.duration, 1);
        }
        break;
    }

    this.showFloatingText(this.playerScreenPos.x, this.playerScreenPos.y - 40, effect.message, 0x66cc88);
  }

  private togglePause(): void {
    if (this.pauseMenu) {
      this.pauseMenu.destroy({ children: true });
      this.pauseMenu = null;
      this.isPaused = false;
      return;
    }
    this.isPaused = true;
    this.pauseMenu = showPauseMenu(
      this.uiContainer, this.app.screen.width, this.app.screen.height,
      () => this.togglePause(),
      (x, y, msg, color) => this.showFloatingText(x, y, msg, color),
      this.playerScreenPos,
      () => {
        GameManager.shared.save();
        BestiaryManager.shared.save();
        AchievementManager.shared.save();
        CompanionManager.shared.save();
        NPCRelationshipManager.shared.save();
        this.router.goto(WorldMapScene);
      },
    );
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
          QuestManager.shared.onItemCollected(entry.itemID);
        }
      }
    }

    this.checkQuestCompletion();
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
      drawEnemySprite(sprite, data, size);
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

      const enemy: EnemyInstance = {
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
      };

      // Initialize boss state for boss enemies
      if (data.tier === 'boss') {
        enemy.bossState = new BossState(data.id);
      }

      this.enemies.push(enemy);
    }
  }

  // Enemy sprite drawing delegated to EnemyRenderer module

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
    this.updateStatusEffects(delta);
    this.updateCamera();
    this.updateAnimations(delta);
    this.spawnAmbientParticles(delta);
    this.updateWorldMechanics(delta);
    this.updateDayNight(delta);
    this.updateWeather(delta);
    this.updateAchievements(delta);
    this.updateCompanion(delta);
    this.updateWorldEvents(delta);
    this.hud.refresh(this.zone.name);
    this.questTracker.refresh();
    this.refreshMinimap();
    this.actionButtons.update(dt);
    this.checkZoneExit();
    this.checkProximity();
    this.sortZOrder();
  }

  // ─── Movement ────────────────────────────────────────────────

  private handleMovement(dt: number): void {
    if (!this.joystick.active || this.joystick.magnitude === 0) return;

    const speedMult = this.playerStatusEffects.getSpeedMultiplier() * this.getCompanionSpeedBonus();
    const dx = this.joystick.direction.x * this.playerSpeed * dt * this.joystick.magnitude * speedMult;
    const dy = this.joystick.direction.y * this.playerSpeed * dt * this.joystick.magnitude * speedMult;

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

    // Update character animator state based on movement
    const isMoving = this.joystick.active && this.joystick.magnitude > 0;
    if (this.playerAnimator.state !== 'attack' && this.playerAnimator.state !== 'hurt'
        && this.playerAnimator.state !== 'cast' && this.playerAnimator.state !== 'death') {
      this.playerAnimator.setState(isMoving ? 'walk' : 'idle');
    }
    this.playerAnimator.facing = this.playerFacing;
    this.playerAnimator.update(dt);

    // Apply animator transforms
    applyAnimationToPlayer(this.playerContainer, this.playerSprite, this.playerShadow, this.playerAnimator);

    // Hurt flash tint
    if (this.playerAnimator.hurtFlash > 0) {
      this.playerSprite.tint = 0xff4444;
    } else {
      this.playerSprite.tint = 0xffffff;
    }

    // Class aura effect
    if (this.playerAuraSprite) {
      this.playerAuraSprite.destroy();
      this.playerAuraSprite = null;
    }
    const champ = GameManager.shared.champion;
    if (champ) {
      const aura = drawClassAura(
        this.worldContainer,
        this.playerScreenPos.x, this.playerScreenPos.y,
        champ.championClass, this.playerAnimator,
      );
      if (aura) {
        aura.zIndex = this.playerContainer.zIndex - 1;
        this.worldContainer.addChild(aura);
        this.playerAuraSprite = aura;
      }
    }

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
      const mistMult = this.worldMechanics instanceof ScadrialMechanics
        ? (this.worldMechanics as ScadrialMechanics).getDetectionMultiplier() : 1;
      // Night: ambush enemies detect further, others detect shorter
      const nightMult = enemy.data.behavior === 'ambush' ? (2 - this.dayNightManager.lightLevel) : this.dayNightManager.lightLevel;
      const detRange = enemy.data.detectionRange * 32 * mistMult * Math.max(0.5, nightMult);
      const atkRange = enemy.data.attackRange * 32;

      enemy.attackCooldown = Math.max(0, enemy.attackCooldown - dt);

      // Boss mechanics
      if (enemy.bossState && dist < detRange) {
        if (!enemy.bossState.announced) {
          enemy.bossState.announced = true;
          this.activeBoss = enemy;
          this.showFloatingText(enemy.position.x, enemy.position.y - 50,
            enemy.bossState.config.entranceMessage, 0xff6644);
          this.bossHPBar = createBossHPBar(this.uiContainer, this.app.screen.width, enemy.data.name);
          this.shakeCamera(5, 0.3);
        }

        const hpPct = enemy.hp / enemy.data.maxHP;
        const result = enemy.bossState.update(dt, hpPct);

        if (result.phaseChanged && result.message) {
          this.showFloatingText(enemy.position.x, enemy.position.y - 50, result.message, 0xff4444);
          this.shakeCamera(4, 0.2);
        }

        if (result.canSpecialAttack && dist < detRange) {
          const phase = enemy.bossState.getCurrentPhase(hpPct);
          const effect = createBossSpecialEffect(
            this.worldContainer, enemy.position.x, enemy.position.y,
            playerPos.x, playerPos.y, phase.specialAttack,
          );
          const champ = GameManager.shared.champion;
          if (champ) {
            const shieldReduct = 1 - this.playerStatusEffects.getDamageReduction();
            const dmg = Math.max(1, Math.floor(effect.damage * phase.damageMultiplier * shieldReduct));
            champ.currentHP -= dmg;
            this.showDamageNumber(playerPos.x, playerPos.y - 40, dmg, false, 0xff4444);
            this.shakeCamera(3, 0.15);
            this.playerAnimator.setState('hurt');

            // Boss attacks can inflict status effects
            const statusByAttack: Record<string, { type: 'poison' | 'burning' | 'frozen' | 'weakened' | 'blinded'; dur: number; mag: number }> = {
              spike_barrage: { type: 'poison', dur: 8, mag: 5 },
              dark_sand: { type: 'blinded', dur: 5, mag: 1 },
              void_consume: { type: 'weakened', dur: 10, mag: 1 },
              stomp_wave: { type: 'frozen', dur: 2, mag: 1 },
              fear_pulse: { type: 'weakened', dur: 6, mag: 1 },
            };
            const statusInfo = statusByAttack[phase.specialAttack];
            if (statusInfo) {
              const msg = this.playerStatusEffects.apply(statusInfo.type, statusInfo.dur, statusInfo.mag);
              if (msg) this.showFloatingText(playerPos.x, playerPos.y - 55, msg, 0xff8844);
            }

            if (champ.currentHP <= 0) {
              champ.currentHP = 0;
              this.playerAnimator.setState('death');
              this.handlePlayerDeath();
            }
          }
        }

        this.bossHPBar?.update(hpPct, enemy.bossState.config.phases[enemy.bossState.currentPhase].name);
      }

      // Speed multiplier for boss phases
      const speedMult = enemy.bossState
        ? enemy.bossState.getCurrentPhase(enemy.hp / enemy.data.maxHP).speedMultiplier : 1;

      if (dist < atkRange && enemy.attackCooldown <= 0) {
        enemy.state = 'attacking';
        enemy.attackCooldown = 1.5;
        this.enemyAttacksPlayer(enemy);
      } else if (dist < detRange) {
        if (enemy.state !== 'chasing') BestiaryManager.shared.registerEncounter(enemy.data);
        enemy.state = 'chasing';
        const angle = Math.atan2(playerPos.y - enemy.position.y, playerPos.x - enemy.position.x);
        const speed = enemy.data.speed * 30 * dt * speedMult;
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
    this.nearbyBuilding = null;
    this.nearbySecret = null;

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

    // Check enterable buildings
    let minBuildingDist = Infinity;
    for (const b of this.enterableBuildings) {
      const dist = Math.hypot(b.x - this.playerScreenPos.x, b.y - this.playerScreenPos.y);
      if (dist < b.interactionRadius && dist < minBuildingDist) {
        minBuildingDist = dist;
        this.nearbyBuilding = b;
      }
    }

    // Check secret areas (reveal when close)
    for (const s of this.secretAreas) {
      if (s.revealed) continue;
      const dist = Math.hypot(s.x - this.playerScreenPos.x, s.y - this.playerScreenPos.y);
      if (dist < s.interactionRadius) {
        revealSecret(s, this.zone.worldID);
        this.showFloatingText(s.x, s.y - 20, '✦ Zone secrète découverte!', 0xffdd44);
        this.nearbySecret = s;
      }
    }
    // Check already revealed secrets for loot
    for (const s of this.secretAreas) {
      if (!s.revealed) continue;
      const dist = Math.hypot(s.x - this.playerScreenPos.x, s.y - this.playerScreenPos.y);
      if (dist < 40) {
        this.nearbySecret = s;
        break;
      }
    }

    // Determine mode (priority: NPC > Building > Exit > Secret > Loot > Attack)
    let newMode: ActionMode = 'attack';
    let promptText = '';
    if (this.nearbyNPC && minNPCDist < minExitDist && minNPCDist < minLootDist) {
      newMode = 'talk';
      promptText = this.nearbyNPC.isShopkeeper ? 'Ouvrir la boutique' : 'Parler';
    } else if (this.nearbyBuilding && minBuildingDist < minExitDist) {
      newMode = 'enter';
      promptText = this.nearbyBuilding.name;
    } else if (this.nearbyExit && minExitDist < minLootDist) {
      newMode = 'enter';
      const targetZone = gameData.zone(this.nearbyExit.targetZoneID);
      promptText = `→ ${targetZone?.name ?? this.nearbyExit.targetZoneID}`;
    } else if (this.nearbySecret) {
      newMode = 'loot';
      promptText = this.nearbySecret.type === 'treasure' ? 'Ouvrir le coffre'
        : this.nearbySecret.type === 'shrine' ? 'Prier au sanctuaire' : 'Explorer';
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

    // Attack animation
    this.playerAnimator.setState('attack');

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

    const baseDmg = Math.max(1, champ.baseStats.strength + Math.floor(Math.random() * 5));
    const statusDmgMult = this.playerStatusEffects.getDamageMultiplier();
    const comboResult = ComboManager.shared.registerHit();
    const damage = Math.floor(baseDmg * statusDmgMult * comboResult.multiplier * this.getCompanionDamageBonus());
    const isCrit = Math.random() < champ.baseStats.luck * 0.01;
    const totalDmg = isCrit ? damage * 2 : damage;

    closest.hp -= totalDmg;
    this.showDamageNumber(closest.position.x, closest.position.y - 30, totalDmg, isCrit);
    this.drawEnemyHP(closest.hpBar, closest.hp / closest.data.maxHP);

    // Hit flash + shake animation
    animateEnemyHit(closest.sprite);
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
    createAttackEffect(
      this.worldContainer,
      this.playerScreenPos.x, this.playerScreenPos.y,
      this.playerFacing,
      GameManager.shared.champion?.championClass ?? 'mistborn',
    );
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

    // Cast animation
    this.playerAnimator.setState('cast');

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
    createSkillEffect(
      this.worldContainer,
      this.playerScreenPos.x, this.playerScreenPos.y,
      range,
      GameManager.shared.champion?.championClass ?? 'mistborn',
      this.particles,
    );
  }

  private enemyAttacksPlayer(enemy: EnemyInstance): void {
    const champ = GameManager.shared.champion;
    if (!champ) return;

    const defense = champ.baseStats.vigor / 2;
    const nightmareMult = this.worldMechanics instanceof KomashiMechanics
      ? (this.worldMechanics as KomashiMechanics).getDamageMultiplier() : 1;
    const bossMult = enemy.bossState
      ? enemy.bossState.getCurrentPhase(enemy.hp / enemy.data.maxHP).damageMultiplier : 1;
    const shieldReduction = 1 - this.playerStatusEffects.getDamageReduction();
    const damage = Math.max(1, Math.floor((enemy.data.damage - defense) * nightmareMult * bossMult * shieldReduction));
    champ.currentHP -= damage;

    this.showDamageNumber(this.playerScreenPos.x, this.playerScreenPos.y - 40, damage, false, 0xff4444);

    // Hurt animation
    this.playerAnimator.setState('hurt');

    // Screen shake effect
    this.shakeCamera(3, 0.15);

    if (champ.currentHP <= 0) {
      champ.currentHP = 0;
      this.playerAnimator.setState('death');
      this.handlePlayerDeath();
    }
  }

  private killEnemy(enemy: EnemyInstance): void {
    enemy.isDead = true;
    enemy.state = 'dead';

    // Track in bestiary & achievements
    BestiaryManager.shared.registerKill(enemy.data);
    AchievementManager.shared.recordKill(enemy.data.tier);
    AchievementManager.shared.recordCreatureDiscovered(BestiaryManager.shared.totalDiscovered);

    // Animated death instead of instant hide
    animateEnemyDeath(enemy.sprite, this.worldContainer, enemy.position.x, enemy.position.y);
    setTimeout(() => { enemy.sprite.visible = false; }, 500);
    enemy.respawnTimer = enemy.spawn.respawnTime ?? 999;

    // Boss defeat
    if (enemy.bossState) {
      this.showFloatingText(enemy.position.x, enemy.position.y - 60,
        enemy.bossState.config.defeatMessage, 0xffcc44);
      this.shakeCamera(6, 0.4);
      if (this.bossHPBar) {
        this.bossHPBar.destroy();
        this.bossHPBar = null;
      }
      this.activeBoss = null;
    }

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

    const baseGold = enemy.data.goldMin + Math.floor(Math.random() * (enemy.data.goldMax - enemy.data.goldMin + 1));
    const gold = Math.floor(baseGold * this.getEventGoldBonus());
    champ.gold += gold;

    // Apply reputation XP bonus + event bonus
    const xpMultiplier = getBonusXPMultiplier(this.zone.worldID);
    const finalXP = Math.floor(enemy.data.xpReward * xpMultiplier * this.getCompanionXPBonus() * this.getEventXPBonus());
    const leveledUp = gm.grantXP(finalXP);

    // Grant reputation based on enemy tier
    const repByTier: Record<string, number> = { minion: 1, soldier: 2, elite: 4, boss: 15 };
    const repGain = repByTier[enemy.data.tier] ?? 1;
    const repResult = addReputation(this.zone.worldID, repGain);
    if (repResult.rankUp) {
      showRankUpEffect(this.uiContainer, this.app.screen.width, this.app.screen.height, repResult.rankName, this.zone.worldID);
    }
    if (this.repBadge) this.repBadge.refresh();

    this.showDamageNumber(enemy.position.x, enemy.position.y - 10, finalXP, false, 0x66cc44);
    setTimeout(() => {
      this.showDamageNumber(enemy.position.x + 10, enemy.position.y, gold, false, 0xe6cc33);
    }, 200);

    // Track achievements
    AchievementManager.shared.recordGold(gold);
    AchievementManager.shared.recordXP(finalXP);
    if (leveledUp) AchievementManager.shared.recordLevel(champ.level);
    AchievementManager.shared.check();

    // Animated gold burst and XP orbs
    spawnGoldBurst(this.worldContainer, enemy.position.x, enemy.position.y, gold);
    spawnXPOrbs(this.worldContainer, enemy.position.x, enemy.position.y,
      this.playerScreenPos.x, this.playerScreenPos.y, finalXP);

    // Drop loot from loot table
    let dropIndex = 0;
    for (const lootEntry of enemy.data.lootTable) {
      if (Math.random() < lootEntry.dropChance) {
        const item = gameData.item(lootEntry.itemID);
        if (item && champ) {
          champ.inventoryItemIDs.push(lootEntry.itemID);
          QuestManager.shared.onItemCollected(lootEntry.itemID);
          BestiaryManager.shared.registerDrop(enemy.data.id, lootEntry.itemID);
          AchievementManager.shared.recordItemCollect();

          // Animated loot drop
          spawnLootDrop(this.worldContainer, enemy.position.x, enemy.position.y,
            item.name, item.rarity, dropIndex);
          dropIndex++;

          setTimeout(() => {
            this.showFloatingText(
              enemy.position.x, enemy.position.y - 30,
              `${item.name} obtenu!`, 0xaa88ff,
            );
          }, 400);
        }
      }
    }

    // Track quest progress
    QuestManager.shared.onEnemyKilled(enemy.data.id);
    this.checkQuestCompletion();

    // Komashi: killing enemies reduces nightmare aura
    if (this.worldMechanics instanceof KomashiMechanics) {
      const msg = (this.worldMechanics as KomashiMechanics).onEnemyKilled();
      if (msg) this.showFloatingText(enemy.position.x, enemy.position.y - 40, msg, 0xaa77ee);
    }

    if (leveledUp) {
      this.showLevelUp();
      // Auto-equip new skills on level up
      GameManager.shared.autoEquipSkills(gameData.skills);
      // Refresh skill button labels
      for (let i = 0; i < champ.equippedSkillIDs.length && i < 4; i++) {
        const skill = gameData.skill(champ.equippedSkillIDs[i]);
        if (skill) {
          const shortName = skill.name.length > 5 ? skill.name.substring(0, 5) : skill.name;
          this.actionButtons.setSkill(i, skill.id, shortName);
        }
      }
    }
  }

  private updateCombat(dt: number): void {
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    const comboBroke = ComboManager.shared.update(dt);
    if (comboBroke && ComboManager.shared.highestCombo >= 5) {
      this.showFloatingText(
        this.playerScreenPos.x, this.playerScreenPos.y - 60,
        `Combo terminé: ${ComboManager.shared.highestCombo}×`, 0xff8844,
      );
    }
    if (this.comboDisplay) this.comboDisplay.update();
  }

  private updateStatusEffects(dt: number): void {
    const champ = GameManager.shared.champion;
    if (!champ) return;

    const result = this.playerStatusEffects.update(dt);

    // Apply periodic damage/heal
    if (result.damagePerTick > 0) {
      champ.currentHP -= result.damagePerTick;
      this.showDamageNumber(this.playerScreenPos.x, this.playerScreenPos.y - 30, Math.ceil(result.damagePerTick), false, 0x44cc44);
      if (champ.currentHP <= 0) { champ.currentHP = 0; this.handlePlayerDeath(); }
    }
    if (result.healPerTick > 0) {
      champ.currentHP = Math.min(GameManager.shared.maxHP, champ.currentHP + result.healPerTick);
      this.showDamageNumber(this.playerScreenPos.x, this.playerScreenPos.y - 30, Math.ceil(result.healPerTick), false, 0x44ff66);
    }

    // Show expired messages
    for (const type of result.expired) {
      this.showFloatingText(this.playerScreenPos.x, this.playerScreenPos.y - 40, `${type} dissipé`, 0x999999);
    }

    // Spawn visual particles for active effects
    this.statusParticleTimer += dt;
    if (this.statusParticleTimer > 0.3) {
      this.statusParticleTimer = 0;
      for (const effect of this.playerStatusEffects.effects) {
        if (Math.random() < 0.5) {
          spawnStatusParticle(this.worldContainer, this.playerScreenPos.x, this.playerScreenPos.y - 15, effect.type);
        }
      }
    }

    // Update HUD status bar
    if (this.statusBar) {
      this.statusBar.update(this.playerStatusEffects.effects);
    }
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

  private updateWorldMechanics(dt: number): void {
    const msg = this.worldMechanics.tick(dt);
    if (msg) {
      this.showFloatingText(this.playerScreenPos.x, this.playerScreenPos.y - 50, msg, 0xaaddff);
    }
  }

  private updateWorldEvents(dt: number): void {
    const result = WorldEventManager.shared.update(dt, this.zone.worldID);
    this.activeEventEffect = result.effect;

    if (this.eventBanner) this.eventBanner.update(dt);

    // Apply healing/investiture effects from events
    if (result.effect) {
      const champ = GameManager.shared.champion;
      if (champ) {
        if (result.effect.healPerTick) {
          champ.currentHP = Math.min(GameManager.shared.maxHP, champ.currentHP + result.effect.healPerTick * dt);
        }
        if (result.effect.investiturePerTick) {
          champ.currentInvestiture = Math.min(GameManager.shared.maxInvestiture, champ.currentInvestiture + result.effect.investiturePerTick * dt);
        }
      }
    }

    if (result.ended) {
      this.showFloatingText(
        this.playerScreenPos.x, this.playerScreenPos.y - 50,
        'Événement terminé', 0xaaaaaa,
      );
    }
  }

  private getEventXPBonus(): number {
    return this.activeEventEffect?.xpBonus ? 1 + this.activeEventEffect.xpBonus / 100 : 1;
  }

  private getEventGoldBonus(): number {
    return this.activeEventEffect?.goldBonus ? 1 + this.activeEventEffect.goldBonus / 100 : 1;
  }

  private updateDayNight(dt: number): void {
    const result = this.dayNightManager.update(dt);
    if (this.dayNightOverlay) {
      this.dayNightOverlay.update(result.blendedConfig);
    }
    if (result.changed && result.message) {
      this.showFloatingText(this.playerScreenPos.x, this.playerScreenPos.y - 50, result.message, 0xddddaa);
    }
  }

  private updateWeather(dt: number): void {
    const result = this.weatherManager.update(dt);
    if (result.changed && result.message) {
      this.showFloatingText(this.playerScreenPos.x, this.playerScreenPos.y - 60, result.message, 0xaaddff);
    }
    // Track surviving a highstorm
    if (result.changed && this.weatherManager.currentWeather !== 'highstorm' && result.config.name !== 'Haute Tempête') {
      const champ = GameManager.shared.champion;
      if (champ && champ.currentHP > 0) {
        AchievementManager.shared.recordHighstormSurvived();
        AchievementManager.shared.check();
      }
    }
    if (this.weatherOverlay) {
      this.weatherOverlay.update(result.config, this.weatherManager.lightningFlash);
    }
    // Weather damage (highstorm, sandstorm, nightmare)
    if (result.config.damagePerTick > 0) {
      const champ = GameManager.shared.champion;
      if (champ) {
        champ.currentHP -= result.config.damagePerTick * dt;
        if (champ.currentHP <= 0) { champ.currentHP = 0; this.handlePlayerDeath(); }
      }
    }
  }

  private updateAchievements(dt: number): void {
    AchievementManager.shared.updateCombo(dt);
    if (this.achievementToast) this.achievementToast.update(dt);
  }

  private spawnCompanionSprite(): void {
    if (this.companionSprite) {
      this.worldContainer.removeChild(this.companionSprite);
      this.companionSprite.destroy();
      this.companionSprite = null;
    }
    const comp = CompanionManager.shared.getActive();
    if (!comp) return;

    const sprite = new Graphics();
    sprite.circle(0, 0, comp.size + 3).fill({ color: comp.glowColor, alpha: 0.15 });
    sprite.circle(0, 0, comp.size).fill({ color: comp.color, alpha: 0.8 });
    sprite.circle(0, -1, comp.size * 0.5).fill({ color: 0xffffff, alpha: 0.3 });
    sprite.zIndex = 999;

    this.companionPos.x = this.playerScreenPos.x + 20;
    this.companionPos.y = this.playerScreenPos.y - 15;
    sprite.x = this.companionPos.x;
    sprite.y = this.companionPos.y;

    this.worldContainer.addChild(sprite);
    this.companionSprite = sprite;
  }

  private updateCompanion(dt: number): void {
    if (!this.companionSprite) return;
    const comp = CompanionManager.shared.getActive();
    if (!comp) return;

    this.companionAnimTimer += dt * 2.5;

    // Smooth follow with orbit
    const targetX = this.playerScreenPos.x + Math.cos(this.companionAnimTimer) * 22;
    const targetY = this.playerScreenPos.y - 18 + Math.sin(this.companionAnimTimer * 1.3) * 6;

    this.companionPos.x += (targetX - this.companionPos.x) * dt * 3;
    this.companionPos.y += (targetY - this.companionPos.y) * dt * 3;

    this.companionSprite.x = this.companionPos.x;
    this.companionSprite.y = this.companionPos.y;

    // Pulsing glow
    this.companionSprite.alpha = 0.8 + Math.sin(this.companionAnimTimer * 2) * 0.15;

    // Companion passive healing
    if (comp.bonusType === 'heal') {
      const champ = GameManager.shared.champion;
      if (champ && champ.currentHP < GameManager.shared.maxHP) {
        champ.currentHP = Math.min(GameManager.shared.maxHP, champ.currentHP + comp.bonusValue * dt);
      }
    }
  }

  private getCompanionDamageBonus(): number {
    const bonus = CompanionManager.shared.getBonus();
    if (bonus && bonus.type === 'damage') return 1 + bonus.value / 100;
    return 1;
  }

  private getCompanionDefenseBonus(): number {
    const bonus = CompanionManager.shared.getBonus();
    if (bonus && bonus.type === 'defense') return 1 - bonus.value / 100;
    return 1;
  }

  private getCompanionSpeedBonus(): number {
    const bonus = CompanionManager.shared.getBonus();
    if (bonus && bonus.type === 'speed') return 1 + bonus.value / 100;
    return 1;
  }

  private getCompanionXPBonus(): number {
    const bonus = CompanionManager.shared.getBonus();
    if (bonus && bonus.type === 'xp') return 1 + bonus.value / 100;
    return 1;
  }

  private handlePlayerDeath(): void {
    if (this.deathScreen) return;
    this.isPaused = true;
    AchievementManager.shared.recordDeath();
    AchievementManager.shared.check();

    this.deathScreen = showDeathScreen(
      this.uiContainer,
      this.app.screen.width,
      this.app.screen.height,
      () => this.respawnPlayer(),
    );
  }

  private respawnPlayer(): void {
    if (this.deathScreen) {
      this.deathScreen.destroy({ children: true });
      this.deathScreen = null;
    }

    const champ = GameManager.shared.champion;
    if (!champ) return;

    // Restore HP/investiture to full
    champ.currentHP = GameManager.shared.maxHP;
    champ.currentInvestiture = GameManager.shared.maxInvestiture;

    // Move player to zone spawn point
    const spawnPos = isoToScreen(this.zone.playerSpawnPosition.col, this.zone.playerSpawnPosition.row);
    this.playerScreenPos.x = spawnPos.x;
    this.playerScreenPos.y = spawnPos.y;
    this.playerGridPos = { ...this.zone.playerSpawnPosition };
    this.playerContainer.x = spawnPos.x;
    this.playerContainer.y = spawnPos.y;

    // Flash effect on respawn
    const flash = new Graphics();
    flash.rect(0, 0, this.app.screen.width, this.app.screen.height).fill({ color: 0xffffff, alpha: 0.3 });
    flash.zIndex = 10000;
    this.uiContainer.addChild(flash);
    let elapsed = 0;
    const fadeOut = () => {
      elapsed += 1 / 60;
      flash.alpha = Math.max(0, 0.3 - elapsed * 0.6);
      if (elapsed < 0.5) requestAnimationFrame(fadeOut);
      else flash.destroy();
    };
    requestAnimationFrame(fadeOut);

    this.isPaused = false;
  }

  private refreshMinimap(): void {
    const enemyDots = this.enemies
      .filter(e => !e.isDead)
      .map(e => ({
        x: e.position.x,
        y: e.position.y,
        color: e.data.tier === 'boss' ? 0xff2222 : e.data.tier === 'elite' ? 0xff6644 : 0xcc4444,
        size: e.data.tier === 'boss' ? 3 : e.data.tier === 'elite' ? 2 : 1.5,
      }));

    const npcDots = this.npcs.map(n => ({
      x: n.position.x, y: n.position.y, color: 0x44aaff,
    }));

    const exitDots = this.zone.connections.map(c => {
      const pos = isoToScreen(c.exitPosition.col, c.exitPosition.row);
      return { x: pos.x, y: pos.y, color: 0xeedd44 };
    });

    const lootDots = this.lootPoints
      .filter(l => !l.collected)
      .map(l => ({ x: l.position.x, y: l.position.y, color: 0xee9944 }));

    this.minimap.refresh(
      this.playerScreenPos.x, this.playerScreenPos.y,
      enemyDots, npcDots, exitDots, lootDots,
    );
  }

  private checkQuestCompletion(): void {
    const champ = GameManager.shared.champion;
    if (!champ) return;

    for (const qid of [...champ.activeQuestIDs]) {
      if (QuestManager.shared.checkQuestCompletion(qid)) {
        const result = QuestManager.shared.completeQuest(qid);
        if (result) {
          // Show quest completion reward
          this.showFloatingText(
            this.playerScreenPos.x, this.playerScreenPos.y - 50,
            `Quête terminée! +${result.xp}XP +${result.gold}or`, 0xffcc44,
          );
          this.questTracker.refresh();
        }
      }
    }
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

    // Level up aura burst in world space
    const champ = GameManager.shared.champion;
    if (champ) {
      animateLevelUpBurst(this.worldContainer, this.playerScreenPos.x, this.playerScreenPos.y, champ.championClass);
    }

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
              BestiaryManager.shared.save();
              AchievementManager.shared.save();
              CompanionManager.shared.save();
              NPCRelationshipManager.shared.save();
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

  private darkenColor(color: number, amount: number): number { return darken(color, amount); }
  private lightenColor(color: number, amount: number): number { return lighten(color, amount); }

  // ─── Responsive Resize ──────────────────────────────────────────
  onResize(layout: LayoutInfo): void {
    const w = layout.width;
    const h = layout.height;

    if (this.joystick) {
      const joyPos = joystickPosition(layout);
      this.joystick.x = joyPos.x;
      this.joystick.y = joyPos.y;
    }
    if (this.actionButtons) {
      const actPos = actionButtonsPosition(layout);
      this.actionButtons.x = actPos.x;
      this.actionButtons.y = actPos.y;
    }
    // Recenter camera
    if (this.worldContainer) {
      this.worldContainer.x = w / 2 - this.playerScreenPos.x;
      this.worldContainer.y = h / 2 - this.playerScreenPos.y;
    }
  }
}
