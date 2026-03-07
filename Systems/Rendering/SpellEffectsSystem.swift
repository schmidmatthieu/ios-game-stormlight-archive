import SpriteKit

/// Effets visuels des sorts et compétences par classe
final class SpellEffectsSystem {

    // MARK: - Generic Effects

    /// Projectile from player toward a target position
    static func spawnProjectile(from origin: CGPoint, toward target: CGPoint,
                                color: SKColor, in worldNode: SKNode, size: CGFloat = 6) {
        let proj = SKShapeNode(circleOfRadius: size)
        proj.fillColor = color
        proj.strokeColor = color.withAlphaComponent(0.5)
        proj.glowWidth = 4
        proj.lineWidth = 1
        proj.position = origin
        proj.zPosition = 200
        worldNode.addChild(proj)

        // Trail
        let trail = SKShapeNode(circleOfRadius: size * 0.6)
        trail.fillColor = color.withAlphaComponent(0.3)
        trail.strokeColor = .clear
        trail.zPosition = -1
        proj.addChild(trail)

        let dx = target.x - origin.x
        let dy = target.y - origin.y
        let dist = hypot(dx, dy)
        let duration = Double(dist / 300) // Speed = 300 pts/s

        proj.run(SKAction.sequence([
            SKAction.move(to: target, duration: duration),
            SKAction.group([
                SKAction.scale(to: 2.0, duration: 0.15),
                SKAction.fadeOut(withDuration: 0.15)
            ]),
            SKAction.removeFromParent()
        ]))
    }

    /// Area of effect ring expanding from center
    static func spawnAOE(at position: CGPoint, color: SKColor, radius: CGFloat,
                         in worldNode: SKNode, duration: TimeInterval = 0.5) {
        let ring = SKShapeNode(circleOfRadius: radius)
        ring.fillColor = color.withAlphaComponent(0.15)
        ring.strokeColor = color.withAlphaComponent(0.7)
        ring.lineWidth = 3
        ring.position = position
        ring.zPosition = 150
        ring.setScale(0.1)
        worldNode.addChild(ring)

        ring.run(SKAction.sequence([
            SKAction.group([
                SKAction.scale(to: 1.0, duration: duration),
                SKAction.sequence([
                    SKAction.wait(forDuration: duration * 0.6),
                    SKAction.fadeOut(withDuration: duration * 0.4)
                ])
            ]),
            SKAction.removeFromParent()
        ]))
    }

    /// Buff aura around a character
    static func spawnBuffAura(on node: SKNode, color: SKColor, duration: TimeInterval = 3.0) {
        let aura = SKShapeNode(circleOfRadius: 18)
        aura.fillColor = color.withAlphaComponent(0.1)
        aura.strokeColor = color.withAlphaComponent(0.4)
        aura.lineWidth = 2
        aura.position = CGPoint(x: 0, y: 12)
        aura.zPosition = -0.5
        aura.name = "buffAura"
        node.addChild(aura)

        let pulse = SKAction.repeatForever(SKAction.sequence([
            SKAction.scale(to: 1.2, duration: 0.6),
            SKAction.scale(to: 0.9, duration: 0.6)
        ]))
        aura.run(pulse)

        aura.run(SKAction.sequence([
            SKAction.wait(forDuration: duration),
            SKAction.fadeOut(withDuration: 0.3),
            SKAction.removeFromParent()
        ]))
    }

    /// Shield visual (circle around character)
    static func spawnShield(on node: SKNode, color: SKColor, duration: TimeInterval = 4.0) {
        let shield = SKShapeNode(circleOfRadius: 22)
        shield.fillColor = color.withAlphaComponent(0.08)
        shield.strokeColor = color.withAlphaComponent(0.6)
        shield.lineWidth = 2
        shield.position = CGPoint(x: 0, y: 12)
        shield.zPosition = 50
        shield.name = "shield"
        node.addChild(shield)

        let shimmer = SKAction.repeatForever(SKAction.sequence([
            SKAction.run { shield.glowWidth = 5 },
            SKAction.wait(forDuration: 0.5),
            SKAction.run { shield.glowWidth = 1 },
            SKAction.wait(forDuration: 0.5)
        ]))
        shield.run(shimmer)

        shield.run(SKAction.sequence([
            SKAction.wait(forDuration: duration),
            SKAction.fadeOut(withDuration: 0.5),
            SKAction.removeFromParent()
        ]))
    }

    // MARK: - Class-Specific Effects

    // --- Mistborn (Allomancy) ---

    /// Steel Push — blue force wave outward
    static func steelPush(from playerPos: CGPoint, in worldNode: SKNode) {
        let color = SKColor(red: 0.3, green: 0.5, blue: 0.8, alpha: 1)
        // Multiple metal lines radiating outward
        for i in 0..<6 {
            let angle = CGFloat(i) * (.pi / 3) + CGFloat.random(in: -0.2...0.2)
            let line = SKShapeNode(rectOf: CGSize(width: 2, height: 30))
            line.fillColor = color.withAlphaComponent(0.7)
            line.strokeColor = .clear
            line.position = playerPos
            line.zRotation = angle
            line.zPosition = 200
            worldNode.addChild(line)

            let target = CGPoint(x: playerPos.x + cos(angle) * 60, y: playerPos.y + sin(angle) * 60)
            line.run(SKAction.sequence([
                SKAction.move(to: target, duration: 0.2),
                SKAction.fadeOut(withDuration: 0.1),
                SKAction.removeFromParent()
            ]))
        }
        spawnAOE(at: playerPos, color: color, radius: 50, in: worldNode, duration: 0.3)
    }

    /// Iron Pull — red tendrils inward
    static func ironPull(at playerPos: CGPoint, in worldNode: SKNode) {
        let color = SKColor(red: 0.6, green: 0.3, blue: 0.3, alpha: 1)
        for i in 0..<6 {
            let angle = CGFloat(i) * (.pi / 3)
            let startPos = CGPoint(x: playerPos.x + cos(angle) * 60, y: playerPos.y + sin(angle) * 60)
            let line = SKShapeNode(rectOf: CGSize(width: 2, height: 20))
            line.fillColor = color.withAlphaComponent(0.6)
            line.strokeColor = .clear
            line.position = startPos
            line.zRotation = angle + .pi
            line.zPosition = 200
            worldNode.addChild(line)

            line.run(SKAction.sequence([
                SKAction.move(to: playerPos, duration: 0.25),
                SKAction.fadeOut(withDuration: 0.1),
                SKAction.removeFromParent()
            ]))
        }
    }

    /// Pewter flare — orange body buff glow
    static func pewterFlare(on playerNode: SKNode) {
        spawnBuffAura(on: playerNode, color: SKColor(red: 0.8, green: 0.5, blue: 0.2, alpha: 1), duration: 5.0)
    }

    /// Tin — enhanced vision flash
    static func tinEnhance(on playerNode: SKNode, in worldNode: SKNode) {
        let flash = SKShapeNode(circleOfRadius: 80)
        flash.fillColor = SKColor(red: 0.8, green: 0.8, blue: 1.0, alpha: 0.1)
        flash.strokeColor = SKColor(red: 0.7, green: 0.7, blue: 0.9, alpha: 0.3)
        flash.lineWidth = 1
        flash.position = playerNode.position
        flash.zPosition = 100
        flash.setScale(0.1)
        worldNode.addChild(flash)

        flash.run(SKAction.sequence([
            SKAction.scale(to: 1.0, duration: 0.3),
            SKAction.wait(forDuration: 0.5),
            SKAction.fadeOut(withDuration: 0.3),
            SKAction.removeFromParent()
        ]))
    }

    // --- Radiant (Surgebinding) ---

    /// Lashing — cyan gravity distortion
    static func gravitationLash(from playerPos: CGPoint, in worldNode: SKNode) {
        let color = SKColor(red: 0.2, green: 0.7, blue: 1.0, alpha: 1)
        // Spiral particles rising
        for i in 0..<8 {
            let particle = SKShapeNode(circleOfRadius: 2)
            particle.fillColor = color.withAlphaComponent(0.8)
            particle.strokeColor = .clear
            particle.position = CGPoint(
                x: playerPos.x + CGFloat.random(in: -20...20),
                y: playerPos.y - 10
            )
            particle.zPosition = 200
            worldNode.addChild(particle)

            particle.run(SKAction.sequence([
                SKAction.group([
                    SKAction.moveBy(x: CGFloat.random(in: -10...10), y: 60, duration: 0.5 + Double(i) * 0.05),
                    SKAction.fadeOut(withDuration: 0.5),
                    SKAction.scale(to: 0.3, duration: 0.5)
                ]),
                SKAction.removeFromParent()
            ]))
        }
    }

    /// Adhesion — sticky ground effect
    static func adhesionField(at position: CGPoint, in worldNode: SKNode) {
        let color = SKColor(red: 0.3, green: 0.7, blue: 0.8, alpha: 1)
        spawnAOE(at: position, color: color, radius: 40, in: worldNode, duration: 0.6)
    }

    /// Progression — healing vines
    static func progressionHeal(on playerNode: SKNode, in worldNode: SKNode) {
        let color = SKColor(red: 0.2, green: 0.8, blue: 0.3, alpha: 1)
        for i in 0..<5 {
            let vine = SKShapeNode(rectOf: CGSize(width: 2, height: 12))
            vine.fillColor = color.withAlphaComponent(0.7)
            vine.strokeColor = .clear
            vine.position = CGPoint(
                x: playerNode.position.x + CGFloat(i - 2) * 6,
                y: playerNode.position.y - 5
            )
            vine.zPosition = 190
            worldNode.addChild(vine)

            vine.run(SKAction.sequence([
                SKAction.moveBy(x: 0, y: 20, duration: 0.4),
                SKAction.fadeOut(withDuration: 0.3),
                SKAction.removeFromParent()
            ]))
        }
        spawnBuffAura(on: playerNode, color: color, duration: 2.0)
    }

    // --- Awakener ---

    /// Animate object — color drain effect + ribbon swirl
    static func awakeningAnimate(at position: CGPoint, in worldNode: SKNode) {
        let color = SKColor(red: 0.8, green: 0.3, blue: 0.6, alpha: 1)
        // Colorful ribbons
        for i in 0..<4 {
            let ribbon = SKShapeNode(rectOf: CGSize(width: 3, height: 15))
            let hue = CGFloat(i) * 0.25
            ribbon.fillColor = SKColor(hue: hue, saturation: 0.9, brightness: 0.9, alpha: 0.7)
            ribbon.strokeColor = .clear
            ribbon.position = position
            ribbon.zPosition = 200
            worldNode.addChild(ribbon)

            let angle = CGFloat(i) * (.pi / 2)
            let target = CGPoint(x: position.x + cos(angle) * 30, y: position.y + sin(angle) * 30)
            ribbon.run(SKAction.sequence([
                SKAction.group([
                    SKAction.move(to: target, duration: 0.3),
                    SKAction.rotate(byAngle: .pi, duration: 0.3),
                    SKAction.fadeOut(withDuration: 0.3)
                ]),
                SKAction.removeFromParent()
            ]))
        }
    }

    // --- Elantrian (AonDor) ---

    /// Aon drawing — glowing glyph appears
    static func drawAon(at position: CGPoint, color: SKColor, in worldNode: SKNode) {
        // Outer circle
        let outer = SKShapeNode(circleOfRadius: 25)
        outer.fillColor = .clear
        outer.strokeColor = color.withAlphaComponent(0.8)
        outer.lineWidth = 2
        outer.position = position
        outer.zPosition = 200
        outer.setScale(0)
        worldNode.addChild(outer)

        // Inner cross
        let cross1 = SKShapeNode(rectOf: CGSize(width: 2, height: 30))
        cross1.fillColor = color.withAlphaComponent(0.6)
        cross1.strokeColor = .clear
        cross1.zPosition = 201
        outer.addChild(cross1)

        let cross2 = SKShapeNode(rectOf: CGSize(width: 30, height: 2))
        cross2.fillColor = color.withAlphaComponent(0.6)
        cross2.strokeColor = .clear
        cross2.zPosition = 201
        outer.addChild(cross2)

        outer.run(SKAction.sequence([
            SKAction.scale(to: 1.0, duration: 0.3),
            SKAction.wait(forDuration: 0.5),
            SKAction.group([
                SKAction.scale(to: 1.5, duration: 0.3),
                SKAction.fadeOut(withDuration: 0.3)
            ]),
            SKAction.removeFromParent()
        ]))
    }

    // --- Sand Master ---

    /// Sand whip
    static func sandWhip(from origin: CGPoint, toward angle: CGFloat, in worldNode: SKNode) {
        let color = SKColor(red: 0.8, green: 0.7, blue: 0.4, alpha: 1)
        for i in 0..<6 {
            let grain = SKShapeNode(circleOfRadius: 1.5)
            grain.fillColor = color.withAlphaComponent(0.8)
            grain.strokeColor = .clear
            grain.position = origin
            grain.zPosition = 200
            worldNode.addChild(grain)

            let dist = 15.0 + Double(i) * 8
            let spread = CGFloat.random(in: -0.2...0.2)
            let target = CGPoint(
                x: origin.x + cos(angle + spread) * CGFloat(dist),
                y: origin.y + sin(angle + spread) * CGFloat(dist)
            )
            grain.run(SKAction.sequence([
                SKAction.move(to: target, duration: 0.15 + Double(i) * 0.03),
                SKAction.fadeOut(withDuration: 0.2),
                SKAction.removeFromParent()
            ]))
        }
    }

    /// Sand shield
    static func sandShield(on playerNode: SKNode) {
        spawnShield(on: playerNode, color: SKColor(red: 0.8, green: 0.7, blue: 0.4, alpha: 1), duration: 4.0)
    }

    // --- Nightmare Painter ---

    /// Ink slash
    static func inkSlash(from origin: CGPoint, in worldNode: SKNode) {
        let color = SKColor(red: 0.1, green: 0.05, blue: 0.15, alpha: 1)
        let slash = SKShapeNode(rectOf: CGSize(width: 40, height: 4))
        slash.fillColor = color
        slash.strokeColor = SKColor(red: 0.3, green: 0.1, blue: 0.4, alpha: 0.6)
        slash.lineWidth = 1
        slash.position = CGPoint(x: origin.x + 20, y: origin.y + 12)
        slash.zPosition = 200
        slash.zRotation = CGFloat.random(in: -0.3...0.3)
        worldNode.addChild(slash)

        slash.run(SKAction.sequence([
            SKAction.group([
                SKAction.scaleX(to: 1.5, duration: 0.15),
                SKAction.fadeOut(withDuration: 0.3)
            ]),
            SKAction.removeFromParent()
        ]))
    }

    /// Nightmare capture — dark tendrils
    static func nightmareCapture(at position: CGPoint, in worldNode: SKNode) {
        let color = SKColor(red: 0.2, green: 0.05, blue: 0.3, alpha: 1)
        for i in 0..<6 {
            let tendril = SKShapeNode(rectOf: CGSize(width: 2, height: 20))
            tendril.fillColor = color.withAlphaComponent(0.7)
            tendril.strokeColor = .clear
            tendril.position = CGPoint(
                x: position.x + CGFloat.random(in: -25...25),
                y: position.y + CGFloat.random(in: -15...15)
            )
            tendril.zRotation = CGFloat.random(in: -.pi...(.pi))
            tendril.zPosition = 190
            tendril.setScale(0.3)
            worldNode.addChild(tendril)

            tendril.run(SKAction.sequence([
                SKAction.group([
                    SKAction.scale(to: 1.0, duration: 0.2 + Double(i) * 0.05),
                    SKAction.move(to: position, duration: 0.3)
                ]),
                SKAction.fadeOut(withDuration: 0.2),
                SKAction.removeFromParent()
            ]))
        }
    }

    // MARK: - Weather Cleanup

    /// Remove all running actions from a weather emitter before removing from parent
    static func cleanupWeatherEmitter(_ emitter: SKNode) {
        emitter.removeAllActions()
        emitter.children.forEach { child in
            child.removeAllActions()
        }
        emitter.removeFromParent()
    }

    // MARK: - Weather Particles

    static func createWeatherEmitter(effect: WeatherEffect, sceneSize: CGSize) -> SKNode? {
        let container = SKNode()
        container.zPosition = 900

        switch effect {
        case .ashfall:
            return createParticleFall(
                count: 30, color: SKColor(white: 0.4, alpha: 0.6),
                sizeRange: 1...3, speedRange: 20...50, sceneSize: sceneSize
            )
        case .mist:
            let fog = SKShapeNode(rectOf: CGSize(width: sceneSize.width * 2, height: sceneSize.height * 2))
            fog.fillColor = SKColor(white: 0.6, alpha: 0.08)
            fog.strokeColor = .clear
            fog.zPosition = 900
            let drift = SKAction.repeatForever(SKAction.sequence([
                SKAction.moveBy(x: 20, y: 5, duration: 4.0),
                SKAction.moveBy(x: -20, y: -5, duration: 4.0)
            ]))
            fog.run(drift)
            return fog
        case .rain:
            return createParticleFall(
                count: 40, color: SKColor(red: 0.4, green: 0.5, blue: 0.7, alpha: 0.5),
                sizeRange: 1...1, speedRange: 80...140, sceneSize: sceneSize
            )
        case .sandstorm:
            return createParticleFall(
                count: 25, color: SKColor(red: 0.7, green: 0.6, blue: 0.3, alpha: 0.5),
                sizeRange: 2...4, speedRange: 40...80, sceneSize: sceneSize,
                horizontal: true
            )
        case .colorDrain:
            let overlay = SKShapeNode(rectOf: CGSize(width: sceneSize.width * 2, height: sceneSize.height * 2))
            overlay.fillColor = SKColor(white: 0.5, alpha: 0.05)
            overlay.strokeColor = .clear
            overlay.zPosition = 900
            let pulse = SKAction.repeatForever(SKAction.sequence([
                SKAction.fadeAlpha(to: 0.08, duration: 3.0),
                SKAction.fadeAlpha(to: 0.02, duration: 3.0)
            ]))
            overlay.run(pulse)
            return overlay
        case .hionFlicker:
            return createParticleFall(
                count: 15, color: SKColor(red: 0.7, green: 0.3, blue: 0.5, alpha: 0.6),
                sizeRange: 1...2, speedRange: 10...30, sceneSize: sceneSize
            )
        case .aonGlow:
            let glow = SKShapeNode(rectOf: CGSize(width: sceneSize.width * 2, height: sceneSize.height * 2))
            glow.fillColor = SKColor(red: 0.8, green: 0.7, blue: 0.3, alpha: 0.03)
            glow.strokeColor = .clear
            glow.zPosition = 900
            let shimmer = SKAction.repeatForever(SKAction.sequence([
                SKAction.fadeAlpha(to: 0.06, duration: 2.0),
                SKAction.fadeAlpha(to: 0.01, duration: 2.0)
            ]))
            glow.run(shimmer)
            return glow
        default:
            return nil
        }
    }

    private static func createParticleFall(count: Int, color: SKColor, sizeRange: ClosedRange<CGFloat>,
                                            speedRange: ClosedRange<CGFloat>, sceneSize: CGSize,
                                            horizontal: Bool = false) -> SKNode {
        let container = SKNode()
        container.zPosition = 900

        for _ in 0..<count {
            let size = CGFloat.random(in: sizeRange)
            let particle = SKShapeNode(circleOfRadius: size)
            particle.fillColor = color
            particle.strokeColor = .clear

            let startX = CGFloat.random(in: -sceneSize.width...sceneSize.width)
            let startY = CGFloat.random(in: -sceneSize.height...sceneSize.height)
            particle.position = CGPoint(x: startX, y: startY)

            let speed = CGFloat.random(in: speedRange)
            let moveX: CGFloat = horizontal ? speed : CGFloat.random(in: -10...10)
            let moveY: CGFloat = horizontal ? CGFloat.random(in: -10...10) : -speed
            let duration = Double.random(in: 2.0...5.0)

            let fall = SKAction.repeatForever(SKAction.sequence([
                SKAction.moveBy(x: moveX, y: moveY, duration: duration),
                SKAction.run {
                    particle.position = CGPoint(
                        x: CGFloat.random(in: -sceneSize.width...sceneSize.width),
                        y: horizontal ? CGFloat.random(in: -sceneSize.height...sceneSize.height) : sceneSize.height / 2
                    )
                }
            ]))
            particle.run(fall)
            container.addChild(particle)
        }
        return container
    }
}
