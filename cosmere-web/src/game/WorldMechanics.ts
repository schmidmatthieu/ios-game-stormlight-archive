import { GameManager } from './GameManager';

/**
 * World-specific gameplay mechanics that affect the player.
 * Each world has a passive effect and a periodic event.
 */

// ─── Timer & Balance Constants ──────────────────────────────────
const MIST_TOGGLE_INTERVAL = 8;        // seconds between mist on/off
const MIST_DETECTION_REDUCTION = 0.5;   // detection multiplier when active
const STORMLIGHT_SURGE_INTERVAL = 12;   // seconds between investiture restore
const STORMLIGHT_RESTORE_PCT = 0.15;    // % of max investiture restored
const BREATH_HEAL_INTERVAL = 15;        // seconds between breath healing
const BREATH_HEAL_PCT = 0.05;           // % of max HP healed
const SOLAR_RECHARGE_INTERVAL = 10;     // seconds between solar recharges
const SOLAR_INV_RESTORE_PCT = 0.10;     // % of max investiture restored
const SOLAR_HEAL_PCT = 0.03;            // % of max HP healed
const DOR_CHANNEL_INTERVAL = 5;         // seconds of stillness to charge
const DOR_MAX_CHARGES = 3;
const NIGHTMARE_ESCALATION_INTERVAL = 20; // seconds between threat increases
const NIGHTMARE_MAX_THREAT = 3;
const NIGHTMARE_DAMAGE_PER_LEVEL = 0.15; // damage multiplier per threat level
const COGNITIVE_CONVERSION_INTERVAL = 8;  // seconds between gold→investiture
const COGNITIVE_GOLD_COST = 5;
const COGNITIVE_RESTORE_PCT = 0.12;       // % of max investiture restored

export interface WorldEffect {
  name: string;
  description: string;
  /** Called every frame with delta time. Returns a message if something happens. */
  tick(dt: number): string | null;
  /** Reset state when entering a new zone */
  reset(): void;
}

// ─── Scadrial: Mist Concealment ─────────────────────────────────
// In mist zones, player occasionally becomes partially hidden,
// reducing enemy detection range. Burn metals to boost damage.
class ScadrialMechanics implements WorldEffect {
  name = 'Brumes Protectrices';
  description = 'Les brumes réduisent la portée de détection des ennemis';
  private mistTimer = 0;
  active = false;

  tick(dt: number): string | null {
    this.mistTimer += dt;
    if (this.mistTimer > MIST_TOGGLE_INTERVAL) {
      this.mistTimer = 0;
      this.active = !this.active;
      if (this.active) {
        return '🌫 Les brumes vous enveloppent...';
      } else {
        return '🌫 Les brumes se dissipent.';
      }
    }
    return null;
  }

  reset(): void {
    this.mistTimer = 0;
    this.active = false;
  }

  getDetectionMultiplier(): number {
    return this.active ? MIST_DETECTION_REDUCTION : 1.0;
  }
}

// ─── Roshar: Stormlight Surge ───────────────────────────────────
// Periodic stormlight surges restore investiture.
// During highstorms, enemies are stronger but more XP.
class RosharMechanics implements WorldEffect {
  name = 'Afflux de Lumière d\'Orage';
  description = 'Des afflux périodiques restaurent votre investiture';
  private surgeTimer = 0;

  tick(dt: number): string | null {
    this.surgeTimer += dt;
    if (this.surgeTimer > STORMLIGHT_SURGE_INTERVAL) {
      this.surgeTimer = 0;
      const champ = GameManager.shared.champion;
      if (champ) {
        const restore = Math.floor(GameManager.shared.maxInvestiture * STORMLIGHT_RESTORE_PCT);
        champ.currentInvestiture = Math.min(
          GameManager.shared.maxInvestiture,
          champ.currentInvestiture + restore,
        );
        return `⚡ Afflux de Lumière! +${restore} investiture`;
      }
    }
    return null;
  }

  reset(): void {
    this.surgeTimer = 0;
  }
}

// ─── Nalthis: Color Drain ───────────────────────────────────────
// BioChromatic Breath: talking to NPCs gives bonus XP.
// Periodic color drain effect.
class NalthisMechanics implements WorldEffect {
  name = 'Souffle BioChromique';
  description = 'Parler aux PNJ octroie un bonus d\'XP';
  private breathTimer = 0;

  tick(dt: number): string | null {
    this.breathTimer += dt;
    if (this.breathTimer > BREATH_HEAL_INTERVAL) {
      this.breathTimer = 0;
      const champ = GameManager.shared.champion;
      if (champ) {
        const heal = Math.floor(GameManager.shared.maxHP * BREATH_HEAL_PCT);
        champ.currentHP = Math.min(GameManager.shared.maxHP, champ.currentHP + heal);
        return `🌈 Le Souffle vous régénère. +${heal} PV`;
      }
    }
    return null;
  }

  reset(): void {
    this.breathTimer = 0;
  }
}

// ─── Taldain: Solar Energy ──────────────────────────────────────
// Sand mastery powered by sunlight. Periodic energy bursts.
class TaldainMechanics implements WorldEffect {
  name = 'Énergie Solaire';
  description = 'Le soleil recharge périodiquement vos pouvoirs';
  private solarTimer = 0;

  tick(dt: number): string | null {
    this.solarTimer += dt;
    if (this.solarTimer > SOLAR_RECHARGE_INTERVAL) {
      this.solarTimer = 0;
      const champ = GameManager.shared.champion;
      if (champ) {
        const restore = Math.floor(GameManager.shared.maxInvestiture * SOLAR_INV_RESTORE_PCT);
        champ.currentInvestiture = Math.min(
          GameManager.shared.maxInvestiture,
          champ.currentInvestiture + restore,
        );
        const heal = Math.floor(GameManager.shared.maxHP * SOLAR_HEAL_PCT);
        champ.currentHP = Math.min(GameManager.shared.maxHP, champ.currentHP + heal);
        return `☀ Énergie solaire! +${restore} inv +${heal} PV`;
      }
    }
    return null;
  }

  reset(): void {
    this.solarTimer = 0;
  }
}

// ─── Sel: Aon Resonance ─────────────────────────────────────────
// Dor energy flows. Standing still builds up power for stronger next attack.
class SelMechanics implements WorldEffect {
  name = 'Résonance des Aons';
  description = 'Rester immobile canalise le Dor pour renforcer la prochaine attaque';
  private stillTimer = 0;
  chargedPower = 0;

  tick(dt: number): string | null {
    // This needs external input (player movement) - managed by ZoneScene
    this.stillTimer += dt;
    if (this.stillTimer > DOR_CHANNEL_INTERVAL && this.chargedPower < DOR_MAX_CHARGES) {
      this.stillTimer = 0;
      this.chargedPower++;
      return `✦ Dor canalisé! (${this.chargedPower}/${DOR_MAX_CHARGES})`;
    }
    return null;
  }

  reset(): void {
    this.stillTimer = 0;
    this.chargedPower = 0;
  }

  consumeCharge(): number {
    const bonus = this.chargedPower;
    this.chargedPower = 0;
    return bonus;
  }
}

// ─── Komashi: Nightmare Aura ────────────────────────────────────
// Nightmares grow stronger over time. Killing enemies resets the aura.
class KomashiMechanics implements WorldEffect {
  name = 'Aura des Cauchemars';
  description = 'Les ennemis deviennent plus forts avec le temps. Tuer les réinitialise l\'aura';
  private nightmareTimer = 0;
  threatLevel = 0; // 0-3

  tick(dt: number): string | null {
    this.nightmareTimer += dt;
    if (this.nightmareTimer > NIGHTMARE_ESCALATION_INTERVAL && this.threatLevel < NIGHTMARE_MAX_THREAT) {
      this.nightmareTimer = 0;
      this.threatLevel++;
      return `👁 L'aura des cauchemars s'intensifie! (${this.threatLevel}/${NIGHTMARE_MAX_THREAT})`;
    }
    return null;
  }

  reset(): void {
    this.nightmareTimer = 0;
    this.threatLevel = 0;
  }

  onEnemyKilled(): string | null {
    if (this.threatLevel > 0) {
      this.threatLevel--;
      this.nightmareTimer = 0;
      return `👁 Aura des cauchemars diminuée (${this.threatLevel}/${NIGHTMARE_MAX_THREAT})`;
    }
    return null;
  }

  getDamageMultiplier(): number {
    return 1 + this.threatLevel * NIGHTMARE_DAMAGE_PER_LEVEL;
  }
}

// ─── Shadesmar: Cognitive Realm ─────────────────────────────────
// Bead economy: gold slowly converts to investiture.
class ShadesmarMechanics implements WorldEffect {
  name = 'Royaume Cognitif';
  description = 'L\'or se transforme lentement en investiture';
  private conversionTimer = 0;

  tick(dt: number): string | null {
    this.conversionTimer += dt;
    if (this.conversionTimer > COGNITIVE_CONVERSION_INTERVAL) {
      this.conversionTimer = 0;
      const champ = GameManager.shared.champion;
      if (champ && champ.gold >= COGNITIVE_GOLD_COST && champ.currentInvestiture < GameManager.shared.maxInvestiture) {
        champ.gold -= COGNITIVE_GOLD_COST;
        const restore = Math.floor(GameManager.shared.maxInvestiture * COGNITIVE_RESTORE_PCT);
        champ.currentInvestiture = Math.min(
          GameManager.shared.maxInvestiture,
          champ.currentInvestiture + restore,
        );
        return `💎 Billes converties: -${COGNITIVE_GOLD_COST} or → +${restore} inv`;
      }
    }
    return null;
  }

  reset(): void {
    this.conversionTimer = 0;
  }
}

// ─── Factory ────────────────────────────────────────────────────

const MECHANICS: Record<string, () => WorldEffect> = {
  scadrial: () => new ScadrialMechanics(),
  roshar: () => new RosharMechanics(),
  nalthis: () => new NalthisMechanics(),
  taldain: () => new TaldainMechanics(),
  sel: () => new SelMechanics(),
  komashi: () => new KomashiMechanics(),
  shadesmar: () => new ShadesmarMechanics(),
};

export function createWorldMechanics(worldID: string): WorldEffect {
  const factory = MECHANICS[worldID];
  return factory ? factory() : new ScadrialMechanics();
}

export { ScadrialMechanics, KomashiMechanics, SelMechanics };
