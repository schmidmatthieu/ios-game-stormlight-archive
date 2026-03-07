import Foundation

// MARK: - Magic System Type

enum MagicSystemType: String, Codable, CaseIterable {
    case allomancy    // Scadrial — brûler des métaux
    case surgebinding // Roshar — liens spren
    case awakening    // Nalthis — Souffle / BioChroma
    case aonDor       // Sel — glyphes lumineux
    case sandMastery  // Taldain — contrôle du sable blanc
    case painting     // Komashi — peinture de cauchemars + empilement de pierres
}

// MARK: - Skill Targeting

enum SkillTargeting: String, Codable {
    case selfOnly
    case singleEnemy
    case singleAlly
    case areaOfEffect
    case directional
    case global
}

// MARK: - Damage Type

enum DamageType: String, Codable {
    case physical
    case allomantic
    case stormlight
    case biochromatic
    case aonic
}

// MARK: - Skill

struct Skill: Codable, Identifiable {
    let id: String
    let name: String
    let description: String
    let magicSystem: MagicSystemType
    let icon: String

    // Gameplay
    let targeting: SkillTargeting
    let damageType: DamageType
    let baseDamage: Int
    let investitureCost: Int
    let cooldown: TimeInterval   // Secondes
    let range: Double            // Unités de grille iso
    let areaRadius: Double       // 0 si single target

    // Ressource additionnelle (ex: métal pour Allomancie)
    let resourceCost: SkillResourceCost?

    // Progression
    let requiredLevel: Int
    let maxRank: Int
    let prerequisiteSkillID: String?

    // Effets secondaires
    let statusEffects: [StatusEffectApplication]
}

// MARK: - Resource Cost

struct SkillResourceCost: Codable {
    let resourceType: SkillResourceType
    let amount: Int
}

enum SkillResourceType: String, Codable {
    case steel       // Acier (Allomancie)
    case iron        // Fer
    case tin         // Étain
    case pewter      // Pewter / Étain
    case bronze      // Bronze
    case copper      // Cuivre
    case zinc        // Zinc
    case brass       // Laiton
    case stormlight  // Lumière d'orage (Surgebinding)
    case breath      // Souffle (Éveil)
    case devotion    // Dévouement (AonDor)
}

// MARK: - Status Effects

struct StatusEffectApplication: Codable {
    let effectType: StatusEffectType
    let duration: TimeInterval
    let magnitude: Double
    let chance: Double // 0.0 - 1.0
}

enum StatusEffectType: String, Codable {
    case poisoned
    case burning
    case slowed
    case stunned
    case enraged    // Zinc — aggro
    case calmed     // Laiton — ralentir
    case revealed   // Étain — ennemis cachés visibles
    case invisible  // Cuivre — indetectable
    case flying     // Gravitation — vol
    case healing    // Progression — soin over time
    case shielded   // Adhésion — bouclier
    case haste      // Abrasion — vitesse de déplacement augmentée
    case decoy      // Illumination — leurre qui attire les ennemis
}
