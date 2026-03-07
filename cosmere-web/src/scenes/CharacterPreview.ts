// ─── Character Preview (character creation) ─────────────────────

import { Container, Graphics } from 'pixi.js';
import { drawPlayerCharacter } from '../rendering/PlayerRenderer';
import type { ChampionClass } from '../data/types';

const CLASS_COLORS: Record<ChampionClass, number> = {
  mistborn: 0x888899,
  radiant: 0x4488ff,
  awakener: 0xff66aa,
  elantrian: 0xffcc33,
  sandMaster: 0xddcc66,
  nightmarePainter: 0xaa44cc,
};

export { CLASS_COLORS };

export function updateCharacterPreview(
  previewContainer: Container,
  selectedClass: ChampionClass,
): void {
  // Remove old preview character (keep background at index 0)
  while (previewContainer.children.length > 1) {
    previewContainer.removeChildAt(1);
  }

  const charSprite = new Graphics();
  drawPlayerCharacter(charSprite, selectedClass);
  charSprite.scale.set(3);
  charSprite.y = -5;
  previewContainer.addChild(charSprite);

  // Glow ring
  const glow = new Graphics();
  glow.circle(0, 10, 20).fill({ color: CLASS_COLORS[selectedClass], alpha: 0.08 });
  previewContainer.addChild(glow);
}
