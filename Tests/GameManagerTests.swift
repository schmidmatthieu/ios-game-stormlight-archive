import XCTest
@testable import CosmereChronicles

final class GameManagerTests: XCTestCase {

    override func setUp() {
        super.setUp()
        GameManager.shared.champion = nil
    }

    // MARK: - New Game

    func testStartNewGameCreatesChampion() {
        GameManager.shared.startNewGame(name: "Vin", championClass: .mistborn)

        let champion = GameManager.shared.champion
        XCTAssertNotNil(champion)
        XCTAssertEqual(champion?.name, "Vin")
        XCTAssertEqual(champion?.championClass, .mistborn)
        XCTAssertEqual(champion?.level, 1)
        XCTAssertEqual(champion?.gold, 50)
        XCTAssertEqual(champion?.skillPoints, 1)
    }

    func testMistbornGetsMetalReserves() {
        GameManager.shared.startNewGame(name: "Kelsier", championClass: .mistborn)
        XCTAssertNotNil(GameManager.shared.champion?.metalReserves)
        XCTAssertEqual(GameManager.shared.champion?.metalReserves?[.steel], 10)
    }

    func testRadiantGetsStormlight() {
        GameManager.shared.startNewGame(name: "Kaladin", championClass: .radiant)
        XCTAssertNotNil(GameManager.shared.champion?.stormlightAmount)
        XCTAssertEqual(GameManager.shared.champion?.stormlightAmount, 100.0)
        XCTAssertNil(GameManager.shared.champion?.metalReserves)
    }

    func testAwakenerGetsBreath() {
        GameManager.shared.startNewGame(name: "Vivenna", championClass: .awakener)
        XCTAssertNotNil(GameManager.shared.champion?.breathCount)
        XCTAssertEqual(GameManager.shared.champion?.breathCount, 1)
    }

    func testStartingWorldMatchesClass() {
        GameManager.shared.startNewGame(name: "Test", championClass: .mistborn)
        XCTAssertEqual(GameManager.shared.champion?.currentWorldID, "scadrial")

        GameManager.shared.startNewGame(name: "Test", championClass: .radiant)
        XCTAssertEqual(GameManager.shared.champion?.currentWorldID, "roshar")

        GameManager.shared.startNewGame(name: "Test", championClass: .sandMaster)
        XCTAssertEqual(GameManager.shared.champion?.currentWorldID, "taldain")

        GameManager.shared.startNewGame(name: "Test", championClass: .nightmarePainter)
        XCTAssertEqual(GameManager.shared.champion?.currentWorldID, "komashi")
    }

    // MARK: - XP & Leveling

    func testGrantXPAddsExperience() {
        GameManager.shared.startNewGame(name: "Test", championClass: .mistborn)
        let initialXP = GameManager.shared.champion?.currentXP ?? 0
        GameManager.shared.grantXP(50)
        XCTAssertEqual(GameManager.shared.champion?.currentXP, initialXP + 50)
    }

    func testLevelUpOnSufficientXP() {
        GameManager.shared.startNewGame(name: "Test", championClass: .mistborn)
        let xpNeeded = GameManager.shared.champion?.xpForNextLevel ?? 100
        GameManager.shared.grantXP(xpNeeded)
        XCTAssertEqual(GameManager.shared.champion?.level, 2)
        XCTAssertEqual(GameManager.shared.champion?.skillPoints, 2) // started with 1 + 1 from level up
    }

    func testLevelUpRestoresHP() {
        GameManager.shared.startNewGame(name: "Test", championClass: .mistborn)
        GameManager.shared.mutateChampion { $0.currentHP = 1 }
        let xpNeeded = GameManager.shared.champion?.xpForNextLevel ?? 100
        GameManager.shared.grantXP(xpNeeded)
        XCTAssertEqual(GameManager.shared.champion?.currentHP, GameManager.shared.champion?.maxHP)
    }

    // MARK: - Thread-Safe Mutations

    func testMutateChampionSafely() {
        GameManager.shared.startNewGame(name: "Test", championClass: .mistborn)
        GameManager.shared.mutateChampion { champ in
            champ.gold += 100
        }
        XCTAssertEqual(GameManager.shared.champion?.gold, 150) // 50 initial + 100
    }

    func testConcurrentChampionAccess() {
        GameManager.shared.startNewGame(name: "Test", championClass: .mistborn)
        let expectation = expectation(description: "Concurrent access")
        expectation.expectedFulfillmentCount = 10

        for _ in 0..<10 {
            DispatchQueue.global().async {
                GameManager.shared.mutateChampion { champ in
                    champ.gold += 1
                }
                expectation.fulfill()
            }
        }

        waitForExpectations(timeout: 5)
        XCTAssertEqual(GameManager.shared.champion?.gold, 60) // 50 + 10
    }
}
