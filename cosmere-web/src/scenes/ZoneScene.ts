// ─── Zone Scene — Orchestrator ───────────────────────────────────
// This is the main gameplay scene. Logic is delegated to sub-modules:
//   IsoUtils, WorldThemes, ZoneTypes, ParticleSystem, VisualEffects,
//   DecorationRenderer, EntitySpawner, CombatManager

import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { GameScene } from '../game/SceneRouter';
import { SceneRouter } from '../game/SceneRouter';
import { GameManager } from '../game/GameManager';
import { gameData } from '../data/DataLoader';
import { VirtualJoystick } from '../ui/VirtualJoystick';
import { ActionButtons } from '../ui/ActionButtons';
import { HUD } from '../ui/HUD';
import { InventoryPanel } from '../ui/InventoryPanel';
import { showDialoguePanel } from '../ui/DialoguePanel';
import { showShopPanel } from '../ui/ShopPanel';
import { showPauseMenu } from '../ui/PauseMenu';
import { QuestTracker } from '../ui/QuestTracker';
import { Minimap } from '../ui/Minimap';
import { showDeathScreen } from '../ui/DeathScreen';
import { QuestManager } from '../game/QuestManager';
import { createWorldMechanics } from '../game/WorldMechanics';
import type { WorldEffect } from '../game/WorldMechanics';
import { drawPlayerCharacter } from '../rendering/PlayerRenderer';
import { spawnWalls, spawnEnterableBuildings, spawnSecretAreas, revealSecret } from '../rendering/MapStructures';
import type { WallSegment, EnterableBuilding, SecretArea } from '../rendering/MapStructures';
import type { Zone, ZoneConnection } from '../data/types';
import type { ActionMode } from '../ui/ActionButtons';

// Extracted modules
import { isoToScreen, screenToIso } from './IsoUtils';
import { WORLD_THEMES } from './WorldThemes';
import type { WorldTheme } from './WorldThemes';
import type { EnemyInstance, NPCInstance, LootInstance } from './ZoneTypes';
import { ParticleSystem } from './ParticleSystem';
import { VisualEffects } from './VisualEffects';
import { renderTilemap, renderMapEdge, spawnDecorations } from './DecorationRenderer';
import { spawnEnemies, spawnNPCs, spawnLootPoints, renderExits, formatNPCName } from './EntitySpawner';
import { CombatManager } from './CombatManager';

// ─── Constants ───────────────────────────────────────────────
const PLAYER_SPEED = 120;

// ─── Zone Scene ──────────────────────────────────────────────
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
  private playerGridPos = { col: 5, row: 5 };
  private playerScreenPos = { x: 0, y: 0 };
  private playerAnimTimer = 0;
  private playerFacing: 'left' | 'right' = 'right';

  // Entities
  private enemies: EnemyInstance[] = [];
  private npcs: NPCInstance[] = [];
  private lootPoints: LootInstance[] = [];

  // Sub-systems
  private particleSystem!: ParticleSystem;
  private vfx!: VisualEffects;
  private combat!: CombatManager;

  // UI
  private joystick!: VirtualJoystick;
  private actionButtons!: ActionButtons;
  private hud!: HUD;
  private uiContainer = new Container();
  private questTracker!: QuestTracker;
  private minimap!: Minimap;
  private fogOverlay!: Graphics;

  // State
  private isTransitioning = false;
  private isPaused = false;
  private dialoguePanel: Container | null = null;
  private pauseMenu: Container | null = null;
  private deathScreen: Container | null = null;

  // Interaction
  private interactPrompt: Text | null = null;
  private nearbyNPC: NPCInstance | null = null;
  private nearbyExit: ZoneConnection | null = null;
  private nearbyLoot: LootInstance | null = null;
  private nearbyBuilding: EnterableBuilding | null = null;
  private nearbySecret: SecretArea | null = null;

  // Map structures
  private walls: WallSegment[] = [];
  private enterableBuildings: EnterableBuilding[] = [];
  private secretAreas: SecretArea[] = [];

  // World mechanics
  private worldMechanics!: WorldEffect;

  constructor(app: Application, router: SceneRouter) {
    super();
    this.app = app;
    this.router = router;
  }

  // ─── Scene Lifecycle ─────────────────────────────────────────

  onEnter(): void {
    const w = this.app.screen.width;
    const h = this.app.screen.height;
    const champ = GameManager.shared.champion;
    if (!champ) return;

    this.loadZone(champ);
    this.setupWorld();
    this.setupEntities();
    this.setupUI(w, h);
    this.setupSystems(w, h);

    // Center camera
    this.worldContainer.x = w / 2 - this.playerScreenPos.x;
    this.worldContainer.y = h / 2 - this.playerScreenPos.y;
  }

  private loadZone(champ: NonNullable<typeof GameManager.shared.champion>): void {
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
  }

  private setupWorld(): void {
    this.worldContainer.sortableChildren = true;
    this.addChild(this.worldContainer);

    renderTilemap(this.worldContainer, this.zone, this.theme);
    renderMapEdge(this.worldContainer, this.zone, this.theme);
    spawnDecorations(this.worldContainer, this.zone, this.theme);

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
  }

  private setupEntities(): void {
    this.lootPoints = spawnLootPoints(this.zone, this.worldContainer, (id) => this.collectLoot(id));
    this.npcs = spawnNPCs(this.zone, this.worldContainer);
    this.createPlayer();
    this.enemies = spawnEnemies(this.zone, this.worldContainer);
    renderExits(this.zone, this.worldContainer);

    for (const npc of this.npcs) {
      const spawn = this.zone.npcSpawns.find(s => s.npcID === npc.id);
      if (spawn) {
        npc.sprite.eventMode = 'static';
        npc.sprite.cursor = 'pointer';
        npc.sprite.on('pointerdown', () => this.interactWithNPC(spawn));
      }
    }
  }

  private setupUI(w: number, h: number): void {
    this.addChild(this.uiContainer);

    this.hud = new HUD(w, h);
    this.hud.refresh(this.zone.name);
    this.uiContainer.addChild(this.hud);

    this.joystick = new VirtualJoystick();
    this.joystick.x = 70;
    this.joystick.y = h - 90;
    this.uiContainer.addChild(this.joystick);

    this.actionButtons = new ActionButtons();
    this.actionButtons.x = w - 80;
    this.actionButtons.y = h - 100;
    this.actionButtons.onAttack = () => this.combat.handleAttack(
      this.playerScreenPos, this.playerFacing, this.enemies,
      (e) => this.onEnemyKilled(e),
    );
    this.actionButtons.onSkill = (i) => this.combat.handleSkill(
      i, this.playerScreenPos, this.enemies, this.actionButtons,
      (e) => this.onEnemyKilled(e),
    );
    this.actionButtons.onInteract = (mode) => this.handleInteraction(mode);
    this.uiContainer.addChild(this.actionButtons);

    const champ = GameManager.shared.champion;
    GameManager.shared.autoEquipSkills(gameData.skills);
    if (champ && champ.equippedSkillIDs.length > 0) {
      for (let i = 0; i < champ.equippedSkillIDs.length && i < 4; i++) {
        const skill = gameData.skill(champ.equippedSkillIDs[i]);
        if (skill) {
          const shortName = skill.name.length > 5 ? skill.name.substring(0, 5) : skill.name;
          this.actionButtons.setSkill(i, skill.id, shortName);
        }
      }
    }

    this.createPauseButton(w);
    this.createInventoryButton(w);

    this.questTracker = new QuestTracker(w);
    this.questTracker.refresh();
    this.uiContainer.addChild(this.questTracker);

    this.minimap = new Minimap(w, h);
    this.minimap.setZone(this.zone.gridWidth, this.zone.gridHeight);
    this.uiContainer.addChild(this.minimap);

    this.fogOverlay = new Graphics();
    this.updateFog();
  }

  private setupSystems(_w: number, _h: number): void {
    this.particleSystem = new ParticleSystem(this.worldContainer);
    this.vfx = new VisualEffects(this.worldContainer, this.uiContainer);
    this.combat = new CombatManager(this.worldContainer, this.uiContainer, this.vfx, this.particleSystem);

    this.worldMechanics = createWorldMechanics(this.zone.worldID);
    QuestManager.shared.init();
    QuestManager.shared.onZoneEntered(this.zone.id);
  }

  // ─── Player ──────────────────────────────────────────────────

  private createPlayer(): void {
    this.playerContainer = new Container();
    this.playerContainer.zIndex = 10000;

    this.playerShadow = new Graphics();
    this.playerShadow.ellipse(0, 2, 12, 5).fill({ color: 0x000000, alpha: 0.3 });
    this.playerContainer.addChild(this.playerShadow);

    this.playerSprite = new Graphics();
    const champ = GameManager.shared.champion;
    drawPlayerCharacter(this.playerSprite, champ?.championClass ?? 'mistborn');
    this.playerContainer.addChild(this.playerSprite);

    this.playerContainer.x = this.playerScreenPos.x;
    this.playerContainer.y = this.playerScreenPos.y;
    this.worldContainer.addChild(this.playerContainer);
  }

  // ─── Update Loop ─────────────────────────────────────────────

  update(dt: number): void {
    if (this.isPaused || this.isTransitioning) return;
    const delta = dt / 60;

    this.handleMovement(delta);
    this.combat.updateEnemyAI(
      delta, this.playerScreenPos, this.enemies, this.worldMechanics,
      this.app.screen.width,
      () => this.handlePlayerDeath(),
      (i, d) => this.shakeCamera(i, d),
    );
    this.combat.update(delta);
    this.updateCamera();
    this.updateAnimations(delta);
    this.particleSystem.spawnAmbient(
      delta, this.app.screen.width, this.app.screen.height,
      this.worldContainer.x, this.worldContainer.y,
      this.zone.weatherEffect ?? undefined, this.theme,
    );
    this.particleSystem.update(delta);
    this.vfx.update(delta);
    this.updateWorldMechanics(delta);
    this.hud.refresh(this.zone.name);
    this.questTracker.refresh();
    this.refreshMinimap();
    this.actionButtons.update(delta);
    this.checkZoneExit();
    this.checkProximity();
    this.sortZOrder();
  }

  // ─── Movement ────────────────────────────────────────────────

  private handleMovement(dt: number): void {
    if (!this.joystick.active || this.joystick.magnitude === 0) return;

    const dx = this.joystick.direction.x * PLAYER_SPEED * dt * this.joystick.magnitude;
    const dy = this.joystick.direction.y * PLAYER_SPEED * dt * this.joystick.magnitude;

    if (dx > 0.5) this.playerFacing = 'right';
    else if (dx < -0.5) this.playerFacing = 'left';

    const newX = this.playerScreenPos.x + dx;
    const newY = this.playerScreenPos.y + dy;
    const iso = screenToIso(newX, newY);
    const clampedCol = Math.max(0.5, Math.min(this.zone.gridWidth - 1.5, iso.col));
    const clampedRow = Math.max(0.5, Math.min(this.zone.gridHeight - 1.5, iso.row));
    const clamped = isoToScreen(clampedCol, clampedRow);

    this.playerScreenPos.x = clamped.x;
    this.playerScreenPos.y = clamped.y;
    this.playerGridPos = { col: Math.round(clampedCol), row: Math.round(clampedRow) };
    this.playerContainer.x = this.playerScreenPos.x;
    this.playerContainer.y = this.playerScreenPos.y;
  }

  // ─── Animations ──────────────────────────────────────────────

  private updateAnimations(dt: number): void {
    this.playerAnimTimer += dt * 4;
    if (this.joystick.active && this.joystick.magnitude > 0) {
      this.playerSprite.y = Math.sin(this.playerAnimTimer) * 1.5;
    } else {
      this.playerSprite.y = Math.sin(this.playerAnimTimer * 0.5) * 0.5;
    }
    this.playerSprite.scale.x = this.playerFacing === 'left' ? -1 : 1;

    for (const enemy of this.enemies) {
      if (enemy.isDead) continue;
      enemy.animTimer += dt * 2;
      const innerSprite = enemy.sprite.children[1];
      if (innerSprite) innerSprite.y = Math.sin(enemy.animTimer) * 1;
    }

    const t = performance.now() / 1000;
    for (const npc of this.npcs) {
      const questBang = npc.sprite.children.find(c => c instanceof Text && (c as Text).text === '!');
      if (questBang) questBang.scale.set(1 + Math.sin(t * 3) * 0.15);
    }

    for (const loot of this.lootPoints) {
      if (loot.collected || loot.isHidden) continue;
      loot.sprite.alpha = 0.85 + Math.sin(t * 2) * 0.15;
    }
  }

  // ─── Interactions ────────────────────────────────────────────

  private handleInteraction(mode: ActionMode): void {
    switch (mode) {
      case 'talk':
        if (this.nearbyNPC) {
          const spawn = this.zone.npcSpawns.find(s => s.npcID === this.nearbyNPC!.id);
          if (spawn) this.interactWithNPC(spawn);
        }
        break;
      case 'enter':
        if (this.nearbyBuilding) this.enterBuilding(this.nearbyBuilding);
        break;
      case 'loot':
        if (this.nearbySecret) this.interactWithSecret(this.nearbySecret);
        else if (this.nearbyLoot) this.collectLoot(this.nearbyLoot.id);
        break;
    }
  }

  private interactWithNPC(spawn: { npcID: string; isShopkeeper: boolean; dialogueTreeID: string | null }): void {
    if (spawn.isShopkeeper) this.showShop(spawn.npcID);
    else this.showDialogue(spawn.npcID, spawn.dialogueTreeID);
  }

  private showDialogue(npcID: string, _dialogueTreeID: string | null): void {
    if (this.dialoguePanel) return;
    this.isPaused = true;
    QuestManager.shared.onNPCTalkedTo(npcID);
    this.checkQuestCompletion();
    const npcName = formatNPCName(npcID);
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

  private showShop(_npcID: string): void {
    if (this.dialoguePanel) return;
    this.isPaused = true;
    this.dialoguePanel = showShopPanel(
      this.uiContainer, this.app.screen.width, this.app.screen.height,
      () => this.closeDialogue(),
      (x, y, msg, color) => this.vfx.showFloatingText(x, y, msg, color),
      this.playerScreenPos,
    );
  }

  private enterBuilding(building: EnterableBuilding): void {
    if (this.dialoguePanel) return;
    this.isPaused = true;

    const champ = GameManager.shared.champion;
    const goldReward = 5 + Math.floor(Math.random() * 15);
    const xpReward = 10 + Math.floor(Math.random() * 20);

    if (champ) {
      champ.gold += goldReward;
      GameManager.shared.grantXP(xpReward);
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
    title.x = 36; title.y = panelY + 10;
    panel.addChild(title);

    const desc = new Text({
      text: `Vous explorez ${building.name}.\nVous trouvez quelques ressources utiles.`,
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 10, fill: 0xccccbb, wordWrap: true, wordWrapWidth: w - 80 }),
    });
    desc.x = 36; desc.y = panelY + 30;
    panel.addChild(desc);

    const reward = new Text({
      text: `+${xpReward} XP  +${goldReward} or`,
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 10, fill: 0x66cc44, fontWeight: 'bold' }),
    });
    reward.anchor.set(1, 0);
    reward.x = w - 36; reward.y = panelY + 10;
    panel.addChild(reward);

    const closeHint = new Text({
      text: 'Toucher pour fermer',
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 9, fill: 0x888888 }),
    });
    closeHint.anchor.set(0.5);
    closeHint.x = w / 2; closeHint.y = panelY + panelH - 14;
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

    champ.gold += secret.loot.gold;
    GameManager.shared.grantXP(secret.loot.xp);

    if (secret.type === 'shrine') {
      champ.currentHP = GameManager.shared.maxHP;
      champ.currentInvestiture = GameManager.shared.maxInvestiture;
      this.vfx.showFloatingText(secret.x, secret.y - 30, 'Bénédiction! PV et Inv restaurés', 0x88ccff);
    } else {
      this.vfx.showFloatingText(secret.x, secret.y - 30,
        `${secret.loot.itemHint}! +${secret.loot.xp}XP +${secret.loot.gold}or`, 0xffdd44);
    }

    secret.sprite.alpha = 0.3;
    this.secretAreas = this.secretAreas.filter(s => s !== secret);
  }

  private collectLoot(lootId: string): void {
    const instance = this.lootPoints.find(l => l.id === lootId);
    if (!instance || instance.collected) return;

    const playerDist = Math.hypot(instance.position.x - this.playerScreenPos.x, instance.position.y - this.playerScreenPos.y);
    if (playerDist > 60) {
      this.vfx.showFloatingText(instance.position.x, instance.position.y - 20, 'Trop loin!', 0xff6644);
      return;
    }

    instance.collected = true;
    instance.sprite.visible = false;

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
    this.vfx.showFloatingText(instance.position.x, instance.position.y - 20,
      itemsFound > 0 ? `+${itemsFound} objet(s)!` : 'Vide...', 0xeedd88);
  }

  // ─── UI Buttons ──────────────────────────────────────────────

  private createPauseButton(screenWidth: number): void {
    const btn = new Container();
    const bg = new Graphics();
    bg.roundRect(0, 0, 36, 28, 6)
      .fill({ color: 0x1a1528, alpha: 0.7 })
      .stroke({ color: 0x443355, width: 1, alpha: 0.5 });
    btn.addChild(bg);
    const icon = new Graphics();
    icon.rect(10, 6, 4, 16).fill({ color: 0xcccccc, alpha: 0.8 });
    icon.rect(20, 6, 4, 16).fill({ color: 0xcccccc, alpha: 0.8 });
    btn.addChild(icon);
    btn.x = screenWidth / 2 - 18; btn.y = 10;
    btn.eventMode = 'static'; btn.cursor = 'pointer';
    btn.on('pointerdown', () => this.togglePause());
    this.uiContainer.addChild(btn);
  }

  private createInventoryButton(screenWidth: number): void {
    const btn = new Container();
    const bg = new Graphics();
    bg.roundRect(0, 0, 36, 28, 6)
      .fill({ color: 0x1a1528, alpha: 0.7 })
      .stroke({ color: 0x443355, width: 1, alpha: 0.5 });
    btn.addChild(bg);
    const icon = new Graphics();
    icon.roundRect(10, 8, 16, 14, 3).fill({ color: 0xaa8855, alpha: 0.7 });
    icon.roundRect(10, 8, 16, 14, 3).stroke({ color: 0xccaa66, width: 1, alpha: 0.5 });
    icon.arc(18, 8, 5, Math.PI, 0).stroke({ color: 0xccaa66, width: 1.5, alpha: 0.6 });
    btn.addChild(icon);
    btn.x = screenWidth / 2 + 24; btn.y = 10;
    btn.eventMode = 'static'; btn.cursor = 'pointer';
    btn.on('pointerdown', () => this.toggleInventory());
    this.uiContainer.addChild(btn);
  }

  private toggleInventory(): void {
    if (this.dialoguePanel) return;
    this.isPaused = true;
    this.dialoguePanel = new InventoryPanel(
      this.app.screen.width, this.app.screen.height, () => this.closeDialogue(),
    );
    this.uiContainer.addChild(this.dialoguePanel);
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
      (x, y, msg, color) => this.vfx.showFloatingText(x, y, msg, color),
      this.playerScreenPos,
    );
  }

  // ─── Proximity Detection ─────────────────────────────────────

  private checkProximity(): void {
    this.nearbyNPC = null;
    this.nearbyExit = null;
    this.nearbyLoot = null;
    this.nearbyBuilding = null;
    this.nearbySecret = null;

    let minNPCDist = Infinity;
    for (const npc of this.npcs) {
      const dist = Math.hypot(npc.position.x - this.playerScreenPos.x, npc.position.y - this.playerScreenPos.y);
      if (dist < 55 && dist < minNPCDist) { minNPCDist = dist; this.nearbyNPC = npc; }
    }

    let minExitDist = Infinity;
    for (const conn of this.zone.connections) {
      const exitPos = isoToScreen(conn.exitPosition.col, conn.exitPosition.row);
      const dist = Math.hypot(exitPos.x - this.playerScreenPos.x, exitPos.y - this.playerScreenPos.y);
      if (dist < 55 && dist < minExitDist) { minExitDist = dist; this.nearbyExit = conn; }
    }

    let minLootDist = Infinity;
    for (const loot of this.lootPoints) {
      if (loot.collected) continue;
      const dist = Math.hypot(loot.position.x - this.playerScreenPos.x, loot.position.y - this.playerScreenPos.y);
      if (dist < 55 && dist < minLootDist) { minLootDist = dist; this.nearbyLoot = loot; }
    }

    let minBuildingDist = Infinity;
    for (const b of this.enterableBuildings) {
      const dist = Math.hypot(b.x - this.playerScreenPos.x, b.y - this.playerScreenPos.y);
      if (dist < b.interactionRadius && dist < minBuildingDist) { minBuildingDist = dist; this.nearbyBuilding = b; }
    }

    for (const s of this.secretAreas) {
      if (s.revealed) continue;
      const dist = Math.hypot(s.x - this.playerScreenPos.x, s.y - this.playerScreenPos.y);
      if (dist < s.interactionRadius) {
        revealSecret(s, this.zone.worldID);
        this.vfx.showFloatingText(s.x, s.y - 20, '✦ Zone secrète découverte!', 0xffdd44);
        this.nearbySecret = s;
      }
    }
    for (const s of this.secretAreas) {
      if (!s.revealed) continue;
      const dist = Math.hypot(s.x - this.playerScreenPos.x, s.y - this.playerScreenPos.y);
      if (dist < 40) { this.nearbySecret = s; break; }
    }

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
    this.updateInteractPrompt(promptText);
  }

  private updateInteractPrompt(text: string): void {
    if (text) {
      if (!this.interactPrompt) {
        this.interactPrompt = new Text({
          text,
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
        this.interactPrompt.text = text;
      }
    } else if (this.interactPrompt) {
      this.interactPrompt.destroy();
      this.interactPrompt = null;
    }
  }

  // ─── Combat Callbacks ────────────────────────────────────────

  private onEnemyKilled(enemy: EnemyInstance): void {
    this.combat.killEnemy(
      enemy, this.worldMechanics, this.actionButtons,
      (i, d) => this.shakeCamera(i, d),
      () => this.checkQuestCompletion(),
    );
  }

  // ─── World Mechanics & Quests ────────────────────────────────

  private updateWorldMechanics(dt: number): void {
    const msg = this.worldMechanics.tick(dt);
    if (msg) this.vfx.showFloatingText(this.playerScreenPos.x, this.playerScreenPos.y - 50, msg, 0xaaddff);
  }

  private checkQuestCompletion(): void {
    const champ = GameManager.shared.champion;
    if (!champ) return;

    for (const qid of [...champ.activeQuestIDs]) {
      if (QuestManager.shared.checkQuestCompletion(qid)) {
        const result = QuestManager.shared.completeQuest(qid);
        if (result) {
          this.vfx.showFloatingText(
            this.playerScreenPos.x, this.playerScreenPos.y - 50,
            `Quête terminée! +${result.xp}XP +${result.gold}or`, 0xffcc44,
          );
          this.questTracker.refresh();
        }
      }
    }
  }

  // ─── Death / Respawn ─────────────────────────────────────────

  private handlePlayerDeath(): void {
    if (this.deathScreen) return;
    this.isPaused = true;
    this.deathScreen = showDeathScreen(
      this.uiContainer, this.app.screen.width, this.app.screen.height,
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

    champ.currentHP = GameManager.shared.maxHP;
    champ.currentInvestiture = GameManager.shared.maxInvestiture;

    const spawnPos = isoToScreen(this.zone.playerSpawnPosition.col, this.zone.playerSpawnPosition.row);
    this.playerScreenPos.x = spawnPos.x;
    this.playerScreenPos.y = spawnPos.y;
    this.playerGridPos = { ...this.zone.playerSpawnPosition };
    this.playerContainer.x = spawnPos.x;
    this.playerContainer.y = spawnPos.y;

    this.vfx.showFlash(this.uiContainer, this.app.screen.width, this.app.screen.height, 0xffffff, 0.3, 0.5);
    this.isPaused = false;
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

  private shakeCamera(intensity: number, duration: number): void {
    const originalX = this.worldContainer.x;
    const originalY = this.worldContainer.y;
    let elapsed = 0;
    let lastTime = performance.now();

    const shake = () => {
      const now = performance.now();
      const frameDt = (now - lastTime) / 1000;
      lastTime = now;
      elapsed += frameDt;
      const decay = 1 - elapsed / duration;
      this.worldContainer.x = originalX + (Math.random() - 0.5) * intensity * 2 * decay;
      this.worldContainer.y = originalY + (Math.random() - 0.5) * intensity * 2 * decay;
      if (elapsed < duration) requestAnimationFrame(shake);
    };
    requestAnimationFrame(shake);
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
          const flash = new Graphics();
          flash.rect(0, 0, this.app.screen.width, this.app.screen.height).fill({ color: 0x000000, alpha: 0 });
          flash.zIndex = 99999;
          this.uiContainer.addChild(flash);

          let elapsed = 0;
          let lastTime = performance.now();
          const fadeOut = () => {
            const now = performance.now();
            const frameDt = (now - lastTime) / 1000;
            lastTime = now;
            elapsed += frameDt;
            flash.clear();
            flash.rect(0, 0, this.app.screen.width, this.app.screen.height)
              .fill({ color: 0x000000, alpha: Math.min(1, elapsed / 0.4) });
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

  // ─── Fog ─────────────────────────────────────────────────────

  private updateFog(): void {
    this.fogOverlay.clear();
    const w = this.app.screen.width;
    const h = this.app.screen.height;
    this.fogOverlay.rect(0, 0, w, h * 0.15).fill({ color: this.theme.fogColor, alpha: this.theme.fogAlpha });
    this.fogOverlay.rect(0, h * 0.85, w, h * 0.15).fill({ color: this.theme.fogColor, alpha: this.theme.fogAlpha * 0.7 });
    this.fogOverlay.zIndex = 999;
    if (!this.fogOverlay.parent) this.uiContainer.addChild(this.fogOverlay);
  }

  // ─── Minimap ─────────────────────────────────────────────────

  private refreshMinimap(): void {
    const enemyDots = this.enemies.filter(e => !e.isDead).map(e => ({
      x: e.position.x, y: e.position.y,
      color: e.data.tier === 'boss' ? 0xff2222 : e.data.tier === 'elite' ? 0xff6644 : 0xcc4444,
      size: e.data.tier === 'boss' ? 3 : e.data.tier === 'elite' ? 2 : 1.5,
    }));
    const npcDots = this.npcs.map(n => ({ x: n.position.x, y: n.position.y, color: 0x44aaff }));
    const exitDots = this.zone.connections.map(c => {
      const pos = isoToScreen(c.exitPosition.col, c.exitPosition.row);
      return { x: pos.x, y: pos.y, color: 0xeedd44 };
    });
    const lootDots = this.lootPoints.filter(l => !l.collected)
      .map(l => ({ x: l.position.x, y: l.position.y, color: 0xee9944 }));
    this.minimap.refresh(this.playerScreenPos.x, this.playerScreenPos.y, enemyDots, npcDots, exitDots, lootDots);
  }

  // ─── Z-Sorting ───────────────────────────────────────────────

  private sortZOrder(): void {
    for (const child of this.worldContainer.children) {
      if (child.zIndex < -900) continue;
      if (child === this.particleSystem.particleContainer) continue;
      child.zIndex = child.y;
    }
    this.playerContainer.zIndex = this.playerContainer.y + 0.5;
  }
}
