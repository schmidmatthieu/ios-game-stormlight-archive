import SpriteKit

/// Boutons d'action style Wild Rift — attaque de base + 4 compétences + ultime
/// Supporte le mode contextuel (attaque, parler, entrer, ramasser)
class ActionButtonsNode: SKNode {

    // MARK: - Context Mode

    enum ActionMode: Equatable {
        case attack
        case talk(npcID: String)
        case enter(zoneID: String)
        case loot
    }

    // MARK: - Configuration

    private let attackButtonRadius: CGFloat = 35
    private let abilityButtonRadius: CGFloat = 28
    private let ultimateButtonRadius: CGFloat = 32

    // MARK: - Nodes

    private var attackButton: SKShapeNode!
    private var attackLabel: SKLabelNode!
    private var abilityButtons: [SKShapeNode] = []
    private var ultimateButton: SKShapeNode!
    private var cooldownOverlays: [Int: SKShapeNode] = [:]
    private var cooldownLabels: [Int: SKLabelNode] = [:]

    // MARK: - Callbacks

    var onAttackPressed: (() -> Void)?
    var onAbilityPressed: ((Int) -> Void)?
    var onUltimatePressed: (() -> Void)?
    var onInteractPressed: ((ActionMode) -> Void)?

    // MARK: - State

    private(set) var currentMode: ActionMode = .attack

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

    // MARK: - Context Mode Switching

    func setMode(_ mode: ActionMode) {
        guard mode != currentMode else { return }
        currentMode = mode

        switch mode {
        case .attack:
            attackButton.fillColor = SKColor(red: 0.7, green: 0.15, blue: 0.1, alpha: 0.85)
            attackButton.strokeColor = SKColor(red: 1.0, green: 0.3, blue: 0.2, alpha: 1.0)
            attackLabel.text = "ATK"
            attackLabel.fontSize = 14

        case .talk:
            attackButton.fillColor = SKColor(red: 0.15, green: 0.5, blue: 0.7, alpha: 0.85)
            attackButton.strokeColor = SKColor(red: 0.2, green: 0.7, blue: 0.9, alpha: 1.0)
            attackLabel.text = "Parler"
            attackLabel.fontSize = 11

        case .enter:
            attackButton.fillColor = SKColor(red: 0.15, green: 0.6, blue: 0.3, alpha: 0.85)
            attackButton.strokeColor = SKColor(red: 0.2, green: 0.8, blue: 0.4, alpha: 1.0)
            attackLabel.text = "Entrer"
            attackLabel.fontSize = 11

        case .loot:
            attackButton.fillColor = SKColor(red: 0.6, green: 0.5, blue: 0.1, alpha: 0.85)
            attackButton.strokeColor = SKColor(red: 0.8, green: 0.7, blue: 0.2, alpha: 1.0)
            attackLabel.text = "Ramasser"
            attackLabel.fontSize = 10
        }

        // Bounce animation on mode change
        attackButton.run(SKAction.sequence([
            SKAction.scale(to: 1.15, duration: 0.08),
            SKAction.scale(to: 1.0, duration: 0.1)
        ]))
    }

    // MARK: - Setup

    private func setupAttackButton() {
        attackButton = SKShapeNode(circleOfRadius: attackButtonRadius)
        attackButton.fillColor = SKColor(red: 0.7, green: 0.15, blue: 0.1, alpha: 0.85)
        attackButton.strokeColor = SKColor(red: 1.0, green: 0.3, blue: 0.2, alpha: 1.0)
        attackButton.lineWidth = 3
        attackButton.position = CGPoint(x: 0, y: 0)
        attackButton.zPosition = 1000
        attackButton.name = "attack"

        // Shadow
        let shadow = SKShapeNode(circleOfRadius: attackButtonRadius)
        shadow.fillColor = SKColor(white: 0, alpha: 0.3)
        shadow.strokeColor = .clear
        shadow.position = CGPoint(x: 2, y: -2)
        shadow.zPosition = 999
        addChild(shadow)

        // Label
        attackLabel = SKLabelNode(fontNamed: "Copperplate-Bold")
        attackLabel.text = "ATK"
        attackLabel.fontSize = 14
        attackLabel.fontColor = .white
        attackLabel.verticalAlignmentMode = .center
        attackLabel.name = "attackLabel"
        attackButton.addChild(attackLabel)

        // Shine highlight
        let shine = SKShapeNode(ellipseOf: CGSize(width: attackButtonRadius * 1.2, height: attackButtonRadius * 0.5))
        shine.fillColor = SKColor(white: 1, alpha: 0.12)
        shine.strokeColor = .clear
        shine.position = CGPoint(x: 0, y: attackButtonRadius * 0.3)
        shine.zPosition = 1001
        attackButton.addChild(shine)

        // Subtle pulse
        let pulse = SKAction.repeatForever(SKAction.sequence([
            SKAction.scale(to: 1.03, duration: 1.0),
            SKAction.scale(to: 1.0, duration: 1.0)
        ]))
        attackButton.run(pulse)

        addChild(attackButton)
    }

    private func setupAbilityButtons() {
        let angles: [CGFloat] = [.pi * 0.8, .pi * 0.55, .pi * 0.35, .pi * 0.15]
        let distanceFromCenter: CGFloat = 85
        let colors: [SKColor] = [
            SKColor(red: 0.2, green: 0.5, blue: 0.8, alpha: 0.85),
            SKColor(red: 0.1, green: 0.7, blue: 0.4, alpha: 0.85),
            SKColor(red: 0.7, green: 0.5, blue: 0.1, alpha: 0.85),
            SKColor(red: 0.6, green: 0.2, blue: 0.7, alpha: 0.85),
        ]
        let labels = ["1", "2", "3", "4"]

        for i in 0..<4 {
            let angle = angles[i]
            let x = cos(angle) * distanceFromCenter
            let y = sin(angle) * distanceFromCenter

            // Button shadow
            let shadow = SKShapeNode(circleOfRadius: abilityButtonRadius)
            shadow.fillColor = SKColor(white: 0, alpha: 0.25)
            shadow.strokeColor = .clear
            shadow.position = CGPoint(x: x + 1.5, y: y - 1.5)
            shadow.zPosition = 999
            addChild(shadow)

            let button = SKShapeNode(circleOfRadius: abilityButtonRadius)
            button.fillColor = colors[i]
            button.strokeColor = SKColor(red: 0.8, green: 0.7, blue: 0.3, alpha: 0.6)
            button.lineWidth = 1.5
            button.position = CGPoint(x: x, y: y)
            button.zPosition = 1000
            button.name = "ability_\(i)"

            // Shine
            let shine = SKShapeNode(ellipseOf: CGSize(width: abilityButtonRadius * 1.1, height: abilityButtonRadius * 0.4))
            shine.fillColor = SKColor(white: 1, alpha: 0.1)
            shine.strokeColor = .clear
            shine.position = CGPoint(x: 0, y: abilityButtonRadius * 0.3)
            shine.zPosition = 1001
            button.addChild(shine)

            let label = SKLabelNode(fontNamed: "Copperplate-Bold")
            label.text = labels[i]
            label.fontSize = 14
            label.fontColor = .white
            label.verticalAlignmentMode = .center
            label.name = "ability_\(i)"
            button.addChild(label)

            // Cooldown overlay
            let cooldownOverlay = SKShapeNode(circleOfRadius: abilityButtonRadius)
            cooldownOverlay.fillColor = SKColor(white: 0, alpha: 0.7)
            cooldownOverlay.strokeColor = .clear
            cooldownOverlay.zPosition = 1002
            cooldownOverlay.isHidden = true
            cooldownOverlay.name = "cooldown_\(i)"
            button.addChild(cooldownOverlay)

            let cdLabel = SKLabelNode(fontNamed: "Helvetica-Bold")
            cdLabel.fontSize = 14
            cdLabel.fontColor = .white
            cdLabel.verticalAlignmentMode = .center
            cdLabel.zPosition = 1003
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
        let angle: CGFloat = .pi * 0.5
        let distance: CGFloat = 130

        // Shadow
        let shadow = SKShapeNode(circleOfRadius: ultimateButtonRadius)
        shadow.fillColor = SKColor(white: 0, alpha: 0.25)
        shadow.strokeColor = .clear
        shadow.position = CGPoint(x: cos(angle) * distance + 1.5, y: sin(angle) * distance - 1.5)
        shadow.zPosition = 999
        addChild(shadow)

        ultimateButton = SKShapeNode(circleOfRadius: ultimateButtonRadius)
        ultimateButton.fillColor = SKColor(red: 0.9, green: 0.7, blue: 0.1, alpha: 0.9)
        ultimateButton.strokeColor = SKColor(red: 1.0, green: 0.85, blue: 0.2, alpha: 1.0)
        ultimateButton.lineWidth = 3
        ultimateButton.position = CGPoint(x: cos(angle) * distance, y: sin(angle) * distance)
        ultimateButton.zPosition = 1000
        ultimateButton.name = "ultimate"

        let ultLabel = SKLabelNode(fontNamed: "Copperplate-Bold")
        ultLabel.text = "ULT"
        ultLabel.fontSize = 11
        ultLabel.fontColor = .black
        ultLabel.verticalAlignmentMode = .center
        ultLabel.name = "ultimate"
        ultimateButton.addChild(ultLabel)

        // Glow
        let glow = SKAction.repeatForever(SKAction.sequence([
            SKAction.run { [weak self] in self?.ultimateButton.glowWidth = 6 },
            SKAction.wait(forDuration: 1.0),
            SKAction.run { [weak self] in self?.ultimateButton.glowWidth = 2 },
            SKAction.wait(forDuration: 1.0)
        ]))
        ultimateButton.run(glow)

        addChild(ultimateButton)
    }

    // MARK: - Touch Handling

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let touch = touches.first else { return }
        let location = touch.location(in: self)

        // Check attack / interaction button
        if distance(from: location, to: attackButton.position) <= attackButtonRadius * 1.2 {
            pressAnimation(attackButton)
            switch currentMode {
            case .attack:
                onAttackPressed?()
            default:
                onInteractPressed?(currentMode)
            }
            return
        }

        // Check ability buttons
        for (i, button) in abilityButtons.enumerated() {
            if distance(from: location, to: button.position) <= abilityButtonRadius * 1.2 {
                if cooldownOverlays[i]?.isHidden == true {
                    pressAnimation(button)
                    onAbilityPressed?(i)
                } else {
                    // Feedback visuel : shake quand en cooldown
                    let shake = SKAction.sequence([
                        SKAction.moveBy(x: -3, y: 0, duration: 0.03),
                        SKAction.moveBy(x: 6, y: 0, duration: 0.03),
                        SKAction.moveBy(x: -6, y: 0, duration: 0.03),
                        SKAction.moveBy(x: 3, y: 0, duration: 0.03),
                    ])
                    button.run(shake)
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
        removeAction(forKey: "\(key)_stop")

        let countdown = SKAction.repeatForever(SKAction.sequence([
            SKAction.run { [weak label] in
                remaining -= 0.1
                label?.text = String(format: "%.1f", max(0, remaining))
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
        if let label = abilityButtons[index].children.first(where: { $0 is SKLabelNode && $0.name == "ability_\(index)" }) as? SKLabelNode {
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
