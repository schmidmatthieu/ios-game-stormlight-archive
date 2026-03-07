import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { GameManager } from '../game/GameManager';
import { getLayoutInfo, fontSize, scaled } from '../ui/ResponsiveLayout';
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

  // Full screen dark overlay with red tint
  const overlay = new Graphics();
  overlay.rect(0, 0, screenW, screenH).fill({ color: 0x110000, alpha: 0.85 });
  overlay.eventMode = 'static';
  panel.addChild(overlay);

  // Blood vignette edges
  const vignetteH = scaled(30, layout);
  const vignetteW = scaled(20, layout);
  const vignette = new Graphics();
  vignette.rect(0, 0, screenW, vignetteH).fill({ color: 0x440000, alpha: 0.6 });
  vignette.rect(0, screenH - vignetteH, screenW, vignetteH).fill({ color: 0x440000, alpha: 0.6 });
  vignette.rect(0, 0, vignetteW, screenH).fill({ color: 0x440000, alpha: 0.4 });
  vignette.rect(screenW - vignetteW, 0, vignetteW, screenH).fill({ color: 0x440000, alpha: 0.4 });
  panel.addChild(vignette);

  // Death title
  const title = new Text({
    text: 'VOUS ÊTES TOMBÉ',
    style: new TextStyle({
      fontFamily: 'Georgia, serif',
      fontSize: fontSize(28, layout),
      fill: 0xcc2222,
      fontWeight: 'bold',
      dropShadow: { color: 0x000000, blur: 4, distance: 2 },
    }),
  });
  title.anchor.set(0.5);
  title.x = screenW / 2;
  title.y = screenH / 2 - scaled(60, layout);
  panel.addChild(title);

  // Penalty info
  const champ = GameManager.shared.champion;
  const goldLost = champ ? Math.floor(champ.gold * 0.1) : 0;
  const xpLost = champ ? Math.floor(champ.currentXP * 0.05) : 0;

  const penaltyText = new Text({
    text: `Pénalité: -${goldLost} or  -${xpLost} XP`,
    style: new TextStyle({
      fontFamily: 'sans-serif',
      fontSize: fontSize(12, layout),
      fill: 0xff6644,
    }),
  });
  penaltyText.anchor.set(0.5);
  penaltyText.x = screenW / 2;
  penaltyText.y = screenH / 2 - scaled(20, layout);
  panel.addChild(penaltyText);

  // Apply penalties
  if (champ) {
    champ.gold = Math.max(0, champ.gold - goldLost);
    champ.currentXP = Math.max(0, champ.currentXP - xpLost);
  }

  // Flavor text
  const worldID = champ?.currentWorldID ?? 'scadrial';
  const flavorTexts: Record<string, string> = {
    scadrial: 'Les brumes vous enveloppent... vous sombrez dans l\'obscurité.',
    roshar: 'La Lumière d\'Orage s\'éteint... les ténèbres vous happent.',
    nalthis: 'Vos couleurs s\'estompent... le monde devient gris.',
    taldain: 'Le sable retombe... le silence du désert vous engloutit.',
    sel: 'Les Aons s\'effacent... le Dor vous abandonne.',
    komashi: 'Les cauchemars vous submergent... tout devient noir.',
    shadesmar: 'Le Royaume Cognitif se dissout autour de vous...',
  };

  const flavor = new Text({
    text: flavorTexts[worldID] ?? flavorTexts.scadrial,
    style: new TextStyle({
      fontFamily: 'Georgia, serif',
      fontSize: fontSize(10, layout),
      fill: 0x886666,
      fontStyle: 'italic',
      wordWrap: true,
      wordWrapWidth: screenW - scaled(80, layout),
      align: 'center',
    }),
  });
  flavor.anchor.set(0.5);
  flavor.x = screenW / 2;
  flavor.y = screenH / 2 + scaled(10, layout);
  panel.addChild(flavor);

  // Respawn button (appears after 1.5s delay)
  const btnW = scaled(160, layout);
  const btnH = scaled(36, layout);
  const btnContainer = new Container();
  btnContainer.alpha = 0;

  const btnBg = new Graphics();
  btnBg.roundRect(screenW / 2 - btnW / 2, screenH / 2 + scaled(50, layout), btnW, btnH, 8)
    .fill({ color: 0x331111, alpha: 0.9 })
    .stroke({ color: 0xcc4444, width: 1.5, alpha: 0.7 });
  btnBg.eventMode = 'static';
  btnBg.cursor = 'pointer';
  btnContainer.addChild(btnBg);

  const btnLabel = new Text({
    text: 'Réapparaître',
    style: new TextStyle({
      fontFamily: 'Georgia, serif',
      fontSize: fontSize(14, layout),
      fill: 0xffcccc,
      fontWeight: 'bold',
    }),
  });
  btnLabel.anchor.set(0.5);
  btnLabel.x = screenW / 2;
  btnLabel.y = screenH / 2 + scaled(50, layout) + btnH / 2;
  btnContainer.addChild(btnLabel);

  panel.addChild(btnContainer);

  // Fade-in button after delay
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

  btnBg.on('pointerdown', onRespawn);

  uiContainer.addChild(panel);
  return panel;
}
