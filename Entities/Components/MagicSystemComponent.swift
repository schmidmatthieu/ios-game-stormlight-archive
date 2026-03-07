import GameplayKit

/// Composant magique — gère l'Investiture et les ressources spécifiques à chaque système
class MagicSystemComponent: GKComponent {

    let magicType: MagicSystemType
    let maxInvestiture: Int
    private(set) var currentInvestiture: Int

    // Ressources spécifiques par système
    var metalReserves: [SkillResourceType: Int] = [:]    // Allomancie
    var breathCount: Int = 0                              // Éveil
    var stormlightAmount: Double = 0                      // Surgebinding
    var waterReserve: Double = 100                         // Maîtrise du Sable
    var inkReserve: Double = 100                           // Peinture
    var devotionAmount: Double = 100                       // AonDor

    // Regen
    var investitureRegenRate: Double = 2.0  // par seconde

    // Active buffs
    var activeEffects: [ActiveEffect] = []

    struct ActiveEffect {
        let effectType: StatusEffectType
        var remainingDuration: TimeInterval
        let magnitude: Double
    }

    init(magicType: MagicSystemType, maxInvestiture: Int, currentInvestiture: Int? = nil) {
        self.magicType = magicType
        self.maxInvestiture = maxInvestiture
        self.currentInvestiture = currentInvestiture ?? maxInvestiture
        super.init()

        setupDefaultResources()
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    private func setupDefaultResources() {
        switch magicType {
        case .allomancy:
            // Réserves de métaux initiales
            metalReserves = [
                .steel: 100, .iron: 100, .tin: 100, .pewter: 100,
                .bronze: 100, .copper: 100, .zinc: 100, .brass: 100
            ]
        case .surgebinding:
            stormlightAmount = 100
        case .awakening:
            breathCount = 5
        case .aonDor:
            devotionAmount = 100
        case .sandMastery:
            waterReserve = 100
        case .painting:
            inkReserve = 100
        }
    }

    // MARK: - Investiture

    var investiturePercent: Double {
        Double(currentInvestiture) / Double(maxInvestiture)
    }

    func canUseSkill(cost: Int) -> Bool {
        currentInvestiture >= cost
    }

    func consumeInvestiture(_ amount: Int) {
        currentInvestiture = max(0, currentInvestiture - amount)
    }

    func restoreInvestiture(_ amount: Int) {
        currentInvestiture = min(maxInvestiture, currentInvestiture + amount)
    }

    // MARK: - Specific Resources

    func consumeResource(_ type: SkillResourceType, amount: Int) -> Bool {
        switch magicType {
        case .allomancy:
            guard let current = metalReserves[type], current >= amount else { return false }
            metalReserves[type] = current - amount
            return true

        case .surgebinding:
            guard stormlightAmount >= Double(amount) else { return false }
            stormlightAmount -= Double(amount)
            return true

        case .awakening:
            guard breathCount >= amount else { return false }
            breathCount -= amount
            return true

        case .aonDor:
            guard devotionAmount >= Double(amount) else { return false }
            devotionAmount -= Double(amount)
            return true

        case .sandMastery:
            guard waterReserve >= Double(amount) else { return false }
            waterReserve -= Double(amount)
            return true

        case .painting:
            guard inkReserve >= Double(amount) else { return false }
            inkReserve -= Double(amount)
            return true
        }
    }

    /// Étiquette de la ressource secondaire affichée dans le HUD
    var resourceLabel: String {
        switch magicType {
        case .allomancy:    return "Métaux"
        case .surgebinding: return "Lumière"
        case .awakening:    return "Souffles: \(breathCount)"
        case .aonDor:       return "Dévouement"
        case .sandMastery:  return "Eau"
        case .painting:     return "Encre"
        }
    }

    var secondaryResourcePercent: Double {
        switch magicType {
        case .allomancy:
            let total = metalReserves.values.reduce(0, +)
            return Double(total) / 800.0  // 8 métaux × 100
        case .surgebinding: return stormlightAmount / 100.0
        case .awakening:    return Double(breathCount) / 50.0
        case .aonDor:       return devotionAmount / 100.0
        case .sandMastery:  return waterReserve / 100.0
        case .painting:     return inkReserve / 100.0
        }
    }

    // MARK: - Update (regen + effects)

    override func update(deltaTime seconds: TimeInterval) {
        // Natural Investiture regen
        let regen = Int(investitureRegenRate * seconds)
        if regen > 0 {
            restoreInvestiture(regen)
        }

        // Update active effects
        activeEffects = activeEffects.compactMap { effect in
            var e = effect
            e.remainingDuration -= seconds
            return e.remainingDuration > 0 ? e : nil
        }
    }

    // MARK: - Effects

    func addEffect(_ type: StatusEffectType, duration: TimeInterval, magnitude: Double) {
        // Remove existing effect of same type
        activeEffects.removeAll { $0.effectType == type }
        activeEffects.append(ActiveEffect(effectType: type, remainingDuration: duration, magnitude: magnitude))
    }

    func hasEffect(_ type: StatusEffectType) -> Bool {
        activeEffects.contains { $0.effectType == type }
    }
}
