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

// ─── Weather Overlay Renderer ────────────────────────────────────

export function createWeatherOverlay(
  uiContainer: Container,
  screenW: number, screenH: number,
): { overlay: Graphics; label: Text; update: (config: WeatherConfig, lightning: number) => void } {
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

  return {
    overlay,
    label,
    update(config: WeatherConfig, lightning: number) {
      overlay.clear();
      if (config.overlayAlpha > 0.001) {
        overlay.rect(0, 0, screenW, screenH)
          .fill({ color: config.overlayColor, alpha: config.overlayAlpha });
      }
      // Lightning flash
      if (lightning > 0.01) {
        overlay.rect(0, 0, screenW, screenH)
          .fill({ color: 0xffffff, alpha: lightning * 0.3 });
      }
      // Darkness
      if (config.lightLevel < 0.9) {
        const darkAlpha = (1 - config.lightLevel) * 0.3;
        overlay.rect(0, 0, screenW, screenH)
          .fill({ color: 0x000000, alpha: darkAlpha });
      }
      label.text = config.name !== 'Clair' ? config.name : '';
    },
  };
}
