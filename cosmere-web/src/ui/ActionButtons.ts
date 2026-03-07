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

    // Attack button (big, center-right)
    this.atkButton = this.createCircleBtn(0, 0, 28, 0xcc3333, 'ATK', () => this.onAttack?.());
    this.addChild(this.atkButton);

    // 4 Skill buttons in arc
    const positions = [
      { x: -55, y: -25 },   // Skill 1
      { x: -25, y: -50 },   // Skill 2
      { x: 25, y: -50 },    // Skill 3
      { x: 55, y: -25 },    // Skill 4
    ];

    for (let i = 0; i < 4; i++) {
      const btn = this.createCircleBtn(positions[i].x, positions[i].y, 20, 0x333366, `${i + 1}`, () => this.onSkill?.(i));
      (btn as any)._cdOverlay = null;
      (btn as any)._cdText = null;
      this.skillButtons.push(btn);
      this.addChild(btn);
    }

    // Ultimate button
    this.ultButton = this.createCircleBtn(0, -75, 22, 0x665500, 'ULT', () => this.onUltimate?.());
    this.addChild(this.ultButton);
  }

  private createCircleBtn(x: number, y: number, radius: number, color: number, label: string, onClick: () => void): Container {
    const container = new Container();
    container.x = x;
    container.y = y;

    const bg = new Graphics();
    bg.circle(0, 0, radius)
      .fill({ color, alpha: 0.7 })
      .stroke({ color: 0x998033, width: 2 });
    container.addChild(bg);

    const txt = new Text({
      text: label,
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: radius * 0.6, fill: 0xffffff, fontWeight: 'bold' }),
    });
    txt.anchor.set(0.5);
    container.addChild(txt);

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
    // Update button label
    const txt = this.skillButtons[index].children[1] as Text;
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
        this.skillButtons[i].alpha = 0.4;
      }
    }
  }
}
