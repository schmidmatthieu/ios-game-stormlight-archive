import Foundation

/// Gère la génération de loot et les drops
final class LootSystem {

    // MARK: - Générer le loot d'un ennemi vaincu

    func generateLoot(from enemy: Enemy) -> [Item] {
        var droppedItems: [Item] = []

        for entry in enemy.lootTable {
            let roll = Double.random(in: 0...1)
            if roll <= entry.dropChance {
                let quantity = Int.random(in: entry.minQuantity...entry.maxQuantity)
                for _ in 0..<quantity {
                    if let item = GameManager.shared.allItems[entry.itemID] {
                        droppedItems.append(item)
                    }
                }
            }
        }

        // Loot de rareté aléatoire basé sur le tier de l'ennemi
        if let bonusItem = generateTierBonusLoot(tier: enemy.tier, level: enemy.level) {
            droppedItems.append(bonusItem)
        }

        return droppedItems
    }

    // MARK: - Loot bonus basé sur le tier

    private func generateTierBonusLoot(tier: EnemyTier, level: Int) -> Item? {
        let rarityRoll = Double.random(in: 0...100)

        let rarity: ItemRarity
        switch tier {
        case .minion:
            if rarityRoll < 80 { return nil }
            rarity = .common
        case .soldier:
            if rarityRoll < 50 { return nil }
            rarity = rarityRoll < 85 ? .common : .uncommon
        case .elite:
            rarity = selectEliteRarity(roll: rarityRoll)
        case .boss:
            rarity = selectBossRarity(roll: rarityRoll)
        }

        return generateRandomItem(rarity: rarity, level: level)
    }

    private func selectEliteRarity(roll: Double) -> ItemRarity {
        switch roll {
        case 0..<40:  return .rare
        case 40..<75: return .uncommon
        case 75..<95: return .epic
        default:      return .legendary
        }
    }

    private func selectBossRarity(roll: Double) -> ItemRarity {
        switch roll {
        case 0..<50:  return .epic
        case 50..<90: return .legendary
        default:      return .cosmeric
        }
    }

    // MARK: - Génération d'item aléatoire

    func generateRandomItem(rarity: ItemRarity, level: Int) -> Item {
        let slot = EquipmentSlot.allCases.randomElement()!
        let statCount = rarity.statBonusCount

        let stats = (0..<statCount).map { _ in
            StatBonus(
                stat: StatType.allCases.randomElement()!,
                value: Int.random(in: 1...(level + 2))
            )
        }

        return Item(
            id: UUID().uuidString,
            name: generateItemName(slot: slot, rarity: rarity),
            description: "Objet \(rarity.displayName) trouvé dans le Cosmere",
            rarity: rarity,
            slot: slot,
            requiredLevel: max(1, level - 2),
            statBonuses: stats,
            traits: [],
            spriteName: "item_\(slot.rawValue)_\(rarity.rawValue)",
            worldOrigin: nil
        )
    }

    private func generateItemName(slot: EquipmentSlot, rarity: ItemRarity) -> String {
        let prefixes: [ItemRarity: [String]] = [
            .common:    ["Usé", "Simple", "Basique"],
            .uncommon:  ["Solide", "Renforcé", "Fiable"],
            .rare:      ["Forgé", "Enchanté", "Ancien"],
            .epic:      ["Magistral", "Radieux", "Brumeux"],
            .legendary: ["Légendaire", "Divin", "Éternel"],
            .cosmeric:  ["Cosmérique", "Éclat", "Adonalsium"]
        ]

        let slotNames: [EquipmentSlot: String] = [
            .helmet: "Casque", .shoulders: "Épaulières", .chest: "Plastron",
            .cape: "Cape", .gloves: "Gants", .belt: "Ceinture",
            .legs: "Jambières", .boots: "Bottes", .mainWeapon: "Lame",
            .offhand: "Bouclier", .amulet: "Amulette", .ring1: "Anneau",
            .ring2: "Anneau"
        ]

        let prefix = prefixes[rarity]?.randomElement() ?? "Mystérieux"
        let name = slotNames[slot] ?? "Objet"
        return "\(prefix) \(name)"
    }

    // MARK: - Appliquer le loot au champion avec bonus de chance

    func adjustDropChance(baseChance: Double, luck: Int) -> Double {
        return min(1.0, baseChance * (1.0 + Double(luck) * 0.02))
    }
}
