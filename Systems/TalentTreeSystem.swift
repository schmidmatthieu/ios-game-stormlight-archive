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
        ]),

        // AWAKENER (Nalthis / Warbreaker)
        TalentTree(id: "tree_awakener", championClass: "Éveilleur", branches: [
            TalentBranch(name: "Maître des Souffles", description: "Maîtrise du Souffle — support et renforcement", talents: [
                Talent(id: "aw_breath_1", name: "Souffle Efficient", description: "+15% efficacité du Souffle par rang", icon: "talent_breath_efficiency", tier: 1, maxRank: 3, prerequisiteID: nil,
                       effect: TalentEffect(type: .investitureCostReduction, valuePerRank: 0.15)),
                Talent(id: "aw_breath_2", name: "Objets Éveillés Durables", description: "Les objets éveillés durent 50% plus longtemps par rang", icon: "talent_awakened_duration", tier: 2, maxRank: 2, prerequisiteID: "aw_breath_1",
                       effect: TalentEffect(type: .statusDurationPercent, valuePerRank: 0.50)),
                Talent(id: "aw_breath_3", name: "Aura de Couleur", description: "L'aura de couleur inflige des dégâts aux ennemis proches", icon: "talent_color_aura", tier: 3, maxRank: 1, prerequisiteID: "aw_breath_2",
                       effect: TalentEffect(type: .magicDamagePercent, valuePerRank: 0.30)),
                Talent(id: "aw_breath_4", name: "Dixième Exaltation", description: "Toutes les capacités sont renforcées — pouvoir ultime", icon: "talent_tenth_heightening", tier: 4, maxRank: 1, prerequisiteID: "aw_breath_3",
                       effect: TalentEffect(type: .attackDamagePercent, valuePerRank: 0.50))
            ]),
            TalentBranch(name: "Commandeur Éveillé", description: "Armée éveillée — invocations et dégâts", talents: [
                Talent(id: "aw_command_1", name: "Armes Éveillées", description: "+20% dégâts des armes éveillées par rang", icon: "talent_awakened_weapon", tier: 1, maxRank: 3, prerequisiteID: nil,
                       effect: TalentEffect(type: .attackDamagePercent, valuePerRank: 0.20)),
                Talent(id: "aw_command_2", name: "Compagnons Sans-Vie", description: "Les compagnons Sans-Vie gagnent +25% par rang", icon: "talent_lifeless", tier: 2, maxRank: 2, prerequisiteID: "aw_command_1",
                       effect: TalentEffect(type: .companionDamagePercent, valuePerRank: 0.25)),
                Talent(id: "aw_command_3", name: "Commandement Royal", description: "Le Commandement Royal étourdit tous les ennemis", icon: "talent_royal_command", tier: 3, maxRank: 1, prerequisiteID: "aw_command_2",
                       effect: TalentEffect(type: .cooldownReduction, valuePerRank: 0.30)),
                Talent(id: "aw_command_4", name: "Souffle Divin", description: "Résurrection ou AoE massive dévastateur", icon: "talent_divine_breath", tier: 4, maxRank: 1, prerequisiteID: "aw_command_3",
                       effect: TalentEffect(type: .attackDamagePercent, valuePerRank: 1.0))
            ]),
            TalentBranch(name: "Voleur de Couleurs", description: "Vol de couleurs — utilitaire et survie", talents: [
                Talent(id: "aw_thief_1", name: "Drain Chromatique", description: "+10% vol de vie par drain de couleur par rang", icon: "talent_color_drain", tier: 1, maxRank: 3, prerequisiteID: nil,
                       effect: TalentEffect(type: .lifestealPercent, valuePerRank: 0.10)),
                Talent(id: "aw_thief_2", name: "Évanescence", description: "+15% chance d'esquive par rang", icon: "talent_evanescence", tier: 2, maxRank: 2, prerequisiteID: "aw_thief_1",
                       effect: TalentEffect(type: .dodgeChancePercent, valuePerRank: 0.15)),
                Talent(id: "aw_thief_3", name: "Butin Chromatique", description: "Bonus d'or des ennemis vaincus", icon: "talent_color_gold", tier: 3, maxRank: 2, prerequisiteID: "aw_thief_2",
                       effect: TalentEffect(type: .goldBonusPercent, valuePerRank: 0.20)),
                Talent(id: "aw_thief_4", name: "Vol de Pouvoir", description: "Vole temporairement les capacités ennemies", icon: "talent_steal_ability", tier: 4, maxRank: 1, prerequisiteID: "aw_thief_3",
                       effect: TalentEffect(type: .cooldownReduction, valuePerRank: 0.40))
            ])
        ]),

        // ELANTRIAN (Sel / Elantris)
        TalentTree(id: "tree_elantrian", championClass: "Élantrien", branches: [
            TalentBranch(name: "Maître des Aons", description: "Maîtrise des Aons — dégâts magiques", talents: [
                Talent(id: "el_aon_1", name: "Aon Puissant", description: "+15% dégâts des Aons par rang", icon: "talent_aon_damage", tier: 1, maxRank: 3, prerequisiteID: nil,
                       effect: TalentEffect(type: .magicDamagePercent, valuePerRank: 0.15)),
                Talent(id: "el_aon_2", name: "Combinaisons d'Aons", description: "Les combinaisons d'Aons sont plus puissantes", icon: "talent_aon_combo", tier: 2, maxRank: 2, prerequisiteID: "el_aon_1",
                       effect: TalentEffect(type: .aoeRadiusPercent, valuePerRank: 0.25)),
                Talent(id: "el_aon_3", name: "Aon Rao Guérisseur", description: "Aon Rao soigne les alliés dans la zone", icon: "talent_aon_rao", tier: 3, maxRank: 1, prerequisiteID: "el_aon_2",
                       effect: TalentEffect(type: .hpRegenPerSecond, valuePerRank: 5.0)),
                Talent(id: "el_aon_4", name: "Grand Aon", description: "Glyphe ultime dévastateur", icon: "talent_grand_aon", tier: 4, maxRank: 1, prerequisiteID: "el_aon_3",
                       effect: TalentEffect(type: .magicDamagePercent, valuePerRank: 0.60))
            ]),
            TalentBranch(name: "Gardien d'Elantris", description: "Gardien de la cité — tank et défense", talents: [
                Talent(id: "el_guard_1", name: "Résistance Élantrisée", description: "+8% réduction de dégâts par rang", icon: "talent_elantris_resist", tier: 1, maxRank: 3, prerequisiteID: nil,
                       effect: TalentEffect(type: .damageReductionPercent, valuePerRank: 0.08)),
                Talent(id: "el_guard_2", name: "Bouclier d'Aon", description: "Le bouclier d'Aon absorbe plus de dégâts", icon: "talent_aon_shield", tier: 2, maxRank: 2, prerequisiteID: "el_guard_1",
                       effect: TalentEffect(type: .bonusHP, valuePerRank: 0.15)),
                Talent(id: "el_guard_3", name: "Régénération Aonique", description: "Régénération de PV pendant le tracé d'Aons", icon: "talent_aon_regen", tier: 3, maxRank: 2, prerequisiteID: "el_guard_2",
                       effect: TalentEffect(type: .hpRegenPerSecond, valuePerRank: 3.0)),
                Talent(id: "el_guard_4", name: "Restauration d'Elantris", description: "Soin complet + invincibilité temporaire", icon: "talent_elantris_restore", tier: 4, maxRank: 1, prerequisiteID: "el_guard_3",
                       effect: TalentEffect(type: .damageReductionPercent, valuePerRank: 1.0))
            ]),
            TalentBranch(name: "Érudit du Dor", description: "Érudit du Dor — investiture et utilitaire", talents: [
                Talent(id: "el_dor_1", name: "Réserves du Dor", description: "+15% Investiture max par rang", icon: "talent_dor_reserves", tier: 1, maxRank: 3, prerequisiteID: nil,
                       effect: TalentEffect(type: .bonusInvestiture, valuePerRank: 0.15)),
                Talent(id: "el_dor_2", name: "Efficacité Aonique", description: "-20% coût des Aons par rang", icon: "talent_aon_efficiency", tier: 2, maxRank: 2, prerequisiteID: "el_dor_1",
                       effect: TalentEffect(type: .investitureCostReduction, valuePerRank: 0.20)),
                Talent(id: "el_dor_3", name: "Régénération du Dor", description: "Régénération d'Investiture passive", icon: "talent_dor_regen", tier: 3, maxRank: 2, prerequisiteID: "el_dor_2",
                       effect: TalentEffect(type: .investitureRegenPerSecond, valuePerRank: 4.0)),
                Talent(id: "el_dor_4", name: "Canalisation du Dor", description: "Explosion massive d'investiture", icon: "talent_channel_dor", tier: 4, maxRank: 1, prerequisiteID: "el_dor_3",
                       effect: TalentEffect(type: .investitureRegenPerSecond, valuePerRank: 10.0))
            ])
        ]),

        // SAND MASTER (Taldain / White Sand)
        TalentTree(id: "tree_sandmaster", championClass: "Maître du Sable", branches: [
            TalentBranch(name: "Fouet de Sable", description: "Fouet de sable — corps à corps et dégâts", talents: [
                Talent(id: "sm_whip_1", name: "Frappe de Sable", description: "+15% dégâts d'attaque de sable par rang", icon: "talent_sand_strike", tier: 1, maxRank: 3, prerequisiteID: nil,
                       effect: TalentEffect(type: .attackDamagePercent, valuePerRank: 0.15)),
                Talent(id: "sm_whip_2", name: "Vitesse du Sable", description: "+20% vitesse d'attaque quand le sable est actif", icon: "talent_sand_speed", tier: 2, maxRank: 2, prerequisiteID: "sm_whip_1",
                       effect: TalentEffect(type: .attackSpeedPercent, valuePerRank: 0.20)),
                Talent(id: "sm_whip_3", name: "Frappe Critique", description: "Les frappes de sable ont un taux critique augmenté", icon: "talent_sand_crit", tier: 3, maxRank: 1, prerequisiteID: "sm_whip_2",
                       effect: TalentEffect(type: .critChancePercent, valuePerRank: 0.15)),
                Talent(id: "sm_whip_4", name: "Tempête de Sable", description: "AoE ultime de tempête de sable", icon: "talent_sandstorm", tier: 4, maxRank: 1, prerequisiteID: "sm_whip_3",
                       effect: TalentEffect(type: .magicDamagePercent, valuePerRank: 0.50))
            ]),
            TalentBranch(name: "Bouclier de Sable", description: "Bouclier de sable — défense", talents: [
                Talent(id: "sm_shield_1", name: "Armure de Sable", description: "+10% réduction de dégâts par rang", icon: "talent_sand_armor", tier: 1, maxRank: 3, prerequisiteID: nil,
                       effect: TalentEffect(type: .damageReductionPercent, valuePerRank: 0.10)),
                Talent(id: "sm_shield_2", name: "Bouclier Absorbant", description: "Le bouclier de sable absorbe les coups", icon: "talent_sand_absorb", tier: 2, maxRank: 2, prerequisiteID: "sm_shield_1",
                       effect: TalentEffect(type: .bonusHP, valuePerRank: 0.12)),
                Talent(id: "sm_shield_3", name: "Contre-Attaque de Sable", description: "Contre-attaque avec du sable lors d'un blocage", icon: "talent_sand_counter", tier: 3, maxRank: 1, prerequisiteID: "sm_shield_2",
                       effect: TalentEffect(type: .critDamagePercent, valuePerRank: 0.30)),
                Talent(id: "sm_shield_4", name: "Cocon Impénétrable", description: "Cocon de sable impénétrable — bouclier sur kill", icon: "talent_sand_cocoon", tier: 4, maxRank: 1, prerequisiteID: "sm_shield_3",
                       effect: TalentEffect(type: .shieldOnKill, valuePerRank: 0.15))
            ]),
            TalentBranch(name: "Maître de l'Eau", description: "Maîtrise de l'eau — ressource et endurance", talents: [
                Talent(id: "sm_water_1", name: "Conservation d'Eau", description: "-15% coût en eau par rang", icon: "talent_water_conserve", tier: 1, maxRank: 3, prerequisiteID: nil,
                       effect: TalentEffect(type: .investitureCostReduction, valuePerRank: 0.15)),
                Talent(id: "sm_water_2", name: "Source Cachée", description: "Régénération d'eau passive", icon: "talent_water_regen", tier: 2, maxRank: 2, prerequisiteID: "sm_water_1",
                       effect: TalentEffect(type: .investitureRegenPerSecond, valuePerRank: 3.0)),
                Talent(id: "sm_water_3", name: "Marcheur du Désert", description: "Vitesse de déplacement accrue dans les zones désertiques", icon: "talent_desert_walker", tier: 3, maxRank: 2, prerequisiteID: "sm_water_2",
                       effect: TalentEffect(type: .movementSpeedPercent, valuePerRank: 0.15)),
                Talent(id: "sm_water_4", name: "Oasis", description: "Soin massif + restauration de ressources", icon: "talent_oasis", tier: 4, maxRank: 1, prerequisiteID: "sm_water_3",
                       effect: TalentEffect(type: .hpRegenPerSecond, valuePerRank: 8.0))
            ])
        ]),

        // NIGHTMARE PAINTER (Komashi / Yumi)
        TalentTree(id: "tree_nightmarepainter", championClass: "Peintre de Cauchemars", branches: [
            TalentBranch(name: "Peintre de Combat", description: "Peintre de combat — dégâts magiques", talents: [
                Talent(id: "np_paint_1", name: "Peinture Puissante", description: "+15% dégâts de peinture par rang", icon: "talent_paint_damage", tier: 1, maxRank: 3, prerequisiteID: nil,
                       effect: TalentEffect(type: .magicDamagePercent, valuePerRank: 0.15)),
                Talent(id: "np_paint_2", name: "Encre Efficiente", description: "+20% efficacité de l'encre par rang", icon: "talent_ink_efficiency", tier: 2, maxRank: 2, prerequisiteID: "np_paint_1",
                       effect: TalentEffect(type: .investitureCostReduction, valuePerRank: 0.20)),
                Talent(id: "np_paint_3", name: "Créatures Peintes", description: "Les créatures peintes infligent des dégâts de zone", icon: "talent_painted_creatures", tier: 3, maxRank: 1, prerequisiteID: "np_paint_2",
                       effect: TalentEffect(type: .aoeRadiusPercent, valuePerRank: 0.40)),
                Talent(id: "np_paint_4", name: "Chef-d'Œuvre", description: "Peinture altérant la réalité — attaque dévastatrice", icon: "talent_masterwork", tier: 4, maxRank: 1, prerequisiteID: "np_paint_3",
                       effect: TalentEffect(type: .attackDamagePercent, valuePerRank: 1.0))
            ]),
            TalentBranch(name: "Empileur de Pierres", description: "Empileur de pierres — support et soin", talents: [
                Talent(id: "np_stone_1", name: "Pierres Curatives", description: "Les empilements de pierres soignent 15% de plus par rang", icon: "talent_healing_stones", tier: 1, maxRank: 3, prerequisiteID: nil,
                       effect: TalentEffect(type: .hpRegenPerSecond, valuePerRank: 2.0)),
                Talent(id: "np_stone_2", name: "Bénédiction Durable", description: "Les buffs de pierres durent plus longtemps", icon: "talent_stone_duration", tier: 2, maxRank: 2, prerequisiteID: "np_stone_1",
                       effect: TalentEffect(type: .statusDurationPercent, valuePerRank: 0.25)),
                Talent(id: "np_stone_3", name: "Esprit Allié", description: "Invoque un allié spirituel depuis les pierres", icon: "talent_spirit_ally", tier: 3, maxRank: 1, prerequisiteID: "np_stone_2",
                       effect: TalentEffect(type: .companionDamagePercent, valuePerRank: 0.30)),
                Talent(id: "np_stone_4", name: "Maîtrise Yoki-hijo", description: "Tous les effets de pierres actifs simultanément", icon: "talent_yokihijo", tier: 4, maxRank: 1, prerequisiteID: "np_stone_3",
                       effect: TalentEffect(type: .cooldownReduction, valuePerRank: 0.40))
            ]),
            TalentBranch(name: "Marcheur de Cauchemars", description: "Marcheur de cauchemars — affaiblissement et contrôle", talents: [
                Talent(id: "np_nightmare_1", name: "Terreur Prolongée", description: "+20% durée des effets de statut par rang", icon: "talent_terror_duration", tier: 1, maxRank: 3, prerequisiteID: nil,
                       effect: TalentEffect(type: .statusDurationPercent, valuePerRank: 0.20)),
                Talent(id: "np_nightmare_2", name: "Peur Affaiblissante", description: "Les effets de peur affaiblissent davantage les ennemis", icon: "talent_weakening_fear", tier: 2, maxRank: 2, prerequisiteID: "np_nightmare_1",
                       effect: TalentEffect(type: .critChancePercent, valuePerRank: 0.10)),
                Talent(id: "np_nightmare_3", name: "Absorption de Cauchemar", description: "L'absorption de cauchemar soigne le lanceur", icon: "talent_nightmare_absorb", tier: 3, maxRank: 1, prerequisiteID: "np_nightmare_2",
                       effect: TalentEffect(type: .lifestealPercent, valuePerRank: 0.15)),
                Talent(id: "np_nightmare_4", name: "Entrée dans le Voile", description: "AoE massive de peur + dégâts dévastateurs", icon: "talent_enter_shroud", tier: 4, maxRank: 1, prerequisiteID: "np_nightmare_3",
                       effect: TalentEffect(type: .magicDamagePercent, valuePerRank: 0.60))
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

    private(set) var playerTalents = PlayerTalents()

    func restoreTalents(_ saved: PlayerTalents) {
        playerTalents = saved
    }

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
