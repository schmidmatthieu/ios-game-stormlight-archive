import SwiftUI

/// Point d'entrée de l'application Cosmere Chronicles
@main
struct CosmereChroniclesApp: App {

    var body: some Scene {
        WindowGroup {
            GameContainerView()
                .ignoresSafeArea()
                .statusBarHidden()
                .persistentSystemOverlays(.hidden)
        }
    }
}

/// Vue SwiftUI qui enveloppe le GameViewController (SpriteKit)
struct GameContainerView: UIViewControllerRepresentable {

    func makeUIViewController(context: Context) -> GameViewController {
        GameViewController()
    }

    func updateUIViewController(_ uiViewController: GameViewController, context: Context) {
        // Pas de mise à jour nécessaire — SpriteKit gère son propre cycle de rendu
    }
}
