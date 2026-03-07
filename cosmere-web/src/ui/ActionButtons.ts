import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { getLayoutInfo, actionButtonScale, scaled, touchTarget, UI_COLORS, UI_ALPHA } from '../ui/ResponsiveLayout';
import type { LayoutInfo } from '../ui/ResponsiveLayout';

export interface SkillSlotData {
  skillID: string;
  iconLabel: string;
  cooldown: number;
  maxCooldown: number;
}

export type ActionMode = 'attack' | 'talk' | 'enter' | 'loot';

export class ActionButtons extends Container {
  private atkButton: Container;
  private atkBg!: Graphics;
  private atkText!: Text;
  private skillButtons: Container[] = [];
  private ultButton: Container;
  private slots: SkillSlotData[] = [];
  private cooldownOverlays: Graphics[] = [];
  private cooldownTexts: Text[] = [];
  private layoutInfo: LayoutInfo | null = null;

  // Callbacks
  onAttack: (() => void) | null = null;
  onSkill: ((index: number) => void) | null = null;
  onUltimate: (() => void) | null = null;
  onInteract: ((mode: ActionMode) => void) | null = null;

  // State
  private _currentMode: ActionMode = 'attack';

  get currentMode(): ActionMode { return this._currentMode; }

  constructor(layout?: LayoutInfo) {
    super();
    this.layoutInfo = layout ?? null;

    // Apply responsive scaling if layout is provided
    if (layout) {
      this.scale.set(actionButtonScale(layout));
    }

    // Main attack button — meets 48px minimum touch target
    const mainRadius = 34;
    this.atkButton = this.createCircleBtn(0, 0, mainRadius, 0xcc2222, 0xdd4444, 'ATK', () => this.handleMainButton());
    this.addChild(this.atkButton);

    // 4 Skill buttons in arc — scaled positions, larger touch targets
    const sp = this.skillPositions();
    const skillColors = [0x2244aa, 0x22aa44, 0xaa8822, 0x8822aa];
    const skillHighlights = [0x4466cc, 0x44cc66, 0xccaa44, 0xaa44cc];
    const skillRadius = 24; // Larger for better touch

    for (let i = 0; i < 4; i++) {
      const btn = this.createCircleBtn(sp[i].x, sp[i].y, skillRadius, skillColors[i], skillHighlights[i], `${i + 1}`, () => this.onSkill?.(i));
      this.skillButtons.push(btn);
      this.addChild(btn);

      // Cooldown overlay (pie chart style)
      const cdOverlay = new Graphics();
      cdOverlay.x = sp[i].x;
      cdOverlay.y = sp[i].y;
      cdOverlay.alpha = 0;
      this.addChild(cdOverlay);
      this.cooldownOverlays.push(cdOverlay);

      // Cooldown text
      const cdText = new Text({
        text: '',
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 10, fill: 0xffffff, fontWeight: 'bold' }),
      });
      cdText.anchor.set(0.5);
      cdText.x = sp[i].x;
      cdText.y = sp[i].y;
      cdText.alpha = 0;
      this.addChild(cdText);
      this.cooldownTexts.push(cdText);
    }

    // Ultimate button — slightly larger
    this.ultButton = this.createCircleBtn(0, -90, 28, 0x997711, 0xccbb33, 'ULT', () => this.onUltimate?.());
    this.addChild(this.ultButton);
  }

  private skillPositions(): Array<{ x: number; y: number }> {
    // Positions scaled for better spacing and larger buttons
    return [
      { x: -64, y: -26 },
      { x: -32, y: -62 },
      { x: 28, y: -62 },
      { x: 60, y: -26 },
    ];
  }

  private handleMainButton(): void {
    if (this._currentMode === 'attack') {
      this.onAttack?.();
    } else {
      this.onInteract?.(this._currentMode);
    }
  }

  setMode(mode: ActionMode): void {
    if (mode === this._currentMode) return;
    this._currentMode = mode;

    const configs: Record<ActionMode, { label: string; bg: number; border: number; fontSize: number }> = {
      attack: { label: 'ATK', bg: 0xcc2222, border: 0xdd4444, fontSize: 16 },
      talk:   { label: 'Parler', bg: 0x2277aa, border: 0x44aacc, fontSize: 12 },
      enter:  { label: 'Entrer', bg: 0x22aa55, border: 0x44dd77, fontSize: 12 },
      loot:   { label: 'Prendre', bg: 0xaa8822, border: 0xddbb44, fontSize: 11 },
    };

    const cfg = configs[mode];
    if (this.atkText) {
      this.atkText.text = cfg.label;
      this.atkText.style.fontSize = cfg.fontSize;
    }

    // Redraw the attack button bg
    if (this.atkBg) {
      this.atkBg.clear();
      const radius = 34;
      this.atkBg.circle(0, 0, radius).fill({ color: cfg.bg, alpha: UI_ALPHA.buttonBg });
      this.atkBg.circle(0, 0, radius).stroke({ color: cfg.border, width: 2.5, alpha: 0.9 });
      // Glossy top highlight
      this.atkBg.ellipse(0, -radius * 0.25, radius * 0.65, radius * 0.35).fill({ color: 0xffffff, alpha: 0.14 });
    }

    // Smooth bounce animation using Ticker-compatible approach
    this.atkButton.scale.set(1.2);
    const bounceBack = () => {
      this.atkButton.scale.x += (1 - this.atkButton.scale.x) * 0.25;
      this.atkButton.scale.y += (1 - this.atkButton.scale.y) * 0.25;
      if (Math.abs(1 - this.atkButton.scale.x) > 0.005) requestAnimationFrame(bounceBack);
      else this.atkButton.scale.set(1);
    };
    requestAnimationFrame(bounceBack);
  }

  private createCircleBtn(
    x: number, y: number, radius: number,
    bgColor: number, highlightColor: number,
    label: string, onClick: () => void,
  ): Container {
    const container = new Container();
    container.x = x;
    container.y = y;

    // Soft shadow
    const shadow = new Graphics();
    shadow.circle(2, 3, radius + 1).fill({ color: 0x000000, alpha: 0.25 });
    container.addChild(shadow);

    // Main circle — higher alpha for better visibility
    const bg = new Graphics();
    bg.circle(0, 0, radius).fill({ color: bgColor, alpha: UI_ALPHA.buttonBg });
    bg.circle(0, 0, radius).stroke({ color: highlightColor, width: 2.5, alpha: 0.9 });
    // Glossy top highlight
    bg.ellipse(0, -radius * 0.25, radius * 0.65, radius * 0.35).fill({ color: 0xffffff, alpha: 0.14 });
    container.addChild(bg);

    // Track attack button bg for mode switching
    if (label === 'ATK') {
      this.atkBg = bg;
    }

    const txt = new Text({
      text: label,
      style: new TextStyle({
        fontFamily: 'sans-serif',
        fontSize: label === 'ATK' ? 16 : Math.max(12, radius * 0.5),
        fill: UI_COLORS.textPrimary,
        fontWeight: 'bold',
      }),
    });
    txt.anchor.set(0.5);
    container.addChild(txt);

    if (label === 'ATK') {
      this.atkText = txt;
    }

    // Expand hit area for touch
    container.eventMode = 'static';
    container.hitArea = {
      contains: (hx: number, hy: number) => hx * hx + hy * hy <= (radius * 1.4) ** 2,
    };

    container.on('pointerdown', () => {
      container.scale.set(0.9);
      onClick();
    });
    container.on('pointerup', () => { container.scale.set(1); });
    container.on('pointerupoutside', () => { container.scale.set(1); });

    return container;
  }

  setSkill(index: number, skillID: string, label: string): void {
    if (index >= 4) return;
    if (!this.slots[index]) {
      this.slots[index] = { skillID, iconLabel: label, cooldown: 0, maxCooldown: 0 };
    } else {
      this.slots[index].skillID = skillID;
      this.slots[index].iconLabel = label;
    }
    const txt = this.skillButtons[index].children[2] as Text;
    txt.text = label;
  }

  startCooldown(index: number, duration: number): void {
    if (!this.slots[index]) return;
    this.slots[index].cooldown = duration;
    this.slots[index].maxCooldown = duration;
  }

  update(dt: number): void {
    const sp = this.skillPositions();
    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[i];
      if (!slot) continue;

      if (slot.cooldown <= 0) {
        this.skillButtons[i].alpha = 1;
        this.cooldownOverlays[i].alpha = 0;
        this.cooldownTexts[i].alpha = 0;
        continue;
      }

      slot.cooldown -= dt / 60;
      if (slot.cooldown <= 0) {
        slot.cooldown = 0;
        this.skillButtons[i].alpha = 1;
        this.cooldownOverlays[i].alpha = 0;
        this.cooldownTexts[i].alpha = 0;

        // Flash ready effect
        this.skillButtons[i].scale.set(1.15);
        const snapBack = () => {
          this.skillButtons[i].scale.x += (1 - this.skillButtons[i].scale.x) * 0.3;
          this.skillButtons[i].scale.y += (1 - this.skillButtons[i].scale.y) * 0.3;
          if (Math.abs(1 - this.skillButtons[i].scale.x) > 0.01) requestAnimationFrame(snapBack);
          else this.skillButtons[i].scale.set(1);
        };
        requestAnimationFrame(snapBack);
      } else {
        // Visual cooldown: darken + pie overlay
        this.skillButtons[i].alpha = 0.5;

        const pct = slot.cooldown / slot.maxCooldown;
        const r = 24;
        const overlay = this.cooldownOverlays[i];
        overlay.clear();
        overlay.alpha = 0.55;

        // Pie sweep showing remaining cooldown
        const startAngle = -Math.PI / 2;
        const endAngle = startAngle + Math.PI * 2 * pct;
        overlay.moveTo(0, 0);
        overlay.arc(0, 0, r, startAngle, endAngle);
        overlay.lineTo(0, 0);
        overlay.fill({ color: 0x000000, alpha: 0.6 });

        // Cooldown text
        const cdText = this.cooldownTexts[i];
        cdText.text = `${Math.ceil(slot.cooldown)}`;
        cdText.alpha = 1;
      }
    }
  }
}
