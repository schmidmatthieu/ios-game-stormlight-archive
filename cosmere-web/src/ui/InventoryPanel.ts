// ─── Inventory Panel (orchestrator) ─────────────────────────────

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { renderEquipment } from './EquipmentTab';
import { renderInventory } from './InventoryTab';
import { renderSkills } from './SkillsTab';

export class InventoryPanel extends Container {
  private onClose: () => void;
  private contentContainer: Container;
  private currentTab: 'equipment' | 'inventory' | 'skills' = 'equipment';
  private contentX: number;
  private contentY: number;
  private contentW: number;
  private contentH: number;

  constructor(screenW: number, screenH: number, onClose: () => void) {
    super();
    this.onClose = onClose;
    this.zIndex = 10000;

    // Overlay
    const overlay = new Graphics();
    overlay.rect(0, 0, screenW, screenH).fill({ color: 0x000000, alpha: 0.6 });
    overlay.eventMode = 'static';
    this.addChild(overlay);

    // Main panel
    const panelW = Math.min(340, screenW - 20);
    const panelH = Math.min(420, screenH - 40);
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
      style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 16, fill: 0xe6cc66, fontWeight: 'bold' }),
    });
    title.anchor.set(0.5);
    title.x = screenW / 2;
    title.y = py + 18;
    this.addChild(title);

    // Tabs
    const tabs: Array<{ label: string; tab: 'equipment' | 'inventory' | 'skills' }> = [
      { label: 'Équipement', tab: 'equipment' },
      { label: 'Objets', tab: 'inventory' },
      { label: 'Compétences', tab: 'skills' },
    ];
    const tabWidth = (panelW - 20) / 3;
    tabs.forEach((t, i) => {
      const tx = px + 10 + i * tabWidth;
      const ty = py + 36;
      const bg = new Graphics();
      bg.roundRect(tx, ty, tabWidth - 4, 22, 4)
        .fill({ color: this.currentTab === t.tab ? 0x332244 : 0x1a1528, alpha: 0.8 })
        .stroke({ color: 0x443355, width: 1, alpha: 0.4 });
      bg.eventMode = 'static';
      bg.cursor = 'pointer';
      bg.on('pointerdown', () => {
        this.currentTab = t.tab;
        this.refreshContent();
      });
      this.addChild(bg);

      const label = new Text({
        text: t.label,
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 9, fill: this.currentTab === t.tab ? 0xeeddcc : 0x888888 }),
      });
      label.anchor.set(0.5);
      label.x = tx + (tabWidth - 4) / 2;
      label.y = ty + 11;
      this.addChild(label);
    });

    // Content area
    this.contentX = px;
    this.contentY = py + 64;
    this.contentW = panelW;
    this.contentH = panelH - 100;

    this.contentContainer = new Container();
    this.addChild(this.contentContainer);
    this.refreshContent();

    // Close button
    const closeBg = new Graphics();
    closeBg.roundRect(px + panelW / 2 - 40, py + panelH - 32, 80, 24, 6)
      .fill({ color: 0x553322, alpha: 0.8 })
      .stroke({ color: 0x886644, width: 1 });
    closeBg.eventMode = 'static';
    closeBg.cursor = 'pointer';
    closeBg.on('pointerdown', () => this.onClose());
    this.addChild(closeBg);

    const closeLabel = new Text({
      text: 'Fermer',
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 11, fill: 0xeeddcc }),
    });
    closeLabel.anchor.set(0.5);
    closeLabel.x = px + panelW / 2;
    closeLabel.y = py + panelH - 20;
    this.addChild(closeLabel);
  }

  private refreshContent(): void {
    this.contentContainer.removeChildren();
    const onRefresh = () => this.refreshContent();
    const { contentX: cx, contentY: cy, contentW: cw, contentH: ch } = this;

    switch (this.currentTab) {
      case 'equipment': renderEquipment(this.contentContainer, cx, cy, cw, ch, onRefresh); break;
      case 'inventory': renderInventory(this.contentContainer, cx, cy, cw, ch, onRefresh); break;
      case 'skills': renderSkills(this.contentContainer, cx, cy, cw, ch, onRefresh); break;
    }
  }
}
