import GameplayKit

/// Composant de combat — dégâts, vitesse d'attaque, portée, critiques
class CombatComponent: GKComponent {

    var baseDamage: Int
    var attackSpeed: Double       // Attaques par seconde
    var attackRange: Double       // Portée en unités de grille
    var critChance: Double        // 0.0 - 1.0
    var critMultiplier: Double    // Multiplicateur de dégâts critique

    // Cooldown tracking
    private(set) var lastAttackTime: TimeInterval = 0
    var isAttacking: Bool = false

    // Status effect modifiers
    var damageMultiplier: Double = 1.0
    var attackSpeedMultiplier: Double = 1.0

    // Equipped skill slots (4 max)
    var equippedSkillIDs: [String] = []
    var skillCooldowns: [String: TimeInterval] = [:]

    init(baseDamage: Int, attackSpeed: Double = 1.0,
         attackRange: Double = 1.5, critChance: Double = 0.05,
         critMultiplier: Double = 2.0) {
        self.baseDamage = baseDamage
        self.attackSpeed = attackSpeed
        self.attackRange = attackRange
        self.critChance = critChance
        self.critMultiplier = critMultiplier
        super.init()
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    // MARK: - Damage Calculation

    func calculateDamage(isCritical: Bool = false) -> Int {
        let base = Double(baseDamage) * damageMultiplier
        let damage = isCritical ? base * critMultiplier : base
        return max(1, Int(damage))
    }

    // MARK: - Attack Timing

    var attackCooldown: TimeInterval {
        (1.0 / attackSpeed) / attackSpeedMultiplier
    }

    func canAttack(at currentTime: TimeInterval) -> Bool {
        currentTime - lastAttackTime >= attackCooldown
    }

    func recordAttack(at currentTime: TimeInterval) {
        lastAttackTime = currentTime
    }

    // MARK: - Skill Cooldowns

    func isSkillReady(_ skillID: String, at currentTime: TimeInterval) -> Bool {
        guard let skill = GameManager.shared.skill(byID: skillID) else { return false }
        guard let lastUsed = skillCooldowns[skillID] else { return true }
        return currentTime - lastUsed >= skill.cooldown
    }

    func useSkill(_ skillID: String, at currentTime: TimeInterval) {
        skillCooldowns[skillID] = currentTime
    }

    func cooldownRemaining(for skillID: String, at currentTime: TimeInterval) -> TimeInterval {
        guard let lastUsed = skillCooldowns[skillID],
              let skill = GameManager.shared.skill(byID: skillID) else { return 0 }
        return max(0, skill.cooldown - (currentTime - lastUsed))
    }

    // MARK: - Reset modifiers

    func resetModifiers() {
        damageMultiplier = 1.0
        attackSpeedMultiplier = 1.0
    }
}
