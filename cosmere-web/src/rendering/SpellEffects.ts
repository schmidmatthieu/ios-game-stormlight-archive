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
  const anim = () => {
    elapsed += 1 / 60;
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
  const anim = () => {
    elapsed += 1 / 60;
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

// ─── Enhanced Magic Effects ──────────────────────────────────

/**
 * Creates a class-specific on-hit impact effect at the target position.
 * More visually distinct than the generic damage number.
 */
export function createHitImpact(
  worldContainer: Container,
  tx: number, ty: number,
  cls: ChampionClass,
  isCrit: boolean,
  particles: SpellParticle[],
): void {
  const cfg = SKILL_COLORS[cls] ?? SKILL_COLORS.mistborn;
  const color = isCrit ? 0xffdd44 : cfg.color1;
  const particleCount = isCrit ? 10 : 5;

  // Impact flash
  const flash = new Graphics();
  flash.circle(0, 0, isCrit ? 16 : 10).fill({ color, alpha: isCrit ? 0.5 : 0.3 });
  flash.x = tx; flash.y = ty; flash.zIndex = 100000;
  worldContainer.addChild(flash);

  // Class-specific impact marks
  const mark = new Graphics();
  mark.x = tx; mark.y = ty; mark.zIndex = 100001;

  switch (cls) {
    case 'mistborn':
      // Metal shards flying outward
      for (let i = 0; i < 4; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = 6 + Math.random() * 8;
        mark.moveTo(Math.cos(angle) * 3, Math.sin(angle) * 3)
          .lineTo(Math.cos(angle) * r, Math.sin(angle) * r)
          .stroke({ color: 0x88aacc, width: 1.5, alpha: 0.6 });
      }
      break;
    case 'radiant':
      // Stormlight wisps
      mark.circle(0, 0, 8).stroke({ color: 0x88ccff, width: 1, alpha: 0.4 });
      mark.circle(0, 0, 12).stroke({ color: 0x44aaff, width: 0.5, alpha: 0.2 });
      break;
    case 'awakener':
      // Color burst (rainbow lines)
      [0xff4466, 0x44ff66, 0x4466ff, 0xffaa22].forEach((c, i) => {
        const angle = (i / 4) * Math.PI * 2 + Math.random() * 0.5;
        mark.moveTo(0, 0).lineTo(Math.cos(angle) * 12, Math.sin(angle) * 12)
          .stroke({ color: c, width: 2, alpha: 0.5 });
      });
      break;
    case 'elantrian':
      // Aon glyph shimmer (X pattern)
      mark.moveTo(-8, -8).lineTo(8, 8).stroke({ color: 0xffcc44, width: 1.5, alpha: 0.5 });
      mark.moveTo(8, -8).lineTo(-8, 8).stroke({ color: 0xffaa33, width: 1.5, alpha: 0.4 });
      mark.circle(0, 0, 6).stroke({ color: 0xffdd66, width: 1, alpha: 0.3 });
      break;
    case 'sandMaster':
      // Sand explosion dots
      for (let i = 0; i < 8; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = 4 + Math.random() * 10;
        mark.circle(Math.cos(angle) * r, Math.sin(angle) * r, 1).fill({ color: 0xddcc88, alpha: 0.5 });
      }
      break;
    case 'nightmarePainter':
      // Ink splatter
      for (let i = 0; i < 6; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = 3 + Math.random() * 8;
        const size = 1 + Math.random() * 2;
        mark.ellipse(Math.cos(angle) * r, Math.sin(angle) * r, size, size * 0.6)
          .fill({ color: 0x222244, alpha: 0.6 });
      }
      break;
  }
  worldContainer.addChild(mark);

  // Spawn impact particles
  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 20 + Math.random() * 40;
    const p = new Graphics();
    const pColor = isCrit ? 0xffee66 : cfg.particleColor;
    p.circle(0, 0, 1 + Math.random() * (isCrit ? 2 : 1)).fill({ color: pColor, alpha: 0.7 });
    p.x = tx; p.y = ty; p.zIndex = 100002;
    worldContainer.addChild(p);
    particles.push({
      sprite: p, x: tx, y: ty,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - (isCrit ? 30 : 15),
      life: 0.3 + Math.random() * 0.3,
      maxLife: 0.6,
      size: 1.5,
    });
  }

  // Crit screen shake indicator - expanding ring
  if (isCrit) {
    const ring = new Graphics();
    ring.circle(0, 0, 6).stroke({ color: 0xffdd44, width: 3, alpha: 0.8 });
    ring.x = tx; ring.y = ty; ring.zIndex = 100003;
    worldContainer.addChild(ring);

    let elapsed = 0;
    const animRing = () => {
      elapsed += 1 / 60;
      const p = elapsed / 0.4;
      ring.scale.set(1 + p * 3);
      ring.alpha = Math.max(0, 1 - p);
      if (elapsed < 0.4) requestAnimationFrame(animRing);
      else ring.destroy();
    };
    requestAnimationFrame(animRing);
  }

  // Fade out impact
  let elapsed = 0;
  const anim = () => {
    elapsed += 1 / 60;
    const p = elapsed / 0.3;
    flash.alpha = Math.max(0, 0.3 - p * 0.3);
    flash.scale.set(1 + p * 2);
    mark.alpha = Math.max(0, 1 - p);
    if (elapsed < 0.3) requestAnimationFrame(anim);
    else { flash.destroy(); mark.destroy(); }
  };
  requestAnimationFrame(anim);
}

/**
 * Creates lingering magic ambient particles around the player
 * based on their class. Called periodically for passive visual flavor.
 */
export function spawnClassAmbientParticle(
  worldContainer: Container,
  px: number, py: number,
  cls: ChampionClass,
  particles: SpellParticle[],
): void {
  const cfg = SKILL_COLORS[cls] ?? SKILL_COLORS.mistborn;

  const p = new Graphics();
  let size = 1;
  let color = cfg.particleColor;
  let vx = 0;
  let vy = 0;
  let life = 1;

  switch (cls) {
    case 'mistborn':
      // Metallic sparkle drifting upward
      size = 0.8 + Math.random() * 0.8;
      color = Math.random() > 0.5 ? 0x88aacc : 0xaabbdd;
      vx = (Math.random() - 0.5) * 8;
      vy = -10 - Math.random() * 15;
      life = 1.5 + Math.random();
      break;
    case 'radiant':
      // Stormlight wisps floating upward
      size = 1 + Math.random();
      color = Math.random() > 0.5 ? 0x88ccff : 0xaaddff;
      vx = (Math.random() - 0.5) * 12;
      vy = -15 - Math.random() * 10;
      life = 1 + Math.random() * 0.8;
      break;
    case 'awakener':
      // Color motes drifting
      const colorPool = [0xff4466, 0x44aaff, 0xffaa22, 0x44ff66, 0xaa44ff];
      color = colorPool[Math.floor(Math.random() * colorPool.length)];
      size = 0.8 + Math.random();
      vx = (Math.random() - 0.5) * 20;
      vy = -5 - Math.random() * 10;
      life = 2 + Math.random();
      break;
    case 'elantrian':
      // Golden Aon glow dots
      size = 0.6 + Math.random() * 0.6;
      color = Math.random() > 0.5 ? 0xffcc44 : 0xffdd88;
      const aonAngle = Math.random() * Math.PI * 2;
      const aonR = 8 + Math.random() * 12;
      vx = Math.cos(aonAngle) * 5;
      vy = Math.sin(aonAngle) * 5 - 8;
      life = 1.2 + Math.random();
      p.x = px + Math.cos(aonAngle) * aonR;
      p.y = py + Math.sin(aonAngle) * aonR;
      break;
    case 'sandMaster':
      // Sand grains swirling
      size = 0.5 + Math.random() * 0.5;
      color = Math.random() > 0.5 ? 0xddcc88 : 0xccbb77;
      const sandAngle = Math.random() * Math.PI * 2;
      vx = Math.cos(sandAngle) * 15;
      vy = Math.sin(sandAngle) * 10 - 5;
      life = 0.8 + Math.random() * 0.5;
      break;
    case 'nightmarePainter':
      // Dark ink droplets rising
      size = 1 + Math.random() * 1.5;
      color = Math.random() > 0.6 ? 0x8855cc : 0x332244;
      vx = (Math.random() - 0.5) * 6;
      vy = -8 - Math.random() * 12;
      life = 1.5 + Math.random();
      break;
  }

  p.circle(0, 0, size).fill({ color, alpha: 0.5 });
  if (!p.x) p.x = px + (Math.random() - 0.5) * 16;
  if (!p.y) p.y = py - Math.random() * 10;
  p.zIndex = 99999;
  worldContainer.addChild(p);

  particles.push({
    sprite: p,
    x: p.x, y: p.y,
    vx, vy,
    life, maxLife: life,
    size,
  });
}
