import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { RARITY_COLORS } from '../data/types';
import type { ItemRarity } from '../data/types';

// ─── Shared Animation Manager ───────────────────────────────────
// Single RAF loop for ALL loot animations (drops, coins, orbs).
// Eliminates per-item RAF loops and uses object pooling.

interface LootDropAnim {
  sprite: Container;
  gem: Graphics;
  label: Text;
  x: number; y: number;
  vx: number; vy: number;
  gravity: number;
  bounce: number;
  elapsed: number;
  delay: number;
  groundY: number;
  settled: boolean;
}

interface CoinAnim {
  sprite: Graphics;
  x: number; y: number;
  vx: number; vy: number;
  elapsed: number;
  delay: number;
  groundY: number;
}

interface OrbAnim {
  sprite: Graphics;
  startX: number; startY: number;
  targetX: number; targetY: number;
  peakY: number;
  elapsed: number;
  delay: number;
}

// ─── Pools ──────────────────────────────────────────────────────

const graphicsPool: Graphics[] = [];
function acquireGraphics(): Graphics {
  if (graphicsPool.length > 0) {
    const g = graphicsPool.pop()!;
    g.visible = true;
    g.alpha = 1;
    g.scale.set(1);
    g.rotation = 0;
    return g;
  }
  return new Graphics();
}
function releaseGraphics(g: Graphics): void {
  g.removeFromParent();
  g.clear();
  g.visible = false;
  graphicsPool.push(g);
}

// ─── Animation State ────────────────────────────────────────────

const activeDrops: LootDropAnim[] = [];
const activeCoins: CoinAnim[] = [];
const activeOrbs: OrbAnim[] = [];
let rafId = 0;
let lastTime = 0;
let running = false;

function ensureRunning(): void {
  if (running) return;
  running = true;
  lastTime = performance.now();
  rafId = requestAnimationFrame(tick);
}

function tick(): void {
  const now = performance.now();
  const dt = Math.min((now - lastTime) / 1000, 0.05); // Cap at 50ms
  lastTime = now;

  updateDrops(dt);
  updateCoins(dt);
  updateOrbs(dt);

  if (activeDrops.length > 0 || activeCoins.length > 0 || activeOrbs.length > 0) {
    rafId = requestAnimationFrame(tick);
  } else {
    running = false;
  }
}

// ─── Drop Updates ───────────────────────────────────────────────

function updateDrops(dt: number): void {
  let i = activeDrops.length;
  while (i-- > 0) {
    const d = activeDrops[i];
    d.elapsed += dt;
    if (d.elapsed < d.delay) continue;

    const t = d.elapsed - d.delay;

    if (!d.settled) {
      d.vy += d.gravity * dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.vx *= 0.98;

      if (d.y >= d.groundY) {
        d.y = d.groundY;
        d.vy = -d.vy * d.bounce;
        d.vx *= 0.6;
        if (Math.abs(d.vy) < 15) {
          d.settled = true;
          d.y = d.groundY;
        }
      }
      d.sprite.rotation = t * 5;
    } else {
      d.sprite.rotation = 0;
      d.label.alpha = Math.min(1, d.label.alpha + dt * 3);
      d.gem.y = Math.sin(t * 2) * 1.5;
    }

    d.sprite.x = d.x;
    d.sprite.y = d.y;

    // Fade out after 3s post-delay
    if (t > 3) {
      const fadeProgress = (t - 3) / 1.5;
      d.sprite.alpha = Math.max(0, 1 - fadeProgress);
      if (fadeProgress >= 1) {
        d.sprite.destroy({ children: true });
        activeDrops[i] = activeDrops[activeDrops.length - 1];
        activeDrops.pop();
      }
    }
  }
}

// ─── Coin Updates ───────────────────────────────────────────────

function updateCoins(dt: number): void {
  let i = activeCoins.length;
  while (i-- > 0) {
    const c = activeCoins[i];
    c.elapsed += dt;
    if (c.elapsed < c.delay) continue;

    const t = c.elapsed - c.delay;

    c.vy += 200 * dt;
    c.x += c.vx * dt;
    c.y += c.vy * dt;
    c.vx *= 0.98;

    if (c.y > c.groundY) {
      c.y = c.groundY;
      c.vy *= -0.3;
      c.vx *= 0.5;
    }

    c.sprite.x = c.x;
    c.sprite.y = c.y;
    c.sprite.rotation = t * 8;

    if (t > 1) {
      c.sprite.alpha = Math.max(0, 1 - (t - 1) / 0.8);
    }

    if (t >= 1.8) {
      releaseGraphics(c.sprite);
      activeCoins[i] = activeCoins[activeCoins.length - 1];
      activeCoins.pop();
    }
  }
}

// ─── Orb Updates ────────────────────────────────────────────────

function updateOrbs(dt: number): void {
  let i = activeOrbs.length;
  while (i-- > 0) {
    const o = activeOrbs[i];
    o.elapsed += dt;
    const t = Math.max(0, o.elapsed - o.delay);
    if (t <= 0) continue;

    const dur = 0.8;
    const p = Math.min(1, t / dur);

    if (p < 0.4) {
      const riseP = p / 0.4;
      o.sprite.x = o.startX;
      o.sprite.y = o.startY + (o.peakY - o.startY) * riseP;
    } else {
      const curveP = (p - 0.4) / 0.6;
      const eased = curveP * curveP;
      o.sprite.x = o.startX + (o.targetX - o.startX) * eased;
      o.sprite.y = o.peakY + (o.targetY - o.peakY) * eased;
    }

    o.sprite.alpha = p < 0.8 ? 0.8 : 0.8 * (1 - (p - 0.8) / 0.2);
    o.sprite.scale.set(1 - p * 0.5);

    if (p >= 1) {
      releaseGraphics(o.sprite);
      activeOrbs[i] = activeOrbs[activeOrbs.length - 1];
      activeOrbs.pop();
    }
  }
}

// ─── Public API (same signatures as before) ─────────────────────

/**
 * Creates an animated loot drop from an enemy death position.
 * Items arc outward with physics, bounce, and settle with a glow.
 */
export function spawnLootDrop(
  worldContainer: Container,
  originX: number, originY: number,
  itemName: string,
  rarity: ItemRarity,
  index: number,
): void {
  const color = RARITY_COLORS[rarity] ?? 0xaaaaaa;

  const drop = new Container();
  drop.zIndex = 100000;

  const gem = new Graphics();
  if (rarity === 'legendary' || rarity === 'cosmeric') {
    gem.poly([
      { x: 0, y: -6 }, { x: 5, y: -2 }, { x: 4, y: 3 },
      { x: -4, y: 3 }, { x: -5, y: -2 },
    ]).fill({ color, alpha: 0.9 });
    gem.poly([
      { x: 0, y: -6 }, { x: 5, y: -2 }, { x: 0, y: 0 },
    ]).fill({ color: 0xffffff, alpha: 0.2 });
    gem.circle(0, -2, 7).fill({ color, alpha: 0.1 });
  } else if (rarity === 'epic' || rarity === 'rare') {
    gem.poly([
      { x: 0, y: -5 }, { x: 4, y: 0 },
      { x: 0, y: 5 }, { x: -4, y: 0 },
    ]).fill({ color, alpha: 0.85 });
    gem.poly([
      { x: 0, y: -5 }, { x: 4, y: 0 }, { x: 0, y: 0 },
    ]).fill({ color: 0xffffff, alpha: 0.15 });
  } else {
    gem.circle(0, 0, 3.5).fill({ color, alpha: 0.8 });
    gem.circle(-1, -1, 1.5).fill({ color: 0xffffff, alpha: 0.15 });
  }
  drop.addChild(gem);

  const label = new Text({
    text: itemName.length > 12 ? itemName.substring(0, 12) + '…' : itemName,
    style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 7, fill: color, fontWeight: 'bold' }),
  });
  label.anchor.set(0.5, 0);
  label.y = 7;
  label.alpha = 0;
  drop.addChild(label);

  drop.x = originX;
  drop.y = originY;
  worldContainer.addChild(drop);

  const angle = ((index * 2.4) + Math.random() * 0.5) * Math.PI * 2 / Math.max(index + 1, 3);
  const speed = 60 + Math.random() * 40;

  activeDrops.push({
    sprite: drop,
    gem,
    label,
    x: originX,
    y: originY,
    vx: Math.cos(angle) * speed,
    vy: -80 - Math.random() * 40,
    gravity: 250,
    bounce: 0.4,
    elapsed: 0,
    delay: index * 0.08,
    groundY: originY + 5,
    settled: false,
  });

  ensureRunning();
}

// ─── Gold Coin Burst ─────────────────────────────────────────────

export function spawnGoldBurst(
  worldContainer: Container,
  originX: number, originY: number,
  amount: number,
): void {
  const coinCount = Math.min(8, Math.max(3, Math.floor(amount / 5)));

  for (let i = 0; i < coinCount; i++) {
    const coin = acquireGraphics();
    coin.circle(0, 0, 2.5).fill({ color: 0xeebb33, alpha: 0.9 });
    coin.circle(-0.5, -0.5, 1).fill({ color: 0xffdd66, alpha: 0.4 });
    coin.zIndex = 100000;
    coin.x = originX;
    coin.y = originY;
    worldContainer.addChild(coin);

    const angle = Math.random() * Math.PI * 2;
    const speed = 30 + Math.random() * 50;

    activeCoins.push({
      sprite: coin,
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: -50 - Math.random() * 30,
      elapsed: 0,
      delay: i * 0.04,
      groundY: originY + 5,
    });
  }

  ensureRunning();
}

// ─── XP Orb Animation ────────────────────────────────────────────

export function spawnXPOrbs(
  worldContainer: Container,
  originX: number, originY: number,
  targetX: number, targetY: number,
  amount: number,
): void {
  const orbCount = Math.min(6, Math.max(2, Math.floor(amount / 15)));

  for (let i = 0; i < orbCount; i++) {
    const orb = acquireGraphics();
    orb.circle(0, 0, 2).fill({ color: 0x66cc44, alpha: 0.8 });
    orb.circle(0, 0, 4).fill({ color: 0x66cc44, alpha: 0.15 });
    orb.zIndex = 100000;
    const sx = originX + (Math.random() - 0.5) * 20;
    const sy = originY + (Math.random() - 0.5) * 10;
    orb.x = sx;
    orb.y = sy;
    worldContainer.addChild(orb);

    activeOrbs.push({
      sprite: orb,
      startX: sx,
      startY: sy,
      targetX,
      targetY,
      peakY: sy - 30 - Math.random() * 20,
      elapsed: 0,
      delay: i * 0.1,
    });
  }

  ensureRunning();
}
