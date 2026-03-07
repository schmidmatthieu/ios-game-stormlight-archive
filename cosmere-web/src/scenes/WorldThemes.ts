// ─── World Theme Definitions ────────────────────────────────────

export interface WorldTheme {
  tileBase: number;
  tileAlt: number;
  tileBorder: number;
  edgeGlow: number;
  ambientParticleColor: number;
  decorations: string[];
  fogColor: number;
  fogAlpha: number;
}

export const WORLD_THEMES: Record<string, WorldTheme> = {
  scadrial: {
    tileBase: 0x302822, tileAlt: 0x3a322a, tileBorder: 0x44382e,
    edgeGlow: 0x553322, ambientParticleColor: 0x888077,
    decorations: ['ashPile', 'deadTree', 'metalShard', 'ruinedWall', 'barrel'],
    fogColor: 0x332211, fogAlpha: 0.15,
  },
  roshar: {
    tileBase: 0x1e2830, tileAlt: 0x263340, tileBorder: 0x344455,
    edgeGlow: 0x2244aa, ambientParticleColor: 0x66aaff,
    decorations: ['rockFormation', 'cremalingShelter', 'chullPath', 'stormPost', 'vine'],
    fogColor: 0x112244, fogAlpha: 0.12,
  },
  taldain: {
    tileBase: 0x3a3420, tileAlt: 0x44402a, tileBorder: 0x554a33,
    edgeGlow: 0xaa8833, ambientParticleColor: 0xddcc88,
    decorations: ['sandDune', 'cactus', 'oasis', 'sandRock'],
    fogColor: 0x332200, fogAlpha: 0.08,
  },
  nalthis: {
    tileBase: 0x1a2820, tileAlt: 0x223a28, tileBorder: 0x2e4433,
    edgeGlow: 0x22aa44, ambientParticleColor: 0x88ff99,
    decorations: ['coloredFlower', 'gardenBush', 'statue', 'fountain'],
    fogColor: 0x002211, fogAlpha: 0.08,
  },
  shadesmar: {
    tileBase: 0x0e0e20, tileAlt: 0x161630, tileBorder: 0x222244,
    edgeGlow: 0x4422aa, ambientParticleColor: 0xaa88ff,
    decorations: ['beadPile', 'flamespren', 'glassTree', 'shardPillar'],
    fogColor: 0x110033, fogAlpha: 0.2,
  },
  komashi: {
    tileBase: 0x281828, tileAlt: 0x322032, tileBorder: 0x442e44,
    edgeGlow: 0x8822aa, ambientParticleColor: 0xcc66ff,
    decorations: ['inkBlot', 'paperLantern', 'nightmareResidue', 'brush'],
    fogColor: 0x220033, fogAlpha: 0.15,
  },
  sel: {
    tileBase: 0x282820, tileAlt: 0x303020, tileBorder: 0x3a3a2a,
    edgeGlow: 0xaaaa33, ambientParticleColor: 0xdddd88,
    decorations: ['aonGlyph', 'stoneColumn', 'mossTile', 'shrine'],
    fogColor: 0x222200, fogAlpha: 0.1,
  },
};
