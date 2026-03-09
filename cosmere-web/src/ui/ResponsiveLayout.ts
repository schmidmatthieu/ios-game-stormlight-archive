/**
 * Système de layout responsive — adapte l'UI à tous les écrans
 * (mobile portrait/landscape, tablette, desktop)
 *
 * Best practices:
 * - Minimum touch target: 44×44 pts (Apple HIG) / 48×48 dp (Material)
 * - Smooth scaling via lerp, not discrete jumps
 * - Safe area insets for notched devices
 * - WCAG AA contrast: 4.5:1 for normal text, 3:1 for large
 */

export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type Orientation = 'portrait' | 'landscape';

export interface LayoutInfo {
  width: number;
  height: number;
  device: DeviceType;
  orientation: Orientation;
  scale: number;        // Facteur d'échelle global (1.0 = 390px de référence)
  safeArea: { top: number; bottom: number; left: number; right: number };
  isTouch: boolean;
  dpr: number;          // Device pixel ratio
}

// Taille de référence (iPhone 14 / mobile standard)
const REF_WIDTH = 390;
const REF_HEIGHT = 844;

// ─── Design system tokens ──────────────────────────────────────
export const UI_COLORS = {
  // Backgrounds
  panelBg: 0x0a0a1a,
  panelBgAlt: 0x0a0815,
  overlayDark: 0x000000,
  // Borders
  borderSubtle: 0x334455,
  borderAccent: 0x554433,
  borderGold: 0x998033,
  // Text
  textPrimary: 0xeeddcc,
  textSecondary: 0xaabbcc,
  textMuted: 0x666677,
  textGold: 0xe6cc66,
  textGoldBright: 0xffdd77,
  // Status bars
  hpHigh: 0xcc4444,
  hpLow: 0xff3333,
  hpCritical: 0xff6644,
  investiture: 0x4488cc,
  investitureBright: 0x55aaff,
  xp: 0x55aa44,
  // Feedback
  success: 0x66cc44,
  warning: 0xffcc44,
  danger: 0xcc2222,
  info: 0x44aaff,
  // Buttons
  btnPrimary: 0x33264d,
  btnSecondary: 0x1a1528,
  btnDanger: 0x552222,
  btnSuccess: 0x224433,
} as const;

export const UI_ALPHA = {
  panelBg: 0.88,
  panelBorder: 0.5,
  overlay: 0.65,
  buttonBg: 0.85,
  barBg: 0.9,
  subtle: 0.3,
} as const;

// Minimum touch target in logical pixels
const MIN_TOUCH_TARGET = 44;

export function getLayoutInfo(w: number, h: number): LayoutInfo {
  const minDim = Math.min(w, h);
  const maxDim = Math.max(w, h);
  const orientation: Orientation = w >= h ? 'landscape' : 'portrait';

  let device: DeviceType;
  if (minDim < 500) {
    device = 'mobile';
  } else if (minDim < 900) {
    device = 'tablet';
  } else {
    device = 'desktop';
  }

  // Échelle basée sur la plus petite dimension par rapport à la ref
  const refDim = orientation === 'portrait' ? REF_WIDTH : REF_HEIGHT;
  const scale = Math.max(0.5, Math.min(2.5, minDim / refDim));

  const isTouch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
  const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;

  // Safe areas pour les encoches / barres système
  const safeArea = getSafeArea();

  return { width: w, height: h, device, orientation, scale, safeArea, isTouch, dpr };
}

function getSafeArea(): { top: number; bottom: number; left: number; right: number } {
  if (typeof document === 'undefined') return { top: 0, bottom: 0, left: 0, right: 0 };
  const style = getComputedStyle(document.documentElement);
  const parse = (prop: string): number => {
    const val = style.getPropertyValue(prop);
    return parseInt(val || '0', 10) || 0;
  };
  return {
    top: parse('env(safe-area-inset-top)'),
    bottom: parse('env(safe-area-inset-bottom)'),
    left: parse('env(safe-area-inset-left)'),
    right: parse('env(safe-area-inset-right)'),
  };
}

// ─── Helpers de dimensionnement responsive ─────────────────────

/** Taille de police adaptative — minimum 10px effective pour lisibilité */
export function fontSize(base: number, layout: LayoutInfo): number {
  const raw = base * layout.scale;
  return Math.round(Math.max(raw, Math.min(base, 10)));
}

/** Marge adaptative */
export function margin(base: number, layout: LayoutInfo): number {
  return Math.round(base * layout.scale);
}

/** Dimension adaptative */
export function scaled(value: number, layout: LayoutInfo): number {
  return value * layout.scale;
}

/** Smooth lerp between device sizes — avoids discrete jumps */
export function smoothScale(mobile: number, tablet: number, desktop: number, layout: LayoutInfo): number {
  const minDim = Math.min(layout.width, layout.height);
  if (minDim < 500) {
    // Mobile: lerp from 320..500
    const t = Math.max(0, (minDim - 320) / 180);
    return mobile + (tablet - mobile) * t * 0.3;
  } else if (minDim < 900) {
    // Tablet: lerp from 500..900
    const t = (minDim - 500) / 400;
    return mobile + (tablet - mobile) * (0.3 + t * 0.7);
  }
  // Desktop: lerp from 900..1400
  const t = Math.min(1, (minDim - 900) / 500);
  return tablet + (desktop - tablet) * t;
}

/** Ensure touch target meets minimum size */
export function touchTarget(baseSize: number, layout: LayoutInfo): number {
  const s = scaled(baseSize, layout);
  return layout.isTouch ? Math.max(s, MIN_TOUCH_TARGET) : s;
}

/** Position du joystick selon l'écran */
export function joystickPosition(layout: LayoutInfo): { x: number; y: number } {
  const m = margin(20, layout);
  const safeBottom = Math.max(layout.safeArea.bottom, m);
  const safeLeft = Math.max(layout.safeArea.left, m);

  const baseOffset = scaled(70, layout);
  return {
    x: safeLeft + baseOffset,
    y: layout.height - safeBottom - baseOffset,
  };
}

/** Position des boutons d'action selon l'écran */
export function actionButtonsPosition(layout: LayoutInfo): { x: number; y: number } {
  const m = margin(20, layout);
  const safeBottom = Math.max(layout.safeArea.bottom, m);
  const safeRight = Math.max(layout.safeArea.right, m);

  const baseOffset = scaled(80, layout);
  return {
    x: layout.width - safeRight - baseOffset,
    y: layout.height - safeBottom - baseOffset - scaled(10, layout),
  };
}

/** Taille du joystick */
export function joystickRadius(layout: LayoutInfo): number {
  return smoothScale(45, 55, 60, layout);
}

/** Taille des boutons d'action */
export function actionButtonScale(layout: LayoutInfo): number {
  if (layout.device === 'desktop') return 1.1;
  return Math.max(0.85, layout.scale);
}

/** Position de la minimap */
export function minimapPosition(layout: LayoutInfo): { x: number; y: number } {
  const m = margin(8, layout);
  const safeLeft = Math.max(layout.safeArea.left, m);
  const joystickOffset = layout.orientation === 'landscape' ? scaled(90, layout) : scaled(110, layout);

  return {
    x: safeLeft + m,
    y: layout.height - smoothScale(85, 105, 125, layout) - joystickOffset - m,
  };
}

/** Taille de la minimap — smooth scaling */
export function minimapSize(layout: LayoutInfo): number {
  return Math.round(smoothScale(85, 105, 125, layout));
}

/** Zone HUD (barres PV, etc) */
export function hudMargin(layout: LayoutInfo): { top: number; left: number; right: number } {
  const safeTop = Math.max(layout.safeArea.top, scaled(8, layout));
  const safeLeft = Math.max(layout.safeArea.left, scaled(8, layout));
  const safeRight = Math.max(layout.safeArea.right, scaled(8, layout));
  return {
    top: safeTop + margin(4, layout),
    left: safeLeft + margin(4, layout),
    right: safeRight + margin(4, layout),
  };
}

/** Taille max du panneau d'inventaire */
export function panelSize(layout: LayoutInfo): { width: number; height: number } {
  if (layout.device === 'mobile' && layout.orientation === 'portrait') {
    return { width: layout.width - 20, height: layout.height - 60 };
  }
  if (layout.device === 'mobile' && layout.orientation === 'landscape') {
    return { width: Math.min(420, layout.width - 40), height: layout.height - 30 };
  }
  return {
    width: Math.min(480, layout.width - 60),
    height: Math.min(540, layout.height - 60),
  };
}

/** Largeur de la boîte de dialogue */
export function dialogueWidth(layout: LayoutInfo): number {
  if (layout.device === 'desktop') return Math.min(600, layout.width - 80);
  if (layout.device === 'tablet') return Math.min(520, layout.width - 60);
  return layout.width - 32;
}

/** Position des boutons de menu toolbar (pause, inventaire, etc) */
export function toolbarY(layout: LayoutInfo): number {
  return hudMargin(layout).top + scaled(2, layout);
}

/** Espacement entre les boutons toolbar */
export function toolbarButtonSize(layout: LayoutInfo): number {
  return touchTarget(26, layout);
}

/** Largeur de la barre HUD */
export function hudBarWidth(layout: LayoutInfo): number {
  if (layout.device === 'mobile' && layout.orientation === 'portrait') {
    return Math.min(130, layout.width * 0.33);
  }
  if (layout.device === 'mobile' && layout.orientation === 'landscape') {
    return 130;
  }
  return Math.min(170, layout.width * 0.16);
}

/** Quest tracker position */
export function questTrackerPosition(layout: LayoutInfo): { x: number; y: number; panelWidth: number } {
  const safeRight = Math.max(layout.safeArea.right, scaled(8, layout));
  const safeTop = Math.max(layout.safeArea.top, scaled(8, layout));

  if (layout.device === 'mobile') {
    // Mobile: smaller, pushed to right edge, below hamburger button
    const panelWidth = Math.min(130, layout.width * 0.35);
    return {
      x: layout.width - safeRight - panelWidth - scaled(4, layout),
      y: safeTop + scaled(38, layout),
      panelWidth,
    };
  }

  const panelWidth = Math.min(190, layout.width * 0.4);
  return {
    x: layout.width - safeRight - panelWidth - scaled(8, layout),
    y: safeTop + scaled(80, layout),
    panelWidth,
  };
}

/** Common panel border radius */
export function panelRadius(layout: LayoutInfo): number {
  return scaled(10, layout);
}

/** Standard button height */
export function buttonHeight(layout: LayoutInfo): number {
  return touchTarget(32, layout);
}
