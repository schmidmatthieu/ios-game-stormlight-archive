import GameplayKit

/// Composant d'inventaire — items, équipement, or
class InventoryComponent: GKComponent {

    let capacity: Int
    private(set) var items: [String]  // Item IDs
    var equipment: EquipmentLoadout
    var gold: Int

    init(capacity: Int = 40, gold: Int = 0) {
        self.capacity = capacity
        self.items = []
        self.equipment = EquipmentLoadout(
            helmet: nil, shoulders: nil, chest: nil, cape: nil,
            gloves: nil, belt: nil, legs: nil, boots: nil,
            mainWeapon: nil, offhand: nil, amulet: nil,
            ring1: nil, ring2: nil
        )
        self.gold = gold
        super.init()
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    // MARK: - Item Management

    var isFull: Bool { items.count >= capacity }

    @discardableResult
    func addItem(itemID: String) -> Bool {
        guard !isFull else { return false }
        items.append(itemID)
        return true
    }

    @discardableResult
    func removeItem(itemID: String) -> Bool {
        if let index = items.firstIndex(of: itemID) {
            items.remove(at: index)
            return true
        }
        return false
    }

    func hasItem(_ itemID: String) -> Bool {
        items.contains(itemID)
    }

    func itemCount(for itemID: String) -> Int {
        items.filter { $0 == itemID }.count
    }

    // MARK: - Equipment

    func equip(itemID: String, slot: EquipmentSlot) -> String? {
        let previousItemID = equipment.itemID(for: slot)

        switch slot {
        case .helmet:     equipment.helmet = itemID
        case .shoulders:  equipment.shoulders = itemID
        case .chest:      equipment.chest = itemID
        case .cape:       equipment.cape = itemID
        case .gloves:     equipment.gloves = itemID
        case .belt:       equipment.belt = itemID
        case .legs:       equipment.legs = itemID
        case .boots:      equipment.boots = itemID
        case .mainWeapon: equipment.mainWeapon = itemID
        case .offhand:    equipment.offhand = itemID
        case .amulet:     equipment.amulet = itemID
        case .ring1:      equipment.ring1 = itemID
        case .ring2:      equipment.ring2 = itemID
        }

        // Remove equipped item from inventory
        removeItem(itemID: itemID)

        // Return old item to inventory
        if let prev = previousItemID {
            addItem(itemID: prev)
        }

        return previousItemID
    }

    func unequip(slot: EquipmentSlot) -> String? {
        guard let itemID = equipment.itemID(for: slot),
              !isFull else { return nil }

        switch slot {
        case .helmet:     equipment.helmet = nil
        case .shoulders:  equipment.shoulders = nil
        case .chest:      equipment.chest = nil
        case .cape:       equipment.cape = nil
        case .gloves:     equipment.gloves = nil
        case .belt:       equipment.belt = nil
        case .legs:       equipment.legs = nil
        case .boots:      equipment.boots = nil
        case .mainWeapon: equipment.mainWeapon = nil
        case .offhand:    equipment.offhand = nil
        case .amulet:     equipment.amulet = nil
        case .ring1:      equipment.ring1 = nil
        case .ring2:      equipment.ring2 = nil
        }

        addItem(itemID: itemID)
        return itemID
    }

    // MARK: - Gold

    func addGold(_ amount: Int) {
        gold += amount
    }

    @discardableResult
    func spendGold(_ amount: Int) -> Bool {
        guard gold >= amount else { return false }
        gold -= amount
        return true
    }

    // MARK: - Stat bonuses from equipment

    func totalEquipmentStats() -> ChampionStats {
        var stats = ChampionStats(vigor: 0, investiture: 0, strength: 0, agility: 0, spirit: 0, luck: 0)

        let slots: [EquipmentSlot] = [.helmet, .shoulders, .chest, .cape, .gloves, .belt, .legs, .boots, .mainWeapon, .offhand, .amulet, .ring1, .ring2]

        for slot in slots {
            guard let itemID = equipment.itemID(for: slot),
                  let item = GameManager.shared.item(byID: itemID) else { continue }

            for bonus in item.statBonuses {
                switch bonus.stat {
                case "vigor":       stats.vigor += bonus.value
                case "investiture": stats.investiture += bonus.value
                case "strength":    stats.strength += bonus.value
                case "agility":     stats.agility += bonus.value
                case "spirit":      stats.spirit += bonus.value
                case "luck":        stats.luck += bonus.value
                default: break
                }
            }
        }

        return stats
    }
}
