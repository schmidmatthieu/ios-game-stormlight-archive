import { MagicSystem, MagicResult, emptyResult } from './MagicResult';

const SAND_COST = 12;
const STORM_COST_MULTIPLIER = 2;

interface SandForm {
  id: string;
  name: string;
  description: string;
}

const SAND_FORMS: SandForm[] = [
  { id: 'lash', name: 'Fouet de Sable', description: 'Attaque directionnelle en fouet' },
  { id: 'shield', name: 'Bouclier de Sable', description: 'Mur protecteur de sable' },
  { id: 'swarm', name: 'Essaim de Sable', description: 'Nuée de sable en zone' },
  { id: 'platform', name: 'Plateforme de Sable', description: 'Élévation — permet le vol' },
  { id: 'spike', name: 'Pics de Sable', description: 'Pièges de sable au sol' },
  { id: 'storm', name: 'Tempête de Sable', description: 'Ultime — tempête dévastatrice' },
];

export class SandMasterySystem implements MagicSystem {
  readonly name = 'Maîtrise du Sable';
  readonly worldID = 'taldain';

  private hydration = 100;

  getHydration(): number {
    return this.hydration;
  }

  setHydration(value: number): void {
    this.hydration = Math.max(0, Math.min(100, value));
  }

  drinkWater(amount: number): void {
    this.hydration = Math.min(100, this.hydration + amount);
  }

  canUseAbility(abilityID: string, currentInvestiture: number): boolean {
    const form = abilityID.replace('sand_', '');
    const sandForm = SAND_FORMS.find(f => f.id === form);
    if (!sandForm) return false;
    const cost = form === 'storm' ? SAND_COST * STORM_COST_MULTIPLIER : SAND_COST;
    return currentInvestiture >= cost && this.hydration > 0;
  }

  useAbility(abilityID: string, spirit: number): MagicResult {
    const form = abilityID.replace('sand_', '');
    const sandForm = SAND_FORMS.find(f => f.id === form);
    const result = emptyResult();

    if (!sandForm) {
      result.description = 'Forme de sable inconnue';
      return result;
    }

    const cost = form === 'storm' ? SAND_COST * STORM_COST_MULTIPLIER : SAND_COST;

    if (this.hydration <= 0) {
      result.description = 'Déshydraté — buvez de l\'eau !';
      return result;
    }

    // Sand mastery consumes hydration
    this.hydration = Math.max(0, this.hydration - (form === 'storm' ? 25 : 10));

    result.success = true;
    result.resourceCost = cost;
    result.resourceType = 'investiture';

    switch (form) {
      case 'lash':
        result.damage = 18 + spirit;
        result.description = 'Fouet de sable !';
        break;
      case 'shield':
        result.statusEffect = 'shielded';
        result.statusDuration = 6;
        result.description = 'Bouclier de sable déployé !';
        break;
      case 'swarm':
        result.damage = 12 + Math.floor(spirit / 2);
        result.statusEffect = 'burning';
        result.statusDuration = 4;
        result.areaOfEffect = true;
        result.areaRadius = 100;
        result.description = 'Essaim de sable !';
        break;
      case 'platform':
        result.statusEffect = 'flying';
        result.statusDuration = 5;
        result.description = 'Plateforme de sable — élévation !';
        break;
      case 'spike':
        result.damage = 22 + spirit;
        result.statusEffect = 'stunned';
        result.statusDuration = 2;
        result.description = 'Pics de sable jaillis du sol !';
        break;
      case 'storm':
        result.damage = 40 + spirit * 2;
        result.statusEffect = 'slowed';
        result.statusDuration = 6;
        result.areaOfEffect = true;
        result.areaRadius = 200;
        result.description = 'Tempête de sable déchaînée !';
        break;
    }

    return result;
  }

  getAvailableAbilities(): string[] {
    return SAND_FORMS.map(f => `sand_${f.id}`);
  }
}
