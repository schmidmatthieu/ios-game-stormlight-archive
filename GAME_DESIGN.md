# Cosmere Chronicles — Game Design Document
## RPG Isométrique 2D iOS dans l'univers de Brandon Sanderson

---

## 1. Vision du Jeu

**Genre** : RPG isométrique 2D, exploration par zones, combat en temps réel
**Plateforme** : iOS (iPhone / iPad) + Web App (HTML5/PixiJS)
**Moteur** : SpriteKit (iOS natif) / PixiJS (web)
**Univers** : Le Cosmere de Brandon Sanderson (Roshar, Scadrial, Taldain, Komashi, Nalthis, Sel…)
**Style visuel** : Pixel art HD isométrique (style Octopath Traveler / Sea of Stars)
**Contrôles** : Joystick virtuel + boutons d'action style Wild Rift
**Inspiration** : Baldur's Gate 3 (isométrique, quêtes, loot), Diablo (loot tiers), Wild Rift (contrôles mobiles), Octopath Traveler (esthétique HD-2D)

### Pitch
> Incarnez un Salteur (Worldhopper) traversant les mondes du Cosmere. Explorez des zones isométriques détaillées, combattez des ennemis avec les systèmes magiques uniques de chaque planète, accomplissez des quêtes narratives, et collectez du loot légendaire pour renforcer votre champion.

---

## 2. Univers & Mondes (Zones)

Le jeu est structuré en **mondes** (planètes du Cosmere), chacun contenant plusieurs **zones** explorables. Le passage entre zones se fait via un court écran de chargement.

### 2.1 Mondes Principaux

| Monde | Ambiance | Magie disponible | Ennemis typiques |
|-------|----------|-------------------|------------------|
| **Scadrial** (Fils des Brumes) | Cendres, brumes, cité industrielle | Allomancie (métaux) | Inquisiteurs, koloss, skaa corrompus |
| **Roshar** (Archives de Roshar) | Tempêtes, plateaux rocheux, cités-carapaces | Surgebinding (liens spren) | Chanteformes, Néantifères, Fossoyeurs |
| **Nalthis** (Warbreaker) | Coloré, tropical, cour royale | Éveil (Souffle / BioChroma) | Liferless, gardes royaux, intrigants |
| **Sel** (Elantris) | Cité déchue, mystique | AonDor (glyphes lumineux) | Seons corrompus, Dakhor monks |
| **Taldain** (White Sand) | Désert blanc éblouissant / nuit éternelle | Maîtrise du Sable | Vers des sables, pillards, sablonites, Seigneur des Sables |
| **Komashi** (Yumi) | Ville lanternes, nuit cauchemardesque | Peinture / Empilement | Cauchemars, chercheurs d'ombre, Père des Cauchemars |
| **Shadesmar** (Sous-création) | Monde des spren, océan de billes | Pouvoirs cosmériques | Spren hostiles, Fused errants |

### 2.2 Structure des Zones

Chaque monde contient **3-5 zones** :
- **Zone hub** : Ville/camp avec PNJ, marchands, quêtes
- **Zones d'exploration** : Donjons, plaines, ruines — ennemis + loot
- **Zone de boss** : Boss unique lié à la lore du monde

Chaque zone est une **tilemap isométrique** chargée indépendamment.

---

## 3. Système de Champion

### 3.1 Création de Personnage

Le joueur crée un **Salteur** (Worldhopper) avec :
- **Nom** personnalisable
- **Origine** (monde de départ) → détermine le premier pouvoir magique
- **Classe de base** :
  - **Brumeux** (Mistborn) — Allomancie complète, brûle des métaux
  - **Radieux** (Radiant) — Surgebinding via ordre choisi, alimenté par la Lumière d'orage
  - **Éveilleur** (Awakener) — Manipulation du Souffle et BioChroma
  - **Élantrien** (Elantrian) — Magie des Aons, glyphes lumineux
  - **Maître du Sable** (Sand Master) — Contrôle du sable blanc de Taldain, coûte de l'eau
  - **Peintre de Cauchemars** (Nightmare Painter) — Capture les cauchemars à l'encre + empilement de pierres

### 3.2 Statistiques du Champion

| Stat | Description | Affectée par |
|------|-------------|--------------|
| **Vigueur** | PV max, résistance physique | Armure, anneaux |
| **Investiture** | Mana/énergie pour les pouvoirs | Amulettes, gemmes |
| **Force** | Dégâts physiques de base | Armes, gants |
| **Agilité** | Vitesse de déplacement + esquive | Bottes, capes |
| **Esprit** | Puissance des pouvoirs magiques | Casques, spren liés |
| **Chance** | Drop rate loot + coups critiques | Accessoires rares |

### 3.3 Progression

- **Niveau** : XP gagné en tuant des ennemis et accomplissant des quêtes
- **Points de compétence** : 1 par niveau, débloquer/améliorer des pouvoirs
- **Arbre de talents** : Spécifique à chaque classe/système magique

---

## 4. Systèmes Magiques

### 4.1 Allomancie (Scadrial)

Le joueur **brûle des métaux** pour activer des pouvoirs :

| Métal | Pouvoir | Effet en jeu |
|-------|---------|--------------|
| **Acier** | Pousser les métaux | Projectile à distance, repousser ennemis |
| **Fer** | Tirer les métaux | Attirer objets/ennemis, dash vers cible |
| **Étain** | Sens améliorés | Révéler ennemis cachés, augmenter esquive |
| **Pewter** | Force surhumaine | Boost dégâts + vitesse temporaire |
| **Bronze** | Chercheur | Détecter la magie, révéler secrets |
| **Cuivre** | Fumeur | Invisibilité aux détections magiques |
| **Zinc** | Émeuteur | CC : enrager les ennemis (aggro) |
| **Laiton** | Apaiseur | CC : calmer/ralentir les ennemis |

**Mécanique** : Les métaux sont une ressource consommable (lootable). Brûler un métal coûte de l'Investiture + consomme le métal.

### 4.2 Surgebinding (Roshar)

Le joueur est lié à un **spren** et maîtrise **2 Surges** selon son Ordre :

| Ordre | Surge 1 | Surge 2 | Style de jeu |
|-------|---------|---------|--------------|
| **Vent** (Windrunner) | Adhésion | Gravitation | Tank/mobilité — voler, coller ennemis |
| **Lumière** (Lightweaver) | Illumination | Transformation | Illusions, polymorphie |
| **Lien** (Bondsmith) | Tension | Adhésion | Support, boucliers, buffs de groupe |
| **Danseur** (Edgedancer) | Abrasion | Progression | Esquive ultime, heal |

**Mécanique** : Alimenté par la **Lumière d'orage** (rechargeable dans les hauteorages ou via gemmes lootées).

### 4.3 Éveil (Nalthis)

Le joueur utilise des **Souffles** pour animer des objets :
- **Animer un vêtement** → allié temporaire qui combat
- **Animer une arme** → attaques automatiques
- **Aura de couleur** → buff de zone (les couleurs s'estompent visuellement)

**Mécanique** : Les Souffles sont une ressource rare. Plus on en accumule, plus on monte en **Élévation** (paliers de puissance passifs).

### 4.4 AonDor (Sel)

Le joueur dessine des **Aons** (glyphes) pour lancer des sorts :
- **Aon Rao** → Explosion lumineuse (AoE)
- **Aon Ashe** → Bouclier protecteur
- **Aon Tia** → Téléportation courte
- **Aon Ien** → Soin

**Mécanique** : Le joueur peut combiner des Aons pour créer des sorts plus puissants (système combinatoire).

---

## 5. Système de Combat

### 5.1 Vue d'ensemble

- **Temps réel** avec possibilité de **pause tactique** (tap prolongé)
- Vue isométrique, le champion se déplace librement dans la zone
- Les ennemis patrouillent et aggressent à portée de détection
- **Contrôles tactiles** :
  - Tap sur sol → déplacement
  - Tap sur ennemi → attaque auto
  - Boutons de compétences (4 slots) en bas de l'écran
  - Swipe pour esquiver / dash

### 5.2 Boucle de Combat

```
Détection ennemi → Engagement → Attaques auto + Compétences → Loot → XP
```

- Les ennemis ont des **barres de PV** visibles
- Indicateurs de dégâts flottants (style RPG)
- Effets de statut : empoisonné, brûlé, ralenti, étourdi
- **Combo system** : enchaîner des compétences différentes donne des bonus

### 5.3 Difficulté

- Ennemis de zone ont un **niveau recommandé**
- Ennemis élites (marqués) → meilleur loot
- Boss de zone → loot unique garanti

---

## 6. Système de Loot & Équipement

### 6.1 Raretés

| Rareté | Couleur | Stats bonus | Trait spécial |
|--------|---------|-------------|---------------|
| **Commun** | Gris | +1 stat | Non |
| **Inhabituel** | Vert | +2 stats | Non |
| **Rare** | Bleu | +3 stats | 1 trait |
| **Épique** | Violet | +4 stats | 2 traits |
| **Légendaire** | Orange | +5 stats | Pouvoir unique |
| **Cosmériqu**e | Rouge sang | +6 stats | Pouvoir cross-monde |

### 6.2 Slots d'Équipement

```
        [Casque]
[Épaules] [Torse] [Cape]
  [Gants] [Ceinture]
  [Jambes] [Bottes]
  [Arme principale] [Arme secondaire / Bouclier]
  [Amulette] [Anneau x2]
```

### 6.3 Traits Spéciaux (exemples)

- **Forgé-brumes** : +15% dégâts Allomantiques
- **Lumière captive** : Régénère l'Investiture sous la pluie
- **Souffle du roi** : Les alliés animés durent 50% plus longtemps
- **Glyphe d'Elantris** : -20% coût AonDor
- **Salteur né** : +10% toutes stats dans un monde qui n'est pas votre origine

### 6.4 Loot Tables

- Ennemis communs : 70% commun, 25% inhabituel, 5% rare
- Ennemis élites : 40% rare, 35% inhabituel, 20% épique, 5% légendaire
- Boss : 50% épique, 40% légendaire, 10% cosmérique

---

## 7. Système de Quêtes

### 7.1 Types de Quêtes

- **Quête principale** : Arc narratif du Salteur à travers les mondes
- **Quêtes de monde** : Histoires propres à chaque planète
- **Quêtes secondaires** : PNJ individuels, souvent fetch/kill/escort
- **Quêtes cachées** : Découvertes par exploration, dialogues ou loot

### 7.2 Journal de Quêtes

- Suivi actif avec marqueurs sur la minimap
- Choix narratifs qui influencent les récompenses et la réputation
- Système de réputation par monde (affecte les prix marchands et dialogues)

### 7.3 Fil Narratif Principal

> **Acte 1 — L'Éveil** : Le joueur découvre qu'il est un Salteur et apprend à maîtriser la magie de son monde d'origine.
>
> **Acte 2 — Les Éclats** : Un Éclat (Shard) a été brisé et ses fragments corrompent les mondes. Le joueur doit voyager entre les planètes pour récupérer les fragments.
>
> **Acte 3 — Convergence** : Les mondes fusionnent dans Shadesmar. Le joueur doit affronter la source de la corruption — un antagoniste qui cherche à réunir tous les Éclats.

---

## 8. Architecture Technique (SpriteKit)

### 8.1 Structure du Projet Xcode

```
CosmereChronicles/
├── App/
│   ├── CosmereChroniclesApp.swift      # Point d'entrée SwiftUI
│   ├── GameViewController.swift         # SKView container
│   └── Info.plist
├── Core/
│   ├── GameManager.swift                # Singleton état global
│   ├── SceneRouter.swift                # Navigation entre scenes/zones
│   ├── SaveManager.swift                # Persistence (Core Data / JSON)
│   └── AudioManager.swift              # Musique + SFX
├── Scenes/
│   ├── MainMenuScene.swift
│   ├── WorldMapScene.swift              # Carte du Cosmere (sélection monde)
│   ├── ZoneScene.swift                  # Scene de jeu principale (isométrique)
│   ├── CombatOverlayScene.swift         # UI combat par-dessus la zone
│   └── DialogueScene.swift             # Overlay dialogues
├── Entities/
│   ├── Entity.swift                     # Protocole de base ECS
│   ├── PlayerEntity.swift
│   ├── EnemyEntity.swift
│   ├── NPCEntity.swift
│   └── Components/
│       ├── SpriteComponent.swift
│       ├── HealthComponent.swift
│       ├── MovementComponent.swift
│       ├── CombatComponent.swift
│       ├── InventoryComponent.swift
│       ├── MagicSystemComponent.swift
│       └── AIComponent.swift
├── Systems/
│   ├── CombatSystem.swift
│   ├── LootSystem.swift
│   ├── QuestSystem.swift
│   ├── MagicSystems/
│   │   ├── AllomancySystem.swift
│   │   ├── SurgebindingSystem.swift
│   │   ├── AwakeningSystem.swift
│   │   └── AonDorSystem.swift
│   └── PathfindingSystem.swift          # A* sur grille iso
├── UI/
│   ├── HUDNode.swift                    # Barre PV, Investiture, XP
│   ├── InventoryUI.swift               # Grille d'inventaire
│   ├── SkillBarNode.swift              # 4 slots compétences
│   ├── MinimapNode.swift
│   ├── DialogueBoxNode.swift
│   └── LootPopupNode.swift
├── Data/
│   ├── Models/
│   │   ├── Item.swift
│   │   ├── Quest.swift
│   │   ├── Skill.swift
│   │   ├── Enemy.swift
│   │   └── Zone.swift
│   └── JSON/
│       ├── items.json                   # Base de données items
│       ├── enemies.json
│       ├── quests.json
│       └── zones.json
├── TileMaps/
│   ├── Scadrial/
│   │   ├── luthadel_market.sks          # SpriteKit Scene (tilemap)
│   │   ├── ash_fields.sks
│   │   └── kredik_shaw.sks
│   ├── Roshar/
│   │   ├── shattered_plains.sks
│   │   ├── kharbranth_library.sks
│   │   └── urithiru.sks
│   └── ...
└── Assets.xcassets/
    ├── Characters/
    ├── Enemies/
    ├── Items/
    ├── Tiles/
    ├── UI/
    └── Effects/
```

### 8.2 Architecture ECS (Entity-Component-System)

SpriteKit supporte nativement **GKEntity** et **GKComponent** (GameplayKit) :

```swift
// Exemple simplifié
class PlayerEntity: GKEntity {
    init(spriteNamed: String, magicSystem: MagicSystemType) {
        super.init()
        addComponent(SpriteComponent(textureName: spriteNamed))
        addComponent(HealthComponent(maxHP: 100))
        addComponent(MovementComponent(speed: 150))
        addComponent(CombatComponent(baseDamage: 10))
        addComponent(InventoryComponent())

        switch magicSystem {
        case .allomancy:
            addComponent(AllomancyComponent())
        case .surgebinding:
            addComponent(SurgebindingComponent())
        case .awakening:
            addComponent(AwakeningComponent())
        case .aonDor:
            addComponent(AonDorComponent())
        }
    }
}
```

### 8.3 Rendu Isométrique

```swift
// Conversion coordonnées grille → écran iso
func isoPosition(col: Int, row: Int, tileSize: CGSize) -> CGPoint {
    let x = (col - row) * Int(tileSize.width / 2)
    let y = (col + row) * Int(tileSize.height / 2)
    return CGPoint(x: x, y: -y)
}
```

- Utilisation de **SKTileMapNode** pour les tilemaps isométriques
- **Z-ordering** basé sur la position Y pour le depth sorting
- Caméra **SKCameraNode** qui suit le joueur avec smooth follow

### 8.4 Transitions entre Zones

```swift
class SceneRouter {
    func transitionToZone(_ zoneID: String, from currentScene: SKScene) {
        // 1. Sauvegarder l'état du joueur
        // 2. Afficher écran de chargement
        // 3. Charger la tilemap de la nouvelle zone
        // 4. Spawner les entités (ennemis, PNJ, items)
        // 5. Positionner le joueur à l'entrée
        // 6. Transition avec SKTransition.fade
    }
}
```

---

## 9. Style Visuel — Pixel Art HD-2D

### 9.1 Direction Artistique

**Style** : Pixel art HD isométrique inspiré d'Octopath Traveler et Sea of Stars.

**Caractéristiques clés** :
- Tiles isométriques en pixel art haute résolution (64×32 par tile)
- Effets de lumière dynamiques par-dessus le pixel art (god rays, bloom, ombres douces)
- Particules modernes (feu, brume, sable, encre) superposées au pixel art
- Profondeur de champ simulée (flou sur les éléments distants)
- Palette de couleurs riche et saturée, propre à chaque monde

### 9.2 Palette par Monde

| Monde | Palette dominante | Ambiance lumineuse |
|-------|-------------------|--------------------|
| **Scadrial** | Gris cendré, rouge rouille, or terne | Brumeux, sombre, torches chaudes |
| **Roshar** | Bleu tempête, blanc pierre, violet spren | Éclairs intermittents, lumière d'orage cyan |
| **Taldain Dayside** | Blanc éclatant, or solaire, beige sable | Soleil permanent, ombres nettes et contrastées |
| **Taldain Darkside** | Noir profond, violet sombre, bleu nuit | Absence de lumière, lueurs artificielles |
| **Komashi** | Rose/magenta hion, noir cauchemar, blanc papier | Lignes de lumière flottantes, ombres mouvantes |
| **Nalthis** | Arc-en-ciel vibrant, saturation variable | Couleurs qui s'estompent ou s'intensifient |
| **Sel** | Or Aon, blanc Elantris, vert corruption | Glyphes lumineux flottants |
| **Shadesmar** | Noir obsidienne, billes multicolores | Lueur spectrale, sky inversé |

### 9.3 Spécifications des Sprites

- **Champions** : 64×96px, 8 directions, 4 animations (idle, marche, attaque, compétence)
- **Ennemis** : Taille variable (64×64 à 192×192 pour les boss), 4-8 frames d'animation
- **PNJ** : 64×96px, 2 directions, expression faciale sur portrait
- **Items** : 32×32px icônes, style flat pixel art avec bordure de rareté
- **Tiles** : 64×32px isométrique, 4 variantes par type pour éviter la répétition
- **Effets** : Particules en spritesheet 32×32, 8-16 frames, avec additive blending

---

## 10. Contrôles — Style Wild Rift

### 10.1 Layout

```
┌─────────────────────────────────────────────────┐
│  [Nv.5]  [████████] PV  [████████] Investiture  │
│          [███] XP                    [Zone Name]  │
│                                                   │
│                                                   │
│                  ZONE ISOMÉTRIQUE                 │
│                                                   │
│                                                   │
│                                          [ULT]    │
│                                      [3]      [4] │
│   ┌───────┐                      [1]      [2]    │
│   │ STICK │                          [ATK]        │
│   └───────┘                                       │
└─────────────────────────────────────────────────┘
```

### 10.2 Joystick Virtuel (gauche)
- Cercle de base avec thumb stick déplaçable
- Zone morte au centre (10%) pour éviter les mouvements accidentels
- Magnitude proportionnelle : plus on pousse, plus le champion se déplace vite
- Direction 360° convertie en mouvement isométrique
- Feedback visuel : glow au toucher, indicateur de direction

### 10.3 Boutons d'Action (droite)
- **ATK** (gros bouton rouge) : Attaque auto-ciblant l'ennemi le plus proche
- **1-4** (4 boutons en arc) : Compétences magiques avec icônes adaptées à la classe
- **ULT** (bouton doré) : Compétence ultime, glow doré quand disponible
- **Cooldowns** : Overlay sombre + compteur sur chaque bouton en cooldown
- **Animation de pression** : Scale bounce au tap

---

## 11. Systèmes Magiques Additionnels

### 11.1 Maîtrise du Sable (Taldain)

Le joueur contrôle le **sable blanc** de Dayside, alimenté par l'énergie solaire :

| Forme | Effet | Coût |
|-------|-------|------|
| **Fouet** | Attaque directionnelle rapide | 12 eau |
| **Bouclier** | Mur de sable protecteur | 12 eau |
| **Essaim** | Dégâts AoE + brûlure | 12 eau |
| **Plateforme** | Élévation / mobilité | 12 eau |
| **Pics** | Piège au sol + étourdissement | 12 eau |
| **Tempête** | ULTIME — AoE massif | 24 eau |

**Mécanique unique** : La Maîtrise du Sable **consomme l'eau du corps**. Il faut boire régulièrement (gourdes lootées/achetées). Sous le soleil de Dayside, le sable est plus puissant. Sur Darkside, les pouvoirs sont affaiblis.

### 11.2 Peinture de Cauchemars (Komashi)

Le joueur utilise **l'encre** pour capturer et bannir les cauchemars :

| Technique | Effet | Coût |
|-----------|-------|------|
| **Capture** | CC puissant — immobilise un cauchemar | 10 encre |
| **Bannissement** | Gros dégâts single target | 10 encre |
| **Barrière** | Zone de protection anti-cauchemar | 10 encre |
| **Trait d'Encre** | Attaque rapide | 5 encre |
| **Chef-d'Œuvre** | ULTIME — dégâts massifs + heal | 20 encre |

**Mécaniques complémentaires — Empilement de Pierres (Yoki-hijo)** :
- **Méditation** → Régénération PV
- **Garde** → Buff défensif 30% réduction
- **Invocation** → Allié de pierre temporaire
- **Convergence** → Buff massif de zone

---

## 12. Contenu Complet (Version Full)

### Tous les Mondes

| Monde | Zones | Ennemis | Boss | Items uniques |
|-------|-------|---------|------|---------------|
| **Scadrial** | 3 (Hub, Champs, Kredik Shaw) | 5 types | Inquisiteur d'Acier | 9 |
| **Roshar** | 3 (Camp, Plaines, Urithiru) | 5 types | Tonnerreclaste | 10 |
| **Taldain** | 3 (Kezare, Dunes, Darkside) | 5 types | Seigneur des Sables | 8 |
| **Komashi** | 3 (Kilahito, Rues, Linceul) | 5 types | Père des Cauchemars | 8 |
| **Nalthis** | 3 (T'Telir, Cour, Temple) | 4 types | Roi-Dieu Corrompu | 6 |
| **Sel** | 3 (Elantris, Fjorden, Hrathen) | 4 types | Dakhor Maître | 6 |
| **Shadesmar** | 3 (Céleste, Profondeurs, Cœur) | 4 types | Éclat Fragmenté | 5 |
| **TOTAL** | **21 zones** | **32 types** | **7 boss** | **52 items** |

### Toutes les Classes

| Classe | Système magique | Ressource spéciale | Monde d'origine |
|--------|----------------|---------------------|-----------------|
| Brumeux | Allomancie (8 métaux) | Réserves métalliques | Scadrial |
| Radieux (4 ordres) | Surgebinding (7 surges) | Lumière d'orage | Roshar |
| Éveilleur | Éveil (Souffle) | Souffles accumulés | Nalthis |
| Élantrien | AonDor (glyphes) | Dévouement | Sel |
| Maître du Sable | Maîtrise du Sable (6 formes) | Eau / hydratation | Taldain |
| Peintre de Cauchemars | Peinture + Empilement | Encre | Komashi |

---

## 13. Version Web (HTML5 / PixiJS)

### 13.1 Pourquoi une version web ?

- **Preview depuis mobile** : Permet de tester le jeu directement depuis iPhone/iPad via Safari sans passer par Xcode
- **Accessibilité** : Jouable sur n'importe quel navigateur (PC, tablette, mobile)
- **Partage facile** : URL partageable pour les testeurs

### 13.2 Architecture Web

```
cosmere-web/
├── index.html
├── src/
│   ├── main.ts              # Point d'entrée PixiJS
│   ├── game/
│   │   ├── GameManager.ts    # Miroir du Swift GameManager
│   │   ├── SceneRouter.ts
│   │   └── SaveManager.ts    # LocalStorage
│   ├── scenes/
│   │   ├── MainMenuScene.ts
│   │   ├── WorldMapScene.ts
│   │   └── ZoneScene.ts
│   ├── systems/
│   │   ├── CombatSystem.ts
│   │   ├── LootSystem.ts
│   │   ├── QuestSystem.ts
│   │   └── PathfindingSystem.ts
│   ├── ui/
│   │   ├── VirtualJoystick.ts
│   │   └── ActionButtons.ts
│   └── data/               # Mêmes fichiers JSON !
│       ├── items.json
│       ├── enemies.json
│       └── zones.json
├── assets/                  # Mêmes spritesheets !
└── package.json
```

### 13.3 Stack technique web

- **PixiJS v8** : Moteur de rendu 2D WebGL/WebGPU, très performant
- **TypeScript** : Typage fort, facilite la migration depuis Swift
- **Vite** : Build rapide, hot reload
- **Données partagées** : Les fichiers JSON (items, enemies, zones) sont identiques entre iOS et web
- **Assets partagés** : Les spritesheets pixel art sont les mêmes (PNG)
- **PWA** : Installable comme app native depuis Safari

### 13.4 Différences iOS ↔ Web

| Aspect | iOS (SpriteKit) | Web (PixiJS) |
|--------|-----------------|--------------|
| Rendu | Metal natif | WebGL/WebGPU |
| Sauvegarde | Core Data / fichiers | LocalStorage / IndexedDB |
| Audio | AVAudioPlayer | Web Audio API |
| Contrôles | Identiques (joystick + boutons tactiles) | + Clavier/souris optionnel |
| Performance | Optimale | Excellente (PixiJS très optimisé) |

---

## 14. Assets Nécessaires (Version Complète)

### Sprites (Pixel Art HD-2D)
- **Champions** : 6 classes × 8 directions × 4 animations = ~192 sprites
- **Ennemis** : 32 types × 4 directions × 3 animations = ~384 sprites
- **Boss** : 7 boss × 8 directions × 5 animations = ~280 sprites
- **PNJ** : ~25 uniques × 2 directions × idle = ~50 sprites
- **Items** : ~52 icônes d'équipement + ~20 consommables = ~72 icônes
- **Effets** : Particules pour chaque système magique (~30 effets uniques)

### Tilemaps
- **7 mondes** × ~40 tiles uniques par monde = ~280 tiles
- **21 zones** × grille moyenne 50×50 = ~52,500 tiles placées
- Variantes : 4 par type pour diversité visuelle

### Audio
- **14 thèmes musicaux** (2 par monde)
- **7 thèmes de boss**
- **SFX** : ~80 effets sonores (attaques, compétences, UI, ambiance, weather)
- **Dialogues** : Effets voix type "murmure" par race/monde

---

## 15. Roadmap de Développement (Version Complète)

### Phase 1 — Fondations (Semaines 1-3)
- [ ] Setup projet Xcode + SpriteKit
- [ ] Moteur isométrique HD-2D (tilemap, caméra, z-ordering, effets lumière)
- [ ] Système ECS de base (entités, composants)
- [ ] Joystick virtuel + boutons d'action
- [ ] Première zone test avec placeholder art

### Phase 2 — Combat & Magie Core (Semaines 4-7)
- [ ] Système de combat temps réel avec targeting
- [ ] Système Allomancie complet (8 métaux)
- [ ] Système Surgebinding (4 ordres × 2 surges)
- [ ] Système Maîtrise du Sable (6 formes)
- [ ] Système Peinture de Cauchemars (5 techniques + empilement)
- [ ] IA ennemis (patrouille, aggro, attaque, support, ranged, berserk)
- [ ] HUD combat complet (PV, Investiture, skill bar, dégâts flottants)

### Phase 3 — Loot, Progression & Inventaire (Semaines 8-10)
- [ ] Système de loot complet (6 raretés, traits, loot tables)
- [ ] Inventaire avec 13 slots d'équipement
- [ ] Système de niveaux et XP
- [ ] Arbre de talents par classe (24 talents par arbre)
- [ ] Marchands et économie (or, ressources spéciales)

### Phase 4 — Mondes & Contenu (Semaines 11-16)
- [ ] 21 zones complètes avec tilemaps HD-2D
- [ ] 7 mondes du Cosmere
- [ ] Système de dialogues à choix avec portraits animés
- [ ] Système de quêtes complet (principale + monde + secondaires + cachées)
- [ ] 7 boss fights avec mécaniques uniques
- [ ] Système de réputation par monde
- [ ] Transitions entre mondes via la carte du Cosmere

### Phase 5 — Systèmes Avancés (Semaines 17-19)
- [ ] Éveil (Nalthis) et AonDor (Sel) — systèmes magiques
- [ ] Craft / forge d'objets spéciaux
- [ ] Compagnons PNJ (1 par monde, avec IA et dialogues)
- [ ] Système de jour/nuit (affecte Komashi et les cauchemars)
- [ ] Météo dynamique (hauteorages, brumes, tempêtes de sable)
- [ ] Shadesmar — monde secret post-game

### Phase 6 — Version Web (Semaines 20-22)
- [ ] Port PixiJS + TypeScript
- [ ] Adaptation contrôles clavier/souris + tactile
- [ ] PWA installable
- [ ] Synchronisation sauvegardes iOS ↔ Web (iCloud / compte)
- [ ] Déploiement web (Vercel / Netlify)

### Phase 7 — Polish & Launch (Semaines 23-26)
- [ ] Pixel art HD-2D complet (tous sprites, tiles, effets)
- [ ] Musiques et SFX originaux
- [ ] Balancing complet (stats, loot tables, difficulté)
- [ ] Tutoriel interactif (1ère zone guidée)
- [ ] Localisation (FR/EN)
- [ ] TestFlight beta → App Store
- [ ] Web beta → Production
