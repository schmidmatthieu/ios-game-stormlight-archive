import XCTest
@testable import CosmereChronicles

final class ModelCodableTests: XCTestCase {

    // MARK: - Enemy Codable (Custom decoder for goldReward range)

    func testEnemyDecodesFromJSON() throws {
        let json = """
        {
            "id": "test_enemy",
            "name": "Test Enemy",
            "description": "A test enemy",
            "worldID": "scadrial",
            "tier": "minion",
            "level": 1,
            "maxHP": 50,
            "damage": 10,
            "defense": 5,
            "speed": 1.0,
            "detectionRange": 5.0,
            "attackRange": 2.0,
            "behavior": "wander",
            "abilities": [],
            "spriteName": "test_sprite",
            "spriteScale": 1.0,
            "xpReward": 15,
            "goldMin": 5,
            "goldMax": 15,
            "lootTable": []
        }
        """.data(using: .utf8)!

        let enemy = try JSONDecoder().decode(Enemy.self, from: json)
        XCTAssertEqual(enemy.id, "test_enemy")
        XCTAssertEqual(enemy.goldReward, 5...15)
        XCTAssertEqual(enemy.tier, .minion)
        XCTAssertEqual(enemy.behavior, .wander)
    }

    func testEnemyEncodesBackToJSON() throws {
        let enemy = Enemy(
            id: "roundtrip_test", name: "RT", description: "",
            worldID: "scadrial", tier: .boss, level: 10,
            maxHP: 500, damage: 40, defense: 20, speed: 1.5,
            detectionRange: 10, attackRange: 3, behavior: .berserk,
            abilities: ["ability_1"], spriteName: "sprite", spriteScale: 1.5,
            xpReward: 200, goldReward: 50...100, lootTable: []
        )

        let data = try JSONEncoder().encode(enemy)
        let decoded = try JSONDecoder().decode(Enemy.self, from: data)
        XCTAssertEqual(decoded.id, enemy.id)
        XCTAssertEqual(decoded.goldReward, 50...100)
        XCTAssertEqual(decoded.tier, .boss)
    }

    // MARK: - Champion Codable

    func testChampionRoundTrip() throws {
        var champion = Champion(
            name: "TestHero", championClass: .radiant, radiantOrder: .windrunner,
            level: 5, currentXP: 100, skillPoints: 3,
            unlockedSkillIDs: ["skill_1"], equippedSkillIDs: ["skill_1"],
            baseStats: .baseStats, equipment: EquipmentLoadout(),
            inventoryItemIDs: ["item_1", "item_2"],
            currentHP: 200, currentInvestiture: 150, gold: 500,
            metalReserves: nil, breathCount: nil, stormlightAmount: 200.0,
            currentWorldID: "roshar", currentZoneID: "roshar_hub",
            gridPosition: GridPosition(col: 10, row: 15),
            activeQuestIDs: ["quest_1"], completedQuestIDs: ["quest_0"],
            reputation: ["roshar": 50]
        )

        let data = try JSONEncoder().encode(champion)
        let decoded = try JSONDecoder().decode(Champion.self, from: data)
        XCTAssertEqual(decoded.name, "TestHero")
        XCTAssertEqual(decoded.championClass, .radiant)
        XCTAssertEqual(decoded.radiantOrder, .windrunner)
        XCTAssertEqual(decoded.level, 5)
        XCTAssertEqual(decoded.stormlightAmount, 200.0)
        XCTAssertEqual(decoded.gridPosition, GridPosition(col: 10, row: 15))
        XCTAssertEqual(decoded.reputation["roshar"], 50)
    }

    // MARK: - Item Codable

    func testItemDecodesFromJSON() throws {
        let json = """
        {
            "id": "test_item",
            "name": "Test Item",
            "description": "A test item",
            "rarity": "rare",
            "slot": "mainWeapon",
            "requiredLevel": 5,
            "statBonuses": [{"stat": "strength", "value": 4}],
            "traits": [],
            "spriteName": "item_test",
            "worldOrigin": "scadrial"
        }
        """.data(using: .utf8)!

        let item = try JSONDecoder().decode(Item.self, from: json)
        XCTAssertEqual(item.id, "test_item")
        XCTAssertEqual(item.rarity, .rare)
        XCTAssertEqual(item.slot, .mainWeapon)
        XCTAssertEqual(item.statBonuses.first?.stat, .strength)
        XCTAssertEqual(item.statBonuses.first?.value, 4)
    }

    // MARK: - Quest Codable

    func testQuestObjectiveCompletion() {
        let objective = QuestObjective(
            id: "obj_1", description: "Kill 3 enemies",
            type: .kill, targetID: "enemy_1",
            requiredCount: 3, currentCount: 3
        )
        XCTAssertTrue(objective.isCompleted)

        let incomplete = QuestObjective(
            id: "obj_2", description: "Kill 3 enemies",
            type: .kill, targetID: "enemy_1",
            requiredCount: 3, currentCount: 2
        )
        XCTAssertFalse(incomplete.isCompleted)
    }

    // MARK: - Zone Codable

    func testZoneDecodesFromJSON() throws {
        let json = """
        {
            "id": "test_zone",
            "name": "Test Zone",
            "description": "A test zone",
            "worldID": "scadrial",
            "type": "hub",
            "gridWidth": 20,
            "gridHeight": 20,
            "tileMapFileName": "test.sks",
            "playerSpawnPosition": {"col": 10, "row": 10},
            "connections": [],
            "npcSpawns": [],
            "enemySpawns": [],
            "lootPoints": [],
            "ambientMusicTrack": null,
            "weatherEffect": "ashfall",
            "recommendedLevel": 1
        }
        """.data(using: .utf8)!

        let zone = try JSONDecoder().decode(Zone.self, from: json)
        XCTAssertEqual(zone.id, "test_zone")
        XCTAssertEqual(zone.type, .hub)
        XCTAssertEqual(zone.weatherEffect, .ashfall)
        XCTAssertEqual(zone.gridWidth, 20)
    }

    // MARK: - GridPosition

    func testGridPositionEquality() {
        let a = GridPosition(col: 5, row: 10)
        let b = GridPosition(col: 5, row: 10)
        let c = GridPosition(col: 5, row: 11)
        XCTAssertEqual(a, b)
        XCTAssertNotEqual(a, c)
    }
}
