import SpriteKit

/// Popup flottant pour afficher les récompenses de loot (items, or, XP)
class LootPopupNode: SKNode {

    // MARK: - Rarity colors

    private static let rarityColors: [String: SKColor] = [
        "common":    SKColor(white: 0.7, alpha: 1.0),
        "uncommon":  SKColor(red: 0.3, green: 0.8, blue: 0.3, alpha: 1.0),
        "rare":      SKColor(red: 0.3, green: 0.5, blue: 0.9, alpha: 1.0),
        "epic":      SKColor(red: 0.6, green: 0.3, blue: 0.9, alpha: 1.0),
        "legendary": SKColor(red: 0.9, green: 0.6, blue: 0.1, alpha: 1.0),
        "cosmeric":  SKColor(red: 0.9, green: 0.15, blue: 0.15, alpha: 1.0)
    ]

    // MARK: - Properties

    private var popupQueue: [(node: SKNode, delay: TimeInterval)] = []
    private let maxVisiblePopups = 5
    private var visibleCount = 0

    // MARK: - Init

    override init() {
        super.init()
        self.zPosition = 600
        self.name = "lootPopup"
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    // MARK: - Show Item Drop

    func showItemDrop(itemName: String, rarity: String, at position: CGPoint) {
        let color = LootPopupNode.rarityColors[rarity] ?? .white

        let container = SKNode()
        container.position = position

        // Measure text width using a temporary label
        let label = SKLabelNode(fontNamed: "Helvetica-Bold")
        label.text = itemName
        label.fontSize = 12
        label.fontColor = color
        label.verticalAlignmentMode = .center
        label.horizontalAlignmentMode = .left

        let textWidth = min(max(label.frame.width + 44, 80), 220)

        // Background pill
        let bg = SKShapeNode(rectOf: CGSize(width: textWidth, height: 24), cornerRadius: 12)
        bg.fillColor = SKColor(white: 0.1, alpha: 0.85)
        bg.strokeColor = color
        bg.lineWidth = 1.5
        container.addChild(bg)

        // Item icon placeholder
        let icon = SKShapeNode(circleOfRadius: 6)
        icon.fillColor = color
        icon.strokeColor = .clear
        icon.position = CGPoint(x: -textWidth / 2 + 14, y: 0)
        container.addChild(icon)

        // Item name
        label.position = CGPoint(x: -textWidth / 2 + 26, y: 0)
        container.addChild(label)

        animatePopup(container)
    }

    // MARK: - Show Gold

    func showGoldGain(_ amount: Int, at position: CGPoint) {
        let container = SKNode()
        container.position = position

        let label = SKLabelNode(fontNamed: "Helvetica-Bold")
        label.text = "+\(amount) or"
        label.fontSize = 12
        label.fontColor = SKColor(red: 0.9, green: 0.8, blue: 0.3, alpha: 1.0)
        label.verticalAlignmentMode = .center
        container.addChild(label)

        animatePopup(container)
    }

    // MARK: - Show XP

    func showXPGain(_ amount: Int, at position: CGPoint) {
        let container = SKNode()
        container.position = position

        let label = SKLabelNode(fontNamed: "Helvetica-Bold")
        label.text = "+\(amount) XP"
        label.fontSize = 12
        label.fontColor = SKColor(red: 0.4, green: 0.8, blue: 0.3, alpha: 1.0)
        label.verticalAlignmentMode = .center
        container.addChild(label)

        animatePopup(container)
    }

    // MARK: - Show Status Message

    func showMessage(_ text: String, color: SKColor = .white, at position: CGPoint) {
        let label = SKLabelNode(fontNamed: "Copperplate")
        label.text = text
        label.fontSize = 14
        label.fontColor = color
        label.verticalAlignmentMode = .center
        label.position = position

        animatePopup(label)
    }

    // MARK: - Animation

    private func animatePopup(_ node: SKNode) {
        guard visibleCount < maxVisiblePopups else { return }

        node.alpha = 0
        node.setScale(0.5)
        addChild(node)

        let staggerY = CGFloat(visibleCount) * 24
        visibleCount += 1

        let animate = SKAction.sequence([
            SKAction.group([
                SKAction.fadeIn(withDuration: 0.15),
                SKAction.scale(to: 1.0, duration: 0.15)
            ]),
            SKAction.moveBy(x: 0, y: 50 + staggerY, duration: 1.2),
            SKAction.fadeOut(withDuration: 0.3),
            SKAction.removeFromParent(),
            SKAction.run { [weak self] in
                self?.visibleCount = max(0, (self?.visibleCount ?? 1) - 1)
            }
        ])
        node.run(animate)
    }

    // MARK: - Batch display for enemy kill

    func showEnemyRewards(xp: Int, gold: Int, items: [(name: String, rarity: String)], at position: CGPoint) {
        var delay: TimeInterval = 0

        // XP
        let xpAction = SKAction.sequence([
            SKAction.wait(forDuration: delay),
            SKAction.run { [weak self] in self?.showXPGain(xp, at: position) }
        ])
        run(xpAction)
        delay += 0.15

        // Or
        let goldAction = SKAction.sequence([
            SKAction.wait(forDuration: delay),
            SKAction.run { [weak self] in self?.showGoldGain(gold, at: position) }
        ])
        run(goldAction)
        delay += 0.15

        // Items
        for item in items {
            let itemAction = SKAction.sequence([
                SKAction.wait(forDuration: delay),
                SKAction.run { [weak self] in
                    self?.showItemDrop(itemName: item.name, rarity: item.rarity, at: position)
                }
            ])
            run(itemAction)
            delay += 0.2
        }
    }
}
