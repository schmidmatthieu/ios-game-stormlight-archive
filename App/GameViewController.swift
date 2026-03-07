import UIKit
import SpriteKit

/// Contrôleur principal qui héberge la SKView
class GameViewController: UIViewController {

    var sceneRouter: SceneRouter!

    override func viewDidLoad() {
        super.viewDidLoad()

        // Configurer la SKView
        let skView = SKView(frame: view.bounds)
        skView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        skView.ignoresSiblingOrder = true

        #if DEBUG
        skView.showsFPS = true
        skView.showsNodeCount = true
        #endif

        view.addSubview(skView)

        // Initialiser le router et le GameManager
        sceneRouter = SceneRouter(view: skView)
        GameManager.shared.loadGameData()

        // Afficher le menu principal
        sceneRouter.showMainMenu()
    }

    override var supportedInterfaceOrientations: UIInterfaceOrientationMask {
        .portrait
    }

    override var prefersStatusBarHidden: Bool {
        true
    }
}
