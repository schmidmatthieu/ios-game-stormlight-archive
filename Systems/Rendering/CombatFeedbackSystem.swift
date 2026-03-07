import SpriteKit

/// Système de retour visuel de combat — screen shake, dégâts flottants améliorés,
/// effets d'impact, traînées d'armes, indicateurs directionnels
final class CombatFeedbackSystem {

    // MARK: - Screen Shake

    /// Secousse de caméra proportionnelle à l'intensité
    static func screenShake(on camera: SKCameraNode, intensity: ShakeIntensity = .medium) {
        let (amplitude, count): (CGFloat, Int) = {
            switch intensity {
            case .light:  return (3, 2)
            case .medium: return (6, 3)
            case .heavy:  return (10, 5)
            case .epic:   return (14, 6)
            }
        }()

        var actions: [SKAction] = []
        for i in 0..<count {
            let decay = CGFloat(count - i) / CGFloat(count)
            let dx = CGFloat.random(in: -amplitude...amplitude) * decay
            let dy = CGFloat.random(in: -amplitude...amplitude) * decay
            actions.append(SKAction.moveBy(x: dx, y: dy, duration: 0.03))
            actions.append(SKAction.moveBy(x: -dx, y: -dy, duration: 0.03))
        }

        camera.run(SKAction.sequence(actions), withKey: "screenShake")
    }

    enum ShakeIntensity {
        case light, medium, heavy, epic
    }

    // MARK: - Hit Flash

    /// Flash blanc sur l'entité touchée
    static func hitFlash(on node: SKNode) {
        let flash = SKAction.sequence([
            SKAction.colorize(with: .white, colorBlendFactor: 0.8, duration: 0.05),
            SKAction.colorize(withColorBlendFactor: 0.0, duration: 0.1)
        ])
        node.run(flash, withKey: "hitFlash")
    }

    // MARK: - Hit Freeze (impact pause)

    /// Micro-freeze pour accentuer l'impact
    static func hitFreeze(scene: SKScene, duration: TimeInterval = 0.06) {
        scene.isPaused = true
        DispatchQueue.main.asyncAfter(deadline: .now() + duration) {
            scene.isPaused = false
        }
    }

    // MARK: - Enhanced Floating Damage Numbers

    /// Dégâts flottants améliorés avec type (normal, critique, heal, miss)
    static func showDamageNumber(_ value: Int, at position: CGPoint, type: DamageType,
                                  in worldNode: SKNode) {
        let container = SKNode()
        container.position = position
        container.zPosition = 500

        let label = SKLabelNode(fontNamed: "Copperplate-Bold")

        switch type {
        case .normal:
            label.text = "\(value)"
            label.fontSize = 14
            label.fontColor = .white

        case .critical:
            label.text = "\(value)!"
            label.fontSize = 20
            label.fontColor = SKColor(red: 1.0, green: 0.3, blue: 0.1, alpha: 1.0)

        case .heal:
            label.text = "+\(value)"
            label.fontSize = 16
            label.fontColor = SKColor(red: 0.2, green: 0.9, blue: 0.3, alpha: 1.0)

        case .miss:
            label.text = "Raté"
            label.fontSize = 12
            label.fontColor = SKColor(white: 0.6, alpha: 0.8)

        case .blocked:
            label.text = "Bloqué"
            label.fontSize = 12
            label.fontColor = SKColor(red: 0.5, green: 0.7, blue: 1.0, alpha: 1.0)

        case .magic(let color):
            label.text = "\(value)"
            label.fontSize = 16
            label.fontColor = color
        }

        label.verticalAlignmentMode = .center
        label.zPosition = 1
        container.addChild(label)

        // Outline shadow for readability
        let shadow = SKLabelNode(fontNamed: "Copperplate-Bold")
        shadow.text = label.text
        shadow.fontSize = label.fontSize
        shadow.fontColor = SKColor(white: 0, alpha: 0.6)
        shadow.position = CGPoint(x: 1, y: -1)
        shadow.verticalAlignmentMode = .center
        shadow.zPosition = 0
        container.addChild(shadow)

        worldNode.addChild(container)

        let isCrit = type == .critical
        let riseHeight: CGFloat = isCrit ? 60 : 40
        let duration: TimeInterval = isCrit ? 1.0 : 0.7
        let scale: CGFloat = isCrit ? 1.5 : 1.2

        container.setScale(0.3)
        container.run(SKAction.sequence([
            SKAction.group([
                SKAction.moveBy(x: CGFloat.random(in: -20...20), y: riseHeight, duration: duration),
                SKAction.sequence([
                    SKAction.scale(to: scale, duration: duration * 0.2),
                    SKAction.scale(to: 1.0, duration: duration * 0.3),
                    SKAction.wait(forDuration: duration * 0.2),
                    SKAction.fadeOut(withDuration: duration * 0.3)
                ])
            ]),
            SKAction.removeFromParent()
        ]))
    }

    enum DamageType: Equatable {
        case normal, critical, heal, miss, blocked
        case magic(color: SKColor)
    }

    // MARK: - Impact Particles

    /// Particules d'impact à la position de frappe
    static func impactBurst(at position: CGPoint, color: SKColor, in worldNode: SKNode,
                             count: Int = 8, spread: CGFloat = 25) {
        for _ in 0..<count {
            let size = CGFloat.random(in: 1.5...3.5)
            let particle = SKShapeNode(circleOfRadius: size)
            particle.fillColor = color
            particle.strokeColor = color.withAlphaComponent(0.5)
            particle.glowWidth = 2
            particle.position = position
            particle.zPosition = 300

            let angle = CGFloat.random(in: 0...(2 * .pi))
            let distance = CGFloat.random(in: 10...spread)
            let dest = CGPoint(x: position.x + cos(angle) * distance,
                               y: position.y + sin(angle) * distance)

            particle.run(SKAction.sequence([
                SKAction.group([
                    SKAction.move(to: dest, duration: 0.2),
                    SKAction.sequence([
                        SKAction.wait(forDuration: 0.1),
                        SKAction.fadeOut(withDuration: 0.15)
                    ]),
                    SKAction.scale(to: 0.2, duration: 0.25)
                ]),
                SKAction.removeFromParent()
            ]))
            worldNode.addChild(particle)
        }
    }

    // MARK: - Weapon Trail

    /// Traînée d'arme lors d'une attaque — arc de couleur
    static func weaponTrail(from origin: CGPoint, direction: CGFloat, color: SKColor,
                             in worldNode: SKNode, length: CGFloat = 35) {
        let trailCount = 5
        for i in 0..<trailCount {
            let t = CGFloat(i) / CGFloat(trailCount)
            let angle = direction - 0.4 + t * 0.8 // 0.8 rad arc
            let dist = length * (0.6 + t * 0.4)

            let segment = SKShapeNode(rectOf: CGSize(width: 3, height: 12))
            segment.fillColor = color.withAlphaComponent(0.7 - t * 0.15)
            segment.strokeColor = .clear
            segment.position = origin
            segment.zRotation = angle
            segment.zPosition = 250
            segment.alpha = 0

            worldNode.addChild(segment)

            let dest = CGPoint(x: origin.x + cos(angle) * dist,
                               y: origin.y + sin(angle) * dist)
            let delay = Double(i) * 0.02

            segment.run(SKAction.sequence([
                SKAction.wait(forDuration: delay),
                SKAction.fadeIn(withDuration: 0.03),
                SKAction.group([
                    SKAction.move(to: dest, duration: 0.1),
                    SKAction.sequence([
                        SKAction.wait(forDuration: 0.05),
                        SKAction.fadeOut(withDuration: 0.1)
                    ])
                ]),
                SKAction.removeFromParent()
            ]))
        }
    }

    // MARK: - Directional Hit Indicator

    /// Indicateur directionnel de dégâts (flèche rouge au bord de l'écran)
    static func directionalHitIndicator(from attackerPos: CGPoint, playerPos: CGPoint,
                                         on camera: SKCameraNode, screenSize: CGSize) {
        let angle = atan2(attackerPos.y - playerPos.y, attackerPos.x - playerPos.x)

        let indicator = SKShapeNode()
        let path = CGMutablePath()
        path.move(to: CGPoint(x: 0, y: 8))
        path.addLine(to: CGPoint(x: 12, y: 0))
        path.addLine(to: CGPoint(x: 0, y: -8))
        path.closeSubpath()
        indicator.path = path
        indicator.fillColor = SKColor(red: 0.9, green: 0.1, blue: 0.1, alpha: 0.7)
        indicator.strokeColor = .clear

        // Position at screen edge
        let edgeDistance: CGFloat = min(screenSize.width, screenSize.height) * 0.42
        indicator.position = CGPoint(x: cos(angle) * edgeDistance, y: sin(angle) * edgeDistance)
        indicator.zRotation = angle
        indicator.zPosition = 3500
        camera.addChild(indicator)

        indicator.run(SKAction.sequence([
            SKAction.fadeAlpha(to: 0.9, duration: 0.1),
            SKAction.wait(forDuration: 0.5),
            SKAction.fadeOut(withDuration: 0.3),
            SKAction.removeFromParent()
        ]))
    }

    // MARK: - Health Vignette (low HP warning)

    /// Bordure rouge pulsante quand le joueur a peu de PV
    static func lowHealthVignette(on camera: SKCameraNode, screenSize: CGSize) -> SKShapeNode {
        let vignette = SKShapeNode(rectOf: CGSize(width: screenSize.width + 20, height: screenSize.height + 20),
                                    cornerRadius: 0)
        vignette.fillColor = .clear
        vignette.strokeColor = SKColor(red: 0.8, green: 0.05, blue: 0.05, alpha: 0.4)
        vignette.lineWidth = 30
        vignette.zPosition = 3800
        vignette.name = "lowHPVignette"
        vignette.alpha = 0

        let pulse = SKAction.repeatForever(SKAction.sequence([
            SKAction.fadeAlpha(to: 0.6, duration: 0.8),
            SKAction.fadeAlpha(to: 0.2, duration: 0.8)
        ]))
        vignette.run(pulse)
        camera.addChild(vignette)
        return vignette
    }

    /// Met à jour la vignette selon le ratio de PV
    static func updateHealthVignette(_ vignette: SKShapeNode?, hpRatio: Double) {
        guard let vignette else { return }
        if hpRatio < 0.25 {
            vignette.alpha = CGFloat(1.0 - hpRatio * 4) * 0.6
        } else {
            vignette.alpha = 0
        }
    }

    // MARK: - Death Effect (enemy)

    /// Effet de mort spectaculaire — explosion + particules
    static func deathExplosion(at position: CGPoint, color: SKColor, in worldNode: SKNode) {
        // Flash circle
        let flash = SKShapeNode(circleOfRadius: 20)
        flash.fillColor = color.withAlphaComponent(0.4)
        flash.strokeColor = color
        flash.lineWidth = 2
        flash.glowWidth = 5
        flash.position = position
        flash.zPosition = 350
        flash.setScale(0.3)
        worldNode.addChild(flash)

        flash.run(SKAction.sequence([
            SKAction.group([
                SKAction.scale(to: 1.5, duration: 0.2),
                SKAction.fadeOut(withDuration: 0.25)
            ]),
            SKAction.removeFromParent()
        ]))

        // Debris particles
        impactBurst(at: position, color: color, in: worldNode, count: 12, spread: 35)

        // Smoke puffs
        for i in 0..<4 {
            let smoke = SKShapeNode(circleOfRadius: CGFloat.random(in: 4...8))
            smoke.fillColor = SKColor(white: 0.3, alpha: 0.4)
            smoke.strokeColor = .clear
            smoke.position = CGPoint(x: position.x + CGFloat.random(in: -10...10),
                                      y: position.y + CGFloat.random(in: -5...5))
            smoke.zPosition = 340
            worldNode.addChild(smoke)

            let delay = Double(i) * 0.05
            smoke.run(SKAction.sequence([
                SKAction.wait(forDuration: delay),
                SKAction.group([
                    SKAction.moveBy(x: CGFloat.random(in: -15...15), y: 25, duration: 0.6),
                    SKAction.scale(to: 2.0, duration: 0.6),
                    SKAction.fadeOut(withDuration: 0.5)
                ]),
                SKAction.removeFromParent()
            ]))
        }
    }

    // MARK: - Combo Visual Feedback

    /// Effet visuel de combo progressif
    static func comboFlash(count: Int, on camera: SKCameraNode) {
        let label = SKLabelNode(fontNamed: "Copperplate-Bold")
        label.text = "COMBO x\(count)"
        label.zPosition = 3500

        if count >= 10 {
            label.fontSize = 28
            label.fontColor = SKColor(red: 1.0, green: 0.3, blue: 0.1, alpha: 1.0)
        } else if count >= 5 {
            label.fontSize = 24
            label.fontColor = SKColor(red: 1.0, green: 0.6, blue: 0.1, alpha: 1.0)
        } else {
            label.fontSize = 20
            label.fontColor = SKColor(red: 0.9, green: 0.8, blue: 0.3, alpha: 1.0)
        }

        label.position = CGPoint(x: 0, y: 80)
        label.setScale(0.5)
        camera.addChild(label)

        label.run(SKAction.sequence([
            SKAction.group([
                SKAction.scale(to: 1.2, duration: 0.1),
                SKAction.fadeIn(withDuration: 0.05)
            ]),
            SKAction.scale(to: 1.0, duration: 0.1),
            SKAction.wait(forDuration: 0.8),
            SKAction.fadeOut(withDuration: 0.3),
            SKAction.removeFromParent()
        ]))
    }

    // MARK: - Level Up Celebration

    /// Célébration de montée de niveau spectaculaire
    static func levelUpCelebration(at position: CGPoint, on camera: SKCameraNode,
                                    in worldNode: SKNode, newLevel: Int) {
        // Golden pillar of light
        let pillar = SKShapeNode(rectOf: CGSize(width: 6, height: 200))
        pillar.fillColor = SKColor(red: 1.0, green: 0.85, blue: 0.2, alpha: 0.3)
        pillar.strokeColor = SKColor(red: 1.0, green: 0.9, blue: 0.4, alpha: 0.6)
        pillar.lineWidth = 1
        pillar.glowWidth = 10
        pillar.position = CGPoint(x: position.x, y: position.y + 50)
        pillar.zPosition = 400
        pillar.setScale(0.1)
        worldNode.addChild(pillar)

        pillar.run(SKAction.sequence([
            SKAction.group([
                SKAction.scaleX(to: 3.0, duration: 0.3),
                SKAction.scaleY(to: 1.0, duration: 0.3)
            ]),
            SKAction.wait(forDuration: 1.0),
            SKAction.fadeOut(withDuration: 0.5),
            SKAction.removeFromParent()
        ]))

        // Golden ring expanding
        let ring = SKShapeNode(circleOfRadius: 30)
        ring.fillColor = SKColor(red: 1.0, green: 0.85, blue: 0.2, alpha: 0.15)
        ring.strokeColor = SKColor(red: 1.0, green: 0.85, blue: 0.2, alpha: 0.8)
        ring.lineWidth = 3
        ring.position = position
        ring.zPosition = 390
        ring.setScale(0.1)
        worldNode.addChild(ring)

        ring.run(SKAction.sequence([
            SKAction.group([
                SKAction.scale(to: 2.5, duration: 0.5),
                SKAction.sequence([
                    SKAction.wait(forDuration: 0.3),
                    SKAction.fadeOut(withDuration: 0.3)
                ])
            ]),
            SKAction.removeFromParent()
        ]))

        // Golden particles spiraling upward
        for i in 0..<16 {
            let particle = SKShapeNode(circleOfRadius: CGFloat.random(in: 1.5...3))
            particle.fillColor = SKColor(red: 1.0, green: 0.85, blue: 0.2, alpha: 0.9)
            particle.strokeColor = .clear
            particle.glowWidth = 3
            particle.position = position
            particle.zPosition = 395

            let angle = CGFloat(i) * (.pi * 2 / 16)
            let spiralRadius: CGFloat = 25
            let delay = Double(i) * 0.05

            worldNode.addChild(particle)

            let path = CGMutablePath()
            path.move(to: position)
            for step in 0..<20 {
                let t = CGFloat(step) / 20.0
                let r = spiralRadius * t
                let a = angle + t * .pi * 2
                path.addLine(to: CGPoint(x: position.x + cos(a) * r,
                                          y: position.y + sin(a) * r + t * 60))
            }

            let followPath = SKAction.follow(path, asOffset: false, orientToPath: false, duration: 1.0)

            particle.run(SKAction.sequence([
                SKAction.wait(forDuration: delay),
                SKAction.group([
                    followPath,
                    SKAction.sequence([
                        SKAction.wait(forDuration: 0.6),
                        SKAction.fadeOut(withDuration: 0.4)
                    ])
                ]),
                SKAction.removeFromParent()
            ]))
        }

        // Level up text on HUD
        let levelText = SKLabelNode(fontNamed: "Copperplate-Bold")
        levelText.text = "NIVEAU \(newLevel)"
        levelText.fontSize = 30
        levelText.fontColor = SKColor(red: 1.0, green: 0.85, blue: 0.2, alpha: 1.0)
        levelText.position = CGPoint(x: 0, y: 40)
        levelText.zPosition = 4000
        levelText.setScale(0.3)
        levelText.alpha = 0
        camera.addChild(levelText)

        let subText = SKLabelNode(fontNamed: "Copperplate")
        subText.text = "Niveau supérieur !"
        subText.fontSize = 14
        subText.fontColor = SKColor(red: 0.9, green: 0.8, blue: 0.4, alpha: 1.0)
        subText.position = CGPoint(x: 0, y: -5)
        subText.zPosition = 4000
        levelText.addChild(subText)

        levelText.run(SKAction.sequence([
            SKAction.group([
                SKAction.fadeIn(withDuration: 0.2),
                SKAction.scale(to: 1.0, duration: 0.3)
            ]),
            SKAction.wait(forDuration: 2.0),
            SKAction.group([
                SKAction.fadeOut(withDuration: 0.5),
                SKAction.moveBy(x: 0, y: 30, duration: 0.5)
            ]),
            SKAction.removeFromParent()
        ]))

        // Screen shake
        screenShake(on: camera, intensity: .medium)
    }
}
