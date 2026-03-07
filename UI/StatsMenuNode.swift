import SpriteKit

/// Menu de statistiques du champion avec arbre de talents interactif
/// S'ouvre en tapant sur la barre de PV ou d'Investiture
class StatsMenuNode: SKNode {

    // MARK: - Configuration

    private let screenSize: CGSize
    private var talentSystem: TalentTreeSystem { GameManager.shared.talentSystem }

    // MARK: - Nodes

    private let overlay: SKShapeNode
    private let panel: SKShapeNode
    private let closeButton: SKShapeNode
    private let statsSection: SKNode
    private let talentSection: SKNode
    private var talentNodes: [String: SKNode] = []  // talentID -> node

    // MARK: - State

    var onClose: (() -> Void)?
    private var selectedBranchIndex: Int = 0

    // MARK: - Init

    init(screenSize: CGSize) {
        self.screenSize = screenSize

        // Overlay sombre
        overlay = SKShapeNode(rectOf: screenSize)
        overlay.fillColor = SKColor(white: 0, alpha: 0.85)
        overlay.strokeColor = .clear
        overlay.zPosition = 6000

        // Panneau principal
        let panelSize = CGSize(width: screenSize.width - 20, height: screenSize.height - 60)
        panel = SKShapeNode(rectOf: panelSize, cornerRadius: 16)
        panel.fillColor = SKColor(red: 0.06, green: 0.05, blue: 0.10, alpha: 0.97)
        panel.strokeColor = SKColor(red: 0.5, green: 0.4, blue: 0.2, alpha: 1.0)
        panel.lineWidth = 2
        panel.zPosition = 6001

        // Bouton fermer
        closeButton = SKShapeNode(rectOf: CGSize(width: 44, height: 44), cornerRadius: 8)
        closeButton.fillColor = SKColor(red: 0.5, green: 0.1, blue: 0.1, alpha: 0.8)
        closeButton.strokeColor = .red
        closeButton.position = CGPoint(x: panelSize.width / 2 - 30, y: panelSize.height / 2 - 30)
        closeButton.zPosition = 6002
        closeButton.name = "closeStats"
        let xLabel = SKLabelNode(fontNamed: "Helvetica-Bold")
        xLabel.text = "X"
        xLabel.fontSize = 18
        xLabel.fontColor = .white
        xLabel.verticalAlignmentMode = .center
        xLabel.name = "closeStats"
        closeButton.addChild(xLabel)

        statsSection = SKNode()
        statsSection.zPosition = 6002

        talentSection = SKNode()
        talentSection.zPosition = 6002

        super.init()

        addChild(overlay)
        addChild(panel)
        panel.addChild(closeButton)
        panel.addChild(statsSection)
        panel.addChild(talentSection)

        isUserInteractionEnabled = true
        isHidden = true
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    // MARK: - Show / Hide

    func show() {
        isHidden = false
        alpha = 0
        refresh()
        run(SKAction.fadeIn(withDuration: 0.2))
    }

    func hide() {
        run(SKAction.sequence([
            SKAction.fadeOut(withDuration: 0.15),
            SKAction.run { [weak self] in self?.isHidden = true }
        ]))
    }

    // MARK: - Refresh

    func refresh() {
        statsSection.removeAllChildren()
        talentSection.removeAllChildren()
        talentNodes.removeAll()

        guard let champion = GameManager.shared.champion else { return }

        setupHeader(champion)
        setupStatsDisplay(champion)
        setupTalentTree(champion)
    }

    // MARK: - Header

    private func setupHeader(_ champion: Champion) {
        let panelH = screenSize.height - 60

        // Titre
        let title = SKLabelNode(fontNamed: "Copperplate-Bold")
        title.text = champion.name
        title.fontSize = 20
        title.fontColor = SKColor(red: 0.9, green: 0.8, blue: 0.4, alpha: 1.0)
        title.position = CGPoint(x: 0, y: panelH / 2 - 30)
        statsSection.addChild(title)

        // Classe + Niveau
        let subtitle = SKLabelNode(fontNamed: "Copperplate")
        subtitle.text = "\(champion.championClass.rawValue) — Niveau \(champion.level)"
        subtitle.fontSize = 13
        subtitle.fontColor = SKColor(white: 0.7, alpha: 1.0)
        subtitle.position = CGPoint(x: 0, y: panelH / 2 - 50)
        statsSection.addChild(subtitle)

        // Points de compétence disponibles
        if champion.skillPoints > 0 {
            let spLabel = SKLabelNode(fontNamed: "Copperplate-Bold")
            spLabel.text = "\(champion.skillPoints) point\(champion.skillPoints > 1 ? "s" : "") de talent disponible\(champion.skillPoints > 1 ? "s" : "")"
            spLabel.fontSize = 12
            spLabel.fontColor = SKColor(red: 0.3, green: 1.0, blue: 0.3, alpha: 1.0)
            spLabel.position = CGPoint(x: 0, y: panelH / 2 - 68)
            statsSection.addChild(spLabel)

            // Pulse pour attirer l'attention
            spLabel.run(SKAction.repeatForever(SKAction.sequence([
                SKAction.fadeAlpha(to: 0.5, duration: 0.8),
                SKAction.fadeAlpha(to: 1.0, duration: 0.8)
            ])))
        }
    }

    // MARK: - Stats Display

    private func setupStatsDisplay(_ champion: Champion) {
        let panelH = screenSize.height - 60
        let startY = panelH / 2 - 95

        // PV et Investiture barres
        setupResourceBar(
            label: "PV", current: champion.currentHP, max: champion.maxHP,
            fillColor: SKColor(red: 0.8, green: 0.15, blue: 0.1, alpha: 1.0),
            y: startY, in: statsSection
        )
        setupResourceBar(
            label: "INV", current: champion.currentInvestiture, max: champion.maxInvestiture,
            fillColor: SKColor(red: 0.1, green: 0.3, blue: 0.8, alpha: 1.0),
            y: startY - 22, in: statsSection
        )

        // XP
        let xpLabel = SKLabelNode(fontNamed: "Helvetica")
        xpLabel.text = "XP: \(champion.currentXP) / \(champion.xpForNextLevel)"
        xpLabel.fontSize = 10
        xpLabel.fontColor = SKColor(red: 1.0, green: 0.9, blue: 0.3, alpha: 1.0)
        xpLabel.position = CGPoint(x: 0, y: startY - 42)
        statsSection.addChild(xpLabel)

        // Stats détaillées
        let statsY = startY - 68
        let stats: [(String, String, Int)] = [
            ("VIG", "PV max", champion.baseStats.vigor),
            ("INV", "Investiture", champion.baseStats.investiture),
            ("FOR", "Dégâts phys.", champion.baseStats.strength),
            ("AGI", "Vit. + Esquive", champion.baseStats.agility),
            ("ESP", "Puiss. magique", champion.baseStats.spirit),
            ("CHA", "Drop + Crit", champion.baseStats.luck)
        ]

        for (i, (abbrev, desc, value)) in stats.enumerated() {
            let row = i / 3
            let col = i % 3
            let x = CGFloat(col - 1) * 100
            let y = statsY - CGFloat(row) * 40

            // Stat name
            let nameLabel = SKLabelNode(fontNamed: "Copperplate-Bold")
            nameLabel.text = abbrev
            nameLabel.fontSize = 13
            nameLabel.fontColor = SKColor(red: 0.8, green: 0.7, blue: 0.3, alpha: 1.0)
            nameLabel.position = CGPoint(x: x, y: y)
            statsSection.addChild(nameLabel)

            // Stat value
            let valLabel = SKLabelNode(fontNamed: "Helvetica-Bold")
            valLabel.text = "\(value)"
            valLabel.fontSize = 16
            valLabel.fontColor = .white
            valLabel.position = CGPoint(x: x, y: y - 16)
            statsSection.addChild(valLabel)

            // Stat description
            let descLabel = SKLabelNode(fontNamed: "Helvetica")
            descLabel.text = desc
            descLabel.fontSize = 8
            descLabel.fontColor = SKColor(white: 0.5, alpha: 1.0)
            descLabel.position = CGPoint(x: x, y: y - 28)
            statsSection.addChild(descLabel)
        }
    }

    private func setupResourceBar(label: String, current: Int, max: Int, fillColor: SKColor, y: CGFloat, in parent: SKNode) {
        let barWidth: CGFloat = 180
        let barHeight: CGFloat = 14

        // Label
        let lbl = SKLabelNode(fontNamed: "Copperplate-Bold")
        lbl.text = label
        lbl.fontSize = 10
        lbl.fontColor = fillColor
        lbl.horizontalAlignmentMode = .right
        lbl.verticalAlignmentMode = .center
        lbl.position = CGPoint(x: -barWidth / 2 - 8, y: y)
        parent.addChild(lbl)

        // Background
        let bg = SKShapeNode(rectOf: CGSize(width: barWidth, height: barHeight), cornerRadius: 4)
        bg.fillColor = SKColor(white: 0.1, alpha: 1.0)
        bg.strokeColor = fillColor.withAlphaComponent(0.5)
        bg.lineWidth = 1
        bg.position = CGPoint(x: 0, y: y)
        parent.addChild(bg)

        // Fill
        let ratio = max > 0 ? CGFloat(current) / CGFloat(max) : 0
        let fillWidth = barWidth * ratio
        if fillWidth > 2 {
            let fillPath = CGMutablePath()
            fillPath.addRoundedRect(in: CGRect(x: -barWidth / 2, y: -barHeight / 2, width: fillWidth, height: barHeight),
                                    cornerWidth: 4, cornerHeight: 4)
            let fill = SKShapeNode(path: fillPath)
            fill.fillColor = fillColor
            fill.strokeColor = .clear
            bg.addChild(fill)
        }

        // Value text
        let valText = SKLabelNode(fontNamed: "Helvetica-Bold")
        valText.text = "\(current)/\(max)"
        valText.fontSize = 9
        valText.fontColor = .white
        valText.verticalAlignmentMode = .center
        valText.position = CGPoint(x: barWidth / 2 + 30, y: y)
        parent.addChild(valText)
    }

    // MARK: - Talent Tree

    private func setupTalentTree(_ champion: Champion) {
        // Trouver l'arbre de talents de la classe du champion
        guard let tree = TalentTreeSystem.allTrees.first(where: {
            $0.championClass == champion.championClass.rawValue
        }) else { return }

        let panelH = screenSize.height - 60
        let treeStartY = panelH / 2 - 250

        // Titre section talents
        let talentTitle = SKLabelNode(fontNamed: "Copperplate-Bold")
        talentTitle.text = "Arbre de Talents"
        talentTitle.fontSize = 16
        talentTitle.fontColor = SKColor(red: 0.9, green: 0.8, blue: 0.4, alpha: 1.0)
        talentTitle.position = CGPoint(x: 0, y: treeStartY + 20)
        talentSection.addChild(talentTitle)

        // Onglets de branches
        for (i, branch) in tree.branches.enumerated() {
            let tabX = CGFloat(i - 1) * 110
            let tabY = treeStartY - 5

            let tabBg = SKShapeNode(rectOf: CGSize(width: 100, height: 28), cornerRadius: 6)
            tabBg.fillColor = i == selectedBranchIndex
                ? SKColor(red: 0.3, green: 0.25, blue: 0.1, alpha: 1.0)
                : SKColor(white: 0.12, alpha: 1.0)
            tabBg.strokeColor = i == selectedBranchIndex
                ? SKColor(red: 0.8, green: 0.7, blue: 0.3, alpha: 1.0)
                : SKColor(white: 0.3, alpha: 0.5)
            tabBg.lineWidth = 1.5
            tabBg.position = CGPoint(x: tabX, y: tabY)
            tabBg.zPosition = 6003
            tabBg.name = "branch_\(i)"

            let tabLabel = SKLabelNode(fontNamed: "Copperplate")
            tabLabel.text = String(branch.name.prefix(14))
            tabLabel.fontSize = 9
            tabLabel.fontColor = i == selectedBranchIndex ? .white : SKColor(white: 0.6, alpha: 1.0)
            tabLabel.verticalAlignmentMode = .center
            tabLabel.name = "branch_\(i)"
            tabBg.addChild(tabLabel)

            talentSection.addChild(tabBg)
        }

        // Afficher la branche sélectionnée
        guard selectedBranchIndex < tree.branches.count else { return }
        let branch = tree.branches[selectedBranchIndex]
        setupBranchDisplay(branch, champion: champion, startY: treeStartY - 35)
    }

    private func setupBranchDisplay(_ branch: TalentBranch, champion: Champion, startY: CGFloat) {
        // Description de la branche
        let descLabel = SKLabelNode(fontNamed: "Helvetica")
        descLabel.text = branch.description
        descLabel.fontSize = 10
        descLabel.fontColor = SKColor(white: 0.6, alpha: 1.0)
        descLabel.position = CGPoint(x: 0, y: startY)
        talentSection.addChild(descLabel)

        // Talents (4 tiers verticaux)
        for (i, talent) in branch.talents.enumerated() {
            let y = startY - 35 - CGFloat(i) * 58

            let currentRank = talentSystem.playerTalents.unlockedTalents[talent.id] ?? 0
            let canUnlock = talentSystem.canUnlockTalent(talent, availablePoints: champion.skillPoints)

            // Container
            let container = SKNode()
            container.position = CGPoint(x: 0, y: y)
            container.name = "talent_\(talent.id)"

            // Fond du talent
            let bg = SKShapeNode(rectOf: CGSize(width: screenSize.width - 60, height: 50), cornerRadius: 8)
            if currentRank >= talent.maxRank {
                bg.fillColor = SKColor(red: 0.15, green: 0.25, blue: 0.15, alpha: 1.0)
                bg.strokeColor = SKColor(red: 0.3, green: 0.7, blue: 0.3, alpha: 0.8)
            } else if canUnlock {
                bg.fillColor = SKColor(red: 0.2, green: 0.18, blue: 0.08, alpha: 1.0)
                bg.strokeColor = SKColor(red: 0.8, green: 0.7, blue: 0.3, alpha: 0.9)
            } else {
                bg.fillColor = SKColor(white: 0.08, alpha: 1.0)
                bg.strokeColor = SKColor(white: 0.25, alpha: 0.5)
            }
            bg.lineWidth = 1.5
            bg.name = "talent_\(talent.id)"
            container.addChild(bg)

            // Icône du tier
            let tierIcon = SKLabelNode(fontNamed: "Copperplate-Bold")
            tierIcon.text = talent.icon.isEmpty ? "★" : talent.icon
            tierIcon.fontSize = 18
            tierIcon.fontColor = currentRank > 0
                ? SKColor(red: 0.9, green: 0.8, blue: 0.3, alpha: 1.0)
                : SKColor(white: 0.3, alpha: 1.0)
            tierIcon.verticalAlignmentMode = .center
            tierIcon.position = CGPoint(x: -screenSize.width / 2 + 50, y: 4)
            container.addChild(tierIcon)

            // Nom du talent
            let nameLabel = SKLabelNode(fontNamed: "Copperplate-Bold")
            nameLabel.text = talent.name
            nameLabel.fontSize = 12
            nameLabel.fontColor = currentRank > 0 ? .white : SKColor(white: 0.7, alpha: 1.0)
            nameLabel.horizontalAlignmentMode = .left
            nameLabel.position = CGPoint(x: -screenSize.width / 2 + 75, y: 8)
            nameLabel.name = "talent_\(talent.id)"
            container.addChild(nameLabel)

            // Description
            let descLabel = SKLabelNode(fontNamed: "Helvetica")
            descLabel.text = talent.description
            descLabel.fontSize = 9
            descLabel.fontColor = SKColor(white: 0.5, alpha: 1.0)
            descLabel.horizontalAlignmentMode = .left
            descLabel.position = CGPoint(x: -screenSize.width / 2 + 75, y: -8)
            descLabel.name = "talent_\(talent.id)"
            container.addChild(descLabel)

            // Rang actuel / max
            let rankLabel = SKLabelNode(fontNamed: "Helvetica-Bold")
            rankLabel.text = "\(currentRank)/\(talent.maxRank)"
            rankLabel.fontSize = 12
            rankLabel.fontColor = currentRank >= talent.maxRank
                ? SKColor(red: 0.3, green: 0.9, blue: 0.3, alpha: 1.0)
                : .white
            rankLabel.verticalAlignmentMode = .center
            rankLabel.position = CGPoint(x: screenSize.width / 2 - 55, y: 0)
            container.addChild(rankLabel)

            // Bouton + si on peut unlock
            if canUnlock {
                let plusBtn = SKShapeNode(circleOfRadius: 14)
                plusBtn.fillColor = SKColor(red: 0.2, green: 0.6, blue: 0.2, alpha: 0.9)
                plusBtn.strokeColor = SKColor(red: 0.3, green: 0.8, blue: 0.3, alpha: 1.0)
                plusBtn.lineWidth = 1.5
                plusBtn.position = CGPoint(x: screenSize.width / 2 - 85, y: 0)
                plusBtn.zPosition = 6004
                plusBtn.name = "unlock_\(talent.id)"

                let plusLabel = SKLabelNode(fontNamed: "Helvetica-Bold")
                plusLabel.text = "+"
                plusLabel.fontSize = 16
                plusLabel.fontColor = .white
                plusLabel.verticalAlignmentMode = .center
                plusLabel.name = "unlock_\(talent.id)"
                plusBtn.addChild(plusLabel)

                container.addChild(plusBtn)

                // Pulse animation pour les boutons disponibles
                plusBtn.run(SKAction.repeatForever(SKAction.sequence([
                    SKAction.scale(to: 1.1, duration: 0.5),
                    SKAction.scale(to: 1.0, duration: 0.5)
                ])))
            }

            // Connexion verticale entre tiers
            if i > 0 {
                let lineNode = SKShapeNode()
                let linePath = CGMutablePath()
                linePath.move(to: CGPoint(x: -screenSize.width / 2 + 50, y: 28))
                linePath.addLine(to: CGPoint(x: -screenSize.width / 2 + 50, y: 33))
                lineNode.path = linePath
                lineNode.strokeColor = currentRank > 0
                    ? SKColor(red: 0.8, green: 0.7, blue: 0.3, alpha: 0.8)
                    : SKColor(white: 0.2, alpha: 0.5)
                lineNode.lineWidth = 2
                container.addChild(lineNode)
            }

            talentSection.addChild(container)
            talentNodes[talent.id] = container
        }
    }

    // MARK: - Touch Handling

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let touch = touches.first else { return }
        let location = touch.location(in: panel)
        let nodes = panel.nodes(at: location)

        for node in nodes {
            // Fermer
            if node.name == "closeStats" || node.parent?.name == "closeStats" {
                hide()
                onClose?()
                return
            }

            // Onglets de branche
            if let name = node.name ?? node.parent?.name, name.hasPrefix("branch_") {
                let indexStr = name.replacingOccurrences(of: "branch_", with: "")
                if let index = Int(indexStr), index != selectedBranchIndex {
                    selectedBranchIndex = index
                    refresh()
                }
                return
            }

            // Unlock talent
            if let name = node.name ?? node.parent?.name, name.hasPrefix("unlock_") {
                let talentID = name.replacingOccurrences(of: "unlock_", with: "")
                unlockTalent(id: talentID)
                return
            }
        }
    }

    private func unlockTalent(id talentID: String) {
        // Trouver le talent dans l'arbre
        guard let champion = GameManager.shared.champion,
              let tree = TalentTreeSystem.allTrees.first(where: {
                  $0.championClass == champion.championClass.rawValue
              }) else { return }

        for branch in tree.branches {
            for talent in branch.talents {
                if talent.id == talentID {
                    if talentSystem.unlockTalent(talent) {
                        // Animation de succès
                        if let node = talentNodes[talentID] {
                            let flash = SKAction.sequence([
                                SKAction.run {
                                    if let bg = node.children.first as? SKShapeNode {
                                        bg.fillColor = SKColor(red: 0.3, green: 0.5, blue: 0.2, alpha: 1.0)
                                    }
                                },
                                SKAction.wait(forDuration: 0.3),
                                SKAction.run { [weak self] in self?.refresh() }
                            ])
                            node.run(flash)
                        } else {
                            refresh()
                        }
                    }
                    return
                }
            }
        }
    }

    // MARK: - Public Access to Talent System

    var currentTalentSystem: TalentTreeSystem { talentSystem }
}
