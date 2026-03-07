import { Application, Container, Text, Graphics, TextStyle } from 'pixi.js';
import type { GameScene } from '../game/SceneRouter';
import { SceneRouter } from '../game/SceneRouter';
import { GameManager } from '../game/GameManager';
import { ZoneScene } from './ZoneScene';
import { MainMenuScene } from './MainMenuScene';
import { drawPlayerCharacter } from '../rendering/PlayerRenderer';
import type { ChampionClass, RadiantOrder } from '../data/types';
import { CLASS_INFO } from '../data/types';
import { updateCharacterPreview, CLASS_COLORS } from './CharacterPreview';
import { createOrderSelector } from './OrderSelector';

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

  constructor(app: Application, router: SceneRouter) {
    super();
    this.app = app;
    this.router = router;
  }

  onEnter(): void {
    const w = this.app.screen.width;
    const h = this.app.screen.height;

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
        fontFamily: 'Georgia, serif', fontSize: 20, fill: 0xe6cc66, fontWeight: 'bold',
        dropShadow: { color: 0x000000, blur: 4, distance: 1 },
      }),
    });
    title.anchor.set(0.5);
    title.x = w / 2;
    title.y = 30;
    this.addChild(title);

    // Name
    this.nameText = new Text({
      text: `Nom: ${this.playerName}`,
      style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 14, fill: 0xffffff }),
    });
    this.nameText.anchor.set(0.5);
    this.nameText.x = w / 2;
    this.nameText.y = 60;
    this.nameText.eventMode = 'static';
    this.nameText.cursor = 'pointer';
    this.nameText.on('pointerdown', () => this.promptName());
    this.addChild(this.nameText);

    const hint = new Text({
      text: '(touchez pour modifier)',
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 9, fill: 0x555555 }),
    });
    hint.anchor.set(0.5);
    hint.x = w / 2;
    hint.y = 76;
    this.addChild(hint);

    // Character preview (left side)
    this.previewContainer = new Container();
    this.previewContainer.x = w * 0.22;
    this.previewContainer.y = 155;
    this.addChild(this.previewContainer);

    // Preview background
    const previewBg = new Graphics();
    previewBg.roundRect(-40, -55, 80, 90, 8)
      .fill({ color: 0x0a0a1a, alpha: 0.7 })
      .stroke({ color: 0x443355, width: 1, alpha: 0.5 });
    this.previewContainer.addChild(previewBg);

    // Class buttons (right side, 2 columns x 3 rows)
    const btnSize = 48;
    const gap = 8;
    const startX = w * 0.48;
    const startY = 100;

    CLASSES.forEach((cls, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = startX + col * (btnSize + gap + 40);
      const y = startY + row * (btnSize + gap + 4);
      const btn = this.createClassBtn(cls, x, y, btnSize);
      this.classButtons.push(btn);
      this.addChild(btn);
    });

    // Description area below
    const descY = startY + 3 * (btnSize + gap + 4) + 5;

    this.descText = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'sans-serif', fontSize: 10, fill: 0xaaaacc,
        wordWrap: true, wordWrapWidth: w - 30, align: 'center',
      }),
    });
    this.descText.anchor.set(0.5, 0);
    this.descText.x = w / 2;
    this.descText.y = descY;
    this.addChild(this.descText);

    this.worldText = new Text({
      text: '',
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 10, fill: 0x6699cc }),
    });
    this.worldText.anchor.set(0.5, 0);
    this.worldText.x = w / 2;
    this.worldText.y = descY + 30;
    this.addChild(this.worldText);

    // Start button
    this.createActionBtn('Commencer l\'aventure', w / 2, h - 60, 0x224422, () => {
      GameManager.shared.startNewGame(
        this.playerName,
        this.selectedClass,
        this.selectedClass === 'radiant' ? this.selectedOrder : undefined,
      );
      this.router.goto(ZoneScene);
    });

    // Back button
    this.createActionBtn('Retour', w / 2, h - 22, 0x332222, () => {
      this.router.goto(MainMenuScene);
    });

    this.updateSelection();
  }

  private createClassBtn(cls: ChampionClass, x: number, y: number, size: number): Container {
    const container = new Container();
    container.x = x;
    container.y = y;
    (container as any)._cls = cls;

    const bg = new Graphics();
    bg.roundRect(-size / 2, -size / 2, size, size, 6)
      .fill({ color: 0x111120, alpha: 0.9 })
      .stroke({ color: 0x554433, width: 1.5 });
    container.addChild(bg);

    // Mini character preview in button
    const miniChar = new Graphics();
    drawPlayerCharacter(miniChar, cls);
    miniChar.scale.set(1.2);
    miniChar.y = -3;
    container.addChild(miniChar);

    // Label below button
    const lbl = new Text({
      text: CLASS_INFO[cls].name,
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 7, fill: CLASS_COLORS[cls] }),
    });
    lbl.anchor.set(0.5);
    lbl.y = size / 2 + 6;
    container.addChild(lbl);

    container.eventMode = 'static';
    container.cursor = 'pointer';
    container.on('pointerdown', () => {
      this.selectedClass = cls;
      this.updateSelection();
    });

    return container;
  }

  private createActionBtn(label: string, x: number, y: number, color: number, onClick: () => void): void {
    const bw = 200;
    const bh = 32;
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
      style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 13, fill: 0xeeddcc }),
    });
    txt.anchor.set(0.5);
    btn.addChild(txt);

    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.on('pointerdown', () => { btn.scale.set(0.95); });
    btn.on('pointerup', () => { btn.scale.set(1); onClick(); });
    btn.on('pointerupoutside', () => { btn.scale.set(1); });

    this.addChild(btn);
  }

  private updateSelection(): void {
    const info = CLASS_INFO[this.selectedClass];
    this.descText.text = info.description;
    this.worldText.text = WORLD_NAMES[info.startingWorld] ?? info.startingWorld;

    updateCharacterPreview(this.previewContainer, this.selectedClass);

    // Highlight selected class button
    for (const btn of this.classButtons) {
      const cls = (btn as any)._cls as ChampionClass;
      const bg = btn.children[0] as Graphics;
      bg.clear();
      const size = 48;
      const selected = cls === this.selectedClass;
      bg.roundRect(-size / 2, -size / 2, size, size, 6)
        .fill({ color: selected ? 0x1a1a30 : 0x111120, alpha: 0.9 })
        .stroke({ color: selected ? 0xe6cc66 : 0x554433, width: selected ? 2.5 : 1.5 });
    }

    // Order selector for radiant
    this.orderContainer?.destroy({ children: true });
    this.orderContainer = null;

    if (this.selectedClass === 'radiant') {
      const oc = createOrderSelector(
        this.app.screen.width,
        this.worldText.y + 20,
        this.selectedOrder,
        (order) => {
          this.selectedOrder = order;
          this.updateSelection();
        },
      );
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
