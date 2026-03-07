import Foundation
import SpriteKit

/// Système de magie Allomantique — brûler des métaux pour des pouvoirs
final class AllomancySystem {

    // MARK: - Brûler un métal

    struct BurnResult {
        let success: Bool
        let effectDescription: String
        let damage: Int
        let statusEffect: StatusEffectType?
        let duration: TimeInterval
    }

    func burnMetal(
        _ metal: SkillResourceType,
        champion: inout Champion,
        targetPosition: GridPosition?
    ) -> BurnResult {
        // Vérifier les réserves
        guard let reserves = champion.metalReserves,
              let amount = reserves[metal],
              amount > 0 else {
            return BurnResult(success: false, effectDescription: "Pas de réserves de \(metal.rawValue)",
                              damage: 0, statusEffect: nil, duration: 0)
        }

        // Consommer le métal
        if let current = champion.metalReserves?[metal] {
            champion.metalReserves?[metal] = current - 1
        }
        champion.currentInvestiture = max(0, champion.currentInvestiture - 5)

        // Appliquer l'effet
        switch metal {
        case .steel:
            return BurnResult(
                success: true,
                effectDescription: "Poussée d'Acier ! Projectile métallique lancé",
                damage: 15 + champion.baseStats.spirit,
                statusEffect: nil, duration: 0
            )

        case .iron:
            return BurnResult(
                success: true,
                effectDescription: "Tirage de Fer ! Attire la cible",
                damage: 8 + champion.baseStats.spirit / 2,
                statusEffect: .stunned, duration: 1.0
            )

        case .tin:
            return BurnResult(
                success: true,
                effectDescription: "Étain brûlé — sens amplifiés",
                damage: 0,
                statusEffect: .revealed, duration: 10.0
            )

        case .pewter:
            return BurnResult(
                success: true,
                effectDescription: "Pewter brûlé — force surhumaine !",
                damage: 0,
                statusEffect: nil, duration: 8.0
            )
            // Buff appliqué séparément: +50% dégâts physiques pendant la durée

        case .bronze:
            return BurnResult(
                success: true,
                effectDescription: "Bronze — pulsations Allomantiques détectées",
                damage: 0,
                statusEffect: .revealed, duration: 15.0
            )

        case .copper:
            return BurnResult(
                success: true,
                effectDescription: "Cuivre — nuage de fumée protecteur",
                damage: 0,
                statusEffect: .invisible, duration: 8.0
            )

        case .zinc:
            return BurnResult(
                success: true,
                effectDescription: "Zinc — émotions enflammées !",
                damage: 0,
                statusEffect: .enraged, duration: 5.0
            )

        case .brass:
            return BurnResult(
                success: true,
                effectDescription: "Laiton — émotions apaisées",
                damage: 0,
                statusEffect: .calmed, duration: 5.0
            )

        default:
            return BurnResult(success: false, effectDescription: "Métal non-allomantique",
                              damage: 0, statusEffect: nil, duration: 0)
        }
    }

    // MARK: - Recharger les réserves (acheter/looter des fioles de métaux)

    func refillMetal(_ metal: SkillResourceType, amount: Int, champion: inout Champion) {
        if champion.metalReserves == nil {
            champion.metalReserves = [:]
        }
        champion.metalReserves?[metal, default: 0] += amount
    }

    // MARK: - Effets visuels (retourne des SKActions)

    func steelPushEffect(from origin: CGPoint, to target: CGPoint) -> SKAction {
        let projectile = SKAction.sequence([
            SKAction.move(to: target, duration: 0.2),
            SKAction.removeFromParent()
        ])
        return projectile
    }

    func ironPullEffect(from target: CGPoint, to origin: CGPoint) -> SKAction {
        return SKAction.move(to: origin, duration: 0.3)
    }

    func pewterBurnEffect() -> SKAction {
        let glow = SKAction.sequence([
            SKAction.colorize(with: .orange, colorBlendFactor: 0.5, duration: 0.3),
            SKAction.wait(forDuration: 7.4),
            SKAction.colorize(withColorBlendFactor: 0, duration: 0.3)
        ])
        return glow
    }
}
