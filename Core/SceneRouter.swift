import SpriteKit

/// Gère la navigation entre les scènes et les transitions de zones
final class SceneRouter {
    weak var view: SKView?

    init(view: SKView) {
        self.view = view
    }

    // MARK: - Navigation principale

    func showMainMenu() {
        let scene = MainMenuScene(size: view?.bounds.size ?? GameConstants.UI.defaultScreenSize)
        scene.scaleMode = .aspectFill
        view?.presentScene(scene, transition: .fade(withDuration: 0.5))
    }

    func showWorldMap() {
        let scene = WorldMapScene(size: view?.bounds.size ?? GameConstants.UI.defaultScreenSize)
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
        let sceneSize = view?.bounds.size ?? GameConstants.UI.defaultScreenSize
        let scene = ZoneScene(zone: zone, size: sceneSize)
        scene.scaleMode = .aspectFill

        // Transition améliorée : fondu noir + affichage du nom de zone
        let transition = SKTransition.fade(with: .black, duration: GameConstants.Animation.zoneTransitionDuration)
        transition.pausesIncomingScene = false
        view?.presentScene(scene, transition: transition)

        // Afficher le nom de la zone en entrée
        showZoneNameOverlay(zoneName: zone.name, in: scene, screenSize: sceneSize)
    }

    private func showZoneNameOverlay(zoneName: String, in scene: SKScene, screenSize: CGSize) {
        let overlay = SKNode()
        overlay.zPosition = 10000

        let bg = SKShapeNode(rectOf: CGSize(width: screenSize.width, height: 60))
        bg.fillColor = SKColor(white: 0, alpha: 0.6)
        bg.strokeColor = .clear
        bg.position = CGPoint(x: screenSize.width / 2, y: screenSize.height / 2)
        overlay.addChild(bg)

        let label = SKLabelNode(fontNamed: "Copperplate-Bold")
        label.text = zoneName
        label.fontSize = 24
        label.fontColor = GameConstants.Colors.gold
        label.position = CGPoint(x: screenSize.width / 2, y: screenSize.height / 2)
        label.verticalAlignmentMode = .center
        overlay.addChild(label)

        overlay.alpha = 0
        scene.addChild(overlay)

        overlay.run(SKAction.sequence([
            SKAction.wait(forDuration: 0.5),
            SKAction.fadeIn(withDuration: 0.5),
            SKAction.wait(forDuration: 1.5),
            SKAction.fadeOut(withDuration: 0.8),
            SKAction.removeFromParent()
        ]))
    }
}
