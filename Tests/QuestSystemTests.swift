import XCTest
@testable import CosmereChronicles

final class QuestSystemTests: XCTestCase {

    let questSystem = QuestSystem()

    override func setUp() {
        super.setUp()
        GameManager.shared.startNewGame(name: "TestHero", championClass: .mistborn)
        GameManager.shared.allQuests = [:]
        GameManager.shared.activeQuests = []
    }

    // MARK: - Quest Activation

    func testActivateAvailableQuest() {
        let quest = createTestQuest(id: "test_quest", status: .available)
        GameManager.shared.allQuests["test_quest"] = quest

        let result = questSystem.activateQuest("test_quest")
        XCTAssertTrue(result)
        XCTAssertEqual(GameManager.shared.allQuests["test_quest"]?.status, .active)
        XCTAssertTrue(GameManager.shared.champion?.activeQuestIDs.contains("test_quest") ?? false)
    }

    func testCannotActivateLockedQuest() {
        let quest = createTestQuest(id: "locked_quest", status: .locked)
        GameManager.shared.allQuests["locked_quest"] = quest

        let result = questSystem.activateQuest("locked_quest")
        XCTAssertFalse(result)
    }

    func testCannotActivateQuestWithMissingPrerequisites() {
        let quest = createTestQuest(id: "quest_with_prereq", status: .available, prerequisites: ["missing_quest"])
        GameManager.shared.allQuests["quest_with_prereq"] = quest

        let result = questSystem.activateQuest("quest_with_prereq")
        XCTAssertFalse(result)
    }

    func testCanActivateQuestWithCompletedPrerequisites() {
        GameManager.shared.mutateChampion { $0.completedQuestIDs = ["prereq_quest"] }

        let quest = createTestQuest(id: "quest_with_prereq", status: .available, prerequisites: ["prereq_quest"])
        GameManager.shared.allQuests["quest_with_prereq"] = quest

        let result = questSystem.activateQuest("quest_with_prereq")
        XCTAssertTrue(result)
    }

    // MARK: - Event Tracking

    func testOnEnemyKilledUpdatesObjective() {
        var quest = createTestQuest(id: "kill_quest", status: .available)
        quest.objectives = [
            QuestObjective(id: "obj_1", description: "Tuer 3 skaa", type: .kill,
                          targetID: "corrupted_skaa", requiredCount: 3, currentCount: 0)
        ]
        GameManager.shared.allQuests["kill_quest"] = quest
        _ = questSystem.activateQuest("kill_quest")

        questSystem.onEnemyKilled(enemyID: "corrupted_skaa")

        let updated = GameManager.shared.allQuests["kill_quest"]
        XCTAssertEqual(updated?.objectives.first?.currentCount, 1)
    }

    func testOnItemCollectedUpdatesObjective() {
        var quest = createTestQuest(id: "collect_quest", status: .available)
        quest.objectives = [
            QuestObjective(id: "obj_1", description: "Collecter 5 fioles", type: .collect,
                          targetID: "steel_vial", requiredCount: 5, currentCount: 0)
        ]
        GameManager.shared.allQuests["collect_quest"] = quest
        _ = questSystem.activateQuest("collect_quest")

        questSystem.onItemCollected(itemID: "steel_vial")

        let updated = GameManager.shared.allQuests["collect_quest"]
        XCTAssertEqual(updated?.objectives.first?.currentCount, 1)
    }

    // MARK: - Helpers

    private func createTestQuest(id: String, status: QuestStatus, prerequisites: [String] = []) -> Quest {
        Quest(
            id: id, name: "Test Quest", description: "A test",
            type: .side, worldID: "scadrial", requiredLevel: 1,
            prerequisites: prerequisites, status: status,
            objectives: [
                QuestObjective(id: "obj_1", description: "Test", type: .talkTo,
                              targetID: "npc_test", requiredCount: 1, currentCount: 0)
            ],
            reward: QuestReward(xp: 100, gold: 50, items: [], reputationChanges: []),
            dialogueTreeID: nil
        )
    }
}
