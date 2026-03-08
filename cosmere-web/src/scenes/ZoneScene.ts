import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { GameScene } from '../game/SceneRouter';
import { SceneRouter } from '../game/SceneRouter';
import { GameManager } from '../game/GameManager';
import { gameData } from '../data/DataLoader';
import { VirtualJoystick } from '../ui/VirtualJoystick';
import { ActionButtons } from '../ui/ActionButtons';
import { HUD } from '../ui/HUD';
import { QuestTracker } from '../ui/QuestTracker';
import { Minimap } from '../ui/Minimap';
import { UILayoutManager } from '../ui/UILayoutManager';
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
import { generateEnvironmentObjects, createEnvironmentSprite } from '../systems/EnvironmentInteractions';
import { spawnGatheringNodes, findNearbyNode, gatherFromNode, updateGatheringNodes } from '../systems/GatheringNodes';
import type { GatheringNode } from '../systems/GatheringNodes';
import { ProfessionManager } from '../game/ProfessionSystem';
import type { EnvironmentObject } from '../systems/EnvironmentInteractions';
import { HiddenQuestManager } from '../systems/HiddenQuests';
import { ObjectPool } from '../systems/ObjectPool';
import { updateSkillVFX, clearSkillVFX } from '../systems/SkillAnimations';
import { NewGamePlusManager } from '../systems/NewGamePlus';
import { CompanionManager } from '../game/CompanionSystem';
import { ComboManager, createComboDisplay } from '../game/ComboSystem';
import { WorldEventManager } from '../game/WorldEvents';
import type { WorldEventEffect } from '../game/WorldEvents';
import { createWorldEventBanner } from '../ui/WorldEventBanner';
import { WorldMapScene } from './WorldMapScene';
import { PotionManager } from '../game/PotionSystem';
import { createPotionHotbar } from '../ui/PotionHotbar';
import { spawnWalls, spawnEnterableBuildings, spawnSecretAreas, revealSecret } from '../rendering/MapStructures';
import { renderEnhancedTilemap } from '../rendering/TileRenderer';
import type { WallSegment, EnterableBuilding, SecretArea } from '../rendering/MapStructures';
import type { SpellParticle } from '../rendering/SpellEffects';
import { createReputationBadge } from '../game/ReputationSystem';
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
import {
  killEnemy as killEnemyModule,
  updateStatusEffects as updateStatusEffectsModule,
  updateCombat as updateCombatModule,
} from './zone/ZoneCombat';
import type { KillHost } from './zone/ZoneCombat';
import {
  updateEnemyAI as updateEnemyAIModule,
} from './zone/ZoneEnemyAI';
import {
  handleAttack as handleAttackModule,
  handleSkill as handleSkillModule,
  handleUltimate as handleUltimateModule,
  usePotion as usePotionModule,
  enemyAttacksPlayer as enemyAttacksPlayerModule,
} from './zone/ZoneActions';
import type { ActionHost } from './zone/ZoneActions';
import {
  checkProximity as checkProximityModule,
} from './zone/ZoneProximity';
import type { ProximityHost } from './zone/ZoneProximity';
import {
  showFloatingText as showFloatingTextModule,
  showLevelUp as showLevelUpModule,
  shakeCamera as shakeCameraModule,
  updateCamera as updateCameraModule,
  handlePlayerDeath as handlePlayerDeathModule,
  respawnPlayer as respawnPlayerModule,
  refreshMinimap as refreshMinimapModule,
  checkQuestCompletion as checkQuestCompletionModule,
  sortZOrder as sortZOrderModule,
} from './zone/ZoneVisuals';
import type { AIHost, CachedPath } from './zone/ZoneEnemyAI';
import {
  spawnNPCs as spawnNPCsModule,
  formatNPCName as formatNPCNameModule,
  spawnLootPoints as spawnLootPointsModule,
  collectLoot as collectLootModule,
  spawnEnemies as spawnEnemiesModule,
  drawEnemyHP as drawEnemyHPModule,
  renderExits as renderExitsModule,
} from './zone/ZoneSpawning';
import {
  handleInteraction as handleInteractionModule,
  enterBuilding as enterBuildingModule,
  interactWithSecret as interactWithSecretModule,
  interactWithEnvObject as interactWithEnvObjectModule,
  gatherFromNode as gatherFromNodeModule,
  interactWithNPC as interactWithNPCModule,
  closeDialogue as closeDialogueModule,
} from './zone/ZoneInteraction';
import type { InteractionHost } from './zone/ZoneInteraction';
import {
  checkZoneExit as checkZoneExitModule,
} from './zone/ZoneTransitions';
import type { TransitionHost } from './zone/ZoneTransitions';

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
  private enemyPaths: Map<string, CachedPath> = new Map();
  private nearbyBuilding: EnterableBuilding | null = null;
  private nearbySecret: SecretArea | null = null;
  private environmentObjects: EnvironmentObject[] = [];
  private nearbyEnvObject: EnvironmentObject | null = null;
  private gatheringNodes: GatheringNode[] = [];
  private nearbyGatherNode: GatheringNode | null = null;
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
    this.uiContainer.sortableChildren = true;
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

    // ─── Draggable UI Layout ─────────────────────────────────
    const layoutMgr = UILayoutManager.shared;
    layoutMgr.clear();
    layoutMgr.setScreenSize(w, h);

    // Register all movable UI elements with their default positions
    layoutMgr.register('HUD', this.hud, this.hud.x, this.hud.y);
    layoutMgr.register('Joystick', this.joystick, this.joystick.x, this.joystick.y);
    layoutMgr.register('Actions', this.actionButtons, this.actionButtons.x, this.actionButtons.y);
    // Minimap already has its own built-in drag+lock system
    layoutMgr.register('Quêtes', this.questTracker, this.questTracker.x, this.questTracker.y);
    if (this.potionHotbar) {
      layoutMgr.register('Potions', this.potionHotbar.container, this.potionHotbar.container.x, this.potionHotbar.container.y);
    }
    if (this.statusBar) {
      layoutMgr.register('Statuts', this.statusBar.container, this.statusBar.container.x, this.statusBar.container.y);
    }
    if (this.repBadge) {
      layoutMgr.register('Réputation', this.repBadge.container, this.repBadge.container.x, this.repBadge.container.y);
    }

    // Edit mode button (top-center) — pauses game while repositioning UI
    layoutMgr.onEditModeChanged((active) => {
      this.isPaused = active;
    });
    layoutMgr.createEditButton(this.uiContainer, w, h);

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
    this.npcs = spawnNPCsModule(this.zone, this.worldContainer, (spawn) => this.interactWithNPC(spawn));
  }

  private formatNPCName(npcID: string): string {
    return formatNPCNameModule(npcID);
  }

  private handleInteraction(mode: ActionMode): void {
    const h = this.buildInteractionHost();
    handleInteractionModule(mode, h);
    this.applyInteractionState(h);
  }

  private enterBuilding(building: EnterableBuilding): void {
    const h = this.buildInteractionHost();
    enterBuildingModule(building, h);
    this.applyInteractionState(h);
  }

  private interactWithSecret(secret: SecretArea): void {
    const h = this.buildInteractionHost();
    interactWithSecretModule(secret, h);
    this.applyInteractionState(h);
  }

  private interactWithEnvObject(obj: EnvironmentObject): void {
    interactWithEnvObjectModule(obj, this.buildInteractionHost());
  }

  private gatherFromNode(node: GatheringNode): void {
    gatherFromNodeModule(node, this.buildInteractionHost());
  }

  private interactWithNPC(spawn: { npcID: string; isShopkeeper: boolean; dialogueTreeID: string | null }): void {
    const h = this.buildInteractionHost();
    interactWithNPCModule(spawn, h);
    this.applyInteractionState(h);
  }

  private closeDialogue(): void {
    const h = this.buildInteractionHost();
    closeDialogueModule(h);
    this.applyInteractionState(h);
  }

  private buildInteractionHost(): InteractionHost {
    return {
      zone: this.zone,
      npcs: this.npcs,
      enterableBuildings: this.enterableBuildings,
      secretAreas: this.secretAreas,
      environmentObjects: this.environmentObjects,
      gatheringNodes: this.gatheringNodes,
      lootPoints: this.lootPoints,
      playerScreenPos: this.playerScreenPos,
      playerStatusEffects: this.playerStatusEffects,
      uiContainer: this.uiContainer,
      screenWidth: this.app.screen.width,
      screenHeight: this.app.screen.height,
      isTransitioning: this.isTransitioning,
      dialoguePanel: this.dialoguePanel,
      isPaused: this.isPaused,
      repBadge: this.repBadge,
      nearbyNPC: this.nearbyNPC,
      nearbyBuilding: this.nearbyBuilding,
      nearbySecret: this.nearbySecret,
      nearbyEnvObject: this.nearbyEnvObject,
      nearbyGatherNode: this.nearbyGatherNode,
      nearbyLoot: this.nearbyLoot,
      showFloatingText: (x, y, msg, c) => this.showFloatingText(x, y, msg, c),
      shakeCamera: (i, d) => this.shakeCamera(i, d),
      checkQuestCompletion: () => this.checkQuestCompletion(),
      collectLoot: (id) => this.collectLoot(id),
      gotoZoneScene: () => this.router.goto(ZoneScene),
    };
  }

  private applyInteractionState(h: InteractionHost): void {
    this.isTransitioning = h.isTransitioning;
    this.dialoguePanel = h.dialoguePanel;
    this.isPaused = h.isPaused;
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
    this.pauseMenu = togglePauseModule(h, this.pauseMenu, () => {
      // Resume callback: destroy menu and unpause
      if (this.pauseMenu) {
        this.pauseMenu.destroy({ children: true });
        this.pauseMenu = null;
      }
      this.isPaused = false;
    });
    this.isPaused = h.isPaused;
  }

  // ─── Loot Points ─────────────────────────────────────────────

  private spawnLootPoints(): void {
    this.lootPoints = spawnLootPointsModule(this.zone, this.worldContainer, (id) => this.collectLoot(id));
  }

  private collectLoot(lootId: string): void {
    collectLootModule(
      lootId, this.lootPoints, this.zone, this.playerScreenPos,
      (x, y, msg, color) => this.showFloatingText(x, y, msg, color),
      () => this.checkQuestCompletion(),
    );
  }

  private spawnEnemies(): void {
    const result = spawnEnemiesModule(this.zone, this.worldContainer, (bar, pct) => this.drawEnemyHP(bar, pct));
    this.enemies = result.enemies;
    this.enemyBehaviors = result.behaviors;

    // Generate environment objects (puzzles, traps, breakables)
    this.environmentObjects = generateEnvironmentObjects(
      this.zone.worldID, this.zone.gridWidth, this.zone.gridHeight,
      this.zone.type, this.zone.gridWidth * 1000 + this.zone.gridHeight,
    );
    for (const obj of this.environmentObjects) {
      obj.sprite = createEnvironmentSprite(obj);
      this.worldContainer.addChild(obj.sprite);
    }

    // Spawn gathering nodes for professions
    ProfessionManager.shared.load();
    const existingPositions = [
      ...this.npcs.map(n => ({ col: Math.round(n.position.x / 32), row: Math.round(n.position.y / 16) })),
      ...this.enterableBuildings.map(b => ({ col: b.col, row: b.row })),
    ];
    this.gatheringNodes = spawnGatheringNodes(
      this.worldContainer, isoToScreen,
      this.zone.gridWidth, this.zone.gridHeight,
      this.zone.worldID, this.zone.playerSpawnPosition,
      this.zone.connections, existingPositions,
    );

    // Report zone exploration for hidden quests
    HiddenQuestManager.shared.reportTrigger('visit_secret_area', this.zone.worldID, this.zone.worldID);
  }

  private drawEnemyHP(bar: Graphics, pct: number): void {
    drawEnemyHPModule(bar, pct);
  }

  private renderExits(): void {
    renderExitsModule(this.zone, this.worldContainer);
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
    // Clear UI layout handles
    UILayoutManager.shared.clear();
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
    const ah = this.aiHost;
    updateEnemyAIModule(dt, ah);
    // Sync mutable state back
    this.activeBoss = ah.activeBoss;
    this.bossHPBar = ah.bossHPBar as any;
  }

  private get aiHost(): AIHost {
    return {
      worldContainer: this.worldContainer,
      uiContainer: this.uiContainer,
      screenWidth: this.app.screen.width,
      playerScreenPos: this.playerScreenPos,
      enemies: this.enemies,
      worldMechanics: this.worldMechanics,
      dayNightManager: this.dayNightManager,
      playerStatusEffects: this.playerStatusEffects,
      playerAnimator: this.playerAnimator,
      enemyBehaviors: this.enemyBehaviors,
      enemyPaths: this.enemyPaths,
      pathfinder: this.pathfinder,
      activeBoss: this.activeBoss,
      bossHPBar: this.bossHPBar,
      showFloatingText: (x, y, msg, c) => this.showFloatingText(x, y, msg, c),
      showDamageNumber: (x, y, amt, crit, col, style) => this.showDamageNumber(x, y, amt, crit, col, style as any),
      shakeCamera: (i, d) => this.shakeCamera(i, d),
      drawEnemyHP: (hpBar, pct) => this.drawEnemyHP(hpBar, pct),
      enemyAttacksPlayer: (enemy, dmgMult) => this.enemyAttacksPlayer(enemy, dmgMult),
      handlePlayerDeath: () => this.handlePlayerDeath(),
    };
  }

  // ─── NPC Proximity ───────────────────────────────────────────

  private checkProximity(dt: number = 1 / 60): void {
    const result = checkProximityModule(dt, {
      playerScreenPos: this.playerScreenPos,
      npcs: this.npcs,
      lootPoints: this.lootPoints,
      enterableBuildings: this.enterableBuildings,
      secretAreas: this.secretAreas,
      environmentObjects: this.environmentObjects,
      gatheringNodes: this.gatheringNodes,
      zone: this.zone,
      showFloatingText: (x, y, msg, c) => this.showFloatingText(x, y, msg, c),
      showDamageNumber: (x, y, amt, crit, col?) => this.showDamageNumber(x, y, amt, crit, col),
      shakeCamera: (i, d) => this.shakeCamera(i, d),
      handlePlayerDeath: () => this.handlePlayerDeath(),
    });
    this.nearbyNPC = result.nearbyNPC;
    this.nearbyExit = result.nearbyExit;
    this.nearbyLoot = result.nearbyLoot;
    this.nearbyBuilding = result.nearbyBuilding;
    this.nearbySecret = result.nearbySecret;
    this.nearbyEnvObject = result.nearbyEnvObject;
    this.nearbyGatherNode = result.nearbyGatherNode;

    const newMode = result.mode;
    const promptText = result.promptText;
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

  // ─── Combat ── → delegated to ZoneActions module ─────────────

  private get actionHost(): ActionHost {
    return {
      worldContainer: this.worldContainer,
      uiContainer: this.uiContainer,
      screenWidth: this.app.screen.width,
      screenHeight: this.app.screen.height,
      playerScreenPos: this.playerScreenPos,
      playerFacing: this.playerFacing,
      enemies: this.enemies,
      playerStatusEffects: this.playerStatusEffects,
      playerAnimator: this.playerAnimator,
      worldMechanics: this.worldMechanics,
      particles: this.particles,
      attackCooldown: this.attackCooldown,
      actionButtons: this.actionButtons,
      potionHotbar: this.potionHotbar,
      showDamageNumber: (x: number, y: number, amt: number, crit: boolean, col?: number, style?: any, combo?: number) => this.showDamageNumber(x, y, amt, crit, col, style, combo),
      showFloatingText: (x: number, y: number, msg: string, c: number) => this.showFloatingText(x, y, msg, c),
      drawEnemyHP: (bar: any, pct: number) => this.drawEnemyHP(bar, pct),
      shakeCamera: (i: number, d: number) => this.shakeCamera(i, d),
      killEnemy: (e: EnemyInstance) => this.killEnemy(e),
      handlePlayerDeath: () => this.handlePlayerDeath(),
    };
  }

  private handleAttack(): void {
    if (this.attackCooldown > 0) return;
    this.attackCooldown = handleAttackModule(this.actionHost);
  }

  private handleSkill(index: number): void {
    handleSkillModule(index, this.actionHost);
  }

  private handleUltimate(): void {
    handleUltimateModule(this.actionHost);
  }

  private usePotion(slotIndex: number): void {
    usePotionModule(slotIndex, this.actionHost);
  }

  private enemyAttacksPlayer(enemy: EnemyInstance, behaviorDmgMult: number = 1): void {
    enemyAttacksPlayerModule(enemy, behaviorDmgMult, this.actionHost);
  }


  private killEnemy(enemy: EnemyInstance): void {
    const kh = this.killHost;
    killEnemyModule(enemy, kh);
    // Sync mutable state back
    this.killStreak = kh.killStreak;
    this.killStreakTimer = kh.killStreakTimer;
    this.activeBoss = kh.activeBoss;
    this.bossHPBar = kh.bossHPBar as any;
  }

  private get killHost(): KillHost {
    return {
      worldContainer: this.worldContainer,
      uiContainer: this.uiContainer,
      screenWidth: this.app.screen.width,
      screenHeight: this.app.screen.height,
      worldID: this.zone.worldID,
      playerScreenPos: this.playerScreenPos,
      particles: this.particles,
      particlePool: this.particlePool,
      killStreak: this.killStreak,
      killStreakTimer: this.killStreakTimer,
      activeBoss: this.activeBoss,
      bossHPBar: this.bossHPBar,
      worldMechanics: this.worldMechanics,
      activeEventEffect: this.activeEventEffect,
      repBadge: this.repBadge,
      potionHotbar: this.potionHotbar,
      actionButtons: this.actionButtons,
      showFloatingText: (x, y, msg, c) => this.showFloatingText(x, y, msg, c),
      showDamageNumber: (x, y, amt, crit, col, style, combo) => this.showDamageNumber(x, y, amt, crit, col, style as any, combo),
      showLevelUp: () => this.showLevelUp(),
      shakeCamera: (i, d) => this.shakeCamera(i, d),
      drawEnemyHP: (hpBar, pct) => this.drawEnemyHP(hpBar, pct),
      checkQuestCompletion: () => this.checkQuestCompletion(),
    };
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
    const result = handlePlayerDeathModule(
      this.uiContainer, this.app.screen.width, this.app.screen.height,
      this.deathScreen, this.isPaused, () => this.respawnPlayer(),
    );
    this.deathScreen = result.deathScreen;
    this.isPaused = result.isPaused;
  }

  private respawnPlayer(): void {
    const result = respawnPlayerModule(
      this.deathScreen, this.zone, this.worldContainer, this.uiContainer,
      this.playerScreenPos, this.playerContainer,
      this.app.screen.width, this.app.screen.height,
    );
    this.deathScreen = result.deathScreen;
    this.playerGridPos = result.playerGridPos;
    this.isPaused = result.isPaused;
  }

  private refreshMinimap(): void {
    refreshMinimapModule(this.minimap, this.playerScreenPos, this.enemies, this.npcs, this.lootPoints, this.zone.connections);
  }

  private checkQuestCompletion(): void {
    checkQuestCompletionModule(this.playerScreenPos, this.worldContainer, this.questTracker);
  }

  private showFloatingText(x: number, y: number, msg: string, color: number): void {
    showFloatingTextModule(this.worldContainer, x, y, msg, color);
  }

  private showLevelUp(): void {
    showLevelUpModule(this.worldContainer, this.uiContainer, this.playerScreenPos, this.app.screen.width, this.app.screen.height);
  }

  private shakeCamera(intensity: number, duration: number): void {
    shakeCameraModule(this.worldContainer, intensity, duration);
  }

  // ─── Camera ──────────────────────────────────────────────────

  private updateCamera(): void {
    updateCameraModule(this.worldContainer, this.playerScreenPos, this.app.screen.width, this.app.screen.height);
  }

  // ─── Zone Transitions ────────────────────────────────────────

  private checkZoneExit(): void {
    const host: TransitionHost = {
      isTransitioning: this.isTransitioning,
      zone: this.zone,
      playerScreenPos: this.playerScreenPos,
      npcs: this.npcs,
      uiContainer: this.uiContainer,
      screenWidth: this.app.screen.width,
      screenHeight: this.app.screen.height,
      checkQuestCompletion: () => this.checkQuestCompletion(),
      gotoZoneScene: () => this.router.goto(ZoneScene),
    };
    checkZoneExitModule(host);
    this.isTransitioning = host.isTransitioning;
  }

  // ─── Z-Sorting ───────────────────────────────────────────────

  private sortZOrder(): void {
    sortZOrderModule(this.worldContainer, this.playerContainer, this.particleContainer);
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
