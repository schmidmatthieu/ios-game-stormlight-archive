import Foundation

// MARK: - Enemy Tier

enum EnemyTier: String, Codable {
    case minion   // Ennemi de base, faible
    case soldier  // Ennemi standard
    case elite    // Marqué, meilleur loot
    case boss     // Boss de zone, loot unique
}

// MARK: - AI Behavior

enum AIBehavior: String, Codable {
    case patrol     // Patrouille un chemin fixe
    case wander     // Marche aléatoirement
    case guard      // Reste en place, aggro à portée
    case ambush     // Caché, attaque par surprise
    case ranged     // Préfère la distance
    case berserk    // Charge aveuglément
    case support    // Buff/heal d'autres ennemis
}

// MARK: - Loot Entry

struct LootEntry: Codable {
    let itemID: String
    let dropChance: Double  // 0.0 - 1.0
    let minQuantity: Int
    let maxQuantity: Int
}

// MARK: - Enemy

struct Enemy: Codable, Identifiable {
    let id: String
    let name: String
    let description: String
    let worldID: WorldID
    let tier: EnemyTier

    // Stats
    let level: Int
    let maxHP: Int
    let damage: Int
    let defense: Int
    let speed: Double
    let detectionRange: Double  // Portée d'aggro
    let attackRange: Double

    // Behavior
    let behavior: AIBehavior
    let abilities: [String]  // Skill IDs utilisables

    // Visuel
    let spriteName: String
    let spriteScale: Double

    // Récompenses
    let xpReward: Int
    let goldReward: ClosedRange<Int>
    let lootTable: [LootEntry]
}

// Extend ClosedRange to be Codable for Int
extension Enemy {
    enum CodingKeys: String, CodingKey {
        case id, name, description, worldID, tier
        case level, maxHP, damage, defense, speed
        case detectionRange, attackRange
        case behavior, abilities, spriteName, spriteScale
        case xpReward, goldMin, goldMax, lootTable
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(String.self, forKey: .id)
        name = try c.decode(String.self, forKey: .name)
        description = try c.decode(String.self, forKey: .description)
        worldID = try c.decode(WorldID.self, forKey: .worldID)
        tier = try c.decode(EnemyTier.self, forKey: .tier)
        level = try c.decode(Int.self, forKey: .level)
        maxHP = try c.decode(Int.self, forKey: .maxHP)
        damage = try c.decode(Int.self, forKey: .damage)
        defense = try c.decode(Int.self, forKey: .defense)
        speed = try c.decode(Double.self, forKey: .speed)
        detectionRange = try c.decode(Double.self, forKey: .detectionRange)
        attackRange = try c.decode(Double.self, forKey: .attackRange)
        behavior = try c.decode(AIBehavior.self, forKey: .behavior)
        abilities = try c.decode([String].self, forKey: .abilities)
        spriteName = try c.decode(String.self, forKey: .spriteName)
        spriteScale = try c.decode(Double.self, forKey: .spriteScale)
        xpReward = try c.decode(Int.self, forKey: .xpReward)
        let goldMin = try c.decode(Int.self, forKey: .goldMin)
        let goldMax = try c.decode(Int.self, forKey: .goldMax)
        goldReward = goldMin...goldMax
        lootTable = try c.decode([LootEntry].self, forKey: .lootTable)
    }

    func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(id, forKey: .id)
        try c.encode(name, forKey: .name)
        try c.encode(description, forKey: .description)
        try c.encode(worldID, forKey: .worldID)
        try c.encode(tier, forKey: .tier)
        try c.encode(level, forKey: .level)
        try c.encode(maxHP, forKey: .maxHP)
        try c.encode(damage, forKey: .damage)
        try c.encode(defense, forKey: .defense)
        try c.encode(speed, forKey: .speed)
        try c.encode(detectionRange, forKey: .detectionRange)
        try c.encode(attackRange, forKey: .attackRange)
        try c.encode(behavior, forKey: .behavior)
        try c.encode(abilities, forKey: .abilities)
        try c.encode(spriteName, forKey: .spriteName)
        try c.encode(spriteScale, forKey: .spriteScale)
        try c.encode(xpReward, forKey: .xpReward)
        try c.encode(goldReward.lowerBound, forKey: .goldMin)
        try c.encode(goldReward.upperBound, forKey: .goldMax)
        try c.encode(lootTable, forKey: .lootTable)
    }
}
