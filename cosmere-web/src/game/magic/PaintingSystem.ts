import { MagicSystem, MagicResult, emptyResult } from './MagicResult';

const PAINTING_COST = 10;
const STACKING_COST = 8;

interface PaintingTechnique {
  id: string;
  name: string;
  type: 'painting' | 'stacking';
  description: string;
  costMultiplier: number;
}

const TECHNIQUES: PaintingTechnique[] = [
  // Painting techniques
  { id: 'capture', name: 'Capture', type: 'painting', description: 'Emprisonne le cauchemar', costMultiplier: 1 },
  { id: 'banish', name: 'Bannissement', type: 'painting', description: 'Élimine le cauchemar', costMultiplier: 1 },
  { id: 'nightmare_ward', name: 'Garde-Cauchemar', type: 'painting', description: 'Barrière protectrice', costMultiplier: 1 },
  { id: 'ink_slash', name: 'Trait d\'Encre', type: 'painting', description: 'Attaque rapide à l\'encre', costMultiplier: 0.5 },
  { id: 'masterpiece', name: 'Chef-d\'œuvre', type: 'painting', description: 'Ultime — destruction et soins massifs', costMultiplier: 2 },
  // Stone stacking techniques
  { id: 'meditation', name: 'Méditation', type: 'stacking', description: 'Régénération passive', costMultiplier: 1 },
  { id: 'ward', name: 'Garde de Pierre', type: 'stacking', description: 'Bouclier défensif', costMultiplier: 1 },
  { id: 'summon', name: 'Invocation', type: 'stacking', description: 'Invoque un gardien spirituel', costMultiplier: 1 },
  { id: 'convergence', name: 'Convergence', type: 'stacking', description: 'Buff de zone massif', costMultiplier: 1 },
];

export class PaintingSystem implements MagicSystem {
  readonly name = 'Peinture de Cauchemars';
  readonly worldID = 'komashi';

  canUseAbility(abilityID: string, currentInvestiture: number): boolean {
    const technique = TECHNIQUES.find(t => t.id === abilityID);
    if (!technique) return false;
    const baseCost = technique.type === 'painting' ? PAINTING_COST : STACKING_COST;
    const cost = baseCost * technique.costMultiplier;
    return currentInvestiture >= cost;
  }

  useAbility(abilityID: string, spirit: number): MagicResult {
    const technique = TECHNIQUES.find(t => t.id === abilityID);
    const result = emptyResult();

    if (!technique) {
      result.description = 'Technique inconnue';
      return result;
    }

    const baseCost = technique.type === 'painting' ? PAINTING_COST : STACKING_COST;
    result.success = true;
    result.resourceCost = Math.ceil(baseCost * technique.costMultiplier);
    result.resourceType = 'investiture';

    switch (abilityID) {
      // Painting techniques
      case 'capture':
        result.damage = 5;
        result.statusEffect = 'stunned';
        result.statusDuration = 4;
        result.description = 'Cauchemar capturé dans la peinture !';
        break;
      case 'banish':
        result.damage = 30 + spirit * 2;
        result.description = 'Bannissement — le cauchemar se dissipe !';
        break;
      case 'nightmare_ward':
        result.statusEffect = 'shielded';
        result.statusDuration = 8;
        result.description = 'Garde-Cauchemar déployée !';
        break;
      case 'ink_slash':
        result.damage = 14 + spirit;
        result.description = 'Trait d\'encre fulgurant !';
        break;
      case 'masterpiece':
        result.damage = 50 + spirit * 3;
        result.healing = Math.floor(spirit * 3);
        result.statusEffect = 'stunned';
        result.statusDuration = 3;
        result.areaOfEffect = true;
        result.areaRadius = 180;
        result.description = 'Chef-d\'œuvre achevé — destruction totale !';
        break;

      // Stone stacking techniques
      case 'meditation':
        result.healing = Math.floor(spirit * 2);
        result.statusEffect = 'healing';
        result.statusDuration = 5;
        result.description = 'Méditation — les pierres chantent...';
        break;
      case 'ward':
        result.statusEffect = 'shielded';
        result.statusDuration = 10;
        result.description = 'Garde de Pierre érigée !';
        break;
      case 'summon':
        result.statusDuration = 15;
        result.description = 'Gardien spirituel invoqué !';
        break;
      case 'convergence':
        result.healing = 50;
        result.statusEffect = 'healing';
        result.statusDuration = 8;
        result.areaOfEffect = true;
        result.areaRadius = 150;
        result.description = 'Convergence — les pierres chantent à l\'unisson !';
        break;
    }

    return result;
  }

  getAvailableAbilities(): string[] {
    return TECHNIQUES.map(t => t.id);
  }

  getPaintingTechniques(): string[] {
    return TECHNIQUES.filter(t => t.type === 'painting').map(t => t.id);
  }

  getStackingTechniques(): string[] {
    return TECHNIQUES.filter(t => t.type === 'stacking').map(t => t.id);
  }
}
