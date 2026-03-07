import Foundation
import SpriteKit

/// Machine à états pour l'IA des ennemis — patrouille, détection, combat, fuite
final class EnemyAISystem {

    // MARK: - AI State Machine

    enum AIState {
        case idle
        case patrolling(pathIndex: Int)
        case chasing(target: CGPoint)
        case attacking(cooldown: TimeInterval)
        case retreating
        case stunned(remaining: TimeInterval)
        case dead
        case usingAbility(abilityIndex: Int, cooldown: TimeInterval)
    }

    // MARK: - Enemy Instance (runtime)

    struct EnemyInstance {
        let enemyData: Enemy
        let spawnData: EnemySpawn
        var currentHP: Int
        var position: CGPoint
        var gridPosition: GridPosition
        var state: AIState
        var sprite: SKNode?
        var lastAttackTime: TimeInterval
        var respawnTimer: TimeInterval?
        var abilityCooldowns: [TimeInterval]
        var aggroTarget: CGPoint?

        var isAlive: Bool { currentHP > 0 }
        var healthPercent: Double { Double(currentHP) / Double(enemyData.maxHP) }
    }

    // MARK: - Configuration

    private let attackCooldown: TimeInterval = 1.5
    private let abilityChance: Double = 0.2  // 20% chance d'utiliser une compétence spéciale
    private let retreatHealthThreshold: Double = 0.15  // Fuit à 15% PV

    // MARK: - Update

    func update(enemy: inout EnemyInstance, playerPosition: CGPoint, deltaTime: TimeInterval) {
        guard enemy.isAlive else {
            handleDeathState(enemy: &enemy, deltaTime: deltaTime)
            return
        }

        let distToPlayer = hypot(
            enemy.position.x - playerPosition.x,
            enemy.position.y - playerPosition.y
        )
        let detectionRange = CGFloat(enemy.enemyData.detectionRange) * 32
        let attackRange = CGFloat(enemy.enemyData.attackRange) * 32

        // Update ability cooldowns
        for i in 0..<enemy.abilityCooldowns.count {
            if enemy.abilityCooldowns[i] > 0 {
                enemy.abilityCooldowns[i] -= deltaTime
            }
        }

        switch enemy.state {
        case .idle:
            handleIdle(enemy: &enemy, distToPlayer: distToPlayer, detectionRange: detectionRange)

        case .patrolling(let pathIndex):
            handlePatrol(enemy: &enemy, pathIndex: pathIndex, distToPlayer: distToPlayer,
                        detectionRange: detectionRange, deltaTime: deltaTime)

        case .chasing:
            handleChase(enemy: &enemy, playerPosition: playerPosition,
                       distToPlayer: distToPlayer, attackRange: attackRange, deltaTime: deltaTime)

        case .attacking(let cooldown):
            handleAttack(enemy: &enemy, playerPosition: playerPosition,
                        distToPlayer: distToPlayer, attackRange: attackRange,
                        cooldown: cooldown, deltaTime: deltaTime)

        case .retreating:
            handleRetreat(enemy: &enemy, playerPosition: playerPosition, deltaTime: deltaTime)

        case .stunned(let remaining):
            handleStun(enemy: &enemy, remaining: remaining, deltaTime: deltaTime)

        case .usingAbility(let index, let cooldown):
            handleAbility(enemy: &enemy, abilityIndex: index, cooldown: cooldown, deltaTime: deltaTime)

        case .dead:
            break
        }

        // Check retreat threshold (sauf boss et berserk)
        if enemy.enemyData.tier != .boss && enemy.enemyData.behavior != .berserk {
            if enemy.healthPercent < retreatHealthThreshold {
                enemy.state = .retreating
            }
        }
    }

    // MARK: - State Handlers

    private func handleIdle(enemy: inout EnemyInstance, distToPlayer: CGFloat, detectionRange: CGFloat) {
        if distToPlayer <= detectionRange {
            enemy.state = .chasing(target: enemy.position)
            enemy.aggroTarget = enemy.position
        } else if let patrolPath = enemy.spawnData.patrolPath, !patrolPath.isEmpty {
            enemy.state = .patrolling(pathIndex: 0)
        }
    }

    private func handlePatrol(enemy: inout EnemyInstance, pathIndex: Int, distToPlayer: CGFloat,
                              detectionRange: CGFloat, deltaTime: TimeInterval) {
        // Player détecté ?
        if distToPlayer <= detectionRange {
            enemy.state = .chasing(target: enemy.position)
            return
        }

        // Suivre le chemin de patrouille
        guard let path = enemy.spawnData.patrolPath, !path.isEmpty else {
            enemy.state = .idle
            return
        }

        let targetPos = path[pathIndex]
        let targetIso = isoPosition(col: targetPos.col, row: targetPos.row)

        let dx = targetIso.x - enemy.position.x
        let dy = targetIso.y - enemy.position.y
        let dist = hypot(dx, dy)

        if dist < 5 {
            // Arrivé au point, prochain
            let nextIndex = (pathIndex + 1) % path.count
            enemy.state = .patrolling(pathIndex: nextIndex)
        } else {
            // Se déplacer vers le point
            let speed = CGFloat(enemy.enemyData.speed) * 30 * CGFloat(deltaTime)
            let angle = atan2(dy, dx)
            enemy.position.x += cos(angle) * speed
            enemy.position.y += sin(angle) * speed
            enemy.sprite?.position = enemy.position
        }
    }

    private func handleChase(enemy: inout EnemyInstance, playerPosition: CGPoint,
                             distToPlayer: CGFloat, attackRange: CGFloat, deltaTime: TimeInterval) {
        if distToPlayer <= attackRange {
            enemy.state = .attacking(cooldown: 0)
        } else if distToPlayer > CGFloat(enemy.enemyData.detectionRange) * 64 {
            // Joueur trop loin, retourner à la patrouille
            enemy.state = .idle
        } else {
            // Se déplacer vers le joueur
            let speed = CGFloat(enemy.enemyData.speed) * 40 * CGFloat(deltaTime)
            let angle = atan2(playerPosition.y - enemy.position.y, playerPosition.x - enemy.position.x)

            // Ajuster la vitesse selon le comportement
            let speedMultiplier: CGFloat
            switch enemy.enemyData.behavior {
            case .berserk:  speedMultiplier = 1.5
            case .ranged:   speedMultiplier = 0.7
            case .support:  speedMultiplier = 0.8
            default:        speedMultiplier = 1.0
            }

            enemy.position.x += cos(angle) * speed * speedMultiplier
            enemy.position.y += sin(angle) * speed * speedMultiplier
            enemy.sprite?.position = enemy.position
        }
    }

    private func handleAttack(enemy: inout EnemyInstance, playerPosition: CGPoint,
                              distToPlayer: CGFloat, attackRange: CGFloat,
                              cooldown: TimeInterval, deltaTime: TimeInterval) {
        if distToPlayer > attackRange * 1.5 {
            enemy.state = .chasing(target: playerPosition)
            return
        }

        let newCooldown = cooldown - deltaTime

        if newCooldown <= 0 {
            // Décider : attaque normale ou compétence spéciale ?
            if !enemy.enemyData.abilities.isEmpty && Double.random(in: 0...1) < abilityChance {
                // Trouver une compétence disponible
                for (i, _) in enemy.enemyData.abilities.enumerated() {
                    if i < enemy.abilityCooldowns.count && enemy.abilityCooldowns[i] <= 0 {
                        enemy.state = .usingAbility(abilityIndex: i, cooldown: 0.5)
                        return
                    }
                }
            }

            // Attaque normale
            performBasicAttack(enemy: &enemy, targetPosition: playerPosition)
            enemy.state = .attacking(cooldown: attackCooldown)
        } else {
            enemy.state = .attacking(cooldown: newCooldown)
        }
    }

    private func handleRetreat(enemy: inout EnemyInstance, playerPosition: CGPoint, deltaTime: TimeInterval) {
        // Fuir dans la direction opposée au joueur
        let angle = atan2(enemy.position.y - playerPosition.y, enemy.position.x - playerPosition.x)
        let speed = CGFloat(enemy.enemyData.speed) * 50 * CGFloat(deltaTime)

        enemy.position.x += cos(angle) * speed
        enemy.position.y += sin(angle) * speed
        enemy.sprite?.position = enemy.position

        // Si assez loin, idle
        let dist = hypot(enemy.position.x - playerPosition.x, enemy.position.y - playerPosition.y)
        if dist > CGFloat(enemy.enemyData.detectionRange) * 64 {
            enemy.state = .idle
        }
    }

    private func handleStun(enemy: inout EnemyInstance, remaining: TimeInterval, deltaTime: TimeInterval) {
        let newRemaining = remaining - deltaTime
        if newRemaining <= 0 {
            enemy.state = .idle
            enemy.sprite?.alpha = 1.0
        } else {
            enemy.state = .stunned(remaining: newRemaining)
        }
    }

    private func handleAbility(enemy: inout EnemyInstance, abilityIndex: Int,
                                cooldown: TimeInterval, deltaTime: TimeInterval) {
        let newCooldown = cooldown - deltaTime
        if newCooldown <= 0 {
            // Exécuter la compétence
            performAbility(enemy: &enemy, abilityIndex: abilityIndex)
            if abilityIndex < enemy.abilityCooldowns.count {
                enemy.abilityCooldowns[abilityIndex] = 10.0  // Cooldown de la compétence
            }
            enemy.state = .attacking(cooldown: attackCooldown)
        } else {
            enemy.state = .usingAbility(abilityIndex: abilityIndex, cooldown: newCooldown)
        }
    }

    private func handleDeathState(enemy: inout EnemyInstance, deltaTime: TimeInterval) {
        if let respawnTime = enemy.spawnData.respawnTime {
            enemy.respawnTimer = (enemy.respawnTimer ?? respawnTime) - deltaTime
            if (enemy.respawnTimer ?? 0) <= 0 {
                // Respawn
                enemy.currentHP = enemy.enemyData.maxHP
                enemy.position = isoPosition(col: enemy.spawnData.position.col, row: enemy.spawnData.position.row)
                enemy.gridPosition = enemy.spawnData.position
                enemy.state = .idle
                enemy.respawnTimer = nil
                enemy.sprite?.isHidden = false
                enemy.sprite?.position = enemy.position
                enemy.sprite?.alpha = 1.0
                enemy.sprite?.setScale(1.0)
            }
        }
    }

    // MARK: - Actions

    private func performBasicAttack(enemy: inout EnemyInstance, targetPosition: CGPoint) {
        guard let sprite = enemy.sprite else { return }

        // Animation d'attaque (lunge toward player)
        let dx = targetPosition.x - sprite.position.x
        let dy = targetPosition.y - sprite.position.y
        let dist = hypot(dx, dy)
        let lungeX = dist > 0 ? dx / dist * 5 : 0
        let lungeY = dist > 0 ? dy / dist * 5 : 0

        let attackAnim = SKAction.sequence([
            SKAction.moveBy(x: lungeX, y: lungeY, duration: 0.05),
            SKAction.moveBy(x: -lungeX, y: -lungeY, duration: 0.1)
        ])
        sprite.run(attackAnim)

        // Appliquer les dégâts au champion
        if var champion = GameManager.shared.champion {
            let damage = GameManager.shared.combatSystem.calculateEnemyDamage(
                enemy: enemy.enemyData,
                defenderStats: champion.baseStats
            )
            champion.currentHP = max(0, champion.currentHP - damage)
            GameManager.shared.champion = champion
        }
    }

    private func performAbility(enemy: inout EnemyInstance, abilityIndex: Int) {
        guard let sprite = enemy.sprite else { return }

        // Effet visuel de compétence spéciale
        SpellEffectsSystem.spawnAOE(
            at: sprite.position,
            color: enemyTierColor(enemy.enemyData.tier),
            radius: 40,
            in: sprite.parent ?? sprite,
            duration: 0.5
        )

        // Dégâts augmentés pour les compétences
        if var champion = GameManager.shared.champion {
            let damage = Int(Double(enemy.enemyData.damage) * 1.5)
            champion.currentHP = max(0, champion.currentHP - damage)
            GameManager.shared.champion = champion
        }
    }

    // MARK: - Damage from Player

    func takeDamage(enemy: inout EnemyInstance, amount: Int) -> Bool {
        enemy.currentHP -= amount

        // Flash damage via EntityRenderer
        if let node = enemy.sprite {
            EntityRenderer.playHitEffect(on: node)
            let ratio = CGFloat(enemy.currentHP) / CGFloat(enemy.enemyData.maxHP)
            EntityRenderer.updateEnemyHP(node: node, ratio: ratio)
        }

        if enemy.currentHP <= 0 {
            kill(enemy: &enemy)
            return true
        }
        return false
    }

    func stun(enemy: inout EnemyInstance, duration: TimeInterval) {
        enemy.state = .stunned(remaining: duration)
        // Yellow tint via alpha pulse
        enemy.sprite?.run(SKAction.sequence([
            SKAction.fadeAlpha(to: 0.5, duration: 0.1),
            SKAction.fadeAlpha(to: 1.0, duration: 0.1)
        ]))
    }

    private func kill(enemy: inout EnemyInstance) {
        enemy.state = .dead

        guard let sprite = enemy.sprite else { return }

        // Animation de mort
        sprite.run(SKAction.sequence([
            SKAction.group([
                SKAction.fadeOut(withDuration: 0.5),
                SKAction.scale(to: 0.5, duration: 0.5)
            ]),
            SKAction.run { sprite.isHidden = true }
        ]))

        // Distribuer XP et loot
        GameManager.shared.grantXP(enemy.enemyData.xpReward)

        let goldDrop = Int.random(in: enemy.enemyData.goldReward)
        GameManager.shared.champion?.gold += goldDrop

        let loot = GameManager.shared.lootSystem.generateLoot(from: enemy.enemyData)
        for item in loot {
            GameManager.shared.champion?.inventoryItemIDs.append(item.id)
        }

        // Notifications quêtes
        GameManager.shared.questSystem.onEnemyKilled(enemyID: enemy.enemyData.id)
    }

    // MARK: - Helpers

    private func isoPosition(col: Int, row: Int) -> CGPoint {
        let tileWidth: CGFloat = 64
        let tileHeight: CGFloat = 32
        let x = CGFloat(col - row) * tileWidth / 2
        let y = CGFloat(col + row) * tileHeight / 2
        return CGPoint(x: x, y: -y)
    }

    private func enemyTierColor(_ tier: EnemyTier) -> SKColor {
        switch tier {
        case .minion:  return .red
        case .soldier: return .orange
        case .elite:   return .purple
        case .boss:    return SKColor(red: 1, green: 0.2, blue: 0.2, alpha: 1)
        }
    }
}
