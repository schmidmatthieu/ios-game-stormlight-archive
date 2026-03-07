import { Container, Graphics } from 'pixi.js';
import type { ChampionClass } from '../data/types';

export interface SpellParticle {
  sprite: Graphics;
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  size: number;
}

const SKILL_COLORS: Record<string, { color1: number; color2: number; particleColor: number }> = {
  mistborn:         { color1: 0x4488ff, color2: 0x6699cc, particleColor: 0x88aacc },
  radiant:          { color1: 0x44aaff, color2: 0x88ccff, particleColor: 0xaaddff },
  awakener:         { color1: 0xaa44ff, color2: 0xcc88ff, particleColor: 0xdd99ff },
  elantrian:        { color1: 0xffaa33, color2: 0xffcc66, particleColor: 0xffdd88 },
  sandMaster:       { color1: 0xddaa33, color2: 0xeecc66, particleColor: 0xddcc88 },
  nightmarePainter: { color1: 0x6633aa, color2: 0x8855cc, particleColor: 0xaa77ee },
};

const ATTACK_COLORS: Record<string, number> = {
  mistborn: 0xaabbcc, radiant: 0x88ccff, awakener: 0xcc88ff,
  elantrian: 0xffcc44, sandMaster: 0xddcc88, nightmarePainter: 0x8866cc,
};

export function createAttackEffect(
  worldContainer: Container,
  px: number, py: number,
  facing: 'left' | 'right',
  cls: ChampionClass,
): void {
  const dir = facing === 'right' ? 1 : -1;
  const slashColor = ATTACK_COLORS[cls] ?? 0xaabbcc;

  // Main slash arc
  const g = new Graphics();
  const startAngle = dir > 0 ? -Math.PI * 0.6 : Math.PI * 0.4;
  const endAngle = dir > 0 ? Math.PI * 0.3 : Math.PI * 1.3;
  g.arc(0, 0, 28, startAngle, endAngle).stroke({ color: slashColor, width: 3, alpha: 0.7 });
  g.arc(0, 0, 22, startAngle, endAngle).stroke({ color: 0xffffff, width: 1.5, alpha: 0.4 });

  for (let i = 0; i < 5; i++) {
    const angle = startAngle + (endAngle - startAngle) * (i / 5);
    const r = 25 + Math.random() * 5;
    g.circle(Math.cos(angle) * r, Math.sin(angle) * r, 1.5).fill({ color: slashColor, alpha: 0.5 });
  }

  g.x = px + dir * 18;
  g.y = py - 14;
  g.zIndex = 100000;
  worldContainer.addChild(g);

  // Weapon trail
  const armSwing = new Graphics();
  if (cls === 'radiant') {
    armSwing.poly([
      { x: dir * 4, y: -8 }, { x: dir * 30, y: -24 }, { x: dir * 32, y: -20 }, { x: dir * 6, y: -4 },
    ]).fill({ color: 0x88ccff, alpha: 0.3 });
  } else {
    armSwing.poly([
      { x: dir * 4, y: -8 }, { x: dir * 22, y: -18 }, { x: dir * 24, y: -14 }, { x: dir * 6, y: -4 },
    ]).fill({ color: slashColor, alpha: 0.2 });
  }
  armSwing.x = px;
  armSwing.y = py;
  armSwing.zIndex = 100001;
  worldContainer.addChild(armSwing);

  let elapsed = 0;
  let lastTime = performance.now();
  const anim = () => {
    const now = performance.now();
    const frameDt = (now - lastTime) / 1000;
    lastTime = now;
    elapsed += frameDt;
    const progress = elapsed / 0.25;
    g.alpha = Math.max(0, 1 - progress);
    g.scale.set(1 + elapsed * 2);
    g.rotation = dir * elapsed * 2;
    armSwing.alpha = Math.max(0, 1 - progress * 1.5);
    if (elapsed < 0.25) requestAnimationFrame(anim);
    else { g.destroy(); armSwing.destroy(); }
  };
  requestAnimationFrame(anim);
}

export function createSkillEffect(
  worldContainer: Container,
  px: number, py: number,
  range: number,
  cls: ChampionClass,
  particles: SpellParticle[],
): void {
  const cfg = SKILL_COLORS[cls] ?? SKILL_COLORS.mistborn;

  // Main AOE ring
  const g = new Graphics();
  g.circle(0, 0, range).fill({ color: cfg.color1, alpha: 0.12 });
  g.circle(0, 0, range).stroke({ color: cfg.color2, width: 2.5, alpha: 0.6 });
  g.circle(0, 0, range * 0.7).stroke({ color: cfg.color1, width: 1.5, alpha: 0.3 });
  g.x = px; g.y = py; g.zIndex = 100000;
  worldContainer.addChild(g);

  // Inner burst
  const burst = new Graphics();
  drawClassBurst(burst, cls, range, cfg);
  burst.x = px; burst.y = py; burst.zIndex = 100001;
  worldContainer.addChild(burst);

  // Particle burst
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2 + Math.random() * 0.3;
    const speed = 40 + Math.random() * 30;
    const p = new Graphics();
    p.circle(0, 0, 1.5 + Math.random()).fill({ color: cfg.particleColor, alpha: 0.6 });
    p.x = px; p.y = py; p.zIndex = 100002;
    worldContainer.addChild(p);
    particles.push({
      sprite: p, x: px, y: py,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 10,
      life: 0.5 + Math.random() * 0.3, maxLife: 0.8, size: 2,
    });
  }

  let elapsed = 0;
  let lastTime = performance.now();
  const anim = () => {
    const now = performance.now();
    const frameDt = (now - lastTime) / 1000;
    lastTime = now;
    elapsed += frameDt;
    const progress = elapsed / 0.5;
    g.alpha = Math.max(0, 1 - progress);
    g.scale.set(0.3 + progress * 0.8);
    burst.alpha = Math.max(0, 1 - progress * 1.2);
    burst.scale.set(0.5 + progress * 0.6);
    burst.rotation = elapsed * 2;
    if (elapsed < 0.5) requestAnimationFrame(anim);
    else { g.destroy(); burst.destroy(); }
  };
  requestAnimationFrame(anim);
}

function drawClassBurst(burst: Graphics, cls: string, range: number, cfg: { color1: number; color2: number }): void {
  switch (cls) {
    case 'mistborn':
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        burst.moveTo(0, 0).lineTo(Math.cos(angle) * range * 0.8, Math.sin(angle) * range * 0.8)
          .stroke({ color: 0x4488ff, width: 1, alpha: 0.4 });
      }
      break;
    case 'radiant':
      burst.circle(0, 0, range * 0.5).fill({ color: 0x88ccff, alpha: 0.15 });
      burst.circle(0, 0, range * 0.3).fill({ color: 0xaaddff, alpha: 0.1 });
      break;
    case 'elantrian':
      burst.circle(0, 0, range * 0.6).stroke({ color: 0xffcc44, width: 1.5, alpha: 0.4 });
      burst.moveTo(-range * 0.4, 0).lineTo(range * 0.4, 0).stroke({ color: 0xffcc44, width: 1, alpha: 0.3 });
      burst.moveTo(0, -range * 0.4).lineTo(0, range * 0.4).stroke({ color: 0xffcc44, width: 1, alpha: 0.3 });
      break;
    case 'awakener': {
      const colors = [0xff4466, 0x44aaff, 0xffaa22, 0x44ff66, 0xaa44ff];
      for (let i = 0; i < 5; i++) {
        burst.circle(0, 0, range * (0.3 + i * 0.12)).stroke({ color: colors[i], width: 1.5, alpha: 0.2 });
      }
      break;
    }
    case 'sandMaster':
      for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 4;
        const r = (i / 20) * range * 0.8;
        burst.circle(Math.cos(angle) * r, Math.sin(angle) * r, 1.5).fill({ color: 0xddcc88, alpha: 0.4 });
      }
      break;
    default:
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const r = range * 0.5;
        burst.ellipse(Math.cos(angle) * r, Math.sin(angle) * r, 4, 6).fill({ color: 0x222233, alpha: 0.3 });
      }
      break;
  }
}
