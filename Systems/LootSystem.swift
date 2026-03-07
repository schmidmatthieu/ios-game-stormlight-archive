import Foundation

/// Gère la génération de loot et les drops
final class LootSystem {

    // MARK: - Générer le loot d'un ennemi vaincu

    func generateLoot(from enemy: Enemy) -> [Item] {
        var droppedItems: [Item] = []
        let luck = GameManager.shared.champion?.effectiveStats.luck ?? 0

        for entry in enemy.lootTable {
            let roll = Double.random(in: 0...1)
            let adjustedChance = adjustDropChance(baseChance: entry.dropChance, luck: luck)
            if roll <= adjustedChance {
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
        // Chance to generate a consumable instead of equipment
        if Double.random(in: 0...1) < 0.25 {
            return generateConsumable(rarity: rarity, level: level)
        }

        let equipmentSlots = EquipmentSlot.allCases.filter { $0 != .consumable }
        let slot = equipmentSlots.randomElement() ?? .chest
        let statCount = rarity.statBonusCount

        let stats = (0..<statCount).map { _ in
            StatBonus(
                stat: StatType.allCases.randomElement() ?? .strength,
                value: Int.random(in: 1...(level + 2))
            )
        }

        let traits = generateTraits(rarity: rarity)

        return Item(
            id: UUID().uuidString,
            name: generateItemName(slot: slot, rarity: rarity),
            description: "Objet \(rarity.displayName) trouvé dans le Cosmere",
            rarity: rarity,
            slot: slot,
            requiredLevel: max(1, level - 2),
            statBonuses: stats,
            traits: traits,
            spriteName: "item_\(slot.rawValue)_\(rarity.rawValue)",
            worldOrigin: nil
        )
    }

    private func generateTraits(rarity: ItemRarity) -> [ItemTrait] {
        // Only rare+ items get traits
        let traitCount: Int
        switch rarity {
        case .common, .uncommon: return []
        case .rare:      traitCount = 1
        case .epic:      traitCount = Int.random(in: 1...2)
        case .legendary: traitCount = 2
        case .cosmeric:  traitCount = Int.random(in: 2...3)
        }

        let possibleTraits: [(TraitEffectType, String, String, ClosedRange<Double>)] = [
            (.critChance, "Précision", "Augmente les chances de critique", 0.02...0.08),
            (.lifesteal, "Vampirisme", "Vole de la vie à chaque coup", 0.03...0.10),
            (.investitureRegen, "Canalisation", "Régénère l'Investiture au combat", 0.01...0.05),
            (.damageBoostAllomancy, "Forge allomantique", "Augmente les dégâts allomantiques", 0.05...0.15),
            (.damageBoostSurgebinding, "Lumière radieuse", "Augmente les dégâts de Surgebinding", 0.05...0.15),
            (.aonDorCostReduction, "Efficacité aonique", "Réduit le coût des Aons", 0.05...0.15),
        ]

        var selected: [ItemTrait] = []
        var usedTypes: Set<String> = []

        for _ in 0..<traitCount {
            guard let pick = possibleTraits.filter({ !usedTypes.contains($0.0.rawValue) }).randomElement() else { break }
            usedTypes.insert(pick.0.rawValue)
            let value = Double.random(in: pick.3)
            selected.append(ItemTrait(
                id: UUID().uuidString,
                name: pick.1,
                description: pick.2,
                effectType: pick.0,
                effectValue: value
            ))
        }

        return selected
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

    // MARK: - Consumable Generation

    private func generateConsumable(rarity: ItemRarity, level: Int) -> Item {
        let typeRoll = Double.random(in: 0...1)
        let type: ConsumableType = typeRoll < 0.45 ? .healHP : typeRoll < 0.85 ? .restoreInvestiture : .healAndRestore

        let baseValue = (level + 2) * 5
        let rarityMultiplier: Int
        switch rarity {
        case .common:    rarityMultiplier = 1
        case .uncommon:  rarityMultiplier = 2
        case .rare:      rarityMultiplier = 3
        case .epic:      rarityMultiplier = 4
        case .legendary: rarityMultiplier = 6
        case .cosmeric:  rarityMultiplier = 8
        }
        let value = baseValue * rarityMultiplier

        let name: String
        let description: String
        switch type {
        case .healHP:
            name = "Potion de vie"
            description = "Restaure \(value) PV"
        case .restoreInvestiture:
            name = "Fiole d'Investiture"
            description = "Restaure \(value) Investiture"
        case .healAndRestore:
            name = "Élixir cosmérique"
            description = "Restaure \(value) PV et Investiture"
        }

        return Item(
            id: UUID().uuidString,
            name: name,
            description: description,
            rarity: rarity,
            slot: .consumable,
            requiredLevel: 1,
            statBonuses: [],
            traits: [],
            spriteName: "consumable_\(type.rawValue)_\(rarity.rawValue)",
            worldOrigin: nil,
            consumableEffect: ConsumableEffect(type: type, value: value)
        )
    }

    // MARK: - Appliquer le loot au champion avec bonus de chance

    func adjustDropChance(baseChance: Double, luck: Int) -> Double {
        return min(1.0, baseChance * (1.0 + Double(luck) * 0.02))
    }
}
