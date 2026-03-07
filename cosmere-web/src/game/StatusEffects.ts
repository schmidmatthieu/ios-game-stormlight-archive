import { Container, Graphics, Text, TextStyle } from 'pixi.js';

// ─── Status Effect Definitions ───────────────────────────────────

export interface ActiveStatusEffect {
  type: StatusType;
  duration: number;   // Remaining seconds
  magnitude: number;  // Effect strength
  timer: number;      // Tick timer for periodic effects
}

export type StatusType =
  | 'poison' | 'burning' | 'frozen' | 'stunned'
  | 'shielded' | 'haste' | 'strengthened' | 'regenerating'
  | 'blinded' | 'weakened';

interface StatusDef {
  name: string;
  icon: string;
  color: number;
  tickInterval: number; // 0 = no tick, just duration
  isDebuff: boolean;
}

const STATUS_DEFS: Record<StatusType, StatusDef> = {
  poison:        { name: 'Empoisonné',  icon: '☠', color: 0x44cc44, tickInterval: 1, isDebuff: true },
  burning:       { name: 'Brûlure',     icon: '🔥', color: 0xff6622, tickInterval: 0.8, isDebuff: true },
  frozen:        { name: 'Gelé',        icon: '❄', color: 0x66ccff, tickInterval: 0, isDebuff: true },
  stunned:       { name: 'Étourdi',     icon: '💫', color: 0xffee44, tickInterval: 0, isDebuff: true },
  shielded:      { name: 'Bouclier',    icon: '🛡', color: 0x4488ff, tickInterval: 0, isDebuff: false },
  haste:         { name: 'Hâte',        icon: '⚡', color: 0xffcc44, tickInterval: 0, isDebuff: false },
  strengthened:  { name: 'Renforcé',    icon: '💪', color: 0xff4444, tickInterval: 0, isDebuff: false },
  regenerating:  { name: 'Régénération',icon: '💚', color: 0x44ff66, tickInterval: 1.5, isDebuff: false },
  blinded:       { name: 'Aveuglé',     icon: '👁', color: 0x888888, tickInterval: 0, isDebuff: true },
  weakened:      { name: 'Affaibli',    icon: '📉', color: 0x886644, tickInterval: 0, isDebuff: true },
};

// ─── Status Effect Manager ───────────────────────────────────────

export class StatusEffectManager {
  effects: ActiveStatusEffect[] = [];

  apply(type: StatusType, duration: number, magnitude: number): string | null {
    // Check if same type already active - refresh duration
    const existing = this.effects.find(e => e.type === type);
    if (existing) {
      existing.duration = Math.max(existing.duration, duration);
      existing.magnitude = Math.max(existing.magnitude, magnitude);
      return null;
    }

    this.effects.push({ type, duration, magnitude, timer: 0 });
    const def = STATUS_DEFS[type];
    return `${def.icon} ${def.name}!`;
  }

  remove(type: StatusType): void {
    this.effects = this.effects.filter(e => e.type !== type);
  }

  has(type: StatusType): boolean {
    return this.effects.some(e => e.type === type);
  }

  /** Returns { damagePerTick, healPerTick, expired[] } */
  update(dt: number): { damagePerTick: number; healPerTick: number; expired: StatusType[] } {
    let damagePerTick = 0;
    let healPerTick = 0;
    const expired: StatusType[] = [];

    for (const effect of this.effects) {
      effect.duration -= dt;
      if (effect.duration <= 0) {
        expired.push(effect.type);
        continue;
      }

      const def = STATUS_DEFS[effect.type];
      if (def.tickInterval > 0) {
        effect.timer += dt;
        if (effect.timer >= def.tickInterval) {
          effect.timer -= def.tickInterval;
          switch (effect.type) {
            case 'poison': damagePerTick += effect.magnitude; break;
            case 'burning': damagePerTick += effect.magnitude * 1.5; break;
            case 'regenerating': healPerTick += effect.magnitude; break;
          }
        }
      }
    }

    // Remove expired
    this.effects = this.effects.filter(e => e.duration > 0);
    return { damagePerTick, healPerTick, expired };
  }

  // ─── Stat Modifiers ─────────────────────────────────────────

  getSpeedMultiplier(): number {
    let mult = 1;
    if (this.has('frozen')) mult *= 0;
    if (this.has('stunned')) mult *= 0;
    if (this.has('haste')) mult *= 1.4;
    return mult;
  }

  getDamageMultiplier(): number {
    let mult = 1;
    if (this.has('strengthened')) mult *= 1.5;
    if (this.has('weakened')) mult *= 0.6;
    return mult;
  }

  getDamageReduction(): number {
    if (this.has('shielded')) return 0.4; // 40% reduction
    return 0;
  }

  getDetectionReduction(): number {
    if (this.has('blinded')) return 0.5; // 50% less detection
    return 0;
  }

  clear(): void {
    this.effects = [];
  }
}

// ─── Status Effect Icons HUD ─────────────────────────────────────

export function createStatusBar(
  uiContainer: Container,
  screenW: number,
): { container: Container; update: (effects: ActiveStatusEffect[]) => void } {
  const container = new Container();
  container.zIndex = 7000;

  const startX = 12;
  const startY = 70; // Below HUD

  uiContainer.addChild(container);

  function update(effects: ActiveStatusEffect[]): void {
    container.removeChildren();

    effects.forEach((effect, i) => {
      const def = STATUS_DEFS[effect.type];
      const x = startX + i * 24;
      const y = startY;

      // Icon background
      const bg = new Graphics();
      bg.roundRect(x, y, 20, 20, 4)
        .fill({ color: 0x0a0a1a, alpha: 0.7 })
        .stroke({ color: def.color, width: 1, alpha: 0.6 });
      container.addChild(bg);

      // Duration bar (bottom of icon)
      const maxDur = effect.duration + 0.01;
      const durPct = Math.min(1, effect.duration / Math.max(maxDur, 3));
      const durBar = new Graphics();
      durBar.roundRect(x + 2, y + 17, 16 * durPct, 2, 1).fill({ color: def.color, alpha: 0.8 });
      container.addChild(durBar);

      // Icon text
      const icon = new Text({
        text: def.icon,
        style: new TextStyle({ fontSize: 11 }),
      });
      icon.anchor.set(0.5);
      icon.x = x + 10;
      icon.y = y + 9;
      container.addChild(icon);
    });
  }

  return { container, update };
}

// ─── Visual Particle Effects for Status ──────────────────────────

export function spawnStatusParticle(
  worldContainer: Container,
  x: number, y: number,
  type: StatusType,
): void {
  const def = STATUS_DEFS[type];
  const g = new Graphics();
  g.zIndex = 100000;

  switch (type) {
    case 'poison':
      g.circle(0, 0, 2).fill({ color: 0x44cc44, alpha: 0.6 });
      break;
    case 'burning':
      g.poly([{ x: 0, y: -4 }, { x: 2, y: 2 }, { x: -2, y: 2 }]).fill({ color: 0xff6622, alpha: 0.7 });
      break;
    case 'frozen':
      g.star(0, 0, 6, 3, 1.5).fill({ color: 0x88ddff, alpha: 0.5 });
      break;
    case 'regenerating':
      g.circle(0, 0, 1.5).fill({ color: 0x44ff66, alpha: 0.6 });
      break;
    case 'shielded':
      g.circle(0, 0, 2).fill({ color: 0x4488ff, alpha: 0.3 });
      break;
    default:
      g.circle(0, 0, 1.5).fill({ color: def.color, alpha: 0.5 });
      break;
  }

  const offsetX = (Math.random() - 0.5) * 16;
  g.x = x + offsetX;
  g.y = y - 5;
  worldContainer.addChild(g);

  let elapsed = 0;
  let seLast = performance.now();
  const anim = () => {
    if (g.destroyed) return;
    const now = performance.now();
    const dtSec = (now - seLast) / 1000;
    seLast = now;
    elapsed += dtSec;
    g.y -= 0.5;
    g.x += (Math.random() - 0.5) * 0.5;
    g.alpha = Math.max(0, 0.6 - elapsed);
    if (elapsed < 0.6) requestAnimationFrame(anim);
    else g.destroy();
  };
  requestAnimationFrame(anim);
}
