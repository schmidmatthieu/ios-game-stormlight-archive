import SpriteKit

/// Barre d'affichage tête-haute — PV, Investiture, XP, niveau, nom de zone
class HUDNode: SKNode {

    // MARK: - Properties

    private let barWidth = GameConstants.HUD.barWidth
    private let barHeight = GameConstants.HUD.barHeight
    private let spacing: CGFloat = 4

    // Bars
    private let healthBarBG = SKShapeNode()
    private let healthBarFill = SKShapeNode()
    private let investitureBarBG = SKShapeNode()
    private let investitureBarFill = SKShapeNode()
    private let xpBarBG = SKShapeNode()
    private let xpBarFill = SKShapeNode()

    // Labels
    private let levelLabel = SKLabelNode(fontNamed: "Copperplate-Bold")
    private let healthLabel = SKLabelNode(fontNamed: "Helvetica")
    private let investitureLabel = SKLabelNode(fontNamed: "Helvetica")
    private let zoneLabel = SKLabelNode(fontNamed: "Copperplate")
    private let resourceLabel = SKLabelNode(fontNamed: "Helvetica")
    private let goldLabel = SKLabelNode(fontNamed: "Helvetica")

    // MARK: - Init

    init(screenSize: CGSize) {
        super.init()
        self.zPosition = 500
        self.name = "hud"

        let margin: CGFloat = 16
        let topY = screenSize.height / 2 - margin

        // Niveau
        levelLabel.fontSize = 14
        levelLabel.fontColor = SKColor(red: 0.9, green: 0.8, blue: 0.4, alpha: 1.0)
        levelLabel.horizontalAlignmentMode = .left
        levelLabel.position = CGPoint(x: -screenSize.width / 2 + margin, y: topY)
        addChild(levelLabel)

        // Barre PV
        let hpY = topY - 20
        setupBar(bg: healthBarBG, fill: healthBarFill, y: hpY, x: -screenSize.width / 2 + margin + 44,
                 fillColor: SKColor(red: 0.8, green: 0.2, blue: 0.2, alpha: 1.0))

        healthLabel.fontSize = 9
        healthLabel.fontColor = .white
        healthLabel.position = CGPoint(x: -screenSize.width / 2 + margin + 44 + barWidth / 2, y: hpY + 1)
        healthLabel.zPosition = 502
        addChild(healthLabel)

        // Barre Investiture
        let invY = hpY - barHeight - spacing
        setupBar(bg: investitureBarBG, fill: investitureBarFill, y: invY, x: -screenSize.width / 2 + margin + 44,
                 fillColor: SKColor(red: 0.2, green: 0.5, blue: 0.9, alpha: 1.0))

        investitureLabel.fontSize = 9
        investitureLabel.fontColor = .white
        investitureLabel.position = CGPoint(x: -screenSize.width / 2 + margin + 44 + barWidth / 2, y: invY + 1)
        investitureLabel.zPosition = 502
        addChild(investitureLabel)

        // Barre XP
        let xpY = invY - barHeight - spacing
        setupBar(bg: xpBarBG, fill: xpBarFill, y: xpY, x: -screenSize.width / 2 + margin + 44,
                 fillColor: SKColor(red: 0.4, green: 0.8, blue: 0.3, alpha: 1.0))

        // Zone name (top right)
        zoneLabel.fontSize = 12
        zoneLabel.fontColor = .lightGray
        zoneLabel.horizontalAlignmentMode = .right
        zoneLabel.position = CGPoint(x: screenSize.width / 2 - margin, y: topY)
        addChild(zoneLabel)

        // Resource label (under zone)
        resourceLabel.fontSize = 10
        resourceLabel.fontColor = SKColor(red: 0.7, green: 0.7, blue: 0.9, alpha: 1.0)
        resourceLabel.horizontalAlignmentMode = .right
        resourceLabel.position = CGPoint(x: screenSize.width / 2 - margin, y: topY - 18)
        addChild(resourceLabel)

        // Gold (under resource)
        goldLabel.fontSize = 10
        goldLabel.fontColor = SKColor(red: 0.9, green: 0.8, blue: 0.3, alpha: 1.0)
        goldLabel.horizontalAlignmentMode = .right
        goldLabel.position = CGPoint(x: screenSize.width / 2 - margin, y: topY - 34)
        addChild(goldLabel)
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    // MARK: - Bar Setup

    private func setupBar(bg: SKShapeNode, fill: SKShapeNode, y: CGFloat, x: CGFloat, fillColor: SKColor) {
        bg.path = CGPath(roundedRect: CGRect(x: 0, y: 0, width: barWidth, height: barHeight),
                         cornerWidth: 3, cornerHeight: 3, transform: nil)
        bg.fillColor = SKColor(white: 0.15, alpha: 0.8)
        bg.strokeColor = SKColor(white: 0.3, alpha: 1.0)
        bg.lineWidth = 1
        bg.position = CGPoint(x: x, y: y)
        bg.zPosition = 500
        addChild(bg)

        fill.fillColor = fillColor
        fill.strokeColor = .clear
        fill.position = CGPoint(x: x, y: y)
        fill.zPosition = 501
        addChild(fill)
    }

    private func updateBarFill(_ bar: SKShapeNode, percent: Double) {
        let clampedPercent = max(0, min(1, percent))
        let fillWidth = barWidth * CGFloat(clampedPercent)
        bar.path = CGPath(roundedRect: CGRect(x: 0, y: 0, width: fillWidth, height: barHeight),
                          cornerWidth: 3, cornerHeight: 3, transform: nil)
    }

    // MARK: - Update

    func update(champion: Champion, zoneName: String, magicComponent: MagicSystemComponent?) {
        // Niveau
        levelLabel.text = "Nv.\(champion.level)"

        // PV
        let hpPercent = Double(champion.currentHP) / Double(champion.maxHP)
        updateBarFill(healthBarFill, percent: hpPercent)
        healthLabel.text = "\(champion.currentHP)/\(champion.maxHP)"

        // Investiture
        let invPercent = Double(champion.currentInvestiture) / Double(champion.maxInvestiture)
        updateBarFill(investitureBarFill, percent: invPercent)
        investitureLabel.text = "\(champion.currentInvestiture)/\(champion.maxInvestiture)"

        // XP
        let xpPercent = Double(champion.currentXP) / Double(champion.xpForNextLevel)
        updateBarFill(xpBarFill, percent: xpPercent)

        // Zone
        zoneLabel.text = zoneName

        // Ressource magique
        if let magic = magicComponent {
            resourceLabel.text = magic.resourceLabel
        }

        // Or
        goldLabel.text = "\(champion.gold) or"
    }

    // MARK: - Notifications

    func flashHealthBar() {
        let flash = SKAction.sequence([
            SKAction.run { self.healthBarFill.fillColor = .white },
            SKAction.wait(forDuration: 0.1),
            SKAction.run { self.healthBarFill.fillColor = SKColor(red: 0.8, green: 0.2, blue: 0.2, alpha: 1.0) }
        ])
        healthBarFill.run(SKAction.repeat(flash, count: 3))
    }

    func showLevelUp() {
        let popup = SKLabelNode(fontNamed: "Copperplate-Bold")
        popup.text = "NIVEAU SUPÉRIEUR!"
        popup.fontSize = 20
        popup.fontColor = SKColor(red: 0.9, green: 0.8, blue: 0.4, alpha: 1.0)
        popup.position = .zero
        popup.zPosition = 600
        addChild(popup)

        let animate = SKAction.sequence([
            SKAction.group([
                SKAction.moveBy(x: 0, y: 60, duration: 1.5),
                SKAction.sequence([
                    SKAction.fadeIn(withDuration: 0.2),
                    SKAction.wait(forDuration: 1.0),
                    SKAction.fadeOut(withDuration: 0.3)
                ])
            ]),
            SKAction.removeFromParent()
        ])
        popup.run(animate)
    }
}
