import { Container, Graphics, Text, TextStyle } from 'pixi.js';

// ─── Combo Chain System ──────────────────────────────────────

export interface ComboState {
  count: number;
  timer: number;
  maxTimer: number;
  damageMultiplier: number;
  highestCombo: number;
}

const COMBO_WINDOW = 2.5; // seconds to maintain combo
const MAX_COMBO_MULTIPLIER = 3.0;

export class ComboManager {
  private static _instance: ComboManager;
  static get shared(): ComboManager {
    if (!this._instance) this._instance = new ComboManager();
    return this._instance;
  }

  count = 0;
  timer = 0;
  highestCombo = 0;
  private comboBreakCallback: (() => void) | null = null;

  registerHit(): { combo: number; multiplier: number; isNew: boolean } {
    const wasZero = this.count === 0;
    this.count++;
    this.timer = COMBO_WINDOW;

    if (this.count > this.highestCombo) {
      this.highestCombo = this.count;
    }

    return {
      combo: this.count,
      multiplier: this.getDamageMultiplier(),
      isNew: !wasZero && this.count > 1,
    };
  }

  getDamageMultiplier(): number {
    if (this.count <= 1) return 1.0;
    // Logarithmic scaling: combo 2 = 1.2x, combo 5 = 1.7x, combo 10 = 2.3x, combo 20 = 3.0x
    return Math.min(MAX_COMBO_MULTIPLIER, 1.0 + Math.log2(this.count) * 0.3);
  }

  getComboTier(): 'none' | 'basic' | 'good' | 'great' | 'excellent' | 'legendary' {
    if (this.count < 2) return 'none';
    if (this.count < 5) return 'basic';
    if (this.count < 10) return 'good';
    if (this.count < 20) return 'great';
    if (this.count < 35) return 'excellent';
    return 'legendary';
  }

  update(dt: number): boolean {
    if (this.count > 0) {
      this.timer -= dt;
      if (this.timer <= 0) {
        const hadCombo = this.count >= 3;
        this.count = 0;
        this.timer = 0;
        if (hadCombo && this.comboBreakCallback) this.comboBreakCallback();
        return hadCombo; // Returns true if combo just broke
      }
    }
    return false;
  }

  onComboBreak(callback: () => void): void {
    this.comboBreakCallback = callback;
  }

  get timerPercent(): number {
    return this.count > 0 ? this.timer / COMBO_WINDOW : 0;
  }

  reset(): void {
    this.count = 0;
    this.timer = 0;
  }
}

// ─── Combo HUD Display ──────────────────────────────────────

const TIER_COLORS: Record<string, number> = {
  none: 0x666666,
  basic: 0xcccccc,
  good: 0x44aaff,
  great: 0xffaa44,
  excellent: 0xff4444,
  legendary: 0xff44ff,
};

const TIER_LABELS: Record<string, string> = {
  none: '',
  basic: 'Combo',
  good: 'Bon Combo!',
  great: 'Super Combo!',
  excellent: 'Excellent!',
  legendary: 'LÉGENDAIRE!',
};

export function createComboDisplay(
  uiContainer: Container,
  screenW: number, screenH: number,
): { update: () => void } {
  const container = new Container();
  container.zIndex = 950;
  container.x = screenW - 90;
  container.y = screenH / 2 - 40;
  uiContainer.addChild(container);

  const comboText = new Text({
    text: '',
    style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 16, fontWeight: 'bold', fill: 0xffffff }),
  });
  comboText.anchor.set(0.5);
  container.addChild(comboText);

  const tierText = new Text({
    text: '',
    style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 8, fontWeight: 'bold', fill: 0xffffff }),
  });
  tierText.anchor.set(0.5);
  tierText.y = 16;
  container.addChild(tierText);

  const multText = new Text({
    text: '',
    style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 7, fill: 0xaaaaaa }),
  });
  multText.anchor.set(0.5);
  multText.y = 28;
  container.addChild(multText);

  // Timer bar
  const timerBarBg = new Graphics();
  timerBarBg.roundRect(-25, 36, 50, 4, 2).fill({ color: 0x222233, alpha: 0.5 });
  container.addChild(timerBarBg);

  const timerBarFill = new Graphics();
  container.addChild(timerBarFill);

  let prevCombo = 0;
  let scaleAnim = 0;

  return {
    update() {
      const cm = ComboManager.shared;
      const combo = cm.count;
      const tier = cm.getComboTier();

      if (combo < 2) {
        container.alpha = 0;
        prevCombo = combo;
        return;
      }

      container.alpha = 1;
      const color = TIER_COLORS[tier];

      // Scale pop on new hit
      if (combo !== prevCombo) {
        scaleAnim = 1.5;
        prevCombo = combo;
      }
      scaleAnim = Math.max(1.0, scaleAnim - 0.05);
      comboText.scale.set(scaleAnim);

      comboText.text = `${combo}`;
      comboText.style.fill = color;

      tierText.text = TIER_LABELS[tier];
      tierText.style.fill = color;

      const mult = cm.getDamageMultiplier();
      multText.text = `×${mult.toFixed(1)} dégâts`;

      // Timer bar
      timerBarFill.clear();
      const fillW = 50 * cm.timerPercent;
      if (fillW > 0) {
        timerBarFill.roundRect(-25, 36, fillW, 4, 2).fill({ color, alpha: 0.7 });
      }

      // Shake effect for high combos
      if (tier === 'excellent' || tier === 'legendary') {
        container.x = screenW - 90 + (Math.random() - 0.5) * 2;
      } else {
        container.x = screenW - 90;
      }
    },
  };
}
