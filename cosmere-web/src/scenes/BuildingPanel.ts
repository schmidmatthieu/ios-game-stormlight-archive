// ─── Building Exploration Panel ──────────────────────────────

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { GameManager } from '../game/GameManager';
import type { EnterableBuilding } from '../rendering/MapStructures';

export function showBuildingPanel(
  uiContainer: Container,
  screenW: number,
  screenH: number,
  building: EnterableBuilding,
  onClose: () => void,
): Container {
  const champ = GameManager.shared.champion;
  const goldReward = 5 + Math.floor(Math.random() * 15);
  const xpReward = 10 + Math.floor(Math.random() * 20);

  if (champ) {
    champ.gold += goldReward;
    GameManager.shared.grantXP(xpReward);
  }

  const panel = new Container();
  panel.zIndex = 10000;

  const overlay = new Graphics();
  overlay.rect(0, 0, screenW, screenH).fill({ color: 0x000000, alpha: 0.5 });
  overlay.eventMode = 'static';
  panel.addChild(overlay);

  const panelH = 120;
  const panelY = screenH - panelH - 20;
  const bg = new Graphics();
  bg.roundRect(20, panelY, screenW - 40, panelH, 12)
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
    style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 10, fill: 0xccccbb, wordWrap: true, wordWrapWidth: screenW - 80 }),
  });
  desc.x = 36; desc.y = panelY + 30;
  panel.addChild(desc);

  const reward = new Text({
    text: `+${xpReward} XP  +${goldReward} or`,
    style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 10, fill: 0x66cc44, fontWeight: 'bold' }),
  });
  reward.anchor.set(1, 0);
  reward.x = screenW - 36; reward.y = panelY + 10;
  panel.addChild(reward);

  const closeHint = new Text({
    text: 'Toucher pour fermer',
    style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 9, fill: 0x888888 }),
  });
  closeHint.anchor.set(0.5);
  closeHint.x = screenW / 2; closeHint.y = panelY + panelH - 14;
  panel.addChild(closeHint);

  const close = () => {
    panel.destroy({ children: true });
    onClose();
  };
  overlay.on('pointerdown', close);
  bg.on('pointerdown', close);

  uiContainer.addChild(panel);
  return panel;
}
