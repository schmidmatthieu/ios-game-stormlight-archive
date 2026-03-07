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
        let lifestealAmount: Int
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

        // Apply talent bonuses
        let talents = GameManager.shared.talentTree
        let atkBonus = talents.totalBonus(for: .attackDamagePercent)
        let magicBonus = talents.totalBonus(for: .magicDamagePercent)
        let damageBonus = skill != nil ? magicBonus : atkBonus

        // Apply item trait damage bonuses
        var traitDamageBonus = 0.0
        if let champion = GameManager.shared.champion {
            if let skill = skill {
                switch skill.damageType {
                case .allomantic:
                    traitDamageBonus += champion.totalTraitBonus(for: .damageBoostAllomancy)
                case .stormlight:
                    traitDamageBonus += champion.totalTraitBonus(for: .damageBoostSurgebinding)
                default: break
                }
            }
        }
        let totalDamageBonus = damageBonus + traitDamageBonus
        let boostedDamage = max(1, Int(Double(mitigated) * (1.0 + totalDamageBonus)))

        // Critique — talent + item trait crit chance
        let critRoll = Double.random(in: 0...100)
        let critBonusChance = talents.totalBonus(for: .critChancePercent) * 100
        let traitCritBonus = (GameManager.shared.champion?.totalTraitBonus(for: .critChance) ?? 0) * 100
        let critChance = Double(attacker.luck) * 1.5 + critBonusChance + traitCritBonus
        let isCrit = critRoll <= critChance
        let critDmgBonus = talents.totalBonus(for: .critDamagePercent)
        let critMultiplier = 2.0 + critDmgBonus
        let finalDamage = isCrit ? Int(Double(boostedDamage) * critMultiplier) : boostedDamage

        // Lifesteal from item traits
        let lifestealPercent = GameManager.shared.champion?.totalTraitBonus(for: .lifesteal) ?? 0
        let lifestealAmount = lifestealPercent > 0 ? Int(Double(finalDamage) * lifestealPercent) : 0

        return DamageResult(
            rawDamage: attackPower,
            mitigatedDamage: finalDamage,
            isCritical: isCrit,
            statusEffects: skill?.statusEffects ?? [],
            lifestealAmount: lifestealAmount
        )
    }

    func calculateEnemyDamage(
        enemy: Enemy,
        defenderStats: ChampionStats
    ) -> Int {
        let rawDamage = enemy.damage
        let defense = defenderStats.vigor / 2 + defenderStats.agility / 4
        let baseDmg = max(1, rawDamage - defense)

        // Apply talent damage reduction
        let dmgReduction = GameManager.shared.talentTree.totalBonus(for: .damageReductionPercent)
        return max(1, Int(Double(baseDmg) * (1.0 - min(0.75, dmgReduction))))
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
        // Vérifier l'Investiture (with Aon Dor cost reduction)
        var investitureCost = skill.investitureCost
        if skill.magicSystem == .aonDor {
            let reduction = champion.totalTraitBonus(for: .aonDorCostReduction)
            investitureCost = max(1, Int(Double(investitureCost) * (1.0 - reduction)))
        }
        guard champion.currentInvestiture >= investitureCost else { return false }

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
        var investitureCost = skill.investitureCost

        // Aon Dor cost reduction for aonic skills
        if skill.magicSystem == .aonDor {
            let reduction = champion.totalTraitBonus(for: .aonDorCostReduction)
            investitureCost = Int(Double(investitureCost) * (1.0 - reduction))
        }

        champion.currentInvestiture -= max(1, investitureCost)

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
