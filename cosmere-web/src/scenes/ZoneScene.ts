import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { GameScene } from '../game/SceneRouter';
import { SceneRouter } from '../game/SceneRouter';
import { GameManager } from '../game/GameManager';
import { gameData } from '../data/DataLoader';
import { VirtualJoystick } from '../ui/VirtualJoystick';
import { ActionButtons } from '../ui/ActionButtons';
import { HUD } from '../ui/HUD';
import type { Zone, Enemy, EnemySpawn, GridPosition } from '../data/types';

// Isometric conversion
function isoToScreen(col: number, row: number, tileW = 64, tileH = 32): { x: number; y: number } {
  return {
    x: (col - row) * (tileW / 2),
    y: (col + row) * (tileH / 2),
  };
}

function screenToIso(sx: number, sy: number, tileW = 64, tileH = 32): { col: number; row: number } {
  return {
    col: Math.round(sx / tileW + sy / tileH),
    row: Math.round(sy / tileH - sx / tileW),
  };
}

interface EnemyInstance {
  data: Enemy;
  spawn: EnemySpawn;
  hp: number;
  position: { x: number; y: number };
  gridPos: GridPosition;
  sprite: Graphics;
  hpBar: Graphics;
  isDead: boolean;
  attackCooldown: number;
  state: 'idle' | 'chasing' | 'attacking' | 'dead';
  respawnTimer: number;
}

export class ZoneScene extends Container implements GameScene {
  private app: Application;
  private router: SceneRouter;

  // World
  private worldContainer = new Container();
  private zone!: Zone;

  // Player
  private playerSprite!: Graphics;
  private playerGridPos: GridPosition = { col: 5, row: 5 };
  private playerScreenPos = { x: 0, y: 0 };
  private playerSpeed = 120; // px/s

  // Enemies
  private enemies: EnemyInstance[] = [];

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
      // Fallback: find first zone in starting world
      const fallback = Array.from(gameData.zones.values()).find(z => z.worldID === champ.currentWorldID);
      if (!fallback) return;
      this.zone = fallback;
    } else {
      this.zone = zoneData;
    }

    this.playerGridPos = champ.gridPosition;
    const screenPos = isoToScreen(this.playerGridPos.col, this.playerGridPos.row);
    this.playerScreenPos = screenPos;

    // World container (holds tiles, entities)
    this.addChild(this.worldContainer);

    // Tilemap
    this.renderTilemap();

    // Player sprite
    this.playerSprite = new Graphics();
    this.drawPlayer();
    this.worldContainer.addChild(this.playerSprite);

    // Enemies
    this.spawnEnemies();

    // Zone exits (visual markers)
    this.renderExits();

    // UI layer (stays fixed on screen)
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

    // Center camera
    this.updateCamera();
  }

  // MARK: - Tilemap

  private renderTilemap(): void {
    const gw = this.zone.gridWidth;
    const gh = this.zone.gridHeight;

    // World color based on zone
    const worldColors: Record<string, number> = {
      scadrial: 0x2a2220, roshar: 0x222a33, taldain: 0x33301a,
      komashi: 0x2a1a2a, nalthis: 0x1a2a22, sel: 0x2a2a1a, shadesmar: 0x111122,
    };
    const baseColor = worldColors[this.zone.worldID] ?? 0x222222;

    for (let col = 0; col < gw; col++) {
      for (let row = 0; row < gh; row++) {
        const { x, y } = isoToScreen(col, row);
        const tile = new Graphics();

        // Vary color slightly for texture
        const variation = ((col * 7 + row * 13) % 5) * 0x040404;
        const color = baseColor + variation;

        // Diamond shape
        tile.poly([
          { x: 0, y: -16 },
          { x: 32, y: 0 },
          { x: 0, y: 16 },
          { x: -32, y: 0 },
        ]).fill({ color, alpha: 0.9 }).stroke({ color: color + 0x111111, width: 0.5 });

        tile.x = x;
        tile.y = y;
        this.worldContainer.addChild(tile);
      }
    }
  }

  // MARK: - Player

  private drawPlayer(): void {
    this.playerSprite.clear();
    // Body
    this.playerSprite.ellipse(0, -8, 10, 6).fill(0x4488ff);
    // Head
    this.playerSprite.circle(0, -22, 7).fill(0xffcc88);
    // Direction indicator
    this.playerSprite.circle(0, -30, 3).fill(0xe6cc66);

    this.playerSprite.x = this.playerScreenPos.x;
    this.playerSprite.y = this.playerScreenPos.y;
    this.playerSprite.zIndex = 1000;
  }

  // MARK: - Enemies

  private spawnEnemies(): void {
    for (const spawn of this.zone.enemySpawns) {
      const data = gameData.enemy(spawn.enemyID);
      if (!data) continue;

      const pos = isoToScreen(spawn.position.col, spawn.position.row);
      const sprite = new Graphics();

      // Enemy appearance by tier
      const colors: Record<string, number> = { minion: 0x885555, soldier: 0xaa4444, elite: 0xcc33cc, boss: 0xff6600 };
      const size = data.tier === 'boss' ? 14 : data.tier === 'elite' ? 11 : 8;

      sprite.ellipse(0, -4, size, size * 0.6).fill(colors[data.tier] ?? 0xaa4444);
      sprite.circle(0, -size - 8, size * 0.5).fill(0xcc8866);
      sprite.x = pos.x;
      sprite.y = pos.y;

      // HP bar
      const hpBar = new Graphics();
      hpBar.x = pos.x;
      hpBar.y = pos.y - size - 18;
      this.drawEnemyHP(hpBar, 1);

      this.worldContainer.addChild(sprite);
      this.worldContainer.addChild(hpBar);

      this.enemies.push({
        data, spawn,
        hp: data.maxHP,
        position: pos,
        gridPos: { ...spawn.position },
        sprite, hpBar,
        isDead: false,
        attackCooldown: 0,
        state: 'idle',
        respawnTimer: 0,
      });
    }
  }

  private drawEnemyHP(bar: Graphics, pct: number): void {
    bar.clear();
    const w = 30;
    bar.rect(-w / 2, 0, w, 4).fill({ color: 0x333333, alpha: 0.8 });
    if (pct > 0) {
      const color = pct > 0.6 ? 0x44cc44 : pct > 0.3 ? 0xcccc44 : 0xcc4444;
      bar.rect(-w / 2, 0, w * pct, 4).fill(color);
    }
  }

  // MARK: - Exits

  private renderExits(): void {
    for (const conn of this.zone.connections) {
      const pos = isoToScreen(conn.exitPosition.col, conn.exitPosition.row);
      const exit = new Graphics();
      exit.poly([
        { x: 0, y: -20 },
        { x: 12, y: 0 },
        { x: 0, y: 8 },
        { x: -12, y: 0 },
      ]).fill({ color: 0x66ccff, alpha: 0.4 }).stroke({ color: 0x66ccff, width: 1.5 });
      exit.x = pos.x;
      exit.y = pos.y;
      this.worldContainer.addChild(exit);

      const label = new Text({
        text: `→ ${conn.targetZoneID}`,
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 8, fill: 0x66ccff }),
      });
      label.anchor.set(0.5, 0);
      label.x = pos.x;
      label.y = pos.y + 12;
      this.worldContainer.addChild(label);
    }
  }

  // MARK: - Update Loop

  update(dt: number): void {
    const delta = dt / 60; // Convert tick to seconds
    this.handleMovement(delta);
    this.updateEnemyAI(delta);
    this.updateCombat(delta);
    this.updateCamera();
    this.hud.refresh(this.zone.name);
    this.actionButtons.update(dt);
    this.checkZoneExit();
    this.sortZOrder();
  }

  // MARK: - Movement

  private handleMovement(dt: number): void {
    if (!this.joystick.active || this.joystick.magnitude === 0) return;

    const dx = this.joystick.direction.x * this.playerSpeed * dt * this.joystick.magnitude;
    const dy = this.joystick.direction.y * this.playerSpeed * dt * this.joystick.magnitude;

    this.playerScreenPos.x += dx;
    this.playerScreenPos.y += dy;

    // Update grid position
    const iso = screenToIso(this.playerScreenPos.x, this.playerScreenPos.y);
    this.playerGridPos = { col: Math.max(0, Math.min(this.zone.gridWidth - 1, iso.col)), row: Math.max(0, Math.min(this.zone.gridHeight - 1, iso.row)) };

    // Clamp to grid bounds
    const minPos = isoToScreen(0, this.zone.gridHeight - 1);
    const maxPos = isoToScreen(this.zone.gridWidth - 1, 0);
    this.playerScreenPos.x = Math.max(minPos.x, Math.min(maxPos.x, this.playerScreenPos.x));
    this.playerScreenPos.y = Math.max(minPos.y - 100, Math.min(maxPos.y + 100, this.playerScreenPos.y));

    this.playerSprite.x = this.playerScreenPos.x;
    this.playerSprite.y = this.playerScreenPos.y;
  }

  // MARK: - Enemy AI

  private updateEnemyAI(dt: number): void {
    const playerPos = this.playerScreenPos;

    for (const enemy of this.enemies) {
      if (enemy.isDead) {
        enemy.respawnTimer -= dt;
        if (enemy.respawnTimer <= 0 && enemy.spawn.respawnTime) {
          // Respawn
          enemy.hp = enemy.data.maxHP;
          enemy.isDead = false;
          enemy.state = 'idle';
          enemy.sprite.visible = true;
          enemy.hpBar.visible = true;
          const pos = isoToScreen(enemy.spawn.position.col, enemy.spawn.position.row);
          enemy.position = pos;
          enemy.sprite.x = pos.x;
          enemy.sprite.y = pos.y;
        }
        continue;
      }

      const dist = Math.hypot(enemy.position.x - playerPos.x, enemy.position.y - playerPos.y);
      const detRange = enemy.data.detectionRange * 32;
      const atkRange = enemy.data.attackRange * 32;

      enemy.attackCooldown = Math.max(0, enemy.attackCooldown - dt);

      if (dist < atkRange && enemy.attackCooldown <= 0) {
        // Attack player
        enemy.state = 'attacking';
        enemy.attackCooldown = 1.5;
        this.enemyAttacksPlayer(enemy);
      } else if (dist < detRange) {
        // Chase
        enemy.state = 'chasing';
        const angle = Math.atan2(playerPos.y - enemy.position.y, playerPos.x - enemy.position.x);
        const speed = enemy.data.speed * 30 * dt;
        enemy.position.x += Math.cos(angle) * speed;
        enemy.position.y += Math.sin(angle) * speed;
        enemy.sprite.x = enemy.position.x;
        enemy.sprite.y = enemy.position.y;
        enemy.hpBar.x = enemy.position.x;
        enemy.hpBar.y = enemy.position.y - 22;
      } else {
        enemy.state = 'idle';
      }
    }
  }

  // MARK: - Combat

  private handleAttack(): void {
    if (this.attackCooldown > 0) return;
    this.attackCooldown = this.ATTACK_COOLDOWN;

    const champ = GameManager.shared.champion;
    if (!champ) return;

    // Find closest alive enemy in range
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
    this.showDamageNumber(closest.position.x, closest.position.y - 20, totalDmg, isCrit);
    this.drawEnemyHP(closest.hpBar, closest.hp / closest.data.maxHP);

    // Flash
    closest.sprite.tint = 0xff0000;
    setTimeout(() => { if (!closest!.isDead) closest!.sprite.tint = 0xffffff; }, 100);

    if (closest.hp <= 0) {
      this.killEnemy(closest);
    }
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

    // AoE damage to nearby enemies
    const range = skill.range * 32;
    for (const enemy of this.enemies) {
      if (enemy.isDead) continue;
      const dist = Math.hypot(enemy.position.x - this.playerScreenPos.x, enemy.position.y - this.playerScreenPos.y);
      if (dist < range) {
        const damage = skill.baseDamage + Math.floor(champ.baseStats.spirit * 0.5);
        enemy.hp -= damage;
        this.showDamageNumber(enemy.position.x, enemy.position.y - 20, damage, false);
        this.drawEnemyHP(enemy.hpBar, enemy.hp / enemy.data.maxHP);
        if (enemy.hp <= 0) this.killEnemy(enemy);
      }
    }
  }

  private enemyAttacksPlayer(enemy: EnemyInstance): void {
    const champ = GameManager.shared.champion;
    if (!champ) return;

    const defense = champ.baseStats.vigor / 2;
    const damage = Math.max(1, enemy.data.damage - defense);
    champ.currentHP -= damage;

    this.showDamageNumber(this.playerScreenPos.x, this.playerScreenPos.y - 30, damage, false, 0xff4444);

    if (champ.currentHP <= 0) {
      champ.currentHP = 0;
      // Simple death: respawn at full HP
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
    enemy.hpBar.visible = false;
    enemy.respawnTimer = enemy.spawn.respawnTime ?? 999;

    // Rewards
    const gm = GameManager.shared;
    const champ = gm.champion;
    if (!champ) return;

    const gold = enemy.data.goldMin + Math.floor(Math.random() * (enemy.data.goldMax - enemy.data.goldMin + 1));
    champ.gold += gold;
    const leveledUp = gm.grantXP(enemy.data.xpReward);

    this.showDamageNumber(enemy.position.x, enemy.position.y, enemy.data.xpReward, false, 0x66cc44);
    setTimeout(() => {
      this.showDamageNumber(enemy.position.x, enemy.position.y + 15, gold, false, 0xe6cc33);
    }, 200);

    if (leveledUp) {
      this.showLevelUp();
    }
  }

  private updateCombat(dt: number): void {
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
  }

  // MARK: - Visual Effects

  private showDamageNumber(x: number, y: number, amount: number, isCrit: boolean, color = 0xffffff): void {
    const style = new TextStyle({
      fontFamily: 'sans-serif',
      fontSize: isCrit ? 18 : 13,
      fill: isCrit ? 0xffee44 : color,
      fontWeight: 'bold',
    });
    const txt = new Text({ text: isCrit ? `${amount}!` : `${amount}`, style });
    txt.anchor.set(0.5);
    txt.x = x + (Math.random() - 0.5) * 20;
    txt.y = y;
    this.worldContainer.addChild(txt);

    const startY = txt.y;
    let elapsed = 0;
    const anim = () => {
      elapsed += 1 / 60;
      txt.y = startY - elapsed * 40;
      txt.alpha = Math.max(0, 1 - elapsed / 0.8);
      if (elapsed < 0.8) {
        requestAnimationFrame(anim);
      } else {
        txt.destroy();
      }
    };
    requestAnimationFrame(anim);
  }

  private showLevelUp(): void {
    const w = this.app.screen.width;
    const style = new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 20, fill: 0xe6cc66, fontWeight: 'bold' });
    const txt = new Text({ text: 'NIVEAU SUPÉRIEUR!', style });
    txt.anchor.set(0.5);
    txt.x = w / 2;
    txt.y = this.app.screen.height / 2 - 50;
    this.uiContainer.addChild(txt);

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

  // MARK: - Camera

  private updateCamera(): void {
    const w = this.app.screen.width;
    const h = this.app.screen.height;

    // Smooth follow
    const targetX = w / 2 - this.playerScreenPos.x;
    const targetY = h / 2 - this.playerScreenPos.y;

    this.worldContainer.x += (targetX - this.worldContainer.x) * 0.1;
    this.worldContainer.y += (targetY - this.worldContainer.y) * 0.1;
  }

  // MARK: - Zone Transitions

  private checkZoneExit(): void {
    for (const conn of this.zone.connections) {
      const exitPos = isoToScreen(conn.exitPosition.col, conn.exitPosition.row);
      const dist = Math.hypot(exitPos.x - this.playerScreenPos.x, exitPos.y - this.playerScreenPos.y);

      if (dist < 30) {
        const targetZone = gameData.zone(conn.targetZoneID);
        if (!targetZone) continue;

        // Check quest requirement
        if (conn.requiredQuestID) {
          const champ = GameManager.shared.champion;
          if (!champ?.completedQuestIDs.includes(conn.requiredQuestID)) continue;
        }

        // Transition
        const champ = GameManager.shared.champion;
        if (champ) {
          champ.currentZoneID = conn.targetZoneID;
          champ.gridPosition = targetZone.playerSpawnPosition;
          GameManager.shared.save();
          this.router.goto(ZoneScene);
        }
        return;
      }
    }
  }

  // MARK: - Z-Sorting

  private sortZOrder(): void {
    this.worldContainer.sortableChildren = true;
    for (const child of this.worldContainer.children) {
      child.zIndex = child.y;
    }
  }
}
