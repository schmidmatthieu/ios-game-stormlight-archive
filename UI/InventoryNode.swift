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
            // Shadow
            let shadow = SKShapeNode(rectOf: CGSize(width: 44, height: 44), cornerRadius: 6)
            shadow.fillColor = SKColor(white: 0, alpha: 0.3)
            shadow.strokeColor = .clear
            shadow.position = CGPoint(x: equipSection.x + x + 1, y: equipSection.y + y - 1)
            shadow.zPosition = 6001
            panel.addChild(shadow)

            let slotNode = SKShapeNode(rectOf: CGSize(width: 44, height: 44), cornerRadius: 6)
            slotNode.fillColor = SKColor(white: 0.12, alpha: 1.0)
            slotNode.strokeColor = SKColor(red: 0.4, green: 0.3, blue: 0.15, alpha: 0.8)
            slotNode.lineWidth = 1.5
            slotNode.position = CGPoint(x: equipSection.x + x, y: equipSection.y + y)
            slotNode.zPosition = 6002
            slotNode.name = "equip_\(slot.rawValue)"

            // Inner shine
            let shine = SKShapeNode(rectOf: CGSize(width: 36, height: 10), cornerRadius: 3)
            shine.fillColor = SKColor(white: 1, alpha: 0.04)
            shine.strokeColor = .clear
            shine.position = CGPoint(x: 0, y: 10)
            shine.zPosition = 1
            slotNode.addChild(shine)

            // Slot icon symbol
            let icon = SKLabelNode(fontNamed: "Helvetica")
            icon.text = slotIcon(slot)
            icon.fontSize = 14
            icon.fontColor = SKColor(white: 0.2, alpha: 0.4)
            icon.verticalAlignmentMode = .center
            icon.position = CGPoint(x: 0, y: 2)
            icon.zPosition = 1
            icon.name = "equip_icon_\(slot.rawValue)"
            slotNode.addChild(icon)

            // Slot label
            let label = SKLabelNode(fontNamed: "Helvetica")
            label.text = slotAbbreviation(slot)
            label.fontSize = 8
            label.fontColor = SKColor(white: 0.3, alpha: 0.5)
            label.verticalAlignmentMode = .center
            label.position = CGPoint(x: 0, y: -14)
            label.name = "equip_\(slot.rawValue)"
            slotNode.addChild(label)

            panel.addChild(slotNode)
            equipmentSlots[slot] = slotNode
        }
    }

    private func slotIcon(_ slot: EquipmentSlot) -> String {
        switch slot {
        case .helmet:     return "⛑"
        case .shoulders:  return "⌃"
        case .chest:      return "⊞"
        case .cape:       return "◇"
        case .gloves:     return "✋"
        case .belt:       return "⊶"
        case .legs:       return "⫿"
        case .boots:      return "⊥"
        case .mainWeapon: return "⚔"
        case .offhand:    return "⊕"
        case .amulet:     return "◈"
        case .ring1:      return "○"
        case .ring2:      return "○"
        }
    }

    private func setupInventoryGrid() {
        let gridOrigin = CGPoint(
            x: screenSize.width / 6,
            y: 80
        )

        // Boutons de tri
        let sortButtons: [(label: String, name: String)] = [
            ("Rareté", "sort_rarity"),
            ("Type", "sort_type"),
            ("Nom", "sort_name")
        ]

        for (i, btn) in sortButtons.enumerated() {
            let x = gridOrigin.x + CGFloat(i - 1) * 65
            let y = gridOrigin.y + CGFloat(gridRows / 2) * (slotSize + 4) + 30

            let bg = SKShapeNode(rectOf: CGSize(width: 58, height: 24), cornerRadius: 6)
            bg.fillColor = SKColor(white: 0.12, alpha: 1.0)
            bg.strokeColor = GameConstants.Colors.panelBorder
            bg.lineWidth = 1
            bg.position = CGPoint(x: x, y: y)
            bg.zPosition = 6003
            bg.name = btn.name

            let label = SKLabelNode(fontNamed: "Helvetica")
            label.text = btn.label
            label.fontSize = 10
            label.fontColor = SKColor(white: 0.7, alpha: 1.0)
            label.verticalAlignmentMode = .center
            label.name = btn.name
            bg.addChild(label)

            panel.addChild(bg)
        }

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

        let effective = champion.effectiveStats
        let base = champion.baseStats
        let statsOrigin = CGPoint(x: 0, y: -screenSize.height / 3)
        let stats: [(String, Int, Int)] = [
            ("VIG", effective.vigor, effective.vigor - base.vigor),
            ("INV", effective.investiture, effective.investiture - base.investiture),
            ("FOR", effective.strength, effective.strength - base.strength),
            ("AGI", effective.agility, effective.agility - base.agility),
            ("ESP", effective.spirit, effective.spirit - base.spirit),
            ("CHA", effective.luck, effective.luck - base.luck)
        ]

        for (i, (name, value, bonus)) in stats.enumerated() {
            let x = CGFloat(i - 3) * 55 + 27

            let label = SKLabelNode(fontNamed: "Helvetica-Bold")
            label.text = "\(name)"
            label.fontSize = 10
            label.fontColor = SKColor(red: 0.7, green: 0.6, blue: 0.3, alpha: 1.0)
            label.position = CGPoint(x: x, y: statsOrigin.y + 10)
            label.zPosition = 6002
            statsPanel.addChild(label)

            let valueLabel = SKLabelNode(fontNamed: "Helvetica-Bold")
            valueLabel.text = bonus > 0 ? "\(value) (+\(bonus))" : "\(value)"
            valueLabel.fontSize = bonus > 0 ? 12 : 14
            valueLabel.fontColor = bonus > 0 ? SKColor(red: 0.4, green: 0.9, blue: 0.4, alpha: 1) : .white
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
        goldLabel.name = "stat_gold"
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
            // Reset to default
            node.fillColor = SKColor(white: 0.12, alpha: 1.0)
            node.strokeColor = SKColor(red: 0.4, green: 0.3, blue: 0.15, alpha: 0.8)
            node.glowWidth = 0

            // Remove previous item indicators
            node.children.filter { $0.name == "equipped_indicator" }.forEach { $0.removeFromParent() }

            if let itemID = champion.equipment.itemID(for: eqSlot),
               let item = GameManager.shared.allItems[itemID] {
                let color = rarityColor(item.rarity)
                node.fillColor = color.withAlphaComponent(0.15)
                node.strokeColor = color

                // Glow for epic+ items
                switch item.rarity {
                case .epic:      node.glowWidth = 2
                case .legendary: node.glowWidth = 4
                case .cosmeric:  node.glowWidth = 6
                default: break
                }

                // Item name abbreviation
                let nameLabel = SKLabelNode(fontNamed: "Helvetica-Bold")
                nameLabel.text = String(item.name.prefix(4))
                nameLabel.fontSize = 8
                nameLabel.fontColor = color
                nameLabel.verticalAlignmentMode = .center
                nameLabel.position = CGPoint(x: 0, y: 2)
                nameLabel.zPosition = 3
                nameLabel.name = "equipped_indicator"
                node.addChild(nameLabel)

                // Cacher le label d'emplacement vide
                node.children.filter { $0 is SKLabelNode && $0.name == "equip_\(eqSlot.rawValue)" }.forEach { $0.isHidden = true }
            } else {
                // Réafficher le label d'emplacement
                node.children.filter { $0 is SKLabelNode && $0.name == "equip_\(eqSlot.rawValue)" }.forEach { $0.isHidden = false }
            }
        }

        // Refresh stats display
        refreshStats()
    }

    private func refreshStats() {
        guard let champion = GameManager.shared.champion else { return }
        let effective = champion.effectiveStats
        let base = champion.baseStats

        let statUpdates: [(String, Int, Int)] = [
            ("VIG", effective.vigor, effective.vigor - base.vigor),
            ("INV", effective.investiture, effective.investiture - base.investiture),
            ("FOR", effective.strength, effective.strength - base.strength),
            ("AGI", effective.agility, effective.agility - base.agility),
            ("ESP", effective.spirit, effective.spirit - base.spirit),
            ("CHA", effective.luck, effective.luck - base.luck)
        ]

        for (name, value, bonus) in statUpdates {
            if let label = statsPanel.childNode(withName: "stat_\(name)") as? SKLabelNode {
                label.text = bonus > 0 ? "\(value) (+\(bonus))" : "\(value)"
                label.fontColor = bonus > 0 ? SKColor(red: 0.4, green: 0.9, blue: 0.4, alpha: 1) : .white
            }
        }

        if let goldLabel = statsPanel.childNode(withName: "stat_gold") as? SKLabelNode {
            goldLabel.text = "\(champion.gold) or"
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

            if node.name == "useButton" || node.parent?.name == "useButton" {
                useSelectedConsumable()
                return
            }

            if node.name == "discardButton" || node.parent?.name == "discardButton" {
                discardSelectedItem()
                return
            }

            // Tri de l'inventaire
            if let name = node.name ?? node.parent?.name, name.hasPrefix("sort_") {
                sortInventory(by: name)
                return
            }

            // Déséquiper un slot d'équipement
            if let name = node.name ?? node.parent?.name, name.hasPrefix("equip_") {
                let slotRaw = name.replacingOccurrences(of: "equip_", with: "")
                if let slot = EquipmentSlot(rawValue: slotRaw) {
                    unequipSlot(slot)
                }
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

    private func unequipSlot(_ slot: EquipmentSlot) {
        guard var champion = GameManager.shared.champion else { return }
        guard let itemID = champion.equipment.itemID(for: slot) else { return }

        // Vérifier que l'inventaire n'est pas plein
        guard champion.inventoryItemIDs.count < gridCols * gridRows else {
            // Feedback : inventaire plein
            if let node = equipmentSlots[slot] {
                let shake = SKAction.sequence([
                    SKAction.moveBy(x: -3, y: 0, duration: 0.03),
                    SKAction.moveBy(x: 6, y: 0, duration: 0.03),
                    SKAction.moveBy(x: -6, y: 0, duration: 0.03),
                    SKAction.moveBy(x: 3, y: 0, duration: 0.03),
                ])
                node.run(shake)
            }
            return
        }

        champion.equipment.setItemID(nil, for: slot)
        champion.inventoryItemIDs.append(itemID)
        GameManager.shared.champion = champion
        refresh()
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

        // Animation d'équipement — flash doré sur le slot
        if let equipNode = equipmentSlots[slot] {
            let originalColor = equipNode.strokeColor
            let equipFlash = SKAction.sequence([
                SKAction.run { equipNode.strokeColor = GameConstants.Colors.gold },
                SKAction.scale(to: 1.2, duration: 0.1),
                SKAction.scale(to: 1.0, duration: 0.1),
                SKAction.run { equipNode.strokeColor = originalColor }
            ])
            equipNode.run(equipFlash)
        }

        // Texte flottant "Équipé !"
        let equipText = SKLabelNode(fontNamed: "Copperplate-Bold")
        equipText.text = "Équipé !"
        equipText.fontSize = 16
        equipText.fontColor = GameConstants.Colors.gold
        equipText.position = CGPoint(x: 0, y: 0)
        equipText.zPosition = 6010
        panel.addChild(equipText)

        equipText.run(SKAction.sequence([
            SKAction.group([
                SKAction.moveBy(x: 0, y: 40, duration: 0.8),
                SKAction.sequence([
                    SKAction.fadeIn(withDuration: 0.1),
                    SKAction.wait(forDuration: 0.5),
                    SKAction.fadeOut(withDuration: 0.3)
                ])
            ]),
            SKAction.removeFromParent()
        ]))

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
        descLabel.fontSize = 12
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

        // Traits (shown below stats in cyan)
        let traitStartY = y - 50 - CGFloat(item.statBonuses.count) * 14
        for (i, trait) in item.traits.enumerated() {
            let traitLabel = SKLabelNode(fontNamed: "Helvetica")
            let percentValue = Int(trait.effectValue * 100)
            traitLabel.text = "\(trait.name) +\(percentValue)%"
            traitLabel.fontSize = 10
            traitLabel.fontColor = SKColor(red: 0.3, green: 0.8, blue: 0.9, alpha: 1)
            traitLabel.position = CGPoint(x: screenSize.width / 6, y: traitStartY - CGFloat(i) * 13)
            detailPanel.addChild(traitLabel)
        }

        // Action buttons row
        let totalInfoLines = item.statBonuses.count + item.traits.count
        let btnY = y - 55 - CGFloat(totalInfoLines) * 14

        if item.isConsumable {
            // Use button for consumables
            let useBtn = SKShapeNode(rectOf: CGSize(width: 80, height: 28), cornerRadius: 6)
            useBtn.fillColor = SKColor(red: 0.1, green: 0.3, blue: 0.5, alpha: 0.9)
            useBtn.strokeColor = SKColor(red: 0.3, green: 0.6, blue: 0.9, alpha: 1)
            useBtn.position = CGPoint(x: screenSize.width / 6 - 48, y: btnY)
            useBtn.name = "useButton"
            detailPanel.addChild(useBtn)

            let useLabel = SKLabelNode(fontNamed: "Copperplate-Bold")
            useLabel.text = "Utiliser"
            useLabel.fontSize = 12
            useLabel.fontColor = .white
            useLabel.verticalAlignmentMode = .center
            useLabel.name = "useButton"
            useBtn.addChild(useLabel)
        } else {
            // Equip button for equipment
            let equipBtn = SKShapeNode(rectOf: CGSize(width: 80, height: 28), cornerRadius: 6)
            equipBtn.fillColor = SKColor(red: 0.15, green: 0.4, blue: 0.15, alpha: 0.9)
            equipBtn.strokeColor = SKColor(red: 0.3, green: 0.7, blue: 0.3, alpha: 1)
            equipBtn.position = CGPoint(x: screenSize.width / 6 - 48, y: btnY)
            equipBtn.name = "equipButton"
            detailPanel.addChild(equipBtn)

            let equipLabel = SKLabelNode(fontNamed: "Copperplate-Bold")
            equipLabel.text = "Équiper"
            equipLabel.fontSize = 12
            equipLabel.fontColor = .white
            equipLabel.verticalAlignmentMode = .center
            equipLabel.name = "equipButton"
            equipBtn.addChild(equipLabel)
        }

        // Discard button (for all items)
        let discardBtn = SKShapeNode(rectOf: CGSize(width: 80, height: 28), cornerRadius: 6)
        discardBtn.fillColor = SKColor(red: 0.4, green: 0.1, blue: 0.1, alpha: 0.9)
        discardBtn.strokeColor = SKColor(red: 0.7, green: 0.2, blue: 0.2, alpha: 1)
        discardBtn.position = CGPoint(x: screenSize.width / 6 + 48, y: btnY)
        discardBtn.name = "discardButton"
        detailPanel.addChild(discardBtn)

        let discardLabel = SKLabelNode(fontNamed: "Copperplate-Bold")
        discardLabel.text = "Jeter"
        discardLabel.fontSize = 12
        discardLabel.fontColor = .white
        discardLabel.verticalAlignmentMode = .center
        discardLabel.name = "discardButton"
        discardBtn.addChild(discardLabel)
    }

    // MARK: - Equip/Unequip

    private func equipSelectedItem() {
        guard let index = selectedItemIndex,
              let champion = GameManager.shared.champion,
              index < champion.inventoryItemIDs.count else { return }

        let itemID = champion.inventoryItemIDs[index]
        guard let item = GameManager.shared.allItems[itemID] else { return }

        // Consumables cannot be equipped
        if item.isConsumable { return }

        // Check level requirement
        if champion.level < item.requiredLevel {
            return
        }

        let slot = item.slot
        GameManager.shared.mutateChampion { champ in
            // Unequip existing item to inventory
            if let existingID = champ.equipment.itemID(for: slot) {
                champ.inventoryItemIDs.append(existingID)
            }

            // Remove new item from inventory
            if let removeIdx = champ.inventoryItemIDs.firstIndex(of: itemID) {
                champ.inventoryItemIDs.remove(at: removeIdx)
            }

            // Equip
            switch slot {
            case .helmet:     champ.equipment.helmet = itemID
            case .shoulders:  champ.equipment.shoulders = itemID
            case .chest:      champ.equipment.chest = itemID
            case .cape:       champ.equipment.cape = itemID
            case .gloves:     champ.equipment.gloves = itemID
            case .belt:       champ.equipment.belt = itemID
            case .legs:       champ.equipment.legs = itemID
            case .boots:      champ.equipment.boots = itemID
            case .mainWeapon: champ.equipment.mainWeapon = itemID
            case .offhand:    champ.equipment.offhand = itemID
            case .amulet:     champ.equipment.amulet = itemID
            case .ring1:      champ.equipment.ring1 = itemID
            case .ring2:      champ.equipment.ring2 = itemID
            case .consumable: break
            }
        }

        selectedItemIndex = nil
        detailPanel.removeAllChildren()
        refresh()
    }

    private func useSelectedConsumable() {
        guard let index = selectedItemIndex,
              let champion = GameManager.shared.champion,
              index < champion.inventoryItemIDs.count else { return }

        let itemID = champion.inventoryItemIDs[index]
        guard let item = GameManager.shared.allItems[itemID],
              let effect = item.consumableEffect else { return }

        GameManager.shared.mutateChampion { champ in
            switch effect.type {
            case .healHP:
                champ.currentHP = min(champ.maxHP, champ.currentHP + effect.value)
            case .restoreInvestiture:
                champ.currentInvestiture = min(champ.maxInvestiture, champ.currentInvestiture + effect.value)
            case .healAndRestore:
                champ.currentHP = min(champ.maxHP, champ.currentHP + effect.value)
                champ.currentInvestiture = min(champ.maxInvestiture, champ.currentInvestiture + effect.value)
            }

            // Remove consumed item
            if let removeIdx = champ.inventoryItemIDs.firstIndex(of: itemID) {
                champ.inventoryItemIDs.remove(at: removeIdx)
            }
        }

        selectedItemIndex = nil
        detailPanel.removeAllChildren()
        refresh()
    }

    private func discardSelectedItem() {
        guard let index = selectedItemIndex,
              let champion = GameManager.shared.champion,
              index < champion.inventoryItemIDs.count else { return }

        let itemID = champion.inventoryItemIDs[index]
        guard let item = GameManager.shared.allItems[itemID] else { return }

        // Give some gold for discarded items
        let sellValue: Int
        switch item.rarity {
        case .common:    sellValue = 5
        case .uncommon:  sellValue = 15
        case .rare:      sellValue = 40
        case .epic:      sellValue = 100
        case .legendary: sellValue = 250
        case .cosmeric:  sellValue = 500
        }

        GameManager.shared.mutateChampion { champ in
            champ.gold += sellValue
            if let removeIdx = champ.inventoryItemIDs.firstIndex(of: itemID) {
                champ.inventoryItemIDs.remove(at: removeIdx)
            }
        }

        selectedItemIndex = nil
        detailPanel.removeAllChildren()
        refresh()
    }

    private func unequipSlot(_ slot: EquipmentSlot) {
        guard let champion = GameManager.shared.champion,
              let itemID = champion.equipment.itemID(for: slot) else { return }

        // Check inventory space
        guard champion.inventoryItemIDs.count < 30 else { return }

        GameManager.shared.mutateChampion { champ in
            // Move item to inventory
            champ.inventoryItemIDs.append(itemID)

            // Clear slot
            switch slot {
            case .helmet:     champ.equipment.helmet = nil
            case .shoulders:  champ.equipment.shoulders = nil
            case .chest:      champ.equipment.chest = nil
            case .cape:       champ.equipment.cape = nil
            case .gloves:     champ.equipment.gloves = nil
            case .belt:       champ.equipment.belt = nil
            case .legs:       champ.equipment.legs = nil
            case .boots:      champ.equipment.boots = nil
            case .mainWeapon: champ.equipment.mainWeapon = nil
            case .offhand:    champ.equipment.offhand = nil
            case .amulet:     champ.equipment.amulet = nil
            case .ring1:      champ.equipment.ring1 = nil
            case .ring2:      champ.equipment.ring2 = nil
            case .consumable: break
            }
        }

        // Show unequipped item detail
        showItemDetail(itemID)
    }

    // MARK: - Sorting

    private func sortInventory(by sortType: String) {
        GameManager.shared.mutateChampion { champ in
            let items = GameManager.shared.allItems
            champ.inventoryItemIDs.sort { a, b in
                guard let itemA = items[a], let itemB = items[b] else { return false }
                switch sortType {
                case "sort_rarity":
                    let rarityOrder: [ItemRarity] = [.cosmeric, .legendary, .epic, .rare, .uncommon, .common]
                    let idxA = rarityOrder.firstIndex(of: itemA.rarity) ?? 99
                    let idxB = rarityOrder.firstIndex(of: itemB.rarity) ?? 99
                    return idxA < idxB
                case "sort_type":
                    return itemA.slot.rawValue < itemB.slot.rawValue
                case "sort_name":
                    return itemA.name < itemB.name
                default:
                    return false
                }
            }
        }
        selectedItemIndex = nil
        refresh()
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
        case .consumable: return "CON"
        }
    }
}
