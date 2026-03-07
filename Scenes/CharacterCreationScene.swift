import SpriteKit

/// Scène de création de personnage — design amélioré avec aperçu dynamique,
/// effets de particules par classe, et boutons ornementaux
class CharacterCreationScene: SKScene {

    // MARK: - Properties

    private var selectedClass: ChampionClass = .mistborn
    private var selectedOrder: RadiantOrder? = nil
    private var playerName: String = "Salteur"

    private var classButtons: [SKNode] = []
    private var descriptionLabel: SKLabelNode!
    private var previewContainer: SKNode!
    private var nameLabel: SKLabelNode!
    private var orderSelector: SKNode?
    private var classParticles: SKNode?

    private let classData: [(cls: ChampionClass, icon: String)] = [
        (.mistborn,         "icon_mistborn"),
        (.radiant,          "icon_radiant"),
        (.awakener,         "icon_awakener"),
        (.elantrian,        "icon_elantrian"),
        (.sandMaster,       "icon_sandmaster"),
        (.nightmarePainter, "icon_painter")
    ]

    // Class theme colors
    private let classColors: [ChampionClass: (primary: SKColor, accent: SKColor)] = [
        .mistborn:         (SKColor(red: 0.5, green: 0.5, blue: 0.6, alpha: 1),
                            SKColor(red: 0.7, green: 0.7, blue: 0.8, alpha: 1)),
        .radiant:          (SKColor(red: 0.2, green: 0.6, blue: 1.0, alpha: 1),
                            SKColor(red: 0.4, green: 0.8, blue: 1.0, alpha: 1)),
        .awakener:         (SKColor(red: 0.8, green: 0.3, blue: 0.6, alpha: 1),
                            SKColor(red: 1.0, green: 0.5, blue: 0.8, alpha: 1)),
        .elantrian:        (SKColor(red: 0.9, green: 0.8, blue: 0.3, alpha: 1),
                            SKColor(red: 1.0, green: 0.9, blue: 0.5, alpha: 1)),
        .sandMaster:       (SKColor(red: 0.8, green: 0.7, blue: 0.4, alpha: 1),
                            SKColor(red: 0.9, green: 0.8, blue: 0.5, alpha: 1)),
        .nightmarePainter: (SKColor(red: 0.3, green: 0.1, blue: 0.4, alpha: 1),
                            SKColor(red: 0.5, green: 0.2, blue: 0.6, alpha: 1))
    ]

    // MARK: - Lifecycle

    override func didMove(to view: SKView) {
        backgroundColor = SKColor(red: 0.03, green: 0.03, blue: 0.08, alpha: 1.0)
        setupBackground()
        setupUI()
        updateSelection()
    }

    // MARK: - Background

    private func setupBackground() {
        // Starfield
        for _ in 0..<60 {
            let star = SKShapeNode(circleOfRadius: CGFloat.random(in: 0.3...1.2))
            star.fillColor = SKColor(white: CGFloat.random(in: 0.4...0.8), alpha: CGFloat.random(in: 0.3...0.7))
            star.strokeColor = .clear
            star.position = CGPoint(x: CGFloat.random(in: 0...size.width),
                                     y: CGFloat.random(in: 0...size.height))
            star.zPosition = -10

            let twinkle = SKAction.repeatForever(SKAction.sequence([
                SKAction.fadeAlpha(to: 0.2, duration: Double.random(in: 1...3)),
                SKAction.fadeAlpha(to: 0.7, duration: Double.random(in: 1...3))
            ]))
            star.run(twinkle)
            addChild(star)
        }

        // Side ornamental borders
        for xSign in [-1, 1] as [CGFloat] {
            let border = SKShapeNode(rectOf: CGSize(width: 1.5, height: size.height * 0.7))
            border.fillColor = SKColor(red: 0.4, green: 0.35, blue: 0.15, alpha: 0.2)
            border.strokeColor = .clear
            border.position = CGPoint(x: size.width / 2 + xSign * (size.width / 2 - 12),
                                       y: size.height / 2)
            border.zPosition = -5
            addChild(border)
        }
    }

    // MARK: - UI Setup

    private func setupUI() {
        let centerX = size.width / 2
        let topY = size.height

        // Title with underline
        let title = SKLabelNode(fontNamed: "Copperplate-Bold")
        title.text = "Créer votre Salteur"
        title.fontSize = 22
        title.fontColor = SKColor(red: 0.95, green: 0.85, blue: 0.4, alpha: 1.0)
        title.position = CGPoint(x: centerX, y: topY - 55)
        title.zPosition = 10
        addChild(title)

        let underline = SKShapeNode(rectOf: CGSize(width: 180, height: 1))
        underline.fillColor = SKColor(red: 0.6, green: 0.5, blue: 0.2, alpha: 0.4)
        underline.strokeColor = .clear
        underline.position = CGPoint(x: centerX, y: topY - 65)
        underline.zPosition = 10
        addChild(underline)

        // Name field
        let nameContainer = SKShapeNode(rectOf: CGSize(width: 200, height: 30), cornerRadius: 6)
        nameContainer.fillColor = SKColor(white: 0.08, alpha: 0.8)
        nameContainer.strokeColor = SKColor(red: 0.4, green: 0.35, blue: 0.2, alpha: 0.6)
        nameContainer.lineWidth = 1
        nameContainer.position = CGPoint(x: centerX, y: topY - 95)
        nameContainer.zPosition = 10
        nameContainer.name = "nameField"
        addChild(nameContainer)

        nameLabel = SKLabelNode(fontNamed: "Copperplate")
        nameLabel.text = playerName
        nameLabel.fontSize = 14
        nameLabel.fontColor = .white
        nameLabel.verticalAlignmentMode = .center
        nameLabel.name = "nameField"
        nameContainer.addChild(nameLabel)

        let editIcon = SKLabelNode(fontNamed: "Helvetica")
        editIcon.text = "✎"
        editIcon.fontSize = 11
        editIcon.fontColor = SKColor(white: 0.5, alpha: 0.6)
        editIcon.position = CGPoint(x: 85, y: 0)
        editIcon.verticalAlignmentMode = .center
        editIcon.name = "nameField"
        nameContainer.addChild(editIcon)

        // Class selection label
        let classTitle = SKLabelNode(fontNamed: "Copperplate")
        classTitle.text = "Choisissez votre classe"
        classTitle.fontSize = 12
        classTitle.fontColor = SKColor(white: 0.6, alpha: 0.8)
        classTitle.position = CGPoint(x: centerX, y: topY - 130)
        classTitle.zPosition = 10
        addChild(classTitle)

        // Class buttons (2 rows of 3)
        let buttonSize: CGFloat = 60
        let spacing: CGFloat = 14
        let totalWidth = buttonSize * 3 + spacing * 2
        let startX = centerX - totalWidth / 2 + buttonSize / 2

        for (i, data) in classData.enumerated() {
            let col = i % 3
            let row = i / 3

            let x = startX + CGFloat(col) * (buttonSize + spacing)
            let y = topY - 180 - CGFloat(row) * (buttonSize + spacing + 16)

            let button = createClassButton(
                championClass: data.cls,
                position: CGPoint(x: x, y: y),
                buttonSize: buttonSize
            )
            addChild(button)
            classButtons.append(button)
        }

        // Preview container
        previewContainer = SKNode()
        previewContainer.position = CGPoint(x: centerX, y: topY - 400)
        previewContainer.zPosition = 15
        addChild(previewContainer)

        // Description
        descriptionLabel = SKLabelNode(fontNamed: "Helvetica")
        descriptionLabel.fontSize = 11
        descriptionLabel.fontColor = SKColor(red: 0.75, green: 0.75, blue: 0.85, alpha: 1.0)
        descriptionLabel.position = CGPoint(x: centerX, y: topY - 470)
        descriptionLabel.zPosition = 10
        descriptionLabel.numberOfLines = 3
        descriptionLabel.preferredMaxLayoutWidth = size.width - 50
        addChild(descriptionLabel)

        // World origin label
        let worldLabel = SKLabelNode(fontNamed: "Helvetica")
        worldLabel.name = "worldLabel"
        worldLabel.fontSize = 11
        worldLabel.fontColor = SKColor(red: 0.5, green: 0.7, blue: 0.9, alpha: 0.9)
        worldLabel.position = CGPoint(x: centerX, y: topY - 500)
        worldLabel.zPosition = 10
        addChild(worldLabel)

        // Start button
        let startButton = createActionButton(
            text: "Commencer l'aventure",
            position: CGPoint(x: centerX, y: 55),
            name: "startGame",
            color: SKColor(red: 0.15, green: 0.4, blue: 0.15, alpha: 0.9),
            borderColor: SKColor(red: 0.3, green: 0.8, blue: 0.3, alpha: 0.8)
        )
        addChild(startButton)

        // Back button
        let backButton = createActionButton(
            text: "Retour",
            position: CGPoint(x: centerX, y: 22),
            name: "back",
            color: SKColor(red: 0.25, green: 0.12, blue: 0.12, alpha: 0.8),
            borderColor: SKColor(red: 0.5, green: 0.3, blue: 0.2, alpha: 0.5)
        )
        addChild(backButton)
    }

    // MARK: - Class Button

    private func createClassButton(championClass: ChampionClass, position: CGPoint, buttonSize: CGFloat) -> SKNode {
        let container = SKNode()
        container.position = position
        container.name = "class_\(championClass.rawValue)"

        let colors = classColors[championClass] ?? (SKColor.gray, SKColor.lightGray)

        // Shadow
        let shadow = SKShapeNode(rectOf: CGSize(width: buttonSize, height: buttonSize), cornerRadius: 8)
        shadow.fillColor = SKColor(white: 0, alpha: 0.3)
        shadow.strokeColor = .clear
        shadow.position = CGPoint(x: 1.5, y: -1.5)
        shadow.zPosition = 0
        container.addChild(shadow)

        let bg = SKShapeNode(rectOf: CGSize(width: buttonSize, height: buttonSize), cornerRadius: 8)
        bg.fillColor = SKColor(white: 0.08, alpha: 0.9)
        bg.strokeColor = colors.primary.withAlphaComponent(0.4)
        bg.lineWidth = 2
        bg.zPosition = 1
        bg.name = container.name
        container.addChild(bg)

        // Icon placeholder with class initial
        let initial = SKLabelNode(fontNamed: "Copperplate-Bold")
        initial.text = String(championClass.rawValue.prefix(2)).uppercased()
        initial.fontSize = 18
        initial.fontColor = colors.primary
        initial.verticalAlignmentMode = .center
        initial.position = CGPoint(x: 0, y: 4)
        initial.zPosition = 2
        initial.name = container.name
        bg.addChild(initial)

        // Shine
        let shine = SKShapeNode(rectOf: CGSize(width: buttonSize - 10, height: buttonSize * 0.25), cornerRadius: 3)
        shine.fillColor = SKColor(white: 1, alpha: 0.06)
        shine.strokeColor = .clear
        shine.position = CGPoint(x: 0, y: buttonSize * 0.22)
        shine.zPosition = 3
        bg.addChild(shine)

        // Label
        let label = SKLabelNode(fontNamed: "Helvetica")
        label.text = championClass.rawValue
        label.fontSize = 8
        label.fontColor = SKColor(white: 0.6, alpha: 0.8)
        label.position = CGPoint(x: 0, y: -buttonSize / 2 - 10)
        label.zPosition = 1
        label.name = container.name
        container.addChild(label)

        return container
    }

    // MARK: - Action Button

    private func createActionButton(text: String, position: CGPoint, name: String,
                                     color: SKColor, borderColor: SKColor) -> SKNode {
        let bg = SKShapeNode(rectOf: CGSize(width: 220, height: 34), cornerRadius: 8)
        bg.fillColor = color
        bg.strokeColor = borderColor
        bg.lineWidth = 1.5
        bg.position = position
        bg.zPosition = 20
        bg.name = name

        let label = SKLabelNode(fontNamed: "Copperplate")
        label.text = text
        label.fontSize = 14
        label.fontColor = .white
        label.verticalAlignmentMode = .center
        label.zPosition = 1
        label.name = name
        bg.addChild(label)

        return bg
    }

    // MARK: - Selection Update

    private func updateSelection() {
        let colors = classColors[selectedClass] ?? (SKColor.gray, SKColor.lightGray)

        // Highlight selected class
        for button in classButtons {
            let isSelected = button.name == "class_\(selectedClass.rawValue)"
            if let bg = button.children.first(where: { $0 is SKShapeNode && $0.zPosition == 1 }) as? SKShapeNode {
                if isSelected {
                    bg.strokeColor = SKColor(red: 0.95, green: 0.85, blue: 0.4, alpha: 1.0)
                    bg.lineWidth = 3
                    bg.fillColor = colors.primary.withAlphaComponent(0.15)
                } else {
                    let btnClass = ChampionClass(rawValue: String(button.name?.dropFirst(6) ?? "")) ?? .mistborn
                    let btnColors = classColors[btnClass] ?? (SKColor.gray, SKColor.lightGray)
                    bg.strokeColor = btnColors.primary.withAlphaComponent(0.4)
                    bg.lineWidth = 2
                    bg.fillColor = SKColor(white: 0.08, alpha: 0.9)
                }
            }
        }

        // Update preview
        updatePreview()

        // Description
        descriptionLabel.text = selectedClass.description

        // World origin
        if let worldLabel = childNode(withName: "worldLabel") as? SKLabelNode {
            worldLabel.text = "Monde d'origine: \(selectedClass.startingWorld)"
        }

        // Show/hide Radiant order selector
        orderSelector?.removeFromParent()
        orderSelector = nil
        if selectedClass == .radiant {
            setupOrderSelector()
        }

        // Update class particles
        updateClassParticles()
    }

    // MARK: - Preview

    private func updatePreview() {
        previewContainer.removeAllChildren()

        let colors = classColors[selectedClass] ?? (SKColor.gray, SKColor.lightGray)

        // Glowing platform
        let platform = SKShapeNode(ellipseOf: CGSize(width: 50, height: 14))
        platform.fillColor = colors.primary.withAlphaComponent(0.1)
        platform.strokeColor = colors.primary.withAlphaComponent(0.3)
        platform.lineWidth = 1
        platform.position = CGPoint(x: 0, y: -35)
        platform.zPosition = 0
        previewContainer.addChild(platform)

        // Body
        let body = SKShapeNode(rectOf: CGSize(width: 16, height: 22), cornerRadius: 3)
        body.fillColor = colors.primary.withAlphaComponent(0.8)
        body.strokeColor = colors.accent.withAlphaComponent(0.6)
        body.lineWidth = 1
        body.position = CGPoint(x: 0, y: 0)
        body.zPosition = 2
        previewContainer.addChild(body)

        // Head
        let head = SKShapeNode(circleOfRadius: 7)
        head.fillColor = SKColor(red: 0.85, green: 0.7, blue: 0.55, alpha: 1)
        head.strokeColor = SKColor(red: 0.6, green: 0.45, blue: 0.3, alpha: 0.6)
        head.lineWidth = 0.5
        head.position = CGPoint(x: 0, y: 20)
        head.zPosition = 3
        previewContainer.addChild(head)

        // Eyes
        for xSign in [-1, 1] as [CGFloat] {
            let eye = SKShapeNode(circleOfRadius: 1.5)
            eye.fillColor = colors.accent
            eye.strokeColor = .clear
            eye.position = CGPoint(x: xSign * 3, y: 21)
            eye.zPosition = 4
            previewContainer.addChild(eye)
        }

        // Arms
        for xSign in [-1, 1] as [CGFloat] {
            let arm = SKShapeNode(rectOf: CGSize(width: 5, height: 16), cornerRadius: 2)
            arm.fillColor = colors.primary.withAlphaComponent(0.7)
            arm.strokeColor = .clear
            arm.position = CGPoint(x: xSign * 12, y: -2)
            arm.zPosition = 1
            previewContainer.addChild(arm)
        }

        // Legs
        for xSign in [-1, 1] as [CGFloat] {
            let leg = SKShapeNode(rectOf: CGSize(width: 6, height: 14), cornerRadius: 2)
            leg.fillColor = colors.primary.withAlphaComponent(0.6)
            leg.strokeColor = .clear
            leg.position = CGPoint(x: xSign * 4, y: -22)
            leg.zPosition = 1
            previewContainer.addChild(leg)
        }

        // Gentle float animation
        let float = SKAction.repeatForever(SKAction.sequence([
            SKAction.moveBy(x: 0, y: 3, duration: 1.5),
            SKAction.moveBy(x: 0, y: -3, duration: 1.5)
        ]))
        previewContainer.run(float, withKey: "float")
    }

    // MARK: - Class Particles

    private func updateClassParticles() {
        classParticles?.removeFromParent()

        let container = SKNode()
        container.zPosition = 14
        container.position = previewContainer.position

        let colors = classColors[selectedClass] ?? (SKColor.gray, SKColor.lightGray)

        // Orbiting class-themed particles
        for i in 0..<6 {
            let p = SKShapeNode(circleOfRadius: CGFloat.random(in: 1...2.5))
            p.fillColor = colors.accent.withAlphaComponent(0.6)
            p.strokeColor = .clear
            p.glowWidth = 2

            let angle = CGFloat(i) * (.pi / 3)
            let radius: CGFloat = 35 + CGFloat.random(in: -5...5)
            p.position = CGPoint(x: cos(angle) * radius, y: sin(angle) * radius * 0.5)

            let orbit = SKAction.repeatForever(SKAction.customAction(withDuration: 4.0) { node, elapsed in
                let t = CGFloat(elapsed) / 4.0
                let a = angle + t * .pi * 2
                node.position = CGPoint(x: cos(a) * radius, y: sin(a) * radius * 0.5 - 10)
                node.alpha = 0.3 + 0.4 * (1 + sin(a * 2)) / 2
            })
            p.run(orbit)
            container.addChild(p)
        }

        addChild(container)
        classParticles = container
    }

    // MARK: - Radiant Order Selector

    private func setupOrderSelector() {
        let container = SKNode()
        container.position = CGPoint(x: size.width / 2, y: size.height - 530)
        container.zPosition = 10

        let title = SKLabelNode(fontNamed: "Copperplate")
        title.text = "Ordre Radieux:"
        title.fontSize = 11
        title.fontColor = SKColor(red: 0.4, green: 0.7, blue: 1.0, alpha: 0.8)
        title.position = CGPoint(x: 0, y: 22)
        container.addChild(title)

        let orders: [RadiantOrder] = [.windrunner, .lightweaver, .bondsmith, .edgedancer]
        let totalW = CGFloat(orders.count) * 80
        let startX = -totalW / 2 + 40

        for (i, order) in orders.enumerated() {
            let x = startX + CGFloat(i) * 80
            let isSelected = (selectedOrder ?? .windrunner) == order

            let bg = SKShapeNode(rectOf: CGSize(width: 72, height: 20), cornerRadius: 4)
            bg.fillColor = isSelected
                ? SKColor(red: 0.15, green: 0.3, blue: 0.5, alpha: 0.6)
                : SKColor(white: 0.1, alpha: 0.4)
            bg.strokeColor = isSelected
                ? SKColor(red: 0.3, green: 0.6, blue: 1.0, alpha: 0.7)
                : SKColor(white: 0.25, alpha: 0.3)
            bg.lineWidth = 1
            bg.position = CGPoint(x: x, y: 0)
            bg.name = "order_\(order.rawValue)"
            container.addChild(bg)

            let btn = SKLabelNode(fontNamed: "Helvetica")
            btn.text = order.rawValue
            btn.fontSize = 9
            btn.fontColor = isSelected
                ? SKColor(red: 0.4, green: 0.8, blue: 1.0, alpha: 1.0)
                : SKColor(white: 0.5, alpha: 0.8)
            btn.verticalAlignmentMode = .center
            btn.name = "order_\(order.rawValue)"
            bg.addChild(btn)
        }

        addChild(container)
        orderSelector = container

        if selectedOrder == nil {
            selectedOrder = .windrunner
        }
    }

    // MARK: - Touch Handling

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let touch = touches.first else { return }
        let location = touch.location(in: self)
        let tapped = nodes(at: location)

        for node in tapped {
            guard let name = node.name else { continue }

            // Class selection
            if name.hasPrefix("class_") {
                let className = String(name.dropFirst(6))
                if let cls = ChampionClass(rawValue: className) {
                    selectedClass = cls
                    selectedOrder = cls == .radiant ? .windrunner : nil
                    updateSelection()

                    if let button = classButtons.first(where: { $0.name == name }) {
                        button.run(SKAction.sequence([
                            SKAction.scale(to: 1.12, duration: 0.06),
                            SKAction.scale(to: 1.0, duration: 0.08)
                        ]))
                    }
                }
                return
            }

            // Radiant order selection
            if name.hasPrefix("order_") {
                let orderName = String(name.dropFirst(6))
                if let order = RadiantOrder(rawValue: orderName) {
                    selectedOrder = order
                    updateSelection()
                }
                return
            }

            // Name field
            if name == "nameField" {
                promptForName()
                return
            }

            // Start game
            if name == "startGame" {
                node.run(SKAction.sequence([
                    SKAction.scale(to: 0.93, duration: 0.05),
                    SKAction.scale(to: 1.0, duration: 0.08),
                    SKAction.run { [weak self] in self?.startGame() }
                ]))
                return
            }

            // Back
            if name == "back" {
                if let view = self.view {
                    let menu = MainMenuScene(size: view.bounds.size)
                    menu.scaleMode = .resizeFill
                    view.presentScene(menu, transition: .crossFade(withDuration: 0.4))
                }
                return
            }
        }
    }

    // MARK: - Name Input

    private func promptForName() {
        guard let viewController = view?.window?.rootViewController else { return }

        let alert = UIAlertController(title: "Nom du Salteur",
                                       message: "Entrez le nom de votre personnage",
                                       preferredStyle: .alert)
        alert.addTextField { textField in
            textField.text = self.playerName
            textField.placeholder = "Nom"
            textField.autocapitalizationType = .words
        }
        alert.addAction(UIAlertAction(title: "OK", style: .default) { [weak self] _ in
            if let text = alert.textFields?.first?.text, !text.isEmpty {
                self?.playerName = text
                self?.nameLabel.text = text
            }
        })
        alert.addAction(UIAlertAction(title: "Annuler", style: .cancel))
        viewController.present(alert, animated: true)
    }

    // MARK: - Start Game

    private func startGame() {
        GameManager.shared.startNewGame(name: playerName, championClass: selectedClass)

        if selectedClass == .radiant, let order = selectedOrder {
            GameManager.shared.champion?.radiantOrder = order
        }

        if let view = self.view {
            let startingZone = "\(selectedClass.startingWorld)_hub"
            SceneRouter(view: view).transitionToZone(startingZone)
        }
    }
}
