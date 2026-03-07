import SpriteKit
import GameplayKit

/// Composant visuel — sprite animé pour une entité
class SpriteComponent: GKComponent {

    let node: SKSpriteNode
    private var animations: [String: [SKTexture]] = [:]
    private var currentAnimation: String?

    init(textureName: String, size: CGSize = CGSize(width: 32, height: 48)) {
        self.node = SKSpriteNode(imageNamed: textureName)
        self.node.size = size
        super.init()
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    // MARK: - Animations

    func registerAnimation(name: String, textureNames: [String], timePerFrame: TimeInterval = 0.15) {
        animations[name] = textureNames.map { SKTexture(imageNamed: $0) }
    }

    func playAnimation(_ name: String, repeatForever: Bool = true) {
        guard let textures = animations[name],
              currentAnimation != name else { return }

        currentAnimation = name
        node.removeAction(forKey: "animation")

        let animate = SKAction.animate(with: textures, timePerFrame: 0.15)
        let action = repeatForever ? SKAction.repeatForever(animate) : animate
        node.run(action, withKey: "animation")
    }

    func stopAnimation() {
        node.removeAction(forKey: "animation")
        currentAnimation = nil
    }

    // MARK: - Direction

    enum FacingDirection {
        case up, down, left, right
    }

    func setFacing(_ direction: FacingDirection) {
        switch direction {
        case .left:
            node.xScale = -abs(node.xScale)
        case .right:
            node.xScale = abs(node.xScale)
        default:
            break
        }
    }

    // MARK: - Flash effect (dégâts reçus)

    func flashDamage() {
        let flash = SKAction.sequence([
            SKAction.colorize(with: .red, colorBlendFactor: 0.8, duration: 0.05),
            SKAction.colorize(withColorBlendFactor: 0, duration: 0.15)
        ])
        node.run(flash)
    }

    // MARK: - Floating damage number

    func showDamageNumber(_ amount: Int, isCritical: Bool = false) {
        let label = SKLabelNode(fontNamed: "Helvetica-Bold")
        label.text = isCritical ? "\(amount)!" : "\(amount)"
        label.fontSize = isCritical ? 18 : 14
        label.fontColor = isCritical ? .yellow : .white
        label.position = CGPoint(x: CGFloat.random(in: -10...10), y: node.size.height / 2 + 5)
        label.zPosition = 200
        node.addChild(label)

        let floatUp = SKAction.moveBy(x: 0, y: 40, duration: 0.8)
        let fadeOut = SKAction.fadeOut(withDuration: 0.5)
        let group = SKAction.group([floatUp, fadeOut])
        label.run(SKAction.sequence([group, SKAction.removeFromParent()]))
    }
}
