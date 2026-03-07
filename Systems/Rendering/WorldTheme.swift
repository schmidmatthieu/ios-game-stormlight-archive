import SpriteKit

/// Thèmes visuels par monde — couleurs, décorations, ambiance, textures enrichies
struct WorldTheme {
    let tileBaseColor: SKColor
    let tileVariations: [SKColor]
    let fogColor: SKColor
    let fogAlpha: CGFloat
    let particleColor: SKColor
    let edgeGlowColor: SKColor
    let decorationTypes: [DecorationType]
    /// Couleur d'accent pour les détails de tiles
    let tileAccentColor: SKColor
    /// Motif de texture sur les tiles (crack, moss, sand, etc.)
    let tilePatternType: TilePattern

    enum TilePattern {
        case cracks     // Scadrial
        case stoneSlabs // Roshar
        case sandWaves  // Taldain
        case grassPatches // Nalthis
        case glyphMarks // Sel
        case inkStains  // Komashi
        case glassShards // Shadesmar
    }

    enum DecorationType {
        case ashPile, deadTree, metalShard, ruinedWall, ashVent         // Scadrial
        case rockFormation, stormPost, chasmmoss, rockbud, stormSpren   // Roshar
        case sandDune, cactus, oasis, sandRock, sandWhirl               // Taldain
        case flower, garden, statue, fountain, coloredBanner            // Nalthis
        case beadPile, flamespren, glassTree, shardPillar, cognitiveRift // Shadesmar
        case inkBlot, paperLantern, nightmareResidue, brush, dreamCatcher // Komashi
        case aonGlyph, stoneColumn, mossCluster, shrine, lightWell      // Sel
    }

    static func theme(for worldID: String) -> WorldTheme {
        switch worldID {
        case "scadrial":
            return WorldTheme(
                tileBaseColor: SKColor(red: 0.18, green: 0.15, blue: 0.13, alpha: 1),
                tileVariations: [
                    SKColor(red: 0.20, green: 0.17, blue: 0.14, alpha: 1),
                    SKColor(red: 0.16, green: 0.13, blue: 0.11, alpha: 1),
                    SKColor(red: 0.22, green: 0.18, blue: 0.15, alpha: 1),
                    SKColor(red: 0.19, green: 0.16, blue: 0.12, alpha: 1),
                ],
                fogColor: SKColor(white: 0.6, alpha: 1),
                fogAlpha: 0.15,
                particleColor: SKColor(white: 0.7, alpha: 1),
                edgeGlowColor: SKColor(red: 0.4, green: 0.3, blue: 0.2, alpha: 1),
                decorationTypes: [.ashPile, .deadTree, .metalShard, .ruinedWall, .ashVent],
                tileAccentColor: SKColor(red: 0.3, green: 0.25, blue: 0.2, alpha: 0.3),
                tilePatternType: .cracks
            )
        case "roshar":
            return WorldTheme(
                tileBaseColor: SKColor(red: 0.15, green: 0.18, blue: 0.22, alpha: 1),
                tileVariations: [
                    SKColor(red: 0.17, green: 0.20, blue: 0.24, alpha: 1),
                    SKColor(red: 0.13, green: 0.16, blue: 0.20, alpha: 1),
                    SKColor(red: 0.19, green: 0.22, blue: 0.26, alpha: 1),
                    SKColor(red: 0.16, green: 0.19, blue: 0.23, alpha: 1),
                ],
                fogColor: SKColor(red: 0.5, green: 0.6, blue: 0.7, alpha: 1),
                fogAlpha: 0.1,
                particleColor: SKColor(red: 0.6, green: 0.8, blue: 0.5, alpha: 1),
                edgeGlowColor: SKColor(red: 0.3, green: 0.5, blue: 0.7, alpha: 1),
                decorationTypes: [.rockFormation, .stormPost, .chasmmoss, .rockbud, .stormSpren],
                tileAccentColor: SKColor(red: 0.25, green: 0.3, blue: 0.4, alpha: 0.25),
                tilePatternType: .stoneSlabs
            )
        case "taldain":
            return WorldTheme(
                tileBaseColor: SKColor(red: 0.28, green: 0.24, blue: 0.16, alpha: 1),
                tileVariations: [
                    SKColor(red: 0.30, green: 0.26, blue: 0.18, alpha: 1),
                    SKColor(red: 0.26, green: 0.22, blue: 0.14, alpha: 1),
                    SKColor(red: 0.32, green: 0.28, blue: 0.20, alpha: 1),
                    SKColor(red: 0.29, green: 0.25, blue: 0.17, alpha: 1),
                ],
                fogColor: SKColor(red: 0.8, green: 0.7, blue: 0.5, alpha: 1),
                fogAlpha: 0.08,
                particleColor: SKColor(red: 0.9, green: 0.8, blue: 0.4, alpha: 1),
                edgeGlowColor: SKColor(red: 0.7, green: 0.6, blue: 0.3, alpha: 1),
                decorationTypes: [.sandDune, .cactus, .oasis, .sandRock, .sandWhirl],
                tileAccentColor: SKColor(red: 0.4, green: 0.35, blue: 0.2, alpha: 0.2),
                tilePatternType: .sandWaves
            )
        case "nalthis":
            return WorldTheme(
                tileBaseColor: SKColor(red: 0.1, green: 0.18, blue: 0.12, alpha: 1),
                tileVariations: [
                    SKColor(red: 0.12, green: 0.20, blue: 0.14, alpha: 1),
                    SKColor(red: 0.08, green: 0.16, blue: 0.10, alpha: 1),
                    SKColor(red: 0.14, green: 0.22, blue: 0.16, alpha: 1),
                    SKColor(red: 0.11, green: 0.19, blue: 0.13, alpha: 1),
                ],
                fogColor: SKColor(red: 0.3, green: 0.6, blue: 0.4, alpha: 1),
                fogAlpha: 0.06,
                particleColor: SKColor(red: 0.4, green: 0.9, blue: 0.5, alpha: 1),
                edgeGlowColor: SKColor(red: 0.3, green: 0.7, blue: 0.4, alpha: 1),
                decorationTypes: [.flower, .garden, .statue, .fountain, .coloredBanner],
                tileAccentColor: SKColor(red: 0.15, green: 0.3, blue: 0.18, alpha: 0.3),
                tilePatternType: .grassPatches
            )
        case "sel":
            return WorldTheme(
                tileBaseColor: SKColor(red: 0.22, green: 0.20, blue: 0.16, alpha: 1),
                tileVariations: [
                    SKColor(red: 0.24, green: 0.22, blue: 0.18, alpha: 1),
                    SKColor(red: 0.20, green: 0.18, blue: 0.14, alpha: 1),
                    SKColor(red: 0.26, green: 0.24, blue: 0.20, alpha: 1),
                    SKColor(red: 0.23, green: 0.21, blue: 0.17, alpha: 1),
                ],
                fogColor: SKColor(red: 0.8, green: 0.7, blue: 0.3, alpha: 1),
                fogAlpha: 0.05,
                particleColor: SKColor(red: 0.9, green: 0.8, blue: 0.3, alpha: 1),
                edgeGlowColor: SKColor(red: 0.7, green: 0.6, blue: 0.2, alpha: 1),
                decorationTypes: [.aonGlyph, .stoneColumn, .mossCluster, .shrine, .lightWell],
                tileAccentColor: SKColor(red: 0.5, green: 0.45, blue: 0.25, alpha: 0.2),
                tilePatternType: .glyphMarks
            )
        case "komashi":
            return WorldTheme(
                tileBaseColor: SKColor(red: 0.12, green: 0.08, blue: 0.18, alpha: 1),
                tileVariations: [
                    SKColor(red: 0.14, green: 0.10, blue: 0.20, alpha: 1),
                    SKColor(red: 0.10, green: 0.06, blue: 0.16, alpha: 1),
                    SKColor(red: 0.16, green: 0.12, blue: 0.22, alpha: 1),
                    SKColor(red: 0.13, green: 0.09, blue: 0.19, alpha: 1),
                ],
                fogColor: SKColor(red: 0.4, green: 0.2, blue: 0.5, alpha: 1),
                fogAlpha: 0.12,
                particleColor: SKColor(red: 0.8, green: 0.3, blue: 0.6, alpha: 1),
                edgeGlowColor: SKColor(red: 0.5, green: 0.2, blue: 0.6, alpha: 1),
                decorationTypes: [.inkBlot, .paperLantern, .nightmareResidue, .brush, .dreamCatcher],
                tileAccentColor: SKColor(red: 0.25, green: 0.1, blue: 0.3, alpha: 0.3),
                tilePatternType: .inkStains
            )
        default: // Shadesmar
            return WorldTheme(
                tileBaseColor: SKColor(red: 0.08, green: 0.05, blue: 0.15, alpha: 1),
                tileVariations: [
                    SKColor(red: 0.10, green: 0.07, blue: 0.17, alpha: 1),
                    SKColor(red: 0.06, green: 0.03, blue: 0.13, alpha: 1),
                    SKColor(red: 0.12, green: 0.09, blue: 0.19, alpha: 1),
                ],
                fogColor: SKColor(red: 0.3, green: 0.1, blue: 0.5, alpha: 1),
                fogAlpha: 0.18,
                particleColor: SKColor(red: 0.6, green: 0.3, blue: 0.8, alpha: 1),
                edgeGlowColor: SKColor(red: 0.4, green: 0.1, blue: 0.6, alpha: 1),
                decorationTypes: [.beadPile, .flamespren, .glassTree, .shardPillar, .cognitiveRift],
                tileAccentColor: SKColor(red: 0.2, green: 0.1, blue: 0.35, alpha: 0.3),
                tilePatternType: .glassShards
            )
        }
    }
}

// MARK: - Enhanced Tile Texture Generator

final class TileTextureGenerator {

    /// Crée des textures de tile enrichies avec motifs, bordures et détails
    static func createTileTextures(theme: WorldTheme, tileSize: CGSize) -> [SKTexture] {
        let view = SKView()
        var textures: [SKTexture] = []

        let allColors = [theme.tileBaseColor] + theme.tileVariations
        for (index, color) in allColors.enumerated() {
            let tileNode = SKNode()

            // Base tile
            let base = SKShapeNode(rectOf: CGSize(width: tileSize.width - 2, height: tileSize.height - 2))
            base.fillColor = color
            base.strokeColor = SKColor(white: 0.3, alpha: 0.25)
            base.lineWidth = 0.5
            tileNode.addChild(base)

            // Inner border (subtile)
            let innerBorder = SKShapeNode(rectOf: CGSize(width: tileSize.width - 6, height: tileSize.height - 6))
            innerBorder.fillColor = .clear
            innerBorder.strokeColor = theme.tileAccentColor.withAlphaComponent(0.15)
            innerBorder.lineWidth = 0.5
            tileNode.addChild(innerBorder)

            // Pattern overlay based on world type
            addTilePattern(to: tileNode, pattern: theme.tilePatternType,
                          accentColor: theme.tileAccentColor, tileSize: tileSize, seed: index)

            // Corner detail (alternating tiles)
            if index % 2 == 0 {
                let corner = SKShapeNode(rectOf: CGSize(width: 4, height: 4))
                corner.fillColor = theme.tileAccentColor.withAlphaComponent(0.1)
                corner.strokeColor = .clear
                corner.position = CGPoint(x: -tileSize.width / 2 + 4, y: -tileSize.height / 2 + 4)
                tileNode.addChild(corner)
            }

            // Edge highlight (top-left)
            let highlight = SKShapeNode(rectOf: CGSize(width: tileSize.width - 4, height: 1))
            highlight.fillColor = SKColor(white: 1, alpha: 0.06)
            highlight.strokeColor = .clear
            highlight.position = CGPoint(x: 0, y: tileSize.height / 2 - 3)
            tileNode.addChild(highlight)

            // Shadow edge (bottom-right)
            let shadowEdge = SKShapeNode(rectOf: CGSize(width: tileSize.width - 4, height: 1))
            shadowEdge.fillColor = SKColor(white: 0, alpha: 0.08)
            shadowEdge.strokeColor = .clear
            shadowEdge.position = CGPoint(x: 0, y: -tileSize.height / 2 + 3)
            tileNode.addChild(shadowEdge)

            if let tex = view.texture(from: base, crop: CGRect(origin: CGPoint(x: -tileSize.width / 2, y: -tileSize.height / 2), size: tileSize)) {
                textures.append(tex)
            } else if let tex = view.texture(from: base) {
                textures.append(tex)
            }
        }

        if textures.isEmpty {
            let fallback = SKShapeNode(rectOf: CGSize(width: tileSize.width - 2, height: tileSize.height - 2))
            fallback.fillColor = theme.tileBaseColor
            fallback.strokeColor = SKColor(white: 0.3, alpha: 0.3)
            fallback.lineWidth = 0.5
            textures.append(view.texture(from: fallback) ?? SKTexture())
        }

        return textures
    }

    private static func addTilePattern(to node: SKNode, pattern: WorldTheme.TilePattern,
                                       accentColor: SKColor, tileSize: CGSize, seed: Int) {
        switch pattern {
        case .cracks:
            // Fissures dans la pierre (Scadrial)
            let crackCount = 1 + seed % 2
            for i in 0..<crackCount {
                let length = CGFloat(4 + (seed * 3 + i * 7) % 8)
                let crack = SKShapeNode(rectOf: CGSize(width: 0.5, height: length))
                crack.fillColor = SKColor(white: 0.1, alpha: 0.25)
                crack.strokeColor = .clear
                crack.position = CGPoint(
                    x: CGFloat((seed * 5 + i * 11) % Int(tileSize.width - 8)) - tileSize.width / 2 + 4,
                    y: CGFloat((seed * 7 + i * 13) % Int(tileSize.height - 6)) - tileSize.height / 2 + 3
                )
                crack.zRotation = CGFloat((seed * 3 + i * 5) % 10) / 10.0 - 0.5
                node.addChild(crack)
            }

            // Tache de cendre
            if seed % 3 == 0 {
                let ash = SKShapeNode(ellipseOf: CGSize(width: 6, height: 3))
                ash.fillColor = SKColor(white: 0.2, alpha: 0.15)
                ash.strokeColor = .clear
                ash.position = CGPoint(x: CGFloat(seed % 7) - 3, y: CGFloat(seed % 5) - 2)
                node.addChild(ash)
            }

        case .stoneSlabs:
            // Dalles de pierre (Roshar)
            let jointH = SKShapeNode(rectOf: CGSize(width: tileSize.width - 8, height: 0.5))
            jointH.fillColor = SKColor(white: 0.15, alpha: 0.2)
            jointH.strokeColor = .clear
            jointH.position = CGPoint(x: CGFloat(seed % 5) - 2, y: 0)
            node.addChild(jointH)

            if seed % 2 == 0 {
                let jointV = SKShapeNode(rectOf: CGSize(width: 0.5, height: tileSize.height - 6))
                jointV.fillColor = SKColor(white: 0.15, alpha: 0.15)
                jointV.strokeColor = .clear
                jointV.position = CGPoint(x: CGFloat(seed % 8) - 4, y: 0)
                node.addChild(jointV)
            }

            // Petite mousse dans les joints
            if seed % 4 == 0 {
                let moss = SKShapeNode(ellipseOf: CGSize(width: 3, height: 2))
                moss.fillColor = SKColor(red: 0.2, green: 0.35, blue: 0.2, alpha: 0.2)
                moss.strokeColor = .clear
                moss.position = CGPoint(x: CGFloat(seed % 6) - 3, y: 1)
                node.addChild(moss)
            }

        case .sandWaves:
            // Ondulations de sable (Taldain)
            for i in 0..<2 {
                let wave = SKShapeNode(rectOf: CGSize(width: tileSize.width - 6, height: 0.5))
                wave.fillColor = accentColor.withAlphaComponent(0.15)
                wave.strokeColor = .clear
                wave.position = CGPoint(x: 0, y: CGFloat(i * 6 - 3))
                wave.zRotation = 0.05 * CGFloat(seed % 3)
                node.addChild(wave)
            }

            // Grains de sable brillants
            if seed % 2 == 0 {
                let grain = SKShapeNode(circleOfRadius: 0.5)
                grain.fillColor = SKColor(red: 0.9, green: 0.85, blue: 0.6, alpha: 0.3)
                grain.strokeColor = .clear
                grain.position = CGPoint(x: CGFloat(seed % 8) - 4, y: CGFloat(seed % 6) - 3)
                node.addChild(grain)
            }

        case .grassPatches:
            // Touffes d'herbe (Nalthis)
            if seed % 2 == 0 {
                for i in 0..<2 {
                    let grass = SKShapeNode(rectOf: CGSize(width: 1, height: 3))
                    grass.fillColor = SKColor(red: 0.15, green: 0.35 + CGFloat(i) * 0.05, blue: 0.15, alpha: 0.25)
                    grass.strokeColor = .clear
                    grass.position = CGPoint(x: CGFloat(i * 4 - 2 + seed % 3), y: CGFloat(seed % 4) - 2)
                    grass.zRotation = CGFloat(i) * 0.2 - 0.1
                    node.addChild(grass)
                }
            }

            // Petite fleur occasionnelle
            if seed % 5 == 0 {
                let petal = SKShapeNode(circleOfRadius: 1.5)
                let hue = CGFloat(seed % 100) / 100.0
                petal.fillColor = SKColor(hue: hue, saturation: 0.7, brightness: 0.8, alpha: 0.25)
                petal.strokeColor = .clear
                petal.position = CGPoint(x: CGFloat(seed % 6) - 3, y: CGFloat(seed % 5) - 2)
                node.addChild(petal)
            }

        case .glyphMarks:
            // Traces de glyphes anciens (Sel)
            if seed % 3 == 0 {
                let glyph = SKShapeNode(circleOfRadius: 3)
                glyph.fillColor = .clear
                glyph.strokeColor = accentColor.withAlphaComponent(0.12)
                glyph.lineWidth = 0.5
                glyph.position = CGPoint(x: CGFloat(seed % 6) - 3, y: 0)
                node.addChild(glyph)

                // Ligne de connexion
                let line = SKShapeNode(rectOf: CGSize(width: 4, height: 0.5))
                line.fillColor = accentColor.withAlphaComponent(0.1)
                line.strokeColor = .clear
                line.position = CGPoint(x: CGFloat(seed % 6) - 3 + 4, y: 0)
                node.addChild(line)
            }

        case .inkStains:
            // Taches d'encre (Komashi)
            if seed % 2 == 0 {
                let stain = SKShapeNode(ellipseOf: CGSize(width: CGFloat(3 + seed % 4), height: CGFloat(2 + seed % 3)))
                stain.fillColor = SKColor(red: 0.08, green: 0.03, blue: 0.12, alpha: 0.2)
                stain.strokeColor = .clear
                stain.position = CGPoint(x: CGFloat(seed % 8) - 4, y: CGFloat(seed % 6) - 3)
                node.addChild(stain)
            }

            // Trace de pinceau
            if seed % 4 == 1 {
                let stroke = SKShapeNode(rectOf: CGSize(width: 6, height: 1))
                stroke.fillColor = accentColor.withAlphaComponent(0.15)
                stroke.strokeColor = .clear
                stroke.position = CGPoint(x: 0, y: CGFloat(seed % 4) - 2)
                stroke.zRotation = CGFloat(seed % 6) / 6.0 - 0.5
                node.addChild(stroke)
            }

        case .glassShards:
            // Éclats de verre (Shadesmar)
            if seed % 2 == 0 {
                let shard = SKShapeNode(rectOf: CGSize(width: 2, height: 4))
                shard.fillColor = accentColor.withAlphaComponent(0.2)
                shard.strokeColor = SKColor(red: 0.5, green: 0.3, blue: 0.7, alpha: 0.15)
                shard.lineWidth = 0.5
                shard.position = CGPoint(x: CGFloat(seed % 7) - 3, y: CGFloat(seed % 5) - 2)
                shard.zRotation = CGFloat(seed % 8) / 8.0 * .pi
                node.addChild(shard)
            }
        }
    }
}

// MARK: - Enhanced Decoration Renderer

final class DecorationRenderer {

    static func placeDecorations(on worldNode: SKNode, zone: Zone, theme: WorldTheme, isoPosition: (Int, Int) -> CGPoint) {
        var rng = SeededRNG(seed: zone.id.hashValue)
        let decorationCount = (zone.gridWidth * zone.gridHeight) / 15 // Densité augmentée

        for _ in 0..<decorationCount {
            let col = Int(rng.next() % UInt64(zone.gridWidth))
            let row = Int(rng.next() % UInt64(zone.gridHeight))

            let pos = GridPosition(col: col, row: row)
            if pos == zone.playerSpawnPosition { continue }
            if zone.connections.contains(where: { $0.exitPosition == pos }) { continue }
            if zone.npcSpawns.contains(where: { $0.position == pos }) { continue }
            if zone.enemySpawns.contains(where: { $0.position == pos }) { continue }

            guard let decoType = theme.decorationTypes.randomElement() else { continue }
            let node = createDecoration(type: decoType, rng: &rng)
            node.position = isoPosition(col, row)
            node.zPosition = CGFloat(-row - col) + 0.5
            worldNode.addChild(node)
        }
    }

    private static func createDecoration(type: WorldTheme.DecorationType, rng: inout SeededRNG) -> SKNode {
        let container = SKNode()
        let scale = 0.6 + Double(rng.next() % 40) / 100.0

        switch type {
        // --- Scadrial (amélioré) ---
        case .ashPile:
            let pile = SKShapeNode(ellipseOf: CGSize(width: 14, height: 6))
            pile.fillColor = SKColor(white: 0.25, alpha: 0.7)
            pile.strokeColor = .clear
            container.addChild(pile)
            // Couche supérieure
            let top = SKShapeNode(ellipseOf: CGSize(width: 10, height: 4))
            top.fillColor = SKColor(white: 0.3, alpha: 0.5)
            top.strokeColor = .clear
            top.position = CGPoint(x: 0, y: 1)
            container.addChild(top)

        case .deadTree:
            // Ombre de l'arbre
            let treeShadow = SKShapeNode(ellipseOf: CGSize(width: 12, height: 5))
            treeShadow.fillColor = SKColor(white: 0, alpha: 0.2)
            treeShadow.strokeColor = .clear
            treeShadow.position = CGPoint(x: 3, y: -1)
            container.addChild(treeShadow)

            let trunk = SKShapeNode(rectOf: CGSize(width: 3, height: 22))
            trunk.fillColor = SKColor(red: 0.2, green: 0.15, blue: 0.1, alpha: 1)
            trunk.strokeColor = SKColor(red: 0.15, green: 0.1, blue: 0.07, alpha: 0.4)
            trunk.lineWidth = 0.5
            trunk.position = CGPoint(x: 0, y: 11)
            container.addChild(trunk)

            // Écorce
            let bark = SKShapeNode(rectOf: CGSize(width: 2, height: 3))
            bark.fillColor = SKColor(red: 0.15, green: 0.1, blue: 0.07, alpha: 0.5)
            bark.strokeColor = .clear
            bark.position = CGPoint(x: 0, y: 8)
            container.addChild(bark)

            for angle in [-0.4, 0.3, -0.6] {
                let branch = SKShapeNode(rectOf: CGSize(width: 1.5, height: 10))
                branch.fillColor = SKColor(red: 0.18, green: 0.13, blue: 0.08, alpha: 1)
                branch.strokeColor = .clear
                branch.position = CGPoint(x: 0, y: 18)
                branch.zRotation = CGFloat(angle)
                container.addChild(branch)
            }

            // Cendres sur les branches
            let ashOnBranch = SKShapeNode(ellipseOf: CGSize(width: 4, height: 2))
            ashOnBranch.fillColor = SKColor(white: 0.3, alpha: 0.3)
            ashOnBranch.strokeColor = .clear
            ashOnBranch.position = CGPoint(x: -3, y: 20)
            container.addChild(ashOnBranch)

        case .metalShard:
            let shard = SKShapeNode(rectOf: CGSize(width: 4, height: 8))
            shard.fillColor = SKColor(red: 0.5, green: 0.5, blue: 0.55, alpha: 0.8)
            shard.strokeColor = SKColor(white: 0.7, alpha: 0.4)
            shard.lineWidth = 0.5
            shard.zRotation = CGFloat(rng.next() % 628) / 100.0 - .pi
            shard.position = CGPoint(x: 0, y: 4)
            container.addChild(shard)
            // Reflet métallique
            let glint = SKShapeNode(rectOf: CGSize(width: 1, height: 3))
            glint.fillColor = SKColor(white: 0.9, alpha: 0.3)
            glint.strokeColor = .clear
            glint.position = CGPoint(x: 1, y: 5)
            glint.zRotation = shard.zRotation
            container.addChild(glint)

        case .ruinedWall:
            let wall = SKShapeNode(rectOf: CGSize(width: 18, height: 14), cornerRadius: 1)
            wall.fillColor = SKColor(red: 0.25, green: 0.2, blue: 0.18, alpha: 0.9)
            wall.strokeColor = SKColor(red: 0.3, green: 0.25, blue: 0.2, alpha: 0.5)
            wall.lineWidth = 1
            wall.position = CGPoint(x: 0, y: 7)
            container.addChild(wall)

            // Briques visibles
            for row in 0..<3 {
                for col in 0..<2 {
                    let brick = SKShapeNode(rectOf: CGSize(width: 5, height: 3), cornerRadius: 0.5)
                    brick.fillColor = SKColor(red: 0.28, green: 0.22, blue: 0.18, alpha: 0.5)
                    brick.strokeColor = SKColor(red: 0.2, green: 0.15, blue: 0.12, alpha: 0.3)
                    brick.lineWidth = 0.5
                    brick.position = CGPoint(x: CGFloat(col) * 7 - 3 + CGFloat(row % 2) * 3, y: CGFloat(row) * 4 + 2)
                    container.addChild(brick)
                }
            }

            // Fissures
            let crack = SKShapeNode(rectOf: CGSize(width: 1, height: 10))
            crack.fillColor = SKColor(white: 0.1, alpha: 0.5)
            crack.strokeColor = .clear
            crack.position = CGPoint(x: 4, y: 7)
            crack.zRotation = 0.15
            container.addChild(crack)

        // --- Roshar (amélioré) ---
        case .rockFormation:
            // Rocher multi-couches
            let baseRock = SKShapeNode(ellipseOf: CGSize(width: 18, height: 10))
            baseRock.fillColor = SKColor(red: 0.3, green: 0.32, blue: 0.35, alpha: 1)
            baseRock.strokeColor = SKColor(red: 0.25, green: 0.27, blue: 0.3, alpha: 0.6)
            baseRock.lineWidth = 1
            baseRock.position = CGPoint(x: 0, y: 3)
            container.addChild(baseRock)

            let topRock = SKShapeNode(ellipseOf: CGSize(width: 10, height: 7))
            topRock.fillColor = SKColor(red: 0.33, green: 0.35, blue: 0.38, alpha: 1)
            topRock.strokeColor = .clear
            topRock.position = CGPoint(x: -1, y: 6)
            container.addChild(topRock)

            // Cremling (petit insecte)
            let cremling = SKShapeNode(ellipseOf: CGSize(width: 2, height: 1))
            cremling.fillColor = SKColor(red: 0.4, green: 0.35, blue: 0.25, alpha: 0.6)
            cremling.strokeColor = .clear
            cremling.position = CGPoint(x: 5, y: 2)
            container.addChild(cremling)

        case .stormPost:
            // Poteau d'orage amélioré
            let post = SKShapeNode(rectOf: CGSize(width: 4, height: 26))
            post.fillColor = SKColor(red: 0.35, green: 0.3, blue: 0.25, alpha: 1)
            post.strokeColor = SKColor(red: 0.3, green: 0.25, blue: 0.2, alpha: 0.4)
            post.lineWidth = 0.5
            post.position = CGPoint(x: 0, y: 13)
            container.addChild(post)

            // Anneaux
            for yOff in [8, 16, 22] as [CGFloat] {
                let ring = SKShapeNode(ellipseOf: CGSize(width: 6, height: 3))
                ring.fillColor = .clear
                ring.strokeColor = SKColor(red: 0.5, green: 0.4, blue: 0.3, alpha: 0.6)
                ring.lineWidth = 1
                ring.position = CGPoint(x: 0, y: yOff)
                container.addChild(ring)
            }

            // Corde attachée
            let rope = SKShapeNode(rectOf: CGSize(width: 8, height: 1))
            rope.fillColor = SKColor(red: 0.45, green: 0.35, blue: 0.25, alpha: 0.5)
            rope.strokeColor = .clear
            rope.position = CGPoint(x: 4, y: 16)
            rope.zRotation = 0.3
            container.addChild(rope)

        case .chasmmoss:
            let moss = SKShapeNode(ellipseOf: CGSize(width: 12, height: 6))
            moss.fillColor = SKColor(red: 0.15, green: 0.35, blue: 0.2, alpha: 0.8)
            moss.strokeColor = .clear
            container.addChild(moss)

            // Filaments
            for i in 0..<3 {
                let fil = SKShapeNode(rectOf: CGSize(width: 1, height: 4))
                fil.fillColor = SKColor(red: 0.1, green: 0.3, blue: 0.15, alpha: 0.5)
                fil.strokeColor = .clear
                fil.position = CGPoint(x: CGFloat(i - 1) * 3, y: 3)
                fil.zRotation = CGFloat(i - 1) * 0.15
                container.addChild(fil)
            }

        case .rockbud:
            let shell = SKShapeNode(ellipseOf: CGSize(width: 10, height: 7))
            shell.fillColor = SKColor(red: 0.35, green: 0.3, blue: 0.28, alpha: 1)
            shell.strokeColor = SKColor(red: 0.3, green: 0.25, blue: 0.23, alpha: 0.4)
            shell.lineWidth = 0.5
            shell.position = CGPoint(x: 0, y: 2)
            container.addChild(shell)

            // Lignes de coquille
            let shellLine = SKShapeNode(ellipseOf: CGSize(width: 7, height: 4))
            shellLine.fillColor = .clear
            shellLine.strokeColor = SKColor(red: 0.3, green: 0.25, blue: 0.22, alpha: 0.3)
            shellLine.lineWidth = 0.5
            shellLine.position = CGPoint(x: 0, y: 2)
            container.addChild(shellLine)

            // Vignes
            for i in 0..<2 {
                let vine = SKShapeNode(rectOf: CGSize(width: 1.5, height: 6))
                vine.fillColor = SKColor(red: 0.2, green: 0.5, blue: 0.25, alpha: 0.9)
                vine.strokeColor = .clear
                vine.position = CGPoint(x: CGFloat(i) * 3 - 1, y: 7)
                vine.zRotation = CGFloat(i) * 0.4 - 0.2
                container.addChild(vine)
            }

            // Petite feuille
            let leaf = SKShapeNode(ellipseOf: CGSize(width: 3, height: 2))
            leaf.fillColor = SKColor(red: 0.25, green: 0.5, blue: 0.3, alpha: 0.8)
            leaf.strokeColor = .clear
            leaf.position = CGPoint(x: 2, y: 10)
            container.addChild(leaf)

        // --- Taldain (amélioré) ---
        case .sandDune:
            let dune = SKShapeNode(ellipseOf: CGSize(width: 22, height: 8))
            dune.fillColor = SKColor(red: 0.35, green: 0.3, blue: 0.18, alpha: 0.6)
            dune.strokeColor = .clear
            container.addChild(dune)
            // Crête de dune
            let ridge = SKShapeNode(ellipseOf: CGSize(width: 18, height: 3))
            ridge.fillColor = SKColor(red: 0.38, green: 0.33, blue: 0.2, alpha: 0.4)
            ridge.strokeColor = .clear
            ridge.position = CGPoint(x: 0, y: 2)
            container.addChild(ridge)

        case .cactus:
            // Ombre
            let cactusShadow = SKShapeNode(ellipseOf: CGSize(width: 8, height: 4))
            cactusShadow.fillColor = SKColor(white: 0, alpha: 0.15)
            cactusShadow.strokeColor = .clear
            cactusShadow.position = CGPoint(x: 2, y: -1)
            container.addChild(cactusShadow)

            let stem = SKShapeNode(rectOf: CGSize(width: 5, height: 16), cornerRadius: 2)
            stem.fillColor = SKColor(red: 0.2, green: 0.4, blue: 0.15, alpha: 1)
            stem.strokeColor = SKColor(red: 0.15, green: 0.3, blue: 0.1, alpha: 0.4)
            stem.lineWidth = 0.5
            stem.position = CGPoint(x: 0, y: 8)
            container.addChild(stem)

            // Lignes verticales du cactus
            let line = SKShapeNode(rectOf: CGSize(width: 0.5, height: 12))
            line.fillColor = SKColor(red: 0.15, green: 0.3, blue: 0.1, alpha: 0.3)
            line.strokeColor = .clear
            line.position = CGPoint(x: 0, y: 8)
            container.addChild(line)

            let arm = SKShapeNode(rectOf: CGSize(width: 3, height: 8), cornerRadius: 1)
            arm.fillColor = SKColor(red: 0.2, green: 0.4, blue: 0.15, alpha: 1)
            arm.strokeColor = .clear
            arm.position = CGPoint(x: 6, y: 12)
            container.addChild(arm)

            // Fleur au sommet (occasionnel)
            if rng.next() % 3 == 0 {
                let flower = SKShapeNode(circleOfRadius: 2)
                flower.fillColor = SKColor(red: 0.9, green: 0.6, blue: 0.2, alpha: 0.8)
                flower.strokeColor = .clear
                flower.position = CGPoint(x: 0, y: 17)
                container.addChild(flower)
            }

        case .oasis:
            let water = SKShapeNode(ellipseOf: CGSize(width: 20, height: 12))
            water.fillColor = SKColor(red: 0.1, green: 0.3, blue: 0.5, alpha: 0.6)
            water.strokeColor = SKColor(red: 0.2, green: 0.4, blue: 0.6, alpha: 0.3)
            water.lineWidth = 1
            container.addChild(water)
            // Reflets
            let reflection = SKShapeNode(ellipseOf: CGSize(width: 6, height: 3))
            reflection.fillColor = SKColor(red: 0.3, green: 0.5, blue: 0.7, alpha: 0.3)
            reflection.strokeColor = .clear
            reflection.position = CGPoint(x: -3, y: 1)
            container.addChild(reflection)
            // Palmier miniature
            let palmTrunk = SKShapeNode(rectOf: CGSize(width: 2, height: 10))
            palmTrunk.fillColor = SKColor(red: 0.4, green: 0.3, blue: 0.15, alpha: 0.8)
            palmTrunk.strokeColor = .clear
            palmTrunk.position = CGPoint(x: 8, y: 5)
            container.addChild(palmTrunk)

            let frond = SKShapeNode(ellipseOf: CGSize(width: 8, height: 4))
            frond.fillColor = SKColor(red: 0.2, green: 0.45, blue: 0.15, alpha: 0.7)
            frond.strokeColor = .clear
            frond.position = CGPoint(x: 8, y: 11)
            container.addChild(frond)

        case .sandRock:
            let rock = SKShapeNode(ellipseOf: CGSize(width: 12, height: 8))
            rock.fillColor = SKColor(red: 0.4, green: 0.35, blue: 0.25, alpha: 1)
            rock.strokeColor = SKColor(red: 0.35, green: 0.3, blue: 0.2, alpha: 0.4)
            rock.lineWidth = 0.5
            rock.position = CGPoint(x: 0, y: 3)
            container.addChild(rock)
            // Érosion
            let erosion = SKShapeNode(ellipseOf: CGSize(width: 4, height: 2))
            erosion.fillColor = SKColor(red: 0.35, green: 0.3, blue: 0.2, alpha: 0.4)
            erosion.strokeColor = .clear
            erosion.position = CGPoint(x: 2, y: 4)
            container.addChild(erosion)

        // --- Nalthis (amélioré) ---
        case .flower:
            let stem = SKShapeNode(rectOf: CGSize(width: 1, height: 10))
            stem.fillColor = SKColor(red: 0.15, green: 0.4, blue: 0.15, alpha: 1)
            stem.strokeColor = .clear
            stem.position = CGPoint(x: 0, y: 5)
            container.addChild(stem)

            // Feuille
            let leaf = SKShapeNode(ellipseOf: CGSize(width: 4, height: 2))
            leaf.fillColor = SKColor(red: 0.15, green: 0.4, blue: 0.15, alpha: 0.8)
            leaf.strokeColor = .clear
            leaf.position = CGPoint(x: 2, y: 5)
            leaf.zRotation = 0.3
            container.addChild(leaf)

            // Pétales (plusieurs couches)
            let hue = CGFloat(rng.next() % 100) / 100.0
            for i in 0..<4 {
                let petal = SKShapeNode(ellipseOf: CGSize(width: 3, height: 2))
                petal.fillColor = SKColor(hue: hue, saturation: 0.8, brightness: 0.9, alpha: 0.9)
                petal.strokeColor = .clear
                let angle = CGFloat(i) * .pi / 2
                petal.position = CGPoint(x: cos(angle) * 2, y: 10 + sin(angle) * 2)
                container.addChild(petal)
            }

            // Centre
            let center = SKShapeNode(circleOfRadius: 1.5)
            center.fillColor = SKColor(red: 0.9, green: 0.8, blue: 0.2, alpha: 0.9)
            center.strokeColor = .clear
            center.position = CGPoint(x: 0, y: 10)
            container.addChild(center)

        case .garden:
            for i in 0..<4 {
                let leaf = SKShapeNode(ellipseOf: CGSize(width: 5, height: 3))
                let greenVar = 0.35 + CGFloat(i) * 0.08
                leaf.fillColor = SKColor(red: 0.1, green: greenVar, blue: 0.15, alpha: 0.8)
                leaf.strokeColor = .clear
                leaf.position = CGPoint(x: CGFloat(i - 2) * 4, y: CGFloat(i % 2) * 3)
                leaf.zRotation = CGFloat(i) * 0.2 - 0.3
                container.addChild(leaf)
            }

            // Petits champignons
            let mushroom = SKShapeNode(ellipseOf: CGSize(width: 3, height: 2))
            mushroom.fillColor = SKColor(red: 0.7, green: 0.5, blue: 0.3, alpha: 0.6)
            mushroom.strokeColor = .clear
            mushroom.position = CGPoint(x: 4, y: 4)
            container.addChild(mushroom)

        case .statue:
            let base = SKShapeNode(rectOf: CGSize(width: 12, height: 4), cornerRadius: 1)
            base.fillColor = SKColor(white: 0.35, alpha: 1)
            base.strokeColor = SKColor(white: 0.4, alpha: 0.4)
            base.lineWidth = 0.5
            base.position = CGPoint(x: 0, y: 2)
            container.addChild(base)

            let body = SKShapeNode(rectOf: CGSize(width: 6, height: 16), cornerRadius: 1)
            body.fillColor = SKColor(white: 0.42, alpha: 1)
            body.strokeColor = SKColor(white: 0.5, alpha: 0.3)
            body.lineWidth = 0.5
            body.position = CGPoint(x: 0, y: 12)
            container.addChild(body)

            // Tête de statue
            let head = SKShapeNode(circleOfRadius: 3)
            head.fillColor = SKColor(white: 0.45, alpha: 1)
            head.strokeColor = .clear
            head.position = CGPoint(x: 0, y: 22)
            container.addChild(head)

            // Bras
            let arm = SKShapeNode(rectOf: CGSize(width: 10, height: 2))
            arm.fillColor = SKColor(white: 0.4, alpha: 0.9)
            arm.strokeColor = .clear
            arm.position = CGPoint(x: 0, y: 16)
            arm.zRotation = 0.1
            container.addChild(arm)

        case .fountain:
            let basin = SKShapeNode(ellipseOf: CGSize(width: 18, height: 10))
            basin.fillColor = SKColor(red: 0.1, green: 0.2, blue: 0.4, alpha: 0.7)
            basin.strokeColor = SKColor(white: 0.4, alpha: 0.5)
            basin.lineWidth = 1
            basin.position = CGPoint(x: 0, y: 2)
            container.addChild(basin)

            // Pilier central
            let pillar = SKShapeNode(rectOf: CGSize(width: 3, height: 12))
            pillar.fillColor = SKColor(white: 0.45, alpha: 1)
            pillar.strokeColor = .clear
            pillar.position = CGPoint(x: 0, y: 8)
            container.addChild(pillar)

            // Eau jaillissante
            let waterSpray = SKShapeNode(ellipseOf: CGSize(width: 6, height: 4))
            waterSpray.fillColor = SKColor(red: 0.3, green: 0.5, blue: 0.8, alpha: 0.4)
            waterSpray.strokeColor = .clear
            waterSpray.position = CGPoint(x: 0, y: 15)
            container.addChild(waterSpray)

            let animate = SKAction.repeatForever(SKAction.sequence([
                SKAction.fadeAlpha(to: 0.2, duration: 0.8),
                SKAction.fadeAlpha(to: 0.6, duration: 0.8)
            ]))
            waterSpray.run(animate)

        // --- Shadesmar ---
        case .beadPile:
            for i in 0..<6 {
                let bead = SKShapeNode(circleOfRadius: CGFloat(1.5 + Double(i % 2)))
                bead.fillColor = SKColor(red: 0.4, green: 0.3, blue: 0.5, alpha: 0.8)
                bead.strokeColor = SKColor(red: 0.5, green: 0.4, blue: 0.6, alpha: 0.3)
                bead.lineWidth = 0.5
                bead.position = CGPoint(x: CGFloat(i % 3) * 3 - 3, y: CGFloat(i / 3) * 3)
                container.addChild(bead)
            }

        case .flamespren:
            let flame = SKShapeNode(ellipseOf: CGSize(width: 5, height: 8))
            flame.fillColor = SKColor(red: 0.9, green: 0.5, blue: 0.1, alpha: 0.7)
            flame.strokeColor = .clear
            flame.position = CGPoint(x: 0, y: 6)
            container.addChild(flame)

            let innerFlame = SKShapeNode(ellipseOf: CGSize(width: 3, height: 5))
            innerFlame.fillColor = SKColor(red: 1, green: 0.8, blue: 0.3, alpha: 0.6)
            innerFlame.strokeColor = .clear
            innerFlame.position = CGPoint(x: 0, y: 7)
            container.addChild(innerFlame)

            let flicker = SKAction.repeatForever(SKAction.sequence([
                SKAction.fadeAlpha(to: 0.4, duration: 0.3),
                SKAction.fadeAlpha(to: 0.8, duration: 0.3)
            ]))
            flame.run(flicker)

        case .glassTree:
            let trunk = SKShapeNode(rectOf: CGSize(width: 3, height: 18))
            trunk.fillColor = SKColor(red: 0.3, green: 0.2, blue: 0.5, alpha: 0.7)
            trunk.strokeColor = SKColor(red: 0.5, green: 0.3, blue: 0.7, alpha: 0.3)
            trunk.lineWidth = 0.5
            trunk.position = CGPoint(x: 0, y: 9)
            container.addChild(trunk)

            let crown = SKShapeNode(circleOfRadius: 7)
            crown.fillColor = SKColor(red: 0.4, green: 0.2, blue: 0.6, alpha: 0.5)
            crown.strokeColor = SKColor(red: 0.5, green: 0.3, blue: 0.7, alpha: 0.2)
            crown.lineWidth = 0.5
            crown.position = CGPoint(x: 0, y: 20)
            container.addChild(crown)

        case .shardPillar:
            let pillar = SKShapeNode(rectOf: CGSize(width: 5, height: 22), cornerRadius: 1)
            pillar.fillColor = SKColor(red: 0.25, green: 0.15, blue: 0.4, alpha: 0.9)
            pillar.strokeColor = SKColor(red: 0.5, green: 0.3, blue: 0.7, alpha: 0.4)
            pillar.lineWidth = 1
            pillar.position = CGPoint(x: 0, y: 11)
            container.addChild(pillar)

            // Rune lumineuse
            let rune = SKShapeNode(circleOfRadius: 2)
            rune.fillColor = SKColor(red: 0.6, green: 0.3, blue: 0.8, alpha: 0.5)
            rune.strokeColor = .clear
            rune.position = CGPoint(x: 0, y: 18)
            container.addChild(rune)

            let glow = SKAction.repeatForever(SKAction.sequence([
                SKAction.fadeAlpha(to: 0.2, duration: 1.5),
                SKAction.fadeAlpha(to: 0.7, duration: 1.5)
            ]))
            rune.run(glow)

        // --- Komashi (amélioré) ---
        case .inkBlot:
            let blot = SKShapeNode(ellipseOf: CGSize(width: 14, height: 9))
            blot.fillColor = SKColor(red: 0.05, green: 0.02, blue: 0.08, alpha: 0.8)
            blot.strokeColor = .clear
            container.addChild(blot)
            // Éclaboussures
            for i in 0..<3 {
                let splash = SKShapeNode(circleOfRadius: CGFloat(1 + i % 2))
                splash.fillColor = SKColor(red: 0.05, green: 0.02, blue: 0.08, alpha: 0.5)
                splash.strokeColor = .clear
                splash.position = CGPoint(x: CGFloat(i * 3 - 3), y: CGFloat(i * 2 - 1))
                container.addChild(splash)
            }

        case .paperLantern:
            // Poteau
            let pole = SKShapeNode(rectOf: CGSize(width: 1, height: 14))
            pole.fillColor = SKColor(red: 0.3, green: 0.25, blue: 0.2, alpha: 0.8)
            pole.strokeColor = .clear
            pole.position = CGPoint(x: 0, y: 7)
            container.addChild(pole)

            let body = SKShapeNode(ellipseOf: CGSize(width: 7, height: 9))
            body.fillColor = SKColor(red: 0.9, green: 0.6, blue: 0.3, alpha: 0.7)
            body.strokeColor = SKColor(red: 0.7, green: 0.4, blue: 0.2, alpha: 0.5)
            body.lineWidth = 0.5
            body.position = CGPoint(x: 0, y: 12)
            container.addChild(body)

            // Lumière intérieure
            let light = SKShapeNode(circleOfRadius: 3)
            light.fillColor = SKColor(red: 1, green: 0.8, blue: 0.4, alpha: 0.4)
            light.strokeColor = .clear
            light.position = CGPoint(x: 0, y: 12)
            container.addChild(light)

            let glow = SKAction.repeatForever(SKAction.sequence([
                SKAction.fadeAlpha(to: 0.3, duration: 1.2),
                SKAction.fadeAlpha(to: 0.8, duration: 1.2)
            ]))
            body.run(glow)
            light.run(glow)

        case .nightmareResidue:
            let residue = SKShapeNode(ellipseOf: CGSize(width: 12, height: 7))
            residue.fillColor = SKColor(red: 0.15, green: 0.05, blue: 0.2, alpha: 0.6)
            residue.strokeColor = .clear
            container.addChild(residue)
            // Wisps
            let wisp = SKShapeNode(ellipseOf: CGSize(width: 3, height: 5))
            wisp.fillColor = SKColor(red: 0.2, green: 0.1, blue: 0.3, alpha: 0.3)
            wisp.strokeColor = .clear
            wisp.position = CGPoint(x: 0, y: 4)
            container.addChild(wisp)

            let rise = SKAction.repeatForever(SKAction.sequence([
                SKAction.moveBy(x: 0, y: 3, duration: 2.0),
                SKAction.fadeOut(withDuration: 0.5),
                SKAction.moveBy(x: 0, y: -3, duration: 0),
                SKAction.fadeIn(withDuration: 0.5)
            ]))
            wisp.run(rise)

        case .brush:
            let handle = SKShapeNode(rectOf: CGSize(width: 2, height: 14))
            handle.fillColor = SKColor(red: 0.3, green: 0.2, blue: 0.15, alpha: 1)
            handle.strokeColor = .clear
            handle.position = CGPoint(x: 0, y: 7)
            handle.zRotation = 0.4
            container.addChild(handle)

            let bristles = SKShapeNode(ellipseOf: CGSize(width: 4, height: 3))
            bristles.fillColor = SKColor(red: 0.15, green: 0.08, blue: 0.2, alpha: 0.8)
            bristles.strokeColor = .clear
            bristles.position = CGPoint(x: -4, y: 12)
            container.addChild(bristles)

        // --- Sel (amélioré) ---
        case .aonGlyph:
            let glyph = SKShapeNode(circleOfRadius: 7)
            glyph.fillColor = .clear
            glyph.strokeColor = SKColor(red: 0.8, green: 0.7, blue: 0.3, alpha: 0.3)
            glyph.lineWidth = 1
            glyph.position = CGPoint(x: 0, y: 3)
            container.addChild(glyph)

            // Lignes intérieures du glyphe
            let hLine = SKShapeNode(rectOf: CGSize(width: 8, height: 0.5))
            hLine.fillColor = SKColor(red: 0.8, green: 0.7, blue: 0.3, alpha: 0.2)
            hLine.strokeColor = .clear
            hLine.position = CGPoint(x: 0, y: 3)
            container.addChild(hLine)

            let vLine = SKShapeNode(rectOf: CGSize(width: 0.5, height: 8))
            vLine.fillColor = SKColor(red: 0.8, green: 0.7, blue: 0.3, alpha: 0.2)
            vLine.strokeColor = .clear
            vLine.position = CGPoint(x: 0, y: 3)
            container.addChild(vLine)

            let pulse = SKAction.repeatForever(SKAction.sequence([
                SKAction.fadeAlpha(to: 0.15, duration: 2.5),
                SKAction.fadeAlpha(to: 0.5, duration: 2.5)
            ]))
            glyph.run(pulse)

        case .stoneColumn:
            let col = SKShapeNode(rectOf: CGSize(width: 6, height: 22), cornerRadius: 1)
            col.fillColor = SKColor(red: 0.3, green: 0.28, blue: 0.22, alpha: 1)
            col.strokeColor = SKColor(red: 0.35, green: 0.33, blue: 0.27, alpha: 0.5)
            col.lineWidth = 1
            col.position = CGPoint(x: 0, y: 11)
            container.addChild(col)

            // Chapiteau
            let capital = SKShapeNode(rectOf: CGSize(width: 10, height: 3), cornerRadius: 1)
            capital.fillColor = SKColor(red: 0.33, green: 0.3, blue: 0.24, alpha: 1)
            capital.strokeColor = .clear
            capital.position = CGPoint(x: 0, y: 23)
            container.addChild(capital)

            // Base
            let columnBase = SKShapeNode(rectOf: CGSize(width: 10, height: 3), cornerRadius: 1)
            columnBase.fillColor = SKColor(red: 0.28, green: 0.25, blue: 0.2, alpha: 1)
            columnBase.strokeColor = .clear
            columnBase.position = CGPoint(x: 0, y: 1)
            container.addChild(columnBase)

        case .mossCluster:
            for i in 0..<3 {
                let moss = SKShapeNode(ellipseOf: CGSize(width: CGFloat(6 + i * 2), height: CGFloat(3 + i)))
                moss.fillColor = SKColor(red: 0.15, green: CGFloat(0.28 + Double(i) * 0.04), blue: 0.12, alpha: 0.7)
                moss.strokeColor = .clear
                moss.position = CGPoint(x: CGFloat(i - 1) * 3, y: CGFloat(i))
                container.addChild(moss)
            }

        case .shrine:
            let base = SKShapeNode(rectOf: CGSize(width: 14, height: 3), cornerRadius: 1)
            base.fillColor = SKColor(red: 0.3, green: 0.28, blue: 0.22, alpha: 1)
            base.strokeColor = SKColor(red: 0.35, green: 0.32, blue: 0.25, alpha: 0.4)
            base.lineWidth = 0.5
            base.position = CGPoint(x: 0, y: 1)
            container.addChild(base)

            let top = SKShapeNode(rectOf: CGSize(width: 10, height: 12), cornerRadius: 1)
            top.fillColor = SKColor(red: 0.35, green: 0.32, blue: 0.25, alpha: 1)
            top.strokeColor = SKColor(red: 0.4, green: 0.37, blue: 0.3, alpha: 0.3)
            top.lineWidth = 0.5
            top.position = CGPoint(x: 0, y: 9)
            container.addChild(top)

            // Toit
            let roof = SKShapeNode(rectOf: CGSize(width: 14, height: 3), cornerRadius: 1)
            roof.fillColor = SKColor(red: 0.4, green: 0.35, blue: 0.25, alpha: 1)
            roof.strokeColor = .clear
            roof.position = CGPoint(x: 0, y: 16)
            container.addChild(roof)

            // Lumière du sanctuaire
            let light = SKShapeNode(circleOfRadius: 2)
            light.fillColor = SKColor(red: 0.8, green: 0.7, blue: 0.3, alpha: 0.5)
            light.strokeColor = .clear
            light.position = CGPoint(x: 0, y: 10)
            container.addChild(light)

            let glow = SKAction.repeatForever(SKAction.sequence([
                SKAction.fadeAlpha(to: 0.2, duration: 2.0),
                SKAction.fadeAlpha(to: 0.6, duration: 2.0)
            ]))
            light.run(glow)

        // === NEW DECORATION TYPES ===

        case .ashVent:
            // Scadrial — fissure volcanique émettant de la cendre
            let vent = SKShapeNode(ellipseOf: CGSize(width: 8, height: 5))
            vent.fillColor = SKColor(red: 0.15, green: 0.08, blue: 0.05, alpha: 0.9)
            vent.strokeColor = SKColor(red: 0.4, green: 0.2, blue: 0.1, alpha: 0.5)
            vent.lineWidth = 1
            container.addChild(vent)

            let innerGlow = SKShapeNode(ellipseOf: CGSize(width: 4, height: 2.5))
            innerGlow.fillColor = SKColor(red: 0.6, green: 0.2, blue: 0.05, alpha: 0.4)
            innerGlow.strokeColor = .clear
            container.addChild(innerGlow)

            // Smoke rising
            for i in 0..<3 {
                let smoke = SKShapeNode(circleOfRadius: CGFloat(2 + i))
                smoke.fillColor = SKColor(white: 0.35, alpha: 0.15)
                smoke.strokeColor = .clear
                smoke.position = CGPoint(x: CGFloat(i - 1) * 2, y: CGFloat(3 + i * 4))
                container.addChild(smoke)

                let rise = SKAction.repeatForever(SKAction.sequence([
                    SKAction.group([
                        SKAction.moveBy(x: CGFloat.random(in: -2...2), y: 6, duration: 2.0 + Double(i) * 0.5),
                        SKAction.fadeOut(withDuration: 2.0 + Double(i) * 0.5)
                    ]),
                    SKAction.group([
                        SKAction.move(to: CGPoint(x: CGFloat(i - 1) * 2, y: CGFloat(3 + i * 4)), duration: 0),
                        SKAction.fadeIn(withDuration: 0.3)
                    ])
                ]))
                smoke.run(rise)
            }

        case .stormSpren:
            // Roshar — petit spren lumineux flottant
            let sprenCore = SKShapeNode(circleOfRadius: 3)
            sprenCore.fillColor = SKColor(red: 0.5, green: 0.8, blue: 1.0, alpha: 0.6)
            sprenCore.strokeColor = SKColor(red: 0.6, green: 0.9, blue: 1.0, alpha: 0.3)
            sprenCore.lineWidth = 1
            sprenCore.glowWidth = 3
            sprenCore.position = CGPoint(x: 0, y: 8)
            container.addChild(sprenCore)

            // Trailing wisps
            for i in 0..<3 {
                let wisp = SKShapeNode(circleOfRadius: CGFloat(1.5 - Double(i) * 0.3))
                wisp.fillColor = SKColor(red: 0.5, green: 0.8, blue: 1.0, alpha: 0.3 - CGFloat(i) * 0.08)
                wisp.strokeColor = .clear
                wisp.position = CGPoint(x: 0, y: CGFloat(5 - i * 2))
                container.addChild(wisp)
            }

            let sprenFloat = SKAction.repeatForever(SKAction.sequence([
                SKAction.moveBy(x: 4, y: 3, duration: 1.5),
                SKAction.moveBy(x: -6, y: 2, duration: 2.0),
                SKAction.moveBy(x: 2, y: -5, duration: 1.5)
            ]))
            sprenCore.run(sprenFloat)

            let shimmer = SKAction.repeatForever(SKAction.sequence([
                SKAction.fadeAlpha(to: 0.3, duration: 0.8),
                SKAction.fadeAlpha(to: 0.8, duration: 0.8)
            ]))
            sprenCore.run(shimmer)

        case .sandWhirl:
            // Taldain — petit tourbillon de sable
            for i in 0..<5 {
                let grain = SKShapeNode(circleOfRadius: 1)
                grain.fillColor = SKColor(red: 0.8, green: 0.7, blue: 0.4, alpha: 0.5)
                grain.strokeColor = .clear
                let angle = CGFloat(i) * (.pi * 2 / 5)
                let radius: CGFloat = 4
                grain.position = CGPoint(x: cos(angle) * radius, y: sin(angle) * radius + 4)
                grain.name = "sandGrain_\(i)"
                container.addChild(grain)

                grain.run(SKAction.repeatForever(
                    SKAction.customAction(withDuration: 2.0) { node, time in
                        let t = time / 2.0
                        let a = angle + t * .pi * 2
                        let r = radius + sin(t * .pi * 4) * 2
                        node.position = CGPoint(x: cos(a) * r, y: sin(a) * r + 4)
                        node.alpha = 0.3 + 0.4 * sin(t * .pi * 2)
                    }
                ))
            }

            // Center dust
            let dust = SKShapeNode(circleOfRadius: 2)
            dust.fillColor = SKColor(red: 0.7, green: 0.6, blue: 0.35, alpha: 0.2)
            dust.strokeColor = .clear
            dust.position = CGPoint(x: 0, y: 4)
            container.addChild(dust)

        case .coloredBanner:
            // Nalthis — bannière colorée BioChromatic
            let pole = SKShapeNode(rectOf: CGSize(width: 1.5, height: 20))
            pole.fillColor = SKColor(red: 0.35, green: 0.3, blue: 0.2, alpha: 0.9)
            pole.strokeColor = .clear
            pole.position = CGPoint(x: 0, y: 10)
            container.addChild(pole)

            let hue = CGFloat(rng.next() % 100) / 100.0
            let banner = SKShapeNode(rectOf: CGSize(width: 8, height: 12), cornerRadius: 1)
            banner.fillColor = SKColor(hue: hue, saturation: 0.85, brightness: 0.9, alpha: 0.8)
            banner.strokeColor = SKColor(hue: hue, saturation: 0.9, brightness: 0.7, alpha: 0.5)
            banner.lineWidth = 0.5
            banner.position = CGPoint(x: 5, y: 14)
            container.addChild(banner)

            // Emblem on banner
            let emblem = SKShapeNode(circleOfRadius: 2)
            emblem.fillColor = SKColor(hue: (hue + 0.5).truncatingRemainder(dividingBy: 1.0), saturation: 0.7, brightness: 1.0, alpha: 0.7)
            emblem.strokeColor = .clear
            emblem.position = CGPoint(x: 5, y: 15)
            container.addChild(emblem)

            // Flutter animation
            let flutter = SKAction.repeatForever(SKAction.sequence([
                SKAction.moveBy(x: 1, y: 0, duration: 0.8),
                SKAction.moveBy(x: -1, y: 0, duration: 0.8)
            ]))
            banner.run(flutter)

        case .cognitiveRift:
            // Shadesmar — fissure dimensionnelle avec lueur
            let rift = SKShapeNode(rectOf: CGSize(width: 2, height: 18))
            rift.fillColor = SKColor(red: 0.5, green: 0.2, blue: 0.8, alpha: 0.7)
            rift.strokeColor = .clear
            rift.position = CGPoint(x: 0, y: 9)
            rift.zRotation = CGFloat.random(in: -0.2...0.2)
            container.addChild(rift)

            let riftGlow = SKShapeNode(rectOf: CGSize(width: 6, height: 20))
            riftGlow.fillColor = SKColor(red: 0.4, green: 0.15, blue: 0.6, alpha: 0.15)
            riftGlow.strokeColor = .clear
            riftGlow.position = CGPoint(x: 0, y: 9)
            riftGlow.zRotation = rift.zRotation
            container.addChild(riftGlow)

            // Particles being drawn into the rift
            for i in 0..<4 {
                let spark = SKShapeNode(circleOfRadius: 1)
                spark.fillColor = SKColor(red: 0.6, green: 0.3, blue: 0.9, alpha: 0.5)
                spark.strokeColor = .clear
                spark.position = CGPoint(x: CGFloat.random(in: -8...8), y: CGFloat.random(in: 2...16))
                container.addChild(spark)

                let converge = SKAction.repeatForever(SKAction.sequence([
                    SKAction.move(to: CGPoint(x: 0, y: 9), duration: 1.5 + Double(i) * 0.3),
                    SKAction.fadeOut(withDuration: 0.1),
                    SKAction.move(to: CGPoint(x: CGFloat.random(in: -8...8), y: CGFloat.random(in: 2...16)), duration: 0),
                    SKAction.fadeIn(withDuration: 0.3)
                ]))
                spark.run(converge)
            }

            let pulse = SKAction.repeatForever(SKAction.sequence([
                SKAction.fadeAlpha(to: 0.3, duration: 1.5),
                SKAction.fadeAlpha(to: 0.8, duration: 1.5)
            ]))
            rift.run(pulse)

        case .dreamCatcher:
            // Komashi — attrape-cauchemar suspendu
            let frame = SKShapeNode(circleOfRadius: 6)
            frame.fillColor = .clear
            frame.strokeColor = SKColor(red: 0.4, green: 0.2, blue: 0.5, alpha: 0.7)
            frame.lineWidth = 1.5
            frame.position = CGPoint(x: 0, y: 12)
            container.addChild(frame)

            // Web pattern inside
            let cross1 = SKShapeNode(rectOf: CGSize(width: 0.5, height: 10))
            cross1.fillColor = SKColor(red: 0.3, green: 0.15, blue: 0.4, alpha: 0.4)
            cross1.strokeColor = .clear
            cross1.position = CGPoint(x: 0, y: 12)
            container.addChild(cross1)

            let cross2 = SKShapeNode(rectOf: CGSize(width: 10, height: 0.5))
            cross2.fillColor = SKColor(red: 0.3, green: 0.15, blue: 0.4, alpha: 0.4)
            cross2.strokeColor = .clear
            cross2.position = CGPoint(x: 0, y: 12)
            container.addChild(cross2)

            // Inner circle
            let inner = SKShapeNode(circleOfRadius: 3)
            inner.fillColor = SKColor(red: 0.2, green: 0.1, blue: 0.3, alpha: 0.2)
            inner.strokeColor = SKColor(red: 0.4, green: 0.2, blue: 0.5, alpha: 0.3)
            inner.lineWidth = 0.5
            inner.position = CGPoint(x: 0, y: 12)
            container.addChild(inner)

            // Hanging threads with beads
            for i in 0..<3 {
                let thread = SKShapeNode(rectOf: CGSize(width: 0.5, height: CGFloat(4 + i * 2)))
                thread.fillColor = SKColor(red: 0.3, green: 0.15, blue: 0.4, alpha: 0.5)
                thread.strokeColor = .clear
                thread.position = CGPoint(x: CGFloat(i - 1) * 3, y: CGFloat(3 - i))
                container.addChild(thread)

                let bead = SKShapeNode(circleOfRadius: 1)
                bead.fillColor = SKColor(red: 0.6, green: 0.3, blue: 0.7, alpha: 0.6)
                bead.strokeColor = .clear
                bead.position = CGPoint(x: CGFloat(i - 1) * 3, y: CGFloat(1 - i * 2))
                container.addChild(bead)
            }

            // Gentle sway
            let sway = SKAction.repeatForever(SKAction.sequence([
                SKAction.rotate(byAngle: 0.05, duration: 2.0),
                SKAction.rotate(byAngle: -0.05, duration: 2.0)
            ]))
            container.run(sway)

        case .lightWell:
            // Sel — puits de lumière Aon
            let well = SKShapeNode(circleOfRadius: 7)
            well.fillColor = SKColor(red: 0.8, green: 0.7, blue: 0.3, alpha: 0.1)
            well.strokeColor = SKColor(red: 0.9, green: 0.8, blue: 0.4, alpha: 0.3)
            well.lineWidth = 1.5
            container.addChild(well)

            // Inner rings
            let ring1 = SKShapeNode(circleOfRadius: 4)
            ring1.fillColor = .clear
            ring1.strokeColor = SKColor(red: 0.9, green: 0.8, blue: 0.4, alpha: 0.2)
            ring1.lineWidth = 0.5
            container.addChild(ring1)

            let ring2 = SKShapeNode(circleOfRadius: 2)
            ring2.fillColor = SKColor(red: 1, green: 0.9, blue: 0.5, alpha: 0.3)
            ring2.strokeColor = .clear
            container.addChild(ring2)

            // Light beam upward
            let beam = SKShapeNode(rectOf: CGSize(width: 3, height: 16))
            beam.fillColor = SKColor(red: 1, green: 0.9, blue: 0.5, alpha: 0.15)
            beam.strokeColor = .clear
            beam.position = CGPoint(x: 0, y: 8)
            container.addChild(beam)

            let beamPulse = SKAction.repeatForever(SKAction.sequence([
                SKAction.fadeAlpha(to: 0.05, duration: 2.0),
                SKAction.fadeAlpha(to: 0.25, duration: 2.0)
            ]))
            beam.run(beamPulse)

            ring1.run(SKAction.repeatForever(SKAction.rotate(byAngle: .pi * 2, duration: 8.0)))
        }

        container.setScale(CGFloat(scale))
        return container
    }
}

// MARK: - Seeded RNG

struct SeededRNG {
    private var state: UInt64

    init(seed: Int) {
        state = UInt64(bitPattern: Int64(seed))
        if state == 0 { state = 1 }
    }

    mutating func next() -> UInt64 {
        state ^= state << 13
        state ^= state >> 7
        state ^= state << 17
        return state
    }
}
