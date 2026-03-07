import GameplayKit
import SpriteKit

/// Protocole de base pour toutes les entités du jeu (ECS)
protocol GameEntity: AnyObject {
    var entity: GKEntity { get }
    var entityID: String { get }
    func update(deltaTime: TimeInterval)
}

// MARK: - Base Entity

/// Entité de base GameplayKit avec accès simplifié aux composants
class BaseEntity: GKEntity, GameEntity {

    let entityID: String
    var entity: GKEntity { self }

    init(id: String) {
        self.entityID = id
        super.init()
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    // MARK: - Convenience accessors

    var spriteComponent: SpriteComponent? {
        component(ofType: SpriteComponent.self)
    }

    var healthComponent: HealthComponent? {
        component(ofType: HealthComponent.self)
    }

    var movementComponent: MovementComponent? {
        component(ofType: MovementComponent.self)
    }

    var combatComponent: CombatComponent? {
        component(ofType: CombatComponent.self)
    }

    var inventoryComponent: InventoryComponent? {
        component(ofType: InventoryComponent.self)
    }

    var magicSystemComponent: MagicSystemComponent? {
        component(ofType: MagicSystemComponent.self)
    }

    var aiComponent: AIComponent? {
        component(ofType: AIComponent.self)
    }

    // MARK: - Node access

    var spriteNode: SKSpriteNode? {
        spriteComponent?.node
    }

    var position: CGPoint {
        get { spriteNode?.position ?? .zero }
        set { spriteNode?.position = newValue }
    }

    var gridPosition: GridPosition {
        get { movementComponent?.currentGridPosition ?? GridPosition(col: 0, row: 0) }
        set { movementComponent?.currentGridPosition = newValue }
    }
}
