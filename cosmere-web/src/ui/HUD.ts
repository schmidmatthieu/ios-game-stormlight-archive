import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { GameManager } from '../game/GameManager';
import { getLayoutInfo, fontSize, scaled, hudMargin, hudBarWidth, LayoutInfo } from '../ui/ResponsiveLayout';

export class HUD extends Container {
  private hpBar: Graphics;
  private hpText: Text;
  private invBar: Graphics;
  private invText: Text;
  private xpBar: Graphics;
  private levelText: Text;
  private zoneText: Text;
  private goldText: Text;
  private barWidth: number;
  private barHeight: number;
  private panel: Graphics;
  private rightPanel: Graphics;
  private hpIcon: Text;
  private invIcon: Text;
  private hpBg: Graphics;
  private invBg: Graphics;
  private xpBg: Graphics;
  private layout: LayoutInfo;

  constructor(screenWidth: number, screenHeight: number) {
    super();
    this.layout = getLayoutInfo(screenWidth, screenHeight);
    this.barWidth = hudBarWidth(this.layout);
    this.barHeight = scaled(10, this.layout);

    const margins = hudMargin(this.layout);
    const leftX = margins.left;
    const topY = margins.top;

    // Semi-transparent panel background
    this.panel = new Graphics();
    this.addChild(this.panel);

    // Right panel for zone/gold
    this.rightPanel = new Graphics();
    this.addChild(this.rightPanel);

    const labelFontSize = fontSize(8, this.layout);
    const valStyle = new TextStyle({ fontFamily: 'sans-serif', fontSize: labelFontSize, fill: 0xccccdd });

    // Level
    this.levelText = new Text({
      text: 'Nv.1',
      style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: fontSize(14, this.layout), fill: 0xe6cc66, fontWeight: 'bold' }),
    });
    this.addChild(this.levelText);

    // HP background
    this.hpBg = new Graphics();
    this.addChild(this.hpBg);

    // HP bar
    this.hpBar = new Graphics();
    this.addChild(this.hpBar);

    // HP icon
    this.hpIcon = new Text({ text: 'PV', style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(7, this.layout), fill: 0xcc5555, fontWeight: 'bold' }) });
    this.addChild(this.hpIcon);

    this.hpText = new Text({ text: '', style: valStyle });
    this.hpText.anchor.set(0.5, 0);
    this.addChild(this.hpText);

    // Investiture background
    this.invBg = new Graphics();
    this.addChild(this.invBg);

    // Investiture bar
    this.invBar = new Graphics();
    this.addChild(this.invBar);

    // Investiture icon
    this.invIcon = new Text({ text: 'INV', style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(7, this.layout), fill: 0x5577cc, fontWeight: 'bold' }) });
    this.addChild(this.invIcon);

    this.invText = new Text({ text: '', style: valStyle });
    this.invText.anchor.set(0.5, 0);
    this.addChild(this.invText);

    // XP background
    this.xpBg = new Graphics();
    this.addChild(this.xpBg);

    // XP bar
    this.xpBar = new Graphics();
    this.addChild(this.xpBar);

    // Zone name (top right)
    this.zoneText = new Text({
      text: '',
      style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: fontSize(11, this.layout), fill: 0xaabbcc }),
    });
    this.zoneText.anchor.set(1, 0);
    this.addChild(this.zoneText);

    // Gold
    this.goldText = new Text({
      text: '0 or',
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(11, this.layout), fill: 0xe6cc33, fontWeight: 'bold' }),
    });
    this.goldText.anchor.set(1, 0);
    this.addChild(this.goldText);

    // Position everything
    this.relayout(screenWidth, screenHeight);
  }

  relayout(screenWidth: number, screenHeight: number): void {
    this.layout = getLayoutInfo(screenWidth, screenHeight);
    this.barWidth = hudBarWidth(this.layout);
    this.barHeight = scaled(10, this.layout);

    const margins = hudMargin(this.layout);
    const leftX = margins.left;
    const topY = margins.top;
    const barStartX = leftX + scaled(42, this.layout);
    const barSpacing = this.barHeight + scaled(5, this.layout);
    const xpBarHeight = scaled(4, this.layout);

    // Update font sizes
    this.levelText.style.fontSize = fontSize(14, this.layout);
    this.hpIcon.style.fontSize = fontSize(7, this.layout);
    this.invIcon.style.fontSize = fontSize(7, this.layout);
    this.hpText.style.fontSize = fontSize(8, this.layout);
    this.invText.style.fontSize = fontSize(8, this.layout);
    this.zoneText.style.fontSize = fontSize(11, this.layout);
    this.goldText.style.fontSize = fontSize(11, this.layout);

    // Left panel dimensions
    const panelWidth = scaled(42, this.layout) + this.barWidth + scaled(20, this.layout);
    const panelHeight = this.barHeight * 2 + xpBarHeight + scaled(5, this.layout) * 2 + scaled(8, this.layout);

    // Left panel background
    this.panel.clear();
    this.panel.roundRect(leftX - scaled(4, this.layout), topY - scaled(4, this.layout), panelWidth, panelHeight, scaled(8, this.layout))
      .fill({ color: 0x0a0a1a, alpha: 0.6 });
    this.panel.roundRect(leftX - scaled(4, this.layout), topY - scaled(4, this.layout), panelWidth, panelHeight, scaled(8, this.layout))
      .stroke({ color: 0x334455, width: 1, alpha: 0.4 });

    // Right panel background
    const rightPanelWidth = scaled(134, this.layout);
    const rightPanelHeight = scaled(40, this.layout);
    const rightPanelX = screenWidth - margins.right - rightPanelWidth;

    this.rightPanel.clear();
    this.rightPanel.roundRect(rightPanelX, topY - scaled(4, this.layout), rightPanelWidth, rightPanelHeight, scaled(8, this.layout))
      .fill({ color: 0x0a0a1a, alpha: 0.6 });
    this.rightPanel.roundRect(rightPanelX, topY - scaled(4, this.layout), rightPanelWidth, rightPanelHeight, scaled(8, this.layout))
      .stroke({ color: 0x334455, width: 1, alpha: 0.4 });

    // Level position
    this.levelText.x = leftX + scaled(2, this.layout);
    this.levelText.y = topY;

    // HP positions
    const hpY = topY + scaled(2, this.layout);
    this.hpIcon.x = barStartX - scaled(14, this.layout);
    this.hpIcon.y = hpY + scaled(1, this.layout);
    this.hpText.x = barStartX + this.barWidth / 2;
    this.hpText.y = hpY + scaled(1, this.layout);

    // HP background
    this.hpBg.clear();
    this.hpBg.roundRect(barStartX, hpY, this.barWidth, this.barHeight, scaled(4, this.layout))
      .fill({ color: 0x111122, alpha: 0.9 })
      .stroke({ color: 0x222244, width: 0.5 });

    // Investiture positions
    const invY = hpY + barSpacing;
    this.invIcon.x = barStartX - scaled(18, this.layout);
    this.invIcon.y = invY + scaled(1, this.layout);
    this.invText.x = barStartX + this.barWidth / 2;
    this.invText.y = invY + scaled(1, this.layout);

    // Investiture background
    this.invBg.clear();
    this.invBg.roundRect(barStartX, invY, this.barWidth, this.barHeight, scaled(4, this.layout))
      .fill({ color: 0x111122, alpha: 0.9 })
      .stroke({ color: 0x222244, width: 0.5 });

    // XP background
    const xpY = invY + barSpacing;
    this.xpBg.clear();
    this.xpBg.roundRect(barStartX, xpY, this.barWidth, xpBarHeight, scaled(2, this.layout))
      .fill({ color: 0x111122, alpha: 0.8 })
      .stroke({ color: 0x222233, width: 0.5 });

    // Zone & gold positions (top right, respecting safe area)
    this.zoneText.x = screenWidth - margins.right - scaled(4, this.layout);
    this.zoneText.y = topY;
    this.goldText.x = screenWidth - margins.right - scaled(4, this.layout);
    this.goldText.y = topY + scaled(18, this.layout);
  }

  refresh(zoneName: string): void {
    const c = GameManager.shared.champion;
    if (!c) return;
    const gm = GameManager.shared;

    const margins = hudMargin(this.layout);
    const barStartX = margins.left + scaled(42, this.layout);
    const barSpacing = this.barHeight + scaled(5, this.layout);
    const hpY = margins.top + scaled(2, this.layout);
    const cornerRadius = scaled(4, this.layout);

    this.levelText.text = `Nv.${c.level}`;

    // HP
    const hpPct = Math.max(0, Math.min(1, c.currentHP / gm.maxHP));
    this.hpBar.clear();
    if (hpPct > 0) {
      this.hpBar.roundRect(barStartX, hpY, this.barWidth * hpPct, this.barHeight, cornerRadius)
        .fill(hpPct > 0.3 ? 0xcc3333 : 0xff2222);
      // Shine
      this.hpBar.roundRect(barStartX, hpY, this.barWidth * hpPct, this.barHeight / 2, cornerRadius)
        .fill({ color: 0xffffff, alpha: 0.1 });
    }
    this.hpText.text = `${Math.ceil(c.currentHP)}/${gm.maxHP}`;

    // Investiture
    const invPct = Math.max(0, Math.min(1, c.currentInvestiture / gm.maxInvestiture));
    const invY = hpY + barSpacing;
    this.invBar.clear();
    if (invPct > 0) {
      this.invBar.roundRect(barStartX, invY, this.barWidth * invPct, this.barHeight, cornerRadius)
        .fill(0x3366bb);
      this.invBar.roundRect(barStartX, invY, this.barWidth * invPct, this.barHeight / 2, cornerRadius)
        .fill({ color: 0xffffff, alpha: 0.1 });
    }
    this.invText.text = `${Math.ceil(c.currentInvestiture)}/${gm.maxInvestiture}`;

    // XP
    const xpPct = Math.max(0, Math.min(1, c.currentXP / gm.xpForNextLevel));
    const xpY = invY + barSpacing;
    const xpBarHeight = scaled(4, this.layout);
    this.xpBar.clear();
    if (xpPct > 0) {
      this.xpBar.roundRect(barStartX, xpY, this.barWidth * xpPct, xpBarHeight, scaled(2, this.layout)).fill(0x55aa44);
    }

    // Zone + Gold
    this.zoneText.text = zoneName;
    this.goldText.text = `${c.gold} or`;
  }
}
