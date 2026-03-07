import GameplayKit
import SpriteKit

/// Entité PNJ — marchands, donneurs de quêtes, compagnons
class NPCEntity: BaseEntity {

    enum NPCRole: String {
        case merchant      // Vend des objets
        case questGiver    // Donne des quêtes
        case companion     // Compagnon recrutable
        case lorekeeper    // Dialogue narratif
        case trainer       // Entraîneur de compétences
    }

    let npcName: String
    let role: NPCRole
    let dialogueTreeID: String?
    let questIDs: [String]
    let shopItemIDs: [String]

    init(id: String, name: String, role: NPCRole,
         spriteName: String, position: GridPosition,
         dialogueTreeID: String? = nil,
         questIDs: [String] = [],
         shopItemIDs: [String] = []) {

        self.npcName = name
        self.role = role
        self.dialogueTreeID = dialogueTreeID
        self.questIDs = questIDs
        self.shopItemIDs = shopItemIDs
        super.init(id: id)

        // Sprite
        let sprite = SpriteComponent(
            textureName: spriteName,
            size: CGSize(width: 32, height: 48)
        )
        addComponent(sprite)

        // Mouvement (statique pour la plupart des PNJ)
        let movement = MovementComponent(speed: 0.5, startPosition: position)
        addComponent(movement)

        // Santé (les PNJ sont invulnérables)
        let health = HealthComponent(maxHP: GameConstants.NPC.invulnerableHP, defense: GameConstants.NPC.invulnerableDefense)
        addComponent(health)

        // Idle animation
        sprite.registerAnimation(name: "idle", textureNames: ["\(spriteName)_idle_0", "\(spriteName)_idle_1"])
        sprite.playAnimation("idle")
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    // MARK: - Interaction

    var interactionIcon: String {
        switch role {
        case .merchant:   return "icon_shop"
        case .questGiver: return "icon_quest"
        case .companion:  return "icon_companion"
        case .lorekeeper: return "icon_dialogue"
        case .trainer:    return "icon_train"
        }
    }

    var hasAvailableQuest: Bool {
        guard let champion = GameManager.shared.champion else { return false }
        return questIDs.contains { !champion.completedQuestIDs.contains($0) }
    }

    var canTrade: Bool { role == .merchant && !shopItemIDs.isEmpty }

    /// Affiche l'indicateur d'interaction au-dessus du PNJ
    func showInteractionIndicator() {
        guard let node = spriteNode else { return }
        let indicator = SKSpriteNode(imageNamed: interactionIcon)
        indicator.name = "npc_indicator"
        indicator.size = CGSize(width: 16, height: 16)
        indicator.position = CGPoint(x: 0, y: node.size.height / 2 + 12)
        indicator.zPosition = 150

        let bounce = SKAction.sequence([
            SKAction.moveBy(x: 0, y: 4, duration: 0.5),
            SKAction.moveBy(x: 0, y: -4, duration: 0.5)
        ])
        indicator.run(SKAction.repeatForever(bounce))
        node.addChild(indicator)
    }
}
