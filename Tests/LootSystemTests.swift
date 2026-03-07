import XCTest
@testable import CosmereChronicles

final class LootSystemTests: XCTestCase {

    let lootSystem = LootSystem()

    // MARK: - Random Item Generation

    func testGenerateRandomItemHasCorrectRarity() {
        let item = lootSystem.generateRandomItem(rarity: .epic, level: 5)
        XCTAssertEqual(item.rarity, .epic)
    }

    func testGenerateRandomItemHasCorrectLevelRange() {
        let item = lootSystem.generateRandomItem(rarity: .common, level: 10)
        XCTAssertLessThanOrEqual(item.requiredLevel, 10)
        XCTAssertGreaterThanOrEqual(item.requiredLevel, 1)
    }

    func testGenerateRandomItemHasUniqueID() {
        let item1 = lootSystem.generateRandomItem(rarity: .common, level: 1)
        let item2 = lootSystem.generateRandomItem(rarity: .common, level: 1)
        XCTAssertNotEqual(item1.id, item2.id)
    }

    func testGenerateRandomItemHasStats() {
        let item = lootSystem.generateRandomItem(rarity: .rare, level: 5)
        XCTAssertFalse(item.statBonuses.isEmpty)
    }

    func testGenerateRandomItemHasValidSlot() {
        for _ in 0..<50 {
            let item = lootSystem.generateRandomItem(rarity: .common, level: 1)
            XCTAssertTrue(EquipmentSlot.allCases.contains(item.slot))
        }
    }

    // MARK: - Drop Chance Adjustment

    func testDropChanceNeverExceedsOne() {
        let adjusted = lootSystem.adjustDropChance(baseChance: 0.9, luck: 100)
        XCTAssertLessThanOrEqual(adjusted, 1.0)
    }

    func testHigherLuckIncreasesDropChance() {
        let lowLuck = lootSystem.adjustDropChance(baseChance: 0.5, luck: 0)
        let highLuck = lootSystem.adjustDropChance(baseChance: 0.5, luck: 20)
        XCTAssertGreaterThan(highLuck, lowLuck)
    }

    func testZeroBaseChanceStaysZero() {
        let adjusted = lootSystem.adjustDropChance(baseChance: 0, luck: 50)
        XCTAssertEqual(adjusted, 0)
    }
}
