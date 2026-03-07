import SpriteKit

/// Constantes centralisées du jeu — évite les magic numbers dispersés
enum GameConstants {

    // MARK: - Player

    enum Player {
        static let speed: CGFloat = 120
        static let attackRange: CGFloat = 60
    }

    // MARK: - Tiles

    enum Tiles {
        static let size = CGSize(width: 64, height: 32)
    }

    // MARK: - UI Sizes

    enum UI {
        static let minimumTouchTarget: CGFloat = 44
        static let skillSlotSize: CGFloat = 44
        static let inventorySlotSize: CGFloat = 48
        static let abilityButtonRadius: CGFloat = 28
        static let attackButtonRadius: CGFloat = 35
        static let ultimateButtonRadius: CGFloat = 32
    }

    // MARK: - Fonts

    enum Fonts {
        static let hudLabelSize: CGFloat = 11
        static let hudBarValueSize: CGFloat = 10
        static let titleSize: CGFloat = 20
        static let bodySize: CGFloat = 14
        static let captionSize: CGFloat = 10
    }

    // MARK: - HUD

    enum HUD {
        static let barWidth: CGFloat = 140
        static let barHeight: CGFloat = 10
        static let hpBarWidth: CGFloat = 120
        static let hpBarHeight: CGFloat = 12
        static let lowHPThreshold: Double = 0.2
    }

    // MARK: - Regen

    enum Regen {
        static let interval: TimeInterval = 1.0
        static let hpPerSecond: Int = 1
        static let investiturePerSecond: Int = 2
    }

    // MARK: - Combat

    enum Combat {
        static let damagePoolSize = 20
        static let comboTimeout: TimeInterval = 3.0
        static let defaultAttackSpeed: Double = 1.0
        static let defaultCritChance: Double = 0.05
        static let defaultCritMultiplier: Double = 2.0
        static let defaultAttackRange: Double = 1.5
        static let abilityCooldown: TimeInterval = 5.0
    }

    // MARK: - Enemy AI

    enum EnemyAI {
        static let attackCooldown: TimeInterval = 1.5
        static let abilityChance: Double = 0.2
        static let retreatHealthThreshold: Double = 0.15
        static let abilityCooldownDuration: TimeInterval = 10.0
        static let patrolPauseTime: TimeInterval = 1.5
        /// Multiplicateur pour convertir les unités de grille en pixels
        static let gridToPixelScale: CGFloat = 32
        /// Au-delà de 2x la portée de détection, l'ennemi abandonne la poursuite
        static let leashMultiplier: CGFloat = 2.0
    }

    // MARK: - Dialogue

    enum Dialogue {
        static let typingSpeed: TimeInterval = 0.03
        static let boxHeight: CGFloat = 160
        static let maxLines: Int = 4
    }

    // MARK: - Animation

    enum Animation {
        static let menuFadeIn: TimeInterval = 0.2
        static let menuFadeOut: TimeInterval = 0.15
        static let zoneTransitionDuration: TimeInterval = 1.0
        static let joystickReturn: TimeInterval = 0.15
        static let buttonPress: TimeInterval = 0.05
        static let levelUpDuration: TimeInterval = 2.0
    }

    // MARK: - NPC

    enum NPC {
        static let invulnerableHP: Int = 99999
        static let invulnerableDefense: Int = 9999
    }

    // MARK: - Colors

    enum Colors {
        static let gold = SKColor(red: 0.9, green: 0.8, blue: 0.4, alpha: 1.0)
        static let panelBackground = SKColor(red: 0.08, green: 0.06, blue: 0.12, alpha: 0.95)
        static let panelBorder = SKColor(red: 0.5, green: 0.4, blue: 0.2, alpha: 1.0)
        static let hpRed = SKColor(red: 0.8, green: 0.2, blue: 0.2, alpha: 1.0)
        static let investitureBlue = SKColor(red: 0.2, green: 0.5, blue: 0.9, alpha: 1.0)
        static let xpGreen = SKColor(red: 0.4, green: 0.8, blue: 0.3, alpha: 1.0)
        static let healGreen = SKColor(red: 0.3, green: 1.0, blue: 0.3, alpha: 1.0)
        static let lowHPWarning = SKColor(red: 1.0, green: 0.0, blue: 0.0, alpha: 0.3)
    }

    // MARK: - Z-Positions

    enum ZOrder {
        static let worldTile: CGFloat = -100
        static let entities: CGFloat = 50
        static let player: CGFloat = 100
        static let floatingDamage: CGFloat = 500
        static let hud: CGFloat = 2000
        static let controls: CGFloat = 2000
        static let minimap: CGFloat = 4000
        static let dialogue: CGFloat = 5000
        static let overlay: CGFloat = 6000
    }
}
