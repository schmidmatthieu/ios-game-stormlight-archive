// ─── Potion Storage & Quick-Use System ──────────────────────────────

export interface PotionDef {
  id: string;
  name: string;
  description: string;
  color: number;
  icon: string;
  effect: PotionEffect;
  maxStack: number;
}

export interface PotionEffect {
  healPercent?: number;       // % of max HP restored
  investiturePercent?: number; // % of max investiture restored
  statusType?: string;        // Status effect to apply
  statusDuration?: number;    // Duration in seconds
  statusMagnitude?: number;   // Magnitude
}

export interface PotionSlot {
  potionID: string;
  count: number;
}

// ─── Potion Definitions ─────────────────────────────────────────────

export const POTIONS: Record<string, PotionDef> = {
  potion_heal_small: {
    id: 'potion_heal_small', name: 'Potion de soin',
    description: 'Restaure 30% des PV max.',
    color: 0xff4466, icon: '❤',
    effect: { healPercent: 0.30 }, maxStack: 10,
  },
  potion_heal_large: {
    id: 'potion_heal_large', name: 'Grande potion de soin',
    description: 'Restaure 60% des PV max.',
    color: 0xff2244, icon: '❤',
    effect: { healPercent: 0.60 }, maxStack: 5,
  },
  potion_investiture: {
    id: 'potion_investiture', name: 'Potion d\'Investiture',
    description: 'Restaure 40% de l\'Investiture max.',
    color: 0x4488ff, icon: '✦',
    effect: { investiturePercent: 0.40 }, maxStack: 10,
  },
  potion_investiture_large: {
    id: 'potion_investiture_large', name: 'Grande potion d\'Investiture',
    description: 'Restaure 75% de l\'Investiture max.',
    color: 0x2266ff, icon: '✦',
    effect: { investiturePercent: 0.75 }, maxStack: 5,
  },
  potion_strength: {
    id: 'potion_strength', name: 'Élixir de force',
    description: 'Augmente les dégâts de 50% pendant 60s.',
    color: 0xff8844, icon: '⚔',
    effect: { statusType: 'strengthened', statusDuration: 60, statusMagnitude: 1.5 }, maxStack: 5,
  },
  potion_haste: {
    id: 'potion_haste', name: 'Élixir de vitesse',
    description: 'Augmente la vitesse de 40% pendant 45s.',
    color: 0xffcc44, icon: '⚡',
    effect: { statusType: 'haste', statusDuration: 45, statusMagnitude: 1 }, maxStack: 5,
  },
  potion_shield: {
    id: 'potion_shield', name: 'Élixir de protection',
    description: 'Réduit les dégâts reçus de 40% pendant 60s.',
    color: 0x4488cc, icon: '🛡',
    effect: { statusType: 'shielded', statusDuration: 60, statusMagnitude: 2 }, maxStack: 5,
  },
  potion_regen: {
    id: 'potion_regen', name: 'Élixir de régénération',
    description: 'Régénère PV progressivement pendant 90s.',
    color: 0x44ff66, icon: '💚',
    effect: { statusType: 'regenerating', statusDuration: 90, statusMagnitude: 4 }, maxStack: 5,
  },
};

// ─── Potion Manager ─────────────────────────────────────────────────

export class PotionManager {
  private static _instance: PotionManager;
  static get shared(): PotionManager {
    if (!this._instance) this._instance = new PotionManager();
    return this._instance;
  }

  /** 3 quick-slots for combat use */
  slots: [PotionSlot | null, PotionSlot | null, PotionSlot | null] = [null, null, null];

  /** Add potions to inventory (first available matching slot, or first empty) */
  addPotion(potionID: string, count = 1): boolean {
    const def = POTIONS[potionID];
    if (!def) return false;

    // Find existing slot with same potion
    for (let i = 0; i < 3; i++) {
      const slot = this.slots[i];
      if (slot && slot.potionID === potionID) {
        slot.count = Math.min(slot.count + count, def.maxStack);
        this.save();
        return true;
      }
    }

    // Find empty slot
    for (let i = 0; i < 3; i++) {
      if (!this.slots[i]) {
        this.slots[i] = { potionID, count: Math.min(count, def.maxStack) };
        this.save();
        return true;
      }
    }

    return false; // All slots full
  }

  /** Use potion from slot index (0-2) */
  usePotion(slotIndex: number): PotionEffect | null {
    if (slotIndex < 0 || slotIndex > 2) return null;
    const slot = this.slots[slotIndex];
    if (!slot || slot.count <= 0) return null;

    const def = POTIONS[slot.potionID];
    if (!def) return null;

    slot.count--;
    if (slot.count <= 0) {
      this.slots[slotIndex] = null;
    }
    this.save();
    return def.effect;
  }

  getSlotDef(slotIndex: number): PotionDef | null {
    const slot = this.slots[slotIndex];
    if (!slot) return null;
    return POTIONS[slot.potionID] ?? null;
  }

  save(): void {
    localStorage.setItem('cosmere_potions', JSON.stringify(this.slots));
  }

  load(): void {
    const data = localStorage.getItem('cosmere_potions');
    if (data) {
      const parsed = JSON.parse(data);
      this.slots = [parsed[0] ?? null, parsed[1] ?? null, parsed[2] ?? null];
    }
  }
}
