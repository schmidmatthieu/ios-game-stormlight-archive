import SpriteKit

/// Système de rendu visuel de l'équipement — chaque objet modifie l'apparence du champion
/// Les designs sont cohérents avec le niveau de rareté
final class EquipmentVisualSystem {

    // MARK: - Equipment Appearance Data

    /// Données visuelles calculées à partir de l'équipement porté
    struct EquipmentAppearance {
        var helmetStyle: HelmetStyle = .none
        var helmetRarity: ItemRarity = .common
        var shoulderStyle: ShoulderStyle = .none
        var shoulderRarity: ItemRarity = .common
        var chestStyle: ChestStyle = .none
        var chestRarity: ItemRarity = .common
        var capeStyle: CapeStyle = .none
        var capeRarity: ItemRarity = .common
        var gloveStyle: GloveStyle = .none
        var gloveRarity: ItemRarity = .common
        var beltStyle: BeltStyle = .none
        var beltRarity: ItemRarity = .common
        var legStyle: LegStyle = .none
        var legRarity: ItemRarity = .common
        var bootStyle: BootStyle = .none
        var bootRarity: ItemRarity = .common
        var weaponStyle: WeaponStyle = .classDefault
        var weaponRarity: ItemRarity = .common
        var offhandStyle: OffhandStyle = .none
        var offhandRarity: ItemRarity = .common
        var amuletRarity: ItemRarity? = nil
        var ringCount: Int = 0
        var bestRingRarity: ItemRarity = .common

        /// Rareté la plus élevée parmi tout l'équipement visible
        var highestVisibleRarity: ItemRarity = .common
        /// Moyenne pondérée pour l'aura globale
        var overallTier: Int = 0
    }

    enum HelmetStyle: String {
        case none, light, medium, heavy, crown, hood
    }
    enum ShoulderStyle: String {
        case none, padded, plated, spiked, ornate, floating
    }
    enum ChestStyle: String {
        case none, cloth, leather, chain, plate, robe
    }
    enum CapeStyle: String {
        case none, short, medium, long, tattered, royal
    }
    enum GloveStyle: String {
        case none, cloth, leather, gauntlet, runic, celestial
    }
    enum BeltStyle: String {
        case none, simple, studded, ornate, runic, cosmic
    }
    enum LegStyle: String {
        case none, cloth, leather, chain, plate, ethereal
    }
    enum BootStyle: String {
        case none, sandals, leather, armored, runic, hovering
    }
    enum WeaponStyle: String {
        case classDefault, enhanced, rare, epic, legendary, cosmeric
    }
    enum OffhandStyle: String {
        case none, buckler, shield, orb, tome, relic
    }

    // MARK: - Build Appearance from Equipment

    /// Construit l'apparence visuelle à partir de l'équipement du champion
    static func buildAppearance(from champion: Champion) -> EquipmentAppearance {
        var appearance = EquipmentAppearance()
        var rarityValues: [Int] = []

        // Helmet
        if let itemID = champion.equipment.helmet,
           let item = GameManager.shared.item(byID: itemID) {
            appearance.helmetRarity = item.rarity
            appearance.helmetStyle = helmetStyle(for: item)
            rarityValues.append(rarityIndex(item.rarity))
        }

        // Shoulders
        if let itemID = champion.equipment.shoulders,
           let item = GameManager.shared.item(byID: itemID) {
            appearance.shoulderRarity = item.rarity
            appearance.shoulderStyle = shoulderStyle(for: item)
            rarityValues.append(rarityIndex(item.rarity))
        }

        // Chest
        if let itemID = champion.equipment.chest,
           let item = GameManager.shared.item(byID: itemID) {
            appearance.chestRarity = item.rarity
            appearance.chestStyle = chestStyle(for: item)
            rarityValues.append(rarityIndex(item.rarity))
        }

        // Cape
        if let itemID = champion.equipment.cape,
           let item = GameManager.shared.item(byID: itemID) {
            appearance.capeRarity = item.rarity
            appearance.capeStyle = capeStyle(for: item)
            rarityValues.append(rarityIndex(item.rarity))
        }

        // Gloves
        if let itemID = champion.equipment.gloves,
           let item = GameManager.shared.item(byID: itemID) {
            appearance.gloveRarity = item.rarity
            appearance.gloveStyle = gloveStyle(for: item)
            rarityValues.append(rarityIndex(item.rarity))
        }

        // Belt
        if let itemID = champion.equipment.belt,
           let item = GameManager.shared.item(byID: itemID) {
            appearance.beltRarity = item.rarity
            appearance.beltStyle = beltStyle(for: item)
            rarityValues.append(rarityIndex(item.rarity))
        }

        // Legs
        if let itemID = champion.equipment.legs,
           let item = GameManager.shared.item(byID: itemID) {
            appearance.legRarity = item.rarity
            appearance.legStyle = legStyle(for: item)
            rarityValues.append(rarityIndex(item.rarity))
        }

        // Boots
        if let itemID = champion.equipment.boots,
           let item = GameManager.shared.item(byID: itemID) {
            appearance.bootRarity = item.rarity
            appearance.bootStyle = bootStyle(for: item)
            rarityValues.append(rarityIndex(item.rarity))
        }

        // Weapon
        if let itemID = champion.equipment.mainWeapon,
           let item = GameManager.shared.item(byID: itemID) {
            appearance.weaponRarity = item.rarity
            appearance.weaponStyle = weaponStyle(for: item)
            rarityValues.append(rarityIndex(item.rarity))
        }

        // Offhand
        if let itemID = champion.equipment.offhand,
           let item = GameManager.shared.item(byID: itemID) {
            appearance.offhandRarity = item.rarity
            appearance.offhandStyle = offhandStyle(for: item)
            rarityValues.append(rarityIndex(item.rarity))
        }

        // Amulet
        if let itemID = champion.equipment.amulet,
           let item = GameManager.shared.item(byID: itemID) {
            appearance.amuletRarity = item.rarity
            rarityValues.append(rarityIndex(item.rarity))
        }

        // Rings
        var ringRarities: [ItemRarity] = []
        if let itemID = champion.equipment.ring1,
           let item = GameManager.shared.item(byID: itemID) {
            ringRarities.append(item.rarity)
            rarityValues.append(rarityIndex(item.rarity))
        }
        if let itemID = champion.equipment.ring2,
           let item = GameManager.shared.item(byID: itemID) {
            ringRarities.append(item.rarity)
            rarityValues.append(rarityIndex(item.rarity))
        }
        appearance.ringCount = ringRarities.count
        appearance.bestRingRarity = ringRarities.max(by: { rarityIndex($0) < rarityIndex($1) }) ?? .common

        // Calculate overall tier
        if !rarityValues.isEmpty {
            appearance.overallTier = rarityValues.reduce(0, +) / rarityValues.count
            appearance.highestVisibleRarity = rarityFromIndex(rarityValues.max() ?? 0)
        }

        return appearance
    }

    // MARK: - Style Selection Helpers

    private static func helmetStyle(for item: Item) -> HelmetStyle {
        switch item.rarity {
        case .common:    return .light
        case .uncommon:  return .medium
        case .rare:      return .heavy
        case .epic:      return .hood
        case .legendary: return .crown
        case .cosmeric:  return .crown
        }
    }

    private static func shoulderStyle(for item: Item) -> ShoulderStyle {
        switch item.rarity {
        case .common:    return .padded
        case .uncommon:  return .plated
        case .rare:      return .spiked
        case .epic:      return .ornate
        case .legendary: return .floating
        case .cosmeric:  return .floating
        }
    }

    private static func chestStyle(for item: Item) -> ChestStyle {
        switch item.rarity {
        case .common:    return .cloth
        case .uncommon:  return .leather
        case .rare:      return .chain
        case .epic:      return .plate
        case .legendary: return .robe
        case .cosmeric:  return .robe
        }
    }

    private static func capeStyle(for item: Item) -> CapeStyle {
        switch item.rarity {
        case .common:    return .short
        case .uncommon:  return .medium
        case .rare:      return .long
        case .epic:      return .tattered
        case .legendary: return .royal
        case .cosmeric:  return .royal
        }
    }

    private static func gloveStyle(for item: Item) -> GloveStyle {
        switch item.rarity {
        case .common:    return .cloth
        case .uncommon:  return .leather
        case .rare:      return .gauntlet
        case .epic:      return .runic
        case .legendary: return .celestial
        case .cosmeric:  return .celestial
        }
    }

    private static func beltStyle(for item: Item) -> BeltStyle {
        switch item.rarity {
        case .common:    return .simple
        case .uncommon:  return .studded
        case .rare:      return .ornate
        case .epic:      return .runic
        case .legendary: return .cosmic
        case .cosmeric:  return .cosmic
        }
    }

    private static func legStyle(for item: Item) -> LegStyle {
        switch item.rarity {
        case .common:    return .cloth
        case .uncommon:  return .leather
        case .rare:      return .chain
        case .epic:      return .plate
        case .legendary: return .ethereal
        case .cosmeric:  return .ethereal
        }
    }

    private static func bootStyle(for item: Item) -> BootStyle {
        switch item.rarity {
        case .common:    return .sandals
        case .uncommon:  return .leather
        case .rare:      return .armored
        case .epic:      return .runic
        case .legendary: return .hovering
        case .cosmeric:  return .hovering
        }
    }

    private static func weaponStyle(for item: Item) -> WeaponStyle {
        switch item.rarity {
        case .common:    return .classDefault
        case .uncommon:  return .enhanced
        case .rare:      return .rare
        case .epic:      return .epic
        case .legendary: return .legendary
        case .cosmeric:  return .cosmeric
        }
    }

    private static func offhandStyle(for item: Item) -> OffhandStyle {
        switch item.rarity {
        case .common:    return .buckler
        case .uncommon:  return .shield
        case .rare:      return .orb
        case .epic:      return .tome
        case .legendary: return .relic
        case .cosmeric:  return .relic
        }
    }

    // MARK: - Rarity Index Helpers

    private static func rarityIndex(_ rarity: ItemRarity) -> Int {
        switch rarity {
        case .common:    return 0
        case .uncommon:  return 1
        case .rare:      return 2
        case .epic:      return 3
        case .legendary: return 4
        case .cosmeric:  return 5
        }
    }

    private static func rarityFromIndex(_ index: Int) -> ItemRarity {
        switch index {
        case 0: return .common
        case 1: return .uncommon
        case 2: return .rare
        case 3: return .epic
        case 4: return .legendary
        default: return .cosmeric
        }
    }

    // MARK: - SKColor Helpers

    static func skColor(for rarity: ItemRarity, alpha: CGFloat = 1.0) -> SKColor {
        let c = rarity.color
        return SKColor(red: c.r, green: c.g, blue: c.b, alpha: alpha)
    }

    static func skAccentColor(for rarity: ItemRarity, alpha: CGFloat = 1.0) -> SKColor {
        let c = rarity.accentColor
        return SKColor(red: c.r, green: c.g, blue: c.b, alpha: alpha)
    }
}
