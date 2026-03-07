import SpriteKit

/// Carte du Cosmere — sélection de monde / planète
class WorldMapScene: SKScene {

    private var worldNodes: [String: SKNode] = [:]

    override func didMove(to view: SKView) {
        backgroundColor = SKColor(red: 0.02, green: 0.02, blue: 0.08, alpha: 1.0) // Espace
        setupStarfield()
        setupWorlds()
    }

    private func setupStarfield() {
        // Fond étoilé
        for _ in 0..<100 {
            let star = SKShapeNode(circleOfRadius: CGFloat.random(in: 0.5...1.5))
            star.fillColor = .white
            star.strokeColor = .clear
            star.alpha = CGFloat.random(in: 0.3...1.0)
            star.position = CGPoint(
                x: CGFloat.random(in: 0...size.width),
                y: CGFloat.random(in: 0...size.height)
            )
            star.zPosition = -10

            // Scintillement
            let twinkle = SKAction.repeatForever(SKAction.sequence([
                SKAction.fadeAlpha(to: CGFloat.random(in: 0.2...0.5), duration: Double.random(in: 1...3)),
                SKAction.fadeAlpha(to: 1.0, duration: Double.random(in: 1...3))
            ]))
            star.run(twinkle)
            addChild(star)
        }
    }

    private func setupWorlds() {
        let worlds: [(id: String, name: String, color: SKColor, position: CGPoint, unlocked: Bool)] = [
            ("scadrial", "Scadrial", SKColor(red: 0.6, green: 0.4, blue: 0.2, alpha: 1.0),
             CGPoint(x: size.width * 0.3, y: size.height * 0.6), true),
            ("roshar", "Roshar", SKColor(red: 0.2, green: 0.5, blue: 0.8, alpha: 1.0),
             CGPoint(x: size.width * 0.7, y: size.height * 0.65), true),
            ("nalthis", "Nalthis", SKColor(red: 0.8, green: 0.3, blue: 0.6, alpha: 1.0),
             CGPoint(x: size.width * 0.5, y: size.height * 0.4), false),
            ("sel", "Sel", SKColor(red: 0.9, green: 0.8, blue: 0.3, alpha: 1.0),
             CGPoint(x: size.width * 0.2, y: size.height * 0.35), false),
        ]

        for world in worlds {
            let node = createWorldNode(world: world)
            addChild(node)
            worldNodes[world.id] = node
        }

        // Titre
        let title = SKLabelNode(fontNamed: "Copperplate-Bold")
        title.text = "Le Cosmere"
        title.fontSize = 28
        title.fontColor = .white
        title.position = CGPoint(x: size.width / 2, y: size.height * 0.9)
        addChild(title)

        // Bouton retour avec zone tactile 44pt
        let backContainer = SKNode()
        backContainer.position = CGPoint(x: 60, y: size.height - 50)
        backContainer.name = "back"

        let backBg = SKShapeNode(rectOf: CGSize(width: 100, height: 44), cornerRadius: 8)
        backBg.fillColor = SKColor(white: 0.15, alpha: 0.6)
        backBg.strokeColor = SKColor(white: 0.3, alpha: 0.5)
        backBg.lineWidth = 1
        backBg.name = "back"
        backContainer.addChild(backBg)

        let back = SKLabelNode(fontNamed: "Copperplate")
        back.text = "← Retour"
        back.fontSize = 16
        back.fontColor = .lightGray
        back.verticalAlignmentMode = .center
        back.name = "back"
        backContainer.addChild(back)

        addChild(backContainer)
    }

    private func createWorldNode(world: (id: String, name: String, color: SKColor, position: CGPoint, unlocked: Bool)) -> SKNode {
        let container = SKNode()
        container.position = world.position
        container.name = world.id

        // Planète
        let planet = SKShapeNode(circleOfRadius: 35)
        planet.fillColor = world.unlocked ? world.color : .darkGray
        planet.strokeColor = world.unlocked ? .white : .gray
        planet.lineWidth = 2
        planet.name = world.id
        container.addChild(planet)

        // Nom
        let label = SKLabelNode(fontNamed: "Copperplate")
        label.text = world.name
        label.fontSize = 14
        label.fontColor = world.unlocked ? .white : .gray
        label.position = CGPoint(x: 0, y: -55)
        label.name = world.id
        container.addChild(label)

        // Glow animation si déverrouillé
        if world.unlocked {
            let glow = SKAction.repeatForever(SKAction.sequence([
                SKAction.scale(to: 1.05, duration: 1.5),
                SKAction.scale(to: 1.0, duration: 1.5)
            ]))
            planet.run(glow)
        }

        // Verrou si verrouillé
        if !world.unlocked {
            let lock = SKLabelNode(text: "🔒")
            lock.fontSize = 24
            lock.position = CGPoint(x: 0, y: -8)
            container.addChild(lock)
        }

        // Réputation / progression si déverrouillé
        if world.unlocked {
            let reputation = GameManager.shared.champion?.reputation[world.id] ?? 0
            let repLabel = SKLabelNode(fontNamed: "Helvetica")
            repLabel.text = "Rep: \(reputation)"
            repLabel.fontSize = 10
            repLabel.fontColor = GameConstants.Colors.gold
            repLabel.position = CGPoint(x: 0, y: -68)
            container.addChild(repLabel)

            // Barre de progression de réputation
            let barWidth: CGFloat = 50
            let barBg = SKShapeNode(rectOf: CGSize(width: barWidth, height: 4), cornerRadius: 2)
            barBg.fillColor = SKColor(white: 0.15, alpha: 0.8)
            barBg.strokeColor = SKColor(white: 0.3, alpha: 0.5)
            barBg.lineWidth = 0.5
            barBg.position = CGPoint(x: 0, y: -78)
            container.addChild(barBg)

            let progress = min(1.0, CGFloat(reputation) / 100.0)
            if progress > 0 {
                let fillWidth = barWidth * progress
                let fill = SKShapeNode(rectOf: CGSize(width: fillWidth, height: 3), cornerRadius: 1)
                fill.fillColor = GameConstants.Colors.gold
                fill.strokeColor = .clear
                fill.position = CGPoint(x: -(barWidth - fillWidth) / 2, y: 0)
                barBg.addChild(fill)
            }
        }

        return container
    }

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let touch = touches.first else { return }
        let location = touch.location(in: self)
        let tapped = nodes(at: location)

        for node in tapped {
            if node.name == "back" {
                if let view = self.view {
                    SceneRouter(view: view).showMainMenu()
                }
                return
            }

            if let worldID = node.name, let worldNode = worldNodes[worldID] {
                // Vérifier si le monde est déverrouillé
                let isLocked = worldNode.children.contains { $0 is SKLabelNode && ($0 as? SKLabelNode)?.text == "🔒" }
                if isLocked {
                    // Feedback visuel : shake + message
                    let shake = SKAction.sequence([
                        SKAction.moveBy(x: -5, y: 0, duration: 0.05),
                        SKAction.moveBy(x: 10, y: 0, duration: 0.05),
                        SKAction.moveBy(x: -10, y: 0, duration: 0.05),
                        SKAction.moveBy(x: 10, y: 0, duration: 0.05),
                        SKAction.moveBy(x: -5, y: 0, duration: 0.05),
                    ])
                    worldNode.run(shake)

                    let msg = SKLabelNode(fontNamed: "Copperplate")
                    msg.text = "Monde verrouillé"
                    msg.fontSize = 14
                    msg.fontColor = .red
                    msg.position = CGPoint(x: worldNode.position.x, y: worldNode.position.y + 55)
                    msg.zPosition = 10
                    addChild(msg)
                    msg.run(SKAction.sequence([
                        SKAction.wait(forDuration: 1.0),
                        SKAction.fadeOut(withDuration: 0.3),
                        SKAction.removeFromParent()
                    ]))
                    return
                }

                let hubZoneID = "\(worldID)_hub"
                if let view = self.view {
                    SceneRouter(view: view).transitionToZone(hubZoneID)
                }
            }
        }
    }
}
