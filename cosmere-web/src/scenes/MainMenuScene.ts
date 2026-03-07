import { Application, Container, Text, Graphics, TextStyle, FederatedPointerEvent } from 'pixi.js';
import type { GameScene } from '../game/SceneRouter';
import { SceneRouter } from '../game/SceneRouter';
import { GameManager } from '../game/GameManager';
import { CharacterCreationScene } from './CharacterCreationScene';
import { ZoneScene } from './ZoneScene';
import { gameData } from '../data/DataLoader';

export class MainMenuScene extends Container implements GameScene {
  private app: Application;
  private router: SceneRouter;

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
    bg.rect(0, 0, w, h).fill(0x0a0a1e);
    this.addChild(bg);

    // Mist particles (simple animated dots)
    for (let i = 0; i < 40; i++) {
      const dot = new Graphics();
      dot.circle(0, 0, Math.random() * 2 + 1).fill({ color: 0xffffff, alpha: Math.random() * 0.15 + 0.05 });
      dot.x = Math.random() * w;
      dot.y = Math.random() * h;
      (dot as any)._vy = Math.random() * 0.3 + 0.1;
      (dot as any)._vx = (Math.random() - 0.5) * 0.2;
      this.addChild(dot);
    }

    // Title
    const titleStyle = new TextStyle({
      fontFamily: 'Georgia, Copperplate, serif',
      fontSize: 32,
      fill: 0xe6cc66,
      fontWeight: 'bold',
    });
    const title = new Text({ text: 'Cosmere Chronicles', style: titleStyle });
    title.anchor.set(0.5);
    title.x = w / 2;
    title.y = h * 0.28;
    this.addChild(title);

    // Subtitle
    const subStyle = new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 14, fill: 0x888888 });
    const subtitle = new Text({ text: 'Les Chroniques du Cosmere', style: subStyle });
    subtitle.anchor.set(0.5);
    subtitle.x = w / 2;
    subtitle.y = h * 0.34;
    this.addChild(subtitle);

    // New Game button
    this.createButton('Nouvelle Partie', w / 2, h * 0.50, () => {
      this.router.goto(CharacterCreationScene);
    });

    // Continue button
    if (GameManager.shared.hasSave()) {
      this.createButton('Continuer', w / 2, h * 0.58, () => {
        GameManager.shared.load();
        const zoneID = GameManager.shared.champion?.currentZoneID ?? 'scadrial_hub';
        if (gameData.zone(zoneID)) {
          this.router.goto(ZoneScene);
        }
      });
    }

    // Version
    const verStyle = new TextStyle({ fontFamily: 'monospace', fontSize: 10, fill: 0x444444 });
    const ver = new Text({ text: 'v1.0 — Prototype Web', style: verStyle });
    ver.anchor.set(0.5);
    ver.x = w / 2;
    ver.y = h - 20;
    this.addChild(ver);
  }

  private createButton(label: string, x: number, y: number, onClick: () => void): void {
    const bw = 220;
    const bh = 44;
    const btn = new Container();
    btn.x = x;
    btn.y = y;

    const bg = new Graphics();
    bg.roundRect(-bw / 2, -bh / 2, bw, bh, 8)
      .fill({ color: 0x33264d, alpha: 0.8 })
      .stroke({ color: 0x998033, width: 2 });
    btn.addChild(bg);

    const style = new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 16, fill: 0xffffff });
    const txt = new Text({ text: label, style });
    txt.anchor.set(0.5);
    btn.addChild(txt);

    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.on('pointerdown', (e: FederatedPointerEvent) => {
      btn.scale.set(0.93);
    });
    btn.on('pointerup', () => {
      btn.scale.set(1);
      onClick();
    });
    btn.on('pointerupoutside', () => { btn.scale.set(1); });

    this.addChild(btn);
  }

  update(dt: number): void {
    // Animate mist particles
    for (const child of this.children) {
      if ((child as any)._vy !== undefined) {
        child.y -= (child as any)._vy;
        child.x += (child as any)._vx;
        if (child.y < -10) {
          child.y = this.app.screen.height + 10;
          child.x = Math.random() * this.app.screen.width;
        }
      }
    }
  }
}
