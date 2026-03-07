import GameplayKit
import SpriteKit

/// Entité ennemi — instanciée à partir des données Enemy + EnemySpawn
class EnemyEntity: BaseEntity {

    let enemyData: Enemy
    let spawnData: EnemySpawn

    init(enemy: Enemy, spawn: EnemySpawn) {
        self.enemyData = enemy
        self.spawnData = spawn
        super.init(id: "\(enemy.id)_\(spawn.position.col)_\(spawn.position.row)")

        // Sprite
        let sprite = SpriteComponent(
            textureName: enemy.spriteName,
            size: CGSize(width: 32 * enemy.spriteScale, height: 48 * enemy.spriteScale)
        )
        addComponent(sprite)

        // Santé
        let health = HealthComponent(maxHP: enemy.maxHP, defense: enemy.defense)
        health.onDeath = { [weak self] in
            self?.handleDeath()
        }
        addComponent(health)

        // Mouvement
        let movement = MovementComponent(
            speed: enemy.speed,
            startPosition: spawn.position
        )
        addComponent(movement)

        // Combat
        let combat = CombatComponent(
            baseDamage: enemy.damage,
            attackSpeed: enemy.speed,
            attackRange: enemy.attackRange,
            critChance: enemy.tier == .boss ? 0.15 : 0.05
        )
        addComponent(combat)

        // IA
        let ai = AIComponent(
            behavior: enemy.behavior,
            detectionRange: enemy.detectionRange,
            attackRange: enemy.attackRange,
            abilities: enemy.abilities
        )
        addComponent(ai)

        // Animations
        sprite.registerAnimation(name: "idle", textureNames: ["\(enemy.spriteName)_idle_0", "\(enemy.spriteName)_idle_1"])
        sprite.registerAnimation(name: "walk", textureNames: (0...3).map { "\(enemy.spriteName)_walk_\($0)" })
        sprite.registerAnimation(name: "attack", textureNames: (0...2).map { "\(enemy.spriteName)_atk_\($0)" }, timePerFrame: 0.1)
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    // MARK: - AI driven attack

    func attemptAttack(on target: BaseEntity) -> Int? {
        guard let combat = combatComponent,
              let targetHealth = target.healthComponent,
              let ai = aiComponent,
              ai.canAttack else { return nil }

        ai.recordAttack()
        let isCrit = Double.random(in: 0...1) < combat.critChance
        let damage = combat.calculateDamage(isCritical: isCrit)
        let dealt = targetHealth.takeDamage(damage)

        spriteComponent?.playAnimation("attack", repeatForever: false)
        return dealt
    }

    // MARK: - Death

    private func handleDeath() {
        guard let sprite = spriteNode else { return }

        let fadeOut = SKAction.sequence([
            SKAction.fadeOut(withDuration: 0.5),
            SKAction.removeFromParent()
        ])
        sprite.run(fadeOut)
    }

    // MARK: - Loot

    var lootTable: [LootEntry] { enemyData.lootTable }
    var xpReward: Int { enemyData.xpReward }

    var goldReward: Int {
        Int.random(in: enemyData.goldReward)
    }
}
