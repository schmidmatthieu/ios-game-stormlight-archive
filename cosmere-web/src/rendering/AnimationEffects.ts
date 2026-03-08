import { Container, Graphics } from 'pixi.js';
import type { ChampionClass } from '../data/types';
import { CLASS_AURA_COLORS } from './ClassAuraEffects';

// ─── Enemy Hit Animation ─────────────────────────────────────────

export function animateEnemyHit(enemySprite: Container): void {
  const inner = enemySprite.children[1] as Graphics | undefined;
  if (!inner) return;

  let elapsed = 0;
  let last = performance.now();
  const originalX = inner.x;
  const anim = () => {
    if (inner.destroyed) return;
    const now = performance.now();
    elapsed += (now - last) / 1000;
    last = now;
    inner.x = originalX + Math.sin(elapsed * 40) * (3 * (1 - elapsed / 0.2));
    if (elapsed < 0.2) requestAnimationFrame(anim);
    else inner.x = originalX;
  };
  requestAnimationFrame(anim);
}

// ─── Enemy Death Animation ───────────────────────────────────────

export function animateEnemyDeath(
  enemySprite: Container,
  worldContainer: Container,
  x: number, y: number,
): void {
  let elapsed = 0;
  let last = performance.now();
  const dur = 0.5;
  const startY = enemySprite.y;

  const anim = () => {
    if (enemySprite.destroyed) return;
    const now = performance.now();
    elapsed += (now - last) / 1000;
    last = now;
    const p = Math.min(1, elapsed / dur);

    enemySprite.alpha = 1 - p;
    enemySprite.scale.y = 1 - p * 0.5;
    enemySprite.scale.x = 1 + p * 0.3;
    enemySprite.y = startY + p * 5;
    enemySprite.rotation = p * 0.3;

    if (elapsed < dur) requestAnimationFrame(anim);
  };
  requestAnimationFrame(anim);

  // Ghost particles rising
  for (let i = 0; i < 5; i++) {
    const particle = new Graphics();
    particle.circle(0, 0, 1.5 + Math.random()).fill({ color: 0xaaaaff, alpha: 0.4 });
    particle.x = x + (Math.random() - 0.5) * 20;
    particle.y = y;
    particle.zIndex = 100001;
    worldContainer.addChild(particle);

    let pt = 0;
    let pLast = performance.now();
    const speed = 15 + Math.random() * 10;
    const drift = (Math.random() - 0.5) * 15;
    const pAnim = () => {
      if (particle.destroyed) return;
      const now = performance.now();
      const dt = (now - pLast) / 1000;
      pLast = now;
      pt += dt;
      particle.y -= speed * dt;
      particle.x += drift * dt;
      particle.alpha = Math.max(0, 0.4 - pt * 0.5);
      if (pt < 0.8) requestAnimationFrame(pAnim);
      else particle.destroy();
    };
    setTimeout(() => requestAnimationFrame(pAnim), i * 60);
  }
}

// ─── Level Up Aura Burst ─────────────────────────────────────────

export function animateLevelUpBurst(
  worldContainer: Container,
  x: number, y: number,
  cls: ChampionClass,
): void {
  const color = CLASS_AURA_COLORS[cls] ?? 0xffcc44;

  // Expanding ring
  const ring = new Graphics();
  ring.x = x;
  ring.y = y - 15;
  ring.zIndex = 100002;
  worldContainer.addChild(ring);

  // Rising particles
  for (let i = 0; i < 12; i++) {
    const p = new Graphics();
    const angle = (i / 12) * Math.PI * 2;
    p.circle(0, 0, 2).fill({ color, alpha: 0.6 });
    p.x = x;
    p.y = y - 15;
    p.zIndex = 100002;
    worldContainer.addChild(p);

    let pt = 0;
    let pLast = performance.now();
    const speed = 40 + Math.random() * 20;
    const pAnim = () => {
      if (p.destroyed) return;
      const now = performance.now();
      const dtSec = (now - pLast) / 1000;
      pLast = now;
      pt += dtSec;
      p.x = x + Math.cos(angle) * speed * pt;
      p.y = y - 15 + Math.sin(angle) * speed * pt * 0.5 - pt * 30;
      p.alpha = Math.max(0, 0.6 - pt * 0.6);
      p.scale.set(1 - pt * 0.5);
      if (pt < 1) requestAnimationFrame(pAnim);
      else p.destroy();
    };
    requestAnimationFrame(pAnim);
  }

  let elapsed = 0;
  let ringLast = performance.now();
  const ringAnim = () => {
    if (ring.destroyed) return;
    const now = performance.now();
    const dtSec = (now - ringLast) / 1000;
    ringLast = now;
    elapsed += dtSec;
    ring.clear();
    const r = elapsed * 60;
    ring.circle(0, 0, r)
      .stroke({ color, width: 3 * (1 - elapsed), alpha: 0.5 * (1 - elapsed) });
    ring.circle(0, 0, r * 0.7)
      .stroke({ color: 0xffffff, width: 1.5 * (1 - elapsed), alpha: 0.3 * (1 - elapsed) });
    if (elapsed < 1) requestAnimationFrame(ringAnim);
    else ring.destroy();
  };
  requestAnimationFrame(ringAnim);
}
