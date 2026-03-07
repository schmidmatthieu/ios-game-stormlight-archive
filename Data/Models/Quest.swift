import Foundation

// MARK: - Quest Type

enum QuestType: String, Codable {
    case main       // Arc narratif principal
    case world      // Histoires de monde
    case side       // Quêtes secondaires PNJ
    case hidden     // Découvertes par exploration
}

// MARK: - Quest Status

enum QuestStatus: String, Codable {
    case locked
    case available
    case active
    case completed
    case failed
}

// MARK: - Quest Objective

struct QuestObjective: Codable, Identifiable {
    let id: String
    let description: String
    let type: ObjectiveType
    let targetID: String
    let requiredCount: Int
    var currentCount: Int
    var isCompleted: Bool { currentCount >= requiredCount }
}

enum ObjectiveType: String, Codable {
    case kill       // Tuer X ennemis d'un type
    case collect    // Collecter X items
    case talkTo     // Parler à un PNJ
    case explore    // Atteindre une zone/position
    case escort     // Escorter un PNJ
    case defeat     // Vaincre un boss spécifique
}

// MARK: - Quest Reward

struct QuestReward: Codable {
    let xp: Int
    let gold: Int
    let items: [String]         // Item IDs
    let reputationChanges: [ReputationChange]
}

struct ReputationChange: Codable {
    let worldID: WorldID
    let amount: Int
}

// MARK: - Quest

struct Quest: Codable, Identifiable {
    let id: String
    let name: String
    let description: String
    let type: QuestType
    let worldID: WorldID
    let requiredLevel: Int
    let prerequisites: [String] // Quest IDs
    var status: QuestStatus
    var objectives: [QuestObjective]
    let reward: QuestReward
    let dialogueTreeID: String?
}
