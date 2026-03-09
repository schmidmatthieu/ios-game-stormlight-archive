// ─── Particle System with Object Pooling ────────────────────────

import { Container, Graphics } from 'pixi.js';
import { ObjectPool } from '../systems/ObjectPool';
import type { WorldTheme } from './WorldThemes';
import type { Particle } from './ZoneTypes';
import type { WeatherEffect } from '../data/types';

const MAX_PARTICLES = 200;

export class ParticleSystem {
  private particles: Particle[] = [];
  private container: Container;
  private graphicsPool: ObjectPool<Graphics>;

  constructor(parentContainer: Container) {
    this.container = new Container();
    parentContainer.addChild(this.container);

    this.graphicsPool = new ObjectPool<Graphics>(
      () => new Graphics(),
      (g) => { g.clear(); g.alpha = 1; g.scale.set(1); },
      30,
    );
  }

  get particleContainer(): Container {
    return this.container;
  }

  /** Expose particles array for spell effects that push into it */
  get activeParticles(): Particle[] {
    return this.particles;
  }

  spawnAmbient(
    dt: number,
    screenW: number, screenH: number,
    cameraX: number, cameraY: number,
    weather: WeatherEffect | undefined,
    theme: WorldTheme,
  ): void {
    if (this.particles.length >= MAX_PARTICLES) return;

    let rate = 0.3;
    if (weather === 'ashfall') rate = 1.5;
    else if (weather === 'mist') rate = 2;
    else if (weather === 'highstorm') rate = 3;
    else if (weather === 'rain') rate = 2.5;

    if (Math.random() >= rate * dt) return;

    const particle = this.graphicsPool.acquire();
    let px = 0, py = 0, vx = 0, vy = 0, size = 2, life = 3;
    const color = theme.ambientParticleColor;

    if (weather === 'ashfall') {
      px = (Math.random() - 0.5) * screenW * 2;
      py = -screenH / 2 + (Math.random() - 0.5) * 100;
      vx = -8 + Math.random() * 4;
      vy = 15 + Math.random() * 10;
      size = 1 + Math.random() * 2;
      life = 4 + Math.random() * 2;
      particle.circle(0, 0, size).fill({ color: 0x888077, alpha: 0.4 });
    } else if (weather === 'mist') {
      px = (Math.random() - 0.5) * screenW * 2;
      py = (Math.random() - 0.5) * screenH * 2;
      vx = -3 + Math.random() * 6;
      vy = -1 + Math.random() * 2;
      size = 8 + Math.random() * 15;
      life = 5 + Math.random() * 5;
      particle.circle(0, 0, size).fill({ color: 0xaaaaaa, alpha: 0.06 });
    } else if (weather === 'highstorm') {
      px = screenW / 2 + Math.random() * 100;
      py = (Math.random() - 0.5) * screenH * 2;
      vx = -80 - Math.random() * 40;
      vy = 10 + Math.random() * 10;
      size = 1 + Math.random();
      life = 1.5 + Math.random();
      particle.rect(-size * 2, -0.5, size * 4, 1).fill({ color: 0x8899aa, alpha: 0.5 });
    } else {
      px = (Math.random() - 0.5) * screenW * 2;
      py = (Math.random() - 0.5) * screenH * 2;
      vx = (Math.random() - 0.5) * 4;
      vy = -3 + Math.random() * 2;
      size = 1 + Math.random();
      life = 3 + Math.random() * 3;
      particle.circle(0, 0, size).fill({ color, alpha: 0.2 });
    }

    particle.x = px - cameraX + screenW / 2;
    particle.y = py - cameraY + screenH / 2;
    this.container.addChild(particle);

    this.particles.push({
      sprite: particle, x: particle.x, y: particle.y,
      vx, vy, life, maxLife: life, size,
    });
  }

  update(dt: number): void {
    let i = this.particles.length;
    while (i-- > 0) {
      const p = this.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.sprite.x = p.x;
      p.sprite.y = p.y;
      p.sprite.alpha = Math.min(1, p.life / p.maxLife) * 0.6;

      if (p.life <= 0) {
        this.container.removeChild(p.sprite);
        this.graphicsPool.release(p.sprite);
        // Swap-and-pop: O(1) instead of splice O(n)
        this.particles[i] = this.particles[this.particles.length - 1];
        this.particles.pop();
      }
    }
  }

  /** Add a pre-created particle (used by spell effects / death particles) */
  addParticle(p: Particle): void {
    this.particles.push(p);
  }

  /** Create a pooled Graphics for external use (death particles, etc.) */
  acquireGraphics(): Graphics {
    return this.graphicsPool.acquire();
  }

  /** Return a Graphics to the pool */
  releaseGraphics(g: Graphics): void {
    this.graphicsPool.release(g);
  }

  destroy(): void {
    for (const p of this.particles) {
      this.container.removeChild(p.sprite);
      this.graphicsPool.release(p.sprite);
    }
    this.particles.length = 0;
    this.container.destroy({ children: true });
  }
}
