import SpriteKit

/// Effets visuels des sorts et compétences par classe — effets enrichis avec
/// cercles magiques, traînées de projectiles, impacts, et particules thématiques
final class SpellEffectsSystem {

    // MARK: - Generic Effects

    /// Projectile amélioré avec traînée et impact
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

        // Inner glow core
        let core = SKShapeNode(circleOfRadius: size * 0.4)
        core.fillColor = .white
        core.strokeColor = .clear
        core.alpha = 0.7
        core.zPosition = 1
        proj.addChild(core)

        // Pulsing trail
        let trail = SKShapeNode(circleOfRadius: size * 0.8)
        trail.fillColor = color.withAlphaComponent(0.3)
        trail.strokeColor = .clear
        trail.zPosition = -1
        proj.addChild(trail)

        let trailPulse = SKAction.repeatForever(SKAction.sequence([
            SKAction.scale(to: 1.4, duration: 0.15),
            SKAction.scale(to: 0.8, duration: 0.15)
        ]))
        trail.run(trailPulse)

        let dx = target.x - origin.x
        let dy = target.y - origin.y
        let dist = hypot(dx, dy)
        let duration = Double(dist / 350)

        // Spawn trail particles along path
        let spawnTrail = SKAction.repeatForever(SKAction.sequence([
            SKAction.run {
                let p = SKShapeNode(circleOfRadius: size * 0.3)
                p.fillColor = color.withAlphaComponent(0.5)
                p.strokeColor = .clear
                p.position = proj.position
                p.zPosition = 195
                worldNode.addChild(p)
                p.run(SKAction.sequence([
                    SKAction.group([
                        SKAction.scale(to: 0.1, duration: 0.3),
                        SKAction.fadeOut(withDuration: 0.3)
                    ]),
                    SKAction.removeFromParent()
                ]))
            },
            SKAction.wait(forDuration: 0.05)
        ]))
        proj.run(spawnTrail, withKey: "trail")

        proj.run(SKAction.sequence([
            SKAction.move(to: target, duration: duration),
            SKAction.run { proj.removeAction(forKey: "trail") },
            SKAction.run {
                // Impact effect
                CombatFeedbackSystem.impactBurst(at: target, color: color, in: worldNode, count: 6, spread: 20)
            },
            SKAction.group([
                SKAction.scale(to: 2.5, duration: 0.12),
                SKAction.fadeOut(withDuration: 0.12)
            ]),
            SKAction.removeFromParent()
        ]))
    }

    /// Area of effect amélioré — double anneau + particules
    static func spawnAOE(at position: CGPoint, color: SKColor, radius: CGFloat,
                         in worldNode: SKNode, duration: TimeInterval = 0.5) {
        // Outer ring
        let ring = SKShapeNode(circleOfRadius: radius)
        ring.fillColor = color.withAlphaComponent(0.12)
        ring.strokeColor = color.withAlphaComponent(0.7)
        ring.lineWidth = 3
        ring.position = position
        ring.zPosition = 150
        ring.setScale(0.1)
        worldNode.addChild(ring)

        // Inner ring delayed
        let innerRing = SKShapeNode(circleOfRadius: radius * 0.6)
        innerRing.fillColor = .clear
        innerRing.strokeColor = color.withAlphaComponent(0.5)
        innerRing.lineWidth = 1.5
        innerRing.position = position
        innerRing.zPosition = 151
        innerRing.setScale(0.1)
        innerRing.alpha = 0
        worldNode.addChild(innerRing)

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

        innerRing.run(SKAction.sequence([
            SKAction.wait(forDuration: duration * 0.1),
            SKAction.fadeIn(withDuration: 0.05),
            SKAction.group([
                SKAction.scale(to: 1.0, duration: duration * 0.8),
                SKAction.sequence([
                    SKAction.wait(forDuration: duration * 0.5),
                    SKAction.fadeOut(withDuration: duration * 0.3)
                ])
            ]),
            SKAction.removeFromParent()
        ]))

        // Ground particles
        for _ in 0..<6 {
            let p = SKShapeNode(circleOfRadius: CGFloat.random(in: 1...2.5))
            p.fillColor = color.withAlphaComponent(0.6)
            p.strokeColor = .clear
            let angle = CGFloat.random(in: 0...(2 * .pi))
            let dist = CGFloat.random(in: 0...radius * 0.8)
            p.position = position
            p.zPosition = 152
            p.alpha = 0
            worldNode.addChild(p)

            let dest = CGPoint(x: position.x + cos(angle) * dist,
                               y: position.y + sin(angle) * dist)
            p.run(SKAction.sequence([
                SKAction.wait(forDuration: Double.random(in: 0...duration * 0.3)),
                SKAction.fadeIn(withDuration: 0.05),
                SKAction.move(to: dest, duration: duration * 0.5),
                SKAction.fadeOut(withDuration: duration * 0.3),
                SKAction.removeFromParent()
            ]))
        }
    }

    /// Cercle magique au sol avant le lancement du sort
    static func spawnCastingCircle(at position: CGPoint, color: SKColor,
                                    in worldNode: SKNode, duration: TimeInterval = 0.6) {
        let container = SKNode()
        container.position = position
        container.zPosition = 140
        container.setScale(0.1)
        container.alpha = 0
        worldNode.addChild(container)

        // Outer circle
        let outer = SKShapeNode(circleOfRadius: 22)
        outer.fillColor = .clear
        outer.strokeColor = color.withAlphaComponent(0.7)
        outer.lineWidth = 1.5
        container.addChild(outer)

        // Inner circle
        let inner = SKShapeNode(circleOfRadius: 14)
        inner.fillColor = color.withAlphaComponent(0.06)
        inner.strokeColor = color.withAlphaComponent(0.4)
        inner.lineWidth = 1
        container.addChild(inner)

        // Cross lines
        for i in 0..<4 {
            let angle = CGFloat(i) * (.pi / 4)
            let line = SKShapeNode(rectOf: CGSize(width: 1, height: 44))
            line.fillColor = color.withAlphaComponent(0.3)
            line.strokeColor = .clear
            line.zRotation = angle
            container.addChild(line)
        }

        // Rune dots around circle
        for i in 0..<8 {
            let angle = CGFloat(i) * (.pi / 4)
            let dot = SKShapeNode(circleOfRadius: 1.5)
            dot.fillColor = color.withAlphaComponent(0.8)
            dot.strokeColor = .clear
            dot.position = CGPoint(x: cos(angle) * 18, y: sin(angle) * 18)
            container.addChild(dot)
        }

        // Animate
        container.run(SKAction.sequence([
            SKAction.group([
                SKAction.fadeIn(withDuration: 0.1),
                SKAction.scale(to: 1.0, duration: 0.2)
            ]),
            SKAction.rotate(byAngle: .pi / 4, duration: duration * 0.6),
            SKAction.group([
                SKAction.scale(to: 1.3, duration: duration * 0.3),
                SKAction.fadeOut(withDuration: duration * 0.3)
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

        // Inner rotating particles
        for i in 0..<4 {
            let p = SKShapeNode(circleOfRadius: 1.5)
            p.fillColor = color.withAlphaComponent(0.7)
            p.strokeColor = .clear
            p.zPosition = 0.1
            let angle = CGFloat(i) * (.pi / 2)
            p.position = CGPoint(x: cos(angle) * 12, y: sin(angle) * 12)
            aura.addChild(p)
        }

        let pulse = SKAction.repeatForever(SKAction.sequence([
            SKAction.scale(to: 1.2, duration: 0.6),
            SKAction.scale(to: 0.9, duration: 0.6)
        ]))
        aura.run(pulse)

        let rotate = SKAction.repeatForever(SKAction.rotate(byAngle: .pi * 2, duration: 3.0))
        aura.run(rotate)

        aura.run(SKAction.sequence([
            SKAction.wait(forDuration: duration),
            SKAction.fadeOut(withDuration: 0.3),
            SKAction.removeFromParent()
        ]))
    }

    /// Shield visual amélioré — hexagonal shimmer
    static func spawnShield(on node: SKNode, color: SKColor, duration: TimeInterval = 4.0) {
        let shield = SKShapeNode(circleOfRadius: 22)
        shield.fillColor = color.withAlphaComponent(0.06)
        shield.strokeColor = color.withAlphaComponent(0.6)
        shield.lineWidth = 2
        shield.position = CGPoint(x: 0, y: 12)
        shield.zPosition = 50
        shield.name = "shield"
        node.addChild(shield)

        // Hex pattern overlay
        for i in 0..<6 {
            let angle = CGFloat(i) * (.pi / 3)
            let hexLine = SKShapeNode(rectOf: CGSize(width: 1, height: 10))
            hexLine.fillColor = color.withAlphaComponent(0.2)
            hexLine.strokeColor = .clear
            hexLine.position = CGPoint(x: cos(angle) * 16, y: sin(angle) * 16)
            hexLine.zRotation = angle
            shield.addChild(hexLine)
        }

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

    /// Steel Push — blue metallic shards radiating outward with casting circle
    static func steelPush(from playerPos: CGPoint, in worldNode: SKNode) {
        let color = SKColor(red: 0.3, green: 0.5, blue: 0.8, alpha: 1)
        spawnCastingCircle(at: playerPos, color: color, in: worldNode, duration: 0.3)

        // Metallic shard projectiles
        for i in 0..<8 {
            let angle = CGFloat(i) * (.pi / 4) + CGFloat.random(in: -0.15...0.15)

            // Shard shape (elongated diamond)
            let shard = SKShapeNode()
            let path = CGMutablePath()
            path.move(to: CGPoint(x: 0, y: 6))
            path.addLine(to: CGPoint(x: 2, y: 0))
            path.addLine(to: CGPoint(x: 0, y: -6))
            path.addLine(to: CGPoint(x: -2, y: 0))
            path.closeSubpath()
            shard.path = path
            shard.fillColor = SKColor(red: 0.5, green: 0.6, blue: 0.9, alpha: 0.8)
            shard.strokeColor = color
            shard.lineWidth = 0.5
            shard.glowWidth = 2
            shard.position = playerPos
            shard.zRotation = angle
            shard.zPosition = 200
            worldNode.addChild(shard)

            let dist: CGFloat = 55 + CGFloat.random(in: 0...15)
            let target = CGPoint(x: playerPos.x + cos(angle) * dist,
                                 y: playerPos.y + sin(angle) * dist)
            shard.run(SKAction.sequence([
                SKAction.move(to: target, duration: 0.18),
                SKAction.group([
                    SKAction.fadeOut(withDuration: 0.1),
                    SKAction.scale(to: 0.3, duration: 0.1)
                ]),
                SKAction.removeFromParent()
            ]))
        }

        // Blue lines (metal lines connecting to metals)
        for i in 0..<4 {
            let angle = CGFloat(i) * (.pi / 2) + CGFloat.random(in: -0.3...0.3)
            let line = SKShapeNode(rectOf: CGSize(width: 1.5, height: 40))
            line.fillColor = color.withAlphaComponent(0.5)
            line.strokeColor = .clear
            line.position = playerPos
            line.zRotation = angle
            line.zPosition = 195
            line.alpha = 0.8
            worldNode.addChild(line)

            let target = CGPoint(x: playerPos.x + cos(angle) * 70,
                                 y: playerPos.y + sin(angle) * 70)
            line.run(SKAction.sequence([
                SKAction.move(to: target, duration: 0.15),
                SKAction.fadeOut(withDuration: 0.1),
                SKAction.removeFromParent()
            ]))
        }

        spawnAOE(at: playerPos, color: color, radius: 50, in: worldNode, duration: 0.3)
    }

    /// Iron Pull — red metallic tendrils pulling inward with magnetic particles
    static func ironPull(at playerPos: CGPoint, in worldNode: SKNode) {
        let color = SKColor(red: 0.7, green: 0.3, blue: 0.3, alpha: 1)

        // Magnetic field lines converging
        for i in 0..<8 {
            let angle = CGFloat(i) * (.pi / 4) + CGFloat.random(in: -0.1...0.1)
            let startDist: CGFloat = 65
            let startPos = CGPoint(x: playerPos.x + cos(angle) * startDist,
                                    y: playerPos.y + sin(angle) * startDist)

            // Metal fragment
            let fragment = SKShapeNode(rectOf: CGSize(width: 3, height: 5))
            fragment.fillColor = SKColor(red: 0.6, green: 0.4, blue: 0.4, alpha: 0.8)
            fragment.strokeColor = color.withAlphaComponent(0.5)
            fragment.lineWidth = 0.5
            fragment.position = startPos
            fragment.zRotation = angle + .pi
            fragment.zPosition = 200
            worldNode.addChild(fragment)

            fragment.run(SKAction.sequence([
                SKAction.group([
                    SKAction.move(to: playerPos, duration: 0.25),
                    SKAction.rotate(byAngle: .pi, duration: 0.25)
                ]),
                SKAction.group([
                    SKAction.fadeOut(withDuration: 0.05),
                    SKAction.scale(to: 0.3, duration: 0.05)
                ]),
                SKAction.removeFromParent()
            ]))

            // Red connecting line
            let line = SKShapeNode(rectOf: CGSize(width: 1, height: 25))
            line.fillColor = color.withAlphaComponent(0.4)
            line.strokeColor = .clear
            line.position = startPos
            line.zRotation = angle + .pi
            line.zPosition = 195
            worldNode.addChild(line)

            line.run(SKAction.sequence([
                SKAction.move(to: playerPos, duration: 0.2),
                SKAction.fadeOut(withDuration: 0.1),
                SKAction.removeFromParent()
            ]))
        }

        // Central absorption flash
        let flash = SKShapeNode(circleOfRadius: 8)
        flash.fillColor = color.withAlphaComponent(0.3)
        flash.strokeColor = color
        flash.lineWidth = 1
        flash.glowWidth = 4
        flash.position = playerPos
        flash.zPosition = 205
        flash.setScale(0.5)
        worldNode.addChild(flash)

        flash.run(SKAction.sequence([
            SKAction.wait(forDuration: 0.2),
            SKAction.group([
                SKAction.scale(to: 1.5, duration: 0.15),
                SKAction.fadeOut(withDuration: 0.15)
            ]),
            SKAction.removeFromParent()
        ]))
    }

    /// Pewter flare — orange body buff with muscle glow and sparks
    static func pewterFlare(on playerNode: SKNode) {
        let color = SKColor(red: 0.8, green: 0.5, blue: 0.2, alpha: 1)
        spawnBuffAura(on: playerNode, color: color, duration: 5.0)

        // Initial burst of sparks
        for _ in 0..<6 {
            let spark = SKShapeNode(circleOfRadius: 1.5)
            spark.fillColor = SKColor(red: 1.0, green: 0.7, blue: 0.3, alpha: 0.9)
            spark.strokeColor = .clear
            spark.glowWidth = 2
            spark.position = CGPoint(x: CGFloat.random(in: -8...8), y: CGFloat.random(in: 5...20))
            spark.zPosition = 5
            playerNode.addChild(spark)

            spark.run(SKAction.sequence([
                SKAction.group([
                    SKAction.moveBy(x: CGFloat.random(in: -15...15), y: CGFloat.random(in: 10...25), duration: 0.4),
                    SKAction.fadeOut(withDuration: 0.35)
                ]),
                SKAction.removeFromParent()
            ]))
        }
    }

    /// Tin — enhanced vision flash with expanding detection ring
    static func tinEnhance(on playerNode: SKNode, in worldNode: SKNode) {
        let color = SKColor(red: 0.8, green: 0.8, blue: 1.0, alpha: 1)

        // Bright flash
        let flash = SKShapeNode(circleOfRadius: 15)
        flash.fillColor = .white
        flash.strokeColor = .clear
        flash.alpha = 0.4
        flash.position = playerNode.position
        flash.zPosition = 210
        worldNode.addChild(flash)
        flash.run(SKAction.sequence([
            SKAction.fadeOut(withDuration: 0.15),
            SKAction.removeFromParent()
        ]))

        // Expanding detection ring
        let ring = SKShapeNode(circleOfRadius: 80)
        ring.fillColor = color.withAlphaComponent(0.05)
        ring.strokeColor = color.withAlphaComponent(0.3)
        ring.lineWidth = 1.5
        ring.position = playerNode.position
        ring.zPosition = 100
        ring.setScale(0.1)
        worldNode.addChild(ring)

        ring.run(SKAction.sequence([
            SKAction.scale(to: 1.0, duration: 0.4),
            SKAction.wait(forDuration: 0.3),
            SKAction.fadeOut(withDuration: 0.3),
            SKAction.removeFromParent()
        ]))

        // Eye glow on player
        let eyeGlow = SKShapeNode(circleOfRadius: 3)
        eyeGlow.fillColor = SKColor(red: 0.7, green: 0.8, blue: 1.0, alpha: 0.6)
        eyeGlow.strokeColor = .clear
        eyeGlow.glowWidth = 4
        eyeGlow.position = CGPoint(x: 0, y: 22)
        eyeGlow.zPosition = 10
        playerNode.addChild(eyeGlow)
        eyeGlow.run(SKAction.sequence([
            SKAction.wait(forDuration: 2.0),
            SKAction.fadeOut(withDuration: 0.5),
            SKAction.removeFromParent()
        ]))
    }

    // --- Radiant (Surgebinding) ---

    /// Lashing — cyan gravity distortion with stormlight wisps
    static func gravitationLash(from playerPos: CGPoint, in worldNode: SKNode) {
        let color = SKColor(red: 0.2, green: 0.7, blue: 1.0, alpha: 1)
        spawnCastingCircle(at: playerPos, color: color, in: worldNode, duration: 0.4)

        // Stormlight wisps spiraling upward
        for i in 0..<12 {
            let particle = SKShapeNode(circleOfRadius: CGFloat.random(in: 1.5...3))
            particle.fillColor = color.withAlphaComponent(0.8)
            particle.strokeColor = .clear
            particle.glowWidth = 3
            particle.position = CGPoint(
                x: playerPos.x + CGFloat.random(in: -18...18),
                y: playerPos.y - 5
            )
            particle.zPosition = 200
            worldNode.addChild(particle)

            let spiralAngle = CGFloat(i) * (.pi / 6)
            let riseDuration = 0.4 + Double(i) * 0.04
            particle.run(SKAction.sequence([
                SKAction.group([
                    SKAction.moveBy(x: cos(spiralAngle) * 15, y: 55 + CGFloat.random(in: 0...15),
                                     duration: riseDuration),
                    SKAction.fadeOut(withDuration: riseDuration * 0.8),
                    SKAction.scale(to: 0.2, duration: riseDuration)
                ]),
                SKAction.removeFromParent()
            ]))
        }

        // Gravity distortion ring
        let distortion = SKShapeNode(circleOfRadius: 35)
        distortion.fillColor = color.withAlphaComponent(0.08)
        distortion.strokeColor = color.withAlphaComponent(0.3)
        distortion.lineWidth = 1
        distortion.position = playerPos
        distortion.zPosition = 190
        worldNode.addChild(distortion)

        distortion.run(SKAction.sequence([
            SKAction.group([
                SKAction.scale(to: 1.5, duration: 0.4),
                SKAction.fadeOut(withDuration: 0.5)
            ]),
            SKAction.removeFromParent()
        ]))
    }

    /// Adhesion — sticky glowing ground effect with tendril web
    static func adhesionField(at position: CGPoint, in worldNode: SKNode) {
        let color = SKColor(red: 0.3, green: 0.7, blue: 0.8, alpha: 1)

        // Sticky web pattern on ground
        for i in 0..<6 {
            let angle = CGFloat(i) * (.pi / 3)
            let line = SKShapeNode(rectOf: CGSize(width: 1.5, height: CGFloat.random(in: 15...30)))
            line.fillColor = color.withAlphaComponent(0.5)
            line.strokeColor = .clear
            line.position = position
            line.zRotation = angle
            line.zPosition = 145
            line.setScale(0.1)
            worldNode.addChild(line)

            line.run(SKAction.sequence([
                SKAction.scale(to: 1.0, duration: 0.2),
                SKAction.wait(forDuration: 0.8),
                SKAction.fadeOut(withDuration: 0.3),
                SKAction.removeFromParent()
            ]))
        }

        spawnAOE(at: position, color: color, radius: 40, in: worldNode, duration: 0.6)
    }

    /// Progression — healing vines with leaves and golden particles
    static func progressionHeal(on playerNode: SKNode, in worldNode: SKNode) {
        let color = SKColor(red: 0.2, green: 0.8, blue: 0.3, alpha: 1)

        // Growing vines
        for i in 0..<6 {
            let vine = SKShapeNode(rectOf: CGSize(width: 2, height: 14))
            vine.fillColor = color.withAlphaComponent(0.7)
            vine.strokeColor = .clear
            vine.position = CGPoint(
                x: playerNode.position.x + CGFloat(i - 3) * 5 + CGFloat.random(in: -2...2),
                y: playerNode.position.y - 5
            )
            vine.zPosition = 190
            vine.setScale(0.3)
            worldNode.addChild(vine)

            vine.run(SKAction.sequence([
                SKAction.group([
                    SKAction.moveBy(x: CGFloat.random(in: -3...3), y: 22, duration: 0.5),
                    SKAction.scale(to: 1.0, duration: 0.3)
                ]),
                SKAction.fadeOut(withDuration: 0.4),
                SKAction.removeFromParent()
            ]))

            // Leaf at vine tip
            let leaf = SKShapeNode(ellipseOf: CGSize(width: 4, height: 2.5))
            leaf.fillColor = SKColor(red: 0.3, green: 0.9, blue: 0.4, alpha: 0.8)
            leaf.strokeColor = .clear
            leaf.position = vine.position
            leaf.zPosition = 191
            leaf.alpha = 0
            worldNode.addChild(leaf)

            leaf.run(SKAction.sequence([
                SKAction.wait(forDuration: 0.3),
                SKAction.fadeIn(withDuration: 0.1),
                SKAction.moveBy(x: CGFloat.random(in: -5...5), y: 28, duration: 0.4),
                SKAction.fadeOut(withDuration: 0.3),
                SKAction.removeFromParent()
            ]))
        }

        // Golden heal sparkles
        for _ in 0..<8 {
            let sparkle = SKShapeNode(circleOfRadius: 1.5)
            sparkle.fillColor = SKColor(red: 1, green: 0.9, blue: 0.4, alpha: 0.9)
            sparkle.strokeColor = .clear
            sparkle.glowWidth = 2
            sparkle.position = CGPoint(
                x: playerNode.position.x + CGFloat.random(in: -12...12),
                y: playerNode.position.y + CGFloat.random(in: 0...20)
            )
            sparkle.zPosition = 195
            sparkle.alpha = 0
            worldNode.addChild(sparkle)

            sparkle.run(SKAction.sequence([
                SKAction.wait(forDuration: Double.random(in: 0...0.3)),
                SKAction.fadeIn(withDuration: 0.1),
                SKAction.moveBy(x: 0, y: 15, duration: 0.5),
                SKAction.fadeOut(withDuration: 0.2),
                SKAction.removeFromParent()
            ]))
        }

        spawnBuffAura(on: playerNode, color: color, duration: 2.0)
    }

    // --- Awakener ---

    /// Animate object — rainbow color drain + ribbon swirl + BioChromatic glow
    static func awakeningAnimate(at position: CGPoint, in worldNode: SKNode) {
        // Central BioChromatic flash
        let flash = SKShapeNode(circleOfRadius: 12)
        flash.fillColor = SKColor(red: 1, green: 1, blue: 1, alpha: 0.3)
        flash.strokeColor = .clear
        flash.position = position
        flash.zPosition = 205
        flash.setScale(0.3)
        worldNode.addChild(flash)
        flash.run(SKAction.sequence([
            SKAction.scale(to: 1.5, duration: 0.15),
            SKAction.fadeOut(withDuration: 0.15),
            SKAction.removeFromParent()
        ]))

        // Colorful ribbons spiraling outward (more than before)
        for i in 0..<8 {
            let ribbon = SKShapeNode(rectOf: CGSize(width: 3, height: 16))
            let hue = CGFloat(i) * 0.125
            ribbon.fillColor = SKColor(hue: hue, saturation: 0.9, brightness: 0.9, alpha: 0.8)
            ribbon.strokeColor = SKColor(hue: hue, saturation: 1.0, brightness: 1.0, alpha: 0.3)
            ribbon.lineWidth = 0.5
            ribbon.position = position
            ribbon.zPosition = 200
            worldNode.addChild(ribbon)

            let angle = CGFloat(i) * (.pi / 4) + CGFloat.random(in: -0.1...0.1)
            let dist: CGFloat = 28 + CGFloat.random(in: 0...8)
            let target = CGPoint(x: position.x + cos(angle) * dist,
                                 y: position.y + sin(angle) * dist)
            ribbon.run(SKAction.sequence([
                SKAction.group([
                    SKAction.move(to: target, duration: 0.35),
                    SKAction.rotate(byAngle: .pi * 1.5, duration: 0.35),
                    SKAction.sequence([
                        SKAction.wait(forDuration: 0.2),
                        SKAction.fadeOut(withDuration: 0.15)
                    ])
                ]),
                SKAction.removeFromParent()
            ]))
        }

        // Color drain: grey circles expanding from surroundings
        for i in 0..<4 {
            let drain = SKShapeNode(circleOfRadius: 5)
            drain.fillColor = SKColor(white: 0.5, alpha: 0.3)
            drain.strokeColor = .clear
            let angle = CGFloat(i) * (.pi / 2)
            drain.position = CGPoint(x: position.x + cos(angle) * 40,
                                      y: position.y + sin(angle) * 40)
            drain.zPosition = 185
            worldNode.addChild(drain)

            drain.run(SKAction.sequence([
                SKAction.group([
                    SKAction.move(to: position, duration: 0.3),
                    SKAction.scale(to: 0.3, duration: 0.3),
                    SKAction.fadeOut(withDuration: 0.3)
                ]),
                SKAction.removeFromParent()
            ]))
        }
    }

    // --- Elantrian (AonDor) ---

    /// Aon drawing — glowing glyph with intricate pattern and light beams
    static func drawAon(at position: CGPoint, color: SKColor, in worldNode: SKNode) {
        let container = SKNode()
        container.position = position
        container.zPosition = 200
        container.setScale(0)
        worldNode.addChild(container)

        // Outer circle with dashes
        let outer = SKShapeNode(circleOfRadius: 28)
        outer.fillColor = .clear
        outer.strokeColor = color.withAlphaComponent(0.8)
        outer.lineWidth = 2
        outer.glowWidth = 3
        container.addChild(outer)

        // Inner circle
        let inner = SKShapeNode(circleOfRadius: 16)
        inner.fillColor = color.withAlphaComponent(0.08)
        inner.strokeColor = color.withAlphaComponent(0.5)
        inner.lineWidth = 1.5
        container.addChild(inner)

        // Aon cross pattern
        let cross1 = SKShapeNode(rectOf: CGSize(width: 2, height: 32))
        cross1.fillColor = color.withAlphaComponent(0.6)
        cross1.strokeColor = .clear
        container.addChild(cross1)

        let cross2 = SKShapeNode(rectOf: CGSize(width: 32, height: 2))
        cross2.fillColor = color.withAlphaComponent(0.6)
        cross2.strokeColor = .clear
        container.addChild(cross2)

        // Diagonal lines
        for i in 0..<4 {
            let angle = CGFloat(i) * (.pi / 2) + .pi / 4
            let diag = SKShapeNode(rectOf: CGSize(width: 1.5, height: 22))
            diag.fillColor = color.withAlphaComponent(0.35)
            diag.strokeColor = .clear
            diag.zRotation = angle
            container.addChild(diag)
        }

        // Rune marks at cardinal points
        for i in 0..<8 {
            let angle = CGFloat(i) * (.pi / 4)
            let mark = SKShapeNode(rectOf: CGSize(width: 3, height: 3))
            mark.fillColor = color.withAlphaComponent(0.9)
            mark.strokeColor = .clear
            mark.position = CGPoint(x: cos(angle) * 22, y: sin(angle) * 22)
            mark.zRotation = angle
            container.addChild(mark)
        }

        // Appear animation
        container.run(SKAction.sequence([
            SKAction.scale(to: 1.0, duration: 0.35),
            SKAction.run {
                // Light beams burst
                for i in 0..<4 {
                    let beam = SKShapeNode(rectOf: CGSize(width: 2, height: 50))
                    beam.fillColor = color.withAlphaComponent(0.3)
                    beam.strokeColor = .clear
                    beam.glowWidth = 3
                    let angle = CGFloat(i) * (.pi / 2) + .pi / 4
                    beam.zRotation = angle
                    beam.setScale(0.3)
                    container.addChild(beam)
                    beam.run(SKAction.sequence([
                        SKAction.scale(to: 1.0, duration: 0.15),
                        SKAction.fadeOut(withDuration: 0.2),
                        SKAction.removeFromParent()
                    ]))
                }
            },
            SKAction.wait(forDuration: 0.4),
            SKAction.group([
                SKAction.scale(to: 1.5, duration: 0.3),
                SKAction.fadeOut(withDuration: 0.3)
            ]),
            SKAction.removeFromParent()
        ]))
    }

    // --- Sand Master ---

    /// Sand whip — stream of sand grains with dust cloud
    static func sandWhip(from origin: CGPoint, toward angle: CGFloat, in worldNode: SKNode) {
        let color = SKColor(red: 0.8, green: 0.7, blue: 0.4, alpha: 1)

        // Leading sand stream
        for i in 0..<10 {
            let grain = SKShapeNode(circleOfRadius: CGFloat.random(in: 1...2.5))
            grain.fillColor = color.withAlphaComponent(0.8)
            grain.strokeColor = .clear
            grain.position = origin
            grain.zPosition = 200
            worldNode.addChild(grain)

            let dist = 12.0 + Double(i) * 6
            let spread = CGFloat.random(in: -0.15...0.15)
            let target = CGPoint(
                x: origin.x + cos(angle + spread) * CGFloat(dist),
                y: origin.y + sin(angle + spread) * CGFloat(dist)
            )
            grain.run(SKAction.sequence([
                SKAction.move(to: target, duration: 0.12 + Double(i) * 0.02),
                SKAction.fadeOut(withDuration: 0.15),
                SKAction.removeFromParent()
            ]))
        }

        // Dust cloud at impact
        let impactDist: CGFloat = 55
        let impactPos = CGPoint(x: origin.x + cos(angle) * impactDist,
                                 y: origin.y + sin(angle) * impactDist)
        let dust = SKShapeNode(circleOfRadius: 10)
        dust.fillColor = color.withAlphaComponent(0.2)
        dust.strokeColor = .clear
        dust.position = impactPos
        dust.zPosition = 195
        dust.setScale(0.3)
        worldNode.addChild(dust)

        dust.run(SKAction.sequence([
            SKAction.wait(forDuration: 0.2),
            SKAction.group([
                SKAction.scale(to: 1.5, duration: 0.3),
                SKAction.fadeOut(withDuration: 0.3)
            ]),
            SKAction.removeFromParent()
        ]))
    }

    /// Sand shield — orbiting sand barrier
    static func sandShield(on playerNode: SKNode) {
        let color = SKColor(red: 0.8, green: 0.7, blue: 0.4, alpha: 1)
        spawnShield(on: playerNode, color: color, duration: 4.0)

        // Orbiting sand particles
        let orbit = SKNode()
        orbit.position = CGPoint(x: 0, y: 12)
        orbit.zPosition = 51
        orbit.name = "sandOrbit"
        playerNode.addChild(orbit)

        for i in 0..<8 {
            let grain = SKShapeNode(circleOfRadius: 1.5)
            grain.fillColor = color.withAlphaComponent(0.7)
            grain.strokeColor = .clear
            let angle = CGFloat(i) * (.pi / 4)
            grain.position = CGPoint(x: cos(angle) * 20, y: sin(angle) * 20)
            orbit.addChild(grain)
        }

        let rotate = SKAction.repeatForever(SKAction.rotate(byAngle: .pi * 2, duration: 2.0))
        orbit.run(rotate)

        orbit.run(SKAction.sequence([
            SKAction.wait(forDuration: 4.0),
            SKAction.fadeOut(withDuration: 0.3),
            SKAction.removeFromParent()
        ]))
    }

    // --- Nightmare Painter ---

    /// Ink slash — dark blade with ink splatter
    static func inkSlash(from origin: CGPoint, in worldNode: SKNode) {
        let color = SKColor(red: 0.15, green: 0.05, blue: 0.2, alpha: 1)

        // Main slash arc
        let slash = SKShapeNode()
        let path = CGMutablePath()
        path.move(to: CGPoint(x: -5, y: 0))
        path.addQuadCurve(to: CGPoint(x: 45, y: 8),
                          control: CGPoint(x: 20, y: 15))
        path.addLine(to: CGPoint(x: 42, y: 4))
        path.addQuadCurve(to: CGPoint(x: -3, y: -3),
                          control: CGPoint(x: 18, y: 10))
        path.closeSubpath()
        slash.path = path
        slash.fillColor = color
        slash.strokeColor = SKColor(red: 0.4, green: 0.1, blue: 0.5, alpha: 0.7)
        slash.lineWidth = 1
        slash.glowWidth = 3
        slash.position = CGPoint(x: origin.x + 5, y: origin.y + 12)
        slash.zPosition = 200
        slash.zRotation = CGFloat.random(in: -0.3...0.3)
        slash.setScale(0.3)
        slash.alpha = 0
        worldNode.addChild(slash)

        slash.run(SKAction.sequence([
            SKAction.group([
                SKAction.fadeIn(withDuration: 0.05),
                SKAction.scale(to: 1.0, duration: 0.08)
            ]),
            SKAction.wait(forDuration: 0.1),
            SKAction.fadeOut(withDuration: 0.15),
            SKAction.removeFromParent()
        ]))

        // Ink splatter droplets
        for _ in 0..<5 {
            let drop = SKShapeNode(circleOfRadius: CGFloat.random(in: 1...3))
            drop.fillColor = color.withAlphaComponent(0.6)
            drop.strokeColor = .clear
            drop.position = CGPoint(x: origin.x + CGFloat.random(in: 10...35),
                                     y: origin.y + CGFloat.random(in: 5...18))
            drop.zPosition = 198
            drop.alpha = 0
            worldNode.addChild(drop)

            drop.run(SKAction.sequence([
                SKAction.wait(forDuration: 0.08),
                SKAction.fadeIn(withDuration: 0.05),
                SKAction.wait(forDuration: 0.2),
                SKAction.fadeOut(withDuration: 0.2),
                SKAction.removeFromParent()
            ]))
        }
    }

    /// Nightmare capture — dark tendrils closing in with void effect
    static func nightmareCapture(at position: CGPoint, in worldNode: SKNode) {
        let color = SKColor(red: 0.2, green: 0.05, blue: 0.3, alpha: 1)

        // Dark void core
        let core = SKShapeNode(circleOfRadius: 8)
        core.fillColor = SKColor(red: 0.05, green: 0, blue: 0.08, alpha: 0.8)
        core.strokeColor = color.withAlphaComponent(0.6)
        core.lineWidth = 1.5
        core.position = position
        core.zPosition = 205
        core.setScale(0)
        worldNode.addChild(core)

        core.run(SKAction.sequence([
            SKAction.scale(to: 1.0, duration: 0.2),
            SKAction.wait(forDuration: 0.3),
            SKAction.group([
                SKAction.scale(to: 0.1, duration: 0.2),
                SKAction.fadeOut(withDuration: 0.2)
            ]),
            SKAction.removeFromParent()
        ]))

        // Tendrils reaching inward
        for i in 0..<8 {
            let tendril = SKShapeNode(rectOf: CGSize(width: 2.5, height: 22))
            tendril.fillColor = color.withAlphaComponent(0.7)
            tendril.strokeColor = .clear
            tendril.glowWidth = 2
            let angle = CGFloat(i) * (.pi / 4) + CGFloat.random(in: -0.2...0.2)
            let dist: CGFloat = 30 + CGFloat.random(in: 0...10)
            tendril.position = CGPoint(
                x: position.x + cos(angle) * dist,
                y: position.y + sin(angle) * dist
            )
            tendril.zRotation = angle + .pi / 2
            tendril.zPosition = 200
            tendril.setScale(0.3)
            tendril.alpha = 0
            worldNode.addChild(tendril)

            tendril.run(SKAction.sequence([
                SKAction.wait(forDuration: Double(i) * 0.03),
                SKAction.fadeIn(withDuration: 0.05),
                SKAction.group([
                    SKAction.scale(to: 1.0, duration: 0.2),
                    SKAction.move(to: position, duration: 0.25)
                ]),
                SKAction.fadeOut(withDuration: 0.1),
                SKAction.removeFromParent()
            ]))
        }

        // Dark mist around capture zone
        let mist = SKShapeNode(circleOfRadius: 25)
        mist.fillColor = SKColor(red: 0.1, green: 0, blue: 0.15, alpha: 0.15)
        mist.strokeColor = .clear
        mist.position = position
        mist.zPosition = 185
        worldNode.addChild(mist)

        mist.run(SKAction.sequence([
            SKAction.wait(forDuration: 0.5),
            SKAction.fadeOut(withDuration: 0.5),
            SKAction.removeFromParent()
        ]))
    }

    // MARK: - Weather Particles

    static func createWeatherEmitter(effect: WeatherEffect, sceneSize: CGSize) -> SKNode? {
        switch effect {
        case .ashfall:
            return createParticleFall(
                count: 35, color: SKColor(white: 0.4, alpha: 0.6),
                sizeRange: 1...3, speedRange: 20...50, sceneSize: sceneSize
            )
        case .mist:
            return createMistEffect(sceneSize: sceneSize)
        case .rain:
            return createRainEffect(sceneSize: sceneSize)
        case .sandstorm:
            return createParticleFall(
                count: 30, color: SKColor(red: 0.7, green: 0.6, blue: 0.3, alpha: 0.5),
                sizeRange: 2...4, speedRange: 40...80, sceneSize: sceneSize,
                horizontal: true
            )
        case .colorDrain:
            return createColorDrainEffect(sceneSize: sceneSize)
        case .hionFlicker:
            return createParticleFall(
                count: 18, color: SKColor(red: 0.7, green: 0.3, blue: 0.5, alpha: 0.6),
                sizeRange: 1...2, speedRange: 10...30, sceneSize: sceneSize
            )
        case .aonGlow:
            return createAonGlowEffect(sceneSize: sceneSize)
        default:
            return nil
        }
    }

    // MARK: - Enhanced Weather Effects

    private static func createMistEffect(sceneSize: CGSize) -> SKNode {
        let container = SKNode()
        container.zPosition = 900

        // Multiple fog layers at different speeds
        for i in 0..<3 {
            let fog = SKShapeNode(rectOf: CGSize(width: sceneSize.width * 2.5, height: sceneSize.height * 2.5))
            fog.fillColor = SKColor(white: 0.6, alpha: 0.04 + CGFloat(i) * 0.02)
            fog.strokeColor = .clear
            fog.zPosition = CGFloat(i)

            let speed = 3.0 + Double(i) * 2
            let xDrift: CGFloat = 25 + CGFloat(i) * 10
            let drift = SKAction.repeatForever(SKAction.sequence([
                SKAction.moveBy(x: xDrift, y: 5, duration: speed),
                SKAction.moveBy(x: -xDrift, y: -5, duration: speed)
            ]))
            fog.run(drift)
            container.addChild(fog)
        }

        // Floating mist wisps
        for _ in 0..<8 {
            let wisp = SKShapeNode(ellipseOf: CGSize(width: CGFloat.random(in: 40...80),
                                                       height: CGFloat.random(in: 10...20)))
            wisp.fillColor = SKColor(white: 0.7, alpha: 0.05)
            wisp.strokeColor = .clear
            wisp.position = CGPoint(x: CGFloat.random(in: -sceneSize.width...sceneSize.width),
                                     y: CGFloat.random(in: -sceneSize.height...sceneSize.height))
            wisp.zPosition = 3

            let drift = SKAction.repeatForever(SKAction.sequence([
                SKAction.moveBy(x: CGFloat.random(in: 30...60), y: CGFloat.random(in: -10...10),
                                 duration: Double.random(in: 5...10)),
                SKAction.run {
                    wisp.position = CGPoint(
                        x: CGFloat.random(in: -sceneSize.width...sceneSize.width),
                        y: CGFloat.random(in: -sceneSize.height...sceneSize.height)
                    )
                }
            ]))
            wisp.run(drift)

            let fade = SKAction.repeatForever(SKAction.sequence([
                SKAction.fadeAlpha(to: 0.08, duration: Double.random(in: 2...4)),
                SKAction.fadeAlpha(to: 0.02, duration: Double.random(in: 2...4))
            ]))
            wisp.run(fade)

            container.addChild(wisp)
        }

        return container
    }

    private static func createRainEffect(sceneSize: CGSize) -> SKNode {
        let container = SKNode()
        container.zPosition = 900

        // Rain streaks (vertical lines instead of circles)
        for _ in 0..<50 {
            let length = CGFloat.random(in: 6...14)
            let streak = SKShapeNode(rectOf: CGSize(width: 1, height: length))
            streak.fillColor = SKColor(red: 0.5, green: 0.6, blue: 0.8, alpha: CGFloat.random(in: 0.3...0.6))
            streak.strokeColor = .clear

            let startX = CGFloat.random(in: -sceneSize.width...sceneSize.width)
            let startY = CGFloat.random(in: -sceneSize.height...sceneSize.height)
            streak.position = CGPoint(x: startX, y: startY)

            let speed = CGFloat.random(in: 100...160)
            let windOffset = CGFloat.random(in: -15...5)
            let duration = Double(sceneSize.height * 2 / speed)

            let fall = SKAction.repeatForever(SKAction.sequence([
                SKAction.moveBy(x: windOffset, y: -sceneSize.height * 2, duration: duration),
                SKAction.run {
                    streak.position = CGPoint(
                        x: CGFloat.random(in: -sceneSize.width...sceneSize.width),
                        y: sceneSize.height
                    )
                }
            ]))
            streak.run(fall)
            container.addChild(streak)
        }

        return container
    }

    private static func createColorDrainEffect(sceneSize: CGSize) -> SKNode {
        let container = SKNode()
        container.zPosition = 900

        let overlay = SKShapeNode(rectOf: CGSize(width: sceneSize.width * 2, height: sceneSize.height * 2))
        overlay.fillColor = SKColor(white: 0.5, alpha: 0.05)
        overlay.strokeColor = .clear
        let pulse = SKAction.repeatForever(SKAction.sequence([
            SKAction.fadeAlpha(to: 0.08, duration: 3.0),
            SKAction.fadeAlpha(to: 0.02, duration: 3.0)
        ]))
        overlay.run(pulse)
        container.addChild(overlay)

        // Floating color specks being drained
        for _ in 0..<6 {
            let hue = CGFloat.random(in: 0...1)
            let speck = SKShapeNode(circleOfRadius: CGFloat.random(in: 2...4))
            speck.fillColor = SKColor(hue: hue, saturation: 0.6, brightness: 0.7, alpha: 0.3)
            speck.strokeColor = .clear
            speck.position = CGPoint(x: CGFloat.random(in: -sceneSize.width...sceneSize.width),
                                      y: CGFloat.random(in: -sceneSize.height...sceneSize.height))

            let drift = SKAction.repeatForever(SKAction.sequence([
                SKAction.group([
                    SKAction.moveBy(x: CGFloat.random(in: -30...30), y: CGFloat.random(in: 10...30),
                                     duration: Double.random(in: 3...6)),
                    SKAction.sequence([
                        SKAction.fadeAlpha(to: 0.5, duration: 1.5),
                        SKAction.fadeAlpha(to: 0.1, duration: 1.5)
                    ])
                ]),
                SKAction.run {
                    speck.position = CGPoint(
                        x: CGFloat.random(in: -sceneSize.width...sceneSize.width),
                        y: CGFloat.random(in: -sceneSize.height...sceneSize.height)
                    )
                }
            ]))
            speck.run(drift)
            container.addChild(speck)
        }

        return container
    }

    private static func createAonGlowEffect(sceneSize: CGSize) -> SKNode {
        let container = SKNode()
        container.zPosition = 900

        let glow = SKShapeNode(rectOf: CGSize(width: sceneSize.width * 2, height: sceneSize.height * 2))
        glow.fillColor = SKColor(red: 0.8, green: 0.7, blue: 0.3, alpha: 0.03)
        glow.strokeColor = .clear
        let shimmer = SKAction.repeatForever(SKAction.sequence([
            SKAction.fadeAlpha(to: 0.06, duration: 2.0),
            SKAction.fadeAlpha(to: 0.01, duration: 2.0)
        ]))
        glow.run(shimmer)
        container.addChild(glow)

        // Floating Aon glyphs fading in/out
        for _ in 0..<4 {
            let glyphSize: CGFloat = CGFloat.random(in: 15...25)
            let glyph = SKShapeNode(circleOfRadius: glyphSize)
            glyph.fillColor = .clear
            glyph.strokeColor = SKColor(red: 0.8, green: 0.7, blue: 0.3, alpha: 0.1)
            glyph.lineWidth = 0.5
            glyph.position = CGPoint(x: CGFloat.random(in: -sceneSize.width * 0.8...sceneSize.width * 0.8),
                                      y: CGFloat.random(in: -sceneSize.height * 0.8...sceneSize.height * 0.8))

            // Cross inside
            let cross = SKShapeNode(rectOf: CGSize(width: 1, height: glyphSize * 1.5))
            cross.fillColor = SKColor(red: 0.8, green: 0.7, blue: 0.3, alpha: 0.08)
            cross.strokeColor = .clear
            glyph.addChild(cross)

            let appear = SKAction.repeatForever(SKAction.sequence([
                SKAction.fadeAlpha(to: 0.15, duration: Double.random(in: 3...5)),
                SKAction.fadeAlpha(to: 0.0, duration: Double.random(in: 2...4)),
                SKAction.run {
                    glyph.position = CGPoint(
                        x: CGFloat.random(in: -sceneSize.width * 0.8...sceneSize.width * 0.8),
                        y: CGFloat.random(in: -sceneSize.height * 0.8...sceneSize.height * 0.8)
                    )
                }
            ]))
            glyph.alpha = 0
            glyph.run(appear)
            container.addChild(glyph)
        }

        return container
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
