# CLAUDE.md — Cosmere Chronicles

## Présentation du Projet

**Cosmere Chronicles** est un RPG isométrique 2D dans l'univers du Cosmere de Brandon Sanderson.
Le joueur incarne un Salteur (Worldhopper) voyageant entre 7 mondes (Scadrial, Roshar, Taldain, Komashi, Nalthis, Sel, Shadesmar), chacun avec son système magique unique.

**Genre** : RPG isométrique 2D, exploration par zones, combat en temps réel
**Style visuel** : Pixel art HD isométrique (style Octopath Traveler / Sea of Stars)

## Priorité : Version Web

> **La version web (PixiJS) est la priorité actuelle.**
> La version iOS (SpriteKit) existe mais n'est pas le focus de développement pour le moment.
> Toutes les contributions doivent cibler `cosmere-web/` en priorité.

## Stack Technique (Web)

- **Moteur de rendu** : PixiJS v8 (WebGL/WebGPU)
- **Langage** : TypeScript (strict mode)
- **Build** : Vite
- **Cible** : ES2022
- **Déploiement** : Vercel
- **Path aliases** : `@/*` → `src/*`

## Commandes

```bash
cd cosmere-web
npm install        # Installer les dépendances
npm run dev        # Serveur de développement (Vite HMR)
npm run build      # Build production (tsc + vite build)
npm run preview    # Preview du build production
```

## Architecture du Projet Web

```
cosmere-web/src/
├── main.ts                    # Point d'entrée PixiJS
├── game/                      # Logique de jeu centrale
│   ├── GameManager.ts         # État global du jeu
│   ├── SceneRouter.ts         # Navigation entre scènes
│   ├── BossMechanics.ts       # Système de boss avec phases
│   ├── WorldMechanics.ts      # Mécaniques propres à chaque monde
│   └── QuestManager.ts        # Gestion des quêtes
├── scenes/                    # Scènes du jeu
│   ├── MainMenuScene.ts       # Écran titre
│   ├── CharacterCreationScene.ts
│   └── ZoneScene.ts           # Scène principale de jeu (isométrique)
├── rendering/                 # Rendu graphique
│   ├── PlayerRenderer.ts
│   ├── EnemyRenderer.ts
│   ├── SpellEffects.ts
│   └── MapStructures.ts       # Murs, bâtiments, zones secrètes
├── ui/                        # Interface utilisateur
│   ├── HUD.ts                 # Barres PV, Investiture, XP
│   ├── VirtualJoystick.ts     # Joystick tactile
│   ├── ActionButtons.ts       # Boutons de compétences
│   ├── InventoryPanel.ts
│   ├── QuestTracker.ts
│   ├── Minimap.ts
│   ├── PauseMenu.ts
│   ├── DeathScreen.ts
│   └── DialoguePanel.ts
└── data/                      # Données et types
    ├── types.ts               # Interfaces TypeScript
    └── DataLoader.ts          # Chargement des données JSON
```

## Principes d'Architecture

### Fichiers Petits et Modulaires

> **Privilégier une multitude de petits fichiers modulaires plutôt qu'un gros fichier monolithique.**

- **Un fichier = une responsabilité.** Chaque fichier doit avoir un rôle clair et unique.
- **Maximum ~200-300 lignes par fichier.** Si un fichier dépasse cette taille, il faut le découper.
- **Exports nommés.** Utiliser des exports nommés (`export function`, `export class`) plutôt que des exports par défaut pour faciliter le refactoring.
- **Regrouper par domaine.** Les fichiers sont organisés par fonctionnalité (`game/`, `scenes/`, `ui/`, `rendering/`, `data/`) et non par type technique.
- **Éviter les fichiers "fourre-tout".** Pas de `utils.ts` ou `helpers.ts` géants — créer des modules spécifiques (`math.ts`, `collision.ts`, etc.).

### Exemples de découpage attendu

```
# BON : Système de combat découpé
systems/combat/CombatManager.ts      # Orchestration du combat
systems/combat/DamageCalculator.ts   # Calcul des dégâts
systems/combat/StatusEffects.ts      # Gestion des effets de statut
systems/combat/Targeting.ts          # Logique de ciblage

# MAUVAIS : Tout dans un seul fichier
systems/CombatSystem.ts              # 1500 lignes avec tout mélangé
```

## Règles de Développement — Best Practices Jeu Vidéo

### 1. Game Loop et Performance

- Maintenir un **frame rate stable à 60 FPS**. Tout code dans la game loop doit être optimisé.
- **Éviter les allocations mémoire dans la boucle de rendu** (pas de `new` à chaque frame). Utiliser le pooling d'objets pour les entités fréquemment créées/détruites (projectiles, particules, dégâts flottants).
- **Profiler régulièrement.** Utiliser les DevTools du navigateur pour vérifier les performances.
- Garder le **delta time** (`dt`) pour tous les calculs de mouvement et d'animation afin que le jeu reste cohérent indépendamment du framerate.

### 2. Architecture ECS (Entity-Component-System)

- Séparer les **données** (Components) de la **logique** (Systems).
- Les entités sont de simples identifiants avec des composants attachés.
- Les systèmes itèrent sur les entités possédant les composants requis.
- Cela facilite l'ajout de nouveaux comportements sans modifier le code existant.

### 3. Gestion des Assets

- **Précharger les assets** au démarrage ou lors des écrans de chargement, jamais pendant le gameplay.
- Utiliser des **spritesheets** (atlas de textures) plutôt que des images individuelles pour réduire les draw calls.
- Les assets pixel art doivent utiliser le **nearest-neighbor filtering** (pas de lissage) pour garder la netteté.
- Nommer les assets de manière cohérente : `[monde]_[type]_[nom]_[variante].png`

### 4. Rendu Isométrique

- La conversion grille → écran suit la formule :
  - `x = (col - row) * tileWidth / 2`
  - `y = (col + row) * tileHeight / 2`
- Le **Z-ordering** (depth sorting) est basé sur la position Y pour le tri en profondeur.
- Les tiles font **64x32 pixels** en isométrique.

### 5. Gestion des États (State Management)

- Utiliser un **pattern State Machine** pour les états du jeu (menu, gameplay, pause, dialogue, inventaire).
- Les entités de jeu (joueur, ennemis) doivent aussi utiliser des state machines (idle, walk, attack, hurt, dead).
- Éviter les variables booléennes multiples pour gérer les états — préférer un enum d'état clair.

### 6. Système de Combat

- Le combat est en **temps réel** avec pause tactique possible.
- Les contrôles utilisent un **joystick virtuel** (gauche) + **boutons d'action** (droite), style Wild Rift.
- Les compétences ont des **cooldowns** avec feedback visuel.
- Les dégâts flottants utilisent un **object pool** pour éviter les allocations.

### 7. Systèmes Magiques

Le jeu comporte 6 systèmes magiques uniques, chacun lié à un monde :
- **Allomancie** (Scadrial) — Brûler des métaux consommables
- **Surgebinding** (Roshar) — Alimenté par la Lumière d'orage
- **Maîtrise du Sable** (Taldain) — Coûte de l'eau (hydratation)
- **Peinture de Cauchemars** (Komashi) — Encre + Empilement de pierres
- **Éveil** (Nalthis) — Souffles accumulés (BioChroma)
- **AonDor** (Sel) — Glyphes lumineux combinatoires

### 8. Code Style et Conventions

- **TypeScript strict** (`strict: true`) — pas de `any`, typer toutes les interfaces.
- **Nommage** :
  - Classes et interfaces : `PascalCase`
  - Fonctions et variables : `camelCase`
  - Constantes : `UPPER_SNAKE_CASE`
  - Fichiers : `PascalCase.ts` (un fichier par classe/module)
- **Pas de logique métier dans les renderers.** Les fichiers de `rendering/` ne font que du dessin — la logique reste dans `game/` ou `systems/`.
- **Interfaces avant implémentation.** Définir les types dans `data/types.ts` avant de coder les systèmes.

### 9. Sauvegarde et Persistence

- Utiliser **LocalStorage** pour les sauvegardes web (IndexedDB pour les données volumineuses).
- Sérialiser l'état du jeu en JSON.
- Sauvegarder automatiquement lors des transitions de zone.

### 10. Tests et Qualité

- Vérifier que le projet **compile sans erreurs** (`npm run build`) avant chaque commit.
- Tester sur différentes tailles d'écran (responsive).
- Tester les contrôles tactiles sur mobile ET clavier/souris sur desktop.

## Univers et Lore

Le jeu se déroule dans le **Cosmere** de Brandon Sanderson. Respecter la lore des livres :
- Les systèmes magiques doivent être fidèles aux romans
- Les noms propres, lieux et factions doivent être corrects
- Le document de game design complet est dans `GAME_DESIGN.md`

## Projet iOS (Référence)

La version iOS utilise Swift + SpriteKit + GameplayKit. Les fichiers iOS se trouvent à la racine :
- `App/`, `Core/`, `Scenes/`, `Entities/`, `Systems/`, `UI/`, `Data/`
- `Package.swift` pour la configuration Swift

Cette version n'est **pas le focus actuel** mais reste le codebase de référence pour l'architecture.
