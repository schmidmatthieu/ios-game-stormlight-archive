import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { GameManager } from '../game/GameManager';
import { BestiaryManager } from '../game/BestiarySystem';
import { AchievementManager } from '../game/AchievementSystem';
import { CompanionManager } from '../game/CompanionSystem';
import { NPCRelationshipManager } from '../game/NPCRelationships';
import { getLayoutInfo, fontSize, scaled, panelSize } from '../ui/ResponsiveLayout';
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
  overlay.rect(0, 0, screenW, screenH).fill({ color: 0x000000, alpha: 0.6 });
  overlay.eventMode = 'static';
  menu.addChild(overlay);

  const panelW = Math.min(scaled(200, layout), screenW - 40);
  const btnH = scaled(34, layout);
  const btnSpacing = scaled(45, layout);
  const buttonCount = onWorldMap ? 4 : 3;
  const panelH = scaled(60, layout) + buttonCount * btnSpacing;
  const px = (screenW - panelW) / 2;
  const py = (screenH - panelH) / 2;

  const panel = new Graphics();
  panel.roundRect(px, py, panelW, panelH, 12)
    .fill({ color: 0x0a0815, alpha: 0.95 })
    .stroke({ color: 0x554433, width: 2, alpha: 0.7 });
  panel.eventMode = 'static';
  menu.addChild(panel);

  const title = new Text({
    text: 'PAUSE',
    style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: fontSize(20, layout), fill: 0xe6cc66, fontWeight: 'bold' }),
  });
  title.anchor.set(0.5);
  title.x = screenW / 2;
  title.y = py + scaled(24, layout);
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
        showFloatingText(playerPos.x, playerPos.y - 40, 'Partie sauvegardée!', 0x66cc44);
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
    label: 'Quitter', y: py + scaled(60, layout) + btnSpacing * (onWorldMap ? 3 : 2), color: 0x552222,
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
      .fill({ color: (b as { color?: number }).color ?? 0x1a1528, alpha: 0.8 })
      .stroke({ color: 0x554433, width: 1, alpha: 0.5 });
    btnBg.eventMode = 'static';
    btnBg.cursor = 'pointer';
    btnBg.on('pointerdown', b.action);
    menu.addChild(btnBg);

    const btnLabel = new Text({
      text: b.label,
      style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: fontSize(14, layout), fill: 0xeeddcc }),
    });
    btnLabel.anchor.set(0.5);
    btnLabel.x = screenW / 2;
    btnLabel.y = b.y + btnH / 2;
    menu.addChild(btnLabel);
  }

  uiContainer.addChild(menu);
  return menu;
}
