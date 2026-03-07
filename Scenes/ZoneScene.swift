import SpriteKit
import GameplayKit

/// Scene de jeu principale — zone isometrique explorable
/// Controles style Wild Rift : joystick gauche + boutons d'action droite
class ZoneScene: SKScene {

    // MARK: - Properties

    private let zone: Zone
    private let cameraNode = SKCameraNode()
    private let worldNode = SKNode()

    private var playerNode: SKNode!
    private var enemyNodes: [String: SKNode] = [:]

    private let pathfinding = PathfindingSystem()
    private let enemyAI = EnemyAISystem()
    private let companionSystem = CompanionSystem()

    // Controls Wild Rift
    private var joystick: VirtualJoystickNode!
    private var actionButtons: ActionButtonsNode!
    private var minimap: MinimapNode!
    private var dialogueBox: DialogueBoxNode?
    private var pauseMenu: PauseMenuNode?

    // Enemy instances (runtime)
    private var enemyInstances: [EnemyAISystem.EnemyInstance] = []

    // Movement
    private var lastUpdateTime: TimeInterval = 0
    private let playerSpeed: CGFloat = 120
    private let tileSize = CGSize(width: 64, height: 32)

    // Damage label pooling
    private var damageNodePool: [SKLabelNode] = []
    private let maxPoolSize = 20

    // Zone transition safety
    private var isTransitioning = false

    // Gameplay: out-of-combat HP regen
    private var lastDamageTakenTime: TimeInterval = 0
    private let hpRegenDelay: TimeInterval = 5.0
    private let hpRegenPercent: Double = 0.01  // 1% maxHP per second

    // Gameplay: low HP vignette
    private var lowHPVignette: SKShapeNode?

    // Theme
    private let worldTheme: WorldTheme

    // Cached magic systems
    private let allomancy = AllomancySystem()
    private let surgebinding = SurgebindingSystem()
    private let awakening = AwakeningSystem()
    private let aonDor = AonDorSystem()
    private let sandMastery = SandMasterySystem()
    private let painting = PaintingSystem()

    // MARK: - Init

    init(zone: Zone, size: CGSize) {
        self.zone = zone
        self.worldTheme = WorldTheme.theme(for: zone.worldID)
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
        setupDecorations()
        setupZoneExits()
        setupPlayer()
        setupEnemies()
        setupNPCs()
        setupWeatherEffects()
        setupHUD()
        setupControls()
        setupMinimap()
        setupPauseButton()
        setupEnemyInstances()
        setupPathfinding()
        setupEnemyAICallbacks()

        setupLowHPVignette()

        if let track = zone.ambientMusicTrack {
            AudioManager.shared.playMusic(track)
        }

        GameManager.shared.questSystem.onZoneEntered(zoneID: zone.id)

        // Auto-save on zone entry
        _ = SaveManager.shared.save()
    }

    // MARK: - Setup

    private func setupCamera() {
        camera = cameraNode
        addChild(cameraNode)
    }

    private func setupWorld() {
        addChild(worldNode)

        // Create themed tile textures (batch by variation for performance)
        let textures = createTileTextures()

        for row in 0..<zone.gridHeight {
            for col in 0..<zone.gridWidth {
                let pos = isoPosition(col: col, row: row)
                let textureIndex = (col * 7 + row * 13) % textures.count
                let tile = SKSpriteNode(texture: textures[textureIndex])
                tile.position = pos
                tile.zPosition = CGFloat(-row - col)
                tile.zRotation = .pi / 4
                tile.setScale(0.7)
                worldNode.addChild(tile)
            }
        }

        // Edge glow
        setupEdgeGlow()
    }

    private func createTileTextures() -> [SKTexture] {
        let view = SKView()
        var textures: [SKTexture] = []

        let allColors = [worldTheme.tileBaseColor] + worldTheme.tileVariations
        for color in allColors {
            let tileNode = SKShapeNode(rectOf: CGSize(width: tileSize.width - 2, height: tileSize.height - 2))
            tileNode.fillColor = color
            tileNode.strokeColor = SKColor(white: 0.3, alpha: 0.3)
            tileNode.lineWidth = 0.5

            // Subtle crack detail
            let crack = SKShapeNode(rectOf: CGSize(width: 1, height: CGFloat.random(in: 4...10)))
            crack.fillColor = SKColor(white: 0.1, alpha: 0.2)
            crack.strokeColor = .clear
            crack.position = CGPoint(x: CGFloat.random(in: -8...8), y: CGFloat.random(in: -4...4))
            crack.zRotation = CGFloat.random(in: -0.5...0.5)
            tileNode.addChild(crack)

            if let tex = view.texture(from: tileNode) {
                textures.append(tex)
            }
        }

        if textures.isEmpty {
            let fallback = SKShapeNode(rectOf: CGSize(width: tileSize.width - 2, height: tileSize.height - 2))
            fallback.fillColor = worldTheme.tileBaseColor
            fallback.strokeColor = SKColor(white: 0.3, alpha: 0.3)
            fallback.lineWidth = 0.5
            textures.append(view.texture(from: fallback) ?? SKTexture())
        }

        return textures
    }

    private func setupEdgeGlow() {
        let color = worldTheme.edgeGlowColor

        let topLeft = SKShapeNode(rectOf: CGSize(width: CGFloat(zone.gridWidth) * 20, height: 4))
        topLeft.fillColor = color.withAlphaComponent(0.3)
        topLeft.strokeColor = .clear
        topLeft.position = isoPosition(col: zone.gridWidth / 2, row: 0)
        topLeft.zPosition = -100
        topLeft.zRotation = -.pi / 4
        worldNode.addChild(topLeft)

        let bottomRight = SKShapeNode(rectOf: CGSize(width: CGFloat(zone.gridWidth) * 20, height: 4))
        bottomRight.fillColor = color.withAlphaComponent(0.3)
        bottomRight.strokeColor = .clear
        bottomRight.position = isoPosition(col: zone.gridWidth / 2, row: zone.gridHeight)
        bottomRight.zPosition = -100
        bottomRight.zRotation = -.pi / 4
        worldNode.addChild(bottomRight)

        let pulse = SKAction.repeatForever(SKAction.sequence([
            SKAction.fadeAlpha(to: 0.15, duration: 2.0),
            SKAction.fadeAlpha(to: 0.4, duration: 2.0)
        ]))
        topLeft.run(pulse)
        bottomRight.run(pulse)
    }

    private func setupDecorations() {
        DecorationRenderer.placeDecorations(
            on: worldNode, zone: zone, theme: worldTheme,
            isoPosition: { [weak self] col, row in
                self?.isoPosition(col: col, row: row) ?? .zero
            }
        )
    }

    private func setupZoneExits() {
        for connection in zone.connections {
            let exitNode = EntityRenderer.createZoneExitIndicator(connection: connection)
            exitNode.position = isoPosition(col: connection.exitPosition.col, row: connection.exitPosition.row)
            exitNode.zPosition = CGFloat(-connection.exitPosition.row - connection.exitPosition.col) + 0.8
            worldNode.addChild(exitNode)
        }
    }

    private func setupPlayer() {
        guard let champion = GameManager.shared.champion else { return }

        playerNode = PlayerRenderer.createPlayerNode(champion: champion)
        playerNode.position = isoPosition(col: champion.gridPosition.col, row: champion.gridPosition.row)
        playerNode.zPosition = 100
        worldNode.addChild(playerNode)
        centerCamera(on: playerNode.position, animated: false)
    }

    private func setupEnemies() {
        for spawn in zone.enemySpawns {
            guard let enemy = GameManager.shared.allEnemies[spawn.enemyID] else { continue }

            let node = EntityRenderer.createEnemyNode(enemy: enemy, spawn: spawn)
            node.position = isoPosition(col: spawn.position.col, row: spawn.position.row)
            node.zPosition = 50
            worldNode.addChild(node)

            if let name = node.name {
                enemyNodes[name] = node
            }
        }
    }

    private func setupNPCs() {
        for npc in zone.npcSpawns {
            let node = EntityRenderer.createNPCNode(npc: npc)
            node.position = isoPosition(col: npc.position.col, row: npc.position.row)
            node.zPosition = 50
            worldNode.addChild(node)
        }
    }

    private func setupWeatherEffects() {
        guard let weather = zone.weatherEffect, weather != .none else { return }
        if let emitter = SpellEffectsSystem.createWeatherEmitter(effect: weather, sceneSize: size) {
            cameraNode.addChild(emitter)
        }
    }

    private func setupHUD() {
        guard let champion = GameManager.shared.champion else { return }

        // HUD panel background
        let panelBg = SKShapeNode(rectOf: CGSize(width: 140, height: 80), cornerRadius: 8)
        panelBg.fillColor = SKColor(white: 0, alpha: 0.5)
        panelBg.strokeColor = SKColor(red: 0.4, green: 0.35, blue: 0.2, alpha: 0.5)
        panelBg.lineWidth = 1
        panelBg.position = CGPoint(x: -size.width / 2 + 80, y: size.height / 2 - 52)
        panelBg.zPosition = 1900
        cameraNode.addChild(panelBg)

        // HP bar
        let hpBg = SKShapeNode(rectOf: CGSize(width: 120, height: 12), cornerRadius: 3)
        hpBg.fillColor = SKColor(red: 0.3, green: 0, blue: 0, alpha: 0.8)
        hpBg.strokeColor = .red
        hpBg.lineWidth = 1
        hpBg.position = CGPoint(x: -size.width / 2 + 80, y: size.height / 2 - 35)
        hpBg.name = "hpBarBg"
        hpBg.zPosition = 2000
        cameraNode.addChild(hpBg)

        let hpFill = SKShapeNode(rectOf: CGSize(width: 116, height: 8), cornerRadius: 2)
        hpFill.fillColor = .red
        hpFill.strokeColor = .clear
        hpFill.name = "hpFill"
        hpBg.addChild(hpFill)

        let hpShine = SKShapeNode(rectOf: CGSize(width: 116, height: 4), cornerRadius: 1)
        hpShine.fillColor = SKColor(white: 1, alpha: 0.15)
        hpShine.strokeColor = .clear
        hpShine.position = CGPoint(x: 0, y: 2)
        hpBg.addChild(hpShine)

        let hpIcon = SKLabelNode(fontNamed: "Helvetica-Bold")
        hpIcon.text = "PV"
        hpIcon.fontSize = 7
        hpIcon.fontColor = SKColor(red: 1, green: 0.6, blue: 0.6, alpha: 1)
        hpIcon.position = CGPoint(x: -65, y: -3)
        hpIcon.zPosition = 1
        hpBg.addChild(hpIcon)

        let hpLabel = SKLabelNode(fontNamed: "Helvetica-Bold")
        hpLabel.text = "\(champion.currentHP)/\(champion.maxHP)"
        hpLabel.fontSize = 8
        hpLabel.fontColor = .white
        hpLabel.verticalAlignmentMode = .center
        hpLabel.name = "hpLabel"
        hpBg.addChild(hpLabel)

        // Investiture bar
        let mpBg = SKShapeNode(rectOf: CGSize(width: 120, height: 12), cornerRadius: 3)
        mpBg.fillColor = SKColor(red: 0, green: 0, blue: 0.3, alpha: 0.8)
        mpBg.strokeColor = .cyan
        mpBg.lineWidth = 1
        mpBg.position = CGPoint(x: -size.width / 2 + 80, y: size.height / 2 - 52)
        mpBg.zPosition = 2000
        cameraNode.addChild(mpBg)

        let mpShine = SKShapeNode(rectOf: CGSize(width: 116, height: 4), cornerRadius: 1)
        mpShine.fillColor = SKColor(white: 1, alpha: 0.12)
        mpShine.strokeColor = .clear
        mpShine.position = CGPoint(x: 0, y: 2)
        mpBg.addChild(mpShine)

        let mpIcon = SKLabelNode(fontNamed: "Helvetica-Bold")
        mpIcon.text = "INV"
        mpIcon.fontSize = 7
        mpIcon.fontColor = SKColor(red: 0.5, green: 0.8, blue: 1, alpha: 1)
        mpIcon.position = CGPoint(x: -65, y: -3)
        mpIcon.zPosition = 1
        mpBg.addChild(mpIcon)

        let mpLabel = SKLabelNode(fontNamed: "Helvetica-Bold")
        mpLabel.text = "\(champion.currentInvestiture)/\(champion.maxInvestiture)"
        mpLabel.fontSize = 8
        mpLabel.fontColor = .white
        mpLabel.verticalAlignmentMode = .center
        mpBg.addChild(mpLabel)

        // Level badge
        let levelBadge = SKShapeNode(circleOfRadius: 14)
        levelBadge.fillColor = SKColor(red: 0.15, green: 0.12, blue: 0.25, alpha: 0.9)
        levelBadge.strokeColor = SKColor(red: 0.6, green: 0.5, blue: 0.2, alpha: 0.8)
        levelBadge.lineWidth = 1.5
        levelBadge.position = CGPoint(x: -size.width / 2 + 22, y: size.height / 2 - 22)
        levelBadge.zPosition = 2000
        cameraNode.addChild(levelBadge)

        let levelLabel = SKLabelNode(fontNamed: "Copperplate-Bold")
        levelLabel.text = "\(champion.level)"
        levelLabel.fontSize = 13
        levelLabel.fontColor = .white
        levelLabel.verticalAlignmentMode = .center
        levelLabel.name = "levelLabel"
        levelBadge.addChild(levelLabel)

        // Zone name
        let zoneBg = SKShapeNode(rectOf: CGSize(width: 160, height: 22), cornerRadius: 6)
        zoneBg.fillColor = SKColor(white: 0, alpha: 0.4)
        zoneBg.strokeColor = SKColor(white: 0.3, alpha: 0.3)
        zoneBg.lineWidth = 0.5
        zoneBg.position = CGPoint(x: 0, y: size.height / 2 - 25)
        zoneBg.zPosition = 2000
        cameraNode.addChild(zoneBg)

        let zoneLabel = SKLabelNode(fontNamed: "Copperplate")
        zoneLabel.text = zone.name
        zoneLabel.fontSize = 11
        zoneLabel.fontColor = .lightGray
        zoneLabel.verticalAlignmentMode = .center
        zoneBg.addChild(zoneLabel)

        // XP bar
        let xpBg = SKShapeNode(rectOf: CGSize(width: 120, height: 6), cornerRadius: 2)
        xpBg.fillColor = SKColor(white: 0.1, alpha: 0.8)
        xpBg.strokeColor = SKColor(red: 0.6, green: 0.5, blue: 0.2, alpha: 0.4)
        xpBg.lineWidth = 0.5
        xpBg.position = CGPoint(x: -size.width / 2 + 80, y: size.height / 2 - 66)
        xpBg.zPosition = 2000
        cameraNode.addChild(xpBg)

        let xpLabel = SKLabelNode(fontNamed: "Helvetica")
        xpLabel.text = "XP \(champion.currentXP)/\(champion.xpForNextLevel)"
        xpLabel.fontSize = 7
        xpLabel.fontColor = SKColor(red: 1.0, green: 0.9, blue: 0.3, alpha: 1.0)
        xpLabel.verticalAlignmentMode = .center
        xpBg.addChild(xpLabel)

        // Gold
        let goldLabel = SKLabelNode(fontNamed: "Copperplate-Bold")
        goldLabel.text = "\(champion.gold) or"
        goldLabel.fontSize = 11
        goldLabel.fontColor = SKColor(red: 1, green: 0.85, blue: 0.3, alpha: 1)
        goldLabel.horizontalAlignmentMode = .right
        goldLabel.position = CGPoint(x: size.width / 2 - 20, y: size.height / 2 - 25)
        goldLabel.zPosition = 2000
        goldLabel.name = "goldLabel"
        cameraNode.addChild(goldLabel)
    }

    private func setupPauseButton() {
        let pauseBtn = SKShapeNode(rectOf: CGSize(width: 32, height: 32), cornerRadius: 6)
        pauseBtn.fillColor = SKColor(white: 0.1, alpha: 0.6)
        pauseBtn.strokeColor = SKColor(white: 0.4, alpha: 0.5)
        pauseBtn.lineWidth = 1
        pauseBtn.position = CGPoint(x: size.width / 2 - 30, y: size.height / 2 - 55)
        pauseBtn.zPosition = 2000
        pauseBtn.name = "pauseButton"
        cameraNode.addChild(pauseBtn)

        let pauseIcon = SKLabelNode(fontNamed: "Helvetica-Bold")
        pauseIcon.text = "||"
        pauseIcon.fontSize = 14
        pauseIcon.fontColor = .white
        pauseIcon.verticalAlignmentMode = .center
        pauseIcon.name = "pauseButton"
        pauseBtn.addChild(pauseIcon)
    }

    private func setupLowHPVignette() {
        let vignette = SKShapeNode(rectOf: CGSize(width: size.width + 20, height: size.height + 20), cornerRadius: 0)
        vignette.fillColor = SKColor(red: 0.8, green: 0, blue: 0, alpha: 0.15)
        vignette.strokeColor = SKColor(red: 1, green: 0, blue: 0, alpha: 0.3)
        vignette.lineWidth = 12
        vignette.position = .zero
        vignette.zPosition = 1800
        vignette.alpha = 0
        vignette.name = "lowHPVignette"
        cameraNode.addChild(vignette)
        lowHPVignette = vignette
    }

    // MARK: - Controls Setup

    private func setupControls() {
        joystick = VirtualJoystickNode()
        joystick.position = CGPoint(x: -size.width / 2 + 100, y: -size.height / 2 + 110)
        joystick.zPosition = 2000

        joystick.onDirectionChanged = { [weak self] direction, magnitude in
            self?.handleJoystickInput(direction: direction, magnitude: magnitude)
        }

        joystick.onRelease = { [weak self] in
            guard let self, let playerNode = self.playerNode else { return }
            PlayerRenderer.stopWalkAnimation(on: playerNode)
        }

        cameraNode.addChild(joystick)

        actionButtons = ActionButtonsNode()
        actionButtons.position = CGPoint(x: size.width / 2 - 100, y: -size.height / 2 + 100)
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

        actionButtons.onInteractPressed = { [weak self] mode in
            self?.handleInteraction(mode: mode)
        }

        configureAbilityIcons()
        cameraNode.addChild(actionButtons)
    }

    private func configureAbilityIcons() {
        guard let champion = GameManager.shared.champion else { return }

        switch champion.championClass {
        case .mistborn:
            actionButtons.updateAbilityIcon(index: 0, text: "Fe", color: SKColor(red: 0.5, green: 0.5, blue: 0.6, alpha: 0.85))
            actionButtons.updateAbilityIcon(index: 1, text: "Ir", color: SKColor(red: 0.4, green: 0.4, blue: 0.5, alpha: 0.85))
            actionButtons.updateAbilityIcon(index: 2, text: "Pw", color: SKColor(red: 0.6, green: 0.4, blue: 0.2, alpha: 0.85))
            actionButtons.updateAbilityIcon(index: 3, text: "Sn", color: SKColor(red: 0.7, green: 0.7, blue: 0.8, alpha: 0.85))

        case .radiant:
            let order = champion.radiantOrder ?? .windrunner
            switch order {
            case .windrunner:
                actionButtons.updateAbilityIcon(index: 0, text: "GR", color: SKColor(red: 0.2, green: 0.6, blue: 0.9, alpha: 0.85))
                actionButtons.updateAbilityIcon(index: 1, text: "AD", color: SKColor(red: 0.3, green: 0.7, blue: 0.8, alpha: 0.85))
                actionButtons.updateAbilityIcon(index: 2, text: "LS", color: SKColor(red: 0.1, green: 0.5, blue: 0.7, alpha: 0.85))
                actionButtons.updateAbilityIcon(index: 3, text: "SH", color: SKColor(red: 0.4, green: 0.8, blue: 1.0, alpha: 0.85))
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
            actionButtons.updateAbilityIcon(index: 0, text: "FO", color: SKColor(red: 0.9, green: 0.8, blue: 0.5, alpha: 0.85))
            actionButtons.updateAbilityIcon(index: 1, text: "BO", color: SKColor(red: 0.8, green: 0.7, blue: 0.4, alpha: 0.85))
            actionButtons.updateAbilityIcon(index: 2, text: "NU", color: SKColor(red: 0.7, green: 0.6, blue: 0.3, alpha: 0.85))
            actionButtons.updateAbilityIcon(index: 3, text: "PL", color: SKColor(red: 0.6, green: 0.5, blue: 0.2, alpha: 0.85))

        case .nightmarePainter:
            actionButtons.updateAbilityIcon(index: 0, text: "PE", color: SKColor(red: 0.3, green: 0.1, blue: 0.4, alpha: 0.85))
            actionButtons.updateAbilityIcon(index: 1, text: "EM", color: SKColor(red: 0.4, green: 0.1, blue: 0.5, alpha: 0.85))
            actionButtons.updateAbilityIcon(index: 2, text: "OM", color: SKColor(red: 0.2, green: 0.0, blue: 0.3, alpha: 0.85))
            actionButtons.updateAbilityIcon(index: 3, text: "HI", color: SKColor(red: 0.5, green: 0.3, blue: 0.6, alpha: 0.85))
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
        for spawn in zone.enemySpawns {
            guard let enemyData = GameManager.shared.allEnemies[spawn.enemyID] else { continue }
            let spriteName = "enemy_\(spawn.enemyID)_\(spawn.position.col)_\(spawn.position.row)"
            let instance = EnemyAISystem.EnemyInstance(
                enemyData: enemyData,
                spawnData: spawn,
                currentHP: enemyData.maxHP,
                position: isoPosition(col: spawn.position.col, row: spawn.position.row),
                gridPosition: spawn.position,
                state: .idle,
                sprite: enemyNodes[spriteName] as? SKSpriteNode,
                lastAttackTime: 0,
                respawnTimer: nil,
                abilityCooldowns: Array(repeating: 0, count: enemyData.abilities.count),
                aggroTarget: nil
            )
            enemyInstances.append(instance)
        }
    }

    private func setupEnemyAICallbacks() {
        enemyAI.onPlayerHit = { [weak self] enemyPosition in
            guard let self else { return }
            self.lastDamageTakenTime = self.lastUpdateTime
            self.showDamageIndicator(fromEnemy: enemyPosition)
        }

        companionSystem.onEnemyHit = { [weak self] enemyID, damage, position in
            guard let self else { return }
            for i in 0..<self.enemyInstances.count {
                guard self.enemyInstances[i].isAlive,
                      self.enemyInstances[i].enemyData.id == enemyID else { continue }
                let dist = hypot(self.enemyInstances[i].position.x - position.x,
                                 self.enemyInstances[i].position.y - position.y)
                if dist < 60 {
                    self.applyDamageToEnemy(index: i, damage: damage, effectColor: .green,
                                            statusEffect: nil, statusDuration: 0)
                    break
                }
            }
        }
    }

    private func setupPathfinding() {
        var obstacles = Set<GridPosition>()
        for enemy in zone.enemySpawns { obstacles.insert(enemy.position) }
        for npc in zone.npcSpawns { obstacles.insert(npc.position) }
        pathfinding.setupGrid(width: zone.gridWidth, height: zone.gridHeight, obstacles: obstacles)
    }

    // MARK: - Joystick Movement

    private func handleJoystickInput(direction: CGVector, magnitude: CGFloat) {
        guard magnitude > 0.1, let playerNode else { return }
        PlayerRenderer.startWalkAnimation(on: playerNode)
    }

    private func movePlayerContinuous(deltaTime: TimeInterval) {
        guard joystick.isActive, joystick.magnitude > 0, let playerNode, !isTransitioning else { return }

        let dir = joystick.direction
        let speed = playerSpeed * joystick.magnitude * CGFloat(deltaTime)
        let isoX = dir.dx * speed
        let isoY = dir.dy * speed

        let newPos = CGPoint(x: playerNode.position.x + isoX, y: playerNode.position.y + isoY)

        let gridPos = gridFromIso(newPos)
        guard gridPos.col >= 0, gridPos.col < zone.gridWidth,
              gridPos.row >= 0, gridPos.row < zone.gridHeight else { return }

        playerNode.position = newPos
        GameManager.shared.champion?.gridPosition = gridPos

        centerCamera(on: newPos, animated: true)
        updateContextualButton(at: gridPos)
        checkZoneConnections(at: gridPos)
    }

    // MARK: - Context-Sensitive Button

    private func updateContextualButton(at position: GridPosition) {
        for npc in zone.npcSpawns {
            let dist = abs(npc.position.col - position.col) + abs(npc.position.row - position.row)
            if dist <= 2 {
                actionButtons.setMode(.talk(npcID: npc.npcID))
                return
            }
        }

        for connection in zone.connections {
            let dist = abs(connection.exitPosition.col - position.col) + abs(connection.exitPosition.row - position.row)
            if dist <= 2 {
                actionButtons.setMode(.enter(zoneID: connection.targetZoneID))
                return
            }
        }

        for loot in zone.lootPoints {
            let dist = abs(loot.position.col - position.col) + abs(loot.position.row - position.row)
            if dist <= 2 {
                actionButtons.setMode(.loot)
                return
            }
        }

        actionButtons.setMode(.attack)
    }

    // MARK: - Interactions

    private func handleInteraction(mode: ActionButtonsNode.ActionMode) {
        switch mode {
        case .talk(let npcID):
            handleTalkToNPC(npcID: npcID)
        case .enter(let zoneID):
            handleEnterZone(zoneID: zoneID)
        case .loot:
            handleLoot()
        case .attack:
            break
        }
    }

    private func handleTalkToNPC(npcID: String) {
        guard let npc = zone.npcSpawns.first(where: { $0.npcID == npcID }) else { return }

        if npc.isShopkeeper {
            showAbilityEffect(description: "Boutique de \(npcID.replacingOccurrences(of: "_", with: " ").capitalized)")
        } else if npc.dialogueTreeID != nil {
            if dialogueBox == nil {
                dialogueBox = DialogueBoxNode(screenSize: size)
                dialogueBox?.position = CGPoint(x: 0, y: -size.height / 2 + 100)
                dialogueBox?.zPosition = 5000
                cameraNode.addChild(dialogueBox!)
            }
            dialogueBox?.showDialogue(
                speakerName: npcID.replacingOccurrences(of: "_", with: " ").capitalized,
                text: "Salutations, voyageur. Que puis-je faire pour vous ?",
                portrait: nil,
                emotion: .neutral
            )
            dialogueBox?.onContinue = { [weak self] in
                self?.dialogueBox?.hide()
            }
        }
    }

    private func handleEnterZone(zoneID: String) {
        guard !isTransitioning else { return }
        guard let connection = zone.connections.first(where: { $0.targetZoneID == zoneID }) else { return }

        if let requiredQuest = connection.requiredQuestID {
            let completed = GameManager.shared.champion?.completedQuestIDs.contains(requiredQuest) ?? false
            if !completed {
                showAbilityEffect(description: "Quete requise pour entrer")
                return
            }
        }

        isTransitioning = true
        _ = SaveManager.shared.save()

        guard let view = self.view else {
            isTransitioning = false
            return
        }

        SceneRouter(view: view).transitionToZone(connection.targetZoneID, entryPoint: connection.entryPointName)
    }

    private func handleLoot() {
        guard let champion = GameManager.shared.champion else { return }
        let gridPos = champion.gridPosition

        for loot in zone.lootPoints {
            let dist = abs(loot.position.col - gridPos.col) + abs(loot.position.row - gridPos.row)
            if dist <= 2 {
                showAbilityEffect(description: "Butin recupere !")
                break
            }
        }
    }

    // MARK: - Attack

    private func handleAttack() {
        guard let champion = GameManager.shared.champion, let playerNode else { return }
        guard !actionButtons.isAttackOnCooldown else { return }

        let attackRange: CGFloat = 60
        var closestEnemy: (name: String, node: SKNode, distance: CGFloat)?

        for (name, node) in enemyNodes {
            let dist = hypot(node.position.x - playerNode.position.x, node.position.y - playerNode.position.y)
            if dist <= attackRange {
                if closestEnemy == nil || dist < closestEnemy!.distance {
                    closestEnemy = (name, node, dist)
                }
            }
        }

        PlayerRenderer.playAttackAnimation(on: playerNode, in: worldNode)
        actionButtons.startAttackCooldown(duration: 0.5)

        if let target = closestEnemy {
            EntityRenderer.playHitEffect(on: target.node)

            if let idx = enemyInstances.firstIndex(where: {
                "enemy_\($0.spawnData.enemyID)_\($0.spawnData.position.col)_\($0.spawnData.position.row)" == target.name
            }) {
                // Use CombatSystem for proper damage + crit calculation
                let damageResult = GameManager.shared.combatSystem.calculateDamage(
                    attacker: champion.baseStats,
                    skill: nil,
                    defender: enemyInstances[idx].enemyData
                )
                let damage = damageResult.mitigatedDamage

                // Critical hits: gold color, bigger text, "!" suffix
                if damageResult.isCritical {
                    showFloatingDamage(damage, at: target.node.position,
                                       color: SKColor(red: 1, green: 0.85, blue: 0.2, alpha: 1), isCritical: true)
                } else {
                    showFloatingDamage(damage, at: target.node.position)
                }

                enemyInstances[idx].currentHP -= damage
                let ratio = CGFloat(enemyInstances[idx].currentHP) / CGFloat(enemyInstances[idx].enemyData.maxHP)
                EntityRenderer.updateEnemyHP(node: target.node, ratio: ratio)

                // Aggro nearby enemies (group aggro)
                alertNearbyEnemies(aroundIndex: idx)

                if enemyInstances[idx].currentHP <= 0 {
                    let xp = enemyInstances[idx].enemyData.xpReward
                    let gold = Int.random(in: enemyInstances[idx].enemyData.goldReward)
                    GameManager.shared.grantXP(xp)
                    GameManager.shared.mutateChampion { $0.gold += gold }

                    // Floating XP label
                    showFloatingDamage(xp, at: CGPoint(x: target.node.position.x, y: target.node.position.y + 20),
                                       color: SKColor(red: 0.5, green: 0.8, blue: 1, alpha: 1))

                    // Floating gold label
                    showFloatingDamage(gold, at: CGPoint(x: target.node.position.x + 15, y: target.node.position.y + 10),
                                       color: SKColor(red: 1, green: 0.85, blue: 0.3, alpha: 1))

                    // Flash the XP bar
                    flashXPBar()

                    EntityRenderer.playDeathAnimation(on: target.node) { [weak self] in
                        self?.enemyNodes.removeValue(forKey: target.name)
                    }
                }
            }

            AudioManager.shared.playSFX("attack_hit", on: self)
        }
    }

    // MARK: - Abilities

    private func handleAbility(index: Int) {
        guard var champion = GameManager.shared.champion, let playerNode else { return }

        switch champion.championClass {
        case .mistborn:
            let metals: [SkillResourceType] = [.steel, .iron, .pewter, .tin]
            let metal = metals[index]
            let result = allomancy.burnMetal(metal, champion: &champion, targetPosition: nil)
            GameManager.shared.champion = champion
            if result.success {
                showAbilityEffect(description: result.effectDescription)
                actionButtons.startCooldown(abilityIndex: index, duration: 3.0)
                let silverBlue = SKColor(red: 0.7, green: 0.8, blue: 1.0, alpha: 1)
                switch metal {
                case .steel:
                    SpellEffectsSystem.steelPush(from: playerNode.position, in: worldNode)
                    applyAbilityDamage(result.damage, range: 120, statusEffect: result.statusEffect,
                                       statusDuration: result.duration, effectColor: silverBlue)
                case .iron:
                    SpellEffectsSystem.ironPull(at: playerNode.position, in: worldNode)
                    applyAbilityDamage(result.damage, range: 80, statusEffect: result.statusEffect,
                                       statusDuration: result.duration, effectColor: silverBlue)
                case .pewter: SpellEffectsSystem.pewterFlare(on: playerNode)
                case .tin:    SpellEffectsSystem.tinEnhance(on: playerNode, in: worldNode)
                default: break
                }
            }

        case .radiant:
            let surges: [SurgebindingSystem.Surge] = [.gravitation, .adhesion, .abrasion, .progression]
            let surge = index < surges.count ? surges[index] : .gravitation
            let result = surgebinding.useSurge(surge, champion: &champion, targetPosition: nil)
            GameManager.shared.champion = champion
            if result.success {
                showAbilityEffect(description: result.description)
                actionButtons.startCooldown(abilityIndex: index, duration: 5.0)
                switch surge {
                case .gravitation:
                    SpellEffectsSystem.gravitationLash(from: playerNode.position, in: worldNode)
                    applyAbilityDamage(result.damage, range: 120, statusEffect: result.statusEffect,
                                       statusDuration: result.duration, effectColor: .cyan)
                case .adhesion:
                    SpellEffectsSystem.adhesionField(at: playerNode.position, in: worldNode)
                    applyAbilityDamage(result.damage, range: 100, statusEffect: result.statusEffect,
                                       statusDuration: result.duration, effectColor: .cyan, isAoE: true)
                case .progression: SpellEffectsSystem.progressionHeal(on: playerNode, in: worldNode)
                default:
                    SpellEffectsSystem.spawnAOE(at: playerNode.position, color: .cyan, radius: 40, in: worldNode)
                    applyAbilityDamage(result.damage, range: 100, statusEffect: result.statusEffect,
                                       statusDuration: result.duration, effectColor: .cyan, isAoE: true)
                }
                if result.healing > 0 { showHealEffect(amount: result.healing) }
            }

        case .awakener:
            let commands: [AwakeningSystem.AwakeningCommand] = [.animateCloth, .animateWeapon, .chromaAura, .lifeleecher]
            let command = index < commands.count ? commands[index] : .animateCloth
            let result = awakening.useCommand(command, champion: &champion, targetPosition: nil)
            GameManager.shared.champion = champion
            if result.success {
                showAbilityEffect(description: result.description)
                actionButtons.startCooldown(abilityIndex: index, duration: 4.0)
                SpellEffectsSystem.awakeningAnimate(at: playerNode.position, in: worldNode)
                if result.healing > 0 { showHealEffect(amount: result.healing) }
                applyAbilityDamage(result.damage, range: 100, statusEffect: result.statusEffect,
                                   statusDuration: result.duration, effectColor: .magenta)
            }

        case .elantrian:
            let aons: [AonDorSystem.Aon] = [.rao, .ashe, .tia, .ien]
            let aon = index < aons.count ? aons[index] : .rao
            let result = aonDor.drawAon(aon, champion: &champion, targetPosition: nil)
            GameManager.shared.champion = champion
            if result.success {
                showAbilityEffect(description: result.description)
                actionButtons.startCooldown(abilityIndex: index, duration: 4.5)
                SpellEffectsSystem.drawAon(at: playerNode.position, color: result.glyphColor, in: worldNode)
                if result.healing > 0 { showHealEffect(amount: result.healing) }
                applyAbilityDamage(result.damage, range: 110, statusEffect: result.statusEffect,
                                   statusDuration: result.duration, effectColor: result.glyphColor)
            }

        case .sandMaster:
            let forms: [SandMasterySystem.SandForm] = [.lash, .shield, .swarm, .platform]
            let form = index < forms.count ? forms[index] : .lash
            let result = sandMastery.useSandForm(form, champion: &champion, targetPosition: nil)
            GameManager.shared.champion = champion
            if result.success {
                showAbilityEffect(description: result.description)
                actionButtons.startCooldown(abilityIndex: index, duration: 3.5)
                let sandColor = SKColor(red: 0.9, green: 0.8, blue: 0.5, alpha: 1)
                switch form {
                case .lash:
                    SpellEffectsSystem.sandWhip(from: playerNode.position, toward: 0, in: worldNode)
                    applyAbilityDamage(result.damage, range: 120, statusEffect: result.statusEffect,
                                       statusDuration: result.duration, effectColor: sandColor)
                case .shield: SpellEffectsSystem.sandShield(on: playerNode)
                case .swarm:
                    SpellEffectsSystem.spawnAOE(at: playerNode.position, color: sandColor, radius: 35, in: worldNode)
                    applyAbilityDamage(result.damage, range: 100, statusEffect: result.statusEffect,
                                       statusDuration: result.duration, effectColor: sandColor, isAoE: true)
                default:
                    SpellEffectsSystem.spawnAOE(at: playerNode.position, color: sandColor, radius: 35, in: worldNode)
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
                let darkPurple = SKColor(red: 0.3, green: 0.1, blue: 0.4, alpha: 1)
                switch technique {
                case .ink_slash:
                    SpellEffectsSystem.inkSlash(from: playerNode.position, in: worldNode)
                    applyAbilityDamage(result.damage, range: 110, statusEffect: result.statusEffect,
                                       statusDuration: result.duration, effectColor: darkPurple)
                case .capture:
                    SpellEffectsSystem.nightmareCapture(at: playerNode.position, in: worldNode)
                    applyAbilityDamage(result.damage, range: 90, statusEffect: result.statusEffect,
                                       statusDuration: result.duration, effectColor: darkPurple)
                case .banish:
                    SpellEffectsSystem.spawnAOE(at: playerNode.position, color: darkPurple, radius: 30, in: worldNode)
                    applyAbilityDamage(result.damage, range: 100, statusEffect: result.statusEffect,
                                       statusDuration: result.duration, effectColor: darkPurple, isAoE: true)
                default:
                    SpellEffectsSystem.spawnAOE(at: playerNode.position, color: darkPurple, radius: 30, in: worldNode)
                }
                if result.healing > 0 { showHealEffect(amount: result.healing) }
            }
        }
    }

    private func handleUltimate() {
        guard let champion = GameManager.shared.champion, let playerNode else { return }

        // Spectacular ultimate effects
        let ultimateFlash = SKShapeNode(circleOfRadius: 150)
        ultimateFlash.fillColor = SKColor(red: 1, green: 0.85, blue: 0.2, alpha: 0.1)
        ultimateFlash.strokeColor = SKColor(red: 1.0, green: 0.85, blue: 0.2, alpha: 1.0)
        ultimateFlash.lineWidth = 4
        ultimateFlash.position = playerNode.position
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

        let innerRing = SKShapeNode(circleOfRadius: 80)
        innerRing.fillColor = .clear
        innerRing.strokeColor = SKColor(red: 1, green: 0.9, blue: 0.5, alpha: 0.8)
        innerRing.lineWidth = 2
        innerRing.position = playerNode.position
        innerRing.zPosition = 401
        innerRing.setScale(0.1)
        worldNode.addChild(innerRing)

        innerRing.run(SKAction.sequence([
            SKAction.group([
                SKAction.scale(to: 1.2, duration: 0.35),
                SKAction.fadeOut(withDuration: 0.4)
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
        case .mistborn:         ultText = "BRUME ETERNELLE !"
        case .radiant:          ultText = "SERMENT RADIEUX !"
        case .awakener:         ultText = "EVEIL SUPREME !"
        case .elantrian:        ultText = "AON ULTIME !"
        case .sandMaster:       ultText = "TEMPETE DE SABLE !"
        case .nightmarePainter: ultText = "PEINTURE CAUCHEMAR !"
        }

        showAbilityEffect(description: ultText)
    }

    // MARK: - Damage Label Pool

    private func obtainDamageLabel() -> SKLabelNode {
        if let recycled = damageNodePool.popLast() {
            recycled.alpha = 1.0
            recycled.setScale(1.0)
            recycled.removeAllActions()
            return recycled
        }
        let label = SKLabelNode(fontNamed: "Copperplate-Bold")
        label.fontSize = 14
        label.zPosition = 500
        return label
    }

    private func showFloatingDamage(_ damage: Int, at position: CGPoint, color: SKColor = .white, isCritical: Bool = false) {
        let label = obtainDamageLabel()
        label.text = isCritical ? "\(damage)!" : "\(damage)"
        label.fontColor = color
        label.fontSize = isCritical ? 20 : 14
        label.position = position
        worldNode.addChild(label)

        let floatDuration: TimeInterval = isCritical ? 0.8 : 0.6
        let floatHeight: CGFloat = isCritical ? 55 : 40
        let scaleTarget: CGFloat = isCritical ? 1.6 : 1.3

        label.run(SKAction.sequence([
            SKAction.group([
                SKAction.moveBy(x: CGFloat.random(in: -15...15), y: floatHeight, duration: floatDuration),
                SKAction.fadeOut(withDuration: floatDuration - 0.1),
                SKAction.scale(to: scaleTarget, duration: 0.2)
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
        guard let playerNode else { return }
        let healLabel = SKLabelNode(fontNamed: "Copperplate-Bold")
        healLabel.text = "+\(amount)"
        healLabel.fontSize = 18
        healLabel.fontColor = .green
        healLabel.position = playerNode.position
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

    // MARK: - Ability Damage to Enemies

    /// Finds the closest enemy in range and applies ability damage + status effects
    private func applyAbilityDamage(_ damage: Int, range: CGFloat = 100, statusEffect: StatusEffectType? = nil,
                                     statusDuration: TimeInterval = 0, effectColor: SKColor = .white, isAoE: Bool = false) {
        guard damage > 0, let playerNode else { return }

        if isAoE {
            // AoE: hit all enemies in range
            for i in 0..<enemyInstances.count {
                guard enemyInstances[i].isAlive else { continue }
                let dist = hypot(enemyInstances[i].position.x - playerNode.position.x,
                                 enemyInstances[i].position.y - playerNode.position.y)
                if dist <= range {
                    applyDamageToEnemy(index: i, damage: damage, effectColor: effectColor,
                                       statusEffect: statusEffect, statusDuration: statusDuration)
                }
            }
        } else {
            // Single target: closest enemy
            var closestIdx: Int?
            var closestDist: CGFloat = .greatestFiniteMagnitude

            for i in 0..<enemyInstances.count {
                guard enemyInstances[i].isAlive else { continue }
                let dist = hypot(enemyInstances[i].position.x - playerNode.position.x,
                                 enemyInstances[i].position.y - playerNode.position.y)
                if dist <= range && dist < closestDist {
                    closestDist = dist
                    closestIdx = i
                }
            }

            if let idx = closestIdx {
                applyDamageToEnemy(index: idx, damage: damage, effectColor: effectColor,
                                   statusEffect: statusEffect, statusDuration: statusDuration)
            }
        }
    }

    private func applyDamageToEnemy(index idx: Int, damage: Int, effectColor: SKColor,
                                     statusEffect: StatusEffectType?, statusDuration: TimeInterval) {
        let spriteName = "enemy_\(enemyInstances[idx].spawnData.enemyID)_\(enemyInstances[idx].spawnData.position.col)_\(enemyInstances[idx].spawnData.position.row)"

        showFloatingDamage(damage, at: enemyInstances[idx].position, color: effectColor)

        enemyInstances[idx].currentHP -= damage
        if let node = enemyNodes[spriteName] {
            EntityRenderer.playHitEffect(on: node)
            let ratio = CGFloat(enemyInstances[idx].currentHP) / CGFloat(enemyInstances[idx].enemyData.maxHP)
            EntityRenderer.updateEnemyHP(node: node, ratio: ratio)
        }

        // Apply status effect (stun)
        if statusEffect == .stunned, statusDuration > 0 {
            enemyAI.stun(enemy: &enemyInstances[idx], duration: statusDuration)
        }

        alertNearbyEnemies(aroundIndex: idx)

        if enemyInstances[idx].currentHP <= 0 {
            let xp = enemyInstances[idx].enemyData.xpReward
            let gold = Int.random(in: enemyInstances[idx].enemyData.goldReward)
            GameManager.shared.grantXP(xp)
            GameManager.shared.mutateChampion { $0.gold += gold }

            showFloatingDamage(xp, at: CGPoint(x: enemyInstances[idx].position.x, y: enemyInstances[idx].position.y + 20),
                               color: SKColor(red: 0.5, green: 0.8, blue: 1, alpha: 1))
            showFloatingDamage(gold, at: CGPoint(x: enemyInstances[idx].position.x + 15, y: enemyInstances[idx].position.y + 10),
                               color: SKColor(red: 1, green: 0.85, blue: 0.3, alpha: 1))
            flashXPBar()

            if let node = enemyNodes[spriteName] {
                EntityRenderer.playDeathAnimation(on: node) { [weak self] in
                    self?.enemyNodes.removeValue(forKey: spriteName)
                }
            }
        }
    }

    // MARK: - Group Aggro

    private func alertNearbyEnemies(aroundIndex idx: Int) {
        let aggroRadius: CGFloat = 100
        let attackedPos = enemyInstances[idx].position

        for i in 0..<enemyInstances.count where i != idx {
            guard enemyInstances[i].isAlive else { continue }
            switch enemyInstances[i].state {
            case .idle, .patrolling:
                let dist = hypot(enemyInstances[i].position.x - attackedPos.x,
                                 enemyInstances[i].position.y - attackedPos.y)
                if dist <= aggroRadius {
                    enemyInstances[i].state = .chasing(target: attackedPos)
                }
            default:
                break
            }
        }
    }

    // MARK: - XP Bar Flash

    private func flashXPBar() {
        guard let xpBg = cameraNode.childNode(withName: "//xpBarBg") as? SKShapeNode else {
            // Find by position fallback — flash all XP-related elements
            cameraNode.enumerateChildNodes(withName: "//*") { node, _ in
                if let label = node as? SKLabelNode, label.text?.hasPrefix("XP") == true {
                    label.run(SKAction.sequence([
                        SKAction.colorize(with: .white, colorBlendFactor: 1, duration: 0.1),
                        SKAction.wait(forDuration: 0.15),
                        SKAction.colorize(withColorBlendFactor: 0, duration: 0.3)
                    ]))
                }
            }
            return
        }
        xpBg.run(SKAction.sequence([
            SKAction.customAction(withDuration: 0.1) { node, _ in
                (node as? SKShapeNode)?.strokeColor = .white
            },
            SKAction.wait(forDuration: 0.15),
            SKAction.customAction(withDuration: 0.3) { node, _ in
                (node as? SKShapeNode)?.strokeColor = SKColor(red: 0.6, green: 0.5, blue: 0.2, alpha: 0.4)
            }
        ]))
    }

    // MARK: - Damage Direction Indicator

    private func showDamageIndicator(fromEnemy enemyPosition: CGPoint) {
        guard let playerNode else { return }

        let angle = atan2(enemyPosition.y - playerNode.position.y,
                          enemyPosition.x - playerNode.position.x)

        // Place indicator on screen edge in the direction of the enemy
        let edgeDistance: CGFloat = min(size.width, size.height) / 2 - 30
        let indicatorX = cos(angle) * edgeDistance
        let indicatorY = sin(angle) * edgeDistance

        let indicator = SKShapeNode()
        let path = CGMutablePath()
        path.move(to: CGPoint(x: 0, y: 8))
        path.addLine(to: CGPoint(x: -6, y: -4))
        path.addLine(to: CGPoint(x: 6, y: -4))
        path.closeSubpath()
        indicator.path = path
        indicator.fillColor = SKColor(red: 1, green: 0.2, blue: 0.2, alpha: 0.8)
        indicator.strokeColor = .clear
        indicator.position = CGPoint(x: indicatorX, y: indicatorY)
        indicator.zRotation = angle - .pi / 2
        indicator.zPosition = 3500
        indicator.setScale(1.5)
        cameraNode.addChild(indicator)

        indicator.run(SKAction.sequence([
            SKAction.wait(forDuration: 0.1),
            SKAction.fadeOut(withDuration: 0.4),
            SKAction.removeFromParent()
        ]))
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

    // MARK: - Zone Transitions (crash-safe)

    private func checkZoneConnections(at position: GridPosition) {
        guard !isTransitioning else { return }

        for connection in zone.connections {
            if connection.exitPosition == position {
                if let requiredQuest = connection.requiredQuestID {
                    let completed = GameManager.shared.champion?.completedQuestIDs.contains(requiredQuest) ?? false
                    if !completed {
                        showAbilityEffect(description: "Quete requise pour continuer")
                        return
                    }
                }

                isTransitioning = true
                _ = SaveManager.shared.save()

                guard let view = self.view else {
                    isTransitioning = false
                    return
                }

                SceneRouter(view: view).transitionToZone(
                    connection.targetZoneID,
                    entryPoint: connection.entryPointName
                )
                return
            }
        }
    }

    // MARK: - Pause Menu

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let touch = touches.first else { return }
        let location = touch.location(in: cameraNode)
        let tapped = cameraNode.nodes(at: location)

        for node in tapped {
            if node.name == "pauseButton" {
                togglePause()
                return
            }
        }
    }

    private func togglePause() {
        if let existing = pauseMenu {
            existing.removeFromParent()
            pauseMenu = nil
            isPaused = false
            return
        }

        isPaused = true
        let menu = PauseMenuNode(screenSize: size)
        menu.onResume = { [weak self] in
            self?.togglePause()
        }
        menu.onQuit = { [weak self] in
            guard let self, let view = self.view else { return }
            _ = SaveManager.shared.save()
            SceneRouter(view: view).showMainMenu()
        }
        cameraNode.addChild(menu)
        pauseMenu = menu
    }

    // MARK: - Update Loop

    override func update(_ currentTime: TimeInterval) {
        let deltaTime = lastUpdateTime == 0 ? 0 : currentTime - lastUpdateTime
        lastUpdateTime = currentTime
        guard deltaTime < 0.5, !isTransitioning else { return }

        movePlayerContinuous(deltaTime: deltaTime)

        let playerPos = playerNode?.position ?? .zero
        for i in 0..<enemyInstances.count {
            enemyAI.update(enemy: &enemyInstances[i], playerPosition: playerPos, deltaTime: deltaTime)
            if i < enemyInstances.count {
                minimap.updateEnemyPosition(index: i, gridPos: enemyInstances[i].gridPosition,
                                             isAlive: enemyInstances[i].isAlive)
            }
        }

        if let champion = GameManager.shared.champion {
            minimap.updatePlayerPosition(champion.gridPosition)
        }

        let enemies = enemyInstances.filter { $0.isAlive }.map { (position: $0.position, id: $0.enemyData.id) }
        companionSystem.update(deltaTime: deltaTime, playerPosition: playerPos, enemies: enemies)

        // --- Gameplay improvements ---
        actionButtons.update(deltaTime: deltaTime)
        updateRegeneration(currentTime: currentTime, deltaTime: deltaTime)
        updateLowHPVignette()
        updateHUDBars()
    }

    // MARK: - Passive Regeneration (HP + Investiture)

    private func updateRegeneration(currentTime: TimeInterval, deltaTime: TimeInterval) {
        GameManager.shared.mutateChampion { champ in
            // Investiture regen: 2.0 per second, always active
            let investitureRegen = 2.0 * deltaTime
            champ.currentInvestiture = min(champ.maxInvestiture,
                                           champ.currentInvestiture + Int(investitureRegen))

            // HP regen: 1% maxHP/sec, only out of combat (5s since last hit)
            if currentTime - self.lastDamageTakenTime > self.hpRegenDelay {
                let hpRegen = Double(champ.maxHP) * self.hpRegenPercent * deltaTime
                if champ.currentHP < champ.maxHP {
                    champ.currentHP = min(champ.maxHP, champ.currentHP + max(1, Int(hpRegen)))
                }
            }
        }
    }

    // MARK: - Low HP Vignette

    private func updateLowHPVignette() {
        guard let champion = GameManager.shared.champion, let vignette = lowHPVignette else { return }

        let hpPercent = Double(champion.currentHP) / Double(champion.maxHP)
        if hpPercent < 0.25 {
            if vignette.action(forKey: "lowHPPulse") == nil {
                let pulse = SKAction.repeatForever(SKAction.sequence([
                    SKAction.fadeAlpha(to: 0.25, duration: 0.5),
                    SKAction.fadeAlpha(to: 0.1, duration: 0.5)
                ]))
                vignette.run(pulse, withKey: "lowHPPulse")
            }
        } else {
            vignette.removeAction(forKey: "lowHPPulse")
            vignette.alpha = 0
        }
    }

    // MARK: - HUD Bars Update

    private func updateHUDBars() {
        guard let champion = GameManager.shared.champion else { return }

        // Update HP bar fill
        if let hpFill = cameraNode.childNode(withName: "//hpFill") as? SKShapeNode {
            let hpRatio = CGFloat(champion.currentHP) / CGFloat(champion.maxHP)
            hpFill.xScale = max(0, hpRatio)
        }
        if let hpLabel = cameraNode.childNode(withName: "//hpLabel") as? SKLabelNode {
            hpLabel.text = "\(champion.currentHP)/\(champion.maxHP)"
        }

        // Update gold
        if let goldLabel = cameraNode.childNode(withName: "//goldLabel") as? SKLabelNode {
            goldLabel.text = "\(champion.gold) or"
        }

        // Update level
        if let levelLabel = cameraNode.childNode(withName: "//levelLabel") as? SKLabelNode {
            levelLabel.text = "\(champion.level)"
        }
    }
}
