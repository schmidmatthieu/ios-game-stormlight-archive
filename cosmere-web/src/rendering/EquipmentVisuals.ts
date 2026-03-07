// ─── Equipment Visual Overlays ──────────────────────────────────
// Draws visual equipment on the player character based on equipped items

import { Graphics } from 'pixi.js';
import { lighten, darken } from '../utils/ColorUtils';
import type { EquipmentLoadout, ItemRarity } from '../data/types';
import { gameData } from '../data/DataLoader';
import { RARITY_COLORS } from '../data/types';

// ─── Visual Config per Rarity ────────────────────────────────────

interface RarityVisual {
  shimmer: boolean;
  glowAlpha: number;
  detailLevel: number; // 0=basic, 1=medium, 2=ornate
}

const RARITY_VISUALS: Record<ItemRarity, RarityVisual> = {
  common:    { shimmer: false, glowAlpha: 0,    detailLevel: 0 },
  uncommon:  { shimmer: false, glowAlpha: 0,    detailLevel: 0 },
  rare:      { shimmer: false, glowAlpha: 0.05, detailLevel: 1 },
  epic:      { shimmer: true,  glowAlpha: 0.08, detailLevel: 1 },
  legendary: { shimmer: true,  glowAlpha: 0.12, detailLevel: 2 },
  cosmeric:  { shimmer: true,  glowAlpha: 0.15, detailLevel: 2 },
};

// ─── Weapon Shapes ───────────────────────────────────────────────

type WeaponType = 'dagger' | 'sword' | 'greatsword' | 'staff' | 'spear' | 'mace' | 'bow' | 'wand';

function guessWeaponType(itemID: string): WeaponType {
  const id = itemID.toLowerCase();
  if (id.includes('dague') || id.includes('dagger') || id.includes('couteau')) return 'dagger';
  if (id.includes('greatsword') || id.includes('claymore') || id.includes('epee_large')) return 'greatsword';
  if (id.includes('epee') || id.includes('sword') || id.includes('lame')) return 'sword';
  if (id.includes('staff') || id.includes('baton') || id.includes('sceptre')) return 'staff';
  if (id.includes('lance') || id.includes('spear') || id.includes('pique')) return 'spear';
  if (id.includes('masse') || id.includes('mace') || id.includes('marteau')) return 'mace';
  if (id.includes('arc') || id.includes('bow')) return 'bow';
  if (id.includes('wand') || id.includes('baguette')) return 'wand';
  return 'sword';
}

function drawEquipWeapon(g: Graphics, weaponType: WeaponType, color: number, rarity: RarityVisual): void {
  const c = color;
  const hi = lighten(c, 0.3);

  switch (weaponType) {
    case 'dagger':
      g.poly([{ x: 14, y: -14 }, { x: 15, y: -26 }, { x: 16, y: -14 }]).fill({ color: c, alpha: 0.85 });
      g.moveTo(15, -26).lineTo(15, -14).stroke({ color: hi, width: 0.5, alpha: 0.6 });
      if (rarity.detailLevel >= 1) {
        g.rect(12.5, -14, 5, 2).fill({ color: darken(c, 0.2), alpha: 0.8 }); // guard
      }
      break;
    case 'sword':
      g.poly([{ x: 13.5, y: -12 }, { x: 14.5, y: -34 }, { x: 16.5, y: -34 }, { x: 17, y: -12 }])
        .fill({ color: c, alpha: 0.85 });
      g.moveTo(15.5, -34).lineTo(15.5, -12).stroke({ color: hi, width: 0.6, alpha: 0.5 });
      g.rect(11, -12, 9, 2.5).fill({ color: darken(c, 0.3), alpha: 0.85 }); // crossguard
      if (rarity.detailLevel >= 1) {
        g.circle(15.5, -11, 1.5).fill({ color: 0xddaa33, alpha: 0.7 }); // pommel gem
      }
      if (rarity.detailLevel >= 2) {
        g.circle(15.5, -25, 1).fill({ color: hi, alpha: 0.4 });
        g.circle(15.5, -20, 1).fill({ color: hi, alpha: 0.3 });
      }
      break;
    case 'greatsword':
      g.poly([{ x: 12, y: -10 }, { x: 14, y: -40 }, { x: 17, y: -40 }, { x: 19, y: -10 }])
        .fill({ color: c, alpha: 0.85 });
      g.moveTo(15.5, -40).lineTo(15.5, -10).stroke({ color: hi, width: 0.8, alpha: 0.5 });
      g.rect(9, -10, 13, 3).fill({ color: darken(c, 0.3), alpha: 0.85 });
      if (rarity.detailLevel >= 2) {
        // Rune engravings
        g.moveTo(14.5, -35).lineTo(14.5, -30).stroke({ color: hi, width: 0.5, alpha: 0.4 });
        g.moveTo(16.5, -28).lineTo(16.5, -22).stroke({ color: hi, width: 0.5, alpha: 0.4 });
      }
      break;
    case 'staff':
      g.rect(14, -38, 2, 32).fill({ color: 0x664422, alpha: 0.85 });
      g.circle(15, -39, 4).fill({ color: c, alpha: 0.55 });
      g.circle(15, -39, 4).stroke({ color: hi, width: 1, alpha: 0.6 });
      if (rarity.detailLevel >= 1) {
        g.circle(15, -39, 2).fill({ color: hi, alpha: 0.35 });
      }
      if (rarity.detailLevel >= 2) {
        g.circle(15, -39, 5.5).stroke({ color: hi, width: 0.5, alpha: 0.25 }); // outer glow ring
      }
      break;
    case 'spear':
      g.rect(14.5, -40, 1.5, 34).fill({ color: 0x665533, alpha: 0.85 });
      g.poly([{ x: 13, y: -40 }, { x: 15.25, y: -46 }, { x: 17.5, y: -40 }])
        .fill({ color: c, alpha: 0.85 });
      if (rarity.detailLevel >= 1) {
        g.moveTo(15.25, -46).lineTo(15.25, -40).stroke({ color: hi, width: 0.5, alpha: 0.5 });
      }
      break;
    case 'mace':
      g.rect(14, -12, 2, 18).fill({ color: 0x665533, alpha: 0.85 });
      g.circle(15, -32, 5).fill({ color: c, alpha: 0.85 });
      if (rarity.detailLevel >= 1) {
        // Flanges
        for (let a = 0; a < 4; a++) {
          const angle = (a / 4) * Math.PI * 2;
          const sx = 15 + Math.cos(angle) * 5;
          const sy = -32 + Math.sin(angle) * 5;
          g.circle(sx, sy, 1.5).fill({ color: darken(c, 0.2), alpha: 0.7 });
        }
      }
      break;
    case 'bow':
      g.moveTo(18, -10).quadraticCurveTo(22, -22, 18, -34)
        .stroke({ color: 0x665533, width: 1.5, alpha: 0.85 });
      g.moveTo(18, -10).lineTo(18, -34).stroke({ color: 0xccccaa, width: 0.5, alpha: 0.6 }); // string
      if (rarity.detailLevel >= 1) {
        g.circle(18, -22, 1).fill({ color: c, alpha: 0.6 }); // grip gem
      }
      break;
    case 'wand':
      g.rect(14, -28, 1.5, 20).fill({ color: 0x665533, alpha: 0.85 });
      g.circle(14.75, -29, 3).fill({ color: c, alpha: 0.5 });
      g.circle(14.75, -29, 3).stroke({ color: hi, width: 0.8, alpha: 0.5 });
      break;
  }
}

// ─── Armor Overlays ──────────────────────────────────────────────

function drawHelmet(g: Graphics, color: number, rarity: RarityVisual): void {
  // Full helmet overlay
  g.poly([
    { x: -6, y: -34 }, { x: -5, y: -40 }, { x: 0, y: -42 },
    { x: 5, y: -40 }, { x: 6, y: -34 },
  ]).fill({ color, alpha: 0.65 });

  // Visor slit
  g.rect(-3, -35, 6, 1.5).fill({ color: 0x111111, alpha: 0.5 });

  if (rarity.detailLevel >= 1) {
    // Crest
    g.poly([{ x: -1, y: -42 }, { x: 0, y: -46 }, { x: 1, y: -42 }])
      .fill({ color: lighten(color, 0.2), alpha: 0.6 });
  }
  if (rarity.detailLevel >= 2) {
    // Side ornaments
    g.circle(-6, -37, 1.2).fill({ color: 0xddaa33, alpha: 0.7 });
    g.circle(6, -37, 1.2).fill({ color: 0xddaa33, alpha: 0.7 });
  }
}

function drawChestArmor(g: Graphics, color: number, rarity: RarityVisual): void {
  // Chest plate overlay
  g.poly([
    { x: -7, y: -13 }, { x: -8, y: -23 }, { x: 0, y: -25 },
    { x: 8, y: -23 }, { x: 7, y: -13 },
  ]).fill({ color, alpha: 0.5 });

  // Center line highlight
  g.moveTo(0, -24).lineTo(0, -14).stroke({ color: lighten(color, 0.3), width: 0.8, alpha: 0.4 });

  if (rarity.detailLevel >= 1) {
    // Pectoral plates
    g.poly([
      { x: -5, y: -16 }, { x: -6, y: -21 }, { x: -1, y: -23 }, { x: -1, y: -16 },
    ]).stroke({ color: lighten(color, 0.15), width: 0.5, alpha: 0.5 });
    g.poly([
      { x: 5, y: -16 }, { x: 6, y: -21 }, { x: 1, y: -23 }, { x: 1, y: -16 },
    ]).stroke({ color: lighten(color, 0.15), width: 0.5, alpha: 0.5 });
  }
  if (rarity.detailLevel >= 2) {
    // Gem inlay at center chest
    g.circle(0, -19, 1.5).fill({ color: 0xddaa33, alpha: 0.6 });
  }
}

function drawShoulderArmor(g: Graphics, color: number, rarity: RarityVisual): void {
  // Larger shoulder plates
  g.ellipse(-10, -23, 6, 3.5).fill({ color, alpha: 0.65 });
  g.ellipse(10, -23, 6, 3.5).fill({ color, alpha: 0.65 });

  if (rarity.detailLevel >= 1) {
    // Edge trim
    g.ellipse(-10, -23, 6, 3.5).stroke({ color: lighten(color, 0.2), width: 0.5, alpha: 0.5 });
    g.ellipse(10, -23, 6, 3.5).stroke({ color: lighten(color, 0.2), width: 0.5, alpha: 0.5 });
  }
  if (rarity.detailLevel >= 2) {
    // Spikes
    g.poly([{ x: -14, y: -24 }, { x: -16, y: -28 }, { x: -13, y: -24 }])
      .fill({ color: lighten(color, 0.1), alpha: 0.6 });
    g.poly([{ x: 14, y: -24 }, { x: 16, y: -28 }, { x: 13, y: -24 }])
      .fill({ color: lighten(color, 0.1), alpha: 0.6 });
  }
}

function drawCape(g: Graphics, color: number, rarity: RarityVisual): void {
  // Enhanced cape
  g.poly([
    { x: -8, y: -18 }, { x: -14, y: 8 }, { x: -10, y: 10 },
    { x: 0, y: 8 }, { x: 10, y: 10 }, { x: 14, y: 8 }, { x: 8, y: -18 },
  ]).fill({ color, alpha: 0.75 });

  // Fabric folds
  g.moveTo(-6, -14).lineTo(-10, 6).stroke({ color: lighten(color, 0.2), width: 0.5, alpha: 0.3 });
  g.moveTo(6, -14).lineTo(10, 6).stroke({ color: lighten(color, 0.2), width: 0.5, alpha: 0.3 });

  if (rarity.detailLevel >= 1) {
    // Trim at bottom
    g.moveTo(-14, 8).lineTo(-10, 10).lineTo(0, 8).lineTo(10, 10).lineTo(14, 8)
      .stroke({ color: lighten(color, 0.3), width: 1, alpha: 0.5 });
  }
  if (rarity.detailLevel >= 2) {
    // Emblem at back
    g.circle(0, -6, 3).fill({ color: lighten(color, 0.4), alpha: 0.25 });
    g.circle(0, -6, 3).stroke({ color: lighten(color, 0.5), width: 0.5, alpha: 0.4 });
  }
}

function drawGloves(g: Graphics, color: number, _rarity: RarityVisual): void {
  g.rect(-13, -11, 4, 3).fill({ color, alpha: 0.7 });
  g.rect(9, -11, 4, 3).fill({ color, alpha: 0.7 });
}

function drawBoots(g: Graphics, color: number, rarity: RarityVisual): void {
  g.roundRect(-6.5, -3, 5.5, 5.5, 1.5).fill({ color, alpha: 0.7 });
  g.roundRect(0.5, -3, 5.5, 5.5, 1.5).fill({ color, alpha: 0.7 });
  if (rarity.detailLevel >= 1) {
    g.rect(-6, -1, 5, 1).fill({ color: lighten(color, 0.25), alpha: 0.4 }); // buckle
    g.rect(1, -1, 5, 1).fill({ color: lighten(color, 0.25), alpha: 0.4 });
  }
}

function drawLegs(g: Graphics, color: number, _rarity: RarityVisual): void {
  g.rect(-5.5, -10, 4.5, 8).fill({ color, alpha: 0.55 });
  g.rect(0.5, -10, 4.5, 8).fill({ color, alpha: 0.55 });
}

// ─── Rarity Glow ─────────────────────────────────────────────────

function drawRarityGlow(g: Graphics, rarity: ItemRarity): void {
  const visual = RARITY_VISUALS[rarity];
  if (visual.glowAlpha <= 0) return;
  const color = RARITY_COLORS[rarity];
  g.circle(0, -18, 22).fill({ color, alpha: visual.glowAlpha });
  if (visual.shimmer) {
    g.circle(0, -18, 16).fill({ color, alpha: visual.glowAlpha * 0.5 });
  }
}

// ─── Main Equipment Overlay Function ─────────────────────────────

/** Draw equipment visuals over the player sprite. Call after drawPlayerCharacter. */
export function drawEquipmentOverlay(g: Graphics, equipment: EquipmentLoadout): void {
  // Determine best rarity for glow effect
  let bestRarity: ItemRarity = 'common';
  const rarityOrder: ItemRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'cosmeric'];

  const getItemInfo = (itemID: string | null) => {
    if (!itemID) return null;
    const item = gameData.item(itemID);
    if (!item) return null;
    const color = RARITY_COLORS[item.rarity];
    const visual = RARITY_VISUALS[item.rarity];
    if (rarityOrder.indexOf(item.rarity) > rarityOrder.indexOf(bestRarity)) {
      bestRarity = item.rarity;
    }
    return { item, color, visual };
  };

  // Cape (drawn first, behind everything)
  const cape = getItemInfo(equipment.cape);
  if (cape) {
    drawCape(g, cape.color, cape.visual);
  }

  // Boots
  const boots = getItemInfo(equipment.boots);
  if (boots) {
    drawBoots(g, boots.color, boots.visual);
  }

  // Legs
  const legs = getItemInfo(equipment.legs);
  if (legs) {
    drawLegs(g, legs.color, legs.visual);
  }

  // Chest armor
  const chest = getItemInfo(equipment.chest);
  if (chest) {
    drawChestArmor(g, chest.color, chest.visual);
  }

  // Shoulders
  const shoulders = getItemInfo(equipment.shoulders);
  if (shoulders) {
    drawShoulderArmor(g, shoulders.color, shoulders.visual);
  }

  // Gloves
  const gloves = getItemInfo(equipment.gloves);
  if (gloves) {
    drawGloves(g, gloves.color, gloves.visual);
  }

  // Main weapon
  const weapon = getItemInfo(equipment.mainWeapon);
  if (weapon) {
    const weaponType = guessWeaponType(weapon.item.id);
    drawEquipWeapon(g, weaponType, weapon.color, weapon.visual);
  }

  // Helmet (drawn last, on top)
  const helmet = getItemInfo(equipment.helmet);
  if (helmet) {
    drawHelmet(g, helmet.color, helmet.visual);
  }

  // Overall rarity glow
  if (rarityOrder.indexOf(bestRarity) >= 2) { // rare+
    drawRarityGlow(g, bestRarity);
  }
}
