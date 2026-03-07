import Foundation

/// Gère la sauvegarde et le chargement de la partie
final class SaveManager {
    static let shared = SaveManager()

    private let saveFileName = "cosmere_save.json"
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    private static let currentSaveVersion = 1

    private init() {
        encoder.outputFormatting = .prettyPrinted
    }

    private var saveURL: URL? {
        guard let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first else {
            return nil
        }
        return docs.appendingPathComponent(saveFileName)
    }

    // MARK: - Save

    func save() -> Bool {
        guard let champion = GameManager.shared.champion else { return false }
        guard let url = saveURL else {
            print("⚠️ Impossible d'accéder au répertoire de sauvegarde")
            return false
        }

        let saveData = SaveData(
            version: SaveManager.currentSaveVersion,
            champion: champion,
            activeQuests: GameManager.shared.activeQuests,
            timestamp: Date()
        )

        do {
            let data = try encoder.encode(saveData)
            try data.write(to: url, options: .atomic)
            print("💾 Partie sauvegardée")
            return true
        } catch {
            print("⚠️ Erreur sauvegarde: \(error)")
            return false
        }
    }

    // MARK: - Load

    func load() -> Bool {
        guard let url = saveURL else { return false }
        guard FileManager.default.fileExists(atPath: url.path) else {
            print("Aucune sauvegarde trouvée")
            return false
        }

        do {
            let data = try Data(contentsOf: url)

            // Validate JSON before decoding
            guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
                print("⚠️ Sauvegarde corrompue: format JSON invalide")
                return false
            }

            // Check save version
            let saveVersion = json["version"] as? Int ?? 0
            if saveVersion > SaveManager.currentSaveVersion {
                print("⚠️ Sauvegarde d'une version plus récente (v\(saveVersion))")
                return false
            }

            let saveData = try decoder.decode(SaveData.self, from: data)

            // Validate champion data
            guard saveData.champion.level > 0,
                  saveData.champion.currentHP >= 0,
                  saveData.champion.maxHP > 0 else {
                print("⚠️ Données de sauvegarde invalides")
                return false
            }

            GameManager.shared.champion = saveData.champion
            GameManager.shared.activeQuests = saveData.activeQuests
            print("📂 Partie chargée (niveau \(saveData.champion.level), v\(saveVersion))")
            return true
        } catch {
            print("⚠️ Erreur chargement: \(error)")
            return false
        }
    }

    // MARK: - Delete

    func deleteSave() {
        guard let url = saveURL else { return }
        try? FileManager.default.removeItem(at: url)
    }

    func hasSave() -> Bool {
        guard let url = saveURL else { return false }
        return FileManager.default.fileExists(atPath: url.path)
    }
}

// MARK: - Save Data Container

struct SaveData: Codable {
    let version: Int
    let champion: Champion
    let activeQuests: [Quest]
    let timestamp: Date

    init(version: Int = 1, champion: Champion, activeQuests: [Quest], timestamp: Date) {
        self.version = version
        self.champion = champion
        self.activeQuests = activeQuests
        self.timestamp = timestamp
    }
}
