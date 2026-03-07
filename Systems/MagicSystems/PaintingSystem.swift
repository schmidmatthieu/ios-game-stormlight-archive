import Foundation
import SpriteKit

/// Système de Peinture de Cauchemars — Komashi (Yumi and the Nightmare Painter)
/// Les Peintres capturent et neutralisent les cauchemars en les peignant
/// Les Yoki-hijo empilent des pierres pour canaliser l'énergie spirituelle
final class PaintingSystem {

    // MARK: - Painting Techniques

    enum PaintingTechnique: String, CaseIterable {
        case capture        // Capturer un cauchemar par le dessin — CC puissant
        case banish         // Bannir le cauchemar — gros dégâts single target
        case nightmare_ward // Barrière anti-cauchemar — zone de protection
        case ink_slash      // Trait d'encre — attaque rapide
        case masterpiece    // Chef-d'œuvre — ultime, transforme la réalité
    }

    // MARK: - Stone Stacking (Yoki-hijo)

    enum StoneStack: String, CaseIterable {
        case meditation   // Empilement simple — régénération passive
        case ward         // Empilement de garde — buff défensif
        case summon       // Empilement d'invocation — invoquer un allié spirituel
        case convergence  // Grand empilement — buff massif de zone
    }

    // MARK: - Paint Result

    struct PaintResult {
        let success: Bool
        let description: String
        let damage: Int
        let healing: Int
        let statusEffect: StatusEffectType?
        let duration: TimeInterval
        let inkCost: Int
    }

    func usePaintingTechnique(
        _ technique: PaintingTechnique,
        champion: inout Champion,
        targetPosition: GridPosition?
    ) -> PaintResult {
        let baseCost = 10

        guard champion.currentInvestiture >= baseCost else {
            return PaintResult(success: false, description: "Plus d'encre !",
                               damage: 0, healing: 0, statusEffect: nil, duration: 0, inkCost: 0)
        }

        champion.currentInvestiture -= baseCost

        switch technique {
        case .capture:
            return PaintResult(
                success: true,
                description: "Capture du Cauchemar — le pinceau danse !",
                damage: 5,
                healing: 0,
                statusEffect: .stunned,
                duration: 4.0,
                inkCost: baseCost
            )

        case .banish:
            return PaintResult(
                success: true,
                description: "Bannissement — le cauchemar se dissipe !",
                damage: 30 + champion.baseStats.spirit * 2,
                healing: 0,
                statusEffect: nil,
                duration: 0,
                inkCost: baseCost
            )

        case .nightmare_ward:
            return PaintResult(
                success: true,
                description: "Barrière Anti-Cauchemar érigée !",
                damage: 0,
                healing: 0,
                statusEffect: .shielded,
                duration: 8.0,
                inkCost: baseCost
            )

        case .ink_slash:
            return PaintResult(
                success: true,
                description: "Trait d'Encre !",
                damage: 14 + champion.baseStats.spirit,
                healing: 0,
                statusEffect: nil,
                duration: 0,
                inkCost: baseCost / 2
            )

        case .masterpiece:
            champion.currentInvestiture -= baseCost
            return PaintResult(
                success: true,
                description: "CHEF-D'ŒUVRE — la réalité se réécrit !",
                damage: 50 + champion.baseStats.spirit * 3,
                healing: champion.maxHP / 3,
                statusEffect: .stunned,
                duration: 3.0,
                inkCost: baseCost * 2
            )
        }
    }

    // MARK: - Stone Stacking

    struct StackResult {
        let success: Bool
        let description: String
        let buffType: StatusEffectType?
        let magnitude: Double
        let duration: TimeInterval
    }

    func performStoneStack(
        _ stack: StoneStack,
        champion: inout Champion
    ) -> StackResult {
        let cost = 8

        guard champion.currentInvestiture >= cost else {
            return StackResult(success: false, description: "Pas assez d'énergie spirituelle",
                               buffType: nil, magnitude: 0, duration: 0)
        }

        champion.currentInvestiture -= cost

        switch stack {
        case .meditation:
            let healAmount = champion.maxHP / 5
            champion.currentHP = min(champion.maxHP, champion.currentHP + healAmount)
            return StackResult(
                success: true,
                description: "Méditation — les pierres s'élèvent, l'esprit se régénère",
                buffType: .healing,
                magnitude: Double(healAmount),
                duration: 5.0
            )

        case .ward:
            return StackResult(
                success: true,
                description: "Empilement de Garde — les pierres forment un bouclier",
                buffType: .shielded,
                magnitude: 0.3,
                duration: 10.0
            )

        case .summon:
            return StackResult(
                success: true,
                description: "Invocation Spirituelle — un gardien de pierre apparaît !",
                buffType: nil,
                magnitude: 0,
                duration: 15.0
            )

        case .convergence:
            return StackResult(
                success: true,
                description: "CONVERGENCE — les pierres chantent, la lumière jaillit !",
                buffType: .healing,
                magnitude: 50.0,
                duration: 8.0
            )
        }
    }

    // MARK: - Effets visuels

    func inkSlashEffect(direction: CGFloat) -> SKAction {
        SKAction.sequence([
            SKAction.moveBy(x: cos(direction) * 60, y: sin(direction) * 60, duration: 0.1),
            SKAction.fadeOut(withDuration: 0.2),
            SKAction.removeFromParent()
        ])
    }

    func captureEffect() -> SKAction {
        SKAction.sequence([
            SKAction.scale(to: 1.5, duration: 0.3),
            SKAction.scale(to: 0.1, duration: 0.5),
            SKAction.removeFromParent()
        ])
    }

    func stoneStackEffect(count: Int) -> SKAction {
        var actions: [SKAction] = []
        for i in 0..<count {
            actions.append(SKAction.moveBy(x: 0, y: CGFloat(i * 12), duration: 0.3))
            actions.append(SKAction.wait(forDuration: 0.2))
        }
        return SKAction.sequence(actions)
    }
}
