// ─── Zone Toolbar — top button bar for all game panels ──────────────

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { MusicManager } from '../game/MusicSystem';
import { toolbarY, toolbarButtonSize, scaled, touchTarget, fontSize, UI_COLORS, UI_ALPHA } from '../ui/ResponsiveLayout';
import type { LayoutInfo } from '../ui/ResponsiveLayout';

export interface ToolbarCallbacks {
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
}

function createToolbarButton(
  parent: Container,
  x: number,
  layout: LayoutInfo,
  drawIcon: (g: Graphics, w: number, h: number, layout: LayoutInfo) => void,
  onClick: () => void,
): void {
  const btnW = touchTarget(36, layout);
  const btnH = touchTarget(28, layout);
  const btn = new Container();
  const bg = new Graphics();
  bg.roundRect(0, 0, btnW, btnH, scaled(7, layout))
    .fill({ color: UI_COLORS.btnSecondary, alpha: 0.8 })
    .stroke({ color: UI_COLORS.borderSubtle, width: 1.2, alpha: UI_ALPHA.panelBorder });
  btn.addChild(bg);

  const icon = new Graphics();
  drawIcon(icon, btnW, btnH, layout);
  btn.addChild(icon);

  btn.x = x;
  btn.y = toolbarY(layout);
  btn.eventMode = 'static';
  btn.cursor = 'pointer';
  btn.on('pointerdown', () => { btn.alpha = 0.7; onClick(); });
  btn.on('pointerup', () => { btn.alpha = 1; });
  btn.on('pointerupoutside', () => { btn.alpha = 1; });
  parent.addChild(btn);
}

export function createZoneToolbar(
  uiContainer: Container,
  screenWidth: number,
  layout: LayoutInfo,
  cb: ToolbarCallbacks,
): void {
  const cx = screenWidth / 2;

  // Quest Journal (leftmost)
  createToolbarButton(uiContainer, cx - scaled(144, layout), layout,
    (g, w, h, l) => {
      g.roundRect(scaled(10, l), scaled(7, l), scaled(16, l), scaled(15, l), scaled(2, l)).fill({ color: 0x886633, alpha: 0.7 });
      g.rect(scaled(17, l), scaled(7, l), scaled(2, l), scaled(15, l)).fill({ color: 0x664422, alpha: 0.8 });
      g.rect(scaled(12, l), scaled(10, l), scaled(4, l), scaled(1, l)).fill({ color: 0xccaa66, alpha: 0.5 });
      g.rect(scaled(12, l), scaled(14, l), scaled(4, l), scaled(1, l)).fill({ color: 0xccaa66, alpha: 0.5 });
      g.rect(scaled(12, l), scaled(18, l), scaled(4, l), scaled(1, l)).fill({ color: 0xccaa66, alpha: 0.5 });
    }, cb.toggleQuestJournal);

  // Companion
  createToolbarButton(uiContainer, cx - scaled(108, layout), layout,
    (g, w, h) => {
      g.circle(w * 0.5, h * 0.5, w * 0.17).fill({ color: 0x88ccff, alpha: 0.5 });
      g.circle(w * 0.5, h * 0.5, w * 0.11).fill({ color: 0xaaddff, alpha: 0.7 });
      g.circle(w * 0.47, h * 0.47, w * 0.06).fill({ color: 0xffffff, alpha: 0.4 });
    }, cb.toggleCompanion);

  // Talent Tree (new!)
  createToolbarButton(uiContainer, cx - scaled(64, layout), layout,
    (g, w, h) => {
      // Star icon for talents
      g.circle(w * 0.5, h * 0.42, w * 0.14).fill({ color: 0xcc88ff, alpha: 0.6 });
      g.circle(w * 0.5, h * 0.42, w * 0.08).fill({ color: 0xeeccff, alpha: 0.8 });
      g.rect(w * 0.47, h * 0.56, w * 0.06, h * 0.2).fill({ color: 0xaa77dd, alpha: 0.5 });
      g.circle(w * 0.35, h * 0.65, w * 0.06).fill({ color: 0x9966cc, alpha: 0.4 });
      g.circle(w * 0.65, h * 0.65, w * 0.06).fill({ color: 0x9966cc, alpha: 0.4 });
    }, cb.toggleTalentTree);

  // Skill Tree
  createToolbarButton(uiContainer, cx - scaled(20, layout), layout,
    (g, w, h) => {
      g.rect(w * 0.47, h * 0.3, w * 0.06, h * 0.5).fill({ color: 0x5588cc, alpha: 0.7 });
      g.circle(w * 0.5, h * 0.3, w * 0.1).fill({ color: 0x5588cc, alpha: 0.6 });
      g.circle(w * 0.33, h * 0.55, w * 0.08).fill({ color: 0x4477aa, alpha: 0.5 });
      g.circle(w * 0.67, h * 0.55, w * 0.08).fill({ color: 0x4477aa, alpha: 0.5 });
      g.moveTo(w * 0.5, h * 0.45).lineTo(w * 0.33, h * 0.55).stroke({ color: 0x5588cc, width: 1, alpha: 0.5 });
      g.moveTo(w * 0.5, h * 0.45).lineTo(w * 0.67, h * 0.55).stroke({ color: 0x5588cc, width: 1, alpha: 0.5 });
    }, cb.toggleSkillTree);

  // Pause (center)
  createToolbarButton(uiContainer, cx + scaled(24, layout), layout,
    (g, w, h) => {
      g.rect(w * 0.3, h * 0.2, w * 0.1, h * 0.6).fill({ color: UI_COLORS.textPrimary, alpha: 0.85 });
      g.rect(w * 0.55, h * 0.2, w * 0.1, h * 0.6).fill({ color: UI_COLORS.textPrimary, alpha: 0.85 });
    }, cb.togglePause);

  // Inventory
  createToolbarButton(uiContainer, cx + scaled(68, layout), layout,
    (g, w, h, l) => {
      const ix = w * 0.28, iy = h * 0.3, iw = w * 0.44, ih = h * 0.5;
      g.roundRect(ix, iy, iw, ih, scaled(3, l)).fill({ color: 0xaa8855, alpha: 0.7 });
      g.roundRect(ix, iy, iw, ih, scaled(3, l)).stroke({ color: 0xccaa66, width: 1, alpha: 0.5 });
      g.arc(w * 0.5, iy, iw * 0.3, Math.PI, 0).stroke({ color: 0xccaa66, width: 1.5, alpha: 0.6 });
    }, cb.toggleInventory);

  // Crafting
  createToolbarButton(uiContainer, cx + scaled(112, layout), layout,
    (g, w, h) => {
      g.poly([{ x: w * 0.33, y: h * 0.7 }, { x: w * 0.5, y: h * 0.35 }, { x: w * 0.67, y: h * 0.7 }]).fill({ color: 0x888899, alpha: 0.7 });
      g.rect(w * 0.28, h * 0.7, w * 0.44, h * 0.1).fill({ color: 0x666677, alpha: 0.8 });
      g.rect(w * 0.44, h * 0.2, w * 0.1, h * 0.2).fill({ color: 0xaa8844, alpha: 0.7 });
    }, cb.toggleCrafting);

  // Bestiary
  createToolbarButton(uiContainer, cx + scaled(156, layout), layout,
    (g, w, h, l) => {
      g.roundRect(w * 0.28, h * 0.22, w * 0.44, h * 0.56, scaled(2, l)).fill({ color: 0x557744, alpha: 0.7 });
      g.rect(w * 0.33, h * 0.32, w * 0.33, h * 0.04).fill({ color: UI_COLORS.textPrimary, alpha: 0.6 });
      g.rect(w * 0.33, h * 0.42, w * 0.28, h * 0.04).fill({ color: UI_COLORS.textPrimary, alpha: 0.5 });
      g.rect(w * 0.33, h * 0.52, w * 0.3, h * 0.04).fill({ color: UI_COLORS.textPrimary, alpha: 0.4 });
      g.rect(w * 0.28, h * 0.22, w * 0.06, h * 0.56).fill({ color: 0x445533, alpha: 0.8 });
    }, cb.toggleBestiary);

  // Professions
  if (cb.toggleProfessions) {
    createToolbarButton(uiContainer, cx + scaled(200, layout), layout,
      (g, w, h) => {
        // Pickaxe icon for professions
        g.poly([{ x: w * 0.35, y: h * 0.65 }, { x: w * 0.6, y: h * 0.3 }])
          .stroke({ color: 0xaa8855, width: 2, alpha: 0.8 });
        g.poly([{ x: w * 0.55, y: h * 0.25 }, { x: w * 0.7, y: h * 0.2 }, { x: w * 0.65, y: h * 0.4 }])
          .fill({ color: 0x888899, alpha: 0.7 });
      }, cb.toggleProfessions);
  }

  // Achievements (rightmost)
  createToolbarButton(uiContainer, cx + scaled(244, layout), layout,
    (g, w, h) => {
      g.moveTo(w * 0.36, h * 0.25).lineTo(w * 0.64, h * 0.25).lineTo(w * 0.6, h * 0.55).lineTo(w * 0.4, h * 0.55).closePath().fill({ color: UI_COLORS.textGold, alpha: 0.7 });
      g.rect(w * 0.44, h * 0.55, w * 0.12, h * 0.12).fill({ color: 0xccaa44, alpha: 0.7 });
      g.rect(w * 0.38, h * 0.67, w * 0.24, h * 0.08).fill({ color: 0xccaa44, alpha: 0.6 });
    }, cb.toggleAchievements);
}
