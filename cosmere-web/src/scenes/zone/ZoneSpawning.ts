// ─── Zone Spawning — NPC, loot, enemy, exit creation ─────────────
// Extracted from ZoneScene for modularity.

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { GameManager } from '../../game/GameManager';
import { gameData } from '../../data/DataLoader';
import { NewGamePlusManager } from '../../systems/NewGamePlus';
import { BossState } from '../../game/BossMechanics';
import { drawEnemySprite } from '../../rendering/EnemyRenderer';
import { createEnemyAnimState } from '../../rendering/EnemyAnimations';
import { rollAffixes, createAffixState, getAffixHPMultiplier, getAffixLabel, getAffixColor } from '../../game/EliteAffixes';
import { createBehaviorState } from '../../systems/EnemyBehaviors';
import { QuestManager } from '../../game/QuestManager';
import { isoToScreen } from './ZoneTypes';
import type { EnemyInstance, NPCInstance, LootInstance } from './ZoneTypes';
import type { Zone, NPCSpawn, EnemySpawn, ZoneConnection } from '../../data/types';
import type { BehaviorState } from '../../systems/EnemyBehaviors';

// ─── Spawn NPCs ─────────────────────────────────────────────────

export function spawnNPCs(
  zone: Zone,
  worldContainer: Container,
  onInteract: (spawn: NPCSpawn) => void,
): NPCInstance[] {
  const npcs: NPCInstance[] = [];

  for (const spawn of zone.npcSpawns) {
    const pos = isoToScreen(spawn.position.col, spawn.position.row);
    const container = new Container();
    container.zIndex = pos.y;

    const shadow = new Graphics();
    shadow.ellipse(0, 2, 11, 5).fill({ color: 0x000000, alpha: 0.3 });
    container.addChild(shadow);

    const sprite = new Graphics();
    if (spawn.isShopkeeper) {
      // Shopkeeper — warm colors, apron, distinct look
      // Legs
      sprite.rect(-4, -3, 4, 5).fill({ color: 0x554433, alpha: 0.9 });
      sprite.rect(0, -3, 4, 5).fill({ color: 0x554433, alpha: 0.9 });
      // Boots
      sprite.roundRect(-5, 1, 5, 3, 1).fill({ color: 0x3a2a1a, alpha: 0.9 });
      sprite.roundRect(0, 1, 5, 3, 1).fill({ color: 0x3a2a1a, alpha: 0.9 });
      // Body — merchant robe
      sprite.poly([
        { x: -9, y: -3 }, { x: -8, y: -20 }, { x: 0, y: -23 }, { x: 8, y: -20 }, { x: 9, y: -3 },
      ]).fill({ color: 0x886633, alpha: 0.95 });
      // Apron
      sprite.poly([
        { x: -6, y: -16 }, { x: -5, y: -3 }, { x: 5, y: -3 }, { x: 6, y: -16 },
      ]).fill({ color: 0xccaa77, alpha: 0.8 });
      // Arms
      sprite.rect(-11, -19, 4, 10).fill({ color: 0x886633, alpha: 0.9 });
      sprite.rect(7, -19, 4, 10).fill({ color: 0x886633, alpha: 0.9 });
      // Hands
      sprite.circle(-9, -8, 2).fill({ color: 0xddbb88, alpha: 0.9 });
      sprite.circle(9, -8, 2).fill({ color: 0xddbb88, alpha: 0.9 });
      // Neck
      sprite.rect(-2, -25, 4, 3).fill({ color: 0xddbb88, alpha: 0.9 });
      // Head
      sprite.circle(0, -28, 6.5).fill({ color: 0xddbb88, alpha: 0.95 });
      // Hair (merchant cap)
      sprite.ellipse(0, -33, 8, 3.5).fill({ color: 0x664422, alpha: 0.9 });
      sprite.rect(-7, -33, 14, 2).fill({ color: 0x664422, alpha: 0.8 });
      // Eyes
      sprite.ellipse(-2.5, -28, 1.2, 1).fill(0xffffff);
      sprite.ellipse(2.5, -28, 1.2, 1).fill(0xffffff);
      sprite.circle(-2.5, -28, 0.7).fill(0x332211);
      sprite.circle(2.5, -28, 0.7).fill(0x332211);
      // Friendly smile
      sprite.moveTo(-2, -25.5).quadraticCurveTo(0, -24.5, 2, -25.5).stroke({ color: 0xaa8866, width: 0.6, alpha: 0.5 });
      // Gold coin pouch
      sprite.roundRect(-4, -10, 4, 4, 1).fill({ color: 0xe6cc33, alpha: 0.8 });
      sprite.circle(-2, -8, 1.5).fill({ color: 0xffdd44, alpha: 0.7 });
    } else {
      // Regular NPC — villager/quest giver
      // Legs
      sprite.rect(-4, -3, 4, 5).fill({ color: 0x444455, alpha: 0.9 });
      sprite.rect(0, -3, 4, 5).fill({ color: 0x444455, alpha: 0.9 });
      // Boots
      sprite.roundRect(-5, 1, 5, 3, 1).fill({ color: 0x3a2a1a, alpha: 0.9 });
      sprite.roundRect(0, 1, 5, 3, 1).fill({ color: 0x3a2a1a, alpha: 0.9 });
      // Body — simple tunic
      sprite.poly([
        { x: -8, y: -3 }, { x: -7, y: -19 }, { x: 0, y: -22 }, { x: 7, y: -19 }, { x: 8, y: -3 },
      ]).fill({ color: 0x555577, alpha: 0.95 });
      // Tunic detail
      sprite.moveTo(0, -22).lineTo(0, -3).stroke({ color: 0x444466, width: 0.6, alpha: 0.4 });
      // Belt
      sprite.rect(-7, -8, 14, 2).fill({ color: 0x554422, alpha: 0.8 });
      // Arms
      sprite.rect(-10, -18, 4, 10).fill({ color: 0x555577, alpha: 0.9 });
      sprite.rect(6, -18, 4, 10).fill({ color: 0x555577, alpha: 0.9 });
      // Hands
      sprite.circle(-8, -7, 2).fill({ color: 0xddbb88, alpha: 0.9 });
      sprite.circle(8, -7, 2).fill({ color: 0xddbb88, alpha: 0.9 });
      // Neck
      sprite.rect(-2, -24, 4, 3).fill({ color: 0xddbb88, alpha: 0.9 });
      // Head
      sprite.circle(0, -27, 6.5).fill({ color: 0xddbb88, alpha: 0.95 });
      // Hair
      sprite.poly([
        { x: -6, y: -28 }, { x: -6, y: -33 }, { x: -2, y: -35 },
        { x: 3, y: -35 }, { x: 6, y: -33 }, { x: 6, y: -28 },
      ]).fill({ color: 0x554433, alpha: 0.9 });
      // Eyes
      sprite.ellipse(-2.5, -27, 1.2, 1).fill(0xffffff);
      sprite.ellipse(2.5, -27, 1.2, 1).fill(0xffffff);
      sprite.circle(-2.5, -27, 0.7).fill(0x332244);
      sprite.circle(2.5, -27, 0.7).fill(0x332244);
      // Quest marker
      const hasQuest = spawn.dialogueTreeID != null;
      if (hasQuest) {
        sprite.circle(0, -40, 5).fill({ color: 0xeedd44, alpha: 0.85 });
        sprite.circle(0, -40, 5).stroke({ color: 0xccbb33, width: 0.8, alpha: 0.6 });
        const bang = new Text({ text: '!', style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 9, fill: 0x332200, fontWeight: 'bold' }) });
        bang.anchor.set(0.5);
        bang.y = -40;
        container.addChild(bang);
      }
    }
    container.addChild(sprite);

    const npcName = formatNPCName(spawn.npcID);
    const nameText = new Text({
      text: npcName,
      style: new TextStyle({
        fontFamily: 'Georgia, serif', fontSize: 8,
        fill: spawn.isShopkeeper ? 0xe6cc33 : 0xaaaacc,
        dropShadow: { color: 0x000000, blur: 2, distance: 1 },
      }),
    });
    nameText.anchor.set(0.5);
    nameText.y = -40;
    container.addChild(nameText);

    container.x = pos.x;
    container.y = pos.y;
    container.eventMode = 'static';
    container.cursor = 'pointer';
    container.on('pointerdown', () => onInteract(spawn));
    worldContainer.addChild(container);

    npcs.push({ id: spawn.npcID, position: pos, sprite: container, nameText, isShopkeeper: spawn.isShopkeeper });
  }

  return npcs;
}

export function formatNPCName(npcID: string): string {
  return npcID.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// ─── Spawn Loot Points ──────────────────────────────────────────

export function spawnLootPoints(
  zone: Zone,
  worldContainer: Container,
  onCollect: (id: string) => void,
): LootInstance[] {
  const lootPoints: LootInstance[] = [];

  for (const loot of zone.lootPoints) {
    const pos = isoToScreen(loot.position.col, loot.position.row);
    const container = new Container();
    container.zIndex = pos.y;

    if (!loot.isHidden) {
      const chest = new Graphics();
      chest.roundRect(-8, -6, 16, 10, 2).fill({ color: 0x664422, alpha: 0.9 });
      chest.roundRect(-9, -12, 18, 7, 2).fill({ color: 0x775533, alpha: 0.9 });
      chest.circle(0, -8, 2).fill({ color: 0xe6cc33, alpha: 0.9 });
      chest.circle(0, -6, 14).fill({ color: 0xeedd44, alpha: 0.06 });
      container.addChild(chest);

      for (let i = 0; i < 3; i++) {
        const sparkle = new Graphics();
        sparkle.star(0, 0, 4, 2, 1).fill({ color: 0xeedd88, alpha: 0.4 });
        sparkle.x = (Math.random() - 0.5) * 16;
        sparkle.y = -8 + (Math.random() - 0.5) * 10;
        container.addChild(sparkle);
      }
    } else {
      const shimmer = new Graphics();
      shimmer.circle(0, -2, 4).fill({ color: 0xeedd88, alpha: 0.15 });
      container.addChild(shimmer);
    }

    container.x = pos.x;
    container.y = pos.y;
    container.eventMode = 'static';
    container.cursor = 'pointer';
    container.on('pointerdown', () => onCollect(loot.id));
    worldContainer.addChild(container);

    lootPoints.push({ id: loot.id, position: pos, sprite: container, collected: false, isHidden: loot.isHidden });
  }

  return lootPoints;
}

export function collectLoot(
  lootId: string,
  lootPoints: LootInstance[],
  zone: Zone,
  playerScreenPos: { x: number; y: number },
  showFloatingText: (x: number, y: number, msg: string, color: number) => void,
  checkQuestCompletion: () => void,
): void {
  const instance = lootPoints.find(l => l.id === lootId);
  if (!instance || instance.collected) return;

  const playerDist = Math.hypot(instance.position.x - playerScreenPos.x, instance.position.y - playerScreenPos.y);
  if (playerDist > 60) {
    showFloatingText(instance.position.x, instance.position.y - 20, 'Trop loin!', 0xff6644);
    return;
  }

  instance.collected = true;
  instance.sprite.visible = false;

  const champ = GameManager.shared.champion;
  if (!champ) return;

  const lootData = zone.lootPoints.find(l => l.id === lootId);
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

  checkQuestCompletion();
  showFloatingText(instance.position.x, instance.position.y - 20,
    itemsFound > 0 ? `+${itemsFound} objet(s)!` : 'Vide...', 0xeedd88);
}

// ─── Spawn Enemies ──────────────────────────────────────────────

export function spawnEnemies(
  zone: Zone,
  worldContainer: Container,
  drawEnemyHP: (bar: Graphics, pct: number) => void,
): { enemies: EnemyInstance[]; behaviors: Map<string, BehaviorState> } {
  const enemies: EnemyInstance[] = [];
  const behaviors = new Map<string, BehaviorState>();

  for (const spawn of zone.enemySpawns) {
    const data = gameData.enemy(spawn.enemyID);
    if (!data) continue;

    const pos = isoToScreen(spawn.position.col, spawn.position.row);
    const container = new Container();
    container.zIndex = pos.y;

    const shadow = new Graphics();
    const size = data.tier === 'boss' ? 14 : data.tier === 'elite' ? 11 : 8;
    shadow.ellipse(0, 2, size + 2, 4).fill({ color: 0x000000, alpha: 0.25 });
    container.addChild(shadow);

    const sprite = new Graphics();
    drawEnemySprite(sprite, data, size);
    container.addChild(sprite);

    const hpBar = new Graphics();
    hpBar.y = -size * 2 - 14;
    drawEnemyHP(hpBar, 1);
    container.addChild(hpBar);

    const tierColors: Record<string, number> = {
      minion: 0xaa8877, soldier: 0xcc6655, elite: 0xcc66dd, boss: 0xff8833,
    };
    const nameText = new Text({
      text: data.name,
      style: new TextStyle({
        fontFamily: 'sans-serif', fontSize: 7,
        fill: tierColors[data.tier] ?? 0xaa8877,
        dropShadow: { color: 0x000000, blur: 2, distance: 1 },
      }),
    });
    nameText.anchor.set(0.5);
    nameText.y = -size * 2 - 22;
    container.addChild(nameText);

    container.x = pos.x;
    container.y = pos.y;
    worldContainer.addChild(container);

    const ngpStats = NewGamePlusManager.shared.applyToEnemy(data.maxHP, data.damage, data.speed);
    if (data.tier === 'minion' && NewGamePlusManager.shared.shouldUpgradeToElite()) {
      data.tier = 'elite' as typeof data.tier;
    }

    const affixes = rollAffixes(data.tier);
    const affixState = affixes.length > 0 ? createAffixState(affixes) : undefined;
    const hpMult = affixState ? getAffixHPMultiplier(affixState) : 1;
    const finalMaxHP = Math.floor(ngpStats.hp * hpMult);

    const enemy: EnemyInstance = {
      data, spawn, hp: finalMaxHP, maxHP: finalMaxHP,
      position: { ...pos }, gridPos: { ...spawn.position },
      sprite: container, hpBar, nameText,
      isDead: false, attackCooldown: 0, state: 'idle',
      respawnTimer: 0, animTimer: Math.random() * Math.PI * 2,
      affixState, enemyAnim: createEnemyAnimState(),
    };

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

    if (data.tier === 'boss') {
      enemy.bossState = new BossState(data.id);
    }

    enemies.push(enemy);

    const behaviorKey = data.id + '_' + spawn.position.col + '_' + spawn.position.row;
    behaviors.set(behaviorKey, createBehaviorState(data.behavior, pos.x, pos.y, data.attackRange));
  }

  return { enemies, behaviors };
}

// ─── Draw Enemy HP Bar ──────────────────────────────────────────

export function drawEnemyHP(bar: Graphics, pct: number): void {
  bar.clear();
  const w = 32;
  bar.roundRect(-w / 2, 0, w, 4, 1).fill({ color: 0x111111, alpha: 0.8 });
  bar.roundRect(-w / 2, 0, w, 4, 1).stroke({ color: 0x333333, width: 0.5 });
  if (pct > 0) {
    const color = pct > 0.6 ? 0x44cc44 : pct > 0.3 ? 0xcccc44 : 0xcc4444;
    bar.roundRect(-w / 2, 0, w * Math.max(0, pct), 4, 1).fill(color);
  }
}

// ─── Render Exits ───────────────────────────────────────────────

export function renderExits(zone: Zone, worldContainer: Container): void {
  for (const conn of zone.connections) {
    const pos = isoToScreen(conn.exitPosition.col, conn.exitPosition.row);
    const container = new Container();
    container.zIndex = pos.y + 1;

    const portal = new Graphics();
    portal.circle(0, -10, 18).fill({ color: 0x4499ff, alpha: 0.06 });
    portal.circle(0, -10, 12).fill({ color: 0x66bbff, alpha: 0.1 });
    portal.poly([{ x: 0, y: -24 }, { x: 14, y: -10 }, { x: 0, y: 4 }, { x: -14, y: -10 }])
      .fill({ color: 0x66ccff, alpha: 0.25 })
      .stroke({ color: 0x88ddff, width: 1.5, alpha: 0.7 });
    portal.poly([{ x: 0, y: -18 }, { x: 5, y: -12 }, { x: -5, y: -12 }])
      .fill({ color: 0xaaeeff, alpha: 0.6 });
    container.addChild(portal);

    const targetZone = gameData.zone(conn.targetZoneID);
    const label = new Text({
      text: `→ ${targetZone?.name ?? conn.targetZoneID}`,
      style: new TextStyle({
        fontFamily: 'Georgia, serif', fontSize: 8, fill: 0x88ccff,
        dropShadow: { color: 0x000000, blur: 3, distance: 1 },
      }),
    });
    label.anchor.set(0.5, 0);
    label.y = 10;
    container.addChild(label);

    if (conn.requiredQuestID) {
      const champ = GameManager.shared.champion;
      const isLocked = !champ?.completedQuestIDs.includes(conn.requiredQuestID);
      if (isLocked) {
        const lock = new Text({ text: '🔒', style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 10, fill: 0xff6644 }) });
        lock.anchor.set(0.5);
        lock.y = -28;
        container.addChild(lock);
      }
    }

    container.x = pos.x;
    container.y = pos.y;
    worldContainer.addChild(container);
  }
}
