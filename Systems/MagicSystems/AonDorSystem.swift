import Foundation
import SpriteKit

/// Système AonDor — Sel (Elantris)
/// Les Élantriens dessinent des Aons (glyphes lumineux) pour canaliser le Dor
/// Le système combinatoire permet de fusionner des Aons pour des effets plus puissants
final class AonDorSystem {

    // MARK: - Aons de base

    enum Aon: String, CaseIterable {
        case rao  // Esprit / Lumière — explosion AoE
        case ashe // Protection — bouclier
        case tia  // Voyage — téléportation
        case ien  // Sagesse — soin
        case daa  // Puissance — buff dégâts
        case ela  // Concentration — précision + crit
        case ehe  // Feu — dégâts feu directionnel
        case are  // Unité — lien entre alliés

        var displayName: String {
            switch self {
            case .rao:  return "Aon Rao"
            case .ashe: return "Aon Ashe"
            case .tia:  return "Aon Tia"
            case .ien:  return "Aon Ien"
            case .daa:  return "Aon Daa"
            case .ela:  return "Aon Ela"
            case .ehe:  return "Aon Ehe"
            case .are:  return "Aon Are"
            }
        }

        var glyphColor: SKColor {
            switch self {
            case .rao:  return SKColor(red: 1.0, green: 0.9, blue: 0.3, alpha: 1.0)
            case .ashe: return SKColor(red: 0.3, green: 0.8, blue: 1.0, alpha: 1.0)
            case .tia:  return SKColor(red: 0.7, green: 0.3, blue: 1.0, alpha: 1.0)
            case .ien:  return SKColor(red: 0.3, green: 1.0, blue: 0.5, alpha: 1.0)
            case .daa:  return SKColor(red: 1.0, green: 0.4, blue: 0.2, alpha: 1.0)
            case .ela:  return SKColor(red: 0.8, green: 0.8, blue: 1.0, alpha: 1.0)
            case .ehe:  return SKColor(red: 1.0, green: 0.5, blue: 0.1, alpha: 1.0)
            case .are:  return SKColor(red: 0.9, green: 0.9, blue: 0.5, alpha: 1.0)
            }
        }
    }

    // MARK: - Aon Combinations (système combinatoire)

    struct AonCombination {
        let primary: Aon
        let modifier: Aon
        let resultName: String
        let description: String
        let damageMultiplier: Double
        let extraEffect: StatusEffectType?
    }

    let combinations: [AonCombination] = [
        AonCombination(primary: .rao, modifier: .ehe,
                       resultName: "Aon Rao-Ehe", description: "Explosion de feu sacré !",
                       damageMultiplier: 2.0, extraEffect: .burning),
        AonCombination(primary: .ashe, modifier: .daa,
                       resultName: "Aon Ashe-Daa", description: "Bouclier offensif — renvoie les dégâts !",
                       damageMultiplier: 0.5, extraEffect: .shielded),
        AonCombination(primary: .ien, modifier: .are,
                       resultName: "Aon Ien-Are", description: "Soin de zone — guérit tous les alliés !",
                       damageMultiplier: 0, extraEffect: .healing),
        AonCombination(primary: .tia, modifier: .ela,
                       resultName: "Aon Tia-Ela", description: "Téléportation de précision — frappe éclair !",
                       damageMultiplier: 1.5, extraEffect: .stunned),
        AonCombination(primary: .ehe, modifier: .rao,
                       resultName: "Aon Ehe-Rao", description: "Pilier de feu divin !",
                       damageMultiplier: 2.5, extraEffect: .burning),
    ]

    // MARK: - Aon Result

    struct AonResult {
        let success: Bool
        let description: String
        let damage: Int
        let healing: Int
        let statusEffect: StatusEffectType?
        let duration: TimeInterval
        let dorCost: Int
        let glyphColor: SKColor
    }

    // MARK: - Dessiner un Aon simple

    func drawAon(
        _ aon: Aon,
        champion: inout Champion,
        targetPosition: GridPosition?
    ) -> AonResult {
        let baseCost = 10

        guard champion.currentInvestiture >= baseCost else {
            return AonResult(success: false, description: "Le Dor ne coule plus...",
                             damage: 0, healing: 0, statusEffect: nil, duration: 0,
                             dorCost: 0, glyphColor: .white)
        }

        champion.currentInvestiture -= baseCost
        let spirit = champion.baseStats.spirit

        switch aon {
        case .rao:
            return AonResult(
                success: true,
                description: "Aon Rao — Explosion de Lumière !",
                damage: 22 + spirit,
                healing: 0,
                statusEffect: nil,
                duration: 0,
                dorCost: baseCost,
                glyphColor: aon.glyphColor
            )

        case .ashe:
            return AonResult(
                success: true,
                description: "Aon Ashe — Bouclier du Dor !",
                damage: 0, healing: 0,
                statusEffect: .shielded,
                duration: 10.0,
                dorCost: baseCost,
                glyphColor: aon.glyphColor
            )

        case .tia:
            return AonResult(
                success: true,
                description: "Aon Tia — Téléportation !",
                damage: 0, healing: 0,
                statusEffect: nil,
                duration: 0,
                dorCost: baseCost,
                glyphColor: aon.glyphColor
            )

        case .ien:
            let heal = 25 + spirit * 2
            champion.currentHP = min(champion.maxHP, champion.currentHP + heal)
            return AonResult(
                success: true,
                description: "Aon Ien — Guérison par le Dor !",
                damage: 0,
                healing: heal,
                statusEffect: .healing,
                duration: 3.0,
                dorCost: baseCost,
                glyphColor: aon.glyphColor
            )

        case .daa:
            return AonResult(
                success: true,
                description: "Aon Daa — Puissance du Dor !",
                damage: 0, healing: 0,
                statusEffect: nil, // Buff appliqué séparément : +40% dégâts 8s
                duration: 8.0,
                dorCost: baseCost,
                glyphColor: aon.glyphColor
            )

        case .ela:
            return AonResult(
                success: true,
                description: "Aon Ela — Concentration parfaite !",
                damage: 0, healing: 0,
                statusEffect: .revealed,
                duration: 12.0,
                dorCost: baseCost,
                glyphColor: aon.glyphColor
            )

        case .ehe:
            return AonResult(
                success: true,
                description: "Aon Ehe — Flamme du Dor !",
                damage: 18 + spirit,
                healing: 0,
                statusEffect: .burning,
                duration: 4.0,
                dorCost: baseCost,
                glyphColor: aon.glyphColor
            )

        case .are:
            return AonResult(
                success: true,
                description: "Aon Are — Lien d'Unité !",
                damage: 0, healing: 0,
                statusEffect: nil,
                duration: 15.0,
                dorCost: baseCost,
                glyphColor: aon.glyphColor
            )
        }
    }

    // MARK: - Dessiner une combinaison d'Aons

    func drawCombination(
        primary: Aon,
        modifier: Aon,
        champion: inout Champion,
        targetPosition: GridPosition?
    ) -> AonResult {
        let comboCost = 20

        guard champion.currentInvestiture >= comboCost else {
            return AonResult(success: false, description: "Pas assez de Dor pour la combinaison",
                             damage: 0, healing: 0, statusEffect: nil, duration: 0,
                             dorCost: 0, glyphColor: .white)
        }

        // Chercher la combinaison
        if let combo = combinations.first(where: { $0.primary == primary && $0.modifier == modifier }) {
            champion.currentInvestiture -= comboCost
            let spirit = champion.baseStats.spirit
            let baseDamage = Int(Double(30 + spirit) * combo.damageMultiplier)
            let healing = combo.damageMultiplier == 0 ? 35 + spirit * 2 : 0

            if healing > 0 {
                champion.currentHP = min(champion.maxHP, champion.currentHP + healing)
            }

            return AonResult(
                success: true,
                description: combo.description,
                damage: baseDamage,
                healing: healing,
                statusEffect: combo.extraEffect,
                duration: 5.0,
                dorCost: comboCost,
                glyphColor: primary.glyphColor
            )
        }

        // Combinaison inconnue — effet aléatoire faible
        champion.currentInvestiture -= comboCost / 2
        return AonResult(
            success: true,
            description: "Combinaison instable — le glyphe vacille...",
            damage: 8 + champion.baseStats.spirit / 2,
            healing: 0,
            statusEffect: nil,
            duration: 0,
            dorCost: comboCost / 2,
            glyphColor: .gray
        )
    }

    // MARK: - Effets visuels

    func glyphDrawEffect(aon: Aon) -> SKAction {
        // Le glyphe apparaît trait par trait
        SKAction.sequence([
            SKAction.fadeAlpha(to: 0, duration: 0),
            SKAction.group([
                SKAction.fadeAlpha(to: 1.0, duration: 0.5),
                SKAction.scale(to: 1.5, duration: 0.5),
                SKAction.colorize(with: aon.glyphColor, colorBlendFactor: 1.0, duration: 0.3)
            ]),
            SKAction.wait(forDuration: 0.3),
            SKAction.group([
                SKAction.scale(to: 0.1, duration: 0.3),
                SKAction.fadeOut(withDuration: 0.3)
            ]),
            SKAction.removeFromParent()
        ])
    }

    func combinationGlyphEffect(primary: Aon, modifier: Aon) -> SKAction {
        // Deux glyphes fusionnent
        SKAction.sequence([
            SKAction.colorize(with: primary.glyphColor, colorBlendFactor: 1.0, duration: 0.3),
            SKAction.colorize(with: modifier.glyphColor, colorBlendFactor: 1.0, duration: 0.3),
            SKAction.group([
                SKAction.scale(to: 2.0, duration: 0.4),
                SKAction.colorize(with: .white, colorBlendFactor: 1.0, duration: 0.2)
            ]),
            SKAction.group([
                SKAction.scale(to: 0.1, duration: 0.3),
                SKAction.fadeOut(withDuration: 0.3)
            ]),
            SKAction.removeFromParent()
        ])
    }
}
