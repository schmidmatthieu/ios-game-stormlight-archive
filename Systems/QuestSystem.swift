import Foundation

/// Gère le suivi et la progression des quêtes
final class QuestSystem {

    // MARK: - Activer une quête

    func activateQuest(_ questID: String) -> Bool {
        guard var quest = GameManager.shared.allQuests[questID],
              quest.status == .available else { return false }

        // Vérifier les prérequis
        let completed = GameManager.shared.champion?.completedQuestIDs ?? []
        for prereq in quest.prerequisites {
            guard completed.contains(prereq) else {
                print("⚠️ Prérequis manquant: \(prereq)")
                return false
            }
        }

        quest.status = .active
        GameManager.shared.allQuests[questID] = quest
        GameManager.shared.activeQuests.append(quest)
        GameManager.shared.mutateChampion { $0.activeQuestIDs.append(questID) }

        print("📜 Quête activée: \(quest.name)")
        return true
    }

    // MARK: - Mettre à jour un objectif

    func updateObjective(questID: String, objectiveID: String, increment: Int = 1) {
        guard var quest = GameManager.shared.allQuests[questID],
              let idx = quest.objectives.firstIndex(where: { $0.id == objectiveID }) else { return }

        quest.objectives[idx].currentCount += increment

        if quest.objectives[idx].isCompleted {
            print("✅ Objectif complété: \(quest.objectives[idx].description)")
        }

        // Vérifier si la quête est terminée
        if quest.objectives.allSatisfy({ $0.isCompleted }) {
            completeQuest(questID)
        } else {
            GameManager.shared.allQuests[questID] = quest
            if let activeIdx = GameManager.shared.activeQuests.firstIndex(where: { $0.id == questID }) {
                GameManager.shared.activeQuests[activeIdx] = quest
            }
        }
    }

    // MARK: - Compléter une quête

    private func completeQuest(_ questID: String) {
        guard var quest = GameManager.shared.allQuests[questID] else { return }
        quest.status = .completed
        GameManager.shared.allQuests[questID] = quest

        // Retirer de la liste active
        GameManager.shared.activeQuests.removeAll { $0.id == questID }
        GameManager.shared.mutateChampion { champ in
            champ.activeQuestIDs.removeAll { $0 == questID }
            champ.completedQuestIDs.append(questID)
        }

        // Distribuer les récompenses
        grantRewards(quest.reward)

        print("🏆 Quête terminée: \(quest.name)")
    }

    // MARK: - Récompenses

    private func grantRewards(_ reward: QuestReward) {
        GameManager.shared.grantXP(reward.xp)

        GameManager.shared.mutateChampion { champ in
            champ.gold += reward.gold

            for itemID in reward.items {
                champ.inventoryItemIDs.append(itemID)
            }

            for repChange in reward.reputationChanges {
                let current = champ.reputation[repChange.worldID] ?? 0
                champ.reputation[repChange.worldID] = current + repChange.amount
            }
        }
    }

    // MARK: - Événements de jeu → progression de quêtes

    func onEnemyKilled(enemyID: String) {
        for quest in GameManager.shared.activeQuests {
            for objective in quest.objectives {
                if objective.type == .kill && objective.targetID == enemyID {
                    updateObjective(questID: quest.id, objectiveID: objective.id)
                }
            }
        }
    }

    func onItemCollected(itemID: String) {
        for quest in GameManager.shared.activeQuests {
            for objective in quest.objectives {
                if objective.type == .collect && objective.targetID == itemID {
                    updateObjective(questID: quest.id, objectiveID: objective.id)
                }
            }
        }
    }

    func onNPCTalkedTo(npcID: String) {
        for quest in GameManager.shared.activeQuests {
            for objective in quest.objectives {
                if objective.type == .talkTo && objective.targetID == npcID {
                    updateObjective(questID: quest.id, objectiveID: objective.id)
                }
            }
        }
    }

    func onZoneEntered(zoneID: String) {
        for quest in GameManager.shared.activeQuests {
            for objective in quest.objectives {
                if objective.type == .explore && objective.targetID == zoneID {
                    updateObjective(questID: quest.id, objectiveID: objective.id)
                }
            }
        }
    }
}
