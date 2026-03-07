import SpriteKit

/// Rendu du personnage joueur — corps détaillé, armure, arme, cape, effets de rareté
/// L'apparence évolue dynamiquement en fonction de l'équipement porté
final class PlayerRenderer {

    // MARK: - Class Colors

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

    /// Couleur de peau selon la classe (cohérence lore)
    static func skinColor(for championClass: ChampionClass) -> SKColor {
        switch championClass {
        case .mistborn:         return SKColor(red: 0.75, green: 0.6, blue: 0.48, alpha: 1)  // Skaa pâle
        case .radiant:          return SKColor(red: 0.85, green: 0.7, blue: 0.55, alpha: 1)  // Alethi tan
        case .awakener:         return SKColor(red: 0.9, green: 0.75, blue: 0.6, alpha: 1)   // Hallandren doré
        case .elantrian:        return SKColor(red: 0.92, green: 0.88, blue: 0.78, alpha: 1) // Elantrien lumineux
        case .sandMaster:       return SKColor(red: 0.7, green: 0.55, blue: 0.4, alpha: 1)   // Daysider bronzé
        case .nightmarePainter: return SKColor(red: 0.8, green: 0.72, blue: 0.62, alpha: 1)  // Komashi
        }
    }

    /// Couleur des cheveux selon la classe
    static func hairColor(for championClass: ChampionClass) -> SKColor {
        switch championClass {
        case .mistborn:         return SKColor(red: 0.15, green: 0.1, blue: 0.1, alpha: 1)   // Noir charbon
        case .radiant:          return SKColor(red: 0.1, green: 0.08, blue: 0.06, alpha: 1)  // Noir profond
        case .awakener:         return SKColor(red: 0.5, green: 0.35, blue: 0.15, alpha: 1)  // Brun doré
        case .elantrian:        return SKColor(red: 0.85, green: 0.8, blue: 0.65, alpha: 1)  // Argenté/blanc
        case .sandMaster:       return SKColor(red: 0.25, green: 0.15, blue: 0.05, alpha: 1) // Brun foncé
        case .nightmarePainter: return SKColor(red: 0.08, green: 0.05, blue: 0.12, alpha: 1) // Noir bleuté
        }
    }

    // MARK: - Main Player Node Creation

    /// Crée le sprite du champion avec équipement visuel complet
    static func createPlayerNode(champion: Champion) -> SKNode {
        let container = SKNode()
        container.name = "player"

        let classCol = classColor(for: champion.championClass)
        let capeCol = capeColor(for: champion.championClass)
        let skin = skinColor(for: champion.championClass)
        let hair = hairColor(for: champion.championClass)

        // Récupérer l'apparence d'équipement
        let appearance = EquipmentVisualSystem.buildAppearance(from: champion)

        // === LAYER -1: Shadow ===
        let shadow = SKShapeNode(ellipseOf: CGSize(width: 26, height: 12))
        shadow.fillColor = SKColor(white: 0, alpha: 0.4)
        shadow.strokeColor = .clear
        shadow.position = CGPoint(x: 0, y: -3)
        shadow.zPosition = -1
        container.addChild(shadow)

        // === LAYER -0.5: Equipment Aura (si rareté >= rare) ===
        addEquipmentAura(to: container, appearance: appearance, classColor: classCol)

        // === LAYER 0: Boots ===
        addBoots(to: container, appearance: appearance, classColor: classCol)

        // === LAYER 0.5: Legs ===
        addLegs(to: container, appearance: appearance, classColor: classCol)

        // === LAYER 1: Cape (derrière le corps) ===
        addCape(to: container, appearance: appearance, classColor: classCol, capeColor: capeCol)

        // === LAYER 2: Body / Chest ===
        addChest(to: container, appearance: appearance, classColor: classCol)

        // === LAYER 2.5: Belt ===
        addBelt(to: container, appearance: appearance, classColor: classCol)

        // === LAYER 3: Shoulders ===
        addShoulders(to: container, appearance: appearance, classColor: classCol)

        // === LAYER 3.5: Gloves / Arms ===
        addGloves(to: container, appearance: appearance, classColor: classCol, skinColor: skin)

        // === LAYER 4: Head ===
        addHead(to: container, skinColor: skin, hairColor: hair, classColor: classCol, championClass: champion.championClass)

        // === LAYER 5: Helmet ===
        addHelmet(to: container, appearance: appearance, classColor: classCol)

        // === LAYER 6: Weapon (main hand) ===
        let weapon = createWeapon(for: champion.championClass, appearance: appearance)
        weapon.position = CGPoint(x: 13, y: 12)
        weapon.zPosition = 6
        weapon.name = "weapon"
        container.addChild(weapon)

        // === LAYER 6.5: Offhand ===
        addOffhand(to: container, appearance: appearance, classColor: classCol)

        // === LAYER 7: Amulet glow (si équipé) ===
        if let amuletRarity = appearance.amuletRarity {
            addAmuletGlow(to: container, rarity: amuletRarity)
        }

        // === LAYER 7.5: Ring particles (si équipé) ===
        if appearance.ringCount > 0 {
            addRingEffects(to: container, count: appearance.ringCount, rarity: appearance.bestRingRarity)
        }

        // === LAYER 8: Class Glow ===
        let glow = SKShapeNode(circleOfRadius: 22)
        glow.fillColor = classCol.withAlphaComponent(0.06)
        glow.strokeColor = classCol.withAlphaComponent(0.12)
        glow.lineWidth = 1
        glow.position = CGPoint(x: 0, y: 14)
        glow.zPosition = -0.5
        glow.name = "classGlow"
        container.addChild(glow)

        // === Breathing Animation ===
        let body = container.childNode(withName: "body")
        let breathe = SKAction.repeatForever(SKAction.sequence([
            SKAction.scaleY(to: 1.02, duration: 1.5),
            SKAction.scaleY(to: 0.98, duration: 1.5)
        ]))
        body?.run(breathe)

        // === Name Label ===
        let nameLabel = SKLabelNode(fontNamed: "Copperplate-Bold")
        nameLabel.text = champion.name
        nameLabel.fontSize = 9
        nameLabel.fontColor = .white
        nameLabel.position = CGPoint(x: 0, y: 42)
        nameLabel.zPosition = 10
        container.addChild(nameLabel)

        // === Level Badge ===
        let levelBg = SKShapeNode(circleOfRadius: 5)
        levelBg.fillColor = SKColor(red: 0.15, green: 0.15, blue: 0.2, alpha: 0.9)
        levelBg.strokeColor = classCol.withAlphaComponent(0.6)
        levelBg.lineWidth = 1
        levelBg.position = CGPoint(x: -16, y: 38)
        levelBg.zPosition = 10
        container.addChild(levelBg)

        let levelLabel = SKLabelNode(fontNamed: "Copperplate-Bold")
        levelLabel.text = "\(champion.level)"
        levelLabel.fontSize = 7
        levelLabel.fontColor = classCol
        levelLabel.verticalAlignmentMode = .center
        levelLabel.position = CGPoint(x: -16, y: 38)
        levelLabel.zPosition = 11
        container.addChild(levelLabel)

        return container
    }

    // MARK: - Equipment Parts Rendering

    private static func addEquipmentAura(to container: SKNode, appearance: EquipmentVisualSystem.EquipmentAppearance, classColor: SKColor) {
        let rarity = appearance.highestVisibleRarity
        guard rarity.glowIntensity > 0.15 else { return }

        let auraColor = EquipmentVisualSystem.skColor(for: rarity, alpha: rarity.glowIntensity * 0.3)
        let aura = SKShapeNode(circleOfRadius: 28)
        aura.fillColor = auraColor
        aura.strokeColor = EquipmentVisualSystem.skColor(for: rarity, alpha: rarity.glowIntensity * 0.5)
        aura.lineWidth = 1.5
        aura.position = CGPoint(x: 0, y: 14)
        aura.zPosition = -0.8
        aura.name = "equipAura"
        container.addChild(aura)

        let pulse = SKAction.repeatForever(SKAction.sequence([
            SKAction.scale(to: 1.15, duration: 1.2),
            SKAction.scale(to: 0.95, duration: 1.2)
        ]))
        aura.run(pulse)

        // Particules orbitantes pour legendary/cosmeric
        if rarity.particleScale > 0.5 {
            addOrbitingParticles(to: container, rarity: rarity, count: rarity == .cosmeric ? 6 : 3)
        }
    }

    private static func addOrbitingParticles(to container: SKNode, rarity: ItemRarity, count: Int) {
        let orbitNode = SKNode()
        orbitNode.position = CGPoint(x: 0, y: 14)
        orbitNode.zPosition = 7.5
        orbitNode.name = "orbitParticles"

        for i in 0..<count {
            let angle = CGFloat(i) * (.pi * 2.0 / CGFloat(count))
            let particle = SKShapeNode(circleOfRadius: 1.5 * rarity.particleScale)
            particle.fillColor = EquipmentVisualSystem.skAccentColor(for: rarity, alpha: 0.8)
            particle.strokeColor = .clear
            particle.position = CGPoint(x: cos(angle) * 18, y: sin(angle) * 10)
            particle.name = "orbitP_\(i)"
            orbitNode.addChild(particle)
        }

        container.addChild(orbitNode)

        let rotate = SKAction.repeatForever(SKAction.rotate(byAngle: .pi * 2, duration: rarity == .cosmeric ? 3.0 : 5.0))
        orbitNode.run(rotate)
    }

    private static func addBoots(to container: SKNode, appearance: EquipmentVisualSystem.EquipmentAppearance, classColor: SKColor) {
        let style = appearance.bootStyle
        let rarity = appearance.bootRarity
        let rarityCol = style != .none ? EquipmentVisualSystem.skColor(for: rarity) : classColor

        // Pied gauche
        let leftBoot = SKShapeNode(rectOf: CGSize(width: 5, height: 4), cornerRadius: 1)
        // Pied droit
        let rightBoot = SKShapeNode(rectOf: CGSize(width: 5, height: 4), cornerRadius: 1)

        switch style {
        case .none:
            leftBoot.fillColor = SKColor(red: 0.3, green: 0.2, blue: 0.15, alpha: 1)
            rightBoot.fillColor = SKColor(red: 0.3, green: 0.2, blue: 0.15, alpha: 1)
        case .sandals:
            leftBoot.fillColor = SKColor(red: 0.5, green: 0.4, blue: 0.25, alpha: 1)
            rightBoot.fillColor = SKColor(red: 0.5, green: 0.4, blue: 0.25, alpha: 1)
        case .leather:
            leftBoot.fillColor = SKColor(red: 0.4, green: 0.25, blue: 0.15, alpha: 1)
            rightBoot.fillColor = SKColor(red: 0.4, green: 0.25, blue: 0.15, alpha: 1)
        case .armored:
            leftBoot.fillColor = SKColor(red: 0.45, green: 0.45, blue: 0.5, alpha: 1)
            rightBoot.fillColor = SKColor(red: 0.45, green: 0.45, blue: 0.5, alpha: 1)
        case .runic:
            leftBoot.fillColor = rarityCol.withAlphaComponent(0.8)
            rightBoot.fillColor = rarityCol.withAlphaComponent(0.8)
        case .hovering:
            leftBoot.fillColor = rarityCol.withAlphaComponent(0.6)
            rightBoot.fillColor = rarityCol.withAlphaComponent(0.6)
        }

        leftBoot.strokeColor = style != .none ? rarityCol.withAlphaComponent(rarity.borderWidth * 0.3) : .clear
        leftBoot.lineWidth = rarity.borderWidth * 0.5
        leftBoot.position = CGPoint(x: -4, y: 1)
        leftBoot.zPosition = 0
        container.addChild(leftBoot)

        rightBoot.strokeColor = leftBoot.strokeColor
        rightBoot.lineWidth = leftBoot.lineWidth
        rightBoot.position = CGPoint(x: 4, y: 1)
        rightBoot.zPosition = 0
        container.addChild(rightBoot)

        // Bottes runiques : petit glow au sol
        if style == .runic || style == .hovering {
            let glow = SKShapeNode(ellipseOf: CGSize(width: 16, height: 6))
            glow.fillColor = rarityCol.withAlphaComponent(0.15)
            glow.strokeColor = .clear
            glow.position = CGPoint(x: 0, y: -1)
            glow.zPosition = -0.9
            container.addChild(glow)

            if style == .hovering {
                let hover = SKAction.repeatForever(SKAction.sequence([
                    SKAction.moveBy(x: 0, y: 2, duration: 0.8),
                    SKAction.moveBy(x: 0, y: -2, duration: 0.8)
                ]))
                leftBoot.run(hover)
                rightBoot.run(hover)
            }
        }
    }

    private static func addLegs(to container: SKNode, appearance: EquipmentVisualSystem.EquipmentAppearance, classColor: SKColor) {
        let style = appearance.legStyle
        let rarity = appearance.legRarity

        let legColor: SKColor
        switch style {
        case .none:     legColor = classColor.withAlphaComponent(0.7)
        case .cloth:    legColor = SKColor(red: 0.35, green: 0.3, blue: 0.25, alpha: 1)
        case .leather:  legColor = SKColor(red: 0.4, green: 0.28, blue: 0.18, alpha: 1)
        case .chain:    legColor = SKColor(red: 0.5, green: 0.5, blue: 0.55, alpha: 1)
        case .plate:    legColor = SKColor(red: 0.55, green: 0.55, blue: 0.6, alpha: 1)
        case .ethereal: legColor = EquipmentVisualSystem.skColor(for: rarity, alpha: 0.7)
        }

        // Jambe gauche
        let leftLeg = SKShapeNode(rectOf: CGSize(width: 5, height: 10), cornerRadius: 1)
        leftLeg.fillColor = legColor
        leftLeg.strokeColor = style != .none ? EquipmentVisualSystem.skColor(for: rarity, alpha: rarity.borderWidth * 0.2) : .clear
        leftLeg.lineWidth = rarity.borderWidth * 0.5
        leftLeg.position = CGPoint(x: -3, y: 6)
        leftLeg.zPosition = 0.5
        container.addChild(leftLeg)

        // Jambe droite
        let rightLeg = SKShapeNode(rectOf: CGSize(width: 5, height: 10), cornerRadius: 1)
        rightLeg.fillColor = legColor
        rightLeg.strokeColor = leftLeg.strokeColor
        rightLeg.lineWidth = leftLeg.lineWidth
        rightLeg.position = CGPoint(x: 3, y: 6)
        rightLeg.zPosition = 0.5
        container.addChild(rightLeg)

        // Détail plaque/chaîne
        if style == .chain || style == .plate {
            let detail = SKShapeNode(rectOf: CGSize(width: 2, height: 6))
            detail.fillColor = SKColor(white: 0.7, alpha: 0.3)
            detail.strokeColor = .clear
            detail.position = CGPoint(x: -3, y: 7)
            detail.zPosition = 0.6
            container.addChild(detail)
        }

        if style == .ethereal {
            let shimmer = SKAction.repeatForever(SKAction.sequence([
                SKAction.fadeAlpha(to: 0.5, duration: 1.0),
                SKAction.fadeAlpha(to: 1.0, duration: 1.0)
            ]))
            leftLeg.run(shimmer)
            rightLeg.run(shimmer)
        }
    }

    private static func addCape(to container: SKNode, appearance: EquipmentVisualSystem.EquipmentAppearance, classColor: SKColor, capeColor: SKColor) {
        let style = appearance.capeStyle
        let rarity = appearance.capeRarity

        let capeH: CGFloat
        let capeW: CGFloat
        let capeCol: SKColor

        switch style {
        case .none:
            capeH = 16; capeW = 18; capeCol = capeColor
        case .short:
            capeH = 12; capeW = 16; capeCol = capeColor
        case .medium:
            capeH = 18; capeW = 20; capeCol = capeColor
        case .long:
            capeH = 24; capeW = 22; capeCol = capeColor
        case .tattered:
            capeH = 22; capeW = 20
            capeCol = EquipmentVisualSystem.skColor(for: rarity).withAlphaComponent(0.7)
        case .royal:
            capeH = 28; capeW = 24
            capeCol = EquipmentVisualSystem.skColor(for: rarity, alpha: 0.9)
        }

        let cape = SKShapeNode(rectOf: CGSize(width: capeW, height: capeH), cornerRadius: style == .royal ? 3 : 0)
        cape.fillColor = capeCol
        cape.strokeColor = style != .none ? EquipmentVisualSystem.skColor(for: rarity, alpha: rarity.borderWidth * 0.25) : .clear
        cape.lineWidth = rarity.borderWidth * 0.5
        cape.position = CGPoint(x: 0, y: 10)
        cape.zPosition = 0.8
        cape.name = "cape"
        container.addChild(cape)

        // Détails de cape royale
        if style == .royal {
            let trim = SKShapeNode(rectOf: CGSize(width: capeW - 2, height: 2))
            trim.fillColor = EquipmentVisualSystem.skAccentColor(for: rarity, alpha: 0.6)
            trim.strokeColor = .clear
            trim.position = CGPoint(x: 0, y: -capeH / 2 + 2)
            cape.addChild(trim)

            // Motif central
            let emblem = SKShapeNode(circleOfRadius: 3)
            emblem.fillColor = EquipmentVisualSystem.skAccentColor(for: rarity, alpha: 0.5)
            emblem.strokeColor = EquipmentVisualSystem.skColor(for: rarity, alpha: 0.3)
            emblem.lineWidth = 0.5
            emblem.position = CGPoint(x: 0, y: 2)
            cape.addChild(emblem)
        }

        // Tattered edge effect
        if style == .tattered {
            for i in stride(from: -Int(capeW / 2) + 2, to: Int(capeW / 2) - 1, by: 4) {
                let tear = SKShapeNode(rectOf: CGSize(width: 2, height: CGFloat.random(in: 2...5)))
                tear.fillColor = capeCol.withAlphaComponent(0.4)
                tear.strokeColor = .clear
                tear.position = CGPoint(x: CGFloat(i), y: -capeH / 2 - 1)
                cape.addChild(tear)
            }
        }
    }

    private static func addChest(to container: SKNode, appearance: EquipmentVisualSystem.EquipmentAppearance, classColor: SKColor) {
        let style = appearance.chestStyle
        let rarity = appearance.chestRarity

        let bodyColor: SKColor
        let bodyW: CGFloat = 16
        let bodyH: CGFloat = 20

        switch style {
        case .none:    bodyColor = classColor
        case .cloth:   bodyColor = SKColor(red: 0.35, green: 0.3, blue: 0.28, alpha: 1)
        case .leather: bodyColor = SKColor(red: 0.45, green: 0.3, blue: 0.18, alpha: 1)
        case .chain:   bodyColor = SKColor(red: 0.5, green: 0.5, blue: 0.55, alpha: 1)
        case .plate:   bodyColor = SKColor(red: 0.6, green: 0.6, blue: 0.65, alpha: 1)
        case .robe:    bodyColor = EquipmentVisualSystem.skColor(for: rarity, alpha: 0.85)
        }

        let body = SKShapeNode(rectOf: CGSize(width: bodyW, height: bodyH), cornerRadius: style == .robe ? 3 : 1)
        body.fillColor = bodyColor
        body.strokeColor = style != .none ? EquipmentVisualSystem.skColor(for: rarity, alpha: rarity.borderWidth * 0.3) : classColor.withAlphaComponent(0.5)
        body.lineWidth = max(1, rarity.borderWidth)
        body.position = CGPoint(x: 0, y: 12)
        body.zPosition = 2
        body.name = "body"
        container.addChild(body)

        // Détails d'armure
        switch style {
        case .chain:
            // Motif de mailles
            for row in stride(from: -6, to: 7, by: 3) {
                let line = SKShapeNode(rectOf: CGSize(width: bodyW - 4, height: 0.5))
                line.fillColor = SKColor(white: 0.7, alpha: 0.3)
                line.strokeColor = .clear
                line.position = CGPoint(x: 0, y: CGFloat(row))
                body.addChild(line)
            }
        case .plate:
            // Plaques d'armure
            let chestPlate = SKShapeNode(rectOf: CGSize(width: bodyW - 6, height: bodyH - 6), cornerRadius: 2)
            chestPlate.fillColor = SKColor(white: 0.7, alpha: 0.2)
            chestPlate.strokeColor = SKColor(white: 0.8, alpha: 0.3)
            chestPlate.lineWidth = 0.5
            body.addChild(chestPlate)

            // Rivet central
            let rivet = SKShapeNode(circleOfRadius: 1.5)
            rivet.fillColor = EquipmentVisualSystem.skColor(for: rarity, alpha: 0.6)
            rivet.strokeColor = .clear
            rivet.position = CGPoint(x: 0, y: 3)
            body.addChild(rivet)
        case .robe:
            // Bordure ornée
            let trim = SKShapeNode(rectOf: CGSize(width: 2, height: bodyH - 2))
            trim.fillColor = EquipmentVisualSystem.skAccentColor(for: rarity, alpha: 0.4)
            trim.strokeColor = .clear
            body.addChild(trim)

            // Symbole magique central
            let symbol = SKShapeNode(circleOfRadius: 3)
            symbol.fillColor = .clear
            symbol.strokeColor = EquipmentVisualSystem.skAccentColor(for: rarity, alpha: 0.5)
            symbol.lineWidth = 1
            symbol.position = CGPoint(x: 0, y: 3)
            body.addChild(symbol)

            if rarity.glowIntensity > 0.3 {
                let glow = SKAction.repeatForever(SKAction.sequence([
                    SKAction.run { symbol.glowWidth = 3 },
                    SKAction.wait(forDuration: 1.0),
                    SKAction.run { symbol.glowWidth = 1 },
                    SKAction.wait(forDuration: 1.0)
                ]))
                symbol.run(glow)
            }
        default: break
        }
    }

    private static func addBelt(to container: SKNode, appearance: EquipmentVisualSystem.EquipmentAppearance, classColor: SKColor) {
        let style = appearance.beltStyle
        guard style != .none else { return }
        let rarity = appearance.beltRarity

        let beltColor: SKColor
        switch style {
        case .none:    return
        case .simple:  beltColor = SKColor(red: 0.4, green: 0.3, blue: 0.2, alpha: 1)
        case .studded: beltColor = SKColor(red: 0.45, green: 0.35, blue: 0.2, alpha: 1)
        case .ornate:  beltColor = SKColor(red: 0.5, green: 0.4, blue: 0.15, alpha: 1)
        case .runic:   beltColor = EquipmentVisualSystem.skColor(for: rarity, alpha: 0.7)
        case .cosmic:  beltColor = EquipmentVisualSystem.skColor(for: rarity, alpha: 0.8)
        }

        let belt = SKShapeNode(rectOf: CGSize(width: 18, height: 3), cornerRadius: 1)
        belt.fillColor = beltColor
        belt.strokeColor = EquipmentVisualSystem.skColor(for: rarity, alpha: rarity.borderWidth * 0.3)
        belt.lineWidth = rarity.borderWidth * 0.5
        belt.position = CGPoint(x: 0, y: 5)
        belt.zPosition = 2.5
        container.addChild(belt)

        // Boucle de ceinture
        let buckle = SKShapeNode(rectOf: CGSize(width: 3, height: 3), cornerRadius: 0.5)
        buckle.fillColor = style == .cosmic
            ? EquipmentVisualSystem.skAccentColor(for: rarity, alpha: 0.9)
            : SKColor(red: 0.7, green: 0.6, blue: 0.3, alpha: 1)
        buckle.strokeColor = .clear
        buckle.position = CGPoint(x: 0, y: 5)
        buckle.zPosition = 2.6
        container.addChild(buckle)

        // Studs pour ceinture cloutée
        if style == .studded {
            for x in [-6, -3, 3, 6] as [CGFloat] {
                let stud = SKShapeNode(circleOfRadius: 1)
                stud.fillColor = SKColor(red: 0.6, green: 0.55, blue: 0.4, alpha: 1)
                stud.strokeColor = .clear
                stud.position = CGPoint(x: x, y: 5)
                stud.zPosition = 2.6
                container.addChild(stud)
            }
        }

        // Runes pour ceinture runique/cosmique
        if style == .runic || style == .cosmic {
            let runeGlow = SKShapeNode(rectOf: CGSize(width: 16, height: 2))
            runeGlow.fillColor = EquipmentVisualSystem.skAccentColor(for: rarity, alpha: 0.3)
            runeGlow.strokeColor = .clear
            runeGlow.position = CGPoint(x: 0, y: 5)
            runeGlow.zPosition = 2.4
            container.addChild(runeGlow)

            let pulse = SKAction.repeatForever(SKAction.sequence([
                SKAction.fadeAlpha(to: 0.15, duration: 1.5),
                SKAction.fadeAlpha(to: 0.5, duration: 1.5)
            ]))
            runeGlow.run(pulse)
        }
    }

    private static func addShoulders(to container: SKNode, appearance: EquipmentVisualSystem.EquipmentAppearance, classColor: SKColor) {
        let style = appearance.shoulderStyle
        let rarity = appearance.shoulderRarity

        let shoulderW: CGFloat
        let shoulderH: CGFloat
        let shoulderColor: SKColor

        switch style {
        case .none:
            shoulderW = 8; shoulderH = 5; shoulderColor = classColor
        case .padded:
            shoulderW = 9; shoulderH = 6; shoulderColor = SKColor(red: 0.4, green: 0.35, blue: 0.3, alpha: 1)
        case .plated:
            shoulderW = 10; shoulderH = 6; shoulderColor = SKColor(red: 0.55, green: 0.55, blue: 0.6, alpha: 1)
        case .spiked:
            shoulderW = 10; shoulderH = 7; shoulderColor = SKColor(red: 0.5, green: 0.45, blue: 0.5, alpha: 1)
        case .ornate:
            shoulderW = 11; shoulderH = 7; shoulderColor = EquipmentVisualSystem.skColor(for: rarity, alpha: 0.8)
        case .floating:
            shoulderW = 10; shoulderH = 6; shoulderColor = EquipmentVisualSystem.skColor(for: rarity, alpha: 0.7)
        }

        let leftShoulder = SKShapeNode(ellipseOf: CGSize(width: shoulderW, height: shoulderH))
        leftShoulder.fillColor = shoulderColor
        leftShoulder.strokeColor = style != .none ? EquipmentVisualSystem.skColor(for: rarity, alpha: rarity.borderWidth * 0.25) : .clear
        leftShoulder.lineWidth = rarity.borderWidth * 0.5
        leftShoulder.position = CGPoint(x: -10, y: 19)
        leftShoulder.zPosition = 3
        container.addChild(leftShoulder)

        let rightShoulder = SKShapeNode(ellipseOf: CGSize(width: shoulderW, height: shoulderH))
        rightShoulder.fillColor = shoulderColor
        rightShoulder.strokeColor = leftShoulder.strokeColor
        rightShoulder.lineWidth = leftShoulder.lineWidth
        rightShoulder.position = CGPoint(x: 10, y: 19)
        rightShoulder.zPosition = 3
        container.addChild(rightShoulder)

        // Spikes
        if style == .spiked {
            for xOff in [-10, 10] as [CGFloat] {
                let spike = SKShapeNode(rectOf: CGSize(width: 2, height: 5))
                spike.fillColor = shoulderColor
                spike.strokeColor = EquipmentVisualSystem.skColor(for: rarity, alpha: 0.4)
                spike.lineWidth = 0.5
                spike.position = CGPoint(x: xOff, y: 23)
                spike.zPosition = 3.1
                container.addChild(spike)
            }
        }

        // Floating animation
        if style == .floating {
            let float = SKAction.repeatForever(SKAction.sequence([
                SKAction.moveBy(x: 0, y: 2, duration: 0.7),
                SKAction.moveBy(x: 0, y: -2, duration: 0.7)
            ]))
            leftShoulder.run(float)
            rightShoulder.run(SKAction.sequence([
                SKAction.wait(forDuration: 0.35),
                float
            ]))

            // Trail lumineux
            let trailL = SKShapeNode(ellipseOf: CGSize(width: shoulderW - 2, height: 3))
            trailL.fillColor = EquipmentVisualSystem.skAccentColor(for: rarity, alpha: 0.2)
            trailL.strokeColor = .clear
            trailL.position = CGPoint(x: -10, y: 17)
            trailL.zPosition = 2.9
            container.addChild(trailL)

            let trailR = SKShapeNode(ellipseOf: CGSize(width: shoulderW - 2, height: 3))
            trailR.fillColor = EquipmentVisualSystem.skAccentColor(for: rarity, alpha: 0.2)
            trailR.strokeColor = .clear
            trailR.position = CGPoint(x: 10, y: 17)
            trailR.zPosition = 2.9
            container.addChild(trailR)
        }

        // Ornate gems
        if style == .ornate {
            for xOff in [-10, 10] as [CGFloat] {
                let gem = SKShapeNode(circleOfRadius: 2)
                gem.fillColor = EquipmentVisualSystem.skAccentColor(for: rarity, alpha: 0.9)
                gem.strokeColor = EquipmentVisualSystem.skColor(for: rarity, alpha: 0.5)
                gem.lineWidth = 0.5
                gem.position = CGPoint(x: xOff, y: 19)
                gem.zPosition = 3.1
                container.addChild(gem)
            }
        }
    }

    private static func addGloves(to container: SKNode, appearance: EquipmentVisualSystem.EquipmentAppearance, classColor: SKColor, skinColor: SKColor) {
        let style = appearance.gloveStyle
        let rarity = appearance.gloveRarity

        let gloveColor: SKColor
        switch style {
        case .none:      gloveColor = skinColor
        case .cloth:     gloveColor = SKColor(red: 0.4, green: 0.35, blue: 0.3, alpha: 1)
        case .leather:   gloveColor = SKColor(red: 0.45, green: 0.3, blue: 0.18, alpha: 1)
        case .gauntlet:  gloveColor = SKColor(red: 0.55, green: 0.55, blue: 0.6, alpha: 1)
        case .runic:     gloveColor = EquipmentVisualSystem.skColor(for: rarity, alpha: 0.75)
        case .celestial: gloveColor = EquipmentVisualSystem.skColor(for: rarity, alpha: 0.6)
        }

        // Bras gauche
        let leftArm = SKShapeNode(rectOf: CGSize(width: 4, height: 10), cornerRadius: 1)
        leftArm.fillColor = gloveColor
        leftArm.strokeColor = style != .none ? EquipmentVisualSystem.skColor(for: rarity, alpha: rarity.borderWidth * 0.2) : .clear
        leftArm.lineWidth = rarity.borderWidth * 0.4
        leftArm.position = CGPoint(x: -10, y: 12)
        leftArm.zPosition = 3.5
        container.addChild(leftArm)

        // Main gauche
        let leftHand = SKShapeNode(circleOfRadius: 2.5)
        leftHand.fillColor = style == .none ? skinColor : gloveColor
        leftHand.strokeColor = .clear
        leftHand.position = CGPoint(x: -10, y: 6)
        leftHand.zPosition = 3.5
        container.addChild(leftHand)

        // Glow celestial
        if style == .celestial {
            let handGlow = SKShapeNode(circleOfRadius: 4)
            handGlow.fillColor = EquipmentVisualSystem.skAccentColor(for: rarity, alpha: 0.2)
            handGlow.strokeColor = .clear
            handGlow.position = CGPoint(x: -10, y: 6)
            handGlow.zPosition = 3.4
            container.addChild(handGlow)

            let pulse = SKAction.repeatForever(SKAction.sequence([
                SKAction.fadeAlpha(to: 0.1, duration: 0.8),
                SKAction.fadeAlpha(to: 0.4, duration: 0.8)
            ]))
            handGlow.run(pulse)
        }

        // Runes sur les gantelets
        if style == .runic || style == .gauntlet {
            let knuckle = SKShapeNode(rectOf: CGSize(width: 5, height: 2), cornerRadius: 0.5)
            knuckle.fillColor = style == .runic
                ? EquipmentVisualSystem.skAccentColor(for: rarity, alpha: 0.5)
                : SKColor(white: 0.7, alpha: 0.4)
            knuckle.strokeColor = .clear
            knuckle.position = CGPoint(x: -10, y: 6)
            knuckle.zPosition = 3.6
            container.addChild(knuckle)
        }
    }

    private static func addHead(to container: SKNode, skinColor: SKColor, hairColor: SKColor, classColor: SKColor, championClass: ChampionClass) {
        // Cheveux (derrière la tête)
        let hairBack = SKShapeNode(ellipseOf: CGSize(width: 16, height: 10))
        hairBack.fillColor = hairColor
        hairBack.strokeColor = .clear
        hairBack.position = CGPoint(x: 0, y: 30)
        hairBack.zPosition = 3.8
        container.addChild(hairBack)

        // Tête
        let head = SKShapeNode(circleOfRadius: 7)
        head.fillColor = skinColor
        head.strokeColor = skinColor.withAlphaComponent(0.3)
        head.lineWidth = 0.5
        head.position = CGPoint(x: 0, y: 28)
        head.zPosition = 4
        head.name = "head"
        container.addChild(head)

        // Cheveux dessus
        let hairTop = SKShapeNode(ellipseOf: CGSize(width: 14, height: 6))
        hairTop.fillColor = hairColor
        hairTop.strokeColor = .clear
        hairTop.position = CGPoint(x: 0, y: 32)
        hairTop.zPosition = 4.1
        container.addChild(hairTop)

        // Yeux
        let leftEyeWhite = SKShapeNode(ellipseOf: CGSize(width: 4, height: 2.5))
        leftEyeWhite.fillColor = .white
        leftEyeWhite.strokeColor = .clear
        leftEyeWhite.position = CGPoint(x: -3, y: 29)
        leftEyeWhite.zPosition = 4.2
        container.addChild(leftEyeWhite)

        let rightEyeWhite = SKShapeNode(ellipseOf: CGSize(width: 4, height: 2.5))
        rightEyeWhite.fillColor = .white
        rightEyeWhite.strokeColor = .clear
        rightEyeWhite.position = CGPoint(x: 3, y: 29)
        rightEyeWhite.zPosition = 4.2
        container.addChild(rightEyeWhite)

        // Pupilles (couleur de classe)
        let eyeColor = classEyeColor(for: championClass)
        let leftPupil = SKShapeNode(circleOfRadius: 1.2)
        leftPupil.fillColor = eyeColor
        leftPupil.strokeColor = .clear
        leftPupil.position = CGPoint(x: -3, y: 29)
        leftPupil.zPosition = 4.3
        container.addChild(leftPupil)

        let rightPupil = SKShapeNode(circleOfRadius: 1.2)
        rightPupil.fillColor = eyeColor
        rightPupil.strokeColor = .clear
        rightPupil.position = CGPoint(x: 3, y: 29)
        rightPupil.zPosition = 4.3
        container.addChild(rightPupil)

        // Effet spécial yeux par classe
        if championClass == .radiant {
            // Yeux lumineux stormlight
            let eyeGlow = SKAction.repeatForever(SKAction.sequence([
                SKAction.run { leftPupil.glowWidth = 3 },
                SKAction.wait(forDuration: 2.0),
                SKAction.run { leftPupil.glowWidth = 1 },
                SKAction.wait(forDuration: 2.0)
            ]))
            leftPupil.run(eyeGlow)
            rightPupil.run(eyeGlow)
        } else if championClass == .elantrian {
            // Points lumineux sur la peau
            let glyphDot = SKShapeNode(circleOfRadius: 1)
            glyphDot.fillColor = SKColor(red: 0.9, green: 0.8, blue: 0.3, alpha: 0.5)
            glyphDot.strokeColor = .clear
            glyphDot.position = CGPoint(x: 5, y: 27)
            glyphDot.zPosition = 4.1
            container.addChild(glyphDot)

            let glow = SKAction.repeatForever(SKAction.sequence([
                SKAction.fadeAlpha(to: 0.2, duration: 1.5),
                SKAction.fadeAlpha(to: 0.7, duration: 1.5)
            ]))
            glyphDot.run(glow)
        }

        // Bouche
        let mouth = SKShapeNode(rectOf: CGSize(width: 3, height: 1), cornerRadius: 0.5)
        mouth.fillColor = SKColor(red: 0.6, green: 0.35, blue: 0.3, alpha: 0.7)
        mouth.strokeColor = .clear
        mouth.position = CGPoint(x: 0, y: 25)
        mouth.zPosition = 4.2
        container.addChild(mouth)
    }

    private static func classEyeColor(for championClass: ChampionClass) -> SKColor {
        switch championClass {
        case .mistborn:         return SKColor(red: 0.3, green: 0.35, blue: 0.5, alpha: 1)   // Gris-bleu
        case .radiant:          return SKColor(red: 0.3, green: 0.6, blue: 1.0, alpha: 1)     // Bleu lumineux
        case .awakener:         return SKColor(red: 0.6, green: 0.2, blue: 0.7, alpha: 1)     // Violet
        case .elantrian:        return SKColor(red: 0.8, green: 0.7, blue: 0.2, alpha: 1)     // Doré
        case .sandMaster:       return SKColor(red: 0.6, green: 0.5, blue: 0.2, alpha: 1)     // Ambre
        case .nightmarePainter: return SKColor(red: 0.2, green: 0.1, blue: 0.3, alpha: 1)     // Noir-violet
        }
    }

    private static func addHelmet(to container: SKNode, appearance: EquipmentVisualSystem.EquipmentAppearance, classColor: SKColor) {
        let style = appearance.helmetStyle
        guard style != .none else { return }
        let rarity = appearance.helmetRarity
        let rarityCol = EquipmentVisualSystem.skColor(for: rarity)

        switch style {
        case .none: break
        case .light:
            // Bandeau frontal
            let band = SKShapeNode(rectOf: CGSize(width: 14, height: 3), cornerRadius: 1)
            band.fillColor = SKColor(red: 0.4, green: 0.35, blue: 0.3, alpha: 1)
            band.strokeColor = rarityCol.withAlphaComponent(0.3)
            band.lineWidth = 0.5
            band.position = CGPoint(x: 0, y: 32)
            band.zPosition = 5
            container.addChild(band)

        case .medium:
            // Casque ouvert
            let helm = SKShapeNode(ellipseOf: CGSize(width: 16, height: 10))
            helm.fillColor = SKColor(red: 0.5, green: 0.45, blue: 0.4, alpha: 1)
            helm.strokeColor = rarityCol.withAlphaComponent(rarity.borderWidth * 0.3)
            helm.lineWidth = rarity.borderWidth
            helm.position = CGPoint(x: 0, y: 33)
            helm.zPosition = 5
            container.addChild(helm)

        case .heavy:
            // Casque intégral
            let helm = SKShapeNode(ellipseOf: CGSize(width: 17, height: 12))
            helm.fillColor = SKColor(red: 0.55, green: 0.55, blue: 0.6, alpha: 1)
            helm.strokeColor = rarityCol.withAlphaComponent(rarity.borderWidth * 0.3)
            helm.lineWidth = rarity.borderWidth
            helm.position = CGPoint(x: 0, y: 32)
            helm.zPosition = 5
            container.addChild(helm)

            // Visière
            let visor = SKShapeNode(rectOf: CGSize(width: 10, height: 2), cornerRadius: 1)
            visor.fillColor = SKColor(white: 0.15, alpha: 0.8)
            visor.strokeColor = .clear
            visor.position = CGPoint(x: 0, y: 29)
            visor.zPosition = 5.1
            container.addChild(visor)

            // Cimier
            let crest = SKShapeNode(rectOf: CGSize(width: 2, height: 8))
            crest.fillColor = rarityCol.withAlphaComponent(0.7)
            crest.strokeColor = .clear
            crest.position = CGPoint(x: 0, y: 39)
            crest.zPosition = 5.1
            container.addChild(crest)

        case .crown:
            // Couronne royale
            let crownBase = SKShapeNode(rectOf: CGSize(width: 16, height: 4), cornerRadius: 1)
            crownBase.fillColor = rarityCol
            crownBase.strokeColor = EquipmentVisualSystem.skAccentColor(for: rarity, alpha: 0.6)
            crownBase.lineWidth = 1
            crownBase.position = CGPoint(x: 0, y: 34)
            crownBase.zPosition = 5
            container.addChild(crownBase)

            // Pointes de couronne
            for xOff in [-5, -2, 1, 4] as [CGFloat] {
                let point = SKShapeNode(rectOf: CGSize(width: 2, height: 5))
                point.fillColor = rarityCol
                point.strokeColor = .clear
                point.position = CGPoint(x: xOff, y: 38)
                point.zPosition = 5.1
                container.addChild(point)
            }

            // Joyau central
            let gem = SKShapeNode(circleOfRadius: 2)
            gem.fillColor = EquipmentVisualSystem.skAccentColor(for: rarity, alpha: 0.9)
            gem.strokeColor = rarityCol.withAlphaComponent(0.5)
            gem.lineWidth = 0.5
            gem.position = CGPoint(x: 0, y: 35)
            gem.zPosition = 5.2
            container.addChild(gem)

            if rarity.glowIntensity > 0.3 {
                let shimmer = SKAction.repeatForever(SKAction.sequence([
                    SKAction.run { gem.glowWidth = 4 },
                    SKAction.wait(forDuration: 0.6),
                    SKAction.run { gem.glowWidth = 1 },
                    SKAction.wait(forDuration: 0.6)
                ]))
                gem.run(shimmer)
            }

        case .hood:
            // Capuchon mystique
            let hood = SKShapeNode(ellipseOf: CGSize(width: 18, height: 14))
            hood.fillColor = EquipmentVisualSystem.skColor(for: rarity, alpha: 0.8)
            hood.strokeColor = EquipmentVisualSystem.skAccentColor(for: rarity, alpha: 0.3)
            hood.lineWidth = 1
            hood.position = CGPoint(x: 0, y: 31)
            hood.zPosition = 5
            container.addChild(hood)

            // Ombre sous le capuchon
            let shadowInner = SKShapeNode(ellipseOf: CGSize(width: 12, height: 6))
            shadowInner.fillColor = SKColor(white: 0.05, alpha: 0.5)
            shadowInner.strokeColor = .clear
            shadowInner.position = CGPoint(x: 0, y: 29)
            shadowInner.zPosition = 5.1
            container.addChild(shadowInner)

            // Yeux brillants sous le capuchon
            if rarity.glowIntensity > 0.2 {
                for xOff in [-3, 3] as [CGFloat] {
                    let eyeGlow = SKShapeNode(circleOfRadius: 1.5)
                    eyeGlow.fillColor = EquipmentVisualSystem.skAccentColor(for: rarity, alpha: 0.8)
                    eyeGlow.strokeColor = .clear
                    eyeGlow.position = CGPoint(x: xOff, y: 29)
                    eyeGlow.zPosition = 5.2
                    container.addChild(eyeGlow)

                    let flicker = SKAction.repeatForever(SKAction.sequence([
                        SKAction.fadeAlpha(to: 0.4, duration: 1.2),
                        SKAction.fadeAlpha(to: 1.0, duration: 1.2)
                    ]))
                    eyeGlow.run(flicker)
                }
            }
        }
    }

    private static func addOffhand(to container: SKNode, appearance: EquipmentVisualSystem.EquipmentAppearance, classColor: SKColor) {
        let style = appearance.offhandStyle
        guard style != .none else { return }
        let rarity = appearance.offhandRarity
        let rarityCol = EquipmentVisualSystem.skColor(for: rarity)

        switch style {
        case .none: break
        case .buckler:
            let shield = SKShapeNode(circleOfRadius: 5)
            shield.fillColor = SKColor(red: 0.45, green: 0.35, blue: 0.25, alpha: 1)
            shield.strokeColor = rarityCol.withAlphaComponent(0.4)
            shield.lineWidth = 1
            shield.position = CGPoint(x: -12, y: 12)
            shield.zPosition = 6.5
            container.addChild(shield)

        case .shield:
            let shield = SKShapeNode(rectOf: CGSize(width: 8, height: 12), cornerRadius: 2)
            shield.fillColor = SKColor(red: 0.5, green: 0.5, blue: 0.55, alpha: 1)
            shield.strokeColor = rarityCol.withAlphaComponent(0.5)
            shield.lineWidth = rarity.borderWidth
            shield.position = CGPoint(x: -13, y: 12)
            shield.zPosition = 6.5
            container.addChild(shield)

            // Emblème central
            let emblem = SKShapeNode(circleOfRadius: 2)
            emblem.fillColor = rarityCol.withAlphaComponent(0.6)
            emblem.strokeColor = .clear
            shield.addChild(emblem)

        case .orb:
            let orb = SKShapeNode(circleOfRadius: 4)
            orb.fillColor = rarityCol.withAlphaComponent(0.5)
            orb.strokeColor = EquipmentVisualSystem.skAccentColor(for: rarity, alpha: 0.4)
            orb.lineWidth = 1
            orb.position = CGPoint(x: -12, y: 10)
            orb.zPosition = 6.5
            container.addChild(orb)

            let float = SKAction.repeatForever(SKAction.sequence([
                SKAction.moveBy(x: 0, y: 2, duration: 1.0),
                SKAction.moveBy(x: 0, y: -2, duration: 1.0)
            ]))
            orb.run(float)

            let glow = SKAction.repeatForever(SKAction.sequence([
                SKAction.run { orb.glowWidth = 4 },
                SKAction.wait(forDuration: 1.5),
                SKAction.run { orb.glowWidth = 1 },
                SKAction.wait(forDuration: 1.5)
            ]))
            orb.run(glow)

        case .tome:
            let book = SKShapeNode(rectOf: CGSize(width: 7, height: 9), cornerRadius: 1)
            book.fillColor = rarityCol.withAlphaComponent(0.8)
            book.strokeColor = EquipmentVisualSystem.skAccentColor(for: rarity, alpha: 0.4)
            book.lineWidth = 1
            book.position = CGPoint(x: -12, y: 10)
            book.zPosition = 6.5
            container.addChild(book)

            // Pages
            let pages = SKShapeNode(rectOf: CGSize(width: 5, height: 7))
            pages.fillColor = SKColor(red: 0.9, green: 0.85, blue: 0.75, alpha: 0.8)
            pages.strokeColor = .clear
            book.addChild(pages)

        case .relic:
            let relic = SKShapeNode(circleOfRadius: 5)
            relic.fillColor = rarityCol.withAlphaComponent(0.3)
            relic.strokeColor = rarityCol.withAlphaComponent(0.6)
            relic.lineWidth = 1.5
            relic.position = CGPoint(x: -12, y: 10)
            relic.zPosition = 6.5
            container.addChild(relic)

            // Symbole intérieur
            let inner = SKShapeNode(circleOfRadius: 2)
            inner.fillColor = EquipmentVisualSystem.skAccentColor(for: rarity, alpha: 0.9)
            inner.strokeColor = .clear
            relic.addChild(inner)

            // Orbite d'énergie
            let orbit = SKShapeNode(circleOfRadius: 7)
            orbit.fillColor = .clear
            orbit.strokeColor = rarityCol.withAlphaComponent(0.3)
            orbit.lineWidth = 0.5
            orbit.position = CGPoint(x: -12, y: 10)
            orbit.zPosition = 6.4
            container.addChild(orbit)

            let rotate = SKAction.repeatForever(SKAction.rotate(byAngle: .pi * 2, duration: 4.0))
            orbit.run(rotate)
        }
    }

    private static func addAmuletGlow(to container: SKNode, rarity: ItemRarity) {
        let rarityCol = EquipmentVisualSystem.skColor(for: rarity)
        let amulet = SKShapeNode(circleOfRadius: 2.5)
        amulet.fillColor = rarityCol.withAlphaComponent(0.7)
        amulet.strokeColor = EquipmentVisualSystem.skAccentColor(for: rarity, alpha: 0.5)
        amulet.lineWidth = 0.5
        amulet.position = CGPoint(x: 0, y: 22)
        amulet.zPosition = 7
        container.addChild(amulet)

        // Chaîne
        let chain = SKShapeNode(rectOf: CGSize(width: 8, height: 0.5))
        chain.fillColor = SKColor(red: 0.7, green: 0.6, blue: 0.3, alpha: 0.5)
        chain.strokeColor = .clear
        chain.position = CGPoint(x: 0, y: 23)
        chain.zPosition = 6.9
        container.addChild(chain)

        if rarity.glowIntensity > 0.2 {
            let glow = SKAction.repeatForever(SKAction.sequence([
                SKAction.run { amulet.glowWidth = 3 },
                SKAction.wait(forDuration: 2.0),
                SKAction.run { amulet.glowWidth = 1 },
                SKAction.wait(forDuration: 2.0)
            ]))
            amulet.run(glow)
        }
    }

    private static func addRingEffects(to container: SKNode, count: Int, rarity: ItemRarity) {
        guard rarity.glowIntensity > 0.1 else { return }

        // Petites particules autour des mains
        let handPositions: [CGPoint] = [
            CGPoint(x: -10, y: 6),  // Main gauche
            CGPoint(x: 12, y: 6)    // Main droite
        ]

        for i in 0..<min(count, 2) {
            let sparkle = SKShapeNode(circleOfRadius: 1.5)
            sparkle.fillColor = EquipmentVisualSystem.skAccentColor(for: rarity, alpha: 0.6)
            sparkle.strokeColor = .clear
            sparkle.position = handPositions[i]
            sparkle.zPosition = 7.5
            container.addChild(sparkle)

            let twinkle = SKAction.repeatForever(SKAction.sequence([
                SKAction.fadeAlpha(to: 0.2, duration: 0.5 + Double(i) * 0.3),
                SKAction.fadeAlpha(to: 0.8, duration: 0.5 + Double(i) * 0.3)
            ]))
            sparkle.run(twinkle)
        }
    }

    // MARK: - Weapon Rendering (Enhanced)

    private static func createWeapon(for championClass: ChampionClass, appearance: EquipmentVisualSystem.EquipmentAppearance) -> SKNode {
        let weapon = SKNode()
        let weaponStyle = appearance.weaponStyle
        let rarity = appearance.weaponRarity
        let rarityCol = EquipmentVisualSystem.skColor(for: rarity)
        let accentCol = EquipmentVisualSystem.skAccentColor(for: rarity)

        // Facteur de taille selon rareté
        let sizeMult: CGFloat = 1.0 + rarity.glowIntensity * 0.3

        switch championClass {
        case .mistborn:
            // Dague / lame de verre
            let bladeH: CGFloat = 14 * sizeMult
            let blade = SKShapeNode(rectOf: CGSize(width: 2 * sizeMult, height: bladeH))
            blade.fillColor = weaponStyle == .classDefault
                ? SKColor(red: 0.6, green: 0.6, blue: 0.7, alpha: 0.9)
                : rarityCol.withAlphaComponent(0.85)
            blade.strokeColor = weaponStyle == .classDefault
                ? SKColor(white: 0.8, alpha: 0.5)
                : accentCol.withAlphaComponent(0.5)
            blade.lineWidth = max(0.5, rarity.borderWidth * 0.5)
            blade.position = CGPoint(x: 0, y: bladeH / 2)
            weapon.addChild(blade)

            let guard_ = SKShapeNode(rectOf: CGSize(width: 6 * sizeMult, height: 2))
            guard_.fillColor = weaponStyle == .classDefault
                ? SKColor(red: 0.4, green: 0.35, blue: 0.3, alpha: 1)
                : rarityCol.withAlphaComponent(0.7)
            guard_.strokeColor = .clear
            weapon.addChild(guard_)

            if rarity.glowIntensity > 0.2 {
                let glow = SKAction.repeatForever(SKAction.sequence([
                    SKAction.run { blade.glowWidth = CGFloat(3) * rarity.glowIntensity },
                    SKAction.wait(forDuration: 1.0),
                    SKAction.run { blade.glowWidth = 1 },
                    SKAction.wait(forDuration: 1.0)
                ]))
                blade.run(glow)
            }

        case .radiant:
            // Shardblade
            let bladeH: CGFloat = 18 * sizeMult
            let bladeW: CGFloat = 3 * sizeMult
            let blade = SKShapeNode(rectOf: CGSize(width: bladeW, height: bladeH))
            blade.fillColor = weaponStyle == .classDefault
                ? SKColor(red: 0.7, green: 0.8, blue: 1.0, alpha: 0.85)
                : rarityCol.withAlphaComponent(0.8)
            blade.strokeColor = weaponStyle == .classDefault
                ? SKColor(red: 0.5, green: 0.7, blue: 1.0, alpha: 0.5)
                : accentCol.withAlphaComponent(0.5)
            blade.lineWidth = max(1, rarity.borderWidth)
            blade.position = CGPoint(x: 0, y: bladeH / 2)
            blade.name = "shardBlade"
            weapon.addChild(blade)

            // Pointe de lame
            let tip = SKShapeNode(rectOf: CGSize(width: bladeW * 0.6, height: 4))
            tip.fillColor = blade.fillColor
            tip.strokeColor = .clear
            tip.position = CGPoint(x: 0, y: bladeH + 1)
            weapon.addChild(tip)

            let pulse = SKAction.repeatForever(SKAction.sequence([
                SKAction.run { blade.glowWidth = 4 * rarity.glowIntensity + 2 },
                SKAction.wait(forDuration: 0.8),
                SKAction.run { blade.glowWidth = 1 },
                SKAction.wait(forDuration: 0.8)
            ]))
            blade.run(pulse)

        case .awakener:
            // Fouet de tissu animé
            let clothH: CGFloat = 16 * sizeMult
            let cloth = SKShapeNode(rectOf: CGSize(width: 2.5, height: clothH))
            cloth.fillColor = weaponStyle == .classDefault
                ? SKColor(red: 0.7, green: 0.3, blue: 0.5, alpha: 0.9)
                : rarityCol.withAlphaComponent(0.85)
            cloth.strokeColor = .clear
            cloth.position = CGPoint(x: 0, y: clothH / 2)
            weapon.addChild(cloth)

            // Extrémité colorée (BioChroma)
            let tip = SKShapeNode(circleOfRadius: 2 * sizeMult)
            tip.fillColor = weaponStyle == .classDefault
                ? SKColor(red: 0.9, green: 0.4, blue: 0.6, alpha: 0.8)
                : accentCol.withAlphaComponent(0.8)
            tip.strokeColor = .clear
            tip.position = CGPoint(x: 0, y: clothH)
            weapon.addChild(tip)

            if rarity.glowIntensity > 0.2 {
                // Aura BioChroma
                let hue = SKShapeNode(circleOfRadius: 4)
                hue.fillColor = accentCol.withAlphaComponent(0.15)
                hue.strokeColor = .clear
                hue.position = CGPoint(x: 0, y: clothH / 2)
                weapon.addChild(hue)

                let shimmer = SKAction.repeatForever(SKAction.sequence([
                    SKAction.fadeAlpha(to: 0.1, duration: 0.8),
                    SKAction.fadeAlpha(to: 0.3, duration: 0.8)
                ]))
                hue.run(shimmer)
            }

        case .elantrian:
            // Staff avec orbe d'Aon
            let staffH: CGFloat = 20 * sizeMult
            let staff = SKShapeNode(rectOf: CGSize(width: 2, height: staffH))
            staff.fillColor = weaponStyle == .classDefault
                ? SKColor(red: 0.5, green: 0.4, blue: 0.2, alpha: 1)
                : SKColor(red: 0.4, green: 0.35, blue: 0.25, alpha: 1)
            staff.strokeColor = .clear
            staff.position = CGPoint(x: 0, y: staffH / 2)
            weapon.addChild(staff)

            // Bagues décoratives sur le bâton
            if weaponStyle != .classDefault {
                for yOff in [staffH * 0.3, staffH * 0.6] {
                    let ring = SKShapeNode(rectOf: CGSize(width: 4, height: 2), cornerRadius: 0.5)
                    ring.fillColor = rarityCol.withAlphaComponent(0.6)
                    ring.strokeColor = .clear
                    ring.position = CGPoint(x: 0, y: yOff)
                    weapon.addChild(ring)
                }
            }

            let orbR: CGFloat = 3 * sizeMult
            let orb = SKShapeNode(circleOfRadius: orbR)
            orb.fillColor = weaponStyle == .classDefault
                ? SKColor(red: 0.9, green: 0.8, blue: 0.3, alpha: 0.7)
                : rarityCol.withAlphaComponent(0.7)
            orb.strokeColor = accentCol.withAlphaComponent(0.3)
            orb.lineWidth = 0.5
            orb.position = CGPoint(x: 0, y: staffH + orbR)
            weapon.addChild(orb)

            let glow = SKAction.repeatForever(SKAction.sequence([
                SKAction.fadeAlpha(to: 0.4, duration: 1.0),
                SKAction.fadeAlpha(to: 0.9, duration: 1.0)
            ]))
            orb.run(glow)

            // Aon flottant pour épique+
            if rarity.glowIntensity > 0.3 {
                let aon = SKShapeNode(circleOfRadius: orbR + 3)
                aon.fillColor = .clear
                aon.strokeColor = accentCol.withAlphaComponent(0.3)
                aon.lineWidth = 0.5
                aon.position = CGPoint(x: 0, y: staffH + orbR)
                weapon.addChild(aon)

                let rotate = SKAction.repeatForever(SKAction.rotate(byAngle: .pi * 2, duration: 6.0))
                aon.run(rotate)
            }

        case .sandMaster:
            // Ruban de sable
            let ribbonH: CGFloat = 14 * sizeMult
            let ribbon = SKShapeNode(rectOf: CGSize(width: 3 * sizeMult, height: ribbonH))
            ribbon.fillColor = weaponStyle == .classDefault
                ? SKColor(red: 0.8, green: 0.7, blue: 0.4, alpha: 0.8)
                : rarityCol.withAlphaComponent(0.8)
            ribbon.strokeColor = .clear
            ribbon.position = CGPoint(x: 0, y: ribbonH / 2)
            weapon.addChild(ribbon)

            // Grains de sable flottants
            if rarity.glowIntensity > 0.1 {
                for i in 0..<3 {
                    let grain = SKShapeNode(circleOfRadius: 1)
                    grain.fillColor = accentCol.withAlphaComponent(0.6)
                    grain.strokeColor = .clear
                    grain.position = CGPoint(x: CGFloat(i - 1) * 3, y: ribbonH + CGFloat(i) * 2)
                    weapon.addChild(grain)

                    let float = SKAction.repeatForever(SKAction.sequence([
                        SKAction.moveBy(x: 0, y: 3, duration: 0.5 + Double(i) * 0.2),
                        SKAction.moveBy(x: 0, y: -3, duration: 0.5 + Double(i) * 0.2)
                    ]))
                    grain.run(float)
                }
            }

            let wave = SKAction.repeatForever(SKAction.sequence([
                SKAction.rotate(byAngle: 0.1, duration: 0.3),
                SKAction.rotate(byAngle: -0.1, duration: 0.3)
            ]))
            ribbon.run(wave)

        case .nightmarePainter:
            // Pinceau d'encre de cauchemar
            let handleH: CGFloat = 14 * sizeMult
            let handle = SKShapeNode(rectOf: CGSize(width: 2, height: handleH))
            handle.fillColor = weaponStyle == .classDefault
                ? SKColor(red: 0.3, green: 0.2, blue: 0.15, alpha: 1)
                : SKColor(red: 0.25, green: 0.18, blue: 0.12, alpha: 1)
            handle.strokeColor = .clear
            handle.position = CGPoint(x: 0, y: handleH / 2)
            weapon.addChild(handle)

            // Pointe du pinceau
            let tipSize: CGFloat = 4 * sizeMult
            let tip = SKShapeNode(ellipseOf: CGSize(width: tipSize + 1, height: tipSize))
            tip.fillColor = weaponStyle == .classDefault
                ? SKColor(red: 0.1, green: 0.05, blue: 0.15, alpha: 0.9)
                : rarityCol.withAlphaComponent(0.9)
            tip.strokeColor = .clear
            tip.position = CGPoint(x: 0, y: handleH + tipSize / 2)
            weapon.addChild(tip)

            // Gouttes d'encre qui tombent
            if rarity.glowIntensity > 0.2 {
                let droplet = SKShapeNode(circleOfRadius: 1.5)
                droplet.fillColor = rarityCol.withAlphaComponent(0.6)
                droplet.strokeColor = .clear
                droplet.position = CGPoint(x: 1, y: handleH + tipSize + 2)
                weapon.addChild(droplet)

                let drip = SKAction.repeatForever(SKAction.sequence([
                    SKAction.moveBy(x: 0, y: -4, duration: 0.6),
                    SKAction.fadeOut(withDuration: 0.2),
                    SKAction.moveBy(x: 0, y: 4, duration: 0),
                    SKAction.fadeIn(withDuration: 0.1)
                ]))
                droplet.run(drip)
            }
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

    static func playAttackAnimation(on playerNode: SKNode, in worldNode: SKNode) {
        guard let weapon = playerNode.childNode(withName: "weapon") else { return }

        let swing = SKAction.sequence([
            SKAction.rotate(byAngle: -1.2, duration: 0.08),
            SKAction.rotate(byAngle: 1.2, duration: 0.12)
        ])
        weapon.run(swing)

        let lunge = SKAction.sequence([
            SKAction.moveBy(x: 4, y: 0, duration: 0.06),
            SKAction.moveBy(x: -4, y: 0, duration: 0.1)
        ])
        playerNode.run(lunge)

        // Arc de slash avec couleur d'équipement
        let slash = SKShapeNode()
        let path = CGMutablePath()
        path.addArc(center: .zero, radius: 28, startAngle: -.pi / 4, endAngle: .pi / 4, clockwise: false)
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

    // MARK: - Walk Animation

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

    // MARK: - Refresh Equipment Visuals

    /// Reconstruit le sprite du joueur quand l'équipement change
    static func refreshPlayerAppearance(playerNode: SKNode, champion: Champion) {
        let position = playerNode.position
        let zPos = playerNode.zPosition
        let parent = playerNode.parent

        playerNode.removeFromParent()

        let newNode = createPlayerNode(champion: champion)
        newNode.position = position
        newNode.zPosition = zPos
        newNode.name = "player"
        parent?.addChild(newNode)
    }
}
