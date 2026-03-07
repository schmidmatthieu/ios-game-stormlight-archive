import { Application, Container, Text, Graphics, TextStyle, FederatedPointerEvent } from 'pixi.js';
import type { GameScene } from '../game/SceneRouter';
import { SceneRouter } from '../game/SceneRouter';
import { GameManager } from '../game/GameManager';
import { CharacterCreationScene } from './CharacterCreationScene';
import { ZoneScene } from './ZoneScene';
import { gameData } from '../data/DataLoader';
import { drawPlayerCharacter } from '../rendering/PlayerRenderer';
import type { ChampionClass } from '../data/types';
import { CLASS_INFO } from '../data/types';

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
    const w = this.app.screen.width;
    const h = this.app.screen.height;

    // Dark background with gradient effect
    const bg = new Graphics();
    bg.rect(0, 0, w, h).fill(0x060612);
    this.addChild(bg);

    // Subtle grid pattern
    const grid = new Graphics();
    for (let x = 0; x < w; x += 40) {
      grid.moveTo(x, 0).lineTo(x, h).stroke({ color: 0x111122, width: 0.5 });
    }
    for (let y = 0; y < h; y += 40) {
      grid.moveTo(0, y).lineTo(w, y).stroke({ color: 0x111122, width: 0.5 });
    }
    this.addChild(grid);

    // Ambient glow behind title
    const glow = new Graphics();
    glow.circle(w / 2, h * 0.25, 120).fill({ color: 0x332200, alpha: 0.15 });
    glow.circle(w / 2, h * 0.25, 80).fill({ color: 0x443300, alpha: 0.1 });
    this.addChild(glow);

    // Mist/particle effects
    for (let i = 0; i < 60; i++) {
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

    // Decorative line
    const line = new Graphics();
    line.moveTo(w / 2 - 100, h * 0.22).lineTo(w / 2 + 100, h * 0.22)
      .stroke({ color: 0x665522, width: 1, alpha: 0.5 });
    this.addChild(line);

    // Title
    const title = new Text({
      text: 'Cosmere Chronicles',
      style: new TextStyle({
        fontFamily: 'Georgia, Copperplate, serif',
        fontSize: 30,
        fill: 0xe6cc66,
        fontWeight: 'bold',
        dropShadow: { color: 0x000000, blur: 6, distance: 2, alpha: 0.8 },
      }),
    });
    title.anchor.set(0.5);
    title.x = w / 2;
    title.y = h * 0.27;
    this.addChild(title);

    // Subtitle
    const subtitle = new Text({
      text: 'Les Chroniques du Cosmere',
      style: new TextStyle({
        fontFamily: 'Georgia, serif', fontSize: 12, fill: 0x776644, fontStyle: 'italic',
      }),
    });
    subtitle.anchor.set(0.5);
    subtitle.x = w / 2;
    subtitle.y = h * 0.33;
    this.addChild(subtitle);

    // Decorative line below subtitle
    const line2 = new Graphics();
    line2.moveTo(w / 2 - 100, h * 0.36).lineTo(w / 2 + 100, h * 0.36)
      .stroke({ color: 0x665522, width: 1, alpha: 0.5 });
    this.addChild(line2);

    // Character showcase area
    this.showcaseContainer = new Container();
    this.showcaseContainer.x = w / 2;
    this.showcaseContainer.y = h * 0.50;
    this.addChild(this.showcaseContainer);
    this.updateShowcase();

    // Class name label below showcase
    const classLabel = new Text({
      text: '',
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 9, fill: 0x666677 }),
    });
    classLabel.anchor.set(0.5);
    classLabel.x = w / 2;
    classLabel.y = h * 0.58;
    classLabel.name = 'classLabel';
    this.addChild(classLabel);

    // Buttons
    const hasSave = GameManager.shared.hasSave();
    const btnY = hasSave ? h * 0.68 : h * 0.70;

    this.createButton('Nouvelle Partie', w / 2, btnY, 0x33264d, () => {
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

      this.createButton(label, w / 2, btnY + 50, 0x224433, () => {
        GameManager.shared.load();
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
    const quote = new Text({
      text: quotes[Math.floor(Math.random() * quotes.length)],
      style: new TextStyle({
        fontFamily: 'Georgia, serif', fontSize: 9, fill: 0x554433,
        fontStyle: 'italic', wordWrap: true, wordWrapWidth: w - 60, align: 'center',
      }),
    });
    quote.anchor.set(0.5);
    quote.x = w / 2;
    quote.y = h - 50;
    this.addChild(quote);

    // Version
    const ver = new Text({
      text: 'v1.1 — Prototype Web',
      style: new TextStyle({ fontFamily: 'monospace', fontSize: 9, fill: 0x333333 }),
    });
    ver.anchor.set(0.5);
    ver.x = w / 2;
    ver.y = h - 15;
    this.addChild(ver);
  }

  private updateShowcase(): void {
    if (!this.showcaseContainer) return;
    this.showcaseContainer.removeChildren();

    const cls = SHOWCASE_CLASSES[this.showcaseIndex];
    const charSprite = new Graphics();
    drawPlayerCharacter(charSprite, cls);
    charSprite.scale.set(2.5);
    this.showcaseContainer.addChild(charSprite);

    // Glow behind character
    const charGlow = new Graphics();
    charGlow.circle(0, -10, 25).fill({ color: 0x665522, alpha: 0.08 });
    this.showcaseContainer.addChildAt(charGlow, 0);

    // Update class label
    const label = this.children.find(c => c.name === 'classLabel') as Text | undefined;
    if (label) {
      label.text = CLASS_INFO[cls]?.name ?? cls;
    }
  }

  private createButton(label: string, x: number, y: number, color: number, onClick: () => void): void {
    const bw = 220;
    const bh = 40;
    const btn = new Container();
    btn.x = x;
    btn.y = y;

    const bg = new Graphics();
    bg.roundRect(-bw / 2, -bh / 2, bw, bh, 8)
      .fill({ color, alpha: 0.85 })
      .stroke({ color: 0x998033, width: 1.5, alpha: 0.8 });
    btn.addChild(bg);

    const style = new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 14, fill: 0xeeddcc,
    });
    const txt = new Text({ text: label, style });
    txt.anchor.set(0.5);
    btn.addChild(txt);

    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.on('pointerdown', () => { btn.scale.set(0.95); });
    btn.on('pointerup', () => { btn.scale.set(1); onClick(); });
    btn.on('pointerupoutside', () => { btn.scale.set(1); });

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
