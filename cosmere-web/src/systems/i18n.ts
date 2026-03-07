// ─── Internationalization System (FR/EN) ─────────────────────────
// Lightweight i18n with key-based translations and dynamic language switching

const STORAGE_KEY = 'cosmere_locale';

export type Locale = 'fr' | 'en';

// ─── Translation Dictionary ─────────────────────────────────────

const TRANSLATIONS: Record<string, Record<Locale, string>> = {
  // ─── General UI ────────────────────────────────────────────
  'ui.play': { fr: 'Jouer', en: 'Play' },
  'ui.continue': { fr: 'Continuer', en: 'Continue' },
  'ui.back': { fr: 'Retour', en: 'Back' },
  'ui.close': { fr: 'Fermer', en: 'Close' },
  'ui.confirm': { fr: 'Confirmer', en: 'Confirm' },
  'ui.cancel': { fr: 'Annuler', en: 'Cancel' },
  'ui.settings': { fr: 'Paramètres', en: 'Settings' },
  'ui.language': { fr: 'Langue', en: 'Language' },
  'ui.save': { fr: 'Sauvegarder', en: 'Save' },
  'ui.load': { fr: 'Charger', en: 'Load' },
  'ui.quit': { fr: 'Quitter', en: 'Quit' },
  'ui.next': { fr: 'Suivant', en: 'Next' },
  'ui.skip': { fr: 'Passer', en: 'Skip' },
  'ui.yes': { fr: 'Oui', en: 'Yes' },
  'ui.no': { fr: 'Non', en: 'No' },

  // ─── Main Menu ─────────────────────────────────────────────
  'menu.title': { fr: 'Cosmere Chronicles', en: 'Cosmere Chronicles' },
  'menu.subtitle': { fr: 'Chroniques du Cosmere', en: 'Chronicles of the Cosmere' },
  'menu.new_game': { fr: 'Nouvelle Partie', en: 'New Game' },
  'menu.continue_game': { fr: 'Continuer', en: 'Continue' },
  'menu.credits': { fr: 'Crédits', en: 'Credits' },

  // ─── Character Creation ────────────────────────────────────
  'char.create_title': { fr: 'Création de Personnage', en: 'Character Creation' },
  'char.choose_class': { fr: 'Choisissez votre classe', en: 'Choose your class' },
  'char.enter_name': { fr: 'Entrez votre nom', en: 'Enter your name' },
  'char.start': { fr: 'Commencer l\'aventure', en: 'Start the adventure' },

  // ─── Classes ───────────────────────────────────────────────
  'class.mistborn': { fr: 'Brumeux', en: 'Mistborn' },
  'class.radiant': { fr: 'Radieux', en: 'Radiant' },
  'class.awakener': { fr: 'Éveilleur', en: 'Awakener' },
  'class.elantrian': { fr: 'Élantrien', en: 'Elantrian' },
  'class.sandMaster': { fr: 'Maître du Sable', en: 'Sand Master' },
  'class.nightmarePainter': { fr: 'Peintre de Cauchemars', en: 'Nightmare Painter' },

  'class.mistborn.desc': { fr: 'Brûle des métaux pour des pouvoirs physiques et mentaux', en: 'Burns metals for physical and mental powers' },
  'class.radiant.desc': { fr: 'Lié à un spren, maîtrise deux Surges alimentées par la Lumière d\'orage', en: 'Bonded to a spren, masters two Surges fueled by Stormlight' },
  'class.awakener.desc': { fr: 'Anime les objets avec le Souffle et la BioChroma', en: 'Animates objects with Breath and BioChroma' },
  'class.elantrian.desc': { fr: 'Dessine des Aons lumineux pour canaliser le Dor', en: 'Draws luminous Aons to channel the Dor' },
  'class.sandMaster.desc': { fr: 'Contrôle le sable blanc de Dayside grâce à l\'énergie solaire', en: 'Controls Dayside white sand using solar energy' },
  'class.nightmarePainter.desc': { fr: 'Capture et bannit les cauchemars par la peinture', en: 'Captures and banishes nightmares through painting' },

  // ─── HUD ───────────────────────────────────────────────────
  'hud.hp': { fr: 'PV', en: 'HP' },
  'hud.investiture': { fr: 'Investiture', en: 'Investiture' },
  'hud.xp': { fr: 'XP', en: 'XP' },
  'hud.level': { fr: 'Niv.', en: 'Lv.' },
  'hud.gold': { fr: 'Or', en: 'Gold' },

  // ─── Combat ────────────────────────────────────────────────
  'combat.attack': { fr: 'Attaquer', en: 'Attack' },
  'combat.dodge': { fr: 'Esquiver', en: 'Dodge' },
  'combat.block': { fr: 'Bloquer', en: 'Block' },
  'combat.crit': { fr: 'Critique !', en: 'Critical!' },
  'combat.miss': { fr: 'Raté', en: 'Miss' },
  'combat.kill_streak_3': { fr: 'Triple Kill !', en: 'Triple Kill!' },
  'combat.kill_streak_5': { fr: 'Quintuple !', en: 'Quintuple!' },
  'combat.kill_streak_7': { fr: 'Massacre !', en: 'Massacre!' },
  'combat.kill_streak_10': { fr: 'Carnage !', en: 'Carnage!' },
  'combat.kill_streak_15': { fr: 'INARRÊTABLE !', en: 'UNSTOPPABLE!' },

  // ─── Death ─────────────────────────────────────────────────
  'death.title': { fr: 'VOUS ÊTES TOMBÉ', en: 'YOU HAVE FALLEN' },
  'death.respawn': { fr: 'Réapparaître', en: 'Respawn' },
  'death.gold_lost': { fr: 'Or perdu', en: 'Gold lost' },
  'death.xp_lost': { fr: 'XP perdu', en: 'XP lost' },

  // ─── Inventory ─────────────────────────────────────────────
  'inv.title': { fr: 'Inventaire', en: 'Inventory' },
  'inv.equip': { fr: 'Équiper', en: 'Equip' },
  'inv.unequip': { fr: 'Retirer', en: 'Unequip' },
  'inv.sell': { fr: 'Vendre', en: 'Sell' },
  'inv.empty': { fr: 'Inventaire vide', en: 'Empty inventory' },

  // ─── Shop ──────────────────────────────────────────────────
  'shop.title': { fr: 'Boutique', en: 'Shop' },
  'shop.buy': { fr: 'Acheter', en: 'Buy' },
  'shop.sell': { fr: 'Vendre', en: 'Sell' },
  'shop.not_enough_gold': { fr: 'Or insuffisant', en: 'Not enough gold' },

  // ─── Quests ────────────────────────────────────────────────
  'quest.journal': { fr: 'Journal de Quêtes', en: 'Quest Journal' },
  'quest.active': { fr: 'Quêtes actives', en: 'Active Quests' },
  'quest.completed': { fr: 'Quêtes terminées', en: 'Completed Quests' },
  'quest.available': { fr: 'Quêtes disponibles', en: 'Available Quests' },
  'quest.complete': { fr: 'Quête terminée !', en: 'Quest Complete!' },
  'quest.new': { fr: 'Nouvelle quête', en: 'New Quest' },
  'quest.hidden_discovered': { fr: 'Quête secrète découverte', en: 'Secret quest discovered' },
  'quest.hidden_completed': { fr: 'Quête secrète complétée', en: 'Secret quest completed' },

  // ─── Crafting ──────────────────────────────────────────────
  'craft.title': { fr: 'Atelier d\'Artisanat', en: 'Crafting Workshop' },
  'craft.potions': { fr: 'Potions', en: 'Potions' },
  'craft.enchant': { fr: 'Enchant.', en: 'Enchant' },
  'craft.create': { fr: 'Créer', en: 'Create' },
  'craft.no_enchant': { fr: 'Aucun enchantement disponible', en: 'No enchantments available' },

  // ─── Forge ─────────────────────────────────────────────────
  'forge.title': { fr: 'Forge', en: 'Forge' },
  'forge.enhance': { fr: 'Améliorer', en: 'Enhance' },
  'forge.enchant': { fr: 'Enchanter', en: 'Enchant' },
  'forge.reforge': { fr: 'Reforger', en: 'Reforge' },
  'forge.success': { fr: 'Amélioration réussie !', en: 'Enhancement successful!' },
  'forge.failed': { fr: 'Amélioration échouée...', en: 'Enhancement failed...' },
  'forge.max_level': { fr: 'Niveau maximum atteint', en: 'Maximum level reached' },

  // ─── Pause ─────────────────────────────────────────────────
  'pause.title': { fr: 'Pause', en: 'Paused' },
  'pause.resume': { fr: 'Reprendre', en: 'Resume' },
  'pause.save_quit': { fr: 'Sauver et quitter', en: 'Save & Quit' },

  // ─── Map & Navigation ─────────────────────────────────────
  'map.secret_found': { fr: 'Zone secrète découverte !', en: 'Secret area discovered!' },
  'map.zone_transition': { fr: 'Chargement...', en: 'Loading...' },

  // ─── NPC ───────────────────────────────────────────────────
  'npc.talk': { fr: 'Parler', en: 'Talk' },
  'npc.shop': { fr: 'Ouvrir la boutique', en: 'Open shop' },

  // ─── Tutorial ──────────────────────────────────────────────
  'tutorial.welcome': { fr: 'Bienvenue, Salteur !', en: 'Welcome, Worldhopper!' },
  'tutorial.movement': { fr: 'Déplacez-vous avec le joystick', en: 'Move with the joystick' },
  'tutorial.combat': { fr: 'Attaquez les ennemis', en: 'Attack enemies' },
  'tutorial.skills': { fr: 'Utilisez vos compétences', en: 'Use your skills' },

  // ─── New Game+ ─────────────────────────────────────────────
  'ngplus.label': { fr: 'New Game+', en: 'New Game+' },
  'ngplus.start': { fr: 'Commencer le New Game+', en: 'Start New Game+' },
  'ngplus.difficulty': { fr: 'Difficulté augmentée', en: 'Increased difficulty' },

  // ─── Stats ─────────────────────────────────────────────────
  'stat.vigor': { fr: 'Vigueur', en: 'Vigor' },
  'stat.investiture': { fr: 'Investiture', en: 'Investiture' },
  'stat.strength': { fr: 'Force', en: 'Strength' },
  'stat.agility': { fr: 'Agilité', en: 'Agility' },
  'stat.spirit': { fr: 'Esprit', en: 'Spirit' },
  'stat.luck': { fr: 'Chance', en: 'Luck' },

  // ─── Rarity ────────────────────────────────────────────────
  'rarity.common': { fr: 'Commun', en: 'Common' },
  'rarity.uncommon': { fr: 'Peu commun', en: 'Uncommon' },
  'rarity.rare': { fr: 'Rare', en: 'Rare' },
  'rarity.epic': { fr: 'Épique', en: 'Epic' },
  'rarity.legendary': { fr: 'Légendaire', en: 'Legendary' },
  'rarity.cosmeric': { fr: 'Cosmérique', en: 'Cosmeric' },

  // ─── Leaderboard ───────────────────────────────────────────
  'leaderboard.title': { fr: 'Classement', en: 'Leaderboard' },
  'leaderboard.rank': { fr: 'Rang', en: 'Rank' },
  'leaderboard.score': { fr: 'Score', en: 'Score' },
  'leaderboard.player': { fr: 'Joueur', en: 'Player' },

  // ─── Environment ───────────────────────────────────────────
  'env.lever': { fr: 'Actionner le levier', en: 'Pull lever' },
  'env.breakable': { fr: 'Briser', en: 'Break' },
  'env.obelisk': { fr: 'Examiner', en: 'Examine' },
  'env.push_block': { fr: 'Pousser', en: 'Push' },
  'env.spike_trap': { fr: 'Piège à pointes !', en: 'Spike trap!' },
  'env.poison_vent': { fr: 'Vapeur empoisonnée !', en: 'Poison vent!' },

  // ─── Worlds ────────────────────────────────────────────────
  'world.scadrial': { fr: 'Scadrial', en: 'Scadrial' },
  'world.roshar': { fr: 'Roshar', en: 'Roshar' },
  'world.taldain': { fr: 'Taldain', en: 'Taldain' },
  'world.komashi': { fr: 'Komashi', en: 'Komashi' },
  'world.nalthis': { fr: 'Nalthis', en: 'Nalthis' },
  'world.sel': { fr: 'Sel', en: 'Sel' },
  'world.shadesmar': { fr: 'Shadesmar', en: 'Shadesmar' },
};

// ─── i18n Manager ───────────────────────────────────────────────

class I18nManager {
  private locale: Locale;

  constructor() {
    this.locale = (localStorage.getItem(STORAGE_KEY) as Locale) || 'fr';
  }

  get currentLocale(): Locale { return this.locale; }

  setLocale(locale: Locale): void {
    this.locale = locale;
    localStorage.setItem(STORAGE_KEY, locale);
  }

  /** Get translation for a key. Returns key if not found. */
  t(key: string, params?: Record<string, string | number>): string {
    const entry = TRANSLATIONS[key];
    let text = entry?.[this.locale] ?? entry?.fr ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(`{${k}}`, String(v));
      }
    }
    return text;
  }

  /** Get all available locales */
  getLocales(): { code: Locale; name: string }[] {
    return [
      { code: 'fr', name: 'Français' },
      { code: 'en', name: 'English' },
    ];
  }

  /** Toggle between locales */
  toggleLocale(): Locale {
    this.setLocale(this.locale === 'fr' ? 'en' : 'fr');
    return this.locale;
  }

  /** Check if a translation key exists */
  has(key: string): boolean {
    return key in TRANSLATIONS;
  }
}

/** Global i18n instance */
export const i18n = new I18nManager();

/** Shorthand translation function */
export function t(key: string, params?: Record<string, string | number>): string {
  return i18n.t(key, params);
}
