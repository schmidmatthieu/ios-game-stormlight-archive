// ─── Procedural Ambient Sound Generation ────────────────────────
// Creates looping ambient soundscapes using noise generators and filters.

/** Create a noise buffer source of the given color */
export function createNoiseSource(ctx: AudioContext, type: 'white' | 'pink' | 'brown'): AudioBufferSourceNode {
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

/** Create wind ambient nodes and return them for tracking */
export function createWindAmbient(ctx: AudioContext, ambientGain: GainNode, intensity: number): AudioNode[] {
  const noise = createNoiseSource(ctx, 'brown');
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
  gain.connect(ambientGain);
  noise.start();
  lfo.start();
  return [noise, lfo];
}

/** Create rain ambient nodes and return them for tracking */
export function createRainAmbient(ctx: AudioContext, ambientGain: GainNode, intensity: number): AudioNode[] {
  const noise = createNoiseSource(ctx, 'pink');
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 2000;

  const gain = ctx.createGain();
  gain.gain.value = intensity * 0.25;

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ambientGain);
  noise.start();
  return [noise];
}

/** Create storm ambient nodes and return them for tracking */
export function createStormAmbient(ctx: AudioContext, ambientGain: GainNode, intensity: number): AudioNode[] {
  // Deep rumble
  const rumble = createNoiseSource(ctx, 'brown');
  const rumbleFilter = ctx.createBiquadFilter();
  rumbleFilter.type = 'lowpass';
  rumbleFilter.frequency.value = 150;
  const rumbleGain = ctx.createGain();
  rumbleGain.gain.value = intensity * 0.4;
  rumble.connect(rumbleFilter);
  rumbleFilter.connect(rumbleGain);
  rumbleGain.connect(ambientGain);
  rumble.start();

  // High wind
  const wind = createNoiseSource(ctx, 'pink');
  const windFilter = ctx.createBiquadFilter();
  windFilter.type = 'bandpass';
  windFilter.frequency.value = 800;
  windFilter.Q.value = 1;
  const windGain = ctx.createGain();
  windGain.gain.value = intensity * 0.3;
  wind.connect(windFilter);
  windFilter.connect(windGain);
  windGain.connect(ambientGain);
  wind.start();

  return [rumble, wind];
}

/** Create fire ambient nodes and return them for tracking */
export function createFireAmbient(ctx: AudioContext, ambientGain: GainNode, intensity: number): AudioNode[] {
  const noise = createNoiseSource(ctx, 'white');
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
  gain.connect(ambientGain);
  noise.start();
  lfo.start();
  return [noise, lfo];
}

/** Create cave ambient nodes and return them for tracking */
export function createCaveAmbient(ctx: AudioContext, ambientGain: GainNode, intensity: number): AudioNode[] {
  const noise = createNoiseSource(ctx, 'brown');
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 200;

  const gain = ctx.createGain();
  gain.gain.value = intensity * 0.1;

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ambientGain);
  noise.start();
  return [noise];
}

/** Dispatch ambient type to the appropriate generator */
export function createAmbientByType(
  ctx: AudioContext,
  ambientGain: GainNode,
  type: string,
  intensity: number,
): AudioNode[] {
  switch (type) {
    case 'wind': return createWindAmbient(ctx, ambientGain, intensity);
    case 'rain': return createRainAmbient(ctx, ambientGain, intensity);
    case 'storm': return createStormAmbient(ctx, ambientGain, intensity);
    case 'fire': return createFireAmbient(ctx, ambientGain, intensity);
    case 'cave': return createCaveAmbient(ctx, ambientGain, intensity);
    default: return createWindAmbient(ctx, ambientGain, intensity * 0.3);
  }
}
