# Cosmere Chronicles — Game Design Document
## RPG Isométrique 2D iOS dans l'univers de Brandon Sanderson

---

## 1. Vision du Jeu

**Genre** : RPG isométrique 2D, exploration par zones, combat en temps réel
**Plateforme** : iOS (iPhone / iPad)
**Moteur** : SpriteKit (natif Apple)
**Univers** : Le Cosmere de Brandon Sanderson (Roshar, Scadrial, Nalthis, Sel…)
**Inspiration** : Baldur's Gate 3 (isométrique, quêtes, loot), Diablo (loot tiers), classiques 2D

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
  - **Brumeux** (Mistborn) — Allomancie complète
  - **Radieux** (Radiant) — Surgebinding via ordre choisi
  - **Éveilleur** (Awakener) — Manipulation du Souffle
  - **Élantrien** (Elantrian) — Magie des Aons

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

## 9. Scope MVP (Version 1.0)

### Ce qui est IN pour le MVP

| Système | Contenu MVP |
|---------|-------------|
| **Mondes** | 2 mondes (Scadrial + Roshar), 3 zones chacun |
| **Champion** | 2 classes (Brumeux + Radieux Vent) |
| **Combat** | Temps réel, 4 compétences, ennemis basiques + 1 boss par monde |
| **Loot** | 4 raretés (commun → épique), 5 slots équipement |
| **Quêtes** | 1 quête principale (Acte 1), 3 secondaires par monde |
| **UI** | HUD, inventaire, journal de quêtes, minimap |
| **Sauvegarde** | 1 slot de sauvegarde auto |

### Ce qui est OUT pour le MVP (Post-launch)

- Mondes additionnels (Nalthis, Sel, Shadesmar)
- Classes Éveilleur et Élantrien
- Loot légendaire et cosmérique
- Quêtes cachées
- Mode multijoueur coop
- Actes 2 et 3 de l'histoire
- Craft / forge d'objets
- Compagnons PNJ

---

## 10. Assets Nécessaires (MVP)

### Sprites
- **Champion** : 4 directions × 3 animations (idle, marche, attaque) = 12 sprites minimum par classe
- **Ennemis** : 6-8 types, 4 directions × 2 animations = ~56 sprites
- **PNJ** : 10 uniques, 2 directions × idle = ~20 sprites
- **Items** : ~50 icônes d'équipement
- **Effets** : Particules pour chaque pouvoir magique (~16 effets)

### Tilemaps
- **Tiles isométriques** : Sol (pierre, cendre, herbe), murs, eau, décorations
- ~30-40 tiles uniques par monde
- Chaque zone : ~50×50 à 100×100 tiles

### Audio
- 2 thèmes musicaux ambiants par monde
- SFX : attaques, compétences, UI, ambiance
- ~40 fichiers audio au total

---

## 11. Roadmap de Développement

### Phase 1 — Fondations (Semaines 1-3)
- [ ] Setup projet Xcode + SpriteKit
- [ ] Moteur isométrique (tilemap, caméra, z-ordering)
- [ ] Système ECS de base (entités, composants)
- [ ] Déplacement joueur (tap-to-move, pathfinding A*)
- [ ] Première zone test avec placeholder art

### Phase 2 — Combat & Magie (Semaines 4-6)
- [ ] Système de combat temps réel
- [ ] Système Allomancie (4 métaux de base)
- [ ] Système Surgebinding Windrunner (Gravitation + Adhésion)
- [ ] IA ennemis basique (patrouille, aggro, attaque)
- [ ] HUD combat (PV, Investiture, skill bar)

### Phase 3 — Loot & Progression (Semaines 7-8)
- [ ] Système de loot (drop, raretés, stats)
- [ ] Inventaire et équipement
- [ ] Système de niveaux et XP
- [ ] Arbre de talents basique

### Phase 4 — Monde & Narration (Semaines 9-11)
- [ ] 6 zones complètes (3 Scadrial + 3 Roshar)
- [ ] Système de dialogues à choix
- [ ] Système de quêtes
- [ ] 2 boss fights
- [ ] Transitions entre zones et mondes

### Phase 5 — Polish & Launch (Semaines 12-14)
- [ ] Sauvegarde / chargement
- [ ] Tutoriel
- [ ] Balancing (stats, loot tables, difficulté)
- [ ] Effets visuels et particules
- [ ] Audio intégration
- [ ] Testflight beta
