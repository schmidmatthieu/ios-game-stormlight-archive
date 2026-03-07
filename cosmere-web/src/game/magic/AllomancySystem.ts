import { MagicSystem, MagicResult, emptyResult } from './MagicResult';

const METAL_COST = 5;

interface MetalInfo {
  name: string;
  description: string;
}

const METALS: Record<string, MetalInfo> = {
  steel: { name: 'Acier', description: 'Pousse les métaux (projectile)' },
  iron: { name: 'Fer', description: 'Tire les métaux (attraction + étourdissement)' },
  tin: { name: 'Étain', description: 'Amplifie les sens (révèle les ennemis)' },
  pewter: { name: 'Étain', description: 'Force surhumaine (+50% dégâts physiques)' },
  bronze: { name: 'Bronze', description: 'Détecte les pulsations allomantiques' },
  copper: { name: 'Cuivre', description: 'Écran de fumée protecteur (invisibilité)' },
  zinc: { name: 'Zinc', description: 'Attise les émotions (enrage l\'ennemi)' },
  brass: { name: 'Laiton', description: 'Apaise les émotions (calme l\'ennemi)' },
};

export class AllomancySystem implements MagicSystem {
  readonly name = 'Allomancie';
  readonly worldID = 'scadrial';

  canUseAbility(abilityID: string, currentInvestiture: number, resources: Record<string, number>): boolean {
    const metal = abilityID.replace('burn_', '');
    if (!METALS[metal]) return false;
    const reserve = resources[metal] ?? 0;
    return reserve >= 1 && currentInvestiture >= METAL_COST;
  }

  useAbility(abilityID: string, spirit: number, resources: Record<string, number>): MagicResult {
    const metal = abilityID.replace('burn_', '');
    const result = emptyResult();

    if (!METALS[metal]) {
      result.description = 'Métal inconnu';
      return result;
    }

    const reserve = resources[metal] ?? 0;
    if (reserve < 1) {
      result.description = `Pas assez de ${METALS[metal].name}`;
      return result;
    }

    result.success = true;
    result.resourceCost = METAL_COST;
    result.resourceType = metal;

    switch (metal) {
      case 'steel':
        result.damage = 15 + spirit;
        result.description = 'Poussée d\'acier !';
        break;
      case 'iron':
        result.damage = 8 + Math.floor(spirit / 2);
        result.statusEffect = 'stunned';
        result.statusDuration = 2;
        result.description = 'Traction de fer !';
        break;
      case 'tin':
        result.statusEffect = 'revealed';
        result.statusDuration = 10;
        result.description = 'Sens amplifiés par l\'étain';
        break;
      case 'pewter':
        result.statusEffect = 'enraged';
        result.statusDuration = 8;
        result.description = 'Force de l\'étain activée !';
        break;
      case 'bronze':
        result.statusEffect = 'revealed';
        result.statusDuration = 15;
        result.description = 'Pulsations allomantiques détectées';
        result.areaOfEffect = true;
        result.areaRadius = 200;
        break;
      case 'copper':
        result.statusEffect = 'invisible';
        result.statusDuration = 8;
        result.description = 'Nuage de cuivre déployé';
        break;
      case 'zinc':
        result.statusEffect = 'enraged';
        result.statusDuration = 5;
        result.description = 'Émotions attisées !';
        result.areaOfEffect = true;
        result.areaRadius = 120;
        break;
      case 'brass':
        result.statusEffect = 'calmed';
        result.statusDuration = 5;
        result.description = 'Émotions apaisées';
        result.areaOfEffect = true;
        result.areaRadius = 120;
        break;
    }

    return result;
  }

  getAvailableAbilities(): string[] {
    return Object.keys(METALS).map(m => `burn_${m}`);
  }

  refillMetal(metal: string, amount: number, resources: Record<string, number>): void {
    if (METALS[metal]) {
      resources[metal] = (resources[metal] ?? 0) + amount;
    }
  }
}
