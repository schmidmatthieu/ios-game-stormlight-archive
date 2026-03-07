import SpriteKit

/// UI d'inventaire plein écran — grille d'items + panneau d'équipement + stats
class InventoryNode: SKNode {

    // MARK: - Configuration

    private let screenSize: CGSize
    private let slotSize: CGFloat = 48
    private let gridCols: Int = 6
    private let gridRows: Int = 5

    // MARK: - Nodes

    private let overlay: SKShapeNode
    private let panel: SKShapeNode
    private let titleLabel: SKLabelNode
    private let closeButton: SKShapeNode
    private var itemSlots: [SKShapeNode] = []
    private var equipmentSlots: [EquipmentSlot: SKShapeNode] = [:]
    private let statsPanel: SKNode
    private let detailPanel: SKNode

    // MARK: - State

    private var selectedItemIndex: Int?
    var onClose: (() -> Void)?

    // MARK: - Init

    init(screenSize: CGSize) {
        self.screenSize = screenSize

        // Dark overlay
        overlay = SKShapeNode(rectOf: screenSize)
        overlay.fillColor = SKColor(white: 0, alpha: 0.8)
        overlay.strokeColor = .clear
        overlay.zPosition = 6000

        // Main panel
        let panelSize = CGSize(width: screenSize.width - 30, height: screenSize.height - 80)
        panel = SKShapeNode(rectOf: panelSize, cornerRadius: 16)
        panel.fillColor = SKColor(red: 0.08, green: 0.06, blue: 0.12, alpha: 0.95)
        panel.strokeColor = SKColor(red: 0.5, green: 0.4, blue: 0.2, alpha: 1.0)
        panel.lineWidth = 2
        panel.zPosition = 6001

        // Title
        titleLabel = SKLabelNode(fontNamed: "Copperplate-Bold")
        titleLabel.text = "Inventaire"
        titleLabel.fontSize = 20
        titleLabel.fontColor = SKColor(red: 0.9, green: 0.8, blue: 0.4, alpha: 1.0)
        titleLabel.position = CGPoint(x: 0, y: panelSize.height / 2 - 30)
        titleLabel.zPosition = 6002

        // Close button
        closeButton = SKShapeNode(rectOf: CGSize(width: 44, height: 44), cornerRadius: 8)
        closeButton.fillColor = SKColor(red: 0.5, green: 0.1, blue: 0.1, alpha: 0.8)
        closeButton.strokeColor = .red
        closeButton.position = CGPoint(x: panelSize.width / 2 - 30, y: panelSize.height / 2 - 30)
        closeButton.zPosition = 6002
        closeButton.name = "closeInventory"
        let xLabel = SKLabelNode(fontNamed: "Helvetica-Bold")
        xLabel.text = "X"
        xLabel.fontSize = 18
        xLabel.fontColor = .white
        xLabel.verticalAlignmentMode = .center
        xLabel.name = "closeInventory"
        closeButton.addChild(xLabel)

        statsPanel = SKNode()
        statsPanel.zPosition = 6002

        detailPanel = SKNode()
        detailPanel.zPosition = 6002

        super.init()

        addChild(overlay)
        addChild(panel)
        panel.addChild(titleLabel)
        panel.addChild(closeButton)
        panel.addChild(statsPanel)
        panel.addChild(detailPanel)

        setupEquipmentSlots()
        setupInventoryGrid()
        setupStatsDisplay()

        isUserInteractionEnabled = true
        isHidden = true
    }

    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    // MARK: - Setup

    private func setupEquipmentSlots() {
        let equipSlotPositions: [(slot: EquipmentSlot, x: CGFloat, y: CGFloat)] = [
            (.helmet,     0,    120),
            (.shoulders, -55,    80),
            (.chest,      0,     80),
            (.cape,       55,    80),
            (.gloves,    -55,    35),
            (.belt,       0,     35),
            (.legs,       0,    -10),
            (.boots,      0,    -55),
            (.mainWeapon,-80,    35),
            (.offhand,    80,    35),
            (.amulet,    -80,    80),
            (.ring1,      80,    80),
            (.ring2,      80,   120),
        ]

        let equipSection = CGPoint(x: -screenSize.width / 4, y: 0)

        for (slot, x, y) in equipSlotPositions {
            let slotNode = SKShapeNode(rectOf: CGSize(width: 40, height: 40), cornerRadius: 6)
            slotNode.fillColor = SKColor(white: 0.12, alpha: 1.0)
            slotNode.strokeColor = SKColor(red: 0.4, green: 0.3, blue: 0.15, alpha: 0.8)
            slotNode.lineWidth = 1.5
            slotNode.position = CGPoint(x: equipSection.x + x, y: equipSection.y + y)
            slotNode.zPosition = 6002
            slotNode.name = "equip_\(slot.rawValue)"

            // Slot label
            let label = SKLabelNode(fontNamed: "Helvetica")
            label.text = slotAbbreviation(slot)
            label.fontSize = 8
            label.fontColor = SKColor(white: 0.3, alpha: 0.5)
            label.verticalAlignmentMode = .center
            label.name = "equip_\(slot.rawValue)"
            slotNode.addChild(label)

            panel.addChild(slotNode)
            equipmentSlots[slot] = slotNode
        }
    }

    private func setupInventoryGrid() {
        let gridOrigin = CGPoint(
            x: screenSize.width / 6,
            y: 80
        )

        for row in 0..<gridRows {
            for col in 0..<gridCols {
                let index = row * gridCols + col
                let x = gridOrigin.x + CGFloat(col - gridCols / 2) * (slotSize + 4)
                let y = gridOrigin.y - CGFloat(row) * (slotSize + 4)

                let slot = SKShapeNode(rectOf: CGSize(width: slotSize, height: slotSize), cornerRadius: 4)
                slot.fillColor = SKColor(white: 0.08, alpha: 1.0)
                slot.strokeColor = SKColor(white: 0.25, alpha: 0.6)
                slot.lineWidth = 1
                slot.position = CGPoint(x: x, y: y)
                slot.zPosition = 6002
                slot.name = "slot_\(index)"

                panel.addChild(slot)
                itemSlots.append(slot)
            }
        }
    }

    private func setupStatsDisplay() {
        guard let champion = GameManager.shared.champion else { return }

        let statsOrigin = CGPoint(x: 0, y: -screenSize.height / 3)
        let stats: [(String, Int)] = [
            ("VIG", champion.baseStats.vigor),
            ("INV", champion.baseStats.investiture),
            ("FOR", champion.baseStats.strength),
            ("AGI", champion.baseStats.agility),
            ("ESP", champion.baseStats.spirit),
            ("CHA", champion.baseStats.luck)
        ]

        for (i, (name, value)) in stats.enumerated() {
            let x = CGFloat(i - 3) * 55 + 27

            let label = SKLabelNode(fontNamed: "Helvetica-Bold")
            label.text = "\(name)"
            label.fontSize = 10
            label.fontColor = SKColor(red: 0.7, green: 0.6, blue: 0.3, alpha: 1.0)
            label.position = CGPoint(x: x, y: statsOrigin.y + 10)
            label.zPosition = 6002
            statsPanel.addChild(label)

            let valueLabel = SKLabelNode(fontNamed: "Helvetica-Bold")
            valueLabel.text = "\(value)"
            valueLabel.fontSize = 14
            valueLabel.fontColor = .white
            valueLabel.position = CGPoint(x: x, y: statsOrigin.y - 8)
            valueLabel.zPosition = 6002
            valueLabel.name = "stat_\(name)"
            statsPanel.addChild(valueLabel)
        }

        // Gold
        let goldLabel = SKLabelNode(fontNamed: "Copperplate")
        goldLabel.text = "\(champion.gold) or"
        goldLabel.fontSize = 14
        goldLabel.fontColor = SKColor(red: 1.0, green: 0.85, blue: 0.2, alpha: 1.0)
        goldLabel.position = CGPoint(x: 0, y: statsOrigin.y - 30)
        goldLabel.zPosition = 6002
        statsPanel.addChild(goldLabel)
    }

    // MARK: - Refresh

    func refresh() {
        guard let champion = GameManager.shared.champion else { return }

        // Refresh inventory grid
        for (i, slot) in itemSlots.enumerated() {
            // Clear previous content
            slot.children.filter { $0.name?.hasPrefix("item_") ?? false }.forEach { $0.removeFromParent() }
            slot.strokeColor = SKColor(white: 0.25, alpha: 0.6)

            if i < champion.inventoryItemIDs.count {
                let itemID = champion.inventoryItemIDs[i]
                if let item = GameManager.shared.allItems[itemID] {
                    let nameLabel = SKLabelNode(fontNamed: "Helvetica")
                    nameLabel.text = String(item.name.prefix(8))
                    nameLabel.fontSize = 9
                    nameLabel.fontColor = rarityColor(item.rarity)
                    nameLabel.verticalAlignmentMode = .center
                    nameLabel.name = "item_\(i)"
                    slot.addChild(nameLabel)

                    slot.strokeColor = rarityColor(item.rarity).withAlphaComponent(0.6)
                }
            }
        }

        // Refresh equipment
        for (eqSlot, node) in equipmentSlots {
            if let itemID = champion.equipment.itemID(for: eqSlot),
               let item = GameManager.shared.allItems[itemID] {
                node.fillColor = rarityColor(item.rarity).withAlphaComponent(0.2)
                node.strokeColor = rarityColor(item.rarity)
            }
        }
    }

    // MARK: - Show/Hide

    func show() {
        isHidden = false
        refresh()
        // Fade in
        alpha = 0
        run(SKAction.fadeIn(withDuration: 0.2))
    }

    func hide() {
        run(SKAction.sequence([
            SKAction.fadeOut(withDuration: 0.15),
            SKAction.run { [weak self] in self?.isHidden = true }
        ]))
    }

    // MARK: - Touch

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let touch = touches.first else { return }
        let location = touch.location(in: panel)
        let nodes = panel.nodes(at: location)

        for node in nodes {
            if node.name == "closeInventory" || node.parent?.name == "closeInventory" {
                hide()
                onClose?()
                return
            }

            if node.name == "equipItem" || node.parent?.name == "equipItem" {
                equipSelectedItem()
                return
            }

            if let name = node.name, name.hasPrefix("slot_") {
                let indexStr = name.replacingOccurrences(of: "slot_", with: "")
                if let index = Int(indexStr) {
                    selectItem(at: index)
                }
                return
            }
        }
    }

    private func equipSelectedItem() {
        guard let index = selectedItemIndex,
              var champion = GameManager.shared.champion,
              index < champion.inventoryItemIDs.count else { return }

        let itemID = champion.inventoryItemIDs[index]
        guard let item = GameManager.shared.allItems[itemID] else { return }

        let slot = item.slot
        let previousItemID = champion.equipment.itemID(for: slot)

        // Équiper le nouvel item
        champion.equipment.setItemID(itemID, for: slot)
        champion.inventoryItemIDs.remove(at: index)

        // Remettre l'ancien item dans l'inventaire
        if let prev = previousItemID {
            champion.inventoryItemIDs.append(prev)
        }

        GameManager.shared.champion = champion
        selectedItemIndex = nil
        refresh()
    }

    private func selectItem(at index: Int) {
        guard let champion = GameManager.shared.champion,
              index < champion.inventoryItemIDs.count else { return }

        // Highlight
        selectedItemIndex = index
        for (i, slot) in itemSlots.enumerated() {
            if i == index {
                slot.fillColor = SKColor(red: 0.2, green: 0.15, blue: 0.05, alpha: 1.0)
            } else {
                slot.fillColor = SKColor(white: 0.08, alpha: 1.0)
            }
        }

        // Show item detail
        showItemDetail(champion.inventoryItemIDs[index])
    }

    private func showItemDetail(_ itemID: String) {
        detailPanel.removeAllChildren()

        guard let item = GameManager.shared.allItems[itemID] else { return }

        let y: CGFloat = -screenSize.height / 4 + 60

        let nameLabel = SKLabelNode(fontNamed: "Copperplate-Bold")
        nameLabel.text = item.name
        nameLabel.fontSize = 14
        nameLabel.fontColor = rarityColor(item.rarity)
        nameLabel.position = CGPoint(x: screenSize.width / 6, y: y)
        detailPanel.addChild(nameLabel)

        let descLabel = SKLabelNode(fontNamed: "Helvetica")
        descLabel.text = item.description
        descLabel.fontSize = 10
        descLabel.fontColor = .lightGray
        descLabel.preferredMaxLayoutWidth = 180
        descLabel.numberOfLines = 3
        descLabel.position = CGPoint(x: screenSize.width / 6, y: y - 20)
        detailPanel.addChild(descLabel)

        // Stats
        for (i, bonus) in item.statBonuses.enumerated() {
            let statLabel = SKLabelNode(fontNamed: "Helvetica")
            let sign = bonus.value > 0 ? "+" : ""
            statLabel.text = "\(sign)\(bonus.value) \(bonus.stat.rawValue)"
            statLabel.fontSize = 11
            statLabel.fontColor = bonus.value > 0 ? .green : .red
            statLabel.position = CGPoint(x: screenSize.width / 6, y: y - 50 - CGFloat(i) * 14)
            detailPanel.addChild(statLabel)
        }

        // Bouton Équiper
        let equipBtnY = y - 50 - CGFloat(item.statBonuses.count) * 14 - 25
        let equipBtn = SKShapeNode(rectOf: CGSize(width: 100, height: 36), cornerRadius: 8)
        equipBtn.fillColor = SKColor(red: 0.2, green: 0.5, blue: 0.3, alpha: 0.9)
        equipBtn.strokeColor = SKColor(red: 0.3, green: 0.7, blue: 0.4, alpha: 1.0)
        equipBtn.lineWidth = 1.5
        equipBtn.position = CGPoint(x: screenSize.width / 6, y: equipBtnY)
        equipBtn.zPosition = 6003
        equipBtn.name = "equipItem"

        let equipLabel = SKLabelNode(fontNamed: "Copperplate-Bold")
        equipLabel.text = "Équiper"
        equipLabel.fontSize = 13
        equipLabel.fontColor = .white
        equipLabel.verticalAlignmentMode = .center
        equipLabel.name = "equipItem"
        equipBtn.addChild(equipLabel)

        detailPanel.addChild(equipBtn)
    }

    // MARK: - Helpers

    private func rarityColor(_ rarity: ItemRarity) -> SKColor {
        switch rarity {
        case .common:    return SKColor(white: 0.6, alpha: 1.0)
        case .uncommon:  return SKColor(red: 0.3, green: 0.8, blue: 0.3, alpha: 1.0)
        case .rare:      return SKColor(red: 0.3, green: 0.5, blue: 1.0, alpha: 1.0)
        case .epic:      return SKColor(red: 0.7, green: 0.3, blue: 0.9, alpha: 1.0)
        case .legendary: return SKColor(red: 1.0, green: 0.6, blue: 0.1, alpha: 1.0)
        case .cosmeric:  return SKColor(red: 0.9, green: 0.1, blue: 0.2, alpha: 1.0)
        }
    }

    private func slotAbbreviation(_ slot: EquipmentSlot) -> String {
        switch slot {
        case .helmet:     return "TÊT"
        case .shoulders:  return "ÉPA"
        case .chest:      return "TOR"
        case .cape:       return "CAP"
        case .gloves:     return "GAN"
        case .belt:       return "CEI"
        case .legs:       return "JAM"
        case .boots:      return "BOT"
        case .mainWeapon: return "ARM"
        case .offhand:    return "SEC"
        case .amulet:     return "AMU"
        case .ring1:      return "AN1"
        case .ring2:      return "AN2"
        }
    }
}
