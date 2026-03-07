import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { GameManager } from '../game/GameManager';
import { getLayoutInfo, fontSize, scaled, hudMargin, hudBarWidth, panelRadius, UI_COLORS, UI_ALPHA } from '../ui/ResponsiveLayout';
import type { LayoutInfo } from '../ui/ResponsiveLayout';
import { lighten } from '../utils/ColorUtils';

// ─── World-Themed HUD Colors ─────────────────────────────────────

interface WorldHUDTheme {
  borderColor: number;
  investitureColor: number;
  investitureLabel: string;
  panelTint: number;
  accentGlow: number;
}

const WORLD_HUD_THEMES: Record<string, WorldHUDTheme> = {
  scadrial:  { borderColor: 0x664422, investitureColor: 0x6688cc, investitureLabel: 'MÉT', panelTint: 0x332211, accentGlow: 0x8899aa },
  roshar:    { borderColor: 0x2255aa, investitureColor: 0x66bbff, investitureLabel: 'LUM', panelTint: 0x112233, accentGlow: 0x88ccff },
  taldain:   { borderColor: 0x998833, investitureColor: 0xddcc44, investitureLabel: 'HYD', panelTint: 0x222200, accentGlow: 0xffdd66 },
  nalthis:   { borderColor: 0x44aa44, investitureColor: 0xcc66ff, investitureLabel: 'SOF', panelTint: 0x112211, accentGlow: 0xaa88ff },
  sel:       { borderColor: 0xaaaa33, investitureColor: 0xffcc44, investitureLabel: 'DOR', panelTint: 0x222200, accentGlow: 0xffdd88 },
  komashi:   { borderColor: 0x882299, investitureColor: 0xaa66cc, investitureLabel: 'ENC', panelTint: 0x220022, accentGlow: 0xcc88ff },
  shadesmar: { borderColor: 0x4422aa, investitureColor: 0x8866ff, investitureLabel: 'COG', panelTint: 0x110033, accentGlow: 0xaa88ff },
};

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

  // Animated values for smooth transitions
  private animHP = 1;
  private animInv = 1;
  private animXP = 0;
  private targetHP = 1;
  private targetInv = 1;
  private targetXP = 0;
  private prevLevel = 1;
  private levelUpGlow: Graphics;
  private currentWorldID = '';
  private worldTheme: WorldHUDTheme = WORLD_HUD_THEMES.scadrial;
  private borderGlow: Graphics;

  constructor(screenWidth: number, screenHeight: number) {
    super();
    this.layout = getLayoutInfo(screenWidth, screenHeight);
    this.barWidth = hudBarWidth(this.layout);
    this.barHeight = scaled(11, this.layout);

    const margins = hudMargin(this.layout);
    const leftX = margins.left;
    const topY = margins.top;

    // Semi-transparent panel background
    this.panel = new Graphics();
    this.addChild(this.panel);

    // Right panel for zone/gold
    this.rightPanel = new Graphics();
    this.addChild(this.rightPanel);

    const labelFontSize = fontSize(9, this.layout);
    const valStyle = new TextStyle({ fontFamily: 'sans-serif', fontSize: labelFontSize, fill: UI_COLORS.textSecondary, fontWeight: 'bold' });

    // Level
    this.levelText = new Text({
      text: 'Nv.1',
      style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: fontSize(15, this.layout), fill: UI_COLORS.textGold, fontWeight: 'bold' }),
    });
    this.addChild(this.levelText);

    // Level up glow effect
    this.levelUpGlow = new Graphics();
    this.levelUpGlow.alpha = 0;
    this.addChild(this.levelUpGlow);

    // World-themed border glow
    this.borderGlow = new Graphics();
    this.addChild(this.borderGlow);

    // HP background
    this.hpBg = new Graphics();
    this.addChild(this.hpBg);

    // HP bar
    this.hpBar = new Graphics();
    this.addChild(this.hpBar);

    // HP icon with better contrast
    this.hpIcon = new Text({
      text: 'PV',
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(8, this.layout), fill: UI_COLORS.hpHigh, fontWeight: 'bold' }),
    });
    this.addChild(this.hpIcon);

    this.hpText = new Text({ text: '', style: valStyle });
    this.hpText.anchor.set(0.5, 0.5);
    this.addChild(this.hpText);

    // Investiture background
    this.invBg = new Graphics();
    this.addChild(this.invBg);

    // Investiture bar
    this.invBar = new Graphics();
    this.addChild(this.invBar);

    // Investiture icon
    this.invIcon = new Text({
      text: 'INV',
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(8, this.layout), fill: UI_COLORS.investiture, fontWeight: 'bold' }),
    });
    this.addChild(this.invIcon);

    this.invText = new Text({ text: '', style: valStyle });
    this.invText.anchor.set(0.5, 0.5);
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
      style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: fontSize(12, this.layout), fill: UI_COLORS.textSecondary }),
    });
    this.zoneText.anchor.set(1, 0);
    this.addChild(this.zoneText);

    // Gold with icon
    this.goldText = new Text({
      text: '0 or',
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(12, this.layout), fill: UI_COLORS.textGoldBright, fontWeight: 'bold' }),
    });
    this.goldText.anchor.set(1, 0);
    this.addChild(this.goldText);

    // Position everything
    this.relayout(screenWidth, screenHeight);
  }

  relayout(screenWidth: number, screenHeight: number): void {
    this.layout = getLayoutInfo(screenWidth, screenHeight);
    this.barWidth = hudBarWidth(this.layout);
    this.barHeight = scaled(11, this.layout);

    const margins = hudMargin(this.layout);
    const leftX = margins.left;
    const topY = margins.top;
    const barStartX = leftX + scaled(44, this.layout);
    const barSpacing = this.barHeight + scaled(6, this.layout);
    const xpBarHeight = scaled(5, this.layout);
    const radius = panelRadius(this.layout);
    const smallRadius = scaled(5, this.layout);

    // Update font sizes
    this.levelText.style.fontSize = fontSize(15, this.layout);
    this.hpIcon.style.fontSize = fontSize(8, this.layout);
    this.invIcon.style.fontSize = fontSize(8, this.layout);
    this.hpText.style.fontSize = fontSize(9, this.layout);
    this.invText.style.fontSize = fontSize(9, this.layout);
    this.zoneText.style.fontSize = fontSize(12, this.layout);
    this.goldText.style.fontSize = fontSize(12, this.layout);

    // Left panel dimensions
    const panelWidth = scaled(44, this.layout) + this.barWidth + scaled(22, this.layout);
    const panelHeight = this.barHeight * 2 + xpBarHeight + scaled(6, this.layout) * 2 + scaled(10, this.layout);

    // Left panel background — glass-morphism style
    this.panel.clear();
    this.panel.roundRect(leftX - scaled(6, this.layout), topY - scaled(6, this.layout), panelWidth + scaled(4, this.layout), panelHeight + scaled(4, this.layout), radius)
      .fill({ color: UI_COLORS.panelBg, alpha: UI_ALPHA.panelBg });
    this.panel.roundRect(leftX - scaled(6, this.layout), topY - scaled(6, this.layout), panelWidth + scaled(4, this.layout), panelHeight + scaled(4, this.layout), radius)
      .stroke({ color: UI_COLORS.borderSubtle, width: 1.5, alpha: UI_ALPHA.panelBorder });

    // Right panel background
    const rightPanelWidth = scaled(140, this.layout);
    const rightPanelHeight = scaled(44, this.layout);
    const rightPanelX = screenWidth - margins.right - rightPanelWidth;

    this.rightPanel.clear();
    this.rightPanel.roundRect(rightPanelX, topY - scaled(6, this.layout), rightPanelWidth, rightPanelHeight, radius)
      .fill({ color: UI_COLORS.panelBg, alpha: UI_ALPHA.panelBg });
    this.rightPanel.roundRect(rightPanelX, topY - scaled(6, this.layout), rightPanelWidth, rightPanelHeight, radius)
      .stroke({ color: UI_COLORS.borderSubtle, width: 1.5, alpha: UI_ALPHA.panelBorder });

    // Level position
    this.levelText.x = leftX + scaled(2, this.layout);
    this.levelText.y = topY;

    // HP positions
    const hpY = topY + scaled(2, this.layout);
    this.hpIcon.x = barStartX - scaled(16, this.layout);
    this.hpIcon.y = hpY + scaled(1, this.layout);
    this.hpText.x = barStartX + this.barWidth / 2;
    this.hpText.y = hpY + this.barHeight / 2;

    // HP background
    this.hpBg.clear();
    this.hpBg.roundRect(barStartX, hpY, this.barWidth, this.barHeight, smallRadius)
      .fill({ color: 0x1a0a0a, alpha: UI_ALPHA.barBg })
      .stroke({ color: 0x332222, width: 0.8 });

    // Investiture positions
    const invY = hpY + barSpacing;
    this.invIcon.x = barStartX - scaled(20, this.layout);
    this.invIcon.y = invY + scaled(1, this.layout);
    this.invText.x = barStartX + this.barWidth / 2;
    this.invText.y = invY + this.barHeight / 2;

    // Investiture background
    this.invBg.clear();
    this.invBg.roundRect(barStartX, invY, this.barWidth, this.barHeight, smallRadius)
      .fill({ color: 0x0a0a1a, alpha: UI_ALPHA.barBg })
      .stroke({ color: 0x222233, width: 0.8 });

    // XP background
    const xpY = invY + barSpacing;
    this.xpBg.clear();
    this.xpBg.roundRect(barStartX, xpY, this.barWidth, xpBarHeight, scaled(3, this.layout))
      .fill({ color: 0x0a1a0a, alpha: 0.8 })
      .stroke({ color: 0x223322, width: 0.5 });

    // Zone & gold positions (top right, respecting safe area)
    this.zoneText.x = screenWidth - margins.right - scaled(6, this.layout);
    this.zoneText.y = topY;
    this.goldText.x = screenWidth - margins.right - scaled(6, this.layout);
    this.goldText.y = topY + scaled(20, this.layout);
  }

  refresh(zoneName: string): void {
    const c = GameManager.shared.champion;
    if (!c) return;
    const gm = GameManager.shared;

    const margins = hudMargin(this.layout);
    const barStartX = margins.left + scaled(44, this.layout);
    const barSpacing = this.barHeight + scaled(6, this.layout);
    const hpY = margins.top + scaled(2, this.layout);
    const cornerRadius = scaled(5, this.layout);

    // Update targets for smooth animation
    this.targetHP = Math.max(0, Math.min(1, c.currentHP / gm.maxHP));
    this.targetInv = Math.max(0, Math.min(1, c.currentInvestiture / gm.maxInvestiture));
    this.targetXP = Math.max(0, Math.min(1, c.currentXP / gm.xpForNextLevel));

    // Smooth lerp animation
    this.animHP += (this.targetHP - this.animHP) * 0.12;
    this.animInv += (this.targetInv - this.animInv) * 0.12;
    this.animXP += (this.targetXP - this.animXP) * 0.15;

    // Snap when close enough
    if (Math.abs(this.animHP - this.targetHP) < 0.002) this.animHP = this.targetHP;
    if (Math.abs(this.animInv - this.targetInv) < 0.002) this.animInv = this.targetInv;
    if (Math.abs(this.animXP - this.targetXP) < 0.002) this.animXP = this.targetXP;

    // Level up detection
    if (c.level !== this.prevLevel) {
      this.prevLevel = c.level;
      this.triggerLevelUpGlow();
    }

    this.levelText.text = `Nv.${c.level}`;

    // HP — gradient color based on percentage, accessible
    const hpPct = this.animHP;
    this.hpBar.clear();
    if (hpPct > 0) {
      // Color transitions: green > yellow > orange > red
      let hpColor: number;
      if (hpPct > 0.6) {
        hpColor = UI_COLORS.hpHigh;
      } else if (hpPct > 0.3) {
        hpColor = UI_COLORS.hpCritical; // Orange — visible for colorblind
      } else {
        hpColor = UI_COLORS.hpLow;
      }

      const fillWidth = Math.max(cornerRadius * 2, this.barWidth * hpPct);
      this.hpBar.roundRect(barStartX, hpY, fillWidth, this.barHeight, cornerRadius)
        .fill(hpColor);
      // Glossy shine
      this.hpBar.roundRect(barStartX + 1, hpY + 1, fillWidth - 2, this.barHeight * 0.4, cornerRadius)
        .fill({ color: 0xffffff, alpha: 0.15 });

      // Critical pulse effect
      if (hpPct <= 0.2) {
        const pulse = 0.6 + Math.sin(performance.now() / 300) * 0.4;
        this.hpBar.roundRect(barStartX, hpY, fillWidth, this.barHeight, cornerRadius)
          .fill({ color: 0xff0000, alpha: pulse * 0.15 });
      }
    }
    this.hpText.text = `${Math.ceil(c.currentHP)}/${gm.maxHP}`;

    // Update world theme if changed
    if (c.currentWorldID !== this.currentWorldID) {
      this.currentWorldID = c.currentWorldID;
      this.worldTheme = WORLD_HUD_THEMES[c.currentWorldID] ?? WORLD_HUD_THEMES.scadrial;
      this.invIcon.text = this.worldTheme.investitureLabel;
      this.invIcon.style.fill = this.worldTheme.investitureColor;
      this.updateWorldBorder();
    }

    // Investiture — world-themed color
    const invPct = this.animInv;
    const invY = hpY + barSpacing;
    const invColor = this.worldTheme.investitureColor;
    this.invBar.clear();
    if (invPct > 0) {
      const fillWidth = Math.max(cornerRadius * 2, this.barWidth * invPct);
      this.invBar.roundRect(barStartX, invY, fillWidth, this.barHeight, cornerRadius)
        .fill(invColor);
      // Glossy shine
      this.invBar.roundRect(barStartX + 1, invY + 1, fillWidth - 2, this.barHeight * 0.4, cornerRadius)
        .fill({ color: 0xffffff, alpha: 0.15 });
      // Shimmer effect when full — world-colored
      if (invPct > 0.95) {
        const shimmer = 0.05 + Math.sin(performance.now() / 500) * 0.05;
        this.invBar.roundRect(barStartX, invY, fillWidth, this.barHeight, cornerRadius)
          .fill({ color: lighten(invColor, 0.4), alpha: shimmer });
      }
      // Animated gradient edge glow
      const edgeGlow = 0.03 + Math.sin(performance.now() / 800) * 0.02;
      this.invBar.roundRect(barStartX, invY, fillWidth, this.barHeight, cornerRadius)
        .stroke({ color: this.worldTheme.accentGlow, width: 0.8, alpha: edgeGlow });
    }
    this.invText.text = `${Math.ceil(c.currentInvestiture)}/${gm.maxInvestiture}`;

    // XP
    const xpPct = this.animXP;
    const xpY = invY + barSpacing;
    const xpBarHeight = scaled(5, this.layout);
    this.xpBar.clear();
    if (xpPct > 0) {
      const fillWidth = Math.max(scaled(3, this.layout), this.barWidth * xpPct);
      this.xpBar.roundRect(barStartX, xpY, fillWidth, xpBarHeight, scaled(3, this.layout))
        .fill(UI_COLORS.xp);
    }

    // Zone + Gold
    this.zoneText.text = zoneName;
    this.goldText.text = `${c.gold} or`;

    // Decay level up glow
    if (this.levelUpGlow.alpha > 0) {
      this.levelUpGlow.alpha -= 0.015;
    }
  }

  private triggerLevelUpGlow(): void {
    const margins = hudMargin(this.layout);
    const cx = margins.left + scaled(16, this.layout);
    const cy = margins.top + scaled(10, this.layout);
    this.levelUpGlow.clear();
    // Outer ring burst
    this.levelUpGlow.circle(cx, cy, scaled(30, this.layout))
      .stroke({ color: UI_COLORS.textGold, width: 2, alpha: 0.4 });
    // Inner glow
    this.levelUpGlow.circle(cx, cy, scaled(20, this.layout))
      .fill({ color: UI_COLORS.textGold, alpha: 0.25 });
    // Core flash
    this.levelUpGlow.circle(cx, cy, scaled(10, this.layout))
      .fill({ color: 0xffffff, alpha: 0.3 });
    this.levelUpGlow.alpha = 1;
  }

  private updateWorldBorder(): void {
    const margins = hudMargin(this.layout);
    const leftX = margins.left;
    const topY = margins.top;
    const panelWidth = scaled(44, this.layout) + this.barWidth + scaled(22, this.layout);
    const xpBarHeight = scaled(5, this.layout);
    const panelHeight = this.barHeight * 2 + xpBarHeight + scaled(6, this.layout) * 2 + scaled(10, this.layout);
    const radius = panelRadius(this.layout);

    this.borderGlow.clear();
    // World-colored border glow on left panel
    this.borderGlow.roundRect(
      leftX - scaled(6, this.layout), topY - scaled(6, this.layout),
      panelWidth + scaled(4, this.layout), panelHeight + scaled(4, this.layout), radius,
    ).stroke({ color: this.worldTheme.borderColor, width: 1.5, alpha: 0.35 });

    // Subtle inner tint
    this.borderGlow.roundRect(
      leftX - scaled(4, this.layout), topY - scaled(4, this.layout),
      panelWidth, panelHeight, radius,
    ).fill({ color: this.worldTheme.panelTint, alpha: 0.15 });

    // Update panel border to match world
    this.panel.clear();
    this.panel.roundRect(leftX - scaled(6, this.layout), topY - scaled(6, this.layout), panelWidth + scaled(4, this.layout), panelHeight + scaled(4, this.layout), radius)
      .fill({ color: UI_COLORS.panelBg, alpha: UI_ALPHA.panelBg });
    this.panel.roundRect(leftX - scaled(6, this.layout), topY - scaled(6, this.layout), panelWidth + scaled(4, this.layout), panelHeight + scaled(4, this.layout), radius)
      .stroke({ color: this.worldTheme.borderColor, width: 1, alpha: 0.25 });
  }
}
