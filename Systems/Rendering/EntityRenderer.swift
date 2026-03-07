import SpriteKit

/// Rendu des ennemis et PNJ — sprites détaillés avec designs uniques par rôle/tier
final class EntityRenderer {

    // Cached HP bar colors to avoid per-frame allocation
    private static let hpColorHealthy: SKColor = .green
    private static let hpColorWarning: SKColor = .yellow
    private static let hpColorCritical: SKColor = .red

    // MARK: - Enemy Rendering (Enhanced)

    static func createEnemyNode(enemy: Enemy, spawn: EnemySpawn) -> SKNode {
        let container = SKNode()
        container.name = "enemy_\(spawn.enemyID)_\(spawn.position.col)_\(spawn.position.row)"

        let baseColor = enemyColor(for: enemy.tier)
        let accentColor = enemyAccentColor(for: enemy.tier)
        let scale = CGFloat(enemy.spriteScale)

        // Shadow (plus détaillée)
        let shadow = SKShapeNode(ellipseOf: CGSize(width: 22 * scale, height: 10 * scale))
        shadow.fillColor = SKColor(white: 0, alpha: 0.35)
        shadow.strokeColor = .clear
        shadow.position = CGPoint(x: 0, y: -3)
        shadow.zPosition = -1
        container.addChild(shadow)

        // Aura de tier (elite/boss)
        addTierAura(to: container, tier: enemy.tier, scale: scale)

        // Legs (nouvelles)
        let legColor = baseColor.withAlphaComponent(0.8)
        for xOff in [-4 * scale, 4 * scale] {
            let leg = SKShapeNode(rectOf: CGSize(width: 4 * scale, height: 8 * scale), cornerRadius: 1)
            leg.fillColor = legColor
            leg.strokeColor = .clear
            leg.position = CGPoint(x: xOff, y: 4 * scale)
            leg.zPosition = 0.5
            container.addChild(leg)
        }

        // Body (plus détaillé avec armure)
        let bodyW = 16 * scale
        let bodyH = 22 * scale
        let body = SKShapeNode(rectOf: CGSize(width: bodyW, height: bodyH), cornerRadius: 3)
        body.fillColor = baseColor
        body.strokeColor = accentColor.withAlphaComponent(0.4)
        body.lineWidth = enemy.tier == .boss ? 2 : (enemy.tier == .elite ? 1.5 : 1)
        body.position = CGPoint(x: 0, y: bodyH / 2 + 4 * scale)
        body.zPosition = 1
        body.name = "enemyBody"
        container.addChild(body)

        // Armor details based on tier
        addEnemyArmorDetails(to: body, tier: enemy.tier, scale: scale, bodyW: bodyW, bodyH: bodyH)

        // Arms
        for xOff in [-(bodyW / 2 + 2 * scale), bodyW / 2 + 2 * scale] {
            let arm = SKShapeNode(rectOf: CGSize(width: 3 * scale, height: 10 * scale), cornerRadius: 1)
            arm.fillColor = baseColor.withAlphaComponent(0.9)
            arm.strokeColor = .clear
            arm.position = CGPoint(x: xOff, y: bodyH / 2)
            arm.zPosition = 1.5
            container.addChild(arm)
        }

        // Head (plus détaillée)
        let headR = 6 * scale
        let headY = bodyH + headR + 4 * scale

        // Neck
        let neck = SKShapeNode(rectOf: CGSize(width: 4 * scale, height: 4 * scale))
        neck.fillColor = enemySkinColor(for: enemy.tier)
        neck.strokeColor = .clear
        neck.position = CGPoint(x: 0, y: bodyH + 2 * scale)
        neck.zPosition = 1.8
        container.addChild(neck)

        let head = SKShapeNode(circleOfRadius: headR)
        head.fillColor = enemySkinColor(for: enemy.tier)
        head.strokeColor = enemy.tier == .boss ? accentColor.withAlphaComponent(0.3) : .clear
        head.lineWidth = enemy.tier == .boss ? 1 : 0
        head.position = CGPoint(x: 0, y: headY)
        head.zPosition = 2
        container.addChild(head)

        // Eyes (style selon le behavior)
        let eyeSize = CGSize(width: 3 * scale, height: 2 * scale)
        let eyeColor = enemyEyeColor(for: enemy.tier, behavior: enemy.behavior)
        for xOff in [-3 * scale, 3 * scale] {
            let eyeWhite = SKShapeNode(ellipseOf: CGSize(width: eyeSize.width + 1, height: eyeSize.height + 0.5))
            eyeWhite.fillColor = SKColor(white: 0.9, alpha: 0.8)
            eyeWhite.strokeColor = .clear
            eyeWhite.position = CGPoint(x: xOff, y: headY + 1 * scale)
            eyeWhite.zPosition = 2.5
            container.addChild(eyeWhite)

            let eye = SKShapeNode(ellipseOf: eyeSize)
            eye.fillColor = eyeColor
            eye.strokeColor = .clear
            eye.position = CGPoint(x: xOff, y: headY + 1 * scale)
            eye.zPosition = 3
            container.addChild(eye)
        }

        // Eye glow for elites and bosses
        if enemy.tier == .elite || enemy.tier == .boss {
            let eyeGlow = SKAction.repeatForever(SKAction.sequence([
                SKAction.run { head.glowWidth = 2 },
                SKAction.wait(forDuration: 1.5),
                SKAction.run { head.glowWidth = 0 },
                SKAction.wait(forDuration: 1.5)
            ]))
            head.run(eyeGlow)
        }

        // Behavior-specific features
        addBehaviorFeatures(to: container, behavior: enemy.behavior, tier: enemy.tier,
                           scale: scale, headY: headY, headR: headR, bodyH: bodyH)

        // Boss crown (enhanced)
        if enemy.tier == .boss {
            addBossCrown(to: container, scale: scale, headY: headY, headR: headR, accentColor: accentColor)
        }

        // HP bar (améliorée)
        let hpBarY = headY + headR + (enemy.tier == .boss ? 16 : 6) * scale
        addHPBar(to: container, tier: enemy.tier, position: CGPoint(x: 0, y: hpBarY))

        // Name label (avec couleur de tier)
        let nameLabel = SKLabelNode(fontNamed: "Copperplate-Bold")
        nameLabel.text = enemy.name
        nameLabel.fontSize = 8
        nameLabel.fontColor = tierLabelColor(for: enemy.tier)
        nameLabel.position = CGPoint(x: 0, y: hpBarY + 6)
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

        // Tier indicator
        if enemy.tier == .elite || enemy.tier == .boss {
            let tierIcon = SKLabelNode(fontNamed: "Helvetica-Bold")
            tierIcon.text = enemy.tier == .boss ? "★" : "◆"
            tierIcon.fontSize = 8
            tierIcon.fontColor = tierLabelColor(for: enemy.tier)
            tierIcon.position = CGPoint(x: -(CGFloat(enemy.name.count) * 2.5 + 6), y: hpBarY + 5)
            tierIcon.zPosition = 10
            container.addChild(tierIcon)
        }

        // Idle animations selon behavior
        addIdleAnimation(to: body, behavior: enemy.behavior, container: container)

        return container
    }

    // MARK: - Enemy Detail Helpers

    private static func addEnemyArmorDetails(to body: SKShapeNode, tier: EnemyTier, scale: CGFloat, bodyW: CGFloat, bodyH: CGFloat) {
        switch tier {
        case .minion:
            // Simple cloth wrap
            let wrap = SKShapeNode(rectOf: CGSize(width: bodyW - 4, height: 3 * scale))
            wrap.fillColor = SKColor(white: 0.35, alpha: 0.4)
            wrap.strokeColor = .clear
            wrap.position = CGPoint(x: 0, y: 2)
            body.addChild(wrap)

        case .soldier:
            // Leather armor pieces
            let chestPiece = SKShapeNode(rectOf: CGSize(width: bodyW - 6, height: bodyH - 8), cornerRadius: 2)
            chestPiece.fillColor = SKColor(red: 0.45, green: 0.3, blue: 0.2, alpha: 0.5)
            chestPiece.strokeColor = SKColor(red: 0.5, green: 0.35, blue: 0.25, alpha: 0.3)
            chestPiece.lineWidth = 0.5
            body.addChild(chestPiece)

            // Belt
            let belt = SKShapeNode(rectOf: CGSize(width: bodyW - 2, height: 2 * scale))
            belt.fillColor = SKColor(red: 0.4, green: 0.3, blue: 0.2, alpha: 0.7)
            belt.strokeColor = .clear
            belt.position = CGPoint(x: 0, y: -bodyH / 4)
            body.addChild(belt)

        case .elite:
            // Chain mail pattern
            for row in stride(from: Int(-bodyH / 3), to: Int(bodyH / 3), by: Int(3 * scale)) {
                let line = SKShapeNode(rectOf: CGSize(width: bodyW - 4, height: 0.5))
                line.fillColor = SKColor(red: 0.7, green: 0.5, blue: 0.9, alpha: 0.3)
                line.strokeColor = .clear
                line.position = CGPoint(x: 0, y: CGFloat(row))
                body.addChild(line)
            }

            // Shoulder spikes
            let spike = SKShapeNode(rectOf: CGSize(width: 3, height: 4))
            spike.fillColor = SKColor(red: 0.6, green: 0.1, blue: 0.45, alpha: 0.8)
            spike.strokeColor = .clear
            spike.position = CGPoint(x: 0, y: bodyH / 2 - 2)
            body.addChild(spike)

            // Central gem
            let gem = SKShapeNode(circleOfRadius: 2 * scale)
            gem.fillColor = SKColor(red: 0.8, green: 0.3, blue: 0.9, alpha: 0.8)
            gem.strokeColor = SKColor(red: 0.9, green: 0.5, blue: 1.0, alpha: 0.4)
            gem.lineWidth = 0.5
            gem.position = CGPoint(x: 0, y: 3)
            body.addChild(gem)

        case .boss:
            // Full plate armor
            let plate = SKShapeNode(rectOf: CGSize(width: bodyW - 4, height: bodyH - 6), cornerRadius: 3)
            plate.fillColor = SKColor(white: 0.5, alpha: 0.2)
            plate.strokeColor = SKColor(red: 1, green: 0.7, blue: 0.2, alpha: 0.3)
            plate.lineWidth = 1
            body.addChild(plate)

            // Ornate center piece
            let center = SKShapeNode(rectOf: CGSize(width: 4 * scale, height: 6 * scale), cornerRadius: 1)
            center.fillColor = SKColor(red: 0.9, green: 0.7, blue: 0.1, alpha: 0.6)
            center.strokeColor = SKColor(red: 1, green: 0.85, blue: 0.3, alpha: 0.4)
            center.lineWidth = 0.5
            center.position = CGPoint(x: 0, y: 2)
            body.addChild(center)

            // Belt with buckle
            let belt = SKShapeNode(rectOf: CGSize(width: bodyW, height: 3 * scale))
            belt.fillColor = SKColor(red: 0.5, green: 0.35, blue: 0.15, alpha: 0.8)
            belt.strokeColor = .clear
            belt.position = CGPoint(x: 0, y: -bodyH / 4)
            body.addChild(belt)

            let buckle = SKShapeNode(circleOfRadius: 2 * scale)
            buckle.fillColor = SKColor(red: 1, green: 0.8, blue: 0.2, alpha: 0.9)
            buckle.strokeColor = .clear
            buckle.position = CGPoint(x: 0, y: -bodyH / 4)
            body.addChild(buckle)
        }
    }

    private static func addTierAura(to container: SKNode, tier: EnemyTier, scale: CGFloat) {
        guard tier == .elite || tier == .boss else { return }

        let auraRadius: CGFloat = tier == .boss ? 20 * scale : 14 * scale
        let auraColor: SKColor = tier == .boss
            ? SKColor(red: 0.9, green: 0.5, blue: 0.1, alpha: 0.15)
            : SKColor(red: 0.7, green: 0.1, blue: 0.5, alpha: 0.15)
        let strokeColor: SKColor = tier == .boss
            ? SKColor(red: 1, green: 0.7, blue: 0.2, alpha: 0.3)
            : SKColor(red: 0.7, green: 0.1, blue: 0.5, alpha: 0.3)

        let aura = SKShapeNode(circleOfRadius: auraRadius)
        aura.fillColor = auraColor
        aura.strokeColor = strokeColor
        aura.lineWidth = tier == .boss ? 2 : 1.5
        aura.position = CGPoint(x: 0, y: 12 * scale)
        aura.zPosition = -0.5
        container.addChild(aura)

        let pulse = SKAction.repeatForever(SKAction.sequence([
            SKAction.scale(to: 1.2, duration: 0.8),
            SKAction.scale(to: 0.9, duration: 0.8)
        ]))
        aura.run(pulse)

        // Boss: second aura ring
        if tier == .boss {
            let outerAura = SKShapeNode(circleOfRadius: auraRadius + 6)
            outerAura.fillColor = .clear
            outerAura.strokeColor = SKColor(red: 1, green: 0.6, blue: 0.1, alpha: 0.15)
            outerAura.lineWidth = 1
            outerAura.position = CGPoint(x: 0, y: 12 * scale)
            outerAura.zPosition = -0.6
            container.addChild(outerAura)

            let outerPulse = SKAction.repeatForever(SKAction.sequence([
                SKAction.scale(to: 0.9, duration: 1.0),
                SKAction.scale(to: 1.3, duration: 1.0)
            ]))
            outerAura.run(outerPulse)
        }
    }

    private static func addBehaviorFeatures(to container: SKNode, behavior: AIBehavior, tier: EnemyTier,
                                             scale: CGFloat, headY: CGFloat, headR: CGFloat, bodyH: CGFloat) {
        switch behavior {
        case .ranged:
            // Arc ou bâton à distance
            let bow = SKShapeNode(rectOf: CGSize(width: 2, height: 14 * scale))
            bow.fillColor = SKColor(red: 0.4, green: 0.3, blue: 0.2, alpha: 1)
            bow.strokeColor = .clear
            bow.position = CGPoint(x: 12 * scale, y: bodyH / 2)
            bow.zPosition = 1.6
            bow.zRotation = -0.2
            container.addChild(bow)

            // Corde de l'arc
            let string = SKShapeNode(rectOf: CGSize(width: 0.5, height: 12 * scale))
            string.fillColor = SKColor(white: 0.7, alpha: 0.6)
            string.strokeColor = .clear
            string.position = CGPoint(x: 10 * scale, y: bodyH / 2)
            string.zPosition = 1.7
            container.addChild(string)

        case .berserk:
            // Griffes / cornes
            for xOff in [-3 * scale, 3 * scale] {
                let horn = SKShapeNode(rectOf: CGSize(width: 2, height: 5 * scale))
                horn.fillColor = SKColor(red: 0.6, green: 0.5, blue: 0.4, alpha: 1)
                horn.strokeColor = .clear
                horn.position = CGPoint(x: xOff, y: headY + headR + 2)
                horn.zRotation = xOff > 0 ? -0.3 : 0.3
                horn.zPosition = 3.5
                container.addChild(horn)
            }

            // Rage marks
            let mark = SKShapeNode(rectOf: CGSize(width: 3, height: 1))
            mark.fillColor = SKColor(red: 1, green: 0.2, blue: 0.1, alpha: 0.7)
            mark.strokeColor = .clear
            mark.position = CGPoint(x: 0, y: headY - headR / 2)
            mark.zPosition = 3.5
            container.addChild(mark)

        case .support:
            // Orbe de soin flottant
            let orb = SKShapeNode(circleOfRadius: 3 * scale)
            orb.fillColor = SKColor(red: 0.2, green: 0.8, blue: 0.3, alpha: 0.5)
            orb.strokeColor = SKColor(red: 0.3, green: 1.0, blue: 0.4, alpha: 0.3)
            orb.lineWidth = 0.5
            orb.position = CGPoint(x: -10 * scale, y: headY)
            orb.zPosition = 3
            container.addChild(orb)

            let float = SKAction.repeatForever(SKAction.sequence([
                SKAction.moveBy(x: 0, y: 3, duration: 1.0),
                SKAction.moveBy(x: 0, y: -3, duration: 1.0)
            ]))
            orb.run(float)

        case .ambush:
            // Semi-transparent
            container.alpha = 0.6

        case .guard:
            // Bouclier
            let shield = SKShapeNode(rectOf: CGSize(width: 6 * scale, height: 10 * scale), cornerRadius: 2)
            shield.fillColor = SKColor(red: 0.45, green: 0.4, blue: 0.35, alpha: 1)
            shield.strokeColor = SKColor(red: 0.55, green: 0.5, blue: 0.45, alpha: 0.5)
            shield.lineWidth = 1
            shield.position = CGPoint(x: -10 * scale, y: bodyH / 2 + 4 * scale)
            shield.zPosition = 1.8
            container.addChild(shield)

            // Shield emblem
            let emblem = SKShapeNode(circleOfRadius: 2 * scale)
            emblem.fillColor = SKColor(red: 0.6, green: 0.5, blue: 0.3, alpha: 0.7)
            emblem.strokeColor = .clear
            shield.addChild(emblem)

        case .patrol, .wander:
            // Arme simple (épée)
            let sword = SKShapeNode(rectOf: CGSize(width: 2, height: 12 * scale))
            sword.fillColor = SKColor(red: 0.5, green: 0.5, blue: 0.55, alpha: 0.9)
            sword.strokeColor = SKColor(white: 0.7, alpha: 0.3)
            sword.lineWidth = 0.5
            sword.position = CGPoint(x: 11 * scale, y: bodyH / 2 + 4 * scale)
            sword.zPosition = 1.6
            container.addChild(sword)
        }
    }

    private static func addBossCrown(to container: SKNode, scale: CGFloat, headY: CGFloat, headR: CGFloat, accentColor: SKColor) {
        let crownY = headY + headR + 1

        // Base de la couronne
        let crown = SKShapeNode(rectOf: CGSize(width: 14 * scale, height: 5 * scale), cornerRadius: 1)
        crown.fillColor = SKColor(red: 0.9, green: 0.7, blue: 0.1, alpha: 1)
        crown.strokeColor = SKColor(red: 1, green: 0.85, blue: 0.2, alpha: 0.8)
        crown.lineWidth = 1
        crown.position = CGPoint(x: 0, y: crownY + 2)
        crown.zPosition = 4
        container.addChild(crown)

        // Pointes de couronne avec gemmes
        for (i, xOff) in ([-4, 0, 4] as [CGFloat]).enumerated() {
            let spike = SKShapeNode(rectOf: CGSize(width: 2.5, height: 5 * scale))
            spike.fillColor = SKColor(red: 1, green: 0.85, blue: 0.2, alpha: 1)
            spike.strokeColor = .clear
            spike.position = CGPoint(x: xOff * scale, y: crownY + 6)
            spike.zPosition = 4
            container.addChild(spike)

            // Gemme sur chaque pointe
            if i == 1 { // gemme centrale plus grosse
                let gem = SKShapeNode(circleOfRadius: 2)
                gem.fillColor = SKColor(red: 0.9, green: 0.2, blue: 0.15, alpha: 0.9)
                gem.strokeColor = SKColor(red: 1, green: 0.4, blue: 0.3, alpha: 0.5)
                gem.lineWidth = 0.5
                gem.position = CGPoint(x: xOff * scale, y: crownY + 9)
                gem.zPosition = 4.1
                container.addChild(gem)

                let glow = SKAction.repeatForever(SKAction.sequence([
                    SKAction.run { gem.glowWidth = 3 },
                    SKAction.wait(forDuration: 0.8),
                    SKAction.run { gem.glowWidth = 1 },
                    SKAction.wait(forDuration: 0.8)
                ]))
                gem.run(glow)
            }
        }
    }

    private static func addHPBar(to container: SKNode, tier: EnemyTier, position: CGPoint) {
        let barWidth: CGFloat = tier == .boss ? 34 : 26
        let barHeight: CGFloat = tier == .boss ? 4 : 3

        let hpBarBg = SKShapeNode(rectOf: CGSize(width: barWidth + 2, height: barHeight + 2), cornerRadius: 1)
        hpBarBg.fillColor = SKColor(red: 0.15, green: 0.05, blue: 0.05, alpha: 0.9)
        hpBarBg.strokeColor = tier == .boss
            ? SKColor(red: 0.6, green: 0.4, blue: 0.1, alpha: 0.6)
            : SKColor(red: 0.3, green: 0.1, blue: 0.1, alpha: 0.5)
        hpBarBg.lineWidth = 0.5
        hpBarBg.position = position
        hpBarBg.zPosition = 10
        hpBarBg.name = "hpBarBg"
        container.addChild(hpBarBg)

        let hpFill = SKShapeNode(rectOf: CGSize(width: barWidth, height: barHeight), cornerRadius: 0.5)
        hpFill.fillColor = .green
        hpFill.strokeColor = .clear
        hpFill.name = "hpFill"
        hpBarBg.addChild(hpFill)
    }

    private static func addIdleAnimation(to body: SKShapeNode, behavior: AIBehavior, container: SKNode) {
        switch behavior {
        case .patrol, .wander:
            let sway = SKAction.repeatForever(SKAction.sequence([
                SKAction.moveBy(x: 1.5, y: 0, duration: 1.2),
                SKAction.moveBy(x: -1.5, y: 0, duration: 1.2)
            ]))
            body.run(sway)

        case .guard:
            // Subtle breathing
            let breathe = SKAction.repeatForever(SKAction.sequence([
                SKAction.scaleY(to: 1.02, duration: 1.8),
                SKAction.scaleY(to: 0.98, duration: 1.8)
            ]))
            body.run(breathe)

        case .berserk:
            // Agitated movement
            let agitate = SKAction.repeatForever(SKAction.sequence([
                SKAction.moveBy(x: 2, y: 0, duration: 0.3),
                SKAction.moveBy(x: -4, y: 0, duration: 0.3),
                SKAction.moveBy(x: 2, y: 0, duration: 0.3),
                SKAction.wait(forDuration: 1.0)
            ]))
            body.run(agitate)

        case .ambush:
            // Slow fade in/out
            let lurk = SKAction.repeatForever(SKAction.sequence([
                SKAction.fadeAlpha(to: 0.4, duration: 2.0),
                SKAction.fadeAlpha(to: 0.7, duration: 2.0)
            ]))
            container.run(lurk)

        case .ranged:
            let lookAround = SKAction.repeatForever(SKAction.sequence([
                SKAction.scaleX(to: 1.0, duration: 2.0),
                SKAction.scaleX(to: -1.0, duration: 0.1),
                SKAction.wait(forDuration: 2.0),
                SKAction.scaleX(to: 1.0, duration: 0.1)
            ]))
            body.run(lookAround)

        case .support:
            // Gentle float
            let float = SKAction.repeatForever(SKAction.sequence([
                SKAction.moveBy(x: 0, y: 2, duration: 1.5),
                SKAction.moveBy(x: 0, y: -2, duration: 1.5)
            ]))
            body.run(float)
        }
    }

    // MARK: - Enemy Visual Helpers

    static func updateEnemyHP(node: SKNode, ratio: CGFloat) {
        guard let hpBg = node.childNode(withName: "hpBarBg"),
              let hpFill = hpBg.childNode(withName: "hpFill") as? SKShapeNode else { return }

        let clampedRatio = max(0, min(1, ratio))
        hpFill.xScale = clampedRatio
        hpFill.fillColor = clampedRatio > 0.5 ? hpColorHealthy : (clampedRatio > 0.25 ? hpColorWarning : hpColorCritical)
    }

    static func playHitEffect(on enemyNode: SKNode) {
        guard let body = enemyNode.childNode(withName: "enemyBody") as? SKShapeNode else { return }
        let originalColor = body.fillColor

        let flash = SKAction.sequence([
            SKAction.run { body.fillColor = .white },
            SKAction.wait(forDuration: 0.06),
            SKAction.run { body.fillColor = SKColor(red: 1, green: 0.3, blue: 0.3, alpha: 1) },
            SKAction.wait(forDuration: 0.06),
            SKAction.run { body.fillColor = originalColor }
        ])
        body.run(flash)

        // Shake effect
        let shake = SKAction.sequence([
            SKAction.moveBy(x: -2, y: 0, duration: 0.03),
            SKAction.moveBy(x: 4, y: 0, duration: 0.03),
            SKAction.moveBy(x: -2, y: 0, duration: 0.03)
        ])
        enemyNode.run(shake)
    }

    static func playDeathAnimation(on enemyNode: SKNode, completion: @escaping () -> Void) {
        // Particules d'explosion
        let particleCount = 6
        for i in 0..<particleCount {
            let particle = SKShapeNode(circleOfRadius: 2)
            particle.fillColor = SKColor(red: 1, green: 0.6, blue: 0.1, alpha: 0.8)
            particle.strokeColor = .clear
            particle.position = enemyNode.position
            particle.zPosition = enemyNode.zPosition + 5
            enemyNode.parent?.addChild(particle)

            let angle = CGFloat(i) * (.pi * 2 / CGFloat(particleCount))
            let distance: CGFloat = 20
            let move = SKAction.moveBy(x: cos(angle) * distance, y: sin(angle) * distance, duration: 0.4)
            let fade = SKAction.fadeOut(withDuration: 0.4)
            let scale = SKAction.scale(to: 0.1, duration: 0.4)

            particle.run(SKAction.sequence([
                SKAction.group([move, fade, scale]),
                SKAction.removeFromParent()
            ]))
        }

        let death = SKAction.sequence([
            SKAction.group([
                SKAction.fadeOut(withDuration: 0.5),
                SKAction.scale(to: 0.3, duration: 0.5)
            ]),
            SKAction.run(completion),
            SKAction.removeFromParent()
        ])
        enemyNode.run(death)
    }

    // MARK: - NPC Rendering (Enhanced)

    static func createNPCNode(npc: NPCSpawn) -> SKNode {
        let container = SKNode()
        container.name = "npc_\(npc.npcID)"

        let isShop = npc.isShopkeeper
        let role = npcRole(from: npc.npcID)

        // Shadow
        let shadow = SKShapeNode(ellipseOf: CGSize(width: 22, height: 10))
        shadow.fillColor = SKColor(white: 0, alpha: 0.3)
        shadow.strokeColor = .clear
        shadow.position = CGPoint(x: 0, y: -3)
        shadow.zPosition = -1
        container.addChild(shadow)

        // Friendly aura
        let aura = SKShapeNode(circleOfRadius: 20)
        aura.fillColor = npcAuraColor(isShop: isShop, role: role).withAlphaComponent(0.06)
        aura.strokeColor = .clear
        aura.position = CGPoint(x: 0, y: 12)
        aura.zPosition = -0.5
        container.addChild(aura)

        // Feet
        for xOff in [-3, 3] as [CGFloat] {
            let foot = SKShapeNode(rectOf: CGSize(width: 4, height: 3), cornerRadius: 1)
            foot.fillColor = SKColor(red: 0.35, green: 0.25, blue: 0.15, alpha: 1)
            foot.strokeColor = .clear
            foot.position = CGPoint(x: xOff, y: 0)
            foot.zPosition = 0
            container.addChild(foot)
        }

        // Legs
        let legColor = npcClothColor(isShop: isShop, role: role).withAlphaComponent(0.7)
        for xOff in [-3, 3] as [CGFloat] {
            let leg = SKShapeNode(rectOf: CGSize(width: 4, height: 8), cornerRadius: 1)
            leg.fillColor = legColor
            leg.strokeColor = .clear
            leg.position = CGPoint(x: xOff, y: 5)
            leg.zPosition = 0.5
            container.addChild(leg)
        }

        // Body/Torso
        let bodyColor = npcClothColor(isShop: isShop, role: role)
        let body = SKShapeNode(rectOf: CGSize(width: 16, height: 20), cornerRadius: 3)
        body.fillColor = bodyColor
        body.strokeColor = bodyColor.withAlphaComponent(0.4)
        body.lineWidth = 1
        body.position = CGPoint(x: 0, y: 14)
        body.zPosition = 1
        container.addChild(body)

        // Role-specific clothing details
        addNPCClothingDetails(to: body, isShop: isShop, role: role)

        // Arms
        let armColor = bodyColor.withAlphaComponent(0.85)
        for xOff in [-10, 10] as [CGFloat] {
            let arm = SKShapeNode(rectOf: CGSize(width: 3, height: 10), cornerRadius: 1)
            arm.fillColor = armColor
            arm.strokeColor = .clear
            arm.position = CGPoint(x: xOff, y: 12)
            arm.zPosition = 1.5
            container.addChild(arm)
        }

        // Hands
        let skinCol = npcSkinColor(role: role)
        for xOff in [-10, 10] as [CGFloat] {
            let hand = SKShapeNode(circleOfRadius: 2)
            hand.fillColor = skinCol
            hand.strokeColor = .clear
            hand.position = CGPoint(x: xOff, y: 6)
            hand.zPosition = 1.5
            container.addChild(hand)
        }

        // Head
        let head = SKShapeNode(circleOfRadius: 7)
        head.fillColor = skinCol
        head.strokeColor = .clear
        head.position = CGPoint(x: 0, y: 30)
        head.zPosition = 2
        container.addChild(head)

        // Hair
        let hairColor = npcHairColor(role: role)
        let hair = SKShapeNode(ellipseOf: CGSize(width: 15, height: 8))
        hair.fillColor = hairColor
        hair.strokeColor = .clear
        hair.position = CGPoint(x: 0, y: 33)
        hair.zPosition = 2.1
        container.addChild(hair)

        // Eyes (friendly, larger than enemies)
        for xOff in [-3, 3] as [CGFloat] {
            let eyeWhite = SKShapeNode(ellipseOf: CGSize(width: 4, height: 3))
            eyeWhite.fillColor = .white
            eyeWhite.strokeColor = .clear
            eyeWhite.position = CGPoint(x: xOff, y: 31)
            eyeWhite.zPosition = 3
            container.addChild(eyeWhite)

            let pupil = SKShapeNode(circleOfRadius: 1.2)
            pupil.fillColor = npcEyeColor(role: role)
            pupil.strokeColor = .clear
            pupil.position = CGPoint(x: xOff, y: 31)
            pupil.zPosition = 3.1
            container.addChild(pupil)
        }

        // Mouth (friendly smile)
        let mouth = SKShapeNode(ellipseOf: CGSize(width: 4, height: 2))
        mouth.fillColor = SKColor(red: 0.6, green: 0.35, blue: 0.3, alpha: 0.6)
        mouth.strokeColor = .clear
        mouth.position = CGPoint(x: 0, y: 27)
        mouth.zPosition = 3
        container.addChild(mouth)

        // Role-specific accessories
        addNPCRoleAccessories(to: container, isShop: isShop, role: role)

        // Quest/shop indicators
        if isShop {
            addShopIndicator(to: container)
        }

        if npc.dialogueTreeID != nil {
            addQuestIndicator(to: container, isShop: isShop)
        }

        // NPC name
        let displayName = formatNPCName(npc.npcID)
        let nameLabel = SKLabelNode(fontNamed: "Copperplate")
        nameLabel.text = displayName
        nameLabel.fontSize = 7
        nameLabel.fontColor = isShop ? SKColor(red: 1, green: 0.9, blue: 0.5, alpha: 1) : SKColor(white: 0.85, alpha: 1)
        nameLabel.position = CGPoint(x: 0, y: isShop ? 52 : 44)
        nameLabel.zPosition = 10
        container.addChild(nameLabel)

        // Idle animation
        let idle = SKAction.repeatForever(SKAction.sequence([
            SKAction.scaleY(to: 1.02, duration: 1.8),
            SKAction.scaleY(to: 0.98, duration: 1.8)
        ]))
        body.run(idle)

        return container
    }

    // MARK: - NPC Detail Helpers

    private static func addNPCClothingDetails(to body: SKShapeNode, isShop: Bool, role: String) {
        if isShop {
            // Tablier de marchand
            let apron = SKShapeNode(rectOf: CGSize(width: 12, height: 14), cornerRadius: 1)
            apron.fillColor = SKColor(red: 0.7, green: 0.6, blue: 0.45, alpha: 0.6)
            apron.strokeColor = .clear
            apron.position = CGPoint(x: 0, y: -1)
            body.addChild(apron)

            // Poches
            for xOff in [-4, 4] as [CGFloat] {
                let pocket = SKShapeNode(rectOf: CGSize(width: 3, height: 3), cornerRadius: 0.5)
                pocket.fillColor = SKColor(red: 0.5, green: 0.4, blue: 0.3, alpha: 0.5)
                pocket.strokeColor = .clear
                pocket.position = CGPoint(x: xOff, y: -4)
                body.addChild(pocket)
            }
        } else if role == "trainer" || role == "master" {
            // Ceinture martiale
            let belt = SKShapeNode(rectOf: CGSize(width: 16, height: 2))
            belt.fillColor = SKColor(red: 0.6, green: 0.5, blue: 0.15, alpha: 0.8)
            belt.strokeColor = .clear
            belt.position = CGPoint(x: 0, y: -5)
            body.addChild(belt)
        } else if role == "scholar" || role == "ardent" {
            // Robe académique - bordure
            let trim = SKShapeNode(rectOf: CGSize(width: 14, height: 1.5))
            trim.fillColor = SKColor(red: 0.6, green: 0.5, blue: 0.2, alpha: 0.6)
            trim.strokeColor = .clear
            trim.position = CGPoint(x: 0, y: -8)
            body.addChild(trim)

            // Symbole
            let symbol = SKShapeNode(circleOfRadius: 2)
            symbol.fillColor = .clear
            symbol.strokeColor = SKColor(red: 0.7, green: 0.6, blue: 0.3, alpha: 0.5)
            symbol.lineWidth = 0.5
            symbol.position = CGPoint(x: 0, y: 3)
            body.addChild(symbol)
        }
    }

    private static func addNPCRoleAccessories(to container: SKNode, isShop: Bool, role: String) {
        if isShop {
            // Chapeau de marchand (amélioré)
            let hat = SKShapeNode(ellipseOf: CGSize(width: 18, height: 6))
            hat.fillColor = SKColor(red: 0.5, green: 0.35, blue: 0.15, alpha: 1)
            hat.strokeColor = SKColor(red: 0.4, green: 0.3, blue: 0.12, alpha: 0.5)
            hat.lineWidth = 0.5
            hat.position = CGPoint(x: 0, y: 36)
            hat.zPosition = 4
            container.addChild(hat)

            let hatTop = SKShapeNode(rectOf: CGSize(width: 10, height: 6), cornerRadius: 2)
            hatTop.fillColor = SKColor(red: 0.5, green: 0.35, blue: 0.15, alpha: 1)
            hatTop.strokeColor = .clear
            hatTop.position = CGPoint(x: 0, y: 39)
            hatTop.zPosition = 4.1
            container.addChild(hatTop)

            // Sac de marchandises
            let bag = SKShapeNode(ellipseOf: CGSize(width: 8, height: 10))
            bag.fillColor = SKColor(red: 0.5, green: 0.4, blue: 0.25, alpha: 0.8)
            bag.strokeColor = SKColor(red: 0.4, green: 0.3, blue: 0.2, alpha: 0.4)
            bag.lineWidth = 0.5
            bag.position = CGPoint(x: 12, y: 8)
            bag.zPosition = 0.8
            container.addChild(bag)
        }

        if role == "trainer" || role == "master" {
            // Arme d'entraînement
            let staff = SKShapeNode(rectOf: CGSize(width: 2, height: 24))
            staff.fillColor = SKColor(red: 0.45, green: 0.35, blue: 0.2, alpha: 1)
            staff.strokeColor = .clear
            staff.position = CGPoint(x: 14, y: 14)
            staff.zPosition = 0.8
            container.addChild(staff)
        }

        if role == "scholar" || role == "ardent" {
            // Livre
            let book = SKShapeNode(rectOf: CGSize(width: 6, height: 8), cornerRadius: 1)
            book.fillColor = SKColor(red: 0.5, green: 0.3, blue: 0.15, alpha: 1)
            book.strokeColor = SKColor(red: 0.4, green: 0.25, blue: 0.1, alpha: 0.5)
            book.lineWidth = 0.5
            book.position = CGPoint(x: -12, y: 10)
            book.zPosition = 1.8
            container.addChild(book)

            let pages = SKShapeNode(rectOf: CGSize(width: 4, height: 6))
            pages.fillColor = SKColor(red: 0.9, green: 0.85, blue: 0.75, alpha: 0.9)
            pages.strokeColor = .clear
            book.addChild(pages)
        }
    }

    private static func addShopIndicator(to container: SKNode) {
        // Pièce d'or flottante
        let coin = SKShapeNode(circleOfRadius: 4)
        coin.fillColor = SKColor(red: 0.95, green: 0.8, blue: 0.2, alpha: 1)
        coin.strokeColor = SKColor(red: 0.8, green: 0.65, blue: 0.15, alpha: 0.8)
        coin.lineWidth = 1
        coin.position = CGPoint(x: 0, y: 46)
        coin.zPosition = 10
        coin.name = "shopCoin"
        container.addChild(coin)

        // Symbole $ sur la pièce
        let coinSymbol = SKLabelNode(fontNamed: "Helvetica-Bold")
        coinSymbol.text = "◎"
        coinSymbol.fontSize = 6
        coinSymbol.fontColor = SKColor(red: 0.6, green: 0.45, blue: 0.1, alpha: 1)
        coinSymbol.verticalAlignmentMode = .center
        coinSymbol.position = CGPoint(x: 0, y: 46)
        coinSymbol.zPosition = 11
        container.addChild(coinSymbol)

        let bounce = SKAction.repeatForever(SKAction.sequence([
            SKAction.moveBy(x: 0, y: 3, duration: 0.5),
            SKAction.moveBy(x: 0, y: -3, duration: 0.5)
        ]))
        coin.run(bounce)
        coinSymbol.run(bounce)
    }

    private static func addQuestIndicator(to container: SKNode, isShop: Bool) {
        let yBase: CGFloat = isShop ? 54 : 44

        let questBubble = SKShapeNode(circleOfRadius: 7)
        questBubble.fillColor = SKColor(red: 1, green: 0.9, blue: 0.2, alpha: 0.9)
        questBubble.strokeColor = SKColor(red: 0.85, green: 0.75, blue: 0.1, alpha: 0.8)
        questBubble.lineWidth = 1.5
        questBubble.position = CGPoint(x: 0, y: yBase)
        questBubble.zPosition = 10
        questBubble.name = "questMark"
        container.addChild(questBubble)

        let mark = SKLabelNode(fontNamed: "Copperplate-Bold")
        mark.text = "!"
        mark.fontSize = 11
        mark.fontColor = SKColor(red: 0.3, green: 0.2, blue: 0, alpha: 1)
        mark.verticalAlignmentMode = .center
        mark.position = CGPoint(x: 0, y: yBase)
        mark.zPosition = 11
        container.addChild(mark)

        let bounce = SKAction.repeatForever(SKAction.sequence([
            SKAction.moveBy(x: 0, y: 4, duration: 0.4),
            SKAction.moveBy(x: 0, y: -4, duration: 0.4)
        ]))
        questBubble.run(bounce)
        mark.run(bounce)

        // Particules autour du quest marker
        let sparkle = SKAction.repeatForever(SKAction.sequence([
            SKAction.run {
                questBubble.glowWidth = 3
            },
            SKAction.wait(forDuration: 0.5),
            SKAction.run {
                questBubble.glowWidth = 0
            },
            SKAction.wait(forDuration: 1.5)
        ]))
        questBubble.run(sparkle)
    }

    // MARK: - Zone Exit Indicator (Enhanced)

    static func createZoneExitIndicator(connection: ZoneConnection) -> SKNode {
        let container = SKNode()
        container.name = "exit_\(connection.targetZoneID)"

        // Ground ring
        let groundRing = SKShapeNode(ellipseOf: CGSize(width: 28, height: 16))
        groundRing.fillColor = SKColor(red: 0.2, green: 0.6, blue: 0.3, alpha: 0.15)
        groundRing.strokeColor = SKColor(red: 0.3, green: 0.8, blue: 0.4, alpha: 0.4)
        groundRing.lineWidth = 1.5
        groundRing.zPosition = 0
        container.addChild(groundRing)

        // Portal outer glow
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

        // Swirl effect inside portal
        let swirl = SKShapeNode(circleOfRadius: 5)
        swirl.fillColor = .clear
        swirl.strokeColor = SKColor(red: 0.5, green: 1, blue: 0.6, alpha: 0.4)
        swirl.lineWidth = 1
        swirl.zPosition = 2.5
        container.addChild(swirl)

        let rotate = SKAction.repeatForever(SKAction.rotate(byAngle: .pi * 2, duration: 3.0))
        swirl.run(rotate)

        // Vertical energy pillar
        let pillar = SKShapeNode(rectOf: CGSize(width: 4, height: 20))
        pillar.fillColor = SKColor(red: 0.4, green: 1, blue: 0.5, alpha: 0.2)
        pillar.strokeColor = .clear
        pillar.position = CGPoint(x: 0, y: 10)
        pillar.zPosition = 2
        container.addChild(pillar)

        let pillarPulse = SKAction.repeatForever(SKAction.sequence([
            SKAction.fadeAlpha(to: 0.1, duration: 1.0),
            SKAction.fadeAlpha(to: 0.4, duration: 1.0)
        ]))
        pillar.run(pillarPulse)

        // Arrow
        let arrow = SKLabelNode(fontNamed: "Helvetica-Bold")
        arrow.text = "▶"
        arrow.fontSize = 10
        arrow.fontColor = SKColor(red: 0.4, green: 1, blue: 0.5, alpha: 0.8)
        arrow.verticalAlignmentMode = .center
        arrow.position = CGPoint(x: 0, y: 14)
        arrow.zPosition = 3
        container.addChild(arrow)

        // Main pulse
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

    // MARK: - Color Helpers

    private static func enemyColor(for tier: EnemyTier) -> SKColor {
        switch tier {
        case .minion:  return SKColor(red: 0.45, green: 0.3, blue: 0.25, alpha: 1)
        case .soldier: return SKColor(red: 0.55, green: 0.2, blue: 0.2, alpha: 1)
        case .elite:   return SKColor(red: 0.5, green: 0.15, blue: 0.4, alpha: 1)
        case .boss:    return SKColor(red: 0.6, green: 0.12, blue: 0.12, alpha: 1)
        }
    }

    private static func enemyAccentColor(for tier: EnemyTier) -> SKColor {
        switch tier {
        case .minion:  return SKColor(red: 0.5, green: 0.4, blue: 0.35, alpha: 1)
        case .soldier: return SKColor(red: 0.7, green: 0.3, blue: 0.3, alpha: 1)
        case .elite:   return SKColor(red: 0.8, green: 0.4, blue: 0.9, alpha: 1)
        case .boss:    return SKColor(red: 1.0, green: 0.75, blue: 0.2, alpha: 1)
        }
    }

    private static func enemySkinColor(for tier: EnemyTier) -> SKColor {
        switch tier {
        case .minion:  return SKColor(red: 0.6, green: 0.5, blue: 0.42, alpha: 1)
        case .soldier: return SKColor(red: 0.55, green: 0.45, blue: 0.38, alpha: 1)
        case .elite:   return SKColor(red: 0.5, green: 0.4, blue: 0.5, alpha: 1)
        case .boss:    return SKColor(red: 0.5, green: 0.35, blue: 0.3, alpha: 1)
        }
    }

    private static func enemyEyeColor(for tier: EnemyTier, behavior: AIBehavior) -> SKColor {
        switch tier {
        case .boss:    return SKColor(red: 1, green: 0.3, blue: 0.1, alpha: 1)
        case .elite:   return SKColor(red: 0.8, green: 0.2, blue: 0.6, alpha: 1)
        default:
            switch behavior {
            case .berserk: return SKColor(red: 1, green: 0.15, blue: 0.1, alpha: 1)
            case .support: return SKColor(red: 0.3, green: 0.8, blue: 0.3, alpha: 1)
            case .ambush:  return SKColor(red: 0.6, green: 0.2, blue: 0.5, alpha: 1)
            default:       return SKColor(red: 0.9, green: 0.25, blue: 0.15, alpha: 1)
            }
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

    private static func npcClothColor(isShop: Bool, role: String) -> SKColor {
        if isShop {
            return SKColor(red: 0.5, green: 0.38, blue: 0.2, alpha: 1)
        }
        switch role {
        case "trainer", "master":
            return SKColor(red: 0.3, green: 0.35, blue: 0.5, alpha: 1)
        case "scholar", "ardent":
            return SKColor(red: 0.35, green: 0.3, blue: 0.45, alpha: 1)
        case "captain", "bridge":
            return SKColor(red: 0.4, green: 0.35, blue: 0.3, alpha: 1)
        case "ally", "contact":
            return SKColor(red: 0.3, green: 0.4, blue: 0.35, alpha: 1)
        default:
            return SKColor(red: 0.35, green: 0.38, blue: 0.45, alpha: 1)
        }
    }

    private static func npcAuraColor(isShop: Bool, role: String) -> SKColor {
        if isShop { return SKColor(red: 0.9, green: 0.75, blue: 0.2, alpha: 1) }
        return SKColor(red: 0.3, green: 0.5, blue: 0.7, alpha: 1)
    }

    private static func npcSkinColor(role: String) -> SKColor {
        return SKColor(red: 0.82, green: 0.7, blue: 0.56, alpha: 1)
    }

    private static func npcHairColor(role: String) -> SKColor {
        switch role {
        case "scholar", "ardent": return SKColor(red: 0.6, green: 0.5, blue: 0.4, alpha: 1)
        case "trainer", "master": return SKColor(red: 0.15, green: 0.1, blue: 0.08, alpha: 1)
        default: return SKColor(red: 0.25, green: 0.18, blue: 0.12, alpha: 1)
        }
    }

    private static func npcEyeColor(role: String) -> SKColor {
        return SKColor(red: 0.25, green: 0.2, blue: 0.35, alpha: 1)
    }

    private static func npcRole(from npcID: String) -> String {
        let parts = npcID.lowercased().split(separator: "_")
        if parts.contains("merchant") || parts.contains("water") { return "merchant" }
        if parts.contains("trainer") || parts.contains("master") { return "trainer" }
        if parts.contains("scholar") || parts.contains("ardent") { return "scholar" }
        if parts.contains("captain") || parts.contains("bridge") { return "captain" }
        if parts.contains("ally") || parts.contains("contact") { return "ally" }
        if parts.contains("informer") { return "informer" }
        return "default"
    }

    private static func formatNPCName(_ npcID: String) -> String {
        npcID.replacingOccurrences(of: "_", with: " ").capitalized
    }
}
