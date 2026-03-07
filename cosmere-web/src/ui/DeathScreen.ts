import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { GameManager } from '../game/GameManager';
import { getLayoutInfo, fontSize, scaled, buttonHeight, panelRadius, UI_COLORS } from '../ui/ResponsiveLayout';
import type { LayoutInfo } from '../ui/ResponsiveLayout';

export function showDeathScreen(
  uiContainer: Container,
  screenW: number,
  screenH: number,
  onRespawn: () => void,
): Container {
  const layout = getLayoutInfo(screenW, screenH);
  const panel = new Container();
  panel.zIndex = 20000;

  // Full screen dark overlay with red tint — fade in
  const overlay = new Graphics();
  overlay.rect(0, 0, screenW, screenH).fill({ color: 0x110000, alpha: 0.88 });
  overlay.eventMode = 'static';
  panel.addChild(overlay);

  // Blood vignette edges — more subtle
  const vignetteH = scaled(35, layout);
  const vignetteW = scaled(25, layout);
  const vignette = new Graphics();
  vignette.rect(0, 0, screenW, vignetteH).fill({ color: 0x440000, alpha: 0.5 });
  vignette.rect(0, screenH - vignetteH, screenW, vignetteH).fill({ color: 0x440000, alpha: 0.5 });
  vignette.rect(0, 0, vignetteW, screenH).fill({ color: 0x440000, alpha: 0.35 });
  vignette.rect(screenW - vignetteW, 0, vignetteW, screenH).fill({ color: 0x440000, alpha: 0.35 });
  panel.addChild(vignette);

  // Death title — dramatic
  const title = new Text({
    text: 'VOUS \u00CATES TOMB\u00C9',
    style: new TextStyle({
      fontFamily: 'Georgia, serif',
      fontSize: fontSize(30, layout),
      fill: UI_COLORS.danger,
      fontWeight: 'bold',
      dropShadow: { color: 0x000000, blur: 6, distance: 3 },
    }),
  });
  title.anchor.set(0.5);
  title.x = screenW / 2;
  title.y = screenH / 2 - scaled(65, layout);
  panel.addChild(title);

  // Penalty info — clear and visible
  const champ = GameManager.shared.champion;
  const goldLost = champ ? Math.floor(champ.gold * 0.1) : 0;
  const xpLost = champ ? Math.floor(champ.currentXP * 0.05) : 0;

  const penaltyText = new Text({
    text: `P\u00E9nalit\u00E9: -${goldLost} or  -${xpLost} XP`,
    style: new TextStyle({
      fontFamily: 'sans-serif',
      fontSize: fontSize(13, layout),
      fill: 0xff6644,
      fontWeight: 'bold',
    }),
  });
  penaltyText.anchor.set(0.5);
  penaltyText.x = screenW / 2;
  penaltyText.y = screenH / 2 - scaled(22, layout);
  panel.addChild(penaltyText);

  // Apply penalties
  if (champ) {
    champ.gold = Math.max(0, champ.gold - goldLost);
    champ.currentXP = Math.max(0, champ.currentXP - xpLost);
  }

  // Flavor text
  const worldID = champ?.currentWorldID ?? 'scadrial';
  const flavorTexts: Record<string, string> = {
    scadrial: 'Les brumes vous enveloppent... vous sombrez dans l\'obscurit\u00E9.',
    roshar: 'La Lumi\u00E8re d\'Orage s\'\u00E9teint... les t\u00E9n\u00E8bres vous happent.',
    nalthis: 'Vos couleurs s\'estompent... le monde devient gris.',
    taldain: 'Le sable retombe... le silence du d\u00E9sert vous engloutit.',
    sel: 'Les Aons s\'effacent... le Dor vous abandonne.',
    komashi: 'Les cauchemars vous submergent... tout devient noir.',
    shadesmar: 'Le Royaume Cognitif se dissout autour de vous...',
  };

  const flavor = new Text({
    text: flavorTexts[worldID] ?? flavorTexts.scadrial,
    style: new TextStyle({
      fontFamily: 'Georgia, serif',
      fontSize: fontSize(11, layout),
      fill: 0x886666,
      fontStyle: 'italic',
      wordWrap: true,
      wordWrapWidth: screenW - scaled(80, layout),
      align: 'center',
    }),
  });
  flavor.anchor.set(0.5);
  flavor.x = screenW / 2;
  flavor.y = screenH / 2 + scaled(12, layout);
  panel.addChild(flavor);

  // Respawn button (appears after 1.5s delay) — larger, more accessible
  const btnW = scaled(180, layout);
  const btnH = buttonHeight(layout) + scaled(4, layout);
  const radius = panelRadius(layout);
  const btnContainer = new Container();
  btnContainer.alpha = 0;

  const btnBg = new Graphics();
  btnBg.roundRect(screenW / 2 - btnW / 2, screenH / 2 + scaled(52, layout), btnW, btnH, radius)
    .fill({ color: 0x331111, alpha: 0.92 })
    .stroke({ color: 0xcc4444, width: 2, alpha: 0.8 });
  btnBg.eventMode = 'static';
  btnBg.cursor = 'pointer';
  btnContainer.addChild(btnBg);

  const btnLabel = new Text({
    text: 'R\u00E9appara\u00EEtre',
    style: new TextStyle({
      fontFamily: 'Georgia, serif',
      fontSize: fontSize(15, layout),
      fill: 0xffcccc,
      fontWeight: 'bold',
    }),
  });
  btnLabel.anchor.set(0.5);
  btnLabel.x = screenW / 2;
  btnLabel.y = screenH / 2 + scaled(52, layout) + btnH / 2;
  btnContainer.addChild(btnLabel);

  panel.addChild(btnContainer);

  // Smooth fade-in button after delay
  let elapsed = 0;
  let lastTime = performance.now();
  const fadeIn = () => {
    const now = performance.now();
    const frameDt = (now - lastTime) / 1000;
    lastTime = now;
    elapsed += frameDt;
    if (elapsed < 1.5) {
      requestAnimationFrame(fadeIn);
      return;
    }
    const fadeProgress = Math.min(1, (elapsed - 1.5) / 0.5);
    btnContainer.alpha = fadeProgress;
    if (fadeProgress < 1) requestAnimationFrame(fadeIn);
  };
  requestAnimationFrame(fadeIn);

  btnBg.on('pointerdown', () => {
    btnBg.alpha = 0.7;
    onRespawn();
  });
  btnBg.on('pointerup', () => { btnBg.alpha = 1; });

  uiContainer.addChild(panel);
  return panel;
}
