import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { GameManager } from '../game/GameManager';

const WORLD_DIALOGUES: Record<string, string[]> = {
  scadrial: [
    'Les brumes sont plus denses ces derniers temps...',
    'Méfie-toi des Inquisiteurs qui rôdent dans la nuit.',
    'Le Seigneur Dirigeant surveille tout. Sois prudent.',
    'J\'ai entendu parler d\'un groupe de skaa rebelles...',
    'Les métaux sont notre arme. N\'oublie jamais ça.',
    'La cendre tombe sans relâche sur Luthadel.',
  ],
  roshar: [
    'La Tempête Éternelle approche, prépare-toi!',
    'Les sprens sont agités aujourd\'hui...',
    'Que la Lumière d\'Orage te protège, Radieux.',
    'Les Néantifères se rassemblent aux frontières.',
    'Vie avant la mort, force avant la faiblesse.',
    'As-tu vu les lignes de Stormlight récemment?',
  ],
  nalthis: [
    'Les couleurs semblent s\'estomper dans ce quartier.',
    'Combien de Souffles possèdes-tu, étranger?',
    'Le Dieu-Roi ne reçoit plus de visiteurs.',
    'La vie est belle à Hallandren, n\'est-ce pas?',
    'Les Retournés marchent parmi nous.',
    'Un Souffle de plus et tu verras les auras.',
  ],
  taldain: [
    'Le sable blanc est rare par ici.',
    'L\'énergie solaire alimente nos pouvoirs.',
    'Les tempêtes de sable sont de plus en plus fréquentes.',
    'Attention aux créatures qui vivent sous le sable.',
    'Le Côté Jour est notre royaume, le Côté Nuit notre peur.',
  ],
  sel: [
    'Les Aons brillent d\'un éclat particulier ce soir.',
    'Elantris retrouve peu à peu sa splendeur.',
    'Le Dor coule en abondance ici.',
    'Les Seons dansent dans la lumière.',
    'Les moines Dakhor sont une menace constante.',
  ],
  komashi: [
    'Les cauchemars sont de plus en plus vivaces...',
    'Tes peintures ont un pouvoir remarquable.',
    'Les pierres empilées nous protègent la nuit.',
    'Méfie-toi des ombres qui bougent.',
    'Le Père des Cauchemars rôde dans les ténèbres.',
  ],
  shadesmar: [
    'Les billes sont la monnaie ici, ne l\'oublie pas.',
    'Les flamespren éclairent notre chemin.',
    'Le Royaume Cognitif est vaste et dangereux.',
    'Chaque pensée prend forme dans ce monde.',
    'Les honorsprens sont méfiants envers les humains.',
  ],
};

export function showDialoguePanel(
  uiContainer: Container,
  screenW: number, screenH: number,
  worldID: string,
  npcName: string,
  onClose: () => void,
): Container {
  const panel = new Container();
  panel.zIndex = 10000;

  // Dark overlay
  const overlay = new Graphics();
  overlay.rect(0, 0, screenW, screenH).fill({ color: 0x000000, alpha: 0.4 });
  overlay.eventMode = 'static';
  panel.addChild(overlay);

  // Panel background
  const panelH = 130;
  const panelY = screenH - panelH - 20;
  const bg = new Graphics();
  bg.roundRect(20, panelY, screenW - 40, panelH, 12)
    .fill({ color: 0x0a0815, alpha: 0.92 })
    .stroke({ color: 0x665533, width: 2, alpha: 0.7 });
  bg.eventMode = 'static';
  panel.addChild(bg);

  // NPC name
  const nameLabel = new Text({
    text: npcName,
    style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 14, fill: 0xe6cc66, fontWeight: 'bold' }),
  });
  nameLabel.x = 36;
  nameLabel.y = panelY + 10;
  panel.addChild(nameLabel);

  // Dialogue text
  const lines = WORLD_DIALOGUES[worldID] ?? WORLD_DIALOGUES.scadrial;
  const chosenLine = lines[Math.floor(Math.random() * lines.length)];
  const dialogueText = new Text({
    text: chosenLine,
    style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 12, fill: 0xddddcc, wordWrap: true, wordWrapWidth: screenW - 80 }),
  });
  dialogueText.x = 36;
  dialogueText.y = panelY + 34;
  panel.addChild(dialogueText);

  // Close hint
  const closeHint = new Text({
    text: 'Toucher pour fermer',
    style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 9, fill: 0x888888 }),
  });
  closeHint.anchor.set(0.5);
  closeHint.x = screenW / 2;
  closeHint.y = panelY + panelH - 14;
  panel.addChild(closeHint);

  // Rewards
  const champ = GameManager.shared.champion;
  if (champ) {
    const xpReward = 10 + Math.floor(Math.random() * 15);
    const goldReward = 5 + Math.floor(Math.random() * 10);
    champ.gold += goldReward;
    GameManager.shared.grantXP(xpReward);
    const rewardText = new Text({
      text: `+${xpReward} XP  +${goldReward} or`,
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 10, fill: 0x66cc44, fontWeight: 'bold' }),
    });
    rewardText.anchor.set(1, 0);
    rewardText.x = screenW - 36;
    rewardText.y = panelY + 10;
    panel.addChild(rewardText);
  }

  overlay.on('pointerdown', onClose);
  bg.on('pointerdown', onClose);

  uiContainer.addChild(panel);
  return panel;
}
