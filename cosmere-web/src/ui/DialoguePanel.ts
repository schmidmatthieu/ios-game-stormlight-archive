// ─── Dialogue Panel — Barrel Re-exports ─────────────────────────
// This file re-exports from the split modules so existing imports
// like `import { showDialoguePanel, showShopPanel } from './DialoguePanel'`
// continue to work without changes.

export { showDialoguePanel } from './DialogueRenderer';
export type { DialogueChoice, DialogueNode, DialogueTree } from './DialogueData';
export { WORLD_DIALOGUES } from './DialogueData';

// Re-export showShopPanel — kept here for backward compatibility.
// The canonical implementation lives in this file below.

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { GameManager } from '../game/GameManager';
import { getLayoutInfo, fontSize, scaled, panelRadius, buttonHeight, UI_COLORS, UI_ALPHA } from '../ui/ResponsiveLayout';

export function showShopPanel(
  uiContainer: Container,
  screenW: number, screenH: number,
  onClose: () => void,
  showFloatingText: (x: number, y: number, msg: string, color: number) => void,
  playerPos: { x: number; y: number },
): Container {
  const champ = GameManager.shared.champion;
  if (!champ) return new Container();

  const layout = getLayoutInfo(screenW, screenH);
  const panel = new Container();
  panel.zIndex = 10000;

  const overlay = new Graphics();
  overlay.rect(0, 0, screenW, screenH).fill({ color: 0x000000, alpha: UI_ALPHA.overlay });
  overlay.eventMode = 'static';
  panel.addChild(overlay);

  const radius = panelRadius(layout);
  const panelW = Math.min(scaled(320, layout), screenW - 40);
  const itemH = scaled(38, layout);
  const panelH = scaled(70, layout) + 5 * itemH + buttonHeight(layout) + scaled(20, layout);
  const px = (screenW - panelW) / 2;
  const py = (screenH - panelH) / 2;

  const bg = new Graphics();
  bg.roundRect(px, py, panelW, panelH, radius + 2)
    .fill({ color: UI_COLORS.panelBgAlt, alpha: 0.96 })
    .stroke({ color: 0x886633, width: 2, alpha: 0.8 });
  bg.eventMode = 'static';
  panel.addChild(bg);

  const title = new Text({
    text: 'BOUTIQUE',
    style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: fontSize(18, layout), fill: UI_COLORS.textGold, fontWeight: 'bold' }),
  });
  title.anchor.set(0.5);
  title.x = screenW / 2;
  title.y = py + scaled(20, layout);
  panel.addChild(title);

  const goldLabel = new Text({
    text: `Or: ${champ.gold}`,
    style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(13, layout), fill: UI_COLORS.textGoldBright, fontWeight: 'bold' }),
  });
  goldLabel.anchor.set(0.5);
  goldLabel.x = screenW / 2;
  goldLabel.y = py + scaled(42, layout);
  panel.addChild(goldLabel);

  const shopItems = [
    { name: 'Potion de soin', cost: 20, effect: 'hp', value: 50 },
    { name: 'Potion d\'investiture', cost: 25, effect: 'inv', value: 40 },
    { name: '\u00C9lixir de force', cost: 40, effect: 'str', value: 2 },
    { name: '\u00C9lixir d\'agilit\u00E9', cost: 40, effect: 'agi', value: 2 },
    { name: '\u00C9lixir d\'esprit', cost: 45, effect: 'spi', value: 2 },
  ];

  shopItems.forEach((item, i) => {
    const itemY = py + scaled(62, layout) + i * itemH;
    const itemBg = new Graphics();
    itemBg.roundRect(px + 12, itemY, panelW - 24, itemH - scaled(4, layout), 6)
      .fill({ color: UI_COLORS.btnSecondary, alpha: 0.8 })
      .stroke({ color: 0x443322, width: 1, alpha: UI_ALPHA.panelBorder });
    itemBg.eventMode = 'static';
    itemBg.cursor = 'pointer';
    panel.addChild(itemBg);

    const itemName = new Text({
      text: item.name,
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(11, layout), fill: UI_COLORS.textPrimary }),
    });
    itemName.x = px + 20;
    itemName.y = itemY + scaled(4, layout);
    panel.addChild(itemName);

    const canBuy = champ.gold >= item.cost;
    const costText = new Text({
      text: `${item.cost} or`,
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(11, layout), fill: canBuy ? UI_COLORS.textGoldBright : 0x884444, fontWeight: 'bold' }),
    });
    costText.anchor.set(1, 0);
    costText.x = px + panelW - 20;
    costText.y = itemY + scaled(4, layout);
    panel.addChild(costText);

    const buyLabel = new Text({
      text: canBuy ? 'Acheter' : 'Pas assez d\'or',
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(9, layout), fill: canBuy ? UI_COLORS.success : UI_COLORS.textMuted }),
    });
    buyLabel.x = px + 20;
    buyLabel.y = itemY + scaled(19, layout);
    panel.addChild(buyLabel);

    if (canBuy) {
      itemBg.on('pointerdown', () => {
        itemBg.alpha = 0.7;
        champ.gold -= item.cost;
        switch (item.effect) {
          case 'hp': champ.currentHP = Math.min(GameManager.shared.maxHP, champ.currentHP + item.value); break;
          case 'inv': champ.currentInvestiture = Math.min(GameManager.shared.maxInvestiture, champ.currentInvestiture + item.value); break;
          case 'str': champ.baseStats.strength += item.value; break;
          case 'agi': champ.baseStats.agility += item.value; break;
          case 'spi': champ.baseStats.spirit += item.value; break;
        }
        onClose();
        showFloatingText(playerPos.x, playerPos.y - 40, `${item.name} achet\u00E9!`, UI_COLORS.success);
      });
    }
  });

  const closeBtnW = scaled(90, layout);
  const closeBtnH = buttonHeight(layout);
  const closeBg = new Graphics();
  closeBg.roundRect(px + panelW / 2 - closeBtnW / 2, py + panelH - scaled(38, layout), closeBtnW, closeBtnH, 8)
    .fill({ color: 0x553322, alpha: UI_ALPHA.buttonBg })
    .stroke({ color: 0x886644, width: 1.5 });
  closeBg.eventMode = 'static';
  closeBg.cursor = 'pointer';
  closeBg.on('pointerdown', onClose);
  panel.addChild(closeBg);

  const closeLabel = new Text({
    text: 'Fermer',
    style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(12, layout), fill: UI_COLORS.textPrimary, fontWeight: 'bold' }),
  });
  closeLabel.anchor.set(0.5);
  closeLabel.x = px + panelW / 2;
  closeLabel.y = py + panelH - scaled(38, layout) + closeBtnH / 2;
  panel.addChild(closeLabel);

  overlay.on('pointerdown', onClose);
  uiContainer.addChild(panel);
  return panel;
}
