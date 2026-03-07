import { gameData } from '../data/DataLoader';
import { GameManager } from './GameManager';
import type { EquipmentLoadout, Item, ChampionStats } from '../data/types';

// ─── Equipment Set Bonus System ─────────────────────────────────

export interface SetBonus {
  piecesRequired: number;
  label: string;
  stats: Partial<ChampionStats>;
  special?: string; // Description of special effect
}

export interface EquipmentSetDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: number;
  worldOrigin: string;
  itemIDs: string[];  // Items belonging to this set
  bonuses: SetBonus[];
}

const EQUIPMENT_SETS: EquipmentSetDef[] = [
  {
    id: 'shardplate',
    name: 'Armure Esquissée',
    description: 'L\'armure des Chevaliers Radieux restaurée.',
    icon: '🛡', color: 0x5599dd, worldOrigin: 'roshar',
    itemIDs: ['shardplate_helm', 'shardplate_chest', 'shardplate_gauntlets', 'shardplate_greaves', 'shardblade'],
    bonuses: [
      { piecesRequired: 2, label: '2 pièces', stats: { vigor: 15 } },
      { piecesRequired: 3, label: '3 pièces', stats: { vigor: 30, spirit: 10 }, special: 'Régénération de Lumiétempête améliorée' },
      { piecesRequired: 5, label: '5 pièces', stats: { vigor: 50, spirit: 25, strength: 15 }, special: 'Bouclier de Plaque : absorbe 10% des dégâts' },
    ],
  },
  {
    id: 'mistcloak',
    name: 'Tenue de Brume',
    description: 'L\'équipement complet d\'un Fils-des-brumes.',
    icon: '🌫', color: 0x8888aa, worldOrigin: 'scadrial',
    itemIDs: ['mistcloak_hood', 'mistcloak_cape', 'mistcloak_vest', 'allomantic_belt', 'glass_daggers'],
    bonuses: [
      { piecesRequired: 2, label: '2 pièces', stats: { agility: 10 } },
      { piecesRequired: 3, label: '3 pièces', stats: { agility: 20, luck: 10 }, special: 'Esquive accrue dans la brume' },
      { piecesRequired: 5, label: '5 pièces', stats: { agility: 35, luck: 20, strength: 10 }, special: 'Poussée d\'Acier : dégâts de zone périodiques' },
    ],
  },
  {
    id: 'royal_locks',
    name: 'Parure Royale',
    description: 'Vêtements imprégnés de Souffles multiples.',
    icon: '🌈', color: 0xee77cc, worldOrigin: 'nalthis',
    itemIDs: ['royal_tiara', 'awakened_robes', 'chromatic_gloves', 'breath_sash', 'nightblood_sheath'],
    bonuses: [
      { piecesRequired: 2, label: '2 pièces', stats: { investiture: 15 } },
      { piecesRequired: 3, label: '3 pièces', stats: { investiture: 30, strength: 10 }, special: 'Éveilleur : régénération d\'Investiture accélérée' },
      { piecesRequired: 5, label: '5 pièces', stats: { investiture: 50, strength: 20, luck: 15 }, special: 'Souffle Divin : bonus de dégâts de 15%' },
    ],
  },
  {
    id: 'elantrian',
    name: 'Reliques d\'Elantris',
    description: 'Artefacts anciens de la cité dorée.',
    icon: '✨', color: 0xddaa44, worldOrigin: 'sel',
    itemIDs: ['aon_crown', 'golden_mantle', 'elantrian_bracers', 'seon_pendant', 'dor_staff'],
    bonuses: [
      { piecesRequired: 2, label: '2 pièces', stats: { investiture: 10, vigor: 10 } },
      { piecesRequired: 3, label: '3 pièces', stats: { investiture: 25, vigor: 20 }, special: 'Aon Ien : soin passif amélioré' },
      { piecesRequired: 5, label: '5 pièces', stats: { investiture: 40, vigor: 35, spirit: 15 }, special: 'Puissance du Dor : toutes les compétences renforcées' },
    ],
  },
  {
    id: 'sand_master',
    name: 'Maître du Sable',
    description: 'Équipement traditionnel des Maîtres du Sable de Taldain.',
    icon: '🏜', color: 0xddbb44, worldOrigin: 'taldain',
    itemIDs: ['sand_helm', 'desert_mantle', 'sand_wraps', 'sandstone_belt', 'sand_whip'],
    bonuses: [
      { piecesRequired: 2, label: '2 pièces', stats: { agility: 8, strength: 8 } },
      { piecesRequired: 3, label: '3 pièces', stats: { agility: 18, strength: 18 }, special: 'Maîtrise du Sable : portée des compétences accrue' },
      { piecesRequired: 5, label: '5 pièces', stats: { agility: 30, strength: 30, luck: 10 }, special: 'Tempête de Sable : dégâts de zone continus' },
    ],
  },
  {
    id: 'cognitive_shadow',
    name: 'Ombre Cognitive',
    description: 'Fragments récoltés dans les profondeurs de Shadesmar.',
    icon: '🔮', color: 0x7744bb, worldOrigin: 'shadesmar',
    itemIDs: ['shadow_mask', 'cognitive_robe', 'bead_bracelet', 'spren_ring', 'perpendicularity_orb'],
    bonuses: [
      { piecesRequired: 2, label: '2 pièces', stats: { luck: 15 } },
      { piecesRequired: 3, label: '3 pièces', stats: { luck: 25, investiture: 15 }, special: 'Vision Cognitive : détection des ennemis étendue' },
      { piecesRequired: 5, label: '5 pièces', stats: { luck: 40, investiture: 30, spirit: 10 }, special: 'Transcendance : chance de résurrection à la mort' },
    ],
  },
];

// ─── Equipment Set Manager ──────────────────────────────────────

export class EquipmentSetManager {
  private static _instance: EquipmentSetManager;
  static get shared(): EquipmentSetManager {
    if (!this._instance) this._instance = new EquipmentSetManager();
    return this._instance;
  }

  getAllSets(): EquipmentSetDef[] {
    return EQUIPMENT_SETS;
  }

  getSetByID(id: string): EquipmentSetDef | undefined {
    return EQUIPMENT_SETS.find(s => s.id === id);
  }

  /** Count how many pieces of a given set the player has equipped */
  countEquippedPieces(setDef: EquipmentSetDef): number {
    const champ = GameManager.shared.champion;
    if (!champ) return 0;

    const equipped = this.getEquippedItemIDs(champ.equipment);
    return setDef.itemIDs.filter(id => equipped.includes(id)).length;
  }

  /** Get all active set bonuses for current equipment */
  getActiveBonuses(): { set: EquipmentSetDef; bonus: SetBonus; piecesEquipped: number }[] {
    const result: { set: EquipmentSetDef; bonus: SetBonus; piecesEquipped: number }[] = [];

    for (const setDef of EQUIPMENT_SETS) {
      const count = this.countEquippedPieces(setDef);
      if (count < 2) continue;

      // Find highest qualifying bonus
      const qualifying = setDef.bonuses
        .filter(b => count >= b.piecesRequired)
        .sort((a, b) => b.piecesRequired - a.piecesRequired);

      if (qualifying.length > 0) {
        result.push({ set: setDef, bonus: qualifying[0], piecesEquipped: count });
      }
    }

    return result;
  }

  /** Get total stat bonuses from all active sets */
  getTotalSetStats(): Partial<ChampionStats> {
    const totals: Partial<ChampionStats> = {};
    for (const { bonus } of this.getActiveBonuses()) {
      for (const [key, value] of Object.entries(bonus.stats)) {
        const k = key as keyof ChampionStats;
        totals[k] = (totals[k] ?? 0) + (value as number);
      }
    }
    return totals;
  }

  /** Check if an item belongs to any set */
  getItemSet(itemID: string): EquipmentSetDef | null {
    return EQUIPMENT_SETS.find(s => s.itemIDs.includes(itemID)) ?? null;
  }

  private getEquippedItemIDs(eq: EquipmentLoadout): string[] {
    return Object.values(eq).filter((v): v is string => v !== null);
  }
}
