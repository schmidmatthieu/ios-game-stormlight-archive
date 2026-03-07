import SpriteKit

/// Menu de paramètres — volume audio, sensibilité joystick, vitesse de texte
final class SettingsMenuNode: SKNode {

    // MARK: - Settings State

    struct Settings {
        var musicVolume: Float = 0.7
        var sfxVolume: Float = 1.0
        var joystickSensitivity: Float = 1.0
        var textSpeed: Float = 1.0  // Multiplicateur (0.5 = lent, 2.0 = rapide)
    }

    static var current = Settings()

    // MARK: - Properties

    private let screenSize: CGSize
    var onClose: (() -> Void)?

    // Slider nodes
    private var sliders: [String: (track: SKShapeNode, thumb: SKShapeNode, value: Float)] = [:]
    private var activeSlider: String?

    // MARK: - Init

    init(screenSize: CGSize) {
        self.screenSize = screenSize
        super.init()
        isUserInteractionEnabled = true
        zPosition = 6000
        setupUI()
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    // MARK: - Setup

    private func setupUI() {
        // Overlay sombre
        let overlay = SKShapeNode(rectOf: screenSize)
        overlay.fillColor = SKColor(white: 0, alpha: 0.85)
        overlay.strokeColor = .clear
        overlay.zPosition = 0
        overlay.name = "settingsOverlay"
        addChild(overlay)

        // Panel
        let panelSize = CGSize(width: 280, height: 380)
        let panel = SKShapeNode(rectOf: panelSize, cornerRadius: 16)
        panel.fillColor = GameConstants.Colors.panelBackground
        panel.strokeColor = GameConstants.Colors.panelBorder
        panel.lineWidth = 2
        panel.zPosition = 1
        addChild(panel)

        // Titre
        let title = SKLabelNode(fontNamed: "Copperplate-Bold")
        title.text = "Paramètres"
        title.fontSize = 22
        title.fontColor = GameConstants.Colors.gold
        title.position = CGPoint(x: 0, y: 150)
        title.zPosition = 2
        addChild(title)

        // Sliders
        setupSlider(label: "Musique", y: 95, name: "music", value: SettingsMenuNode.current.musicVolume)
        setupSlider(label: "Effets Sonores", y: 35, name: "sfx", value: SettingsMenuNode.current.sfxVolume)
        setupSlider(label: "Sensibilité Joystick", y: -25, name: "joystick", value: SettingsMenuNode.current.joystickSensitivity)
        setupSlider(label: "Vitesse Texte", y: -85, name: "textSpeed", value: SettingsMenuNode.current.textSpeed / 2.0)

        // Bouton Fermer
        let closeBtn = SKShapeNode(rectOf: CGSize(width: 180, height: 44), cornerRadius: 8)
        closeBtn.fillColor = SKColor(red: 0.2, green: 0.15, blue: 0.3, alpha: 0.8)
        closeBtn.strokeColor = GameConstants.Colors.panelBorder
        closeBtn.lineWidth = 1.5
        closeBtn.position = CGPoint(x: 0, y: -150)
        closeBtn.zPosition = 2
        closeBtn.name = "closeSettings"
        addChild(closeBtn)

        let closeLabel = SKLabelNode(fontNamed: "Copperplate")
        closeLabel.text = "Fermer"
        closeLabel.fontSize = 16
        closeLabel.fontColor = .white
        closeLabel.verticalAlignmentMode = .center
        closeLabel.name = "closeSettings"
        addChild(closeLabel)
        closeLabel.position = CGPoint(x: 0, y: -150)
        closeLabel.zPosition = 3
    }

    private func setupSlider(label: String, y: CGFloat, name: String, value: Float) {
        let trackWidth: CGFloat = 200
        let trackHeight: CGFloat = 6

        // Label
        let lbl = SKLabelNode(fontNamed: "Copperplate")
        lbl.text = label
        lbl.fontSize = 13
        lbl.fontColor = SKColor(white: 0.8, alpha: 1.0)
        lbl.position = CGPoint(x: 0, y: y + 18)
        lbl.zPosition = 2
        addChild(lbl)

        // Track
        let track = SKShapeNode(rectOf: CGSize(width: trackWidth, height: trackHeight), cornerRadius: 3)
        track.fillColor = SKColor(white: 0.2, alpha: 1.0)
        track.strokeColor = SKColor(white: 0.35, alpha: 0.5)
        track.lineWidth = 1
        track.position = CGPoint(x: 0, y: y)
        track.zPosition = 2
        track.name = "track_\(name)"
        addChild(track)

        // Thumb
        let thumbX = CGFloat(value) * trackWidth - trackWidth / 2
        let thumb = SKShapeNode(circleOfRadius: 10)
        thumb.fillColor = GameConstants.Colors.gold
        thumb.strokeColor = .white
        thumb.lineWidth = 1.5
        thumb.position = CGPoint(x: thumbX, y: y)
        thumb.zPosition = 3
        thumb.name = "thumb_\(name)"
        addChild(thumb)

        // Value label
        let valLabel = SKLabelNode(fontNamed: "Helvetica-Bold")
        valLabel.text = "\(Int(value * 100))%"
        valLabel.fontSize = 10
        valLabel.fontColor = SKColor(white: 0.6, alpha: 1.0)
        valLabel.position = CGPoint(x: trackWidth / 2 + 25, y: y - 3)
        valLabel.zPosition = 2
        valLabel.name = "value_\(name)"
        addChild(valLabel)

        sliders[name] = (track: track, thumb: thumb, value: value)
    }

    // MARK: - Touch Handling

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let touch = touches.first else { return }
        let location = touch.location(in: self)
        let tapped = nodes(at: location)

        for node in tapped {
            if node.name == "closeSettings" || node.name == "settingsOverlay" {
                onClose?()
                return
            }

            // Check if touching a thumb
            if let name = node.name, name.hasPrefix("thumb_") {
                activeSlider = name.replacingOccurrences(of: "thumb_", with: "")
                return
            }
        }
    }

    override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let touch = touches.first, let sliderName = activeSlider else { return }
        let location = touch.location(in: self)
        updateSlider(name: sliderName, touchX: location.x)
    }

    override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
        activeSlider = nil
    }

    private func updateSlider(name: String, touchX: CGFloat) {
        let trackWidth: CGFloat = 200
        let minX = -trackWidth / 2
        let maxX = trackWidth / 2

        let clampedX = max(minX, min(maxX, touchX))
        let value = Float((clampedX - minX) / trackWidth)

        guard var slider = sliders[name] else { return }
        slider.thumb.position.x = clampedX
        slider.value = value
        sliders[name] = slider

        // Update value label
        if let valLabel = childNode(withName: "value_\(name)") as? SKLabelNode {
            valLabel.text = "\(Int(value * 100))%"
        }

        // Apply settings
        switch name {
        case "music":
            SettingsMenuNode.current.musicVolume = value
            AudioManager.shared.setMusicVolume(value)
        case "sfx":
            SettingsMenuNode.current.sfxVolume = value
            AudioManager.shared.setSFXVolume(value)
        case "joystick":
            SettingsMenuNode.current.joystickSensitivity = max(0.3, value * 2.0)
        case "textSpeed":
            SettingsMenuNode.current.textSpeed = max(0.5, value * 2.0)
        default:
            break
        }
    }
}
