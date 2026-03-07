import Foundation

/// Gère la sauvegarde et le chargement de la partie
final class SaveManager {
    static let shared = SaveManager()

    private let saveFileName = "cosmere_save.json"
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    private init() {
        encoder.outputFormatting = .prettyPrinted
    }

    private var saveURL: URL {
        let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
        return docs.appendingPathComponent(saveFileName)
    }

    // MARK: - Save

    func save() -> Bool {
        guard let champion = GameManager.shared.champion else { return false }

        let saveData = SaveData(
            champion: champion,
            activeQuests: GameManager.shared.activeQuests,
            timestamp: Date()
        )

        do {
            let data = try encoder.encode(saveData)
            try data.write(to: saveURL)
            print("💾 Partie sauvegardée")
            return true
        } catch {
            print("⚠️ Erreur sauvegarde: \(error)")
            return false
        }
    }

    // MARK: - Load

    func load() -> Bool {
        guard FileManager.default.fileExists(atPath: saveURL.path) else {
            print("Aucune sauvegarde trouvée")
            return false
        }

        do {
            let data = try Data(contentsOf: saveURL)
            let saveData = try decoder.decode(SaveData.self, from: data)
            GameManager.shared.champion = saveData.champion
            GameManager.shared.activeQuests = saveData.activeQuests
            print("📂 Partie chargée (niveau \(saveData.champion.level))")
            return true
        } catch {
            print("⚠️ Erreur chargement: \(error)")
            return false
        }
    }

    // MARK: - Delete

    func deleteSave() {
        try? FileManager.default.removeItem(at: saveURL)
    }

    func hasSave() -> Bool {
        FileManager.default.fileExists(atPath: saveURL.path)
    }
}

// MARK: - Save Data Container

struct SaveData: Codable {
    let champion: Champion
    let activeQuests: [Quest]
    let timestamp: Date
}
