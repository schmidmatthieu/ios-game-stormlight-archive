import XCTest
@testable import CosmereChronicles

final class TalentTreeTests: XCTestCase {

    var talentSystem: TalentTreeSystem!

    override func setUp() {
        super.setUp()
        talentSystem = TalentTreeSystem()
        GameManager.shared.startNewGame(name: "Test", championClass: .mistborn)
    }

    // MARK: - Talent Data Integrity

    func testAllClassesHaveTalentTrees() {
        let trees = TalentTreeSystem.allTrees
        XCTAssertGreaterThanOrEqual(trees.count, 2) // At minimum Mistborn and Radiant
    }

    func testEachTreeHasThreeBranches() {
        for tree in TalentTreeSystem.allTrees {
            XCTAssertEqual(tree.branches.count, 3, "Tree \(tree.id) should have 3 branches")
        }
    }

    func testEachBranchHasFourTiers() {
        for tree in TalentTreeSystem.allTrees {
            for branch in tree.branches {
                XCTAssertEqual(branch.talents.count, 4,
                    "Branch \(branch.name) in \(tree.id) should have 4 talents")
            }
        }
    }

    func testTalentIDsAreUnique() {
        var allIDs = Set<String>()
        for tree in TalentTreeSystem.allTrees {
            for branch in tree.branches {
                for talent in branch.talents {
                    XCTAssertFalse(allIDs.contains(talent.id),
                        "Duplicate talent ID: \(talent.id)")
                    allIDs.insert(talent.id)
                }
            }
        }
    }

    func testTalentPrerequisitesExist() {
        let allTalentIDs = Set(TalentTreeSystem.allTrees
            .flatMap { $0.branches }
            .flatMap { $0.talents }
            .map { $0.id })

        for tree in TalentTreeSystem.allTrees {
            for branch in tree.branches {
                for talent in branch.talents {
                    if let prereqID = talent.prerequisiteID {
                        XCTAssertTrue(allTalentIDs.contains(prereqID),
                            "Talent \(talent.id) references non-existent prerequisite \(prereqID)")
                    }
                }
            }
        }
    }

    // MARK: - Unlock Logic

    func testCanUnlockTier1Talent() {
        let tier1 = TalentTreeSystem.allTrees.first!.branches.first!.talents.first!
        let canUnlock = talentSystem.canUnlockTalent(tier1, availablePoints: 1)
        XCTAssertTrue(canUnlock)
    }

    func testCannotUnlockWithoutPoints() {
        let talent = TalentTreeSystem.allTrees.first!.branches.first!.talents.first!
        let canUnlock = talentSystem.canUnlockTalent(talent, availablePoints: 0)
        XCTAssertFalse(canUnlock)
    }

    func testUnlockConsumesSkillPoint() {
        let talent = TalentTreeSystem.allTrees.first!.branches.first!.talents.first!
        let initialPoints = GameManager.shared.champion?.skillPoints ?? 0
        let result = talentSystem.unlockTalent(talent)
        XCTAssertTrue(result)
        XCTAssertEqual(GameManager.shared.champion?.skillPoints, initialPoints - 1)
    }

    func testCannotExceedMaxRank() {
        let talent = TalentTreeSystem.allTrees.first!.branches.first!.talents.first!
        GameManager.shared.mutateChampion { $0.skillPoints = 10 }

        for _ in 0..<talent.maxRank {
            _ = talentSystem.unlockTalent(talent)
        }

        let canUnlockAgain = talentSystem.canUnlockTalent(talent, availablePoints: 5)
        XCTAssertFalse(canUnlockAgain)
    }

    // MARK: - Reset

    func testResetRefundsPoints() {
        let talent = TalentTreeSystem.allTrees.first!.branches.first!.talents.first!
        GameManager.shared.mutateChampion { $0.skillPoints = 5 }
        _ = talentSystem.unlockTalent(talent)
        _ = talentSystem.unlockTalent(talent)
        _ = talentSystem.unlockTalent(talent)

        let pointsBefore = GameManager.shared.champion?.skillPoints ?? 0
        talentSystem.resetTalents()
        let pointsAfter = GameManager.shared.champion?.skillPoints ?? 0
        XCTAssertGreaterThan(pointsAfter, pointsBefore)
    }

    // MARK: - Bonus Calculation

    func testTotalBonusIsZeroWithNoTalents() {
        let bonus = talentSystem.totalBonus(for: .bonusHP)
        XCTAssertEqual(bonus, 0)
    }
}
