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
    private var inventoryNode: InventoryNode?
    private var statsMenu: StatsMenuNode?

    // Enemy instances (runtime)
    private var enemyInstances: [EnemyAISystem.EnemyInstance] = []

    // Movement
    private var lastUpdateTime: TimeInterval = 0
    private let playerSpeed = GameConstants.Player.speed
    private let tileSize = GameConstants.Tiles.size

    // Damage label pooling
    private var damageNodePool: [SKLabelNode] = []
    private let maxPoolSize = GameConstants.Combat.damagePoolSize

    // Zone transition safety
    private var isTransitioning = false

    // Regen
    private var regenAccumulator: TimeInterval = 0
    private let regenInterval = GameConstants.Regen.interval
    private let hpRegenBase = GameConstants.Regen.hpPerSecond
    private let investitureRegenBase = GameConstants.Regen.investiturePerSecond

    // Level up tracking
    private var previousLevel: Int = 1

    // Low HP warning
    private var lowHPOverlay: SKShapeNode?
    private var isShowingLowHPWarning = false

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

        previousLevel = GameManager.shared.champion?.level ?? 1
        setupLowHPOverlay()

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
        hpIcon.fontSize = 9
        hpIcon.fontColor = SKColor(red: 1, green: 0.6, blue: 0.6, alpha: 1)
        hpIcon.position = CGPoint(x: -65, y: -3)
        hpIcon.zPosition = 1
        hpBg.addChild(hpIcon)

        let hpLabel = SKLabelNode(fontNamed: "Helvetica-Bold")
        hpLabel.text = "\(champion.currentHP)/\(champion.maxHP)"
        hpLabel.fontSize = 10
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
        mpBg.name = "mpBarBg"
        mpBg.zPosition = 2000
        cameraNode.addChild(mpBg)

        let mpShine = SKShapeNode(rectOf: CGSize(width: 116, height: 4), cornerRadius: 1)
        mpShine.fillColor = SKColor(white: 1, alpha: 0.12)
        mpShine.strokeColor = .clear
        mpShine.position = CGPoint(x: 0, y: 2)
        mpBg.addChild(mpShine)

        let mpIcon = SKLabelNode(fontNamed: "Helvetica-Bold")
        mpIcon.text = "INV"
        mpIcon.fontSize = 9
        mpIcon.fontColor = SKColor(red: 0.5, green: 0.8, blue: 1, alpha: 1)
        mpIcon.position = CGPoint(x: -65, y: -3)
        mpIcon.zPosition = 1
        mpBg.addChild(mpIcon)

        let mpLabel = SKLabelNode(fontNamed: "Helvetica-Bold")
        mpLabel.text = "\(champion.currentInvestiture)/\(champion.maxInvestiture)"
        mpLabel.fontSize = 10
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
        let xpBg = SKShapeNode(rectOf: CGSize(width: 120, height: 10), cornerRadius: 2)
        xpBg.fillColor = SKColor(white: 0.1, alpha: 0.8)
        xpBg.strokeColor = SKColor(red: 0.6, green: 0.5, blue: 0.2, alpha: 0.4)
        xpBg.lineWidth = 0.5
        xpBg.position = CGPoint(x: -size.width / 2 + 80, y: size.height / 2 - 66)
        xpBg.zPosition = 2000
        cameraNode.addChild(xpBg)

        let xpLabel = SKLabelNode(fontNamed: "Helvetica")
        xpLabel.text = "XP \(champion.currentXP)/\(champion.xpForNextLevel)"
        xpLabel.fontSize = 9
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

    private func updateHUD(champion: Champion) {
        // Update HP bar fill
        if let hpBg = cameraNode.childNode(withName: "hpBarBg"),
           let hpFill = hpBg.childNode(withName: "hpFill") as? SKShapeNode {
            let hpRatio = CGFloat(champion.currentHP) / CGFloat(champion.maxHP)
            let fillWidth = 116 * max(0, min(hpRatio, 1))
            let rect = CGRect(x: -fillWidth / 2, y: -4, width: fillWidth, height: 8)
            hpFill.path = CGPath(roundedRect: rect, cornerWidth: 2, cornerHeight: 2, transform: nil)
        }

        // Update HP label
        if let hpBg = cameraNode.childNode(withName: "hpBarBg"),
           let hpLabel = hpBg.childNode(withName: "hpLabel") as? SKLabelNode {
            hpLabel.text = "\(champion.currentHP)/\(champion.maxHP)"
        }

        // Update gold label
        if let goldLabel = cameraNode.childNode(withName: "goldLabel") as? SKLabelNode {
            goldLabel.text = "\(champion.gold) or"
        }

        // Update level label
        if let levelLabel = cameraNode.childNode(withName: "levelLabel") as? SKLabelNode {
            levelLabel.text = "\(champion.level)"
        }
    }

    private func setupPauseButton() {
        let pauseBtn = SKShapeNode(rectOf: CGSize(width: 44, height: 44), cornerRadius: 8)
        pauseBtn.fillColor = SKColor(white: 0.1, alpha: 0.6)
        pauseBtn.strokeColor = SKColor(white: 0.4, alpha: 0.5)
        pauseBtn.lineWidth = 1
        pauseBtn.position = CGPoint(x: size.width / 2 - 30, y: size.height / 2 - 55)
        pauseBtn.zPosition = 2000
        pauseBtn.name = "pauseButton"
        cameraNode.addChild(pauseBtn)

        let pauseIcon = SKLabelNode(fontNamed: "Helvetica-Bold")
        pauseIcon.text = "||"
        pauseIcon.fontSize = 16
        pauseIcon.fontColor = .white
        pauseIcon.verticalAlignmentMode = .center
        pauseIcon.name = "pauseButton"
        pauseBtn.addChild(pauseIcon)

        // Inventory button
        let invBtn = SKShapeNode(rectOf: CGSize(width: 44, height: 44), cornerRadius: 8)
        invBtn.fillColor = SKColor(white: 0.1, alpha: 0.6)
        invBtn.strokeColor = SKColor(red: 0.5, green: 0.4, blue: 0.2, alpha: 0.5)
        invBtn.lineWidth = 1
        invBtn.position = CGPoint(x: size.width / 2 - 80, y: size.height / 2 - 55)
        invBtn.zPosition = 2000
        invBtn.name = "inventoryButton"
        cameraNode.addChild(invBtn)

        let invIcon = SKLabelNode(fontNamed: "Copperplate-Bold")
        invIcon.text = "INV"
        invIcon.fontSize = 11
        invIcon.fontColor = SKColor(red: 0.9, green: 0.8, blue: 0.4, alpha: 1)
        invIcon.verticalAlignmentMode = .center
        invIcon.name = "inventoryButton"
        invBtn.addChild(invIcon)
    }

    // MARK: - Controls Setup

    private func setupControls() {
        joystick = VirtualJoystickNode()
        joystick.position = CGPoint(x: -size.width / 2 + 170, y: -size.height / 2 + 110)
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
        actionButtons.position = CGPoint(x: size.width / 2 - 140, y: -size.height / 2 + 110)
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
            actionButtons.setAbilityName(index: 0, name: "Acier")
            actionButtons.setAbilityName(index: 1, name: "Fer")
            actionButtons.setAbilityName(index: 2, name: "Pewter")
            actionButtons.setAbilityName(index: 3, name: "Étain")

        case .radiant:
            let order = champion.radiantOrder ?? .windrunner
            switch order {
            case .windrunner:
                actionButtons.updateAbilityIcon(index: 0, text: "GR", color: SKColor(red: 0.2, green: 0.6, blue: 0.9, alpha: 0.85))
                actionButtons.updateAbilityIcon(index: 1, text: "AD", color: SKColor(red: 0.3, green: 0.7, blue: 0.8, alpha: 0.85))
                actionButtons.updateAbilityIcon(index: 2, text: "LS", color: SKColor(red: 0.1, green: 0.5, blue: 0.7, alpha: 0.85))
                actionButtons.updateAbilityIcon(index: 3, text: "SH", color: SKColor(red: 0.4, green: 0.8, blue: 1.0, alpha: 0.85))
                actionButtons.setAbilityName(index: 0, name: "Gravit")
                actionButtons.setAbilityName(index: 1, name: "Adhés.")
                actionButtons.setAbilityName(index: 2, name: "Lash")
                actionButtons.setAbilityName(index: 3, name: "Bouclr")
            case .edgedancer:
                actionButtons.updateAbilityIcon(index: 0, text: "AB", color: SKColor(red: 0.2, green: 0.8, blue: 0.4, alpha: 0.85))
                actionButtons.updateAbilityIcon(index: 1, text: "PR", color: SKColor(red: 0.3, green: 0.9, blue: 0.5, alpha: 0.85))
                actionButtons.updateAbilityIcon(index: 2, text: "SL", color: SKColor(red: 0.1, green: 0.7, blue: 0.3, alpha: 0.85))
                actionButtons.updateAbilityIcon(index: 3, text: "HL", color: SKColor(red: 0.4, green: 1.0, blue: 0.6, alpha: 0.85))
                actionButtons.setAbilityName(index: 0, name: "Absorb")
                actionButtons.setAbilityName(index: 1, name: "Progrn")
                actionButtons.setAbilityName(index: 2, name: "Glisse")
                actionButtons.setAbilityName(index: 3, name: "Soin")
            case .lightweaver:
                actionButtons.updateAbilityIcon(index: 0, text: "IL", color: SKColor(red: 0.8, green: 0.6, blue: 0.9, alpha: 0.85))
                actionButtons.updateAbilityIcon(index: 1, text: "TR", color: SKColor(red: 0.7, green: 0.5, blue: 0.8, alpha: 0.85))
                actionButtons.updateAbilityIcon(index: 2, text: "LR", color: SKColor(red: 0.9, green: 0.7, blue: 1.0, alpha: 0.85))
                actionButtons.updateAbilityIcon(index: 3, text: "MM", color: SKColor(red: 0.6, green: 0.4, blue: 0.7, alpha: 0.85))
                actionButtons.setAbilityName(index: 0, name: "Illus.")
                actionButtons.setAbilityName(index: 1, name: "Transf")
                actionButtons.setAbilityName(index: 2, name: "Leurre")
                actionButtons.setAbilityName(index: 3, name: "Miroir")
            case .bondsmith:
                actionButtons.updateAbilityIcon(index: 0, text: "TN", color: SKColor(red: 0.9, green: 0.8, blue: 0.3, alpha: 0.85))
                actionButtons.updateAbilityIcon(index: 1, text: "AD", color: SKColor(red: 0.8, green: 0.7, blue: 0.2, alpha: 0.85))
                actionButtons.updateAbilityIcon(index: 2, text: "UN", color: SKColor(red: 1.0, green: 0.9, blue: 0.4, alpha: 0.85))
                actionButtons.updateAbilityIcon(index: 3, text: "BN", color: SKColor(red: 0.7, green: 0.6, blue: 0.1, alpha: 0.85))
                actionButtons.setAbilityName(index: 0, name: "Tension")
                actionButtons.setAbilityName(index: 1, name: "Adhés.")
                actionButtons.setAbilityName(index: 2, name: "Union")
                actionButtons.setAbilityName(index: 3, name: "Lien")
            }

        case .awakener:
            actionButtons.updateAbilityIcon(index: 0, text: "AW", color: SKColor(red: 0.8, green: 0.3, blue: 0.6, alpha: 0.85))
            actionButtons.updateAbilityIcon(index: 1, text: "AN", color: SKColor(red: 0.7, green: 0.2, blue: 0.5, alpha: 0.85))
            actionButtons.updateAbilityIcon(index: 2, text: "AU", color: SKColor(red: 0.9, green: 0.4, blue: 0.7, alpha: 0.85))
            actionButtons.updateAbilityIcon(index: 3, text: "DR", color: SKColor(red: 0.6, green: 0.1, blue: 0.4, alpha: 0.85))
            actionButtons.setAbilityName(index: 0, name: "Éveil")
            actionButtons.setAbilityName(index: 1, name: "Animat")
            actionButtons.setAbilityName(index: 2, name: "Aura")
            actionButtons.setAbilityName(index: 3, name: "Drain")

        case .elantrian:
            actionButtons.updateAbilityIcon(index: 0, text: "Rao", color: SKColor(red: 0.9, green: 0.8, blue: 0.3, alpha: 0.85))
            actionButtons.updateAbilityIcon(index: 1, text: "Ash", color: SKColor(red: 0.8, green: 0.7, blue: 0.2, alpha: 0.85))
            actionButtons.updateAbilityIcon(index: 2, text: "Tia", color: SKColor(red: 1.0, green: 0.9, blue: 0.4, alpha: 0.85))
            actionButtons.updateAbilityIcon(index: 3, text: "Ien", color: SKColor(red: 0.7, green: 0.6, blue: 0.1, alpha: 0.85))
            actionButtons.setAbilityName(index: 0, name: "Aon Rao")
            actionButtons.setAbilityName(index: 1, name: "Aon Ash")
            actionButtons.setAbilityName(index: 2, name: "Aon Tia")
            actionButtons.setAbilityName(index: 3, name: "Aon Ien")

        case .sandMaster:
            actionButtons.updateAbilityIcon(index: 0, text: "FO", color: SKColor(red: 0.9, green: 0.8, blue: 0.5, alpha: 0.85))
            actionButtons.updateAbilityIcon(index: 1, text: "BO", color: SKColor(red: 0.8, green: 0.7, blue: 0.4, alpha: 0.85))
            actionButtons.updateAbilityIcon(index: 2, text: "NU", color: SKColor(red: 0.7, green: 0.6, blue: 0.3, alpha: 0.85))
            actionButtons.updateAbilityIcon(index: 3, text: "PL", color: SKColor(red: 0.6, green: 0.5, blue: 0.2, alpha: 0.85))
            actionButtons.setAbilityName(index: 0, name: "Fouet")
            actionButtons.setAbilityName(index: 1, name: "Bouclr")
            actionButtons.setAbilityName(index: 2, name: "Nuage")
            actionButtons.setAbilityName(index: 3, name: "Pilier")

        case .nightmarePainter:
            actionButtons.updateAbilityIcon(index: 0, text: "PE", color: SKColor(red: 0.3, green: 0.1, blue: 0.4, alpha: 0.85))
            actionButtons.updateAbilityIcon(index: 1, text: "EM", color: SKColor(red: 0.4, green: 0.1, blue: 0.5, alpha: 0.85))
            actionButtons.updateAbilityIcon(index: 2, text: "OM", color: SKColor(red: 0.2, green: 0.0, blue: 0.3, alpha: 0.85))
            actionButtons.updateAbilityIcon(index: 3, text: "HI", color: SKColor(red: 0.5, green: 0.3, blue: 0.6, alpha: 0.85))
            actionButtons.setAbilityName(index: 0, name: "Peint.")
            actionButtons.setAbilityName(index: 1, name: "Empile")
            actionButtons.setAbilityName(index: 2, name: "Ombre")
            actionButtons.setAbilityName(index: 3, name: "Hisame")
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

        if let target = closestEnemy {
            EntityRenderer.playHitEffect(on: target.node)

            let damage = champion.baseStats.strength + 5
            showFloatingDamage(damage, at: target.node.position)

            if let idx = enemyInstances.firstIndex(where: {
                "enemy_\($0.spawnData.enemyID)_\($0.spawnData.position.col)_\($0.spawnData.position.row)" == target.name
            }) {
                enemyInstances[idx].currentHP -= damage
                let ratio = CGFloat(enemyInstances[idx].currentHP) / CGFloat(enemyInstances[idx].enemyData.maxHP)
                EntityRenderer.updateEnemyHP(node: target.node, ratio: ratio)

                if enemyInstances[idx].currentHP <= 0 {
                    let xp = enemyInstances[idx].enemyData.xpReward
                    let gold = Int.random(in: enemyInstances[idx].enemyData.goldReward)
                    GameManager.shared.grantXP(xp)
                    GameManager.shared.mutateChampion { $0.gold += gold }

                    showFloatingDamage(xp, at: CGPoint(x: target.node.position.x, y: target.node.position.y + 20),
                                       color: SKColor(red: 0.5, green: 0.8, blue: 1, alpha: 1))

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
                switch metal {
                case .steel:  SpellEffectsSystem.steelPush(from: playerNode.position, in: worldNode)
                case .iron:   SpellEffectsSystem.ironPull(at: playerNode.position, in: worldNode)
                case .pewter: SpellEffectsSystem.pewterFlare(on: playerNode)
                case .tin:    SpellEffectsSystem.tinEnhance(on: playerNode, in: worldNode)
                default: break
                }
            }

        case .radiant:
            let orderSurges: [SurgebindingSystem.Surge]
            if let order = champion.radiantOrder {
                let (s1, s2) = surgebinding.surgesForOrder(order)
                orderSurges = [s1, s2, .illumination, .transformation]
            } else {
                orderSurges = [.gravitation, .adhesion, .abrasion, .progression]
            }
            let surge = index < orderSurges.count ? orderSurges[index] : orderSurges[0]
            let result = surgebinding.useSurge(surge, champion: &champion, targetPosition: nil)
            GameManager.shared.champion = champion
            if result.success {
                showAbilityEffect(description: result.description)
                actionButtons.startCooldown(abilityIndex: index, duration: GameConstants.Combat.abilityCooldown)
                switch surge {
                case .gravitation: SpellEffectsSystem.gravitationLash(from: playerNode.position, in: worldNode)
                case .adhesion: SpellEffectsSystem.adhesionField(at: playerNode.position, in: worldNode)
                case .progression: SpellEffectsSystem.progressionHeal(on: playerNode, in: worldNode)
                case .abrasion: SpellEffectsSystem.spawnBuffAura(on: playerNode, color: .cyan, duration: result.duration)
                case .illumination: SpellEffectsSystem.spawnAOE(at: playerNode.position, color: .white, radius: 30, in: worldNode, duration: result.duration)
                default:
                    SpellEffectsSystem.spawnAOE(at: playerNode.position, color: .cyan, radius: 40, in: worldNode)
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
                if result.damage > 0 { showFloatingDamage(result.damage, at: playerNode.position, color: .magenta) }
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
                if result.damage > 0 { showFloatingDamage(result.damage, at: playerNode.position, color: result.glyphColor) }
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
                case .lash: SpellEffectsSystem.sandWhip(from: playerNode.position, toward: 0, in: worldNode)
                case .shield: SpellEffectsSystem.sandShield(on: playerNode)
                default: SpellEffectsSystem.spawnAOE(at: playerNode.position, color: sandColor, radius: 35, in: worldNode)
                }
                if result.damage > 0 { showFloatingDamage(result.damage, at: playerNode.position, color: sandColor) }
            }

        case .nightmarePainter:
            let techniques: [PaintingSystem.PaintingTechnique] = [.ink_slash, .capture, .nightmare_ward, .banish]
            let technique = index < techniques.count ? techniques[index] : .ink_slash
            let result = painting.usePaintingTechnique(technique, champion: &champion, targetPosition: nil)
            GameManager.shared.champion = champion
            if result.success {
                showAbilityEffect(description: result.description)
                actionButtons.startCooldown(abilityIndex: index, duration: 3.5)
                switch technique {
                case .ink_slash: SpellEffectsSystem.inkSlash(from: playerNode.position, in: worldNode)
                case .capture: SpellEffectsSystem.nightmareCapture(at: playerNode.position, in: worldNode)
                default:
                    SpellEffectsSystem.spawnAOE(at: playerNode.position,
                                                 color: SKColor(red: 0.3, green: 0.1, blue: 0.4, alpha: 1),
                                                 radius: 30, in: worldNode)
                }
                if result.healing > 0 { showHealEffect(amount: result.healing) }
                if result.damage > 0 {
                    showFloatingDamage(result.damage, at: playerNode.position,
                                       color: SKColor(red: 0.3, green: 0.1, blue: 0.4, alpha: 1))
                }
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

        // Screen shake — applied to worldNode to avoid conflicting with camera follow
        let shake = SKAction.sequence([
            SKAction.moveBy(x: 5, y: 3, duration: 0.03),
            SKAction.moveBy(x: -10, y: -6, duration: 0.03),
            SKAction.moveBy(x: 8, y: 4, duration: 0.03),
            SKAction.moveBy(x: -3, y: -1, duration: 0.03)
        ])
        worldNode.run(SKAction.sequence([
            SKAction.repeat(shake, count: 4),
            SKAction.move(to: worldNode.position, duration: 0.05)
        ]), withKey: "screenShake")

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

    private func showFloatingDamage(_ damage: Int, at position: CGPoint, color: SKColor = .white) {
        let label = obtainDamageLabel()
        label.text = "\(damage)"
        label.fontColor = color
        label.position = position
        worldNode.addChild(label)

        label.run(SKAction.sequence([
            SKAction.group([
                SKAction.moveBy(x: CGFloat.random(in: -15...15), y: 40, duration: 0.6),
                SKAction.fadeOut(withDuration: 0.5),
                SKAction.scale(to: 1.3, duration: 0.2)
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
            if node.name == "inventoryButton" {
                toggleInventory()
                return
            }
            if node.name == "hpBarBg" || node.parent?.name == "hpBarBg"
                || node.name == "mpBarBg" || node.parent?.name == "mpBarBg" {
                toggleStatsMenu()
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
        menu.onSettings = { [weak self] in
            self?.showSettings()
        }
        menu.onQuit = { [weak self] in
            guard let self, let view = self.view else { return }
            _ = SaveManager.shared.save()
            SceneRouter(view: view).showMainMenu()
        }
        cameraNode.addChild(menu)
        pauseMenu = menu
    }

    private func toggleInventory() {
        if let existing = inventoryNode {
            existing.hide()
            existing.onClose = { [weak self] in
                existing.removeFromParent()
                self?.inventoryNode = nil
            }
            return
        }

        let inv = InventoryNode(screenSize: size)
        inv.zPosition = 6001
        inv.onClose = { [weak self] in
            inv.removeFromParent()
            self?.inventoryNode = nil
        }
        cameraNode.addChild(inv)
        inv.show()
        inventoryNode = inv
    }

    private func toggleStatsMenu() {
        if let existing = statsMenu {
            existing.hide()
            existing.onClose = { [weak self] in
                existing.removeFromParent()
                self?.statsMenu = nil
            }
            return
        }

        let menu = StatsMenuNode(screenSize: size)
        menu.zPosition = 6001
        menu.onClose = { [weak self] in
            menu.removeFromParent()
            self?.statsMenu = nil
        }
        cameraNode.addChild(menu)
        menu.show()
        statsMenu = menu
    }

    // MARK: - Settings

    private func showSettings() {
        let settings = SettingsMenuNode(screenSize: size)
        settings.zPosition = 7000
        settings.onClose = { [weak settings] in
            settings?.removeFromParent()
        }
        cameraNode.addChild(settings)
    }

    // MARK: - Low HP Warning

    private func setupLowHPOverlay() {
        let overlay = SKShapeNode(rectOf: CGSize(width: size.width * 2, height: size.height * 2))
        overlay.fillColor = GameConstants.Colors.lowHPWarning
        overlay.strokeColor = .clear
        overlay.zPosition = 1500
        overlay.alpha = 0
        overlay.name = "lowHPOverlay"
        cameraNode.addChild(overlay)
        lowHPOverlay = overlay
    }

    private func updateLowHPWarning(champion: Champion) {
        let hpRatio = Double(champion.currentHP) / Double(champion.maxHP)
        if hpRatio <= GameConstants.HUD.lowHPThreshold && !isShowingLowHPWarning {
            isShowingLowHPWarning = true
            let pulse = SKAction.repeatForever(SKAction.sequence([
                SKAction.fadeAlpha(to: 0.4, duration: 0.3),
                SKAction.fadeAlpha(to: 0.1, duration: 0.3)
            ]))
            lowHPOverlay?.run(pulse, withKey: "lowHPPulse")
        } else if hpRatio > GameConstants.HUD.lowHPThreshold && isShowingLowHPWarning {
            isShowingLowHPWarning = false
            lowHPOverlay?.removeAction(forKey: "lowHPPulse")
            lowHPOverlay?.run(SKAction.fadeAlpha(to: 0, duration: 0.3))
        }
    }

    // MARK: - Level Up Celebration

    private func showLevelUpCelebration(newLevel: Int) {
        guard let playerNode else { return }

        // Grand texte doré
        let label = SKLabelNode(fontNamed: "Copperplate-Bold")
        label.text = "NIVEAU \(newLevel) !"
        label.fontSize = 28
        label.fontColor = GameConstants.Colors.gold
        label.position = CGPoint(x: 0, y: size.height / 4)
        label.zPosition = 3000
        label.setScale(0.3)
        cameraNode.addChild(label)

        label.run(SKAction.sequence([
            SKAction.group([
                SKAction.scale(to: 1.2, duration: 0.3),
                SKAction.fadeIn(withDuration: 0.2)
            ]),
            SKAction.scale(to: 1.0, duration: 0.1),
            SKAction.wait(forDuration: 1.5),
            SKAction.group([
                SKAction.moveBy(x: 0, y: 40, duration: 0.5),
                SKAction.fadeOut(withDuration: 0.5)
            ]),
            SKAction.removeFromParent()
        ]))

        // Sous-texte "PV & Investiture restaurés"
        let subLabel = SKLabelNode(fontNamed: "Copperplate")
        subLabel.text = "PV & Investiture restaurés !"
        subLabel.fontSize = 14
        subLabel.fontColor = GameConstants.Colors.healGreen
        subLabel.position = CGPoint(x: 0, y: size.height / 4 - 35)
        subLabel.zPosition = 3000
        subLabel.alpha = 0
        cameraNode.addChild(subLabel)

        subLabel.run(SKAction.sequence([
            SKAction.wait(forDuration: 0.4),
            SKAction.fadeIn(withDuration: 0.3),
            SKAction.wait(forDuration: 1.5),
            SKAction.fadeOut(withDuration: 0.5),
            SKAction.removeFromParent()
        ]))

        // Cercle de lumière doré sur le joueur
        let ring = SKShapeNode(circleOfRadius: 60)
        ring.fillColor = SKColor(red: 1, green: 0.85, blue: 0.2, alpha: 0.15)
        ring.strokeColor = GameConstants.Colors.gold
        ring.lineWidth = 3
        ring.position = playerNode.position
        ring.zPosition = 400
        ring.setScale(0.1)
        worldNode.addChild(ring)

        ring.run(SKAction.sequence([
            SKAction.group([
                SKAction.scale(to: 1.5, duration: 0.6),
                SKAction.fadeOut(withDuration: 0.6)
            ]),
            SKAction.removeFromParent()
        ]))

        // Particules étoilées montantes
        for i in 0..<8 {
            let star = SKLabelNode(fontNamed: "Copperplate-Bold")
            star.text = "★"
            star.fontSize = CGFloat.random(in: 10...18)
            star.fontColor = GameConstants.Colors.gold
            star.position = playerNode.position
            star.zPosition = 401
            worldNode.addChild(star)

            let angle = CGFloat(i) * .pi * 2 / 8
            let dist = CGFloat.random(in: 30...60)

            star.run(SKAction.sequence([
                SKAction.wait(forDuration: Double(i) * 0.05),
                SKAction.group([
                    SKAction.move(to: CGPoint(
                        x: playerNode.position.x + cos(angle) * dist,
                        y: playerNode.position.y + sin(angle) * dist + 40
                    ), duration: 0.8),
                    SKAction.sequence([
                        SKAction.fadeIn(withDuration: 0.1),
                        SKAction.wait(forDuration: 0.4),
                        SKAction.fadeOut(withDuration: 0.3)
                    ])
                ]),
                SKAction.removeFromParent()
            ]))
        }

        // Screen flash doré
        let flash = SKShapeNode(rectOf: CGSize(width: size.width * 2, height: size.height * 2))
        flash.fillColor = SKColor(red: 1, green: 0.85, blue: 0.2, alpha: 0.3)
        flash.strokeColor = .clear
        flash.zPosition = 1500
        cameraNode.addChild(flash)

        flash.run(SKAction.sequence([
            SKAction.fadeOut(withDuration: 0.5),
            SKAction.removeFromParent()
        ]))

        AudioManager.shared.playSFX("level_up", on: self)
    }

    // MARK: - Regen Visual

    private func showRegenTick(hpHealed: Int, invHealed: Int) {
        guard let playerNode, (hpHealed > 0 || invHealed > 0) else { return }

        if hpHealed > 0 {
            let label = obtainDamageLabel()
            label.text = "+\(hpHealed)"
            label.fontColor = GameConstants.Colors.healGreen
            label.fontSize = 12
            label.position = CGPoint(x: playerNode.position.x - 15, y: playerNode.position.y + 20)
            worldNode.addChild(label)

            label.run(SKAction.sequence([
                SKAction.group([
                    SKAction.moveBy(x: 0, y: 25, duration: 0.6),
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

        // Régénération passive HP/Investiture
        regenAccumulator += deltaTime
        if regenAccumulator >= regenInterval {
            regenAccumulator -= regenInterval
            var hpHealed = 0
            var invHealed = 0
            GameManager.shared.mutateChampion { champ in
                if champ.currentHP < champ.maxHP {
                    let heal = min(self.hpRegenBase, champ.maxHP - champ.currentHP)
                    champ.currentHP += heal
                    hpHealed = heal
                }
                if champ.currentInvestiture < champ.maxInvestiture {
                    let heal = min(self.investitureRegenBase, champ.maxInvestiture - champ.currentInvestiture)
                    champ.currentInvestiture += heal
                    invHealed = heal
                }
            }
            showRegenTick(hpHealed: hpHealed, invHealed: invHealed)
        }

        if let champion = GameManager.shared.champion {
            minimap.updatePlayerPosition(champion.gridPosition)
            updateHUD(champion: champion)
            updateLowHPWarning(champion: champion)

            // Détection de level up
            if champion.level > previousLevel {
                showLevelUpCelebration(newLevel: champion.level)
                previousLevel = champion.level
            }
        }

        let enemies = enemyInstances.filter { $0.isAlive }.map { (position: $0.position, id: $0.enemyData.id) }
        companionSystem.update(deltaTime: deltaTime, playerPosition: playerPos, enemies: enemies)
    }
}
