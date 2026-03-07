import SpriteKit
import GameplayKit

/// Scène de jeu principale — zone isométrique explorable
/// Contrôles style Wild Rift : joystick gauche + boutons d'action droite
class ZoneScene: SKScene {

    // MARK: - Properties

    private let zone: Zone
    private let cameraNode = SKCameraNode()
    private let worldNode = SKNode()      // Contient tout le monde de jeu

    private var playerSprite: SKSpriteNode!
    private var enemySprites: [String: SKSpriteNode] = [:]

    private let pathfinding = PathfindingSystem()
    private let enemyAI = EnemyAISystem()
    private let companionSystem = CompanionSystem()

    // Contrôles Wild Rift
    private var joystick: VirtualJoystickNode!
    private var actionButtons: ActionButtonsNode!
    private var minimap: MinimapNode!
    private var inventoryNode: InventoryNode?
    private var dialogueBox: DialogueBoxNode?

    // Enemy instances (runtime)
    private var enemyInstances: [EnemyAISystem.EnemyInstance] = []

    // Mouvement continu via joystick
    private var lastUpdateTime: TimeInterval = 0
    private let playerSpeed: CGFloat = 120  // Points par seconde

    // Taille d'une tile isométrique
    private let tileSize = CGSize(width: 64, height: 32)

    // Node pooling pour dégâts flottants
    private var damageNodePool: [SKLabelNode] = []
    private let maxPoolSize = 20

    // Cached magic system instances (avoid per-call allocations)
    private let allomancy = AllomancySystem()
    private let surgebinding = SurgebindingSystem()
    private let awakening = AwakeningSystem()
    private let aonDor = AonDorSystem()
    private let sandMastery = SandMasterySystem()
    private let painting = PaintingSystem()

    // MARK: - Init

    init(zone: Zone, size: CGSize) {
        self.zone = zone
        super.init(size: size)
        isMultipleTouchEnabled = true
    }

    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    // MARK: - Lifecycle

    override func didMove(to view: SKView) {
        backgroundColor = .black
        setupCamera()
        setupWorld()
        setupPlayer()
        setupEnemies()
        setupNPCs()
        setupHUD()
        setupControls()
        setupMinimap()
        setupEnemyInstances()
        setupPathfinding()

        // Musique d'ambiance
        if let track = zone.ambientMusicTrack {
            AudioManager.shared.playMusic(track)
        }

        // Notification au système de quêtes
        GameManager.shared.questSystem.onZoneEntered(zoneID: zone.id)
    }

    // MARK: - Setup

    private func setupCamera() {
        camera = cameraNode
        addChild(cameraNode)
    }

    private func setupWorld() {
        addChild(worldNode)

        // Render tiles using a single texture for performance
        // SKShapeNode per tile is expensive; use a pre-rendered tile texture instead
        let tileTexture = createTileTexture()

        for row in 0..<zone.gridHeight {
            for col in 0..<zone.gridWidth {
                let pos = isoPosition(col: col, row: row)
                let tile = SKSpriteNode(texture: tileTexture)
                tile.position = pos
                tile.zPosition = CGFloat(-row - col)
                tile.zRotation = .pi / 4
                tile.setScale(0.7)
                worldNode.addChild(tile)
            }
        }
    }

    /// Create a reusable tile texture (avoids per-frame path rendering cost of SKShapeNode)
    private func createTileTexture() -> SKTexture {
        let tileNode = SKShapeNode(rectOf: CGSize(width: tileSize.width - 2, height: tileSize.height - 2))
        tileNode.fillColor = SKColor(red: 0.15, green: 0.12, blue: 0.1, alpha: 1.0)
        tileNode.strokeColor = SKColor(white: 0.3, alpha: 0.5)
        tileNode.lineWidth = 0.5
        let view = SKView()
        return view.texture(from: tileNode) ?? SKTexture()
    }

    private func setupPlayer() {
        guard let champion = GameManager.shared.champion else { return }

        playerSprite = SKSpriteNode(color: .cyan, size: CGSize(width: 24, height: 36))
        playerSprite.position = isoPosition(col: champion.gridPosition.col, row: champion.gridPosition.row)
        playerSprite.zPosition = 100
        playerSprite.name = "player"

        // Label du joueur
        let nameLabel = SKLabelNode(fontNamed: "Helvetica")
        nameLabel.text = champion.name
        nameLabel.fontSize = 10
        nameLabel.fontColor = .white
        nameLabel.position = CGPoint(x: 0, y: 22)
        playerSprite.addChild(nameLabel)

        worldNode.addChild(playerSprite)
        centerCamera(on: playerSprite.position, animated: false)
    }

    private func setupEnemies() {
        for spawn in zone.enemySpawns {
            guard let enemy = GameManager.shared.allEnemies[spawn.enemyID] else { continue }

            let sprite = SKSpriteNode(color: enemyColor(for: enemy.tier), size: CGSize(width: 20, height: 30))
            sprite.position = isoPosition(col: spawn.position.col, row: spawn.position.row)
            sprite.zPosition = 50
            sprite.name = "enemy_\(spawn.enemyID)_\(spawn.position.col)_\(spawn.position.row)"

            // Barre de vie
            let hpBar = SKShapeNode(rectOf: CGSize(width: 24, height: 3))
            hpBar.fillColor = .green
            hpBar.strokeColor = .clear
            hpBar.position = CGPoint(x: 0, y: 20)
            hpBar.name = "hpBar"
            sprite.addChild(hpBar)

            worldNode.addChild(sprite)
            if let spriteName = sprite.name {
                enemySprites[spriteName] = sprite
            }
        }
    }

    private func setupNPCs() {
        for npc in zone.npcSpawns {
            let sprite = SKSpriteNode(color: .yellow, size: CGSize(width: 20, height: 30))
            sprite.position = isoPosition(col: npc.position.col, row: npc.position.row)
            sprite.zPosition = 50
            sprite.name = "npc_\(npc.npcID)"

            // Indicateur de quête
            if npc.dialogueTreeID != nil {
                let questMark = SKLabelNode(text: "!")
                questMark.fontSize = 14
                questMark.fontColor = .yellow
                questMark.position = CGPoint(x: 0, y: 22)
                sprite.addChild(questMark)
            }

            worldNode.addChild(sprite)
        }
    }

    private func setupHUD() {
        guard let champion = GameManager.shared.champion else { return }

        // Barre de PV (haut gauche)
        let hpBg = SKShapeNode(rectOf: CGSize(width: 120, height: 12), cornerRadius: 3)
        hpBg.fillColor = SKColor(red: 0.3, green: 0, blue: 0, alpha: 0.8)
        hpBg.strokeColor = .red
        hpBg.position = CGPoint(x: -size.width / 2 + 80, y: size.height / 2 - 40)
        hpBg.name = "hpBarBg"
        cameraNode.addChild(hpBg)

        let hpFill = SKShapeNode(rectOf: CGSize(width: 116, height: 8), cornerRadius: 2)
        hpFill.fillColor = .red
        hpFill.strokeColor = .clear
        hpFill.name = "hpFill"
        hpBg.addChild(hpFill)

        let hpLabel = SKLabelNode(fontNamed: "Helvetica-Bold")
        hpLabel.text = "\(champion.currentHP)/\(champion.maxHP)"
        hpLabel.fontSize = 9
        hpLabel.fontColor = .white
        hpLabel.verticalAlignmentMode = .center
        hpLabel.name = "hpLabel"
        hpBg.addChild(hpLabel)

        // Barre d'Investiture
        let mpBg = SKShapeNode(rectOf: CGSize(width: 120, height: 12), cornerRadius: 3)
        mpBg.fillColor = SKColor(red: 0, green: 0, blue: 0.3, alpha: 0.8)
        mpBg.strokeColor = .cyan
        mpBg.position = CGPoint(x: -size.width / 2 + 80, y: size.height / 2 - 58)
        cameraNode.addChild(mpBg)

        let mpLabel = SKLabelNode(fontNamed: "Helvetica-Bold")
        mpLabel.text = "\(champion.currentInvestiture)/\(champion.maxInvestiture)"
        mpLabel.fontSize = 9
        mpLabel.fontColor = .white
        mpLabel.verticalAlignmentMode = .center
        mpBg.addChild(mpLabel)

        // Niveau
        let levelLabel = SKLabelNode(fontNamed: "Copperplate-Bold")
        levelLabel.text = "Nv. \(champion.level)"
        levelLabel.fontSize = 14
        levelLabel.fontColor = .white
        levelLabel.position = CGPoint(x: -size.width / 2 + 30, y: size.height / 2 - 20)
        levelLabel.name = "levelLabel"
        cameraNode.addChild(levelLabel)

        // Nom de la zone
        let zoneLabel = SKLabelNode(fontNamed: "Copperplate")
        zoneLabel.text = zone.name
        zoneLabel.fontSize = 12
        zoneLabel.fontColor = .lightGray
        zoneLabel.position = CGPoint(x: 0, y: size.height / 2 - 30)
        cameraNode.addChild(zoneLabel)

        // XP bar (sous les barres PV/MP)
        let xpBg = SKShapeNode(rectOf: CGSize(width: 120, height: 6), cornerRadius: 2)
        xpBg.fillColor = SKColor(white: 0.1, alpha: 0.8)
        xpBg.strokeColor = SKColor(red: 0.8, green: 0.7, blue: 0.2, alpha: 0.6)
        xpBg.position = CGPoint(x: -size.width / 2 + 80, y: size.height / 2 - 72)
        cameraNode.addChild(xpBg)

        let xpLabel = SKLabelNode(fontNamed: "Helvetica")
        xpLabel.text = "XP \(champion.currentXP)/\(champion.xpForNextLevel)"
        xpLabel.fontSize = 7
        xpLabel.fontColor = SKColor(red: 1.0, green: 0.9, blue: 0.3, alpha: 1.0)
        xpLabel.verticalAlignmentMode = .center
        xpBg.addChild(xpLabel)
    }

    // MARK: - Controls Setup (Wild Rift Style)

    private func setupControls() {
        // --- Joystick (bas gauche) ---
        joystick = VirtualJoystickNode()
        joystick.position = CGPoint(
            x: -size.width / 2 + 100,
            y: -size.height / 2 + 110
        )
        joystick.zPosition = 2000

        joystick.onDirectionChanged = { [weak self] direction, magnitude in
            self?.handleJoystickInput(direction: direction, magnitude: magnitude)
        }

        joystick.onRelease = { [weak self] in
            // Arrêter le mouvement, idle animation
            self?.playerSprite?.removeAction(forKey: "walkAnimation")
        }

        cameraNode.addChild(joystick)

        // --- Action Buttons (bas droite) ---
        actionButtons = ActionButtonsNode()
        actionButtons.position = CGPoint(
            x: size.width / 2 - 100,
            y: -size.height / 2 + 100
        )
        actionButtons.zPosition = 2000

        actionButtons.onAttackPressed = { [weak self] in
            self?.handleAttack()
        }

        actionButtons.onAbilityPressed = { [weak self] index in
            self?.handleAbility(index: index)
        }

        actionButtons.onUltimatePressed = { [weak self] in
            self?.handleUltimate()
        }

        // Configurer les icônes selon la classe
        configureAbilityIcons()

        cameraNode.addChild(actionButtons)
    }

    private func configureAbilityIcons() {
        guard let champion = GameManager.shared.champion else { return }

        switch champion.championClass {
        case .mistborn:
            actionButtons.updateAbilityIcon(index: 0, text: "Fe", color: SKColor(red: 0.5, green: 0.5, blue: 0.6, alpha: 0.85)) // Acier Push
            actionButtons.updateAbilityIcon(index: 1, text: "Ir", color: SKColor(red: 0.4, green: 0.4, blue: 0.5, alpha: 0.85)) // Fer Pull
            actionButtons.updateAbilityIcon(index: 2, text: "Pw", color: SKColor(red: 0.6, green: 0.4, blue: 0.2, alpha: 0.85)) // Pewter
            actionButtons.updateAbilityIcon(index: 3, text: "Sn", color: SKColor(red: 0.7, green: 0.7, blue: 0.8, alpha: 0.85)) // Étain

        case .radiant:
            let order = champion.radiantOrder ?? .windrunner
            switch order {
            case .windrunner:
                actionButtons.updateAbilityIcon(index: 0, text: "GR", color: SKColor(red: 0.2, green: 0.6, blue: 0.9, alpha: 0.85)) // Gravitation
                actionButtons.updateAbilityIcon(index: 1, text: "AD", color: SKColor(red: 0.3, green: 0.7, blue: 0.8, alpha: 0.85)) // Adhésion
                actionButtons.updateAbilityIcon(index: 2, text: "LS", color: SKColor(red: 0.1, green: 0.5, blue: 0.7, alpha: 0.85)) // Lashing
                actionButtons.updateAbilityIcon(index: 3, text: "SH", color: SKColor(red: 0.4, green: 0.8, blue: 1.0, alpha: 0.85)) // Shield
            case .edgedancer:
                actionButtons.updateAbilityIcon(index: 0, text: "AB", color: SKColor(red: 0.2, green: 0.8, blue: 0.4, alpha: 0.85))
                actionButtons.updateAbilityIcon(index: 1, text: "PR", color: SKColor(red: 0.3, green: 0.9, blue: 0.5, alpha: 0.85))
                actionButtons.updateAbilityIcon(index: 2, text: "SL", color: SKColor(red: 0.1, green: 0.7, blue: 0.3, alpha: 0.85))
                actionButtons.updateAbilityIcon(index: 3, text: "HL", color: SKColor(red: 0.4, green: 1.0, blue: 0.6, alpha: 0.85))
            case .lightweaver:
                actionButtons.updateAbilityIcon(index: 0, text: "IL", color: SKColor(red: 0.8, green: 0.6, blue: 0.9, alpha: 0.85))
                actionButtons.updateAbilityIcon(index: 1, text: "TR", color: SKColor(red: 0.7, green: 0.5, blue: 0.8, alpha: 0.85))
                actionButtons.updateAbilityIcon(index: 2, text: "LR", color: SKColor(red: 0.9, green: 0.7, blue: 1.0, alpha: 0.85))
                actionButtons.updateAbilityIcon(index: 3, text: "MM", color: SKColor(red: 0.6, green: 0.4, blue: 0.7, alpha: 0.85))
            case .bondsmith:
                actionButtons.updateAbilityIcon(index: 0, text: "TN", color: SKColor(red: 0.9, green: 0.8, blue: 0.3, alpha: 0.85))
                actionButtons.updateAbilityIcon(index: 1, text: "AD", color: SKColor(red: 0.8, green: 0.7, blue: 0.2, alpha: 0.85))
                actionButtons.updateAbilityIcon(index: 2, text: "UN", color: SKColor(red: 1.0, green: 0.9, blue: 0.4, alpha: 0.85))
                actionButtons.updateAbilityIcon(index: 3, text: "BN", color: SKColor(red: 0.7, green: 0.6, blue: 0.1, alpha: 0.85))
            }

        case .awakener:
            actionButtons.updateAbilityIcon(index: 0, text: "AW", color: SKColor(red: 0.8, green: 0.3, blue: 0.6, alpha: 0.85))
            actionButtons.updateAbilityIcon(index: 1, text: "AN", color: SKColor(red: 0.7, green: 0.2, blue: 0.5, alpha: 0.85))
            actionButtons.updateAbilityIcon(index: 2, text: "AU", color: SKColor(red: 0.9, green: 0.4, blue: 0.7, alpha: 0.85))
            actionButtons.updateAbilityIcon(index: 3, text: "DR", color: SKColor(red: 0.6, green: 0.1, blue: 0.4, alpha: 0.85))

        case .elantrian:
            actionButtons.updateAbilityIcon(index: 0, text: "Rao", color: SKColor(red: 0.9, green: 0.8, blue: 0.3, alpha: 0.85))
            actionButtons.updateAbilityIcon(index: 1, text: "Ash", color: SKColor(red: 0.8, green: 0.7, blue: 0.2, alpha: 0.85))
            actionButtons.updateAbilityIcon(index: 2, text: "Tia", color: SKColor(red: 1.0, green: 0.9, blue: 0.4, alpha: 0.85))
            actionButtons.updateAbilityIcon(index: 3, text: "Ien", color: SKColor(red: 0.7, green: 0.6, blue: 0.1, alpha: 0.85))

        case .sandMaster:
            actionButtons.updateAbilityIcon(index: 0, text: "FO", color: SKColor(red: 0.9, green: 0.8, blue: 0.5, alpha: 0.85)) // Fouet
            actionButtons.updateAbilityIcon(index: 1, text: "BO", color: SKColor(red: 0.8, green: 0.7, blue: 0.4, alpha: 0.85)) // Bouclier
            actionButtons.updateAbilityIcon(index: 2, text: "NU", color: SKColor(red: 0.7, green: 0.6, blue: 0.3, alpha: 0.85)) // Nuée
            actionButtons.updateAbilityIcon(index: 3, text: "PL", color: SKColor(red: 0.6, green: 0.5, blue: 0.2, alpha: 0.85)) // Plateforme

        case .nightmarePainter:
            actionButtons.updateAbilityIcon(index: 0, text: "PE", color: SKColor(red: 0.3, green: 0.1, blue: 0.4, alpha: 0.85)) // Peinture
            actionButtons.updateAbilityIcon(index: 1, text: "EM", color: SKColor(red: 0.4, green: 0.1, blue: 0.5, alpha: 0.85)) // Empilement
            actionButtons.updateAbilityIcon(index: 2, text: "OM", color: SKColor(red: 0.2, green: 0.0, blue: 0.3, alpha: 0.85)) // Ombre
            actionButtons.updateAbilityIcon(index: 3, text: "HI", color: SKColor(red: 0.5, green: 0.3, blue: 0.6, alpha: 0.85)) // Hion
        }
    }

    private func setupMinimap() {
        minimap = MinimapNode()
        minimap.position = CGPoint(x: size.width / 2 - 60, y: size.height / 2 - 60)
        minimap.zPosition = 4000
        cameraNode.addChild(minimap)
        minimap.setupForZone(zone)

        if let champion = GameManager.shared.champion {
            minimap.updatePlayerPosition(champion.gridPosition)
        }
    }

    private func setupEnemyInstances() {
        enemyInstances.removeAll()
        for (i, spawn) in zone.enemySpawns.enumerated() {
            guard let enemyData = GameManager.shared.allEnemies[spawn.enemyID] else { continue }
            let spriteName = "enemy_\(spawn.enemyID)_\(spawn.position.col)_\(spawn.position.row)"
            let instance = EnemyAISystem.EnemyInstance(
                enemyData: enemyData,
                spawnData: spawn,
                currentHP: enemyData.maxHP,
                position: isoPosition(col: spawn.position.col, row: spawn.position.row),
                gridPosition: spawn.position,
                state: .idle,
                sprite: enemySprites[spriteName],
                lastAttackTime: 0,
                respawnTimer: nil,
                abilityCooldowns: Array(repeating: 0, count: enemyData.abilities.count),
                aggroTarget: nil
            )
            enemyInstances.append(instance)
        }
    }

    private func setupPathfinding() {
        var obstacles = Set<GridPosition>()
        for enemy in zone.enemySpawns {
            obstacles.insert(enemy.position)
        }
        for npc in zone.npcSpawns {
            obstacles.insert(npc.position)
        }
        pathfinding.setupGrid(width: zone.gridWidth, height: zone.gridHeight, obstacles: obstacles)
    }

    // MARK: - Joystick Movement

    private func handleJoystickInput(direction: CGVector, magnitude: CGFloat) {
        // Movement is handled continuously in movePlayerContinuous() via the update loop.
        // This callback is used only for triggering walk animation on first input.
        guard magnitude > 0.1 else { return }
        if playerSprite.action(forKey: "walkAnimation") == nil {
            let walkAnim = SKAction.sequence([
                SKAction.scaleX(to: 1.05, duration: 0.15),
                SKAction.scaleX(to: 0.95, duration: 0.15)
            ])
            playerSprite.run(SKAction.repeatForever(walkAnim), withKey: "walkAnimation")
        }
    }

    private func movePlayerContinuous(deltaTime: TimeInterval) {
        guard joystick.isActive, joystick.magnitude > 0 else { return }

        let dir = joystick.direction
        let speed = playerSpeed * joystick.magnitude * CGFloat(deltaTime)

        // Convertir la direction du joystick (screen space) en isométrique
        // Screen X → iso diagonal droite, Screen Y → iso diagonal haut
        let isoX = dir.dx * speed
        let isoY = dir.dy * speed

        let newPos = CGPoint(
            x: playerSprite.position.x + isoX,
            y: playerSprite.position.y + isoY
        )

        // Vérifier les limites de la grille
        let gridPos = gridFromIso(newPos)
        guard gridPos.col >= 0, gridPos.col < zone.gridWidth,
              gridPos.row >= 0, gridPos.row < zone.gridHeight else { return }

        playerSprite.position = newPos
        GameManager.shared.champion?.gridPosition = gridPos

        // Smooth camera follow
        centerCamera(on: newPos, animated: true)

        // Vérifier les transitions de zone
        checkZoneConnections(at: gridPos)

        // Vérifier proximité avec PNJ/ennemis
        checkProximityInteractions(at: gridPos)
    }

    // MARK: - Action Handlers

    private func handleAttack() {
        guard let champion = GameManager.shared.champion else { return }

        // Trouver l'ennemi le plus proche dans le range d'attaque
        let attackRange: CGFloat = 60
        var closestEnemy: (name: String, sprite: SKSpriteNode, distance: CGFloat)?

        for (name, sprite) in enemySprites {
            let dist = hypot(
                sprite.position.x - playerSprite.position.x,
                sprite.position.y - playerSprite.position.y
            )
            if dist <= attackRange {
                if closestEnemy == nil || dist < closestEnemy!.distance {
                    closestEnemy = (name, sprite, dist)
                }
            }
        }

        if let target = closestEnemy {
            // Animation d'attaque
            let attackAnim = SKAction.sequence([
                SKAction.scale(to: 1.2, duration: 0.05),
                SKAction.scale(to: 1.0, duration: 0.1)
            ])
            playerSprite.run(attackAnim)

            // Flash sur l'ennemi
            let flash = SKAction.sequence([
                SKAction.colorize(with: .white, colorBlendFactor: 0.8, duration: 0.05),
                SKAction.colorize(withColorBlendFactor: 0, duration: 0.1)
            ])
            target.sprite.run(flash)

            // Dégâts flottants (pooled)
            let damage = champion.baseStats.strength + 5
            showFloatingDamage(damage, at: target.sprite.position)

            AudioManager.shared.playSFX("attack_hit", on: self)
        } else {
            // Attaque dans le vide — animation swing
            let swing = SKAction.sequence([
                SKAction.rotate(byAngle: 0.3, duration: 0.08),
                SKAction.rotate(byAngle: -0.3, duration: 0.08)
            ])
            playerSprite.run(swing)
        }
    }

    private func handleAbility(index: Int) {
        guard var champion = GameManager.shared.champion else { return }

        switch champion.championClass {
        case .mistborn:
            let metals: [SkillResourceType] = [.steel, .iron, .pewter, .tin]
            let metal = metals[index]
            let result = allomancy.burnMetal(metal, champion: &champion, targetPosition: nil)
            GameManager.shared.champion = champion

            if result.success {
                showAbilityEffect(description: result.effectDescription)
                actionButtons.startCooldown(abilityIndex: index, duration: 3.0)
            }

        case .radiant:
            let surges: [SurgebindingSystem.Surge] = [.gravitation, .adhesion, .abrasion, .progression]
            let surge = index < surges.count ? surges[index] : .gravitation
            let result = surgebinding.useSurge(surge, champion: &champion, targetPosition: nil)
            GameManager.shared.champion = champion

            if result.success {
                showAbilityEffect(description: result.description)
                actionButtons.startCooldown(abilityIndex: index, duration: 5.0)

                if result.healing > 0 {
                    showHealEffect(amount: result.healing)
                }
            }

        case .awakener:
            let commands: [AwakeningSystem.AwakeningCommand] = [.animateCloth, .animateWeapon, .chromaAura, .lifeleecher]
            let command = index < commands.count ? commands[index] : .animateCloth
            let result = awakening.useCommand(command, champion: &champion, targetPosition: nil)
            GameManager.shared.champion = champion

            if result.success {
                showAbilityEffect(description: result.description)
                actionButtons.startCooldown(abilityIndex: index, duration: 4.0)

                if result.healing > 0 {
                    showHealEffect(amount: result.healing)
                }
                if result.damage > 0 {
                    showFloatingDamage(result.damage, at: playerSprite.position, color: .magenta)
                }
            }

        case .elantrian:
            let aons: [AonDorSystem.Aon] = [.rao, .ashe, .tia, .ien]
            let aon = index < aons.count ? aons[index] : .rao
            let result = aonDor.drawAon(aon, champion: &champion, targetPosition: nil)
            GameManager.shared.champion = champion

            if result.success {
                showAbilityEffect(description: result.description)
                actionButtons.startCooldown(abilityIndex: index, duration: 4.5)

                if result.healing > 0 {
                    showHealEffect(amount: result.healing)
                }
                if result.damage > 0 {
                    showFloatingDamage(result.damage, at: playerSprite.position, color: result.glyphColor)
                }
            }

        case .sandMaster:
            let forms: [SandMasterySystem.SandForm] = [.lash, .shield, .swarm, .platform]
            let form = index < forms.count ? forms[index] : .lash
            let result = sandMastery.useSandForm(form, champion: &champion, targetPosition: nil)
            GameManager.shared.champion = champion

            if result.success {
                showAbilityEffect(description: result.description)
                actionButtons.startCooldown(abilityIndex: index, duration: 3.5)

                if result.damage > 0 {
                    showFloatingDamage(result.damage, at: playerSprite.position, color: SKColor(red: 0.9, green: 0.8, blue: 0.5, alpha: 1.0))
                }
            }

        case .nightmarePainter:
            let techniques: [PaintingSystem.PaintingTechnique] = [.ink_slash, .capture, .nightmare_ward, .banish]
            let technique = index < techniques.count ? techniques[index] : .ink_slash
            let result = painting.usePaintingTechnique(technique, champion: &champion, targetPosition: nil)
            GameManager.shared.champion = champion

            if result.success {
                showAbilityEffect(description: result.description)
                actionButtons.startCooldown(abilityIndex: index, duration: 3.5)

                if result.healing > 0 {
                    showHealEffect(amount: result.healing)
                }
                if result.damage > 0 {
                    showFloatingDamage(result.damage, at: playerSprite.position, color: SKColor(red: 0.3, green: 0.1, blue: 0.4, alpha: 1.0))
                }
            }
        }
    }

    private func handleUltimate() {
        guard let champion = GameManager.shared.champion else { return }

        // Effet ultime spectaculaire
        let ultimateFlash = SKShapeNode(circleOfRadius: 150)
        ultimateFlash.fillColor = .clear
        ultimateFlash.strokeColor = SKColor(red: 1.0, green: 0.85, blue: 0.2, alpha: 1.0)
        ultimateFlash.lineWidth = 4
        ultimateFlash.position = playerSprite.position
        ultimateFlash.zPosition = 400
        ultimateFlash.setScale(0.1)
        worldNode.addChild(ultimateFlash)

        ultimateFlash.run(SKAction.sequence([
            SKAction.group([
                SKAction.scale(to: 1.5, duration: 0.5),
                SKAction.fadeOut(withDuration: 0.5)
            ]),
            SKAction.removeFromParent()
        ]))

        // Screen shake
        let shake = SKAction.sequence([
            SKAction.moveBy(x: 5, y: 3, duration: 0.03),
            SKAction.moveBy(x: -10, y: -6, duration: 0.03),
            SKAction.moveBy(x: 8, y: 4, duration: 0.03),
            SKAction.moveBy(x: -3, y: -1, duration: 0.03)
        ])
        cameraNode.run(SKAction.repeat(shake, count: 4))

        let ultText: String
        switch champion.championClass {
        case .mistborn:         ultText = "BRUME ÉTERNELLE !"
        case .radiant:          ultText = "SERMENT RADIEUX !"
        case .awakener:         ultText = "ÉVEIL SUPRÊME !"
        case .elantrian:        ultText = "AON ULTIME !"
        case .sandMaster:       ultText = "TEMPÊTE DE SABLE !"
        case .nightmarePainter: ultText = "PEINTURE CAUCHEMAR !"
        }

        showAbilityEffect(description: ultText)
    }

    // MARK: - Damage Label Pool

    /// Get a label from the pool or create one if pool is empty
    private func obtainDamageLabel() -> SKLabelNode {
        if let recycled = damageNodePool.popLast() {
            recycled.alpha = 1.0
            recycled.setScale(1.0)
            recycled.removeAllActions()
            return recycled
        }
        let label = SKLabelNode(fontNamed: "Helvetica-Bold")
        label.fontSize = 14
        label.zPosition = 500
        return label
    }

    /// Show floating damage text using pooled nodes
    private func showFloatingDamage(_ damage: Int, at position: CGPoint, color: SKColor = .white) {
        let label = obtainDamageLabel()
        label.text = "\(damage)"
        label.fontColor = color
        label.position = position
        worldNode.addChild(label)

        label.run(SKAction.sequence([
            SKAction.group([
                SKAction.moveBy(x: CGFloat.random(in: -15...15), y: 40, duration: 0.6),
                SKAction.fadeOut(withDuration: 0.5)
            ]),
            SKAction.run { [weak self] in
                label.removeFromParent()
                guard let self else { return }
                if self.damageNodePool.count < self.maxPoolSize {
                    self.damageNodePool.append(label)
                }
            }
        ]))
    }

    // MARK: - Visual Effects

    private func showAbilityEffect(description: String) {
        let label = SKLabelNode(fontNamed: "Copperplate-Bold")
        label.text = description
        label.fontSize = 16
        label.fontColor = SKColor(red: 1.0, green: 0.9, blue: 0.4, alpha: 1.0)
        label.position = CGPoint(x: 0, y: size.height / 4)
        label.zPosition = 3000
        cameraNode.addChild(label)

        label.run(SKAction.sequence([
            SKAction.group([
                SKAction.moveBy(x: 0, y: 30, duration: 1.5),
                SKAction.sequence([
                    SKAction.wait(forDuration: 0.8),
                    SKAction.fadeOut(withDuration: 0.7)
                ])
            ]),
            SKAction.removeFromParent()
        ]))
    }

    private func showHealEffect(amount: Int) {
        let healLabel = SKLabelNode(fontNamed: "Helvetica-Bold")
        healLabel.text = "+\(amount)"
        healLabel.fontSize = 18
        healLabel.fontColor = .green
        healLabel.position = playerSprite.position
        healLabel.zPosition = 500
        worldNode.addChild(healLabel)

        healLabel.run(SKAction.sequence([
            SKAction.group([
                SKAction.moveBy(x: 0, y: 50, duration: 0.8),
                SKAction.fadeOut(withDuration: 0.7)
            ]),
            SKAction.removeFromParent()
        ]))
    }

    // MARK: - Proximity Detection

    private func checkProximityInteractions(at position: GridPosition) {
        // Auto-interact avec PNJ proches
        for npc in zone.npcSpawns {
            let dist = abs(npc.position.col - position.col) + abs(npc.position.row - position.row)
            if dist <= 2 {
                // Afficher indicateur d'interaction
                if let npcSprite = worldNode.childNode(withName: "npc_\(npc.npcID)") {
                    if npcSprite.childNode(withName: "interact_hint") == nil {
                        let hint = SKLabelNode(fontNamed: "Helvetica")
                        hint.text = "Parler"
                        hint.fontSize = 8
                        hint.fontColor = SKColor(white: 0.8, alpha: 0.8)
                        hint.position = CGPoint(x: 0, y: 30)
                        hint.name = "interact_hint"
                        npcSprite.addChild(hint)
                    }
                }
            }
        }
    }

    // MARK: - Isometric Helpers

    func isoPosition(col: Int, row: Int) -> CGPoint {
        let x = (col - row) * Int(tileSize.width / 2)
        let y = (col + row) * Int(tileSize.height / 2)
        return CGPoint(x: x, y: -y)
    }

    func gridFromIso(_ point: CGPoint) -> GridPosition {
        let adjustedY = -point.y
        let col = Int(round((point.x / (tileSize.width / 2) + adjustedY / (tileSize.height / 2)) / 2))
        let row = Int(round((adjustedY / (tileSize.height / 2) - point.x / (tileSize.width / 2)) / 2))
        return GridPosition(col: max(0, min(col, zone.gridWidth - 1)),
                           row: max(0, min(row, zone.gridHeight - 1)))
    }

    // MARK: - Camera

    private func centerCamera(on position: CGPoint, animated: Bool) {
        if animated {
            let moveAction = SKAction.move(to: position, duration: 0.1)
            moveAction.timingMode = .easeOut
            cameraNode.run(moveAction, withKey: "cameraFollow")
        } else {
            cameraNode.position = position
        }
    }

    // MARK: - Zone Transitions

    private func checkZoneConnections(at position: GridPosition) {
        for connection in zone.connections {
            if connection.exitPosition == position {
                if let view = self.view {
                    SceneRouter(view: view).transitionToZone(
                        connection.targetZoneID,
                        entryPoint: connection.entryPointName
                    )
                }
                return
            }
        }
    }

    // MARK: - Helpers

    private func enemyColor(for tier: EnemyTier) -> SKColor {
        switch tier {
        case .minion:  return SKColor(red: 0.6, green: 0.3, blue: 0.3, alpha: 1.0)
        case .soldier: return SKColor(red: 0.8, green: 0.2, blue: 0.2, alpha: 1.0)
        case .elite:   return SKColor(red: 0.7, green: 0.1, blue: 0.5, alpha: 1.0)
        case .boss:    return SKColor(red: 0.9, green: 0.1, blue: 0.1, alpha: 1.0)
        }
    }

    // MARK: - Update Loop

    override func update(_ currentTime: TimeInterval) {
        let deltaTime = lastUpdateTime == 0 ? 0 : currentTime - lastUpdateTime
        lastUpdateTime = currentTime
        guard deltaTime < 0.5 else { return } // Skip large frame gaps (e.g. backgrounding)

        // Mouvement continu via joystick
        movePlayerContinuous(deltaTime: deltaTime)

        // Update enemy AI
        let playerPos = playerSprite?.position ?? .zero
        for i in 0..<enemyInstances.count {
            enemyAI.update(enemy: &enemyInstances[i], playerPosition: playerPos, deltaTime: deltaTime)
            minimap.updateEnemyPosition(index: i, gridPos: enemyInstances[i].gridPosition,
                                         isAlive: enemyInstances[i].isAlive)
        }

        // Update minimap player position
        if let champion = GameManager.shared.champion {
            minimap.updatePlayerPosition(champion.gridPosition)
        }

        // Update companion
        let enemies = enemyInstances.filter { $0.isAlive }.map { (position: $0.position, id: $0.enemyData.id) }
        companionSystem.update(deltaTime: deltaTime, playerPosition: playerPos, enemies: enemies)
    }
}
