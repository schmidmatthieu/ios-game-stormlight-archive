import { GameManager } from './GameManager';

/**
 * World-specific gameplay mechanics that affect the player.
 * Each world has a passive effect and a periodic event.
 */

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
    if (this.mistTimer > 8) {
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
    return this.active ? 0.5 : 1.0;
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
    if (this.surgeTimer > 12) {
      this.surgeTimer = 0;
      const champ = GameManager.shared.champion;
      if (champ) {
        const restore = Math.floor(GameManager.shared.maxInvestiture * 0.15);
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
    if (this.breathTimer > 15) {
      this.breathTimer = 0;
      const champ = GameManager.shared.champion;
      if (champ) {
        const heal = Math.floor(GameManager.shared.maxHP * 0.05);
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
    if (this.solarTimer > 10) {
      this.solarTimer = 0;
      const champ = GameManager.shared.champion;
      if (champ) {
        const restore = Math.floor(GameManager.shared.maxInvestiture * 0.1);
        champ.currentInvestiture = Math.min(
          GameManager.shared.maxInvestiture,
          champ.currentInvestiture + restore,
        );
        const heal = Math.floor(GameManager.shared.maxHP * 0.03);
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
    if (this.stillTimer > 5 && this.chargedPower < 3) {
      this.stillTimer = 0;
      this.chargedPower++;
      return `✦ Dor canalisé! (${this.chargedPower}/3)`;
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
    if (this.nightmareTimer > 20 && this.threatLevel < 3) {
      this.nightmareTimer = 0;
      this.threatLevel++;
      return `👁 L'aura des cauchemars s'intensifie! (${this.threatLevel}/3)`;
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
      return `👁 Aura des cauchemars diminuée (${this.threatLevel}/3)`;
    }
    return null;
  }

  getDamageMultiplier(): number {
    return 1 + this.threatLevel * 0.15;
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
    if (this.conversionTimer > 8) {
      this.conversionTimer = 0;
      const champ = GameManager.shared.champion;
      if (champ && champ.gold >= 5 && champ.currentInvestiture < GameManager.shared.maxInvestiture) {
        champ.gold -= 5;
        const restore = Math.floor(GameManager.shared.maxInvestiture * 0.12);
        champ.currentInvestiture = Math.min(
          GameManager.shared.maxInvestiture,
          champ.currentInvestiture + restore,
        );
        return `💎 Billes converties: -5 or → +${restore} inv`;
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
