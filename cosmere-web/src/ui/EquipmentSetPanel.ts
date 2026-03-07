import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { EquipmentSetManager } from '../game/EquipmentSets';
import type { EquipmentSetDef } from '../game/EquipmentSets';

// ─── Equipment Set Panel ────────────────────────────────────────

export function showEquipmentSetPanel(
  uiContainer: Container,
  screenW: number,
  screenH: number,
): Container {
  const overlay = new Container();
  overlay.zIndex = 9000;

  // Background overlay
  const bg = new Graphics();
  bg.rect(0, 0, screenW, screenH).fill({ color: 0x000000, alpha: 0.6 });
  bg.eventMode = 'static';
  overlay.addChild(bg);

  // Panel
  const panelW = Math.min(screenW - 20, 340);
  const panelH = Math.min(screenH - 40, 420);
  const px = (screenW - panelW) / 2;
  const py = (screenH - panelH) / 2;

  const panel = new Graphics();
  panel.roundRect(px, py, panelW, panelH, 10)
    .fill({ color: 0x0a0815, alpha: 0.95 })
    .stroke({ color: 0x445566, width: 2 });
  overlay.addChild(panel);

  // Title
  const title = new Text({
    text: '⚔ Ensembles d\'Équipement',
    style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 13, fontWeight: 'bold', fill: 0xddcc88 }),
  });
  title.x = px + 15;
  title.y = py + 10;
  overlay.addChild(title);

  // Close button
  const closeBtn = new Text({
    text: '✕',
    style: new TextStyle({ fontSize: 16, fill: 0xaaaaaa }),
  });
  closeBtn.x = px + panelW - 25;
  closeBtn.y = py + 8;
  closeBtn.eventMode = 'static';
  closeBtn.cursor = 'pointer';
  closeBtn.on('pointertap', () => {
    uiContainer.removeChild(overlay);
    overlay.destroy({ children: true });
  });
  overlay.addChild(closeBtn);

  // Scrollable content
  const contentMask = new Graphics();
  contentMask.rect(px + 5, py + 32, panelW - 10, panelH - 42).fill({ color: 0xffffff });
  overlay.addChild(contentMask);

  const content = new Container();
  content.mask = contentMask;
  overlay.addChild(content);

  const esm = EquipmentSetManager.shared;
  const allSets = esm.getAllSets();
  let yOff = py + 36;

  for (const setDef of allSets) {
    const piecesEquipped = esm.countEquippedPieces(setDef);
    const isActive = piecesEquipped >= 2;

    // Set card background
    const cardH = 70;
    const card = new Graphics();
    card.roundRect(px + 8, yOff, panelW - 16, cardH, 6)
      .fill({ color: isActive ? 0x151025 : 0x0c0c18, alpha: 0.9 })
      .stroke({ color: isActive ? setDef.color : 0x333344, width: 1, alpha: isActive ? 0.7 : 0.3 });
    content.addChild(card);

    // Icon
    const icon = new Text({
      text: setDef.icon,
      style: new TextStyle({ fontSize: 16 }),
    });
    icon.x = px + 16;
    icon.y = yOff + 6;
    content.addChild(icon);

    // Name
    const name = new Text({
      text: `${setDef.name} (${piecesEquipped}/${setDef.itemIDs.length})`,
      style: new TextStyle({
        fontFamily: 'Georgia, serif', fontSize: 9, fontWeight: 'bold',
        fill: isActive ? setDef.color : 0x888888,
      }),
    });
    name.x = px + 38;
    name.y = yOff + 4;
    content.addChild(name);

    // Description
    const desc = new Text({
      text: setDef.description,
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 6, fill: 0x777777 }),
    });
    desc.x = px + 38;
    desc.y = yOff + 16;
    content.addChild(desc);

    // Bonuses
    let bonusY = yOff + 28;
    for (const bonus of setDef.bonuses) {
      const isUnlocked = piecesEquipped >= bonus.piecesRequired;
      const statText = Object.entries(bonus.stats)
        .map(([k, v]) => `+${v} ${translateStat(k)}`)
        .join(', ');
      const bonusLabel = `${bonus.label}: ${statText}`;

      const bText = new Text({
        text: isUnlocked ? `✔ ${bonusLabel}` : `○ ${bonusLabel}`,
        style: new TextStyle({
          fontFamily: 'sans-serif', fontSize: 6,
          fill: isUnlocked ? setDef.color : 0x555555,
        }),
      });
      bText.x = px + 20;
      bText.y = bonusY;
      content.addChild(bText);

      if (bonus.special) {
        const specialText = new Text({
          text: `   ★ ${bonus.special}`,
          style: new TextStyle({
            fontFamily: 'sans-serif', fontSize: 5,
            fill: isUnlocked ? 0xddcc88 : 0x444444, fontStyle: 'italic',
          }),
        });
        specialText.x = px + 20;
        specialText.y = bonusY + 9;
        content.addChild(specialText);
        bonusY += 18;
      } else {
        bonusY += 11;
      }
    }

    yOff += cardH + 6;
  }

  // Drag scroll
  let dragging = false;
  let lastDragY = 0;
  const scrollHeight = yOff - (py + 36);
  const visibleHeight = panelH - 42;

  bg.on('pointerdown', (e) => { dragging = true; lastDragY = e.globalY; });
  bg.on('pointermove', (e) => {
    if (!dragging) return;
    const dy = e.globalY - lastDragY;
    lastDragY = e.globalY;
    content.y = Math.max(Math.min(0, content.y + dy), -(scrollHeight - visibleHeight));
  });
  bg.on('pointerup', () => { dragging = false; });
  bg.on('pointerupoutside', () => { dragging = false; });

  uiContainer.addChild(overlay);
  return overlay;
}

function translateStat(key: string): string {
  const MAP: Record<string, string> = {
    vigor: 'VIG', strength: 'FOR', spirit: 'ESP',
    agility: 'AGI', investiture: 'INV', luck: 'CHA',
  };
  return MAP[key] ?? key;
}
