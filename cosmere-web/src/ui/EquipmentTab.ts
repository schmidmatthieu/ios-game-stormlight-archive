// ─── Equipment Tab (Inventory Panel) ────────────────────────────

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { GameManager } from '../game/GameManager';
import { gameData } from '../data/DataLoader';
import { RARITY_COLORS } from '../data/types';
import type { EquipmentSlot } from '../data/types';

const SLOT_LABELS: Record<string, string> = {
  helmet: 'Casque', shoulders: 'Épaulières', chest: 'Torse', cape: 'Cape',
  gloves: 'Gants', belt: 'Ceinture', legs: 'Jambières', boots: 'Bottes',
  mainWeapon: 'Arme', offhand: 'Main gauche', amulet: 'Amulette',
  ring1: 'Anneau 1', ring2: 'Anneau 2',
};

export { SLOT_LABELS };

const EQUIPMENT_SLOTS: EquipmentSlot[] = [
  'helmet', 'shoulders', 'chest', 'cape', 'mainWeapon',
  'offhand', 'gloves', 'belt', 'legs', 'boots', 'amulet', 'ring1', 'ring2',
];

export function renderEquipment(
  contentContainer: Container,
  cx: number, cy: number, cw: number, ch: number,
  onRefresh: () => void,
): void {
  const champ = GameManager.shared.champion;
  if (!champ) return;
  const eq = champ.equipment as unknown as Record<string, string | null>;

  let y = cy;
  for (const slot of EQUIPMENT_SLOTS) {
    if (y > cy + ch - 20) break;
    const itemID = eq[slot];
    const item = itemID ? gameData.item(itemID) : null;

    const row = new Graphics();
    row.roundRect(cx + 8, y, cw - 16, 22, 4)
      .fill({ color: 0x1a1528, alpha: 0.6 })
      .stroke({ color: 0x332244, width: 0.5, alpha: 0.4 });
    row.eventMode = 'static';
    row.cursor = 'pointer';

    if (item) {
      row.on('pointerdown', () => {
        GameManager.shared.unequipItem(slot);
        onRefresh();
      });
    }

    contentContainer.addChild(row);

    const slotLabel = new Text({
      text: SLOT_LABELS[slot] ?? slot,
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 8, fill: 0x888888 }),
    });
    slotLabel.x = cx + 14;
    slotLabel.y = y + 4;
    contentContainer.addChild(slotLabel);

    if (item) {
      const rarityColor = RARITY_COLORS[item.rarity] ?? 0xaaaaaa;
      const itemLabel = new Text({
        text: item.name,
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 8, fill: rarityColor, fontWeight: 'bold' }),
      });
      itemLabel.anchor.set(1, 0);
      itemLabel.x = cx + cw - 14;
      itemLabel.y = y + 4;
      contentContainer.addChild(itemLabel);

      if (item.statBonuses.length > 0) {
        const statsStr = item.statBonuses.map(b => `+${b.value} ${b.stat}`).join(' ');
        const statsLabel = new Text({
          text: statsStr,
          style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 7, fill: 0x66cc44 }),
        });
        statsLabel.anchor.set(1, 0);
        statsLabel.x = cx + cw - 14;
        statsLabel.y = y + 13;
        contentContainer.addChild(statsLabel);
      }
    } else {
      const emptyLabel = new Text({
        text: '- vide -',
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 8, fill: 0x555555 }),
      });
      emptyLabel.anchor.set(1, 0);
      emptyLabel.x = cx + cw - 14;
      emptyLabel.y = y + 4;
      contentContainer.addChild(emptyLabel);
    }

    y += 24;
  }
}
