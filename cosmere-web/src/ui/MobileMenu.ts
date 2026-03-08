// ─── Mobile Hamburger Menu ────────────────────────────────────────────
// Replaces the full toolbar on mobile: shows a compact hamburger button
// that opens a grid overlay with all game panel shortcuts.

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { scaled, fontSize, touchTarget, toolbarY, panelRadius, UI_COLORS, UI_ALPHA } from './ResponsiveLayout';
import type { LayoutInfo } from './ResponsiveLayout';

export interface MobileMenuCallbacks {
  togglePause: () => void;
  toggleInventory: () => void;
  toggleCrafting: () => void;
  toggleBestiary: () => void;
  toggleAchievements: () => void;
  toggleSkillTree: () => void;
  toggleTalentTree: () => void;
  toggleCompanion: () => void;
  toggleQuestJournal: () => void;
  toggleProfessions?: () => void;
  spawnWave?: () => void;
}

interface MenuEntry {
  label: string;
  icon: string;
  color: number;
  action: () => void;
}

export function createMobileMenu(
  uiContainer: Container,
  screenW: number,
  screenH: number,
  layout: LayoutInfo,
  cb: MobileMenuCallbacks,
): { container: Container; close: () => void } {
  const root = new Container();
  root.zIndex = 9000;

  let overlay: Container | null = null;

  // ── Hamburger button (top-right, next to pause) ──────────────────
  const btnSize = touchTarget(32, layout);
  const btnX = screenW - scaled(12, layout) - btnSize;
  const btnY = toolbarY(layout);

  const hamburger = new Container();
  const hamburgerBg = new Graphics();
  hamburgerBg.roundRect(0, 0, btnSize, btnSize, scaled(7, layout))
    .fill({ color: UI_COLORS.btnSecondary, alpha: 0.85 })
    .stroke({ color: UI_COLORS.borderSubtle, width: 1.2, alpha: UI_ALPHA.panelBorder });
  hamburger.addChild(hamburgerBg);

  // Three horizontal bars
  const barW = btnSize * 0.5;
  const barH = 2;
  const barX = (btnSize - barW) / 2;
  const barIcon = new Graphics();
  for (let i = 0; i < 3; i++) {
    const by = btnSize * 0.3 + i * (btnSize * 0.15);
    barIcon.rect(barX, by, barW, barH).fill({ color: UI_COLORS.textPrimary, alpha: 0.85 });
  }
  hamburger.addChild(barIcon);

  hamburger.x = btnX;
  hamburger.y = btnY;
  hamburger.eventMode = 'static';
  hamburger.cursor = 'pointer';
  hamburger.on('pointerdown', () => {
    hamburger.alpha = 0.7;
    toggleMenu();
  });
  hamburger.on('pointerup', () => { hamburger.alpha = 1; });
  hamburger.on('pointerupoutside', () => { hamburger.alpha = 1; });
  root.addChild(hamburger);

  // ── Build menu entries ──────────────────────────────────────────
  const entries: MenuEntry[] = [
    { label: 'Pause', icon: '⏸', color: 0x888899, action: cb.togglePause },
    { label: 'Inventaire', icon: '🎒', color: 0xaa8855, action: cb.toggleInventory },
    { label: 'Talents', icon: '⭐', color: 0xcc88ff, action: cb.toggleTalentTree },
    { label: 'Sorts', icon: '🌀', color: 0x5588cc, action: cb.toggleSkillTree },
    { label: 'Quêtes', icon: '📖', color: 0x886633, action: cb.toggleQuestJournal },
    { label: 'Compagnon', icon: '🤝', color: 0x88ccff, action: cb.toggleCompanion },
    { label: 'Craft', icon: '⚒', color: 0x888899, action: cb.toggleCrafting },
    { label: 'Bestiaire', icon: '📕', color: 0x557744, action: cb.toggleBestiary },
    { label: 'Hauts faits', icon: '🏆', color: 0xccaa44, action: cb.toggleAchievements },
  ];
  if (cb.toggleProfessions) {
    entries.push({ label: 'Métiers', icon: '⛏', color: 0xaa8855, action: cb.toggleProfessions });
  }
  if (cb.spawnWave) {
    entries.push({ label: 'Vague', icon: '\u2694', color: 0xee5544, action: cb.spawnWave });
  }

  function toggleMenu(): void {
    if (overlay) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  function openMenu(): void {
    if (overlay) return;
    overlay = new Container();
    overlay.zIndex = 9500;

    // Dark backdrop
    const backdrop = new Graphics();
    backdrop.rect(0, 0, screenW, screenH).fill({ color: 0x000000, alpha: 0.6 });
    backdrop.eventMode = 'static';
    backdrop.on('pointerdown', closeMenu);
    overlay.addChild(backdrop);

    // Menu panel — centered grid
    const cols = 3;
    const rows = Math.ceil(entries.length / cols);
    const cellSize = Math.min(scaled(72, layout), (screenW - scaled(40, layout)) / cols);
    const gap = scaled(8, layout);
    const gridW = cols * cellSize + (cols - 1) * gap;
    const gridH = rows * cellSize + (rows - 1) * gap;
    const panelPad = scaled(16, layout);
    const panelW = gridW + panelPad * 2;
    const panelH = gridH + panelPad * 2 + scaled(32, layout);
    const panelX = (screenW - panelW) / 2;
    const panelY = (screenH - panelH) / 2;
    const radius = panelRadius(layout);

    const panel = new Graphics();
    panel.roundRect(panelX, panelY, panelW, panelH, radius)
      .fill({ color: UI_COLORS.panelBg, alpha: 0.94 })
      .stroke({ color: UI_COLORS.borderGold, width: 1.5, alpha: 0.5 });
    overlay.addChild(panel);

    // Title
    const title = new Text({
      text: 'Menu',
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: fontSize(16, layout),
        fill: UI_COLORS.textGold,
        fontWeight: 'bold',
      }),
    });
    title.anchor.set(0.5, 0);
    title.x = screenW / 2;
    title.y = panelY + scaled(10, layout);
    overlay.addChild(title);

    // Grid buttons
    const gridStartX = panelX + panelPad;
    const gridStartY = panelY + panelPad + scaled(32, layout);

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = gridStartX + col * (cellSize + gap);
      const cy = gridStartY + row * (cellSize + gap);

      const cell = new Container();

      const cellBg = new Graphics();
      cellBg.roundRect(0, 0, cellSize, cellSize, scaled(8, layout))
        .fill({ color: entry.color, alpha: 0.15 })
        .stroke({ color: entry.color, width: 1.2, alpha: 0.4 });
      cell.addChild(cellBg);

      const iconText = new Text({
        text: entry.icon,
        style: new TextStyle({ fontSize: fontSize(20, layout) }),
      });
      iconText.anchor.set(0.5);
      iconText.x = cellSize / 2;
      iconText.y = cellSize * 0.38;
      cell.addChild(iconText);

      const labelText = new Text({
        text: entry.label,
        style: new TextStyle({
          fontFamily: 'sans-serif',
          fontSize: fontSize(8, layout),
          fill: UI_COLORS.textPrimary,
          fontWeight: 'bold',
        }),
      });
      labelText.anchor.set(0.5, 0);
      labelText.x = cellSize / 2;
      labelText.y = cellSize * 0.62;
      cell.addChild(labelText);

      cell.x = cx;
      cell.y = cy;
      cell.eventMode = 'static';
      cell.cursor = 'pointer';
      cell.on('pointerdown', () => {
        cell.alpha = 0.6;
        closeMenu();
        entry.action();
      });
      cell.on('pointerup', () => { cell.alpha = 1; });
      cell.on('pointerupoutside', () => { cell.alpha = 1; });

      overlay.addChild(cell);
    }

    // Close button (X)
    const closeBtn = new Container();
    const closeBg = new Graphics();
    closeBg.circle(0, 0, scaled(14, layout))
      .fill({ color: UI_COLORS.btnDanger, alpha: 0.8 })
      .stroke({ color: 0xcc4444, width: 1.2, alpha: 0.6 });
    closeBtn.addChild(closeBg);
    const closeX = new Text({
      text: '✕',
      style: new TextStyle({ fontSize: fontSize(12, layout), fill: UI_COLORS.textPrimary, fontWeight: 'bold' }),
    });
    closeX.anchor.set(0.5);
    closeBtn.addChild(closeX);
    closeBtn.x = panelX + panelW - scaled(8, layout);
    closeBtn.y = panelY + scaled(8, layout);
    closeBtn.eventMode = 'static';
    closeBtn.cursor = 'pointer';
    closeBtn.on('pointerdown', closeMenu);
    overlay.addChild(closeBtn);

    root.addChild(overlay);
  }

  function closeMenu(): void {
    if (overlay) {
      root.removeChild(overlay);
      overlay.destroy({ children: true });
      overlay = null;
    }
  }

  uiContainer.addChild(root);
  return { container: root, close: closeMenu };
}
