import SpriteKit

/// Rendu du personnage joueur — corps, cape, arme, ombre
final class PlayerRenderer {

    /// Couleurs par classe de champion
    static func classColor(for championClass: ChampionClass) -> SKColor {
        switch championClass {
        case .mistborn:         return SKColor(red: 0.4, green: 0.4, blue: 0.5, alpha: 1)
        case .radiant:          return SKColor(red: 0.2, green: 0.5, blue: 0.9, alpha: 1)
        case .awakener:         return SKColor(red: 0.7, green: 0.2, blue: 0.5, alpha: 1)
        case .elantrian:        return SKColor(red: 0.9, green: 0.8, blue: 0.3, alpha: 1)
        case .sandMaster:       return SKColor(red: 0.8, green: 0.7, blue: 0.4, alpha: 1)
        case .nightmarePainter: return SKColor(red: 0.3, green: 0.1, blue: 0.4, alpha: 1)
        }
    }

    static func capeColor(for championClass: ChampionClass) -> SKColor {
        switch championClass {
        case .mistborn:         return SKColor(red: 0.25, green: 0.25, blue: 0.3, alpha: 1)
        case .radiant:          return SKColor(red: 0.1, green: 0.3, blue: 0.6, alpha: 1)
        case .awakener:         return SKColor(red: 0.5, green: 0.1, blue: 0.3, alpha: 1)
        case .elantrian:        return SKColor(red: 0.7, green: 0.6, blue: 0.2, alpha: 1)
        case .sandMaster:       return SKColor(red: 0.6, green: 0.5, blue: 0.25, alpha: 1)
        case .nightmarePainter: return SKColor(red: 0.15, green: 0.05, blue: 0.2, alpha: 1)
        }
    }

    /// Create a detailed player sprite node
    static func createPlayerNode(champion: Champion) -> SKNode {
        let container = SKNode()
        container.name = "player"

        let classCol = classColor(for: champion.championClass)
        let capeCol = capeColor(for: champion.championClass)

        // Shadow (ellipse on ground)
        let shadow = SKShapeNode(ellipseOf: CGSize(width: 22, height: 10))
        shadow.fillColor = SKColor(white: 0, alpha: 0.35)
        shadow.strokeColor = .clear
        shadow.position = CGPoint(x: 0, y: -2)
        shadow.zPosition = -1
        container.addChild(shadow)

        // Cape (behind body)
        let cape = SKShapeNode(rectOf: CGSize(width: 18, height: 16))
        cape.fillColor = capeCol
        cape.strokeColor = .clear
        cape.position = CGPoint(x: 0, y: 10)
        cape.zPosition = 0
        cape.name = "cape"
        container.addChild(cape)

        // Body
        let body = SKShapeNode(rectOf: CGSize(width: 14, height: 20))
        body.fillColor = classCol
        body.strokeColor = classCol.withAlphaComponent(0.5)
        body.lineWidth = 1
        body.position = CGPoint(x: 0, y: 12)
        body.zPosition = 1
        body.name = "body"
        container.addChild(body)

        // Shoulder pads
        let leftShoulder = SKShapeNode(ellipseOf: CGSize(width: 8, height: 5))
        leftShoulder.fillColor = classCol
        leftShoulder.strokeColor = .clear
        leftShoulder.position = CGPoint(x: -9, y: 18)
        leftShoulder.zPosition = 2
        container.addChild(leftShoulder)

        let rightShoulder = SKShapeNode(ellipseOf: CGSize(width: 8, height: 5))
        rightShoulder.fillColor = classCol
        rightShoulder.strokeColor = .clear
        rightShoulder.position = CGPoint(x: 9, y: 18)
        rightShoulder.zPosition = 2
        container.addChild(rightShoulder)

        // Head
        let head = SKShapeNode(circleOfRadius: 7)
        head.fillColor = SKColor(red: 0.85, green: 0.7, blue: 0.55, alpha: 1)
        head.strokeColor = .clear
        head.position = CGPoint(x: 0, y: 28)
        head.zPosition = 3
        head.name = "head"
        container.addChild(head)

        // Eyes
        let leftEye = SKShapeNode(ellipseOf: CGSize(width: 3, height: 2))
        leftEye.fillColor = .white
        leftEye.strokeColor = .clear
        leftEye.position = CGPoint(x: -3, y: 29)
        leftEye.zPosition = 4
        container.addChild(leftEye)

        let rightEye = SKShapeNode(ellipseOf: CGSize(width: 3, height: 2))
        rightEye.fillColor = .white
        rightEye.strokeColor = .clear
        rightEye.position = CGPoint(x: 3, y: 29)
        rightEye.zPosition = 4
        container.addChild(rightEye)

        // Eye pupils
        let leftPupil = SKShapeNode(circleOfRadius: 1)
        leftPupil.fillColor = classCol
        leftPupil.strokeColor = .clear
        leftPupil.position = CGPoint(x: -3, y: 29)
        leftPupil.zPosition = 5
        container.addChild(leftPupil)

        let rightPupil = SKShapeNode(circleOfRadius: 1)
        rightPupil.fillColor = classCol
        rightPupil.strokeColor = .clear
        rightPupil.position = CGPoint(x: 3, y: 29)
        rightPupil.zPosition = 5
        container.addChild(rightPupil)

        // Weapon (right hand)
        let weapon = createWeapon(for: champion.championClass)
        weapon.position = CGPoint(x: 12, y: 12)
        weapon.zPosition = 6
        weapon.name = "weapon"
        container.addChild(weapon)

        // Class glow effect
        let glow = SKShapeNode(circleOfRadius: 20)
        glow.fillColor = classCol.withAlphaComponent(0.08)
        glow.strokeColor = classCol.withAlphaComponent(0.15)
        glow.lineWidth = 1
        glow.position = CGPoint(x: 0, y: 14)
        glow.zPosition = -0.5
        glow.name = "classGlow"
        container.addChild(glow)

        // Subtle breathing animation
        let breathe = SKAction.repeatForever(SKAction.sequence([
            SKAction.scaleY(to: 1.02, duration: 1.5),
            SKAction.scaleY(to: 0.98, duration: 1.5)
        ]))
        body.run(breathe)

        // Name label
        let nameLabel = SKLabelNode(fontNamed: "Copperplate-Bold")
        nameLabel.text = champion.name
        nameLabel.fontSize = 9
        nameLabel.fontColor = .white
        nameLabel.position = CGPoint(x: 0, y: 38)
        nameLabel.zPosition = 10
        container.addChild(nameLabel)

        return container
    }

    private static func createWeapon(for championClass: ChampionClass) -> SKNode {
        let weapon = SKNode()

        switch championClass {
        case .mistborn:
            // Glass dagger
            let blade = SKShapeNode(rectOf: CGSize(width: 2, height: 14))
            blade.fillColor = SKColor(red: 0.6, green: 0.6, blue: 0.7, alpha: 0.9)
            blade.strokeColor = SKColor(white: 0.8, alpha: 0.5)
            blade.lineWidth = 0.5
            blade.position = CGPoint(x: 0, y: 7)
            weapon.addChild(blade)
            let guard_ = SKShapeNode(rectOf: CGSize(width: 6, height: 2))
            guard_.fillColor = SKColor(red: 0.4, green: 0.35, blue: 0.3, alpha: 1)
            guard_.strokeColor = .clear
            weapon.addChild(guard_)

        case .radiant:
            // Shardblade (glowing sword)
            let blade = SKShapeNode(rectOf: CGSize(width: 3, height: 18))
            blade.fillColor = SKColor(red: 0.7, green: 0.8, blue: 1.0, alpha: 0.85)
            blade.strokeColor = SKColor(red: 0.5, green: 0.7, blue: 1.0, alpha: 0.5)
            blade.lineWidth = 1
            blade.position = CGPoint(x: 0, y: 9)
            blade.name = "shardBlade"
            weapon.addChild(blade)
            // Glow pulse
            let pulse = SKAction.repeatForever(SKAction.sequence([
                SKAction.run { blade.glowWidth = 4 },
                SKAction.wait(forDuration: 0.8),
                SKAction.run { blade.glowWidth = 1 },
                SKAction.wait(forDuration: 0.8)
            ]))
            blade.run(pulse)

        case .awakener:
            // Cloth whip
            let cloth = SKShapeNode(rectOf: CGSize(width: 2, height: 16))
            cloth.fillColor = SKColor(red: 0.7, green: 0.3, blue: 0.5, alpha: 0.9)
            cloth.strokeColor = .clear
            cloth.position = CGPoint(x: 0, y: 8)
            weapon.addChild(cloth)

        case .elantrian:
            // Staff with aon glow
            let staff = SKShapeNode(rectOf: CGSize(width: 2, height: 20))
            staff.fillColor = SKColor(red: 0.5, green: 0.4, blue: 0.2, alpha: 1)
            staff.strokeColor = .clear
            staff.position = CGPoint(x: 0, y: 10)
            weapon.addChild(staff)
            let orb = SKShapeNode(circleOfRadius: 3)
            orb.fillColor = SKColor(red: 0.9, green: 0.8, blue: 0.3, alpha: 0.7)
            orb.strokeColor = .clear
            orb.position = CGPoint(x: 0, y: 21)
            weapon.addChild(orb)
            let glow = SKAction.repeatForever(SKAction.sequence([
                SKAction.fadeAlpha(to: 0.4, duration: 1.0),
                SKAction.fadeAlpha(to: 0.9, duration: 1.0)
            ]))
            orb.run(glow)

        case .sandMaster:
            // Sand ribbon
            let ribbon = SKShapeNode(rectOf: CGSize(width: 3, height: 14))
            ribbon.fillColor = SKColor(red: 0.8, green: 0.7, blue: 0.4, alpha: 0.8)
            ribbon.strokeColor = .clear
            ribbon.position = CGPoint(x: 0, y: 7)
            weapon.addChild(ribbon)
            let wave = SKAction.repeatForever(SKAction.sequence([
                SKAction.rotate(byAngle: 0.1, duration: 0.3),
                SKAction.rotate(byAngle: -0.1, duration: 0.3)
            ]))
            ribbon.run(wave)

        case .nightmarePainter:
            // Paint brush
            let handle = SKShapeNode(rectOf: CGSize(width: 2, height: 14))
            handle.fillColor = SKColor(red: 0.3, green: 0.2, blue: 0.15, alpha: 1)
            handle.strokeColor = .clear
            handle.position = CGPoint(x: 0, y: 7)
            weapon.addChild(handle)
            let tip = SKShapeNode(ellipseOf: CGSize(width: 5, height: 4))
            tip.fillColor = SKColor(red: 0.1, green: 0.05, blue: 0.15, alpha: 0.9)
            tip.strokeColor = .clear
            tip.position = CGPoint(x: 0, y: 15)
            weapon.addChild(tip)
        }

        return weapon
    }

    // MARK: - Cleanup

    /// Stop all running actions on player node and children before removal
    static func cleanupPlayerNode(_ playerNode: SKNode) {
        playerNode.removeAllActions()
        playerNode.children.forEach { child in
            child.removeAllActions()
            child.children.forEach { $0.removeAllActions() }
        }
    }

    // MARK: - Attack Animation

    /// Swing weapon with visual slash effect
    static func playAttackAnimation(on playerNode: SKNode, in worldNode: SKNode) {
        guard let weapon = playerNode.childNode(withName: "weapon") else { return }

        // Weapon swing
        let swing = SKAction.sequence([
            SKAction.rotate(byAngle: -1.2, duration: 0.08),
            SKAction.rotate(byAngle: 1.2, duration: 0.12)
        ])
        weapon.run(swing)

        // Body lunge
        let lunge = SKAction.sequence([
            SKAction.moveBy(x: 4, y: 0, duration: 0.06),
            SKAction.moveBy(x: -4, y: 0, duration: 0.1)
        ])
        playerNode.run(lunge)

        // Slash arc effect
        let slash = SKShapeNode()
        let path = CGMutablePath()
        path.addArc(center: .zero, radius: 25, startAngle: -.pi / 4, endAngle: .pi / 4, clockwise: false)
        slash.path = path
        slash.strokeColor = SKColor(white: 1, alpha: 0.8)
        slash.lineWidth = 3
        slash.fillColor = .clear
        slash.position = CGPoint(x: playerNode.position.x + 15, y: playerNode.position.y + 12)
        slash.zPosition = playerNode.zPosition + 10
        worldNode.addChild(slash)

        slash.run(SKAction.sequence([
            SKAction.group([
                SKAction.fadeOut(withDuration: 0.2),
                SKAction.scale(to: 1.3, duration: 0.2)
            ]),
            SKAction.removeFromParent()
        ]))
    }

    /// Cape flutter when walking
    static func startWalkAnimation(on playerNode: SKNode) {
        guard let cape = playerNode.childNode(withName: "cape") as? SKShapeNode else { return }
        if playerNode.action(forKey: "walkAnim") != nil { return }

        let walk = SKAction.repeatForever(SKAction.sequence([
            SKAction.moveBy(x: 0, y: 2, duration: 0.15),
            SKAction.moveBy(x: 0, y: -2, duration: 0.15)
        ]))
        playerNode.run(walk, withKey: "walkAnim")

        let flutter = SKAction.repeatForever(SKAction.sequence([
            SKAction.scaleX(to: 1.1, duration: 0.12),
            SKAction.scaleX(to: 0.9, duration: 0.12)
        ]))
        cape.run(flutter, withKey: "capeFlutter")
    }

    static func stopWalkAnimation(on playerNode: SKNode) {
        playerNode.removeAction(forKey: "walkAnim")
        playerNode.childNode(withName: "cape")?.removeAction(forKey: "capeFlutter")
        playerNode.childNode(withName: "cape")?.run(SKAction.scaleX(to: 1.0, duration: 0.1))
    }
}
