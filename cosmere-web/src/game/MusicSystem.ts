// ─── Music & Ambient Sound System ──────────────────────────────
// Visual-only system (no actual audio) that tracks atmosphere and
// displays a music/ambient indicator in the UI.

export type MusicMood = 'peaceful' | 'exploration' | 'tension' | 'combat' | 'boss' | 'mystery' | 'triumph';

export interface MusicTrack {
  name: string;
  mood: MusicMood;
  icon: string;
  color: number;
}

const WORLD_TRACKS: Record<string, MusicTrack[]> = {
  roshar: [
    { name: 'Vents des Plaines', mood: 'exploration', icon: '🎵', color: 0x5588cc },
    { name: 'Haute Tempête', mood: 'tension', icon: '⚡', color: 0xcc8844 },
    { name: 'Serment des Radiants', mood: 'triumph', icon: '✦', color: 0xffcc44 },
  ],
  scadrial: [
    { name: 'Brumes Nocturnes', mood: 'mystery', icon: '🌫', color: 0x8888aa },
    { name: 'Danse du Métal', mood: 'combat', icon: '⚔', color: 0xcc4444 },
    { name: 'Cendres du Soir', mood: 'peaceful', icon: '🎵', color: 0x998877 },
  ],
  nalthis: [
    { name: 'Souffle de Couleur', mood: 'peaceful', icon: '🌈', color: 0xee77aa },
    { name: 'Éveil Flamboyant', mood: 'exploration', icon: '🎵', color: 0xaa44cc },
  ],
  sel: [
    { name: 'Lumière d\'Elantris', mood: 'mystery', icon: '✨', color: 0xddaa44 },
    { name: 'Chant des Aons', mood: 'peaceful', icon: '🎵', color: 0x44aadd },
  ],
  taldain: [
    { name: 'Sables d\'Or', mood: 'exploration', icon: '🏜', color: 0xddbb44 },
    { name: 'Tempête de Sable', mood: 'tension', icon: '🌪', color: 0xccaa33 },
  ],
  shadesmar: [
    { name: 'Océan de Perles', mood: 'mystery', icon: '🔮', color: 0x6644aa },
    { name: 'Écho du Cognitif', mood: 'peaceful', icon: '🎵', color: 0x4466bb },
  ],
  threnody: [
    { name: 'Ombres Silencieuses', mood: 'tension', icon: '👻', color: 0x664466 },
    { name: 'Forêt des Âmes', mood: 'mystery', icon: '🌑', color: 0x443355 },
  ],
};

const DEFAULT_TRACKS: MusicTrack[] = [
  { name: 'Voyage Cosmère', mood: 'exploration', icon: '🎵', color: 0x5577aa },
];

export type AmbientType = 'wind' | 'rain' | 'fire' | 'water' | 'crickets' | 'crowd' | 'cave' | 'storm' | 'silence';

export interface AmbientLayer {
  type: AmbientType;
  label: string;
  icon: string;
  intensity: number; // 0-1
}

const WEATHER_AMBIENTS: Record<string, AmbientLayer[]> = {
  none: [{ type: 'wind', label: 'Vent léger', icon: '🍃', intensity: 0.3 }],
  ashfall: [
    { type: 'wind', label: 'Vent de cendres', icon: '🌫', intensity: 0.6 },
    { type: 'fire', label: 'Cendres brûlantes', icon: '🔥', intensity: 0.2 },
  ],
  mist: [{ type: 'silence', label: 'Brume silencieuse', icon: '🌫', intensity: 0.8 }],
  highstorm: [
    { type: 'storm', label: 'Haute Tempête', icon: '⚡', intensity: 1.0 },
    { type: 'rain', label: 'Pluie torrentielle', icon: '🌧', intensity: 0.9 },
  ],
  rain: [{ type: 'rain', label: 'Pluie', icon: '🌧', intensity: 0.6 }],
};

export class MusicManager {
  private static _instance: MusicManager;
  static get shared(): MusicManager {
    if (!this._instance) this._instance = new MusicManager();
    return this._instance;
  }

  currentTrack: MusicTrack | null = null;
  currentMood: MusicMood = 'exploration';
  ambientLayers: AmbientLayer[] = [];
  volume = 0.7;    // 0-1
  isMuted = false;
  private worldID = '';
  inCombat = false;
  private combatCooldown = 0;
  private trackTimer = 0;
  private readonly TRACK_DURATION = 60; // seconds per "track"

  setWorld(worldID: string): void {
    if (this.worldID === worldID) return;
    this.worldID = worldID;
    this.pickTrack();
  }

  setWeather(weather: string): void {
    this.ambientLayers = WEATHER_AMBIENTS[weather] ?? WEATHER_AMBIENTS['none'];
  }

  enterCombat(): void {
    if (!this.inCombat) {
      this.inCombat = true;
      this.combatCooldown = 5;
      this.currentMood = 'combat';
      this.pickTrackForMood('combat');
    }
    this.combatCooldown = 5; // Reset cooldown on each combat action
  }

  update(dt: number): void {
    // Combat cooldown
    if (this.inCombat) {
      this.combatCooldown -= dt;
      if (this.combatCooldown <= 0) {
        this.inCombat = false;
        this.currentMood = 'exploration';
        this.pickTrack();
      }
    }

    // Track rotation
    this.trackTimer += dt;
    if (this.trackTimer >= this.TRACK_DURATION) {
      this.trackTimer = 0;
      if (!this.inCombat) this.pickTrack();
    }
  }

  private pickTrack(): void {
    const tracks = WORLD_TRACKS[this.worldID] ?? DEFAULT_TRACKS;
    const peaceful = tracks.filter(t => t.mood !== 'combat' && t.mood !== 'boss');
    this.currentTrack = peaceful.length > 0
      ? peaceful[Math.floor(Math.random() * peaceful.length)]
      : tracks[0] ?? DEFAULT_TRACKS[0];
  }

  private pickTrackForMood(mood: MusicMood): void {
    const tracks = WORLD_TRACKS[this.worldID] ?? DEFAULT_TRACKS;
    const matching = tracks.filter(t => t.mood === mood);
    if (matching.length > 0) {
      this.currentTrack = matching[Math.floor(Math.random() * matching.length)];
    }
  }

  toggleMute(): void {
    this.isMuted = !this.isMuted;
  }

  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v));
  }
}
