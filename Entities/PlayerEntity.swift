import GameplayKit
import SpriteKit

/// Entité joueur — le Salteur (Worldhopper)
class PlayerEntity: BaseEntity {

    let championClass: ChampionClass

    init(champion: Champion) {
        self.championClass = champion.championClass
        super.init(id: "player_\(champion.name)")

        // Sprite
        let sprite = SpriteComponent(
            textureName: spriteName(for: champion.championClass),
            size: CGSize(width: 32, height: 48)
        )
        addComponent(sprite)

        // Santé
        let health = HealthComponent(
            maxHP: champion.maxHP,
            defense: champion.baseStats.vigor / 2
        )
        health.currentHP = champion.currentHP
        addComponent(health)

        // Mouvement
        let movement = MovementComponent(
            speed: 2.0 + Double(champion.baseStats.agility) * 0.1,
            startPosition: champion.gridPosition
        )
        addComponent(movement)

        // Combat
        let combat = CombatComponent(
            baseDamage: champion.baseStats.strength,
            attackSpeed: 1.0 + Double(champion.baseStats.agility) * 0.05,
            attackRange: 1.5,
            critChance: Double(champion.baseStats.luck) * 0.01
        )
        addComponent(combat)

        // Inventaire
        let inventory = InventoryComponent(capacity: 40)
        for itemID in champion.inventoryItemIDs {
            inventory.addItem(itemID: itemID)
        }
        inventory.equipment = champion.equipment
        addComponent(inventory)

        // Système magique
        let magic = MagicSystemComponent(
            magicType: champion.championClass.magicSystem,
            maxInvestiture: champion.maxInvestiture,
            currentInvestiture: champion.currentInvestiture
        )
        addComponent(magic)

        // Enregistrer animations
        registerAnimations(for: champion.championClass)
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    // MARK: - Setup

    private func spriteName(for cls: ChampionClass) -> String {
        switch cls {
        case .mistborn:         return "champion_mistborn"
        case .radiant:          return "champion_radiant"
        case .awakener:         return "champion_awakener"
        case .elantrian:        return "champion_elantrian"
        case .sandMaster:       return "champion_sandmaster"
        case .nightmarePainter: return "champion_painter"
        }
    }

    private func registerAnimations(for cls: ChampionClass) {
        guard let sprite = spriteComponent else { return }
        let prefix = spriteName(for: cls)
        sprite.registerAnimation(name: "idle", textureNames: ["\(prefix)_idle_0", "\(prefix)_idle_1"])
        sprite.registerAnimation(name: "walk", textureNames: (0...3).map { "\(prefix)_walk_\($0)" })
        sprite.registerAnimation(name: "attack", textureNames: (0...3).map { "\(prefix)_atk_\($0)" }, timePerFrame: 0.1)
        sprite.registerAnimation(name: "skill", textureNames: (0...3).map { "\(prefix)_skill_\($0)" }, timePerFrame: 0.12)
    }

    // MARK: - Actions

    func attack(target: BaseEntity) -> Int? {
        guard let combat = combatComponent,
              let targetHealth = target.healthComponent else { return nil }

        let isCrit = Double.random(in: 0...1) < combat.critChance
        let damage = combat.calculateDamage(isCritical: isCrit)
        let dealt = targetHealth.takeDamage(damage)

        spriteComponent?.playAnimation("attack", repeatForever: false)

        return dealt
    }

    func useSkill(skillID: String, on target: BaseEntity?) -> Int? {
        guard let magic = magicSystemComponent,
              let skill = GameManager.shared.skill(byID: skillID),
              magic.canUseSkill(cost: skill.investitureCost) else { return nil }

        magic.consumeInvestiture(skill.investitureCost)
        spriteComponent?.playAnimation("skill", repeatForever: false)

        if let targetHealth = target?.healthComponent {
            let baseDmg = skill.baseDamage + (combatComponent?.baseDamage ?? 0) / 2
            return targetHealth.takeDamage(baseDmg)
        }
        return nil
    }

    func heal(_ amount: Int) {
        healthComponent?.heal(amount)
    }
}
