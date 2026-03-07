import Foundation
import SpriteKit

/// Système d'Éveil (Awakening) — Nalthis
/// Les Éveilleurs utilisent des Souffles (Breaths) pour animer des objets
/// Plus on accumule de Souffles, plus on atteint des Élévations (Heightenings) supérieures
final class AwakeningSystem {

    // MARK: - Heightenings (Élévations)

    enum Heightening: Int, CaseIterable, Comparable {
        case first  = 50    // Perception des auras
        case second = 200   // Reconnaissance parfaite des couleurs
        case third  = 600   // Perception des changements chromatiques
        case fourth = 1000  // Agilité ageless
        case fifth  = 2000  // Immunité aux poisons et maladies

        static func < (lhs: Heightening, rhs: Heightening) -> Bool {
            lhs.rawValue < rhs.rawValue
        }

        var passiveBuff: String {
            switch self {
            case .first:  return "Détection des auras d'Investiture"
            case .second: return "Esquive +15%"
            case .third:  return "Dégâts magiques +20%"
            case .fourth: return "Immunité au vieillissement, Agilité +30%"
            case .fifth:  return "Immunité aux poisons, régénération passive"
            }
        }
    }

    // MARK: - Awakening Commands

    enum AwakeningCommand: String, CaseIterable {
        case animateCloth    // Animer un vêtement → allié temporaire
        case animateWeapon   // Animer une arme → attaque auto
        case chromaAura      // Aura de couleur → buff de zone
        case lifeleecher     // Drainer la couleur → dégâts + heal
        case royalCommand    // Commande Royale → CC massif
        case divineBreath    // Souffle Divin — ultime, résurrection / dégâts massifs
    }

    // MARK: - Awakening Result

    struct AwakenResult {
        let success: Bool
        let description: String
        let damage: Int
        let healing: Int
        let statusEffect: StatusEffectType?
        let duration: TimeInterval
        let breathCost: Int
        let summonedAlly: Bool
    }

    func currentHeightening(breathCount: Int) -> Heightening? {
        Heightening.allCases.reversed().first { breathCount >= $0.rawValue }
    }

    func useCommand(
        _ command: AwakeningCommand,
        champion: inout Champion,
        targetPosition: GridPosition?
    ) -> AwakenResult {
        guard let breathCount = champion.breathCount else {
            return AwakenResult(success: false, description: "Pas d'Éveilleur !",
                                damage: 0, healing: 0, statusEffect: nil, duration: 0,
                                breathCost: 0, summonedAlly: false)
        }

        let baseCost: Int
        switch command {
        case .animateCloth:   baseCost = 5
        case .animateWeapon:  baseCost = 8
        case .chromaAura:     baseCost = 3
        case .lifeleecher:    baseCost = 10
        case .royalCommand:   baseCost = 15
        case .divineBreath:   baseCost = 30
        }

        guard breathCount >= baseCost else {
            return AwakenResult(success: false, description: "Pas assez de Souffles (\(breathCount)/\(baseCost))",
                                damage: 0, healing: 0, statusEffect: nil, duration: 0,
                                breathCost: 0, summonedAlly: false)
        }

        // Les Souffles utilisés pour Éveiller sont temporairement investis
        // Ils reviennent quand l'animation se termine (contrairement aux autres systèmes)
        if let current = champion.breathCount {
            champion.breathCount = current - baseCost
        }
        champion.currentInvestiture = max(0, champion.currentInvestiture - 5)

        let spiritBonus = champion.baseStats.spirit

        switch command {
        case .animateCloth:
            return AwakenResult(
                success: true,
                description: "Éveil — le vêtement prend vie et combat !",
                damage: 0, healing: 0, statusEffect: nil,
                duration: 20.0,
                breathCost: baseCost,
                summonedAlly: true
            )

        case .animateWeapon:
            return AwakenResult(
                success: true,
                description: "Éveil — l'arme danse seule et frappe !",
                damage: 12 + spiritBonus,
                healing: 0, statusEffect: nil,
                duration: 15.0,
                breathCost: baseCost,
                summonedAlly: true
            )

        case .chromaAura:
            return AwakenResult(
                success: true,
                description: "Aura BioChroma — les couleurs s'intensifient !",
                damage: 0, healing: 0,
                statusEffect: .shielded,
                duration: 12.0,
                breathCost: baseCost,
                summonedAlly: false
            )

        case .lifeleecher:
            let damage = 20 + spiritBonus
            let heal = damage / 3
            champion.currentHP = min(champion.maxHP, champion.currentHP + heal)
            return AwakenResult(
                success: true,
                description: "Drainage Chromatique — les couleurs se fanent !",
                damage: damage,
                healing: heal,
                statusEffect: .slowed,
                duration: 3.0,
                breathCost: baseCost,
                summonedAlly: false
            )

        case .royalCommand:
            return AwakenResult(
                success: true,
                description: "Commande Royale — \"À GENOUX !\"",
                damage: 0, healing: 0,
                statusEffect: .stunned,
                duration: 5.0,
                breathCost: baseCost,
                summonedAlly: false
            )

        case .divineBreath:
            // L'ultime : soit résurrection (si PV bas), soit dégâts massifs
            if champion.currentHP < champion.maxHP / 4 {
                champion.currentHP = champion.maxHP
                return AwakenResult(
                    success: true,
                    description: "SOUFFLE DIVIN — résurrection totale !",
                    damage: 0, healing: champion.maxHP,
                    statusEffect: .healing,
                    duration: 5.0,
                    breathCost: baseCost,
                    summonedAlly: false
                )
            } else {
                return AwakenResult(
                    success: true,
                    description: "SOUFFLE DIVIN — explosion chromatique !",
                    damage: 60 + spiritBonus * 3,
                    healing: 0,
                    statusEffect: .stunned,
                    duration: 3.0,
                    breathCost: baseCost,
                    summonedAlly: false
                )
            }
        }
    }

    // MARK: - Récupérer des Souffles

    func absorbBreath(from defeated: Bool, champion: inout Champion, amount: Int) {
        if let current = champion.breathCount {
            champion.breathCount = current + amount
        }
    }

    // MARK: - Effets visuels

    func chromaAuraEffect() -> SKAction {
        let colors: [SKColor] = [.red, .orange, .yellow, .green, .blue, .purple]
        var actions: [SKAction] = []
        for color in colors {
            actions.append(SKAction.colorize(with: color, colorBlendFactor: 0.3, duration: 0.3))
        }
        actions.append(SKAction.colorize(withColorBlendFactor: 0, duration: 0.3))
        return SKAction.repeatForever(SKAction.sequence(actions))
    }

    func colorDrainEffect(at position: CGPoint) -> SKAction {
        // Les couleurs s'estompent autour du point
        SKAction.sequence([
            SKAction.colorize(with: .gray, colorBlendFactor: 0.8, duration: 0.5),
            SKAction.colorize(withColorBlendFactor: 0, duration: 1.0)
        ])
    }

    func divineBreathEffect() -> SKAction {
        SKAction.sequence([
            SKAction.scale(to: 2.0, duration: 0.3),
            SKAction.group([
                SKAction.scale(to: 0.5, duration: 0.5),
                SKAction.fadeOut(withDuration: 0.5)
            ]),
            SKAction.removeFromParent()
        ])
    }
}
