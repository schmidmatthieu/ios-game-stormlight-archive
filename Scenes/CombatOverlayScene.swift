import SpriteKit

/// Overlay de combat — barre de PV ennemie, indicateurs de combo, pause tactique
/// Affiché par-dessus la ZoneScene pendant un engagement
class CombatOverlayNode: SKNode {

    // MARK: - Properties

    private let screenSize: CGSize

    // Target enemy info
    private var targetHealthBar: SKShapeNode?
    private var targetHealthFill: SKShapeNode?
    private var targetNameLabel: SKLabelNode?
    private var targetLevelLabel: SKLabelNode?

    // Combo
    private let comboLabel = SKLabelNode(fontNamed: "Copperplate-Bold")
    private var comboCount: Int = 0
    private var comboTimer: TimeInterval = 0
    private let comboTimeout: TimeInterval = 3.0

    // Pause tactique
    private var isPaused: Bool = false
    private let pauseOverlay = SKShapeNode()
    private let pauseLabel = SKLabelNode(fontNamed: "Copperplate-Bold")

    // Status effects display
    private var statusIcons: [SKNode] = []

    // MARK: - Init

    init(screenSize: CGSize) {
        self.screenSize = screenSize
        super.init()
        self.zPosition = 400
        self.name = "combatOverlay"

        setupComboDisplay()
        setupPauseOverlay()
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    // MARK: - Target Enemy

    func showTargetInfo(name: String, level: Int, currentHP: Int, maxHP: Int, tier: EnemyTier) {
        clearTarget()

        let barWidth: CGFloat = 180
        let barHeight: CGFloat = 12
        let topY = screenSize.height / 2 - 60
        let centerX: CGFloat = 0

        // Name
        let nameLabel = SKLabelNode(fontNamed: "Copperplate-Bold")
        nameLabel.text = name
        nameLabel.fontSize = 12
        nameLabel.fontColor = tierColor(tier)
        nameLabel.position = CGPoint(x: centerX, y: topY + 16)
        nameLabel.zPosition = 401
        addChild(nameLabel)
        self.targetNameLabel = nameLabel

        // Level
        let lvlLabel = SKLabelNode(fontNamed: "Helvetica")
        lvlLabel.text = "Nv.\(level)"
        lvlLabel.fontSize = 9
        lvlLabel.fontColor = .lightGray
        lvlLabel.horizontalAlignmentMode = .left
        lvlLabel.position = CGPoint(x: centerX - barWidth / 2, y: topY + 16)
        lvlLabel.zPosition = 401
        addChild(lvlLabel)
        self.targetLevelLabel = lvlLabel

        // Health bar background
        let bg = SKShapeNode(rectOf: CGSize(width: barWidth, height: barHeight), cornerRadius: 3)
        bg.fillColor = SKColor(white: 0.15, alpha: 0.8)
        bg.strokeColor = tierColor(tier)
        bg.lineWidth = 1.5
        bg.position = CGPoint(x: centerX, y: topY)
        bg.zPosition = 401
        addChild(bg)
        self.targetHealthBar = bg

        // Health fill
        let hpPercent = CGFloat(currentHP) / CGFloat(maxHP)
        let fill = SKShapeNode(rectOf: CGSize(width: barWidth * hpPercent - 4, height: barHeight - 4), cornerRadius: 2)
        fill.fillColor = healthColor(for: Double(hpPercent))
        fill.strokeColor = .clear
        fill.position = CGPoint(x: centerX - (barWidth * (1 - hpPercent)) / 2, y: topY)
        fill.zPosition = 402
        addChild(fill)
        self.targetHealthFill = fill

        // HP text
        let hpLabel = SKLabelNode(fontNamed: "Helvetica")
        hpLabel.text = "\(currentHP)/\(maxHP)"
        hpLabel.fontSize = 8
        hpLabel.fontColor = .white
        hpLabel.position = CGPoint(x: centerX, y: topY - 3)
        hpLabel.zPosition = 403
        addChild(hpLabel)
    }

    func updateTargetHP(currentHP: Int, maxHP: Int) {
        guard let fill = targetHealthFill, let bar = targetHealthBar else { return }
        let barWidth: CGFloat = 180
        let hpPercent = CGFloat(max(0, currentHP)) / CGFloat(maxHP)
        let fillWidth = max(0, barWidth * hpPercent - 4)

        fill.path = CGPath(roundedRect: CGRect(x: -fillWidth / 2, y: -4, width: fillWidth, height: 8),
                           cornerWidth: 2, cornerHeight: 2, transform: nil)
        fill.fillColor = healthColor(for: Double(hpPercent))
        fill.position = CGPoint(x: bar.position.x - (barWidth * (1 - hpPercent)) / 2, y: bar.position.y)
    }

    func clearTarget() {
        targetHealthBar?.removeFromParent()
        targetHealthFill?.removeFromParent()
        targetNameLabel?.removeFromParent()
        targetLevelLabel?.removeFromParent()
        targetHealthBar = nil
        targetHealthFill = nil
        targetNameLabel = nil
        targetLevelLabel = nil
    }

    // MARK: - Combo System

    private func setupComboDisplay() {
        comboLabel.fontSize = 22
        comboLabel.fontColor = SKColor(red: 0.9, green: 0.7, blue: 0.2, alpha: 1.0)
        comboLabel.position = CGPoint(x: 0, y: screenSize.height / 2 - 100)
        comboLabel.zPosition = 410
        comboLabel.isHidden = true
        addChild(comboLabel)
    }

    func incrementCombo() {
        comboCount += 1
        comboTimer = comboTimeout

        comboLabel.text = "COMBO x\(comboCount)"
        comboLabel.isHidden = false

        // Pulse animation
        comboLabel.removeAllActions()
        let pulse = SKAction.sequence([
            SKAction.scale(to: 1.3, duration: 0.1),
            SKAction.scale(to: 1.0, duration: 0.15)
        ])
        comboLabel.run(pulse)
    }

    func resetCombo() {
        comboCount = 0
        comboTimer = 0
        comboLabel.removeAction(forKey: "comboWarning")
        comboLabel.alpha = 1.0
        comboLabel.fontColor = SKColor(red: 0.9, green: 0.7, blue: 0.2, alpha: 1.0)
        comboLabel.isHidden = true
    }

    var currentCombo: Int { comboCount }

    /// Multiplicateur de dégâts basé sur le combo
    var comboMultiplier: Double {
        switch comboCount {
        case 0...2:  return 1.0
        case 3...5:  return 1.15
        case 6...9:  return 1.3
        case 10...:  return 1.5
        default:     return 1.0
        }
    }

    // MARK: - Pause Tactique

    private func setupPauseOverlay() {
        pauseOverlay.path = CGPath(rect: CGRect(x: -screenSize.width / 2, y: -screenSize.height / 2,
                                                 width: screenSize.width, height: screenSize.height), transform: nil)
        pauseOverlay.fillColor = SKColor(white: 0, alpha: 0.4)
        pauseOverlay.strokeColor = .clear
        pauseOverlay.zPosition = 450
        pauseOverlay.isHidden = true
        addChild(pauseOverlay)

        pauseLabel.text = "PAUSE TACTIQUE"
        pauseLabel.fontSize = 24
        pauseLabel.fontColor = SKColor(red: 0.7, green: 0.8, blue: 1.0, alpha: 1.0)
        pauseLabel.position = CGPoint(x: 0, y: 20)
        pauseLabel.zPosition = 451
        pauseOverlay.addChild(pauseLabel)

        let hint = SKLabelNode(fontNamed: "Helvetica")
        hint.text = "Relâchez pour reprendre"
        hint.fontSize = 12
        hint.fontColor = .lightGray
        hint.position = CGPoint(x: 0, y: -10)
        hint.zPosition = 451
        pauseOverlay.addChild(hint)
    }

    func toggleTacticalPause() {
        isPaused.toggle()
        pauseOverlay.isHidden = !isPaused
    }

    var isTacticallyPaused: Bool { isPaused }

    // MARK: - Status Effects

    func showStatusEffect(_ effect: StatusEffectType, duration: TimeInterval) {
        let icon = SKSpriteNode(imageNamed: "status_\(effect.rawValue)")
        icon.size = CGSize(width: 20, height: 20)

        let xOffset = CGFloat(statusIcons.count) * 24 - screenSize.width / 2 + 60
        icon.position = CGPoint(x: xOffset, y: screenSize.height / 2 - 90)
        icon.zPosition = 410
        addChild(icon)
        statusIcons.append(icon)

        // Auto-remove after duration
        icon.run(SKAction.sequence([
            SKAction.wait(forDuration: duration),
            SKAction.fadeOut(withDuration: 0.3),
            SKAction.removeFromParent(),
            SKAction.run { [weak self] in
                self?.statusIcons.removeAll { $0 === icon }
            }
        ]))
    }

    // MARK: - Update

    func update(deltaTime: TimeInterval) {
        // Combo timeout
        if comboTimer > 0 {
            comboTimer -= deltaTime

            // Feedback visuel quand le combo est sur le point d'expirer
            let warningThreshold: TimeInterval = 1.0
            if comboTimer <= warningThreshold && comboTimer > 0 && comboCount > 0 {
                let urgency = 1.0 - (comboTimer / warningThreshold)
                comboLabel.fontColor = SKColor(
                    red: 0.9 + CGFloat(urgency) * 0.1,
                    green: max(0.2, 0.7 - CGFloat(urgency) * 0.5),
                    blue: 0.2,
                    alpha: 1.0
                )
                // Clignotement de plus en plus rapide
                if comboLabel.action(forKey: "comboWarning") == nil {
                    let blink = SKAction.repeatForever(SKAction.sequence([
                        SKAction.fadeAlpha(to: 0.4, duration: 0.15),
                        SKAction.fadeAlpha(to: 1.0, duration: 0.15)
                    ]))
                    comboLabel.run(blink, withKey: "comboWarning")
                }
            }

            if comboTimer <= 0 {
                resetCombo()
            }
        }
    }

    // MARK: - Helpers

    private func tierColor(_ tier: EnemyTier) -> SKColor {
        switch tier {
        case .minion:  return SKColor(white: 0.7, alpha: 1.0)
        case .soldier: return SKColor(red: 0.3, green: 0.8, blue: 0.3, alpha: 1.0)
        case .elite:   return SKColor(red: 0.6, green: 0.3, blue: 0.9, alpha: 1.0)
        case .boss:    return SKColor(red: 0.9, green: 0.6, blue: 0.1, alpha: 1.0)
        }
    }

    private func healthColor(for percent: Double) -> SKColor {
        if percent > 0.6 {
            return SKColor(red: 0.2, green: 0.8, blue: 0.2, alpha: 1.0)
        } else if percent > 0.3 {
            return SKColor(red: 0.9, green: 0.7, blue: 0.1, alpha: 1.0)
        } else {
            return SKColor(red: 0.9, green: 0.2, blue: 0.2, alpha: 1.0)
        }
    }
}
