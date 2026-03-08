// ─── Procedural Sound Effects Generator ─────────────────────────
// All SFX are generated procedurally via Web Audio API oscillators.

/** Helper to create and schedule a short oscillator burst */
export function quickOsc(
  ctx: AudioContext,
  sfxGain: GainNode,
  freq: number,
  type: OscillatorType,
  duration: number,
  volume: number,
  startTime?: number,
): void {
  const t = startTime ?? ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.connect(gain);
  gain.connect(sfxGain);
  osc.start(t);
  osc.stop(t + duration + 0.05);
}

/** Dispatch a named SFX to the appropriate generator function */
export function playSFXByName(ctx: AudioContext, sfxGain: GainNode, name: string): void {
  switch (name) {
    case 'hit': sfxHit(ctx, sfxGain); break;
    case 'crit': sfxCrit(ctx, sfxGain); break;
    case 'miss': sfxMiss(ctx, sfxGain); break;
    case 'death': sfxDeath(ctx, sfxGain); break;
    case 'loot_common': sfxLoot(ctx, sfxGain, 0); break;
    case 'loot_rare': sfxLoot(ctx, sfxGain, 1); break;
    case 'loot_epic': sfxLoot(ctx, sfxGain, 2); break;
    case 'loot_legendary': sfxLoot(ctx, sfxGain, 3); break;
    case 'level_up': sfxLevelUp(ctx, sfxGain); break;
    case 'quest_complete': sfxQuestComplete(ctx, sfxGain); break;
    case 'button_click': sfxClick(ctx, sfxGain); break;
    case 'button_hover': sfxHover(ctx, sfxGain); break;
    case 'equip': sfxEquip(ctx, sfxGain); break;
    case 'potion': sfxPotion(ctx, sfxGain); break;
    case 'magic_allomancy': sfxAllomancy(ctx, sfxGain); break;
    case 'magic_surgebinding': sfxSurgebinding(ctx, sfxGain); break;
    case 'magic_awakening': sfxAwakening(ctx, sfxGain); break;
    case 'magic_aondor': sfxAonDor(ctx, sfxGain); break;
    case 'magic_sand': sfxSandMastery(ctx, sfxGain); break;
    case 'magic_paint': sfxPainting(ctx, sfxGain); break;
    case 'dash': sfxDash(ctx, sfxGain); break;
    case 'block': sfxBlock(ctx, sfxGain); break;
    case 'heal': sfxHeal(ctx, sfxGain); break;
    case 'combo': sfxCombo(ctx, sfxGain); break;
    case 'achievement': sfxAchievement(ctx, sfxGain); break;
    case 'error': sfxError(ctx, sfxGain); break;
    case 'open_menu': sfxOpenMenu(ctx, sfxGain); break;
    case 'close_menu': sfxCloseMenu(ctx, sfxGain); break;
    default: sfxClick(ctx, sfxGain); break;
  }
}

// ─── Individual SFX generators ──────────────────────────────────

function sfxHit(ctx: AudioContext, sfxGain: GainNode): void {
  const t = ctx.currentTime;
  // Impact thump
  quickOsc(ctx, sfxGain, 120 + Math.random() * 40, 'sine', 0.15, 0.4, t);
  // Noise burst
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const g = ctx.createGain();
  g.gain.value = 0.15;
  src.connect(g);
  g.connect(sfxGain);
  src.start(t);
}

function sfxCrit(ctx: AudioContext, sfxGain: GainNode): void {
  const t = ctx.currentTime;
  quickOsc(ctx, sfxGain, 200, 'sawtooth', 0.1, 0.3, t);
  quickOsc(ctx, sfxGain, 400, 'sine', 0.15, 0.25, t + 0.03);
  quickOsc(ctx, sfxGain, 600, 'sine', 0.2, 0.2, t + 0.06);
}

function sfxMiss(ctx: AudioContext, sfxGain: GainNode): void {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(400, t);
  osc.frequency.linearRampToValueAtTime(200, t + 0.15);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.15, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
  osc.connect(gain);
  gain.connect(sfxGain);
  osc.start(t);
  osc.stop(t + 0.2);
}

function sfxDeath(ctx: AudioContext, sfxGain: GainNode): void {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(300, t);
  osc.frequency.exponentialRampToValueAtTime(50, t + 0.8);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.3, t);
  gain.gain.linearRampToValueAtTime(0, t + 0.8);
  osc.connect(gain);
  gain.connect(sfxGain);
  osc.start(t);
  osc.stop(t + 0.9);
}

function sfxLoot(ctx: AudioContext, sfxGain: GainNode, tier: number): void {
  const t = ctx.currentTime;
  const baseFreq = 440 + tier * 80;
  const notes = tier < 2 ? 2 : tier < 3 ? 3 : 4;
  for (let i = 0; i < notes; i++) {
    quickOsc(ctx, sfxGain, baseFreq * (1 + i * 0.25), 'sine', 0.2 + tier * 0.05, 0.2, t + i * 0.1);
  }
  if (tier >= 3) {
    // Shimmer for legendary
    quickOsc(ctx, sfxGain, baseFreq * 3, 'sine', 0.5, 0.1, t + 0.3);
  }
}

function sfxLevelUp(ctx: AudioContext, sfxGain: GainNode): void {
  const t = ctx.currentTime;
  const notes = [262, 330, 392, 523]; // C E G C'
  notes.forEach((f, i) => {
    quickOsc(ctx, sfxGain, f, 'sine', 0.3, 0.25, t + i * 0.12);
    quickOsc(ctx, sfxGain, f * 1.5, 'sine', 0.2, 0.1, t + i * 0.12);
  });
}

function sfxQuestComplete(ctx: AudioContext, sfxGain: GainNode): void {
  const t = ctx.currentTime;
  const notes = [392, 440, 523, 659, 784]; // G A C' E' G'
  notes.forEach((f, i) => {
    quickOsc(ctx, sfxGain, f, 'triangle', 0.4, 0.2, t + i * 0.1);
  });
}

function sfxClick(ctx: AudioContext, sfxGain: GainNode): void {
  quickOsc(ctx, sfxGain, 800, 'sine', 0.05, 0.15);
}

function sfxHover(ctx: AudioContext, sfxGain: GainNode): void {
  quickOsc(ctx, sfxGain, 600, 'sine', 0.03, 0.08);
}

function sfxEquip(ctx: AudioContext, sfxGain: GainNode): void {
  const t = ctx.currentTime;
  quickOsc(ctx, sfxGain, 300, 'triangle', 0.1, 0.2, t);
  quickOsc(ctx, sfxGain, 450, 'sine', 0.15, 0.15, t + 0.05);
}

function sfxPotion(ctx: AudioContext, sfxGain: GainNode): void {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(200, t);
  osc.frequency.linearRampToValueAtTime(600, t + 0.2);
  osc.frequency.linearRampToValueAtTime(400, t + 0.4);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.2, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
  osc.connect(gain);
  gain.connect(sfxGain);
  osc.start(t);
  osc.stop(t + 0.5);
}

function sfxAllomancy(ctx: AudioContext, sfxGain: GainNode): void {
  const t = ctx.currentTime;
  // Metallic resonance
  quickOsc(ctx, sfxGain, 180, 'sawtooth', 0.3, 0.2, t);
  quickOsc(ctx, sfxGain, 360, 'square', 0.15, 0.1, t + 0.05);
  quickOsc(ctx, sfxGain, 720, 'sine', 0.2, 0.08, t + 0.1);
}

function sfxSurgebinding(ctx: AudioContext, sfxGain: GainNode): void {
  const t = ctx.currentTime;
  // Whooshing stormlight
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, t);
  osc.frequency.exponentialRampToValueAtTime(800, t + 0.3);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.25, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
  osc.connect(gain);
  gain.connect(sfxGain);
  osc.start(t);
  osc.stop(t + 0.5);
  // Harmonic shimmer
  quickOsc(ctx, sfxGain, 1200, 'sine', 0.25, 0.08, t + 0.1);
}

function sfxAwakening(ctx: AudioContext, sfxGain: GainNode): void {
  const t = ctx.currentTime;
  // Color drain / pulse effect
  const notes = [330, 440, 550, 660];
  notes.forEach((f, i) => {
    quickOsc(ctx, sfxGain, f, 'sine', 0.15, 0.12, t + i * 0.06);
  });
}

function sfxAonDor(ctx: AudioContext, sfxGain: GainNode): void {
  const t = ctx.currentTime;
  // Glowing glyph sound
  quickOsc(ctx, sfxGain, 523, 'sine', 0.5, 0.2, t);
  quickOsc(ctx, sfxGain, 659, 'sine', 0.4, 0.15, t + 0.1);
  quickOsc(ctx, sfxGain, 784, 'triangle', 0.3, 0.1, t + 0.2);
}

function sfxSandMastery(ctx: AudioContext, sfxGain: GainNode): void {
  const t = ctx.currentTime;
  // Sandy whoosh
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
  filter.connect(sfxGain);
  src.start(t);
}

function sfxPainting(ctx: AudioContext, sfxGain: GainNode): void {
  const t = ctx.currentTime;
  // Ink brush stroke
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(800, t);
  osc.frequency.linearRampToValueAtTime(300, t + 0.2);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.2, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
  osc.connect(gain);
  gain.connect(sfxGain);
  osc.start(t);
  osc.stop(t + 0.3);
}

function sfxDash(ctx: AudioContext, sfxGain: GainNode): void {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(300, t);
  osc.frequency.exponentialRampToValueAtTime(100, t + 0.15);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.2, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
  osc.connect(gain);
  gain.connect(sfxGain);
  osc.start(t);
  osc.stop(t + 0.2);
}

function sfxBlock(ctx: AudioContext, sfxGain: GainNode): void {
  const t = ctx.currentTime;
  quickOsc(ctx, sfxGain, 200, 'square', 0.08, 0.3, t);
  quickOsc(ctx, sfxGain, 150, 'sine', 0.12, 0.2, t + 0.02);
}

function sfxHeal(ctx: AudioContext, sfxGain: GainNode): void {
  const t = ctx.currentTime;
  const notes = [392, 494, 587]; // G B D
  notes.forEach((f, i) => {
    quickOsc(ctx, sfxGain, f, 'sine', 0.3, 0.15, t + i * 0.12);
  });
}

function sfxCombo(ctx: AudioContext, sfxGain: GainNode): void {
  const t = ctx.currentTime;
  quickOsc(ctx, sfxGain, 500, 'triangle', 0.1, 0.2, t);
  quickOsc(ctx, sfxGain, 700, 'sine', 0.15, 0.2, t + 0.05);
  quickOsc(ctx, sfxGain, 900, 'sine', 0.2, 0.15, t + 0.1);
}

function sfxAchievement(ctx: AudioContext, sfxGain: GainNode): void {
  const t = ctx.currentTime;
  const notes = [523, 659, 784, 1047]; // C' E' G' C''
  notes.forEach((f, i) => {
    quickOsc(ctx, sfxGain, f, 'sine', 0.4, 0.2, t + i * 0.15);
    quickOsc(ctx, sfxGain, f * 1.5, 'sine', 0.3, 0.08, t + i * 0.15 + 0.05);
  });
}

function sfxError(ctx: AudioContext, sfxGain: GainNode): void {
  const t = ctx.currentTime;
  quickOsc(ctx, sfxGain, 200, 'square', 0.15, 0.2, t);
  quickOsc(ctx, sfxGain, 150, 'square', 0.2, 0.2, t + 0.15);
}

function sfxOpenMenu(ctx: AudioContext, sfxGain: GainNode): void {
  const t = ctx.currentTime;
  quickOsc(ctx, sfxGain, 400, 'sine', 0.08, 0.12, t);
  quickOsc(ctx, sfxGain, 600, 'sine', 0.1, 0.1, t + 0.04);
}

function sfxCloseMenu(ctx: AudioContext, sfxGain: GainNode): void {
  const t = ctx.currentTime;
  quickOsc(ctx, sfxGain, 600, 'sine', 0.06, 0.1, t);
  quickOsc(ctx, sfxGain, 400, 'sine', 0.08, 0.08, t + 0.04);
}
