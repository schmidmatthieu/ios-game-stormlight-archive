import SpriteKit

/// Minimap améliorée — terrain coloré, bordure ornementale, brouillard de guerre,
/// indicateurs directionnels, et légende des marqueurs
class MinimapNode: SKNode {

    private let mapSize: CGSize = CGSize(width: 110, height: 110)
    private let background: SKShapeNode
    private let mapContent: SKCropNode
    private let terrainLayer: SKNode
    private let playerDot: SKShapeNode
    private let playerDirection: SKShapeNode
    private var enemyDots: [SKShapeNode] = []
    private var npcDots: [SKShapeNode] = []
    private var lootDots: [SKShapeNode] = []
    private var exitIndicators: [SKNode] = []

    private var zoneGridWidth: Int = 1
    private var zoneGridHeight: Int = 1

    override init() {
        // Outer frame with ornamental border
        let frame = SKShapeNode(rectOf: CGSize(width: mapSize.width + 6, height: mapSize.height + 6), cornerRadius: 10)
        frame.fillColor = SKColor(red: 0.15, green: 0.12, blue: 0.08, alpha: 0.9)
        frame.strokeColor = SKColor(red: 0.5, green: 0.4, blue: 0.2, alpha: 0.8)
        frame.lineWidth = 2
        frame.zPosition = 3999

        // Background
        background = SKShapeNode(rectOf: mapSize, cornerRadius: 8)
        background.fillColor = SKColor(white: 0, alpha: 0.8)
        background.strokeColor = .clear
        background.zPosition = 4000

        // Terrain layer
        terrainLayer = SKNode()
        terrainLayer.zPosition = 4001

        // Crop node for clipping
        mapContent = SKCropNode()
        let mask = SKShapeNode(rectOf: CGSize(width: mapSize.width - 4, height: mapSize.height - 4), cornerRadius: 6)
        mask.fillColor = .white
        mapContent.maskNode = mask
        mapContent.zPosition = 4002

        // Player dot with glow
        playerDot = SKShapeNode(circleOfRadius: 3.5)
        playerDot.fillColor = SKColor(red: 0.3, green: 0.9, blue: 1.0, alpha: 1.0)
        playerDot.strokeColor = .white
        playerDot.lineWidth = 1
        playerDot.glowWidth = 3
        playerDot.zPosition = 4015

        // Direction indicator (small triangle)
        playerDirection = SKShapeNode()
        let arrowPath = CGMutablePath()
        arrowPath.move(to: CGPoint(x: 0, y: 6))
        arrowPath.addLine(to: CGPoint(x: 3, y: 0))
        arrowPath.addLine(to: CGPoint(x: -3, y: 0))
        arrowPath.closeSubpath()
        playerDirection.path = arrowPath
        playerDirection.fillColor = SKColor(red: 0.3, green: 0.9, blue: 1.0, alpha: 0.7)
        playerDirection.strokeColor = .clear
        playerDirection.zPosition = 4016

        // Pulse animation
        let pulse = SKAction.repeatForever(SKAction.sequence([
            SKAction.scale(to: 1.2, duration: 0.6),
            SKAction.scale(to: 1.0, duration: 0.6)
        ]))
        playerDot.run(pulse)

        super.init()

        addChild(frame)
        addChild(background)
        addChild(mapContent)
        mapContent.addChild(terrainLayer)
        mapContent.addChild(playerDot)
        mapContent.addChild(playerDirection)

        // Corner ornaments
        setupCornerOrnaments()
    }

    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    // MARK: - Corner Ornaments

    private func setupCornerOrnaments() {
        let ornamentColor = SKColor(red: 0.5, green: 0.4, blue: 0.2, alpha: 0.5)
        for (xSign, ySign) in [(-1, -1), (-1, 1), (1, -1), (1, 1)] as [(CGFloat, CGFloat)] {
            let dot = SKShapeNode(circleOfRadius: 2)
            dot.fillColor = ornamentColor
            dot.strokeColor = .clear
            dot.position = CGPoint(x: xSign * (mapSize.width / 2 - 2),
                                    y: ySign * (mapSize.height / 2 - 2))
            dot.zPosition = 4020
            addChild(dot)
        }

        // "MAP" label
        let mapLabel = SKLabelNode(fontNamed: "Helvetica-Bold")
        mapLabel.text = "MAP"
        mapLabel.fontSize = 7
        mapLabel.fontColor = SKColor(red: 0.5, green: 0.4, blue: 0.2, alpha: 0.5)
        mapLabel.horizontalAlignmentMode = .left
        mapLabel.position = CGPoint(x: -mapSize.width / 2 + 4, y: mapSize.height / 2 - 12)
        mapLabel.zPosition = 4020
        addChild(mapLabel)
    }

    // MARK: - Setup

    func setupForZone(_ zone: Zone) {
        zoneGridWidth = zone.gridWidth
        zoneGridHeight = zone.gridHeight

        // Clear previous
        enemyDots.forEach { $0.removeFromParent() }
        npcDots.forEach { $0.removeFromParent() }
        lootDots.forEach { $0.removeFromParent() }
        exitIndicators.forEach { $0.removeFromParent() }
        terrainLayer.removeAllChildren()
        enemyDots.removeAll()
        npcDots.removeAll()
        lootDots.removeAll()
        exitIndicators.removeAll()

        // Draw terrain background
        setupTerrain(zone: zone)

        // NPC dots (jaune doré avec cercle)
        for npc in zone.npcSpawns {
            let container = SKNode()
            container.position = gridToMinimap(npc.position)
            container.zPosition = 4008

            let dot = SKShapeNode(circleOfRadius: 3)
            dot.fillColor = SKColor(red: 0.9, green: 0.8, blue: 0.2, alpha: 0.9)
            dot.strokeColor = SKColor(red: 1.0, green: 0.9, blue: 0.4, alpha: 0.5)
            dot.lineWidth = 1
            container.addChild(dot)

            mapContent.addChild(container)
            npcDots.append(dot)
        }

        // Enemy dots (rouge avec pulsation)
        for enemy in zone.enemySpawns {
            let dot = SKShapeNode(circleOfRadius: 2.5)
            dot.fillColor = SKColor(red: 0.9, green: 0.2, blue: 0.15, alpha: 0.8)
            dot.strokeColor = .clear
            dot.position = gridToMinimap(enemy.position)
            dot.zPosition = 4006

            // Subtle pulse for active enemies
            let pulse = SKAction.repeatForever(SKAction.sequence([
                SKAction.fadeAlpha(to: 0.5, duration: 1.0),
                SKAction.fadeAlpha(to: 0.9, duration: 1.0)
            ]))
            dot.run(pulse)

            mapContent.addChild(dot)
            enemyDots.append(dot)
        }

        // Loot points (bleu clair, petits losanges)
        for loot in zone.lootPoints {
            if !loot.isHidden {
                let diamond = SKShapeNode()
                let path = CGMutablePath()
                path.move(to: CGPoint(x: 0, y: 2))
                path.addLine(to: CGPoint(x: 2, y: 0))
                path.addLine(to: CGPoint(x: 0, y: -2))
                path.addLine(to: CGPoint(x: -2, y: 0))
                path.closeSubpath()
                diamond.path = path
                diamond.fillColor = SKColor(red: 0.3, green: 0.6, blue: 1.0, alpha: 0.7)
                diamond.strokeColor = .clear
                diamond.position = gridToMinimap(loot.position)
                diamond.zPosition = 4005
                mapContent.addChild(diamond)
                lootDots.append(diamond)
            }
        }

        // Zone exits (vert avec flèches directionnelles)
        for connection in zone.connections {
            let container = SKNode()
            container.position = gridToMinimap(connection.exitPosition)
            container.zPosition = 4010

            // Green portal indicator
            let portal = SKShapeNode(circleOfRadius: 4)
            portal.fillColor = SKColor(red: 0.2, green: 0.8, blue: 0.3, alpha: 0.7)
            portal.strokeColor = SKColor(red: 0.3, green: 1.0, blue: 0.4, alpha: 0.5)
            portal.lineWidth = 1
            container.addChild(portal)

            // Directional arrow
            let arrow = SKShapeNode()
            let arrowPath = CGMutablePath()
            arrowPath.move(to: CGPoint(x: 0, y: 8))
            arrowPath.addLine(to: CGPoint(x: 4, y: 4))
            arrowPath.addLine(to: CGPoint(x: -4, y: 4))
            arrowPath.closeSubpath()
            arrow.path = arrowPath
            arrow.fillColor = SKColor(red: 0.3, green: 1.0, blue: 0.4, alpha: 0.6)
            arrow.strokeColor = .clear
            container.addChild(arrow)

            // Pulse
            let pulse = SKAction.repeatForever(SKAction.sequence([
                SKAction.scale(to: 1.2, duration: 0.8),
                SKAction.scale(to: 0.9, duration: 0.8)
            ]))
            portal.run(pulse)

            mapContent.addChild(container)
            exitIndicators.append(container)
        }
    }

    // MARK: - Terrain

    private func setupTerrain(zone: Zone) {
        let theme = WorldTheme.theme(for: zone.worldID)
        let terrainColor = theme.tileColor

        // Fill terrain area with theme color
        let terrainBg = SKShapeNode(rectOf: CGSize(width: mapSize.width - 8, height: mapSize.height - 8), cornerRadius: 4)
        terrainBg.fillColor = SKColor(red: terrainColor.r * 0.4, green: terrainColor.g * 0.4,
                                       blue: terrainColor.b * 0.4, alpha: 0.5)
        terrainBg.strokeColor = .clear
        terrainBg.zPosition = 0
        terrainLayer.addChild(terrainBg)

        // Grid overlay for visual structure
        let gridSpacingX = (mapSize.width - 10) / CGFloat(max(1, zoneGridWidth / 5))
        let gridSpacingY = (mapSize.height - 10) / CGFloat(max(1, zoneGridHeight / 5))

        let gridColor = SKColor(white: 0.3, alpha: 0.1)

        // Horizontal grid lines
        let halfH = (mapSize.height - 10) / 2
        var y: CGFloat = -halfH
        while y <= halfH {
            let line = SKShapeNode(rectOf: CGSize(width: mapSize.width - 10, height: 0.5))
            line.fillColor = gridColor
            line.strokeColor = .clear
            line.position = CGPoint(x: 0, y: y)
            line.zPosition = 1
            terrainLayer.addChild(line)
            y += gridSpacingY
        }

        // Vertical grid lines
        let halfW = (mapSize.width - 10) / 2
        var x: CGFloat = -halfW
        while x <= halfW {
            let line = SKShapeNode(rectOf: CGSize(width: 0.5, height: mapSize.height - 10))
            line.fillColor = gridColor
            line.strokeColor = .clear
            line.position = CGPoint(x: x, y: 0)
            line.zPosition = 1
            terrainLayer.addChild(line)
            x += gridSpacingX
        }

        // Fog of war border (darkened edges)
        for edge in 0..<4 {
            let fogSize: CGSize
            let fogPos: CGPoint
            switch edge {
            case 0: // top
                fogSize = CGSize(width: mapSize.width, height: 12)
                fogPos = CGPoint(x: 0, y: mapSize.height / 2 - 8)
            case 1: // bottom
                fogSize = CGSize(width: mapSize.width, height: 12)
                fogPos = CGPoint(x: 0, y: -mapSize.height / 2 + 8)
            case 2: // left
                fogSize = CGSize(width: 12, height: mapSize.height)
                fogPos = CGPoint(x: -mapSize.width / 2 + 8, y: 0)
            default: // right
                fogSize = CGSize(width: 12, height: mapSize.height)
                fogPos = CGPoint(x: mapSize.width / 2 - 8, y: 0)
            }
            let fog = SKShapeNode(rectOf: fogSize)
            fog.fillColor = SKColor(white: 0, alpha: 0.3)
            fog.strokeColor = .clear
            fog.position = fogPos
            fog.zPosition = 2
            terrainLayer.addChild(fog)
        }
    }

    // MARK: - Update

    func updatePlayerPosition(_ gridPos: GridPosition) {
        let pos = gridToMinimap(gridPos)
        playerDot.position = pos
        playerDirection.position = CGPoint(x: pos.x, y: pos.y + 5)
    }

    func updateEnemyPosition(index: Int, gridPos: GridPosition, isAlive: Bool) {
        guard index >= 0, index < enemyDots.count else { return }
        enemyDots[index].position = gridToMinimap(gridPos)
        enemyDots[index].isHidden = !isAlive
    }

    // MARK: - Helpers

    private func gridToMinimap(_ pos: GridPosition) -> CGPoint {
        let x = (CGFloat(pos.col) / CGFloat(zoneGridWidth) - 0.5) * (mapSize.width - 12)
        let y = -(CGFloat(pos.row) / CGFloat(zoneGridHeight) - 0.5) * (mapSize.height - 12)
        return CGPoint(x: x, y: y)
    }
}
