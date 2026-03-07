import { Application, Container, Text, Graphics, TextStyle } from 'pixi.js';
import type { GameScene } from '../game/SceneRouter';
import { SceneRouter } from '../game/SceneRouter';
import { GameManager } from '../game/GameManager';
import { ZoneScene } from './ZoneScene';
import { MainMenuScene } from './MainMenuScene';
import { drawPlayerCharacter } from '../rendering/PlayerRenderer';
import type { ChampionClass, RadiantOrder } from '../data/types';
import { CLASS_INFO } from '../data/types';
import { CLASS_COLORS } from './CharacterPreview';
import { ORDERS, ORDER_NAMES } from './OrderSelector';
import { getLayoutInfo, fontSize, scaled, panelRadius, touchTarget, UI_COLORS, UI_ALPHA } from '../ui/ResponsiveLayout';
import { MusicManager } from '../game/MusicSystem';
import type { LayoutInfo } from '../ui/ResponsiveLayout';

const CLASSES: ChampionClass[] = ['mistborn', 'radiant', 'awakener', 'elantrian', 'sandMaster', 'nightmarePainter'];

const WORLD_NAMES: Record<string, string> = {
  scadrial: 'Scadrial — Le monde des brumes et des métaux',
  roshar: 'Roshar — Le monde des tempêtes et des sprens',
  nalthis: 'Nalthis — Le monde des couleurs et du Souffle',
  sel: 'Sel — Le monde des Aons et du Dor',
  taldain: 'Taldain — Le monde du sable et du soleil',
  komashi: 'Komashi — Le monde des cauchemars et des peintures',
};

export class CharacterCreationScene extends Container implements GameScene {
  private app: Application;
  private router: SceneRouter;
  private selectedClass: ChampionClass = 'mistborn';
  private selectedOrder: RadiantOrder = 'windrunner';
  private playerName = 'Salteur';
  private descText!: Text;
  private worldText!: Text;
  private nameText!: Text;
  private classButtons: Container[] = [];
  private orderContainer: Container | null = null;
  private previewContainer!: Container;
  private layout!: LayoutInfo;
  private btnSize = 48;

  constructor(app: Application, router: SceneRouter) {
    super();
    this.app = app;
    this.router = router;
  }

  onEnter(): void {
    this.buildUI();
  }

  onResize(): void {
    this.removeChildren();
    this.classButtons = [];
    this.orderContainer = null;
    this.buildUI();
  }

  private buildUI(): void {
    const w = this.app.screen.width;
    const h = this.app.screen.height;
    this.layout = getLayoutInfo(w, h);
    const layout = this.layout;
    const isLandscape = layout.orientation === 'landscape';

    // Background
    const bg = new Graphics();
    bg.rect(0, 0, w, h).fill(0x060612);
    this.addChild(bg);

    // Subtle pattern
    const pattern = new Graphics();
    for (let i = 0; i < 30; i++) {
      const px = Math.random() * w;
      const py = Math.random() * h;
      pattern.circle(px, py, Math.random() * 1.5 + 0.5).fill({ color: 0x222233, alpha: 0.3 });
    }
    this.addChild(pattern);

    // Title
    const title = new Text({
      text: 'Créer votre Salteur',
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: fontSize(20, layout),
        fill: 0xe6cc66,
        fontWeight: 'bold',
        dropShadow: { color: 0x000000, blur: 4, distance: 1 },
      }),
    });
    title.anchor.set(0.5);
    title.x = w / 2;
    title.y = scaled(30, layout);
    this.addChild(title);

    // Name
    this.nameText = new Text({
      text: `Nom: ${this.playerName}`,
      style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: fontSize(14, layout), fill: 0xffffff }),
    });
    this.nameText.anchor.set(0.5);
    this.nameText.x = w / 2;
    this.nameText.y = scaled(60, layout);
    this.nameText.eventMode = 'static';
    this.nameText.cursor = 'pointer';
    this.nameText.on('pointerdown', () => this.promptName());
    this.addChild(this.nameText);

    const hint = new Text({
      text: '(touchez pour modifier)',
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(9, layout), fill: 0x555555 }),
    });
    hint.anchor.set(0.5);
    hint.x = w / 2;
    hint.y = scaled(76, layout);
    this.addChild(hint);

    // Determine top of content area (below title/name)
    const contentTop = scaled(95, layout);

    // Action buttons always at the bottom
    const actionBottomMargin = Math.max(layout.safeArea.bottom, scaled(10, layout));
    const backBtnY = h - actionBottomMargin - scaled(12, layout);
    const startBtnY = backBtnY - scaled(38, layout);

    // Available content height between header and action buttons
    const contentBottom = startBtnY - scaled(15, layout);

    this.btnSize = Math.round(scaled(48, layout));
    const gap = Math.round(scaled(8, layout));

    if (isLandscape) {
      this.buildLandscapeLayout(w, h, contentTop, contentBottom, gap);
    } else {
      this.buildPortraitLayout(w, h, contentTop, contentBottom, gap);
    }

    // Start button
    const actionBtnW = Math.min(scaled(200, layout), w - scaled(40, layout));
    this.createActionBtn('Commencer l\'aventure', w / 2, startBtnY, 0x224422, actionBtnW, () => {
      GameManager.shared.startNewGame(
        this.playerName,
        this.selectedClass,
        this.selectedClass === 'radiant' ? this.selectedOrder : undefined,
      );
      this.router.goto(ZoneScene);
    });

    // Back button
    this.createActionBtn('Retour', w / 2, backBtnY, 0x332222, actionBtnW, () => {
      this.router.goto(MainMenuScene);
    });

    this.updateSelection();
  }

  // ─── Landscape: preview left (30%), class buttons center (40%), description right (30%) ───

  private buildLandscapeLayout(
    w: number, h: number,
    contentTop: number, contentBottom: number,
    gap: number,
  ): void {
    const layout = this.layout;
    const btnSize = this.btnSize;

    // Column boundaries
    const leftW = w * 0.30;
    const centerW = w * 0.40;
    const rightX = w * 0.70;
    const rightW = w * 0.30;

    // ── Preview (left 30%) ──
    const previewCenterX = leftW / 2;
    const previewCenterY = (contentTop + contentBottom) / 2;

    this.previewContainer = new Container();
    this.previewContainer.x = previewCenterX;
    this.previewContainer.y = previewCenterY;
    this.addChild(this.previewContainer);

    const previewScale = Math.max(0.8, layout.scale);
    const previewBg = new Graphics();
    previewBg.roundRect(-40 * previewScale, -55 * previewScale, 80 * previewScale, 90 * previewScale, 8)
      .fill({ color: 0x0a0a1a, alpha: 0.7 })
      .stroke({ color: 0x443355, width: 1, alpha: 0.5 });
    this.previewContainer.addChild(previewBg);

    // ── Class buttons (center 40%, 3 columns x 2 rows) ──
    const cols = 3;
    const rows = 2;
    const gridW = cols * btnSize + (cols - 1) * (gap + scaled(40, layout));
    const gridH = rows * btnSize + (rows - 1) * (gap + scaled(4, layout));
    const gridStartX = leftW + (centerW - gridW) / 2 + btnSize / 2;
    const gridStartY = contentTop + ((contentBottom - contentTop) - gridH) / 2 + btnSize / 2;

    CLASSES.forEach((cls, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = gridStartX + col * (btnSize + gap + scaled(40, layout));
      const y = gridStartY + row * (btnSize + gap + scaled(4, layout));
      const btn = this.createClassBtn(cls, x, y, btnSize);
      this.classButtons.push(btn);
      this.addChild(btn);
    });

    // ── Description (right 30%) ──
    const descCenterX = rightX + rightW / 2;
    const descWrapWidth = rightW - scaled(20, layout);

    this.descText = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'sans-serif',
        fontSize: fontSize(10, layout),
        fill: 0xaaaacc,
        wordWrap: true,
        wordWrapWidth: descWrapWidth,
        align: 'center',
      }),
    });
    this.descText.anchor.set(0.5, 0);
    this.descText.x = descCenterX;
    this.descText.y = contentTop + scaled(10, layout);
    this.addChild(this.descText);

    this.worldText = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'sans-serif',
        fontSize: fontSize(10, layout),
        fill: 0x6699cc,
        wordWrap: true,
        wordWrapWidth: descWrapWidth,
        align: 'center',
      }),
    });
    this.worldText.anchor.set(0.5, 0);
    this.worldText.x = descCenterX;
    this.worldText.y = contentTop + scaled(50, layout);
    this.addChild(this.worldText);
  }

  // ─── Portrait: stacked layout (original flow, scaled) ───

  private buildPortraitLayout(
    w: number, h: number,
    contentTop: number, contentBottom: number,
    gap: number,
  ): void {
    const layout = this.layout;
    const btnSize = this.btnSize;

    // Character preview (left-ish)
    this.previewContainer = new Container();
    this.previewContainer.x = w * 0.22;
    this.previewContainer.y = contentTop + scaled(60, layout);
    this.addChild(this.previewContainer);

    const previewBg = new Graphics();
    previewBg.roundRect(-40, -55, 80, 90, 8)
      .fill({ color: 0x0a0a1a, alpha: 0.7 })
      .stroke({ color: 0x443355, width: 1, alpha: 0.5 });
    this.previewContainer.addChild(previewBg);

    // Class buttons (2 columns x 3 rows, right side)
    const cols = 2;
    const startX = w * 0.48;
    const startY = contentTop + scaled(5, layout);

    CLASSES.forEach((cls, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (btnSize + gap + scaled(40, layout));
      const y = startY + row * (btnSize + gap + scaled(4, layout));
      const btn = this.createClassBtn(cls, x, y, btnSize);
      this.classButtons.push(btn);
      this.addChild(btn);
    });

    // Description area below the buttons
    const descY = startY + 3 * (btnSize + gap + scaled(4, layout)) + scaled(5, layout);

    this.descText = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'sans-serif',
        fontSize: fontSize(10, layout),
        fill: 0xaaaacc,
        wordWrap: true,
        wordWrapWidth: w - scaled(30, layout),
        align: 'center',
      }),
    });
    this.descText.anchor.set(0.5, 0);
    this.descText.x = w / 2;
    this.descText.y = descY;
    this.addChild(this.descText);

    this.worldText = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'sans-serif',
        fontSize: fontSize(10, layout),
        fill: 0x6699cc,
      }),
    });
    this.worldText.anchor.set(0.5, 0);
    this.worldText.x = w / 2;
    this.worldText.y = descY + scaled(30, layout);
    this.addChild(this.worldText);
  }

  private createClassBtn(cls: ChampionClass, x: number, y: number, size: number): Container {
    const layout = this.layout;
    const container = new Container();
    container.x = x;
    container.y = y;
    (container as any)._cls = cls;
    (container as any)._size = size;

    const bg = new Graphics();
    bg.roundRect(-size / 2, -size / 2, size, size, 6)
      .fill({ color: 0x111120, alpha: 0.9 })
      .stroke({ color: 0x554433, width: 1.5 });
    container.addChild(bg);

    // Mini character preview in button
    const miniChar = new Graphics();
    drawPlayerCharacter(miniChar, cls);
    miniChar.scale.set(Math.max(1, layout.scale * 1.2));
    miniChar.y = -3;
    container.addChild(miniChar);

    // Label below button
    const lbl = new Text({
      text: CLASS_INFO[cls].name,
      style: new TextStyle({
        fontFamily: 'sans-serif',
        fontSize: fontSize(7, layout),
        fill: CLASS_COLORS[cls],
      }),
    });
    lbl.anchor.set(0.5);
    lbl.y = size / 2 + scaled(6, layout);
    container.addChild(lbl);

    container.eventMode = 'static';
    container.cursor = 'pointer';
    container.on('pointerdown', () => {
      MusicManager.shared.playSFX('button_click');
      this.selectedClass = cls;
      this.updateSelection();
    });

    return container;
  }

  private createActionBtn(
    label: string, x: number, y: number,
    color: number, bw: number, onClick: () => void,
  ): void {
    const layout = this.layout;
    const bh = scaled(32, layout);
    const btn = new Container();
    btn.x = x;
    btn.y = y;

    const bg = new Graphics();
    bg.roundRect(-bw / 2, -bh / 2, bw, bh, 8)
      .fill({ color, alpha: 0.9 })
      .stroke({ color: 0x998033, width: 1, alpha: 0.7 });
    btn.addChild(bg);

    const txt = new Text({
      text: label,
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: fontSize(13, layout),
        fill: 0xeeddcc,
      }),
    });
    txt.anchor.set(0.5);
    btn.addChild(txt);

    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.on('pointerdown', () => { btn.scale.set(0.95); });
    btn.on('pointerup', () => { btn.scale.set(1); MusicManager.shared.playSFX('button_click'); onClick(); });
    btn.on('pointerupoutside', () => { btn.scale.set(1); });

    this.addChild(btn);
  }

  private updateSelection(): void {
    const layout = this.layout;
    const info = CLASS_INFO[this.selectedClass];
    this.descText.text = info.description;
    this.worldText.text = WORLD_NAMES[info.startingWorld] ?? info.startingWorld;

    // Update preview
    // Remove old preview character (keep background at index 0)
    while (this.previewContainer.children.length > 1) {
      this.previewContainer.removeChildAt(1);
    }
    const charSprite = new Graphics();
    drawPlayerCharacter(charSprite, this.selectedClass);
    charSprite.scale.set(3 * Math.max(0.8, layout.scale));
    charSprite.y = -5;
    this.previewContainer.addChild(charSprite);

    // Glow ring
    const glow = new Graphics();
    glow.circle(0, 10, scaled(20, layout)).fill({ color: CLASS_COLORS[this.selectedClass], alpha: 0.08 });
    this.previewContainer.addChild(glow);

    // Highlight selected class button
    for (const btn of this.classButtons) {
      const cls = (btn as any)._cls as ChampionClass;
      const size = (btn as any)._size as number;
      const bg = btn.children[0] as Graphics;
      bg.clear();
      const selected = cls === this.selectedClass;
      bg.roundRect(-size / 2, -size / 2, size, size, 6)
        .fill({ color: selected ? 0x1a1a30 : 0x111120, alpha: 0.9 })
        .stroke({ color: selected ? 0xe6cc66 : 0x554433, width: selected ? 2.5 : 1.5 });
    }

    // Order selector for radiant
    this.orderContainer?.destroy({ children: true });
    this.orderContainer = null;

    if (this.selectedClass === 'radiant') {
      const w = this.app.screen.width;
      const isLandscape = layout.orientation === 'landscape';
      const oc = new Container();
      oc.y = this.worldText.y + scaled(20, layout);

      const label = new Text({
        text: 'Ordre Radieux:',
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(9, layout), fill: 0x777777 }),
      });
      label.anchor.set(0.5, 0);
      label.x = isLandscape ? this.worldText.x : w / 2;
      oc.addChild(label);

      const orderSpacing = scaled(70, layout);
      ORDERS.forEach((order, i) => {
        const anchorX = isLandscape ? this.worldText.x : w / 2;
        const ox = anchorX + (i - 1.5) * orderSpacing;
        const selected = this.selectedOrder === order;
        const txt = new Text({
          text: ORDER_NAMES[order],
          style: new TextStyle({
            fontFamily: 'sans-serif',
            fontSize: fontSize(8, layout),
            fill: selected ? 0x66aaff : 0x555555,
            fontWeight: selected ? 'bold' : 'normal',
          }),
        });
        txt.anchor.set(0.5, 0);
        txt.x = ox;
        txt.y = scaled(14, layout);
        txt.eventMode = 'static';
        txt.cursor = 'pointer';
        txt.on('pointerdown', () => {
          this.selectedOrder = order;
          this.updateSelection();
        });
        oc.addChild(txt);
      });

      this.addChild(oc);
      this.orderContainer = oc;
    }
  }

  private promptName(): void {
    const name = prompt('Nom du Salteur:', this.playerName);
    if (name && name.trim()) {
      this.playerName = name.trim();
      this.nameText.text = `Nom: ${this.playerName}`;
    }
  }
}
