import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { RARITY_COLORS } from '../data/types';
import type { ItemRarity } from '../data/types';

// ─── Loot Drop Animation ─────────────────────────────────────────

interface LootDrop {
  sprite: Container;
  x: number; y: number;
  vx: number; vy: number;
  gravity: number;
  bounce: number;
  elapsed: number;
  settled: boolean;
  rarity: ItemRarity;
}

const activeDrops: LootDrop[] = [];

/**
 * Creates an animated loot drop from an enemy death position.
 * Items arc outward with physics, bounce, and settle with a glow.
 */
export function spawnLootDrop(
  worldContainer: Container,
  originX: number, originY: number,
  itemName: string,
  rarity: ItemRarity,
  index: number, // For multiple drops to spread
): void {
  const color = RARITY_COLORS[rarity] ?? 0xaaaaaa;

  const drop = new Container();
  drop.zIndex = 100000;

  // Item visual - small chest/gem based on rarity
  const gem = new Graphics();

  if (rarity === 'legendary' || rarity === 'cosmeric') {
    // Fancy gem shape
    gem.poly([
      { x: 0, y: -6 }, { x: 5, y: -2 }, { x: 4, y: 3 },
      { x: -4, y: 3 }, { x: -5, y: -2 },
    ]).fill({ color, alpha: 0.9 });
    gem.poly([
      { x: 0, y: -6 }, { x: 5, y: -2 }, { x: 0, y: 0 },
    ]).fill({ color: 0xffffff, alpha: 0.2 });
    // Sparkle
    gem.circle(0, -2, 7).fill({ color, alpha: 0.1 });
  } else if (rarity === 'epic' || rarity === 'rare') {
    // Diamond shape
    gem.poly([
      { x: 0, y: -5 }, { x: 4, y: 0 },
      { x: 0, y: 5 }, { x: -4, y: 0 },
    ]).fill({ color, alpha: 0.85 });
    gem.poly([
      { x: 0, y: -5 }, { x: 4, y: 0 }, { x: 0, y: 0 },
    ]).fill({ color: 0xffffff, alpha: 0.15 });
  } else {
    // Simple circle
    gem.circle(0, 0, 3.5).fill({ color, alpha: 0.8 });
    gem.circle(-1, -1, 1.5).fill({ color: 0xffffff, alpha: 0.15 });
  }
  drop.addChild(gem);

  // Item name label (appears after settling)
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

  // Calculate initial velocity - arc outward
  const angle = ((index * 2.4) + Math.random() * 0.5) * Math.PI * 2 / Math.max(index + 1, 3);
  const speed = 60 + Math.random() * 40;

  const lootDrop: LootDrop = {
    sprite: drop,
    x: originX,
    y: originY,
    vx: Math.cos(angle) * speed,
    vy: -80 - Math.random() * 40, // Launch upward
    gravity: 250,
    bounce: 0.4,
    elapsed: 0,
    settled: false,
    rarity,
  };

  activeDrops.push(lootDrop);

  // Animate
  const groundY = originY + 5;
  const anim = () => {
    const dt = 1 / 60;
    lootDrop.elapsed += dt;

    if (!lootDrop.settled) {
      // Physics
      lootDrop.vy += lootDrop.gravity * dt;
      lootDrop.x += lootDrop.vx * dt;
      lootDrop.y += lootDrop.vy * dt;
      lootDrop.vx *= 0.98; // Air friction

      // Ground collision
      if (lootDrop.y >= groundY) {
        lootDrop.y = groundY;
        lootDrop.vy = -lootDrop.vy * lootDrop.bounce;
        lootDrop.vx *= 0.6;

        // Settle if low velocity
        if (Math.abs(lootDrop.vy) < 15) {
          lootDrop.settled = true;
          lootDrop.y = groundY;
        }
      }

      // Spin while in air
      drop.rotation = lootDrop.elapsed * 5;
    } else {
      // Settled - stop spinning, show label
      drop.rotation = 0;
      label.alpha = Math.min(1, label.alpha + dt * 3);

      // Gentle hover
      gem.y = Math.sin(lootDrop.elapsed * 2) * 1.5;
    }

    drop.x = lootDrop.x;
    drop.y = lootDrop.y;

    // Fade out after 4 seconds
    if (lootDrop.elapsed > 3) {
      const fadeProgress = (lootDrop.elapsed - 3) / 1.5;
      drop.alpha = Math.max(0, 1 - fadeProgress);
      if (fadeProgress >= 1) {
        drop.destroy({ children: true });
        const idx = activeDrops.indexOf(lootDrop);
        if (idx >= 0) activeDrops.splice(idx, 1);
        return;
      }
    }

    requestAnimationFrame(anim);
  };

  // Stagger start slightly based on index
  setTimeout(() => requestAnimationFrame(anim), index * 80);
}

// ─── Gold Coin Burst ─────────────────────────────────────────────

export function spawnGoldBurst(
  worldContainer: Container,
  originX: number, originY: number,
  amount: number,
): void {
  const coinCount = Math.min(8, Math.max(3, Math.floor(amount / 5)));

  for (let i = 0; i < coinCount; i++) {
    const coin = new Graphics();
    coin.circle(0, 0, 2.5).fill({ color: 0xeebb33, alpha: 0.9 });
    coin.circle(-0.5, -0.5, 1).fill({ color: 0xffdd66, alpha: 0.4 });
    coin.zIndex = 100000;
    coin.x = originX;
    coin.y = originY;
    worldContainer.addChild(coin);

    const angle = Math.random() * Math.PI * 2;
    const speed = 30 + Math.random() * 50;
    let vx = Math.cos(angle) * speed;
    let vy = -50 - Math.random() * 30;
    let x = originX;
    let y = originY;
    let elapsed = 0;
    const groundY = originY + 5;

    const anim = () => {
      elapsed += 1 / 60;
      vy += 200 * (1 / 60);
      x += vx * (1 / 60);
      y += vy * (1 / 60);
      vx *= 0.98;

      if (y > groundY) {
        y = groundY;
        vy *= -0.3;
        vx *= 0.5;
      }

      coin.x = x;
      coin.y = y;
      coin.rotation = elapsed * 8;

      // Fade after 1.5s
      if (elapsed > 1) {
        coin.alpha = Math.max(0, 1 - (elapsed - 1) / 0.8);
      }

      if (elapsed < 1.8) requestAnimationFrame(anim);
      else coin.destroy();
    };

    setTimeout(() => requestAnimationFrame(anim), i * 40);
  }
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
    const orb = new Graphics();
    orb.circle(0, 0, 2).fill({ color: 0x66cc44, alpha: 0.8 });
    orb.circle(0, 0, 4).fill({ color: 0x66cc44, alpha: 0.15 });
    orb.zIndex = 100000;
    orb.x = originX + (Math.random() - 0.5) * 20;
    orb.y = originY + (Math.random() - 0.5) * 10;
    worldContainer.addChild(orb);

    let elapsed = 0;
    const startX = orb.x;
    const startY = orb.y;
    // Rise up first, then curve toward player
    const peakY = startY - 30 - Math.random() * 20;
    const delay = i * 0.1;

    const anim = () => {
      elapsed += 1 / 60;
      const t = Math.max(0, elapsed - delay);

      if (t <= 0) {
        requestAnimationFrame(anim);
        return;
      }

      const dur = 0.8;
      const p = Math.min(1, t / dur);

      if (p < 0.4) {
        // Rise up
        const riseP = p / 0.4;
        orb.x = startX;
        orb.y = startY + (peakY - startY) * riseP;
      } else {
        // Curve to player
        const curveP = (p - 0.4) / 0.6;
        const eased = curveP * curveP; // Ease in
        orb.x = startX + (targetX - startX) * eased;
        orb.y = peakY + (targetY - peakY) * eased;
      }

      orb.alpha = p < 0.8 ? 0.8 : 0.8 * (1 - (p - 0.8) / 0.2);
      orb.scale.set(1 - p * 0.5);

      if (p < 1) requestAnimationFrame(anim);
      else orb.destroy();
    };

    requestAnimationFrame(anim);
  }
}
