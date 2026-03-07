import Foundation
import SpriteKit

/// Système de Maîtrise du Sable (Sand Mastery) — Taldain
/// Les Maîtres du Sable contrôlent le sable blanc de Dayside grâce à l'Investiture solaire
final class SandMasterySystem {

    // MARK: - Sand Forms (formes de sable)

    enum SandForm: String, CaseIterable {
        case lash       // Fouet de sable — attaque directionnelle
        case shield     // Mur de sable — bouclier protecteur
        case swarm      // Essaim de sable — dégâts AoE
        case platform   // Plateforme de sable — élévation/mobilité
        case spike      // Pics de sable — piège au sol
        case storm      // Tempête de sable — ultime AoE massif
    }

    // MARK: - Utiliser une forme de sable

    struct SandResult {
        let success: Bool
        let description: String
        let damage: Int
        let healing: Int
        let statusEffect: StatusEffectType?
        let duration: TimeInterval
        let waterCost: Int  // Le sable consomme l'eau du corps
    }

    func useSandForm(
        _ form: SandForm,
        champion: inout Champion,
        targetPosition: GridPosition?
    ) -> SandResult {
        // La Maîtrise du Sable consomme l'hydratation (Investiture)
        let baseCost = 12

        guard champion.currentInvestiture >= baseCost else {
            return SandResult(success: false, description: "Déshydraté — pas assez d'eau !",
                              damage: 0, healing: 0, statusEffect: nil, duration: 0, waterCost: 0)
        }

        champion.currentInvestiture -= baseCost

        switch form {
        case .lash:
            return SandResult(
                success: true,
                description: "Fouet de Sable !",
                damage: 18 + champion.baseStats.spirit,
                healing: 0,
                statusEffect: nil,
                duration: 0,
                waterCost: baseCost
            )

        case .shield:
            return SandResult(
                success: true,
                description: "Mur de Sable Protecteur !",
                damage: 0, healing: 0,
                statusEffect: .shielded,
                duration: 6.0,
                waterCost: baseCost
            )

        case .swarm:
            return SandResult(
                success: true,
                description: "Essaim de Sable — les grains déchirent tout !",
                damage: 12 + champion.baseStats.spirit / 2,
                healing: 0,
                statusEffect: .burning,
                duration: 4.0,
                waterCost: baseCost
            )

        case .platform:
            return SandResult(
                success: true,
                description: "Plateforme de Sable — élévation !",
                damage: 0, healing: 0,
                statusEffect: .flying,
                duration: 5.0,
                waterCost: baseCost
            )

        case .spike:
            return SandResult(
                success: true,
                description: "Pics de Sable jaillissent du sol !",
                damage: 22 + champion.baseStats.spirit,
                healing: 0,
                statusEffect: .stunned,
                duration: 2.0,
                waterCost: baseCost
            )

        case .storm:
            champion.currentInvestiture -= baseCost  // Double coût pour l'ultime
            return SandResult(
                success: true,
                description: "TEMPÊTE DE SABLE — le désert se déchaîne !",
                damage: 40 + champion.baseStats.spirit * 2,
                healing: 0,
                statusEffect: .slowed,
                duration: 6.0,
                waterCost: baseCost * 2
            )
        }
    }

    // MARK: - Recharge (boire de l'eau)

    func drinkWater(champion: inout Champion, amount: Int) {
        champion.currentInvestiture = min(champion.maxInvestiture, champion.currentInvestiture + amount)
    }

    // MARK: - Effets visuels

    func sandLashEffect(from origin: CGPoint, direction: CGFloat) -> SKAction {
        SKAction.sequence([
            SKAction.moveBy(x: cos(direction) * 80, y: sin(direction) * 80, duration: 0.15),
            SKAction.removeFromParent()
        ])
    }

    func sandShieldEffect() -> SKAction {
        SKAction.repeatForever(SKAction.rotate(byAngle: .pi * 2, duration: 2.0))
    }

    func sandStormEffect() -> [SKAction] {
        (0..<8).map { i in
            let angle = CGFloat(i) * .pi / 4
            return SKAction.group([
                SKAction.moveBy(x: cos(angle) * 100, y: sin(angle) * 100, duration: 0.4),
                SKAction.fadeOut(withDuration: 0.4)
            ])
        }
    }
}
