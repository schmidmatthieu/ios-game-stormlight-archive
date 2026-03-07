import Foundation

// MARK: - Zone Type

enum ZoneType: String, Codable {
    case hub         // Ville/camp — PNJ, marchands
    case exploration // Plaines, donjons — ennemis + loot
    case boss        // Zone de boss unique
}

// MARK: - Zone Connection

struct ZoneConnection: Codable {
    let targetZoneID: String
    let entryPointName: String     // Nom du point d'entrée dans la zone cible
    let exitPosition: GridPosition // Position de la sortie dans cette zone
    let requiredQuestID: String?   // Quête requise pour débloquer (optionnel)
}

// MARK: - Grid Position

struct GridPosition: Codable, Equatable {
    let col: Int
    let row: Int
}

// MARK: - NPC Spawn

struct NPCSpawn: Codable {
    let npcID: String
    let position: GridPosition
    let dialogueTreeID: String?
    let isShopkeeper: Bool
}

// MARK: - Enemy Spawn

struct EnemySpawn: Codable {
    let enemyID: String
    let position: GridPosition
    let patrolPath: [GridPosition]?
    let respawnTime: TimeInterval?  // nil = ne respawn pas
}

// MARK: - Loot Point

struct LootPoint: Codable {
    let id: String
    let position: GridPosition
    let lootTable: [LootEntry]
    let isHidden: Bool
    let respawns: Bool
}

// MARK: - Zone

struct Zone: Codable, Identifiable {
    let id: String
    let name: String
    let description: String
    let worldID: WorldID
    let type: ZoneType

    // Dimension de la grille iso
    let gridWidth: Int
    let gridHeight: Int
    let tileMapFileName: String  // Nom du fichier .sks

    // Contenu
    let playerSpawnPosition: GridPosition
    let connections: [ZoneConnection]
    let npcSpawns: [NPCSpawn]
    let enemySpawns: [EnemySpawn]
    let lootPoints: [LootPoint]

    // Ambiance
    let ambientMusicTrack: String?
    let weatherEffect: WeatherEffect?
    let recommendedLevel: Int
}

// MARK: - Weather Effect

enum WeatherEffect: String, Codable {
    case none
    case ashfall        // Scadrial — chute de cendres
    case mist           // Scadrial — brumes
    case highstorm      // Roshar — hauteorages
    case everstorm      // Roshar — tempête éternelle
    case rain
    case colorDrain     // Nalthis — couleurs qui s'estompent
    case aonGlow        // Sel — lueur mystique
    case sandstorm      // Taldain — tempête de sable
    case eternalSun     // Taldain Dayside — soleil permanent, lumière intense
    case eternalNight   // Taldain Darkside — nuit permanente
    case hionFlicker    // Komashi — lignes de hion vacillantes
    case nightmareAura  // Komashi — aura de cauchemar, réalité qui se déforme
}
