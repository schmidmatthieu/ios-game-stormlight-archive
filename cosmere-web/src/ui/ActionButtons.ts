import { Container, Graphics, Text, TextStyle } from 'pixi.js';

export interface SkillSlotData {
  skillID: string;
  iconLabel: string;
  cooldown: number;
  maxCooldown: number;
}

export class ActionButtons extends Container {
  private atkButton: Container;
  private skillButtons: Container[] = [];
  private ultButton: Container;
  private slots: SkillSlotData[] = [];

  // Callbacks
  onAttack: (() => void) | null = null;
  onSkill: ((index: number) => void) | null = null;
  onUltimate: (() => void) | null = null;

  constructor() {
    super();

    // Attack button (big, center)
    this.atkButton = this.createCircleBtn(0, 0, 30, 0xcc2222, 0xdd3333, 'ATK', () => this.onAttack?.());
    this.addChild(this.atkButton);

    // 4 Skill buttons in arc
    const positions = [
      { x: -58, y: -22 },
      { x: -28, y: -52 },
      { x: 28, y: -52 },
      { x: 58, y: -22 },
    ];

    for (let i = 0; i < 4; i++) {
      const btn = this.createCircleBtn(positions[i].x, positions[i].y, 21, 0x222244, 0x333366, `${i + 1}`, () => this.onSkill?.(i));
      this.skillButtons.push(btn);
      this.addChild(btn);
    }

    // Ultimate button
    this.ultButton = this.createCircleBtn(0, -78, 24, 0x554400, 0x776611, 'ULT', () => this.onUltimate?.());
    this.addChild(this.ultButton);
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
    bg.circle(0, 0, radius)
      .fill({ color: bgColor, alpha: 0.75 });

    // Border
    bg.circle(0, 0, radius)
      .stroke({ color: 0xaa8833, width: 2, alpha: 0.6 });

    // Inner highlight (top half shine)
    bg.ellipse(0, -radius * 0.25, radius * 0.7, radius * 0.4)
      .fill({ color: highlightColor, alpha: 0.2 });

    container.addChild(bg);

    const txt = new Text({
      text: label,
      style: new TextStyle({
        fontFamily: 'sans-serif',
        fontSize: radius * 0.55,
        fill: 0xffeedd,
        fontWeight: 'bold',
      }),
    });
    txt.anchor.set(0.5);
    container.addChild(txt);

    container.eventMode = 'static';
    container.on('pointerdown', () => {
      container.scale.set(0.88);
      bg.tint = 0xffffff;
      onClick();
    });
    container.on('pointerup', () => {
      container.scale.set(1);
      bg.tint = 0xffffff;
    });
    container.on('pointerupoutside', () => {
      container.scale.set(1);
      bg.tint = 0xffffff;
    });

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
      slot.cooldown -= dt / 60;
      if (slot.cooldown <= 0) {
        slot.cooldown = 0;
        this.skillButtons[i].alpha = 1;
      } else {
        this.skillButtons[i].alpha = 0.35;
      }
    }
  }
}
