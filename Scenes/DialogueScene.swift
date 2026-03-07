import SpriteKit

/// Scène overlay de dialogue — affichée par-dessus la ZoneScene lors d'interactions PNJ
/// Gère les arbres de dialogue, choix narratifs, et effets de réputation
class DialogueOverlayNode: SKNode {

    // MARK: - Properties

    private let screenSize: CGSize
    private let dialogueSystem = DialogueSystem()

    // Visual elements
    private var backgroundDim: SKShapeNode?
    private var dialogueBox: DialogueBoxNode?
    private var portraitNode: SKSpriteNode?

    // State
    private var currentDialogueID: String?
    private var currentNodeIndex: Int = 0
    private var isActive: Bool = false

    // Callbacks
    var onDialogueComplete: (() -> Void)?
    var onQuestAccepted: ((String) -> Void)?
    var onShopRequested: ((String) -> Void)?
    var onReputationChange: ((WorldID, Int) -> Void)?

    // MARK: - Init

    init(screenSize: CGSize) {
        self.screenSize = screenSize
        super.init()
        self.zPosition = 700
        self.name = "dialogueOverlay"
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    // MARK: - Start Dialogue

    func startDialogue(treeID: String, npcName: String, portraitName: String? = nil) {
        guard !isActive else { return }
        isActive = true
        currentDialogueID = treeID
        currentNodeIndex = 0

        // Dim background
        let dim = SKShapeNode(rectOf: screenSize)
        dim.fillColor = SKColor(white: 0, alpha: 0.3)
        dim.strokeColor = .clear
        dim.position = .zero
        dim.zPosition = 700
        addChild(dim)
        backgroundDim = dim

        // Portrait
        if let portrait = portraitName {
            let sprite = SKSpriteNode(imageNamed: portrait)
            sprite.size = CGSize(width: 64, height: 64)
            sprite.position = CGPoint(x: -screenSize.width / 2 + 60, y: -screenSize.height / 2 + 120)
            sprite.zPosition = 710
            addChild(sprite)
            portraitNode = sprite
        }

        // Dialogue box
        let box = DialogueBoxNode(size: CGSize(width: screenSize.width - 40, height: 120))
        box.position = CGPoint(x: 0, y: -screenSize.height / 2 + 80)
        box.zPosition = 710
        addChild(box)
        dialogueBox = box

        // Load first node
        advanceDialogue()
    }

    // MARK: - Advance

    func advanceDialogue() {
        guard let treeID = currentDialogueID else { return }

        let nodes = dialogueSystem.getDialogueNodes(for: treeID)
        guard currentNodeIndex < nodes.count else {
            endDialogue()
            return
        }

        let node = nodes[currentNodeIndex]

        // Show text with typing effect
        dialogueBox?.showText(
            speaker: node.speaker,
            text: node.text,
            choices: node.choices
        )

        dialogueBox?.onChoiceSelected = { [weak self] choiceIndex in
            self?.handleChoice(choiceIndex, for: node)
        }

        dialogueBox?.onTextComplete = { [weak self] in
            // Auto-advance if no choices
            if node.choices.isEmpty {
                self?.currentNodeIndex += 1
            }
        }
    }

    // MARK: - Choice Handling

    private func handleChoice(_ index: Int, for node: DialogueSystem.DialogueNode) {
        guard index < node.choices.count else { return }
        let choice = node.choices[index]

        // Process choice actions
        for action in choice.actions {
            switch action.type {
            case .giveQuest:
                if let questID = action.value {
                    onQuestAccepted?(questID)
                }
            case .openShop:
                if let shopID = action.value {
                    onShopRequested?(shopID)
                    endDialogue()
                    return
                }
            case .changeReputation:
                if let worldID = action.worldID, let amount = action.amount {
                    onReputationChange?(worldID, amount)
                }
            case .gotoNode:
                if let targetIndex = action.nodeIndex {
                    currentNodeIndex = targetIndex
                    advanceDialogue()
                    return
                }
            case .endDialogue:
                endDialogue()
                return
            }
        }

        currentNodeIndex += 1
        advanceDialogue()
    }

    // MARK: - End Dialogue

    func endDialogue() {
        isActive = false
        currentDialogueID = nil

        // Fade out
        let fadeOut = SKAction.sequence([
            SKAction.fadeOut(withDuration: 0.2),
            SKAction.run { [weak self] in
                self?.backgroundDim?.removeFromParent()
                self?.dialogueBox?.removeFromParent()
                self?.portraitNode?.removeFromParent()
                self?.backgroundDim = nil
                self?.dialogueBox = nil
                self?.portraitNode = nil
            }
        ])
        run(fadeOut)

        onDialogueComplete?()
    }

    // MARK: - Touch Handling

    func handleTouch(at point: CGPoint) {
        guard isActive else { return }

        if let box = dialogueBox {
            // Check if touch is on a choice
            let localPoint = box.convert(point, from: self)
            if box.handleTouch(at: localPoint) {
                return
            }
        }

        // Tap to advance text
        if dialogueBox?.isTyping == true {
            dialogueBox?.skipTyping()
        } else {
            currentNodeIndex += 1
            advanceDialogue()
        }
    }

    var dialogueActive: Bool { isActive }
}
