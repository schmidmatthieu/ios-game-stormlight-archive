import XCTest
@testable import CosmereChronicles

final class CombatSystemTests: XCTestCase {

    let combatSystem = CombatSystem()

    // MARK: - Player → Enemy Damage

    func testDamageResultIsPositive() {
        let stats = ChampionStats.baseStats
        let enemy = makeEnemy(defense: 0)
        let result = combatSystem.calculateDamage(attacker: stats, skill: nil, defender: enemy)
        XCTAssertGreaterThan(result.mitigatedDamage, 0)
    }

    func testHighDefenseReducesEnemyDamage() {
        let enemy = makeEnemy(damage: 20, defense: 0)

        var lowDefStats = ChampionStats.baseStats
        var highDefStats = ChampionStats.baseStats
        highDefStats.vigor = 30
        highDefStats.agility = 20

        let lowDefDamage = combatSystem.calculateEnemyDamage(enemy: enemy, defenderStats: lowDefStats)
        let highDefDamage = combatSystem.calculateEnemyDamage(enemy: enemy, defenderStats: highDefStats)
        XCTAssertLessThanOrEqual(highDefDamage, lowDefDamage)
    }

    // MARK: - Enemy → Player Damage

    func testEnemyDamageMinimumIsOne() {
        let weakEnemy = makeEnemy(damage: 1, defense: 0)
        var tankStats = ChampionStats.baseStats
        tankStats.vigor = 200
        tankStats.agility = 200
        let damage = combatSystem.calculateEnemyDamage(enemy: weakEnemy, defenderStats: tankStats)
        XCTAssertGreaterThanOrEqual(damage, 1)
    }

    // MARK: - Range Check

    func testInRangeDetection() {
        let pos1 = GridPosition(col: 5, row: 5)
        let pos2 = GridPosition(col: 7, row: 5)
        XCTAssertTrue(combatSystem.isInRange(attackerPos: pos1, targetPos: pos2, range: 3.0))
        XCTAssertFalse(combatSystem.isInRange(attackerPos: pos1, targetPos: pos2, range: 1.0))
    }

    func testSamePositionIsInRange() {
        let pos = GridPosition(col: 5, row: 5)
        XCTAssertTrue(combatSystem.isInRange(attackerPos: pos, targetPos: pos, range: 0))
    }

    // MARK: - Helpers

    private func makeEnemy(damage: Int = 10, defense: Int = 5) -> Enemy {
        Enemy(
            id: "test", name: "Test", description: "",
            worldID: "scadrial", tier: .minion, level: 1,
            maxHP: 50, damage: damage, defense: defense, speed: 1.0,
            detectionRange: 5, attackRange: 2, behavior: .wander,
            abilities: [], spriteName: "", spriteScale: 1.0,
            xpReward: 10, goldReward: 1...5, lootTable: []
        )
    }
}
