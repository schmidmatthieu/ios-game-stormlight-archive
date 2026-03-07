import Foundation

// MARK: - Item Rarity

enum ItemRarity: String, Codable, CaseIterable {
    case common      // Gris
    case uncommon    // Vert
    case rare        // Bleu
    case epic        // Violet
    case legendary   // Orange
    case cosmeric    // Rouge sang

    var displayName: String {
        switch self {
        case .common:    return "Commun"
        case .uncommon:  return "Inhabituel"
        case .rare:      return "Rare"
        case .epic:      return "Épique"
        case .legendary: return "Légendaire"
        case .cosmeric:  return "Cosmérique"
        }
    }

    var statBonusCount: Int {
        switch self {
        case .common:    return 1
        case .uncommon:  return 2
        case .rare:      return 3
        case .epic:      return 4
        case .legendary: return 5
        case .cosmeric:  return 6
        }
    }
}

// MARK: - Equipment Slot

enum EquipmentSlot: String, Codable, CaseIterable {
    case helmet
    case shoulders
    case chest
    case cape
    case gloves
    case belt
    case legs
    case boots
    case mainWeapon
    case offhand
    case amulet
    case ring1
    case ring2
    case consumable
}

// MARK: - Stat Bonus

struct StatBonus: Codable {
    let stat: StatType
    let value: Int
}

enum StatType: String, Codable, CaseIterable {
    case vigor       // PV max
    case investiture // Mana/énergie magique
    case strength    // Dégâts physiques
    case agility     // Vitesse + esquive
    case spirit      // Puissance magique
    case luck        // Drop rate + crit
}

// MARK: - Item Trait

struct ItemTrait: Codable {
    let id: String
    let name: String
    let description: String
    let effectType: TraitEffectType
    let effectValue: Double
}

enum TraitEffectType: String, Codable {
    case damageBoostAllomancy
    case damageBoostSurgebinding
    case investitureRegen
    case summonDuration
    case aonDorCostReduction
    case allStatBoostOffWorld
    case critChance
    case lifesteal
}

// MARK: - Consumable Effect

struct ConsumableEffect: Codable {
    let type: ConsumableType
    let value: Int
}

enum ConsumableType: String, Codable {
    case healHP
    case restoreInvestiture
    case healAndRestore
}

// MARK: - Item

struct Item: Codable, Identifiable {
    let id: String
    let name: String
    let description: String
    let rarity: ItemRarity
    let slot: EquipmentSlot
    let requiredLevel: Int
    let statBonuses: [StatBonus]
    let traits: [ItemTrait]
    let spriteName: String
    let worldOrigin: WorldID?
    let consumableEffect: ConsumableEffect?

    var isConsumable: Bool { slot == .consumable }

    // Default init for backward compatibility
    init(id: String, name: String, description: String, rarity: ItemRarity,
         slot: EquipmentSlot, requiredLevel: Int, statBonuses: [StatBonus],
         traits: [ItemTrait], spriteName: String, worldOrigin: WorldID?,
         consumableEffect: ConsumableEffect? = nil) {
        self.id = id
        self.name = name
        self.description = description
        self.rarity = rarity
        self.slot = slot
        self.requiredLevel = requiredLevel
        self.statBonuses = statBonuses
        self.traits = traits
        self.spriteName = spriteName
        self.worldOrigin = worldOrigin
        self.consumableEffect = consumableEffect
    }
}

typealias WorldID = String
