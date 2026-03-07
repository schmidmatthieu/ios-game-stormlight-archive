import SpriteKit

/// Menu pause — sauvegarde, chargement, retour au menu
final class PauseMenuNode: SKNode {

    private let screenSize: CGSize
    var onResume: (() -> Void)?
    var onSave: (() -> Void)?
    var onQuit: (() -> Void)?

    init(screenSize: CGSize) {
        self.screenSize = screenSize
        super.init()
        isUserInteractionEnabled = true
        zPosition = 6000
        setupUI()
    }

    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    private func setupUI() {
        // Dimmed background
        let overlay = SKShapeNode(rectOf: CGSize(width: screenSize.width * 2, height: screenSize.height * 2))
        overlay.fillColor = SKColor(white: 0, alpha: 0.6)
        overlay.strokeColor = .clear
        overlay.zPosition = 0
        overlay.name = "pauseOverlay"
        addChild(overlay)

        // Panel
        let panel = SKShapeNode(rectOf: CGSize(width: 240, height: 260), cornerRadius: 12)
        panel.fillColor = SKColor(red: 0.08, green: 0.06, blue: 0.14, alpha: 0.95)
        panel.strokeColor = SKColor(red: 0.5, green: 0.4, blue: 0.2, alpha: 0.8)
        panel.lineWidth = 2
        panel.zPosition = 1
        addChild(panel)

        // Title
        let title = SKLabelNode(fontNamed: "Copperplate-Bold")
        title.text = "PAUSE"
        title.fontSize = 22
        title.fontColor = SKColor(red: 0.9, green: 0.8, blue: 0.4, alpha: 1)
        title.position = CGPoint(x: 0, y: 90)
        title.zPosition = 2
        addChild(title)

        // Buttons
        addButton(text: "Reprendre", y: 40, name: "resume")
        addButton(text: "Sauvegarder", y: -10, name: "save")
        addButton(text: "Quitter", y: -60, name: "quit", color: SKColor(red: 0.5, green: 0.15, blue: 0.1, alpha: 0.8))
    }

    private func addButton(text: String, y: CGFloat, name: String,
                           color: SKColor = SKColor(red: 0.2, green: 0.15, blue: 0.3, alpha: 0.8)) {
        let bg = SKShapeNode(rectOf: CGSize(width: 180, height: 38), cornerRadius: 8)
        bg.fillColor = color
        bg.strokeColor = SKColor(red: 0.5, green: 0.4, blue: 0.2, alpha: 0.6)
        bg.lineWidth = 1.5
        bg.position = CGPoint(x: 0, y: y)
        bg.zPosition = 2
        bg.name = name
        addChild(bg)

        let label = SKLabelNode(fontNamed: "Copperplate")
        label.text = text
        label.fontSize = 16
        label.fontColor = .white
        label.verticalAlignmentMode = .center
        label.position = CGPoint(x: 0, y: y)
        label.zPosition = 3
        label.name = name
        addChild(label)
    }

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let touch = touches.first else { return }
        let location = touch.location(in: self)
        let tapped = nodes(at: location)

        for node in tapped {
            switch node.name {
            case "resume", "pauseOverlay":
                onResume?()
            case "save":
                let success = SaveManager.shared.save()
                showSaveConfirmation(success: success)
            case "quit":
                onQuit?()
            default:
                break
            }
        }
    }

    private func showSaveConfirmation(success: Bool) {
        let label = SKLabelNode(fontNamed: "Copperplate-Bold")
        label.text = success ? "Partie sauvegardée !" : "Erreur de sauvegarde"
        label.fontSize = 14
        label.fontColor = success ? .green : .red
        label.position = CGPoint(x: 0, y: -100)
        label.zPosition = 5
        addChild(label)

        label.run(SKAction.sequence([
            SKAction.wait(forDuration: 1.5),
            SKAction.fadeOut(withDuration: 0.5),
            SKAction.removeFromParent()
        ]))
    }
}
