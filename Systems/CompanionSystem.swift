import Foundation
import SpriteKit
import GameplayKit

/// Système de compagnons — un allié PNJ par monde, avec IA et dialogues de camp
final class CompanionSystem {

    // MARK: - Companion Data

    struct Companion: Codable, Identifiable {
        let id: String
        let name: String
        let worldID: WorldID
        let description: String
        let portraitName: String
        let spriteName: String

        // Stats de combat
        let baseHP: Int
        let baseDamage: Int
        let baseDefense: Int
        let attackRange: Double
        let magicSystem: MagicSystemType?

        // Comportement IA
        let combatStyle: CompanionCombatStyle

        // Progression
        var currentHP: Int
        var level: Int
        var loyalty: Int  // 0-100, augmente via dialogues et quêtes

        // Compétence spéciale
        let specialAbilityName: String
        let specialAbilityDescription: String
        let specialAbilityCooldown: TimeInterval
    }

    enum CompanionCombatStyle: String, Codable {
        case aggressive   // Fonce sur les ennemis
        case defensive    // Protège le joueur
        case support      // Heal et buff
        case ranged       // Attaque à distance
        case balanced     // Mix de tout
    }

    // MARK: - All Companions

    static let allCompanions: [Companion] = [
        Companion(
            id: "comp_vin",
            name: "Vin",
            worldID: "scadrial",
            description: "Jeune skaa aux talents allomantiques exceptionnels. Méfiante mais loyale.",
            portraitName: "portrait_vin",
            spriteName: "companion_vin",
            baseHP: 120,
            baseDamage: 18,
            baseDefense: 8,
            attackRange: 2.0,
            magicSystem: .allomancy,
            combatStyle: .aggressive,
            currentHP: 120,
            level: 1,
            loyalty: 10,
            specialAbilityName: "Danse des Brumes",
            specialAbilityDescription: "Vin brûle tous ses métaux simultanément pendant 8s — +100% dégâts et vitesse",
            specialAbilityCooldown: 45.0
        ),
        Companion(
            id: "comp_syl",
            name: "Syl",
            worldID: "roshar",
            description: "Spren d'honneur espiègle qui guide les Chevaliers du Vent. Peut se transformer en Lame Éclat.",
            portraitName: "portrait_syl",
            spriteName: "companion_syl",
            baseHP: 80,
            baseDamage: 22,
            baseDefense: 5,
            attackRange: 3.0,
            magicSystem: .surgebinding,
            combatStyle: .support,
            currentHP: 80,
            level: 1,
            loyalty: 15,
            specialAbilityName: "Forme de Lame Éclat",
            specialAbilityDescription: "Syl se transforme en arme légendaire — +200% dégâts d'attaque pendant 10s",
            specialAbilityCooldown: 60.0
        ),
        Companion(
            id: "comp_kenton",
            name: "Kenton",
            worldID: "taldain",
            description: "Jeune Maître du Sable déterminé à prouver la valeur de la Maîtrise du Sable.",
            portraitName: "portrait_kenton",
            spriteName: "companion_kenton",
            baseHP: 100,
            baseDamage: 15,
            baseDefense: 6,
            attackRange: 4.0,
            magicSystem: .sandMastery,
            combatStyle: .ranged,
            currentHP: 100,
            level: 1,
            loyalty: 10,
            specialAbilityName: "Maîtrise Suprême",
            specialAbilityDescription: "Kenton contrôle une immense vague de sable — dégâts AoE massifs",
            specialAbilityCooldown: 50.0
        ),
        Companion(
            id: "comp_nikaro",
            name: "Nikaro (Painter)",
            worldID: "komashi",
            description: "Peintre de cauchemars talentueux, obsédé par la perfection artistique.",
            portraitName: "portrait_nikaro",
            spriteName: "companion_nikaro",
            baseHP: 90,
            baseDamage: 20,
            baseDefense: 4,
            attackRange: 3.5,
            magicSystem: .painting,
            combatStyle: .balanced,
            currentHP: 90,
            level: 1,
            loyalty: 10,
            specialAbilityName: "Portrait de Bannissement",
            specialAbilityDescription: "Nikaro peint un portrait parfait de l'ennemi — bannissement instantané (hors boss)",
            specialAbilityCooldown: 55.0
        ),
        Companion(
            id: "comp_vivenna",
            name: "Vivenna",
            worldID: "nalthis",
            description: "Princesse Idrisienne qui maîtrise l'Éveil. Ses cheveux changent de couleur selon ses émotions.",
            portraitName: "portrait_vivenna",
            spriteName: "companion_vivenna",
            baseHP: 95,
            baseDamage: 14,
            baseDefense: 7,
            attackRange: 2.5,
            magicSystem: .awakening,
            combatStyle: .support,
            currentHP: 95,
            level: 1,
            loyalty: 10,
            specialAbilityName: "Commande Royale",
            specialAbilityDescription: "Vivenna anime tous les vêtements autour d'elle — 5 alliés temporaires pendant 15s",
            specialAbilityCooldown: 50.0
        ),
        Companion(
            id: "comp_raoden",
            name: "Raoden",
            worldID: "sel",
            description: "Prince Élantrien revenu d'entre les morts. Maîtrise les Aons avec créativité.",
            portraitName: "portrait_raoden",
            spriteName: "companion_raoden",
            baseHP: 110,
            baseDamage: 16,
            baseDefense: 10,
            attackRange: 3.0,
            magicSystem: .aonDor,
            combatStyle: .defensive,
            currentHP: 110,
            level: 1,
            loyalty: 10,
            specialAbilityName: "Aon Rao Suprême",
            specialAbilityDescription: "Raoden dessine un Aon Rao gigantesque — heal complet + bouclier pour le groupe",
            specialAbilityCooldown: 60.0
        )
    ]

    // MARK: - Active Party

    private(set) var activeCompanion: Companion?
    private var companionSprite: SKSpriteNode?
    private var specialAbilityCooldownTimer: TimeInterval = 0

    // MARK: - Recruit / Dismiss

    func recruitCompanion(id: String) -> Bool {
        guard let companion = Self.allCompanions.first(where: { $0.id == id }) else { return false }
        activeCompanion = companion
        return true
    }

    func dismissCompanion() {
        activeCompanion = nil
        companionSprite?.removeFromParent()
        companionSprite = nil
    }

    func swapCompanion(to id: String) -> Bool {
        dismissCompanion()
        return recruitCompanion(id: id)
    }

    // MARK: - Companion AI Update

    func update(deltaTime: TimeInterval, playerPosition: CGPoint, enemies: [(position: CGPoint, id: String)]) {
        guard var companion = activeCompanion, let sprite = companionSprite else { return }

        // Cooldown
        if specialAbilityCooldownTimer > 0 {
            specialAbilityCooldownTimer -= deltaTime
        }

        // Follow player (stay within 2 tiles)
        let distToPlayer = hypot(sprite.position.x - playerPosition.x, sprite.position.y - playerPosition.y)
        if distToPlayer > 80 {
            let angle = atan2(playerPosition.y - sprite.position.y, playerPosition.x - sprite.position.x)
            let speed: CGFloat = 100 * CGFloat(deltaTime)
            sprite.position.x += cos(angle) * speed
            sprite.position.y += sin(angle) * speed
        }

        // Combat AI based on style
        if let closestEnemy = findClosestEnemy(from: sprite.position, enemies: enemies) {
            let distToEnemy = closestEnemy.distance

            switch companion.combatStyle {
            case .aggressive:
                if distToEnemy <= CGFloat(companion.attackRange) * 32 {
                    performAttack(companion: companion, targetPosition: closestEnemy.position)
                }
            case .defensive:
                // Stay near player, only attack if enemy is close
                if distToEnemy <= 60 {
                    performAttack(companion: companion, targetPosition: closestEnemy.position)
                }
            case .support:
                // Check if player needs healing
                if let champ = GameManager.shared.champion, champ.currentHP < champ.maxHP / 2 {
                    performHeal(companion: &companion)
                }
            case .ranged:
                if distToEnemy <= CGFloat(companion.attackRange) * 32 {
                    performRangedAttack(companion: companion, targetPosition: closestEnemy.position)
                }
            case .balanced:
                if distToEnemy <= CGFloat(companion.attackRange) * 32 {
                    performAttack(companion: companion, targetPosition: closestEnemy.position)
                }
            }
        }

        activeCompanion = companion
    }

    // MARK: - Combat Actions

    private func performAttack(companion: Companion, targetPosition: CGPoint) {
        guard let sprite = companionSprite else { return }

        let attackAnim = SKAction.sequence([
            SKAction.scale(to: 1.15, duration: 0.05),
            SKAction.scale(to: 1.0, duration: 0.08)
        ])
        sprite.run(attackAnim)
    }

    private func performRangedAttack(companion: Companion, targetPosition: CGPoint) {
        guard let sprite = companionSprite else { return }

        let projectile = SKShapeNode(circleOfRadius: 4)
        projectile.fillColor = .cyan
        projectile.strokeColor = .white
        projectile.position = sprite.position
        projectile.zPosition = 150
        sprite.parent?.addChild(projectile)

        projectile.run(SKAction.sequence([
            SKAction.move(to: targetPosition, duration: 0.3),
            SKAction.removeFromParent()
        ]))
    }

    private func performHeal(companion: inout Companion) {
        guard var champ = GameManager.shared.champion else { return }
        let healAmount = companion.baseDamage
        champ.currentHP = min(champ.maxHP, champ.currentHP + healAmount)
        GameManager.shared.champion = champ
    }

    func useSpecialAbility() -> Bool {
        guard let companion = activeCompanion,
              specialAbilityCooldownTimer <= 0 else { return false }

        specialAbilityCooldownTimer = companion.specialAbilityCooldown

        // Visual effect
        if let sprite = companionSprite {
            let flash = SKAction.sequence([
                SKAction.colorize(with: .yellow, colorBlendFactor: 0.8, duration: 0.2),
                SKAction.colorize(withColorBlendFactor: 0, duration: 0.5)
            ])
            sprite.run(flash)
        }

        return true
    }

    // MARK: - Loyalty

    func increaseLoyalty(amount: Int) {
        activeCompanion?.loyalty = min(100, (activeCompanion?.loyalty ?? 0) + amount)
    }

    // MARK: - Spawn in Scene

    func spawnCompanion(in parent: SKNode, nearPosition: CGPoint) {
        guard let companion = activeCompanion else { return }

        companionSprite?.removeFromParent()

        let sprite = SKSpriteNode(color: .green, size: CGSize(width: 22, height: 34))
        sprite.position = CGPoint(x: nearPosition.x + 30, y: nearPosition.y - 15)
        sprite.zPosition = 95
        sprite.name = "companion_\(companion.id)"

        let nameLabel = SKLabelNode(fontNamed: "Helvetica")
        nameLabel.text = companion.name
        nameLabel.fontSize = 9
        nameLabel.fontColor = .green
        nameLabel.position = CGPoint(x: 0, y: 22)
        sprite.addChild(nameLabel)

        // HP bar
        let hpBar = SKShapeNode(rectOf: CGSize(width: 22, height: 2))
        hpBar.fillColor = .green
        hpBar.strokeColor = .clear
        hpBar.position = CGPoint(x: 0, y: 19)
        sprite.addChild(hpBar)

        parent.addChild(sprite)
        companionSprite = sprite
    }

    // MARK: - Helpers

    private func findClosestEnemy(from position: CGPoint, enemies: [(position: CGPoint, id: String)]) -> (position: CGPoint, id: String, distance: CGFloat)? {
        var closest: (position: CGPoint, id: String, distance: CGFloat)?
        for enemy in enemies {
            let dist = hypot(enemy.position.x - position.x, enemy.position.y - position.y)
            if closest == nil || dist < closest!.distance {
                closest = (enemy.position, enemy.id, dist)
            }
        }
        return closest
    }
}
