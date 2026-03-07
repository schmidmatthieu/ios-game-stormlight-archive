import GameplayKit

/// Composant IA — comportement, détection, et décision des ennemis
class AIComponent: GKComponent {

    // MARK: - State

    enum State: Equatable {
        case idle
        case patrolling
        case chasing
        case attacking
        case retreating
        case stunned(remaining: TimeInterval)
        case dead

        static func == (lhs: State, rhs: State) -> Bool {
            switch (lhs, rhs) {
            case (.idle, .idle), (.patrolling, .patrolling),
                 (.chasing, .chasing), (.attacking, .attacking),
                 (.retreating, .retreating), (.dead, .dead):
                return true
            case (.stunned(let a), .stunned(let b)):
                return abs(a - b) < 0.01
            default:
                return false
            }
        }
    }

    // MARK: - Properties

    let behavior: AIBehavior
    let detectionRange: Double
    let attackRange: Double
    let abilities: [String]

    var state: State = .idle
    var aggroTarget: CGPoint?

    // Patrol
    var patrolPath: [GridPosition] = []
    var patrolIndex: Int = 0
    var patrolWaitTimer: TimeInterval = 0

    // Attack timing
    private let attackCooldown: TimeInterval = 1.5
    private var lastAttackTime: TimeInterval = 0
    private var abilityCooldowns: [String: TimeInterval] = [:]

    // Retreat
    let retreatThreshold: Double = 0.15  // Fuit à 15% PV

    init(behavior: AIBehavior, detectionRange: Double,
         attackRange: Double, abilities: [String] = []) {
        self.behavior = behavior
        self.detectionRange = detectionRange
        self.attackRange = attackRange
        self.abilities = abilities
        super.init()
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    // MARK: - Attack

    var canAttack: Bool {
        state != .dead && state != .retreating
    }

    func recordAttack() {
        lastAttackTime = CACurrentMediaTime()
    }

    func canAttackNow(at currentTime: TimeInterval) -> Bool {
        currentTime - lastAttackTime >= attackCooldown
    }

    // MARK: - Ability

    func canUseAbility(_ abilityID: String, at currentTime: TimeInterval) -> Bool {
        guard let lastUsed = abilityCooldowns[abilityID] else { return true }
        return currentTime - lastUsed >= 5.0  // 5s cooldown par défaut
    }

    func useAbility(_ abilityID: String, at currentTime: TimeInterval) {
        abilityCooldowns[abilityID] = currentTime
    }

    func selectAbility(at currentTime: TimeInterval) -> String? {
        abilities.first { canUseAbility($0, at: currentTime) }
    }

    // MARK: - Detection

    func isPlayerInRange(_ playerPos: CGPoint, enemyPos: CGPoint) -> Bool {
        let dist = hypot(playerPos.x - enemyPos.x, playerPos.y - enemyPos.y)
        return dist <= detectionRange * 32  // Convert grid units to screen points
    }

    func isPlayerInAttackRange(_ playerPos: CGPoint, enemyPos: CGPoint) -> Bool {
        let dist = hypot(playerPos.x - enemyPos.x, playerPos.y - enemyPos.y)
        return dist <= attackRange * 32
    }

    // MARK: - Stun

    func applyStun(duration: TimeInterval) {
        state = .stunned(remaining: duration)
    }

    // MARK: - Update

    override func update(deltaTime seconds: TimeInterval) {
        switch state {
        case .stunned(let remaining):
            let newRemaining = remaining - seconds
            if newRemaining <= 0 {
                state = .idle
            } else {
                state = .stunned(remaining: newRemaining)
            }
        default:
            break
        }

        // Patrol wait
        if state == .patrolling && patrolWaitTimer > 0 {
            patrolWaitTimer -= seconds
        }
    }

    // MARK: - Patrol

    func nextPatrolTarget() -> GridPosition? {
        guard patrolPath.count > 1, patrolWaitTimer <= 0 else { return nil }
        patrolIndex = (patrolIndex + 1) % patrolPath.count
        patrolWaitTimer = GameConstants.EnemyAI.patrolPauseTime
        return patrolPath[patrolIndex]
    }
}
