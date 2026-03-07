import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { GameManager } from '../game/GameManager';

// ─── Dialogue Tree System ───────────────────────────────────────

interface DialogueChoice {
  text: string;
  nextNodeID: string | null; // null = end dialogue
  reward?: { xp?: number; gold?: number; reputation?: number };
  condition?: 'high_level' | 'has_gold' | 'none';
}

interface DialogueNode {
  id: string;
  text: string;
  choices: DialogueChoice[];
}

interface DialogueTree {
  nodes: DialogueNode[];
  startNodeID: string;
}

// Per-world dialogue trees for NPCs
const WORLD_DIALOGUES: Record<string, DialogueTree[]> = {
  scadrial: [
    {
      startNodeID: 'start',
      nodes: [
        { id: 'start', text: 'Les brumes sont denses ce soir... Tu n\'es pas d\'ici, n\'est-ce pas?', choices: [
          { text: 'Je cherche des informations sur Kelsier.', nextNodeID: 'kelsier', reward: { xp: 15 } },
          { text: 'Que sais-tu sur les Inquisiteurs?', nextNodeID: 'inquisitors' },
          { text: 'Je ne fais que passer.', nextNodeID: null, reward: { xp: 5, gold: 5 } },
        ]},
        { id: 'kelsier', text: 'Kelsier? Le Survivant? Il a tout changé pour nous, les skaa. Son héritage vit encore dans la rébellion.', choices: [
          { text: 'Comment puis-je aider la rébellion?', nextNodeID: 'rebellion', reward: { xp: 20, reputation: 5 } },
          { text: 'Merci pour l\'information.', nextNodeID: null, reward: { gold: 10 } },
        ]},
        { id: 'inquisitors', text: 'Les Inquisiteurs... Leurs pics d\'acier à la place des yeux. Ils voient tout, entendent tout. Ne les affronte pas seul.', choices: [
          { text: 'Je n\'ai pas peur d\'eux.', nextNodeID: null, reward: { xp: 10 } },
          { text: 'Comment les vaincre?', nextNodeID: 'weakness', reward: { xp: 15 } },
        ]},
        { id: 'rebellion', text: 'Élimine les patrouilles corrompues et récupère les fioles de métal. C\'est notre meilleur espoir.', choices: [
          { text: 'J\'accepte cette mission.', nextNodeID: null, reward: { xp: 25, gold: 15, reputation: 10 } },
        ]},
        { id: 'weakness', text: 'Arrache leurs pics. Sans hémalurgie, ils perdent leurs pouvoirs. Mais approcher est le plus dur...', choices: [
          { text: 'Je trouverai un moyen.', nextNodeID: null, reward: { xp: 20 } },
        ]},
      ],
    },
    {
      startNodeID: 'start',
      nodes: [
        { id: 'start', text: 'La cendre tombe sans relâche. Un autre jour à Luthadel...', choices: [
          { text: 'Les cendres sont-elles dangereuses?', nextNodeID: 'ash' },
          { text: 'As-tu quelque chose à vendre?', nextNodeID: null, reward: { xp: 5 } },
        ]},
        { id: 'ash', text: 'Pas directement, mais elles étouffent les cultures. Les skaa meurent de faim pendant que les nobles festoient.', choices: [
          { text: 'C\'est injuste.', nextNodeID: null, reward: { xp: 10, reputation: 5 } },
          { text: 'Chacun pour soi.', nextNodeID: null, reward: { xp: 5, gold: 10 } },
        ]},
      ],
    },
  ],
  roshar: [
    {
      startNodeID: 'start',
      nodes: [
        { id: 'start', text: 'Kelek! Un Radieux? Cela faisait longtemps... Les Désolations recommencent?', choices: [
          { text: 'Que savez-vous des Désolations?', nextNodeID: 'desolation', reward: { xp: 15 } },
          { text: 'J\'ai besoin de Lumière d\'Orage.', nextNodeID: 'stormlight' },
          { text: 'Parlez-moi des sprens.', nextNodeID: 'spren' },
        ]},
        { id: 'desolation', text: 'Les Néantifères reviennent. Odium rassemble ses forces. Seuls les Radiants peuvent nous sauver.', choices: [
          { text: 'Je protègerai ce monde.', nextNodeID: null, reward: { xp: 25, reputation: 10 } },
          { text: 'C\'est un fardeau trop lourd.', nextNodeID: null, reward: { xp: 10 } },
        ]},
        { id: 'stormlight', text: 'Les sphères se rechargent pendant les Tempêtes. Plus la gemme est grosse, plus elle contient de Lumière.', choices: [
          { text: 'Où trouver de grandes gemmes?', nextNodeID: null, reward: { xp: 15, gold: 10 } },
        ]},
        { id: 'spren', text: 'Les sprens sont l\'essence même de Roshar. Ton spren te lie aux Surges. Protège-le bien.', choices: [
          { text: 'Mon spren est ma force.', nextNodeID: null, reward: { xp: 20, reputation: 5 } },
        ]},
      ],
    },
  ],
  nalthis: [
    {
      startNodeID: 'start',
      nodes: [
        { id: 'start', text: 'Les couleurs! Comme elles brillent autour de toi! Tu as beaucoup de Souffles, étranger.', choices: [
          { text: 'Qu\'est-ce que les Souffles?', nextNodeID: 'breaths' },
          { text: 'Parlez-moi du Dieu-Roi.', nextNodeID: 'godking', reward: { xp: 10 } },
          { text: 'Je cherche un Retourné.', nextNodeID: null, reward: { xp: 15, gold: 5 } },
        ]},
        { id: 'breaths', text: 'Chaque personne naît avec un Souffle. On peut le donner, l\'échanger... Plus tu en as, plus tu perçois les couleurs.', choices: [
          { text: 'Comment en obtenir plus?', nextNodeID: null, reward: { xp: 20 } },
          { text: 'Fascinant. Merci.', nextNodeID: null, reward: { xp: 10, reputation: 5 } },
        ]},
        { id: 'godking', text: 'Susebron? Il possède des milliers de Souffles. Mais il est prisonnier de ses propres prêtres.', choices: [
          { text: 'Il faut le libérer.', nextNodeID: null, reward: { xp: 20, reputation: 10 } },
          { text: 'Ce n\'est pas mon problème.', nextNodeID: null, reward: { xp: 5, gold: 15 } },
        ]},
      ],
    },
  ],
  taldain: [
    {
      startNodeID: 'start',
      nodes: [
        { id: 'start', text: 'Le soleil brûle fort aujourd\'hui. Bon pour la maîtrise du sable, mauvais pour la peau.', choices: [
          { text: 'Apprenez-moi la maîtrise du sable.', nextNodeID: 'sand', reward: { xp: 15 } },
          { text: 'Que se passe-t-il du Côté Nuit?', nextNodeID: 'darkside' },
        ]},
        { id: 'sand', text: 'Le sable blanc absorbe l\'eau et l\'énergie solaire. Concentre-toi et il obéira à ta volonté.', choices: [
          { text: 'Je sens le pouvoir!', nextNodeID: null, reward: { xp: 25, reputation: 5 } },
        ]},
        { id: 'darkside', text: 'Darkside est un lieu de ténèbres éternelles. Le Seigneur des Sables y règne. Personne n\'en revient.', choices: [
          { text: 'J\'irai quand même.', nextNodeID: null, reward: { xp: 15, reputation: 10 } },
          { text: 'Mieux vaut éviter.', nextNodeID: null, reward: { xp: 5, gold: 10 } },
        ]},
      ],
    },
  ],
  sel: [
    {
      startNodeID: 'start',
      nodes: [
        { id: 'start', text: 'Les Aons brillent à nouveau! Elantris se réveille après tant d\'années de désolation.', choices: [
          { text: 'Parlez-moi des Aons.', nextNodeID: 'aons', reward: { xp: 15 } },
          { text: 'Qu\'est-ce que le Dor?', nextNodeID: 'dor' },
        ]},
        { id: 'aons', text: 'Chaque Aon est un symbole de pouvoir. Dessine-les correctement et le Dor coulera à travers eux.', choices: [
          { text: 'Je maîtriserai cet art.', nextNodeID: null, reward: { xp: 20, reputation: 5 } },
        ]},
        { id: 'dor', text: 'Le Dor est l\'énergie pure du Cosmere sur Sel. Il alimente les Aons, les ChayShan, et même les os Dakhor.', choices: [
          { text: 'Les Dakhor sont-ils dangereux?', nextNodeID: null, reward: { xp: 15 } },
          { text: 'Merci pour cette leçon.', nextNodeID: null, reward: { xp: 10, gold: 10 } },
        ]},
      ],
    },
  ],
  komashi: [
    {
      startNodeID: 'start',
      nodes: [
        { id: 'start', text: 'Les cauchemars sont plus agités que d\'habitude. Tu les sens aussi, n\'est-ce pas?', choices: [
          { text: 'Comment les combattre?', nextNodeID: 'fight', reward: { xp: 15 } },
          { text: 'D\'où viennent-ils?', nextNodeID: 'origin' },
        ]},
        { id: 'fight', text: 'Peins-les. Capture leur essence sur ta toile et ils perdront leur pouvoir. Empile des pierres pour créer des barrières.', choices: [
          { text: 'Je bannirai chaque cauchemar.', nextNodeID: null, reward: { xp: 25, reputation: 10 } },
        ]},
        { id: 'origin', text: 'Le Père des Cauchemars. Une entité primordiale. Sa machine pulse au cœur des ténèbres.', choices: [
          { text: 'Il faut détruire cette machine.', nextNodeID: null, reward: { xp: 20, reputation: 5 } },
          { text: 'C\'est effrayant.', nextNodeID: null, reward: { xp: 10 } },
        ]},
      ],
    },
  ],
  shadesmar: [
    {
      startNodeID: 'start',
      nodes: [
        { id: 'start', text: 'Bienvenue dans le Royaume Cognitif. Ici, les pensées ont une forme. As-tu des billes à échanger?', choices: [
          { text: 'Comment fonctionne le commerce ici?', nextNodeID: 'trade', reward: { xp: 15 } },
          { text: 'Je cherche un passage vers le Royaume Physique.', nextNodeID: 'passage' },
        ]},
        { id: 'trade', text: 'Les billes sont des pensées cristallisées. Chaque objet du monde physique a une bille ici. Plus c\'est rare, plus c\'est cher.', choices: [
          { text: 'Je veux échanger.', nextNodeID: null, reward: { xp: 10, gold: 20 } },
        ]},
        { id: 'passage', text: 'Les perpendiculaires. Des points où les Royaumes se croisent. Dangereux, mais c\'est le seul chemin.', choices: [
          { text: 'Je prendrai le risque.', nextNodeID: null, reward: { xp: 20, reputation: 5 } },
        ]},
      ],
    },
  ],
};

// ─── Dialogue Panel with Choices ────────────────────────────────

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

  // Pick a dialogue tree
  const trees = WORLD_DIALOGUES[worldID] ?? WORLD_DIALOGUES.scadrial;
  const tree = trees[Math.floor(Math.random() * trees.length)];
  const nodeMap = new Map<string, DialogueNode>();
  for (const node of tree.nodes) nodeMap.set(node.id, node);

  // State
  let currentNode = nodeMap.get(tree.startNodeID)!;
  const contentContainer = new Container();
  panel.addChild(contentContainer);

  function renderNode(node: DialogueNode): void {
    contentContainer.removeChildren();

    const panelH = 60 + node.choices.length * 30;
    const panelY = screenH - panelH - 20;

    // Panel background
    const bg = new Graphics();
    bg.roundRect(20, panelY, screenW - 40, panelH, 12)
      .fill({ color: 0x0a0815, alpha: 0.92 })
      .stroke({ color: 0x665533, width: 2, alpha: 0.7 });
    bg.eventMode = 'static';
    contentContainer.addChild(bg);

    // NPC name
    const nameLabel = new Text({
      text: npcName,
      style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 12, fill: 0xe6cc66, fontWeight: 'bold' }),
    });
    nameLabel.x = 36;
    nameLabel.y = panelY + 8;
    contentContainer.addChild(nameLabel);

    // Dialogue text
    const dialogueText = new Text({
      text: node.text,
      style: new TextStyle({
        fontFamily: 'Georgia, serif', fontSize: 10, fill: 0xddddcc,
        wordWrap: true, wordWrapWidth: screenW - 80,
      }),
    });
    dialogueText.x = 36;
    dialogueText.y = panelY + 26;
    contentContainer.addChild(dialogueText);

    // Choices
    const choiceStartY = panelY + 50;
    node.choices.forEach((choice, i) => {
      const choiceY = choiceStartY + i * 28;

      const choiceBg = new Graphics();
      choiceBg.roundRect(30, choiceY, screenW - 60, 24, 4)
        .fill({ color: 0x1a1528, alpha: 0.7 })
        .stroke({ color: 0x443355, width: 1, alpha: 0.4 });
      choiceBg.eventMode = 'static';
      choiceBg.cursor = 'pointer';
      contentContainer.addChild(choiceBg);

      const arrow = new Text({
        text: '▸',
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 10, fill: 0xe6cc66 }),
      });
      arrow.x = 38;
      arrow.y = choiceY + 4;
      contentContainer.addChild(arrow);

      const choiceText = new Text({
        text: choice.text,
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 9, fill: 0xccccbb }),
      });
      choiceText.x = 52;
      choiceText.y = choiceY + 5;
      contentContainer.addChild(choiceText);

      // Reward hint
      if (choice.reward) {
        const parts: string[] = [];
        if (choice.reward.xp) parts.push(`+${choice.reward.xp}XP`);
        if (choice.reward.gold) parts.push(`+${choice.reward.gold}or`);
        if (parts.length > 0) {
          const rewardHint = new Text({
            text: parts.join(' '),
            style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 7, fill: 0x66aa44 }),
          });
          rewardHint.anchor.set(1, 0);
          rewardHint.x = screenW - 38;
          rewardHint.y = choiceY + 7;
          contentContainer.addChild(rewardHint);
        }
      }

      choiceBg.on('pointerdown', () => {
        // Grant rewards
        if (choice.reward) {
          const champ = GameManager.shared.champion;
          if (champ) {
            if (choice.reward.xp) GameManager.shared.grantXP(choice.reward.xp);
            if (choice.reward.gold) champ.gold += choice.reward.gold;
          }
        }

        // Navigate to next node or close
        if (choice.nextNodeID) {
          const nextNode = nodeMap.get(choice.nextNodeID);
          if (nextNode) {
            currentNode = nextNode;
            renderNode(nextNode);
            return;
          }
        }
        onClose();
      });
    });
  }

  renderNode(currentNode);

  // Close on overlay tap only if no choices visible
  overlay.on('pointerdown', onClose);

  uiContainer.addChild(panel);
  return panel;
}

// ─── Shop Panel (unchanged) ─────────────────────────────────────

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

  const title = new Text({
    text: 'BOUTIQUE',
    style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 16, fill: 0xe6cc66, fontWeight: 'bold' }),
  });
  title.anchor.set(0.5);
  title.x = screenW / 2;
  title.y = py + 18;
  panel.addChild(title);

  const goldLabel = new Text({
    text: `Or: ${champ.gold}`,
    style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 12, fill: 0xe6cc33 }),
  });
  goldLabel.anchor.set(0.5);
  goldLabel.x = screenW / 2;
  goldLabel.y = py + 38;
  panel.addChild(goldLabel);

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
