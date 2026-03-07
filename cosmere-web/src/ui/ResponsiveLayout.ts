/**
 * Système de layout responsive — adapte l'UI à tous les écrans
 * (mobile portrait/landscape, tablette, desktop)
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
  const scale = Math.max(0.5, Math.min(2.0, minDim / refDim));

  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const dpr = window.devicePixelRatio || 1;

  // Safe areas pour les encoches / barres système
  const safeArea = getSafeArea();

  return { width: w, height: h, device, orientation, scale, safeArea, isTouch, dpr };
}

function getSafeArea(): { top: number; bottom: number; left: number; right: number } {
  const style = getComputedStyle(document.documentElement);
  return {
    top: parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0', 10) || 0,
    bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)') || '0', 10) || 0,
    left: parseInt(style.getPropertyValue('env(safe-area-inset-left)') || '0', 10) || 0,
    right: parseInt(style.getPropertyValue('env(safe-area-inset-right)') || '0', 10) || 0,
  };
}

// ─── Helpers de dimensionnement responsive ─────────────────────

/** Taille de police adaptative */
export function fontSize(base: number, layout: LayoutInfo): number {
  return Math.round(base * layout.scale);
}

/** Marge adaptative */
export function margin(base: number, layout: LayoutInfo): number {
  return Math.round(base * layout.scale);
}

/** Dimension adaptative */
export function scaled(value: number, layout: LayoutInfo): number {
  return value * layout.scale;
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
  if (layout.device === 'desktop') return 55;
  if (layout.device === 'tablet') return 55 * layout.scale;
  return 50 * layout.scale;
}

/** Taille des boutons d'action */
export function actionButtonScale(layout: LayoutInfo): number {
  if (layout.device === 'desktop') return 1.1;
  return Math.max(0.75, layout.scale);
}

/** Position de la minimap */
export function minimapPosition(layout: LayoutInfo): { x: number; y: number } {
  const m = margin(8, layout);
  const safeLeft = Math.max(layout.safeArea.left, m);

  if (layout.orientation === 'landscape') {
    // En landscape, minimap en bas à gauche au-dessus du joystick
    return {
      x: safeLeft + m,
      y: layout.height - scaled(100, layout) - scaled(110, layout) - m,
    };
  }
  // En portrait, minimap en bas à gauche au-dessus du joystick
  return {
    x: safeLeft + m,
    y: layout.height - scaled(100, layout) - scaled(110, layout) - m,
  };
}

/** Zone HUD (barres PV, etc) */
export function hudMargin(layout: LayoutInfo): { top: number; left: number; right: number } {
  const safeTop = Math.max(layout.safeArea.top, 8);
  const safeLeft = Math.max(layout.safeArea.left, 8);
  const safeRight = Math.max(layout.safeArea.right, 8);
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
    return { width: Math.min(400, layout.width - 40), height: layout.height - 30 };
  }
  return {
    width: Math.min(450, layout.width - 60),
    height: Math.min(500, layout.height - 60),
  };
}

/** Largeur de la boîte de dialogue */
export function dialogueWidth(layout: LayoutInfo): number {
  if (layout.device === 'desktop') return Math.min(600, layout.width - 80);
  return layout.width - 40;
}

/** Position des boutons de menu toolbar (pause, inventaire, etc) */
export function toolbarY(layout: LayoutInfo): number {
  return hudMargin(layout).top + scaled(2, layout);
}

/** Espacement entre les boutons toolbar */
export function toolbarButtonSize(layout: LayoutInfo): number {
  return scaled(26, layout);
}

/** Largeur de la barre HUD */
export function hudBarWidth(layout: LayoutInfo): number {
  if (layout.device === 'mobile' && layout.orientation === 'portrait') {
    return Math.min(120, layout.width * 0.3);
  }
  if (layout.device === 'mobile' && layout.orientation === 'landscape') {
    return 120;
  }
  return Math.min(160, layout.width * 0.15);
}

/** Quest tracker position */
export function questTrackerPosition(layout: LayoutInfo): { x: number; panelWidth: number } {
  const safeRight = Math.max(layout.safeArea.right, 8);
  const panelWidth = Math.min(180, layout.width * 0.4);
  return {
    x: layout.width - safeRight - panelWidth - 8,
    panelWidth,
  };
}
