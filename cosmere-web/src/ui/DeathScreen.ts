import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { GameManager } from '../game/GameManager';

export function showDeathScreen(
  uiContainer: Container,
  screenW: number,
  screenH: number,
  onRespawn: () => void,
): Container {
  const panel = new Container();
  panel.zIndex = 20000;

  // Full screen dark overlay with red tint
  const overlay = new Graphics();
  overlay.rect(0, 0, screenW, screenH).fill({ color: 0x110000, alpha: 0.85 });
  overlay.eventMode = 'static';
  panel.addChild(overlay);

  // Blood vignette edges
  const vignette = new Graphics();
  vignette.rect(0, 0, screenW, 30).fill({ color: 0x440000, alpha: 0.6 });
  vignette.rect(0, screenH - 30, screenW, 30).fill({ color: 0x440000, alpha: 0.6 });
  vignette.rect(0, 0, 20, screenH).fill({ color: 0x440000, alpha: 0.4 });
  vignette.rect(screenW - 20, 0, 20, screenH).fill({ color: 0x440000, alpha: 0.4 });
  panel.addChild(vignette);

  // Death title
  const title = new Text({
    text: 'VOUS ÊTES TOMBÉ',
    style: new TextStyle({
      fontFamily: 'Georgia, serif',
      fontSize: 28,
      fill: 0xcc2222,
      fontWeight: 'bold',
      dropShadow: { color: 0x000000, blur: 4, distance: 2 },
    }),
  });
  title.anchor.set(0.5);
  title.x = screenW / 2;
  title.y = screenH / 2 - 60;
  panel.addChild(title);

  // Penalty info
  const champ = GameManager.shared.champion;
  const goldLost = champ ? Math.floor(champ.gold * 0.1) : 0;
  const xpLost = champ ? Math.floor(champ.currentXP * 0.05) : 0;

  const penaltyText = new Text({
    text: `Pénalité: -${goldLost} or  -${xpLost} XP`,
    style: new TextStyle({
      fontFamily: 'sans-serif',
      fontSize: 12,
      fill: 0xff6644,
    }),
  });
  penaltyText.anchor.set(0.5);
  penaltyText.x = screenW / 2;
  penaltyText.y = screenH / 2 - 20;
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
      fontSize: 10,
      fill: 0x886666,
      fontStyle: 'italic',
      wordWrap: true,
      wordWrapWidth: screenW - 80,
      align: 'center',
    }),
  });
  flavor.anchor.set(0.5);
  flavor.x = screenW / 2;
  flavor.y = screenH / 2 + 10;
  panel.addChild(flavor);

  // Respawn button (appears after 1.5s delay)
  const btnW = 160;
  const btnH = 36;
  const btnContainer = new Container();
  btnContainer.alpha = 0;

  const btnBg = new Graphics();
  btnBg.roundRect(screenW / 2 - btnW / 2, screenH / 2 + 50, btnW, btnH, 8)
    .fill({ color: 0x331111, alpha: 0.9 })
    .stroke({ color: 0xcc4444, width: 1.5, alpha: 0.7 });
  btnBg.eventMode = 'static';
  btnBg.cursor = 'pointer';
  btnContainer.addChild(btnBg);

  const btnLabel = new Text({
    text: 'Réapparaître',
    style: new TextStyle({
      fontFamily: 'Georgia, serif',
      fontSize: 14,
      fill: 0xffcccc,
      fontWeight: 'bold',
    }),
  });
  btnLabel.anchor.set(0.5);
  btnLabel.x = screenW / 2;
  btnLabel.y = screenH / 2 + 50 + btnH / 2;
  btnContainer.addChild(btnLabel);

  panel.addChild(btnContainer);

  // Fade-in button after delay
  let elapsed = 0;
  const fadeIn = () => {
    elapsed += 1 / 60;
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
