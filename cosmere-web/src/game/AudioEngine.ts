// ─── Procedural Audio Engine (Web Audio API) ──────────────────
// Generates music and SFX procedurally — no audio files needed.

import { playSFXByName } from './AudioSFX';
import { createAmbientByType } from './AudioAmbient';

// Re-export helpers for backward compatibility
export { playSFXByName, quickOsc } from './AudioSFX';
export { createNoiseSource, createAmbientByType } from './AudioAmbient';

// ─── Musical scales per world (frequencies in Hz) ─────────────

export interface MoodConfig {
  waveform: OscillatorType;
  padVolume: number;
  melodyVolume: number;
}

export const WORLD_SCALES: Record<string, number[]> = {
  roshar:   [130.81, 146.83, 164.81, 196.00, 220.00, 261.63], // C minor pentatonic + tense
  scadrial: [110.00, 130.81, 146.83, 164.81, 196.00, 220.00], // A minor, darker
  nalthis:  [130.81, 164.81, 196.00, 220.00, 261.63, 329.63], // C major pentatonic, bright
  sel:      [146.83, 174.61, 196.00, 220.00, 261.63, 293.66], // D lydian feel, luminous
  taldain:  [130.81, 155.56, 174.61, 207.65, 233.08, 261.63], // Arabic/desert scale
  komashi:  [130.81, 146.83, 174.61, 196.00, 233.08, 261.63], // Japanese minor (In scale)
  shadesmar:[110.00, 123.47, 146.83, 164.81, 185.00, 220.00], // Whole tone / eerie
  threnody: [110.00, 116.54, 138.59, 155.56, 164.81, 207.65], // Phrygian, dark
  default:  [130.81, 146.83, 164.81, 196.00, 220.00, 261.63],
};

export const MOOD_CONFIGS: Record<string, MoodConfig> = {
  peaceful:    { waveform: 'sine',     padVolume: 0.12, melodyVolume: 0.15 },
  exploration: { waveform: 'triangle', padVolume: 0.14, melodyVolume: 0.12 },
  tension:     { waveform: 'sawtooth', padVolume: 0.10, melodyVolume: 0.08 },
  combat:      { waveform: 'sawtooth', padVolume: 0.18, melodyVolume: 0.10 },
  boss:        { waveform: 'square',   padVolume: 0.20, melodyVolume: 0.12 },
  mystery:     { waveform: 'sine',     padVolume: 0.10, melodyVolume: 0.18 },
  triumph:     { waveform: 'triangle', padVolume: 0.16, melodyVolume: 0.20 },
};

export class AudioEngine {
  private static _instance: AudioEngine;
  static get shared(): AudioEngine {
    if (!this._instance) this._instance = new AudioEngine();
    return this._instance;
  }

  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;

  private activeMusicNodes: AudioNode[] = [];
  private activeAmbientNodes: AudioNode[] = [];
  private musicTimeout: ReturnType<typeof setTimeout> | null = null;

  private _musicVolume = 0.7;
  private _sfxVolume = 0.7;
  private _muted = false;
  private _initialized = false;

  get initialized(): boolean { return this._initialized; }

  /** Must be called from a user gesture (click/tap) to unlock audio */
  init(): void {
    if (this._initialized) return;
    try {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this._musicVolume * 0.35;
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this._sfxVolume;
      this.sfxGain.connect(this.masterGain);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.value = 0.25;
      this.ambientGain.connect(this.masterGain);

      this._initialized = true;
    } catch {
      console.warn('Web Audio API not available');
    }
  }

  private ensureCtx(): AudioContext | null {
    if (!this.ctx) return null;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  // ─── Volume Controls ───────────────────────────────────────

  set musicVolume(v: number) {
    this._musicVolume = Math.max(0, Math.min(1, v));
    if (this.musicGain) this.musicGain.gain.value = this._muted ? 0 : this._musicVolume * 0.35;
  }

  set sfxVolume(v: number) {
    this._sfxVolume = Math.max(0, Math.min(1, v));
    if (this.sfxGain) this.sfxGain.gain.value = this._muted ? 0 : this._sfxVolume;
  }

  set muted(m: boolean) {
    this._muted = m;
    if (this.masterGain) this.masterGain.gain.value = m ? 0 : 1;
  }

  get muted(): boolean { return this._muted; }

  // ─── Music (Procedural ambient pads) ────────────────────────

  /** Play a procedural music loop based on mood and world */
  playMusic(mood: string, worldID: string): void {
    const ctx = this.ensureCtx();
    if (!ctx || !this.musicGain) return;

    this.stopMusic(0.5);

    const scale = WORLD_SCALES[worldID] ?? WORLD_SCALES['default'];
    const config = MOOD_CONFIGS[mood] ?? MOOD_CONFIGS['exploration'];
    const duration = 8;

    const playPhrase = () => {
      if (!this.ctx || !this.musicGain) return;
      const t = this.ctx.currentTime;

      const rootNote = scale[Math.floor(Math.random() * scale.length)];
      this.createPad(rootNote, config, t, duration);

      if (Math.random() < 0.6) {
        const melodyDelay = 1 + Math.random() * 3;
        const melodyNote = scale[Math.floor(Math.random() * scale.length)] * 2;
        this.createMelodyNote(melodyNote, config, t + melodyDelay, 1.5 + Math.random() * 2);
      }

      if (Math.random() < 0.3) {
        const melodyDelay = 4 + Math.random() * 2;
        const melodyNote = scale[Math.floor(Math.random() * scale.length)] * 2;
        this.createMelodyNote(melodyNote, config, t + melodyDelay, 1 + Math.random() * 1.5);
      }

      this.musicTimeout = setTimeout(() => playPhrase(), duration * 1000 * 0.9);
    };

    playPhrase();
  }

  private createPad(freq: number, config: MoodConfig, startTime: number, duration: number): void {
    const ctx = this.ctx!;
    const gain = ctx.createGain();
    gain.connect(this.musicGain!);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(config.padVolume, startTime + 1.5);
    gain.gain.setValueAtTime(config.padVolume, startTime + duration - 2);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);

    for (let i = 0; i < 2; i++) {
      const osc = ctx.createOscillator();
      osc.type = config.waveform;
      osc.frequency.value = freq * (1 + (i - 0.5) * 0.006);
      osc.connect(gain);
      osc.start(startTime);
      osc.stop(startTime + duration + 0.1);
      this.activeMusicNodes.push(osc);
    }

    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.value = freq / 2;
    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0, startTime);
    subGain.gain.linearRampToValueAtTime(config.padVolume * 0.4, startTime + 2);
    subGain.gain.linearRampToValueAtTime(0, startTime + duration);
    sub.connect(subGain);
    subGain.connect(this.musicGain!);
    sub.start(startTime);
    sub.stop(startTime + duration + 0.1);
    this.activeMusicNodes.push(sub);
  }

  private createMelodyNote(freq: number, config: MoodConfig, startTime: number, duration: number): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(config.melodyVolume, startTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 4 + Math.random() * 2;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = freq * 0.003;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start(startTime);
    lfo.stop(startTime + duration + 0.1);

    osc.connect(gain);
    gain.connect(this.musicGain!);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.1);
    this.activeMusicNodes.push(osc);
  }

  stopMusic(fadeTime = 1): void {
    if (this.musicTimeout) {
      clearTimeout(this.musicTimeout);
      this.musicTimeout = null;
    }
    if (this.musicGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
      this.musicGain.gain.linearRampToValueAtTime(0, now + fadeTime);
      setTimeout(() => {
        this.activeMusicNodes.forEach(n => { try { (n as OscillatorNode).stop(); } catch { /* already stopped */ } });
        this.activeMusicNodes = [];
        if (this.musicGain) this.musicGain.gain.value = this._muted ? 0 : this._musicVolume * 0.35;
      }, fadeTime * 1000 + 100);
    }
  }

  // ─── Ambient Sounds ─────────────────────────────────────────

  playAmbient(type: string, intensity: number): void {
    const ctx = this.ensureCtx();
    if (!ctx || !this.ambientGain) return;
    this.stopAmbient();
    const nodes = createAmbientByType(ctx, this.ambientGain, type, intensity);
    this.activeAmbientNodes.push(...nodes);
  }

  stopAmbient(): void {
    this.activeAmbientNodes.forEach(n => { try { (n as OscillatorNode | AudioBufferSourceNode).stop(); } catch { /* ok */ } });
    this.activeAmbientNodes = [];
  }

  // ─── SFX (One-shot procedural sounds) ───────────────────────

  /** Play a named sound effect */
  playSFX(name: string): void {
    const ctx = this.ensureCtx();
    if (!ctx || !this.sfxGain || this._muted) return;
    playSFXByName(ctx, this.sfxGain, name);
  }

  /** Clean up all audio */
  dispose(): void {
    this.stopMusic(0);
    this.stopAmbient();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
    this._initialized = false;
  }
}
