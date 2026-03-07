import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { Champion } from '../data/types';
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
  private barWidth = 130;
  private barHeight = 10;

  constructor(screenWidth: number, screenHeight: number) {
    super();
    this.screenWidth = screenWidth;

    const margin = 12;
    const leftX = margin;
    const topY = margin;
    const smallStyle = new TextStyle({ fontFamily: 'sans-serif', fontSize: 9, fill: 0xffffff });

    // Level
    this.levelText = new Text({ text: 'Nv.1', style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 13, fill: 0xe6cc66, fontWeight: 'bold' }) });
    this.levelText.x = leftX;
    this.levelText.y = topY;
    this.addChild(this.levelText);

    // HP bar
    const hpY = topY + 18;
    const hpBg = new Graphics();
    hpBg.roundRect(leftX + 35, hpY, this.barWidth, this.barHeight, 3).fill({ color: 0x222222, alpha: 0.8 }).stroke({ color: 0x444444, width: 1 });
    this.addChild(hpBg);

    this.hpBar = new Graphics();
    this.addChild(this.hpBar);

    this.hpText = new Text({ text: '', style: smallStyle });
    this.hpText.x = leftX + 35 + this.barWidth / 2;
    this.hpText.y = hpY + 1;
    this.hpText.anchor.set(0.5, 0);
    this.addChild(this.hpText);

    // Investiture bar
    const invY = hpY + this.barHeight + 4;
    const invBg = new Graphics();
    invBg.roundRect(leftX + 35, invY, this.barWidth, this.barHeight, 3).fill({ color: 0x222222, alpha: 0.8 }).stroke({ color: 0x444444, width: 1 });
    this.addChild(invBg);

    this.invBar = new Graphics();
    this.addChild(this.invBar);

    this.invText = new Text({ text: '', style: smallStyle });
    this.invText.x = leftX + 35 + this.barWidth / 2;
    this.invText.y = invY + 1;
    this.invText.anchor.set(0.5, 0);
    this.addChild(this.invText);

    // XP bar
    const xpY = invY + this.barHeight + 4;
    const xpBg = new Graphics();
    xpBg.roundRect(leftX + 35, xpY, this.barWidth, 5, 2).fill({ color: 0x222222, alpha: 0.8 });
    this.addChild(xpBg);

    this.xpBar = new Graphics();
    this.addChild(this.xpBar);

    // Zone name (top right)
    this.zoneText = new Text({ text: '', style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 11, fill: 0x888888 }) });
    this.zoneText.anchor.set(1, 0);
    this.zoneText.x = screenWidth - margin;
    this.zoneText.y = topY;
    this.addChild(this.zoneText);

    // Gold
    this.goldText = new Text({ text: '0 or', style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 10, fill: 0xe6cc33 }) });
    this.goldText.anchor.set(1, 0);
    this.goldText.x = screenWidth - margin;
    this.goldText.y = topY + 18;
    this.addChild(this.goldText);
  }

  refresh(zoneName: string): void {
    const c = GameManager.shared.champion;
    if (!c) return;
    const gm = GameManager.shared;
    const margin = 12;
    const leftX = margin + 35;

    this.levelText.text = `Nv.${c.level}`;

    // HP
    const hpPct = Math.max(0, Math.min(1, c.currentHP / gm.maxHP));
    const hpY = margin + 18;
    this.hpBar.clear();
    this.hpBar.roundRect(leftX, hpY, this.barWidth * hpPct, this.barHeight, 3).fill(0xcc3333);
    this.hpText.text = `${c.currentHP}/${gm.maxHP}`;

    // Investiture
    const invPct = Math.max(0, Math.min(1, c.currentInvestiture / gm.maxInvestiture));
    const invY = hpY + this.barHeight + 4;
    this.invBar.clear();
    this.invBar.roundRect(leftX, invY, this.barWidth * invPct, this.barHeight, 3).fill(0x3377cc);
    this.invText.text = `${c.currentInvestiture}/${gm.maxInvestiture}`;

    // XP
    const xpPct = Math.max(0, Math.min(1, c.currentXP / gm.xpForNextLevel));
    const xpY = invY + this.barHeight + 4;
    this.xpBar.clear();
    this.xpBar.roundRect(leftX, xpY, this.barWidth * xpPct, 5, 2).fill(0x66cc44);

    // Zone + Gold
    this.zoneText.text = zoneName;
    this.goldText.text = `${c.gold} or`;
  }
}
