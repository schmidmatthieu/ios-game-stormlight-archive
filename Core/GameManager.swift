import SpriteKit
import GameplayKit

/// Singleton central qui gère l'état global du jeu
/// Thread-safe via DispatchQueue pour les accès concurrents
final class GameManager {
    static let shared = GameManager()

    // MARK: - Thread Safety

    private let stateQueue = DispatchQueue(label: "com.cosmerechronicles.gamestate", attributes: .concurrent)

    // MARK: - Game State (thread-safe accessors)

    private var _champion: Champion?
    var champion: Champion? {
        get { stateQueue.sync { _champion } }
        set { stateQueue.async(flags: .barrier) { self._champion = newValue } }
    }

    private var _currentZone: Zone?
    var currentZone: Zone? {
        get { stateQueue.sync { _currentZone } }
        set { stateQueue.async(flags: .barrier) { self._currentZone = newValue } }
    }

    private var _activeQuests: [Quest] = []
    var activeQuests: [Quest] {
        get { stateQueue.sync { _activeQuests } }
        set { stateQueue.async(flags: .barrier) { self._activeQuests = newValue } }
    }

    // MARK: - Data (read-only after load, no synchronization needed)

    private(set) var allItems: [String: Item] = [:]
    private(set) var allEnemies: [String: Enemy] = [:]
    private(set) var allQuests: [String: Quest] = [:]
    private(set) var allZones: [String: Zone] = [:]
    private(set) var allSkills: [String: Skill] = [:]

    // MARK: - Systems

    let combatSystem = CombatSystem()
    let lootSystem = LootSystem()
    let questSystem = QuestSystem()
    let talentTree = TalentTreeSystem()

    private init() {}

    // MARK: - Data Loading

    func loadGameData() {
        allItems = loadJSON("items")
        allEnemies = loadJSON("enemies")
        allQuests = loadJSON("quests")
        allZones = loadJSON("zones")
        allSkills = loadJSON("skills")
    }

    private func loadJSON<T: Codable & Identifiable>(_ filename: String) -> [String: T] where T.ID == String {
        guard let url = Bundle.main.url(forResource: filename, withExtension: "json") else {
            print("⚠️ \(filename).json not found in bundle")
            return [:]
        }

        do {
            let data = try Data(contentsOf: url)
            let items = try JSONDecoder().decode([T].self, from: data)
            // Use reduce to safely handle duplicate IDs (last wins)
            return items.reduce(into: [:]) { result, item in
                result[item.id] = item
            }
        } catch {
            print("⚠️ Failed to decode \(filename).json: \(error.localizedDescription)")
            return [:]
        }
    }

    // MARK: - New Game

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
            currentHP: 150,
            currentInvestiture: 110,
            gold: 50,
            metalReserves: championClass == .mistborn ? defaultMetalReserves() : nil,
            breathCount: championClass == .awakener ? 1 : nil,
            stormlightAmount: championClass == .radiant ? 100.0 : nil,
            waterReserve: championClass == .sandMaster ? 100.0 : nil,
            inkReserve: championClass == .nightmarePainter ? 100.0 : nil,
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

    // MARK: - Thread-Safe Champion Mutations

    /// Perform a synchronized mutation on the champion struct
    func mutateChampion(_ mutation: (inout Champion) -> Void) {
        stateQueue.sync(flags: .barrier) {
            guard var champ = _champion else { return }
            mutation(&champ)
            _champion = champ
        }
    }

    // MARK: - Data Accessors

    func item(byID id: String) -> Item? {
        allItems[id]
    }

    /// Register a dynamically generated item so it can be looked up by ID
    func registerItem(_ item: Item) {
        allItems[item.id] = item
    }

    func skill(byID id: String) -> Skill? {
        allSkills[id]
    }

    func enemy(byID id: String) -> Enemy? {
        allEnemies[id]
    }

    func zone(byID id: String) -> Zone? {
        allZones[id]
    }

    func quest(byID id: String) -> Quest? {
        allQuests[id]
    }

    // MARK: - XP & Level Up

    func grantXP(_ amount: Int) {
        mutateChampion { champ in
            champ.currentXP += amount

            while champ.currentXP >= champ.xpForNextLevel {
                champ.currentXP -= champ.xpForNextLevel
                champ.level += 1
                champ.skillPoints += 1
                champ.currentHP = champ.maxHP
                champ.currentInvestiture = champ.maxInvestiture
            }
        }
    }
}
