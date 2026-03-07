import SpriteKit
import GameplayKit

/// Scène de jeu principale — zone isométrique explorable
class ZoneScene: SKScene {

    // MARK: - Properties

    private let zone: Zone
    private let cameraNode = SKCameraNode()
    private let worldNode = SKNode()      // Contient tout le monde de jeu
    private let hudNode = SKNode()        // UI par-dessus

    private var playerSprite: SKSpriteNode!
    private var enemySprites: [String: SKSpriteNode] = [:]

    private let pathfinding = PathfindingSystem()
    private var currentPath: [GridPosition] = []
    private var isMoving = false

    // Taille d'une tile isométrique
    private let tileSize = CGSize(width: 64, height: 32)

    // MARK: - Init

    init(zone: Zone, size: CGSize) {
        self.zone = zone
        super.init(size: size)
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
        centerCamera(on: playerSprite.position)
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
        // HUD fixé à la caméra
        guard let champion = GameManager.shared.champion else { return }

        // Barre de PV
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
        cameraNode.addChild(levelLabel)

        // Nom de la zone
        let zoneLabel = SKLabelNode(fontNamed: "Copperplate")
        zoneLabel.text = zone.name
        zoneLabel.fontSize = 12
        zoneLabel.fontColor = .lightGray
        zoneLabel.position = CGPoint(x: 0, y: size.height / 2 - 30)
        cameraNode.addChild(zoneLabel)

        // Skill bar (4 boutons en bas)
        for i in 0..<4 {
            let btn = SKShapeNode(rectOf: CGSize(width: 50, height: 50), cornerRadius: 8)
            btn.fillColor = SKColor(white: 0.15, alpha: 0.9)
            btn.strokeColor = SKColor(red: 0.5, green: 0.4, blue: 0.2, alpha: 1.0)
            btn.lineWidth = 2
            btn.position = CGPoint(
                x: CGFloat(i - 2) * 60 + 30,
                y: -size.height / 2 + 50
            )
            btn.name = "skill_\(i)"

            let slotLabel = SKLabelNode(fontNamed: "Helvetica")
            slotLabel.text = "\(i + 1)"
            slotLabel.fontSize = 12
            slotLabel.fontColor = .gray
            slotLabel.verticalAlignmentMode = .center
            btn.addChild(slotLabel)

            cameraNode.addChild(btn)
        }
    }

    private func setupPathfinding() {
        var obstacles = Set<GridPosition>()
        // Ajouter les positions d'ennemis et de PNJ comme obstacles
        for enemy in zone.enemySpawns {
            obstacles.insert(enemy.position)
        }
        for npc in zone.npcSpawns {
            obstacles.insert(npc.position)
        }
        pathfinding.setupGrid(width: zone.gridWidth, height: zone.gridHeight, obstacles: obstacles)
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

    private func centerCamera(on position: CGPoint) {
        let moveAction = SKAction.move(to: position, duration: 0.2)
        moveAction.timingMode = .easeOut
        cameraNode.run(moveAction)
    }

    // MARK: - Touch Input

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let touch = touches.first else { return }

        // Check HUD touches first (skill buttons)
        let hudLocation = touch.location(in: cameraNode)
        let hudNodes = cameraNode.nodes(at: hudLocation)
        for node in hudNodes {
            if let name = node.name, name.hasPrefix("skill_") {
                handleSkillTap(name)
                return
            }
        }

        // World touches
        let worldLocation = touch.location(in: worldNode)
        let targetGrid = gridFromIso(worldLocation)

        // Check if tapping on enemy
        let worldNodes = worldNode.nodes(at: worldLocation)
        for node in worldNodes {
            if let name = node.name, name.hasPrefix("enemy_") {
                handleEnemyTap(name: name)
                return
            }
            if let name = node.name, name.hasPrefix("npc_") {
                handleNPCTap(name: name)
                return
            }
        }

        // Move to position
        movePlayer(to: targetGrid)
    }

    // MARK: - Player Movement

    private func movePlayer(to target: GridPosition) {
        guard let champion = GameManager.shared.champion else { return }

        let path = pathfinding.findPath(from: champion.gridPosition, to: target)
        guard !path.isEmpty else { return }

        currentPath = path
        isMoving = true
        followPath()
    }

    private func followPath() {
        guard !currentPath.isEmpty else {
            isMoving = false
            return
        }

        let next = currentPath.removeFirst()
        let targetPos = isoPosition(col: next.col, row: next.row)

        let moveAction = SKAction.move(to: targetPos, duration: 0.15)
        moveAction.timingMode = .easeInEaseOut

        playerSprite.run(moveAction) { [weak self] in
            GameManager.shared.champion?.gridPosition = next
            self?.centerCamera(on: targetPos)
            self?.checkZoneConnections(at: next)
            self?.followPath()
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

    // MARK: - Combat Interactions

    private func handleEnemyTap(name: String) {
        // TODO: Engager le combat avec l'ennemi
        print("⚔️ Attaque: \(name)")
    }

    private func handleNPCTap(name: String) {
        // TODO: Ouvrir le dialogue
        let npcID = name.replacingOccurrences(of: "npc_", with: "")
        GameManager.shared.questSystem.onNPCTalkedTo(npcID: npcID)
        print("💬 Dialogue avec: \(npcID)")
    }

    private func handleSkillTap(_ name: String) {
        guard let index = Int(name.replacingOccurrences(of: "skill_", with: "")) else { return }
        print("✨ Compétence \(index + 1) activée")
        // TODO: Activer la compétence correspondante
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
        // TODO: Update IA ennemis, effets de statut, cooldowns
    }
}
