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

    /// Couleur principale de la rareté (pour bordures, textes, glows)
    var color: (r: CGFloat, g: CGFloat, b: CGFloat) {
        switch self {
        case .common:    return (0.6, 0.6, 0.6)     // Gris
        case .uncommon:  return (0.3, 0.8, 0.3)     // Vert
        case .rare:      return (0.3, 0.5, 1.0)     // Bleu
        case .epic:      return (0.7, 0.3, 0.9)     // Violet
        case .legendary: return (1.0, 0.7, 0.1)     // Orange doré
        case .cosmeric:  return (0.9, 0.1, 0.2)     // Rouge sang
        }
    }

    /// Couleur secondaire (accents, particules)
    var accentColor: (r: CGFloat, g: CGFloat, b: CGFloat) {
        switch self {
        case .common:    return (0.5, 0.5, 0.5)
        case .uncommon:  return (0.5, 1.0, 0.5)
        case .rare:      return (0.5, 0.7, 1.0)
        case .epic:      return (0.9, 0.5, 1.0)
        case .legendary: return (1.0, 0.9, 0.4)
        case .cosmeric:  return (1.0, 0.3, 0.5)
        }
    }

    /// Intensité du glow (0 = aucun, 1 = intense)
    var glowIntensity: CGFloat {
        switch self {
        case .common:    return 0
        case .uncommon:  return 0.1
        case .rare:      return 0.25
        case .epic:      return 0.4
        case .legendary: return 0.6
        case .cosmeric:  return 0.85
        }
    }

    /// Épaisseur de bordure d'équipement
    var borderWidth: CGFloat {
        switch self {
        case .common:    return 0
        case .uncommon:  return 0.5
        case .rare:      return 1.0
        case .epic:      return 1.5
        case .legendary: return 2.0
        case .cosmeric:  return 2.5
        }
    }

    /// Taille de particules (0 = pas de particules)
    var particleScale: CGFloat {
        switch self {
        case .common:    return 0
        case .uncommon:  return 0
        case .rare:      return 0.3
        case .epic:      return 0.5
        case .legendary: return 0.7
        case .cosmeric:  return 1.0
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
}

typealias WorldID = String
