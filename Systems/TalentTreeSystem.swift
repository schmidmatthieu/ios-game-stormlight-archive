import Foundation

/// Système d'arbre de talents — chaque classe a un arbre unique avec 3 branches
final class TalentTreeSystem {

    // MARK: - Talent Data

    struct TalentTree: Codable, Identifiable {
        let id: String
        let championClass: String
        let branches: [TalentBranch]
    }

    struct TalentBranch: Codable {
        let name: String
        let description: String
        let talents: [Talent]
    }

    struct Talent: Codable, Identifiable {
        let id: String
        let name: String
        let description: String
        let icon: String
        let tier: Int          // 1-4, détermine la position dans l'arbre
        let maxRank: Int       // 1-3, combien de fois on peut l'acheter
        let prerequisiteID: String?
        let effect: TalentEffect
    }

    struct TalentEffect: Codable {
        let type: TalentEffectType
        let valuePerRank: Double
    }

    enum TalentEffectType: String, Codable {
        // Stats passives
        case bonusHP
        case bonusInvestiture
        case bonusStrength
        case bonusAgility
        case bonusSpirit
        case bonusLuck

        // Combat
        case attackDamagePercent
        case critChancePercent
        case critDamagePercent
        case attackSpeedPercent
        case lifestealPercent

        // Magie
        case magicDamagePercent
        case investitureCostReduction
        case cooldownReduction
        case statusDurationPercent
        case aoeRadiusPercent

        // Défense
        case damageReductionPercent
        case dodgeChancePercent
        case hpRegenPerSecond
        case investitureRegenPerSecond
        case shieldOnKill

        // Utilitaire
        case xpBonusPercent
        case goldBonusPercent
        case lootRarityBonus
        case movementSpeedPercent
        case companionDamagePercent
    }

    // MARK: - All Talent Trees

    static let allTrees: [TalentTree] = [
        // MISTBORN
        TalentTree(id: "tree_mistborn", championClass: "Brumeux", branches: [
            TalentBranch(name: "Pousseur d'Acier", description: "Spécialisation attaques à distance et knockback", talents: [
                Talent(id: "mb_steel_1", name: "Poussée Renforcée", description: "+15% dégâts Poussée d'Acier par rang", icon: "talent_steel_push", tier: 1, maxRank: 3, prerequisiteID: nil,
                       effect: TalentEffect(type: .magicDamagePercent, valuePerRank: 0.15)),
                Talent(id: "mb_steel_2", name: "Pluie de Métal", description: "Poussée d'Acier touche 2 cibles supplémentaires", icon: "talent_metal_rain", tier: 2, maxRank: 2, prerequisiteID: "mb_steel_1",
                       effect: TalentEffect(type: .aoeRadiusPercent, valuePerRank: 0.5)),
                Talent(id: "mb_steel_3", name: "Mur d'Acier", description: "Repousser un ennemi qui vous attaque (passive)", icon: "talent_steel_wall", tier: 3, maxRank: 1, prerequisiteID: "mb_steel_2",
                       effect: TalentEffect(type: .damageReductionPercent, valuePerRank: 0.10)),
                Talent(id: "mb_steel_4", name: "Ouragan Métallique", description: "Poussée d'Acier ultime — AoE 360°", icon: "talent_hurricane", tier: 4, maxRank: 1, prerequisiteID: "mb_steel_3",
                       effect: TalentEffect(type: .attackDamagePercent, valuePerRank: 0.50))
            ]),
            TalentBranch(name: "Brûleur de Pewter", description: "Tank au corps à corps, force brute", talents: [
                Talent(id: "mb_pewter_1", name: "Corps d'Acier", description: "+10% PV max par rang", icon: "talent_iron_body", tier: 1, maxRank: 3, prerequisiteID: nil,
                       effect: TalentEffect(type: .bonusHP, valuePerRank: 0.10)),
                Talent(id: "mb_pewter_2", name: "Rage du Pewter", description: "+20% dégâts physiques quand Pewter est brûlé", icon: "talent_pewter_rage", tier: 2, maxRank: 2, prerequisiteID: "mb_pewter_1",
                       effect: TalentEffect(type: .attackDamagePercent, valuePerRank: 0.20)),
                Talent(id: "mb_pewter_3", name: "Endurance Surhumaine", description: "Régénère 2% PV/s pendant la combustion de Pewter", icon: "talent_endurance", tier: 3, maxRank: 1, prerequisiteID: "mb_pewter_2",
                       effect: TalentEffect(type: .hpRegenPerSecond, valuePerRank: 2.0)),
                Talent(id: "mb_pewter_4", name: "Indestructible", description: "Survit à un coup fatal avec 1 PV (cooldown 60s)", icon: "talent_indestructible", tier: 4, maxRank: 1, prerequisiteID: "mb_pewter_3",
                       effect: TalentEffect(type: .damageReductionPercent, valuePerRank: 1.0))
            ]),
            TalentBranch(name: "Brumeux Astucieux", description: "Utilitaire, contrôle mental, support", talents: [
                Talent(id: "mb_mental_1", name: "Cuivre Étendu", description: "+30% durée d'invisibilité par rang", icon: "talent_copper", tier: 1, maxRank: 3, prerequisiteID: nil,
                       effect: TalentEffect(type: .statusDurationPercent, valuePerRank: 0.30)),
                Talent(id: "mb_mental_2", name: "Zinc Intense", description: "L'enragement touche 3 cibles", icon: "talent_zinc", tier: 2, maxRank: 2, prerequisiteID: "mb_mental_1",
                       effect: TalentEffect(type: .aoeRadiusPercent, valuePerRank: 1.0)),
                Talent(id: "mb_mental_3", name: "Réserves Profondes", description: "-15% consommation de métaux par rang", icon: "talent_reserves", tier: 3, maxRank: 2, prerequisiteID: "mb_mental_2",
                       effect: TalentEffect(type: .investitureCostReduction, valuePerRank: 0.15)),
                Talent(id: "mb_mental_4", name: "Maelstrom Allomantique", description: "Brûle tous les métaux simultanément pendant 5s", icon: "talent_maelstrom", tier: 4, maxRank: 1, prerequisiteID: "mb_mental_3",
                       effect: TalentEffect(type: .cooldownReduction, valuePerRank: 0.50))
            ])
        ]),

        // RADIANT (Windrunner)
        TalentTree(id: "tree_radiant", championClass: "Radieux", branches: [
            TalentBranch(name: "Maître de la Gravité", description: "Mobilité extrême et dégâts aériens", talents: [
                Talent(id: "rd_grav_1", name: "Lashage Rapide", description: "-20% cooldown Gravitation par rang", icon: "talent_lashing", tier: 1, maxRank: 3, prerequisiteID: nil,
                       effect: TalentEffect(type: .cooldownReduction, valuePerRank: 0.20)),
                Talent(id: "rd_grav_2", name: "Vol Prolongé", description: "+50% durée de vol par rang", icon: "talent_flight", tier: 2, maxRank: 2, prerequisiteID: "rd_grav_1",
                       effect: TalentEffect(type: .statusDurationPercent, valuePerRank: 0.50)),
                Talent(id: "rd_grav_3", name: "Chute Dévastatrice", description: "Atterrissage après vol inflige des dégâts AoE", icon: "talent_slam", tier: 3, maxRank: 1, prerequisiteID: "rd_grav_2",
                       effect: TalentEffect(type: .magicDamagePercent, valuePerRank: 0.40)),
                Talent(id: "rd_grav_4", name: "Maître des Cieux", description: "Vol permanent tant que la Lumière d'orage est active", icon: "talent_sky_master", tier: 4, maxRank: 1, prerequisiteID: "rd_grav_3",
                       effect: TalentEffect(type: .movementSpeedPercent, valuePerRank: 0.50))
            ]),
            TalentBranch(name: "Gardien Radieux", description: "Protection et soutien du groupe", talents: [
                Talent(id: "rd_guard_1", name: "Bouclier Lumineux", description: "+20% absorption du bouclier par rang", icon: "talent_shield", tier: 1, maxRank: 3, prerequisiteID: nil,
                       effect: TalentEffect(type: .damageReductionPercent, valuePerRank: 0.07)),
                Talent(id: "rd_guard_2", name: "Aura Protectrice", description: "Le bouclier protège aussi le compagnon", icon: "talent_aura", tier: 2, maxRank: 1, prerequisiteID: "rd_guard_1",
                       effect: TalentEffect(type: .companionDamagePercent, valuePerRank: 0.20)),
                Talent(id: "rd_guard_3", name: "Lumière Régénérative", description: "Le bouclier soigne 3% PV/s", icon: "talent_regen_shield", tier: 3, maxRank: 2, prerequisiteID: "rd_guard_2",
                       effect: TalentEffect(type: .hpRegenPerSecond, valuePerRank: 3.0)),
                Talent(id: "rd_guard_4", name: "Serment Inébranlable", description: "Bouclier permanent absorbant 15% des dégâts", icon: "talent_oath", tier: 4, maxRank: 1, prerequisiteID: "rd_guard_3",
                       effect: TalentEffect(type: .damageReductionPercent, valuePerRank: 0.15))
            ]),
            TalentBranch(name: "Porte-Lumière", description: "Maîtrise de la Lumière d'orage", talents: [
                Talent(id: "rd_light_1", name: "Réserves Profondes", description: "+15% Investiture max par rang", icon: "talent_deep_reserves", tier: 1, maxRank: 3, prerequisiteID: nil,
                       effect: TalentEffect(type: .bonusInvestiture, valuePerRank: 0.15)),
                Talent(id: "rd_light_2", name: "Absorption d'Orage", description: "Les hauteorages rechargent 2× plus de Lumière", icon: "talent_storm_absorb", tier: 2, maxRank: 2, prerequisiteID: "rd_light_1",
                       effect: TalentEffect(type: .investitureRegenPerSecond, valuePerRank: 5.0)),
                Talent(id: "rd_light_3", name: "Éclat de Lumière", description: "Attaques infusées de Lumière d'Orage (+25% dégâts)", icon: "talent_light_strike", tier: 3, maxRank: 1, prerequisiteID: "rd_light_2",
                       effect: TalentEffect(type: .magicDamagePercent, valuePerRank: 0.25)),
                Talent(id: "rd_light_4", name: "Avatar de Lumière", description: "Transformation temporaire — invincibilité 3s + dégâts ×3", icon: "talent_avatar", tier: 4, maxRank: 1, prerequisiteID: "rd_light_3",
                       effect: TalentEffect(type: .attackDamagePercent, valuePerRank: 2.0))
            ])
        ])
    ]

    // MARK: - Player Talent State

    struct PlayerTalents: Codable {
        var unlockedTalents: [String: Int]  // talentID: rank
        var totalPointsSpent: Int

        init() {
            unlockedTalents = [:]
            totalPointsSpent = 0
        }
    }

    private var playerTalents = PlayerTalents()

    // MARK: - Unlock Talent

    func canUnlockTalent(_ talent: Talent, availablePoints: Int) -> Bool {
        let currentRank = playerTalents.unlockedTalents[talent.id] ?? 0
        guard currentRank < talent.maxRank else { return false }
        guard availablePoints > 0 else { return false }

        // Check prerequisite
        if let prereqID = talent.prerequisiteID {
            let prereqRank = playerTalents.unlockedTalents[prereqID] ?? 0
            guard prereqRank > 0 else { return false }
        }

        return true
    }

    func unlockTalent(_ talent: Talent) -> Bool {
        guard let champion = GameManager.shared.champion,
              canUnlockTalent(talent, availablePoints: champion.skillPoints) else { return false }

        let currentRank = playerTalents.unlockedTalents[talent.id] ?? 0
        playerTalents.unlockedTalents[talent.id] = currentRank + 1
        playerTalents.totalPointsSpent += 1
        GameManager.shared.champion?.skillPoints -= 1

        return true
    }

    // MARK: - Calculate Total Bonuses

    func totalBonus(for effectType: TalentEffectType) -> Double {
        var total: Double = 0

        guard let tree = Self.allTrees.first(where: {
            $0.championClass == GameManager.shared.champion?.championClass.rawValue
        }) else { return 0 }

        for branch in tree.branches {
            for talent in branch.talents {
                if talent.effect.type == effectType {
                    let rank = playerTalents.unlockedTalents[talent.id] ?? 0
                    total += talent.effect.valuePerRank * Double(rank)
                }
            }
        }

        return total
    }

    // MARK: - Reset

    func resetTalents() {
        let pointsBack = playerTalents.totalPointsSpent
        playerTalents = PlayerTalents()
        GameManager.shared.champion?.skillPoints += pointsBack
    }
}
