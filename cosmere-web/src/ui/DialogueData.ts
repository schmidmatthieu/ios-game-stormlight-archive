// ─── Dialogue Tree Types & World Dialogue Data ─────────────────

export interface DialogueChoice {
  text: string;
  nextNodeID: string | null; // null = end dialogue
  reward?: { xp?: number; gold?: number; reputation?: number };
  condition?: 'high_level' | 'has_gold' | 'none';
}

export interface DialogueNode {
  id: string;
  text: string;
  choices: DialogueChoice[];
}

export interface DialogueTree {
  nodes: DialogueNode[];
  startNodeID: string;
}

// Per-world dialogue trees for NPCs
export const WORLD_DIALOGUES: Record<string, DialogueTree[]> = {
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
          { text: 'C\'est injuste. Il faut agir.', nextNodeID: 'revolt', reward: { xp: 10, reputation: 5 } },
          { text: 'Chacun pour soi.', nextNodeID: null, reward: { xp: 5, gold: 10 } },
        ]},
        { id: 'revolt', text: 'Tu parles comme un rebelle... Bien. Si tu veux aider, infiltre le bal des nobles à Kredik Shaw et vole leurs réserves de métaux.', choices: [
          { text: 'Je suis prêt pour l\'infiltration.', nextNodeID: null, reward: { xp: 25, reputation: 15, gold: 20 } },
          { text: 'C\'est trop risqué.', nextNodeID: null, reward: { xp: 5 } },
        ]},
      ],
    },
    {
      startNodeID: 'start',
      nodes: [
        { id: 'start', text: 'Tu brûles des métaux, pas vrai? Je le vois dans tes yeux — un brumeux complet. C\'est rare.', choices: [
          { text: 'Que savez-vous de l\'Allomancie?', nextNodeID: 'metals', reward: { xp: 15 } },
          { text: 'J\'ai besoin de fioles de métal.', nextNodeID: 'vials' },
          { text: 'Qui êtes-vous?', nextNodeID: 'identity' },
        ]},
        { id: 'metals', text: 'Huit métaux, huit pouvoirs. L\'acier et le fer pour la physique, l\'étain et le pewter pour le corps, le bronze et le cuivre pour la détection, le zinc et le laiton pour les émotions.', choices: [
          { text: 'Quel métal est le plus puissant?', nextNodeID: 'power', reward: { xp: 20 } },
          { text: 'Merci pour la leçon.', nextNodeID: null, reward: { xp: 10, reputation: 5 } },
        ]},
        { id: 'power', text: 'L\'atium. Mais il est presque introuvable. Il te permet de voir le futur immédiat de tes adversaires. Avec lui, tu es invincible.', choices: [
          { text: 'Où en trouver?', nextNodeID: null, reward: { xp: 25, reputation: 10 } },
          { text: 'Impressionnant.', nextNodeID: null, reward: { xp: 10 } },
        ]},
        { id: 'vials', text: 'J\'en ai quelques-unes cachées. 50 pièces d\'or chacune. Ou bien... élimine la patrouille qui surveille mon quartier et je t\'en offre gratuitement.', choices: [
          { text: 'Je m\'occupe de la patrouille.', nextNodeID: null, reward: { xp: 20, reputation: 15 } },
          { text: 'Je préfère payer.', nextNodeID: null, reward: { xp: 5 } },
        ]},
        { id: 'identity', text: 'Un ancien Brûleur de Cuivre pour Kelsier. Maintenant je vis caché. Le Lord Dirigeant a des yeux partout.', choices: [
          { text: 'Kelsier serait fier de vous.', nextNodeID: null, reward: { xp: 15, reputation: 20 } },
          { text: 'Restez en sécurité.', nextNodeID: null, reward: { xp: 10, gold: 5 } },
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
          { text: 'Je protègerai ce monde.', nextNodeID: 'protect', reward: { xp: 25, reputation: 10 } },
          { text: 'C\'est un fardeau trop lourd.', nextNodeID: null, reward: { xp: 10 } },
        ]},
        { id: 'protect', text: 'Tu es courageux. Les Chevaliers Radiants avaient un credo : Vie avant la mort, force avant la faiblesse, voyage avant la destination.', choices: [
          { text: 'Je prononcerai les Idéaux.', nextNodeID: null, reward: { xp: 30, reputation: 15 } },
          { text: 'Ce sont de belles paroles.', nextNodeID: null, reward: { xp: 15, gold: 10 } },
        ]},
        { id: 'stormlight', text: 'Les sphères se rechargent pendant les Tempêtes. Plus la gemme est grosse, plus elle contient de Lumière.', choices: [
          { text: 'Où trouver de grandes gemmes?', nextNodeID: null, reward: { xp: 15, gold: 10 } },
        ]},
        { id: 'spren', text: 'Les sprens sont l\'essence même de Roshar. Ton spren te lie aux Surges. Protège-le bien.', choices: [
          { text: 'Mon spren est ma force.', nextNodeID: null, reward: { xp: 20, reputation: 5 } },
        ]},
      ],
    },
    {
      startNodeID: 'start',
      nodes: [
        { id: 'start', text: 'Un voyageur des mondes! Les ponts entre les Royaumes s\'affaiblissent. Quelque chose de terrible se prépare.', choices: [
          { text: 'Quel danger menace Roshar?', nextNodeID: 'danger', reward: { xp: 15 } },
          { text: 'Avez-vous besoin d\'aide?', nextNodeID: 'help' },
          { text: 'Je ne fais que passer.', nextNodeID: null, reward: { xp: 5 } },
        ]},
        { id: 'danger', text: 'Les Fusionnés infiltrent nos rangs. Certains Radiants brisent leurs serments sous la pression. Nous perdons espoir.', choices: [
          { text: 'Je rallierai les indécis.', nextNodeID: 'rally', reward: { xp: 20, reputation: 15 } },
          { text: 'Chacun doit choisir sa voie.', nextNodeID: null, reward: { xp: 10, gold: 10 } },
        ]},
        { id: 'rally', text: 'Si tu peux éliminer le Tonnerreclaste sur les Plaines Brisées, cela redonnera courage à tous. C\'est un acte héroïque!', choices: [
          { text: 'J\'accepte ce défi.', nextNodeID: null, reward: { xp: 30, reputation: 20, gold: 25 } },
        ]},
        { id: 'help', text: 'Mes réserves de sphères sont épuisées. Si tu m\'en apportes, je pourrai te forger une lame d\'honneur.', choices: [
          { text: 'Je trouverai des sphères.', nextNodeID: null, reward: { xp: 20, reputation: 10 } },
          { text: 'Désolé, j\'ai mes propres problèmes.', nextNodeID: null, reward: { xp: 5 } },
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
