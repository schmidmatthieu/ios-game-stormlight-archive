import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { GameManager } from '../game/GameManager';
import { gameData } from '../data/DataLoader';
import type { Item, EquipmentSlot } from '../data/types';
import { RARITY_COLORS } from '../data/types';
import { getLayoutInfo, fontSize, scaled, panelSize } from '../ui/ResponsiveLayout';
import type { LayoutInfo } from '../ui/ResponsiveLayout';

const SLOT_LABELS: Record<string, string> = {
  helmet: 'Casque', shoulders: 'Épaulières', chest: 'Torse', cape: 'Cape',
  gloves: 'Gants', belt: 'Ceinture', legs: 'Jambières', boots: 'Bottes',
  mainWeapon: 'Arme', offhand: 'Main gauche', amulet: 'Amulette',
  ring1: 'Anneau 1', ring2: 'Anneau 2',
};

const EQUIPMENT_SLOTS: EquipmentSlot[] = [
  'helmet', 'shoulders', 'chest', 'cape', 'mainWeapon',
  'offhand', 'gloves', 'belt', 'legs', 'boots', 'amulet', 'ring1', 'ring2',
];

export class InventoryPanel extends Container {
  private onClose: () => void;
  private contentContainer: Container;
  private scrollY = 0;
  private screenW: number;
  private screenH: number;
  private currentTab: 'equipment' | 'inventory' | 'skills' = 'equipment';

  constructor(screenW: number, screenH: number, onClose: () => void) {
    super();
    this.screenW = screenW;
    this.screenH = screenH;
    this.onClose = onClose;
    this.zIndex = 10000;

    const layout = getLayoutInfo(screenW, screenH);

    // Overlay
    const overlay = new Graphics();
    overlay.rect(0, 0, screenW, screenH).fill({ color: 0x000000, alpha: 0.6 });
    overlay.eventMode = 'static';
    this.addChild(overlay);

    // Main panel
    const ps = panelSize(layout);
    const panelW = ps.width;
    const panelH = ps.height;
    const px = (screenW - panelW) / 2;
    const py = (screenH - panelH) / 2;

    const panel = new Graphics();
    panel.roundRect(px, py, panelW, panelH, 12)
      .fill({ color: 0x0a0815, alpha: 0.95 })
      .stroke({ color: 0x554433, width: 2, alpha: 0.7 });
    panel.eventMode = 'static';
    this.addChild(panel);

    // Title
    const title = new Text({
      text: 'INVENTAIRE',
      style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: fontSize(16, layout), fill: 0xe6cc66, fontWeight: 'bold' }),
    });
    title.anchor.set(0.5);
    title.x = screenW / 2;
    title.y = py + scaled(18, layout);
    this.addChild(title);

    // Tabs
    const tabs: Array<{ label: string; tab: 'equipment' | 'inventory' | 'skills' }> = [
      { label: 'Équipement', tab: 'equipment' },
      { label: 'Objets', tab: 'inventory' },
      { label: 'Compétences', tab: 'skills' },
    ];
    const tabWidth = (panelW - 20) / 3;
    const tabH = scaled(22, layout);
    tabs.forEach((t, i) => {
      const tx = px + 10 + i * tabWidth;
      const ty = py + scaled(36, layout);
      const bg = new Graphics();
      bg.roundRect(tx, ty, tabWidth - 4, tabH, 4)
        .fill({ color: this.currentTab === t.tab ? 0x332244 : 0x1a1528, alpha: 0.8 })
        .stroke({ color: 0x443355, width: 1, alpha: 0.4 });
      bg.eventMode = 'static';
      bg.cursor = 'pointer';
      bg.on('pointerdown', () => {
        this.currentTab = t.tab;
        this.refreshContent(px, py + scaled(64, layout), panelW, panelH - scaled(100, layout));
      });
      this.addChild(bg);

      const label = new Text({
        text: t.label,
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(9, layout), fill: this.currentTab === t.tab ? 0xeeddcc : 0x888888 }),
      });
      label.anchor.set(0.5);
      label.x = tx + (tabWidth - 4) / 2;
      label.y = ty + tabH / 2;
      this.addChild(label);
    });

    // Content area
    this.contentContainer = new Container();
    this.addChild(this.contentContainer);
    this.refreshContent(px, py + scaled(64, layout), panelW, panelH - scaled(100, layout));

    // Close button
    const closeBtnW = scaled(80, layout);
    const closeBtnH = scaled(24, layout);
    const closeBg = new Graphics();
    closeBg.roundRect(px + panelW / 2 - closeBtnW / 2, py + panelH - scaled(32, layout), closeBtnW, closeBtnH, 6)
      .fill({ color: 0x553322, alpha: 0.8 })
      .stroke({ color: 0x886644, width: 1 });
    closeBg.eventMode = 'static';
    closeBg.cursor = 'pointer';
    closeBg.on('pointerdown', () => this.onClose());
    this.addChild(closeBg);

    const closeLabel = new Text({
      text: 'Fermer',
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(11, layout), fill: 0xeeddcc }),
    });
    closeLabel.anchor.set(0.5);
    closeLabel.x = px + panelW / 2;
    closeLabel.y = py + panelH - scaled(20, layout);
    this.addChild(closeLabel);
  }

  private refreshContent(cx: number, cy: number, cw: number, ch: number): void {
    this.contentContainer.removeChildren();

    switch (this.currentTab) {
      case 'equipment': this.renderEquipment(cx, cy, cw, ch); break;
      case 'inventory': this.renderInventory(cx, cy, cw, ch); break;
      case 'skills': this.renderSkills(cx, cy, cw, ch); break;
    }
  }

  private renderEquipment(cx: number, cy: number, cw: number, ch: number): void {
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
          this.refreshContent(cx, cy, cw, ch);
        });
      }

      this.contentContainer.addChild(row);

      // Slot label
      const slotLabel = new Text({
        text: SLOT_LABELS[slot] ?? slot,
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 8, fill: 0x888888 }),
      });
      slotLabel.x = cx + 14;
      slotLabel.y = y + 4;
      this.contentContainer.addChild(slotLabel);

      // Item name or empty
      if (item) {
        const rarityColor = RARITY_COLORS[item.rarity] ?? 0xaaaaaa;
        const itemLabel = new Text({
          text: item.name,
          style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 8, fill: rarityColor, fontWeight: 'bold' }),
        });
        itemLabel.anchor.set(1, 0);
        itemLabel.x = cx + cw - 14;
        itemLabel.y = y + 4;
        this.contentContainer.addChild(itemLabel);

        // Stats
        if (item.statBonuses.length > 0) {
          const statsStr = item.statBonuses.map(b => `+${b.value} ${b.stat}`).join(' ');
          const statsLabel = new Text({
            text: statsStr,
            style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 7, fill: 0x66cc44 }),
          });
          statsLabel.anchor.set(1, 0);
          statsLabel.x = cx + cw - 14;
          statsLabel.y = y + 13;
          this.contentContainer.addChild(statsLabel);
        }
      } else {
        const emptyLabel = new Text({
          text: '- vide -',
          style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 8, fill: 0x555555 }),
        });
        emptyLabel.anchor.set(1, 0);
        emptyLabel.x = cx + cw - 14;
        emptyLabel.y = y + 4;
        this.contentContainer.addChild(emptyLabel);
      }

      y += 24;
    }
  }

  private renderInventory(cx: number, cy: number, cw: number, ch: number): void {
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
      this.contentContainer.addChild(empty);
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
        this.refreshContent(cx, cy, cw, ch);
      });
      this.contentContainer.addChild(row);

      // Item name
      const nameLabel = new Text({
        text: item.name,
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 9, fill: rarityColor, fontWeight: 'bold' }),
      });
      nameLabel.x = cx + 14;
      nameLabel.y = y + 3;
      this.contentContainer.addChild(nameLabel);

      // Slot + stats
      const slotName = SLOT_LABELS[item.slot] ?? item.slot;
      const statsStr = item.statBonuses.map(b => `+${b.value} ${b.stat}`).join(' ');
      const detailLabel = new Text({
        text: `${slotName} | ${statsStr}`,
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 7, fill: 0x888888 }),
      });
      detailLabel.x = cx + 14;
      detailLabel.y = y + 15;
      this.contentContainer.addChild(detailLabel);

      // Equip hint
      const equipHint = new Text({
        text: 'Équiper',
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 8, fill: 0x66cc44 }),
      });
      equipHint.anchor.set(1, 0);
      equipHint.x = cx + cw - 14;
      equipHint.y = y + 8;
      this.contentContainer.addChild(equipHint);

      y += 30;
    }
  }

  private renderSkills(cx: number, cy: number, cw: number, ch: number): void {
    const champ = GameManager.shared.champion;
    if (!champ) return;

    let y = cy;

    // Header
    const header = new Text({
      text: `Points de compétence: ${champ.skillPoints}`,
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 10, fill: 0xe6cc66, fontWeight: 'bold' }),
    });
    header.x = cx + 14;
    header.y = y;
    this.contentContainer.addChild(header);
    y += 18;

    // Equipped skills
    const equippedLabel = new Text({
      text: 'Compétences équipées:',
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 9, fill: 0xaaaacc }),
    });
    equippedLabel.x = cx + 14;
    equippedLabel.y = y;
    this.contentContainer.addChild(equippedLabel);
    y += 14;

    for (let i = 0; i < 4; i++) {
      if (y > cy + ch - 20) break;
      const skillID = champ.equippedSkillIDs[i];
      const skill = skillID ? gameData.skill(skillID) : null;

      const row = new Graphics();
      row.roundRect(cx + 8, y, cw - 16, 26, 4)
        .fill({ color: skill ? 0x1a2228 : 0x1a1528, alpha: 0.6 })
        .stroke({ color: 0x334455, width: 0.5, alpha: 0.4 });
      this.contentContainer.addChild(row);

      const slotNum = new Text({
        text: `[${i + 1}]`,
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 9, fill: 0x6688aa, fontWeight: 'bold' }),
      });
      slotNum.x = cx + 14;
      slotNum.y = y + 3;
      this.contentContainer.addChild(slotNum);

      if (skill) {
        const nameL = new Text({
          text: skill.name,
          style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 9, fill: 0xddddcc }),
        });
        nameL.x = cx + 36;
        nameL.y = y + 3;
        this.contentContainer.addChild(nameL);

        const detailL = new Text({
          text: `DMG: ${skill.baseDamage} | INV: ${skill.investitureCost} | CD: ${skill.cooldown}s`,
          style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 7, fill: 0x888888 }),
        });
        detailL.x = cx + 36;
        detailL.y = y + 15;
        this.contentContainer.addChild(detailL);
      } else {
        const emptyL = new Text({
          text: '- vide -',
          style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 9, fill: 0x555555 }),
        });
        emptyL.x = cx + 36;
        emptyL.y = y + 6;
        this.contentContainer.addChild(emptyL);
      }

      y += 28;
    }

    // Available skills
    y += 6;
    const availLabel = new Text({
      text: 'Compétences disponibles:',
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 9, fill: 0xaaaacc }),
    });
    availLabel.x = cx + 14;
    availLabel.y = y;
    this.contentContainer.addChild(availLabel);
    y += 14;

    for (const skillID of champ.unlockedSkillIDs) {
      if (y > cy + ch - 20) break;
      if (champ.equippedSkillIDs.includes(skillID)) continue;
      const skill = gameData.skill(skillID);
      if (!skill) continue;

      const row = new Graphics();
      row.roundRect(cx + 8, y, cw - 16, 22, 4)
        .fill({ color: 0x1a1528, alpha: 0.5 })
        .stroke({ color: 0x332244, width: 0.5, alpha: 0.3 });
      row.eventMode = 'static';
      row.cursor = 'pointer';
      row.on('pointerdown', () => {
        // Equip in first empty slot, or replace last
        const emptyIdx = champ.equippedSkillIDs.findIndex(id => !id);
        if (emptyIdx >= 0) {
          champ.equippedSkillIDs[emptyIdx] = skillID;
        } else if (champ.equippedSkillIDs.length < 4) {
          champ.equippedSkillIDs.push(skillID);
        } else {
          champ.equippedSkillIDs[3] = skillID;
        }
        this.refreshContent(cx, cy, cw, ch);
      });
      this.contentContainer.addChild(row);

      const nameL = new Text({
        text: `${skill.name} (Nv.${skill.requiredLevel})`,
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 8, fill: 0xddddcc }),
      });
      nameL.x = cx + 14;
      nameL.y = y + 4;
      this.contentContainer.addChild(nameL);

      const equipHint = new Text({
        text: 'Équiper',
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 8, fill: 0x66cc44 }),
      });
      equipHint.anchor.set(1, 0);
      equipHint.x = cx + cw - 14;
      equipHint.y = y + 4;
      this.contentContainer.addChild(equipHint);

      y += 24;
    }
  }
}
