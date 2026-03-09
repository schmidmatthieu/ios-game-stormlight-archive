import { Container, Graphics, Text, TextStyle } from 'pixi.js';

// ─── Weather Types & Transitions ─────────────────────────────────

export type WeatherType = 'clear' | 'ashfall' | 'mist' | 'highstorm' | 'rain'
  | 'sandstorm' | 'colorDrain' | 'aonGlow' | 'nightmareAura' | 'cognitiveFlux';

interface WeatherConfig {
  name: string;
  overlayColor: number;
  overlayAlpha: number;
  screenShake: number;
  lightLevel: number; // 0 = dark, 1 = normal
  speedModifier: number;
  damagePerTick: number;
  message: string;
}

const WEATHER_CONFIGS: Record<WeatherType, WeatherConfig> = {
  clear: { name: 'Clair', overlayColor: 0x000000, overlayAlpha: 0, screenShake: 0, lightLevel: 1, speedModifier: 1, damagePerTick: 0, message: '' },
  ashfall: { name: 'Chute de Cendres', overlayColor: 0x332211, overlayAlpha: 0.08, screenShake: 0, lightLevel: 0.85, speedModifier: 0.95, damagePerTick: 0, message: '🌋 Les cendres tombent du ciel...' },
  mist: { name: 'Brumes', overlayColor: 0xaaaaaa, overlayAlpha: 0.06, screenShake: 0, lightLevel: 0.7, speedModifier: 1, damagePerTick: 0, message: '🌫 Les brumes s\'épaississent...' },
  highstorm: { name: 'Haute Tempête', overlayColor: 0x223344, overlayAlpha: 0.15, screenShake: 2, lightLevel: 0.4, speedModifier: 0.7, damagePerTick: 2, message: '⛈ Une haute tempête approche!' },
  rain: { name: 'Pluie', overlayColor: 0x112233, overlayAlpha: 0.05, screenShake: 0, lightLevel: 0.8, speedModifier: 0.9, damagePerTick: 0, message: '🌧 La pluie commence à tomber...' },
  sandstorm: { name: 'Tempête de Sable', overlayColor: 0x443322, overlayAlpha: 0.12, screenShake: 1, lightLevel: 0.5, speedModifier: 0.6, damagePerTick: 1, message: '🌪 Tempête de sable!' },
  colorDrain: { name: 'Drain de Couleur', overlayColor: 0x222222, overlayAlpha: 0.1, screenShake: 0, lightLevel: 0.6, speedModifier: 1, damagePerTick: 0, message: '🎨 Les couleurs se fanent...' },
  aonGlow: { name: 'Résonance Aonique', overlayColor: 0xddcc44, overlayAlpha: 0.03, screenShake: 0, lightLevel: 1.2, speedModifier: 1.1, damagePerTick: 0, message: '✦ Les Aons brillent plus fort!' },
  nightmareAura: { name: 'Aura Cauchemardesque', overlayColor: 0x220033, overlayAlpha: 0.1, screenShake: 0.5, lightLevel: 0.5, speedModifier: 0.85, damagePerTick: 0.5, message: '👁 L\'aura des cauchemars s\'intensifie...' },
  cognitiveFlux: { name: 'Flux Cognitif', overlayColor: 0x110044, overlayAlpha: 0.08, screenShake: 0.3, lightLevel: 0.7, speedModifier: 1, damagePerTick: 0, message: '💎 Le flux cognitif ondule...' },
};

// World-specific weather cycles
const WORLD_WEATHER_CYCLES: Record<string, { weather: WeatherType; duration: number; chance: number }[]> = {
  scadrial: [
    { weather: 'clear', duration: 30, chance: 0.3 },
    { weather: 'mist', duration: 25, chance: 0.4 },
    { weather: 'ashfall', duration: 20, chance: 0.3 },
  ],
  roshar: [
    { weather: 'clear', duration: 25, chance: 0.3 },
    { weather: 'rain', duration: 15, chance: 0.3 },
    { weather: 'highstorm', duration: 12, chance: 0.4 },
  ],
  taldain: [
    { weather: 'clear', duration: 35, chance: 0.5 },
    { weather: 'sandstorm', duration: 15, chance: 0.5 },
  ],
  nalthis: [
    { weather: 'clear', duration: 30, chance: 0.6 },
    { weather: 'colorDrain', duration: 20, chance: 0.4 },
  ],
  sel: [
    { weather: 'clear', duration: 25, chance: 0.5 },
    { weather: 'aonGlow', duration: 20, chance: 0.5 },
  ],
  komashi: [
    { weather: 'clear', duration: 20, chance: 0.3 },
    { weather: 'nightmareAura', duration: 25, chance: 0.7 },
  ],
  shadesmar: [
    { weather: 'clear', duration: 25, chance: 0.4 },
    { weather: 'cognitiveFlux', duration: 20, chance: 0.6 },
  ],
};

// ─── Weather Manager ─────────────────────────────────────────────

export class WeatherManager {
  private worldID: string;
  currentWeather: WeatherType = 'clear';
  private timer = 0;
  private currentDuration = 30;
  private transitionProgress = 1; // 0 = transitioning, 1 = stable
  private previousWeather: WeatherType = 'clear';

  // Lightning for highstorms
  private lightningTimer = 0;
  lightningFlash = 0;

  constructor(worldID: string) {
    this.worldID = worldID;
    this.pickNextWeather();
  }

  private pickNextWeather(): void {
    const cycle = WORLD_WEATHER_CYCLES[this.worldID] ?? [{ weather: 'clear' as WeatherType, duration: 60, chance: 1 }];
    const roll = Math.random();
    let cumulative = 0;
    for (const entry of cycle) {
      cumulative += entry.chance;
      if (roll <= cumulative) {
        this.previousWeather = this.currentWeather;
        this.currentWeather = entry.weather;
        this.currentDuration = entry.duration + (Math.random() - 0.5) * 10;
        this.transitionProgress = 0;
        return;
      }
    }
    this.currentWeather = 'clear';
    this.currentDuration = 30;
  }

  update(dt: number): { changed: boolean; message: string | null; config: WeatherConfig } {
    this.timer += dt;

    // Transition blending
    if (this.transitionProgress < 1) {
      this.transitionProgress = Math.min(1, this.transitionProgress + dt * 0.3);
    }

    // Check for weather change
    let changed = false;
    let message: string | null = null;
    if (this.timer >= this.currentDuration) {
      this.timer = 0;
      const oldWeather = this.currentWeather;
      this.pickNextWeather();
      if (this.currentWeather !== oldWeather) {
        changed = true;
        const cfg = WEATHER_CONFIGS[this.currentWeather];
        message = cfg.message || null;
      }
    }

    // Lightning during highstorms
    if (this.currentWeather === 'highstorm') {
      this.lightningTimer += dt;
      if (this.lightningTimer > 3 + Math.random() * 4) {
        this.lightningTimer = 0;
        this.lightningFlash = 1;
      }
    }
    this.lightningFlash = Math.max(0, this.lightningFlash - dt * 5);

    return { changed, message, config: this.getBlendedConfig() };
  }

  private getBlendedConfig(): WeatherConfig {
    if (this.transitionProgress >= 1) return WEATHER_CONFIGS[this.currentWeather];
    const prev = WEATHER_CONFIGS[this.previousWeather];
    const next = WEATHER_CONFIGS[this.currentWeather];
    const t = this.transitionProgress;
    return {
      name: next.name,
      overlayColor: next.overlayColor,
      overlayAlpha: prev.overlayAlpha + (next.overlayAlpha - prev.overlayAlpha) * t,
      screenShake: prev.screenShake + (next.screenShake - prev.screenShake) * t,
      lightLevel: prev.lightLevel + (next.lightLevel - prev.lightLevel) * t,
      speedModifier: prev.speedModifier + (next.speedModifier - prev.speedModifier) * t,
      damagePerTick: prev.damagePerTick + (next.damagePerTick - prev.damagePerTick) * t,
      message: next.message,
    };
  }

  getConfig(): WeatherConfig {
    return WEATHER_CONFIGS[this.currentWeather];
  }
}

// ─── Rain Drops ─────────────────────────────────────────────────

interface RainDrop {
  x: number; y: number;
  speed: number; length: number;
  windOffset: number;
}

interface RainSplash {
  x: number; y: number;
  life: number; maxLife: number;
  radius: number;
}

// ─── Lightning Bolt Generator ────────────────────────────────────

function drawLightningBolt(
  g: Graphics, x1: number, y1: number, x2: number, y2: number,
  width: number, alpha: number, depth: number,
): void {
  if (depth <= 0) {
    g.moveTo(x1, y1).lineTo(x2, y2).stroke({ color: 0xccddff, width, alpha });
    return;
  }
  const mx = (x1 + x2) / 2 + (Math.random() - 0.5) * 40;
  const my = (y1 + y2) / 2 + (Math.random() - 0.5) * 20;
  drawLightningBolt(g, x1, y1, mx, my, width, alpha, depth - 1);
  drawLightningBolt(g, mx, my, x2, y2, width * 0.9, alpha * 0.9, depth - 1);
  // Branch
  if (Math.random() > 0.5 && depth > 1) {
    const bx = mx + (Math.random() - 0.5) * 60;
    const by = my + Math.random() * 40 + 10;
    drawLightningBolt(g, mx, my, bx, by, width * 0.5, alpha * 0.4, depth - 2);
  }
}

// ─── Weather Overlay Renderer ────────────────────────────────────

export function createWeatherOverlay(
  uiContainer: Container,
  screenW: number, screenH: number,
): { overlay: Graphics; label: Text; update: (config: WeatherConfig, lightning: number, weatherType?: WeatherType, time?: number) => void } {
  const overlay = new Graphics();
  overlay.zIndex = 500;
  overlay.eventMode = 'none';
  uiContainer.addChild(overlay);

  const label = new Text({
    text: '',
    style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 7, fill: 0x888899 }),
  });
  label.anchor.set(1, 1);
  label.x = screenW - 12;
  label.y = screenH - 8;
  label.zIndex = 501;
  uiContainer.addChild(label);

  // Rain state
  const rainDrops: RainDrop[] = [];
  const rainSplashes: RainSplash[] = [];
  const MAX_RAIN = 80;
  const MAX_SPLASH = 30;

  // Sand particles for sandstorm
  const sandParticles: { x: number; y: number; speed: number; size: number; alpha: number }[] = [];
  const MAX_SAND = 60;

  // Fog wisps
  const fogWisps: { x: number; y: number; radius: number; phase: number; speed: number }[] = [];
  for (let i = 0; i < 6; i++) {
    fogWisps.push({
      x: Math.random() * screenW,
      y: screenH * 0.3 + Math.random() * screenH * 0.5,
      radius: 40 + Math.random() * 60,
      phase: Math.random() * Math.PI * 2,
      speed: 0.3 + Math.random() * 0.4,
    });
  }

  return {
    overlay,
    label,
    update(config: WeatherConfig, lightning: number, weatherType?: WeatherType, time?: number) {
      overlay.clear();
      const wType = weatherType ?? 'clear';
      const gt = time ?? 0;

      // Base weather overlay
      if (config.overlayAlpha > 0.001) {
        overlay.rect(0, 0, screenW, screenH)
          .fill({ color: config.overlayColor, alpha: config.overlayAlpha });
      }

      // ── Rain with splash ──
      if (wType === 'rain' || wType === 'highstorm') {
        const windAngle = wType === 'highstorm' ? 0.4 : 0.15;
        const intensity = wType === 'highstorm' ? 1.5 : 1;

        // Spawn new drops
        while (rainDrops.length < MAX_RAIN) {
          rainDrops.push({
            x: Math.random() * (screenW + 100) - 50,
            y: -Math.random() * screenH * 0.5,
            speed: (300 + Math.random() * 200) * intensity,
            length: (8 + Math.random() * 12) * intensity,
            windOffset: windAngle * (0.8 + Math.random() * 0.4),
          });
        }

        // Draw and update drops
        for (let i = rainDrops.length - 1; i >= 0; i--) {
          const d = rainDrops[i];
          const dt = 1 / 60;
          d.y += d.speed * dt;
          d.x += d.windOffset * d.speed * dt;

          const alpha = 0.15 + Math.random() * 0.1;
          overlay.moveTo(d.x, d.y)
            .lineTo(d.x + d.windOffset * d.length, d.y + d.length)
            .stroke({ color: 0x88aacc, width: 1, alpha });

          if (d.y > screenH) {
            // Create splash
            if (rainSplashes.length < MAX_SPLASH) {
              rainSplashes.push({
                x: d.x, y: screenH - 2 - Math.random() * 20,
                life: 0, maxLife: 0.2 + Math.random() * 0.1,
                radius: 2 + Math.random() * 3,
              });
            }
            rainDrops.splice(i, 1);
          }
        }

        // Draw and update splashes
        for (let i = rainSplashes.length - 1; i >= 0; i--) {
          const s = rainSplashes[i];
          s.life += 1 / 60;
          const t = s.life / s.maxLife;
          if (t >= 1) { rainSplashes.splice(i, 1); continue; }
          const r = s.radius * (0.5 + t);
          const alpha = 0.2 * (1 - t);
          overlay.circle(s.x, s.y, r).stroke({ color: 0x88aacc, width: 0.5, alpha });
          // Small droplet bounce
          if (t < 0.4) {
            const bounceH = s.radius * 2 * (1 - t / 0.4);
            overlay.circle(s.x - 2, s.y - bounceH, 0.8).fill({ color: 0x88aacc, alpha: alpha * 0.6 });
            overlay.circle(s.x + 2, s.y - bounceH * 0.7, 0.6).fill({ color: 0x88aacc, alpha: alpha * 0.4 });
          }
        }
      } else {
        rainDrops.length = 0;
        rainSplashes.length = 0;
      }

      // ── Lightning bolt ──
      if (lightning > 0.01) {
        overlay.rect(0, 0, screenW, screenH)
          .fill({ color: 0xeeeeff, alpha: lightning * 0.25 });
        // Draw procedural lightning bolt
        if (lightning > 0.5) {
          const boltX = screenW * (0.2 + Math.random() * 0.6);
          drawLightningBolt(overlay, boltX, 0, boltX + (Math.random() - 0.5) * 80, screenH * 0.6,
            2.5, lightning * 0.6, 4);
          // Glow around bolt origin
          overlay.circle(boltX, screenH * 0.3, 30).fill({ color: 0xccddff, alpha: lightning * 0.08 });
        }
      }

      // ── Sandstorm particles ──
      if (wType === 'sandstorm') {
        while (sandParticles.length < MAX_SAND) {
          sandParticles.push({
            x: -10, y: Math.random() * screenH,
            speed: 200 + Math.random() * 300,
            size: 1 + Math.random() * 3,
            alpha: 0.1 + Math.random() * 0.2,
          });
        }
        for (let i = sandParticles.length - 1; i >= 0; i--) {
          const p = sandParticles[i];
          p.x += p.speed / 60;
          p.y += (Math.sin(gt * 3 + p.x * 0.01) * 2);
          if (p.x > screenW + 10) { sandParticles.splice(i, 1); continue; }
          overlay.circle(p.x, p.y, p.size).fill({ color: 0xccbb88, alpha: p.alpha });
        }
        // Directional streaks
        for (let i = 0; i < 8; i++) {
          const sy = Math.random() * screenH;
          const sx = Math.random() * screenW;
          overlay.moveTo(sx, sy).lineTo(sx + 30 + Math.random() * 40, sy + (Math.random() - 0.5) * 4)
            .stroke({ color: 0xccbb88, width: 0.5, alpha: 0.06 });
        }
      } else {
        sandParticles.length = 0;
      }

      // ── Volumetric fog for mist ──
      if (wType === 'mist') {
        for (const wisp of fogWisps) {
          wisp.x += Math.sin(gt * wisp.speed + wisp.phase) * 0.5;
          wisp.y += Math.cos(gt * wisp.speed * 0.7 + wisp.phase) * 0.3;
          // Wrap around
          if (wisp.x > screenW + wisp.radius) wisp.x = -wisp.radius;
          if (wisp.x < -wisp.radius) wisp.x = screenW + wisp.radius;

          const pulsate = 1 + Math.sin(gt * 0.8 + wisp.phase) * 0.15;
          const r = wisp.radius * pulsate;
          // Multi-layer soft fog
          overlay.circle(wisp.x, wisp.y, r).fill({ color: 0xaaaaaa, alpha: 0.02 });
          overlay.circle(wisp.x, wisp.y, r * 0.7).fill({ color: 0xbbbbbb, alpha: 0.025 });
          overlay.circle(wisp.x, wisp.y, r * 0.4).fill({ color: 0xcccccc, alpha: 0.015 });
        }
      }

      // ── Nightmare aura distortion ──
      if (wType === 'nightmareAura') {
        for (let i = 0; i < 4; i++) {
          const ax = screenW * (0.15 + i * 0.25) + Math.sin(gt * 0.6 + i * 2) * 30;
          const ay = screenH * 0.5 + Math.cos(gt * 0.4 + i * 1.5) * 40;
          const ar = 30 + Math.sin(gt + i) * 10;
          overlay.circle(ax, ay, ar).fill({ color: 0x220033, alpha: 0.04 });
          overlay.circle(ax, ay, ar * 0.5).fill({ color: 0x330044, alpha: 0.03 });
        }
      }

      // ── Cognitive flux ripples ──
      if (wType === 'cognitiveFlux') {
        for (let i = 0; i < 3; i++) {
          const cx = screenW * (0.2 + i * 0.3);
          const cy = screenH * 0.5;
          const phase = gt * 0.5 + i * 2;
          const rBase = 20 + Math.sin(phase) * 10;
          for (let r = 0; r < 3; r++) {
            const radius = rBase + r * 15 + Math.sin(phase + r) * 5;
            overlay.circle(cx, cy, radius).stroke({ color: 0x6644aa, width: 0.5, alpha: 0.04 - r * 0.01 });
          }
        }
      }

      // Darkness
      if (config.lightLevel < 0.9) {
        const darkAlpha = (1 - config.lightLevel) * 0.3;
        overlay.rect(0, 0, screenW, screenH)
          .fill({ color: 0x000000, alpha: darkAlpha });
      }

      // Vignette effect during storms
      if (wType === 'highstorm' || wType === 'sandstorm' || wType === 'nightmareAura') {
        const vigStrength = wType === 'highstorm' ? 0.15 : 0.1;
        const vigColor = wType === 'sandstorm' ? 0x332200 : 0x000000;
        // Corner shadows
        const cr = Math.max(screenW, screenH) * 0.6;
        overlay.circle(0, 0, cr).fill({ color: vigColor, alpha: vigStrength * 0.5 });
        overlay.circle(screenW, 0, cr).fill({ color: vigColor, alpha: vigStrength * 0.5 });
        overlay.circle(0, screenH, cr).fill({ color: vigColor, alpha: vigStrength * 0.5 });
        overlay.circle(screenW, screenH, cr).fill({ color: vigColor, alpha: vigStrength * 0.5 });
      }

      label.text = config.name !== 'Clair' ? config.name : '';
    },
  };
}
