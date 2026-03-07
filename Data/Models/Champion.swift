import Foundation

// MARK: - Champion Class

enum ChampionClass: String, Codable, CaseIterable {
    case mistborn         = "Brumeux"
    case radiant          = "Radieux"
    case awakener         = "Éveilleur"
    case elantrian        = "Élantrien"
    case sandMaster       = "Maître du Sable"
    case nightmarePainter = "Peintre de Cauchemars"

    var magicSystem: MagicSystemType {
        switch self {
        case .mistborn:         return .allomancy
        case .radiant:          return .surgebinding
        case .awakener:         return .awakening
        case .elantrian:        return .aonDor
        case .sandMaster:       return .sandMastery
        case .nightmarePainter: return .painting
        }
    }

    var startingWorld: WorldID {
        switch self {
        case .mistborn:         return "scadrial"
        case .radiant:          return "roshar"
        case .awakener:         return "nalthis"
        case .elantrian:        return "sel"
        case .sandMaster:       return "taldain"
        case .nightmarePainter: return "komashi"
        }
    }

    var description: String {
        switch self {
        case .mistborn:         return "Brûle des métaux pour des pouvoirs physiques et mentaux"
        case .radiant:          return "Lié à un spren, maîtrise deux Surges alimentées par la Lumière d'orage"
        case .awakener:         return "Anime les objets avec le Souffle et la BioChroma"
        case .elantrian:        return "Dessine des Aons lumineux pour canaliser le Dor"
        case .sandMaster:       return "Contrôle le sable blanc de Dayside grâce à l'énergie solaire"
        case .nightmarePainter: return "Capture et bannit les cauchemars par la peinture et l'empilement de pierres"
        }
    }
}

// MARK: - Radiant Order (pour la classe Radieux)

enum RadiantOrder: String, Codable {
    case windrunner   = "Chevalier du Vent"
    case lightweaver  = "Tisseuse de Lumière"
    case bondsmith    = "Forgeur de Liens"
    case edgedancer   = "Danseuse du Fil"
}

// MARK: - Champion Stats

struct ChampionStats: Codable {
    var vigor: Int       // PV max
    var investiture: Int // Mana/énergie magique
    var strength: Int    // Dégâts physiques
    var agility: Int     // Vitesse + esquive
    var spirit: Int      // Puissance magique
    var luck: Int        // Drop rate + crit

    static let baseStats = ChampionStats(
        vigor: 10, investiture: 10, strength: 10,
        agility: 10, spirit: 10, luck: 5
    )
}

// MARK: - Equipment Loadout

struct EquipmentLoadout: Codable {
    var helmet: String?
    var shoulders: String?
    var chest: String?
    var cape: String?
    var gloves: String?
    var belt: String?
    var legs: String?
    var boots: String?
    var mainWeapon: String?
    var offhand: String?
    var amulet: String?
    var ring1: String?
    var ring2: String?

    func itemID(for slot: EquipmentSlot) -> String? {
        switch slot {
        case .helmet:     return helmet
        case .shoulders:  return shoulders
        case .chest:      return chest
        case .cape:       return cape
        case .gloves:     return gloves
        case .belt:       return belt
        case .legs:       return legs
        case .boots:      return boots
        case .mainWeapon: return mainWeapon
        case .offhand:    return offhand
        case .amulet:     return amulet
        case .ring1:      return ring1
        case .ring2:      return ring2
        }
    }

    mutating func setItemID(_ itemID: String?, for slot: EquipmentSlot) {
        switch slot {
        case .helmet:     helmet = itemID
        case .shoulders:  shoulders = itemID
        case .chest:      chest = itemID
        case .cape:       cape = itemID
        case .gloves:     gloves = itemID
        case .belt:       belt = itemID
        case .legs:       legs = itemID
        case .boots:      boots = itemID
        case .mainWeapon: mainWeapon = itemID
        case .offhand:    offhand = itemID
        case .amulet:     amulet = itemID
        case .ring1:      ring1 = itemID
        case .ring2:      ring2 = itemID
        }
    }
}

// MARK: - Champion

struct Champion: Codable {
    var name: String
    var championClass: ChampionClass
    var radiantOrder: RadiantOrder?  // Seulement si classe Radieux

    // Progression
    var level: Int
    var currentXP: Int
    var skillPoints: Int
    var unlockedSkillIDs: [String]
    var equippedSkillIDs: [String]  // 4 slots max

    // Stats
    var baseStats: ChampionStats
    var equipment: EquipmentLoadout
    var inventoryItemIDs: [String]

    // Ressources
    var currentHP: Int
    var currentInvestiture: Int
    var gold: Int

    // Magie spécifique
    var metalReserves: [SkillResourceType: Int]?  // Allomancie
    var breathCount: Int?                          // Éveil
    var stormlightAmount: Double?                  // Surgebinding
    var waterReserve: Double?                      // Maîtrise du Sable (hydratation)
    var inkReserve: Double?                        // Peinture de Cauchemars

    // Position
    var currentWorldID: WorldID
    var currentZoneID: String
    var gridPosition: GridPosition

    // Quêtes
    var activeQuestIDs: [String]
    var completedQuestIDs: [String]

    // Réputation par monde
    var reputation: [WorldID: Int]

    // Calculé
    var xpForNextLevel: Int { level * 100 + 50 }
    var maxHP: Int { baseStats.vigor * 10 + 50 }
    var maxInvestiture: Int { baseStats.investiture * 8 + 30 }
}
