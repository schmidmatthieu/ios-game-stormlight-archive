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

        // Bouton retour
        let back = SKLabelNode(fontNamed: "Copperplate")
        back.text = "← Retour"
        back.fontSize = 16
        back.fontColor = .lightGray
        back.position = CGPoint(x: 60, y: size.height - 50)
        back.name = "back"
        addChild(back)
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
