// ─── Inventory Tab (Inventory Panel) ────────────────────────────

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { GameManager } from '../game/GameManager';
import { gameData } from '../data/DataLoader';
import { RARITY_COLORS } from '../data/types';
import { SLOT_LABELS } from './EquipmentTab';

export function renderInventory(
  contentContainer: Container,
  cx: number, cy: number, cw: number, ch: number,
  onRefresh: () => void,
): void {
  const champ = GameManager.shared.champion;
  if (!champ) return;

  if (champ.inventoryItemIDs.length === 0) {
    const empty = new Text({
      text: 'Aucun objet dans l\'inventaire.\nTuez des ennemis et ouvrez des coffres\npour obtenir du butin!',
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 10, fill: 0x777777, align: 'center', wordWrap: true, wordWrapWidth: cw - 30 }),
    });
    empty.anchor.set(0.5, 0);
    empty.x = cx + cw / 2;
    empty.y = cy + 20;
    contentContainer.addChild(empty);
    return;
  }

  let y = cy;
  for (const itemID of champ.inventoryItemIDs) {
    if (y > cy + ch - 20) break;
    const item = gameData.item(itemID);
    if (!item) continue;

    const rarityColor = RARITY_COLORS[item.rarity] ?? 0xaaaaaa;

    const row = new Graphics();
    row.roundRect(cx + 8, y, cw - 16, 28, 4)
      .fill({ color: 0x1a1528, alpha: 0.6 })
      .stroke({ color: rarityColor, width: 0.5, alpha: 0.3 });
    row.eventMode = 'static';
    row.cursor = 'pointer';
    row.on('pointerdown', () => {
      GameManager.shared.equipItem(itemID, item.slot);
      onRefresh();
    });
    contentContainer.addChild(row);

    const nameLabel = new Text({
      text: item.name,
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 9, fill: rarityColor, fontWeight: 'bold' }),
    });
    nameLabel.x = cx + 14;
    nameLabel.y = y + 3;
    contentContainer.addChild(nameLabel);

    const slotName = SLOT_LABELS[item.slot] ?? item.slot;
    const statsStr = item.statBonuses.map(b => `+${b.value} ${b.stat}`).join(' ');
    const detailLabel = new Text({
      text: `${slotName} | ${statsStr}`,
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 7, fill: 0x888888 }),
    });
    detailLabel.x = cx + 14;
    detailLabel.y = y + 15;
    contentContainer.addChild(detailLabel);

    const equipHint = new Text({
      text: 'Équiper',
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 8, fill: 0x66cc44 }),
    });
    equipHint.anchor.set(1, 0);
    equipHint.x = cx + cw - 14;
    equipHint.y = y + 8;
    contentContainer.addChild(equipHint);

    y += 30;
  }
}
