import { Application, Container, Text, Graphics, TextStyle, FederatedPointerEvent } from 'pixi.js';
import type { GameScene } from '../game/SceneRouter';
import { SceneRouter } from '../game/SceneRouter';
import { GameManager } from '../game/GameManager';
import { BestiaryManager } from '../game/BestiarySystem';
import { AchievementManager } from '../game/AchievementSystem';
import { CompanionManager } from '../game/CompanionSystem';
import { NPCRelationshipManager } from '../game/NPCRelationships';
import { CharacterCreationScene } from './CharacterCreationScene';
import { ZoneScene } from './ZoneScene';
import { gameData } from '../data/DataLoader';
import { drawPlayerCharacter } from '../rendering/PlayerRenderer';
import type { ChampionClass } from '../data/types';
import { CLASS_INFO } from '../data/types';
import { getLayoutInfo, fontSize, scaled, panelRadius, UI_COLORS, UI_ALPHA } from '../ui/ResponsiveLayout';
import type { LayoutInfo } from '../ui/ResponsiveLayout';

const SHOWCASE_CLASSES: ChampionClass[] = ['mistborn', 'radiant', 'awakener', 'elantrian', 'sandMaster', 'nightmarePainter'];

export class MainMenuScene extends Container implements GameScene {
  private app: Application;
  private router: SceneRouter;
  private particles: { sprite: Graphics; vx: number; vy: number }[] = [];
  private showcaseTimer = 0;
  private showcaseIndex = 0;
  private showcaseContainer: Container | null = null;

  constructor(app: Application, router: SceneRouter) {
    super();
    this.app = app;
    this.router = router;
  }

  onEnter(): void {
    this.buildUI();
  }

  onResize(): void {
    // Clear everything and rebuild
    this.removeChildren();
    this.particles = [];
    this.showcaseContainer = null;
    this.buildUI();
  }

  private buildUI(): void {
    const w = this.app.screen.width;
    const h = this.app.screen.height;
    const layout = getLayoutInfo(w, h);
    const isLandscape = layout.orientation === 'landscape';

    // Dark background with gradient effect
    const bg = new Graphics();
    bg.rect(0, 0, w, h).fill(0x060612);
    this.addChild(bg);

    // Subtle grid pattern
    const gridSpacing = scaled(40, layout);
    const grid = new Graphics();
    for (let x = 0; x < w; x += gridSpacing) {
      grid.moveTo(x, 0).lineTo(x, h).stroke({ color: 0x111122, width: 0.5 });
    }
    for (let y = 0; y < h; y += gridSpacing) {
      grid.moveTo(0, y).lineTo(w, y).stroke({ color: 0x111122, width: 0.5 });
    }
    this.addChild(grid);

    // Compute column positions for landscape two-column layout
    const leftCenterX = isLandscape ? w * 0.35 : w / 2;
    const rightCenterX = isLandscape ? w * 0.70 : w / 2;

    // Ambient glow behind title
    const glowX = leftCenterX;
    const glowY = isLandscape ? h * 0.20 : h * 0.25;
    const glowR1 = scaled(120, layout);
    const glowR2 = scaled(80, layout);
    const glow = new Graphics();
    glow.circle(glowX, glowY, glowR1).fill({ color: 0x332200, alpha: 0.15 });
    glow.circle(glowX, glowY, glowR2).fill({ color: 0x443300, alpha: 0.1 });
    this.addChild(glow);

    // Mist/particle effects
    const particleCount = layout.device === 'mobile' ? 40 : 60;
    for (let i = 0; i < particleCount; i++) {
      const dot = new Graphics();
      const size = Math.random() * 2 + 0.5;
      const alpha = Math.random() * 0.12 + 0.03;
      dot.circle(0, 0, size).fill({ color: 0xaabbcc, alpha });
      dot.x = Math.random() * w;
      dot.y = Math.random() * h;
      this.addChild(dot);
      this.particles.push({
        sprite: dot,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -(Math.random() * 0.4 + 0.1),
      });
    }

    // Decorative line above title
    const lineHalfW = scaled(100, layout);
    const lineY1 = isLandscape ? h * 0.16 : h * 0.22;
    const line = new Graphics();
    line.moveTo(leftCenterX - lineHalfW, lineY1).lineTo(leftCenterX + lineHalfW, lineY1)
      .stroke({ color: 0x665522, width: 1, alpha: 0.5 });
    this.addChild(line);

    // Title
    const titleSize = fontSize(30, layout);
    const title = new Text({
      text: 'Cosmere Chronicles',
      style: new TextStyle({
        fontFamily: 'Georgia, Copperplate, serif',
        fontSize: titleSize,
        fill: 0xe6cc66,
        fontWeight: 'bold',
        dropShadow: { color: 0x000000, blur: 6, distance: 2, alpha: 0.8 },
      }),
    });
    title.anchor.set(0.5);
    title.x = leftCenterX;
    title.y = isLandscape ? h * 0.22 : h * 0.27;
    this.addChild(title);

    // Subtitle
    const subtitleSize = fontSize(12, layout);
    const subtitle = new Text({
      text: 'Les Chroniques du Cosmere',
      style: new TextStyle({
        fontFamily: 'Georgia, serif', fontSize: subtitleSize, fill: 0x776644, fontStyle: 'italic',
      }),
    });
    subtitle.anchor.set(0.5);
    subtitle.x = leftCenterX;
    subtitle.y = isLandscape ? h * 0.30 : h * 0.33;
    this.addChild(subtitle);

    // Decorative line below subtitle
    const lineY2 = isLandscape ? h * 0.34 : h * 0.36;
    const line2 = new Graphics();
    line2.moveTo(leftCenterX - lineHalfW, lineY2).lineTo(leftCenterX + lineHalfW, lineY2)
      .stroke({ color: 0x665522, width: 1, alpha: 0.5 });
    this.addChild(line2);

    // Character showcase area
    this.showcaseContainer = new Container();
    if (isLandscape) {
      this.showcaseContainer.x = rightCenterX;
      this.showcaseContainer.y = h * 0.45;
    } else {
      this.showcaseContainer.x = w / 2;
      this.showcaseContainer.y = h * 0.50;
    }
    this.addChild(this.showcaseContainer);
    this.updateShowcase(layout);

    // Class name label below showcase
    const classLabelSize = fontSize(9, layout);
    const classLabel = new Text({
      text: '',
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: classLabelSize, fill: 0x666677 }),
    });
    classLabel.anchor.set(0.5);
    if (isLandscape) {
      classLabel.x = rightCenterX;
      classLabel.y = h * 0.58;
    } else {
      classLabel.x = w / 2;
      classLabel.y = h * 0.58;
    }
    classLabel.name = 'classLabel';
    this.addChild(classLabel);

    // Buttons
    const hasSave = GameManager.shared.hasSave();
    const btnWidth = scaled(220, layout);
    const btnSpacing = scaled(50, layout);

    let btnY: number;
    if (isLandscape) {
      btnY = hasSave ? h * 0.52 : h * 0.56;
    } else {
      btnY = hasSave ? h * 0.68 : h * 0.70;
    }

    this.createButton('Nouvelle Partie', leftCenterX, btnY, 0x33264d, btnWidth, layout, () => {
      this.router.goto(CharacterCreationScene);
    });

    if (hasSave) {
      const savedChamp = GameManager.shared.champion;
      const continueLabel = savedChamp
        ? `Continuer (${savedChamp.name} Nv.${savedChamp.level})`
        : 'Continuer';
      // Load first to get champion info for label
      GameManager.shared.load();
      const champ = GameManager.shared.champion;
      const label = champ ? `Continuer (${champ.name} Nv.${champ.level})` : continueLabel;

      this.createButton(label, leftCenterX, btnY + btnSpacing, 0x224433, btnWidth, layout, () => {
        GameManager.shared.load();
        BestiaryManager.shared.load();
        AchievementManager.shared.load();
        CompanionManager.shared.load();
        NPCRelationshipManager.shared.load();
        this.router.goto(ZoneScene);
      });
    }

    // Lore quote
    const quotes = [
      '"Vie avant la mort. Force avant la faiblesse. Voyage avant la destination."',
      '"Il y a toujours un autre secret."',
      '"L\'énergie ne peut être ni créée ni détruite."',
      '"Les couleurs sont le souffle de la vie."',
      '"Le Dor coule en chaque être vivant."',
    ];
    const quoteSize = fontSize(9, layout);
    const quoteWrapWidth = isLandscape ? w * 0.45 : w - scaled(60, layout);
    const quote = new Text({
      text: quotes[Math.floor(Math.random() * quotes.length)],
      style: new TextStyle({
        fontFamily: 'Georgia, serif', fontSize: quoteSize, fill: 0x554433,
        fontStyle: 'italic', wordWrap: true, wordWrapWidth: quoteWrapWidth, align: 'center',
      }),
    });
    quote.anchor.set(0.5);
    if (isLandscape) {
      quote.x = rightCenterX;
      quote.y = h * 0.75;
    } else {
      quote.x = w / 2;
      quote.y = h - scaled(50, layout);
    }
    this.addChild(quote);

    // Version
    const verSize = fontSize(9, layout);
    const ver = new Text({
      text: 'v1.2 — Prototype Web',
      style: new TextStyle({ fontFamily: 'monospace', fontSize: verSize, fill: 0x444444 }),
    });
    ver.anchor.set(0.5);
    ver.x = w / 2;
    ver.y = h - scaled(15, layout);
    this.addChild(ver);
  }

  private updateShowcase(layout?: LayoutInfo): void {
    if (!this.showcaseContainer) return;
    this.showcaseContainer.removeChildren();

    const w = this.app.screen.width;
    const h = this.app.screen.height;
    const li = layout ?? getLayoutInfo(w, h);

    const cls = SHOWCASE_CLASSES[this.showcaseIndex];
    const charSprite = new Graphics();
    drawPlayerCharacter(charSprite, cls);
    const showcaseScale = scaled(2.5, li);
    charSprite.scale.set(showcaseScale);
    this.showcaseContainer.addChild(charSprite);

    // Glow behind character
    const charGlow = new Graphics();
    const glowRadius = scaled(25, li);
    charGlow.circle(0, -scaled(10, li), glowRadius).fill({ color: 0x665522, alpha: 0.08 });
    this.showcaseContainer.addChildAt(charGlow, 0);

    // Update class label
    const label = this.children.find(c => c.name === 'classLabel') as Text | undefined;
    if (label) {
      label.text = CLASS_INFO[cls]?.name ?? cls;
    }
  }

  private createButton(
    label: string, x: number, y: number, color: number,
    btnWidth: number, layout: LayoutInfo, onClick: () => void
  ): void {
    const bw = btnWidth;
    const bh = scaled(40, layout);
    const btn = new Container();
    btn.x = x;
    btn.y = y;

    const bg = new Graphics();
    const radius = panelRadius(layout);
    // Shadow
    bg.roundRect(-bw / 2 + 2, -bh / 2 + 3, bw, bh, radius)
      .fill({ color: 0x000000, alpha: 0.2 });
    // Button body
    bg.roundRect(-bw / 2, -bh / 2, bw, bh, radius)
      .fill({ color, alpha: UI_ALPHA.buttonBg })
      .stroke({ color: UI_COLORS.borderGold, width: 1.5, alpha: 0.8 });
    // Top highlight
    bg.roundRect(-bw / 2 + 4, -bh / 2 + 2, bw - 8, bh * 0.35, radius)
      .fill({ color: 0xffffff, alpha: 0.06 });
    btn.addChild(bg);

    const btnFontSize = fontSize(15, layout);
    const style = new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: btnFontSize, fill: UI_COLORS.textPrimary,
      fontWeight: 'bold',
    });
    const txt = new Text({ text: label, style });
    txt.anchor.set(0.5);
    btn.addChild(txt);

    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.on('pointerdown', () => { btn.scale.set(0.96); btn.alpha = 0.9; });
    btn.on('pointerup', () => { btn.scale.set(1); btn.alpha = 1; onClick(); });
    btn.on('pointerupoutside', () => { btn.scale.set(1); btn.alpha = 1; });

    this.addChild(btn);
  }

  update(dt: number): void {
    const w = this.app.screen.width;
    const h = this.app.screen.height;

    // Animate particles
    for (const p of this.particles) {
      p.sprite.x += p.vx;
      p.sprite.y += p.vy;
      if (p.sprite.y < -10) {
        p.sprite.y = h + 10;
        p.sprite.x = Math.random() * w;
      }
      if (p.sprite.x < -10) p.sprite.x = w + 10;
      if (p.sprite.x > w + 10) p.sprite.x = -10;
    }

    // Rotate showcase character every 3 seconds
    this.showcaseTimer += dt / 60;
    if (this.showcaseTimer > 3) {
      this.showcaseTimer = 0;
      this.showcaseIndex = (this.showcaseIndex + 1) % SHOWCASE_CLASSES.length;
      this.updateShowcase();
    }
  }
}
