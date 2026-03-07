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

    // Contrôles Wild Rift
    private var joystick: VirtualJoystickNode!
    private var actionButtons: ActionButtonsNode!

    // Mouvement continu via joystick
    private var lastUpdateTime: TimeInterval = 0
    private let playerSpeed: CGFloat = 120  // Points par seconde

    // Taille d'une tile isométrique
    private let tileSize = CGSize(width: 64, height: 32)

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

        // Dessiner la grille isométrique (placeholder)
        for row in 0..<zone.gridHeight {
            for col in 0..<zone.gridWidth {
                let pos = isoPosition(col: col, row: row)
                let tile = SKShapeNode(rectOf: CGSize(width: tileSize.width - 2, height: tileSize.height - 2))
                tile.fillColor = SKColor(red: 0.15, green: 0.12, blue: 0.1, alpha: 1.0)
                tile.strokeColor = SKColor(white: 0.3, alpha: 0.5)
                tile.lineWidth = 0.5
                tile.position = pos
                tile.zPosition = CGFloat(-row - col)

                // Rotation pour effet isométrique
                tile.zRotation = .pi / 4
                tile.setScale(0.7)

                worldNode.addChild(tile)
            }
        }
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
            enemySprites[sprite.name!] = sprite
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
        // Direction du joystick → direction isométrique
        // Le joystick donne un vecteur screen-space, on le convertit en iso-space
        // En iso : droite = (+1, -1), haut = (-1, -1), etc.
        // On garde le mouvement fluide en pixels plutôt qu'en tiles
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

            // Dégâts flottants
            let damage = champion.baseStats.strength + 5
            let dmgLabel = SKLabelNode(fontNamed: "Helvetica-Bold")
            dmgLabel.text = "\(damage)"
            dmgLabel.fontSize = 14
            dmgLabel.fontColor = .white
            dmgLabel.position = target.sprite.position
            dmgLabel.zPosition = 500
            worldNode.addChild(dmgLabel)

            dmgLabel.run(SKAction.sequence([
                SKAction.group([
                    SKAction.moveBy(x: CGFloat.random(in: -15...15), y: 40, duration: 0.6),
                    SKAction.fadeOut(withDuration: 0.5)
                ]),
                SKAction.removeFromParent()
            ]))

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
            let allomancy = AllomancySystem()
            let result = allomancy.burnMetal(metal, champion: &champion, targetPosition: nil)
            GameManager.shared.champion = champion

            if result.success {
                showAbilityEffect(description: result.effectDescription)
                actionButtons.startCooldown(abilityIndex: index, duration: 3.0)
            }

        case .radiant:
            let surgebinding = SurgebindingSystem()
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

        default:
            showAbilityEffect(description: "Compétence \(index + 1) activée")
            actionButtons.startCooldown(abilityIndex: index, duration: 4.0)
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
        case .mistborn:  ultText = "BRUME ETERNELLE !"
        case .radiant:   ultText = "SERMENT RADIEUX !"
        case .awakener:  ultText = "ÉVEIL SUPREME !"
        case .elantrian: ultText = "AON ULTIME !"
        }

        showAbilityEffect(description: ultText)
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

        // Mouvement continu via joystick
        movePlayerContinuous(deltaTime: deltaTime)

        // TODO: Update IA ennemis, effets de statut, cooldowns
    }
}
