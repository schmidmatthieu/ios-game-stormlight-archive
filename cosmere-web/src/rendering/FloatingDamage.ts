import { Container, Graphics, Text, TextStyle } from 'pixi.js';

// ─── Floating Damage Number System ──────────────────────────────

export type DamageStyle =
  | 'normal'     // White, floats up
  | 'crit'       // Large gold, bounces up with shake
  | 'combo'      // Purple, arcs sideways
  | 'heal'       // Green, floats up with + prefix
  | 'xp'         // Blue-green, drifts up gently
  | 'gold'       // Gold, fountain arc
  | 'poison'     // Sickly green, wobbles
  | 'block'      // Gray, short bounce
  | 'bonus'      // Cyan, sparkle effect
  | 'investiture' // Blue-violet, rises with glow

interface FloatingNumber {
  container: Container;
  mainText: Text;
  glowGfx: Graphics | null;
  comboLabel: Text | null;
  x: number;
  y: number;
  vx: number;
  vy: number;
  elapsed: number;
  duration: number;
  style: DamageStyle;
  scale: number;
  targetScale: number;
  rotation: number;
  rotSpeed: number;
}

const STYLE_CONFIG: Record<DamageStyle, {
  color: number; fontSize: number; prefix: string; suffix: string;
  duration: number; gravity: number; fontFamily: string;
}> = {
  normal:       { color: 0xffffff, fontSize: 12, prefix: '', suffix: '', duration: 0.8, gravity: -60, fontFamily: 'sans-serif' },
  crit:         { color: 0xffee44, fontSize: 20, prefix: '', suffix: '!', duration: 1.2, gravity: -80, fontFamily: 'Georgia, serif' },
  combo:        { color: 0xcc77ff, fontSize: 14, prefix: '', suffix: '', duration: 0.9, gravity: -40, fontFamily: 'sans-serif' },
  heal:         { color: 0x44ff66, fontSize: 12, prefix: '+', suffix: '', duration: 0.9, gravity: -50, fontFamily: 'sans-serif' },
  xp:           { color: 0x66cc44, fontSize: 10, prefix: '+', suffix: ' XP', duration: 1.0, gravity: -30, fontFamily: 'sans-serif' },
  gold:         { color: 0xeedd33, fontSize: 10, prefix: '+', suffix: ' ⚜', duration: 1.0, gravity: -20, fontFamily: 'sans-serif' },
  poison:       { color: 0x88cc22, fontSize: 11, prefix: '', suffix: '', duration: 0.7, gravity: -30, fontFamily: 'sans-serif' },
  block:        { color: 0x888888, fontSize: 10, prefix: '', suffix: '', duration: 0.5, gravity: -40, fontFamily: 'sans-serif' },
  bonus:        { color: 0x44ddff, fontSize: 13, prefix: '+', suffix: '', duration: 1.0, gravity: -50, fontFamily: 'sans-serif' },
  investiture:  { color: 0x8866ff, fontSize: 12, prefix: '+', suffix: '', duration: 1.0, gravity: -45, fontFamily: 'sans-serif' },
};

// Pre-create TextStyle objects to avoid per-spawn allocations
const TEXT_STYLES = new Map<DamageStyle, TextStyle>();
for (const [key, cfg] of Object.entries(STYLE_CONFIG)) {
  TEXT_STYLES.set(key as DamageStyle, new TextStyle({
    fontFamily: cfg.fontFamily,
    fontSize: cfg.fontSize,
    fill: cfg.color,
    fontWeight: 'bold',
    dropShadow: { color: 0x000000, blur: 3, distance: 1 },
  }));
}

const COMBO_STYLE = new TextStyle({
  fontFamily: 'sans-serif', fontSize: 7,
  fill: 0xddaaff, fontWeight: 'bold',
});

export class FloatingDamageManager {
  private numbers: FloatingNumber[] = [];
  private pool: FloatingNumber[] = [];
  private worldContainer: Container;

  constructor(worldContainer: Container) {
    this.worldContainer = worldContainer;
  }

  private acquireNumber(): FloatingNumber {
    if (this.pool.length > 0) {
      const n = this.pool.pop()!;
      n.container.alpha = 1;
      n.container.visible = true;
      n.container.scale.set(1);
      n.container.rotation = 0;
      return n;
    }
    // Create new
    const container = new Container();
    container.zIndex = 100001;
    const mainText = new Text({ text: '', style: TEXT_STYLES.get('normal')! });
    mainText.anchor.set(0.5);
    container.addChild(mainText);

    const glowGfx = new Graphics();
    glowGfx.visible = false;
    container.addChildAt(glowGfx, 0);

    const comboLabel = new Text({ text: '', style: COMBO_STYLE });
    comboLabel.anchor.set(0.5);
    comboLabel.y = 10;
    comboLabel.visible = false;
    container.addChild(comboLabel);

    return {
      container, mainText, glowGfx, comboLabel,
      x: 0, y: 0, vx: 0, vy: 0,
      elapsed: 0, duration: 1, style: 'normal',
      scale: 1, targetScale: 1, rotation: 0, rotSpeed: 0,
    };
  }

  private releaseNumber(n: FloatingNumber): void {
    n.container.removeFromParent();
    n.container.visible = false;
    n.glowGfx!.visible = false;
    n.comboLabel!.visible = false;
    this.pool.push(n);
  }

  spawn(
    x: number, y: number,
    amount: number | string,
    style: DamageStyle = 'normal',
    comboCount = 0,
  ): void {
    const cfg = STYLE_CONFIG[style];
    const n = this.acquireNumber();

    const displayText = `${cfg.prefix}${amount}${cfg.suffix}`;
    n.mainText.text = displayText;
    n.mainText.style = TEXT_STYLES.get(style) ?? TEXT_STYLES.get('normal')!;

    // Crit glow
    if (style === 'crit') {
      n.glowGfx!.clear();
      n.glowGfx!.circle(0, 0, 14).fill({ color: 0xffee44, alpha: 0.2 });
      n.glowGfx!.visible = true;
    } else {
      n.glowGfx!.visible = false;
    }

    // Combo label
    if (style === 'combo' && comboCount > 0) {
      n.comboLabel!.text = `×${comboCount}`;
      n.comboLabel!.visible = true;
    } else {
      n.comboLabel!.visible = false;
    }

    // Position
    const ox = (Math.random() - 0.5) * 24;
    n.container.x = x + ox;
    n.container.y = y;
    n.x = n.container.x;
    n.y = n.container.y;

    this.worldContainer.addChild(n.container);

    // Velocity
    let vx = 0;
    let vy = cfg.gravity;
    let rotSpeed = 0;

    if (style === 'crit') {
      vy = -120;
      vx = (Math.random() - 0.5) * 30;
    } else if (style === 'combo') {
      vx = (Math.random() > 0.5 ? 1 : -1) * (30 + Math.random() * 20);
      vy = -70;
    } else if (style === 'gold') {
      vx = (Math.random() - 0.5) * 40;
      vy = -80;
    } else if (style === 'poison') {
      vx = (Math.random() - 0.5) * 10;
      rotSpeed = (Math.random() - 0.5) * 3;
    } else if (style === 'block') {
      vy = -30;
    }

    n.vx = vx;
    n.vy = vy;
    n.elapsed = 0;
    n.duration = cfg.duration;
    n.style = style;
    n.scale = style === 'crit' ? 2.0 : 1.0;
    n.targetScale = 1.0;
    n.rotation = 0;
    n.rotSpeed = rotSpeed;

    this.numbers.push(n);
  }

  update(dt: number): void {
    for (let i = this.numbers.length - 1; i >= 0; i--) {
      const n = this.numbers[i];
      n.elapsed += dt;

      const progress = n.elapsed / n.duration;

      // Movement
      n.x += n.vx * dt;
      n.y += n.vy * dt;

      // Gravity for arcing styles
      if (n.style === 'gold' || n.style === 'combo') {
        n.vy += 120 * dt;
      }

      // Wobble for poison
      if (n.style === 'poison') {
        n.x += Math.sin(n.elapsed * 12) * 0.5;
        n.rotation += n.rotSpeed * dt;
      }

      // Scale animation
      if (n.style === 'crit') {
        n.scale = n.scale + (n.targetScale - n.scale) * 0.15;
      }

      // Apply
      n.container.x = n.x;
      n.container.y = n.y;
      n.container.rotation = n.rotation;
      n.container.scale.set(n.scale);

      // Fade out in last 30%
      if (progress > 0.7) {
        n.container.alpha = Math.max(0, 1 - (progress - 0.7) / 0.3);
      }

      // Release back to pool when done
      if (progress >= 1) {
        this.releaseNumber(n);
        this.numbers.splice(i, 1);
      }
    }
  }

  clear(): void {
    for (const n of this.numbers) {
      this.releaseNumber(n);
    }
    this.numbers.length = 0;
  }
}
