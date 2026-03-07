import Foundation
import SpriteKit

/// Système de dialogues à choix multiples avec conséquences narratives
final class DialogueSystem {

    // MARK: - Data Models

    struct DialogueTree: Codable, Identifiable {
        let id: String
        let npcName: String
        let npcPortrait: String
        let startNodeID: String
        let nodes: [DialogueNode]
    }

    struct DialogueNode: Codable, Identifiable {
        let id: String
        let speaker: String       // "npc", "player", "narrator"
        let text: String
        let portrait: String?     // Override portrait pour ce node
        let emotion: Emotion?
        let choices: [DialogueChoice]?  // nil = texte simple, continuer auto
        let nextNodeID: String?         // Si pas de choices, noeud suivant
        let actions: [DialogueAction]?  // Actions déclenchées
    }

    struct DialogueChoice: Codable {
        let text: String
        let nextNodeID: String
        let requiredReputation: ReputationRequirement?
        let requiredItemID: String?
        let actions: [DialogueAction]?
        let isHidden: Bool     // Visible seulement si requirements remplis
    }

    struct DialogueAction: Codable {
        let type: DialogueActionType
        let targetID: String
        let value: Int
    }

    enum DialogueActionType: String, Codable {
        case giveItem        // Donner un item au joueur
        case removeItem      // Retirer un item du joueur
        case giveXP
        case giveGold
        case changeReputation
        case activateQuest
        case completeObjective
        case unlockZone
        case addCompanion
        case removeCompanion
        case setBool         // Flag narrative globale
    }

    struct ReputationRequirement: Codable {
        let worldID: WorldID
        let minReputation: Int
    }

    enum Emotion: String, Codable {
        case neutral, happy, sad, angry, surprised, scared, determined, mysterious
    }

    // MARK: - State

    private(set) var currentTree: DialogueTree?
    private var currentNodeID: String?
    private var dialogueHistory: [String] = []  // IDs des nodes visités
    private var globalFlags: [String: Bool] = [:]

    weak var delegate: DialogueSystemDelegate?

    // MARK: - Start Dialogue

    func startDialogue(treeID: String) {
        guard let tree = loadDialogueTree(treeID) else {
            print("⚠️ Dialogue tree \(treeID) introuvable")
            return
        }

        currentTree = tree
        currentNodeID = tree.startNodeID
        dialogueHistory = []

        showCurrentNode()
    }

    // MARK: - Navigation

    private func showCurrentNode() {
        guard let tree = currentTree,
              let nodeID = currentNodeID,
              let node = tree.nodes.first(where: { $0.id == nodeID }) else {
            endDialogue()
            return
        }

        dialogueHistory.append(nodeID)

        // Exécuter les actions du node
        if let actions = node.actions {
            executeActions(actions)
        }

        // Filtrer les choix disponibles
        let availableChoices = filterChoices(node.choices)

        // Notifier le delegate pour afficher l'UI
        delegate?.dialogueSystem(self, showNode: node, availableChoices: availableChoices)
    }

    func selectChoice(_ choiceIndex: Int) {
        guard let tree = currentTree,
              let nodeID = currentNodeID,
              let node = tree.nodes.first(where: { $0.id == nodeID }),
              let choices = node.choices,
              choiceIndex < choices.count else { return }

        let choice = choices[choiceIndex]

        // Exécuter les actions du choix
        if let actions = choice.actions {
            executeActions(actions)
        }

        currentNodeID = choice.nextNodeID
        showCurrentNode()
    }

    func continueDialogue() {
        guard let tree = currentTree,
              let nodeID = currentNodeID,
              let node = tree.nodes.first(where: { $0.id == nodeID }) else {
            endDialogue()
            return
        }

        if let nextID = node.nextNodeID {
            currentNodeID = nextID
            showCurrentNode()
        } else {
            endDialogue()
        }
    }

    func endDialogue() {
        let tree = currentTree
        currentTree = nil
        currentNodeID = nil
        delegate?.dialogueSystemDidEnd(self, treeID: tree?.id ?? "")
    }

    // MARK: - Choice Filtering

    private func filterChoices(_ choices: [DialogueChoice]?) -> [DialogueChoice] {
        guard let choices = choices else { return [] }

        return choices.filter { choice in
            // Vérifier la réputation
            if let req = choice.requiredReputation {
                let rep = GameManager.shared.champion?.reputation[req.worldID] ?? 0
                if rep < req.minReputation { return !choice.isHidden }
            }

            // Vérifier l'item requis
            if let itemID = choice.requiredItemID {
                let hasItem = GameManager.shared.champion?.inventoryItemIDs.contains(itemID) ?? false
                if !hasItem { return !choice.isHidden }
            }

            return true
        }
    }

    // MARK: - Action Execution

    private func executeActions(_ actions: [DialogueAction]) {
        for action in actions {
            switch action.type {
            case .giveItem:
                GameManager.shared.mutateChampion { $0.inventoryItemIDs.append(action.targetID) }
                GameManager.shared.questSystem.onItemCollected(itemID: action.targetID)

            case .removeItem:
                GameManager.shared.mutateChampion { $0.inventoryItemIDs.removeAll { $0 == action.targetID } }

            case .giveXP:
                GameManager.shared.grantXP(action.value)

            case .giveGold:
                GameManager.shared.mutateChampion { $0.gold += action.value }

            case .changeReputation:
                GameManager.shared.mutateChampion { champ in
                    let current = champ.reputation[action.targetID] ?? 0
                    champ.reputation[action.targetID] = current + action.value
                }

            case .activateQuest:
                _ = GameManager.shared.questSystem.activateQuest(action.targetID)

            case .completeObjective:
                // targetID format: "questID:objectiveID"
                let parts = action.targetID.split(separator: ":")
                if parts.count == 2 {
                    GameManager.shared.questSystem.updateObjective(
                        questID: String(parts[0]),
                        objectiveID: String(parts[1]),
                        increment: action.value
                    )
                }

            case .unlockZone:
                globalFlags["zone_unlocked_\(action.targetID)"] = true

            case .addCompanion:
                globalFlags["companion_\(action.targetID)"] = true

            case .removeCompanion:
                globalFlags["companion_\(action.targetID)"] = false

            case .setBool:
                globalFlags[action.targetID] = action.value != 0
            }
        }
    }

    // MARK: - Data Loading

    private func loadDialogueTree(_ treeID: String) -> DialogueTree? {
        guard let url = Bundle.main.url(forResource: "dialogues", withExtension: "json"),
              let data = try? Data(contentsOf: url),
              let trees = try? JSONDecoder().decode([DialogueTree].self, from: data) else {
            return nil
        }
        return trees.first { $0.id == treeID }
    }

    // MARK: - Global Flags

    func getFlag(_ key: String) -> Bool {
        globalFlags[key] ?? false
    }

    func setFlag(_ key: String, value: Bool) {
        globalFlags[key] = value
    }
}

// MARK: - Delegate Protocol

protocol DialogueSystemDelegate: AnyObject {
    func dialogueSystem(_ system: DialogueSystem, showNode node: DialogueSystem.DialogueNode, availableChoices: [DialogueSystem.DialogueChoice])
    func dialogueSystemDidEnd(_ system: DialogueSystem, treeID: String)
}
