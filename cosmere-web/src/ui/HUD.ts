import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { GameManager } from '../game/GameManager';

export class HUD extends Container {
  private hpBar: Graphics;
  private hpText: Text;
  private invBar: Graphics;
  private invText: Text;
  private xpBar: Graphics;
  private levelText: Text;
  private zoneText: Text;
  private goldText: Text;
  private screenWidth: number;
  private barWidth = 120;
  private barHeight = 10;
  private panel: Graphics;

  constructor(screenWidth: number, screenHeight: number) {
    super();
    this.screenWidth = screenWidth;

    const margin = 12;
    const leftX = margin;
    const topY = margin;

    // Semi-transparent panel background
    this.panel = new Graphics();
    this.panel.roundRect(leftX - 4, topY - 4, 195, 58, 8)
      .fill({ color: 0x0a0a1a, alpha: 0.6 });
    this.panel.roundRect(leftX - 4, topY - 4, 195, 58, 8)
      .stroke({ color: 0x334455, width: 1, alpha: 0.4 });
    this.addChild(this.panel);

    // Right panel for zone/gold
    const rightPanel = new Graphics();
    rightPanel.roundRect(screenWidth - margin - 130, topY - 4, 134, 40, 8)
      .fill({ color: 0x0a0a1a, alpha: 0.6 });
    rightPanel.roundRect(screenWidth - margin - 130, topY - 4, 134, 40, 8)
      .stroke({ color: 0x334455, width: 1, alpha: 0.4 });
    this.addChild(rightPanel);

    const labelStyle = new TextStyle({ fontFamily: 'sans-serif', fontSize: 8, fill: 0x888899 });
    const valStyle = new TextStyle({ fontFamily: 'sans-serif', fontSize: 8, fill: 0xccccdd });

    // Level
    this.levelText = new Text({
      text: 'Nv.1',
      style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 14, fill: 0xe6cc66, fontWeight: 'bold' }),
    });
    this.levelText.x = leftX + 2;
    this.levelText.y = topY;
    this.addChild(this.levelText);

    // HP bar
    const barStartX = leftX + 42;
    const hpY = topY + 2;
    this.drawBarBg(barStartX, hpY);

    this.hpBar = new Graphics();
    this.addChild(this.hpBar);

    // HP icon
    const hpIcon = new Text({ text: 'PV', style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 7, fill: 0xcc5555, fontWeight: 'bold' }) });
    hpIcon.x = barStartX - 14;
    hpIcon.y = hpY + 1;
    this.addChild(hpIcon);

    this.hpText = new Text({ text: '', style: valStyle });
    this.hpText.x = barStartX + this.barWidth / 2;
    this.hpText.y = hpY + 1;
    this.hpText.anchor.set(0.5, 0);
    this.addChild(this.hpText);

    // Investiture bar
    const invY = hpY + this.barHeight + 5;
    this.drawBarBg(barStartX, invY);

    this.invBar = new Graphics();
    this.addChild(this.invBar);

    const invIcon = new Text({ text: 'INV', style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 7, fill: 0x5577cc, fontWeight: 'bold' }) });
    invIcon.x = barStartX - 18;
    invIcon.y = invY + 1;
    this.addChild(invIcon);

    this.invText = new Text({ text: '', style: valStyle });
    this.invText.x = barStartX + this.barWidth / 2;
    this.invText.y = invY + 1;
    this.invText.anchor.set(0.5, 0);
    this.addChild(this.invText);

    // XP bar (thin, below)
    const xpY = invY + this.barHeight + 5;
    const xpBg = new Graphics();
    xpBg.roundRect(barStartX, xpY, this.barWidth, 4, 2)
      .fill({ color: 0x111122, alpha: 0.8 })
      .stroke({ color: 0x222233, width: 0.5 });
    this.addChild(xpBg);

    this.xpBar = new Graphics();
    this.addChild(this.xpBar);

    // Zone name (top right)
    this.zoneText = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'Georgia, serif', fontSize: 11, fill: 0xaabbcc,
      }),
    });
    this.zoneText.anchor.set(1, 0);
    this.zoneText.x = screenWidth - margin - 4;
    this.zoneText.y = topY;
    this.addChild(this.zoneText);

    // Gold
    this.goldText = new Text({
      text: '0 or',
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 11, fill: 0xe6cc33, fontWeight: 'bold' }),
    });
    this.goldText.anchor.set(1, 0);
    this.goldText.x = screenWidth - margin - 4;
    this.goldText.y = topY + 18;
    this.addChild(this.goldText);
  }

  private drawBarBg(x: number, y: number): void {
    const bg = new Graphics();
    bg.roundRect(x, y, this.barWidth, this.barHeight, 4)
      .fill({ color: 0x111122, alpha: 0.9 })
      .stroke({ color: 0x222244, width: 0.5 });
    this.addChild(bg);
  }

  refresh(zoneName: string): void {
    const c = GameManager.shared.champion;
    if (!c) return;
    const gm = GameManager.shared;
    const margin = 12;
    const barStartX = margin + 42;

    this.levelText.text = `Nv.${c.level}`;

    // HP
    const hpPct = Math.max(0, Math.min(1, c.currentHP / gm.maxHP));
    const hpY = margin + 2;
    this.hpBar.clear();
    if (hpPct > 0) {
      this.hpBar.roundRect(barStartX, hpY, this.barWidth * hpPct, this.barHeight, 4)
        .fill(hpPct > 0.3 ? 0xcc3333 : 0xff2222);
      // Shine
      this.hpBar.roundRect(barStartX, hpY, this.barWidth * hpPct, this.barHeight / 2, 4)
        .fill({ color: 0xffffff, alpha: 0.1 });
    }
    this.hpText.text = `${Math.ceil(c.currentHP)}/${gm.maxHP}`;

    // Investiture
    const invPct = Math.max(0, Math.min(1, c.currentInvestiture / gm.maxInvestiture));
    const invY = hpY + this.barHeight + 5;
    this.invBar.clear();
    if (invPct > 0) {
      this.invBar.roundRect(barStartX, invY, this.barWidth * invPct, this.barHeight, 4)
        .fill(0x3366bb);
      this.invBar.roundRect(barStartX, invY, this.barWidth * invPct, this.barHeight / 2, 4)
        .fill({ color: 0xffffff, alpha: 0.1 });
    }
    this.invText.text = `${Math.ceil(c.currentInvestiture)}/${gm.maxInvestiture}`;

    // XP
    const xpPct = Math.max(0, Math.min(1, c.currentXP / gm.xpForNextLevel));
    const xpY = invY + this.barHeight + 5;
    this.xpBar.clear();
    if (xpPct > 0) {
      this.xpBar.roundRect(barStartX, xpY, this.barWidth * xpPct, 4, 2).fill(0x55aa44);
    }

    // Zone + Gold
    this.zoneText.text = zoneName;
    this.goldText.text = `${c.gold} or`;
  }
}
