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

export class FloatingDamageManager {
  private numbers: FloatingNumber[] = [];
  private worldContainer: Container;

  constructor(worldContainer: Container) {
    this.worldContainer = worldContainer;
  }

  spawn(
    x: number, y: number,
    amount: number | string,
    style: DamageStyle = 'normal',
    comboCount = 0,
  ): void {
    const cfg = STYLE_CONFIG[style];
    const container = new Container();
    container.zIndex = 100001;

    const displayText = `${cfg.prefix}${amount}${cfg.suffix}`;

    // Main text
    const txt = new Text({
      text: displayText,
      style: new TextStyle({
        fontFamily: cfg.fontFamily,
        fontSize: cfg.fontSize,
        fill: cfg.color,
        fontWeight: 'bold',
        dropShadow: { color: 0x000000, blur: 3, distance: 1 },
      }),
    });
    txt.anchor.set(0.5);
    container.addChild(txt);

    // Crit: add outline glow
    if (style === 'crit') {
      const glow = new Graphics();
      glow.circle(0, 0, 14).fill({ color: 0xffee44, alpha: 0.2 });
      container.addChildAt(glow, 0);
    }

    // Combo: add multiplier label
    if (style === 'combo' && comboCount > 0) {
      const comboLabel = new Text({
        text: `×${comboCount}`,
        style: new TextStyle({
          fontFamily: 'sans-serif', fontSize: 7,
          fill: 0xddaaff, fontWeight: 'bold',
        }),
      });
      comboLabel.anchor.set(0.5);
      comboLabel.y = 10;
      container.addChild(comboLabel);
    }

    // Position with random offset
    const ox = (Math.random() - 0.5) * 24;
    container.x = x + ox;
    container.y = y;

    this.worldContainer.addChild(container);

    // Velocity based on style
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

    this.numbers.push({
      container,
      x: container.x,
      y: container.y,
      vx, vy,
      elapsed: 0,
      duration: cfg.duration,
      style,
      scale: style === 'crit' ? 2.0 : 1.0,
      targetScale: 1.0,
      rotation: 0,
      rotSpeed,
    });
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
        n.vy += 120 * dt; // gravity pull
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

      // Remove when done
      if (progress >= 1) {
        n.container.destroy({ children: true });
        this.numbers.splice(i, 1);
      }
    }
  }

  clear(): void {
    for (const n of this.numbers) {
      n.container.destroy({ children: true });
    }
    this.numbers.length = 0;
  }
}
