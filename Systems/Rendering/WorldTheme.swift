import SpriteKit

/// Thèmes visuels par monde — couleurs, décorations, ambiance
struct WorldTheme {
    let tileBaseColor: SKColor
    let tileVariations: [SKColor]
    let fogColor: SKColor
    let fogAlpha: CGFloat
    let particleColor: SKColor
    let edgeGlowColor: SKColor
    let decorationTypes: [DecorationType]

    enum DecorationType {
        case ashPile, deadTree, metalShard, ruinedWall          // Scadrial
        case rockFormation, stormPost, chasmmoss, rockbud       // Roshar
        case sandDune, cactus, oasis, sandRock                  // Taldain
        case flower, garden, statue, fountain                   // Nalthis
        case beadPile, flamespren, glassTree, shardPillar       // Shadesmar
        case inkBlot, paperLantern, nightmareResidue, brush     // Komashi
        case aonGlyph, stoneColumn, mossCluster, shrine         // Sel
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
                ],
                fogColor: SKColor(white: 0.6, alpha: 1),
                fogAlpha: 0.15,
                particleColor: SKColor(white: 0.7, alpha: 1),
                edgeGlowColor: SKColor(red: 0.4, green: 0.3, blue: 0.2, alpha: 1),
                decorationTypes: [.ashPile, .deadTree, .metalShard, .ruinedWall]
            )
        case "roshar":
            return WorldTheme(
                tileBaseColor: SKColor(red: 0.15, green: 0.18, blue: 0.22, alpha: 1),
                tileVariations: [
                    SKColor(red: 0.17, green: 0.20, blue: 0.24, alpha: 1),
                    SKColor(red: 0.13, green: 0.16, blue: 0.20, alpha: 1),
                    SKColor(red: 0.19, green: 0.22, blue: 0.26, alpha: 1),
                ],
                fogColor: SKColor(red: 0.5, green: 0.6, blue: 0.7, alpha: 1),
                fogAlpha: 0.1,
                particleColor: SKColor(red: 0.6, green: 0.8, blue: 0.5, alpha: 1),
                edgeGlowColor: SKColor(red: 0.3, green: 0.5, blue: 0.7, alpha: 1),
                decorationTypes: [.rockFormation, .stormPost, .chasmmoss, .rockbud]
            )
        case "taldain":
            return WorldTheme(
                tileBaseColor: SKColor(red: 0.28, green: 0.24, blue: 0.16, alpha: 1),
                tileVariations: [
                    SKColor(red: 0.30, green: 0.26, blue: 0.18, alpha: 1),
                    SKColor(red: 0.26, green: 0.22, blue: 0.14, alpha: 1),
                    SKColor(red: 0.32, green: 0.28, blue: 0.20, alpha: 1),
                ],
                fogColor: SKColor(red: 0.8, green: 0.7, blue: 0.5, alpha: 1),
                fogAlpha: 0.08,
                particleColor: SKColor(red: 0.9, green: 0.8, blue: 0.4, alpha: 1),
                edgeGlowColor: SKColor(red: 0.7, green: 0.6, blue: 0.3, alpha: 1),
                decorationTypes: [.sandDune, .cactus, .oasis, .sandRock]
            )
        case "nalthis":
            return WorldTheme(
                tileBaseColor: SKColor(red: 0.1, green: 0.18, blue: 0.12, alpha: 1),
                tileVariations: [
                    SKColor(red: 0.12, green: 0.20, blue: 0.14, alpha: 1),
                    SKColor(red: 0.08, green: 0.16, blue: 0.10, alpha: 1),
                    SKColor(red: 0.14, green: 0.22, blue: 0.16, alpha: 1),
                ],
                fogColor: SKColor(red: 0.3, green: 0.6, blue: 0.4, alpha: 1),
                fogAlpha: 0.06,
                particleColor: SKColor(red: 0.4, green: 0.9, blue: 0.5, alpha: 1),
                edgeGlowColor: SKColor(red: 0.3, green: 0.7, blue: 0.4, alpha: 1),
                decorationTypes: [.flower, .garden, .statue, .fountain]
            )
        case "sel":
            return WorldTheme(
                tileBaseColor: SKColor(red: 0.22, green: 0.20, blue: 0.16, alpha: 1),
                tileVariations: [
                    SKColor(red: 0.24, green: 0.22, blue: 0.18, alpha: 1),
                    SKColor(red: 0.20, green: 0.18, blue: 0.14, alpha: 1),
                    SKColor(red: 0.26, green: 0.24, blue: 0.20, alpha: 1),
                ],
                fogColor: SKColor(red: 0.8, green: 0.7, blue: 0.3, alpha: 1),
                fogAlpha: 0.05,
                particleColor: SKColor(red: 0.9, green: 0.8, blue: 0.3, alpha: 1),
                edgeGlowColor: SKColor(red: 0.7, green: 0.6, blue: 0.2, alpha: 1),
                decorationTypes: [.aonGlyph, .stoneColumn, .mossCluster, .shrine]
            )
        case "komashi":
            return WorldTheme(
                tileBaseColor: SKColor(red: 0.12, green: 0.08, blue: 0.18, alpha: 1),
                tileVariations: [
                    SKColor(red: 0.14, green: 0.10, blue: 0.20, alpha: 1),
                    SKColor(red: 0.10, green: 0.06, blue: 0.16, alpha: 1),
                    SKColor(red: 0.16, green: 0.12, blue: 0.22, alpha: 1),
                ],
                fogColor: SKColor(red: 0.4, green: 0.2, blue: 0.5, alpha: 1),
                fogAlpha: 0.12,
                particleColor: SKColor(red: 0.8, green: 0.3, blue: 0.6, alpha: 1),
                edgeGlowColor: SKColor(red: 0.5, green: 0.2, blue: 0.6, alpha: 1),
                decorationTypes: [.inkBlot, .paperLantern, .nightmareResidue, .brush]
            )
        default: // Shadesmar or unknown
            return WorldTheme(
                tileBaseColor: SKColor(red: 0.08, green: 0.05, blue: 0.15, alpha: 1),
                tileVariations: [
                    SKColor(red: 0.10, green: 0.07, blue: 0.17, alpha: 1),
                    SKColor(red: 0.06, green: 0.03, blue: 0.13, alpha: 1),
                ],
                fogColor: SKColor(red: 0.3, green: 0.1, blue: 0.5, alpha: 1),
                fogAlpha: 0.18,
                particleColor: SKColor(red: 0.6, green: 0.3, blue: 0.8, alpha: 1),
                edgeGlowColor: SKColor(red: 0.4, green: 0.1, blue: 0.6, alpha: 1),
                decorationTypes: [.beadPile, .flamespren, .glassTree, .shardPillar]
            )
        }
    }
}

// MARK: - Decoration Renderer

final class DecorationRenderer {

    /// Place decorations on the world node based on theme and zone size
    static func placeDecorations(on worldNode: SKNode, zone: Zone, theme: WorldTheme, isoPosition: (Int, Int) -> CGPoint) {
        // Seed based on zone ID for deterministic placement
        var rng = SeededRNG(seed: zone.id.hashValue)
        let decorationCount = (zone.gridWidth * zone.gridHeight) / 25

        for _ in 0..<decorationCount {
            let col = Int(rng.next() % UInt64(zone.gridWidth))
            let row = Int(rng.next() % UInt64(zone.gridHeight))

            // Skip spawn position and connection exits
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
        // --- Scadrial ---
        case .ashPile:
            let pile = SKShapeNode(ellipseOf: CGSize(width: 14, height: 6))
            pile.fillColor = SKColor(white: 0.25, alpha: 0.7)
            pile.strokeColor = .clear
            container.addChild(pile)

        case .deadTree:
            // Trunk
            let trunk = SKShapeNode(rectOf: CGSize(width: 3, height: 18))
            trunk.fillColor = SKColor(red: 0.2, green: 0.15, blue: 0.1, alpha: 1)
            trunk.strokeColor = .clear
            trunk.position = CGPoint(x: 0, y: 9)
            container.addChild(trunk)
            // Branches
            for angle in [-0.4, 0.3, -0.6] {
                let branch = SKShapeNode(rectOf: CGSize(width: 2, height: 10))
                branch.fillColor = SKColor(red: 0.18, green: 0.13, blue: 0.08, alpha: 1)
                branch.strokeColor = .clear
                branch.position = CGPoint(x: 0, y: 16)
                branch.zRotation = CGFloat(angle)
                container.addChild(branch)
            }

        case .metalShard:
            let shard = SKShapeNode(rectOf: CGSize(width: 4, height: 8))
            shard.fillColor = SKColor(red: 0.5, green: 0.5, blue: 0.55, alpha: 0.8)
            shard.strokeColor = SKColor(white: 0.7, alpha: 0.4)
            shard.lineWidth = 0.5
            shard.zRotation = CGFloat(rng.next() % 628) / 100.0 - .pi
            shard.position = CGPoint(x: 0, y: 4)
            container.addChild(shard)

        case .ruinedWall:
            let wall = SKShapeNode(rectOf: CGSize(width: 16, height: 12))
            wall.fillColor = SKColor(red: 0.25, green: 0.2, blue: 0.18, alpha: 0.9)
            wall.strokeColor = SKColor(red: 0.3, green: 0.25, blue: 0.2, alpha: 0.5)
            wall.lineWidth = 1
            wall.position = CGPoint(x: 0, y: 6)
            container.addChild(wall)
            // Cracks
            let crack = SKShapeNode(rectOf: CGSize(width: 1, height: 8))
            crack.fillColor = SKColor(white: 0.1, alpha: 0.6)
            crack.strokeColor = .clear
            crack.position = CGPoint(x: 3, y: 6)
            crack.zRotation = 0.2
            container.addChild(crack)

        // --- Roshar ---
        case .rockFormation:
            let rock = SKShapeNode(ellipseOf: CGSize(width: 16, height: 10))
            rock.fillColor = SKColor(red: 0.3, green: 0.32, blue: 0.35, alpha: 1)
            rock.strokeColor = SKColor(red: 0.25, green: 0.27, blue: 0.3, alpha: 0.6)
            rock.lineWidth = 1
            rock.position = CGPoint(x: 0, y: 3)
            container.addChild(rock)

        case .stormPost:
            let post = SKShapeNode(rectOf: CGSize(width: 3, height: 22))
            post.fillColor = SKColor(red: 0.35, green: 0.3, blue: 0.25, alpha: 1)
            post.strokeColor = .clear
            post.position = CGPoint(x: 0, y: 11)
            container.addChild(post)
            // Rope ring
            let ring = SKShapeNode(circleOfRadius: 4)
            ring.fillColor = .clear
            ring.strokeColor = SKColor(red: 0.5, green: 0.4, blue: 0.3, alpha: 0.7)
            ring.lineWidth = 1
            ring.position = CGPoint(x: 0, y: 18)
            container.addChild(ring)

        case .chasmmoss:
            let moss = SKShapeNode(ellipseOf: CGSize(width: 10, height: 5))
            moss.fillColor = SKColor(red: 0.15, green: 0.35, blue: 0.2, alpha: 0.8)
            moss.strokeColor = .clear
            container.addChild(moss)

        case .rockbud:
            // Shell
            let shell = SKShapeNode(ellipseOf: CGSize(width: 8, height: 6))
            shell.fillColor = SKColor(red: 0.35, green: 0.3, blue: 0.28, alpha: 1)
            shell.strokeColor = .clear
            shell.position = CGPoint(x: 0, y: 2)
            container.addChild(shell)
            // Vine peeking out
            let vine = SKShapeNode(rectOf: CGSize(width: 2, height: 5))
            vine.fillColor = SKColor(red: 0.2, green: 0.5, blue: 0.25, alpha: 0.9)
            vine.strokeColor = .clear
            vine.position = CGPoint(x: 2, y: 6)
            vine.zRotation = 0.3
            container.addChild(vine)

        // --- Taldain ---
        case .sandDune:
            let dune = SKShapeNode(ellipseOf: CGSize(width: 20, height: 8))
            dune.fillColor = SKColor(red: 0.35, green: 0.3, blue: 0.18, alpha: 0.6)
            dune.strokeColor = .clear
            container.addChild(dune)

        case .cactus:
            let stem = SKShapeNode(rectOf: CGSize(width: 4, height: 14))
            stem.fillColor = SKColor(red: 0.2, green: 0.4, blue: 0.15, alpha: 1)
            stem.strokeColor = .clear
            stem.position = CGPoint(x: 0, y: 7)
            container.addChild(stem)
            let arm = SKShapeNode(rectOf: CGSize(width: 3, height: 8))
            arm.fillColor = SKColor(red: 0.2, green: 0.4, blue: 0.15, alpha: 1)
            arm.strokeColor = .clear
            arm.position = CGPoint(x: 5, y: 10)
            container.addChild(arm)

        case .oasis:
            let water = SKShapeNode(ellipseOf: CGSize(width: 18, height: 10))
            water.fillColor = SKColor(red: 0.1, green: 0.3, blue: 0.5, alpha: 0.6)
            water.strokeColor = SKColor(red: 0.2, green: 0.4, blue: 0.6, alpha: 0.3)
            water.lineWidth = 1
            container.addChild(water)

        case .sandRock:
            let rock = SKShapeNode(ellipseOf: CGSize(width: 10, height: 7))
            rock.fillColor = SKColor(red: 0.4, green: 0.35, blue: 0.25, alpha: 1)
            rock.strokeColor = .clear
            rock.position = CGPoint(x: 0, y: 2)
            container.addChild(rock)

        // --- Nalthis ---
        case .flower:
            let stem = SKShapeNode(rectOf: CGSize(width: 1, height: 8))
            stem.fillColor = SKColor(red: 0.15, green: 0.4, blue: 0.15, alpha: 1)
            stem.strokeColor = .clear
            stem.position = CGPoint(x: 0, y: 4)
            container.addChild(stem)
            let petal = SKShapeNode(circleOfRadius: 3)
            let hue = CGFloat(rng.next() % 100) / 100.0
            petal.fillColor = SKColor(hue: hue, saturation: 0.8, brightness: 0.9, alpha: 1)
            petal.strokeColor = .clear
            petal.position = CGPoint(x: 0, y: 9)
            container.addChild(petal)

        case .garden:
            for i in 0..<3 {
                let leaf = SKShapeNode(ellipseOf: CGSize(width: 5, height: 3))
                leaf.fillColor = SKColor(red: 0.1, green: 0.4 + CGFloat(i) * 0.1, blue: 0.15, alpha: 0.8)
                leaf.strokeColor = .clear
                leaf.position = CGPoint(x: CGFloat(i - 1) * 5, y: CGFloat(i) * 2)
                container.addChild(leaf)
            }

        case .statue:
            let base = SKShapeNode(rectOf: CGSize(width: 10, height: 4))
            base.fillColor = SKColor(white: 0.35, alpha: 1)
            base.strokeColor = .clear
            base.position = CGPoint(x: 0, y: 2)
            container.addChild(base)
            let body = SKShapeNode(rectOf: CGSize(width: 6, height: 16))
            body.fillColor = SKColor(white: 0.4, alpha: 1)
            body.strokeColor = SKColor(white: 0.5, alpha: 0.3)
            body.lineWidth = 0.5
            body.position = CGPoint(x: 0, y: 12)
            container.addChild(body)

        case .fountain:
            let basin = SKShapeNode(ellipseOf: CGSize(width: 16, height: 10))
            basin.fillColor = SKColor(red: 0.1, green: 0.2, blue: 0.4, alpha: 0.7)
            basin.strokeColor = SKColor(white: 0.4, alpha: 0.5)
            basin.lineWidth = 1
            basin.position = CGPoint(x: 0, y: 2)
            container.addChild(basin)

        // --- Shadesmar ---
        case .beadPile:
            for i in 0..<5 {
                let bead = SKShapeNode(circleOfRadius: 2)
                bead.fillColor = SKColor(red: 0.4, green: 0.3, blue: 0.5, alpha: 0.8)
                bead.strokeColor = .clear
                bead.position = CGPoint(x: CGFloat(i % 3) * 3 - 3, y: CGFloat(i / 3) * 3)
                container.addChild(bead)
            }

        case .flamespren:
            let flame = SKShapeNode(ellipseOf: CGSize(width: 5, height: 8))
            flame.fillColor = SKColor(red: 0.9, green: 0.5, blue: 0.1, alpha: 0.7)
            flame.strokeColor = .clear
            flame.position = CGPoint(x: 0, y: 6)
            container.addChild(flame)
            let flicker = SKAction.repeatForever(SKAction.sequence([
                SKAction.fadeAlpha(to: 0.4, duration: 0.3),
                SKAction.fadeAlpha(to: 0.8, duration: 0.3)
            ]))
            flame.run(flicker)

        case .glassTree:
            let trunk = SKShapeNode(rectOf: CGSize(width: 3, height: 16))
            trunk.fillColor = SKColor(red: 0.3, green: 0.2, blue: 0.5, alpha: 0.7)
            trunk.strokeColor = SKColor(red: 0.5, green: 0.3, blue: 0.7, alpha: 0.3)
            trunk.lineWidth = 0.5
            trunk.position = CGPoint(x: 0, y: 8)
            container.addChild(trunk)
            let crown = SKShapeNode(circleOfRadius: 6)
            crown.fillColor = SKColor(red: 0.4, green: 0.2, blue: 0.6, alpha: 0.5)
            crown.strokeColor = .clear
            crown.position = CGPoint(x: 0, y: 18)
            container.addChild(crown)

        case .shardPillar:
            let pillar = SKShapeNode(rectOf: CGSize(width: 5, height: 20))
            pillar.fillColor = SKColor(red: 0.25, green: 0.15, blue: 0.4, alpha: 0.9)
            pillar.strokeColor = SKColor(red: 0.5, green: 0.3, blue: 0.7, alpha: 0.4)
            pillar.lineWidth = 1
            pillar.position = CGPoint(x: 0, y: 10)
            container.addChild(pillar)

        // --- Komashi ---
        case .inkBlot:
            let blot = SKShapeNode(ellipseOf: CGSize(width: 12, height: 8))
            blot.fillColor = SKColor(red: 0.05, green: 0.02, blue: 0.08, alpha: 0.8)
            blot.strokeColor = .clear
            container.addChild(blot)

        case .paperLantern:
            let body = SKShapeNode(ellipseOf: CGSize(width: 6, height: 8))
            body.fillColor = SKColor(red: 0.9, green: 0.6, blue: 0.3, alpha: 0.7)
            body.strokeColor = SKColor(red: 0.7, green: 0.4, blue: 0.2, alpha: 0.5)
            body.lineWidth = 0.5
            body.position = CGPoint(x: 0, y: 10)
            container.addChild(body)
            let glow = SKAction.repeatForever(SKAction.sequence([
                SKAction.fadeAlpha(to: 0.5, duration: 1.0),
                SKAction.fadeAlpha(to: 0.9, duration: 1.0)
            ]))
            body.run(glow)

        case .nightmareResidue:
            let residue = SKShapeNode(ellipseOf: CGSize(width: 10, height: 6))
            residue.fillColor = SKColor(red: 0.15, green: 0.05, blue: 0.2, alpha: 0.6)
            residue.strokeColor = .clear
            container.addChild(residue)

        case .brush:
            let handle = SKShapeNode(rectOf: CGSize(width: 2, height: 12))
            handle.fillColor = SKColor(red: 0.3, green: 0.2, blue: 0.15, alpha: 1)
            handle.strokeColor = .clear
            handle.position = CGPoint(x: 0, y: 6)
            handle.zRotation = 0.4
            container.addChild(handle)

        // --- Sel ---
        case .aonGlyph:
            let glyph = SKShapeNode(circleOfRadius: 6)
            glyph.fillColor = .clear
            glyph.strokeColor = SKColor(red: 0.8, green: 0.7, blue: 0.3, alpha: 0.4)
            glyph.lineWidth = 1
            glyph.position = CGPoint(x: 0, y: 3)
            container.addChild(glyph)
            let pulse = SKAction.repeatForever(SKAction.sequence([
                SKAction.fadeAlpha(to: 0.2, duration: 2.0),
                SKAction.fadeAlpha(to: 0.6, duration: 2.0)
            ]))
            glyph.run(pulse)

        case .stoneColumn:
            let col = SKShapeNode(rectOf: CGSize(width: 6, height: 20))
            col.fillColor = SKColor(red: 0.3, green: 0.28, blue: 0.22, alpha: 1)
            col.strokeColor = SKColor(red: 0.35, green: 0.33, blue: 0.27, alpha: 0.5)
            col.lineWidth = 1
            col.position = CGPoint(x: 0, y: 10)
            container.addChild(col)

        case .mossCluster:
            let moss = SKShapeNode(ellipseOf: CGSize(width: 8, height: 5))
            moss.fillColor = SKColor(red: 0.15, green: 0.3, blue: 0.12, alpha: 0.7)
            moss.strokeColor = .clear
            container.addChild(moss)

        case .shrine:
            let base = SKShapeNode(rectOf: CGSize(width: 12, height: 3))
            base.fillColor = SKColor(red: 0.3, green: 0.28, blue: 0.22, alpha: 1)
            base.strokeColor = .clear
            base.position = CGPoint(x: 0, y: 1)
            container.addChild(base)
            let top = SKShapeNode(rectOf: CGSize(width: 8, height: 10))
            top.fillColor = SKColor(red: 0.35, green: 0.32, blue: 0.25, alpha: 1)
            top.strokeColor = .clear
            top.position = CGPoint(x: 0, y: 8)
            container.addChild(top)
        }

        container.setScale(CGFloat(scale))
        return container
    }
}

// MARK: - Seeded RNG for deterministic decoration placement

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
