import { RadiantOrder } from '@/data/types';
import { MagicSystem, MagicResult, emptyResult } from './MagicResult';

const STORMLIGHT_COST = 15;
const TRANSFORMATION_MULTIPLIER = 1.5;

interface SurgeInfo {
  name: string;
  description: string;
}

const SURGES: Record<string, SurgeInfo> = {
  adhesion: { name: 'Adhésion', description: 'Crée un bouclier protecteur' },
  gravitation: { name: 'Gravitation', description: 'Inverse la gravité, permet le vol' },
  abrasion: { name: 'Abrasion', description: 'Réduit la friction, vitesse accrue' },
  progression: { name: 'Progression', description: 'Soigne les blessures' },
  illumination: { name: 'Illumination', description: 'Crée des leurres illusoires' },
  transformation: { name: 'Transformation', description: 'Modifie la matière (Soulcasting)' },
  tension: { name: 'Tension', description: 'Rigidifie le sol, ralentit les ennemis' },
};

const ORDER_SURGES: Record<RadiantOrder, [string, string]> = {
  windrunner: ['adhesion', 'gravitation'],
  lightweaver: ['illumination', 'transformation'],
  bondsmith: ['tension', 'adhesion'],
  edgedancer: ['abrasion', 'progression'],
};

export class SurgebindingSystem implements MagicSystem {
  readonly name = 'Lien des Tempêtes';
  readonly worldID = 'roshar';

  private order: RadiantOrder = 'windrunner';

  setOrder(order: RadiantOrder): void {
    this.order = order;
  }

  getOrder(): RadiantOrder {
    return this.order;
  }

  canUseAbility(abilityID: string, currentInvestiture: number): boolean {
    const surge = abilityID.replace('surge_', '');
    if (!SURGES[surge]) return false;
    const surges = ORDER_SURGES[this.order];
    if (!surges.includes(surge)) return false;
    const cost = surge === 'transformation' ? STORMLIGHT_COST * TRANSFORMATION_MULTIPLIER : STORMLIGHT_COST;
    return currentInvestiture >= cost;
  }

  useAbility(abilityID: string, spirit: number): MagicResult {
    const surge = abilityID.replace('surge_', '');
    const result = emptyResult();

    if (!SURGES[surge]) {
      result.description = 'Surge inconnue';
      return result;
    }

    const surges = ORDER_SURGES[this.order];
    if (!surges.includes(surge)) {
      result.description = `Les ${this.order}s ne maîtrisent pas ${SURGES[surge].name}`;
      return result;
    }

    result.success = true;
    result.resourceCost = surge === 'transformation'
      ? Math.ceil(STORMLIGHT_COST * TRANSFORMATION_MULTIPLIER)
      : STORMLIGHT_COST;
    result.resourceType = 'stormlight';

    switch (surge) {
      case 'adhesion':
        result.statusEffect = 'shielded';
        result.statusDuration = 8;
        result.description = 'Bouclier d\'Adhésion activé !';
        break;
      case 'gravitation':
        result.statusEffect = 'flying';
        result.statusDuration = 6;
        result.description = 'Gravitation inversée !';
        break;
      case 'abrasion':
        result.statusEffect = 'invisible'; // haste effect
        result.statusDuration = 5;
        result.description = 'Friction réduite — vitesse accrue !';
        break;
      case 'progression':
        result.healing = 30 + spirit * 2;
        result.statusEffect = 'healing';
        result.statusDuration = 3;
        result.description = 'Progression — soins appliqués';
        break;
      case 'illumination':
        result.statusEffect = 'invisible';
        result.statusDuration = 10;
        result.description = 'Illusion créée !';
        break;
      case 'transformation':
        result.damage = 25 + spirit;
        result.statusEffect = 'stunned';
        result.statusDuration = 2;
        result.description = 'Soulcasting — transformation !';
        break;
      case 'tension':
        result.statusEffect = 'slowed';
        result.statusDuration = 6;
        result.areaOfEffect = true;
        result.areaRadius = 100;
        result.description = 'Tension — sol rigidifié !';
        break;
    }

    return result;
  }

  getAvailableAbilities(): string[] {
    return ORDER_SURGES[this.order].map(s => `surge_${s}`);
  }

  rechargeFromGem(gemType: 'chip' | 'mark' | 'broam'): number {
    const amounts = { chip: 10, mark: 30, broam: 75 };
    return amounts[gemType];
  }
}
