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

export function showShopPanel(
  uiContainer: Container,
  screenW: number, screenH: number,
  onClose: () => void,
  showFloatingText: (x: number, y: number, msg: string, color: number) => void,
  playerPos: { x: number; y: number },
): Container {
  const champ = GameManager.shared.champion;
  if (!champ) return new Container();

  const panel = new Container();
  panel.zIndex = 10000;

  const overlay = new Graphics();
  overlay.rect(0, 0, screenW, screenH).fill({ color: 0x000000, alpha: 0.5 });
  overlay.eventMode = 'static';
  panel.addChild(overlay);

  const panelW = Math.min(300, screenW - 40);
  const panelH = 280;
  const px = (screenW - panelW) / 2;
  const py = (screenH - panelH) / 2;

  const bg = new Graphics();
  bg.roundRect(px, py, panelW, panelH, 12)
    .fill({ color: 0x0a0815, alpha: 0.95 })
    .stroke({ color: 0x886633, width: 2, alpha: 0.8 });
  bg.eventMode = 'static';
  panel.addChild(bg);

  // Title
  const title = new Text({
    text: 'BOUTIQUE',
    style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 16, fill: 0xe6cc66, fontWeight: 'bold' }),
  });
  title.anchor.set(0.5);
  title.x = screenW / 2;
  title.y = py + 18;
  panel.addChild(title);

  // Gold
  const goldLabel = new Text({
    text: `Or: ${champ.gold}`,
    style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 12, fill: 0xe6cc33 }),
  });
  goldLabel.anchor.set(0.5);
  goldLabel.x = screenW / 2;
  goldLabel.y = py + 38;
  panel.addChild(goldLabel);

  // Shop items
  const shopItems = [
    { name: 'Potion de soin', cost: 20, effect: 'hp', value: 50 },
    { name: 'Potion d\'investiture', cost: 25, effect: 'inv', value: 40 },
    { name: 'Élixir de force', cost: 40, effect: 'str', value: 2 },
    { name: 'Élixir d\'agilité', cost: 40, effect: 'agi', value: 2 },
    { name: 'Élixir d\'esprit', cost: 45, effect: 'spi', value: 2 },
  ];

  shopItems.forEach((item, i) => {
    const itemY = py + 58 + i * 36;
    const itemBg = new Graphics();
    itemBg.roundRect(px + 10, itemY, panelW - 20, 30, 6)
      .fill({ color: 0x1a1528, alpha: 0.8 })
      .stroke({ color: 0x443322, width: 1, alpha: 0.5 });
    itemBg.eventMode = 'static';
    itemBg.cursor = 'pointer';
    panel.addChild(itemBg);

    const itemName = new Text({
      text: item.name,
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 10, fill: 0xddddcc }),
    });
    itemName.x = px + 18;
    itemName.y = itemY + 4;
    panel.addChild(itemName);

    const canBuy = champ.gold >= item.cost;
    const costText = new Text({
      text: `${item.cost} or`,
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 10, fill: canBuy ? 0xe6cc33 : 0x884444 }),
    });
    costText.anchor.set(1, 0);
    costText.x = px + panelW - 18;
    costText.y = itemY + 4;
    panel.addChild(costText);

    const buyLabel = new Text({
      text: canBuy ? 'Acheter' : 'Pas assez d\'or',
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 8, fill: canBuy ? 0x66cc44 : 0x666666 }),
    });
    buyLabel.x = px + 18;
    buyLabel.y = itemY + 17;
    panel.addChild(buyLabel);

    if (canBuy) {
      itemBg.on('pointerdown', () => {
        champ.gold -= item.cost;
        switch (item.effect) {
          case 'hp': champ.currentHP = Math.min(GameManager.shared.maxHP, champ.currentHP + item.value); break;
          case 'inv': champ.currentInvestiture = Math.min(GameManager.shared.maxInvestiture, champ.currentInvestiture + item.value); break;
          case 'str': champ.baseStats.strength += item.value; break;
          case 'agi': champ.baseStats.agility += item.value; break;
          case 'spi': champ.baseStats.spirit += item.value; break;
        }
        onClose();
        showFloatingText(playerPos.x, playerPos.y - 40, `${item.name} acheté!`, 0x66cc44);
      });
    }
  });

  // Close button
  const closeBg = new Graphics();
  closeBg.roundRect(px + panelW / 2 - 40, py + panelH - 32, 80, 24, 6)
    .fill({ color: 0x553322, alpha: 0.8 })
    .stroke({ color: 0x886644, width: 1 });
  closeBg.eventMode = 'static';
  closeBg.cursor = 'pointer';
  closeBg.on('pointerdown', onClose);
  panel.addChild(closeBg);

  const closeLabel = new Text({
    text: 'Fermer',
    style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 11, fill: 0xeeddcc }),
  });
  closeLabel.anchor.set(0.5);
  closeLabel.x = px + panelW / 2;
  closeLabel.y = py + panelH - 20;
  panel.addChild(closeLabel);

  overlay.on('pointerdown', onClose);
  uiContainer.addChild(panel);
  return panel;
}
