import SpriteKit

/// Boutons d'action style Wild Rift — attaque de base + 4 compétences + ultime
class ActionButtonsNode: SKNode {

    // MARK: - Button Data

    struct AbilitySlot {
        let index: Int
        let skillID: String?
        let iconName: String
        var cooldownRemaining: TimeInterval = 0
        var isOnCooldown: Bool { cooldownRemaining > 0 }
    }

    // MARK: - Configuration

    private let attackButtonRadius: CGFloat = 35
    private let abilityButtonRadius: CGFloat = 28
    private let ultimateButtonRadius: CGFloat = 32

    // MARK: - Nodes

    private var attackButton: SKShapeNode!
    private var abilityButtons: [SKShapeNode] = []
    private var ultimateButton: SKShapeNode!
    private var cooldownOverlays: [Int: SKShapeNode] = [:]
    private var cooldownLabels: [Int: SKLabelNode] = [:]

    // MARK: - Callbacks

    var onAttackPressed: (() -> Void)?
    var onAbilityPressed: ((Int) -> Void)?   // Index 0-3
    var onUltimatePressed: (() -> Void)?

    // MARK: - State

    private var slots: [AbilitySlot] = []

    // MARK: - Init

    override init() {
        super.init()
        setupAttackButton()
        setupAbilityButtons()
        setupUltimateButton()
        isUserInteractionEnabled = true
    }

    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    // MARK: - Setup

    private func setupAttackButton() {
        // Gros bouton d'attaque auto (comme Wild Rift — en bas à droite)
        attackButton = SKShapeNode(circleOfRadius: attackButtonRadius)
        attackButton.fillColor = SKColor(red: 0.7, green: 0.15, blue: 0.1, alpha: 0.85)
        attackButton.strokeColor = SKColor(red: 1.0, green: 0.3, blue: 0.2, alpha: 1.0)
        attackButton.lineWidth = 3
        attackButton.position = CGPoint(x: 0, y: 0)
        attackButton.zPosition = 1000
        attackButton.name = "attack"

        // Icône épée
        let attackIcon = SKLabelNode(fontNamed: "Helvetica-Bold")
        attackIcon.text = "ATK"
        attackIcon.fontSize = 14
        attackIcon.fontColor = .white
        attackIcon.verticalAlignmentMode = .center
        attackIcon.name = "attack"
        attackButton.addChild(attackIcon)

        // Pulse animation
        let pulse = SKAction.repeatForever(SKAction.sequence([
            SKAction.scale(to: 1.05, duration: 0.8),
            SKAction.scale(to: 1.0, duration: 0.8)
        ]))
        attackButton.run(pulse)

        addChild(attackButton)
    }

    private func setupAbilityButtons() {
        // 4 boutons de compétences disposés en arc autour du bouton d'attaque
        // Layout style Wild Rift : arc de cercle au-dessus et à gauche
        let angles: [CGFloat] = [.pi * 0.8, .pi * 0.55, .pi * 0.35, .pi * 0.15]
        let distanceFromCenter: CGFloat = 85
        let colors: [SKColor] = [
            SKColor(red: 0.2, green: 0.5, blue: 0.8, alpha: 0.85),  // Q - bleu
            SKColor(red: 0.1, green: 0.7, blue: 0.4, alpha: 0.85),  // W - vert
            SKColor(red: 0.7, green: 0.5, blue: 0.1, alpha: 0.85),  // E - orange
            SKColor(red: 0.6, green: 0.2, blue: 0.7, alpha: 0.85),  // R - violet
        ]
        let labels = ["1", "2", "3", "4"]

        for i in 0..<4 {
            let angle = angles[i]
            let x = cos(angle) * distanceFromCenter
            let y = sin(angle) * distanceFromCenter

            let button = SKShapeNode(circleOfRadius: abilityButtonRadius)
            button.fillColor = colors[i]
            button.strokeColor = colors[i].withAlphaComponent(1.0)
            button.lineWidth = 2
            button.position = CGPoint(x: x, y: y)
            button.zPosition = 1000
            button.name = "ability_\(i)"

            // Label
            let label = SKLabelNode(fontNamed: "Helvetica-Bold")
            label.text = labels[i]
            label.fontSize = 16
            label.fontColor = .white
            label.verticalAlignmentMode = .center
            label.name = "ability_\(i)"
            button.addChild(label)

            // Overlay de cooldown (caché par défaut)
            let cooldownOverlay = SKShapeNode(circleOfRadius: abilityButtonRadius)
            cooldownOverlay.fillColor = SKColor(white: 0, alpha: 0.7)
            cooldownOverlay.strokeColor = .clear
            cooldownOverlay.zPosition = 1001
            cooldownOverlay.isHidden = true
            cooldownOverlay.name = "cooldown_\(i)"
            button.addChild(cooldownOverlay)

            let cdLabel = SKLabelNode(fontNamed: "Helvetica-Bold")
            cdLabel.fontSize = 14
            cdLabel.fontColor = .white
            cdLabel.verticalAlignmentMode = .center
            cdLabel.zPosition = 1002
            cdLabel.isHidden = true
            cdLabel.name = "cd_label_\(i)"
            button.addChild(cdLabel)

            cooldownOverlays[i] = cooldownOverlay
            cooldownLabels[i] = cdLabel

            addChild(button)
            abilityButtons.append(button)
        }
    }

    private func setupUltimateButton() {
        // Bouton ultime — plus grand, au-dessus des compétences
        let angle: CGFloat = .pi * 0.5
        let distance: CGFloat = 130

        ultimateButton = SKShapeNode(circleOfRadius: ultimateButtonRadius)
        ultimateButton.fillColor = SKColor(red: 0.9, green: 0.7, blue: 0.1, alpha: 0.9)
        ultimateButton.strokeColor = SKColor(red: 1.0, green: 0.85, blue: 0.2, alpha: 1.0)
        ultimateButton.lineWidth = 3
        ultimateButton.position = CGPoint(x: cos(angle) * distance, y: sin(angle) * distance)
        ultimateButton.zPosition = 1000
        ultimateButton.name = "ultimate"

        let ultLabel = SKLabelNode(fontNamed: "Copperplate-Bold")
        ultLabel.text = "ULT"
        ultLabel.fontSize = 12
        ultLabel.fontColor = .black
        ultLabel.verticalAlignmentMode = .center
        ultLabel.name = "ultimate"
        ultimateButton.addChild(ultLabel)

        // Glow doré
        let glow = SKAction.repeatForever(SKAction.sequence([
            SKAction.run { [weak self] in
                self?.ultimateButton.glowWidth = 8
            },
            SKAction.wait(forDuration: 1.0),
            SKAction.run { [weak self] in
                self?.ultimateButton.glowWidth = 2
            },
            SKAction.wait(forDuration: 1.0)
        ]))
        ultimateButton.run(glow)

        addChild(ultimateButton)
    }

    // MARK: - Touch Handling

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let touch = touches.first else { return }
        let location = touch.location(in: self)

        // Check attack button
        if distance(from: location, to: attackButton.position) <= attackButtonRadius * 1.2 {
            pressAnimation(attackButton)
            onAttackPressed?()
            return
        }

        // Check ability buttons
        for (i, button) in abilityButtons.enumerated() {
            if distance(from: location, to: button.position) <= abilityButtonRadius * 1.2 {
                if cooldownOverlays[i]?.isHidden == true {
                    pressAnimation(button)
                    onAbilityPressed?(i)
                }
                return
            }
        }

        // Check ultimate
        if distance(from: location, to: ultimateButton.position) <= ultimateButtonRadius * 1.2 {
            pressAnimation(ultimateButton)
            onUltimatePressed?()
            return
        }
    }

    // MARK: - Cooldown Management

    func startCooldown(abilityIndex: Int, duration: TimeInterval) {
        guard abilityIndex < 4 else { return }

        let overlay = cooldownOverlays[abilityIndex]
        let label = cooldownLabels[abilityIndex]
        overlay?.isHidden = false
        label?.isHidden = false

        var remaining = duration
        let key = "cooldown_\(abilityIndex)"

        removeAction(forKey: key)

        let countdown = SKAction.repeatForever(SKAction.sequence([
            SKAction.run { [weak label] in
                remaining -= 0.1
                label?.text = String(format: "%.1f", max(0, remaining))
                if remaining <= 0 {
                    overlay?.isHidden = true
                    label?.isHidden = true
                }
            },
            SKAction.wait(forDuration: 0.1)
        ]))

        let stop = SKAction.sequence([
            SKAction.wait(forDuration: duration),
            SKAction.run { [weak self] in
                self?.removeAction(forKey: key)
                overlay?.isHidden = true
                label?.isHidden = true
            }
        ])

        run(countdown, withKey: key)
        run(stop, withKey: "\(key)_stop")
    }

    // MARK: - Update Ability Icons

    func updateAbilityIcon(index: Int, text: String, color: SKColor? = nil) {
        guard index < abilityButtons.count else { return }
        if let label = abilityButtons[index].children.first(where: { $0 is SKLabelNode }) as? SKLabelNode {
            label.text = text
        }
        if let color = color {
            abilityButtons[index].fillColor = color
        }
    }

    func setUltimateAvailable(_ available: Bool) {
        ultimateButton.alpha = available ? 1.0 : 0.4
    }

    // MARK: - Helpers

    private func distance(from a: CGPoint, to b: CGPoint) -> CGFloat {
        sqrt(pow(a.x - b.x, 2) + pow(a.y - b.y, 2))
    }

    private func pressAnimation(_ node: SKShapeNode) {
        node.run(SKAction.sequence([
            SKAction.scale(to: 0.85, duration: 0.05),
            SKAction.scale(to: 1.0, duration: 0.1)
        ]))
    }
}
