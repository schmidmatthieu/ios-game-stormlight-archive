import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { GameManager } from '../game/GameManager';
import { gameData } from '../data/DataLoader';
import type { Item, EquipmentSlot } from '../data/types';
import { RARITY_COLORS } from '../data/types';
import { getLayoutInfo, fontSize, scaled, panelSize, panelRadius, buttonHeight, UI_COLORS, UI_ALPHA } from '../ui/ResponsiveLayout';
import type { LayoutInfo } from '../ui/ResponsiveLayout';
import { MusicManager } from '../game/MusicSystem';

const SLOT_LABELS: Record<string, string> = {
  helmet: 'Casque', shoulders: '\u00C9pauli\u00E8res', chest: 'Torse', cape: 'Cape',
  gloves: 'Gants', belt: 'Ceinture', legs: 'Jambi\u00E8res', boots: 'Bottes',
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
  private scrollMask: Graphics;
  private scrollY = 0;
  private scrollVelocity = 0;
  private screenW: number;
  private screenH: number;
  private currentTab: 'equipment' | 'inventory' | 'skills' = 'equipment';
  private layout: LayoutInfo;
  private tabBgs: Graphics[] = [];
  private tabLabels: Text[] = [];
  private contentArea: { x: number; y: number; w: number; h: number } = { x: 0, y: 0, w: 0, h: 0 };

  constructor(screenW: number, screenH: number, onClose: () => void) {
    super();
    this.screenW = screenW;
    this.screenH = screenH;
    this.onClose = onClose;
    this.zIndex = 10000;
    this.layout = getLayoutInfo(screenW, screenH);

    const radius = panelRadius(this.layout);

    // Overlay — fade in
    const overlay = new Graphics();
    overlay.rect(0, 0, screenW, screenH).fill({ color: 0x000000, alpha: UI_ALPHA.overlay });
    overlay.eventMode = 'static';
    this.addChild(overlay);

    // Main panel
    const ps = panelSize(this.layout);
    const panelW = ps.width;
    const panelH = ps.height;
    const px = (screenW - panelW) / 2;
    const py = (screenH - panelH) / 2;

    const panel = new Graphics();
    panel.roundRect(px, py, panelW, panelH, radius + 2)
      .fill({ color: UI_COLORS.panelBgAlt, alpha: 0.96 })
      .stroke({ color: UI_COLORS.borderAccent, width: 2, alpha: 0.7 });
    panel.eventMode = 'static';
    this.addChild(panel);

    // Title
    const title = new Text({
      text: 'INVENTAIRE',
      style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: fontSize(18, this.layout), fill: UI_COLORS.textGold, fontWeight: 'bold' }),
    });
    title.anchor.set(0.5);
    title.x = screenW / 2;
    title.y = py + scaled(20, this.layout);
    this.addChild(title);

    // Tabs — improved with active state
    const tabs: Array<{ label: string; tab: 'equipment' | 'inventory' | 'skills' }> = [
      { label: '\u00C9quipement', tab: 'equipment' },
      { label: 'Objets', tab: 'inventory' },
      { label: 'Comp\u00E9tences', tab: 'skills' },
    ];
    const tabWidth = (panelW - 24) / 3;
    const tabH = scaled(26, this.layout);
    tabs.forEach((t, i) => {
      const tx = px + 12 + i * tabWidth;
      const ty = py + scaled(40, this.layout);
      const isActive = this.currentTab === t.tab;
      const bg = new Graphics();
      this.drawTab(bg, tx, ty, tabWidth - 6, tabH, isActive);
      bg.eventMode = 'static';
      bg.cursor = 'pointer';
      bg.on('pointerdown', () => {
        this.currentTab = t.tab;
        this.scrollY = 0;
        this.scrollVelocity = 0;
        this.updateTabs();
        this.refreshContent();
      });
      this.addChild(bg);
      this.tabBgs.push(bg);

      const label = new Text({
        text: t.label,
        style: new TextStyle({
          fontFamily: 'sans-serif',
          fontSize: fontSize(10, this.layout),
          fill: isActive ? UI_COLORS.textPrimary : UI_COLORS.textMuted,
          fontWeight: isActive ? 'bold' : 'normal',
        }),
      });
      label.anchor.set(0.5);
      label.x = tx + (tabWidth - 6) / 2;
      label.y = ty + tabH / 2;
      this.addChild(label);
      this.tabLabels.push(label);
    });

    // Content area with scroll support
    const contentY = py + scaled(72, this.layout);
    const contentH = panelH - scaled(112, this.layout);
    this.contentArea = { x: px, y: contentY, w: panelW, h: contentH };

    this.contentContainer = new Container();
    this.addChild(this.contentContainer);

    // Scroll mask
    this.scrollMask = new Graphics();
    this.scrollMask.rect(px, contentY, panelW, contentH).fill(0xffffff);
    this.addChild(this.scrollMask);
    this.contentContainer.mask = this.scrollMask;

    // Scroll handling with momentum
    let dragStartY = 0;
    let isDragging = false;
    let lastDragY = 0;

    this.contentContainer.eventMode = 'static';
    this.contentContainer.hitArea = { contains: (x: number, y: number) => {
      return x >= px && x <= px + panelW && y >= contentY && y <= contentY + contentH;
    }};

    this.contentContainer.on('pointerdown', (e) => {
      isDragging = true;
      dragStartY = e.globalY;
      lastDragY = e.globalY;
      this.scrollVelocity = 0;
    });
    this.contentContainer.on('globalpointermove', (e) => {
      if (!isDragging) return;
      const dy = e.globalY - lastDragY;
      this.scrollY += dy;
      lastDragY = e.globalY;
      this.scrollVelocity = dy;
      this.applyScroll();
    });
    const endDrag = () => { isDragging = false; };
    this.contentContainer.on('pointerup', endDrag);
    this.contentContainer.on('pointerupoutside', endDrag);

    this.refreshContent();

    // Close button — bigger, centered
    const closeBtnW = scaled(90, this.layout);
    const closeBtnH = buttonHeight(this.layout);
    const closeBg = new Graphics();
    closeBg.roundRect(px + panelW / 2 - closeBtnW / 2, py + panelH - scaled(38, this.layout), closeBtnW, closeBtnH, 8)
      .fill({ color: 0x553322, alpha: UI_ALPHA.buttonBg })
      .stroke({ color: 0x886644, width: 1.5 });
    closeBg.eventMode = 'static';
    closeBg.cursor = 'pointer';
    closeBg.on('pointerdown', () => this.onClose());
    this.addChild(closeBg);

    const closeLabel = new Text({
      text: 'Fermer',
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(12, this.layout), fill: UI_COLORS.textPrimary, fontWeight: 'bold' }),
    });
    closeLabel.anchor.set(0.5);
    closeLabel.x = px + panelW / 2;
    closeLabel.y = py + panelH - scaled(38, this.layout) + closeBtnH / 2;
    this.addChild(closeLabel);

    // Start momentum animation
    this.startMomentumScroll();
  }

  private drawTab(g: Graphics, x: number, y: number, w: number, h: number, active: boolean): void {
    g.clear();
    g.roundRect(x, y, w, h, 6)
      .fill({ color: active ? 0x332244 : UI_COLORS.btnSecondary, alpha: active ? 0.9 : 0.6 });
    if (active) {
      g.roundRect(x, y + h - 3, w, 3, 2)
        .fill({ color: UI_COLORS.textGold, alpha: 0.8 });
    }
  }

  private updateTabs(): void {
    const tabs: Array<'equipment' | 'inventory' | 'skills'> = ['equipment', 'inventory', 'skills'];
    tabs.forEach((tab, i) => {
      const isActive = this.currentTab === tab;
      const ps = panelSize(this.layout);
      const px = (this.screenW - ps.width) / 2;
      const tabWidth = (ps.width - 24) / 3;
      const tabH = scaled(26, this.layout);
      const tx = px + 12 + i * tabWidth;
      const ty = px + scaled(40, this.layout);
      // Recalculate ty from panel position
      const py = (this.screenH - ps.height) / 2;
      this.drawTab(this.tabBgs[i], tx, py + scaled(40, this.layout), tabWidth - 6, tabH, isActive);
      this.tabLabels[i].style.fill = isActive ? UI_COLORS.textPrimary : UI_COLORS.textMuted;
      this.tabLabels[i].style.fontWeight = isActive ? 'bold' : 'normal';
    });
  }

  private startMomentumScroll(): void {
    const tick = () => {
      if (this.destroyed) return;
      if (Math.abs(this.scrollVelocity) > 0.5) {
        this.scrollVelocity *= 0.92; // Friction
        this.scrollY += this.scrollVelocity;
        this.applyScroll();
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  private applyScroll(): void {
    // Clamp scroll
    const maxScroll = 0;
    const contentHeight = this.getContentHeight();
    const minScroll = Math.min(0, this.contentArea.h - contentHeight);
    this.scrollY = Math.max(minScroll, Math.min(maxScroll, this.scrollY));

    // Apply offset to content
    for (const child of this.contentContainer.children) {
      // Content items get offset; but we need to track original positions
      // Simply offset the container
    }
    this.contentContainer.y = this.scrollY;
  }

  private getContentHeight(): number {
    let maxY = 0;
    for (const child of this.contentContainer.children) {
      const bottom = child.y + ((child as { height?: number }).height ?? 0);
      if (bottom > maxY) maxY = bottom;
    }
    return maxY - this.contentArea.y;
  }

  private refreshContent(): void {
    this.contentContainer.removeChildren();
    this.contentContainer.y = 0;
    this.scrollY = 0;

    const { x: cx, y: cy, w: cw, h: ch } = this.contentArea;

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
    const rowH = scaled(26, this.layout);

    let y = cy;
    for (const slot of EQUIPMENT_SLOTS) {
      const itemID = eq[slot];
      const item = itemID ? gameData.item(itemID) : null;

      const row = new Graphics();
      row.roundRect(cx + 10, y, cw - 20, rowH, 5)
        .fill({ color: UI_COLORS.btnSecondary, alpha: 0.6 })
        .stroke({ color: 0x332244, width: 0.8, alpha: 0.4 });
      row.eventMode = 'static';
      row.cursor = 'pointer';

      if (item) {
        row.on('pointerdown', () => {
          GameManager.shared.unequipItem(slot);
          this.refreshContent();
        });
      }

      this.contentContainer.addChild(row);

      // Slot label
      const slotLabel = new Text({
        text: SLOT_LABELS[slot] ?? slot,
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(9, this.layout), fill: UI_COLORS.textMuted }),
      });
      slotLabel.x = cx + 16;
      slotLabel.y = y + 5;
      this.contentContainer.addChild(slotLabel);

      // Item name or empty
      if (item) {
        const rarityColor = RARITY_COLORS[item.rarity] ?? 0xaaaaaa;
        const itemLabel = new Text({
          text: item.name,
          style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(9, this.layout), fill: rarityColor, fontWeight: 'bold' }),
        });
        itemLabel.anchor.set(1, 0);
        itemLabel.x = cx + cw - 16;
        itemLabel.y = y + 5;
        this.contentContainer.addChild(itemLabel);

        if (item.statBonuses.length > 0) {
          const statsStr = item.statBonuses.map(b => `+${b.value} ${b.stat}`).join(' ');
          const statsLabel = new Text({
            text: statsStr,
            style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(8, this.layout), fill: UI_COLORS.success }),
          });
          statsLabel.anchor.set(1, 0);
          statsLabel.x = cx + cw - 16;
          statsLabel.y = y + 15;
          this.contentContainer.addChild(statsLabel);
        }
      } else {
        const emptyLabel = new Text({
          text: '- vide -',
          style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(9, this.layout), fill: 0x555555 }),
        });
        emptyLabel.anchor.set(1, 0);
        emptyLabel.x = cx + cw - 16;
        emptyLabel.y = y + 5;
        this.contentContainer.addChild(emptyLabel);
      }

      y += rowH + 3;
    }
  }

  private renderInventory(cx: number, cy: number, cw: number, ch: number): void {
    const champ = GameManager.shared.champion;
    if (!champ) return;

    // Gold display
    const goldLabel = new Text({
      text: `Or: ${champ.gold}`,
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 9, fill: 0xe6cc33, fontWeight: 'bold' }),
    });
    goldLabel.x = cx + 14;
    goldLabel.y = cy;
    this.contentContainer.addChild(goldLabel);

    const itemCount = new Text({
      text: `${champ.inventoryItemIDs.length} objets`,
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 8, fill: 0x888888 }),
    });
    itemCount.anchor.set(1, 0);
    itemCount.x = cx + cw - 14;
    itemCount.y = cy;
    this.contentContainer.addChild(itemCount);

    let y = cy + 16;

    if (champ.inventoryItemIDs.length === 0) {
      const empty = new Text({
        text: 'Aucun objet dans l\'inventaire.\nTuez des ennemis et ouvrez des coffres\npour obtenir du butin!',
        style: new TextStyle({
          fontFamily: 'sans-serif', fontSize: fontSize(11, this.layout),
          fill: UI_COLORS.textMuted, align: 'center', wordWrap: true, wordWrapWidth: cw - 40,
        }),
      });
      empty.anchor.set(0.5, 0);
      empty.x = cx + cw / 2;
      empty.y = y + 20;
      this.contentContainer.addChild(empty);
      return;
    }

    const rowH = scaled(42, this.layout);
    for (const itemID of [...champ.inventoryItemIDs]) {
      if (y > cy + ch - 20) break;
      const item = gameData.item(itemID);
      if (!item) continue;

      const rarityColor = RARITY_COLORS[item.rarity] ?? 0xaaaaaa;
      const sellPrice = GameManager.getItemSellPrice(itemID);
      const disenchantResult = GameManager.getDisenchantResult(itemID);

      const row = new Graphics();
      row.roundRect(cx + 10, y, cw - 20, rowH, 5)
        .fill({ color: UI_COLORS.btnSecondary, alpha: 0.6 })
        .stroke({ color: rarityColor, width: 0.8, alpha: 0.3 });
      this.contentContainer.addChild(row);

      // Item name
      const nameLabel = new Text({
        text: item.name,
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(10, this.layout), fill: rarityColor, fontWeight: 'bold' }),
      });
      nameLabel.x = cx + 16;
      nameLabel.y = y + 2;
      this.contentContainer.addChild(nameLabel);

      // Slot + stats
      const slotName = SLOT_LABELS[item.slot] ?? item.slot;
      const statsStr = item.statBonuses.map(b => `+${b.value} ${b.stat}`).join(' ');
      const detailLabel = new Text({
        text: `${slotName} | ${statsStr}`,
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(8, this.layout), fill: UI_COLORS.textMuted }),
      });
      detailLabel.x = cx + 16;
      detailLabel.y = y + 14;
      this.contentContainer.addChild(detailLabel);

      // Action buttons row
      const btnY = y + 25;
      const btnH = 11;

      // Equip button
      const equipBtn = new Graphics();
      equipBtn.roundRect(cx + 14, btnY, 50, btnH, 3)
        .fill({ color: 0x224422, alpha: 0.8 })
        .stroke({ color: 0x44aa44, width: 0.5, alpha: 0.5 });
      equipBtn.eventMode = 'static';
      equipBtn.cursor = 'pointer';
      equipBtn.on('pointerdown', () => {
        MusicManager.shared.playSFX('equip');
        GameManager.shared.equipItem(itemID, item.slot);
        this.refreshContent();
      });
      this.contentContainer.addChild(equipBtn);
      const equipText = new Text({
        text: '\u00C9quiper',
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 7, fill: 0x66cc44 }),
      });
      equipText.x = cx + 20;
      equipText.y = btnY + 1;
      this.contentContainer.addChild(equipText);

      // Sell button
      const sellBtn = new Graphics();
      sellBtn.roundRect(cx + 70, btnY, 60, btnH, 3)
        .fill({ color: 0x332211, alpha: 0.8 })
        .stroke({ color: 0xcc9933, width: 0.5, alpha: 0.5 });
      sellBtn.eventMode = 'static';
      sellBtn.cursor = 'pointer';
      sellBtn.on('pointerdown', () => {
        MusicManager.shared.playSFX('loot_common');
        GameManager.shared.sellItem(itemID);
        this.refreshContent();
      });
      this.contentContainer.addChild(sellBtn);
      const sellText = new Text({
        text: `Vendre ${sellPrice}g`,
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 7, fill: 0xe6cc33 }),
      });
      sellText.x = cx + 76;
      sellText.y = btnY + 1;
      this.contentContainer.addChild(sellText);

      // Disenchant button
      const disBtn = new Graphics();
      disBtn.roundRect(cx + 136, btnY, 70, btnH, 3)
        .fill({ color: 0x221133, alpha: 0.8 })
        .stroke({ color: 0x9955ee, width: 0.5, alpha: 0.5 });
      disBtn.eventMode = 'static';
      disBtn.cursor = 'pointer';
      disBtn.on('pointerdown', () => {
        MusicManager.shared.playSFX('magic_aondor');
        GameManager.shared.disenchantItem(itemID);
        this.refreshContent();
      });
      this.contentContainer.addChild(disBtn);
      const disText = new Text({
        text: `D\u00E9chanter +${disenchantResult.amount}`,
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 7, fill: 0xbb88ee }),
      });
      disText.x = cx + 142;
      disText.y = btnY + 1;
      this.contentContainer.addChild(disText);

      y += rowH + 3;
    }
  }

  private renderSkills(cx: number, cy: number, cw: number, ch: number): void {
    const champ = GameManager.shared.champion;
    if (!champ) return;

    let y = cy;

    // Header
    const header = new Text({
      text: `Points de comp\u00E9tence: ${champ.skillPoints}`,
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(11, this.layout), fill: UI_COLORS.textGold, fontWeight: 'bold' }),
    });
    header.x = cx + 16;
    header.y = y;
    this.contentContainer.addChild(header);
    y += scaled(22, this.layout);

    // Equipped skills
    const equippedLabel = new Text({
      text: 'Comp\u00E9tences \u00E9quip\u00E9es:',
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(10, this.layout), fill: UI_COLORS.textSecondary }),
    });
    equippedLabel.x = cx + 16;
    equippedLabel.y = y;
    this.contentContainer.addChild(equippedLabel);
    y += scaled(16, this.layout);

    const slotH = scaled(30, this.layout);
    for (let i = 0; i < 4; i++) {
      const skillID = champ.equippedSkillIDs[i];
      const skill = skillID ? gameData.skill(skillID) : null;

      const row = new Graphics();
      row.roundRect(cx + 10, y, cw - 20, slotH, 5)
        .fill({ color: skill ? 0x1a2228 : UI_COLORS.btnSecondary, alpha: 0.6 })
        .stroke({ color: UI_COLORS.borderSubtle, width: 0.8, alpha: 0.4 });
      this.contentContainer.addChild(row);

      const slotNum = new Text({
        text: `[${i + 1}]`,
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(10, this.layout), fill: 0x6688aa, fontWeight: 'bold' }),
      });
      slotNum.x = cx + 16;
      slotNum.y = y + 4;
      this.contentContainer.addChild(slotNum);

      if (skill) {
        const nameL = new Text({
          text: skill.name,
          style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(10, this.layout), fill: UI_COLORS.textPrimary }),
        });
        nameL.x = cx + 40;
        nameL.y = y + 4;
        this.contentContainer.addChild(nameL);

        const detailL = new Text({
          text: `DMG: ${skill.baseDamage} | INV: ${skill.investitureCost} | CD: ${skill.cooldown}s`,
          style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(8, this.layout), fill: UI_COLORS.textMuted }),
        });
        detailL.x = cx + 40;
        detailL.y = y + 18;
        this.contentContainer.addChild(detailL);
      } else {
        const emptyL = new Text({
          text: '- vide -',
          style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(10, this.layout), fill: 0x555555 }),
        });
        emptyL.x = cx + 40;
        emptyL.y = y + 8;
        this.contentContainer.addChild(emptyL);
      }

      y += slotH + 3;
    }

    // Available skills
    y += 8;
    const availLabel = new Text({
      text: 'Comp\u00E9tences disponibles:',
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(10, this.layout), fill: UI_COLORS.textSecondary }),
    });
    availLabel.x = cx + 16;
    availLabel.y = y;
    this.contentContainer.addChild(availLabel);
    y += scaled(16, this.layout);

    for (const skillID of champ.unlockedSkillIDs) {
      if (champ.equippedSkillIDs.includes(skillID)) continue;
      const skill = gameData.skill(skillID);
      if (!skill) continue;

      const row = new Graphics();
      row.roundRect(cx + 10, y, cw - 20, scaled(26, this.layout), 5)
        .fill({ color: UI_COLORS.btnSecondary, alpha: 0.5 })
        .stroke({ color: 0x332244, width: 0.8, alpha: 0.3 });
      row.eventMode = 'static';
      row.cursor = 'pointer';
      row.on('pointerdown', () => {
        const emptyIdx = champ.equippedSkillIDs.findIndex(id => !id);
        if (emptyIdx >= 0) {
          champ.equippedSkillIDs[emptyIdx] = skillID;
        } else if (champ.equippedSkillIDs.length < 4) {
          champ.equippedSkillIDs.push(skillID);
        } else {
          champ.equippedSkillIDs[3] = skillID;
        }
        this.refreshContent();
      });
      this.contentContainer.addChild(row);

      const nameL = new Text({
        text: `${skill.name} (Nv.${skill.requiredLevel})`,
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(9, this.layout), fill: UI_COLORS.textPrimary }),
      });
      nameL.x = cx + 16;
      nameL.y = y + 5;
      this.contentContainer.addChild(nameL);

      const equipHint = new Text({
        text: '\u00C9quiper',
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(9, this.layout), fill: UI_COLORS.success, fontWeight: 'bold' }),
      });
      equipHint.anchor.set(1, 0);
      equipHint.x = cx + cw - 16;
      equipHint.y = y + 5;
      this.contentContainer.addChild(equipHint);

      y += scaled(28, this.layout);
    }
  }
}
