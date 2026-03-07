import { MagicSystem, MagicResult, emptyResult } from './MagicResult';

const AON_COST = 10;
const COMBINATION_COST = 20;

interface AonInfo {
  name: string;
  description: string;
  color: number;
}

const AONS: Record<string, AonInfo> = {
  rao: { name: 'Aon Rao', description: 'Explosion de lumière', color: 0xFFD700 },
  ashe: { name: 'Aon Ashe', description: 'Bouclier lumineux', color: 0x00FFFF },
  tia: { name: 'Aon Tia', description: 'Téléportation', color: 0x9B59B6 },
  ien: { name: 'Aon Ien', description: 'Soins', color: 0x2ECC71 },
  daa: { name: 'Aon Daa', description: 'Boost de puissance', color: 0xFF8C00 },
  ela: { name: 'Aon Ela', description: 'Concentration et précision', color: 0x87CEEB },
  ehe: { name: 'Aon Ehe', description: 'Feu', color: 0xFF4500 },
  are: { name: 'Aon Are', description: 'Lien d\'unité', color: 0xFFFF00 },
};

interface AonCombination {
  aons: [string, string];
  name: string;
  damageMultiplier: number;
  description: string;
}

const COMBINATIONS: AonCombination[] = [
  { aons: ['rao', 'ehe'], name: 'Feu sacré', damageMultiplier: 2.0, description: 'Explosion de feu sacré !' },
  { aons: ['ashe', 'daa'], name: 'Bouclier offensif', damageMultiplier: 0.5, description: 'Bouclier qui reflète les dégâts !' },
  { aons: ['ien', 'are'], name: 'Soin de zone', damageMultiplier: 0, description: 'Vague de soins unificatrice !' },
  { aons: ['tia', 'ela'], name: 'Frappe de précision', damageMultiplier: 1.5, description: 'Téléportation + frappe précise !' },
  { aons: ['ehe', 'rao'], name: 'Pilier divin', damageMultiplier: 2.5, description: 'Pilier de feu divin !' },
];

export class AonDorSystem implements MagicSystem {
  readonly name = 'AonDor';
  readonly worldID = 'sel';

  private drawnAons: string[] = [];

  canUseAbility(abilityID: string, currentInvestiture: number): boolean {
    const aon = abilityID.replace('aon_', '');
    if (!AONS[aon]) return false;
    const cost = this.drawnAons.length > 0 ? COMBINATION_COST : AON_COST;
    return currentInvestiture >= cost;
  }

  useAbility(abilityID: string, spirit: number): MagicResult {
    const aon = abilityID.replace('aon_', '');
    const result = emptyResult();

    if (!AONS[aon]) {
      result.description = 'Aon inconnu';
      return result;
    }

    // Check for combination
    if (this.drawnAons.length > 0) {
      const previousAon = this.drawnAons[0];
      this.drawnAons = [];
      return this.useCombination(previousAon, aon, spirit);
    }

    // Single aon usage
    this.drawnAons = [];
    result.success = true;
    result.resourceCost = AON_COST;
    result.resourceType = 'investiture';

    switch (aon) {
      case 'rao':
        result.damage = 22 + spirit;
        result.areaOfEffect = true;
        result.areaRadius = 120;
        result.description = 'Aon Rao — explosion de lumière !';
        break;
      case 'ashe':
        result.statusEffect = 'shielded';
        result.statusDuration = 10;
        result.description = 'Aon Ashe — bouclier lumineux !';
        break;
      case 'tia':
        result.description = 'Aon Tia — téléportation !';
        break;
      case 'ien':
        result.healing = 25 + spirit * 2;
        result.description = 'Aon Ien — soins !';
        break;
      case 'daa':
        result.statusEffect = 'enraged'; // power buff
        result.statusDuration = 8;
        result.description = 'Aon Daa — puissance accrue !';
        break;
      case 'ela':
        result.statusEffect = 'revealed'; // precision
        result.statusDuration = 12;
        result.description = 'Aon Ela — concentration parfaite !';
        break;
      case 'ehe':
        result.damage = 18 + spirit;
        result.statusEffect = 'burning';
        result.statusDuration = 4;
        result.description = 'Aon Ehe — flammes !';
        break;
      case 'are':
        result.statusDuration = 15;
        result.description = 'Aon Are — lien d\'unité !';
        break;
    }

    return result;
  }

  startCombination(aonID: string): void {
    const aon = aonID.replace('aon_', '');
    if (AONS[aon]) {
      this.drawnAons = [aon];
    }
  }

  private useCombination(aon1: string, aon2: string, spirit: number): MagicResult {
    const result = emptyResult();
    result.success = true;
    result.resourceCost = COMBINATION_COST;
    result.resourceType = 'investiture';

    const combo = COMBINATIONS.find(
      c => (c.aons[0] === aon1 && c.aons[1] === aon2) || (c.aons[0] === aon2 && c.aons[1] === aon1)
    );

    if (combo) {
      const baseDamage = 22 + spirit;
      result.damage = Math.floor(baseDamage * combo.damageMultiplier);
      result.description = combo.description;
      result.areaOfEffect = true;
      result.areaRadius = 150;

      if (combo.aons.includes('ehe') || combo.name === 'Feu sacré') {
        result.statusEffect = 'burning';
        result.statusDuration = 4;
      }
      if (combo.name === 'Bouclier offensif') {
        result.statusEffect = 'shielded';
        result.statusDuration = 8;
      }
      if (combo.name === 'Soin de zone') {
        result.damage = 0;
        result.healing = 30 + spirit * 2;
        result.statusEffect = 'healing';
        result.statusDuration = 5;
      }
      if (combo.name === 'Frappe de précision') {
        result.statusEffect = 'stunned';
        result.statusDuration = 2;
      }
    } else {
      // Unknown combination — weaker unstable effect
      result.damage = 8 + Math.floor(spirit / 2);
      result.description = 'Combinaison instable — effet réduit';
    }

    return result;
  }

  getAonColor(aonID: string): number {
    const aon = aonID.replace('aon_', '');
    return AONS[aon]?.color ?? 0xFFFFFF;
  }

  getAvailableAbilities(): string[] {
    return Object.keys(AONS).map(a => `aon_${a}`);
  }
}
