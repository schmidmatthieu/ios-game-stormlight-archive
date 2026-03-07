import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { GameScene } from '../game/SceneRouter';
import { SceneRouter } from '../game/SceneRouter';
import { GameManager } from '../game/GameManager';
import { gameData } from '../data/DataLoader';
import { VirtualJoystick } from '../ui/VirtualJoystick';
import { ActionButtons } from '../ui/ActionButtons';
import { HUD } from '../ui/HUD';
import { showDialoguePanel, showShopPanel } from '../ui/DialoguePanel';
import { QuestTracker } from '../ui/QuestTracker';
import { Minimap } from '../ui/Minimap';
import { showDeathScreen } from '../ui/DeathScreen';
import { QuestManager } from '../game/QuestManager';
import { createWorldMechanics, ScadrialMechanics, KomashiMechanics } from '../game/WorldMechanics';
import type { WorldEffect } from '../game/WorldMechanics';
import { BossState, createBossHPBar, createBossSpecialEffect } from '../game/BossMechanics';
import { drawPlayerCharacter, buildPlayerCharacter } from '../rendering/PlayerRenderer';
import type { PlayerBodyParts } from '../rendering/PlayerRenderer';
import { drawEquipmentOverlay, drawEquipmentOnParts } from '../rendering/EquipmentVisuals';
import { lighten, darken } from '../utils/ColorUtils';
import { CharacterAnimator, applyAnimationToPlayer, drawClassAura, animateEnemyHit, animateEnemyDeath, animateLevelUpBurst } from '../rendering/CharacterAnimations';
import { drawEnemySprite, WORLD_ENEMY_COLORS } from '../rendering/EnemyRenderer';
import { createEnemyAnimState, updateEnemyIdle, triggerEnemyHurt, triggerEnemyDeath, drawBossAura, drawAlertIndicator, setEnemyAlert } from '../rendering/EnemyAnimations';
import type { EnemyAnimState } from '../rendering/EnemyAnimations';
import { createAttackEffect, createSkillEffect, createHitImpact, createSkillGroundMark } from '../rendering/SpellEffects';
import { createDirectionalSlash, createCritFlash, createKillBurst, showKillStreakBanner, triggerHitStop, updateHitStop, createGroundCrack } from '../rendering/CombatFeedback';
import { FloatingDamageManager } from '../rendering/FloatingDamage';
import type { DamageStyle } from '../rendering/FloatingDamage';
import { MusicManager } from '../game/MusicSystem';
import { createMusicIndicator } from '../ui/MusicIndicator';
import { rollAffixes, createAffixState, updateAffixState, getAffixHPMultiplier, getAffixDamageMultiplier, getAffixSpeedMultiplier, getThornsDamage, getVampiricHeal, hasAffix, getAffixLabel, getAffixColor } from '../game/EliteAffixes';
import type { EnemyAffixState } from '../game/EliteAffixes';
import { spawnLootDrop, spawnGoldBurst, spawnXPOrbs } from '../rendering/LootAnimations';
import { WeatherManager, createWeatherOverlay } from '../rendering/WeatherSystem';
import { AmbientAtmosphereManager } from '../rendering/AmbientAtmosphere';
import { DayNightManager, createDayNightOverlay } from '../rendering/DayNightCycle';
import type { BlendedTimeConfig } from '../rendering/DayNightCycle';
import { BestiaryManager } from '../game/BestiarySystem';
import { AchievementManager } from '../game/AchievementSystem';
import { createAchievementToast } from '../ui/AchievementUI';
import { createZoneToolbar } from './ZoneToolbar';
import { createMobileMenu } from '../ui/MobileMenu';
import { TutorialManager } from '../ui/TutorialSystem';
import { SaveManager } from '../game/SaveManager';
import { Pathfinder, smoothPath } from '../systems/Pathfinding';
import { createBehaviorState, updateBehavior } from '../systems/EnemyBehaviors';
import type { BehaviorState } from '../systems/EnemyBehaviors';
import { generateEnvironmentObjects, createEnvironmentSprite, interactWith, checkTrapTrigger } from '../systems/EnvironmentInteractions';
import type { EnvironmentObject } from '../systems/EnvironmentInteractions';
import { HiddenQuestManager } from '../systems/HiddenQuests';
import { ObjectPool } from '../systems/ObjectPool';
import { updateSkillVFX, clearSkillVFX } from '../systems/SkillAnimations';
import { NewGamePlusManager } from '../systems/NewGamePlus';
import { CompanionManager } from '../game/CompanionSystem';
import { NPCRelationshipManager, LEVEL_LABELS, LEVEL_COLORS } from '../game/NPCRelationships';
import { ComboManager, createComboDisplay } from '../game/ComboSystem';
import { WorldEventManager } from '../game/WorldEvents';
import type { WorldEventEffect } from '../game/WorldEvents';
import { createWorldEventBanner } from '../ui/WorldEventBanner';
import { WorldMapScene } from './WorldMapScene';
import { NPCScheduleManager } from '../game/NPCScheduleSystem';
import { PotionManager } from '../game/PotionSystem';
import { createPotionHotbar } from '../ui/PotionHotbar';
import { showBuildingInterior } from './BuildingInteriorScene';
import { spawnWalls, spawnEnterableBuildings, spawnSecretAreas, revealSecret } from '../rendering/MapStructures';
import { renderEnhancedTilemap } from '../rendering/TileRenderer';
import type { WallSegment, EnterableBuilding, SecretArea } from '../rendering/MapStructures';
import type { SpellParticle } from '../rendering/SpellEffects';
import { addReputation, createReputationBadge, showRankUpEffect, getBonusXPMultiplier } from '../game/ReputationSystem';
import { StatusEffectManager, createStatusBar, spawnStatusParticle } from '../game/StatusEffects';
import type { ActiveStatusEffect } from '../game/StatusEffects';
import type { Zone, Enemy, EnemySpawn, GridPosition, ZoneConnection, ChampionClass } from '../data/types';
import type { ActionMode } from '../ui/ActionButtons';
import { getLayoutInfo, joystickPosition, actionButtonsPosition, minimapPosition, hudMargin, toolbarY, toolbarButtonSize, scaled, fontSize, touchTarget, UI_COLORS, UI_ALPHA } from '../ui/ResponsiveLayout';
import type { LayoutInfo } from '../ui/ResponsiveLayout';
import {
  TILE_W, TILE_H, isoToScreen, screenToIso, seededRandom,
  WORLD_THEMES,
} from './zone/ZoneTypes';
import type {
  EnemyInstance, NPCInstance, LootInstance, Particle, WorldTheme,
} from './zone/ZoneTypes';
import {
  spawnDecorations as spawnDecorationsModule,
  renderMapEdge as renderMapEdgeModule,
} from './zone/ZoneDecorations';
import {
  createCompanionState, spawnCompanionSprite as spawnCompanionSpriteModule,
  updateCompanion as updateCompanionModule,
  getCompanionDamageBonus, getCompanionDefenseBonus,
  getCompanionSpeedBonus, getCompanionXPBonus,
} from './zone/ZoneCompanion';
import {
  updateFog as updateFogModule,
  updateDayNight as updateDayNightModule,
  initNPCSchedules as initNPCSchedulesModule,
  updateNPCSchedules as updateNPCSchedulesModule,
  updateWeather as updateWeatherModule,
  updateWorldMechanics as updateWorldMechanicsModule,
  updateWorldEvents as updateWorldEventsModule,
  updateAchievements as updateAchievementsModule,
  getEventXPBonus, getEventGoldBonus,
  spawnAmbientParticles as spawnAmbientParticlesModule,
} from './zone/ZoneEnvironment';
import {
  toggleInventory as toggleInventoryModule,
  toggleProfessions as toggleProfessionsModule,
  toggleCrafting as toggleCraftingModule,
  toggleBestiary as toggleBestiaryModule,
  toggleAchievements as toggleAchievementsModule,
  toggleSkillTree as toggleSkillTreeModule,
  toggleTalentTree as toggleTalentTreeModule,
  toggleCompanion as toggleCompanionModule,
  toggleQuestJournal as toggleQuestJournalModule,
  togglePause as togglePauseModule,
  applyCraftResult as applyCraftResultModule,
} from './zone/ZoneUI';
import type { PanelHost } from './zone/ZoneUI';

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
  private playerSprite!: Container;
  private playerShadow!: Graphics;
  private playerGridPos: GridPosition = { col: 5, row: 5 };
  private playerScreenPos = { x: 0, y: 0 };
  private playerSpeed = 120;
  private playerAnimTimer = 0;
  private playerFacing: 'left' | 'right' = 'right';
  private playerAnimator!: CharacterAnimator;
  private playerBodyParts: PlayerBodyParts | null = null;
  private playerAuraSprite: Graphics | null = null;

  // Enemies
  private enemies: EnemyInstance[] = [];

  // NPCs
  private npcs: NPCInstance[] = [];

  // Loot
  private lootPoints: LootInstance[] = [];

  // Particles (pooled to avoid per-frame allocations)
  private particles: Particle[] = [];
  private particleContainer = new Container();
  private particlePool = new ObjectPool<Graphics>(
    () => new Graphics(),
    (g) => { g.clear(); g.alpha = 1; g.scale.set(1); g.rotation = 0; g.visible = true; g.removeFromParent(); },
    20,
  );

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
  private pathfinder: Pathfinder | null = null;
  private enemyPaths: Map<string, { waypoints: { x: number; y: number }[]; idx: number; targetCol: number; targetRow: number; age: number }> = new Map();
  private nearbyBuilding: EnterableBuilding | null = null;
  private nearbySecret: SecretArea | null = null;
  private environmentObjects: EnvironmentObject[] = [];
  private nearbyEnvObject: EnvironmentObject | null = null;
  private enemyBehaviors: Map<string, BehaviorState> = new Map();

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

  // Weather & Atmosphere
  private weatherManager!: WeatherManager;
  private weatherOverlay: { overlay: Graphics; label: Text; update: (config: any, lightning: number) => void } | null = null;
  private ambientAtmosphere: AmbientAtmosphereManager | null = null;
  private achievementToast: { update: (dt: number) => void } | null = null;

  // Kill streak tracking
  private killStreak = 0;
  private killStreakTimer = 0;

  // Companion
  private companionState = createCompanionState();

  // Combo system
  private comboDisplay: { update: () => void } | null = null;

  // World events
  private eventBanner: { update: (dt: number) => void } | null = null;
  private activeEventEffect: WorldEventEffect | null = null;
  private classAmbientTimerRef = { value: 0 };

  // Floating damage
  private floatingDmg!: FloatingDamageManager;

  // Music indicator
  private musicIndicator: { update: (dt: number) => void } | null = null;

  // Potion hotbar
  private potionHotbar: { container: Container; refresh: () => void } | null = null;

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

    // Initialize pathfinder with wall data
    this.pathfinder = new Pathfinder(this.zone.gridWidth, this.zone.gridHeight);
    for (const wall of this.walls) {
      // Convert screen coords to approximate grid coords for blocking
      const col = Math.round((wall.x / 32 + wall.y / 16) / 2);
      const row = Math.round((wall.y / 16 - wall.x / 32) / 2);
      this.pathfinder.setBlocked(col, row, true);
    }
    for (const bld of this.enterableBuildings) {
      const col = Math.round((bld.x / 32 + bld.y / 16) / 2);
      const row = Math.round((bld.y / 16 - bld.x / 32) / 2);
      for (let dc = -1; dc <= 1; dc++) {
        for (let dr = -1; dr <= 1; dr++) {
          this.pathfinder.setBlocked(col + dc, row + dr, true);
        }
      }
    }

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
    this.actionButtons.onUltimate = () => this.handleUltimate();
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

    // Toolbar buttons (pause, inventory, crafting, bestiary, etc.)
    const toolbarCallbacks = {
      togglePause: () => this.togglePause(),
      toggleInventory: () => this.toggleInventory(),
      toggleCrafting: () => this.toggleCrafting(),
      toggleBestiary: () => this.toggleBestiary(),
      toggleAchievements: () => this.toggleAchievements(),
      toggleSkillTree: () => this.toggleSkillTree(),
      toggleTalentTree: () => this.toggleTalentTree(),
      toggleCompanion: () => this.toggleCompanion(),
      toggleQuestJournal: () => this.toggleQuestJournal(),
      toggleProfessions: () => this.toggleProfessions(),
    };
    createZoneToolbar(this.uiContainer, w, layout, toolbarCallbacks);

    // On mobile, use hamburger menu instead of full toolbar
    if (layout.device === 'mobile') {
      createMobileMenu(this.uiContainer, w, h, layout, toolbarCallbacks);
    }

    // Initialize companion
    CompanionManager.shared.checkWorldUnlocks(this.zone.worldID);
    this.spawnCompanionSprite();

    // Combo display
    this.comboDisplay = createComboDisplay(this.uiContainer, w, h);
    ComboManager.shared.reset();

    // Floating damage manager
    this.floatingDmg = new FloatingDamageManager(this.worldContainer);

    // Music system
    MusicManager.shared.setWorld(this.zone.worldID);
    MusicManager.shared.setWeather(this.zone.weatherEffect ?? 'none');
    this.musicIndicator = createMusicIndicator(this.uiContainer, w, h);

    // World events banner
    this.eventBanner = createWorldEventBanner(this.uiContainer, w);

    // Tutorial for new players
    if (!TutorialManager.shared.isComplete()) {
      TutorialManager.shared.startTutorial(this.uiContainer, w, h);
    }

    // Auto-save on zone entry
    SaveManager.shared.autoSave();

    // World mechanics
    this.worldMechanics = createWorldMechanics(this.zone.worldID);

    // Day/night cycle
    this.dayNightManager = new DayNightManager(this.zone.worldID);
    this.dayNightOverlay = createDayNightOverlay(this.uiContainer, w, h);

    // Initialize NPC schedules based on current time
    this.initNPCSchedules();

    // Dynamic weather
    this.weatherManager = new WeatherManager(this.zone.worldID);
    this.weatherOverlay = createWeatherOverlay(this.uiContainer, w, h);

    // Ambient atmosphere (world-specific floating motes and fog layers)
    this.ambientAtmosphere = new AmbientAtmosphereManager(
      this.worldContainer, this.zone.worldID, w, h,
    );

    // Potion hotbar
    PotionManager.shared.load();
    // Grant starter potions if slots are empty
    if (!PotionManager.shared.slots[0] && !PotionManager.shared.slots[1] && !PotionManager.shared.slots[2]) {
      PotionManager.shared.addPotion('potion_heal_small', 5);
      PotionManager.shared.addPotion('potion_investiture', 3);
      PotionManager.shared.addPotion('potion_strength', 2);
    }
    this.potionHotbar = createPotionHotbar(this.uiContainer, w, h, {
      onUsePotion: (idx) => this.usePotion(idx),
    });

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
    const tileGraphics = renderEnhancedTilemap(
      this.zone.gridWidth, this.zone.gridHeight,
      this.zone.worldID, this.theme,
      isoToScreen, darken,
    );
    this.worldContainer.addChild(tileGraphics);
  }

  private renderMapEdge(): void {
    renderMapEdgeModule(this.worldContainer, this.zone, this.theme);
  }

  // ─── Decorations (delegated to ZoneDecorations module) ──────

  private spawnDecorations(): void {
    spawnDecorationsModule(this.worldContainer, this.zone, this.theme);
  }

  // spawnBuildings, createBuilding, spawnTerrainRelief, createDecoration
  // → extracted to ZoneDecorations.ts

  // ─── Player ──────────────────────────────────────────────────

  private createPlayer(): void {
    this.playerContainer = new Container();
    this.playerContainer.zIndex = 10000;

    // Shadow
    this.playerShadow = new Graphics();
    this.playerShadow.ellipse(0, 2, 12, 5).fill({ color: 0x000000, alpha: 0.3 });
    this.playerContainer.addChild(this.playerShadow);

    // Multi-part character sprite container
    const champ = GameManager.shared.champion;
    const cls = champ?.championClass ?? 'mistborn';

    // Use Container for multi-part body
    this.playerSprite = new Container();
    this.playerBodyParts = buildPlayerCharacter(this.playerSprite, cls);
    // Equipment overlays on torso
    if (champ && this.playerBodyParts) {
      drawEquipmentOnParts(this.playerBodyParts, champ.equipment);
    }
    this.playerContainer.addChild(this.playerSprite);

    // Character animator
    this.playerAnimator = new CharacterAnimator(cls);

    this.playerContainer.x = this.playerScreenPos.x;
    this.playerContainer.y = this.playerScreenPos.y;
    this.worldContainer.addChild(this.playerContainer);
  }

  private drawPlayer(): void {
    const champ = GameManager.shared.champion;
    const cls = champ?.championClass ?? 'mistborn';
    // Rebuild multi-part character
    this.playerBodyParts = buildPlayerCharacter(this.playerSprite, cls);
    // Draw equipment overlays on torso Graphics
    if (champ && this.playerBodyParts) {
      drawEquipmentOnParts(this.playerBodyParts, champ.equipment);
    }
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
        } else if (this.nearbyEnvObject) {
          this.interactWithEnvObject(this.nearbyEnvObject);
        } else if (this.nearbyLoot) {
          this.collectLoot(this.nearbyLoot.id);
        }
        break;
    }
  }

  private enterBuilding(building: EnterableBuilding): void {
    if (this.dialoguePanel) return;
    this.isPaused = true;

    const w = this.app.screen.width;
    const h = this.app.screen.height;

    // Use the new Baldur's Gate style interior system
    this.dialoguePanel = showBuildingInterior(
      this.uiContainer, w, h,
      building.name, this.zone.worldID,
      (rewards) => {
        const champ = GameManager.shared.champion;
        if (champ) {
          champ.gold += rewards.gold;
          GameManager.shared.grantXP(rewards.xp);
          const repResult = addReputation(this.zone.worldID, 3);
          if (repResult.rankUp) {
            showRankUpEffect(this.uiContainer, w, h, repResult.rankName, this.zone.worldID);
          }
          if (this.repBadge) this.repBadge.refresh();
          if (rewards.xp > 0 || rewards.gold > 0) {
            this.showFloatingText(this.playerScreenPos.x, this.playerScreenPos.y - 30,
              `+${rewards.xp}XP +${rewards.gold}or`, 0x66cc44);
          }
        }
        this.dialoguePanel = null;
        this.isPaused = false;
      },
    );

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
      MusicManager.shared.playSFX('heal');
      // Shrine: full heal, full investiture, strong long-lasting buffs
      champ.currentHP = GameManager.shared.maxHP;
      champ.currentInvestiture = GameManager.shared.maxInvestiture;
      this.playerStatusEffects.apply('regenerating', 120, 5);     // 2 min regen (+5 HP/tick)
      this.playerStatusEffects.apply('shielded', 120, 2);         // 2 min shield (40% DR)
      this.playerStatusEffects.apply('strengthened', 120, 1.5);   // 2 min +50% damage
      this.playerStatusEffects.apply('haste', 90, 1);             // 90s speed boost
      this.showFloatingText(secret.x, secret.y - 30, 'Bénédiction! PV, Inv, +50% Dégâts, Bouclier, Régén, Hâte!', 0x88ccff);
    } else {
      this.showFloatingText(secret.x, secret.y - 30,
        `${secret.loot.itemHint}! +${secret.loot.xp}XP +${secret.loot.gold}or`, 0xffdd44);
    }

    // Remove from interactable
    secret.sprite.alpha = 0.3;
    this.secretAreas = this.secretAreas.filter(s => s !== secret);
  }

  private interactWithEnvObject(obj: EnvironmentObject): void {
    const result = interactWith(obj);
    MusicManager.shared.playSFX(result.sfx);

    if (result.message) {
      const pos = isoToScreen(obj.position.col, obj.position.row);
      this.showFloatingText(pos.x, pos.y - 30, result.message, 0xffdd44);
    }

    if (result.xpReward > 0) {
      const ngpRewards = NewGamePlusManager.shared.applyToRewards(result.xpReward, 0);
      GameManager.shared.grantXP(ngpRewards.xp);
    }

    // Trigger linked object (e.g., lever → obelisk)
    if (result.triggerLinkedID) {
      const linked = this.environmentObjects.find(o => o.id === result.triggerLinkedID);
      if (linked && !linked.activated) {
        linked.activated = true;
        const linkedPos = isoToScreen(linked.position.col, linked.position.row);
        this.showFloatingText(linkedPos.x, linkedPos.y - 30, 'Activé !', 0x88ccff);
        MusicManager.shared.playSFX('quest_complete');
        // Report obelisk activation for hidden quests
        if (linked.type === 'obelisk') {
          const notifications = HiddenQuestManager.shared.reportTrigger('activate_obelisks', this.zone.worldID, this.zone.worldID);
          for (const n of notifications) {
            this.showFloatingText(this.playerScreenPos.x, this.playerScreenPos.y - 70,
              n.message, n.completed ? 0xffdd44 : 0x88ccff);
            if (n.completed && n.rewards) {
              this.showFloatingText(this.playerScreenPos.x, this.playerScreenPos.y - 85,
                `+${n.rewards.xp}XP +${n.rewards.gold}or`, 0x66cc44);
            }
          }
        }
        // Redraw linked sprite
        linked.sprite.removeChildren();
        const newSprite = createEnvironmentSprite(linked);
        for (const child of newSprite.children) linked.sprite.addChild(child);
      }
    }

    // Handle breakable — hide sprite, drop loot
    if (obj.type === 'breakable' && obj.activated) {
      obj.sprite.alpha = 0.2;
      this.shakeCamera(1, 0.05);
    }

    // Redraw current object sprite
    obj.sprite.removeChildren();
    const newSprite = createEnvironmentSprite(obj);
    for (const child of newSprite.children) obj.sprite.addChild(child);
  }

  private interactWithNPC(spawn: { npcID: string; isShopkeeper: boolean; dialogueTreeID: string | null }): void {
    const npc = this.npcs.find(n => n.id === spawn.npcID);
    if (!npc) return;

    // Check if NPC is sleeping (unavailable)
    const schedMgr = NPCScheduleManager.shared;
    if (schedMgr.hasSchedule(spawn.npcID) && !schedMgr.isAvailable(spawn.npcID)) {
      this.showFloatingText(npc.position.x, npc.position.y - 50, '💤 Dort...', 0x6677aa);
      return;
    }

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
    // Also trigger escort completion when talking to an escort NPC
    QuestManager.shared.onEscortComplete(npcID);
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

    // Show time-based dialogue override from schedule
    const timeDialogue = NPCScheduleManager.shared.getTimeDialogue(npcID);
    if (timeDialogue) {
      const npcInst = this.npcs.find(n => n.id === npcID);
      if (npcInst) {
        this.showFloatingText(npcInst.position.x, npcInst.position.y - 60, timeDialogue, 0xddddaa);
      }
    }

    this.dialoguePanel = showDialoguePanel(
      this.uiContainer, this.app.screen.width, this.app.screen.height,
      this.zone.worldID, npcName, () => this.closeDialogue(),
    );
  }

  private closeDialogue(): void {
    if (this.dialoguePanel) {
      MusicManager.shared.playSFX('close_menu');
      this.dialoguePanel.destroy({ children: true });
      this.dialoguePanel = null;
    }
    this.isPaused = false;
  }

  private showShop(npcID: string): void {
    if (this.dialoguePanel) return;
    MusicManager.shared.playSFX('open_menu');
    this.isPaused = true;
    this.dialoguePanel = showShopPanel(
      this.uiContainer, this.app.screen.width, this.app.screen.height,
      () => this.closeDialogue(),
      (x, y, msg, color) => this.showFloatingText(x, y, msg, color),
      this.playerScreenPos,
    );
  }

  // NOTE: Toolbar buttons have been extracted to ZoneToolbar.ts

  private get panelHost(): PanelHost {
    return {
      dialoguePanel: this.dialoguePanel,
      isPaused: this.isPaused,
      uiContainer: this.uiContainer,
      screenWidth: this.app.screen.width,
      screenHeight: this.app.screen.height,
      worldID: this.zone.worldID,
      closeDialogue: () => this.closeDialogue(),
      showFloatingText: (x, y, msg, c) => this.showFloatingText(x, y, msg, c),
      playerScreenPos: this.playerScreenPos,
      router: this.router,
      playerStatusEffects: this.playerStatusEffects,
      onCompanionToggleClosed: () => this.spawnCompanionSprite(),
    };
  }

  private applyPanelHostState(host: PanelHost): void {
    this.dialoguePanel = host.dialoguePanel;
    this.isPaused = host.isPaused;
  }

  private toggleInventory(): void {
    const h = this.panelHost;
    toggleInventoryModule(h);
    this.applyPanelHostState(h);
  }

  private toggleProfessions(): void {
    const h = this.panelHost;
    toggleProfessionsModule(h);
    this.applyPanelHostState(h);
  }

  private toggleCrafting(): void {
    const h = this.panelHost;
    toggleCraftingModule(h, (recipeID) => this.applyCraftResult(recipeID));
    this.applyPanelHostState(h);
  }

  private toggleBestiary(): void {
    const h = this.panelHost;
    toggleBestiaryModule(h);
    this.applyPanelHostState(h);
  }

  private toggleAchievements(): void {
    const h = this.panelHost;
    toggleAchievementsModule(h);
    this.applyPanelHostState(h);
  }

  private toggleSkillTree(): void {
    const h = this.panelHost;
    toggleSkillTreeModule(h);
    this.applyPanelHostState(h);
  }

  private toggleTalentTree(): void {
    const h = this.panelHost;
    toggleTalentTreeModule(h);
    this.applyPanelHostState(h);
  }

  private toggleCompanion(): void {
    const h = this.panelHost;
    toggleCompanionModule(h);
    this.applyPanelHostState(h);
  }

  private toggleQuestJournal(): void {
    const h = this.panelHost;
    toggleQuestJournalModule(h);
    this.applyPanelHostState(h);
  }

  private applyCraftResult(recipeID: string): void {
    applyCraftResultModule(recipeID, this.playerStatusEffects, (x, y, msg, c) => this.showFloatingText(x, y, msg, c), this.playerScreenPos);
  }

  private togglePause(): void {
    const h = this.panelHost;
    this.pauseMenu = togglePauseModule(h, this.pauseMenu);
    this.isPaused = h.isPaused;
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

      // NG+ difficulty scaling
      const ngpStats = NewGamePlusManager.shared.applyToEnemy(data.maxHP, data.damage, data.speed);

      // NG+ elite upgrade chance for minions
      if (data.tier === 'minion' && NewGamePlusManager.shared.shouldUpgradeToElite()) {
        data.tier = 'elite' as typeof data.tier;
      }

      // Roll affixes for elite/boss enemies
      const affixes = rollAffixes(data.tier);
      const affixState = affixes.length > 0 ? createAffixState(affixes) : undefined;
      const hpMult = affixState ? getAffixHPMultiplier(affixState) : 1;
      const finalMaxHP = Math.floor(ngpStats.hp * hpMult);

      const enemy: EnemyInstance = {
        data, spawn,
        hp: finalMaxHP,
        maxHP: finalMaxHP,
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
        affixState,
        enemyAnim: createEnemyAnimState(),
      };

      // Affix label under name
      if (affixState && affixes.length > 0) {
        const affixText = new Text({
          text: getAffixLabel(affixState),
          style: new TextStyle({
            fontFamily: 'sans-serif', fontSize: 5,
            fill: getAffixColor(affixState),
            dropShadow: { color: 0x000000, blur: 2, distance: 1 },
          }),
        });
        affixText.anchor.set(0.5);
        affixText.y = -size * 2 - 30;
        container.addChild(affixText);
        enemy.affixLabel = affixText;
      }

      // Initialize boss state for boss enemies
      if (data.tier === 'boss') {
        enemy.bossState = new BossState(data.id);
      }

      this.enemies.push(enemy);

      // Initialize AI behavior state
      const behaviorKey = data.id + '_' + spawn.position.col + '_' + spawn.position.row;
      const patrolWaypoints = spawn.patrolPath
        ? spawn.patrolPath.map(p => isoToScreen(p.col, p.row))
        : null;
      this.enemyBehaviors.set(behaviorKey, createBehaviorState(
        data.behavior, pos.x, pos.y, data.attackRange,
      ));
    }

    // Generate environment objects (puzzles, traps, breakables)
    this.environmentObjects = generateEnvironmentObjects(
      this.zone.worldID, this.zone.gridWidth, this.zone.gridHeight,
      this.zone.type, this.zone.gridWidth * 1000 + this.zone.gridHeight,
    );
    for (const obj of this.environmentObjects) {
      obj.sprite = createEnvironmentSprite(obj);
      this.worldContainer.addChild(obj.sprite);
    }

    // Report zone exploration for hidden quests
    HiddenQuestManager.shared.reportTrigger('visit_secret_area', this.zone.worldID, this.zone.worldID);
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
    spawnAmbientParticlesModule(
      dt, this.app.screen.width, this.app.screen.height,
      this.zone.weatherEffect, this.theme, this.worldContainer,
      this.particleContainer, this.particlePool, this.particles,
      this.playerScreenPos, this.classAmbientTimerRef,
    );
  }

  private updateFog(): void {
    updateFogModule(this.fogOverlay, this.uiContainer, this.app.screen.width, this.app.screen.height, this.theme);
  }

  // ─── Scene Cleanup ──────────────────────────────────────────

  onExit(): void {
    // Clear pooled VFX animations to prevent orphan callbacks
    clearSkillVFX();
    // Clear floating damage
    this.floatingDmg.clear();
    // Release pooled particles
    for (const p of this.particles) {
      this.particlePool.release(p.sprite);
    }
    this.particles.length = 0;
    // Destroy player aura
    if (this.playerAuraSprite) {
      this.playerAuraSprite.destroy();
      this.playerAuraSprite = null;
    }
    // Destroy boss HP bar
    if (this.bossHPBar) {
      this.bossHPBar.destroy();
      this.bossHPBar = null;
    }
    // Auto-save
    SaveManager.shared.autoSave();
  }

  // ─── Update Loop ─────────────────────────────────────────────

  update(dt: number): void {
    if (this.isPaused || this.isTransitioning) return;
    const delta = dt / 60;
    // Hit stop: skip frame if active
    if (updateHitStop(delta)) return;
    // Kill streak decay
    if (this.killStreakTimer > 0) {
      this.killStreakTimer -= delta;
      if (this.killStreakTimer <= 0) this.killStreak = 0;
    }
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
    updateCompanionModule(delta, this.companionState, this.playerScreenPos);
    this.updateWorldEvents(delta);
    this.floatingDmg.update(delta);
    updateSkillVFX(delta);
    MusicManager.shared.update(delta);
    if (this.musicIndicator) this.musicIndicator.update(delta);
    this.hud.refresh(this.zone.name);
    this.questTracker.refresh();
    this.refreshMinimap();
    this.actionButtons.update(delta);
    this.checkZoneExit();
    this.checkProximity(delta);
    this.sortZOrder();
  }

  // ─── Movement ────────────────────────────────────────────────

  private handleMovement(dt: number): void {
    if (!this.joystick.active || this.joystick.magnitude === 0) return;

    const speedMult = this.playerStatusEffects.getSpeedMultiplier() * getCompanionSpeedBonus();
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

    // Apply animator transforms (with multi-part limb animation)
    applyAnimationToPlayer(this.playerContainer, this.playerSprite, this.playerShadow, this.playerAnimator, this.playerBodyParts);

    // Hurt flash tint - apply to all body part Graphics
    const hurtTint = this.playerAnimator.hurtFlash > 0 ? 0xff4444 : 0xffffff;
    for (const child of this.playerSprite.children) {
      if (child instanceof Graphics) {
        child.tint = hurtTint;
      }
    }

    // Class aura effect — reuse existing Graphics via clear() to avoid per-frame allocation
    const champ = GameManager.shared.champion;
    if (champ) {
      const aura = drawClassAura(
        this.worldContainer,
        this.playerScreenPos.x, this.playerScreenPos.y,
        champ.championClass, this.playerAnimator,
        this.playerAuraSprite,
      );
      if (aura && !this.playerAuraSprite) {
        aura.zIndex = this.playerContainer.zIndex - 1;
        this.worldContainer.addChild(aura);
        this.playerAuraSprite = aura;
      }
      if (this.playerAuraSprite) {
        this.playerAuraSprite.zIndex = this.playerContainer.zIndex - 1;
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
          enemy.hp = enemy.maxHP;
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

      // Animate enemy idle (breathing, sway)
      if (enemy.enemyAnim) {
        updateEnemyIdle(enemy.sprite, enemy.enemyAnim, dt, enemy.data.tier);
        // Boss aura animation
        if (enemy.data.tier === 'boss' && enemy.bossState?.announced) {
          const phase = enemy.bossState.currentPhase + 1;
          enemy.bossAuraGfx = drawBossAura(enemy.sprite, enemy.enemyAnim.timer, WORLD_ENEMY_COLORS[enemy.data.worldID]?.boss ?? 0xcc5500, phase, enemy.bossAuraGfx);
        }
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

        const hpPct = enemy.hp / enemy.maxHP;
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

      // Affix mechanics update
      if (enemy.affixState) {
        const affixResult = updateAffixState(enemy.affixState, dt, enemy.maxHP, enemy.hp);
        if (affixResult.regenHP > 0 && enemy.hp < enemy.maxHP) {
          enemy.hp = Math.min(enemy.maxHP, enemy.hp + affixResult.regenHP);
          this.drawEnemyHP(enemy.hpBar, enemy.hp / enemy.maxHP);
        }
        if (affixResult.shouldTeleport && dist < detRange) {
          const ox = (Math.random() - 0.5) * 80;
          const oy = (Math.random() - 0.5) * 80;
          enemy.position.x += ox;
          enemy.position.y += oy;
          enemy.sprite.x = enemy.position.x;
          enemy.sprite.y = enemy.position.y;
        }
        // Shield visual
        if (affixResult.shieldChanged) {
          const gfx = enemy.sprite.children[1] as Graphics;
          if (gfx) gfx.alpha = enemy.affixState.shieldActive ? 0.4 : 1.0;
        }
      }

      // Speed multiplier for boss phases and affixes
      const bossSpeedMult = enemy.bossState
        ? enemy.bossState.getCurrentPhase(enemy.hp / enemy.maxHP).speedMultiplier : 1;
      const affixSpeedMult = enemy.affixState ? getAffixSpeedMultiplier(enemy.affixState) : 1;
      const speedMult = bossSpeedMult * affixSpeedMult;

      // Behavior-specific AI
      const behaviorKey = enemy.data.id + '_' + enemy.spawn.position.col + '_' + enemy.spawn.position.row;
      const behaviorState = this.enemyBehaviors.get(behaviorKey);
      const hpPct = enemy.hp / (enemy.maxHP || enemy.data.maxHP);
      const patrolWaypoints = enemy.spawn.patrolPath
        ? enemy.spawn.patrolPath.map(p => isoToScreen(p.col, p.row))
        : null;
      const enemyIdx = this.enemies.indexOf(enemy);
      const bResult = behaviorState
        ? updateBehavior(behaviorState, dt, enemy.position.x, enemy.position.y,
            playerPos.x, playerPos.y, dist, detRange, atkRange, hpPct,
            this.enemies, enemyIdx, patrolWaypoints)
        : null;

      // Apply behavior detection modifier
      const effectiveDetRange = bResult ? detRange * bResult.detectionMult : detRange;

      // Support heal logic
      if (bResult?.shouldHealAlly && bResult.healTargetIndex >= 0 && bResult.healTargetIndex < this.enemies.length) {
        const ally = this.enemies[bResult.healTargetIndex];
        if (!ally.isDead) {
          const healAmt = Math.floor((enemy.maxHP || enemy.data.maxHP) * 0.1);
          ally.hp = Math.min(ally.maxHP || ally.data.maxHP, ally.hp + healAmt);
          this.drawEnemyHP(ally.hpBar, ally.hp / (ally.maxHP || ally.data.maxHP));
          this.showFloatingText(ally.position.x, ally.position.y - 30, `+${healAmt}`, 0x44ff44);
          MusicManager.shared.playSFX('heal');
        }
      }

      // Flee behavior override
      if (bResult?.shouldFlee) {
        enemy.state = 'chasing'; // Still 'chasing' state visually, but running away
        const speed = enemy.data.speed * 35 * dt * speedMult;
        enemy.position.x += bResult.moveX * speed;
        enemy.position.y += bResult.moveY * speed;
        enemy.sprite.x = enemy.position.x;
        enemy.sprite.y = enemy.position.y;
      } else if (dist < atkRange && enemy.attackCooldown <= 0) {
        // Ranged enemies back away when too close instead of attacking
        if (bResult && enemy.data.behavior === 'ranged' && bResult.shouldMove) {
          const speed = enemy.data.speed * 25 * dt * speedMult;
          enemy.position.x += bResult.moveX * speed;
          enemy.position.y += bResult.moveY * speed;
          enemy.sprite.x = enemy.position.x;
          enemy.sprite.y = enemy.position.y;
        } else {
          enemy.state = 'attacking';
          const atkSpeedMult = bResult?.attackSpeedMult ?? 1;
          enemy.attackCooldown = 1.5 / atkSpeedMult;
          this.enemyAttacksPlayer(enemy, bResult?.damageMult ?? 1);
        }
      } else if (dist < effectiveDetRange) {
        if (enemy.state !== 'chasing') {
          BestiaryManager.shared.registerEncounter(enemy.data);
          if (enemy.enemyAnim) setEnemyAlert(enemy.enemyAnim);
        }
        enemy.state = 'chasing';
        const speed = enemy.data.speed * 30 * dt * speedMult;

        // Guard behavior: return to post if too far
        if (bResult?.shouldMove && enemy.data.behavior === 'guard') {
          enemy.position.x += bResult.moveX * speed;
          enemy.position.y += bResult.moveY * speed;
          enemy.sprite.x = enemy.position.x;
          enemy.sprite.y = enemy.position.y;
        } else {
          // A* pathfinding movement
          const pathKey = behaviorKey;
          let cached = this.enemyPaths.get(pathKey);
          const eGrid = screenToIso(enemy.position.x, enemy.position.y);
          const pGrid = screenToIso(playerPos.x, playerPos.y);
          const eCol = Math.round(eGrid.col);
          const eRow = Math.round(eGrid.row);
          const pCol = Math.round(pGrid.col);
          const pRow = Math.round(pGrid.row);

          const needsPath = !cached || cached.age > 0.8 ||
            cached.targetCol !== pCol || cached.targetRow !== pRow ||
            cached.idx >= cached.waypoints.length;

          if (needsPath && this.pathfinder) {
            const gridPath = this.pathfinder.findPath(eCol, eRow, pCol, pRow);
            if (gridPath && gridPath.length > 1) {
              const smooth = smoothPath(gridPath);
              cached = { waypoints: smooth.map(g => isoToScreen(g.col, g.row)), idx: 1, targetCol: pCol, targetRow: pRow, age: 0 };
              this.enemyPaths.set(pathKey, cached);
            } else {
              cached = undefined;
            }
          }

          if (cached) {
            cached.age += dt;
            if (cached.idx < cached.waypoints.length) {
              const wp = cached.waypoints[cached.idx];
              const dx = wp.x - enemy.position.x;
              const dy = wp.y - enemy.position.y;
              if (Math.hypot(dx, dy) < 8) {
                cached.idx++;
              } else {
                const a = Math.atan2(dy, dx);
                enemy.position.x += Math.cos(a) * speed;
                enemy.position.y += Math.sin(a) * speed;
              }
            }
          } else {
            const angle = Math.atan2(playerPos.y - enemy.position.y, playerPos.x - enemy.position.x);
            enemy.position.x += Math.cos(angle) * speed;
            enemy.position.y += Math.sin(angle) * speed;
          }
          enemy.sprite.x = enemy.position.x;
          enemy.sprite.y = enemy.position.y;
        }
      } else {
        // Idle: behavior-specific idle movement (patrol, wander)
        if (bResult?.shouldMove && !bResult.shouldFlee) {
          const speed = enemy.data.speed * 15 * dt;
          enemy.position.x += bResult.moveX * speed;
          enemy.position.y += bResult.moveY * speed;
          enemy.sprite.x = enemy.position.x;
          enemy.sprite.y = enemy.position.y;
          enemy.state = 'idle';
        } else {
          enemy.state = 'idle';
        }
        this.enemyPaths.delete(behaviorKey);
      }
    }
  }

  // ─── NPC Proximity ───────────────────────────────────────────

  private checkProximity(dt: number = 1 / 60): void {
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
        // Report secret area discovery for hidden quests
        const hqNotifs = HiddenQuestManager.shared.reportTrigger('visit_secret_area', this.zone.worldID, this.zone.worldID);
        for (const n of hqNotifs) {
          this.showFloatingText(this.playerScreenPos.x, this.playerScreenPos.y - 70, n.message, n.completed ? 0xffdd44 : 0x88ccff);
        }
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

    // Check environment objects (interactables + traps)
    this.nearbyEnvObject = null;
    const playerGrid = screenToIso(this.playerScreenPos.x, this.playerScreenPos.y);
    const pCol = Math.round(playerGrid.col);
    const pRow = Math.round(playerGrid.row);
    for (const obj of this.environmentObjects) {
      if (obj.activated && (obj.type === 'breakable' || obj.type === 'obelisk')) continue;
      const objPos = isoToScreen(obj.position.col, obj.position.row);
      const dist = Math.hypot(objPos.x - this.playerScreenPos.x, objPos.y - this.playerScreenPos.y);

      // Reveal hidden traps when very close
      if (obj.hidden && dist < 30) {
        obj.hidden = false;
        obj.sprite.alpha = 1;
      }

      // Check trap triggers
      if (obj.type === 'spikeTrap' || obj.type === 'poisonVent') {
        const trapResult = checkTrapTrigger(obj, pCol, pRow, dt);
        if (trapResult) {
          const trapDmgMult = NewGamePlusManager.shared.getDifficulty().trapDamageMult;
          const champ = GameManager.shared.champion;
          if (champ) {
            const dmg = Math.floor(trapResult.damage * trapDmgMult);
            champ.currentHP -= dmg;
            this.showDamageNumber(this.playerScreenPos.x, this.playerScreenPos.y - 40, dmg, false, 0xff4444);
            MusicManager.shared.playSFX(trapResult.sfx);
            if (trapResult.message) this.showFloatingText(this.playerScreenPos.x, this.playerScreenPos.y - 55, trapResult.message, 0xff6644);
            this.shakeCamera(2, 0.1);
            if (champ.currentHP <= 0) { champ.currentHP = 0; this.handlePlayerDeath(); }
          }
          // Redraw trap sprite as activated
          obj.sprite.removeChildren();
          const newSprite = createEnvironmentSprite(obj);
          for (const child of newSprite.children) obj.sprite.addChild(child);
        }
      }

      // Nearby interactable
      if (dist < 45 && (obj.type === 'lever' || obj.type === 'breakable' || obj.type === 'obelisk' || obj.type === 'pushBlock')) {
        this.nearbyEnvObject = obj;
      }
    }

    // Determine mode (priority: NPC > Building > Exit > Secret > Loot > EnvObj > Attack)
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
    } else if (this.nearbyEnvObject) {
      newMode = 'loot';
      const typeLabels: Record<string, string> = {
        lever: 'Actionner le levier', breakable: 'Briser', obelisk: 'Examiner', pushBlock: 'Pousser',
      };
      promptText = typeLabels[this.nearbyEnvObject.type] ?? 'Interagir';
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
    MusicManager.shared.enterCombat();

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

    // Shield check (affix)
    if (closest.affixState?.shieldActive) {
      MusicManager.shared.playSFX('block');
      this.showDamageNumber(closest.position.x, closest.position.y - 30, 0, false, 0x4488ff, 'block');
      return;
    }

    const baseDmg = Math.max(1, champ.baseStats.strength + Math.floor(Math.random() * 5));
    const statusDmgMult = this.playerStatusEffects.getDamageMultiplier();
    const comboResult = ComboManager.shared.registerHit();
    const damage = Math.floor(baseDmg * statusDmgMult * comboResult.multiplier * getCompanionDamageBonus());
    const isCrit = Math.random() < champ.baseStats.luck * 0.01;
    const totalDmg = isCrit ? damage * 2 : damage;

    closest.hp -= totalDmg;
    const dmgStyle: DamageStyle = isCrit ? 'crit' : comboResult.combo >= 5 ? 'combo' : 'normal';
    MusicManager.shared.playSFX(isCrit ? 'crit' : comboResult.combo >= 5 ? 'combo' : 'hit');
    this.showDamageNumber(closest.position.x, closest.position.y - 30, totalDmg, isCrit, undefined, dmgStyle, comboResult.combo);
    this.drawEnemyHP(closest.hpBar, closest.hp / closest.maxHP);

    // Thorns affix: reflect damage back to player
    if (closest.affixState) {
      const thornsDmg = getThornsDamage(closest.affixState, totalDmg);
      if (thornsDmg > 0) {
        champ.currentHP = Math.max(0, champ.currentHP - thornsDmg);
        this.showDamageNumber(this.playerScreenPos.x, this.playerScreenPos.y - 40, thornsDmg, false, 0x88aa44, 'poison');
      }
      // Vampiric affix: enemy heals from being hit (on their turn, simulated)
      const vampHeal = getVampiricHeal(closest.affixState, totalDmg);
      if (vampHeal > 0) {
        closest.hp = Math.min(closest.maxHP, closest.hp + vampHeal);
        this.showDamageNumber(closest.position.x, closest.position.y - 20, vampHeal, false, 0xcc2244, 'heal');
      }
    }

    // Hit flash + shake animation
    animateEnemyHit(closest.sprite);
    if (closest.enemyAnim) triggerEnemyHurt(closest.enemyAnim);
    createHitImpact(
      this.worldContainer, closest.position.x, closest.position.y,
      champ.championClass, isCrit, this.particles as any,
    );

    // Directional slash mark
    const hitAngle = Math.atan2(closest.position.y - this.playerScreenPos.y, closest.position.x - this.playerScreenPos.x);
    createDirectionalSlash(this.worldContainer, closest.position.x, closest.position.y, hitAngle, isCrit, isCrit ? 0xffdd44 : 0xcccccc);

    // Crit flash and hit stop
    if (isCrit) {
      createCritFlash(this.uiContainer, this.app.screen.width, this.app.screen.height);
      triggerHitStop(0.05);
      this.shakeCamera(4, 0.2);
    }

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

    // Magic SFX based on champion class
    const classSfxMap: Record<string, string> = {
      mistborn: 'magic_allomancy', radiant: 'magic_surgebinding',
      awakener: 'magic_awakening', elantrian: 'magic_aondor',
      sandMaster: 'magic_sand', nightmarePainter: 'magic_paint',
    };
    MusicManager.shared.playSFX(classSfxMap[champ.championClass] ?? 'magic_surgebinding');

    // Skill visual effect
    this.showSkillEffect(skill.range * 32);

    const range = skill.range * 32;
    for (const enemy of this.enemies) {
      if (enemy.isDead) continue;
      const dist = Math.hypot(enemy.position.x - this.playerScreenPos.x, enemy.position.y - this.playerScreenPos.y);
      if (dist < range) {
        // Apply talent magic damage bonus and investiture cost reduction
        const talents = GameManager.shared.talentSystem;
        const magicBonus = 1 + (talents?.getBonus('magicDamagePercent') ?? 0);
        const baseDmg = skill.baseDamage + Math.floor(champ.baseStats.spirit * 0.5);
        const damage = Math.floor(baseDmg * magicBonus);
        // Apply skill-specific effects
        const isCrit = Math.random() < (champ.baseStats.luck * 0.01 + (talents?.getBonus('critChancePercent') ?? 0));
        const critMult = 2 * (1 + (talents?.getBonus('critDamagePercent') ?? 0));
        const finalDmg = isCrit ? Math.floor(damage * critMult) : damage;
        enemy.hp -= finalDmg;
        this.showDamageNumber(enemy.position.x, enemy.position.y - 30, finalDmg, isCrit);
        if (isCrit) {
          createCritFlash(this.uiContainer, this.app.screen.width, this.app.screen.height);
          triggerHitStop(0.05);
        }
        createHitImpact(this.worldContainer, enemy.position.x, enemy.position.y, champ.championClass, isCrit, this.particles as any);
        animateEnemyHit(enemy.sprite);
        if (enemy.enemyAnim) triggerEnemyHurt(enemy.enemyAnim);

        // Skill-specific mechanical effects
        if (skill.id === 'steel_push' && dist > 0) {
          // Knockback: push enemy away from player
          const pushDX = (enemy.position.x - this.playerScreenPos.x) / dist;
          const pushDY = (enemy.position.y - this.playerScreenPos.y) / dist;
          const knockDist = 60;
          enemy.position.x += pushDX * knockDist;
          enemy.position.y += pushDY * knockDist;
          enemy.sprite.x = enemy.position.x;
          enemy.sprite.y = enemy.position.y;
        } else if (skill.id === 'iron_pull' && dist > 30) {
          // Pull: drag enemy toward player
          const pullDX = (this.playerScreenPos.x - enemy.position.x) / dist;
          const pullDY = (this.playerScreenPos.y - enemy.position.y) / dist;
          const pullDist = Math.min(dist - 30, 80);
          enemy.position.x += pullDX * pullDist;
          enemy.position.y += pullDY * pullDist;
          enemy.sprite.x = enemy.position.x;
          enemy.sprite.y = enemy.position.y;
        }

        // Apply status effects from skill data
        if (skill.statusEffects) {
          for (const se of skill.statusEffects) {
            if (Math.random() < (se.chance ?? 1)) {
              // For enemy debuffs, we show visual feedback
              this.showFloatingText(enemy.position.x, enemy.position.y - 40, `${se.effectType}!`, 0xffaa44);
            }
          }
        }

        this.drawEnemyHP(enemy.hpBar, enemy.hp / enemy.maxHP);
        if (enemy.hp <= 0) this.killEnemy(enemy);
      }
    }
  }

  private showSkillEffect(range: number): void {
    const cls = GameManager.shared.champion?.championClass ?? 'mistborn';
    createSkillEffect(
      this.worldContainer,
      this.playerScreenPos.x, this.playerScreenPos.y,
      range, cls, this.particles,
    );
    // Lingering ground mark where skill was cast
    createSkillGroundMark(
      this.worldContainer,
      this.playerScreenPos.x, this.playerScreenPos.y,
      range, cls,
    );
  }

  // ─── Ultimate Ability ────────────────────────────────────────

  private handleUltimate(): void {
    const champ = GameManager.shared.champion;
    if (!champ) return;

    // Ultimate costs 50% of max investiture
    const cost = Math.floor(GameManager.shared.maxInvestiture * 0.5);
    if (champ.currentInvestiture < cost) {
      this.showFloatingText(this.playerScreenPos.x, this.playerScreenPos.y - 60, 'Investiture insuffisante!', 0xff4444);
      return;
    }
    champ.currentInvestiture -= cost;

    // Cast animation
    this.playerAnimator.setState('cast');
    MusicManager.shared.playSFX('magic_surgebinding');

    // Ultimate: massive AOE damage based on class
    const cls = champ.championClass;
    const baseDmg = 80 + champ.level * 10 + champ.baseStats.spirit * 2;
    const talents = GameManager.shared.talentSystem;
    const magicBonus = 1 + (talents?.getBonus('magicDamagePercent') ?? 0);
    const ultimateDmg = Math.floor(baseDmg * magicBonus);
    const range = 200; // Large AOE radius

    // Visual effect
    this.showSkillEffect(range);
    createCritFlash(this.uiContainer, this.app.screen.width, this.app.screen.height);
    this.shakeCamera(8, 0.4);

    // Hit all enemies in range
    let killCount = 0;
    for (const enemy of this.enemies) {
      if (enemy.isDead) continue;
      const dist = Math.hypot(enemy.position.x - this.playerScreenPos.x, enemy.position.y - this.playerScreenPos.y);
      if (dist < range) {
        enemy.hp -= ultimateDmg;
        this.showDamageNumber(enemy.position.x, enemy.position.y - 30, ultimateDmg, true, 0xffdd44);
        animateEnemyHit(enemy.sprite);
        if (enemy.enemyAnim) triggerEnemyHurt(enemy.enemyAnim);
        this.drawEnemyHP(enemy.hpBar, enemy.hp / enemy.maxHP);
        if (enemy.hp <= 0) {
          this.killEnemy(enemy);
          killCount++;
        }
      }
    }

    if (killCount > 0) {
      this.showFloatingText(this.playerScreenPos.x, this.playerScreenPos.y - 80, `ULTIME! ${killCount} éliminé(s)!`, 0xffcc33);
    }
  }

  // ─── Potion Use ──────────────────────────────────────────────

  private usePotion(slotIndex: number): void {
    const champ = GameManager.shared.champion;
    if (!champ) return;

    const effect = PotionManager.shared.usePotion(slotIndex);
    if (!effect) {
      MusicManager.shared.playSFX('error');
      this.showFloatingText(this.playerScreenPos.x, this.playerScreenPos.y - 50, 'Pas de potion!', 0xff6644);
      return;
    }

    MusicManager.shared.playSFX('potion');

    if (effect.healPercent) {
      const heal = Math.floor(GameManager.shared.maxHP * effect.healPercent);
      champ.currentHP = Math.min(GameManager.shared.maxHP, champ.currentHP + heal);
      this.showDamageNumber(this.playerScreenPos.x, this.playerScreenPos.y - 30, heal, false, 0x44ff66);
    }
    if (effect.investiturePercent) {
      const restore = Math.floor(GameManager.shared.maxInvestiture * effect.investiturePercent);
      champ.currentInvestiture = Math.min(GameManager.shared.maxInvestiture, champ.currentInvestiture + restore);
      this.showDamageNumber(this.playerScreenPos.x, this.playerScreenPos.y - 40, restore, false, 0x8866ff);
    }
    if (effect.statusType && effect.statusDuration) {
      this.playerStatusEffects.apply(
        effect.statusType as any,
        effect.statusDuration,
        effect.statusMagnitude ?? 1,
      );
    }

    if (this.potionHotbar) this.potionHotbar.refresh();
  }

  private enemyAttacksPlayer(enemy: EnemyInstance, behaviorDmgMult: number = 1): void {
    const champ = GameManager.shared.champion;
    if (!champ) return;

    const defense = champ.baseStats.vigor / 2;
    const nightmareMult = this.worldMechanics instanceof KomashiMechanics
      ? (this.worldMechanics as KomashiMechanics).getDamageMultiplier() : 1;
    const bossMult = enemy.bossState
      ? enemy.bossState.getCurrentPhase(enemy.hp / enemy.maxHP).damageMultiplier : 1;
    const affixDmgMult = enemy.affixState
      ? getAffixDamageMultiplier(enemy.affixState, enemy.hp / enemy.maxHP) : 1;
    const ngpDmgMult = NewGamePlusManager.shared.getDifficulty().enemyDamageMult;
    const shieldReduction = 1 - this.playerStatusEffects.getDamageReduction();
    const damage = Math.max(1, Math.floor((enemy.data.damage - defense) * nightmareMult * bossMult * affixDmgMult * behaviorDmgMult * ngpDmgMult * shieldReduction));
    champ.currentHP -= damage;

    this.showDamageNumber(this.playerScreenPos.x, this.playerScreenPos.y - 40, damage, false, 0xff4444);
    MusicManager.shared.playSFX('hit');

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
    if (enemy.enemyAnim) triggerEnemyDeath(enemy.enemyAnim);
    if (enemy.bossAuraGfx) { enemy.sprite.removeChild(enemy.bossAuraGfx); enemy.bossAuraGfx.destroy(); enemy.bossAuraGfx = undefined; }
    MusicManager.shared.playSFX('death');

    // Kill burst visual
    const worldColor = WORLD_ENEMY_COLORS[enemy.data.worldID]?.[enemy.data.tier] ?? 0x888888;
    createKillBurst(this.worldContainer, enemy.position.x, enemy.position.y, enemy.data.tier, worldColor);

    // Ground crack for elite/boss kills
    if (enemy.data.tier === 'elite' || enemy.data.tier === 'boss') {
      createGroundCrack(this.worldContainer, enemy.position.x, enemy.position.y, enemy.data.tier === 'boss' ? 30 : 18);
    }

    // Kill streak tracking
    this.killStreak++;
    this.killStreakTimer = 5;
    if ([3, 5, 7, 10, 15].includes(this.killStreak)) {
      showKillStreakBanner(this.uiContainer, this.app.screen.width, this.app.screen.height, this.killStreak);
    }

    // Track in bestiary & achievements
    BestiaryManager.shared.registerKill(enemy.data);
    AchievementManager.shared.recordKill(enemy.data.tier);
    AchievementManager.shared.recordCreatureDiscovered(BestiaryManager.shared.totalDiscovered);

    // Hidden quest: rare enemy kills
    if (enemy.data.tier === 'elite' || enemy.data.tier === 'boss') {
      const hqNotifs = HiddenQuestManager.shared.reportTrigger('kill_rare_enemy', 'nightmare_rare', this.zone.worldID);
      for (const n of hqNotifs) {
        this.showFloatingText(this.playerScreenPos.x, this.playerScreenPos.y - 70, n.message, n.completed ? 0xffdd44 : 0x88ccff);
      }
    }

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

    // Death particles (pooled)
    for (let i = 0; i < 6; i++) {
      const p = this.particlePool.acquire();
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

    const ngpRewards = NewGamePlusManager.shared.applyToRewards(
      enemy.data.xpReward,
      enemy.data.goldMin + Math.floor(Math.random() * (enemy.data.goldMax - enemy.data.goldMin + 1)),
    );
    const baseGold = ngpRewards.gold;
    const gold = Math.floor(baseGold * getEventGoldBonus(this.activeEventEffect));
    champ.gold += gold;

    // Apply reputation XP bonus + event bonus + NG+ bonus
    const xpMultiplier = getBonusXPMultiplier(this.zone.worldID);
    const finalXP = Math.floor(ngpRewards.xp * xpMultiplier * getCompanionXPBonus() * getEventXPBonus(this.activeEventEffect));
    const leveledUp = gm.grantXP(finalXP);
    if (leveledUp) MusicManager.shared.playSFX('level_up');

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

    // Chance to drop potions (20% for normal, 50% for elite, 100% for boss)
    const potionDropChance = enemy.data.tier === 'boss' ? 1 : enemy.data.tier === 'elite' ? 0.5 : 0.2;
    if (Math.random() < potionDropChance) {
      const potionPool = ['potion_heal_small', 'potion_investiture', 'potion_heal_small', 'potion_strength', 'potion_haste', 'potion_shield', 'potion_regen'];
      const potionID = potionPool[Math.floor(Math.random() * potionPool.length)];
      if (PotionManager.shared.addPotion(potionID)) {
        this.showFloatingText(enemy.position.x, enemy.position.y - 50, `+1 Potion!`, 0xff88cc);
        if (this.potionHotbar) this.potionHotbar.refresh();
      }
    }

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

          // Loot SFX based on rarity
          const lootSfxMap: Record<string, string> = {
            common: 'loot_common', uncommon: 'loot_common',
            rare: 'loot_rare', epic: 'loot_epic',
            legendary: 'loot_legendary', cosmeric: 'loot_legendary',
          };
          MusicManager.shared.playSFX(lootSfxMap[item.rarity] ?? 'loot_common');

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

    // ── Passive Regeneration (base + talents) ──
    const talents = GameManager.shared.talentSystem;
    const baseInvRegen = 1.5; // Base passive investiture regen per second
    const baseHPRegen = 0.5;  // Base passive HP regen per second
    const talentInvRegen = talents?.getBonus('investitureRegenPerSecond') ?? 0;
    const talentHPRegen = talents?.getBonus('hpRegenPerSecond') ?? 0;
    const totalInvRegen = (baseInvRegen + talentInvRegen) * dt;
    const totalHPRegen = (baseHPRegen + talentHPRegen) * dt;

    if (champ.currentInvestiture < GameManager.shared.maxInvestiture) {
      champ.currentInvestiture = Math.min(GameManager.shared.maxInvestiture, champ.currentInvestiture + totalInvRegen);
    }
    if (champ.currentHP < GameManager.shared.maxHP && champ.currentHP > 0) {
      champ.currentHP = Math.min(GameManager.shared.maxHP, champ.currentHP + totalHPRegen);
    }

    // Apply periodic damage/heal from status effects
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

  private showDamageNumber(
    x: number, y: number, amount: number, isCrit: boolean,
    color?: number, dmgStyle?: DamageStyle, comboCount = 0,
  ): void {
    // Determine style from params if not explicitly set
    let style: DamageStyle = dmgStyle ?? 'normal';
    if (!dmgStyle) {
      if (isCrit) style = 'crit';
      else if (color === 0xff4444) style = 'normal'; // enemy damage to player
      else if (color === 0x44cc44 || color === 0x44ff66) style = 'heal';
      else if (color === 0x66cc44) style = 'xp';
      else if (color === 0xe6cc33) style = 'gold';
      else if (color === 0x8866ff) style = 'investiture';
    }
    this.floatingDmg.spawn(x, y, amount, style, comboCount);
  }

  private updateWorldMechanics(dt: number): void {
    updateWorldMechanicsModule(dt, this.worldMechanics, (x, y, msg, c) => this.showFloatingText(x, y, msg, c), this.playerScreenPos);
  }

  private updateWorldEvents(dt: number): void {
    this.activeEventEffect = updateWorldEventsModule(
      dt, this.zone.worldID, this.eventBanner,
      (x, y, msg, c) => this.showFloatingText(x, y, msg, c), this.playerScreenPos,
    );
  }

  private updateDayNight(dt: number): void {
    updateDayNightModule(
      dt, this.dayNightManager, this.dayNightOverlay, this.npcs,
      (x, y, msg, c) => this.showFloatingText(x, y, msg, c), this.playerScreenPos,
      () => this.updateNPCSchedules(),
    );
  }

  private initNPCSchedules(): void {
    initNPCSchedulesModule(this.npcs, this.dayNightManager.currentTime);
  }

  private updateNPCSchedules(): void {
    updateNPCSchedulesModule(this.npcs, this.dayNightManager.currentTime);
  }

  private updateWeather(dt: number): void {
    updateWeatherModule(
      dt, this.weatherManager, this.weatherOverlay, this.ambientAtmosphere,
      this.worldContainer,
      (x, y, msg, c) => this.showFloatingText(x, y, msg, c),
      (intensity, duration) => this.shakeCamera(intensity, duration),
      () => this.handlePlayerDeath(), this.playerScreenPos,
    );
  }

  private updateAchievements(dt: number): void {
    updateAchievementsModule(dt, this.achievementToast);
  }

  // Companion methods → delegated to ZoneCompanion module
  private spawnCompanionSprite(): void {
    spawnCompanionSpriteModule(this.worldContainer, this.companionState, this.playerScreenPos);
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
    let fadeLast = performance.now();
    const fadeOut = () => {
      if (flash.destroyed) return;
      const now = performance.now();
      const dtSec = (now - fadeLast) / 1000;
      fadeLast = now;
      elapsed += dtSec;
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
          MusicManager.shared.playSFX('quest_complete');
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
    let txtLast = performance.now();
    const anim = () => {
      if (txt.destroyed) return;
      const now = performance.now();
      const dtSec = (now - txtLast) / 1000;
      txtLast = now;
      elapsed += dtSec;
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
    let lvlLast = performance.now();
    const anim = () => {
      if (txt.destroyed) return;
      const now = performance.now();
      const dtSec = (now - lvlLast) / 1000;
      lvlLast = now;
      elapsed += dtSec;
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
    let shakeLast = performance.now();

    const shake = () => {
      const now = performance.now();
      const dtSec = (now - shakeLast) / 1000;
      shakeLast = now;
      elapsed += dtSec;
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

          // Complete escort quests when leaving zone (NPC escorted to safety)
          for (const npc of this.npcs) {
            QuestManager.shared.onEscortComplete(npc.id);
          }
          this.checkQuestCompletion();

          // Transition effect
          MusicManager.shared.playSFX('dash');
          const flash = new Graphics();
          flash.rect(0, 0, this.app.screen.width, this.app.screen.height).fill({ color: 0x000000, alpha: 0 });
          flash.zIndex = 99999;
          this.uiContainer.addChild(flash);

          let elapsed = 0;
          let zoneLast = performance.now();
          const fadeOut = () => {
            if (flash.destroyed) return;
            const now = performance.now();
            const dtSec = (now - zoneLast) / 1000;
            zoneLast = now;
            elapsed += dtSec;
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
              SaveManager.shared.autoSave();
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

  // darkenColor/lightenColor extracted — use darken/lighten from ColorUtils directly

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
