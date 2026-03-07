import GameplayKit

/// Composant de points de vie
class HealthComponent: GKComponent {

    var maxHP: Int
    var currentHP: Int
    var defense: Int
    var isAlive: Bool { currentHP > 0 }

    /// Callback quand l'entité meurt
    var onDeath: (() -> Void)?
    var onDamaged: ((Int) -> Void)?

    init(maxHP: Int, defense: Int = 0) {
        self.maxHP = maxHP
        self.currentHP = maxHP
        self.defense = defense
        super.init()
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    // MARK: - Damage & Healing

    func takeDamage(_ rawDamage: Int) -> Int {
        let mitigated = max(1, rawDamage - defense / 2)
        currentHP = max(0, currentHP - mitigated)

        onDamaged?(mitigated)

        if currentHP <= 0 {
            onDeath?()
        }

        return mitigated
    }

    func heal(_ amount: Int) {
        currentHP = min(maxHP, currentHP + amount)
    }

    func revive(atPercent percent: Double = 0.5) {
        currentHP = Int(Double(maxHP) * percent)
    }

    var healthPercent: Double {
        Double(currentHP) / Double(maxHP)
    }
}
