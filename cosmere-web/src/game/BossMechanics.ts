import { Container, Graphics, Text, TextStyle } from 'pixi.js';

export interface BossPhase {
  name: string;
  hpThreshold: number; // 0-1, triggers when HP% drops below this
  damageMultiplier: number;
  speedMultiplier: number;
  specialAttack: string;
  specialAttackCooldown: number;
  message: string;
}

export interface BossConfig {
  phases: BossPhase[];
  entranceMessage: string;
  defeatMessage: string;
  specialMechanic: string;
}

const BOSS_CONFIGS: Record<string, BossConfig> = {
  // Scadrial - Steel Inquisitor
  steel_inquisitor: {
    entranceMessage: 'L\'Inquisiteur d\'Acier surgit des brumes!',
    defeatMessage: 'L\'Inquisiteur tombe, ses pics s\'effondrent...',
    specialMechanic: 'hemalurgy_drain',
    phases: [
      { name: 'Phase 1', hpThreshold: 1, damageMultiplier: 1, speedMultiplier: 1,
        specialAttack: 'steel_push', specialAttackCooldown: 5,
        message: 'L\'Inquisiteur vous observe...' },
      { name: 'Phase 2 — Rage', hpThreshold: 0.5, damageMultiplier: 1.5, speedMultiplier: 1.5,
        specialAttack: 'iron_pull', specialAttackCooldown: 3,
        message: '⚡ L\'Inquisiteur entre en rage! Dégâts augmentés!' },
      { name: 'Phase 3 — Désespoir', hpThreshold: 0.2, damageMultiplier: 2, speedMultiplier: 2,
        specialAttack: 'spike_barrage', specialAttackCooldown: 2,
        message: '💀 Phase finale! L\'Inquisiteur est désespéré!' },
    ],
  },
  // Roshar - Thunderclast
  thunderclast: {
    entranceMessage: 'Le Tonnerreclaste émerge de la pierre!',
    defeatMessage: 'Le Tonnerreclaste s\'effondre en poussière...',
    specialMechanic: 'quake',
    phases: [
      { name: 'Phase 1', hpThreshold: 1, damageMultiplier: 1, speedMultiplier: 0.6,
        specialAttack: 'ground_slam', specialAttackCooldown: 6,
        message: 'Le sol tremble sous ses pas...' },
      { name: 'Phase 2 — Séisme', hpThreshold: 0.6, damageMultiplier: 1.3, speedMultiplier: 0.8,
        specialAttack: 'rock_throw', specialAttackCooldown: 4,
        message: '🌍 Le Tonnerreclaste provoque un séisme!' },
      { name: 'Phase 3 — Fureur', hpThreshold: 0.25, damageMultiplier: 1.8, speedMultiplier: 1,
        specialAttack: 'stomp_wave', specialAttackCooldown: 3,
        message: '⚡ Le Tonnerreclaste entre en fureur!' },
    ],
  },
  // Taldain - Sand Lord
  sand_lord: {
    entranceMessage: 'Le Seigneur des Sables surgit du désert!',
    defeatMessage: 'Le sable noir retombe... le Seigneur est vaincu.',
    specialMechanic: 'sand_storm',
    phases: [
      { name: 'Phase 1', hpThreshold: 1, damageMultiplier: 1, speedMultiplier: 1,
        specialAttack: 'sand_blast', specialAttackCooldown: 5,
        message: 'Le sable tourbillonne...' },
      { name: 'Phase 2 — Tempête', hpThreshold: 0.5, damageMultiplier: 1.4, speedMultiplier: 1.3,
        specialAttack: 'sand_wall', specialAttackCooldown: 4,
        message: '🌪 Tempête de sable! Visibilité réduite!' },
      { name: 'Phase 3 — Eclipse', hpThreshold: 0.2, damageMultiplier: 2, speedMultiplier: 1.5,
        specialAttack: 'dark_sand', specialAttackCooldown: 2,
        message: '🌑 Le sable noir obscurcit le ciel!' },
    ],
  },
  // Komashi - Father of Nightmares
  nightmare_father: {
    entranceMessage: 'Le Père des Cauchemars se matérialise!',
    defeatMessage: 'Les cauchemars se dissipent... la lumière revient.',
    specialMechanic: 'nightmare_spawn',
    phases: [
      { name: 'Phase 1', hpThreshold: 1, damageMultiplier: 1, speedMultiplier: 0.8,
        specialAttack: 'fear_pulse', specialAttackCooldown: 6,
        message: 'Les ombres s\'agitent...' },
      { name: 'Phase 2 — Terreur', hpThreshold: 0.5, damageMultiplier: 1.5, speedMultiplier: 1,
        specialAttack: 'shadow_clone', specialAttackCooldown: 4,
        message: '👁 Le Père crée des clones de cauchemar!' },
      { name: 'Phase 3 — Apocalypse', hpThreshold: 0.15, damageMultiplier: 2.5, speedMultiplier: 1.5,
        specialAttack: 'void_consume', specialAttackCooldown: 2,
        message: '💀 Le néant consume tout!' },
    ],
  },
};

// Default config for bosses without specific mechanics
const DEFAULT_BOSS: BossConfig = {
  entranceMessage: 'Un boss redoutable apparaît!',
  defeatMessage: 'Le boss est vaincu!',
  specialMechanic: 'none',
  phases: [
    { name: 'Phase 1', hpThreshold: 1, damageMultiplier: 1, speedMultiplier: 1,
      specialAttack: 'power_strike', specialAttackCooldown: 5,
      message: 'Le combat commence...' },
    { name: 'Phase 2', hpThreshold: 0.5, damageMultiplier: 1.5, speedMultiplier: 1.3,
      specialAttack: 'power_strike', specialAttackCooldown: 3,
      message: '⚡ Le boss s\'énerve!' },
    { name: 'Phase 3', hpThreshold: 0.2, damageMultiplier: 2, speedMultiplier: 1.5,
      specialAttack: 'power_strike', specialAttackCooldown: 2,
      message: '💀 Phase finale!' },
  ],
};

export class BossState {
  config: BossConfig;
  currentPhase = 0;
  specialAttackTimer = 0;
  announced = false;
  defeated = false;

  constructor(enemyID: string) {
    this.config = BOSS_CONFIGS[enemyID] ?? DEFAULT_BOSS;
  }

  getCurrentPhase(hpPercent: number): BossPhase {
    let phase = this.config.phases[0];
    for (let i = this.config.phases.length - 1; i >= 0; i--) {
      if (hpPercent <= this.config.phases[i].hpThreshold) {
        phase = this.config.phases[i];
        break;
      }
    }
    return phase;
  }

  update(dt: number, hpPercent: number): { phaseChanged: boolean; message: string | null; canSpecialAttack: boolean } {
    const newPhaseIndex = this.getPhaseIndex(hpPercent);
    let phaseChanged = false;
    let message: string | null = null;

    if (newPhaseIndex !== this.currentPhase) {
      this.currentPhase = newPhaseIndex;
      phaseChanged = true;
      message = this.config.phases[newPhaseIndex].message;
      this.specialAttackTimer = 0;
    }

    this.specialAttackTimer += dt;
    const phase = this.config.phases[this.currentPhase];
    const canSpecialAttack = this.specialAttackTimer >= phase.specialAttackCooldown;

    if (canSpecialAttack) {
      this.specialAttackTimer = 0;
    }

    return { phaseChanged, message, canSpecialAttack };
  }

  private getPhaseIndex(hpPercent: number): number {
    for (let i = this.config.phases.length - 1; i >= 0; i--) {
      if (hpPercent <= this.config.phases[i].hpThreshold) {
        return i;
      }
    }
    return 0;
  }
}

// ─── Boss HP Bar UI ─────────────────────────────────────────────

export function createBossHPBar(
  uiContainer: Container,
  screenW: number,
  bossName: string,
): { container: Container; update: (hpPct: number, phaseName: string) => void; destroy: () => void } {
  const container = new Container();
  container.zIndex = 9000;

  const barW = Math.min(280, screenW - 40);
  const barH = 14;
  const x = (screenW - barW) / 2;
  const y = 50;

  // Background
  const bg = new Graphics();
  bg.roundRect(x - 4, y - 20, barW + 8, barH + 28, 6)
    .fill({ color: 0x0a0a1a, alpha: 0.75 })
    .stroke({ color: 0x883322, width: 1.5, alpha: 0.6 });
  container.addChild(bg);

  // Name
  const name = new Text({
    text: bossName,
    style: new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 10, fill: 0xff6644, fontWeight: 'bold',
    }),
  });
  name.anchor.set(0.5);
  name.x = screenW / 2;
  name.y = y - 12;
  container.addChild(name);

  // HP bar background
  const barBg = new Graphics();
  barBg.roundRect(x, y, barW, barH, 4)
    .fill({ color: 0x111122, alpha: 0.9 })
    .stroke({ color: 0x332222, width: 1 });
  container.addChild(barBg);

  // HP bar fill
  const barFill = new Graphics();
  container.addChild(barFill);

  // Phase label
  const phaseLabel = new Text({
    text: '',
    style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 7, fill: 0xcc6644 }),
  });
  phaseLabel.anchor.set(0.5);
  phaseLabel.x = screenW / 2;
  phaseLabel.y = y + barH + 2;
  container.addChild(phaseLabel);

  uiContainer.addChild(container);

  return {
    container,
    update(hpPct: number, phaseName: string) {
      barFill.clear();
      if (hpPct > 0) {
        const color = hpPct > 0.5 ? 0xcc3333 : hpPct > 0.2 ? 0xff6633 : 0xff2222;
        barFill.roundRect(x, y, barW * hpPct, barH, 4).fill(color);
        barFill.roundRect(x, y, barW * hpPct, barH / 2, 4)
          .fill({ color: 0xffffff, alpha: 0.1 });
      }
      phaseLabel.text = phaseName;
    },
    destroy() {
      container.destroy({ children: true });
    },
  };
}

// ─── Boss Special Attack Effects ────────────────────────────────

export function createBossSpecialEffect(
  worldContainer: Container,
  bossX: number, bossY: number,
  playerX: number, playerY: number,
  attackName: string,
): { damage: number; message: string } {
  const g = new Graphics();

  switch (attackName) {
    case 'steel_push':
    case 'iron_pull':
      // Metal line effect
      g.moveTo(bossX, bossY - 10)
        .lineTo(playerX, playerY - 10)
        .stroke({ color: 0x4488ff, width: 3, alpha: 0.7 });
      g.circle(playerX, playerY - 10, 15).fill({ color: 0x4488ff, alpha: 0.15 });
      break;

    case 'ground_slam':
    case 'stomp_wave':
      // Shockwave
      g.circle(bossX, bossY, 60).stroke({ color: 0x887766, width: 4, alpha: 0.5 });
      g.circle(bossX, bossY, 40).stroke({ color: 0x998877, width: 2, alpha: 0.3 });
      break;

    case 'rock_throw':
      // Projectile trail
      g.poly([
        { x: bossX, y: bossY - 20 },
        { x: playerX - 5, y: playerY - 5 },
        { x: playerX + 5, y: playerY + 5 },
      ]).fill({ color: 0x665544, alpha: 0.5 });
      g.circle(playerX, playerY, 12).fill({ color: 0x776655, alpha: 0.3 });
      break;

    case 'sand_blast':
    case 'dark_sand':
      // Sand spiral
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const r = 30 + Math.random() * 20;
        g.circle(bossX + Math.cos(angle) * r, bossY + Math.sin(angle) * r, 3)
          .fill({ color: attackName === 'dark_sand' ? 0x222200 : 0xddcc88, alpha: 0.5 });
      }
      break;

    case 'fear_pulse':
    case 'void_consume':
      // Dark expanding ring
      g.circle(bossX, bossY, 50).fill({ color: 0x220033, alpha: 0.2 });
      g.circle(bossX, bossY, 50).stroke({ color: 0x6633aa, width: 3, alpha: 0.6 });
      break;

    case 'shadow_clone':
      // Dark copies
      for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2;
        const cx = bossX + Math.cos(angle) * 40;
        const cy = bossY + Math.sin(angle) * 20;
        g.ellipse(cx, cy, 8, 12).fill({ color: 0x332244, alpha: 0.4 });
      }
      break;

    default:
      // Generic power strike
      g.circle(bossX, bossY, 30).stroke({ color: 0xff4444, width: 3, alpha: 0.5 });
      g.moveTo(bossX, bossY - 10).lineTo(playerX, playerY - 10)
        .stroke({ color: 0xff4444, width: 2, alpha: 0.4 });
      break;
  }

  g.zIndex = 100000;
  worldContainer.addChild(g);

  // Fade and destroy
  let elapsed = 0;
  const anim = () => {
    elapsed += 1 / 60;
    g.alpha = Math.max(0, 1 - elapsed / 0.6);
    if (elapsed < 0.6) requestAnimationFrame(anim);
    else g.destroy();
  };
  requestAnimationFrame(anim);

  const damages: Record<string, number> = {
    steel_push: 20, iron_pull: 25, spike_barrage: 40,
    ground_slam: 30, rock_throw: 25, stomp_wave: 35,
    sand_blast: 20, sand_wall: 15, dark_sand: 35,
    fear_pulse: 15, shadow_clone: 10, void_consume: 45,
  };

  return {
    damage: damages[attackName] ?? 20,
    message: getAttackMessage(attackName),
  };
}

function getAttackMessage(attack: string): string {
  const messages: Record<string, string> = {
    steel_push: 'Poussée d\'acier!',
    iron_pull: 'Traction de fer!',
    spike_barrage: 'Pluie de pics!',
    ground_slam: 'Frappe au sol!',
    rock_throw: 'Jet de roche!',
    stomp_wave: 'Onde de choc!',
    sand_blast: 'Souffle de sable!',
    sand_wall: 'Mur de sable!',
    dark_sand: 'Sable noir!',
    fear_pulse: 'Onde de peur!',
    shadow_clone: 'Clones d\'ombre!',
    void_consume: 'Néant dévorant!',
  };
  return messages[attack] ?? 'Attaque spéciale!';
}
