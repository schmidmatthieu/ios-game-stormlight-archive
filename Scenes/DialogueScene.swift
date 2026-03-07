import SpriteKit

/// Overlay de dialogue — connecte le DialogueSystem au DialogueBoxNode
/// Affiché par-dessus la ZoneScene lors d'interactions PNJ
class DialogueOverlayNode: SKNode, DialogueSystemDelegate {

    // MARK: - Properties

    private let screenSize: CGSize
    private let dialogueSystem = DialogueSystem()
    private var dialogueBox: DialogueBoxNode?
    private var backgroundDim: SKShapeNode?

    private(set) var isActive: Bool = false

    // Callbacks
    var onDialogueComplete: ((String) -> Void)?

    // MARK: - Init

    init(screenSize: CGSize) {
        self.screenSize = screenSize
        super.init()
        self.zPosition = 700
        self.name = "dialogueOverlay"
        dialogueSystem.delegate = self
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    // MARK: - Start Dialogue

    func startDialogue(treeID: String) {
        guard !isActive else { return }
        isActive = true

        // Dim background
        let dim = SKShapeNode(rectOf: screenSize)
        dim.fillColor = SKColor(white: 0, alpha: 0.3)
        dim.strokeColor = .clear
        dim.zPosition = 700
        addChild(dim)
        backgroundDim = dim

        // Dialogue box (uses existing DialogueBoxNode)
        let box = DialogueBoxNode(screenSize: screenSize)
        box.position = CGPoint(x: 0, y: -screenSize.height / 2 + 100)
        box.zPosition = 710
        box.onContinue = { [weak self] in
            self?.dialogueSystem.continueDialogue()
        }
        box.onChoiceSelected = { [weak self] index in
            self?.dialogueSystem.selectChoice(index)
        }
        addChild(box)
        dialogueBox = box

        // Start the dialogue tree
        dialogueSystem.startDialogue(treeID: treeID)
    }

    // MARK: - DialogueSystemDelegate

    func dialogueSystem(_ system: DialogueSystem, showNode node: DialogueSystem.DialogueNode, availableChoices: [DialogueSystem.DialogueChoice]) {
        dialogueBox?.showDialogue(
            speakerName: node.speaker,
            text: node.text,
            portrait: node.portrait,
            emotion: node.emotion
        )

        if !availableChoices.isEmpty {
            dialogueBox?.showChoices(availableChoices)
        }
    }

    func dialogueSystemDidEnd(_ system: DialogueSystem, treeID: String) {
        endDialogue(treeID: treeID)
    }

    // MARK: - End Dialogue

    private func endDialogue(treeID: String) {
        isActive = false

        let fadeOut = SKAction.sequence([
            SKAction.fadeOut(withDuration: 0.2),
            SKAction.run { [weak self] in
                self?.dialogueBox?.hide()
                self?.dialogueBox?.removeFromParent()
                self?.backgroundDim?.removeFromParent()
                self?.dialogueBox = nil
                self?.backgroundDim = nil
                self?.alpha = 1.0
            }
        ])
        run(fadeOut)

        onDialogueComplete?(treeID)
    }

    var dialogueActive: Bool { isActive }
}
