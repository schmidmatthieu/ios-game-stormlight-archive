import SpriteKit

/// Minimap en coin supérieur droit — affiche la zone, les ennemis et les PNJ
class MinimapNode: SKNode {

    private let mapSize: CGSize = CGSize(width: 100, height: 100)
    private let background: SKShapeNode
    private let mapContent: SKCropNode
    private let playerDot: SKShapeNode
    private var enemyDots: [SKShapeNode] = []
    private var npcDots: [SKShapeNode] = []
    private var lootDots: [SKShapeNode] = []
    private var exitDots: [SKShapeNode] = []

    private var zoneGridWidth: Int = 1
    private var zoneGridHeight: Int = 1

    override init() {
        // Background
        background = SKShapeNode(rectOf: mapSize, cornerRadius: 8)
        background.fillColor = SKColor(white: 0, alpha: 0.7)
        background.strokeColor = SKColor(red: 0.4, green: 0.35, blue: 0.2, alpha: 0.8)
        background.lineWidth = 2
        background.zPosition = 4000

        // Crop node for clipping
        mapContent = SKCropNode()
        let mask = SKShapeNode(rectOf: CGSize(width: mapSize.width - 4, height: mapSize.height - 4), cornerRadius: 6)
        mask.fillColor = .white
        mapContent.maskNode = mask
        mapContent.zPosition = 4001

        // Player dot
        playerDot = SKShapeNode(circleOfRadius: 3)
        playerDot.fillColor = .cyan
        playerDot.strokeColor = .white
        playerDot.lineWidth = 1
        playerDot.zPosition = 4010

        // Pulse animation
        let pulse = SKAction.repeatForever(SKAction.sequence([
            SKAction.scale(to: 1.3, duration: 0.5),
            SKAction.scale(to: 1.0, duration: 0.5)
        ]))
        playerDot.run(pulse)

        super.init()

        addChild(background)
        addChild(mapContent)
        mapContent.addChild(playerDot)
    }

    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    // MARK: - Setup

    func setupForZone(_ zone: Zone) {
        zoneGridWidth = zone.gridWidth
        zoneGridHeight = zone.gridHeight

        // Clear previous
        enemyDots.forEach { $0.removeFromParent() }
        npcDots.forEach { $0.removeFromParent() }
        lootDots.forEach { $0.removeFromParent() }
        exitDots.forEach { $0.removeFromParent() }
        enemyDots.removeAll()
        npcDots.removeAll()
        lootDots.removeAll()
        exitDots.removeAll()

        // NPC dots (jaune)
        for npc in zone.npcSpawns {
            let dot = createDot(color: .yellow, radius: 2.5)
            dot.position = gridToMinimap(npc.position)
            mapContent.addChild(dot)
            npcDots.append(dot)
        }

        // Enemy dots (rouge)
        for enemy in zone.enemySpawns {
            let dot = createDot(color: .red, radius: 2)
            dot.position = gridToMinimap(enemy.position)
            mapContent.addChild(dot)
            enemyDots.append(dot)
        }

        // Loot points (bleu)
        for loot in zone.lootPoints {
            if !loot.isHidden {
                let dot = createDot(color: .blue, radius: 1.5)
                dot.position = gridToMinimap(loot.position)
                mapContent.addChild(dot)
                lootDots.append(dot)
            }
        }

        // Zone exits (vert)
        for connection in zone.connections {
            let dot = createDot(color: .green, radius: 3)
            dot.position = gridToMinimap(connection.exitPosition)
            mapContent.addChild(dot)
            exitDots.append(dot)

            // Triangle directionnel
            let arrow = SKLabelNode(text: "▶")
            arrow.fontSize = 6
            arrow.fontColor = .green
            arrow.position = dot.position
            arrow.zPosition = 4005
            mapContent.addChild(arrow)
        }
    }

    // MARK: - Update

    func updatePlayerPosition(_ gridPos: GridPosition) {
        playerDot.position = gridToMinimap(gridPos)
    }

    func updateEnemyPosition(index: Int, gridPos: GridPosition, isAlive: Bool) {
        guard index >= 0, index < enemyDots.count else { return }
        enemyDots[index].position = gridToMinimap(gridPos)
        enemyDots[index].isHidden = !isAlive
    }

    // MARK: - Helpers

    private func gridToMinimap(_ pos: GridPosition) -> CGPoint {
        let x = (CGFloat(pos.col) / CGFloat(zoneGridWidth) - 0.5) * (mapSize.width - 10)
        let y = -(CGFloat(pos.row) / CGFloat(zoneGridHeight) - 0.5) * (mapSize.height - 10)
        return CGPoint(x: x, y: y)
    }

    private func createDot(color: SKColor, radius: CGFloat) -> SKShapeNode {
        let dot = SKShapeNode(circleOfRadius: radius)
        dot.fillColor = color
        dot.strokeColor = .clear
        dot.zPosition = 4005
        return dot
    }
}
