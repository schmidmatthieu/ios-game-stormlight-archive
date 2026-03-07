import { MagicSystemType, ChampionClass, RadiantOrder } from '@/data/types';
import { MagicSystem, MagicResult, emptyResult } from './MagicResult';
import { AllomancySystem } from './AllomancySystem';
import { SurgebindingSystem } from './SurgebindingSystem';
import { AwakeningSystem } from './AwakeningSystem';
import { AonDorSystem } from './AonDorSystem';
import { SandMasterySystem } from './SandMasterySystem';
import { PaintingSystem } from './PaintingSystem';

const CLASS_TO_MAGIC: Record<ChampionClass, MagicSystemType> = {
  mistborn: 'allomancy',
  radiant: 'surgebinding',
  awakener: 'awakening',
  elantrian: 'aonDor',
  sandMaster: 'sandMastery',
  nightmarePainter: 'painting',
};

export class MagicSystemManager {
  private systems: Record<MagicSystemType, MagicSystem>;
  private activeSystem: MagicSystemType;

  constructor(championClass: ChampionClass, radiantOrder?: RadiantOrder) {
    const allomancy = new AllomancySystem();
    const surgebinding = new SurgebindingSystem();
    const awakening = new AwakeningSystem();
    const aonDor = new AonDorSystem();
    const sandMastery = new SandMasterySystem();
    const painting = new PaintingSystem();

    if (radiantOrder) {
      surgebinding.setOrder(radiantOrder);
    }

    this.systems = {
      allomancy,
      surgebinding,
      awakening,
      aonDor,
      sandMastery,
      painting,
    };

    this.activeSystem = CLASS_TO_MAGIC[championClass];
  }

  getActiveSystem(): MagicSystem {
    return this.systems[this.activeSystem];
  }

  getActiveSystemType(): MagicSystemType {
    return this.activeSystem;
  }

  setActiveSystem(type: MagicSystemType): void {
    this.activeSystem = type;
  }

  getSystem(type: MagicSystemType): MagicSystem {
    return this.systems[type];
  }

  canUseAbility(abilityID: string, currentInvestiture: number, resources: Record<string, number>): boolean {
    return this.getActiveSystem().canUseAbility(abilityID, currentInvestiture, resources);
  }

  useAbility(abilityID: string, spirit: number, resources: Record<string, number>): MagicResult {
    return this.getActiveSystem().useAbility(abilityID, spirit, resources);
  }

  getAvailableAbilities(): string[] {
    return this.getActiveSystem().getAvailableAbilities();
  }

  // Specific system accessors
  getAllomancy(): AllomancySystem {
    return this.systems.allomancy as AllomancySystem;
  }

  getSurgebinding(): SurgebindingSystem {
    return this.systems.surgebinding as SurgebindingSystem;
  }

  getAwakening(): AwakeningSystem {
    return this.systems.awakening as AwakeningSystem;
  }

  getAonDor(): AonDorSystem {
    return this.systems.aonDor as AonDorSystem;
  }

  getSandMastery(): SandMasterySystem {
    return this.systems.sandMastery as SandMasterySystem;
  }

  getPainting(): PaintingSystem {
    return this.systems.painting as PaintingSystem;
  }
}

export type { MagicResult, MagicSystem } from './MagicResult';
