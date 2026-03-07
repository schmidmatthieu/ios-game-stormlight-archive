import SpriteKit

/// Gère la navigation entre les scènes et les transitions de zones
final class SceneRouter {
    weak var view: SKView?

    init(view: SKView) {
        self.view = view
    }

    // MARK: - Navigation principale

    func showMainMenu() {
        let scene = MainMenuScene(size: view?.bounds.size ?? CGSize(width: 390, height: 844))
        scene.scaleMode = .aspectFill
        view?.presentScene(scene, transition: .fade(withDuration: 0.5))
    }

    func showWorldMap() {
        let scene = WorldMapScene(size: view?.bounds.size ?? CGSize(width: 390, height: 844))
        scene.scaleMode = .aspectFill
        view?.presentScene(scene, transition: .fade(withDuration: 0.8))
    }

    func transitionToZone(_ zoneID: String, entryPoint: String? = nil) {
        guard let zone = GameManager.shared.allZones[zoneID] else {
            print("⚠️ Zone \(zoneID) introuvable")
            return
        }

        // Sauvegarder l'état actuel
        GameManager.shared.currentZone = zone
        GameManager.shared.champion?.currentZoneID = zoneID
        GameManager.shared.champion?.currentWorldID = zone.worldID

        // Positionner le joueur
        if let entry = entryPoint,
           let connection = zone.connections.first(where: { $0.entryPointName == entry }) {
            GameManager.shared.champion?.gridPosition = connection.exitPosition
        } else {
            GameManager.shared.champion?.gridPosition = zone.playerSpawnPosition
        }

        // Charger la scène de zone
        let scene = ZoneScene(zone: zone, size: view?.bounds.size ?? CGSize(width: 390, height: 844))
        scene.scaleMode = .aspectFill

        let transition = SKTransition.fade(with: .black, duration: 1.0)
        view?.presentScene(scene, transition: transition)
    }
}
