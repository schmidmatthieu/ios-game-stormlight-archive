import SpriteKit

/// Scène du menu principal
class MainMenuScene: SKScene {

    override func didMove(to view: SKView) {
        backgroundColor = SKColor(red: 0.05, green: 0.05, blue: 0.12, alpha: 1.0)
        setupUI()
    }

    private func setupUI() {
        // Titre
        let title = SKLabelNode(fontNamed: "Copperplate-Bold")
        title.text = "Cosmere Chronicles"
        title.fontSize = 36
        title.fontColor = .init(red: 0.9, green: 0.8, blue: 0.4, alpha: 1.0) // Or
        title.position = CGPoint(x: size.width / 2, y: size.height * 0.75)
        addChild(title)

        // Sous-titre
        let subtitle = SKLabelNode(fontNamed: "Copperplate")
        subtitle.text = "Les Chroniques du Cosmere"
        subtitle.fontSize = 16
        subtitle.fontColor = .lightGray
        subtitle.position = CGPoint(x: size.width / 2, y: size.height * 0.70)
        addChild(subtitle)

        // Bouton Nouvelle Partie
        let newGameButton = createButton(text: "Nouvelle Partie", position: CGPoint(x: size.width / 2, y: size.height * 0.50), name: "newGame")
        addChild(newGameButton)

        // Bouton Continuer
        if SaveManager.shared.hasSave() {
            let continueButton = createButton(text: "Continuer", position: CGPoint(x: size.width / 2, y: size.height * 0.42), name: "continue")
            addChild(continueButton)
        }

        // Particules de brumes (ambiance Scadrial)
        if let mist = SKEmitterNode(fileNamed: "MistParticles") {
            mist.position = CGPoint(x: size.width / 2, y: size.height)
            mist.zPosition = -1
            addChild(mist)
        }
    }

    private func createButton(text: String, position: CGPoint, name: String) -> SKNode {
        let bg = SKShapeNode(rectOf: CGSize(width: 220, height: 44), cornerRadius: 8)
        bg.fillColor = SKColor(red: 0.2, green: 0.15, blue: 0.3, alpha: 0.8)
        bg.strokeColor = SKColor(red: 0.6, green: 0.5, blue: 0.2, alpha: 1.0)
        bg.lineWidth = 2
        bg.position = position
        bg.name = name

        let label = SKLabelNode(fontNamed: "Copperplate")
        label.text = text
        label.fontSize = 18
        label.fontColor = .white
        label.verticalAlignmentMode = .center
        label.name = name
        bg.addChild(label)

        return bg
    }

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let touch = touches.first else { return }
        let location = touch.location(in: self)
        let tapped = nodes(at: location)

        for node in tapped {
            switch node.name {
            case "newGame":
                // TODO: Afficher l'écran de création de personnage
                GameManager.shared.startNewGame(name: "Kelsier", championClass: .mistborn)
                if let view = self.view {
                    let router = SceneRouter(view: view)
                    router.transitionToZone("scadrial_hub")
                }

            case "continue":
                if SaveManager.shared.load(), let view = self.view {
                    let zoneID = GameManager.shared.champion?.currentZoneID ?? "scadrial_hub"
                    let router = SceneRouter(view: view)
                    router.transitionToZone(zoneID)
                }

            default:
                break
            }
        }
    }
}
