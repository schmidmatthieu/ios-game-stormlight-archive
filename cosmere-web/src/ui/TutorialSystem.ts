/**
 * TutorialSystem — Guide interactif pas-à-pas pour les nouveaux joueurs.
 * Affiche un overlay avec spotlight sur les éléments UI concernés.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { getLayoutInfo, scaled, fontSize, panelRadius, UI_COLORS, UI_ALPHA, touchTarget } from '../ui/ResponsiveLayout';
import type { LayoutInfo } from '../ui/ResponsiveLayout';

const STORAGE_KEY = 'cosmere_tutorial';

interface TutorialStep {
  text: string;
  highlightRect?: { x: number; y: number; w: number; h: number };
  position: 'center' | 'top' | 'bottom';
}

type StepBuilder = (sw: number, sh: number, layout: LayoutInfo) => TutorialStep;

const STEP_BUILDERS: StepBuilder[] = [
  // Step 1: Welcome
  (_sw, _sh) => ({
    text: 'Bienvenue dans le Cosmere !\nVous incarnez un Salteur voyageant entre les mondes.',
    position: 'center',
  }),
  // Step 2: Joystick
  (sw, sh, layout) => ({
    text: 'Utilisez le joystick pour vous déplacer.',
    highlightRect: {
      x: 0,
      y: sh - scaled(180, layout),
      w: scaled(180, layout),
      h: scaled(180, layout),
    },
    position: 'top',
  }),
  // Step 3: Attack button
  (sw, sh, layout) => ({
    text: 'Appuyez sur ATK pour attaquer les ennemis proches.',
    highlightRect: {
      x: sw - scaled(160, layout),
      y: sh - scaled(160, layout),
      w: scaled(160, layout),
      h: scaled(160, layout),
    },
    position: 'top',
  }),
  // Step 4: Skill buttons
  (sw, sh, layout) => ({
    text: 'Vos compétences magiques sont ici.\nChaque sort a un cooldown.',
    highlightRect: {
      x: sw - scaled(220, layout),
      y: sh - scaled(260, layout),
      w: scaled(220, layout),
      h: scaled(100, layout),
    },
    position: 'top',
  }),
  // Step 5: HUD bars (top-left)
  (sw, _sh, layout) => ({
    text: 'Vos PV et Investiture sont affichés en haut à gauche.',
    highlightRect: {
      x: 0,
      y: 0,
      w: scaled(200, layout),
      h: scaled(60, layout),
    },
    position: 'bottom',
  }),
  // Step 6: Toolbar / hamburger (top-right)
  (sw, _sh, layout) => ({
    text: 'Ouvrez le menu pour accéder à l\'inventaire,\ntalents, quêtes et plus.',
    highlightRect: {
      x: sw - scaled(160, layout),
      y: 0,
      w: scaled(160, layout),
      h: scaled(50, layout),
    },
    position: 'bottom',
  }),
  // Step 7: Minimap
  (_sw, sh, layout) => ({
    text: 'La minimap montre votre position et les ennemis.',
    highlightRect: {
      x: 0,
      y: sh - scaled(360, layout),
      w: scaled(120, layout),
      h: scaled(120, layout),
    },
    position: 'top',
  }),
  // Step 8: Farewell
  (_sw, _sh) => ({
    text: 'Explorez, combattez, et accomplissez des quêtes\npour progresser. Bonne aventure !',
    position: 'center',
  }),
];

export class TutorialManager {
  static readonly shared = new TutorialManager();

  private overlay: Container | null = null;
  private currentStep = 0;
  private uiContainer: Container | null = null;
  private screenW = 0;
  private screenH = 0;

  private constructor() {}

  isComplete(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'done';
    } catch {
      return false;
    }
  }

  reset(): void {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
  }

  startTutorial(uiContainer: Container, screenW: number, screenH: number): void {
    if (this.isComplete()) return;
    this.uiContainer = uiContainer;
    this.screenW = screenW;
    this.screenH = screenH;
    this.currentStep = 0;
    this.showStep();
  }

  private showStep(): void {
    this.clearOverlay();
    if (!this.uiContainer) return;
    if (this.currentStep >= STEP_BUILDERS.length) {
      this.completeTutorial();
      return;
    }

    const layout = getLayoutInfo(this.screenW, this.screenH);
    const step = STEP_BUILDERS[this.currentStep](this.screenW, this.screenH, layout);

    this.overlay = new Container();
    this.overlay.eventMode = 'static';
    this.overlay.interactiveChildren = true;

    // Dark backdrop with optional cutout
    const backdrop = this.buildBackdrop(step.highlightRect, layout);
    this.overlay.addChild(backdrop);

    // Text panel
    const panel = this.buildPanel(step, layout);
    this.overlay.addChild(panel);

    this.uiContainer.addChild(this.overlay);
  }

  private buildBackdrop(
    highlight: TutorialStep['highlightRect'],
    _layout: LayoutInfo,
  ): Graphics {
    const g = new Graphics();
    const sw = this.screenW;
    const sh = this.screenH;

    if (highlight) {
      const { x, y, w, h } = highlight;
      const pad = 6;
      // Draw full-screen rect, then cut out the highlight region
      g.rect(0, 0, sw, sh);
      g.cut();
      g.rect(x - pad, y - pad, w + pad * 2, h + pad * 2);
      g.cut();
      // Re-draw to create the "inverted" mask effect
      g.rect(0, 0, sw, y - pad);
      g.rect(0, y - pad, x - pad, h + pad * 2);
      g.rect(x + w + pad, y - pad, sw - (x + w + pad), h + pad * 2);
      g.rect(0, y + h + pad, sw, sh - (y + h + pad));
      g.fill({ color: UI_COLORS.overlayDark, alpha: UI_ALPHA.overlay });

      // Highlight border
      g.roundRect(x - pad, y - pad, w + pad * 2, h + pad * 2, 8);
      g.stroke({ color: UI_COLORS.textGold, width: 2, alpha: 0.8 });
    } else {
      g.rect(0, 0, sw, sh);
      g.fill({ color: UI_COLORS.overlayDark, alpha: UI_ALPHA.overlay });
    }

    g.eventMode = 'static';
    return g;
  }

  private buildPanel(step: TutorialStep, layout: LayoutInfo): Container {
    const panel = new Container();
    const pw = Math.min(scaled(320, layout), this.screenW - 40);
    const textPad = scaled(16, layout);
    const btnH = touchTarget(32, layout);
    const rad = panelRadius(layout);

    // Text
    const style = new TextStyle({
      fontFamily: 'sans-serif',
      fontSize: fontSize(14, layout),
      fill: UI_COLORS.textPrimary,
      wordWrap: true,
      wordWrapWidth: pw - textPad * 2,
      align: 'center',
      lineHeight: fontSize(14, layout) * 1.4,
    });
    const label = new Text({ text: step.text, style });
    label.anchor.set(0.5, 0);
    label.x = pw / 2;
    label.y = textPad;

    const ph = label.height + textPad * 2 + btnH + scaled(12, layout);

    // Background
    const bg = new Graphics();
    bg.roundRect(0, 0, pw, ph, rad);
    bg.fill({ color: UI_COLORS.panelBg, alpha: UI_ALPHA.panelBg });
    bg.roundRect(0, 0, pw, ph, rad);
    bg.stroke({ color: UI_COLORS.borderGold, width: 1.5, alpha: UI_ALPHA.panelBorder });

    panel.addChild(bg, label);

    // Buttons row
    const btnY = ph - btnH - scaled(8, layout);
    const nextBtn = this.makeButton('Suivant', pw / 2 + scaled(4, layout), btnY, pw / 2 - scaled(12, layout), btnH, layout, () => this.advance());
    const skipBtn = this.makeButton('Passer', scaled(8, layout), btnY, pw / 2 - scaled(12, layout), btnH, layout, () => this.completeTutorial());
    panel.addChild(skipBtn, nextBtn);

    // Position the panel based on step.position
    const cx = (this.screenW - pw) / 2;
    if (step.position === 'top') {
      panel.y = scaled(40, layout) + layout.safeArea.top;
    } else if (step.position === 'bottom') {
      panel.y = this.screenH - ph - scaled(40, layout) - layout.safeArea.bottom;
    } else {
      panel.y = (this.screenH - ph) / 2;
    }
    panel.x = cx;

    return panel;
  }

  private makeButton(
    label: string, x: number, y: number, w: number, h: number,
    layout: LayoutInfo, onClick: () => void,
  ): Container {
    const btn = new Container();
    btn.x = x;
    btn.y = y;

    const bg = new Graphics();
    bg.roundRect(0, 0, w, h, panelRadius(layout) * 0.6);
    bg.fill({ color: UI_COLORS.btnPrimary, alpha: UI_ALPHA.buttonBg });
    btn.addChild(bg);

    const style = new TextStyle({
      fontFamily: 'sans-serif',
      fontSize: fontSize(13, layout),
      fill: UI_COLORS.textGold,
      align: 'center',
    });
    const txt = new Text({ text: label, style });
    txt.anchor.set(0.5);
    txt.x = w / 2;
    txt.y = h / 2;
    btn.addChild(txt);

    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.on('pointerdown', onClick);

    return btn;
  }

  private advance(): void {
    this.currentStep++;
    this.showStep();
  }

  private completeTutorial(): void {
    this.clearOverlay();
    try { localStorage.setItem(STORAGE_KEY, 'done'); } catch { /* noop */ }
  }

  private clearOverlay(): void {
    if (this.overlay) {
      this.overlay.destroy({ children: true });
      this.overlay = null;
    }
  }
}
