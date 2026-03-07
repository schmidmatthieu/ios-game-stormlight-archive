import SpriteKit

/// Scène de création de personnage — choix du nom, classe et monde d'origine
class CharacterCreationScene: SKScene {

    // MARK: - Properties

    private var selectedClass: ChampionClass = .mistborn
    private var selectedOrder: RadiantOrder? = nil
    private var playerName: String = "Salteur"

    private var isTransitioning = false
    private var classButtons: [SKNode] = []
    private var descriptionLabel: SKLabelNode!
    private var previewSprite: SKSpriteNode!
    private var nameLabel: SKLabelNode!
    private var orderSelector: SKNode?

    private let classData: [(cls: ChampionClass, icon: String)] = [
        (.mistborn,         "icon_mistborn"),
        (.radiant,          "icon_radiant"),
        (.awakener,         "icon_awakener"),
        (.elantrian,        "icon_elantrian"),
        (.sandMaster,       "icon_sandmaster"),
        (.nightmarePainter, "icon_painter")
    ]

    // MARK: - Lifecycle

    override func didMove(to view: SKView) {
        backgroundColor = SKColor(red: 0.04, green: 0.04, blue: 0.1, alpha: 1.0)
        setupUI()
        updateSelection()
    }

    // MARK: - UI Setup

    private func setupUI() {
        let centerX = size.width / 2
        let topY = size.height

        // Title
        let title = SKLabelNode(fontNamed: "Copperplate-Bold")
        title.text = "Créer votre Salteur"
        title.fontSize = 24
        title.fontColor = SKColor(red: 0.9, green: 0.8, blue: 0.4, alpha: 1.0)
        title.position = CGPoint(x: centerX, y: topY - 60)
        addChild(title)

        // Name field (tap to edit)
        nameLabel = SKLabelNode(fontNamed: "Copperplate")
        nameLabel.text = "Nom: \(playerName)"
        nameLabel.fontSize = 16
        nameLabel.fontColor = .white
        nameLabel.position = CGPoint(x: centerX, y: topY - 100)
        nameLabel.name = "nameField"
        addChild(nameLabel)

        let nameHint = SKLabelNode(fontNamed: "Helvetica")
        nameHint.text = "(touchez pour modifier)"
        nameHint.fontSize = 10
        nameHint.fontColor = .gray
        nameHint.position = CGPoint(x: centerX, y: topY - 116)
        addChild(nameHint)

        // Class selection label
        let classTitle = SKLabelNode(fontNamed: "Copperplate")
        classTitle.text = "Choisissez votre classe"
        classTitle.fontSize = 14
        classTitle.fontColor = .lightGray
        classTitle.position = CGPoint(x: centerX, y: topY - 150)
        addChild(classTitle)

        // Class buttons (2 rows of 3)
        let buttonSize: CGFloat = 64
        let spacing: CGFloat = 16
        let totalWidth = buttonSize * 3 + spacing * 2
        let startX = centerX - totalWidth / 2 + buttonSize / 2

        for (i, data) in classData.enumerated() {
            let col = i % 3
            let row = i / 3

            let x = startX + CGFloat(col) * (buttonSize + spacing)
            let y = topY - 200 - CGFloat(row) * (buttonSize + spacing + 20)

            let button = createClassButton(
                championClass: data.cls,
                iconName: data.icon,
                position: CGPoint(x: x, y: y),
                size: buttonSize
            )
            addChild(button)
            classButtons.append(button)
        }

        // Preview sprite
        previewSprite = SKSpriteNode(color: .clear, size: CGSize(width: 64, height: 96))
        previewSprite.position = CGPoint(x: centerX, y: topY - 420)
        addChild(previewSprite)

        // Description
        descriptionLabel = SKLabelNode(fontNamed: "Helvetica")
        descriptionLabel.fontSize = 11
        descriptionLabel.fontColor = SKColor(red: 0.8, green: 0.8, blue: 0.9, alpha: 1.0)
        descriptionLabel.position = CGPoint(x: centerX, y: topY - 480)
        descriptionLabel.numberOfLines = 3
        descriptionLabel.preferredMaxLayoutWidth = size.width - 60
        addChild(descriptionLabel)

        // World origin label
        let worldLabel = SKLabelNode(fontNamed: "Helvetica")
        worldLabel.name = "worldLabel"
        worldLabel.fontSize = 12
        worldLabel.fontColor = SKColor(red: 0.6, green: 0.8, blue: 1.0, alpha: 1.0)
        worldLabel.position = CGPoint(x: centerX, y: topY - 510)
        addChild(worldLabel)

        // Start button
        let startButton = createActionButton(
            text: "Commencer l'aventure",
            position: CGPoint(x: centerX, y: 60),
            name: "startGame",
            color: SKColor(red: 0.2, green: 0.5, blue: 0.2, alpha: 0.9)
        )
        addChild(startButton)

        // Back button
        let backButton = createActionButton(
            text: "Retour",
            position: CGPoint(x: centerX, y: 25),
            name: "back",
            color: SKColor(red: 0.3, green: 0.15, blue: 0.15, alpha: 0.8)
        )
        addChild(backButton)
    }

    // MARK: - Class Button

    private func createClassButton(championClass: ChampionClass, iconName: String,
                                    position: CGPoint, size: CGFloat) -> SKNode {
        let container = SKNode()
        container.position = position
        container.name = "class_\(championClass.rawValue)"

        let bg = SKShapeNode(rectOf: CGSize(width: size, height: size), cornerRadius: 8)
        bg.fillColor = SKColor(white: 0.12, alpha: 0.9)
        bg.strokeColor = SKColor(red: 0.4, green: 0.35, blue: 0.2, alpha: 1.0)
        bg.lineWidth = 2
        bg.name = container.name
        container.addChild(bg)

        let icon = SKSpriteNode(imageNamed: iconName)
        icon.size = CGSize(width: size - 16, height: size - 16)
        icon.name = container.name
        container.addChild(icon)

        let label = SKLabelNode(fontNamed: "Helvetica")
        label.text = championClass.rawValue
        label.fontSize = 9
        label.fontColor = .lightGray
        label.position = CGPoint(x: 0, y: -size / 2 - 12)
        label.name = container.name
        container.addChild(label)

        return container
    }

    // MARK: - Action Button

    private func createActionButton(text: String, position: CGPoint, name: String, color: SKColor) -> SKNode {
        let bg = SKShapeNode(rectOf: CGSize(width: 240, height: 36), cornerRadius: 8)
        bg.fillColor = color
        bg.strokeColor = SKColor(red: 0.6, green: 0.5, blue: 0.2, alpha: 1.0)
        bg.lineWidth = 1.5
        bg.position = position
        bg.name = name

        let label = SKLabelNode(fontNamed: "Copperplate")
        label.text = text
        label.fontSize = 15
        label.fontColor = .white
        label.verticalAlignmentMode = .center
        label.name = name
        bg.addChild(label)

        return bg
    }

    // MARK: - Selection Update

    private func updateSelection() {
        // Highlight selected class
        for button in classButtons {
            let bg = button.children.first as? SKShapeNode
            let isSelected = button.name == "class_\(selectedClass.rawValue)"
            bg?.strokeColor = isSelected
                ? SKColor(red: 0.9, green: 0.8, blue: 0.4, alpha: 1.0)
                : SKColor(red: 0.4, green: 0.35, blue: 0.2, alpha: 1.0)
            bg?.lineWidth = isSelected ? 3 : 2
        }

        // Update preview
        let spriteName: String
        switch selectedClass {
        case .mistborn:         spriteName = "champion_mistborn"
        case .radiant:          spriteName = "champion_radiant"
        case .awakener:         spriteName = "champion_awakener"
        case .elantrian:        spriteName = "champion_elantrian"
        case .sandMaster:       spriteName = "champion_sandmaster"
        case .nightmarePainter: spriteName = "champion_painter"
        }
        previewSprite.texture = SKTexture(imageNamed: spriteName)

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
    }

    // MARK: - Radiant Order Selector

    private func setupOrderSelector() {
        let container = SKNode()
        container.position = CGPoint(x: size.width / 2, y: size.height - 540)

        let title = SKLabelNode(fontNamed: "Helvetica")
        title.text = "Ordre Radieux:"
        title.fontSize = 11
        title.fontColor = .lightGray
        title.position = CGPoint(x: 0, y: 20)
        container.addChild(title)

        let orders: [RadiantOrder] = [.windrunner, .lightweaver, .bondsmith, .edgedancer]
        let totalW = CGFloat(orders.count) * 80
        let startX = -totalW / 2 + 40

        for (i, order) in orders.enumerated() {
            let x = startX + CGFloat(i) * 80
            let btn = SKLabelNode(fontNamed: "Helvetica")
            btn.text = order.rawValue
            btn.fontSize = 10
            btn.fontColor = (selectedOrder ?? .windrunner) == order
                ? SKColor(red: 0.4, green: 0.7, blue: 1.0, alpha: 1.0)
                : .gray
            btn.position = CGPoint(x: x, y: 0)
            btn.name = "order_\(order.rawValue)"
            container.addChild(btn)
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

                    // Bounce animation
                    if let button = classButtons.first(where: { $0.name == name }) {
                        button.run(SKAction.sequence([
                            SKAction.scale(to: 1.15, duration: 0.08),
                            SKAction.scale(to: 1.0, duration: 0.1)
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
                startGame()
                return
            }

            // Back
            if name == "back" {
                if let view = self.view {
                    let menu = MainMenuScene(size: view.bounds.size)
                    menu.scaleMode = .resizeFill
                    view.presentScene(menu, transition: .fade(withDuration: 0.3))
                }
                return
            }
        }
    }

    // MARK: - Name Input

    private func promptForName() {
        guard let viewController = view?.window?.rootViewController else { return }

        let alert = UIAlertController(title: "Nom du Salteur", message: "Entrez le nom de votre personnage", preferredStyle: .alert)
        alert.addTextField { textField in
            textField.text = self.playerName
            textField.placeholder = "Nom"
            textField.autocapitalizationType = .words
        }
        alert.addAction(UIAlertAction(title: "OK", style: .default) { [weak self] _ in
            if let text = alert.textFields?.first?.text, !text.isEmpty {
                self?.playerName = text
                self?.nameLabel.text = "Nom: \(text)"
            }
        })
        alert.addAction(UIAlertAction(title: "Annuler", style: .cancel))
        viewController.present(alert, animated: true)
    }

    // MARK: - Start Game

    private func startGame() {
        guard !isTransitioning else { return }
        isTransitioning = true

        GameManager.shared.startNewGame(name: playerName, championClass: selectedClass)

        // Set radiant order if applicable
        if selectedClass == .radiant, let order = selectedOrder {
            GameManager.shared.champion?.radiantOrder = order
        }

        if let view = self.view {
            let startingZone = "\(selectedClass.startingWorld)_hub"
            let router = SceneRouter(view: view)
            router.transitionToZone(startingZone)
        }
    }
}
