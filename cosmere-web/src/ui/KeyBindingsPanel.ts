// KeyBindingsPanel — Fullscreen overlay for rebinding keyboard controls

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { KeyboardManager } from '../input/KeyboardManager';
import { keyCodeToLabel, ACTION_LABELS } from '../input/KeyBindings';
import type { GameAction } from '../input/KeyBindings';
import { getLayoutInfo, fontSize, scaled, panelRadius, UI_COLORS, UI_ALPHA } from './ResponsiveLayout';

const ALL_ACTIONS: GameAction[] = [
  'moveUp', 'moveDown', 'moveLeft', 'moveRight',
  'attack', 'interact',
  'skill1', 'skill2', 'skill3', 'skill4',
  'ultimate',
  'potion1', 'potion2', 'potion3',
  'inventory', 'pause',
];

export function showKeyBindingsPanel(
  uiContainer: Container,
  screenW: number,
  screenH: number,
  keyboard: KeyboardManager,
  onClose: () => void,
): Container {
  const layout = getLayoutInfo(screenW, screenH);
  const root = new Container();
  root.zIndex = 10000;

  // --- Overlay ---
  const overlay = new Graphics();
  overlay.rect(0, 0, screenW, screenH).fill({ color: 0x000000, alpha: UI_ALPHA.overlay });
  overlay.eventMode = 'static';
  overlay.on('pointerdown', () => {
    // Cancel any active rebind and re-enable input before closing
    keyboard.cancelRebind();
    keyboard.setEnabled(true);
    onClose();
  });
  root.addChild(overlay);

  // --- Panel dimensions ---
  const radius = panelRadius(layout);
  const rowH = scaled(22, layout);
  const rowSpacing = scaled(4, layout);
  const titleH = scaled(40, layout);
  const bottomPadding = scaled(50, layout);
  const topPadding = scaled(16, layout);
  const panelW = Math.min(scaled(320, layout), screenW - 40);
  const panelH = Math.min(
    titleH + topPadding + ALL_ACTIONS.length * (rowH + rowSpacing) + bottomPadding,
    screenH - 40,
  );
  const px = (screenW - panelW) / 2;
  const py = (screenH - panelH) / 2;

  // --- Panel background ---
  const panel = new Graphics();
  panel.roundRect(px, py, panelW, panelH, radius + 2)
    .fill({ color: UI_COLORS.panelBgAlt, alpha: 0.96 })
    .stroke({ color: UI_COLORS.borderAccent, width: 2, alpha: 0.7 });
  panel.eventMode = 'static'; // block clicks from reaching overlay
  root.addChild(panel);

  // --- Title ---
  const title = new Text({
    text: 'CONTR\u00D4LES',
    style: new TextStyle({
      fontFamily: 'Georgia, serif',
      fontSize: fontSize(20, layout),
      fill: UI_COLORS.textGold,
      fontWeight: 'bold',
    }),
  });
  title.anchor.set(0.5);
  title.x = screenW / 2;
  title.y = py + scaled(24, layout);
  root.addChild(title);

  // --- Key label buttons (kept for refresh) ---
  const keyTexts: Text[] = [];
  const keyBgs: Graphics[] = [];

  const contentStartY = py + titleH + topPadding;
  const labelX = px + scaled(16, layout);
  const keyBtnW = scaled(70, layout);
  const keyBtnX = px + panelW - scaled(16, layout) - keyBtnW;

  for (let i = 0; i < ALL_ACTIONS.length; i++) {
    const action = ALL_ACTIONS[i];
    const rowY = contentStartY + i * (rowH + rowSpacing);

    // Action label (left)
    const label = new Text({
      text: ACTION_LABELS[action],
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: fontSize(12, layout),
        fill: UI_COLORS.textPrimary,
      }),
    });
    label.anchor.set(0, 0.5);
    label.x = labelX;
    label.y = rowY + rowH / 2;
    root.addChild(label);

    // Key button background (right)
    const keyBg = new Graphics();
    keyBg.roundRect(keyBtnX, rowY, keyBtnW, rowH, 6)
      .fill({ color: UI_COLORS.btnSecondary, alpha: UI_ALPHA.buttonBg })
      .stroke({ color: UI_COLORS.borderAccent, width: 1, alpha: UI_ALPHA.panelBorder });
    keyBg.eventMode = 'static';
    keyBg.cursor = 'pointer';
    root.addChild(keyBg);
    keyBgs.push(keyBg);

    // Key label text
    const keyText = new Text({
      text: keyCodeToLabel(keyboard.bindings.getKey(action)),
      style: new TextStyle({
        fontFamily: 'Georgia, serif',
        fontSize: fontSize(11, layout),
        fill: UI_COLORS.textPrimary,
      }),
    });
    keyText.anchor.set(0.5);
    keyText.x = keyBtnX + keyBtnW / 2;
    keyText.y = rowY + rowH / 2;
    root.addChild(keyText);
    keyTexts.push(keyText);

    // Click handler for rebinding
    keyBg.on('pointerdown', (e) => {
      e.stopPropagation();
      startRebind(action, i);
    });
  }

  // --- Refresh all key labels ---
  function refreshAllLabels(): void {
    for (let i = 0; i < ALL_ACTIONS.length; i++) {
      const code = keyboard.bindings.getKey(ALL_ACTIONS[i]);
      keyTexts[i].text = keyCodeToLabel(code);
      keyTexts[i].style.fill = UI_COLORS.textPrimary;
    }
  }

  // --- Rebind flow ---
  async function startRebind(action: GameAction, index: number): Promise<void> {
    // Show waiting state
    keyTexts[index].text = '...';
    keyTexts[index].style.fill = UI_COLORS.textGold;

    // Disable normal input while waiting for rebind key
    keyboard.setEnabled(false);
    const code = await keyboard.waitForKey();

    // Apply binding (handles swap internally)
    keyboard.bindings.setKey(action, code);

    // Re-enable input and refresh labels
    keyboard.setEnabled(true);
    refreshAllLabels();
  }

  // --- Reset button ---
  const resetBtnW = scaled(120, layout);
  const resetBtnH = scaled(26, layout);
  const resetBtnX = (screenW - resetBtnW) / 2;
  const resetBtnY = py + panelH - scaled(36, layout);

  const resetBg = new Graphics();
  resetBg.roundRect(resetBtnX, resetBtnY, resetBtnW, resetBtnH, 6)
    .fill({ color: UI_COLORS.btnDanger, alpha: UI_ALPHA.buttonBg })
    .stroke({ color: UI_COLORS.borderAccent, width: 1, alpha: UI_ALPHA.panelBorder });
  resetBg.eventMode = 'static';
  resetBg.cursor = 'pointer';
  resetBg.on('pointerdown', (e) => {
    e.stopPropagation();
    resetBg.alpha = 0.7;
    keyboard.bindings.resetDefaults();
    refreshAllLabels();
  });
  resetBg.on('pointerup', () => { resetBg.alpha = 1; });
  resetBg.on('pointerupoutside', () => { resetBg.alpha = 1; });
  root.addChild(resetBg);

  const resetText = new Text({
    text: 'R\u00E9initialiser',
    style: new TextStyle({
      fontFamily: 'Georgia, serif',
      fontSize: fontSize(12, layout),
      fill: UI_COLORS.textPrimary,
    }),
  });
  resetText.anchor.set(0.5);
  resetText.x = resetBtnX + resetBtnW / 2;
  resetText.y = resetBtnY + resetBtnH / 2;
  root.addChild(resetText);

  uiContainer.addChild(root);
  return root;
}
