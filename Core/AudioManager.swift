import AVFoundation
import SpriteKit

/// Gère la musique de fond et les effets sonores
final class AudioManager {
    static let shared = AudioManager()

    private var musicPlayer: AVAudioPlayer?
    private var currentTrack: String?
    private static let maxSFXCacheSize = 50
    private var sfxActions: [String: SKAction] = [:]

    var musicVolume: Float = 0.5 {
        didSet { musicPlayer?.volume = musicVolume }
    }
    var sfxVolume: Float = 0.7

    private init() {}

    // MARK: - Musique

    func playMusic(_ trackName: String, loop: Bool = true) {
        guard trackName != currentTrack else { return }

        // Stop previous player before creating new one
        musicPlayer?.stop()
        musicPlayer = nil
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

    func setMusicVolume(_ volume: Float) {
        musicVolume = max(0, min(1, volume))
    }

    func setSFXVolume(_ volume: Float) {
        sfxVolume = max(0, min(1, volume))
    }

    func playSFX(_ name: String, on node: SKNode) {
        let action: SKAction
        if let cached = sfxActions[name] {
            action = cached
        } else {
            // Evict oldest entries if cache is full
            if sfxActions.count >= AudioManager.maxSFXCacheSize {
                sfxActions.removeAll()
            }
            action = SKAction.playSoundFileNamed("\(name).wav", waitForCompletion: false)
            sfxActions[name] = action
        }
        node.run(action)
    }
}
