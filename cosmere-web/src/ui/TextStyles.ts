// ─── Centralized Text Style Definitions ──────────────────────────

import { TextStyle } from 'pixi.js';

/** Common font families — uses Cinzel for fantasy headings, EB Garamond for body */
export const FONT_TITLE = "'Cinzel', 'Copperplate', 'Georgia', serif";
export const FONT_SERIF = "'EB Garamond', 'Georgia', serif";
export const FONT_SANS = 'sans-serif';

/** Reusable text styles for consistent UI across the game */
export const TEXT_STYLES = {
  // ─── Headings ─────────────────────────────────────────
  titleGold: new TextStyle({
    fontFamily: FONT_TITLE, fontSize: 16, fill: 0xe6cc66, fontWeight: 'bold',
    letterSpacing: 1,
  }),
  titleLarge: new TextStyle({
    fontFamily: FONT_TITLE, fontSize: 28, fill: 0xe6cc66, fontWeight: 'bold',
    dropShadow: { color: 0x000000, blur: 6, distance: 2 },
    letterSpacing: 2,
  }),
  titleRed: new TextStyle({
    fontFamily: FONT_TITLE, fontSize: 28, fill: 0xcc2222, fontWeight: 'bold',
    dropShadow: { color: 0x000000, blur: 6, distance: 2 },
    letterSpacing: 2,
  }),

  // ─── Body / Labels ────────────────────────────────────
  labelSmall: new TextStyle({
    fontFamily: FONT_SANS, fontSize: 8, fill: 0x888888,
  }),
  labelMedium: new TextStyle({
    fontFamily: FONT_SANS, fontSize: 9, fill: 0xaaaacc,
  }),
  labelLight: new TextStyle({
    fontFamily: FONT_SANS, fontSize: 10, fill: 0xeeddcc,
  }),
  labelGold: new TextStyle({
    fontFamily: FONT_SANS, fontSize: 10, fill: 0xe6cc66, fontWeight: 'bold',
  }),

  // ─── NPC / Entity Names ───────────────────────────────
  npcName: new TextStyle({
    fontFamily: FONT_SERIF, fontSize: 8, fill: 0xaaaacc,
    dropShadow: { color: 0x000000, blur: 2, distance: 1 },
  }),
  shopkeeperName: new TextStyle({
    fontFamily: FONT_SERIF, fontSize: 8, fill: 0xe6cc33,
    dropShadow: { color: 0x000000, blur: 2, distance: 1 },
  }),

  // ─── HUD / Combat ────────────────────────────────────
  damageNumber: new TextStyle({
    fontFamily: FONT_SANS, fontSize: 14, fill: 0xffffff, fontWeight: 'bold',
    dropShadow: { color: 0x000000, blur: 2, distance: 1 },
  }),
  statGreen: new TextStyle({
    fontFamily: FONT_SANS, fontSize: 7, fill: 0x66cc44,
  }),
  equipHint: new TextStyle({
    fontFamily: FONT_SANS, fontSize: 8, fill: 0x66cc44,
  }),

  // ─── Menu / Buttons ───────────────────────────────────
  buttonLabel: new TextStyle({
    fontFamily: FONT_TITLE, fontSize: 14, fill: 0xffcccc, fontWeight: 'bold',
    letterSpacing: 1,
  }),
  menuItem: new TextStyle({
    fontFamily: FONT_SANS, fontSize: 11, fill: 0xeeddcc,
  }),

  // ─── Flavor Text ──────────────────────────────────────
  flavorItalic: new TextStyle({
    fontFamily: FONT_SERIF, fontSize: 10, fill: 0x886666, fontStyle: 'italic',
  }),
} as const;

/**
 * Create a TextStyle clone with overridden properties.
 * Useful when you need a variant of an existing style.
 */
export function styleVariant(
  base: TextStyle,
  overrides: Partial<ConstructorParameters<typeof TextStyle>[0]>,
): TextStyle {
  const baseProps = {
    fontFamily: base.fontFamily,
    fontSize: base.fontSize,
    fill: base.fill,
    fontWeight: base.fontWeight,
    fontStyle: base.fontStyle,
    align: base.align,
  };
  return new TextStyle({ ...baseProps, ...overrides });
}
