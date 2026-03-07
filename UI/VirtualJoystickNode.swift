import SpriteKit

/// Joystick virtuel style Wild Rift — pad de déplacement analogique
class VirtualJoystickNode: SKNode {

    // MARK: - Configuration

    struct Config {
        var baseRadius: CGFloat = 60
        var thumbRadius: CGFloat = 25
        var baseColor: SKColor = SKColor(white: 0.2, alpha: 0.6)
        var thumbColor: SKColor = SKColor(white: 0.8, alpha: 0.8)
        var borderColor: SKColor = SKColor(white: 0.5, alpha: 0.4)
        var deadZone: CGFloat = 0.1  // Zone morte au centre (0-1)
        var sensitivity: CGFloat = 1.0  // Multiplicateur de sensibilité (0.3–2.0)
    }

    // MARK: - State

    /// Direction normalisée (-1 à 1 sur chaque axe)
    private(set) var direction: CGVector = .zero

    /// Magnitude normalisée (0-1), utile pour la vitesse proportionnelle
    private(set) var magnitude: CGFloat = 0

    /// Le joystick est-il actuellement touché ?
    private(set) var isActive: Bool = false

    /// Callback à chaque update de direction
    var onDirectionChanged: ((CGVector, CGFloat) -> Void)?

    /// Callback quand le joystick est relâché
    var onRelease: (() -> Void)?

    // MARK: - Nodes

    private let baseNode: SKShapeNode
    private let thumbNode: SKShapeNode
    private let innerRing: SKShapeNode
    private let config: Config
    private var trackingTouch: UITouch?

    // MARK: - Init

    init(config: Config = Config()) {
        self.config = config

        // Base (cercle extérieur)
        baseNode = SKShapeNode(circleOfRadius: config.baseRadius)
        baseNode.fillColor = config.baseColor
        baseNode.strokeColor = config.borderColor
        baseNode.lineWidth = 2
        baseNode.zPosition = 1000

        // Anneau intérieur (zone morte visuelle)
        let innerRadius = config.baseRadius * config.deadZone
        innerRing = SKShapeNode(circleOfRadius: innerRadius)
        innerRing.fillColor = .clear
        innerRing.strokeColor = SKColor(white: 0.4, alpha: 0.3)
        innerRing.lineWidth = 1
        innerRing.zPosition = 1001

        // Thumb (stick)
        thumbNode = SKShapeNode(circleOfRadius: config.thumbRadius)
        thumbNode.fillColor = config.thumbColor
        thumbNode.strokeColor = SKColor.white.withAlphaComponent(0.5)
        thumbNode.lineWidth = 1.5
        thumbNode.zPosition = 1002

        // Indicateur directionnel sur le thumb
        let indicator = SKShapeNode(circleOfRadius: config.thumbRadius * 0.3)
        indicator.fillColor = SKColor(white: 1.0, alpha: 0.4)
        indicator.strokeColor = .clear
        indicator.position = CGPoint(x: 0, y: config.thumbRadius * 0.3)
        indicator.name = "indicator"
        thumbNode.addChild(indicator)

        super.init()

        addChild(baseNode)
        addChild(innerRing)
        addChild(thumbNode)

        isUserInteractionEnabled = true
    }

    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    // MARK: - Touch Handling

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard trackingTouch == nil, let touch = touches.first else { return }
        trackingTouch = touch
        isActive = true
        updateThumbPosition(touch)

        // Feedback visuel
        baseNode.run(SKAction.fadeAlpha(to: 0.9, duration: 0.1))
        thumbNode.run(SKAction.scale(to: 1.1, duration: 0.1))
    }

    override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let touch = trackingTouch, touches.contains(touch) else { return }
        updateThumbPosition(touch)
    }

    override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let touch = trackingTouch, touches.contains(touch) else { return }
        resetJoystick()
    }

    override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let touch = trackingTouch, touches.contains(touch) else { return }
        resetJoystick()
    }

    // MARK: - Position Update

    private func updateThumbPosition(_ touch: UITouch) {
        let location = touch.location(in: self)

        // Calculer le déplacement relatif au centre
        let dx = location.x
        let dy = location.y
        let distance = sqrt(dx * dx + dy * dy)
        let maxDistance = config.baseRadius - config.thumbRadius * 0.5

        // Clamper à la zone du joystick
        let clampedDistance = min(distance, maxDistance)
        let angle = atan2(dy, dx)

        let thumbX = cos(angle) * clampedDistance
        let thumbY = sin(angle) * clampedDistance

        thumbNode.position = CGPoint(x: thumbX, y: thumbY)

        // Calculer la magnitude normalisée
        magnitude = clampedDistance / maxDistance

        // Appliquer la zone morte
        if magnitude < config.deadZone {
            direction = .zero
            magnitude = 0
        } else {
            // Remapper la magnitude sans la zone morte
            let remapped = (magnitude - config.deadZone) / (1.0 - config.deadZone)
            // Appliquer la sensibilité depuis les paramètres
            let sensitivity = CGFloat(SettingsMenuNode.current.joystickSensitivity)
            let adjusted = min(remapped * sensitivity, 1.0)
            magnitude = adjusted
            direction = CGVector(dx: cos(angle) * adjusted, dy: sin(angle) * adjusted)
        }

        // Tourner l'indicateur directionnel
        if let indicator = thumbNode.childNode(withName: "indicator") {
            indicator.position = CGPoint(
                x: cos(angle) * config.thumbRadius * 0.3,
                y: sin(angle) * config.thumbRadius * 0.3
            )
        }

        onDirectionChanged?(direction, magnitude)
    }

    private func resetJoystick() {
        trackingTouch = nil
        isActive = false
        direction = .zero
        magnitude = 0

        // Animer le retour au centre
        thumbNode.run(SKAction.group([
            SKAction.move(to: .zero, duration: 0.15),
            SKAction.scale(to: 1.0, duration: 0.15)
        ]))
        baseNode.run(SKAction.fadeAlpha(to: 0.6, duration: 0.15))

        onRelease?()
    }

    // MARK: - Hit Test Override

    /// Zone de touch élargie pour faciliter l'utilisation
    override func contains(_ p: CGPoint) -> Bool {
        let touchRadius = config.baseRadius * 1.3
        let distance = sqrt(p.x * p.x + p.y * p.y)
        return distance <= touchRadius
    }
}
