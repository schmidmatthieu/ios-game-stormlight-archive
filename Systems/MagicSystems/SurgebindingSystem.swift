import Foundation
import SpriteKit

/// Système de Surgebinding — pouvoirs des Chevaliers Radieux alimentés par la Lumière d'orage
final class SurgebindingSystem {

    // MARK: - Surges disponibles par ordre

    enum Surge: String, CaseIterable {
        case adhesion      // Coller des choses ensemble, boucliers
        case gravitation   // Manipuler la gravité, vol
        case abrasion      // Friction — glisser, esquiver
        case progression   // Croissance — guérison
        case illumination  // Illusions
        case transformation // Changer la matière (Soulcasting)
        case tension       // Rigidifier, renforcer
    }

    func surgesForOrder(_ order: RadiantOrder) -> (Surge, Surge) {
        switch order {
        case .windrunner:  return (.adhesion, .gravitation)
        case .lightweaver: return (.illumination, .transformation)
        case .bondsmith:   return (.tension, .adhesion)
        case .edgedancer:  return (.abrasion, .progression)
        }
    }

    // MARK: - Utiliser une Surge

    struct SurgeResult {
        let success: Bool
        let description: String
        let damage: Int
        let healing: Int
        let statusEffect: StatusEffectType?
        let duration: TimeInterval
        let stormlightCost: Double
    }

    func useSurge(
        _ surge: Surge,
        champion: inout Champion,
        targetPosition: GridPosition?
    ) -> SurgeResult {
        let cost: Double = 15.0

        guard let stormlight = champion.stormlightAmount, stormlight >= cost else {
            return SurgeResult(success: false, description: "Pas assez de Lumière d'orage",
                               damage: 0, healing: 0, statusEffect: nil, duration: 0, stormlightCost: 0)
        }

        champion.stormlightAmount = stormlight - cost

        switch surge {
        case .gravitation:
            return SurgeResult(
                success: true,
                description: "Lashage ! La gravité se retourne",
                damage: 20 + champion.baseStats.spirit,
                healing: 0,
                statusEffect: .flying,
                duration: 6.0,
                stormlightCost: cost
            )

        case .adhesion:
            return SurgeResult(
                success: true,
                description: "Adhésion — bouclier de Lumière d'orage !",
                damage: 0, healing: 0,
                statusEffect: .shielded,
                duration: 8.0,
                stormlightCost: cost
            )

        case .abrasion:
            return SurgeResult(
                success: true,
                description: "Abrasion — glissement parfait !",
                damage: 0, healing: 0,
                statusEffect: .haste,
                duration: 5.0,
                stormlightCost: cost
            )

        case .progression:
            let healAmount = 30 + champion.baseStats.spirit * 2
            champion.currentHP = min(champion.maxHP, champion.currentHP + healAmount)
            return SurgeResult(
                success: true,
                description: "Progression — guérison Radiante !",
                damage: 0,
                healing: healAmount,
                statusEffect: .healing,
                duration: 3.0,
                stormlightCost: cost
            )

        case .illumination:
            return SurgeResult(
                success: true,
                description: "Illumination — illusion créée !",
                damage: 0, healing: 0,
                statusEffect: .decoy,
                duration: 10.0,
                stormlightCost: cost
            )

        case .transformation:
            return SurgeResult(
                success: true,
                description: "Transformation — la matière se reconfigure !",
                damage: 25 + champion.baseStats.spirit,
                healing: 0,
                statusEffect: .stunned,
                duration: 2.0,
                stormlightCost: cost * 1.5
            )

        case .tension:
            return SurgeResult(
                success: true,
                description: "Tension — le sol se rigidifie !",
                damage: 0, healing: 0,
                statusEffect: .slowed,
                duration: 6.0,
                stormlightCost: cost
            )
        }
    }

    // MARK: - Recharge de Lumière d'orage

    func rechargeFromHighstorm(champion: inout Champion) {
        champion.stormlightAmount = Double(champion.maxInvestiture)
    }

    func rechargeFromGem(champion: inout Champion, gemSize: GemSize) {
        let amount: Double
        switch gemSize {
        case .chip:   amount = 10
        case .mark:   amount = 30
        case .broam:  amount = 75
        }
        champion.stormlightAmount = min(
            Double(champion.maxInvestiture),
            (champion.stormlightAmount ?? 0) + amount
        )
    }

    // MARK: - Effets visuels

    func gravitationLashEffect() -> SKAction {
        SKAction.sequence([
            SKAction.moveBy(x: 0, y: 50, duration: 0.3),
            SKAction.wait(forDuration: 5.4),
            SKAction.moveBy(x: 0, y: -50, duration: 0.3)
        ])
    }

    func stormlightGlowEffect() -> SKAction {
        let glow = SKAction.repeatForever(SKAction.sequence([
            SKAction.colorize(with: .cyan, colorBlendFactor: 0.4, duration: 0.5),
            SKAction.colorize(withColorBlendFactor: 0.1, duration: 0.5)
        ]))
        return glow
    }
}

// MARK: - Gem Types

enum GemSize: String, Codable {
    case chip   // Petite gemme
    case mark   // Moyenne
    case broam  // Grande (précieuse)
}
