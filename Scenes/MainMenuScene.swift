import SpriteKit

/// Scène du menu principal — design amélioré avec fond étoilé animé,
/// logo stylisé, particules de brume et boutons ornementaux
class MainMenuScene: SKScene {

    private var starField: [SKShapeNode] = []

    override func didMove(to view: SKView) {
        backgroundColor = SKColor(red: 0.03, green: 0.03, blue: 0.08, alpha: 1.0)
        setupStarField()
        setupMistParticles()
        setupDecorations()
        setupUI()
    }

    // MARK: - Starfield Background

    private func setupStarField() {
        for _ in 0..<120 {
            let radius = CGFloat.random(in: 0.5...2)
            let star = SKShapeNode(circleOfRadius: radius)
            let brightness = CGFloat.random(in: 0.3...1.0)
            star.fillColor = SKColor(white: brightness, alpha: CGFloat.random(in: 0.4...0.9))
            star.strokeColor = .clear
            star.position = CGPoint(x: CGFloat.random(in: 0...size.width),
                                     y: CGFloat.random(in: 0...size.height))
            star.zPosition = -10

            if radius > 1.3 {
                star.glowWidth = 2
            }

            // Random twinkle
            let duration = Double.random(in: 1.5...4.0)
            let twinkle = SKAction.repeatForever(SKAction.sequence([
                SKAction.fadeAlpha(to: CGFloat.random(in: 0.2...0.5), duration: duration),
                SKAction.fadeAlpha(to: CGFloat.random(in: 0.6...1.0), duration: duration)
            ]))
            star.run(twinkle)
            addChild(star)
            starField.append(star)
        }

        // A few colored stars
        let coloredStars: [SKColor] = [
            SKColor(red: 0.6, green: 0.7, blue: 1.0, alpha: 0.8),
            SKColor(red: 1.0, green: 0.8, blue: 0.5, alpha: 0.7),
            SKColor(red: 0.7, green: 0.5, blue: 1.0, alpha: 0.6)
        ]
        for color in coloredStars {
            let star = SKShapeNode(circleOfRadius: CGFloat.random(in: 1.5...2.5))
            star.fillColor = color
            star.strokeColor = .clear
            star.glowWidth = 3
            star.position = CGPoint(x: CGFloat.random(in: 0...size.width),
                                     y: CGFloat.random(in: 0...size.height))
            star.zPosition = -9
            addChild(star)
        }
    }

    // MARK: - Mist Particles

    private func setupMistParticles() {
        // Layered mist wisps
        for i in 0..<6 {
            let wisp = SKShapeNode(ellipseOf: CGSize(width: CGFloat.random(in: 100...250),
                                                       height: CGFloat.random(in: 15...40)))
            let alpha: CGFloat = 0.02 + CGFloat(i) * 0.005
            wisp.fillColor = SKColor(white: 0.6, alpha: alpha)
            wisp.strokeColor = .clear
            wisp.position = CGPoint(x: CGFloat.random(in: 0...size.width),
                                     y: CGFloat.random(in: size.height * 0.1...size.height * 0.5))
            wisp.zPosition = -5

            let xDrift = CGFloat.random(in: 30...80)
            let speed = Double.random(in: 6...12)
            let drift = SKAction.repeatForever(SKAction.sequence([
                SKAction.moveBy(x: xDrift, y: CGFloat.random(in: -5...5), duration: speed),
                SKAction.moveBy(x: -xDrift, y: CGFloat.random(in: -5...5), duration: speed)
            ]))
            wisp.run(drift)

            let fade = SKAction.repeatForever(SKAction.sequence([
                SKAction.fadeAlpha(to: alpha * 2, duration: speed * 0.5),
                SKAction.fadeAlpha(to: alpha * 0.5, duration: speed * 0.5)
            ]))
            wisp.run(fade)
            addChild(wisp)
        }

        // Small floating metallic particles (Scadrial ambiance)
        for _ in 0..<15 {
            let particle = SKShapeNode(circleOfRadius: CGFloat.random(in: 0.5...1.5))
            particle.fillColor = SKColor(red: 0.7, green: 0.7, blue: 0.8, alpha: 0.3)
            particle.strokeColor = .clear
            particle.position = CGPoint(x: CGFloat.random(in: 0...size.width),
                                         y: CGFloat.random(in: 0...size.height * 0.6))
            particle.zPosition = -4

            let float = SKAction.repeatForever(SKAction.sequence([
                SKAction.moveBy(x: CGFloat.random(in: -20...20), y: CGFloat.random(in: 15...30),
                                 duration: Double.random(in: 3...6)),
                SKAction.run { [weak self] in
                    guard let self else { return }
                    particle.position = CGPoint(x: CGFloat.random(in: 0...self.size.width),
                                                 y: CGFloat.random(in: 0...self.size.height * 0.3))
                }
            ]))
            particle.run(float)
            addChild(particle)
        }
    }

    // MARK: - Decorative Elements

    private func setupDecorations() {
        // Ornamental line below title area
        let ornament = SKShapeNode(rectOf: CGSize(width: 200, height: 1))
        ornament.fillColor = SKColor(red: 0.6, green: 0.5, blue: 0.2, alpha: 0.4)
        ornament.strokeColor = .clear
        ornament.position = CGPoint(x: size.width / 2, y: size.height * 0.66)
        ornament.zPosition = 1
        addChild(ornament)

        // Diamond center on ornament
        let diamond = SKShapeNode()
        let path = CGMutablePath()
        path.move(to: CGPoint(x: 0, y: 5))
        path.addLine(to: CGPoint(x: 5, y: 0))
        path.addLine(to: CGPoint(x: 0, y: -5))
        path.addLine(to: CGPoint(x: -5, y: 0))
        path.closeSubpath()
        diamond.path = path
        diamond.fillColor = SKColor(red: 0.8, green: 0.7, blue: 0.3, alpha: 0.6)
        diamond.strokeColor = SKColor(red: 0.9, green: 0.8, blue: 0.4, alpha: 0.4)
        diamond.lineWidth = 0.5
        diamond.position = ornament.position
        diamond.zPosition = 2
        addChild(diamond)

        // Bottom gradient overlay
        let gradient = SKShapeNode(rectOf: CGSize(width: size.width, height: size.height * 0.3))
        gradient.fillColor = SKColor(red: 0.05, green: 0.02, blue: 0.12, alpha: 0.6)
        gradient.strokeColor = .clear
        gradient.position = CGPoint(x: size.width / 2, y: size.height * 0.15)
        gradient.zPosition = -3
        addChild(gradient)
    }

    // MARK: - UI Setup

    private func setupUI() {
        // Title with glow
        let title = SKLabelNode(fontNamed: "Copperplate-Bold")
        title.text = "Cosmere Chronicles"
        title.fontSize = 32
        title.fontColor = SKColor(red: 0.95, green: 0.85, blue: 0.4, alpha: 1.0)
        title.position = CGPoint(x: size.width / 2, y: size.height * 0.78)
        title.zPosition = 10
        addChild(title)

        // Title glow backdrop
        let titleGlow = SKShapeNode(rectOf: CGSize(width: 280, height: 40), cornerRadius: 8)
        titleGlow.fillColor = SKColor(red: 0.8, green: 0.6, blue: 0.1, alpha: 0.06)
        titleGlow.strokeColor = .clear
        titleGlow.position = CGPoint(x: size.width / 2, y: size.height * 0.78 + 5)
        titleGlow.zPosition = 9
        addChild(titleGlow)
        titleGlow.run(SKAction.repeatForever(SKAction.sequence([
            SKAction.fadeAlpha(to: 0.1, duration: 2.0),
            SKAction.fadeAlpha(to: 0.03, duration: 2.0)
        ])))

        // Subtitle
        let subtitle = SKLabelNode(fontNamed: "Copperplate")
        subtitle.text = "Les Chroniques du Cosmere"
        subtitle.fontSize = 14
        subtitle.fontColor = SKColor(red: 0.7, green: 0.65, blue: 0.5, alpha: 0.8)
        subtitle.position = CGPoint(x: size.width / 2, y: size.height * 0.73)
        subtitle.zPosition = 10
        addChild(subtitle)

        // New Game button
        let newGameButton = createMenuButton(
            text: "Nouvelle Partie",
            position: CGPoint(x: size.width / 2, y: size.height * 0.48),
            name: "newGame",
            primary: true
        )
        addChild(newGameButton)

        // Continue button
        if SaveManager.shared.hasSave() {
            let continueButton = createMenuButton(
                text: "Continuer",
                position: CGPoint(x: size.width / 2, y: size.height * 0.39),
                name: "continue",
                primary: false
            )
            addChild(continueButton)
        }

        // Bouton Paramètres
        let settingsButton = createMenuButton(text: "Paramètres", position: CGPoint(x: size.width / 2, y: size.height * 0.34), name: "settings", primary: false)
        addChild(settingsButton)

        // Version text
        let version = SKLabelNode(fontNamed: "Helvetica")
        version.text = "v0.1 Alpha"
        version.fontSize = 9
        version.fontColor = SKColor(white: 0.3, alpha: 0.5)
        version.position = CGPoint(x: size.width / 2, y: 15)
        version.zPosition = 10
        addChild(version)
    }

    // MARK: - Enhanced Button

    private func createMenuButton(text: String, position: CGPoint, name: String, primary: Bool) -> SKNode {
        let container = SKNode()
        container.position = position
        container.name = name

        let width: CGFloat = 230
        let height: CGFloat = 48

        // Shadow
        let shadow = SKShapeNode(rectOf: CGSize(width: width, height: height), cornerRadius: 10)
        shadow.fillColor = SKColor(white: 0, alpha: 0.3)
        shadow.strokeColor = .clear
        shadow.position = CGPoint(x: 2, y: -2)
        shadow.zPosition = 0
        container.addChild(shadow)

        // Background
        let bg = SKShapeNode(rectOf: CGSize(width: width, height: height), cornerRadius: 10)
        bg.fillColor = primary
            ? SKColor(red: 0.18, green: 0.12, blue: 0.3, alpha: 0.9)
            : SKColor(red: 0.12, green: 0.10, blue: 0.2, alpha: 0.85)
        bg.strokeColor = primary
            ? SKColor(red: 0.7, green: 0.6, blue: 0.2, alpha: 0.9)
            : SKColor(red: 0.5, green: 0.4, blue: 0.2, alpha: 0.6)
        bg.lineWidth = primary ? 2.5 : 1.5
        bg.zPosition = 1
        bg.name = name
        container.addChild(bg)

        // Shine highlight
        let shine = SKShapeNode(rectOf: CGSize(width: width - 20, height: height * 0.3), cornerRadius: 4)
        shine.fillColor = SKColor(white: 1, alpha: primary ? 0.08 : 0.04)
        shine.strokeColor = .clear
        shine.position = CGPoint(x: 0, y: height * 0.2)
        shine.zPosition = 2
        bg.addChild(shine)

        // Label
        let label = SKLabelNode(fontNamed: "Copperplate-Bold")
        label.text = text
        label.fontSize = primary ? 18 : 16
        label.fontColor = primary
            ? SKColor(red: 0.95, green: 0.85, blue: 0.4, alpha: 1.0)
            : .white
        label.verticalAlignmentMode = .center
        label.zPosition = 3
        label.name = name
        bg.addChild(label)

        // Corner ornaments on primary button
        if primary {
            for xSign in [-1, 1] as [CGFloat] {
                for ySign in [-1, 1] as [CGFloat] {
                    let corner = SKShapeNode(rectOf: CGSize(width: 6, height: 6))
                    corner.fillColor = SKColor(red: 0.7, green: 0.6, blue: 0.2, alpha: 0.5)
                    corner.strokeColor = .clear
                    corner.position = CGPoint(x: xSign * (width / 2 - 8),
                                               y: ySign * (height / 2 - 8))
                    corner.zPosition = 2
                    corner.zRotation = .pi / 4
                    bg.addChild(corner)
                }
            }

            // Subtle pulse
            let pulse = SKAction.repeatForever(SKAction.sequence([
                SKAction.run { bg.glowWidth = 3 },
                SKAction.wait(forDuration: 1.5),
                SKAction.run { bg.glowWidth = 0 },
                SKAction.wait(forDuration: 1.5)
            ]))
            bg.run(pulse)
        }

        return container
    }

    // MARK: - Touch

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let touch = touches.first else { return }
        let location = touch.location(in: self)
        let tapped = nodes(at: location)

        for node in tapped {
            switch node.name {
            case "newGame":
                pressAnimation(node) { [weak self] in
                    guard let self, let view = self.view else { return }
                    let creation = CharacterCreationScene(size: view.bounds.size)
                    creation.scaleMode = .resizeFill
                    view.presentScene(creation, transition: .crossFade(withDuration: 0.5))
                }

            case "continue":
                pressAnimation(node) { [weak self] in
                    guard let self, let view = self.view else { return }
                    if SaveManager.shared.load() {
                        let zoneID = GameManager.shared.champion?.currentZoneID ?? "scadrial_hub"
                        SceneRouter(view: view).transitionToZone(zoneID)
                    }
                }

            case "settings":
                showSettings()

            default:
                break
            }
        }
    }

    private func pressAnimation(_ node: SKNode, completion: @escaping () -> Void) {
        let target = node.parent?.name != nil ? node.parent! : node
        target.run(SKAction.sequence([
            SKAction.scale(to: 0.92, duration: 0.06),
            SKAction.scale(to: 1.0, duration: 0.08),
            SKAction.run(completion)
        ]))
    }

    private func showSettings() {
        guard childNode(withName: "settingsMenu") == nil else { return }
        let settings = SettingsMenuNode(screenSize: size)
        settings.position = CGPoint(x: size.width / 2, y: size.height / 2)
        settings.name = "settingsMenu"
        settings.onClose = { [weak settings] in
            settings?.removeFromParent()
        }
        addChild(settings)
    }
}
