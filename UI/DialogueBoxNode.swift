import SpriteKit

/// UI de dialogue — boîte de texte avec portrait, texte progressif et choix
class DialogueBoxNode: SKNode {

    // MARK: - Configuration

    private let boxSize: CGSize
    private let portraitSize: CGSize = CGSize(width: 80, height: 80)

    // MARK: - Nodes

    private let backgroundNode: SKShapeNode
    private let portraitFrame: SKShapeNode
    private var portraitSprite: SKSpriteNode?
    private let nameLabel: SKLabelNode
    private let textLabel: SKLabelNode
    private var choiceNodes: [SKShapeNode] = []

    // MARK: - State

    private var fullText: String = ""
    private var displayedCharCount: Int = 0
    private var isTyping: Bool = false
    private let typingSpeed: TimeInterval = 0.03  // Secondes par caractère

    var onChoiceSelected: ((Int) -> Void)?
    var onContinue: (() -> Void)?

    // MARK: - Init

    init(screenSize: CGSize) {
        self.boxSize = CGSize(width: screenSize.width - 40, height: 160)

        // Background box
        backgroundNode = SKShapeNode(rectOf: boxSize, cornerRadius: 12)
        backgroundNode.fillColor = SKColor(red: 0.05, green: 0.05, blue: 0.1, alpha: 0.92)
        backgroundNode.strokeColor = SKColor(red: 0.4, green: 0.35, blue: 0.2, alpha: 1.0)
        backgroundNode.lineWidth = 2
        backgroundNode.zPosition = 5000

        // Portrait frame
        portraitFrame = SKShapeNode(rectOf: CGSize(width: portraitSize.width + 4, height: portraitSize.height + 4), cornerRadius: 6)
        portraitFrame.fillColor = SKColor(white: 0.1, alpha: 1.0)
        portraitFrame.strokeColor = SKColor(red: 0.5, green: 0.4, blue: 0.2, alpha: 1.0)
        portraitFrame.lineWidth = 2
        portraitFrame.position = CGPoint(x: -boxSize.width / 2 + portraitSize.width / 2 + 15, y: 20)
        portraitFrame.zPosition = 5001

        // Name label
        nameLabel = SKLabelNode(fontNamed: "Copperplate-Bold")
        nameLabel.fontSize = 14
        nameLabel.fontColor = SKColor(red: 0.9, green: 0.8, blue: 0.4, alpha: 1.0)
        nameLabel.horizontalAlignmentMode = .left
        nameLabel.position = CGPoint(x: -boxSize.width / 2 + portraitSize.width + 25, y: 50)
        nameLabel.zPosition = 5001

        // Text label
        textLabel = SKLabelNode(fontNamed: "Helvetica")
        textLabel.fontSize = 13
        textLabel.fontColor = .white
        textLabel.horizontalAlignmentMode = .left
        textLabel.verticalAlignmentMode = .top
        textLabel.preferredMaxLayoutWidth = boxSize.width - portraitSize.width - 45
        textLabel.numberOfLines = 4
        textLabel.position = CGPoint(x: -boxSize.width / 2 + portraitSize.width + 25, y: 35)
        textLabel.zPosition = 5001

        super.init()

        addChild(backgroundNode)
        addChild(portraitFrame)
        addChild(nameLabel)
        addChild(textLabel)

        isUserInteractionEnabled = true
        isHidden = true
    }

    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    // MARK: - Show Dialogue

    func showDialogue(speakerName: String, text: String, portrait: String?, emotion: DialogueSystem.Emotion?) {
        isHidden = false
        clearChoices()

        nameLabel.text = speakerName
        fullText = text
        displayedCharCount = 0
        textLabel.text = ""

        // Portrait
        portraitSprite?.removeFromParent()
        if let portrait = portrait {
            portraitSprite = SKSpriteNode(imageNamed: portrait)
            portraitSprite?.size = portraitSize
            portraitSprite?.position = portraitFrame.position
            portraitSprite?.zPosition = 5002
            addChild(portraitSprite!)
        }

        // Portrait tint basé sur l'émotion
        if let emotion = emotion {
            let tint: SKColor
            switch emotion {
            case .neutral:     tint = .white
            case .happy:       tint = SKColor(red: 1.0, green: 0.9, blue: 0.7, alpha: 1.0)
            case .sad:         tint = SKColor(red: 0.6, green: 0.6, blue: 0.8, alpha: 1.0)
            case .angry:       tint = SKColor(red: 1.0, green: 0.5, blue: 0.4, alpha: 1.0)
            case .surprised:   tint = SKColor(red: 1.0, green: 1.0, blue: 0.5, alpha: 1.0)
            case .scared:      tint = SKColor(red: 0.7, green: 0.8, blue: 0.9, alpha: 1.0)
            case .determined:  tint = SKColor(red: 0.9, green: 0.7, blue: 0.3, alpha: 1.0)
            case .mysterious:  tint = SKColor(red: 0.6, green: 0.4, blue: 0.8, alpha: 1.0)
            }
            portraitFrame.strokeColor = tint
        }

        // Animation de frappe
        startTyping()

        // Indicateur "continuer"
        let continueHint = SKLabelNode(fontNamed: "Helvetica")
        continueHint.text = "▼"
        continueHint.fontSize = 12
        continueHint.fontColor = SKColor(white: 0.5, alpha: 0.8)
        continueHint.position = CGPoint(x: boxSize.width / 2 - 20, y: -boxSize.height / 2 + 15)
        continueHint.name = "continueHint"
        continueHint.zPosition = 5001

        // Clignotement
        let blink = SKAction.repeatForever(SKAction.sequence([
            SKAction.fadeAlpha(to: 0.3, duration: 0.5),
            SKAction.fadeAlpha(to: 0.8, duration: 0.5)
        ]))
        continueHint.run(blink)

        // Retirer l'ancien, ajouter le nouveau
        childNode(withName: "continueHint")?.removeFromParent()
        addChild(continueHint)
    }

    // MARK: - Show Choices

    func showChoices(_ choices: [DialogueSystem.DialogueChoice]) {
        clearChoices()
        childNode(withName: "continueHint")?.isHidden = true

        for (i, choice) in choices.enumerated() {
            let choiceWidth = boxSize.width - 30
            let choiceHeight: CGFloat = 30
            let yOffset = -boxSize.height / 2 - 10 - CGFloat(i) * (choiceHeight + 8)

            let bg = SKShapeNode(rectOf: CGSize(width: choiceWidth, height: choiceHeight), cornerRadius: 6)
            bg.fillColor = SKColor(red: 0.1, green: 0.1, blue: 0.2, alpha: 0.9)
            bg.strokeColor = SKColor(red: 0.4, green: 0.35, blue: 0.2, alpha: 0.8)
            bg.lineWidth = 1.5
            bg.position = CGPoint(x: 0, y: yOffset)
            bg.zPosition = 5001
            bg.name = "choice_\(i)"

            let label = SKLabelNode(fontNamed: "Helvetica")
            label.text = "▸ \(choice.text)"
            label.fontSize = 12
            label.fontColor = .white
            label.horizontalAlignmentMode = .left
            label.verticalAlignmentMode = .center
            label.position = CGPoint(x: -choiceWidth / 2 + 15, y: 0)
            label.name = "choice_\(i)"
            bg.addChild(label)

            // Check si le choix est grisé (requirements pas remplis)
            if let req = choice.requiredReputation {
                let rep = GameManager.shared.champion?.reputation[req.worldID] ?? 0
                if rep < req.minReputation {
                    bg.fillColor = SKColor(white: 0.1, alpha: 0.5)
                    label.fontColor = .gray
                    label.text = "▸ [Réputation \(req.worldID) \(req.minReputation) requise] \(choice.text)"
                }
            }

            addChild(bg)
            choiceNodes.append(bg)
        }
    }

    private func clearChoices() {
        choiceNodes.forEach { $0.removeFromParent() }
        choiceNodes.removeAll()
    }

    // MARK: - Typing Animation

    private func startTyping() {
        isTyping = true
        removeAction(forKey: "typing")

        let typeAction = SKAction.repeat(SKAction.sequence([
            SKAction.run { [weak self] in
                guard let self = self else { return }
                if self.displayedCharCount < self.fullText.count {
                    self.displayedCharCount += 1
                    let index = self.fullText.index(self.fullText.startIndex, offsetBy: self.displayedCharCount)
                    self.textLabel.text = String(self.fullText[..<index])
                } else {
                    self.isTyping = false
                    self.removeAction(forKey: "typing")
                }
            },
            SKAction.wait(forDuration: typingSpeed)
        ]), count: fullText.count)

        run(typeAction, withKey: "typing")
    }

    private func skipTyping() {
        isTyping = false
        removeAction(forKey: "typing")
        textLabel.text = fullText
        displayedCharCount = fullText.count
    }

    // MARK: - Hide

    func hide() {
        isHidden = true
        clearChoices()
        removeAction(forKey: "typing")
    }

    // MARK: - Touch

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let touch = touches.first else { return }
        let location = touch.location(in: self)

        // Si on est en train de taper, skip
        if isTyping {
            skipTyping()
            return
        }

        // Vérifier les choix
        for (i, node) in choiceNodes.enumerated() {
            if node.contains(location) {
                // Animation de sélection
                node.run(SKAction.sequence([
                    SKAction.group([
                        SKAction.scale(to: 0.95, duration: 0.05),
                        SKAction.run { node.fillColor = SKColor(red: 0.3, green: 0.25, blue: 0.1, alpha: 0.9) }
                    ]),
                    SKAction.scale(to: 1.0, duration: 0.1)
                ]))
                onChoiceSelected?(i)
                return
            }
        }

        // Sinon, continuer le dialogue
        if choiceNodes.isEmpty {
            onContinue?()
        }
    }
}
