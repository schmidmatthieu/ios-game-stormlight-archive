import XCTest
@testable import CosmereChronicles

final class MagicSystemTests: XCTestCase {

    // MARK: - Helpers

    private func makeMistborn(investiture: Int = 100) -> Champion {
        Champion(
            name: "Vin", championClass: .mistborn, radiantOrder: nil,
            level: 5, currentXP: 0, skillPoints: 0,
            unlockedSkillIDs: [], equippedSkillIDs: [],
            baseStats: .baseStats, equipment: EquipmentLoadout(),
            inventoryItemIDs: [],
            currentHP: 150, currentInvestiture: investiture, gold: 0,
            metalReserves: [.steel: 10, .iron: 10, .pewter: 10, .tin: 10,
                            .bronze: 5, .copper: 5, .zinc: 5, .brass: 5],
            breathCount: nil, stormlightAmount: nil,
            currentWorldID: "scadrial", currentZoneID: "scadrial_hub",
            gridPosition: GridPosition(col: 5, row: 5),
            activeQuestIDs: [], completedQuestIDs: [], reputation: [:]
        )
    }

    private func makeRadiant(stormlight: Double = 100.0) -> Champion {
        Champion(
            name: "Kaladin", championClass: .radiant, radiantOrder: .windrunner,
            level: 5, currentXP: 0, skillPoints: 0,
            unlockedSkillIDs: [], equippedSkillIDs: [],
            baseStats: .baseStats, equipment: EquipmentLoadout(),
            inventoryItemIDs: [],
            currentHP: 150, currentInvestiture: 100, gold: 0,
            metalReserves: nil, breathCount: nil, stormlightAmount: stormlight,
            currentWorldID: "roshar", currentZoneID: "roshar_hub",
            gridPosition: GridPosition(col: 5, row: 5),
            activeQuestIDs: [], completedQuestIDs: [], reputation: [:]
        )
    }

    private func makeAwakener(breaths: Int = 50) -> Champion {
        Champion(
            name: "Vasher", championClass: .awakener, radiantOrder: nil,
            level: 5, currentXP: 0, skillPoints: 0,
            unlockedSkillIDs: [], equippedSkillIDs: [],
            baseStats: .baseStats, equipment: EquipmentLoadout(),
            inventoryItemIDs: [],
            currentHP: 150, currentInvestiture: 100, gold: 0,
            metalReserves: nil, breathCount: breaths, stormlightAmount: nil,
            currentWorldID: "nalthis", currentZoneID: "nalthis_hub",
            gridPosition: GridPosition(col: 5, row: 5),
            activeQuestIDs: [], completedQuestIDs: [], reputation: [:]
        )
    }

    private func makeSandMaster(investiture: Int = 100) -> Champion {
        Champion(
            name: "Kenton", championClass: .sandMaster, radiantOrder: nil,
            level: 5, currentXP: 0, skillPoints: 0,
            unlockedSkillIDs: [], equippedSkillIDs: [],
            baseStats: .baseStats, equipment: EquipmentLoadout(),
            inventoryItemIDs: [],
            currentHP: 150, currentInvestiture: investiture, gold: 0,
            metalReserves: nil, breathCount: nil, stormlightAmount: nil,
            currentWorldID: "taldain", currentZoneID: "taldain_hub",
            gridPosition: GridPosition(col: 5, row: 5),
            activeQuestIDs: [], completedQuestIDs: [], reputation: [:]
        )
    }

    private func makePainter(investiture: Int = 100) -> Champion {
        Champion(
            name: "Nikaro", championClass: .nightmarePainter, radiantOrder: nil,
            level: 5, currentXP: 0, skillPoints: 0,
            unlockedSkillIDs: [], equippedSkillIDs: [],
            baseStats: .baseStats, equipment: EquipmentLoadout(),
            inventoryItemIDs: [],
            currentHP: 150, currentInvestiture: investiture, gold: 0,
            metalReserves: nil, breathCount: nil, stormlightAmount: nil,
            currentWorldID: "komashi", currentZoneID: "komashi_hub",
            gridPosition: GridPosition(col: 5, row: 5),
            activeQuestIDs: [], completedQuestIDs: [], reputation: [:]
        )
    }

    private func makeElantrian(investiture: Int = 100) -> Champion {
        Champion(
            name: "Raoden", championClass: .elantrian, radiantOrder: nil,
            level: 5, currentXP: 0, skillPoints: 0,
            unlockedSkillIDs: [], equippedSkillIDs: [],
            baseStats: .baseStats, equipment: EquipmentLoadout(),
            inventoryItemIDs: [],
            currentHP: 150, currentInvestiture: investiture, gold: 0,
            metalReserves: nil, breathCount: nil, stormlightAmount: nil,
            currentWorldID: "sel", currentZoneID: "sel_hub",
            gridPosition: GridPosition(col: 5, row: 5),
            activeQuestIDs: [], completedQuestIDs: [], reputation: [:]
        )
    }

    // MARK: - Allomancy Tests

    func testBurnSteelDealsDamage() {
        let system = AllomancySystem()
        var champ = makeMistborn()
        let result = system.burnMetal(.steel, champion: &champ, targetPosition: nil)
        XCTAssertTrue(result.success)
        XCTAssertGreaterThan(result.damage, 0)
    }

    func testBurnMetalConsumesReserve() {
        let system = AllomancySystem()
        var champ = makeMistborn()
        let before = champ.metalReserves?[.steel] ?? 0
        _ = system.burnMetal(.steel, champion: &champ, targetPosition: nil)
        let after = champ.metalReserves?[.steel] ?? 0
        XCTAssertEqual(after, before - 1)
    }

    func testBurnEmptyReserveFails() {
        let system = AllomancySystem()
        var champ = makeMistborn()
        champ.metalReserves?[.steel] = 0
        let result = system.burnMetal(.steel, champion: &champ, targetPosition: nil)
        XCTAssertFalse(result.success)
    }

    // MARK: - Surgebinding Tests

    func testGravitationSurge() {
        let system = SurgebindingSystem()
        var champ = makeRadiant()
        let result = system.useSurge(.gravitation, champion: &champ, targetPosition: nil)
        XCTAssertTrue(result.success)
        XCTAssertEqual(result.statusEffect, .flying)
    }

    func testProgressionHeals() {
        let system = SurgebindingSystem()
        var champ = makeRadiant()
        champ.currentHP = 50
        let result = system.useSurge(.progression, champion: &champ, targetPosition: nil)
        XCTAssertTrue(result.success)
        XCTAssertGreaterThan(result.healing, 0)
        XCTAssertGreaterThan(champ.currentHP, 50)
    }

    func testNoStormlightFails() {
        let system = SurgebindingSystem()
        var champ = makeRadiant(stormlight: 0)
        let result = system.useSurge(.gravitation, champion: &champ, targetPosition: nil)
        XCTAssertFalse(result.success)
    }

    // MARK: - Awakening Tests

    func testAnimateClothSummonsAlly() {
        let system = AwakeningSystem()
        var champ = makeAwakener()
        let result = system.useCommand(.animateCloth, champion: &champ, targetPosition: nil)
        XCTAssertTrue(result.success)
        XCTAssertTrue(result.summonedAlly)
    }

    func testNotEnoughBreathsFails() {
        let system = AwakeningSystem()
        var champ = makeAwakener(breaths: 0)
        let result = system.useCommand(.animateCloth, champion: &champ, targetPosition: nil)
        XCTAssertFalse(result.success)
    }

    func testLifeleecherHealsAndDamages() {
        let system = AwakeningSystem()
        var champ = makeAwakener()
        champ.currentHP = 80
        let result = system.useCommand(.lifeleecher, champion: &champ, targetPosition: nil)
        XCTAssertTrue(result.success)
        XCTAssertGreaterThan(result.damage, 0)
        XCTAssertGreaterThan(result.healing, 0)
        XCTAssertGreaterThan(champ.currentHP, 80)
    }

    // MARK: - AonDor Tests

    func testDrawAonRaoDealsDamage() {
        let system = AonDorSystem()
        var champ = makeElantrian()
        let result = system.drawAon(.rao, champion: &champ, targetPosition: nil)
        XCTAssertTrue(result.success)
        XCTAssertGreaterThan(result.damage, 0)
    }

    func testDrawAonIenHeals() {
        let system = AonDorSystem()
        var champ = makeElantrian()
        champ.currentHP = 50
        let result = system.drawAon(.ien, champion: &champ, targetPosition: nil)
        XCTAssertTrue(result.success)
        XCTAssertGreaterThan(result.healing, 0)
        XCTAssertGreaterThan(champ.currentHP, 50)
    }

    func testAonCombinationDealsMoreDamage() {
        let system = AonDorSystem()
        var champ1 = makeElantrian()
        var champ2 = makeElantrian()

        let singleResult = system.drawAon(.rao, champion: &champ1, targetPosition: nil)
        let comboResult = system.drawCombination(primary: .rao, modifier: .ehe, champion: &champ2, targetPosition: nil)

        XCTAssertGreaterThan(comboResult.damage, singleResult.damage)
    }

    func testAonNoDorFails() {
        let system = AonDorSystem()
        var champ = makeElantrian(investiture: 0)
        let result = system.drawAon(.rao, champion: &champ, targetPosition: nil)
        XCTAssertFalse(result.success)
    }

    // MARK: - Sand Mastery Tests

    func testSandLashDealsDamage() {
        let system = SandMasterySystem()
        var champ = makeSandMaster()
        let result = system.useSandForm(.lash, champion: &champ, targetPosition: nil)
        XCTAssertTrue(result.success)
        XCTAssertGreaterThan(result.damage, 0)
    }

    func testSandShieldGivesShielded() {
        let system = SandMasterySystem()
        var champ = makeSandMaster()
        let result = system.useSandForm(.shield, champion: &champ, targetPosition: nil)
        XCTAssertTrue(result.success)
        XCTAssertEqual(result.statusEffect, .shielded)
    }

    func testDehydratedFails() {
        let system = SandMasterySystem()
        var champ = makeSandMaster(investiture: 0)
        let result = system.useSandForm(.lash, champion: &champ, targetPosition: nil)
        XCTAssertFalse(result.success)
    }

    func testDrinkWaterRestoresInvestiture() {
        let system = SandMasterySystem()
        var champ = makeSandMaster(investiture: 50)
        system.drinkWater(champion: &champ, amount: 20)
        XCTAssertEqual(champ.currentInvestiture, 70)
    }

    // MARK: - Painting System Tests

    func testInkSlashDealsDamage() {
        let system = PaintingSystem()
        var champ = makePainter()
        let result = system.usePaintingTechnique(.ink_slash, champion: &champ, targetPosition: nil)
        XCTAssertTrue(result.success)
        XCTAssertGreaterThan(result.damage, 0)
    }

    func testCaptureStuns() {
        let system = PaintingSystem()
        var champ = makePainter()
        let result = system.usePaintingTechnique(.capture, champion: &champ, targetPosition: nil)
        XCTAssertTrue(result.success)
        XCTAssertEqual(result.statusEffect, .stunned)
    }

    func testNoInkFails() {
        let system = PaintingSystem()
        var champ = makePainter(investiture: 0)
        let result = system.usePaintingTechnique(.ink_slash, champion: &champ, targetPosition: nil)
        XCTAssertFalse(result.success)
    }

    func testStoneStackMeditationHeals() {
        let system = PaintingSystem()
        var champ = makePainter()
        champ.currentHP = 80
        let result = system.performStoneStack(.meditation, champion: &champ)
        XCTAssertTrue(result.success)
        XCTAssertGreaterThan(champ.currentHP, 80)
    }

    // MARK: - Resource Conservation

    func testAllSystemsConsumeInvestitureOnUse() {
        let allomancy = AllomancySystem()
        let surgebinding = SurgebindingSystem()
        let aonDor = AonDorSystem()
        let sandMastery = SandMasterySystem()
        let paintingSystem = PaintingSystem()

        var m = makeMistborn()
        let mBefore = m.currentInvestiture
        _ = allomancy.burnMetal(.steel, champion: &m, targetPosition: nil)
        // Allomancy uses metal reserves, not investiture directly

        var r = makeRadiant()
        let rStormBefore = r.stormlightAmount ?? 0
        _ = surgebinding.useSurge(.gravitation, champion: &r, targetPosition: nil)
        XCTAssertLessThan(r.stormlightAmount ?? 0, rStormBefore)

        var e = makeElantrian()
        let eBefore = e.currentInvestiture
        _ = aonDor.drawAon(.rao, champion: &e, targetPosition: nil)
        XCTAssertLessThan(e.currentInvestiture, eBefore)

        var s = makeSandMaster()
        let sBefore = s.currentInvestiture
        _ = sandMastery.useSandForm(.lash, champion: &s, targetPosition: nil)
        XCTAssertLessThan(s.currentInvestiture, sBefore)

        var p = makePainter()
        let pBefore = p.currentInvestiture
        _ = paintingSystem.usePaintingTechnique(.ink_slash, champion: &p, targetPosition: nil)
        XCTAssertLessThan(p.currentInvestiture, pBefore)
    }
}
