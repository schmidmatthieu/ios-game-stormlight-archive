import SpriteKit

/// Rendu des ennemis et PNJ — sprites détaillés avec ombres et indicateurs
final class EntityRenderer {

    // MARK: - Enemy Rendering

    static func createEnemyNode(enemy: Enemy, spawn: EnemySpawn) -> SKNode {
        let container = SKNode()
        container.name = "enemy_\(spawn.enemyID)_\(spawn.position.col)_\(spawn.position.row)"

        let baseColor = enemyColor(for: enemy.tier)
        let scale = CGFloat(enemy.spriteScale)

        // Shadow
        let shadow = SKShapeNode(ellipseOf: CGSize(width: 18 * scale, height: 8 * scale))
        shadow.fillColor = SKColor(white: 0, alpha: 0.3)
        shadow.strokeColor = .clear
        shadow.position = CGPoint(x: 0, y: -2)
        shadow.zPosition = -1
        container.addChild(shadow)

        // Body
        let bodyW = 16 * scale
        let bodyH = 22 * scale
        let body = SKShapeNode(rectOf: CGSize(width: bodyW, height: bodyH), cornerRadius: 2)
        body.fillColor = baseColor
        body.strokeColor = baseColor.withAlphaComponent(0.6)
        body.lineWidth = 1
        body.position = CGPoint(x: 0, y: bodyH / 2)
        body.zPosition = 1
        body.name = "enemyBody"
        container.addChild(body)

        // Head
        let headR = 5 * scale
        let head = SKShapeNode(circleOfRadius: headR)
        head.fillColor = baseColor
        head.strokeColor = .clear
        head.position = CGPoint(x: 0, y: bodyH + headR)
        head.zPosition = 2
        container.addChild(head)

        // Red eyes
        let eyeSize = CGSize(width: 2.5 * scale, height: 1.5 * scale)
        let leftEye = SKShapeNode(ellipseOf: eyeSize)
        leftEye.fillColor = SKColor(red: 1, green: 0.2, blue: 0.1, alpha: 1)
        leftEye.strokeColor = .clear
        leftEye.position = CGPoint(x: -2.5 * scale, y: bodyH + headR)
        leftEye.zPosition = 3
        container.addChild(leftEye)

        let rightEye = SKShapeNode(ellipseOf: eyeSize)
        rightEye.fillColor = SKColor(red: 1, green: 0.2, blue: 0.1, alpha: 1)
        rightEye.strokeColor = .clear
        rightEye.position = CGPoint(x: 2.5 * scale, y: bodyH + headR)
        rightEye.zPosition = 3
        container.addChild(rightEye)

        // Boss crown
        if enemy.tier == .boss {
            let crown = SKShapeNode(rectOf: CGSize(width: 10 * scale, height: 5 * scale))
            crown.fillColor = SKColor(red: 0.9, green: 0.7, blue: 0.1, alpha: 1)
            crown.strokeColor = SKColor(red: 1, green: 0.85, blue: 0.2, alpha: 1)
            crown.lineWidth = 1
            crown.position = CGPoint(x: 0, y: bodyH + headR * 2 + 3)
            crown.zPosition = 4
            container.addChild(crown)

            // Crown spikes
            for xOff in [-3, 0, 3] as [CGFloat] {
                let spike = SKShapeNode(rectOf: CGSize(width: 2, height: 4))
                spike.fillColor = SKColor(red: 1, green: 0.85, blue: 0.2, alpha: 1)
                spike.strokeColor = .clear
                spike.position = CGPoint(x: xOff * scale, y: bodyH + headR * 2 + 7)
                spike.zPosition = 4
                container.addChild(spike)
            }
        }

        // Elite aura
        if enemy.tier == .elite {
            let aura = SKShapeNode(circleOfRadius: 14 * scale)
            aura.fillColor = .clear
            aura.strokeColor = SKColor(red: 0.7, green: 0.1, blue: 0.5, alpha: 0.3)
            aura.lineWidth = 2
            aura.position = CGPoint(x: 0, y: bodyH / 2)
            aura.zPosition = -0.5
            container.addChild(aura)
            let pulse = SKAction.repeatForever(SKAction.sequence([
                SKAction.scale(to: 1.2, duration: 0.8),
                SKAction.scale(to: 0.9, duration: 0.8)
            ]))
            aura.run(pulse)
        }

        // HP bar
        let hpBarBg = SKShapeNode(rectOf: CGSize(width: 26, height: 3))
        hpBarBg.fillColor = SKColor(red: 0.3, green: 0, blue: 0, alpha: 0.8)
        hpBarBg.strokeColor = .clear
        hpBarBg.position = CGPoint(x: 0, y: bodyH + headR * 2 + (enemy.tier == .boss ? 12 : 4))
        hpBarBg.zPosition = 10
        hpBarBg.name = "hpBarBg"
        container.addChild(hpBarBg)

        let hpFill = SKShapeNode(rectOf: CGSize(width: 24, height: 2))
        hpFill.fillColor = .green
        hpFill.strokeColor = .clear
        hpFill.name = "hpFill"
        hpBarBg.addChild(hpFill)

        // Name label
        let nameLabel = SKLabelNode(fontNamed: "Helvetica")
        nameLabel.text = enemy.name
        nameLabel.fontSize = 7
        nameLabel.fontColor = tierLabelColor(for: enemy.tier)
        nameLabel.position = CGPoint(x: 0, y: bodyH + headR * 2 + (enemy.tier == .boss ? 16 : 8))
        nameLabel.zPosition = 10
        container.addChild(nameLabel)

        // Level indicator
        let levelColor = levelIndicatorColor(enemyLevel: enemy.level)
        let levelLabel = SKLabelNode(fontNamed: "Helvetica")
        levelLabel.text = "Nv.\(enemy.level)"
        levelLabel.fontSize = 6
        levelLabel.fontColor = levelColor
        levelLabel.position = CGPoint(x: 0, y: bodyH + headR * 2 + (enemy.tier == .boss ? 12 : 4) + 14)
        levelLabel.zPosition = 10
        container.addChild(levelLabel)

        // Idle sway animation
        let sway = SKAction.repeatForever(SKAction.sequence([
            SKAction.moveBy(x: 1, y: 0, duration: 1.2),
            SKAction.moveBy(x: -1, y: 0, duration: 1.2)
        ]))
        body.run(sway)

        return container
    }

    /// Update HP bar fill based on current/max ratio
    static func updateEnemyHP(node: SKNode, ratio: CGFloat) {
        guard let hpBg = node.childNode(withName: "hpBarBg"),
              let hpFill = hpBg.childNode(withName: "hpFill") as? SKShapeNode else { return }

        let clampedRatio = max(0, min(1, ratio))
        hpFill.xScale = clampedRatio
        hpFill.fillColor = clampedRatio > 0.5 ? .green : (clampedRatio > 0.25 ? .yellow : .red)
    }

    /// Enemy hit flash
    static func playHitEffect(on enemyNode: SKNode) {
        guard let body = enemyNode.childNode(withName: "enemyBody") as? SKShapeNode else { return }
        let flash = SKAction.sequence([
            SKAction.run { body.fillColor = .white },
            SKAction.wait(forDuration: 0.08),
            SKAction.run { body.fillColor = body.strokeColor ?? .red }
        ])
        body.run(flash)
    }

    /// Enemy death animation
    static func playDeathAnimation(on enemyNode: SKNode, completion: @escaping () -> Void) {
        let death = SKAction.sequence([
            SKAction.group([
                SKAction.fadeOut(withDuration: 0.5),
                SKAction.scale(to: 0.3, duration: 0.5),
                SKAction.colorize(with: SKColor(red: 1, green: 0.8, blue: 0.2, alpha: 1), colorBlendFactor: 0.8, duration: 0.3)
            ]),
            SKAction.run(completion),
            SKAction.removeFromParent()
        ])
        enemyNode.run(death)
    }

    // MARK: - NPC Rendering

    static func createNPCNode(npc: NPCSpawn) -> SKNode {
        let container = SKNode()
        container.name = "npc_\(npc.npcID)"

        let isShop = npc.isShopkeeper

        // Shadow
        let shadow = SKShapeNode(ellipseOf: CGSize(width: 18, height: 8))
        shadow.fillColor = SKColor(white: 0, alpha: 0.3)
        shadow.strokeColor = .clear
        shadow.position = CGPoint(x: 0, y: -2)
        shadow.zPosition = -1
        container.addChild(shadow)

        // Body
        let bodyColor = isShop
            ? SKColor(red: 0.45, green: 0.3, blue: 0.15, alpha: 1)  // Brown for merchants
            : SKColor(red: 0.3, green: 0.35, blue: 0.45, alpha: 1)  // Blue-gray for regular

        let body = SKShapeNode(rectOf: CGSize(width: 14, height: 20), cornerRadius: 2)
        body.fillColor = bodyColor
        body.strokeColor = bodyColor.withAlphaComponent(0.5)
        body.lineWidth = 1
        body.position = CGPoint(x: 0, y: 10)
        body.zPosition = 1
        container.addChild(body)

        // Head
        let head = SKShapeNode(circleOfRadius: 6)
        head.fillColor = SKColor(red: 0.85, green: 0.72, blue: 0.58, alpha: 1)
        head.strokeColor = .clear
        head.position = CGPoint(x: 0, y: 26)
        head.zPosition = 2
        container.addChild(head)

        // Eyes (friendly)
        for xOff in [-2.5, 2.5] as [CGFloat] {
            let eye = SKShapeNode(circleOfRadius: 1.2)
            eye.fillColor = SKColor(red: 0.2, green: 0.2, blue: 0.3, alpha: 1)
            eye.strokeColor = .clear
            eye.position = CGPoint(x: xOff, y: 27)
            eye.zPosition = 3
            container.addChild(eye)
        }

        // Shopkeeper hat
        if isShop {
            let hat = SKShapeNode(rectOf: CGSize(width: 14, height: 5), cornerRadius: 2)
            hat.fillColor = SKColor(red: 0.5, green: 0.35, blue: 0.15, alpha: 1)
            hat.strokeColor = .clear
            hat.position = CGPoint(x: 0, y: 33)
            hat.zPosition = 4
            container.addChild(hat)

            // Gold coin icon
            let coin = SKShapeNode(circleOfRadius: 3)
            coin.fillColor = SKColor(red: 0.9, green: 0.75, blue: 0.2, alpha: 1)
            coin.strokeColor = SKColor(red: 0.7, green: 0.55, blue: 0.1, alpha: 1)
            coin.lineWidth = 0.5
            coin.position = CGPoint(x: 0, y: 36)
            coin.zPosition = 5
            container.addChild(coin)
        }

        // Quest indicator
        if npc.dialogueTreeID != nil {
            let questBubble = SKShapeNode(circleOfRadius: 6)
            questBubble.fillColor = SKColor(red: 1, green: 0.9, blue: 0.2, alpha: 0.9)
            questBubble.strokeColor = SKColor(red: 0.8, green: 0.7, blue: 0.1, alpha: 1)
            questBubble.lineWidth = 1
            questBubble.position = CGPoint(x: 0, y: isShop ? 42 : 36)
            questBubble.zPosition = 10
            questBubble.name = "questMark"
            container.addChild(questBubble)

            let mark = SKLabelNode(fontNamed: "Helvetica-Bold")
            mark.text = "!"
            mark.fontSize = 10
            mark.fontColor = .black
            mark.verticalAlignmentMode = .center
            mark.position = CGPoint(x: 0, y: isShop ? 42 : 36)
            mark.zPosition = 11
            container.addChild(mark)

            // Bounce animation
            let bounce = SKAction.repeatForever(SKAction.sequence([
                SKAction.moveBy(x: 0, y: 3, duration: 0.4),
                SKAction.moveBy(x: 0, y: -3, duration: 0.4)
            ]))
            questBubble.run(bounce)
            mark.run(bounce)
        }

        // NPC name
        let nameLabel = SKLabelNode(fontNamed: "Helvetica")
        nameLabel.text = npc.npcID.replacingOccurrences(of: "_", with: " ").capitalized
        nameLabel.fontSize = 7
        nameLabel.fontColor = isShop ? SKColor(red: 1, green: 0.9, blue: 0.5, alpha: 1) : SKColor(white: 0.8, alpha: 1)
        nameLabel.position = CGPoint(x: 0, y: isShop ? 48 : 40)
        nameLabel.zPosition = 10
        container.addChild(nameLabel)

        // Idle animation
        let idle = SKAction.repeatForever(SKAction.sequence([
            SKAction.scaleY(to: 1.02, duration: 1.5),
            SKAction.scaleY(to: 0.98, duration: 1.5)
        ]))
        body.run(idle)

        return container
    }

    // MARK: - Zone Exit Indicator

    static func createZoneExitIndicator(connection: ZoneConnection) -> SKNode {
        let container = SKNode()
        container.name = "exit_\(connection.targetZoneID)"

        // Glowing portal effect
        let portalOuter = SKShapeNode(ellipseOf: CGSize(width: 24, height: 14))
        portalOuter.fillColor = SKColor(red: 0.2, green: 0.6, blue: 0.3, alpha: 0.3)
        portalOuter.strokeColor = SKColor(red: 0.3, green: 0.8, blue: 0.4, alpha: 0.6)
        portalOuter.lineWidth = 2
        portalOuter.zPosition = 1
        container.addChild(portalOuter)

        let portalInner = SKShapeNode(ellipseOf: CGSize(width: 16, height: 10))
        portalInner.fillColor = SKColor(red: 0.3, green: 0.8, blue: 0.4, alpha: 0.4)
        portalInner.strokeColor = .clear
        portalInner.zPosition = 2
        container.addChild(portalInner)

        // Arrow
        let arrow = SKLabelNode(fontNamed: "Helvetica-Bold")
        arrow.text = "▶"
        arrow.fontSize = 10
        arrow.fontColor = SKColor(red: 0.4, green: 1, blue: 0.5, alpha: 0.8)
        arrow.verticalAlignmentMode = .center
        arrow.position = CGPoint(x: 0, y: 12)
        arrow.zPosition = 3
        container.addChild(arrow)

        // Pulse animation
        let pulse = SKAction.repeatForever(SKAction.sequence([
            SKAction.group([
                SKAction.scale(to: 1.15, duration: 0.8),
                SKAction.fadeAlpha(to: 0.6, duration: 0.8)
            ]),
            SKAction.group([
                SKAction.scale(to: 1.0, duration: 0.8),
                SKAction.fadeAlpha(to: 1.0, duration: 0.8)
            ])
        ]))
        container.run(pulse)

        return container
    }

    // MARK: - Helpers

    private static func enemyColor(for tier: EnemyTier) -> SKColor {
        switch tier {
        case .minion:  return SKColor(red: 0.5, green: 0.25, blue: 0.25, alpha: 1)
        case .soldier: return SKColor(red: 0.7, green: 0.2, blue: 0.2, alpha: 1)
        case .elite:   return SKColor(red: 0.6, green: 0.1, blue: 0.45, alpha: 1)
        case .boss:    return SKColor(red: 0.8, green: 0.1, blue: 0.1, alpha: 1)
        }
    }

    private static func levelIndicatorColor(enemyLevel: Int) -> SKColor {
        let playerLevel = GameManager.shared.champion?.level ?? 1
        let diff = enemyLevel - playerLevel
        if diff >= 3 {
            return SKColor(red: 1, green: 0.2, blue: 0.2, alpha: 1)      // Red = dangerous
        } else if diff >= 1 {
            return SKColor(red: 1, green: 0.6, blue: 0.2, alpha: 1)      // Orange = challenging
        } else if diff >= -2 {
            return SKColor(red: 1, green: 1, blue: 0.4, alpha: 1)        // Yellow = fair
        } else {
            return SKColor(red: 0.4, green: 0.9, blue: 0.4, alpha: 1)    // Green = easy
        }
    }

    private static func tierLabelColor(for tier: EnemyTier) -> SKColor {
        switch tier {
        case .minion:  return SKColor(white: 0.6, alpha: 1)
        case .soldier: return SKColor(white: 0.8, alpha: 1)
        case .elite:   return SKColor(red: 0.8, green: 0.5, blue: 0.9, alpha: 1)
        case .boss:    return SKColor(red: 1, green: 0.8, blue: 0.2, alpha: 1)
        }
    }
}
