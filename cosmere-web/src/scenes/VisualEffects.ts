// ─── Visual Effects (damage numbers, floating text, flashes) ────

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { ObjectPool } from '../systems/ObjectPool';

const DAMAGE_STYLE = new TextStyle({
  fontFamily: 'sans-serif', fontSize: 13, fill: 0xffffff,
  fontWeight: 'bold',
  dropShadow: { color: 0x000000, blur: 2, distance: 1 },
});

const CRIT_STYLE = new TextStyle({
  fontFamily: 'sans-serif', fontSize: 18, fill: 0xffee44,
  fontWeight: 'bold',
  dropShadow: { color: 0x000000, blur: 2, distance: 1 },
});

const FLOAT_STYLE = new TextStyle({
  fontFamily: 'Georgia, serif', fontSize: 10, fill: 0xeedd88,
  dropShadow: { color: 0x000000, blur: 2, distance: 1 },
});

interface ActiveText {
  text: Text;
  startY: number;
  elapsed: number;
  duration: number;
  speed: number;
}

export class VisualEffects {
  private worldContainer: Container;
  private uiContainer: Container;
  private activeTexts: ActiveText[] = [];
  private textPool: ObjectPool<Text>;
  private running = true;

  constructor(worldContainer: Container, uiContainer: Container) {
    this.worldContainer = worldContainer;
    this.uiContainer = uiContainer;
    this.textPool = new ObjectPool<Text>(
      () => new Text({ text: '', style: DAMAGE_STYLE }),
      (t) => { t.alpha = 1; t.scale.set(1); },
      20,
    );
  }

  showDamageNumber(x: number, y: number, amount: number, isCrit: boolean, color = 0xffffff): void {
    const txt = this.textPool.acquire();
    txt.text = isCrit ? `${amount}!` : `${amount}`;
    txt.style = isCrit ? CRIT_STYLE : DAMAGE_STYLE;
    if (!isCrit) {
      (txt.style as TextStyle).fill = color;
    }
    txt.anchor.set(0.5);
    txt.x = x + (Math.random() - 0.5) * 20;
    txt.y = y;
    txt.zIndex = 100001;
    txt.alpha = 1;
    this.worldContainer.addChild(txt);

    this.activeTexts.push({
      text: txt, startY: y, elapsed: 0, duration: 0.8, speed: 50,
    });
  }

  showFloatingText(x: number, y: number, msg: string, color: number): void {
    const txt = this.textPool.acquire();
    txt.text = msg;
    txt.style = FLOAT_STYLE;
    (txt.style as TextStyle).fill = color;
    txt.anchor.set(0.5);
    txt.x = x;
    txt.y = y;
    txt.zIndex = 100001;
    txt.alpha = 1;
    this.worldContainer.addChild(txt);

    this.activeTexts.push({
      text: txt, startY: y, elapsed: 0, duration: 2, speed: 15,
    });
  }

  showLevelUp(screenW: number, screenH: number): void {
    const flash = new Graphics();
    flash.rect(0, 0, screenW, screenH).fill({ color: 0xe6cc66, alpha: 0.15 });
    flash.zIndex = 998;
    this.uiContainer.addChild(flash);

    const style = new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 22, fill: 0xe6cc66,
      fontWeight: 'bold',
      dropShadow: { color: 0x000000, blur: 4, distance: 2 },
    });
    const txt = new Text({ text: 'NIVEAU SUPÉRIEUR!', style });
    txt.anchor.set(0.5);
    txt.x = screenW / 2;
    txt.y = screenH / 2 - 50;
    txt.zIndex = 1000;
    this.uiContainer.addChild(txt);

    this.activeTexts.push({
      text: txt, startY: txt.y, elapsed: 0, duration: 2.5, speed: 7.2,
    });

    // Fade flash separately (initial alpha 0.15, fade over ~0.25s)
    const flashDuration = 0.25;
    let flashLast = performance.now();
    const fadeFlash = () => {
      if (!this.running) { flash.destroy(); return; }
      const now = performance.now();
      const frameDt = (now - flashLast) / 1000;
      flashLast = now;
      flash.alpha -= (0.15 / flashDuration) * frameDt;
      if (flash.alpha > 0) requestAnimationFrame(fadeFlash);
      else flash.destroy();
    };
    requestAnimationFrame(fadeFlash);
  }

  showFlash(container: Container, screenW: number, screenH: number, color: number, alpha: number, duration: number): void {
    const flash = new Graphics();
    flash.rect(0, 0, screenW, screenH).fill({ color, alpha });
    flash.zIndex = 10000;
    container.addChild(flash);

    let lastTime = performance.now();
    const fadeFlash = () => {
      if (!this.running) { flash.destroy(); return; }
      const now = performance.now();
      const frameDt = (now - lastTime) / 1000;
      lastTime = now;
      flash.alpha -= (alpha / duration) * frameDt;
      if (flash.alpha > 0) requestAnimationFrame(fadeFlash);
      else flash.destroy();
    };
    requestAnimationFrame(fadeFlash);
  }

  /** Call each frame to update active text animations */
  update(dt: number): void {
    for (let i = this.activeTexts.length - 1; i >= 0; i--) {
      const at = this.activeTexts[i];
      at.elapsed += dt;
      at.text.y = at.startY - at.elapsed * at.speed;
      at.text.alpha = Math.max(0, 1 - at.elapsed / at.duration);

      if (at.elapsed >= at.duration) {
        at.text.removeFromParent();
        this.textPool.release(at.text);
        this.activeTexts.splice(i, 1);
      }
    }
  }

  destroy(): void {
    this.running = false;
    for (const at of this.activeTexts) {
      at.text.removeFromParent();
      this.textPool.release(at.text);
    }
    this.activeTexts.length = 0;
  }
}
