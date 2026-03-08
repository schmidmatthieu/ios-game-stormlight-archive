import { Container, Graphics } from 'pixi.js';
import type { Item, EquipmentSlot } from '../data/types';
import { getLayoutInfo, scaled, panelSize, panelRadius, buttonHeight, UI_COLORS, UI_ALPHA } from '../ui/ResponsiveLayout';
import type { LayoutInfo } from '../ui/ResponsiveLayout';
import { txt } from './InventoryConstants';
import { renderEquipmentTab } from './InventoryEquipment';
import { renderInventoryTab, showItemTooltip, usePotion } from './InventoryItemRenderer';
import { renderSkillsTab } from './InventoryEquipment';

export class InventoryPanel extends Container {
  private onClose: () => void;
  private cc: Container; // content container
  private scrollMask: Graphics;
  private scrollY = 0;
  private scrollVelocity = 0;
  private screenW: number;
  private screenH: number;
  private currentTab: 'equipment' | 'inventory' | 'skills' = 'equipment';
  private layout: LayoutInfo;
  private tabBgs: Graphics[] = [];
  private tabLabels: ReturnType<typeof txt>[] = [];
  private ca: { x: number; y: number; w: number; h: number } = { x: 0, y: 0, w: 0, h: 0 };
  private tooltip: Container | null = null;

  constructor(screenW: number, screenH: number, onClose: () => void) {
    super();
    this.screenW = screenW;
    this.screenH = screenH;
    this.onClose = onClose;
    this.zIndex = 10000;
    this.layout = getLayoutInfo(screenW, screenH);
    const L = this.layout;
    const radius = panelRadius(L);
    const overlay = new Graphics();
    overlay.rect(0, 0, screenW, screenH).fill({ color: 0x000000, alpha: UI_ALPHA.overlay });
    overlay.eventMode = 'static';
    overlay.on('pointerdown', () => this.hideTooltip());
    this.addChild(overlay);

    const ps = panelSize(L);
    const [pW, pH] = [ps.width, ps.height];
    const [px, py] = [(screenW - pW) / 2, (screenH - pH) / 2];
    const panel = new Graphics();
    panel.roundRect(px, py, pW, pH, radius + 2)
      .fill({ color: UI_COLORS.panelBgAlt, alpha: 0.96 })
      .stroke({ color: UI_COLORS.borderAccent, width: 2, alpha: 0.7 });
    panel.eventMode = 'static';
    this.addChild(panel);

    const title = txt('INVENTAIRE', 18, UI_COLORS.textGold, L, true);
    title.anchor.set(0.5);
    title.x = screenW / 2; title.y = py + scaled(20, L);
    this.addChild(title);

    // Tabs
    const tabDefs = [
      { label: 'Équipement', tab: 'equipment' as const },
      { label: 'Objets', tab: 'inventory' as const },
      { label: 'Compétences', tab: 'skills' as const },
    ];
    const tabW = (pW - 24) / 3, tabH = scaled(26, L);
    tabDefs.forEach((t, i) => {
      const tx = px + 12 + i * tabW, ty = py + scaled(40, L);
      const bg = new Graphics();
      this.drawTab(bg, tx, ty, tabW - 6, tabH, this.currentTab === t.tab);
      bg.eventMode = 'static'; bg.cursor = 'pointer';
      bg.on('pointerdown', () => {
        this.currentTab = t.tab; this.scrollY = 0; this.scrollVelocity = 0;
        this.hideTooltip(); this.updateTabs(); this.refreshContent();
      });
      this.addChild(bg); this.tabBgs.push(bg);
      const label = txt(t.label, 10, this.currentTab === t.tab ? UI_COLORS.textPrimary : UI_COLORS.textMuted, L, this.currentTab === t.tab);
      label.anchor.set(0.5); label.x = tx + (tabW - 6) / 2; label.y = ty + tabH / 2;
      this.addChild(label); this.tabLabels.push(label);
    });

    const cY = py + scaled(72, L), cH = pH - scaled(112, L);
    this.ca = { x: px, y: cY, w: pW, h: cH };
    this.cc = new Container();
    this.addChild(this.cc);
    this.scrollMask = new Graphics();
    this.scrollMask.rect(px, cY, pW, cH).fill(0xffffff);
    this.addChild(this.scrollMask);
    this.cc.mask = this.scrollMask;

    let isDragging = false, lastDY = 0;
    this.cc.eventMode = 'static';
    this.cc.hitArea = { contains: (x: number, y: number) => x >= px && x <= px + pW && y >= cY && y <= cY + cH };
    this.cc.on('pointerdown', (e) => { isDragging = true; lastDY = e.globalY; this.scrollVelocity = 0; });
    this.cc.on('globalpointermove', (e) => {
      if (!isDragging) return;
      const dy = e.globalY - lastDY; this.scrollY += dy; lastDY = e.globalY; this.scrollVelocity = dy;
      this.applyScroll();
    });
    const end = () => { isDragging = false; };
    this.cc.on('pointerup', end); this.cc.on('pointerupoutside', end);
    this.refreshContent();

    // Close button
    const cbW = scaled(90, L), cbH = buttonHeight(L);
    const cb = new Graphics();
    cb.roundRect(px + pW / 2 - cbW / 2, py + pH - scaled(38, L), cbW, cbH, 8)
      .fill({ color: 0x553322, alpha: UI_ALPHA.buttonBg }).stroke({ color: 0x886644, width: 1.5 });
    cb.eventMode = 'static'; cb.cursor = 'pointer'; cb.on('pointerdown', () => this.onClose());
    this.addChild(cb);
    const cl = txt('Fermer', 12, UI_COLORS.textPrimary, L, true);
    cl.anchor.set(0.5); cl.x = px + pW / 2; cl.y = py + pH - scaled(38, L) + cbH / 2;
    this.addChild(cl);
    this.startMomentum();
  }

  private drawTab(g: Graphics, x: number, y: number, w: number, h: number, active: boolean): void {
    g.clear();
    g.roundRect(x, y, w, h, 6).fill({ color: active ? 0x332244 : UI_COLORS.btnSecondary, alpha: active ? 0.9 : 0.6 });
    if (active) g.roundRect(x, y + h - 3, w, 3, 2).fill({ color: UI_COLORS.textGold, alpha: 0.8 });
  }

  private updateTabs(): void {
    (['equipment', 'inventory', 'skills'] as const).forEach((tab, i) => {
      const a = this.currentTab === tab;
      const ps = panelSize(this.layout);
      const px = (this.screenW - ps.width) / 2, py = (this.screenH - ps.height) / 2;
      const tw = (ps.width - 24) / 3;
      this.drawTab(this.tabBgs[i], px + 12 + i * tw, py + scaled(40, this.layout), tw - 6, scaled(26, this.layout), a);
      this.tabLabels[i].style.fill = a ? UI_COLORS.textPrimary : UI_COLORS.textMuted;
      this.tabLabels[i].style.fontWeight = a ? 'bold' : 'normal';
    });
  }

  private startMomentum(): void {
    const tick = () => {
      if (this.destroyed) return;
      if (Math.abs(this.scrollVelocity) > 0.5) {
        this.scrollVelocity *= 0.92; this.scrollY += this.scrollVelocity; this.applyScroll();
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  private applyScroll(): void {
    let maxY = 0;
    for (const c of this.cc.children) { const b = c.y + ((c as { height?: number }).height ?? 0); if (b > maxY) maxY = b; }
    const ch = maxY - this.ca.y;
    this.scrollY = Math.max(Math.min(0, this.ca.h - ch), Math.min(0, this.scrollY));
    this.cc.y = this.scrollY;
  }

  private refreshContent(): void {
    this.cc.removeChildren(); this.cc.y = 0; this.scrollY = 0;
    const { x, y, w, h } = this.ca;
    const showTT = (item: Item, slot: EquipmentSlot | string, ax: number, ay: number) => {
      this.showTooltip(item, slot, ax, ay);
    };
    if (this.currentTab === 'equipment') {
      renderEquipmentTab(this.cc, x, y, w, h, this.layout, showTT);
    } else if (this.currentTab === 'inventory') {
      renderInventoryTab(this.cc, x, y, w, h, this.layout, showTT, (id) => this.handleUsePotion(id));
    } else {
      renderSkillsTab(this.cc, x, y, w, h, this.layout, () => this.refreshContent());
    }
  }

  private showTooltip(item: Item, slot: EquipmentSlot | string, ax: number, ay: number): void {
    this.hideTooltip();
    const c = showItemTooltip(this, item, slot, ax, ay, this.screenW, this.screenH, this.layout, () => {
      this.hideTooltip(); this.refreshContent();
    });
    this.tooltip = c; this.addChild(c);
  }

  private hideTooltip(): void {
    if (this.tooltip) {
      this.removeChild(this.tooltip); this.tooltip.destroy({ children: true }); this.tooltip = null;
    }
  }

  private handleUsePotion(itemID: string): void {
    usePotion(itemID, () => this.refreshContent());
  }
}
