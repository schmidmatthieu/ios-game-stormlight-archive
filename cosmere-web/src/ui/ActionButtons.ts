import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { getLayoutInfo, actionButtonScale, LayoutInfo } from '../ui/ResponsiveLayout';

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

    // Apply responsive scaling if layout is provided
    if (layout) {
      this.scale.set(actionButtonScale(layout));
    }

    // Attack button (big, center)
    this.atkButton = this.createCircleBtn(0, 0, 32, 0xcc2222, 0xdd3333, 'ATK', () => this.handleMainButton());
    this.addChild(this.atkButton);

    // 4 Skill buttons in arc
    const positions = [
      { x: -60, y: -24 },
      { x: -30, y: -56 },
      { x: 26, y: -56 },
      { x: 56, y: -24 },
    ];
    const skillColors = [0x2244aa, 0x22aa44, 0xaa8822, 0x8822aa];

    for (let i = 0; i < 4; i++) {
      const btn = this.createCircleBtn(positions[i].x, positions[i].y, 22, skillColors[i], skillColors[i] + 0x222222, `${i + 1}`, () => this.onSkill?.(i));
      this.skillButtons.push(btn);
      this.addChild(btn);
    }

    // Ultimate button
    this.ultButton = this.createCircleBtn(0, -82, 26, 0x997711, 0xbbaa33, 'ULT', () => this.onUltimate?.());
    this.addChild(this.ultButton);
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
      attack: { label: 'ATK', bg: 0xcc2222, border: 0xdd3333, fontSize: 15 },
      talk:   { label: 'Parler', bg: 0x2277aa, border: 0x33aadd, fontSize: 11 },
      enter:  { label: 'Entrer', bg: 0x22aa55, border: 0x33dd66, fontSize: 11 },
      loot:   { label: 'Prendre', bg: 0xaa8822, border: 0xddbb33, fontSize: 10 },
    };

    const cfg = configs[mode];
    if (this.atkText) {
      this.atkText.text = cfg.label;
      this.atkText.style.fontSize = cfg.fontSize;
    }

    // Redraw the attack button bg
    if (this.atkBg) {
      this.atkBg.clear();
      const radius = 32;
      this.atkBg.circle(0, 0, radius).fill({ color: cfg.bg, alpha: 0.85 });
      this.atkBg.circle(0, 0, radius).stroke({ color: cfg.border, width: 2.5, alpha: 0.8 });
      this.atkBg.ellipse(0, -radius * 0.25, radius * 0.7, radius * 0.4).fill({ color: 0xffffff, alpha: 0.12 });
    }

    // Bounce animation
    this.atkButton.scale.set(1.15);
    const bounceBack = () => {
      this.atkButton.scale.x += (1 - this.atkButton.scale.x) * 0.3;
      this.atkButton.scale.y += (1 - this.atkButton.scale.y) * 0.3;
      if (Math.abs(1 - this.atkButton.scale.x) > 0.01) requestAnimationFrame(bounceBack);
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

    // Shadow
    const shadow = new Graphics();
    shadow.circle(2, 2, radius).fill({ color: 0x000000, alpha: 0.3 });
    container.addChild(shadow);

    // Main circle
    const bg = new Graphics();
    bg.circle(0, 0, radius).fill({ color: bgColor, alpha: 0.85 });
    bg.circle(0, 0, radius).stroke({ color: highlightColor, width: 2.5, alpha: 0.8 });
    bg.ellipse(0, -radius * 0.25, radius * 0.7, radius * 0.4).fill({ color: 0xffffff, alpha: 0.12 });
    container.addChild(bg);

    // Track attack button bg for mode switching
    if (label === 'ATK') {
      this.atkBg = bg;
    }

    const txt = new Text({
      text: label,
      style: new TextStyle({
        fontFamily: 'sans-serif',
        fontSize: label === 'ATK' ? 15 : radius * 0.55,
        fill: 0xffeedd,
        fontWeight: 'bold',
      }),
    });
    txt.anchor.set(0.5);
    container.addChild(txt);

    if (label === 'ATK') {
      this.atkText = txt;
    }

    container.eventMode = 'static';
    container.on('pointerdown', () => {
      container.scale.set(0.88);
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
    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[i];
      if (!slot || slot.cooldown <= 0) continue;
      slot.cooldown -= dt;
      if (slot.cooldown <= 0) {
        slot.cooldown = 0;
        this.skillButtons[i].alpha = 1;
      } else {
        this.skillButtons[i].alpha = 0.35;
      }
    }
  }
}
