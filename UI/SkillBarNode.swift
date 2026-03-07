import SpriteKit

/// Barre de compétences avec cooldowns visuels (4 slots + ultimate)
class SkillBarNode: SKNode {

    // MARK: - Skill Slot

    struct SkillSlot {
        let background: SKShapeNode
        let icon: SKSpriteNode
        let cooldownOverlay: SKShapeNode
        let cooldownLabel: SKLabelNode
        let keyLabel: SKLabelNode
        var skillID: String?
        var cooldownRemaining: TimeInterval = 0
        var totalCooldown: TimeInterval = 0
    }

    // MARK: - Properties

    private var slots: [SkillSlot] = []
    private let slotSize: CGFloat = 44
    private let slotSpacing: CGFloat = 8

    // MARK: - Init

    init(screenSize: CGSize) {
        super.init()
        self.zPosition = 500
        self.name = "skillBar"

        let totalWidth = slotSize * 4 + slotSpacing * 3
        let startX = -totalWidth / 2

        for i in 0..<4 {
            let x = startX + CGFloat(i) * (slotSize + slotSpacing)
            let slot = createSlot(at: CGPoint(x: x, y: 0), index: i)
            slots.append(slot)
        }
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    // MARK: - Slot Creation

    private func createSlot(at position: CGPoint, index: Int) -> SkillSlot {
        // Background
        let bg = SKShapeNode(rectOf: CGSize(width: slotSize, height: slotSize), cornerRadius: 6)
        bg.fillColor = SKColor(white: 0.1, alpha: 0.8)
        bg.strokeColor = SKColor(red: 0.4, green: 0.35, blue: 0.2, alpha: 1.0)
        bg.lineWidth = 2
        bg.position = position
        bg.name = "skill_slot_\(index)"
        addChild(bg)

        // Icon
        let icon = SKSpriteNode(color: .clear, size: CGSize(width: slotSize - 8, height: slotSize - 8))
        icon.position = .zero
        icon.zPosition = 1
        bg.addChild(icon)

        // Cooldown overlay (grey sweep)
        let overlay = SKShapeNode(rectOf: CGSize(width: slotSize - 4, height: slotSize - 4), cornerRadius: 4)
        overlay.fillColor = SKColor(white: 0, alpha: 0.6)
        overlay.strokeColor = .clear
        overlay.position = .zero
        overlay.zPosition = 2
        overlay.isHidden = true
        bg.addChild(overlay)

        // Cooldown text
        let cdLabel = SKLabelNode(fontNamed: "Helvetica-Bold")
        cdLabel.fontSize = 14
        cdLabel.fontColor = .white
        cdLabel.verticalAlignmentMode = .center
        cdLabel.position = .zero
        cdLabel.zPosition = 3
        cdLabel.isHidden = true
        bg.addChild(cdLabel)

        // Key number
        let keyLabel = SKLabelNode(fontNamed: "Helvetica")
        keyLabel.text = "\(index + 1)"
        keyLabel.fontSize = 8
        keyLabel.fontColor = SKColor(white: 0.6, alpha: 1.0)
        keyLabel.horizontalAlignmentMode = .right
        keyLabel.verticalAlignmentMode = .bottom
        keyLabel.position = CGPoint(x: slotSize / 2 - 4, y: -slotSize / 2 + 2)
        keyLabel.zPosition = 3
        bg.addChild(keyLabel)

        return SkillSlot(
            background: bg, icon: icon,
            cooldownOverlay: overlay, cooldownLabel: cdLabel,
            keyLabel: keyLabel
        )
    }

    // MARK: - Configuration

    func setSkill(at index: Int, skillID: String, iconName: String) {
        guard index < slots.count else { return }
        slots[index].skillID = skillID
        slots[index].icon.texture = SKTexture(imageNamed: iconName)
    }

    func clearSlot(at index: Int) {
        guard index < slots.count else { return }
        slots[index].skillID = nil
        slots[index].icon.texture = nil
        slots[index].cooldownRemaining = 0
        slots[index].cooldownOverlay.isHidden = true
        slots[index].cooldownLabel.isHidden = true
    }

    // MARK: - Cooldowns

    func startCooldown(at index: Int, duration: TimeInterval) {
        guard index < slots.count else { return }
        slots[index].cooldownRemaining = duration
        slots[index].totalCooldown = duration
        slots[index].cooldownOverlay.isHidden = false
        slots[index].cooldownLabel.isHidden = false
    }

    func update(deltaTime: TimeInterval) {
        for i in 0..<slots.count {
            guard slots[i].cooldownRemaining > 0 else { continue }

            slots[i].cooldownRemaining -= deltaTime

            if slots[i].cooldownRemaining <= 0 {
                // Cooldown terminé
                slots[i].cooldownRemaining = 0
                slots[i].cooldownOverlay.isHidden = true
                slots[i].cooldownLabel.isHidden = true

                // Flash de disponibilité
                let flash = SKAction.sequence([
                    SKAction.run { self.slots[i].background.strokeColor = SKColor(red: 0.9, green: 0.8, blue: 0.3, alpha: 1.0) },
                    SKAction.wait(forDuration: 0.3),
                    SKAction.run { self.slots[i].background.strokeColor = SKColor(red: 0.4, green: 0.35, blue: 0.2, alpha: 1.0) }
                ])
                slots[i].background.run(flash)
            } else {
                // Afficher le temps restant
                let remaining = slots[i].cooldownRemaining
                slots[i].cooldownLabel.text = String(format: "%.1f", remaining)

                // Overlay opacity based on remaining fraction
                let fraction = remaining / slots[i].totalCooldown
                slots[i].cooldownOverlay.alpha = CGFloat(fraction * 0.6)
            }
        }
    }

    // MARK: - Touch handling

    func skillIndex(at point: CGPoint) -> Int? {
        guard let parent = parent else { return nil }
        let localPoint = convert(point, from: parent)
        for (i, slot) in slots.enumerated() {
            if slot.background.contains(localPoint) && slot.cooldownRemaining <= 0 {
                return i
            }
        }
        return nil
    }

    // MARK: - Visual feedback

    func animatePress(at index: Int) {
        guard index < slots.count else { return }
        let press = SKAction.sequence([
            SKAction.scale(to: 0.85, duration: 0.05),
            SKAction.scale(to: 1.0, duration: 0.1)
        ])
        slots[index].background.run(press)
    }
}
