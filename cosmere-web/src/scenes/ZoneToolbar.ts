// ─── Zone Toolbar — top button bar for all game panels ──────────────

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { toolbarY, scaled, touchTarget, fontSize, UI_COLORS, UI_ALPHA } from '../ui/ResponsiveLayout';
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

interface ToolbarEntry {
  icon: string;
  label: string;
  color: number;
  action: () => void;
}

function createToolbarButton(
  parent: Container,
  x: number,
  layout: LayoutInfo,
  entry: ToolbarEntry,
): void {
  const btnW = touchTarget(36, layout);
  const btnH = touchTarget(28, layout);
  const btn = new Container();

  // Background with subtle gradient feel
  const bg = new Graphics();
  bg.roundRect(0, 0, btnW, btnH, scaled(6, layout))
    .fill({ color: 0x1a1a2e, alpha: 0.85 })
    .stroke({ color: entry.color, width: 1, alpha: 0.45 });
  btn.addChild(bg);

  // Colored accent line at top
  const accent = new Graphics();
  accent.roundRect(scaled(4, layout), 1, btnW - scaled(8, layout), scaled(2, layout), 1)
    .fill({ color: entry.color, alpha: 0.6 });
  btn.addChild(accent);

  // Icon text (emoji/unicode)
  const iconText = new Text({
    text: entry.icon,
    style: new TextStyle({
      fontSize: fontSize(13, layout),
      fill: 0xffffff,
    }),
  });
  iconText.anchor.set(0.5);
  iconText.x = btnW / 2;
  iconText.y = btnH * 0.38;
  btn.addChild(iconText);

  // Small label below icon
  const labelText = new Text({
    text: entry.label,
    style: new TextStyle({
      fontFamily: 'sans-serif',
      fontSize: fontSize(6, layout),
      fill: entry.color,
      fontWeight: 'bold',
    }),
  });
  labelText.anchor.set(0.5);
  labelText.x = btnW / 2;
  labelText.y = btnH * 0.78;
  btn.addChild(labelText);

  btn.x = x;
  btn.y = toolbarY(layout);
  btn.eventMode = 'static';
  btn.cursor = 'pointer';

  btn.on('pointerdown', () => { btn.alpha = 0.7; entry.action(); });
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
  // On mobile, skip the full toolbar — MobileMenu handles it
  if (layout.device === 'mobile') return;

  const entries: ToolbarEntry[] = [
    { icon: '📜', label: 'QUÊTES', color: 0xccaa66, action: cb.toggleQuestJournal },
    { icon: '🤝', label: 'ALLIÉ', color: 0x88ccff, action: cb.toggleCompanion },
    { icon: '🌟', label: 'TALENTS', color: 0xcc88ff, action: cb.toggleTalentTree },
    { icon: '⚡', label: 'SKILLS', color: 0x5599dd, action: cb.toggleSkillTree },
    { icon: '⏸', label: 'PAUSE', color: 0xcccccc, action: cb.togglePause },
    { icon: '🎒', label: 'INVENT.', color: 0xcc9955, action: cb.toggleInventory },
    { icon: '⚒', label: 'CRAFT', color: 0x8888aa, action: cb.toggleCrafting },
    { icon: '📖', label: 'BESTIAIRE', color: 0x77aa66, action: cb.toggleBestiary },
  ];

  if (cb.toggleProfessions) {
    entries.push({ icon: '⛏', label: 'MÉTIERS', color: 0xaa8855, action: cb.toggleProfessions });
  }

  entries.push({ icon: '🏆', label: 'SUCCÈS', color: 0xddaa44, action: cb.toggleAchievements });

  // Uniform spacing: calculate total width and center
  const btnW = touchTarget(36, layout);
  const gap = scaled(8, layout);
  const totalW = entries.length * btnW + (entries.length - 1) * gap;
  const startX = (screenWidth - totalW) / 2;

  for (let i = 0; i < entries.length; i++) {
    const x = startX + i * (btnW + gap);
    createToolbarButton(uiContainer, x, layout, entries[i]);
  }
}
