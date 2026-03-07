import { StatusEffectType } from '@/data/types';

export interface MagicResult {
  success: boolean;
  description: string;
  damage: number;
  healing: number;
  statusEffect: StatusEffectType | null;
  statusDuration: number;
  resourceCost: number;
  resourceType: string;
  areaOfEffect: boolean;
  areaRadius: number;
}

export function emptyResult(): MagicResult {
  return {
    success: false,
    description: '',
    damage: 0,
    healing: 0,
    statusEffect: null,
    statusDuration: 0,
    resourceCost: 0,
    resourceType: 'investiture',
    areaOfEffect: false,
    areaRadius: 0,
  };
}

export interface MagicSystem {
  readonly name: string;
  readonly worldID: string;
  canUseAbility(abilityID: string, currentInvestiture: number, resources: Record<string, number>): boolean;
  useAbility(abilityID: string, spirit: number, resources: Record<string, number>): MagicResult;
  getAvailableAbilities(): string[];
}
