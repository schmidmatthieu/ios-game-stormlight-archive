import { MagicSystem, MagicResult, emptyResult } from './MagicResult';

interface Heightening {
  threshold: number;
  name: string;
  description: string;
}

const HEIGHTENINGS: Heightening[] = [
  { threshold: 50, name: 'Premier Éveil', description: 'Détecte les auras d\'Investiture' },
  { threshold: 200, name: 'Deuxième Éveil', description: '+15% esquive' },
  { threshold: 600, name: 'Troisième Éveil', description: '+20% dégâts magiques' },
  { threshold: 1000, name: 'Quatrième Éveil', description: 'Sans âge, +30% agilité' },
  { threshold: 2000, name: 'Cinquième Éveil', description: 'Immunité poison, régénération passive' },
];

interface AwakeningCommand {
  id: string;
  name: string;
  breathCost: number;
  description: string;
}

const COMMANDS: AwakeningCommand[] = [
  { id: 'animate_cloth', name: 'Animer Tissu', breathCost: 5, description: 'Invoque un allié de tissu' },
  { id: 'animate_weapon', name: 'Animer Arme', breathCost: 8, description: 'L\'arme combat seule' },
  { id: 'chroma_aura', name: 'Aura Chromatique', breathCost: 3, description: 'Bouclier de couleur' },
  { id: 'lifeleecher', name: 'Drain de Vie', breathCost: 10, description: 'Draine la couleur pour infliger des dégâts et soigner' },
  { id: 'royal_command', name: 'Commandement Royal', breathCost: 15, description: 'Étourdissement massif' },
  { id: 'divine_breath', name: 'Souffle Divin', breathCost: 30, description: 'Ultime — soins ou dégâts massifs' },
];

export class AwakeningSystem implements MagicSystem {
  readonly name = 'Éveil';
  readonly worldID = 'nalthis';

  private breathCount = 0;

  setBreathCount(count: number): void {
    this.breathCount = count;
  }

  getBreathCount(): number {
    return this.breathCount;
  }

  getCurrentHeightening(): Heightening | null {
    let current: Heightening | null = null;
    for (const h of HEIGHTENINGS) {
      if (this.breathCount >= h.threshold) current = h;
    }
    return current;
  }

  getHeighteningBonuses(): { evasionBonus: number; magicDamageBonus: number; agilityBonus: number; regenRate: number } {
    const bonuses = { evasionBonus: 0, magicDamageBonus: 0, agilityBonus: 0, regenRate: 0 };
    if (this.breathCount >= 200) bonuses.evasionBonus = 0.15;
    if (this.breathCount >= 600) bonuses.magicDamageBonus = 0.20;
    if (this.breathCount >= 1000) bonuses.agilityBonus = 0.30;
    if (this.breathCount >= 2000) bonuses.regenRate = 0.02;
    return bonuses;
  }

  canUseAbility(abilityID: string): boolean {
    const cmd = COMMANDS.find(c => c.id === abilityID);
    if (!cmd) return false;
    return this.breathCount >= cmd.breathCost;
  }

  useAbility(abilityID: string, spirit: number): MagicResult {
    const cmd = COMMANDS.find(c => c.id === abilityID);
    const result = emptyResult();

    if (!cmd) {
      result.description = 'Commande d\'Éveil inconnue';
      return result;
    }

    if (this.breathCount < cmd.breathCost) {
      result.description = `Pas assez de Souffles (${this.breathCount}/${cmd.breathCost})`;
      return result;
    }

    this.breathCount -= cmd.breathCost;
    result.success = true;
    result.resourceCost = cmd.breathCost;
    result.resourceType = 'breath';

    switch (abilityID) {
      case 'animate_cloth':
        result.statusEffect = 'shielded';
        result.statusDuration = 20;
        result.description = 'Tissu animé — allié invoqué !';
        break;
      case 'animate_weapon':
        result.damage = 12 + spirit;
        result.statusDuration = 15;
        result.description = 'Arme éveillée — elle combat seule !';
        break;
      case 'chroma_aura':
        result.statusEffect = 'shielded';
        result.statusDuration = 12;
        result.description = 'Aura chromatique activée !';
        break;
      case 'lifeleecher':
        result.damage = 20 + spirit;
        result.healing = Math.floor((20 + spirit) / 3);
        result.statusEffect = 'slowed';
        result.statusDuration = 3;
        result.description = 'Drain de vie — couleurs absorbées !';
        break;
      case 'royal_command':
        result.statusEffect = 'stunned';
        result.statusDuration = 5;
        result.areaOfEffect = true;
        result.areaRadius = 150;
        result.description = 'Commandement Royal — tous s\'immobilisent !';
        break;
      case 'divine_breath':
        result.damage = 60 + spirit * 3;
        result.healing = 999; // full HP restore
        result.statusEffect = 'stunned';
        result.statusDuration = 3;
        result.areaOfEffect = true;
        result.areaRadius = 200;
        result.description = 'Souffle Divin déchaîné !';
        break;
    }

    return result;
  }

  recoverBreaths(amount: number): void {
    this.breathCount += amount;
  }

  getAvailableAbilities(): string[] {
    return COMMANDS.map(c => c.id);
  }
}
