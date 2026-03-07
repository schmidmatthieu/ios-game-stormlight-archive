import { Application, Container, Text, Graphics, TextStyle, FederatedPointerEvent } from 'pixi.js';
import type { GameScene } from '../game/SceneRouter';
import { SceneRouter } from '../game/SceneRouter';
import { GameManager } from '../game/GameManager';
import { ZoneScene } from './ZoneScene';
import { MainMenuScene } from './MainMenuScene';
import type { ChampionClass, RadiantOrder } from '../data/types';
import { CLASS_INFO } from '../data/types';

const CLASSES: ChampionClass[] = ['mistborn', 'radiant', 'awakener', 'elantrian', 'sandMaster', 'nightmarePainter'];
const ORDERS: RadiantOrder[] = ['windrunner', 'lightweaver', 'bondsmith', 'edgedancer'];
const ORDER_NAMES: Record<RadiantOrder, string> = {
  windrunner: 'Chevalier du Vent',
  lightweaver: 'Tisseuse de Lumière',
  bondsmith: 'Forgeur de Liens',
  edgedancer: 'Danseuse du Fil',
};

const CLASS_COLORS: Record<ChampionClass, number> = {
  mistborn: 0x888888,
  radiant: 0x4488ff,
  awakener: 0xff66aa,
  elantrian: 0xffcc33,
  sandMaster: 0xffee88,
  nightmarePainter: 0xaa44cc,
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
    bg.rect(0, 0, w, h).fill(0x080810);
    this.addChild(bg);

    // Title
    const titleStyle = new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 22, fill: 0xe6cc66, fontWeight: 'bold' });
    const title = new Text({ text: 'Créer votre Salteur', style: titleStyle });
    title.anchor.set(0.5);
    title.x = w / 2;
    title.y = 40;
    this.addChild(title);

    // Name
    const nameStyle = new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 15, fill: 0xffffff });
    this.nameText = new Text({ text: `Nom: ${this.playerName}`, style: nameStyle });
    this.nameText.anchor.set(0.5);
    this.nameText.x = w / 2;
    this.nameText.y = 75;
    this.nameText.eventMode = 'static';
    this.nameText.cursor = 'pointer';
    this.nameText.on('pointerdown', () => this.promptName());
    this.addChild(this.nameText);

    const hintStyle = new TextStyle({ fontFamily: 'sans-serif', fontSize: 10, fill: 0x666666 });
    const hint = new Text({ text: '(touchez pour modifier)', style: hintStyle });
    hint.anchor.set(0.5);
    hint.x = w / 2;
    hint.y = 93;
    this.addChild(hint);

    // Class buttons (2 rows of 3)
    const btnSize = 60;
    const gap = 12;
    const totalW = btnSize * 3 + gap * 2;
    const startX = w / 2 - totalW / 2 + btnSize / 2;
    const startY = 130;

    CLASSES.forEach((cls, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = startX + col * (btnSize + gap);
      const y = startY + row * (btnSize + gap + 18);
      const btn = this.createClassBtn(cls, x, y, btnSize);
      this.classButtons.push(btn);
      this.addChild(btn);
    });

    // Description
    const descStyle = new TextStyle({ fontFamily: 'sans-serif', fontSize: 11, fill: 0xbbbbdd, wordWrap: true, wordWrapWidth: w - 40, align: 'center' });
    this.descText = new Text({ text: '', style: descStyle });
    this.descText.anchor.set(0.5, 0);
    this.descText.x = w / 2;
    this.descText.y = startY + 2 * (btnSize + gap + 18) + 10;
    this.addChild(this.descText);

    // World origin
    const worldStyle = new TextStyle({ fontFamily: 'sans-serif', fontSize: 11, fill: 0x6699cc });
    this.worldText = new Text({ text: '', style: worldStyle });
    this.worldText.anchor.set(0.5, 0);
    this.worldText.x = w / 2;
    this.worldText.y = this.descText.y + 40;
    this.addChild(this.worldText);

    // Start button
    this.createActionBtn('Commencer l\'aventure', w / 2, h - 70, 0x336633, () => {
      GameManager.shared.startNewGame(this.playerName, this.selectedClass,
        this.selectedClass === 'radiant' ? this.selectedOrder : undefined);
      this.router.goto(ZoneScene);
    });

    // Back button
    this.createActionBtn('Retour', w / 2, h - 30, 0x442222, () => {
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
    bg.roundRect(-size / 2, -size / 2, size, size, 8)
      .fill({ color: 0x1a1a2a, alpha: 0.9 })
      .stroke({ color: 0x665533, width: 2 });
    container.addChild(bg);

    // Class icon (colored circle)
    const icon = new Graphics();
    icon.circle(0, -5, size / 4).fill(CLASS_COLORS[cls]);
    container.addChild(icon);

    // Label
    const lbl = new Text({
      text: CLASS_INFO[cls].name.split(' ')[0],
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 8, fill: 0xaaaaaa }),
    });
    lbl.anchor.set(0.5);
    lbl.y = size / 2 + 8;
    container.addChild(lbl);

    container.eventMode = 'static';
    container.cursor = 'pointer';
    container.on('pointerdown', () => {
      this.selectedClass = cls;
      if (cls !== 'radiant') this.selectedOrder = 'windrunner';
      this.updateSelection();
    });

    return container;
  }

  private createActionBtn(label: string, x: number, y: number, color: number, onClick: () => void): void {
    const bw = 220;
    const bh = 34;
    const btn = new Container();
    btn.x = x;
    btn.y = y;

    const bg = new Graphics();
    bg.roundRect(-bw / 2, -bh / 2, bw, bh, 8)
      .fill({ color, alpha: 0.9 })
      .stroke({ color: 0x998033, width: 1.5 });
    btn.addChild(bg);

    const txt = new Text({
      text: label,
      style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 14, fill: 0xffffff }),
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
    this.worldText.text = `Monde d'origine: ${info.startingWorld}`;

    // Highlight selected
    for (const btn of this.classButtons) {
      const cls = (btn as any)._cls as ChampionClass;
      const bg = btn.children[0] as Graphics;
      bg.clear();
      const size = 60;
      bg.roundRect(-size / 2, -size / 2, size, size, 8)
        .fill({ color: 0x1a1a2a, alpha: 0.9 })
        .stroke({ color: cls === this.selectedClass ? 0xe6cc66 : 0x665533, width: cls === this.selectedClass ? 3 : 2 });
    }

    // Order selector
    this.orderContainer?.destroy({ children: true });
    this.orderContainer = null;

    if (this.selectedClass === 'radiant') {
      const w = this.app.screen.width;
      const oc = new Container();
      oc.y = this.worldText.y + 25;

      const label = new Text({
        text: 'Ordre Radieux:',
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 10, fill: 0x888888 }),
      });
      label.anchor.set(0.5, 0);
      label.x = w / 2;
      oc.addChild(label);

      ORDERS.forEach((order, i) => {
        const ox = w / 2 + (i - 1.5) * 75;
        const txt = new Text({
          text: ORDER_NAMES[order],
          style: new TextStyle({
            fontFamily: 'sans-serif', fontSize: 9,
            fill: this.selectedOrder === order ? 0x66aaff : 0x666666,
          }),
        });
        txt.anchor.set(0.5, 0);
        txt.x = ox;
        txt.y = 16;
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
