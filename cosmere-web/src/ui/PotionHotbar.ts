// ─── Potion Quick-Use Hotbar ─────────────────────────────────────────
// Three potion slots displayed below the action buttons for combat use.
// Horizontal strip at the bottom-right of the screen.

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { PotionManager, POTIONS } from '../game/PotionSystem';
import { getLayoutInfo, scaled, fontSize, UI_COLORS } from './ResponsiveLayout';
import type { LayoutInfo } from './ResponsiveLayout';

export interface PotionHotbarCallbacks {
  onUsePotion: (slotIndex: number) => void;
}

export function createPotionHotbar(
  uiContainer: Container,
  screenW: number, screenH: number,
  callbacks: PotionHotbarCallbacks,
): { container: Container; refresh: () => void } {
  const layout = getLayoutInfo(screenW, screenH);
  const container = new Container();
  container.zIndex = 6000;

  const isMobile = layout.device === 'mobile';
  const slotSize = isMobile ? scaled(26, layout) : scaled(32, layout);
  const gap = scaled(isMobile ? 4 : 6, layout);

  // Position: below the action buttons (bottom right)
  let startX: number;
  let startY: number;

  if (isMobile) {
    // Horizontal row below action buttons
    const totalW = slotSize * 3 + gap * 2;
    const safeBottom = Math.max(layout.safeArea.bottom, scaled(8, layout));
    startX = screenW - totalW - scaled(20, layout);
    startY = screenH - safeBottom - slotSize - scaled(6, layout);
  } else {
    const totalW = slotSize * 3 + gap * 2;
    const safeBottom = Math.max(layout.safeArea.bottom, scaled(8, layout));
    startX = screenW - totalW - scaled(20, layout);
    startY = screenH - safeBottom - slotSize - scaled(6, layout);
  }

  const slotGraphics: Graphics[] = [];
  const countTexts: Text[] = [];
  const iconTexts: Text[] = [];
  const positions: { x: number; y: number }[] = [];

  for (let i = 0; i < 3; i++) {
    let x: number;
    let y: number;
    // Always horizontal row below action buttons
    x = startX + i * (slotSize + gap);
    y = startY;
    positions.push({ x, y });

    // Slot background
    const bg = new Graphics();
    bg.roundRect(x, y, slotSize, slotSize, 6)
      .fill({ color: 0x0a0a1a, alpha: 0.8 })
      .stroke({ color: 0x334455, width: 1.5, alpha: 0.6 });
    bg.eventMode = 'static';
    bg.cursor = 'pointer';

    const idx = i;
    bg.on('pointerdown', () => callbacks.onUsePotion(idx));
    container.addChild(bg);
    slotGraphics.push(bg);

    // Potion icon
    const icon = new Text({
      text: '',
      style: new TextStyle({ fontSize: fontSize(isMobile ? 11 : 14, layout) }),
    });
    icon.anchor.set(0.5);
    icon.x = x + slotSize / 2;
    icon.y = y + slotSize / 2 - 2;
    container.addChild(icon);
    iconTexts.push(icon);

    // Count text
    const count = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'sans-serif', fontSize: fontSize(isMobile ? 7 : 8, layout),
        fill: 0xffffff, fontWeight: 'bold',
        dropShadow: { color: 0x000000, blur: 2, distance: 1 },
      }),
    });
    count.anchor.set(1, 1);
    count.x = x + slotSize - 3;
    count.y = y + slotSize - 2;
    container.addChild(count);
    countTexts.push(count);

    // Slot number hint (hide on mobile to save space)
    if (!isMobile) {
      const hint = new Text({
        text: `${i + 1}`,
        style: new TextStyle({
          fontFamily: 'sans-serif', fontSize: fontSize(7, layout),
          fill: 0x556677,
        }),
      });
      hint.x = x + 3;
      hint.y = y + 1;
      container.addChild(hint);
    }
  }

  uiContainer.addChild(container);

  function refresh(): void {
    const pm = PotionManager.shared;
    for (let i = 0; i < 3; i++) {
      const slot = pm.slots[i];
      const def = slot ? POTIONS[slot.potionID] : null;
      const { x, y } = positions[i];

      slotGraphics[i].clear();
      if (def && slot) {
        slotGraphics[i].roundRect(x, y, slotSize, slotSize, 6)
          .fill({ color: def.color, alpha: 0.15 })
          .stroke({ color: def.color, width: 1.5, alpha: 0.7 });
        iconTexts[i].text = def.icon;
        countTexts[i].text = `×${slot.count}`;
      } else {
        slotGraphics[i].roundRect(x, y, slotSize, slotSize, 6)
          .fill({ color: 0x0a0a1a, alpha: 0.8 })
          .stroke({ color: 0x334455, width: 1.5, alpha: 0.4 });
        iconTexts[i].text = '';
        countTexts[i].text = '';
      }
    }
  }

  refresh();
  return { container, refresh };
}
