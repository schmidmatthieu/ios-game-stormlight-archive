import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { GameManager } from '../game/GameManager';
import { BestiaryManager } from '../game/BestiarySystem';
import { AchievementManager } from '../game/AchievementSystem';
import { CompanionManager } from '../game/CompanionSystem';
import { NPCRelationshipManager } from '../game/NPCRelationships';
import { getLayoutInfo, fontSize, scaled, panelRadius, buttonHeight, UI_COLORS, UI_ALPHA } from '../ui/ResponsiveLayout';
import type { LayoutInfo } from '../ui/ResponsiveLayout';

export function showPauseMenu(
  uiContainer: Container,
  screenW: number, screenH: number,
  onResume: () => void,
  showFloatingText: (x: number, y: number, msg: string, color: number) => void,
  playerPos: { x: number; y: number },
  onWorldMap?: () => void,
): Container {
  const layout = getLayoutInfo(screenW, screenH);
  const menu = new Container();
  menu.zIndex = 10000;

  const overlay = new Graphics();
  overlay.rect(0, 0, screenW, screenH).fill({ color: 0x000000, alpha: UI_ALPHA.overlay });
  overlay.eventMode = 'static';
  menu.addChild(overlay);

  const radius = panelRadius(layout);
  const panelW = Math.min(scaled(220, layout), screenW - 40);
  const btnH = buttonHeight(layout);
  const btnSpacing = btnH + scaled(12, layout);
  const buttonCount = onWorldMap ? 4 : 3;
  const panelH = scaled(60, layout) + buttonCount * btnSpacing;
  const px = (screenW - panelW) / 2;
  const py = (screenH - panelH) / 2;

  const panel = new Graphics();
  panel.roundRect(px, py, panelW, panelH, radius + 2)
    .fill({ color: UI_COLORS.panelBgAlt, alpha: 0.96 })
    .stroke({ color: UI_COLORS.borderAccent, width: 2, alpha: 0.7 });
  panel.eventMode = 'static';
  menu.addChild(panel);

  const title = new Text({
    text: 'PAUSE',
    style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: fontSize(22, layout), fill: UI_COLORS.textGold, fontWeight: 'bold' }),
  });
  title.anchor.set(0.5);
  title.x = screenW / 2;
  title.y = py + scaled(26, layout);
  menu.addChild(title);

  const buttons: { label: string; y: number; color?: number; action: () => void }[] = [
    {
      label: 'Reprendre', y: py + scaled(60, layout),
      action: onResume,
    },
    {
      label: 'Sauvegarder', y: py + scaled(60, layout) + btnSpacing,
      action: () => {
        GameManager.shared.save();
        BestiaryManager.shared.save();
        AchievementManager.shared.save();
        CompanionManager.shared.save();
        NPCRelationshipManager.shared.save();
        showFloatingText(playerPos.x, playerPos.y - 40, 'Partie sauvegard\u00E9e!', UI_COLORS.success);
        onResume();
      },
    },
  ];

  if (onWorldMap) {
    buttons.push({
      label: 'Carte du Cosmere', y: py + scaled(60, layout) + btnSpacing * 2, color: 0x1a2840,
      action: onWorldMap,
    });
  }

  buttons.push({
    label: 'Quitter', y: py + scaled(60, layout) + btnSpacing * (onWorldMap ? 3 : 2), color: UI_COLORS.btnDanger,
    action: () => {
      GameManager.shared.save();
      BestiaryManager.shared.save();
      AchievementManager.shared.save();
      CompanionManager.shared.save();
      NPCRelationshipManager.shared.save();
      window.location.reload();
    },
  });

  for (const b of buttons) {
    const btnBg = new Graphics();
    btnBg.roundRect(px + 20, b.y, panelW - 40, btnH, 8)
      .fill({ color: (b as { color?: number }).color ?? UI_COLORS.btnSecondary, alpha: UI_ALPHA.buttonBg })
      .stroke({ color: UI_COLORS.borderAccent, width: 1, alpha: UI_ALPHA.panelBorder });
    btnBg.eventMode = 'static';
    btnBg.cursor = 'pointer';

    // Touch feedback
    btnBg.on('pointerdown', () => {
      btnBg.alpha = 0.7;
      b.action();
    });
    btnBg.on('pointerup', () => { btnBg.alpha = 1; });
    btnBg.on('pointerupoutside', () => { btnBg.alpha = 1; });
    menu.addChild(btnBg);

    const btnLabel = new Text({
      text: b.label,
      style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: fontSize(14, layout), fill: UI_COLORS.textPrimary }),
    });
    btnLabel.anchor.set(0.5);
    btnLabel.x = screenW / 2;
    btnLabel.y = b.y + btnH / 2;
    menu.addChild(btnLabel);
  }

  uiContainer.addChild(menu);
  return menu;
}
