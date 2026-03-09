import { Container, Graphics } from 'pixi.js';
import type { ChampionClass } from '../data/types';
import { ATTACK_COLORS, SKILL_COLORS } from './SpellParticles';
import type { SpellParticle } from './SpellParticles';

export function createAttackEffect(
  worldContainer: Container,
  px: number, py: number,
  facing: 'left' | 'right',
  cls: ChampionClass,
): void {
  const dir = facing === 'right' ? 1 : -1;
  const slashColor = ATTACK_COLORS[cls] ?? 0xaabbcc;

  // Main slash arc — triple-layered for depth
  const g = new Graphics();
  const startAngle = dir > 0 ? -Math.PI * 0.6 : Math.PI * 0.4;
  const endAngle = dir > 0 ? Math.PI * 0.3 : Math.PI * 1.3;

  // Outer glow arc
  g.arc(0, 0, 32, startAngle, endAngle).stroke({ color: slashColor, width: 5, alpha: 0.15 });
  // Main arc
  g.arc(0, 0, 28, startAngle, endAngle).stroke({ color: slashColor, width: 3, alpha: 0.7 });
  // White highlight core
  g.arc(0, 0, 26, startAngle + 0.05, endAngle - 0.05).stroke({ color: 0xffffff, width: 1.5, alpha: 0.5 });
  // Inner arc for depth
  g.arc(0, 0, 20, startAngle + 0.15, endAngle - 0.15).stroke({ color: slashColor, width: 1.5, alpha: 0.35 });
  // Innermost thin arc
  g.arc(0, 0, 14, startAngle + 0.3, endAngle - 0.3).stroke({ color: slashColor, width: 0.8, alpha: 0.2 });

  // Trailing sparks along arc with trails
  for (let i = 0; i < 12; i++) {
    const angle = startAngle + (endAngle - startAngle) * (i / 12);
    const r = 20 + Math.random() * 14;
    const sz = 0.8 + Math.random() * 1.5;
    g.circle(Math.cos(angle) * r, Math.sin(angle) * r, sz)
      .fill({ color: slashColor, alpha: 0.4 + Math.random() * 0.3 });
    // Spark trail
    if (i % 2 === 0) {
      const tr = r - 4;
      g.moveTo(Math.cos(angle) * r, Math.sin(angle) * r)
        .lineTo(Math.cos(angle) * tr, Math.sin(angle) * tr)
        .stroke({ color: 0xffffff, width: 0.5, alpha: 0.2 });
    }
  }

  // Motion blur fill between arcs
  const midAngle = (startAngle + endAngle) * 0.5;
  for (let i = 0; i < 4; i++) {
    const a = startAngle + (endAngle - startAngle) * (i / 4 + 0.1);
    const rI = 16 + Math.random() * 4;
    const rO = 28 + Math.random() * 4;
    g.moveTo(Math.cos(a) * rI, Math.sin(a) * rI)
      .lineTo(Math.cos(a) * rO, Math.sin(a) * rO)
      .stroke({ color: slashColor, width: 0.5, alpha: 0.12 });
  }

  g.x = px + dir * 18;
  g.y = py - 14;
  g.zIndex = 100000;
  worldContainer.addChild(g);

  // Class-specific weapon trail
  const armSwing = new Graphics();
  drawClassAttackTrail(armSwing, cls, dir, slashColor);
  armSwing.x = px;
  armSwing.y = py;
  armSwing.zIndex = 100001;
  worldContainer.addChild(armSwing);

  let elapsed = 0;
  let lastTime = performance.now();
  const anim = () => {
    if (g.destroyed) return; // Scene changed — stop silently
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

function drawClassAttackTrail(g: Graphics, cls: string, dir: number, _slashColor: number): void {
  switch (cls) {
    case 'radiant':
      // Shardblade luminous trail
      g.poly([
        { x: dir * 4, y: -8 }, { x: dir * 32, y: -26 },
        { x: dir * 34, y: -22 }, { x: dir * 6, y: -4 },
      ]).fill({ color: 0x88ccff, alpha: 0.3 });
      // Stormlight wisps along trail
      for (let i = 0; i < 4; i++) {
        const t = i / 4;
        const wx = dir * (4 + t * 28);
        const wy = -8 - t * 16;
        g.circle(wx, wy, 2).fill({ color: 0xcceeFF, alpha: 0.2 });
      }
      break;
    case 'mistborn':
      // Dual dagger trails
      g.poly([
        { x: dir * 4, y: -6 }, { x: dir * 20, y: -18 },
        { x: dir * 22, y: -15 }, { x: dir * 6, y: -3 },
      ]).fill({ color: 0x6688aa, alpha: 0.25 });
      g.poly([
        { x: dir * 2, y: -10 }, { x: dir * 18, y: -22 },
        { x: dir * 20, y: -19 }, { x: dir * 4, y: -7 },
      ]).fill({ color: 0x8899bb, alpha: 0.2 });
      break;
    case 'awakener':
      // Color ribbon trail
      g.poly([
        { x: dir * 4, y: -8 }, { x: dir * 24, y: -20 },
        { x: dir * 26, y: -16 }, { x: dir * 6, y: -4 },
      ]).fill({ color: 0xcc88ff, alpha: 0.2 });
      // Rainbow streak
      const ribbonColors = [0xff4466, 0x44aaff, 0x44ff66];
      ribbonColors.forEach((c, i) => {
        const oy = -6 - i * 4;
        g.moveTo(dir * 6, oy).lineTo(dir * 22, oy - 10)
          .stroke({ color: c, width: 1.5, alpha: 0.3 });
      });
      break;
    case 'elantrian':
      // Glowing Aon arc trail
      g.poly([
        { x: dir * 4, y: -8 }, { x: dir * 22, y: -18 },
        { x: dir * 24, y: -14 }, { x: dir * 6, y: -4 },
      ]).fill({ color: 0xffcc44, alpha: 0.25 });
      // Glowing dots along trail
      for (let i = 0; i < 3; i++) {
        const t = (i + 1) / 4;
        g.circle(dir * (4 + t * 18), -8 - t * 8, 2.5)
          .fill({ color: 0xffdd66, alpha: 0.3 });
      }
      break;
    case 'sandMaster':
      // Sand wave trail
      g.poly([
        { x: dir * 4, y: -4 }, { x: dir * 24, y: -14 },
        { x: dir * 26, y: -10 }, { x: dir * 8, y: 0 },
      ]).fill({ color: 0xddcc88, alpha: 0.2 });
      // Sand grains
      for (let i = 0; i < 6; i++) {
        g.circle(dir * (6 + Math.random() * 18), -2 - Math.random() * 12, 0.8)
          .fill({ color: 0xeecc77, alpha: 0.4 });
      }
      break;
    default:
      // Ink slash trail (nightmare painter)
      g.poly([
        { x: dir * 4, y: -8 }, { x: dir * 22, y: -18 },
        { x: dir * 24, y: -14 }, { x: dir * 6, y: -4 },
      ]).fill({ color: 0x332244, alpha: 0.3 });
      // Dripping ink
      for (let i = 0; i < 3; i++) {
        const dx = dir * (8 + i * 6);
        g.moveTo(dx, -6 - i * 4).lineTo(dx + dir, -2 - i * 2)
          .stroke({ color: 0x111122, width: 1, alpha: 0.3 });
      }
      break;
  }
}

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

    let ringElapsed = 0;
    let ringLast = performance.now();
    const animRing = () => {
      if (ring.destroyed) return;
      const now = performance.now();
      ringElapsed += (now - ringLast) / 1000;
      ringLast = now;
      const p = ringElapsed / 0.4;
      ring.scale.set(1 + p * 3);
      ring.alpha = Math.max(0, 1 - p);
      if (ringElapsed < 0.4) requestAnimationFrame(animRing);
      else ring.destroy();
    };
    requestAnimationFrame(animRing);
  }

  // Fade out impact (frame-rate independent)
  let elapsed = 0;
  let lastT = performance.now();
  const anim = () => {
    if (flash.destroyed) return;
    const now = performance.now();
    elapsed += (now - lastT) / 1000;
    lastT = now;
    const p = elapsed / 0.3;
    flash.alpha = Math.max(0, 0.3 - p * 0.3);
    flash.scale.set(1 + p * 2);
    mark.alpha = Math.max(0, 1 - p);
    if (elapsed < 0.3) requestAnimationFrame(anim);
    else { flash.destroy(); mark.destroy(); }
  };
  requestAnimationFrame(anim);
}
