import SpriteKit

/// Gère le HUD en jeu (barres PV/Investiture, XP, or, niveau, nom de zone)
/// Extrait de ZoneScene pour réduire la taille du fichier principal
final class ZoneHUDManager {

    private let cameraNode: SKCameraNode
    private let screenSize: CGSize

    // Damage pool
    private var damageNodePool: [SKLabelNode] = []
    private let maxPoolSize = 20

    init(cameraNode: SKCameraNode, screenSize: CGSize) {
        self.cameraNode = cameraNode
        self.screenSize = screenSize
    }

    // MARK: - Setup

    func setupHUD(champion: Champion, zoneName: String) {
        // HUD panel background
        let panelBg = SKShapeNode(rectOf: CGSize(width: 140, height: 80), cornerRadius: 8)
        panelBg.fillColor = SKColor(white: 0, alpha: 0.5)
        panelBg.strokeColor = SKColor(red: 0.4, green: 0.35, blue: 0.2, alpha: 0.5)
        panelBg.lineWidth = 1
        panelBg.position = CGPoint(x: -screenSize.width / 2 + 80, y: screenSize.height / 2 - 52)
        panelBg.zPosition = 1900
        cameraNode.addChild(panelBg)

        // HP bar
        let hpBg = SKShapeNode(rectOf: CGSize(width: GameConstants.HUD.hpBarWidth, height: GameConstants.HUD.hpBarHeight), cornerRadius: 3)
        hpBg.fillColor = SKColor(red: 0.3, green: 0, blue: 0, alpha: 0.8)
        hpBg.strokeColor = .red
        hpBg.lineWidth = 1
        hpBg.position = CGPoint(x: -screenSize.width / 2 + 80, y: screenSize.height / 2 - 35)
        hpBg.name = "hpBarBg"
        hpBg.zPosition = GameConstants.ZOrder.hud
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
        hpIcon.fontSize = GameConstants.Fonts.hudLabelSize
        hpIcon.fontColor = SKColor(red: 1, green: 0.6, blue: 0.6, alpha: 1)
        hpIcon.position = CGPoint(x: -65, y: -4)
        hpIcon.zPosition = 1
        hpBg.addChild(hpIcon)

        let hpLabel = SKLabelNode(fontNamed: "Helvetica-Bold")
        hpLabel.text = "\(champion.currentHP)/\(champion.maxHP)"
        hpLabel.fontSize = GameConstants.Fonts.hudBarValueSize
        hpLabel.fontColor = .white
        hpLabel.verticalAlignmentMode = .center
        hpLabel.name = "hpLabel"
        hpBg.addChild(hpLabel)

        // Investiture bar
        let mpBg = SKShapeNode(rectOf: CGSize(width: GameConstants.HUD.hpBarWidth, height: GameConstants.HUD.hpBarHeight), cornerRadius: 3)
        mpBg.fillColor = SKColor(red: 0, green: 0, blue: 0.3, alpha: 0.8)
        mpBg.strokeColor = .cyan
        mpBg.lineWidth = 1
        mpBg.position = CGPoint(x: -screenSize.width / 2 + 80, y: screenSize.height / 2 - 52)
        mpBg.name = "mpBarBg"
        mpBg.zPosition = GameConstants.ZOrder.hud
        cameraNode.addChild(mpBg)

        let mpShine = SKShapeNode(rectOf: CGSize(width: 116, height: 4), cornerRadius: 1)
        mpShine.fillColor = SKColor(white: 1, alpha: 0.12)
        mpShine.strokeColor = .clear
        mpShine.position = CGPoint(x: 0, y: 2)
        mpBg.addChild(mpShine)

        let mpIcon = SKLabelNode(fontNamed: "Helvetica-Bold")
        mpIcon.text = "INV"
        mpIcon.fontSize = GameConstants.Fonts.hudLabelSize
        mpIcon.fontColor = SKColor(red: 0.5, green: 0.8, blue: 1, alpha: 1)
        mpIcon.position = CGPoint(x: -65, y: -4)
        mpIcon.zPosition = 1
        mpBg.addChild(mpIcon)

        let mpLabel = SKLabelNode(fontNamed: "Helvetica-Bold")
        mpLabel.text = "\(champion.currentInvestiture)/\(champion.maxInvestiture)"
        mpLabel.fontSize = GameConstants.Fonts.hudBarValueSize
        mpLabel.fontColor = .white
        mpLabel.verticalAlignmentMode = .center
        mpBg.addChild(mpLabel)

        // Level badge
        let levelBadge = SKShapeNode(circleOfRadius: 14)
        levelBadge.fillColor = SKColor(red: 0.15, green: 0.12, blue: 0.25, alpha: 0.9)
        levelBadge.strokeColor = SKColor(red: 0.6, green: 0.5, blue: 0.2, alpha: 0.8)
        levelBadge.lineWidth = 1.5
        levelBadge.position = CGPoint(x: -screenSize.width / 2 + 22, y: screenSize.height / 2 - 22)
        levelBadge.zPosition = GameConstants.ZOrder.hud
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
        zoneBg.position = CGPoint(x: 0, y: screenSize.height / 2 - 25)
        zoneBg.zPosition = GameConstants.ZOrder.hud
        cameraNode.addChild(zoneBg)

        let zoneLabel = SKLabelNode(fontNamed: "Copperplate")
        zoneLabel.text = zoneName
        zoneLabel.fontSize = GameConstants.Fonts.hudLabelSize
        zoneLabel.fontColor = .lightGray
        zoneLabel.verticalAlignmentMode = .center
        zoneBg.addChild(zoneLabel)

        // XP bar
        let xpBg = SKShapeNode(rectOf: CGSize(width: GameConstants.HUD.hpBarWidth, height: 10), cornerRadius: 2)
        xpBg.fillColor = SKColor(white: 0.1, alpha: 0.8)
        xpBg.strokeColor = SKColor(red: 0.6, green: 0.5, blue: 0.2, alpha: 0.4)
        xpBg.lineWidth = 0.5
        xpBg.position = CGPoint(x: -screenSize.width / 2 + 80, y: screenSize.height / 2 - 66)
        xpBg.zPosition = GameConstants.ZOrder.hud
        cameraNode.addChild(xpBg)

        let xpLabel = SKLabelNode(fontNamed: "Helvetica")
        xpLabel.text = "XP \(champion.currentXP)/\(champion.xpForNextLevel)"
        xpLabel.fontSize = 9
        xpLabel.fontColor = GameConstants.Colors.xpGreen
        xpLabel.verticalAlignmentMode = .center
        xpBg.addChild(xpLabel)

        // Gold
        let goldLabel = SKLabelNode(fontNamed: "Copperplate-Bold")
        goldLabel.text = "\(champion.gold) or"
        goldLabel.fontSize = GameConstants.Fonts.hudLabelSize
        goldLabel.fontColor = SKColor(red: 1, green: 0.85, blue: 0.3, alpha: 1)
        goldLabel.horizontalAlignmentMode = .right
        goldLabel.position = CGPoint(x: screenSize.width / 2 - 20, y: screenSize.height / 2 - 25)
        goldLabel.zPosition = GameConstants.ZOrder.hud
        goldLabel.name = "goldLabel"
        cameraNode.addChild(goldLabel)
    }

    // MARK: - Update

    func updateHUD(champion: Champion) {
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

    // MARK: - Damage Pool

    func obtainDamageLabel() -> SKLabelNode {
        if let recycled = damageNodePool.popLast() {
            recycled.alpha = 1.0
            recycled.setScale(1.0)
            recycled.removeAllActions()
            return recycled
        }
        let label = SKLabelNode(fontNamed: "Copperplate-Bold")
        label.fontSize = 14
        label.zPosition = GameConstants.ZOrder.floatingDamage
        return label
    }

    func recycleDamageLabel(_ label: SKLabelNode) {
        if damageNodePool.count < maxPoolSize {
            damageNodePool.append(label)
        }
    }
}
