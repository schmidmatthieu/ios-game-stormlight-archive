// ─── Building Interior System — Full-Screen Immersive ─────────────
// Procedurally generated interior with detailed room views,
// minimap navigation, and interactive elements.
//
// Data, types, and room generation are in BuildingInteriorData.ts.

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { GameManager } from '../game/GameManager';
import { MusicManager } from '../game/MusicSystem';
import { lighten, darken } from '../utils/ColorUtils';
import {
  WORLD_COLORS, INTERACTABLE_COLORS, INTERACTABLE_LABELS,
  detectBuildingType, generateRooms, roomLabel, processInteraction,
} from './BuildingInteriorData';
import type { Room, Interactable } from './BuildingInteriorData';

// Re-export everything from data module so existing imports keep working
export {
  type RoomType, type Room, type Interactable, type BuildingType,
  type InteractionContext, type InteractionResult,
  WORLD_COLORS, ROOM_TEMPLATES, LORE_TEXTS, ITEM_POOL,
  INTERACTABLE_COLORS, INTERACTABLE_LABELS,
  detectBuildingType, generateRooms, roomLabel, processInteraction,
} from './BuildingInteriorData';

// ─── Main Entry Point ───────────────────────────────────────────

export function showBuildingInterior(
  uiContainer: Container,
  screenW: number, screenH: number,
  buildingName: string,
  worldID: string,
  onClose: (rewards: { xp: number; gold: number; items: string[] }) => void,
): Container {
  const panel = new Container();
  panel.zIndex = 10000;

  const champ = GameManager.shared.champion;
  const rewards = { xp: 0, gold: 0, items: [] as string[] };

  const buildingType = detectBuildingType(buildingName);
  const rooms = generateRooms(buildingType);
  let currentRoom = 0;
  const colors = WORLD_COLORS[worldID] ?? WORLD_COLORS.scadrial;

  // ── Full-screen background (solid, not transparent overlay)
  const bg = new Graphics();
  bg.rect(0, 0, screenW, screenH).fill({ color: 0x050510, alpha: 1.0 });
  bg.eventMode = 'static';
  panel.addChild(bg);

  // ── Top header bar
  const headerH = 44;
  const header = new Graphics();
  header.rect(0, 0, screenW, headerH).fill({ color: colors.wall, alpha: 0.95 });
  header.rect(0, headerH - 2, screenW, 2).fill({ color: colors.accent, alpha: 0.6 });
  panel.addChild(header);

  const title = new Text({
    text: buildingName,
    style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 15, fill: 0xe6cc66, fontWeight: 'bold' }),
  });
  title.anchor.set(0.5, 0.5);
  title.x = screenW / 2;
  title.y = headerH / 2;
  panel.addChild(title);

  // Exit button (top-right)
  const exitBtn = new Graphics();
  exitBtn.roundRect(screenW - 80, 8, 70, 28, 6)
    .fill({ color: 0x442222, alpha: 0.9 })
    .stroke({ color: 0x884444, width: 1 });
  exitBtn.eventMode = 'static';
  exitBtn.cursor = 'pointer';
  exitBtn.on('pointerdown', () => {
    panel.destroy({ children: true });
    onClose(rewards);
  });
  panel.addChild(exitBtn);

  const exitLabel = new Text({
    text: 'Sortir',
    style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 11, fill: 0xffcccc, fontWeight: 'bold' }),
  });
  exitLabel.anchor.set(0.5);
  exitLabel.x = screenW - 45;
  exitLabel.y = 22;
  panel.addChild(exitLabel);

  // ── Room name label (under header)
  const roomNameText = new Text({
    text: '',
    style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 13, fill: colors.accent, fontWeight: 'bold' }),
  });
  roomNameText.anchor.set(0.5, 0);
  roomNameText.x = screenW / 2;
  roomNameText.y = headerH + 8;
  panel.addChild(roomNameText);

  // ── Main room view
  const roomViewY = headerH + 32;
  const roomViewH = screenH - roomViewY - 120;
  const roomViewW = screenW - 20;

  const roomViewContainer = new Container();
  roomViewContainer.x = 10;
  roomViewContainer.y = roomViewY;
  panel.addChild(roomViewContainer);

  // ── Status text area (bottom)
  const statusBg = new Graphics();
  statusBg.roundRect(10, screenH - 110, screenW - 20, 50, 8)
    .fill({ color: 0x0a0815, alpha: 0.9 })
    .stroke({ color: colors.accent, width: 1, alpha: 0.3 });
  panel.addChild(statusBg);

  const statusText = new Text({
    text: '',
    style: new TextStyle({
      fontFamily: 'sans-serif', fontSize: 11, fill: 0xddddcc,
      wordWrap: true, wordWrapWidth: screenW - 50,
    }),
  });
  statusText.x = 22;
  statusText.y = screenH - 102;
  panel.addChild(statusText);

  // ── Navigation buttons (bottom bar)
  const navContainer = new Container();
  navContainer.y = screenH - 54;
  panel.addChild(navContainer);

  // ── Minimap (bottom-right corner)
  const minimapSize = 80;
  const minimapContainer = new Container();
  minimapContainer.x = screenW - minimapSize - 14;
  minimapContainer.y = roomViewY + roomViewH - minimapSize - 8;
  panel.addChild(minimapContainer);

  // ── Drawing functions

  function drawRoomView(): void {
    roomViewContainer.removeChildren();
    const room = rooms[currentRoom];
    roomNameText.text = roomLabel(room.type);

    const cellSize = Math.min(
      Math.floor(roomViewW / (room.w + 2)),
      Math.floor(roomViewH / (room.h + 2)),
    );
    const totalW = (room.w + 2) * cellSize;
    const totalH = (room.h + 2) * cellSize;
    const offsetX = (roomViewW - totalW) / 2;
    const offsetY = (roomViewH - totalH) / 2;

    const g = new Graphics();
    roomViewContainer.addChild(g);

    // Outer wall shadow
    g.roundRect(offsetX - 2, offsetY - 2, totalW + 4, totalH + 4, 4)
      .fill({ color: 0x000000, alpha: 0.4 });
    // Walls
    g.rect(offsetX, offsetY, totalW, totalH)
      .fill({ color: colors.wall, alpha: 0.95 });
    // Floor
    g.rect(offsetX + cellSize, offsetY + cellSize, room.w * cellSize, room.h * cellSize)
      .fill({ color: colors.floor, alpha: 0.9 });

    // Floor tiles pattern
    for (let fx = 0; fx < room.w; fx++) {
      for (let fy = 0; fy < room.h; fy++) {
        const tx = offsetX + (fx + 1) * cellSize;
        const ty = offsetY + (fy + 1) * cellSize;
        g.rect(tx, ty, cellSize, cellSize)
          .stroke({ color: lighten(colors.floor, 0.15), width: 0.5, alpha: 0.15 });
        if ((fx + fy) % 2 === 0) {
          g.rect(tx, ty, cellSize, cellSize)
            .fill({ color: lighten(colors.floor, 0.05), alpha: 0.15 });
        }
      }
    }

    // Wall decorations
    g.rect(offsetX + cellSize, offsetY + cellSize - 3, room.w * cellSize, 3)
      .fill({ color: darken(colors.wall, 0.15), alpha: 0.8 });
    g.rect(offsetX + cellSize, offsetY + (room.h + 1) * cellSize, room.w * cellSize, 3)
      .fill({ color: darken(colors.wall, 0.15), alpha: 0.8 });

    // Torchlight ambient
    const cx = offsetX + totalW / 2;
    const cy = offsetY + totalH / 2;
    g.circle(cx, cy, Math.max(totalW, totalH) * 0.4)
      .fill({ color: 0xffaa44, alpha: 0.06 });
    g.circle(cx, cy, Math.max(totalW, totalH) * 0.25)
      .fill({ color: 0xffcc66, alpha: 0.04 });

    // Door indicators for connected rooms
    drawDoors(room, g, cellSize, offsetX, offsetY);

    // Draw interactables
    drawInteractables(room, cellSize, offsetX, offsetY);

    // Player character indicator
    const playerX = offsetX + (1 + room.w / 2) * cellSize;
    const playerY = offsetY + (1 + room.h / 2) * cellSize;
    const playerG = new Graphics();
    playerG.circle(playerX, playerY, 8)
      .fill({ color: 0x44ff88, alpha: 0.8 })
      .stroke({ color: 0xffffff, width: 1.5, alpha: 0.8 });
    playerG.circle(playerX, playerY, 12)
      .fill({ color: 0x44ff88, alpha: 0.1 });
    roomViewContainer.addChild(playerG);
  }

  function drawDoors(room: Room, g: Graphics, cellSize: number, offsetX: number, offsetY: number): void {
    for (const ci of room.connections) {
      const target = rooms[ci];
      const dx = target.x - room.x;
      const dy = target.y - room.y;
      let doorX: number, doorY: number, doorW: number, doorH: number;

      if (Math.abs(dx) > Math.abs(dy)) {
        doorX = dx > 0
          ? offsetX + (room.w + 1) * cellSize - 2
          : offsetX + cellSize - cellSize / 3;
        doorY = offsetY + (1 + room.h / 2) * cellSize - cellSize / 2;
        doorW = cellSize / 3;
        doorH = cellSize;
      } else {
        doorX = offsetX + (1 + room.w / 2) * cellSize - cellSize / 2;
        doorY = dy > 0
          ? offsetY + (room.h + 1) * cellSize - 2
          : offsetY + cellSize - cellSize / 3;
        doorW = cellSize;
        doorH = cellSize / 3;
      }

      g.rect(doorX, doorY, doorW, doorH)
        .fill({ color: 0x332211, alpha: 0.9 });
      g.rect(doorX + 1, doorY + 1, doorW - 2, doorH - 2)
        .fill({ color: 0xffcc44, alpha: 0.1 });

      const doorBtn = new Graphics();
      doorBtn.roundRect(doorX - 4, doorY - 4, doorW + 8, doorH + 8, 4)
        .fill({ color: 0x44aa44, alpha: 0.25 })
        .stroke({ color: 0x88cc88, width: 1.5, alpha: 0.6 });
      doorBtn.eventMode = 'static';
      doorBtn.cursor = 'pointer';
      doorBtn.on('pointerdown', () => moveToRoom(ci));
      roomViewContainer.addChild(doorBtn);

      const arrowLabel = new Text({
        text: `→ ${roomLabel(target.type)}`,
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 8, fill: 0x88cc88 }),
      });
      arrowLabel.anchor.set(0.5);
      arrowLabel.x = doorX + doorW / 2;
      arrowLabel.y = doorY - 10;
      roomViewContainer.addChild(arrowLabel);
    }
  }

  function drawInteractables(room: Room, cellSize: number, offsetX: number, offsetY: number): void {
    for (const inter of room.interactables) {
      const ix = offsetX + (inter.x + 1) * cellSize;
      const iy = offsetY + (inter.y + 1) * cellSize;
      const color = INTERACTABLE_COLORS[inter.type] ?? 0xaaaaaa;
      const dimmed = inter.looted;
      const objSize = cellSize * 0.7;

      const objG = new Graphics();
      objG.roundRect(ix - objSize / 2, iy - objSize / 2, objSize, objSize, 4)
        .fill({ color: dimmed ? darken(color, 0.4) : color, alpha: dimmed ? 0.3 : 0.7 })
        .stroke({ color: dimmed ? 0x444444 : lighten(color, 0.3), width: 1.5, alpha: dimmed ? 0.3 : 0.7 });

      if (!dimmed) {
        objG.circle(ix, iy, objSize * 0.7)
          .fill({ color, alpha: 0.1 });
      }

      objG.eventMode = 'static';
      objG.cursor = dimmed ? 'default' : 'pointer';
      objG.on('pointerdown', () => handleInteract(inter));
      roomViewContainer.addChild(objG);

      const labelText = new Text({
        text: inter.label,
        style: new TextStyle({
          fontFamily: 'sans-serif', fontSize: 9,
          fill: dimmed ? 0x555555 : 0xeeddcc,
          fontWeight: 'bold',
        }),
      });
      labelText.anchor.set(0.5, 0);
      labelText.x = ix;
      labelText.y = iy + objSize / 2 + 3;
      roomViewContainer.addChild(labelText);

      if (!dimmed) {
        const hint = new Text({
          text: INTERACTABLE_LABELS[inter.type] ?? 'Interagir',
          style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 7, fill: color }),
        });
        hint.anchor.set(0.5, 0);
        hint.x = ix;
        hint.y = iy + objSize / 2 + 14;
        roomViewContainer.addChild(hint);
      }
    }
  }

  function drawMinimap(): void {
    minimapContainer.removeChildren();
    const g = new Graphics();
    minimapContainer.addChild(g);

    g.roundRect(-4, -4, minimapSize + 8, minimapSize + 8, 6)
      .fill({ color: 0x0a0815, alpha: 0.85 })
      .stroke({ color: colors.accent, width: 1, alpha: 0.4 });

    let maxX = 0, maxY = 0;
    for (const room of rooms) {
      maxX = Math.max(maxX, room.x + room.w);
      maxY = Math.max(maxY, room.y + room.h);
    }
    const sc = Math.min((minimapSize - 8) / (maxX + 2), (minimapSize - 8) / (maxY + 2));

    for (let ri = 0; ri < rooms.length; ri++) {
      const ra = rooms[ri];
      for (const ci of ra.connections) {
        if (ci <= ri) continue;
        const rb = rooms[ci];
        g.moveTo((ra.x + ra.w / 2) * sc + 4, (ra.y + ra.h / 2) * sc + 4)
          .lineTo((rb.x + rb.w / 2) * sc + 4, (rb.y + rb.h / 2) * sc + 4)
          .stroke({ color: 0x554433, width: 2, alpha: 0.5 });
      }
    }

    for (let ri = 0; ri < rooms.length; ri++) {
      const room = rooms[ri];
      const isCurrent = ri === currentRoom;
      const alpha = room.explored ? (isCurrent ? 1.0 : 0.5) : 0.15;
      g.rect(room.x * sc + 4, room.y * sc + 4, room.w * sc, room.h * sc)
        .fill({ color: isCurrent ? colors.accent : colors.floor, alpha: alpha * 0.8 });
      g.rect(room.x * sc + 4, room.y * sc + 4, room.w * sc, room.h * sc)
        .stroke({ color: colors.wall, width: 1, alpha: alpha * 0.6 });
    }

    const pr = rooms[currentRoom];
    g.circle((pr.x + pr.w / 2) * sc + 4, (pr.y + pr.h / 2) * sc + 4, 3)
      .fill({ color: 0x44ff88 })
      .stroke({ color: 0xffffff, width: 1 });
  }

  function drawNavButtons(): void {
    navContainer.removeChildren();
    const connections = rooms[currentRoom].connections;
    const btnW = Math.min(120, (screenW - 30) / Math.max(connections.length + 1, 1));
    const btnH = 36;
    const totalW = (connections.length + 1) * (btnW + 8);
    const startX = (screenW - totalW) / 2;

    connections.forEach((ci, i) => {
      const target = rooms[ci];
      const bx = startX + i * (btnW + 8);
      const btn = new Graphics();
      btn.roundRect(bx, 0, btnW, btnH, 6)
        .fill({ color: 0x224422, alpha: 0.9 })
        .stroke({ color: 0x66aa66, width: 1.5, alpha: 0.7 });
      btn.eventMode = 'static';
      btn.cursor = 'pointer';
      btn.on('pointerdown', () => moveToRoom(ci));
      navContainer.addChild(btn);

      const label = new Text({
        text: `→ ${roomLabel(target.type)}`,
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 9, fill: 0x88cc88, fontWeight: 'bold' }),
      });
      label.anchor.set(0.5);
      label.x = bx + btnW / 2;
      label.y = btnH / 2;
      navContainer.addChild(label);
    });

    const bx = startX + connections.length * (btnW + 8);
    const exitBtnNav = new Graphics();
    exitBtnNav.roundRect(bx, 0, btnW, btnH, 6)
      .fill({ color: 0x442222, alpha: 0.9 })
      .stroke({ color: 0xaa6644, width: 1.5, alpha: 0.7 });
    exitBtnNav.eventMode = 'static';
    exitBtnNav.cursor = 'pointer';
    exitBtnNav.on('pointerdown', () => {
      panel.destroy({ children: true });
      onClose(rewards);
    });
    navContainer.addChild(exitBtnNav);

    const exitLbl = new Text({
      text: 'Sortir du bâtiment',
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 9, fill: 0xffcccc, fontWeight: 'bold' }),
    });
    exitLbl.anchor.set(0.5);
    exitLbl.x = bx + btnW / 2;
    exitLbl.y = btnH / 2;
    navContainer.addChild(exitLbl);
  }

  function moveToRoom(index: number): void {
    currentRoom = index;
    rooms[index].explored = true;
    MusicManager.shared.playSFX('step');
    statusText.text = `Vous entrez dans : ${roomLabel(rooms[index].type)}`;
    drawRoomView();
    drawMinimap();
    drawNavButtons();
  }

  function handleInteract(inter: Interactable): void {
    const ctx = {
      maxHP: champ ? GameManager.shared.maxHP : 0,
      maxInvestiture: champ ? GameManager.shared.maxInvestiture : 0,
      currentHP: champ ? champ.currentHP : 0,
      currentInvestiture: champ ? champ.currentInvestiture : 0,
      hasChampion: !!champ,
    };
    const result = processInteraction(inter, ctx);

    statusText.text = result.statusText;
    if (result.gold > 0) {
      rewards.gold += result.gold;
      if (champ) champ.gold += result.gold;
    }
    if (result.xp > 0) {
      rewards.xp += result.xp;
      if (champ) GameManager.shared.grantXP(result.xp);
    }
    for (const item of result.items) rewards.items.push(item);
    if (champ && result.healHP > 0) {
      champ.currentHP = Math.min(champ.currentHP + result.healHP, GameManager.shared.maxHP);
    }
    if (champ && result.healInvestiture > 0) {
      champ.currentInvestiture = Math.min(
        champ.currentInvestiture + result.healInvestiture, GameManager.shared.maxInvestiture,
      );
    }
    if (result.sfx) MusicManager.shared.playSFX(result.sfx);
    if (result.markLooted) inter.looted = true;

    drawRoomView();
  }

  // Initial render
  statusText.text = `Vous entrez dans ${buildingName}. Explorez les pièces et interagissez avec les objets.`;
  drawRoomView();
  drawMinimap();
  drawNavButtons();

  uiContainer.addChild(panel);
  return panel;
}
