import GameplayKit
import SpriteKit

/// Composant de déplacement sur la grille isométrique
class MovementComponent: GKComponent {

    var speed: Double {  // Vitesse en tiles par seconde
        didSet { speed = max(0.1, speed) }
    }
    var isMoving: Bool = false
    var currentGridPosition: GridPosition

    init(speed: Double, startPosition: GridPosition = GridPosition(col: 0, row: 0)) {
        self.speed = max(0.1, speed)
        self.currentGridPosition = startPosition
        super.init()
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    var moveDuration: TimeInterval {
        1.0 / speed
    }
}
