import Foundation
import GameplayKit

/// Gère la résolution des combats en temps réel
final class CombatSystem {

    // MARK: - Calcul de dégâts

    struct DamageResult {
        let rawDamage: Int
        let mitigatedDamage: Int
        let isCritical: Bool
        let statusEffects: [StatusEffectApplication]
    }

    func calculateDamage(
        attacker: ChampionStats,
        skill: Skill?,
        defender: Enemy
    ) -> DamageResult {
        let baseDmg = skill?.baseDamage ?? attacker.strength
        let attackPower: Int

        if let skill = skill {
            switch skill.damageType {
            case .physical:
                attackPower = baseDmg + attacker.strength
            case .allomantic, .stormlight, .biochromatic, .aonic:
                attackPower = baseDmg + attacker.spirit
            }
        } else {
            attackPower = baseDmg + attacker.strength
        }

        // Défense
        let defense = defender.defense
        let mitigated = max(1, attackPower - defense / 2)

        // Critique
        let critRoll = Double.random(in: 0...100)
        let critChance = Double(attacker.luck) * 1.5
        let isCrit = critRoll <= critChance
        let finalDamage = isCrit ? mitigated * 2 : mitigated

        return DamageResult(
            rawDamage: attackPower,
            mitigatedDamage: finalDamage,
            isCritical: isCrit,
            statusEffects: skill?.statusEffects ?? []
        )
    }

    func calculateEnemyDamage(
        enemy: Enemy,
        defenderStats: ChampionStats
    ) -> Int {
        let rawDamage = enemy.damage
        let defense = defenderStats.vigor / 2 + defenderStats.agility / 4
        return max(1, rawDamage - defense)
    }

    // MARK: - Vérification portée

    func isInRange(
        attackerPos: GridPosition,
        targetPos: GridPosition,
        range: Double
    ) -> Bool {
        let dx = Double(targetPos.col - attackerPos.col)
        let dy = Double(targetPos.row - attackerPos.row)
        let distance = sqrt(dx * dx + dy * dy)
        return distance <= range
    }

    // MARK: - Coût de compétence

    func canUseSkill(_ skill: Skill, champion: Champion) -> Bool {
        // Vérifier l'Investiture
        guard champion.currentInvestiture >= skill.investitureCost else { return false }

        // Vérifier la ressource additionnelle
        if let cost = skill.resourceCost {
            switch cost.resourceType {
            case .stormlight:
                guard let sl = champion.stormlightAmount, sl >= Double(cost.amount) else { return false }
            case .breath:
                guard let b = champion.breathCount, b >= cost.amount else { return false }
            default:
                // Métaux (Allomancie)
                guard let reserves = champion.metalReserves,
                      let current = reserves[cost.resourceType],
                      current >= cost.amount else { return false }
            }
        }

        return true
    }

    func applySkillCost(_ skill: Skill, to champion: inout Champion) {
        champion.currentInvestiture -= skill.investitureCost

        if let cost = skill.resourceCost {
            switch cost.resourceType {
            case .stormlight:
                champion.stormlightAmount? -= Double(cost.amount)
            case .breath:
                champion.breathCount? -= cost.amount
            default:
                champion.metalReserves?[cost.resourceType]? -= cost.amount
            }
        }
    }
}
