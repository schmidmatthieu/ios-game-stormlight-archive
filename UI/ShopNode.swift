import SpriteKit

/// Panneau de boutique pour acheter/vendre des objets chez un marchand
final class ShopNode: SKNode {

    private let screenSize: CGSize
    private let shopItemIDs: [String]
    private let shopName: String

    private let background: SKShapeNode
    private let itemListNode = SKNode()
    private let detailPanel = SKNode()
    private var selectedItemID: String?
    private var currentTab: Tab = .buy

    var onClose: (() -> Void)?

    enum Tab { case buy, sell }

    // MARK: - Init

    init(screenSize: CGSize, shopName: String, shopItemIDs: [String]) {
        self.screenSize = screenSize
        self.shopName = shopName
        self.shopItemIDs = shopItemIDs

        let panelW = screenSize.width * 0.85
        let panelH = screenSize.height * 0.7
        background = SKShapeNode(rectOf: CGSize(width: panelW, height: panelH), cornerRadius: 12)
        background.fillColor = SKColor(white: 0.08, alpha: 0.95)
        background.strokeColor = SKColor(red: 0.6, green: 0.5, blue: 0.2, alpha: 1)
        background.lineWidth = 2

        super.init()
        zPosition = 8000
        isUserInteractionEnabled = true

        addChild(background)
        addChild(itemListNode)
        addChild(detailPanel)

        setupHeader(panelW: panelW, panelH: panelH)
        setupTabs(panelW: panelW, panelH: panelH)
        refreshItemList()
    }

    required init?(coder: NSCoder) { fatalError() }

    // MARK: - Layout

    private func setupHeader(panelW: CGFloat, panelH: CGFloat) {
        let title = SKLabelNode(fontNamed: "Copperplate-Bold")
        title.text = shopName
        title.fontSize = 16
        title.fontColor = SKColor(red: 1, green: 0.85, blue: 0.4, alpha: 1)
        title.position = CGPoint(x: 0, y: panelH / 2 - 25)
        title.name = "shopTitle"
        addChild(title)

        // Gold display
        let gold = GameManager.shared.champion?.gold ?? 0
        let goldLabel = SKLabelNode(fontNamed: "Helvetica-Bold")
        goldLabel.text = "\(gold) or"
        goldLabel.fontSize = 12
        goldLabel.fontColor = SKColor(red: 1, green: 0.85, blue: 0.2, alpha: 1)
        goldLabel.horizontalAlignmentMode = .right
        goldLabel.position = CGPoint(x: panelW / 2 - 15, y: panelH / 2 - 25)
        goldLabel.name = "goldLabel"
        addChild(goldLabel)

        // Close button
        let closeBtn = SKLabelNode(fontNamed: "Helvetica-Bold")
        closeBtn.text = "X"
        closeBtn.fontSize = 16
        closeBtn.fontColor = .red
        closeBtn.horizontalAlignmentMode = .left
        closeBtn.position = CGPoint(x: -panelW / 2 + 12, y: panelH / 2 - 25)
        closeBtn.name = "shop_close"
        addChild(closeBtn)
    }

    private func setupTabs(panelW: CGFloat, panelH: CGFloat) {
        let tabY = panelH / 2 - 48

        let buyTab = createTabLabel("Acheter", name: "tab_buy", x: -50, y: tabY)
        let sellTab = createTabLabel("Vendre", name: "tab_sell", x: 50, y: tabY)
        addChild(buyTab)
        addChild(sellTab)
        updateTabColors()
    }

    private func createTabLabel(_ text: String, name: String, x: CGFloat, y: CGFloat) -> SKLabelNode {
        let label = SKLabelNode(fontNamed: "Copperplate-Bold")
        label.text = text
        label.fontSize = 13
        label.position = CGPoint(x: x, y: y)
        label.name = name
        return label
    }

    private func updateTabColors() {
        (childNode(withName: "tab_buy") as? SKLabelNode)?.fontColor = currentTab == .buy ? .white : .gray
        (childNode(withName: "tab_sell") as? SKLabelNode)?.fontColor = currentTab == .sell ? .white : .gray
    }

    // MARK: - Item List

    private func refreshItemList() {
        itemListNode.removeAllChildren()
        detailPanel.removeAllChildren()
        selectedItemID = nil

        let items: [(String, Item)]
        if currentTab == .buy {
            items = shopItemIDs.compactMap { id in
                guard let item = GameManager.shared.allItems[id] else { return nil }
                return (id, item)
            }
        } else {
            guard let champion = GameManager.shared.champion else { return }
            items = champion.inventoryItemIDs.compactMap { id in
                guard let item = GameManager.shared.item(byID: id) else { return nil }
                return (id, item)
            }
        }

        let panelH = screenSize.height * 0.7
        let startY = panelH / 2 - 75
        let panelW = screenSize.width * 0.85

        for (i, (id, item)) in items.prefix(12).enumerated() {
            let row = SKNode()
            row.position = CGPoint(x: -panelW / 4, y: startY - CGFloat(i) * 22)
            row.name = "shopitem_\(id)"

            let nameLabel = SKLabelNode(fontNamed: "Helvetica")
            nameLabel.text = item.name
            nameLabel.fontSize = 11
            nameLabel.fontColor = rarityColor(item.rarity)
            nameLabel.horizontalAlignmentMode = .left
            nameLabel.position = .zero
            nameLabel.name = "shopitem_\(id)"
            row.addChild(nameLabel)

            let price = itemPrice(item, isBuying: currentTab == .buy)
            let priceLabel = SKLabelNode(fontNamed: "Helvetica")
            priceLabel.text = "\(price) or"
            priceLabel.fontSize = 10
            priceLabel.fontColor = SKColor(red: 1, green: 0.85, blue: 0.2, alpha: 1)
            priceLabel.horizontalAlignmentMode = .right
            priceLabel.position = CGPoint(x: panelW / 2 - 20, y: 0)
            priceLabel.name = "shopitem_\(id)"
            row.addChild(priceLabel)

            itemListNode.addChild(row)
        }

        updateGoldDisplay()
    }

    // MARK: - Pricing

    private func itemPrice(_ item: Item, isBuying: Bool) -> Int {
        let basePrice: Int
        switch item.rarity {
        case .common:    basePrice = 25
        case .uncommon:  basePrice = 75
        case .rare:      basePrice = 200
        case .epic:      basePrice = 500
        case .legendary: basePrice = 1200
        case .cosmeric:  basePrice = 3000
        }
        let levelMult = max(1, item.requiredLevel)
        let price = basePrice + levelMult * 5
        return isBuying ? price : max(1, price / 3)
    }

    // MARK: - Buy / Sell

    private func buyItem(_ itemID: String) {
        guard let item = GameManager.shared.allItems[itemID] else { return }
        let price = itemPrice(item, isBuying: true)
        guard let champion = GameManager.shared.champion, champion.gold >= price else { return }

        GameManager.shared.mutateChampion { champ in
            champ.gold -= price
            champ.inventoryItemIDs.append(itemID)
        }
        GameManager.shared.questSystem.onItemCollected(itemID: itemID)
        refreshItemList()
    }

    private func sellItem(_ itemID: String) {
        guard let item = GameManager.shared.item(byID: itemID) else { return }
        let price = itemPrice(item, isBuying: false)

        GameManager.shared.mutateChampion { champ in
            if let idx = champ.inventoryItemIDs.firstIndex(of: itemID) {
                champ.inventoryItemIDs.remove(at: idx)
            }
            // Unequip if currently equipped
            for slot in EquipmentSlot.allCases {
                if champ.equipment.itemID(for: slot) == itemID {
                    champ.equipment.setItemID(nil, for: slot)
                }
            }
            champ.gold += price
        }
        refreshItemList()
    }

    // MARK: - Detail

    private func showDetail(_ itemID: String) {
        detailPanel.removeAllChildren()
        selectedItemID = itemID

        let item: Item?
        if currentTab == .buy {
            item = GameManager.shared.allItems[itemID]
        } else {
            item = GameManager.shared.item(byID: itemID)
        }
        guard let item = item else { return }

        let panelH = screenSize.height * 0.7
        let panelW = screenSize.width * 0.85
        let x = panelW / 4
        let y = panelH / 2 - 80

        let nameLabel = SKLabelNode(fontNamed: "Copperplate-Bold")
        nameLabel.text = item.name
        nameLabel.fontSize = 13
        nameLabel.fontColor = rarityColor(item.rarity)
        nameLabel.position = CGPoint(x: x, y: y)
        detailPanel.addChild(nameLabel)

        // Stats
        for (i, bonus) in item.statBonuses.enumerated() {
            let sl = SKLabelNode(fontNamed: "Helvetica")
            sl.text = "+\(bonus.value) \(bonus.stat.rawValue)"
            sl.fontSize = 10
            sl.fontColor = .green
            sl.position = CGPoint(x: x, y: y - 18 - CGFloat(i) * 13)
            detailPanel.addChild(sl)
        }

        // Traits
        let traitStartY = y - 18 - CGFloat(item.statBonuses.count) * 13
        for (i, trait) in item.traits.enumerated() {
            let tl = SKLabelNode(fontNamed: "Helvetica")
            tl.text = "\(trait.name) +\(Int(trait.effectValue * 100))%"
            tl.fontSize = 10
            tl.fontColor = SKColor(red: 0.3, green: 0.8, blue: 0.9, alpha: 1)
            tl.position = CGPoint(x: x, y: traitStartY - CGFloat(i) * 13)
            detailPanel.addChild(tl)
        }

        // Buy/Sell button
        let isBuying = currentTab == .buy
        let price = itemPrice(item, isBuying: isBuying)
        let canAfford = isBuying ? (GameManager.shared.champion?.gold ?? 0) >= price : true

        let btnY = traitStartY - CGFloat(item.traits.count) * 13 - 20
        let btn = SKShapeNode(rectOf: CGSize(width: 100, height: 26), cornerRadius: 6)
        btn.fillColor = canAfford ? SKColor(red: 0.2, green: 0.6, blue: 0.2, alpha: 1) : SKColor(white: 0.3, alpha: 1)
        btn.strokeColor = .clear
        btn.position = CGPoint(x: x, y: btnY)
        btn.name = "shop_action"
        detailPanel.addChild(btn)

        let btnLabel = SKLabelNode(fontNamed: "Copperplate-Bold")
        btnLabel.text = isBuying ? "Acheter (\(price))" : "Vendre (\(price))"
        btnLabel.fontSize = 11
        btnLabel.fontColor = canAfford ? .white : .gray
        btnLabel.verticalAlignmentMode = .center
        btnLabel.position = CGPoint(x: x, y: btnY)
        btnLabel.name = "shop_action"
        detailPanel.addChild(btnLabel)
    }

    private func updateGoldDisplay() {
        let gold = GameManager.shared.champion?.gold ?? 0
        (childNode(withName: "goldLabel") as? SKLabelNode)?.text = "\(gold) or"
    }

    // MARK: - Touch

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let touch = touches.first else { return }
        let loc = touch.location(in: self)

        for node in nodes(at: loc) {
            guard let name = node.name else { continue }

            if name == "shop_close" {
                onClose?()
                return
            }

            if name == "tab_buy" && currentTab != .buy {
                currentTab = .buy
                updateTabColors()
                refreshItemList()
                return
            }
            if name == "tab_sell" && currentTab != .sell {
                currentTab = .sell
                updateTabColors()
                refreshItemList()
                return
            }

            if name.hasPrefix("shopitem_") {
                let itemID = name.replacingOccurrences(of: "shopitem_", with: "")
                showDetail(itemID)
                return
            }

            if name == "shop_action", let itemID = selectedItemID {
                if currentTab == .buy {
                    buyItem(itemID)
                } else {
                    sellItem(itemID)
                }
                return
            }
        }
    }

    // MARK: - Utility

    private func rarityColor(_ rarity: ItemRarity) -> SKColor {
        switch rarity {
        case .common:    return .white
        case .uncommon:  return .green
        case .rare:      return SKColor(red: 0.3, green: 0.5, blue: 1, alpha: 1)
        case .epic:      return SKColor(red: 0.6, green: 0.2, blue: 0.8, alpha: 1)
        case .legendary: return SKColor(red: 1, green: 0.65, blue: 0, alpha: 1)
        case .cosmeric:  return SKColor(red: 1, green: 0.85, blue: 0.4, alpha: 1)
        }
    }
}
