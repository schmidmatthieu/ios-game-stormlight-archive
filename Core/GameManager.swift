import SpriteKit
import GameplayKit

/// Singleton central qui gère l'état global du jeu
final class GameManager {
    static let shared = GameManager()

    // État du jeu
    var champion: Champion?
    var currentZone: Zone?
    var activeQuests: [Quest] = []

    // Bases de données chargées depuis JSON
    var allItems: [String: Item] = [:]
    var allEnemies: [String: Enemy] = [:]
    var allQuests: [String: Quest] = [:]
    var allZones: [String: Zone] = [:]
    var allSkills: [String: Skill] = [:]

    // Références aux systèmes
    let combatSystem = CombatSystem()
    let lootSystem = LootSystem()
    let questSystem = QuestSystem()

    private init() {}

    // MARK: - Chargement des données

    func loadGameData() {
        allItems = loadJSON("items")
        allEnemies = loadJSON("enemies")
        allQuests = loadJSON("quests")
        allZones = loadJSON("zones")
        allSkills = loadJSON("skills")
    }

    private func loadJSON<T: Codable & Identifiable>(_ filename: String) -> [String: T] where T.ID == String {
        guard let url = Bundle.main.url(forResource: filename, withExtension: "json"),
              let data = try? Data(contentsOf: url),
              let items = try? JSONDecoder().decode([T].self, from: data) else {
            print("⚠️ Failed to load \(filename).json")
            return [:]
        }
        return Dictionary(uniqueKeysWithValues: items.map { ($0.id, $0) })
    }

    // MARK: - Nouvelle partie

    func startNewGame(name: String, championClass: ChampionClass, order: RadiantOrder? = nil) {
        champion = Champion(
            name: name,
            championClass: championClass,
            radiantOrder: order,
            level: 1,
            currentXP: 0,
            skillPoints: 1,
            unlockedSkillIDs: [],
            equippedSkillIDs: [],
            baseStats: .baseStats,
            equipment: EquipmentLoadout(),
            inventoryItemIDs: [],
            currentHP: 150, // baseStats.vigor * 10 + 50
            currentInvestiture: 110, // baseStats.investiture * 8 + 30
            gold: 50,
            metalReserves: championClass == .mistborn ? defaultMetalReserves() : nil,
            breathCount: championClass == .awakener ? 1 : nil,
            stormlightAmount: championClass == .radiant ? 100.0 : nil,
            currentWorldID: championClass.startingWorld,
            currentZoneID: "\(championClass.startingWorld)_hub",
            gridPosition: GridPosition(col: 5, row: 5),
            activeQuestIDs: [],
            completedQuestIDs: [],
            reputation: [:]
        )
    }

    private func defaultMetalReserves() -> [SkillResourceType: Int] {
        [
            .steel: 10, .iron: 10,
            .tin: 10, .pewter: 10,
            .bronze: 5, .copper: 5,
            .zinc: 5, .brass: 5
        ]
    }

    // MARK: - Gain XP & Level Up

    func grantXP(_ amount: Int) {
        guard var champ = champion else { return }
        champ.currentXP += amount

        while champ.currentXP >= champ.xpForNextLevel {
            champ.currentXP -= champ.xpForNextLevel
            champ.level += 1
            champ.skillPoints += 1
            champ.currentHP = champ.maxHP
            champ.currentInvestiture = champ.maxInvestiture
            print("🎉 Level up! Niveau \(champ.level)")
        }

        champion = champ
    }
}
