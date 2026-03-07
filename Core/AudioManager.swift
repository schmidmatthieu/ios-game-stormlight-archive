import AVFoundation
import SpriteKit

/// Gère la musique de fond et les effets sonores
final class AudioManager {
    static let shared = AudioManager()

    private var musicPlayer: AVAudioPlayer?
    private var currentTrack: String?
    private var sfxActions: [String: SKAction] = []

    var musicVolume: Float = 0.5 {
        didSet { musicPlayer?.volume = musicVolume }
    }
    var sfxVolume: Float = 0.7

    private init() {}

    // MARK: - Musique

    func playMusic(_ trackName: String, loop: Bool = true) {
        guard trackName != currentTrack else { return }
        currentTrack = trackName

        guard let url = Bundle.main.url(forResource: trackName, withExtension: "mp3") else {
            print("⚠️ Track introuvable: \(trackName)")
            return
        }

        do {
            musicPlayer = try AVAudioPlayer(contentsOf: url)
            musicPlayer?.volume = musicVolume
            musicPlayer?.numberOfLoops = loop ? -1 : 0
            musicPlayer?.play()
        } catch {
            print("⚠️ Erreur lecture musique: \(error)")
        }
    }

    func stopMusic(fadeDuration: TimeInterval = 1.0) {
        musicPlayer?.setVolume(0, fadeDuration: fadeDuration)
        DispatchQueue.main.asyncAfter(deadline: .now() + fadeDuration) { [weak self] in
            self?.musicPlayer?.stop()
            self?.currentTrack = nil
        }
    }

    // MARK: - Effets sonores (via SKAction pour performance)

    func playSFX(_ name: String, on node: SKNode) {
        let action: SKAction
        if let cached = sfxActions[name] {
            action = cached
        } else {
            action = SKAction.playSoundFileNamed("\(name).wav", waitForCompletion: false)
            sfxActions[name] = action
        }
        node.run(action)
    }
}
