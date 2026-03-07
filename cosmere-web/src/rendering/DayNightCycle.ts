import { Graphics, Container, Text, TextStyle } from 'pixi.js';

// ─── Time of Day ─────────────────────────────────────────────

export type TimeOfDay = 'dawn' | 'morning' | 'midday' | 'afternoon' | 'dusk' | 'evening' | 'night' | 'lateNight';

interface TimeConfig {
  label: string;
  overlayColor: number;
  overlayAlpha: number;
  lightLevel: number; // 0-1, affects enemy detection and visibility
  tintColor: number;
  ambientAlpha: number;
  starAlpha: number;
}

const TIME_CONFIGS: Record<TimeOfDay, TimeConfig> = {
  dawn:      { label: 'Aube',         overlayColor: 0xffaa44, overlayAlpha: 0.08, lightLevel: 0.7, tintColor: 0xffddaa, ambientAlpha: 0.05, starAlpha: 0.1 },
  morning:   { label: 'Matin',        overlayColor: 0xffffcc, overlayAlpha: 0.03, lightLevel: 0.9, tintColor: 0xffffff, ambientAlpha: 0.0,  starAlpha: 0.0 },
  midday:    { label: 'Midi',         overlayColor: 0xffffff, overlayAlpha: 0.02, lightLevel: 1.0, tintColor: 0xffffff, ambientAlpha: 0.0,  starAlpha: 0.0 },
  afternoon: { label: 'Après-midi',   overlayColor: 0xffeecc, overlayAlpha: 0.03, lightLevel: 0.95,tintColor: 0xffeedd, ambientAlpha: 0.0,  starAlpha: 0.0 },
  dusk:      { label: 'Crépuscule',   overlayColor: 0xff6633, overlayAlpha: 0.12, lightLevel: 0.6, tintColor: 0xffaa77, ambientAlpha: 0.08, starAlpha: 0.15 },
  evening:   { label: 'Soir',         overlayColor: 0x2233aa, overlayAlpha: 0.18, lightLevel: 0.4, tintColor: 0x8899cc, ambientAlpha: 0.12, starAlpha: 0.5 },
  night:     { label: 'Nuit',         overlayColor: 0x111133, overlayAlpha: 0.3,  lightLevel: 0.2, tintColor: 0x6677aa, ambientAlpha: 0.2,  starAlpha: 0.9 },
  lateNight: { label: 'Nuit profonde',overlayColor: 0x0a0a22, overlayAlpha: 0.35, lightLevel: 0.15,tintColor: 0x556699, ambientAlpha: 0.25, starAlpha: 1.0 },
};

const TIME_ORDER: TimeOfDay[] = ['dawn', 'morning', 'midday', 'afternoon', 'dusk', 'evening', 'night', 'lateNight'];

// World-specific day length multipliers (some worlds have longer/shorter days)
const WORLD_DAY_SPEED: Record<string, number> = {
  scadrial: 1.0,
  roshar: 0.8,    // Roshar has longer days
  taldain: 1.2,   // Taldain rotates faster (tidally locked but gameplay-wise)
  nalthis: 1.0,
  sel: 0.9,
  komashi: 1.1,
  shadesmar: 0.5,  // Cognitive realm - very slow time
};

// ─── Day/Night Manager ───────────────────────────────────────

export class DayNightManager {
  private dayTimer = 0;
  private cycleLength: number; // seconds per full day
  private worldSpeed: number;

  currentTime: TimeOfDay = 'morning';
  private currentIndex = 1; // morning
  private phaseTimer = 0;
  private phaseLength: number;

  // Transition blending
  private blendProgress = 0;
  private isTransitioning = false;
  private prevConfig: TimeConfig;
  private nextConfig: TimeConfig;

  constructor(worldID: string, startTime?: TimeOfDay) {
    this.worldSpeed = WORLD_DAY_SPEED[worldID] ?? 1.0;
    this.cycleLength = 240 / this.worldSpeed; // 4 min per full cycle
    this.phaseLength = this.cycleLength / TIME_ORDER.length;

    if (startTime) {
      this.currentIndex = TIME_ORDER.indexOf(startTime);
      if (this.currentIndex < 0) this.currentIndex = 1;
      this.currentTime = TIME_ORDER[this.currentIndex];
    }

    this.prevConfig = TIME_CONFIGS[this.currentTime];
    this.nextConfig = this.prevConfig;
  }

  update(dt: number): { config: TimeConfig; changed: boolean; message: string | null; blendedConfig: BlendedTimeConfig } {
    this.phaseTimer += dt;
    this.dayTimer += dt;
    let changed = false;
    let message: string | null = null;

    // Transition blending
    if (this.isTransitioning) {
      this.blendProgress = Math.min(1, this.blendProgress + dt * 0.5); // 2 second blend
      if (this.blendProgress >= 1) {
        this.isTransitioning = false;
        this.prevConfig = this.nextConfig;
      }
    }

    // Phase change
    if (this.phaseTimer >= this.phaseLength) {
      this.phaseTimer -= this.phaseLength;
      this.currentIndex = (this.currentIndex + 1) % TIME_ORDER.length;
      this.currentTime = TIME_ORDER[this.currentIndex];

      this.prevConfig = this.nextConfig;
      this.nextConfig = TIME_CONFIGS[this.currentTime];
      this.isTransitioning = true;
      this.blendProgress = 0;
      changed = true;
      message = this.nextConfig.label;
    }

    // Blend configs
    const blended = this.blendConfigs(this.prevConfig, this.nextConfig, this.blendProgress);

    return {
      config: TIME_CONFIGS[this.currentTime],
      changed,
      message,
      blendedConfig: blended,
    };
  }

  private blendConfigs(a: TimeConfig, b: TimeConfig, t: number): BlendedTimeConfig {
    return {
      overlayColor: t < 0.5 ? a.overlayColor : b.overlayColor,
      overlayAlpha: a.overlayAlpha + (b.overlayAlpha - a.overlayAlpha) * t,
      lightLevel: a.lightLevel + (b.lightLevel - a.lightLevel) * t,
      ambientAlpha: a.ambientAlpha + (b.ambientAlpha - a.ambientAlpha) * t,
      starAlpha: a.starAlpha + (b.starAlpha - a.starAlpha) * t,
      label: b.label,
    };
  }

  get isNight(): boolean {
    return this.currentTime === 'night' || this.currentTime === 'lateNight' || this.currentTime === 'evening';
  }

  get lightLevel(): number {
    if (!this.isTransitioning) return TIME_CONFIGS[this.currentTime].lightLevel;
    const a = this.prevConfig.lightLevel;
    const b = this.nextConfig.lightLevel;
    return a + (b - a) * this.blendProgress;
  }
}

export interface BlendedTimeConfig {
  overlayColor: number;
  overlayAlpha: number;
  lightLevel: number;
  ambientAlpha: number;
  starAlpha: number;
  label: string;
}

// ─── Day/Night Overlay ───────────────────────────────────────

export function createDayNightOverlay(
  uiContainer: Container,
  screenW: number, screenH: number,
): {
  overlay: Graphics;
  stars: Container;
  timeLabel: Text;
  update: (config: BlendedTimeConfig) => void;
} {
  // Stars layer
  const stars = new Container();
  stars.zIndex = 900;
  const starGraphics: { g: Graphics; baseAlpha: number; speed: number }[] = [];

  for (let i = 0; i < 40; i++) {
    const star = new Graphics();
    const size = 0.5 + Math.random() * 1.5;
    star.circle(0, 0, size).fill({ color: 0xffffff, alpha: 0.8 });
    star.x = Math.random() * screenW;
    star.y = Math.random() * screenH * 0.6;
    star.alpha = 0;
    stars.addChild(star);
    starGraphics.push({ g: star, baseAlpha: 0.3 + Math.random() * 0.7, speed: 0.5 + Math.random() * 2 });
  }
  uiContainer.addChild(stars);

  // Ambient overlay
  const overlay = new Graphics();
  overlay.zIndex = 901;
  overlay.rect(0, 0, screenW, screenH).fill({ color: 0x000000, alpha: 0 });
  uiContainer.addChild(overlay);

  // Time label (top center)
  const timeLabel = new Text({
    text: '',
    style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 7, fill: 0xaaaaaa }),
  });
  timeLabel.anchor.set(0.5, 0);
  timeLabel.x = screenW / 2;
  timeLabel.y = 42;
  timeLabel.zIndex = 902;
  uiContainer.addChild(timeLabel);

  let animTimer = 0;

  return {
    overlay,
    stars,
    timeLabel,
    update(config: BlendedTimeConfig) {
      animTimer += 0.016;

      // Update overlay
      overlay.clear();
      overlay.rect(0, 0, screenW, screenH).fill({ color: config.overlayColor, alpha: config.overlayAlpha });

      // Update stars
      for (const s of starGraphics) {
        s.g.alpha = config.starAlpha * s.baseAlpha * (0.5 + 0.5 * Math.sin(animTimer * s.speed));
      }

      // Update label
      timeLabel.text = config.label;
      timeLabel.alpha = 0.6;
    },
  };
}
