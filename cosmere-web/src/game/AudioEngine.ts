// ─── Procedural Audio Engine (Web Audio API) ──────────────────
// Generates music and SFX procedurally — no audio files needed.

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
      this.musicGain.gain.value = this._musicVolume * 0.35; // music softer
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

    // Create layered pads
    const now = ctx.currentTime;
    const duration = 8; // seconds per phrase

    const playPhrase = () => {
      if (!this.ctx || !this.musicGain) return;
      const t = this.ctx.currentTime;

      // Base pad (2 detuned oscillators)
      const rootNote = scale[Math.floor(Math.random() * scale.length)];
      this.createPad(rootNote, config, t, duration);

      // Melody note (occasional)
      if (Math.random() < 0.6) {
        const melodyDelay = 1 + Math.random() * 3;
        const melodyNote = scale[Math.floor(Math.random() * scale.length)] * 2;
        this.createMelodyNote(melodyNote, config, t + melodyDelay, 1.5 + Math.random() * 2);
      }

      // Second melody note
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

    // Fade in/out envelope
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(config.padVolume, startTime + 1.5);
    gain.gain.setValueAtTime(config.padVolume, startTime + duration - 2);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);

    for (let i = 0; i < 2; i++) {
      const osc = ctx.createOscillator();
      osc.type = config.waveform;
      osc.frequency.value = freq * (1 + (i - 0.5) * 0.006); // slight detune
      osc.connect(gain);
      osc.start(startTime);
      osc.stop(startTime + duration + 0.1);
      this.activeMusicNodes.push(osc);
    }

    // Sub bass
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

    // Add slight vibrato
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

    switch (type) {
      case 'wind': this.createWindAmbient(intensity); break;
      case 'rain': this.createRainAmbient(intensity); break;
      case 'storm': this.createStormAmbient(intensity); break;
      case 'fire': this.createFireAmbient(intensity); break;
      case 'cave': this.createCaveAmbient(intensity); break;
      default: this.createWindAmbient(intensity * 0.3); break;
    }
  }

  private createNoiseSource(type: 'white' | 'pink' | 'brown'): AudioBufferSourceNode {
    const ctx = this.ctx!;
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    if (type === 'white') {
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    } else if (type === 'pink') {
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.969 * b2 + white * 0.153852;
        data[i] = (b0 + b1 + b2 + white * 0.5362) * 0.11;
      }
    } else { // brown
      let last = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (last + 0.02 * white) / 1.02;
        last = data[i];
        data[i] *= 3.5;
      }
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    return source;
  }

  private createWindAmbient(intensity: number): void {
    const ctx = this.ctx!;
    const noise = this.createNoiseSource('brown');
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 300 + intensity * 400;
    filter.Q.value = 0.5;

    const gain = ctx.createGain();
    gain.gain.value = intensity * 0.3;

    // LFO for wind gusts
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.15 + Math.random() * 0.1;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = intensity * 0.15;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambientGain!);
    noise.start();
    lfo.start();
    this.activeAmbientNodes.push(noise, lfo);
  }

  private createRainAmbient(intensity: number): void {
    const ctx = this.ctx!;
    const noise = this.createNoiseSource('pink');
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2000;

    const gain = ctx.createGain();
    gain.gain.value = intensity * 0.25;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambientGain!);
    noise.start();
    this.activeAmbientNodes.push(noise);
  }

  private createStormAmbient(intensity: number): void {
    const ctx = this.ctx!;
    // Deep rumble
    const rumble = this.createNoiseSource('brown');
    const rumbleFilter = ctx.createBiquadFilter();
    rumbleFilter.type = 'lowpass';
    rumbleFilter.frequency.value = 150;
    const rumbleGain = ctx.createGain();
    rumbleGain.gain.value = intensity * 0.4;
    rumble.connect(rumbleFilter);
    rumbleFilter.connect(rumbleGain);
    rumbleGain.connect(this.ambientGain!);
    rumble.start();

    // High wind
    const wind = this.createNoiseSource('pink');
    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 800;
    windFilter.Q.value = 1;
    const windGain = ctx.createGain();
    windGain.gain.value = intensity * 0.3;
    wind.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(this.ambientGain!);
    wind.start();

    this.activeAmbientNodes.push(rumble, wind);
  }

  private createFireAmbient(intensity: number): void {
    const ctx = this.ctx!;
    const noise = this.createNoiseSource('white');
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 600;
    filter.Q.value = 2;

    const gain = ctx.createGain();
    gain.gain.value = intensity * 0.15;

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 3 + Math.random() * 5;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = intensity * 0.08;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambientGain!);
    noise.start();
    lfo.start();
    this.activeAmbientNodes.push(noise, lfo);
  }

  private createCaveAmbient(intensity: number): void {
    const ctx = this.ctx!;
    const noise = this.createNoiseSource('brown');
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 200;

    const gain = ctx.createGain();
    gain.gain.value = intensity * 0.1;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambientGain!);
    noise.start();
    this.activeAmbientNodes.push(noise);
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

    switch (name) {
      case 'hit': this.sfxHit(); break;
      case 'crit': this.sfxCrit(); break;
      case 'miss': this.sfxMiss(); break;
      case 'death': this.sfxDeath(); break;
      case 'loot_common': this.sfxLoot(0); break;
      case 'loot_rare': this.sfxLoot(1); break;
      case 'loot_epic': this.sfxLoot(2); break;
      case 'loot_legendary': this.sfxLoot(3); break;
      case 'level_up': this.sfxLevelUp(); break;
      case 'quest_complete': this.sfxQuestComplete(); break;
      case 'button_click': this.sfxClick(); break;
      case 'button_hover': this.sfxHover(); break;
      case 'equip': this.sfxEquip(); break;
      case 'potion': this.sfxPotion(); break;
      case 'magic_allomancy': this.sfxAllomancy(); break;
      case 'magic_surgebinding': this.sfxSurgebinding(); break;
      case 'magic_awakening': this.sfxAwakening(); break;
      case 'magic_aondor': this.sfxAonDor(); break;
      case 'magic_sand': this.sfxSandMastery(); break;
      case 'magic_paint': this.sfxPainting(); break;
      case 'dash': this.sfxDash(); break;
      case 'block': this.sfxBlock(); break;
      case 'heal': this.sfxHeal(); break;
      case 'combo': this.sfxCombo(); break;
      case 'achievement': this.sfxAchievement(); break;
      case 'error': this.sfxError(); break;
      case 'open_menu': this.sfxOpenMenu(); break;
      case 'close_menu': this.sfxCloseMenu(); break;
      default: this.sfxClick(); break;
    }
  }

  private quickOsc(freq: number, type: OscillatorType, duration: number, volume: number, startTime?: number): void {
    const ctx = this.ctx!;
    const t = startTime ?? ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start(t);
    osc.stop(t + duration + 0.05);
  }

  private sfxHit(): void {
    const t = this.ctx!.currentTime;
    // Impact thump
    this.quickOsc(120 + Math.random() * 40, 'sine', 0.15, 0.4, t);
    // Noise burst
    const ctx = this.ctx!;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const g = ctx.createGain();
    g.gain.value = 0.15;
    src.connect(g);
    g.connect(this.sfxGain!);
    src.start(t);
  }

  private sfxCrit(): void {
    const t = this.ctx!.currentTime;
    this.quickOsc(200, 'sawtooth', 0.1, 0.3, t);
    this.quickOsc(400, 'sine', 0.15, 0.25, t + 0.03);
    this.quickOsc(600, 'sine', 0.2, 0.2, t + 0.06);
  }

  private sfxMiss(): void {
    const t = this.ctx!.currentTime;
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.linearRampToValueAtTime(200, t + 0.15);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  private sfxDeath(): void {
    const t = this.ctx!.currentTime;
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.8);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.8);
    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start(t);
    osc.stop(t + 0.9);
  }

  private sfxLoot(tier: number): void {
    const t = this.ctx!.currentTime;
    const baseFreq = 440 + tier * 80;
    const notes = tier < 2 ? 2 : tier < 3 ? 3 : 4;
    for (let i = 0; i < notes; i++) {
      this.quickOsc(baseFreq * (1 + i * 0.25), 'sine', 0.2 + tier * 0.05, 0.2, t + i * 0.1);
    }
    if (tier >= 3) {
      // Shimmer for legendary
      this.quickOsc(baseFreq * 3, 'sine', 0.5, 0.1, t + 0.3);
    }
  }

  private sfxLevelUp(): void {
    const t = this.ctx!.currentTime;
    const notes = [262, 330, 392, 523]; // C E G C'
    notes.forEach((f, i) => {
      this.quickOsc(f, 'sine', 0.3, 0.25, t + i * 0.12);
      this.quickOsc(f * 1.5, 'sine', 0.2, 0.1, t + i * 0.12);
    });
  }

  private sfxQuestComplete(): void {
    const t = this.ctx!.currentTime;
    const notes = [392, 440, 523, 659, 784]; // G A C' E' G'
    notes.forEach((f, i) => {
      this.quickOsc(f, 'triangle', 0.4, 0.2, t + i * 0.1);
    });
  }

  private sfxClick(): void {
    this.quickOsc(800, 'sine', 0.05, 0.15);
  }

  private sfxHover(): void {
    this.quickOsc(600, 'sine', 0.03, 0.08);
  }

  private sfxEquip(): void {
    const t = this.ctx!.currentTime;
    this.quickOsc(300, 'triangle', 0.1, 0.2, t);
    this.quickOsc(450, 'sine', 0.15, 0.15, t + 0.05);
  }

  private sfxPotion(): void {
    const t = this.ctx!.currentTime;
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.linearRampToValueAtTime(600, t + 0.2);
    osc.frequency.linearRampToValueAtTime(400, t + 0.4);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start(t);
    osc.stop(t + 0.5);
  }

  private sfxAllomancy(): void {
    const t = this.ctx!.currentTime;
    // Metallic resonance
    this.quickOsc(180, 'sawtooth', 0.3, 0.2, t);
    this.quickOsc(360, 'square', 0.15, 0.1, t + 0.05);
    this.quickOsc(720, 'sine', 0.2, 0.08, t + 0.1);
  }

  private sfxSurgebinding(): void {
    const t = this.ctx!.currentTime;
    // Whooshing stormlight
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.3);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start(t);
    osc.stop(t + 0.5);
    // Harmonic shimmer
    this.quickOsc(1200, 'sine', 0.25, 0.08, t + 0.1);
  }

  private sfxAwakening(): void {
    const t = this.ctx!.currentTime;
    // Color drain / pulse effect
    const notes = [330, 440, 550, 660];
    notes.forEach((f, i) => {
      this.quickOsc(f, 'sine', 0.15, 0.12, t + i * 0.06);
    });
  }

  private sfxAonDor(): void {
    const t = this.ctx!.currentTime;
    // Glowing glyph sound
    this.quickOsc(523, 'sine', 0.5, 0.2, t);
    this.quickOsc(659, 'sine', 0.4, 0.15, t + 0.1);
    this.quickOsc(784, 'triangle', 0.3, 0.1, t + 0.2);
  }

  private sfxSandMastery(): void {
    const t = this.ctx!.currentTime;
    // Sandy whoosh
    const ctx = this.ctx!;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const env = Math.sin((i / data.length) * Math.PI);
      data[i] = (Math.random() * 2 - 1) * env * 0.3;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2000;
    filter.Q.value = 1;
    src.connect(filter);
    filter.connect(this.sfxGain!);
    src.start(t);
  }

  private sfxPainting(): void {
    const t = this.ctx!.currentTime;
    // Ink brush stroke
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.linearRampToValueAtTime(300, t + 0.2);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start(t);
    osc.stop(t + 0.3);
  }

  private sfxDash(): void {
    const t = this.ctx!.currentTime;
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.15);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  private sfxBlock(): void {
    const t = this.ctx!.currentTime;
    this.quickOsc(200, 'square', 0.08, 0.3, t);
    this.quickOsc(150, 'sine', 0.12, 0.2, t + 0.02);
  }

  private sfxHeal(): void {
    const t = this.ctx!.currentTime;
    const notes = [392, 494, 587]; // G B D
    notes.forEach((f, i) => {
      this.quickOsc(f, 'sine', 0.3, 0.15, t + i * 0.12);
    });
  }

  private sfxCombo(): void {
    const t = this.ctx!.currentTime;
    this.quickOsc(500, 'triangle', 0.1, 0.2, t);
    this.quickOsc(700, 'sine', 0.15, 0.2, t + 0.05);
    this.quickOsc(900, 'sine', 0.2, 0.15, t + 0.1);
  }

  private sfxAchievement(): void {
    const t = this.ctx!.currentTime;
    const notes = [523, 659, 784, 1047]; // C' E' G' C''
    notes.forEach((f, i) => {
      this.quickOsc(f, 'sine', 0.4, 0.2, t + i * 0.15);
      this.quickOsc(f * 1.5, 'sine', 0.3, 0.08, t + i * 0.15 + 0.05);
    });
  }

  private sfxError(): void {
    const t = this.ctx!.currentTime;
    this.quickOsc(200, 'square', 0.15, 0.2, t);
    this.quickOsc(150, 'square', 0.2, 0.2, t + 0.15);
  }

  private sfxOpenMenu(): void {
    const t = this.ctx!.currentTime;
    this.quickOsc(400, 'sine', 0.08, 0.12, t);
    this.quickOsc(600, 'sine', 0.1, 0.1, t + 0.04);
  }

  private sfxCloseMenu(): void {
    const t = this.ctx!.currentTime;
    this.quickOsc(600, 'sine', 0.06, 0.1, t);
    this.quickOsc(400, 'sine', 0.08, 0.08, t + 0.04);
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

// ─── Musical scales per world (frequencies in Hz) ─────────────

const WORLD_SCALES: Record<string, number[]> = {
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

interface MoodConfig {
  waveform: OscillatorType;
  padVolume: number;
  melodyVolume: number;
}

const MOOD_CONFIGS: Record<string, MoodConfig> = {
  peaceful:    { waveform: 'sine',     padVolume: 0.12, melodyVolume: 0.15 },
  exploration: { waveform: 'triangle', padVolume: 0.14, melodyVolume: 0.12 },
  tension:     { waveform: 'sawtooth', padVolume: 0.10, melodyVolume: 0.08 },
  combat:      { waveform: 'sawtooth', padVolume: 0.18, melodyVolume: 0.10 },
  boss:        { waveform: 'square',   padVolume: 0.20, melodyVolume: 0.12 },
  mystery:     { waveform: 'sine',     padVolume: 0.10, melodyVolume: 0.18 },
  triumph:     { waveform: 'triangle', padVolume: 0.16, melodyVolume: 0.20 },
};
