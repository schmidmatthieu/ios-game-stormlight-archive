import SpriteKit

/// UI panneau de compétences — débloquer et équiper des skills
class SkillTreeNode: SKNode {

    // MARK: - Configuration

    private let screenSize: CGSize
    private let overlay: SKShapeNode
    private let panel: SKShapeNode
    private let titleLabel: SKLabelNode
    private let closeButton: SKShapeNode
    private let pointsLabel: SKLabelNode

    private var skillNodes: [String: SKShapeNode] = [:]
    private var equippedSlots: [SKShapeNode] = []

    private var selectedSkillID: String?
    var onClose: (() -> Void)?

    // MARK: - Init

    init(screenSize: CGSize) {
        self.screenSize = screenSize

        overlay = SKShapeNode(rectOf: screenSize)
        overlay.fillColor = SKColor(white: 0, alpha: 0.8)
        overlay.strokeColor = .clear
        overlay.zPosition = 6000

        let panelSize = CGSize(width: screenSize.width - 30, height: screenSize.height - 80)
        panel = SKShapeNode(rectOf: panelSize, cornerRadius: 16)
        panel.fillColor = SKColor(red: 0.06, green: 0.06, blue: 0.14, alpha: 0.95)
        panel.strokeColor = SKColor(red: 0.3, green: 0.5, blue: 0.8, alpha: 1.0)
        panel.lineWidth = 2
        panel.zPosition = 6001

        titleLabel = SKLabelNode(fontNamed: "Copperplate-Bold")
        titleLabel.text = "Compétences"
        titleLabel.fontSize = 20
        titleLabel.fontColor = SKColor(red: 0.5, green: 0.7, blue: 1.0, alpha: 1.0)
        titleLabel.position = CGPoint(x: 0, y: panelSize.height / 2 - 30)
        titleLabel.zPosition = 6002

        closeButton = SKShapeNode(rectOf: CGSize(width: 30, height: 30), cornerRadius: 6)
        closeButton.fillColor = SKColor(red: 0.5, green: 0.1, blue: 0.1, alpha: 0.8)
        closeButton.strokeColor = .red
        closeButton.position = CGPoint(x: panelSize.width / 2 - 25, y: panelSize.height / 2 - 25)
        closeButton.zPosition = 6002
        closeButton.name = "closeSkillTree"
        let xLabel = SKLabelNode(fontNamed: "Helvetica-Bold")
        xLabel.text = "X"
        xLabel.fontSize = 14
        xLabel.fontColor = .white
        xLabel.verticalAlignmentMode = .center
        xLabel.name = "closeSkillTree"
        closeButton.addChild(xLabel)

        pointsLabel = SKLabelNode(fontNamed: "Copperplate-Bold")
        pointsLabel.fontSize = 14
        pointsLabel.fontColor = SKColor(red: 0.9, green: 0.8, blue: 0.3, alpha: 1)
        pointsLabel.position = CGPoint(x: 0, y: panelSize.height / 2 - 55)
        pointsLabel.zPosition = 6002

        super.init()

        addChild(overlay)
        addChild(panel)
        panel.addChild(titleLabel)
        panel.addChild(closeButton)
        panel.addChild(pointsLabel)

        setupEquippedSlots()

        isUserInteractionEnabled = true
        isHidden = true
    }

    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    // MARK: - Setup

    private func setupEquippedSlots() {
        let startX: CGFloat = -90
        let y: CGFloat = -screenSize.height / 3 + 20

        for i in 0..<4 {
            let slot = SKShapeNode(rectOf: CGSize(width: 44, height: 44), cornerRadius: 6)
            slot.fillColor = SKColor(white: 0.1, alpha: 0.9)
            slot.strokeColor = SKColor(red: 0.4, green: 0.6, blue: 0.9, alpha: 0.8)
            slot.lineWidth = 2
            slot.position = CGPoint(x: startX + CGFloat(i) * 60, y: y)
            slot.zPosition = 6002
            slot.name = "equippedSlot_\(i)"

            let numLabel = SKLabelNode(fontNamed: "Helvetica")
            numLabel.text = "\(i + 1)"
            numLabel.fontSize = 8
            numLabel.fontColor = SKColor(white: 0.4, alpha: 1)
            numLabel.position = CGPoint(x: 16, y: -18)
            numLabel.name = "equippedSlot_\(i)"
            slot.addChild(numLabel)

            panel.addChild(slot)
            equippedSlots.append(slot)
        }

        let label = SKLabelNode(fontNamed: "Helvetica")
        label.text = "Slots actifs"
        label.fontSize = 10
        label.fontColor = SKColor(white: 0.5, alpha: 1)
        label.position = CGPoint(x: 0, y: y - 30)
        label.zPosition = 6002
        panel.addChild(label)
    }

    // MARK: - Refresh

    func refresh() {
        guard let champion = GameManager.shared.champion else { return }

        pointsLabel.text = "Points de compétence: \(champion.skillPoints)"

        // Clear old skill nodes
        skillNodes.values.forEach { $0.removeFromParent() }
        skillNodes.removeAll()

        // Get skills for this class
        let magicSystem = champion.championClass.magicSystem
        let classSkills = GameManager.shared.allSkills.values
            .filter { $0.magicSystem == magicSystem }
            .sorted { $0.requiredLevel < $1.requiredLevel }

        let startY: CGFloat = screenSize.height / 4 - 30
        let colWidth: CGFloat = 85

        for (i, skill) in classSkills.enumerated() {
            let col = i % 4
            let row = i / 4
            let x = CGFloat(col - 2) * colWidth + colWidth / 2
            let y = startY - CGFloat(row) * 70

            let isUnlocked = champion.unlockedSkillIDs.contains(skill.id)
            let canUnlock = !isUnlocked && champion.skillPoints > 0 && champion.level >= skill.requiredLevel
            let meetsPrereq = skill.prerequisiteSkillID == nil ||
                champion.unlockedSkillIDs.contains(skill.prerequisiteSkillID ?? "")

            let node = SKShapeNode(rectOf: CGSize(width: 75, height: 55), cornerRadius: 6)
            node.position = CGPoint(x: x, y: y)
            node.zPosition = 6002
            node.name = "skill_\(skill.id)"

            if isUnlocked {
                node.fillColor = SKColor(red: 0.1, green: 0.2, blue: 0.35, alpha: 0.9)
                node.strokeColor = SKColor(red: 0.4, green: 0.7, blue: 1.0, alpha: 1)
            } else if canUnlock && meetsPrereq {
                node.fillColor = SKColor(red: 0.15, green: 0.15, blue: 0.1, alpha: 0.9)
                node.strokeColor = SKColor(red: 0.7, green: 0.6, blue: 0.2, alpha: 1)
            } else {
                node.fillColor = SKColor(white: 0.08, alpha: 0.9)
                node.strokeColor = SKColor(white: 0.25, alpha: 0.5)
            }
            node.lineWidth = 1.5

            let nameLabel = SKLabelNode(fontNamed: "Helvetica-Bold")
            nameLabel.text = String(skill.name.prefix(10))
            nameLabel.fontSize = 9
            nameLabel.fontColor = isUnlocked ? .white : SKColor(white: 0.5, alpha: 1)
            nameLabel.verticalAlignmentMode = .center
            nameLabel.position = CGPoint(x: 0, y: 8)
            nameLabel.name = "skill_\(skill.id)"
            node.addChild(nameLabel)

            let lvlLabel = SKLabelNode(fontNamed: "Helvetica")
            lvlLabel.text = "Niv. \(skill.requiredLevel)"
            lvlLabel.fontSize = 8
            lvlLabel.fontColor = SKColor(white: 0.4, alpha: 1)
            lvlLabel.verticalAlignmentMode = .center
            lvlLabel.position = CGPoint(x: 0, y: -8)
            lvlLabel.name = "skill_\(skill.id)"
            node.addChild(lvlLabel)

            if isUnlocked {
                let check = SKLabelNode(fontNamed: "Helvetica-Bold")
                check.text = "OK"
                check.fontSize = 8
                check.fontColor = SKColor(red: 0.3, green: 0.9, blue: 0.3, alpha: 1)
                check.position = CGPoint(x: 28, y: 18)
                check.name = "skill_\(skill.id)"
                node.addChild(check)
            }

            panel.addChild(node)
            skillNodes[skill.id] = node
        }

        // Refresh equipped slots
        refreshEquippedSlots(champion: champion)
    }

    private func refreshEquippedSlots(champion: Champion) {
        for (i, slot) in equippedSlots.enumerated() {
            slot.children.filter { $0.name?.hasPrefix("eqSkill_") ?? false }.forEach { $0.removeFromParent() }

            if i < champion.equippedSkillIDs.count, !champion.equippedSkillIDs[i].isEmpty {
                let skillID = champion.equippedSkillIDs[i]
                if let skill = GameManager.shared.allSkills[skillID] {
                    let label = SKLabelNode(fontNamed: "Helvetica-Bold")
                    label.text = String(skill.name.prefix(6))
                    label.fontSize = 9
                    label.fontColor = SKColor(red: 0.5, green: 0.8, blue: 1.0, alpha: 1)
                    label.verticalAlignmentMode = .center
                    label.name = "eqSkill_\(i)"
                    slot.addChild(label)
                    slot.fillColor = SKColor(red: 0.1, green: 0.15, blue: 0.3, alpha: 0.9)
                }
            } else {
                slot.fillColor = SKColor(white: 0.1, alpha: 0.9)
            }
        }
    }

    // MARK: - Show/Hide

    func show() {
        isHidden = false
        refresh()
        alpha = 0
        run(SKAction.fadeIn(withDuration: 0.2))
    }

    func hide() {
        run(SKAction.sequence([
            SKAction.fadeOut(withDuration: 0.15),
            SKAction.run { [weak self] in self?.isHidden = true }
        ]))
    }

    // MARK: - Touch

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let touch = touches.first else { return }
        let location = touch.location(in: panel)
        let nodes = panel.nodes(at: location)

        for node in nodes {
            if node.name == "closeSkillTree" || node.parent?.name == "closeSkillTree" {
                hide()
                onClose?()
                return
            }

            if let name = node.name, name.hasPrefix("skill_") {
                let skillID = name.replacingOccurrences(of: "skill_", with: "")
                handleSkillTap(skillID)
                return
            }

            if let name = node.name, name.hasPrefix("equippedSlot_") {
                let indexStr = name.replacingOccurrences(of: "equippedSlot_", with: "")
                if let slotIndex = Int(indexStr) {
                    handleEquippedSlotTap(slotIndex)
                }
                return
            }
        }
    }

    // MARK: - Skill Interaction

    private func handleSkillTap(_ skillID: String) {
        guard let champion = GameManager.shared.champion,
              let skill = GameManager.shared.allSkills[skillID] else { return }

        if champion.unlockedSkillIDs.contains(skillID) {
            // Already unlocked — try to equip to first empty slot
            equipSkillToFirstEmptySlot(skillID, champion: champion)
        } else {
            // Try to unlock
            unlockSkill(skillID, skill: skill, champion: champion)
        }
    }

    private func unlockSkill(_ skillID: String, skill: Skill, champion: Champion) {
        guard champion.skillPoints > 0,
              champion.level >= skill.requiredLevel else { return }

        // Check prerequisite
        if let prereq = skill.prerequisiteSkillID,
           !champion.unlockedSkillIDs.contains(prereq) { return }

        GameManager.shared.mutateChampion { champ in
            champ.skillPoints -= 1
            champ.unlockedSkillIDs.append(skillID)
        }

        refresh()
    }

    private func equipSkillToFirstEmptySlot(_ skillID: String, champion: Champion) {
        GameManager.shared.mutateChampion { champ in
            // Ensure we have 4 slots
            while champ.equippedSkillIDs.count < 4 {
                champ.equippedSkillIDs.append("")
            }

            // If already equipped, remove it
            if let existingIdx = champ.equippedSkillIDs.firstIndex(of: skillID) {
                champ.equippedSkillIDs[existingIdx] = ""
                return
            }

            // Put in first empty slot
            if let emptyIdx = champ.equippedSkillIDs.firstIndex(of: "") {
                champ.equippedSkillIDs[emptyIdx] = skillID
            } else {
                // All slots full — replace slot 0
                champ.equippedSkillIDs[0] = skillID
            }
        }

        refresh()
    }

    private func handleEquippedSlotTap(_ slotIndex: Int) {
        guard let champion = GameManager.shared.champion,
              slotIndex < champion.equippedSkillIDs.count,
              !champion.equippedSkillIDs[slotIndex].isEmpty else { return }

        // Unequip
        GameManager.shared.mutateChampion { champ in
            champ.equippedSkillIDs[slotIndex] = ""
        }

        refresh()
    }
}
